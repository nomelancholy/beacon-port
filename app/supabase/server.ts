import { createServerClient } from "@supabase/ssr";
import type { Database } from "../../database.types";

/**
 * Serialize cookie options to Set-Cookie header string
 */
function serializeCookieHeader(
  name: string,
  value: string,
  options?: any
): string {
  let cookieString = `${name}=${value}`;
  if (options) {
    if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
    if (options.domain) cookieString += `; Domain=${options.domain}`;
    if (options.path) cookieString += `; Path=${options.path}`;
    if (options.secure) cookieString += `; Secure`;
    if (options.httpOnly) cookieString += `; HttpOnly`;
    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }
  }
  return cookieString;
}

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

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Get all cookies from the request
        const cookieHeader = request.headers.get("cookie") || "";
        const cookies: { name: string; value: string }[] = [];

        if (cookieHeader) {
          cookieHeader.split(";").forEach((cookie: string) => {
            const [name, ...rest] = cookie.trim().split("=");
            const value = rest.join("=");
            if (name && value) {
              cookies.push({ name, value });
            }
          });
        }

        return cookies;
      },
      setAll(cookiesToSet) {
        // Set cookies directly in response headers if provided
        if (responseHeaders) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieString = serializeCookieHeader(name, value, options);
            responseHeaders.append("Set-Cookie", cookieString);
          });
        }
      },
    },
  });
}
