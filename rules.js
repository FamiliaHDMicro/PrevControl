// rules.js — Motor de triagem determinística (Custo Zero)
// Adaptado para linguagem cotidiana e público de baixa instrução

const BENEFITS = {
  aposentadoria_idade: {
    label: "Aposentadoria por idade",
    questions: [
      { id: "age", label: "Qual a sua idade?", type: "number", unit: "anos", required: true },
      { id: "contrib_years", label: "Quantos anos você já pagou INSS (carteira assinada, carnê ou MEI)?", type: "number", unit: "anos", required: true },
      { id: "gender", label: "Você é homem ou mulher?", type: "choice", options: ["homem", "mulher"], required: true }
    ],
    evaluate(answers) {
      const age = Number(answers.age);
      const contrib = Number(answers.contrib_years) || 0;
      const isMale = answers.gender === "homem";
      
      if (!age || !contrib) return { class: "precisa_avaliacao", rationale: "Precisamos da sua idade e tempo de contribuição para avaliar." };
      
      const minAge = isMale ? 65 : 62;
      const minContrib = 15;
      
      if (age >= minAge && contrib >= minContrib) 
        return { class: "provavel_direito", rationale: `Ótima notícia! Você tem ${minAge} anos e ${contrib} anos de contribuição.` };
        
      if (age >= minAge - 2 && contrib >= minContrib)
        return { class: "precisa_avaliacao", rationale: "Você está pertinho da idade. Vale a pena analisar as regras de transição." };
        
      return { class: "sem_direito", rationale: `Ainda faltam ${Math.max(minAge - age, 0)} anos de idade ou mais tempo de contribuição.` };
    }
  },
  bpc_loas: {
    label: "BPC / LOAS (Benefício Assistencial)",
    questions: [
      { id: "age", label: "Qual a sua idade?", type: "number", unit: "anos", required: true },
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
        return { class: "provavel_direito", rationale: "Sua renda por pessoa está dentro do limite para BPC/LOAS." };
        
      if ((age >= 65 || hasDef) && perCapita > limit)
        return { class: "precisa_avaliacao", rationale: "Renda acima do limite padrão, mas existem exceções. Vamos analisar com calma." };
        
      if (age < 65 && !hasDef)
        return { class: "sem_direito", rationale: "O BPC exige 65+ ou deficiência. Mas podemos te orientar sobre outros benefícios." };
        
      return { class: "precisa_avaliacao", rationale: "Situação precisa de análise detalhada." };
    }
  },
  auxilio_doenca: {
    label: "Auxílio-doença / Incapacidade",
    questions: [
      { id: "contrib_months", label: "Quantos meses você já pagou INSS?", type: "number", unit: "meses", required: true },
      { id: "incapacity", label: "Você está impossibilitado(a) de trabalhar por motivo de saúde?", type: "choice", options: ["sim", "nao"], required: true },
      { id: "has_medical_report", label: "Você tem laudo médico ou atestado?", type: "choice", options: ["sim", "nao"], required: true }
    ],
    evaluate(answers) {
      const cm = Number(answers.contrib_months);
      if (answers.incapacity !== "sim") return { class: "sem_direito", rationale: "O auxílio-doença exige que a pessoa esteja impossibilitada de trabalhar." };
      if (cm >= 12 && answers.has_medical_report === "sim")
        return { class: "provavel_direito", rationale: "Você tem a carência necessária (12 meses), está incapacitado(a) e tem laudo médico." };
      if (cm >= 12)
        return { class: "precisa_avaliacao", rationale: "Você tem a carência, mas vai precisar de laudo médico para a perícia." };
      return { class: "precisa_avaliacao", rationale: `Faltam ${12 - cm} meses de carência (salvo se for doença do trabalho ou acidente).` };
    }
  },
  pensao_morte: {
    label: "Pensão por morte",
    questions: [
      { id: "relationship", label: "Qual seu parentesco com a pessoa falecida?", type: "choice", options: ["conjuge", "filho_menor", "filho_maior", "pais", "irmaos"], required: true },
      { id: "deceased_contributed", label: "A pessoa falecida contribuía para o INSS?", type: "choice", options: ["sim", "nao", "nao_sei"], required: true }
    ],
    evaluate(answers) {
      if (answers.deceased_contributed === "nao")
        return { class: "sem_direito", rationale: "A pensão por morte exige que a pessoa falecida fosse segurada do INSS." };
      if (["conjuge", "filho_menor", "pais", "irmaos"].includes(answers.relationship))
        return { class: "provavel_direito", rationale: "Como dependente de segurado do INSS, você provavelmente tem direito à pensão por morte." };
      if (answers.relationship === "filho_maior")
        return { class: "precisa_avaliacao", rationale: "Filho maior de 21 anos só tem direito em casos específicos. Vamos analisar." };
      return { class: "precisa_avaliacao", rationale: "Situação precisa de análise detalhada." };
    }
  },
  salario_maternidade: {
    label: "Salário-maternidade",
    questions: [
      { id: "contrib_months", label: "Quantos meses você já pagou INSS?", type: "number", unit: "meses", required: true },
      { id: "situation", label: "Qual a sua situação?", type: "choice", options: ["gravida", "ja_nasceu", "adocao"], required: true }
    ],
    evaluate(answers) {
      const cm = Number(answers.contrib_months);
      if (cm >= 10) return { class: "provavel_direito", rationale: "Parabéns! Você tem a carência de 10 meses necessária." };
      if (cm > 0) return { class: "precisa_avaliacao", rationale: `Faltam ${10 - cm} meses de carência. Mas fique tranquilo(a), podemos te orientar.` };
      return { class: "sem_direito", rationale: "Sem contribuições registradas. Mas existem situações especiais." };
    }
  },
  trabalhista: {
    label: "Direitos trabalhistas",
    questions: [
      { id: "situation", label: "Qual a sua situação?", type: "choice", options: ["demissao_sem_justa", "demissao_justa", "rescisao_indireta", "acordo", "ainda_trabalhando"], required: true },
      { id: "worked_months", label: "Quanto tempo você trabalhou lá (em meses)?", type: "number", unit: "meses", required: true },
      { id: "received_verbas", label: "Recebeu as verbas rescisórias corretamente?", type: "choice", options: ["sim", "nao", "nao_sei"], required: true }
    ],
    evaluate(answers) {
      const m = Number(answers.worked_months);
      if (answers.situation === "demissao_sem_justa" && answers.received_verbas === "nao" && m > 0)
        return { class: "provavel_direito", rationale: "Demissão sem justa causa sem pagamento de verbas — provável direito a cobrança." };
      if (answers.situation === "rescisao_indireta" && m > 0)
        return { class: "precisa_avaliacao", rationale: "Rescisão indireta exige comprovação de falta grave do empregador." };
      if (answers.received_verbas === "sim")
        return { class: "precisa_avaliacao", rationale: "Verbas pagas — pode haver diferenças a revisar." };
      if (answers.situation === "ainda_trabalhando")
        return { class: "precisa_avaliacao", rationale: "Emprego ativo — pode haver verbas vencidas a verificar." };
      return { class: "precisa_avaliacao", rationale: "Situação trabalhista precisa de análise detalhada." };
    }
  },
  revisao: {
    label: "Revisão de benefício",
    questions: [
      { id: "benefit_type", label: "Qual benefício você recebe hoje?", type: "text", required: true },
      { id: "years_receiving", label: "Há quantos anos você recebe?", type: "number", unit: "anos", required: true },
      { id: "months_receiving", label: "E quantos meses a mais (além dos anos)?", type: "number", unit: "meses", required: false },
      { id: "issue", label: "Qual o motivo da revisão?", type: "choice", options: ["valor_baixo", "erro_calculo", "mudanca_legislacao", "outro"], required: true }
    ],
    evaluate(answers) {
      const y = Number(answers.years_receiving) || 0;
      const m = Number(answers.months_receiving) || 0;
      const total = y + (m / 12);
      if (total > 10)
        return { class: "precisa_avaliacao", rationale: `Você recebe há ${y} ano(s) e ${m} mes(es). Pode haver limite, mas algumas revisões ainda cabem.` };
      if (answers.issue === "mudanca_legislacao")
        return { class: "provavel_direito", rationale: "Mudança de legislação pode garantir revisão retroativa. Ótimo!" };
      if (answers.issue === "erro_calculo" || answers.issue === "valor_baixo")
        return { class: "precisa_avaliacao", rationale: "Possível erro de cálculo — precisa análise da RMI e das contribuições." };
      return { class: "precisa_avaliacao", rationale: "Motivo da revisão precisa de análise detalhada." };
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
  provavel_direito: "Provável direito",
  precisa_avaliacao: "Precisa avaliação",
  sem_direito: "Sem direito no momento"
};

export { getBenefitConfig, getAllBenefits, runTriagem, CLASSIFICATION_LABELS };
