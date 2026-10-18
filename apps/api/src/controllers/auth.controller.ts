import { Request, Response, NextFunction } from 'express';
import {
  SignupSchema,
  LoginSchema,
  InviteMemberSchema,
  AcceptInviteSchema,
  ResetPasswordRequestSchema,
  ResetPasswordConfirmSchema,
  MfaSetupVerifySchema,
} from '@metriflow/contracts';
import { authService } from '../services/auth.service.js';
import { config } from '../config/index.js';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SignupSchema.parse(req.body);
      const result = await authService.signup(input, req.traceId);

      res.cookie('metriflow_session', result.sessionToken, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: 'lax',
        domain: config.COOKIE_DOMAIN,
        maxAge: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: result,
        traceId: req.traceId,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input, req.traceId);

      res.cookie('metriflow_session', result.sessionToken, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: 'lax',
        domain: config.COOKIE_DOMAIN,
        maxAge: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: result,
        traceId: req.traceId,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.metriflow_session || req.headers.authorization?.substring(7) || '';
      await authService.logout(rawToken);

      res.clearCookie('metriflow_session', {
        domain: config.COOKIE_DOMAIN,
      });

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully.' },
        traceId: req.traceId,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: { user: req.user },
        traceId: req.traceId,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string || req.body?.token;
      const result = await authService.verifyEmail(token);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ResetPasswordRequestSchema.parse(req.body);
      const result = await authService.requestPasswordReset(input);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ResetPasswordConfirmSchema.parse(req.body);
      const result = await authService.confirmPasswordReset(input);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const input = InviteMemberSchema.parse(req.body);
      const result = await authService.inviteMember(req.tenantId!, req.user!, input);
      res.status(201).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const input = AcceptInviteSchema.parse(req.body);
      const result = await authService.acceptInvite(input);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async setupMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.setupMfa(req.user!.id);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }

  async verifyMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const input = MfaSetupVerifySchema.parse(req.body);
      const result = await authService.verifyAndEnableMfa(req.user!.id, input.secret, input.code);
      res.status(200).json({ success: true, data: result, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
