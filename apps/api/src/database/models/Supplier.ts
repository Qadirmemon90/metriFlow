import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  paymentTermsDays: number;
  currentBalancePaisa: number; // positive = we owe supplier (AP)
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    city: { type: String, required: true, trim: true },
    paymentTermsDays: { type: Number, default: 0 },
    currentBalancePaisa: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SupplierSchema.index({ tenantId: 1, phone: 1 });
SupplierSchema.index({ tenantId: 1, name: 'text' });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
