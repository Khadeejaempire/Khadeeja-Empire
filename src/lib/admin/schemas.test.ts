import { describe, expect, it } from "vitest";
import {
  addressMutationSchema,
  categoryMutationSchema,
  customerMutationSchema,
  discoveryMenuMutationSchema,
  faqMutationSchema,
  inquiryMutationSchema,
  instagramPostMutationSchema,
  orderMutationSchema,
  orderPaymentStatusUpdateSchema,
  orderStatusUpdateSchema,
  productInformationMutationSchema,
  productMutationSchema,
  profileMutationSchema,
  reviewMutationSchema,
  settingsMutationSchema,
  subscriberMutationSchema,
  testimonialMutationSchema,
} from "./schemas";
import { toStorefrontProduct } from "../storefront/adapters";

describe("admin mutation schemas", () => {
  it("accepts a catalog mutation with local media paths", () => {
    const result = productMutationSchema.parse({
      name: "  Indigo Kurti  ",
      slug: "indigo-kurti",
      price: 1290,
      currency: "INR",
      images: ["/assets/images/indigo.jpg"],
      sizes: ["S", "M"],
      tags: ["Minimal"],
    });

    expect(result.name).toBe("Indigo Kurti");
    expect(result.images).toEqual(["/assets/images/indigo.jpg"]);
  });

  it("rejects unsafe media URLs and negative prices", () => {
    expect(() =>
      productMutationSchema.parse({
        name: "Unsafe",
        slug: "unsafe",
        price: -1,
        images: ["javascript:alert(1)"],
      })
    ).toThrow();
  });

  it("validates category, order status, and setting inputs", () => {
    expect(
      categoryMutationSchema.parse({
        slug: "short-kurtis",
        name: "Short Kurtis",
      }).slug
    ).toBe("short-kurtis");
    expect(orderStatusUpdateSchema.parse({ status: "processing" })).toEqual({
      status: "processing",
    });
    expect(() => orderStatusUpdateSchema.parse({ status: "unknown" })).toThrow();
    expect(orderPaymentStatusUpdateSchema.parse({ paymentStatus: "paid" })).toEqual({
      paymentStatus: "paid",
    });
    expect(() => orderPaymentStatusUpdateSchema.parse({ paymentStatus: "unknown" })).toThrow();
    expect(
      settingsMutationSchema.parse({
        key: "shipping.freeThreshold",
        value: 2000,
      }).key
    ).toBe("shipping.freeThreshold");
    expect(
      orderMutationSchema.parse({
        subtotal: 100,
        shipping: 0,
        discount: 0,
        total: 100,
        items: [
          {
            productName: "Test Kurti",
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
      }).items
    ).toHaveLength(1);

    expect(() =>
      orderMutationSchema.parse({
        subtotal: 100,
        shipping: 10,
        discount: 5,
        total: 104,
        items: [{ productName: "Test", quantity: 1, unitPrice: 100, totalPrice: 100 }],
      })
    ).toThrow();

    expect(() =>
      productMutationSchema.parse({
        name: "Invalid markdown",
        slug: "invalid-markdown",
        price: 200,
        oldPrice: 100,
      })
    ).toThrow();
  });

  it("exports schemas for every provider mutation family", () => {
    expect(profileMutationSchema.parse({ email: "admin@example.com" }).email).toBe("admin@example.com");
    expect(customerMutationSchema.parse({ status: "active" }).status).toBe("active");
    expect(addressMutationSchema.parse({
      fullName: "Test Customer",
      line1: "1 Test Lane",
      city: "Varanasi",
      state: "UP",
      postalCode: "221001",
    }).city).toBe("Varanasi");
    expect(productInformationMutationSchema.parse({ fabric: "Cotton" }).fabric).toBe("Cotton");
    expect(reviewMutationSchema.parse({
      authorName: "Customer",
      rating: 5,
      body: "Beautiful.",
    }).rating).toBe(5);
    expect(inquiryMutationSchema.parse({
      name: "Customer",
      email: "customer@example.com",
      message: "Hello",
    }).message).toBe("Hello");
    expect(instagramPostMutationSchema.parse({ image: "/assets/images/post.jpg" }).image).toBe(
      "/assets/images/post.jpg"
    );
    expect(testimonialMutationSchema.parse({ authorName: "Customer", quote: "Lovely." }).quote).toBe(
      "Lovely."
    );
    expect(faqMutationSchema.parse({ question: "When?", answer: "Soon." }).answer).toBe("Soon.");
    expect(subscriberMutationSchema.parse({ email: "customer@example.com" }).email).toBe(
      "customer@example.com"
    );
    expect(discoveryMenuMutationSchema.parse({ label: "Shop", href: "/shop" }).href).toBe("/shop");
  });
});

describe("storefront adapters", () => {
  it("preserves provider product fields and media paths", () => {
    const product = toStorefrontProduct({
      id: "p-1",
      slug: "indigo-kurti",
      name: "Indigo Kurti",
      categorySlug: "short-kurtis",
      collectionSlug: "short-kurtis",
      description: "A breathable kurti.",
      images: [{ id: "image-1", productId: "p-1", url: "/assets/images/indigo.jpg" }],
      video: "/assets/videos/indigo.mp4",
      price: 1290,
      currency: "INR",
      sizes: ["S", "M"],
      tags: ["Minimal"],
      availability: "in-stock",
      sourcePostId: "post-1",
      sourceUrl: "https://instagram.com/p/post-1",
      isPrototypeData: true,
    });

    expect(product).toMatchObject({
      slug: "indigo-kurti",
      category: "short-kurtis",
      collection: "short-kurtis",
      images: ["/assets/images/indigo.jpg"],
      video: "/assets/videos/indigo.mp4",
      price: 1290,
      isPrototypeData: true,
    });
  });
});
