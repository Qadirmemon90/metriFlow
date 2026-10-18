import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerReturnItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unitCreditPaisa: number;
  totalCreditPaisa: number;
  originalUnitCostPaisa: number; // Restores original issue cost to inventory
  restockSellable: boolean;      // true -> onHand, false -> quarantined
}

export interface ICustomerReturn extends Document {
  tenantId: mongoose.Types.ObjectId;
  returnNumber: string;
  customerId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  originalInvoiceId?: mongoose.Types.ObjectId;
  items: ICustomerReturnItem[];
  totalCreditPaisa: number;
  totalRestoredCostPaisa: number;
  reason: string;
  processedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerReturnSchema = new Schema<ICustomerReturn>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    returnNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    originalInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitCreditPaisa: { type: Number, required: true },
        totalCreditPaisa: { type: Number, required: true },
        originalUnitCostPaisa: { type: Number, required: true },
        restockSellable: { type: Boolean, default: true },
      },
    ],
    totalCreditPaisa: { type: Number, required: true },
    totalRestoredCostPaisa: { type: Number, required: true },
    reason: { type: String, required: true },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CustomerReturnSchema.index({ tenantId: 1, returnNumber: 1 }, { unique: true });
CustomerReturnSchema.index({ tenantId: 1, customerId: 1 });

export const CustomerReturn = mongoose.model<ICustomerReturn>('CustomerReturn', CustomerReturnSchema);
