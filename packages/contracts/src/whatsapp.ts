import { z } from 'zod';

export enum WhatsAppConnectionStatus {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DEGRADED = 'DEGRADED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  DISCONNECTED = 'DISCONNECTED',
}

export const WhatsAppExchangeCodeSchema = z.object({
  code: z.string().min(1),
  wabaId: z.string().min(1),
  phoneNumberId: z.string().min(1),
});
export type WhatsAppExchangeCodeInput = z.infer<typeof WhatsAppExchangeCodeSchema>;

export const SendWhatsAppMessageSchema = z.object({
  recipientPhone: z.string().min(8).max(20),
  messageType: z.enum(['text', 'template', 'image', 'document']),
  text: z.string().optional(),
  templateName: z.string().optional(),
  templateLanguage: z.string().default('en_US'),
  templateParameters: z.array(z.string()).optional(),
  mediaUrl: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type SendWhatsAppMessageInput = z.infer<typeof SendWhatsAppMessageSchema>;

export interface InboundWhatsAppMessageDto {
  id: string;
  senderPhone: string;
  senderName?: string;
  messageType: 'text' | 'audio' | 'image' | 'document' | 'other';
  body?: string;
  mediaId?: string;
  timestamp: string; // ISO
  hasAiDraft: boolean;
  orderDraftId?: string;
}
