/* =========================================================
   PREV — APP.JS
   Triagem Previdenciária e Trabalhista
   Katerina = única assistente/voz
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     CONFIGURAÇÃO
     ======================================================= */

  const API = {
    sectors: "/api/sectors",
    benefits: "/api/benefits",
    triagem: "/api/triagem"
  };

  const state = {
    screen: "home",

    sectors: [],
    benefits: [],

    sector: null,
    benefit: null,

    questions: [],
    currentQuestion: 0,

    answers: {},

    name: "",
    phone: "",
    observation: "",

    consentDocuments: false,

    result: null
  };


  /* =======================================================
     ELEMENTOS
     ======================================================= */

  const el = {
    homeScreen: document.getElementById("homeScreen"),
    triageScreen: document.getElementById("triageScreen"),
    resultScreen: document.getElementById("resultScreen"),

    startButton: document.getElementById("startButton"),

    triageTitle: document.getElementById("triageTitle"),
    progressText: document.getElementById("progressText"),
    progressBar: document.getElementById("progressBar"),
    questionArea: document.getElementById("questionArea"),

    backButton: document.getElementById("backButton"),
    nextButton: document.getElementById("nextButton"),

    resultContent: document.getElementById("resultContent"),
    newTriageButton: document.getElementById("newTriageButton")
  };


  /* =======================================================
     UTILITÁRIOS
     ======================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }


  function showScreen(screen) {
    state.screen = screen;

    if (el.homeScreen) {
      el.homeScreen.classList.toggle("active", screen === "home");
      el.homeScreen.hidden = screen !== "home";
    }

    if (el.triageScreen) {
      el.triageScreen.classList.toggle("active", screen === "triage");
      el.triageScreen.hidden = screen !== "triage";
    }

    if (el.resultScreen) {
      el.resultScreen.classList.toggle("active", screen === "result");
      el.resultScreen.hidden = screen !== "result";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function katerinaSay(text) {
    if (window.Katerina && typeof window.Katerina.talk === "function") {
      window.Katerina.talk(text);
      return;
    }

    if (window.Katerina && typeof window.Katerina.say === "function") {
      window.Katerina.say(text);
    }
  }


  function katerinaThinking() {
    if (window.Katerina && typeof window.Katerina.thinking === "function") {
      window.Katerina.thinking(true);
    }
  }


  function katerinaFollow() {
    if (window.Katerina && typeof window.Katerina.follow === "function") {
      window.Katerina.follow();
    }
  }


  function katerinaAttention() {
    if (window.Katerina && typeof window.Katerina.attention === "function") {
      window.Katerina.attention();
    }
  }


  /* =======================================================
     API
     ======================================================= */

  async function apiGet(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    return response.json();
  }


  async function apiPost(url, data) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });

    const contentType = response.headers.get("content-type") || "";

    let body;

    if (contentType.includes("application/json")) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      throw new Error(
        typeof body === "string"
          ? body
          : body?.error || `Erro HTTP ${response.status}`
      );
    }

    return body;
  }


  /* =======================================================
     CARREGAMENTO INICIAL
     ======================================================= */

  async function loadInitialData() {
    try {
      katerinaThinking();

      const [sectorsResult, benefitsResult] = await Promise.all([
        apiGet(API.sectors),
        apiGet(API.benefits)
      ]);

      state.sectors = normalizeArray(
        sectorsResult?.sectors || sectorsResult
      );

      state.benefits = normalizeArray(
        benefitsResult?.benefits || benefitsResult
      );

      console.log("PREV carregado:", {
        sectors: state.sectors,
        benefits: state.benefits
      });

    } catch (error) {

      /*
       * O frontend continua funcionando mesmo antes
       * do backend novo estar conectado.
       *
       * Isso facilita desenvolver a interface primeiro.
       */

      console.warn(
        "PREV: API ainda não disponível.",
        error
      );

      state.sectors = getFallbackSectors();
      state.benefits = getFallbackBenefits();
    }
  }


  /* =======================================================
     DADOS TEMPORÁRIOS
     Usados somente se a API ainda não estiver pronta.
     ======================================================= */

  function getFallbackSectors() {
    return [
      {
        key: "previdencia",
        label: "Previdenciário",
        description:
          "INSS, aposentadoria, benefícios, CNIS e planejamento.",
        icon: "🏛️"
      },
      {
        key: "trabalhista",
        label: "Trabalhista",
        description:
          "Rescisão, FGTS, férias, salário e situações no trabalho.",
        icon: "💼"
      }
    ];
  }


  function getFallbackBenefits() {
    return [
      {
        key: "aposentadoria_idade",
        sector: "previdencia",
        label: "Aposentadoria",
        description: "Quero entender minha situação para aposentadoria."
      },
      {
        key: "acerto_cnis",
        sector: "previdencia",
        label: "CNIS",
        description: "Há algum erro ou período que não aparece no CNIS."
      },
      {
        key: "bpc_loas",
        sector: "previdencia",
        label: "BPC / LOAS",
        description: "Quero entender uma situação relacionada ao BPC."
      },
      {
        key: "incapacidade",
        sector: "previdencia",
        label: "Incapacidade",
        description: "Estou ou estive afastado por problema de saúde."
      },
      {
        key: "pensao_morte",
        sector: "previdencia",
        label: "Pensão por morte",
        description: "Quero entender uma situação de pensão."
      },
      {
        key: "revisao_beneficio",
        sector: "previdencia",
        label: "Revisão",
        description: "Quero conferir um benefício que já recebo."
      },

      {
        key: "rescisao",
        sector: "trabalhista",
        label: "Rescisão",
        description: "Fui demitido, pedi demissão ou estou saindo."
      },
      {
        key: "fgts",
        sector: "trabalhista",
        label: "FGTS",
        description: "Quero conferir depósitos ou saldo."
      },
      {
        key: "ferias",
        sector: "trabalhista",
        label: "Férias",
        description: "Tenho dúvidas sobre férias."
      },
      {
        key: "decimo_terceiro",
        sector: "trabalhista",
        label: "13º salário",
        description: "Quero conferir o pagamento do 13º."
      },
      {
        key: "horas_extras",
        sector: "trabalhista",
        label: "Horas extras",
        description: "Quero organizar uma situação de jornada."
      },
      {
        key: "justa_causa",
        sector: "trabalhista",
        label: "Justa causa",
        description: "Recebi ou estou diante de uma justa causa."
      }
    ];
  }


  /* =======================================================
     INÍCIO DA TRIAGEM
     ======================================================= */

  function startTriage() {
    resetTriage();

    showScreen("triage");

    renderSectorQuestion();

    katerinaSay(
      "Vamos começar pelo mais importante. " +
      "Você não precisa saber o nome jurídico do seu problema. " +
      "Me conte o que aconteceu."
    );
  }


  /* =======================================================
     SETOR
     ======================================================= */

  function renderSectorQuestion() {
    state.currentQuestion = 0;

    if (el.triageTitle) {
      el.triageTitle.textContent = "Primeiro, vamos entender o assunto";
    }

    updateProgress(1, 1);

    const sectors = state.sectors.length
      ? state.sectors
      : getFallbackSectors();

    const cards = sectors
      .filter(sector => {
        return (
          sector.key === "previdencia" ||
          sector.key === "trabalhista"
        );
      })
      .map(sector => `
        <button
          type="button"
          class="choice-card"
          data-sector="${escapeHtml(sector.key)}"
        >
          <span class="choice-icon">
            ${escapeHtml(sector.icon || "•")}
          </span>

          <span class="choice-content">
            <strong>${escapeHtml(sector.label)}</strong>
            <small>
              ${escapeHtml(sector.description || "")}
            </small>
          </span>

          <span class="choice-arrow">›</span>
        </button>
      `)
      .join("");

    const dontKnow = `
      <button
        type="button"
        class="choice-card choice-card-neutral"
        data-sector="nao_sei"
      >
        <span class="choice-icon">?</span>

        <span class="choice-content">
          <strong>Não sei</strong>
          <small>
            Não tem problema. A Katerina ajuda a descobrir.
          </small>
        </span>

        <span class="choice-arrow">›</span>
      </button>
    `;

    if (el.questionArea) {
      el.questionArea.innerHTML = `
        <div class="question-intro">
          <p>
            Qual destas situações parece mais próxima do que
            você precisa resolver?
          </p>
        </div>

        <div class="choices">
          ${cards}
          ${dontKnow}
        </div>
      `;
    }

    hideBackButton();
    disableNextButton();

    document
      .querySelectorAll("[data-sector]")
      .forEach(button => {
        button.addEventListener("click", () => {
          selectSector(button.dataset.sector);
        });
      });
  }


  function selectSector(sectorKey) {
    if (sectorKey === "nao_sei") {
      katerinaFollow();

      katerinaSay(
        "Tudo certo. Você não precisa descobrir isso sozinho. " +
        "Vou fazer algumas perguntas simples para organizar o assunto."
      );

      renderGuidedSectorQuestion();
      return;
    }

    const sector = state.sectors.find(
      item => item.key === sectorKey
    ) || getFallbackSectors().find(
      item => item.key === sectorKey
    );

    if (!sector) {
      return;
    }

    state.sector = sector;

    katerinaFollow();

    renderBenefitQuestion();
  }


  /* =======================================================
     MODO "NÃO SEI"
     ======================================================= */

  function renderGuidedSectorQuestion() {
    if (el.triageTitle) {
      el.triageTitle.textContent = "Vamos descobrir juntos";
    }

    updateProgress(1, 3);

    if (el.questionArea) {
      el.questionArea.innerHTML = `
        <div class="question-intro">
          <p>
            O que mais se aproxima da sua situação?
          </p>
        </div>

        <div class="choices">
          <button
            type="button"
            class="choice-card"
            data-guided-sector="previdencia"
          >
            <span class="choice-icon">🏛️</span>

            <span class="choice-content">
              <strong>Tem relação com INSS</strong>
              <small>
                Aposentadoria, benefício, CNIS, BPC ou algo parecido.
              </small>
            </span>

            <span class="choice-arrow">›</span>
          </button>

          <button
            type="button"
            class="choice-card"
            data-guided-sector="trabalhista"
          >
            <span class="choice-icon">💼</span>

            <span class="choice-content">
              <strong>Tem relação com trabalho</strong>
              <small>
                Empresa, salário, rescisão, FGTS, férias ou jornada.
              </small>
            </span>

            <span class="choice-arrow">›</span>
          </button>

          <button
            type="button"
            class="choice-card choice-card-neutral"
            data-guided-sector="nao_sei"
          >
            <span class="choice-icon">?</span>

            <span class="choice-content">
              <strong>Ainda não sei</strong>
              <small>
                Quero explicar o que aconteceu primeiro.
              </small>
            </span>

            <span class="choice-arrow">›</span>
          </button>
        </div>
      `;
    }

    hideBackButton();
    disableNextButton();

    document
      .querySelectorAll("[data-guided-sector]")
      .forEach(button => {
        button.addEventListener("click", () => {

          const key = button.dataset.guidedSector;

          if (key === "nao_sei") {
            renderFreeExplanation();
            return;
          }

          selectSector(key);
        });
      });
  }


  function renderFreeExplanation() {
    if (el.triageTitle) {
      el.triageTitle.textContent = "Conte o que aconteceu";
    }

    updateProgress(1, 2);

    if (el.questionArea) {
      el.questionArea.innerHTML = `
        <div class="question-intro">
          <p>
            Escreva do seu jeito. Não precisa usar termos jurídicos.
          </p>
        </div>

        <div class="field-group">
          <label for="freeExplanation">
            O que aconteceu?
          </label>

          <textarea
            id="freeExplanation"
            rows="6"
            maxlength="3000"
            placeholder="Ex.: Fui demitido e não sei se minha rescisão está certa..."
          ></textarea>

          <small class="field-help">
            Não coloque senhas, códigos de acesso ou dados bancários.
          </small>
        </div>
      `;
    }

    showBackButton();

    if (el.nextButton) {
      el.nextButton.disabled = false;
      el.nextButton.textContent = "Continuar";
      el.nextButton.onclick = () => {

        const field = document.getElementById(
          "freeExplanation"
        );

        const text = field?.value?.trim() || "";

        if (!text) {
          katerinaAttention();

          katerinaSay(
            "Escreva pelo menos um pouco sobre o que aconteceu. " +
            "Pode ser com suas próprias palavras."
          );

          field?.focus();
          return;
        }

        state.answers.explicacao_livre = text;

        /*
         * Ainda não tentamos adivinhar automaticamente
         * uma categoria jurídica.
         *
         * A informação vai para a triagem como contexto.
         */
        state.sector = {
          key: "nao_classificado",
          label: "Não classificado inicialmente"
        };

        renderContactQuestion();
      };
    }
  }


  /* =======================================================
     BENEFÍCIO / ASSUNTO
     ======================================================= */

  function renderBenefitQuestion() {
    const sectorKey = state.sector?.key;

    let benefits = state.benefits.filter(
      benefit => benefit.sector === sectorKey
    );

    /*
     * Compatibilidade com estruturas que usam sector_key.
     */
    if (!benefits.length) {
      benefits = state.benefits.filter(
        benefit => benefit.sector_key === sectorKey
      );
    }

    /*
     * Compatibilidade com estruturas em que o setor
     * vem dentro de uma propriedade diferente.
     */
    if (!benefits.length) {
      benefits = getFallbackBenefits().filter(
        benefit => benefit.sector === sectorKey
      );
    }

    if (el.triageTitle) {
      el.triageTitle.textContent =
        sectorKey === "trabalhista"
          ? "Agora vamos organizar o assunto do trabalho"
          : "Agora vamos organizar o assunto previdenciário";
    }

    updateProgress(2, 3);

    const cards = benefits.map(benefit => `
      <button
        type="button"
        class="choice-card"
        data-benefit="${escapeHtml(benefit.key)}"
      >
        <span class="choice-icon">
          ${escapeHtml(benefit.icon || "•")}
        </span>

        <span class="choice-content">
          <strong>${escapeHtml(
            benefit.label ||
            benefit.name ||
            benefit.key
          )}</strong>

          <small>
            ${escapeHtml(
              benefit.description ||
              "Vamos organizar esta situação."
            )}
          </small>
        </span>

        <span class="choice-arrow">›</span>
      </button>
    `).join("");

    const other = `
      <button
        type="button"
        class="choice-card choice-card-neutral"
        data-benefit="outros"
      >
        <span class="choice-icon">＋</span>

        <span class="choice-content">
          <strong>Outro assunto</strong>
          <small>
            Não encontrei uma opção que descreva meu caso.
          </small>
        </span>

        <span class="choice-arrow">›</span>
      </button>
    `;

    if (el.questionArea) {
      el.questionArea.innerHTML = `
        <div class="question-intro">
          <p>
            Qual assunto mais se aproxima do que você precisa?
          </p>
        </div>

        <div class="choices">
          ${cards}
          ${other}
        </div>
      `;
    }

    showBackButton();
    disableNextButton();

    document
      .querySelectorAll("[data-benefit]")
      .forEach(button => {
        button.addEventListener("click", () => {

          state.benefit = findBenefit(
            button.dataset.benefit
          );

          if (button.dataset.benefit === "outros") {
            state.benefit = {
              key: "outros",
              label: "Outros assuntos",
              questions: []
            };
          }

          prepareQuestions();
        });
      });
  }


  function findBenefit(key) {
    return (
      state.benefits.find(
        benefit => benefit.key === key
      ) ||
      getFallbackBenefits().find(
        benefit => benefit.key === key
      ) ||
      null
    );
  }


  /* =======================================================
     PERGUNTAS DO MÓDULO
     ======================================================= */

  function prepareQuestions() {
    let questions = [];

    if (state.benefit) {
      questions =
        state.benefit.questions ||
        state.benefit.questionList ||
        [];
    }

    /*
     * Se o backend entregar as perguntas diretamente,
     * usamos essas perguntas.
     *
     * Se ainda não entregar, usamos perguntas iniciais
     * adequadas ao assunto.
     */
    if (!Array.isArray(questions) || !questions.length) {
      questions = getFallbackQuestions(
        state.sector?.key,
        state.benefit?.key
      );
    }

    state.questions = questions;
    state.currentQuestion = 0;

    renderCurrentQuestion();

    katerinaSay(
      "Agora vou fazer algumas perguntas para organizar " +
      "as informações. Se não souber alguma resposta, " +
      "você pode dizer isso."
    );
  }


  function getFallbackQuestions(sector, benefit) {

    if (sector === "trabalhista") {

      if (benefit === "rescisao") {
        return [
          {
            key: "situacao",
            label: "O que aconteceu com o trabalho?",
            type: "choice",
            required: true,
            options: [
              {
                value: "demitido",
                label: "Fui demitido"
              },
              {
                value: "pedi_demissao",
                label: "Pedi demissão"
              },
              {
                value: "acordo",
                label: "Fiz um acordo"
              },
              {
                value: "ainda_trabalho",
                label: "Ainda estou trabalhando"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          },
          {
            key: "tempo_trabalho",
            label: "Há quanto tempo aproximadamente você trabalhava lá?",
            type: "text",
            required: false,
            placeholder: "Ex.: 2 anos e 4 meses"
          },
          {
            key: "documentos_rescisao",
            label: "Você tem algum documento da rescisão?",
            type: "choice",
            required: false,
            options: [
              {
                value: "sim",
                label: "Sim"
              },
              {
                value: "nao",
                label: "Não"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          }
        ];
      }

      if (benefit === "fgts") {
        return [
          {
            key: "extrato_fgts",
            label: "Você tem o extrato do FGTS?",
            type: "choice",
            required: false,
            options: [
              {
                value: "sim",
                label: "Sim"
              },
              {
                value: "nao",
                label: "Não"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          },
          {
            key: "problema_fgts",
            label: "O que parece estar acontecendo?",
            type: "choice",
            required: true,
            options: [
              {
                value: "depositos_ausentes",
                label: "Há depósitos que não aparecem"
              },
              {
                value: "valor_diferente",
                label: "O valor parece diferente"
              },
              {
                value: "saque",
                label: "Tenho dúvida sobre saque"
              },
              {
                value: "outro",
                label: "Outro"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          }
        ];
      }

      if (benefit === "ferias") {
        return [
          {
            key: "ferias_gozadas",
            label: "Você chegou a tirar essas férias?",
            type: "choice",
            required: true,
            options: [
              {
                value: "sim",
                label: "Sim"
              },
              {
                value: "nao",
                label: "Não"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          },
          {
            key: "pagamento_ferias",
            label: "O pagamento das férias foi feito?",
            type: "choice",
            required: false,
            options: [
              {
                value: "sim",
                label: "Sim"
              },
              {
                value: "nao",
                label: "Não"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          }
        ];
      }

      if (benefit === "horas_extras") {
        return [
          {
            key: "jornada",
            label: "Você tinha horário ou controle de ponto?",
            type: "choice",
            required: false,
            options: [
              {
                value: "sim",
                label: "Sim"
              },
              {
                value: "nao",
                label: "Não"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          },
          {
            key: "pagamento_horas",
            label: "As horas extras eram pagas?",
            type: "choice",
            required: false,
            options: [
              {
                value: "sim",
                label: "Sim"
              },
              {
                value: "nao",
                label: "Não"
              },
              {
                value: "parcial",
                label: "Só algumas"
              },
              {
                value: "nao_sei",
                label: "Não sei"
              }
            ]
          }
        ];
      }

      return [
        {
          key: "situacao",
          label: "Conte brevemente o que está acontecendo no trabalho.",
          type: "textarea",
          required: true,
          placeholder:
            "Pode explicar com suas próprias palavras."
        }
      ];
    }


    /* =====================================================
       PREVIDENCIÁRIO
       ===================================================== */

    if (benefit === "aposentadoria_idade") {
      return [
        {
          key: "idade",
          label: "Qual é a sua idade?",
          type: "number",
          required: false,
          min: 0,
          max: 120,
          placeholder: "Ex.: 62"
        },
        {
          key: "tempo_contribuicao",
          label: "Você sabe aproximadamente quanto tempo contribuiu?",
          type: "text",
          required: false,
          placeholder: "Ex.: 25 anos"
        },
        {
          key: "cnis",
          label: "Você já conferiu seu CNIS?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        }
      ];
    }


    if (benefit === "acerto_cnis") {
      return [
        {
          key: "problema_cnis",
          label: "O que você percebeu de errado no CNIS?",
          type: "choice",
          required: true,
          options: [
            {
              value: "vinculo_ausente",
              label: "Falta um emprego"
            },
            {
              value: "datas",
              label: "As datas estão erradas"
            },
            {
              value: "salario",
              label: "Há problema nos salários"
            },
            {
              value: "contribuicao",
              label: "Há contribuição que não aparece"
            },
            {
              value: "outro",
              label: "Outro"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        },
        {
          key: "provas",
          label: "Você tem algum documento que possa ajudar a comprovar o período?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        }
      ];
    }


    if (benefit === "bpc_loas") {
      return [
        {
          key: "idade",
          label: "Qual é a sua idade?",
          type: "number",
          required: false,
          min: 0,
          max: 120,
          placeholder: "Ex.: 68"
        },
        {
          key: "situacao",
          label: "A situação envolve idade ou deficiência?",
          type: "choice",
          required: false,
          options: [
            {
              value: "idade",
              label: "Idade"
            },
            {
              value: "deficiencia",
              label: "Deficiência"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        },
        {
          key: "cadunico",
          label: "Existe CadÚnico?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        }
      ];
    }


    if (
      benefit === "incapacidade" ||
      benefit === "incapacidade_temporaria" ||
      benefit === "incapacidade_permanente"
    ) {
      return [
        {
          key: "afastado",
          label: "Você está ou esteve afastado do trabalho?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        },
        {
          key: "documento_medico",
          label: "Você possui documentos médicos relacionados ao caso?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        },
        {
          key: "beneficio_anterior",
          label: "Já houve algum pedido ou benefício do INSS relacionado a isso?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        }
      ];
    }


    if (benefit === "pensao_morte") {
      return [
        {
          key: "relacao",
          label: "Qual era a relação com a pessoa falecida?",
          type: "text",
          required: false,
          placeholder: "Ex.: cônjuge, filho, companheiro..."
        },
        {
          key: "beneficio_falecido",
          label: "A pessoa falecida recebia algum benefício?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        },
        {
          key: "documentos",
          label: "Você possui documentos relacionados ao caso?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        }
      ];
    }


    if (benefit === "revisao_beneficio") {
      return [
        {
          key: "beneficio",
          label: "Qual benefício você recebe?",
          type: "text",
          required: false,
          placeholder: "Ex.: aposentadoria, pensão..."
        },
        {
          key: "documento_beneficio",
          label: "Você possui a carta de concessão ou documento do benefício?",
          type: "choice",
          required: false,
          options: [
            {
              value: "sim",
              label: "Sim"
            },
            {
              value: "nao",
              label: "Não"
            },
            {
              value: "nao_sei",
              label: "Não sei"
            }
          ]
        }
      ];
    }


    return [
      {
        key: "descricao",
        label: "Conte brevemente o que está acontecendo.",
        type: "textarea",
        required: true,
        placeholder:
          "Pode explicar com suas próprias palavras."
      }
    ];
  }


  /* =======================================================
     RENDERIZAÇÃO DA PERGUNTA
     ======================================================= */

  function renderCurrentQuestion() {

    const question =
      state.questions[state.currentQuestion];

    if (!question) {
      renderContactQuestion();
      return;
    }

    const total = state.questions.length;
    const current = state.currentQuestion + 1;

    if (el.triageTitle) {
      el.triageTitle.textContent =
        state.benefit?.label ||
        "Vamos entender melhor";
    }

    updateProgress(current, total);

    if (el.questionArea) {
      el.questionArea.innerHTML =
        renderQuestion(question);
    }

    showBackButton();

    const savedValue =
      state.answers[question.key];

    if (savedValue !== undefined) {
      restoreAnswer(question, savedValue);
    }

    updateNextButton();

    attachQuestionEvents(question);
  }


  function renderQuestion(question) {

    const label = escapeHtml(
      question.label ||
      question.question ||
      "Pergunta"
    );

    const help = question.help
      ? `<small class="field-help">${escapeHtml(question.help)}</small>`
      : "";

    const type = question.type || "text";

    if (
      type === "choice" ||
      type === "radio" ||
      type === "select"
    ) {
      const options = normalizeArray(
        question.options
      );

      const html = options.map(option => `
        <label class="option-card">
          <input
            type="radio"
            name="currentQuestion"
            value="${escapeHtml(option.value)}"
          />

          <span>
            ${escapeHtml(
              option.label ||
              option.name ||
              option.value
            )}
          </span>
        </label>
      `).join("");

      return `
        <div class="field-group">
          <label class="question-label">
            ${label}
          </label>

          ${help}

          <div class="options-list">
            ${html}
          </div>
        </div>
      `;
    }


    if (type === "textarea") {
      return `
        <div class="field-group">
          <label
            class="question-label"
            for="currentAnswer"
          >
            ${label}
          </label>

          ${help}

          <textarea
            id="currentAnswer"
            rows="6"
            maxlength="3000"
            placeholder="${escapeHtml(
              question.placeholder || ""
            )}"
          ></textarea>
        </div>
      `;
    }


    if (type === "number") {
      return `
        <div class="field-group">
          <label
            class="question-label"
            for="currentAnswer"
          >
            ${label}
          </label>

          ${help}

          <input
            id="currentAnswer"
            type="number"
            ${question.min !== undefined
              ? `min="${question.min}"`
              : ""}
            ${question.max !== undefined
              ? `max="${question.max}"`
              : ""}
            placeholder="${escapeHtml(
              question.placeholder || ""
            )}"
          />
        </div>
      `;
    }


    return `
      <div class="field-group">
        <label
          class="question-label"
          for="currentAnswer"
        >
          ${label}
        </label>

        ${help}

        <input
          id="currentAnswer"
          type="text"
          maxlength="1000"
          placeholder="${escapeHtml(
            question.placeholder || ""
          )}"
        />
      </div>
    `;
  }


  /* =======================================================
     EVENTOS DA PERGUNTA
     ======================================================= */

  function attachQuestionEvents(question) {

    document
      .querySelectorAll(
        'input[name="currentQuestion"]'
      )
      .forEach(input => {
        input.addEventListener("change", () => {

          state.answers[question.key] =
            input.value;

          updateNextButton();

          /*
           * Pequena reação da Katerina.
           */
          katerinaFollow();
        });
      });


    const input =
      document.getElementById("currentAnswer");

    if (input) {
      input.addEventListener("input", () => {

        state.answers[question.key] =
          input.value;

        updateNextButton();
      });
    }
  }


  function restoreAnswer(question, value) {

    if (
      question.type === "choice" ||
      question.type === "radio" ||
      question.type === "select"
    ) {
      const radio =
        document.querySelector(
          `input[name="currentQuestion"][value="${CSS.escape(String(value))}"]`
        );

      if (radio) {
        radio.checked = true;
      }

      return;
    }

    const input =
      document.getElementById("currentAnswer");

    if (input) {
      input.value = value;
    }
  }


  /* =======================================================
     VALIDAÇÃO
     ======================================================= */

  function getCurrentAnswer() {

    const question =
      state.questions[state.currentQuestion];

    if (!question) {
      return null;
    }

    return state.answers[question.key];
  }


  function validateCurrentQuestion() {

    const question =
      state.questions[state.currentQuestion];

    if (!question) {
      return true;
    }

    const value =
      getCurrentAnswer();

    if (
      question.required &&
      (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      )
    ) {
      katerinaAttention();

      katerinaSay(
        "Essa informação é importante para organizar " +
        "a triagem. Se você não souber, escolha a opção " +
        "não sei quando ela estiver disponível."
      );

      return false;
    }

    return true;
  }


  /* =======================================================
     PRÓXIMA PERGUNTA
     ======================================================= */

  function nextQuestion() {

    if (!validateCurrentQuestion()) {
      return;
    }

    if (
      state.currentQuestion <
      state.questions.length - 1
    ) {

      state.currentQuestion++;

      renderCurrentQuestion();

      return;
    }

    renderContactQuestion();
  }


  /* =======================================================
     PERGUNTA DE CONTATO
     ======================================================= */

  function renderContactQuestion() {

    if (el.triageTitle) {
      el.triageTitle.textContent =
        "Só falta organizar seu atendimento";
    }

    updateProgress(1, 1);

    if (el.questionArea) {
      el.questionArea.innerHTML = `
        <div class="question-intro">
          <p>
            Para registrar a triagem e encaminhar as informações,
            preciso de alguns dados básicos.
          </p>
        </div>

        <div class="field-group">
          <label for="clientName">
            Seu nome
          </label>

          <input
            id="clientName"
            type="text"
            maxlength="120"
            placeholder="Como podemos chamar você?"
            autocomplete="name"
          />
        </div>

        <div class="field-group">
          <label for="clientPhone">
            Seu telefone
          </label>

          <input
            id="clientPhone"
            type="tel"
            maxlength="30"
            placeholder="(00) 00000-0000"
            autocomplete="tel"
          />

          <small class="field-help">
            Usado para contato sobre esta triagem.
          </small>
        </div>

        <div class="field-group">
          <label for="clientObservation">
            Alguma observação?
          </label>

          <textarea
            id="clientObservation"
            rows="4"
            maxlength="2000"
            placeholder="Se quiser, acrescente alguma informação."
          ></textarea>
        </div>

        <div class="document-consent">
          <label class="checkbox-row">
            <input
              id="documentConsent"
              type="checkbox"
            />

            <span>
              Se necessário, aceito ser orientado sobre o
              envio de documentos para análise.
            </span>
          </label>

          <small>
            O envio de documentos é opcional. A senha do gov.br,
            banco, e-mail ou qualquer outra senha nunca deve ser enviada.
          </small>
        </div>
      `;
    }

    showBackButton();

    if (el.nextButton) {
      el.nextButton.disabled = false;
      el.nextButton.textContent = "Registrar triagem";

      el.nextButton.onclick = submitTriage;
    }

    katerinaSay(
      "Pronto. Já temos uma visão inicial. " +
      "Agora vou registrar as informações para que o atendimento " +
      "possa continuar com a análise adequada."
    );
  }


  /* =======================================================
     ENVIO DA TRIAGEM
     ======================================================= */

  async function submitTriage() {

    const name =
      document.getElementById("clientName")
        ?.value
        ?.trim() || "";

    const phone =
      document.getElementById("clientPhone")
        ?.value
        ?.trim() || "";

    const observation =
      document.getElementById("clientObservation")
        ?.value
        ?.trim() || "";

    const consent =
      document.getElementById("documentConsent")
        ?.checked || false;


    if (!name) {
      katerinaAttention();

      katerinaSay(
        "Preciso do seu nome para registrar a triagem."
      );

      document
        .getElementById("clientName")
        ?.focus();

      return;
    }


    if (!phone) {
      katerinaAttention();

      katerinaSay(
        "Preciso de um telefone para que o atendimento possa continuar."
      );

      document
        .getElementById("clientPhone")
        ?.focus();

      return;
    }


    state.name = name;
    state.phone = phone;
    state.observation = observation;
    state.consentDocuments = consent;


    const payload = {
      name: state.name,
      phone: state.phone,

      sector:
        state.sector?.key ||
        "nao_classificado",

      benefit_type:
        state.benefit?.key ||
        "triagem",

      answers: state.answers,

      observation: state.observation,

      consent_documents:
        state.consentDocuments
    };


    try {

      if (el.nextButton) {
        el.nextButton.disabled = true;
        el.nextButton.textContent = "Registrando...";
      }

      katerinaThinking();

      const result =
        await apiPost(
          API.triagem,
          payload
        );

      state.result =
        result || {
          classification: "precisa_avaliacao"
        };

      showResult(state.result);

    } catch (error) {

      console.error(
        "Erro ao registrar triagem:",
        error
      );

      /*
       * Durante o desenvolvimento, mostramos uma
       * confirmação local mesmo que o backend ainda
       * não esteja pronto.
       */

      state.result = {
        classification: "precisa_avaliacao",

        rationale:
          "As informações foram organizadas para análise documental.",

        attention: [
          "Conferir os documentos apresentados.",
          "Verificar as informações informadas na triagem.",
          "Definir o próximo passo com o responsável pelo atendimento."
        ],

        documents: [],

        ticket: null,

        localOnly: true
      };

      showResult(state.result);
    }
  }


  /* =======================================================
     RESULTADO
     ======================================================= */

  function showResult(result) {

    showScreen("result");

    const relevance =
      normalizeRelevance(result);

    const rationale =
      result.rationale ||
      "A situação precisa ser conferida com as informações e documentos disponíveis.";


    const attention =
      normalizeArray(
        result.attention ||
        result.flags ||
        result.next_steps
      );


    const documents =
      normalizeArray(
        result.documents
      );


    const ticket =
      result.ticket ||
      result.ticket_code ||
      result.protocol ||
      "";


    if (el.resultContent) {

      el.resultContent.innerHTML = `
        <div class="result-card">

          <div class="result-icon">
            ${relevance.icon}
          </div>

          <div class="result-relevance">
            <span class="result-label">
              Relevância operacional
            </span>

            <h2>
              ${escapeHtml(relevance.label)}
            </h2>
          </div>

          <div class="result-explanation">
            <h3>
              O que conseguimos organizar
            </h3>

            <p>
              ${escapeHtml(rationale)}
            </p>
          </div>

          ${
            attention.length
              ? `
                <div class="result-section">
                  <h3>Próximos pontos de atenção</h3>

                  <ul>
                    ${attention
                      .map(item =>
                        `<li>${escapeHtml(
                          typeof item === "string"
                            ? item
                            : item.label || item.text || ""
                        )}</li>`
                      )
                      .join("")}
                  </ul>
                </div>
              `
              : ""
          }

          ${
            documents.length
              ? `
                <div class="result-section">
                  <h3>Documentos que podem ajudar</h3>

                  <ul>
                    ${documents
                      .map(item =>
                        `<li>${escapeHtml(
                          typeof item === "string"
                            ? item
                            : item.label || item.name || ""
                        )}</li>`
                      )
                      .join("")}
                  </ul>
                </div>
              `
              : ""
          }

          ${
            ticket
              ? `
                <div class="ticket-box">
                  <span>Registro do atendimento</span>

                  <strong>
                    ${escapeHtml(ticket)}
                  </strong>
                </div>
              `
              : ""
          }

          <div class="result-disclaimer">
            <strong>Importante</strong>

            <p>
              Esta é uma triagem inicial.
              Ela não substitui a análise profissional,
              não confirma direito e não representa decisão
              sobre benefício ou questão trabalhista.
            </p>
          </div>

        </div>
      `;
    }


    katerinaSay(
      "Pronto. A triagem foi organizada. " +
      "Agora você sabe quais informações precisam ser conferidas " +
      "antes de qualquer decisão."
    );
  }


  function normalizeRelevance(result) {

    const value = String(
      result.relevance ||
      result.classification ||
      "precisa_avaliacao"
    ).toLowerCase();


    if (
      value.includes("alta") ||
      value === "alta_atencao"
    ) {
      return {
        key: "alta",
        label: "ALTA ATENÇÃO",
        icon: "🟢"
      };
    }


    if (
      value.includes("baixa") ||
      value === "baixa_prioridade"
    ) {
      return {
        key: "baixa",
        label: "BAIXA PRIORIDADE",
        icon: "🔴"
      };
    }


    return {
      key: "regular",
      label: "ATENÇÃO REGULAR",
      icon: "🟡"
    };
  }


  /* =======================================================
     PROGRESSO
     ======================================================= */

  function updateProgress(current, total) {

    if (el.progressText) {

      if (total <= 1) {
        el.progressText.textContent = "";
      } else {
        el.progressText.textContent =
          `Pergunta ${current} de ${total}`;
      }
    }


    if (el.progressBar) {

      const percent =
        total > 0
          ? Math.round((current / total) * 100)
          : 0;

      el.progressBar.style.width =
        `${percent}%`;

      el.progressBar.setAttribute(
        "aria-valuenow",
        String(percent)
      );
    }
  }


  /* =======================================================
     BOTÕES
     ======================================================= */

  function showBackButton() {

    if (!el.backButton) {
      return;
    }

    el.backButton.hidden = false;
    el.backButton.disabled = false;
  }


  function hideBackButton() {

    if (!el.backButton) {
      return;
    }

    el.backButton.hidden = true;
  }


  function disableNextButton() {

    if (!el.nextButton) {
      return;
    }

    el.nextButton.disabled = true;
  }


  function updateNextButton() {

    if (!el.nextButton) {
      return;
    }

    const question =
      state.questions[state.currentQuestion];

    if (!question) {
      return;
    }

    const value =
      getCurrentAnswer();

    const valid =
      !question.required ||
      (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      );

    el.nextButton.disabled = !valid;
    el.nextButton.textContent = "Continuar";

    el.nextButton.onclick =
      nextQuestion;
  }


  /* =======================================================
     VOLTAR
     ======================================================= */

  function goBack() {

    /*
     * Se estamos nas perguntas internas,
     * voltamos uma pergunta.
     */
    if (
      state.questions.length &&
      state.currentQuestion > 0
    ) {
      state.currentQuestion--;

      renderCurrentQuestion();

      return;
    }


    /*
     * Se estamos no contato, voltamos para a
     * última pergunta.
     */
    const contactField =
      document.getElementById("clientName");

    if (contactField) {

      if (state.questions.length) {

        state.currentQuestion =
          state.questions.length - 1;

        renderCurrentQuestion();

      } else {

        renderBenefitQuestion();
      }

      return;
    }


    /*
     * Se estamos escolhendo benefício,
     * voltamos para setor.
     */
    if (
      state.benefit ||
      state.sector
    ) {
      state.benefit = null;

      renderSectorQuestion();

      return;
    }


    showScreen("home");
  }


  /* =======================================================
     RESET
     ======================================================= */

  function resetTriage() {

    state.sector = null;
    state.benefit = null;

    state.questions = [];
    state.currentQuestion = 0;

    state.answers = {};

    state.name = "";
    state.phone = "";
    state.observation = "";

    state.consentDocuments = false;

    state.result = null;

    if (el.nextButton) {
      el.nextButton.textContent = "Continuar";
      el.nextButton.disabled = true;
    }
  }


  /* =======================================================
     NOVA TRIAGEM
     ======================================================= */

  function newTriage() {

    resetTriage();

    showScreen("home");

    katerinaSay(
      "Quando quiser, podemos começar novamente."
    );
  }


  /* =======================================================
     EVENTOS PRINCIPAIS
     ======================================================= */

  function installEvents() {

    if (el.startButton) {
      el.startButton.addEventListener(
        "click",
        startTriage
      );
    }


    if (el.backButton) {
      el.backButton.addEventListener(
        "click",
        goBack
      );
    }


    if (el.newTriageButton) {
      el.newTriageButton.addEventListener(
        "click",
        newTriage
      );
    }
  }


  /* =======================================================
     INICIALIZAÇÃO
     ======================================================= */

  async function init() {

    /*
     * Garante que o home comece visível.
     */
    showScreen("home");

    installEvents();

    await loadInitialData();

    /*
     * A Katerina já possui seu próprio init.
     * Aqui apenas damos uma pequena apresentação
     * quando ela estiver disponível.
     */
    setTimeout(() => {

      if (
        window.Katerina &&
        typeof window.Katerina.welcome === "function"
      ) {
        window.Katerina.welcome();
      }

    }, 700);
  }


  /* =======================================================
     EXPOSIÇÃO PARA DEBUG
     ======================================================= */

  window.PREV = {
    state,

    start: startTriage,
    reset: resetTriage,
    newTriage,

    load: loadInitialData
  };


  /* =======================================================
     START
     ======================================================= */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();
  }

})();
