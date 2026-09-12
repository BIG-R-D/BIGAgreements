#!/usr/bin/env bash
# Produce ready-to-paste Railway variable files with fresh secrets.
#
# Writes .env.railway-api.local and .env.railway-frontend.local at the repo
# root. Both match the existing `.env.*` gitignore rule, so they cannot be
# committed by accident.
#
# Generate a SEPARATE set for staging and for production. Never share secrets
# between environments, never commit these files, never paste them into chat.
#
# Usage: scripts/generate-railway-env.sh [--force]
set -euo pipefail

cd "$(dirname "$0")/.."

API_OUT=".env.railway-api.local"
FE_OUT=".env.railway-frontend.local"
force="${1:-}"

for f in "$API_OUT" "$FE_OUT"; do
  if [ -e "$f" ] && [ "$force" != "--force" ]; then
    echo "error: $f already exists. Refusing to overwrite live secrets." >&2
    echo "Re-run with --force if you really mean to regenerate them." >&2
    exit 1
  fi
done

# Fail loudly rather than emitting a file with weak or empty secrets.
command -v openssl >/dev/null || { echo "error: openssl not found" >&2; exit 1; }

secret() {
  local v
  v="$(openssl rand -hex 32)"
  [ "${#v}" -eq 64 ] || { echo "error: openssl produced ${#v} chars, expected 64" >&2; exit 1; }
  printf '%s' "$v"
}

DOWNLOAD="$(secret)"
USERKEYS="$(secret)"
HANDOFF="$(secret)"

if [ "$DOWNLOAD" = "$USERKEYS" ] || [ "$DOWNLOAD" = "$HANDOFF" ] || [ "$USERKEYS" = "$HANDOFF" ]; then
  echo "error: generated secrets collided — aborting" >&2
  exit 1
fi

sed \
  -e "s|^DOWNLOAD_SIGNING_SECRET=.*|DOWNLOAD_SIGNING_SECRET=${DOWNLOAD}|" \
  -e "s|^USER_API_KEYS_ENCRYPTION_SECRET=.*|USER_API_KEYS_ENCRYPTION_SECRET=${USERKEYS}|" \
  -e "s|^AUTH_HANDOFF_ENCRYPTION_SECRET=.*|AUTH_HANDOFF_ENCRYPTION_SECRET=${HANDOFF}|" \
  -e "s|^# <PASTE ...> values. Safe to commit: contains no secrets.$|# CONTAINS REAL SECRETS. Gitignored. Do not commit or share.|" \
  docs/railway/api.env.example > "$API_OUT"

cp docs/railway/frontend.env.example "$FE_OUT"

chmod 600 "$API_OUT" "$FE_OUT"

echo "Wrote $API_OUT and $FE_OUT (mode 600)."
echo
echo "Next:"
echo "  1. Fill every <PASTE ...> value in $API_OUT"
echo "  2. Railway -> api -> Variables -> Raw Editor -> paste the file"
echo "  3. Railway -> frontend -> Variables -> Raw Editor -> paste $FE_OUT"
echo
echo "Confirm they are ignored:  git check-ignore -v $API_OUT"
