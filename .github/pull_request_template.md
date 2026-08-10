## Summary

- What changed and why?
- Which workflow phases/contracts/harnesses are affected?

## Security and portability

- [ ] Fail-closed write/network/retrieval behavior is preserved.
- [ ] No secrets, absolute local paths, capability tokens, or private output are included.
- [ ] Required/optional capabilities and fallbacks remain accurate.
- [ ] Every required skill support file is linked directly from `SKILL.md`.

## Validation

- [ ] `node scripts/validate.mjs`
- [ ] `git diff --check`
- [ ] User-visible changes are recorded in `CHANGELOG.md`.

Exact results and any unexecuted checks:
