# Spec — task-board-plugin: Kanban + Telegram + onboarding

- Status: accepted (foundational design decisions made 2026-06-18)
- Task: `.claude/tasks/backlog/0001-design-and-build-kanban-plugin.md`
- Charter: [KICKOFF.md](../../KICKOFF.md)

## Problem
A project's task board lives as committed markdown in `.claude/tasks/<status>/NNNN-slug.md` (the folder
is the status). We need an **installable, project-agnostic** way to (1) view any such board as a
mobile-friendly Kanban, (2) get Telegram alerts on two lifecycle events, and (3) scaffold the whole
workflow into a fresh consumer project in one step. `datablocks` is the first consumer; nothing may
couple to its internals — the board schema in KICKOFF.md is the only contract.

## Foundational decisions (the "what kind of plugin" question)
| Question | Decision | Rationale |
| --- | --- | --- |
| Delivery shape | **Monorepo: a Next.js web app + a Claude Code plugin** | The "mobile-friendly, independently hostable" UI wants a web app; the "one-step onboarding" + notifications want a CC plugin. One repo ships both. |
| Board access | **GitHub API** (git Trees + blobs), not clone | Serverless-friendly (Vercel), no persistent disk, fast for mobile, naturally project-agnostic. |
| Auth | **GitHub App** (fine-grained, read-only contents, per-repo install) | Reusable/multi-tenant, rotating tokens, least privilege. A single fine-grained PAT is supported as a dev/solo fallback. |
| Telegram | **Reuse `telegram@claude-plugins-official`** | Don't run a second bot. Reuse its bot token + paired chat. |

### Telegram reuse — important consequence
The official telegram plugin is an **MCP server that runs inside a Claude Code session**; it exposes
`reply`/`react`/`edit_message` to the assistant and stores its bot token at
`~/.claude/channels/telegram/.env` (`TELEGRAM_BOT_TOKEN`) plus paired chat IDs in its state dir. It is
not a fire-from-anywhere webhook. Therefore:
- **Notifications originate in the Claude Code session where board transitions happen** (the board
  keeper), not from the hosted web app. This matches `task-workflow.md` ("the board keeper commits each
  move") and its note that transport is a later sub-project ("until then report to the user directly").
- Our CC plugin reuses the telegram plugin's **bot token + paired chat** (read from
  `~/.claude/channels/telegram/`) and sends via the Telegram Bot API `sendMessage`. No second bot, no
  second pairing. If the telegram plugin isn't configured, we degrade to printing the notification in the
  session (the current "report directly" behaviour).
- The **web app sends no Telegram messages** — it is read-only over the board.

## Architecture
Monorepo (pnpm workspaces):
- `packages/board` — pure, dependency-light board domain: types, the status pipeline order, a markdown +
  YAML-frontmatter parser, and a `BoardSource` interface. Two sources:
  - `FsBoardSource` — reads a local directory (the `sample-board/` fixture, and the onboarding scaffold).
  - `GitHubBoardSource` — reads `.claude/tasks/**` from a repo via the GitHub API (Trees API recursive →
    raw blob fetch for `*.md`). Honors a `ref` (branch). (Response caching / conditional requests are a
    deferred enhancement — not implemented in v1; pages are `force-dynamic` and re-fetch per request.)
- `apps/web` — Next.js (App Router) + TypeScript + Tailwind. Mobile-first Kanban rendering the full
  pipeline (idea → backlog → in-progress → in-review → done → shipped). Picks the source from env:
  GitHub (App or PAT) when configured, else the bundled `sample-board/` fixture so it always renders.
- `plugin/` — the Claude Code plugin (`.claude-plugin/plugin.json`): an **onboarding skill** that
  scaffolds the workflow into a consumer repo, and a **notification** path reusing the telegram plugin.
- `sample-board/` — a committed fixture mirroring the schema (≥1 task in each status, an `awaiting-go-no-go`
  idea, a `done` task) so the UI and parser are demonstrable with no GitHub access.

## Board model (the only contract — from KICKOFF.md)
Statuses (folders), in pipeline order: `backlog`, `in-progress`, `in-review`, `done`, `shipped`, plus the
terminal `decisions`. Ideas live in `backlog/` with `kind: idea`. A task = YAML frontmatter (schema in
KICKOFF.md) + `## Goal / ## Acceptance / ## Context / ## Notes`. The **folder is authoritative**;
`status:` is a mirror. `id` (zero-padded) is identity and survives moves. Files: `NNNN-slug.md`.

## Notification events (Telegram)
- **idea-proposed** — a task with `kind: idea` + `idea_status: awaiting-go-no-go` → send its `## Goal`/pitch.
- **ship-ready** — a task lands in `done/` → notify so the human can authorize a deploy.

Detection (CC-plugin side): compare board state across a transition (the keeper knows what it just moved),
or diff `git` on the `.claude/tasks/` paths. First implementation can be a skill/command the keeper calls
on transition; a hook can automate it later.

## Onboarding / setup flow (first-class feature)
A CC plugin skill (e.g. `/task-board:setup`) that, run inside a consumer repo, scaffolds:
- `.claude/tasks/{backlog,in-progress,in-review,done,shipped,decisions,reviewers}/` with `.gitkeep`s,
  `README.md`, `RELEASES.md`,
- `.claude/rules/task-workflow.md` (the workflow rule),
- reviewer prompts under `.claude/tasks/reviewers/`,
- a pointer to the hosted Kanban + how to wire Telegram (reuse the telegram plugin),
- optionally a first task (`0001`).
Idempotent: never clobbers existing files; reports what it created vs. skipped. Templates are bundled in
the plugin so a project adopts the workflow without hand-copying.

## Non-goals
- Editing the board from the UI (read-only; the board is mutated only by the workflow in-repo).
- Multi-bot Telegram or a standalone notifier service (we reuse the telegram plugin).
- Real-time push to the web UI (poll/refresh is fine for v1).

## Acceptance (maps to task 0001)
1. Design decision captured — **this spec**.
2. [live] Kanban renders a real board (sample fixture now; datablocks once it pushes its board) on a phone.
3. Telegram fires on idea-proposed and ship-ready against a test board.
4. Onboarding scaffolds the workflow into a fresh consumer repo in one step.
5. datablocks can install it as the first consumer.

## Risks / open items
- **datablocks board not yet pushed to remote** → develop against `sample-board/`; the live-board path is
  validated once datablocks pushes (KICKOFF dependency).
- GitHub App registration is an operator step (out-of-band); PAT fallback unblocks dev.
- Telegram reuse depends on the user having configured the telegram plugin; degrade gracefully if not.
