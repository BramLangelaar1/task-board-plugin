# Spec — deployability-aware done→shipped fan-out

- Status: accepted
- Task: `.claude/tasks/in-progress/0003-ship-fanout.md`
- Origin: requested by user; a real consumer (datablocks) hit the over-shipping problem.

## Problem
The plugin scaffolds the `done → shipped` step of the workflow but ships **no fan-out tooling**, so every
consumer hand-rolls the move. The naïve implementation — "move every `done/` task carried by `<deploy_sha>`
into `shipped/`" — **over-ships**: non-deployable tasks (`kind: doc`, ops/test-only work) must stay
terminal at `done/` (the rule says they never ship). We provide a correct reference implementation.

## Deliverables
1. **`plugin/scripts/ship-fanout.mjs`** — node-built-ins-only fan-out, run in the consumer repo root:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/ship-fanout.mjs" <deploy_sha> [--dry-run] [--verified <state>]`.
2. **`/task-board:ship`** skill (`plugin/skills/ship/SKILL.md`, `user-invocable`) that runs it.
3. **`deployable:`** field added to the schema (`packages/board` `TaskFrontmatter`) and `TEMPLATE.md`.
4. **Rule update** — `task-workflow.md` template (+ dogfooded repo rule) make the `done → shipped` step
   explicit that the fan-out MUST skip non-deployable tasks.
5. **Unit test** over a mixed deployable/non-deployable window.
6. **(folded in)** notify skill clarification: the "enabled-but-no-`--channels`" trap.

## Behaviour — `runFanout({ repoRoot, deploySha, date, verified, isAncestor, dryRun, log })`
1. **Select carried** `done/` tasks: a task is carried iff it has `merge_commit` and
   `isAncestor(merge_commit, deploySha)` is true. Default `isAncestor` = `git merge-base --is-ancestor`
   (run in `repoRoot`); injectable for tests. Tasks with no `merge_commit`, or whose merge isn't an
   ancestor, are **not** carried (stay in `done/`).
2. **Filter deployable**: a carried task is deployable iff `frontmatter.deployable !== false` **and**
   `kind !== "doc"`. Non-deployable carried tasks are **skipped** (stay terminal in `done/`) and named in
   the output.
3. **Move + stamp** each deployable-carried task: `git mv` (or fs move) `done/NNNN-*.md → shipped/`, set
   `status: shipped`, `deploy_sha: <sha>`, `shipped: <date>`, `verified: <state>` (default `ok`;
   overridable), `release: RELEASES.md#<short-sha>`.
4. **Append RELEASES.md**: one line per run —
   `- <date> — deploy <short-sha> — <id title>, <id title> — verified <state>`.
5. **Report** (no silent truncation): `carried=N skipped(non-deployable)=M moved=K`, list each skipped task
   with its reason (`kind:doc` / `deployable:false`). `--dry-run` prints the plan and changes nothing.

### Deployability rule (precise)
`deployable(task) = (task.frontmatter.deployable !== false) && (task.kind !== "doc")`
- `kind: doc` → never ships (matches "Non-deployable work terminates in `done/`").
- `deployable: false` → opt a task of any kind out of shipping (infra/ops/test-only).
- default (unset) → deployable, for the normal `feature`/`fix` case.

## Schema
Add to `TaskFrontmatter`: `deployable?: boolean`. Add to `TEMPLATE.md` with a comment
(`deployable:  # false → stays terminal in done/ (never ships); kind:doc never ships`). No change to the
Kanban rendering is required.

## Testability
`ship-fanout.mjs` exports `parseFrontmatter`, `isDeployable`, and `runFanout` (with injectable
`isAncestor`/`date`), plus a CLI entry guarded by an `import.meta`-main check. The vitest lives in
`packages/board/test/ship-fanout.test.ts` and imports the `.mjs` directly (it only uses node built-ins).

## Test — mixed window
Build a temp `repoRoot/.claude/tasks/done/` with: a deployable `feature` (carried), a `kind: doc`
(carried), a `feature` with `deployable: false` (carried), and a deployable `feature` **not** carried.
Stub `isAncestor` to return true only for the three "carried" merge_commits. Run `runFanout` with a fixed
date. Assert: only the deployable-carried feature moved to `shipped/` (correct stamps); the doc and the
`deployable:false` feature stayed in `done/`; the not-carried feature stayed in `done/`; RELEASES.md got
exactly one line naming only the moved task; reported counts are `carried=3 skipped=2 moved=1`.

## Non-goals
- No change to the auto-advance (`in-review → done`) logic.
- No deploy execution — the fan-out runs **after** a passing post-deploy verification (per the rule).
- Not coupled to any consumer; pure git + filesystem.

## Folded-in doc fix (the `--channels` trap)
Add to the notify skill's "One inbound stream per bot" section: *if the telegram plugin is enabled in a
session, that session must run with `--channels` — otherwise it still consumes the bot's `getUpdates` and
**silently drops** replies; don't leave it enabled in a non-channel session.* (This is the exact failure
that made go/no-go replies vanish until the keeper was relaunched with `--channels`.)

## Version
Bump the plugin `0.1.2 → 0.2.0` (new capability + schema field; supersedes the standalone 0.1.3 doc bump).
