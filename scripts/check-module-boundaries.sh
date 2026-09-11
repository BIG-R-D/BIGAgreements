#!/usr/bin/env bash
# Enforce the BIG Agreements / upstream Mike dependency direction.
#
#   BIG code MAY import Mike libraries.
#   Mike code MUST NEVER import BIG code.
#
# A one-way dependency is what keeps `git diff upstream/main` small and keeps
# upstream security fixes cheap to merge. The moment upstream files start
# importing BIG modules, the fork stops being separable and every future sync
# becomes archaeology.
#
# Note the deliberate exception in the design: product branding lives in
# backend/src/lib/branding.ts and frontend/src/app/lib/branding.ts, NOT under
# a big/ directory. Branding is product configuration that upstream files
# legitimately read; treating it as BIG domain code would force this check to
# ship with an exemption on day one.
#
# Usage: scripts/check-module-boundaries.sh
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0

report() {
  echo "::error::$1"
  fail=1
}

# --- Backend: nothing outside backend/src/big/ may import from big/ ----------
if [ -d backend/src/big ]; then
  while IFS= read -r file; do
    case "$file" in
      backend/src/big/*) continue ;;
    esac
    report "$file imports BIG module code; upstream files must not depend on backend/src/big/"
    grep -nE "from \"[^\"]*\bbig/" "$file" || true
  done < <(grep -rlE "from \"[^\"]*\bbig/" backend/src --include='*.ts' --include='*.tsx' 2>/dev/null || true)
else
  echo "backend/src/big/ does not exist yet — nothing to check."
fi

# --- Frontend: nothing outside the (big) route group may import from it ------
if [ -d "frontend/src/app/(big)" ]; then
  while IFS= read -r file; do
    case "$file" in
      "frontend/src/app/(big)/"*) continue ;;
    esac
    report "$file imports BIG route-group code; upstream files must not depend on app/(big)/"
    grep -nE "from \"[^\"]*\(big\)/" "$file" || true
  done < <(grep -rlE "from \"[^\"]*\(big\)/" frontend/src --include='*.ts' --include='*.tsx' 2>/dev/null || true)
else
  echo "frontend/src/app/(big)/ does not exist yet — nothing to check."
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "Dependency direction violated. Move the shared code into a neutral"
  echo "location (lib/) or invert the call so BIG code depends on Mike, not"
  echo "the other way round."
  exit 1
fi

echo "Module boundaries OK."
