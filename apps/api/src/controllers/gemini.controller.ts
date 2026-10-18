import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReviewAndApproveDraftSchema } from '@metriflow/contracts';
import { geminiService } from '../services/gemini.service.js';
import { OrderDraft } from '../database/models/index.js';
import { salesService } from '../services/sales.service.js';
import { AppError } from '../utils/errors.js';

export class GeminiController {
  // Manual trigger of draft extraction
  async extractDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const Schema = z.object({
        text: z.string().min(1),
        customerId: z.string().optional(),
      });
      const input = Schema.parse(req.body);

      const draft = await geminiService.extractOrderDraft(req.tenantId!, {
        sourceType: 'MANUAL',
        rawText: input.text,
        customerId: input.customerId,
      });

      res.status(201).json({ success: true, data: draft, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // List pending order drafts
  async listDrafts(req: Request, res: Response, next: NextFunction) {
    try {
      const drafts = await OrderDraft.find({
        tenantId: req.tenantId!,
        status: 'PENDING_REVIEW',
      })
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: drafts, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Human approval of AI draft -> converts into real order
  async approveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ReviewAndApproveDraftSchema.parse(req.body);
      const draft = await OrderDraft.findOne({ _id: input.draftId, tenantId: req.tenantId! });
      if (!draft) throw AppError.notFound('Order draft not found.');

      if (draft.status !== 'PENDING_REVIEW') {
        throw AppError.badRequest(`Draft is already ${draft.status}`);
      }

      // Create draft order using sales service
      const order = await salesService.createDraftOrder(
        req.tenantId!,
        {
          customerId: input.customerId,
          warehouseId: input.warehouseId,
          source: 'WHATSAPP_AI',
          notes: input.notes,
          items: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unit: i.unit,
            unitPricePaisa: i.unitPricePaisa,
            discountPaisa: i.discountPaisa,
          })),
        },
        req.user!.id
      );

      draft.status = 'APPROVED';
      draft.convertedOrderId = order._id;
      draft.reviewedBy = req.user!.id as any;
      draft.reviewedAt = new Date();
      await draft.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'AI draft approved and converted into an official order.',
          order,
          draft,
        },
        traceId: req.traceId,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const geminiController = new GeminiController();
