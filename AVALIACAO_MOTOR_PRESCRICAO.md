# Avaliação do motor de prescrição — e proposta de reconstrução

Leitura crítica de `src/lib/prescription.js` (1.338 linhas), do classificador do painel, das demais superfícies que leem prescrição (`src/app.jsx`, `RESUMO-DIARIO.js`) e das regras propostas no `MOTOR_PRESCRICAO.md`. Data-base: 07/09/2026. Suíte atual: 127 testes, todos passando.

Os defeitos da seção 2 foram **reproduzidos** com um script contra o motor real (casos A2, D, F, G, H, I abaixo). Nada foi alterado no código.

---

## 1. Veredito

A tese jurídica do motor está correta e bem documentada: Tema 566 sem inventar marco, 1+5 em anos civis, retroação ao pedido, desconto de pausas, protesto só após a LC 208/2024, parcelamento com efeito duplo. **Isso deve ser preservado.**

O problema não é a tese. É que o motor traduz "não sei" e "não corre mais" como **`status: 'seguro'`**, e que a **data informada manualmente sobrepõe o cálculo** sem nenhuma checagem. Essas duas decisões produzem falsos negativos silenciosos em todas as superfícies que não passam pelo classificador do painel (KPI, sidebar, card de processo, snapshot, e-mail). O `PLANO_IMPLEMENTACAO` já apontava "sem marco = seguro" como comportamento a mudar; a reprodução abaixo mostra que é pior: **com marco e com prescrição consumada, uma data informada errada apaga o alerta**.

**Risco operacional (decisão do usuário):** falso positivo de consumação (pedir conferência de crédito ainda vivo) é preferível a falso negativo. Prescrição que se consume em silêncio é o pior caso; na dúvida, o radar deve mostrar, não omitir.

Sobre o `MOTOR_PRESCRICAO.md`: as regras 10.1 (piso) e 10.3 (faixas) são corretas e devem entrar. A 10.2 (recorte por status) precisa de uma ressalva séria, porque o próprio app grava `garantida` automaticamente a partir de eventos de constrição (inclusive via IDPJ), o que tornaria o recorte circular. E há um terceiro conceito que o documento não explora e que resolve a maior parte do cesto: além do **piso** (não antes de), há um **teto** (não depois de) derivável do arquivamento.

---

## 2. Defeitos confirmados

| # | Caso reproduzido | O que o motor faz | O que deveria fazer | Gravidade |
|---|---|---|---|---|
| **D** | Marco `sem bens` em 01/01/2012 (consumação calculada: 01/01/2018). CDA com `prescriptionDate` = 31/12/2031. | `phase: correndo`, `diesAdQuem: 2031-12-31`, `origin: data_informada`. **Painel: nenhum card.** `lookup.date` devolve 2031. | Data informada divergente do cálculo com marco é **conflito**, não verdade. Fase jurídica vem do cálculo; a informada aparece como divergência a resolver. | **Crítica** — falso negativo com prescrição consumada há 8 anos |
| **F** | Marco 2011, penhora efetiva 2013, nada depois (13 anos de silêncio). | `phase: interrompido`, `status: seguro`. Painel: `null` — some de todos os cards, para sempre. | Interrupção encerra o ciclo, mas não torna a inscrição "segura" por prazo indeterminado. Estado próprio: `interrompido_vigiar`, com data sugerida de revisão. | **Alta** — o feito parado há 13 anos é justamente onde nasce um marco não cadastrado |
| **A2** | Marco 01/06/2011; falência de 01/07/2011 a 01/07/2024 (13 anos). | `diesAdQuem: 2030-02-07`. Correto: ≈ 03/06/2030. O laço `addUnpausedDays` para em **5.000 iterações** (L290) e devolve a data truncada, sem aviso. | Cálculo aritmético (soma de intervalos), ou guarda proporcional ao total de pausas + `gap` explícito se estourar. | **Média** — antecipa o termo em meses; com pausa mais longa, declara "consumado" falsamente |
| **G** | Marco 2020; embargos suspensivos de 01/01/2021 a 01/01/2028 (fim futuro conhecido). | `diesAdQuem: 2031-09-07` ("Termo final projetado"). Correto: 01/01/2032. `resolvedSuspEnd` corta o fim em `asOf` (L273–274). | Projetar com o fim conhecido. Cortar em hoje só quando o fim é desconhecido. | **Média** — projeção rotulada como termo final está errada por 4 meses |
| **H** | Marco com data futura (01/01/2027). | Aceito; `suspensao_art40` até 2028, termo 2033. Só o tipo IDPJ é filtrado por data futura (L581). | Evento futuro é erro de digitação: ignorar no cômputo e registrar `gap`. | Baixa |
| **I** | CDA cujo `processNumber` bate com um **IDPJ** (`processTag: idpj`), não com EF. | Tratada como ajuizada, `diesAQuo` = protocolo do IDPJ. `collectEventsForCda` pega `matchingExecs[0]` sem olhar `processTag` (L186). | Preferir EF (`normal`/`central`); se só houver incidente, `gap` "CDA vinculada a incidente, não a EF". | Baixa |
| **B/C/E** | Só `susp_art40` (2015); só `info_arquivamento` (2014); só penhora efetiva pré-marco (2019). | Os três: `nao_iniciado` / `seguro` / cesto "sem gatilho". Sinal descartado. | B: `susp_art40` sem marco **é** o marco (quem lançou a suspensão sabe a data da ciência) — usar com `gap`. C: arquivamento é **teto** do marco. E: constrição pré-marco é **piso** do marco. Ver seção 4. | Alta (volume) |

