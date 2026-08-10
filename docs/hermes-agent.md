# Hermes Agent

These instructions refer to [Nous Research Hermes Agent](https://github.com/NousResearch/hermes-agent), not another product named Hermes.

Hermes GitHub installs accept an owner/repository/path identifier. Inspect first:

```bash
hermes skills inspect mojomast/repoworkshop/skills/repository-planning-workshop
hermes skills install mojomast/repoworkshop/skills/repository-planning-workshop
```

`SKILL.md` directly links every required file under `references/` and `templates/`, allowing the remote installer to fetch the complete bundle. Start a fresh conversation with `/reset` if a current conversation does not discover the newly installed skill. Invoke `/repository-planning-workshop` or use a matching natural-language request.

Update and uninstall:

```bash
hermes skills check
hermes skills update repository-planning-workshop
hermes skills uninstall repository-planning-workshop
```

Hermes scans community skills, but scanning is not a substitute for human review. Official source: [Hermes Skills System](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).
