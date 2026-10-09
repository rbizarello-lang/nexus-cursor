# 02 — Vocabulário de saída do motor de prazos (NEXUS)

Somente leitura. Nada do repositório foi alterado. Os comportamentos marcados "(verificado)" foram conferidos executando o motor com dados sintéticos (sondas em `scratchpad/prazos-ux/probe/*.mjs`, `asOf = 2026-10-09`). O resto vem da leitura do código.

Abreviações de arquivo nas referências `arquivo:linha`:

- **P** = `src/lib/prescription.js` (regra de versão `2026.10a`, P:152)
- **M** = `src/lib/prazos-mesa.js`
- **I** = `src/lib/presc-import.js`
- **D** = `MOTOR_PRESCRICAO.md`
- **APP** = `src/app.jsx`, **CX** = `src/edition-claude.jsx` (só para mostrar quem consome o quê)

Convenções: "tarde" = leitura da União (é o resultado principal do cálculo); "cedo" = leitura mais desfavorável (é a que dá o alarme, quando há faixa). `daysLeft`/`prescDays` = termo menos hoje, em dias corridos (`daysUntil`, dates.js:42): **positivo = falta; 0 ou negativo = já venceu (0 conta como vencido)**.

---

## 0. Leia primeiro: dez fatos que mudam o desenho (detalhes na seção 6)

1. **Há duas políticas, `v1` e `v2`.** A fila na tela usa `v2` (APP:3927, `buildPrazosRadar(..., { policy: 'v2' })`). O snapshot que vai para a nuvem e alimenta o e-mail diário (`attachPrescriptionSnapshots`, P:2408–2460, chamado em APP:4168) usa **v1** (P:2415 não passa `policy`): janela de 180 dias, sem alarme por data cedo, sem `pedido_dado`, sem `penhora_antiga`, sem `aguardando_reconhecimento`, sem silenciados. Grupo e data do e-mail podem divergir da tela.
2. **O grupo 6 "Consumada" não significa "consumada calculada".** Ele recebe `vencido`, `vencido_estimado` e `residual_alta` cujo `prescDays` passou de −180. Em `residual_alta` esse número é a data "não antes de" ou a previsão da planilha, não uma consumação (verificado).
3. **A linha do radar é montada na data tarde quando a tarde já está na janela ou venceu.** A data cedo só aparece em `bandHit` quando a tarde ainda está fora da janela. Em todos os casos `bandCedo/bandTarde/bandKind/bandMotivos` vêm preenchidos (verificado, P:3341–3353).
4. **Só existem linhas para o que alarma, pede dado ou vigia.** Ordinária com mais de 90 dias, CDA sem dados, tratada, extinta e operação encerrada não têm linha nem aparecem em `silenced` (verificado).
5. **"Adiar" não funciona para linha do grupo 6**: o adiamento grava `group: 6`, mas o furo é comparado com o grupo de alerta (menor), então fura na hora (P:3937 × P:3960 × APP:9625; verificado).
6. **Decadência nunca entra na fila** (confirmado), mas hoje há dois caminhos visuais de "alarme" fora da fila: o selo "Decad." (vermelho/amarelo) na lista de CDAs (APP:7334, CX:4733) e a ordenação por `worst` (P:2912–2929, CX:3948).
7. **`totals[6]` e `byOp[...].g6` contam a consumada recente duas vezes** (no grupo de alerta e no 6) (P:4077–4086).
8. **Há campos e kinds declarados mas inalcançáveis hoje**: `estimated`/`phase:'estimado'`, kind `avaliar_174`, `row.clock`, `action.eventType` (seção 6, item 9).
9. **Há lógica acoplada a texto**: grupo 3 por regex sobre `checks` (P:3610–3615), `why/action` por regex sobre `prescLabel` (P:3840, 3860), `incidentOnly` re-derivado de `gaps` (P:3289, 3519).
10. **Campos com jargão proibido na tela** (`UI_FORBIDDEN`, P:2761: Tema, Súmula, política, piso, teto, dies, marco, CENÁRIO): `memory`, `gaps`, `row.basis` (verificado). Os campos "de tela" (`summary`, `checks`, `occurrences`, `estimates`, `band.motivos[].texto`, `why`, `prescLabel`, `keyLabel`) saíram limpos nas sondas.

---

## 1. Formato do resultado por CDA e por segmento

### 1.1 Quem devolve o quê

| Função | Devolve | Observações |
|---|---|---|
| `computeCdaLegalTimeline` (P:2912) | `{ decadencia, ordinaria, intercorrente, exec, worst }` | `intercorrente` é `null` quando não há execução fiscal (P:2917). `worst = { key, status, sev }` pelo `legalSeverity` (P:2901–2909); empate fica com o primeiro da ordem decadência, ordinária, intercorrente (P:2923–2927, `sev > worst.sev` estrito). |
| `computePrescription` (P:925) | **resultado principal da CDA** | Sem execução fiscal: `segment:'credito'` (ordinária). Com execução fiscal: `segment:'intercorrente'`. É o que o radar consome (`createPrescLookup`, P:2343). |
| `computeOrdinaria` (P:2885) | `segment:'credito'` sempre | Para CDA ajuizada vira "coluna": `band.alarme = false` (P:2896). |
| `computeDecadencia` (P:2763) | `segment:'decadencia'` | Sem fases; ver 1.6. |

`segment` assume três valores: `'decadencia'`, `'credito'` (a ordinária; na linha do radar vira `prescSegment:'ordinaria'`) e `'intercorrente'`. `emptyResult` (P:459) começa com `segment:null`.

Execução fiscal = registro de execução com o mesmo número normalizado do `debt.processNumber` e `processTag` diferente de `idpj`/`cautelar_fiscal` (P:588–594, 519–523). Número de processo que só casa com incidente gera `incidentOnly:true` e o resultado é o da ordinária (P:594, 936–950).

### 1.2 Campos do resultado (intercorrente e ordinária; decadência na 1.6)

| Campo | Valores | Significado | Ref. |
|---|---|---|---|
| `segment` | `'credito'` \| `'intercorrente'` \| `null` | Qual relógio. | P:459, 1039, 2282 |
| `origin` | `'calculo_validado'` \| `'estimativa'` \| `'data_informada'` \| `'estimativa_pessimista'` (inalcançável) | Confiança da âncora. `calculo_validado`: há constituição definitiva ou algum evento conhecido. `estimativa`: só inscrição, sem evento; ou intercorrente sem ciclo. `data_informada`: só a data digitada na ficha. Rótulos curtos em `prescOriginLabel` (P:525): informada / calculada / estimado / estimativa. | P:1172, 1217, 1153 |
| `phase` | ver 1.3 | Em que ponto do relógio a CDA está. | |
| `status` | `prescrito` `critico` `alerta` `correndo` `indeterminado` `interrompido` `suspenso` `sem_dados` | Severidade derivada da fase e dos dias (ver 1.3). | P:496–512 |
| `diesAQuo` | ISO ou `null` | Início do prazo. Ordinária: constituição definitiva (ou limite/inscrição, ou o último ato interruptivo). Intercorrente: data da ciência (ou do reinício pós-parcelamento); em `nao_iniciado` é o protocolo. | P:1060–1161, 2205, 2282 |
| `diesAdQuem` | ISO ou `null` | Termo final. `null` quando interrompido, não iniciado, parcelamento vigente, ordinária de CDA ajuizada. | P:1204, 2187, 2207, 2284 |
| `computedDiesAdQuem` | ISO ou `null` | Interno (intercorrente). | P:1793 |
| `daysLeft` | inteiro ou `null` | Dias até `diesAdQuem`. | |
| `detail` | texto | Frase curta de conclusão (alimenta a memória técnica). | |
| `summary` = `scenario` | texto | Frase de situação para a tela (P:1776). | P:1512–1564 |
| `occurrences[]` | `{ date, fact, effect, source, note }` | Fatos do caso e o efeito de cada um; `source`: `processo`, `evento`, `planilha`, `Análise · Evento n`, `IDPJ nº …`, `MCF nº …`. | P:1566–1599 |
| `estimates[]` | `{ label, date, how }` | Rótulos possíveis: "Não pode ter prescrito antes de" (último ato + 1 + 5 anos), "Pode ter vencido a partir de" (arquivamento + 5), "Não deveria passar de" (arquivamento + 6), "Termo calculado" / "Termo informado", "Termo estimado (pior caso)" (inalcançável). | P:1601–1650 |
| `checks[]` | strings | "Conferir nos autos". Identidade do item = `checkId(texto)` (P:2571); o "feito" fica em `debt.prescChecks[{id,doneAt}]` (P:2575–2585). Lista completa no apêndice B. | P:1652–1729 |
| `band` | `null` ou objeto (ver 1.4) | Faixa cedo–tarde. | P:315–331 |
| `bounds` | só intercorrente: `{ floor, floorDays, floorAnchor{iso,kind}, ceiling, ceilingDays, ceilingCedo, ceilingCedoDays }` | `floor` = ato mais recente (protocolo, citação, despacho ou constrição útil) + 6 anos ("não antes de"). `ceiling` = arquivamento datado + 6 anos mais pausas; `ceilingCedo` = + 5. `floorAnchor.kind`: `protocolo`, `citacao`, `despacho`, `constricao`. | P:1299–1347 |
| `flags[]` | `['pedido_sem_desfecho']` (`'parc_sem_fim'` inalcançável) | Pedido de constrição/petição dentro da janela sem desfecho lançado. | P:454–457, 1810–1814 |
| `pendingPetitions[]` | datas ISO | Pedidos sem resultado (intercorrente). | P:1888–1951 |
| `interruptAt` / `interruptEffAt` / `interruptVia` / `interruptSource` | só intercorrente `interrompido` | Data de efeito (o pedido, se retroage), data da efetivação, tipo do evento (`int_penhora`, `int_arresto`, `int_sisbajud`, `int_cnib`, `int_citacao`, `susp_idpj_mcf_constricao`...), id do incidente. | P:2209–2212 |
| `idpjNotice` | `null` ou `{ incidentId, incidentNumber, incidentKind, constrictionDate, limitDate, daysLeft, active, text }` | Aviso do card do processo, 5 anos da constrição no incidente; `active` quando `daysLeft ≤ 90`. Não vai para a fila. | P:347–367 |
| `incidents[]` | `{ id, processNumber, tag:'idpj'\|'cautelar_fiscal', hasConstriction, constrictionOpen, hasStay, stayOpen, status }` | Incidentes que abrangem a execução. | P:651–678 |
| `incidentOnly` | bool | Número do processo é de IDPJ/MCF, sem execução fiscal. | P:594 |
| `cycleKind` | `null` \| `'art40'` \| `'politica_parc'` | Ciclo da ciência (1 + 5) ou pós-parcelamento. | P:1916–1922 |
| `parcRestartMode` | `'1+5'` \| `'5'` | Modo do reinício pós-parcelamento. | P:150–151, 514 |
| `prescriptionInterrupted` | bool | Houve interrupção. | |
| `prescDaysConsumed`, `suspDaysConsumed` | inteiros | Dias já consumados (ano do art. 40 vs. quinquênio). Dão a barra de progresso. | P:2304–2311 |
| `activeSuspensions[]` | ids de eventos | Pausas em curso. | |
| `informedDate`, `forecastDate`, `informedConflict` | ISO, ISO, bool | Data digitada na ficha, previsão da planilha (`exec.prescriptionForecast`), divergência entre ficha e cálculo. Nunca substituem o cálculo (D:147–155). | P:1866 |
| `lc118Pendente`, `constitutionHow` | só ordinária | Falta a data da citação (despacho anterior a 09/06/2005); como a constituição foi achada. | P:1187–1213 |
| `rulesApplied[]`, `ruleVersion` | `'R1'..'R12'`, `'2026.10a'` | Regras acionadas. | P:1731–1755 |
| `memory[]` | `{ date, event, effect }` | Memória técnica, **com jargão**. | P:917 |
| `gaps[]` | strings | Lacunas, **com jargão** em parte; algumas viram `checks`. | |
| `timeline[]` | evento + `{ effect, phase }` | `phase` por evento tem vocabulário próprio: `originario`, `pre_marco`, `suspensao_art40`, `prescricao_correndo`, `suspenso`, `interrompido`, `consumado`. Não confundir com `result.phase`. | |
| `estimated` | bool (sempre `false` hoje) | Inalcançável (seção 6, item 9). | |

