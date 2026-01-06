import { createServerClient } from "@supabase/ssr";
import type { Database } from "../../database.types";

/**
 * Create a Supabase server client for use in loaders and actions
 * This client handles cookies automatically for SSR
 *
 * @param request - The Request object from React Router loader/action
 * @returns Supabase client instance configured for server-side use
 *
 * @example
 * ```ts
 * export const loader = async ({ request }: Route.LoaderArgs) => {
 *   const supabase = createSupabaseServerClient(request);
 *   const { data } = await supabase.from('table').select();
 *   return { data };
 * };
 * ```
 */
export function createSupabaseServerClient(request: Request) {
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
        // Note: In React Router v7, you typically can't set cookies directly in loaders
        // Cookies are usually set via responses or actions
        // This is a placeholder - actual cookie setting should be handled in actions
        cookiesToSet.forEach(({ name, value, options }) => {
          // In a real implementation, you'd set cookies via the response
          // For now, we'll just log (this won't actually set cookies)
          console.log(`Would set cookie: ${name}=${value}`, options);
        });
      },
    },
  });
}
