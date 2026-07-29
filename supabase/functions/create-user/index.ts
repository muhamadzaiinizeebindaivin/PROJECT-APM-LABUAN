import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ Remplace par ton vrai domaine de production une fois déployé
const ALLOWED_ORIGIN = "https://project-apm-labuan.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["admin", "pentadbiran", "kewangan", "logistik", "angkatan", "sekretariat", "latihan", "operasi"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Traduit les messages d'erreur techniques (contrainte de clé unique, Auth "already registered", etc.)
// en un texte clair pour l'utilisateur.
function friendlyDuplicateEmailMessage(raw: string): string {
  const lower = raw.toLowerCase();
  const isDuplicate =
    lower.includes("duplicate key value violates unique constraint") ||
    lower.includes("already registered") ||
    lower.includes("already exists");
  return isDuplicate ? "E-mel ini sudah wujud." : raw;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Vérifie l'identité de l'appelant ──
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Non authentifié" }, 401);
    }

    // ── 2. Vérifie que l'appelant est bien admin ──
    const { data: callerProfile } = await supabaseClient
      .schema("sandbox")
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse({ error: "Akses ditolak. Hanya admin dibenarkan." }, 403);
    }

    // ── 3. Valide les données reçues ──
    const { displayName, email, role } = await req.json();

    if (!displayName || !email || !role) {
      return jsonResponse({ error: "Data tidak lengkap" }, 400);
    }

    const cleanDisplayName = String(displayName).trim();
    const cleanEmail = String(email).toLowerCase().trim();

    if (cleanDisplayName.length === 0 || cleanDisplayName.length > MAX_NAME_LENGTH) {
      return jsonResponse({ error: `Nama mestilah antara 1 dan ${MAX_NAME_LENGTH} aksara.` }, 400);
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return jsonResponse({ error: "Format e-mel tidak sah." }, 400);
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return jsonResponse({ error: "Peranan tidak sah." }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 4. Vérifie si un profil existe déjà pour cet e-mail, AVANT toute création ──
    // Empêche d'atteindre le chemin de nettoyage plus bas pour un compte auth qui existait déjà
    // avant cet appel (ce qui supprimerait par erreur un compte utilisateur légitime).
    const { data: existingProfile } = await supabaseAdmin
      .schema("sandbox")
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return jsonResponse({ error: "E-mel ini sudah wujud." }, 400);
    }

    // ── 5. Crée le compte auth (via clé service_role) ──
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      { redirectTo: ALLOWED_ORIGIN }
    );

    if (createError) {
      return jsonResponse({ error: friendlyDuplicateEmailMessage(createError.message) }, 400);
    }

    // ── 6. Crée le profil lié ──
    const { error: profileError } = await supabaseAdmin
      .schema("sandbox")
      .from("profiles")
      .insert([{
        id: newUser.user.id,
        username: cleanDisplayName,
        role,
        email: cleanEmail,
      }]);

    if (profileError) {
      // Ce compte auth vient tout juste d'être créé par cet appel précis (aucun profil
      // n'existait avant, vérifié à l'étape 4) — sûr de le nettoyer ici.
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return jsonResponse({ error: friendlyDuplicateEmailMessage(profileError.message) }, 400);
    }

    return jsonResponse({ success: true, displayName: cleanDisplayName, role }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});