# NEXUS — Banco de Anotações (melhorias futuras)

Arquivo de planejamento. Não sobe para o Apps Script (ignorado pelo `.claspignore`).
Para executar um item, basta pedir: "vamos fazer o item N do docs/MELHORIAS.md".

Última atualização: 03/08/2026

---

## 🧪 Nova versão (beta) (substitui a Demo Experimental — 18/09/2026)

Trilha **paralela** ao clássico. Não o substitui. Flag interna continua `uiEdition: 'demo'` (`isDemo`).

- **O quê:** mesma navegação do clássico (sidebar + top-nav + abas da operação), com **Hoje** como primeira vista e **Agenda** unificada (grade semana/mês + lista). Temas: os 3 do clássico (Mar Profundo · Claro · Ferro e Maré). Processos: só visão D (master–detail).
- **Como ativar:** ⚙ → “Nova versão (beta)”, ou abrir `demo_experimental.html`, ou `?edition=demo`.
- **O que não muda:** modelo de dados, parsers, sync Drive, formulários, calculadora de prescrição. Clássico continua default no `doGet` (`Nexus.html`).
- **Build:** `npm run build` gera `Nexus.html` (clássico), `Nexus.demo.html` (Demo para compartilhar, UI clássica) e `demo_experimental.html` (esta Beta).
- **Temas clássicos (03/08/2026):** removido Noite Azulada; adicionado Claro (`theme-claro`) com tokens papel-ardósia. Migração: `''` / `theme-noite*` → `theme-claro`.
- **Panorama Processual:** campo `texto` em `briefing.processStageV2` (StagePopup + click-to-edit). `saneamento` continua `textOnly`.

---

## 🧭 Nexus Prumo (antes “Claude · Ardósia”) — protótipo (✅ 23/09), Fases 1 a 6 no app (✅ 25/09/2026)

Trilha **separada** do app: `design/claude-experimental/index.html` (arquivo único, dados fictícios). Não entra no build nem no `clasp push`.

