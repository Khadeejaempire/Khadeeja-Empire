import { createHash, timingSafeEqual } from "node:crypto";

export const sha512 = (value: string) => createHash("sha512").update(value, "utf8").digest("hex");

export type PayUHashFields = {
  key: string; txnid: string; amount: string; productinfo: string;
  firstname: string; email: string; udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
};

export function createRequestHash(fields: PayUHashFields, salt: string): string {
  return sha512([
    fields.key, fields.txnid, fields.amount, fields.productinfo, fields.firstname, fields.email,
    fields.udf1 ?? "", fields.udf2 ?? "", fields.udf3 ?? "", fields.udf4 ?? "", fields.udf5 ?? "",
    "", "", "", "", "", salt,
  ].join("|"));
}

export function createResponseHash(fields: PayUHashFields & { status: string; additionalCharges?: string }, salt: string): string {
  const base = [
    salt, fields.status, "", "", "", "", "", fields.udf5 ?? "", fields.udf4 ?? "",
    fields.udf3 ?? "", fields.udf2 ?? "", fields.udf1 ?? "", fields.email, fields.firstname,
    fields.productinfo, fields.amount, fields.txnid, fields.key,
  ].join("|");
  return sha512(fields.additionalCharges ? `${fields.additionalCharges}|${base}` : base);
}

export function secureHashEquals(actual: string, expected: string): boolean {
  if (!/^[a-fA-F0-9]{128}$/.test(actual) || !/^[a-fA-F0-9]{128}$/.test(expected)) return false;
  return timingSafeEqual(Buffer.from(actual.toLowerCase(), "hex"), Buffer.from(expected.toLowerCase(), "hex"));
}

export function formatPayUAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid payment amount.");
  return amount.toFixed(2);
}
