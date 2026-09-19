// app.js — PrevControl
// Interface pública de triagem
// Linguagem simples e sem juridiquês.

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
    observacao: ""
  },
  sectors: [],
  benefits: [],
  routerOptions: []
};


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

    const sectorsRes =
      await fetch("/api/sectors");

    if (!sectorsRes.ok) {
      throw new Error(
        `Erro ao carregar setores: ${sectorsRes.status}`
      );
    }

    const sectorsData =
      await sectorsRes.json();

    state.sectors =
      sectorsData.sectors || [];


    const benefitsRes =
      await fetch("/api/benefits");

    if (!benefitsRes.ok) {
      throw new Error(
        `Erro ao carregar assuntos: ${benefitsRes.status}`
      );
    }

    const benefitsData =
      await benefitsRes.json();

    state.benefits =
      benefitsData.benefits || [];

    buildSlides();

  } catch (error) {

    console.error(
      "Erro ao carregar configuração:",
      error
    );

    state.sectors = [];
    state.benefits = [];

    buildSlides();
  }
}


// ============================================================
// ESTRUTURA DAS TELAS
// ============================================================

function buildSlides() {

  state.slides = [
    {
      type: "welcome"
    },

    {
      type: "sector"
    },

    {
      type: "router"
    },

    {
      type: "final"
    },

    {
      type: "success"
    }
  ];

  renderAllSlides();
  renderDots();
  goToSlide(0);
}


// ============================================================
// RENDERIZAÇÃO
// ============================================================

function renderAllSlides() {

  const track =
    document.getElementById("slideTrack");

  if (!track) return;

  track.innerHTML =
    state.slides
      .map((slide, index) =>
        renderSlide(slide, index)
      )
      .join("");
}


function renderSlide(slide, index) {

  if (slide.type === "welcome")
    return renderWelcome(index);

  if (slide.type === "sector")
    return renderSector(index);

  if (slide.type === "router")
    return renderRouter(index);

  if (slide.type === "question")
    return renderQuestion(slide, index);

  if (slide.type === "final")
    return renderFinal(index);

  if (slide.type === "success")
    return renderSuccess(index);

  return "";
}


// ============================================================
// TELA INICIAL
// ============================================================

function renderWelcome(index) {

  return `
    <div
      class="slide"
      data-slide="${index}"
      role="region"
      aria-label="Boas-vindas"
    >

      <div class="module-card">

        <div class="module-number">
          PrevControl
        </div>

        <h2 class="module-title">
          Vamos entender sua situação
        </h2>

        <p class="module-subtitle">
          Responda algumas perguntas simples.
          Não precisa conhecer termos jurídicos.
        </p>

        <div class="field-group">

          <label
            class="field-label"
            for="field-nome"
          >
            Seu nome
          </label>

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

          <label
            class="field-label"
            for="field-telefone"
          >
            WhatsApp com DDD
          </label>

          <input
            id="field-telefone"
            class="input-base"
            placeholder="(17) 99999-9999"
            value="${escapeHtml(state.answers.telefone)}"
            maxlength="15"
            aria-required="true"
          >

          <div
            class="field-error"
            id="erro-welcome"
            role="alert"
          ></div>

        </div>


        <div class="nav-row" style="justify-content:flex-end;">

          <button
            onclick="nextSlide()"
            class="nav-btn nav-btn-primary"
          >
            Começar →
          </button>

        </div>

      </div>

    </div>
  `;
}


// ============================================================
// ESCOLHA DO SETOR
// ============================================================

