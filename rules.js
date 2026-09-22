/* =========================================================
   PREV — RULES.JS
   Motor de triagem previdenciária e trabalhista

   PRINCÍPIO:
   Primeiro entender.
   Depois conferir os documentos.
   Só então tomar uma decisão.

   Este arquivo NÃO decide direito.
   Este arquivo organiza informações para análise.
   ========================================================= */

"use strict";


/* =========================================================
   VERSÃO DAS REGRAS
   ========================================================= */

const RULE_VERSION = "2026.09.01";


/* =========================================================
   SETORES
   ========================================================= */

const SECTORS = {

  previdencia: {
    key: "previdencia",

    label: "Previdenciário",

    description:
      "INSS, aposentadoria, benefícios, CNIS e planejamento.",

    icon: "🏛️"
  },


  trabalhista: {
    key: "trabalhista",

    label: "Trabalhista",

    description:
      "Rescisão, FGTS, férias, salário e situações no trabalho.",

    icon: "💼"
  }

};


/* =========================================================
   NÍVEIS DE RELEVÂNCIA OPERACIONAL
   =========================================================

   ATENÇÃO:
   Estes níveis NÃO representam direito jurídico.

   Servem apenas para ajudar o escritório a organizar
   a fila de atendimento.
   ========================================================= */

const RELEVANCE = {

  ALTA: {
    key: "alta_atencao",
    label: "ALTA ATENÇÃO",
    icon: "🟢"
  },

  REGULAR: {
    key: "atencao_regular",
    label: "ATENÇÃO REGULAR",
    icon: "🟡"
  },

  BAIXA: {
    key: "baixa_prioridade",
    label: "BAIXA PRIORIDADE",
    icon: "🔴"
  }

};


/* =========================================================
   HELPERS
   ========================================================= */

function clean(value) {

  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}


function answer(answers, key) {
  return clean(answers?.[key]);
}


function hasAnswer(answers, key) {
  return answer(answers, key) !== "";
}


function unique(list) {
  return [...new Set(
    (list || []).filter(Boolean)
  )];
}


/* =========================================================
   DOCUMENTOS
   ========================================================= */

const DOCUMENTS = {

  aposentadoria: [
    "Documento de identificação",
    "CNIS",
    "Carteira de Trabalho",
    "Comprovantes de contribuição, quando disponíveis",
    "Documentos referentes a períodos que não aparecem no CNIS"
  ],


  cnis: [
    "CNIS",
    "Carteira de Trabalho",
    "Contratos de trabalho, quando disponíveis",
    "Contracheques ou comprovantes de pagamento",
    "Carnês de contribuição, quando houver",
    "Documentos que comprovem períodos divergentes"
  ],


  bpc: [
    "Documento de identificação",
    "CPF",
    "CadÚnico, quando disponível",
    "Documentos do grupo familiar",
    "Comprovantes de renda",
    "Comprovantes de despesas relevantes",
    "Documentos relacionados à deficiência, quando aplicável"
  ],


  incapacidade: [
    "Documento de identificação",
    "CNIS",
    "Documentos médicos",
    "Laudos e relatórios médicos, quando disponíveis",
    "Exames relacionados ao caso",
    "Documentos de benefício ou perícia, quando houver"
  ],


  pensao: [
    "Documento de identificação",
    "Documentos que comprovem a relação com a pessoa falecida",
    "Certidão de óbito",
    "Documentos relacionados à condição previdenciária do falecido",
    "Documentos dos dependentes, quando aplicável"
  ],


  revisao: [
    "Documento de identificação",
    "Carta de concessão, quando disponível",
    "Extrato do benefício",
    "CNIS",
    "Processo ou documentos administrativos, quando disponíveis"
  ],


  rescisao: [
    "Carteira de Trabalho",
    "TRCT",
    "Comprovantes de pagamento",
    "Extrato do FGTS",
    "Aviso-prévio ou documento equivalente",
    "Documentos de férias, quando relacionados",
    "Contracheques"
  ],


  fgts: [
    "Documento de identificação",
    "Extrato do FGTS",
    "Carteira de Trabalho",
    "Comprovantes de vínculo",
    "Documentos da rescisão, quando relacionados"
  ],


  ferias: [
    "Carteira de Trabalho",
    "Contracheques",
    "Avisos ou recibos de férias",
    "Comprovantes de pagamento",
    "Contrato de trabalho, quando disponível"
  ],


  decimo_terceiro: [
    "Contracheques",
    "Carteira de Trabalho",
    "Comprovantes de pagamento",
    "Documentos de afastamento, quando relacionados"
  ],


  horas_extras: [
    "Registros de ponto",
    "Contracheques",
    "Escalas de trabalho",
    "Comprovantes ou registros de jornada",
    "Mensagens ou documentos relacionados à jornada, quando pertinentes"
  ],


  justa_causa: [
    "Carteira de Trabalho",
    "Documento da rescisão",
    "Comunicado da justa causa, quando disponível",
    "Advertências ou suspensões, quando houver",
    "Mensagens ou documentos relacionados ao fato"
  ],


  geral_trabalhista: [
    "Carteira de Trabalho",
    "Contracheques",
    "Contrato de trabalho",
    "Documentos relacionados ao problema apresentado"
  ]

};


