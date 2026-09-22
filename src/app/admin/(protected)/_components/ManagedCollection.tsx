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
  return <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => {
    const id = `${record?.id || "new"}-${field.name}`;
    const inputClass = "mt-1 min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20";
    if (field.type === "checkbox") return <label key={field.name} className="mt-6 flex min-h-10 items-center gap-2 text-sm font-medium text-stone-700"><input id={id} name={field.name} type="checkbox" defaultChecked={record ? Boolean(record[field.name]) : true} className="h-4 w-4 accent-[#9c5247]"/>{field.label}</label>;
    if (field.type === "image" || field.type === "video") return <div key={field.name} className="text-sm font-medium text-stone-700"><MediaUpload name={field.name} label={field.label} defaultValue={fieldValue(record, field.name)} folder={field.folder || "khadeeja/content"} aspectClassName={field.aspect} fit={field.fit}/>{field.hint ? <p className="mt-1 text-xs font-normal text-stone-500">{field.hint}</p> : null}</div>;
    const value = field.type === "datetime-local" ? datetimeLocalValue(record, field.name) : fieldValue(record, field.name);
    return <label key={field.name} htmlFor={id} className={`text-sm font-medium text-stone-700 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>{field.label}{field.type === "textarea" ? <textarea id={id} name={field.name} required={field.required} placeholder={field.placeholder} defaultValue={value} className={`${inputClass} min-h-24 py-2.5`}/> : field.type === "select" ? <select id={id} name={field.name} required={field.required} defaultValue={value} className={inputClass}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input id={id} name={field.name} type={field.type || "text"} required={field.required} placeholder={field.placeholder} min={field.min} step={field.step} defaultValue={value} className={inputClass}/>}</label>;
  })}</div>;
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
  summary: (record: Record<string, unknown>) => { title: string; detail?: string; status?: string | boolean | null };
}) {
  const collectionLabel = createLabel.replace(/^Add\s+/i, "");

  return <div className="space-y-6"><AdminCard className="p-5 sm:p-6"><h2 className="mb-4 font-semibold text-stone-900">{createLabel}</h2><form action={saveAction}><Editor fields={fields}/><div className="mt-4 flex justify-end"><button type="submit" className="min-h-10 rounded-lg bg-[#9c5247] px-4 text-sm font-semibold text-white hover:bg-[#7e3f35]">{createLabel}</button></div></form></AdminCard>
    {records.length === 0 ? <AdminCard><EmptyState title={emptyTitle}/></AdminCard> : <ul aria-label={`${collectionLabel} list`} className="list-none space-y-6">{records.map((record) => { const info = summary(record); return <li key={String(record.id)}><AdminCard><div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-stone-900">{info.title}</h3>{info.detail ? <p className="mt-0.5 text-sm text-stone-500">{info.detail}</p> : null}</div>{info.status != null ? <StatusBadge value={info.status}/> : null}</div><form action={saveAction} className="p-5"><input type="hidden" name="id" value={String(record.id)}/><Editor fields={fields} record={record}/><div className="mt-4 flex justify-end gap-2"><button type="submit" aria-label={`Update ${info.title}`} className="min-h-10 rounded-lg border border-stone-300 px-4 text-sm font-semibold text-stone-700">Save changes</button></div></form><form action={deleteAction} className="border-t border-stone-100 px-5 py-3 text-right"><input type="hidden" name="id" value={String(record.id)}/><button type="submit" aria-label={`Delete ${info.title}`} className="text-sm font-semibold text-red-700 hover:underline">Delete</button></form></AdminCard></li>; })}</ul>}
  </div>;
}
