# Canonical Data Contract

## Canonical JSON and shared scalars

Manifest, state, checkpoint, snapshots, and digest projections use one algorithm:

1. Accept only JSON null, booleans, NFC strings without lone surrogates, integers in JavaScript's safe range, arrays, and objects. Reject floats, negative zero, duplicate keys, and unknown keys.
2. Sort object keys by Unicode scalar-value sequence; preserve every array order.
3. Use minimal JSON quoting, lowercase `\u00xx` for controls without short escapes, shortest integers, UTF-8, no insignificant whitespace, and no trailing newline.
4. Hash exact bytes with SHA-256 as `sha256:<64 lowercase hex>`.

For a self-digest, omit only that named digest member before canonicalizing. Paths are slash-separated repository-relative strings without absolute roots, backslashes, NUL, empty/`.`/`..` segments. `repo-cwd` is `""` for root or a repository-relative path. Never serialize local absolute paths. Reject unknown fields everywhere.

```text
id := ASCII uppercase stable ID, length 3..64
epic-id := /^EPIC-[0-9]{3,}$/
decision-id := /^DEC-[0-9]{3,}$/
blocker-id := /^BLOCK-[0-9]{3,}$/
option-id := /^DEC-[0-9]{3,}-OPT-[0-9]{2,}$/
confidence := "high" | "medium" | "low"
disposition := "Build" | "Remove" | "Defer" | "Need decision"
priority := "P0" | "P1" | "P2" | "P3"
classification := "present" | "partial" | "missing" | "health" | "deferred"
```

Arrays have unique IDs and are authoritative in stored order. Never derive identity from titles/display order or reuse retired IDs.

## Typed evidence

Every evidence item has `id`, `type`, `capturedAt`, `baselineDigest`, `confidence`, `note` (0..1000), `redactedResult` (0..4000), and `resultTruncated`. Variants add:

```text
FileLineEvidence { type: "file-line", path: repo-path, startLine: integer>=1, endLine: integer>=startLine, revision: worktree|index-stage-0|index-stage-1|index-stage-2|index-stage-3|full-git-id, contentSha256: sha256 }
BinaryFileEvidence { type: "binary-file", path, revision, contentSha256 }
GitEvidence { type: "git-commit"|"git-diff", repository: "local", commit: full-git-id, baseCommit: full-git-id|null, path: repo-path|null, contentSha256: sha256 }
CommandEvidence { type: "command-output", argv: [redacted-string], cwd: repo-cwd, exitCode: integer(-1..255), outputSha256: sha256, maxBytes: integer(1..65536) }
UrlEvidence { type: "external-url", url: absolute-http(s)-url, publisher: string, publishedAt: rfc3339-utc|null, accessedAt: rfc3339-utc, revision: string, contentSha256: sha256 }
```

Line evidence requires real bounds. Binary evidence is whole-file. History claims use Git evidence. Commands contain only bounded redacted output as defined in [the lifecycle](workshop-lifecycle.md). Purely subjective recommendations need no fictitious citation, but factual premises do.

## Canonical manifest

```text
Manifest {
  schemaVersion: 1, manifestVersion: integer(1..2147483647), generatedAt: rfc3339-utc,
  project: ProjectMetadata,
  researchBaseline: ResearchBaseline, baselineDigest: sha256, manifestDigest: sha256,
  limits: { overallNotesMax: integer(1..8000), epicNotesMax: integer(1..2000), decisionCustomMax: integer(1..2000), blockerNoteMax: integer(1..2000) },
  evidence: [Evidence](0..4096), epics: [Epic](0..512), decisions: [Decision](0..256), blockers: [Blocker](0..256)
}
ProjectMetadata {
  displayName: NFC string(1..120), slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ length(1..80)
}
Epic {
  id: epic-id, title: string(1..120), summary: string(0..1000), classification,
  evidenceIds: [id](1..64), dependsOnEpicIds: [epic-id](0..64), requiredDecisionIds: [decision-id](0..64),
  initialEnabled: true, initialDisposition: "Build", suggestedPriority: priority,
  priorityScore: integer(-2..10),
  priorityBreakdown: { impact: 0..3, riskReduction: 0..3, unblocks: 0..2, confidence: 0..2, costPenalty: -2..0 },
  scope: [string](1..64), exclusions: [string](0..64), risks: [string](0..64)
}
Decision {
  id: decision-id, title: string, prompt: string, required: boolean,
  dependsOnDecisionIds: [decision-id](0..64), evidenceIds: [id](1..64), options: [Option](2..4),
  recommendedOptionId: option-id, recommendationRationale: string,
  customAnswer: { allowed: boolean, maxLength: integer(1..2000), validation: "nonblank-trimmed"|"single-line"|"multiline" }
}
Option {
  id: option-id, label: string, implementationShape: string,
  benefits: [string](1..16), costsAndRisks: [string](1..16), migrationAndOperations: string, evidenceIds: [id](1..64)
}
Blocker {
  id: blocker-id, title: string, detail: string, epicIds: [epic-id], decisionIds: [decision-id], evidenceIds: [id](1..64),
  resolutionPredicate: "manual-resolution"|"all-decisions-answered"|"epics-disabled"
}
```

