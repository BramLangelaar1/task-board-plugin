---
id: 0001
title: Design & build the task-board Kanban + Telegram plugin
kind: feature
status: backlog
epic: kanban
spec:
plan:
branch:
parent:
proposed_by: user
created: 2026-06-18
owner:
lead:
started:
reviewers:
  functional: pending
  code_quality: pending
gates:
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
- [ ] [vm] The Kanban renders a real board (datablocks' once pushed, or a committed sample fixture) on a phone.
- [ ] Telegram fires on idea-proposed and ship-ready against a test board.
- [ ] An onboarding/setup flow scaffolds the workflow (board + rule + reviewer prompts + Telegram config)
      into a fresh consumer project in one step.
- [ ] datablocks can install it as the first consumer.

## Context / Links
Full charter + board schema + constraints: ../../KICKOFF.md (repo root KICKOFF.md). Design origin:
datablocks task-workflow spec (paths in KICKOFF.md).

## Notes
First board node for this repo. Start with `brainstorming` (do not code first).
