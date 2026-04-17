# FIXIT — Architecture Document

> **Status:** TEMPLATE — Claude Code fills in every `[FILL IN]` section during the Discovery Phase, then pauses for review before building.

---

## 1. Executive Summary

FIXIT is a sub-product of YourFormSux that enables practitioners to assign exercises to patients, patients to record themselves performing those exercises (front + side angles with on-screen grid), and the existing YourFormSux AI form-analysis engine to score each session. Practitioners review videos and AI output and submit structured feedback (1–5 rating + good/improve comments) that becomes training data for AI improvement. An admin role oversees the entire platform.

**Deployment target:** `FIXIT.yourformsux.com`

**Core reuse from YourFormSux:**
- AI pose detection / form-analysis engine
- UI component library / design system

---

## 2. Discovery Findings

### 2.1 Existing Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | [FILL IN] | App Router or Pages Router: [FILL IN] |
| Language | TypeScript | [FILL IN] | Strict mode? [FILL IN] |
| UI library | [FILL IN] | [FILL IN] | Path: [FILL IN] |
| Design tokens | [FILL IN] | — | Tailwind config / CSS vars location: [FILL IN] |
| State management | [FILL IN] | — | e.g., React Query, Zustand, Redux |
| Data layer / ORM | [FILL IN] | [FILL IN] | e.g., Prisma, Drizzle |
| Database | [FILL IN] | [FILL IN] | e.g., Postgres on Neon/Supabase/RDS |
| Auth provider | [FILL IN] | — | e.g., NextAuth, Clerk, custom |
| Email | [FILL IN] | — | e.g., Resend, SendGrid, Postmark |
| Blob/file storage | [FILL IN] | — | e.g., S3, R2, Mux |
| Hosting | [FILL IN] | — | e.g., Vercel, AWS |
| Error tracking | [FILL IN] | — | e.g., Sentry |
| Testing | [FILL IN] | — | e.g., Vitest + Playwright |

### 2.2 AI Analysis Engine (CRITICAL — Reuse As-Is)

- **Location in repo:** [FILL IN — file path]
- **Entry function / API:** [FILL IN — signature]
- **Input format:** [FILL IN — video file? frame array? pre-extracted keypoints?]
- **Output schema:** [FILL IN — paste actual JSON shape]
- **Runtime:** [FILL IN — server route, edge function, background worker, separate microservice?]
- **Latency:** [FILL IN — typical p50/p95]
- **Model versioning:** [FILL IN — does it already report a version? If not, propose how to add]
- **Multi-angle support:** [FILL IN — does it accept two videos (front + side) or only one? If only one, propose wrapper strategy]

**Wrapper plan for FIXIT:**
[FILL IN — describe the thin server-side wrapper that takes front_video + side_video + exercise_type, calls the engine, normalizes the output, stamps it with model version, persists the result.]

### 2.3 UI Component Library (Reuse)

- **Location:** [FILL IN — `packages/ui/`, `src/components/`, etc.]
- **Patterns:** [FILL IN — compound components? headless + styled?]
- **How to add a new component:** [FILL IN]
- **Components available that FIXIT will reuse:** [FILL IN — list: Button, Card, Modal, Table, Toast, FormField, etc.]
- **Components FIXIT needs that don't exist (and must be built):** [FILL IN — e.g., CameraRecorder, GridOverlay, RatingStars, VideoPlayerWithAnalysis]

### 2.4 Auth & User Model

- **Current user model fields:** [FILL IN]
- **Has role concept?** [FILL IN — yes/no; if yes, current values]
- **Extension plan for FIXIT roles:**
  - Add `role` enum: `admin | practitioner | patient`
  - Add `practitioner_id` (nullable FK on `users`, set when role = `patient`)
  - [FILL IN — any other fields needed]
- **Route guards / middleware:** [FILL IN — describe Next.js middleware approach]

### 2.5 Email Infrastructure

- **Provider:** [FILL IN]
- **Existing email helper:** [FILL IN — path/function]
- **Templates location:** [FILL IN]
- **New FIXIT templates needed:**
  - `patient_invited`
  - `exercise_assigned`
  - `recording_submitted` (to practitioner)
  - `feedback_received` (to patient)

### 2.6 Video / Blob Storage

- **Existing storage:** [FILL IN — provider, bucket structure]
- **Upload flow currently used:** [FILL IN — direct from browser via signed URL? proxied through API?]
- **Plan for FIXIT video storage:**
  - Bucket / prefix: [FILL IN]
  - Naming: `sessions/{session_id}/{front|side}.{ext}`
  - Signed URL TTL: 15 minutes for playback
  - Lifecycle: retain indefinitely (overridable by admin with audit trail)

