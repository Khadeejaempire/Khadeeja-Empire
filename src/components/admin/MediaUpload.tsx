"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

type Signature = { cloud_name: string; api_key: string; timestamp: number; folder: string; signature: string };

export function MediaUpload({
  name,
  label,
  defaultValue = "",
  folder = "khadeeja/content",
  aspectClassName = "aspect-video",
  fit = "cover",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  folder?: "khadeeja/products" | "khadeeja/hero" | "khadeeja/content" | "khadeeja/instagram" | "khadeeja/categories";
  aspectClassName?: string;
  fit?: "cover" | "contain";
}) {
  const [value,setValue]=useState(defaultValue);
  const [status,setStatus]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);
  async function upload(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(!file)return;const extension=file.name.split(".").pop()?.toLowerCase()||"";const resourceType=file.type.startsWith("video/")?"video":"image";setStatus("Preparing upload…");try{const signatureResponse=await fetch("/api/admin/media/signature",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({folder,resourceType,format:extension,fileSize:file.size})});const signature=await signatureResponse.json() as Signature&{error?:string};if(!signatureResponse.ok)throw new Error(signature.error||"Upload is unavailable.");const payload=new FormData();payload.set("file",file);payload.set("api_key",signature.api_key);payload.set("timestamp",String(signature.timestamp));payload.set("folder",signature.folder);payload.set("signature",signature.signature);const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloud_name)}/${resourceType}/upload`,{method:"POST",body:payload});const result=await response.json() as {secure_url?:string;error?:{message?:string}};if(!response.ok||!result.secure_url)throw new Error(result.error?.message||"Upload failed.");setValue(result.secure_url);setStatus("Upload complete.");}catch(error){setStatus(error instanceof Error?error.message:"Upload failed.");}finally{if(inputRef.current)inputRef.current.value="";}}
  return (
    <div className="flex flex-col gap-2">
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      <input type="hidden" name={name} value={value || ""} />
      
      {/* File Preview */}
      {value ? (
        <div className={`relative ${aspectClassName} w-full max-w-[220px] max-h-48 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-2xs`}>
          {value.toLowerCase().match(/\.(mp4|webm|ogv|mov)$/) || value.includes("/video/upload/") ? (
            <video src={value} controls className={`h-full w-full object-${fit}`} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className={`h-full w-full object-${fit}`} />
          )}
          <button
            type="button"
            onClick={() => setValue("")}
            title="Remove media"
            className="absolute right-2 top-2 rounded-full bg-stone-900/80 p-1 text-white hover:bg-red-600 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : null}

      <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
        {value ? (
          <span className="min-w-0 flex-1 truncate text-sm text-stone-900" title={value}>
            {value.split("/").pop()}
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-stone-400">No file uploaded</span>
        )}
        <div
          onClick={() => inputRef.current?.click()}
          className="shrink-0 cursor-pointer rounded-md bg-[#9c5247]/10 px-3 py-1.5 text-xs font-semibold text-[#9c5247] hover:bg-[#9c5247]/20 transition"
        >
          Upload
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            onChange={upload}
            className="sr-only"
          />
        </div>
      </div>
      {status ? (
        <p className="text-xs text-stone-500" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
