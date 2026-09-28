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

## 🧭 Nexus Prumo (antes “Claude · Ardósia”) — protótipo (✅ 23/09), Fases 1 a 12 no app (✅ 26/09/2026)

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
- **Fase 7 (feita, 25/09/2026):** Briefing do Nexus Prumo reescrito como dossiê — `EditionClaudeBriefing` em `src/edition-claude.jsx`, substituindo o conteúdo da aba "Briefing" (`notas`) só quando `isClaude` (o Clássico e a Beta continuam com o painel antigo). Novidades do último import numa linha; Leitura da operação com uma entrada em destaque (mesma regra de `pickHighlightEntry`, de `src/lib/report.js`, reaproveitada); Frentes processuais em trilhas horizontais (IDPJ, MCF, Central e EF levada ao panorama), régua com fases registradas (cor do desfecho), eventos livres (`_custom`, violeta) e até 3 próximas fases típicas tracejadas como sugestão — aceitar registra a fase (mesma ação do "+ Fase"), "✕" dispensa e grava `processStageV2[execId][stageKey] = { _dismissed: true }` (novo helper `isDismissedOnlyStageRec`, usado em `getStageRecords`/`buildFrontRule`/`stageMeta` para que um registro só-dispensado não conte como fase em lugar nenhum); trabalho da fase com notas do processo e EFs cobertas; trilha "Sem incidente" discreta; Diário com `EditionClaudeBriefingDiary` (data na margem, filtro por tipo com contagem, editor inline), reaproveitando `RichNoteEditor`/`sanitizeNoteHtml`/`getBriefingEntries`/`BRIEFING_ENTRY_TYPES` e o mesmo `briefing.entries`; coluna de apoio fixa (Fontes, Lembretes, Checklists com barra de progresso, Próximas tarefas). `stageMeta`/`badgeFor`/`stageCompactMeta` viraram funções puras de topo, reaproveitadas pelo Clássico sem mudança visual. CSS em bloco próprio "Fase 7 · Briefing Prumo" (prefixo `cx-bf-`) em `src/Nexus.shell.html`. Correções de passagem no relatório (`src/lib/report.js`/`buildOperationReportData`): processos apensados (`parentExecutionId`) aninham com "↳" sob a EF-mãe dentro da frente certa (mesma classificação de `classifyProcGroups`) em vez de aparecer soltos em "Sem incidente"; etiquetas do cabeçalho deduplicadas (case-insensitive); Checklists em bloco próprio nos Anexos; e uma correção de causa raiz em `normalizeBriefingEntry` — entradas do formato antigo (`{title, body, updatedAt}`, sem `createdAt`) agora herdam `createdAt` de `updatedAt`, corrigindo a falta de data no Diário (app e relatório) e nos Anexos.
- **Fase 8 (feita, 25/09/2026):** Processos e prescrição no Nexus Prumo, sobre a maquete `#processos`.
  - **Passo 0:** régua do Briefing deduplica sugestões por rótulo e para de sugerir "Recurso" quando já há um nó de recurso registrado.
  - **8a — sinais e ficha lateral:** a coluna de sinais (`ProcRowSymbols`) deixou de ser escondida no Prumo — passou a receber `fixed` (7 casas sempre presentes, vazias quando ausentes, mesmos desenhos/cores/ordem da Beta), com CSS próprio (`.proc-row-sym-empty` etc.) no bloco Fase 8. `toggleHandled`/`markAsAguardando`, antes closures dentro do `ProcPrescCard`, viraram funções de topo (`toggleCdaHandled`, `markCdaAguardando`) usadas nos dois lugares. Nova ficha lateral `EditionClaudeProcDrawer` (padrão `cx-drawer`, como a gaveta de intimações): sinais manuais como botões liga/desliga (gravam com `upsert('executions', …)`), sinais calculados como atalhos (constrição → bens vinculados, tarefa/intimação → abrem o modal), fatos (juízo, executado, coberta por, apensos), abas Resumo · CDAs · Notas · Recursos; a aba CDAs ordena pela pior prescrição e reaproveita `computeCdaLegalTimeline` + `CdaPrescColumns` (mesmo conteúdo do card clássico, só leitura) com + Evento, ✓ Tratada, ⏳ Aguardando reconhecimento e Editar inscrição.
  - **8b — cartões para dezenas de processos:** novo `EditionClaudeProcessos`, que passa a renderizar a aba "Processos e prescrição" no Prumo (Clássico e Beta continuam com o renderizador de sempre), recebendo por props o `classified`/`prazosByDebt`/`openIntimsByProc`/`openTasksByProc` que o app já calcula (`processTabModel`). Mantém os cartões do clássico — Incidentes e execução de destaque, Execuções sem vínculo (por faixa + não ajuizadas), Recursos (agrupados por `othersByParent`), Embargos e Outros (fechados por padrão, aviso de prazo aberto) — e acrescenta: sumário fixo no topo com uma célula por cartão (clica e rola); barra de filtros pelos 7 sinais com contagem, combinando com busca e pessoa; barra de grupos no lugar do trilho (Todos + um botão por incidente/faixa); tabelas agrupadas com linha de subtotal, "Mostrar mais N" após 8 linhas por grupo e extintas ocultas por padrão; ordenação por valor, prescrição ou número; seleção de CDAs com barra de lote no pé (+ Evento em lote, Marcar tratadas, Aguardando reconhecimento, Reabrir, Limpar) e aviso de seleção multiprocesso; banner de duplicidade. CSS em bloco próprio "Fase 8 · Processos Prumo" (prefixo `cx-`, tokens `--cx-*`) em `src/Nexus.shell.html`. Validado com Playwright nas 5 operações demo e com um dataset sintético maior (52 execuções/68 CDAs injetadas via `localStorage`) sem erros de console; Clássico e Beta conferidos sem mudança. Desvio consciente da maquete: a ficha é uma gaveta sobreposta (padrão `cx-drawer` já usado no Prumo), não uma coluna inline ao lado da tabela — por isso não há uma versão "tabela + ficha lado a lado" com a coluna CDAs escondida, só a ocultação das colunas Sinais/CDAs quando a ficha está aberta.
  - **Fase 8 — revisão (25/09/2026):** correções apontadas na revisão dos screenshots. Cartão Incidentes: cada hub agora é uma linha de grupo própria (`HubGroupRow`) — tipo + nº + fase atual (`cxHubStageInfo`, mesma régua do `processStageV2` do Briefing) + "cobre N EFs/apensos", sinais do hub, situação, CDAs e valor somados (incluindo apensos aninhados e, no Central, a própria execução), pior prescrição —, recolhível, com as EFs cobertas por baixo quando aberta; o hub deixou de aparecer como uma EF solta ("Ativa · R$ 0,00") dentro do próprio grupo. Margem lateral/topo igual à do Briefing Prumo (`cx-page cx-page-wide`). Filtro de sinais: corrigido `.cx-sigf-btn span { display:none }`, que também escondia as bolinhas de tarefa/intimação (só o rótulo de texto usa `.cx-sigf-lbl` agora); tooltip/`aria-label` com o nome de cada sinal. Prescrição: nova `cxPrescDisplay`/`CxHorizonBar` — mesmo rótulo do clássico/Beta (`prazosRiskMetaForCdas`) e, quando há termo (CDAs não ajuizadas e grupos 1–4, com dias calculados), "N dias · dd/mm" e uma barra de horizonte (escala de 5 anos; vermelha nos grupos 1–2, laranja nos 3–4); sem termo, só o rótulo — usado em toda linha/subtotal/hub/ficha. Ficha lateral, aba CDAs: as três contagens (`CdaPrescColumns`, sem alterar o componente do Clássico) agora empilham verticalmente, a de maior gravidade primeiro — usa `tl.worst.key`, já calculado pelo motor de prescrição (`computeCdaLegalTimeline`), chamando `CdaPrescColumns` uma vez por segmento em vez de reordenar o componente original.
