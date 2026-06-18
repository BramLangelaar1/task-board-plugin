import { describe, expect, it } from "vitest";
import { GitHubBoardSource } from "../src/sources/github.js";
import { STATUSES } from "../src/statuses.js";

const repo = "acme/widgets";

const backlogTask = [
  "---",
  "id: 0001",
  "title: First idea",
  "kind: idea",
  "idea_status: awaiting-go-no-go",
  "---",
  "## Goal",
  "Do a thing.",
].join("\n");

const doneTask = [
  "---",
  "id: 0002",
  "title: Shipped thing",
  "kind: feature",
  "---",
  "## Goal",
  "Done.",
].join("\n");

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const treeBody = {
  tree: [
    { path: ".claude/tasks/backlog/0001-first.md", type: "blob" },
    { path: ".claude/tasks/done/0002-shipped.md", type: "blob" },
    { path: ".claude/tasks/backlog/README.md", type: "blob" }, // ignored
    { path: "README.md", type: "blob" }, // ignored
    { path: ".claude/tasks/backlog", type: "tree" }, // ignored
  ],
};

const fakeFetch = (async (input: Parameters<typeof fetch>[0]) => {
  const url = typeof input === "string" ? input : input.toString();
  if (url === `https://api.github.com/repos/${repo}`) return json({ default_branch: "main" });
  if (url.includes("/git/trees/")) return json(treeBody);
  if (url.includes("/contents/.claude/tasks/backlog/0001-first.md")) {
    return new Response(backlogTask, { status: 200 });
  }
  if (url.includes("/contents/.claude/tasks/done/0002-shipped.md")) {
    return new Response(doneTask, { status: 200 });
  }
  throw new Error(`unexpected url ${url}`);
}) as typeof fetch;

describe("GitHubBoardSource", () => {
  it("loads a board over the GitHub API, resolving the default branch", async () => {
    const source = new GitHubBoardSource({ repo, fetchImpl: fakeFetch });
    const board = await source.loadBoard();

    expect(board.columns.map((c) => c.status)).toEqual([...STATUSES]);
    expect(board.tasks.map((t) => t.id).sort()).toEqual(["0001", "0002"]);

    const idea = board.tasks.find((t) => t.id === "0001");
    expect(idea?.status).toBe("backlog");
    expect(idea?.isIdeaAwaitingGoNoGo).toBe(true);

    const done = board.tasks.find((t) => t.id === "0002");
    expect(done?.status).toBe("done");
    expect(done?.isShipReady).toBe(true);

    expect(source.describe()).toBe(`github:${repo}@main`);
  });

  it("uses an explicit ref without querying the default branch", async () => {
    let queriedRepoRoot = false;
    const f = (async (input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === `https://api.github.com/repos/${repo}`) queriedRepoRoot = true;
      return fakeFetch(input);
    }) as typeof fetch;

    const source = new GitHubBoardSource({ repo, ref: "feature-x", fetchImpl: f });
    await source.loadBoard();

    expect(queriedRepoRoot).toBe(false);
    expect(source.describe()).toBe(`github:${repo}@feature-x`);
  });

  it("throws an informative error on a non-ok response", async () => {
    const f = (async () => new Response("nope", { status: 404 })) as typeof fetch;
    const source = new GitHubBoardSource({ repo, ref: "main", fetchImpl: f });
    await expect(source.loadBoard()).rejects.toThrow(/404/);
  });
});
