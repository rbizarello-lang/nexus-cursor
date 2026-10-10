# 03 — Verificação das três propostas de apresentação dos prazos extintivos

Revisor: leitura do código e execução do motor com dados sintéticos. **Nenhum arquivo do repositório foi alterado.** Base: `HEAD 3c4369b`; `src/` não mudou desde `6cd0ef1` (o commit citado nos inventários). Scripts e capturas deste parecer: `S/verif/` (`probeV.mjs`, `probeF.mjs`, `probeG3.mjs` rodam `buildPrazosRadar` v2 com asOf 09/10/2026; `fold.js`, `mlist.js`, `text.js` capturam e extraem o texto dos mockups; `kit.js`, `kit2.js` tabulam o `dados.js`).

Abreviações: `P` = `src/lib/prescription.js`, `M` = `src/lib/prazos-mesa.js`, `APP` = `src/app.jsx`, `CX` = `src/edition-claude.jsx`. P1/P2/P3 = Relógio / Fila de trabalho / Carteira por natureza.

---

## 0. Oito achados que mudam a leitura das propostas

1. **Os "há 20 anos" do print não são consumadas: são G1 de tese (cedo–tarde) cuja data tarde está no futuro ou vazia.** O print mostra "cedo 27/04/2006" sem "· tarde"; `prazosKeyMeta` só acrescenta a tarde quando ela tem data (`P:3636-3641`), e `consumadaClass` devolve `null` quando a tarde não tem data (`P:3573-3583`): a linha fica no G1 indefinidamente. Sondas: rescisão com inadimplemento em 2001 e rescisão em 2022 (A1) e falência decretada sem fim (A4) dão `vencido`, G1, `bandHit` tese, `prescDays −7470` ("há 20 anos"), `consumada` nula, `mesaNeedsYou` verdadeiro (`verif/probeV.mjs` caso A; `verif/probeF.mjs`). **Nas três propostas essas linhas caem no bloco "cedo venceu, tarde não"** (P1 trecho 2, P2 "Conferir o cálculo", P3 degrau "Cedo já passou"), ordenado pela data cedo mais antiga. Resultado: P1 as põe logo depois das consumadas recentes; **P3 as põe nos três cartões de "Comece por aqui"**; a queixa do usuário se repete. Corrigível só na exibição: ordenar esse bloco pela data tarde (vazia por último) e mostrar "tarde em …" como relógio principal.
2. **O registro mais caro do kit está errado em relação ao motor.** `nx-09`/`nx-10` ("Falta ciência após a penhora", penhora 12/03/2020, "cedo 12/03/2026", R$ 2,8 mi, "Lançar ciência") é, no motor, **penhora antiga** (G7, `analisar_penhora`, "penhora de 12/03/2020"): `penhoraAntigaInfo` usa 6 anos (`P:369-390`) e o classificador a devolve antes de qualquer outra regra (`P:3308-3319`; sonda caso B). O motor nunca chama "penhora + 6 anos" de data cedo; é o "não pode ter prescrito antes de" (`bounds.floor`). As três propostas exibem esse caso como o item vermelho "cedo venceu há 7 m" e o mesmo fato jurídico (`nx-22`, penhora de 2019) como "Só vigiar / Sem data". A gaveta aberta por padrão em P1 e P2 é justamente `nx-09`.
3. **Datas que não são prazo quebram a classificação por tempo.** `residual_media` traz `prescDays` negativo (o "não antes de" já passou; sonda: −615, "não antes de 01/02/2025"), `vigiar_interrompido` traz `prescDate` = data do evento e `prescDays` nulo (`P:3321-3326`), `inconsistencia` (b) traz o piso (`P:3369-3378`). Efeitos: **P1** não tem casa para "data passada, sem faixa, não consumada" e, pela própria regra "o que sobrou", essas CDAs cairiam em "Decadência"; **P3** as põe no degrau vermelho "Cedo já passou — ainda se salva pela tese da União" (`proposta-3.md` 11.3; `degrau()` em `proposta-3.html:325-332`); **P2** ordena por `prescDate` e um `vigiar_interrompido` de 2011 vira o primeiro item de "Lançar fato ou ciência" (sonda `probeG3.mjs`: é o 1º de `needsYou`).
4. **Decadência não é um conjunto de CDAs.** O motor só emite `prescSegment` `ordinaria`/`intercorrente` (`P:3274-3275`); a decadência é uma coluna de toda CDA (`computeCdaLegalTimeline`, `P:2912-2929`). P2 conta "3 decadência" na base e usa a regra `prescSegment==='decadencia'`, que nunca casa; P1 rotula como "Decadência" a sobra (na prática, CDAs sem dados). Só P3 a deixa fora da conta.
5. **Os 288 do "No radar" em G3 são `correndo` rebaixado por cadastro** (dedução do código, não dos dados): em G3, só `correndo` tem ação fora de `MESA_ONE_CLICK` e não tem `reviewAt` (`M:31-41`; `P:3603-3634`, `3890-3893`, `3903-3918`). Sonda: CDA com IDPJ sem constrição e ciclo correndo → G3, `nenhuma`, "em 4 anos", com nota do processo "IDPJ … sem constrição lançada — lance o fato ou vincule" (`probeG3.mjs`). As três propostas os mandam para "Só vigiar"; a pendência de cadastro só sobrevive se a nota do processo (`processNotes`, `P:3976-4003`) continuar no cabeçalho do grupo.
6. **"Adiar" em ordinária derivada não funciona com o motor atual.** O adiamento só é lido para CDAs que já têm linha (`P:4005-4018`); ordinária a mais de 90 dias não tem linha (sonda D/D2). P1 (`nx-03`, trecho 90 d–1 ano) e P3 ("Adiar…" em todo "pede você", que inclui a ordinária derivada até 1 ano) oferecem o botão. O kit também traz `nx-30`, ordinária a 147 dias "adiada", estado impossível hoje.
7. **Decadência ainda "alarma" fora da tela de prazos**: selo "Decad." vermelho/amarelo (`APP:7334`; `CX:4733`) e a gaveta Prumo que põe no topo a contagem `worst`, que elege a decadência em empate ou quando está "consumada"/"risco" (`P:2918-2926`; `CX:3947-3952`; sonda caso L: decadência consumada + intercorrente correndo → `worst = decadencia`). Nenhuma proposta trata `worst`; só P3 menciona o selo.
8. **O número de ação das três equivale ao antigo "R$ 45,9 mi em jogo", não ao "R$ 8,0 mi".** Todas usam `mesaNeedsYou` ou equivalente para "há o que fazer", então o valor de topo será ≈ R$ 45,9 mi menos as 13 consumadas recentes (P3) e/ou as "aguardando" com lembrete vencido (P1, P2, P3). P2 rotula esse valor como "Ainda pode ser salvo", o que exagera: R$ 37,9 mi desse total vêm de pedidos de dado, cadastros e lembretes (`01-superficies.md` 3.2).