function renderSector(index) {

  return `
    <div
      class="slide"
      data-slide="${index}"
      role="region"
      aria-label="Escolha do setor"
    >

      <div class="module-card">

        <div class="module-number">
          📍 Primeiro passo
        </div>

        <h2 class="module-title">
          Onde podemos ajudar você?
        </h2>

        <p class="module-subtitle">
          Escolha o assunto que mais combina
          com o que está acontecendo.
        </p>


        <div
          class="options-stack"
          role="radiogroup"
          aria-label="Áreas de atendimento"
        >

          ${state.sectors.map((sector, idx) => `

            <button
              onclick="selectSector('${escapeHtml(sector.key)}', this)"
              class="option-btn ${
                state.answers.sector === sector.key
                  ? "selected"
                  : ""
              }"
              data-value="${escapeHtml(sector.key)}"
              role="radio"
              aria-checked="${
                state.answers.sector === sector.key
              }"
            >

              <span
                class="option-marker"
              >
                ${escapeHtml(sector.icon || idx + 1)}
              </span>

              <span style="display:flex;flex-direction:column;text-align:left;">

                <strong>
                  ${escapeHtml(sector.label)}
                </strong>

                <small style="opacity:.75;margin-top:3px;">
                  ${escapeHtml(sector.description)}
                </small>

              </span>

            </button>

          `).join("")}

        </div>


        <div class="nav-row">

          <button
            onclick="prevSlide()"
            class="nav-btn nav-btn-ghost"
          >
            ← Voltar
          </button>

          <button
            onclick="confirmSector()"
            class="nav-btn nav-btn-primary"
            id="btn-sector-next"
            disabled
          >
            Continuar →
          </button>

        </div>

      </div>

    </div>
  `;
}


// ============================================================
// ESCOLHA DO ASSUNTO
// ============================================================

function renderRouter(index) {

  const options =
    state.benefits.filter(
      benefit =>
        benefit.sector === state.answers.sector
    );

  state.routerOptions = options;

  const sector =
    state.sectors.find(
      item =>
        item.key === state.answers.sector
    );

  return `
    <div
      class="slide"
      data-slide="${index}"
      role="region"
      aria-label="Escolha do assunto"
    >

      <div class="module-card">

        <div class="module-number">
          ${escapeHtml(sector?.icon || "📋")}
          ${escapeHtml(sector?.label || "Assunto")}
        </div>

        <h2 class="module-title">
          O que está acontecendo?
        </h2>

        <p class="module-subtitle">
          Escolha a opção que mais se parece
          com sua situação.
        </p>


        <div
          class="options-stack"
          role="radiogroup"
          aria-label="Assuntos"
        >

          ${options.map((option, idx) => `

            <button
              onclick="selectRouter('${escapeHtml(option.key)}', this)"
              class="option-btn ${
                state.answers.benefitKey === option.key
                  ? "selected"
                  : ""
              }"
              data-value="${escapeHtml(option.key)}"
              role="radio"
              aria-checked="${
                state.answers.benefitKey === option.key
              }"
            >

              <span class="option-marker">
                ${idx + 1}
              </span>

              <span style="display:flex;flex-direction:column;text-align:left;">

                <strong>
                  ${escapeHtml(option.label)}
                </strong>

                <small style="opacity:.75;margin-top:3px;">
                  ${escapeHtml(option.description || "")}
                </small>

              </span>

            </button>

          `).join("")}

        </div>


        <div class="nav-row">

          <button
            onclick="prevSlide()"
            class="nav-btn nav-btn-ghost"
          >
            ← Voltar
          </button>

          <button
            onclick="confirmRouter()"
            class="nav-btn nav-btn-primary"
            id="btn-router-next"
            disabled
          >
            Continuar →
          </button>

        </div>

      </div>

    </div>
  `;
}


// ============================================================
// PERGUNTA
// ============================================================

