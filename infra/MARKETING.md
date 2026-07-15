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

## Deploy

Infra changes are applied by **SAM**, not the GitHub Actions workflow (the CI
only does `s3 sync` + `lambda update-function-code`). So a `sam deploy` is
required whenever `infra/template.yaml` changes.

```bash
cd infra
sam build
sam deploy \
  --stack-name fixit-prod \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AnthropicApiKey=sk-ant-... \
    MarketingFromEmail=yourformsux@gmail.com \
    MarketingReplyTo=yourformsux@gmail.com \
    SuperAdminEmail=<your-admin-email> \
    # ...plus all existing params (Stripe/Firebase/Cert) — reuse saved config
```

> NOTE: the live FIXIT infra was created manually and is **not** currently under a
> CloudFormation stack (see the SEO/CloudFront notes). Before `sam deploy` can
> manage it, the existing bucket/distribution/lambdas must be imported into the
> stack, OR the marketing resources deployed as a **separate** small stack. Decide
> this before first deploy — see "Deploy model decision" below.

After the stack exists, ordinary pushes to `main` update the Lambda code via the
`.github/workflows/deploy.yml` loop (which now includes `fixit-marketing-api`).

## Deploy model decision (before first deploy)

The marketing tables + Lambda can ship two ways:
1. **Separate stack** (`fixit-marketing`) — cleanest given the main infra isn't
   stack-managed yet. Reference the existing S3 bucket/API by name/ARN.
2. **Import existing resources** into one stack, then add marketing — more correct
   long-term, more upfront work.

Recommended: **separate stack** now; consolidate later.

## Verify Phase 0

Once deployed + SES-verified, from an admin session (Firebase ID token):
```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
  https://<api>/api/marketing/ping
# → { ok: true, caller: {...}, tables: {...}, fromEmail: "yourformsux@gmail.com" }
```
