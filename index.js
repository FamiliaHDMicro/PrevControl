/* =========================================================
   PREV — INDEX.JS
   Cloudflare Worker
   Triagem Previdenciária + Trabalhista
   ========================================================= */

import {
  getAllSectors,
  getAllBenefits,
  getBenefitsBySector,
  runTriagem,
  RULE_VERSION
} from "./rules.js";


/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const ALLOWED_ORIGIN = "*";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};


/* =========================================================
   RESPOSTAS
   ========================================================= */

function json(data, status = 200, extraHeaders = {}) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        ...JSON_HEADERS,
        ...extraHeaders
      }
    }
  );
}


function errorResponse(
  message,
  status = 400
) {

  return json(
    {
      ok: false,
      error: message
    },
    status
  );
}


/* =========================================================
   CORS
   ========================================================= */

function corsHeaders(request) {

  const origin =
    request.headers.get("Origin");

  /*
   * Durante desenvolvimento mantemos compatibilidade
   * com acesso direto/local.
   *
   * Em produção, ALLOWED_ORIGIN pode ser alterado
   * para o domínio oficial.
   */

  const allowOrigin =
    ALLOWED_ORIGIN === "*"
      ? "*"
      : (
          origin === ALLOWED_ORIGIN
            ? origin
            : ALLOWED_ORIGIN
        );

  return {
    "Access-Control-Allow-Origin":
      allowOrigin,

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400"
  };
}


/* =========================================================
   REQUEST JSON
   ========================================================= */

async function readJson(request) {

  const contentType =
    request.headers.get("Content-Type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new Error(
      "A requisição precisa usar application/json."
    );
  }

  try {

    return await request.json();

  } catch {

    throw new Error(
      "JSON inválido."
    );
  }
}


/* =========================================================
   NORMALIZAÇÃO
   ========================================================= */

function clean(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}


function limitText(
  value,
  max
) {

  const text =
    clean(value);

  return text.slice(
    0,
    max
  );
}


function normalizeAnswers(
  answers
) {

  if (
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers)
  ) {
    return {};
  }

  const result = {};

  for (
    const [key, value]
    of Object.entries(answers)
  ) {

    const safeKey =
      String(key)
        .slice(0, 100);

    if (
      typeof value === "object" &&
      value !== null
    ) {

      result[safeKey] =
        JSON.stringify(value)
          .slice(0, 5000);

    } else {

      result[safeKey] =
        clean(value)
          .slice(0, 5000);
    }
  }

  return result;
}


/* =========================================================
   TICKET
   ========================================================= */

function generateTicket() {

  const now =
    new Date();

  const year =
    now.getUTCFullYear();

  const random =
    crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase();

  return `PC-${year}-${random}`;
}


/* =========================================================
   ADMIN TOKEN
   =========================================================

   IMPORTANTE:

   Nunca colocar o token no JavaScript público.

   Criar no Cloudflare:

   ADMIN_TOKEN

   O painel administrativo deverá enviar:

   Authorization: Bearer SEU_TOKEN

   ========================================================= */

function isAdmin(request, env) {

  const configuredToken =
    clean(env.ADMIN_TOKEN);

  if (!configuredToken) {
    return false;
  }

  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return false;
  }

  const suppliedToken =
    authorization
      .slice(7)
      .trim();

  if (!suppliedToken) {
    return false;
  }

  return suppliedToken === configuredToken;
}


/* =========================================================
   ROTA ADMINISTRATIVA
   ========================================================= */

function requireAdmin(
  request,
  env
) {

  if (
    !isAdmin(
      request,
      env
    )
  ) {

    return errorResponse(
      "Não autorizado.",
      401
    );
  }

  return null;
}


/* =========================================================
   HEALTH
   ========================================================= */

async function handleHealth(
  env
) {

  let database =
    false;

  try {

    if (env.DB) {

      await env.DB
        .prepare(
          "SELECT 1 AS ok"
        )
        .first();

      database = true;
    }

  } catch {

    database = false;
  }

  return json({
    ok: true,
    service: "PREV",
    version: RULE_VERSION,
    database
  });
}


/* =========================================================
   GET /api/sectors
   ========================================================= */

