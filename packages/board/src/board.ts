import { STATUSES, STATUS_LABELS } from "./statuses";
import type { Board, Column, StatusId, Task } from "./types";

/** Group a flat task list into pipeline-ordered columns; tasks sorted by numeric id within a column. */
export function buildBoard(tasks: Task[]): Board {
  const byStatus = new Map<StatusId, Task[]>();
  for (const status of STATUSES) byStatus.set(status, []);
  for (const task of tasks) byStatus.get(task.status)?.push(task);

  const columns: Column[] = STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    tasks: (byStatus.get(status) ?? []).sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true }),
    ),
  }));

  return { columns, tasks: columns.flatMap((column) => column.tasks) };
}
