# MetriFlow — Staging, Operational Readiness & Production Deployment Guide

**Version:** 1.0.0  
**Target Environment:** Staging & Multi-Tenant Production  
**Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 / Docker Alpine) or Windows Server  

---

## 1. System Architecture Overview

MetriFlow is structured as a robust modular monolith with clear operational boundaries:

```
                      ┌──────────────────────┐
                      │   Cloudflare / CDN   │ (SSL Termination & WAF)
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │   Nginx (Port 80/443)│
                      └────┬────────────┬────┘
           Static / SPA    │            │ Reverse Proxy /api/v1
       ┌───────────────────┘            └────────────────────┐
┌──────▼────────┐                                    ┌───────▼────────┐
│  apps/web     │                                    │   apps/api     │
│ (React + Vite)│                                    │(Node.js+Express│
└───────────────┘                                    └───────┬────────┘
                                                             │
                  ┌──────────────────────────────────────────┼─────────────────────────┐
                  │                                          │                         │
          ┌───────▼────────┐                         ┌───────▼────────┐        ┌───────▼────────┐
          │ MongoDB Atlas  │ (Replica Set w/ ACID)   │  Redis 7       │        │ Private S3     │
          │  Primary + 2x  │                         │(BullMQ Queues) │        │(Documents/POD) │
          └────────────────┘                         └───────┬────────┘        └────────────────┘
                                                             │
                                                     ┌───────▼────────┐
                                                     │  apps/worker   │ (Asynchronous Outbox
                                                     │ (Node.js BullMQ│  & Integration Engine)
                                                     └────────────────┘
```

---

## 2. Infrastructure Requirements & Pre-Flight Checks

### 2.1 Database: MongoDB Replica Set
- **Mandatory:** MongoDB **v6.0+** or **v7.0+** running as a **replica set** (e.g. MongoDB Atlas M10+ tier or 3-node self-hosted replica set).
- **Justification:** Multi-document ACID transactions (`session.withTransaction`) are strictly enforced for stock reservation, dispatch invoicing, collection verification, and return reversals.
- **Write Concern:** `w: "majority"` to guarantee zero phantom reads or rollback discrepancies.

### 2.2 Cache & Queue: Redis
- **Mandatory:** Redis **v7.0+** (Standalone or Redis Cluster / AWS ElastiCache).
- **Configuration:** Persistence enabled (`appendonly yes`), max memory policy set to `noeviction` for BullMQ queues.

### 2.3 Object Storage: S3-Compatible
- **Storage Driver:** AWS S3, Cloudflare R2, MinIO, or Wasabi.
- **Access Control:** Fully private bucket with access restricted to server-side presigned URLs (15-minute expiration) for invoices, delivery proofs, and payment cheques.

---

## 3. Environment Variable Configuration

Create a production `.env` file from `.env.example`:

```bash
# Node & Application Runtime
NODE_ENV=production
PORT=5000
API_BASE_URL=https://api.metriflow.pk
CLIENT_URL=https://app.metriflow.pk
COOKIE_DOMAIN=.metriflow.pk
COOKIE_SECURE=true

# MongoDB Replica Set (Atlas or Self-Hosted)
MONGODB_URI=mongodb+srv://<prod-user>:<secure-password>@cluster.metriflow.net/MetriFlowProd?retryWrites=true&w=majority

# Redis URL for Queues & Idempotency Cache
REDIS_URL=redis://:<redis-password>@redis.internal.metriflow:6379

# Session Security (Minimum 32 random bytes)
SESSION_SECRET=<generate-via-openssl-rand-hex-32>
SESSION_TTL_HOURS=12

# Private Object Storage
STORAGE_DRIVER=s3
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
S3_REGION=ap-southeast-1
S3_BUCKET=metriflow-prod-documents
S3_ACCESS_KEY_ID=<aws-access-key-id>
S3_SECRET_ACCESS_KEY=<aws-secret-access-key>

# Email Delivery (SendGrid, Mailgun, or Postmark)
EMAIL_ADAPTER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
SMTP_FROM="MetriFlow <no-reply@metriflow.pk>"

# Meta WhatsApp Cloud API v21.0
META_APP_ID=<meta-app-id>
META_APP_SECRET=<meta-app-secret>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<secure-random-token>
WHATSAPP_API_VERSION=v21.0

# Google Gemini AI Adapter
GEMINI_API_KEY=<google-gemini-ai-key>
GEMINI_MODEL=gemini-1.5-flash

# SuperAdmin Bootstrap
SUPER_ADMIN_EMAIL=admin@metriflow.pk
SUPER_ADMIN_PASSWORD=<temporary-strong-password>
SUPER_ADMIN_NAME="MetriFlow Platform Administrator"

# Billing Configuration
BILLING_MODE=manual
```

