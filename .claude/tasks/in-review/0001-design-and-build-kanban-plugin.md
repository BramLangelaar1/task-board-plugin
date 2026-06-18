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
- [ ] [live] datablocks can install it as the first consumer (verified once datablocks runs its own onboarding task).

## Context / Links
Full charter + board schema + constraints: ../../KICKOFF.md (repo root KICKOFF.md). Design origin:
datablocks task-workflow spec (paths in KICKOFF.md).

## Notes
Built as a pnpm monorepo: `packages/board` (parser + Fs/GitHub sources), `apps/web` (Next.js mobile
Kanban), `plugin/` (CC plugin: `/task-board:setup` + `/task-board:notify`), `sample-board/` fixture.

Reviewed by TWO independent reviewers against the committed branch `feat/kanban-telegram-plugin`
(not self-assessed by the implementer):

**Functional reviewer — PASS** (verified by running each item):
- Item 1 (design decision) — spec states all four decisions (delivery / GitHub API / GitHub App auth /
  reuse telegram plugin). PASS.
- Item 2 [live] (renders a real board on a phone) — fixture: full pipeline + badges + task detail, mobile
  screenshots at 390×844; live: `GitHubBoardSource` rendered this repo over the GitHub API AND rendered
  datablocks' real board (`github:BramLangelaar1/datablocks@main`, 12 tasks). PASS.
- Item 3 (telegram idea-proposed / ship-ready) — both events well-formed via `notify.mjs --dry-run`;
  degrades to printing when unconfigured. PASS (live send needs the telegram plugin paired).
- Item 4 (onboarding in one step) — `setup.mjs` idempotent (13 created → 13 skipped); scaffolded board
  parses. PASS.
- Item 5 [live] (datablocks installs as first consumer) — BLOCKED on datablocks running its own
  onboarding task (`datablocks:.claude/tasks/backlog/0011-install-task-board-plugin.md`, still in its
  backlog). NOTE: the earlier "datablocks hasn't pushed its board" dependency is RESOLVED — its board is
  now on remote `main` and this plugin already renders it live.

**Code-quality reviewer — PASS**: re-verified all 10 fixes from the prior adversarial review (5-dimension,
20 agents) AND the de-datablocks cleanup on the final committed diff — zero datablocks-machinery leakage
(outside KICKOFF), `[vm]`→`[live]` complete, dogfooded `.claude/` files byte-identical to the shipped
templates. The adversarial review had fixed 10 confirmed findings (incl. a high-sev whole-board crash on
malformed YAML → now a placeholder card) and refuted 5 as out-of-scope.

Gate green: 17 board tests pass (+1 added for the Trees `truncated` guard), all typechecks clean, web builds.

Auto-advances to `done/` on the `--no-ff` merge of `feat/kanban-telegram-plugin`. Item 5 is a `[live]`
item — verified after datablocks adopts it (its task 0011); not a defect in this plugin.
