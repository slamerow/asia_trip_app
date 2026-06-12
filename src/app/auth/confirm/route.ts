import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/photos/upload";
  const destination = new URL(next.startsWith("/") ? next : "/photos/upload", url.origin);

  if (!code) {
    destination.searchParams.set("auth_error", "missing_code");
    return NextResponse.redirect(destination);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    destination.searchParams.set("auth_error", "not_configured");
    return NextResponse.redirect(destination);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) destination.searchParams.set("auth_error", "invalid_link");
  return NextResponse.redirect(destination);
}
