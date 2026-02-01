/**
 * Supabase client re-export
 *
 * Re-exports the Supabase client from the original location for use in the new
 * service architecture. The original client remains at /services/supabaseClient.ts
 * for backward compatibility.
 */

export { supabase, default as supabaseClient } from "@/services/supabaseClient";
