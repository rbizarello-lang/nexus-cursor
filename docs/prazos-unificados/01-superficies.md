# Inventário das telas de prazos extintivos — NEXUS

Base: `/home/user/nexus-cursor`, commit `6cd0ef1`, `RULE_VERSION 2026.10a` (`src/lib/prescription.js:152`). Trabalho só de leitura de código; nenhum arquivo do repositório foi alterado. Os números do usuário (332 / R$ 45,9 mi, 101 / R$ 8,0 mi etc.) não foram reproduzidos com os dados reais: a conciliação da seção 3 é dedução aritmética a partir do código e dos números informados.

Convenção das referências: `app.jsx:N` = `src/app.jsx`; `ec.jsx:N` = `src/edition-claude.jsx` (Prumo); `presc.js:N` = `src/lib/prescription.js`; `mesa.js:N` = `src/lib/prazos-mesa.js`; `agenda.js:N` = `src/lib/agenda.js`; `RD:N` = `RESUMO-DIARIO.js`. "G1…G7" = `row.group`. "Clássico", "Beta" (`uiEdition 'demo'`, `isDemo`) e "Prumo" (`uiEdition 'claude'`, `isClaude`) conforme `app.jsx:3098-3118`.

---

## 0. Mapa rápido: onde cada coisa aparece

| Superfície (nome na tela) | Clássico | Beta | Prumo | Componente / função |
|---|---|---|---|---|
| Aba **Prazos extintivos** (clássico, Prumo) / **Prescrição** (Beta) | sim (`app.jsx:10828`) | sim, com outro nome (`app.jsx:10550`) | sim (`ec.jsx:425`, título `ec.jsx:2181`) | `viewMode 'prazos'` |
| Alternador **Mesa de prazos \| Lista** | sim | sim | sim (rótulo "Lista completa" na Mesa Prumo, `ec.jsx:2184`) | `renderPrazosMesaToggle` `app.jsx:9678-9683`; estado `prazosDeskMode`, **padrão 'mesa'** (`app.jsx:3108, 9676`), compartilhado pelas 3 edições |
| **Lista** (contadores Urgentes… Consumada) | sim | sim | sim (mesmo componente, dentro da casca Prumo) | `renderPrazosView` `app.jsx:9896-10174` |
| **Mesa de prazos** (Precisa de você / O resto / Silenciados) | sim | sim (com `Ficha` no lugar de badges) | **não usa esta**; usa a própria | `renderPrazosMesa` `app.jsx:9778-9895` |
| **Mesa de prazos** Prumo (4 cartões: Precisa de você, No radar sem alarme, Silenciados, Consumadas) | — | — | sim | `EditionClaudePrazos` `ec.jsx:2151-2261`, ligada em `app.jsx:10909-10913` |
| **Painel** (cartões de prescrição) | KPI + tile (`app.jsx:10954-11014`) | KPI "Prazos" + tile (`app.jsx:10989-11012`) | `EditionClaudePainel` (`ec.jsx:2995-3135`) | — |
| **Hoje** | não existe | `renderHojeView` `app.jsx:10175-10217` | `EditionClaudeHoje` `ec.jsx:553+` | `buildHojeFila` `app.jsx:9379-9464` / `cxBuildQueue` `ec.jsx:502-530` |
| Visão geral da operação (card "Prazos extintivos") | — | — | sim (`ec.jsx:2013-2093`) | usa `splitMesaRows` |
| Cabeçalho da operação (cartões "Presc. CDA", "Presc. Interc.") | sim | sim | só na Visão geral (stats `ec.jsx:2055-2056`) | `opStats` `app.jsx:5973-6035`; `app.jsx:12282-12287` |
| Ficha da CDA (3 colunas, régua, pausas, Conferir nos autos) | inline na aba Inscrições | idem | gaveta lateral (pilha de 3 contagens) | `CdaPrescColumns` `app.jsx:13112-13213`; `EditionClaudeCdaDrawer` `ec.jsx:4038-4112` |
| Card / gaveta do processo | card expansível | idem | gaveta | `ProcPrescCard` `app.jsx:7804-7957`; `EditionClaudeProcDrawer` `ec.jsx:3766-3929` |
| Linha do tempo | — | — | sim | `cxBuildTimeline` `ec.jsx:1743-1860` |
| Agenda / Relatório de passagem | sim | sim | sim | `renderAgendaWeek` `app.jsx:10359+`; `buildAgendaByDay` `agenda.js:30-71`; relatório `app.jsx:5598-5622` |
| E-mail de resumo diário | sim (independe da edição) | | | `RESUMO-DIARIO.js` |

Observação de nomenclatura: a palavra **"Mesa"** designa três coisas diferentes: "Mesa de intimações"/"Mesa de trabalho" (fila de foco de intimações, `viewMode 'mesa'`, `ec.jsx:419`), "Mesa de prazos" (esta) e o botão "Mesa" do Hoje do Beta (`app.jsx:10192`), que lista G1+G2 de prescrição (não a "Precisa de você").

---

## 1. Motor em uma página: de onde vêm as linhas e os números

Todas as telas de prazos (menos o e-mail) leem **uma única estrutura**, `prazosRadar`, calculada em `app.jsx:3926-3929` com `buildPrazosRadar(data, undefined, prescLookup, { policy: 'v2' })`. O pipeline:

1. `createPrescLookup` / `computePrescription` (`presc.js:2343-2363`, `925-975`): uma contagem por CDA (resultado "data tarde") com `band` (data cedo × tarde), `phase`, `status`, `diesAdQuem`, `daysLeft`, `flags`, `checks`, `summary`.
2. `classifyPainelPrescAlert` (`presc.js:3239-3454`): **um alerta (kind) por CDA, ou nenhum**. Janela de alarme v2 = 90 dias (`PRESC_ALERT_WINDOW`, `presc.js:341`); v1 = 180 dias (`PAINEL_PRESC_WINDOW`, `presc.js:2931`). A v1 só é usada no instantâneo gravado para o e-mail (`attachPrescriptionSnapshots`, `presc.js:2408-2460`, chamado em `app.jsx:4168`).
3. `buildPainelPrescAlerts` (`presc.js:3456-3552`): cria a `row` (campos: `id, cdaNumber, processNumber, value, prescDate, prescDays, prescKind, prescSegment, prescFaixa, prescLabel, summary, checks, incident, bandHit, bandCedo/bandTarde, action, silenceReason…`, `presc.js:3494-3538`). Só operações **não encerradas** (`3463-3465`, `3487-3488`) e CDAs não `extinta`.
4. `buildPrazosRadar` (`presc.js:3943-4102`):
   - `group = groupOfKind(kind, row)` (`presc.js:3622-3634`); `keyDate/keyLabel = prazosKeyMeta` (`3636-3673`);
   - v2: `why`, `action`, `basis` (`radarWhyAction`, `3810-3900`), `reviewAt` (`3903-3918`), `processNotes` (IDPJ, `3976-4003`);
   - adiamento (`prescSnooze`) ainda válido → a linha **sai de `rows`** e vai para `silenced` (`4005-4018`);
   - `applyConsumadaClassification` (`4020`, `3591-3601`; `consumadaClass` `3573-3583`): só para os kinds `vencido`, `vencido_estimado` e `residual_alta` (`CONSUMADA_KINDS`, `3567`) com dias ≤ 0 (pela data tarde quando há faixa, senão por `prescDays`): vencido há > 180 dias vira G6 (guarda `alertGroup`); vencido há ≤ 180 dias **continua no grupo de alerta** e só ganha `consumada='recent'`;
   - CDAs com parcelamento vigente por evento ou "parcelada" só na ficha, que não geraram linha, entram em `silenced` (`4025-4059`);
   - `totals[1..7] = {n, value}` (`4061-4088`): soma `row.value` por `row.group`; **linhas `consumada==='recent'` também somam em `totals[6]`** (`4076-4080`), logo contam duas vezes (no G1/G2 e na Consumada).
5. **CDAs sem alerta** não geram linha e não entram em `silenced`: não aparecem em nenhum contador, lista ou drawer. Isso só acontece com CDA **não ajuizada** cujo prazo ordinário não está vencido, nem a ≤ 90 dias, nem em faixa (`presc.js:3443-3453`). CDA **ajuizada** sempre gera alguma linha (no mínimo `residual_media`, `presc.js:3433-3440`).
6. Fora do radar: CDA tratada (`prescriptionHandled`, exceto `aguardando_reconhecimento` em v2) e execução com `prescDecision.situation === 'DECLARADA'` (`presc.js:2977-2991`).
7. "Valor R$" de qualquer contador = soma de `debt.value` das CDAs das linhas (`presc.js:3499`, `4074`); cada CDA entra uma vez.

---

## 2. Inventário por superfície

### 2.1 Lista de Prazos extintivos (Clássico, Beta e Prumo)

- **Nome na tela**: botão "Lista" do alternador (`app.jsx:9681`); no Prumo, quando em Mesa, o alternador diz "Lista completa" (`ec.jsx:2184`).
- **Componente**: `renderPrazosView` (`app.jsx:9896-10174`); mesma implementação nas 3 edições (Prumo a renderiza em `app.jsx:10909`).
- **Dados**: `prazosRadar.rows`, `.totals`, `.incidents`, `.processNotes`, `.divergencias`.
- **Contadores** (`app.jsx:10033-10041`; construtor `counterBtn` `9970-9984`). Sempre `n` e **valor completo** (`fmtCur`, `9981`; as telas Prumo usam `cxMoneyShort`, "R$ 8,0 mi"):

| Contador | Critério exato | Valor R$ |
|---|---|---|
| Urgentes | `totals[1]` = linhas com `group===1`: kind `vencido` ou `iminente`. Inclui as consumadas "recentes" (vencidas há ≤ 180 d), que seguem em G1 | soma `value` do G1 |
| A conferir | `totals[2]`: kind `vencido_estimado` ou `residual_alta` | idem G2 |
| A completar | `totals[3]`: kind `pedido_dado`, `inconsistencia`, ou qualquer outro kind rebaixado por `rowNeedsCadastro` (`presc.js:3603-3616`) | idem G3 |
| Acompanhamento | `totals[4]`: `correndo`, `residual_media`, `pausa_cadastrada`, `vigiar_interrompido`, `aguardando_reconhecimento` | idem G4 |
| Ainda impossível | `totals[5]`: `acompanhar_piso` | idem G5 |
| Consumada | `totals[6]` = linhas `group===6` (vencidas há > 180 d) **+** linhas com `consumada==='recent'` (`presc.js:4076-4080`) | idem |
| Penhora antiga | `totals[7]`; botão só aparece se n>0 (`app.jsx:10040`) | idem |

  Os contadores **ignoram os filtros** de operação/pessoa/busca (usam `prazosRadar.totals` direto, `app.jsx:9899`); a lista abaixo é filtrada.
