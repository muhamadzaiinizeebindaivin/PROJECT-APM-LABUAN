// src/supabaseSandboxClient.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseSandbox = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'sandbox' },
  auth: {
    storageKey: 'sb-sandbox-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: AsyncStorage,
  },
});