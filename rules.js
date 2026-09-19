// rules.js — Motor de triagem determinística (Estilo Cleiton)
// Foco: Convite à análise documental + Linguagem acessível + Auditoria completa

const BENEFITS = {
  aposentadoria_idade: {
    label: "Aposentadoria por idade",
    questions: [
      { id: "age", label: "Qual sua idade?", type: "number", unit: "anos", required: true },
      { id: "contrib_years", label: "Quantos anos você já pagou INSS (carteira assinada, carnê ou MEI)?", type: "number", unit: "anos", required: true },
      { id: "gender", label: "Você é homem ou mulher?", type: "choice", options: ["Homem", "Mulher"], required: true }
    ],
    evaluate(answers) {
      const age = Number(answers.age);
      const contrib = Number(answers.contrib_years);
      const isMale = answers.gender === "Homem";
      
      if (!age || !contrib) return { class: "precisa_avaliacao", rationale: "Precisamos desses dados para iniciar a análise." };
      
      const minAge = isMale ? 65 : 62;
      const minContrib = 15;
      
      if (age >= minAge && contrib >= minContrib) {
        return { 
          class: "provavel_direito", 
          rationale: `Ótimo sinal! Você atende aos requisitos básicos (${minAge} anos + ${minContrib} anos). Mas atenção: as regras de transição podem mudar seu valor ou data. Precisamos analisar seu CNIS para confirmar.` 
        };
      }
      
      if (age >= minAge - 3 && contrib >= minContrib) {
        return { 
          class: "precisa_avaliacao", 
          rationale: `Você está muito perto da idade mínima. Com as novas regras, pode haver uma janela de oportunidade agora. Traga seus documentos para verificarmos se vale a pena esperar ou entrar com pedido antecipado.` 
        };
      }
      
      return { 
        class: "precisa_avaliacao", 
        rationale: `Ainda faltam alguns anos, mas podemos planejar sua aposentadoria hoje para garantir o melhor benefício futuro. Agende uma avaliação de planejamento.` 
      };
    }
  },
  
  bpc_loas: {
    label: "BPC / LOAS (Benefício Assistencial)",
    questions: [
      { id: "age", label: "Qual sua idade?", type: "number", unit: "anos", required: true },
      { id: "incapacity", label: "Você tem alguma deficiência que dificulta sua vida e trabalho?", type: "choice", options: ["sim", "nao"], required: true },
      { id: "family_members", label: "Quantas pessoas moram na sua casa (incluindo você)?", type: "number", unit: "pessoas", required: true },
      { id: "total_income", label: "Quanto dinheiro entra na casa por mês (soma de todos)?", type: "text", placeholder: "Ex: R$ 800,00", required: true }
    ],
    evaluate(answers) {
      const age = Number(answers.age);
      const hasDef = answers.incapacity === "sim";
      const members = Number(answers.family_members) || 1;
      const incomeMatch = answers.total_income?.match(/[\d.,]+/);
      const income = incomeMatch ? parseFloat(incomeMatch[0].replace('.', '').replace(',', '.')) : 0;
      const perCapita = income / members;
      const limit = 353; 

      if ((age >= 65 || hasDef) && perCapita <= limit)
        return { class: "provavel_direito", rationale: "Sua renda por pessoa está dentro do limite para BPC/LOAS. Precisamos validar isso com documentos oficiais." };
        
      if ((age >= 65 || hasDef) && perCapita > limit)
        return { class: "precisa_avaliacao", rationale: "Renda acima do limite padrão, mas existem exceções legais. Vamos analisar com calma seus comprovantes." };
        
      if (age < 65 && !hasDef)
        return { class: "sem_direito", rationale: "O BPC exige 65+ ou deficiência. Mas podemos te orientar sobre outros benefícios ou assistência social." };
        
      return { class: "precisa_avaliacao", rationale: "Situação precisa de análise detalhada dos comprovantes de residência e renda." };
    }
  },

  trabalhista: {
    label: "Rescisão e direitos trabalhistas",
    questions: [
      { id: "situation", label: "O que aconteceu com seu emprego?", type: "choice", options: ["Demissão sem justa causa", "Demissão por justa causa", "Pedido de demissão/Acordo", "Quero sair por falta grave do patrão", "Ainda estou empregado"], required: true },
      { id: "worked_months", label: "Tempo total na empresa (meses):", type: "number", unit: "meses", required: true },
      { id: "fgts_status", label: "FGTS:", type: "choice", options: ["Recebi/Saquei tudo", "Recebi só parte ou nada", "Não sei informar"], required: true },
      { id: "aviso_previo", label: "Aviso-prévio:", type: "choice", options: ["Trabalhei os dias", "Fui indenizado (recebi em dinheiro)", "Descontaram do meu salário", "Não recebi nada"], required: true },
      { id: "cct_check", label: "Acordo da Categoria (CCT):", type: "choice", options: ["Recebi todos os extras (PLR, adicional, etc)", "Tenho dúvida se recebi tudo", "Não recebi nenhum extra"], required: true }
    ],
    evaluate(answers) {
      const months = Number(answers.worked_months);
      
      if (answers.situation === "Demissão sem justa causa" && answers.fgts_status !== "Recebi/Saquei tudo") {
        return { class: "provavel_direito", rationale: "FGTS incompleto em demissão sem justa causa. Traga o extrato do FGTS e a TRCT para conferência imediata." };
      }
      
      if (answers.aviso_previo === "Descontaram do meu salário") {
        return { class: "provavel_direito", rationale: "Desconto indevido de aviso-prévio é ilegal. Precisamos do contracheque final para restituição." };
      }
      
      if (answers.cct_check === "Não recebi nenhum extra" && months > 12) {
        return { class: "precisa_avaliacao", rationale: "Mais de 1 ano de casa sem extras da CCT? Traga seu último holerite e a Convenção Coletiva para auditoria completa." };
      }

      if (answers.situation === "Quero sair por falta grave do patrão") {
        return { class: "precisa_avaliacao", rationale: "Rescisão indireta exige provas robustas. Liste todas as faltas graves e traga prints/testemunhas antes de agir." };
      }

      return { class: "precisa_avaliacao", rationale: "Para garantir que nenhuma verba foi esquecida, precisamos analisar seus documentos completos (TRCT, Extrato FGTS e Holerites)." };
    }
  },

  empresarial: {
    label: "Serviços Empresariais / MEI",
    questions: [
      { id: "service_type", label: "Qual serviço você precisa?", type: "choice", options: ["Abertura de empresa/MEI", "Regularização de CNPJ inativo", "Departamento Pessoal/Folha", "Contabilidade/Escrita Fiscal", "Alteração contratual"], required: true },
      { id: "has_documents", label: "Já possui os documentos necessários?", type: "choice", options: ["Sim, tenho tudo", "Tenho alguns", "Não tenho nada ainda"], required: true }
    ],
    evaluate(answers) {
      return { 
        class: "precisa_avaliacao", 
        rationale: "Cada caso empresarial é único. Precisamos entender seu regime tributário e obrigações para te orientar corretamente. Agende uma conversa inicial." 
      };
    }
  },

  acerto_cnis: {
    label: "Acerto de CNIS / Vínculos",
    questions: [
      { id: "issue_type", label: "Qual o problema no seu CNIS?", type: "choice", options: ["Tempo não reconhecido", "Vínculo duplicado", "Dados errados", "Outro"], required: true },
      { id: "has_proof", label: "Tem documentos que provam esse tempo/vínculo?", type: "choice", options: ["Sim, tenho provas", "Acho que tenho algo", "Não tenho nada"], required: true }
    ],
    evaluate(answers) {
      if (answers.has_proof === "Sim, tenho provas") {
        return { class: "provavel_direito", rationale: "Com provas documentais, temos grandes chances de acertar seu CNIS. Traga os originais para análise." };
      }
      return { class: "precisa_avaliacao", rationale: "Acerto de CNIS sem provas é complexo. Precisamos buscar alternativas jurídicas. Agende uma avaliação." };
    }
  },

  planejamento_previdenciario: {
    label: "Planejamento Previdenciário",
    questions: [
      { id: "goal", label: "Qual seu objetivo?", type: "choice", options: ["Aposentar mais cedo", "Aumentar o valor", "Entender minhas regras", "Organizar documentos"], required: true },
      { id: "age", label: "Qual sua idade atual?", type: "number", unit: "anos", required: true }
    ],
    evaluate(answers) {
      return { 
        class: "precisa_avaliacao", 
        rationale: "Planejamento previdenciário exige estudo personalizado do seu histórico. É o melhor investimento para garantir seu futuro. Vamos agendar?" 
      };
    }
  }
};

function getBenefitConfig(benefitType) { return BENEFITS[benefitType] || null; }
function getAllBenefits() { 
  return Object.entries(BENEFITS).map(([key, config]) => ({ key, label: config.label, questions: config.questions })); 
}
function runTriagem(benefitType, answers) {
  const config = BENEFITS[benefitType];
  if (!config) return { class: "precisa_avaliacao", rationale: "Tipo de benefício não reconhecido." };
  return config.evaluate(answers);
}

const CLASSIFICATION_LABELS = {
  provavel_direito: "Indício forte de direito",
  precisa_avaliacao: "Necessita análise documental",
  sem_direito: "Fora dos critérios atuais"
};

export { getBenefitConfig, getAllBenefits, runTriagem, CLASSIFICATION_LABELS };
