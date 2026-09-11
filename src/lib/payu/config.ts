import "server-only";

import { z } from "zod";
import { isPlaceholderValue } from "@/lib/data/config";

const schema = z.object({
  PAYU_MERCHANT_KEY: z.string().trim().min(1),
  PAYU_MERCHANT_SALT: z.string().trim().min(8),
  PAYU_ENV: z.enum(["test", "live"]).default("test"),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export type PayUConfig = {
  key: string;
  salt: string;
  environment: "test" | "live";
  paymentUrl: string;
  verifyUrl: string;
  siteUrl: string;
};

export function getPayUConfig(): PayUConfig {
  const value = schema.parse(process.env);
  if (isPlaceholderValue(value.PAYU_MERCHANT_KEY) || isPlaceholderValue(value.PAYU_MERCHANT_SALT)) {
    throw new Error("PayU credentials are not configured.");
  }
  const site = new URL(value.NEXT_PUBLIC_SITE_URL);
  if (!(["http:", "https:"] as string[]).includes(site.protocol) || site.username || site.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a safe HTTP(S) URL.");
  }
  if ((value.PAYU_ENV === "live" || !["localhost", "127.0.0.1"].includes(site.hostname)) && site.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in PayU live mode.");
  }
  return {
    key: value.PAYU_MERCHANT_KEY,
    salt: value.PAYU_MERCHANT_SALT,
    environment: value.PAYU_ENV,
    paymentUrl: value.PAYU_ENV === "live" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment",
    verifyUrl: value.PAYU_ENV === "live" ? "https://info.payu.in/merchant/postservice.php?form=2" : "https://test.payu.in/merchant/postservice.php?form=2",
    siteUrl: site.origin,
  };
}
