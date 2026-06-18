import { promises as fs } from "node:fs";
import path from "node:path";
import { buildBoard } from "../board";
import { parseTask } from "../parse";
import { STATUSES } from "../statuses";
import type { Board, Task } from "../types";
import type { BoardSource } from "./types";

export interface FsBoardSourceOptions {
  /** Repo root that contains a `.claude/tasks` directory. */
  repoRoot: string;
}

/** Reads a board from the local filesystem — used for the sample fixture and the onboarding scaffold. */
export class FsBoardSource implements BoardSource {
  constructor(private readonly options: FsBoardSourceOptions) {}

  describe(): string {
    return `filesystem:${this.options.repoRoot}`;
  }

  async loadBoard(): Promise<Board> {
    const tasksDir = path.join(this.options.repoRoot, ".claude", "tasks");
    const tasks: Task[] = [];

    for (const status of STATUSES) {
      const dir = path.join(tasksDir, status);
      let entries: string[];
      try {
        entries = await fs.readdir(dir);
      } catch {
        continue; // status folder may not exist on a fresh board
      }

      for (const filename of entries) {
        if (!filename.endsWith(".md") || filename === "README.md") continue;
        const absPath = path.join(dir, filename);
        const content = await fs.readFile(absPath, "utf8");
        const relPath = path.posix.join(".claude", "tasks", status, filename);
        tasks.push(parseTask({ content, status, filename, filePath: relPath }));
      }
    }

    return buildBoard(tasks);
  }
}
