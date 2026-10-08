# Plano — Registro de trabalho e Base do relatório

Fechado em 08/10/2026, depois de conversa com o usuário. Mockups aprovados em `design/mockups/`:

- `prumo-minha-atividade.html` (Produto 1)
- `prumo-base-relatorio.html` (Produto 2)
- `prumo-ajustes-formularios.html` (ajustes de formulário)

Os mockups são a referência de layout. O que estiver neste documento prevalece sobre o mockup quando os dois divergirem (ex.: filtro de tipo em menu, sem aba de CDAs).

---

## 1. Objetivo

Dois produtos distintos, com finalidades diferentes:

| | Produto 1 — Registro de trabalho | Produto 2 — Base do relatório |
|---|---|---|
| Pergunta | "O que eu fiz, e quando?" | "O que aconteceu na operação, e quando?" |
| Data que importa | Data da alteração no app | Data do fato (protocolo, decisão, constrição) |
| Leitor | Só o usuário | Chefia/coordenação (via relatório redigido pelo usuário) |
| Fonte | Nova trilha de alterações | Dados que o app já guarda, datados |

O app **não redige** o relatório. Entrega a base factual e cronológica precisa; o texto final é escrito pelo usuário no Google Docs, somando outras fontes.

---

## 2. Produto 1 — "Minha atividade"

**Finalidade:** lembrar/conferir o que foi feito e servir de rede de segurança (ver antes/depois e restaurar).

**Conteúdo**
- Registra **toda** alteração nos dados, com antes e depois. Textos (diário, notas, descrição, resumo/texto de peça, lembretes) guardados **integralmente** em cada versão.
- Exclusões guardam o item completo e o que saiu junto na cascata.
- Sem campo de autor. Origem explícita: manual, importação, automático, desfazer, restauração, sistema (e futuramente bot).
- Carregar da nuvem, restaurar backup e resetar demo **não** geram diferenças; no máximo um evento de sistema.

**Tela** (item "Minha atividade" no menu lateral do Prumo, seção Trabalho)
- Lista **única** e corrida, mais recente primeiro, com separadores leves de dia. Não agrupa por operação.
- Cada linha em **duas linhas de texto**: frase em cima; operação, número do processo (máscara CNJ + copiar) e origem embaixo.
- Filtros fixos no topo: período (Hoje · Semana · Mês · Período, com ‹ ›), operação, **tipo em menu "Tipo ▾" com caixas de marcar**, busca (processo com ou sem máscara, CDA, texto — inclusive dentro dos textos completos).
- Por padrão mostra o relevante; chave "mostrar também ajustes menores".
- Faixa de números do período (atuações, CDAs alteradas, diário, tarefas concluídas, itens excluídos), **clicável** para filtrar a lista.
- Importações aparecem como **uma linha resumida** ("SIDA: 63 CDAs comparadas, 7 alteradas, 1 nova"), expansível com o detalhe.
- Linha expandida: tabela campo/antes/depois; texto completo antes e depois com diferenças destacadas; "Ligado a"; "Abrir no Nexus".
- Cartão "Atividade" do Hoje: 5 linhas e link "ver tudo".

**Restaurar**
- Uma alteração (por campo ou a alteração inteira).
- Um item apagado, com a cascata ("processo + 3 CDAs + 2 notas").
- **Uma importação inteira**, com confirmação listando o que será revertido.
- Toda restauração vira nova linha no registro (origem "restauração").
- Fora do escopo: voltar a operação inteira para uma data.

**Exportação:** sob demanda, planilha ou Google Doc do período filtrado. Sem e-mail.

**Retenção:** para sempre.

---

## 3. Produto 2 — "Base do relatório"

4º modelo na janela "Relatório" já existente. Por operação; período padrão do início da operação até hoje; frentes selecionáveis. Usado ao encerrar a operação ou sob demanda. Valores e nomes completos.

**Saídas:** Google Doc (no Drive, pasta da operação/Relatórios) **e** planilha da cronologia. Botões "Gerar Google Doc", "Gerar planilha", "Gerar os dois".