async function handleSectors() {

  return json({
    ok: true,
    sectors:
      getAllSectors()
  });
}


/* =========================================================
   GET /api/benefits
   ========================================================= */

async function handleBenefits(
  url
) {

  const sector =
    clean(
      url.searchParams.get(
        "sector"
      )
    );


  if (sector) {

    return json({
      ok: true,

      sector,

      benefits:
        getBenefitsBySector(
          sector
        )
    });
  }


  return json({
    ok: true,

    benefits:
      getAllBenefits()
  });
}


/* =========================================================
   POST /api/triagem
   ========================================================= */

async function handleTriagem(
  request,
  env
) {

  let body;

  try {

    body =
      await readJson(
        request
      );

  } catch (error) {

    return errorResponse(
      error.message,
      400
    );
  }


  const name =
    limitText(
      body.name,
      120
    );


  const phone =
    limitText(
      body.phone,
      40
    );


  const sector =
    limitText(
      body.sector,
      80
    ) ||
    "nao_classificado";


  const benefitType =
    limitText(
      body.benefit_type,
      100
    ) ||
    "triagem";


  const observation =
    limitText(
      body.observation,
      2000
    );


  const answers =
    normalizeAnswers(
      body.answers
    );


  const consentDocuments =
    Boolean(
      body.consent_documents
    );


  if (!name) {

    return errorResponse(
      "Nome é obrigatório.",
      422
    );
  }


  if (!phone) {

    return errorResponse(
      "Telefone é obrigatório.",
      422
    );
  }


  /*
   * Não aceitar credenciais sensíveis.
   *
   * O PREV nunca deve solicitar:
   * - senha gov.br
   * - senha bancária
   * - senha de e-mail
   * - códigos de autenticação
   */

  const forbiddenPatterns = [
    /senha\s+gov/i,
    /senha\s+banco/i,
    /senha\s+bank/i,
    /senha\s+email/i,
    /senha\s+e-mail/i,
    /codigo\s+de\s+autenticacao/i,
    /código\s+de\s+autenticação/i,
    /token\s+de\s+acesso/i
  ];


  const combinedText =
    JSON.stringify({
      name,
      phone,
      observation,
      answers
    });


  const containsCredential =
    forbiddenPatterns.some(
      pattern =>
        pattern.test(
          combinedText
        )
    );


  if (containsCredential) {

    return errorResponse(
      "Não envie senhas, códigos de autenticação ou credenciais. A triagem não precisa dessas informações.",
      422
    );
  }


  /*
   * Executa o motor de regras.
   */

  const triagem =
    runTriagem(
      benefitType,
      answers
    );


  /*
   * Gera protocolo independente.
   */

  const ticket =
    generateTicket();


  /*
   * Timestamp em UTC.
   */

  const createdAt =
    new Date()
      .toISOString();


  /*
   * Se o D1 não estiver disponível,
   * devolvemos o resultado sem quebrar
   * a experiência do usuário.
   *
   * Em produção, o banco deverá estar
   * configurado.
   */

  if (!env.DB) {

    return json({
      ok: true,

      ticket,

      saved: false,

      warning:
        "Banco de dados não configurado.",

      triagem: {
        ...triagem,

        ticket,

        created_at:
          createdAt,

        consent_documents:
          consentDocuments
      }
    });
  }


  try {

    /*
     * A tabela leads da versão antiga
     * ainda é utilizada como estrutura
     * compatível nesta primeira fase.
     *
     * answers_json guarda as respostas
     * organizadas.
     */

    await env.DB
      .prepare(`
        INSERT INTO leads (
          name,
          phone,
          benefit_type,
          answers_json,
          classification,
          rationale,
          status,
          notes,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(

        name,

        phone,

        benefitType,

        JSON.stringify({
          sector,
          answers,
          observation,
          consent_documents:
            consentDocuments,

          ticket,

          rule_version:
            RULE_VERSION
        }),

        triagem.classification,

        triagem.rationale,

        "novo",

        JSON.stringify({
          ticket,

          sector,

          relevance:
            triagem.relevance,

          relevance_label:
            triagem.relevance_label,

          attention:
            triagem.attention,

          documents:
            triagem.documents,

          education:
            triagem.education,

          consent_documents:
            consentDocuments,

          rule_version:
            RULE_VERSION
        }),

        createdAt
      )
      .run();


    /*
     * Registro confirmado.
     */

    return json({

      ok: true,

      saved: true,

      ticket,

      triagem: {

        ...triagem,

        ticket,

        created_at:
          createdAt,

        consent_documents:
          consentDocuments
      }

    });


  } catch (error) {

    console.error(
      "Erro D1 /api/triagem:",
      error
    );


    return json({

      ok: false,

      saved: false,

      ticket,

      error:
        "Não foi possível registrar a triagem no momento.",

      triagem: {

        ...triagem,

        ticket,

        created_at:
          createdAt,

        consent_documents:
          consentDocuments
      }

    }, 500);
  }
}


/* =========================================================
   ADMIN — GET /api/admin/leads
   ========================================================= */

async function handleAdminLeads(
  request,
  env,
  url
) {

  const denied =
    requireAdmin(
      request,
      env
    );

  if (denied) {
    return denied;
  }


  if (!env.DB) {

    return errorResponse(
      "Banco de dados não configurado.",
      500
    );
  }


  const status =
    clean(
      url.searchParams.get(
        "status"
      )
    );


  const limitRaw =
    Number(
      url.searchParams.get(
        "limit"
      ) || 100
    );


  const limit =
    Math.min(
      Math.max(
        Number.isFinite(limitRaw)
          ? limitRaw
          : 100,
        1
      ),
      500
    );


  try {

    let result;


    if (status) {

      result =
        await env.DB
          .prepare(`
            SELECT
              id,
              name,
              phone,
              benefit_type,
              answers_json,
              classification,
              rationale,
              status,
              notes,
              created_at,
              contacted_at
            FROM leads
            WHERE status = ?
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .bind(
            status,
            limit
          )
          .all();

    } else {

      result =
        await env.DB
          .prepare(`
            SELECT
              id,
              name,
              phone,
              benefit_type,
              answers_json,
              classification,
              rationale,
              status,
              notes,
              created_at,
              contacted_at
            FROM leads
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .bind(
            limit
          )
          .all();
    }


    return json({

      ok: true,

      leads:
        result.results || []

    });


  } catch (error) {

    console.error(
      "Erro admin leads:",
      error
    );

    return errorResponse(
      "Não foi possível carregar os atendimentos.",
      500
    );
  }
}


/* =========================================================
   ADMIN — PATCH /api/admin/leads/status
   ========================================================= */

async function handleAdminLeadStatus(
  request,
  env
) {

  const denied =
    requireAdmin(
      request,
      env
    );

  if (denied) {
    return denied;
  }


  if (!env.DB) {

    return errorResponse(
      "Banco de dados não configurado.",
      500
    );
  }


  let body;

  try {

    body =
      await readJson(
        request
      );

  } catch (error) {

    return errorResponse(
      error.message,
      400
    );
  }


  const id =
    Number(
      body.id
    );


  const status =
    clean(
      body.status
    );


  const allowedStatuses = [
    "novo",
    "contatado",
    "fechado"
  ];


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return errorResponse(
      "ID inválido.",
      422
    );
  }


  if (
    !allowedStatuses.includes(
      status
    )
  ) {

    return errorResponse(
      "Status inválido.",
      422
    );
  }


  try {

    const contactedAt =
      status === "contatado"
        ? new Date()
            .toISOString()
        : null;


    await env.DB
      .prepare(`
        UPDATE leads
        SET
          status = ?,
          contacted_at = ?
        WHERE id = ?
      `)
      .bind(
        status,
        contactedAt,
        id
      )
      .run();


    return json({
      ok: true,
      id,
      status
    });


  } catch (error) {

    console.error(
      "Erro status lead:",
      error
    );

    return errorResponse(
      "Não foi possível atualizar o atendimento.",
      500
    );
  }
}


/* =========================================================
   ADMIN — GET /api/admin/stats
   ========================================================= */

async function handleAdminStats(
  request,
  env
) {

  const denied =
    requireAdmin(
      request,
      env
    );

  if (denied) {
    return denied;
  }


  if (!env.DB) {

    return errorResponse(
      "Banco de dados não configurado.",
      500
    );
  }


  try {

    const result =
      await env.DB
        .prepare(`
          SELECT
            COUNT(*) AS total,

            SUM(
              CASE
                WHEN status = 'novo'
                THEN 1
                ELSE 0
              END
            ) AS novos,

            SUM(
              CASE
                WHEN status = 'contatado'
                THEN 1
                ELSE 0
              END
            ) AS contatados,

            SUM(
              CASE
                WHEN status = 'fechado'
                THEN 1
                ELSE 0
              END
            ) AS fechados

          FROM leads
        `)
        .first();


    return json({

      ok: true,

      stats: {
        total:
          Number(
            result?.total || 0
          ),

        novos:
          Number(
            result?.novos || 0
          ),

        contatados:
          Number(
            result?.contatados || 0
          ),

        fechados:
          Number(
            result?.fechados || 0
          )
      }

    });


  } catch (error) {

    console.error(
      "Erro admin stats:",
      error
    );

    return errorResponse(
      "Não foi possível carregar as estatísticas.",
      500
    );
  }
}


/* =========================================================
   ROTEADOR
   ========================================================= */

async function router(
  request,
  env
) {

  const url =
    new URL(
      request.url
    );


  const pathname =
    url.pathname;


  const method =
    request.method
      .toUpperCase();


  /*
   * OPTIONS
   */

  if (method === "OPTIONS") {

    return new Response(
      null,
      {
        status: 204
      }
    );
  }


  /*
   * Health
   */

  if (
    pathname === "/api/health" &&
    method === "GET"
  ) {

    return handleHealth(
      env
    );
  }


  /*
   * Setores
   */

  if (
    pathname === "/api/sectors" &&
    method === "GET"
  ) {

    return handleSectors();
  }


  /*
   * Benefícios / assuntos
   */

  if (
    pathname === "/api/benefits" &&
    method === "GET"
  ) {

    return handleBenefits(
      url
    );
  }


  /*
   * Triagem
   */

  if (
    pathname === "/api/triagem" &&
    method === "POST"
  ) {

    return handleTriagem(
      request,
      env
    );
  }


  /*
   * ADMIN — leads
   */

  if (
    pathname === "/api/admin/leads" &&
    method === "GET"
  ) {

    return handleAdminLeads(
      request,
      env,
      url
    );
  }


  /*
   * ADMIN — alterar status
   */

  if (
    pathname === "/api/admin/leads/status" &&
    method === "PATCH"
  ) {

    return handleAdminLeadStatus(
      request,
      env
    );
  }


  /*
   * ADMIN — estatísticas
   */

  if (
    pathname === "/api/admin/stats" &&
    method === "GET"
  ) {

    return handleAdminStats(
      request,
      env
    );
  }


  /*
   * API inexistente
   */

  if (
    pathname.startsWith(
      "/api/"
    )
  ) {

    return errorResponse(
      "Endpoint não encontrado.",
      404
    );
  }


  /*
   * Assets públicos
   *
   * O binding ASSETS entrega:
   * index.html
   * CSS
   * JS
   * imagens
   * etc.
   */

  if (env.ASSETS) {

    return env.ASSETS.fetch(
      request
    );
  }


  return new Response(
    "PREV",
    {
      status: 200,
      headers: {
        "Content-Type":
          "text/plain; charset=utf-8"
      }
    }
  );
}


/* =========================================================
   WORKER
   ========================================================= */

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    const cors =
      corsHeaders(
        request
      );


    try {

      const response =
        await router(
          request,
          env
        );


      /*
       * Adiciona CORS sem destruir
       * os headers originais.
       */

      const headers =
        new Headers(
          response.headers
        );


      for (
        const [key, value]
        of Object.entries(cors)
      ) {

        headers.set(
          key,
          value
        );
      }


      return new Response(
        response.body,
        {
          status:
            response.status,

          statusText:
            response.statusText,

          headers
        }
      );


    } catch (error) {

      console.error(
        "PREV Worker error:",
        error
      );


      return new Response(

        JSON.stringify({
          ok: false,
          error:
            "Erro interno do servidor."
        }),

        {
          status: 500,

          headers: {
            ...JSON_HEADERS,
            ...cors
          }
        }
      );
    }
  }

};