- **Fase 10 (feita, 25/09/2026):** Intimações por tribunal, só no Prumo (`src/edition-claude.jsx`, sobre a maquete `design/mockups/prumo-intimacoes-tribunais.html`). Linha "Por tribunal" sob o resumo do cabeçalho de Intimações (`CxTribBar`, nova `cxTribCounts`): um botão por UF/tribunal com o selo da sigla (mesmo `.cx-uf` das linhas da lista), o total e uma barrinha com a proporção de abertos — mesmos números dos cartões do Clássico/Beta (intimações ativas por `!intimIsClosed`, abertos = com `dateDeadline`, fechados = sem, ordenado por `jurisRank`); a contagem respeita o filtro de Operação, não a busca. Tooltip escuro no hover/foco (`.cx-tb-tip`, tokens `--cx-btn`/`--cx-shadow-lg`, mostrado por CSS em `:hover`/`:focus-visible`, sem depender do portal global de tooltips) com nome do tribunal (PR/RS/SC viram "TRF4 · <estado>"), abertos, fechados, total e "Clique para ver só XX"; `aria-label`/`aria-pressed` no botão. Clique filtra lista e Quadro por aquela UF (toggle, estado só em React) e o resumo passa a "N de M abertas · só XX"; grupos por UF (`cxGroupIntims`) ganham "· N abertos · M fechados" no cabeçalho. Tela Hoje: linha miúda "PR 21 · RS 12 · …" no cartão de intimações abertas (sem filtro de operação), cada sigla abre Intimações já filtrada (estado `cxIntimInitialUf` em `src/app.jsx`, consumido uma vez, mesmo padrão do `editRequestId`/`onEditConsumed` do Briefing). CSS em bloco próprio "Intimações por tribunal" (prefixo `cx-`) em `src/Nexus.shell.html`.
- **Fase 11 (feita, 25/09/2026):** Gaveta da intimação em blocos recolhíveis e Esteira da peça, só no Prumo, sobre as maquetes `design/mockups/prumo-gaveta-blocos.html` e `design/mockups/prumo-esteira-da-peca.html`.
  - **Gaveta em blocos:** `CxIntimDetail` (`src/edition-claude.jsx`) passou a renderizar seis blocos recolhíveis via novo `CxBlock` — Esteira da peça, Peças e links, Notas, Gramática (ou Atuação, se resolvida), Contexto do processo (só quando há CDA/execução/outra intimação) e Dados —, cada um com resumo de uma linha quando fechado e contagem à direita. Estado aberto/fechado por chave (`nexus_cx_drawer_blocks`, localStorage) vale para todas as intimações e persiste entre sessões; "Expandir tudo · Recolher tudo" fixo no topo da gaveta (`position: sticky`). Vale para a gaveta da lista, Quadro (que abre a mesma gaveta), Mesa e Foco, sem duplicar código. "Peças e links" (`cxPecasList`/`CxPecasBlock`) consolida `minutaUrl`, os links de cada etapa da esteira, documentos da mesma operação com o mesmo nº de processo ou ligados à intimação (`sourceIntimationId`), o link da atuação registrada e agora um campo aditivo `intim.links = [{label,url,addedAt}]` com "+ link" e remover.
  - **Esteira da peça — modelo de dados (aditivo):** `intim.esteira`/`task.esteira = { etapas: [{id,label,tool,url,status:'todo'|'doing'|'done',startedAt,doneAt,note}], updatedAt }`. Funções puras em `src/lib/esteira.js` (novo, concatenado pelo build como os demais `src/lib/*`; testado em `test/esteira.test.mjs`, 19 casos): `esteiraCreate`/`esteiraBegin` (copia o template para o registro e já inicia a 1ª etapa), `esteiraStartStep`/`esteiraCompleteStep` (a próxima etapa passa a "em andamento" automaticamente), `esteiraUndoStep` (desfaz sem nunca tocar na situação), `esteiraSetNote`/`esteiraSetLink`, `esteiraSummary`/`esteiraProgress`/`esteiraResumeInfo`/`esteiraGroupLabel` (leitura) e `esteiraStoppedLabel` ("hoje HH:MM" / "ontem" / "há N dias"). Grava sempre via `upsert('intimations'|'tasks', …)` — mesmo caminho que qualquer outro campo, então sincroniza com o Drive (JSON completo, sem merge por campo) e sobrevive ao merge do import do eproc (que começa de `{...existing}` e só toca datas/prazo).
  - **Template editável:** ⚙ → "Esteira da peça" (só no Prumo), `CxEsteiraTemplateEditor` sobre `appSettings.esteiraTemplate` — nome, ferramenta e link padrão por etapa, mover ↑↓, `+ Etapa`, remover. Padrão (`ESTEIRA_DEFAULT_TEMPLATE`): Anonimização (própria) · Extração do relatório e triagem (Gemini) · Redação fina (Claude) · Leitura e ajustes (Claude). Renomear/reordenar o template não afeta peças já iniciadas (a esteira é uma cópia).
  - **Interações na gaveta:** bolinha da etapa (a fazer → clicar inicia; feita = ✓ verde; em andamento = anel azul), nome + ferramenta (`cx-est-tool`, cores como na maquete), "onde parei" (textarea) e link por etapa salvos ao sair do campo (`onBlur`), "✓ Concluir" e "Desfazer". Ao começar a 1ª etapa, se a situação não for `peca_edicao`, sugestão discreta "Mudar situação para Peça em edição?"; ao concluir a última, "Marcar como Peça pronta?" (`peca_pronta`, que já existia em `INTIM_STATUSES` mas não tinha rótulo no Prumo — `CX_ST` ganhou a entrada `peca_pronta` só para exibição; não entrou em `CX_ST_ORDER`, então não vira coluna nova no Quadro). Nada muda de situação sozinho. Topo fixo da gaveta ganhou o bloco "Continuar de onde parou" (etapa N de M, há quanto tempo parou, frase de onde parei, "↗ Abrir …" quando há link, "✓ Concluir etapa").
  - **Onde mais aparece:** `CxEstLine` (barrinha de N casas + etapa atual + "parou …") na linha de notas de `CxIntimRow`, `CxTaskRow` e nos cartões da Mesa (`EditionClaudeMesa`) — nada quando não há esteira. Agrupar → "Etapa" em Intimações (`cxGroupIntims`): um grupo por etapa atual, "Esteira concluída" e "Sem esteira". Tela Hoje: cartão "Continuar de onde parou" (`cxContinueQueue`) com intimações e tarefas abertas com etapa em andamento, ordenadas por prazo e depois pela mais antiga parada; "Retomar" abre a gaveta ou o formulário da tarefa.
  - **Tarefas:** o formulário de tarefa (`EntityFormRouter`, `src/app.jsx`) ganhou a seção "Esteira da peça" (reaproveita `CxEsteiraSection`/`CxEsteiraBody`), mostrada **só quando `isClaude`**; grava no estado local do formulário (mesma lógica das Notas — só persiste ao Salvar), sem sugestão de situação (não existe para tarefas). Clássico e Beta não veem a seção e continuam idênticos.
  - CSS em bloco próprio "Gaveta em blocos e esteira da peça" (prefixo `cx-est-`/`cx-blk-`/`cx-pl-`/`cx-resume`/`cx-cont-`, tokens `--cx-*`) no bloco EDIÇÃO CLAUDE de `src/Nexus.shell.html`.
  - Validado com Playwright (fluxo completo: resetar dados demo → Prumo → começar esteira → concluir 2 etapas → nota e link na 3ª → recarregar e confirmar persistência da esteira e do arranjo dos blocos → barrinha na lista → Agrupar por Etapa → Hoje/Retomar → editar template e confirmar que a peça já iniciada manteve as etapas → sugestões de situação → tarefa com esteira) sem erros de console; Clássico e Beta conferidos sem mudança de comportamento.
