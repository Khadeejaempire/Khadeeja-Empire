import { describe, expect, it } from "vitest";
import { discountPercent } from "./utils";

describe("discountPercent", () => {
  it("rounds the saving against the old price", () => {
    expect(discountPercent(700, 1000)).toBe(30);
    expect(discountPercent(899, 1299)).toBe(31);
  });

  it("returns 0 when there is no real discount", () => {
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, 900)).toBe(0);
    expect(discountPercent(1000, null)).toBe(0);
    expect(discountPercent(1000)).toBe(0);
  });
});
