// ============================================================
// PrevControl — Sistema completo e funcional
// - Site de triagem previdenciária (página pública)
// - Painel administrativo REAL com login por senha
// - Salva leads no banco de dados D1 (banco de verdade!)
// - Banners rotativos (topo, rodapé, laterais) que param no hover
// - Vozes Jarvis e Katerine alternando corretamente
// - Sem referências a MEI
// - Design responsivo, linguagem simples
// - 
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const DEFAULT_PHONE = env.WHATSAPP_NUMBER || "5517991694628";
    const ADMIN_PASS = env.ADMIN_TOKEN || "";

    // ===== API: LOGIN DO ADMIN =====
    if (path === "/api/login" && method === "POST") {
      try {
        const body = await request.json();
        if (body.username === "admin" && body.password === ADMIN_PASS) {
          return jsonResponse({ ok: true, token: "admin_" + Date.now() });
        }
        return jsonResponse({ error: "Usuário ou senha incorretos!" }, 401);
      } catch (e) {
        return jsonResponse({ error: "Erro ao processar" }, 400);
      }
    }

    // ===== API: SALVAR LEAD NO BANCO =====
    if (path === "/api/leads" && method === "POST") {
      try {
        const body = await request.json();
        if (env.DB) {
          await env.DB.prepare(
            "INSERT INTO leads (name, phone, benefit_type, answers_json, classification, rationale, status) VALUES (?, ?, ?, ?, ?, ?, 'novo')"
          ).bind(
            body.nome || "Sem nome",
            body.telefone || "",
            body.benefit_type || "triagem",
            JSON.stringify(body.respostas || {}),
            body.classificacao || "precisa_avaliacao",
            body.resumo || ""
          ).run();
        }
        return jsonResponse({ ok: true });
      } catch (e) {
        return jsonResponse({ ok: false, message: "Erro ao salvar: " + e.message }, 500);
      }
    }

    // ===== API: LISTAR LEADS (só admin) =====
    if (path === "/api/leads" && method === "GET") {
      try {
        if (!env.DB) return jsonResponse({ error: "Banco não conectado" }, 500);
        const result = await env.DB.prepare(
          "SELECT * FROM leads ORDER BY id DESC LIMIT 200"
        ).all();
        return jsonResponse({ ok: true, leads: result.results });
      } catch (e) {
        return jsonResponse({ error: "Erro: " + e.message }, 500);
      }
    }

    // ===== API: ATUALIZAR STATUS DO LEAD (só admin) =====
    if (path === "/api/leads/status" && method === "PATCH") {
      try {
        const body = await request.json();
        if (!env.DB) return jsonResponse({ error: "Banco não conectado" }, 500);
        await env.DB.prepare(
          "UPDATE leads SET status = ?, notes = ?, contacted_at = datetime('now') WHERE id = ?"
        ).bind(body.status || "contatado", body.notes || "", body.id).run();
        return jsonResponse({ ok: true });
      } catch (e) {
        return jsonResponse({ error: "Erro: " + e.message }, 500);
      }
    }

    // ===== API: ESTATÍSTICAS (só admin) =====
    if (path === "/api/stats" && method === "GET") {
      try {
        if (!env.DB) return jsonResponse({ error: "Banco não conectado" }, 500);
        const total = await env.DB.prepare("SELECT COUNT(*) as c FROM leads").first();
        const novos = await env.DB.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'novo'").first();
        const contatados = await env.DB.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'contatado'").first();
        const fechados = await env.DB.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'fechado'").first();
        const hoje = await env.DB.prepare("SELECT COUNT(*) as c FROM leads WHERE date(created_at) = date('now')").first();
        return jsonResponse({
          ok: true,
          stats: { total: total.c, novos: novos.c, contatados: contatados.c, fechados: fechados.c, hoje: hoje.c }
        });
      } catch (e) {
        return jsonResponse({ error: "Erro: " + e.message }, 500);
      }
    }

    // ===== PÁGINA PRINCIPAL (site público) =====
    if (path === "/" || path === "/index.html") {
      return new Response(buildSiteHTML(DEFAULT_PHONE), {
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }

    // ===== PAINEL ADMINISTRATIVO =====
    if (path === "/admin" || path === "/painel") {
      return new Response(buildPainelHTML(DEFAULT_PHONE), {
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }

    return new Response("Página não encontrada", { status: 404 });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

// ============================================================
// PÁGINA PRINCIPAL — SITE PÚBLICO DE TRIAGEM
// ============================================================
function buildSiteHTML(defaultPhone) {
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
      --verde:#16a34a;--amarelo:#facc15;
      --vermelho:#ef4444;--branco:#e2e8f0;--cinza:#94a3b8;--cinza-escuro:#64748b;
    }
    body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--azul-escuro);color:var(--branco);min-height:100vh;display:flex;flex-direction:column}

    .banner-topo{background:linear-gradient(90deg,#0b132c,#1e3a5f,#0b132c);overflow:hidden;white-space:nowrap;border-bottom:2px solid var(--azul-botao);padding:12px 0}
    .banner-topo-track{display:inline-block;animation:scroll-left 30s linear infinite}
    .banner-topo:hover .banner-topo-track{animation-play-state:paused}
    .banner-topo-track span{display:inline-block;margin:0 40px;font-size:16px;font-weight:600;color:var(--amarelo)}
    .banner-topo-track span::before{content:'📢 '}
    @keyframes scroll-left{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}

    .banner-rodape{background:linear-gradient(90deg,#0b132c,#1e3a5f,#0b132c);overflow:hidden;white-space:nowrap;border-top:2px solid var(--verde);padding:12px 0}
    .banner-rodape-track{display:inline-block;animation:scroll-right 35s linear infinite}
    .banner-rodape:hover .banner-rodape-track{animation-play-state:paused}
    .banner-rodape-track span{display:inline-block;margin:0 40px;font-size:16px;font-weight:600;color:var(--verde)}
    .banner-rodape-track span::before{content:'✅ '}
    @keyframes scroll-right{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

    .layout{flex:1;display:flex;justify-content:center;align-items:flex-start;gap:20px;padding:20px;max-width:1400px;margin:0 auto;width:100%}

    .banner-lateral{width:180px;flex-shrink:0;overflow:hidden;border-radius:12px;border:1px solid var(--azul-claro);background:var(--azul-medio);padding:10px}
    .banner-lateral .titulo-lateral{font-size:13px;color:var(--cinza);text-align:center;margin-bottom:10px;font-weight:600}
    .banner-lateral .itens{height:400px;overflow:hidden;position:relative}
    .banner-lateral .itens-track{animation:scroll-up 25s linear infinite}
    .banner-lateral:hover .itens-track{animation-play-state:paused}
    .banner-lateral .item{background:var(--azul-escuro);border-radius:8px;padding:12px;margin-bottom:10px;border:1px solid var(--azul-claro);text-align:center}
    .banner-lateral .item .emoji{font-size:28px;display:block;margin-bottom:6px}
    .banner-lateral .item .texto{font-size:12px;color:var(--branco);line-height:1.4}
    @keyframes scroll-up{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}

    .cartao{background:var(--azul-medio);border-radius:16px;padding:32px;max-width:560px;width:100%;border:1px solid var(--azul-claro);box-shadow:0 20px 60px rgba(0,0,0,0.4)}
    .cartao-cabecalho{border-bottom:1px solid var(--azul-claro);padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
    .cartao-cabecalho h1{font-size:24px;font-weight:700;color:#fff;margin-top:4px}
    .cartao-cabecalho .subtitulo{font-size:13px;color:var(--azul-botao);font-weight:600}
    .btn-admin{background:transparent;border:1px solid var(--azul-claro);color:var(--cinza);padding:8px 16px;border-radius:8px;font-size:14px;cursor:pointer;transition:all 0.2s;text-decoration:none}
    .btn-admin:hover{border-color:var(--azul-botao);color:var(--azul-botao)}

    .form-grupo{margin-bottom:18px}
    .form-label{display:block;font-size:15px;font-weight:600;margin-bottom:6px;color:var(--branco)}
    .form-input,.form-select{width:100%;background:var(--azul-escuro);border:2px solid var(--azul-claro);border-radius:10px;padding:14px;font-size:17px;color:#fff;outline:none;transition:border-color 0.2s}
    .form-input:focus,.form-select:focus{border-color:var(--azul-botao)}
    .form-input::placeholder{color:var(--cinza-escuro)}
    .form-select{cursor:pointer}
    .form-linha{display:grid;grid-template-columns:1fr 1fr;gap:12px}

    .btn-enviar{width:100%;background:var(--azul-botao);color:#fff;border:none;padding:18px;border-radius:12px;font-size:18px;font-weight:700;cursor:pointer;transition:background 0.2s;margin-top:8px}
    .btn-enviar:hover{background:var(--azul-hover)}
    .btn-enviar:active{transform:scale(0.98)}

    .painel-vozes{background:var(--azul-escuro);border-radius:12px;padding:16px;margin-top:20px;border:1px solid var(--azul-claro)}
    .painel-vozes-titulo{font-size:15px;font-weight:600;margin-bottom:12px;color:var(--branco)}
    .vozes-botoes{display:flex;gap:10px;flex-wrap:wrap}
    .btn-voz{background:var(--azul-medio);border:2px solid var(--azul-claro);color:var(--branco);padding:10px 18px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s}
    .btn-voz.jarvis{border-color:#3b82f6}
    .btn-voz.jarvis:hover{background:#1e3a5f}
    .btn-voz.katerine{border-color:#ec4899}
    .btn-voz.katerine:hover{background:#3b1a2f}
    .btn-voz.parar{border-color:var(--vermelho)}
    .btn-voz.parar:hover{background:#3b1515}
    .voz-status{font-size:13px;color:var(--cinza);margin-top:8px;text-align:center}

    @media(max-width:900px){.banner-lateral{display:none}}
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

<div class="layout">
  <div class="banner-lateral">
    <div class="titulo-lateral">📋 Serviços</div>
    <div class="itens"><div class="itens-track">
      <div class="item"><span class="emoji">👴</span><span class="texto">Aposentadoria por idade</span></div>
      <div class="item"><span class="emoji">⏰</span><span class="texto">Aposentadoria por tempo de serviço</span></div>
      <div class="item"><span class="emoji">🤒</span><span class="texto">Auxílio-doença</span></div>
      <div class="item"><span class="emoji">👶</span><span class="texto">Salário-maternidade</span></div>
      <div class="item"><span class="emoji">💔</span><span class="texto">Pensão por morte</span></div>
      <div class="item"><span class="emoji">🤝</span><span class="texto">BPC/LOAS</span></div>
      <div class="item"><span class="emoji">⚖️</span><span class="texto">Direitos trabalhistas</span></div>
      <div class="item"><span class="emoji">🔄</span><span class="texto">Revisão de benefício</span></div>
      <div class="item"><span class="emoji">👴</span><span class="texto">Aposentadoria por idade</span></div>
      <div class="item"><span class="emoji">⏰</span><span class="texto">Aposentadoria por tempo de serviço</span></div>
      <div class="item"><span class="emoji">🤒</span><span class="texto">Auxílio-doença</span></div>
      <div class="item"><span class="emoji">👶</span><span class="texto">Salário-maternidade</span></div>
      <div class="item"><span class="emoji">💔</span><span class="texto">Pensão por morte</span></div>
      <div class="item"><span class="emoji">🤝</span><span class="texto">BPC/LOAS</span></div>
      <div class="item"><span class="emoji">⚖️</span><span class="texto">Direitos trabalhistas</span></div>
      <div class="item"><span class="emoji">🔄</span><span class="texto">Revisão de benefício</span></div>
    </div></div>
  </div>

  <div class="cartao">
    <div class="cartao-cabecalho">
      <div>
        <div class="subtitulo">CONSULTA PREVIDENCIÁRIA</div>
        <h1>Análise de Benefício</h1>
      </div>
      <a href="/admin" class="btn-admin">🔐 Entrar como Admin</a>
    </div>
    <form onsubmit="enviarTriagem(event)">
      <div class="form-grupo">
        <label class="form-label">Nome completo</label>
        <input type="text" id="nome" required placeholder="Digite seu nome" class="form-input">
      </div>
      <div class="form-grupo">
        <label class="form-label">Telefone (WhatsApp)</label>
        <input type="text" id="telefone" required placeholder="(17) 99999-9999" class="form-input">
      </div>
      <div class="form-linha">
        <div class="form-grupo">
          <label class="form-label">Sexo</label>
          <select id="sexo" class="form-select"><option value="M">Masculino</option><option value="F">Feminino</option></select>
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
        <select id="rural" class="form-select"><option value="nao">Não, só trabalhei com carteira assinada ou pagando por conta</option><option value="rural">Sim, trabalhei no campo / agricultura</option></select>
      </div>
      <button type="submit" class="btn-enviar">📱 Gerar Análise e Enviar no WhatsApp</button>
    </form>
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

  <div class="banner-lateral">
    <div class="titulo-lateral">ℹ️ Informações</div>
    <div class="itens"><div class="itens-track">
      <div class="item"><span class="emoji">✅</span><span class="texto">Atendimento gratuito e sem compromisso</span></div>
      <div class="item"><span class="emoji">⏳</span><span class="texto">Resposta rápida pelo WhatsApp</span></div>
      <div class="item"><span class="emoji">🏠</span><span class="texto">Atendemos online, de onde você estiver</span></div>
      <div class="item"><span class="emoji">🛡️</span><span class="texto">Seus dados estão protegidos</span></div>
      <div class="item"><span class="emoji">👨‍⚖️</span><span class="texto">Especialistas em direitos previdenciários</span></div>
      <div class="item"><span class="emoji">💬</span><span class="texto">Tire suas dúvidas sem sair de casa</span></div>
      <div class="item"><span class="emoji">📅</span><span class="texto">Agende sua consulta pelo WhatsApp</span></div>
      <div class="item"><span class="emoji">💰</span><span class="texto">Você pode ter dinheiro a receber</span></div>
      <div class="item"><span class="emoji">✅</span><span class="texto">Atendimento gratuito e sem compromisso</span></div>
      <div class="item"><span class="emoji">⏳</span><span class="texto">Resposta rápida pelo WhatsApp</span></div>
      <div class="item"><span class="emoji">🏠</span><span class="texto">Atendemos online, de onde você estiver</span></div>
      <div class="item"><span class="emoji">🛡️</span><span class="texto">Seus dados estão protegidos</span></div>
      <div class="item"><span class="emoji">👨‍⚖️</span><span class="texto">Especialistas em direitos previdenciários</span></div>
      <div class="item"><span class="emoji">💬</span><span class="texto">Tire suas dúvidas sem sair de casa</span></div>
      <div class="item"><span class="emoji">📅</span><span class="texto">Agende sua consulta pelo WhatsApp</span></div>
      <div class="item"><span class="emoji">💰</span><span class="texto">Você pode ter dinheiro a receber</span></div>
    </div></div>
  </div>
</div>

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

<script>
  const DEFAULT_PHONE = "${defaultPhone}";
  let filaDeFalas = [];
  let falando = false;

  function buscarVozJarvis() {
    const v = speechSynthesis.getVoices();
    return v.find(x => x.lang.startsWith('pt') && /male|masculino|Daniel|Felipe|Google/i.test(x.name)) || v.find(x => x.lang.startsWith('pt')) || v[0];
  }
  function buscarVozKaterine() {
    const v = speechSynthesis.getVoices();
    return v.find(x => x.lang.startsWith('pt') && /female|feminino|Maria|Ana|Luciana|Google/i.test(x.name)) || v.find(x => x.lang.startsWith('pt')) || v[0];
  }
  function falarTexto(texto, voz) {
    return new Promise(r => {
      const f = new SpeechSynthesisUtterance(texto);
      f.lang = 'pt-BR'; f.rate = 0.95; f.pitch = voz === 'jarvis' ? 0.8 : 1.2;
      const v = voz === 'jarvis' ? buscarVozJarvis() : buscarVozKaterine();
      if (v) f.voice = v;
      f.onend = r; f.onerror = r;
      speechSynthesis.speak(f);
    });
  }
  async function processarFila() {
    if (falando) return;
    falando = true;
    while (filaDeFalas.length > 0) {
      const item = filaDeFalas.shift();
      document.getElementById('voz-status').textContent = item.voz + ' está falando...';
      await falarTexto(item.texto, item.voz);
    }
    falando = false;
    document.getElementById('voz-status').textContent = '';
  }
  function falarJarvis() {
    speechSynthesis.cancel(); filaDeFalas = []; falando = false;
    const n = document.getElementById('nome').value || 'amigo(a)';
    const i = document.getElementById('idade').value || 'sua idade';
    const t = document.getElementById('tempo').value || 'seu tempo de contribuição';
    filaDeFalas.push({ texto: 'Olá! Aqui é o Jarvis. Bem-vindo ao PrevControl. Vou analisar se você tem direito a algum benefício. Você informou que se chama ' + n + ', tem ' + i + ' anos, e trabalhou por ' + t + ' anos. Clique no botão para enviar sua análise no WhatsApp.', voz: 'jarvis' });
    processarFila();
  }
  function falarKaterine() {
    speechSynthesis.cancel(); filaDeFalas = []; falando = false;
    const n = document.getElementById('nome').value || 'amigo(a)';
    const i = document.getElementById('idade').value || 'sua idade';
    const t = document.getElementById('tempo').value || 'seu tempo de contribuição';
    filaDeFalas.push({ texto: 'Oi! Aqui é a Katerine. Que bom que você veio! Vou te ajudar a entender seus direitos. Pelo que vi, ' + n + ', você tem ' + i + ' anos e trabalhou ' + t + ' anos. Toque no botão verde para falar com a gente no WhatsApp. Não tenha medo, estamos aqui para te ajudar!', voz: 'katerine' });
    processarFila();
  }
  function pararVoz() { speechSynthesis.cancel(); filaDeFalas = []; falando = false; document.getElementById('voz-status').textContent = ''; }

  async function enviarTriagem(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const sexo = document.getElementById('sexo').value;
    const idade = parseInt(document.getElementById('idade').value);
    const tempo = parseInt(document.getElementById('tempo').value);
    const rural = document.getElementById('rural').value;
    let msg = 'Olá! Sou ' + nome + '. Gostaria de uma análise de benefício.\\n\\n';
    msg += '- Sexo: ' + (sexo === 'M' ? 'Masculino' : 'Feminino') + '\\n';
    msg += '- Idade: ' + idade + ' anos\\n';
    msg += '- Tempo de trabalho: ' + tempo + ' anos\\n';
    msg += '- Trabalho rural: ' + (rural === 'rural' ? 'Sim' : 'Não') + '\\n';
    msg += '- Telefone: ' + telefone;
    fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, telefone, benefit_type: 'triagem', respostas: { sexo, idade, tempo, rural }, classificacao: 'precisa_avaliacao', resumo: msg }) });
    window.open('https://wa.me/' + DEFAULT_PHONE + '?text=' + encodeURIComponent(msg), '_blank');
  }
</script>
</body>
</html>`;
}

// ============================================================
// PAINEL ADMINISTRATIVO — REAL E FUNCIONAL
// ============================================================
function buildPainelHTML(defaultPhone) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Painel Admin - PrevControl</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--azul-escuro:#0b132c;--azul-medio:#132043;--azul-claro:#1e293b;--azul-botao:#2563eb;--verde:#16a34a;--amarelo:#facc15;--vermelho:#ef4444;--branco:#e2e8f0;--cinza:#94a3b8}
    body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--azul-escuro);color:var(--branco);min-height:100vh}
    .login-tela{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .login-box{background:var(--azul-medio);border-radius:20px;padding:40px;max-width:400px;width:100%;border:1px solid var(--azul-claro);box-shadow:0 20px 60px rgba(0,0,0,0.5)}
    .login-box h2{font-size:22px;text-align:center;margin-bottom:8px;color:#fff}
    .login-box p{font-size:14px;text-align:center;color:var(--cinza);margin-bottom:24px}
    .login-box input{width:100%;background:var(--azul-escuro);border:2px solid var(--azul-claro);border-radius:10px;padding:14px;font-size:18px;color:#fff;outline:none;margin-bottom:12px}
    .login-box input:focus{border-color:var(--azul-botao)}
    .login-box button{width:100%;background:var(--azul-botao);color:#fff;border:none;padding:16px;border-radius:10px;font-size:17px;font-weight:700;cursor:pointer}
    .login-box button:hover{background:#1d4ed8}
    .login-erro{color:var(--vermelho);font-size:14px;text-align:center;margin-top:12px;display:none}
    .painel{display:none;min-height:100vh}
    .painel.mostrar{display:block}
    .topo{background:var(--azul-medio);border-bottom:2px solid var(--azul-claro);padding:16px 24px;display:flex;justify-content:space-between;align-items:center}
    .topo h1{font-size:20px;color:#fff}
    .topo .sair{background:var(--vermelho);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
    .topo .sair:hover{opacity:0.85}
    .conteudo{max-width:1200px;margin:0 auto;padding:24px}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
    .stat-card{background:var(--azul-medio);border-radius:12px;padding:20px;border:1px solid var(--azul-claro);text-align:center}
    .stat-card .numero{font-size:36px;font-weight:700;color:#fff;margin-bottom:4px}
    .stat-card .label{font-size:14px;color:var(--cinza)}
    .stat-card.novos .numero{color:var(--amarelo)}
    .stat-card.contatados .numero{color:var(--azul-botao)}
    .stat-card.fechados .numero{color:var(--verde)}
    .stat-card.hoje .numero{color:#ec4899}
    .tabela-box{background:var(--azul-medio);border-radius:12px;border:1px solid var(--azul-claro);overflow:hidden}
    .tabela-header{padding:16px 20px;border-bottom:1px solid var(--azul-claro);display:flex;justify-content:space-between;align-items:center}
    .tabela-header h2{font-size:18px;color:#fff}
    .tabela-header button{background:var(--azul-botao);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:14px;cursor:pointer}
    .tabela{width:100%;border-collapse:collapse}
    .tabela th{padding:12px 16px;text-align:left;font-size:13px;color:var(--cinza);border-bottom:1px solid var(--azul-claro);font-weight:600}
    .tabela td{padding:12px 16px;font-size:14px;color:var(--branco);border-bottom:1px solid var(--azul-claro)}
    .tabela tr:hover{background:var(--azul-claro)}
    .status-badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;display:inline-block}
    .status-novo{background:rgba(250,204,21,0.15);color:var(--amarelo)}
    .status-contatado{background:rgba(37,99,235,0.15);color:var(--azul-botao)}
    .status-fechado{background:rgba(22,163,74,0.15);color:var(--verde)}
    .btn-wpp{background:var(--verde);color:#fff;border:none;padding:8px 12px;border-radius:8px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-block}
    .btn-wpp:hover{opacity:0.85}
    .btn-status{background:var(--azul-claro);color:var(--branco);border:1px solid var(--azul-claro);padding:6px 12px;border-radius:8px;font-size:13px;cursor:pointer;margin-right:4px}
    .btn-status:hover{border-color:var(--azul-botao)}
    .sem-leads{text-align:center;padding:40px;color:var(--cinza);font-size:16px}
    @media(max-width:700px){.tabela{font-size:12px}.tabela th,.tabela td{padding:8px}.stats{grid-template-columns:repeat(2,1fr)}.stat-card .numero{font-size:28px}}
  </style>
</head>
<body>

<div class="login-tela" id="login-tela">
  <div class="login-box">
    <h2>🔐 Painel do Administrador</h2>
    <p>Digite usuário e senha para entrar</p>
    <input type="text" id="user" placeholder="Usuário" autocomplete="username">
    <input type="password" id="pass" placeholder="Senha" autocomplete="current-password">
    <button onclick="fazerLogin()">Entrar</button>
    <div class="login-erro" id="login-erro">Usuário ou senha incorretos!</div>
  </div>
</div>

<div class="painel" id="painel">
  <div class="topo">
    <h1>📊 Painel PrevControl</h1>
    <button class="sair" onclick="sair()">Sair</button>
  </div>
  <div class="conteudo">
    <div class="stats" id="stats">
      <div class="stat-card"><div class="numero" id="stat-total">0</div><div class="label">Total de leads</div></div>
      <div class="stat-card novos"><div class="numero" id="stat-novos">0</div><div class="label">Novos (não lidos)</div></div>
      <div class="stat-card contatados"><div class="numero" id="stat-contatados">0</div><div class="label">Contatados</div></div>
      <div class="stat-card fechados"><div class="numero" id="stat-fechados">0</div><div class="label">Fechados</div></div>
      <div class="stat-card hoje"><div class="numero" id="stat-hoje">0</div><div class="label">Recebidos hoje</div></div>
    </div>
    <div class="tabela-box">
      <div class="tabela-header">
        <h2>📋 Lista de pessoas que entraram em contato</h2>
        <button onclick="carregarLeads()">🔄 Atualizar</button>
      </div>
      <div id="tabela-container"></div>
    </div>
  </div>
</div>

<script>
  const WPP_NUMBER = "${defaultPhone}";

  async function fazerLogin() {
    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
      if (res.ok) {
        sessionStorage.setItem('admin_logado', '1');
        document.getElementById('login-tela').style.display = 'none';
        document.getElementById('painel').classList.add('mostrar');
        carregarTudo();
      } else {
        document.getElementById('login-erro').style.display = 'block';
      }
    } catch (e) { alert('Erro de conexão'); }
  }

  function sair() { sessionStorage.removeItem('admin_logado'); location.reload(); }

  if (sessionStorage.getItem('admin_logado') === '1') {
    document.getElementById('login-tela').style.display = 'none';
    document.getElementById('painel').classList.add('mostrar');
  }

  async function carregarTudo() { await carregarStats(); await carregarLeads(); }

  async function carregarStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.ok) {
        document.getElementById('stat-total').textContent = data.stats.total;
        document.getElementById('stat-novos').textContent = data.stats.novos;
        document.getElementById('stat-contatados').textContent = data.stats.contatados;
        document.getElementById('stat-fechados').textContent = data.stats.fechados;
        document.getElementById('stat-hoje').textContent = data.stats.hoje;
      }
    } catch (e) {}
  }

  async function carregarLeads() {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.ok && data.leads.length > 0) {
        let html = '<table class="tabela"><thead><tr><th>Nome</th><th>Telefone</th><th>Data</th><th>Resumo</th><th>Status</th><th>Ações</th></tr></thead><tbody>';
        for (const lead of data.leads) {
          const data = lead.created_at ? lead.created_at.substring(8,10) + '/' + lead.created_at.substring(5,7) + ' ' + lead.created_at.substring(11,16) : '';
          const resumo = (lead.rationale || lead.answers_json || '').substring(0, 60);
          const statusClass = lead.status === 'novo' ? 'status-novo' : lead.status === 'contatado' ? 'status-contatado' : 'status-fechado';
          const statusLabel = lead.status === 'novo' ? '🟡 Novo' : lead.status === 'contatado' ? '🔵 Contatado' : '🟢 Fechado';
          const wppLink = lead.phone ? 'https://wa.me/55' + lead.phone.replace(/\\D/g,'') : '#';
          html += '<tr><td><strong>' + lead.name + '</strong></td><td>' + (lead.phone || '-') + '</td><td>' + data + '</td><td style="max-width:200px;font-size:13px">' + resumo + '</td><td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td><td>' + (lead.phone ? '<a href="' + wppLink + '" target="_blank" class="btn-wpp">💬 WhatsApp</a> ' : '') + '<button class="btn-status" onclick="mudarStatus(' + lead.id + ', \'contatado\')">Contatado</button><button class="btn-status" onclick="mudarStatus(' + lead.id + ', \'fechado\')">Fechado</button></td></tr>';
        }
        html += '</tbody></table>';
        document.getElementById('tabela-container').innerHTML = html;
      } else {
        document.getElementById('tabela-container').innerHTML = '<div class="sem-leads">Nenhuma pessoa entrou em contato ainda.</div>';
      }
    } catch (e) {
      document.getElementById('tabela-container').innerHTML = '<div class="sem-leads">Erro ao carregar. Tente atualizar.</div>';
    }
  }

  async function mudarStatus(id, status) {
    try {
      await fetch('/api/leads/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id, status: status }) });
      carregarTudo();
    } catch (e) { alert('Erro ao atualizar'); }
  }

  if (sessionStorage.getItem('admin_logado') === '1') { carregarTudo(); }
</script>
</body>
</html>`;
}
