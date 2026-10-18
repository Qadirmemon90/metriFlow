import mongoose, { Document, Schema } from 'mongoose';
import { ExtractedDraftItem } from '@metriflow/contracts';

export interface IOrderDraft extends Document {
  tenantId: mongoose.Types.ObjectId;
  draftNumber: string;
  sourceType: 'WHATSAPP_TEXT' | 'WHATSAPP_VOICE' | 'MANUAL';
  sourceMessageId?: mongoose.Types.ObjectId;
  rawInputText?: string;
  audioStoragePath?: string;
  customerId?: mongoose.Types.ObjectId;
  customerPhone?: string;
  detectedCustomerName?: string;
  suggestedItems: ExtractedDraftItem[];
  ambiguities: string[];
  confidenceScore: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  convertedOrderId?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuggestedItemSchema = new Schema(
  {
    catalogProductId: { type: String },
    matchedSku: { type: String },
    productName: { type: String, required: true },
    quantity: { type: String, required: true },
    unit: { type: String, default: 'Piece' },
    confidence: { type: Number, default: 1 },
    ambiguityNote: { type: String },
  },
  { _id: false }
);

const OrderDraftSchema = new Schema<IOrderDraft>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    draftNumber: { type: String, required: true },
    sourceType: { type: String, enum: ['WHATSAPP_TEXT', 'WHATSAPP_VOICE', 'MANUAL'], required: true },
    sourceMessageId: { type: Schema.Types.ObjectId, ref: 'WhatsAppMessage' },
    rawInputText: { type: String },
    audioStoragePath: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerPhone: { type: String },
    detectedCustomerName: { type: String },
    suggestedItems: { type: [SuggestedItemSchema], default: [] },
    ambiguities: { type: [String], default: [] },
    confidenceScore: { type: Number, default: 1 },
    status: { type: String, enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'], default: 'PENDING_REVIEW' },
    convertedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

OrderDraftSchema.index({ tenantId: 1, draftNumber: 1 }, { unique: true });
OrderDraftSchema.index({ tenantId: 1, status: 1 });

export const OrderDraft = mongoose.model<IOrderDraft>('OrderDraft', OrderDraftSchema);
