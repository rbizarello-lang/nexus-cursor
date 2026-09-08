# O que mudou na prescrição (uso prático)

Versão **1.2.20**, publicada no Apps Script em 8 set 2026.

Este texto é para o dia a dia. Não é manual técnico.

## O que não mudou

O ciclo de **1 ano + 5 anos** só começa quando a Fazenda toma **ciência** de que não achou o **devedor** ou **bens**.

Ajuizar, citar ou arquivar, sozinhos, **não** abrem esse prazo.

---

## Antes e agora

### 1. Cadastrar um evento

**Antes.** Uma lista muito longa. Fácil escolher o tipo errado.

**Agora.** Você escolhe a **família** e depois o **tipo concreto**:

1. Marco do art. 40 — ciência (não achou bens / não achou o devedor / bens insuficientes)
2. Resultado útil (citação, penhora, Sisbajud, arresto, CNIB)
3. Parcelamento (adesão / rescisão)
4. Pausa da exigibilidade (art. 151)
5. Constrição no IDPJ / cautelar
6. Outras causas do art. 174
7. Situação do feito (arquivamento, pedido sem resultado, etc.)

**O que fazer.** No card da inscrição: **+ Evento**. Primeiro a família. Depois o detalhe. Em Sisbajud, informe o valor bloqueado.

---

### 2. A data que aparece no card

**Antes.** A data digitada na ficha (ou da planilha) podia aparecer como se fosse o prazo.

**Agora.** O prazo do card é o **calculado**. A data digitada fica à parte, como conferência. Se divergir, o card diz **conflito**. O cálculo prevalece.

**O que fazer.** Não apague a data digitada. Use-a para conferir. Se o cálculo estiver certo, ignore a data velha da planilha.

---

### 3. A explicação no card e no texto copiado

**Antes.** Havia memória de cálculo, mas o cenário (qual relógio vale) não vinha claro no texto.

**Agora.** O card tem **Cenário e memória de cálculo**. A cópia da memória e o e-mail do dia também abrem com o cenário.

**O que fazer.** Expanda a inscrição e leia o cenário antes de atuar. **Copiar memória técnica** já leva um texto colável na peça.

---

### 4. Inscrição garantida, parcelada ou no IDPJ

**Antes.** Podiam sumir da fila urgente.

**Agora.**

- **Garantida:** continua visível. Só perde prioridade. Garantia pequena não apaga o risco.
- **Parcelada sem evento:** continua visível, pedindo o cadastro da adesão (e do fim, se já acabou).
- **IDPJ / cautelar:** continua visível, em “sob incidente”. O visto sozinho **não** pausa o relógio. Só pausa se houver evento de constrição.

**O que fazer.** Não trate “sumiu da fila” como “está seguro”. Se o feito está no incidente, cadastre a constrição quando ela existir.

---

### 5. Execução antiga, sem marco lançado

**Antes.** Às vezes aparecia um prazo como se o 1+5 já tivesse começado.

**Agora.** O app **não inventa** marco. Mostra **acompanhar a partir de…** (piso operacional). Consumo ainda é impossível.

**O que fazer.** Se houver ciência nos autos, lance o marco. Sem marco, acompanhe — não declare prescrita só pela idade do feito.

---

### 6. Arquivada art. 40, sem data

**Antes.** Podia parecer resolvida.

**Agora.** Entra na faixa **alta**. Sem a data da ciência não há teto.

**O que fazer.** Busque nos autos a data em que a Fazenda soube da não localização / inexistência de bens. Cadastre.

---

### 7. Previsão da planilha

**Antes.** Podia parecer prazo legal.

**Agora.** Só ajuda a **ordenar** a fila residual, com o rótulo de planilha. Não vira o prazo grave do card calculado.

**O que fazer.** Use a planilha como lembrete. Confie no cenário do card.

---

### 8. Três avisos de conferência

O app **não** decide sozinho nestes casos. Pede olho nos autos:

- Parcelamento sem data de encerramento — não presume que ainda está vigente.
- Pedido na janela 1+5 sem resultado lançado — não declara prescrita.

**O que fazer.** Complete a data ou o valor. Ou anote o desfecho do pedido.

---

### 9. Depois da rescisão do parcelamento

Isso **não** é marco do art. 40. É política interna da casa.

**Padrão:** 1 ano + 5 anos (mais favorável à União).

**Opcional na ficha da inscrição:** só 5 anos (linha de alguns julgados).

O card e o texto copiado dizem **ciclo pós-parcelamento (política)**, para ninguém confundir com o Tema 566.

---

## Como conferir no app

1. Abra a operação → **Risco** → **Inscrições**.
2. Clique no **corpo do card** (não no número — o número só copia).
3. Leia **Cenário e memória de cálculo**.
4. Teste **+ Evento**: família e tipo concreto.
5. Em **Processos e Prescrição**, o mesmo bloco aparece ao expandir a inscrição.
6. **Copiar memória técnica** e cole num bloco de notas: a primeira linha útil deve ser o cenário.

Na dúvida, o app **prefere alarmar a esconder**. Melhor um alarme a mais do que uma prescrição silenciosa.

---

## Depois desta publicação

No Apps Script, crie **Nova versão** na implantação, se for o fluxo habitual, para o webapp aberto no navegador passar a usar esta versão.
