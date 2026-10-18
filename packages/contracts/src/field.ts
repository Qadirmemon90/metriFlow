import { z } from 'zod';

export enum DeliveryStatus {
  ASSIGNED = 'ASSIGNED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export const CompleteDeliverySchema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientPhone: z.string().optional(),
  signatureImageId: z.string().optional(),
  photoEvidenceId: z.string().optional(),
  collectedAmountPaisa: z.string().regex(/^\d+$/, 'Collected amount must be integer paisa string').default('0'),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type CompleteDeliveryInput = z.infer<typeof CompleteDeliverySchema>;

export const FailDeliverySchema = z.object({
  reasonCode: z.enum([
    'CUSTOMER_UNAVAILABLE',
    'REFUSED_ENTRY',
    'ORDER_REJECTED',
    'ADDRESS_NOT_FOUND',
    'VEHICLE_BREAKDOWN',
    'OTHER',
  ]),
  notes: z.string().min(3).max(500),
  idempotencyKey: z.string().min(1),
});
export type FailDeliveryInput = z.infer<typeof FailDeliverySchema>;
