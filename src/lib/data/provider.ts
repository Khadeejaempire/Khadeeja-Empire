import type {
  AddressRecord,
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
  PaymentStatus,
  PaymentAttemptMutationInput,
  PaymentAttemptRecord,
  VerifiedPaymentResultInput,
  ProductColorRecord,
  ProductImageRecord,
  ProductInformationRecord,
  ProductInformationMutationInput,
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
} from "@/lib/admin/types";

export interface DataProvider {
  getDashboardMetrics(): Promise<DashboardMetrics>;

  listProducts(options?: ListOptions): Promise<ProductRecord[]>;
  getProducts(options?: ListOptions): Promise<ProductRecord[]>;
  getProduct(idOrSlug: string): Promise<ProductRecord | null>;
  createProduct(input: ProductMutationInput): Promise<ProductRecord>;
  updateProduct(id: string, input: Partial<ProductMutationInput>): Promise<ProductRecord>;
  deleteProduct(id: string): Promise<void>;
  setProductActive(id: string, active: boolean): Promise<ProductRecord>;

  listCategories(options?: ListOptions): Promise<CategoryRecord[]>;
  getCategories(options?: ListOptions): Promise<CategoryRecord[]>;
  getCategory(idOrSlug: string): Promise<CategoryRecord | null>;
  createCategory(input: CategoryMutationInput): Promise<CategoryRecord>;
  updateCategory(id: string, input: Partial<CategoryMutationInput>): Promise<CategoryRecord>;
  deleteCategory(id: string): Promise<void>;
  setCategoryActive(id: string, active: boolean): Promise<CategoryRecord>;

  listCollections(options?: ListOptions): Promise<CollectionRecord[]>;
  getCollection(idOrSlug: string): Promise<CollectionRecord | null>;
  createCollection(input: CollectionMutationInput): Promise<CollectionRecord>;
  updateCollection(id: string, input: Partial<CollectionMutationInput>): Promise<CollectionRecord>;
  deleteCollection(id: string): Promise<void>;

  listProductColors(productId?: string): Promise<ProductColorRecord[]>;
  createProductColor(input: Omit<ProductColorRecord, "id">): Promise<ProductColorRecord>;
  updateProductColor(
    id: string,
    input: Partial<Omit<ProductColorRecord, "id">>
  ): Promise<ProductColorRecord>;
  deleteProductColor(id: string): Promise<void>;

  listProductVariants(productId?: string): Promise<ProductVariantRecord[]>;
  createProductVariant(input: Omit<ProductVariantRecord, "id">): Promise<ProductVariantRecord>;
  updateProductVariant(
    id: string,
    input: Partial<Omit<ProductVariantRecord, "id">>
  ): Promise<ProductVariantRecord>;
  deleteProductVariant(id: string): Promise<void>;

  listProductImages(productId?: string): Promise<ProductImageRecord[]>;
  createProductImage(input: Omit<ProductImageRecord, "id">): Promise<ProductImageRecord>;
  updateProductImage(
    id: string,
    input: Partial<Omit<ProductImageRecord, "id">>
  ): Promise<ProductImageRecord>;
  deleteProductImage(id: string): Promise<void>;

  getProductInformation(productId: string): Promise<ProductInformationRecord | null>;
  upsertProductInformation(
    productId: string,
    input: ProductInformationMutationInput
  ): Promise<ProductInformationRecord>;

  listProfiles(options?: ListOptions): Promise<ProfileRecord[]>;
  getProfile(id: string): Promise<ProfileRecord | null>;
  createProfile(input: ProfileMutationInput & { id?: string }): Promise<ProfileRecord>;
  updateProfile(id: string, input: ProfileMutationInput): Promise<ProfileRecord>;

  listCustomers(options?: ListOptions): Promise<CustomerRecord[]>;
  getCustomer(id: string): Promise<CustomerRecord | null>;
  createCustomer(input: CustomerMutationInput): Promise<CustomerRecord>;
  updateCustomer(id: string, input: CustomerMutationInput): Promise<CustomerRecord>;
  upsertCustomerByPhone(
    phone: string,
    input: Omit<CustomerMutationInput, "phone">
  ): Promise<CustomerRecord>;

  listAddresses(customerId?: string, orderId?: string): Promise<AddressRecord[]>;
  createAddress(input: Omit<AddressRecord, "id">): Promise<AddressRecord>;
  updateAddress(id: string, input: Partial<Omit<AddressRecord, "id">>): Promise<AddressRecord>;
  deleteAddress(id: string): Promise<void>;

  listOrders(options?: ListOptions): Promise<OrderRecord[]>;
  getOrder(idOrNumber: string): Promise<OrderRecord | null>;
  createOrder(input: OrderMutationInput): Promise<OrderRecord>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<OrderRecord>;
  updateOrderPaymentStatus(id: string, status: PaymentStatus): Promise<OrderRecord>;
  deleteOrder(id: string): Promise<void>;
  listOrderItems(orderId: string): Promise<OrderItemRecord[]>;
  createPaymentAttempt(input: PaymentAttemptMutationInput): Promise<PaymentAttemptRecord>;
  getPaymentAttemptByTransactionId(transactionId: string): Promise<PaymentAttemptRecord | null>;
  getLatestPaymentAttemptForOrder(orderId: string): Promise<PaymentAttemptRecord | null>;
  applyVerifiedPaymentResult(input: VerifiedPaymentResultInput): Promise<PaymentAttemptRecord>;

