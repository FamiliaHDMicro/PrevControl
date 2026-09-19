# PrevControl — Triagem Previdenciária e Trabalhista

Sistema de triagem e organização inicial para escritório de serviços previdenciários e trabalhistas.

O PrevControl foi pensado para uma coisa simples:

> **Ajudar a pessoa a entender o que pode estar acontecendo com o caso dela e mostrar quais documentos precisam ser analisados.**

Ele não substitui a análise profissional, não promete benefício e não toma decisões jurídicas sozinho.

---

# 1. Objetivo do PrevControl

O PrevControl recebe informações básicas do cidadão e faz uma primeira organização do caso.

A pessoa responde perguntas simples, sem precisar conhecer termos jurídicos.

Ao final, o sistema apresenta uma classificação inicial e orienta quais documentos podem ser necessários para uma análise mais completa.

### Princípio do sistema

**Primeiro entender. Depois conferir os documentos. Só então tomar uma decisão.**

O PrevControl não foi criado para dizer:

> "Você ganhou."

Nem para dizer:

> "Você não tem direito."

Ele trabalha com três situações:

- **Indício forte de direito**
- **Necessita análise documental**
- **Fora dos critérios iniciais**

A decisão final continua sendo do profissional responsável.

---

# 2. Público

O sistema foi pensado principalmente para pessoas que:

- têm pouca familiaridade com assuntos previdenciários;
- não sabem qual benefício procurar;
- não entendem o CNIS;
- têm dúvidas sobre aposentadoria;
- tiveram problemas com vínculos ou tempo de contribuição;
- foram demitidas e não sabem se receberam tudo;
- têm dúvidas sobre FGTS, aviso-prévio ou rescisão;
- precisam organizar documentos antes de procurar atendimento;
- precisam entender o próximo passo antes de marcar uma consulta.

---

# 3. Linguagem

O PrevControl deve falar como uma pessoa explicando o assunto para outra pessoa.

### Evitar

- juridiquês;
- frases excessivamente técnicas;
- siglas sem explicação;
- promessas de resultado;
- linguagem assustadora;
- respostas que façam a pessoa acreditar que a triagem é uma decisão definitiva.

### Preferir

Frases como:

> "Vamos entender o que aconteceu."

> "Agora precisamos conferir seus documentos."

> "Isso pode indicar um problema, mas precisamos confirmar."

> "Guarde este documento. Ele pode ser importante para a análise."

> "Não sabe? Tudo bem. Marque que não sabe."

---

# 4. Divisão da Landing Page

A página principal deve deixar claro que existem áreas diferentes de atendimento.

## 🏠 Início

Apresentação simples do PrevControl.

Mensagem principal:

> **Conte o que aconteceu.  
> Nós organizamos as informações para você entender o próximo passo.**

Explicação curta:

> Faça uma triagem inicial respondendo algumas perguntas.  
> No final, você saberá quais informações e documentos podem ser importantes para continuar a análise.

---

# 5. Setor Previdenciário

## 👴 Previdência / INSS

Área destinada a situações relacionadas ao INSS e benefícios previdenciários.

### Opções

- Aposentadoria por idade
- Planejamento previdenciário
- Acerto de CNIS
- Tempo de contribuição não reconhecido
- Vínculo de trabalho que não aparece corretamente
- BPC / LOAS
- Benefícios por incapacidade
- Pensão por morte
- Benefícios relacionados a dependentes
- Revisão de benefício
- Outros assuntos do INSS

A pessoa não precisa saber o nome técnico do benefício.

Exemplo:

> **Não sabe qual benefício pedir?**
>
> Escolha "Não sei qual é" e conte o que aconteceu.

---

# 6. Aposentadoria

A triagem deve coletar, quando aplicável:

- idade;
- sexo;
- histórico de contribuição;
- períodos de trabalho;
- existência de atividade rural;
- atividade especial;
- períodos sem registro;
- vínculos ausentes no CNIS;
- contribuições abaixo do mínimo;
- períodos como MEI;
- períodos como autônomo;
- períodos no serviço público;
- existência de benefício anterior;
- situação atual de trabalho.

### Regra importante

A idade e o tempo informado pela pessoa servem apenas para uma primeira triagem.

A análise real deve considerar o histórico previdenciário e os documentos.

O sistema não deve apresentar uma regra de aposentadoria como definitiva sem verificar o histórico completo.

---

# 7. CNIS

## 📄 Seu tempo de trabalho não aparece no CNIS?

Criar uma área específica para:

- vínculo ausente;
- vínculo duplicado;
- data errada;
- salário de contribuição errado;
- contribuição que não aparece;
- contribuição abaixo do mínimo;
- período rural;
- atividade especial;
- divergência entre carteira de trabalho e CNIS.

Pergunta simples:

