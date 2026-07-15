# FIXIT Marketing Pipeline — deploy guide

AI blog drafting + AI email + subscribers + SES sending w/ open/click tracking,
driven from FIXIT's admin. Built in phases; this doc covers **Phase 0 (infra
foundation)** and how to deploy it.

## What Phase 0 adds

- **3 DynamoDB tables** (first in the stack): `fixit-subscribers` (PK `email`),
  `fixit-email-history` (PK `emailId`), `fixit-blog-posts` (PK `slug`).
- **`fixit-marketing-api` Lambda** (`lambda/marketing-api.js`) behind:
  - `ANY /api/marketing/{proxy+}` — admin routes (Firebase ID token + admin role)
  - `POST /api/subscribe`, `GET /api/unsubscribe` — public
  - `GET /api/marketing/track/*` — public open/click tracking
- IAM for the Lambda: CRUD on the 3 tables, `ses:SendEmail`, and S3 read/write on
  the site bucket (for publishing blog HTML + uploaded images).
- Widened API Gateway CORS (GET/DELETE + `Authorization` header).
- New SAM parameters (below).

Only `GET /api/marketing/ping` is live in Phase 0 — it validates auth + env wiring.
Everything else returns 501 until its phase lands.

## One-time SES setup (required before any email sends)

The chosen sender is **yourformsux@gmail.com** (via SES).

1. **Verify the sender identity:**
   ```bash
   aws ses verify-email-identity --email-address yourformsux@gmail.com --region us-east-1
   ```
   Then click the confirmation link Amazon emails to that Gmail inbox.
2. **Request production access** — SES starts in *sandbox* (can only send to
   verified addresses, ~200/day, 1 msg/sec). Real campaigns need production
   access: AWS Console → SES → Account dashboard → "Request production access".
3. **Deliverability caveat:** sending `From: yourformsux@gmail.com` via SES will
   often fail Gmail's DMARC policy (spam/quarantine at scale). The from-address is
   a single param (`MarketingFromEmail`) — when ready, switch to a domain sender
   (`noreply@yourformsux.com` with SES domain identity + DKIM) with no code change.

## Deploy (standalone stack)

The live FIXIT infra was created manually and is **not** under a CloudFormation
stack, so marketing ships as its **own** self-contained stack
(`infra/marketing/template.yaml`) — it creates only net-new resources (3 tables,
the `fixit-marketing-api` Lambda, and its **own** HTTP API) and references the
existing S3 site bucket by name. Nothing existing is touched.

```bash
cd infra/marketing
sam build
sam deploy --guided \
  --stack-name fixit-marketing \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    FirebaseProjectId=fixit-6167d \
    FirebaseClientEmail=firebase-adminsdk-...@fixit-6167d.iam.gserviceaccount.com \
    FirebasePrivateKey="-----BEGIN PRIVATE KEY-----\n..." \
    AnthropicApiKey=sk-ant-...            # blank OK until Phase 2/3 \
    MarketingFromEmail=yourformsux@gmail.com \
    SuperAdminEmail=<your-admin-email>
```

The stack output **`MarketingApiUrl`** is the marketing API base. Wire the
frontend to it:
- set repo secret **`VITE_MARKETING_API_BASE`** = that URL (used by
  `.github/workflows/deploy.yml` at build), and locally in `.env.local`.

After the stack exists, ordinary pushes to `main` update the Lambda **code** via
the deploy workflow loop (which includes `fixit-marketing-api`). Re-run
`sam deploy` only when `infra/marketing/template.yaml` changes.

> The main FIXIT `infra/template.yaml` is unchanged by marketing — everything
> lives here. Consolidate into one stack later if the infra is ever imported.

## Verify Phase 0

Once deployed + SES-verified, from an admin session (Firebase ID token):
```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
  https://<api>/api/marketing/ping
# → { ok: true, caller: {...}, tables: {...}, fromEmail: "yourformsux@gmail.com" }
```