function renderQuestion(slide, index) {

  const q =
    slide.question;

  const currentVal =
    state.answers.questionAnswers[q.id] || "";

  let inputHtml = "";


  if (q.type === "choice") {

    inputHtml = `
      <div
        class="options-stack"
        role="radiogroup"
        aria-label="${escapeHtml(q.label)}"
      >

        ${q.options.map((option, idx) => `

          <button
            onclick="selectChoice(
              '${escapeHtml(q.id)}',
              '${escapeHtml(option)}',
              this
            )"
            class="option-btn ${
              currentVal === option
                ? "selected"
                : ""
            }"
            role="radio"
            aria-checked="${
              currentVal === option
            }"
          >

            <span class="option-marker">
              ${String.fromCharCode(65 + idx)}
            </span>

            <span>
              ${escapeHtml(option)}
            </span>

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
        placeholder="${
          q.unit === "anos"
            ? "Ex.: 25"
            : "Ex.: 12"
        }"
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
        placeholder="${
          escapeHtml(
            q.placeholder || "Sua resposta"
          )
        }"
        value="${escapeHtml(currentVal)}"
        aria-label="${escapeHtml(q.label)}"
      >
    `;
  }


  return `
    <div
      class="slide"
      data-slide="${index}"
      role="region"
      aria-label="Pergunta ${slide.questionIndex + 1}"
    >

      <div class="module-card">

        <div class="module-number">
          📝 Pergunta
          ${slide.questionIndex + 1}
          de
          ${slide.totalQuestions}
        </div>

        <h2 class="module-title">
          ${escapeHtml(q.label)}
        </h2>

        ${
          q.unit
            ? `
              <p class="module-subtitle">
                Responda em ${escapeHtml(q.unit)}.
              </p>
            `
            : ""
        }

        ${inputHtml}

        <div
          class="field-error"
          id="erro-q-${escapeHtml(q.id)}"
          role="alert"
        ></div>

        <div class="nav-row">

          <button
            onclick="prevSlide()"
            class="nav-btn nav-btn-ghost"
          >
            ← Voltar
          </button>

          <button
            onclick="confirmQuestion('${escapeHtml(q.id)}')"
            class="nav-btn nav-btn-primary"
          >
            ${
              slide.questionIndex + 1 <
              slide.totalQuestions
                ? "Próxima →"
                : "Continuar →"
            }
          </button>

        </div>

      </div>

    </div>
  `;
}


// ============================================================
// FINAL
// ============================================================

function renderFinal(index) {

  return `
    <div
      class="slide"
      data-slide="${index}"
      role="region"
      aria-label="Finalização"
    >

      <div class="module-card">

        <div class="module-number">
          ✨ Última etapa
        </div>

        <h2 class="module-title">
          Quer contar mais alguma coisa?
        </h2>

        <p class="module-subtitle">
          Essa parte é opcional.
          Se quiser, conte algo importante
          que não apareceu nas perguntas.
        </p>

        <textarea
          id="field-observacao"
          class="input-base"
          style="min-height:120px;resize:vertical;"
          placeholder="Escreva aqui, se quiser..."
          aria-label="Observações adicionais"
        >${escapeHtml(state.answers.observacao)}</textarea>

        <div class="nav-row">

          <button
            onclick="prevSlide()"
            class="nav-btn nav-btn-ghost"
          >
            ← Voltar
          </button>

          <button
            onclick="submitFinal()"
            class="nav-btn nav-btn-primary"
          >
            Gerar análise →
          </button>

        </div>

      </div>

    </div>
  `;
}


// ============================================================
// RESULTADO
// ============================================================

function renderSuccess(index) {

  const label =
    state.answers.classificationLabel || "";

  const rationale =
    state.answers.rationale || "";

  let cardClass = "neutral";
  let labelColor = "#94a3b8";


  if (
    state.answers.classification ===
    "provavel_analise"
  ) {

    cardClass = "success";
    labelColor = "#10b981";

  } else if (
    state.answers.classification ===
    "planejamento"
  ) {

    cardClass = "warning";
    labelColor = "#f59e0b";

  } else if (
    state.answers.classification ===
    "precisa_avaliacao"
  ) {

    cardClass = "warning";
    labelColor = "#f59e0b";
  }


  const firstName =
    escapeHtml(
      String(state.answers.nome || "")
        .trim()
        .split(/\s+/)[0]
    );


  return `
    <div
      class="slide"
      data-slide="${index}"
      role="region"
      aria-label="Resultado"
    >

      <div class="module-card">

        <div
          class="success-icon"
          aria-hidden="true"
        >
          ✓
        </div>

        <div
          class="module-number"
          style="margin:0 auto 1rem;display:flex;width:fit-content;"
        >
          🎉 Concluído
        </div>

        <h2
          class="module-title"
          style="text-align:center;"
        >
          Obrigado, ${firstName || "cliente"}!
        </h2>

        <p
          class="module-subtitle"
          style="text-align:center;"
        >
          Fizemos uma primeira leitura da sua situação.
        </p>


        <div
          class="result-card ${cardClass}"
          role="status"
        >

          <div
            style="
              font-size:.75rem;
              color:#94a3b8;
              text-transform:uppercase;
              font-weight:600;
              margin-bottom:.5rem;
            "
          >
            Resultado inicial
          </div>

          <div
            style="
              font-size:1.3rem;
              font-weight:800;
              color:${labelColor};
              margin-bottom:.8rem;
            "
          >
            ${escapeHtml(label)}
          </div>

          <div
            style="
              font-size:.95rem;
              color:#e2e8f0;
              line-height:1.6;
            "
          >
            ${escapeHtml(rationale)}
          </div>

        </div>


        <div class="info-box">

          <strong style="color:#fff;">
            Importante:
          </strong>

          <br>

          Esta é uma triagem inicial.
          Ela não confirma benefício,
          valor ou direito.
          A confirmação depende da análise
          dos documentos e das regras aplicáveis
          ao seu caso.

        </div>


        <div
          style="
            display:flex;
            flex-direction:column;
            gap:.8rem;
            margin-top:1.5rem;
          "
        >

          <a
            href="#"
            id="btn-whatsapp"
            class="nav-btn nav-btn-whatsapp"
            aria-label="Enviar resumo no WhatsApp"
          >
            Enviar resumo no WhatsApp
          </a>

          <button
            onclick="restart()"
            class="nav-btn nav-btn-ghost"
            style="width:100%;justify-content:center;"
          >
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

  if (
    index < 0 ||
    index >= state.slides.length
  ) {
    return;
  }

  state.currentSlide = index;

  const track =
    document.getElementById("slideTrack");

  if (!track) return;

  const percent =
    (index /
      Math.max(
        state.slides.length - 1,
        1
      )) * 100;

  track.style.transform =
    `translateX(-${percent}%)`;


  document
    .querySelectorAll(".slide-dot")
    .forEach((dot, i) => {

      dot.classList.remove(
        "active",
        "done"
      );

      if (i === index) {
        dot.classList.add("active");
      } else if (i < index) {
        dot.classList.add("done");
      }
    });


  const progress =
    document.getElementById(
      "progressBar"
    );

  if (progress) {
    progress.style.width =
      `${percent}%`;
  }


  setTimeout(() => {

    const firstInput =
      document.querySelector(
        `[data-slide="${index}"] input,
         [data-slide="${index}"] textarea`
      );

    if (firstInput) {
      firstInput.focus();
    }

  }, 400);
}


