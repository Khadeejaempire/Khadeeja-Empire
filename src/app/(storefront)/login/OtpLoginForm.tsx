import { CustomerLoginForm } from "./CustomerLoginForm";

/** Compatibility wrapper for older imports; phone OTP is handled by Firebase. */
export function OtpLoginForm({ next }: { next: string }) {
  return <CustomerLoginForm next={next} />;
}
