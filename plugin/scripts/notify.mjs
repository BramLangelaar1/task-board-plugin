#!/usr/bin/env node
/**
 * task-board Telegram notifier — reuses the official telegram plugin's bot.
 *
 * Sends one of two board-lifecycle notifications by calling the Telegram Bot API directly, using the
 * SAME bot token + paired chat that `telegram@claude-plugins-official` already manages (no second bot):
 *   - token: $TELEGRAM_BOT_TOKEN, else `~/.claude/channels/telegram/.env` (TELEGRAM_BOT_TOKEN=...)
 *   - chat:  $TELEGRAM_CHAT_ID,   else `~/.claude/channels/telegram/access.json` (allowFrom[0])
 *
 * Degrades gracefully: with --dry-run, or when token/chat is missing, it prints the composed message
 * instead of sending (the "report to the user directly" fallback) and exits 0.
 *
 * Usage: node notify.mjs <idea-proposed|ship-ready> <task-file.md> [--dry-run]
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const EVENTS = new Set(["idea-proposed", "ship-ready"]);

function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--dry-run");
  return { event: args[0], file: args[1], dryRun: argv.includes("--dry-run") };
}

/** Minimal frontmatter reader: top-level `key: value` pairs + the `## Goal` section body. */
function parseTaskFile(content, filename) {
  const fm = {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
      // Strip surrounding quotes — YAML requires them when a value contains a colon (e.g. "Fix: bug").
      if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  // Prefer the zero-padded id from the filename (YAML would parse 0005 as 5).
  const fromName = /^(\d+)-/.exec(path.basename(filename));
  const id = fromName ? fromName[1] : (fm.id ?? "?");

  let goal = "";
  const g = /(^|\n)##\s+Goal\s*\n([\s\S]*?)(\n##\s|\n*$)/.exec(content);
  if (g) goal = g[2].trim();

  return { id, title: fm.title ?? "(untitled)", merge_commit: fm.merge_commit ?? "", goal };
}

function composeMessage(event, task) {
  if (event === "idea-proposed") {
    // The id is in the reply hint so a bare answer is unambiguous when several ideas are pending.
    return `💡 Idea awaiting go/no-go — ${task.id} ${task.title}\n\n${task.goal}\n\nReply \`go ${task.id}\` or \`no-go ${task.id}\`.`;
  }
  const at = task.merge_commit ? ` at ${task.merge_commit}` : "";
  return `🚀 Ship-ready — ${task.id} ${task.title}\n\nMerged${at}. Reply \`ship ${task.id}\` to authorize a deploy.`;
}

async function readMaybe(p) {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

async function resolveToken() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN.trim();
  const env = await readMaybe(path.join(os.homedir(), ".claude", "channels", "telegram", ".env"));
  if (!env) return null;
  const m = /^TELEGRAM_BOT_TOKEN=(.*)$/m.exec(env);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

async function resolveChatId() {
  if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID.trim();
  const raw = await readMaybe(
    path.join(os.homedir(), ".claude", "channels", "telegram", "access.json"),
  );
  if (!raw) return null;
  try {
    const access = JSON.parse(raw);
    return Array.isArray(access.allowFrom) && access.allowFrom.length > 0
      ? String(access.allowFrom[0])
      : null;
  } catch {
    return null;
  }
}

async function send(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) {
    throw new Error(`Telegram API ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body.result?.message_id;
}

async function main() {
  const { event, file, dryRun } = parseArgs(process.argv.slice(2));
  if (!EVENTS.has(event) || !file) {
    console.error("usage: node notify.mjs <idea-proposed|ship-ready> <task-file.md> [--dry-run]");
    process.exit(2);
  }

  const content = await fs.readFile(file, "utf8");
  const task = parseTaskFile(content, file);
  const text = composeMessage(event, task);

  const token = await resolveToken();
  const chatId = await resolveChatId();

  if (dryRun || !token || !chatId) {
    const reason = dryRun ? "dry-run" : "telegram not configured — would have sent";
    console.log(`[${reason}]\n${text}`);
    return;
  }

  const messageId = await send(token, chatId, text);
  console.log(`sent message ${messageId} to chat ${chatId}`);
}

main().catch((err) => {
  console.error("notify failed:", err.message);
  process.exit(1);
});
