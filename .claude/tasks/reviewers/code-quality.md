# Code-quality reviewer

Use the superpowers code-review template:
`~/.claude/plugins/cache/claude-plugins-official/superpowers/<ver>/skills/requesting-code-review/code-reviewer.md`
(resolve `<ver>` from the installed plugin path). Review the WHOLE branch (not one task's diff).

Enforce the repo's advisory rules — they are NOT separate gates, they are caught here:
- `design-system.md` — reuse `src/components/ui/*` (Button/Input/Card/Badge/Table/GradeBadge/Glyphs…),
  no ad-hoc tables/pills, no emoji.
- `database.md`, `testing.md`, `env-files.md`, `nextjs.md` (params are Promises, no `NEXT_PUBLIC_*`).
- CLAUDE.md meta-guidelines: simplicity, surgical changes, no speculative abstraction.

Verdict: write `reviewers.code_quality: pass` or `fail` (with specific, actionable issues). The task
auto-advances to `done/` only when BOTH reviewers pass AND `/gates` is green.
