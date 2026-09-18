"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ConflictError } from "@/lib/admin/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDataProvider } from "@/lib/data";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nextUrl = (formData.get("next") as string) || "/";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const dataProvider = getDataProvider();
  const customers = await dataProvider.listCustomers({ search: email });
  let customer = customers.find(
    (c) => c.email?.toLowerCase() === email.toLowerCase()
  );

  if (customer?.status === "inactive") {
    await supabase.auth.signOut();
    return { error: "Your account is pending admin approval." };
  }

  // Self-heal: a signup that failed after the auth user was created leaves an
  // account with no customer profile, which then cannot check out.
  if (!customer) {
    const fullName =
      (auth.user?.user_metadata?.full_name as string | undefined)?.trim() ||
      email.split("@")[0];
    try {
      customer = await dataProvider.createCustomer({
        name: fullName,
        email,
        status: "active",
      });
    } catch {
      // A conflicting phone or a race must not block an otherwise valid login.
    }
  }

  revalidatePath("/", "layout");
  redirect(nextUrl);
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = (formData.get("phone") as string) || "";
  const nextUrl = (formData.get("next") as string) || "/";

  if (!email || !password || !fullName || !phone) {
    return { error: "All fields are required." };
  }

  const adminClient = createServiceRoleClient();

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (createErr) {
    if (createErr.message?.toLowerCase().includes("already been registered")) {
      return { error: "An account with this email already exists. Log in or reset your password." };
    }
    return { error: createErr.message };
  }
  if (!created?.user) {
    return { error: "Could not create account. Please try again." };
  }

  const dataProvider = getDataProvider();
  try {
    await dataProvider.createCustomer({
      name: fullName,
      email: email,
      phone: phone,
      status: "active",
    });
  } catch (err) {
    // Roll back the auth user so a failed profile (e.g. duplicate phone) does
    // not leave the email permanently stuck as "already registered".
    await adminClient.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    if (err instanceof ConflictError) {
      return { error: "That phone number is already registered. Use a different number, or log in to the existing account." };
    }
    return { error: err instanceof Error ? err.message : "Could not create customer profile." };
  }

  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    return { success: "Account created! You can now log in." };
  }

  revalidatePath("/", "layout");
  redirect(nextUrl);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent to your email." };
}
