import mongoose, { Document, Schema } from 'mongoose';
import { Role } from '@metriflow/contracts';

export interface IOrganizationMembership extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: Role;
  branchId?: mongoose.Types.ObjectId;
  warehouseId?: mongoose.Types.ObjectId;
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitationToken?: string;
  invitationExpires?: Date;
  invitedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    invitationStatus: { type: String, enum: ['PENDING', 'ACCEPTED', 'REVOKED'], default: 'ACCEPTED' },
    invitationToken: { type: String },
    invitationExpires: { type: Date },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

OrganizationMembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
OrganizationMembershipSchema.index({ tenantId: 1, role: 1 });
OrganizationMembershipSchema.index({ invitationToken: 1 }, { sparse: true });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>(
  'OrganizationMembership',
  OrganizationMembershipSchema
);
