import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Même origine que create-user
const ALLOWED_ORIGIN = "https://project-apm-labuan.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Même liste que create-user — seuls les rôles département sont attribuables ici
const ALLOWED_ROLES = ["admin", "pentadbiran", "kewangan", "logistik", "angkatan", "sekretariat", "latihan", "operasi"];

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Vérifie l'identité de l'appelant ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Non authentifié" }, 401);
    }

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { action } = body;

    // ============= LIST (avec pagination, recherche, tri) =============
    if (action === "list") {
      const page = Math.max(1, body.page || 1);
      const pageSize = Math.min(100, Math.max(1, body.pageSize || 20));
      const search = (body.search || "").trim();
      const sortBy = ["username", "role", "email"].includes(body.sortBy) ? body.sortBy : "username";
      const sortDir = body.sortDir === "desc" ? "desc" : "asc";

      const from = (page - 1) * pageSize;

      // Exclusion des comptes anonymes (operasi/pemandu/agensi via kod akses)
      // faite entièrement côté base (fonction sandbox.list_registered_profiles).
      const { data, error } = await supabaseAdmin
        .schema("sandbox")
        .rpc("list_registered_profiles", {
          p_search: search,
          p_sort_by: sortBy,
          p_sort_dir: sortDir,
          p_limit: pageSize,
          p_offset: from,
        });

      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }

      const rows = data || [];
      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const users = rows.map(({ total_count, ...rest }) => rest);

      return jsonResponse({ users, total, page, pageSize }, 200);
    }

    // ============= UPDATE ROLE =============
    if (action === "updateRole") {
      const { targetId, newRole } = body;

      if (!targetId || !newRole) {
        return jsonResponse({ error: "Data tidak lengkap" }, 400);
      }

      // Empêche un admin de se retirer lui-même ses droits (risque de verrouillage)
      if (targetId === user.id) {
        return jsonResponse({ error: "Anda tidak boleh menukar peranan anda sendiri." }, 400);
      }

      if (!ALLOWED_ROLES.includes(newRole)) {
        return jsonResponse({ error: "Peranan tidak sah." }, 400);
      }

      const { error: updateError } = await supabaseAdmin
        .schema("sandbox")
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetId);

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 400);
      }

      return jsonResponse({ success: true }, 200);
    }

    // ============= DELETE =============
    if (action === "delete") {
      const { targetId } = body;

      if (!targetId) {
        return jsonResponse({ error: "Data tidak lengkap" }, 400);
      }

      if (targetId === user.id) {
        return jsonResponse({ error: "Anda tidak boleh memadam akaun anda sendiri." }, 400);
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId);

      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400);
      }

      return jsonResponse({ success: true }, 200);
    }

    return jsonResponse({ error: "Tindakan tidak dikenali" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});