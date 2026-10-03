"use client";

import { useState, useEffect, useCallback } from "react";
import ListPane from "@/components/shared/ListPane";
import SchemaForm from "@/components/shared/SchemaForm";
import type { ItemRowData, FormFieldConfig } from "@/lib/types";
import { Check, X as XIcon, Star, Loader2, Edit2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QUOTE_EDIT_FIELDS: FormFieldConfig[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "PENDING", value: "PENDING" },
      { label: "RECEIVED", value: "RECEIVED" },
      { label: "REJECTED", value: "REJECTED" },
    ],
    gridSpan: 1,
  },
  {
    name: "totalAmount",
    label: "Total Amount",
    type: "number",
    gridSpan: 1,
  },
  {
    name: "leadTimeDays",
    label: "Lead Time (Days)",
    type: "number",
    gridSpan: 1,
  },
  {
    name: "validityDays",
    label: "Validity (Days)",
    type: "number",
    gridSpan: 1,
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    gridSpan: 2,
  },
];

export default function QuotesReviewPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQuotes = useCallback(() => {
    fetch("/api/quotes?status=PENDING")
      .then((res) => res.json())
      .then((data) => {
        if (data.quotes) {
          setQuotes(data.quotes);
          if (data.quotes.length > 0 && !selectedId) {
            setSelectedId(data.quotes[0].id);
          }
        }
      })
      .catch(console.error);
  }, [selectedId]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const listItems: ItemRowData[] = quotes.map((q) => ({
    id: q.id,
    from: q.vendor?.name || "Unknown Vendor",
    subject: `Quote for ${q.rfq?.number || "RFQ"}`,
    preview: `Confidence: ${q.confidence || 0}% • Total: ${q.currency} ${q.totalAmount || "N/A"}`,
    timestamp: new Date(q.createdAt).toLocaleDateString(),
    isRead: false,
    tags: q.confidence < 50 ? ["low-confidence"] : ["review"],
    avatarFallback: (q.vendor?.name || "V")[0],
  }));

  const selectedQuote = quotes.find((q) => q.id === selectedId);

  async function handleApprove(id: string) {
    try {
      await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "RECEIVED" }),
      });
      loadQuotes();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReject(id: string) {
    try {
      await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "REJECTED" }),
      });
      loadQuotes();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleBulkApprove() {
    const highConfidenceIds = quotes.filter(q => q.confidence && q.confidence >= 80).map(q => q.id);
    if (highConfidenceIds.length === 0) return alert("No high confidence quotes to approve.");
    
    try {
      await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "bulk", bulkApproveIds: highConfidenceIds }),
      });
      loadQuotes();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEditSubmit(values: Record<string, unknown>) {
    if (!selectedQuote) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: selectedQuote.id }),
      });
      if (!res.ok) throw new Error("Failed to update Quote");
      loadQuotes();
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="split-view">
      <ListPane
        title="Review Queue"
        items={listItems}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setIsEditing(false); }}
        onRefresh={loadQuotes}
        headerAction={
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30"
          >
            <CheckCircle2 size={12} />
            Bulk Approve High Confidence
          </button>
        }
      />

      <div className="flex h-full flex-col overflow-y-auto bg-zinc-950 p-6">
        {selectedQuote ? (
          isEditing ? (
            <div className="max-w-2xl">
              <div className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-base font-semibold text-zinc-100">
                  Edit Quote
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800"
                >
                  <XIcon size={15} />
                </button>
              </div>
              <SchemaForm
                id="quote-edit-form"
                fields={QUOTE_EDIT_FIELDS}
                initialValues={{
                  status: selectedQuote.status,
                  totalAmount: selectedQuote.totalAmount || "",
                  leadTimeDays: selectedQuote.leadTimeDays || "",
                  validityDays: selectedQuote.validityDays || "",
                  notes: selectedQuote.notes || "",
                }}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save Changes"
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
              />
            </div>
          ) : (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star size={16} className={cn("text-yellow-400", selectedQuote.confidence < 50 && "text-red-400")} />
                    <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                      Quote from {selectedQuote.vendor?.name}
                    </h1>
                  </div>
                  <p className="text-sm text-zinc-400">
                    For RFQ: <span className="font-semibold text-zinc-300">{selectedQuote.rfq?.number}</span> - {selectedQuote.rfq?.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Confidence Score: <span className={cn("font-medium", selectedQuote.confidence >= 80 ? "text-emerald-400" : selectedQuote.confidence >= 50 ? "text-yellow-400" : "text-red-400")}>{selectedQuote.confidence || 0}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(selectedQuote.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedQuote.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/40"
                  >
                    <XIcon size={14} />
                    Reject
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs text-zinc-500 mb-1">Total Amount</p>
                  <p className="font-semibold text-zinc-100">{selectedQuote.currency} {selectedQuote.totalAmount || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs text-zinc-500 mb-1">Lead Time</p>
                  <p className="font-semibold text-zinc-100">{selectedQuote.leadTimeDays ? `${selectedQuote.leadTimeDays} Days` : "N/A"}</p>
                </div>
              </div>

              {selectedQuote.notes && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                  <p className="text-xs text-zinc-500 mb-2">Notes</p>
                  <p className="text-sm text-zinc-300">{selectedQuote.notes}</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-600">
            <Star size={32} />
            <p className="text-sm font-medium">Select a quote to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
