import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import { AdminCard } from "../../../_components/AdminPage";
import { ProductForm } from "../../../_components/ProductForm";
import { ProductOptionsEditor } from "../../../_components/ProductOptionsEditor";
import { ProductInformationEditor } from "../../../_components/ProductInformationEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const provider = getDataProvider();
  const [product, categories] = await Promise.all([
    provider.getProduct(id),
    provider.listCategories(),
  ]);

  if (!product) notFound();

  const info = product.information;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Breadcrumbs & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 font-medium text-stone-600 transition hover:text-[#9c5247]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>
            <span>/</span>
            <span className="font-semibold text-stone-800 line-clamp-1 max-w-[260px] sm:max-w-md">
              {product.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Edit Product
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                product.active
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-stone-100 text-stone-600 border border-stone-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.active ? "bg-emerald-500" : "bg-stone-400"
                }`}
              />
              {product.active ? "Published" : "Draft"}
            </span>
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {product.slug && (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              View on Storefront
            </Link>
          )}
        </div>
      </div>

      {/* Main Core Form Card */}
      <AdminCard className="p-5 sm:p-7 shadow-sm border border-stone-200/80 rounded-2xl bg-white">
        <ProductForm product={product} categories={categories} />
      </AdminCard>

      {/* Colourways & Variant Options Card */}
      <AdminCard className="p-5 sm:p-7 shadow-sm border border-stone-200/80 rounded-2xl bg-white">
        <ProductOptionsEditor
          productId={product.id}
          colors={product.colors || []}
          variants={product.variants || []}
        />
      </AdminCard>

      {/* Garment Specifications & Care Card */}
      <AdminCard className="p-5 sm:p-7 shadow-sm border border-stone-200/80 rounded-2xl bg-white">
        <ProductInformationEditor info={info} productId={product.id} />
      </AdminCard>
    </div>
  );
}