- **Parte 1 (feita):** menu lateral com operações, Hoje, Intimações (lista, quadro e modo foco), gaveta da intimação com régua do prazo, linha do tempo com a contagem do art. 40, Carteira, página da operação, Prazos extintivos e busca ⌘K. Direções visuais Grafite, Ardósia e Maré.
- **Direção escolhida:** Ardósia (claro). **Nome da edição:** Nexus Prumo (24/09/2026). Chave interna continua `uiEdition: 'claude'`.
- **Fase 1 (feita, dados reais):** terceira edição `uiEdition: 'claude'` (⚙ → “Nexus Prumo” ou `?edition=claude`). Menu lateral com operações e abas, barra superior com sync e busca, Hoje e Intimações (lista, quadro com arrastar, foco, gaveta com régua do prazo, gramática, notas e registrar atuação via `handleRespondIntim`). Demais telas são as do app dentro da casca, com tokens Ardósia. Código: `src/edition-claude.jsx` + bloco `EDIÇÃO CLAUDE` em `src/Nexus.shell.html`. Peso: +~195 KB no `Nexus.html`.
- **Fase 2 (feita, dados reais):** Carteira em cartões (filtro por classificação, ordenação, dívida e garantia, revisão, risco prescricional); Visão geral da operação (nova primeira aba, só na Ardósia: indicadores, linha do tempo, intimações, prazos extintivos, agenda; Revisada/Editar/Diagnóstico/Relatório); Linha do tempo (menu Trabalho: processos, prazos de intimação, marcos, contagem do art. 40 pela CDA em pior situação e CDAs sem processo com o prazo para ajuizar); Prazos extintivos em modo Mesa novo (Precisa de você · No radar · Silenciados · Consumadas, selos Calculado/Estimado/Cadastro, adiar com motivo e limite, adesão ao parcelamento na linha). A Mesa chama as mesmas funções do app (`applyMesaAction`, `applyPrescSnooze`, `clearPrescSnooze`, `createInlineParcelamento`); “Lista completa” abre a lista clássica.
- **Fase 3 (feita, dados reais):** Tarefas (lista agrupada por data limite, prioridade ou operação; quadro por situação com arrastar; criação rápida com Enter; concluir no círculo; "Globais e avulsas" como no clássico ou "Todas", incluindo as internas); Agenda (semana, mês e lista de 30 dias com audiências, finais de prazo, tarefas com data limite e termos de prescrição dos grupos 1 a 4, com filtro por tipo e operação, e a lista de audiências com as realizadas); Mesa de trabalho (três colunas, reordenar arrastando ou com as setas, tirar da mesa, registrar atuação pela gaveta e sugestões do que vence logo). Tudo pelas funções do app (`upsert`, `handleSave`, `toggleDesk`, `removeFromDesk`, `reorderDeskInColumn`); edição completa continua nos formulários. Avisos (toast) do app aparecem no estilo da edição.
- **Menu lateral (24/09):** busca de operação sempre visível (nome e descrição) e filtro por classificação igual ao do Clássico e da Beta. O filtro é o mesmo estado do app (`opClassFilter`): vale no menu, na Carteira e no Clássico ao trocar de edição.
- **Fase 4 (feita, dados reais):** cabeçalho Prumo em todas as abas da operação (nome, classificações, revisão, resumo com dívida, garantia, CDAs, processos, intimações e alarme de prescrição; Revisada, Editar, Diagnóstico, Relatório; abas). Pessoas e Bens viram uma aba só, **Partes e bens**, com seletor interno (decisão P4), mantendo por baixo as abas `pessoas` e `bens`. Processos e prescrição, Inscrições e Partes e bens seguem com o conteúdo do app (sem reescrever prescrição) e ganham o visual Prumo (tipografia, botões, etiquetas, campos, cartões). Busca “Filtrar processo / CDA” da Beta ligada também no Prumo; corrigida para achar apensos (vale para a Beta).
- **Fase 5 (feita, dados reais):** Acompanhar (lista com situação, conferência “verificado há N dias” e destaque do que passa de 7 dias sem conferência, botão Verificar, troca de situação na linha, link para o eproc, busca e filtros); Painel da carteira (indicadores, tabela de operações com barra de crédito e parte garantida, mesmas 10 ordenações do Painel clássico — estado `carteiraSort` —, prescrição por grupo com atalho para a lista, revisões devidas com “Revisada”, resumo dos próximos 7 dias com atalho para a Agenda). A Biblioteca continua sendo a tela do app (evolui pelo Cursor) com o visual Prumo aplicado por CSS.
- **Fase 6 (feita):** formulários (janelas de criar e editar) no visual Prumo, só por CSS (`.app-layout.edition-claude .modal`): título e rótulos em texto normal, campos claros com foco destacado, botões no estilo Prumo, Salvar/Cancelar sempre visíveis no pé da janela; no celular a janela sobe de baixo, com os campos em uma coluna. A lógica dos formulários é a mesma do app.
- **Próximos passos (sugestão):** ajustes finos a partir do uso real.
- **Fase 9 (feita, 25/09/2026):** Relatório da operação, reescrito como `src/lib/report.js` (funções puras, testadas em `test/report.test.mjs`) — três modelos: Passagem de serviço (capa com identificação, revisão, Leitura da operação, Próximos 15 dias, Alertas — CDAs grupos 1-2 —, Números e Fontes; página de Frentes processuais com a régua de fases em texto a partir de `processStageV2`/`getStageRecords`, EFs cobertas com sinais de `ProcRowSymbols`, EFs sem incidente e CDAs não ajuizadas; anexos com diário completo, lembretes, checklists, bens em 5 colunas, partes alvo/relacionadas e intimações abertas), Resumo de uma página (só a capa) e Prestação de contas (tally + linha do tempo agrupada por mês, a partir de `responseAction`, `documents`, `processStageV2`, `prescriptionEvents`/`prescriptionHandledAt`, diário, lembretes, audiências realizadas e `changeLog`, com nota sobre o limite de 500 registros). Janela de geração (`Modal` do app, chips de seções liga/desliga, período para a Prestação de contas) abre nas três edições (Clássico, Beta e Prumo) pelo mesmo botão Relatório; "Baixar HTML" e "Abrir para imprimir". A lógica de "quais itens entram por dia" saiu de `cxAgendaByDay` para `src/lib/agenda.js` (`buildAgendaByDay`), reaproveitada pela Agenda do Prumo e pelos Próximos 15 dias do relatório. `generateHandoverReport` foi removido.
- **Proposta (25/09/2026, não implementada, revisão 3):** Briefing como dossiê (leitura da operação = Estratégia fixada mais recente; frentes em trilhas horizontais com fases registradas, eventos livres e até 3 próximas fases típicas como sugestão; diário; coluna de apoio com fontes, lembretes, checklists e 3 próximas tarefas). Processos e prescrição mantém os cartões do clássico (incidentes, sem vínculo, recursos, embargos, outros) e ganha, para dezenas de processos, sumário fixo, filtros pelos sinais da Beta (`ProcRowSymbols`, hoje escondidos no Prumo), barra de grupos no lugar do trilho, tabelas agrupadas com subtotal e ordenação, e ficha lateral com as contagens empilhadas. Relatório em camadas nas três edições, lembretes por padrão, com Resumo e Prestação de contas (período ou operação inteira). Ordem: 9a → 9b → 7a → 7b → 8a → 8b, sem mudar modelo de dados nem prescrição. Para depois: histórico além dos 500 registros do `changeLog`. Maquete: `design/mockups/prumo-briefing-processos-relatorio.html`. Mesa de prazos fica para outro momento.
- Detalhes e atalhos: `design/claude-experimental/README.md`.

