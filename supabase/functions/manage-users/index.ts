import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseClient
      .schema("sandbox")
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Akses ditolak. Hanya admin dibenarkan." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      // faite entièrement côté base (fonction sandbox.list_registered_profiles),
      // au lieu de paginer tout auth.users et d'embarquer une liste d'IDs
      // potentiellement énorme dans l'URL — ça évite les erreurs de protocole
      // HTTP/2 une fois que cette liste devient trop longue.
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
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows = data || [];
      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const users = rows.map(({ total_count, ...rest }) => rest);

      return new Response(JSON.stringify({
        users,
        total,
        page,
        pageSize,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= UPDATE ROLE =============
    if (action === "updateRole") {
      const { targetId, newRole } = body;

      if (!targetId || !newRole) {
        return new Response(JSON.stringify({ error: "Data tidak lengkap" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabaseAdmin
        .schema("sandbox")
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetId);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= DELETE =============
    if (action === "delete") {
      const { targetId } = body;

      if (!targetId) {
        return new Response(JSON.stringify({ error: "Data tidak lengkap" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (targetId === user.id) {
        return new Response(JSON.stringify({ error: "Anda tidak boleh memadam akaun anda sendiri." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Tindakan tidak dikenali" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});