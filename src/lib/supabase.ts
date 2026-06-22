import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const _url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const _anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Configured only when both values are real, not the placeholders from .env.
export const isSupabaseConfigured = Boolean(
  _url && _anonKey && _url.startsWith('http') && !_url.includes('your-project'),
);

// Null when not configured, so the rest of the app can fall back to offline mode.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(_url!, _anonKey!)
  : null;
