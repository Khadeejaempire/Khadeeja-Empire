import "server-only";

import { z } from "zod";

const schema = z.object({
  SHIPROCKET_EMAIL: z.string().trim().min(1),
  SHIPROCKET_PASSWORD: z.string().trim().min(1),
  SHIPROCKET_PICKUP_LOCATION: z.string().trim().min(1).optional(),
  SHIPROCKET_WEBHOOK_SECRET: z.string().trim().min(16),
});

export type ShiprocketConfig = {
  email: string;
  password: string;
  pickupLocation: string;
  webhookSecret: string;
};

export function getShiprocketConfig(env = process.env): ShiprocketConfig {
  const value = schema.parse(env);
  return {
    email: value.SHIPROCKET_EMAIL,
    password: value.SHIPROCKET_PASSWORD,
    pickupLocation: value.SHIPROCKET_PICKUP_LOCATION || "Default",
    webhookSecret: value.SHIPROCKET_WEBHOOK_SECRET,
  };
}

export function isShiprocketConfigured(env = process.env): boolean {
  try {
    getShiprocketConfig(env);
    return true;
  } catch {
    return false;
  }
}
