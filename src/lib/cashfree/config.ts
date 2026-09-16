import "server-only";

import { z } from "zod";
import { isPlaceholderValue } from "@/lib/data/config";

const schema = z.object({
  CASHFREE_APP_ID: z.string().trim().min(1),
  CASHFREE_SECRET_KEY: z.string().trim().min(8),
  CASHFREE_ENV: z.enum(["sandbox", "production", "test", "live"]).default("sandbox"),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export type CashfreeConfig = {
  appId: string;
  secretKey: string;
  environment: "sandbox" | "production";
  apiUrl: string;
  siteUrl: string;
};

export function getCashfreeConfig(): CashfreeConfig {
  const value = schema.parse(process.env);
  if (isPlaceholderValue(value.CASHFREE_APP_ID) || isPlaceholderValue(value.CASHFREE_SECRET_KEY)) {
    throw new Error("Cashfree credentials are not configured.");
  }
  const site = new URL(value.NEXT_PUBLIC_SITE_URL);
  if (!(["http:", "https:"] as string[]).includes(site.protocol) || site.username || site.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a safe HTTP(S) URL.");
  }
  const environment = value.CASHFREE_ENV === "test" ? "sandbox" : value.CASHFREE_ENV === "live" ? "production" : value.CASHFREE_ENV;
  if ((environment === "production" || !["localhost", "127.0.0.1"].includes(site.hostname)) && site.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside local sandbox testing.");
  }
  return {
    appId: value.CASHFREE_APP_ID,
    secretKey: value.CASHFREE_SECRET_KEY,
    environment,
    apiUrl: environment === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    siteUrl: site.origin,
  };
}
