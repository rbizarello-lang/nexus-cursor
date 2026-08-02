# NEXUS — Banco de Anotações (melhorias futuras)

Arquivo de planejamento. Não sobe para o Apps Script (ignorado pelo `.claspignore`).
Para executar um item, basta pedir: "vamos fazer o item N do MELHORIAS.md".

Última atualização: 02/08/2026

---

## 🧪 Demo Experimental — Central de Comando (02/08/2026)

Trilha **paralela** ao redesign progressivo (P2–P6). Não substitui o clássico.

- **O quê:** edição `uiEdition: 'demo'` com rail (Hoje / Intimações e Tarefas / Carteira / Agenda / Biblioteca / Trabalho=Mesa), zonas da operação, Command Center “Hoje”, grade semanal, temas Clara·Mar·Ardósia·Grafite.
- **Como ativar:** ⚙ → “Demo Experimental”, ou abrir na raiz do repo `Nexus_demo_experimental.html` (também `Nexus.demo.html` / `demo_experimental.html`), ou `?edition=demo`.
- **Visão Gemini (Workspace):** ⚙ → Visão Gemini, ou botão no Hoje. Materializa abas `Gemini_*` na Planilha (`exportGeminiView` em `Código.js`) para análise no Gemini do Workspace. Escopos: carteira · fila de hoje · operação atual.
- **O que não muda:** modelo de dados, parsers, sync Drive, formulários, calculadora de prescrição. Clássico continua default no `doGet` (`Nexus.html`).
- **Build:** `npm run build` gera na raiz: `Nexus.html` + `Nexus.demo.html` + `Nexus_demo_experimental.html` (+ alias `demo_experimental.html`).

---

## 🎨 Redesign visual — PLANO PROGRESSIVO (revisado 30/07/2026)

**Ainda não implementado.** Pedir por fase: "vamos fazer o P1".
Mockups em `_design-mockups/` (inclui `recon-07-gramatica-card-atual.png`).

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
