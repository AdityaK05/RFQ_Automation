"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import {
  Inbox,
  Send,
  FileText,
  Building2,
  FilePenLine,
  PackageOpen,
  LogOut,
  Star,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  inbox: Inbox,
  send: Send,
  "file-text": FileText,
  "building-2": Building2,
  "file-pen-line": FilePenLine,
  star: Star,
};

export default function Sidebar() {
  const pathname = usePathname();
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-background pt-16">
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? PackageOpen;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "min-w-[20px] rounded-full px-1.5 text-center text-xs font-semibold",
                    active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {session?.user?.name ?? "Loading…"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {session?.user?.email ?? ""}
            </p>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
