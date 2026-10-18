# MetriFlow — Project Rules

Version: 1.0 | Updated: 2026-10-05 | Status: development baseline, implementation unverified

## 1. Purpose and source of truth

MetriFlow helps Pakistani wholesalers manage orders, stock, invoices, customer khata, payments and recovery, including WhatsApp-assisted order entry.

Read this file before changing code, then read [PHASE_PLAN.md](PHASE_PLAN.md), [PROGRESS.md](PROGRESS.md), [DECISIONS.md](DECISIONS.md) and [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

This pack translates `MetriFlow_PRD.pdf` and `MetriFlow_TRD.pdf` v1.0, dated 2026-10-01, into development instructions. It does not certify that their requirements are implemented or approved for production. Keep the source PDFs in `docs/reference/` when adding this pack to the repository; they are not included in this pack.

Precedence: explicit current project-owner instructions → recorded scope/decision changes → PRD business requirements and TRD technical contracts → this implementation pack → UI references. Record contradictions before implementing the affected behavior. UI images are visual concepts; sample values, prices, counts and buttons do not create requirements.

## 2. Product scope

- MVP: organization setup, roles, master data, stock, manual sales, partial dispatch, invoices/challans, customer and supplier subledgers, payment verification, returns, expenses, delivery, recovery, reports, WhatsApp inbox and human-reviewed AI drafts.
- Field workflows are online-first responsive web/PWA experiences. Never show an offline financial write as saved.
- Customer portal, multiwarehouse transfers, OCR, offline write synchronization, Urdu RTL, FBR/Raast integrations, forecasting and continuous route tracking are outside this MVP unless scope is explicitly changed.
- Currency: PKR. Store timestamps in UTC and display business dates in Asia/Karachi. English UI with Roman Urdu help; keep text ready for localization.
- Do not introduce payroll, manufacturing, lending or a full statutory general ledger.

## 3. Roles and authorization

Seven MVP role templates: six tenant roles plus one platform role. The later customer portal adds an eighth role. Owner and Admin are one role template here.

| Role | Intended scope |
| --- | --- |
| Owner/Admin | Organization settings, team, permissions and authorized business oversight |
| Sales/Order Desk | Customers, order entry/review and permitted sales actions |
| Accountant | Authorized payment verification, ledgers, expenses and financial reports |
| Warehouse Staff | Assigned warehouse receipts, stock and dispatch actions |
| Field Salesman | Assigned customers, order creation and collection submission |
| Delivery Staff | Assigned deliveries, proof of delivery and collection submission |
| Platform Super Admin | Platform operations; no automatic access to tenant business data |
| Customer — later release | Own permitted orders, statements and payment submissions |

- Define a route/action permission matrix in P02 before implementing protected workflows. Role names alone are not authorization.
- Enforce organization, branch, warehouse and customer assignments on the server as applicable.
- A collector cannot verify their own collection. A submitted proof is not a verified payment.
- Derive organization context from authenticated membership, never trust a request body's `orgId`.
- Scope queries, aggregations, referenced IDs, background jobs, files, exports and socket rooms to the tenant.
- Platform support access requires a specific tenant grant, reason, expiry and audit trail; never implement a global tenant-data bypass.

## 4. Technology baseline

| Area | Baseline |
| --- | --- |
| Language | TypeScript; supported Node.js LTS, exact version pinned at kickoff |
| Frontend | React, Vite, TanStack Query; responsive, accessible components |
| Backend | Express REST API; modular monolith with separate worker process |
| Contracts | Shared validation schemas and OpenAPI; `/api/v1` routes |
| Database | MongoDB replica set with transactions; driver/ODM choice recorded before use |
| Background work | Redis/BullMQ; durable MongoDB inbox/outbox records |
| Files | Private S3-compatible object storage; server-generated PDFs |
| Realtime | Socket.IO notifications followed by API re-fetch |
| Integrations | WhatsApp Cloud API and Gemini behind server-side adapters |
| Hosting | Static frontend plus persistent API and worker runtime; provider/region undecided |

Suggested layout: `apps/web`, `apps/api`, `apps/worker`, `packages/contracts`, `docs`. Adapt to an existing repository after inspection instead of replacing working structure.

- Pin dependencies and commit the selected package-manager lockfile. Do not mix package managers.
- Use strict TypeScript, explicit domain types and runtime boundary validation. Avoid unchecked `any`.
- Keep controllers thin; domain services own business rules and transaction boundaries.
- Return consistent errors with a trace ID; never expose secrets, stacks or cross-tenant existence details.
- Use expected versions for conflicting edits. Financial commands require durable idempotency keys.
- Use cursor pagination: default 25, maximum 100. Do not embed unbounded histories in documents.
- Financial timestamps, quantities and money must have explicit contracts; no implicit client conversions.

## 5. Non-negotiable business rules

### Money and quantities

- Store money as integer paisa using BSON Int64; transmit it as integer strings. Use BigInt or explicit decimal arithmetic, never binary floating-point arithmetic for financial results.
- Store quantities with Decimal128 and transmit decimal strings; the pilot uses whole pieces with explicit unit conversions.
- Apply HALF_UP rounding at the documented line/tax boundary, then sum. Tax-exclusive calculations are a proposed baseline requiring accountant validation before real invoicing.
- Positive customer balance means the customer owes money; negative balance means customer credit. Supplier balances remain separate.

### Stock and orders

- `available = onHand - reserved - quarantined`. All components are nonnegative; `reserved + quarantined <= onHand`. Quarantined stock is physically on hand.
- Draft orders neither reserve stock nor post a receivable.
- Confirmation atomically checks permissions, version, stock and credit exposure, then reserves stock. Credit exposure includes posted customer AR plus remaining confirmed, uninvoiced commitments, following the agreed credit policy.
- Concurrent confirmations for one customer must serialize credit checks. Stock reservations use conditional writes inside a transaction.
- Dispatch reduces actual stock and reservations and invoices only dispatched quantities. Partial dispatch leaves the remainder open.
- Cancelling an undelivered remainder releases its reservation and commitment; it does not erase existing dispatches or invoices.
- A failed delivery does not automatically undo stock or debt. Use the authorized return/credit process.
- Every stock change has an immutable movement and source reference. Never edit a balance directly to hide a mismatch.
- Moving weighted-average cost is maintained per SKU/warehouse. Dispatch captures issue cost; returns restore original issue cost. Flag missing costs instead of displaying invented profit.

### Finance and payments

- Posted invoices, journal entries and movements are immutable. Correct them with linked credits or reversals, including actor and reason.
- Internal balanced journals support AR/AP and controls; they do not imply a full accounting or tax-compliance product.
- Pending collection evidence has no ledger effect. Verification posts once and supports many-to-many invoice allocations.
- Overpayments remain unapplied customer credit. Invoice paid status is derived from valid allocations and credits, not a manual toggle.
- A reversal posts the equal-and-opposite effect exactly once. Preserve the original record.
- Apply invoice credits consistently and release excess receipt allocations to unapplied credit when necessary.
- Net gross profit = sales excluding tax and returns minus recorded issue costs. Show operating expenses separately.
- Stock dispatch, invoice posting, customer exposure update, audit and outbox event commit atomically. Provider calls and PDF generation happen outside the transaction.

### Import, recovery and AI

- Imports require preview, row errors and explicit commit. Repeating a batch cannot duplicate posted stock or opening balances. Referenced master records are archived rather than deleted.
- Opening balances require a documented cutover and accountant review before real use.
- Aging buckets: not due, 1–30, 31–60, 61–90 and over 90 days. Settle, dispute, consent and opt-out checks apply before recovery messages.
- Recovery schedules need owner activation, permitted templates and send caps. Proposed default window: 09:00–18:00 Asia/Karachi.
- AI extracts suggestions into a strict schema. The server validates catalog IDs, units and quantities; deterministic code calculates price, stock, tax and credit.
- A person must approve an AI draft before order confirmation. AI cannot directly change inventory, post money, forgive debt or send unauthorized messages.
- Treat message text and media as untrusted data, not executable instructions. AI receives no database, shell or payment tools.
- Ambiguous SKUs, dates or units require review. Provider failure leaves a usable manual workflow.

## 6. Security and integration reliability

- Use Argon2id for passwords and hashed opaque server-side sessions in Secure, HttpOnly, SameSite cookies. Enforce CSRF/origin checks and session revocation.
- Verification, password reset and invitations use expiring single-use tokens. Proposed session limits: 12-hour idle, 7-day absolute; record final policy. Require MFA for owner/platform access before production.
- Keep credentials in environment/secret management. Commit only placeholder `.env.example` values. Redact logs, audit snapshots and AI traces.
- Validate uploads, size and media type; use private storage and short-lived authorized access. Do not fetch arbitrary user-provided URLs.
- Verify inbound provider signatures over the raw body. Map the provider connection to a tenant on the server.
- Persist inbound events before acknowledging them; deduplicate on tenant/connection/provider message ID.
- Write business events to an outbox in the same transaction as domain changes. Redis is not the only durable event record.
- Consumers must be idempotent, record completion and support bounded retries, dead-letter handling and safe replay.
- Unknown external send outcomes require reconciliation; never blindly resend a possibly delivered message. Provider acceptance and delivery are distinct states.
- Audit sensitive actions from the phase that introduces them. Include tenant, actor, action, source, timestamp, trace ID and reason where required.
- Check current official provider requirements when implementing an integration; do not treat this document as a frozen provider policy.

## 7. UI and development workflow

- Use the approved visual direction consistently. Mockup values are examples; production screens must show real API data or honest empty/setup/error states.
- Include loading, empty, error, permission-denied and offline states. Support keyboard access and at least 44 px touch targets for field actions.
- Never optimistically mark financial posting as successful. Socket events notify clients; the API remains authoritative.
- Inspect the repository and read these five files at the start of a work session.
- Select one task from the current phase. Explain the intended change briefly, implement a small complete slice, then verify relevant behavior.
- Continue routine reversible work within authorized scope without repeatedly requesting approval. Ask only when a material unresolved business decision or access requirement blocks the next safe step.
- Write tests for tenant isolation, financial/stock invariants, concurrency and replay as those capabilities are introduced. Never postpone correctness until P11.
- Update progress, decisions and known issues after meaningful changes. Record actual commands and results; never invent a passing check or completed integration.
- Keep real credentials and personal/customer data out of fixtures. External actions and production changes need appropriate existing authorization.
- Finish a task with changed files, verified behavior, remaining limitations and the next task. Make a source-control checkpoint when the repository workflow permits.

## 8. Definition of done

A task is done only when its acceptance checks pass, required server authorization and validation exist, relevant tests/build checks pass, and the result is recorded with evidence. A UI-only screen, stub response or mocked provider is not a completed integration.

A phase is done only when all its required checks in [PHASE_PLAN.md](PHASE_PLAN.md) pass. Report unrun checks as `NOT RUN` and unresolved setup as `BLOCKED` or `UNVERIFIED`, never as success.