---

## 3. Reuse vs. New

### Reused As-Is
- AI form-analysis engine (called via wrapper)
- UI components: [FILL IN — specific list]
- Auth provider integration
- Email sending helper
- Blob storage SDK / upload helper
- Error tracking SDK

### Extended
- User model (add `role`, `practitioner_id`)
- Auth middleware (add role-based route guards)
- Shared layout / nav (add FIXIT entries when on `FIXIT.yourformsux.com`)

### New for FIXIT
- Database tables: `exercises`, `assignments`, `sessions`, `feedback`, `audit_log`
- Pages under `/` (subdomain root):
  - Patient: `/`, `/exercises/[assignmentId]`, `/exercises/[assignmentId]/record`, `/history`
  - Practitioner: `/practitioner`, `/practitioner/patients`, `/practitioner/patients/[id]`, `/practitioner/sessions/[sessionId]`
  - Admin: `/admin`, `/admin/practitioners`, `/admin/patients`, `/admin/sessions`, `/admin/dashboard`
- API routes:
  - `POST /api/assignments` (practitioner creates)
  - `POST /api/sessions` (patient submits — triggers AI)
  - `POST /api/sessions/[id]/feedback` (practitioner submits feedback)
  - `GET /api/admin/metrics` (dashboard data)
- Components: `CameraRecorder`, `GridOverlay`, `DualAngleCapture`, `RatingStars`, `VideoPlayerWithAnalysis`, `MetricsCard`
- AI wrapper service
- Admin metrics aggregation queries

---

## 4. Subdomain Strategy

**Approach:** [FILL IN — choose one and justify]

- **Option A — Same Next.js app, middleware rewrite:** Single deployment; middleware detects `FIXIT.yourformsux.com` and rewrites to `/fixit/*` internally. Simplest if FIXIT shares the same auth session and database.
- **Option B — Separate Vercel project:** Independent deployments; shared packages via monorepo. Better isolation; more deploy overhead.
- **Option C — Next.js multi-zones:** [FILL IN if relevant]

**DNS:** Add CNAME `FIXIT` → [FILL IN — Vercel target]

**Cookie scope:** Set auth cookie domain to `.yourformsux.com` so SSO works across subdomains.

---

## 5. Compliance & Security Posture

- **Regulatory scope:** [FILL IN — HIPAA / PIPEDA / GDPR? Confirm with stakeholder]
- **Data classification:** Patient session data = sensitive personal health data
- **Encryption:** TLS 1.2+ in transit; storage encrypted at rest (provider-managed)
- **Access control:** Role-enforced at middleware AND API handler level (defense in depth)
- **Audit logging:** Every admin or practitioner read of patient data writes to `audit_log`
- **Signed URLs:** All video access via short-lived signed URLs (15 min)
- **PII in logs:** Forbidden — strip emails, names from error tracking payloads
- **Data retention:** Indefinite by default; admin can soft-delete with audit trail; hard-delete requires admin action and logging

---

## 6. Risks & Open Questions

| # | Risk / Question | Owner | Status |
|---|---|---|---|
| 1 | AI engine accepts only single video — wrapper must handle two | Eng | [FILL IN] |
| 2 | Compliance scope (HIPAA?) — affects logging and storage | Product | Open |
| 3 | Practitioner onboarding: invite-only vs. self-signup | Product | Open |
| 4 | Max video length per angle (default 60s) | Product | Open |
| 5 | Re-submission after feedback allowed? | Product | Open |
| 6 | Mobile camera quality on low-end Android | Eng | To test |
| 7 | Storage cost projection (2 videos × N sessions × M patients) | Eng | [FILL IN] |

---

## 7. Build Plan (Vertical Slices)

1. Discovery + this doc → **PAUSE FOR REVIEW**
2. DB migrations + seed script
3. Auth role extension + route guards
4. Subdomain routing + base layout
5. Practitioner: add patient → assign exercise → email
6. Patient: see assignments → record (front + side, grid) → upload
7. AI wrapper → run on submission → store with model version
8. Practitioner review + structured feedback → email patient
9. Patient history view
10. Admin dashboard
11. E2E tests (all three roles)
12. Deploy to staging `FIXIT.yourformsux.com`

---

## 8. Sign-Off

- [ ] Stack confirmed
- [ ] AI engine integration plan approved
- [ ] UI reuse list approved
- [ ] Subdomain approach approved
- [ ] Compliance posture confirmed
- [ ] Open questions resolved or accepted as deferred

**Approved by:** ____________________ **Date:** ____________
