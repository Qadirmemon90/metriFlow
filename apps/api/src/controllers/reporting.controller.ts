import { Request, Response, NextFunction } from 'express';
import { reportingService } from '../services/reporting.service.js';

export class ReportingController {
  async getCustomerKhata(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportingService.getCustomerKhata(req.tenantId!, req.params.customerId);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async getArAgingReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportingService.getArAgingReport(req.tenantId!);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const result = await reportingService.getProfitAndLoss(req.tenantId!, startDate, endDate);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const reportingController = new ReportingController();
