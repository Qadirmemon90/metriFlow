import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyKey extends Document {
  tenantId: mongoose.Types.ObjectId;
  key: string;
  endpoint: string;
  payloadHash: string; // SHA-256 of request payload
  statusCode: number;
  responseBody: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    key: { type: String, required: true },
    endpoint: { type: String, required: true },
    payloadHash: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

IdempotencyKeySchema.index({ tenantId: 1, key: 1 }, { unique: true });
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey = mongoose.model<IIdempotencyKey>('IdempotencyKey', IdempotencyKeySchema);
