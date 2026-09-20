// ============================================================
// app.js — PrevControl com Jarvis & Katerina
// Interface pública de triagem com voz
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
  isSpeaking: false,
  speechQueue: []
};

// ============================================================
// VOZES POR SETOR
// ============================================================

const VOICES = {
  previdencia: "pt-BR-AntonioNeural",
  trabalhista: "pt-BR-FranciscaNeural",
  empresarial: "pt-BR-AntonioNeural"
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
// TTS — SÍNTESE DE VOZ
// ============================================================

async function speak(text) {
  if (!text) return;

  if (state.isSpeaking) {
    state.speechQueue.push(text);
    return;
  }

  state.isSpeaking = true;
  updateJarvisIndicator(true, text);

  try {
    // Tentar Edge TTS via API (melhor qualidade)
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 500), voice: getVoice() })
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
      await speakFallback(text);
    }
  } catch (error) {
    console.warn("TTS API falhou, usando fallback:", error);
    await speakFallback(text);
  }

  state.isSpeaking = false;
  updateJarvisIndicator(false, "");

  if (state.speechQueue.length > 0) {
    const next = state.speechQueue.shift();
    speak(next);
  }
}

function speakFallback(text) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) { resolve(); return; }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.92;
    utterance.pitch = isFemaleVoice() ? 1.05 : 0.95;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith("pt-BR") && v.name.includes("Female"))
      || voices.find(v => v.lang.startsWith("pt-BR"))
      || voices.find(v => v.lang.startsWith("pt"));

    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = resolve;
    utterance.onerror = resolve;

    // Timeout de segurança
    setTimeout(resolve, Math.max(text.length * 80, 5000));

    window.speechSynthesis.speak(utterance);
  });
}

function stopSpeaking() {
  state.speechQueue = [];
  state.isSpeaking = false;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  updateJarvisIndicator(false, "");
}

// ============================================================
// INDICADOR VISUAL
// ============================================================

function updateJarvisIndicator(speaking, text) {
  const indicator = document.querySelector(".jarvis-indicator");
  if (!indicator) return;

  if (speaking) {
    indicator.classList.add("jarvis-speaking");
    const textEl = indicator.querySelector(".jarvis-text");
    if (textEl && text) {
      textEl.innerHTML = `<strong>${escapeHtml(getAssistantName())}:</strong> ${escapeHtml(text)}`;
    }
  } else {
    indicator.classList.remove("jarvis-speaking");
  }
}

function renderJarvisIndicator(message) {
  const female = isFemaleVoice();
  const name = getAssistantName();
  const avatarClass = female ? "jarvis-avatar female" : "jarvis-avatar";
  const emoji = female ? "👩" : "👨";

  return `
    <div class="jarvis-indicator">
      <div class="${avatarClass}">${emoji}</div>
      <div class="jarvis-text">
        <strong>${escapeHtml(name)}:</strong> ${escapeHtml(message)}
      </div>
    </div>
  `;
}

// ============================================================
// SEGURANÇA
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
    const [sectorsRes, benefitsRes] = await Promise.all([
      fetch("/api/sectors"),
      fetch("/api/benefits")
    ]);

    if (!sectorsRes.ok || !benefitsRes.ok) throw new Error("API indisponível");

    const sectorsData = await sectorsRes.json();
    const benefitsData = await benefitsRes.json();

    state.sectors = sectorsData.sectors || [];
    state.benefits = benefitsData.benefits || [];
  } catch (error) {
    console.error("Erro ao carregar configuração:", error);
    state.sectors = [];
    state.benefits = [];
  }

  buildSlides();
}

// ============================================================
// SAUDAÇÃO
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

  setTimeout(() => {
    speak(`${getGreeting()}! Sou o Jarvis. Em que posso te ajudar hoje?`);
  }, 800);
}