---

## 1. Derivabilidade sem mudar regra

Legenda: **M** = sai direto de campo devolvido pelo motor; **E** = derivação só na exibição (diz o que chamar); **R** = exigiria mudar regra (proibido) ou dado novo.

### P1 — Relógio

| Elemento | Origem | Observação |
|---|---|---|
| Casa 1 Tratadas | E: varrer `data.debts` (`prescriptionHandled*`; tratadas terminais não estão no radar, `P:2977-2991`) + linhas `prescKind==='aguardando_reconhecimento'` (`P:3260-3273`) | ok |
| Casa 2 Adiadas | M: `radar.silenced` com motivo de adiamento (`P:4005-4018`) | não citar `snoozePierced`: não é exportada (`P:3930`) e não é necessária (o radar já só põe em `silenced` o adiamento não furado) |
| Casa 3 Silenciadas | M: `silenced` `parcelamento_vigente`/`parcelada_ficha` (`P:4039-4057`) + `group===5` | ok |
| Casas 4/5 Consumadas antigas / Venceu há até 6 meses | M: `group===6` / `consumada==='recent'` (`P:3573-3601`) | ok |
| Casa 6 Cedo venceu, tarde não | E: `row.bandCedo`/`bandTarde` são **datas ISO** (`P:3527-3528`), não objetos com `daysLeft`; calcular com `daysUntil` | o texto da proposta diz `bandCedo.daysLeft`: corrigir |
| Casas 7–9 por data | M para kinds de prazo (`prescDays`); E para os demais: `prescLookup(debt).bounds.floor` (a linha não traz `bounds`, `P:3494-3539`) | ok, mas ver o furo abaixo |
| Ordinária > 90 dias | E: `prescLookup(debt)` em CDA sem linha → `segment:'credito'`, `phase:'originario'`, `daysLeft` (sonda D: 200 d; D2: 400 d) | ok; Adiar nela não existe (achado 6) |
| Casa 10 Sem data | M: `prescDate` vazio | ok |
| Casa 11 "Decadência" (sobra) | **não derivável como está**: a sobra real são CDAs sem dados (`sem_dados`) e linhas com data passada não-prazo (achado 3) | **falha a corrigir** |
| Raias | E: `action.type`, `prescKind`, `mesaNeedsYou` | definir onde ficam os 288 G3 `correndo` (achado 5) |
| Total por trecho e por operação | E: soma de `row.value` (`byOp` só tem contagem, `P:4082-4088`) | ok |
| "Ajuizar" | dado novo (gravar processo e criar/vincular execução), não regra | ver §4 |

Nada exige mudar regra, exceto se o usuário quiser que a ordinária derivada possa ser adiada (o motor teria de ler `prescSnooze` de CDA sem linha).

### P2 — Fila de trabalho

| Elemento | Origem | Observação |
|---|---|---|
| Regras a–f (adiadas, só vigiar, consumada recente/antiga, divergência) | M: `silenced`, `consumada`, `group`, `decisionNote` (`P:3523`), `mesaNeedsYou` | ok; `analisada_nao_consumada` não cai em regra nenhuma (não é terminal, `P:2939`): declarar fora da base |
| g Ajuizar | E: `prescSegment==='ordinaria'` + `prescKind ∈ {iminente, vencido}` | deixa de fora a ordinária `vencido_estimado` C1 (sonda: G2, cedo vencida, tarde 10/01/2027, `conferir_autos`) e o `pedido_dado` C1, que vão a "Conferir"/"Completar dado"; e o mockup põe `nx-03` (200 d) em Ajuizar contra a própria regra |
| h–k por `action.type` | M (`P:3810-3900`) | `iminente` intercorrente (termo calculado em ≤ 90 d) cai em k "Conferir o cálculo": é rótulo errado (a providência é agir no processo) |
| Seção Decadência na base | **não derivável** (`P:3274-3275`) | **falha a corrigir** |
| Item = CDAs do mesmo processo e mesma situação | E: `groupMesaRows` (`M:78-113`) + chave com `prescKind` e data | ok |
| "Conferir até" (180 − dias) | E | ok |
| "Ainda pode ser salvo" | E | rótulo exagerado (achado 8) |

