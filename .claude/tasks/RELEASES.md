# Releases

Append-only log of deploys. One line per deploy; the `done→shipped` fan-out reads the previous
`deploy_sha` here as its lower bound (see `.claude/rules/task-workflow.md`).

Format: `<date> | deploy_sha=<sha> | probe=<ok|FAILED> | tasks=<id,id,…>`

(no deploys yet — this repo has no deploy target until the plugin's hosting/distribution is designed)
