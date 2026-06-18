# Task workflow (filesystem board)

The durable board is `.claude/tasks/{backlog,in-progress,in-review,done,shipped,decisions}/`. One
markdown file per task; **moving the file between folders IS the status change; commit the move.** The
**folder is authoritative** (the `status:` field is a mirror). Task files are `NNNN-slug.md`; the
zero-padded id is identity and survives moves. Schema: see the template at the bottom.

## Driver — the lead drives autonomously to ship-ready
There is NO background loop. In a session the lead (you) pull the next task you own and drive it
continuously `backlog → in-progress → in-review → done` via subagents, without pausing between phases.
Stop only: (a) at a lead-proposed idea's go/no-go gate, and (b) ALWAYS before deploy/ship — `done →
shipped` needs explicit user instruction (`deploy.md`). `/loop` and `/schedule` are optional nudges, not
the driver — the committed board (not a loop) is what survives a session ending.

## Ideas & go/no-go
Ideas live in `backlog/` as `kind: idea`. **User ideas are pre-approved.** A **lead-proposed idea** is
created with `idea_status: awaiting-go-no-go`, the user is notified with a one-paragraph pitch, and it is
a **blocking gate**: do no further work on that idea until the user replies go/no-go (you may pick up
other ready tasks meanwhile). go → `approved` → `brainstorming`; no-go → `decisions/` as `kind: decision`.

## Ownership (one lead per epic)
A big topic is an `epic:`. One lead owns an epic + all its child tasks. Tasks in motion stamp
`owner` + `lead` + `epic` + `started`; a task in motion is owned by exactly ONE lead. Who's-on-what:
`git grep -l "lead:" .claude/tasks/in-progress .claude/tasks/in-review`.

## Board-keeper (how board state reaches `main`)
The board on `main` is maintained by the session holding the `main` checkout (the **board keeper**),
which **commits + pushes each board move to `main` after every transition** (board files are tiny docs;
`git-workflow.md` allows doc commits straight to `main`). This is a deliberate carve-out from "code
merges/pushes are integration-session-only" — board *docs* are not code. Parallel worktree leads own
their epic's *code* on a `feat/…` branch and route board transitions through the board keeper; the
`done`/`shipped` moves also ride the `--no-ff` merge. In solo operation the active session IS the keeper.

## Lifecycle (driven by superpowers skills — do NOT invent a parallel process)
- `brainstorming` writes the spec → create the task in `backlog/`, set `spec:`.
- `writing-plans` writes the plan → add `plan:` (stays in `backlog/`).
- claim → move to `in-progress/`, stamp `owner/lead/epic/branch/started`; `subagent-driven-development`
  dispatches the implementer (TodoWrite tracks the plan's steps — ephemeral, never committed).
- implementer DONE → move to `in-review/`; dispatch BOTH reviewers (see `.claude/tasks/reviewers/`):
  1. **functional/goal** — MUST run/exercise the feature and verify EACH `## Acceptance` item with
     evidence written into the task's `## Notes`. No approval without evidence.
  2. **code-quality** — `requesting-code-review/code-reviewer.md` template; enforces `design-system.md`,
     `database.md`, `testing.md`, `env-files.md`, `nextjs.md`, CLAUDE.md guidelines.
- AUTO-ADVANCE: `in-review/ → done/` the moment BOTH reviewers pass AND `/gates` is green.
  `finishing-a-development-branch` performs the merge as
  `git merge --no-ff -m "Merge: NNNN <one-liner>"` (NNNN = the task's filename id, so the deploy fan-out
  can map merges→tasks). Stamp `merge_commit/merged/gates`.
- `done/ → shipped/` ONLY via `/deploy-onprem` + a passing post-deploy verification (smoke + any `[vm]`
  operator-checklist items). Run `scripts/board/ship-fanout.ts <deploy_sha>`: it moves EVERY `done/`
  task whose `merge_commit` is an ancestor of `<deploy_sha>` into `shipped/`, stamps
  `deploy_sha/shipped/verified/release`, and appends one line to `RELEASES.md`. Sanity: moved-count must
  equal the `Merge:` count in the window.

## Non-deployable work
Specs, plans, audits, research, design docs terminate in `done/` with `kind: doc`,
`terminal: parked|superseded`. They NEVER enter `shipped/`. Their implementation children ship
separately and link back via `parent:`. `decisions/` holds terminal `kind: decision` records.

## Notification events (transport = a later sub-project; until then report to the user directly)
- **idea-proposed** — a lead created a `kind: idea` `awaiting-go-no-go`; notify with the pitch.
- **ship-ready** — a task reached `done/` and is deployable; notify so the user can authorize a deploy.

## Gates own their own definitions — DO NOT restate them
in-review gate = `/gates` (`.claude/skills/gates`); done = `git-workflow.md`; shipped = `deploy.md` +
`/deploy-onprem`. Advisory rules (`design-system`, `database`, `testing`, `env-files`, `nextjs`, CLAUDE.md)
are enforced by the two reviewers, not as separate gates.

## Hard rules (unchanged)
Commit/push/merge/deploy ONLY on explicit user request (`deploy.md`). e2e is exclusive; migrations +
dev-DB seed are integration-session-only (`parallel-sessions.md`).

## Task file schema
```yaml
---
id: 0007
title: <title>
kind: feature            # idea | feature | fix | doc | decision
status: backlog          # mirror; the FOLDER is authoritative
epic: <slug>             # topic grouping; one lead owns an epic
spec:                    # docs/superpowers/specs/...  (set by brainstorming)
plan:                    # docs/superpowers/plans/...   (set by writing-plans)
branch:                  # set when claimed
parent:                  # task id this descends from (optional)
proposed_by: lead        # user | lead
idea_status:             # awaiting-go-no-go | approved | rejected  (kind:idea only)
created: <YYYY-MM-DD>
owner:                   # accountable human/role (stamped on claim)
lead:                    # session/agent driving it (stamped on claim)
started:                 # claim time (stamped on claim)
reviewers:
  functional: pending    # pending | pass | fail
  code_quality: pending
gates:                   # green | failing
merge_commit:            # done
merged:                  # done date
deploy_sha:              # shipped
shipped:                 # shipped date
verified:                # ok | awaiting-operator | failed
release:                 # back-pointer to RELEASES.md line
terminal:                # parked | superseded (docs/decisions only)
---

## Goal
One sentence — the user-facing outcome.

## Acceptance
- [ ] Runnable criteria the functional reviewer ticks off with evidence.
- [ ] [vm] criteria tagged [vm] are re-verified on the VM after deploy.

## Context / Links
Spec + plan in frontmatter; related tasks, screenshots, gotchas.

## Notes
Append-only: decisions, blockers, reviewer EVIDENCE (per acceptance item), deploy/verify results.
```
