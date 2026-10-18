import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { ApiErrorResponse } from '@metriflow/contracts';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const traceId = req.traceId || 'unknown-trace-id';

  // 1. AppError (our custom domain errors)
  if (err instanceof AppError) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
      traceId,
    };
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // 2. Zod Schema Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message: 'Validation failed on request payload',
        code: 'VALIDATION_ERROR',
        details,
      },
      traceId,
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 3. Mongoose Duplicate Key Error (E11000)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message: `Duplicate entry for ${field}. A record with this value already exists.`,
        code: 'DUPLICATE_KEY_ERROR',
      },
      traceId,
    };
    res.status(409).json(errorResponse);
    return;
  }

  // 4. Mongoose Cast / Validation Error
  if (err.name === 'CastError') {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message: `Invalid format for field: ${err.path}`,
        code: 'INVALID_ID_FORMAT',
      },
      traceId,
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 5. Unknown Internal Server Error (Redact internal message in production)
  console.error(`[Unhandled Error] [Trace: ${traceId}]:`, err);

  const isProd = process.env.NODE_ENV === 'production';
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      message: isProd ? 'An unexpected internal server error occurred.' : err.message || 'Internal error',
      code: 'INTERNAL_SERVER_ERROR',
    },
    traceId,
  };
  res.status(500).json(errorResponse);
}
