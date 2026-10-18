import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  tenantId: mongoose.Types.ObjectId;
  providerMessageId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  senderPhone: string;
  recipientPhone: string;
  messageType: 'text' | 'audio' | 'image' | 'document' | 'template' | 'other';
  body?: string;
  mediaStoragePath?: string;
  mediaMimeType?: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  errorMessage?: string;
  hasAiDraft: boolean;
  orderDraftId?: mongoose.Types.ObjectId;
  rawPayload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    providerMessageId: { type: String, required: true },
    direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
    senderPhone: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    messageType: { type: String, default: 'text' },
    body: { type: String },
    mediaStoragePath: { type: String },
    mediaMimeType: { type: String },
    status: { type: String, enum: ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'SENT' },
    errorMessage: { type: String },
    hasAiDraft: { type: Boolean, default: false },
    orderDraftId: { type: Schema.Types.ObjectId, ref: 'OrderDraft' },
    rawPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WhatsAppMessageSchema.index({ tenantId: 1, providerMessageId: 1 }, { unique: true });
WhatsAppMessageSchema.index({ tenantId: 1, senderPhone: 1, createdAt: -1 });

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
