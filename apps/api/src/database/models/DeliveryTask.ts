import mongoose, { Document, Schema } from 'mongoose';
import { DeliveryStatus } from '@metriflow/contracts';

export interface IDeliveryTask extends Document {
  tenantId: mongoose.Types.ObjectId;
  taskNumber: string;
  dispatchId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  assignedDriverId: mongoose.Types.ObjectId;
  status: DeliveryStatus;
  recipientName?: string;
  recipientPhone?: string;
  signatureImageId?: string;
  photoEvidenceId?: string;
  collectedAmountPaisa: number;
  collectionReceiptId?: mongoose.Types.ObjectId;
  failureReasonCode?: string;
  failureNotes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryTaskSchema = new Schema<IDeliveryTask>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    taskNumber: { type: String, required: true },
    dispatchId: { type: Schema.Types.ObjectId, ref: 'Dispatch', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    assignedDriverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.ASSIGNED },
    recipientName: { type: String },
    recipientPhone: { type: String },
    signatureImageId: { type: String },
    photoEvidenceId: { type: String },
    collectedAmountPaisa: { type: Number, default: 0 },
    collectionReceiptId: { type: Schema.Types.ObjectId, ref: 'PaymentCollection' },
    failureReasonCode: { type: String },
    failureNotes: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

DeliveryTaskSchema.index({ tenantId: 1, taskNumber: 1 }, { unique: true });
DeliveryTaskSchema.index({ tenantId: 1, assignedDriverId: 1, status: 1 });

export const DeliveryTask = mongoose.model<IDeliveryTask>('DeliveryTask', DeliveryTaskSchema);