// ============================================================
// AVANÇAR
// ============================================================

function nextSlide() {

  const slide =
    state.slides[
      state.currentSlide
    ];

  if (!slide) return;


  if (slide.type === "welcome") {

    const nome =
      document
        .getElementById("field-nome")
        ?.value
        .trim() || "";

    const tel =
      document
        .getElementById("field-telefone")
        ?.value
        .trim() || "";

    const err =
      document.getElementById(
        "erro-welcome"
      );


    if (
      !nome ||
      nome.length < 3
    ) {

      err.textContent =
        "Digite seu nome.";

      err.classList.add("show");

      return;
    }


    if (
      tel.replace(/\D/g, "")
        .length < 10
    ) {

      err.textContent =
        "Digite um WhatsApp válido com DDD.";

      err.classList.add("show");

      return;
    }


    err.classList.remove("show");

    state.answers.nome = nome;
    state.answers.telefone = tel;
  }


  goToSlide(
    state.currentSlide + 1
  );
}


function prevSlide() {

  goToSlide(
    state.currentSlide - 1
  );
}


// ============================================================
// SETOR
// ============================================================

function selectSector(
  value,
  button
) {

  state.answers.sector =
    value;

  state.answers.benefitKey =
    "";

  document
    .querySelectorAll(
      `[data-slide="${state.currentSlide}"] .option-btn`
    )
    .forEach(btn => {

      btn.classList.remove(
        "selected"
      );

      btn.setAttribute(
        "aria-checked",
        "false"
      );
    });


  button.classList.add(
    "selected"
  );

  button.setAttribute(
    "aria-checked",
    "true"
  );


  const next =
    document.getElementById(
      "btn-sector-next"
    );

  if (next) {
    next.disabled = false;
  }
}


