import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  city: string;
  area?: string;
  creditLimitPaisa: number;
  creditDays: number;
  currentBalancePaisa: number; // positive = owes money (AR), negative = customer credit
  assignedSalesmanId?: mongoose.Types.ObjectId;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    city: { type: String, required: true, trim: true },
    area: { type: String },
    creditLimitPaisa: { type: Number, default: 0 },
    creditDays: { type: Number, default: 0 },
    currentBalancePaisa: { type: Number, default: 0 },
    assignedSalesmanId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CustomerSchema.index({ tenantId: 1, phone: 1 });
CustomerSchema.index({ tenantId: 1, name: 'text', city: 'text' });
CustomerSchema.index({ tenantId: 1, assignedSalesmanId: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
