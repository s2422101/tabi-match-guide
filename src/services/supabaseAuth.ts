import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const authConfigurationError =
  supabaseUrl && supabaseAnonKey
    ? null
    : "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured.";

let client: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (client) {
    return client;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
