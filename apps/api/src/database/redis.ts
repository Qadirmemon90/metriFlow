import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config/index.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
  }
  return redisClient;
}

export const OUTBOX_QUEUE_NAME = 'metriflow-outbox';
export const EMAIL_QUEUE_NAME = 'metriflow-email';
export const WHATSAPP_QUEUE_NAME = 'metriflow-whatsapp';
export const REMINDER_QUEUE_NAME = 'metriflow-reminder';

let outboxQueue: Queue | null = null;

export function getOutboxQueue(): Queue {
  if (!outboxQueue) {
    outboxQueue = new Queue(OUTBOX_QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return outboxQueue;
}