Reprodução: os casos rodam com `computePrescription` e `classifyPainelPrescAlert` importados diretamente; valem como fixtures de regressão prontas para a fase 0 do plano.

---

## 3. Fragilidades de arquitetura

### 3.1 Cinco superfícies, quatro critérios

| Superfície | Onde | Critério |
|---|---|---|
| Cards do painel | `classifyPainelPrescAlert` (L1183) | fase + ciclo iniciado + janela **180 d** |
| KPI "Risco prescricional", sidebar, relatório | `getPrescDate` (app.jsx:3594, 3611, 9054, 4948) | `prescriptionDate` **ou** `diesAdQuem`, sem olhar fase nem ciclo; janela 180 d |
| Card de processo (`ProcPrescCard`) | app.jsx:7170–7178 | `d.prescriptionDate \|\| getPrescDate(d)`; 180 d "critical", 365 d "warning"; "Prescrita" se dias ≤ 0 |
| KPI por execução | app.jsx:5147–5158 (`calcPrescription`) | `status` ∈ {critico, alerta, prescrito}; `statusFrom` usa **365 / 730 d** |
| E-mail diário | `RESUMO-DIARIO.js:201–219` | snapshot; exclui `estimativa`, exclui `prescrito`, exclui `dias < 0`; janela **90 d** |

Consequência prática: o KPI conta uma CDA que o painel manda para "sem gatilho"; o card do processo escreve "Prescrita" para uma CDA sem ciclo cuja previsão de planilha passou; o e-mail **não avisa** de prescrição vencida (`dias < 0` e `prescrito` excluídos), que é exatamente o que mais importa avisar.

### 3.2 `statusFrom` mistura fase jurídica com semáforo

`nao_iniciado → seguro` e `interrompido → seguro` (L123). "Seguro" deveria significar "há prova de que não corre". Aqui significa "não sei" ou "parou de correr um dia". Todo consumidor de `status` herda o erro.

### 3.3 `prescriptionHandled` como chave de ocultação

`isPainelPrescCandidate` (L1153) remove qualquer CDA com o booleano. `aguardando_reconhecimento` **não é terminal** e some do radar igual. Marcar processo como `extinta` grava `prescriptionHandled: true` nas CDAs (app.jsx:4308), confundindo extinção com tratamento da prescrição. O `PLANO §5.3` já pede a migração para estados; confirmo a necessidade.

### 3.4 Status da CDA gravado automaticamente a partir de evento

