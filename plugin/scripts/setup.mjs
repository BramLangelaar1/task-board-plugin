#!/usr/bin/env node
/**
 * task-board onboarding scaffold.
 *
 * Scaffolds the filesystem task-board workflow into a consumer repo:
 *   .claude/tasks/{backlog,in-progress,in-review,done,shipped,decisions,reviewers}/ (+ .gitkeep)
 *   .claude/tasks/{README.md,RELEASES.md,TEMPLATE.md}
 *   .claude/tasks/reviewers/{functional.md,code-quality.md}
 *   .claude/rules/task-workflow.md
 *
 * Idempotent: never overwrites an existing file (reports "skipped: exists").
 *
 * Usage: node setup.mjs [target-repo-root]   (default: current working directory)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const templates = path.resolve(here, "../templates");

const target = path.resolve(process.argv[2] ?? process.cwd());
const tasksDir = path.join(target, ".claude", "tasks");
const rulesDir = path.join(target, ".claude", "rules");

const STATUS_DIRS = [
  "backlog",
  "in-progress",
  "in-review",
  "done",
  "shipped",
  "decisions",
  "reviewers",
];

/** template path → destination path */
const FILES = [
  ["task-workflow.md", path.join(rulesDir, "task-workflow.md")],
  ["tasks-README.md", path.join(tasksDir, "README.md")],
  ["RELEASES.md", path.join(tasksDir, "RELEASES.md")],
  ["TEMPLATE.md", path.join(tasksDir, "TEMPLATE.md")],
  ["reviewers/functional.md", path.join(tasksDir, "reviewers", "functional.md")],
  ["reviewers/code-quality.md", path.join(tasksDir, "reviewers", "code-quality.md")],
];

let created = 0;
let skipped = 0;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Write `content` to `dest` only if it doesn't already exist. */
async function writeIfAbsent(dest, content) {
  const rel = path.relative(target, dest);
  if (await exists(dest)) {
    console.log(`  skipped: exists   ${rel}`);
    skipped++;
    return;
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content);
  console.log(`  created           ${rel}`);
  created++;
}

async function main() {
  console.log(`task-board: scaffolding workflow into ${target}\n`);

  // Status folders, each kept in git with a .gitkeep.
  for (const dir of STATUS_DIRS) {
    await fs.mkdir(path.join(tasksDir, dir), { recursive: true });
    await writeIfAbsent(path.join(tasksDir, dir, ".gitkeep"), "");
  }

  // Workflow + board docs + reviewer prompts, copied from bundled templates.
  for (const [tpl, dest] of FILES) {
    const content = await fs.readFile(path.join(templates, tpl), "utf8");
    await writeIfAbsent(dest, content);
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
  if (created > 0) {
    console.log(`
Next steps:
  1. Commit the new .claude/ files.
  2. View the board as a Kanban: deploy the task-board web app and set BOARD_REPO=<owner>/<name>
     (optionally BOARD_REF=<branch>) so it renders this repo's board.
  3. Get Telegram alerts: install telegram@claude-plugins-official, pair your bot, then have the board
     keeper run the plugin's notify script on idea-proposed / ship-ready transitions.
  4. Create your first task from .claude/tasks/TEMPLATE.md in .claude/tasks/backlog/.`);
  }
}

main().catch((err) => {
  console.error("task-board setup failed:", err.message);
  process.exit(1);
});
