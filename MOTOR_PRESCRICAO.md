# Regras de prazos

**Versão** `2026.10` · 26 set 2026 · `ruleVersion: 2026.10`

Este texto diz **como o Nexus conta**. A tela da inscrição fala o caso; as bases legais ficam aqui e aparecem, discretas, ao passar o mouse. Na dúvida, o app **prefere alarmar** a deixar o prazo vencer em silêncio, sem encher a fila de avisos.

---

## Duas datas: cedo e tarde

Quando a lei, o STJ ou um dado que falta permitem duas leituras, o prazo ganha **duas datas**:

- **Data cedo**: a leitura mais desfavorável à União. É ela que **dá o alarme**.
- **Data tarde**: a tese da União. É a data que a peça sustenta e o resultado principal do cálculo.

O selo **calculado** só aparece quando as duas coincidem; senão o selo é **faixa**. A faixa tem motivo, e o motivo diz o que fazer:

- **Faixa de tese** (divergência de leitura): a providência é processual. Vai ao grupo 1 quando a data cedo entra na janela de 90 dias.
- **Faixa de dado** (falta um fato): a providência é documental. Vira **pedido de dado** (grupo 3) quando a data cedo entra na janela; passada a data cedo, sobe ao grupo 2. Só vai à aba Consumada quando a data tarde também passou.

Os motivos de faixa: rescisão (A1), pedido de parcelamento (A2), falência (A4), pausa sem fim (A5), parcelamento vigente (A6), ciência eletrônica (B1), só a decisão de suspensão (B2), só o arquivamento (B3), constituição não informada (C1) e decadência (D3).

---

## R1 — Três relógios

**Frase.** Cada inscrição tem até três prazos: decadência (constituir o crédito), prescrição ordinária (até o ajuizamento) e intercorrente (depois de ajuizada). Os três aparecem sempre. Só alarma o relógio que você controla: CDA **não ajuizada**, a ordinária; **ajuizada**, a intercorrente. A decadência nunca alarma.

**Base.** Arts. 150, § 4º, e 173 do CTN; art. 174 do CTN; art. 40 da LEF.

**Exemplo.** CDA inscrita em 18/05/2009, ajuizada em 10/11/2009: a ordinária parou na propositura e fica só na coluna; a intercorrente só começa com ciência lançada; a decadência fica sem cálculo se faltar período e modalidade.

**Na tela.** Três colunas. Cada uma com Situação, Datas (com a faixa cedo–tarde, se houver), Ocorrências, Estimativas e Conferir, e uma régua do tempo com fatos, pausas e a faixa. Decadência pelo art. 173, I: data cedo no ano seguinte ao **fato gerador**; data tarde no ano seguinte ao **vencimento** (AgInt nos EDcl no AgInt no REsp 2.025.700). A notificação do lançamento obsta a decadência (Súmula 622/STJ).

---

## R2 — O 1 ano + 5 anos só começa com ciência lançada

**Frase.** O prazo de 1 ano + 5 anos só inicia quando há ciência da Fazenda de não localização do devedor ou de ausência (ou insuficiência) de bens. Ajuizar, citar ou arquivar, sozinhos, não iniciam. Na ciência eletrônica, a data cedo é a **disponibilização** da intimação; a tarde, a **abertura** ou o 10º dia.

**Base.** Art. 40 da LEF; Súmula 314/STJ; Temas 566–571/STJ; Tema 390/STF; Lei 11.419, art. 5º, § 3º.

**Exemplo.** Intimação disponibilizada em 05/03/2020 e aberta em 15/03/2020: data cedo 05/03/2026; data tarde 15/03/2026. Sem abertura, o formulário grava o 10º dia.

**Na tela.** Intercorrente: “sem ciência lançada” enquanto não há ciência. O formulário do fato tem dois campos: disponibilização e abertura (ou 10º dia).

---

## R3 — Resultado útil encerra o ciclo

