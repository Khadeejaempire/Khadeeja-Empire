"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CategoryRecord, ProductRecord } from "@/lib/admin/types";
import { adminActionMessage } from "@/lib/admin/errors";
import { saveProductAction } from "@/actions/admin/products";
import { ProductImagesUpload } from "@/components/admin/ProductImagesUpload";
import { MediaUpload } from "@/components/admin/MediaUpload";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-[#9c5247] focus:ring-2 focus:ring-[#9c5247]/20";

function imageUrls(product?: ProductRecord) {
  return (product?.images || []).map((image) => typeof image === "string" ? image : image.url).join("\n");
}

export function ProductForm({ product, categories }: { product?: ProductRecord; categories: CategoryRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const price = Number(data.get("price") || 0);
    const oldPriceRaw = data.get("oldPrice");
    const oldPrice = oldPriceRaw && String(oldPriceRaw).trim() !== "" ? Number(oldPriceRaw) : null;

    if (oldPrice !== null && oldPrice < price) {
      toast.error(`MRP / old price (${oldPrice}) must be greater than or equal to current price (${price}).`);
      return;
    }

    startTransition(async () => {
      try {
        await saveProductAction(data);
        toast.success(product ? "Product updated." : "Product created.");
        if (!product) router.push("/admin/products");
      } catch (error) {
        toast.error(adminActionMessage(error, "Could not save the product. Reload and check before retrying."));
      }
    });
  };

  return <form onSubmit={handleSubmit} className="space-y-7">
    {product ? <input type="hidden" name="id" value={product.id} /> : null}
    <section><h2 className="mb-4 font-semibold text-stone-900">Basic information</h2><div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-stone-700">Product name<input className={inputClass} name="name" required defaultValue={product?.name || ""}/></label>
      <label className="text-sm font-medium text-stone-700">Slug<input className={inputClass} name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={product?.slug || ""}/></label>
      <label className="text-sm font-medium text-stone-700">Category<select className={inputClass} name="categoryId" defaultValue={product?.categoryId || ""}><option value="">Uncategorised</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="text-sm font-medium text-stone-700">Badge<select className={inputClass} name="badge" defaultValue={product?.badge || ""}><option value="">None</option><option value="new">New</option><option value="featured">Featured</option><option value="sale">Sale</option></select></label>
    </div></section>
    <section className="border-t border-stone-100 pt-6"><h2 className="mb-4 font-semibold text-stone-900">Pricing and inventory</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium text-stone-700">Price<input className={inputClass} name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ""}/></label>
      <label className="text-sm font-medium text-stone-700">MRP / old price<input className={inputClass} name="oldPrice" type="number" min="0" step="0.01" defaultValue={product?.oldPrice ?? ""}/></label>
      <label className="text-sm font-medium text-stone-700">Availability<select className={inputClass} name="availability" defaultValue={product?.availability || "in-stock"}><option value="in-stock">In stock</option><option value="low-stock">Low stock</option><option value="out-of-stock">Out of stock</option></select></label>
      <label className="text-sm font-medium text-stone-700">Currency<input className={inputClass} name="currency" maxLength={3} defaultValue={product?.currency || "INR"}/></label>
    </div></section>
    <section className="border-t border-stone-100 pt-6"><h2 className="mb-4 font-semibold text-stone-900">Description and media</h2><div className="space-y-5">
      <label className="block text-sm font-medium text-stone-700">Short description<textarea className={`${inputClass} min-h-20 py-3`} name="shortDescription" defaultValue={product?.shortDescription || ""}/></label>
      <label className="block text-sm font-medium text-stone-700">Full description<textarea className={`${inputClass} min-h-36 py-3`} name="description" defaultValue={product?.description || ""}/></label>
      <div className="block text-sm font-medium text-stone-700">
        <span className="block mb-2">Product Images</span>
        <ProductImagesUpload name="images" defaultValue={imageUrls(product)} />
        <p className="mt-2 text-xs font-normal text-stone-400">Upload a Hover Image below to control the shop-grid hover swap directly, or leave it empty to fall back to the 2nd image above.</p>
      </div>
      <div className="grid grid-cols-2 gap-5 sm:max-w-sm">
        <MediaUpload name="hoverImage" label="Hover Image" defaultValue={product?.hoverImage || ""} folder="khadeeja/products" aspectClassName="aspect-9/16" />
        <MediaUpload name="video" label="Video" defaultValue={product?.video || ""} folder="khadeeja/products" aspectClassName="aspect-9/16" />
      </div>
    </div></section>
    <section className="border-t border-stone-100 pt-6"><h2 className="mb-4 font-semibold text-stone-900">Options and SEO</h2><div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-stone-700">Sizes <span className="font-normal text-stone-400">(comma separated)</span><input className={inputClass} name="sizes" defaultValue={(product?.sizes || []).join(", ")}/></label>
      <label className="text-sm font-medium text-stone-700">Tags <span className="font-normal text-stone-400">(comma separated)</span><input className={inputClass} name="tags" defaultValue={(product?.tags || []).join(", ")}/></label>
      <label className="text-sm font-medium text-stone-700">SEO title<input className={inputClass} name="seoTitle" defaultValue={product?.seo?.title || ""}/></label>
      <label className="text-sm font-medium text-stone-700">SEO keywords<input className={inputClass} name="seoKeywords" defaultValue={(product?.seo?.keywords || []).join(", ")}/></label>
      <label className="sm:col-span-2 text-sm font-medium text-stone-700">SEO description<textarea className={`${inputClass} min-h-20 py-3`} name="seoDescription" defaultValue={product?.seo?.description || ""}/></label>
    </div><div className="mt-5 flex flex-wrap gap-6"><label className="flex items-center gap-2 text-sm font-medium text-stone-700"><input className="h-4 w-4 accent-[#9c5247]" name="active" type="checkbox" defaultChecked={product?.active !== false}/>Active</label><label className="flex items-center gap-2 text-sm font-medium text-stone-700"><input className="h-4 w-4 accent-[#9c5247]" name="featured" type="checkbox" defaultChecked={product?.featured === true}/>Featured</label></div></section>
    <div className="flex justify-end gap-3 border-t border-stone-100 pt-5"><Link href="/admin/products" className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 text-sm font-semibold text-stone-700">Cancel</Link><button className="min-h-11 rounded-lg bg-[#9c5247] px-5 text-sm font-semibold text-white hover:bg-[#7e3f35] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isPending}>{isPending ? "Saving…" : product ? "Save changes" : "Create product"}</button></div>
  </form>;
}
