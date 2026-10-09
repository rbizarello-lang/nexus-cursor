# Situação — Registro de trabalho e Base do relatório

Trabalho da noite de 08 para 09/10/2026. Referência: `docs/PLANO-REGISTRO-RELATORIO.md`.

**Nada foi publicado.** Sem `clasp push`, sem envio ao GitHub. Tudo está em commits locais.

- Branch `claude/etapa1-ajustes-base`: etapa 1.
- Branch `claude/etapa2-registro-viabilidade`: etapa 2 (inclui a 1).
- Branch `claude/etapa3-5-registro-relatorio`: etapas 3 a 5 e as correções da revisão (inclui tudo). **É o branch a usar.**

Todos partem de `cursor/prumo-ajustes-3.1.5`, que ainda não está no `master` (contém o salvamento compactado da 3.2.10).

Testes: 800 de 802 passam. As 2 falhas (`test/esteira.test.mjs`, "hoje HH:MM") já existiam e dependem do fuso horário da máquina.

---

## O que ficou pronto

| Etapa | Entrega |
|---|---|
| 1. Ajustes de base | Prestação de contas corrigida (prescrição, contagem dupla, bem já indisponível); histórico legível e com selo de importação; `NEXUS_Log` guardando as últimas 500 linhas. |
| 2. Viabilidade | Biblioteca de detecção de mudanças. Num banco fictício de 36 MB: 1–4 ms por edição comum (meta 30 ms). |
| 3. Registro de trabalho | Servidor (pasta `Trilha/` no Drive, um arquivo por dia); captura no app com origem (manual, importação, automático, desfazer, restauração); fila local que sobrevive a recarregar; tela **Minha atividade** no Prumo (menu Trabalho), com filtros, antes/depois, texto completo com diferenças, restauração e exportação; cartão Atividade do Hoje com "ver tudo". |
| 4. Formulários | Teor da decisão na intimação (gaveta e modal; mesclado com a descrição da ciência; aparece na Linha do tempo); Data da constrição no bem ("Indisponível desde…"); botão **No relatório** no diário. |
| 5. Base do relatório | 4º modelo na janela Relatório: Google Doc com as 6 seções + planilha (Cronologia e Constrições); prévia ao lado; baixar HTML/CSV quando fora do app publicado. |
| Revisão final | Uma revisão independente achou 15 pontos (nenhum apagava dados do app). 14 corrigidos; 1 registrado como limitação (abaixo). |

---

## Ao publicar (`npm run push`)

1. **O Google vai pedir nova autorização** na primeira vez, porque o app passa a criar Docs e planilhas. É esperado: aceite.
2. Defina o **apelido da máquina** em ⚙ (grupo Dados/Sync), ex.: "nb-trabalho". Ele aparece em cada registro.
3. O registro começa a valer a partir daí. Não há histórico anterior (a reconstituição retroativa era a F3 do plano original e ficou fora).

## Como validar (passo a passo)

**Registro de trabalho**
1. Mude a situação de uma CDA, escreva uma entrada no diário e conclua uma tarefa.
2. Abra **Minha atividade**: os três itens aparecem, com hora, operação e processo.
3. Expanda a entrada do diário e edite-a de novo: o antes/depois mostra o texto completo com as diferenças.
4. Exclua um bem de teste e use **Recuperar item**: o bem volta, e surge uma linha "Restauração".
5. Faça uma importação (SIDA ou eproc): ela aparece como **uma** linha resumida.
6. Em outra máquina, abra Minha atividade: os itens da primeira aparecem (após até 1 min do envio).
7. No Drive, a pasta do Nexus ganha a subpasta `Trilha/` com `nexus_trilha_AAAA-MM-DD.ndjson`.

**Base do relatório**
1. Numa operação, **Relatório → Base do relatório**.
2. Desmarque uma frente e mude o período: a prévia acompanha.
3. **Gerar os dois**: o Doc e a planilha abrem em abas novas e ficam em `Relatórios/` na pasta do Nexus.
4. Confira no Doc: 6 seções como Título 2, tabelas, números de processo em fonte monoespaçada.

**Formulários**
1. Na gaveta de uma intimação, **Adicionar teor da decisão…**; depois registre a ciência: a descrição vem preenchida.
2. Num bem, mude a situação para indisponibilidade ativa: aparece "Data da constrição".
3. No diário, nova entrada do tipo Decisão judicial: o botão **No relatório** já vem ligado.

---

## Decisões que tomei sozinho (revise e reverta o que não quiser)

1. **Audiências e acompanhamentos** ganharam tipos próprios no registro ("audiência", "acompanhamento"), em vez de "atuação" e "frente".
2. **"Desfazer criação"** aparece também em eventos de criação (o plano só pedia campo, item apagado e importação).
3. **Teor na Linha do tempo**: intimação com teor aparece como item da categoria "Decisões" na data da intimação; não cria fase.
4. **Base do relatório**:
   - fatos sem processo (diário, bens sem processo) vão para uma frente **"Geral da operação"**, sempre incluída;
   - intimação com teor gera dois registros na cronologia: "Intimação" e "Decisão";
   - eventos de prescrição e lembretes **não** entram na cronologia (o plano não os listava);
   - bem em constrição sem nenhuma data aparece como "sem data" no quadro de constrições;
   - o Doc corta tabelas acima de 1.500 linhas (a lista completa fica na planilha).
5. **Corrigi um defeito antigo** no diário: "Nova entrada" gravava o tipo como "click"; agora vem "observação".

## Limitações conhecidas

- **Edição manual durante uma importação**: se você editar algo enquanto um arquivo de importação ainda está sendo lido, a edição entra no lote da importação, e "Desfazer importação inteira" a desfaria junto. É raro; corrigir exigiria redesenhar a marcação de origem.
- **Não testado de ponta a ponta**: envio ao Drive, leitura entre máquinas, criação real do Doc e da planilha. Tudo isso depende do app publicado. A lógica foi testada, mas os serviços do Google não.
- **Importação expandida e "Desfazer importação inteira"** foram testados só com eventos simulados, não com SIDA/eproc reais.
- O `changeLog` antigo (500 registros) continua sendo gravado em paralelo, como previsto no plano.

## Dados de teste na Demo

Os agentes deixaram alguns itens de teste na Demo (ex.: bem "99.999", entrada "Decisão teste de relatório"). Use ⚙ → **Resetar dados demo**.
