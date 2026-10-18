import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  tenantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    address: { type: String },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WarehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });
WarehouseSchema.index({ tenantId: 1, branchId: 1 });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
