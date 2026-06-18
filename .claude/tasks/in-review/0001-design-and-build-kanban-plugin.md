---
id: 0001
title: Design & build the task-board Kanban + Telegram plugin
kind: feature
status: in-review
epic: kanban
spec: docs/specs/2026-06-18-kanban-telegram-plugin.md
plan: docs/plans/2026-06-18-kanban-telegram-plugin.md
branch: feat/kanban-telegram-plugin
parent:
proposed_by: user
created: 2026-06-18
owner: bram
lead: claude-opus-4-8
started: 2026-06-18
reviewers:
  functional: pass
  code_quality: pass
gates: green
merge_commit:
merged:
deploy_sha:
shipped:
verified:
release:
terminal:
---

## Goal
Ship an installable, project-agnostic plugin that renders any project's `.claude/tasks/` board as a
mobile-friendly Kanban (idea → shipped) and sends Telegram alerts for idea-proposed / ship-ready.

## Acceptance
- [ ] A design decision on "what kind of plugin" (Claude Code plugin vs npm/CLI), hosting, auth, and how
      it reads the board (GitHub API vs clone) — captured in a spec.
- [ ] [live] The Kanban renders a real board (datablocks' once pushed, or a committed sample fixture) on a phone.
- [ ] Telegram fires on idea-proposed and ship-ready against a test board.
- [ ] An onboarding/setup flow scaffolds the workflow (board + rule + reviewer prompts + Telegram config)
      into a fresh consumer project in one step.
- [ ] datablocks can install it as the first consumer.

## Context / Links
Full charter + board schema + constraints: ../../KICKOFF.md (repo root KICKOFF.md). Design origin:
datablocks task-workflow spec (paths in KICKOFF.md).

## Notes
Built as a pnpm monorepo: `packages/board` (parser + Fs/GitHub sources), `apps/web` (Next.js mobile
Kanban), `plugin/` (CC plugin: `/task-board:setup` + `/task-board:notify`), `sample-board/` fixture.

Reviewer evidence (functional, per acceptance item):
- Design decision captured → `docs/specs/2026-06-18-kanban-telegram-plugin.md` (monorepo + GitHub API +
  GitHub App auth + reuse telegram plugin). PASS.
- [live] Kanban renders a real board on a phone → fixture verified via mobile + desktop screenshots; the
  live path verified too — `GitHubBoardSource` read this private repo over the GitHub API and the web app
  rendered it (`github:BramLangelaar1/task-board-plugin@main`). PASS (datablocks' own live board pending
  its push — see blocked item).
- Telegram fires on idea-proposed & ship-ready → both verified via `notify.mjs --dry-run` on sample
  tasks; degrades to printing when telegram is unconfigured. PASS (live send needs the telegram plugin
  configured + paired).
- Onboarding scaffolds the workflow in one step → `setup.mjs` verified idempotent (13 created → 13
  skipped); scaffolded board parses. PASS.
- datablocks can install it → install path ready; BLOCKED on datablocks pushing its board to the remote
  (KICKOFF dependency) before live end-to-end verification.

Code-quality: 5-dimension adversarial review (20 agents) → 10 confirmed findings fixed (incl. a high-sev
whole-board crash on malformed YAML, now degrades to a placeholder card), 5 correctly refuted as
out-of-scope. Gate green: 17 board tests pass, all typechecks clean, web builds.

Auto-advances to `done/` on the `--no-ff` merge of `feat/kanban-telegram-plugin`. The datablocks-live
acceptance item stays externally blocked until datablocks pushes its board.
