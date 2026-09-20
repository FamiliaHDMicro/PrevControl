// ============================================================
// app.js — PrevControl com Jarvis & Katerina
// Interface pública de triagem com voz
// Linguagem simples, sem juridiquês.
// ============================================================

const state = {
  currentSlide: 0,
  slides: [],
  answers: {
    nome: "",
    telefone: "",
    sector: "",
    benefitKey: "",
    benefitLabel: "",
    questionAnswers: {},
    observacao: "",
    consentGiven: false
  },
  sectors: [],
  benefits: [],
  routerOptions: [],
  isSpeaking: false,
  speechQueue: [],
  currentVoice: "pt-BR-AntonioNeural"
};

// ============================================================
// VOZES POR SETOR
// ============================================================

const VOICES = {
  previdencia: "pt-BR-AntonioNeural",
  trabalhista: "pt-BR-FranciscaNeural",
  empresarial: "pt-BR-AntonioNeural"
};

const AVATARS = {
  previdencia: "️",
  trabalhista: "🎙️",
  empresarial: "🎙️"
};

const ASSISTANT_NAMES = {
  previdencia: "Jarvis",
  trabalhista: "Katerina",
  empresarial: "Jarvis"
};

function getAssistantName() {
  return ASSISTANT_NAMES[state.answers.sector] || "Jarvis";
}

function getVoice() {
  return VOICES[state.answers.sector] || "pt-BR-AntonioNeural";
}

function isFemaleVoice() {
  return state.answers.sector === "trabalhista";
}

// ============================================================
// EDGE TTS — SÍNTESE DE VOZ GRATUITA
// ============================================================

async function speak(text) {
  if (!text || state.isSpeaking) {
    state.speechQueue.push(text);
    return;
  }

  state.isSpeaking = true;
  updateJarvisIndicator(true, text);

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        voice: getVoice()
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));

      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play().catch(reject);
      });
    } else {
      // Fallback: Web Speech API nativa do navegador
      speakFallback(text);
    }
  } catch (error) {
    console.warn("TTS fallback:", error);
    speakFallback(text);
  }

  state.isSpeaking = false;
  updateJarvisIndicator(false, "");

  // Processar fila
  if (state.speechQueue.length > 0) {
    const next = state.speechQueue.shift();
    speak(next);
  }
}

function speakFallback(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = isFemaleVoice() ? 1.1 : 0.95;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith("pt-BR"));
    if (ptVoice) utterance.voice = ptVoice;

    return new Promise(resolve => {
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
  }
}

function stopSpeaking() {
  state.speechQueue = [];
  state.isSpeaking = false;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  updateJarvisIndicator(false, "");
}

// ============================================================
// INDICADOR VISUAL DO JARVIS/KATERINA
// ============================================================

function updateJarvisIndicator(speaking, text) {
  const indicator = document.querySelector(".jarvis-indicator");
  if (!indicator) return;

  if (speaking) {
    indicator.classList.add("jarvis-speaking");
    const textEl = indicator.querySelector(".jarvis-text");
    if (textEl && text) {
      textEl.innerHTML = `<strong>${getAssistantName()}:</strong> ${escapeHtml(text)}`;
    }
  } else {
    indicator.classList.remove("jarvis-speaking");
  }
}

function renderJarvisIndicator(message) {
  const female = isFemaleVoice();
  const name = getAssistantName();
  const avatarClass = female ? "jarvis-avatar female" : "jarvis-avatar";

  return `
    <div class="jarvis-indicator">
      <div class="${avatarClass}">${female ? "👩" : "👨"}</div>
      <div class="jarvis-text">
        <strong>${escapeHtml(name)}:</strong> ${escapeHtml(message)}
      </div>
    </div>
  `;
}

// ============================================================
// SEGURANÇA BÁSICA PARA TEXTO EXIBIDO NO HTML
// ============================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// CARREGAR CONFIGURAÇÃO
// ============================================================

async function loadConfig() {
  try {
    const sectorsRes = await fetch("/api/sectors");
    if (!sectorsRes.ok) throw new Error(`Erro setores: ${sectorsRes.status}`);
    const sectorsData = await sectorsRes.json();
    state.sectors = sectorsData.sectors || [];

    const benefitsRes = await fetch("/api/benefits");
    if (!benefitsRes.ok) throw new Error(`Erro benefícios: ${benefitsRes.status}`);
    const benefitsData = await benefitsRes.json();
    state.benefits = benefitsData.benefits || [];

    buildSlides();
  } catch (error) {
    console.error("Erro ao carregar configuração:", error);
    state.sectors = [];
    state.benefits = [];
    buildSlides();
  }
}

