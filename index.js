// index.js — PrevControl Worker
// API principal do sistema

import {
  getAllBenefits,
  getAllSectors,
  getBenefitsBySector,
  getBenefitConfig,
  runTriagem,
  CLASSIFICATION_LABELS
} from "./rules.js";

export default {

  async fetch(request, env, ctx) {

    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // =========================================================
    // CONFIGURAÇÃO PÚBLICA
    // =========================================================

    if (path === "/api/sectors" && request.method === "GET") {
      return json({
        sectors: getAllSectors()
      }, corsHeaders);
    }

    if (path === "/api/benefits" && request.method === "GET") {
      return json({
        benefits: getAllBenefits()
      }, corsHeaders);
    }

    if (path === "/api/benefits/previdencia" && request.method === "GET") {
      return json({
        benefits: getBenefitsBySector("previdencia")
      }, corsHeaders);
    }

    if (path === "/api/benefits/trabalhista" && request.method === "GET") {
      return json({
        benefits: getBenefitsBySector("trabalhista")
      }, corsHeaders);
    }

    if (path === "/api/benefits/empresarial" && request.method === "GET") {
      return json({
        benefits: getBenefitsBySector("empresarial")
      }, corsHeaders);
    }

    // =========================================================
    // TRIAGEM
    // =========================================================

    if (path === "/api/triagem" && request.method === "POST") {

      try {

        const body = await request.json();

        const {
          name,
          phone,
          benefit_type,
          answers
        } = body;

        if (!name || !phone || !benefit_type || !answers) {
          throw new Error("Dados incompletos.");
        }

        const benefit = getBenefitConfig(benefit_type);

        if (!benefit) {
          throw new Error("Assunto não reconhecido.");
        }

        const result = runTriagem(
          benefit_type,
          answers
        );

        const leadId = await salvarLead(
          env,
          {
            name,
            phone,
            benefit_type,
            answers,
            result
          }
        );

        const label =
          CLASSIFICATION_LABELS[result.class] ||
          "Necessita análise";

        const docWarning =
          "\n\nPara uma análise completa, separe seus documentos. " +
          "O sistema faz apenas uma triagem inicial e não substitui " +
          "a conferência de um profissional.";

        const msg =
          `Olá! Sou ${name}. Fiz a triagem no PrevControl.` +
          `\n📋 Assunto: ${benefit.label}` +
          `\n📌 Resultado inicial: ${label}` +
          `\n📝 ${result.rationale}` +
          docWarning;

        const waNumber =
          env.WHATSAPP_NUMBER ||
          "5517991087449";

        const waLink =
          `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

        return json({
          lead_id: leadId,
          sector: benefit.sector,
          benefit_type,
          benefit_label: benefit.label,
          classification: result.class,
          classification_label: label,
          rationale: result.rationale,
          whatsapp_link: waLink
        }, corsHeaders);

      } catch (error) {

        return json({
          error: error.message || "Erro na triagem."
        }, corsHeaders, 400);
      }
    }

    // =========================================================
    // ADMIN — LEADS
    // =========================================================

    if (
      path === "/api/admin/leads" &&
      request.method === "GET"
    ) {

      return handleAdminAuth(
        request,
        env,
        async () => {

          const filter =
            url.searchParams.get("classification");

          const status =
            url.searchParams.get("status");

          const sector =
            url.searchParams.get("sector");

          let query =
            "SELECT * FROM leads";

          const conditions = [];
          const params = [];

          if (filter) {
            conditions.push(
              "classification = ?"
            );

            params.push(filter);
          }

          if (status) {
            conditions.push(
              "status = ?"
            );

            params.push(status);
          }

          if (sector) {
            conditions.push(
              "sector = ?"
            );

            params.push(sector);
          }

          if (conditions.length) {
            query +=
              " WHERE " +
              conditions.join(" AND ");
          }

          query +=
            " ORDER BY created_at DESC LIMIT 200";

          const result =
            await env.DB
              .prepare(query)
              .bind(...params)
              .all();

          return json({
            leads: result.results
          }, corsHeaders);

        },
        corsHeaders
      );
    }

    // =========================================================
    // FALLBACK
    // =========================================================

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "Not found",
      {
        status: 404,
        headers: corsHeaders
      }
    );
  }
};


// =============================================================
// SALVAR LEAD
// =============================================================

async function salvarLead(
  env,
  {
    name,
    phone,
    benefit_type,
    answers,
    result
  }
) {

  const benefit =
    getBenefitConfig(benefit_type);

  const sector =
    benefit?.sector || "desconhecido";

  const stmt =
    env.DB.prepare(`
      INSERT INTO leads
      (
        name,
        phone,
        benefit_type,
        answers_json,
        classification,
        rationale,
        status,
        sector
      )
      VALUES (?, ?, ?, ?, ?, ?, 'novo', ?)
    `)
    .bind(
      name,
      phone,
      benefit_type,
      JSON.stringify(answers),
      result.class,
      result.rationale,
      sector
    );

  const insertResult =
    await stmt.run();

  return insertResult.meta.last_row_id;
}


// =============================================================
// AUTENTICAÇÃO ADMIN
// =============================================================

async function handleAdminAuth(
  request,
  env,
  handler,
  corsHeaders
) {

  const auth =
    request.headers.get("Authorization") || "";

  const token =
    auth.replace("Bearer ", "");

  const validTokens = [
    env.ADMIN_TOKEN,
    env.USER1_TOKEN,
    env.USER2_TOKEN
  ].filter(Boolean);

  if (!validTokens.includes(token)) {

    return json(
      {
        error: "Não autorizado"
      },
      corsHeaders,
      401
    );
  }

  return handler();
}


// =============================================================
// JSON
// =============================================================

function json(
  data,
  corsHeaders,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        ...corsHeaders
      }
    }
  );
}
