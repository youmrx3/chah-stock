import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function buildClient() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      "Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment."
    );
  }
  try {
    return createClient<Database>(SUPABASE_URL || "https://placeholder.supabase.co", SUPABASE_PUBLISHABLE_KEY || "placeholder", {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch {
    console.warn("Failed to create Supabase client. Check your environment variables.");
    return createClient<Database>("https://placeholder.supabase.co", "placeholder", {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
    });
  }
}

export const supabase = buildClient();