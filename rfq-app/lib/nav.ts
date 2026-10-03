import type { NavItem } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { id: "inbox",   label: "Inbox",   icon: "inbox",         href: "/inbox",   count: 12 },
  { id: "sent",    label: "Sent",    icon: "send",          href: "/sent" },
  { id: "rfqs",   label: "RFQs",    icon: "file-text",     href: "/rfqs",    count: 4 },
  { id: "vendors", label: "Vendors", icon: "building-2",    href: "/vendors" },
  { id: "quotes",  label: "Review",  icon: "star",          href: "/quotes",  count: 3 },
  { id: "drafts",  label: "Drafts",  icon: "file-pen-line", href: "/drafts" },
];
