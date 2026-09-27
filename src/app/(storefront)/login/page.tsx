import { safeRedirectPath } from "@/lib/auth/redirect";
import { CustomerLoginForm } from "./CustomerLoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const created = Array.isArray(params.created) ? params.created[0] : params.created;

  return (
    <CustomerLoginForm
      next={safeRedirectPath(next, "/")}
      initialSuccess={created ? "Account created! You can now log in." : undefined}
    />
  );
}
