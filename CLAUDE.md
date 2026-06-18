# task-board-plugin

You are the lead engineer for this repo. **Before anything else, read [KICKOFF.md](./KICKOFF.md)** — it
is the complete charter and design handoff (you do not need any prior chat).

This is an **installable, project-agnostic plugin**: a mobile-friendly Kanban UI + Telegram
notifications over a project's `.claude/tasks/` board (committed markdown). `datablocks` is the first
consumer. Do not couple to datablocks internals — the board schema in KICKOFF.md is the only contract.

Workflow: this repo follows the same superpowers flow as its design origin — `brainstorming` → spec →
`writing-plans` → plan → `subagent-driven-development`. Start with brainstorming; the first design
question is "what kind of plugin" (Claude Code plugin vs npm/CLI), hosting, auth, and how it reads the
board (GitHub API vs clone). Commit/push only on explicit user request.
