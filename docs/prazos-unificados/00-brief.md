# Brief — redesenho da apresentação dos prazos extintivos (NEXUS)

Data de referência: 2026-10-09. Repositório: /home/user/nexus-cursor. Usuário: procurador da Fazenda Nacional, leigo em programação; lê português, decide pelo que vê.

## O que o usuário pediu (resumo fiel)

- Discutir o **layout de apresentação** dos prazos extintivos. Não as regras, mas o modo como o app apresenta os problemas para que ele resolva.
- "Temos que unificar. Mesa, lista, relógios… fica tudo muito confuso. Por um critério o app avisa que 45 milhões estão em jogo, por outro que 8 milhões são urgentes… não se sabe o que fazer primeiro."
- Três formas, **todas unificadas**. Preferência declarada pelo **relógio** (régua do tempo).
- Premissas:
  - **Decadência não é problema dele.** O app registra, permite editar, calcula. **Nenhum aviso.**
  - **Prescrição ordinária:** o único aviso é para **ajuizar uma CDA ainda não prescrita**, evitando a consumação. Aviso enorme para algo consumado há anos não serve (o app faz isso hoje). **Consumações recentes** devem ser avisadas (o cálculo pode estar errado; deixar de avisar custaria caro), mas consumações antigas vão para "consumadas" e só.
  - **Intercorrente:** em alguns casos há o que diligenciar, em outros não. **Nem todo aviso gera possibilidade de ação.**
  - Outras premissas virão; o desenho será acertado aos poucos.
- Objetivo: sistema de controle e exibição de riscos extintivos **claro**, com **tratamento fácil** e **sem necessariamente remeter à operação (edição ali mesmo)**. Dados completos, sem confusão: identificar com facilidade **qual é o problema e o que precisa ser verificado**. Não mexer nas regras, mas nas escolhas do que exibir, como e onde. Classificações por **operação, valor, abrangidas ou não** etc. são bem-vindas. **Separar consumado do que ainda pode ser salvo.** **Separar a natureza do prazo.** Simplificação: atuar onde deve, entender o problema.

## Telas de hoje (prints enviados pelo usuário)

- **Mesa de prazos (Prumo):** contadores "PRECISA DE VOCÊ 332 · R$ 45,9 mi em jogo" · "NO RADAR, SEM ALARME 750 · G1 0 · G2 0 · G3 288 · G4 462" · "SILENCIADOS 2335 · parcelados, adiados e ainda impossíveis" · "CONSUMADAS 181 · para análise, fora do alarme". Filtros: Operação (Todas), busca "CDA, processo ou devedor". Seção "Precisa de você — pela data cedo; no empate, o maior valor", grupos por processo ("50041044420144047005 · 6 CDAs · R$ 535.582,62"); linha: "1 · 326604308 · CEDO-TARDE · Intercorrente · Pela leitura mais desfavorável (data cedo), o prazo já venceu. A data tarde é a tese da União." · mini-régua · "AGROTRAC · 5004104… · AGROTRAC COMERCIO DE INSUMOS AGRICOLAS LTDA" · botões Evento · Abrir · Conferir · Adiar… · à direita "há 20 anos · cedo 27/04/2006 · R$ 181.110,82". As três primeiras linhas são iguais (mesmo processo, mesma frase, "há 20 anos").
- **Lista "Prazos extintivos" (clássico):** contadores URGENTES 101 · R$ 8.068.068,49 · A CONFERIR 0 · A COMPLETAR 490 · R$ 89,1 mi · ACOMPANHAMENTO 491 · R$ 105,0 mi · AINDA IMPOSSÍVEL 1122 · R$ 177,2 mi · CONSUMADA 194 · R$ 33,2 mi. "Mostrando só: Consumada · 194 inscrição(ões) (inclui as consumadas há menos de 6 meses, que continuam em Urgentes)". Aviso "8 divergência(s) entre a análise importada e o cálculo do app. O cálculo prevalece; lance o fato que justifica a análise." Toggle "Mesa de prazos | Lista", Filtros, "Por valor", busca, "Importar análise (formato NEXUS)". Linha: grupo "Sem processo — © BRITO E SOUZA · 1 CDA(s) · R$ 64.369,30"; "1 · 90 4 21 106634-67 · R$ 64.369,30 · Prescrição ordinária consumada em 13/09/2026 · consumada em 13/09/2026 · Data de constituição definitiva não informada; o início usado é a inscrição. Informar vencimento, entrega da declaração ou notificação do lançamento. · Abrir · + Evento · Tratar".

Problema central ilustrado: a mesma carteira produz "332 precisam de você / R$ 45,9 mi" numa tela e "101 urgentes / R$ 8,0 mi" na outra; consumadas há 20 anos aparecem no topo como urgentes; a lista repete a mesma frase em várias linhas do mesmo processo; "Consumadas" conta 181 numa tela e 194 na outra.

## Regras para TODAS as propostas

