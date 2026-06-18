/**
 * Board domain types. The only contract with a consumer project is the on-disk schema documented in
 * KICKOFF.md: `.claude/tasks/<status>/NNNN-slug.md` where the FOLDER is the authoritative status and the
 * file's `status:` frontmatter is a mirror.
 */

/** Status folders, in pipeline order, plus the terminal `decisions` bucket. */
export type StatusId =
  | "backlog"
  | "in-progress"
  | "in-review"
  | "done"
  | "shipped"
  | "decisions";

export type TaskKind = "idea" | "feature" | "fix" | "doc" | "decision";

export type ReviewState = "pending" | "pass" | "fail";

export type IdeaStatus = "awaiting-go-no-go" | "approved" | "rejected";

export type GateState = "green" | "failing";

export type ProposedBy = "user" | "lead";

/** Raw frontmatter as it appears in a task file. All fields optional except identity essentials. */
export interface TaskFrontmatter {
  id: string;
  title: string;
  kind: TaskKind;
  status?: string;
  epic?: string;
  spec?: string;
  plan?: string;
  branch?: string;
  parent?: string;
  proposed_by?: ProposedBy;
  idea_status?: IdeaStatus;
  created?: string;
  owner?: string;
  lead?: string;
  started?: string;
  reviewers?: {
    functional?: ReviewState;
    code_quality?: ReviewState;
  };
  gates?: GateState;
  merge_commit?: string;
  merged?: string;
  deploy_sha?: string;
  shipped?: string;
  verified?: string;
  release?: string;
  terminal?: string;
  /** Any extra keys a consumer added that we don't model. */
  [key: string]: unknown;
}

/** Body sections parsed out of the markdown after the frontmatter. */
export interface TaskSections {
  goal?: string;
  acceptance?: string;
  context?: string;
  notes?: string;
}

/** A fully parsed task. `status` here is derived from the FOLDER, not the frontmatter mirror. */
export interface Task {
  /** Zero-padded id — identity; survives moves between folders. */
  id: string;
  /** Slug portion of the filename (after `NNNN-`). */
  slug: string;
  /** Authoritative status, derived from the containing folder. */
  status: StatusId;
  title: string;
  kind: TaskKind;
  epic?: string;
  owner?: string;
  lead?: string;
  frontmatter: TaskFrontmatter;
  sections: TaskSections;
  /** Markdown body after the frontmatter. */
  body: string;
  /** Path of the file relative to the repo root (e.g. `.claude/tasks/done/0005-x.md`). */
  filePath: string;
  /** kind:idea + idea_status:awaiting-go-no-go — drives the idea-proposed notification + badge. */
  isIdeaAwaitingGoNoGo: boolean;
  /** Landed in done/ — drives the ship-ready notification + badge. */
  isShipReady: boolean;
}

export interface Column {
  status: StatusId;
  label: string;
  tasks: Task[];
}

export interface Board {
  /** Columns in pipeline order. */
  columns: Column[];
  /** Flat list of every task. */
  tasks: Task[];
}
