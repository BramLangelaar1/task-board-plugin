---
id: 0004
title: Rate-limit the public API
kind: feature
status: in-review
epic: platform
spec: docs/specs/2026-06-01-rate-limit.md
plan: docs/plans/2026-06-02-rate-limit.md
branch: feat/rate-limit
parent:
proposed_by: user
idea_status:
created: 2026-05-30
owner: bram
lead: session-beta
started: 2026-06-13
reviewers:
  functional: pass
  code_quality: pending
gates: failing
merge_commit:
merged:
deploy_sha:
shipped:
verified:
release:
terminal:
---

## Goal
Protect the public API with per-key rate limits and clear 429 responses.

## Acceptance
- [ ] Requests over the limit get a 429 with a Retry-After header.
- [ ] Limits are configurable per API key.

## Context / Links
Implementation complete; under review.

## Notes
Functional reviewer: PASS — verified 429 + Retry-After against a load test.
Code-quality review in progress; gates currently failing on a lint rule.
