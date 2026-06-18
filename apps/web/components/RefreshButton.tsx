"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Re-reads the board from its source (the route is force-dynamic, so refresh re-fetches). */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink-dim transition-colors hover:bg-surface-2 disabled:opacity-50"
      disabled={pending}
    >
      <span className={pending ? "animate-spin" : ""}>↻</span>
      {pending ? "Refreshing" : "Refresh"}
    </button>
  );
}
