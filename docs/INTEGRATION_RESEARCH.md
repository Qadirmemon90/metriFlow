# MetriFlow — Integration Research Document

**Date Checked:** 2026-10-17  
**Status:** Completed Baseline Research & Architecture Specifications

---

## 1. Meta WhatsApp Cloud API & Embedded Signup

### Business Capability
Customer-owned WhatsApp Business Account (WABA) onboarding, inbound message reception via webhooks, human agent chat replies, order draft extraction trigger, and delivery status tracking.

### Official Documentation
- **Embedded Signup (v4):** https://developers.facebook.com/docs/whatsapp/embedded-signup
- **Cloud API Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Webhooks:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Date Checked:** 2026-10-17

### Deprecation Notice & Version Selection
- **Deprecation Notice:** Embedded Signup v2 and v3 are officially deprecated as of October 15, 2026. Integrations must use Embedded Signup **v4** ("Phone Number First" flow).
- **Graph API Version:** `v21.0` (or `v22.0`).

### Authentication & Authorization
- **Method:** Facebook Login for Business with Embedded Signup flow via JS SDK.
- **Backend Code Exchange:** Web client receives `code` and sends it to `POST /api/v1/integrations/whatsapp/exchange`.
- **Backend API Call:**
  `GET https://graph.facebook.com/v21.0/oauth/access_token?client_id={app-id}&client_secret={app-secret}&code={code}`
- Returns long-lived System User Access Token / Business User Access Token.
- **Required Scopes/Permissions:**
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`

### Verification & Asset Retrieval
1. Debug/Verify Token: `GET https://graph.facebook.com/v21.0/debug_token?input_token={token}`
2. Fetch Shared WABA and Phone Numbers:
   - `GET https://graph.facebook.com/v21.0/{waba_id}/phone_numbers`
3. Register Phone Number for Cloud API:
   - `POST https://graph.facebook.com/v21.0/{phone_number_id}/register`
   - Payload: `{"messaging_product": "whatsapp", "pin": "{pin}"}`
4. Subscribe WABA to Webhooks:
   - `POST https://graph.facebook.com/v21.0/{waba_id}/subscribed_apps`

### Webhook Configuration & Security
- **Challenge Verification (GET):**
  Validates `hub.mode === 'subscribe'` and `hub.verify_token === WHATSAPP_WEBHOOK_VERIFY_TOKEN`, returning `hub.challenge`.
- **Event Signature Verification (POST):**
  Header `X-Hub-Signature-256: sha256={hash}`. Must compute HMAC-SHA256 of the raw body using `META_APP_SECRET` and compare via constant-time buffer comparison (`crypto.timingSafeEqual`).
- **Deduplication:**
  Every inbound message has an `entry[].changes[].value.messages[].id`. Store message IDs in durable database records with a unique index on `(tenantId, providerMessageId)` to prevent duplicate ingestion.
- **Tenant Connection Mapping:**
  Map inbound events using `entry[].changes[].value.metadata.phone_number_id` or `waba_id` to the tenant's `WhatsAppConnection` document. Reject unmapped or cross-tenant events.

### Outbound Messaging Controls
- **24-Hour Customer Service Window:** Free-form session replies allowed within 24 hours of customer's last message.
- **Outside Window:** Requires pre-approved message templates (`messages` endpoint with `type: "template"`).
- **Idempotency & Re-send:** Never blindly resend. Status transitions: `QUEUED` -> `SENT` -> `DELIVERED` -> `READ` / `FAILED`.

### Environment Variables
- `META_APP_ID`: Meta Developer App ID
- `META_APP_SECRET`: Meta App Secret for code exchange and webhook HMAC
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Random 64-char string for webhook challenge verification
- `WHATSAPP_API_VERSION`: `v21.0`

---

## 2. Google Gemini AI (Text & Audio Order Drafts)

### Business Capability
Bounded extraction of customer order text and voice notes into structured order draft proposals (SKU candidate matching, quantities, units, shipping notes), requiring human review and approval prior to order confirmation.

### Official Documentation
- **Google Gen AI / Gemini API:** https://ai.google.dev/docs/gemini_api
- **Structured Outputs Guide:** https://ai.google.dev/gemini-api/docs/structured-output
- **Date Checked:** 2026-10-17

