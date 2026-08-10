# Example State Recovery Devplan

This abbreviated example demonstrates structure; generated plans use every field in the [full template](../skills/repository-planning-workshop/templates/devplan-template.md).

## Authority and source

- Saved state: revision `7` at `2026-08-10T13:00:00Z`
- Manifest/state/snapshot digests: `sha256:<sanitized>`
- Freshness: relevant evidence unchanged; `notes/local.txt` is unrelated drift and remains untouched

## Approved scope

| ID | Outcome | Disposition | Selected decisions | Dependencies |
| --- | --- | --- | --- | --- |
| EPIC-001 | Recover interrupted state replacement deterministically | Build | DEC-001=DEC-001-OPT-02 | none |

## Milestone 1: Durable recovery boundary

- IDs: `EPIC-001`
- Outcome: restart chooses the newest fully valid revision and preserves the prior valid copy.
- Dependencies/topological basis: first and only DAG node.
- Scope: state module recovery, corruption refusal, operator documentation.
- Exclusions: no format migration and no multi-user locking.
- Approved decisions: bounded backup plus deterministic validation before promotion.
- Likely files/services: `src/state/store.ts`, `test/state/store.test.ts`, `docs/recovery.md`.
- Focused tests: `npm test -- test/state/store.test.ts` covering interrupted writes and corrupt candidates.
- Owning typecheck: `npm run typecheck`.
- Documentation: update authoritative recovery runbook in this milestone.
- Diff/status gate: inspect all changes; keep `notes/local.txt` unstaged and untouched.
- Failure rule: stop before staging on any failed required check.
- Rollback/recovery: retain previous valid state and disable candidate promotion.
- Commit boundary: proposed `feat: recover interrupted state writes` only after authorization.
