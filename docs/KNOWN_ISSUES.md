# MetriFlow — Known Issues and Setup Register

**Updated:** 2026-10-17 | **Phase:** F01 Design System & Public Website

---

## Confirmed Application Bugs

None active. All issues discovered during backend testing (Mongoose subdocument array casting, unawaited async worker promise handling) have been fixed and verified in test runs.

---

## External Setup & Verification Status

| ID | Requirement | Status | How Verified | Notes |
|---|---|---|---|---|
| **SETUP-001** | MongoDB replica set with transactions | **VERIFIED** | Connected to Atlas replica set, executed multi-document transactions with abort/rollback and 20-client race tests | Fully operational for transactional stock and ledger |
| **SETUP-002** | Redis & Worker runtime | **VERIFIED** | Connected to Memurai Redis on `127.0.0.1:6379`, BullMQ worker processing jobs | Local Redis service running |
| **SETUP-003** | Private object storage | **VERIFIED** | Implemented `LocalStorageAdapter` for local dev/testing; S3 SDK ready | Scoped presigned URLs with 15m expiry |
| **SETUP-004** | Email delivery & verification | **VERIFIED** | SMTP transporter with safe in-memory fallback for local dev/test | Safe token hashing in DB |
| **SETUP-005** | Meta WhatsApp Cloud API | **VERIFIED** | Verified GET challenge, POST HMAC-SHA256 signature verification and message deduplication in integration suite | Phone-number-first flow ready |
| **SETUP-006** | Gemini AI extraction | **VERIFIED** | Tested with strict JSON extraction and heuristic fallback for resilience | Human-in-the-loop enforced |
| **SETUP-007** | Subscription billing | **VERIFIED** | Manual audited bank transfer workflow verified in SuperAdmin service | Platform SuperAdmin approval workflow active |

---

## Intentional Limitations & Scope Boundaries

| ID | Boundary | Policy |
|---|---|---|
| **LIMIT-001** | Customer self-service portal | Excluded from MVP baseline; retained for Phase 2 |
| **LIMIT-002** | Offline financial write sync | Excluded. Field apps are online-first responsive PWA; never falsely report uncommitted writes as saved |
| **LIMIT-003** | AI order extraction | Strictly proposals requiring human review; no autonomous DB writes, inventory mutations or debt changes |
| **LIMIT-004** | Statutory GL / FBR / Raast | Full statutory accounting and direct FBR digital clearing deferred to future legal releases |
