import path from "node:path";
import { FsBoardSource, GitHubBoardSource, type BoardSource } from "@task-board/board";
import { resolveGitHubToken } from "./auth";

/**
 * Resolve which board to render from the environment:
 * - `BOARD_REPO` set → the live GitHub-backed board (auth via {@link resolveGitHubToken}).
 * - otherwise → the bundled `sample-board/` fixture (override its location with `BOARD_FS_ROOT`),
 *   so the UI always renders with no GitHub access.
 */
export function getBoardSource(): BoardSource {
  if (process.env.BOARD_REPO) {
    return new GitHubBoardSource({
      repo: process.env.BOARD_REPO,
      ref: process.env.BOARD_REF,
      tokenProvider: resolveGitHubToken,
    });
  }

  // Default fixture path assumes the process cwd is apps/web (the standard `pnpm dev`/`build`/`start`).
  // Set BOARD_FS_ROOT to point elsewhere when running from a different working directory.
  const fsRoot =
    process.env.BOARD_FS_ROOT ?? path.resolve(process.cwd(), "../../sample-board");
  return new FsBoardSource({ repoRoot: fsRoot });
}
