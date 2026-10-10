# Handoff — Prumo: coluna Indicadores (V1 + esteira t1) e plano de UI

Branch: `claude/quirky-davinci-zmvzh8` (= master 5de3613 + mockup 8647090 + este handoff/WIP).
Sessão anterior suspensa por falta de créditos. Tudo o que é preciso para continuar está nesta pasta.

## Estado

| Item | Situação |
|---|---|
| Card R, abas da operação, auditoria de consistência (5 fases), Frentes | **Feito e mesclado** em master (PR #45) |
| Mockup das 4 versões da coluna Indicadores (`design/mockups/prumo-intimacao-indicadores.html`) | Commitado (8647090). Usuário escolheu **V1** |
| Implementação da V1 com a esteira t1 | **WIP**: JSX parcial em `src/edition-claude.jsx` (commitado), **sem CSS, build não rodado** |
| Planos de UI dos dois designers (A: linguagem visual; B: interação) | **Não feitos**: os agentes foram parados antes de escrever. Prompts em `designers/` |
| Stepper de fonte A−/A+ no ⚙ | Avaliado, **aguardando decisão** do usuário |

## 1. Tarefa principal: V1 da coluna Indicadores

### Pedido do usuário (literal)
> "V1, com uma pequena alteração: Altere o layout da esteira para que ele tenha a mesma altura do icone da peça. Pense em um layout em que a esteira e o link da peça conversem e sejam harmônicos. Condensar na horizontal e expandir na vertical. Seja criativo. Deixe bonito."

Regras da V1 (pedido anterior):
- Os glifos de importância e complexidade (CxImp/CxDif) **somem** da coluna.
- No lugar deles entram três tags de texto, todas em tons de vermelho, que podem aparecer juntas, empilhadas e com largura total da coluna:
  - **URGENTE**: `intimIsUrgent`. Vermelho sólido, texto `--cx-on-solid`.
  - **IMPORTANTE**: `intimImpKey(intim) === 'alta'`. Fundo `--cx-red-soft`, borda vermelha a 42%.
  - **COMPLEXO**: `intimDifKey(intim) === 'alta'`. Só contorno vermelho, peso 600.
  - O CSS das tags está em `design/mockups/prumo-intimacao-indicadores.html`, regras `.ixt`, `.ixt.u/.i/.c` e `.v1 .ixg`.
  - A cor `--tag-i-ink` usada ali é `color-mix(in srgb, var(--cx-red) 92%, var(--cx-ink))` e precisa ser definida no shell (ou usar inline).
- A esteira da peça **perde qualquer frase**. Etapa, "n de N" e "Parou há…" ficam só no tooltip (hover/foco). A esteira fica **colada ao rodapé** da coluna (`margin-top: auto`).
- O ícone da peça (`CxDocIcon`, 18px) fica ao lado da esteira, no fim, de forma simétrica.

### Desenho escolhido: t1 (cápsula)
Ver `indicadores-v1/alt-explore-ardosia.png` (coluna t1) e `indicadores-v1/explore.html`, regras `.t1`.

Estrutura:
- Pílulas **verticais** finas, com a mesma altura do ícone (18px): 4px de largura, raio 2px, espaço de 2px.
- Cores das pílulas: feita = `--cx-green`; atual = `--cx-blue`; a fazer = `--cx-line-strong`.
- Depois das pílulas, um divisor vertical de 1px × 18px (`--cx-line`) e o ícone da peça.
- Tudo dentro de uma cápsula discreta:
  ```css
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 4px 3px 6px; border-radius: 7px;
  background: var(--cx-surface-2);
  box-shadow: inset 0 0 0 1px var(--cx-line);
  ```
- A cápsula fica alinhada à direita (`justify-content: flex-end`).
- Sem esteira: a cápsula mostra só o ícone. Sem peça: só as pílulas, sem divisor. Sem nenhum dos dois: nada.
- Esteira concluída (`.fin`): todas as pílulas verdes. Opcional: realçar a cápsula em verde suave.
- Variantes descartadas: t2 (linha horizontal esticada), t3 (barras de sinal), t4 (bateria).

### O que já está no JSX (WIP, `src/edition-claude.jsx`)
- `CxIxTags({ intim, urgent })` → `.cx-ixg > .cx-ixt.u|.i|.c`.
- `CxIxRail({ esteira, url })` monta esta árvore:
  ```
  .cx-ixf > .cx-ixr[.est][.doc][.fin]
            ├─ .cx-ixr-e  (tabIndex 0, role img, aria-label, tooltip via cxHintProps)
            │   ├─ .cx-ixr-p > i[.d|.n]   (pílulas)
            │   └─ .cx-ixr-l               (divisor)
            └─ CxDocIcon 18px
  ```
- `CxIntimRow`, coluna `.cx-ix-sn`: renderiza `<CxIxTags>` e `<CxIxRail>` no lugar dos slots antigos (CxImp/CxDif/CxDocIcon), do chip `.cx-urg` e do `CxIxEst`.
- `esteiraSummary` devolve `{ total, doneCount, currentIndex, current, isComplete }`, ou seja, os campos usados batem.

### Falta fazer
1. **CSS** em `src/Nexus.shell.html`, junto das regras `.cx-ix-sn` (grep por `.cx-ix-sn`):
   - Tags: `.cx-ixg`, `.cx-ixt`, `.cx-ixt.u/.i/.c`.
   - Esteira: `.cx-ixf` (`margin-top: auto`, flex à direita), `.cx-ixr` (cápsula), `.cx-ixr-e`, `.cx-ixr-p`, `.cx-ixr-p i`, `.cx-ixr-p i.d/.n`, `.cx-ixr-l`.
   - `.cx-ixr-l` só aparece quando há `.doc`: `.cx-ixr:not(.doc) .cx-ixr-l { display: none }`.
   - Use os tokens `--cx-fs-*` (no mockup as tags usam mono 700 em 9px; `--cx-fs-9` não existe no shell, o menor token é `--cx-fs-10`: use-o ou crie `--cx-fs-9`).
   - Confira os três temas (Ardósia, `.cx-theme-noite`, `.cx-theme-grafite`) e o celular (`< 860px`, container queries em `.cx-it-list`).
2. Remover o CSS que ficar morto: `.cx-urg` dentro do card e `.cx-ix-est*`/slots antigos, **só depois de** um `grep` no `src/` confirmar que não há outro uso.
3. Se a largura da coluna mudar, ajustar as constantes de `intimCardLayout` em `src/lib/intim-card.js` (coluna "sinais" 118/110) e o teste `test/intim-card.test.mjs`.
4. `npm run build && npm test` (eram 938 testes passando).
5. QA visual com Playwright (seção 4): lista de Intimações em 1920/1440/1280/420 px, Ardósia e Noite, com e sem esteira/peça, hover mostrando o tooltip, sem erros de console.
6. Registrar em `docs/MELHORIAS.md` (Prumo → Já feito): "Coluna Indicadores V1: tags URGENTE/IMPORTANTE/COMPLEXO; esteira em cápsula t1 com a peça".
7. Commit em português, **staging explícito** (nunca `git add -A`), com os HTML gerados. Push na branch e PR para master quando o usuário pedir.

## 2. Planos de UI (dois designers)

Pedido do usuário (literal):
> "dispare dois agentes autônomos. Eles são designers de UI expert. Sem alterar profundamente o app, sem reformular o Prumo, buscam de forma extensiva referências das melhores práticas de navegação, apresentação visual, elementos gráficos, componentes visuais, interações, etc. Os dois propõem um plano de aprimoramento da UI do Nexus Prumo (só dele, esqueça o clássico nessa tarefa). Um exemplo que extraí de outro app que uso: utilização de cores em degradê (algo que pode dar destaque a CARDS, marcar divisões e marcadores de urgência, etc.). Enfim, quero que eles tenham liberdade criativa, como designers que são. O plano deve perpassar o app todo, de forma harmônica e simétrica, sem prejuízo de que algumas animações, microinterações, componentes visuais sejam exclusivos de alguns pontos, porque ali se enquadram."

- Referência visual: `referencias/degrade-cabecalho.webp`, um cabeçalho "Visão geral" com degradê suave menta/lavanda/pêssego e título serifado.
- Prompts completos: `designers/PROMPT-designer-A-linguagem-visual.md` (lente cor/degradê/superfícies/tipografia) e `designers/PROMPT-designer-B-interacao.md` (lente navegação/estados/microinterações).
- **Ajuste os caminhos absolutos** `/tmp/claude-0/.../scratchpad/...` dos prompts para uma pasta de trabalho da nova sessão.
- As capturas de tela citadas nos prompts (`qa-card/fase-5/shots/`) não foram salvas. Gere de novo com `qa/fase-5/snap.mjs` (modo `shots`).
- Entregáveis de cada designer: `PLANO-A.md`/`PLANO-B.md` (em português) e uma vitrine HTML (`vitrine-a.html`/`vitrine-b.html`) com amostras nos três temas. Depois, consolidar os dois num plano por fases em `docs/MELHORIAS.md` para o usuário escolher.

## 3. Stepper de fonte A−/A+ (aguardando o usuário)

Pedido: no ⚙, aumentar e diminuir a fonte do app inteiro em passos de 0,5px.

Avaliação:
- **Viável no Prumo.** O CSS `.cx*` usa 472 referências a tokens `--cx-fs-*` contra só 63 tamanhos literais.
- Proposta:
  - Um `--cx-fs-adj` somado a cada token: `--cx-fs-sm: calc(11.5px + var(--cx-fs-adj))`.
  - Faixa −2..+2 px, gravada em `settings`.
  - Botões A− / valor / A+ no ⚙.
  - Converter os 63 literais para tokens.
- **Limitação:** as telas do app clássico dentro da casca (cerca de 592 `fontSize` inline em `app.jsx`) não acompanhariam.
- O mockup `prumo-intimacao-indicadores.html` já simula o stepper (`--fs-adj`).

## 4. QA com Playwright

- Chromium vem pré-instalado em `/opt/pw-browsers`. Não rode `playwright install`.
- `qa/lib.mjs` serve React/XLSX/fontes Geist localmente porque a rede do container bloqueia CDNs.
- Para isso, instale os pacotes de `qa/cdn-package.json` numa pasta (`npm i`) e aponte a constante `D` de `lib.mjs` para o `node_modules` dela. Ajuste também o `executablePath` se a versão do chromium mudar (`ls /opt/pw-browsers`).
- `qa/fase-5/tour.mjs`:
  - `openApp(browser, { url: 'file:///…/Nexus.html?edition=claude', width, theme, font })` carrega os dados demo pelo ⚙ e aplica tema e fonte.
  - `tour(p, cap)` percorre cerca de 38 telas.
- `qa/fase-5/snap.mjs` tem dois modos: `shots` (capturas) e `computed` (estilos computados para comparar antes/depois).
- `qa/fase-5/cmp2.mjs` compara os estilos por propriedade. Capture "antes" e "depois" **no mesmo dia**, porque os dados demo dependem da data.
- `qa/fase-5/mob.mjs`: capturas de celular.
- Todos os scripts têm caminhos absolutos do container antigo. Troque `D=` no topo de cada um.

## 5. Regras do projeto (resumo de AGENTS.md e das fases anteriores)

- Só o Prumo muda: `src/edition-claude.jsx` e o CSS `.cx*` em `src/Nexus.shell.html` (mais `src/lib/*.js` se preciso). Clássico, Beta e Demo ficam idênticos.
- O usuário prefere **fontes pequenas** e pouco ruído. Tamanhos do card que ele fixou:
  - parte 13px;
  - nº do processo mono 11,5/400;
  - objeto 12px;
  - notas/teor 11,5px;
  - data 12px.
- Não mexer em parsers, prescrição, sync do Drive nem no modelo de dados.
- Os HTML gerados (`Nexus.html`, `Nexus.demo.html`, `demo_experimental.html`) **nunca** se editam à mão: rode `npm run build` e commite-os.
- Auditoria anterior (referência para tokens e regras): `auditoria/RELATORIO.md` e `auditoria/REGRAS-FASES.md`.
