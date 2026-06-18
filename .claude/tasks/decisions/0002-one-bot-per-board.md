---
id: 0002
title: Two-way Telegram uses one bot per board; no inbound broker
kind: decision
status: decisions
epic: telegram
spec:
plan:
branch:
parent: 0001
proposed_by: lead
idea_status:
created: 2026-06-18
owner: bram
lead: claude-opus-4-8
started:
reviewers:
  functional: pending
  code_quality: pending
gates:
merge_commit:
merged:
deploy_sha:
shipped:
verified:
release:
terminal:
---

## Goal
Decide how two-way Telegram (go/no-go / ship replies that drive the board) works across one or more boards.

## Decision
**One bot per board.** Each consumer board runs the `telegram@claude-plugins-official` channel in
**exactly one** board-keeper session, with its own bot token + `TELEGRAM_STATE_DIR`. The plugin's
`notify.mjs` honors `TELEGRAM_STATE_DIR` so outbound alerts use that board's bot. We do **NOT** build an
inbound broker/router.

## Context / Rationale
Telegram allows a single `getUpdates` consumer per bot, and the inbound bridge belongs to the telegram
plugin (we reuse it — no second bot, per the original design). Observed failure: the channel was polling
in the wrong session (one without `--channels`), which consumed replies and dropped them; a second session
can't recover a consumed update. With one shared bot across multiple boards, even a correctly-placed single
consumer can't route a reply like `go 0014` to the board that owns task 0014.

A broker that owns the one inbound stream and dispatches `<verb> <id>` to the right keeper would solve
routing, but it adds a long-running process and re-introduces exactly the "second moving part" the
"reuse the telegram plugin, no second bot" decision avoided. **One bot per board** sidesteps both
single-consumer contention and routing: each bot serves one board, so replies are naturally isolated and
delivered to the right keeper — at the cost of one BotFather bot + state dir per board (cheap, and the
telegram plugin already supports it via `TELEGRAM_STATE_DIR`).

## Consequences
- `notify.mjs` resolves token/chat from `TELEGRAM_STATE_DIR` (default `~/.claude/channels/telegram`).
- Operating rule (documented in `task-workflow.md` + the `notify` skill): run the channel in exactly one
  keeper session per bot; for multiple boards, give each its own bot + `TELEGRAM_STATE_DIR`.
- An inbound broker is a deliberate **non-goal** unless a genuine one-shared-bot-across-many-boards
  requirement appears — revisit then.
