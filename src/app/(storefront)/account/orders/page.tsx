import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getDataProvider } from "@/lib/data";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { logout } from "../../login/actions";
import { OrdersList } from "./OrdersList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders",
};

export default async function AccountOrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/login?next=/account/orders");
  }

  const provider = getDataProvider();
  const orders = (await provider.listOrders())
    .filter((order) => order.customerId === customer.id)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-h1 text-ink">My Orders</h1>
            <p className="mt-2 text-sm text-muted">
              {customer.name ? `Welcome back, ${customer.name}.` : "Your order history."}
              {orders.length > 0 && ` You've placed ${orders.length} ${orders.length === 1 ? "order" : "orders"} with us.`}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg border border-[var(--color-border-strong)] text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)] hover:border-[var(--color-maroon)] hover:text-[var(--color-maroon)] transition-colors"
            >
              Logout
            </button>
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-white py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] text-muted">
              <Package size={28} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-ink">No orders yet</p>
              <p className="mt-1 text-sm text-muted">You haven&apos;t placed any orders yet — let&apos;s fix that.</p>
            </div>
            <Link
              href="/shop"
              className="mt-2 h-11 px-6 inline-flex items-center justify-center rounded-lg bg-[#2d2520] hover:bg-primary !text-white font-semibold tracking-widest text-xs uppercase transition-colors"
              style={{ color: "#ffffff" }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <OrdersList orders={orders} />
        )}
      </Container>
    </div>
  );
}
