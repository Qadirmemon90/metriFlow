import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { traceIdMiddleware } from './middleware/traceId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiV1Router } from './routes/index.js';
import { openApiSpec } from './docs/openapi.js';
import { getRedisClient } from './database/redis.js';
import { AppError } from './utils/errors.js';

export function createApp() {
  const app = express();

  // Basic Security & Performance
  app.use(helmet());
  app.use(
    cors({
      origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id', 'Idempotency-Key'],
    })
  );
  app.use(compression());
  app.use(cookieParser());

  // Capture raw body buffer for Meta webhook signature verification
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Attach Trace ID to all incoming requests
  app.use(traceIdMiddleware);

  // Health Endpoint (Liveness check)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness Endpoint (Dependencies check)
  app.get('/ready', async (_req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    let isRedisConnected = false;

    try {
      const redis = getRedisClient();
      const pong = await redis.ping();
      isRedisConnected = pong === 'PONG';
    } catch {
      isRedisConnected = false;
    }

    const isReady = isDbConnected && isRedisConnected;
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? 'READY' : 'DEGRADED',
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      redis: isRedisConnected ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    });
  });

  // OpenAPI Contracts UI
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api/v1/openapi.json', (_req: Request, res: Response) => {
    res.status(200).json(openApiSpec);
  });

  // Versioned API v1 routes
  app.use('/api/v1', apiV1Router);

  // 404 Route Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(AppError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found.`));
  });

  // Centralized Redacted Error Handler
  app.use(errorHandler);

  return app;
}
