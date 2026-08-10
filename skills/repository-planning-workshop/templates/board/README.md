# Generic planning-board template

This is a dependency-free, manifest-driven starter. Copy the entire `board` directory into a user-approved, project-local workshop directory before adapting or running it. **Never run it or write state inside an installed skill, plugin, package-manager cache, or agent cache.** The copied board stores canonical state only in `REPOWORKSHOP_STATE_DIR`; exports are review-only.

## Copy and configure

From a RepoWorkshop source checkout:

```bash
mkdir -p "$PROJECT_ROOT/.workshop"
cp -R skills/repository-planning-workshop/templates/board "$PROJECT_ROOT/.workshop/board"
cd "$PROJECT_ROOT/.workshop/board"
cp manifest.example.json manifest.json
```

Replace the synthetic manifest with researched project data. Keep `manifest.example.json` as a schema example if useful. The manifest is the single authority: browser code has no fixed IDs or totals. `state.js` validates all IDs, exact array ordering and references, unknown keys, bounds, one recommendation among at least three options, and an acyclic epic dependency graph.

The digest is generated from the validated manifest on the server. Canonical serialization recursively orders object keys lexicographically, preserves array order, and uses JSON scalar encoding, with no whitespace; SHA-256 is computed over its UTF-8 bytes. Do not hand-author a manifest digest.

## Test and launch safely

Use a fresh capability for every run. The token is a bearer capability: it adds defense in depth but is **not authentication, authorization, or encryption**. Do not share it or put it in logs.

```bash
npm test
TOKEN="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')"
export REPOWORKSHOP_CAPABILITY="$TOKEN"
export REPOWORKSHOP_MANIFEST="$PWD/manifest.json"
export REPOWORKSHOP_STATE_DIR="$PWD/state"
export REPOWORKSHOP_BIND=127.0.0.1
export REPOWORKSHOP_PORT=4173
mkdir -m 700 "$REPOWORKSHOP_STATE_DIR"
npm start
```

Construct the URL locally without logging it: `http://127.0.0.1:4173/$REPOWORKSHOP_CAPABILITY/`. The server defaults to loopback and rejects wildcard, hostname, ambiguous, malformed, and public binds. An exact RFC1918 address is accepted only after the skill's explicit trust confirmation workflow. There is no TLS; prefer loopback.

Configuration:

- `REPOWORKSHOP_MANIFEST`: regular local manifest JSON (defaults to the synthetic example).
- `REPOWORKSHOP_STATE_DIR`: copied-project state directory (defaults to `.repoworkshop` under the launch directory).
- `REPOWORKSHOP_BIND`: exact loopback/RFC1918 IPv4 (default `127.0.0.1`).
- `REPOWORKSHOP_PORT`: exact port (default `4173`).
- `REPOWORKSHOP_CAPABILITY`: required 32–160 character `A-Z a-z 0-9 _ -` token.

Stop with `Ctrl-C` in the owning terminal. Delete the disposable copy/state only after preserving any required canonical state.

## Adaptation audit

Adapt structure, never source identity. Supply every source/template product identifier (names, slugs, storage keys, export stems) as a comma-separated audit input and run tests after customization:

```bash
REPOWORKSHOP_SOURCE_IDENTIFIERS='old-display-name,old-product-slug,old-storage-key' npm test
```

The audit is caller-supplied rather than a hardcoded product denylist. Also inspect the generated export once. Requested project metadata must drive document title, H1, subtitle, export heading/filename, and canonical state namespace. Use neutral defaults `Repository Planning Workshop` and `repository-planning-workshop` when no intentional identity is available.

## Authority and limitations

Initial state is synthesized in memory without a write. Saves use strict version/digest/ID-order validation, expected revisions, computed readiness, owner-only files where POSIX supports it, and same-directory atomic rename. A save conflict returns current state. This is a compact single-process workshop tool, not a multi-user service; capability URLs do not provide identity, access control, encryption, or merge behavior. Browser automation is not bundled, and readable exports cannot be used as planning authority.
