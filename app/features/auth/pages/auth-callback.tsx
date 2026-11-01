import type { Route } from "./+types/auth-callback";
import { createSupabaseServerClient } from "~/supabase/server";
import { completeOAuth } from "../oauth-callback.server";

export function meta() {
  return [{ title: "인증 중 - Beacon Port" }];
}

export const loader = ({ request }: Route.LoaderArgs) => {
  const headers = new Headers();
  return completeOAuth(createSupabaseServerClient(request, headers), request, headers);
};
