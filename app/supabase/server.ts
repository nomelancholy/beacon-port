import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Database } from "../../database.types";

/**
 * Create a Supabase server client for use in loaders and actions
 * This client handles cookies automatically for SSR
 *
 * @param request - The Request object from React Router loader/action
 * @param responseHeaders - Optional Headers object to set cookies in the response
 * @returns Supabase client instance configured for server-side use
 *
 * @example
 * ```ts
 * export const loader = async ({ request }: Route.LoaderArgs) => {
 *   const headers = new Headers();
 *   const supabase = createSupabaseServerClient(request, headers);
 *   const { data } = await supabase.from('table').select();
 *   return redirect("/path", { headers });
 * };
 * ```
 */
export function createSupabaseServerClient(
  request: Request,
  responseHeaders?: Headers
) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

  const cookies = new Map(parseCookieHeader(request.headers.get("cookie") || "")
    .map(({ name, value }) => [name, value || ""]));

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return [...cookies].map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value);
          responseHeaders?.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
      },
    },
  });
}