Nada exige mudar regra.

### P3 — Carteira por natureza

| Elemento | Origem | Observação |
|---|---|---|
| Universo U | M (`rows`, `silenced`) + E (`data.debts` tratadas; ordinária derivada por `prescLookup`) | o mais bem definido dos três |
| Caixas 1–6 | M/E; caixa 5 = `mesaNeedsYou` (`M:31-41`) − recentes − aguardando + ordinária ≤ 365 d | ok; Adiar na ordinária derivada não funciona (achado 6) |
| Caixa 1 dentro de "Consumadas" | E | **erro de rótulo**: `prescriptionHandled` inclui `analisada_nao_consumada` ("não houve prescrição", `APP:14207-14212`), que a tela somaria em "Consumadas" |
| Degrau | E por `prescDays` | **falha**: kinds sem prazo com data passada vão a "Cedo já passou" (achado 3) |
| Decadência fora da conta | M (coluna) | correto |
| Tabela por operação, somas | E (`row.value` por `operationId`) | ok |
| "Consumação confirmada" | dado novo (campo ou `prescChecks`), sem efeito no motor | decisão de produto, não regra |

Nada exige mudar regra.

---

## 2. Dupla contagem e base única

### 2.1 Casos-limite (código + sondas)

| Caso | Onde o motor põe | P1 | P2 | P3 |
|---|---|---|---|---|
| Consumada recente (≤ 180 d) | linha G1/G2 com `consumada:'recent'`; também em `totals[6]` (`P:4076-4080`) | só trecho 1; repetida em Consumadas fora da soma (exceção declarada) ✔ | só "Conferir"; repetida fora da soma ✔ | só caixa 2 ✔ |
| Consumada recente **adiada** | sai de `rows` e vai a `silenced` antes da classificação de consumada (`P:4005-4020`; sonda G) | Adiadas ✔ | Adiadas ✔ | Adiadas ✔ (no motor nunca chega à caixa 2) |
| Aguardando reconhecimento | linha G4 **e** item de Silenciados (`M:352-366`) | Tratadas ✔ (lembrete vencido some) | Só vigiar ✔ (lembrete vencido sem destaque) | Já tratadas ✔ (dentro de "Consumadas": rótulo errado) |
| Adiamento furado | volta a `rows`, mantém `prescSnooze` (`P:3930-3941`) | volta ao relógio ✔ | volta à seção ✔ | volta a "pede você" ✔ |
| Adiar linha G6 | grava `group:6`, fura na hora (`P:3937` × `APP:9625`; sonda H) | sem botão em antigas ✔ | sem botão ✔ | sem botão ✔ |
| Parcelamento que volta à fila | ao chegar `cedo − 90` vira linha (`P:3287`) e sai do laço de silenciados (`P:4033`) | sai de Silenciadas ✔ | sai de Só vigiar ✔ | idem ✔ |
| Abrangida por IDPJ | filtro por `row.incident` (só o 1º incidente, `P:3147-3149`) | filtro, sem contador ✔ | filtro ✔ | filtro ✔ (CDA com dois incidentes só aparece no filtro do primeiro) |
| Penhora antiga (G7) | lista própria, nunca `needsYou` (`M:33`) | "Sem data", raia a decidir; mas data passada sem casa pela regra escrita ✘ | Só vigiar ✔ | Só vigiar, "Sem data" ✔ |
| Divergência da análise importada | `decisionNote` na linha, contagem à parte (`P:4090-4096`) | chip ✔ | regra e (antes de g): uma ordinária iminente divergente perde o "Ajuizar" | chip ✔ |
| `residual_media` com piso vencido | G4, `prescDays < 0`, sem faixa (sonda) | **sem casa** ✘ | Só vigiar ✔ | degrau "Cedo já passou" ✘ (rótulo) |
| Tratada `analisada_nao_consumada` | fora de `rows`; pode cair em `silenced` se parcelada (`P:4036`) | Tratadas ✔ | **sem regra** (fora da base, não declarado) ✘ | "Consumadas" ✘ |
| Decadência | coluna de toda CDA | casa 11 na conferência ✘ | 3 na base ✘ | fora da conta ✔ |

Conclusão: P3 é uma partição exata depois de duas correções de rótulo (tratadas fora de "Consumadas"; degrau dos kinds sem prazo). P1 precisa de uma casa para a sobra real e de tirar a decadência da conferência. P2 precisa tirar a decadência da base e declarar onde ficam as tratadas não terminais.

### 2.2 Números reais do usuário em cada proposta