**Frase.** Citação efetiva, penhora, bloqueio positivo ou indisponibilidade **na própria execução** encerram o ciclo. Se o pedido entrou na janela, o efeito retroage à data do pedido. Passados **6 anos** da penhora ou do bloqueio sem outro fato lançado, a CDA vai a uma **lista própria** para análise caso a caso.

**Base.** Tema 568/STJ; REsp 2.174.870/STJ (Sisbajud e CNIB interrompem). Nova inércia exige nova ciência (Tema 566).

**Exemplo.** Penhora em 26/01/2024 encerra o ciclo. Não pode ter prescrito antes de 26/01/2030 (penhora + 1 ano + 5 anos). Penhora de 01/03/2017 sem nada depois: em 01/03/2023 entra na lista “Penhora antiga — analisar”.

**Na tela.** Situação: “Ciclo encerrado pela penhora de dd/mm/aaaa.” Selo `calculado`. Quem lança o Sisbajud decide se o bloqueio encerra; o valor é só informação. Na lista de penhora antiga, “Marcar analisada” registra a conclusão; a CDA volta à lista com fato novo ou em 1 ano.

---

## R4 — Pausas param e retomam

**Frase.** Parcelamento vigente, embargos com efeito suspensivo, liminar, depósito e outras pausas do art. 151 **param** o relógio e **não zeram**. A **recuperação judicial não pausa**. A **falência** pausa só na data tarde. Pausa **sem data de fim**: a data cedo presume que acabou na última conferência (“ainda vale”); a tarde mantém a pausa.

**Base.** Art. 151 do CTN; Lei 11.101, art. 6º, § 7º-B (a recuperação judicial não suspende a execução fiscal).

**Exemplo.** Liminar em 01/03/2021 lançada sem fim e conferida em 01/09/2021: data cedo 02/12/2025, mesmo que a tela da pausa ainda diga “vigente”. O botão “Ainda vale” move a conferência para hoje e a data cedo junto.

**Na tela.** Situação: “Prazo pausado.” A ficha lista as pausas sem fim com a última conferência e o botão “Ainda vale”. Lançar pausa sem fim conta como conferida no dia. Eventos antigos “Falência / Recuperação” valem como recuperação judicial, sem pausa, até você reclassificar.

---

## R5 — Parcelamento: adesão interrompe; rescisão abre prazo novo

**Frase.** A adesão (parcelamento ou **transação**) interrompe e pausa. Na rescisão, a data cedo conta **5 anos do inadimplemento**; a data tarde conta da rescisão: **1 ano + 5 anos** na intercorrente (padrão da casa) e 5 anos na ordinária. Sem a data do inadimplemento, a rescisão vale nas duas pontas. O **pedido** de parcelamento ainda sem deferimento, ou indeferido, interrompe na data do pedido, sem pausa. O **reconhecimento da dívida** e outra causa que você declarar interrompem as duas prescrições (5 anos).

**Base.** Art. 174, parágrafo único, IV, do CTN; Súmula 653/STJ. O STJ diverge sobre o marco da rescisão: inadimplemento (REsp 1.922.063; REsp 2.135.126) ou exclusão formal (AgInt no REsp 2.169.564; REsp 2.186.721). O 1+5 é **decisão da casa**.

**Exemplo.** Última parcela paga em 20/03/2021, exclusão em 15/06/2021: data cedo 20/03/2026; data tarde 15/06/2027.

**Na tela.** Ocorrência de adesão e de rescisão. O formulário da rescisão pede o inadimplemento. A memória técnica traz a base legal; a coluna não fala “política”.

---

## R6 — Parcelamento vigente sai do alarme até perto da data cedo

**Frase.** Enquanto o parcelamento está vigente, o prazo não corre na data tarde. A data cedo presume a rescisão logo após a **última conferência** (conferência + 5 anos). A CDA fica fora do alarme e volta à fila **90 dias antes** da data cedo, pedindo “O parcelamento segue vigente?”. Reimportar o SIDA ou o Debcad com o parcelamento ativo conta como conferência. Ficha marcada “parcelada” sem adesão lançada é tratada como parcelada, fora do alarme.

