# Bundled Planning-Board Template

RepoWorkshop includes a working generic board at [`skills/repository-planning-workshop/templates/board/`](../skills/repository-planning-workshop/templates/board/). It is a compact, dependency-free Node.js starter, not a service embedded in the repository under study.

## Architecture and authority

- `manifest.json` is the sole project-data authority. `state.js` strictly validates it and computes a stable SHA-256 digest from canonical JSON (recursively sorted object keys, significant array order, JSON scalar encoding, UTF-8, no whitespace).
- `server.js` serves only three static assets and two JSON APIs beneath one capability path. It computes readiness, revisions state, and persists by owner-only same-directory atomic rename.
- `public/` renders semantic grouped rows, decisions, blockers, filters, notes, readiness, and review-only exports using safe DOM construction.
- `test/` uses Node's built-in test runner and disposable shared-memory directories when available.

No browser storage is canonical. No manifest digest is hand-authored. The readable brief is explicitly non-authoritative.

## Source-checkout use

```bash
PROJECT_ROOT=/path/to/approved/project
mkdir -p "$PROJECT_ROOT/.workshop"
cp -R skills/repository-planning-workshop/templates/board "$PROJECT_ROOT/.workshop/board"
cd "$PROJECT_ROOT/.workshop/board"
cp manifest.example.json manifest.json
# Replace synthetic content, then:
npm test
```

For an installed Agent Skill, the harness resolves every directly linked board file from the skill root and materializes a new copy in an approved project-local workshop directory. It must never execute the installed copy or place mutable state under skill/plugin/package-manager/agent cache paths. If the harness cannot materialize and run the complete template, it fails closed and provides the validated artifact/manual loopback procedure rather than silently improvising an unsafe host.

## Manifest guide

Project metadata supplies display name, subtitle, safe artifact basename, and safe state namespace. The neutral defaults are `Repository Planning Workshop` and `repository-planning-workshop`. Baseline identity/digest bind research provenance. Ordered stable groups contain ordered epics with priorities, dependencies, summaries, and risk. Decisions contain at least three tradeoff-bearing options and exactly one visible recommendation; recommendations start unselected. Bounds constrain requests and state. Initial blockers are optional.

Validation rejects unknown keys, duplicate/reordered/unknown IDs, unsafe names, invalid references, dependency cycles, excess bounds, invalid decisions, and incompatible state. When adapting an existing board, pass all source identifiers to the documented `REPOWORKSHOP_SOURCE_IDENTIFIERS` audit; this caller-supplied test avoids an incomplete hardcoded product denylist.

## Runtime and safe launch

See the template [README](../skills/repository-planning-workshop/templates/board/README.md) for all environment variables and token generation. A minimal loopback launch is:

```bash
TOKEN="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')"
REPOWORKSHOP_CAPABILITY="$TOKEN" \
REPOWORKSHOP_MANIFEST="$PWD/manifest.json" \
REPOWORKSHOP_STATE_DIR="$PWD/state" \
REPOWORKSHOP_BIND=127.0.0.1 REPOWORKSHOP_PORT=4173 npm start
```

Only an exact loopback or RFC1918 IPv4 is accepted. LAN launch requires the skill's immediate affirmative confirmation for the exact interface/address. Wildcards, public addresses, proxies, remote assets, CORS, and routes outside the capability are rejected. The bearer URL is defense-in-depth, not authentication or encryption.

## Lifecycle and customization

Generate and validate the manifest; test the copied artifact; host; save through the API; stop the exact process; retrieve canonical state through `state.js`/API; then archive or remove the isolated copy according to project policy. Customize colors and copy locally, preserving semantic controls, strong focus, 320 px reflow, safe text rendering, strict contracts, local-only assets, and the source-identifier audit.

Limitations: this is a single-process local workshop, not multi-user software. It has no identity, authorization, TLS, merge engine, browser automation, rate limiter, or native-Windows ACL/reparse-point implementation. Use loopback by default and apply the documented fail-closed portability rules.
