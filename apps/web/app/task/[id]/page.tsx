import Link from "next/link";
import { notFound } from "next/navigation";
import type { Task } from "@task-board/board";
import {
  EpicChip,
  GatePill,
  IdeaBadge,
  KindChip,
  ReviewerDots,
  ShipReadyBadge,
} from "@/components/Badges";
import { STATUS_UI } from "@/lib/ui";
import { getBoardSource } from "@/lib/source";

export const dynamic = "force-dynamic";

async function findTask(id: string): Promise<Task | undefined> {
  const board = await getBoardSource().loadBoard();
  return board.tasks.find((t) => t.id === id);
}

/** Render an Acceptance section's markdown checklist as styled rows; fall back to plain text. */
function Acceptance({ text }: { text: string }) {
  const lines = text.split("\n");
  const items = lines.map((line) => /^\s*-\s*\[( |x|X)\]\s*(.*)$/.exec(line));
  if (!items.some(Boolean)) return <PlainSection text={text} />;
  return (
    <ul className="space-y-1.5">
      {items.map((m, i) =>
        m ? (
          <li key={i} className="flex items-start gap-2 text-sm text-ink">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                m[1] === " "
                  ? "border-border text-transparent"
                  : "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
              }`}
            >
              ✓
            </span>
            <span className="min-w-0 break-words">{m[2]}</span>
          </li>
        ) : null,
      )}
    </ul>
  );
}

function PlainSection({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">{text}</p>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await findTask(id);
  if (!task) notFound();

  const ui = STATUS_UI[task.status];
  const fm = task.frontmatter;

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
      <Link href="/" className="text-[13px] text-ink-dim hover:text-ink">
        ← Board
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-ink-faint">{task.id}</span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ui.text}`}>
          <span className={`h-2 w-2 rounded-full ${ui.dot}`} />
          {ui.label}
        </span>
        <KindChip kind={task.kind} />
        {task.epic ? <EpicChip epic={task.epic} /> : null}
      </div>

      <h1 className="mt-2 text-xl font-semibold leading-tight">{task.title}</h1>

      {task.isIdeaAwaitingGoNoGo || task.isShipReady ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.isIdeaAwaitingGoNoGo ? <IdeaBadge /> : null}
          {task.isShipReady ? <ShipReadyBadge /> : null}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-4 text-[13px] sm:grid-cols-3">
        <Meta label="Owner" value={task.owner} />
        <Meta label="Lead" value={task.lead} />
        <Meta label="Branch" value={fm.branch} />
        <Meta label="Created" value={fm.created} />
        <Meta label="Started" value={fm.started} />
        <Meta label="Merged" value={fm.merged} />
        {fm.proposed_by ? <Meta label="Proposed by" value={fm.proposed_by} /> : null}
        {fm.idea_status ? <Meta label="Idea status" value={fm.idea_status} /> : null}
        {fm.merge_commit ? <Meta label="Merge commit" value={fm.merge_commit} /> : null}
        {fm.deploy_sha ? <Meta label="Deploy sha" value={fm.deploy_sha} /> : null}
        {fm.verified ? <Meta label="Verified" value={fm.verified} /> : null}
        {fm.terminal ? <Meta label="Terminal" value={fm.terminal} /> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ReviewerDots task={task} />
        <GatePill gates={fm.gates} />
      </div>

      <div className="mt-4 space-y-3">
        {task.sections.goal ? (
          <Section title="Goal">
            <PlainSection text={task.sections.goal} />
          </Section>
        ) : null}
        {task.sections.acceptance ? (
          <Section title="Acceptance">
            <Acceptance text={task.sections.acceptance} />
          </Section>
        ) : null}
        {task.sections.context ? (
          <Section title="Context / Links">
            <PlainSection text={task.sections.context} />
          </Section>
        ) : null}
        {task.sections.notes ? (
          <Section title="Notes">
            <PlainSection text={task.sections.notes} />
          </Section>
        ) : null}
      </div>

      <p className="mt-4 break-all font-mono text-[11px] text-ink-faint">{task.filePath}</p>
    </main>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="truncate text-ink-dim">{value || "—"}</div>
    </div>
  );
}
