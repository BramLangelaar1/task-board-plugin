import { BoardColumn } from "@/components/BoardColumn";
import { RefreshButton } from "@/components/RefreshButton";
import { getBoardSource } from "@/lib/source";

// Re-read the board on every request so a refresh reflects the latest committed state.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const source = getBoardSource();
  const board = await source.loadBoard();

  const ideaCount = board.tasks.filter((t) => t.isIdeaAwaitingGoNoGo).length;
  const shipReadyCount = board.tasks.filter((t) => t.isShipReady).length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[100rem] flex-col px-4 py-4 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Task Board</h1>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-faint ring-1 ring-inset ring-border">
          {board.tasks.length} tasks
        </span>
        {ideaCount > 0 ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
            {ideaCount} awaiting go/no-go
          </span>
        ) : null}
        {shipReadyCount > 0 ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
            {shipReadyCount} ship-ready
          </span>
        ) : null}
        <div className="ml-auto">
          <RefreshButton />
        </div>
      </header>

      <div className="board-scroll flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {board.columns.map((column) => (
          <BoardColumn key={column.status} column={column} />
        ))}
      </div>

      <footer className="mt-3 break-all text-[11px] text-ink-faint">{source.describe()}</footer>
    </main>
  );
}
