---
name: setup
description: Scaffold the task-board workflow (the .claude/tasks board, the task-workflow rule, reviewer prompts, and a task template) into the current project in one step. Use when a project wants to adopt the filesystem task-board workflow or asks to "set up the task board".
user-invocable: true
allowed-tools: Bash, Read, Write
---

# Set up the task board in this project

Run the scaffold script in the consumer repo root:

```sh
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs"
```

(Pass a path as the first argument to target a different directory; defaults to the current directory.)

This creates, **idempotently** (existing files are never overwritten — they report `skipped: exists`):

- `.claude/tasks/{backlog,in-progress,in-review,done,shipped,decisions,reviewers}/` (each with a `.gitkeep`)
- `.claude/tasks/README.md`, `RELEASES.md`, `TEMPLATE.md` (the task-file schema)
- `.claude/tasks/reviewers/functional.md` and `code-quality.md`
- `.claude/rules/task-workflow.md`

After it runs:

1. **Commit** the new `.claude/` files (the board lives in git; moving a task file between folders is the
   status change).
2. **Kanban view** — deploy the `task-board` web app and set `BOARD_REPO=<owner>/<name>` (optionally
   `BOARD_REF=<branch>`) so it renders this repo's board on desktop and mobile.
3. **Telegram alerts** — install `telegram@claude-plugins-official`, create + pair a bot, then have the
   board keeper run the notify script (see the `notify` skill) on `idea-proposed` / `ship-ready`
   transitions. It reuses that bot — no second bot needed.
4. Create your first task by copying `.claude/tasks/TEMPLATE.md` into `.claude/tasks/backlog/`.

Report the created-vs-skipped summary the script prints back to the user.
