import mongoose from 'mongoose';
import {
  Product,
  Customer,
  Supplier,
  Branch,
  Warehouse,
  AuditLog,
} from '../database/models/index.js';
import {
  ProductInput,
  CustomerInput,
  SupplierInput,
  BranchInput,
  WarehouseInput,
  CursorPaginationParams,
} from '@metriflow/contracts';
import { AppError } from '../utils/errors.js';

export class MasterDataService {
  // ─── BRANCHES & WAREHOUSES ────────────────────────────────────────────────
  async createBranch(tenantId: mongoose.Types.ObjectId, input: BranchInput) {
    const existing = await Branch.findOne({ tenantId, code: input.code.toUpperCase() });
    if (existing) throw AppError.conflict(`Branch with code ${input.code} already exists.`);
    return Branch.create({ ...input, tenantId });
  }

  async listBranches(tenantId: mongoose.Types.ObjectId) {
    return Branch.find({ tenantId, isActive: true }).sort({ isDefault: -1, name: 1 });
  }

  async createWarehouse(tenantId: mongoose.Types.ObjectId, input: WarehouseInput) {
    const existing = await Warehouse.findOne({ tenantId, code: input.code.toUpperCase() });
    if (existing) throw AppError.conflict(`Warehouse with code ${input.code} already exists.`);
    return Warehouse.create({
      ...input,
      tenantId,
      branchId: new mongoose.Types.ObjectId(input.branchId),
    });
  }

  async listWarehouses(tenantId: mongoose.Types.ObjectId, branchId?: string) {
    const filter: any = { tenantId, isActive: true };
    if (branchId) filter.branchId = new mongoose.Types.ObjectId(branchId);
    return Warehouse.find(filter).populate('branchId', 'name code').sort({ isDefault: -1, name: 1 });
  }

  // ─── PRODUCTS & SKUS ──────────────────────────────────────────────────────
  async createProduct(tenantId: mongoose.Types.ObjectId, input: ProductInput, actorId: string, traceId: string) {
    const sku = input.sku.toUpperCase().trim();
    const existing = await Product.findOne({ tenantId, sku });
    if (existing) throw AppError.conflict(`Product with SKU ${sku} already exists.`);

    const product = await Product.create({
      ...input,
      sku,
      tenantId,
      defaultPricePaisa: parseInt(input.defaultPricePaisa, 10),
      costPricePaisa: parseInt(input.costPricePaisa || '0', 10),
    });

    await AuditLog.create({
      tenantId,
      actorId: new mongoose.Types.ObjectId(actorId),
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id.toString(),
      traceId,
      metadata: { sku: product.sku, name: product.name },
    });

    return product;
  }

