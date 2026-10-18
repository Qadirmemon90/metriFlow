import { Request, Response, NextFunction } from 'express';
import { GoodsReceiptSchema, StockAdjustmentSchema } from '@metriflow/contracts';
import { inventoryService } from '../services/inventory.service.js';

export class InventoryController {
  async receiveGoods(req: Request, res: Response, next: NextFunction) {
    try {
      const input = GoodsReceiptSchema.parse(req.body);
      const result = await inventoryService.receiveGoods(req.tenantId!, input, req.user!.id);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const input = StockAdjustmentSchema.parse(req.body);
      const result = await inventoryService.adjustStock(req.tenantId!, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async getStockLevel(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, productId } = req.params;
      const result = await inventoryService.getStockLevel(req.tenantId!, warehouseId, productId);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
