# MetriFlow — Phase Plan (Backend-First Execution)

Version: 3.0 | Updated: 2026-10-18 | Status: All Milestones Completed & Fully Verified

## Execution Order Notice

Execution has followed the strict **backend-first order**:
1. Research and architecture inspection. (COMPLETED)
2. Complete backend implementation (B01–B09). (COMPLETED)
3. Backend verification and required integration testing (B10). (COMPLETED)
4. Formal Backend Readiness Gate clearance (`docs/BACKEND_READINESS.md`). (COMPLETED)
5. Product frontend implementation against verified API contracts (F01–F05). (COMPLETED)
6. End-to-end browser-to-database verification. (COMPLETED — 12/12 steps in `tests/e2e-workflow.test.ts`)
7. Staging, operational readiness, and production release verdict. (COMPLETED — `docs/DEPLOYMENT.md`)

---

## Traceability Mapping (Original P00–P11 to Milestones)

| Original Phase | Scope & Acceptance Criteria | Execution Milestone | Status |
|---|---|---|---|
| **P00** | Contracts, scope, architecture & baseline decisions | **B01** (Infrastructure & Contracts) | COMPLETED |
| **P01** | Runnable API, worker, DB replica set, Redis, errors & logging | **B01** (Infrastructure & Contracts) | COMPLETED |
| **P02** | Auth, organization signup, hashed sessions, roles, tenant isolation | **B02** (Authentication & Tenancy) | COMPLETED |
| **P03** | Master data (catalog, customers, suppliers) & idempotent CSV imports | **B03** (Master Data & Imports) | COMPLETED |
| **P04** | Movements, reservations, weighted-average cost, journals, outbox | **B04** (Stock & Financial Foundations) | COMPLETED |
| **P05** | Draft orders, atomic confirmation, partial dispatch, invoices/challans | **B05** (Manual Sales) | COMPLETED |
| **P06** | Collections, verification, allocations, credits, returns, supplier bills | **B06** (Payments, Returns & Suppliers) | COMPLETED |
| **P07** | Field salesman & delivery staff APIs, assignments, proof of delivery | **B07** (Field & Delivery APIs) | COMPLETED |
| **P08** | WhatsApp Cloud API v4, webhooks, deduplication, messaging adapter | **B08** (External Integrations) | COMPLETED |
| **P09** | Gemini AI order extraction, strict JSON schemas, human-in-the-loop | **B08** (External Integrations) | COMPLETED |
| **P10** | Aging khata, promises to pay, disputes, expenses, deterministic reports | **B09** (Recovery & Reporting) | COMPLETED |
| **P11** | SaaS plans, platform admin, audited manual billing, operational metrics | **B09** (Platform Operations) & **B10** | COMPLETED |
| **Frontend** | Marketing site, business web app, mobile field views, admin UI | **F01–F05** (Post Backend Readiness Gate) | COMPLETED |
| **E2E/OPS** | End-to-end lifecycle verification, staging, operational readiness | **E2E & OPS** (Final Release Verification) | COMPLETED |

---

## Backend Milestones (B01–B10)

### B01 — Infrastructure, Configuration and Contracts
- [x] API (`apps/api`), worker (`apps/worker`), and contracts (`packages/contracts`) bootstrap.
- [x] Runtime configuration validation with Zod / clean error reporting.
- [x] MongoDB replica set connection with multi-document ACID transaction support.
- [x] Redis / BullMQ connection and worker bootstrap.
- [x] Private object storage adapter (S3-compatible + local dev adapter).
- [x] Health (`/health`) and readiness (`/ready`) endpoints with dependency status checks.
- [x] Redacted structured logging, unique trace IDs (`X-Trace-Id`), and unified error handling.
- [x] OpenAPI 3.1 specification and `/api/v1/docs` contract documentation.
- [x] Database index management and schema versioning.

### B02 — Authentication and Tenancy
- [x] Signup, organization creation, and single-use email verification tokens.
- [x] Login/logout with Argon2id password hashing and hashed opaque server sessions.
- [x] Password reset flow with expiring single-use tokens.
- [x] Organization memberships, invitations, and role-action permission matrix (7 roles).
- [x] Strict server-enforced tenant isolation (derived from session, never from request body `orgId`).
- [x] Assignment scopes (branch, warehouse, assigned salesman/customer).
- [x] Privileged MFA support (TOTP RFC 6238) for Owner/Admin and Platform Super Admin.
- [x] Optional Google Sign-In via validated ID tokens (issuer/subject binding; no silent password merging).
- [x] Immutable audit log infrastructure recording tenant, actor, action, trace ID, timestamp, and metadata.

### B03 — Master Data and Imports
- [x] Organization settings, branches, and warehouse master data.
- [x] Products, SKUs, barcode, units of measure, and tiered price lists.
- [x] Customers, suppliers, assigned salesmen, credit limits, and credit terms (days).
- [x] Search, filtering, and cursor-based pagination (default 25, max 100).
- [x] CSV import pipeline: validation, preview, row-level error reporting, and explicit commit.
- [x] Idempotent batch commit preventing duplicate SKU or customer imports.
- [x] Soft-delete / archiving of referenced records (no cascade deletes of historical entities).

