import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDataProvider } from "@/lib/data";
import type { CustomerRecord } from "@/lib/admin/types";
import type { DataProvider } from "@/lib/data/provider";
import { getCustomerAuthConfig } from "./config";
import { phonesMatch } from "./phone";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "./session";

export async function findCustomerByPhone(
  provider: DataProvider,
  phone: string
): Promise<CustomerRecord | null> {
  const customers = await provider.listCustomers();
  return customers.find((customer) => phonesMatch(customer.phone, phone)) ?? null;
}

export async function getCurrentCustomer(): Promise<CustomerRecord | null> {
  const provider = getDataProvider();
  const cookieStore = await cookies();
  const customerToken = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (customerToken) {
    const session = await verifyCustomerSession(customerToken, getCustomerAuthConfig());
    if (session) {
      const customer = await provider.getCustomer(session.customerId);
      if (
        customer &&
        customer.status !== "inactive" &&
        phonesMatch(customer.phone, session.phone)
      ) {
        return customer;
      }
    }

    // A present phone-session cookie is authoritative. Never fall through to
    // a potentially stale Supabase email session for a different customer.
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const customers = await provider.listCustomers({ search: user.email });
  const email = user.email.toLowerCase();
  return customers.find((customer) => customer.email?.toLowerCase() === email) ?? null;
}
