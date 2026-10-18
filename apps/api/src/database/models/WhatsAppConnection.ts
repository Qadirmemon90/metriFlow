import mongoose, { Document, Schema } from 'mongoose';
import { WhatsAppConnectionStatus } from '@metriflow/contracts';

export interface IWhatsAppConnection extends Document {
  tenantId: mongoose.Types.ObjectId;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  status: WhatsAppConnectionStatus;
  accessTokenEncrypted: string;
  tokenExpiresAt?: Date;
  lastWebhookReceivedAt?: Date;
  qualityRating?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppConnectionSchema = new Schema<IWhatsAppConnection>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    wabaId: { type: String, required: true },
    phoneNumberId: { type: String, required: true },
    displayPhoneNumber: { type: String },
    verifiedName: { type: String },
    status: {
      type: String,
      enum: Object.values(WhatsAppConnectionStatus),
      default: WhatsAppConnectionStatus.NOT_CONFIGURED,
    },
    accessTokenEncrypted: { type: String, required: true },
    tokenExpiresAt: { type: Date },
    lastWebhookReceivedAt: { type: Date },
    qualityRating: { type: String },
  },
  { timestamps: true }
);

WhatsAppConnectionSchema.index({ phoneNumberId: 1 });
WhatsAppConnectionSchema.index({ wabaId: 1 });

export const WhatsAppConnection = mongoose.model<IWhatsAppConnection>(
  'WhatsAppConnection',
  WhatsAppConnectionSchema
);
