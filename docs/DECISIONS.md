# MetriFlow — Decision Register

**Updated:** 2026-10-17 | **Status:** B01 Baseline Decisions Recorded

---

## Baseline Architecture Decisions

| ID | Decision | Reason and Consequence | Status |
| --- | --- | --- | --- |
| **ADR-001** | TypeScript modular monolith with React/Vite web, Express API and separate BullMQ worker | Shares contracts and keeps business transactions together; avoids premature microservice overhead while running background jobs asynchronously. | ACCEPTED |
| **ADR-002** | MongoDB replica set with short ACID multi-document transactions | Critical financial and inventory operations (dispatch, confirmation, invoicing, journals, outbox) require atomic commit and rollback. Standalone Mongo is disallowed. | ACCEPTED |
| **ADR-003** | Shared validated REST contracts under `/api/v1` and OpenAPI 3.1 documentation | Frontend, API, and worker share strongly typed schemas. Runtime Zod validation guarantees boundary safety. | ACCEPTED |
| **ADR-004** | Membership-derived tenant context and server authorization | Prevents user-controlled organization IDs from spoofing tenant context. All data queries and mutations are scoped to the authenticated tenant. | ACCEPTED |
| **ADR-005** | Opaque server sessions, Argon2id passwords, and cookie protections | Enables immediate session revocation, CSRF origin checking, and audit tracking. MFA (TOTP) protects privileged owner/admin and platform roles. | ACCEPTED |
| **ADR-006** | Integer paisa (BSON Int64) and explicit decimal quantity contracts | Eliminates floating-point rounding errors. Amounts transmitted as integer strings. Explicit unit conversions. | ACCEPTED |
| **ADR-007** | Immutable movements and balanced internal double-entry journals | Financial corrections use linked reversals/credits with actor and reason. Source documents remain auditable. | ACCEPTED |
| **ADR-008** | Reserve stock on confirmation; invoice only actual dispatched quantities | Drafts have no stock/receivable impact. Partial dispatch creates partial invoices; remainder cancellation releases remaining reservations cleanly. | ACCEPTED |
| **ADR-009** | Moving weighted-average cost (WAC) per SKU and warehouse | Computes true inventory valuation and gross margin at dispatch time. Returns restore original issue cost. | ACCEPTED |
| **ADR-010** | MongoDB Transactional Outbox + Redis/BullMQ worker | Guarantees business data and event intents commit atomically before async dispatch to email, WhatsApp, or queues. | ACCEPTED |
| **ADR-011** | Human-reviewed Gemini suggestions behind server-side adapter | AI extracts text and voice order draft proposals against catalog grounding. Deterministic code calculates prices and checks limits; humans must approve. | ACCEPTED |
| **ADR-012** | Meta WhatsApp Cloud API v4 Embedded Signup & webhook signature verification | Integrates official Cloud API v4. Inbound webhooks are signature-verified (HMAC-SHA256) and deduplicated before acknowledgment. | ACCEPTED |
| **ADR-013** | Online-first responsive web/PWA | Supports office desktop and field mobile workflows without offline write conflicts. Never reports uncommitted offline data as saved. | ACCEPTED |
| **ADR-014** | Private S3-compatible object storage + Local adapter | Private buckets only. Scoped expiring presigned URLs for upload and download. Never exposes permanent public URLs. | ACCEPTED |
| **ADR-015** | Seven MVP role templates; platform admin segregated from tenant data | Owner/Admin, Sales/Order Desk, Accountant, Warehouse Staff, Field Salesman, Delivery Staff, Platform Super Admin. Platform support access requires audited grant. | ACCEPTED |
| **ADR-016** | SaaS subscription billing separate from customer khata | Wholesaler SaaS platform billing (Starter, Business, Pro) uses audited manual bank transfer verification; customer AR/AP is tenant-specific. | ACCEPTED |
| **ADR-017** | Backend-first execution order before frontend development | Complete backend (B01–B09) and verification gate (B10) must be passed before frontend (F01–F05) is built. | ACCEPTED |

---

## Resolved Setup & Technology Decisions

### ADR-018: Runtime & Package Manager
- **Date:** 2026-10-17
- **Status:** ACCEPTED
- **Context:** Pin supported environment and tools for development and production.
- **Decision:** Node.js v24.x LTS with `npm` (v12.x) in a clean monorepo structure:
  - `apps/api`: Express REST API modular monolith.
  - `apps/worker`: BullMQ background worker.
  - `apps/web`: React 18/19 + Vite + TanStack Query frontend.
  - `packages/contracts`: Shared TypeScript types, schemas, and OpenAPI models.

### ADR-019: MongoDB ODM Selection
- **Date:** 2026-10-17
- **Status:** ACCEPTED
- **Context:** Select between native MongoDB driver and Mongoose for transactional modular monolith.
- **Decision:** **Mongoose v8.x** with TypeScript.
  - Schema-level type checking and default value management.
  - Built-in transaction session management (`session.withTransaction()` / `await session.abortTransaction()`).
  - Strict model validation prevents untrusted schema mutations.

### ADR-020: Pakistani Wholesaler Billing Gateway
- **Date:** 2026-10-17
- **Status:** ACCEPTED
- **Context:** Card payment gateway availability in Pakistan for B2B SaaS.
- **Decision:** Implement **Audited Manual Bank Transfer Billing** (with bank deposit proof, IBAN/Raast transaction ID, platform admin verification, and plan state transitions `TRIAL` -> `ACTIVE` -> `PAST_DUE` -> `SUSPENDED`). A pluggable `BillingGateway` interface supports mock card testing and future Raast direct integration.
