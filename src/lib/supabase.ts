import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazily gets or initializes the Supabase client.
 * This prevents runtime crashes during compilation or boot when keys are not yet configured.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  let supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing. " +
      "Please enter them in the Settings -> Secrets menu in the AI Studio UI."
    );
    return null;
  }

  // Sanitize URL: Strip trailing slashes and any accidental /rest/v1
  supabaseUrl = supabaseUrl.trim().replace(/\/+$/, "");
  if (supabaseUrl.toLowerCase().endsWith("/rest/v1")) {
    supabaseUrl = supabaseUrl.slice(0, -8);
  }
  supabaseUrl = supabaseUrl.replace(/\/+$/, "");

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}
