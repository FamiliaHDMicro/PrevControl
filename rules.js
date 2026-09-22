// rules.js — PrevControl 2026
// Motor de triagem inicial atualizado
// Linguagem simples, sem juridiquês.
// IMPORTANTE: Este arquivo NÃO declara direito adquirido.
// Ele apenas identifica sinais para análise documental.
// As regras previdenciárias e trabalhistas mudam.
// Valores, prazos e requisitos devem ser revisados periodicamente.

const SECTORS = {
  previdencia: {
    key: "previdencia",
    label: "Previdência / INSS",
    description: "Aposentadoria, benefícios, doenças, CNIS e planejamento.",
    icon: "🏛️"
  },
  trabalhista: {
    key: "trabalhista",
    label: "Trabalho e Emprego",
    description: "Rescisão, FGTS, férias, salário e problemas no trabalho.",
    icon: "💼"
  },
  empresarial: {
    key: "empresarial",
    label: "Empresa / MEI",
    description: "Serviços para empresas, MEI e organização empresarial.",
    icon: "🏢"
  }
};

const BENEFITS = {

  // =========================================================
  // PREVIDÊNCIA / INSS
  // =========================================================

  aposentadoria_idade: {
    sector: "previdencia",
    label: "Aposentadoria por idade",
    description: "Quero saber quando posso me aposentar.",
    questions: [
      { id: "age", label: "Qual sua idade?", type: "number", unit: "anos", required: true },
      { id: "gender", label: "Você é homem ou mulher?", type: "choice", options: ["Homem", "Mulher"], required: true },
      { id: "contrib_years", label: "Quantos anos já contribuiu?", type: "number", unit: "anos", required: true }
    ],
    evaluate(answers) {
      const age = Number(answers.age);
      const contrib = Number(answers.contrib_years);
      const gender = answers.gender;
      const minAge = gender === "Mulher" ? 62 : 65;
      const minContrib = gender === "Mulher" ? 15 : 20;

      if (age >= minAge && contrib >= minContrib) {
        return { class: "indicador", rationale: "Você atingiu os requisitos mínimos de idade e contribuição. É necessário confirmar no CNIS e documentos." };
      }
      return { class: "precisa_avaliacao", rationale: "Ainda não atingiu os requisitos mínimos, mas pode haver regra de transição aplicável." };
    }
  },

  aposentadoria_rural: {
    sector: "previdencia",
    label: "Aposentadoria rural",
    description: "Trabalhei ou trabalho na roça, sítio, fazenda ou pesca.",
    questions: [
      { id: "age", label: "Qual sua idade?", type: "number", unit: "anos", required: true },
      { id: "gender", label: "Homem ou Mulher?", type: "choice", options: ["Homem", "Mulher"], required: true },
      { id: "rural_years", label: "Quantos anos trabalhou na atividade rural?", type: "number", unit: "anos", required: true }
    ],
    evaluate(answers) {
      const age = Number(answers.age);
      const ruralYears = Number(answers.rural_years);
      const gender = answers.gender;
      const minAge = gender === "Mulher" ? 55 : 60;

      if (age >= minAge && ruralYears >= 15) {
        return { class: "indicador", rationale: "Há indicadores que justificam análise específica. É necessário comprovar atividade rural e documentos." };
      }
      return { class: "precisa_avaliacao", rationale: "Pode existir outra regra ou aposentadoria híbrida a examinar." };
    }
  },

  bpc_loas: {
    sector: "previdencia",
    label: "BPC / LOAS",
    description: "Sou idoso ou tenho deficiência e preciso entender o benefício assistencial.",
    questions: [
      { id: "age", label: "Qual sua idade?", type: "number", unit: "anos", required: true },
      { id: "disability", label: "Existe deficiência ou impedimento de longo prazo?", type: "choice", options: ["Sim", "Não"], required: true },
      { id: "family", label: "Quantas pessoas vivem na mesma casa?", type: "number", unit: "pessoas", required: true },
      { id: "income", label: "Qual é a renda mensal total da família?", type: "number", unit: "reais", required: true }
    ],
    evaluate(answers) {
      const age = Number(answers.age);
      const disability = answers.disability === "Sim";
      const family = Number(answers.family);
      const income = Number(answers.income);
      const rendaPerCapita = family > 0 ? income / family : 0;

      if ((age >= 65 || disability) && rendaPerCapita <= 405.25) {
        return { class: "indicador", rationale: "Há requisitos iniciais para o BPC. É necessário confirmar CadÚnico e documentos." };
      }
      return { class: "precisa_avaliacao", rationale: "Os dados informados são apenas ponto de partida. Avaliação administrativa é necessária." };
    }
  },

  // =========================================================
  // TRABALHISTA
  // =========================================================

  rescisao: {
    sector: "trabalhista",
    label: "Rescisão / Saída do emprego",
    description: "Fui demitido, pedi demissão ou estou pensando em sair.",
    questions: [
      { id: "situation", label: "O que aconteceu?", type: "choice", options: ["Sem justa causa", "Por justa causa", "Pedi demissão", "Acordo"], required: true },
      { id: "worked_months", label: "Quanto tempo trabalhou na empresa?", type: "number", unit: "meses", required: true }
    ],
    evaluate() {
      return { class: "precisa_avaliacao", rationale: "Precisamos conferir Termo de Rescisão, FGTS, férias, 13º e aviso-prévio." };
    }
  },

  fgts: {
    sector: "trabalhista",
    label: "FGTS Digital",
    description: "Tenho dúvida sobre depósitos, saque ou valores do FGTS.",
    questions: [
      { id: "problem", label: "Qual é o problema?", type: "choice", options: ["Não estão depositando", "Valor errado", "Multa demissão"], required: true }
    ],
    evaluate() {
      return { class: "precisa_avaliacao", rationale: "O extrato do FGTS Digital é essencial para conferir depósitos e diferenças." };
    }
  },

  salario: {
    sector: "trabalhista",
    label: "Salário / Pagamento",
    description: "Meu salário está atrasado ou errado.",
    questions: [
      { id: "problem", label: "O que aconteceu?", type: "choice", options: ["Atrasado", "Valor diferente", "Desconto estranho"], required: true }
    ],
    evaluate() {
      return { class: "precisa_avaliacao", rationale: "Precisamos comparar contrato, holerites e comprovantes." };
    }
  }
};

export { SECTORS, BENEFITS };