/* =========================================================
   EDUCAÇÃO
   ========================================================= */

const EDUCATION = {

  base: [
    "A triagem organiza informações; não substitui análise profissional.",
    "Documentos podem confirmar ou alterar a compreensão inicial do caso.",
    "Se uma informação não for conhecida, ela pode ser informada como 'não sei'."
  ],


  previdencia: [
    "Informações do CNIS podem precisar ser conferidas com outros documentos.",
    "Períodos de trabalho ou contribuição podem exigir comprovação documental.",
    "A análise previdenciária depende das informações e das regras aplicáveis ao caso."
  ],


  trabalhista: [
    "Documentos e registros do trabalho ajudam a conferir o que aconteceu.",
    "Datas, pagamentos, jornada e documentos da empresa podem ser importantes.",
    "Uma situação trabalhista deve ser analisada considerando os documentos disponíveis."
  ]

};


/* =========================================================
   PERGUNTAS — PREVIDENCIÁRIO
   ========================================================= */

const PREVIDENCIA_BENEFITS = {

  aposentadoria_idade: {

    key: "aposentadoria_idade",

    sector: "previdencia",

    label: "Aposentadoria",

    description:
      "Quero entender minha situação para aposentadoria.",

    icon: "🧓",

    questions: [

      {
        key: "idade",

        label: "Qual é a sua idade?",

        type: "number",

        required: false
      },

      {
        key: "sexo",

        label: "Como consta seu sexo nos documentos previdenciários?",

        type: "choice",

        required: false,

        options: [
          {
            value: "feminino",
            label: "Feminino"
          },
          {
            value: "masculino",
            label: "Masculino"
          },
          {
            value: "nao_informar",
            label: "Prefiro não informar"
          },
          {
            value: "nao_sei",
            label: "Não sei"
          }
        ]
      },

      {
        key: "tempo_contribuicao",

        label:
          "Você sabe aproximadamente quanto tempo já contribuiu?",

        type: "text",

        required: false,

        placeholder:
          "Ex.: aproximadamente 25 anos"
      },

      {
        key: "cnis",

        label:
          "Você já conferiu o seu CNIS?",

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
        key: "periodos_ausentes",

        label:
          "Existe algum período de trabalho ou contribuição que não aparece no CNIS?",

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

    ],

    documents: DOCUMENTS.aposentadoria,

    education: [
      "A idade e o tempo informado na triagem são apenas dados iniciais.",
      "O histórico de contribuições precisa ser conferido nos documentos.",
      "Períodos ausentes ou divergentes podem precisar de comprovação."
    ],

    relevance(answers) {

      let score = 0;

      if (hasAnswer(answers, "periodos_ausentes")) {
        if (answer(answers, "periodos_ausentes") === "sim") {
          score += 2;
        }
      }

      if (
        answer(answers, "cnis") === "nao" ||
        answer(answers, "cnis") === "nao_sei"
      ) {
        score += 1;
      }

      if (score >= 2) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (answer(answers, "periodos_ausentes") === "sim") {
        attention.push(
          "Há período que pode precisar de conferência documental."
        );
      }

      if (answer(answers, "cnis") !== "sim") {
        attention.push(
          "O CNIS ainda precisa ser conferido."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação de aposentadoria precisa ser conferida com o histórico contributivo e os documentos disponíveis.",
        attention,
        documents: DOCUMENTS.aposentadoria
      };
    }
  },


  acerto_cnis: {

    key: "acerto_cnis",

    sector: "previdencia",

    label: "Acerto de CNIS",

    description:
      "Há algum erro ou período que não aparece no CNIS.",

    icon: "📄",

    questions: [

      {
        key: "problema_cnis",

        label:
          "O que você percebeu de errado no CNIS?",

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
            value: "rural",
            label: "Há período rural"
          },
          {
            value: "especial",
            label: "Há período de atividade especial"
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

        label:
          "Você possui documentos que possam ajudar a comprovar o período?",

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

    ],

    documents: DOCUMENTS.cnis,

    education: [
      "O CNIS é uma fonte importante, mas divergências podem exigir outros documentos.",
      "Carteira de Trabalho, contracheques e comprovantes podem ajudar na conferência."
    ],

    relevance(answers) {

      if (
        answer(answers, "problema_cnis") === "vinculo_ausente" ||
        answer(answers, "problema_cnis") === "contribuicao" ||
        answer(answers, "problema_cnis") === "especial" ||
        answer(answers, "problema_cnis") === "rural"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (hasAnswer(answers, "problema_cnis")) {
        attention.push(
          "Identificar exatamente qual informação do CNIS apresenta divergência."
        );
      }

      if (answer(answers, "provas") !== "sim") {
        attention.push(
          "Verificar quais documentos podem comprovar a informação."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "Foi identificada uma possível divergência no CNIS que precisa ser conferida com documentos.",
        attention,
        documents: DOCUMENTS.cnis
      };
    }
  },


  bpc_loas: {

    key: "bpc_loas",

    sector: "previdencia",

    label: "BPC / LOAS",

    description:
      "Quero entender uma situação relacionada ao BPC.",

    icon: "🤝",

    questions: [

      {
        key: "idade",

        label:
          "Qual é a idade da pessoa envolvida?",

        type: "number",

        required: false
      },

      {
        key: "situacao",

        label:
          "A situação envolve idade ou deficiência?",

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

        label:
          "Existe CadÚnico?",

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
        key: "renda_familiar",

        label:
          "Você sabe informar aproximadamente a renda das pessoas da família?",

        type: "text",

        required: false,

        placeholder:
          "Se não souber, pode escrever 'não sei'."
      }

    ],

    documents: DOCUMENTS.bpc,

    education: [
      "A análise do BPC depende de informações pessoais, familiares e documentais.",
      "A renda é apenas uma parte da análise socioeconômica.",
      "Documentos e informações do grupo familiar precisam ser conferidos."
    ],

    relevance(answers) {

      if (
        answer(answers, "situacao") === "deficiencia"
      ) {
        return RELEVANCE.ALTA;
      }

      if (
        answer(answers, "cadunico") !== "sim"
      ) {
        return RELEVANCE.REGULAR;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "cadunico") !== "sim"
      ) {
        attention.push(
          "Conferir a situação do CadÚnico."
        );
      }

      if (
        answer(answers, "renda_familiar") === ""
      ) {
        attention.push(
          "Verificar a composição e a situação econômica familiar."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação precisa ser analisada considerando a composição familiar, a documentação e as demais informações necessárias.",
        attention,
        documents: DOCUMENTS.bpc
      };
    }
  },


  incapacidade: {

    key: "incapacidade",

    sector: "previdencia",

    label: "Incapacidade",

    description:
      "Estou ou estive afastado por problema de saúde.",

    icon: "🩺",

    questions: [

      {
        key: "afastado",

        label:
          "Você está ou esteve afastado do trabalho?",

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

        label:
          "Você possui documentos médicos relacionados ao caso?",

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

        label:
          "Já houve algum pedido ou benefício do INSS relacionado a isso?",

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

    ],

    documents: DOCUMENTS.incapacidade,

    education: [
      "A triagem não determina incapacidade.",
      "Documentos médicos devem ser avaliados no contexto do caso.",
      "Pedidos, perícias e benefícios anteriores podem ser relevantes para a análise."
    ],

    relevance(answers) {

      if (
        answer(answers, "afastado") === "sim" ||
        answer(answers, "beneficio_anterior") === "sim"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "documento_medico") !== "sim"
      ) {
        attention.push(
          "Verificar quais documentos médicos estão disponíveis."
        );
      }

      if (
        answer(answers, "beneficio_anterior") === "sim"
      ) {
        attention.push(
          "Conferir documentos relacionados ao pedido ou benefício anterior."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação relacionada à incapacidade precisa ser analisada com os documentos disponíveis.",
        attention,
        documents: DOCUMENTS.incapacidade
      };
    }
  },


  pensao_morte: {

    key: "pensao_morte",

    sector: "previdencia",

    label: "Pensão por morte",

    description:
      "Quero entender uma situação de pensão.",

    icon: "🕊️",

    questions: [

      {
        key: "relacao",

        label:
          "Qual era a relação com a pessoa falecida?",

        type: "text",

        required: false,

        placeholder:
          "Ex.: cônjuge, filho, companheiro..."
      },

      {
        key: "beneficio_falecido",

        label:
          "A pessoa falecida recebia algum benefício?",

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

        label:
          "Você possui documentos relacionados ao caso?",

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

    ],

    documents: DOCUMENTS.pensao,

    education: [
      "A situação precisa considerar a relação com a pessoa falecida e os documentos disponíveis.",
      "A condição previdenciária existente na data do falecimento pode ser relevante."
    ],

    relevance(answers) {

      if (
        answer(answers, "beneficio_falecido") === "nao_sei"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "documentos") !== "sim"
      ) {
        attention.push(
          "Verificar os documentos que comprovam a relação e a situação previdenciária."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação de pensão precisa ser conferida considerando a relação, os documentos e a situação previdenciária existente no caso.",
        attention,
        documents: DOCUMENTS.pensao
      };
    }
  },


  revisao_beneficio: {

    key: "revisao_beneficio",

    sector: "previdencia",

    label: "Revisão de benefício",

    description:
      "Quero conferir um benefício que já recebo.",

    icon: "🔎",

    questions: [

      {
        key: "beneficio",

        label:
          "Qual benefício você recebe?",

        type: "text",

        required: false,

        placeholder:
          "Ex.: aposentadoria, pensão..."
      },

      {
        key: "documento_beneficio",

        label:
          "Você possui a carta de concessão ou outro documento do benefício?",

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

    ],

    documents: DOCUMENTS.revisao,

    education: [
      "Uma revisão precisa ser conferida com os documentos do benefício.",
      "A existência de uma diferença percebida não significa, sozinha, que exista uma revisão aplicável."
    ],

    relevance(answers) {

      if (
        answer(answers, "documento_beneficio") === "sim"
      ) {
        return RELEVANCE.REGULAR;
      }

      return RELEVANCE.ALTA;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "documento_beneficio") !== "sim"
      ) {
        attention.push(
          "Localizar a documentação do benefício para análise."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A possibilidade de revisão precisa ser conferida nos documentos do benefício e no histórico correspondente.",
        attention,
        documents: DOCUMENTS.revisao
      };
    }
  }

};


/* =========================================================
   PERGUNTAS — TRABALHISTA
   ========================================================= */

const TRABALHISTA_BENEFITS = {

  rescisao: {

    key: "rescisao",

    sector: "trabalhista",

    label: "Rescisão",

    description:
      "Fui demitido, pedi demissão ou estou saindo.",

    icon: "📋",

    questions: [

      {
        key: "situacao",

        label:
          "O que aconteceu com o trabalho?",

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

        label:
          "Há quanto tempo aproximadamente você trabalhava lá?",

        type: "text",

        required: false,

        placeholder:
          "Ex.: 2 anos e 4 meses"
      },

      {
        key: "documentos_rescisao",

        label:
          "Você tem algum documento da rescisão?",

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
        key: "fgts",

        label:
          "Você tem acesso ao extrato do FGTS?",

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

    ],

    documents: DOCUMENTS.rescisao,

    education: [
      "A conferência da rescisão depende dos documentos e das datas envolvidas.",
      "TRCT, carteira de trabalho, contracheques e FGTS podem ser importantes para a conferência."
    ],

    relevance(answers) {

      if (
        answer(answers, "situacao") === "demitido" &&
        answer(answers, "documentos_rescisao") !== "sim"
      ) {
        return RELEVANCE.ALTA;
      }

      if (
        answer(answers, "fgts") === "nao"
      ) {
        return RELEVANCE.REGULAR;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "documentos_rescisao") !== "sim"
      ) {
        attention.push(
          "Localizar os documentos da rescisão."
        );
      }

      if (
        answer(answers, "fgts") !== "sim"
      ) {
        attention.push(
          "Conferir o extrato do FGTS."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A rescisão precisa ser conferida considerando o motivo do encerramento, datas, pagamentos e documentos.",
        attention,
        documents: DOCUMENTS.rescisao
      };
    }
  },


  fgts: {

    key: "fgts",

    sector: "trabalhista",

    label: "FGTS",

    description:
      "Quero conferir depósitos ou saldo.",

    icon: "💰",

    questions: [

      {
        key: "extrato_fgts",

        label:
          "Você tem o extrato do FGTS?",

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

        label:
          "O que parece estar acontecendo?",

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
            value: "rescisao",
            label: "É relacionado à rescisão"
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

    ],

    documents: DOCUMENTS.fgts,

    education: [
      "O extrato do FGTS é importante para conferir os depósitos.",
      "Diferenças precisam ser comparadas com os períodos de trabalho e documentos disponíveis."
    ],

    relevance(answers) {

      if (
        answer(answers, "problema_fgts") === "depositos_ausentes"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "extrato_fgts") !== "sim"
      ) {
        attention.push(
          "Obter o extrato do FGTS para conferência."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação do FGTS precisa ser conferida com o extrato e os documentos do vínculo de trabalho.",
        attention,
        documents: DOCUMENTS.fgts
      };
    }
  },


  ferias: {

    key: "ferias",

    sector: "trabalhista",

    label: "Férias",

    description:
      "Tenho dúvidas sobre férias.",

    icon: "🏖️",

    questions: [

      {
        key: "ferias_gozadas",

        label:
          "Você chegou a tirar essas férias?",

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

        label:
          "O pagamento das férias foi feito?",

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

    ],

    documents: DOCUMENTS.ferias,

    education: [
      "Datas, períodos e comprovantes ajudam a conferir as férias.",
      "Os documentos devem ser analisados antes de qualquer conclusão."
    ],

    relevance(answers) {

      if (
        answer(answers, "pagamento_ferias") === "nao"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "pagamento_ferias") === "nao"
      ) {
        attention.push(
          "Conferir os comprovantes relacionados ao pagamento das férias."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação das férias precisa ser conferida com as datas, pagamentos e documentos disponíveis.",
        attention,
        documents: DOCUMENTS.ferias
      };
    }
  },


  decimo_terceiro: {

    key: "decimo_terceiro",

    sector: "trabalhista",

    label: "13º salário",

    description:
      "Quero conferir o pagamento do 13º.",

    icon: "📅",

    questions: [

      {
        key: "pagamento",

        label:
          "O 13º foi pago?",

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
            label: "Foi pago apenas parcialmente"
          },
          {
            value: "nao_sei",
            label: "Não sei"
          }
        ]
      },

      {
        key: "contracheque",

        label:
          "Você possui os contracheques?",

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

    ],

    documents: DOCUMENTS.decimo_terceiro,

    education: [
      "O pagamento deve ser conferido com os períodos trabalhados e documentos disponíveis."
    ],

    relevance(answers) {

      if (
        answer(answers, "pagamento") === "nao" ||
        answer(answers, "pagamento") === "parcial"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "pagamento") !== "sim"
      ) {
        attention.push(
          "Conferir os pagamentos e os contracheques."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação do 13º precisa ser conferida com os pagamentos e documentos do vínculo.",
        attention,
        documents: DOCUMENTS.decimo_terceiro
      };
    }
  },


  horas_extras: {

    key: "horas_extras",

    sector: "trabalhista",

    label: "Horas extras",

    description:
      "Quero organizar uma situação de jornada.",

    icon: "⏱️",

    questions: [

      {
        key: "jornada",

        label:
          "Você tinha horário ou controle de ponto?",

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

        label:
          "As horas extras eram pagas?",

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
      },

      {
        key: "registros",

        label:
          "Você possui registros de jornada?",

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

    ],

    documents: DOCUMENTS.horas_extras,

    education: [
      "Registros de jornada podem ser importantes para conferir a situação.",
      "Contracheques e registros de ponto devem ser comparados."
    ],

    relevance(answers) {

      if (
        answer(answers, "pagamento_horas") === "nao" ||
        answer(answers, "pagamento_horas") === "parcial"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "registros") !== "sim"
      ) {
        attention.push(
          "Verificar se existem registros de jornada disponíveis."
        );
      }

      if (
        answer(answers, "pagamento_horas") !== "sim"
      ) {
        attention.push(
          "Conferir os pagamentos relacionados à jornada."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação da jornada precisa ser conferida com os registros e documentos disponíveis.",
        attention,
        documents: DOCUMENTS.horas_extras
      };
    }
  },


  justa_causa: {

    key: "justa_causa",

    sector: "trabalhista",

    label: "Justa causa",

    description:
      "Recebi ou estou diante de uma justa causa.",

    icon: "⚠️",

    questions: [

      {
        key: "motivo",

        label:
          "Foi informado qual seria o motivo da justa causa?",

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
        key: "documento",

        label:
          "Você recebeu algum documento relacionado à justa causa?",

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
        key: "advertencias",

        label:
          "Existiram advertências ou suspensões anteriores?",

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

    ],

    documents: DOCUMENTS.justa_causa,

    education: [
      "A existência de justa causa precisa ser analisada conforme os fatos e documentos.",
      "A triagem não determina, sozinha, se a medida foi correta ou incorreta.",
      "Documentos, datas e registros relacionados ao fato podem ser importantes."
    ],

    relevance(answers) {

      if (
        answer(answers, "documento") !== "sim" ||
        answer(answers, "motivo") !== "sim"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "motivo") !== "sim"
      ) {
        attention.push(
          "Identificar e documentar o motivo informado para a medida."
        );
      }

      if (
        answer(answers, "documento") !== "sim"
      ) {
        attention.push(
          "Verificar se existe documento relacionado à justa causa."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação precisa ser analisada com os fatos, datas e documentos relacionados à medida aplicada.",
        attention,
        documents: DOCUMENTS.justa_causa
      };
    }
  },


  acidente_trabalho: {

    key: "acidente_trabalho",

    sector: "trabalhista",

    label: "Acidente de trabalho",

    description:
      "Houve acidente ou situação relacionada ao trabalho.",

    icon: "🦺",

    questions: [

      {
        key: "ocorreu_trabalho",

        label:
          "O acidente ou fato ocorreu durante o trabalho?",

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
        key: "atendimento_medico",

        label:
          "Houve atendimento médico?",

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
        key: "cat",

        label:
          "Você sabe se houve emissão de CAT?",

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

    ],

    documents: [
      ...DOCUMENTS.geral_trabalhista,
      "Documentos médicos",
      "CAT, quando houver",
      "Documentos relacionados ao acidente"
    ],

    education: [
      "Documentos médicos e registros do acidente podem ser importantes.",
      "A situação deve ser analisada considerando os fatos e documentos disponíveis."
    ],

    relevance(answers) {

      if (
        answer(answers, "ocorreu_trabalho") === "sim"
      ) {
        return RELEVANCE.ALTA;
      }

      return RELEVANCE.REGULAR;
    },

    evaluate(answers) {

      const attention = [];

      if (
        answer(answers, "atendimento_medico") === "sim"
      ) {
        attention.push(
          "Conferir os documentos médicos relacionados ao acidente."
        );
      }

      if (
        answer(answers, "cat") !== "sim"
      ) {
        attention.push(
          "Verificar a existência de registro relacionado ao acidente."
        );
      }

      return {
        classification: "precisa_avaliacao",
        rationale:
          "A situação precisa ser organizada e conferida com os documentos relacionados ao acidente.",
        attention,
        documents: [
          ...DOCUMENTS.geral_trabalhista,
          "Documentos médicos",
          "CAT, quando houver",
          "Documentos relacionados ao acidente"
        ]
      };
    }
  }

};


/* =========================================================
   AGRUPAMENTO DOS BENEFÍCIOS
   ========================================================= */

const BENEFITS = {

  ...PREVIDENCIA_BENEFITS,

  ...TRABALHISTA_BENEFITS

};


/* =========================================================
   FUNÇÕES PÚBLICAS
   ========================================================= */

function getSectorConfig(key) {

  return SECTORS[key] || null;
}


function getAllSectors() {

  return Object.values(SECTORS);
}


function getBenefitConfig(key) {

  return BENEFITS[key] || null;
}


function getAllBenefits() {

  return Object.values(BENEFITS);
}


function getBenefitsBySector(sector) {

  return Object.values(BENEFITS)
    .filter(
      benefit => benefit.sector === sector
    );
}


/* =========================================================
   RELEVÂNCIA
   ========================================================= */

function calculateRelevance(
  benefit,
  answers
) {

  if (
    !benefit ||
    typeof benefit.relevance !== "function"
  ) {
    return RELEVANCE.REGULAR;
  }

  return benefit.relevance(
    answers || {}
  );
}


/* =========================================================
   DOCUMENTOS
   ========================================================= */

function getDocuments(
  benefit,
  answers
) {

  if (!benefit) {
    return [];
  }

  if (
    typeof benefit.documents === "function"
  ) {
    return unique(
      benefit.documents(
        answers || {}
      )
    );
  }

  return unique(
    benefit.documents || []
  );
}


/* =========================================================
   EDUCAÇÃO
   ========================================================= */

function getEducation(
  sector,
  benefit
) {

  const result = [
    ...EDUCATION.base
  ];


  if (
    sector &&
    EDUCATION[sector]
  ) {
    result.push(
      ...EDUCATION[sector]
    );
  }


  if (
    benefit?.education
  ) {
    result.push(
      ...benefit.education
    );
  }


  return unique(result);
}


/* =========================================================
   EXECUTA A TRIAGEM
   ========================================================= */

function runTriagem(
  benefitType,
  answers = {}
) {

  const benefit =
    getBenefitConfig(
      benefitType
    );


  /*
   * Não conhecemos o assunto.
   * Não vamos inventar uma conclusão.
   */
  if (!benefit) {

    return {

      classification:
        "precisa_avaliacao",

      relevance:
        RELEVANCE.REGULAR.key,

      relevance_label:
        RELEVANCE.REGULAR.label,

      rationale:
        "Não foi possível classificar completamente o assunto com as informações disponíveis. É necessária análise documental.",

      flags: [
        "Assunto ainda não classificado."
      ],

      attention: [
        "Organizar a descrição do caso.",
        "Identificar os documentos disponíveis.",
        "Encaminhar para análise profissional."
      ],

      documents: [],

      education:
        getEducation(
          null,
          null
        ),

      ruleVersion:
        RULE_VERSION
    };
  }


  let evaluation = {};


  if (
    typeof benefit.evaluate === "function"
  ) {

    evaluation =
      benefit.evaluate(
        answers
      ) || {};
  }


  const relevance =
    calculateRelevance(
      benefit,
      answers
    );


  const documents =
    getDocuments(
      benefit,
      answers
    );


  const education =
    getEducation(
      benefit.sector,
      benefit
    );


  const attention =
    unique([
      ...(evaluation.attention || []),
      ...(evaluation.flags || [])
    ]);


  return {

    classification:
      evaluation.classification ||
      "precisa_avaliacao",


    relevance:
      relevance.key,


    relevance_label:
      relevance.label,


    relevance_icon:
      relevance.icon,


    rationale:
      evaluation.rationale ||
      "Necessita análise documental.",


    flags:
      unique(
        evaluation.flags || []
      ),


    attention,


    documents,


    education,


    sector:
      benefit.sector,


    benefit:
      benefit.key,


    benefit_label:
      benefit.label,


    ruleVersion:
      RULE_VERSION
  };
}


/* =========================================================
   EXPORTAÇÃO
   =========================================================

   Compatível com Cloudflare Worker usando:

   import {
     getAllSectors,
     getAllBenefits,
     getBenefitsBySector,
     runTriagem
   } from "./rules.js";
   ========================================================= */

export {

  RULE_VERSION,

  SECTORS,

  BENEFITS,

  RELEVANCE,

  getSectorConfig,

  getAllSectors,

  getBenefitConfig,

  getAllBenefits,

  getBenefitsBySector,

  calculateRelevance,

  getDocuments,

  getEducation,

  runTriagem

};
