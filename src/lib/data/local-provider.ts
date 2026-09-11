import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../admin/errors";
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
import { createLocalStore, type LocalStore, type LocalStoreOptions } from "./local-store";

export interface LocalProviderOptions extends LocalStoreOptions {
  store?: LocalStore;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${randomUUID()}`;

function searchable(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function listRecords<T extends object>(
  records: T[],
  options: ListOptions | undefined,
  searchFields: (keyof T)[]
): T[] {
  const normalizedSearch = options?.search?.trim().toLowerCase();
  let result = records.filter((record) => {
    const values = record as Record<string, unknown>;
    if (options?.active !== undefined && values.active !== options.active) return false;
    if (!normalizedSearch) return true;
    return searchFields.some((field) => searchable(record[field]).includes(normalizedSearch));
  });

  if (options?.sortBy) {
    const direction = options.sortDirection === "desc" ? -1 : 1;
    const sortBy = options.sortBy;
    result = [...result].sort((left, right) => {
      const a = searchable((left as Record<string, unknown>)[sortBy]);
      const b = searchable((right as Record<string, unknown>)[sortBy]);
      return a.localeCompare(b) * direction;
    });
  } else if (result.some((record) => "sortOrder" in (record as object))) {
    result = [...result].sort(
      (left, right) =>
        Number((left as Record<string, unknown>).sortOrder ?? 0) -
        Number((right as Record<string, unknown>).sortOrder ?? 0)
    );
  }

  const offset = options?.offset ?? 0;
  const limit = options?.limit;
  return result.slice(offset, limit === undefined ? undefined : offset + limit);
}

function find<T extends { id: string }>(records: T[], recordId: string, resource: string): T {
  const record = records.find((item) => item.id === recordId);
  if (!record) throw new NotFoundError(resource);
  return record;
}

function ensureUnique<T>(records: T[], predicate: (record: T) => boolean, message: string) {
  if (records.some(predicate)) throw new ConflictError(message);
}

function reordered<T extends { id: string; sortOrder?: number | null }>(
  records: T[],
  ids: string[]
): T[] {
  const requested = new Set(ids);
  const ordered = [
    ...ids.map((recordId) => records.find((record) => record.id === recordId)).filter(Boolean),
    ...records.filter((record) => !requested.has(record.id)),
  ] as T[];
  return ordered.map((record, sortOrder) => ({ ...record, sortOrder }));
}

function normalizeImages(
  productId: string,
  images: ProductMutationInput["images"]
): ProductImageRecord[] {
  return (images ?? []).map((image, index) =>
    typeof image === "string"
      ? {
          id: id("image"),
          productId,
          url: image,
          type: "image",
          sortOrder: index,
          isPrimary: index === 0,
          createdAt: now(),
        }
      : {
          ...image,
          id: image.id || id("image"),
          productId,
          sortOrder: image.sortOrder ?? index,
          isPrimary: image.isPrimary ?? index === 0,
          createdAt: image.createdAt ?? now(),
        }
  );
}

function hydrateProduct(state: AdminDataState, product: ProductRecord): ProductRecord {
  const images = product.images?.length
    ? product.images
    : state.images.filter((image) => image.productId === product.id);
  const category = state.categories.find(
    (c) => c.id === product.categoryId || c.slug === product.categorySlug
  ) || null;
  return {
    ...product,
    images,
    category,
    colors: product.colors ?? state.colors.filter((color) => color.productId === product.id),
    variants:
      product.variants ?? state.variants.filter((variant) => variant.productId === product.id),
    information:
      product.information ??
      state.productInformation.find((information) => information.productId === product.id) ??
      null,
  };
}

function hydrateOrder(state: AdminDataState, order: OrderRecord): OrderRecord {
  return {
    ...order,
    items: order.items?.length
      ? order.items
      : state.orderItems.filter((item) => item.orderId === order.id),
  };
}

export class LocalDataProvider implements DataProvider {
  readonly store: LocalStore;

  constructor(options: LocalProviderOptions = {}) {
    this.store = options.store ?? createLocalStore(options);
  }

  private read() {
    return this.store.read();
  }

  private update(updater: (state: AdminDataState) => AdminDataState | Promise<AdminDataState>) {
    return this.store.update(updater);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const state = await this.read();
    const orders = state.orders.map((order) => hydrateOrder(state, order));
    return {
      totalProducts: state.products.length,
      activeProducts: state.products.filter((product) => product.active !== false).length,
      totalOrders: state.orders.length,
      pendingOrders: state.orders.filter((order) => order.status === "pending").length,
      totalCustomers: state.customers.length,
      totalRevenue: state.orders
        .filter((order) => order.paymentStatus === "paid" || order.paymentStatus === undefined)
        .reduce((total, order) => total + order.total, 0),
      totalSubscribers: state.subscribers.length,
      pendingReviews: state.reviews.filter((review) => review.status === "pending").length,
      unreadInquiries: state.inquiries.filter((inquiry) => inquiry.status === "unread").length,
      recentOrders: orders.slice().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 10),
    };
  }

  async listProducts(options?: ListOptions): Promise<ProductRecord[]> {
    const state = await this.read();
    return listRecords(state.products, options, ["name", "slug", "description"]).map((product) =>
      hydrateProduct(state, product)
    );
  }

  getProducts(options?: ListOptions) {
    return this.listProducts(options);
  }

  async getProduct(idOrSlug: string): Promise<ProductRecord | null> {
    const state = await this.read();
    const product = state.products.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
    return product ? hydrateProduct(state, product) : null;
  }

  async createProduct(input: ProductMutationInput): Promise<ProductRecord> {
    let createdId = "";
    await this.update((state) => {
      ensureUnique(state.products, (product) => product.slug === input.slug, "A product with this slug already exists.");
      const productId = id("product");
      createdId = productId;
      const images = normalizeImages(productId, input.images);
      const product: ProductRecord = {
        ...input,
        id: productId,
        images,
        createdAt: now(),
        updatedAt: now(),
      };
      state.products.push(product);
      state.images.push(...images);
      return state;
    });
    return (await this.getProduct(createdId))!;
  }

  async updateProduct(idOrSlug: string, input: Partial<ProductMutationInput>): Promise<ProductRecord> {
    let updatedId = idOrSlug;
    await this.update((state) => {
      const product = state.products.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
      if (!product) throw new NotFoundError("Product");
      updatedId = product.id;
      if (input.slug && state.products.some((item) => item.id !== product.id && item.slug === input.slug)) {
        throw new ConflictError("A product with this slug already exists.");
      }
      const { images, ...changes } = input;
      Object.assign(product, changes, { updatedAt: now() });
      if (images !== undefined) {
        const normalized = normalizeImages(product.id, images);
        state.images = state.images.filter((image) => image.productId !== product.id);
        state.images.push(...normalized);
        product.images = normalized;
      }
      return state;
    });
    return (await this.getProduct(updatedId))!;
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.update((state) => {
      find(state.products, productId, "Product");
      state.products = state.products.filter((product) => product.id !== productId);
      state.images = state.images.filter((image) => image.productId !== productId);
      state.colors = state.colors.filter((color) => color.productId !== productId);
      state.variants = state.variants.filter((variant) => variant.productId !== productId);
      state.productInformation = state.productInformation.filter(
        (information) => information.productId !== productId
      );
      return state;
    });
  }

  async setProductActive(productId: string, active: boolean): Promise<ProductRecord> {
    return this.updateProduct(productId, { active });
  }

  async listCategories(options?: ListOptions): Promise<CategoryRecord[]> {
    const state = await this.read();
    return listRecords(state.categories, options, ["name", "slug", "description"]).map((category) => ({
      ...category,
      productCount: state.products.filter((product) => product.categoryId === category.id || product.categorySlug === category.slug).length,
    }));
  }

  getCategories(options?: ListOptions) {
    return this.listCategories(options);
  }

  async getCategory(idOrSlug: string): Promise<CategoryRecord | null> {
    const state = await this.read();
    return state.categories.find((category) => category.id === idOrSlug || category.slug === idOrSlug) ?? null;
  }

  async createCategory(input: CategoryMutationInput): Promise<CategoryRecord> {
    const state = await this.update((current) => {
      ensureUnique(current.categories, (category) => category.slug === input.slug, "A category with this slug already exists.");
      current.categories.push({ ...input, id: id("category"), active: input.active ?? true });
      return current;
    });
    return state.categories[state.categories.length - 1];
  }

  async updateCategory(categoryId: string, input: Partial<CategoryMutationInput>): Promise<CategoryRecord> {
    const state = await this.update((current) => {
      const category = find(current.categories, categoryId, "Category");
      if (input.slug && current.categories.some((item) => item.id !== categoryId && item.slug === input.slug)) {
        throw new ConflictError("A category with this slug already exists.");
      }
      Object.assign(category, input);
      return current;
    });
    return find(state.categories, categoryId, "Category");
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.update((state) => {
      find(state.categories, categoryId, "Category");
      state.categories = state.categories.filter((category) => category.id !== categoryId);
      return state;
    });
  }

  setCategoryActive(categoryId: string, active: boolean) {
    return this.updateCategory(categoryId, { active });
  }

  async listCollections(options?: ListOptions): Promise<CollectionRecord[]> {
    const state = await this.read();
    return listRecords(state.collections, options, ["name", "slug", "description"]);
  }

  async getCollection(idOrSlug: string): Promise<CollectionRecord | null> {
    const state = await this.read();
    return state.collections.find((collection) => collection.id === idOrSlug || collection.slug === idOrSlug) ?? null;
  }

  async createCollection(input: CollectionMutationInput): Promise<CollectionRecord> {
    const state = await this.update((current) => {
      ensureUnique(current.collections, (collection) => collection.slug === input.slug, "A collection with this slug already exists.");
      current.collections.push({ ...input, id: id("collection"), active: input.active ?? true });
      return current;
    });
    return state.collections[state.collections.length - 1];
  }

  async updateCollection(collectionId: string, input: Partial<CollectionMutationInput>): Promise<CollectionRecord> {
    const state = await this.update((current) => {
      const collection = find(current.collections, collectionId, "Collection");
      if (input.slug && current.collections.some((item) => item.id !== collectionId && item.slug === input.slug)) {
        throw new ConflictError("A collection with this slug already exists.");
      }
      Object.assign(collection, input);
      return current;
    });
    return find(state.collections, collectionId, "Collection");
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await this.update((state) => {
      find(state.collections, collectionId, "Collection");
      state.collections = state.collections.filter((collection) => collection.id !== collectionId);
      return state;
    });
  }

  async listProductColors(productId?: string): Promise<ProductColorRecord[]> {
    const state = await this.read();
    return productId ? state.colors.filter((color) => color.productId === productId) : state.colors;
  }

  async createProductColor(input: Omit<ProductColorRecord, "id">): Promise<ProductColorRecord> {
    const state = await this.update((current) => {
      ensureUnique(
        current.colors,
        (color) => color.productId === input.productId && color.name.toLowerCase() === input.name.toLowerCase(),
        "That product color already exists."
      );
      current.colors.push({ ...input, id: id("color") });
      return current;
    });
    return state.colors[state.colors.length - 1];
  }

  async updateProductColor(colorId: string, input: Partial<Omit<ProductColorRecord, "id">>): Promise<ProductColorRecord> {
    const state = await this.update((current) => {
      const color = find(current.colors, colorId, "Product color");
      Object.assign(color, input);
      return current;
    });
    return find(state.colors, colorId, "Product color");
  }

  async deleteProductColor(colorId: string): Promise<void> {
    await this.update((state) => {
      find(state.colors, colorId, "Product color");
      state.colors = state.colors.filter((color) => color.id !== colorId);
      return state;
    });
  }

  async listProductVariants(productId?: string): Promise<ProductVariantRecord[]> {
    const state = await this.read();
    return productId ? state.variants.filter((variant) => variant.productId === productId) : state.variants;
  }

  async createProductVariant(input: Omit<ProductVariantRecord, "id">): Promise<ProductVariantRecord> {
    const state = await this.update((current) => {
      current.variants.push({ ...input, id: id("variant") });
      return current;
    });
    return state.variants[state.variants.length - 1];
  }

  async updateProductVariant(variantId: string, input: Partial<Omit<ProductVariantRecord, "id">>): Promise<ProductVariantRecord> {
    const state = await this.update((current) => {
      const variant = find(current.variants, variantId, "Product variant");
      Object.assign(variant, input);
      return current;
    });
    return find(state.variants, variantId, "Product variant");
  }

  async deleteProductVariant(variantId: string): Promise<void> {
    await this.update((state) => {
      find(state.variants, variantId, "Product variant");
      state.variants = state.variants.filter((variant) => variant.id !== variantId);
      return state;
    });
  }

  async listProductImages(productId?: string): Promise<ProductImageRecord[]> {
    const state = await this.read();
    return productId ? state.images.filter((image) => image.productId === productId) : state.images;
  }

  async createProductImage(input: Omit<ProductImageRecord, "id">): Promise<ProductImageRecord> {
    const state = await this.update((current) => {
      current.images.push({ ...input, id: id("image"), createdAt: input.createdAt ?? now() });
      return current;
    });
    return state.images[state.images.length - 1];
  }

  async updateProductImage(imageId: string, input: Partial<Omit<ProductImageRecord, "id">>): Promise<ProductImageRecord> {
    const state = await this.update((current) => {
      const image = find(current.images, imageId, "Product image");
      Object.assign(image, input);
      return current;
    });
    return find(state.images, imageId, "Product image");
  }

  async deleteProductImage(imageId: string): Promise<void> {
    await this.update((state) => {
      find(state.images, imageId, "Product image");
      state.images = state.images.filter((image) => image.id !== imageId);
      return state;
    });
  }

  async getProductInformation(productId: string): Promise<ProductInformationRecord | null> {
    const state = await this.read();
    return state.productInformation.find((information) => information.productId === productId) ?? null;
  }

  async upsertProductInformation(
    productId: string,
    input: Omit<ProductInformationRecord, "id" | "productId">
  ): Promise<ProductInformationRecord> {
    const state = await this.update((current) => {
      const existing = current.productInformation.find((information) => information.productId === productId);
      if (existing) Object.assign(existing, input);
      else current.productInformation.push({ ...input, id: id("product-info"), productId });
      return current;
    });
    return find(
      state.productInformation,
      state.productInformation.find((information) => information.productId === productId)?.id ?? "",
      "Product information"
    );
  }

  async listProfiles(options?: ListOptions): Promise<ProfileRecord[]> {
    const state = await this.read();
    return listRecords(state.profiles, options, ["email", "fullName", "phone"]);
  }

  async getProfile(profileId: string): Promise<ProfileRecord | null> {
    const state = await this.read();
    return state.profiles.find((profile) => profile.id === profileId) ?? null;
  }

  async createProfile(input: ProfileMutationInput & { id?: string }): Promise<ProfileRecord> {
    const timestamp = now();
    const profile: ProfileRecord = {
      id: input.id ?? id("profile"),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const state = await this.update((current) => {
      ensureUnique(current.profiles, (item) => item.id === profile.id, "That profile already exists.");
      current.profiles.push(profile);
      return current;
    });
    return find(state.profiles, profile.id, "Profile");
  }

  async updateProfile(profileId: string, input: ProfileMutationInput): Promise<ProfileRecord> {
    const state = await this.update((current) => {
      const profile = find(current.profiles, profileId, "Profile");
      Object.assign(profile, input, { updatedAt: now() });
      return current;
    });
    return find(state.profiles, profileId, "Profile");
  }

  async listCustomers(options?: ListOptions): Promise<CustomerRecord[]> {
    const state = await this.read();
    return listRecords(state.customers, options, ["name", "email", "phone"]);
  }

  async getCustomer(customerId: string): Promise<CustomerRecord | null> {
    const state = await this.read();
    const customer = state.customers.find((item) => item.id === customerId);
    return customer
      ? { ...customer, addresses: state.addresses.filter((address) => address.customerId === customerId) }
      : null;
  }

  async createCustomer(input: CustomerMutationInput): Promise<CustomerRecord> {
    const state = await this.update((current) => {
      if (input.email) ensureUnique(current.customers, (customer) => customer.email === input.email, "A customer with this email already exists.");
      if (input.phone) ensureUnique(current.customers, (customer) => customer.phone === input.phone, "A customer with this phone already exists.");
      current.customers.push({ ...input, id: id("customer"), status: input.status ?? "active", createdAt: now(), updatedAt: now() });
      return current;
    });
    return state.customers[state.customers.length - 1];
  }

  async updateCustomer(customerId: string, input: CustomerMutationInput): Promise<CustomerRecord> {
    const state = await this.update((current) => {
      const customer = find(current.customers, customerId, "Customer");
      if (input.phone) {
        ensureUnique(
          current.customers,
          (candidate) => candidate.id !== customerId && candidate.phone === input.phone,
          "A customer with this phone already exists."
        );
      }
      Object.assign(customer, input, { updatedAt: now() });
      return current;
    });
    return find(state.customers, customerId, "Customer");
  }

  async upsertCustomerByPhone(
    phone: string,
    input: Omit<CustomerMutationInput, "phone">
  ): Promise<CustomerRecord> {
    const state = await this.update((current) => {
      const existing = current.customers.find((customer) => customer.phone === phone);
      if (existing) {
        Object.assign(existing, input, { phone, updatedAt: now() });
        return current;
      }

      current.customers.push({
        ...input,
        phone,
        id: id("customer"),
        status: input.status ?? "active",
        createdAt: now(),
        updatedAt: now(),
      });
      return current;
    });

    return state.customers.find((customer) => customer.phone === phone)!;
  }

  async listAddresses(customerId?: string, orderId?: string): Promise<AddressRecord[]> {
    const state = await this.read();
    return state.addresses.filter(
      (address) => (customerId === undefined || address.customerId === customerId) && (orderId === undefined || address.orderId === orderId)
    );
  }

  async createAddress(input: Omit<AddressRecord, "id">): Promise<AddressRecord> {
    const state = await this.update((current) => {
      current.addresses.push({ ...input, id: id("address") });
      return current;
    });
    return state.addresses[state.addresses.length - 1];
  }

  async updateAddress(addressId: string, input: Partial<Omit<AddressRecord, "id">>): Promise<AddressRecord> {
    const state = await this.update((current) => {
      const address = find(current.addresses, addressId, "Address");
      Object.assign(address, input);
      return current;
    });
    return find(state.addresses, addressId, "Address");
  }

  async deleteAddress(addressId: string): Promise<void> {
    await this.update((state) => {
      find(state.addresses, addressId, "Address");
      state.addresses = state.addresses.filter((address) => address.id !== addressId);
      return state;
    });
  }

  async listOrders(options?: ListOptions): Promise<OrderRecord[]> {
    const state = await this.read();
    return listRecords(state.orders, options, ["orderNumber", "status", "paymentStatus"]).map((order) => hydrateOrder(state, order));
  }

  async getOrder(idOrNumber: string): Promise<OrderRecord | null> {
    const state = await this.read();
    const order = state.orders.find((item) => item.id === idOrNumber || item.orderNumber === idOrNumber);
    return order ? hydrateOrder(state, order) : null;
  }

  async createOrder(input: OrderMutationInput): Promise<OrderRecord> {
    let createdId = "";
    await this.update((state) => {
      const orderId = id("order");
      const orderNumber = input.orderNumber ?? `KE-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      ensureUnique(state.orders, (order) => order.orderNumber === orderNumber, "That order number already exists.");
      const items = input.items.map((item) => ({ ...item, id: item.id || id("order-item"), orderId }));
      state.orders.push({ ...input, id: orderId, orderNumber, status: input.status ?? "pending", items, createdAt: now(), updatedAt: now() });
      state.orderItems.push(...items);
      createdId = orderId;
      return state;
    });
    return (await this.getOrder(createdId))!;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderRecord> {
    const state = await this.update((current) => {
      const order = find(current.orders, orderId, "Order");
      if (order.paymentMethod === "payu" && order.paymentStatus !== "paid" && ["confirmed", "processing", "shipped", "delivered"].includes(status)) {
        throw new ConflictError("An unpaid online order cannot enter fulfilment.");
      }
      Object.assign(order, { status, updatedAt: now() });
      return current;
    });
    return hydrateOrder(state, find(state.orders, orderId, "Order"));
  }

  async createPaymentAttempt(input: PaymentAttemptMutationInput): Promise<PaymentAttemptRecord> {
    let createdId = "";
    await this.update((state) => {
      ensureUnique(state.paymentAttempts, (attempt) => attempt.transactionId === input.transactionId, "That payment transaction already exists.");
      createdId = id("payment-attempt");
      if (input.couponId) {
        const coupon = find(state.coupons, input.couponId, "Coupon");
        const currentTime = Date.now();
        for (const stale of state.paymentAttempts.filter((item) => item.couponId === input.couponId && item.couponReserved && ["created", "pending"].includes(item.status) && item.reservationExpiresAt && Date.parse(item.reservationExpiresAt) <= currentTime)) {
          stale.couponReserved = false;
          coupon.usedCount = Math.max(0, (coupon.usedCount ?? 0) - 1);
        }
        if (coupon.maximumUses != null && (coupon.usedCount ?? 0) >= coupon.maximumUses) throw new ConflictError("That coupon has reached its usage limit.");
        coupon.usedCount = (coupon.usedCount ?? 0) + 1;
      }
      state.paymentAttempts.push({ ...input, id: createdId, couponReserved: Boolean(input.couponId), reservationExpiresAt: input.couponId ? new Date(Date.now() + 30 * 60_000).toISOString() : null, createdAt: now(), updatedAt: now() });
      return state;
    });
    const created = (await this.read()).paymentAttempts.find((attempt) => attempt.id === createdId);
    if (!created) throw new NotFoundError("Payment attempt");
    return created;
  }

  async getPaymentAttemptByTransactionId(transactionId: string): Promise<PaymentAttemptRecord | null> {
    return (await this.read()).paymentAttempts.find((attempt) => attempt.transactionId === transactionId) ?? null;
  }

  async getLatestPaymentAttemptForOrder(orderId: string): Promise<PaymentAttemptRecord | null> {
    const attempts = (await this.read()).paymentAttempts.filter((attempt) => attempt.orderId === orderId);
    return attempts.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))[0] ?? null;
  }

  async applyVerifiedPaymentResult(input: VerifiedPaymentResultInput): Promise<PaymentAttemptRecord> {
    const state = await this.update((current) => {
      const attempt = current.paymentAttempts.find((item) => item.transactionId === input.transactionId);
      if (!attempt) throw new NotFoundError("Payment attempt");
      const order = find(current.orders, attempt.orderId, "Order");
      if (attempt.status === "paid" || attempt.status === "refunded") return current;
      const becamePaid = input.status === "paid";
      Object.assign(attempt, {
        status: input.status,
        providerPaymentId: input.providerPaymentId ?? attempt.providerPaymentId ?? null,
        failureCode: becamePaid ? null : input.failureCode ?? null,
        failureMessage: becamePaid ? null : input.failureMessage ?? null,
        verifiedAt: now(),
        updatedAt: now(),
      });
      order.paymentStatus = input.status;
      if (becamePaid && ["pending", "confirmed"].includes(order.status)) order.status = "confirmed";
      order.updatedAt = now();
      if (!becamePaid && attempt.couponId && attempt.couponReserved) {
        const coupon = current.coupons.find((item) => item.id === attempt.couponId);
        if (coupon) coupon.usedCount = Math.max(0, (coupon.usedCount ?? 0) - 1);
        attempt.couponReserved = false;
      }
      return current;
    });
    const result = state.paymentAttempts.find((attempt) => attempt.transactionId === input.transactionId);
    if (!result) throw new NotFoundError("Payment attempt");
    return result;
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.update((state) => {
      find(state.orders, orderId, "Order");
      state.orders = state.orders.filter((order) => order.id !== orderId);
      state.orderItems = state.orderItems.filter((item) => item.orderId !== orderId);
      state.paymentAttempts = state.paymentAttempts.filter((attempt) => attempt.orderId !== orderId);
      return state;
    });
  }

  async listOrderItems(orderId: string): Promise<OrderItemRecord[]> {
    const state = await this.read();
    return state.orderItems.filter((item) => item.orderId === orderId);
  }

  async listReviews(options?: ListOptions): Promise<ReviewRecord[]> {
    const state = await this.read();
    return listRecords(state.reviews, options, ["authorName", "authorEmail", "body", "status"]);
  }

  async getReview(reviewId: string): Promise<ReviewRecord | null> {
    const state = await this.read();
    return state.reviews.find((review) => review.id === reviewId) ?? null;
  }

  async createReview(input: ReviewMutationInput): Promise<ReviewRecord> {
    const state = await this.update((current) => {
      current.reviews.push({ ...input, id: id("review"), body: input.body, status: input.status ?? "pending", createdAt: now(), updatedAt: now() });
      return current;
    });
    return state.reviews[state.reviews.length - 1];
  }

  async updateReview(reviewId: string, input: Partial<ReviewMutationInput>): Promise<ReviewRecord> {
    const state = await this.update((current) => {
      const review = find(current.reviews, reviewId, "Review");
      Object.assign(review, input, { updatedAt: now() });
      return current;
    });
    return find(state.reviews, reviewId, "Review");
  }

  async deleteReview(reviewId: string): Promise<void> {
    await this.update((state) => {
      find(state.reviews, reviewId, "Review");
      state.reviews = state.reviews.filter((review) => review.id !== reviewId);
      return state;
    });
  }

  async listInquiries(options?: ListOptions): Promise<InquiryRecord[]> {
    const state = await this.read();
    return listRecords(state.inquiries, options, ["name", "email", "subject", "message", "status"]);
  }

  async getInquiry(inquiryId: string): Promise<InquiryRecord | null> {
    const state = await this.read();
    return state.inquiries.find((inquiry) => inquiry.id === inquiryId) ?? null;
  }

  async createInquiry(input: InquiryMutationInput): Promise<InquiryRecord> {
    const state = await this.update((current) => {
      current.inquiries.push({ ...input, id: id("inquiry"), status: input.status ?? "unread", createdAt: now(), updatedAt: now() });
      return current;
    });
    return state.inquiries[state.inquiries.length - 1];
  }

  async updateInquiry(inquiryId: string, input: Partial<InquiryMutationInput>): Promise<InquiryRecord> {
    const state = await this.update((current) => {
      const inquiry = find(current.inquiries, inquiryId, "Inquiry");
      Object.assign(inquiry, input, { updatedAt: now() });
      return current;
    });
    return find(state.inquiries, inquiryId, "Inquiry");
  }

  async deleteInquiry(inquiryId: string): Promise<void> {
    await this.update((state) => {
      find(state.inquiries, inquiryId, "Inquiry");
      state.inquiries = state.inquiries.filter((inquiry) => inquiry.id !== inquiryId);
      return state;
    });
  }

  async listSubscribers(options?: ListOptions): Promise<SubscriberRecord[]> {
    const state = await this.read();
    return listRecords(state.subscribers, options, ["email", "name", "source"]);
  }

  async createSubscriber(input: SubscriberMutationInput): Promise<SubscriberRecord> {
    const normalizedEmail = input.email.toLowerCase();
    const state = await this.update((current) => {
      ensureUnique(current.subscribers, (subscriber) => subscriber.email.toLowerCase() === normalizedEmail, "That email is already subscribed.");
      current.subscribers.push({ ...input, email: normalizedEmail, id: id("subscriber"), active: true, subscribedAt: now() });
      return current;
    });
    return state.subscribers[state.subscribers.length - 1];
  }

  async deleteSubscriber(subscriberId: string): Promise<void> {
    await this.update((state) => {
      find(state.subscribers, subscriberId, "Subscriber");
      state.subscribers = state.subscribers.filter((subscriber) => subscriber.id !== subscriberId);
      return state;
    });
  }

  async listHeroSlides(options?: ListOptions): Promise<HeroSlideRecord[]> {
    const state = await this.read();
    return listRecords(state.heroSlides, options, ["title", "subtitle", "collectionSlug"]);
  }

  async createHeroSlide(input: HeroSlideMutationInput): Promise<HeroSlideRecord> {
    const state = await this.update((current) => {
      current.heroSlides.push({ ...input, id: id("hero"), active: input.active ?? true, sortOrder: input.sortOrder ?? current.heroSlides.length });
      return current;
    });
    return state.heroSlides[state.heroSlides.length - 1];
  }

  async updateHeroSlide(slideId: string, input: Partial<HeroSlideMutationInput>): Promise<HeroSlideRecord> {
    const state = await this.update((current) => {
      const slide = find(current.heroSlides, slideId, "Hero slide");
      Object.assign(slide, input);
      return current;
    });
    return find(state.heroSlides, slideId, "Hero slide");
  }

  async deleteHeroSlide(slideId: string): Promise<void> {
    await this.update((state) => {
      find(state.heroSlides, slideId, "Hero slide");
      state.heroSlides = state.heroSlides.filter((slide) => slide.id !== slideId);
      return state;
    });
  }

  setHeroSlideActive(slideId: string, active: boolean) {
    return this.updateHeroSlide(slideId, { active });
  }

  async reorderHeroSlides(ids: string[]): Promise<HeroSlideRecord[]> {
    const state = await this.update((current) => {
      current.heroSlides = reordered(current.heroSlides, ids);
      return current;
    });
    return state.heroSlides;
  }

  async listInstagramPosts(options?: ListOptions): Promise<InstagramPostRecord[]> {
    const state = await this.read();
    return listRecords(state.instagramPosts, options, ["caption", "sourceUrl", "shortCode"]);
  }

  async createInstagramPost(input: InstagramPostMutationInput): Promise<InstagramPostRecord> {
    const state = await this.update((current) => {
      current.instagramPosts.push({ ...input, id: id("instagram"), active: input.active ?? true, sortOrder: input.sortOrder ?? current.instagramPosts.length });
      return current;
    });
    return state.instagramPosts[state.instagramPosts.length - 1];
  }

  async updateInstagramPost(postId: string, input: Partial<InstagramPostMutationInput>): Promise<InstagramPostRecord> {
    const state = await this.update((current) => {
      const post = find(current.instagramPosts, postId, "Instagram post");
      Object.assign(post, input);
      return current;
    });
    return find(state.instagramPosts, postId, "Instagram post");
  }

  async deleteInstagramPost(postId: string): Promise<void> {
    await this.update((state) => {
      find(state.instagramPosts, postId, "Instagram post");
      state.instagramPosts = state.instagramPosts.filter((post) => post.id !== postId);
      return state;
    });
  }

  async reorderInstagramPosts(ids: string[]): Promise<InstagramPostRecord[]> {
    const state = await this.update((current) => {
      current.instagramPosts = reordered(current.instagramPosts, ids);
      return current;
    });
    return state.instagramPosts;
  }

  async listTestimonials(options?: ListOptions): Promise<TestimonialRecord[]> {
    const state = await this.read();
    return listRecords(state.testimonials, options, ["authorName", "quote", "role"]);
  }

  async createTestimonial(input: TestimonialMutationInput): Promise<TestimonialRecord> {
    const state = await this.update((current) => {
      current.testimonials.push({ ...input, id: id("testimonial"), active: input.active ?? true, sortOrder: input.sortOrder ?? current.testimonials.length });
      return current;
    });
    return state.testimonials[state.testimonials.length - 1];
  }

  async updateTestimonial(testimonialId: string, input: Partial<TestimonialMutationInput>): Promise<TestimonialRecord> {
    const state = await this.update((current) => {
      const testimonial = find(current.testimonials, testimonialId, "Testimonial");
      Object.assign(testimonial, input);
      return current;
    });
    return find(state.testimonials, testimonialId, "Testimonial");
  }

  async deleteTestimonial(testimonialId: string): Promise<void> {
    await this.update((state) => {
      find(state.testimonials, testimonialId, "Testimonial");
      state.testimonials = state.testimonials.filter((testimonial) => testimonial.id !== testimonialId);
      return state;
    });
  }

  async listFaqs(options?: ListOptions): Promise<FaqRecord[]> {
    const state = await this.read();
    return listRecords(state.faqs, options, ["question", "answer", "category"]);
  }

  async createFaq(input: FaqMutationInput): Promise<FaqRecord> {
    const state = await this.update((current) => {
      current.faqs.push({ ...input, id: id("faq"), active: input.active ?? true, sortOrder: input.sortOrder ?? current.faqs.length });
      return current;
    });
    return state.faqs[state.faqs.length - 1];
  }

  async updateFaq(faqId: string, input: Partial<FaqMutationInput>): Promise<FaqRecord> {
    const state = await this.update((current) => {
      const faq = find(current.faqs, faqId, "FAQ");
      Object.assign(faq, input);
      return current;
    });
    return find(state.faqs, faqId, "FAQ");
  }

  async deleteFaq(faqId: string): Promise<void> {
    await this.update((state) => {
      find(state.faqs, faqId, "FAQ");
      state.faqs = state.faqs.filter((faq) => faq.id !== faqId);
      return state;
    });
  }

  async listAnnouncements(options?: ListOptions): Promise<AnnouncementRecord[]> {
    const state = await this.read();
    return listRecords(state.announcements, options, ["text"]);
  }

  async createAnnouncement(input: AnnouncementMutationInput): Promise<AnnouncementRecord> {
    const state = await this.update((current) => {
      current.announcements.push({ ...input, id: id("announcement"), active: input.active ?? true, sortOrder: input.sortOrder ?? current.announcements.length });
      return current;
    });
    return state.announcements[state.announcements.length - 1];
  }

  async updateAnnouncement(announcementId: string, input: Partial<AnnouncementMutationInput>): Promise<AnnouncementRecord> {
    const state = await this.update((current) => {
      const announcement = find(current.announcements, announcementId, "Announcement");
      Object.assign(announcement, input);
      return current;
    });
    return find(state.announcements, announcementId, "Announcement");
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await this.update((state) => {
      find(state.announcements, announcementId, "Announcement");
      state.announcements = state.announcements.filter((announcement) => announcement.id !== announcementId);
      return state;
    });
  }

  async reorderAnnouncements(ids: string[]): Promise<AnnouncementRecord[]> {
    const state = await this.update((current) => {
      current.announcements = reordered(current.announcements, ids);
      return current;
    });
    return state.announcements;
  }

  async listSettings(): Promise<SettingRecord[]> {
    const state = await this.read();
    return state.settings;
  }

  async getSetting(key: string): Promise<SettingRecord | null> {
    const state = await this.read();
    return state.settings.find((setting) => setting.key === key) ?? null;
  }

  async upsertSetting(key: string, value: SettingRecord["value"], description?: string | null): Promise<SettingRecord> {
    const state = await this.update((current) => {
      const setting = current.settings.find((item) => item.key === key);
      if (setting) Object.assign(setting, { value, description, updatedAt: now() });
      else current.settings.push({ id: id("setting"), key, value, description, updatedAt: now() });
      return current;
    });
    return state.settings.find((setting) => setting.key === key)!;
  }

  async deleteSetting(key: string): Promise<void> {
    await this.update((state) => {
      if (!state.settings.some((setting) => setting.key === key)) throw new NotFoundError("Setting");
      state.settings = state.settings.filter((setting) => setting.key !== key);
      return state;
    });
  }

  async listCoupons(options?: ListOptions): Promise<CouponRecord[]> {
    const state = await this.read();
    return listRecords(state.coupons, options, ["code", "description", "discountType"]);
  }

  async createCoupon(input: CouponMutationInput): Promise<CouponRecord> {
    const state = await this.update((current) => {
      const code = input.code.toUpperCase();
      ensureUnique(current.coupons, (coupon) => coupon.code === code, "That coupon code already exists.");
      if (input.discountType === "percentage" && input.discountValue > 100) throw new ConflictError("Percentage discounts cannot exceed 100.");
      current.coupons.push({ ...input, code, id: id("coupon"), active: input.active ?? true, usedCount: 0 });
      return current;
    });
    return state.coupons[state.coupons.length - 1];
  }

  async updateCoupon(couponId: string, input: Partial<CouponMutationInput>): Promise<CouponRecord> {
    const state = await this.update((current) => {
      const coupon = find(current.coupons, couponId, "Coupon");
      const code = input.code?.toUpperCase();
      if (code && current.coupons.some((item) => item.id !== couponId && item.code === code)) throw new ConflictError("That coupon code already exists.");
      Object.assign(coupon, input, code ? { code } : undefined);
      return current;
    });
    return find(state.coupons, couponId, "Coupon");
  }

  async deleteCoupon(couponId: string): Promise<void> {
    await this.update((state) => {
      find(state.coupons, couponId, "Coupon");
      state.coupons = state.coupons.filter((coupon) => coupon.id !== couponId);
      return state;
    });
  }

  setCouponActive(couponId: string, active: boolean) {
    return this.updateCoupon(couponId, { active });
  }

  async incrementCouponUse(couponId: string): Promise<CouponRecord> {
    const state = await this.update((current) => {
      const coupon = find(current.coupons, couponId, "Coupon");
      coupon.usedCount = (coupon.usedCount ?? 0) + 1;
      return current;
    });
    return find(state.coupons, couponId, "Coupon");
  }

  async listShippingRates(options?: ListOptions): Promise<ShippingRateRecord[]> {
    const state = await this.read();
    return listRecords(state.shippingRates, options, ["name"]);
  }

  async createShippingRate(input: ShippingRateMutationInput): Promise<ShippingRateRecord> {
    const state = await this.update((current) => {
      current.shippingRates.push({ ...input, id: id("shipping"), active: input.active ?? true });
      return current;
    });
    return state.shippingRates[state.shippingRates.length - 1];
  }

  async updateShippingRate(rateId: string, input: Partial<ShippingRateMutationInput>): Promise<ShippingRateRecord> {
    const state = await this.update((current) => {
      const rate = find(current.shippingRates, rateId, "Shipping rate");
      Object.assign(rate, input);
      return current;
    });
    return find(state.shippingRates, rateId, "Shipping rate");
  }

  async deleteShippingRate(rateId: string): Promise<void> {
    await this.update((state) => {
      find(state.shippingRates, rateId, "Shipping rate");
      state.shippingRates = state.shippingRates.filter((rate) => rate.id !== rateId);
      return state;
    });
  }

  async getPromoSettings(): Promise<PromoSettingsRecord> {
    const state = await this.read();
    return state.promoSettings;
  }

  async updatePromoSettings(input: PromoSettingsMutationInput): Promise<PromoSettingsRecord> {
    const state = await this.update((current) => {
      current.promoSettings = { ...current.promoSettings, ...input };
      return current;
    });
    return state.promoSettings;
  }

  async listDiscoveryMenuEntries(options?: ListOptions) {
    const state = await this.read();
    return listRecords(state.discoveryMenuEntries, options, ["label", "href"]);
  }

  async createDiscoveryMenuEntry(
    input: DiscoveryMenuEntryMutationInput
  ): Promise<DiscoveryMenuEntryRecord> {
    const state = await this.update((current) => {
      current.discoveryMenuEntries.push({
        ...input,
        id: id("discovery"),
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? current.discoveryMenuEntries.length,
      });
      return current;
    });
    return state.discoveryMenuEntries[state.discoveryMenuEntries.length - 1];
  }

  async updateDiscoveryMenuEntry(
    entryId: string,
    input: Partial<DiscoveryMenuEntryMutationInput>
  ): Promise<DiscoveryMenuEntryRecord> {
    const state = await this.update((current) => {
      const entry = find(current.discoveryMenuEntries, entryId, "Discovery menu entry");
      Object.assign(entry, input);
      return current;
    });
    return find(state.discoveryMenuEntries, entryId, "Discovery menu entry");
  }

  async deleteDiscoveryMenuEntry(entryId: string): Promise<void> {
    await this.update((state) => {
      find(state.discoveryMenuEntries, entryId, "Discovery menu entry");
      state.discoveryMenuEntries = state.discoveryMenuEntries.filter((entry) => entry.id !== entryId);
      return state;
    });
  }

  async reorderDiscoveryMenuEntries(ids: string[]): Promise<DiscoveryMenuEntryRecord[]> {
    const state = await this.update((current) => {
      current.discoveryMenuEntries = reordered(current.discoveryMenuEntries, ids);
      return current;
    });
    return state.discoveryMenuEntries;
  }
}

export function createLocalProvider(options: LocalProviderOptions = {}): LocalDataProvider {
  return new LocalDataProvider(options);
}
