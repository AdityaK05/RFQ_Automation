"use client";

import { useState, useEffect, useCallback } from "react";
import ListPane from "@/components/shared/ListPane";
import ReadingPane from "@/components/shared/ReadingPane";
import type { ItemRowData, ReadingPaneData } from "@/lib/types";
import { RefreshCw, Loader2 } from "lucide-react";

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadEmails = useCallback(() => {
    fetch("/api/emails?direction=INBOUND")
      .then((res) => res.json())
      .then((data) => {
        if (data.emails) {
          setEmails(data.emails);
          if (data.emails.length > 0 && !selectedId) {
            // Group and select first thread
            const grouped = groupEmails(data.emails);
            const firstKey = Object.keys(grouped)[0];
            if (firstKey) setSelectedId(firstKey);
          }
        }
      })
      .catch(console.error);
  }, [selectedId]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  async function handleSync() {
    setIsSyncing(true);
    try {
      await fetch("/api/emails/sync", { method: "POST" });
      loadEmails();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }

  // Group by threadId, rfqId, or fallback to subject
  function groupEmails(emailList: any[]) {
    const groups: Record<string, any[]> = {};
    emailList.forEach((email) => {
      const key = email.threadId || email.rfqId || email.subject;
      if (!groups[key]) groups[key] = [];
      groups[key].push(email);
    });
    return groups;
  }

  const groupedEmails = groupEmails(emails);

  const listItems: ItemRowData[] = Object.entries(groupedEmails).map(([key, group]) => {
    const latest = group[0]; // Assuming descending order from API
    return {
      id: key,
      from: latest.from,
      subject: latest.subject + (group.length > 1 ? ` (${group.length})` : ""),
      preview: latest.bodyText?.slice(0, 80) + "..." || "",
      timestamp: new Date(latest.createdAt).toLocaleDateString(),
      isRead: latest.isRead,
      tags: latest.flags || [],
      avatarFallback: latest.from[0].toUpperCase(),
    };
  });

  const selectedGroup = selectedId ? groupedEmails[selectedId] : null;

  let readingData: ReadingPaneData | null = null;
  if (selectedGroup && selectedGroup.length > 0) {
    const latest = selectedGroup[0]; // First is latest

    // Concatenate bodies for a conversation view
    const conversationBody = selectedGroup
      .map(
        (msg) =>
          `**From:** ${msg.from} <${msg.fromEmail}>\n**Date:** ${new Date(
            msg.createdAt
          ).toLocaleString()}\n\n${msg.bodyText || ""}\n\n---\n`
      )
      .join("\n");

    readingData = {
      id: latest.id,
      from: latest.from,
      fromEmail: latest.fromEmail,
      to: latest.to,
      subject: latest.subject,
      timestamp: new Date(latest.createdAt).toLocaleString(),
      body: conversationBody,
      tags: latest.flags,
      attachments: latest.subject.toLowerCase().includes("rfq") ? [{ filename: `Quote_Response.pdf`, size: 1024000 }] : [],
    };
  }

  return (
    <div className="split-view relative">
      <div className="flex h-full flex-col w-80 shrink-0 border-r border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
           <h2 className="font-semibold text-foreground">Inbox</h2>
           <button
             onClick={handleSync}
             disabled={isSyncing}
             className="flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
           >
             {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
             Sync IMAP
           </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ListPane
            title=""
            items={listItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRefresh={loadEmails}
          />
        </div>
      </div>
      <div className="flex-1">
        <ReadingPane data={readingData} />
      </div>
    </div>
  );
}
