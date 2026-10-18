import { Router } from 'express';
import { geminiController } from '../controllers/gemini.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { Permission } from '@metriflow/contracts';

const router = Router();
router.use(requireAuth);

router.post(
  '/extract-draft',
  requirePermission(Permission.AI_DRAFT_REVIEW),
  (req, res, next) => geminiController.extractDraft(req, res, next)
);

router.get(
  '/drafts',
  requirePermission(Permission.AI_DRAFT_REVIEW),
  (req, res, next) => geminiController.listDrafts(req, res, next)
);

router.post(
  '/approve-draft',
  requirePermission(Permission.AI_DRAFT_REVIEW),
  requireIdempotency(),
  (req, res, next) => geminiController.approveDraft(req, res, next)
);

export const geminiRoutes = router;