function confirmSector() {

  if (
    !state.answers.sector
  ) {
    return;
  }


  state.answers.benefitKey =
    "";

  state.answers.questionAnswers =
    {};

  renderAllSlides();
  renderDots();

  goToSlide(2);
}


// ============================================================
// ASSUNTO
// ============================================================

function selectRouter(
  value,
  button
) {

  state.answers.benefitKey =
    value;


  document
    .querySelectorAll(
      `[data-slide="${state.currentSlide}"] .option-btn`
    )
    .forEach(btn => {

      btn.classList.remove(
        "selected"
      );

      btn.setAttribute(
        "aria-checked",
        "false"
      );
    });


  button.classList.add(
    "selected"
  );

  button.setAttribute(
    "aria-checked",
    "true"
  );


  const next =
    document.getElementById(
      "btn-router-next"
    );

  if (next) {
    next.disabled = false;
  }
}


function confirmRouter() {

  if (
    !state.answers.benefitKey
  ) {
    return;
  }


  const benefit =
    state.benefits.find(
      item =>
        item.key ===
        state.answers.benefitKey
    );


  if (!benefit) {
    return;
  }


  state.answers.benefitLabel =
    benefit.label;

  state.answers.questionAnswers =
    {};


  const questionSlides =
    benefit.questions.map(
      (question, index) => ({
        type: "question",
        number: "Etapa",
        question,
        questionIndex: index,
        totalQuestions:
          benefit.questions.length
      })
    );


  state.slides =
    state.slides.filter(
      slide =>
        slide.type !== "question"
    );


  state.slides.splice(
    3,
    0,
    ...questionSlides
  );


  renderAllSlides();
  renderDots();

  goToSlide(3);
}


// ============================================================
// RESPOSTA DE ESCOLHA
// ============================================================

function selectChoice(
  questionId,
  value,
  button
) {

  state.answers.questionAnswers[
    questionId
  ] = value;


  document
    .querySelectorAll(
      `[data-slide="${state.currentSlide}"] .option-btn`
    )
    .forEach(btn => {

      btn.classList.remove(
        "selected"
      );

      btn.setAttribute(
        "aria-checked",
        "false"
      );
    });


  button.classList.add(
    "selected"
  );

  button.setAttribute(
    "aria-checked",
    "true"
  );
}


// ============================================================
// CONFIRMAR PERGUNTA
// ============================================================

function confirmQuestion(
  questionId
) {

  const slide =
    state.slides[
      state.currentSlide
    ];

  const question =
    slide.question;

  const error =
    document.getElementById(
      `erro-q-${questionId}`
    );


  if (
    question.type === "choice"
  ) {

    if (
      !state.answers
        .questionAnswers[
          questionId
        ]
    ) {

      error.textContent =
        "Escolha uma opção.";

      error.classList.add(
        "show"
      );

      return;
    }

  } else {

    const field =
      document.getElementById(
        `field-${questionId}`
      );

    const value =
      field?.value.trim() || "";


    if (
      question.required &&
      !value
    ) {

      error.textContent =
        "Essa informação é importante. Responda para continuar.";

      error.classList.add(
        "show"
      );

      return;
    }


    state.answers
      .questionAnswers[
        questionId
      ] = value;
  }


  error.classList.remove(
    "show"
  );


  goToSlide(
    state.currentSlide + 1
  );
}


// ============================================================
// ENVIO FINAL
// ============================================================