**Base.** Art. 151, VI, do CTN; art. 174, parágrafo único, IV, do CTN; Súmula 653/STJ.

**Exemplo.** Adesão em 28/01/2018, conferida na importação de 01/06/2026: volta à fila em 03/03/2031 (01/06/2031 − 90 dias).

**Na tela.** Silenciados: “Parcelamento vigente · até dd/mm/aaaa”. Na fila, ação de um clique “Ainda vale”.

---

## R7 — IDPJ e cautelar: constrição interrompe; suspensão da execução pausa

**Frase.** Constrição obtida no IDPJ ou na cautelar fiscal vale como **interrupção** das execuções abrangidas, igual a uma penhora, desde o pedido. A dúvida sobre esse efeito **não vai à fila geral**: aos 5 anos da informação da constrição, o card do processo acende um aviso discreto pedindo esclarecimento. A **suspensão da execução** pelo incidente, mesmo sem constrição, pausa a intercorrente nas duas datas até o fim do incidente.

**Base.** Tese fazendária, não pacificada (sobretudo na cautelar fiscal). CPC, art. 134, § 3º (suspensão pelo incidente).

**Exemplo.** Indisponibilidade pedida no IDPJ em 01/02/2023 e informada em 01/03/2023: o ciclo da EF abrangida encerra em 01/02/2023; em 01/03/2028 o card pede esclarecimento (a partir de 90 dias antes).

**Na tela.** Ocorrência com selo “IDPJ nº …” ou “MCF nº …”. “IDPJ sem constrição lançada” aparece uma vez, no cabeçalho do processo, na Mesa e na Lista.

---

## R8 — “Não antes de”

**Frase.** Consumação é impossível antes do ato mais recente que precede a ciência (protocolo, citação ou constrição) + 1 ano + 5 anos.

**Base.** Operacional; não substitui o Tema 566.

**Exemplo.** Citação em 01/03/2020 → não pode ter prescrito antes de 01/03/2026.

**Na tela.** Bloco Estimativas: “Não pode ter prescrito antes de dd/mm/aaaa — [fato] + 1 ano + 5 anos.” Grupo 5 enquanto essa data ainda não chegou.

---

## R9 — Só o arquivamento datado

**Frase.** Sem ciência lançada e com arquivamento **datado**: data cedo = arquivamento + 5 anos; data tarde = arquivamento + 6 anos (1+5), mais as pausas posteriores. 90 dias antes da data cedo, o app pede a ciência.

**Base.** Art. 40, § 2º, da LEF: o arquivamento vem depois do ano de suspensão. O Tema 566 não usa o arquivo como início.

**Exemplo.** Arquivo em 01/06/2021, sem pausas depois: pedido da ciência a partir de 02/03/2026; data cedo 01/06/2026; data tarde 01/06/2027.

**Na tela.** Estimativas “Pode ter vencido a partir de” e “Não deveria passar de”. Passada a data cedo, grupo 2.

---

## R10 — Suspensão do art. 40 com data vale como ciência

**Frase.** Evento “suspensão do art. 40” **com data**, sem ciência ao lado, vale como ciência na data tarde, **com aviso**. A data cedo conta do pedido de suspensão da Fazenda, se houver, ou do último ato conhecido antes da decisão. O status “Arquivada art. 40” sem data **não** substitui isso.

**Base.** Quem lançou a suspensão datada registrou a ciência; a ciência pode ser anterior à decisão (Tema 566).

**Exemplo.** Citação em 01/03/2016 e suspensão em 01/06/2019, sem certidão: data cedo 01/03/2022; data tarde 01/06/2025. Conferir pede a certidão.

**Na tela.** Pedido de dado (“Lançar a data da ciência”). Arquivada sem data sobe ao grupo 2.

