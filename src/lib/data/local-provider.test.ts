import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataProviderError } from "../admin/errors";

vi.mock("server-only", () => ({}));

import { createLocalProvider } from "./local-provider";

const temporaryDirectories: string[] = [];

async function createTestFilePath() {
  const directory = await mkdtemp(join(tmpdir(), "khadeeja-admin-"));
  temporaryDirectories.push(directory);
  return join(directory, "admin.json");
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("local data provider", () => {
  it("seeds current Khadeeja content and persists catalog mutations", async () => {
    const filePath = await createTestFilePath();
    const firstProvider = createLocalProvider({ filePath });
    const seededProducts = await firstProvider.listProducts();

    expect(seededProducts.length).toBeGreaterThan(0);
    expect(seededProducts.every((product) => product.id.startsWith("p-"))).toBe(true);

    const created = await firstProvider.createProduct({
      name: "Test Kurti",
      slug: "test-kurti",
      price: 1500,
      currency: "INR",
      images: ["/assets/images/test-kurti.jpg"],
    });
    await firstProvider.updateProduct(created.id, { name: "Updated Kurti" });

    const secondProvider = createLocalProvider({ filePath });
    await expect(secondProvider.getProduct("test-kurti")).resolves.toMatchObject({
      id: created.id,
      name: "Updated Kurti",
      images: [expect.objectContaining({ url: "/assets/images/test-kurti.jpg" })],
    });

    const raw = await readFile(filePath, "utf8");
    expect(JSON.parse(raw).products).toEqual(expect.any(Array));
  });

  it("surfaces invalid local data instead of silently reseeding", async () => {
    const filePath = await createTestFilePath();
    await writeFile(filePath, "not-json", "utf8");

    await expect(createLocalProvider({ filePath }).listProducts()).rejects.toBeInstanceOf(
      DataProviderError
    );
  });

  it("serializes mutations across provider instances sharing one file", async () => {
    const filePath = await createTestFilePath();
    const firstProvider = createLocalProvider({ filePath });
    const secondProvider = createLocalProvider({ filePath });

    await firstProvider.listProducts();
    await Promise.all([
      firstProvider.updateProduct("p-kurti-01", { description: "First concurrent update" }),
      secondProvider.updateProduct("p-kurti-01", { price: 1111 }),
    ]);

    await expect(firstProvider.getProduct("p-kurti-01")).resolves.toMatchObject({
      description: "First concurrent update",
      price: 1111,
    });
  });

  it("rejects corrupt entity records instead of casting them through", async () => {
    const filePath = await createTestFilePath();
    const provider = createLocalProvider({ filePath });
    await provider.listProducts();

    const raw = JSON.parse(await readFile(filePath, "utf8")) as { products: unknown[] };
    raw.products = [{ id: "p-corrupt", slug: 42 }];
    await writeFile(filePath, `${JSON.stringify(raw)}\n`, "utf8");

    await expect(provider.listProducts()).rejects.toMatchObject({ code: "storage" });
  });

  it("supports discovery menu CRUD and ordering", async () => {
    const filePath = await createTestFilePath();
    const provider = createLocalProvider({ filePath });
    const first = await provider.createDiscoveryMenuEntry({ label: "Shop", href: "/shop" });
    const second = await provider.createDiscoveryMenuEntry({ label: "Story", href: "/about" });

    await provider.reorderDiscoveryMenuEntries([second.id, first.id]);
    await expect(provider.listDiscoveryMenuEntries()).resolves.toMatchObject([
      { id: second.id, sortOrder: 0 },
      { id: first.id, sortOrder: 1 },
    ]);

    await provider.updateDiscoveryMenuEntry(first.id, { label: "Collections" });
    await provider.deleteDiscoveryMenuEntry(second.id);
    await expect(provider.listDiscoveryMenuEntries()).resolves.toMatchObject([
      { id: first.id, label: "Collections" },
    ]);
  });

  it("applies PayU success once and never downgrades it", async () => {
    const provider = createLocalProvider({ filePath: await createTestFilePath() });
    const coupon = await provider.createCoupon({
      code: "PAYU10", discountType: "fixed", discountValue: 10, active: true,
    });
    const order = await provider.createOrder({
      orderNumber: "KE-PAYU-1", status: "pending", paymentStatus: "pending", paymentMethod: "payu",
      currency: "INR", subtotal: 100, shipping: 0, discount: 10, total: 90, couponCode: coupon.code, items: [],
    });
    await provider.createPaymentAttempt({
      orderId: order.id, provider: "payu", transactionId: "KE-PAYU-1", status: "created",
      amount: 90, currency: "INR", productInfo: "Order KE-PAYU-1", customerName: "Buyer",
      customerEmail: "buyer@example.com", customerPhone: "9999999999",
      couponId: coupon.id,
    });

    await provider.applyVerifiedPaymentResult({ transactionId: "KE-PAYU-1", status: "paid", providerPaymentId: "PAYU-1" });
    await provider.applyVerifiedPaymentResult({ transactionId: "KE-PAYU-1", status: "paid", providerPaymentId: "PAYU-1" });
    await provider.applyVerifiedPaymentResult({ transactionId: "KE-PAYU-1", status: "failed", failureMessage: "late failure" });

    await expect(provider.getOrder(order.id)).resolves.toMatchObject({ status: "confirmed", paymentStatus: "paid" });
    await expect(provider.getPaymentAttemptByTransactionId("KE-PAYU-1")).resolves.toMatchObject({ status: "paid", providerPaymentId: "PAYU-1" });
    expect((await provider.listCoupons({ search: "PAYU10" }))[0].usedCount).toBe(1);
  });

  it("filters orders by status and payment status", async () => {
    const provider = createLocalProvider({ filePath: await createTestFilePath() });
    const pending = await provider.createOrder({
      orderNumber: "KE-FILTER-1", status: "pending", paymentStatus: "pending",
      currency: "INR", subtotal: 100, shipping: 0, discount: 0, total: 100, items: [],
    });
    const shipped = await provider.createOrder({
      orderNumber: "KE-FILTER-2", status: "shipped", paymentStatus: "paid",
      currency: "INR", subtotal: 100, shipping: 0, discount: 0, total: 100, items: [],
    });

    const all = await provider.listOrders();
    expect(all.map((order) => order.id)).toEqual(expect.arrayContaining([pending.id, shipped.id]));

    const byStatus = await provider.listOrders({ status: "shipped" });
    expect(byStatus.map((order) => order.id)).toContain(shipped.id);
    expect(byStatus.every((order) => order.status === "shipped")).toBe(true);

    const byPayment = await provider.listOrders({ paymentStatus: "pending" });
    expect(byPayment.map((order) => order.id)).toContain(pending.id);
    expect(byPayment.every((order) => order.paymentStatus === "pending")).toBe(true);

    const combined = await provider.listOrders({ status: "shipped", paymentStatus: "pending" });
    expect(combined.every((order) => order.status === "shipped" && order.paymentStatus === "pending")).toBe(true);
    expect(combined.map((order) => order.id)).not.toContain(shipped.id);
  });

  it("updates order payment status without disturbing other fields", async () => {
    const provider = createLocalProvider({ filePath: await createTestFilePath() });
    const order = await provider.createOrder({
      orderNumber: "KE-PAYSTATUS-1", status: "pending", paymentStatus: "pending",
      currency: "INR", subtotal: 250, shipping: 0, discount: 0, total: 250, items: [],
    });

    await expect(provider.updateOrderPaymentStatus(order.id, "paid")).resolves.toMatchObject({
      id: order.id,
      orderNumber: "KE-PAYSTATUS-1",
      paymentStatus: "paid",
      status: "pending",
      total: 250,
    });
    await expect(provider.getOrder(order.id)).resolves.toMatchObject({
      paymentStatus: "paid",
      status: "pending",
    });
  });
});
