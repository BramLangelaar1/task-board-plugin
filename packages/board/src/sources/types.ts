import type { Board } from "../types";

/** A read-only source of a board. Implemented by the filesystem and GitHub backends. */
export interface BoardSource {
  /** Load the full board (all statuses). */
  loadBoard(): Promise<Board>;
  /** Human-readable description of where this board comes from (for diagnostics/UI). */
  describe(): string;
}
