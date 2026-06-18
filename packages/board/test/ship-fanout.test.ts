import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
// The fan-out is a standalone plugin script (node built-ins only); import its pure functions directly.
import { isDeployable, runFanout } from "../../../plugin/scripts/ship-fanout.mjs";

function taskFile({ id, slug, kind, deployable, merge_commit }: {
  id: string;
  slug: string;
  kind: string;
  deployable?: string;
  merge_commit: string;
}): string {
  const lines = ["---", `id: ${id}`, `title: ${slug} title`, `kind: ${kind}`];
  if (deployable !== undefined) lines.push(`deployable: ${deployable}`);
  lines.push("status: done", `merge_commit: ${merge_commit}`, "---", "## Goal", "x", "");
  return lines.join("\n");
}

describe("isDeployable", () => {
  it("docs and deployable:false are not deployable; plain features/fixes are", () => {
    expect(isDeployable({ kind: "doc" })).toBe(false);
    expect(isDeployable({ kind: "feature", deployable: "false" })).toBe(false);
    expect(isDeployable({ kind: "feature" })).toBe(true);
    expect(isDeployable({ kind: "fix", deployable: "true" })).toBe(true);
  });
});

describe("runFanout over a mixed deployable/non-deployable window", () => {
  let root: string | undefined;
  afterAll(async () => {
    if (root) await fs.rm(root, { recursive: true, force: true });
  });

  it("ships only deployable carried tasks; skips doc + deployable:false; leaves uncarried", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "tbp-fanout-"));
    const doneDir = path.join(root, ".claude", "tasks", "done");
    await fs.mkdir(doneDir, { recursive: true });
    await fs.writeFile(path.join(doneDir, "0010-feature-a.md"), taskFile({ id: "0010", slug: "feature-a", kind: "feature", merge_commit: "aaaaaaa" }));
    await fs.writeFile(path.join(doneDir, "0011-doc-b.md"), taskFile({ id: "0011", slug: "doc-b", kind: "doc", merge_commit: "bbbbbbb" }));
    await fs.writeFile(path.join(doneDir, "0012-feature-c.md"), taskFile({ id: "0012", slug: "feature-c", kind: "feature", deployable: "false", merge_commit: "ccccccc" }));
    await fs.writeFile(path.join(doneDir, "0013-feature-d.md"), taskFile({ id: "0013", slug: "feature-d", kind: "feature", merge_commit: "ddddddd" }));

    // Only a/b/c are carried by the deploy; d is not.
    const ancestors = new Set(["aaaaaaa", "bbbbbbb", "ccccccc"]);
    const isAncestor = (mergeCommit: string) => ancestors.has(mergeCommit);

    const res = await runFanout({
      repoRoot: root,
      deploySha: "deadbeefcafe",
      date: "2026-06-18",
      isAncestor,
      log() {},
    });

    expect([...res.carried].sort()).toEqual(["0010", "0011", "0012"]);
    expect(res.moved).toEqual(["0010"]);
    expect(res.skipped).toEqual([
      { id: "0011", reason: "kind:doc" },
      { id: "0012", reason: "deployable:false" },
    ]);

    const shipped = await fs.readFile(
      path.join(root, ".claude", "tasks", "shipped", "0010-feature-a.md"),
      "utf8",
    );
    expect(shipped).toMatch(/^status: shipped$/m);
    expect(shipped).toMatch(/^deploy_sha: deadbeefcafe$/m);
    expect(shipped).toMatch(/^shipped: 2026-06-18$/m);
    expect(shipped).toMatch(/^verified: ok$/m);
    expect(shipped).toMatch(/^release: RELEASES\.md$/m);

    // 0010 left done/; the others stay terminal there.
    await expect(fs.access(path.join(doneDir, "0010-feature-a.md"))).rejects.toBeDefined();
    for (const f of ["0011-doc-b.md", "0012-feature-c.md", "0013-feature-d.md"]) {
      await fs.access(path.join(doneDir, f)); // throws if missing → fails the test
    }

    const releases = await fs.readFile(path.join(root, ".claude", "tasks", "RELEASES.md"), "utf8");
    // Real entry lines are date-prefixed (the `Format:` doc line also contains `deploy_sha=`).
    const entries = releases.split("\n").filter((l) => /^\d{4}-\d{2}-\d{2} \| deploy_sha=/.test(l));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("deploy_sha=deadbeefcafe");
    expect(entries[0]).toContain("tasks=0010");
    expect(entries[0]).not.toContain("0011");
  });

  it("replaces existing frontmatter placeholders (no duplicates) and never clobbers body lines", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tbp-fanout-tpl-"));
    const doneDir = path.join(dir, ".claude", "tasks", "done");
    await fs.mkdir(doneDir, { recursive: true });
    const file = [
      "---",
      "id: 0030",
      "title: templated",
      "kind: feature",
      "status: done",
      "merge_commit: fffffff",
      "deploy_sha:", // empty placeholder → must be REPLACED, not duplicated
      "shipped:",
      "verified:",
      "---", // no `release:` in frontmatter → must be INSERTED into the frontmatter
      "## Notes",
      "release: SHOULD-SURVIVE", // body line at col 0 → must NOT be clobbered
      "",
    ].join("\n");
    await fs.writeFile(path.join(doneDir, "0030-templated.md"), file);

    await runFanout({
      repoRoot: dir,
      deploySha: "abcdef123456",
      date: "2026-06-18",
      isAncestor: () => true,
      log() {},
    });

    const out = await fs.readFile(
      path.join(dir, ".claude", "tasks", "shipped", "0030-templated.md"),
      "utf8",
    );
    expect(out.match(/^deploy_sha: abcdef123456$/gm)).toHaveLength(1); // replaced once, not duplicated
    expect(out).toMatch(/^status: shipped$/m);
    expect(out).toMatch(/^verified: ok$/m);
    expect(out).toMatch(/^release: RELEASES\.md$/m); // inserted into frontmatter
    expect(out).toContain("release: SHOULD-SURVIVE"); // body line untouched (setField scoped to frontmatter)
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("--dry-run reports the plan but moves nothing", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tbp-fanout-dry-"));
    const doneDir = path.join(dir, ".claude", "tasks", "done");
    await fs.mkdir(doneDir, { recursive: true });
    await fs.writeFile(path.join(doneDir, "0020-x.md"), taskFile({ id: "0020", slug: "x", kind: "feature", merge_commit: "eeeeeee" }));
    const res = await runFanout({
      repoRoot: dir,
      deploySha: "feedface",
      date: "2026-06-18",
      isAncestor: () => true,
      dryRun: true,
      log() {},
    });
    expect(res.moved).toEqual(["0020"]);
    await fs.access(path.join(doneDir, "0020-x.md")); // still in done/
    await expect(
      fs.access(path.join(dir, ".claude", "tasks", "shipped", "0020-x.md")),
    ).rejects.toBeDefined();
    await expect(
      fs.access(path.join(dir, ".claude", "tasks", "RELEASES.md")),
    ).rejects.toBeDefined();
    await fs.rm(dir, { recursive: true, force: true });
  });
});
