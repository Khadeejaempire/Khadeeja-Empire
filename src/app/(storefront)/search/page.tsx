import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { getDataProvider } from "@/lib/data";
import { attachProductRatings, toStorefrontProduct } from "@/lib/storefront/adapters";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const provider = getDataProvider();
  const records = query ? await provider.listProducts({ search: query, active: true }) : [];
  const reviews = query ? await provider.listReviews() : [];
  const results = attachProductRatings(records.map(toStorefrontProduct), reviews);

  return (
    <div className="min-h-[85vh] bg-bg flex flex-col">
      {/* Search Header Area */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto w-full">
          <h1 className="mb-3 text-5xl md:text-7xl font-display text-ink tracking-tight transition-all duration-500">
            Search
          </h1>
          
          <p className="mb-12 text-muted text-base md:text-lg tracking-wide">
            {query
              ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`
              : "Search for products by name, category, or tag."}
          </p>
          
          <form action="/search" method="get" className="relative group">
            <div className="flex items-end border-b-2 border-border group-focus-within:border-ink transition-colors pb-2">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Type to search..."
                aria-label="Search products"
                className="flex-1 bg-transparent text-xl md:text-3xl font-display text-ink outline-none placeholder:text-muted/40 pb-1"
                autoFocus
              />
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-semibold tracking-widest uppercase text-ink transition-all hover:text-primary"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Search Results Area */}
      <section className="flex-1 bg-white pt-16 pb-24 md:pt-20 md:pb-32 px-4 sm:px-6 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.05)]">
        <Container>
          {query && results.length === 0 ? (
            <div className="py-20 md:py-32 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 mb-8 rounded-full bg-surface flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <h2 className="mb-4 text-3xl md:text-4xl font-display text-ink">No products found</h2>
              <p className="text-muted text-base md:text-lg max-w-md mx-auto leading-relaxed">
                We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try a different search term or explore our collections.
              </p>
            </div>
          ) : null}

          {results.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
              <ProductGrid products={results} columns={4} />
            </div>
          ) : null}
        </Container>
      </section>
    </div>
  );
}
