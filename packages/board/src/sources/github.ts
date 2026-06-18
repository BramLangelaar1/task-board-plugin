import { buildBoard } from "../board";
import { parseTask } from "../parse";
import { STATUSES } from "../statuses";
import type { Board, StatusId } from "../types";
import type { BoardSource } from "./types";

export interface GitHubBoardSourceOptions {
  /** `owner/name`. */
  repo: string;
  /** Branch/ref to read; defaults to the repo's default branch. */
  ref?: string;
  /** A bearer token (PAT or App installation token). Public repos work without one. */
  token?: string;
  /** Lazily resolve a token (e.g. mint a GitHub App installation token) at load time. */
  tokenProvider?: () => Promise<string | undefined>;
  /** Injectable fetch, for tests. */
  fetchImpl?: typeof fetch;
}

interface TreeEntry {
  path: string;
  type: string;
}

interface TreeResponse {
  tree: TreeEntry[];
  /** GitHub sets this when the recursive tree exceeds its limit and silently omits entries. */
  truncated?: boolean;
}

const STATUS_SET = new Set<string>(STATUSES);

/** Reads a board from a repo's `.claude/tasks/**` over the GitHub REST API (Trees + raw contents). */
export class GitHubBoardSource implements BoardSource {
  private readonly repo: string;
  private readonly fetchImpl: typeof fetch;
  private resolvedRef?: string;

  constructor(private readonly options: GitHubBoardSourceOptions) {
    this.repo = options.repo;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.resolvedRef = options.ref;
  }

  describe(): string {
    return `github:${this.repo}@${this.resolvedRef ?? this.options.ref ?? "default"}`;
  }

  async loadBoard(): Promise<Board> {
    const token =
      this.options.token ??
      (this.options.tokenProvider ? await this.options.tokenProvider() : undefined);

    const ref = this.options.ref ?? (await this.fetchDefaultBranch(token));
    this.resolvedRef = ref;

    const tree = await this.api<TreeResponse>(
      `/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      token,
    );

    // A truncated tree silently omits files — fail loudly rather than render a plausible-but-partial board.
    if (tree.truncated) {
      throw new Error(
        `GitHub tree for ${this.repo}@${ref} is truncated (repo too large); cannot list the full board.`,
      );
    }

    const taskEntries = tree.tree.filter(
      (entry) => entry.type === "blob" && this.statusForPath(entry.path) !== null,
    );

    const tasks = await Promise.all(
      taskEntries.map(async (entry) => {
        const status = this.statusForPath(entry.path)!;
        const filename = entry.path.split("/").pop()!;
        const content = await this.raw(entry.path, ref, token);
        return parseTask({ content, status, filename, filePath: entry.path });
      }),
    );

    return buildBoard(tasks);
  }

  /** Map `.claude/tasks/<status>/<file>.md` to its status, or null if the path isn't a task file. */
  private statusForPath(path: string): StatusId | null {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const [root, tasks, status, file] = parts as [string, string, string, string];
    if (root !== ".claude" || tasks !== "tasks") return null;
    if (!STATUS_SET.has(status)) return null;
    if (!file.endsWith(".md") || file === "README.md") return null;
    return status as StatusId;
  }

  private async fetchDefaultBranch(token: string | undefined): Promise<string> {
    const repo = await this.api<{ default_branch: string }>("", token);
    return repo.default_branch;
  }

  private headers(token: string | undefined, accept: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "task-board-plugin",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  private async api<T>(path: string, token: string | undefined): Promise<T> {
    const url = `https://api.github.com/repos/${this.repo}${path}`;
    const res = await this.fetchImpl(url, {
      headers: this.headers(token, "application/vnd.github+json"),
    });
    if (!res.ok) {
      throw new Error(`GET ${url} -> ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  private async raw(path: string, ref: string, token: string | undefined): Promise<string> {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const url = `https://api.github.com/repos/${this.repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
    const res = await this.fetchImpl(url, {
      headers: this.headers(token, "application/vnd.github.raw+json"),
    });
    if (!res.ok) {
      throw new Error(`GET ${url} -> ${res.status}: ${await res.text()}`);
    }
    return res.text();
  }
}
