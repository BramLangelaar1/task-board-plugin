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
  printing the message when Telegram isn't configured. To let the user **reply** (go/no-go, ship) and
  have it drive the board, run the keeper session with `--channels plugin:telegram@claude-plugins-official`
  (see the `notify` skill's "Two-way" section).

## Install

Add this repo as a marketplace, then install the plugin:

```
/plugin marketplace add BramLangelaar1/task-board-plugin
/plugin install task-board@task-board-plugin
/reload-plugins
```

(`marketplace add` reads `.claude-plugin/marketplace.json` from the repo's default branch. The repo must
be readable by whoever installs — see "Availability" below.)

Then, in a project you want on the workflow:

```
/task-board:setup
```

You don't need the plugin installed to use the capabilities — `scripts/setup.mjs` and `scripts/notify.mjs`
run directly with `node` (see below). The install just makes them available as slash commands.

### Availability

- The repo is currently **private**, so `marketplace add` works only for accounts with read access to it
  (and git-authenticated). It is **not** public to everyone.
- To make it installable by anyone, the repo must be made **public** (then anyone who knows
  `BramLangelaar1/task-board-plugin` can add + install it).
- Listing in Anthropic's official `claude-plugins-official` directory is a separate submission, not
  required for the above.

## Scripts (also runnable directly)

- `scripts/setup.mjs [target-dir]` — the scaffolder (node built-ins only).
- `scripts/notify.mjs <idea-proposed|ship-ready> <task-file.md> [--dry-run]` — the notifier.

Templates copied by the scaffolder live in `templates/`.
