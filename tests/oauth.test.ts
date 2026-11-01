import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { startOAuth } from "../app/features/auth/oauth.server";

for (const provider of ["google", "github"] as const) {
  test(`${provider} redirects with the current origin and PKCE cookie`, async () => {
    const headers = new Headers();
    const client = { auth: { signInWithOAuth: async (options: unknown) => {
      assert.deepEqual(options, { provider, options: { redirectTo: "https://preview.example.test/auth/callback" } });
      headers.append("Set-Cookie", "pkce-verifier=test; Path=/; SameSite=Lax");
      return { data: { url: `https://auth.example.test/authorize?provider=${provider}` }, error: null };
    } } } as unknown as SupabaseClient<Database>;
    const response = await startOAuth(client, new Request("https://preview.example.test/login"), headers, provider);
    assert.ok(response instanceof Response);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), `https://auth.example.test/authorize?provider=${provider}`);
    assert.match(response.headers.get("set-cookie") || "", /pkce-verifier=test/);
  });
}

test("provider errors produce a visible error instead of redirecting", async () => {
  for (const fails of ["error", "missing-url", "throw"]) {
    const client = { auth: { signInWithOAuth: async () => {
      if (fails === "throw") throw new Error("Network error");
      return { data: { url: null }, error: fails === "error" ? new Error("Provider disabled") : null };
    } } } as unknown as SupabaseClient<Database>;
    const result = await startOAuth(client, new Request("http://localhost:5173/signup"), new Headers(), "google");
    assert.ok(!(result instanceof Response));
    assert.equal(result.data.success, false);
    assert.match(result.data.error, /Google/);
  }
});
