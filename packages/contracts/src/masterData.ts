import { z } from 'zod';

export const BranchSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
  address: z.string().optional(),
  city: z.string().min(2).max(50),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type BranchInput = z.infer<typeof BranchSchema>;

export const WarehouseSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
  address: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type WarehouseInput = z.infer<typeof WarehouseSchema>;

export const ProductUnitSchema = z.object({
  name: z.string().min(1).max(20), // e.g. "Piece", "Box", "Carton"
  multiplier: z.coerce.number().min(1).default(1), // e.g. 1 Box = 12 Pieces
});

export const ProductSchema = z.object({
  sku: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(2).max(200),
  barcode: z.string().optional(),
  category: z.string().min(1).max(100),
  baseUnit: z.string().min(1).max(20).default('Piece'),
  secondaryUnits: z.array(ProductUnitSchema).optional().default([]),
  defaultPricePaisa: z.string().regex(/^\d+$/, 'Must be integer paisa string'), // e.g. "15000" for 150 PKR
  costPricePaisa: z.string().regex(/^\d+$/, 'Must be integer paisa string').default('0'),
  minStockAlert: z.coerce.number().min(0).default(0),
  taxRatePercent: z.coerce.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof ProductSchema>;

export const CustomerSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50).optional(),
  phone: z.string().min(8).max(20),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().min(2).max(50),
  area: z.string().optional(),
  creditLimitPaisa: z.string().regex(/^\d+$/, 'Must be integer paisa string').default('0'),
  creditDays: z.coerce.number().min(0).default(0),
  assignedSalesmanId: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CustomerInput = z.infer<typeof CustomerSchema>;

export const SupplierSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().min(2).max(50),
  paymentTermsDays: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type SupplierInput = z.infer<typeof SupplierSchema>;

export const ImportBatchPreviewSchema = z.object({
  entityType: z.enum(['products', 'customers', 'suppliers']),
  csvContent: z.string().min(1),
});
export type ImportBatchPreviewInput = z.infer<typeof ImportBatchPreviewSchema>;

export const ImportBatchCommitSchema = z.object({
  batchId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});
export type ImportBatchCommitInput = z.infer<typeof ImportBatchCommitSchema>;
