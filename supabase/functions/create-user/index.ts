import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ Remplace par ton vrai domaine de production une fois déployé
const ALLOWED_ORIGIN = "http://localhost:8081";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ALLOWED_ROLES = ["admin", "sekretariat"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;

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

    // ── 4. Crée le compte auth (via clé service_role) ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      { redirectTo: ALLOWED_ORIGIN }
    );

    if (createError) {
      return jsonResponse({ error: createError.message }, 400);
    }

    // ── 5. Crée le profil lié ──
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
      // Nettoyage : si le profil échoue, on retire le compte auth orphelin créé juste avant
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return jsonResponse({ error: profileError.message }, 400);
    }

    return jsonResponse({ success: true, displayName: cleanDisplayName, role }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});