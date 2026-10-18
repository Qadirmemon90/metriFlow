import { Request, Response, NextFunction } from 'express';
import {
  CreateOrderDraftSchema,
  ConfirmOrderSchema,
  CreateDispatchSchema,
  CancelRemainderSchema,
  OrderStatus,
} from '@metriflow/contracts';
import { salesService } from '../services/sales.service.js';

export class SalesController {
  async createDraftOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CreateOrderDraftSchema.parse(req.body);
      const order = await salesService.createDraftOrder(req.tenantId!, input, req.user!.id);
      res.status(201).json({ success: true, data: order, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async confirmOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ConfirmOrderSchema.parse(req.body);
      const result = await salesService.confirmOrder(req.tenantId!, req.params.id, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async dispatchOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CreateDispatchSchema.parse(req.body);
      const result = await salesService.dispatchOrder(req.tenantId!, input, req.user!.id);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async cancelRemainder(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CancelRemainderSchema.parse(req.body);
      const result = await salesService.cancelRemainder(req.tenantId!, req.params.id, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as OrderStatus;
      const orders = await salesService.listOrders(req.tenantId!, status);
      res.status(200).json({ success: true, data: orders, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await salesService.getOrder(req.tenantId!, req.params.id);
      res.status(200).json({ success: true, data: order, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