- **Filtros** (todos persistidos em `appSettings.prazosFilters`, `app.jsx:3944, 3971`): clique no contador = filtro de grupo (`9974-9978`); painel "Filtros" (`10053-10104`): Agrupar por processo/incidente/devedor/operação, Operações (multi), Incidente (abrangida/não abrangida), Ajuizamento (ajuizada/não), "só sem ciência lançada"; sub-abas de pessoa quando há exatamente 1 operação (`10114-10116`); busca por CDA, processo, devedor ou operação (`10111`); botão "Importar análise (formato NEXUS)" (`10112`).
- **Ordenação**: seletor "Grupo e data / Por valor / Por data" (`10106-10110`; lógica `9929-9931`). **Efeito real quase nulo**: depois do seletor, `groupPrazosByProcess` (`presc.js:3682-3711`) e `groupPrazosByLabel` (`app.jsx:1289-1318`) reordenam as linhas de cada grupo por `group` e `keyDate` e os grupos por pior grupo e nº do processo/nome; o seletor só decide a ordem de empate.
- **Agrupamento**: por processo (padrão, `listGroup 'processo'`), por incidente (blocos IDPJ/MCF com "Conferência" e lista de EFs com o pior grupo, `app.jsx:10117-10142`; `buildPrazosIncidentBlocks` `presc.js:3713-3777`), por devedor, por operação.
- **Visibilidade padrão**: Consumada fora (`9908`); G5 recolhido por baixo de "Ainda impossível — N inscrição(ões) recolhidas. Expandir" (`9932-9942, 10165-10169`). A frase "Mostrando todos os grupos, exceto Consumada · N inscrição(ões)" (`10045`) conta também as linhas de G5 recolhidas. Adiadas e parcelamento vigente **não aparecem na Lista** (só na Mesa).
- **Anatomia da linha** (`renderCdaRow`, `app.jsx:10010-10030`): chip numérico do grupo (tooltip = `PRAZOS_GROUP_LABELS`); CDA nº + "tributo · valor"; **texto = `r.summary || r.prescLabel`** (o texto do cálculo, não o `why`); coluna de data `keyText` (`10004-10009`: "termo em …" para vencido/iminente/correndo, "consumada em … (estimado)", "cedo dd/mm · tarde dd/mm" se faixa, "estimado · …", "não antes de …", "encerrado em …", "pausado · …") e selo "análise diverge"; **primeira pendência de Conferir nos autos** (+N); bolinha + selo "IDPJ/MCF nº"; ações. Cabeçalho do grupo-processo: nº, vara, "◎ operação", selo do incidente, "N CDA(s) · R$", e as notas do processo (IDPJ sem constrição / aviso de constrição aos 5 anos, `10158-10160`). Faixa de aviso "N divergência(s) entre a análise importada e o cálculo do app" (`10047-10049`).
- **Ações na linha** (`rowActions`, `app.jsx:9985-10002`): **Abrir** (`openCdaInscricoes`: sai da tela, vai à operação, aba Inscrições, expande a CDA); **+ Evento** (modal; no Beta com foco na data, nas demais sem, `9988`); **Tratar** (`markPrazosHandled`, `9466-9479`: grava `prescriptionHandled=true`, tipo `declarada`, **sem confirmação**); **Manter decisão** (só se há `prescDecision` com "revalidar"). Não há Adiar, "Ainda vale" nem ação de um clique na Lista.
- **Decadência**: nunca gera linha. **Ordinária** (CDA não ajuizada) e **intercorrente** (ajuizada) entram misturadas, sem etiqueta do relógio (só o texto de `summary`). **Consumadas**: G6 só pelo contador/filtro (`9906`: `rowShowsInConsumada` = G6 ∪ recentes; texto "(inclui as consumadas há menos de 6 meses, que continuam em Urgentes)", `10044`).

### 2.2 Mesa de prazos — Clássico e Beta (`renderPrazosMesa`)

- **Nome**: botão "Mesa de prazos"; blocos "PRECISA DE VOCÊ", "PENHORA ANTIGA — ANALISAR", "O RESTO", "SILENCIADOS (n) ▸" (`app.jsx:9829, 9842, 9851, 9871`).
- **Componente**: `renderPrazosMesa` `app.jsx:9778-9895`; linha `renderMesaRow` `9711-9763`; agrupamento `renderMesaGroups` `9764-9777`.
- **Dados**: `prazosRadar.rows` (sem G6, `9789`) filtradas por operação, pessoa e busca (`9783-9799`); `splitMesaRows` (`mesa.js:51-72`); `mesaDrawerItems` (`mesa.js:334-384`) com `prazosRadar.silenced` **sem filtro** (`app.jsx:9808`).
- **Contadores**: não há cartões numéricos nem R$. Só: "O RESTO" mostra `G1 n · G2 n · G3 n · G4 n` e `· G5 n` (`9852`); "PENHORA ANTIGA — ANALISAR" mostra `N CDAs` (`9843`); "SILENCIADOS (n)" (`9871`) e "N adiamento(s) vencem esta semana" (`9873`). O bloco "PRECISA DE VOCÊ" não exibe quantidade nem valor.
- **Critério de "Precisa de você"** (`mesaNeedsYou`, `mesa.js:31-41`), na ordem: G7 → não (lista própria); **G1 → sim**; **kind `pedido_dado` → sim**; **G2 com `prescDays ≤ 0` → sim**; **G3 com `action.type ∈ MESA_ONE_CLICK` → sim** (`mesa.js:10`); **`reviewAt ≤ hoje` → sim** (qualquer grupo ≠ 7); caso contrário vai para "O resto". `MESA_CAP = Infinity` (`mesa.js:9`): o botão "+N acima do orçamento" (`app.jsx:9832-9837`) nunca aparece.
- **Ordenação**: `compareMesaRows` (`mesa.js:44-49`): `prescDate || keyDate` (data cedo quando há faixa) crescente; empate = maior valor. Agrupamento: `groupMesaRows` (`mesa.js:78-113`): intercorrente por execução (mesmo `executionId`/nº do processo), ordinária uma linha por CDA; grupo ordenado pela data/valor da linha líder; cabeçalho de execução só se ≥2 linhas ou se há nota do processo (`app.jsx:9766`).
- **Filtros**: operação (select), busca, sub-abas de pessoa (`9817-9827`). O filtro de grupo da Lista **não** é lido aqui.
- **Anatomia da linha** (`app.jsx:9711-9763`): nº da CDA, processo, selo de certeza (`mesaCertainty`, `mesa.js:12-23`: calculado / estimado / cadastro / faixa / dado / analisar), "expirou o silêncio", texto `why` (`betaSafeUiText`), data (`keyLabel`), valor, régua mini (`PrescBandRuler mini`, `app.jsx:2394-2434`), ação primária e botões. Linha em vermelho se `isG1Vencido` (`mesa.js:25-29`). **Não mostra o relógio (ordinária/intercorrente)**.
- **Ações**: ver seção 5. Resumo: ação primária (no lugar via modal ou gravação direta), **Evento** (modal), **Abrir** (navega), **Conferir** (idêntico a Abrir), **Adiar…** (popover, `9684-9710`). Em "Silenciados": **Reabrir agora** só para adiados (`mesa.js:348`).
- **Decadência**: nunca aparece. **Ordinária/intercorrente**: misturadas, sem etiqueta. **Consumadas antigas**: excluídas da tela (`9789`), sem contador nem atalho (a única saída é a Lista). **Consumadas recentes**: ficam em "Precisa de você" (são G1).
- **Penhora antiga** (G7): bloco colapsado com `renderMesaGroups` (`9839-9848`); ação "Marcar analisada".

### 2.3 Mesa de prazos — Prumo (`EditionClaudePrazos`)

- **Nome**: título "Prazos extintivos"; modo "Mesa de prazos \| Lista completa" (`ec.jsx:2181-2185`); cartões e seções abaixo.
- **Componente**: `EditionClaudePrazos` `ec.jsx:2151-2261`; linha `CxMesaRow` `ec.jsx:2096-2150`; agrupamento `cxMesaGroups` `ec.jsx:1549-1562`.
- **Dados**: `prazosRadar.rows` filtradas por operação e pessoa (`2159-2162`); `consumadas` é calculado **antes** do filtro de texto (`2163-2168`); `splitMesaRows`; `mesaDrawerItems` com `silenced` global (`2172`).
- **Cartões** (`ec.jsx:2187-2200`):

| Cartão | Contador | Subtexto |
|---|---|---|
| Precisa de você | `needs.length` = `needsYou + overCap` (critério de 2.2) | `cxMoneyShort(Σ value de todas as linhas needs)` + " em jogo" (`2176-2177, 2189`) |
| No radar, sem alarme | `split.rest.length` = linhas não-needs de G1–G4 (G5 excluído, G7 e G6 fora) | `G1 n · G2 n · G3 n · G4 n` (`2192`) |
| Silenciados | `drawer.length` (adiados + parcelamento vigente + parcelada na ficha + linhas com `silenceReason` + **todas as G5**) | "N voltam esta semana" ou "parcelados, adiados e ainda impossíveis" (`2195`) |
| Consumadas | `rows.filter(group===6 && rowShowsInConsumada).length` = **só as antigas (> 180 d)** | "para análise, fora do alarme"; clique abre a **Lista** filtrada em grupo 6 (`app.jsx:10913`) |

- **Seções**: "Precisa de você" ("pela data cedo; no empate, o maior valor", `2208`); "Penhora antiga — analisar" (colapsada, `2215-2222`); "No radar, sem alarme" (colapsada; subtítulo com nomes longos dos grupos + "ainda impossível N (em Silenciados)", `2224-2234`); "Silenciados" (colapsada, `2236-2252`); legenda de certeza (`2253-2259`).
- **Anatomia da linha** (`CxMesaRow`, `2109-2149`): número do grupo (chip, tooltip = nome longo), CDA nº, selo de certeza (`CX_CERT`, `ec.jsx:1538`: Calculado, Estimado, Cadastro, Cedo–tarde, Falta dado, Analisar), **etiqueta do relógio** ("Ordinária", "Intercorrente", "Decadência" — esta última nunca é produzida, ver seção 6-H), "o adiamento venceu", texto `why`, régua mini, operação, processo, devedor; à direita: horizonte (`formatPrescHorizon`: "há 12d", "em 2 anos"), data (`keyLabel` se faixa, senão `fmtDate`), valor; ações.
- **Ações**: ação primária (`CX_ACT_LABEL`, `ec.jsx:1547`), Evento, Abrir, Conferir, Adiar… (formulário embutido com motivo e "Volta à mesa em", `2142-2148`). "Reabrir agora" em Silenciados (`2249`).
- **Decadência / ordinária / intercorrente / consumadas**: decadência não aparece; ordinária e intercorrente aparecem rotuladas; consumadas antigas só no cartão (e na Lista); recentes dentro de "Precisa de você".

### 2.4 Painel

**Clássico** (`app.jsx:10944-11014`):
- KPI **"Risco prescricional"** (`10996-11000`): valor = `n1 + n2` (G1+G2); subtexto = `fmtCur(v1) + ' urgente'` (**valor só do G1**, `10969-10971`) ou "N a conferir". Tooltip: "Mesmos números da aba Prazos extintivos… O valor soma só o vencido/iminente" (`10997`).
- Tile **"Prazos extintivos"** (`11003-11012`): "N urgentes · N a conferir · N a completar", cada um clicável (`openPrazos(g)`, `app.jsx:3973-3976`: grava o filtro de grupo e abre a aba; **se o modo for Mesa, o filtro de grupo é ignorado**).
- Tabela/ranking de operações: selo "⏱ N" = G1+G2 por operação (`app.jsx:10251, 10336, 11068, 11173`; `isPrazosRisco` `3940-3943`).

**Beta**: o mesmo bloco, com o KPI trocado por **"Prazos"**: "N urgentes · N para completar cadastro · R$" (G1, G3, valor G1; `10989-10994`).