Fatos firmes (código + números informados): G1 101 (13 recentes; 88 não consumadas = `iminente` + tese com cedo vencida); G2 0; G3 490 = 202 promovidas (pedidos de dado, inconsistências e G4 rebaixados com ação de um clique) + 288 `correndo` com cadastro pendente; G4 491 = 462 + 29 com `reviewAt` vencido (aguardando com lembrete vencido + `pausa_cadastrada`); G5 1122; G6 181 antigas; G7 0 (o contador não aparece). Silenciados 2335 = 1122 + 1213, e os 1213 = adiados + parcelados + **todas** as aguardando (que também estão em G4). Logo 332+750+2335+181 = 3598 conta as aguardando duas vezes: CDAs distintas = **3598 − a**.

Incógnitas (exigem rodar o motor na base real): **a** (aguardando, total), **a_v** (aguardando com lembrete vencido, ≤ 29), **s** (adiados válidos), **T** (tratadas fora do radar), **O** (ordinárias não ajuizadas sem linha, por horizonte: O≤1a, O>1a), **X** (G1 não consumadas com data cedo vencida), divisão ordinária × intercorrente dos 88, e todos os valores em R$. O script `S/verif/probeV.mjs` serve de molde: trocar os dados sintéticos pelo backup JSON (`operations`, `debts`, `executions`, `prescriptionEvents`).

| | O que fica no topo | Soma única? |
|---|---|---|
| **P1** | "O que eu faço primeiro": 1º = a mais antiga das **13 consumadas recentes**. Trechos: 13 · X · (88 − X) + pedidos de dado ≤ 90 d · … · 288 e os 462 `correndo` espalhados em "90 d–1 ano"/"depois" · O. Fora: Consumadas antigas 181 · Tratadas a + T · Adiadas s · Silenciadas 1122 + (1213 − a − s). "Há o que fazer" ≈ 332 − a_v + O (se toda ordinária derivada tiver "Ajuizar"). | Fecha em 3598 − a + T + O **depois** de dar casa às datas passadas não-prazo (hoje cairiam em "Decadência") |
| **P2** | "Comece por: Ajuizar …" (a ordinária iminente mais próxima, se houver nos 88). "Ainda pode ser salvo" = 319 − a_v CDAs (menos ações, pelo agrupamento), R$ ≈ 45,9 mi − valor das 13 − valor de a_v. "Consumada há pouco" 13. Só vigiar = 288 + 462 + a_v + 1122 + (1213 − a − s) = 3085 − a − s + a_v. Consumadas 181 (+ tratadas terminais). | Fecha em 3598 − a + T_terminais **sem** a decadência e com `analisada_nao_consumada` declarada fora |
| **P3** | "Comece por aqui": os 3 primeiros de "Cedo já passou" = **as linhas "há 20 anos"** (e, sem a correção do achado 3, `residual_media` com piso de anos atrás). Pedem você = 319 − a_v + O≤1a. Só vigiar = 3085 − 2a + a_v − s + O>1a. Adiadas s. "Consumadas" = 13 + 181 + a + T. | Fecha em 3598 − a + T + O ✔ (é a única que já imprime a conta certa) |

Nas três, "101" e "R$ 8,0 mi" deixam de existir como número próprio: o G1 se reparte em trechos (P1), em Ajuizar/Conferir (P2) ou em degraus + consumadas recentes (P3). "181 × 194" acaba nas três (181 antigas; 13 recentes à parte).

---

## 3. Premissas do usuário

| Premissa | P1 | P2 | P3 |
|---|---|---|---|
| Decadência nunca alarma (incl. selo "Decad." e `worst`) | **parcial**: sem linha/cor; mas entra na conferência como casa e não trata selo nem `worst` | **parcial**: sem alarme; conta na base; não trata selo nem `worst` | **parcial (quase)**: fora da conta e trata o selo; não trata `worst`; o cartão "Decadência 3 · R$ 270 mil" mostra número que, no real, seria a carteira toda |
| Ordinária só "ajuizar" (e consumada antiga sai do destaque) | **atendida**: única ação "Ajuizar"; consumada → trecho 1 ou Consumadas; ordinária derivada até qualquer horizonte | **parcial**: Ajuizar só ≤ 90 d (iminente/vencido); C1 vai a "Completar dado"/"Conferir"; nenhum aviso antes dos 90 d | **atendida**: aba Ordinária só com "Ajuizar"; derivada até 1 ano |
| (as três) Linha do tempo Prumo "CDAs sem processo · ajuizar" lista prescritas há anos (`CX:1827-1839`) | não tratada | não tratada | "só troca rótulos": insuficiente |
| Consumada recente avisada com moderação; antiga só em Consumadas | **parcial**: recentes são o 1º trecho e o 1º da lista (destaque alto); antigas ✔ | **atendida**: número próprio no topo + sub-bloco; antigas ✔ | **atendida**: faixa laranja + caixa; antigas ✔ (mas "Consumadas" engloba tratadas) |
| Intercorrente: há ação × só vigiar | **atendida** (raias); critério dos 288 G3 a definir | **atendida**, mas `iminente` calculado fica em "Conferir o cálculo" | **atendida** |
| Nem todo aviso tem ação | atendida | atendida ("por que só vigiar") | atendida |
| Edição no lugar | atendida | atendida (+ Desfazer) | atendida |
| Separar salvável × consumado | atendida (posição relativa a hoje) | atendida (dois números de topo) | atendida (escada × Consumadas) |
| Separar natureza | **parcial**: forma da bolinha, chip e filtro; a lista mistura as duas no mesmo trecho | **parcial**: chip e filtro; seções misturam | **atendida**: abas |
| Classificação por operação, valor, abrangidas | **parcial**: só filtros | **parcial**: só filtros (admitido) | **atendida**: filtros, "Agrupar por", tabela por operação |

