// src/supabaseSandboxClient.js
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
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

// Les timers JS classiques utilisés par autoRefreshToken sont mis en pause
// quand l'app/l'onglet passe en arrière-plan (particulièrement agressif sur
// iOS, natif comme Safari) — le token peut donc expirer silencieusement
// pendant ce temps. On force explicitement la reprise/l'arrêt du
// rafraîchissement selon l'état réel de l'app, comme recommandé par
// Supabase — une branche pour le natif (AppState), une pour le web
// (visibilitychange), puisque ni l'une ni l'autre n'existe sur toutes
// les plateformes.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabaseSandbox.auth.startAutoRefresh();
    } else {
      supabaseSandbox.auth.stopAutoRefresh();
    }
  });
} else if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabaseSandbox.auth.startAutoRefresh();
    } else {
      supabaseSandbox.auth.stopAutoRefresh();
    }
  });
}