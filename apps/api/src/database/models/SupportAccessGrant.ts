import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportAccessGrant extends Document {
  tenantId: mongoose.Types.ObjectId;
  superAdminId: mongoose.Types.ObjectId;
  reason: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const SupportAccessGrantSchema = new Schema<ISupportAccessGrant>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    superAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SupportAccessGrantSchema.index({ tenantId: 1, expiresAt: 1 });

export const SupportAccessGrant = mongoose.model<ISupportAccessGrant>(
  'SupportAccessGrant',
  SupportAccessGrantSchema
);

export interface IContactInquiry extends Document {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  city: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  createdAt: Date;
}

const ContactInquirySchema = new Schema<IContactInquiry>(
  {
    fullName: { type: String, required: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'], default: 'NEW' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ContactInquiry = mongoose.model<IContactInquiry>('ContactInquiry', ContactInquirySchema);