**Prumo** (`ec.jsx:2995-3135`):
- KPI **"Risco prescricional"** (`3049-3053`): `riskN = G1+G2`, `riskV = valor G1+G2` ("em risco"); tooltip "Mesmos números da tela Prazos extintivos (grupos 1 e 2)".
- Cartão **"Prescrição na carteira"** (`3128-3135`, `CX_PANEL_GROUPS` `ec.jsx:2935`): 6 linhas Urgentes, A conferir, A completar, Em acompanhamento, Ainda impossível, Consumadas, com n e valor abreviado (`totals`, inclui as "recentes" duplicadas na Consumadas); clique → **Lista** filtrada (`app.jsx:10936`); botão "Mesa" → Mesa Prumo (`10935`). Não há G7.
- Tabela "Operações": coluna **Prescrição** = G1+G2 por operação (`3083, 3101`).
- Texto fixo "Mesmos números da tela Prazos extintivos. Clique num grupo para ver a lista." (`3134`).

### 2.5 Hoje — Beta (`renderHojeView`, `app.jsx:10175-10217`; `buildHojeFila`, `9379-9464`)

- **Sem contador de prescrição**; mistura intimações, tarefas, audiências e CDAs numa fila única de **até 18 itens** (`9463`), ordenada por dias (`9458-9462`).
- Itens de prescrição: `pushPresc` (`9382-9392`): título "CDA n · R$", meta "operação · summary", `due = prescDays`, `urgent = group===1 || dias ≤ 30`; clique → `openPrazos(row.group)` (abre a aba, não a CDA).
- Filtros (botões do herói, `10190-10193`): **"Mesa"** = linhas G1 e G2 não tratadas (`9441-9448`); **"Prescrição"** = qualquer linha com `prescDays ≤ 30` (inclusive negativos), exceto G6/`consumada==='old'` (`9449-9457`). Sem filtro: entram as G1/G2 do ramo "Mesa" (`9441`).
- Texto de vazio do filtro Mesa: "Nenhum prazo da Mesa exige atuação urgente nesta fila." (`10180`).

### 2.6 Hoje — Prumo (`EditionClaudeHoje`, `ec.jsx:553+`)

- **KPI "Prazos extintivos"** (`ec.jsx:655-659`): `n1` = `totals[1].n` "urgentes"; subtexto `cxMoneyShort(totals[1].value) + ' urgente'` ou "Situação controlada"; clique → `openPrazos(1)`. Frase do topo: "N CDAs estão no grupo urgente de prescrição" (`639`).
- **Fila do dia** (`cxBuildQueue`, `ec.jsx:523-528`): CDAs G1 e G2 não tratadas, `due = prescDays`; abas Próximos (0–7 d), Vencidos (< 0), Feitos (`586-591`); mostra 12 (`688`). Linhas G1/G2 com mais de 7 dias até o termo (p.ex. iminentes a 8–90 d) ou sem `prescDays` **não aparecem em nenhuma aba** da fila. Chip numérico do grupo (vermelho G1, laranja G2, `692`). Clique → `openPrazos(g)` (`623`), que **não troca o modo** Mesa/Lista (`app.jsx:3973-3976`): com o padrão Mesa, cai na Mesa sem filtro.
- Também exclui as de prescrição da lista "Próximos 7 dias" por bucket (`592-593`).

### 2.7 Outros números de resumo que repetem grupos

| Onde | O que mostra | Critério | Refs |
|---|---|---|---|
| Menu lateral Prumo, item "Prazos extintivos" | selo vermelho | `totals[1].n` (G1) | `ec.jsx:425`; `app.jsx:10634` |
| Menu lateral, ponto lilás na operação | "N CDA(s) com prazo extintivo urgente" | G1+G2 não tratadas por operação | `ec.jsx:395-396`; `app.jsx:3988-3991` |
| Carteira Prumo (cartões) | ícone ampulheta + N | G1+G2 por operação (`cxOpIndex`) | `ec.jsx:1600, 1685` |
| Visão geral Prumo — stat "Prescrição · CDAs" | N "nos grupos urgentes" | `prescA` = G1+G2 da operação | `ec.jsx:2055`; `app.jsx:5984` |
| Visão geral Prumo — card "Prazos extintivos" | até 5 linhas "grupo · CDA · why · horizonte"; vazio = "Nada exige decisão agora · N CDAs no radar, sem alarme" | `splitMesaRows(...).needsYou` da operação, sem G6 | `ec.jsx:2020-2021, 2074-2082` |
| Visão geral — stat "Processos em alerta" | N "crítico, alerta ou vencido" | `prescExec`: status **legado** do motor (`critico/alerta/prescrito`: ≤365 d, ≤730 d, `statusFrom` `presc.js:497-512`) | `ec.jsx:2056`; `app.jsx:6003-6017` |
| Cabeçalho da operação (Clássico/Beta) — "Presc. CDA" | Clássico: G1+G2 "risco (1+2)"; Beta: G1 + "VENCIDA" ou "N a completar" ou "em dia" | `prescA` / `prescG1`, `prescG1Vencido`, `prescG3` | `app.jsx:12282-12286, 5985-5998` |
| Cabeçalho da operação — "Presc. Interc." | N "≤365 dias" | `prescExec` (legado; rótulo diz 365 d, o código também conta "alerta" até 730 d) | `app.jsx:12287, 6003-6017` |
| Gaveta da intimação (Prumo) | "N no alarme" e, por CDA, chip Urgente / A conferir / A completar / Acompanhamento / **Sem risco** | "alarme" = só G1; G5 chamado "Sem risco"; G6/G7 sem chip | `ec.jsx:1291, 1362-1376` |
| Cartão de processo / lista de processos | rótulo de risco | `prazosRiskMetaForCdas` (`presc.js:4104-4133`): "N urgentes" → "N a conferir" → "N a completar" → "ainda impossível" → "consumada" → "em acompanhamento" (G7 cai aqui) → "Tratadas"; Beta troca por "VENCIDA" quando há G1 vencido | `app.jsx:7738-7746, 7814`; Prumo `cxPrescDisplay` `ec.jsx:4195-4210` ("Nd vencido · dd/mm" / "N dias · dd/mm" da pior linha G1–G4) |
| Trilho/resumo por faixa do painel de processos (`bandTotals`) | Clássico: "Prescrita" ou "Nd"; Beta: horizonte ("há 12d", "em 2 anos") ou "em acompanhamento" | menor `prescDays` entre G1/G2 das CDAs do bloco | `app.jsx:8130-8146` |

### 2.8 Ficha da CDA

**Clássico/Beta** (inline na aba Inscrições): `CdaLegalDetail` `app.jsx:13215-13331` → `CdaPrescColumns` `13112-13213`, alimentado por `computeCdaLegalTimeline` (`presc.js:2912-2929`: decadência + ordinária + intercorrente + `worst` por `LEGAL_SEVERITY` `2901-2908`).

- **Pausas sem data de fim** (acima das colunas, `13123-13134`): lista de `openPauseEvents` (`presc.js:393-416`: pausas suspensivas sem `endDate`, exceto `susp_art40`, constrição IDPJ, bloqueio para negociação, adesão com fim inferido). Cada linha: "<rótulo> desde <data> · última conferência: <data|nenhuma>" + botão **"Ainda vale"** (se não herdada do IDPJ) + dica "A data cedo presume que a pausa acabou na última conferência…". O botão grava `verifiedAt = hoje` no evento (`confirmPauseEvent`, `app.jsx:9481-9490`; `lastConference` `presc.js:781-785`).
- **Três colunas** "Decadência", "Prescrição ordinária", "Prescrição intercorrente" (`13116-13120`), todas sempre que o relógio existe. Cada coluna (`buildCdaColumnView`, `presc.js:2663-2697`): título + **selo** (`columnSeal`, `2625-2634`: faixa / calculado / estimado / sem dados); **régua** completa (`PrescBandRuler`, `app.jsx:2394-2434`; `buildPrescRulerModel` `presc.js:2703-2740`: traços = fatos, faixas claras = pausas, faixa hachurada = cedo–tarde só quando as datas diferem, marca "hoje", rodapé início – resumo – fim); **Situação** (`summary`; na intercorrente, prefixo "Decisão de dd/mm (análise NotebookLM)…" se houver `prescDecision`, `13155-13157`); **Datas** ("Início: … · Fim: …" e, havendo faixa, "Data cedo X · data tarde Y" ou "Data provável Z, sem o dado que a confirmaria" + os motivos A1…D3, `bandView` `presc.js:2606-2623`); **Ocorrências** (data, fato, efeito, selo IDPJ/MCF); **Estimativas**; **Conferir nos autos** (caixas persistidas em `debt.prescChecks`, `togglePrescCheck` `app.jsx:9491-9506`); rodapé "Regras v… · ⓘ" (abre o modal de regras).
- **Faixa cedo–tarde**: motivos `BAND_MOTIVOS` (`presc.js:260-272`): A1 rescisão, A2 pedido de parcelamento, A4 falência, A5 pausa sem fim, A6 parcelamento vigente, B1 ciência eletrônica, B2 só suspensão do art. 40, B3 só arquivamento, C1/C1x constituição não informada, D3 decadência (esta com `alarme:false`, `presc.js:2770-2777`).
- Rodapé: Copiar memória técnica / Baixar HTML (inclui seção DECADÊNCIA, `presc.js:4143`), Editar inscrição, + Evento (`13317-13328`). Beta acrescenta barra fixa Copiar / Evento / Editar (`13263-13269`).
- Também a **linha fechada** "STATUS — situação — data" (`betaCdaClosedLine`, `mesa.js:212-332`; `renderBetaCdaClosedLine` `app.jsx:9523-9534`) em cada CDA do card do processo e da aba Inscrições (**clássico e Beta**): vocabulário próprio ("prescrição intercorrente em curso / consumada (estimada) / ainda não iniciada / interrompida por penhora / suspensa por parcelamento", "falta dado — …").

**Prumo** (`EditionClaudeCdaDrawer` `ec.jsx:4038-4112`; bloco "Prazos extintivos" `CxCdaPrazosBlock` `3958-3977`):
- Linha de topo `cxPrescDisplay` (barra de horizonte + "N dias · dd/mm" ou rótulo de risco) + etiqueta "aguardando reconhecimento"/"tratada"; linha do grupo (chip, nome longo, "termo dd/mm" ou `keyLabel`, horizonte); texto `why || summary`.
- Pilha das 3 contagens (`CxCdaPrescStack`, `3938-3954`) com a **mais grave primeiro** (`worst.key`; severidade em `LEGAL_SEVERITY`, `presc.js:2901-2908`; em empate vence a decadência por ordem de montagem, `presc.js:2918-2926`); cada uma é um `CdaPrescColumns` isolado. **"Ainda vale" só é passado à primeira coluna** (`onConfirmPause={i === 0 ? confirmPause : undefined}`, `3952`) e o bloco de pausas é calculado a partir de `intercorrente || ordinaria` da própria coluna (`app.jsx:13114`): se a coluna de topo for a **decadência**, o bloco de pausas some; nas colunas seguintes aparece sem botão. O rodapé "Regras v… ⓘ" recebe `onOpenRules={() => {}}` (sem efeito, `3952`).
- Rodapé: + Evento, ✓ Tratada / ↻ Reabrir, ⏳ Aguardando reconhecimento, Memória técnica, baixar HTML, Editar inscrição (`4102-4109`).

### 2.9 Card / gaveta do processo

