# Contributing

Thank you for improving RepoWorkshop.

## Before opening a change

1. Search [issues](https://github.com/mojomast/repoworkshop/issues) for related work.
2. Open a feature issue before broad workflow or contract changes.
3. For vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of filing a public issue.

## Development

The package intentionally has no external runtime or validation dependencies. Edit the skill and supporting Markdown/JSON directly. Keep the frontmatter portable to the Agent Skills specification and link every required support file directly from `SKILL.md` so remote installers can fetch it.

Run:

```bash
node scripts/validate.mjs
git diff --check
```

Update [CHANGELOG.md](CHANGELOG.md) for user-visible changes. Add or adjust examples when changing output contracts. Documentation must not contain secrets, machine-specific paths, invented commands, or claims that the package ships a planning-board executable. Use documented environment-variable placeholders such as `$HOME`, `${HOME}`, `%USERPROFILE%`, or `$env:USERPROFILE` instead of user-specific absolute paths.

## Pull requests

- Keep changes focused and explain the user impact and security implications.
- Include exact validation commands/results.
- Preserve fail-closed behavior for writes, network exposure, retrieval, and canonical state.
- By submitting a contribution, you agree that it is licensed under the MIT License.

All participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
