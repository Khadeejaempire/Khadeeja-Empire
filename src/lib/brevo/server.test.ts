import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { codOrderConfirmationContent, isBrevoConfigured, orderConfirmationContent } from "./server";

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

  it("builds COD confirmation content with pay-on-delivery wording", () => {
    const content = codOrderConfirmationContent("ORD-2", "Aisha", "849.00", "https://www.khadeejaempire.com");
    expect(content.subject).toContain("ORD-2");
    expect(content.html).toContain("pay on delivery");
    expect(content.html).toContain("849.00");
    expect(content.text).toContain("849.00");
  });
});