**Clássico/Beta** (`ProcPrescCard`, `app.jsx:7804-7957`):
- Cabeçalho: número, classe/vara, Status, "CDAs n · R$", **Prescrição** = `rm.label` (`prazosRiskMetaForCdas`) ou "VENCIDA" (Beta, `anyG1Vencido`) (`7814`).
- Fatos expandidos (`7866-7895`): Protocolo; "Prev. presc." da planilha (`e.prescriptionForecast`); **régua da intercorrente** só da CDA líder (`live[0]`, `7873-7886`); **aviso IDPJ** (`idpjNotice`, texto "IDPJ nº …: constrição informada em … e tratada como interrupção… Esclarecer…", ativo quando faltam ≤ 90 d para os 5 anos, `presc.js:347-367`); **Redirecionamento** (`redirecionamentoInfo`, `presc.js:422-452`: 5 anos da citação ou da dissolução irregular posterior; informativo, sem alarme).
- Lista de CDAs do processo (`7748-7801`): linha fechada, ✓ (tratada), ⏳ (aguardando reconhecimento, com confirmação e oferta de tarefa), expandir → ficha da CDA; Ações: "+ Evento" em lote, Dados do processo, Gerar tarefa, Marcar todas.

**Prumo** (`EditionClaudeProcDrawer`, `ec.jsx:3766-3929`): aba Resumo com "Pior prescrição" (`cxPrescDisplay`), régua da intercorrente, aviso IDPJ e Redirecionamento (`3797-3808, 3852-3854`, também só da primeira CDA viva); aba CDAs ordenadas por pior risco (`cxSortCdasByPresc`, `3756-3763`) que abrem a gaveta da CDA; rodapé "+ Evento nas N CDAs", Gerar tarefa, Dados do processo. A lista de processos mostra a coluna **Prescrição** (`CxPrescCell`, `ec.jsx:4207-4210`) e ordena por risco (`cxProcSortCmp`, `4149-4161`).

### 2.10 Linha da CDA na aba Inscrições (selo de decadência)

Clássico/Beta `renderCDACard` (`app.jsx:7316-7363`) e Prumo `CxIncRow` (`ec.jsx:4715-4735`): além da linha fechada (Clássico/Beta) ou de `CxIncPrescCell` (Prumo), exibem o selo **"Decad."** (vermelho se `computeDecadencia().status==='consumada'`, amarelo/laranja se `'risco'`, com o `detail` no tooltip; `app.jsx:7323, 7334`; `ec.jsx:4718, 4733`).

### 2.11 Linha do tempo (Prumo)

`EditionClaudeTimelinePage` (`ec.jsx:1994-2010`) → `cxBuildTimeline` (`ec.jsx:1743-1860`). **Não usa o radar nem os grupos**: usa o status legado de cada CDA (`prescLookup(d).status` com `CX_SEV` `ec.jsx:1733`) e escolhe a "pior CDA" do processo (`1769-1776`).
- Linha "Prescrição · vencida / crítica / em alerta / correndo / ciclo encerrado / pausada / sem ciência lançada / sem risco próximo / sem dados" (`CX_PRESC_TXT`, `1734, 1916`), "· pior de N CDAs".
- Faixas: "Suspensão de 1 ano", "Contagem de 5 anos", "Parcelamento", "Outra pausa"; marcas: "Termo calculado/estimado · dd/mm" (lilás), "Data cedo · dd/mm (leitura mais desfavorável)" (vermelho, só se `band.alarme !== false`), "Ciclo encerrado em …", "Não pode ter prescrito antes de …" (`1779-1805`).
- Bloco "CDAs sem processo · ajuizar" (até 10, `r.segment==='credito'` e status crítico/alerta/prescrito; "venceu em" / "até", `1827-1839, 1914-1915`), que abre a CDA (navega).
- "Marcos da operação": só frentes (IDPJ/MCF/central/EF no panorama); "Prescrição · dd/mm" (`1843-1847`).
- Sem adiamento, sem filtro de grupo, sem limite de "consumada antiga": prescrito aparece como "vencida" sem corte de data. Decadência não aparece.

### 2.12 Agenda, Relatório e importação

- **Agenda Prumo** (`agenda.js:60-63`; `ec.jsx:2463-2474`): itens "presc" = linhas com `keyDate`, `group ≤ 4` e sem `silenceReason` (inclui as G4 "correndo" com data no intervalo exibido; a Lista do usuário tem 491 em G4, parte delas `aguardando`, que ficam de fora por `silenceReason`); título "CDA n", urgente se G1.
- **Agenda clássica/Beta** (`app.jsx:10470-10485`): qualquer CDA não extinta/tratada com `keyDate` ou data calculada dentro do intervalo, **sem corte por grupo** (inclui G5, G6); clique → `openPrazos(group)`.
- **Relatório de passagem** (`app.jsx:5598-5622`): "Próximos 15 dias" com G1–G4 (`group ≤ 4`) e "Alertas: CDAs no alarme (grupos 1 e 2)".
- **Importar análise (formato NEXUS)** (`app.jsx:12436-12450`): compara o grupo antes/depois por CDA.

### 2.13 E-mail de resumo diário (`RESUMO-DIARIO.js`)

Existe e roda no Apps Script, independente da edição. Seção "Prescrição se aproximando" (`RD:331`), montada em `RD:201-228` a partir de `debt.prescriptionSnapshot` gravado em `attachPrescriptionSnapshots` (`presc.js:2408-2460`) com **política v1** (janela 180 d, sem faixa cedo–tarde, sem `pedido_dado`/`penhora_antiga`, sem adiamento nem silêncio). Critério: ignora tratada/extinta; **G1, G2 e G3 sempre**; G4 só se dentro de 90 d (`CONFIG.DIAS_PRESCRICAO`, `RD:28`); G5 nunca; os demais (inclui **G6, consumadas antigas**) entram se `dias ≤ 90`, o que vale para qualquer prazo já vencido; acrescenta "VENCIDA — conferir" se `dias ≤ 0` (`RD:220`).

### 2.14 Matriz: decadência, ordinária, intercorrente e consumadas em cada superfície

| Superfície | Decadência | Ordinária | Intercorrente | Consumadas antigas (G6) | Consumadas recentes (≤ 180 d) |
|---|---|---|---|---|---|
| Lista | não aparece | linha de CDA **não ajuizada**, sem etiqueta do relógio | linha de CDA **ajuizada**, sem etiqueta | só pelo contador/filtro "Consumada" | em Urgentes (G1) e no filtro Consumada |
| Mesa clássica/Beta | não | idem Lista | idem Lista (agrupada por execução) | excluídas (`app.jsx:9789`) | em "Precisa de você" (G1) |
| Mesa Prumo | não (etiqueta prevista, inalcançável) | etiqueta "Ordinária" | etiqueta "Intercorrente"; agrupada por execução | cartão "Consumadas" | em "Precisa de você" (G1) |
| Painel clássico/Beta | não | contada em G1/G2/G3 | idem | sem cartão | contada em Urgentes |
| Painel Prumo | não | contada nos 6 cartões | idem | cartão "Consumadas" (G6 ∪ recentes) | contada em Urgentes **e** em Consumadas |
| Hoje Beta | não | G1/G2 (e `prescDays ≤ 30` no filtro Prescrição) | idem | exclui G6 no filtro Prescrição; fora do filtro Mesa | entra (G1) |
| Hoje Prumo | não | G1/G2 | G1/G2 | fora (G6 não é G1/G2) | entra na aba "Vencidos" |
| Ficha da CDA | coluna própria (selo, régua, situação, conferir) | coluna própria | coluna própria | selo/situação "consumada" na coluna | idem |
| Card/gaveta do processo | não | só no rótulo agregado | régua da intercorrente (CDA líder), aviso IDPJ, redirecionamento | rótulo "consumada" ou "VENCIDA" | idem |
| Linha do tempo Prumo | não | bloco "CDAs sem processo · ajuizar" (até 10) | linha "Prescrição" e faixas | "vencida", sem corte de data | idem |
| Agenda | não | por `keyDate` | por `keyDate` | Prumo: fora (`group > 4`); clássico/Beta: dentro, se a data cair no intervalo | Prumo: dentro (G1) |
| Relatório de passagem | não | G1/G2 e próximos 15 d | idem | fora (`group ≤ 4`) | dentro (G1) |
| E-mail | não | v1 | v1 | entra se `dias ≤ 90` (sempre), com "VENCIDA — conferir" | entra (G1) |

---

## 3. A divergência "Precisa de você 332 / R$ 45,9 mi" × "Urgentes 101 / R$ 8,0 mi"

### 3.1 O que cada número conta

- **Lista, "Urgentes"** = `totals[1]` = linhas com `group === 1`, ou seja, só os kinds `vencido` e `iminente` (`presc.js:3625`). Valor = soma do `value` dessas CDAs (`presc.js:4074`).
- **Mesa Prumo, "Precisa de você"** = `needsYou ∪ overCap` de `splitMesaRows` (`ec.jsx:2176`), onde uma linha entra por **qualquer** destas regras (`mesa.js:31-41`): (1) é G1; (2) é `pedido_dado` (sempre G3); (3) é G2 já vencida (`prescDays ≤ 0`); (4) é G3 com ação ∈ {criar_evento, corrigir_ficha, vincular_ef, confirmar_vigencia, lancar_ciencia}; (5) tem `reviewAt ≤ hoje` (G4: lembrete de 60 dias de "aguardando decisão" ou revisão de pausa 90 dias antes da data cedo (ou do termo projetado, se não há faixa), `presc.js:3903-3918`). Valor "em jogo" = soma do `value` de **todas** essas linhas (`ec.jsx:2177`).

Logo "Precisa de você" **não é "Urgentes" com outro nome**: é um superconjunto que contém G1 mais linhas promovidas de G3 e G4. Os grupos/kinds que um contador tem e o outro não:

| Entra em "Urgentes" (G1) | Entra em "Precisa de você" |
|---|---|
| `vencido`, `iminente` | `vencido`, `iminente` **e** `pedido_dado`; G3 com ação de um clique (`inconsistencia`; cadastro com `lancar_ciencia` / `confirmar_vigencia`); G2 vencido; G4 com `reviewAt` vencido |

### 3.2 Conciliação aritmética com os números informados

| Grupo | Lista (`totals`) | Mesa Prumo "No radar, sem alarme" | Diferença = linhas que a Mesa promoveu para "Precisa de você" |
|---|---|---|---|
| G1 | 101 | 0 (todo G1 é needs) | 101 |
| G2 | 0 | 0 | 0 |
| G3 | 490 | 288 | **202** |
| G4 | 491 | 462 | **29** |
| **Total em "Precisa de você"** | | | **101 + 202 + 29 = 332** |

- A soma fecha exatamente com a regra do código. A composição interna dos 202 (pedido de dado × cadastro com um clique) e dos 29 (lembrete de aguardando decisão × revisão de pausa) não é recuperável sem os dados.
- **Valor**: 45,9 − 8,0 ≈ **R$ 37,9 mi** correspondem às 231 CDAs promovidas de G3/G4, que o cartão "em jogo" soma como se fossem "risco", embora sejam pedidos de dado, cadastros e lembretes.
- **Universo** (supondo G7 = 0, pois o contador "Penhora antiga" só aparece se n>0 e não foi citado): 332 (precisa) + 750 (no radar) + 1122 (G5, escondidas no Silenciados) + 181 (consumadas antigas) = 2385 = 101 + 0 + 490 + 491 + 1122 + 181 (G1…G6 da Lista sem as 13 recentes duplicadas). As duas telas descrevem o mesmo conjunto de 2385 CDAs com recortes diferentes.
- **"Silenciados 2335"**: 1122 são as G5 (`mesaDrawerItems` as lança como "ainda_impossivel", `mesa.js:368-381`); os outros **1213** (adiados, parcelamento vigente, parcelada na ficha, `aguardando_reconhecimento`) **não existem na Lista**. As linhas `aguardando_reconhecimento` estão em `rows` (G4) e também em Silenciados (`mesa.js:352-366`): contam em "No radar" (ou "Precisa de você") e em "Silenciados" ao mesmo tempo.

