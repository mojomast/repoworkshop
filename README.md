# RepoWorkshop

[![Validation](https://github.com/mojomast/repoworkshop/actions/workflows/validate.yml/badge.svg)](https://github.com/mojomast/repoworkshop/actions/workflows/validate.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Evidence-driven repository research, an interactive decision workshop, and an implementation-ready devplan—without coupling the workflow to one agent harness.**

RepoWorkshop is a portable [Agent Skill](https://agentskills.io/specification) and prompt/specification pack for OpenCode, Claude Code, Hermes Agent, and similarly capable harnesses. It tells an agent how to inspect a repository safely, synthesize cited options, generate an isolated compact planning board, retrieve validated saved decisions, and turn only approved work into a dependency-ordered plan.

> **Status:** `0.2.0`. A working generic planning-board template is now included. The skill automates copying it into an approved project-local workshop directory, generating a project manifest, testing the copy, and hosting it safely when capabilities and approval permit. Installed skill/plugin/cache files are never runtime or state locations.

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

The fully supported workflow target is POSIX on Linux, macOS, and WSL, where exact interface inspection, owner-only modes, atomic same-directory rename, and process identity checks can be implemented. Windows-native harnesses must supply documented safe equivalents or stop before hosting; workflow-only research and planning may still proceed. Delegation, browser automation, and LAN hosting are optional adaptations with explicit sequential, manual, or loopback fallbacks.

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
