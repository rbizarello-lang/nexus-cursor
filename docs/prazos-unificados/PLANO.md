# Prazos extintivos unificados — plano e decisões

Ponto de partida para continuar em outra conta, sessão ou no Cursor. Leia este arquivo primeiro. Atualizado em 09/10/2026.

## Objetivo
Unificar a apresentação dos prazos extintivos (Mesa, Lista, Painel, Hoje, relógios) numa tela só, com uma base de números única, **sem mudar regras do motor** (`src/lib/prescription.js`, `prazos-mesa.js`). Detalhes do pedido: `00-brief.md`.

## Escolha: Proposta 2 "Fila de trabalho", versão 2
Mockup: `design/mockups/prazos-unificados/proposta-2-v2.html` (usa `base.css` e `dados.js` da mesma pasta). Página comparativa com as três propostas e a v2: `design/mockups/prazos-unificados/index.html` (publicada como artefato; abre na aba "Versão 2 · escolhida").

## Decisões do usuário (valem como especificação)
1. **Consumadas há pouco** (até 6 meses) abrem a lista: primeiro cartão, "Conferir o cálculo" (junto com divergências da análise importada).
2. **Cedo é o critério de urgência.** Item com cedo vencida e tarde no futuro é posicionado pela **data tarde**, com chip "cedo venceu, tarde não". Sem data tarde, vai ao fim da seção. Nunca destacar "há 20 anos".
3. **Ajuizar:** aviso para ordinária não ajuizada a **60 dias** (cinza: quantas vêm entre 60 e 180).
4. **Constrições antigas** viram conferência sem pressa: penhora/constrição na execução há mais de **4 anos** sem outro fato; IDPJ chegando aos 5 anos; "não antes de" passada há mais de 2 anos sem fato. Constrição é dado informado pelo usuário e confiável: não é alarme. Os ~288 "correndo com cadastro pendente" vão para "Completar dado".
5. **Aguardando reconhecimento:** sem avisos novos; fica só em "Tratadas". Adiamento vencido não é cartão: o item volta ao cartão da sua ação com chip "adiada até … (venceu)".
6. Topo: **grade de cartões**, sem "Comece por", sem cartão "Base", sem rótulos "Pedem você / Não pedem". Fileira 1 (ação): Conferir o cálculo · Ajuizar · Lançar fato ou ciência · Confirmar vigência · Completar dado. Fileira 2 (discreta): Conferir sem pressa · Só vigiar · Adiadas · Tratadas · Consumadas antigas. Tooltip com o critério em cada cartão.
7. **Três campos:** Operação · Filtros (painel único: natureza, cedo venceu/tarde não, só abrangidas IDPJ/cautelar, valor a partir de R$ livre, juntar por processo) · Busca. Filtros ativos como chips com ×.
8. **Decadência** fica numa seção no fim, só consulta e edição, sem contador de alarme.
9. **E-mail diário retomado pelos cartões** (versão 3.5.1). Destino único: `doutorjivago@mail.grokbot.com`, às 7h (`CONFIG.EMAIL` em `RESUMO-DIARIO.js`; se estava desligado, rodar `instalarResumoDiario`). Formato compacto (tabelas densas, uma linha por item, cor só no alerta; no celular as linhas viram texto corrido). Ordem: **Intimações em aberto** (todas as sem `responseAction`, em grupos Vencidas · Hoje e amanhã · Até 7 dias · 8 a 30 dias · Mais de 30 dias · Sem prazo, com prazo, processo · classe, parte, evento, situação, prioridade, urgente, operação e última nota; «analisado» vencido sai; linha «Respondidas nas últimas 24 h: N») · Audiências · **Prescrição — a agir (cartões)** · Tarefas urgentes e de prioridade alta (urgentes + `alta` com prazo em até 7 dias) · Na mesa de trabalho (no fim). Prescrição = os cinco cartões da fileira 1, um bloco por cartão (nº de CDAs, valor, até 10 CDAs na ordem da Mesa, «+N CDAs no app»); Ajuizar só até 60 dias, com a linha cinza «+N entre 60 e 180 dias»; nunca fileira 2, consumadas antigas nem decadência. A política v1 («Prescrição se aproximando», `prescriptionSnapshot`) saiu do e-mail. Como o Apps Script não roda o bundle, o app grava `debt.mesaCard` (`mesaEmailSnapshot`, `attachMesaEmailCards` em `src/lib/prazos-mesa.js`) e `data.mesaCardsAt` no salvamento na nuvem; sem eles o e-mail pede para abrir o NEXUS 3.5 e sincronizar. Assunto: `NEXUS · dd/mm · N prazo(s) vencido(s) · M a agir na prescrição` (partes zeradas omitidas; sem nada a agir e `ENVIAR_SE_VAZIO=false`, não envia).
10. Premissas gerais: decadência nunca alarma; ordinária só "ajuizar"; consumada antiga fica só em "Consumadas"; nem todo aviso tem ação; editar no lugar; um único conjunto de números, sem dupla contagem.
11. **Contagem por CDA**, individualmente; o painel permite tratar em bloco e "Juntar por processo" para análise conjunta. CDA sem dados de cálculo vai a "Completar dado". IDPJ "chegando aos 5 anos" usa a janela do motor (90 dias antes, `idpjNotice.active`).
12. **Clássico e Beta** recebem a mesma Mesa em cartões (a "Lista" com G1–G7 continua no seletor Mesa/Lista).
13. **Números fora da Mesa pelos cartões**: badge do menu = soma da fileira 1 (Conferir o cálculo + Ajuizar até 60 d + Lançar fato + Confirmar vigência + Completar dado); Hoje e Painel mostram os mesmos cartões; a Lista mantém G1–G7 como coluna técnica.
14. **Ajuizar** grava nº do processo + data do ajuizamento (vara opcional) nas CDAs (também em lote), cria a execução se não existir ou só vincula se existir com o mesmo número.
15. **Desfazer**: faixa verde "Feito — foi para «X»" com Desfazer após cada ação na Mesa, até dispensar ou sair da tela. Formulários abrem na própria linha; a ficha completa continua em "Abrir".
16. **Decadência** fica como seção no fim da Mesa (confirmado em 10/10/2026; não vira opção do filtro Natureza).
17. **Tela única (fase 4):** "Prazos extintivos" passa a ter uma só tela, a dos cartões. Fusão com os Relógios: a linha da CDA na Mesa ganha a régua do relógio (menor e discreta) e a página ganha o "Calendário dos termos", recolhível, que filtra a lista ao clicar. O modo "Relógios" sai do seletor da página (segue na aba Inscrições e na Linha do tempo). A "Lista completa" vira "Tabela" dos mesmos itens, com o cartão como coluna; G1–G7 saem da tela.
18. **Rótulos restantes pelos cartões:** "no alarme" em Processos, "urgente" da Agenda e relatório de passagem.

