import mongoose, { Document, Schema } from 'mongoose';
import { MovementType } from '@metriflow/contracts';

export interface IStockMovement extends Document {
  tenantId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  movementType: MovementType;
  quantity: number; // positive for additions, negative for reductions
  previousOnHand: number;
  newOnHand: number;
  unitCostPaisa: number;
  totalCostPaisa: number;
  referenceType: 'GOODS_RECEIPT' | 'DISPATCH' | 'ADJUSTMENT' | 'RETURN' | 'OPENING';
  referenceId: string;
  actorId: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    movementType: { type: String, enum: Object.values(MovementType), required: true },
    quantity: { type: Number, required: true },
    previousOnHand: { type: Number, required: true },
    newOnHand: { type: Number, required: true },
    unitCostPaisa: { type: Number, required: true },
    totalCostPaisa: { type: Number, required: true },
    referenceType: { type: String, required: true },
    referenceId: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ tenantId: 1, warehouseId: 1, productId: 1, createdAt: -1 });
StockMovementSchema.index({ tenantId: 1, referenceType: 1, referenceId: 1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