### 1.3 `phase` e `status` em linguagem de procurador

**Intercorrente** (CDA com execução fiscal; art. 40 da LEF, regra 1 ano + 5 anos):

| `phase` | O que significa | `status` | `diesAdQuem` | Ref. |
|---|---|---|---|---|
| `nao_iniciado` | A execução foi ajuizada, mas não há ciência lançada de não localização ou de ausência de bens. O ajuizamento, a citação ou o arquivamento sozinhos não iniciam o prazo. Nada a contar ainda. | `indeterminado` | `null` | P:2275–2293 |
| `suspensao_art40` | Primeiro ano depois da ciência (ou depois da rescisão/pedido de parcelamento): é o ano de suspensão; o quinquênio ainda não começou a correr. | pela regra dos dias | termo projetado | P:2301, 2235 |
| `correndo` | Quinquênio em curso. | `correndo` (>730d), `alerta` (366–730d), `critico` (≤365d) | termo | P:2302 |
| `suspenso` | Prazo parado por fato lançado: embargos com efeito suspensivo, liminar, depósito, falência decretada (só na leitura tarde), suspensão da execução por IDPJ/cautelar, parcelamento vigente. Pausa não zera. | `suspenso` | termo projetado, ou `null` se há parcelamento vigente | P:2179–2197, 2234, 2300 |
| `consumado` | O termo de 1 + 5 anos passou. Exceção: se há pedido de constrição na janela sem desfecho (`pedido_sem_desfecho`), a fase **volta** para `correndo` e `status:'critico'`, e o `detail` diz "conferir antes de declarar". | `prescrito` | termo (no passado) | P:1815–1828 |
| `interrompido` | Ciclo encerrado por resultado útil (citação efetiva, penhora, arresto/bloqueio, Sisbajud, CNIB; constrição no IDPJ vale como tal). Sem termo. Só reinicia com nova ciência. | `interrompido` | `null` | P:2199–2220 |
| `estimado` | Pior caso de parcelamento sem fim. **Inalcançável hoje** (a flag `parc_sem_fim` nunca é gravada; P:2226 só lê). | — | — | |

**Ordinária** (`segment:'credito'`, art. 174 do CTN, 5 anos):

| `phase` | O que significa | `status` | Ref. |
|---|---|---|---|
| `originario` | CDA não ajuizada; quinquênio da constituição definitiva em curso. | `correndo`/`alerta`/`critico` | P:1238, 1249 |
| `consumado` | (a) Não ajuizada e o quinquênio venceu. (b) Ajuizada e o quinquênio venceu **antes da propositura**; aparece só na coluna, sem alarme (R12). | `prescrito` | P:1175–1186, 1239 |
| `interrompido` | Ajuizada: o quinquênio parou na propositura (interrupção retroage). Sem termo. | `interrompido` | P:1202–1213 |
| `suspenso` | Pausa ativa do art. 151 antes do termo, ou parcelamento vigente (neste caso `diesAdQuem:null`). | `suspenso` | P:1218–1233, 1240 |
| `sem_dados` | Sem inscrição, sem constituição e sem data informada. | `sem_dados` | P:1048–1054 |

`statusFrom` (P:496–512): `prescrito` se a fase é `consumado` (ou `daysLeft ≤ 0` correndo/originário); `indeterminado` se `nao_iniciado`; `interrompido`; `suspenso`; `sem_dados` se não há dias; senão `critico` (≤365), `alerta` (≤730), `correndo`. Esses limiares de 365/730 dias **não têm relação** com a janela de 90 dias da fila.

`calcPrescription` (P:2375–2406) traduz as fases para um vocabulário antigo (`pre_marco`, `prescricao_correndo`, `prescrito`...) para o KPI por execução; use `result.phase` direto.

### 1.4 `band` (faixa cedo–tarde)

Formato (P:315–331): `{ cedo:{diesAdQuem,daysLeft,phase}, tarde:{...}, motivos:[{code,kind,texto,incerto?}], kind:'tese'|'dado', alarme:bool }`.

- É `null` quando as duas leituras coincidem (selo "calculado"), salvo o motivo `C1x` (incerto) quando há uma data a confirmar (P:320–321).
- `kind` é `'tese'` se qualquer motivo é tese; faixa mista alarma como tese (P:327–328).
- `alarme` é `false` só em dois casos, ambos definidos fora de `BAND_MOTIVOS`: ordinária de CDA ajuizada (P:2896) e decadência D3 (P:2776). Nenhum motivo tem `alarme:false` na tabela.
- Caso especial: intercorrente `nao_iniciado` com arquivamento datado ganha a faixa B3 (`cedo` = arquivamento + 5; `tarde` = + 6), `kind:'dado'` (P:957–969).
- A faixa "está aberta" (datas ou fases diferentes) em `bandIsOpen` (P:2601); só aí o selo da coluna vira `faixa` (P:2625–2627).

Motivos (`BAND_MOTIVOS`, P:260–272; D:21):

| Código | kind | Em que relógio nasce | O que diz |
|---|---|---|---|
| A1 | tese | intercorrente (e ordinária) | Rescisão: cedo pelo inadimplemento + 5 anos; tarde pela rescisão (+ 1 + 5 na intercorrente). |
| A2 | tese | intercorrente | Pedido de parcelamento sem deferimento: cedo pedido + 5; tarde pedido + 1 + 5. |
| A4 | tese | intercorrente, ordinária | Falência decretada: a data cedo não conta a pausa. |
| A5 | **dado** | intercorrente, ordinária | Pausa sem data de fim: a cedo presume que acabou na última conferência. |
| A6 | **dado** | intercorrente, ordinária | Parcelamento vigente: a cedo presume rescisão logo após a última conferência. |
| B1 | tese | intercorrente | Ciência eletrônica: cedo na disponibilização; tarde na abertura ou 10º dia. |
| B2 | **dado** | intercorrente | Só há a decisão de suspensão do art. 40; falta a certidão da ciência. |
| B3 | **dado** | intercorrente | Só há o arquivamento datado; falta a ciência. |
| C1 | **dado** | ordinária (CDA não ajuizada, ou a coluna da CDA ajuizada) | Constituição definitiva não informada: cedo pelo vencimento/período de apuração; tarde pela inscrição. |
| C1x | **dado**, `incerto` | ordinária (mesma observação) | Nem constituição nem vencimento informados: o termo conta da inscrição, o limite mais tardio. |
| D3 | tese | decadência | Cedo no ano seguinte ao fato gerador; tarde no ano seguinte ao vencimento. Nunca alarma. |

`alarmPoint(r)` (P:334) devolve o ponto de alarme: `band.cedo` se a faixa alarma, senão o termo calculado.

### 1.5 Visões derivadas já prontas

- `buildCdaColumnView(seg, {key, prescChecks})` (P:2663): `{ key, title, seal, summary, dates{start,end}, datesLine, band{open,kind,alarme,cedo,tarde,motivos[],line}, basis, occurrences[], estimates[], checks[{id,text,doneAt}], footer }`. O `seal` (P:2625–2634) tem quatro valores: `calculado`, `faixa`, `estimado`, `sem dados`. As datas vazias viram "sem ciência lançada" (intercorrente), "sem termo calculado" etc. (P:2636–2661).
- `buildPrescRulerModel(seg, asOf)` (P:2703): `{ start, end, today, phase, termo, cedo, tarde, bandKind, facts[], pauses[] }`, modelo puro da régua.
- Snapshot da CDA (`d.prescriptionSnapshot`, P:2434–2457, **v1**): `{ diesAdQuem, daysLeft, origin, phase, segment, status, detail, flags, cycleKind, scenario, summary, checks, estimated, incidents, group, consumada, prescKind, keyDate, keyLabel, firstCheck, incident, computedAt }`. `group:0` = sem linha.
- `redirecionamentoInfo` (P:422–452): `{ start, startHow, limitDate, daysLeft, pedido, citacao, dissolucao, status, text, basis }` com `status` em `sem_dados`, `em_curso`, `vencido`, `pedido_no_prazo`, `pedido_anterior`, `pedido_fora`. **Informativo, nunca alarma** (D:195–203).
- `openPauseEvents` (P:393–416): pausas sem fim, com `lastCheck`, que alimentam o botão "Ainda vale" (grava `verifiedAt`).
- `penhoraAntigaInfo` (P:372–390): `{ via, label, requestDate, constrictionDate, limitDate, daysLeft, due }`; vale para intercorrente `interrompido` por `int_penhora`, `int_arresto`, `int_sisbajud` ou `int_cnib` (`EF_CONSTRICTION_TYPES`, P:155) — **não** para citação nem para constrição de incidente.