### B04 — Stock and Financial Foundations
- [x] Opening stock and approved opening balances with cutover audit evidence.
- [x] Goods receipts (GRN) and controlled stock adjustments (reason, actor, movement).
- [x] Physical inventory constraint: `available = onHand - reserved - quarantined` (all >= 0; `reserved + quarantined <= onHand`).
- [x] Moving weighted-average cost (WAC) tracking per SKU and warehouse.
- [x] Balanced internal double-entry journals and separate Customer AR and Supplier AP subledgers.
- [x] Money stored as integer paisa (BSON Int64/NumberLong); transmitted as integer strings.
- [x] Quantities stored with Decimal128 and transmitted as decimal strings.
- [x] Durable idempotency records (`IdempotencyKey` collection) with payload hash validation.
- [x] Transactional Outbox pattern (`OutboxEvent` collection) with BullMQ sweeper worker.
- [x] Automated subledger reconciliation routines.

### B05 — Manual Sales (Order to Invoice)
- [x] Draft orders (no stock reservation, no accounts receivable posted).
- [x] Deterministic line-item pricing, unit conversions, and credit exposure check.
- [x] Atomic order confirmation: serializes customer credit checks and reserves stock within a transaction.
- [x] Partial dispatch workflow: reduces on-hand and reservation; invoices only dispatched quantities.
- [x] Challan and invoice generation from immutable snapshots.
- [x] Remainder order cancellation: safely releases unfulfilled reservations and commitments.
- [x] Authorized invoice/challan PDF rendering engine.

### B06 — Payments, Returns and Supplier Finance
- [x] Field/counter collection submission with payment evidence attachments.
- [x] Independent accountant payment verification (separation of duties: collector cannot verify own collection).
- [x] Many-to-many invoice payment allocations, unapplied customer credits, and overpayment handling.
- [x] Controlled refunds and linked reversals with reason and audit trail.
- [x] Customer returns with sellable quarantine inspection and original issue cost restoration.
- [x] Supplier purchase orders, goods receipts, supplier bills, payments, and AP statements.

### B07 — Field Sales and Delivery APIs
- [x] Salesman-scoped customer list, product catalog, and offline-safe order submission APIs.
- [x] Assigned delivery dispatches with delivery routes and order details.
- [x] Proof of delivery (POD) capture: recipient signature, photo evidence, and timestamp.
- [x] Delivery failure recording with structured reason codes and return-to-warehouse handoff.
- [x] Strict server enforcement: staff cannot access or mutate records outside assigned tenant and scope.

### B08 — External Integrations
- [x] Meta WhatsApp Cloud API v4 Embedded Signup onboarding & backend code exchange.
- [x] WhatsApp webhook challenge verification and HMAC-SHA256 signature verification over raw body.
- [x] Persistent inbound message deduplication (`(tenantId, providerMessageId)`).
- [x] Outbound message adapter: session window validation (24h) and template messaging.
- [x] Google Gemini AI adapter: bounded text/voice audio prompt ingestion with tenant catalog grounding.
- [x] Strict Gemini response schema enforcement; human-in-the-loop review before order confirmation.
- [x] Transactional email adapter: SMTP and local memory transporters.
- [x] Private object storage adapter: presigned upload/download URLs with expiring access tokens.

### B09 — Recovery, Reporting and Platform Operations
- [x] Accounts receivable aging engine (not due, 1–30, 31–60, 61–90, >90 days).
- [x] Follow-ups, promises to pay, disputes, and owner-activated reminder schedules.
- [x] Wholesaler operating expense recording and categorization.
- [x] Deterministic reporting: Net Sales, Gross Profit (using actual issue cost), Net Profit, Cash Flow, Customer Khata Statement, Supplier Statement.
- [x] Platform Super Admin APIs: tenant listing, plan subscription management, audited manual billing verification, operational metrics, and temporary audited support access grants.
- [x] Public contact form and demo request APIs.

### B10 — Backend Verification Gate
- [x] Execute complete automated integration and financial fixture test suite.
- [x] Standard Worked Financial Fixture Verification (PKR paisa calculations, stock levels, AR, cost, gross profit).
- [x] Concurrency and Race Condition Stress Tests (20 simultaneous confirmations against 10 stock items; concurrent credit limit exhaustion).
- [x] Idempotency Replay Verification (repeated identical requests return identical response without duplicate side effects).
- [x] Two-company tenant isolation and role permission boundary tests.
- [x] Outbox recovery, worker crash resilience, and webhook replay tests.
- [x] Compile and sign off `docs/BACKEND_READINESS.md`.

---

## Frontend Milestones (Post Backend Gate Clearance)

- [x] **F01 — Design System & Public Pages:** MetriFlow brand (Navy `#102A43`, Emerald `#047857`, Accent `#10B981`), marketing pages, pricing, contact, login, signup, privacy & terms.
- [x] **F02 — Authentication, Onboarding & Master Data UI:** Signin, MFA, organization settings, team permissions, product catalog, customer khata, supplier directory, and CSV import preview.
- [x] **F03 — Order Management, Dispatch, Invoices & Finance UI:** Orders, confirmation, partial dispatch drawer, challan/invoice viewer, collections verification, payment allocation, returns, and supplier bills.
- [x] **F04 — Mobile Field Sales & Delivery PWA:** Touch-friendly views for salesmen and delivery drivers with assignment filtering and proof capture.
- [x] **F05 — WhatsApp Inbox, AI Review, Reports & Platform Admin UI:** Real-time WhatsApp inbox, AI draft review modal, recovery dashboard, financial reports, subscription management, and platform super admin dashboard.

---

## Final Verification & Release Milestones

- [x] **E2E — End-to-End Workflow Verification:** 12-step wholesale lifecycle verified in `tests/e2e-workflow.test.ts` (30/30 total tests pass).
- [x] **OPS — Deployment & Operational Readiness:** Staging and production configurations, Docker compose, health probes, backup runbooks, and `docs/DEPLOYMENT.md`.
