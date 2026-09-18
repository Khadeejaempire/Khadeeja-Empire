import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { UIProvider } from "@/hooks/useUI";

function renderCard(product: Product) {
  return render(
    <UIProvider>
      <WishlistProvider>
        <CartProvider>
          <ProductCard product={product} />
        </CartProvider>
      </WishlistProvider>
    </UIProvider>
  );
}

const product = {
  id: "product-1",
  slug: "embroidered-kurti",
  name: "Embroidered Kurti",
  category: "short-kurtis",
  collection: "short-kurtis",
  description: "",
  images: ["/front.jpg", "/back.jpg"],
  video: "/product-video.mp4",
  hoverImage: "/legacy-hover.jpg",
  price: 3200,
  currency: "INR",
  priceStatus: "confirmed",
  sizes: ["S", "M"],
  tags: [],
  availability: "in-stock",
  sourcePostId: "",
  sourceUrl: "",
  isPrototypeData: false,
} satisfies Product;

describe("ProductCard", () => {
  it("prefers the dedicated hover image over the second gallery image", () => {
    const { container } = renderCard(product);
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toContain("front.jpg");
    expect(images[0].className).toContain("group-hover:opacity-0");
    expect(images[1].getAttribute("src")).toContain("legacy-hover.jpg");
    expect(images[1].className).toContain("group-hover:opacity-100");
    expect(container.innerHTML).not.toContain("product-video.mp4");
    expect(container.innerHTML).not.toContain("back.jpg");
  });

  it("falls back to the second product image when no hover image is set", () => {
    const { container } = renderCard({ ...product, hoverImage: undefined });
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(2);
    expect(images[1].getAttribute("src")).toContain("back.jpg");
  });

  it("renders no hover layer when the product has only one image and no hover image", () => {
    const { container } = renderCard({ ...product, images: ["/front.jpg"], hoverImage: undefined });
    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(1);
    expect(images[0].className).not.toContain("group-hover:opacity-0");
  });

  it("shows the discount badge and struck old price when an MRP is set", () => {
    const { getByText } = renderCard({ ...product, price: 700, oldPrice: 1000 });

    expect(getByText("30% OFF")).toBeTruthy();
    expect(getByText("₹1,000")).toBeTruthy();
    expect(getByText("₹700")).toBeTruthy();
  });

  it("renders review stars when a rating is present", () => {
    const { getByLabelText } = renderCard({ ...product, rating: { average: 4.5, count: 12 } });

    expect(getByLabelText("4.5 out of 5 stars from 12 reviews")).toBeTruthy();
  });
});