---

## R11 — Data digitada, planilha e análise importada não substituem o cálculo

**Frase.** A data na ficha da CDA, a previsão da planilha e a análise importada nunca calam o termo calculado. Divergência vira nota que pede o fato que a justifica.

**Base.** Decisão operacional.

**Exemplo.** Análise diz “ciclo encerrado”; o cálculo diz vencido em 26/01/2024. A CDA fica no grupo 1 e a nota pede o fato que encerrou o ciclo.

**Na tela.** Selo “análise diverge”, com a nota ao passar o mouse. O prazo grave do grupo 1 é o calculado.

---

## R12 — Ordinária ajuizada só olha o que veio antes da propositura

**Frase.** Com execução vinculada, a prescrição ordinária ignora penhora, parcelamento e demais fatos **posteriores** ao ajuizamento. O quinquênio do art. 174 para na propositura. Consumada antes do ajuizamento, aparece só na coluna, sem alarme. Despacho de citação anterior a 09/06/2005: só a citação interrompia; a coluna diz isso e Conferir pede a data da citação.

**Base.** Art. 174, parágrafo único, I, do CTN; Tema 383/STJ; LC 118/2005 (AgInt no REsp 2.047.039).

**Exemplo.** Inscrição 18/05/2009, ajuizamento 10/11/2009, penhora 26/01/2024: a ordinária está interrompida em 10/11/2009; a penhora não a reinicia.

**Na tela.** Coluna ordinária: “Consumada antes do ajuizamento… Conferir interrupções anteriores” ou “Interrompida se houve citação (regra anterior à LC 118/2005)”. Penhora e parcelamento ficam na coluna intercorrente.

---

## R13 — Constituição definitiva pela modalidade

**Frase.** Sem a data de constituição definitiva, o app a calcula pela modalidade: declarado, entrega ou vencimento, o que for posterior; lançamento de ofício, notificação (ou decisão definitiva) + prazo de pagamento (30 dias se não informado). Sem essas datas, a data cedo conta do vencimento ou do fim do período de apuração; a tarde, da inscrição.

**Base.** Art. 174 do CTN; Súmulas 436 e 622/STJ; Tema 383/STJ.

**Exemplo.** Declarado, vencimento 30/04/2020, sem entrega informada, inscrição 10/01/2022: data cedo 30/04/2025; data tarde 10/01/2027.

**Na tela.** Formulário da CDA com vencimento, entrega da declaração, notificação, decisão definitiva e prazo de pagamento; a constituição calculada aparece abaixo. O vencimento é manual: os relatórios SIDA e Debcad não o trazem.

---

## R14 — A fila: 90 dias, tese e dado

**Frase.** Todo aviso usa **90 dias** de antecedência, contados da data cedo. Não há teto de linhas em “Precisa de você”. A ordem é a data cedo e, no empate, o maior valor. A intercorrente aparece agrupada por execução; a ordinária, por CDA. Prescrição já arguida, aguardando decisão, fica sem vermelho, com lembrete fixo 60 dias depois da marcação.

**Base.** Decisão operacional.

**Exemplo.** Rescisão sem inadimplemento em 01/12/2021: data cedo 01/12/2026; entra no grupo 1 em 02/09/2026.

**Na tela.** Grupos 1 a 6 e a lista 7 (penhora antiga). O valor do cartão Prazos soma só o grupo 1.

---

## R15 — Redirecionamento (informativo)

**Frase.** O card do processo mostra o prazo para redirecionar a execução ao sócio: 5 anos da citação da empresa; se a dissolução irregular é posterior à citação, 5 anos dela. Não alarma.

**Base.** Tema 444/STJ (REsp 1.201.993): a prescrição exige inércia da Fazenda no período.

**Exemplo.** Citação em 01/05/2018 e certidão de dissolução em 01/02/2020: prazo até 01/02/2025. Pedido de redirecionamento de 01/06/2024: dentro do prazo.