### 1.6 Decadência

Formato (`decResult` P:2503 + `withDecadenciaView` P:2513): `{ segment:'decadencia', rule, status, origin, diesAQuo, diesAdQuem, daysLeft, startFrom, detail, memory, gaps, summary, occurrences, estimates:[], checks, rulesApplied:['R1'], ruleVersion, scenario, band? }`. **Não tem** `phase`, `timeline`, `flags`, `bounds`, `incidents`.

| Campo | Valores |
|---|---|
| `rule` | `'150_4'` (homologação com pagamento; fato gerador), `'173_1'` (1º dia do exercício seguinte), `'173_2'` (anulação por vício formal), `'declarado'` (prejudicada, Súmula 436), `''` (sem âncora). |
| `status` | `obstada` (constituiu dentro do quinquênio, ou presumidamente pela inscrição, ou declarado), `consumada` (constituição depois do termo), `risco` (inscrição posterior ao termo sem constituição informada; ou termo passou sem constituição nem inscrição), `em_curso` (sem constituição nem inscrição, termo adiante), `sem_dados` (falta período de apuração e/ou modalidade). |
| `origin` | `calculo_validado` ou `estimativa`. |
| `startFrom` | `'vencimento'` \| `'fato_gerador'` \| `''` (só na regra 173, I). |
| `band` | só D3, com `alarme:false`, `kind:'tese'`; os pontos `cedo/tarde` carregam `phase` = o **status** (`consumada`/`obstada`/...), não uma fase. |
| `checks` | "Informar período de apuração e modalidade de lançamento na inscrição." etc. (P:2522–2543). |

Atenção: `status:'risco'` com termo já passado traz `summary` "Prazo em curso até <data passada>" (P:2546–2549; verificado), texto incoerente com o status.

---

## 2. Linha do radar/fila (`buildPrazosRadar`, P:3943)

### 2.1 Retorno

```
{ rows[], totals{1..7:{n,value}}, byOp{opId:{g1..g7,risco,completar}}, incidents[], buckets{kind:[rows]},
  divergencias:number, silenced[], processNotes[] }          // silenced/processNotes só em v2 (P:4097–4100)
```

- `totals[g].value` soma `row.value`; `consumada==='recent'` também soma em `totals[6]` (P:4077–4080). `byOp` tem só contagens (`risco` = g1 + g2; `completar` = g3), nunca valor (P:4082–4087).
- `incidents[]` = `buildPrazosIncidentBlocks` (P:3713–3777): `{ id, processNumber, tag, court, status, operationId, opName, hasConstriction, constrictionOpen, requestDate, closed, conference, worstGroup, efCount, efs[{executionId,processNumber,worstGroup,cdaCount}], rows[] }`.
- `silenced[]`: `{ debtId, reason, until, label, group }`. `reason` ∈ `parcelamento_vigente`, `parcelada_ficha`, ou um motivo de adiamento (`aguardando_certidao`, `peca_protocolada`, `garantia_em_analise`, `nao_priorizar_agora`, `outro`; `PRESC_SNOOZE_REASONS` P:2941–2947).
- `processNotes[]`: `{ processNumber, incidentId, kind?:'idpj_constricao', text }` — aviso único por processo: aviso de 5 anos da constrição no incidente (`idpjNotice.active`) e "IDPJ/cautelar sem constrição lançada" (P:3977–4003). Esta última também **remove** o check equivalente de `row.checks` (P:4002).
- `divergencias` = nº de linhas com `decisionNote`.

### 2.2 Campos da linha

Montada em `buildPainelPrescAlerts` (P:3494–3539) + `buildPrazosRadar` (P:3962–3984).

| Campo | Valores / significado |
|---|---|
| `id` | id da CDA (debt). Também `cdaNumber`, `processNumber`, `status` (da ficha), `value` (valor da CDA, número), `tribute`, `personName`, `operationId`/`opId`, `opName`, `executionId` (vazio se não há EF), `court`. |
| `prescKind` | o kind (2.4). |
| `group` | 1–7 (2.5). Para consumada **antiga** é 6 e `alertGroup` guarda o grupo de alerta de origem. |
| `prescSegment` | `'ordinaria'` \| `'intercorrente'` (natureza do relógio que gerou a linha). Em `inconsistencia` por incidente é `'ordinaria'`. |
| `prescFaixa` | `'alta'` \| `'media'` \| `'baixa'`: severidade operacional do kind (não é certeza). `baixa` só em `acompanhar_piso`. |
| `prescDate` / `prescDays` | **data de alarme da linha** e dias até ela. Não é sempre um prazo: ver 2.4, coluna "`prescDate` / `prescDays` são...". |
| `keyDate` / `keyLabel` | de `prazosKeyMeta` (2.4): data-chave e rótulo exibível. |
| `prescLabel` | texto curto do alerta (vazio em `iminente`/`vencido` sem faixa). |
| `summary` | `summary` do motor (frase de situação). |
| `why` | por que está na fila (frase por kind; P:3810–3895). |
| `action` | `{ type, field?, eventIds? }` (2.4). `type` ∈ `conferir_autos`, `lancar_ciencia`, `criar_evento`, `confirmar_vigencia`, `corrigir_ficha`, `vincular_ef`, `analisar_penhora`, `nenhuma`. |
| `basis` | base legal para o tooltip (tem Tema/Súmula). |
| `reviewAt` | data fixa de reconferência; só nos kinds `aguardando_reconhecimento` (marcação + 60 dias), `pausa_cadastrada` (cedo − 90, ou prescDate − 90) e `acompanhar_piso` (a data "não antes de"). Vazia nos demais (P:3903–3918). |
| `silenceReason` | só `aguardando_reconhecimento`. |
| `consumada` | `'recent'` \| `'old'` \| ausente (2.6). |
| `bandHit` | opcional: `{ kind:'tese'\|'dado', motivos[], cedo{}, tarde{} }`: a linha foi gerada pela data cedo. |
| `bandCedo`, `bandTarde`, `bandKind`, `bandMotivos[]` | sempre que a CDA tem faixa, mesmo sem `bandHit`. |
| `checks[]`, `prescChecks[]` | conferências do motor e as já marcadas na ficha. |
| `flags[]` | `pedido_sem_desfecho`. |
| `estimated` | sempre `false` hoje. |
| `hasCiencia` / `noCiencia` | intercorrente com ciência lançada (ciclo `art40`) / `nao_iniciado`. |
| `incident`, `incidentDot`, `hasIDPJ`, `incidentOnly`, `idpjNotice` | cobertura por IDPJ/cautelar (seção 3.6). `incidentDot`: `none` \| `cover` (abrange, sem fato) \| `closed` \| `open`. |
| `interruptAt` | data de efeito da interrupção (intercorrente interrompido). |
| `penhora` | só `penhora_antiga`: o objeto de `penhoraAntigaInfo`. |
| `prescDecision`, `decisionNote` | parecer importado da execução (`situation`: `SEM-MARCO`, `CICLO-EM-CURSO`, `CICLO-ENCERRADO`, `PAUSADO`, `PROVAVEL-CONSUMACAO`, `DECLARADA`; I:37–44) e a nota de divergência (I:402–421). |
| `clock` | previsto mas **nunca preenchido** (P:3165, 3536). |
| `policy` | `'v2'`. |

Não há campo `handled`, `snooze`, `parcelada`, `certainty` nem `consumadaClass` na linha: tratada sai da fila; adiada/parcelada vai para `silenced[]` (seção 3); a certeza é calculada por `mesaCertainty(row)` (M:12); `consumadaClass` é a função cujo resultado fica em `row.consumada`.

### 2.3 Ordem de avaliação do classificador (v2) — `classifyPainelPrescAlert` (P:3239–3454)

A primeira condição que casa decide o kind.

0. Fora da fila: `debt.status==='extinta'`; `prescriptionHandled` (exceto `aguardando_reconhecimento`); execução com `prescDecision.situation==='DECLARADA'` (P:2977–2991); operação `encerrada` (P:3463, 3487).
1. Parcelada só pela ficha (`status` `parcelada`/`negociada_sispar`, ou execução `suspensa_parcelamento`, sem adesão vigente lançada): **sem linha** (P:3250–3256) → vai a `silenced:'parcelada_ficha'`.
2. Adesão vigente por evento: só devolve a faixa (`bandHit`), senão **sem linha** (P:3287) → `silenced:'parcelamento_vigente'` até cedo − 90.
3. `incidentOnly` → `inconsistencia` (`vincular_ef`) (P:3289–3296).
4. **CDA ajuizada** (`r.segment==='intercorrente'`), `cycle` = `phase` ∉ {`nao_iniciado`,`sem_dados`,`pre_marco`} (P:2994–2999):
   1. `cycle` e `interrompido`: `penhora_antiga` (se `due` e sem análise vigente) senão `vigiar_interrompido` (P:3308–3327).
   2. `cycle` e `suspenso`: `bandHit` se houver, senão `pausa_cadastrada` (P:3334–3340).
   3. `cycle` e vencido (`isOverdueResult(r)`, na data **tarde**): `vencido` (P:3341–3349).
   4. `cycle` e iminente (`daysLeft` em (0, 90], na **tarde**): `iminente` (P:3350).
   5. `bandHit` (cedo ≤ 90 dias ou passada): ver 2.4 (P:3353).
   6. `cycle` e `pedido_sem_desfecho`: `residual_alta`; senão `correndo` (P:3354–3365).
   7. Sem ciclo: `cadastroInconsistencia` → `inconsistencia` (`criar_evento`) (P:3369–3378).
   8. Sem ciclo: teto de arquivamento vencido → `vencido_estimado` (P:3380–3387).
   9. Sem ciclo: "não antes de" ainda adiante → `acompanhar_piso` (P:3401).
   10. Sem ciclo: arquivada sem data / previsão de planilha ≤ 90 / "não antes de" vencido há > 2 anos sem evento datado → `residual_alta`; rebaixa para `residual_media` se a planilha marca "interrompida" (e não há arquivada nem planilha ≤ 90) ou se a CDA é garantida (e não há arquivada) (P:3410–3432). A flag de pedido pendente não nasce sem ciclo (a janela do pedido precisa de termo; P:1810–1814), então esse gatilho só vale no passo 6.
   11. Demais: `residual_media` (P:3433).
