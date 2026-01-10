import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase pentru utilizare pe server-side (API routes, Server Actions).
 * 
 * Acest client folosește service_role key și bypass-uiește Row Level Security.
 * ⚠️ IMPORTANT: Folosește DOAR pe server, NICIODATĂ pe client!
 * 
 * Use cases:
 * - Webhook-uri care trebuie să insereze date fără autentificare
 * - Operațiuni admin care au nevoie de acces complet
 * - Background jobs care rulează pe server
 * 
 * @see https://supabase.com/docs/reference/javascript/initializing
 */

let cachedClient: ReturnType<typeof createClient> | null = null;

/**
 * Obține clientul Supabase pentru server-side cu lazy initialization.
 * 
 * Clientul este creat doar când este folosit pentru prima dată,
 * evitând erori la build time când variabilele de mediu nu sunt setate.
 * 
 * @returns {ReturnType<typeof createClient>} - Client Supabase cu privilegii admin
 * @throws {Error} - Dacă variabilele de mediu nu sunt setate
 */
export function getSupabaseServer() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY trebuie setate în .env.local'
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}

/**
 * Alias pentru backwards compatibility.
 * @deprecated Folosește getSupabaseServer() în loc
 */
export const supabaseServer = {
  from: (table: string) => getSupabaseServer().from(table),
};
