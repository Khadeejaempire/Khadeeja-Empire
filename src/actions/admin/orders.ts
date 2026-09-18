"use server";

import { DataProviderError, NotFoundError } from "@/lib/admin/errors";
import { orderPaymentStatusUpdateSchema, orderStatusUpdateSchema } from "@/lib/admin/schemas";
import { getDataProvider } from "@/lib/data";
import { fulfillWithShiprocket, type ShiprocketDimensions } from "@/lib/shiprocket/fulfill";
import { adminMutation, finishFormAction, inputObject, noData, parseId } from "./common";

const paths = ["/admin", "/admin/orders"];

async function updateOrderStatusMutation(id: string, input: unknown) {
  return adminMutation(async () => {
    const orderId = parseId(id);
    const { status } = orderStatusUpdateSchema.parse(inputObject(input));
    return getDataProvider().updateOrderStatus(orderId, status);
  }, [...paths, `/admin/orders/${id}`]);
}

async function deleteOrderMutation(id: string) {
  return noData(await adminMutation(async () => getDataProvider().deleteOrder(parseId(id)), paths));
}

async function updateOrderPaymentStatusMutation(id: string, input: unknown) {
  return adminMutation(async () => {
    const orderId = parseId(id);
    const { paymentStatus } = orderPaymentStatusUpdateSchema.parse(inputObject(input));
    return getDataProvider().updateOrderPaymentStatus(orderId, paymentStatus);
  }, [...paths, `/admin/orders/${id}`]);
}

function dimension(formData: FormData, key: string): number | undefined {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function pushOrderToShiprocketMutation(id: string, dimensions: ShiprocketDimensions) {
  return noData(await adminMutation(async () => {
    const provider = getDataProvider();
    const order = await provider.getOrder(parseId(id));
    if (!order) throw new NotFoundError("Order");
    const items = order.items?.length ? order.items : await provider.listOrderItems(order.id);
    const customer = order.customerId ? await provider.getCustomer(order.customerId) : null;
    try {
      await fulfillWithShiprocket({ ...order, items }, { email: customer?.email, phone: customer?.phone }, dimensions);
    } catch (error) {
      throw new DataProviderError("unknown", error instanceof Error ? error.message : "Shiprocket could not create the shipment.");
    }
  }, [...paths, `/admin/orders/${id}`]));
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await finishFormAction(updateOrderStatusMutation(String(formData.get("id") ?? ""), formData));
}

export async function deleteOrderAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteOrderMutation(String(formData.get("id") ?? "")));
}

export async function pushOrderToShiprocketAction(formData: FormData): Promise<void> {
  const dimensions = {
    weight: dimension(formData, "weight"),
    length: dimension(formData, "length"),
    breadth: dimension(formData, "breadth"),
    height: dimension(formData, "height"),
  };
  await finishFormAction(pushOrderToShiprocketMutation(String(formData.get("id") ?? ""), dimensions));
}

export async function updateOrderPaymentStatusAction(formData: FormData): Promise<void> {
  await finishFormAction(updateOrderPaymentStatusMutation(String(formData.get("id") ?? ""), formData));
}