`project` is explicit generation input. It defaults to `Repository Planning Workshop` / `repository-planning-workshop` unless the user intentionally supplies both values; board identity, export, persistence, UI copy/assets, and evidence-derived roadmap content use it as specified in [the board contract](board-spec.md). `manifestDigest` omits itself. `baselineDigest` equals the validated baseline self-digest. Validate all references, option membership/prefixes, bounds, and unique exact order. Epic and decision graphs are DAGs; manifest order breaks topological ties. `priorityScore` equals the breakdown sum and maps `8..10=P0`, `5..7=P1`, `2..4=P2`, otherwise `P3`.

## Canonical saved state

```text
SavedState {
  schemaVersion: 1, baselineDigest: sha256, manifestDigest: sha256, stateDigest: sha256,
  revision: integer(1..9007199254740991), updatedAt: rfc3339-utc, ready: boolean,
  epics: [EpicAnswer](exact manifest order), decisions: [DecisionAnswer](exact order), blockers: [BlockerAnswer](exact order),
  overallNotes: string(0..limits.overallNotesMax)
}
EpicAnswer { id: epic-id, enabled: boolean, disposition, dispositionReason: string(0..1000), notes: bounded-string }
DecisionAnswer { id: decision-id, selectedOptionId: option-id|null, customAnswer: bounded-string|null, notes: string(0..1000) }
BlockerAnswer { id: blocker-id, resolved: boolean, resolutionNote: bounded-string }
```

The server/state boundary owns revision, timestamp, readiness, and `stateDigest`; clients cannot force them. Initial state uses exact manifest order, enables every epic as Build, leaves decisions unselected, blockers unresolved, and notes blank. Recommendations never initialize selection.

At most one selected option or custom answer may exist. A custom value must be allowed, bounded, nonblank/trimmed, and satisfy line policy. A decision is currently required when declared required, referenced by an enabled Build epic, or depended on by another required decision. `Remove` and `Defer` need reasons; enabled `Need decision` is never ready. Disabled epics remain stored but do not enter implementation dependencies.

A blocker predicate is satisfied only when its declared decision/epic/manual condition is true; resolution additionally requires `resolved=true` and a nonblank note. Contradictory resolutions are invalid.

`ready=true` iff schemas/digests/revision/order validate; enabled epics have final dispositions; Build dependencies and required decisions are answered; blockers are inactive; references resolve; both DAGs are acyclic; and no orphan answer exists. An explicitly approved empty Build scope may be ready. Recompute this exact predicate on every save/load.

Persist with optimistic expected revision, strict content type/body limits, symlink-safe owner-only atomic replacement, and no-write reads. Unknown versions or digest mismatch stop. Migration is explicit, one-version, lossless, backup-preserving, and fully revalidated. A manifest change always clears readiness and requires review/save.

## Approved selection snapshot

Retrieve creates one immutable Plan input from fully validated `ready=true` state:

```text
ApprovedSelectionSnapshot {
  schemaVersion: 1, manifestDigest: sha256, baselineDigest: sha256,
  sourceStateRevision: safe-integer, sourceStateDigest: sha256,
  epics: [EpicAnswer](exact order), decisions: [DecisionAnswer](exact order),
  blockers: [{ id: blocker-id, resolved: true, resolutionNote: nonblank-string }](exact order),
  overallNotes: bounded-string, snapshotDigest: sha256
}
```

Copy values exactly—no trimming, inference, recommendation substitution, or label expansion. `snapshotDigest` omits only itself. The canonical snapshot is the sole Retrieve output consumed by Plan.
