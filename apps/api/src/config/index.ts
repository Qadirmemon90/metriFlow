import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config(); // fallback to local .env

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_BASE_URL: z.string().default('http://localhost:5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  SESSION_SECRET: z.string().min(16).default('development_secret_minimum_16_chars_long'),
  SESSION_TTL_HOURS: z.coerce.number().default(12),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./data/storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('ap-southeast-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  EMAIL_ADAPTER: z.enum(['smtp', 'console', 'memory']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('MetriFlow <no-reply@metriflow.pk>'),
  META_APP_ID: z.string().default('mock_meta_app_id'),
  META_APP_SECRET: z.string().default('mock_meta_app_secret'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('metriflow_verify_token_2026'),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@metriflow.pk'),
  SUPER_ADMIN_PASSWORD: z.string().default('SuperAdminPass2026!'),
  SUPER_ADMIN_NAME: z.string().default('MetriFlow SuperAdmin'),
  BILLING_MODE: z.enum(['manual', 'mock']).default('manual'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