`statusMap` (app.jsx:4326–4337): `int_penhora`, `int_arresto`, `int_sisbajud`, `int_cnib` e **`susp_idpj_mcf_constricao`** gravam `garantida`. Uma penhora parcial, um Sisbajud de R$ 300,00 ou uma indisponibilidade em incidente viram "garantida". Se a regra 10.2 usar `garantida` para rebaixar alertas, o rebaixamento nasce do próprio evento que o motor já contabilizou — circular e otimista.

### 3.5 Origem da planilha rotulada como `data_informada`

No ramo sem marco (L811–812), `exec.prescriptionForecast` (coluna "Previsão" da planilha de processos) recebe `origin: 'data_informada'`, o mesmo rótulo da data digitada na CDA. O e-mail confia em `data_informada`. A previsão da planilha nem passa pelo filtro de ciclo do painel, mas pode disparar e-mail.

### 3.6 Desempenho

`calcPrescription` (L918) recalcula sem índice por execução; o laço em app.jsx:5147 o chama por processo com eventos. Com milhares de CDAs, é O(execuções × CDAs × eventos). O `createPrescLookup` já resolve isso para as CDAs; falta o KPI por execução usar o mesmo lookup.

---

## 4. Avaliação das regras propostas no MOTOR_PRESCRICAO.md

### 4.1 Piso pessimista (§10.1) — **aprovar, e ampliar as âncoras**

Correto: o marco não pode preceder o protocolo, e pausas só empurram o termo para frente. Logo `protocolo + 1 + 5` sem descontar nada é um piso legítimo.

Ampliação: qualquer ato datado que **necessariamente antecede** a ciência da inércia também ancora o piso. O motor já tem esses eventos e hoje os descarta com a nota "não inaugura a intercorrente" (L619):

| Âncora do piso | Por quê |
|---|---|
| Protocolo da EF | Marco é ato da execução |
| Despacho citatório / citação efetiva (`int_despacho_citacao`, `int_citacao`) | Não localização é apurada na tentativa de citação; sem bens é apurado depois de citado |
| Constrição efetiva pré-marco (`int_penhora`, `int_sisbajud`, etc.) | Se houve constrição útil, a ciência de "sem bens" só pode ser posterior |
| Rescisão de parcelamento (já é gatilho) | — |

`piso = max(âncoras) + 1 ano + 5 anos`. Se hoje < piso → a intercorrente **não pode** estar consumada. Isso retira do cesto urgente todo feito recente **e** todo feito antigo com constrição recente, sem fingir marco.

### 4.2 Teto — **conceito novo, complementar ao piso**

O documento só olha para "não antes de". Há sinais que dizem "não depois de":

| Fonte do teto | Raciocínio |
|---|---|
| `info_arquivamento` com data A | Arquivamento do art. 40, § 2º, pressupõe o ano de suspensão já decorrido: marco ≤ A (rigoroso: ≤ A − 1 ano). Logo `termo ≤ A + 1 + 5 + pausas registradas` |
| `susp_art40` com data S, sem marco | Não é teto: **é o marco**. Quem lançou "suspensão art. 40 em S" registrou a ciência. Tratar como marco com `gap` "informado como suspensão art. 40, sem evento de marco" |
| Status do processo `arquivada` sem data | Sem teto numérico, mas prova que o juízo entrou no regime: **Alta** e pedido de data |

Com piso e teto, o cesto "sem gatilho" deixa de ser um saco e vira um **intervalo**: `[piso, teto]`.

- hoje < piso → **Baixa** ("acompanhar a partir de dd/mm/aaaa"), recolhida por padrão
- hoje > teto → **"Vencido — conferir"** com rótulo "estimado por teto (arquivamento)". O card já se chama "conferir"; não se afirma marco
- entre os dois, ou sem teto → **Média/Alta** conforme 4.4

### 4.3 Recorte por situação de cadastro (§10.2) — **aprovar com três ressalvas**

