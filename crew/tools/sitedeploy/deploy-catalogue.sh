#!/usr/bin/env bash
# Redeploy snapsensecatalogue.netlify.app with the portfolio add-on (crew/sites/catalogue-addon).
# Takes the live site's current files, overlays the add-on, and deploys the zip through the Netlify API.
# Auth: a Network secret on api.netlify.com (Bearer), injected by the agent proxy. Needs *.netlify.app allowed.
# Usage: crew/tools/sitedeploy/deploy-catalogue.sh [--dry-run]
set -euo pipefail
SITE_ID=dfa2c43e-67a1-4b73-a0e8-9e76f8417d46
SITE=https://snapsensecatalogue.netlify.app
API=https://api.netlify.com/api/v1
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
ADDON="$ROOT/crew/sites/catalogue-addon"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

deploy_id=$(curl -sSf "$API/sites/$SITE_ID" | jq -r .published_deploy.id)
curl -sSf "$API/deploys/$deploy_id/files" | jq -r '.[].path' > "$WORK/paths"
mkdir -p "$WORK/site"
while read -r f; do
  mkdir -p "$WORK/site$(dirname "$f")"
  curl -sSf "$SITE$f" -o "$WORK/site$f"
done < "$WORK/paths"
cp -r "$ADDON"/. "$WORK/site/"
grep -q 'js/pf-add.js' "$WORK/site/index.html"
(cd "$WORK/site" && zip -qr "$WORK/site.zip" .)
echo "files: $(wc -l < "$WORK/paths") + add-on; zip $(du -h "$WORK/site.zip" | cut -f1)"
[ "${1:-}" = "--dry-run" ] && exit 0
curl -sS -X POST -H "Content-Type: application/zip" --data-binary @"$WORK/site.zip" "$API/sites/$SITE_ID/deploys" \
  | jq '{id, state, error, error_message, url: .ssl_url}'
