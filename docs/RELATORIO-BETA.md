# Relatório da Nova versão (beta) — para quem opera o painel

**Para:** Roger  
**Data desta redação:** 19/09/2026  
**Versão no painel:** **2.0.12** (já publicada no Apps Script)  
**Inventário técnico (números #1–#217):** `docs/INVENTARIO-BETA.md`

Este texto substitui o relatório de 18/09/2026. Aquele dizia que nada tinha sido gravado. **Isso mudou.** A maior parte já está no painel. O que resta é você **confirmar** o que a Beta faz com a fila de prazos — e saber, com clareza, o que cada peça altera na sua mesa.

Não há código aqui. Há o que o app **mostra**, o que **deixa de calar**, o que **deixa de gritar**, e o que acontece no crédito se você recusar o item.

---

## Como ler

Cada tópico responde a quatro perguntas de quem usa o NEXUS para **não perder prazo e não tratar alarme falso como urgência**:

1. **Para que serve no app** — o que isso protege (ordinária, 1 ano + 5 anos, cadastro, caixa de entrada).
2. **O que você vê agora** — a tela, com exemplo.
3. **O que acontecia antes** — o risco prático (silêncio, termo errado, ficha oca).
4. **Se recusar** — o que volta.

**Onde vale**

- **Clássico + Beta:** as duas edições. Recusar mexe no dia a dia, mesmo sem ligar a Nova versão.
- **Só Beta:** só aparece com ⚙ → **Nova versão (beta)** ou no arquivo `demo_experimental.html`.

**Três arquivos (isto mudou depois do relatório antigo)**

| Arquivo | Uso |
|---|---|
| Painel no Google (`Nexus.html`) | Clássico do dia a dia |
| `Nexus.demo.html` | Demo para **compartilhar** — cara do clássico, dados de teste |
| `demo_experimental.html` | **Nova versão (beta)** — Hoje, Agenda, Mesa de prazos |

O relatório antigo dizia que `Nexus.demo.html` *era* a Beta. **Não é mais.**

**O que você já decidiu nesta conversa**

- Contas do motor (Bloco A) — **adotar**.
- Leitura DEBCAD e SIDA Relatório Completo, com as regras do que vira evento — **adotar**.
- Frases das colunas (protesto na intercorrente; data da rescisão) — **adotar**.
- Juntar fichas duplicadas de pessoa no mesmo CPF/CNPJ — **adotar**.

**O que ainda pede o seu “sim” de política** — a fila da Beta (Bloco B) e o desenho da Mesa (Blocos D–F). O código **já está publicado**. Recusar agora seria **desfazer**, não “não implementar”.

---

## 0. Para que o NEXUS existe, neste lote

O app é a mesa da operação fiscal: inscrições, execuções, intimações e **três relógios** que não se misturam:

1. **Decadência** — constituir o crédito.
2. **Prescrição ordinária** (art. 174) — cinco anos da inscrição até o ajuizamento (e o que a LC 208/2024 faz com o protesto lavrado).
3. **Intercorrente** — 1 ano + 5 anos **depois** da ciência de não localização / ausência de bens (ou, na política da casa, depois da **rescisão** do parcelamento).

A auditoria (motor estressado com carteira grande + revisão de telas) mostrou dois vícios opostos:

- **Silêncio indevido:** ficha “parcelada” sem adesão sumia; “aguardando reconhecimento” sumia; protesto do Debcad não entrava; segunda ciência reiniciava o ciclo.
- **Alarme indevido:** IDPJ sem constrição puxava para “completar cadastro” um crédito que **ainda não pode** ter prescrito; KPI somava urgência com o que só pedia conferência.

A pesquisa de uso (Fable) fixou a regra da Beta: **alarme ≠ consciência**. Vermelho só no que pede ato **hoje**. O resto permanece visível, com contagem, na gaveta **Silenciados**. Nada some.

---

# Bloco A — A conta nas três colunas

**Onde vale:** clássico e Beta. **Estado:** no painel 2.0.12. Recusar = termo ou frase **errados** de novo.

A finalidade aqui é o núcleo do app: a data que você lê na ficha tem de ser a data com a qual a União pode (ou não) afirmar prescrição.

### #1 Pausas que se encostam ou se cobrem

**Para que serve.** Embargos, depósito, parcelamento, IDPJ — cada um **pausa** o relógio. Se dois fatos valem no mesmo calendário, o dia só pode ser descontado **uma vez**.

**O que você vê.** Dois períodos que se sobrepõem (embargos 2018–2020 e depósito 2019–2021) empurram o termo até o **fim real** da pausa conjunta (2021), não a soma dos dois.

**Antes.** O app somava os dois inteiros e o termo ia **um ano para a frente**. Você planejava peça com folga que não existia — ou deixava de apontar consumação que já era sustentável.

**Se recusar.** Termo tarde demais. Risco de perder janela de arguição ou de afirmar prescrição cedo demais no calendário verdadeiro.

**Como testar.** CDA com duas pausas sobrepostas. O termo deve bater o calendário unificado, não a soma.

---

### #2 A primeira ciência inicia o 1 ano + 5 anos

**Para que serve.** O ciclo intercorrente nasce na **primeira** certidão de não localização / ausência de bens. Certidão nova é fato do processo; **não** é novo dies a quo.

**O que você vê.** Ciências em 01/01/2018 e 01/06/2019 → termo **01/01/2024**. A segunda aparece como ocorrência: “nova certidão — não reinicia”.

**Antes.** A segunda ciência **substituía** a primeira. O ciclo recomeçava. Cinco anos a mais de “ainda dá tempo”.

**Se recusar.** Cada certidão posterior empurra o termo. A União perde a leitura correta do art. 40 / Tema 566 na ficha.

---

### #3 a #6 Fato datado depois de hoje não entra na conta

**Para que serve.** O app calcula **hoje**. Adesão, rescisão, penhora ou pausa com data futura ainda **não aconteceram**. Não podem pausar, interromper nem abrir ciclo.

**O que você vê.**

- (#3) Parcelamento “a partir do ano que vem” **não** tira a CDA da fila hoje.
- (#4) Na ordinária, o fato futuro aparece em **Conferir nos autos**, sem mudar o termo.
- (#5) Na intercorrente, constrição futura continua “pedido sem resultado”; rescisão futura **não** reabre o 1+5.
- (#6) Status ou evento “parcelada no futuro” não vale como parcelamento vigente **hoje**.

**Antes.** Um fato lançado com data posterior a hoje distorcia termo e fila: crédito “sumia” ou o ciclo “já tinha recomeçado” num dia que ainda não chegou.

**Se recusar.** Cadastro otimista (ou erro de digitação de ano) cala ou empurra prazo que, no mundo, ainda está correndo.

---

### #7 e #8 Conferir: data futura e ciência antes do ajuizamento

**Para que serve.** O cálculo segue (não apaga a data). A coluna **avisa** o que o operador precisa bater nos autos.

**O que você vê.** “Evento com data futura” e “ciência anterior ao ajuizamento — conferir data”. Ciência de 2018 numa execução ajuizada em 2020 **não some**; pede conferência.

**Antes.** Ou o fato futuro entrava na conta (#3–#6), ou a ciência antiga passava batido, como se o art. 40 pudesse nascer antes da execução.

**Se recusar.** Volta o silêncio sobre inconsistência de datas. O termo pode até estar “certo” na fórmula e **errado** no processo.

---

### #9 Termo já passou e há pedido sem resultado

**Para que serve.** Não dizer “prazo em curso” com dias **negativos**. Há petição nos autos; declarar consumação sem conferir o desfecho é risco.

**O que você vê.** “Termo calculado em dd/mm já passou; há pedido de dd/mm sem resultado — conferir antes de declarar.” Continua vermelho, com selo de pedido pendente — não some para “residual”.

**Antes.** Situação “Prazo em curso” e “−990 dias”. Contradição na cara da ficha.

**Se recusar.** A tela mente: parece que o prazo ainda corre.

---

### #10 Gramática do encerramento (“pelo” / “pela”)

**Para que serve.** A frase do ciclo encerrado é o que você lê para saber **qual ato** fechou o 1+5 (penhora, arresto, Sisbajud…).

**O que você vê.** “Ciclo encerrado **pelo** arresto / **pelo** bloqueio Sisbajud / **pela** penhora / **pela** citação.”

**Antes.** “pela arresto”, “pela bloqueio”. Não muda o termo; muda a leitura rápida.

**Se recusar.** Só o português. A conta permanece.

---

### #11 29 de fevereiro

**Para que serve.** Aniversário em anos (1+5, piso). 29/02 não existe em ano comum.

**O que você vê.** Ciência em 29/02/2024 → termo em **28/02/2030**, não 01/03/2030.

**Antes.** O dia estourava para 1º de março. Um dia a mais no calendário da União — irrelevante na maior parte dos casos, decisivo no limite.

**Se recusar.** Termo um dia depois do último dia de fevereiro.

---

### #12 Ordinária ajuizada não se chama “seguro”

**Para que serve.** Ajuizar **interrompe** a ordinária (Tema 383). Não significa que o crédito está a salvo para sempre: a intercorrente pode estar em curso ou nem ter começado.

**O que você vê.** Selo **Interrompida — vigiar**, não “seguro”.

**Antes.** A coluna chamava de seguro só porque houve propositura. Leitura complacente.

**Se recusar.** A palavra “seguro” volta a anestesiar a ordinária ajuizada.

---

### #13 Suspensão do art. 40 datada vale como ciência (R10)

**Para que serve.** Muitas vezes o que está nos autos é o despacho de suspensão do art. 40, não a certidão com esse nome. A casa já decidiu: com **data**, vale como início do 1+5, **com aviso** para confirmar a certidão.

**O que você vê.** Início = data da suspensão. Ocorrência: “Suspensão do art. 40 … vale como ciência.” Conferir: “certidão de não localização/sem bens não lançada — confirmar data.”

**Antes.** O ciclo corria na conta e a linha Datas dizia **“sem ciência lançada”**. Você lia que o prazo não tinha começado — e o termo já existia.

**Se recusar.** A contradição volta: termo no motor, “sem ciência” na boca da coluna.

---

### #14 Aviso de incidente só na coluna da intercorrente

**Para que serve.** “IDPJ sem constrição” diz respeito ao **ciclo da execução**, não aos 5 anos da inscrição.

**O que você vê.** O recado **não se repete** na coluna da ordinária. Continua na intercorrente. Falta de constituição, conflito de data etc. continuam em todas as colunas, porque são cadastro.

**Antes.** O mesmo aviso de IDPJ aparecia nas duas colunas. Ruído; a ordinária parece “incompleta” por fato que não a afeta.

**Se recusar.** O recado volta a poluir a ordinária.

---

### #15 Índice de eventos (carteira grande)

**Para que serve.** Abrir Prazos numa operação com dezenas de CDAs sem o painel travar. **Não muda o termo.**

**O que você vê.** Nada, numa operação de 5 nomes. Em carteira grande, a aba responde.

**Antes.** A fila varria eventos CDA a CDA (dezenas de segundos em teste ×100).

**Se recusar.** Risco de tela lenta; as contas do A dependem deste índice em vários pontos — recuar só isto sem o resto quebra a fila.

---

### #16 CDA cujo número é o do IDPJ (marca interna)

**Para que serve.** Distinguir “não ajuizada” de “ajuizada no processo **errado**” (incidente no lugar da EF).

**O que você vê no clássico.** Quase nada sozinho. **Na Beta (#27)** a Mesa pede “vincule à execução fiscal”.

**Antes.** O número existia; o app podia tratar como inscrição sem execução.

**Se recusar.** A Beta deixa de ter como saber que o CNJ é de IDPJ/cautelar.

---

### #17 Status “parcelada” no clássico continua escondendo

**Para que serve.** Deixar o **clássico** como você já conhece: status parcelada **ou** adesão vigente tira da lista de prazos. A novidade “status sem fato não esconde” é **só Beta (#25)**.

**O que você vê.** No clássico, CDA “parcelada” na ficha **sem** evento de adesão **continua fora** da aba Prazos extintivos.

**Se recusar.** Só faria sentido junto com levar a fila v2 ao clássico — não foi o pedido deste lote.

---

### #18 Rótulo “Suspensão do art. 40”

**Para que serve.** Nome curto na tabela de ocorrências.

**O que você vê.** “Suspensão do art. 40”, não “Registro de suspensão do art. 40”.

**Se recusar.** Só o rótulo. A regra #13 permanece.

---

### #19 e #143 Página de regras: parágrafo 2026.09a

**Para que serve.** A janela ⓘ **Regras de prazos** passa a contar, em português, as contas novas do Bloco A.

**O que você vê.** Histórico **2026.09a** (18/09/2026). O **número** no título e no ⚙ continua **v2026.09** (#144) — o rodapé das colunas não “grita” que a conta mudou; o parágrafo do histórico sim.

**Se recusar só o parágrafo.** A tela de regras fica muda sobre pausas fundidas, 29/02, art. 40 etc., embora a conta na ficha já seja a nova.

---

### #20 Nada foi apagado “porque não usava”

**Para que serve.** Não perder capacidade. Peças internas que ninguém pediu para remover **continuam**.

**O que você vê.** Nada. É garantia de que o lote não “limpou” feature viva.

---

# Bloco B — A fila da Beta (o que entra no vermelho)

**Onde vale:** só Beta. **Estado:** publicado. **Ainda pede a sua confirmação de política.**

A finalidade aqui não é o termo da coluna. É **quem aparece** na sua manhã: o que pede peça ou conferência **hoje**, versus o que deve permanecer à vista sem alarme.

O clássico **não** mudou de fila. Você pode comparar as duas leituras da mesma carteira.

---

### #21 e #22 Duas filas no mesmo app

**Para que serve.** Experimentar a política nova **sem** alterar a lista “Prazos extintivos” do clássico.

**O que você vê.** ⚙ → Clássico: fila antiga. ⚙ → Nova versão (beta): fila nova. Nos dados demo (18/09/2026): clássico **2 urgentes · 8 a completar · 2 ainda impossível**; Beta lista **2 urgentes · 1 a completar · 9 ainda impossível**. Os dois urgentes da Agro (ITR e IRPF sem processo) são os **mesmos**. Mudou o miolo: o que era falso “completar cadastro” virou “ainda impossível” na gaveta.

**Antes.** Uma fila só. Status pintado na ficha mandava no silêncio.

**Se recusar.** A Mesa da Beta perde o sentido (ela lê esta fila). Alternativa: levar a v2 ao clássico — a lista de lá mudaria os oito “a completar”.

**Como testar.** Anote os cinco números no clássico. Ligue a Beta → Prazos → **Lista**. Compare. Os dois urgentes da Agro devem permanecer.

---

### #23 e #24 “Aguardando reconhecimento” não some

**Para que serve.** Prescrição **apontada** e ainda sem trânsito / reconhecimento **não é caso encerrado**. Calar a CDA é perder o acompanhamento da decisão judicial.

**O que você vê na Beta.** A inscrição permanece, sem vermelho de consumação nova. Selo “aguardando decisão”. Frase: “A prescrição já foi apontada e aguarda decisão judicial.” Só saem de vez: **declarada**, **reconhecida**, CDA **extinta**.

**Antes (e no clássico ainda).** “Aguardando reconhecimento” tira da aba Prazos, como se o crédito tivesse acabado.

**Se recusar.** Esses casos saem da consciência diária até você lembrar de abrir a ficha.

**Como testar.** Beta → CDA → Tratar → aguardando reconhecimento. Deve permanecer na fila/gaveta. Marcar “declarada” deve sair.

---

### #25 Ficha “parcelada” sem adesão = cadastro a completar

**Para que serve.** R6 (parcelamento vigente sai da fila) lê o **fato** (adesão), não a tinta do status. Status sem data **não pausa** o art. 174 nem o 1+5. Esconder a CDA nesse estado é o pior silêncio: o prazo corre e a mesa não mostra.

**O que você vê na Beta.** Status parcelada / negociada SISPAR / execução suspensa por parcelamento, **sem** evento de adesão: permanece na Mesa, frase “A ficha diz parcelada, mas não há adesão lançada — o prazo segue correndo.” Campo de data na linha: Enter lança a adesão (#114).

As CDAs da Laranjas e da Holding **com** adesão vigente vão para **Silenciados** (“Parcelamento vigente · até …”), não para o vermelho.

**Antes / clássico.** Status sozinho esconde.

**Se recusar.** A Beta volta a calar ficha “parcelada na caneta”. O 1+5 segue nos autos, invisível.

**Como testar.** SILENCIADOS: as seis com fato de adesão. Crie uma CDA só com status Parcelada, sem adesão: deve **pedir a data**, não ir à gaveta.

---

### #26 Ordinária já vencida em CDA ajuizada = urgente

**Para que serve.** R1: os relógios não se misturam. Ajuizar **não apaga** o fato de que os 5 anos da inscrição já tinham caído **antes** da propositura. Isso é ordinária consumada, não “ainda impossível” por falta de ciência do art. 40.

**O que você vê na Beta.** Grupo 1, selo ordinária, frase “Os 5 anos da inscrição venceram antes do ajuizamento.”

**Antes.** Caía no grupo 5 e saía do alarme — como se só existisse o relógio intercorrente.

**Se recusar.** Ajuizamento tardio continua invisível na fila. Você não é empurrado a tratar a ordinária já perdida.

**Como testar.** Os dados demo desta data **não** trazem o caso na Mesa. Para ver: inscrição antiga, ajuizamento depois dos 5 anos, sem ciência do art. 40.

---

### #16 + #27 Número da CDA é o do IDPJ / cautelar

**Para que serve.** Completar o **vínculo à execução fiscal**. O CNJ existe; está no incidente. Tratar como “sem processo” só alerta quando a ordinária aperta. O ato certo é ligar à EF.

**O que você vê na Beta.** “O número apontado é de incidente, não de execução fiscal.” Botão **Vincular EF**.

**Antes.** Podia cair no recorte de inscrição sem execução.

**Se recusar.** A Beta deixa de empurrar o vínculo. O crédito pode ficar órfão de EF na fila.

---

### #28 Piso futuro não vira alarme de cadastro

**Para que serve.** R8: enquanto o ato mais recente + 1 ano + 5 anos **não chegou**, consumação é impossível. IDPJ sem constrição é **nota**, não deve roubar o grupo.

**O que você vê.** Sucessão `90.6.19.000047-88` (PIS/COFINS, R$ 890.000), IDPJ sem constrição, “não antes de” 02/05/2028. Na Beta: **Ainda impossível**, gaveta, **sem** PRECISA DE VOCÊ. No clássico: grupo 3 (“a completar”), com o texto do IDPJ.

A irmã `000045-88` (R$ 5,6 mi) **não** é este caso: o ciclo já corre e a ficha diverge do termo; fica em **O RESTO**, sem vermelho.

**Se recusar.** A Mesa gritaria cadastro num prazo que ainda não pode ter prescrito. R$ 890 mil voltariam ao “completar”.

**Como testar.** Beta → Mesa → SILENCIADOS → `000047-88`. Clássico: a mesma CDA em “A completar”.

---

### #29 e #123 Recado de IDPJ uma vez — e hoje sem tela

**Para que serve.** Não repetir “sem constrição lançada” em **cada** CDA da mesma EF.

**O que você vê.** O recado **saiu** da linha de cada inscrição. O motor guarda uma nota por processo. **A Mesa não desenha essa nota.** A CDA grupo 5 continua na gaveta; o texto do incidente **não reaparece** numa tela própria.

**Se recusar o dedupe.** O texto volta a se repetir em cada irmã, como o clássico.

**Atenção.** Adotar como está = o aviso some da linha **e** não ganha outro lugar. Se você quiser o recado **uma vez no processo**, isso **não foi feito**. É item em aberto de tela, não de conta.

---

### #30 e #142 Análise colada não apaga o vermelho

**Para que serve.** R11: planilha e texto colado não calam o cálculo. Uma análise “ciclo encerrado” não pode desligar termo já vencido.

**O que você vê na Beta.** Grupo 1 calculado **permanece**. A análise fica anotada. A comparação do que piorou usa a fila nova.

**Antes / clássico.** A decisão importada governava o grupo.

**Se recusar.** Uma análise otimista esconde o termo calculado. Você “desliga” o vencido colando texto.

**Como testar.** Prazos → Importar análise. Cole “ciclo encerrado” numa CDA que a Mesa mostra nos 180 dias. O vermelho deve ficar; a nota, também.

---

### #31 e #152 Uma frase e uma ação por linha

**Para que serve.** Na manhã, uma linha deve dizer **por que esta CDA está aqui** e **o que fazer**, sem Tema, Súmula, “piso”, “dies”, “marco”. Isso fica na memória técnica (Copiar) e na página ⓘ Regras.

**O que você vê (exemplos reais)**

- Agro `90.6.23.000884-40` (ITR, R$ 48.000, CALCULADO): “O termo calculado cai nos próximos **180 dias**.”
- Agro `90.6.20.000881-40` (IRPF, R$ 95.000): a mesma frase.
- Sucessão `000045-88`: “O prazo de 1 ano + 5 anos está em curso.”
- Parcelada com fato: “Parcelamento vigente”.
- `000047-88`: “Ainda não pode ter prescrito…”.
- Ordinária perdida antes do ajuizamento: “Os 5 anos da inscrição venceram antes do ajuizamento.”
- Parcelada sem adesão: “A ficha diz parcelada, mas não há adesão lançada — o prazo segue correndo.”

Ações: lançar fato, conferir autos, corrigir ficha, vincular EF, lançar ciência, ou nenhuma.

**Atenção honesta.** A frase de vigiar ainda diz **“resultado útil”** (“O ciclo encerrou por resultado útil; vigiar nova inércia.”). O filtro tira Tema/piso; **não** tira essa expressão.

**Se recusar o catálogo.** A Mesa fica muda ou com o texto técnico antigo. A janela de 180 dias na boca da fila **já era** decisão da casa.

---

### #32 Data para rever (despertador)

**Para que serve.** O que hoje não é urgente precisa **voltar** à mesa num dia certo. Sem isso, “consciência” vira esquecimento.

**O que você não vê** (nome técnico). O que vê: uma linha de acompanhamento **sobe** a PRECISA DE VOCÊ quando a data passou.

Regras: pausa → fim conhecido ou +90 dias; ciclo encerrado para vigiar → interrupção + 1 ano (mínimo hoje + 30); ainda impossível → a data do “não antes de”; aguardando decisão → +90 dias; inconsistência de cadastro → +30 dias.

**Antes.** Grupo 4 e 5 só saíam da vista ou ficavam no fundo. Não havia “me mostre de novo em dd/mm”.

**Se recusar.** O que está quieto só volta se você abrir a gaveta. Uma pausa que já acabou pode permanecer invisível.

**Como testar.** Nos dados demo desta data, o bloco de cima só tem as duas da Agro (grupo 1); o despertador não disparou no meio.

---

### #33 e #158 Silenciados (nada some)

**Para que serve.** R6 continua: parcelamento **vigente** não gera alerta. A novidade: **não desaparece**. Você revê em até 90 dias se a pausa ainda vale.

**O que você vê.** Gaveta **SILENCIADOS (15)** nos dados demo. Seis com “Parcelamento vigente · até 17/12/2026”; o restante, “ainda impossível”.

**Antes.** Parcelamento vigente sumia da aba. Não havia gaveta.

**Se recusar.** Volta o sumiço. A União “esquece” de conferir se o SISPAR ainda está de pé.

---

### #34, #35 e #161–#166 Adiar com furo

**Para que serve.** Silêncio **temporário**, com motivo, que **não sobrevive** a fato novo nem a piora. Não é “Tratar” (handled). O clássico ignora o campo.

**O que você vê.** Motivos fechados: Aguardando certidão, Peça protocolada, Garantia em análise, Não priorizar agora, Outro (texto **obrigatório**). Tetos: grupo 1 = **14 dias**, grupo 2 = **30**, grupo 3 = **7**, grupo 5 = **90**.

O silêncio **fura** (a linha volta) se: a data passou; o grupo piorou; entrou fato depois do adiamento; “Outro” sem texto.

**Antes.** Não existia. “Tratar” tirava da fila de outro jeito, sem data de volta.

**Se recusar.** A Mesa não cala uma linha sem “Tratar”. Se recusar só os furos: um “não priorizar” esconderia consumação nova. Se alargar o teto do grupo 1: urgente some um mês.

**Como testar.** Adiar a ITR da Agro com “Peça protocolada”. Some da PRECISA DE VOCÊ, vai à gaveta com **Reabrir agora**. Parcelamento vigente **não** tem esse botão.

---

# Bloco C — Acabamento que já está no clássico

**Onde vale:** as duas edições (salvo o que o texto disser). **Estado:** no painel. São correções de uso, não de prazo. Recusar = ficha vazia, ⚙ preso, demo fácil de clicar sem querer.

---

### #36 e #37 Não grava ficha oca

**Para que serve.** CDA sem número, intimação sem processo e sem descrição, tarefa sem título, bem sem descrição/matrícula, operação sem nome — não entram no acervo. O app vive de **identificadores** (CDA, CNJ). Ficha oca polui Inscrições e some na busca.

**O que você vê.** Faixa vermelha **dentro** da janela, acima de Cancelar/Salvar: “Informe o número da CDA.” (e equivalentes).

**Antes.** Dava para salvar vazio.

**Se recusar.** Volta a ficha sem número.

---

### #38 e #39 Esc, clique fora, pergunta se já digitou

**Para que serve.** Fechar sem perder texto. Clique no fundo escuro não pode jogar fora uma minuta de nota.

**O que você vê.** Esc fecha. Clique fora fecha. Se já escreveu: “Há texto digitado. Fechar sem salvar?”

**Antes.** Esc não fechava. Clique fora descartava.

---

### #40, #57 e #58 Marcas invisíveis (para a Mesa acertar a ficha)

**Para que serve.** Na Beta, “Abrir” / “Conferir” / “Lançar fato” precisam cair na **data** e nas **três colunas**, sem gravar lixo na Planilha.

**O que você vê no clássico.** Nada. Ao salvar, o app apaga as marcas internas.

**Se recusar.** A Mesa da Beta erra o scroll ou suja o JSON.

---

### #41, #42 e #43 Recado ao salvar e ao dar ciência

**Para que serve.** Saber que **foi**. Ciência vai para Resolvidas sem abrir a aba; o rodapé confirma (~3 s): “Ciência registrada — ver Resolvidas”, “CDA salva”, etc.

**Antes.** Dúvida de “foi ou não foi”.

---

### #44 a #49 e #153 Painel ⚙ fecha; nome da edição

**Para que serve.** O ⚙ não pode ficar preso na frente da tela. O interruptor precisa dizer **Nova versão (beta)**, não “Demo Experimental”.

**O que você vê.** ✕, clique fora, Esc, fecha ao trocar de Painel para Intimações. Texto: a Beta usa a navegação do clássico, com Hoje e Agenda. Ao **desligar** a Beta estando em Hoje, cai no **Painel** (#153) — o clássico não tem aba Hoje.

**Antes.** Só clicando de novo na engrenagem. Rótulo antigo. Risco de tela fantasma ao voltar.

---

### #50 e #186 Tubo de ensaio saiu da coluna da esquerda

**Para que serve.** **Resetar dados demo** zera o cadastro local pelos cinco nomes fictícios. Na sidebar era um clique sem querer no meio do trabalho.

**O que você vê.** Só em ⚙ → Dados / Sync. Saiu da Hoje da Beta também.

**Se recusar.** O atalho perigoso volta à esquerda.

---

### #51 a #53 Nomes ao parar o mouse

**Para que serve.** ⬇⬆ = Exportar / Importar JSON. **NÃO AJ** = Não ajuizada. **AJ** = Ajuizada. A, IA… = espécie por extenso. Sigla opaca na lista de CDAs da Agro (`90.8.21.000200-02`, FGTS).

---

### #54 Briefing: cartão vazio some

**Para que serve.** “Observação” sem texto não ocupa a página da operação. Títulos antigos (Hipótese, Pendências…) continuam lidos. Os textos demo da Fachada Norte **têm corpo** — permanecem.

---

### #55 Semana da agenda: volta para a semana de hoje

**Para que serve.** No Painel, Mês → Semana não pode te jogar na semana do dia 1 daquele mês. Você perde a semana de trabalho (prazos, audiência).

**O que você vê.** Semana corrente (na conferência: 14–20 set 2026). Vale no clássico. A Agenda da Beta reutiliza o mesmo quadro (#78).

---

### #56 Versão no ⚙

**Para que serve.** Saber se o Google está na build nova. No ⚙ de 19/09/2026 deve ler **NEXUS 2.0.12** (o inventário antigo citava 2.0.7 — desatualizado).

---

### #59 e #60 Fonte e tema

**Para que serve.** Beta e clássico compartilham Mar Profundo · Claro · Ferro e Maré. Fonte vazia diz **Public Sans**, não “Padrão (Demo)”. Na Beta o grupo chama-se **Aparência** (#140).

---

# Bloco D — A casa da Beta

**Onde vale:** só Beta. **Estado:** publicado. Recusar o casco neste lote **não** religa o trilho antigo — ele foi retirado da Beta. Recusar a Beta inteira = ficar no clássico.

---

### #61 a #65, #82, #83 A Beta mora na casa do clássico

**Para que serve.** Uma navegação só. Você não reaprende “Central de Comando” para ver a Mesa de prazos. Temas os mesmos. Coluna da esquerda = operações. Faixa de cima = abas.

**O que você vê.** Sidebar. Sem trilho preto. Sem título enorme “Hoje / Carteira / Biblioteca”. Sem pílula **Demo**. Quem tinha Ardósia na Demo antiga volta ao tema clássico gravado.

**Antes.** Casa paralela (trilho, zonas, paleta Clara/Ardósia/Grafite).

**Se recusar só o casco.** Neste lote não há interruptor “Demo antiga”. Ou Beta nesta casa, ou clássico.

---

### #66 a #70, #81, #182–#185, #189 O que saiu da Demo Experimental

**Para que serve.** Dentro da operação, as **mesmas abas** do clássico: Briefing · Pessoas · Inscrições · Processos e Prescrição · Bens · Tarefas · Importar · Arquivos. Processos = visão master–detail (D). Sem A/B/C. Sem ranking extra “Painel da Carteira” em Operações (o ranking do **Painel** clássico **não** é isso — já existia e continua).

**O que você não vê.** Ardósia/Grafite. Há desenho antigo no arquivo, desligado — não é tela extra (#81, #193, #194).

---

### #71 a #73, #157, #201 Faixa de cima — e duas “Mesas”

**Para que serve.** Chegar em Hoje, Prazos, Agenda e na operação sem a faixa quebrar no zoom.

**O que você vê.** Hoje · Painel · **Prazos** · Operações · Intimações e Tarefas (soma) · **Mesa** · Acompanhar · **Agenda** · Modelos · nome da operação. Não diz “Prazos extintivos” nem “Audiências”. Intimações e Tarefas são **um** botão na faixa; por dentro, as duas abas continuam.

**Atenção.** A **Mesa da faixa** é a de **pins de intimação**. A Mesa **nova** (prazos) está em **Prazos**. Dois nomes iguais. **Não foi renomeado.**

Se não couber, sobra **Mais ▾** — não segunda linha.

---

### #74 a #77, #153 Vista Hoje

**Para que serve.** Responder “o que eu faço **hoje**?”: intimações, tarefas, audiências, riscos, num só lugar — sem ser a casa antiga da Demo.

**O que você vê.** “Bom dia. O que exige ação hoje?” Nos dados demo: tarefa de redirecionamento da Sucessão **atrasada**; intimação IDPJ da Fachada Norte atrasada; audiência 16:00 da Agro. Nova intimação a partir daqui **já traz** a operação aberta. Sem botão de resetar demo nesta página.

Ao ligar a Beta pelo ⚙, cai em Hoje. Ao voltar ao clássico, cai no Painel.

---

### #78 e #79 Agenda unificada

**Para que serve.** Um lugar para “quando”: grade da semana/mês **e** a lista Esta semana / Este mês (audiência 20 set 16:00 Agro; 22 set 14:30 Fachada Norte).

**No clássico.** A aba continua só a lista, nome **Audiências**.

---

### #80 Título da aba

**Para que serve.** Saber se você está na Beta. Aba do navegador: **NEXUS Beta** em `demo_experimental.html`. (O `Nexus.demo.html` de compartilhar **não** é mais essa aba.)

---

# Bloco E — Mesa de prazos (o coração visível da Beta)

**Onde vale:** só Beta. **Estado:** publicado. Lê a fila do Bloco B. Recusar a Mesa e ficar com a Beta = usar o botão **Lista**.

**Para que serve o bloco inteiro.** Separar o que pede **ato hoje** (peça, lançar adesão, vincular EF, termo nos 180 dias) do que deve permanecer **visível sem vermelho** (parcelamento vigente, ainda impossível, o que você adiou).

---

### #84 Seletor Mesa | Lista

**O que você vê.** Prazos abre em **Mesa**. Um clique volta à lista de grupos (Urgentes / A conferir / …), com as frases limpas da v2 (#122). A preferência grava (#180): se escolher Lista e recarregar, continua Lista.

---

### #85, #91, #92 Teto de 12 no vermelho

**Para que serve.** Orçamento de atenção. Quinze urgentes não cabem numa manhã; 12 na cara, o resto atrás de **+K acima do orçamento** (vermelho, clicável).

**Se recusar o teto.** O bloco de cima cresce sem limite. Se recusar só o botão: a 13ª some.

---

### #86 e #168 O que é “PRECISA DE VOCÊ”

**Para que serve.** Definir alarme com rigor de processo, não com “tudo que está na fila”.

Entra:

- grupo 1 (urgente calculado) **sempre**;
- grupo 2 **só** se o teto estimado **já passou**;
- grupo 3 **só** se a ação é de um clique (lançar fato / corrigir ficha / vincular EF) — “só conferir autos” **não** sobe;
- qualquer grupo se a **data de rever** já passou (#32).

**O que você vê nos dados demo.** Duas linhas: `90.6.23.000884-40` e `90.6.20.000881-40` (Agro, sem processo, CALCULADO, termo nos 180 dias, R$ 48.000 e R$ 95.000). A CDA de R$ 5,6 mi **não** está aqui.

**Se alargar (todo G3 no vermelho).** Os R$ 5,6 mi sobem. Se pôr G5 no meio da tela: “ainda impossível” infla o alarme.

---

### #87 e #96 O RESTO e o G5

**Para que serve.** Consciência sem alarme. “Ainda impossível” **não** infla o miolo — vai à gaveta.

**O que você vê.** “O RESTO G1 0 · G2 0 · G3 1 · G4 0 · G5 9”. Clique expande. Sem borda vermelha.

---

### #88 a #90, #93, #94 Linha: selo, frase, vermelho de vencida, silêncio expirado

**Para que serve.** Uma linha = CDA · processo · certeza (calculado / estimado / cadastro) · uma frase · valor · botões.

Termo **já passado** ganha o mesmo peso visual de intimação **VENCIDA** (#93, e no card do processo #106). Se o adiamento furou, a linha volta com “expirou o silêncio” (#94).

---

### #95, #113 a #117 Botões da linha e + Evento

**Para que serve.** Do alarme ao **lançamento do fato**, sem caçar a CDA na lista.

- **Evento / Abrir / Conferir / Adiar…** sempre.
- Extra: **Lançar fato**, **Vincular EF**, **Corrigir ficha**, **Lançar ciência**, conforme a ação (#113).
- Parcelada sem adesão: data na linha, Enter (#114).
- Evento já vem com CDA, EF e tipo; cursor na data (#115).
- Se o destino é IDPJ/cautelar, o menu não diz “Penhora / resultado útil” como se fosse a execução: diz **Constrição no incidente (pausa as EFs)** (#116).
- Ajuda do formulário na Beta **sem** “Tema 566/568”; Sisbajud pergunta se houve constrição; data digitada na CDA **não cala** o cálculo — aparece como conflito (#117). O **clássico** continua com Tema e Súmula 622 nas dicas.

---

### #97 e #98 Desenho e filtro

**Para que serve.** A barra Silenciados não pode cobrir o botão de orçamento. O recorte por operação e a busca (CDA, processo, devedor) são os da lista clássica, na Mesa.

---

### #99 a #105, #154 Frase da inscrição sem travessão e sem “Prescrita” estimada

**Para que serve.** Na lista Inscrições e no card do processo, a Beta **não** pode mostrar “—” nem chamar de **Prescrita** uma **estimativa**. Conflito ficha × app: “Ficha 26/01/2027 · app 14/08/2031 — conferir.” Tratada: “Tratada em dd/mm”, não a contagem. Dias longos: “há 2 anos” / “em 3 anos”, nunca “(-61034)”.

**Jargão (#99).** Na Beta, frases do dia a dia sem Tema/Súmula/piso/teto/dies/marco/CENÁRIO. A memória técnica **não** passa por esse filtro.

---

### #107 e #108 KPI honesto (R$ só do urgente de verdade)

**Para que serve.** O cartão **Prazos** não pode somar “ainda impossível” com “vence nos 180 dias”. Isso inflava o risco e empurrava a CDA de R$ 5,6 mi para o mesmo balde das duas da Agro.

**O que você vê na Beta.** “**2 urgentes · 1 para completar cadastro · R$ 143.000,00** — só o que pede decisão agora.” O real é o das **urgentes** (grupo 1). A `000045-88` de R$ 5,6 mi **não** entra nesse R$. No cabeçalho da operação, some “risco (1+2)”; se já venceu, selo VENCIDA.

**Clássico.** Continua “Risco prescricional” n1+n2.

**Se recusar.** Volta a soma que mistura alarme com consciência.

---

### #109 a #112 Gaveta Silenciados e Adiar na tela

**Para que serve.** Ver o que a fila tirou do vermelho, **reabrir** o que você mesmo adiou, e ser avisado se o adiamento acaba **esta semana**.

**O que você vê.** Barra **SILENCIADOS (15) ▸**. Motivo, até quando, **Reabrir agora** só no adiamento do usuário — não no parcelamento vigente. Popover Adiar: sem motivo/data não grava; “Outro” vazio → “Descreva o motivo para adiar.” Grupo 1: calendário no máximo 14 dias (18/09 → 02/10 na conferência).

---

### #118 e #119 Abrir / Conferir cai nas três colunas

**Para que serve.** O detalhe que importa para arguir prescrição são as **três colunas**. Abrir a CDA no meio da lista de inscrições, sem as colunas, perde o ato.

**O que você vê.** Aba Inscrições, colunas visíveis, Copiar / Evento / Editar **grudados** no topo ao rolar.

---

### #120 Arquivada art. 40 pede a data

**Para que serve.** Marcar a EF “arquivada art. 40” sem a **data da ciência** (ou do arquivamento) deixa a coluna no estado #13 às avessas: status sem fato. O mini-formulário cria o evento **por CDA ligada**.

**O que você vê.** “O que você tem em mãos?” Ciência ou arquivamento; tipo (suspensão que vale como ciência / ciência de ausência de bens); data. **Agora não** / **Lançar**. Sem data, não grava. Extinta na Beta ainda usa o sim/não antigo.

**Clássico.** Continua o confirm simples.

---

### #121 Sisbajud / CNIB / IDPJ não pintam Garantida sozinhos (Beta)

**Para que serve.** **Garantida** na ficha mistura “houve bloqueio” com “há garantia nos autos”. Quem lança o Sisbajud decide se houve constrição / resultado útil. R3: bloqueio **positivo na própria execução** encerra o ciclo **no cálculo**, se você lançar o fato certo. O que parou foi pintar o **status** automático.

**O que você vê na Beta.** Penhora e arresto ainda pintam Garantida (com marca de status automático). Sisbajud, CNIB e constrição de IDPJ **não**.

**Clássico.** Os três ainda pintam Garantida.

**Se recusar.** Bloqueio vira “garantida” na ficha e some da urgência visual, mesmo sem garantia.

---

# Bloco F — Caixa de entrada e demais telas da Beta

**Onde vale:** só Beta, salvo #141. Finalidade: a intimação vencida e a tarefa atrasada não perdem para o que ainda tem prazo, só porque alguém marcou “Urgente”.

---

### #124 a #128 Intimações: vencidas primeiro; Nova intimação

**Para que serve.** No modo “Prazo final”, o que **já venceu** sobe antes do que ainda tem prazo — mesmo que o que está no prazo esteja marcado Urgente. Dois blocos: **Vencidas** / **Urgentes no prazo**. Janela **Nova intimação**; Salvar visível em intimação longa.

**Exemplo.** Fachada Norte `5009876-11.2024.4.04.7001` atrasada sobe antes de uma no prazo “urgente”.

---

### #129 a #132 Tarefas: um número e ATRASADA

**Para que serve.** Ver quantas são globais e quantas só da operação, e o atraso no **mesmo peso** da intimação vencida (“ATRASADA 4d” na tarefa de redirecionamento da Sucessão).

---

### #133 Relatório gerado

**Para que serve.** Depois do HTML de passagem de serviço, um recado curto — além do download — para não achar que “não foi”.

---

### #134 Cabeçalho da operação começa fechado

**Para que serve.** DÍVIDA TOTAL / GARANTIDO / PRESC. CDA não ocupam a primeira tela. ▴/▾ abre. Os chips do panorama do Briefing **já** nasciam fechados.

---

### #135 e #136 Busca processo / CDA

**Para que serve.** Achar `884-40` na Agro sem rolar 50 inscrições. O mesmo campo em Processos e Prescrição (no lugar do seletor A/B/C).

---

### #137 Chip zerado some

**Para que serve.** “Parcelamento Integral (0)” não polui o filtro. No clássico o chip zerado **continua**.

---

### #138 e #177 KPIs numa linha (tema Claro, zoom 90)

**Para que serve.** Os cartões do cabeçalho não quebram a palavra no meio.

---

### #139 Dicas abaixo do alvo

**Para que serve.** O tooltip não cobre a Agenda nem o nome da operação na faixa.

---

### #141 Abrir CDA a partir da lista (caminho único)

**Para que serve.** “Abrir” em Prazos vai para Inscrições nas duas edições, sem o desvio das zonas da Demo antiga.

---

# Bloco G — O que você quase não vê (rede de segurança)

Estes números **não mudam a mesa** sozinhos. Garantem que a conta e a Mesa **não quebrem** na próxima alteração.

| O que é | Números | Para o operador |
|---|---|---|
| Página de regras 2026.09a | #19, #143, #144 | Já no Bloco A. O número da versão das regras **não** virou 2026.09a. |
| Caderno MELHORIAS | #145 | Texto interno; não sobe ao Google. |
| Compilação da Mesa no HTML | #146, #147, #155 | Sem isto a Beta no Google não teria Mesa. |
| Testes (conta, fila, Mesa) | #148–#151 | Se alguém desfizer #1 ou #25, o teste falha. Hoje a suíte está **265** verdes (o inventário antigo dizia 233). |
| Funções da Mesa “por trás” | #101, #159–#175, #167–#174 | São as mesmas regras #84–#123, só o nome interno. **Não decida duas vezes.** |
| CSS da Mesa / modal / colunas | #97, #126, #132, #176–#179 | Desenho dos itens já descritos. |
| Preferências gravadas | #180–#182 | Lista vs Mesa; Ardósia antiga ignorada; visão D. |
| Textos removidos da Demo | #183–#189, #195 | Central de Comando, Biblioteca no trilho, etc. — já no Bloco D. |
| Snapshot do clássico usa o índice, fila v1 | #190 | Clássico continua v1, só mais rápido. |
| Data do pedido pendente na frase #9 | #191 | Já no Bloco A. |
| Código morto (não usado na tela) | #192 | Função de fechar atuação com pergunta: **não** está ligada. Esc no modal de ciência fecha sem perguntar. |

**#156 (atualizado).** O build **não** gera mais os atalhos `Nexus_demo.html` / `Nexus_demo_experimental.html`. Gera só os três arquivos da tabela do início. Se aqueles nomes ainda existirem no disco, o build **apaga**.

---

# Bloco H — O que não mudou (e o e-mail)

### #196 Planilha e `doGet`

Publicar o HTML **não** muda a Planilha nem o endereço clássico do app no Google.

### #197 E-mail das 7h — **ainda o de antes**

**Para que serve (quando alguém pedir o lote).** O resumo da manhã deveria acompanhar a tela: não tratar interrupção como termo; incluir vencidos do grupo 1; janela por grupo.

**O que você recebe hoje.** A lógica **antiga** (90 dias, fila v1, sem gaveta). A **tela** pode mostrar a CDA na gaveta ou no vermelho da Beta; o **e-mail** não.

**Isto não foi feito de propósito.** É o próximo lote natural, se você quiser tela e caixa de entrada alinhadas.

### #198 Importar eproc e XLS da Procuradoria

**Não foram removidos.** Continuam na aba Importar. (O precedente do projeto: não apagar via “não usada”.)

### #199 Sync Drive / Planilha

⬆⬇ e auto-sync iguais. Só o botão demo saiu da sidebar (#50).

### #200 Dados demo

As cinco operações fictícias são as **mesmas**: Fachada Norte, Laranjas do Vale, Sucessão Empresarial Sul, Holding Atlântico, Agro Horizonte.

### #201 Mesa de pins

Não foi o alvo. Continua no menu. Daí as duas “Mesas”.

### #202 Campos novos são opcionais

Adiar e a marca de status automático ficam no cadastro. JSON antigo abre nas duas edições. Se você adiar na Beta e voltar ao clássico, o campo **fica parado**: o clássico **não esconde** a linha por causa dele.

---

# Bloco I — DEBCAD (clássico e Beta) — **adotado**

**Para que serve.** LC 208/2024: protesto extrajudicial **lavrado** a partir de 03/07/2024 **interrompe a ordinária**. O motor já sabia (`int_protesto_extrajudicial`). O relatório Debcad **não entregava** o fato: o bloco PROTESTOS ia parar nas “atualizações” e sumia. A AGROTRAC (CDA 149630450, inscrição 08/05/2021, não ajuizada) aparecia **consumada em 08/05/2026** — grau máximo de urgência — quando o lavrado de **17/03/2026** empurra o termo para **17/03/2031**.

### #203 Lê PROTESTOS e AJUIZAMENTO

Cabeçalhos sem depender de acento. Para em FIM DO RELATÓRIO. “Não há Ajuizamento.” não inventa processo.

### #204 Cria o evento na data da **efetivação do lavrado**

Não é o protocolo no tabelionato (08/03/2026 neste PDF) nem a criação da ocorrência (20/03/2026). É a linha **Protesto lavrado**.

### #205 e #207 Ficha **Histórico DEBCAD**

Campo na CDA, atualizado a cada reimportação. Bloco recolhido: fases, card do protesto (marca a linha que gerou o evento), ajuizamento, atualizações atrás de outro clique.

### #206 Some a nota cinza `[Debcad] Histórico`

O parágrafo “4 fases: 03/05/2021 — Fase 514…” era ilegível. Só essa nota é apagada; as outras ficam.

### #208 Rede de testes no PDF real

Se o leitor do protesto quebrar de novo, o teste da AGROTRAC falha.

**Como testar.** Importar `RelatorioCompleto-debcad-149630450.pdf` na CDA 149630450. Ordinária com termo 17/03/2031. Histórico DEBCAD com o lavrado marcado.

---

# Bloco J — SIDA Relatório Completo (clássico e Beta) — **adotado**

**Para que serve.** O PDF novo (VERTICALI, 54 inscrições, 18/09/2026) é mais largo: `CPF/ CNPJ:`, `R $ 48.088,85`, juízo na página seguinte, protesto partido em duas linhas. Sem ler **rescisão** e **protesto lavrado**, a ordinária e o 1+5 saem errados. Sem a ficha, CADIN e pagamentos somem da vista — e **não devem** virar evento de prescrição (o motor não tem tipo para CADIN; pagamento não é interrupção).

### #209 Lê por seções

Dados Gerais, Devedores, Parcelamentos (deferidos e indeferidos), Protestos com eventos, Ocorrências com data+hora juntas. Para no FIM DO RELATÓRIO.

### #210 e #212 Ficha **Histórico SIDA**

Ocorrências · parcelamentos · protestos · devedores. Aberto: valores, juízo, tabela de devedores (principal + corresponsáveis), parcelamentos com a linha do evento marcada, card de protesto, CADIN/pagamentos atrás de outro clique.

### #211 Não volta o parágrafo `[SIDA]`

Trava para reimportação de dados antigos.

### #213 Eventos **só** no que é inequívoco — **sua decisão, ratificada**

| Entra como evento de prazo | Não entra (só na ficha / log) |
|---|---|
| Parcelamento **deferido** com adesão/rescisão; cancelamento **depois** de deferido | **AGUARDANDO** (pedido SISPAR 17/09/2026) |
| Protesto **LAVRADO** (data = efetivação, ex. 23/02/2026 na CDA `00 2 19 021348-10`) | **INDEFERIMENTO** |
| Falência se a data veio preenchida | CADIN, pagamentos, bloqueio de ajuizamento |

Se o AGUARDANDO virasse evento, o pedido de 17/09/2026 **pausaria** o prazo sem deferimento.

### #214 (e depois #216) Texto do protesto

Na **ordinária**: “interrompe a prescrição ordinária (LC 208/2024)” se após 03/07/2024. Antes: “não interrompe (anterior à LC 208/2024)”. A conta já fazia isso; a frase caía em “registro do caso”.

### #215 Testes no PDF das 54 CDAs

**Como testar.** Importar o Relatório Completo na operação da Verticali (CDAs já cadastradas pela planilha). Log: 54 inscrições; protesto LC 208 só nas lavradas; sem evento no AGUARDANDO. Abrir Histórico SIDA.

---

# Bloco K — Frases das colunas — **adotado**

**Só texto. A conta não muda.**

### #216 Protesto na **intercorrente**

O protesto interrompe o art. 174, **não** o ciclo de 1 ano + 5 anos da execução. A linha da intercorrente não pode repetir “interrompe a prescrição ordinária”.

**O que você vê.** Intercorrente, pós-LC 208: **não encerra o ciclo de 1 ano + 5 anos**. Ordinária: permanece a frase da LC 208. Antes da LC 208, nas duas: **não interrompe (anterior à LC 208/2024)**.

### #217 Início depois da **rescisão**

O 1+5 da política da casa nasce na **queda** do parcelamento, não numa ciência inventada.

**O que você vê.** Datas da intercorrente com a **data da rescisão**. No primeiro ano: “Primeiro ano após a rescisão do parcelamento.” Parcelamento **ainda vigente** (CDA do print): continua **Início: sem ciência lançada**.

---

# Bloco L — Fichas de pessoa (19/09/2026) — **adotado**

**Não estava no inventário de 18/09.** Nasceu ao importar o mesmo SIDA da Verticali.

**Para que serve.** O filtro **Filtrar por pessoa** só funciona se Himugui, Nivaldo e Daniel forem **uma ficha cada**, ligadas a todas as CDAs em que o relatório os aponta. Sem isso, o filtro vira uma parede de botões (179) e você não consegue recortar a operação pelo corresponsável.

**O que acontecia.** O Relatório Completo lista os mesmos três corresponsáveis em **cada** inscrição. O painel criava uma ficha nova a cada CDA. A Verticali já existia, por isso ficou uma só (59). Os outros apareciam dezenas de vezes com (1).

**O que você vê agora.** Na abertura do painel, fichas do mesmo CPF/CNPJ **na mesma operação** se juntam. Os vínculos com as inscrições passam para a que fica. Filiais (CNPJs 14 distintos) **não** se misturam. Na próxima importação, o mesmo documento reaproveita a ficha.

**Como testar.** Recarregar (F5) a operação Verticali. O filtro deve ficar perto de: Todas · Verticali · Himugui · Nivaldo · Daniel. Reimportar o PDF não deve multiplicar nomes.

---

# Resumo: o que ainda depende de você

**Já decidido:** A, C (acabamento), I, J (incluindo o que não vira evento), K, L.

**Já publicado, à espera de “mantenho a Beta assim?”**

1. Fila nova **só na Beta**; clássico na fila antiga. (#21–#22)
2. “Aguardando reconhecimento” visível, sem alarme. (#23–#24)
3. Status parcelada sem adesão = cadastro a completar; o prazo segue. (#25)
4. Ordinária vencida em CDA ajuizada = urgente. (#26)
5. CNJ de IDPJ pede vínculo à EF. (#27)
6. “Ainda não pode ter prescrito” não vira alarme só por IDPJ sem constrição. (#28)
7. Recado de IDPJ saiu da linha e **não ganhou tela** — quer o recado uma vez no processo? (#29, #123)
8. Análise colada não rebaixa grupo 1. (#30)
9. Frases da Mesa; “resultado útil” permanece na de vigiar; janela 180 dias. (#31, #152)
10. Despertador (data de rever). (#32)
11. Parcelamento vigente na gaveta, não some. (#33)
12. Adiar: tetos 14/30/7 e furos. (#34–#35)
13. Teto de 12 no vermelho. (#85, #92)
14. PRECISA DE VOCÊ como definido em #86 (R$ 5,6 mi fora).
15. R$ do cartão Prazos = só grupo 1. (#107–#108)
16. Sisbajud não pinta Garantida na Beta. (#121)
17. Casco da Beta (sidebar); Demo antiga não volta por interruptor. (#61+)
18. Duas “Mesas” — quer renomear? (#201)
19. E-mail das 7h **ainda antigo**. (#197)

Itens de tela sem escolha jurídica (Esc, toast, ✕, tooltips, Briefing vazio, semana de hoje, Nova intimação, ATRASADA, busca CDA, chips zero, dicas abaixo, Aparência): pacote de acabamento da edição que você usar.

---

## Três jeitos de usar (o código já está no 2.0.12)

**1. Clássico no dia a dia**  
Contas certas, importação SIDA/DEBCAD, fichas de pessoa corrigidas, ⚙ que fecha. Sem Mesa, sem gaveta, sem fila nova. A Beta existe no ⚙, você não liga.

**2. Beta no dia a dia** — o plano original  
⚙ → Nova versão (beta) ou `demo_experimental.html`. Mesa padrão. Lista a um clique. Alarme ≠ consciência.

**3. Beta, Prazos na Lista**  
Fila nova + Hoje + Agenda, sem o bloco vermelho nem a gaveta na cara. Silenciados existem no motor; **você não tem a gaveta** nessa vista.

---

## O que ainda não foi feito (fora deste lote)

- Alinhar o **e-mail da manhã** à tela.
- Mostrar o recado de IDPJ **uma vez** no processo.
- Renomear uma das duas Mesas.
- Redesign visual P2 em diante (Grafo/Insights, processos colapsados) — outro caderno (`docs/MELHORIAS.md`).

---

*Para marcar item a item no sentido técnico, o inventário permanece em `docs/INVENTARIO-BETA.md`. Este relatório é o texto para operar e decidir. Versão do painel: 2.0.12.*