---

## 4. Viabilidade das ações no lugar

| Ação no mockup | Função existente | Estado | Esforço da novidade |
|---|---|---|---|
| Lançar ciência / Lançar a data da ciência | `applyMesaAction` → `openPrescEventForRow(r,{type:'marco_sem_bens'})` (`APP:9535-9551`, `9594-9597`); grava por `handleSave('prescriptionEvent')` | existe como modal com `initial` | formulário inline: **pequeno** |
| Lançar ciência **nas N CDAs** | evento com `batchCdaIds` já suportado (`APP:7532`, `7927`, `8623`; motor `P:575-576`) ou evento da execução sem `cdaId` (`P:534-536`) | existe | **pequeno** |
| Lançar fato / resultado do pedido | `openPrescEventForRow(r)` (o motor não preenche `action.eventType`) | existe; formulário precisa do seletor de tipo | **pequeno** |
| Ainda vale (1 clique; em lote) | `confirmPauseStillValid` (`APP:9552-9567`) / `confirmPauseEvent` (`9481-9490`) | existe; sem pausa achada, **navega** (`9561`) | trocar a navegação por aviso no lugar: **pequeno**; lote = laço: **pequeno** |
| Completar dado (Informar datas, Vincular EF) | `applyMesaAction` ramo `corrigir_ficha`/`vincular_ef` (`APP:9598-9607`) | modal "Editar inscrição" com `_focusField` | inline: **pequeno** |
| Adiar… / Reabrir agora | `applyPrescSnooze` (`APP:9611-9632`), `snoozeMaxUntil`/`snoozeLimitDays` (`M:396`, `P:2949-2956`), `clearPrescSnooze` (`APP:9633-9641`); formulário inline já existe no Prumo (`CX:2142-2148`) | existe | nenhum; **não oferecer** em ordinária derivada nem em G6 |
| Tratar (4 formas) | `markPrazosHandled` (fixa `declarada`, `APP:9466-9479`), `markCdaAguardando` (`APP:938-961`), `toggleCdaHandled` (`APP:931-937`), formas `APP:14207-14212` | partes existem | um formulário com a forma: **pequeno** |
| Marcar conferido (Conferir nos autos) | `togglePrescCheck(debtId, {id})` (`APP:9491-9506`) + `checkId(texto)` (`P:2571`) | existe só na ficha | levar à linha/gaveta: **pequeno** |
| Marcar analisada (penhora antiga) | `markPenhoraAnalisada` (`APP:9568-9578`, usa `window.prompt`) | existe | campo no lugar: **pequeno** |
| Abrir ficha / operação | `openCdaInscricoes` (`APP:9216-9230`) | existe | — |
| **Ajuizar / "Ajuizei — informar processo"** | só "Editar inscrição" com foco no número (`APP:9598-9607`); o motor só vê ajuizada se houver execução com o mesmo número (`P:588-594`); salvar a CDA não cria execução (`APP:4640-4683`) | **novo** | se a execução já existe: gravar o número (**pequeno**); criar a execução com data de protocolo e evitar duplicidade (`APP:4643-4657`): **médio** |
| **Desfazer** (P2) | só existe "Reabrir agora" do adiamento | **novo** | **médio** (guardar o estado anterior por tipo de ação) |
| Consumação confirmada (P3) | não existe | **novo** (campo ou marca em `prescChecks`) | **pequeno** + decisão |
| Editar dados da decadência no lugar (P3) | bloco do formulário da inscrição (`APP:14086-14091`) | existe como modal | inline: **pequeno/médio** |
| Exportar CSV (P3) | não existe | **novo** | **pequeno** |
| Eixo com lupa (P1) | não existe | **novo** | **grande** (médio sem a lupa) |
| Matriz da escada + tabela por operação + "Agrupar por" (P3) | não existe | **novo** | **médio** |
| Função única de classificação (as três) | `mesaNeedsYou`, `consumada`, `silenced` existem | **nova** função pura + testes | **médio** |
| Simular carteira grande (P1) | só demonstração do mockup | não construir | — |

---

## 5. Leitura crítica dos mockups

Medidas (Chromium, `verif/fold.js`): primeira linha da lista em **P1 1093 px / P2 694 px / P3 1255 px** no desktop 1400×1000, e em **P1 2280 px (2,9 telas) / P2 1681 px (2,1) / P3 2308 px (2,9)** no celular 390×800. Sem rolagem horizontal; o único erro de console é a fonte do Google (rede do ambiente). Nenhum jargão de motor no texto renderizado (busca por kind, prescKind, G1–G7, grupo N, faixa alta/média, piso, teto, marco, Tema, Súmula, dies: zero ocorrências, `verif/p*-alltext.txt`).

