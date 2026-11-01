import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { startOAuth } from "../app/features/auth/oauth.server";
import { completeOAuth } from "../app/features/auth/oauth-callback.server";

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

test("callback completes a GitHub session and forwards new cookies", async () => {
  const headers = new Headers();
  const client = {
    auth: { exchangeCodeForSession: async (code: string) => {
      assert.equal(code, "test-code");
      headers.append("Set-Cookie", "session=test; Path=/");
      headers.append("Set-Cookie", "verifier=; Max-Age=0; Path=/");
      return { data: { user: { id: "user-id" } }, error: null };
    } },
    from: (table: string) => {
      assert.equal(table, "profiles");
      return { select: () => ({ eq: (key: string, id: string) => {
        assert.equal(key, "id"); assert.equal(id, "user-id");
        return { single: async () => ({ data: { nickname: "GitHub User" }, error: null }) };
      } }) };
    },
  } as unknown as SupabaseClient<Database>;
  const response = await completeOAuth(client, new Request("https://example.test/auth/callback?code=test-code"), headers);
  assert.equal(response.headers.get("location"), "/my-resume");
  assert.match(response.headers.get("set-cookie") || "", /session=test/);
  assert.match(response.headers.get("set-cookie") || "", /Max-Age=0/);
});

test("cancelled or missing callbacks do not exchange a code", async () => {
  const client = {} as SupabaseClient<Database>;
  for (const [query, reason] of [["?error=access_denied", "oauth_cancelled"], ["", "auth_failed"]]) {
    const response = await completeOAuth(client, new Request(`https://example.test/auth/callback${query}`), new Headers());
    assert.equal(response.headers.get("location"), `/login?error=${reason}`);
  }
});

test("callback handles expired codes, provider failures and missing profiles", async () => {
  for (const scenario of ["expired", "throw", "missing-user", "missing-profile", "empty-nickname"]) {
    const client = {
      auth: { exchangeCodeForSession: async () => {
        if (scenario === "throw") throw new Error("Connection lost");
        return { data: { user: scenario === "missing-user" ? null : { id: "user-id" } }, error: scenario === "expired" ? new Error("Expired code") : null };
      } },
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({
        data: scenario === "missing-profile" ? null : { nickname: " " },
        error: scenario === "missing-profile" ? new Error("Not found") : null,
      }) }) }) }),
    } as unknown as SupabaseClient<Database>;
    const response = await completeOAuth(client, new Request("https://example.test/auth/callback?code=test"), new Headers());
    const expected = scenario === "missing-profile" ? "/login?error=profile_unavailable"
      : scenario === "empty-nickname" ? "/profile" : "/login?error=auth_failed";
    assert.equal(response.headers.get("location"), expected);
  }
});
