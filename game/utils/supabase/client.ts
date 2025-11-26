import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    // Enable PKCE flow for enhanced OAuth security
    flowType: 'pkce',
    // Automatically detect and exchange auth code in URL after OAuth redirect
    detectSessionInUrl: true,
    // Use default localStorage for session storage
    storage: window.localStorage,
    // Enable debug logging in development
    debug: process.env.NODE_ENV === 'development',
  },
});
