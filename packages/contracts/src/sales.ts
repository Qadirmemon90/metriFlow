import { z } from 'zod';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const OrderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.string().regex(/^\d+(\.\d+)?$/, 'Quantity must be decimal string'),
  unit: z.string().min(1).optional().default('Piece'),
  unitPricePaisa: z.string().regex(/^\d+$/, 'Price must be integer paisa string'),
  discountPaisa: z.string().regex(/^\d+$/, 'Discount must be integer paisa string').optional().default('0'),
});

export const CreateOrderDraftSchema = z.object({
  customerId: z.string().min(1),
  warehouseId: z.string().min(1),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(OrderItemInputSchema).min(1),
  source: z.enum(['MANUAL', 'WHATSAPP_AI', 'FIELD_SALES']).default('MANUAL'),
});
export type CreateOrderDraftInput = z.infer<typeof CreateOrderDraftSchema>;

export const ConfirmOrderSchema = z.object({
  expectedVersion: z.number().int().min(1),
  idempotencyKey: z.string().min(1),
});
export type ConfirmOrderInput = z.infer<typeof ConfirmOrderSchema>;

export const DispatchItemSchema = z.object({
  orderItemId: z.string().min(1),
  dispatchQuantity: z.string().regex(/^\d+(\.\d+)?$/, 'Quantity must be decimal string'),
});

export const CreateDispatchSchema = z.object({
  orderId: z.string().min(1),
  warehouseId: z.string().min(1),
  items: z.array(DispatchItemSchema).min(1),
  driverName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>;

export const CancelRemainderSchema = z.object({
  reason: z.string().min(3).max(500),
  idempotencyKey: z.string().min(1),
});
export type CancelRemainderInput = z.infer<typeof CancelRemainderSchema>;

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  orderId: string;
  dispatchId: string;
  customerId: string;
  customerName: string;
  issueDate: string; // ISO
  dueDate: string;   // ISO
  totalAmountPaisa: string;
  paidAmountPaisa: string;
  balanceDuePaisa: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
}
