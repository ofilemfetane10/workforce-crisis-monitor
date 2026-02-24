import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // IMPORTANT: don't throw at import-time; throw only when called
  if (!url) throw new Error("supabaseUrl is required.");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}