// ============================================================
// PREVCONTROL — CLOUDFLARE WORKER
// Versão integrada com a landing/frontend atual
// ============================================================

import {
  getAllBenefits,
  getAllSectors,
  getBenefitConfig,
  runTriagem,
  CLASSIFICATION_LABELS
} from "./rules.js";


// ============================================================
// WORKER PRINCIPAL
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };

    // ----------------------------------------------------------
    // CORS / OPTIONS
    // ----------------------------------------------------------

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    // ==========================================================
    // API PÚBLICA
    // ==========================================================

    // ----------------------------------------------------------
    // GET /api/sectors
    // Carrega os setores disponíveis para a triagem
    // ----------------------------------------------------------

    if (
      path === "/api/sectors" &&
      request.method === "GET"
    ) {
      return json(
        {
          success: true,
          sectors: getAllSectors()
        },
        corsHeaders
      );
    }

    // ----------------------------------------------------------
    // GET /api/benefits
    // Carrega os setores/serviços disponíveis para a landing
    // ----------------------------------------------------------

    if (
      path === "/api/benefits" &&
      request.method === "GET"
    ) {
      try {
        const benefits = getAllBenefits();

        return json(
          {
            success: true,
            benefits
          },
          corsHeaders
        );

      } catch (error) {
        return json(
          {
            success: false,
            error: "Não foi possível carregar as opções de atendimento."
          },
          corsHeaders,
          500
        );
      }
    }


    // ----------------------------------------------------------
    // GET /api/benefits/:key
    // Consulta individual de um serviço
    // ----------------------------------------------------------

    if (
      path.startsWith("/api/benefits/") &&
      request.method === "GET"
    ) {
      const key = decodeURIComponent(
        path.replace("/api/benefits/", "")
      );

      const benefit = getBenefitConfig(key);

      if (!benefit) {
        return json(
          {
            success: false,
            error: "Serviço não encontrado."
          },
          corsHeaders,
          404
        );
      }

      return json(
        {
          success: true,
          benefit: {
            key,
            label: benefit.label,
            questions: benefit.questions
          }
        },
        corsHeaders
      );
    }


    // ==========================================================
    // TRIAGEM
    // ==========================================================

    // ----------------------------------------------------------
    // POST /api/triagem
    // Recebe a triagem feita pelo visitante
    // ----------------------------------------------------------

    if (
      path === "/api/triagem" &&
      request.method === "POST"
    ) {
      return handleTriagem(request, env, corsHeaders);
    }


    // ==========================================================
    // LOGIN ADMINISTRATIVO
    // ==========================================================

    // ----------------------------------------------------------
    // POST /api/admin/login
    //
    // Aceita:
    //
    // {
    //   type: "password",
    //   username: "...",
    //   password: "..."
    // }
    //
    // ou
    //
    // {
    //   type: "google",
    //   credential: "..."
    // }
    //
    // O login Google fica bloqueado até que uma validação real
    // seja configurada. Não fingimos que o token é válido.
    // ----------------------------------------------------------

    if (
      path === "/api/admin/login" &&
      request.method === "POST"
    ) {
      return handleAdminLogin(request, env, corsHeaders);
    }


    // ==========================================================
    // ADMIN — LEADS
    // ==========================================================

    // ----------------------------------------------------------
    // GET /api/admin/leads
    // ----------------------------------------------------------

    if (
      path === "/api/admin/leads" &&
      request.method === "GET"
    ) {
      return handleAdminAuth(
        request,
        env,
        corsHeaders,
        async () => {
          return handleAdminLeads(url, env, corsHeaders);
        }
      );
    }


    // ----------------------------------------------------------
    // GET /api/admin/lead/:id
    // ----------------------------------------------------------

    if (
      path.startsWith("/api/admin/lead/") &&
      request.method === "GET"
    ) {
      return handleAdminAuth(
        request,
        env,
        corsHeaders,
        async () => {
          const id = path.replace("/api/admin/lead/", "");

          return handleAdminLead(id, env, corsHeaders);
        }
      );
    }


    // ----------------------------------------------------------
    // PUT /api/admin/lead/:id/status
    // ----------------------------------------------------------

    if (
      path.startsWith("/api/admin/lead/") &&
      path.endsWith("/status") &&
      request.method === "PUT"
    ) {
      return handleAdminAuth(
        request,
        env,
        corsHeaders,
        async () => {
          const id = path
            .replace("/api/admin/lead/", "")
            .replace("/status", "");

          return handleAdminLeadStatus(
            id,
            request,
            env,
            corsHeaders
          );
        }
      );
    }

    // ==========================================================
    // TTS — SÍNTESE DE VOZ
    // ==========================================================

    if (
      path === "/api/tts" &&
      request.method === "POST"
    ) {
      return handleTTS(request, env, corsHeaders);
    }

