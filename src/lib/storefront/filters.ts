import "server-only";

import { getDataProvider } from "@/lib/data";
import type { ShopFilterSettings } from "@/types";
import {
  DEFAULT_SHOP_FILTER_SETTINGS,
  SHOP_FILTER_SETTINGS_KEY,
} from "./filters-constants";

export { DEFAULT_SHOP_FILTER_SETTINGS, SHOP_FILTER_SETTINGS_KEY };

export async function getShopFilterSettings(): Promise<ShopFilterSettings> {
  try {
    const provider = getDataProvider();
    const record = await provider.getSetting(SHOP_FILTER_SETTINGS_KEY);
    if (!record || !record.value || typeof record.value !== "object") {
      return DEFAULT_SHOP_FILTER_SETTINGS;
    }
    const val = record.value as Record<string, unknown>;
    return {
      minPrice:
        typeof val.minPrice === "number" && !isNaN(val.minPrice)
          ? val.minPrice
          : DEFAULT_SHOP_FILTER_SETTINGS.minPrice,
      maxPrice:
        typeof val.maxPrice === "number" && !isNaN(val.maxPrice)
          ? val.maxPrice
          : DEFAULT_SHOP_FILTER_SETTINGS.maxPrice,
      priceStep:
        typeof val.priceStep === "number" && !isNaN(val.priceStep)
          ? val.priceStep
          : DEFAULT_SHOP_FILTER_SETTINGS.priceStep,
      colors:
        Array.isArray(val.colors) && val.colors.length > 0
          ? (val.colors as ShopFilterSettings["colors"])
          : DEFAULT_SHOP_FILTER_SETTINGS.colors,
      fabrics:
        Array.isArray(val.fabrics) && val.fabrics.length > 0
          ? (val.fabrics as string[])
          : DEFAULT_SHOP_FILTER_SETTINGS.fabrics,
    };
  } catch (error) {
    console.error("Failed to load shop filter settings:", error);
    return DEFAULT_SHOP_FILTER_SETTINGS;
  }
}
