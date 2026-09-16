import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { getDataProvider } from "@/lib/data";
import { ClearPaidCart } from "./ClearPaidCart";

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ order?: string; error?: string }> }) {
  const query = await searchParams;
  if (query.error || !query.order) {
    return <Result title="We could not verify that payment" copy="Your cart is unchanged. Please return to checkout and try again." />;
  }
  const [customer, order] = await Promise.all([getCurrentCustomer(), getDataProvider().getOrder(query.order)]);
  if (!customer || !order || order.customerId !== customer.id) notFound();
  if (order.paymentStatus === "paid") {
    return <><ClearPaidCart /><Result title="Payment successful" copy={`Order #${order.orderNumber} is confirmed and paid.`} /></>;
  }
  if (order.paymentStatus === "failed") {
    return <Result title="Payment failed" copy="No payment was confirmed. Your cart is unchanged, so you can try again." />;
  }
  return <Result title="Payment is being verified" copy="We have not received final confirmation yet. Refresh this page shortly or check your orders." />;
}

function Result({ title, copy }: { title: string; copy: string }) {
  return <main className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="font-display text-4xl text-ink">{title}</h1><p className="mt-4 text-muted">{copy}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="inline-flex min-h-11 items-center justify-center bg-[#2a2420] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] !text-white transition-colors hover:bg-primary" style={{ color: "#ffffff" }} href="/checkout">Return to checkout</Link><Link className="inline-flex min-h-11 items-center justify-center border border-[#2a2420] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-[#2a2420] hover:!text-white" href="/account/orders">View orders</Link></div></main>;
}
