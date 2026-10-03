"use client";

import { useState, useEffect, useCallback } from "react";
import ListPane from "@/components/shared/ListPane";
import SchemaForm from "@/components/shared/SchemaForm";
import { useCompose } from "@/components/shared/ComposeContext";
import type { VendorRecord, ItemRowData, FormFieldConfig } from "@/lib/types";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileSpreadsheet,
  Star,
  Plus,
  Edit2,
  Trash2,
  Send,
  X,
} from "lucide-react";

const VENDOR_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: "name",
    label: "Company / Vendor Name",
    type: "text",
    required: true,
    placeholder: "e.g. Apex Industrial Components",
    gridSpan: 2,
  },
  {
    name: "email",
    label: "Sales / RFQ Email",
    type: "email",
    required: true,
    placeholder: "sales@apexcomponents.com",
    gridSpan: 1,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "+91 98765 43210",
    gridSpan: 1,
  },
  {
    name: "category",
    label: "Primary Category",
    type: "select",
    options: [
      { label: "Metals & Fasteners", value: "Metals & Fasteners" },
      { label: "Hydraulics & Pneumatics", value: "Hydraulics & Pneumatics" },
      { label: "Sheet Metal Fabrication", value: "Sheet Metal Fabrication" },
      { label: "Fasteners & Hardware", value: "Fasteners & Hardware" },
      { label: "Electronics & Electrical", value: "Electronics & Electrical" },
      { label: "CNC Machining & Tooling", value: "CNC Machining & Tooling" },
      { label: "Plastics & Polymers", value: "Plastics & Polymers" },
    ],
    defaultValue: "Metals & Fasteners",
    gridSpan: 1,
  },
  {
    name: "rating",
    label: "Vendor Rating",
    type: "select",
    options: [
      { label: "5 Stars (Preferred)", value: "5" },
      { label: "4 Stars (Good)", value: "4" },
      { label: "3 Stars (Standard)", value: "3" },
      { label: "2 Stars (Under Review)", value: "2" },
      { label: "1 Star (Restricted)", value: "1" },
    ],
    defaultValue: "4",
    gridSpan: 1,
  },
  {
    name: "website",
    label: "Website",
    type: "url",
    placeholder: "https://apexcomponents.com",
    gridSpan: 1,
  },
  {
    name: "gstin",
    label: "GSTIN / Tax ID",
    type: "text",
    placeholder: "27AAPCA1234A1Z5",
    gridSpan: 1,
  },
  {
    name: "isActive",
    label: "Active Vendor",
    type: "checkbox",
    defaultValue: true,
    placeholder: "Mark as active & eligible for new RFQs",
    gridSpan: 2,
  },
  {
    name: "address",
    label: "Facility / Office Address",
    type: "text",
    placeholder: "Plot 14, Industrial Area Phase 2",
    gridSpan: 2,
  },
  {
    name: "notes",
    label: "Internal Procurement Notes",
    type: "textarea",
    placeholder: "Special terms, ISO certifications, preferred payment terms…",
    gridSpan: 2,
  },
];

