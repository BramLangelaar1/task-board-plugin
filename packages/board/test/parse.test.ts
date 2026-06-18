import { describe, expect, it } from "vitest";
import { parseFilename, parseSections, parseTask } from "../src/parse.js";

describe("parseFilename", () => {
  it("splits NNNN-slug.md into id + slug", () => {
    expect(parseFilename("0005-audit-log.md")).toEqual({ id: "0005", slug: "audit-log" });
  });
  it("returns null for non-conforming names", () => {
    expect(parseFilename("README.md")).toBeNull();
  });
});

describe("parseSections", () => {
  it("extracts known sections and ignores unknown headers", () => {
    const body = [
      "## Goal",
      "Do the thing.",
      "",
      "## Acceptance",
      "- [ ] it works",
      "",
      "## Random",
      "ignored",
      "",
      "## Notes",
      "a note",
    ].join("\n");
    const s = parseSections(body);
    expect(s.goal).toBe("Do the thing.");
    expect(s.acceptance).toBe("- [ ] it works");
    expect(s.notes).toBe("a note");
    expect(s.context).toBeUndefined();
  });

  it("maps 'Context / Links' to context", () => {
    expect(parseSections("## Context / Links\nspec here").context).toBe("spec here");
  });
});

describe("parseTask", () => {
  const content = [
    "---",
    "id: 0005",
    "title: Add an admin audit log",
    "kind: feature",
    "status: done",
    "idea_status:",
    "---",
    "## Goal",
    "Audit log.",
  ].join("\n");

  it("derives status from the folder, not the frontmatter mirror", () => {
    const task = parseTask({
      content: content.replace("status: done", "status: backlog"),
      status: "done",
      filename: "0005-audit-log.md",
      filePath: ".claude/tasks/done/0005-audit-log.md",
    });
    expect(task.status).toBe("done");
    expect(task.id).toBe("0005");
    expect(task.slug).toBe("audit-log");
    expect(task.isShipReady).toBe(true);
  });

  it("flags an awaiting-go-no-go idea", () => {
    const idea = [
      "---",
      "id: 0001",
      "title: Dark mode",
      "kind: idea",
      "idea_status: awaiting-go-no-go",
      "---",
      "## Goal",
      "Toggle themes.",
    ].join("\n");
    const task = parseTask({
      content: idea,
      status: "backlog",
      filename: "0001-dark-mode.md",
      filePath: ".claude/tasks/backlog/0001-dark-mode.md",
    });
    expect(task.isIdeaAwaitingGoNoGo).toBe(true);
    expect(task.isShipReady).toBe(false);
  });

  it("normalizes YAML-parsed dates to YYYY-MM-DD strings", () => {
    const task = parseTask({
      content: "---\nid: 5\ntitle: X\nkind: feature\ncreated: 2026-06-15\nmerged: 2026-06-14\n---\n",
      status: "done",
      filename: "0005-x.md",
      filePath: ".claude/tasks/done/0005-x.md",
    });
    expect(task.frontmatter.created).toBe("2026-06-15");
    expect(task.frontmatter.merged).toBe("2026-06-14");
    expect(typeof task.frontmatter.created).toBe("string");
  });

  it("renders a placeholder instead of throwing on malformed YAML frontmatter", () => {
    // Unterminated double-quoted string — js-yaml throws on this.
    const content = '---\nid: 0007\ntitle: "oops\nkind: feature\n---\n## Goal\nstill here\n';
    const task = parseTask({
      content,
      status: "backlog",
      filename: "0007-broken.md",
      filePath: ".claude/tasks/backlog/0007-broken.md",
    });
    expect(task.id).toBe("0007");
    expect(task.slug).toBe("broken");
    expect(task.kind).toBe("feature"); // fallback
    expect(task.title).toBe("broken"); // falls back to slug when frontmatter is unreadable
  });

  it("derives id from a non-conforming filename rather than octal-mangled frontmatter", () => {
    // YAML parses `id: 0042` as octal 34; the filename stem must win.
    const task = parseTask({
      content: "---\nid: 0042\ntitle: X\nkind: feature\n---\n",
      status: "backlog",
      filename: "0042.md", // no hyphen → parseFilename returns null
      filePath: ".claude/tasks/backlog/0042.md",
    });
    expect(task.id).toBe("0042");
  });

  it("falls back gracefully on a malformed kind", () => {
    const task = parseTask({
      content: "---\nid: 9\ntitle: X\nkind: bogus\n---\n",
      status: "backlog",
      filename: "0009-x.md",
      filePath: ".claude/tasks/backlog/0009-x.md",
    });
    expect(task.kind).toBe("feature");
  });
});