### SDK & Model Selection
- **SDK:** `@google/genai` or `@google/generative-ai` v0.24+
- **Model Identifier:** `gemini-1.5-flash` (tested, fast, cost-effective, supports audio/multimodal and JSON schema enforcement).
- **Fallback / Deep Reasoning Model:** `gemini-1.5-pro` (configurable via `GEMINI_MODEL`).

### Guardrails & Non-Negotiable Boundaries
- **No Autonomous Posting:** AI is strictly an information extractor. It receives NO database, shell, or financial posting tools.
- **Catalog Grounding:** Tenant product catalog (SKU, name, allowed units, packaging) is passed in prompt context. Matches must reference actual catalog SKU IDs.
- **Strict JSON Schema:** Server forces output to conform to `OrderDraftExtraction` schema:
  - `items`: array of `{ catalogProductId, rawText, matchedSku, quantity, unit, confidence, ambiguityNote }`
  - `customerNotes`: string
  - `confidenceScore`: number (0 to 1)
  - `ambiguities`: array of strings
- **Deterministic Calculation:** Prices, stock checks, credit checks, taxes, and totals are computed strictly by deterministic TypeScript domain services, never by the AI model.

### Audio Processing
- Voice messages (.ogg Opus, .mp3, .wav) received from WhatsApp are validated for size (< 10MB) and passed as inline base64 audio data with correct MIME type to `gemini-1.5-flash` for joint transcription and order extraction.

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL`: Default `gemini-1.5-flash`

---

## 3. Transactional Email

### Business Capability
Account verification, password reset, team invitations, and critical operational notifications.

### Official Documentation & Protocol
- **SMTP Protocol (RFC 5321) & Nodemailer:** https://nodemailer.com/
- **Date Checked:** 2026-10-17

### Architecture & Adapters
- Pluggable `EmailService` interface:
  - `SmtpEmailAdapter`: Connects to standard SMTP server (AWS SES, Mailgun, Brevo, SendGrid, or Mailtrap).
  - `MemoryEmailAdapter` / `ConsoleEmailAdapter`: In-memory capture for local development and test automation.
- Expiring tokens: Single-use SHA-256 hashed tokens stored in DB with TTL (15 min for reset/verification, 7 days for team invitations).

### Environment Variables
- `SMTP_HOST`: Hostname (e.g. `smtp.mailtrap.io` or `email-smtp.us-east-1.amazonaws.com`)
- `SMTP_PORT`: Port (e.g. `587` or `2525`)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: From header (e.g. `MetriFlow <no-reply@metriflow.pk>`)
- `EMAIL_ADAPTER`: `smtp` | `memory` | `console`

---

## 4. Private Object Storage

### Business Capability
Secure, tenant-isolated storage for payment proof images, delivery proof signatures/photos, WhatsApp media attachments, and server-generated PDF invoices/challans.

### Official Documentation
- **AWS SDK for JavaScript v3 (S3):** https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
- **S3 Presigned URLs:** https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- **Date Checked:** 2026-10-17

### Security & Access Control
- **No Public Buckets:** Storage bucket is completely private.
- **Authorized Uploads:** Client requests presigned upload URL via authenticated endpoint. Server checks tenant membership, validates file size and MIME type, and returns an expiring presigned `PUT` URL (15-minute TTL).
- **Authorized Downloads:** Downloads require authenticated endpoint that issues an expiring presigned `GET` URL or streams through server authorization.
- **Tenant Isolation:** Object keys are prefixed with `tenants/{tenantId}/{category}/{uuid}-{filename}`.
- **Local Adapter:** A robust `LocalStorageAdapter` stores files in a private disk directory with stream serving and access validation for development and offline testing.

### Environment Variables
- `STORAGE_DRIVER`: `s3` | `local`
- `S3_ENDPOINT`: S3 endpoint (optional for MinIO / Wasabi / Cloudflare R2)
- `S3_REGION`: AWS / S3 region (e.g. `ap-southeast-1` or `us-east-1`)
- `S3_BUCKET`: Private bucket name
- `S3_ACCESS_KEY_ID`: S3 Access Key ID
- `S3_SECRET_ACCESS_KEY`: S3 Secret Access Key
- `LOCAL_STORAGE_DIR`: Absolute or relative path for local storage files

---

## 5. Database & Queue Infrastructure

### Business Capability
ACID multi-document transactions for stock and financial consistency; persistent BullMQ job queue for asynchronous email, WhatsApp dispatch, outbox sweepers, and recovery reminders.

### Official Documentation
- **MongoDB Transactions:** https://www.mongodb.com/docs/manual/core/transactions/
- **Mongoose v8 API:** https://mongoosejs.com/docs/transactions.html
- **BullMQ Documentation:** https://docs.bullmq.io/
- **Date Checked:** 2026-10-17

### Specifications
- **MongoDB:**
  - Cluster: MongoDB replica set (MongoDB Atlas / local replica set).
  - Driver/ODM: Mongoose v8.x with TypeScript schemas.
  - Multi-document transactions (`session.withTransaction`) ensure atomic commits for dispatch, invoicing, stock movements, balanced journals, customer credit exposure, audit logs, and outbox records.
- **Redis / BullMQ:**
  - Redis 6.2+ / Memurai 8.x (Windows) / Upstash Redis.
  - Separate BullMQ worker process (`apps/worker`) processes durable outbox jobs.
  - Queue names: `outbox-queue`, `email-queue`, `whatsapp-queue`, `reminder-queue`.
  - Concurrency, rate limits, exponential backoff (5 retries), and Dead Letter Queue (`failed-jobs`).

### Environment Variables
- `MONGODB_URI`: Replica set connection string (with `retryWrites=true&w=majority`)
- `REDIS_URL`: `redis://127.0.0.1:6379` or Upstash Redis URL