**Doc — seções numeradas fixas (Título 2)**
1. Visão geral da operação — identificação, devedores principais, tabela de processos, **CDAs só em totais** (quantidade, valor total, garantido, extintas/prescritas), situação atual.
2. Por frente processual (Título 3 por frente: IDPJ, MCF, EF central, EFs sem incidente) — **tabela cronológica** data · tipo · fato.
3. Quadro de decisões judiciais (data, processo, evento, teor, desfecho).
4. Quadro de constrições e valores (bem, titular, tipo, data da constrição, valor, processo, situação).
5. Quadro de providências e peças (data, processo, tipo, resumo, link).
6. Cronologia completa (anexo, no fim).

Número de processo em fonte monoespaçada; tabelas nativas; sem prosa analítica; **sem seção de pendências/pontos a conferir**.

**Planilha:** abas **Cronologia** e **Constrições** (sem aba de CDAs). Colunas da cronologia sempre presentes: Data | Processo | Frente | Tipo | Fato | Teor/Resumo | Valor | Link | Fonte no app.

**O que entra na cronologia:** providências e peças, decisões, constrições, intimações recebidas, audiências, fases dos processos e entradas de diário marcadas "No relatório".

**Datas:** a data de registro da atuação vale como data do protocolo. Constrição usa o novo campo "Data da constrição". Tipo de providência: o que o app já registra (peticionamento/ciência/tipo de petição), sem vocabulário novo.

---

## 4. Ajustes de formulário (aprovados)

1. **Teor da decisão na intimação** — campo curto e opcional na gaveta da intimação, editado como o "objeto". **Mescla-se** com a "descrição do ato" da ciência (um campo só; o modal mostra para confirmar). Repercute na fase correspondente da frente e na cronologia do relatório. Vazio não gera aviso, selo nem pendência.
2. **Data da constrição no bem** — campo opcional, padrão hoje, visível só nas situações ativa e requerida. Card mostra "Indisponível desde dd/mm/aaaa". **Não** criar situações novas (Penhora/Bloqueio) agora.
3. **"No relatório" no diário** — botão ao lado do tipo; ligado por padrão em Decisão judicial e Providência. Entradas **antigas** desses dois tipos passam a contar como marcadas.

---

## 5. Fora do escopo (decidido)

- Retrato do estado inicial da operação (fica subentendido no cadastro e em outras fontes).
- Voltar a operação inteira para uma data.
- Seção/lista de pendências ou "pontos a conferir".
- E-mail de resumo.
- Novas situações de bem.
- Redação automática do relatório.

---

## 6. Ordem de execução

O registro de trabalho é o mais urgente, mas pode ser enxugado se ficar pesado demais. Por isso há um portão de viabilidade antes de ligá-lo no app.

1. **Ajustes de base (pequeno)**
   - Corrigir a Prestação de contas: eventos de prescrição sem `operationId` e com `cdaId`/`batchCdaIds`/`executionId`; atuação contada duas vezes (documento de intimação/proativa); bem cadastrado já indisponível.
   - `changeLog` legível (`responseAction`) e com marca de importação.
   - `NEXUS_Log` (linha 200 fixa): decisão técnica no PR.
2. **Portão de viabilidade do registro** — biblioteca pura de detecção de mudanças com testes, incluindo desempenho num banco fictício de ~20 MB. Se não passar, o Produto 1 é revisto antes de tocar no app.
3. **Registro de trabalho** — servidor (endpoint próprio, sem mexer no salvamento atual), ligação no app, tela "Minha atividade", restauração, exportação.
4. **Ajustes de formulário** (seção 4).
5. **Base do relatório** — Doc + planilha.

Cada etapa: PR pequeno, testes (`node --test`), `npm run build`, descrição de como validar. Uma por vez.

---

## 7. Notas técnicas (decisão do desenvolvedor)

- Captura num ponto único: comparação entre o estado anterior e o novo no efeito de `data`, por referência; correlação de mudanças do mesmo ato (ex.: resposta à intimação = intimação + nota + documento → um evento).
- Contexto de origem por escopo com início/fim (importações atravessam vários commits).
- Todos os caminhos que substituem o estado inteiro sinalizam explicitamente (carga inicial do GAS, pull, importação de JSON, reset demo).
- Trilha fora do `nexus_data.json` (que já passa de 20 MB): arquivos diários numa subpasta `Trilha/` do Drive, endpoint separado `appendActivity`, deduplicação por id; `saveNexusData` intocado e compatível com cliente antigo.
- Fila local de envio em IndexedDB (o `localStorage` já está perto da cota com o cache principal), enviada com frequência e ao fechar a aba.
- `changeLog` continua em paralelo até a trilha estar validada.
