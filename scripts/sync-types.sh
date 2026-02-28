#!/bin/bash

# medbot-mobile/scripts/sync-types.sh
# Synchronizes shared TypeScript types from frontend to medbot-mobile.
# Fail on drift if --check flag is provided.

set -e

# Find repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# We assume the script is in medbot-mobile/scripts/
# The project root is one level up from medbot-mobile/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SRC_DIR="$PROJECT_ROOT/frontend/packages/shared/src/types"
DEST_DIR="$PROJECT_ROOT/medbot-mobile/src/types"
FILES=("ai.ts" "medical.ts")

CHECK_ONLY=false
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=true
fi

echo "--- Type Sync Contract ---"

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Source directory $SRC_DIR not found."
  # If we are in CI, maybe frontend is not cloned?
  # In that case, we might need a different strategy, but for now we follow the local layout.
  exit 1
fi

DRIFT_DETECTED=0

for FILE in "${FILES[@]}"; do
  SRC_FILE="$SRC_DIR/$FILE"
  DEST_FILE="$DEST_DIR/$FILE"

  if [ ! -f "$SRC_FILE" ]; then
    echo "Error: Source file $SRC_FILE not found."
    exit 1
  fi

  if [ "$CHECK_ONLY" = true ]; then
    if [ ! -f "$DEST_FILE" ]; then
      echo "Drift: $FILE does not exist in destination $DEST_DIR"
      DRIFT_DETECTED=1
      continue
    fi

    if ! diff -q "$SRC_FILE" "$DEST_FILE" > /dev/null; then
      echo "Drift: $FILE has changed."
      diff -u "$DEST_FILE" "$SRC_FILE" || true
      DRIFT_DETECTED=1
    else
      echo "In-sync: $FILE"
    fi
  else
    echo "Copying $FILE to $DEST_DIR..."
    mkdir -p "$DEST_DIR"
    cp "$SRC_FILE" "$DEST_FILE"
  fi
done

if [ "$CHECK_ONLY" = true ] && [ $DRIFT_DETECTED -ne 0 ]; then
  echo "--- FAILED: Type drift detected! ---"
  echo "Run 'make sync-types' from project root to synchronize."
  exit 1
fi

if [ "$CHECK_ONLY" = true ]; then
  echo "--- SUCCESS: All types in sync. ---"
else
  echo "--- SUCCESS: Types synchronized. ---"
fi
