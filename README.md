# task-board-plugin

An **installable, project-agnostic plugin** that turns any project's filesystem task board
(`.claude/tasks/`, committed markdown) into:

1. a **mobile-friendly Kanban UI** rendering the full pipeline (idea → backlog → in-progress → in-review
   → done → shipped),
2. **Telegram notifications** for two lifecycle events (idea-proposed, ship-ready), and
3. a one-step **onboarding/setup** flow that scaffolds the whole workflow into a fresh consumer project.

Point it at any repo's `.claude/tasks/` and it just works. `datablocks` is the first consumer; nothing is
coupled to it — the [board schema](./KICKOFF.md) is the only contract.

See **[KICKOFF.md](./KICKOFF.md)** for the charter, **[docs/specs](./docs/specs)** for the design
decisions, and **[docs/plans](./docs/plans)** for the build plan.

## What's in here (monorepo)

| Package | What it is |
| --- | --- |
| `packages/board` | The board domain — schema types, the status pipeline, a markdown+frontmatter task parser, and `BoardSource` backends (`FsBoardSource` for local/fixtures, `GitHubBoardSource` for a live repo over the GitHub API). Pure, dependency-light, unit-tested. |
| `apps/web` | The Kanban UI — Next.js (App Router) + Tailwind, mobile-first. Reads a board from `GitHubBoardSource` when configured, else the bundled `sample-board/` fixture. Independently hostable (e.g. Vercel). |
| `plugin/` | The Claude Code plugin — an onboarding **setup** skill that scaffolds the workflow into a consumer repo, and a **notify** path that reuses the official telegram plugin's bot. |
| `sample-board/` | A fixture board mirroring the schema (every status populated) so the UI and parser run with no GitHub access. |

## Architecture decisions

- **Delivery:** a web app (the hostable Kanban) **plus** a Claude Code plugin (onboarding + notify) in one
  repo.
- **Board access:** the **GitHub API** (git Trees + raw blobs) — serverless-friendly, no clone.
- **Auth:** a **GitHub App** (fine-grained, read-only contents) with a Personal Access Token fallback for
  dev; public repos read unauthenticated.
- **Telegram:** **reuse `telegram@claude-plugins-official`** — its bot token + paired chat, no second bot.
  Because that plugin is an MCP server living inside a Claude Code session, notifications fire from the
  session where board transitions happen (the board keeper), not from the web app. If telegram isn't
  configured, notifications degrade to printing the message.

## Run the Kanban locally

```sh
pnpm install
pnpm dev            # http://localhost:3000 — renders the sample-board fixture by default
```

Configure a live board with env (see `apps/web/.env.example`):

```sh
BOARD_REPO=owner/name          # the repo whose .claude/tasks to render
BOARD_REF=main                 # optional; defaults to the repo's default branch
# Auth (pick one; omit for public repos):
GITHUB_TOKEN=ghp_...           # PAT fallback
# or a GitHub App:
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
GITHUB_APP_INSTALLATION_ID=...
# Fixture override (when BOARD_REPO is unset):
BOARD_FS_ROOT=../../sample-board
```

## Adopt the workflow in a project (onboarding)

Install the plugin and run **`/task-board:setup`** inside the target repo — it scaffolds `.claude/tasks/`
(all status folders), `.claude/rules/task-workflow.md`, the reviewer prompts, a task template, and a
deploy log, idempotently (never clobbers existing files). It runs
`node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs"`, which you can also invoke directly. Then point the
hosted Kanban at the repo (`BOARD_REPO`) and wire Telegram by installing
`telegram@claude-plugins-official`; the board keeper fires **`/task-board:notify`** on idea-proposed /
ship-ready transitions.

## Develop

```sh
pnpm test           # board unit tests
pnpm typecheck      # all packages
pnpm build          # build the web app
```

Conventions and the task workflow live in [CLAUDE.md](./CLAUDE.md) and
[.claude/rules/task-workflow.md](./.claude/rules/task-workflow.md). Commit/push only on explicit request.
