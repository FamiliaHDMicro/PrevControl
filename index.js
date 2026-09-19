// index.js — PrevControl Worker (Versão Final Cleiton)
import { getAllBenefits, getBenefitConfig, runTriagem, CLASSIFICATION_LABELS } from "./rules.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // Rota Pública: Carregar Benefícios
    if (path === "/api/benefits" && request.method === "GET") {
      return json({ benefits: getAllBenefits() }, corsHeaders);
    }

    // Rota Pública: Triagem via Formulário Guiado
    if (path === "/api/triagem" && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, phone, benefit_type, answers } = body;
        if (!name || !phone || !benefit_type || !answers) throw new Error("Dados incompletos");

        const result = runTriagem(benefit_type, answers);
        const leadId = await salvarLead(env, { name, phone, benefit_type, answers, result });
        
        // Mensagem Educativa (Estilo Cleiton/Dra.)
        const docWarning = "\n\n⚠️ Para agilizar sua análise completa, já separe: Extrato CNIS, Carteiras de Trabalho antigas, TRCT e Documentos de identidade. Sem esses papéis, a consulta fica incompleta devido às mudanças na lei.";
        
        const msg = `Olá! Sou ${name}. Fiz a triagem no site.\n📋 Assunto: ${benefit_type}\n✅ Resultado: ${CLASSIFICATION_LABELS[result.class]}\n📝 ${result.rationale}${docWarning}`;
        const waLink = `https://wa.me/${env.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

        return json({ 
          lead_id: leadId, 
          classification: result.class, 
          classification_label: CLASSIFICATION_LABELS[result.class], 
          rationale: result.rationale, 
          whatsapp_link: waLink 
        }, corsHeaders);
      } catch (e) {
        return json({ error: e.message }, corsHeaders, 400);
      }
    }

    // Painel Admin: Listar Leads (Protegido Multi-Usuário)
    if (path === "/api/admin/leads" && request.method === "GET") {
      return handleAdminAuth(request, env, async () => {
        const filter = url.searchParams.get("classification");
        const status = url.searchParams.get("status");
        let query = "SELECT * FROM leads";
        const conditions = []; const params = [];
        if (filter) { conditions.push("classification = ?"); params.push(filter); }
        if (status) { conditions.push("status = ?"); params.push(status); }
        if (conditions.length) query += " WHERE " + conditions.join(" AND ");
        query += " ORDER BY created_at DESC LIMIT 200";
        const result = await env.DB.prepare(query).bind(...params).all();
        return json({ leads: result.results }, corsHeaders);
      }, corsHeaders);
    }

    // Fallback: Servir Assets Estáticos (HTML/CSS/JS)
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
};

async function salvarLead(env, { name, phone, benefit_type, answers, result }) {
  const stmt = env.DB.prepare(`INSERT INTO leads (name, phone, benefit_type, answers_json, classification, rationale, status) VALUES (?, ?, ?, ?, ?, ?, 'novo')`)
    .bind(name, phone, benefit_type, JSON.stringify(answers), result.class, result.rationale);
  const insertResult = await stmt.run();
  return insertResult.meta.last_row_id;
}

async function handleAdminAuth(request, env, handler, corsHeaders) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  const validTokens = [env.ADMIN_TOKEN, env.USER1_TOKEN, env.USER2_TOKEN].filter(Boolean);
  if (!validTokens.includes(token)) return json({ error: "Não autorizado" }, corsHeaders, 401);
  return handler();
}

function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}
