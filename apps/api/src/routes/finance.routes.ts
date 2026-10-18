import { Router } from 'express';
import { financeController } from '../controllers/finance.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

router.post(
  '/collections',
  requirePermission(Permission.PAYMENT_COLLECT),
  requireIdempotency(),
  (req, res, next) => financeController.submitCollection(req, res, next)
);

router.post(
  '/collections/:id/verify',
  requirePermission(Permission.PAYMENT_VERIFY),
  requireIdempotency(),
  (req, res, next) => financeController.verifyPayment(req, res, next)
);

router.post(
  '/allocations',
  requirePermission(Permission.PAYMENT_VERIFY),
  requireIdempotency(),
  (req, res, next) => financeController.allocatePayment(req, res, next)
);

router.post(
  '/returns',
  requirePermission(Permission.RETURN_PROCESS),
  requireIdempotency(),
  (req, res, next) => financeController.processCustomerReturn(req, res, next)
);

router.post(
  '/supplier-payments',
  requirePermission(Permission.PAYMENT_VERIFY),
  requireIdempotency(),
  (req, res, next) => financeController.createSupplierPayment(req, res, next)
);

export const financeRoutes = router;
