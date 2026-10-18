import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  sessionTokenHash: string; // SHA-256 of opaque random token
  userId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  membershipId: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionTokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    membershipId: { type: Schema.Types.ObjectId, ref: 'OrganizationMembership', required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup
SessionSchema.index({ tenantId: 1, userId: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
