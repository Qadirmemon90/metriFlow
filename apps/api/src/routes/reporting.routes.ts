import { Router } from 'express';
import { reportingController } from '../controllers/reporting.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

router.get(
  '/khata/:customerId',
  requirePermission(Permission.LEDGER_READ),
  (req, res, next) => reportingController.getCustomerKhata(req, res, next)
);

router.get(
  '/aging',
  requirePermission(Permission.REPORT_VIEW),
  (req, res, next) => reportingController.getArAgingReport(req, res, next)
);

router.get(
  '/profit-and-loss',
  requirePermission(Permission.REPORT_VIEW),
  (req, res, next) => reportingController.getProfitAndLoss(req, res, next)
);

export const reportingRoutes = router;
