# OpenCode

OpenCode discovers Agent Skills from project `.opencode/skills/<name>/SKILL.md` and global `~/.config/opencode/skills/<name>/SKILL.md` locations (plus documented compatible locations).

## Install

There is no documented generic Git command for installing an OpenCode skill. Clone and copy:

```bash
git clone https://github.com/mojomast/repoworkshop.git
mkdir -p .opencode/skills
cp -R repoworkshop/skills/repository-planning-workshop .opencode/skills/
```

For global use, copy to `~/.config/opencode/skills/repository-planning-workshop`. Restart OpenCode after creating a previously absent skill directory, then inspect discovery with:

```bash
opencode debug skill
```

Some OpenCode versions/configuration schemas may support additional skill paths. Do not add an undocumented `skills.paths` field blindly: inspect your installed schema/docs first. A copied directory is the portable method.

## Use, update, uninstall

Ask naturally for a repository planning workshop; the narrow description prevents ordinary research from triggering it. Update by pulling the checkout and replacing only the copied skill directory. Uninstall by removing that directory and restarting OpenCode. Permission rules can further gate skill access, but the skill's fail-closed policy does not assume they are enforced.

Official source: [OpenCode Agent Skills](https://opencode.ai/docs/skills/).
