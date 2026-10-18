import mongoose, { Document, Schema } from 'mongoose';

export interface IProductUnit {
  name: string;
  multiplier: number;
}

export interface IProduct extends Document {
  tenantId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  barcode?: string;
  category: string;
  baseUnit: string;
  secondaryUnits: IProductUnit[];
  defaultPricePaisa: number; // Stored as integer paisa (e.g. 15000)
  costPricePaisa: number;
  minStockAlert: number;
  taxRatePercent: number;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    baseUnit: { type: String, default: 'Piece' },
    secondaryUnits: [
      {
        name: { type: String, required: true },
        multiplier: { type: Number, required: true, default: 1 },
      },
    ],
    defaultPricePaisa: { type: Number, required: true, default: 0 },
    costPricePaisa: { type: Number, default: 0 },
    minStockAlert: { type: Number, default: 0 },
    taxRatePercent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1, name: 'text', category: 'text' });
ProductSchema.index({ tenantId: 1, isArchived: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
