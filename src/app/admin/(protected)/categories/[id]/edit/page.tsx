import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FolderTree } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import { AdminCard } from "../../../_components/AdminPage";
import { CategoryForm } from "../../../_components/CategoryForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const provider = getDataProvider();
  const [category, categories] = await Promise.all([
    provider.getCategory(id),
    provider.listCategories(),
  ]);

  if (!category) notFound();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Breadcrumbs & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1 font-medium text-stone-600 transition hover:text-[#9c5247]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Categories
            </Link>
            <span>/</span>
            <span className="font-semibold text-stone-800 line-clamp-1 max-w-[260px] sm:max-w-md">
              {category.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
              Edit Category
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                category.active !== false
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-stone-100 text-stone-600 border border-stone-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  category.active !== false ? "bg-emerald-500" : "bg-stone-400"
                }`}
              />
              {category.active !== false ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {category.slug && (
            <Link
              href={`/collections/${category.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs transition hover:border-stone-300 hover:bg-stone-50"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
              <span>View Collection</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Form Card */}
      <AdminCard className="p-5 sm:p-7 shadow-2xs border border-stone-200/90 rounded-2xl bg-white">
        <CategoryForm category={category} categories={categories} />
      </AdminCard>
    </div>
  );
}
