import mongoose, { Document, Schema } from 'mongoose';

export interface IStockBalance extends Document {
  tenantId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  onHand: number;       // Physical total stock
  reserved: number;     // Reserved for confirmed orders
  quarantined: number;  // Held in quarantine / damaged
  // available is virtual/computed: onHand - reserved - quarantined
  movingAverageCostPaisa: number; // Integer paisa (e.g. 10000 = PKR 100.00)
  totalValuePaisa: number;        // onHand * movingAverageCostPaisa
  version: number;
  updatedAt: Date;
}

const StockBalanceSchema = new Schema<IStockBalance>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    onHand: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, required: true, default: 0, min: 0 },
    quarantined: { type: Number, required: true, default: 0, min: 0 },
    movingAverageCostPaisa: { type: Number, required: true, default: 0, min: 0 },
    totalValuePaisa: { type: Number, required: true, default: 0, min: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

StockBalanceSchema.index({ tenantId: 1, warehouseId: 1, productId: 1 }, { unique: true });

export const StockBalance = mongoose.model<IStockBalance>('StockBalance', StockBalanceSchema);
