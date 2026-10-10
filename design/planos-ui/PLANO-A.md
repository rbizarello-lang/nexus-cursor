# PLANO A · Linguagem visual do Nexus Prumo — “Prumo com luz”

Designer A (lente: cor, degradê, profundidade, superfícies, ritmo tipográfico, ícones, vazios, dados, urgência, divisórias e cartões). Só o Nexus Prumo (`uiEdition: 'claude'`). Clássico, Beta e Demo ficam idênticos.

**Arquivos desta entrega** (pasta `design-a/`):

| Arquivo | O que é |
|---|---|
| `PLANO-A.md` | Este plano |
| `vitrine-a.html` | Vitrine autocontida: o **HTML e o CSS reais** do build congelado de 10/10/2026 (fragmentos capturados do app rodando), com a proposta aplicada por cima. Antes/Depois por tela e geral, tema Ardósia/Noite/Grafite, intensidade Sutil/Viva (só para calibrar) e títulos em serifa (opcional). Aceita `?theme=noite&state=before&serif=0&vivid=1&dr=soon` |
| `src/proposta.css` | As regras da proposta. Na vitrine ficam sob `.va-after`; no app viram regras `.cx-*` normais do bloco EDIÇÃO CLAUDE |
| `shots/*.png` | Capturas da vitrine nos três temas (1440 px) e no celular (420 px) |

---

## 1. Visão

O Prumo já acertou o difícil: tokens únicos, escala tipográfica pequena, chips e etiquetas quietos, uma tira de KPI só, um cartão de intimação afinado. O que falta é **hierarquia de luz**: hoje toda superfície é um retângulo branco com o mesmo fio cinza sobre o mesmo fundo, e a urgência mora quase só na cor do texto. A proposta mantém a ardósia sóbria, densa e pequena e acrescenta **uma camada de luz com função**. Um degradê muito suave, menta → lavanda → pêssego como na referência, acende o topo de cada página e a cor da própria operação no cabeçalho dela. O **calor** do prazo (vencido, hoje/amanhã) aparece como uma lavagem que nasce da coluna Prazo. A **passagem do tempo** (régua, horizonte, progresso) vira degradê, e uma **borda viva** marca o único cartão que merece o olhar primeiro. Nenhuma fonte cresce, nenhum dado novo, nenhuma tela muda de lugar. Se a luz for desligada (alto contraste, cores forçadas, impressão), nada se perde.

## 2. Princípios

1. **Degradê é luz, não tinta.** Baixa saturação, atrás do conteúdo, nunca dentro de letras. Texto continua ≥ 4,5:1 sobre qualquer ponto do degradê (medido, ver §9).
2. **Cada degradê tem um papel**, e só cinco existem: **atmosfera** (topo da página), **identidade** (operação), **calor** (prazo), **tempo** (régua/horizonte/progresso) e **destaque** (um cartão por tela). Fora disso, cor chapada.
3. **Tempo em degradê, quantidade em cor chapada.** Barras de crédito, anéis de indisponibilidade, contagens e barras de tribunal **não** ganham degradê: decorar uma marca de quantidade distorce a leitura (Tufte/Few, §3).
4. **Uma luz por tela, um destaque por tela.** Página com cabeçalho de operação não tem atmosfera no corpo; só um cartão por tela recebe a borda de destaque.
5. **Nunca só cor.** O calor reforça o que já existe (a data, o rótulo do grupo, a marca URGENTE, as formas ◆○■▼⬢). Ele nunca é o único portador da informação (WCAG 1.4.1).
6. **Densidade intocada.** Nada de padding novo, nada de fonte maior (exceto o h1 em serifa, 22 → 23 px, opcional). O card de intimação e as Frentes (`.cx-bfx*`) não mudam de medida.
7. **Três temas simétricos.** Todo token novo existe em Ardósia, Noite e Grafite. No escuro, a profundidade vem da superfície mais clara e de um fio de luz no topo, não da sombra (Atlassian, Material 3).
8. **Movimento raro e opcional.** Três microinterações no app inteiro, todas desligadas com `prefers-reduced-motion: reduce`.

## 3. O que a pesquisa trouxe (e de onde)

