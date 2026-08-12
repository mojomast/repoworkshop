# RepoWorkshop

- The product is the portable skill at `skills/repository-planning-workshop/`; the nested `templates/board/` is a dependency-free template that must be copied into a project-local workshop directory before it is run or allowed to persist state. Never use installed skill, plugin, or cache paths for board runtime/state.
- Require Node.js 20+; the only package scripts are `npm test --prefix skills/repository-planning-workshop/templates/board` and `npm start --prefix skills/repository-planning-workshop/templates/board` (the latter needs the documented `REPOWORKSHOP_*` environment variables and an owner-only existing state directory).

## Validation

- Run the same CI sequence after changes: `node scripts/validate.mjs`, `npm test --prefix skills/repository-planning-workshop/templates/board`, then `git diff --check`.
- `scripts/validate.mjs` is a packaging/security gate: it rejects symlinks and non-regular files anywhere, machine-specific absolute paths, trailing whitespace, broken Markdown links, and board browser assets that are remote, root-relative, traversing, or missing.
- Every file under the skill's `references/` and `templates/` directories must be linked directly from `SKILL.md`; add that link when adding a support file.
- Keep the version synchronized across `scripts/validate.mjs`, `SKILL.md` metadata, the board `package.json`, and both `.claude-plugin/*.json` manifests. Update `CHANGELOG.md` for user-visible changes.

## Board Constraints

- The board intentionally has no dependencies; preserve `node --test test/*.test.js` and `node server.js` scripts and do not introduce package dependencies.
- Browser code must use only local relative assets. Preserve fail-closed validation and persistence behavior; writable serving defaults to exact loopback, while LAN exposure requires the skill's explicit trust and capability-token workflow.
- The optional browser test skips when Chromium/Chrome is unavailable; a skip is not browser coverage.