// ============================================================
// TTS — EDGE TTS (GRATUITO, SEM API KEY)
// ============================================================

async function handleTTS(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const text = String(body.text || "").trim();
    const voice = String(body.voice || "pt-BR-AntonioNeural").trim();

    if (!text) {
      return json(
        { success: false, error: "Texto ausente." },
        corsHeaders,
        400
      );
    }

    // Limite de segurança: 500 caracteres por requisição
    const safeText = text.slice(0, 500);

    // Voices permitidas (whitelist)
    const allowedVoices = [
      "pt-BR-AntonioNeural",
      "pt-BR-FranciscaNeural"
    ];

    const safeVoice = allowedVoices.includes(voice)
      ? voice
      : "pt-BR-AntonioNeural";

    // Chamar Edge TTS (Microsoft, gratuito)
    const edgeResponse = await fetch(
      "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "okhttp/4.5.0"
        },
        body: `<speak version='1.0' xml:lang='pt-BR'>
          <voice xml:lang='pt-BR' xml:gender='${safeVoice.includes("Francisca") ? "Female" : "Male"}' name='${safeVoice}'>
            ${safeText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </voice>
        </speak>`
      }
    );

    if (!edgeResponse.ok) {
      throw new Error(`Edge TTS erro: ${edgeResponse.status}`);
    }

    const audioBuffer = await edgeResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("Erro em /api/tts:", error);

    return json(
      { success: false, error: "Não foi possível gerar áudio." },
      corsHeaders,
      500
    );
  }
}
    // ==========================================================
    // HEALTH CHECK
    // ==========================================================

    // ----------------------------------------------------------
    // GET /api/health
    // ----------------------------------------------------------

    if (
      path === "/api/health" &&
      request.method === "GET"
    ) {
      return json(
        {
          success: true,
          service: "PrevControl",
          status: "online",
          timestamp: new Date().toISOString()
        },
        corsHeaders
      );
    }


    // ==========================================================
    // ASSETS
    // ==========================================================

    // Tudo que não for API vai para os arquivos da landing.
    // Isso impede que uma chamada /api/* seja engolida pelo
    // fallback dos arquivos estáticos.
    // ==========================================================

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }


    // ==========================================================
    // 404
    // ==========================================================

    return json(
      {
        success: false,
        error: "Rota não encontrada."
      },
      corsHeaders,
      404
    );
  }
};


// ============================================================
// TRIAGEM
// ============================================================

async function handleTriagem(
  request,
  env,
  corsHeaders
) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      benefit_type,
      answers
    } = body;


    // ----------------------------------------------------------
    // Validação básica
    // ----------------------------------------------------------

    if (!name || !phone || !benefit_type || !answers) {
      return json(
        {
          success: false,
          error: "Dados incompletos."
        },
        corsHeaders,
        400
      );
    }


    // ----------------------------------------------------------
    // Confirma se o benefício/serviço existe
    // ----------------------------------------------------------

    const benefit = getBenefitConfig(benefit_type);

    if (!benefit) {
      return json(
        {
          success: false,
          error: "O serviço selecionado não foi encontrado."
        },
        corsHeaders,
        400
      );
    }


    // ----------------------------------------------------------
    // Executa motor de triagem
    // ----------------------------------------------------------

    const result = runTriagem(
      benefit_type,
      answers
    );


    // ----------------------------------------------------------
    // Salva lead
    // ----------------------------------------------------------

    let leadId = null;

    if (env.DB) {
      leadId = await salvarLead(
        env,
        {
          name,
          phone,
          benefit_type,
          answers,
          result
        }
      );
    }


    // ----------------------------------------------------------
    // Mensagem educativa para WhatsApp
    // ----------------------------------------------------------

    const docWarning =
      "\n\nPara agilizar sua análise completa, já separe seus documentos. " +
      "Dependendo do caso, podem ser necessários CNIS, carteira de trabalho, " +
      "documentos de rescisão, extratos, comprovantes e documentos pessoais.";


    const classificationLabel =
      CLASSIFICATION_LABELS[result.class] ||
      "Necessita análise documental";


    const msg =
      `Olá! Sou ${name}. Fiz a triagem no site.` +
      `\n📋 Assunto: ${benefit.label}` +
      `\n✅ Resultado: ${classificationLabel}` +
      `\n📝 ${result.rationale}` +
      docWarning;


    let whatsappLink = null;

    if (env.WHATSAPP_NUMBER) {
      whatsappLink =
        `https://wa.me/${env.WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(msg)}`;
    }


    // ----------------------------------------------------------
    // Resposta
    // ----------------------------------------------------------

    return json(
      {
        success: true,
        lead_id: leadId,
        classification: result.class,
        classification_label: classificationLabel,
        rationale: result.rationale,
        whatsapp_link: whatsappLink
      },
      corsHeaders
    );

  } catch (error) {

    console.error(
      "Erro em /api/triagem:",
      error
    );

    return json(
      {
        success: false,
        error: "Não foi possível concluir a triagem."
      },
      corsHeaders,
      500
    );
  }
}


