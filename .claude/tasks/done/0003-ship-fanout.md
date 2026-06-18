---
id: 0003
title: Deployability-aware done→shipped fan-out (+ ship skill, deployable schema)
kind: feature
status: done
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
  functional: pass
  code_quality: pass
gates: green
merge_commit: 6206039
merged: 2026-06-18
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
- [x] `plugin/scripts/ship-fanout.mjs <deploy_sha>` moves only deployable, carried `done/` tasks to
      `shipped/`, stamps `deploy_sha/shipped/verified/release`, and appends one `RELEASES.md` line.
- [x] Non-deployable carried tasks (`kind: doc` or `deployable: false`) stay terminal in `done/` and are
      reported as skipped (no silent truncation).
- [x] `/task-board:ship` skill runs it (user-invocable); `--dry-run` previews without changes.
- [x] `deployable:` added to the schema (`TaskFrontmatter`) + `TEMPLATE.md`; rule's done→shipped step
      states the fan-out MUST filter non-deployable tasks.
- [x] Unit test over a mixed window asserts moved=1 / skipped=2 / carried=3.
- [x] notify skill documents the enabled-but-no-`--channels` trap.

## Context / Links
Spec + plan in frontmatter. Origin: user request; datablocks hit the over-shipping problem. Builds on the
done→shipped workflow defined in `task-workflow.md`.

## Notes
Lifecycle on branch `feat/ship-fanout`: claimed → in-progress → implemented by subagent → in-review.

Implementer (subagent): built the fan-out + skill + schema + template/rule + tests; 21→ tests green.

Two independent reviewers (fresh, not self-assessed):
- **Functional — PASS**: ran the tests + an adversarial harness (carried doc skipped, `deployable:false`
  of kind `fix` skipped, no-`merge_commit` excluded, uncarried left in `done/`); correct stamps; `--dry-run`
  side-effect-free.
- **Code-quality — CONDITIONAL PASS**, all conditions cleared:
  - MEDIUM: `RELEASES.md` line format contradicted `templates/RELEASES.md` → aligned to the parseable
    `<date> | deploy_sha=<full sha> | verified=<state> | tasks=<id,id>`; the scaffolded "(no deploys yet)"
    placeholder is now stripped on first deploy.
  - LOW: `setField` could clobber a body line → scoped to the frontmatter block (+ regression test);
    move made atomic (undo shipped copy if the done-side rm fails); `release:` `#sha` dead anchor → plain
    `RELEASES.md`; added a replace-path/body-guard test.
- Functional note: re-synced the repo's dogfood `.claude/tasks/TEMPLATE.md` (now carries `deployable:`).

Gate green: 22 board tests pass, typecheck clean. Auto-advances to `done/` on the `--no-ff` merge.
