import Link from "next/link";
import type { Task } from "@task-board/board";
import { STATUS_UI } from "@/lib/ui";
import {
  EpicChip,
  GatePill,
  IdeaBadge,
  KindChip,
  ReviewerDots,
  ShipReadyBadge,
} from "./Badges";

export function TaskCard({ task }: { task: Task }) {
  const ui = STATUS_UI[task.status];
  return (
    <Link
      href={`/task/${task.id}`}
      className={`block rounded-xl border border-border border-l-2 ${ui.bar} bg-surface p-3 transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-ink-faint">{task.id}</span>
        <KindChip kind={task.kind} />
        {task.epic ? <EpicChip epic={task.epic} /> : null}
      </div>

      <h3 className="mt-1.5 text-sm font-medium leading-snug text-ink">{task.title}</h3>

      {task.isIdeaAwaitingGoNoGo || task.isShipReady ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.isIdeaAwaitingGoNoGo ? <IdeaBadge /> : null}
          {task.isShipReady ? <ShipReadyBadge /> : null}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-ink-faint">
          {task.owner ? `@${task.owner}` : task.lead ? task.lead : " "}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <GatePill gates={task.frontmatter.gates} />
          <ReviewerDots task={task} />
        </div>
      </div>
    </Link>
  );
}
