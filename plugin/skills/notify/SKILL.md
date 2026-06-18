---
name: notify
description: Send a Telegram notification for a task-board lifecycle event (idea-proposed or ship-ready), reusing the official telegram plugin's bot. Use when a lead-proposed idea needs a go/no-go, or when a task reaches done/ and is ready to deploy.
user-invocable: true
allowed-tools: Bash, Read
---

# Notify on a board event

The board has two notification events (from `task-workflow.md`):

- **idea-proposed** — a lead created a `kind: idea` task with `idea_status: awaiting-go-no-go`. Notify
  the user with the pitch so they can give go/no-go.
- **ship-ready** — a task reached `done/` and is deployable. Notify so the user can authorize a deploy.

The board keeper runs this on the corresponding transition:

```sh
node "${CLAUDE_PLUGIN_ROOT}/scripts/notify.mjs" idea-proposed .claude/tasks/backlog/0007-foo.md
node "${CLAUDE_PLUGIN_ROOT}/scripts/notify.mjs" ship-ready    .claude/tasks/done/0005-bar.md
```

Add `--dry-run` to print the message without sending.

## How it reuses the telegram plugin

It does **not** run a second bot. It sends via the Telegram Bot API using the same credentials the
`telegram@claude-plugins-official` plugin manages:

- **Token** — `$TELEGRAM_BOT_TOKEN`, else `~/.claude/channels/telegram/.env`.
- **Chat** — `$TELEGRAM_CHAT_ID`, else the first allowed user in `~/.claude/channels/telegram/access.json`
  (`allowFrom[0]`).

**Graceful degrade:** if Telegram isn't configured (no token or no paired chat) or you pass `--dry-run`,
the script prints the composed message to stdout instead of sending it — so the notification still
reaches the user directly. Prerequisite for live sending: install + pair `telegram@claude-plugins-official`.
