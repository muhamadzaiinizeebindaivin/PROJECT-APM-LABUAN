// src/supabaseKemaskiniClient.js
//
// Client Supabase isolé, dédié uniquement à KemaskiniDataPage.js. Même
// projet/clé que supabaseSandboxClient.js, mais un storageKey différent —
// la session de connexion ici n'est donc jamais partagée avec l'onglet
// principal de l'app, et vice versa. Ceci est volontaire : la personne en
// charge (admin/angkatan) ouvre une session ICI pour qu'un anggota mette à
// jour ses propres données, sans que cette session ne donne par ailleurs
// accès au reste du tableau de bord dans un autre onglet.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseKemaskini = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'sandbox' },
  auth: {
    storageKey: 'sb-kemaskini-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Cette page ne vit que sur le web (nouvel onglet navigateur) — pas
    // besoin de la branche AsyncStorage utilisée côté natif dans le client
    // principal ; localStorage par défaut suffit.
    storage: undefined,
  },
});