> "O que está errado?"

Depois:

> "Você tem algum documento que prove esse período?"

Possíveis documentos:

- carteira de trabalho;
- carnês;
- contracheques;
- contratos;
- rescisões;
- documentos da empresa;
- comprovantes de contribuição;
- documentos rurais;
- PPP;
- LTCAT;
- outros documentos relacionados ao período.

---

# 8. BPC / LOAS

A triagem deve verificar inicialmente:

- idade;
- existência de deficiência;
- composição familiar;
- renda familiar;
- despesas relevantes;
- existência de CadÚnico;
- situação documental.

### Regra

O cálculo automático de renda por pessoa serve apenas como indicação inicial.

Não deve ser apresentado como decisão definitiva sobre o direito ao benefício.

A situação socioeconômica deve ser conferida documentalmente.

---

# 9. Benefícios por incapacidade

Criar área específica para:

- auxílio por incapacidade temporária;
- aposentadoria por incapacidade permanente;
- acidente;
- deficiência;
- afastamento;
- problemas de saúde que impedem o trabalho.

Perguntas iniciais:

- Você está trabalhando atualmente?
- Está afastado?
- Desde quando?
- Possui documento médico?
- Existe diagnóstico?
- Existe tratamento?
- Já passou por perícia?
- O benefício foi negado?
- O benefício foi encerrado?
- Possui documentos do INSS?

### Regra

O PrevControl nunca deve afirmar que uma pessoa está "incapaz" ou que certamente receberá benefício.

Ele apenas organiza as informações para análise profissional.

---

# 10. Pensão por morte

A triagem deve considerar:

- quem faleceu;
- relação com a pessoa falecida;
- existência de dependentes;
- situação previdenciária do falecido;
- existência de benefício;
- data do falecimento;
- documentos disponíveis.

O sistema deve explicar que a análise depende da situação existente na data do falecimento e dos documentos apresentados.

---

# 11. Revisão de benefício

Área para pessoas que já recebem benefício e acreditam que existe algum problema.

Perguntas:

- Qual benefício recebe?
- Desde quando?
- Qual valor aproximado?
- Já recebeu carta de concessão?
- Possui processo administrativo?
- Possui CNIS?
- Possui memória de cálculo?
- Qual problema acredita existir?

Regra:

> **Não prometer revisão favorável.**

Primeiro conferir documentos, cálculo e histórico.

---

# 12. Setor Trabalhista

## 💼 Trabalho / Rescisão

Área independente do setor previdenciário.

Opções:

- Fui demitido;
- Pedi demissão;
- Fui demitido por justa causa;
- Fiz acordo;
- Ainda estou trabalhando;
- Quero sair por problemas com a empresa;
- Não recebi tudo na rescisão;
- Tenho dúvidas sobre FGTS;
- Tenho dúvidas sobre férias;
- Tenho dúvidas sobre 13º;
- Tenho dúvidas sobre horas extras;
- Tenho dúvidas sobre salário;
- Tenho outro problema trabalhista.

---

# 13. Rescisão

A triagem deve considerar:

- motivo da saída;
- tempo de empresa;
- salário;
- aviso-prévio;
- férias;
- 13º;
- FGTS;
- multa rescisória quando aplicável;
- saldo de salário;
- comissões;
- adicionais;
- horas extras;
- convenção coletiva;
- TRCT;
- situação do FGTS.

### Documentos importantes

- TRCT;
- carteira de trabalho;
- holerites;
- extrato FGTS;
- contrato;
- comprovantes de pagamento;
- documentos de férias;
- documentos relacionados à jornada;
- convenção coletiva quando aplicável.

---

# 14. Justa causa

A triagem deve ser cuidadosa.

Nunca afirmar automaticamente:

> "Sua justa causa é ilegal."

Usar:

> "A situação precisa ser analisada. Separe os documentos e conte exatamente o que aconteceu."

Perguntar:

- Qual foi o motivo informado pela empresa?
- Você recebeu algum documento?
- Quando aconteceu?
- Houve advertências?
- Houve suspensão?
- Existem mensagens, documentos ou testemunhas?
- O problema já aconteceu outras vezes?

---

# 15. Rescisão indireta

Para quem diz:

> "Quero sair porque a empresa está fazendo algo errado."

O sistema deve explicar em linguagem simples:

> "Existem situações em que problemas graves cometidos pelo empregador podem precisar de análise profissional antes de você pedir demissão."

Perguntar sobre:

- falta de pagamento;
- FGTS;
- salário atrasado;
- excesso de jornada;
- assédio;
- condições de trabalho;
- descumprimento de obrigações;
- outras situações.

### Regra importante

Não incentivar a pessoa a abandonar o emprego imediatamente.

Primeiro:

**documentar → organizar → analisar → decidir.**