  async listProducts(tenantId: mongoose.Types.ObjectId, params: CursorPaginationParams) {
    const query: any = { tenantId, isArchived: false };
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { sku: { $regex: params.search, $options: 'i' } },
        { category: { $regex: params.search, $options: 'i' } },
      ];
    }

    const limit = params.limit || 25;
    const items = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
      items: resultItems,
      hasMore,
      nextCursor: hasMore ? resultItems[resultItems.length - 1]._id.toString() : undefined,
    };
  }

  async archiveProduct(tenantId: mongoose.Types.ObjectId, productId: string) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId },
      { isArchived: true, isActive: false },
      { new: true }
    );
    if (!product) throw AppError.notFound('Product not found.');
    return { message: 'Product archived successfully.' };
  }

  // ─── CUSTOMERS ────────────────────────────────────────────────────────────
  async createCustomer(tenantId: mongoose.Types.ObjectId, input: CustomerInput, actorId: string, traceId: string) {
    const customer = await Customer.create({
      ...input,
      tenantId,
      creditLimitPaisa: parseInt(input.creditLimitPaisa || '0', 10),
      assignedSalesmanId: input.assignedSalesmanId ? new mongoose.Types.ObjectId(input.assignedSalesmanId) : undefined,
    });

    await AuditLog.create({
      tenantId,
      actorId: new mongoose.Types.ObjectId(actorId),
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      traceId,
      metadata: { name: customer.name, phone: customer.phone },
    });

    return customer;
  }

  async listCustomers(
    tenantId: mongoose.Types.ObjectId,
    params: CursorPaginationParams,
    salesmanIdFilter?: string
  ) {
    const query: any = { tenantId, isArchived: false };
    if (salesmanIdFilter) {
      query.assignedSalesmanId = new mongoose.Types.ObjectId(salesmanIdFilter);
    }
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { phone: { $regex: params.search, $options: 'i' } },
        { city: { $regex: params.search, $options: 'i' } },
      ];
    }

    const limit = params.limit || 25;
    const items = await Customer.find(query)
      .populate('assignedSalesmanId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
      items: resultItems,
      hasMore,
      nextCursor: hasMore ? resultItems[resultItems.length - 1]._id.toString() : undefined,
    };
  }

  async archiveCustomer(tenantId: mongoose.Types.ObjectId, customerId: string) {
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, tenantId },
      { isArchived: true, isActive: false },
      { new: true }
    );
    if (!customer) throw AppError.notFound('Customer not found.');
    return { message: 'Customer archived successfully.' };
  }

  // ─── SUPPLIERS ────────────────────────────────────────────────────────────
  async createSupplier(tenantId: mongoose.Types.ObjectId, input: SupplierInput, actorId: string, traceId: string) {
    const supplier = await Supplier.create({
      ...input,
      tenantId,
    });

    await AuditLog.create({
      tenantId,
      actorId: new mongoose.Types.ObjectId(actorId),
      action: 'SUPPLIER_CREATED',
      entityType: 'Supplier',
      entityId: supplier._id.toString(),
      traceId,
      metadata: { name: supplier.name, phone: supplier.phone },
    });

    return supplier;
  }

  async listSuppliers(tenantId: mongoose.Types.ObjectId, params: CursorPaginationParams) {
    const query: any = { tenantId, isArchived: false };
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { phone: { $regex: params.search, $options: 'i' } },
        { city: { $regex: params.search, $options: 'i' } },
      ];
    }

    const limit = params.limit || 25;
    const items = await Supplier.find(query).sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
      items: resultItems,
      hasMore,
      nextCursor: hasMore ? resultItems[resultItems.length - 1]._id.toString() : undefined,
    };
  }

  // ─── CSV IMPORT ENGINE ───────────────────────────────────────────────────
  parseCsv(content: string): Array<Record<string, string>> {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
    return rows;
  }

  async previewImport(type: 'products' | 'customers' | 'suppliers', csvContent: string) {
    const rows = this.parseCsv(csvContent);
    const validRows: any[] = [];
    const errors: Array<{ rowNumber: number; reason: string }> = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // header is row 1
      if (type === 'products') {
        if (!row.sku || !row.name) {
          errors.push({ rowNumber, reason: 'Missing required SKU or Name' });
          return;
        }
        validRows.push({
          sku: row.sku.toUpperCase(),
          name: row.name,
          category: row.category || 'General',
          defaultPricePaisa: parseInt(row.pricePaisa || '0', 10) || 0,
        });
      } else if (type === 'customers') {
        if (!row.name || !row.phone) {
          errors.push({ rowNumber, reason: 'Missing required Customer Name or Phone' });
          return;
        }
        validRows.push({
          name: row.name,
          phone: row.phone,
          city: row.city || 'Karachi',
          creditLimitPaisa: parseInt(row.creditLimitPaisa || '0', 10) || 0,
        });
      } else if (type === 'suppliers') {
        if (!row.name || !row.phone) {
          errors.push({ rowNumber, reason: 'Missing required Supplier Name or Phone' });
          return;
        }
        validRows.push({
          name: row.name,
          phone: row.phone,
          city: row.city || 'Karachi',
        });
      }
    });

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      sampleValid: validRows.slice(0, 5),
    };
  }
}

export const masterDataService = new MasterDataService();