---

## 6. Subscription Billing Operations

### Business Capability
Pakistani wholesaler SaaS subscription management (plans: Starter, Business, Pro), trial periods, quotas, invoice generation, manual bank wire / Raast verification, and audited tenant entitlement activation.

### Official Documentation & Pakistani Market Research
- **Merchant Card Acquiring Reality:** International processors (Stripe) do not support domestic merchant acquiring in Pakistan without offshore legal entities. Local payment gateways (PayFast, Safepay, 1Link) require corporate SECP registration and merchant banking approval.
- **Implementation Strategy:**
  - Pluggable `BillingProvider` interface:
    - `ManualBankBillingProvider`: Implemented production-ready workflow for Pakistani B2B wholesale. Tenant uploads bank transfer receipt / Raast transaction reference. Platform Super Admin reviews receipt, enters transaction reference, and activates/renews subscription with audit trail.
    - `MockCardBillingProvider`: For automated test fixtures and sandbox simulation.
  - Clean separation: Platform subscription billing records and quotas are stored in platform administrative collections, strictly segregated from tenant customer khata.

### Environment Variables
- `BILLING_MODE`: `manual` | `mock`
- `PLATFORM_BANK_DETAILS`: Bank name, account title, IBAN, Raast ID displayed on billing invoice

---

## 7. Identity & Optional Google Sign-In

### Business Capability
Optional Google OIDC login for user identity authentication, kept strictly separate from tenant data access authorization.

### Official Documentation
- **Google Identity Services (OIDC):** https://developers.google.com/identity/gsi/web/guides/overview
- **Token Verification:** https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

### Security Rules
- Authenticate via Google ID Token (JWT) signed by Google (`accounts.google.com`).
- Server verifies token signature, audience (`GOOGLE_CLIENT_ID`), issuer, and expiry using `google-auth-library`.
- Account linking: Identify users by `issuer` + `sub` (Google Subject ID). NEVER silently link an existing password-based account solely on email match without user-verified confirmation.
- Tenant scoping: Google sign-in only authenticates the person. Tenant access is derived from active `OrganizationMembership` records.

### Environment Variables
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Web Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret (server-side exchange if code flow used)

---

## 8. Deferred / Optional Integrations

The following integrations are formally recorded as **DEFERRED** outside the MVP baseline:
1. **Google Sheets / Drive Export:** Deferred to Phase 2. When implemented, narrow per-file permissions (`drive.file`) must be used with explicit separate consent.
2. **Shopify Integration:** Deferred to Phase 2.
3. **Courier Platforms (TCS, Leopards, Trax):** Deferred to Phase 2.
4. **FBR Digital Invoicing & Raast Instant Clearing:** Deferred until statutory POS/e-invoicing mandates for wholesale distribution are finalized.
