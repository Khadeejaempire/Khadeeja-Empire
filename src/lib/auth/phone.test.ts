import { describe, expect, it } from "vitest";
import { normalizePhone, phonesMatch } from "./phone";

describe("phone normalization", () => {
  it("normalizes supported Indian and international formats to E.164", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("91-98765-43210")).toBe("+919876543210");
    expect(normalizePhone("0091 (98765) 43210")).toBe("+919876543210");
    expect(normalizePhone("+44 7700 900123")).toBe("+447700900123");
  });

  it("matches legacy local customer numbers to Firebase E.164 numbers", () => {
    expect(phonesMatch("9876543210", "+919876543210")).toBe(true);
    expect(phonesMatch("+919876543211", "+919876543210")).toBe(false);
  });

  it("rejects ambiguous or malformed numbers", () => {
    expect(() => normalizePhone("1234567")).toThrow("Enter a valid phone number.");
    expect(() => normalizePhone("not-a-number")).toThrow("Enter a valid phone number.");
  });
});
