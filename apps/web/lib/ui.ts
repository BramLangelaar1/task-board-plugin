import type { ReviewState, StatusId, TaskKind } from "@task-board/board";

/** Visual metadata per status column: a label, an accent color, and a left-border tint for cards. */
export const STATUS_UI: Record<
  StatusId,
  { label: string; dot: string; text: string; bar: string }
> = {
  backlog: { label: "Backlog", dot: "bg-slate-400", text: "text-slate-300", bar: "border-l-slate-500/60" },
  "in-progress": { label: "In Progress", dot: "bg-amber-400", text: "text-amber-300", bar: "border-l-amber-500/70" },
  "in-review": { label: "In Review", dot: "bg-violet-400", text: "text-violet-300", bar: "border-l-violet-500/70" },
  done: { label: "Done", dot: "bg-emerald-400", text: "text-emerald-300", bar: "border-l-emerald-500/70" },
  shipped: { label: "Shipped", dot: "bg-teal-400", text: "text-teal-300", bar: "border-l-teal-500/70" },
  decisions: { label: "Decisions", dot: "bg-zinc-500", text: "text-zinc-400", bar: "border-l-zinc-600/70" },
};

export const KIND_UI: Record<TaskKind, { label: string; cls: string }> = {
  idea: { label: "idea", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  feature: { label: "feature", cls: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
  fix: { label: "fix", cls: "bg-rose-500/15 text-rose-300 ring-rose-500/30" },
  doc: { label: "doc", cls: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30" },
  decision: { label: "decision", cls: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30" },
};

/** A small colored dot for a reviewer's pass/fail/pending state. */
export function reviewDotClass(state: ReviewState | undefined): string {
  switch (state) {
    case "pass":
      return "bg-emerald-400";
    case "fail":
      return "bg-rose-400";
    default:
      return "bg-zinc-600";
  }
}
