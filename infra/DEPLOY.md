# FIXIT AWS Deployment Guide

## Architecture

```
GitHub (main branch)
  ↓ push
GitHub Actions
  ├── Build SPA → S3 bucket
  └── Deploy Lambda → AWS Lambda
         ↓
CloudFront CDN
  ├── /* → S3 (static SPA)
  └── /api/* → API Gateway → Lambda functions
         ↓
fixit.yourformsux.com
```

## Prerequisites

1. **AWS CLI** installed and configured
2. **AWS SAM CLI** installed (`brew install aws-sam-cli`)
3. **ACM Certificate** in `us-east-1` for `fixit.yourformsux.com`

## Step 1: Create ACM Certificate

```bash
# Must be in us-east-1 for CloudFront
aws acm request-certificate \
  --domain-name fixit.yourformsux.com \
  --validation-method DNS \
  --region us-east-1
```

Add the CNAME validation record to your DNS, then wait for validation.

## Step 2: Deploy Infrastructure with SAM

```bash
cd infra

sam build

sam deploy --guided \
  --stack-name fixit-prod \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DomainName=fixit.yourformsux.com \
    CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID \
    StripeSecretKey=sk_test_... \
    StripeWebhookSecret=whsec_... \
    StripePriceBasic=price_1TZE7pConA0Be4ywWSHEB3vz \
    StripePricePro=price_1TZE7sConA0Be4ywnSScdY1c \
    FirebaseProjectId=fixit-6167d \
    FirebaseClientEmail=firebase-adminsdk-...@fixit-6167d.iam.gserviceaccount.com \
    FirebasePrivateKey="-----BEGIN PRIVATE KEY-----\n..."
```

Note the outputs: `CloudFrontDomainName`, `S3BucketName`, `CloudFrontDistributionId`.

## Step 3: Point DNS

Add a CNAME record:
```
fixit.yourformsux.com → d1234567890.cloudfront.net
```

## Step 4: Set up GitHub Actions

In your GitHub repo, go to **Settings > Secrets and variables > Actions** and add:

| Secret | Value |
|--------|-------|
| `AWS_DEPLOY_ROLE_ARN` | ARN of IAM role for GitHub Actions (OIDC) |
| `CLOUDFRONT_DISTRIBUTION_ID` | From SAM output |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | fixit-6167d.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | fixit-6167d |
| `VITE_FIREBASE_STORAGE_BUCKET` | fixit-6167d.firebasestorage.app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 1080637793002 |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |
| `VITE_STRIPE_PUBLISHABLE_KEY` | pk_test_... |
| `VITE_STRIPE_PRICE_BASIC` | price_1TZE7p... |
| `VITE_STRIPE_PRICE_PRO` | price_1TZE7s... |

### Create IAM OIDC Role for GitHub Actions

```bash
# 1. Create OIDC provider (one-time)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Create role with trust policy (replace OWNER/REPO)
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
      }
    }
  }]
}
EOF

aws iam create-role \
  --role-name fixit-github-deploy \
  --assume-role-policy-document file://trust-policy.json

# 3. Attach policies
aws iam attach-role-policy --role-name fixit-github-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name fixit-github-deploy \
  --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess
aws iam attach-role-policy --role-name fixit-github-deploy \
  --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess
```

## Step 5: Update Stripe Webhook URL

Update the webhook endpoint in Stripe to:
```
https://fixit.yourformsux.com/api/stripe-webhook
```

(CloudFront routes `/api/*` to API Gateway → Lambda)

## Step 6: Deploy

Push to `main` branch — GitHub Actions will:
1. Build the SPA with all VITE_ env vars baked in
2. Sync `dist/` to S3
3. Invalidate CloudFront cache for `index.html`
4. Update Lambda function code

## Manual Deploy (without GitHub Actions)

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://fixit.yourformsux.com-site --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"

# Deploy Lambda
cd lambda && npm ci
zip -r ../lambda-package.zip .
aws lambda update-function-code \
  --function-name fixit-create-checkout-session \
  --zip-file fileb://../lambda-package.zip
```

## SEO prerender routing — CloudFront Function (REQUIRED for guides to be served)

The site is a prerendered SPA: `npm run build` writes static `dist/guides/<slug>/index.html`
for every guide. But the live CloudFront distribution serves S3 via OAC, which does
**not** resolve subfolder `index.html`, and maps `403/404 → /index.html`. So without a
URL rewrite, `/guides/<slug>` misses in S3 → 403 → the empty CSR shell, and crawlers
never see the prerendered pages.

The fix is a CloudFront Function (`infra/cloudfront/spa-rewrite.js`) attached to the
distribution's default behavior. The live distribution (`E2FAZUAO8YL8YA`) was created
manually and is **not** managed by this SAM template, so apply it with the committed,
idempotent script rather than `sam deploy`:

```bash
bash infra/cloudfront/apply-spa-rewrite.sh   # safe to re-run; no-ops if already attached
```

Run this once (and again only if `spa-rewrite.js` changes or the distribution is
recreated — set `FIXIT_DIST_ID` to override the target). The function code is the
version-controlled source of truth; `infra/template.yaml` also declares it for the day
the infra is adopted into CloudFormation.

> Long-term: to eliminate infra drift, import the existing bucket + distribution into a
> CloudFormation stack (`aws cloudformation create-change-set --change-set-type IMPORT`)
> and manage everything via `sam deploy`. Until then, this script is the durable path.

## Cost Estimate (monthly)

| Service | Estimated Cost |
|---------|---------------|
| S3 | ~$0.50 (static files) |
| CloudFront | ~$1-5 (depending on traffic) |
| Lambda | ~$0 (free tier: 1M requests/mo) |
| API Gateway | ~$0 (free tier: 1M requests/mo) |
| ACM Certificate | Free |
| **Total** | **~$2-6/mo** |

Much cheaper than Vercel Pro ($20/mo).
