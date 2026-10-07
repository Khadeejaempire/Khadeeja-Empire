// @vitest-environment node

import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("retired verify OTP route", () => {
  it("cannot exchange the old demo code for a customer session", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "This legacy OTP endpoint has been retired. Use Firebase phone verification.",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
