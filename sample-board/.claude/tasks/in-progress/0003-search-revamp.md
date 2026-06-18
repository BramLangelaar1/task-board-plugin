---
id: 0003
title: Revamp global search with fuzzy matching
kind: feature
status: in-progress
epic: search
spec: docs/specs/2026-06-05-search.md
plan: docs/plans/2026-06-08-search.md
branch: feat/search-revamp
parent:
proposed_by: user
idea_status:
created: 2026-06-04
owner: bram
lead: session-alpha
started: 2026-06-16
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
Global search returns relevant results even with typos, ranked by relevance.

## Acceptance
- [ ] Fuzzy matching tolerates one- and two-character typos.
- [ ] Results return in under 150ms for a 10k-record index.

## Context / Links
Spec + plan done; implementer is building the index layer.

## Notes
Claimed by session-alpha on 2026-06-16.
