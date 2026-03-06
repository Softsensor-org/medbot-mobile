#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
TRIAGE_DIR="$REPO_ROOT/.triage"
TRIAGE_RESULTS="$REPO_ROOT/triage-results.json"
GATE_RESULTS="$REPO_ROOT/gate-results.json"

mkdir -p "$TRIAGE_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_FILE="$TRIAGE_DIR/triage-${STAMP}.log"
START_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

CMD=(bash "$SCRIPT_DIR/run-gate.sh" "$@")

set +e
"${CMD[@]}" > >(tee "$LOG_FILE") 2>&1
EXIT_CODE=$?
set -e

END_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TIMED_OUT=false
if [[ "$EXIT_CODE" -eq 124 ]]; then
    TIMED_OUT=true
fi

CATEGORY="regression"
if [[ "$EXIT_CODE" -eq 0 ]]; then
    CATEGORY="none"
elif grep -Eqi "node_modules missing|npm not found|node not found|Could not resolve hostname|error connecting to api.github.com|permission denied|No space left on device" "$LOG_FILE"; then
    CATEGORY="sandbox/env"
elif [[ "$EXIT_CODE" -eq 124 ]]; then
    CATEGORY="legacy debt"
fi
if [[ -n "${TRIAGE_CATEGORY_OVERRIDE:-}" ]]; then
    CATEGORY="$TRIAGE_CATEGORY_OVERRIDE"
fi

python3 - "$LOG_FILE" "$TRIAGE_RESULTS" "$START_TIME" "$END_TIME" "$EXIT_CODE" "$TIMED_OUT" "$CATEGORY" "${CMD[*]}" "$GATE_RESULTS" <<'PY'
import json
import re
import sys
from pathlib import Path

log_path = Path(sys.argv[1])
triage_path = Path(sys.argv[2])
start_time = sys.argv[3]
end_time = sys.argv[4]
exit_code = int(sys.argv[5])
timed_out = sys.argv[6].lower() == "true"
category = sys.argv[7]
command = sys.argv[8]
gate_results_path = Path(sys.argv[9])

log_text = log_path.read_text(encoding="utf-8", errors="replace") if log_path.exists() else ""

selectors: list[str] = []
seen = set()
patterns = [
    re.compile(r"^\s*FAILED\s+(\S+::\S+)"),
    re.compile(r"^\s*FAIL\s+(.+)$"),
]
ansi = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")

for line in log_text.splitlines():
    line = ansi.sub("", line).rstrip("\r")
    for pattern in patterns:
        match = pattern.match(line)
        if match:
            selector = match.group(1).strip()
            if selector and selector not in seen:
                seen.add(selector)
                selectors.append(selector)
            break

payload = {
    "repo": "medbot-mobile",
    "status": "passed" if exit_code == 0 else "failed",
    "category": category,
    "command": command,
    "exit_code": exit_code,
    "timed_out": timed_out,
    "started_at": start_time,
    "finished_at": end_time,
    "log_path": str(log_path),
    "gate_results_path": str(gate_results_path),
    "failing_selectors": selectors,
}

if gate_results_path.exists():
    try:
        payload["gate_results"] = json.loads(gate_results_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        payload["gate_results"] = {"error": "invalid_json"}

triage_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
print(f"[INFO] Triage results written to {triage_path}")
PY

exit "$EXIT_CODE"
