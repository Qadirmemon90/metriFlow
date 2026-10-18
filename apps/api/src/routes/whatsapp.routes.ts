import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();

// Public Webhook endpoints for Meta
router.get('/webhook', (req, res, next) => whatsappController.verifyWebhook(req, res, next));
router.post('/webhook', (req, res, next) => whatsappController.handleWebhook(req, res, next));

// Authenticated Outbound Sending
router.post(
  '/send',
  requireAuth,
  requirePermission(Permission.WHATSAPP_CHAT),
  requireIdempotency(),
  (req, res, next) => whatsappController.sendMessage(req, res, next)
);

export const whatsappRoutes = router;
