import mongoose, { Document, Schema } from 'mongoose';
import { PaymentMethod, CollectionStatus } from '@metriflow/contracts';

export interface IPaymentCollection extends Document {
  tenantId: mongoose.Types.ObjectId;
  receiptNumber: string;
  customerId: mongoose.Types.ObjectId;
  amountPaisa: number;
  allocatedAmountPaisa: number;
  unallocatedAmountPaisa: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  evidenceStoragePath?: string;
  status: CollectionStatus;
  collectedBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentCollectionSchema = new Schema<IPaymentCollection>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    receiptNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amountPaisa: { type: Number, required: true, min: 1 },
    allocatedAmountPaisa: { type: Number, default: 0 },
    unallocatedAmountPaisa: { type: Number, required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    referenceNumber: { type: String },
    evidenceStoragePath: { type: String },
    status: {
      type: String,
      enum: Object.values(CollectionStatus),
      default: CollectionStatus.PENDING_VERIFICATION,
    },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentCollectionSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });
PaymentCollectionSchema.index({ tenantId: 1, customerId: 1, status: 1 });

export const PaymentCollection = mongoose.model<IPaymentCollection>('PaymentCollection', PaymentCollectionSchema);
