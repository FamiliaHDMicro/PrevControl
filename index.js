// ============================================================
// PREVCONTROL — CLOUDFLARE WORKER
// Versão integrada com TTS (Edge TTS via WebSocket)
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
    // ----------------------------------------------------------

    if (path === "/api/sectors" && request.method === "GET") {
      return json({ success: true, sectors: getAllSectors() }, corsHeaders);
    }

    // ----------------------------------------------------------
    // GET /api/benefits
    // ----------------------------------------------------------

    if (path === "/api/benefits" && request.method === "GET") {
      try {
        const benefits = getAllBenefits();
        return json({ success: true, benefits }, corsHeaders);
      } catch (error) {
        return json(
          { success: false, error: "Não foi possível carregar as opções de atendimento." },
          corsHeaders, 500
        );
      }
    }

    // ----------------------------------------------------------
    // GET /api/benefits/:key
    // ----------------------------------------------------------

    if (path.startsWith("/api/benefits/") && request.method === "GET") {
      const key = decodeURIComponent(path.replace("/api/benefits/", ""));
      const benefit = getBenefitConfig(key);

      if (!benefit) {
        return json({ success: false, error: "Serviço não encontrado." }, corsHeaders, 404);
      }

      return json({
        success: true,
        benefit: { key, label: benefit.label, questions: benefit.questions }
      }, corsHeaders);
    }


    // ==========================================================
    // TRIAGEM
    // ==========================================================

    if (path === "/api/triagem" && request.method === "POST") {
      return handleTriagem(request, env, corsHeaders);
    }


    // ==========================================================
    // TTS — SÍNTESE DE VOZ
    // ==========================================================

    if (path === "/api/tts" && request.method === "POST") {
      return handleTTS(request, env, corsHeaders);
    }


    // ==========================================================
    // LOGIN ADMINISTRATIVO
    // ==========================================================

    if (path === "/api/admin/login" && request.method === "POST") {
      return handleAdminLogin(request, env, corsHeaders);
    }


    // ==========================================================
    // ADMIN — LEADS
    // ==========================================================

    if (path === "/api/admin/leads" && request.method === "GET") {
      return handleAdminAuth(request, env, corsHeaders, async () => {
        return handleAdminLeads(url, env, corsHeaders);
      });
    }

    if (path.startsWith("/api/admin/lead/") && request.method === "GET" && !path.endsWith("/status")) {
      return handleAdminAuth(request, env, corsHeaders, async () => {
        const id = path.replace("/api/admin/lead/", "");
        return handleAdminLead(id, env, corsHeaders);
      });
    }

    if (path.startsWith("/api/admin/lead/") && path.endsWith("/status") && request.method === "PUT") {
      return handleAdminAuth(request, env, corsHeaders, async () => {
        const id = path.replace("/api/admin/lead/", "").replace("/status", "");
        return handleAdminLeadStatus(id, request, env, corsHeaders);
      });
    }


    // ==========================================================
    // HEALTH CHECK
    // ==========================================================

    if (path === "/api/health" && request.method === "GET") {
      return json({
        success: true,
        service: "PrevControl",
        status: "online",
        timestamp: new Date().toISOString()
      }, corsHeaders);
    }


    // ==========================================================
    // ASSETS
    // ==========================================================

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }


    // ==========================================================
    // 404
    // ==========================================================

    return json({ success: false, error: "Rota não encontrada." }, corsHeaders, 404);
  }
};


// ============================================================
// TTS — EDGE TTS VIA WEBSOCKET (NATIVO CLOUDFLARE)
// ============================================================
// Baseado em: github.com/DIYgod/cloudflare-edge-tts
// Sem dependências externas. Usa WebSocket nativo do Worker.
// ============================================================

const TTS_TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const TTS_VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TTS_TRUSTED_CLIENT_TOKEN}`;
const TTS_WSS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

const ALLOWED_VOICES = [
  "pt-BR-AntonioNeural",
  "pt-BR-FranciscaNeural"
];

function generateUUID() {
  return crypto.randomUUID().replace(/-/g, "");
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSynthesisUrl() {
  const connectionId = generateUUID();
  return `${TTS_WSS_URL}?ConnectionId=${connectionId}&TrustedClientToken=${TTS_TRUSTED_CLIENT_TOKEN}`;
}

function buildSpeechConfig() {
  return JSON.stringify({
    context: {
      synthesis: {
        audio: {
          metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
          outputFormat: "audio-24khz-48kbitrate-mono-mp3"
        }
      }
    }
  });
}

function buildSSML(text, voice) {
  const requestId = generateUUID();
  const escapedText = escapeXml(text.slice(0, 500));
  const gender = voice.includes("Francisca") ? "Female" : "Male";

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="pt-BR">
    <voice xml:lang="pt-BR" xml:gender="${gender}" name="Microsoft Server Speech Text to Speech Voice (pt-BR, ${voice})">
      <prosody rate="-5%" pitch="+0%">${escapedText}</prosody>
    </voice>
  </speak>`;
}

