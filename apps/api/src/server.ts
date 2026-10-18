import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { seedDatabase } from './database/seed.js';

async function bootstrap() {
  console.log(`[MetriFlow API] Bootstrapping in ${config.NODE_ENV} mode...`);

  // Connect to MongoDB Replica Set
  await connectDatabase();

  // Run initial seed if needed
  await seedDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.PORT, () => {
    console.log(`[MetriFlow API] Server listening on http://localhost:${config.PORT}`);
    console.log(`[MetriFlow API] OpenAPI Documentation: http://localhost:${config.PORT}/api/v1/docs`);
    console.log(`[MetriFlow API] Health Check: http://localhost:${config.PORT}/health`);
    console.log(`[MetriFlow API] Readiness Check: http://localhost:${config.PORT}/ready`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`[MetriFlow API] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('[MetriFlow API] Clean exit.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[MetriFlow API] Fatal bootstrap error:', err);
  process.exit(1);
});