1. **Um único conjunto de números.** Todo contador soma sobre a mesma base e é explicável em uma frase. O mesmo item nunca conta em duas categorias de alarme. Exceção explícita e declarada na tela: consumada recente pode aparecer em "conferir" e em "consumadas".
2. A primeira pergunta que a tela responde é **"o que eu faço primeiro?"** — ordem única, visível e explicada.
3. Separar: (a) **ainda pode ser salvo × consumado**; (b) **há ação × só vigiar**; (c) **natureza**: ordinária (só "ajuizar"), intercorrente, decadência (nunca alarma; só consulta/edição).
4. **Consumadas:** recentes (≤ 6 meses: "o cálculo pode estar errado — confira") com destaque moderado; antigas só na lista de consumadas, sem alarme, com filtro e soma.
5. **Edição no lugar:** lançar evento, "ainda vale", marcar conferido, adiar, tratar, confirmar vigência, lançar ciência, ajuizada (informar processo) — sem sair da tela; abrir a ficha ou a operação é opcional.
6. **Dados completos em camadas:** linha enxuta → item expandido → gaveta com colunas (decadência/ordinária/intercorrente), régua, ocorrências e "conferir nos autos".
7. **Filtros e agrupamentos:** operação, valor, processo, abrangida por IDPJ/cautelar ou não, natureza, certeza (faixa/dado/calculado), situação, adiadas/tratadas.
8. **Régua do tempo (relógio)** presente em todas; ao menos uma proposta é construída em torno dela.
9. **Não mudar regras do motor:** toda classificação deriva de campos que o motor já devolve (ver 02-motor-vocabulario.md). O que precisar ser derivado só na camada de exibição deve ser dito, com os campos de origem.
10. Dizer o que acontece com **Mesa, Lista, Painel (cards de prescrição), Hoje e e-mail diário**: o que a proposta substitui, funde ou remove, em cada edição (clássico, Beta, Prumo). O e-mail não muda (fora do escopo); só registrar.
11. **Vocabulário:** linguagem do caso (frases como o app já usa), sem jargão de motor na tela (kind, G1, faixa alta). Nomes de grupos iguais em todas as telas e edições.
12. Linhas do mesmo processo com a mesma situação devem poder ser **agrupadas/condensadas** (uma frase, N CDAs, soma), com ação em lote.

## Os três conceitos (um por proposta — manter distintos)

- **Proposta 1 — "Relógio".** A tela é um eixo do tempo (passado → hoje → futuro). Cada CDA/processo se posiciona pela sua **data de alarme (cedo)**; faixas de tempo viram os contadores (vencido há ≤ 6 meses · vence em 90 dias · 90 dias–1 ano · depois · sem data); à esquerda de "hoje" só consumadas recentes; as antigas ficam fora do eixo, em "Consumadas". Raias por natureza ou por "há ação / só vigiar". A fila de trabalho é o próprio relógio lido da esquerda para a direita. A régua individual de cada item é a mesma régua do eixo, ampliada.
- **Proposta 2 — "Fila de trabalho".** A tela é organizada pela **ação** que o usuário executa: Ajuizar · Lançar fato/ciência · Confirmar vigência · Completar dado · Conferir cálculo recente (consumadas recentes e divergências) · depois "Só vigiar" · depois "Consumadas". Um número por seção = quantidade de ações, não de CDAs (CDAs do mesmo processo com a mesma ação viram um item). O relógio aparece dentro de cada item, como prazo da ação. Ações em lote por seção.
- **Proposta 3 — "Carteira por natureza".** Abas por natureza: **Ordinária** (só o que falta ajuizar) · **Intercorrente** (agir / só vigiar) · **Consumadas** (recentes / antigas) · **Decadência** (consulta, sem contador de alarme). Cada aba usa a mesma escada de risco (vence em 90 dias · até 1 ano · depois · sem data), agrupada por **operação** com somas, e a linha carrega o relógio. Ênfase em filtros/agrupamentos (operação, valor, abrangidas, certeza) e em visão de carteira para quem gere muitas operações.

## Entregável de cada proposta

- Markdown em `/tmp/claude-0/-home-user-nexus-cursor/c1a09529-c321-5d32-b25a-4bec558d17a3/scratchpad/prazos-ux/proposta-N.md` com: conceito em 5 linhas; a pergunta que cada bloco da tela responde; o conjunto único de contadores com o critério de cada um em termos de campos do motor (e a prova de que não há dupla contagem); a ordem e sua justificativa; anatomia da linha; camadas (linha → expandido → gaveta); ações no lugar e como cada uma se liga a uma função já existente (MESA_ONE_CLICK, applyMesaAction, confirmPauseEvent, modais de evento…); filtros e agrupamentos; o que acontece com cada tela atual em cada edição; como atende cada premissa do usuário (uma linha por premissa); riscos e limites; o que precisa ser derivado só na exibição e de quais campos.
- Mockup `design/mockups/prazos-unificados/proposta-N.html` sobre o kit (base.css, dados.js), standalone, `<main class="nx-mock" id="proposta-N">`, CSS próprio prefixado por `#proposta-N`; mostrando: contadores, lista principal na ordem proposta, um item expandido, a gaveta aberta de um item com edição no lugar, a área de consumadas, um filtro por operação aplicado ou disponível; interatividade mínima em JS simples (expandir/recolher, trocar aba/filtro, abrir gaveta), sem precisar funcionar de verdade.
- Screenshots desktop (1400×1000) e mobile (390×800) em `/tmp/claude-0/-home-user-nexus-cursor/c1a09529-c321-5d32-b25a-4bec558d17a3/scratchpad/prazos-ux/proposta-N-desktop.png` e `proposta-N-mobile.png`, sem erros de console.
