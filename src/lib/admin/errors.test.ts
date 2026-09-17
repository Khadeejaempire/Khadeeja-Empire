import { describe, expect, it } from "vitest";
import { adminActionMessage, adminDigest, serverErrorMessage } from "./errors";

const MINIFIED_441 =
  "Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";

describe("adminDigest / serverErrorMessage", () => {
  it("round-trips a validation reason through the digest channel", () => {
    expect(serverErrorMessage({ digest: adminDigest("currency: Invalid") }, "fallback")).toBe(
      "currency: Invalid"
    );
  });

  it("ignores digests that are not ours", () => {
    expect(serverErrorMessage({ digest: "3837484594" }, "fallback")).toBe("fallback");
    expect(serverErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
    expect(serverErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});

describe("adminActionMessage", () => {
  it("prefers the real reason carried in the digest", () => {
    expect(
      adminActionMessage({ digest: adminDigest("currency: Invalid"), message: MINIFIED_441 }, "fallback")
    ).toBe("currency: Invalid");
  });

  it("never surfaces a minified framework error", () => {
    const message = adminActionMessage(new Error(MINIFIED_441), "Could not save. Reload and check before retrying.");
    expect(message).not.toContain("441");
    expect(message).toBe("Could not save. Reload and check before retrying.");
  });

  it("passes through real action errors", () => {
    expect(adminActionMessage(new Error("That record already exists."), "fallback")).toBe(
      "That record already exists."
    );
  });

  it("falls back for non-errors and empty messages", () => {
    expect(adminActionMessage(undefined, "fallback")).toBe("fallback");
    expect(adminActionMessage(new Error("   "), "fallback")).toBe("fallback");
    expect(adminActionMessage("nope", "fallback")).toBe("fallback");
  });
});
