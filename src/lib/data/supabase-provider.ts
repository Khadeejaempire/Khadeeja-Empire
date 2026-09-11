import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ConflictError, DataProviderError, NotFoundError } from "../admin/errors";
import type {
  AddressRecord,
  AdminDataState,
  AnnouncementMutationInput,
  AnnouncementRecord,
  CategoryMutationInput,
  CategoryRecord,
  CollectionMutationInput,
  CollectionRecord,
  CouponMutationInput,
  CouponRecord,
  CustomerMutationInput,
  CustomerRecord,
  DashboardMetrics,
  DiscoveryMenuEntryMutationInput,
  DiscoveryMenuEntryRecord,
  FaqMutationInput,
  FaqRecord,
  HeroSlideMutationInput,
  HeroSlideRecord,
  InquiryMutationInput,
  InquiryRecord,
  InstagramPostMutationInput,
  InstagramPostRecord,
  ListOptions,
  OrderItemRecord,
  OrderMutationInput,
  OrderRecord,
  OrderStatus,
  PaymentAttemptMutationInput,
  PaymentAttemptRecord,
  VerifiedPaymentResultInput,
  ProductColorRecord,
  ProductImageRecord,
  ProductInformationRecord,
  ProductMutationInput,
  ProductRecord,
  ProductVariantRecord,
  ProfileMutationInput,
  ProfileRecord,
  PromoSettingsMutationInput,
  PromoSettingsRecord,
  ReviewMutationInput,
  ReviewRecord,
  SettingRecord,
  ShippingRateMutationInput,
  ShippingRateRecord,
  SubscriberMutationInput,
  SubscriberRecord,
  TestimonialMutationInput,
  TestimonialRecord,
} from "../admin/types";
import type { DataProvider } from "./provider";

type Row = Record<string, unknown>;

const now = () => new Date().toISOString();

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformKeys(value: unknown, transform: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => transformKeys(item, transform));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [transform(key), transformKeys(item, transform)])
  );
}

function fromRow<T>(row: unknown): T {
  return transformKeys(row, snakeToCamel) as T;
}

function toRow(value: unknown): Row {
  const result = transformKeys(value, camelToSnake);
  if (!result || typeof result !== "object" || Array.isArray(result)) return {};
  return Object.fromEntries(Object.entries(result).filter(([, item]) => item !== undefined));
}

function without<T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...value } as T;
  for (const key of keys) delete copy[key];
  return copy as Omit<T, K>;
}