---

## 4. Staging Deployment (Docker Compose)

For automated staging verification or single-server self-hosting:

```bash
# 1. Clone repository
git clone https://github.com/metriflow/metriflow.git /opt/metriflow
cd /opt/metriflow

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Build and launch services
docker compose -f docker-compose.yml up --build -d

# 4. Inspect container health
docker compose ps
docker compose logs -f api
```

The services will initialize:
- `metriflow-mongo`: Initiates replica set `rs0` on port 27017
- `metriflow-redis`: Listens on port 6379
- `metriflow-api`: Starts Express API on port 5000
- `metriflow-worker`: Listens to BullMQ queue `metriflow-outbox`
- `metriflow-web`: Serves Vite production build via Nginx on port 80

---

## 5. Production Multi-Host Deployment (PM2 / Kubernetes / ECS)

### 5.1 Bare-Metal / VM Deployment with PM2

```bash
# 1. Install Node.js 20 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Build Monorepo
cd /opt/metriflow
npm ci
npm run build

# 3. Start API Cluster & Worker
pm2 start apps/api/dist/index.js --name "metriflow-api" -i max --env production
pm2 start apps/worker/dist/index.js --name "metriflow-worker" -i 2 --env production
pm2 save
pm2 startup
```

### 5.2 Frontend Deployment (Cloudflare Pages / AWS S3 + CloudFront / Nginx)

The frontend build artifact resides in `apps/web/dist`:
```bash
# Deploy static dist directory
npm run build --workspace=@metriflow/web
# Upload apps/web/dist to S3/Cloudflare Pages
```

---

## 6. Health Checks & Monitoring

MetriFlow provides production-ready observability endpoints:

| Endpoint | Purpose | Criteria |
|---|---|---|
| `GET /health` | Liveness probe | Returns HTTP 200 `{ status: "UP", timestamp }` if Node process is responsive. |
| `GET /ready` | Readiness probe | Returns HTTP 200 `{ status: "READY", services: { db: "CONNECTED", redis: "CONNECTED" } }` only when MongoDB replica set and Redis respond within 1000ms. |

---

## 7. Backup & Disaster Recovery Procedures

### 7.1 MongoDB Database Daily Backup
```bash
# Automated Daily Cron Dump
DATE=$(date +%Y-%m-%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --gzip --archive="/backups/mongodb/metriflow_$DATE.gz"

# Ship to secondary encrypted offsite storage
aws s3 cp /backups/mongodb/metriflow_$DATE.gz s3://metriflow-offsite-backups/
```

### 7.2 Restoration Runbook
```bash
# In event of disaster recovery
mongorestore --uri="$MONGODB_URI" --drop --gzip --archive="/backups/mongodb/metriflow_<RESTORE_DATE>.gz"
```

---

## 8. Release Verification Checklist

Prior to routing production traffic:

- [x] All 5 automated test suites pass (30/30 tests: fixture, concurrency, isolation, webhooks, E2E).
- [x] Backend Readiness Gate certified (`docs/BACKEND_READINESS.md`).
- [x] Monorepo TypeScript builds cleanly with zero compile errors (`npm run build`).
- [x] Database replica set transactions verified under concurrent race conditions.
- [x] Maker-checker separation of duties enforced (collectors forbidden from verifying own payments).
- [x] Integer paisa financial arithmetic validated across order dispatches, credits, and khata reports.
- [x] WhatsApp Cloud API webhook HMAC-SHA256 signature verification and message deduplication confirmed.
- [x] AI extraction strictly configured as human-reviewed order proposals with no autonomous database writes.
