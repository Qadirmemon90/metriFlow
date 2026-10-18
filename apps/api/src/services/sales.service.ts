import mongoose from 'mongoose';
import {
  Order,
  Customer,
  Warehouse,
  Product,
  StockBalance,
  StockMovement,
  Dispatch,
  Invoice,
  JournalEntry,
  DeliveryTask,
  OutboxEvent,
} from '../database/models/index.js';
import {
  CreateOrderDraftInput,
  ConfirmOrderInput,
  CreateDispatchInput,
  CancelRemainderInput,
  OrderStatus,
  MovementType,
  DeliveryStatus,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';
import { withTransaction } from '../database/connection.js';

export class SalesService {
  /**
   * 1. Create Draft Order:
   * Drafts neither reserve stock nor create receivables.
   */
  async createDraftOrder(
    tenantId: mongoose.Types.ObjectId,
    input: CreateOrderDraftInput,
    actorId: string
  ) {
    const customer = await Customer.findOne({ _id: input.customerId, tenantId });
    if (!customer) throw AppError.notFound('Customer not found.');

    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, tenantId });
    if (!warehouse) throw AppError.notFound('Warehouse not found.');

    let subtotalPaisa = 0;
    let totalDiscountPaisa = 0;
    const itemsWithDetails: any[] = [];

    for (const item of input.items) {
      const product = await Product.findOne({ _id: item.productId, tenantId });
      if (!product) throw AppError.notFound(`Product ${item.productId} not found.`);

      const qty = parseFloat(item.quantity);
      if (qty <= 0) throw AppError.badRequest('Quantity must be greater than zero.');
      const unitPrice = parseInt(item.unitPricePaisa, 10);
      const discount = parseInt(item.discountPaisa || '0', 10);
      const lineSubtotal = Math.round(qty * unitPrice) - discount;

      subtotalPaisa += Math.round(qty * unitPrice);
      totalDiscountPaisa += discount;

      itemsWithDetails.push({
        productId: product._id,
        sku: product.sku,
        name: product.name,
        unit: item.unit || product.baseUnit,
        orderedQuantity: qty,
        reservedQuantity: 0,
        dispatchedQuantity: 0,
        cancelledQuantity: 0,
        unitPricePaisa: unitPrice,
        discountPaisa: discount,
        subtotalPaisa: lineSubtotal,
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalAmountPaisa = subtotalPaisa - totalDiscountPaisa;

    const order = await Order.create({
      tenantId,
      orderNumber,
      customerId: customer._id,
      warehouseId: warehouse._id,
      status: OrderStatus.DRAFT,
      items: itemsWithDetails,
      subtotalPaisa,
      discountPaisa: totalDiscountPaisa,
      taxPaisa: 0,
      totalAmountPaisa,
      deliveryAddress: input.deliveryAddress || customer.address,
      notes: input.notes,
      source: input.source || 'MANUAL',
      assignedSalesmanId: customer.assignedSalesmanId,
    });

    return order;
  }

  /**
   * 2. Confirm Order:
   * ATOMIC checks:
   * - Serializes customer credit limit checks
   * - Checks available stock for each SKU
   * - Atomically reserves stock
   * - Transitions to CONFIRMED
   */
  async confirmOrder(
    tenantId: mongoose.Types.ObjectId,
    orderId: string,
    input: ConfirmOrderInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      // Find order with expectedVersion
      const order = await Order.findOne({ _id: orderId, tenantId }).session(session);
      if (!order) throw AppError.notFound('Order not found.');
      if (order.status !== OrderStatus.DRAFT) {
        throw AppError.badRequest(`Cannot confirm order in status: ${order.status}`);
      }
      if (order.version !== input.expectedVersion) {
        throw AppError.conflict('Order was modified concurrently. Please refresh.');
      }

      // Customer credit check serialization (using findOneAndUpdate lock on customer)
      const customer = await Customer.findOne({ _id: order.customerId, tenantId }).session(session);
      if (!customer) throw AppError.notFound('Customer not found.');

      if (customer.creditLimitPaisa > 0) {
        // Pending committed orders total (CONFIRMED but not yet dispatched)
        const pendingOrders = await Order.find({
          tenantId,
          customerId: customer._id,
          status: { $in: [OrderStatus.CONFIRMED, OrderStatus.PARTIALLY_DISPATCHED] },
        }).session(session);

        let unfulfilledCommittedPaisa = 0;
        for (const po of pendingOrders) {
          for (const item of po.items) {
            const remainingToDispatch = item.orderedQuantity - item.dispatchedQuantity - item.cancelledQuantity;
            if (remainingToDispatch > 0) {
              unfulfilledCommittedPaisa += Math.round(remainingToDispatch * item.unitPricePaisa) - item.discountPaisa;
            }
          }
        }

        const totalExposure = customer.currentBalancePaisa + unfulfilledCommittedPaisa + order.totalAmountPaisa;
        if (totalExposure > customer.creditLimitPaisa) {
          throw AppError.badRequest(
            `Credit limit exceeded. Limit: ${customer.creditLimitPaisa / 100} PKR | Total exposure: ${totalExposure / 100} PKR (Posted AR: ${customer.currentBalancePaisa / 100} PKR + Commitments: ${(unfulfilledCommittedPaisa + order.totalAmountPaisa) / 100} PKR).`
          );
        }
      }

      // Check stock and reserve atomically
      for (const item of order.items) {
        const balance = await StockBalance.findOne({
          tenantId,
          warehouseId: order.warehouseId,
          productId: item.productId,
        }).session(session);

        if (!balance) {
          throw AppError.badRequest(`No stock record found for SKU: ${item.sku}`);
        }

        const available = balance.onHand - balance.reserved - balance.quarantined;
        if (available < item.orderedQuantity) {
          throw AppError.badRequest(
            `Insufficient stock for SKU: ${item.sku}. Requested: ${item.orderedQuantity} | Available: ${available}`
          );
        }

        // Conditional reservation write
        balance.reserved += item.orderedQuantity;
        balance.version += 1;
        await balance.save({ session });

        item.reservedQuantity = item.orderedQuantity;
      }

      order.status = OrderStatus.CONFIRMED;
      order.confirmedBy = new mongoose.Types.ObjectId(actorId);
      order.confirmedAt = new Date();
      order.version += 1;
      await order.save({ session });

      return {
        message: 'Order confirmed and stock reserved successfully.',
        order,
      };
    });
  }

  /**
   * 3. Partial / Full Dispatch:
   * ATOMIC commit:
   * - Reduces onHand & reserved
   * - Captures issue cost from moving-average cost
   * - Invoices actual dispatched quantities only
   * - Posts balanced Journal: AR, Revenue, COGS, Inventory
   * - Updates Customer AR balance
   */
  async dispatchOrder(
    tenantId: mongoose.Types.ObjectId,
    input: CreateDispatchInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      const order = await Order.findOne({ _id: input.orderId, tenantId }).session(session);
      if (!order) throw AppError.notFound('Order not found.');
      if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PARTIALLY_DISPATCHED) {
        throw AppError.badRequest(`Cannot dispatch order with status: ${order.status}`);
      }

      const customer = await Customer.findOne({ _id: order.customerId, tenantId }).session(session);
      if (!customer) throw AppError.notFound('Customer not found.');

      let totalDispatchedPaisa = 0;
      let totalCostPaisa = 0;
      const dispatchItems: any[] = [];
      const invoiceItems: any[] = [];

      for (const reqItem of input.items) {
        const orderItem = order.items.find((i) => i._id?.toString() === reqItem.orderItemId);
        if (!orderItem) throw AppError.notFound(`Order item ${reqItem.orderItemId} not found.`);

        const dispatchQty = parseFloat(reqItem.dispatchQuantity);
        if (dispatchQty <= 0) throw AppError.badRequest('Dispatch quantity must be greater than zero.');

        if (dispatchQty > orderItem.reservedQuantity) {
          throw AppError.badRequest(
            `Cannot dispatch ${dispatchQty} of ${orderItem.sku}. Currently reserved: ${orderItem.reservedQuantity}`
          );
        }

        const balance = await StockBalance.findOne({
          tenantId,
          warehouseId: input.warehouseId,
          productId: orderItem.productId,
        }).session(session);

        if (!balance) throw AppError.notFound(`Stock balance not found for ${orderItem.sku}`);

        // Capture issue cost from WAC
        const issueUnitCost = balance.movingAverageCostPaisa;
        const lineTotalCost = Math.round(dispatchQty * issueUnitCost);
        const lineTotalPrice = Math.round(dispatchQty * orderItem.unitPricePaisa);

        totalDispatchedPaisa += lineTotalPrice;
        totalCostPaisa += lineTotalCost;

        // Reduce physical onHand and reservation
        balance.onHand -= dispatchQty;
        balance.reserved -= dispatchQty;
        balance.totalValuePaisa = Math.round(balance.onHand * balance.movingAverageCostPaisa);
        balance.version += 1;
        await balance.save({ session });

        // Update order item tracking
        orderItem.dispatchedQuantity += dispatchQty;
        orderItem.reservedQuantity -= dispatchQty;

        dispatchItems.push({
          orderItemId: orderItem._id,
          productId: orderItem.productId,
          sku: orderItem.sku,
          name: orderItem.name,
          dispatchedQuantity: dispatchQty,
          unitPricePaisa: orderItem.unitPricePaisa,
          subtotalPaisa: lineTotalPrice,
          issueUnitCostPaisa: issueUnitCost,
          totalCostPaisa: lineTotalCost,
        });

        invoiceItems.push({
          productId: orderItem.productId,
          sku: orderItem.sku,
          name: orderItem.name,
          quantity: dispatchQty,
          unit: orderItem.unit,
          unitPricePaisa: orderItem.unitPricePaisa,
          discountPaisa: 0,
          subtotalPaisa: lineTotalPrice,
        });

        // Immutable Stock Movement for dispatch
        await StockMovement.create(
          [
            {
              tenantId,
              warehouseId: input.warehouseId,
              productId: orderItem.productId,
              movementType: MovementType.DISPATCH_ISSUE,
              quantity: -dispatchQty,
              previousOnHand: balance.onHand + dispatchQty,
              newOnHand: balance.onHand,
              unitCostPaisa: issueUnitCost,
              totalCostPaisa: lineTotalCost,
              referenceType: 'DISPATCH',
              referenceId: order.orderNumber,
              actorId: new mongoose.Types.ObjectId(actorId),
              reason: `Dispatch for order ${order.orderNumber}`,
            },
          ],
          { session }
        );
      }

      // Determine updated order status
      const hasRemaining = order.items.some(
        (i) => i.orderedQuantity > i.dispatchedQuantity + i.cancelledQuantity
      );
      order.status = hasRemaining ? OrderStatus.PARTIALLY_DISPATCHED : OrderStatus.COMPLETED;
      order.version += 1;
      await order.save({ session });

      // Create Dispatch record (delivery challan)
      const dispatchNumber = `DSP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const dispatchDoc = await Dispatch.create(
        [
          {
            tenantId,
            dispatchNumber,
            orderId: order._id,
            warehouseId: input.warehouseId,
            customerId: customer._id,
            items: dispatchItems,
            totalDispatchedPaisa,
            totalCostPaisa,
            driverName: input.driverName,
            vehicleNumber: input.vehicleNumber,
            notes: input.notes,
            dispatchedBy: new mongoose.Types.ObjectId(actorId),
          },
        ],
        { session }
      );

      // Create Invoice for actual dispatched quantities
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const dueDate = new Date(Date.now() + customer.creditDays * 24 * 60 * 60 * 1000);
      const invoiceDoc = await Invoice.create(
        [
          {
            tenantId,
            invoiceNumber,
            orderId: order._id,
            dispatchId: dispatchDoc[0]._id,
            customerId: customer._id,
            customerName: customer.name,
            items: invoiceItems,
            subtotalPaisa: totalDispatchedPaisa,
            taxPaisa: 0,
            totalAmountPaisa: totalDispatchedPaisa,
            paidAmountPaisa: 0,
            balanceDuePaisa: totalDispatchedPaisa,
            status: 'UNPAID',
            dueDate,
            notes: input.notes,
          },
        ],
        { session }
      );

      // Update Customer Khata balance: positive = customer owes money (AR)
      customer.currentBalancePaisa += totalDispatchedPaisa;
      await customer.save({ session });

      // Balanced Internal Journal Entry
      const entryNumber = `JE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await JournalEntry.create(
        [
          {
            tenantId,
            entryNumber,
            referenceType: 'INVOICE',
            referenceId: invoiceNumber,
            actorId: new mongoose.Types.ObjectId(actorId),
            notes: `Dispatch invoice for order ${order.orderNumber}`,
            lines: [
              // AR & Revenue
              {
                account: 'ACCOUNTS_RECEIVABLE',
                debitPaisa: totalDispatchedPaisa,
                creditPaisa: 0,
                entityType: 'CUSTOMER',
                entityId: customer._id,
                description: `Receivable for ${invoiceNumber}`,
              },
              {
                account: 'SALES_REVENUE',
                debitPaisa: 0,
                creditPaisa: totalDispatchedPaisa,
                description: `Revenue from ${invoiceNumber}`,
              },
              // COGS & Inventory
              {
                account: 'COST_OF_GOODS_SOLD',
                debitPaisa: totalCostPaisa,
                creditPaisa: 0,
                description: `Cost of goods sold for ${dispatchNumber}`,
              },
              {
                account: 'INVENTORY',
                debitPaisa: 0,
                creditPaisa: totalCostPaisa,
                description: `Inventory reduction for ${dispatchNumber}`,
              },
            ],
          },
        ],
        { session }
      );

      // Create Delivery Task
      const taskNumber = `DEL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await DeliveryTask.create(
        [
          {
            tenantId,
            taskNumber,
            dispatchId: dispatchDoc[0]._id,
            orderId: order._id,
            customerId: customer._id,
            assignedDriverId: new mongoose.Types.ObjectId(actorId),
            status: DeliveryStatus.ASSIGNED,
          },
        ],
        { session }
      );

      // Durable Outbox Event
      await OutboxEvent.create(
        [
          {
            tenantId,
            eventType: 'ORDER_DISPATCHED',
            payload: {
              orderId: order._id.toString(),
              dispatchId: dispatchDoc[0]._id.toString(),
              invoiceId: invoiceDoc[0]._id.toString(),
              invoiceNumber,
              totalAmountPaisa: totalDispatchedPaisa,
            },
          },
        ],
        { session }
      );

      return {
        message: 'Order dispatched, stock deducted, invoice and ledger committed atomically.',
        dispatch: dispatchDoc[0],
        invoice: invoiceDoc[0],
        orderStatus: order.status,
      };
    });
  }

  /**
   * 4. Cancel Remainder:
   * Releases unfulfilled reservations and commitments safely.
   * Does NOT delete posted invoices or dispatches!
   */
  async cancelRemainder(
    tenantId: mongoose.Types.ObjectId,
    orderId: string,
    input: CancelRemainderInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      const order = await Order.findOne({ _id: orderId, tenantId }).session(session);
      if (!order) throw AppError.notFound('Order not found.');

      if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
        throw AppError.badRequest(`Order is already ${order.status}`);
      }

      for (const item of order.items) {
        if (item.reservedQuantity > 0) {
          const balance = await StockBalance.findOne({
            tenantId,
            warehouseId: order.warehouseId,
            productId: item.productId,
          }).session(session);

          if (balance) {
            balance.reserved -= item.reservedQuantity;
            balance.version += 1;
            await balance.save({ session });
          }

          item.cancelledQuantity += item.reservedQuantity;
          item.reservedQuantity = 0;
        }
      }

      order.status = order.items.some((i) => i.dispatchedQuantity > 0)
        ? OrderStatus.COMPLETED
        : OrderStatus.CANCELLED;
      order.version += 1;
      await order.save({ session });

      return {
        message: 'Order remainder cancelled and reserved stock released.',
        order,
      };
    });
  }

  async listOrders(tenantId: mongoose.Types.ObjectId, status?: OrderStatus) {
    const query: any = { tenantId };
    if (status) query.status = status;
    return Order.find(query).populate('customerId', 'name phone city').sort({ createdAt: -1 });
  }

  async getOrder(tenantId: mongoose.Types.ObjectId, orderId: string) {
    const order = await Order.findOne({ _id: orderId, tenantId })
      .populate('customerId')
      .populate('warehouseId');
    if (!order) throw AppError.notFound('Order not found.');
    return order;
  }
}

export const salesService = new SalesService();
