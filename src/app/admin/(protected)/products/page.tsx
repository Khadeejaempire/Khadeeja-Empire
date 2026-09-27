import { getDataProvider } from "@/lib/data";
import { AdminCard, EmptyState, PageHeading, StatusBadge, formatCurrency, tableCell, tableHead } from "../_components/AdminPage";
import { ProductRowActions } from "../_components/ProductRowActions";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await getDataProvider().listProducts({ search: q });
  return <div><PageHeading title="Products" description="Manage catalog details, pricing, media and availability." action={{ href: "/admin/products/new", label: "Add product" }}/>
    <form className="mb-4 flex max-w-md gap-2"><input aria-label="Search products" className="min-h-10 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-sm" name="q" defaultValue={q || ""} placeholder="Search products..."/><button className="rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold">Search</button></form>
    <AdminCard>{products.length === 0 ? <EmptyState title="No products found" detail="Add a product or adjust your search."/> : <div className="overflow-x-auto"><table className="w-full"><thead className="bg-stone-50"><tr><th className={tableHead}>Product</th><th className={tableHead}>Category</th><th className={tableHead}>Price</th><th className={tableHead}>Stock</th><th className={tableHead}>Status</th><th className={tableHead}>Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{products.map((product) => <tr key={product.id} className="hover:bg-stone-50/70"><td className={tableCell}><p className="font-semibold text-stone-900">{product.name}</p><p className="text-xs text-stone-400">/{product.slug}{product.sku ? ` · SKU: ${product.sku}` : ""}{product.featured ? " · Featured" : ""}</p></td><td className={tableCell}>{product.category?.name || product.categorySlug || "—"}</td><td className={tableCell}>{formatCurrency(product.price || 0, product.currency || "INR")}</td><td className={tableCell}><StatusBadge value={product.availability || "in-stock"}/></td><td className={tableCell}><StatusBadge value={product.active !== false}/></td><td className={`${tableCell} whitespace-nowrap`}><ProductRowActions id={product.id} active={product.active !== false}/></td></tr>)}</tbody></table></div>}</AdminCard>
  </div>;
}

