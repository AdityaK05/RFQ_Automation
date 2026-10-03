"use client";

import { useState, useEffect, useCallback } from "react";
import ListPane from "@/components/shared/ListPane";
import ReadingPane from "@/components/shared/ReadingPane";
import type { ItemRowData, ReadingPaneData } from "@/lib/types";
import { Send, Loader2 } from "lucide-react";

export default function SentPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const loadEmails = useCallback(() => {
    fetch("/api/emails?direction=OUTBOUND")
      .then((res) => res.json())
      .then((data) => {
        if (data.emails) {
          setEmails(data.emails);
          if (data.emails.length > 0 && !selectedId) {
            setSelectedId(data.emails[0].id);
          }
        }
      })
      .catch(console.error);
  }, [selectedId]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const listItems: ItemRowData[] = emails.map((email) => ({
    id: email.id,
    from: email.to, // Show who we sent it to in the "Sent" folder list
    subject: email.subject,
    preview: email.bodyText?.slice(0, 80) + "..." || "",
    timestamp: new Date(email.createdAt).toLocaleDateString(),
    isRead: true,
    tags: email.flags || [],
    avatarFallback: email.to[0].toUpperCase(),
  }));

  const selectedEmail = emails.find((e) => e.id === selectedId);

  let readingData: ReadingPaneData | null = null;
  if (selectedEmail) {
    readingData = {
      id: selectedEmail.id,
      from: selectedEmail.from,
      fromEmail: selectedEmail.fromEmail,
      to: selectedEmail.to,
      subject: selectedEmail.subject,
      timestamp: new Date(selectedEmail.createdAt).toLocaleString(),
      body: selectedEmail.bodyText || "",
      tags: selectedEmail.flags,
      attachments: selectedEmail.rfqId ? [{ filename: `RFQ_Template.xlsx`, size: 24500 }] : [],
    };
  }

  async function handleSendReminder() {
    if (!selectedEmail || !selectedEmail.rfqId || !selectedEmail.vendorId) return;
    setIsSendingReminder(true);
    try {
      const res = await fetch("/api/rfqs/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: selectedEmail.rfqId,
          vendorId: selectedEmail.vendorId,
          isReminder: true,
        }),
      });
      if (res.ok) {
        alert("Reminder sent successfully!");
        loadEmails(); // Reload to see the new sent email
      } else {
        alert("Failed to send reminder.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending reminder.");
    } finally {
      setIsSendingReminder(false);
    }
  }

  return (
    <div className="split-view">
      <ListPane
        title="Sent"
        items={listItems}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRefresh={loadEmails}
      />
      <div className="flex h-full flex-col bg-zinc-950 flex-1 relative">
        <ReadingPane data={readingData} />
        {selectedEmail?.rfqId && (
          <div className="absolute top-4 right-32 flex items-center gap-2">
            <button
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="flex items-center gap-1.5 rounded-full border border-blue-700/50 bg-blue-900/20 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-900/40 disabled:opacity-50"
            >
              {isSendingReminder ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