5. **CDA não ajuizada** (ordinária) (P:3443–3453): pausada + faixa → faixa; não pausada e vencida → `vencido`; iminente (exceto pausada com faixa) → `iminente`; faixa → faixa; **senão nenhuma linha**.
6. `wrapAguardando` (P:3260–3273): se a ficha está `aguardando_reconhecimento`, **qualquer** resultado (inclusive "nenhum") vira kind `aguardando_reconhecimento`.

`bandAlert` (P:3185–3222) só considera faixa com `alarme !== false` e `cedo.daysLeft ≤ 90`:
- `kind:'tese'`: `vencido` (cedo ≤ 0) ou `iminente`, `faixa:'alta'`, label "data cedo · <texto do 1º motivo>".
- `kind:'dado'`: cedo ≤ 0 → `vencido_estimado` (`alta`), label "A data cedo passou. <texto>"; cedo > 0 → `pedido_dado` (`media`) com a ação do 1º motivo em `BAND_DADO_ACTION` (P:3173–3179): A5/A6 → `confirmar_vigencia` ("A pausa ainda vale?" / "O parcelamento segue vigente?"), B2/B3 → `lancar_ciencia`, C1 → `corrigir_ficha` com `field:'constituicao'`; sem correspondência → `conferir_autos` ("Completar o dado que falta").

### 2.4 Todos os kinds

Rótulo = `keyLabel` de `prazosKeyMeta` (P:3636–3673). Quando há `bandHit` em `vencido`/`iminente`/`vencido_estimado`/`pedido_dado`, o `keyLabel` é "cedo dd/mm/aaaa · tarde dd/mm/aaaa" (a tarde só se tiver data).

| kind | Grupo | `prescFaixa` | Critério (resumo; ordem real em 2.3) | `prescDate` / `prescDays` são... | `action.type` | `keyLabel` (sem faixa) | Pode ser consumada? | Certeza da Mesa (`mesaCertainty`) |
|---|---|---|---|---|---|---|---|---|
| `iminente` | 1 | alta | 0 < dias ≤ 90 na tarde (ajuizada com ciclo, ou ordinária); ou cedo no mesmo intervalo com faixa de tese | termo (ou a cedo, se `bandHit`) | `conferir_autos` | "dd/mm/aaaa" | não | calculado (faixa se `bandHit` tese) |
| `vencido` | 1 (6 se consumada antiga) | alta | dias ≤ 0 na tarde; ou cedo ≤ 0 com faixa de tese. Variante "pedido pendente" (`prescLabel`) | termo vencido (ou a cedo) | `conferir_autos` | "dd/mm/aaaa" | sim: recente/antiga | calculado (faixa se `bandHit` tese) |
| `vencido_estimado` | 2 (6 se antiga) | alta | faixa de **dado** com cedo ≤ 0; ou teto de arquivamento (arquivamento + 6) vencido sem faixa | a cedo; ou o teto | `conferir_autos` | "estimado · dd/mm/aaaa" | sim | dado (se `bandHit`) senão estimado |
| `residual_alta` | 2 (6 se antiga) | alta | intercorrente sem ciclo com agravante (arquivada sem data, planilha ≤ 90, "não antes de" > 2 anos sem evento datado), ou com ciclo e pedido pendente | planilha ou "não antes de" (**não é termo**); no ramo "ciclo + pedido pendente", o termo calculado | `lancar_ciencia` se o label cita ciência/arquivada; senão `conferir_autos` | "estimado · dd/mm/aaaa" | sim (usa dias do piso/planilha) | estimado |
| `pedido_dado` | 3 | media | faixa de dado com 0 < cedo ≤ 90 | a data cedo | `confirmar_vigencia` (A5, A6), `lancar_ciencia` (B2, B3), `corrigir_ficha{field:'constituicao'}` (C1), `conferir_autos` | "cedo … · tarde …" | não | dado |
| `inconsistencia` | 3 | alta | (a) `incidentOnly` → "vincule à execução fiscal"; (b) status `suspensa_judicial`/`suspensa_admin` sem evento suspensivo | termo ordinário (a) ou piso (b) | `vincular_ef` (a), `criar_evento` (b) | "dd/mm/aaaa" ou "—" | não | cadastro |
| `residual_media` | 4 | media | intercorrente sem ciência, piso já passou sem agravante; ou sem protocolo ("Sem protocolo — data 'não antes de' incalculável") | piso (pode ser vazio) | `lancar_ciencia` | "não antes de dd/mm/aaaa" ou "—" | não | estimado |
| `correndo` | 4 | media | ajuizada com ciclo em curso, sem faixa alarmante | termo | `nenhuma` | "dd/mm/aaaa" ou "em curso" | não | calculado |
| `vigiar_interrompido` | 4 | media | intercorrente `interrompido` (resultado útil), exceto penhora antiga vencida | data da interrupção; `prescDays:null` | `lancar_ciencia` | "encerrado em dd/mm/aaaa" | não | calculado |
| `pausa_cadastrada` | 4 | media | intercorrente `suspenso` com termo projetado e sem faixa alarmante | termo projetado | `confirmar_vigencia` | "pausado · dd/mm/aaaa" | não | cadastro (cai no padrão final de `mesaCertainty`) |
| `aguardando_reconhecimento` | 4 | media | ficha `prescriptionHandledType:'aguardando_reconhecimento'` (v2) | termo calculado, se houver | `nenhuma` + `silenceReason` | "aguardando decisão" | não | cadastro (cai no padrão final) |
| `acompanhar_piso` | 5 | baixa | intercorrente sem ciência e piso (ato mais recente + 6 anos) ainda adiante | o piso | `lancar_ciencia` | "não antes de dd/mm/aaaa" | não | estimado |
| `penhora_antiga` | 7 | media | intercorrente `interrompido` por penhora/arresto/Sisbajud/CNIB há ≥ 6 anos e sem análise vigente (< 365 dias, sem fato novo) | fim dos 6 anos (já passou) | `analisar_penhora` | "penhora de dd/mm/aaaa" | não | analisar |
| `avaliar_174` | — | — | declarado em `PAINEL_PRESC_KINDS` (P:2936) e em `prazosKeyMeta` (P:3666), **nenhum caminho o gera** | — | — | "dd/mm/aaaa" ou "sem dados" | — | — |

`mesaCertainty` (M:12–23): `bandHit` tese → `faixa`; `bandHit` dado ou `pedido_dado` → `dado`; `penhora_antiga` → `analisar`; `vencido`/`iminente`/`vigiar_interrompido`/`correndo` → `calculado`; `vencido_estimado`/`residual_alta`/`residual_media`/`acompanhar_piso` → `estimado`; `inconsistencia` ou grupo 3 → `cadastro`; resto por grupo (1 calculado, 2 estimado) e, por fim, `cadastro` (por isso `pausa_cadastrada` e `aguardando_reconhecimento` caem em `cadastro`). Rótulos da tela no CX (CX:1538): Calculado, Estimado, Cadastro, Cedo–tarde, Falta dado, Analisar.

### 2.5 Grupos (1–7) e rótulos

`groupOfKind` (P:3622–3634). Prioridade declarada no comentário: 1, 2, 3, 5, 4; 7 é lista própria.

| Grupo | Kinds | Rótulo do motor (`PRAZOS_GROUP_LABELS`, P:3554) | Contadores na tela clássica (APP:10034–10040) | Prumo (CX:1369, CX:2935) |
|---|---|---|---|---|
| 1 | `vencido`, `iminente` | Vencido ou iminente | Urgentes | Urgente / Urgentes |
| 2 | `vencido_estimado`, `residual_alta` | Provável — conferir nos autos | A conferir | A conferir |
| 3 | `pedido_dado`, `inconsistencia`, e `correndo`/`vigiar_interrompido`/`pausa_cadastrada`/`residual_media` quando `rowNeedsCadastro` (ficha em conflito, incidente sem fato, checks por regex; P:3603–3616) | Cadastro a completar | A completar | A completar |
| 4 | `correndo`, `vigiar_interrompido`, `pausa_cadastrada`, `residual_media`, `aguardando_reconhecimento` (e os silenciados por parcelamento) | Em acompanhamento | Acompanhamento | Acompanhamento / Em acompanhamento |
| 5 | `acompanhar_piso` (v2) | Ainda impossível | Ainda impossível | Sem risco / Ainda impossível |
| 6 | só por reclassificação: consumada **antiga** (`vencido`, `vencido_estimado`, `residual_alta`) | Consumada | Consumada | Consumadas |
| 7 | `penhora_antiga` | Penhora antiga — analisar | Penhora antiga | — |

Rótulos agregados por CDA/processo (`prazosRiskMetaForCdas`, P:4104–4133): "Tratadas", "N urgentes", "N a conferir", "N a completar", "ainda impossível", "consumada", "em acompanhamento", "—", com `riskClass` `ok`/`critical`/`warning`/``.

### 2.6 Consumada recente × antiga

- `consumadaClass(row)` (P:3573–3583): só para `vencido`, `vencido_estimado`, `residual_alta` (`CONSUMADA_KINDS`). Dias de referência = **tarde** quando há `bandHit` (e a tarde tem data), senão `prescDays`. Se `dias ≤ 0`: `'recent'` se `dias ≥ −180` (`CONSUMADA_ALERT_WINDOW`, 6 meses, P:3565); `'old'` abaixo (verificado: −180 recent; −181 old).
- `applyConsumadaClassification` (P:3591–3601): `recent` mantém o grupo de alerta (1 ou 2) e só marca `consumada`; `old` move para o grupo 6 e guarda `alertGroup`.
- `rowShowsInConsumada(row)` (P:3586): `group===6 || consumada` presente. Ou seja, a aba Consumada = grupo 6 (antigas) + recentes que continuam em 1/2.
- Onde consumadas aparecem: **grupo 1** (`vencido` recente), **grupo 2** (`vencido_estimado`/`residual_alta` recentes), **grupo 6** (qualquer antiga). Nunca em 3, 4, 5 ou 7.

### 2.7 Camada da Mesa (`prazos-mesa.js`)

