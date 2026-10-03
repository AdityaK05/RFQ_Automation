"use client";

import { useState, useEffect, useCallback } from "react";
import ListPane from "@/components/shared/ListPane";
import DataTable, { ColumnDef } from "@/components/shared/DataTable";
import SchemaForm from "@/components/shared/SchemaForm";
import { useCompose } from "@/components/shared/ComposeContext";
import type { RfqRecord, RfqItemInput, ItemRowData, FormFieldConfig } from "@/lib/types";
import {
  FileText,
  Plus,
  Calendar,
  IndianRupee,
  Building2,
  Edit2,
  Trash2,
  Clock,
  Send,
  X,
  Download,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RFQ_EDIT_FIELDS: FormFieldConfig[] = [
  {
    name: "title",
    label: "RFQ Title / Subject",
    type: "text",
    required: true,
    gridSpan: 2,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "DRAFT", value: "DRAFT" },
      { label: "SENT", value: "SENT" },
      { label: "PARTIAL", value: "PARTIAL" },
      { label: "RECEIVED", value: "RECEIVED" },
      { label: "EVALUATING", value: "EVALUATING" },
      { label: "AWARDED", value: "AWARDED" },
      { label: "CLOSED", value: "CLOSED" },
    ],
    gridSpan: 1,
  },
  {
    name: "currency",
    label: "Currency",
    type: "select",
    options: [
      { label: "INR (₹)", value: "INR" },
      { label: "USD ($)", value: "USD" },
      { label: "EUR (€)", value: "EUR" },
    ],
    gridSpan: 1,
  },
  {
    name: "dueDate",
    label: "Submission Deadline",
    type: "date",
    gridSpan: 1,
  },
  {
    name: "description",
    label: "Terms / Specifications",
    type: "textarea",
    gridSpan: 2,
  },
];

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "RECEIVED":
      return "bg-emerald-900/60 text-emerald-300 border-emerald-800/60";
    case "SENT":
      return "bg-blue-900/60 text-blue-300 border-blue-800/60";
    case "PARTIAL":
      return "bg-amber-900/60 text-amber-300 border-amber-800/60";
    case "EVALUATING":
      return "bg-purple-900/60 text-purple-300 border-purple-800/60";
    case "AWARDED":
      return "bg-teal-900/60 text-teal-300 border-teal-800/60";
    case "DRAFT":
      return "bg-muted text-muted-foreground border-border";
    case "CLOSED":
      return "bg-card text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getVendorStatusStyle(status: string) {
  switch (status) {
    case "QUOTED":
      return "bg-emerald-950/70 text-emerald-400 border-emerald-800/50";
    case "SENT":
      return "bg-blue-950/70 text-blue-400 border-blue-800/50";
    case "ACKNOWLEDGED":
      return "bg-amber-950/70 text-amber-400 border-amber-800/50";
    case "NO_QUOTE":
      return "bg-red-950/70 text-red-400 border-red-800/50";
    default:
      return "bg-muted/70 text-muted-foreground border-border";
  }
}

