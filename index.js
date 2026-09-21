// ============================================================
// PrevControl — Worker melhorado
// - Linguagem simples (sem termos técnicos)
// - Sem referências a MEI
// - Banners rotativos (topo, rodapé, lateral) que pausam no hover
// - Vozes Jarvis e Katerine alternando corretamente
// - Design responsivo
// - Login único: admin / admin4628
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Número de WhatsApp do escritório (pode ser alterado pelo painel)
    const DEFAULT_PHONE = env.WHATSAPP_NUMBER || "5517991087449";

    // ===== LOGIN DO ADMINISTRADOR =====
    if (path === "/api/admin/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const adminPass = env.ADMIN_TOKEN || "admin4628";

        if (body.username === "admin" && body.password === adminPass) {
          return jsonResponse({ ok: true, role: "Administrador" });
        }
        return jsonResponse({ error: "Usuário ou senha incorretos!" }, 401);
      } catch (e) {
        return jsonResponse({ error: "Erro ao processar login" }, 400);
      }
    }

    // ===== SALVAR LEAD NO BANCO =====
    if (path === "/api/leads" && request.method === "POST") {
      try {
        const body = await request.json();
        if (env.DB) {
          await env.DB.prepare(
            "INSERT INTO leads (name, phone, benefit_type, answers_json, classification, rationale) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            body.nome || "Sem nome",
            body.telefone || "",
            "triagem",
            body.resumo || "",
            "precisa_avaliacao",
            body.resumo || ""
          ).run();
        }
        return jsonResponse({ ok: true });
      } catch (e) {
        return jsonResponse({ ok: false, message: "Erro ao salvar" }, 500);
      }
    }

    // ===== PÁGINA PRINCIPAL =====
    const html = buildHTML(DEFAULT_PHONE);
    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json;charset=UTF-8" }
  });
}

