import type { ShopFilterSettings } from "@/types";

export const SHOP_FILTER_SETTINGS_KEY = "shop.filter_settings";

export const DEFAULT_SHOP_FILTER_SETTINGS: ShopFilterSettings = {
  minPrice: 500,
  maxPrice: 15000,
  priceStep: 100,
  colors: [
    { name: "Beige", hex: "#D4B376" },
    { name: "Black", hex: "#1A1A1A" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Coral", hex: "#E57373" },
    { name: "Green", hex: "#668B4A" },
    { name: "Maroon", hex: "#800020" },
    { name: "Navy", hex: "#1F2937" },
  ],
  fabrics: [
    "Pure Cotton",
    "Banarasi Silk",
    "Linen Blend",
    "Chiffon",
    "Georgette",
  ],
};
