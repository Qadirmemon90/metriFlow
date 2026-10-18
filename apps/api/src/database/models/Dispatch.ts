import mongoose, { Document, Schema } from 'mongoose';

export interface IDispatchItem {
  orderItemId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  dispatchedQuantity: number;
  unitPricePaisa: number;
  subtotalPaisa: number;
  issueUnitCostPaisa: number; // Captured from moving-average cost at dispatch time
  totalCostPaisa: number;
}

export interface IDispatch extends Document {
  tenantId: mongoose.Types.ObjectId;
  dispatchNumber: string;
  orderId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  items: IDispatchItem[];
  totalDispatchedPaisa: number;
  totalCostPaisa: number;
  driverName?: string;
  vehicleNumber?: string;
  notes?: string;
  challanPdfPath?: string;
  dispatchedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DispatchSchema = new Schema<IDispatch>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    dispatchNumber: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [
      {
        orderItemId: { type: Schema.Types.ObjectId, required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        dispatchedQuantity: { type: Number, required: true, min: 1 },
        unitPricePaisa: { type: Number, required: true },
        subtotalPaisa: { type: Number, required: true },
        issueUnitCostPaisa: { type: Number, required: true },
        totalCostPaisa: { type: Number, required: true },
      },
    ],
    totalDispatchedPaisa: { type: Number, required: true },
    totalCostPaisa: { type: Number, required: true },
    driverName: { type: String },
    vehicleNumber: { type: String },
    notes: { type: String },
    challanPdfPath: { type: String },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

DispatchSchema.index({ tenantId: 1, dispatchNumber: 1 }, { unique: true });
DispatchSchema.index({ tenantId: 1, orderId: 1 });

export const Dispatch = mongoose.model<IDispatch>('Dispatch', DispatchSchema);
