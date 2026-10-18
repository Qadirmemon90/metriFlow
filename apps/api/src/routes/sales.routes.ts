import { Router } from 'express';
import { salesController } from '../controllers/sales.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

router.post(
  '/draft',
  requirePermission(Permission.ORDER_CREATE_DRAFT),
  (req, res, next) => salesController.createDraftOrder(req, res, next)
);

router.post(
  '/:id/confirm',
  requirePermission(Permission.ORDER_CONFIRM),
  requireIdempotency(),
  (req, res, next) => salesController.confirmOrder(req, res, next)
);

router.post(
  '/dispatch',
  requirePermission(Permission.ORDER_DISPATCH),
  requireIdempotency(),
  (req, res, next) => salesController.dispatchOrder(req, res, next)
);

router.post(
  '/:id/cancel-remainder',
  requirePermission(Permission.ORDER_CANCEL),
  requireIdempotency(),
  (req, res, next) => salesController.cancelRemainder(req, res, next)
);

router.get(
  '/',
  requirePermission(Permission.ORDER_READ),
  (req, res, next) => salesController.listOrders(req, res, next)
);

router.get(
  '/:id',
  requirePermission(Permission.ORDER_READ),
  (req, res, next) => salesController.getOrder(req, res, next)
);

export const salesRoutes = router;