- **Fase 12 (feita, 26/09/2026):** Inscrições, Partes e Bens no Nexus Prumo, sobre a maquete `design/mockups/prumo-abas-operacao.html` — mesmo padrão da Fase 8 (números da aba, barra de ferramentas, tabela agrupada com subtotal e "Mostrar mais", ficha lateral, lote no pé), reaproveitando as classes/CSS `cx-pp-*`/`cx-pt-*`/`cx-drawer cx-pd` já existentes (só pequenos acréscimos em `src/Nexus.shell.html`: `.cx-pt-clickable`, `.cx-pp-grpacts`, `.cx-pp-sum-cell.on`, `.cx-pd-kind.pf/.pj`). Em `renderTab()` de `src/app.jsx`, as abas `'dividas'`, `'pessoas'` e `'bens'` passam a devolver os componentes novos logo no início quando `isClaude`, antes do conteúdo clássico — Clássico e Beta continuam com o renderizador de sempre, sem nenhuma mudança.
  - **Inscrições (`EditionClaudeInscricoes`):** mesmo filtro por pessoa (`cdaPersonFilter`, considerando todos os papéis de `cdaResponsibilities`) e busca (`procCdaQuery`) do clássico; `cdaSort` agora exposto como dois seletores — Agrupar (Processo/Situação/Devedor/Tributo/Ajuizada) e Ordenar (Valor ↓/↑/Prescrição) — escrevendo no mesmo estado. O agrupamento "Processo" reaproveita fielmente o algoritmo do clássico (`cxCdaGroupsByProcess`, novo helper puro, mesma regra de guarda-chuva IDPJ/Cautelar/Central/EF-raiz + subgrupos por execução vinculada, extraída para reuso sem tocar no clássico): condutor sem recuo, EF apensada recuada (ou combinada numa linha só quando é o único vínculo), CDAs recuadas, grupo "Não ajuizadas" ao final; cabeçalho do grupo com "📋 Presc." (memória técnica do processo) e "✎ Proc" (editar execução), checkbox seleciona o grupo inteiro. Números (Total ativo, Ajuizadas, Não ajuizadas, No alarme, Tratadas/aguardando), coluna Prescrição reaproveitando `cxPrescDisplay`/`CxHorizonBar`/badge tratada·aguardando da Fase 8. Clique na linha abre a `EditionClaudeCdaDrawer` já existente, que ganhou um rodapé "Memória técnica" (copiar) + botão baixar HTML — mesmo texto/arquivo que `CdaLegalDetail` gera no clássico (`cxCdaMemoriaText`/`cxCopyCdaMemoria`/`cxDownloadCdaMemoria`, também usados pelo cabeçalho de grupo e pelo lote). Lote no pé: Memória de prescrição (mesma lógica de agrupar por processo do clássico), Excluir, Limpar.
  - **Partes (`EditionClaudePartes`, dentro da aba única "Partes e bens", seletor já existente em `EditionClaudeOpHeader`):** mesmo cálculo de exposição por pessoa do clássico (`cxPersonStats` — CDAs originária vs. corresponsável por papel, valor exposto, bens pelo CPF/CNPJ do titular, risco de prescrição via `cxPrescDisplay`/`prazosByDebt` no lugar do `isPrazosRisco` do app), card de aviso quando as exposições somadas > crédito único da operação. Números (Crédito da operação, Alvos, Relacionadas, Patrimônio identificado), busca por nome/CPF-CNPJ, filtro Tipo PF/PJ, tabela em dois grupos (Alvos diretos, Pessoas relacionadas). Clique na linha abre a nova `EditionClaudePersonDrawer` (Responde por — originária/corresponsável por papel, CDAs clicáveis abrindo a `EditionClaudeCdaDrawer` por cima —, Patrimônio identificado, Notas; rodapé Copiar qualificação/`buildPersonQualification` e ✎ Editar).
  - **Bens (`EditionClaudeBens`):** mesmo agrupamento do clássico (situação/titular/processo/tipo), `assetSort` exposto como Agrupar + Ordenar (valor ↓/↑) do mesmo jeito que Inscrições. Números Total, Indisponibilidade ativa, Requerida, Sem Analytics — clicáveis, filtram a lista (alternam ao clicar de novo). Sisbajud com o valor em destaque (mesma regra `isSisbajudAsset`/`assetIdentifier`). Clique na linha abre a nova `EditionClaudeAssetDrawer` (descrição, identificação, titular com atalho para editar a pessoa, processo com atalho para editar a execução, origem, Analytics, notas; ✎ Editar). Lote no pé: Alterar situação, ✓/✗ Analytics, Excluir, Limpar — mesmas `bulkUpdateAssets`/`bulkDelete` do app.
  - Achado de passagem (não mexido, é do clássico): `myAssets` em `peopleStats`/`cxPersonStats` filtra bens por `a.titularCpfCnpj === p.cpfCnpj`, campo que não aparece em nenhum outro lugar do código/parsers — "Patrimônio identificado" por pessoa fica sempre em 0/vazio, no Clássico e no Prumo igualmente, porque os bens só têm `holderId`/`holderDoc`. Sugerido como tarefa separada.
  - Validado com Playwright nas 5 operações demo (agrupamentos, ordenações, filtro por pessoa, busca, fichas de CDA/pessoa/bem, lote — memória copiada, excluir com confirm + desfazer, alterar status/Analytics de bem —, + novo, atalho pessoa→CDA) sem erros de console; Clássico e Beta conferidos sem mudança nessas abas.
  - No mesmo lote: pequenos ajustes soltos pedidos durante a fase — Briefing (botão "Editar fase" virou ícone no canto do cartão "Texto do evento"; cabeçalhos dos três cartões da frente processual mais compactos; frentes processuais recolhidas por padrão, mostrando a fase atual na linha fechada); painel ⚙ (seletor de edição e de fonte em uma linha cada; "Nova versão (beta)" renomeada para "Beta"; texto de ajuda da fonte removido; "Esteira da peça" virou um botão que abre o editor numa janela própria); cor da operação sem as 3 amostras sem significado (Violeta/Ciano/Laranja); ícone da peça nas Intimações numa coluna própria de 24px entre Operação e Imp. (mesma posição com ou sem ícone); botão "Nova intimação" branco; divisória "Outras execuções" da Linha do tempo com o mesmo estilo de "Marcos da operação"; e uma gaveta nova a partir do cabeçalho da operação (clique em "N intimações abertas") listando as intimações abertas em cards resumidos.
