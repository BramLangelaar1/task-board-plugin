# Task board

Durable board for this repo. **Moving a task file between folders IS its status change** — the folder is
authoritative; the `status:` frontmatter is a convenience mirror. See `../rules/task-workflow.md` for the
full workflow (this README is the quick map).

Folders: `backlog/` (ideas + specced/planned, not started) · `in-progress/` (an implementer is working
it, owned by one lead) · `in-review/` (the two reviewers are checking it) · `done/` (merged, gates green)
· `shipped/` (deployed AND verified) · `decisions/` (terminal decision records). `RELEASES.md` is the
deploy log. `reviewers/` holds the two review prompts. `TEMPLATE.md` is the task file schema.

Task files: `NNNN-slug.md` (zero-padded id is identity; survives folder moves).

Who's working on what: `git grep -l "lead:" .claude/tasks/in-progress .claude/tasks/in-review`.

This board + workflow was scaffolded by the `task-board` plugin. View it as a Kanban by pointing the
hosted UI at this repo (`BOARD_REPO=owner/name`); get Telegram alerts by installing
`telegram@claude-plugins-official` and running the plugin's notify script on `idea-proposed`/`ship-ready`.
