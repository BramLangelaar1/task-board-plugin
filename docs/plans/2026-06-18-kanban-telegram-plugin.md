# Plan — task-board-plugin

Spec: [../specs/2026-06-18-kanban-telegram-plugin.md](../specs/2026-06-18-kanban-telegram-plugin.md)

Build order is a sequence of vertical slices; each slice is independently demonstrable. Slices map to
child tasks of `0001` (epic `kanban`).

## Slice 0 — Monorepo scaffold + sample board (foundation)
- pnpm workspace: `packages/board`, `apps/web`, `plugin/`, `sample-board/`.
- Root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.nvmrc`, README.
- `sample-board/.claude/tasks/**` fixture: a task in every status, an `awaiting-go-no-go` idea, a `done`
  task, a `decisions` record. Mirrors the schema exactly.
- **Done when:** `pnpm install` clean; fixture parses.

## Slice 1 — `packages/board` (domain + parser + sources)
- Types for the task frontmatter + parsed task + board (columns).
- `STATUSES` pipeline order; folder↔status mapping.
- `parseTask(markdown)` → frontmatter (gray-matter/yaml) + sections (Goal/Acceptance/Context/Notes).
- `BoardSource` interface → `loadBoard(): Promise<Board>`.
- `FsBoardSource(rootDir)` — walk `.claude/tasks/<status>/*.md`.
- Unit tests against `sample-board/` (vitest): every status populated, idea detected, ship-ready detected.
- **Done when:** tests green; `FsBoardSource` loads the fixture into typed columns.

## Slice 2 — `apps/web` Kanban UI (mobile-first) over the fixture
- Next.js App Router + Tailwind. Server component loads the board via `FsBoardSource` (sample) by default.
- Columns for the full pipeline; mobile: horizontal-scroll/snap or status tabs; task cards show id, title,
  kind, epic, owner/lead, reviewer state; idea + ship-ready badges; tap → task detail (Goal/Acceptance/Notes).
- Responsive, dark-friendly, fast. A refresh control.
- **Done when:** renders the fixture; usable on a phone viewport (acceptance #2 against the fixture).

## Slice 3 — `GitHubBoardSource` + live board
- Native `fetch` (no SDK dep); auth resolver: GitHub App (installation token via `node:crypto` JWT) or
  PAT (`GITHUB_TOKEN`) from env, else unauthenticated for public repos.
- Trees API (recursive) to enumerate `.claude/tasks/**`, fetch `*.md` raw blobs, parse via `packages/board`.
- Env config: `BOARD_REPO=owner/name`, `BOARD_REF` (default branch), auth vars. Source selector:
  GitHub if configured else fixture. (Short-TTL cache / conditional requests: deferred, not in v1.)
- **Done when:** pointing at this very repo (public) renders its real board; works deployed to Vercel.

## Slice 4 — Onboarding skill (CC plugin)
- `plugin/.claude-plugin/plugin.json` + `skills/setup/SKILL.md`.
- Bundled templates: rule, reviewer prompts, board READMEs, RELEASES.md, task template, first task.
- Idempotent scaffold into the consumer repo; report created vs skipped; print Kanban + Telegram wiring.
- **Done when:** running it in an empty repo produces a valid, parseable board (acceptance #4).

## Slice 5 — Telegram notifications (reuse telegram plugin)
- Read bot token from `~/.claude/channels/telegram/.env` + paired chat from its state dir; send via Bot
  API `sendMessage`. Degrade to printing if not configured.
- A skill/command the board keeper calls on transition; payloads for idea-proposed / ship-ready.
- **Done when:** both events deliver to Telegram against a test board (acceptance #3).

## Slice 6 — datablocks as first consumer + docs
- Install/onboarding instructions; verify against datablocks once it pushes its board.
- Top-level README: install, host the web app, wire Telegram, run setup (acceptance #5).

## Cross-cutting
- TS strict everywhere; vitest for `packages/board`; Playwright optional for the UI later.
- Commit/push ONLY on explicit user request (CLAUDE.md hard rule). Board moves via the board keeper.
- Gate check (lint/typecheck/test) green before in-review→done.
