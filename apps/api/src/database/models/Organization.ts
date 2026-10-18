import mongoose, { Document, Schema } from 'mongoose';
import { PlanTier, SubscriptionStatus } from '@metriflow/contracts';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date;
  subscriptionEndsAt?: Date;
  maxUsers: number;
  maxWarehouses: number;
  whatsappEnabled: boolean;
  aiCreditsRemaining: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    planTier: { type: String, enum: Object.values(PlanTier), default: PlanTier.STARTER },
    subscriptionStatus: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.TRIAL },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    subscriptionEndsAt: { type: Date },
    maxUsers: { type: Number, default: 2 },
    maxWarehouses: { type: Number, default: 1 },
    whatsappEnabled: { type: Boolean, default: false },
    aiCreditsRemaining: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
