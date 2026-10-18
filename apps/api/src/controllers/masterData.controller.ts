import { Request, Response, NextFunction } from 'express';
import {
  ProductSchema,
  CustomerSchema,
  SupplierSchema,
  BranchSchema,
  WarehouseSchema,
  CursorPaginationParamsSchema,
  ImportBatchPreviewSchema,
} from '@metriflow/contracts';
import { masterDataService } from '../services/masterData.service.js';

export class MasterDataController {
  // Branches & Warehouses
  async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const input = BranchSchema.parse(req.body);
      const branch = await masterDataService.createBranch(req.tenantId!, input);
      res.status(201).json({ success: true, data: branch, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await masterDataService.listBranches(req.tenantId!);
      res.status(200).json({ success: true, data: branches, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const input = WarehouseSchema.parse(req.body);
      const warehouse = await masterDataService.createWarehouse(req.tenantId!, input);
      res.status(201).json({ success: true, data: warehouse, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string;
      const warehouses = await masterDataService.listWarehouses(req.tenantId!, branchId);
      res.status(200).json({ success: true, data: warehouses, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Products
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ProductSchema.parse(req.body);
      const product = await masterDataService.createProduct(req.tenantId!, input, req.user!.id, req.traceId);
      res.status(201).json({ success: true, data: product, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const params = CursorPaginationParamsSchema.parse(req.query);
      const result = await masterDataService.listProducts(req.tenantId!, params);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async archiveProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterDataService.archiveProduct(req.tenantId!, req.params.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Customers
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CustomerSchema.parse(req.body);
      const customer = await masterDataService.createCustomer(req.tenantId!, input, req.user!.id, req.traceId);
      res.status(201).json({ success: true, data: customer, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const params = CursorPaginationParamsSchema.parse(req.query);
      const salesmanFilter = req.user?.role === 'FIELD_SALESMAN' ? req.user.id : (req.query.assignedSalesmanId as string);
      const result = await masterDataService.listCustomers(req.tenantId!, params, salesmanFilter);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async archiveCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await masterDataService.archiveCustomer(req.tenantId!, req.params.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Suppliers
  async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SupplierSchema.parse(req.body);
      const supplier = await masterDataService.createSupplier(req.tenantId!, input, req.user!.id, req.traceId);
      res.status(201).json({ success: true, data: supplier, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const params = CursorPaginationParamsSchema.parse(req.query);
      const result = await masterDataService.listSuppliers(req.tenantId!, params);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // CSV Import Preview
  async previewImport(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ImportBatchPreviewSchema.parse(req.body);
      const result = await masterDataService.previewImport(input.entityType, input.csvContent);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const masterDataController = new MasterDataController();
