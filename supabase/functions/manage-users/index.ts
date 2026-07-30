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
      const sortDir = body.sortDir === "desc" ? true : false; // ascending: false

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Un seul appel à l'API Admin Auth, fait AVANT la requête profiles cette fois —
      // pour pouvoir exclure les sessions anonymes (operasi/pemandu/agensi via kod akses)
      // dès la requête paginée, sans fausser le compte total ni la pagination.
      const pendingMap = new Map<string, boolean>();
      const anonymousIds: string[] = [];
      {
        let authPage = 1;
        const authPerPage = 200; // large marge, ajuste si ta base a plus de comptes que ça
        let keepGoing = true;
        while (keepGoing) {
          const { data: authPageData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
            page: authPage,
            perPage: authPerPage,
          });
          if (authListError || !authPageData?.users?.length) break;
          for (const u of authPageData.users) {
            pendingMap.set(u.id, !u.email_confirmed_at);
            if (u.is_anonymous) anonymousIds.push(u.id);
          }
          keepGoing = authPageData.users.length === authPerPage;
          authPage += 1;
        }
      }

      let query = supabaseAdmin
        .schema("sandbox")
        .from("profiles")
        .select("id, username, role, email", { count: "exact" });

      if (anonymousIds.length > 0) {
        query = query.not("id", "in", `(${anonymousIds.join(",")})`);
      }

      if (search) {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      query = query.order(sortBy, { ascending: !sortDir }).range(from, to);

      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) {
        return new Response(JSON.stringify({ error: profilesError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const usersWithStatus = (profiles || []).map((p) => ({
        ...p,
        pending: pendingMap.get(p.id) ?? false,
      }));

      return new Response(JSON.stringify({
        users: usersWithStatus,
        total: count ?? 0,
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