async function submitFinal() {

  const field =
    document.getElementById(
      "field-observacao"
    );

  state.answers.observacao =
    field?.value.trim() || "";


  const currentCard =
    document.querySelector(
      `[data-slide="${state.currentSlide}"] .module-card`
    );


  if (currentCard) {

    currentCard.innerHTML = `
      <div
        style="
          text-align:center;
          padding:3rem 1rem;
        "
      >

        <div
          style="
            display:inline-block;
            width:48px;
            height:48px;
            border:4px solid rgba(59,130,246,.3);
            border-top-color:#3b82f6;
            border-radius:50%;
            animation:spin 1s linear infinite;
          "
        ></div>

        <p
          style="
            color:#cbd5e1;
            margin-top:1.5rem;
            font-size:1.1rem;
          "
        >
          Analisando suas respostas...
        </p>

      </div>

      <style>
        @keyframes spin {
          to {
            transform:rotate(360deg);
          }
        }
      </style>
    `;
  }


  try {

    const response =
      await fetch(
        "/api/triagem",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name:
                state.answers.nome,

              phone:
                state.answers.telefone,

              benefit_type:
                state.answers.benefitKey,

              answers:
                state.answers.questionAnswers
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
        "Erro ao enviar análise."
      );
    }


    state.answers.classification =
      data.classification;

    state.answers.classificationLabel =
      data.classification_label;

    state.answers.rationale =
      data.rationale;


    renderAllSlides();
    renderDots();

    goToSlide(
      state.slides.length - 1
    );


    setTimeout(() => {

      const button =
        document.getElementById(
          "btn-whatsapp"
        );

      if (
        button &&
        data.whatsapp_link
      ) {

        button.href =
          data.whatsapp_link;
      }

    }, 100);


  } catch (error) {

    console.error(
      "Erro ao enviar triagem:",
      error
    );


    if (currentCard) {

      currentCard.innerHTML = `

        <div
          style="
            text-align:center;
            padding:3rem 1rem;
          "
        >

          <div
            style="
              font-size:3rem;
              margin-bottom:1rem;
            "
          >
            ⚠️
          </div>

          <p
            style="
              color:#f87171;
              font-size:1.1rem;
              margin-bottom:1.5rem;
            "
          >
            Não conseguimos enviar sua análise.
          </p>

          <button
            onclick="location.reload()"
            class="nav-btn nav-btn-primary"
          >
            Tentar novamente
          </button>

        </div>
      `;
    }
  }
}


// ============================================================
// REINICIAR
// ============================================================

function restart() {

  state.answers = {
    nome: "",
    telefone: "",
    sector: "",
    benefitKey: "",
    benefitLabel: "",
    questionAnswers: {},
    observacao: ""
  };


  buildSlides();
}


// ============================================================
// DOTS
// ============================================================

function renderDots() {

  const dots =
    document.getElementById(
      "slideDots"
    );

  if (!dots) return;


  dots.innerHTML =
    state.slides
      .map(
        (_, index) => `
          <button
            class="slide-dot"
            onclick="goToSlide(${index})"
            aria-label="Ir para etapa ${index + 1}"
          ></button>
        `
      )
      .join("");
}


// ============================================================
// LOGIN ADMIN
// ============================================================

function initGoogleAuth() {

  if (
    typeof google === "undefined"
  ) {
    return;
  }


  google.accounts.id.initialize({

    client_id:
      "SEU_CLIENT_ID_GOOGLE.apps.googleusercontent.com",

    callback:
      handleGoogleCredentialResponse,

    auto_select:
      false,

    cancel_on_tap_outside:
      true
  });
}


async function handleGoogleCredentialResponse(
  response
) {

  try {

    const result =
      await fetch(
        "/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              type: "google",
              credential:
                response.credential
            })
        }
      );


    if (!result.ok) {
      throw new Error(
        "Credenciais inválidas."
      );
    }


    const data =
      await result.json();


    abrirPainelAdmin(
      data.role,
      data.token
    );

    fecharLoginModal();

  } catch (error) {

    alert(
      "Erro ao autenticar com Google: " +
      error.message
    );
  }
}


