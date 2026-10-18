import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId?: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  traceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    traceId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