- `mesaNeedsYou(row, hoje)` (M:31–41): precisa de você = grupo 1; `pedido_dado`; grupo 2 com `prescDays ≤ 0`; grupo 3 com `action.type ∈ MESA_ONE_CLICK` (`criar_evento`, `corrigir_ficha`, `vincular_ef`, `confirmar_vigencia`, `lancar_ciencia`; M:10); ou `reviewAt ≤ hoje`. Grupo 7 nunca.
- `splitMesaRows` (M:51–72) → `{ needsYou, overCap, rest, hiddenG5, penhoraAntiga }`; `MESA_CAP = Infinity` (sem teto; M:9).
- `compareMesaRows` (M:44–49): `prescDate || keyDate` crescente (vazio = 9999), depois maior `value`. **Ignora o grupo.**
- `groupMesaRows` (M:78–113): intercorrente agrupada por execução (chave = operação + id da execução, ou o número do processo sem pontuação); ordinária, uma linha por CDA (chave = id da CDA); cada grupo tem `lead`, `worstGroup`, `value` (soma), `date`.
- `engineMoreGraveThanDecision` (I:402–421): devolve a nota se (a) o parecer é "mais brando" (`CICLO-ENCERRADO`, `PAUSADO`, `SEM-MARCO`, `CICLO-EM-CURSO`) e o motor está consumado, ou o termo do motor é anterior ao do parecer; ou (b) `PROVAVEL-CONSUMACAO` com termo do parecer anterior ao do motor. `DECLARADA` nunca diverge. O cálculo prevalece (D:147–155).
- `betaCdaClosedLine` (M:212–332) produz o texto "STATUS — situação — data" com frases como "prescrição intercorrente ainda não iniciada", "... interrompida por <causa>", "... suspensa por <causa>", "falta dado — ...", "tratada", "aguardando reconhecimento judicial", "conferir ficha × cálculo".

---

## 3. O que o motor já permite classificar sem mudar regra (e qual campo decide)

### 3.1 Natureza do prazo

- **Campo:** `row.prescSegment` (`'ordinaria'` \| `'intercorrente'`); no resultado, `segment` (`'credito'` \| `'intercorrente'` \| `'decadencia'`).
- A linha do radar só existe para ordinária (CDA **não** ajuizada) e intercorrente (CDA ajuizada). A decadência e a ordinária de CDA ajuizada ficam só na coluna da ficha (`computeCdaLegalTimeline`).
- Outras "naturezas" que o motor já separa por kind: **análise** (`penhora_antiga`, grupo 7); **cadastro** (`pedido_dado` com C1, `inconsistencia`, grupo 3); **vigília** (grupos 4 e 5); **informativo fora da fila** (`redirecionamentoInfo`, `idpjNotice`, decadência).

### 3.2 CDA ajuizada ou não

- **Campo:** `row.prescSegment==='intercorrente'` ⇔ existe execução fiscal (não IDPJ/MCF) com o mesmo número normalizado do `debt.processNumber` (P:588–594). `row.executionId` vazio = sem EF. `computeCdaLegalTimeline().intercorrente === null` = não ajuizada (P:2917).
- **Não usar** `debt.processNumber` sozinho: a CDA com número mas sem registro de execução é tratada como não ajuizada pelo motor, enquanto o selo "AJ" da lista usa `!!d.processNumber` (APP:7318). Número que só casa com IDPJ/MCF = `incidentOnly` (kind `inconsistencia`).

### 3.3 Consumada recente × antiga

- **Campos:** `row.consumada` (`'recent'` \| `'old'` \| ausente) e `row.alertGroup` (só quando `old`); corte em −180 dias (P:3565, 3581); com faixa usa a data **tarde** (P:3576–3578). Só `vencido`, `vencido_estimado` e `residual_alta`. Aparecem em 1 e 2 (recentes) e 6 (antigas); detalhe e ressalvas em 2.6 e seção 6 (itens 2 e 6).

### 3.4 "Há ação" × "só vigiar"

| Tipo | Kinds | `action.type` |
|---|---|---|
| Ação que altera dado no app (um clique ou formulário) | `pedido_dado` (A5/A6: `confirmar_vigencia`; B2/B3: `lancar_ciencia`; C1: `corrigir_ficha`), `pausa_cadastrada` (`confirmar_vigencia`), `inconsistencia` (`vincular_ef` ou `criar_evento`), `penhora_antiga` (`analisar_penhora`), `residual_alta` com ciência/arquivada (`lancar_ciencia`) | ver coluna |
| Ação de leitura dos autos (nada a gravar) | `vencido`, `iminente`, `vencido_estimado`, `residual_alta` (demais) | `conferir_autos` |
| Vigiar com ação **possível** (lançar a ciência se ela surgir) | `vigiar_interrompido`, `residual_media`, `acompanhar_piso` | `lancar_ciencia` |
| Puramente informativo | `correndo`, `aguardando_reconhecimento` | `nenhuma` |

`MESA_ONE_CLICK` (M:10) = `criar_evento`, `corrigir_ficha`, `vincular_ef`, `confirmar_vigencia`, `lancar_ciencia`. O predicado já existente de "precisa de você" é `mesaNeedsYou` (M:31–41). Para `criar_evento`, o motor **não** devolve `eventType` (grep em `src/lib`: nenhuma ocorrência), então a tela não sabe qual fato lançar.

### 3.5 Parcelada / silenciada (e até quando)

- **Parcelada:** `isCdaParcelada` (P:3101–3113) = adesão vigente por evento (`parcelamentoVigentePorEvento`, P:3079) **ou** `debt.status ∈ {parcelada, negociada_sispar}` **ou** `exec.status==='suspensa_parcelamento'`. Rescisão posterior prevalece (P:3096).
- **Na saída:** `radar.silenced[]` com `reason:'parcelamento_vigente'` e `until = band.cedo − 90 dias` (a data em que volta à fila; vazio se não há cedo), ou `reason:'parcelada_ficha'` e `until:''` (adesão não lançada). `group:4` (P:4039–4057). Ao chegar `cedo − 90` volta como `pedido_dado` (A6, `confirmar_vigencia`, "O parcelamento segue vigente?") ou como `vencido`/`iminente`/`vencido_estimado` (código; P:3287 + 3185–3222).
- **Silenciada por adiamento:** ver 3.13.

### 3.6 Abrangida por IDPJ / cautelar

- **Campos:** `row.incident` (só o 1º incidente: `r.incidents[0]`, P:3147–3149; a lista completa fica em `result.incidents` e em `radar.incidents[]`), `row.incidentDot`, `row.hasIDPJ`, `row.incidentOnly`, `row.idpjNotice`, `radar.processNotes[]`, `result.interruptVia==='susp_idpj_mcf_constricao'`.
- **Efeitos no motor:** constrição no incidente = interrupção da EF abrangida (vira `phase:'interrompido'`, kind `vigiar_interrompido`); suspensão da execução (`susp_idpj_mcf`) = pausa da intercorrente (sem fim = faixa A5); `incidentOnly` = kind `inconsistencia`/`vincular_ef`.
- **Aviso discreto:** `idpjNotice.active` (constrição + 5 anos, a partir de 90 dias antes) vira `processNotes` (um por processo), **não** linha da fila (D:101).
- **Rebaixamento a "cadastro":** incidente sem constrição e sem suspensão, ou encerrado com fato em aberto, joga a linha para o grupo 3 quando o kind é `correndo`, `vigiar_interrompido`, `pausa_cadastrada` ou `residual_media` (`rowNeedsCadastro`, P:3603–3616; verificado com `correndo`). Os kinds de grupo 1, 2, 7, `pedido_dado` e `aguardando_reconhecimento` não são rebaixados; `acompanhar_piso` só em v1.

### 3.7 Penhora antiga

- **Campos:** `prescKind==='penhora_antiga'`, `group===7`, `row.penhora` (`constrictionDate`, `limitDate`, `via`, `daysLeft`, `due`), `action.type==='analisar_penhora'`, `reviewAt` vazio. Se `debt.penhoraAnalise.at` tem menos de 365 dias e nenhum evento posterior, a CDA volta a `vigiar_interrompido` (P:3227–3233; verificado). Constantes: `PENHORA_ANTIGA_ANOS = 6` (P:370).

### 3.8 Faixa cedo–tarde (tese × dado; alarme verdadeiro × falso)

- **Campos:** `row.bandKind` (`'tese'`/`'dado'`), `row.bandCedo`, `row.bandTarde`, `row.bandMotivos[]`, `row.bandHit` (a linha nasceu da data cedo), `result.band.alarme`.
- **Tese** ⇒ providência processual ⇒ grupo 1 (`vencido`/`iminente`) a partir de 90 dias antes da cedo.
- **Dado** ⇒ providência documental ⇒ `pedido_dado` (grupo 3) até a cedo; passada a cedo, `vencido_estimado` (grupo 2); só vai a "Consumada" quando a **tarde** também passa (D:18–19; P:3576–3578).
- **`alarme:false`** só em: ordinária de CDA ajuizada (P:2896) e decadência D3 (P:2776). Em todos os outros casos a faixa alarma.

### 3.9 Dado faltante (quais motivos e sinais)

- Faixa `dado`: A5 (pausa sem fim), A6 (parcelamento vigente), B2 (só decisão do art. 40), B3 (só arquivamento), C1 (constituição não informada), C1x (nem constituição nem vencimento).
- Outros sinais: `flags:['pedido_sem_desfecho']`; `row.noCiencia` (intercorrente `nao_iniciado`); `result.bounds.floor===null` (sem protocolo; kind `residual_media`, `prescDate:''`); `row.informedConflict`; `result.lc118Pendente` (falta data da citação); `result.incidentOnly`; kinds `pedido_dado` e `inconsistencia`; qualquer `checks` aberto (`openChecks`, P:2583).

### 3.10 Pedido pendente

- **Campos:** `row.flags` contém `pedido_sem_desfecho`; `result.pendingPetitions[]`; texto `prescLabel` "pedido pendente" (kind `vencido`) ou "Conferir cadastro / autos" (kind `residual_alta`). A flag nasce quando há pedido de constrição (com efetivação futura) ou petição sem resultado com data dentro de [`diesAQuo`, termo] (P:1810–1814, 1938–1951). Efeito: a fase **não** vira `consumado` (volta a `correndo`/`critico`), mas o kind continua `vencido` e, com mais de 180 dias, cai no grupo 6 (verificado).

### 3.11 Análise importada divergente

- **Campos:** `row.decisionNote` (texto não vazio), `row.prescDecision` (`situation`, `analysisDate`, `term`), `radar.divergencias` (contagem). Check complementar "Análise de dd/mm/aaaa anterior à ocorrência de dd/mm/aaaa — revalidar." (P:1716–1727). O cálculo sempre prevalece (D:147–155). `groupFromPrescDecision` (I:373) existe mas **não é usado**.

