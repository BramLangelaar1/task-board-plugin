import type { StatusId } from "./types";

/** Every status folder we recognise, in board (pipeline) order. */
export const STATUSES: readonly StatusId[] = [
  "backlog",
  "in-progress",
  "in-review",
  "done",
  "shipped",
  "decisions",
] as const;

/** The deployable pipeline (idea→shipped lives inside these); `decisions` is terminal/aside. */
export const PIPELINE_STATUSES: readonly StatusId[] = [
  "backlog",
  "in-progress",
  "in-review",
  "done",
  "shipped",
] as const;

export const STATUS_LABELS: Record<StatusId, string> = {
  backlog: "Backlog",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
  shipped: "Shipped",
  decisions: "Decisions",
};

const STATUS_SET = new Set<string>(STATUSES);

export function isStatusId(value: string): value is StatusId {
  return STATUS_SET.has(value);
}
