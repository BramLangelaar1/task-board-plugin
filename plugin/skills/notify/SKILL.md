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

- **Token** — `$TELEGRAM_BOT_TOKEN`, else `<state-dir>/.env`.
- **Chat** — `$TELEGRAM_CHAT_ID`, else the first allowed user in `<state-dir>/access.json` (`allowFrom[0]`).

`<state-dir>` is `$TELEGRAM_STATE_DIR` if set, else `~/.claude/channels/telegram` — the same variable the
telegram plugin uses, so a board running its own bot (see "one bot per board" below) works for outbound too.

**Graceful degrade:** if Telegram isn't configured (no token or no paired chat) or you pass `--dry-run`,
the script prints the composed message to stdout instead of sending it — so the notification still
reaches the user directly. Prerequisite for live sending: install + pair `telegram@claude-plugins-official`.

## Two-way: receiving go/no-go replies (closing the loop)

`notify` only **sends**. For the user's reply to actually drive the board, the board-keeper session must
be running with the telegram channel attached so inbound DMs reach the assistant (this is the
`telegram@claude-plugins-official` channel, reusing the same bot — not anything this script does):

```sh
claude --channels plugin:telegram@claude-plugins-official
```

(Add `/loop` so the keeper processes replies hands-off.) When a reply arrives, the lead applies it and
**commits the board move**:

- `go <id>`    → idea `awaiting-go-no-go → approved`, then start `brainstorming`.
- `no-go <id>` → move the idea to `decisions/` as `kind: decision` (rejected).
- `ship <id>`  → the user authorized a deploy for a `done/` task → proceed per your deploy process.

The reply hints in the messages include the task id (`go 0012`) so answers are unambiguous when several
ideas are pending. Without `--channels`, alerts still send but replies are never received.

### One inbound stream per bot (operating rule)

Telegram allows a single `getUpdates` consumer per bot, and the inbound bridge is the telegram plugin's —
so:

- Run the channel in **exactly one** board-keeper session per bot. Enabling the telegram channel in two
  sessions on the same bot makes one silently swallow the other's replies (a consumed update is gone — it
  is not redelivered).
- For **multiple boards**, give each its **own bot** — a separate BotFather token + its own
  `TELEGRAM_STATE_DIR` — instead of sharing one bot. Each bot then serves one board, so replies are
  naturally delivered to the right keeper with no routing. (`notify` honors `TELEGRAM_STATE_DIR`, so
  outbound alerts use that board's bot too.) See the `one-bot-per-board` decision.
