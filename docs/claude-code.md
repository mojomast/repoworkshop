# Claude Code

## Standalone skill

Copy `skills/repository-planning-workshop` to `.claude/skills/repository-planning-workshop` (project) or `~/.claude/skills/repository-planning-workshop` (personal), then invoke:

```text
/repository-planning-workshop
```

Update by replacing the copied directory from a reviewed checkout. Uninstall by removing only that skill directory.

## Plugin marketplace

From Claude Code:

```text
/plugin marketplace add mojomast/repoworkshop
/plugin install repoworkshop@repoworkshop
```

The marketplace name and plugin name are both `repoworkshop`; the skill is namespaced:

```text
/repoworkshop:repository-planning-workshop
```

If installation reports that reload is required, run `/reload-plugins`; older versions may require a restart. Update with `/plugin marketplace update repoworkshop` and the plugin manager's update action. Uninstall with `/plugin uninstall repoworkshop@repoworkshop`; optionally remove the marketplace afterward with `/plugin marketplace remove repoworkshop` (which also removes plugins from it).

Review third-party plugins before installation. Official sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [plugins](https://code.claude.com/docs/en/plugins), and [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).