  listReviews(options?: ListOptions): Promise<ReviewRecord[]>;
  getReview(id: string): Promise<ReviewRecord | null>;
  createReview(input: ReviewMutationInput): Promise<ReviewRecord>;
  updateReview(id: string, input: Partial<ReviewMutationInput>): Promise<ReviewRecord>;
  deleteReview(id: string): Promise<void>;

  listInquiries(options?: ListOptions): Promise<InquiryRecord[]>;
  getInquiry(id: string): Promise<InquiryRecord | null>;
  createInquiry(input: InquiryMutationInput): Promise<InquiryRecord>;
  updateInquiry(id: string, input: Partial<InquiryMutationInput>): Promise<InquiryRecord>;
  deleteInquiry(id: string): Promise<void>;

  listSubscribers(options?: ListOptions): Promise<SubscriberRecord[]>;
  createSubscriber(input: SubscriberMutationInput): Promise<SubscriberRecord>;
  deleteSubscriber(id: string): Promise<void>;

  listHeroSlides(options?: ListOptions): Promise<HeroSlideRecord[]>;
  createHeroSlide(input: HeroSlideMutationInput): Promise<HeroSlideRecord>;
  updateHeroSlide(id: string, input: Partial<HeroSlideMutationInput>): Promise<HeroSlideRecord>;
  deleteHeroSlide(id: string): Promise<void>;
  setHeroSlideActive(id: string, active: boolean): Promise<HeroSlideRecord>;
  reorderHeroSlides(ids: string[]): Promise<HeroSlideRecord[]>;

  listInstagramPosts(options?: ListOptions): Promise<InstagramPostRecord[]>;
  createInstagramPost(input: InstagramPostMutationInput): Promise<InstagramPostRecord>;
  updateInstagramPost(
    id: string,
    input: Partial<InstagramPostMutationInput>
  ): Promise<InstagramPostRecord>;
  deleteInstagramPost(id: string): Promise<void>;
  reorderInstagramPosts(ids: string[]): Promise<InstagramPostRecord[]>;

  listTestimonials(options?: ListOptions): Promise<TestimonialRecord[]>;
  createTestimonial(input: TestimonialMutationInput): Promise<TestimonialRecord>;
  updateTestimonial(
    id: string,
    input: Partial<TestimonialMutationInput>
  ): Promise<TestimonialRecord>;
  deleteTestimonial(id: string): Promise<void>;

  listFaqs(options?: ListOptions): Promise<FaqRecord[]>;
  createFaq(input: FaqMutationInput): Promise<FaqRecord>;
  updateFaq(id: string, input: Partial<FaqMutationInput>): Promise<FaqRecord>;
  deleteFaq(id: string): Promise<void>;

  listAnnouncements(options?: ListOptions): Promise<AnnouncementRecord[]>;
  createAnnouncement(input: AnnouncementMutationInput): Promise<AnnouncementRecord>;
  updateAnnouncement(
    id: string,
    input: Partial<AnnouncementMutationInput>
  ): Promise<AnnouncementRecord>;
  deleteAnnouncement(id: string): Promise<void>;
  reorderAnnouncements(ids: string[]): Promise<AnnouncementRecord[]>;

  listSettings(): Promise<SettingRecord[]>;
  getSetting(key: string): Promise<SettingRecord | null>;
  upsertSetting(
    key: string,
    value: SettingRecord["value"],
    description?: string | null
  ): Promise<SettingRecord>;
  deleteSetting(key: string): Promise<void>;

  listCoupons(options?: ListOptions): Promise<CouponRecord[]>;
  createCoupon(input: CouponMutationInput): Promise<CouponRecord>;
  updateCoupon(id: string, input: Partial<CouponMutationInput>): Promise<CouponRecord>;
  deleteCoupon(id: string): Promise<void>;
  setCouponActive(id: string, active: boolean): Promise<CouponRecord>;
  incrementCouponUse(couponId: string): Promise<CouponRecord>;

  listShippingRates(options?: ListOptions): Promise<ShippingRateRecord[]>;
  createShippingRate(input: ShippingRateMutationInput): Promise<ShippingRateRecord>;
  updateShippingRate(
    id: string,
    input: Partial<ShippingRateMutationInput>
  ): Promise<ShippingRateRecord>;
  deleteShippingRate(id: string): Promise<void>;

  getPromoSettings(): Promise<PromoSettingsRecord>;
  updatePromoSettings(input: PromoSettingsMutationInput): Promise<PromoSettingsRecord>;

  listDiscoveryMenuEntries(options?: ListOptions): Promise<DiscoveryMenuEntryRecord[]>;
  createDiscoveryMenuEntry(
    input: DiscoveryMenuEntryMutationInput
  ): Promise<DiscoveryMenuEntryRecord>;
  updateDiscoveryMenuEntry(
    id: string,
    input: Partial<DiscoveryMenuEntryMutationInput>
  ): Promise<DiscoveryMenuEntryRecord>;
  deleteDiscoveryMenuEntry(id: string): Promise<void>;
  reorderDiscoveryMenuEntries(ids: string[]): Promise<DiscoveryMenuEntryRecord[]>;
}