## Achados do levantamento que guiam a construção
- Hoje: Mesa "332 = 101 (Urgentes) + 202 (A completar) + 29 (Acompanhamento)"; "Consumadas 181 × 194" porque 13 consumadas recentes contam duas vezes; linhas "há 20 anos" são G1 de tese (cedo venceu, tarde futura), não consumadas. Ver `01-superficies.md`.
- O motor não precisa mudar. O que a tela deve derivar está em `02-motor-vocabulario.md` (seções 3 a 5) e `03-verificacao.md` (seções 1, 2, 4 e 8).
- Ordinária com mais de 90 dias não tem linha no motor: a tela precisa chamar `computePrescription`/`computeOrdinaria` para o aviso de 60 dias.
- Penhora antiga hoje é grupo 7 com corte de 6 anos (`PENHORA_ANTIGA_ANOS`); a decisão é 4 anos na exibição.
- Funções novas: **Ajuizar** (gravar processNumber e criar/vincular execução) e **Desfazer**: esforço médio. O resto reaproveita `applyMesaAction`, `confirmPauseStillValid`, `markPenhoraAnalisada`, modal de evento com `initial`, eventos em lote (`batchCdaIds`), `togglePrescCheck`.

## Plano de construção (uma fase por vez; build + validação entre fases)
1. **Cartões e critério único** na Mesa (Prumo; depois clássico e Beta): contadores a partir de uma função só, com cada CDA numa única caixa; ordem pela regra 2; consumadas antigas separadas.
2. **Painel de Filtros** (operação, filtros, busca, chips).
3. **Edição no lugar** (gaveta/inline) e **Desfazer**; depois **Ajuizar**.
Regras do repositório (`AGENTS.md`): `npm run build` após mudar `src/`; commitar os HTML gerados; não refatorar parsers/prescrição de passagem; as três edições devem seguir compatíveis; testes: `npm test`.

