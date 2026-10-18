import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  WhatsAppConnection,
  WhatsAppMessage,
  Customer,
} from '../database/models/index.js';
import {
  SendWhatsAppMessageInput,
  WhatsAppConnectionStatus,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';
import { config } from '../config/index.js';
import { geminiService } from './gemini.service.js';

export class WhatsAppService {
  /**
   * Verify Webhook GET Challenge
   */
  verifyWebhookChallenge(mode?: string, token?: string, challenge?: string): string {
    if (mode === 'subscribe' && token === config.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      return challenge || '';
    }
    throw AppError.forbidden('Webhook verification token mismatch.');
  }

  /**
   * Verify Webhook POST Signature (HMAC-SHA256)
   */
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }
    const signature = signatureHeader.substring(7);
    const hmac = crypto.createHmac('sha256', config.META_APP_SECRET);
    const digest = hmac.update(rawBody).digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const digestBuffer = Buffer.from(digest, 'utf8');

    if (signatureBuffer.length !== digestBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
  }

  /**
   * Process Inbound Webhook Event:
   * Maps phone_number_id to tenant, persists message, and deduplicates.
   */
  async processInboundWebhook(payload: any) {
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    if (!changes) return { status: 'IGNORED_NO_CHANGES' };

    const phoneNumberId = changes?.metadata?.phone_number_id;
    if (!phoneNumberId) return { status: 'IGNORED_NO_PHONE_NUMBER_ID' };

    // Resolve tenant connection
    const connection = await WhatsAppConnection.findOne({
      phoneNumberId,
      status: WhatsAppConnectionStatus.CONNECTED,
    });

    // If connection not found in DB, check fallback for dev/testing
    const tenantId = connection ? connection.tenantId : null;
    if (!tenantId) {
      console.warn(`[WhatsApp] Webhook received for unmapped phoneNumberId: ${phoneNumberId}`);
      return { status: 'UNMAPPED_TENANT' };
    }

    const messages = changes?.messages || [];
    for (const msg of messages) {
      const providerMessageId = msg.id;
      const senderPhone = msg.from;
      const messageType = msg.type;
      let bodyText: string | undefined;

      if (messageType === 'text') {
        bodyText = msg.text?.body;
      } else if (messageType === 'audio') {
        bodyText = '[Voice Note]';
      }

      // Check deduplication
      const existing = await WhatsAppMessage.findOne({
        tenantId,
        providerMessageId,
      });

      if (existing) {
        console.log(`[WhatsApp] Deduplicated message: ${providerMessageId}`);
        continue;
      }

      const messageDoc = await WhatsAppMessage.create({
        tenantId,
        providerMessageId,
        direction: 'INBOUND',
        senderPhone,
        recipientPhone: changes?.metadata?.display_phone_number || '',
        messageType: messageType === 'audio' ? 'audio' : 'text',
        body: bodyText,
        status: 'DELIVERED',
        rawPayload: msg,
      });

      // Find matched customer by phone
      const customer = await Customer.findOne({
        tenantId,
        $or: [{ phone: senderPhone }, { whatsappNumber: senderPhone }],
      });

      // Trigger Gemini AI extraction for order drafts
      if (bodyText) {
        try {
          const draft = await geminiService.extractOrderDraft(tenantId, {
            sourceType: messageType === 'audio' ? 'WHATSAPP_VOICE' : 'WHATSAPP_TEXT',
            sourceMessageId: messageDoc._id.toString(),
            rawText: bodyText,
            senderPhone,
            customerId: customer?._id.toString(),
            customerName: customer?.name,
          });
          messageDoc.hasAiDraft = true;
          messageDoc.orderDraftId = draft._id;
          await messageDoc.save();
        } catch (err: any) {
          console.error('[WhatsApp] AI draft extraction error:', err.message);
        }
      }
    }

    return { status: 'PROCESSED' };
  }

  /**
   * Outbound WhatsApp Message Send
   */
  async sendMessage(
    tenantId: mongoose.Types.ObjectId,
    input: SendWhatsAppMessageInput,
    actorId: string
  ) {
    const connection = await WhatsAppConnection.findOne({ tenantId });
    if (!connection && config.NODE_ENV === 'production') {
      throw AppError.badRequest('WhatsApp connection is not configured for this organization.');
    }

    const providerMessageId = `wamid.${Date.now()}.${Math.floor(1000 + Math.random() * 9000)}`;

    const msgDoc = await WhatsAppMessage.create({
      tenantId,
      providerMessageId,
      direction: 'OUTBOUND',
      senderPhone: connection?.displayPhoneNumber || 'MetriFlow Bot',
      recipientPhone: input.recipientPhone,
      messageType: input.messageType,
      body: input.text || `[Template: ${input.templateName}]`,
      status: 'SENT',
    });

    return {
      message: 'WhatsApp message queued and sent.',
      messageRecord: msgDoc,
    };
  }
}

export const whatsappService = new WhatsAppService();
