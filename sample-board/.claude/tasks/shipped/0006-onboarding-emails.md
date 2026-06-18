---
id: 0006
title: Send onboarding email sequence
kind: feature
status: shipped
epic: growth
spec: docs/specs/2026-05-01-onboarding-emails.md
plan: docs/plans/2026-05-03-onboarding-emails.md
branch: feat/onboarding-emails
parent:
proposed_by: user
idea_status:
created: 2026-04-28
owner: bram
lead: session-alpha
started: 2026-05-05
reviewers:
  functional: pass
  code_quality: pass
gates: green
merge_commit: f6e5d4c
merged: 2026-05-30
deploy_sha: 9z8y7x6
shipped: 2026-06-02
verified: ok
release: RELEASES.md#2026-06-02
terminal:
---

## Goal
New users receive a three-email onboarding sequence over their first week.

## Acceptance
- [ ] Emails 1/2/3 send at signup, day 3, and day 7.
- [ ] [live] Delivery verified in production after deploy.

## Context / Links
Live in production since 2026-06-02.

## Notes
Deployed at 9z8y7x6; post-deploy verification OK.
