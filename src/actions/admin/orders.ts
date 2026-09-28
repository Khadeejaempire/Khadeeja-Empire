"use server";

import { DataProviderError, NotFoundError } from "@/lib/admin/errors";
import { orderPaymentStatusUpdateSchema, orderStatusUpdateSchema } from "@/lib/admin/schemas";
import { getDataProvider } from "@/lib/data";
import {
  fulfillWithShiprocket,
  shouldApplyMappedStatus,
  syncShiprocketTracking,
  type ShiprocketDimensions,
} from "@/lib/shiprocket/fulfill";
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
  return adminMutation(async () => {
    const provider = getDataProvider();
    const order = await provider.getOrder(parseId(id));
    if (!order) throw new NotFoundError("Order");
    if (order.shiprocketOrderId) {
      // Idempotent: already pushed — report what we have instead of creating a duplicate shipment.
      return {
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId ?? null,
      };
    }
    const items = order.items?.length ? order.items : await provider.listOrderItems(order.id);
    const customer = order.customerId ? await provider.getCustomer(order.customerId) : null;
    try {
      const result = await fulfillWithShiprocket({ ...order, items }, { email: customer?.email, phone: customer?.phone }, dimensions);
      const updated = await provider.updateOrderShipment(order.id, {
        shiprocketOrderId: String(result.orderId),
        shiprocketShipmentId: String(result.shipmentId),
        shiprocketStatus: "NEW",
      });
      return { shiprocketOrderId: updated.shiprocketOrderId ?? null, shiprocketShipmentId: updated.shiprocketShipmentId ?? null };
    } catch (error) {
      throw new DataProviderError("unknown", error instanceof Error ? error.message : "Shiprocket could not create the shipment.");
    }
  }, [...paths, `/admin/orders/${id}`]);
}

async function syncShiprocketStatusMutation(id: string) {
  return adminMutation(async () => {
    const provider = getDataProvider();
    const order = await provider.getOrder(parseId(id));
    if (!order) throw new NotFoundError("Order");
    if (!order.shiprocketOrderId && !order.awbCode) {
      throw new DataProviderError("unknown", "This order has not been pushed to Shiprocket yet.");
    }
    try {
      const tracked = await syncShiprocketTracking({ shiprocketOrderId: order.shiprocketOrderId, awbCode: order.awbCode });
      const now = new Date().toISOString();
      const applyStatus = tracked.mappedStatus ? shouldApplyMappedStatus(order.status, tracked.mappedStatus) : false;
      await provider.updateOrderShipment(order.id, {
        awbCode: tracked.awbCode ?? order.awbCode,
        courierName: tracked.courierName ?? order.courierName,
        shiprocketStatus: tracked.shiprocketStatus ?? order.shiprocketStatus,
        shippedAt: applyStatus && tracked.mappedStatus === "shipped" ? order.shippedAt ?? now : order.shippedAt,
        deliveredAt: applyStatus && tracked.mappedStatus === "delivered" ? now : order.deliveredAt,
      });
      if (applyStatus && tracked.mappedStatus) await provider.updateOrderStatus(order.id, tracked.mappedStatus);
      return {
        shiprocketStatus: tracked.shiprocketStatus,
        awbCode: tracked.awbCode,
        courierName: tracked.courierName,
        currentLocation: tracked.currentLocation,
        scans: tracked.scans,
      };
    } catch (error) {
      throw new DataProviderError("unknown", error instanceof Error ? error.message : "Failed to sync status from Shiprocket.");
    }
  }, [...paths, `/admin/orders/${id}`]);
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await finishFormAction(updateOrderStatusMutation(String(formData.get("id") ?? ""), formData));
}

export async function deleteOrderAction(formData: FormData): Promise<void> {
  await finishFormAction(deleteOrderMutation(String(formData.get("id") ?? "")));
}

export async function pushOrderToShiprocketAction(formData: FormData) {
  const dimensions = {
    weight: dimension(formData, "weight"),
    length: dimension(formData, "length"),
    breadth: dimension(formData, "breadth"),
    height: dimension(formData, "height"),
  };
  return pushOrderToShiprocketMutation(String(formData.get("id") ?? ""), dimensions);
}

export async function syncShiprocketStatusAction(orderId: string) {
  return syncShiprocketStatusMutation(orderId);
}

export async function updateOrderPaymentStatusAction(formData: FormData): Promise<void> {
  await finishFormAction(updateOrderPaymentStatusMutation(String(formData.get("id") ?? ""), formData));
}
