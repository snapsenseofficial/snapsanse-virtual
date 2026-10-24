#!/usr/bin/env bash
# Redeploy snapsensecatalogue.netlify.app with the portfolio add-on (crew/sites/catalogue-addon)
# and the full portfolio site as a page at /portfolio/ (copied live from snapsenseportfolio.netlify.app).
# Takes the live sites' current files, overlays the add-on, and deploys the zip through the Netlify API.
# Photos are fetched at deploy time, so none are stored in this repo.
# Auth: a Network secret on api.netlify.com (Bearer), injected by the agent proxy. Needs *.netlify.app allowed.
# Usage: crew/tools/sitedeploy/deploy-catalogue.sh [--dry-run]
set -euo pipefail
SITE_ID=dfa2c43e-67a1-4b73-a0e8-9e76f8417d46
SITE=https://snapsensecatalogue.netlify.app
PF_ID=070a2c6e-f9fc-4def-bd06-f8225d76b6b6
PF_SITE=https://snapsenseportfolio.netlify.app
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
pf_deploy=$(curl -sSf "$API/sites/$PF_ID" | jq -r .published_deploy.id)
curl -sSf "$API/deploys/$pf_deploy/files" | jq -r '.[].path' > "$WORK/pf-paths"
mkdir -p "$WORK/site/portfolio"
while read -r f; do
  mkdir -p "$WORK/site/portfolio$(dirname "$f")"
  curl -sSf "$PF_SITE$f" -o "$WORK/site/portfolio$f"
done < "$WORK/pf-paths"
python3 "$ROOT/crew/sites/portfolio-patch/patch.py" "$WORK/site/portfolio/index.html"
grep -q 'js/pf-add.js' "$WORK/site/index.html"
(cd "$WORK/site" && zip -qr "$WORK/site.zip" .)
echo "files: $(wc -l < "$WORK/paths") catalogue + $(wc -l < "$WORK/pf-paths") portfolio + add-on; zip $(du -h "$WORK/site.zip" | cut -f1)"
if [ "${1:-}" = "--dry-run" ]; then
  [ -n "${KEEP:-}" ] && { rm -rf "$KEEP"; cp -r "$WORK/site" "$KEEP"; echo "kept in $KEEP"; }
  exit 0
fi
curl -sS -X POST -H "Content-Type: application/zip" --data-binary @"$WORK/site.zip" "$API/sites/$SITE_ID/deploys" \
  | jq '{id, state, error, error_message, url: .ssl_url}'