- **Fase 13 (feita, 26/09/2026):** Tarefas, Arquivos e Importar no Nexus Prumo, sobre a mesma maquete `design/mockups/prumo-abas-operacao.html` (seções Tarefas/Arquivos/Importar) — fecha o redesign das abas da operação começado na Fase 8 e continuado na Fase 12. Em `renderTab()` de `src/app.jsx`, as abas `'tarefas'`, `'docs'` e `'importar'` passam a devolver os componentes novos logo no início quando `isClaude`; Clássico e Beta continuam com o renderizador de sempre, sem nenhuma mudança.
  - **Tarefas (`EditionClaudeOpTarefas`):** em vez de recriar a tabela, reaproveita os mesmos componentes da tela Tarefas do Prumo — `CxTaskRow` (esteira da peça via `CxEstLine`, prioridade, "interna"/🌐 global, nota, documento, Mesa) e `cxGroupTasks` (Agrupar: Prazo — vencidas/hoje/próximos 7 dias/mais adiante/sem data — ou Prioridade) —, só que filtrados nesta operação; por cima, a linha de números (Abertas, Vencidas, Hoje/semana, Concluídas) e a criação rápida (`cx-quick`, mesmo campo da tela Tarefas: título + data opcional + Enter) que já grava como tarefa interna desta operação (`onCreate`, `handleSave`), com o formulário completo continuando em "+ Tarefa completa". Segmento Abertas/Concluídas, busca por título/descrição/processo/nota, conclusão pelo círculo (mesmo `upsert`/`cxNotify` da tela Tarefas), edição pelo clique na linha (mesmo modal do app).
  - **Arquivos (`EditionClaudeArquivos`):** mesmos dados da aba clássica "docs" (`title`/`url`, `type`/`docType`, `processNumber`/`processRef`, `actionDate`, origem — `sourceIntimationId` = "📬 intimação" vs. "incluído" —, `notesList`), em tabela agrupada por Tipo (padrão) ou Processo (`cxDocGroupKey`/`cxDocGroupLabel`, novos helpers puros), com números (Total, De intimações, Incluídos), busca por título/processo, segmentado Todos/De intimações/Incluídos e "+ Documento" (mesmo modal de sempre). Clique na linha abre a nova `EditionClaudeDocDrawer` (mesmo padrão `cx-drawer`/`CxBlock` das demais fichas): processo, origem, data (atuação ou criação do registro, como no clássico), bloco "Origem: intimação" com o evento/prazo e atalho "Ver intimação" (abre a gaveta da intimação por cima) quando o documento veio de uma, notas; rodapé "Abrir ↗" (link) + "✎ Editar" (mesmo modal, que já tem Excluir).
  - **Importar (`EditionClaudeImportar`):** os mesmos três modos e handlers de sempre (Planilhas — XLS Procuradoria + eproc —, PDFs SIDA/Debcad, Texto — Pessoas/Bens em lote/Prescrição, incluindo a prévia obrigatória antes de gravar formato NEXUS), sem tocar em nenhum parser/handler, só reorganizados em duas colunas: à esquerda o que fazer (segmentado de modo, zona de soltar arquivo, resultado da última importação logo abaixo, não mais no fim da página); à direita o estado ("Atualização por fonte" com a cor por idade — verde/amarelo/vermelho — e "Limpar histórico", e "Histórico SIDA/Debcad"). Reaproveita os mesmos refs de input (`xlsInputRef`/`pgfnPdfInputRef`, montados aqui; `eprocInputRef` já existe global) e estados (`importMode`, `textoImportKind`, `aiText`, `assetText`, `prescImport`, `importResult`, `collapsedGroups`/`import-assets-mode`) do app — nenhum dado ou fluxo de importação muda.
  - Sem CSS novo compartilhado com Processos/Inscrições/Partes/Bens além do já existente (`cx-pp-*`/`cx-pt-*`/`cx-drawer cx-pd`); acréscimo próprio em `src/Nexus.shell.html` só para Importar (`cx-imp-*`, `cx-drop`, `cx-log`, `cx-srcr`), com o mesmo vocabulário visual (`--cx-*`, `cx-card`, `cx-seg`, `cx-btn`).
  - Validado com Playwright nas 5 operações demo (KPI, quick-add, toggle concluir/reabrir, Agrupar Prazo/Prioridade, segmento Abertas/Concluídas, + Tarefa completa e edição pelo clique; Arquivos: busca, origem, Agrupar Tipo/Processo, ficha do documento, + Documento; Importar: os três modos, os três sub-modos de Texto incl. prévia de prescrição, drop zones) sem erros de console; Clássico e Beta conferidos sem mudança. O dataset demo não tem nenhum documento com `sourceIntimationId` nem `importLogs`/`importHistory` preenchidos para a operação testada — "Ver intimação" e a lista "Atualização por fonte" não puderam ser vistos com dado real (mesma limitação valeria para o Clássico, que usa a mesma origem de dados); a lógica foi conferida por leitura de código (idêntica à do Clássico).
