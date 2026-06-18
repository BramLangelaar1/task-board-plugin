# task-board (Claude Code plugin)

The Claude Code half of **task-board-plugin** — it onboards a project onto the filesystem task-board
workflow and sends Telegram notifications. The mobile-friendly Kanban UI lives in the repo's web app
(`apps/web`); this plugin points you at it.

## What it provides

- **`/task-board:setup`** — scaffold the workflow into the current project in one step: the
  `.claude/tasks/` board (all status folders), `.claude/rules/task-workflow.md`, the reviewer prompts,
  the board README/RELEASES, and the task `TEMPLATE.md`. Idempotent — never overwrites existing files.
- **`/task-board:notify`** — send a Telegram alert for the two board events (`idea-proposed`,
  `ship-ready`), **reusing** the `telegram@claude-plugins-official` bot (no second bot). Degrades to
  printing the message when Telegram isn't configured.

## Install

```
/plugin install task-board@<your-marketplace>
/reload-plugins
```

Then, in a project you want on the workflow:

```
/task-board:setup
```

## Scripts (also runnable directly)

- `scripts/setup.mjs [target-dir]` — the scaffolder (node built-ins only).
- `scripts/notify.mjs <idea-proposed|ship-ready> <task-file.md> [--dry-run]` — the notifier.

Templates copied by the scaffolder live in `templates/`.
