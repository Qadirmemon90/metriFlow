import { z } from 'zod';

export enum MovementType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  GOODS_RECEIPT = 'GOODS_RECEIPT',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  DISPATCH_ISSUE = 'DISPATCH_ISSUE',
  RETURN_RESTOCK = 'RETURN_RESTOCK',
  QUARANTINE_HOLD = 'QUARANTINE_HOLD',
  QUARANTINE_RELEASE = 'QUARANTINE_RELEASE',
}

export const GoodsReceiptItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.string().regex(/^\d+(\.\d+)?$/, 'Quantity must be decimal string'),
  unitCostPaisa: z.string().regex(/^\d+$/, 'Unit cost must be integer paisa string'),
});

export const GoodsReceiptSchema = z.object({
  supplierId: z.string().min(1),
  warehouseId: z.string().min(1),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(GoodsReceiptItemSchema).min(1),
  idempotencyKey: z.string().min(1),
});
export type GoodsReceiptInput = z.infer<typeof GoodsReceiptSchema>;

export const StockAdjustmentSchema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  type: z.enum(['INCREASE', 'DECREASE', 'QUARANTINE', 'UNQUARANTINE']),
  quantity: z.string().regex(/^\d+(\.\d+)?$/, 'Quantity must be positive decimal string'),
  reason: z.string().min(3).max(500),
  idempotencyKey: z.string().min(1),
});
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

export interface StockLevelDto {
  productId: string;
  sku: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  onHand: string;
  reserved: string;
  quarantined: string;
  available: string; // onHand - reserved - quarantined
  movingAverageCostPaisa: string;
}