### 3.3 "Consumadas 181" × "Consumada 194"

Contam coisas diferentes:

- Mesa Prumo, cartão **Consumadas 181** = `rows.filter(r => r.group === 6 && rowShowsInConsumada(r))` (`ec.jsx:2163`) = só as **antigas** (vencidas há > 180 dias; já fora do alarme).
- Lista e Painel Prumo, **Consumada 194** = `totals[6]` = G6 antigas **+ as `consumada==='recent'`** (vencidas há ≤ 180 dias; `presc.js:4076-4080`). Essas recentes **continuam em G1/G2 e portanto também estão em "Urgentes 101" e em "Precisa de você 332"**. 194 − 181 = **13** recentes; como G2 = 0, são G1 `vencido`.
- O cartão "Consumadas 181" abre a Lista filtrada em grupo 6 (`app.jsx:10913`), que mostra **194** ("inclui as consumadas há menos de 6 meses, que continuam em Urgentes", `app.jsx:10044`).
- O corte é 180 dias (`CONSUMADA_ALERT_WINDOW`, `presc.js:3565`), a tela diz "6 meses".
- "Consumada" pode ser etiqueta de uma **estimativa**: `consumadaClass` cobre `vencido`, `vencido_estimado` e `residual_alta` (`presc.js:3567-3583`); `residual_alta` (falta ciência; data "não antes de" ou previsão de planilha vencida) é classificada como "Consumada" quando essa data passou há mais de 180 dias, sem qualquer fato que prove consumação.

### 3.4 Outros números 101 / 332 na mesma edição (Prumo)

- 101 (G1): selo do menu lateral (`ec.jsx:425`), KPI do Hoje (`ec.jsx:657`), cartão "1 Urgentes" do Painel (`ec.jsx:3130-3133`).
- 101 como G1+G2 e R$ 8,0 mi como G1+G2: KPI "Risco prescricional" do Painel (`ec.jsx:3049-3053`).
- 332: só a Mesa, que é o destino padrão do item de menu e do Hoje.

---

## 4. Tabelas de referência

### 4.1 Kinds de alerta

Ordem real de avaliação em `classifyPainelPrescAlert` (`presc.js:3239-3454`): CDA "parcelada" só na ficha → nenhum alerta (`3256`); parcelamento vigente por evento → só a faixa dentro da janela (`3287`); `incidentOnly` → `inconsistencia` (`3289-3296`); **ajuizada**: penhora antiga / ciclo encerrado → estimado → pausado → vencido → iminente → faixa → ciclo (residual/correndo) → inconsistência → teto → piso → residual; **não ajuizada**: pausada com faixa → vencido → iminente → faixa → nenhum (`3443-3453`). Em CDA ajuizada a ordinária "aparece na coluna, sem alerta na fila" (`3367`). `aguardando_reconhecimento` (v2) **substitui** qualquer alerta pré-existente (`3260-3273`).

| kind | Texto na tela (`label` / `why`) | Grupo | Faixa | `action` (botão) | Critério resumido |
|---|---|---|---|---|---|
| `iminente` | why: "O termo calculado cai nos próximos 90 dias." / ordinária: "Os 5 anos para ajuizar vencem nos próximos 90 dias." / faixa de tese: "A data cedo cai nos próximos 90 dias. Peticionar antes dela; a data tarde é a tese da União." (`3836-3851, 3816-3820`) | 1 | alta | `conferir_autos` (sem botão primário) | 0 < dias ≤ 90 e resultado não estimado (`isImminentResult` `3007-3011`), em ajuizada com ciclo iniciado (`3350`) ou em não ajuizada (`3449`); ou faixa de **tese** com data cedo em 1…90 d (`3194-3200`) |
| `vencido` | why: "O prazo de 1 ano + 5 anos já venceu no cálculo." / "Os 5 anos da constituição venceram antes do ajuizamento." / "Os 5 anos para ajuizar já venceram no cálculo." / "O termo calculado já passou, mas há pedido sem resultado nos autos." (label "pedido pendente") / faixa: "Pela leitura mais desfavorável (data cedo), o prazo já venceu…" (`3816-3847`) | 1 | alta | `conferir_autos` | `isOverdueResult` (status prescrito/consumado ou dias ≤ 0, não estimado, `3001-3005`) com ciclo iniciado (`3341-3349`) ou não ajuizada não pausada (`3446-3448`); ou faixa de tese com data cedo ≤ 0 (`3195`). Se vencido há > 180 d → G6 |
| `vencido_estimado` | label: "Estimado — conferir nos autos" / "A data cedo passou. <motivo>" / "Vencido — conferir (estimado). Arquivamento datado + 6 anos."; why: "A data cedo já passou e falta o dado que a confirmaria. Conferir nos autos." ou "Pelo cadastro, a consumação já é a hipótese mais provável — conferir nos autos." (`3852-3857`) | 2 | alta | `conferir_autos` | (a) faixa de **dado** com data cedo passada (`3201-3207`); (b) ciclo iniciado e resultado estimado com dias ≤ 90 (`3328-3333`); (c) teto (arquivamento datado + 6 anos) ≤ 0 (`3380-3387`). G6 se > 180 d |
| `residual_alta` | labels: "Arquivada art. 40 sem data de ciência — pedir a data"; "Previsão de planilha, sem ciência lançada"; 'Data "não antes de" já passou há mais de 2 anos sem evento datado'; "Conferir cadastro / autos"; why: "Falta ciência lançada e o prazo operacional já apertou." (`3858-3861, 3410-3432`) | 2 | alta | `lancar_ciencia` se o label cita ciência/Arquivada, senão `conferir_autos` | sem ciclo iniciado e (arquivada sem data de ciência, ou previsão da planilha ≤ 90 d, ou piso vencido há > 2 anos sem evento datado, ou pedido sem desfecho); vira média se a planilha diz interrompida ou há garantia. Pode virar G6 |
| `residual_media` | labels: 'Data "não antes de" já passou — sem agravantes'; "Previsão de planilha, sem ciência lançada"; 'Sem protocolo — data "não antes de" incalculável'; why: "Sem ciência lançada; a data de acompanhamento já passou, sem agravante." (`3886-3889, 3433-3440`) | 4 (3 se `rowNeedsCadastro`) | média | `lancar_ciencia` | sem ciclo, piso vencido sem agravantes ou sem protocolo |
| `acompanhar_piso` | label: "Acompanhar a partir de dd/mm/aaaa"; why: "Ainda não pode ter prescrito: o ato mais recente mais 1 ano e 5 anos não chegou." (`3874-3877`) | **5** (v2, `3630`) | baixa | `lancar_ciencia` | piso ("não antes de") ainda no futuro (`3401-3408`); `reviewAt` = data do piso |
| `inconsistencia` | label: "vincule à execução fiscal" / "Status diz suspensa_…, sem evento suspensivo. Cadastre ou corrija."; why: "O número apontado é de incidente, não de execução fiscal." / "Há dado da ficha sem o fato correspondente nos eventos." (`3862-3869`) | 3 | alta | `vincular_ef` (incidente) ou `criar_evento` (status suspensa sem evento) | (a) v2 e o nº do processo coincide com IDPJ/cautelar (`3289-3296`); (b) status `suspensa_judicial`/`suspensa_admin` sem evento suspensivo (`3125-3136, 3369-3378`) |
| `vigiar_interrompido` | label: "Ciclo encerrado — vigiar nova inércia"; why: "O ciclo encerrou por resultado útil; vigiar nova inércia." (`3878-3881`) | 4 (3 se cadastro) | média | `lancar_ciencia` | ajuizada, ciclo iniciado, fase interrompida (penhora, bloqueio, citação…) e ainda não "penhora antiga" (`3320-3326`); `days = null`, data = `interruptAt` |
| `pausa_cadastrada` | label: "Exigibilidade suspensa — conferir evento"; why: "O prazo está pausado por fato lançado; conferir se a pausa ainda vale." (`3882-3885`) | 4 (3 se cadastro) | média | `confirmar_vigencia` ("Ainda vale") | ajuizada, ciclo iniciado, fase suspensa, sem faixa dentro da janela (`3334-3340`); `reviewAt` = data cedo − 90 d |
| `correndo` | label: "Prazo em curso"; why: "O prazo de 1 ano + 5 anos está em curso." (`3890-3893`) | 4 (3 se cadastro) | média | `nenhuma` | ajuizada, ciclo iniciado, nenhuma regra anterior se aplica (`3354-3365`): **qualquer prazo em curso, inclusive a anos de distância** |
| `aguardando_reconhecimento` | label: "aguardando decisão"; why: "A prescrição já foi apontada e aguarda decisão judicial." (`3870-3873`) | 4 | média | `nenhuma` + `silenceReason` | CDA marcada `prescriptionHandledType = aguardando_reconhecimento` (v2); `reviewAt` = marcação + 60 d (`3907-3910`) |
| `pedido_dado` | label por motivo (abaixo); why: "Falta um dado para fechar a data. Sem ele, a data cedo cai nos próximos 90 dias." (`3822-3825`) | 3 | média | A5/A6 `confirmar_vigencia`; B2/B3 `lancar_ciencia`; C1 `corrigir_ficha(constituicao)`; demais `conferir_autos` (`3173-3179, 3208-3221`) | faixa de **dado** (A5, A6, B2, B3, C1) com data cedo entre 1 e 90 d (`3185-3222`) |
| `penhora_antiga` | label: "<penhora/bloqueio> informada em dd/mm/aaaa: mais de 6 anos sem outro fato lançado"; why: "Penhora ou bloqueio efetivo há mais de 6 anos, sem outro fato lançado. Analisar o caso: houve nova ciência de insuficiência?" (`3826-3829`) | **7** | média | `analisar_penhora` | intercorrente interrompida por penhora/arresto/Sisbajud/CNIB há > 6 anos (`penhoraAntigaInfo` `372-390`) e sem análise vigente (< 365 d e sem fato novo, `3227-3233`) |
| `avaliar_174` | — | — | — | — | consta em `PAINEL_PRESC_KINDS` (`2936`) e em `prazosKeyMeta` (`3666`), mas nenhum ramo de `classifyPainelPrescAlert` o devolve: **nunca ocorre** |

Rótulos de `pedido_dado` por motivo (`BAND_DADO_ACTION`, `3173-3179`): A5 "A pausa ainda vale?"; A6 "O parcelamento segue vigente?"; B2 "Lançar a data da ciência (certidão)"; B3 "Lançar a data da ciência"; C1 "Informar vencimento ou constituição definitiva"; outros "Completar o dado que falta".

Selo de certeza da linha (`mesaCertainty`, `mesa.js:12-23`; nomes Prumo em `ec.jsx:1538`): faixa de tese → **faixa** ("Cedo–tarde"); faixa de dado ou `pedido_dado` → **dado** ("Falta dado"); `penhora_antiga` → **analisar**; `vencido`, `iminente`, `vigiar_interrompido`, `correndo` → **calculado**; `vencido_estimado`, `residual_alta`, `residual_media`, `acompanhar_piso` → **estimado**; `inconsistencia` ou G3 → **cadastro**; G1 → calculado, G2 → estimado, resto → cadastro (inclui `pausa_cadastrada` e `aguardando_reconhecimento`).

`prescFaixa` (alta/média/baixa) é gravada na linha (`presc.js:3509`) mas **nenhuma tela a lê**.

### 4.2 Grupos 1–7 e o nome que cada tela lhes dá