## Andamento
- Fase 1 (Prumo): feita — `buildMesaCards` em `src/lib/prazos-mesa.js` (testes em `test/prazos-mesa.test.mjs`) e Mesa do Prumo em cartões (`EditionClaudePrazos`).
- Fase 2 (Painel de Filtros): feita nas três Mesas — `filterMesaItems`/`filterMesaCards` em `src/lib/prazos-mesa.js`; campos `nat`, `cedoTarde`, `idpj`, `minVal`, `juntar` em `prazosFilters`. Decisão 13 completada: contadores por operação/pessoa (ponto da barra lateral, "Presc. CDA", ⏱, Carteira, Partes, Inscrições, Visão geral) contam `mesaIsAction` (fileira 1).
- Fase 3 (edição no lugar, lote, Desfazer, Ajuizar): feita nas três Mesas. Funções puras em `src/lib/prazos-mesa.js` (`mesaPrimaryAction`, `captureUndo`/`applyUndo`, `mesaPlanAjuizar`, `mesaDestText`, `mesaBatchCan`…); componentes compartilhados `MesaForm`, `MesaActs`, `MesaFeitoStrip`, `MesaBatchBar` em `src/app.jsx` (classes `mzf-*`, variáveis por edição); gravações do app em `mesaDo*` (usam `upsert`/`handleSave`). Pendência da fase 1 fechada: análise de penhora vigente cai com fato datado posterior.
- E-mail diário (3.5.1): `RESUMO-DIARIO.js` pelos cartões (testes em `test/resumo-diario.test.mjs`; snapshot em `test/prazos-mesa.test.mjs`).
- Validação (Playwright, demo + CDAs sintéticas, 1280 e 390 px, três edições): 366 conferências sem falha — cada ação com faixa Feito e Desfazer devolvendo ao cartão de origem; Ajuizar individual e em lote (cria uma execução ou só vincula a existente; Desfazer remove só a criada); eventos em lote com `batchCdaIds`; sem rolagem horizontal; sem erros de console.
- Decisão 8 (fechamento): seção «Decadência» recolhida no fim das três Mesas (`mesaDecadenciaItems` em `src/lib/prazos-mesa.js`; componente `MesaDecadencia`), só consulta e edição (Editar abre a ficha no campo de constituição ou do período de apuração), sem cartão, sem número e fora de todo total. Selo «Decad.» neutro (cinza) na lista de CDAs do clássico e do Prumo; na gaveta do Prumo as colunas seguem a ordem da Mesa (intercorrente se ajuizada, senão ordinária; decadência por último). O `worst` do motor não mudou.

## Pendências e próximos passos
- Conferir com a carteira real os cartões que a demo não exercita bem (Conferir sem pressa, Lançar fato, Confirmar vigência).
- Rótulos por linha que ainda seguem os grupos do motor: "no alarme" nas telas de Processos do Prumo, contador por intimação, "urgente" da Agenda (`agenda.js`).
- E-mail diário (decisão 9): retomado na 3.5.1 pelos cartões; depois do `push`, sincronizar o app uma vez para gravar `mesaCard`. Conferir o primeiro e-mail real contra a Mesa.

## Arquivos
- `00-brief.md` pedido, premissas e regras comuns · `01-superficies.md` inventário das telas atuais · `02-motor-vocabulario.md` o que o motor devolve · `03-verificacao.md` parecer do revisor, comparativo e correções.
- Mockups em `design/mockups/prazos-unificados/` (README.md explica o kit).

## Publicação do app (lembrete)
Versão 3.5.1 fixada no `package.json`: publicar com `npm run push:release` (não soma versão). O `npm run push` soma 1 (3.5.2).
`git stash` · `git checkout master` · `git pull origin master` · `npm run push`. O `push` agora cancela sozinho se a cópia estiver desatualizada.

## Prompt para iniciar em outra sessão ou no Cursor
"Leia docs/prazos-unificados/PLANO.md e siga-o. Construa a fase 1 (cartões e critério único na Mesa), sem alterar regras do motor, respeitando AGENTS.md. Antes de codar, proponha em poucas linhas como derivar cada cartão dos campos do motor."
