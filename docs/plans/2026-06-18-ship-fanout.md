# Plan — done→shipped fan-out

Spec: [../specs/2026-06-18-ship-fanout.md](../specs/2026-06-18-ship-fanout.md)

Steps (each with a verify):

1. **Schema** — add `deployable?: boolean` to `TaskFrontmatter` (`packages/board/src/types.ts`).
   → verify: `pnpm --filter @task-board/board typecheck` clean.

2. **Fan-out script** — `plugin/scripts/ship-fanout.mjs` (node built-ins only), exporting
   `parseFrontmatter`, `isDeployable`, `runFanout({repoRoot, deploySha, date, verified, isAncestor, dryRun, log})`,
   plus an `import.meta`-main CLI wrapper (default `isAncestor` = `git merge-base --is-ancestor` in
   `repoRoot`; default `date` = today; flags `--dry-run`, `--verified <state>`).
   → verify: run the CLI `--dry-run` against a hand-made temp board; counts/skip-reasons print correctly.

3. **Unit test** — `packages/board/test/ship-fanout.test.ts` over the mixed window (spec §Test), importing
   the `.mjs` with a stubbed `isAncestor` + fixed date.
   → verify: `pnpm --filter @task-board/board test` green; the new test asserts moved=1/skipped=2/carried=3.

4. **Skill** — `plugin/skills/ship/SKILL.md` (`user-invocable: true`, `allowed-tools: Bash, Read`) that runs
   the script with `<deploy_sha>`, explains the deployability filter + dry-run.
   → verify: frontmatter valid; references the script path via `${CLAUDE_PLUGIN_ROOT}`.

5. **TEMPLATE.md** — add the `deployable:` line + comment. → verify: scaffold still parses.

6. **Rule** — `plugin/templates/task-workflow.md` `done → shipped` step: state the fan-out MUST skip
   non-deployable tasks (`kind: doc` / `deployable: false`); they stay terminal in `done/`. Re-sync the
   dogfooded `.claude/rules/task-workflow.md` (keep byte-identical).
   → verify: `diff` identical; grep shows the explicit filter sentence.

7. **Doc fix (folded)** — notify skill "One inbound stream per bot": add the enabled-but-no-`--channels`
   trap sentence. → verify: grep shows it.

8. **Version** — `plugin/.claude-plugin/plugin.json` `0.1.2 → 0.2.0`.

9. **Board** — task `0003` rides the lifecycle: in-progress (claimed) → in-review (both reviewers) →
   done on the `--no-ff` merge.

## Cross-cutting
- node built-ins only in the script (no deps); simplicity-first.
- Commit/push/merge only on explicit user request (already given for this feature).
- Both reviewers + gates green before done.