`PRAZOS_GROUP_LABELS` (`presc.js:3554-3562`): 1 "Vencido ou iminente"; 2 "Provável — conferir nos autos"; 3 "Cadastro a completar"; 4 "Em acompanhamento"; 5 "Ainda impossível"; 6 "Consumada"; 7 "Penhora antiga — analisar". Usado em tooltips (`app.jsx:10015`, `ec.jsx:2112`), nos cabeçalhos "Grupo N · …" da Mesa clássica (`app.jsx:9860`), no subtítulo e nos títulos de grupo da Mesa Prumo (`ec.jsx:2228, 2231`) e na ficha da CDA Prumo (`ec.jsx:3970`).

| G | Lista (contador / "Mostrando só", `app.jsx:10034-10044`) | Mesa clássica/Beta | Mesa Prumo | Painel clássico / Beta | Painel Prumo (`ec.jsx:2935`) |
|---|---|---|---|---|---|
| 1 | **Urgentes** | dentro de "PRECISA DE VOCÊ" (todo G1) | dentro de "Precisa de você" | tile "N urgentes"; KPI clássico "Risco prescricional" (G1+G2, valor só G1); KPI Beta "Prazos: N urgentes" | **Urgentes**; KPI "Risco prescricional" (G1+G2, valor G1+G2) |
| 2 | **A conferir** | "Precisa de você" se vencido; senão "O RESTO · Grupo 2 · Provável — conferir nos autos" / "G2 n" | "Precisa de você" ou "No radar, sem alarme" (G2 n) | tile "N a conferir" | **A conferir** |
| 3 | **A completar** | "Precisa de você" se `pedido_dado` ou ação de um clique; senão "O RESTO · Grupo 3 · Cadastro a completar" / "G3 n" | idem / "No radar" (G3 n) | tile "N a completar"; Beta "N para completar cadastro" | **A completar** |
| 4 | **Acompanhamento** | "O RESTO · Grupo 4 · Em acompanhamento" / "G4 n" (ou "Precisa de você" se `reviewAt` vencido) | "No radar, sem alarme" (G4 n; nome longo "Em acompanhamento" no subtítulo) | — | **Em acompanhamento** |
| 5 | **Ainda impossível** (e "Ainda impossível — N inscrição(ões) recolhidas") | só "· G5 n" no cabeçalho de "O RESTO" e dentro de "SILENCIADOS" | **Silenciados** (motivo "Ainda impossível"; subtexto "…ainda impossíveis") | — | **Ainda impossível** |
| 6 | **Consumada** (`Consumada` singular; filtra G6 ∪ recentes) | não aparece | cartão **Consumadas** ("para análise, fora do alarme"), só as antigas | — | **Consumadas** (G6 ∪ recentes) |
| 7 | **Penhora antiga** (só se n>0) | "PENHORA ANTIGA — ANALISAR" | "Penhora antiga — analisar" | — | não aparece |

Outros nomes para os mesmos grupos:

| Onde | G1 | G2 | G3 | G4 | G5 | G6 | G7 |
|---|---|---|---|---|---|---|---|
| Hoje Prumo | "urgentes"; "grupo urgente de prescrição" (`ec.jsx:639, 657`) | (entra na fila com chip laranja) | — | — | — | — | — |
| Hoje Beta | item "Prescrição", `urgent` | item "Prescrição" | — | — | — | — | — |
| Gaveta da intimação Prumo (`ec.jsx:1369`) | "Urgente" | "A conferir" | "A completar" | "Acompanhamento" | **"Sem risco"** | sem chip | sem chip |
| "Alarme" (`ec.jsx:1291, 1363`; `ec.jsx:2746`; `app.jsx:5606`) | "N no alarme" (só G1) | | | | | | |
| "Alarme" (Visão geral Prumo, relatório) | G1+G2: "N CDAs no alarme de prescrição" (`ec.jsx:2746`), "Alertas: CDAs no alarme (grupos 1 e 2)" (`app.jsx:5606`) | | | | | | |
| Card do processo (`prazosRiskMetaForCdas`, `presc.js:4121-4129`) | "N urgentes" | "N a conferir" | "N a completar" | "em acompanhamento" | "ainda impossível" | "consumada" | "em acompanhamento" |
| Card do processo Beta (`app.jsx:7814`) / trilho clássico (`app.jsx:8145`) | "VENCIDA" (G1 vencido) / "Prescrita" (dias ≤ 0 em G1/G2) | | | | | | |
| E-mail (`RD:201-228`) | seção "Prescrição se aproximando" | idem | idem | só ≤ 90 d | nunca | entra se ≤ 90 d (inclui vencidas) com "VENCIDA — conferir" | (v1: não existe) |

---

## 5. Ações

### 5.1 `MESA_ONE_CLICK` e `applyMesaAction`

`MESA_ONE_CLICK = {criar_evento, corrigir_ficha, vincular_ef, confirmar_vigencia, lancar_ciencia}` (`mesa.js:10`). Ele **só decide quem sobe para "Precisa de você" dentro do G3** (`mesa.js:38`); não decide se há botão. O botão primário aparece sempre que `action.type` não é `nenhuma` nem `conferir_autos` (`app.jsx:9754`; `ec.jsx:2132`), inclusive `analisar_penhora`, que não está no conjunto.

`applyMesaAction` (`app.jsx:9579-9610`), usado pela Mesa clássica/Beta e pela Mesa Prumo (`app.jsx:10911`):

| `action.type` | Gerado por | Botão (clássico `app.jsx:9756` / Prumo `ec.jsx:1547`) | O que acontece | No lugar? |
|---|---|---|---|---|
| `criar_evento` | `inconsistencia` (status suspensa sem evento) | "Lançar fato" | Abre o modal "Evento prescricional" (`openPrescEventForRow`, `app.jsx:9535-9551`) com a CDA, foco na data e `activeOpId` da operação. `action.eventType` **nunca é preenchido pelo motor** (nenhuma ocorrência em `src/lib`), então não há tipo pré-selecionado | sim, modal sobre a Mesa |
| `corrigir_ficha` | `pedido_dado` C1 | "Informar datas" (C1) / "Corrigir ficha" | Modal "Editar inscrição" com foco em `dueDate` (constituição) ou `prescriptionDate` (`app.jsx:9598-9607`) | sim, modal |
| `vincular_ef` | `inconsistencia` por `incidentOnly` | "Vincular EF" | Modal "Editar inscrição" com foco em `processNumber` | sim, modal |
| `confirmar_vigencia` | `pedido_dado` A5/A6; `pausa_cadastrada` | "Ainda vale" | `confirmPauseStillValid` (`app.jsx:9552-9567`): grava `verifiedAt = hoje` nos eventos de `action.eventIds` ou, na falta, em todas as pausas abertas não herdadas da CDA; toast "Pausa conferida hoje". Se não achar pausa, **navega** (`openCdaInscricoes`) | sim (gravação direta, sem confirmação); fallback navega |
| `lancar_ciencia` | `pedido_dado` B2/B3; `residual_alta` (label cita ciência); `residual_media`; `vigiar_interrompido`; `acompanhar_piso` | "Lançar ciência" | Modal de evento com tipo `marco_sem_bens` e foco na data (`app.jsx:9594-9597`) | sim, modal |
| `analisar_penhora` | `penhora_antiga` | "Marcar analisada" | `window.prompt` pedindo a conclusão; grava `debt.penhoraAnalise {at, nota}` (`app.jsx:9568-9578`); a CDA volta à lista com fato novo ou em 365 dias (`presc.js:3225-3233`) | sim (prompt + gravação) |
| `conferir_autos`, `nenhuma`, ausente | G1, G2, `residual_alta` genérico, `pedido_dado` genérico, `correndo`, `aguardando` | nenhum botão primário | — | — |
| botão **Conferir** (em toda linha) | — | "Conferir" | `applyMesaAction({action:{type:'conferir_autos'}})`, que cai no fim da função: `openCdaInscricoes(r, {scrollCols:true})` — **idêntico ao botão Abrir** (`app.jsx:9743-9744, 9609`; `ec.jsx:2138-2139`) | não: navega |
| botão **Abrir** | — | "Abrir" | `openCdaInscricoes` (`app.jsx:9216-9230`): seta a operação ativa, abre a aba Inscrições, expande a CDA e rola até as colunas; no Prumo abre a gaveta da CDA (`ec.jsx:4802-4816`) | não: navega |
| botão **Evento** | — | "Evento" | `openPrescEventForRow(r)` (modal) | sim |
| `isParc` (criar_evento + `eventType 'susp_parcelamento'`) | ninguém | campo de data + "Lançar adesão" (`app.jsx:9732-9740`; `ec.jsx:2133-2136`) | `createInlineParcelamento` (`app.jsx:9642-9654`) | **inalcançável** (ver 6-H) |

### 5.2 Tipos de `prescriptionHandled`

- Marcas: `prescriptionHandled` (bool), `prescriptionHandledAt`, `prescriptionHandledType`.
- Valores oferecidos no formulário da inscrição ("Forma", `app.jsx:14207-14212`): `aguardando_reconhecimento` ("Prescrita — aguardando reconhecimento judicial"), `declarada` ("Declarada e baixada no processo"), `analisada_nao_consumada` ("Analisada — não houve prescrição"), `extinta` ("Extinta por prescrição"). `reconhecida` consta em `HANDLED_TERMINAL` (`presc.js:2939`) mas nenhum formulário a oferece. Status `extinta` da CDA grava `prescriptionHandledType 'extinta'` (`app.jsx:4748`).
- Quem grava: **"Tratar"** na Lista (`markPrazosHandled`, `app.jsx:9466-9479`; tipo `declarada`, sem confirmação nem escolha); **✓** na CDA do card do processo / **"✓ Tratada"** na gaveta Prumo (`toggleCdaHandled`, `app.jsx:931-937`; padrão `declarada`); **⏳** / "⏳ Aguardando reconhecimento" (`markCdaAguardando`, `app.jsx:938-961`: confirma, grava `aguardando_reconhecimento` e oferece criar a tarefa "Solicitar reconhecimento de prescrição"); formulário; importação NEXUS (`presc-import.js:359`). **A Mesa (clássica e Prumo) não tem nenhum desses botões.**
- Efeito no radar: qualquer tratada sai (`presc.js:2980-2987`), **exceto** `aguardando_reconhecimento` na v2, que fica como kind `aguardando_reconhecimento` (G4), com `silenceReason`, lembrete em 60 dias e presença em Silenciados.
- Detalhe: o laço dos "silenciados por parcelamento" ignora apenas tratadas dos tipos de `HANDLED_TERMINAL` (`presc.js:4035-4036`); uma CDA tratada como `analisada_nao_consumada` com parcelamento vigente por evento entra em Silenciados como "Parcelamento vigente".

### 5.3 Adiamento (snooze)

