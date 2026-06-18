# task-board-plugin — kickoff brief

**Read this first.** This is the complete handoff for a *fresh* Claude Code session/lead. Everything you
need to start is here — you do NOT need the originating chat.

## Your charter
You are the **lead engineer** for `task-board-plugin`. Build an **installable plugin** (reusable by any
project — `datablocks` is the first consumer) that turns a project's filesystem task board into:
1. a **mobile-friendly Kanban UI** rendering the full pipeline (idea → backlog → in-progress → in-review
   → done → shipped), and
2. **Telegram notifications** for two events (below).

It must NOT be datablocks-specific. It reads a project's board (committed markdown files) over
**git/GitHub** and renders/notifies. Think "point it at any repo's `.claude/tasks/` and it just works."

## Where this came from
The board + workflow was designed in the `datablocks` project. Authoritative design (read if you can
clone datablocks; otherwise this brief is self-contained):
- Spec: `datablocks:docs/superpowers/specs/2026-06-18-task-workflow-design.md` (esp. §0 tooling-repo
  decision, §9 schema, §11 notification events).
- Plan: `datablocks:docs/superpowers/plans/2026-06-18-task-workflow.md`.
- Decision ADR: `datablocks:.claude/tasks/decisions/0001-tooling-repo.md`.
- This work is tracked on the datablocks board as **epic `workflow`, idea `0009`** (Kanban) + `0010`
  (Telegram). Detailed dev tracking for THIS plugin can live in this repo's own board.

> **Dependency:** to render a *live* board, datablocks must **push its board to the remote** (a deliberate
> carve-out from its local-only `main` habit). Until that push happens, develop against a sample board
> (commit a `sample-board/` fixture mirroring the schema below).

## The data you render — board schema (self-contained)
A board is `.claude/tasks/<status>/NNNN-slug.md`. **The folder is the status** (`backlog`, `in-progress`,
`in-review`, `done`, `shipped`, `decisions`). Each file:

```yaml
---
id: 0007
title: <title>
kind: feature            # idea | feature | fix | doc | decision
status: backlog          # mirror; the FOLDER is authoritative
epic: <slug>
spec:                    # docs/superpowers/specs/...
plan:                    # docs/superpowers/plans/...
branch:
parent:                  # task id this descends from
proposed_by: lead        # user | lead
idea_status:             # awaiting-go-no-go | approved | rejected (kind:idea)
created: <YYYY-MM-DD>
owner:                   # accountable human (stamped on claim)
lead:                    # session/agent driving it
started:
reviewers:
  functional: pending    # pending | pass | fail
  code_quality: pending
gates:                   # green | failing
merge_commit:
merged:
deploy_sha:
shipped:
verified:                # ok | awaiting-operator | failed
release:
terminal:                # parked | superseded (docs/decisions)
---
## Goal
## Acceptance
## Context / Links
## Notes
```
Also: `.claude/tasks/RELEASES.md` (deploy log) and `.claude/tasks/reviewers/*` (prompts) exist but the
Kanban only needs the task files + folders.

## Notification events (Telegram)
- **idea-proposed** — a task with `kind: idea` + `idea_status: awaiting-go-no-go` appears → notify with
  its `## Goal`/pitch so the human can give go/no-go.
- **ship-ready** — a task lands in `done/` (deployable) → notify so the human can authorize a deploy.

A `telegram` plugin already exists in the ecosystem (Claude Code `telegram@claude-plugins-official`);
evaluate reusing its channel/auth vs. a standalone bot.

## Constraints
- **Installable plugin**, project-agnostic, reads the board over git/GitHub (read-only on the board).
- **Mobile-friendly** (the human checks it from a phone) → independently hostable.
- Don't couple to datablocks internals; the board schema above is the only contract.

## Your first move
Do NOT start coding. Run the superpowers flow for THIS plugin as its own project:
`brainstorming` (what kind of plugin? Claude Code plugin vs npm/CLI; hosting; auth; how it reads the
board — GitHub API vs clone; mobile stack) → `writing-plans` → `subagent-driven-development`. Decide the
"what kind of plugin" question early — it's the biggest open design choice.
