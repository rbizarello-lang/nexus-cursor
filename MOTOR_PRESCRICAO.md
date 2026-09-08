# Regras de prazos

**Versão** `2026.09` · 8 set 2026 · `ruleVersion: 2026.09`

Este texto diz **como o Nexus conta**. A tela da inscrição fala o caso; as bases legais ficam aqui. Na dúvida, o app **prefere alarmar** a deixar o prazo vencer em silêncio.

---

## R1 — Três relógios

**Frase.** Cada inscrição tem até três prazos: decadência (constituir o crédito), prescrição ordinária (até o ajuizamento) e intercorrente (depois de ajuizada). Eles não se misturam.

**Base.** Arts. 150, § 4º, e 173 do CTN; art. 174 do CTN; art. 40 da LEF.

**Exemplo.** CDA inscrita em 18/05/2009, ajuizada em 10/11/2009: a ordinária parou na propositura; a intercorrente só começa com ciência lançada; a decadência fica sem cálculo se faltar período e modalidade.

**Na tela.** Três colunas. Cada uma com Situação, Datas, Ocorrências, Estimativas e Conferir.

---

## R2 — O 1 ano + 5 anos só começa com ciência lançada

**Frase.** O prazo de 1 ano + 5 anos só inicia quando há ciência da Fazenda de não localização do devedor ou de ausência (ou insuficiência) de bens. Ajuizar, citar ou arquivar, sozinhos, não iniciam.

**Base.** Art. 40 da LEF; Súmula 314/STJ; Temas 566–571/STJ; Tema 390/STF.

**Exemplo.** Execução ajuizada em 10/11/2009, sem certidão de não localização: o ciclo legal ainda não começou. O ajuizamento não abre o 1 ano + 5 anos.

**Na tela.** Intercorrente: “sem ciência lançada”. Grupo 5 (ainda impossível) ou 4, conforme o piso operacional.

---

## R3 — Resultado útil encerra o ciclo

**Frase.** Citação efetiva, penhora, bloqueio positivo ou indisponibilidade **na própria execução** encerram o ciclo. Se o pedido entrou na janela, o efeito retroage à data do pedido.

**Base.** Tema 568/STJ; REsp 2.174.870/STJ.

**Exemplo.** Penhora em 26/01/2024 encerra o ciclo. Não pode ter prescrito antes de 26/01/2030 (penhora + 1 ano + 5 anos).

**Na tela.** Situação: “Ciclo encerrado pela penhora de dd/mm/aaaa.” Selo `calculado`. Quem lança o Sisbajud decide se o bloqueio encerra; o valor é só informação.

---

## R4 — Pausas param e retomam

**Frase.** Parcelamento vigente, embargos com efeito suspensivo, liminar, depósito, falência/recuperação e outras pausas do art. 151 **param** o relógio e **não zeram**.

**Base.** Art. 151 do CTN.

**Exemplo.** Pausa de 10/01/2022 a 10/01/2023 empurra o termo em um ano. O dia da pausa, o dia anterior e o dia seguinte não se confundem.

**Na tela.** Situação: “Prazo pausado.” Termo projetado na coluna Datas.

---

## R5 — Parcelamento: adesão interrompe; rescisão abre ciclo novo

**Frase.** A adesão interrompe e pausa. A rescisão abre um ciclo novo de 1 ano + 5 anos (padrão da casa). Dá para marcar só 5 anos na ficha da inscrição.

**Base.** Art. 174, parágrafo único, IV, do CTN; Súmula 653/STJ. O 1+5 após a rescisão é **decisão da casa**, não tese do Tema 566.

**Exemplo.** Rescisão em 27/05/2020 → termo de 27/05/2026 no padrão 1+5.

**Na tela.** Ocorrência de adesão e de rescisão. A memória técnica (botão Copiar) traz a base legal; a coluna não fala “política”.

---

## R6 — Parcelamento sem data de fim: pior caso, estimado

**Frase.** Sem data de encerramento, o app supõe rescisão no dia da adesão. O resultado é **estimado** e pede a data. Não declara vencido calculado.

**Base.** Decisão operacional da casa (P1: melhor alarmar). Ausência de fim **não prova** vigência.

**Exemplo.** Adesão em 28/01/2018 sem rescisão: o app estima o pior caso e pede “encerrou? Quando?”.

**Na tela.** Selo `estimado`. Grupo 2 (Provável — conferir). Item em Conferir nos autos.

---

## R7 — Constrição no IDPJ/MCF pausa, não encerra

**Frase.** Constrição no incidente pausa as execuções abrangidas desde o pedido. Não encerra o ciclo da execução. O app **sempre** mostra o cenário sem a pausa. Cautelar fiscal é tese não pacificada.

**Base.** Propagação operacional; MCF como tese fazendária.

**Exemplo.** IDPJ nº 5009999… com indisponibilidade em 01/02/2023: a EF abrangida fica pausada; se a pausa não for reconhecida, o termo sem pausa aparece em Conferir.