async function handleTTS(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const text = String(body.text || "").trim();
    const voice = String(body.voice || "pt-BR-AntonioNeural").trim();

    if (!text) {
      return json({ success: false, error: "Texto ausente." }, corsHeaders, 400);
    }

    const safeVoice = ALLOWED_VOICES.includes(voice) ? voice : "pt-BR-AntonioNeural";

    // Conectar via WebSocket ao Edge TTS
    const wsUrl = buildSynthesisUrl();
    const response = await fetch(wsUrl, {
      headers: {
        "Upgrade": "websocket",
        "User-Agent": "okhttp/4.5.0",
        "Origin": "chrome-extension://jdiccldimpdaibmpdmdber"
      }
    });

    const webSocket = response.webSocket;

    if (!webSocket) {
      // Fallback: tentar via HTTP direto (menos qualidade mas funciona)
      return handleTTSFallback(text, safeVoice, corsHeaders);
    }

    webSocket.accept();

    // Coletar áudio via WebSocket
    const audioChunks = [];
    let resolveAudio;
    let rejectAudio;

    const audioPromise = new Promise((resolve, reject) => {
      resolveAudio = resolve;
      rejectAudio = reject;
    });

    // Timeout de segurança
    const timeout = setTimeout(() => {
      rejectAudio(new Error("Timeout"));
      try { webSocket.close(); } catch {}
    }, 10000);

    webSocket.addEventListener("message", (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Mensagem binária contém áudio
        const data = new Uint8Array(event.data);
        // Os primeiros bytes são header, o resto é áudio
        // Encontrar onde começa o áudio (após \r\n\r\n)
        const headerEnd = findHeaderEnd(data);
        if (headerEnd > 0 && headerEnd < data.length) {
          audioChunks.push(data.slice(headerEnd));
        } else if (headerEnd === -1 && data.length > 2) {
          // Pode ser chunk puro de áudio
          audioChunks.push(data);
        }
      } else if (typeof event.data === "string") {
        if (event.data.includes("turn.end")) {
          clearTimeout(timeout);
          try { webSocket.close(); } catch {}
          resolveAudio();
        }
      }
    });

    webSocket.addEventListener("close", () => {
      clearTimeout(timeout);
      resolveAudio();
    });

    webSocket.addEventListener("error", (err) => {
      clearTimeout(timeout);
      rejectAudio(err);
    });

    // Enviar configuração e SSML
    const configMsg = `X-Timestamp:${new Date().toISOString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${buildSpeechConfig()}`;
    webSocket.send(configMsg);

    const ssmlMsg = `X-RequestId:${generateUUID()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n${buildSSML(text, safeVoice)}`;
    webSocket.send(ssmlMsg);

    await audioPromise;

    if (audioChunks.length === 0) {
      return handleTTSFallback(text, safeVoice, corsHeaders);
    }

    // Combinar chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    return new Response(audioBuffer.buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("Erro TTS WebSocket:", error);
    // Fallback automático
    try {
      const body = await request.clone().json().catch(() => ({ text: "", voice: "pt-BR-AntonioNeural" }));
      return handleTTSFallback(
        body.text || "Erro ao gerar áudio.",
        body.voice || "pt-BR-AntonioNeural",
        corsHeaders
      );
    } catch {
      return json({ success: false, error: "Não foi possível gerar áudio." }, corsHeaders, 500);
    }
  }
}

function findHeaderEnd(data) {
  // Procurar por \r\n\r\n (fim do header na mensagem binária)
  for (let i = 0; i < data.length - 3; i++) {
    if (data[i] === 0x0d && data[i + 1] === 0x0a && data[i + 2] === 0x0d && data[i + 3] === 0x0a) {
      return i + 4;
    }
  }
  return -1;
}