### 3.12 Tratada / aguardando reconhecimento

- **Tratada** (`debt.prescriptionHandled` com tipo `declarada`, `reconhecida`, `extinta` ou outro): **sem linha e sem `silenced`** (P:2980–2987, 4036; exceção de borda no item 12 da seção 6); snapshot `group:0`. Formas na ficha (APP:14207): `aguardando_reconhecimento`, `declarada`, `analisada_nao_consumada`, `extinta`; o botão "Tratar" grava `declarada` (APP:9466); importar parecer `DECLARADA` marca as CDAs do processo como tratadas (I:351–363). `HANDLED_TERMINAL = {declarada, reconhecida, extinta}` (P:2939).
- **Aguardando reconhecimento:** kind `aguardando_reconhecimento`, grupo 4, `silenceReason`, `action:'nenhuma'`, `reviewAt = prescriptionHandledAt + 60 dias` (P:3907–3910). Em v2 substitui **qualquer** resultado da CDA, inclusive "sem linha" (P:3260–3273).

### 3.13 Adiada (snooze)

- **Dados:** `debt.prescSnooze = { until, reason, at, group, note? }` (APP:9625). Motivos: `aguardando_certidao`, `peca_protocolada`, `garantia_em_analise`, `nao_priorizar_agora`, `outro` (este exige nota).
- **Limite por grupo** (`snoozeLimitDays`, P:2949–2956): grupo 1 = 14 dias; 2 = 30; 3 = 7; 5 = 90; 6 = 90; 4 e 7 = 30 (padrão). Vale o menor entre `until` e `at + limite` (`snoozeEffectiveUntil`, P:3920–3928; verificado: 14 dias no grupo 1).
- **Fura o adiamento** (`snoozePierced`, P:3930–3941), voltando à fila: sem `until`; `outro` sem nota; motivo desconhecido; prazo efetivo vencido; grupo atual **menor** (mais urgente) que o gravado; evento posterior a `at` na CDA ou na execução.
- **Saída:** a linha sai de `rows` e entra em `silenced[]` com `{ debtId, reason, until, label, group }`. Linha que fura mantém `debt.prescSnooze`, e a tela diz "expirou o silêncio" / "o adiamento venceu" (APP:9713 e 9726; CX:2104 e 2116).
- **Falha conhecida:** adiar linha do grupo 6 grava `group:6`; o grupo de comparação é o de alerta (1 ou 2), sempre menor, então fura imediatamente (verificado).

### 3.14 "Ainda impossível" (sem protocolo, sem ciência)

- **Campos:** `prescKind==='acompanhar_piso'` e `group===5`; `row.noCiencia`; `result.bounds.floor` (ato mais recente + 6 anos) e `floorAnchor.kind`; `reviewAt` = a própria data do piso. A Mesa esconde o grupo 5 (`hiddenG5`) e o devolve na gaveta com `reason:'ainda_impossivel'` (M:62, 368–381).
- **Sem protocolo** não é grupo 5: vira `residual_media` (grupo 4), `prescDate:''`, `prescDays:null`, `keyLabel:'—'` (verificado).
- **Ciência lançada** (`hasCiencia`) muda o relógio para `suspensao_art40`/`correndo`; sem ela a intercorrente é `nao_iniciado` e `diesAdQuem` é sempre `null`.

### 3.15 Decadência: "nunca deve alarmar" — confirmado na fila, com duas ressalvas visuais

- **Confirmado:** `classifyPainelPrescAlert` lê só `computePrescription` (ordinária/intercorrente) e nunca `computeDecadencia`. `radar.rows` não tem linha de decadência. A faixa D3 tem `alarme:false` (P:2776). R1 diz "A decadência nunca alarma" (D:27).
- **Ressalva 1:** o selo **"Decad."** aparece, vermelho em `consumada` e amarelo/laranja em `risco`, no cartão da CDA (APP:7334) e na linha da tabela de inscrições do Prumo (CX:4733).
- **Ressalva 2:** `computeCdaLegalTimeline().worst` pode eleger a decadência como "mais grave" (`consumada` pesa 6, igual a `prescrito`; `risco` pesa 3, acima de `correndo`) e `CxCdaPrescStack` põe essa coluna primeiro (CX:3948–3950). Em empate vence a decadência por vir primeiro na ordem.

---

## 4. O que NÃO existe hoje (teria de ser derivado só na camada de exibição)

| Item | O que há hoje | Como derivar (campos existentes) |
|---|---|---|
| **Um critério único de ordem/prioridade entre telas** | Quatro ordens diferentes: (a) `buildPainelPrescAlerts` ordena cada bucket por `prescDays` e o radar percorre os kinds na ordem de `PAINEL_PRESC_KINDS` (P:2933–2938), sem considerar grupo; (b) `groupPrazosByProcess` (P:3682–3711) ordena por `group`, depois `keyDate`, e os processos por pior grupo e número; (c) Mesa: `compareMesaRows` por data e valor, **sem grupo** (M:44–49); (d) `legalSeverity` ordena colunas dentro da CDA (P:2901). D:185 declara "data cedo e, no empate, maior valor". | Tupla de ordenação: `mesaNeedsYou`, depois `group`, depois `prescDate` crescente (a data cedo quando há `bandHit`), depois `value` decrescente. Cuidado: `prescDate` nem sempre é prazo (ver 2.4); para `penhora_antiga`, `vigiar_interrompido`, `inconsistencia (b)`, `residual_*` e `acompanhar_piso` use `group` como chave primária e não a data. |
| **Soma de valor por operação e por processo** | Valor por **grupo** (`totals[g].value`, só somando `row.value`), por **processo** (`groupPrazosByProcess().value` e `groupMesaRows().value`, soma todas as linhas do processo, de qualquer grupo). `byOp` tem **contagem**, não valor. O cartão Prazos soma só o grupo 1 (D:191). | `rows.filter(...).reduce` por `operationId` / `processNumber` / `executionId`. Atenção a duas armadilhas: consumada `recent` entra no grupo de alerta e no 6; `value` pode ser nulo/0. |
| **"Ação sugerida" textual por linha** | `action.type` (8 valores) e `why` (explicação, não imperativo). Só `pedido_dado` traz um imperativo em `prescLabel` (de `BAND_DADO_ACTION`: "A pausa ainda vale?", "O parcelamento segue vigente?", "Lançar a data da ciência...", "Informar vencimento ou constituição definitiva"). Os rótulos de botão ficam na tela (CX:1547 `CX_ACT_LABEL`; texto inline em APP:9756). | Mapa `(prescKind, action.type, bandMotivos[0], prescSegment)` → frase. Para `conferir_autos`, complementar com `bandHit.cedo/tarde`, `flags` e o 1º `openChecks`. `criar_evento` não informa o tipo do fato. |
| **"Pode ser salvo" × "consumado"** | Não há campo. Existem insumos: `consumada` (tarde ≤ 0), `bandHit.cedo`/`bandTarde`, `flags`, a regra de retroação ao pedido dentro da janela e o motivo "Pedido fora da janela de 1+5 anos — não salva o feito" em `memory` (P:2038–2043). | Consumado = `consumada` presente (tarde ≤ 0) e sem `pedido_sem_desfecho`. Em disputa/ainda sustentável = `bandKind==='tese'` e `bandCedo ≤ hoje < bandTarde`. A conferir antes de declarar = `flags` com `pedido_sem_desfecho` ou `decisionNote`. Ainda salvável por ato do procurador = `iminente` (dias > 0) e `vencido_estimado` de faixa de dado com tarde > hoje. Tudo isto é derivação sugerida; o motor não afirma "salvável". |
| **Rótulo único de certeza** | Cinco vocabulários: `mesaCertainty` (calculado, estimado, cadastro, faixa, dado, analisar); `columnSeal` (calculado, faixa, estimado, sem dados); `prescOriginLabel` (informada, calculada, estimado, estimativa); `prescFaixa` (alta, media, baixa = severidade); `band.kind` (tese, dado). | Derivar de `bandKind`/`bandHit` + `origin` + `kind`; `mesaCertainty` cobre quase tudo, mas manda `pausa_cadastrada` e `aguardando_reconhecimento` para "cadastro" por falta de regra (M:22). |
| **Significado uniforme de `prescDate`/`prescDays`** | Quatro semânticas: prazo (iminente, vencido, correndo, pedido_dado), piso ("não antes de": acompanhar_piso, residual_media, residual_alta, inconsistencia b), data de evento (`vigiar_interrompido`) e fim dos 6 anos (`penhora_antiga`). | `deadline = ['iminente','vencido','vencido_estimado','correndo','pausa_cadastrada','pedido_dado'].includes(kind)`; para os demais exibir como "não antes de" ou "encerrado em", nunca como "faltam N dias". |
| **Taxonomia "o que é isto"** (prazo × cadastro × análise × vigília) | Implícita nos grupos. | `group 1-2` = prazo; `3` = cadastro; `4-5` = vigília; `6` = histórico; `7` = análise. |
| **Estado consolidado por processo** | `groupMesaRows` junta as CDAs da execução, mas só soma valor e pega o pior grupo. A intercorrente é calculada por CDA (eventos podem ser da CDA, com `cdaId`, ou da execução inteira, com `executionId` e sem `cdaId`; P:534–536). | `rows` por `executionId`: pior `group`, menor `prescDate`, soma de `value`. Podem divergir entre CDAs do mesmo processo. |
| **Cobertura por operação com valor** | `byOp[opId]` = contagens. | Reduzir `rows` por `operationId`. |
| **Última conferência por linha** | Só em `openPauseEvents` (`lastCheck`, `verifiedAt`). | Chamar `openPauseEvents(collectEventsForCda(...).events, hoje)` para `confirmar_vigencia`. |
| **Lista das CDAs sem linha** | Não há. | Subtrair `rows` + `silenced` de `data.debts` e classificar pelo motivo: ordinária > 90 dias, `sem_dados`, tratada, extinta, operação encerrada. |
| **Horizonte em texto** | `formatPrescHorizon(days)` (M:115–127): "hoje", "12d", "há 40d", "em 3 anos". | Já existe; só aplicar quando `prescDays` é prazo. |

---

## 5. Tabela final: natureza × situação

