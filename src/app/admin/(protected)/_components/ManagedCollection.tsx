import type { ComponentProps } from "react";
import { AdminCard, EmptyState, StatusBadge } from "./AdminPage";
import { MediaUpload } from "@/components/admin/MediaUpload";

export type ServerFormAction = NonNullable<ComponentProps<"form">["action"]>;

type MediaFolder = "khadeeja/products" | "khadeeja/hero" | "khadeeja/content" | "khadeeja/instagram";

export type ManagedField = {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "number" | "textarea" | "checkbox" | "select" | "datetime-local" | "image" | "video";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  min?: number;
  step?: number;
  folder?: MediaFolder;
  aspect?: string;
  fit?: "cover" | "contain";
  hint?: string;
};

function fieldValue(record: Record<string, unknown> | undefined, name: string) {
  const value = record?.[name];
  if (Array.isArray(value)) return value.join(", ");
  return value == null ? "" : String(value);
}

function datetimeLocalValue(record: Record<string, unknown> | undefined, name: string) {
  const raw = record?.[name];
  if (!raw) return "";
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Editor({ fields, record }: { fields: ManagedField[]; record?: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${record?.id || "new"}-${field.name}`;
        const inputClass =
          "mt-1.5 min-h-10 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20";

        if (field.type === "checkbox") {
          return (
            <label
              key={field.name}
              className="mt-6 flex min-h-10 items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 cursor-pointer"
            >
              <input
                id={id}
                name={field.name}
                type="checkbox"
                defaultChecked={record ? Boolean(record[field.name]) : true}
                className="h-4 w-4 rounded accent-[#9c5247]"
              />
              <span>{field.label}</span>
            </label>
          );
        }

        if (field.type === "image" || field.type === "video") {
          return (
            <div key={field.name} className="text-xs font-bold uppercase tracking-wider text-stone-700 sm:col-span-1">
              <MediaUpload
                name={field.name}
                label={field.label}
                defaultValue={fieldValue(record, field.name)}
                folder={field.folder || "khadeeja/content"}
                aspectClassName={field.aspect}
                fit={field.fit}
              />
              {field.hint && (
                <p className="mt-1.5 text-xs font-normal text-stone-500 normal-case">
                  {field.hint}
                </p>
              )}
            </div>
          );
        }

        const value =
          field.type === "datetime-local"
            ? datetimeLocalValue(record, field.name)
            : fieldValue(record, field.name);

        return (
          <label
            key={field.name}
            htmlFor={id}
            className={`block text-xs font-bold uppercase tracking-wider text-stone-700 ${
              field.type === "textarea" ? "sm:col-span-2" : ""
            }`}
          >
            <span>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                id={id}
                name={field.name}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={value}
                className={`${inputClass} min-h-24 py-2.5 normal-case font-normal`}
              />
            ) : field.type === "select" ? (
              <select
                id={id}
                name={field.name}
                required={field.required}
                defaultValue={value}
                className={`${inputClass} normal-case font-normal`}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                name={field.name}
                type={field.type || "text"}
                required={field.required}
                placeholder={field.placeholder}
                min={field.min}
                step={field.step}
                defaultValue={value}
                className={`${inputClass} normal-case font-normal`}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export function ManagedCollection({
  records,
  fields,
  saveAction,
  deleteAction,
  emptyTitle,
  createLabel = "Add item",
  summary,
}: {
  records: Array<Record<string, unknown>>;
  fields: ManagedField[];
  saveAction: ServerFormAction;
  deleteAction: ServerFormAction;
  emptyTitle: string;
  createLabel?: string;
  summary: (record: Record<string, unknown>) => {
    title: string;
    detail?: string;
    status?: string | boolean | null;
  };
}) {
  const collectionLabel = createLabel.replace(/^Add\s+/i, "");

  return (
    <div className="space-y-6">
      {/* ── Top Create Card ── */}
      <AdminCard className="p-5 sm:p-6 rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
        <h2 className="mb-4 text-base font-bold text-stone-900 font-sans">
          {createLabel}
        </h2>
        <form action={saveAction}>
          <Editor fields={fields} />
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-5 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition active:scale-95 cursor-pointer"
            >
              {createLabel}
            </button>
          </div>
        </form>
      </AdminCard>

      {/* ── Existing Records List ── */}
      {records.length === 0 ? (
        <AdminCard className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
          <EmptyState title={emptyTitle} />
        </AdminCard>
      ) : (
        <ul
          aria-label={`${collectionLabel} list`}
          className="list-none space-y-6"
        >
          {records.map((record) => {
            const info = summary(record);
            const imageThumbnail =
              (typeof record.image === "string" && record.image) ||
              (typeof record.mobileImage === "string" && record.mobileImage);

            return (
              <li key={String(record.id)}>
                <AdminCard className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
                  {/* Card Header */}
                  <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-stone-50/50">
                    <div className="flex items-center gap-3">
                      {imageThumbnail && (
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageThumbnail}
                            alt={info.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 font-sans">
                          {info.title}
                        </h3>
                        {info.detail && (
                          <p className="mt-0.5 text-xs text-stone-500 line-clamp-1">
                            {info.detail}
                          </p>
                        )}
                      </div>
                    </div>
                    {info.status != null && <StatusBadge value={info.status} />}
                  </div>

                  {/* Card Edit Form */}
                  <form action={saveAction} className="p-5 sm:p-6">
                    <input type="hidden" name="id" value={String(record.id)} />
                    <Editor fields={fields} record={record} />
                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        type="submit"
                        aria-label={`Update ${info.title}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-[#9c5247] bg-[#fbf5f3] px-4 text-xs font-bold text-[#7f2d22] shadow-2xs hover:bg-[#f4e7e4] hover:border-[#7f2016] hover:text-[#5c160f] transition active:scale-95 cursor-pointer"
                      >
                        Save changes
                      </button>
                    </div>
                  </form>

                  {/* Card Delete Row */}
                  <form
                    action={deleteAction}
                    className="border-t border-stone-100 bg-stone-50/40 px-5 py-3 text-right"
                  >
                    <input type="hidden" name="id" value={String(record.id)} />
                    <button
                      type="submit"
                      aria-label={`Delete ${info.title}`}
                      className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </form>
                </AdminCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

