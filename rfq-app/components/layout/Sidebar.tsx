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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-zinc-800 bg-zinc-950 pt-16">
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
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  active ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "min-w-[20px] rounded-full px-1.5 text-center text-xs font-semibold",
                    active ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-300"
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">
              {session?.user?.name ?? "Loading…"}
            </p>
            <p className="truncate text-[11px] text-zinc-500">
              {session?.user?.email ?? ""}
            </p>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