function buildHTML(defaultPhone) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PrevControl - Consulta Previdenciária</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --azul-escuro:#0b132c;--azul-medio:#132043;--azul-claro:#1e293b;
      --azul-botao:#2563eb;--azul-hover:#1d4ed8;
      --verde:#16a34a;--verde-claro:#dcfce7;
      --amarelo:#facc15;--amarelo-claro:#fef9c3;
      --vermelho:#ef4444;--vermelho-claro:#fee2e2;
      --branco:#e2e8f0;--cinza:#94a3b8;--cinza-escuro:#64748b;
    }
    body{
      font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
      background:var(--azul-escuro);color:var(--branco);
      min-height:100vh;display:flex;flex-direction:column;
    }

    /* ===== BANNER TOPO ROTATIVO ===== */
    .banner-topo{
      background:linear-gradient(90deg,#0b132c,#1e3a5f,#0b132c);
      overflow:hidden;white-space:nowrap;
      border-bottom:2px solid var(--azul-botao);
      padding:12px 0;position:relative;
    }
    .banner-topo-track{
      display:inline-block;animation:scroll-left 30s linear infinite;
    }
    .banner-topo:hover .banner-topo-track{animation-play-state:paused}
    .banner-topo-track span{
      display:inline-block;margin:0 40px;font-size:16px;font-weight:600;color:var(--amarelo);
    }
    .banner-topo-track span::before{content:'📢 '}
    @keyframes scroll-left{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}

    /* ===== BANNER RODAPÉ ROTATIVO ===== */
    .banner-rodape{
      background:linear-gradient(90deg,#0b132c,#1e3a5f,#0b132c);
      overflow:hidden;white-space:nowrap;
      border-top:2px solid var(--verde);
      padding:12px 0;position:relative;
    }
    .banner-rodape-track{
      display:inline-block;animation:scroll-right 35s linear infinite;
    }
    .banner-rodape:hover .banner-rodape-track{animation-play-state:paused}
    .banner-rodape-track span{
      display:inline-block;margin:0 40px;font-size:16px;font-weight:600;color:var(--verde);
    }
    .banner-rodape-track span::before{content:'✅ '}
    @keyframes scroll-right{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

    /* ===== LAYOUT PRINCIPAL ===== */
    .layout{
      flex:1;display:flex;justify-content:center;align-items:flex-start;
      gap:20px;padding:20px;max-width:1400px;margin:0 auto;width:100%;
    }

    /* ===== BANNER LATERAL ESQUERDO ===== */
    .banner-lateral-esq{
      width:180px;flex-shrink:0;overflow:hidden;
      border-radius:12px;border:1px solid var(--azul-claro);
      background:var(--azul-medio);padding:10px;
    }
    .banner-lateral-esq .titulo-lateral{
      font-size:13px;color:var(--cinza);text-align:center;margin-bottom:10px;font-weight:600;
    }
    .banner-lateral-esq .itens{height:400px;overflow:hidden;position:relative}
    .banner-lateral-esq .itens-track{
      animation:scroll-up 25s linear infinite;
    }
    .banner-lateral-esq:hover .itens-track{animation-play-state:paused}
    .banner-lateral-esq .item{
      background:var(--azul-escuro);border-radius:8px;padding:12px;margin-bottom:10px;
      border:1px solid var(--azul-claro);text-align:center;
    }
    .banner-lateral-esq .item .emoji{font-size:28px;display:block;margin-bottom:6px}
    .banner-lateral-esq .item .texto{font-size:12px;color:var(--branco);line-height:1.4}
    @keyframes scroll-up{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}

    /* ===== BANNER LATERAL DIREITO ===== */
    .banner-lateral-dir{
      width:180px;flex-shrink:0;overflow:hidden;
      border-radius:12px;border:1px solid var(--azul-claro);
      background:var(--azul-medio);padding:10px;
    }
    .banner-lateral-dir .titulo-lateral{
      font-size:13px;color:var(--cinza);text-align:center;margin-bottom:10px;font-weight:600;
    }
    .banner-lateral-dir .itens{height:400px;overflow:hidden;position:relative}
    .banner-lateral-dir .itens-track{
      animation:scroll-up 30s linear infinite;
    }
    .banner-lateral-dir:hover .itens-track{animation-play-state:paused}
    .banner-lateral-dir .item{
      background:var(--azul-escuro);border-radius:8px;padding:12px;margin-bottom:10px;
      border:1px solid var(--azul-claro);text-align:center;
    }
    .banner-lateral-dir .item .emoji{font-size:28px;display:block;margin-bottom:6px}
    .banner-lateral-dir .item .texto{font-size:12px;color:var(--branco);line-height:1.4}

    /* ===== CARTÃO PRINCIPAL ===== */
    .cartao{
      background:var(--azul-medio);border-radius:16px;padding:32px;
      max-width:560px;width:100%;border:1px solid var(--azul-claro);
      box-shadow:0 20px 60px rgba(0,0,0,0.4);
    }
    .cartao-cabecalho{
      border-bottom:1px solid var(--azul-claro);padding-bottom:16px;margin-bottom:24px;
      display:flex;justify-content:space-between;align-items:center;
    }
    .cartao-cabecalho h1{font-size:24px;font-weight:700;color:#fff;margin-top:4px}
    .cartao-cabecalho .subtitulo{font-size:13px;color:var(--azul-botao);font-weight:600}
    .btn-admin{
      background:transparent;border:1px solid var(--azul-claro);color:var(--cinza);
      padding:8px 16px;border-radius:8px;font-size:14px;cursor:pointer;
      transition:all 0.2s;
    }
    .btn-admin:hover{border-color:var(--azul-botao);color:var(--azul-botao)}

    /* ===== FORMULÁRIO ===== */
    .form-grupo{margin-bottom:18px}
    .form-label{display:block;font-size:15px;font-weight:600;margin-bottom:6px;color:var(--branco)}
    .form-input{
      width:100%;background:var(--azul-escuro);border:2px solid var(--azul-claro);
      border-radius:10px;padding:14px;font-size:17px;color:#fff;outline:none;
      transition:border-color 0.2s;
    }
    .form-input:focus{border-color:var(--azul-botao)}
    .form-input::placeholder{color:var(--cinza-escuro)}
    .form-select{
      width:100%;background:var(--azul-escuro);border:2px solid var(--azul-claro);
      border-radius:10px;padding:14px;font-size:17px;color:#fff;outline:none;
      cursor:pointer;transition:border-color 0.2s;
    }
    .form-select:focus{border-color:var(--azul-botao)}
    .form-linha{display:grid;grid-template-columns:1fr 1fr;gap:12px}

    /* ===== BOTÃO PRINCIPAL ===== */
    .btn-enviar{
      width:100%;background:var(--azul-botao);color:#fff;border:none;
      padding:18px;border-radius:12px;font-size:18px;font-weight:700;
      cursor:pointer;transition:background 0.2s;margin-top:8px;
    }
    .btn-enviar:hover{background:var(--azul-hover)}
    .btn-enviar:active{transform:scale(0.98)}

    /* ===== VOZES (Jarvis e Katerine) ===== */
    .painel-vozes{
      background:var(--azul-escuro);border-radius:12px;padding:16px;
      margin-top:20px;border:1px solid var(--azul-claro);
    }
    .painel-vozes-titulo{
      font-size:15px;font-weight:600;margin-bottom:12px;color:var(--branco);
      display:flex;align-items:center;gap:8px;
    }
    .vozes-botoes{display:flex;gap:10px;flex-wrap:wrap}
    .btn-voz{
      background:var(--azul-medio);border:2px solid var(--azul-claro);
      color:var(--branco);padding:10px 18px;border-radius:10px;
      font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;
      display:flex;align-items:center;gap:6px;
    }
    .btn-voz:hover{border-color:var(--amarelo)}
    .btn-voz.jarvis{border-color:#3b82f6}
    .btn-voz.jarvis:hover{background:#1e3a5f}
    .btn-voz.katerine{border-color:#ec4899}
    .btn-voz.katerine:hover{background:#3b1a2f}
    .btn-voz.parar{border-color:var(--vermelho)}
    .btn-voz.parar:hover{background:#3b1515}
    .voz-status{font-size:13px;color:var(--cinza);margin-top:8px;text-align:center}

    /* ===== MODAL LOGIN ===== */
    .modal-bg{
      position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);
      display:none;align-items:center;justify-content:center;z-index:100;padding:20px;
    }
    .modal-bg.mostrar{display:flex}
    .modal-box{
      background:var(--azul-medio);border-radius:20px;padding:32px;
      max-width:380px;width:100%;border:1px solid var(--azul-claro);
      box-shadow:0 20px 60px rgba(0,0,0,0.5);
    }
    .modal-box h3{font-size:20px;font-weight:700;margin-bottom:20px;text-align:center;color:#fff}
    .modal-box input{
      width:100%;background:var(--azul-escuro);border:2px solid var(--azul-claro);
      border-radius:10px;padding:14px;font-size:18px;color:#fff;
      outline:none;margin-bottom:12px;transition:border-color 0.2s;
    }
    .modal-box input:focus{border-color:var(--azul-botao)}
    .modal-botoes{display:flex;gap:10px}
    .modal-botoes button{
      flex:1;padding:14px;border-radius:10px;font-size:16px;font-weight:700;
      cursor:pointer;border:none;transition:opacity 0.2s;
    }
    .modal-botoes .entrar{background:var(--azul-botao);color:#fff}
    .modal-botoes .entrar:hover{background:var(--azul-hover)}
    .modal-botoes .cancelar{background:var(--azul-claro);color:var(--branco)}
    .modal-botoes .cancelar:hover{opacity:0.8}

    /* ===== MODAL PAINEL ===== */
    .modal-painel-box{
      background:var(--azul-medio);border-radius:20px;padding:32px;
      max-width:480px;width:100%;border:1px solid var(--azul-claro);
      box-shadow:0 20px 60px rgba(0,0,0,0.5);
    }
    .modal-painel-box h3{font-size:20px;font-weight:700;color:#fff;margin-bottom:4px}
    .modal-painel-box .role{font-size:14px;color:var(--cinza);margin-bottom:20px}
    .painel-campo{
      background:var(--azul-escuro);border-radius:12px;padding:16px;
      border:1px solid var(--azul-claro);margin-bottom:16px;
    }
    .painel-campo label{font-size:14px;color:var(--cinza);display:block;margin-bottom:8px}
    .painel-campo input{
      width:100%;background:var(--azul-medio);border:2px solid var(--azul-claro);
      border-radius:10px;padding:12px;font-size:16px;color:#fff;outline:none;
    }
    .painel-campo input:focus{border-color:var(--azul-botao)}
    .btn-salvar{
      width:100%;background:var(--verde);color:#fff;border:none;
      padding:14px;border-radius:10px;font-size:17px;font-weight:700;
      cursor:pointer;transition:opacity 0.2s;
    }
    .btn-salvar:hover{opacity:0.9}
    .btn-fechar{
      background:transparent;border:none;color:var(--cinza);
      font-size:24px;cursor:pointer;float:right;
    }
    .btn-fechar:hover{color:#fff}

    /* ===== RESPONSIVO ===== */
    @media(max-width:900px){
      .banner-lateral-esq,.banner-lateral-dir{display:none}
    }
    @media(max-width:600px){
      .cartao{padding:20px}
      .cartao-cabecalho{flex-direction:column;gap:12px;text-align:center}
      .form-linha{grid-template-columns:1fr}
      .banner-topo-track span,.banner-rodape-track span{font-size:14px}
      .cartao-cabecalho h1{font-size:20px}
      .form-input,.form-select{font-size:16px}
      .btn-enviar{font-size:16px;padding:16px}
    }
  </style>
</head>
<body>

<!-- ===== BANNER TOPO ROTATIVO ===== -->
<div class="banner-topo">
  <div class="banner-topo-track">
    <span>Você trabalhou muitos anos? Pode ter direito a aposentadoria!</span>
    <span>Está doente e não consegue trabalhar? Pode ter direito ao auxílio-doença</span>
    <span>Sua mãe ou pai faleceu e era aposentado? Você pode ter direito a pensão</span>
    <span>Renda baixa e idade acima de 65 anos? Conheça o BPC/LOAS</span>
    <span>Foi demitido e não recebeu tudo? Veja seus direitos trabalhistas</span>
    <span>Aposentado há muitos anos? Pode ter direito a revisão do valor</span>
  </div>
</div>

<!-- ===== LAYOUT COM 3 COLUNAS ===== -->
<div class="layout">

  <!-- BANNER LATERAL ESQUERDO -->
  <div class="banner-lateral-esq">
    <div class="titulo-lateral">📋 Serviços</div>
    <div class="itens">
      <div class="itens-track">
        <div class="item"><span class="emoji">👴</span><span class="texto">Aposentadoria por idade</span></div>
        <div class="item"><span class="emoji">⏰</span><span class="texto">Aposentadoria por tempo de serviço</span></div>
        <div class="item"><span class="emoji">🤒</span><span class="texto">Auxílio-doença</span></div>
        <div class="item"><span class="emoji">👶</span><span class="texto">Salário-maternidade</span></div>
        <div class="item"><span class="emoji">💔</span><span class="texto">Pensão por morte</span></div>
        <div class="item"><span class="emoji">🤝</span><span class="texto">BPC/LOAS</span></div>
        <div class="item"><span class="emoji">⚖️</span><span class="texto">Direitos trabalhistas</span></div>
        <div class="item"><span class="emoji">🔄</span><span class="texto">Revisão de benefício</span></div>
        <!-- duplicado para rolagem contínua -->
        <div class="item"><span class="emoji">👴</span><span class="texto">Aposentadoria por idade</span></div>
        <div class="item"><span class="emoji">⏰</span><span class="texto">Aposentadoria por tempo de serviço</span></div>
        <div class="item"><span class="emoji">🤒</span><span class="texto">Auxílio-doença</span></div>
        <div class="item"><span class="emoji">👶</span><span class="texto">Salário-maternidade</span></div>
        <div class="item"><span class="emoji">💔</span><span class="texto">Pensão por morte</span></div>
        <div class="item"><span class="emoji">🤝</span><span class="texto">BPC/LOAS</span></div>
        <div class="item"><span class="emoji">⚖️</span><span class="texto">Direitos trabalhistas</span></div>
        <div class="item"><span class="emoji">🔄</span><span class="texto">Revisão de benefício</span></div>
      </div>
    </div>
  </div>

  <!-- CARTÃO PRINCIPAL -->
  <div class="cartao">
    <div class="cartao-cabecalho">
      <div>
        <div class="subtitulo">CONSULTA PREVIDENCIÁRIA</div>
        <h1>Análise de Benefício</h1>
      </div>
      <button class="btn-admin" onclick="abrirLogin()">🔐 Entrar como Admin</button>
    </div>

    <form onsubmit="enviarTriagem(event)">
      <div class="form-grupo">
        <label class="form-label">Nome completo</label>
        <input type="text" id="nome" required placeholder="Digite seu nome" class="form-input">
      </div>

      <div class="form-linha">
        <div class="form-grupo">
          <label class="form-label">Sexo</label>
          <select id="sexo" class="form-select">
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
        <div class="form-grupo">
          <label class="form-label">Idade atual</label>
          <input type="number" id="idade" required placeholder="Ex: 58" class="form-input">
        </div>
      </div>

      <div class="form-grupo">
        <label class="form-label">Quantos anos você trabalhou / contribuiu?</label>
        <input type="number" id="tempo" required placeholder="Ex: 25" class="form-input">
      </div>

      <div class="form-grupo">
        <label class="form-label">Você trabalhou como trabalhador rural ou agricultor?</label>
        <select id="rural" class="form-select">
          <option value="nao">Não, só trabalhei com carteira assinada ou pagando por conta</option>
          <option value="rural">Sim, trabalhei no campo / agricultura</option>
        </select>
      </div>

      <button type="submit" class="btn-enviar">📱 Gerar Análise e Enviar no WhatsApp</button>
    </form>

    <!-- PAINEL DE VOZES -->
    <div class="painel-vozes">
      <div class="painel-vozes-titulo">🔊 Ouça a explicação</div>
      <div class="vozes-botoes">
        <button class="btn-voz jarvis" onclick="falarJarvis()">🎙️ Ouvir Jarvis</button>
        <button class="btn-voz katerine" onclick="falarKaterine()">🎙️ Ouvir Katerine</button>
        <button class="btn-voz parar" onclick="pararVoz()">⏹️ Parar</button>
      </div>
      <div class="voz-status" id="voz-status"></div>
    </div>
  </div>

  <!-- BANNER LATERAL DIREITO -->
  <div class="banner-lateral-dir">
    <div class="titulo-lateral">ℹ️ Informações</div>
    <div class="itens">
      <div class="itens-track">
        <div class="item"><span class="emoji">✅</span><span class="texto">Atendimento gratuito e sem compromisso</span></div>
        <div class="item"><span class="emoji">⏳</span><span class="texto">Resposta rápida pelo WhatsApp</span></div>
        <div class="item"><span class="emoji">🏠</span><span class="texto">Atendemos online, de onde você estiver</span></div>
        <div class="item"><span class="emoji">🛡️</span><span class="texto">Seus dados estão protegidos</span></div>
        <div class="item"><span class="emoji">👨‍⚖️</span><span class="texto">Especialistas em direitos previdenciários</span></div>
        <div class="item"><span class="emoji">💬</span><span class="texto">Tire suas dúvidas sem sair de casa</span></div>
        <div class="item"><span class="emoji">📅</span><span class="texto">Agende sua consulta pelo WhatsApp</span></div>
        <div class="item"><span class="emoji">💰</span><span class="texto">Você pode ter dinheiro a receber</span></div>
        <!-- duplicado para rolagem contínua -->
        <div class="item"><span class="emoji">✅</span><span class="texto">Atendimento gratuito e sem compromisso</span></div>
        <div class="item"><span class="emoji">⏳</span><span class="texto">Resposta rápida pelo WhatsApp</span></div>
        <div class="item"><span class="emoji">🏠</span><span class="texto">Atendemos online, de onde você estiver</span></div>
        <div class="item"><span class="emoji">🛡️</span><span class="texto">Seus dados estão protegidos</span></div>
        <div class="item"><span class="emoji">👨‍⚖️</span><span class="texto">Especialistas em direitos previdenciários</span></div>
        <div class="item"><span class="emoji">💬</span><span class="texto">Tire suas dúvidas sem sair de casa</span></div>
        <div class="item"><span class="emoji">📅</span><span class="texto">Agende sua consulta pelo WhatsApp</span></div>
        <div class="item"><span class="emoji">💰</span><span class="texto">Você pode ter dinheiro a receber</span></div>
      </div>
    </div>
  </div>
</div>

<!-- ===== BANNER RODAPÉ ROTATIVO ===== -->
<div class="banner-rodape">
  <div class="banner-rodape-track">
    <span>Não perca seus direitos! Faça sua análise agora</span>
    <span>Trabalhou muitos anos? Você pode se aposentar</span>
    <span>Doença impedindo de trabalhar? Pode ter direito a benefício</span>
    <span>Recebe pensão? Saiba se pode revisar o valor</span>
    <span>Atendimento online, rápido e sem sair de casa</span>
    <span>Fale com um especialista pelo WhatsApp hoje mesmo</span>
  </div>
</div>

<!-- ===== MODAL LOGIN ===== -->
<div class="modal-bg" id="modal-login">
  <div class="modal-box">
    <h3>🔐 Acesso do Administrador</h3>
    <input type="text" id="user-login" placeholder="Usuário" autocomplete="username">
    <input type="password" id="pass-login" placeholder="Senha" autocomplete="current-password">
    <div class="modal-botoes">
      <button class="entrar" onclick="fazerLogin()">Entrar</button>
      <button class="cancelar" onclick="fecharLogin()">Cancelar</button>
    </div>
  </div>
</div>

<!-- ===== MODAL PAINEL ADMIN ===== -->
<div class="modal-bg" id="modal-painel">
  <div class="modal-painel-box">
    <button class="btn-fechar" onclick="fecharPainel()">✕</button>
    <h3>Painel do Administrador</h3>
    <div class="role" id="user-badge"></div>
    <div class="painel-campo">
      <label>Número de WhatsApp do escritório (com DDD):</label>
      <input type="text" id="cfg-phone" placeholder="5517991087449">
      <button class="btn-salvar" style="margin-top:12px" onclick="salvarConfig()">Salvar número</button>
    </div>
  </div>
</div>

<script>
  // ===== WHATSAPP PADRÃO =====
  const DEFAULT_PHONE = "${defaultPhone}";

  // ===== SISTEMA DE VOZES (Jarvis e Katerine) =====
  // Correção: Jarvis e Katerine se alternam SEM se interromper
  // O problema anterior era que speechSynthesis.speak() cancela a fala anterior
  // Agora usamos fila e aguardamos onend antes de chamar a próxima

  let vozAtual = null; // 'jarvis' | 'katerine' | null
  let filaDeFalas = []; // fila de textos a falar
  let falando = false;

  function buscarVozJarvis() {
    const vozes = speechSynthesis.getVoices();
    // Procura voz masculina em português
    return vozes.find(v => v.lang.startsWith('pt') && /male|masculino|homem|Daniel|Felipe|Google/i.test(v.name))
         || vozes.find(v => v.lang.startsWith('pt'))
         || vozes[0];
  }

  function buscarVozKaterine() {
    const vozes = speechSynthesis.getVoices();
    // Procura voz feminina em português
    return vozes.find(v => v.lang.startsWith('pt') && /female|feminino|mulher|Maria|Ana|Luciana|Google/i.test(v.name))
         || vozes.find(v => v.lang.startsWith('pt'))
         || vozes[0];
  }

  // Carrega as vozes (alguns navegadores precisam do evento onvoiceschanged)
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = () => { /* vozes carregadas */ };
  }

  function falarTexto(texto, nomeVoz) {
    return new Promise((resolve) => {
      const fala = new SpeechSynthesisUtterance(texto);
      fala.lang = 'pt-BR';
      fala.rate = 0.95;
      fala.pitch = nomeVoz === 'jarvis' ? 0.8 : 1.2;

      const voz = nomeVoz === 'jarvis' ? buscarVozJarvis() : buscarVozKaterine();
      if (voz) fala.voice = voz;

      fala.onend = () => resolve();
      fala.onerror = () => resolve();

      // NÃO chama speechSynthesis.cancel() aqui — isso era o que matava a Katerine
      // Apenas adiciona na fila e processa uma de cada vez
      speechSynthesis.speak(fala);
    });
  }

  async function processarFila() {
    if (falando) return;
    falando = true;
    while (filaDeFalas.length > 0) {
      const item = filaDeFalas.shift();
      atualizarStatus(item.voz + ' está falando...');
      await falarTexto(item.texto, item.voz);
    }
    falando = false;
    vozAtual = null;
    atualizarStatus('');
  }

  function falarJarvis() {
    // Para qualquer fala atual antes de começar a do Jarvis
    speechSynthesis.cancel();
    filaDeFalas = [];
    falando = false;

    vozAtual = 'jarvis';
    const nome = document.getElementById('nome').value || 'amigo(a)';
    const idade = document.getElementById('idade').value || 'sua idade';
    const tempo = document.getElementById('tempo').value || 'seu tempo de contribuição';

    const texto = 'Olá! Aqui é o Jarvis. Bem-vindo ao PrevControl. ' +
      'Vou analisar se você tem direito a algum benefício. ' +
      'Você informou que se chama ' + nome + ', tem ' + idade + ' anos, ' +
      'e trabalhou por ' + tempo + ' anos. ' +
      'Clique no botão para enviar sua análise no WhatsApp e falar com um especialista.';

    filaDeFalas.push({ texto, voz: 'jarvis' });
    processarFila();
  }

  function falarKaterine() {
    // Para qualquer fala atual antes de começar a da Katerine
    speechSynthesis.cancel();
    filaDeFalas = [];
    falando = false;

    vozAtual = 'katerine';
    const nome = document.getElementById('nome').value || 'amigo(a)';
    const idade = document.getElementById('idade').value || 'sua idade';
    const tempo = document.getElementById('tempo').value || 'seu tempo de contribuição';

    const texto = 'Oi! Aqui é a Katerine. Que bom que você veio! ' +
      'Vou te ajudar a entender seus direitos. ' +
      'Pelo que vi, ' + nome + ', você tem ' + idade + ' anos ' +
      'e trabalhou ' + tempo + ' anos. ' +
      'Isso é muito importante! Toque no botão verde para falar com a gente no WhatsApp. ' +
      'Não tenha medo, estamos aqui para te ajudar!';

    filaDeFalas.push({ texto, voz: 'katerine' });
    processarFila();
  }

  function pararVoz() {
    speechSynthesis.cancel();
    filaDeFalas = [];
    falando = false;
    vozAtual = null;
    atualizarStatus('');
  }

  function atualizarStatus(msg) {
    document.getElementById('voz-status').textContent = msg;
  }

  // ===== LOGIN DO ADMIN =====
  function abrirLogin() {
    document.getElementById('modal-login').classList.add('mostrar');
  }
  function fecharLogin() {
    document.getElementById('modal-login').classList.remove('mostrar');
  }
  function fecharPainel() {
    document.getElementById('modal-painel').classList.remove('mostrar');
  }

  async function fazerLogin() {
    const u = document.getElementById('user-login').value;
    const p = document.getElementById('pass-login').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      if (res.ok) {
        const data = await res.json();
        fecharLogin();
        document.getElementById('user-badge').textContent = data.role;
        document.getElementById('cfg-phone').value = localStorage.getItem('office_phone') || DEFAULT_PHONE;
        document.getElementById('modal-painel').classList.add('mostrar');
        // Salva login para não precisar digitar de novo
        sessionStorage.setItem('admin_logado', '1');
      } else {
        alert('Usuário ou senha incorretos!');
      }
    } catch (e) {
      alert('Erro de conexão. Tente novamente.');
    }
  }

  // Se já estava logado nesta sessão, abre o painel direto
  if (sessionStorage.getItem('admin_logado') === '1') {
    window.addEventListener('load', () => {
      document.getElementById('user-badge').textContent = 'Administrador';
      document.getElementById('cfg-phone').value = localStorage.getItem('office_phone') || DEFAULT_PHONE;
      document.getElementById('modal-painel').classList.add('mostrar');
    });
  }

  function salvarConfig() {
    const num = document.getElementById('cfg-phone').value.trim();
    if (num) {
      localStorage.setItem('office_phone', num);
      alert('Número do WhatsApp salvo com sucesso!');
      fecharPainel();
    } else {
      alert('Digite um número válido');
    }
  }

  // ===== ENVIAR TRIAGEM =====
  async function enviarTriagem(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const sexo = document.getElementById('sexo').value;
    const idade = parseInt(document.getElementById('idade').value);
    const tempo = parseInt(document.getElementById('tempo').value);
    const rural = document.getElementById('rural').value;

    let msg = 'Olá! Sou ' + nome + '. Gostaria de uma análise de benefício.\\n\\n';
    msg += '- Sexo: ' + (sexo === 'M' ? 'Masculino' : 'Feminino') + '\\n';
    msg += '- Idade: ' + idade + ' anos\\n';
    msg += '- Tempo de trabalho: ' + tempo + ' anos\\n';
    msg += '- Trabalho rural: ' + (rural === 'rural' ? 'Sim' : 'Não') + '\\n';

    // Salva no banco de dados
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone: '', resumo: msg })
    });

    // Abre o WhatsApp
    const phone = localStorage.getItem('office_phone') || DEFAULT_PHONE;
    const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
  }

  // ===== FECHAR MODAIS COM ESC =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharLogin();
      fecharPainel();
    }
  });

  // ===== FECHAR MODAL CLICANDO FORA =====
  document.getElementById('modal-login').addEventListener('click', (e) => {
    if (e.target.id === 'modal-login') fecharLogin();
  });
  document.getElementById('modal-painel').addEventListener('click', (e) => {
    if (e.target.id === 'modal-painel') fecharPainel();
  });
</script>
</body>
</html>`;
}