// ============================================================
// LOGIN ADMINISTRATIVO
// ============================================================

async function handleAdminLogin(
  request,
  env,
  corsHeaders
) {
  try {

    const body = await request.json();

    const type = body.type || "password";


    // ----------------------------------------------------------
    // LOGIN POR USUÁRIO E SENHA
    // ----------------------------------------------------------

    if (type === "password") {

      const username =
        String(body.username || "").trim();

      const password =
        String(body.password || "");


      if (!username || !password) {
        return json(
          {
            success: false,
            error: "Usuário e senha são obrigatórios."
          },
          corsHeaders,
          400
        );
      }


      const users = getAdminUsers(env);


      const user = users.find(
        item =>
          item.username === username &&
          item.password &&
          safeEqual(
            item.password,
            password
          )
      );


      if (!user) {
        return json(
          {
            success: false,
            error: "Usuário ou senha incorretos."
          },
          corsHeaders,
          401
        );
      }


      if (!user.token) {
        return json(
          {
            success: false,
            error: "Usuário administrativo sem token configurado."
          },
          corsHeaders,
          500
        );
      }


      return json(
        {
          success: true,
          role: user.role,
          token: user.token
        },
        corsHeaders
      );
    }


    // ----------------------------------------------------------
    // LOGIN GOOGLE
    // ----------------------------------------------------------
    //
    // Não aceitamos simplesmente o credential do navegador.
    // Uma validação real do Google precisa estar configurada.
    //
    // Assim evitamos criar uma falsa autenticação.
    // ----------------------------------------------------------

    if (type === "google") {

      return json(
        {
          success: false,
          error:
            "Login Google ainda não está configurado neste Worker. " +
            "Use o login administrativo por usuário e senha."
        },
        corsHeaders,
        501
      );
    }


    return json(
      {
        success: false,
        error: "Tipo de autenticação não suportado."
      },
      corsHeaders,
      400
    );

  } catch (error) {

    console.error(
      "Erro no login administrativo:",
      error
    );

    return json(
      {
        success: false,
        error: "Não foi possível realizar o login."
      },
      corsHeaders,
      500
    );
  }
}


// ============================================================
// USUÁRIOS ADMINISTRATIVOS
// ============================================================
//
// Tudo vem das Variables/Secrets do Cloudflare.
// Nenhuma senha fica gravada neste arquivo.
//
// Variáveis aceitas:
//
// ADMIN_USER
// ADMIN_PASSWORD
// ADMIN_TOKEN
//
// USER1_USER
// USER1_PASSWORD
// USER1_TOKEN
//
// USER2_USER
// USER2_PASSWORD
// USER2_TOKEN
//
// ============================================================

function getAdminUsers(env) {

  const users = [];


  if (
    env.ADMIN_USER &&
    env.ADMIN_PASSWORD &&
    env.ADMIN_TOKEN
  ) {
    users.push({
      username: env.ADMIN_USER,
      password: env.ADMIN_PASSWORD,
      token: env.ADMIN_TOKEN,
      role: "admin"
    });
  }


  if (
    env.USER1_USER &&
    env.USER1_PASSWORD &&
    env.USER1_TOKEN
  ) {
    users.push({
      username: env.USER1_USER,
      password: env.USER1_PASSWORD,
      token: env.USER1_TOKEN,
      role: "usuario"
    });
  }


  if (
    env.USER2_USER &&
    env.USER2_PASSWORD &&
    env.USER2_TOKEN
  ) {
    users.push({
      username: env.USER2_USER,
      password: env.USER2_PASSWORD,
      token: env.USER2_TOKEN,
      role: "usuario"
    });
  }


  return users;
}


// ============================================================
// AUTENTICAÇÃO ADMIN
// ============================================================

