#!/bin/bash
# release-audit.sh
# Validates mobile app state before production release.

set -e

echo "--- Mobile Release Audit ---"

# 1. Check if app.json/app.config.ts has a valid version
VERSION=$(grep -o '"version": "[0-9.]*"' medbot-mobile/package.json | cut -d'"' -f4)
echo "[CHECK] Package version: $VERSION"
if [[ -z "$VERSION" ]]; then
  echo "[FAIL] Could not determine version from package.json"
  exit 1
fi

# 2. Check for required production env vars (placeholders)
REQUIRED_VARS=("EXPO_PUBLIC_AUTH0_DOMAIN" "EXPO_PUBLIC_AUTH0_CLIENT_ID" "EXPO_PUBLIC_API_URL")
for var in "${REQUIRED_VARS[@]}"; do
  # In CI, these would be checked against actual secrets/env
  echo "[CHECK] Env var requirement: $var"
done

# 3. Check for leftover console.logs (informational)
LOG_COUNT=$(grep -r "console.log" medbot-mobile/src | wc -l || echo 0)
if [ "$LOG_COUNT" -gt 20 ]; then
  echo "[WARN] High number of console.logs detected ($LOG_COUNT). Consider cleaning up for production."
else
  echo "[PASS] Console log count is acceptable ($LOG_COUNT)."
fi

# 4. Validate EAS config existence
if [ -f "medbot-mobile/eas.json" ]; then
  echo "[PASS] eas.json found."
else
  echo "[FAIL] eas.json missing!"
  exit 1
fi

echo "--- Audit Complete: SUCCESS ---"
exit 0
