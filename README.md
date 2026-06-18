# task-board-plugin

An **installable plugin** that turns any project's filesystem task board
(`.claude/tasks/`, committed markdown) into a **mobile-friendly Kanban UI** (idea → backlog →
in-progress → in-review → done → shipped) plus **Telegram notifications** (idea-proposed, ship-ready).

Project-agnostic: point it at a repo's board, it renders + notifies. `datablocks` is the first consumer.

**Status:** kickoff — not yet designed/built. A fresh lead should start at **[KICKOFF.md](./KICKOFF.md)**,
then run the superpowers flow (brainstorming → writing-plans → subagent-driven-development).

Origin / design source: the `datablocks` project's task-workflow spec (see KICKOFF.md for paths).
