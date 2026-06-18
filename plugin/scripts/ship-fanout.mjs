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

/**
 * Set a `key:` line within the FRONTMATTER block only — replace it if present, else insert before the
 * closing fence. Scoped to the frontmatter so a body line like `release: …` is never clobbered.
 */
function setField(content, key, value) {
  const m = /^(---\r?\n)([\s\S]*?)(\r?\n---)/.exec(content);
  if (!m) return content;
  const re = new RegExp(`^${key}:.*$`, "m");
  const inner = re.test(m[2]) ? m[2].replace(re, `${key}: ${value}`) : `${m[2]}\n${key}: ${value}`;
  return content.slice(0, m.index) + m[1] + inner + content.slice(m.index + m[1].length + m[2].length);
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
      updated = setField(updated, "release", "RELEASES.md");
      await fs.mkdir(shippedDir, { recursive: true });
      const destPath = path.join(shippedDir, filename);
      await fs.writeFile(destPath, updated);
      try {
        await fs.rm(srcPath);
      } catch (err) {
        // Keep the board invariant (a task lives in exactly one folder): undo the shipped copy.
        await fs.rm(destPath, { force: true });
        throw err;
      }
    }
    moved.push(fm.id);
    movedEntries.push({ id: fm.id, title: fm.title });
  }

  let releaseLine = null;
  if (moved.length > 0) {
    // Machine-parseable line matching templates/RELEASES.md — the done→shipped step reads the previous
    // deploy_sha from here as its lower bound, so the FULL sha is recorded.
    const tasks = movedEntries.map((e) => e.id).join(",");
    releaseLine = `${date} | deploy_sha=${deploySha} | verified=${verified} | tasks=${tasks}`;
    if (!dryRun) {
      const relPath = path.join(tasksDir, "RELEASES.md");
      const header =
        "# Releases\n\nAppend-only log of deploys. One line per deploy; the `done→shipped` step reads the\n" +
        "previous `deploy_sha` here as its lower bound (see `../rules/task-workflow.md`).\n\n" +
        "Format: `<date> | deploy_sha=<sha> | verified=<ok|awaiting-operator|failed> | tasks=<id,id,…>`\n";
      let base = (await readMaybe(relPath)) ?? header;
      // Drop the scaffolded "(no deploys yet)" placeholder on the first real deploy.
      base = base.replace(/\n*\(no deploys yet\)\n*/g, "\n");
      if (!base.endsWith("\n")) base += "\n";
      await fs.writeFile(relPath, `${base}${releaseLine}\n`);
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