async function handleTTSFallback(text, voice, corsHeaders) {
  // Fallback via HTTP direto (qualidade menor mas funcional)
  try {
    const safeText = escapeXml(text.slice(0, 500));
    const gender = voice.includes("Francisca") ? "Female" : "Male";

    const ssml = `<speak version='1.0' xml:lang='pt-BR'>
      <voice xml:lang='pt-BR' xml:gender='${gender}' name='Microsoft Server Speech Text to Speech Voice (pt-BR, ${voice})'>
        ${safeText}
      </voice>
    </speak>`;

    const edgeResponse = await fetch(
      `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TTS_TRUSTED_CLIENT_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "okhttp/4.5.0"
        },
        body: ssml
      }
    );

    if (!edgeResponse.ok) {
      throw new Error(`HTTP ${edgeResponse.status}`);
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

  } catch (fallbackError) {
    console.error("Erro TTS fallback:", fallbackError);
    return json({ success: false, error: "Não foi possível gerar áudio." }, corsHeaders, 500);
  }
}


// ============================================================
// TRIAGEM
// ============================================================

async function handleTriagem(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { name, phone, benefit_type, answers } = body;

    if (!name || !phone || !benefit_type || !answers) {
      return json({ success: false, error: "Dados incompletos." }, corsHeaders, 400);
    }

    const benefit = getBenefitConfig(benefit_type);
    if (!benefit) {
      return json({ success: false, error: "O serviço selecionado não foi encontrado." }, corsHeaders, 400);
    }

    const result = runTriagem(benefit_type, answers);

    let leadId = null;
    if (env.DB) {
      leadId = await salvarLead(env, { name, phone, benefit_type, answers, result });
    }

    const docWarning =
      "\n\nPara agilizar sua análise completa, já separe seus documentos. " +
      "Dependendo do caso, podem ser necessários CNIS, carteira de trabalho, " +
      "documentos de rescisão, extratos, comprovantes e documentos pessoais.";

    const classificationLabel = CLASSIFICATION_LABELS[result.class] || "Necessita análise documental";

    const msg =
      `Olá! Sou ${name}. Fiz a triagem no site.` +
      `\n📋 Assunto: ${benefit.label}` +
      `\n✅ Resultado: ${classificationLabel}` +
      `\n📝 ${result.rationale}` +
      docWarning;

    let whatsappLink = null;
    if (env.WHATSAPP_NUMBER) {
      whatsappLink = `https://wa.me/${env.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    }

    return json({
      success: true,
      lead_id: leadId,
      classification: result.class,
      classification_label: classificationLabel,
      rationale: result.rationale,
      whatsapp_link: whatsappLink
    }, corsHeaders);

  } catch (error) {
    console.error("Erro em /api/triagem:", error);
    return json({ success: false, error: "Não foi possível concluir a triagem." }, corsHeaders, 500);
  }
}


// ============================================================
// LOGIN ADMINISTRATIVO
// ============================================================

async function handleAdminLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const type = body.type || "password";

    if (type === "password") {
      const username = String(body.username || "").trim();
      const password = String(body.password || "");

      if (!username || !password) {
        return json({ success: false, error: "Usuário e senha são obrigatórios." }, corsHeaders, 400);
      }

      const users = getAdminUsers(env);
      const user = users.find(item => item.username === username && item.password && safeEqual(item.password, password));

      if (!user) {
        return json({ success: false, error: "Usuário ou senha incorretos." }, corsHeaders, 401);
      }

      if (!user.token) {
        return json({ success: false, error: "Usuário administrativo sem token configurado." }, corsHeaders, 500);
      }

      return json({ success: true, role: user.role, token: user.token }, corsHeaders);
    }

    if (type === "google") {
      return json({
        success: false,
        error: "Login Google ainda não está configurado neste Worker. Use o login administrativo por usuário e senha."
      }, corsHeaders, 501);
    }

    return json({ success: false, error: "Tipo de autenticação não suportado." }, corsHeaders, 400);

  } catch (error) {
    console.error("Erro no login administrativo:", error);
    return json({ success: false, error: "Não foi possível realizar o login." }, corsHeaders, 500);
  }
}


// ============================================================
// USUÁRIOS ADMINISTRATIVOS
// ============================================================

