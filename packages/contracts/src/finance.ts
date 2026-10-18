import { z } from 'zod';

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
}

export enum CollectionStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  REVERSED = 'REVERSED',
}

export const SubmitCollectionSchema = z.object({
  customerId: z.string().min(1),
  amountPaisa: z.string().regex(/^[1-9]\d*$/, 'Amount must be positive integer paisa string'),
  method: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  evidenceFileId: z.string().optional(), // Attachment in object storage
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type SubmitCollectionInput = z.infer<typeof SubmitCollectionSchema>;

export const VerifyPaymentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

export const InvoiceAllocationItemSchema = z.object({
  invoiceId: z.string().min(1),
  amountPaisa: z.string().regex(/^[1-9]\d*$/, 'Allocation must be positive integer paisa string'),
});

export const AllocatePaymentSchema = z.object({
  customerId: z.string().min(1),
  paymentId: z.string().optional(), // If allocating from a specific payment or unapplied credit
  allocations: z.array(InvoiceAllocationItemSchema).min(1),
  idempotencyKey: z.string().min(1),
});
export type AllocatePaymentInput = z.infer<typeof AllocatePaymentSchema>;

export const CustomerReturnItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.string().regex(/^\d+(\.\d+)?$/, 'Quantity must be decimal string'),
  unitCreditPaisa: z.string().regex(/^\d+$/, 'Credit price must be integer paisa string'),
  restockSellable: z.boolean().default(true), // true = restock to on-hand, false = quarantine
});

export const ProcessCustomerReturnSchema = z.object({
  customerId: z.string().min(1),
  warehouseId: z.string().min(1),
  originalInvoiceId: z.string().optional(),
  reason: z.string().min(3).max(500),
  items: z.array(CustomerReturnItemSchema).min(1),
  idempotencyKey: z.string().min(1),
});
export type ProcessCustomerReturnInput = z.infer<typeof ProcessCustomerReturnSchema>;

export const SupplierBillSchema = z.object({
  supplierId: z.string().min(1),
  billNumber: z.string().min(1),
  billDate: z.string().min(1), // ISO
  dueDate: z.string().optional(),
  totalAmountPaisa: z.string().regex(/^\d+$/, 'Total must be integer paisa string'),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type SupplierBillInput = z.infer<typeof SupplierBillSchema>;

export const SupplierPaymentSchema = z.object({
  supplierId: z.string().min(1),
  amountPaisa: z.string().regex(/^[1-9]\d*$/, 'Payment must be positive integer paisa string'),
  method: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type SupplierPaymentInput = z.infer<typeof SupplierPaymentSchema>;
