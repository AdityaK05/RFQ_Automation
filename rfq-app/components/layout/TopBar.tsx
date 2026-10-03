"use client";

import { Search, PenSquare, Bell, ChevronDown } from "lucide-react";
import { useCompose } from "@/components/shared/ComposeContext";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function TopBar() {
  const { openCompose } = useCompose();
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ME";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur">
      <div className="flex w-56 shrink-0 items-center gap-2 pl-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
          <span className="text-sm font-bold text-primary-foreground">R</span>
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          RFQ<span className="text-primary">Pilot</span>
        </span>
      </div>

      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-2xl">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="global-search"
            type="search"
            placeholder="Search emails, RFQs, vendors…"
            defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") || "" : ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) {
                url.searchParams.set("q", e.target.value);
              } else {
                url.searchParams.delete("q");
              }
              window.history.replaceState({}, "", url.toString());
              window.dispatchEvent(new Event("search"));
            }}
            className="h-10 w-full rounded-full border border-border bg-muted/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-background focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="compose-btn"
          onClick={() => openCompose()}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <PenSquare size={15} />
          Compose
        </button>
        
        <ThemeToggle />

        <button
          id="notifications-btn"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <button
          id="user-menu-btn"
          className="flex h-9 items-center gap-1.5 rounded-full pl-1 pr-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
            {userInitials}
          </div>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
}
