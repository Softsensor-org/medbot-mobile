#!/usr/bin/env bash
# FIX-023: Mobile gate runner with env validation, timeout diagnostics,
# and machine-readable output (gate-results.json).
#
# Usage:
#   ./scripts/run-gate.sh                    # Run all gates (lint, typecheck, test)
#   ./scripts/run-gate.sh test               # Run only tests
#   GATE_TIMEOUT=180 ./scripts/run-gate.sh   # Custom timeout (seconds)
#
# Exit codes:
#   0   — All gates passed
#   1   — Gate failed
#   124 — Gate timed out (diagnostics captured to stderr)
#
# Outputs:
#   gate-results.json — Machine-readable gate results in the repo root
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_ROOT="$(dirname "$SCRIPT_DIR")"
GATE_RESULTS="$MOBILE_ROOT/gate-results.json"
START_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --- Configuration ---
GATE_TIMEOUT="${GATE_TIMEOUT:-300}"  # 5 minute default
GATE_TARGET="${1:-all}"

declare -a GATE_NAMES=()
declare -a GATE_STATUSES=()

write_gate_results() {
    local overall_status="$1"
    local exit_code="$2"
    local detail="${3:-}"

    local sub_gates="["
    for i in "${!GATE_NAMES[@]}"; do
        [[ $i -gt 0 ]] && sub_gates+=","
        sub_gates+="{\"name\":\"${GATE_NAMES[$i]}\",\"status\":\"${GATE_STATUSES[$i]}\"}"
    done
    sub_gates+="]"

    cat > "$GATE_RESULTS" <<JSONEOF
{
  "gate": "mobile",
  "status": "$overall_status",
  "exit_code": $exit_code,
  "started_at": "$START_TIME",
  "finished_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "timeout_seconds": $GATE_TIMEOUT,
  "target": "$GATE_TARGET",
  "sub_gates": $sub_gates,
  "detail": "$detail"
}
JSONEOF
    echo "[INFO] Gate results written to $GATE_RESULTS"
}

# --- Phase 1: Fail-fast environment validation ---
echo "=== Mobile Gate: Environment Validation ==="

if ! command -v node &>/dev/null; then
    echo "[FAIL] node not found. Install Node.js first."
    write_gate_results "failed" 1 "node not found"
    exit 1
fi
echo "[PASS] Node: $(node --version)"

if ! command -v npm &>/dev/null; then
    echo "[FAIL] npm not found."
    write_gate_results "failed" 1 "npm not found"
    exit 1
fi
echo "[PASS] npm: $(npm --version)"

if [[ ! -d "$MOBILE_ROOT/node_modules" ]]; then
    echo "[FAIL] node_modules missing. Run 'npm install' first."
    write_gate_results "failed" 1 "node_modules missing"
    exit 1
fi
echo "[PASS] node_modules present"
echo ""

# --- Phase 2: Run gate(s) with timeout ---
cd "$MOBILE_ROOT"

run_with_timeout() {
    local label="$1"
    shift
    local cmd=("$@")

    echo "=== Mobile Gate: $label (timeout=${GATE_TIMEOUT}s) ==="
    local gate_exit=0
    timeout --signal=TERM --kill-after=10 "$GATE_TIMEOUT" "${cmd[@]}" || gate_exit=$?

    if [[ "$gate_exit" -eq 124 ]]; then
        echo "" >&2
        echo "=== TIMEOUT DIAGNOSTICS (exit 124) — $label ===" >&2
        echo "Gate '$label' timed out after ${GATE_TIMEOUT}s." >&2
        echo "" >&2
        echo "--- Active Node processes ---" >&2
        ps aux | grep -E "[n]ode|[j]est|[e]sbuild" >&2 || true
        echo "" >&2
        GATE_NAMES+=("$label")
        GATE_STATUSES+=("timeout")
        write_gate_results "timeout" 124 "Gate '$label' timed out after ${GATE_TIMEOUT}s"
        exit 124
    fi

    if [[ "$gate_exit" -ne 0 ]]; then
        echo "=== Mobile Gate: $label FAILED (exit $gate_exit) ==="
        GATE_NAMES+=("$label")
        GATE_STATUSES+=("failed")
        write_gate_results "failed" "$gate_exit" "Gate '$label' failed with exit $gate_exit"
        exit "$gate_exit"
    fi
    echo "=== Mobile Gate: $label PASSED ==="
    GATE_NAMES+=("$label")
    GATE_STATUSES+=("passed")
    echo ""
}

case "$GATE_TARGET" in
    lint)
        run_with_timeout "Lint" npm run lint
        ;;
    typecheck)
        run_with_timeout "TypeCheck" npm run typecheck
        ;;
    test)
        run_with_timeout "Test" npm test -- --ci --passWithNoTests
        ;;
    all)
        run_with_timeout "Lint" npm run lint
        run_with_timeout "TypeCheck" npm run typecheck
        run_with_timeout "Test" npm test -- --ci --passWithNoTests
        ;;
    *)
        echo "Unknown gate target: $GATE_TARGET"
        echo "Usage: $0 [all|lint|typecheck|test]"
        exit 1
        ;;
esac

echo "=== Mobile Gate: ALL PASSED ==="
write_gate_results "passed" 0
