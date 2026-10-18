import mongoose, { Document, Schema } from 'mongoose';

export interface IOutboxEvent extends Document {
  tenantId: mongoose.Types.ObjectId;
  eventType: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OutboxEventSchema = new Schema<IOutboxEvent>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING', index: true },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

OutboxEventSchema.index({ status: 1, createdAt: 1 });

export const OutboxEvent = mongoose.model<IOutboxEvent>('OutboxEvent', OutboxEventSchema);
