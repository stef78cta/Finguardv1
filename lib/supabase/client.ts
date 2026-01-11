import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Client Supabase pentru utilizare pe client-side (browser).
 * 
 * Acest client respectă Row Level Security (RLS) și folosește
 * autentificarea utilizatorului curent din Clerk.
 * 
 * ⚠️ IMPORTANT: Folosește DOAR pe client-side (componente, hooks React).
 * Pentru server-side (API routes, Server Actions), folosește getSupabaseServer().
 * 
 * Use cases:
 * - Queries din componente React client-side
 * - Real-time subscriptions
 * - Operațiuni CRUD în contextul utilizatorului autentificat
 * - Orice operațiune care trebuie să respecte RLS policies
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;
let cachedClient: SupabaseBrowserClient | null = null;

/**
 * Obține clientul Supabase pentru browser cu lazy initialization.
 * 
 * Clientul este creat doar când este folosit pentru prima dată,
 * și este cached pentru utilizări ulterioare.
 * 
 * Acest client:
 * - Respectă RLS policies (accesează doar datele permise utilizatorului)
 * - Gestionează automat token-urile de autentificare
 * - Sincronizează sesiunea între tab-uri
 * - Suportă real-time subscriptions
 * 
 * @returns {ReturnType<typeof createBrowserClient<Database>>} - Client Supabase type-safe
 * @throws {Error} - Dacă variabilele de mediu nu sunt setate
 * 
 * @example
 * ```typescript
 * // În componente React client-side
 * 'use client';
 * 
 * import { getSupabaseClient } from '@/lib/supabase/client';
 * 
 * export function MyComponent() {
 *   const supabase = getSupabaseClient();
 *   
 *   const fetchCompanies = async () => {
 *     const { data, error } = await supabase
 *       .from('companies')
 *       .select('*')
 *       .eq('is_active', true);
 *     
 *     if (error) throw error;
 *     return data;
 *   };
 * }
 * ```
 */
export function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY trebuie setate în .env.local'
    );
  }

  cachedClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Detectează automat provider-ul de autentificare (Clerk în cazul nostru)
      detectSessionInUrl: true,
      // Persistă sesiunea în localStorage
      persistSession: true,
      // Auto-refresh token când expiră
      autoRefreshToken: true,
    },
    // Configurare pentru SSR cu Next.js
    cookies: {
      get(name: string) {
        // Supabase SSR va gestiona cookies automat în browser
        const cookieStore = document.cookie;
        const match = cookieStore.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
      },
      set(name: string, value: string, options: any) {
        document.cookie = `${name}=${value}; path=/; ${options.maxAge ? `max-age=${options.maxAge}` : ''}`;
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
      },
    },
  });

  return cachedClient;
}

/**
 * Hook React pentru utilizarea clientului Supabase în componente.
 * 
 * Acest hook este o convenție pentru consistență cu alte hooks React.
 * În prezent returnează direct clientul, dar poate fi extins în viitor
 * pentru a include funcționalități suplimentare (ex: loading states).
 * 
 * @returns {ReturnType<typeof createBrowserClient<Database>>} - Client Supabase type-safe
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * import { useSupabase } from '@/lib/supabase/client';
 * import { useEffect, useState } from 'react';
 * 
 * export function CompanyList() {
 *   const supabase = useSupabase();
 *   const [companies, setCompanies] = useState([]);
 *   
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data } = await supabase
 *         .from('companies')
 *         .select('*');
 *       setCompanies(data || []);
 *     };
 *     fetchData();
 *   }, [supabase]);
 *   
 *   return <div>{companies.map(c => c.name)}</div>;
 * }
 * ```
 */
export function useSupabase() {
  return getSupabaseClient();
}

/**
 * Alias pentru backwards compatibility și convenție React.
 */
export const supabase = getSupabaseClient;