1. **`garantida` não remove, só pesa.** Pelo motivo da seção 3.4. Enquanto o `statusMap` gravar `garantida` a partir de IDPJ e Sisbajud, o status não é confiável. Ou se retira IDPJ/Sisbajud do mapa, ou se grava `statusSource: 'auto'` e a triagem desconta.
2. **`parcelada` / `suspensa_*` sem evento não pausam o relógio; viram inconsistência.** Pausar silenciosamente é fingir evento. A saída honesta é uma faixa **"Inconsistência de cadastro"**: "status diz parcelada, sem evento de adesão — cadastre ou corrija". Um clique gera o evento; aí o motor pausa de verdade.
3. **"Presc. intercorrente interrompida = SIM" da planilha** só rebaixa prioridade. Nunca remove: a planilha não diz qual foi o ato, e o Tema 568 exige ato com resultado.

Previsão da planilha: manter fora do card "iminente" (que deve ficar reservado ao cálculo com marco), mas usá-la para **ordenar e priorizar** dentro do cesto residual, com o rótulo "previsão de planilha, sem marco legal". Se a previsão já passou → Alta.

### 4.4 Faixas (§10.3) — **aprovar, com regra explícita**

| Faixa | Entra quando (qualquer) |
|---|---|
| **Vencido — conferir (estimado)** | hoje > teto |
| **Alta** | processo `arquivada` sem marco · previsão de planilha vencida ou ≤ 180 d · piso vencido há mais de 2 anos sem nenhum evento datado · inconsistência de cadastro |
| **Média** | piso vencido, sem os agravantes acima · sem protocolo (piso incalculável) |
| **Baixa** | hoje < piso — exibir só contagem, recolhida |

### 4.5 O que o documento acerta em não recomendar (§10.4)

Concordo integralmente: ajuizamento não é marco; feito antigo sem evento não é "prescrito"; não exigir marco em tudo como pré-condição. Acrescento um quarto: **não deixar a data informada calar o cálculo** (caso D).

---

## 5. Proposta de reconstrução

Não é reescrita. O núcleo (`computeIntercorrente`, `computeOriginario`, `computeDecadencia`) fica. Muda o **contrato de saída**, entra uma camada de **avaliação operacional**, e todas as superfícies passam a ler dela.

### 5.1 Contrato único

```js
assessCda(debt, ctx, asOf) → {
  legal: {            // o que existe hoje, sem 'seguro' fantasma
    segment, phase, diesAQuo, diesAdQuem, origin, memory, gaps, timeline
  },
  bounds: {           // só quando phase === 'nao_iniciado'
    floor, floorBasis,        // 'protocolo' | 'citacao' | 'constricao' | null
    ceiling, ceilingBasis     // 'arquivamento' | null
  },
  informed: {         // data digitada na CDA e previsão da planilha, separadas
    cda, planilha, conflictsWithLegal
  },
  operational: {      // UMA categoria por CDA
    category,         // ver 5.2
    priority,         // alta | media | baixa
    reviewAt,         // data sugerida de revisão
    reasons: []       // frases curtas, exibíveis
  },
  handling: { state, at, type }   // substitui prescriptionHandled (5.4)
}
```

`buildPrescriptionRadar(data, asOf)` aplica isso a todas as CDAs ativas e devolve os buckets. **Painel, KPI, sidebar, card de processo, relatório e snapshot do e-mail leem o radar.** Nenhum deles recalcula janela.

### 5.2 Categorias operacionais (uma por CDA, sem exceção)

| Categoria | Origem |
|---|---|
| `vencido` | ciclo iniciado e termo passado |
| `vencido_estimado` | sem marco, hoje > teto |
| `iminente` | ciclo iniciado, ≤ janela |
| `correndo` | ciclo iniciado, > janela |
| `suspenso` | pausa ativa |
| `interrompido_vigiar` | constrição/citação encerrou o ciclo; `reviewAt = interrupção + 1 ano` |
| `sem_gatilho_alta` / `_media` / `_baixa` | seção 4.4 |
| `avaliar_174` | não ajuizada, sem quinquênio calculável |
| `inconsistencia_cadastro` | status contradiz eventos (4.3.2), data informada contradiz cálculo (caso D), evento futuro (H), CDA apontando para incidente (I) |
| `aguardando_reconhecimento` | prescrição identificada, sem decisão |
| `terminal` | reconhecida em juízo ou CDA extinta |

