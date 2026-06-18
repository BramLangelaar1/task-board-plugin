import matter from "gray-matter";
import type {
  StatusId,
  Task,
  TaskFrontmatter,
  TaskKind,
  TaskSections,
} from "./types";

/** `NNNN-slug.md` → { id, slug }. The numeric prefix is identity. */
export function parseFilename(filename: string): { id: string; slug: string } | null {
  const base = filename.replace(/\.md$/i, "");
  const match = /^(\d{1,})-(.+)$/.exec(base);
  if (!match) return null;
  return { id: match[1]!, slug: match[2]! };
}

const KNOWN_SECTIONS: Record<string, keyof TaskSections> = {
  goal: "goal",
  acceptance: "acceptance",
  "context / links": "context",
  context: "context",
  "context/links": "context",
  notes: "notes",
};

/** Split markdown body into known `##` sections (Goal / Acceptance / Context / Notes). */
export function parseSections(body: string): TaskSections {
  const sections: TaskSections = {};
  const lines = body.split(/\r?\n/);
  let current: keyof TaskSections | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current) {
      const text = buffer.join("\n").trim();
      if (text) sections[current] = text;
    }
    buffer = [];
  };

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      const key = heading[1]!.trim().toLowerCase();
      current = KNOWN_SECTIONS[key] ?? null;
      continue;
    }
    if (current) buffer.push(line);
  }
  flush();
  return sections;
}

const VALID_KINDS: ReadonlySet<string> = new Set([
  "idea",
  "feature",
  "fix",
  "doc",
  "decision",
]);

function coerceKind(value: unknown): TaskKind {
  return typeof value === "string" && VALID_KINDS.has(value) ? (value as TaskKind) : "feature";
}

export interface ParseTaskInput {
  /** Raw file contents. */
  content: string;
  /** Authoritative status from the containing folder. */
  status: StatusId;
  /** Filename, e.g. `0005-audit-log.md`. */
  filename: string;
  /** Path relative to repo root, for links. */
  filePath: string;
}

/**
 * Parse one task file into a {@link Task}. Identity (`id`) and `status` come from the path, never from
 * the frontmatter mirror. Frontmatter `title`/`kind`/etc. fill in the rest, with safe fallbacks so a
 * slightly malformed file still renders.
 */
export function parseTask(input: ParseTaskInput): Task {
  const { content, status, filename, filePath } = input;

  // A single hand-edited file with malformed YAML must NOT take down the whole board (one bad file
  // would otherwise reject loadBoard()). Degrade to a placeholder built from the filename + raw body.
  let rawData: Record<string, unknown> = {};
  let bodyContent = content;
  try {
    const parsed = matter(content);
    rawData = (parsed.data ?? {}) as Record<string, unknown>;
    bodyContent = parsed.content;
  } catch {
    // leave rawData empty / bodyContent = full content; the fallbacks below still render a card.
  }

  // YAML parses `created: 2026-06-15` into a Date; we treat dates as plain strings throughout
  // (they're only ever displayed), so normalise to `YYYY-MM-DD` here.
  for (const key of Object.keys(rawData)) {
    const value = rawData[key];
    if (value instanceof Date) rawData[key] = value.toISOString().slice(0, 10);
  }
  const fm = rawData as Partial<TaskFrontmatter> & Record<string, unknown>;

  // The filename is the authoritative identity: it preserves the zero-padded id, whereas YAML mangles
  // `id: 0005` (→ 5 decimal, or → octal for `0042`). Prefer the filename stem; never trust frontmatter id.
  const fromName = parseFilename(filename);
  const id = fromName?.id ?? filename.replace(/\.md$/i, "");
  const slug = fromName?.slug ?? id;

  const frontmatter: TaskFrontmatter = {
    ...fm,
    id,
    title: typeof fm.title === "string" ? fm.title : slug,
    kind: coerceKind(fm.kind),
  };

  const kind = frontmatter.kind;
  const title = frontmatter.title;
  const sections = parseSections(bodyContent);

  const isIdeaAwaitingGoNoGo =
    kind === "idea" && frontmatter.idea_status === "awaiting-go-no-go";
  const isShipReady = status === "done";

  return {
    id,
    slug,
    status,
    title,
    kind,
    epic: typeof fm.epic === "string" ? fm.epic : undefined,
    owner: typeof fm.owner === "string" ? fm.owner : undefined,
    lead: typeof fm.lead === "string" ? fm.lead : undefined,
    frontmatter,
    sections,
    body: bodyContent.trim(),
    filePath,
    isIdeaAwaitingGoNoGo,
    isShipReady,
  };
}