function getAdminUsers(env) {
  const users = [];

  if (env.ADMIN_USER && env.ADMIN_PASSWORD && env.ADMIN_TOKEN) {
    users.push({ username: env.ADMIN_USER, password: env.ADMIN_PASSWORD, token: env.ADMIN_TOKEN, role: "admin" });
  }

  if (env.USER1_USER && env.USER1_PASSWORD && env.USER1_TOKEN) {
    users.push({ username: env.USER1_USER, password: env.USER1_PASSWORD, token: env.USER1_TOKEN, role: "usuario" });
  }

  if (env.USER2_USER && env.USER2_PASSWORD && env.USER2_TOKEN) {
    users.push({ username: env.USER2_USER, password: env.USER2_PASSWORD, token: env.USER2_TOKEN, role: "usuario" });
  }

  return users;
}


// ============================================================
// AUTENTICAÇÃO ADMIN
// ============================================================

async function handleAdminAuth(request, env, corsHeaders, handler) {
  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return json({ success: false, error: "Não autorizado." }, corsHeaders, 401);
  }

  const token = authorization.substring(7).trim();

  if (!token) {
    return json({ success: false, error: "Token ausente." }, corsHeaders, 401);
  }

  const validTokens = [env.ADMIN_TOKEN, env.USER1_TOKEN, env.USER2_TOKEN].filter(Boolean);
  const valid = validTokens.some(validToken => safeEqual(validToken, token));

  if (!valid) {
    return json({ success: false, error: "Sessão inválida ou expirada." }, corsHeaders, 401);
  }

  try {
    return await handler();
  } catch (error) {
    console.error("Erro administrativo:", error);
    return json({ success: false, error: "Erro interno no painel administrativo." }, corsHeaders, 500);
  }
}


// ============================================================
// ADMIN — LISTAR LEADS
// ============================================================

async function handleAdminLeads(url, env, corsHeaders) {
  if (!env.DB) {
    return json({ success: false, error: "Banco de dados não configurado." }, corsHeaders, 500);
  }

  const classification = url.searchParams.get("classification");
  const status = url.searchParams.get("status");

  let query = "SELECT * FROM leads";
  const conditions = [];
  const params = [];

  if (classification) { conditions.push("classification = ?"); params.push(classification); }
  if (status) { conditions.push("status = ?"); params.push(status); }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY created_at DESC LIMIT 200";

  const result = await env.DB.prepare(query).bind(...params).all();

  return json({ success: true, leads: result.results || [] }, corsHeaders);
}


// ============================================================
// ADMIN — LEAD INDIVIDUAL
// ============================================================

async function handleAdminLead(id, env, corsHeaders) {
  if (!env.DB) {
    return json({ success: false, error: "Banco de dados não configurado." }, corsHeaders, 500);
  }

  const result = await env.DB.prepare("SELECT * FROM leads WHERE id = ? LIMIT 1").bind(id).first();

  if (!result) {
    return json({ success: false, error: "Atendimento não encontrado." }, corsHeaders, 404);
  }

  return json({ success: true, lead: result }, corsHeaders);
}


// ============================================================
// ADMIN — ALTERAR STATUS
// ============================================================

async function handleAdminLeadStatus(id, request, env, corsHeaders) {
  if (!env.DB) {
    return json({ success: false, error: "Banco de dados não configurado." }, corsHeaders, 500);
  }

  let body;
  try { body = await request.json(); } catch {
    return json({ success: false, error: "Dados inválidos." }, corsHeaders, 400);
  }

  const status = String(body.status || "").trim();
  const allowedStatuses = ["novo", "em_analise", "aguardando_documentos", "contatado", "concluido", "cancelado"];

  if (!allowedStatuses.includes(status)) {
    return json({ success: false, error: "Status inválido." }, corsHeaders, 400);
  }

  const result = await env.DB.prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status, id).run();

  if (!result.success) {
    return json({ success: false, error: "Não foi possível atualizar o atendimento." }, corsHeaders, 500);
  }

  return json({ success: true, status }, corsHeaders);
}


// ============================================================
// SALVAR LEAD
// ============================================================

async function salvarLead(env, { name, phone, benefit_type, answers, result }) {
  if (!env.DB) return null;

  const statement = env.DB.prepare(`
    INSERT INTO leads (name, phone, benefit_type, answers_json, classification, rationale, status)
    VALUES (?, ?, ?, ?, ?, ?, 'novo')
  `);

  const insertResult = await statement.bind(
    name, phone, benefit_type, JSON.stringify(answers), result.class, result.rationale
  ).run();

  return insertResult?.meta?.last_row_id || null;
}


// ============================================================
// JSON RESPONSE
// ============================================================

function json(data, corsHeaders = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...corsHeaders
    }
  });
}


// ============================================================
// COMPARAÇÃO SEGURA
// ============================================================

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