### P1 (`proposta-1.html`)
- A caixa "O que eu faço primeiro?" responde bem; mas o 1º item é uma CDA **já consumada** ("Conferir nos autos: Consumada nas duas leituras"), o que contraria o "destaque moderado".
- No eixo, as consumadas recentes ficam na raia "Há o que fazer" (círculos vazados): leitura contraditória ("fazer" algo com o que já se perdeu).
- O trecho "Cedo venceu, tarde não" coloca todas as bolinhas sobre "hoje", seja a cedo de 11 meses ou de 20 anos: perde justamente a informação decisiva (quando vence a tarde).
- Escala não linear (semanas, meses, anos em colunas de largura fixa): está explicada na legenda, mas convida a ler distâncias como tempo.
- A faixa do trecho 2 diz "a data tarde é a tese da União" também para os itens "Falta dado", em que a tarde depende do dado que falta.
- "19 CDAs no relógio · R$ 25,8 mi" soma "Só vigiar" com "Há o que fazer": reaparece um total misto no topo.
- "Depois: 5 CDAs mais adiante — só acompanhar o relógio" inclui uma CDA com "Ajuizar".
- "Decadência (consulta) 3" entra na conta "19 + 11 = 30".
- No celular o eixo vira uma pilha de trechos com bolinhas sem escala: o relógio deixa de ser relógio; a lista começa na 3ª tela.
- Ótimo: linha condensada "2 CDAs · mesma situação" com "Lançar ciência nas 2"; régua do eixo em miniatura na linha.

### P2 (`proposta-2.html`)
- O "Comece por" é o mais direto dos três e a lista começa na primeira tela do desktop.
- Dez valores em R$ antes da lista (dois grandes + oito contadores); "Ainda pode ser salvo R$ 20,5 mi" reintroduz o "em jogo" com rótulo mais forte.
- Duas unidades lado a lado ("12 ações · 13 CDAs"; "Cedo já vencida 3" conta itens enquanto P1/P3 contam 4 CDAs): convite ao erro de leitura.
- "Consumadas 3 · 3 CDAs antigas" inclui uma tratada (reconhecida, `nx-28`).
- A seção "Conferir o cálculo" mistura: intercorrente a vencer (tese com cedo em 66 d: "peticionar antes"), divergência importada e consumadas recentes.
- "Gaveta →" é termo de interface; trocar por "Ver tudo".
- Ótimo: bloco "Prazo da ação" ("Ajuizar até 18/11/2026 · fim dos 5 anos para ajuizar"), o verbo no botão, "por que só vigiar" nas linhas quietas, faixa "saiu de X, está em Y".

### P3 (`proposta-3.html`)
- Cabeçalho pesado (1,25 tela no desktop, quase 3 no celular), mas a matriz é legível e a conta "13 + 6 + 2 + 6 = 27" é a prova mais clara de base única.
- "Consumadas" aparece com três números diferentes: aba **2**, cabeçalho **6**, cartões 2/2/2; e "6" inclui "Já tratadas". É a mesma confusão 181 × 194 com outra roupa.
- "Comece por aqui" = os três "cedo já passou" mais antigos (com dados reais, as linhas "há 20 anos").
- A aba padrão é Intercorrente: a ordinária a vencer em 40 dias (o prazo real mais próximo da amostra) fica escondida na outra aba e fora do "Comece por aqui".
- "Por operação · Próximo prazo: há 7 m / há 11 m": "próximo prazo" no passado.
- "conferir uma faixa vencida" (subtítulo de "Há o que fazer") é jargão; "faixa" na tela só como "faixa cedo–tarde" da régua.
- A gaveta **não tem as três colunas** (decadência/ordinária/intercorrente) exigidas pela regra 6 do brief.
- Ótimo: filtros (abrangidas Todas/Sim/Não), "Agrupar por", Consumadas antigas agrupadas por operação com soma e CSV, decadência neutra.

### Consistência entre as três
Mesmo kit, mesma anatomia de linha e mesmos chips. Mas o mesmo conceito tem nomes diferentes: "Cedo venceu, tarde não" / "Cedo já vencida" / "Cedo já passou"; "Venceu há até 6 meses" / "Consumada há pouco" / "Consumadas recentes"; "Há o que fazer" / "Ações a fazer" / "Pedem você". Para a página comparativa, unificar esses nomes, para o usuário comparar estrutura, não vocabulário. O chip "Analisar" é usado para "Análise diverge do cálculo" (`nx-15`), mas no app "Analisar" é o selo da penhora antiga (`M:16`); a divergência é outro selo ("análise diverge", Lista).

---

## 6. Escala (~3.600 CDAs distintas; até ~4.000 com ordinárias derivadas e tratadas)

| | O que quebra | Mitigação mais simples |
|---|---|---|
| P1 | Bolinhas viram barras (o "Simular" mostra que agrega bem), mas "Cedo venceu, tarde não" e "Sem data" são uma coluna só; a lista "na ordem do relógio" teria ~1.100–1.500 linhas (G1–G4 + derivadas) antes de "Fora do relógio"; no celular, centenas de bolinhas por trecho | Trechos 1–3 abertos, 4–6 recolhidos com número e soma; paginar 50 por trecho; no celular só números por trecho; no trecho 2, eixo interno pela data tarde |
| P2 | "Só vigiar" ≈ 3.000 CDAs; "Lançar fato ou ciência" pode passar de 100 itens | "Só vigiar" recolhido e subdividido pelo "por que" (ciclo encerrado, parcelado, ainda impossível, aguardando, cadastro pendente) com contagem; paginação por seção |
| P3 | "Só vigiar" ≈ 3.000; tabela por operação com dezenas de linhas; "Já tratadas" cresce com o histórico; agrupar por operação dentro de cada degrau multiplica cabeçalhos | Tabela "top 10 + ver todas"; antigas e tratadas em tabela; "Só vigiar" recolhido por motivo; agrupamento padrão por degrau, operação só por escolha |

