import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

export function traceIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingTraceId = req.headers['x-trace-id'] as string;
  const traceId = existingTraceId || uuidv4();
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
}
