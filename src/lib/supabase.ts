import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Asynchronously initializes the Supabase client, fetching configuration from the server
 * dynamically if not present in the compile-time environment variables.
 */
export async function initSupabaseAsync(): Promise<SupabaseClient | null> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  let supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  let supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  // If credentials are not present in compiled client-side env (very common on cPanel builds),
  // fetch them dynamically from the server endpoint at runtime.
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      console.log("[Supabase] Build-time env keys missing. Fetching credentials from backend dynamically...");
      const response = await fetch("/api/supabase-config");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.supabaseUrl && data.supabaseAnonKey) {
          supabaseUrl = data.supabaseUrl;
          supabaseAnonKey = data.supabaseAnonKey;
          console.log("[Supabase] Successfully fetched credentials dynamically from server configuration.");
        }
      }
    } catch (err) {
      console.warn("[Supabase] Failed to fetch dynamic server-side credentials:", err);
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing on both frontend and backend."
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

/**
 * Lazily gets the already initialized Supabase client.
 * Prefer awaiting initSupabaseAsync() during app start/context initialization,
 * then getSupabase() can be called synchronously throughout the app.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  let supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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
