import { redirect } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";

export async function completeOAuth(supabase: SupabaseClient<Database>, request: Request, headers: Headers) {
  const params = new URL(request.url).searchParams;
  if (params.has("error")) return redirect("/login?error=oauth_cancelled", { headers });
  const code = params.get("code");
  if (!code) return redirect("/login?error=auth_failed", { headers });
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return redirect("/login?error=auth_failed", { headers });
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("nickname").eq("id", data.user.id).single();
    if (profileError || !profile) return redirect("/login?error=profile_unavailable", { headers });
    return redirect(profile.nickname.trim() ? "/my-resume" : "/profile", { headers });
  } catch {
    console.error("OAuth callback failed");
    return redirect("/login?error=auth_failed", { headers });
  }
}
