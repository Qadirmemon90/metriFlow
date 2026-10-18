import { z } from 'zod';

export const ExtractedDraftItemSchema = z.object({
  catalogProductId: z.string().optional(),
  matchedSku: z.string().optional(),
  productName: z.string().min(1),
  quantity: z.string().regex(/^\d+(\.\d+)?$/, 'Quantity must be decimal string'),
  unit: z.string().default('Piece'),
  confidence: z.number().min(0).max(1),
  ambiguityNote: z.string().optional(),
});
export type ExtractedDraftItem = z.infer<typeof ExtractedDraftItemSchema>;

export const OrderDraftExtractionResultSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(ExtractedDraftItemSchema),
  confidenceScore: z.number().min(0).max(1),
  ambiguities: z.array(z.string()).default([]),
});
export type OrderDraftExtractionResult = z.infer<typeof OrderDraftExtractionResultSchema>;

export const ReviewAndApproveDraftSchema = z.object({
  draftId: z.string().min(1),
  customerId: z.string().min(1),
  warehouseId: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.string().regex(/^\d+(\.\d+)?$/),
      unit: z.string().default('Piece'),
      unitPricePaisa: z.string().regex(/^\d+$/),
      discountPaisa: z.string().regex(/^\d+$/).default('0'),
    })
  ).min(1),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type ReviewAndApproveDraftInput = z.infer<typeof ReviewAndApproveDraftSchema>;
