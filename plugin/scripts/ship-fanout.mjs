#!/usr/bin/env node
/**
 * task-board done→shipped fan-out.
 *
 * Given a deploy sha, moves the DEPLOYABLE `done/` tasks carried by that deploy into `shipped/`, stamps
 * the shipping fields, and appends one line to RELEASES.md. Non-deployable carried tasks
 * (`kind: doc` or `deployable: false`) stay terminal in `done/` — they are never shipped.
 *
 * Usage: node ship-fanout.mjs <deploy_sha> [--dry-run] [--verified <state>]
 * Run in the consumer repo root, AFTER a deploy + a passing post-deploy verification.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Minimal frontmatter reader: top-level scalar keys + filename-derived id. */
export function parseFrontmatter(content, filename) {
  const fm = {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
      if (kv) fm[kv[1]] = kv[2].trim();
    }
  }
  // The filename stem is the authoritative zero-padded id (YAML mangles `0005` → 5).
  const fromName = /^(\d+)-/.exec(path.basename(filename));
  const id = fromName ? fromName[1] : fm.id ?? "?";
  return {
    id,
    title: fm.title || "(untitled)",
    kind: fm.kind || "feature",
    deployable: fm.deployable, // raw string ("false"/"true") or undefined
    merge_commit: fm.merge_commit || undefined,
  };
}

/** Deployable unless explicitly opted out (`deployable: false`); docs never ship. */
export function isDeployable(fm) {
  return String(fm.deployable).trim() !== "false" && fm.kind !== "doc";
}

/** Set an existing `key:` line in the frontmatter, or insert one before the closing fence. */
function setField(content, key, value) {
  const re = new RegExp(`^${key}:.*$`, "m");
  if (re.test(content)) return content.replace(re, `${key}: ${value}`);
  return content.replace(/\n---/, `\n${key}: ${value}\n---`);
}

async function readMaybe(p) {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

/**
 * @param {object} o
 * @param {string} o.repoRoot       repo containing `.claude/tasks`
 * @param {string} o.deploySha      the deployed commit
 * @param {string} o.date           YYYY-MM-DD stamp
 * @param {string} [o.verified]     verified state (default "ok")
 * @param {(mergeCommit:string, deploySha:string)=>boolean|Promise<boolean>} o.isAncestor
 * @param {boolean} [o.dryRun]
 * @param {(msg:string)=>void} [o.log]
 */
export async function runFanout({
  repoRoot,
  deploySha,
  date,
  verified = "ok",
  isAncestor,
  dryRun = false,
  log = () => {},
}) {
  const tasksDir = path.join(repoRoot, ".claude", "tasks");
  const doneDir = path.join(tasksDir, "done");
  const shippedDir = path.join(tasksDir, "shipped");
  const shortSha = deploySha.slice(0, 7);

  const carried = [];
  const skipped = [];
  const moved = [];
  const movedEntries = [];

  let entries = [];
  try {
    entries = await fs.readdir(doneDir);
  } catch {
    entries = [];
  }

  for (const filename of entries.sort()) {
    if (!filename.endsWith(".md") || filename === "README.md") continue;
    const srcPath = path.join(doneDir, filename);
    const content = await fs.readFile(srcPath, "utf8");
    const fm = parseFrontmatter(content, filename);
    if (!fm.merge_commit) continue; // not merged → not carried by any deploy
    if (!(await isAncestor(fm.merge_commit, deploySha))) continue;
    carried.push(fm.id);

    if (!isDeployable(fm)) {
      skipped.push({ id: fm.id, reason: fm.kind === "doc" ? "kind:doc" : "deployable:false" });
      continue;
    }

    if (!dryRun) {
      let updated = content;
      updated = setField(updated, "status", "shipped");
      updated = setField(updated, "deploy_sha", deploySha);
      updated = setField(updated, "shipped", date);
      updated = setField(updated, "verified", verified);
      updated = setField(updated, "release", `RELEASES.md#${shortSha}`);
      await fs.mkdir(shippedDir, { recursive: true });
      await fs.writeFile(path.join(shippedDir, filename), updated);
      await fs.rm(srcPath);
    }
    moved.push(fm.id);
    movedEntries.push({ id: fm.id, title: fm.title });
  }

  let releaseLine = null;
  if (moved.length > 0) {
    const list = movedEntries.map((e) => `${e.id} ${e.title}`).join(", ");
    releaseLine = `- ${date} — deploy ${shortSha} — ${list} — verified ${verified}`;
    if (!dryRun) {
      const relPath = path.join(tasksDir, "RELEASES.md");
      const existing = await readMaybe(relPath);
      const base = existing ?? "# Releases\n\nAppend-only deploy log. One line per deploy window.\n";
      await fs.writeFile(relPath, `${base}${base.endsWith("\n") ? "" : "\n"}${releaseLine}\n`);
    }
  }

  log(
    `${dryRun ? "[dry-run] " : ""}carried=${carried.length} skipped(non-deployable)=${skipped.length} moved=${moved.length}`,
  );
  for (const s of skipped) log(`  skipped ${s.id} (${s.reason}) — stays terminal in done/`);
  for (const e of movedEntries) log(`  ${dryRun ? "would ship" : "shipped"} ${e.id} ${e.title}`);
  if (releaseLine) log(`  RELEASES.md ${dryRun ? "would append" : "appended"}: ${releaseLine}`);

  return { carried, skipped, moved, releaseLine };
}

// ---- CLI ----
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const argv = process.argv.slice(2);
  const positionals = [];
  let verified = "ok";
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--verified") verified = argv[++i] ?? verified;
    else if (!a.startsWith("--")) positionals.push(a);
  }
  const deploySha = positionals[0];
  if (!deploySha) {
    console.error("usage: node ship-fanout.mjs <deploy_sha> [--dry-run] [--verified <state>]");
    process.exit(2);
  }
  const repoRoot = process.cwd();
  const isAncestor = (mergeCommit, sha) =>
    spawnSync("git", ["merge-base", "--is-ancestor", mergeCommit, sha], { cwd: repoRoot })
      .status === 0;
  const date = new Date().toISOString().slice(0, 10);
  runFanout({ repoRoot, deploySha, date, verified, isAncestor, dryRun, log: console.log }).catch(
    (err) => {
      console.error("ship-fanout failed:", err.message);
      process.exit(1);
    },
  );
}