**Na tela.** Linha “Redirecionamento” no card do processo. Lance a dissolução irregular e o pedido como registros da família Situação do feito.

---

## Decisões de política (não são lei)

Estas escolhas da casa entram no cálculo. Não são teses fechadas:

1. **Depois da rescisão:** data tarde **1 ano + 5 anos** na intercorrente (mais favorável à União); data cedo, 5 anos do inadimplemento. Na ficha, dá para marcar só 5 anos.
2. **Parcelamento vigente:** fora do alarme até 90 dias antes de conferência + 5 anos. Reimportação conta como conferência.
3. **Janela de alarme:** 90 dias para tudo, contados da data cedo.
4. **Arquivamento datado:** data tarde + 6 anos (1+5); data cedo + 5.
5. **Sisbajud:** quem lança o bloqueio decide se houve resultado útil. Não há exceção por valor.
6. **Garantida:** nenhuma constrição marca a CDA como garantida automaticamente; a garantia se marca à mão.
7. **Constrição no incidente:** vale como interrupção; a dúvida vai ao card do processo aos 5 anos, não à fila geral.
8. **Penhora antiga:** 6 anos da penhora ou do bloqueio sem outro fato vão à lista própria.
9. **Inscrição sem processo:** só alarma pela ordinária, na janela de 90 dias.

---

## O que a tela da inscrição não mostra (e por quê)

A coluna da CDA fala o **caso**: datas, fatos, efeito no prazo. Não usa: Tema, Súmula, política, piso, teto, dies, marco, CENÁRIO.

Essas palavras ficam neste documento, na **memória técnica** (botão Copiar / Baixar HTML), para colar em peça, e no texto que aparece ao passar o mouse.

O vermelho é da faixa do grupo, não de um ícone no texto.

---

## Histórico das regras

- **2026.10** (26 set 2026) — Duas datas por prazo (cedo e tarde), com o alarme pela cedo. Rescisão pelo inadimplemento na data cedo; pedido de parcelamento sem deferimento e transação; reconhecimento declarado interrompe a intercorrente. Recuperação judicial não pausa; falência só na data tarde. Pausa sem fim e parcelamento vigente presumem o fim na última conferência (“ainda vale”). Ciência eletrônica pela disponibilização; suspensão do art. 40 e arquivamento com data cedo. Constrição no incidente vale como interrupção, com aviso no card aos 5 anos. Penhora antiga em lista própria. Constituição pela modalidade; decadência em faixa; regra anterior à LC 118. Janela de 90 dias, sem teto na Mesa, fila agrupada por execução. Cálculo prevalece sobre a análise importada. Ordinária de CDA ajuizada só na coluna. Garantida só à mão. Régua do tempo nas telas. Redirecionamento informativo.
- **2026.09** (8 set 2026) — Doze regras numeradas. Parcelamento vigente sai da fila (sem estimar data de fim). Sem exceção de Sisbajud por valor. Aba Prazos extintivos. Três colunas em linguagem do caso. Ordinária ajuizada ignora fatos posteriores ao protocolo. Inscrição sem processo só alerta se a ordinária está vencida ou iminente. Suspensão da execução por IDPJ/cautelar, mesmo sem constrição.
- **2026.09a** (18 set 2026) — Contagem: pausas sobrepostas são fundidas antes de descontar; a primeira ciência inicia o ciclo (ciência posterior não reinicia); evento com data depois de hoje não entra no cômputo; 29/02 aniversaria no último dia de fevereiro; ordinária ajuizada deixa de usar o status “seguro”. Na tela: artigo pela/pelo conforme o fato; R10 mostra a data da suspensão do art. 40; pedido sem resultado com termo já passado deixa de dizer “em curso”.
- **Anterior** — O motor já contava 1+5 em anos civis e não inventava ciência a partir do ajuizamento. O que mudou foi a classificação da fila e o vocabulário da tela.
