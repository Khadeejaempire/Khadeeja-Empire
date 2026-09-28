import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import { AdminCard } from "../../_components/AdminPage";
import { CategoryForm } from "../../_components/CategoryForm";

export default async function NewCategoryPage() {
  const categories = await getDataProvider().listCategories();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Breadcrumbs & Title */}
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
          <span className="font-semibold text-stone-800">New Category</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
            <FolderPlus className="h-4 w-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
            Create Category
          </h1>
        </div>
        <p className="text-xs text-stone-500">
          Add a new collection or subcategory to structure the storefront catalog.
        </p>
      </div>

      {/* Main Form Card */}
      <AdminCard className="p-5 sm:p-7 shadow-2xs border border-stone-200/90 rounded-2xl bg-white">
        <CategoryForm categories={categories} />
      </AdminCard>
    </div>
  );
}