async function autenticarUsuario() {

  const username =
    document
      .getElementById(
        "user-login"
      )
      ?.value
      .trim() || "";

  const password =
    document
      .getElementById(
        "pass-login"
      )
      ?.value
      .trim() || "";


  if (
    !username ||
    !password
  ) {

    alert(
      "Preencha usuário e senha."
    );

    return;
  }


  try {

    const response =
      await fetch(
        "/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              type: "password",
              username,
              password
            })
        }
      );


    if (!response.ok) {

      throw new Error(
        "Usuário ou senha incorretos."
      );
    }


    const data =
      await response.json();


    abrirPainelAdmin(
      data.role,
      data.token
    );

    fecharLoginModal();

  } catch (error) {

    alert(error.message);
  }
}


function abrirPainelAdmin(
  role,
  token
) {

  localStorage.setItem(
    "admin_token",
    token
  );

  localStorage.setItem(
    "admin_role",
    role
  );

  alert(
    `Bem-vindo, ${role}!`
  );
}


function abrirLoginModal() {

  const modal =
    document.getElementById(
      "modal-login"
    );

  if (modal) {
    modal.classList.remove(
      "hidden"
    );
  }


  if (
    typeof google !== "undefined"
  ) {

    const container =
      document.getElementById(
        "g_id_signin"
      );

    if (
      container &&
      google.accounts?.id
    ) {

      google.accounts.id.renderButton(
        container,
        {
          theme: "outline",
          size: "large",
          width: "100%"
        }
      );
    }
  }
}


function fecharLoginModal() {

  const modal =
    document.getElementById(
      "modal-login"
    );

  if (modal) {
    modal.classList.add(
      "hidden"
    );
  }
}


// ============================================================
// INTERCEPTOR ADMIN
// ============================================================

const originalFetch =
  window.fetch.bind(window);


window.fetch =
  async function (...args) {

    const url =
      String(args[0]);

    const options =
      args[1] || {};

    const token =
      localStorage.getItem(
        "admin_token"
      );


    if (
      url.includes(
        "/api/admin/"
      ) &&
      token
    ) {

      options.headers = {
        ...(options.headers || {}),
        Authorization:
          `Bearer ${token}`
      };
    }


    return originalFetch(
      args[0],
      options
    );
  };


// ============================================================
// DOM
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadConfig();

    initGoogleAuth();


    document.addEventListener(
      "input",
      event => {

        if (
          event.target.id ===
          "field-telefone"
        ) {

          const position =
            event.target
              .selectionStart;

          const before =
            event.target.value.length;


          event.target.value =
            mascaraTelefone(
              event.target.value
            );


          const after =
            event.target.value.length;


          const newPosition =
            Math.max(
              0,
              position +
              (after - before)
            );


          event.target.setSelectionRange(
            newPosition,
            newPosition
          );
        }
      }
    );


    document.addEventListener(
      "keydown",
      event => {

        if (
          event.target.tagName ===
            "INPUT" ||
          event.target.tagName ===
            "TEXTAREA"
        ) {
          return;
        }


        if (
          event.key ===
          "ArrowRight"
        ) {
          nextSlide();
        }


        if (
          event.key ===
          "ArrowLeft"
        ) {
          prevSlide();
        }
      }
    );
  }
);


// ============================================================
// TELEFONE
// ============================================================

function mascaraTelefone(
  value
) {

  const digits =
    value
      .replace(/\D/g, "")
      .slice(0, 11);


  if (
    digits.length <= 2
  ) {

    return digits.length
      ? `(${digits}`
      : "";
  }


  if (
    digits.length <= 7
  ) {

    return (
      `(${digits.slice(0, 2)}) ` +
      digits.slice(2)
    );
  }


  return (
    `(${digits.slice(0, 2)}) ` +
    `${digits.slice(2, 7)}-` +
    digits.slice(7, 11)
  );
}