---

## 🎨 Redesign visual — PLANO PROGRESSIVO (revisado 30/07/2026)

**Ainda não implementado.** Pedir por fase: "vamos fazer o P1".
Mockups em `design/mockups/` (inclui `recon-07-gramatica-card-atual.png`).

### Princípios (suas decisões)
- **Preservar o card atual** (notas imprescindíveis). Não trocar por tabela “do zero”.
- **Gramática composta** no card: Importância + Dificuldade (manuais) + Prazo visível; ordenação escolhida pelo usuário (padrão Imp → Dif → Prazo). Sem score mágico.
- **Processos + presc + CDA:** manter modelo de cards; **colapsado por padrão**, expandir ao detalhe atual com um clique; **popup** no clique da CDA.
- **Partes + Bens:** **uma aba** com seletor interno (Partes | Bens), não duas abas nem fusão de dados.
- **Grafo / Insights:** apagar (fase isolada).
- **Uma fase por vez** → deploy → validação → próxima.

### Fases
| Fase | Entrega | Risco |
|------|---------|-------|
| **P1** ✅ | Gramática no **card atual** de intimação (campos + ordenar) — feito 30/07/2026 | Baixo |
| **P2** | Remover só Grafo e Insights | Baixo |
| **P3a** | Processos colapsados → expandir ao card atual | Médio |
| **P3b** | Prescrição na mesma família visual (sem perder Controle) | Médio |
| **P3c** | Popup detalhe CDA (alinhar/aprimorar) | Baixo |
| **P4** | Aba Partes/Bens com seletor | Baixo–médio |
| **P5** | Calmo leve (CTA hover, menos pulse) — opcional | Mínimo |
| **P6** | Landing/Hoje — só após P1 estável | Médio |

Ordem: P1 → P2 → P3a → P3b → P3c → P4 → (P5) → P6.

---

## ✅ Já feito

- **Item 2 — Git** (29/07/2026) — repositório iniciado, commit inicial `9f21ea2`.
  Para ver o histórico: `git log --oneline`. Para voltar atrás: me pedir.
- **Item 3 — Lentidão ao digitar (parte principal)** (29/07/2026) —
  `PersonProfileCard`, `ExecutadoLine` e `CDAList` movidos para fora do `App`
  com `React.memo`. Eram recriados a cada tecla, forçando o React a desmontar
  e remontar as abas Pessoas e Processos inteiras.
  - Restante opcional: `ExecCard`, `PrescCard`, `ProcPrescCard` são chamados como
    funções comuns (sem problema de remontagem); converter em componentes
    memoizados é ganho adicional menor. Ganho maior restante: itens 4 e 5.
- **Transições entre abas/operações** (29/07/2026) — três correções:
  cache das listas filtradas por operação (30 refiltragens eliminadas por render),
  gravação de `lastAccessed` adiada ao abrir operação (não bloqueia mais a abertura)
  e `useTransition` nos cliques (a interface não congela durante a troca).
  Cobre parte do item 4 (índices) e do item 5 (estado).
- **Pré-compilação do JSX** (29/07/2026) — o Babel foi removido do navegador; o código
  é compilado no computador (`npm run build`) e entregue pronto, empacotado em base64
  para o Apps Script não corromper. Abertura do app 2–5 s mais rápida.
  - Fonte para editar: `src/app.jsx` (lógica) e `src/Nexus.shell.html` (CSS/HTML)
  - `Nexus.html` é GERADO — nunca editar à mão
  - Fluxo: editar → `npm run build` → `clasp push` → Nova versão na implantação
- **Operação vinculada — ordem e regra anti-vinculação falsa** (29/07/2026) —
  o seletor "Operação vinculada" (intimação, tarefa, acompanhamento e audiência)
  agora lista as operações em ordem alfabética. E o import do eproc parou de
  herdar a operação aberta na tela: intimação nova só recebe operação se o
  processo constar em um processo/CDA cadastrado (ou em intimação irmã do mesmo
  processo). Sem correspondência → fica "Nenhuma", com aviso no resumo do import.