---

# 16. FGTS

Criar uma área própria.

Perguntas:

- Você recebeu o FGTS?
- Recebeu apenas parte?
- Não sabe?
- Possui extrato?
- A empresa está depositando?
- Houve demissão?
- Qual foi o motivo da saída?

Documento principal:

> **Extrato do FGTS.**

---

# 17. Férias

Perguntar:

- Quando entrou na empresa?
- Quando tirou férias?
- Recebeu o pagamento?
- Recebeu o adicional?
- Possui recibo?
- Existem férias atrasadas?

Nunca concluir apenas com uma resposta.

---

# 18. 13º salário

Perguntar:

- Recebeu a primeira parcela?
- Recebeu a segunda?
- Trabalhou durante todo o ano?
- Houve afastamento?
- Possui holerites?

---

# 19. Horas extras

Perguntar:

- Qual era seu horário?
- Quantos dias trabalhava?
- Havia intervalo?
- Batia ponto?
- O ponto era correto?
- Recebia horas extras?
- Possui registros?

Possíveis documentos:

- cartões de ponto;
- holerites;
- escalas;
- mensagens;
- registros de jornada.

---

# 20. Acidente de trabalho

Criar fluxo próprio.

Perguntar:

- O acidente aconteceu durante o trabalho?
- Aconteceu no caminho?
- Houve atendimento médico?
- Houve afastamento?
- Foi emitida CAT?
- Existem testemunhas?
- Possui documentos médicos?

O sistema deve orientar a guardar documentos e procurar avaliação profissional.

---

# 21. Regras gerais do PrevControl

### Regra 1 — Triagem não é decisão

O resultado apresentado pelo sistema é inicial.

### Regra 2 — Documento vale mais que memória

Sempre que possível, orientar a pessoa a apresentar documentos.

### Regra 3 — Não prometer resultado

O PrevControl não promete aposentadoria, benefício, indenização ou vitória trabalhista.

### Regra 4 — Não inventar direito

Se os dados forem insuficientes:

> **Necessita análise documental.**

### Regra 5 — Explicar antes de orientar

A pessoa precisa entender por que determinado documento ou informação é importante.

### Regra 6 — Cada atendimento deve ensinar alguma coisa

Mesmo que a pessoa não tenha direito ao que imaginava, ela deve sair entendendo melhor sua situação.

### Regra 7 — Não induzir respostas

As perguntas devem ser neutras.

### Regra 8 — Permitir "não sei"

Quando a pessoa não souber uma informação, isso deve ser aceito.

### Regra 9 — Não coletar senha do cidadão

O PrevControl não deve pedir:

- senha do gov.br;
- senha bancária;
- senha de e-mail;
- senha de redes sociais.

### Regra 10 — Não armazenar credenciais administrativas no código

Tokens e credenciais administrativas ficam nas variáveis/secrets do ambiente Cloudflare.

### Regra 11 — Dados pessoais somente quando necessários

Coletar apenas informações necessárias para a triagem e atendimento.

### Regra 12 — Transparência

A pessoa deve saber que está preenchendo uma triagem inicial.

### Regra 13 — Sem IA generativa para decidir direito

As classificações da triagem são determinadas pelas regras programadas.

### Regra 14 — Alteração de regra precisa ser rastreável

Mudanças nas regras devem ser feitas no motor `rules.js` e registradas no histórico do projeto.

### Regra 15 — A lei pode mudar

As regras de triagem precisam ser revisadas periodicamente.

---

# 22. Segurança

O PrevControl deve manter:

- tokens fora do código;
- credenciais no ambiente Cloudflare;
- autenticação administrativa;
- proteção das rotas administrativas;
- D1 para armazenamento;
- HTTPS;
- nenhuma senha de cidadão armazenada;
- nenhuma credencial do gov.br armazenada;
- nenhuma senha bancária armazenada.

As variáveis administrativas previstas são:

- `ADMIN_TOKEN`
- `USER1_TOKEN`
- `USER2_TOKEN`
- `WHATSAPP_NUMBER`

Esses valores devem permanecer nas configurações do ambiente Cloudflare e não devem ser colocados no código-fonte.

---

# 23. Dados armazenados

A tabela `leads` armazena os dados necessários para o atendimento inicial.

Entre eles:

- nome;
- telefone;
- assunto;
- respostas da triagem;
- classificação;
- justificativa;
- status;
- data de criação.

O sistema deve evitar guardar informações que não sejam necessárias para o atendimento.

---

# 24. Arquitetura

```text
PrevControl
│
├── index.js
│   └── Worker / APIs / autenticação
│
├── rules.js
│   └── Motor determinístico de regras
│
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── wrangler.jsonc
│   └── Configuração Cloudflare
│
└── D1
    └── prevcontrol-db
