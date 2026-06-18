import type { Task } from "@task-board/board";
import { KIND_UI, reviewDotClass } from "@/lib/ui";

export function KindChip({ kind }: { kind: Task["kind"] }) {
  const ui = KIND_UI[kind];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ui.cls}`}
    >
      {ui.label}
    </span>
  );
}

export function EpicChip({ epic }: { epic: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-dim ring-1 ring-inset ring-border">
      #{epic}
    </span>
  );
}

/** Amber, pulsing — surfaces the idea-proposed notification event on the card. */
export function IdeaBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/40">
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amber-400" />
      awaiting go/no-go
    </span>
  );
}

/** Emerald — surfaces the ship-ready notification event on the card. */
export function ShipReadyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
      🚀 ship-ready
    </span>
  );
}

/** Two dots: functional + code-quality reviewer states. */
export function ReviewerDots({ task }: { task: Task }) {
  const r = task.frontmatter.reviewers ?? {};
  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-ink-faint" title="reviewers: functional · code-quality">
      <span className="inline-flex items-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full ${reviewDotClass(r.functional)}`} />
        fn
      </span>
      <span className="inline-flex items-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full ${reviewDotClass(r.code_quality)}`} />
        cq
      </span>
    </span>
  );
}

export function GatePill({ gates }: { gates?: "green" | "failing" }) {
  if (!gates) return null;
  const ok = gates === "green";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
        ok ? "text-emerald-300" : "text-rose-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-rose-400"}`} />
      gates {gates}
    </span>
  );
}
