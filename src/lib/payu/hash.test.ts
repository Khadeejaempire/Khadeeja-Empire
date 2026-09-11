// @vitest-environment node

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createRequestHash, createResponseHash, formatPayUAmount, secureHashEquals } from "./hash";

const digest = (value: string) => createHash("sha512").update(value, "utf8").digest("hex");
const fields = { key: "merchant", txnid: "KE-123", amount: "100.00", productinfo: "Order KE-123", firstname: "Asha", email: "asha@example.com", udf1: "KE-123" };

describe("PayU hashing", () => {
  it("uses PayU's exact request field order", () => {
    const preimage = "merchant|KE-123|100.00|Order KE-123|Asha|asha@example.com|KE-123||||||||||salt-1234";
    expect(createRequestHash(fields, "salt-1234")).toBe(digest(preimage));
  });

  it("uses PayU's reverse response order", () => {
    const preimage = ["salt-1234", "success", "", "", "", "", "", "", "", "", "", "KE-123", "asha@example.com", "Asha", "Order KE-123", "100.00", "KE-123", "merchant"].join("|");
    expect(createResponseHash({ ...fields, status: "success" }, "salt-1234")).toBe(digest(preimage));
  });

  it("prefixes additional charges for response hashing", () => {
    const ordinary = createResponseHash({ ...fields, status: "success" }, "salt-1234");
    const charged = createResponseHash({ ...fields, status: "success", additionalCharges: "10.00" }, "salt-1234");
    expect(charged).not.toBe(ordinary);
  });

  it("compares only valid SHA-512 hex values", () => {
    const value = "a".repeat(128);
    expect(secureHashEquals(value.toUpperCase(), value)).toBe(true);
    expect(secureHashEquals("x", "x")).toBe(false);
    expect(secureHashEquals("g".repeat(128), value)).toBe(false);
  });

  it.each([[849, "849.00"], [0, "0.00"], [12.345, "12.35"]])("formats %s as %s", (amount, expected) => {
    expect(formatPayUAmount(amount)).toBe(expected);
  });
});
