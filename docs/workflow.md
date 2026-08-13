# Workflow

RepoWorkshop separates durable evidence, user decisions, and implementation planning.

## 1. Research

The harness first reads only repository instructions and metadata needed for safety: root inventory, HEAD/branch, complete status, exclusions, known validation commands, and compatible checkpoint/artifact metadata. It does not pre-read authority/source content, recent history, or hash speculative evidence. By default, three concise non-overlapping lanes cover product/capabilities, architecture/security, and quality/operations/repository health. The larger lane taxonomy is used only when a material scope or risk needs a dedicated split.

## 2. Synthesis and generation

Findings retain typed citations, confidence, uncertainty, and a baseline digest. The default lane budget is five material findings and three candidates; the default synthesis cap is six epics and three decisions. Synthesis resolves conflicts or turns them into decisions with 2–4 feasible options. Stable epics and decision dependencies form validated DAGs. Analysis-only requests stop after compact synthesis. When the user explicitly requests or confirms a board, the harness prefers the [bundled dependency-free board template](board-template.md), copied into an approved project-local workshop directory, and adapts its manifest. Installed skill/plugin/cache files are immutable inputs and are never execution or state locations.

Generation starts from explicit generic project metadata. Unless the user intentionally supplies a display name and safe slug, use `Repository Planning Workshop` and `repository-planning-workshop`. The board title, export heading/filename, persistence namespace, manifest identity/content, UI assets/copy, and evidence-based roadmap items all derive from that metadata and current repository research. Adaptation may reuse structure and behavior, but must replace source-board product names, filenames, namespaces, assets, copy, and roadmap items. Before acceptance, audit HTML, CSS, JavaScript, exports, filenames, and storage keys/paths case-insensitively for stale source identifiers and run a focused adaptation regression test with deliberately different source and target metadata.

## 3. Host/resume

Host is an ephemeral branch from Generate, not a prerequisite for research. The harness validates artifact/state, chooses exact loopback or an exact confirmed trusted private LAN address, starts only the board, and reports lifecycle controls. A stopped host does not stale research.

## 4. Retrieve

The validated board state boundary loads canonical persisted state (revision at least `1`) and independently checks prefixed baseline/manifest/state digests, exact typed IDs/order, Build dependency closure, required decisions, blockers, and computed readiness. Revision `0` is only a synthesized no-write API state for first save. The harness refreshes the evidence baseline and creates an immutable approved-selection snapshot whose source digest/revision exactly match state. Readable `.txt` export, screenshots, and UI scraping are never authoritative.

## 5. Plan

Only enabled Build epics enter milestones. Remove/Defer/disabled outcomes remain visible. A deterministic topological sort defines delivery order. Every milestone includes focused tests, owning typecheck policy, docs, diff/staging gates, rollback, and a coherent proposed commit boundary. Unrelated worktree changes are always reported separately.

See the installed skill's [lifecycle contract](../skills/repository-planning-workshop/references/workshop-lifecycle.md) and [devplan conversion](../skills/repository-planning-workshop/references/artifact-to-devplan.md).
