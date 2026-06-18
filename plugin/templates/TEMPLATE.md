# Task file template

Copy this into `.claude/tasks/<status>/NNNN-slug.md`. The **folder** is the authoritative status; the
`status:` field below is a mirror. `NNNN` is a zero-padded id and is the task's identity — it survives
moves between folders.

```yaml
---
id: 0001
title: <title>
kind: feature            # idea | feature | fix | doc | decision
deployable:              # false → stays terminal in done/ (never ships); kind:doc never ships
status: backlog          # mirror; the FOLDER is authoritative
epic: <slug>             # topic grouping; one lead owns an epic
spec:                    # path to the spec doc (set when specced)
plan:                    # path to the plan doc (set when planned)
branch:                  # set when claimed
parent:                  # task id this descends from (optional)
proposed_by: user        # user | lead
idea_status:             # awaiting-go-no-go | approved | rejected  (kind:idea only)
created: <YYYY-MM-DD>
owner:                   # accountable human/role (stamped on claim)
lead:                    # session/agent driving it (stamped on claim)
started:                 # claim time (stamped on claim)
reviewers:
  functional: pending    # pending | pass | fail
  code_quality: pending
gates:                   # green | failing
merge_commit:            # done
merged:                  # done date
deploy_sha:              # shipped
shipped:                 # shipped date
verified:                # ok | awaiting-operator | failed
release:                 # back-pointer to RELEASES.md line
terminal:                # parked | superseded (docs/decisions only)
---

## Goal
One sentence — the user-facing outcome.

## Acceptance
- [ ] Runnable criteria the functional reviewer ticks off with evidence.
- [ ] [live] criteria tagged [live] are re-verified on the deployed environment after ship.

## Context / Links
Spec + plan in frontmatter; related tasks, screenshots, gotchas.

## Notes
Append-only: decisions, blockers, reviewer EVIDENCE (per acceptance item), deploy/verify results.
```
