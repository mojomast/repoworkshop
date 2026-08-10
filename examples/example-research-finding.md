# Example Research Finding

This is sanitized illustrative data, not evidence from a real repository.

```yaml
id: AD-F001
kind: gap
statement: The write API has optimistic revisions, but the documented recovery path does not cover a process interruption between temporary-file flush and rename.
status: partial
evidence:
  - id: EVID-AD-001
    type: file-line
    path: src/state/store.ts
    startLine: 40
    endLine: 88
    revision: worktree
    contentSha256: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    capturedAt: 2026-08-10T12:00:00Z
    baselineDigest: sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    redactedResult: Atomic replacement validates expectedRevision; recovery behavior is not represented in this bounded range.
    resultTruncated: false
    note: Supports the implemented revision and replacement behavior only.
    confidence: high
fact_or_recommendation: fact
confidence: medium
uncertainty: Recovery may be specified in an excluded operator runbook.
exclusions:
  - private-operations/
dependencies: []
```

The finding avoids claiming global absence, records an exclusion, and contains only a bounded redacted result—not raw command output.
