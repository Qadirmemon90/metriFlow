import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { IdempotencyKey } from '../database/models/index.js';
import { AppError } from '../utils/errors.js';

export function requireIdempotency() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = (req.headers['idempotency-key'] as string) || req.body?.idempotencyKey;

    if (!key) {
      return next(
        AppError.badRequest(
          'Missing required Idempotency-Key header or idempotencyKey in request body.',
          'MISSING_IDEMPOTENCY_KEY'
        )
      );
    }

    if (!req.tenantId) {
      return next(AppError.unauthorized('Tenant context required for idempotency check.'));
    }

    const payloadString = JSON.stringify(req.body || {});
    const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    try {
      const existing = await IdempotencyKey.findOne({
        tenantId: req.tenantId,
        key,
      });

      if (existing) {
        if (existing.payloadHash !== payloadHash) {
          return next(
            AppError.conflict(
              'Idempotency key reused with a different request payload. Original operation differs.',
              'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'
            )
          );
        }

        // Return the exact previously committed response
        res.status(existing.statusCode).json(existing.responseBody);
        return;
      }

      // Intercept res.json to capture response before sending
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          IdempotencyKey.create({
            tenantId: req.tenantId,
            key,
            endpoint: req.originalUrl,
            payloadHash,
            statusCode: res.statusCode,
            responseBody: body,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour TTL
          }).catch((err) => {
            console.error('[Idempotency] Failed to persist idempotency key:', err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
