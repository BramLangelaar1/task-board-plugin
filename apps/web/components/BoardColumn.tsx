import type { Column } from "@task-board/board";
import { STATUS_UI } from "@/lib/ui";
import { TaskCard } from "./TaskCard";

export function BoardColumn({ column }: { column: Column }) {
  const ui = STATUS_UI[column.status];
  return (
    <section className="flex w-[85vw] max-w-[20rem] shrink-0 snap-start flex-col sm:w-80">
      <header className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-canvas/90 py-1 backdrop-blur">
        <span className={`h-2 w-2 rounded-full ${ui.dot}`} />
        <h2 className={`text-sm font-semibold ${ui.text}`}>{ui.label}</h2>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-faint ring-1 ring-inset ring-border">
          {column.tasks.length}
        </span>
      </header>

      <div className="flex flex-col gap-2.5 pb-6">
        {column.tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-[12px] text-ink-faint">
            empty
          </p>
        ) : (
          column.tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}
