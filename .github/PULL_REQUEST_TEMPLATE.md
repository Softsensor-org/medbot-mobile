## Ticket
<!-- Required: link to ticket ID from coord/TASKS.md -->
**ID**:

## Summary
<!-- 1-3 bullet points describing what changed and why -->
-

## Changes
<!-- List files changed, grouped by purpose -->

## Quality Gates
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (`tsc --noEmit`)
- [ ] `npm test` passes
- [ ] `scripts/governance-preflight.sh` passes (dual: pre-coding + pre-PR)

## Diff Review
<!-- From `git diff dev...HEAD` -->
- **Intended changes**:
- **Collateral changes**: none
- **Risky changes**: none
- **Unintended removed**: yes

## Security Surface
<!-- Does this PR touch authentication, authorization, PHI/PII, or medical data flows? -->
- [ ] No security-sensitive surfaces touched
- [ ] Security surfaces touched — describe below:

## Rollback
<!-- Required for P0/P1 tickets. For P2+ write "N/A" -->


## Cross-Repo Impact
<!-- Does this PR require coordinated changes in msrv or frontend? -->
- [ ] No cross-repo impact
- [ ] Coordinated with: <!-- link to related PRs -->
