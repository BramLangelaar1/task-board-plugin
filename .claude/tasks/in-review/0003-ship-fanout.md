---
id: 0003
title: Deployability-aware done→shipped fan-out (+ ship skill, deployable schema)
kind: feature
status: in-review
epic: workflow
spec: docs/specs/2026-06-18-ship-fanout.md
plan: docs/plans/2026-06-18-ship-fanout.md
branch: feat/ship-fanout
parent: 0001
proposed_by: user
idea_status:
created: 2026-06-18
owner: bram
lead: claude-opus-4-8
started: 2026-06-18
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
Ship a correct, reusable `done → shipped` fan-out so consumers don't re-implement it wrong — it must
**skip non-deployable tasks** (`kind: doc` / `deployable: false`) instead of over-shipping them.

## Acceptance
- [ ] `plugin/scripts/ship-fanout.mjs <deploy_sha>` moves only deployable, carried `done/` tasks to
      `shipped/`, stamps `deploy_sha/shipped/verified/release`, and appends one `RELEASES.md` line.
- [ ] Non-deployable carried tasks (`kind: doc` or `deployable: false`) stay terminal in `done/` and are
      reported as skipped (no silent truncation).
- [ ] `/task-board:ship` skill runs it (user-invocable); `--dry-run` previews without changes.
- [ ] `deployable:` added to the schema (`TaskFrontmatter`) + `TEMPLATE.md`; rule's done→shipped step
      states the fan-out MUST filter non-deployable tasks.
- [ ] Unit test over a mixed window asserts moved=1 / skipped=2 / carried=3.
- [ ] notify skill documents the enabled-but-no-`--channels` trap.

## Context / Links
Spec + plan in frontmatter. Origin: user request; datablocks hit the over-shipping problem. Builds on the
done→shipped workflow defined in `task-workflow.md`.

## Notes
Lifecycle on branch `feat/ship-fanout`: claimed → in-progress (this), implemented by subagent, then both
reviewers, then done on the `--no-ff` merge.
