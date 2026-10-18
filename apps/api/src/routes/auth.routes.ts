import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { Permission } from '@metriflow/contracts';

const router = Router();

router.post('/signup', (req, res, next) => authController.signup(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', requireAuth, (req, res, next) => authController.me(req, res, next));

router.get('/verify-email', (req, res, next) => authController.verifyEmail(req, res, next));
router.post('/verify-email', (req, res, next) => authController.verifyEmail(req, res, next));

router.post('/password-reset-request', (req, res, next) => authController.requestPasswordReset(req, res, next));
router.post('/password-reset-confirm', (req, res, next) => authController.confirmPasswordReset(req, res, next));

router.post(
  '/invite',
  requireAuth,
  requirePermission(Permission.TEAM_MANAGE),
  (req, res, next) => authController.inviteMember(req, res, next)
);

router.post('/accept-invite', (req, res, next) => authController.acceptInvite(req, res, next));

router.post('/mfa/setup', requireAuth, (req, res, next) => authController.setupMfa(req, res, next));
router.post('/mfa/verify', requireAuth, (req, res, next) => authController.verifyMfa(req, res, next));

export const authRoutes = router;
