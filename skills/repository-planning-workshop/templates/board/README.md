# Generic planning-board template

This dependency-free, manifest-driven board is version 0.2.1. Copy the entire `board` directory into an approved project-local workshop directory before adapting or running it. Never execute it or write state in an installed skill, plugin, package-manager cache, or agent cache.

## Canonical authority

`manifest.example.json` implements the canonical contract directly: typed `EPIC-###`, `DEC-###`, `DEC-###-OPT-##`, and `BLOCK-###` IDs; embedded research baseline and `baselineDigest`; `sha256:` digests; exact arrays; and a `manifestDigest` computed with only that member omitted. `state.js` supplies strict JSON parsing and canonicalization. It rejects duplicate object keys before ordinary parsing, non-NFC strings, lone surrogates, floats, unsafe integers, negative zero, unknown fields, bad references/order, and DAG cycles. Published deterministic examples are in `test/canonical-vectors.json`.

GET with no saved file synthesizes an explicitly non-persisted revision `0` in memory and performs no write. The first explicit save is revision `1`; every persisted state includes its self-computed `stateDigest`. A validated ready revision can be passed to `approvedSelectionSnapshot()` for Retrieve/Plan. Review exports are inert `.txt` files marked `REVIEW ONLY - NON-AUTHORITATIVE`; they are never retrieval authority.

## Copy, test, and launch

```bash
mkdir -p "$PROJECT_ROOT/.workshop"
cp -R skills/repository-planning-workshop/templates/board "$PROJECT_ROOT/.workshop/board"
cd "$PROJECT_ROOT/.workshop/board"
cp manifest.example.json manifest.json
npm test
TOKEN="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')"
export REPOWORKSHOP_CAPABILITY="$TOKEN"
export REPOWORKSHOP_MANIFEST="$PWD/manifest.json"
export REPOWORKSHOP_STATE_DIR="$PWD/state"
export REPOWORKSHOP_BIND=127.0.0.1 REPOWORKSHOP_PORT=4173
mkdir -m 700 "$REPOWORKSHOP_STATE_DIR"
npm start
```

Open `http://127.0.0.1:4173/$REPOWORKSHOP_CAPABILITY/` without logging or sharing it. The capability is defense-in-depth, not authentication, authorization, or encryption. Exact RFC1918 LAN binding requires the skill's explicit trust workflow.

Saves use optimistic revisions, owner-only no-follow file handles where supported, post-open metadata checks, synced exclusive temporary files, validated prior-state backups, atomic same-directory rename, and directory sync where supported. Reads recover a prior valid backup if the final file is corrupt. The server also bounds body size, concurrent mutations, headers/request/keep-alive time, requests per socket, and connections. These are bounded single-process protections, **not denial-of-service resistance**.

The UI remains manifest-driven and uses only local assets. Pure transition/filter/readiness/export tests always run under Node. The optional browser check uses an already installed Chromium/Chrome and prints an explicit skip when unavailable; it never downloads packages and a skip is not browser coverage.

## Adaptation audit

Replace the synthetic baseline, evidence, epics, decisions, and blockers, then recompute baseline/manifest self-digests through the canonical module. Never weaken validation to accept generated data. Keep exact IDs/order and project metadata (`displayName`, `slug`). Audit stale source identity with:

```bash
REPOWORKSHOP_SOURCE_IDENTIFIERS='old-display-name,old-product-slug,old-storage-key' npm test
```

`REPOWORKSHOP_MANIFEST`, `REPOWORKSHOP_STATE_DIR`, `REPOWORKSHOP_BIND`, `REPOWORKSHOP_PORT`, and the required 32–160 character `REPOWORKSHOP_CAPABILITY` configure runtime behavior. Stop with `Ctrl-C` in the owning terminal and preserve canonical state before deleting a disposable copy.
