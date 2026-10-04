import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowLeft, PackageSearch } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { getDataProvider } from "@/lib/data";
import { attachProductRatings, toStorefrontProduct } from "@/lib/storefront/adapters";

export const metadata: Metadata = { title: "Search Results | Khadeeja Empire" };
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
    <div className="min-h-[80vh] bg-surface/50 pb-20">
      {/* ──────────────────────────────────────────────────────────────
          COMPACT LUXURY SEARCH HEADER (Breadcrumb + Title + Quick Refine)
          ────────────────────────────────────────────────────────────── */}
      <section className="pt-8 pb-6 md:pt-10 md:pb-8 border-b border-border/60 bg-surface">
        <Container className="max-w-[1460px]">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-xs text-muted">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-ink font-medium">Search</li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display text-ink tracking-tight mb-2">
                {query ? (
                  <>
                    Results for &ldquo;<span className="text-primary">{query}</span>&rdquo;
                  </>
                ) : (
                  "Explore Our Creations"
                )}
              </h1>
              <p className="text-xs md:text-sm text-muted">
                {query ? (
                  <>
                    Found <span className="font-semibold text-ink">{results.length}</span>{" "}
                    handcrafted {results.length === 1 ? "creation" : "creations"}
                  </>
                ) : (
                  "Enter a keyword to discover handwoven Banarasi sarees, silks, and motifs."
                )}
              </p>
            </div>

            {/* Quick in-page refine search input */}
            <form action="/search" method="get" className="w-full md:w-80">
              <div className="relative flex items-center">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Filter or new search..."
                  className="w-full h-10 pl-3.5 pr-9 bg-white border border-[#d8b88d]/50 focus:border-primary rounded-lg text-xs md:text-sm text-ink outline-none shadow-2xs transition-all"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute right-2 text-muted hover:text-primary transition-colors"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          SEARCH RESULTS GRID
          ────────────────────────────────────────────────────────────── */}
      <section className="pt-8 md:pt-12">
        <Container className="max-w-[1460px]">
          {query && results.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-white border border-border flex items-center justify-center text-muted mb-4 shadow-xs">
                <PackageSearch size={28} />
              </div>
              <h2 className="font-display text-2xl text-ink mb-2">No sarees found</h2>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                We couldn&apos;t find anything matching &ldquo;<span className="font-medium text-ink">{query}</span>&rdquo;. Try searching for &ldquo;Tissue&rdquo;, &ldquo;Dupion&rdquo;, or &ldquo;Banarasi Silk&rdquo;.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/collections/pure-dupion-silk-banarasi-saree"
                  className="px-4 py-2 rounded-full bg-white border border-border text-xs font-medium text-ink hover:text-primary hover:border-primary transition-all"
                >
                  Dupion Silk Sarees
                </Link>
                <Link
                  href="/collections/tissue-silk-sarees"
                  className="px-4 py-2 rounded-full bg-white border border-border text-xs font-medium text-ink hover:text-primary hover:border-primary transition-all"
                >
                  Tissue Silk Sarees
                </Link>
                <Link
                  href="/shop"
                  className="px-4 py-2 rounded-full bg-maroon text-white text-xs font-medium hover:bg-[#641b21] transition-all"
                >
                  Explore All Sarees
                </Link>
              </div>
            </div>
          ) : null}

          {results.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <ProductGrid products={results} columns={4} />
            </div>
          ) : null}
        </Container>
      </section>
    </div>
  );
}
