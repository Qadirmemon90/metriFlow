import { Request, Response, NextFunction } from 'express';
import {
  SubmitCollectionSchema,
  VerifyPaymentSchema,
  AllocatePaymentSchema,
  ProcessCustomerReturnSchema,
  SupplierPaymentSchema,
} from '@metriflow/contracts';
import { financeService } from '../services/finance.service.js';

export class FinanceController {
  async submitCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SubmitCollectionSchema.parse(req.body);
      const result = await financeService.submitCollection(req.tenantId!, input, req.user!.id);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = VerifyPaymentSchema.parse(req.body);
      const result = await financeService.verifyPayment(req.tenantId!, req.params.id, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async allocatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = AllocatePaymentSchema.parse(req.body);
      const result = await financeService.allocatePayment(req.tenantId!, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async processCustomerReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ProcessCustomerReturnSchema.parse(req.body);
      const result = await financeService.processCustomerReturn(req.tenantId!, input, req.user!.id);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async createSupplierPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SupplierPaymentSchema.parse(req.body);
      const result = await financeService.createSupplierPayment(req.tenantId!, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
