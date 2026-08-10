# Workflow

RepoWorkshop separates durable evidence, user decisions, and implementation planning.

## 1. Research

The harness reads repository authority and instructions, captures HEAD/status plus hashes for dirty evidence, and records prohibited/sensitive categories. Non-overlapping lanes cover health, capabilities, architecture, product gaps, security/integrations, tests/operations/docs, and optionally external research. Lanes may run in parallel or sequentially with the same contract.

## 2. Synthesis and generation

Findings retain typed citations, confidence, uncertainty, and a baseline digest. Synthesis resolves conflicts or turns them into decisions with 2–4 feasible options. Stable epics and decision dependencies form validated DAGs. The harness then generates or minimally adapts an isolated no-dependency board; this repository does not contain that executable.

## 3. Host/resume

Host is an ephemeral branch from Generate, not a prerequisite for research. The harness validates artifact/state, chooses exact loopback or an exact confirmed trusted private LAN address, starts only the board, and reports lifecycle controls. A stopped host does not stale research.

## 4. Retrieve

The validated board state boundary loads canonical state and independently checks revision, digests, exact ordering, blockers, and computed readiness. The harness refreshes the evidence baseline and creates an immutable approved-selection snapshot. Readable export, screenshots, and UI scraping are never authoritative.

## 5. Plan

Only enabled Build epics enter milestones. Remove/Defer/disabled outcomes remain visible. A deterministic topological sort defines delivery order. Every milestone includes focused tests, owning typecheck policy, docs, diff/staging gates, rollback, and a coherent proposed commit boundary. Unrelated worktree changes are always reported separately.

See the installed skill's [lifecycle contract](../skills/repository-planning-workshop/references/workshop-lifecycle.md) and [devplan conversion](../skills/repository-planning-workshop/references/artifact-to-devplan.md).