| Referência | O que levo | Onde entra |
|---|---|---|
| Material 3, papéis tonais de superfície ([material.io](https://material.io/blog/tone-based-surface-color-m3), [Flutter: novos papéis](https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles)) | Elevação por **tom** de superfície (container lowest → highest), não por sombra | `--cx-elev-*`, temas escuros |
| Atlassian, elevação ([atlassian.design/foundations/elevation](https://atlassian.design/foundations/elevation)) | Quatro níveis: *sunken*, *default*, *raised*, *overlay*. No escuro, a superfície mais alta é a mais clara | Escala 0–3 do §5 |
| Fluent 2, elevação ([fluent2.microsoft.design/elevation](https://fluent2.microsoft.design/elevation)) | Sombra-chave nítida + sombra ambiente difusa; o tamanho diz a distância | `--cx-elev-2` em duas camadas |
| Josh Comeau, sombras ([joshwcomeau.com](https://www.joshwcomeau.com/css/designing-shadows)) | Sombras em camadas e com o matiz do fundo, para não “sujar” | Valores de `--cx-elev-1/2` |
| Linear, redesenho de 2024 e refresh de 2026 ([2024](https://linear.app/now/how-we-redesigned-the-linear-ui), [2026](https://linear.app/now/behind-the-latest-design-refresh)) | Menos ruído, separadores mais suaves, barra lateral um tom abaixo, menos ícones, densidade mantida | Divisórias que se apagam (`--cx-rule`), menu |
| Stripe, cores acessíveis ([stripe.com/blog](https://stripe.com/blog/accessible-color-systems)) | Paleta em espaço perceptual; contraste garantido por construção | Misturas com `color-mix` em cima dos tokens já testados |
| Radix Colors, 12 passos ([radix-ui.com](https://radix-ui.com/themes/docs/theme/color)) | Papéis fixos por passo (fundo, borda, sólido, texto) | Separar “lavagem” (fundo), “tampa” (borda) e “tinta” (texto) do mesmo tom |
| OKLCH/`color-mix` em temas ([flaviocopes.com](https://flaviocopes.com/css-oklch-color-mix/)) | Misturar o acento **com o token de superfície**, não com branco/preto, para o escuro funcionar sozinho | Todas as lavagens |
| Vercel/Geist ([vercel.com/geist](https://vercel.com/geist)) | Degradê confinado a um lugar nobre; o resto, neutro | “Uma luz por tela” |
| Arc (leitura de terceiros: [open-design.ai](https://open-design.ai/plugins/design-system-arc/)) | Lavagens tingidas no lugar de bordas; cor do espaço como identidade | Identidade da operação |
| Raycast (leitura de terceiros: [hagicode](https://design.hagicode.com/designs/raycast/)) | Fio de luz interno no topo das superfícies escuras; bordas brancas de baixa opacidade | `--cx-hi` |
| Apple HIG, materiais ([developer.apple.com](https://developer.apple.com/design/human-interface-guidelines/materials)) | Hierarquia entre conteúdo e controles; material pelo papel, não pela cor | Gaveta/janela no nível 3 |
| IBM Carbon, indicadores de estado ([carbondesignsystem.com](https://carbondesignsystem.com/patterns/status-indicator-pattern/)) | Estado = forma + cor + rótulo; em grupo, vale a cor mais grave | Calor nos grupos e KPIs |
| WCAG 1.4.1 e 1.4.11 ([uso de cor](https://w3c.github.io/wcag/understanding/use-of-color), [contraste não textual](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast)) | Cor nunca sozinha; marcas com significado ≥ 3:1 | Regras do calor, tampas de 2 px |
| Tufte/Few ([sparklines](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/), [dashboards](https://speckyboy.com/designing-information-dashboards/)) | Razão dado/tinta; gráfico do tamanho de uma palavra; não decorar quantidade | Princípio 3, sparkline do KPI |
| Material 3 Expressive ([relato](https://designdosage.substack.com/p/expressive-ui-in-material-design), [processo](https://chromeunboxed.com/google-leaks-the-reason-and-process-behind-their-new-material-3-expressive-design-language)) | Cor, forma e contenção ajudam a achar o que importa; o “livre” prejudicou a clareza | Destaque único, contenção por elevação |
| Gradientes de malha em CSS ([openreplay](https://blog.openreplay.com/modern-css-background-effects/), [desempenho](https://tryhoverify.com/blog/i-wish-i-had-known-this-sooner-about-css-gradient-performance/)) | Radiais empilhadas (≤ 3–4 camadas), baixa saturação, sem animar o degradê | `--cx-aura` com 3 radiais |
| Bordas em degradê ([css-tip](https://css-tip.com/border-gradient/), [CodyHouse](https://www.codyhouse.co/nuggets/css-gradient-borders)) | Duas camadas `padding-box` / `border-box` com borda transparente; funciona com raio | `--cx-edge-feat`, `--cx-edge-hot` |
| MDN, media queries de acessibilidade ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility)) | `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` | §5.4 |
| Vazios: Carbon e Atlassian ([Carbon](https://carbondesignsystem.com/patterns/empty-states-pattern/), [Atlassian](https://atlassian.design/content/designing-messages/empty-state)) | Dizer o que vem a seguir; no máximo uma ação; ilustração mínima | `CxEmpty` |
| Fraunces ([Google Fonts](https://fonts.google.com/specimen/Fraunces/about), [repositório](https://github.com/googlefonts/fraunces)) | Serifa display com eixo óptico (opsz 9–144): fica fina e elegante em 22–23 px | Títulos editoriais (opcional) |

## 4. Diagnóstico visual (a partir das 38 telas nos três temas)

- **Tudo pesa igual.** KPI, fila, callout, tabelas: todos `surface` + fio `--cx-line` + raio 10 sobre `ground`. Sem sombra em repouso, o olho não sabe por onde começar.
- **Urgência só na tinta.** Vencido e “amanhã” são data vermelha/laranja; o grupo “Vencidas” tem a mesma faixa cinza de “Mais adiante”. Os sinais fortes (URGENTE, alarme) estão certos, mas não há **gradação**.
- **Páginas sem lugar.** Hoje, Intimações, Carteira e Painel começam igual (h1 22 px sobre ardósia lisa). A operação tem identidade só num quadradinho de 14 px.
- **Linhas demais, todas iguais.** Divisórias cheias entre blocos de gaveta, rodapés de cartão, grupos: cada fio pesa o mesmo e soma ruído.
- **Vazios mudos.** “—”, “Nenhuma … ainda.” e a caixa tracejada do Quadro não dizem nada sobre a tela.
- **Escuro achatado.** Nos temas Noite e Grafite as sombras quase somem; cartões e fundo se confundem.
- **Contraste do ink-3 na Ardósia.** `--cx-ink-3` (#7c828e) dá **3,48:1 sobre o ground** (3,86:1 sobre o branco), abaixo de 4,5:1 para texto miúdo, e é a cor de eyebrows, rótulos de KPI, cabeçalhos de tabela e metadados. O teste de contraste só cobre os temas escuros.

## 5. Tokens novos (valores para os três temas)

Todos entram no bloco de tokens do Prumo em `src/Nexus.shell.html`. Os de cor também entram nos blocos `.cx-theme-noite` e `.cx-theme-grafite`, porque `test/theme-tokens.test.mjs` exige paridade. Os que não são cor vão para `NOT_COLOUR`: `--cx-aura-h`, `--cx-id-a`, `--cx-wash-a` e `--cx-font-display`.

### 5.1 Ardósia (bloco base `.app-layout.edition-claude`)

```css
--cx-font-display: 'Fraunces', Georgia, 'Times New Roman', serif;   /* só com “Títulos em serifa” */
--cx-ink-3s: #5f6570;            /* ink-3 forte: texto miúdo sobre aura, lavagem e painel (≥ 4,5:1 em todos) */
--cx-today-ink: #9a4d12;         /* data “hoje/amanhã” sobre a lavagem laranja (5,2:1; o laranja puro dá 3,7:1 ali) */
/* Atmosfera */
--cx-aura-a: #e2f1ea;            /* menta */
--cx-aura-b: #e9e8f7;            /* lavanda */
--cx-aura-c: #f7eadf;            /* pêssego */
--cx-aura-h: 280px;
--cx-aura: linear-gradient(180deg, var(--cx-ground), transparent 52px),
           radial-gradient(48% 230px at 0% 0%, var(--cx-aura-a), transparent),
           radial-gradient(42% 210px at 52% 0%, var(--cx-aura-b), transparent),
           radial-gradient(46% 240px at 100% 0%, var(--cx-aura-c), transparent);
/* Identidade e calor */
--cx-id-a: 16%;                  /* força da cor da operação no cabeçalho */
--cx-wash-a: 9%;                 /* força da lavagem de calor */
--cx-heat-ramp: linear-gradient(90deg, var(--cx-red), var(--cx-orange) 34%, var(--cx-yellow) 67%, var(--cx-line-strong));
/* Bordas vivas */
--cx-edge-feat: linear-gradient(120deg, #8ccfb3, #aea8e6 50%, #e8b386);
--cx-edge-hot: linear-gradient(120deg, var(--cx-red), var(--cx-orange) 58%, color-mix(in srgb, var(--cx-yellow) 60%, var(--cx-line)));
/* Elevação: 0 plano · 1 repouso · 2 destaque/hover · 3 flutuante (= --cx-shadow-lg, já existe) */
--cx-elev-1: 0 1px 2px rgba(20,24,32,0.045), 0 1px 0 rgba(20,24,32,0.02);
--cx-elev-2: 0 1px 2px rgba(20,24,32,0.05), 0 12px 28px -12px rgba(20,24,32,0.22);
--cx-hi: inset 0 1px 0 rgba(255,255,255,0.6);       /* fio de luz (quase invisível no claro) */
--cx-accent-grad: linear-gradient(180deg, #b38a3d, #8a6722);
--cx-rule: linear-gradient(90deg, var(--cx-line-strong), var(--cx-line) 45%, transparent);
```

### 5.2 Noite (`.cx-theme-noite`)

```css
--cx-ink-3s: #a3acb8;  --cx-today-ink: var(--cx-orange);
--cx-aura-a: rgba(104,213,218,0.11); --cx-aura-b: rgba(165,150,255,0.11); --cx-aura-c: rgba(255,165,109,0.085);
--cx-id-a: 20%;  --cx-wash-a: 12%;
--cx-edge-feat: linear-gradient(120deg, rgba(104,213,218,0.62), rgba(165,150,255,0.58) 50%, rgba(255,165,109,0.58));
--cx-elev-1: 0 1px 2px rgba(3,8,16,0.35);
--cx-elev-2: 0 1px 2px rgba(3,8,16,0.40), 0 14px 32px -12px rgba(3,8,16,0.70);
--cx-hi: inset 0 1px 0 rgba(255,255,255,0.045);
--cx-accent-grad: linear-gradient(180deg, #e2c483, #caa75f);
/* --cx-aura, --cx-heat-ramp, --cx-edge-hot e --cx-rule: mesma receita do base (repetir no bloco para o teste de paridade) */
```

### 5.3 Grafite (`.cx-theme-grafite`)

```css
--cx-ink-3s: #a6a7a9;  --cx-today-ink: var(--cx-orange);
--cx-aura-a: rgba(110,222,145,0.07); --cx-aura-b: rgba(201,172,255,0.075); --cx-aura-c: rgba(202,167,95,0.10);
--cx-id-a: 18%;  --cx-wash-a: 12%;
--cx-edge-feat: linear-gradient(120deg, rgba(110,222,145,0.48), rgba(201,172,255,0.48) 50%, rgba(202,167,95,0.62));
--cx-elev-1: 0 1px 2px rgba(0,0,0,0.35);
--cx-elev-2: 0 1px 2px rgba(0,0,0,0.40), 0 14px 32px -12px rgba(0,0,0,0.70);
--cx-hi: inset 0 1px 0 rgba(255,255,255,0.04);
--cx-accent-grad: linear-gradient(180deg, #e2c483, #caa75f);
```

**Calibragem.** A vitrine tem “Intensidade: Sutil | Viva”. A Viva usa a mesma receita com mais pigmento: Ardósia `#d6eee2 / #e2dff7 / #f6e0cc` e lavagem de 13%; Noite com alfas 0,17/0,17/0,13 e Grafite com 0,11/0,11/0,15. O valor final sai da fase G1, numa conversa com o usuário. Não é uma opção do ⚙. Na Viva da Ardósia o `--cx-ink-3s` precisa ficar em `#5f6570` (que já é o proposto) para manter 4,5:1 sobre a lavanda.

**Escala de calor (a que o app já usa, agora nomeada):** 4 vencido (`--cx-red`) · 3 hoje/amanhã (`--cx-orange`) · 2 de 2 a 5 dias (`--cx-yellow`) · 1 depois (`--cx-line-strong` / ink-3). É a mesma de `cxDue` e da Carga de prazos.

### 5.4 Testes a acrescentar

- `test/theme-contrast.test.mjs`: passar a cobrir a **Ardósia** também. `--cx-ink-3s` ≥ 4,5 sobre `ground`, `surface`, `panel` e sobre `--cx-aura-a/b/c` (cores opacas na Ardósia; nos escuros, compor o alfa sobre o `ground` antes de medir). `--cx-today-ink` ≥ 4,5 sobre a lavagem laranja composta.
- `test/theme-tokens.test.mjs`: novos tokens não-cor em `NOT_COLOUR`.
- Opcional, mas recomendado: decidir se o `--cx-ink-3` da Ardósia sobe para `#676d78` (4,7:1 no ground). Muda levemente todos os rótulos cinzas. Alternativa menor: só eyebrows, `th` e `.cx-cap` passam a usar `--cx-ink-3s`.

## 6. Tratamentos que valem para o app inteiro

Nos exemplos, os seletores são os do app (o bloco do Prumo já escreve `.cx-*` sem prefixo). As regras completas estão em `src/proposta.css` (lá sob `.va-after`).

### 6.1 Atmosfera da página
```css
.cx-scroll { position: relative; }
.cx-scroll::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: var(--cx-aura-h);
  background: var(--cx-aura); pointer-events: none; z-index: 0; }
.cx-scroll > * { position: relative; z-index: 1; }
.cx-oph ~ .cx-scroll::before { display: none; }      /* na operação, a luz mora no cabeçalho */
.cx-eyebrow, .cx-cap { color: var(--cx-ink-3s); }
```
O pseudo-elemento absoluto rola com o conteúdo (sobe e some) e não atrapalha a rolagem composta. A vitrine usa `background-attachment: local`, que é mais simples. No app prefira o `::before`: o `local` pode forçar repintura na rolagem do Chrome em listas longas. Antes, confira que nenhum filho direto de `.cx-scroll` dependa de `position: static`.

### 6.2 Identidade da operação
- `.cx-oph` ganha `--op` (JSX, uma linha em `EditionClaudeOpHeader`: `style={{ '--op': cxOpColor(op) }}`) e o fundo: radial da cor da operação a `--cx-id-a` no canto esquerdo, lavanda no meio, pêssego à direita, sobre o `ground`.
- `.cx-tile` (iniciais da operação: Carteira, Hoje, Visão geral): degradê 150° da cor a 26% → 8% + `--cx-hi`. A mesma receita vale para os avatares da ficha da pessoa (PF redondo, PJ quadrado).

### 6.3 Elevação e cartões
- Nível 0 (plano): painéis recuados, colunas do Quadro e da Mesa, trilhas, `.cx-kc-pair`, linha aberta das Frentes. Só `surface-2`.
- Nível 1 (repouso): `.cx-card, .cx-ks, .cx-list, .cx-fold, .cx-op-card, .cx-b-card, .cx-pz-card:not(.zero)` → `box-shadow: var(--cx-elev-1), var(--cx-hi)`.
- Nível 2 (destaque/hover): `--cx-elev-2` + borda `--cx-edge-feat` em duas camadas (`padding-box`/`border-box`, borda transparente).
- Nível 3 (flutuante): gaveta, janela, menu, ⌘K, toast. O `--cx-shadow-lg` atual mais `--cx-hi` no escuro.

### 6.4 Destaque (um por tela)
| Tela | Quem recebe | Borda |
|---|---|---|
| Hoje | Aviso da audiência (`.cx-callout`) | `--cx-edge-hot` + lavagem laranja 12% → superfície |
| Intimações · Foco | Cartão em foco (`.cx-focus-card`) | `--cx-edge-feat` |
| Partes | Aviso “exposições > crédito” | `--cx-edge-hot` |
| Linha do tempo · Frentes | Cartões “Caminho crítico” | `--cx-edge-hot` |
| Carteira | Cartão sob o mouse/foco (`:hover, :focus-visible`) | `--cx-edge-feat` + sobe 2 px |
| Importar | Zona de soltar durante o arraste | `--cx-edge-feat` |

### 6.5 KPI (tira única `.cx-ks`)
- **Tampa de estado:** 2 px no topo do cartão, no tom do estado, apagando até 78% da largura. Só quando o cartão descreve um estado: `.cx-red-t`, `.cx-orange-t` ou `.cx-violet-t`, ou `.cx-kc-v/.cx-kc-d` com tom. Ganha também uma luz de 6% no canto. Neutros não mudam.
- Só CSS, com `:has()`. Ordem de precedência: vermelho > laranja > violeta (vale o mais grave, como no Carbon).
- Sparkline do KPI de intimações: a última barra usa `--cx-accent-grad` (único degradê de dado permitido, porque marca “agora”).
- Valor zero (Minha atividade, Acompanhar “Encerrados 0”): JSX passa `zero` e o número vai a `--cx-ink-3s` (menos ruído).

### 6.6 Calor (marcadores de urgência)
- **Lavagem do prazo:** `linear-gradient(270deg, tom a --cx-wash-a, transparente em 300px)` nas linhas com prazo vencido (vermelho) ou hoje/amanhã (laranja). Linhas: `.cx-ix`, `.cx-q-row`, `.cx-t-row`, `.cx-w-row` (conferência > 7 dias) e `.cx-mesa-row.g1`. Ela nasce do lado da data. 2 a 5 dias fica só com a cor da data, como hoje.
- **Data sobre a lavagem:** “hoje/amanhã” passa a `--cx-today-ink` (laranja aprofundado), para ficar ≥ 4,5:1.
- **Faixa do grupo** (`.cx-grp`, `.cx-pz-fold`, grupos da Agenda/Tarefas): `linear-gradient(90deg, tom 12%, transparente 46%)` herdado do ponto do grupo.
- **Marca URGENTE manual** (`.cx-ix.urgent::before`): 3 px, vermelho → laranja. Continua separada do calor do prazo.
- **Barras laterais de estado** (`.cx-pz-card::before`, `.cx-mesa-row::before`, audiências da Agenda, Acompanhar, Biblioteca Serve/Não serve): rampa do tom forte em cima para 30% embaixo.
- **Aviso do topo** (`.cx-banner`): laranja 15% → 4% → superfície (vermelho no `.today` e no erro de sincronização).
- **Robustez:** a primeira entrega usa `:has()` sobre as classes que já existem (`.cx-due.late/today`, `.cx-ruler-big.late`, `.cx-dot[style*=cx-red]`). Numa segunda passada, opcional, o JSX expõe `data-heat="late|today|soon"` em `CxIntimRow`, `CxTaskRow`, `CxWatchRow` e na gaveta. Fica mais legível e mais barato para o navegador.

### 6.7 Tempo (degradê legítimo)
- Régua do prazo (`.cx-fill`): decorrido de 18% → 85% do tom do prazo; “agora” (`.cx-now`) com halo de 5 px do acento; a caixa ganha borda tingida de 30% e o fundo `surface → surface-2`.
- `CxHorizonBar` (Processos/Inscrições), `CxClkBar` (Relógios, que já usa degradê: só passa aos tokens), mini-faixa da ficha: mesma rampa.
- Foco: barra de progresso `.cx-progress i` em degradê de acento.
- Horizonte de 90 dias (O que vem): as colunas “Atrasados” e “Esta semana” deixam o fundo chapado (red-soft/amarelo) por um degradê vertical que se apaga, de 100% no cabeçalho até transparente.
- Panorama: a janela de foco recebe `--cx-aura-b` a 40% (fica claro o que está em escala real), e a linha “Hoje” ganha brilho vertical que se apaga nas pontas.
- Atualização por fonte (Importar): verde → amarelo → vermelho é idade, portanto tempo. A legenda vira rampa.

### 6.8 Divisórias e cabeçalhos de seção
- `--cx-rule` (fio que se apaga) substitui a linha cheia em: blocos da gaveta (`.cx-blk`), rodapé do cartão da Carteira (`.cx-oc-f`), `.cx-mt-cap` / `.cx-sec-t` (“Onde este prazo cai no processo”), dias da Minha atividade, grupos dos Relógios e da Mesa de prazos, “Banco · 6” da Biblioteca.
- Componente novo `.cx-rule-h`: rótulo `.cx-cap` + fio. Com `.heat` e `--tone`, o quadradinho e o começo do fio levam o tom do grupo (Crítico, Alerta…).
- Linhas de tabela e de lista **continuam cheias** (são grade de leitura, não seção).

### 6.9 Chips, etiquetas e pílulas
Ficam como a auditoria deixou (chip 22, tagk 18, pill 18, contornos neutros com ponto colorido). A única mudança é que o chip ativo de filtro (`.cx-fchip.on`) ganha `--cx-hi`. Nada de degradê em etiqueta: elas são classificação, não luz.

### 6.10 Gavetas, fichas e janelas
- Gavetas (`.cx-drawer`: intimação, processo, CDA, pessoa, bem, documento): nível 3. O topo do corpo recebe uma **aura de calor** no canto direito, com o tom da régua (`:has(.cx-ruler-big.late|today|soon)`) ou do pior grupo de prescrição (`:has(.cx-presc.g1|g2)`), mais lavanda à esquerda. Quando não há calor, fica menta.
- Título da gaveta (`.cx-d-title`) em serifa se a opção estiver ligada.
- Janelas (`.modal` no Prumo): faixa de 56 px com `--cx-aura` no cabeçalho; o resto igual.

### 6.11 Vazios (`CxEmpty`, componente novo)
Círculo de 34 px com a luz da atmosfera, o ícone da própria tela (`CX_ICONS`), uma frase (título 13/500, texto 12,5 ink-2) e no máximo uma ação (`.cx-link-btn`). Duas formas: em linha (listas) e em coluna (Quadro, Mesa, Agenda). Substitui: “Arraste um cartão para cá”, `.cx-empty-row`, o “—” dos dias vazios da Agenda, a Mesa sem itens, a Minha atividade sem registros, a fila do Foco concluída e as abas vazias da operação.

### 6.12 Menu lateral, barra superior, toasts
- Item ativo: o marcador de 3 px vira `--cx-accent-grad`; a marca “N” ganha degradê de tinta com um toque de acento. A contagem vermelha fica como está.
- Sincronizando: um fio de 2 px sob a barra superior com o degradê da atmosfera correndo. É a única animação contínua, só enquanto sincroniza; com movimento reduzido fica parado.
- Toast: sem mudança (tinta sobre ground já é nível 3).

### 6.13 Ícones
Mesma família (`CX_ICONS`, traço 1,5–1,75). Ícones de **contexto** (Precisa de atenção, callout, vazios) ficam dentro de um “chip de ícone”: 24–34 px, degradê suave do tom e borda de 1 px. Ícones de **ação** continuam soltos e cinzas. Nenhum ícone novo é desenhado.

### 6.14 Tipografia
- Escala `--cx-fs-*` intocada.
- **Títulos editoriais (opcional, ⚙ → “Títulos em serifa”)**: Fraunces 600 em `.cx-page-h h1`, `.cx-hello`, `.cx-oph-name h1` e `.cx-d-title`, 22 → 23 px no h1 e opsz automático. A Fraunces **já está no link de fontes do shell** (500/700): basta acrescentar o 600. Sem a opção, nada é baixado além do que já é hoje. Números, tabelas, rótulos e corpo seguem a fonte do ⚙ (Geist/Inter/Outfit/Source Sans). Preferência de interface (`appSettings`), não dado.
- `text-wrap: balance` nos h1 e títulos de gaveta, que já usam em parte.

### 6.15 Visualização de dados
- Paleta: categórica = `--cx-op1..6`; sequencial de urgência = escala de calor; divergente favorável/desfavorável = verde/vermelho **com forma** (◆ cheio/vazado, como já está).
- Degradê só em tempo (6.7). Quantidade em cor chapada: anel de indisponibilidade, barras do Painel, barra por tribunal, barras de subtotal.
- Linhas de grade e traços: `--cx-tick`; a faixa de “hoje” (Carga de prazos, Pulso, Panorama) vira uma banda vertical com `--cx-accent` a 10% → 0.

## 7. Plano por tela

Legenda: **CSS** = só CSS no bloco do Prumo · **JSX** = toque pequeno em `src/edition-claude.jsx` · fase entre colchetes.

**Casca (todas as telas)**
- Menu: marcador e marca com luz de acento. CSS [G2]
- Aviso do topo (`.cx-banner`): degradê que se apaga. CSS [G3]
- Fio de sincronização sob a barra superior. CSS + JSX (classe enquanto sincroniza) [G8]
- Busca ⌘K: nível 3 + 40 px de aura no topo da caixa. CSS [G2]

**Hoje** (vitrine §02)
- Atmosfera no topo; saudação em serifa (opção). CSS [G1/G7]
- Tampas de estado nos 4 KPIs (hoje: vermelho, laranja, violeta; Crédito neutro). CSS [G3]
- Carga de prazos: legenda vira rampa de calor; coluna de hoje com banda de acento; cartão em repouso. CSS [G4]
- Fila do dia: lavagem em vencido/hoje (aba Vencidos e itens de amanhã). CSS [G3]
- Aviso da audiência: **destaque único**, borda quente + “respiro” no ícone (2 ciclos). CSS [G2/G8]
- Precisa de atenção: ícones (ampulheta/relógio) em chip de ícone. CSS [G6]
- Prazos extintivos (cartões da Mesa): barra em rampa. CSS [G3]
- Carteira (tabela): tiles em degradê. CSS [G1]

**Intimações · lista** (vitrine §03)
- Faixa de grupo com calor; lavagem do prazo; URGENTE 3 px; aviso do topo. CSS [G3]
- O card (tamanhos, colunas, zona de notas, coluna Indicadores V1) **não muda**.

**Intimações · Quadro**
- Colunas no nível 0, cartões no 1 e hover no 2. CSS [G2]
- Cabeçalho da coluna: fio de 2 px no tom da situação, apagando. CSS [G3]
- Coluna-alvo do arraste com `--cx-edge-feat`; o cartão arrastado sobe ao nível 3 e inclina 0,6°. CSS [G8]
- Coluna vazia: `CxEmpty` em coluna. JSX [G5]

**Intimações · Foco**
- Cartão em foco = destaque (`--cx-edge-feat`, nível 2). CSS [G2]
- Progresso em degradê de acento; “Fila concluída” com `CxEmpty` grande. CSS/JSX [G4/G5]

**Gaveta da intimação** (vitrine §04)
- Aura de calor no topo; régua com decorrido em degradê, halo do “agora” e borda tingida. CSS [G6]
- Fios que se apagam entre os blocos e em “Onde este prazo cai no processo”. CSS [G5]
- Trilha “você está aqui” (`CxMiniTrail`): segmento cumprido em degradê de verde até o acento do “Este prazo”. CSS [G4]

**Tarefas** (lista e quadro)
- Mesmo calor da lista de intimações (`.cx-t-row`), faixa de grupo, URGENTE. CSS [G3]
- Criação rápida: anel de foco do acento com `--cx-hi`. CSS [G2]
- Quadro: como o de Intimações. CSS [G2/G8]

**Mesa de intimações**
- Colunas no nível 0, cartões no 1; arrastar = nível 3 + inclinação (microvisual exclusivo). CSS [G8]
- Linha “vencido há N dias” do cartão com `--cx-today-ink`/vermelho e lavagem. CSS [G3]
- Mesa vazia: `CxEmpty` (“Escolha o que atacar agora”). JSX [G5]

**Agenda**
- Coluna de hoje: a faixa bege chapada vira aura vertical (acento 10% → 0) e o número do dia em pílula de acento. CSS [G4]
- Itens da semana: barra lateral em rampa. CSS [G3]
- Lista de audiências: a borda esquerda (vermelha/âmbar pela proximidade) vira rampa; “em 2 dias” com `--cx-today-ink` quando for amanhã. CSS [G3]
- Dia vazio: o “—” vira um ponto discreto (sem frase, a grade é densa). CSS [G5]
- Grupos da lista de 30 dias com `.cx-rule-h`. JSX [G5]

**Acompanhar**
- KPI “Sem conferência há 7+ dias” com tampa laranja; “Em acompanhamento” (ativo) com `--cx-hi`. CSS [G3]
- Linha sem conferência há mais de 7 dias: rampa laranja e lavagem do lado de “verificado há”. CSS [G3]

**Linha do tempo**
- Panorama: janela de foco com lavanda a 40%; linha “Hoje” com brilho que se apaga nas pontas; faixa-resumo em repouso. CSS [G4]
- Frentes (metrô): ao realçar a cadeia, `drop-shadow` do tom nas estações ativas (exclusivo); cartões “Caminho crítico” com `--cx-edge-hot`. CSS [G8/G2]
- Prescrição (Relógios): barras já em degradê passam aos tokens; grupos com `.cx-rule-h.heat`; KPIs com tampa. CSS/JSX [G4/G5]
- Narrativa: o divisor “Hoje” vira uma faixa de luz horizontal (acento → lavanda → transparente); a borda grossa dos cartões de decisão passa a degradê do tom do desfecho. CSS [G4]

**Prazos extintivos · Mesa de prazos / Relógios / Lista completa** (vitrine §07)
- Cartões de providência e linhas com barra em rampa; grupo 1 com lavagem do prazo; zerados planos. CSS [G3]
- Seções (Ajuizar, Completar dado…) com faixa de grupo no tom. CSS [G3]
- Relógios: como na Linha do tempo. Lista completa (componente clássico): só tokens, sem regra nova.

**Carteira** (vitrine §06)
- Tile em degradê; cartão em repouso; hover/foco no nível 2 com borda de destaque e subida de 2 px (sem subida com movimento reduzido). CSS [G1/G2]
- Rodapé com fio que se apaga; Pulso com banda de “hoje” em acento. CSS [G5/G4]
- Anel e pílulas: sem mudança (quantidade).

**Painel**
- KPIs com tampa (Risco prescricional violeta, Intimações vermelho se houver vencida, Revisões laranja). CSS [G3]
- Tabela de operações: barras de crédito chapadas (quantidade); linha de total com fio superior `--cx-rule`. CSS [G5]
- Prescrição na carteira: cartões da Mesa em rampa. CSS [G3]

**Minha atividade**
- KPIs zerados em `--cx-ink-3s`; dias com `.cx-rule-h`; período sem registro com `CxEmpty` (“Nada alterado neste período”). JSX [G5]

**Biblioteca**
- Modelo selecionado: marcador de 3 px em `--cx-accent-grad`. Faixa “Vigência a reconferir” com tampa laranja. Serve/Não serve com barra em rampa verde/vermelha. CSS [G2/G3]
- Não muda a ficha nem a lista (vem do app; só CSS escopado).

**Operação · cabeçalho** (vitrine §05)
- Identidade: aura com a cor da operação (`--op`); nome em serifa (opção). JSX (uma linha) + CSS [G1/G7]
- Abas: sem mudança (o sublinhado em tinta já é o certo).

**Operação · Visão geral / Frentes / Mural / Painel de apoio**
- KPIs em par com tampa onde houver estado. CSS [G3]
- Frentes: linha aberta no nível 0; régua de fases com o trecho cumprido em degradê até a fase atual; selo de fase sem mudança. CSS [G4]
- Mural (a única peça estilizada): papel com degradê vertical sutil (topo 4% mais claro) e sombra de nota levantada; o vencido mantém a pílula vermelha. CSS [G8]
- Painel de apoio: Horizonte com colunas que se apagam (6.7); abas sem mudança. CSS [G4]

**Processos e prescrição**
- KPIs com tampa (“No alarme” vermelho). CSS [G3]
- Coluna Prescrição: `CxHorizonBar` em rampa; termo vencido com lavagem do lado da data. CSS [G4/G3]
- Curvas de vínculo (`CxTreeMark`) sem mudança; barra de lote no pé: nível 3 com fio `--cx-edge-feat` no topo. CSS [G2]
- **Ficha do processo:** aura pelo pior grupo de prescrição; trilha de fases com a linha cumprida em degradê; mini-faixa de prescrição em rampa. CSS [G6/G4]

**Inscrições**
- Igual a Processos. A gaveta da CDA ganha aura pelo grupo (`.cx-presc.g1..g4`); as colunas Intercorrente/Ordinária, que já têm selos “estimado/calculado”, recebem só o nível 1. CSS [G6]

**Partes**
- Aviso “exposições somadas > crédito” = destaque quente. Ficha da pessoa: avatar em degradê de identidade. CSS [G2/G1]

**Bens**
- KPIs clicáveis: o ativo (`.cx-kc.on`) ganha `--cx-hi` e tampa de acento. Valor Sisbajud em destaque, sem mudança. CSS [G3]

**Tarefas (operação) e Arquivos**
- Como Tarefas. Arquivos: bloco “Origem: intimação” no nível 0, vazio com `CxEmpty`. CSS/JSX [G5]

**Importar**
- Zona de soltar: durante o arraste, `--cx-edge-feat` + aura de lavanda (exclusivo). A legenda de idade das fontes vira rampa. CSS [G8/G4]

**⚙ Ajustes**
- Os botões de tema mostram uma amostra de 10 px da aura de cada tema (exclusivo); novo seletor “Títulos em serifa”. JSX [G7]

**Formulários (janelas)**
- Faixa de aura de 56 px no cabeçalho; nível 3; o resto igual (a lógica é do app). CSS [G2]

**Celular (≤ 860 px)**
- Mesma receita. A aura usa `background-size: 100% 220px`, as lavagens vão a 200 px e não há hover/subida. O anel continua sumindo abaixo de 560 px, como hoje.

## 8. Microvisuais exclusivos (só onde cabem)

| Onde | O quê | Por quê ali |
|---|---|---|
| Hoje · aviso da audiência | “Respiro” do ícone: halo de 6 px, 2 ciclos de 2,4 s, só ao abrir | É o único evento com hora marcada da tela |
| Gaveta da intimação/CDA/processo | Aura de calor pelo tom da régua ou do grupo de prescrição | A gaveta é onde se decide; o canto diz o quão quente está |
| Mesa de intimações e Quadros | Cartão arrastado sobe ao nível 3 e inclina 0,6°; a coluna-alvo ganha borda viva | Feedback físico de arrastar |
| Carteira | Hover: sobe 2 px + borda de destaque | Cartão é a porta da operação |
| Linha do tempo · Frentes | Brilho da cadeia realçada | Mostrar a dependência sem mais linhas |
| Linha do tempo · Narrativa | Faixa de luz no divisor “Hoje” | Separar passado e futuro sem rótulo extra |
| Importar | Zona de soltar acende durante o arraste | Confirma que o arquivo vai cair no lugar certo |
| Barra superior | Fio de luz correndo enquanto sincroniza | Estado de sistema discreto, que some quando acaba |
| Mural | Papel com leve degradê e sombra de nota | A única peça que o usuário aceitou mais estilizada |
| ⚙ | Amostra da aura em cada botão de tema | Escolher tema vendo a luz |

Todos com `@media (prefers-reduced-motion: reduce)`: sem subida, sem inclinação, sem respiro, fio parado.

## 9. Riscos e como os trato

| Risco | Medida |
|---|---|
| **Contraste sobre degradê** | Medido (script em `design-a/contrast.py`). Na Ardósia, tinta ≥ 14,5:1 e ink-2 ≥ 6,2:1 sobre o pico da aura. O ink-3 cai a 3,1–3,3:1 ali, por isso eyebrows e rótulos sobre aura usam `--cx-ink-3s` (#5f6570, ≥ 4,5:1 até na intensidade Viva). Os 52 px de cima voltam ao `ground`. No escuro, ink-3 ≥ 4,7:1 sobre aura e lavagem. A data laranja sobre a lavagem cairia a 3,7:1, por isso `--cx-today-ink`. Os novos casos entram no teste de contraste (§5.4) |
| **Ruído** | Regras duras: uma atmosfera por tela, um destaque por tela, lavagem só em vencido/hoje/amanhã, nenhuma etiqueta em degradê, quantidade sempre chapada |
| **Daltonismo** | Vermelho e laranja se parecem para deuteranopia. A lavagem é redundante: a data, o nome do grupo (“Vencidas”) e a marca URGENTE carregam o sentido (Carbon/WCAG 1.4.1) |
| **Desempenho** | Degradês estáticos são baratos. Sem `backdrop-filter` em listas, sem animar degradê (só opacidade/transform), aura em pseudo-elemento absoluto (rolagem composta). `:has()` em centenas de linhas é aceitável no Chrome atual; se o perfil apontar custo, entram os atributos `data-heat` (6.6) |
| **Faixas no escuro (banding)** | Alfas baixos em radiais grandes; 3 camadas no máximo; se aparecer faixa em tela de 8 bits, acrescentar uma parada intermediária |
| **Alto contraste, cores forçadas, impressão** | `prefers-contrast: more` e `forced-colors: active` removem aura, lavagens e tampas e devolvem a borda sólida (`CanvasText`) aos destaques; `@media print` remove a aura. Nada some porque nada depende do degradê |
| **Paridade de temas e testes** | Cada token de cor nos três blocos; não-cor em `NOT_COLOUR`; contraste da Ardósia passa a ser testado |
| **Clássico/Beta** | Todo CSS novo usa classes `cx-` ou fica sob `.app-layout.edition-claude`; JSX só em `src/edition-claude.jsx`. Conferência com `cmp2.mjs` (estilos computados idênticos no Clássico e na Beta antes/depois) |
| **Card de intimação e Frentes** | Nenhuma medida muda; a lavagem fica atrás e a zona de notas mantém a própria cor |
| **Gosto (serifa, intensidade)** | Serifa é opção do ⚙, desligada por padrão no app; a intensidade é calibrada uma vez com o usuário (Sutil/Viva na vitrine) |
| **Fonte extra** | Fraunces 600 só é baixada quando a opção está ligada (`font-display: swap`) |

## 10. Roteiro por fases (PRs pequenos, cada um entregável)

Fluxo de cada fase: implementar → `npm run build` → `npm test` → Playwright (tour das 38 telas × Ardósia/Noite/Grafite × 1440 e 420) → `cmp2.mjs` provando Clássico/Beta idênticos → MELHORIAS.md → commit.

| Fase | Conteúdo | Arquivos | Esforço |
|---|---|---|---|
| **G0 · Tokens e testes** | Tokens do §5 nos 3 blocos; testes de contraste (com Ardósia) e paridade; decisão sobre `--cx-ink-3` | shell (tokens), `test/theme-*.test.mjs` | 0,5 dia |
| **G1 · Atmosfera e identidade** | Aura nas páginas (`.cx-scroll::before`), cabeçalho da operação com `--op`, tiles e avatares em degradê; calibrar Sutil/Viva com o usuário | shell; 1 linha em `EditionClaudeOpHeader` | 1 dia |
| **G2 · Elevação e destaque** | Níveis 0–3, `--cx-hi` no escuro, destaque único por tela, hover da Carteira, ⌘K, janelas, menu | shell | 1 dia |
| **G3 · Calor** | Lavagens, faixas de grupo, URGENTE 3 px, tampas de KPI, rampas laterais, aviso do topo, `--cx-today-ink` (via `:has()`) | shell | 1–1,5 dia |
| **G3b · `data-heat` (opcional)** | Atributos no JSX e troca dos `:has()` por eles | `edition-claude.jsx`, shell | 0,5 dia |
| **G4 · Tempo e dados** | Régua, horizon/clock bars, Foco, Horizonte de 90 dias, Panorama (foco e “Hoje”), Carga (banda), trilhas de fase, legenda de idade | shell | 1 dia |
| **G5 · Divisórias e vazios** | `--cx-rule`, `.cx-rule-h`, componente `CxEmpty` em cerca de 12 lugares, KPI zerado | shell, `edition-claude.jsx` | 1 dia |
| **G6 · Gavetas e fichas** | Aura de calor (intimação, processo, CDA), chips de ícone de contexto | shell | 0,5–1 dia |
| **G7 · Títulos editoriais (opcional)** | Fraunces 600 no link, `--cx-font-display`, seletor no ⚙ (`appSettings`), h1/operação/gaveta | shell, `edition-claude.jsx` | 0,5 dia |
| **G8 · Microinterações** | Respiro do aviso, arrastar com inclinação, coluna-alvo, fio de sincronização, Importar, Mural, Frentes | shell, toques em JSX | 1 dia |

**Total: cerca de 8 a 9 dias**, em 9 PRs. Ordem sugerida: G0 → G1 → G3 → G2 → G4 → G6 → G5 → G8 → G7. Atmosfera e calor são o que o usuário pediu; a serifa fica por último porque é gosto.

**Critérios de aceite comuns:** nenhuma medida de fonte/padding alterada fora da serifa; ≥ 4,5:1 para todo texto, medido em teste; uma luz e um destaque por tela (checklist no PR); sem erro de console; Clássico/Beta com estilos computados idênticos.

## 11. Decisões para o usuário

1. **Intensidade**: Sutil (proposta) ou Viva (mais próxima da referência)? Fica fixa, não vai ao ⚙.
2. **Serifa nos títulos**: entra como opção do ⚙? Ligada ou desligada por padrão?
3. **ink-3 da Ardósia**: subir o cinza de todos os rótulos (#676d78) ou só dos que ficam sobre luz (`--cx-ink-3s`)?
4. **2 a 5 dias**: manter sem lavagem (proposta) ou dar uma lavagem âmbar bem fraca?

---

### Apêndice · CSS-semente (regras centrais, já no formato do app)

```css
/* Atmosfera */
.cx-scroll { position: relative; }
.cx-scroll::before { content: ""; position: absolute; inset: 0 0 auto 0; height: var(--cx-aura-h); background: var(--cx-aura); pointer-events: none; z-index: 0; }
.cx-scroll > * { position: relative; z-index: 1; }
.cx-oph ~ .cx-scroll::before { display: none; }
.cx-oph { background: radial-gradient(34% 190px at 0% 0%, color-mix(in srgb, var(--op, var(--cx-accent)) var(--cx-id-a), transparent), transparent),
  radial-gradient(38% 170px at 62% 0%, var(--cx-aura-b), transparent), radial-gradient(40% 200px at 100% 0%, var(--cx-aura-c), transparent), var(--cx-ground); }

/* Elevação e destaque */
.cx-card, .cx-ks, .cx-list, .cx-fold, .cx-op-card, .cx-b-card { box-shadow: var(--cx-elev-1), var(--cx-hi); }
.cx-callout { border: 1px solid transparent; box-shadow: var(--cx-elev-2);
  background: linear-gradient(105deg, color-mix(in srgb, var(--cx-orange) 12%, var(--cx-surface)), var(--cx-surface) 72%) padding-box, var(--cx-edge-hot) border-box; }

/* Calor */
.cx-ix:has(.cx-ix-pz .cx-due.late), .cx-q-row:has(.cx-q-due .cx-due.late), .cx-t-row:has(.cx-due.late) {
  background-image: linear-gradient(270deg, color-mix(in srgb, var(--cx-red) var(--cx-wash-a), transparent), transparent 300px); }
.cx-ix:has(.cx-ix-pz .cx-due.today), .cx-q-row:has(.cx-q-due .cx-due.today), .cx-t-row:has(.cx-due.today) {
  background-image: linear-gradient(270deg, color-mix(in srgb, var(--cx-orange) var(--cx-wash-a), transparent), transparent 260px); }
.cx-ix:has(.cx-ix-pz .cx-due.today) .cx-due.today, .cx-q-row:has(.cx-q-due .cx-due.today) .cx-due.today { color: var(--cx-today-ink); }
.cx-grp:has(> .cx-dot[style*="cx-red"]) { background-image: linear-gradient(90deg, color-mix(in srgb, var(--cx-red) 12%, transparent), transparent 46%); }
.cx-kc:has(.cx-red-t, .cx-kc-v.red, .cx-kc-d.red)::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 2px;
  background: linear-gradient(90deg, var(--cx-red), transparent 78%); }

/* Tempo */
.cx-drawer:has(.cx-ruler-big.late) { --heat: var(--cx-red); }
.cx-fill { background: linear-gradient(90deg, color-mix(in srgb, var(--heat, var(--cx-ink-3)) 18%, transparent), color-mix(in srgb, var(--heat, var(--cx-ink-3)) 85%, transparent)); opacity: 1; }

/* Acessibilidade */
@media (prefers-contrast: more), (forced-colors: active) { .cx-scroll::before, .cx-ix, .cx-q-row, .cx-t-row, .cx-grp { background-image: none !important; } }
@media (prefers-reduced-motion: reduce) { .cx-op-card:hover { transform: none; } }
```