function renderAllSlides() {
  const track = document.getElementById("slideTrack");
  if (!track) return;
  track.innerHTML = state.slides.map((slide, i) => renderSlide(slide, i)).join("");
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
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">PrevControl</div>
        ${renderJarvisIndicator(`${greeting}! Sou o Jarvis. Em que posso te ajudar hoje?`)}
        <h2 class="module-title">${greeting}!</h2>
        <p class="module-subtitle">
          Vou te ajudar a entender sua situação. Não precisa se preocupar com termos difíceis — eu explico tudo. Vamos juntos?
        </p>
        <p class="module-subtitle" style="font-size:.85rem;color:var(--text-muted);">
          Escolha abaixo o assunto que mais combina com o que está acontecendo.
        </p>
        <div class="nav-row" style="justify-content:flex-end;">
          <button onclick="nextSlide()" class="nav-btn nav-btn-primary">Começar →</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// TELA 1 — SETOR
// ============================================================

function renderSector(index) {
  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">📍 Primeiro passo</div>
        ${renderJarvisIndicator("Me conta: onde podemos ajudar você? Escolha o assunto abaixo.")}
        <h2 class="module-title">Onde podemos ajudar você?</h2>
        <p class="module-subtitle">Toque na opção que mais combina com sua situação.</p>
        <div class="options-stack">
          ${state.sectors.map((sector, idx) => `
            <button onclick="selectSector('${escapeHtml(sector.key)}', this)"
              class="option-btn ${state.answers.sector === sector.key ? 'selected' : ''}"
              data-value="${escapeHtml(sector.key)}">
              <span class="option-marker">${escapeHtml(sector.icon || idx + 1)}</span>
              <span style="display:flex;flex-direction:column;text-align:left;">
                <strong>${escapeHtml(sector.label)}</strong>
                <small style="opacity:.75;margin-top:3px;">${escapeHtml(sector.description)}</small>
              </span>
            </button>`).join("")}
        </div>
        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmSector()" class="nav-btn nav-btn-primary" id="btn-sector-next" disabled>Continuar →</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// TELA 2 — IDENTIDADE
// ============================================================

function renderIdentity(index) {
  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">👤 Identificação</div>
        ${renderJarvisIndicator("Pra eu poder te ajudar melhor, me diz seu nome e um WhatsApp?")}
        <h2 class="module-title">Como posso te chamar?</h2>
        <p class="module-subtitle">Preciso do seu nome e WhatsApp pra poder te atender e enviar o resultado.</p>
        <div class="field-group">
          <label class="field-label" for="field-nome">Seu nome</label>
          <input id="field-nome" class="input-base" placeholder="Como podemos te chamar?"
            value="${escapeHtml(state.answers.nome)}" maxlength="60">
        </div>
        <div class="field-group">
          <label class="field-label" for="field-telefone">WhatsApp com DDD</label>
          <input id="field-telefone" class="input-base" placeholder="(17) 99999-9999"
            value="${escapeHtml(state.answers.telefone)}" maxlength="15">
          <div class="field-error" id="erro-identity"></div>
        </div>
        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmIdentity()" class="nav-btn nav-btn-primary">Continuar →</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// TELA 3 — ASSUNTO
// ============================================================

function renderRouter(index) {
  const options = state.benefits.filter(b => b.sector === state.answers.sector);
  const sector = state.sectors.find(s => s.key === state.answers.sector);

  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">${escapeHtml(sector?.icon || "📋")} ${escapeHtml(sector?.label || "Assunto")}</div>
        ${renderJarvisIndicator("Entendi. Me conta melhor: o que está acontecendo? Escolha a opção abaixo.")}
        <h2 class="module-title">O que está acontecendo?</h2>
        <p class="module-subtitle">Toque na opção que mais se parece com sua situação.</p>
        <div class="options-stack">
          ${options.map((option, idx) => `
            <button onclick="selectRouter('${escapeHtml(option.key)}', this)"
              class="option-btn ${state.answers.benefitKey === option.key ? 'selected' : ''}"
              data-value="${escapeHtml(option.key)}">
              <span class="option-marker">${idx + 1}</span>
              <span style="display:flex;flex-direction:column;text-align:left;">
                <strong>${escapeHtml(option.label)}</strong>
                <small style="opacity:.75;margin-top:3px;">${escapeHtml(option.description || "")}</small>
              </span>
            </button>`).join("")}
        </div>
        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmRouter()" class="nav-btn nav-btn-primary" id="btn-router-next" disabled>Continuar →</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// TELA N — PERGUNTA
// ============================================================

function renderQuestion(slide, index) {
  const q = slide.question;
  const currentVal = state.answers.questionAnswers[q.id] || "";

  let inputHtml = "";
  if (q.type === "choice") {
    inputHtml = `
      <div class="options-stack">
        ${q.options.map((option, idx) => `
          <button onclick="selectChoice('${escapeHtml(q.id)}', '${escapeHtml(option)}', this)"
            class="option-btn ${currentVal === option ? 'selected' : ''}">
            <span class="option-marker">${String.fromCharCode(65 + idx)}</span>
            <span>${escapeHtml(option)}</span>
          </button>`).join("")}
      </div>`;
  } else if (q.type === "number") {
    inputHtml = `<input id="field-${escapeHtml(q.id)}" class="input-base" type="number" min="0"
      placeholder="${q.unit === 'anos' ? 'Ex.: 25' : 'Ex.: 12'}" value="${escapeHtml(currentVal)}">`;
  } else {
    inputHtml = `<input id="field-${escapeHtml(q.id)}" class="input-base" type="text"
      placeholder="${escapeHtml(q.placeholder || 'Sua resposta')}" value="${escapeHtml(currentVal)}">`;
  }

  const questionText = q.unit ? `${q.label} Responda em ${q.unit}.` : q.label;

  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">📝 Pergunta ${slide.questionIndex + 1} de ${slide.totalQuestions}</div>
        ${renderJarvisIndicator(questionText)}
        <h2 class="module-title">${escapeHtml(q.label)}</h2>
        ${q.unit ? `<p class="module-subtitle">Responda em ${escapeHtml(q.unit)}.</p>` : ""}
        ${inputHtml}
        <div class="field-error" id="erro-q-${escapeHtml(q.id)}"></div>
        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="confirmQuestion('${escapeHtml(q.id)}')" class="nav-btn nav-btn-primary">
            ${slide.questionIndex + 1 < slide.totalQuestions ? "Próxima →" : "Continuar →"}
          </button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// TELA — OBSERVAÇÕES
// ============================================================

function renderFinal(index) {
  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">✨ Última etapa</div>
        ${renderJarvisIndicator("Quer contar mais alguma coisa? Essa parte é opcional.")}
        <h2 class="module-title">Quer contar mais alguma coisa?</h2>
        <p class="module-subtitle">Se quiser, conte algo importante que não apareceu nas perguntas. Essa parte é opcional.</p>
        <textarea id="field-observacao" class="input-base" style="min-height:120px;resize:vertical;"
          placeholder="Escreva aqui, se quiser...">${escapeHtml(state.answers.observacao)}</textarea>
        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="goToConsent()" class="nav-btn nav-btn-primary">Continuar →</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// TELA — CONSENTIMENTO
// ============================================================

function renderConsent(index) {
  const firstName = escapeHtml(String(state.answers.nome || "").trim().split(/\s+/)[0]);
  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="module-number">📋 Consentimento</div>
        ${renderJarvisIndicator(`${firstName}, suas respostas serão enviadas ao escritório responsável. O Sr. Cleiton entrará em contato com você. Posso enviar?`)}
        <h2 class="module-title">Posso enviar sua análise?</h2>
        <p class="module-subtitle">
          Suas respostas serão encaminhadas ao escritório responsável. O Sr. Cleiton analisará suas informações e entrará em contato pelo WhatsApp que você informou.
        </p>
        <div class="consent-box">
          <label>
            <input type="checkbox" id="consent-check" onchange="toggleConsent(this.checked)">
            <span>Eu autorizo o envio das minhas respostas ao escritório responsável e concordo que o Sr. Cleiton entre em contato comigo pelo WhatsApp informado.</span>
          </label>
        </div>
        <div class="nav-row">
          <button onclick="prevSlide()" class="nav-btn nav-btn-ghost">← Voltar</button>
          <button onclick="submitFinal()" class="nav-btn nav-btn-primary" id="btn-consent-submit" disabled>Enviar análise →</button>
        </div>
      </div>
    </div>`;
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
  if (state.answers.classification === "provavel_analise") { cardClass = "success"; labelColor = "#10b981"; }
  else if (state.answers.classification === "planejamento" || state.answers.classification === "precisa_avaliacao") { cardClass = "warning"; labelColor = "#f59e0b"; }

  return `
    <div class="slide" data-slide="${index}">
      <div class="module-card">
        <div class="success-icon">✓</div>
        <div class="module-number" style="margin:0 auto 1rem;display:flex;width:fit-content;">🎉 Concluído</div>
        ${renderJarvisIndicator(`${firstName}, fizemos uma primeira leitura da sua situação. ${label}.`)}
        <h2 class="module-title" style="text-align:center;">Obrigado, ${firstName || "cliente"}!</h2>
        <p class="module-subtitle" style="text-align:center;">Fizemos uma primeira leitura da sua situação.</p>
        <div class="result-card ${cardClass}">
          <div style="font-size:.75rem;color:#94a3b8;text-transform:uppercase;font-weight:600;margin-bottom:.5rem;">Resultado inicial</div>
          <div style="font-size:1.3rem;font-weight:800;color:${labelColor};margin-bottom:.8rem;">${escapeHtml(label)}</div>
          <div style="font-size:.95rem;color:#e2e8f0;line-height:1.6;">${escapeHtml(rationale)}</div>
        </div>
        <div class="info-box">
          <strong style="color:#fff;">Importante:</strong><br>
          Esta é uma triagem inicial. Ela não confirma benefício, valor ou direito. A confirmação depende da análise dos documentos e das regras aplicáveis ao seu caso.
          <br><br>📱 Você receberá um comprovante de atendimento no seu WhatsApp.
        </div>
        <div style="display:flex;flex-direction:column;gap:.8rem;margin-top:1.5rem;">
          <a href="#" id="btn-whatsapp" class="nav-btn nav-btn-whatsapp">📱 Enviar resumo no WhatsApp</a>
          <button onclick="restart()" class="nav-btn nav-btn-ghost" style="width:100%;justify-content:center;">Fazer nova análise</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// NAVEGAÇÃO
// ============================================================

function goToSlide(index) {
  if (index < 0 || index >= state.slides.length) return;
  stopSpeaking();
  state.currentSlide = index;

  const track = document.getElementById("slideTrack");
  if (track) track.style.transform = `translateX(-${index * 100}%)`;

  document.querySelectorAll(".slide-dot").forEach((dot, i) => {
    dot.classList.remove("active", "done");
    if (i === index) dot.classList.add("active");
    else if (i < index) dot.classList.add("done");
  });

  const progress = document.getElementById("progressBar");
  if (progress) progress.style.width = `${(index / Math.max(state.slides.length - 1, 1)) * 100}%`;

  setTimeout(() => {
    const firstInput = document.querySelector(`[data-slide="${index}"] input, [data-slide="${index}"] textarea`);
    if (firstInput) firstInput.focus();
  }, 500);

  setTimeout(() => speakCurrentSlide(index), 800);
}

function speakCurrentSlide(index) {
  const slide = state.slides[index];
  if (!slide) return;

  switch (slide.type) {
    case "welcome":
      speak(`${getGreeting()}! Sou o Jarvis. Em que posso te ajudar hoje?`);
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
      speak(q.unit ? `${q.label} Responda em ${q.unit}.` : q.label);
      break;
    case "final":
      speak("Quer contar mais alguma coisa? Essa parte é opcional.");
      break;
    case "consent":
      const fn = String(state.answers.nome || "").trim().split(/\s+/)[0];
      speak(`${fn}, suas respostas serão enviadas ao escritório responsável. O Sr. Cleiton entrará em contato com você. Posso enviar?`);
      break;
    case "success":
      speak(`Obrigado! ${state.answers.classificationLabel || ""}. Você receberá um comprovante no seu WhatsApp.`);
      break;
  }
}

function nextSlide() { goToSlide(state.currentSlide + 1); }
function prevSlide() { goToSlide(state.currentSlide - 1); }

// ============================================================
// SETOR
// ============================================================

function selectSector(value, button) {
  state.answers.sector = value;
  state.answers.benefitKey = "";
  state.answers.questionAnswers = {};

  document.querySelectorAll(`[data-slide="${state.currentSlide}"] .option-btn`).forEach(btn => {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");

  const next = document.getElementById("btn-sector-next");
  if (next) next.disabled = false;

  const sector = state.sectors.find(s => s.key === value);
  if (sector) speak(`${sector.label}. Ótimo, vamos continuar.`);
}

function confirmSector() {
  if (!state.answers.sector) return;
  state.answers.benefitKey = "";
  state.answers.questionAnswers = {};
  renderAllSlides();
  renderDots();
  goToSlide(2);
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
    speak("Preciso do seu nome pra poder te ajudar.");
    return;
  }

  if (tel.replace(/\D/g, "").length < 10) {
    err.textContent = "Digite um WhatsApp válido com DDD.";
    err.classList.add("show");
    speak("Preciso do seu WhatsApp com DDD.");
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
    goToSlide(3);
  }, 2500);
}

// ============================================================
// ASSUNTO
// ============================================================

function selectRouter(value, button) {
  state.answers.benefitKey = value;
  document.querySelectorAll(`[data-slide="${state.currentSlide}"] .option-btn`).forEach(btn => {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");
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

  const questionSlides = benefit.questions.map((question, index) => ({
    type: "question", question, questionIndex: index, totalQuestions: benefit.questions.length
  }));

  state.slides = state.slides.filter(s => s.type !== "question");
  const finalIndex = state.slides.findIndex(s => s.type === "final");
  state.slides.splice(finalIndex, 0, ...questionSlides);

  renderAllSlides();
  renderDots();
  goToSlide(4);
}

// ============================================================
// PERGUNTAS
// ============================================================

function selectChoice(questionId, value, button) {
  state.answers.questionAnswers[questionId] = value;
  document.querySelectorAll(`[data-slide="${state.currentSlide}"] .option-btn`).forEach(btn => {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");
  speak("Entendi. Vamos continuar.");
}

function confirmQuestion(questionId) {
  const slide = state.slides[state.currentSlide];
  const question = slide.question;
  const error = document.getElementById(`erro-q-${questionId}`);

  if (question.type === "choice") {
    if (!state.answers.questionAnswers[questionId]) {
      error.textContent = "Escolha uma opção.";
      error.classList.add("show");
      speak("Escolha uma das opções abaixo.");
      return;
    }
  } else {
    const field = document.getElementById(`field-${questionId}`);
    const value = field?.value.trim() || "";
    if (question.required && !value) {
      error.textContent = "Essa informação é importante.";
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
// CONSENTIMENTO + ENVIO
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

async function submitFinal() {
  if (!state.answers.consentGiven) return;

  const currentCard = document.querySelector(`[data-slide="${state.currentSlide}"] .module-card`);
  if (currentCard) {
    currentCard.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;">
        <div class="spinner"></div>
        <p style="color:#cbd5e1;margin-top:1.5rem;font-size:1.1rem;">Analisando suas respostas...</p>
      </div>`;
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
    if (!response.ok) throw new Error(data.error || "Erro ao enviar.");

    state.answers.classification = data.classification;
    state.answers.classificationLabel = data.classification_label;
    state.answers.rationale = data.rationale;

    renderAllSlides();
    renderDots();
    goToSlide(state.slides.length - 1);

    setTimeout(() => {
      const button = document.getElementById("btn-whatsapp");
      if (button && data.whatsapp_link) button.href = data.whatsapp_link;
    }, 100);

  } catch (error) {
    console.error("Erro:", error);
    if (currentCard) {
      currentCard.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <p style="color:#f87171;font-size:1.1rem;margin-bottom:1.5rem;">Não conseguimos enviar sua análise.</p>
          <button onclick="location.reload()" class="nav-btn nav-btn-primary">Tentar novamente</button>
        </div>`;
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
    nome: "", telefone: "", sector: "", benefitKey: "", benefitLabel: "",
    questionAnswers: {}, observacao: "", consentGiven: false
  };
  buildSlides();
}

// ============================================================
// DOTS
// ============================================================

function renderDots() {
  const dots = document.getElementById("slideDots");
  if (!dots) return;
  dots.innerHTML = state.slides.map((_, i) =>
    `<button class="slide-dot" onclick="goToSlide(${i})"></button>`
  ).join("");
}

// ============================================================
// NOTÍCIAS ROTATIVAS
// ============================================================

const NEWS_ITEMS = [
  { category: "INSS", title: "Notícias e orientações atualizadas sobre Previdência", summary: "Consulte matérias, avisos e informações publicadas pelo INSS.", url: "https://www.gov.br/inss/pt-br/assuntos/noticias" },
  { category: "TRABALHO", title: "Informações do Ministério do Trabalho e Emprego", summary: "Acesse serviços, orientações e conteúdos oficiais sobre trabalho.", url: "https://www.gov.br/trabalho-e-emprego/pt-br" },
  { category: "SERVIÇOS", title: "Meu INSS: serviços digitais para o cidadão", summary: "Consulte benefícios e requerimentos no portal oficial.", url: "https://meu.inss.gov.br/" },
  { category: "QUALIFICAÇÃO", title: "Cursos gratuitos para aprender e se organizar", summary: "Conheça cursos do Sebrae e da Escola Virtual do Governo.", url: "https://www.escolavirtual.gov.br/" }
];

let newsIndex = 0;

function renderNewsItem() {
  const item = NEWS_ITEMS[newsIndex];
  const els = {
    category: document.getElementById("news-card-category"),
    counter: document.getElementById("news-card-counter"),
    title: document.getElementById("news-card-title"),
    summary: document.getElementById("news-card-summary"),
    link: document.getElementById("news-card-link"),
    progress: document.getElementById("news-card-progress-bar")
  };

  if (!item || !els.category) return;

  els.category.textContent = item.category;
  els.counter.textContent = `${String(newsIndex + 1).padStart(2, "0")} / ${String(NEWS_ITEMS.length).padStart(2, "0")}`;
  els.title.textContent = item.title;
  els.summary.textContent = item.summary;
  els.link.href = item.url;

  if (els.progress) {
    els.progress.classList.remove("is-running");
    void els.progress.offsetWidth;
    els.progress.classList.add("is-running");
  }
}

function initNewsRotation() {
  renderNewsItem();
  if (NEWS_ITEMS.length < 2) return;
  setInterval(() => {
    newsIndex = (newsIndex + 1) % NEWS_ITEMS.length;
    renderNewsItem();
  }, 5000);
}

// ============================================================
// ADMIN
// ============================================================

function initGoogleAuth() {
  if (typeof google === "undefined") return;
  google.accounts.id.initialize({
    client_id: "SEU_CLIENT_ID_GOOGLE.apps.googleusercontent.com",
    callback: handleGoogleCredentialResponse,
    auto_select: false
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
  } catch (error) { alert("Erro: " + error.message); }
}

async function autenticarUsuario() {
  const username = document.getElementById("user-login")?.value.trim() || "";
  const password = document.getElementById("pass-login")?.value.trim() || "";
  if (!username || !password) { alert("Preencha usuário e senha."); return; }

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
  } catch (error) { alert(error.message); }
}

function abrirPainelAdmin(role, token) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_role", role);
  alert(`Bem-vindo, ${role}!`);
}

function abrirLoginModal() {
  const modal = document.getElementById("modal-login");
  if (modal) modal.classList.remove("hidden");
  if (typeof google !== "undefined" && google.accounts?.id) {
    const container = document.getElementById("g_id_signin");
    if (container) google.accounts.id.renderButton(container, { theme: "outline", size: "large", width: "100%" });
  }
}

function fecharLoginModal() {
  const modal = document.getElementById("modal-login");
  if (modal) modal.classList.add("hidden");
}

// Interceptor admin
const originalFetch = window.fetch.bind(window);
window.fetch = async function (...args) {
  const url = String(args[0]);
  const options = args[1] || {};
  const token = localStorage.getItem("admin_token");
  if (url.includes("/api/admin/") && token) {
    options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  }
  return originalFetch(args[0], options);
};

// ============================================================
// MÁSCARA TELEFONE
// ============================================================

function mascaraTelefone(value) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  initGoogleAuth();
  initNewsRotation();

  document.addEventListener("input", event => {
    if (event.target.id === "field-telefone") {
      const pos = event.target.selectionStart;
      const before = event.target.value.length;
      event.target.value = mascaraTelefone(event.target.value);
      const after = event.target.value.length;
      event.target.setSelectionRange(Math.max(0, pos + (after - before)), Math.max(0, pos + (after - before)));
    }
  });

  document.addEventListener("keydown", event => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;
    if (event.key === "ArrowRight") nextSlide();
    if (event.key === "ArrowLeft") prevSlide();
  });

  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
});
