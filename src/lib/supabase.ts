/**
 * Supabase Client Configuration
 * Connects to Supabase for auth, database, and real-time sync
 *
 * Setup:
 * 1. Create a free Supabase project at supabase.com
 * 2. Copy your project URL and anon key
 * 3. Add to .env file:
 *    VITE_SUPABASE_URL=https://your-project.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client (won't crash if not configured)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

console.log('[Supabase]', supabase ? 'Connected' : 'Not configured — using localStorage fallback');
