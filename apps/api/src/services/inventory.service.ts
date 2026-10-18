import mongoose from 'mongoose';
import {
  StockBalance,
  StockMovement,
  Product,
  Supplier,
  JournalEntry,
  Warehouse,
} from '../database/models/index.js';
import {
  GoodsReceiptInput,
  StockAdjustmentInput,
  MovementType,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';
import { withTransaction } from '../database/connection.js';

export class InventoryService {
  /**
   * Goods Receipt (GRN):
   * - Increases onHand
   * - Recomputes Moving Weighted-Average Cost (WAC)
   * - Posts balanced Journal: Debit INVENTORY, Credit ACCOUNTS_PAYABLE
   * - Increases Supplier AP balance
   */
  async receiveGoods(
    tenantId: mongoose.Types.ObjectId,
    input: GoodsReceiptInput,
    actorId: string,
    existingSession?: mongoose.ClientSession
  ) {
    return withTransaction(async (session) => {
      const warehouse = await Warehouse.findOne({ _id: input.warehouseId, tenantId }).session(session);
      if (!warehouse) throw AppError.notFound('Warehouse not found.');

      const supplier = await Supplier.findOne({ _id: input.supplierId, tenantId }).session(session);
      if (!supplier) throw AppError.notFound('Supplier not found.');

      let totalReceiptPaisa = 0;
      const receiptNumber = `GRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      for (const item of input.items) {
        const product = await Product.findOne({ _id: item.productId, tenantId }).session(session);
        if (!product) throw AppError.notFound(`Product ${item.productId} not found.`);

        const qty = parseFloat(item.quantity);
        if (qty <= 0) throw AppError.badRequest('Received quantity must be greater than zero.');
        const unitCostPaisa = parseInt(item.unitCostPaisa, 10);
        const itemTotalCost = Math.round(qty * unitCostPaisa);
        totalReceiptPaisa += itemTotalCost;

        // Fetch or create StockBalance
        let balance = await StockBalance.findOne({
          tenantId,
          warehouseId: input.warehouseId,
          productId: product._id,
        }).session(session);

        if (!balance) {
          balance = new StockBalance({
            tenantId,
            warehouseId: input.warehouseId,
            productId: product._id,
            onHand: 0,
            reserved: 0,
            quarantined: 0,
            movingAverageCostPaisa: unitCostPaisa,
            totalValuePaisa: 0,
          });
        }

        const prevOnHand = balance.onHand;
        const newOnHand = prevOnHand + qty;
        const prevTotalValue = balance.totalValuePaisa;
        const newTotalValue = prevTotalValue + itemTotalCost;
        const newWac = newOnHand > 0 ? Math.round(newTotalValue / newOnHand) : unitCostPaisa;

        balance.onHand = newOnHand;
        balance.movingAverageCostPaisa = newWac;
        balance.totalValuePaisa = newTotalValue;
        balance.version += 1;
        await balance.save({ session });

        // Update product cost price cache
        product.costPricePaisa = newWac;
        await product.save({ session });

        // Immutable Stock Movement
        await StockMovement.create(
          [
            {
              tenantId,
              warehouseId: input.warehouseId,
              productId: product._id,
              movementType: MovementType.GOODS_RECEIPT,
              quantity: qty,
              previousOnHand: prevOnHand,
              newOnHand,
              unitCostPaisa,
              totalCostPaisa: itemTotalCost,
              referenceType: 'GOODS_RECEIPT',
              referenceId: receiptNumber,
              actorId: new mongoose.Types.ObjectId(actorId),
              reason: input.notes,
            },
          ],
          { session }
        );
      }

      // Update Supplier AP balance (positive = we owe supplier)
      supplier.currentBalancePaisa += totalReceiptPaisa;
      await supplier.save({ session });

      // Balanced Double-Entry Journal Entry
      const entryNumber = `JE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await JournalEntry.create(
        [
          {
            tenantId,
            entryNumber,
            referenceType: 'GRN',
            referenceId: receiptNumber,
            actorId: new mongoose.Types.ObjectId(actorId),
            notes: `Goods receipt from supplier ${supplier.name}`,
            lines: [
              {
                account: 'INVENTORY',
                debitPaisa: totalReceiptPaisa,
                creditPaisa: 0,
                description: `Inventory increase from ${receiptNumber}`,
              },
              {
                account: 'ACCOUNTS_PAYABLE',
                debitPaisa: 0,
                creditPaisa: totalReceiptPaisa,
                entityType: 'SUPPLIER',
                entityId: supplier._id,
                description: `Supplier liability for ${receiptNumber}`,
              },
            ],
          },
        ],
        { session }
      );

      return {
        receiptNumber,
        totalReceiptPaisa,
        message: 'Goods received successfully and ledger posted.',
      };
    }, existingSession);
  }

  /**
   * Controlled Stock Adjustment:
   * Validates physical invariants:
   * available = onHand - reserved - quarantined >= 0
   * reserved + quarantined <= onHand
   */
  async adjustStock(tenantId: mongoose.Types.ObjectId, input: StockAdjustmentInput, actorId: string) {
    return withTransaction(async (session) => {
      const balance = await StockBalance.findOne({
        tenantId,
        warehouseId: input.warehouseId,
        productId: input.productId,
      }).session(session);

      if (!balance) throw AppError.notFound('Stock record not found for this product in warehouse.');

      const qty = parseFloat(input.quantity);
      if (qty <= 0) throw AppError.badRequest('Quantity must be greater than zero.');

      const prevOnHand = balance.onHand;
      const prevReserved = balance.reserved;
      const prevQuarantined = balance.quarantined;
      let newOnHand = prevOnHand;
      let newReserved = prevReserved;
      let newQuarantined = prevQuarantined;
      let movementType: MovementType;

      if (input.type === 'INCREASE') {
        newOnHand += qty;
        movementType = MovementType.ADJUSTMENT_IN;
      } else if (input.type === 'DECREASE') {
        if (prevOnHand - prevReserved - prevQuarantined < qty) {
          throw AppError.badRequest(
            `Insufficient available stock to decrease by ${qty}. Available: ${prevOnHand - prevReserved - prevQuarantined}`
          );
        }
        newOnHand -= qty;
        movementType = MovementType.ADJUSTMENT_OUT;
      } else if (input.type === 'QUARANTINE') {
        if (prevOnHand - prevReserved - prevQuarantined < qty) {
          throw AppError.badRequest(
            `Insufficient available stock to move ${qty} to quarantine. Available: ${prevOnHand - prevReserved - prevQuarantined}`
          );
        }
        newQuarantined += qty;
        movementType = MovementType.QUARANTINE_HOLD;
      } else if (input.type === 'UNQUARANTINE') {
        if (prevQuarantined < qty) {
          throw AppError.badRequest(
            `Cannot release ${qty} from quarantine. Quarantined: ${prevQuarantined}`
          );
        }
        newQuarantined -= qty;
        movementType = MovementType.QUARANTINE_RELEASE;
      } else {
        throw AppError.badRequest('Invalid adjustment type.');
      }

      // Check invariant
      if (newReserved + newQuarantined > newOnHand || newOnHand < 0 || newReserved < 0 || newQuarantined < 0) {
        throw AppError.badRequest('Adjustment violates stock invariant (reserved + quarantined <= onHand).');
      }

      balance.onHand = newOnHand;
      balance.quarantined = newQuarantined;
      balance.totalValuePaisa = Math.round(newOnHand * balance.movingAverageCostPaisa);
      balance.version += 1;
      await balance.save({ session });

      const adjNumber = `ADJ-${Date.now()}`;
      await StockMovement.create(
        [
          {
            tenantId,
            warehouseId: input.warehouseId,
            productId: input.productId,
            movementType,
            quantity: input.type === 'DECREASE' ? -qty : qty,
            previousOnHand: prevOnHand,
            newOnHand,
            unitCostPaisa: balance.movingAverageCostPaisa,
            totalCostPaisa: Math.round(qty * balance.movingAverageCostPaisa),
            referenceType: 'ADJUSTMENT',
            referenceId: adjNumber,
            actorId: new mongoose.Types.ObjectId(actorId),
            reason: input.reason,
          },
        ],
        { session }
      );

      return {
        message: 'Stock adjusted successfully.',
        onHand: newOnHand,
        reserved: newReserved,
        quarantined: newQuarantined,
        available: newOnHand - newReserved - newQuarantined,
      };
    });
  }

  async getStockLevel(tenantId: mongoose.Types.ObjectId, warehouseId: string, productId: string) {
    const balance = await StockBalance.findOne({
      tenantId,
      warehouseId,
      productId,
    });

    if (!balance) {
      return {
        onHand: 0,
        reserved: 0,
        quarantined: 0,
        available: 0,
        movingAverageCostPaisa: 0,
      };
    }

    return {
      onHand: balance.onHand,
      reserved: balance.reserved,
      quarantined: balance.quarantined,
      available: balance.onHand - balance.reserved - balance.quarantined,
      movingAverageCostPaisa: balance.movingAverageCostPaisa,
    };
  }
}

export const inventoryService = new InventoryService();