- **Vínculo entre processos — árvore com curva de derivação (26/09/2026):** opção A de `design/mockups/prumo-vinculo-processos.html`, aplicada em Processos e prescrição (`EditionClaudeProcessos`/`ProcRow`: EF abrangida por um hub e apenso de uma abrangida) e Inscrições (`EditionClaudeInscricoes`/`SubGroupBlock`: execução vinculada sob o guarda-chuva e CDA dela), no lugar do simples recuo (`nest1`/`nest2`) de antes. Novo `CxTreeMark`/`cxTreeRowClass` (topo de `src/edition-claude.jsx`): uma curva (`::` não, elementos `<span>` posicionados — `.cx-tree-elbow`/`.cx-tree-trunk`/`.cx-tree-anc`, CSS em `src/Nexus.shell.html`) desce do condutor até cada linha abrangida; a última do nível termina só na curva, as anteriores seguem retas até a próxima; o segundo nível (apenso, ou CDA de uma execução vinculada) ganha sua própria curva com a linha do primeiro nível passando reto por trás quando o abrangido-pai ainda tem irmãos depois. Fundo levemente tingido (`color-mix` sobre `--cx-accent`) nas linhas abrangidas; a linha do condutor nunca recua. Só apresentação, em cima de `coveredByHub`/`apensosByParent`/`cxCdaGroupsByProcess` — nada mudou na classificação. Clássico e Beta não usam essas classes, sem mudança.
- Maquete: `design/mockups/prumo-briefing-processos-relatorio.html` (seções `#briefing`, `#processos`), `design/mockups/prumo-abas-operacao.html` (Inscrições, Partes, Bens, Tarefas, Arquivos, Importar), `design/mockups/prumo-vinculo-processos.html` (vínculo entre processos). Para depois: histórico além dos 500 registros do `changeLog`; Mesa de prazos; bug de `titularCpfCnpj` no patrimônio por pessoa.
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