export default function VendorsPage() {
  const { openCompose } = useCompose();

  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "create" | "edit">("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadVendors = useCallback(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => {
        if (data.vendors) {
          setVendors(data.vendors);
          if (data.vendors.length > 0 && !selectedId) {
            setSelectedId(data.vendors[0].id);
          }
        }
      })
      .catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const selectedVendor = vendors.find((v) => v.id === selectedId) || null;

  const listItems: ItemRowData[] = vendors.map((vendor) => ({
    id: vendor.id,
    from: vendor.name,
    subject: vendor.category || "Supplier",
    preview: `${vendor.email} · ${vendor.phone || "No phone"}`,
    timestamp: `${vendor.rating} ★`,
    isRead: true,
    tags: [vendor.isActive ? "active" : "inactive"],
    avatarFallback: vendor.name.slice(0, 2).toUpperCase(),
  }));

  function handleSelectVendor(id: string) {
    setSelectedId(id);
    setPanelMode("view");
    setErrorMessage(null);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setPanelMode("create");
    setErrorMessage(null);
  }

  function handleStartEdit() {
    setPanelMode("edit");
    setErrorMessage(null);
  }

  async function handleFormSubmit(values: Record<string, unknown>) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (panelMode === "create") {
        const res = await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create vendor");
        setVendors((prev) => [data.vendor, ...prev]);
        setSelectedId(data.vendor.id);
        setPanelMode("view");
      } else if (panelMode === "edit" && selectedVendor) {
        const res = await fetch("/api/vendors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, id: selectedVendor.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update vendor");
        setVendors((prev) =>
          prev.map((v) => (v.id === data.vendor.id ? data.vendor : v))
        );
        setPanelMode("view");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteVendor() {
    if (!selectedVendor) return;
    if (!confirm(`Are you sure you want to remove ${selectedVendor.name}?`)) return;

    try {
      const res = await fetch(`/api/vendors?id=${selectedVendor.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVendors((prev) => prev.filter((v) => v.id !== selectedVendor.id));
        setSelectedId(null);
        setPanelMode("view");
      }
    } catch {}
  }

  return (
    <div className="split-view">
      <ListPane
        title="Vendors"
        items={listItems}
        selectedId={selectedId}
        onSelect={handleSelectVendor}
        onRefresh={loadVendors}
        headerAction={
          <button
            id="vendor-add-header-btn"
            onClick={handleStartCreate}
            className="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow transition-all hover:bg-blue-500 active:scale-95"
          >
            <Plus size={12} />
            Add
          </button>
        }
      />

      <div className="flex h-full flex-col overflow-y-auto bg-background">
        {panelMode === "create" ? (
          <div className="flex-1 p-6 max-w-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Add New Vendor</h2>
                <p className="text-xs text-muted-foreground">Register a new supplier to send RFQs to</p>
              </div>
              <button
                onClick={() => setPanelMode("view")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <SchemaForm
              id="vendor-create-form"
              fields={VENDOR_FORM_FIELDS}
              onSubmit={handleFormSubmit}
              onCancel={() => setPanelMode("view")}
              submitLabel="Create Vendor"
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          </div>
        ) : panelMode === "edit" && selectedVendor ? (
          <div className="flex-1 p-6 max-w-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Edit Vendor</h2>
                <p className="text-xs text-muted-foreground">{selectedVendor.name}</p>
              </div>
              <button
                onClick={() => setPanelMode("view")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <SchemaForm
              id="vendor-edit-form"
              fields={VENDOR_FORM_FIELDS}
              initialValues={{
                ...selectedVendor,
                rating: String(selectedVendor.rating),
              }}
              onSubmit={handleFormSubmit}
              onCancel={() => setPanelMode("view")}
              submitLabel="Save Changes"
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          </div>
        ) : selectedVendor ? (
          <div className="flex-1 p-6 max-w-3xl space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 ring-1 ring-zinc-700">
                  <Building2 size={24} className="text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">
                      {selectedVendor.name}
                    </h1>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        selectedVendor.isActive
                          ? "bg-green-900/50 text-green-400 border border-green-800/60"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {selectedVendor.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedVendor.category || "Supplier"}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={
                          i < selectedVendor.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-700"
                        }
                      />
                    ))}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({selectedVendor.rating} / 5)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="vendor-send-rfq-btn"
                  onClick={() => openCompose({ initialVendorId: selectedVendor.id })}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-500 active:scale-95"
                >
                  <Send size={13} />
                  Send RFQ
                </button>
                <button
                  id="vendor-edit-btn"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Edit2 size={13} />
                  Edit
                </button>
                <button
                  id="vendor-delete-btn"
                  onClick={handleDeleteVendor}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-900/40 hover:bg-red-950/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Mail size={14} className="text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${selectedVendor.email}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {selectedVendor.email}
                    </a>
                  </div>
                  {selectedVendor.phone && (
                    <div className="flex items-center gap-2.5 text-foreground">
                      <Phone size={14} className="text-muted-foreground shrink-0" />
                      <span>{selectedVendor.phone}</span>
                    </div>
                  )}
                  {selectedVendor.website && (
                    <div className="flex items-center gap-2.5 text-foreground">
                      <Globe size={14} className="text-muted-foreground shrink-0" />
                      <a
                        href={selectedVendor.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {selectedVendor.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Business & Tax Details
                </h3>
                <div className="space-y-2 text-xs">
                  {selectedVendor.gstin && (
                    <div className="flex items-center gap-2.5 text-foreground">
                      <FileSpreadsheet size={14} className="text-muted-foreground shrink-0" />
                      <span>GSTIN: {selectedVendor.gstin}</span>
                    </div>
                  )}
                  {selectedVendor.address && (
                    <div className="flex items-start gap-2.5 text-foreground">
                      <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <span>{selectedVendor.address}</span>
                    </div>
                  )}
                  <div className="pt-1 text-muted-foreground text-[11px]">
                    Participation: {selectedVendor.rfqCount || 0} RFQ(s) sent to date
                  </div>
                </div>
              </div>
            </div>

            {selectedVendor.notes && (
              <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Procurement Notes
                </h3>
                <p className="text-xs leading-relaxed text-foreground">
                  {selectedVendor.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-600">
            <Building2 size={32} />
            <p className="text-sm font-medium">Select a vendor or add a new one</p>
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus size={13} />
              Add Vendor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
