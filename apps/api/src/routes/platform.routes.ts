import { Router } from 'express';
import { platformController } from '../controllers/platform.controller.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();

// Tenant submits manual bank transfer payment for plan
router.post(
  '/subscriptions/payment',
  requireAuth,
  requirePermission(Permission.ORG_SETTINGS_UPDATE),
  requireIdempotency(),
  (req, res, next) => platformController.submitSubscriptionPayment(req, res, next)
);

// Platform Super Admin Routes
router.post(
  '/subscriptions/verify',
  requireSuperAdmin,
  (req, res, next) => platformController.verifySubscriptionPayment(req, res, next)
);

router.post(
  '/support-access',
  requireSuperAdmin,
  (req, res, next) => platformController.grantSupportAccess(req, res, next)
);

router.get(
  '/metrics',
  requireSuperAdmin,
  (req, res, next) => platformController.getPlatformMetrics(req, res, next)
);

export const platformRoutes = router;
