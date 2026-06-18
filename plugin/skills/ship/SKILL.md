---
name: ship
description: Fan out a deploy — move the deployable done/ tasks carried by a deploy sha into shipped/, stamp them, and append RELEASES.md. Use after a deploy + a passing post-deploy verification.
user-invocable: true
allowed-tools: Bash, Read
---

# Ship: done → shipped fan-out

Run this AFTER a deploy and a passing post-deploy verification, in the consumer repo root:

```sh
node "${CLAUDE_PLUGIN_ROOT}/scripts/ship-fanout.mjs" <deploy_sha>
```

It moves every **deployable** `done/` task carried by `<deploy_sha>` (its `merge_commit` is an ancestor of
the deploy) into `shipped/`, stamps `deploy_sha` / `shipped` / `verified` / `release`, and appends one line
to `.claude/tasks/RELEASES.md`.

**It MUST skip non-deployable tasks** — `kind: doc` and `deployable: false` stay terminal in `done/` and are
reported as skipped (never silently shipped). Tasks not carried by this deploy also stay in `done/` for a
later window.

Options:
- `--dry-run` — print the plan (carried / skipped / would-ship) and change nothing. Run this first.
- `--verified <state>` — stamp a different `verified` value (default `ok`; e.g. `awaiting-operator` when
  `[live]` checks still need a human).

After it runs, the board keeper commits the resulting `done/ → shipped/` moves + the RELEASES.md line.
