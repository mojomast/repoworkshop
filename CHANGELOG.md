# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.5.0 - 2026-08-12

### Changed

- Added a proportional fast path: analysis-only requests stop after synthesis unless a board is explicitly requested or confirmed.
- Reduced pre-delegation work to instructions and baseline metadata; authority/source reads, evidence hashing, detailed phase inventories, and unrelated-checkpoint inspection are deferred until needed.
- Consolidated the default research taxonomy into at most three medium-depth lanes with bounded outputs of five material findings and three candidates each.
- Reduced the default synthesis budget from 12 epics to 6 epics and 3 decisions, with expansion only for explicit exhaustive requests or materially coupled work.
- Replaced repeated broad validation and multiple open-ended reviews with one stable-artifact validation pass, one focused cross-domain review, and affected-check reruns after fixes.
- Directed coordinators to summarize agent reports and successful tests rather than reproducing verbose reports or logs, and to avoid repairing unrelated template defects during generation.

## 0.4.0 - 2026-08-12

### Changed

- The board now renders the actual evidence behind every reference (type, location, note, confidence) instead of opaque IDs, and readiness links open the details panel and focus the specific failing control.
- The approved-selection snapshot now freezes the intent digest and selected-option epic prerequisites, so devplans consume the exact graph the reviewer approved.
- Suggested priority no longer adds confidence to the score; confidence is reported as a separate uncertainty signal, and the score maps `7..8=P0`, `4..6=P1`, `2..3=P2`, otherwise `P3`.
- Research inputs now include the intent digest, so editing the Intent Brief stales research and its dependents.
- Selected nonblank custom answers now require a resolved interpretation with affected epics and accepted risks, even for optional decisions.

### Added

- A concrete synthesis-review gate: the agent presents the epic/decision table and intent digest for user confirmation before generating the board, and presents the drafted Intent Brief for confirm-or-edit before delegation.
- Research guidance for minimum lane coverage (CC/AD/TO), execution-path tracing, disconfirming checks before missing/partial claims, epic granularity and milestone-formation rules, decision topological emission, and a default 12-epic proportionality cap with deferred overflow.
- A sanitized worked example of the Intent Brief, evidence-chained epic, and option prerequisites.

## 0.3.0 - 2026-08-12

### Changed

- Added an explicit intent brief, outcome/acceptance-oriented epics, evidence-to-intervention maps, effort/horizon/change-map context, and required reviewer acknowledgement before planning can be ready.
- Require reviewer-approved Build priorities and rationale plus selected-decision rationale and accepted risks; selected option prerequisites and incompatibilities now participate in readiness.
- Expanded the board review UI and devplan contract to show evidence/tradeoffs and carry approved outcomes, priorities, risks, and certainty boundaries into execution planning.
- Require agents to ask a bounded clarification batch when material intent required to create a board is absent.

## 0.2.2 - 2026-08-11

### Security

- Anchored every state read, temporary, backup, rename, cleanup, and fsync operation to one retained and inode-verified state-directory descriptor, with deterministic swap-race coverage and fail-closed unsupported-platform behavior.

### Fixed

- Unified server and browser readiness in one isomorphic evaluator with predicate-complete parity coverage and authoritative-equivalent pre-save failures.
- Rendered multiline and single-line custom answers with matching controls, limits, and validation behavior while preserving optional blank drafts.
- Replaced the synthetic optional browser check with an actual served-board capability/security/DOM/320px smoke and clarified that deterministic tests cover pure helpers and static wiring only.

### Changed

- Updated active package, plugin, marketplace, validator, skill, security, and board documentation metadata to version 0.2.2.

## 0.2.1 - 2026-08-11

### Fixed

- Aligned the bundled manifest and state with typed canonical IDs, prefixed SHA-256 digests, baseline and self-digest projections, persisted state digests, exact order, revision-one persistence, and approved retrieval snapshots.
- Added strict duplicate-key JSON parsing, NFC/Unicode-scalar/safe-integer canonicalization, published digest vectors, dependency-aware focusable readiness, and saveable unanswered custom choices.
- Hardened no-follow atomic persistence with synced temporary files, validated backups/recovery, directory sync, bounded HTTP concurrency/timeouts/connection use, and reliable JSON body-overflow responses.
- Made `.txt` review exports inert under hostile multiline text and added deterministic pure UI tests plus an explicitly skipping optional installed-browser smoke.

### Changed

- Updated the skill, plugin, marketplace, board package, validator inventory, and normative documentation to version 0.2.1.

## 0.2.0 - 2026-08-10

### Added

- Reusable dependency-free, manifest-driven planning-board template with strict state authority, secure capability-path hosting, compact accessible UI, and built-in Node tests.
- Board architecture, copy/use, runtime, adaptation-audit, and lifecycle documentation.

### Changed

- The skill now prefers copying and validating the bundled board, with a fail-closed materialization/runtime fallback.
- Repository validation and CI now inspect all board resources and run board tests/smoke coverage.

## 0.1.1 - 2026-08-10

### Changed

- Changed project licensing to MIT.
- Made board generation and adaptation explicitly project-neutral and strengthened portability validation.

## 0.1.0 - 2026-08-10

### Added

- Portable Agent Skill for evidence-driven repository planning workshops.
- Canonical manifest, saved-state, checkpoint, provenance, and devplan contracts.
- Secure-by-default exact-address board hosting policy and threat model.
- OpenCode, Claude Code marketplace, and Hermes Agent installation documentation.
- Dependency-free validation script and GitHub Actions workflow.
