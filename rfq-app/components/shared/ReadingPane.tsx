"use client";

import type { ReadingPaneData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reply, ReplyAll, Forward, MoreHorizontal, Star, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type ReadingPaneProps = {
  data: ReadingPaneData | null;
};

export default function ReadingPane({ data }: ReadingPaneProps) {
  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-zinc-600">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
          <Reply size={28} className="text-zinc-700" />
        </div>
        <p className="text-sm font-medium">Select an item to read</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-semibold leading-snug text-foreground">
            {data.subject}
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <ToolBtn id="reading-star" icon={<Star size={16} />} />
            <ToolBtn id="reading-trash" icon={<Trash2 size={16} />} />
            <ToolBtn id="reading-more" icon={<MoreHorizontal size={16} />} />
          </div>
        </div>

        {data.tags && data.tags.length > 0 && (
          <div className="mt-1.5 flex gap-1.5">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  tag === "urgent"
                    ? "bg-red-900/60 text-red-400"
                    : tag === "quote"
                    ? "bg-green-900/60 text-green-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 text-xs font-semibold text-foreground">
            {data.from[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{data.from}</span>
              <span className="text-xs text-muted-foreground">&lt;{data.fromEmail}&gt;</span>
            </div>
            <p className="text-xs text-muted-foreground">
              to <span className="text-muted-foreground">{data.to}</span>
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{data.timestamp}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="prose prose-sm prose-invert max-w-none leading-relaxed text-foreground">
          <ReactMarkdown>{data.body}</ReactMarkdown>
        </div>
        {data.attachments && data.attachments.length > 0 && (
          <div className="mt-8 border-t border-border/80 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Attachments ({data.attachments.length})
            </h4>
            <div className="flex flex-wrap gap-3">
              {data.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 hover:bg-muted transition-colors cursor-pointer max-w-xs w-full sm:w-auto">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-900/30 text-blue-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{att.filename}</p>
                    {att.size && <p className="text-[10px] text-muted-foreground">{Math.round(att.size / 1024)} KB</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border px-6 py-3">
        <div className="flex gap-2">
          <ActionBtn id="reading-reply" icon={<Reply size={14} />} label="Reply" />
          <ActionBtn id="reading-reply-all" icon={<ReplyAll size={14} />} label="Reply All" />
          <ActionBtn id="reading-forward" icon={<Forward size={14} />} label="Forward" />
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ id, icon }: { id: string; icon: React.ReactNode }) {
  return (
    <button
      id={id}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
    </button>
  );
}

function ActionBtn({
  id,
  icon,
  label,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      id={id}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-zinc-600 hover:bg-muted hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}
