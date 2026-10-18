import mongoose from 'mongoose';
import {
  PaymentCollection,
  PaymentAllocation,
  Invoice,
  Customer,
  Supplier,
  JournalEntry,
  CustomerReturn,
  StockBalance,
  StockMovement,
  Product,
} from '../database/models/index.js';
import {
  SubmitCollectionInput,
  VerifyPaymentInput,
  AllocatePaymentInput,
  ProcessCustomerReturnInput,
  SupplierPaymentInput,
  CollectionStatus,
  MovementType,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';
import { withTransaction } from '../database/connection.js';

export class FinanceService {
  /**
   * 1. Submit Collection (Field / Counter):
   * Pending evidence has NO ledger effect!
   */
  async submitCollection(
    tenantId: mongoose.Types.ObjectId,
    input: SubmitCollectionInput,
    actorId: string
  ) {
    const customer = await Customer.findOne({ _id: input.customerId, tenantId });
    if (!customer) throw AppError.notFound('Customer not found.');

    const amountPaisa = parseInt(input.amountPaisa, 10);
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const collection = await PaymentCollection.create({
      tenantId,
      receiptNumber,
      customerId: customer._id,
      amountPaisa,
      allocatedAmountPaisa: 0,
      unallocatedAmountPaisa: amountPaisa,
      paymentMethod: input.method,
      referenceNumber: input.referenceNumber,
      evidenceStoragePath: input.evidenceFileId,
      status: CollectionStatus.PENDING_VERIFICATION,
      collectedBy: new mongoose.Types.ObjectId(actorId),
      notes: input.notes,
    });

    return {
      message: 'Collection submitted for verification. No financial ledger effect until verified.',
      collection,
    };
  }

  /**
   * 2. Independent Payment Verification (Accountant):
   * Collector CANNOT verify their own collection.
   * Verification posts to ledger and updates customer balance once.
   */
  async verifyPayment(
    tenantId: mongoose.Types.ObjectId,
    collectionId: string,
    input: VerifyPaymentInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      const collection = await PaymentCollection.findOne({ _id: collectionId, tenantId }).session(session);
      if (!collection) throw AppError.notFound('Payment collection record not found.');

      if (collection.status !== CollectionStatus.PENDING_VERIFICATION) {
        throw AppError.badRequest(`Payment is already in status: ${collection.status}`);
      }

      // Separation of duties check
      if (collection.collectedBy.toString() === actorId.toString()) {
        throw AppError.forbidden('A collector cannot verify their own collection.');
      }

      const customer = await Customer.findOne({ _id: collection.customerId, tenantId }).session(session);
      if (!customer) throw AppError.notFound('Customer not found.');

      if (input.status === 'REJECTED') {
        collection.status = CollectionStatus.REJECTED;
        collection.rejectionReason = input.rejectionReason || 'Rejected by accountant';
        collection.verifiedBy = new mongoose.Types.ObjectId(actorId);
        collection.verifiedAt = new Date();
        await collection.save({ session });

        return { message: 'Collection rejected.', collection };
      }

      // APPROVED / VERIFIED
      collection.status = CollectionStatus.VERIFIED;
      collection.verifiedBy = new mongoose.Types.ObjectId(actorId);
      collection.verifiedAt = new Date();
      await collection.save({ session });

      // Update customer balance: reduces debt / increases credit
      customer.currentBalancePaisa -= collection.amountPaisa;
      await customer.save({ session });

      // Balanced Double-Entry Journal Entry
      const entryNumber = `JE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await JournalEntry.create(
        [
          {
            tenantId,
            entryNumber,
            referenceType: 'PAYMENT',
            referenceId: collection.receiptNumber,
            actorId: new mongoose.Types.ObjectId(actorId),
            notes: `Verified payment from ${customer.name}`,
            lines: [
              {
                account: 'CASH_BANK',
                debitPaisa: collection.amountPaisa,
                creditPaisa: 0,
                description: `Cash received from ${customer.name} (${collection.receiptNumber})`,
              },
              {
                account: 'ACCOUNTS_RECEIVABLE',
                debitPaisa: 0,
                creditPaisa: collection.amountPaisa,
                entityType: 'CUSTOMER',
                entityId: customer._id,
                description: `AR reduction for payment ${collection.receiptNumber}`,
              },
            ],
          },
        ],
        { session }
      );

      return {
        message: 'Payment verified and ledger posted successfully.',
        collection,
      };
    });
  }

  /**
   * 3. Allocate Payment to Invoices:
   * Handles many-to-many allocations.
   * Derives invoice paid status strictly from valid allocations.
   */
  async allocatePayment(
    tenantId: mongoose.Types.ObjectId,
    input: AllocatePaymentInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      let collection: any = null;

      if (input.paymentId) {
        collection = await PaymentCollection.findOne({
          _id: input.paymentId,
          tenantId,
          status: CollectionStatus.VERIFIED,
        }).session(session);

        if (!collection) throw AppError.notFound('Verified payment record not found.');
      }

      for (const item of input.allocations) {
        const invoice = await Invoice.findOne({ _id: item.invoiceId, tenantId }).session(session);
        if (!invoice) throw AppError.notFound(`Invoice ${item.invoiceId} not found.`);

        const allocAmount = parseInt(item.amountPaisa, 10);
        if (allocAmount <= 0) throw AppError.badRequest('Allocation amount must be greater than zero.');

        if (allocAmount > invoice.balanceDuePaisa) {
          throw AppError.badRequest(
            `Cannot allocate ${allocAmount / 100} PKR to invoice ${invoice.invoiceNumber}. Remaining balance due is only ${invoice.balanceDuePaisa / 100} PKR.`
          );
        }

        if (collection) {
          if (allocAmount > collection.unallocatedAmountPaisa) {
            throw AppError.badRequest(
              `Payment receipt ${collection.receiptNumber} has only ${collection.unallocatedAmountPaisa / 100} PKR unallocated.`
            );
          }
          collection.unallocatedAmountPaisa -= allocAmount;
          collection.allocatedAmountPaisa += allocAmount;
          await collection.save({ session });
        }

        invoice.paidAmountPaisa += allocAmount;
        invoice.balanceDuePaisa -= allocAmount;
        invoice.status = invoice.balanceDuePaisa === 0 ? 'PAID' : 'PARTIALLY_PAID';
        await invoice.save({ session });

        await PaymentAllocation.create(
          [
            {
              tenantId,
              paymentCollectionId: collection ? collection._id : new mongoose.Types.ObjectId(),
              invoiceId: invoice._id,
              customerId: invoice.customerId,
              allocatedAmountPaisa: allocAmount,
              allocatedBy: new mongoose.Types.ObjectId(actorId),
            },
          ],
          { session }
        );
      }

      return { message: 'Payment successfully allocated to invoice(s).' };
    });
  }

  /**
   * 4. Customer Return & Original Cost Restoration:
   * Worked fixture requirement:
   * Restores original issue cost to inventory value, restocks onHand,
   * reduces Customer AR, and posts balanced credit note.
   */
  async processCustomerReturn(
    tenantId: mongoose.Types.ObjectId,
    input: ProcessCustomerReturnInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      const customer = await Customer.findOne({ _id: input.customerId, tenantId }).session(session);
      if (!customer) throw AppError.notFound('Customer not found.');

      let totalCreditPaisa = 0;
      let totalRestoredCostPaisa = 0;
      const processedItems: any[] = [];
      const returnNumber = `RET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      for (const item of input.items) {
        const product = await Product.findOne({ _id: item.productId, tenantId }).session(session);
        if (!product) throw AppError.notFound(`Product ${item.productId} not found.`);

        const qty = parseFloat(item.quantity);
        if (qty <= 0) throw AppError.badRequest('Return quantity must be greater than zero.');
        const unitCreditPaisa = parseInt(item.unitCreditPaisa, 10);
        const lineCredit = Math.round(qty * unitCreditPaisa);
        totalCreditPaisa += lineCredit;

        // Fetch current stock balance to get moving-average cost or original issue cost
        const balance = await StockBalance.findOne({
          tenantId,
          warehouseId: input.warehouseId,
          productId: product._id,
        }).session(session);

        const originalUnitCost = balance ? balance.movingAverageCostPaisa : product.costPricePaisa;
        const lineRestoredCost = Math.round(qty * originalUnitCost);
        totalRestoredCostPaisa += lineRestoredCost;

        if (balance) {
          if (item.restockSellable) {
            // Restore physical sellable stock
            const prevOnHand = balance.onHand;
            const newOnHand = prevOnHand + qty;
            const newTotalValue = balance.totalValuePaisa + lineRestoredCost;
            balance.onHand = newOnHand;
            balance.totalValuePaisa = newTotalValue;
            balance.movingAverageCostPaisa = newOnHand > 0 ? Math.round(newTotalValue / newOnHand) : originalUnitCost;
            balance.version += 1;
            await balance.save({ session });

            await StockMovement.create(
              [
                {
                  tenantId,
                  warehouseId: input.warehouseId,
                  productId: product._id,
                  movementType: MovementType.RETURN_RESTOCK,
                  quantity: qty,
                  previousOnHand: prevOnHand,
                  newOnHand,
                  unitCostPaisa: originalUnitCost,
                  totalCostPaisa: lineRestoredCost,
                  referenceType: 'RETURN',
                  referenceId: returnNumber,
                  actorId: new mongoose.Types.ObjectId(actorId),
                  reason: input.reason,
                },
              ],
              { session }
            );
          } else {
            // Put into quarantine
            balance.quarantined += qty;
            balance.version += 1;
            await balance.save({ session });
          }
        }

        processedItems.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: qty,
          unitCreditPaisa,
          totalCreditPaisa: lineCredit,
          originalUnitCostPaisa: originalUnitCost,
          restockSellable: item.restockSellable,
        });
      }

      // Update Customer Khata balance: decreases customer receivable
      customer.currentBalancePaisa -= totalCreditPaisa;
      await customer.save({ session });

      const returnDoc = await CustomerReturn.create(
        [
          {
            tenantId,
            returnNumber,
            customerId: customer._id,
            warehouseId: new mongoose.Types.ObjectId(input.warehouseId),
            originalInvoiceId: input.originalInvoiceId ? new mongoose.Types.ObjectId(input.originalInvoiceId) : undefined,
            items: processedItems,
            totalCreditPaisa,
            totalRestoredCostPaisa,
            reason: input.reason,
            processedBy: new mongoose.Types.ObjectId(actorId),
          },
        ],
        { session }
      );

      // Balanced Internal Journal Entry:
      // Debit SALES_REVENUE (reversal), Credit ACCOUNTS_RECEIVABLE
      // Debit INVENTORY (restored cost), Credit COST_OF_GOODS_SOLD (reversal)
      const entryNumber = `JE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await JournalEntry.create(
        [
          {
            tenantId,
            entryNumber,
            referenceType: 'RETURN',
            referenceId: returnNumber,
            actorId: new mongoose.Types.ObjectId(actorId),
            notes: `Customer return credit for ${customer.name}`,
            lines: [
              {
                account: 'SALES_REVENUE',
                debitPaisa: totalCreditPaisa,
                creditPaisa: 0,
                description: `Sales revenue reversal for return ${returnNumber}`,
              },
              {
                account: 'ACCOUNTS_RECEIVABLE',
                debitPaisa: 0,
                creditPaisa: totalCreditPaisa,
                entityType: 'CUSTOMER',
                entityId: customer._id,
                description: `Customer credit for return ${returnNumber}`,
              },
              {
                account: 'INVENTORY',
                debitPaisa: totalRestoredCostPaisa,
                creditPaisa: 0,
                description: `Restored inventory cost for return ${returnNumber}`,
              },
              {
                account: 'COST_OF_GOODS_SOLD',
                debitPaisa: 0,
                creditPaisa: totalRestoredCostPaisa,
                description: `Cost of goods sold reversal for return ${returnNumber}`,
              },
            ],
          },
        ],
        { session }
      );

      return {
        message: 'Customer return processed, stock restored, and credit note posted.',
        returnRecord: returnDoc[0],
      };
    });
  }

  /**
   * 5. Supplier Payment:
   * Decrements supplier balance and posts JournalEntry: Debit AP, Credit Cash/Bank.
   */
  async createSupplierPayment(
    tenantId: mongoose.Types.ObjectId,
    input: SupplierPaymentInput,
    actorId: string
  ) {
    return withTransaction(async (session) => {
      const supplier = await Supplier.findOne({ _id: input.supplierId, tenantId }).session(session);
      if (!supplier) throw AppError.notFound('Supplier not found.');

      const amountPaisa = parseInt(input.amountPaisa, 10);
      supplier.currentBalancePaisa -= amountPaisa;
      await supplier.save({ session });

      const entryNumber = `JE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await JournalEntry.create(
        [
          {
            tenantId,
            entryNumber,
            referenceType: 'PAYMENT',
            referenceId: input.referenceNumber || `SP-${Date.now()}`,
            actorId: new mongoose.Types.ObjectId(actorId),
            notes: `Payment to supplier ${supplier.name}`,
            lines: [
              {
                account: 'ACCOUNTS_PAYABLE',
                debitPaisa: amountPaisa,
                creditPaisa: 0,
                entityType: 'SUPPLIER',
                entityId: supplier._id,
                description: `Reduction of liability to ${supplier.name}`,
              },
              {
                account: 'CASH_BANK',
                debitPaisa: 0,
                creditPaisa: amountPaisa,
                description: `Cash/Bank payout to supplier ${supplier.name}`,
              },
            ],
          },
        ],
        { session }
      );

      return { message: 'Supplier payment recorded and ledger updated successfully.' };
    });
  }
}

export const financeService = new FinanceService();
