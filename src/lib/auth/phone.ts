const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Normalize an Indian local number or an international number to E.164. */
export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "");
  let normalized: string;

  if (compact.startsWith("00")) {
    normalized = `+${compact.slice(2)}`;
  } else if (compact.startsWith("+")) {
    normalized = compact;
  } else if (/^\d{10}$/.test(compact)) {
    normalized = `+91${compact}`;
  } else if (/^91\d{10}$/.test(compact)) {
    normalized = `+${compact}`;
  } else {
    throw new Error("Enter a valid phone number.");
  }

  if (!E164_PHONE_PATTERN.test(normalized)) {
    throw new Error("Enter a valid phone number.");
  }

  return normalized;
}

export function phonesMatch(left: string | null | undefined, right: string): boolean {
  if (!left) return false;

  try {
    return normalizePhone(left) === normalizePhone(right);
  } catch {
    return false;
  }
}