- **Motivos** (`PRESC_SNOOZE_REASONS`, `presc.js:2941-2947`): `aguardando_certidao` "Aguardando certidão"; `peca_protocolada` "Peça protocolada"; `garantia_em_analise` "Garantia em análise"; `nao_priorizar_agora` "Não priorizar agora"; `outro` "Outro" (exige texto, `app.jsx:9613-9616`; `ec.jsx:2145`).
- **Limites por grupo** (`snoozeLimitDays`, `presc.js:2949-2956`): G1 **14 d**; G2 **30 d**; G3 **7 d**; G4 30 d (padrão); G5 90 d; G6 90 d; G7 30 d (padrão). A data sugerida é o máximo (`mesa.js:396-398`; `app.jsx:9696`; `ec.jsx:2140`); `applyPrescSnooze` corta no máximo (`app.jsx:9618-9620`) e `snoozeEffectiveUntil` repete o corte na leitura (`presc.js:3920-3928`).
- **Gravação**: `debt.prescSnooze = {until, reason, at, group, note?}` (`app.jsx:9611-9632`). Enquanto vale, a linha sai de `rows`/`totals` e vai para `silenced`, com o rótulo do motivo e "até dd/mm" (`presc.js:4005-4018`); "Reabrir agora" apaga o adiamento (`app.jsx:9633-9641`).
- **Volta antes do prazo** (`snoozePierced`, `presc.js:3930-3941`): `until` efetivo ≤ hoje; motivo inválido ou "Outro" sem nota; **o grupo piorou** (grupo atual < grupo gravado); **evento novo** lançado depois da data do adiamento. Enquanto o `prescSnooze` persiste e a linha voltou, a linha mostra "expirou o silêncio" (Mesa clássica, `app.jsx:9726`) / "o adiamento venceu" (Prumo, `ec.jsx:2116`).
- "N voltam esta semana" conta `silenced` com `until` nos próximos 7 dias e motivo de adiamento (`countSnoozeDueThisWeek`, `mesa.js:386-394`).
- **Onde existe**: só na Mesa (clássica e Prumo). Não há na Lista, no Hoje nem na ficha. G5 e G6 têm limite definido mas não têm botão (G5 está escondida e G6 fora da Mesa).

### 5.4 O botão "Ainda vale"

Três pontos de entrada, todos gravam `verifiedAt = hoje` no evento de pausa sem fim:
1. Ação primária da linha na Mesa (`confirmar_vigencia`) — em lote, em todas as pausas abertas não herdadas da CDA se a linha não traz `eventIds` (`app.jsx:9552-9567`).
2. Ficha da CDA, bloco "Pausas sem data de fim", um botão por pausa (`app.jsx:13123-13134`, `confirmPauseEvent` `9481-9490`); some para pausa herdada do IDPJ (`inherited`) e, no Prumo, só existe na primeira coluna da pilha e se ela não for a decadência (`ec.jsx:3952`).
3. Formulário do evento: campo "Última conferência (ainda vale)" com botão "Ainda vale hoje" (`app.jsx:14785-14791`); salvar uma pausa sem fim já conta como conferida no dia (MOTOR R4).
Efeito: a data cedo da pausa sem fim (A5) ou do parcelamento vigente (A6) passa a ser a última conferência (`lastConference`, `presc.js:781-785`; `scenarioSuspEnd` `791-807`), e, se a data cedo sair da janela de 90 dias, o alerta `pedido_dado` / `pausa_cadastrada` deixa de estar na fila. O texto na ficha: "A data cedo presume que a pausa acabou na última conferência" (`app.jsx:13132`).

---

## 6. Incoerências observadas

Só constatações, com referência. Onde a afirmação depende dos dados reais do usuário, está dito.

### 6-A. Mesmo conceito, nomes diferentes

1. **Grupo 1**: "Urgentes" (Lista `app.jsx:10034`, Painel `app.jsx:11006`, Painel Prumo `ec.jsx:2935`, Hoje `ec.jsx:657`); "Vencido ou iminente" (`presc.js:3555`, tooltip do chip e títulos); "Urgente" (gaveta da intimação, `ec.jsx:1369`); "no alarme" (`ec.jsx:1363`, só G1; mas "alarme" = G1+G2 em `ec.jsx:2746` e `app.jsx:5606`); "VENCIDA" (Beta, `app.jsx:7814, 12285`); "Prescrita" (trilho clássico, `app.jsx:8146`); "Precisa de você" (Mesa, que inclui G1 mas é maior).
2. **Grupo 3**: "A completar" × "Cadastro a completar" (`presc.js:3557`) × "para completar cadastro" (KPI Beta, `app.jsx:10992`) × "pedido de dado" / "Falta dado" (selo da Mesa, `ec.jsx:1538`) × "Cadastro" (outro selo, mesmo texto para G3).
3. **Grupo 4**: "Acompanhamento" (Lista) × "Em acompanhamento" (Painel Prumo, rótulo do motor) × "No radar, sem alarme" (Mesa Prumo, que não é só G4) × "O RESTO" (Mesa clássica/Beta).
4. **Grupo 5**: "Ainda impossível" (Lista, Painel Prumo) × "Sem risco" (gaveta da intimação, `ec.jsx:1369`) × "G5 n" (Mesa clássica) × um dos motivos de "Silenciados" (Mesa Prumo; o motivo `ainda_impossivel`, `mesa.js:368-381`).
5. **Grupo 6**: "Consumada" (Lista) × "Consumadas" (Painel, Mesa Prumo) × "consumada" (cartão do processo) × "VENCIDA — conferir" (e-mail, `RD:220`) × "vencida" (linha do tempo, `ec.jsx:1734`) × "Prescrita" (trilho clássico).
6. **Adiado**: "Adiar…" (botão) × "Adiada até …" (toast, `app.jsx:9631`) × "Silenciados" (bloco) × "fora da fila" (texto do motor) × "expirou o silêncio" (`app.jsx:9726`) × "o adiamento venceu" (`ec.jsx:2116`) × "voltam esta semana".
7. **Nome da aba**: "Prazos extintivos" (clássico e Prumo) × "Prescrição" (aba Beta, `app.jsx:10550`) × "Mesa de prazos" (modo) × "Lista" / "Lista completa". "Mesa" também é a fila de intimações (`ec.jsx:419`) e o botão "Mesa" do Hoje Beta (`app.jsx:10192`).
8. **Relógio**: "Prescrição ordinária" / "ordinária" / "Ordinária" (etiqueta Prumo) / "5 anos para ajuizar" / "crédito" (`r.segment==='credito'`, `ec.jsx:1833`); "intercorrente" / "1 ano + 5 anos" / "art. 40".
9. **Certeza do prazo**: selo da linha da Mesa (calculado, estimado, cadastro, faixa, dado, analisar) × selo da coluna da ficha (faixa, calculado, estimado, sem dados, `presc.js:2625-2634`) × "Cálculo" (`Ficha`, Beta, `app.jsx:9724`).
10. **Frase de situação da mesma CDA em pelo menos cinco vocabulários**: Lista = `summary` (texto do cálculo: "Prazo de 1 ano + 5 anos vencido em …"); Mesa = `why` ("O prazo de 1 ano + 5 anos já venceu no cálculo."); linha fechada = `betaCdaClosedLine` ("prescrição intercorrente consumada — data"); ficha = `col.summary` + selo; linha do tempo = status legado ("Prescrição · vencida"); Prumo = "Nd vencido · dd/mm" (`ec.jsx:4195-4206`).

### 6-B. Números que não batem entre telas

1. **101 × 332 na mesma edição (Prumo)**: selo do menu, Hoje, Painel e Lista dizem 101; a Mesa, destino padrão do menu, diz 332 (seção 3).
2. **Valor**: Mesa Prumo "em jogo" = todas as linhas "Precisa de você" (R$ 45,9 mi); Hoje "urgente" = G1; Painel Prumo "em risco" = G1+G2 (`ec.jsx:3019`); Painel clássico = contagem G1+G2 com valor só do G1 (`app.jsx:10969-10971, 10999`); `MOTOR_PRESCRICAO.md` R14 diz "O valor do cartão Prazos soma só o grupo 1".
3. **Consumadas 181 × 194** (seção 3.3); a soma dos seis cartões do Painel Prumo (101+0+490+491+1122+194 = 2398) excede o número de CDAs distintas (2385) porque as 13 recentes contam em dois cartões (`presc.js:4076-4080`).
4. **Clique que leva a outro número**: Hoje (Prumo e Beta) e o tile "N urgentes" do Painel clássico/Beta chamam `openPrazos(g)`, que grava o filtro de grupo e abre a aba sem trocar o modo (`app.jsx:3973-3976`); com `prazosDeskMode = 'mesa'` (padrão) aparece a Mesa, que **ignora o filtro de grupo** (`ec.jsx:2159-2168`; `app.jsx:9897`): "101 urgentes" → Mesa com 332. O selo "101" do menu lateral Prumo também leva à Mesa (`ec.jsx:425`). O cartão "Consumadas 181" abre a Lista com 194 (`app.jsx:10913`).
5. **Silenciados**: mistura global com filtrado — o filtro de operação/pessoa/busca é aplicado às linhas (G5 e `silenceReason`) mas **não** a `prazosRadar.silenced` (adiados, parcelamento vigente), nem ao "N voltam esta semana" (`app.jsx:9808-9809`; `ec.jsx:2172-2173`). Com uma operação escolhida, o cartão soma itens de todas as operações. As linhas `aguardando_reconhecimento` aparecem em "No radar"/"Precisa de você" **e** em Silenciados (`mesa.js:352-366`). O subtexto do cartão diz "parcelados, adiados e ainda impossíveis" e não menciona as "aguardando decisão".
6. **Contadores da Lista ignoram filtros** (`app.jsx:9899, 9970-9984`); a frase "Mostrando todos os grupos, exceto Consumada · N inscrição(ões)" conta também as G5 recolhidas (`app.jsx:9932-9945, 10045`). O cartão Prumo "Consumadas" respeita operação/pessoa mas não a busca (`ec.jsx:2159-2168`).
7. **Outros relógios que disputam a atenção**: "Presc. Interc. — ≤365 dias" e "Processos em alerta — crítico, alerta ou vencido" usam o status legado do motor (≤365 d crítico, ≤730 d alerta; `presc.js:497-512`; `app.jsx:6003-6017`; `ec.jsx:2056`) e a linha do tempo Prumo também (`ec.jsx:1771-1776`), sem relação com os grupos nem com a janela de 90 dias; o e-mail usa 180 dias (v1).
8. **Visão geral da operação (Prumo)**: o stat diz "Prescrição · CDAs N nos grupos urgentes" (G1+G2, `ec.jsx:2055`; `app.jsx:5984`) e, ao lado, o card "Prazos extintivos" lista a "Precisa de você" da operação ou "Nada exige decisão agora" (`ec.jsx:2074-2082`); podem discordar na mesma página.
9. **Ordenação por data que mistura datas de naturezas diferentes**: a chave `prescDate` é a data cedo para faixa, o termo calculado para vencido/iminente, o piso ou a previsão da planilha para `residual_*`/`inconsistencia`, `interruptAt` para `vigiar_interrompido`, `limitDate` para penhora antiga (`presc.js:3146-3170, 3321-3325, 3311-3318, 3402-3407, 3421-3440`). `compareMesaRows` (`mesa.js:44-49`) ordena por essa chave e por valor, sem usar grupo, tipo de ação ou relógio; dentro de "Precisa de você" um vencido, um pedido de dado a 80 dias e um cadastro com data de piso passada convivem na mesma fila ordenada só por data.
10. **Data tarde × data cedo**: o código avalia `vencido`/`iminente` pela data **tarde** (resultado principal) antes de olhar a faixa (`presc.js:3341-3353` precede `bandHit`; o mesmo na não ajuizada, `3446-3452`); quando a tarde já está vencida ou dentro dos 90 dias, a linha usa a data tarde, sem `bandHit` (selo "calculado" em vez de "faixa", texto "O termo calculado…"), mesmo que a cedo seja anterior. A tela diz "pela data cedo" (`ec.jsx:2208`; R14).
11. **Tooltips que prometem "mesmos números"**: Painel Prumo (`ec.jsx:3049, 3134`) e Painel clássico (`app.jsx:10997`) dizem repetir a tela Prazos extintivos; só repetem a Lista (G1/G2), não a Mesa.
12. **Formatos de valor**: Lista em reais completos (`fmtCur`, `app.jsx:9981`); Mesa Prumo, Hoje e Painel Prumo abreviados (`cxMoneyShort`, `ec.jsx:166-172`).

