import { createBrowserClient } from "@supabase/ssr";

// Create a single supabase client for interacting with your database
const supabaseClient = createBrowserClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default supabaseClient;