async function handleAdminAuth(
  request,
  env,
  corsHeaders,
  handler
) {

  const authorization =
    request.headers.get("Authorization") || "";


  if (!authorization.startsWith("Bearer ")) {
    return json(
      {
        success: false,
        error: "Não autorizado."
      },
      corsHeaders,
      401
    );
  }


  const token =
    authorization.substring(7).trim();


  if (!token) {
    return json(
      {
        success: false,
        error: "Token ausente."
      },
      corsHeaders,
      401
    );
  }


  const validTokens = [
    env.ADMIN_TOKEN,
    env.USER1_TOKEN,
    env.USER2_TOKEN
  ].filter(Boolean);


  const valid =
    validTokens.some(
      validToken =>
        safeEqual(validToken, token)
    );


  if (!valid) {
    return json(
      {
        success: false,
        error: "Sessão inválida ou expirada."
      },
      corsHeaders,
      401
    );
  }


  try {
    return await handler();
  } catch (error) {

    console.error(
      "Erro administrativo:",
      error
    );

    return json(
      {
        success: false,
        error: "Erro interno no painel administrativo."
      },
      corsHeaders,
      500
    );
  }
}


// ============================================================
// ADMIN — LISTAR LEADS
// ============================================================

async function handleAdminLeads(
  url,
  env,
  corsHeaders
) {

  if (!env.DB) {
    return json(
      {
        success: false,
        error: "Banco de dados não configurado."
      },
      corsHeaders,
      500
    );
  }


  const classification =
    url.searchParams.get("classification");

  const status =
    url.searchParams.get("status");


  let query =
    "SELECT * FROM leads";

  const conditions = [];
  const params = [];


  if (classification) {
    conditions.push(
      "classification = ?"
    );

    params.push(classification);
  }


  if (status) {
    conditions.push(
      "status = ?"
    );

    params.push(status);
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


  return json(
    {
      success: true,
      leads: result.results || []
    },
    corsHeaders
  );
}


// ============================================================
// ADMIN — LEAD INDIVIDUAL
// ============================================================

async function handleAdminLead(
  id,
  env,
  corsHeaders
) {

  if (!env.DB) {
    return json(
      {
        success: false,
        error: "Banco de dados não configurado."
      },
      corsHeaders,
      500
    );
  }


  const result =
    await env.DB
      .prepare(
        "SELECT * FROM leads WHERE id = ? LIMIT 1"
      )
      .bind(id)
      .first();


  if (!result) {
    return json(
      {
        success: false,
        error: "Atendimento não encontrado."
      },
      corsHeaders,
      404
    );
  }


  return json(
    {
      success: true,
      lead: result
    },
    corsHeaders
  );
}


// ============================================================
// ADMIN — ALTERAR STATUS
// ============================================================

async function handleAdminLeadStatus(
  id,
  request,
  env,
  corsHeaders
) {

  if (!env.DB) {
    return json(
      {
        success: false,
        error: "Banco de dados não configurado."
      },
      corsHeaders,
      500
    );
  }


  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        success: false,
        error: "Dados inválidos."
      },
      corsHeaders,
      400
    );
  }


  const status =
    String(body.status || "").trim();


  const allowedStatuses = [
    "novo",
    "em_analise",
    "aguardando_documentos",
    "contatado",
    "concluido",
    "cancelado"
  ];


  if (!allowedStatuses.includes(status)) {
    return json(
      {
        success: false,
        error: "Status inválido."
      },
      corsHeaders,
      400
    );
  }


  const result =
    await env.DB
      .prepare(
        "UPDATE leads SET status = ? WHERE id = ?"
      )
      .bind(status, id)
      .run();


  if (!result.success) {
    return json(
      {
        success: false,
        error: "Não foi possível atualizar o atendimento."
      },
      corsHeaders,
      500
    );
  }


  return json(
    {
      success: true,
      status
    },
    corsHeaders
  );
}


// ============================================================
// SALVAR LEAD
// ============================================================

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

  if (!env.DB) {
    return null;
  }


  const statement =
    env.DB.prepare(
      `
      INSERT INTO leads
      (
        name,
        phone,
        benefit_type,
        answers_json,
        classification,
        rationale,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'novo')
      `
    );


  const insertResult =
    await statement
      .bind(
        name,
        phone,
        benefit_type,
        JSON.stringify(answers),
        result.class,
        result.rationale
      )
      .run();


  return (
    insertResult?.meta?.last_row_id ||
    null
  );
}


// ============================================================
// JSON RESPONSE
// ============================================================

function json(
  data,
  corsHeaders = {},
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store",
        ...corsHeaders
      }
    }
  );
}


// ============================================================
// COMPARAÇÃO SIMPLES
// ============================================================
//
// Evita comparação direta espalhada pelo código.
// Não substitui um sistema criptográfico completo, mas impede
// que o código fique cheio de comparações diferentes.
// ============================================================

function safeEqual(a, b) {

  if (
    typeof a !== "string" ||
    typeof b !== "string"
  ) {
    return false;
  }


  if (a.length !== b.length) {
    return false;
  }


  let result = 0;


  for (let i = 0; i < a.length; i++) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }


  return result === 0;
}