Comum: a varredura de `data.debts` para tratadas e ordinárias derivadas é barata (o `prescLookup` já é memoizado, `APP:3922-3923`).

---

## 7. Comparativo e recomendação

| Critério | P1 Relógio | P2 Fila | P3 Carteira |
|---|---|---|---|
| Clareza do "o que fazer primeiro" | alta (caixa + 3 passos), mas começa por consumada | **alta** (verbo + item, na 1ª tela) | média (3 cartões; cabeçalho longo; cai nos "há 20 anos") |
| Fidelidade às premissas | média (natureza e operação fracas; decadência na conta) | média (ordinária parcial; operação ausente) | **alta** (falta `worst` e as 3 colunas na gaveta) |
| Base única | média (furo na sobra; decadência) | média (decadência na base; unidades misturadas) | **alta** (após 2 correções de rótulo) |
| Esforço | **grande** | **médio** | médio-grande |
| Escala | média | **boa** | média-boa |
| Aderência ao relógio | **máxima** | baixa (só no item) | média (escada + régua) |
| Risco de erro de leitura | médio-alto (escala não linear; consumadas em "fazer"; trecho 2 sem tarde) | médio (R$ "pode ser salvo"; ações × CDAs; iminente em "conferir") | médio ("Consumadas" com 3 números; degrau vermelho para "não antes de") |

**Recomendação: combinação, com o relógio de P1 como desenho, a partição de P3 como conta e os verbos de P2 como linha.**

- **De P1**: a caixa "O que eu faço primeiro?" (1º item + 3 passos com soma); os trechos do tempo como os contadores do topo, só para o que ainda se salva; as duas raias "Há o que fazer × Só vigiar"; a régua da linha igual ao eixo; o filtro segmentado de natureza (Todas · Ordinária · Intercorrente), que refaz eixo, contadores e lista, no lugar das abas de P3 (para não partir o relógio em dois). Fica de fora a lupa (fase posterior) e o "Simular".
- **De P2**: o verbo no botão e o bloco "Prazo da ação" ("Ajuizar até …", "Lançar até …", "Peticionar antes de …"), o "por que só vigiar" nas linhas quietas, a barra de lote ("Ainda vale nas N", "Adiar as N") e, numa segunda fase, a faixa "saiu de X, está em Y" com Desfazer. Fica de fora a ordem por seção de verbo e o "Ainda pode ser salvo R$".
- **De P3**: a função única de caixas sobre o universo U (com Tratadas fora de Consumadas) e a conta impressa; todos os números seguindo os filtros; a barra de filtros (operação, abrangidas Todas/Sim/Não, certeza, valor) e "Agrupar por" (trecho › operação, operação, processo, valor); a tabela "Por operação" recolhida; a área Consumadas (recentes, antigas por operação com soma, tratadas, CSV); a Decadência como consulta fora da conta.
- **Por quê**: responde às três perguntas na ordem em que o usuário as faz (o que primeiro → quanto e onde → como resolver aqui), respeita a preferência pelo relógio e herda a única prova de base única que já fecha. Em fases (AGENTS.md: uma fase por vez): (1) função de caixas + lista na ordem do relógio com verbos + filtros + Consumadas/Decadência, com os trechos como cartões numéricos; (2) o eixo gráfico; (3) Desfazer, tabela por operação, CSV.

**As 5 decisões que só o usuário pode tomar**
1. **Consumadas recentes (13)**: abrem a lista (P1) ou ficam como aviso moderado ao lado do que ainda se salva (P2/P3)?
2. **Tese com cedo vencida há anos e tarde futura ou vazia** (rescisão, falência; as "há 20 anos"): ficam no alto como urgentes, ou entram no relógio pela data tarde, com a marca "cedo já venceu"?
3. **Ordinária não ajuizada**: avisar "ajuizar" a partir de 90 dias (motor), 1 ano (P3) ou sempre (P1)? E aceitar que ela só possa ser adiada quando entrar nos 90 dias (ou pedir mudança de regra)?
4. **Ação ou vigilância**: penhora antiga (o motor oferece "Marcar analisada") e os ~288 "correndo com cadastro pendente" (IDPJ sem constrição etc., hoje "A completar" sem botão).
5. **"Aguardando reconhecimento" com lembrete de 60 dias vencido**: volta como ação ("cobrar a decisão") ou fica em Tratadas com marca?

Registro (fora do escopo): o e-mail diário continua na política v1, janela de 180 dias, e manda consumadas antigas como "VENCIDA — conferir" (`RESUMO-DIARIO.js:201-228`); os números dele não vão bater com nenhuma das três.

---

## 8. Lista de correções para o agente de montagem

