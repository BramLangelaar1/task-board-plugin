"use client";

// Graceful fallback when the board source throws (e.g. a GitHub auth/rate-limit/404 on the live source)
// instead of Next's generic 500. The detailed error is logged server-side; we show a friendly retry.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold">Couldn’t load the board</h1>
      <p className="mt-2 text-sm text-ink-dim">
        The board source didn’t respond. If this is a live GitHub board, check the repo and auth
        configuration (BOARD_REPO and a token), then retry.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:bg-surface-2"
      >
        Retry
      </button>
    </main>
  );
}
