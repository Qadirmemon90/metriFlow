import { Request, Response, NextFunction } from 'express';
import { CompleteDeliverySchema, FailDeliverySchema } from '@metriflow/contracts';
import { fieldService } from '../services/field.service.js';

export class FieldController {
  async listAssignedDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveries = await fieldService.listAssignedDeliveries(req.tenantId!, req.user!.id);
      res.status(200).json({ success: true, data: deliveries, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async completeDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CompleteDeliverySchema.parse(req.body);
      const result = await fieldService.completeDelivery(req.tenantId!, req.params.id, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async failDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const input = FailDeliverySchema.parse(req.body);
      const result = await fieldService.failDelivery(req.tenantId!, req.params.id, input, req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const fieldController = new FieldController();
