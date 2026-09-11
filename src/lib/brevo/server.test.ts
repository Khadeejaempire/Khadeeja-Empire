import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isBrevoConfigured, orderConfirmationContent } from "./server";

describe("brevo server", () => {
  it("reports configuration from env", () => {
    expect(isBrevoConfigured({})).toBe(false);
    expect(isBrevoConfigured({ BREVO_API_KEY: "k" })).toBe(false);
    expect(isBrevoConfigured({ BREVO_API_KEY: "k", BREVO_SENDER_EMAIL: "orders@khadeejaempire.com" })).toBe(true);
  });

  it("builds order confirmation content", () => {
    const content = orderConfirmationContent("ORD-1", "Aisha", "1299.00", "https://www.khadeejaempire.com");
    expect(content.subject).toContain("ORD-1");
    expect(content.html).toContain("ORD-1");
    expect(content.html).toContain("/account/orders");
    expect(content.text).toContain("1299.00");
  });
});