`Linha` = linha do radar (v2). "—" = não há. G = grupo. Os dias são na data tarde, salvo onde dito "cedo". Ações em `action.type`.

### 5.1 Ordinária — CDA não ajuizada (`prescSegment:'ordinaria'`)

| Situação | Campo que decide | kind / grupo hoje | Ação |
|---|---|---|---|
| Correndo (> 90 dias) | `result.phase:'originario'`, `daysLeft > 90` | **sem linha** (snapshot `group:0`); `status` `correndo`/`alerta`/`critico` só na ficha | — |
| Iminente (1 a 90 dias) | `daysLeft ∈ (0, 90]` (P:3449); ou `band.cedo` ≤ 90 com faixa de tese | `iminente` / G1 | `conferir_autos` |
| Vencido recente | `phase:'consumado'`, `daysLeft ∈ [−180, 0]` | `vencido` / G1 + `consumada:'recent'` | `conferir_autos` |
| Vencido antigo | `daysLeft < −180` | `vencido` / G6 (`alertGroup:1`, `consumada:'old'`) | `conferir_autos` |
| Pausado | `phase:'suspenso'` | pausa **com** fim: sem linha até 90 dias do termo (então `iminente`); pausa **sem** fim (A5): `pedido_dado` / G3 quando cedo ≤ 90, `vencido_estimado` / G2 se a cedo passou | `confirmar_vigencia` (no `pedido_dado`) |
| Interrompido | n/a: a interrupção reinicia o quinquênio (`phase:'originario'` com novo `diesAQuo`); `int_pedido_parcelamento` interrompe sem pausa | — | — |
| Não iniciado | n/a (ordinária sempre tem âncora ou é `sem_dados`) | — | — |
| Sem dados | `phase:'sem_dados'`, `status:'sem_dados'` | **sem linha** e sem silenciado. Se há só a inscrição (`origin:'estimativa'`), a faixa C1 pode gerar `pedido_dado` / G3 quando a cedo ≤ 90 | `corrigir_ficha{field:'constituicao'}` |
| Abrangida (IDPJ/MCF) | `incidentOnly` (número é de incidente) | `inconsistencia` / G3 | `vincular_ef` |
| Parcelada | `isCdaParcelada`; `phase:'suspenso'`, `diesAdQuem:null` | `silenced` (`parcelamento_vigente` até cedo − 90, ou `parcelada_ficha`); volta como `pedido_dado` (A6) | `confirmar_vigencia` |

### 5.2 Intercorrente — CDA ajuizada (`prescSegment:'intercorrente'`)

| Situação | Campo que decide | kind / grupo hoje | Ação |
|---|---|---|---|
| Correndo (> 90 dias) | `phase ∈ {correndo, suspensao_art40}` | `correndo` / G4 | `nenhuma` |
| Iminente | `daysLeft ∈ (0, 90]` (tarde) ou cedo ≤ 90 com tese | `iminente` / G1 | `conferir_autos` |
| Vencido recente | `phase:'consumado'`, `daysLeft ≥ −180` | `vencido` / G1 + `recent` | `conferir_autos` |
| Vencido antigo | `daysLeft < −180` | `vencido` / G6 (`old`) | `conferir_autos` |
| Vencido com pedido pendente | `flags ∋ pedido_sem_desfecho`; `phase` volta a `correndo`/`critico` | `vencido` ("pedido pendente") / G1, ou G6 se > 180 dias | `conferir_autos` |
| Pausado | `phase:'suspenso'` com termo | `pausa_cadastrada` / G4; com faixa (A4 tese, A5 dado) e cedo ≤ 90: `vencido`/`iminente` G1, `vencido_estimado` G2, `pedido_dado` G3 | `confirmar_vigencia` |
| Interrompido (resultado útil) | `phase:'interrompido'` | `vigiar_interrompido` / G4; se penhora/arresto/Sisbajud/CNIB há ≥ 6 anos sem análise vigente: `penhora_antiga` / G7 | `lancar_ciencia`; `analisar_penhora` |
| Interrompido por constrição no incidente | `interruptVia:'susp_idpj_mcf_constricao'` | `vigiar_interrompido` / G4 (G3 se o incidente está extinto/arquivado com constrição em aberto) + `idpjNotice` e `processNotes` | `lancar_ciencia` |
| Não iniciado | `phase:'nao_iniciado'` | piso futuro: `acompanhar_piso` / G5; piso passado sem agravante: `residual_media` / G4; arquivada sem data, planilha ≤ 90, piso > 2 anos sem evento datado: `residual_alta` / G2 (G6 se piso > 180 dias atrás); só arquivamento (B3): `pedido_dado` / G3 ou `vencido_estimado` / G2; status suspensa sem evento: `inconsistencia` / G3 | `lancar_ciencia`; `conferir_autos`; `criar_evento` |
| Sem dados | n/a; sem protocolo cai em `nao_iniciado` | `residual_media` / G4 ("Sem protocolo") | `lancar_ciencia` |
| Abrangida (IDPJ/MCF) | `row.incident`, `incidentDot`, `hasIDPJ` | kind normal da situação; **G3** se o incidente não tem constrição nem suspensão e o kind é `correndo`/`vigiar_interrompido`/`pausa_cadastrada`/`residual_media` | a do kind |
| Parcelada | `isCdaParcelada` | `silenced` (até cedo − 90 / sem data); volta como `pedido_dado` (A6) | `confirmar_vigencia` |
| Tratada | `prescriptionHandled` | **sem linha**, sem silenciado | — |
| Aguardando reconhecimento | `prescriptionHandledType` | `aguardando_reconhecimento` / G4, `reviewAt = marcação + 60` | `nenhuma` |
| Adiada | `debt.prescSnooze` não furado | **sai de `rows`**, entra em `silenced` | — |

### 5.3 Fora da fila

| Natureza | Situação | Campo | Onde aparece | Ação |
|---|---|---|---|---|
| Ordinária de CDA ajuizada | `interrompido` (propositura) / `consumado` antes da propositura / `sem_dados` | `timeline.ordinaria.phase`, `band.alarme:false` | coluna da ficha | "Conferir interrupções anteriores" (texto de `summary`) |
| Decadência | `obstada` / `consumada` / `risco` / `em_curso` / `sem_dados` | `timeline.decadencia.status` | coluna da ficha; selo "Decad." na lista quando `consumada` ou `risco` | `checks` ("Informar período de apuração...") |
| Redirecionamento | `sem_dados`, `em_curso`, `vencido`, `pedido_no_prazo`, `pedido_anterior`, `pedido_fora` | `redirecionamentoInfo().status` | card do processo | nenhuma (informativo) |
| Aviso de 5 anos da constrição no incidente | `idpjNotice.active` | `idpjNotice`, `processNotes` | card do processo | "Esclarecer se a constrição alcança esta execução ou lançar a ciência posterior" |

---

## 6. Armadilhas, inconsistências e código morto (com referência)

1. **Snapshot v1 × radar v2.** `attachPrescriptionSnapshots` (P:2408–2460) chama `classifyPainelPrescAlert` sem `policy` (P:2415). Em v1 (P:3241–3242, 3257, 3284, 3309): janela de 180 dias, parcelamento vigente devolve nulo, `bandAlert` não roda (então `keyDate` do snapshot é a data **tarde**, verificado), sem `penhora_antiga`, sem `aguardando_reconhecimento`; e `groupOfKind` em v1 manda `acompanhar_piso` com cadastro pendente para o grupo 3 (P:3630–3632). `RESUMO-DIARIO.js:201–231` lê `snapshot.group/keyDate/daysLeft/summary/firstCheck` (grupos 1–3 sempre; grupo 4 só em 90 dias; grupo 5 nunca).
2. **Grupo 6 não é só "consumada calculada".** Entra: `vencido` com pedido pendente (fase `correndo`, P:1823–1828); `residual_alta` cujo `prescDays` é o piso ou a previsão da planilha (verificado: CDA "arquivada sem data" com piso 2025-02-01 vira G6 `old`, e execução de 2004 sem ciência vira G6 com "estimado · 01/02/2010"); `vencido_estimado` por teto de arquivamento.
3. **Linha na tarde × data cedo.** Se a tarde já está ≤ 90 dias ou vencida, o kind é `iminente`/`vencido` **sem** `bandHit` e `prescDate` é a tarde, mesmo com a cedo já vencida (P:3341–3352 antes de P:3353; verificado: cedo 01/06/2026 passada, linha "iminente 53d" com `prescDate` 01/12/2026). A informação da cedo só está em `bandCedo`. Isso afeta a ordenação da Mesa por `prescDate` e a leitura de D:185.
4. **Adiar linha do grupo 6 não pega** (3.13).
5. **Selo "AJ" × execução.** APP:7318 usa `!!d.processNumber`; o motor exige registro de execução (P:588–594).
6. **`totals[6]` duplica** a consumada recente (P:4077–4080); idem `byOp.g6` (P:4085).
7. **Decadência `risco`** produz `summary` "Prazo em curso até <data passada>" (P:2546–2549, verificado) e o selo "Decad." amarelo; `worst` pode priorizar a decadência (3.15).
8. **Acoplamento a texto:** `rowNeedsCadastro` (P:3610–3615) casa `checks` por regex ("não tem constrição lançada", "encerrado; informar a data", "diverge do termo calculado"); `radarWhyActionCore` casa `prescLabel` por regex (`/pedido pendente/`, `/ciência|Arquivada/`; P:3840, 3860); o botão "Manter decisão" casa `checks` por `/revalidar/` (APP:9990); `incidentOnly` é re-derivado de `gaps` (`/coincide com um IDPJ/`). Mudar o texto dessas frases muda grupo e ação.
9. **Inalcançável hoje (grep):** `r.estimated`, `phase:'estimado'`, `origin:'estimativa_pessimista'`, estimate "Termo estimado (pior caso)", `PRESC_FLAGS.PARC_SEM_FIM` (só lida em P:2226, nunca gravada) e o ramo `vencido_estimado` "Estimado — conferir nos autos" (P:3328); kind `avaliar_174` (declarado em P:2936 e P:3666, nunca gerado); `row.clock` (P:3165, 3536, 3831: nunca preenchido, então "Os 5 anos da constituição venceram antes do ajuizamento" não sai); `action.eventType` (lido em APP:9537, 9583, 9715 e CX:2100, mas o motor nunca o devolve; o ramo `isParc` "lançar adesão" nunca dispara); `groupFromPrescDecision` (I:373, sem chamadores); a propriedade `alarme` em `BAND_MOTIVOS` (nenhum motivo a define; `band.alarme` vale `true` por padrão e só é desligado por P:2776 e P:2896).
10. **`why` fora do lugar:** `residual_media` com "Sem protocolo" mostra "a data de acompanhamento já passou" (P:3887) embora não haja data (`prescDate:''`, verificado).
11. **Limiares sem relação:** `status` usa 365/730 dias (P:496); a fila usa 90 (v2) / 180 (v1) (P:2931, 341); a consumada usa 180 (P:3565).
12. **Quem fica fora de `rows` e de `silenced`** (invisíveis na fila): ordinária > 90 dias (por exemplo, 91 dias não aparece, 90 aparece; verificado), CDA sem dados, tratada, `status:'extinta'`, operação encerrada, execução com `DECLARADA`. Casos extremos: um `prescriptionHandledType:'analisada_nao_consumada'` não está em `HANDLED_TERMINAL`, então, se tiver parcelamento vigente, pode cair em `silenced` (P:4036–4057).
13. **Mesa:** `mesaCertainty` não tem regra para `pausa_cadastrada` e `aguardando_reconhecimento` (viram "cadastro"); `mesaNeedsYou` manda ao "precisa de você" também linhas dos grupos 4 e 5 com `reviewAt` vencido (`aguardando_reconhecimento`, `pausa_cadastrada`, `acompanhar_piso`; M:39).
14. **Jargão:** `memory`, `gaps`, `basis` carregam Tema/Súmula/política/piso/teto/dies/marco; a tela deve usar `summary`, `occurrences`, `estimates`, `checks`, `band.motivos[].texto`, `why`, `prescLabel`, `keyLabel` (verificado), com `betaSafeUiText` (M:400) como rede de proteção.

