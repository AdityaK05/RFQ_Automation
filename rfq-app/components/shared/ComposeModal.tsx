"use client";

import { useState, useEffect } from "react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Plus,
  Trash2,
  Loader2,
  Building2,
  FileText,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { useCompose } from "@/components/shared/ComposeContext";
import type { VendorRecord, RfqItemInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_LINE_ITEM: RfqItemInput = {
  lineNumber: 1,
  description: "",
  partNumber: "",
  quantity: 100,
  unit: "PCS",
  specs: "",
  targetPrice: undefined,
};

export default function ComposeModal() {
  const { isOpen, options, closeCompose } = useCompose();

  if (!isOpen) return null;

  return (
    <ComposeModalDialog
      key={`${options.initialVendorId || ""}-${options.initialTitle || ""}`}
      initialVendorId={options.initialVendorId}
      initialTitle={options.initialTitle}
      onClose={closeCompose}
    />
  );
}

type ComposeModalDialogProps = {
  initialVendorId?: string;
  initialTitle?: string;
  onClose: () => void;
};

function ComposeModalDialog({
  initialVendorId,
  initialTitle,
  onClose,
}: ComposeModalDialogProps) {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const [availableVendors, setAvailableVendors] = useState<VendorRecord[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(
    initialVendorId ? [initialVendorId] : []
  );
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");

  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    return defaultDue.toISOString().split("T")[0];
  });
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState<RfqItemInput[]>([{ ...DEFAULT_LINE_ITEM }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => {
        if (data.vendors) {
          setAvailableVendors(data.vendors);
        }
      })
      .catch(() => {});
  }, []);

  const filteredVendors = availableVendors.filter(
    (v) =>
      !selectedVendorIds.includes(v.id) &&
      (v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
        v.email.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
        (v.category && v.category.toLowerCase().includes(vendorSearchQuery.toLowerCase())))
  );

  function addVendor(vendorId: string) {
    setSelectedVendorIds((prev) => [...prev, vendorId]);
    setVendorSearchQuery("");
    setVendorSearchOpen(false);
  }

  function removeVendor(vendorId: string) {
    setSelectedVendorIds((prev) => prev.filter((id) => id !== vendorId));
  }

  function addLineItem() {
    setItems((prev) => [
      ...prev,
      {
        ...DEFAULT_LINE_ITEM,
        lineNumber: prev.length + 1,
      },
    ]);
  }

  function updateLineItem(
    index: number,
    field: keyof RfqItemInput,
    value: string | number | undefined
  ) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeLineItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((it, idx) => ({ ...it, lineNumber: idx + 1 }));
    });
  }

  const totalEstimatedBudget = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.targetPrice) || 0),
    0
  );

  async function handleSubmit(asDraft: boolean) {
    if (!title.trim()) {
      setErrorMessage("Please enter an RFQ title.");
      return;
    }

    const invalidItem = items.find((it) => !it.description.trim() || Number(it.quantity) <= 0);
    if (invalidItem) {
      setErrorMessage("Each line item requires a description and quantity greater than 0.");
      return;
    }

    if (!asDraft && selectedVendorIds.length === 0) {
      setErrorMessage("Please select at least one vendor to send the RFQ to, or save as Draft.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate || undefined,
          currency,
          vendorIds: selectedVendorIds,
          items,
          status: asDraft ? "DRAFT" : "SENT",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit RFQ");
      }

      onClose();
      window.dispatchEvent(new CustomEvent("rfq-created"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col rounded-xl border border-border bg-background shadow-2xl shadow-black/80 transition-all duration-200",
        maximized
          ? "inset-4 sm:inset-10"
          : minimized
          ? "bottom-4 right-4 h-12 w-80 overflow-hidden"
          : "bottom-4 right-4 h-[640px] w-full max-w-[760px]"
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600/30 text-blue-400">
            <FileText size={14} />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {minimized ? (title || "New RFQ") : "New RFQ (Request for Quote)"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="rfq-compose-minimize-btn"
            onClick={() => setMinimized((m) => !m)}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Minus size={14} />
          </button>
          {!minimized && (
            <button
              id="rfq-compose-maximize-btn"
              onClick={() => setMaximized((m) => !m)}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
          <button
            id="rfq-compose-close-btn"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5 border-b border-border/80 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  To (Vendors):
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {selectedVendorIds.length} vendor(s) selected
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card/60 p-2 focus-within:border-blue-500">
                {selectedVendorIds.map((vendorId) => {
                  const vendor = availableVendors.find((v) => v.id === vendorId);
                  return (
                    <span
                      key={vendorId}
                      className="flex items-center gap-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 px-2.5 py-0.5 text-xs text-blue-300"
                    >
                      <Building2 size={11} />
                      {vendor?.name || vendorId}
                      <button
                        type="button"
                        onClick={() => removeVendor(vendorId)}
                        className="text-blue-400 hover:text-blue-200"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}

                <div className="relative flex-1 min-w-[140px]">
                  <input
                    id="rfq-vendor-search"
                    type="text"
                    value={vendorSearchQuery}
                    onFocus={() => setVendorSearchOpen(true)}
                    onChange={(e) => {
                      setVendorSearchQuery(e.target.value);
                      setVendorSearchOpen(true);
                    }}
                    placeholder={
                      selectedVendorIds.length === 0
                        ? "Search and add vendors…"
                        : "Add more vendors…"
                    }
                    className="w-full bg-transparent px-1 text-xs text-foreground placeholder:text-zinc-600 focus:outline-none"
                  />

                  {vendorSearchOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-20 max-h-48 w-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-xl">
                      {filteredVendors.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No matching vendors found
                        </div>
                      ) : (
                        filteredVendors.map((vendor) => (
                          <button
                            key={vendor.id}
                            type="button"
                            onClick={() => addVendor(vendor.id)}
                            className="flex w-full items-start justify-between rounded px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                          >
                            <div>
                              <p className="font-medium text-foreground">{vendor.name}</p>
                              <p className="text-[10px] text-muted-foreground">{vendor.category || vendor.email}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground">★ {vendor.rating}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rfq-title" className="text-xs font-medium text-muted-foreground">
                Subject / RFQ Title <span className="text-red-400">*</span>
              </label>
              <input
                id="rfq-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Steel Brackets & Hardware Assembly – Batch 4"
                className="h-10 w-full rounded-lg border border-border bg-card/60 px-3 text-sm text-foreground placeholder:text-zinc-600 transition-colors focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="rfq-due-date" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  Submission Deadline
                </label>
                <input
                  id="rfq-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card/60 px-3 text-xs text-foreground transition-colors focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rfq-currency" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IndianRupee size={12} />
                  Currency
                </label>
                <select
                  id="rfq-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card/60 px-3 text-xs text-foreground transition-colors focus:border-blue-500 focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="rfq-description" className="text-xs text-muted-foreground">
                Instructions / Terms to Vendors
              </label>
              <textarea
                id="rfq-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include delivery location, inspection standards, payment terms, or quotation validity requirement…"
                className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-foreground placeholder:text-zinc-600 transition-colors focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Line Items
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {items.length} item{items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  id="rfq-add-item-btn"
                  onClick={addLineItem}
                  className="flex items-center gap-1 rounded-md border border-border bg-muted/80 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-zinc-700"
                >
                  <Plus size={13} />
                  Add Line Item
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card/40">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-card text-muted-foreground">
                    <tr>
                      <th className="w-10 px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2">Description *</th>
                      <th className="w-28 px-3 py-2">Part No.</th>
                      <th className="w-20 px-3 py-2">Qty *</th>
                      <th className="w-20 px-3 py-2">Unit</th>
                      <th className="w-24 px-3 py-2">Target Price</th>
                      <th className="px-3 py-2">Specs</th>
                      <th className="w-10 px-2 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-center font-medium text-muted-foreground">
                          {item.lineNumber}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => updateLineItem(index, "description", e.target.value)}
                            placeholder="Part / item description"
                            className="w-full rounded border border-border bg-card/80 px-2 py-1 text-xs text-foreground placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={item.partNumber || ""}
                            onChange={(e) => updateLineItem(index, "partNumber", e.target.value)}
                            placeholder="Optional"
                            className="w-full rounded border border-border bg-card/80 px-2 py-1 text-xs text-foreground placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                            className="w-full rounded border border-border bg-card/80 px-2 py-1 text-xs text-foreground focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, "unit", e.target.value)}
                            className="w-full rounded border border-border bg-card/80 px-1 py-1 text-xs text-foreground focus:border-blue-500 focus:outline-none"
                          >
                            <option value="PCS">PCS</option>
                            <option value="KG">KG</option>
                            <option value="MTR">MTR</option>
                            <option value="SET">SET</option>
                            <option value="LOT">LOT</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.targetPrice ?? ""}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "targetPrice",
                                e.target.value === "" ? undefined : Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                            className="w-full rounded border border-border bg-card/80 px-2 py-1 text-xs text-foreground placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={item.specs || ""}
                            onChange={(e) => updateLineItem(index, "specs", e.target.value)}
                            placeholder="Grade, tolerances, finish"
                            className="w-full rounded border border-border bg-card/80 px-2 py-1 text-xs text-foreground placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => removeLineItem(index)}
                            className="text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-20"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalEstimatedBudget > 0 && (
                <div className="flex justify-end pr-2 text-xs text-muted-foreground">
                  <span>
                    Est. Target Total:{" "}
                    <strong className="text-foreground">
                      {currency} {totalEstimatedBudget.toLocaleString()}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-card/90 px-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="rfq-send-btn"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Send RFQ
              </button>

              <button
                type="button"
                id="rfq-save-draft-btn"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="rounded-lg border border-border bg-muted/80 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                Save Draft
              </button>
            </div>

            <button
              type="button"
              id="rfq-discard-btn"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
