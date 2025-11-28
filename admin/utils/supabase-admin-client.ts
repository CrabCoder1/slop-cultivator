/**
 * Supabase Admin Client
 * 
 * WARNING: This client uses the SERVICE_ROLE key which bypasses RLS.
 * Only use this in the admin tool, never in production client code.
 * 
 * The service role key should NEVER be exposed to end users.
 * This admin tool is for development use only.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error(
    'Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.\n' +
    'This is required for the admin tool to bypass RLS policies.\n' +
    'Add it to your .env file (never commit this key to git!).'
  );
}

/**
 * Admin client with service role privileges
 * Bypasses Row Level Security policies
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