function searchable(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function applyList<T extends object>(records: T[], options: ListOptions | undefined, fields: (keyof T)[]): T[] {
  const search = options?.search?.trim().toLowerCase();
  let result = records.filter((record) => {
    const values = record as Row;
    if (options?.active !== undefined && values.active !== options.active) return false;
    if (!search) return true;
    return fields.some((field) => searchable(record[field]).includes(search));
  });
  if (options?.sortBy) {
    const direction = options.sortDirection === "desc" ? -1 : 1;
    result = [...result].sort((left, right) => {
      const a = searchable((left as Row)[options.sortBy!]);
      const b = searchable((right as Row)[options.sortBy!]);
      return a.localeCompare(b) * direction;
    });
  } else if (result.some((record) => "sortOrder" in record)) {
    result = [...result].sort(
      (left, right) => Number((left as Row).sortOrder ?? 0) - Number((right as Row).sortOrder ?? 0)
    );
  }
  const offset = options?.offset ?? 0;
  return result.slice(offset, options?.limit === undefined ? undefined : offset + options.limit);
}

function productRow(input: Partial<ProductMutationInput>): Row {
  return toRow(without(input, "images"));
}

function orderRow(input: OrderMutationInput | Partial<OrderRecord>): Row {
  return toRow(without(input, "items"));
}

export class SupabaseDataProvider implements DataProvider {
  constructor(readonly client: SupabaseClient) {}

  private translateError(error: unknown, fallback: string): never {
    console.error("Supabase Database Query Failure Details:", JSON.stringify(error, null, 2));
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === "23505") throw new ConflictError("That record already exists.");
    const msg = error && typeof error === "object" && "message" in error ? String(error.message) : null;
    throw new DataProviderError("query", msg || fallback);
  }

  private async listRows<T extends object>(table: string, options?: ListOptions, fields: (keyof T)[] = []): Promise<T[]> {
    const result = await this.client.from(table).select("*");
    if (result.error) this.translateError(result.error, `Could not read ${table}.`);
    const records = (result.data ?? []).map((row: unknown) => fromRow<T>(row));
    return applyList(records, options, fields);
  }

  private async getRow<T>(table: string, idOrSlug: string, hasSlug = false): Promise<T | null> {
    const byId = await this.client.from(table).select("*").eq("id", idOrSlug).maybeSingle();
    if (byId.error) this.translateError(byId.error, `Could not read ${table}.`);
    if (byId.data) return fromRow<T>(byId.data);
    if (!hasSlug) return null;

    const bySlug = await this.client.from(table).select("*").eq("slug", idOrSlug).maybeSingle();
    if (bySlug.error) this.translateError(bySlug.error, `Could not read ${table}.`);
    return bySlug.data ? fromRow<T>(bySlug.data) : null;
  }

  private async insertRow<T>(table: string, value: unknown, fallback: string): Promise<T> {
    const payload = toRow(value);
    const result = await this.client.from(table).insert(payload).select("*").single();
    if (result.error) {
      console.error("SQL INSERT FAILURE payload map:", JSON.stringify(payload, null, 2));
      console.error("SQL INSERT FAILURE database error details:", JSON.stringify(result.error, null, 2));
      this.translateError(result.error, fallback);
    }
    return fromRow<T>(result.data);
  }

  private async updateRow<T>(table: string, recordId: string, value: unknown, fallback: string): Promise<T> {
    const result = await this.client.from(table).update(toRow(value)).eq("id", recordId).select("*").maybeSingle();
    if (result.error) {
      const code = result.error && typeof result.error === "object" && "code" in result.error ? result.error.code : undefined;
      if (code === "PGRST116") throw new NotFoundError(table);
      this.translateError(result.error, fallback);
    }
    if (!result.data) throw new NotFoundError(table);
    return fromRow<T>(result.data);
  }

  private async deleteRow(table: string, recordId: string, fallback: string): Promise<void> {
    const result = await this.client.from(table).delete().eq("id", recordId).select("id");
    if (result.error) {
      const code = result.error && typeof result.error === "object" && "code" in result.error ? result.error.code : undefined;
      if (code === "PGRST116") throw new NotFoundError(table);
      this.translateError(result.error, fallback);
    }
    if (!Array.isArray(result.data) || result.data.length === 0) {
      throw new NotFoundError(table);
    }
  }

  private async hydrateProduct(product: ProductRecord): Promise<ProductRecord> {
    const [images, colors, variants, information] = await Promise.all([
      this.listProductImages(product.id),
      this.listProductColors(product.id),
      this.listProductVariants(product.id),
      this.getProductInformation(product.id),
    ]);
    return { ...product, images, colors, variants, information };
  }

  private async hydrateOrder(order: OrderRecord): Promise<OrderRecord> {
    return { ...order, items: await this.listOrderItems(order.id) };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [products, orders, customers, subscribers, reviews, inquiries] = await Promise.all([
      this.listRows<ProductRecord>("products"),
      this.listRows<OrderRecord>("orders"),
      this.listRows<CustomerRecord>("customers"),
      this.listRows<SubscriberRecord>("subscribers"),
      this.listRows<ReviewRecord>("reviews"),
      this.listRows<InquiryRecord>("inquiries"),
    ]);
    const recentOrders = orders
      .slice()
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 10)
      .map((order) => this.hydrateOrder(order));
    return {
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.active !== false).length,
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      totalCustomers: customers.length,
      totalRevenue: orders
        .filter((order) => order.paymentStatus === "paid" || order.paymentStatus === undefined)
        .reduce((total, order) => total + order.total, 0),
      totalSubscribers: subscribers.length,
      pendingReviews: reviews.filter((review) => review.status === "pending").length,
      unreadInquiries: inquiries.filter((inquiry) => inquiry.status === "unread").length,
      recentOrders: await Promise.all(recentOrders),
    };
  }

  async listProducts(options?: ListOptions): Promise<ProductRecord[]> {
    const products = await this.listRows<ProductRecord>("products", options, ["name", "slug", "description"]);
    return Promise.all(products.map((product) => this.hydrateProduct(product)));
  }

  getProducts(options?: ListOptions) {
    return this.listProducts(options);
  }

  async getProduct(idOrSlug: string): Promise<ProductRecord | null> {
    const product = await this.getRow<ProductRecord>("products", idOrSlug, true);
    return product ? this.hydrateProduct(product) : null;
  }

  async createProduct(input: ProductMutationInput): Promise<ProductRecord> {
    const product = await this.insertRow<ProductRecord>("products", productRow(input), "Could not create product.");
    for (const [sortOrder, image] of (input.images ?? []).entries()) {
      await this.createProductImage(
        typeof image === "string"
          ? { productId: product.id, url: image, sortOrder }
          : { ...without(image, "id"), sortOrder }
      );
    }
    return (await this.getProduct(product.id))!;
  }

  async updateProduct(productId: string, input: Partial<ProductMutationInput>): Promise<ProductRecord> {
    const { images, ...changes } = input;
    await this.updateRow<ProductRecord>("products", productId, productRow(changes), "Could not update product.");
    if (images != null) {
      const existing = await this.listProductImages(productId);
      await Promise.all(existing.map((image) => this.deleteProductImage(image.id)));
      for (const [sortOrder, image] of images.entries()) {
        await this.createProductImage(
          typeof image === "string" ? { productId, url: image, sortOrder } : { ...without(image, "id"), sortOrder }
        );
      }
    }
    const product = await this.getProduct(productId);
    if (!product) throw new NotFoundError("Product");
    return product;
  }

  async deleteProduct(productId: string): Promise<void> {
    const [images, colors, variants] = await Promise.all([
      this.listProductImages(productId),
      this.listProductColors(productId),
      this.listProductVariants(productId),
    ]);
    await Promise.all([
      ...images.map((image) => this.deleteProductImage(image.id)),
      ...colors.map((color) => this.deleteProductColor(color.id)),
      ...variants.map((variant) => this.deleteProductVariant(variant.id)),
    ]);
    await this.deleteRow("products", productId, "Could not delete product.");
  }

  setProductActive(productId: string, active: boolean) {
    return this.updateProduct(productId, { active });
  }

  async listCategories(options?: ListOptions): Promise<CategoryRecord[]> {
    const [categories, products] = await Promise.all([
      this.listRows<CategoryRecord>("categories", options, ["name", "slug", "description"]),
      this.listRows<ProductRecord>("products"),
    ]);
    return categories.map((category) => ({
      ...category,
      productCount: products.filter((product) => product.categoryId === category.id || product.categorySlug === category.slug).length,
    }));
  }

  getCategories(options?: ListOptions) {
    return this.listCategories(options);
  }

  getCategory(idOrSlug: string) {
    return this.getRow<CategoryRecord>("categories", idOrSlug, true);
  }

  createCategory(input: CategoryMutationInput) {
    return this.insertRow<CategoryRecord>("categories", input, "Could not create category.");
  }

  updateCategory(categoryId: string, input: Partial<CategoryMutationInput>) {
    return this.updateRow<CategoryRecord>("categories", categoryId, input, "Could not update category.");
  }

  deleteCategory(categoryId: string) {
    return this.deleteRow("categories", categoryId, "Could not delete category.");
  }

  updateCategoryActive(categoryId: string, active: boolean) {
    return this.updateCategory(categoryId, { active });
  }

  async setCategoryActive(categoryId: string, active: boolean): Promise<CategoryRecord> {
    return this.updateCategory(categoryId, { active });
  }

  listCollections(options?: ListOptions) {
    return this.listRows<CollectionRecord>("collections", options, ["name", "slug", "description"]);
  }

  getCollection(idOrSlug: string) {
    return this.getRow<CollectionRecord>("collections", idOrSlug, true);
  }

  createCollection(input: CollectionMutationInput) {
    return this.insertRow<CollectionRecord>("collections", input, "Could not create collection.");
  }

  updateCollection(collectionId: string, input: Partial<CollectionMutationInput>) {
    return this.updateRow<CollectionRecord>("collections", collectionId, input, "Could not update collection.");
  }

  deleteCollection(collectionId: string) {
    return this.deleteRow("collections", collectionId, "Could not delete collection.");
  }

  listProductColors(productId?: string) {
    return this.listRows<ProductColorRecord>("product_colors").then((colors) =>
      productId ? colors.filter((color) => color.productId === productId) : colors
    );
  }

  createProductColor(input: Omit<ProductColorRecord, "id">) {
    return this.insertRow<ProductColorRecord>("product_colors", input, "Could not create product color.");
  }

  updateProductColor(colorId: string, input: Partial<Omit<ProductColorRecord, "id">>) {
    return this.updateRow<ProductColorRecord>("product_colors", colorId, input, "Could not update product color.");
  }

  deleteProductColor(colorId: string) {
    return this.deleteRow("product_colors", colorId, "Could not delete product color.");
  }

  listProductVariants(productId?: string) {
    return this.listRows<ProductVariantRecord>("product_variants").then((variants) =>
      productId ? variants.filter((variant) => variant.productId === productId) : variants
    );
  }

  createProductVariant(input: Omit<ProductVariantRecord, "id">) {
    return this.insertRow<ProductVariantRecord>("product_variants", input, "Could not create product variant.");
  }

  updateProductVariant(variantId: string, input: Partial<Omit<ProductVariantRecord, "id">>) {
    return this.updateRow<ProductVariantRecord>("product_variants", variantId, input, "Could not update product variant.");
  }

  deleteProductVariant(variantId: string) {
    return this.deleteRow("product_variants", variantId, "Could not delete product variant.");
  }

  listProductImages(productId?: string) {
    return this.listRows<ProductImageRecord>("product_images").then((images) =>
      productId ? images.filter((image) => image.productId === productId) : images
    );
  }

  createProductImage(input: Omit<ProductImageRecord, "id">) {
    return this.insertRow<ProductImageRecord>("product_images", { ...input, createdAt: input.createdAt ?? now() }, "Could not create product image.");
  }

  updateProductImage(imageId: string, input: Partial<Omit<ProductImageRecord, "id">>) {
    return this.updateRow<ProductImageRecord>("product_images", imageId, input, "Could not update product image.");
  }

  deleteProductImage(imageId: string) {
    return this.deleteRow("product_images", imageId, "Could not delete product image.");
  }

  async getProductInformation(productId: string): Promise<ProductInformationRecord | null> {
    const records = await this.listRows<ProductInformationRecord>("product_information");
    return records.find((record) => record.productId === productId) ?? null;
  }

  async upsertProductInformation(
    productId: string,
    input: Omit<ProductInformationRecord, "id" | "productId">
  ): Promise<ProductInformationRecord> {
    const existing = await this.getProductInformation(productId);
    if (existing) return this.updateRow("product_information", existing.id, input, "Could not update product information.");
    return this.insertRow("product_information", { ...input, productId }, "Could not create product information.");
  }

  listProfiles(options?: ListOptions) {
    return this.listRows<ProfileRecord>("profiles", options, ["email", "fullName", "phone"]);
  }

  getProfile(profileId: string) {
    return this.getRow<ProfileRecord>("profiles", profileId);
  }

  createProfile(input: ProfileMutationInput & { id?: string }) {
    return this.insertRow<ProfileRecord>("profiles", input, "Could not create profile.");
  }

  updateProfile(profileId: string, input: ProfileMutationInput) {
    return this.updateRow<ProfileRecord>("profiles", profileId, { ...input, updatedAt: now() }, "Could not update profile.");
  }

  listCustomers(options?: ListOptions) {
    return this.listRows<CustomerRecord>("customers", options, ["name", "email", "phone"]);
  }

  getCustomer(customerId: string) {
    return this.getRow<CustomerRecord>("customers", customerId);
  }

  createCustomer(input: CustomerMutationInput) {
    return this.insertRow<CustomerRecord>("customers", input, "Could not create customer.");
  }

  updateCustomer(customerId: string, input: CustomerMutationInput) {
    return this.updateRow<CustomerRecord>("customers", customerId, { ...input, updatedAt: now() }, "Could not update customer.");
  }

  async upsertCustomerByPhone(
    phone: string,
    input: Omit<CustomerMutationInput, "phone">
  ): Promise<CustomerRecord> {
    const result = await this.client
      .from("customers")
      .upsert(toRow({ ...input, phone, updatedAt: now() }), { onConflict: "phone" })
      .select("*")
      .single();
    if (result.error) this.translateError(result.error, "Could not upsert customer.");
    return fromRow<CustomerRecord>(result.data);
  }

  listAddresses(customerId?: string, orderId?: string) {
    return this.listRows<AddressRecord>("addresses").then((addresses) =>
      addresses.filter((address) => (customerId === undefined || address.customerId === customerId) && (orderId === undefined || address.orderId === orderId))
    );
  }

  createAddress(input: Omit<AddressRecord, "id">) {
    return this.insertRow<AddressRecord>("addresses", input, "Could not create address.");
  }

  updateAddress(addressId: string, input: Partial<Omit<AddressRecord, "id">>) {
    return this.updateRow<AddressRecord>("addresses", addressId, input, "Could not update address.");
  }

  deleteAddress(addressId: string) {
    return this.deleteRow("addresses", addressId, "Could not delete address.");
  }

  async listOrders(options?: ListOptions): Promise<OrderRecord[]> {
    const orders = await this.listRows<OrderRecord>("orders", options, ["orderNumber", "status", "paymentStatus"]);
    return Promise.all(orders.map((order) => this.hydrateOrder(order)));
  }

  async getOrder(idOrNumber: string): Promise<OrderRecord | null> {
    const byId = await this.client.from("orders").select("*").eq("id", idOrNumber).maybeSingle();
    if (byId.error) this.translateError(byId.error, "Could not read orders.");
    if (byId.data) return this.hydrateOrder(fromRow<OrderRecord>(byId.data));
    const byNumber = await this.client.from("orders").select("*").eq("order_number", idOrNumber).maybeSingle();
    if (byNumber.error) this.translateError(byNumber.error, "Could not read orders.");
    return byNumber.data ? this.hydrateOrder(fromRow<OrderRecord>(byNumber.data)) : null;
  }

  async createOrder(input: OrderMutationInput): Promise<OrderRecord> {
    const order = await this.insertRow<OrderRecord>("orders", orderRow(input), "Could not create order.");
    for (const item of input.items) {
      await this.insertRow<OrderItemRecord>("order_items", { ...item, orderId: order.id }, "Could not create order item.");
    }
    return (await this.getOrder(order.id))!;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.getOrder(orderId);
    if (!order) throw new NotFoundError("Order");
    if (order.paymentMethod === "payu" && order.paymentStatus !== "paid" && ["confirmed", "processing", "shipped", "delivered"].includes(status)) {
      throw new ConflictError("An unpaid online order cannot enter fulfilment.");
    }
    return this.updateRow<OrderRecord>("orders", orderId, { status, updatedAt: now() }, "Could not update order status.");
  }

  async createPaymentAttempt(input: PaymentAttemptMutationInput): Promise<PaymentAttemptRecord> {
    const result = await this.client.rpc("create_payu_payment_attempt", {
      p_order_id: input.orderId, p_transaction_id: input.transactionId, p_amount: input.amount,
      p_currency: input.currency, p_product_info: input.productInfo, p_customer_name: input.customerName,
      p_customer_email: input.customerEmail, p_customer_phone: input.customerPhone, p_coupon_id: input.couponId ?? null,
    });
    if (result.error) this.translateError(result.error, "Could not create payment attempt.");
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row) throw new NotFoundError("Payment attempt");
    return fromRow<PaymentAttemptRecord>(row);
  }

  async getPaymentAttemptByTransactionId(transactionId: string): Promise<PaymentAttemptRecord | null> {
    const result = await this.client.from("payment_attempts").select("*").eq("transaction_id", transactionId).maybeSingle();
    if (result.error) this.translateError(result.error, "Could not read payment attempt.");
    return result.data ? fromRow<PaymentAttemptRecord>(result.data) : null;
  }

  async getLatestPaymentAttemptForOrder(orderId: string): Promise<PaymentAttemptRecord | null> {
    const result = await this.client.from("payment_attempts").select("*").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (result.error) this.translateError(result.error, "Could not read payment attempt.");
    return result.data ? fromRow<PaymentAttemptRecord>(result.data) : null;
  }

  async applyVerifiedPaymentResult(input: VerifiedPaymentResultInput): Promise<PaymentAttemptRecord> {
    const result = await this.client.rpc("apply_verified_payu_result", {
      p_transaction_id: input.transactionId,
      p_status: input.status,
      p_provider_payment_id: input.providerPaymentId ?? null,
      p_failure_code: input.failureCode ?? null,
      p_failure_message: input.failureMessage ?? null,
    });
    if (result.error) this.translateError(result.error, "Could not apply payment result.");
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row) throw new NotFoundError("Payment attempt");
    return fromRow<PaymentAttemptRecord>(row);
  }

  async deleteOrder(orderId: string): Promise<void> {
    const items = await this.listOrderItems(orderId);
    await Promise.all(items.map((item) => this.deleteRow("order_items", item.id, "Could not delete order item.")));
    await this.deleteRow("orders", orderId, "Could not delete order.");
  }

  async listOrderItems(orderId: string): Promise<OrderItemRecord[]> {
    const items = await this.listRows<OrderItemRecord>("order_items");
    return items.filter((item) => item.orderId === orderId);
  }

  listReviews(options?: ListOptions) {
    return this.listRows<ReviewRecord>("reviews", options, ["authorName", "authorEmail", "body", "status"]);
  }

  getReview(reviewId: string) {
    return this.getRow<ReviewRecord>("reviews", reviewId);
  }

  createReview(input: ReviewMutationInput) {
    return this.insertRow<ReviewRecord>("reviews", { ...input, status: input.status ?? "pending" }, "Could not create review.");
  }

  updateReview(reviewId: string, input: Partial<ReviewMutationInput>) {
    return this.updateRow<ReviewRecord>("reviews", reviewId, { ...input, updatedAt: now() }, "Could not update review.");
  }

  deleteReview(reviewId: string) {
    return this.deleteRow("reviews", reviewId, "Could not delete review.");
  }

  listInquiries(options?: ListOptions) {
    return this.listRows<InquiryRecord>("inquiries", options, ["name", "email", "subject", "message", "status"]);
  }

  getInquiry(inquiryId: string) {
    return this.getRow<InquiryRecord>("inquiries", inquiryId);
  }

  createInquiry(input: InquiryMutationInput) {
    return this.insertRow<InquiryRecord>("inquiries", { ...input, status: input.status ?? "unread" }, "Could not create inquiry.");
  }

  updateInquiry(inquiryId: string, input: Partial<InquiryMutationInput>) {
    return this.updateRow<InquiryRecord>("inquiries", inquiryId, { ...input, updatedAt: now() }, "Could not update inquiry.");
  }

  deleteInquiry(inquiryId: string) {
    return this.deleteRow("inquiries", inquiryId, "Could not delete inquiry.");
  }

  listSubscribers(options?: ListOptions) {
    return this.listRows<SubscriberRecord>("subscribers", options, ["email", "name", "source"]);
  }

  createSubscriber(input: SubscriberMutationInput) {
    return this.insertRow<SubscriberRecord>("subscribers", { ...input, email: input.email.toLowerCase(), active: true, subscribedAt: now() }, "Could not create subscriber.");
  }

  deleteSubscriber(subscriberId: string) {
    return this.deleteRow("subscribers", subscriberId, "Could not delete subscriber.");
  }

  listHeroSlides(options?: ListOptions) {
    return this.listRows<HeroSlideRecord>("hero_slides", options, ["title", "subtitle", "collectionSlug"]);
  }

  createHeroSlide(input: HeroSlideMutationInput) {
    return this.insertRow<HeroSlideRecord>("hero_slides", { ...input, active: input.active ?? true }, "Could not create hero slide.");
  }

  updateHeroSlide(slideId: string, input: Partial<HeroSlideMutationInput>) {
    return this.updateRow<HeroSlideRecord>("hero_slides", slideId, input, "Could not update hero slide.");
  }

  deleteHeroSlide(slideId: string) {
    return this.deleteRow("hero_slides", slideId, "Could not delete hero slide.");
  }

  setHeroSlideActive(slideId: string, active: boolean) {
    return this.updateHeroSlide(slideId, { active });
  }

  async reorderHeroSlides(ids: string[]): Promise<HeroSlideRecord[]> {
    for (const [sortOrder, slideId] of ids.entries()) {
      await this.updateHeroSlide(slideId, { sortOrder });
    }
    return this.listHeroSlides();
  }

  listInstagramPosts(options?: ListOptions) {
    return this.listRows<InstagramPostRecord>("instagram_posts", options, ["caption", "sourceUrl", "shortCode"]);
  }

  createInstagramPost(input: InstagramPostMutationInput) {
    return this.insertRow<InstagramPostRecord>("instagram_posts", { ...input, active: input.active ?? true }, "Could not create Instagram post.");
  }

  updateInstagramPost(postId: string, input: Partial<InstagramPostMutationInput>) {
    return this.updateRow<InstagramPostRecord>("instagram_posts", postId, input, "Could not update Instagram post.");
  }

  deleteInstagramPost(postId: string) {
    return this.deleteRow("instagram_posts", postId, "Could not delete Instagram post.");
  }

  async reorderInstagramPosts(ids: string[]): Promise<InstagramPostRecord[]> {
    for (const [sortOrder, postId] of ids.entries()) {
      await this.updateInstagramPost(postId, { sortOrder });
    }
    return this.listInstagramPosts();
  }

  listTestimonials(options?: ListOptions) {
    return this.listRows<TestimonialRecord>("testimonials", options, ["authorName", "quote", "role"]);
  }

  createTestimonial(input: TestimonialMutationInput) {
    return this.insertRow<TestimonialRecord>("testimonials", { ...input, active: input.active ?? true }, "Could not create testimonial.");
  }

  updateTestimonial(testimonialId: string, input: Partial<TestimonialMutationInput>) {
    return this.updateRow<TestimonialRecord>("testimonials", testimonialId, input, "Could not update testimonial.");
  }

  deleteTestimonial(testimonialId: string) {
    return this.deleteRow("testimonials", testimonialId, "Could not delete testimonial.");
  }

  listFaqs(options?: ListOptions) {
    return this.listRows<FaqRecord>("faqs", options, ["question", "answer", "category"]);
  }

  createFaq(input: FaqMutationInput) {
    return this.insertRow<FaqRecord>("faqs", { ...input, active: input.active ?? true }, "Could not create FAQ.");
  }

  updateFaq(faqId: string, input: Partial<FaqMutationInput>) {
    return this.updateRow<FaqRecord>("faqs", faqId, input, "Could not update FAQ.");
  }

  deleteFaq(faqId: string) {
    return this.deleteRow("faqs", faqId, "Could not delete FAQ.");
  }

  listAnnouncements(options?: ListOptions) {
    return this.listRows<AnnouncementRecord>("announcements", options, ["text"]);
  }

  createAnnouncement(input: AnnouncementMutationInput) {
    return this.insertRow<AnnouncementRecord>("announcements", { ...input, active: input.active ?? true }, "Could not create announcement.");
  }

  updateAnnouncement(announcementId: string, input: Partial<AnnouncementMutationInput>) {
    return this.updateRow<AnnouncementRecord>("announcements", announcementId, input, "Could not update announcement.");
  }

  deleteAnnouncement(announcementId: string) {
    return this.deleteRow("announcements", announcementId, "Could not delete announcement.");
  }

  async reorderAnnouncements(ids: string[]): Promise<AnnouncementRecord[]> {
    for (const [sortOrder, announcementId] of ids.entries()) {
      await this.updateAnnouncement(announcementId, { sortOrder });
    }
    return this.listAnnouncements();
  }

  listSettings() {
    return this.listRows<SettingRecord>("settings");
  }

  async getSetting(key: string): Promise<SettingRecord | null> {
    const settings = await this.listSettings();
    return settings.find((setting) => setting.key === key) ?? null;
  }

  async upsertSetting(key: string, value: SettingRecord["value"], description?: string | null): Promise<SettingRecord> {
    const result = await this.client
      .from("settings")
      .upsert(toRow({ key, value, description, updatedAt: now() }), { onConflict: "key" })
      .select("*")
      .single();
    if (result.error) this.translateError(result.error, "Could not upsert setting.");
    return fromRow<SettingRecord>(result.data);
  }

  async deleteSetting(key: string): Promise<void> {
    const result = await this.client.from("settings").delete().eq("key", key).select("id");
    if (result.error) this.translateError(result.error, "Could not delete setting.");
    if (!Array.isArray(result.data) || result.data.length === 0) {
      throw new NotFoundError("Setting");
    }
  }

  listCoupons(options?: ListOptions) {
    return this.listRows<CouponRecord>("coupons", options, ["code", "description", "discountType"]);
  }

  createCoupon(input: CouponMutationInput) {
    return this.insertRow<CouponRecord>("coupons", { ...input, code: input.code.toUpperCase(), active: input.active ?? true, usedCount: 0 }, "Could not create coupon.");
  }

  updateCoupon(couponId: string, input: Partial<CouponMutationInput>) {
    return this.updateRow<CouponRecord>("coupons", couponId, input.code ? { ...input, code: input.code.toUpperCase() } : input, "Could not update coupon.");
  }

  deleteCoupon(couponId: string) {
    return this.deleteRow("coupons", couponId, "Could not delete coupon.");
  }

  setCouponActive(couponId: string, active: boolean) {
    return this.updateCoupon(couponId, { active });
  }

  async incrementCouponUse(couponId: string): Promise<CouponRecord> {
    const existing = await this.getRow<CouponRecord>("coupons", couponId);
    if (!existing) throw new NotFoundError("Coupon");
    return this.updateRow<CouponRecord>("coupons", couponId, { usedCount: (existing.usedCount ?? 0) + 1 }, "Could not update coupon.");
  }

  listShippingRates(options?: ListOptions) {
    return this.listRows<ShippingRateRecord>("shipping_rates", options, ["name"]);
  }

  createShippingRate(input: ShippingRateMutationInput) {
    return this.insertRow<ShippingRateRecord>("shipping_rates", { ...input, active: input.active ?? true }, "Could not create shipping rate.");
  }

  updateShippingRate(rateId: string, input: Partial<ShippingRateMutationInput>) {
    return this.updateRow<ShippingRateRecord>("shipping_rates", rateId, input, "Could not update shipping rate.");
  }

  deleteShippingRate(rateId: string) {
    return this.deleteRow("shipping_rates", rateId, "Could not delete shipping rate.");
  }

  async getPromoSettings(): Promise<PromoSettingsRecord> {
    const records = await this.listRows<PromoSettingsRecord>("promo_settings");
    if (!records[0]) throw new NotFoundError("Promo settings");
    return records[0];
  }

  async updatePromoSettings(input: PromoSettingsMutationInput): Promise<PromoSettingsRecord> {
    const current = await this.getPromoSettings();
    return this.updateRow("promo_settings", current.id, input, "Could not update promo settings.");
  }

  listDiscoveryMenuEntries(options?: ListOptions) {
    return this.listRows<DiscoveryMenuEntryRecord>("discovery_menu_entries", options, ["label", "href"]);
  }

  createDiscoveryMenuEntry(input: DiscoveryMenuEntryMutationInput) {
    return this.insertRow<DiscoveryMenuEntryRecord>(
      "discovery_menu_entries",
      { ...input, active: input.active ?? true },
      "Could not create discovery menu entry."
    );
  }

  updateDiscoveryMenuEntry(
    entryId: string,
    input: Partial<DiscoveryMenuEntryMutationInput>
  ) {
    return this.updateRow<DiscoveryMenuEntryRecord>(
      "discovery_menu_entries",
      entryId,
      input,
      "Could not update discovery menu entry."
    );
  }

  deleteDiscoveryMenuEntry(entryId: string) {
    return this.deleteRow(
      "discovery_menu_entries",
      entryId,
      "Could not delete discovery menu entry."
    );
  }

  async reorderDiscoveryMenuEntries(ids: string[]): Promise<DiscoveryMenuEntryRecord[]> {
    for (const [sortOrder, entryId] of ids.entries()) {
      await this.updateDiscoveryMenuEntry(entryId, { sortOrder });
    }
    return this.listDiscoveryMenuEntries();
  }
}

export function createSupabaseProvider(client?: SupabaseClient): SupabaseDataProvider {
  if (client) return new SupabaseDataProvider(client);
  // Load the service-role boundary only when Supabase mode is selected.
  // This keeps local/test imports from evaluating a server-only module.
  const { createSupabaseServiceRoleClient } = require("../supabase/service-role") as typeof import("../supabase/service-role");
  return new SupabaseDataProvider(createSupabaseServiceRoleClient());
}