// ============================================================
// SAUDAÇÃO BASEADA NO HORÁRIO
// ============================================================

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

// ============================================================
// ESTRUTURA DAS TELAS
// ============================================================

function buildSlides() {
  state.slides = [
    { type: "welcome" },
    { type: "sector" },
    { type: "identity" },
    { type: "router" },
    { type: "final" },
    { type: "consent" },
    { type: "success" }
  ];

  renderAllSlides();
  renderDots();
  goToSlide(0);

  // Saudação inicial com voz
  setTimeout(() => {
    speak(`${getGreeting()}! Sou o Jarvis. Em que posso te ajudar hoje?`);
  }, 600);
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================

function renderAllSlides() {
  const track = document.getElementById("slideTrack");
  if (!track) return;

  track.innerHTML = state.slides
    .map((slide, index) => renderSlide(slide, index))
    .join("");
}

function renderSlide(slide, index) {
  switch (slide.type) {
    case "welcome": return renderWelcome(index);
    case "sector": return renderSector(index);
    case "identity": return renderIdentity(index);
    case "router": return renderRouter(index);
    case "question": return renderQuestion(slide, index);
    case "final": return renderFinal(index);
    case "consent": return renderConsent(index);
    case "success": return renderSuccess(index);
    default: return "";
  }
}

// ============================================================
// TELA 0 — BOAS-VINDAS
// ============================================================

function renderWelcome(index) {
  const greeting = getGreeting();

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Boas-vindas">
      <div class="module-card">

        <div class="module-number">PrevControl</div>

        ${renderJarvisIndicator(`${greeting}! Sou o Jarvis. Em que posso te ajudar hoje?`)}

        <h2 class="module-title">${greeting}!</h2>

        <p class="module-subtitle">
          Vou te ajudar a entender sua situação.
          Não precisa se preocupar com termos difíceis — eu explico tudo.
          Vamos juntos?
        </p>

        <p class="module-subtitle" style="font-size:.85rem;color:var(--text-muted);">
          Escolha abaixo o assunto que mais combina com o que está acontecendo.
        </p>

        <div class="nav-row" style="justify-content:flex-end;">
          <button onclick="nextSlide()" class="nav-btn nav-btn-primary">
            Começar →
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA 1 — ESCOLHA DO SETOR
// ============================================================

function renderSector(index) {
  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Escolha do setor">
      <div class="module-card">

        <div class="module-number">📍 Primeiro passo</div>

        ${renderJarvisIndicator("Me conta: onde podemos ajudar você? Escolha o assunto abaixo.")}

        <h2 class="module-title">Onde podemos ajudar você?</h2>

        <p class="module-subtitle">
          Toque na opção que mais combina com sua situação.
        </p>

        <div class="options-stack" role="radiogroup" aria-label="Áreas de atendimento">
          ${state.sectors.map((sector, idx) => `
            <button
              onclick="selectSector('${escapeHtml(sector.key)}', this)"
              class="option-btn ${state.answers.sector === sector.key ? "selected" : ""}"
              data-value="${escapeHtml(sector.key)}"
              role="radio"
              aria-checked="${state.answers.sector === sector.key}"
            >
              <span class="option-marker">${escapeHtml(sector.icon || idx + 1)}</span>
              <span style="display:flex;flex-direction:column;text-align:left;">
                <strong>${escapeHtml(sector.label)}</strong>
                <small style="opacity:.75;margin-top:3px;">${escapeHtml(sector.description)}</small>
              </span>
            </button>
          `).join("")}
        </div>

        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmSector()" class="nav-btn nav-btn-primary" id="btn-sector-next" disabled>
            Continuar →
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA 2 — IDENTIDADE (NOME + WHATSAPP)
// ============================================================

function renderIdentity(index) {
  const name = getAssistantName();

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Identificação">
      <div class="module-card">

        <div class="module-number">👤 Identificação</div>

        ${renderJarvisIndicator(`Pra eu poder te ajudar melhor, me diz seu nome e um WhatsApp?`)}

        <h2 class="module-title">Como posso te chamar?</h2>

        <p class="module-subtitle">
          Preciso do seu nome e WhatsApp pra poder te atender e enviar o resultado.
        </p>

        <div class="field-group">
          <label class="field-label" for="field-nome">Seu nome</label>
          <input
            id="field-nome"
            class="input-base"
            placeholder="Como podemos te chamar?"
            value="${escapeHtml(state.answers.nome)}"
            maxlength="60"
            aria-required="true"
          >
        </div>

        <div class="field-group">
          <label class="field-label" for="field-telefone">WhatsApp com DDD</label>
          <input
            id="field-telefone"
            class="input-base"
            placeholder="(17) 99999-9999"
            value="${escapeHtml(state.answers.telefone)}"
            maxlength="15"
            aria-required="true"
          >
          <div class="field-error" id="erro-identity" role="alert"></div>
        </div>

        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmIdentity()" class="nav-btn nav-btn-primary">
            Continuar →
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA 3 — ESCOLHA DO ASSUNTO
// ============================================================

function renderRouter(index) {
  const options = state.benefits.filter(b => b.sector === state.answers.sector);
  state.routerOptions = options;

  const sector = state.sectors.find(s => s.key === state.answers.sector);
  const name = getAssistantName();

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Escolha do assunto">
      <div class="module-card">

        <div class="module-number">
          ${escapeHtml(sector?.icon || "📋")} ${escapeHtml(sector?.label || "Assunto")}
        </div>

        ${renderJarvisIndicator(`Entendi. Me conta melhor: o que está acontecendo? Escolha a opção abaixo.`)}

        <h2 class="module-title">O que está acontecendo?</h2>

        <p class="module-subtitle">
          Toque na opção que mais se parece com sua situação.
        </p>

        <div class="options-stack" role="radiogroup" aria-label="Assuntos">
          ${options.map((option, idx) => `
            <button
              onclick="selectRouter('${escapeHtml(option.key)}', this)"
              class="option-btn ${state.answers.benefitKey === option.key ? "selected" : ""}"
              data-value="${escapeHtml(option.key)}"
              role="radio"
              aria-checked="${state.answers.benefitKey === option.key}"
            >
              <span class="option-marker">${idx + 1}</span>
              <span style="display:flex;flex-direction:column;text-align:left;">
                <strong>${escapeHtml(option.label)}</strong>
                <small style="opacity:.75;margin-top:3px;">${escapeHtml(option.description || "")}</small>
              </span>
            </button>
          `).join("")}
        </div>

        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmRouter()" class="nav-btn nav-btn-primary" id="btn-router-next" disabled>
            Continuar →
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA N — PERGUNTA
// ============================================================

function renderQuestion(slide, index) {
  const q = slide.question;
  const currentVal = state.answers.questionAnswers[q.id] || "";
  const name = getAssistantName();

  let inputHtml = "";

  if (q.type === "choice") {
    inputHtml = `
      <div class="options-stack" role="radiogroup" aria-label="${escapeHtml(q.label)}">
        ${q.options.map((option, idx) => `
          <button
            onclick="selectChoice('${escapeHtml(q.id)}', '${escapeHtml(option)}', this)"
            class="option-btn ${currentVal === option ? "selected" : ""}"
            role="radio"
            aria-checked="${currentVal === option}"
          >
            <span class="option-marker">${String.fromCharCode(65 + idx)}</span>
            <span>${escapeHtml(option)}</span>
          </button>
        `).join("")}
      </div>
    `;
  } else if (q.type === "number") {
    inputHtml = `
      <input
        id="field-${escapeHtml(q.id)}"
        class="input-base"
        type="number"
        min="0"
        placeholder="${q.unit === "anos" ? "Ex.: 25" : "Ex.: 12"}"
        value="${escapeHtml(currentVal)}"
        aria-label="${escapeHtml(q.label)}"
      >
    `;
  } else {
    inputHtml = `
      <input
        id="field-${escapeHtml(q.id)}"
        class="input-base"
        type="text"
        placeholder="${escapeHtml(q.placeholder || "Sua resposta")}"
        value="${escapeHtml(currentVal)}"
        aria-label="${escapeHtml(q.label)}"
      >
    `;
  }

  const questionText = q.unit
    ? `${q.label} Responda em ${q.unit}.`
    : q.label;

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Pergunta ${slide.questionIndex + 1}">
      <div class="module-card">

        <div class="module-number">📝 Pergunta ${slide.questionIndex + 1} de ${slide.totalQuestions}</div>

        ${renderJarvisIndicator(questionText)}

        <h2 class="module-title">${escapeHtml(q.label)}</h2>

        ${q.unit ? `<p class="module-subtitle">Responda em ${escapeHtml(q.unit)}.</p>` : ""}

        ${inputHtml}

        <div class="field-error" id="erro-q-${escapeHtml(q.id)}" role="alert"></div>

        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button
            onclick="confirmQuestion('${escapeHtml(q.id)}')"
            class="nav-btn nav-btn-primary"
          >
            ${slide.questionIndex + 1 < slide.totalQuestions ? "Próxima →" : "Continuar →"}
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA — OBSERVAÇÕES FINAIS
// ============================================================

function renderFinal(index) {
  const name = getAssistantName();

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Observações">
      <div class="module-card">

        <div class="module-number">✨ Última etapa</div>

        ${renderJarvisIndicator("Quer contar mais alguma coisa? Essa parte é opcional.")}

        <h2 class="module-title">Quer contar mais alguma coisa?</h2>

        <p class="module-subtitle">
          Se quiser, conte algo importante que não apareceu nas perguntas.
          Essa parte é opcional.
        </p>

        <textarea
          id="field-observacao"
          class="input-base"
          style="min-height:120px;resize:vertical;"
          placeholder="Escreva aqui, se quiser..."
          aria-label="Observações adicionais"
        >${escapeHtml(state.answers.observacao)}</textarea>

        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="goToConsent()" class="nav-btn nav-btn-primary">
            Continuar →
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA — ACEITE / CONSENTIMENTO
// ============================================================

function renderConsent(index) {
  const name = getAssistantName();
  const firstName = escapeHtml(String(state.answers.nome || "").trim().split(/\s+/)[0]);

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Consentimento">
      <div class="module-card">

        <div class="module-number">📋 Consentimento</div>

        ${renderJarvisIndicator(`${firstName}, suas respostas serão enviadas ao escritório responsável. O Sr. Cleiton entrará em contato com você. Posso enviar?`)}

        <h2 class="module-title">Posso enviar sua análise?</h2>

        <p class="module-subtitle">
          Suas respostas serão encaminhadas ao escritório responsável.
          O Sr. Cleiton analisará suas informações e entrará em contato
          pelo WhatsApp que você informou.
        </p>

        <div class="consent-box">
          <label>
            <input type="checkbox" id="consent-check" onchange="toggleConsent(this.checked)">
            <span>
              Eu autorizo o envio das minhas respostas ao escritório responsável
              e concordo que o Sr. Cleiton entre em contato comigo pelo WhatsApp informado.
            </span>
          </label>
        </div>

        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button
            onclick="submitFinal()"
            class="nav-btn nav-btn-primary"
            id="btn-consent-submit"
            disabled
          >
            Enviar análise →
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// TELA — RESULTADO
// ============================================================

function renderSuccess(index) {
  const label = state.answers.classificationLabel || "";
  const rationale = state.answers.rationale || "";
  const firstName = escapeHtml(String(state.answers.nome || "").trim().split(/\s+/)[0]);

  let cardClass = "neutral";
  let labelColor = "#94a3b8";

  if (state.answers.classification === "provavel_analise") {
    cardClass = "success";
    labelColor = "#10b981";
  } else if (state.answers.classification === "planejamento") {
    cardClass = "warning";
    labelColor = "#f59e0b";
  } else if (state.answers.classification === "precisa_avaliacao") {
    cardClass = "warning";
    labelColor = "#f59e0b";
  }

  const resultMessage = `${firstName}, fizemos uma primeira leitura da sua situação. ${label}. ${rationale}`;

  return `
    <div class="slide" data-slide="${index}" role="region" aria-label="Resultado">
      <div class="module-card">

        <div class="success-icon" aria-hidden="true">✓</div>

        <div class="module-number" style="margin:0 auto 1rem;display:flex;width:fit-content;">
          🎉 Concluído
        </div>

        ${renderJarvisIndicator(resultMessage)}

        <h2 class="module-title" style="text-align:center;">
          Obrigado, ${firstName || "cliente"}!
        </h2>

        <p class="module-subtitle" style="text-align:center;">
          Fizemos uma primeira leitura da sua situação.
        </p>

        <div class="result-card ${cardClass}" role="status">
          <div style="font-size:.75rem;color:#94a3b8;text-transform:uppercase;font-weight:600;margin-bottom:.5rem;">
            Resultado inicial
          </div>
          <div style="font-size:1.3rem;font-weight:800;color:${labelColor};margin-bottom:.8rem;">
            ${escapeHtml(label)}
          </div>
          <div style="font-size:.95rem;color:#e2e8f0;line-height:1.6;">
            ${escapeHtml(rationale)}
          </div>
        </div>

        <div class="info-box">
          <strong style="color:#fff;">Importante:</strong><br>
          Esta é uma triagem inicial. Ela não confirma benefício, valor ou direito.
          A confirmação depende da análise dos documentos e das regras aplicáveis ao seu caso.
          <br><br>
          📱 Você receberá um comprovante de atendimento no seu WhatsApp.
        </div>

        <div style="display:flex;flex-direction:column;gap:.8rem;margin-top:1.5rem;">
          <a href="#" id="btn-whatsapp" class="nav-btn nav-btn-whatsapp" aria-label="Enviar resumo no WhatsApp">
            📱 Enviar resumo no WhatsApp
          </a>
          <button onclick="restart()" class="nav-btn nav-btn-ghost" style="width:100%;justify-content:center;">
            Fazer nova análise
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================
// NAVEGAÇÃO
// ============================================================

function goToSlide(index) {
  if (index < 0 || index >= state.slides.length) return;

  stopSpeaking();

  state.currentSlide = index;

  const track = document.getElementById("slideTrack");
  if (!track) return;

  // Cálculo correto baseado em índice fixo (não porcentagem do total)
  track.style.transform = `translateX(-${index * 100}%)`;

  // Atualizar dots
  document.querySelectorAll(".slide-dot").forEach((dot, i) => {
    dot.classList.remove("active", "done");
    if (i === index) dot.classList.add("active");
    else if (i < index) dot.classList.add("done");
  });

  // Atualizar barra de progresso
  const progress = document.getElementById("progressBar");
  if (progress) {
    const percent = (index / Math.max(state.slides.length - 1, 1)) * 100;
    progress.style.width = `${percent}%`;
  }

  // Focus no primeiro input após transição
  setTimeout(() => {
    const firstInput = document.querySelector(
      `[data-slide="${index}"] input, [data-slide="${index}"] textarea`
    );
    if (firstInput) firstInput.focus();
  }, 500);

  // Falar a pergunta da tela atual
  setTimeout(() => {
    speakCurrentSlide(index);
  }, 700);
}

function speakCurrentSlide(index) {
  const slide = state.slides[index];
  if (!slide) return;

  const name = getAssistantName();

  switch (slide.type) {
    case "welcome":
      speak(`${getGreeting()}! Sou o ${name}. Em que posso te ajudar hoje?`);
      break;
    case "sector":
      speak("Me conta: onde podemos ajudar você? Escolha o assunto abaixo.");
      break;
    case "identity":
      speak("Pra eu poder te ajudar melhor, me diz seu nome e um WhatsApp?");
      break;
    case "router":
      speak("Entendi. Me conta melhor: o que está acontecendo? Escolha a opção abaixo.");
      break;
    case "question":
      const q = slide.question;
      const qText = q.unit ? `${q.label} Responda em ${q.unit}.` : q.label;
      speak(qText);
      break;
    case "final":
      speak("Quer contar mais alguma coisa? Essa parte é opcional.");
      break;
    case "consent":
      const fn = String(state.answers.nome || "").trim().split(/\s+/)[0];
      speak(`${fn}, suas respostas serão enviadas ao escritório responsável. O Sr. Cleiton entrará em contato com você. Posso enviar?`);
      break;
    case "success":
      const label = state.answers.classificationLabel || "";
      speak(`Obrigado! ${label}. Você receberá um comprovante no seu WhatsApp.`);
      break;
  }
}

function nextSlide() {
  const slide = state.slides[state.currentSlide];
  if (!slide) return;

  goToSlide(state.currentSlide + 1);
}

function prevSlide() {
  goToSlide(state.currentSlide - 1);
}

// ============================================================
// SETOR
// ============================================================

function selectSector(value, button) {
  state.answers.sector = value;
  state.answers.benefitKey = "";

  // Atualizar voz baseada no setor
  state.currentVoice = VOICES[value] || "pt-BR-AntonioNeural";

  document.querySelectorAll(`[data-slide="${state.currentSlide}"] .option-btn`).forEach(btn => {
    btn.classList.remove("selected");
    btn.setAttribute("aria-checked", "false");
  });

  button.classList.add("selected");
  button.setAttribute("aria-checked", "true");

  const next = document.getElementById("btn-sector-next");
  if (next) next.disabled = false;

  // Feedback de voz
  const sector = state.sectors.find(s => s.key === value);
  if (sector) {
    speak(`${sector.label}. Ótimo, vamos continuar.`);
  }
}

function confirmSector() {
  if (!state.answers.sector) return;

  state.answers.benefitKey = "";
  state.answers.questionAnswers = {};

  renderAllSlides();
  renderDots();
  goToSlide(2); // Vai para identidade
}

// ============================================================
// IDENTIDADE
// ============================================================

function confirmIdentity() {
  const nome = document.getElementById("field-nome")?.value.trim() || "";
  const tel = document.getElementById("field-telefone")?.value.trim() || "";
  const err = document.getElementById("erro-identity");

  if (!nome || nome.length < 3) {
    err.textContent = "Digite seu nome.";
    err.classList.add("show");
    speak("Preciso do seu nome pra poder te ajudar. Digite seu nome.");
    return;
  }

  if (tel.replace(/\D/g, "").length < 10) {
    err.textContent = "Digite um WhatsApp válido com DDD.";
    err.classList.add("show");
    speak("Preciso do seu WhatsApp com DDD. Digite um número válido.");
    return;
  }

  err.classList.remove("show");
  state.answers.nome = nome;
  state.answers.telefone = tel;

  const firstName = nome.split(/\s+/)[0];
  speak(`Perfeito, ${firstName}! Agora me conta o que está acontecendo.`);

  setTimeout(() => {
    renderAllSlides();
    renderDots();
    goToSlide(3); // Vai para router
  }, 2000);
}

// ============================================================
// ASSUNTO
// ============================================================

function selectRouter(value, button) {
  state.answers.benefitKey = value;

  document.querySelectorAll(`[data-slide="${state.currentSlide}"] .option-btn`).forEach(btn => {
    btn.classList.remove("selected");
    btn.setAttribute("aria-checked", "false");
  });

  button.classList.add("selected");
  button.setAttribute("aria-checked", "true");

  const next = document.getElementById("btn-router-next");
  if (next) next.disabled = false;
}

function confirmRouter() {
  if (!state.answers.benefitKey) return;

  const benefit = state.benefits.find(b => b.key === state.answers.benefitKey);
  if (!benefit) return;

  state.answers.benefitLabel = benefit.label;
  state.answers.questionAnswers = {};

  speak(`${benefit.label}. Vou te fazer algumas perguntas rápidas. Toque na resposta.`);

  // Inserir slides de perguntas dinamicamente
  const questionSlides = benefit.questions.map((question, index) => ({
    type: "question",
    question,
    questionIndex: index,
    totalQuestions: benefit.questions.length
  }));

  // Remover perguntas antigas e inserir novas ANTES do final/consent/success
  state.slides = state.slides.filter(s => s.type !== "question");

  // Encontrar posição do "final" e inserir antes dele
  const finalIndex = state.slides.findIndex(s => s.type === "final");
  state.slides.splice(finalIndex, 0, ...questionSlides);

  renderAllSlides();
  renderDots();
  goToSlide(4); // Primeira pergunta
}

// ============================================================
// RESPOSTA DE ESCOLHA
// ============================================================

function selectChoice(questionId, value, button) {
  state.answers.questionAnswers[questionId] = value;

  document.querySelectorAll(`[data-slide="${state.currentSlide}"] .option-btn`).forEach(btn => {
    btn.classList.remove("selected");
    btn.setAttribute("aria-checked", "false");
  });

  button.classList.add("selected");
  button.setAttribute("aria-checked", "true");

  speak("Entendi. Vamos continuar.");
}

// ============================================================
// CONFIRMAR PERGUNTA
// ============================================================

function confirmQuestion(questionId) {
  const slide = state.slides[state.currentSlide];
  const question = slide.question;
  const error = document.getElementById(`erro-q-${questionId}`);

  if (question.type === "choice") {
    if (!state.answers.questionAnswers[questionId]) {
      error.textContent = "Escolha uma opção.";
      error.classList.add("show");
      speak("Escolha uma das opções abaixo pra continuar.");
      return;
    }
  } else {
    const field = document.getElementById(`field-${questionId}`);
    const value = field?.value.trim() || "";

    if (question.required && !value) {
      error.textContent = "Essa informação é importante. Responda para continuar.";
      error.classList.add("show");
      speak("Essa informação é importante. Preencha pra continuar.");
      return;
    }

    state.answers.questionAnswers[questionId] = value;
  }

  error.classList.remove("show");
  goToSlide(state.currentSlide + 1);
}

// ============================================================
// IR PARA CONSENTIMENTO
// ============================================================

function goToConsent() {
  const field = document.getElementById("field-observacao");
  state.answers.observacao = field?.value.trim() || "";

  renderAllSlides();
  renderDots();

  const consentIndex = state.slides.findIndex(s => s.type === "consent");
  goToSlide(consentIndex);
}

function toggleConsent(checked) {
  state.answers.consentGiven = checked;
  const btn = document.getElementById("btn-consent-submit");
  if (btn) btn.disabled = !checked;
}

// ============================================================
// ENVIO FINAL
// ============================================================

async function submitFinal() {
  if (!state.answers.consentGiven) return;

  const currentCard = document.querySelector(`[data-slide="${state.currentSlide}"] .module-card`);

  if (currentCard) {
    currentCard.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;">
        <div class="spinner"></div>
        <p style="color:#cbd5e1;margin-top:1.5rem;font-size:1.1rem;">
          Analisando suas respostas...
        </p>
      </div>
    `;
  }

  speak("Analisando suas respostas. Só um momento.");

  try {
    const response = await fetch("/api/triagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.answers.nome,
        phone: state.answers.telefone,
        benefit_type: state.answers.benefitKey,
        answers: state.answers.questionAnswers
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Erro ao enviar análise.");

    state.answers.classification = data.classification;
    state.answers.classificationLabel = data.classification_label;
    state.answers.rationale = data.rationale;

    renderAllSlides();
    renderDots();
    goToSlide(state.slides.length - 1);

    setTimeout(() => {
      const button = document.getElementById("btn-whatsapp");
      if (button && data.whatsapp_link) {
        button.href = data.whatsapp_link;
      }
    }, 100);

  } catch (error) {
    console.error("Erro ao enviar triagem:", error);

    if (currentCard) {
      currentCard.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <p style="color:#f87171;font-size:1.1rem;margin-bottom:1.5rem;">
            Não conseguimos enviar sua análise.
          </p>
          <button onclick="location.reload()" class="nav-btn nav-btn-primary">
            Tentar novamente
          </button>
        </div>
      `;
    }

    speak("Não conseguimos enviar. Tente novamente.");
  }
}

// ============================================================
// REINICIAR
// ============================================================

function restart() {
  stopSpeaking();

  state.answers = {
    nome: "",
    telefone: "",
    sector: "",
    benefitKey: "",
    benefitLabel: "",
    questionAnswers: {},
    observacao: "",
    consentGiven: false
  };

  state.currentVoice = "pt-BR-AntonioNeural";
  buildSlides();
}

// ============================================================
// DOTS
// ============================================================

function renderDots() {
  const dots = document.getElementById("slideDots");
  if (!dots) return;

  dots.innerHTML = state.slides
    .map((_, index) => `
      <button class="slide-dot" onclick="goToSlide(${index})" aria-label="Ir para etapa ${index + 1}"></button>
    `).join("");
}

// ============================================================
// NOTÍCIAS ROTATIVAS
// ============================================================

const NEWS_ITEMS = [
  {
    category: "INSS",
    title: "Notícias e orientações atualizadas sobre Previdência",
    summary: "Consulte matérias, avisos e informações publicadas pelo INSS.",
    url: "https://www.gov.br/inss/pt-br/assuntos/ultimas-noticias"
  },
  {
    category: "TRABALHO",
    title: "Informações do Ministério do Trabalho e Emprego",
    summary: "Acesse serviços, orientações e conteúdos oficiais sobre trabalho.",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br"
  },
  {
    category: "SERVIÇOS",
    title: "Meu INSS: serviços digitais para o cidadão",
    summary: "Consulte benefícios e requerimentos no portal oficial.",
    url: "https://www.gov.br/pt-br/temas/meu-inss"
  },
  {
    category: "QUALIFICAÇÃO",
    title: "Cursos gratuitos para aprender e se organizar",
    summary: "Conheça cursos do Sebrae e da Escola Virtual do Governo.",
    url: "https://www.escolavirtual.gov.br/"
  }
];

let newsIndex = 0;
let newsTimer = null;

function renderNewsItem() {
  const item = NEWS_ITEMS[newsIndex];
  const category = document.getElementById("news-card-category");
  const counter = document.getElementById("news-card-counter");
  const title = document.getElementById("news-card-title");
  const summary = document.getElementById("news-card-summary");
  const link = document.getElementById("news-card-link");
  const progress = document.getElementById("news-card-progress-bar");

  if (!item || !category || !counter || !title || !summary || !link) return;

  category.textContent = item.category;
  counter.textContent = `${String(newsIndex + 1).padStart(2, "0")} / ${String(NEWS_ITEMS.length).padStart(2, "0")}`;
  title.textContent = item.title;
  summary.textContent = item.summary;
  link.href = item.url;

  if (progress) {
    progress.classList.remove("is-running");
    void progress.offsetWidth;
    progress.classList.add("is-running");
  }
}

function initNewsRotation() {
  renderNewsItem();
  if (NEWS_ITEMS.length < 2) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  newsTimer = window.setInterval(() => {
    newsIndex = (newsIndex + 1) % NEWS_ITEMS.length;
    renderNewsItem();
  }, 4000);
}

// ============================================================
// LOGIN ADMIN
// ============================================================

function initGoogleAuth() {
  if (typeof google === "undefined") return;

  google.accounts.id.initialize({
    client_id: "SEU_CLIENT_ID_GOOGLE.apps.googleusercontent.com",
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });
}

async function handleGoogleCredentialResponse(response) {
  try {
    const result = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "google", credential: response.credential })
    });

    if (!result.ok) throw new Error("Credenciais inválidas.");

    const data = await result.json();
    abrirPainelAdmin(data.role, data.token);
    fecharLoginModal();
  } catch (error) {
    alert("Erro ao autenticar com Google: " + error.message);
  }
}

async function autenticarUsuario() {
  const username = document.getElementById("user-login")?.value.trim() || "";
  const password = document.getElementById("pass-login")?.value.trim() || "";

  if (!username || !password) {
    alert("Preencha usuário e senha.");
    return;
  }

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "password", username, password })
    });

    if (!response.ok) throw new Error("Usuário ou senha incorretos.");

    const data = await response.json();
    abrirPainelAdmin(data.role, data.token);
    fecharLoginModal();
  } catch (error) {
    alert(error.message);
  }
}

function abrirPainelAdmin(role, token) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_role", role);
  alert(`Bem-vindo, ${role}!`);
}

function abrirLoginModal() {
  const modal = document.getElementById("modal-login");
  if (modal) modal.classList.remove("hidden");

  if (typeof google !== "undefined") {
    const container = document.getElementById("g_id_signin");
    if (container && google.accounts?.id) {
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: "100%"
      });
    }
  }
}

function fecharLoginModal() {
  const modal = document.getElementById("modal-login");
  if (modal) modal.classList.add("hidden");
}

// ============================================================
// INTERCEPTOR ADMIN
// ============================================================

const originalFetch = window.fetch.bind(window);

window.fetch = async function (...args) {
  const url = String(args[0]);
  const options = args[1] || {};
  const token = localStorage.getItem("admin_token");

  if (url.includes("/api/admin/") && token) {
    options.headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };
  }

  return originalFetch(args[0], options);
};

// ============================================================
// TELEFONE — MÁSCARA
// ============================================================

function mascaraTelefone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  initGoogleAuth();
  initNewsRotation();

  // Máscara de telefone
  document.addEventListener("input", event => {
    if (event.target.id === "field-telefone") {
      const position = event.target.selectionStart;
      const before = event.target.value.length;

      event.target.value = mascaraTelefone(event.target.value);

      const after = event.target.value.length;
      const newPosition = Math.max(0, position + (after - before));
      event.target.setSelectionRange(newPosition, newPosition);
    }
  });

  // Navegação por teclado
  document.addEventListener("keydown", event => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;

    if (event.key === "ArrowRight") nextSlide();
    if (event.key === "ArrowLeft") prevSlide();
  });

  // Carregar vozes do navegador (fallback)
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
});
