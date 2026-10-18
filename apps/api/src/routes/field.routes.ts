import { Router } from 'express';
import { fieldController } from '../controllers/field.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

router.get(
  '/deliveries',
  requirePermission(Permission.DELIVERY_ASSIGNED),
  (req, res, next) => fieldController.listAssignedDeliveries(req, res, next)
);

router.post(
  '/deliveries/:id/complete',
  requirePermission(Permission.POD_CAPTURE),
  requireIdempotency(),
  (req, res, next) => fieldController.completeDelivery(req, res, next)
);

router.post(
  '/deliveries/:id/fail',
  requirePermission(Permission.DELIVERY_ASSIGNED),
  requireIdempotency(),
  (req, res, next) => fieldController.failDelivery(req, res, next)
);

export const fieldRoutes = router;
