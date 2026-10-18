import mongoose, { Document, Schema } from 'mongoose';
import { PlanTier } from '@metriflow/contracts';

export interface IPlanSubscription extends Document {
  tenantId: mongoose.Types.ObjectId;
  planTier: PlanTier;
  amountPaisa: number;
  bankReferenceId: string;
  proofDocumentId?: string;
  notes?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSubscriptionSchema = new Schema<IPlanSubscription>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    planTier: { type: String, enum: Object.values(PlanTier), required: true },
    amountPaisa: { type: Number, required: true },
    bankReferenceId: { type: String, required: true },
    proofDocumentId: { type: String },
    notes: { type: String },
    status: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'PENDING_APPROVAL' },
    rejectionReason: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

PlanSubscriptionSchema.index({ tenantId: 1, status: 1 });

export const PlanSubscription = mongoose.model<IPlanSubscription>('PlanSubscription', PlanSubscriptionSchema);