Janela única (`PAINEL_PRESC_WINDOW`) configurável; o e-mail recebe a categoria pronta e só filtra por prioridade.

### 5.3 Correções no motor (sem mudar a tese)

1. **Precedência da data informada.** Com marco ou ciclo pós-rescisão, `diesAdQuem` é o calculado. A informada vira `informed.cda` e, se divergir em mais de N dias, `inconsistencia_cadastro` + `gap`. Sem marco, a informada continua como previsão rotulada, nunca como `data_informada` indistinta da planilha.
2. **`statusFrom`**: `nao_iniciado → indeterminado`, `interrompido → interrompido`. "Seguro" só para `obstada` (decadência) e para ciclo encerrado **com** `reviewAt` no futuro.
3. **`addUnpausedDays`**: aritmética de intervalos (soma os trechos não pausados até completar `need`), sem laço dia a dia. Elimina o teto de 5.000 e é mais rápido.
4. **`resolvedSuspEnd`**: não cortar fim futuro conhecido; cortar só quando desconhecido.
5. **Eventos futuros**: ignorar no cômputo, `gap`.
6. **`collectEventsForCda`**: preferir EF a incidente; com várias EFs, piso pelo protocolo mais antigo.
7. **`susp_art40` sem marco** = marco com `gap`. **`info_arquivamento`** alimenta `bounds.ceiling`. **Constrição pré-marco** alimenta `bounds.floor`.
8. **KPI por execução** passa a usar o lookup, não `calcPrescription` avulso.

### 5.4 Tratamento como estado, não booleano

`handling.state ∈ { em_acompanhamento, em_analise, aguardando_reconhecimento, reconhecida, extinta }`, com histórico. Migração idempotente: `prescriptionHandled && type === 'aguardando_reconhecimento'` → `aguardando_reconhecimento` (continua visível); demais `true` → `reconhecida`; `status === 'extinta'` → `extinta`. Só `reconhecida` e `extinta` são terminais.

### 5.5 Dois ganhos baratos de cadastro

- Ao marcar processo como **"Arquivada art. 40"**, o app já abre um `confirm` para propagar às CDAs (app.jsx:4303). Trocar por um formulário que pede **a data da ciência ou da decisão de suspensão** e cria o marco (ou, se só houver a data do arquivamento, cria `info_arquivamento`). Um campo, e a inscrição sai do cesto.
- Na faixa `inconsistencia_cadastro`, botão "criar evento a partir do status" (parcelada → adesão; suspensa_judicial → decisão suspensiva) com data a preencher.

### 5.6 Ordem de implementação

| Fase | Entrega | Tamanho |
|---|---|---|
| **0** | Fixtures de regressão dos casos A2, D, F, G, H, I e B/C/E (falhando), com `legalBasis` e `validatedAt` conforme `PLANO §4.4` | P |
| **1** | Correções 5.3 itens 1–6; `bounds` calculado e exposto no resultado e no snapshot; UI intocada | M |
| **2** | `buildPrescriptionRadar` + categorias 5.2; painel troca os quatro cards pelas faixas; KPI, sidebar, `ProcPrescCard`, relatório e e-mail leem o radar; e-mail passa a incluir vencidos | M/G |
| **3** | `handling` (5.4) com migração; formulário de marco ao arquivar; faixa de inconsistência com ação (5.5) | M |
| **4** | Medição: quantas CDAs por faixa antes e depois, para calibrar os agravantes de "Alta" | P |

Cada fase fecha com `npm test` verde e build. A fase 1 não muda nada que o usuário vê; a fase 2 é a que esvazia o cesto.

---

## 6. O que não fazer

- Não tratar ajuizamento, citação, constrição pré-marco ou status "arquivada" como **marco**. São **âncoras de piso e teto**, o que é diferente e suficiente.
- Não remover inscrição do radar por `garantida`, `parcelada` ou "interrompida = SIM" de planilha. Rebaixar, sim; remover, não.
- Não corrigir o caso D "apagando" a data informada: ela é dado do usuário. Mostrar o conflito.
- Não refatorar `app.jsx` além de trocar as leituras por chamadas ao radar. A extração ampla é outro item do `MELHORIAS.md`.
