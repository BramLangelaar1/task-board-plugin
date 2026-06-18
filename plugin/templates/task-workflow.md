# Task workflow (filesystem board)

The durable board is `.claude/tasks/{backlog,in-progress,in-review,done,shipped,decisions}/`. One
markdown file per task; **moving the file between folders IS the status change; commit the move.** The
**folder is authoritative** (the `status:` field is a mirror). Task files are `NNNN-slug.md`; the
zero-padded id is identity and survives moves. Schema: see `TEMPLATE.md` (next to this board).

> Installed by the `task-board` plugin (`/task-board:setup`). It is project-agnostic: it references a few
> optional skills/gates (e.g. `/gates`, a deploy command) that your project provides — wire them to your
> own toolchain, or drop the steps you don't use.

## Driver — the lead drives autonomously to ship-ready
There is NO background loop. In a session the lead (you) pull the next task you own and drive it
continuously `backlog → in-progress → in-review → done` via subagents, without pausing between phases.
Stop only: (a) at a lead-proposed idea's go/no-go gate, and (b) ALWAYS before deploy/ship — `done →
shipped` needs explicit user instruction. The committed board (not a loop) is what survives a session
ending.

## Ideas & go/no-go
Ideas live in `backlog/` as `kind: idea`. **User ideas are pre-approved.** A **lead-proposed idea** is
created with `idea_status: awaiting-go-no-go`, the user is notified with a one-paragraph pitch, and it is
a **blocking gate**: do no further work on that idea until the user replies go/no-go (you may pick up
other ready tasks meanwhile). go → `approved` → start work; no-go → `decisions/` as `kind: decision`.

## Ownership (one lead per epic)
A big topic is an `epic:`. One lead owns an epic + all its child tasks. Tasks in motion stamp
`owner` + `lead` + `epic` + `started`; a task in motion is owned by exactly ONE lead. Who's-on-what:
`git grep -l "lead:" .claude/tasks/in-progress .claude/tasks/in-review`.

## Board-keeper (how board state reaches the default branch)
The board is maintained by the session holding the default-branch checkout (the **board keeper**), which
**commits the board move after every transition**. Board files are tiny docs — committing them directly
is fine even if your project routes code through PRs. Parallel worktree leads own their epic's *code* on
a feature branch and route board transitions through the board keeper. In solo operation the active
session IS the keeper.

## Lifecycle
- Spec the work → create the task in `backlog/`, set `spec:`.
- Plan the work → add `plan:` (stays in `backlog/`).
- claim → move to `in-progress/`, stamp `owner/lead/epic/branch/started`; dispatch the implementer
  (track the plan's steps with an ephemeral TODO list — never committed).
- implementer DONE → move to `in-review/`; dispatch BOTH reviewers (see `.claude/tasks/reviewers/`):
  1. **functional/goal** — MUST run/exercise the feature and verify EACH `## Acceptance` item with
     evidence written into the task's `## Notes`. No approval without evidence.
  2. **code-quality** — reviews the whole branch; enforces your project's advisory rules + CLAUDE.md.
- AUTO-ADVANCE: `in-review/ → done/` the moment BOTH reviewers pass AND your gate check is green. Merge
  the feature branch (e.g. `git merge --no-ff -m "Merge: NNNN <one-liner>"` so each merge maps back to
  its task NNNN). Stamp `merge_commit/merged/gates`.
- `done/ → shipped/` ONLY via your deploy command + a passing post-deploy verification (smoke + any
  `[live]` items re-checked on the deployed environment). Stamp `deploy_sha/shipped/verified/release`
  and append a line to `RELEASES.md`.

## Non-deployable work
Specs, plans, audits, research, design docs terminate in `done/` with `kind: doc`,
`terminal: parked|superseded`. They NEVER enter `shipped/`. Their implementation children ship
separately and link back via `parent:`. `decisions/` holds terminal `kind: decision` records.

## Notification events (Telegram, via the `task-board` plugin's notify script)
- **idea-proposed** — a lead created a `kind: idea` `awaiting-go-no-go`; notify with the pitch.
- **ship-ready** — a task reached `done/` and is deployable; notify so the user can authorize a deploy.

Notifications are one-way (the keeper runs `notify` on a transition). To let the user **reply** and have
it applied, run the keeper session with `--channels plugin:telegram@claude-plugins-official` (reusing the
same bot); the lead applies the reply and commits the move: `go <id>` → approved → brainstorming,
`no-go <id>` → `decisions/`, `ship <id>` → deploy. Without the channel, alerts still send but replies
aren't received.

## Hard rules
Commit/push/merge/deploy ONLY on explicit user request. Keep the board on the default branch in sync by
committing each move.

## Task file schema — see `TEMPLATE.md`
