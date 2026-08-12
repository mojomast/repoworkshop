# RepoWorkshop

[![Validation](https://github.com/mojomast/repoworkshop/actions/workflows/validate.yml/badge.svg)](https://github.com/mojomast/repoworkshop/actions/workflows/validate.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Evidence-driven repository research, an interactive decision workshop, and an implementation-ready devplan—without coupling the workflow to one agent harness.**

RepoWorkshop is a portable [Agent Skill](https://agentskills.io/specification) and prompt/specification pack for OpenCode, Claude Code, Hermes Agent, and similarly capable harnesses. It tells an agent how to inspect a repository safely, synthesize cited options, generate an isolated compact planning board, retrieve validated saved decisions, and turn only approved work into a dependency-ordered plan.

> **Status:** `0.3.0`. The generic planning-board template includes descriptor-anchored Linux persistence, explicit intent/scope approval, and one shared server/browser readiness evaluator. Installed skill/plugin/cache files are never runtime or state locations.

## The problem it solves

When you ask an AI agent to plan significant work on an existing codebase, it will typically either hallucinate a plan that ignores what's actually in the repo, or reflect your prompt back at you as structured bullet points. Neither is useful.

RepoWorkshop forces the agent to **read the repository first**. Every option it surfaces in the planning board traces back to a specific file, commit, or command output in your actual codebase. You review and approve decisions in an interactive local board. Only approved, validated choices become tasks in the final devplan—nothing is inferred or invented.

## When to use it

RepoWorkshop fits best when you face a "we need to significantly evolve this system and I want a real plan, not vibes" moment:

- **Refactoring a complex codebase** — the agent fans out research lanes across architecture, test coverage, dependencies, and tech debt, then surfaces 2–4 concrete options per unresolved decision. You approve each choice before anything becomes a task.
- **Planning a major feature on an existing system** — instead of pasting context into chat and hoping the agent reads it all, the workshop generates a structured manifest of what's actually present, partial, or missing across the work you care about.
- **Onboarding a new agent to an unfamiliar repo** — any compatible harness (OpenCode, Claude Code, Hermes) can resume an existing workshop checkpoint and pick up exactly where you left off, without re-running expensive research.
- **Evaluating an inherited or third-party codebase** — run the workshop to get a classified, evidence-cited breakdown of what's production-ready, what's partial, and what's deferred before committing to build on top of it.
- **Multi-agent parallel planning** — the board exposes a local JSON API with optimistic concurrency. Multiple agents can read the manifest simultaneously and write decisions without clobbering each other.

RepoWorkshop is **not** the right tool for greenfield projects (nothing to research) or small single-file changes (the workflow overhead isn't worth it).

## End-to-end walkthrough

This is the full workflow for using RepoWorkshop to plan real work on an existing repository.

### Step 1 — Install the skill

Install for your harness (see [Install](#install) below), then open a session pointed at the repository you want to plan work on.

### Step 2 — Run research and generate the board

Trigger the skill with a natural-language request:

> Use repository-planning-workshop to research this repository and generate an interactive planning board. Do not host it yet.

The agent will:
1. Capture a provenance baseline (Git status, HEAD, dirty files).
2. Fan out read-only research lanes across architecture, tests, dependencies, authority docs, and relevant source.
3. Synthesize typed, evidence-cited findings into a canonical manifest—each option tied to real file lines or command output.
4. Copy the bundled board template into an isolated workshop directory and generate the manifest there.
5. Run the board's test suite against the generated artifact to validate it before hosting.

No writes happen outside the workshop output directory. Your working tree is never touched.

### Step 3 — Host and review the board

> Resume the repository planning workshop and host the existing board. Use loopback unless I affirm the exact detected LAN interface is trusted.

The agent starts the local planning board at `http://127.0.0.1:4173/<token>/`. Open it in your browser. For each epic and decision the board presents:

- Set dispositions: **Build**, **Defer**, **Remove**, or **Need decision**.
- Answer required decisions by selecting from evidence-backed options (or writing a custom answer).
- Resolve any blockers with a note.
- Add overall and per-epic notes.

The board saves your decisions locally on every save. It has no external dependencies, no remote assets, and no authentication—it is a local planning tool only.

### Step 4 — Retrieve decisions and generate the devplan

Once the board shows **Ready for implementation planning**:

> The planning board is saved and ready. Retrieve its validated canonical decisions and create an actionable devplan.

The agent loads decisions only through the validated state module—never by scraping the UI or parsing exports. It verifies digest integrity, checks for evidence drift, and builds a dependency-ordered (DAG) devplan that includes only the epics you approved as **Build**. Every milestone includes docs, tests, a coherent commit boundary, and a rollback plan.

The devplan is the output you hand to your agents or use directly. RepoWorkshop never commits, pushes, or implements anything itself.

## What it produces

1. Bounded, typed research findings tied to a dirty-file hash baseline.
2. A canonical manifest and isolated interactive planning-board source/artifact.
3. Strict persisted decisions with readiness, revision, and digest checks.
4. An approved-selection snapshot and actionable DAG-ordered devplan.

The readable board export is for review only. Canonical saved state remains authoritative.

## Quick start

### Source-checkout board demo

Requires Node.js 20+ and no package download:

```bash
cp -R skills/repository-planning-workshop/templates/board /tmp/repoworkshop-board
cd /tmp/repoworkshop-board
cp manifest.example.json manifest.json
npm test
mkdir -m 700 state
TOKEN="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')"
REPOWORKSHOP_CAPABILITY="$TOKEN" REPOWORKSHOP_MANIFEST="$PWD/manifest.json" \
  REPOWORKSHOP_STATE_DIR="$PWD/state" REPOWORKSHOP_BIND=127.0.0.1 npm start
```

Open `http://127.0.0.1:4173/$TOKEN/` without publishing the token. See the [board template guide](docs/board-template.md). The bundled manifest is synthetic; the skill replaces it with validated repository research.

The quoted requests below are **natural-language trigger examples, not universal CLI syntax**. Invoke the installed skill in the way your harness supports.

### Research and generate

> Use repository-planning-workshop to research this repository and generate an interactive planning board. Do not host it yet.

### Resume and host

> Resume the repository planning workshop and host the existing board. Use loopback unless I affirm the exact detected LAN interface is trusted.

### Retrieve and plan

> The planning board is saved and ready. Retrieve its validated canonical decisions and create an actionable devplan.

## Security warning: LAN mode

The generated board is writable and has **no real user authentication**. LAN hosting must bind only an exact confirmed private IPv4 address, never `0.0.0.0` or `::`, and requires affirmative trust confirmation for that exact interface/network. LAN mode also requires a per-run high-entropy capability URL, exact Host/Origin checks, and no remote assets. Those controls are defense-in-depth—not identity, authentication, or transport encryption. Prefer `127.0.0.1` whenever peer access is unnecessary. See [the security model](docs/security-model.md).

## Install

Review the skill before installation. Third-party skills are instructions executed with your harness's privileges.

### OpenCode

OpenCode has no generic Git skill-install command. Clone this repository, then copy the skill directory into one of its documented discovery locations:

```bash
git clone https://github.com/mojomast/repoworkshop.git
mkdir -p .opencode/skills
cp -R repoworkshop/skills/repository-planning-workshop .opencode/skills/
# Or install globally under ~/.config/opencode/skills/ instead.
```

Restart OpenCode, then verify discovery:

```bash
opencode debug skill
```

For a stable checkout, a supported OpenCode version may instead reference it through the `skills.paths` configuration; verify that field against your installed version before use. To update, pull the clone and recopy (or update the stable checkout). To uninstall, remove only the copied `repository-planning-workshop` directory and restart. See [OpenCode details](docs/opencode.md) and the [official Agent Skills documentation](https://opencode.ai/docs/skills/).

### Claude Code

Manual project install:

```bash
git clone https://github.com/mojomast/repoworkshop.git
mkdir -p .claude/skills
cp -R repoworkshop/skills/repository-planning-workshop .claude/skills/
```

Invoke `/repository-planning-workshop`. Alternatively, install the working plugin marketplace from inside Claude Code:

```text
/plugin marketplace add mojomast/repoworkshop
/plugin install repoworkshop@repoworkshop
```

Invoke the plugin skill as `/repoworkshop:repository-planning-workshop`. If the install summary requests it, run `/reload-plugins`; otherwise restart Claude Code. Update with `/plugin marketplace update repoworkshop` and the plugin manager's update flow. Uninstall with `/plugin uninstall repoworkshop@repoworkshop`, then optionally `/plugin marketplace remove repoworkshop`. See [Claude Code details](docs/claude-code.md) and Anthropic's official [skills](https://code.claude.com/docs/en/skills) and [marketplace](https://code.claude.com/docs/en/plugin-marketplaces) guides.

### Hermes Agent (Nous Research)

Inspect before installing, then install the exact skill path:

```bash
hermes skills inspect mojomast/repoworkshop/skills/repository-planning-workshop
hermes skills install mojomast/repoworkshop/skills/repository-planning-workshop
```

Start a fresh conversation with `/reset` if the newly installed skill is not visible, then invoke `/repository-planning-workshop` or use a matching natural-language request. Update with `hermes skills check` then `hermes skills update repository-planning-workshop`; uninstall with `hermes skills uninstall repository-planning-workshop`. This refers specifically to [Nous Research Hermes Agent](https://github.com/NousResearch/hermes-agent). See [Hermes details](docs/hermes-agent.md) and its official [Skills System](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

## Documentation

- [Workflow](docs/workflow.md)
- [Bundled board template](docs/board-template.md)
- [Security model](docs/security-model.md)
- [Portability and capabilities](docs/portability.md)
- [OpenCode](docs/opencode.md)
- [Claude Code](docs/claude-code.md)
- [Hermes Agent](docs/hermes-agent.md)
- [Example research finding](examples/example-research-finding.md)
- [Example devplan](examples/example-devplan.md)

## Repository layout

```text
skills/repository-planning-workshop/  Portable skill, references, templates
.claude-plugin/                       Claude plugin and marketplace manifests
docs/                                 Harness, workflow, security documentation
examples/                             Sanitized illustrative outputs
scripts/validate.mjs                  Dependency-free package validator
```

## Platforms and limitations

Writable bundled-board persistence is supported where Node exposes `O_DIRECTORY`/`O_NOFOLLOW` and a verified descriptor directory path (Linux uses `/proc/self/fd`; compatible systems may provide `/dev/fd`). Other platforms fail closed for persistence and may use documented manual loopback read-only mode. Workflow-only research and planning remain portable. Delegation, browser automation, and LAN hosting are optional adaptations with explicit sequential, manual, or loopback fallbacks.

Non-goals include turning the bundled local template into a universal/multi-user web app, exposing the main application, providing user authentication, tunneling publicly, replacing repository authority documents, or implementing approved work.

## Validate

Requires a maintained Node.js release and no npm dependencies:

```bash
node scripts/validate.mjs
npm test --prefix skills/repository-planning-workshop/templates/board
git diff --check
```

CI runs the validator and board tests/smoke checks on pushes and pull requests without exposing a network service.

## Contributing, security, and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). MIT licensed; see [LICENSE](LICENSE).
