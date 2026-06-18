# Releases

Append-only log of deploys. One line per deploy; the `done→shipped` step reads the previous `deploy_sha`
here as its lower bound (see `../rules/task-workflow.md`).

Format: `<date> | deploy_sha=<sha> | probe=<ok|FAILED> | tasks=<id,id,…>`

(no deploys yet)
