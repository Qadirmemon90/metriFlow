import { Request, Response, NextFunction } from 'express';
import { SendWhatsAppMessageSchema } from '@metriflow/contracts';
import { whatsappService } from '../services/whatsapp.service.js';
import { AppError } from '../utils/errors.js';

export class WhatsAppController {
  // GET webhook challenge
  verifyWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const mode = req.query['hub.mode'] as string;
      const token = req.query['hub.verify_token'] as string;
      const challenge = req.query['hub.challenge'] as string;

      const result = whatsappService.verifyWebhookChallenge(mode, token, challenge);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  }

  // POST webhook event
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signatureHeader = req.headers['x-hub-signature-256'] as string;
      // In express, if raw body is captured or body string
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const isValid = whatsappService.verifyWebhookSignature(rawBody, signatureHeader);

      if (!isValid && process.env.NODE_ENV === 'production') {
        throw AppError.forbidden('Invalid webhook HMAC-SHA256 signature.');
      }

      // Persist & process
      const result = await whatsappService.processInboundWebhook(req.body);

      // Meta requires immediate 200 OK acknowledgment
      res.status(200).json({ eventStatus: 'EVENT_RECEIVED', ...result });
    } catch (error) {
      next(error);
    }
  }

  // Outbound manual send
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SendWhatsAppMessageSchema.parse(req.body);
      const result = await whatsappService.sendMessage(req.tenantId!, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const whatsappController = new WhatsAppController();
