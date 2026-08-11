# Bundled Planning-Board Template

RepoWorkshop 0.2.1 includes a dependency-free board at [`skills/repository-planning-workshop/templates/board/`](../skills/repository-planning-workshop/templates/board/). Copy it into an approved project-local workshop boundary; installed files remain immutable.

The example and implementation use the same [canonical data contract](../skills/repository-planning-workshop/references/canonical-data-contract.md): typed IDs, validated evidence and research baseline, `sha256:` baseline/manifest/state/snapshot digests, Unicode-scalar canonical JSON, exact answer order, and strict unknown/duplicate-key rejection. The manifest self-digest omits only `manifestDigest`. State self-digest omits only `stateDigest`. The browser receives the validated canonical manifest projection and derives all records from it.

An absent state produces a no-write synthesized revision `0`. This value exists only at the GET/API boundary so a first save can use `expectedRevision: 0`; persisted revisions are always at least `1`. Server-owned revision, timestamp, readiness, and `stateDigest` are recomputed on every save. A ready persisted state can produce the exact approved-selection snapshot consumed by Retrieve/Plan.

Readiness fails with focusable record IDs for unfinished dispositions, missing reasons, direct or transitive Build dependencies that are disabled/non-Build, required dependency decisions that are unanswered, and unresolved/contradictory blockers. Selecting Custom with blank text is a valid saved draft but remains unanswered; optional unanswered choices do not block.

Persistence uses no-follow opens where available, post-open regular-file/mode checks, handle writes, temp fsync, close, validated owner-only backup preservation, atomic same-directory rename, and directory fsync where supported. Recovery returns a prior validated backup rather than corrupted final state. Only generated owned temporary names are cleaned.

The HTTP server has strict Host/Origin/media/framing checks, JSON 413 overflow responses, four concurrent mutation slots, body and connection caps, and explicit header/request/keep-alive timeouts. This bounds one local process; it does not provide DoS resistance, authentication, authorization, TLS, or multi-user merging. Prefer loopback.

Exports remain `.txt`, begin `REVIEW ONLY - NON-AUTHORITATIVE`, and render all user-controlled multiline content as escaped indented plain text. Deterministic pure UI tests run without runtime dependencies. The optional installed-Chromium check explicitly skips when unavailable and must not be reported as browser coverage when skipped.

See the template [README](../skills/repository-planning-workshop/templates/board/README.md) for copy/launch commands and the [security model](security-model.md) for trust boundaries.
