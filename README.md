# PrevControl — Triagem Previdenciária Gratuita

Sistema de triagem determinística para escritório previdenciário. Custo zero, acessível e sem IA generativa paga.

## Estrutura
- `index.js` — Worker principal (APIs + autenticação + servir assets)
- `rules.js` — Motor de regras fixas (sem alucinação, linguagem simples)
- `public/` — Frontend acessível (HTML/CSS/JS)
- `wrangler.jsonc` — Configuração Cloudflare Pages + D1

## Deploy
1. Configure as Secrets no Cloudflare Pages:
   - ADMIN_TOKEN, USER1_TOKEN, USER2_TOKEN
   - WHATSAPP_NUMBER
2. Execute: `npm run deploy`

## Banco de Dados
Tabela `leads` já criada no D1 remoto (`prevcontrol-db`). Schema validado via Studio.

## Acessibilidade
- Navegação por teclado (setas esquerda/direita)
- ARIA labels em todos os elementos interativos
- Contraste alto + fallback para celulares lentos (backdrop-filter)
- Linguagem simplificada (sem juridiquês, cálculo automático de renda per capita)
