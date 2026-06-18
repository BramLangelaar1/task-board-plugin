---
id: 0005
title: Add an admin audit log
kind: feature
status: done
epic: platform
spec: docs/specs/2026-05-20-audit-log.md
plan: docs/plans/2026-05-22-audit-log.md
branch: feat/audit-log
parent:
proposed_by: user
idea_status:
created: 2026-05-18
owner: bram
lead: session-beta
started: 2026-05-25
reviewers:
  functional: pass
  code_quality: pass
gates: green
merge_commit: a1b2c3d
merged: 2026-06-14
deploy_sha:
shipped:
verified:
release:
terminal:
---

## Goal
Admins can see an immutable log of sensitive actions.

## Acceptance
- [ ] Every admin action records actor, target, and timestamp.
- [ ] [live] The log is queryable from the admin panel after deploy.

## Context / Links
Merged to main; awaiting deploy authorization.

## Notes
Both reviewers PASS, gates green, merged at a1b2c3d. Ship-ready — notify for deploy.
