// rules.js — PrevControl
// Motor de triagem inicial
// Linguagem simples, sem juridiquês.
//
// IMPORTANTE:
// Este arquivo NÃO declara direito adquirido.
// Ele apenas identifica sinais para uma análise documental.
//
// As regras previdenciárias e trabalhistas mudam.
// Informações como valores, prazos e requisitos devem ser
// revisadas periodicamente com base em fontes oficiais.

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
    label: "Aposentadoria",
    description: "Quero saber quando posso me aposentar.",
    questions: [
      {
        id: "age",
        label: "Qual sua idade?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "gender",
        label: "Você é homem ou mulher?",
        type: "choice",
        options: ["Homem", "Mulher"],
        required: true
      },
      {
        id: "contrib_years",
        label: "Aproximadamente quantos anos você já contribuiu?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "cnis",
        label: "Você já conferiu seu CNIS?",
        type: "choice",
        options: [
          "Sim, está tudo certo",
          "Sim, mas encontrei problemas",
          "Nunca conferi",
          "Não sei o que é CNIS"
        ],
        required: true
      }
    ],

    evaluate(answers) {
      const age = Number(answers.age);
      const contrib = Number(answers.contrib_years);
      const gender = answers.gender;

      if (!age || !contrib) {
        return {
          class: "precisa_avaliacao",
          rationale: "Precisamos conferir sua idade, seu tempo de contribuição e seus registros no CNIS."
        };
      }

      const idadeBase = gender === "Mulher" ? 62 : 65;
      const tempoBase = gender === "Mulher" ? 15 : 20;

      if (age >= idadeBase && contrib >= tempoBase) {
        return {
          class: "provavel_analise",
          rationale:
            `Você já está na faixa de idade e tempo que merece uma conferência mais detalhada. ` +
            `Isso não confirma automaticamente a aposentadoria: precisamos conferir o CNIS, a carência, os períodos trabalhados e possíveis regras de transição.`
        };
      }

      if (age >= idadeBase - 3 || contrib >= tempoBase - 3) {
        return {
          class: "planejamento",
          rationale:
            "Você está relativamente perto dos requisitos básicos. Vale conferir seu histórico agora para descobrir qual regra pode se encaixar no seu caso e evitar perda de tempo."
        };
      }

      return {
        class: "planejamento",
        rationale:
          "Ainda pode faltar tempo ou idade, mas isso não significa que não exista algo para fazer. Uma conferência antecipada pode ajudar a organizar seu histórico e planejar os próximos passos."
      };
    }
  },

  aposentadoria_rural: {
    sector: "previdencia",
    label: "Aposentadoria rural",
    description: "Trabalhei ou trabalho na roça, sítio, fazenda ou pesca.",
    questions: [
      {
        id: "age",
        label: "Qual sua idade?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "rural_years",
        label: "Por aproximadamente quantos anos você trabalhou na atividade rural?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "proof",
        label: "Você tem documentos que mostram sua atividade rural?",
        type: "choice",
        options: [
          "Sim, tenho vários documentos",
          "Tenho alguns",
          "Não tenho",
          "Não sei quais documentos servem"
        ],
        required: true
      }
    ],

    evaluate(answers) {
      const age = Number(answers.age);
      const ruralYears = Number(answers.rural_years);

      if (age >= 55 && ruralYears >= 15) {
        return {
          class: "provavel_analise",
          rationale:
            "Sua situação merece uma análise previdenciária específica para atividade rural. Os documentos que comprovam o trabalho rural serão muito importantes."
        };
      }

      return {
        class: "precisa_avaliacao",
        rationale:
          "A aposentadoria rural tem regras próprias. Precisamos olhar idade, período rural e os documentos que comprovam essa atividade."
      };
    }
  },

  aposentadoria_especial: {
    sector: "previdencia",
    label: "Aposentadoria especial",
    description: "Trabalhei exposto a ruído, produtos químicos, agentes perigosos ou outros riscos.",
    questions: [
      {
        id: "exposure",
        label: "Você trabalhava exposto a algum risco no trabalho?",
        type: "choice",
        options: [
          "Ruído",
          "Produtos químicos",
          "Calor ou agentes físicos",
          "Agentes biológicos",
          "Outro risco",
          "Não sei informar"
        ],
        required: true
      },
      {
        id: "years",
        label: "Aproximadamente quantos anos trabalhou nessa condição?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "ppp",
        label: "Você tem PPP ou documento semelhante?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei o que é PPP"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "A aposentadoria especial depende da comprovação da exposição a agentes prejudiciais. O PPP e outros documentos do trabalho precisam ser conferidos antes de qualquer conclusão."
      };
    }
  },

  aposentadoria_pcd: {
    sector: "previdencia",
    label: "Aposentadoria da pessoa com deficiência",
    description: "Tenho deficiência e quero saber quais regras podem se aplicar.",
    questions: [
      {
        id: "age",
        label: "Qual sua idade?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "contrib_years",
        label: "Aproximadamente quantos anos você contribuiu?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "disability_time",
        label: "A deficiência já existia durante parte do período de contribuição?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei informar"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "A aposentadoria da pessoa com deficiência possui regras próprias e pode envolver avaliação médica e funcional. Precisamos conferir seu histórico e o período em que a deficiência existiu."
      };
    }
  },

  incapacidade_temporaria: {
    sector: "previdencia",
    label: "Doença ou incapacidade para trabalhar",
    description: "Estou doente ou machucado e não consigo trabalhar normalmente.",
    questions: [
      {
        id: "days",
        label: "Há quanto tempo você está sem conseguir trabalhar?",
        type: "number",
        unit: "dias",
        required: true
      },
      {
        id: "cause",
        label: "O que aconteceu?",
        type: "choice",
        options: [
          "Doença",
          "Acidente fora do trabalho",
          "Acidente no trabalho",
          "Doença relacionada ao trabalho",
          "Ainda não sei"
        ],
        required: true
      },
      {
        id: "documents",
        label: "Você tem atestado ou exames?",
        type: "choice",
        options: [
          "Sim",
          "Tenho alguns",
          "Não"
        ],
        required: true
      }
    ],

    evaluate(answers) {
      const days = Number(answers.days);

      if (days > 15) {
        return {
          class: "provavel_analise",
          rationale:
            "Como a incapacidade já passa de 15 dias, sua situação merece conferência previdenciária. É importante reunir atestados, exames e documentos do trabalho."
        };
      }

      return {
        class: "precisa_avaliacao",
        rationale:
          "Ainda precisamos entender a duração da incapacidade, a causa e seus documentos médicos para saber qual caminho pode ser adequado."
      };
    }
  },

  incapacidade_permanente: {
    sector: "previdencia",
    label: "Incapacidade permanente",
    description: "Minha condição de saúde pode me impedir de trabalhar de forma permanente.",
    questions: [
      {
        id: "condition",
        label: "Você possui doença ou condição que impede o trabalho?",
        type: "choice",
        options: [
          "Sim",
          "Ainda estou investigando",
          "Não sei informar"
        ],
        required: true
      },
      {
        id: "medical_docs",
        label: "Você possui exames e laudos?",
        type: "choice",
        options: [
          "Sim",
          "Alguns",
          "Não"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Esse tipo de situação depende da avaliação da incapacidade e dos documentos médicos. Não devemos afirmar o direito apenas com perguntas de formulário."
      };
    }
  },

  salario_maternidade: {
    sector: "previdencia",
    label: "Salário-maternidade",
    description: "Estou grávida, tive filho, adoção ou situação relacionada.",
    questions: [
      {
        id: "situation",
        label: "Qual situação aconteceu?",
        type: "choice",
        options: [
          "Nascimento",
          "Adoção",
          "Aborto não criminoso",
          "Ainda estou grávida"
        ],
        required: true
      },
      {
        id: "insured",
        label: "Você estava contribuindo para o INSS ou tinha vínculo de trabalho?",
        type: "choice",
        options: [
          "Sim",
          "Não sei",
          "Não"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "O salário-maternidade depende da situação da segurada e da qualidade de segurada. Precisamos conferir os vínculos e os documentos."
      };
    }
  },

  pensao_morte: {
    sector: "previdencia",
    label: "Pensão por morte",
    description: "Perdi alguém da família que contribuía para o INSS.",
    questions: [
      {
        id: "relationship",
        label: "Qual era sua relação com a pessoa que faleceu?",
        type: "choice",
        options: [
          "Cônjuge",
          "Companheiro(a)",
          "Filho(a)",
          "Pai ou mãe",
          "Outro dependente"
        ],
        required: true
      },
      {
        id: "death_date",
        label: "O falecimento aconteceu recentemente?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei informar"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "A pensão por morte depende da qualidade de segurado, dos dependentes e das datas envolvidas. Precisamos conferir esses pontos antes de orientar o pedido."
      };
    }
  },

  auxilio_acidente: {
    sector: "previdencia",
    label: "Auxílio-acidente",
    description: "Tive acidente e fiquei com alguma sequela que afetou meu trabalho.",
    questions: [
      {
        id: "accident",
        label: "Você sofreu acidente?",
        type: "choice",
        options: [
          "Sim, no trabalho",
          "Sim, fora do trabalho",
          "Não sei se se enquadra"
        ],
        required: true
      },
      {
        id: "sequela",
        label: "Ficou alguma sequela ou limitação?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Ainda não sei"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Precisamos entender o acidente, a sequela e os documentos médicos para verificar se existe possibilidade de benefício."
      };
    }
  },

  bpc_loas: {
    sector: "previdencia",
    label: "BPC / LOAS",
    description: "Sou idoso ou tenho deficiência e preciso entender o benefício assistencial.",
    questions: [
      {
        id: "age",
        label: "Qual sua idade?",
        type: "number",
        unit: "anos",
        required: true
      },
      {
        id: "disability",
        label: "Existe deficiência ou impedimento de longo prazo?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei informar"
        ],
        required: true
      },
      {
        id: "family",
        label: "Quantas pessoas vivem na mesma casa?",
        type: "number",
        unit: "pessoas",
        required: true
      },
      {
        id: "income",
        label: "Qual é aproximadamente a renda mensal da família?",
        type: "text",
        placeholder: "Ex.: R$ 1.500,00",
        required: true
      }
    ],

    evaluate(answers) {
      const age = Number(answers.age);
      const disability = answers.disability === "Sim";

      if (age >= 65 || disability) {
        return {
          class: "precisa_avaliacao",
          rationale:
            "Você está dentro de uma das situações que podem levar à análise do BPC. A renda familiar, a composição da família e outros critérios precisam ser conferidos com os documentos oficiais."
        };
      }

      return {
        class: "precisa_avaliacao",
        rationale:
          "Pelas respostas iniciais, precisamos verificar se existe outra possibilidade de benefício ou assistência. A análise não deve ser encerrada somente pelo formulário."
      };
    }
  },

  acerto_cnis: {
    sector: "previdencia",
    label: "Problema no CNIS",
    description: "Meu tempo, salário ou vínculo aparece errado no INSS.",
    questions: [
      {
        id: "problem",
        label: "Qual problema você encontrou?",
        type: "choice",
        options: [
          "Vínculo que não aparece",
          "Data errada",
          "Salário errado",
          "Contribuição que não aparece",
          "Vínculo duplicado",
          "Outro problema"
        ],
        required: true
      },
      {
        id: "proof",
        label: "Você possui documentos para provar o período?",
        type: "choice",
        options: [
          "Sim",
          "Tenho alguns",
          "Não",
          "Não sei quais documentos servem"
        ],
        required: true
      }
    ],

    evaluate(answers) {
      if (answers.proof === "Sim") {
        return {
          class: "provavel_analise",
          rationale:
            "Você possui documentos que podem ajudar na correção. Precisamos comparar esses documentos com o CNIS."
        };
      }

      return {
        class: "precisa_avaliacao",
        rationale:
          "O problema precisa ser investigado. Primeiro vamos descobrir qual informação está faltando e quais documentos podem ajudar a comprovar o período."
      };
    }
  },

  planejamento_previdenciario: {
    sector: "previdencia",
    label: "Planejamento previdenciário",
    description: "Quero saber o que fazer hoje para organizar minha aposentadoria.",
    questions: [
      {
        id: "goal",
        label: "O que você quer descobrir?",
        type: "choice",
        options: [
          "Quando posso me aposentar",
          "Se posso melhorar o valor",
          "Qual regra pode se aplicar",
          "Organizar meu histórico",
          "Não sei por onde começar"
        ],
        required: true
      },
      {
        id: "age",
        label: "Qual sua idade?",
        type: "number",
        unit: "anos",
        required: true
      }
    ],

    evaluate() {
      return {
        class: "planejamento",
        rationale:
          "Planejamento é justamente para organizar o caminho antes de fazer um pedido. Precisamos analisar seu histórico de contribuições e documentos."
      };
    }
  },

  revisao_beneficio: {
    sector: "previdencia",
    label: "Revisão de benefício",
    description: "Já recebo um benefício, mas acho que pode haver algum erro.",
    questions: [
      {
        id: "benefit",
        label: "Qual benefício você recebe?",
        type: "text",
        placeholder: "Ex.: aposentadoria, pensão...",
        required: true
      },
      {
        id: "problem",
        label: "O que parece estar errado?",
        type: "choice",
        options: [
          "Valor",
          "Tempo de contribuição",
          "Períodos que não entraram",
          "Outro problema",
          "Não sei"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Revisão exige comparação entre o benefício concedido, os documentos e o histórico previdenciário. O formulário sozinho não é suficiente para confirmar erro."
      };
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
      {
        id: "situation",
        label: "O que aconteceu?",
        type: "choice",
        options: [
          "Fui demitido sem justa causa",
          "Fui demitido por justa causa",
          "Pedi demissão",
          "Fiz acordo com a empresa",
          "Ainda estou empregado"
        ],
        required: true
      },
      {
        id: "worked_months",
        label: "Quanto tempo você trabalhou na empresa?",
        type: "number",
        unit: "meses",
        required: true
      },
      {
        id: "documents",
        label: "Você tem o Termo de Rescisão?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Ainda não recebi"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Precisamos conferir o motivo da saída, o Termo de Rescisão, os depósitos do FGTS, férias, 13º, aviso-prévio e outras verbas que possam existir."
      };
    }
  },

  fgts: {
    sector: "trabalhista",
    label: "FGTS",
    description: "Tenho dúvida sobre depósitos, saque ou valores do meu FGTS.",
    questions: [
      {
        id: "problem",
        label: "Qual é o problema?",
        type: "choice",
        options: [
          "Não estão depositando",
          "O valor parece errado",
          "Fui demitido e tenho dúvida sobre a multa",
          "Quero conferir meu histórico",
          "Não sei"
        ],
        required: true
      },
      {
        id: "statement",
        label: "Você tem o extrato do FGTS?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei onde pegar"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "O extrato do FGTS é uma das principais peças para conferir depósitos e diferenças. Vamos comparar o extrato com o período trabalhado."
      };
    }
  },

  salario: {
    sector: "trabalhista",
    label: "Salário / Pagamento",
    description: "Meu salário está atrasado, errado ou tenho valores para conferir.",
    questions: [
      {
        id: "problem",
        label: "O que aconteceu?",
        type: "choice",
        options: [
          "Salário atrasado",
          "Valor diferente do combinado",
          "Desconto que não entendi",
          "Pagamento incompleto",
          "Outro problema"
        ],
        required: true
      },
      {
        id: "proof",
        label: "Você tem holerites ou comprovantes?",
        type: "choice",
        options: [
          "Sim",
          "Alguns",
          "Não"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Precisamos comparar contrato, holerites, comprovantes de pagamento e outros documentos para descobrir exatamente o que aconteceu."
      };
    }
  },

  ferias_13: {
    sector: "trabalhista",
    label: "Férias e 13º salário",
    description: "Tenho dúvida sobre férias ou décimo terceiro.",
    questions: [
      {
        id: "problem",
        label: "Qual é a dúvida?",
        type: "choice",
        options: [
          "Férias não foram dadas",
          "Férias foram pagas errado",
          "Férias vencidas",
          "13º não foi pago",
          "13º foi pago errado",
          "Outro"
        ],
        required: true
      },
      {
        id: "months",
        label: "Quanto tempo você está ou esteve na empresa?",
        type: "number",
        unit: "meses",
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Férias e 13º dependem das datas do contrato, períodos trabalhados e pagamentos realizados. Vamos conferir os documentos."
      };
    }
  },

  horas_extras: {
    sector: "trabalhista",
    label: "Horas extras / Jornada",
    description: "Trabalho além do horário e quero saber como conferir isso.",
    questions: [
      {
        id: "extra",
        label: "Você costuma trabalhar além do horário?",
        type: "choice",
        options: [
          "Sim, frequentemente",
          "Às vezes",
          "Raramente",
          "Não"
        ],
        required: true
      },
      {
        id: "control",
        label: "Existe controle de ponto?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Para conferir horas extras precisamos entender a jornada, o controle de ponto e os pagamentos realizados."
      };
    }
  },

  adicionais: {
    sector: "trabalhista",
    label: "Insalubridade / Periculosidade / Adicionais",
    description: "Trabalho em condição de risco ou recebo algum adicional.",
    questions: [
      {
        id: "condition",
        label: "Com qual situação você se identifica?",
        type: "choice",
        options: [
          "Ruído",
          "Produtos químicos",
          "Risco de acidente",
          "Calor",
          "Agentes biológicos",
          "Outro"
        ],
        required: true
      },
      {
        id: "payment",
        label: "Você recebe algum adicional?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Adicionais dependem das condições reais do trabalho e, em muitos casos, de documentação e avaliação técnica. O formulário serve apenas para identificar o problema."
      };
    }
  },

  acidente_trabalho: {
    sector: "trabalhista",
    label: "Acidente ou doença do trabalho",
    description: "Me machuquei ou adoeci em situação relacionada ao trabalho.",
    questions: [
      {
        id: "event",
        label: "O que aconteceu?",
        type: "choice",
        options: [
          "Acidente no trabalho",
          "Acidente no caminho",
          "Doença relacionada ao trabalho",
          "Não sei"
        ],
        required: true
      },
      {
        id: "documents",
        label: "Você possui documentos médicos?",
        type: "choice",
        options: [
          "Sim",
          "Alguns",
          "Não"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Acidente e doença relacionados ao trabalho podem envolver questões trabalhistas e previdenciárias. Precisamos juntar os documentos e entender a sequência dos fatos."
      };
    }
  },

  justa_causa: {
    sector: "trabalhista",
    label: "Justa causa",
    description: "Recebi ou estou enfrentando uma demissão por justa causa.",
    questions: [
      {
        id: "received",
        label: "Você recebeu algum documento explicando a justa causa?",
        type: "choice",
        options: [
          "Sim",
          "Não",
          "Não sei"
        ],
        required: true
      },
      {
        id: "reason",
        label: "A empresa informou o motivo?",
        type: "text",
        placeholder: "Conte resumidamente o que foi informado.",
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Justa causa precisa ser analisada pelos fatos e documentos. Não é seguro concluir apenas com uma pergunta de formulário."
      };
    }
  },

  assedio_trabalho: {
    sector: "trabalhista",
    label: "Problemas no ambiente de trabalho",
    description: "Estou passando por pressão, humilhação, perseguição ou outro problema no trabalho.",
    questions: [
      {
        id: "problem",
        label: "O que está acontecendo?",
        type: "choice",
        options: [
          "Humilhações",
          "Perseguição",
          "Ameaças",
          "Pressão excessiva",
          "Outro problema"
        ],
        required: true
      },
      {
        id: "proof",
        label: "Você possui mensagens, documentos ou testemunhas?",
        type: "choice",
        options: [
          "Sim",
          "Alguns",
          "Não"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Problemas no ambiente de trabalho precisam ser tratados com cuidado. Guarde mensagens, documentos e outras provas e procure orientação antes de tomar decisões."
      };
    }
  },

  // =========================================================
  // EMPRESARIAL
  // =========================================================

  empresarial: {
    sector: "empresarial",
    label: "Serviços para empresa / MEI",
    description: "Preciso de ajuda com empresa, MEI ou documentação.",
    questions: [
      {
        id: "service_type",
        label: "O que você precisa?",
        type: "choice",
        options: [
          "Abertura de empresa/MEI",
          "Regularização",
          "Folha / Departamento Pessoal",
          "Documentação",
          "Alteração de empresa",
          "Outro"
        ],
        required: true
      },
      {
        id: "documents",
        label: "Você já possui os documentos?",
        type: "choice",
        options: [
          "Sim, todos",
          "Alguns",
          "Ainda não"
        ],
        required: true
      }
    ],

    evaluate() {
      return {
        class: "precisa_avaliacao",
        rationale:
          "Serviços empresariais dependem do tipo de empresa, situação atual e documentos disponíveis. Vamos entender o caso antes de orientar."
      };
    }
  }
};

const CLASSIFICATION_LABELS = {
  provavel_analise: "Vale fazer uma análise",
  planejamento: "Vale se planejar",
  precisa_avaliacao: "Precisa conferir documentos",
  sem_direito: "Não parece se encaixar pelas respostas"
};

function getSectorConfig(sector) {
  return SECTORS[sector] || null;
}

function getAllSectors() {
  return Object.values(SECTORS);
}

function getBenefitConfig(benefitType) {
  return BENEFITS[benefitType] || null;
}

function getAllBenefits() {
  return Object.entries(BENEFITS).map(([key, config]) => ({
    key,
    sector: config.sector,
    label: config.label,
    description: config.description,
    questions: config.questions
  }));
}

function getBenefitsBySector(sector) {
  return getAllBenefits().filter(item => item.sector === sector);
}

function runTriagem(benefitType, answers) {
  const config = BENEFITS[benefitType];

  if (!config) {
    return {
      class: "precisa_avaliacao",
      rationale: "Não conseguimos identificar a situação. Vamos precisar entender o caso manualmente."
    };
  }

  return config.evaluate(answers);
}

export {
  SECTORS,
  BENEFITS,
  CLASSIFICATION_LABELS,
  getSectorConfig,
  getAllSectors,
  getBenefitConfig,
  getAllBenefits,
  getBenefitsBySector,
  runTriagem
};