### 6-C. Avisos de decadência (o usuário não quer nenhum)

A decadência **não gera linha, contador, alerta nem e-mail**: `classifyPainelPrescAlert` não a consulta (`presc.js:3236`) e a regra R1 diz que ela "nunca alarma". Ainda assim, aparece passivamente em:

1. **Ficha da CDA**: coluna "Decadência" sempre que há dados, em todas as edições (`app.jsx:13116-13120`; `computeCdaLegalTimeline` `presc.js:2912-2929`), com selo (faixa/calculado/estimado/sem dados), régua, situação e "Conferir nos autos". Frases de aviso geradas por `withDecadenciaView` e `computeDecadenciaCore`: "Prazo vencido em dd/mm sem constituição registrada." (`presc.js:2546-2549`), "Constituição em …, depois do fim do prazo." (`2534, 2545`), "…decadência consumada (art. 156, V, CTN). Verificar a modalidade e eventual dolo/fraude" (`2850`), "Inscrição … posterior ao termo final … a decadência consumou-se — verificar." (`2867`), "Não calculada: faltam período de apuração e modalidade de lançamento." (`2523`) e os itens a conferir "Informar período de apuração e modalidade de lançamento na inscrição." (`2524-2543`).
2. **Faixa D3 "Decadência (art. 173, I): cedo no ano seguinte ao fato gerador; tarde no ano seguinte ao vencimento"** (`presc.js:271, 2766-2778`), exibida na coluna como faixa cedo–tarde, com `alarme:false`.
3. **Selo "Decad."** vermelho/amarelo nas linhas de CDA da aba Inscrições (`app.jsx:7323, 7334`; `ec.jsx:4718, 4733`), todas as edições, com a mensagem no tooltip.
4. **Gaveta da CDA no Prumo**: a pilha ordena pela contagem mais grave (`ec.jsx:3947-3950`); `LEGAL_SEVERITY` dá 6 a "consumada" (`presc.js:2901-2908`) e, em empate, a decadência vem primeiro (`presc.js:2918-2926`), então uma decadência "consumada" (6) ou "risco" (3) — ou "em curso" (2), que empata com "correndo" — abre a gaveta e empurra a intercorrente para baixo. Nesse caso o bloco de pausas e o "Ainda vale" não são renderizados na coluna de topo (`ec.jsx:3952`; `app.jsx:13114`).
5. **Memória técnica** (copiar/baixar, inclui a seção "DECADÊNCIA…", `presc.js:4143`) e o seletor de escopo "Decadência" na ficha (`app.jsx:13320`).
6. **Formulário da inscrição**: bloco "Datas do crédito (decadência / prescrição ordinária)" (`app.jsx:14086-14091`).
7. **Previsto e inalcançável**: etiqueta "Decadência" no cartão da Mesa Prumo (`ec.jsx:2107`), pois o motor só emite `prescSegment` `intercorrente` ou `ordinaria` (`presc.js:3274-3275`).

### 6-D. Consumadas antigas em destaque

1. Contador **"Consumada"** sempre visível no cabeçalho da Lista, ao lado dos demais (`app.jsx:10039`); cartão "Consumadas" no Painel Prumo (`ec.jsx:2935`) e na Mesa Prumo (`ec.jsx:2197-2199`, "para análise, fora do alarme").
2. **E-mail diário**: consumadas antigas (G6) entram em "Prescrição se aproximando" com "VENCIDA — conferir", porque o critério para grupos ≠ 1/2/3/4/5 é só `dias ≤ 90` (`RD:211-215, 220`).
3. **Linha do tempo Prumo**: "Prescrição · vencida" e marca "venceu em …" sem corte de data (`ec.jsx:1916, 1914-1915`).
4. **Cartão do processo**: rótulo "consumada" quando o pior grupo é G6 (`presc.js:4127`); trilho clássico mostra "Prescrita" para qualquer G1/G2 com dias ≤ 0 (`app.jsx:8146`), inclusive estimativas (`vencido_estimado`).
5. **Agenda clássica/Beta**: coloca no calendário a data de qualquer CDA, sem corte por grupo (`app.jsx:10470-10485`).
6. **Recentes (≤ 180 d)** não são "antigas", mas já estão vencidas e seguem como "Urgentes" e em "Precisa de você", com linha vermelha (`mesa.js:25-29`; `app.jsx:9717`).
7. **A etiqueta "Consumada" cobre estimativas**: `residual_alta` e `vencido_estimado` viram G6 (> 180 d) pela data "não antes de"/planilha/teto, não por fato consumador (`presc.js:3567-3583`).

### 6-E. Itens sem ação possível apresentados como urgentes

1. Toda linha **G1** (`iminente`/`vencido`) tem `action = conferir_autos` (`presc.js:3816-3851`): na Mesa, o único caminho é Evento, Abrir/Conferir (navegação) ou Adiar; **não há "Tratar" nem "Aguardando reconhecimento" na Mesa** (`app.jsx:9741-9758`; `ec.jsx:2131-2141`). O botão primário só existe para ações diferentes de `conferir_autos`/`nenhuma` (`app.jsx:9754`).
2. **G2 vencido** sobe para "Precisa de você" (`mesa.js:36`) com `conferir_autos`.
3. **`pedido_dado` genérico** ("Completar o dado que falta", `presc.js:3209`) sobe para "Precisa de você" (`mesa.js:35`) sem botão que diga qual dado.
4. **`aguardando_reconhecimento`** com lembrete vencido sobe a "Precisa de você" (`mesa.js:39`) com `action = nenhuma` (`presc.js:3870-3873`); a única ação é Adiar/Abrir.
5. As 13 **consumadas recentes** (se os dados confirmarem) são G1 "Urgentes" cujo prazo já passou.
6. G3 limita o adiamento a 7 dias (`presc.js:2952`), então uma linha de cadastro que "precisa de você" e não pode ser resolvida logo volta em uma semana.
7. G4 `correndo` tem `action = nenhuma` e entra na Agenda Prumo (G ≤ 4, `agenda.js:61`) com data distante, sem ação.

### 6-F. Ações que levam à operação quando poderiam ser feitas no lugar

1. **Abrir** e **Conferir** fazem exatamente a mesma coisa em toda linha (`app.jsx:9743-9744, 9609`; `ec.jsx:2138-2139`): saem da tela de Prazos, trocam a operação ativa, abrem a aba Inscrições e (no Prumo) a gaveta; o contexto da Mesa/Lista (posição de rolagem) se perde, embora os filtros persistam.
2. O **"Conferir nos autos"** (itens `prescChecks`) só é marcável na ficha da CDA (`app.jsx:13196-13204`); a Lista mostra a primeira pendência sem checkbox (`app.jsx:10022`); a Mesa não a mostra.
3. **Marcar tratada / aguardando reconhecimento / "não houve prescrição"**: só Lista ("Tratar", tipo fixo `declarada`, sem confirmação), card do processo, gaveta Prumo ou formulário.
4. **Hoje (Beta e Prumo)**: clicar numa CDA abre a tela de Prazos no grupo (`app.jsx:9390`; `ec.jsx:623`), não a CDA nem uma ação.
5. **Painel e Visão geral**: os cartões navegam; nenhum executa.
6. `confirmar_vigencia` cai em navegação quando não encontra pausa (`app.jsx:9561`).
7. **Lista sem Adiar nem "Ainda vale"** (só existem na Mesa); **Mesa sem Tratar**; **Hoje sem nenhuma ação sobre a CDA**.
8. **Linha do tempo Prumo**: clicar numa CDA "sem processo · ajuizar" navega para a operação (`ec.jsx:1915`).
9. Em `analisar_penhora` a conclusão é pedida por `window.prompt` (`app.jsx:9569`), fora do padrão de modais das outras ações.

### 6-G. Duplicações entre Hoje, Painel, Mesa e Lista

A mesma CDA em G1 pode aparecer, ao mesmo tempo, em: Hoje (fila, se ≤ 7 d ou vencida, e KPI), Painel (contagem), Mesa ("Precisa de você"), Lista ("Urgentes"), Visão geral da operação (card, top 5 + stat), menu (selo e ponto), Carteira (contador), gaveta da intimação ("no alarme"), Agenda (dia do `keyDate`), Relatório de passagem (alertas e próximos 15 dias), linha do tempo (como pior CDA do processo), cartão do processo (rótulo) e e-mail. Cada uma com recorte e texto próprios (G1; G1+G2; G1–G4; status legado; needs).

Duplicidade dentro de uma mesma tela: `aguardando_reconhecimento` em "No radar" (ou "Precisa de você") e em "Silenciados"; "recentes" em "Urgentes" e em "Consumada".

### 6-H. Controles e estados previstos, mas inalcançáveis (para não serem tomados como comportamento atual)

1. "+N acima do orçamento" / "itens acima do limite": `MESA_CAP = Infinity` (`mesa.js:9`), `overCap` sempre vazio (`app.jsx:9832-9837`; `ec.jsx:2211-2212`). R14 já diz "sem teto".
2. Entrada de data "Lançar adesão" na linha da Mesa (`isParc`): depende de `action.eventType === 'susp_parcelamento'`, que o motor nunca define (`app.jsx:9715, 9732-9740`; `ec.jsx:2100, 2133-2136`).
3. Etiqueta "Decadência" no cartão da Mesa Prumo (`ec.jsx:2107`).
4. Kind `avaliar_174` (`presc.js:2936, 3666`).
5. `prescFaixa` (`presc.js:3509`) e `byOp` (`presc.js:4082-4088`) são calculados e não são lidos pelas telas.
6. Tipo de tratamento `reconhecida` (`presc.js:2939`) sem forma de gravar.
7. Botão "Regras v… ⓘ" na gaveta da CDA do Prumo recebe `onOpenRules={() => {}}` (`ec.jsx:3952`).
8. A frase da regra R7 diz que a dúvida da constrição no incidente "não vai à fila geral" e o aviso fica no card do processo; o mesmo texto também é gravado como `processNotes` e aparece no cabeçalho do grupo da Mesa e da Lista quando a CDA tem linha no radar (`presc.js:3976-3989`; `app.jsx:10158-10160`; `ec.jsx:1557`). (Documentado em R7 apenas para "IDPJ sem constrição lançada".)

### 6-I. Estado persistido que afeta o que o usuário vê

1. `prazosFilters` (incluindo o filtro de grupo) é salvo em `appSettings` (`app.jsx:3944, 3971`) e sobrevive entre sessões; a Mesa não o lê e a Lista o aplica silenciosamente (aparece só na frase "Mostrando só: …", `app.jsx:10043-10045`).
2. `prazosDeskMode` (padrão "mesa") é uma única chave para as três edições (`app.jsx:3108, 9676`): trocar de edição troca de Mesa (a de `app.jsx` ou a do Prumo) com o mesmo valor salvo.
3. Dobras da Mesa Prumo (Resto, Penhora, Silenciados) não persistem; blocos da gaveta e do Painel, sim (localStorage).

---

## 7. O que esta leitura não verifica

- Os números reais (332, 202, 29, 13, 1213…). A conciliação 101 + 202 + 29 = 332 e 181 + 13 = 194 é consistente com o código; a composição interna de cada parcela exige os dados.
- Estilos (CSS em `src/Nexus.shell.html`) e o que está efetivamente publicado em `Nexus.html`/`demo_experimental.html`; o inventário é do código-fonte em `src/` (nenhum arquivo foi alterado nem recompilado).
- Comportamento em tempo de execução de `window.prompt`/`confirm` e do `localStorage`.
