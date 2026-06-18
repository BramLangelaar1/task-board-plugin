# Task board

Durable board for this repo. **Moving a task file between folders IS its status change** — the folder is
authoritative; the `status:` frontmatter is a convenience mirror. The board lives on `main`; see
`.claude/rules/task-workflow.md` for the full workflow (this README is the quick map).

Folders: `backlog/` (ideas + specced/planned, not started) · `in-progress/` (an implementer subagent is
working it, owned by one lead) · `in-review/` (the two reviewers are checking it) · `done/` (merged to
main, gates green) · `shipped/` (deployed to the VM AND verified) · `decisions/` (terminal decision
records). `RELEASES.md` is the deploy log. `reviewers/` holds the two review prompts.

Task files: `NNNN-slug.md` (zero-padded id is identity; survives folder moves). Schema + lifecycle:
`.claude/rules/task-workflow.md`.

Who's working on what: `git grep -l "lead:" .claude/tasks/in-progress .claude/tasks/in-review`.
