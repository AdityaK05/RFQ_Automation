"use client";

import { useState } from "react";
import { FormFieldConfig } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SchemaFormProps = {
  id?: string;
  fields: FormFieldConfig[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  className?: string;
};

export default function SchemaForm({
  id = "schema-form",
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  errorMessage = null,
  className = "",
}: SchemaFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      data[field.name] =
        initialValues[field.name] !== undefined
          ? initialValues[field.name]
          : field.defaultValue !== undefined
          ? field.defaultValue
          : field.type === "checkbox"
          ? false
          : "";
    }
    return data;
  });

  function handleFieldChange(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(formData);
  }

  return (
    <form id={id} onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {errorMessage && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const fieldId = `${id}-${field.name}`;
          const value = formData[field.name] ?? "";
          const isFullSpan = field.gridSpan === 2 || field.type === "textarea";

          return (
            <div
              key={field.name}
              className={cn("space-y-1.5", isFullSpan && "sm:col-span-2")}
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor={fieldId}
                  className="text-xs font-medium text-foreground"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-red-400">*</span>
                  )}
                </label>
                {field.helperText && (
                  <span className="text-[11px] text-muted-foreground">
                    {field.helperText}
                  </span>
                )}
              </div>

              {field.type === "textarea" ? (
                <textarea
                  id={fieldId}
                  name={field.name}
                  value={value as string}
                  required={field.required}
                  disabled={field.disabled || isSubmitting}
                  placeholder={field.placeholder}
                  rows={4}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-full rounded-lg border border-border bg-card/90 px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 transition-colors focus:border-blue-500 focus:bg-card focus:outline-none disabled:opacity-50"
                />
              ) : field.type === "select" ? (
                <select
                  id={fieldId}
                  name={field.name}
                  value={value as string}
                  required={field.required}
                  disabled={field.disabled || isSubmitting}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-full rounded-lg border border-border bg-card/90 px-3 py-2 text-sm text-foreground transition-colors focus:border-blue-500 focus:bg-card focus:outline-none disabled:opacity-50"
                >
                  <option value="" disabled className="bg-card text-muted-foreground">
                    Select {field.label.toLowerCase()}…
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-foreground">
                  <input
                    id={fieldId}
                    name={field.name}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={field.disabled || isSubmitting}
                    onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-muted text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                  />
                  <span>{field.placeholder || field.label}</span>
                </label>
              ) : (
                <input
                  id={fieldId}
                  name={field.name}
                  type={field.type}
                  value={(value as string | number) ?? ""}
                  required={field.required}
                  disabled={field.disabled || isSubmitting}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    handleFieldChange(
                      field.name,
                      field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-border bg-card/90 px-3 text-sm text-foreground placeholder:text-zinc-600 transition-colors focus:border-blue-500 focus:bg-card focus:outline-none disabled:opacity-50"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={13} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