- **Backup pré-mudança** — cópia intacta em `_backup-pre-build-20260729-192046/`

---

## 📋 Pendentes

### 1. Trava de integridade (SRI) nas bibliotecas do CDN
- **O que é:** anotar no HTML a "impressão digital" das 4 bibliotecas externas
  (React, ReactDOM, XLSX, LZ-String, pdf.js) para o navegador recusar versões adulteradas.
- **Por quê:** essas ferramentas rodam na mesma página onde os dados aparecem;
  a trava elimina o (pequeno) risco de adulteração no depósito público (cdnjs).
- **Alternativa máxima:** embutir as bibliotecas dentro do próprio `Nexus.html`
  (app passa a não depender de nenhum servidor fora do Google).
- **Esforço:** pequeno · **Risco:** baixo

### 2. Controle de versão (Git)
- **O que é:** iniciar um repositório Git na pasta e criar um commit inicial.
- **Por quê:** hoje não há histórico; um erro de edição ou um `clasp pull` mal-dado
  é irrecuperável. É a proteção mais importante antes de refatorações maiores.
- **Esforço:** pequeno · **Risco:** nenhum
- **Prioridade sugerida: ALTA — fazer antes dos itens 3 a 6**

### 3. Corrigir lentidão ao digitar/filtrar (React.memo)
- **O que é:** mover componentes definidos dentro do `App` (`PersonProfileCard`,
  `ExecCard`, `PrescCard`, `ProcPrescCard`, `CDAList`, `ExecutadoLine`) para fora
  e aplicar `React.memo`. Hoje qualquer tecla digitada remonta o painel inteiro.
- **Por quê:** é a maior causa da lentidão DURANTE o uso (a pré-compilação já
  resolveu a lentidão de ABERTURA).
- **Esforço:** médio/grande · **Risco:** médio (mexe em muitos pontos — exige Git antes)

### 4. Índices por ID (buscas quadráticas)
- **O que é:** criar mapas memoizados (id → entidade) para pessoas, CDAs, processos.
  Hoje há ~900 varreduras de listas, muitas aninhadas (custo cresce ao quadrado).
- **Por quê:** o app vai ficando mais lento conforme os dados crescem.
- **Esforço:** médio · **Risco:** baixo/médio

### 5. Separar estado de interface do estado de dados
- **O que é:** filtros, modais e buscas não devem disparar o ciclo de salvamento
  nem re-renderizar tudo (hoje ~78 estados vivem no mesmo componente).
- **Esforço:** médio · **Risco:** médio

### 6. Persistência mais robusta
- **O que é:** mover a compressão (LZ-String) para um Web Worker ou migrar o cache
  local de localStorage (limite ~5 MB, já próximo) para IndexedDB.
- **Por quê:** evitar travadinhas ao salvar e o risco de estourar a cota local.
- **Esforço:** médio · **Risco:** médio

### 7. Permissões explícitas no manifesto
- **O que é:** declarar `oauthScopes` no `appsscript.json` (Drive, Planilhas, Mail).
- **Por quê:** evita quebras de autorização em redeploys futuros.
- **Esforço:** pequeno · **Risco:** baixo

### 8. Testes da calculadora de prescrição
- **O que é:** testes automatizados para as regras do Art. 40 LEF (a parte com
  maior consequência jurídica em caso de erro silencioso).
- **Esforço:** médio · **Risco:** nenhum (só adiciona verificação)

### 9. Dividir o código-fonte em módulos
- **O que é:** quebrar `src/app.jsx` (10 mil linhas) em arquivos menores por tema
  (parsers, prescrição, telas...). O build já existe, então isso ficou viável.
- **Por quê:** manutenção mais fácil e menos risco a cada edição.
- **Esforço:** grande · **Risco:** médio (exige Git antes)

---

## Notas de contexto (para futuras conversas)

- Deploy: `npm run build` → `clasp push` → editor Apps Script → Implantar →
  Gerenciar implantações → ✏️ → Nova versão. Recarregar com Ctrl+Shift+R.
- PowerShell bloqueia npm/clasp por padrão: rodar antes
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
  e `$env:Path = "C:\Program Files\nodejs;$env:APPDATA\npm;" + $env:Path`.
- O Apps Script corrompe JS inline grande com aparência de HTML — por isso o
  código do app viaja em base64 dentro do `Nexus.html` (montado pelo `scripts/build.mjs`).
- Dados sensíveis: ficam no Drive institucional + navegador. O código não é sensível.
- Acesso do web app: restrito ao próprio usuário (`access: MYSELF`).
