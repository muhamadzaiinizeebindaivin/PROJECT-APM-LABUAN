// src/supabaseSandboxClient.js
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseSandbox = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'sandbox' },
  auth: {
    storageKey: 'sb-sandbox-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: Platform.OS === 'web' ? window.localStorage : undefined,
  },
});