import { z } from 'zod';

export enum PlanTier {
  STARTER = 'STARTER', // PKR 2,999 / 2 users / 1 warehouse
  BUSINESS = 'BUSINESS', // PKR 7,999 / 5 users / 2 warehouses
  PRO = 'PRO', // PKR 14,999 / 10 users / unlimited warehouses
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export const SubmitManualBillingPaymentSchema = z.object({
  planTier: z.nativeEnum(PlanTier),
  amountPaisa: z.string().regex(/^\d+$/, 'Amount must be integer paisa string'),
  bankReferenceId: z.string().min(3).max(100),
  proofDocumentId: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type SubmitManualBillingPaymentInput = z.infer<typeof SubmitManualBillingPaymentSchema>;

export const VerifySubscriptionPaymentSchema = z.object({
  paymentId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type VerifySubscriptionPaymentInput = z.infer<typeof VerifySubscriptionPaymentSchema>;

export const GrantSupportAccessSchema = z.object({
  tenantId: z.string().min(1),
  reason: z.string().min(5).max(500),
  durationHours: z.number().int().min(1).max(72).default(4),
});
export type GrantSupportAccessInput = z.infer<typeof GrantSupportAccessSchema>;

export const PublicContactSubmissionSchema = z.object({
  fullName: z.string().min(2).max(100),
  companyName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  city: z.string().min(2).max(50),
  message: z.string().min(5).max(2000),
});
export type PublicContactSubmissionInput = z.infer<typeof PublicContactSubmissionSchema>;
