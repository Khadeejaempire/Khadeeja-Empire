"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminActionMessage } from "@/lib/admin/errors";

type StatusAction = (formData: FormData) => Promise<void>;

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const selectClass =
  "min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm capitalize disabled:opacity-60";

export function OrderStatusForm({
  id,
  status,
  paymentStatus,
  orderAction,
  paymentAction,
}: {
  id: string;
  status: string;
  paymentStatus?: string | null;
  orderAction: StatusAction;
  paymentAction: StatusAction;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderStatus, setOrderStatus] = useState(status);
  const [payment, setPayment] = useState(paymentStatus ?? "pending");

  const submit = (
    action: StatusAction,
    field: "status" | "paymentStatus",
    value: string,
    successMessage: string,
    fallback: string,
    onError: () => void
  ) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set(field, value);
        await action(formData);
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        onError();
        toast.error(adminActionMessage(error, fallback));
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="order-status" className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Order Status
        </label>
        <select
          id="order-status"
          value={orderStatus}
          disabled={isPending}
          onChange={(event) => {
            const next = event.target.value;
            const previous = orderStatus;
            setOrderStatus(next);
            submit(
              orderAction,
              "status",
              next,
              "Order status updated.",
              "Could not update the order status. Reload and check before retrying.",
              () => setOrderStatus(previous)
            );
          }}
          className={selectClass}
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 border-t border-stone-100 pt-4">
        <label htmlFor="payment-status" className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Payment Status
        </label>
        <select
          id="payment-status"
          value={payment}
          disabled={isPending}
          onChange={(event) => {
            const next = event.target.value;
            const previous = payment;
            setPayment(next);
            submit(
              paymentAction,
              "paymentStatus",
              next,
              "Payment status updated.",
              "Could not update the payment status. Reload and check before retrying.",
              () => setPayment(previous)
            );
          }}
          className={selectClass}
        >
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {isPending ? <p className="text-xs text-stone-400">Saving…</p> : null}
    </div>
  );
}