---

## Apêndice A — vocabulário de `occurrences` (o que a tela já diz)

Fatos (`CASE_FACT`, P:1349–1384): "Ciência de não localização do devedor", "Ciência de ausência de bens", "Ciência de insuficiência de bens", "Citação do devedor", "Penhora efetiva", "Arresto / bloqueio", "Bloqueio Sisbajud", "Indisponibilidade CNIB/CCS", "Reconhecimento da dívida", "Despacho que ordena citação", "Protesto judicial", "Protesto extrajudicial da CDA", "Outra causa interruptiva", "Pedido de parcelamento sem deferimento", "Parcelamento — adesão", "Transação — adesão", "Rescisão de parcelamento ou transação", "Embargos com efeito suspensivo", "Decisão judicial suspensiva", "Depósito judicial integral", "Recuperação judicial", "Falência decretada", "Suspensão do art. 40", "Constrição no incidente", "Suspensão da execução via incidente", "Outra causa suspensiva", "Pedido ainda sem resultado", "Arquivamento", "Desarquivamento", "Decisão sobre prescrição", "Dissolução irregular (indício)", "Pedido de redirecionamento", "Outro registro", "Bloqueio para negociação". Fatos fixos: "Constituição definitiva", "Vencimento ou período de apuração", "Inscrição", "Ajuizamento".

Efeitos (`occurrenceEffect`, P:1402–1458; `buildOccurrences` P:1575–1589): "inicia o prazo de 1 ano + 5 anos"; "nova certidão — não reinicia"; "encerra o ciclo"; "não encerra o ciclo enquanto o prazo está pausado"; "não inicia o prazo de 1 ano + 5 anos"; "resultado útil"; "interrompe e pausa enquanto vigente"; "restabelece a exigibilidade; abre ciclo de 1 ano + 5 anos" (intercorrente) / "...; o prazo de 5 anos recomeça" (ordinária); "interrompe na data do pedido, sem pausa"; "interrompe; o prazo de 5 anos recomeça"; "pausa o prazo; depois retoma"; "pausa só na data tarde; a data cedo ignora a pausa"; "pausa a intercorrente até o fim do incidente; não encerra o ciclo"; "vale como interrupção desta execução, desde o pedido"; "vale como interrupção se houver prazo em curso"; "registro do incidente"; "vale como ciência"; "limite do prazo: entre arquivamento + 5 anos e + 6 anos"; "registro; a recuperação judicial não pausa o prazo"; "registro; bloqueio para negociação não é adesão — sem pausa"; "posterior ao ajuizamento — não afeta o prazo ordinário"; "não interrompe (anterior à LC 208/2024)"; "interrompe a prescrição ordinária (LC 208/2024)"; "não encerra o ciclo de 1 ano + 5 anos"; "não encerra o ciclo; conferir o desfecho"; "registro para o prazo de redirecionamento"; "registro do caso". Ajuizamento: "ponto de partida; não inicia o 1 ano + 5 anos" (intercorrente), "interrompe" ou "depois do termo dos 5 anos" (ordinária); Constituição: "ponto de partida (...)"; Vencimento: "início mais cedo possível (data cedo)"; Inscrição: "ponto de partida (constituição não informada)".

## Apêndice B — textos possíveis de `checks`

- Cadastro (P:1652–1673): "Data digitada na inscrição (dd/mm/aaaa) diverge do termo calculado. Conferir qual vale."; "Data de constituição definitiva não informada; o início usado é a inscrição. Informar vencimento, entrega da declaração ou notificação do lançamento."; "Despacho de citação anterior a 09/06/2005: antes da LC 118/2005 só a citação interrompia. Informar a data da citação."; "Evento com data futura (...) — ignorado no cômputo."; "ciência anterior ao ajuizamento — conferir data"; "Evento importado como parcelamento a partir de BLOQUEIO NEGOCIACAO (...) — confira. O cálculo o trata como registro, sem pausa. [...]".
- Incidente e intercorrente (P:1692–1729): "<IDPJ|Cautelar fiscal> nº X abrange esta execução e não tem constrição lançada. [...]"; "Incidente nº X encerrado; informar a data em que a pausa cessou."; "Há pedido na janela de 1 ano + 5 anos sem resultado lançado. Conferir o desfecho nos autos."; "Depois da <penhora|citação|...> de dd/mm/aaaa: houve certidão de não localização ou de ausência de bens? Se sim, lançar a ciência."; "certidão de não localização/sem bens não lançada — confirmar data"; "Análise de dd/mm/aaaa anterior à ocorrência de dd/mm/aaaa — revalidar."
- Decadência (P:2522–2543): "Informar período de apuração e modalidade de lançamento na inscrição."; "Informar o período de apuração na inscrição."; "Informar a modalidade de lançamento na inscrição."; "Informar a data de constituição definitiva na inscrição."

## Apêndice C — vocabulário de entrada que determina as saídas (resumo)

`PRESC_EVENT_TYPES` (P:19–54) tem 34 tipos em quatro categorias: `marco` (ciência do art. 40: sem bens, não localização, insuficiência), `interruptiva` (citação, penhora, arresto, Sisbajud, CNIB, reconhecimento, despacho de citação, protestos, outra, pedido de parcelamento, rescisão), `suspensiva` (parcelamento, transação, embargos, decisão judicial, depósito, falência decretada, art. 40, constrição e suspensão por IDPJ/MCF, outra) e `info` (recuperação judicial, petição sem resultado, arquivamento, desarquivamento, decisão sobre prescrição, dissolução irregular, pedido de redirecionamento, outro, bloqueio para negociação). Cadastro simplificado em 7 famílias (`PRESC_EVENT_FAMILIES`, P:60–143): `marco`, `resultado_util`, `parcelamento`, `pausa`, `idpj`, `art174`, `situacao`. Campos de data de um evento: `date` (efetivação), `requestDate` (pedido; retroação), `endDate` (fim da pausa), `availableDate` (disponibilização, ciência eletrônica), `defaultDate` (inadimplemento na rescisão), `verifiedAt` (última conferência, botão "Ainda vale"), `adesaoConfirmada`.

## Apêndice D — decisões de política (D:207–219) e o que mudam na saída

| # | Decisão da casa | Onde aparece na saída |
|---|---|---|
| 1 | Depois da rescisão: tarde = rescisão + 1 ano + 5 anos (intercorrente), cedo = inadimplemento + 5 anos; na ficha dá para marcar só 5 anos | faixa A1; `parcRestartMode` (`'1+5'` ou `'5'`); `cycleKind:'politica_parc'` |
| 2 | Parcelamento vigente: fora do alarme até 90 dias antes de (última conferência + 5 anos); reimportar conta como conferência | `silenced[].reason:'parcelamento_vigente'` com `until`; faixa A6; ação `confirmar_vigencia` |
| 3 | Janela de alarme de 90 dias, contada da data cedo, para tudo | `PRESC_ALERT_WINDOW = 90` (P:341), só em v2 |
| 4 | Arquivamento datado: tarde + 6 anos, cedo + 5 | faixa B3; `bounds.ceiling` / `ceilingCedo`; estimativas "Pode ter vencido a partir de" / "Não deveria passar de" |
| 5 | Sisbajud: quem lança decide se houve resultado útil; sem exceção por valor | `int_sisbajud` em `EF_CONSTRICTION_TYPES` encerra o ciclo |
| 6 | Garantida: nenhuma constrição marca a CDA como garantida; só à mão | `debt.status==='garantida'` ou `exec.hasGuarantee` rebaixa `residual_alta` a `residual_media` (P:3397, 3416) |
| 7 | Constrição no incidente vale como interrupção; a dúvida vai ao card do processo aos 5 anos | `interruptVia:'susp_idpj_mcf_constricao'`; `idpjNotice`; `processNotes` |
| 8 | Penhora antiga: 6 anos sem outro fato vão à lista própria | `penhora_antiga` / grupo 7; `PENHORA_ANTIGA_ANOS` |
| 9 | Inscrição sem processo só alarma pela ordinária, na janela de 90 dias | CDA não ajuizada: `iminente`/`vencido` ou nada |

Vocabulário que a tela da inscrição **não** usa (D:223–229; `UI_FORBIDDEN`, P:2761): Tema, Súmula, política, piso, teto, dies, marco, CENÁRIO. Essas palavras ficam na memória técnica (`buildPrescricaoReport`, P:4168) e no tooltip (`basis`). Na Beta, `betaSafeUiText` (M:400) troca "política" por "escolha da casa", "piso" por "limite mínimo", "teto" por "limite máximo", "dies" por "termo", "marco" por "ciência", "CENÁRIO" por "situação" e apaga "Tema N" e "Súmula N".
