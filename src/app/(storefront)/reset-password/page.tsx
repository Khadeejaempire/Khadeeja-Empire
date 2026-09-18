import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-[480px] rounded-none border border-border bg-white px-8 py-8 shadow-sm">
        {children}
      </section>
    </main>
  );
}

function LinkProblem({ message }: { message: string }) {
  return (
    <Shell>
      <div className="text-center">
        <h1 className="mb-2 font-display text-3xl text-ink">Reset link problem</h1>
        <p className="mb-6 text-sm text-muted">{message}</p>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center bg-[#2d2520] text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-primary"
        >
          Request a new link
        </Link>
      </div>
    </Shell>
  );
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  if (error) return <LinkProblem message={error} />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <LinkProblem message="This password reset link is invalid or has expired. Request a new one to continue." />
    );
  }

  return (
    <Shell>
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-display text-3xl text-ink">Set a new password</h1>
        <p className="text-sm text-muted">Choose a new password for {user.email}.</p>
      </div>
      <ResetPasswordForm />
    </Shell>
  );
}
