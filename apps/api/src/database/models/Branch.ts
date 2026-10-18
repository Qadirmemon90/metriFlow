import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  city: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    address: { type: String },
    city: { type: String, required: true, trim: true },
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BranchSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
