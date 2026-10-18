import { Request, Response, NextFunction } from 'express';
import {
  SubmitManualBillingPaymentSchema,
  VerifySubscriptionPaymentSchema,
  GrantSupportAccessSchema,
  PublicContactSubmissionSchema,
} from '@metriflow/contracts';
import { platformService } from '../services/platform.service.js';

export class PlatformController {
  // Tenant submits bank transfer proof
  async submitSubscriptionPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SubmitManualBillingPaymentSchema.parse(req.body);
      const result = await platformService.submitSubscriptionPayment(req.tenantId!, input);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Super Admin verifies subscription payment
  async verifySubscriptionPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const input = VerifySubscriptionPaymentSchema.parse(req.body);
      const result = await platformService.verifySubscriptionPayment(input, req.user!.id, req.traceId);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Super Admin grants temporary audited support access
  async grantSupportAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const input = GrantSupportAccessSchema.parse(req.body);
      const result = await platformService.grantSupportAccess(input, req.user!.id, req.traceId);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Super Admin view platform health metrics
  async getPlatformMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await platformService.getPlatformMetrics();
      res.status(200).json({ success: true, data: metrics, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  // Public contact / demo request
  async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      const input = PublicContactSubmissionSchema.parse(req.body);
      const result = await platformService.submitContactInquiry(input);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const platformController = new PlatformController();
