import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const errorDescription = searchParams.get("error_description");

  const failure = (message: string) =>
    NextResponse.redirect(`${origin}/reset-password?error=${encodeURIComponent(message)}`);

  if (errorDescription) return failure(errorDescription);
  if (!code && !tokenHash) {
    return failure("This password reset link is invalid or has expired.");
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return failure(error.message);
  } else if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (error) return failure(error.message);
  }

  return NextResponse.redirect(`${origin}/reset-password`);
}
