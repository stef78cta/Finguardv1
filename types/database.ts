/**
 * Tipuri TypeScript generate din schema Supabase.
 * 
 * Aceste tipuri vor fi actualizate automat când schema DB se schimbă.
 * Pentru a regenera tipurile, rulează:
 * 
 * ```bash
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 * ```
 * 
 * @see https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'professional' | 'enterprise';
          subscription_status: 'active' | 'inactive' | 'trial' | 'cancelled';
          trial_ends_at: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'professional' | 'enterprise';
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled';
          trial_ends_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'professional' | 'enterprise';
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled';
          trial_ends_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          cui: string | null;
          reg_com: string | null;
          industry: string | null;
          company_size: string | null;
          address: string | null;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          cui?: string | null;
          reg_com?: string | null;
          industry?: string | null;
          company_size?: string | null;
          address?: string | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          cui?: string | null;
          reg_com?: string | null;
          industry?: string | null;
          company_size?: string | null;
          address?: string | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Adaugă alte tabele pe măsură ce le folosești
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