### Comuns (kit `dados.js` e as três páginas)
- `nx-09`/`nx-10`: no motor é penhora antiga (G7, "Marcar analisada"). Ou reclassificar como penhora antiga, coerente com `nx-22`, ou **trocar por um caso real de "cedo venceu, tarde não"**: rescisão (A1) ou falência (A4) com cedo em 2006 e tarde em 2028/2031 ou vazia, que é o caso do print do usuário e hoje não está no kit. A régua não deve chamar "penhora + 1 + 5 anos" de "data cedo".
- `nx-15`: certeza "Calculado" + selo à parte "análise diverge"; "Analisar" é só da penhora antiga.
- `nx-12`: no motor é `iminente` (G1, Calculado, termo em 54 d); "Lançar resultado do pedido" pode ficar como rótulo de exibição derivado de `flags`.
- `nx-25`: adiamento de pedido de dado (G3) vale no máximo 7 dias (volta 12/10, não 21/10); corrigir "voltam 21/10 a 24/10" (P3) e "a primeira volta 21/10/26" (P2).
- `nx-30`: ordinária a 147 dias não pode estar adiada (sem linha no motor); mover para ≤ 90 dias ou tirar o adiamento.
- `nx-06/07/08`: não são CDAs "de decadência"; nenhuma página deve somá-las na base.
- Unificar os nomes dos conceitos compartilhados (ver §5, consistência).
- Em cada `.md`, §9/§10: neutralizar o selo "Decad." (`APP:7334`; `CX:4733`) e ordenar as três contagens da gaveta pela natureza da linha, nunca por `worst` (`CX:3947-3952`); a Linha do tempo Prumo "CDAs sem processo · ajuizar" (`CX:1827-1839`) passa a usar a mesma classificação (sem consumadas antigas).
- Bloco "cedo venceu, tarde não": ordenar pela data tarde (vazia por último) e mostrar "tarde em …" como relógio principal.

### `proposta-1.md` / `proposta-1.html`
- §3 casa 11: tirar "Decadência" das casas; criar "Sem prazo calculável" para a sobra (sem dados) e dar casa explícita às linhas com data passada que não é prazo (`residual_media`, `inconsistencia` b, `penhora_antiga`, `vigiar_interrompido` sem piso futuro). HTML: tirar "Decadência (consulta) 3" da conferência "19 + 11 = 30"; decadência só como aba de consulta.
- §3 casa 6: `bandCedo`/`bandTarde` são datas; calcular dias. Casa 2: não citar `snoozePierced` (não exportada); basta estar em `silenced`.
- Faixa do trecho 2: "a tarde é a tese da União" só para Cedo–tarde; para Falta dado, "a tarde depende do dado que falta".
- Tirar "Adiar…" das ordinárias derivadas (`nx-03`) ou marcá-lo como decisão 3.
- Consumadas recentes: tirar da raia "Há o que fazer" (raia própria neutra ou marca "conferir") e não usá-las como "1º da lista" enquanto a decisão 1 não for tomada.
- Topo: número principal = "Há o que fazer: N · R$"; o total misto só na linha de conferência.
- "Depois: 5 CDAs … só acompanhar" → "Depois: 5 CDAs (1 com ação)".
- "Simular carteira grande": rotular "demonstração; não é recurso".

### `proposta-2.md` / `proposta-2.html`
- Tirar "3 decadência" da Base e a regra `prescSegment==='decadencia'`; decadência como consulta fora da conta. Declarar onde fica `analisada_nao_consumada`.
- Regra g (Ajuizar): incluir toda ordinária que pede você e não está consumada (`vencido_estimado` e `pedido_dado` C1, com "informar a constituição" como ação secundária); tirar `nx-03` de Ajuizar ou declarar a derivação de ordinária > 90 d.
- Separar de "Conferir o cálculo" a intercorrente a vencer (`iminente` e tese com cedo à frente) numa seção "Agir no processo antes do termo", antes de "Conferir".
- Ordem dentro da seção: só kinds de prazo por `prescDate`; `vigiar_interrompido`, `residual_*`, `inconsistencia` b depois, por valor.
- "Consumadas 3 · 3 CDAs antigas" → "2 antigas + 1 tratada".
- "Ainda pode ser salvo R$ …" → "Há o que fazer · N CDAs (M ações) · R$ …"; uma unidade principal (CDAs) e a outra entre parênteses; "Cedo já vencida" contando CDAs.
- "Gaveta →" → "Ver tudo"; desenhar a marca do lembrete vencido de "aguardando".

### `proposta-3.md` / `proposta-3.html`
- Separar "Já tratadas" de "Consumadas" (no real inclui "não houve prescrição"); identidade do cabeçalho: "pedem você + só vigiar + adiadas + consumadas + tratadas".
- Um número só para Consumadas (aba, cabeçalho e cartões): "Consumadas 4 · 2 a conferir".
- `degrau()` e §11.3: kinds sem prazo com data passada → "Sem data/sem prazo calculável", nunca "Cedo já passou".
- Gaveta: acrescentar as três colunas (decadência/ordinária/intercorrente), destacando a natureza da linha.
- Cartão "Decadência 3 · R$ 270 mil": sem número (só "consulta").
- Tirar "Adiar…" da ordinária derivada ou marcá-lo como decisão 3.
- Aba inicial: a do primeiro item de "Comece por aqui", ou uma visão "Todas".
- "Próximo prazo: há 7 m" → "cedo venceu há 7 m" (passado) / "em 45 d" (futuro).
- "conferir uma faixa vencida" → "conferir quando a data cedo já venceu".
- Recolher "Por operação" e "Fora da escada" por padrão para trazer a lista à primeira tela.
- §9 Linha do tempo: além dos rótulos, o bloco "ajuizar" passa a excluir consumadas antigas.
