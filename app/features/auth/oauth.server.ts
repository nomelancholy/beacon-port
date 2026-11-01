import { data, redirect } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";

export async function startOAuth(
  supabase: SupabaseClient<Database>, request: Request, headers: Headers,
  provider: "google" | "github",
) {
  const name = provider === "google" ? "Google" : "GitHub";
  try {
    const { data: result, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${new URL(request.url).origin}/auth/callback` },
    });
    // Forward the PKCE verifier cookie on the document redirect.
    if (!error && result.url) return redirect(result.url, { headers });
  } catch {
    console.error(`${name} OAuth initiation failed`);
  }
  return data({ success: false, error: `${name} 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.` }, { headers });
}
