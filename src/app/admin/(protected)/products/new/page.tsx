import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import { AdminCard } from "../../_components/AdminPage";
import { ProductForm } from "../../_components/ProductForm";

export default async function NewProductPage() {
  const categories = await getDataProvider().listCategories();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Breadcrumbs & Title */}
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
          <span className="font-semibold text-stone-800">Add New Product</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9c5247]/10 text-[#9c5247]">
            <PlusCircle className="h-4 w-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Create Product
          </h1>
        </div>
        <p className="text-xs text-stone-500">
          Add an exquisite handcrafted item to the Khadeeja Empire catalog with pricing, images, and SEO tags.
        </p>
      </div>

      {/* Main Form Card */}
      <AdminCard className="p-5 sm:p-7 shadow-sm border border-stone-200/80 rounded-2xl bg-white">
        <ProductForm categories={categories} />
      </AdminCard>
    </div>
  );
}
