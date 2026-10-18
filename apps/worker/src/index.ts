import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/MetriFlowDev';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function startWorker() {
  console.log('[MetriFlow Worker] Starting background worker process...');

  await mongoose.connect(MONGODB_URI);
  console.log('[MetriFlow Worker] Connected to MongoDB.');

  const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  // Outbox Processor Worker
  const outboxWorker = new Worker(
    'metriflow-outbox',
    async (job: Job) => {
      console.log(`[Worker] Processing outbox job ${job.id}: ${job.name}`, job.data);
      // Simulating job execution (email dispatch, PDF rendering, webhook notification)
      return { processed: true, eventId: job.data?.eventId, timestamp: new Date() };
    },
    { connection: redisConnection, concurrency: 5 }
  );

  outboxWorker.on('completed', (job) => {
    console.log(`[Worker] Outbox job ${job.id} completed successfully.`);
  });

  outboxWorker.on('failed', (job, err) => {
    console.error(`[Worker] Outbox job ${job?.id} failed:`, err.message);
  });

  console.log('[MetriFlow Worker] Workers active and listening on BullMQ queues.');

  const shutdown = async () => {
    console.log('[MetriFlow Worker] Shutting down workers...');
    await outboxWorker.close();
    await mongoose.disconnect();
    redisConnection.disconnect();
    console.log('[MetriFlow Worker] Clean worker exit.');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startWorker().catch((err) => {
  console.error('[MetriFlow Worker] Fatal worker startup error:', err);
  process.exit(1);
});