export default function RFQsPage() {
  const { openCompose } = useCompose();

  const [rfqs, setRfqs] = useState<RfqRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotesData, setQuotesData] = useState<any[]>([]);

  const loadRfqs = useCallback(() => {
    fetch("/api/rfqs")
      .then((res) => res.json())
      .then((data) => {
        if (data.rfqs) {
          setRfqs(data.rfqs);
          if (data.rfqs.length > 0 && !selectedId) {
            setSelectedId(data.rfqs[0].id);
          }
        }
      })
      .catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    loadRfqs();

    function handleRfqCreated() {
      loadRfqs();
    }
    
    function handleSearch() {
      const q = new URLSearchParams(window.location.search).get("q") || "";
      setSearchQuery(q.toLowerCase());
    }
    
    handleSearch(); // init
    window.addEventListener("search", handleSearch);
    window.addEventListener("rfq-created", handleRfqCreated);
    return () => {
      window.removeEventListener("search", handleSearch);
      window.removeEventListener("rfq-created", handleRfqCreated);
    };
  }, [loadRfqs]);

  const selectedRfq = rfqs.find((r) => r.id === selectedId) || null;
  
  useEffect(() => {
    if (isComparing && selectedRfq) {
      fetch(`/api/quotes?rfqId=${selectedRfq.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.quotes) setQuotesData(d.quotes.filter((q: any) => ["RECEIVED", "SHORTLISTED", "AWARDED"].includes(q.status)));
        });
    }
  }, [isComparing, selectedRfq]);

  const filteredRfqs = rfqs.filter(r => 
    !searchQuery || 
    r.title.toLowerCase().includes(searchQuery) || 
    r.number.toLowerCase().includes(searchQuery) ||
    r.vendors.some(v => v.vendorName.toLowerCase().includes(searchQuery))
  );

  const listItems: ItemRowData[] = filteredRfqs.map((rfq) => ({
    id: rfq.id,
    from: rfq.number,
    subject: rfq.title,
    preview: `${rfq.items.length} line item(s) · ${rfq.vendors.length} vendor(s) · Due ${rfq.dueDate || "Not set"}`,
    timestamp: rfq.dueDate ? rfq.dueDate.slice(5) : "Draft",
    isRead: rfq.status === "CLOSED" || rfq.status === "AWARDED",
    tags: [rfq.status],
    avatarFallback: rfq.number.replace("RFQ-", "").slice(0, 2),
  }));

  function handleSelectRfq(id: string) {
    setSelectedId(id);
    setIsEditing(false);
    setIsComparing(false);
    setErrorMessage(null);
  }

  async function handleEditSubmit(values: Record<string, unknown>) {
    if (!selectedRfq) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/rfqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: selectedRfq.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update RFQ");
      setRfqs((prev) =>
        prev.map((r) => (r.id === data.rfq.id ? data.rfq : r))
      );
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRfq() {
    if (!selectedRfq) return;
    if (!confirm(`Are you sure you want to delete ${selectedRfq.number}?`)) return;

    try {
      const res = await fetch(`/api/rfqs?id=${selectedRfq.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRfqs((prev) => prev.filter((r) => r.id !== selectedRfq.id));
        setSelectedId(null);
      }
    } catch {}
  }

  const itemColumns: ColumnDef<RfqItemInput>[] = [
    {
      key: "lineNumber",
      header: "#",
      className: "w-10 text-center font-medium text-muted-foreground",
      render: (row) => row.lineNumber,
    },
    {
      key: "description",
      header: "Description",
      className: "font-medium text-foreground",
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.description}</p>
          {row.specs && (
            <p className="text-[11px] text-muted-foreground">{row.specs}</p>
          )}
        </div>
      ),
    },
    {
      key: "partNumber",
      header: "Part No.",
      className: "w-28 text-muted-foreground font-mono text-[11px]",
      render: (row) => row.partNumber || "—",
    },
    {
      key: "quantity",
      header: "Quantity",
      className: "w-24 text-right",
      render: (row) => (
        <span className="font-medium">
          {Number(row.quantity).toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      key: "targetPrice",
      header: "Target Unit Price",
      className: "w-32 text-right",
      render: (row) =>
        row.targetPrice
          ? `${selectedRfq?.currency || "INR"} ${Number(row.targetPrice).toLocaleString()}`
          : "—",
    },
    {
      key: "lineTotal",
      header: "Target Total",
      className: "w-32 text-right font-medium text-foreground",
      render: (row) => {
        if (!row.targetPrice) return "—";
        const lineTotal = Number(row.quantity) * Number(row.targetPrice);
        return `${selectedRfq?.currency || "INR"} ${lineTotal.toLocaleString()}`;
      },
    },
  ];

  return (
    <div className="split-view">
      <ListPane
        title="RFQs"
        items={listItems}
        selectedId={selectedId}
        onSelect={handleSelectRfq}
        onRefresh={loadRfqs}
        headerAction={
          <button
            id="rfq-new-header-btn"
            onClick={() => openCompose()}
            className="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow transition-all hover:bg-blue-500 active:scale-95"
          >
            <Plus size={12} />
            New
          </button>
        }
      />

      <div className="flex h-full flex-col overflow-y-auto bg-background">
        {selectedRfq ? (
          isEditing ? (
            <div className="flex-1 p-6 max-w-2xl">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Edit {selectedRfq.number}
                  </h2>
                  <p className="text-xs text-muted-foreground">{selectedRfq.title}</p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X size={15} />
                </button>
              </div>

              <SchemaForm
                id="rfq-edit-form"
                fields={RFQ_EDIT_FIELDS}
                initialValues={{
                  title: selectedRfq.title,
                  status: selectedRfq.status,
                  currency: selectedRfq.currency,
                  dueDate: selectedRfq.dueDate || "",
                  description: selectedRfq.description || "",
                }}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save RFQ Changes"
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
              />
            </div>
          ) : isComparing ? (
            <div className="flex-1 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Compare Quotes: {selectedRfq.number}
                  </h1>
                  <p className="text-sm text-muted-foreground pt-1">
                    {quotesData.length} valid quote(s) received
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/quotes/export?rfqId=${selectedRfq.id}`}
                    download
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-500"
                  >
                    <Download size={13} />
                    Export Excel
                  </a>
                  <button
                    onClick={() => setIsComparing(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Back to Details
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-border bg-card/40">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="border-b border-border bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold w-12">#</th>
                      <th className="p-3 font-semibold min-w-[200px]">Item Description</th>
                      <th className="p-3 font-semibold w-24">Qty</th>
                      <th className="p-3 font-semibold w-32 border-r border-border text-muted-foreground">Target</th>
                      {quotesData.map(q => (
                         <th key={q.id} className="p-3 font-semibold min-w-[150px]">
                           {q.vendor?.name}
                           <div className="text-[10px] text-muted-foreground font-normal mt-0.5">Total: {selectedRfq.currency} {q.totalAmount || "N/A"}</div>
                         </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {selectedRfq.items.map((item) => {
                       // Find best price for highlighting
                       let minPrice = Infinity;
                       quotesData.forEach(q => {
                         const qi = q.items.find((i:any) => i.rfqItemId === item.id);
                         if (qi && Number(qi.unitPrice) > 0 && Number(qi.unitPrice) < minPrice) {
                           minPrice = Number(qi.unitPrice);
                         }
                       });

                       return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground">{item.lineNumber}</td>
                          <td className="p-3 font-medium text-foreground">{item.description}</td>
                          <td className="p-3">{Number(item.quantity).toLocaleString()} {item.unit}</td>
                          <td className="p-3 border-r border-border text-muted-foreground">
                            {item.targetPrice ? Number(item.targetPrice).toLocaleString() : "—"}
                          </td>
                          {quotesData.map(q => {
                            const qi = q.items.find((i:any) => i.rfqItemId === item.id);
                            const price = qi ? Number(qi.unitPrice) : null;
                            const isBest = price === minPrice && minPrice !== Infinity;
                            
                            return (
                              <td key={q.id} className={cn("p-3 font-mono text-[13px]", isBest ? "text-emerald-400 font-bold bg-emerald-900/10" : "text-muted-foreground")}>
                                {price ? price.toLocaleString() : "—"}
                              </td>
                            );
                          })}
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 max-w-4xl space-y-6">
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {selectedRfq.number}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider",
                        getStatusBadgeStyle(selectedRfq.status)
                      )}
                    >
                      {selectedRfq.status}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {selectedRfq.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    {selectedRfq.dueDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-muted-foreground" />
                        Deadline: {selectedRfq.dueDate}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <IndianRupee size={13} className="text-muted-foreground" />
                      Currency: {selectedRfq.currency}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-muted-foreground" />
                      Created: {selectedRfq.createdAt.slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsComparing(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-600/30"
                  >
                    <BarChart2 size={13} />
                    Compare
                  </button>
                  <button
                    id="rfq-detail-compose-btn"
                    onClick={() => openCompose({ initialTitle: selectedRfq.title })}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-500 active:scale-95"
                  >
                    <Send size={13} />
                    Invite Vendor
                  </button>
                  <button
                    id="rfq-edit-btn"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <button
                    id="rfq-delete-btn"
                    onClick={handleDeleteRfq}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-900/40 hover:bg-red-950/40 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {selectedRfq.description && (
                <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Terms & Instructions
                  </h3>
                  <p className="text-xs leading-relaxed text-foreground">
                    {selectedRfq.description}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-blue-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Participating Vendors ({selectedRfq.vendors.length})
                    </h3>
                  </div>
                </div>

                {selectedRfq.vendors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No vendors invited yet. Click &quot;Invite Vendor&quot; to send this RFQ to suppliers.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedRfq.vendors.map((vendor) => (
                      <div
                        key={vendor.vendorId}
                        className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {vendor.vendorName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {vendor.vendorEmail}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-2 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider",
                            getVendorStatusStyle(vendor.status)
                          )}
                        >
                          {vendor.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-blue-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Line Items ({selectedRfq.items.length})
                    </h3>
                  </div>
                </div>

                <DataTable
                  id="rfq-line-items-table"
                  columns={itemColumns}
                  data={selectedRfq.items}
                  getRowId={(item) => String(item.lineNumber)}
                  emptyMessage="No line items defined for this RFQ."
                />

                {selectedRfq.totalBudget && selectedRfq.totalBudget > 0 && (
                  <div className="flex justify-end pr-3 pt-1 text-xs text-muted-foreground">
                    <span>
                      Est. Target Total:{" "}
                      <strong className="text-foreground font-semibold">
                        {selectedRfq.currency} {selectedRfq.totalBudget.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-600">
            <FileText size={32} />
            <p className="text-sm font-medium">Select an RFQ or create a new one</p>
            <button
              onClick={() => openCompose()}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus size={13} />
              Create RFQ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
