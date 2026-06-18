import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FsBoardSource } from "../src/sources/fs.js";
import { STATUSES } from "../src/statuses.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleRepoRoot = path.resolve(here, "../../../sample-board");

describe("FsBoardSource against the sample board", () => {
  const source = new FsBoardSource({ repoRoot: sampleRepoRoot });

  it("loads every status column in pipeline order", async () => {
    const board = await source.loadBoard();
    expect(board.columns.map((c) => c.status)).toEqual([...STATUSES]);
    for (const column of board.columns) {
      expect(column.tasks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("detects the awaiting-go-no-go idea (idea-proposed event)", async () => {
    const board = await source.loadBoard();
    const ideas = board.tasks.filter((t) => t.isIdeaAwaitingGoNoGo);
    expect(ideas).toHaveLength(1);
    expect(ideas[0]!.id).toBe("0001");
  });

  it("detects ship-ready tasks in done/ (ship-ready event)", async () => {
    const board = await source.loadBoard();
    const shipReady = board.tasks.filter((t) => t.isShipReady);
    expect(shipReady.map((t) => t.id)).toEqual(["0005"]);
  });

  it("parses goal sections", async () => {
    const board = await source.loadBoard();
    const audit = board.tasks.find((t) => t.id === "0005");
    expect(audit?.sections.goal).toContain("immutable log");
  });
});