**Na tela.** Ocorrência com selo “IDPJ nº …” ou “MCF nº …”. Grupo 2 se o cenário sem pausa já venceu.

---

## R8 — “Não antes de”

**Frase.** Consumação é impossível antes do ato mais recente que precede a ciência (protocolo, citação ou constrição) + 1 ano + 5 anos.

**Base.** Operacional; não substitui o Tema 566.

**Exemplo.** Citação em 01/03/2020 → não pode ter prescrito antes de 01/03/2026.

**Na tela.** Bloco Estimativas: “Não pode ter prescrito antes de dd/mm/aaaa — [fato] + 1 ano + 5 anos.” Grupo 5 enquanto essa data ainda não chegou.

---

## R9 — “Não depois de”

**Frase.** Arquivamento **datado** + 1 ano + 5 anos + pausas posteriores: passado isso, a consumação é provável. O teto usa **+6 anos** (1+5), não +5.

**Base.** Operacional, a partir do arquivo datado; o Tema 566 não usa o arquivo como início.

**Exemplo.** Arquivo em 01/01/2018, sem pausas depois → teto em 01/01/2024.

**Na tela.** Estimativa “Não deveria passar de dd/mm/aaaa”. Se passou, grupo 2 (estimado).

---

## R10 — Suspensão do art. 40 com data vale como ciência

**Frase.** Evento “suspensão do art. 40” **com data**, sem ciência ao lado, vale como ciência, **com aviso**. O status “Arquivada art. 40” sem data **não** substitui isso.

**Base.** Quem lançou a suspensão datada registrou a ciência; o status sozinho não prova a data.

**Exemplo.** Suspensão art. 40 em 01/06/2019, sem certidão: o ciclo começa nessa data, e Conferir pede a certidão.

**Na tela.** Item de conferência. Arquivada sem data sobe ao grupo 2.

---

## R11 — Data digitada e planilha não substituem o cálculo

**Frase.** A data na ficha da CDA e a previsão da planilha nunca calam o termo calculado. Divergência vira item de cadastro.

**Base.** Decisão operacional (P1).

**Exemplo.** Ficha diz 01/01/2030; cálculo diz 26/01/2024. O cálculo prevalece; Conferir aponta o conflito.

**Na tela.** Grupo 3 (cadastro a completar) se só falta conferir a divergência. O prazo grave do grupo 1 é o calculado.

---

## R12 — Ordinária ajuizada só olha o que veio antes da propositura

**Frase.** Com execução vinculada, a prescrição ordinária ignora penhora, parcelamento e demais fatos **posteriores** ao ajuizamento. O quinquênio do art. 174 para na propositura.

**Base.** Art. 174, parágrafo único, I, do CTN; Tema 383/STJ.

**Exemplo.** Inscrição 18/05/2009, ajuizamento 10/11/2009, penhora 26/01/2024: a ordinária está interrompida em 10/11/2009; a penhora não a reinicia.

**Na tela.** Coluna ordinária: Início na inscrição (ou na constituição); Fim “interrompido em [ajuizamento]”. Penhora e parcelamento ficam na coluna intercorrente.

---

## Decisões de política (não são lei)

Estas escolhas da casa entram no cálculo. Não são teses fechadas:

1. **Depois da rescisão:** padrão **1 ano + 5 anos** (mais favorável à União). Na ficha, dá para marcar só 5 anos.
2. **Parcelamento sem fim:** pior caso = rescisão no dia da adesão; selo `estimado`; grupo 2.
3. **Fila urgente:** 180 dias (grupos 1 e 2 no radar, KPI e barra).
4. **E-mail diário:** janela de 90 dias, e só então o grupo 4 entra no recorte.
5. **Teto operacional:** arquivo datado + **6 anos** (1+5), não +5.
6. **Sisbajud:** quem lança o bloqueio decide se houve resultado útil. Não há exceção por valor irrisório.

---

## O que a tela da inscrição não mostra (e por quê)

A coluna da CDA fala o **caso**: datas, fatos, efeito no prazo. Não usa: Tema, Súmula, política, piso, teto, dies, marco, CENÁRIO.

Essas palavras ficam neste documento e na **memória técnica** (botão Copiar / Baixar HTML), para colar em peça.

O vermelho é da faixa do grupo, não de um ícone no texto.

---

## Histórico das regras

- **2026.09** (8 set 2026) — Doze regras numeradas. Parcelamento sem fim = estimado (grupo 2). Sem exceção de Sisbajud irrisório. Aba Prazos extintivos. Três colunas em linguagem do caso. Ordinária ajuizada ignora fatos posteriores ao protocolo.
- **Anterior** — O motor já contava 1+5 em anos civis e não inventava ciência a partir do ajuizamento. O que mudou foi a classificação da fila e o vocabulário da tela.
