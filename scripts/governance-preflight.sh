#!/bin/bash
# governance-preflight.sh
# Validates workspace hygiene and governance compliance before coding/committing.

REPO_ROOT=$(git rev-parse --show-toplevel)
# Find project root by looking for coord directory
PROJECT_ROOT="$REPO_ROOT"
while [[ "$PROJECT_ROOT" != "/" && ! -d "$PROJECT_ROOT/coord" ]]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

if [[ ! -d "$PROJECT_ROOT/coord" ]]; then
  echo "[FAIL] Could not find project root containing 'coord' directory."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
AGENT_NAME=$(echo "$CURRENT_BRANCH" | cut -d'/' -f2 | cut -d'-' -f1)
TICKET_ID=$(echo "$CURRENT_BRANCH" | grep -oiE "[A-Z]{3}-[0-9]{3}" | tr '[:lower:]' '[:upper:]')

echo "--- Governance Preflight Check ---"
echo "Repo: $(basename "$REPO_ROOT")"
echo "Branch: $CURRENT_BRANCH"
echo "Agent: $AGENT_NAME"
echo "Ticket: $TICKET_ID"

# 1. Branch Naming Check
if [[ ! "$CURRENT_BRANCH" =~ ^agent/(claude|codex|gemini)- ]]; then
  if [[ "$CURRENT_BRANCH" == "dev" || "$CURRENT_BRANCH" == "main" ]]; then
    echo "[FAIL] Operating on protected branch '$CURRENT_BRANCH'. Switch to an agent branch."
    exit 1
  fi
  echo "[WARN] Branch '$CURRENT_BRANCH' does not follow 'agent/<agent>-<topic>' convention."
fi

# 2. Lock File Check
if [[ -n "$TICKET_ID" ]]; then
  LOCK_FILE="$PROJECT_ROOT/coord/locks/$TICKET_ID.lock"
  if [[ ! -f "$LOCK_FILE" ]]; then
    echo "[FAIL] No lock file found for $TICKET_ID at $LOCK_FILE."
    echo "       Run 'touch $LOCK_FILE' with required metadata first."
    exit 1
  fi
  echo "[PASS] Lock file exists."
fi

# 3. Worktree Isolation Check
if [[ "$REPO_ROOT" == *"/.worktrees/"* ]]; then
  echo "[PASS] Operating in isolated worktree."
else
  if [[ "$CURRENT_BRANCH" != "dev" && "$CURRENT_BRANCH" != "main" ]]; then
    echo "[WARN] Not in isolated worktree. Use 'git worktree add' per Section 1.4."
  fi
fi

# 4. Dirty Files Check
DIRTY_FILES=$(git status --short | grep -vE "^(\?\?|\s\?\?) \.worktrees/|^\?\? coord/|^\?\? GEMINI.md|^\?\? \.codex/|^\?\? \.claude/")
if [[ -n "$DIRTY_FILES" ]]; then
  echo "[WARN] Out-of-scope dirty files detected:"
  echo "$DIRTY_FILES"
  # Don't exit 1 here yet, just warn as per v4 logging requirement.
else
  echo "[PASS] No out-of-scope dirty files."
fi

echo "--- Preflight Complete ---"
exit 0
