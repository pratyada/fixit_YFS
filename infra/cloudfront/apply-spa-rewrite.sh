#!/usr/bin/env bash
#
# Idempotent: ensures the SPA-rewrite CloudFront Function exists, is published,
# and is attached to the FIXIT distribution's default cache behavior.
# Safe to run any number of times — it only calls update-distribution when the
# association is actually missing or points elsewhere (so it won't trigger a
# needless CloudFront propagation on every run / CI build).
#
# Usage:  bash infra/cloudfront/apply-spa-rewrite.sh
# Rollback: re-run with FunctionAssociations Quantity 0, or detach in the console.
set -euo pipefail

DIST_ID="${FIXIT_DIST_ID:-E2FAZUAO8YL8YA}"   # override via env if the distro changes
NAME="fixit-spa-rewrite"
HERE="$(cd "$(dirname "$0")" && pwd)"
CODE="$HERE/spa-rewrite.js"

echo "→ Ensuring function '$NAME' exists and matches repo code…"
if aws cloudfront describe-function --name "$NAME" >/dev/null 2>&1; then
  FE=$(aws cloudfront describe-function --name "$NAME" --query ETag --output text)
  aws cloudfront update-function --name "$NAME" --if-match "$FE" \
    --function-config Comment="Append index.html for prerendered pages",Runtime="cloudfront-js-2.0" \
    --function-code "fileb://$CODE" >/dev/null
else
  aws cloudfront create-function --name "$NAME" \
    --function-config Comment="Append index.html for prerendered pages",Runtime="cloudfront-js-2.0" \
    --function-code "fileb://$CODE" >/dev/null
fi

echo "→ Publishing DEVELOPMENT → LIVE…"
FE=$(aws cloudfront describe-function --name "$NAME" --query ETag --output text)
aws cloudfront publish-function --name "$NAME" --if-match "$FE" >/dev/null
ARN=$(aws cloudfront describe-function --name "$NAME" \
  --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)

echo "→ Checking current association on $DIST_ID…"
TMP=$(mktemp -d)
aws cloudfront get-distribution-config --id "$DIST_ID" > "$TMP/full.json"
CURRENT=$(python3 -c "
import json
b=json.load(open('$TMP/full.json'))['DistributionConfig']['DefaultCacheBehavior']
fa=b.get('FunctionAssociations',{})
items=fa.get('Items') or []
print(items[0]['FunctionARN'] if items else '')
")

if [ "$CURRENT" = "$ARN" ]; then
  echo "✓ Already attached — no distribution change needed."
  exit 0
fi

echo "→ Attaching function to default behavior…"
DE=$(python3 -c "import json;print(json.load(open('$TMP/full.json'))['ETag'])")
python3 - "$TMP/full.json" "$ARN" > "$TMP/config.json" <<'PY'
import json,sys
cfg=json.load(open(sys.argv[1]))['DistributionConfig']
cfg['DefaultCacheBehavior']['FunctionAssociations']={
  'Quantity':1,'Items':[{'EventType':'viewer-request','FunctionARN':sys.argv[2]}]
}
json.dump(cfg,sys.stdout)
PY
aws cloudfront update-distribution --id "$DIST_ID" \
  --distribution-config "file://$TMP/config.json" --if-match "$DE" >/dev/null

echo "✓ Attached. CloudFront is propagating (a few minutes)."
echo "  Verify: curl -sI https://fixit.yourformsux.com/guides/hyrox-training-guide-toronto | grep -i content-type"
