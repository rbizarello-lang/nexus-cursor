# O que mudou na prescrição (uso prático)

Versão do app **1.2.21**. Regras de contagem **2026.09**.

Este texto é para o dia a dia. Não é manual técnico.

## O que não mudou

O ciclo de **1 ano + 5 anos** só começa quando a Fazenda toma **ciência** de que não achou o **devedor** ou **bens**.

Ajuizar, citar ou arquivar, sozinhos, **não** abrem esse prazo.

---

## Antes e agora

### 1. Cadastrar um evento

**Antes.** Uma lista muito longa. Fácil escolher o tipo errado.

**Agora.** Você escolhe a **família** e depois o **tipo concreto**:

1. Ciência de não localização / ausência de bens / bens insuficientes
2. Resultado útil (citação, penhora, Sisbajud, arresto, CNIB)
3. Parcelamento (adesão / rescisão)
4. Pausa da exigibilidade
5. IDPJ / Cautelar (constrição ou suspensão da execução)
6. Outras causas da prescrição ordinária
7. Situação do feito (arquivamento, pedido sem resultado, etc.)

**O que fazer.** No card da inscrição: **+ Evento**. Primeiro a família. Depois o detalhe. Em Sisbajud, o valor bloqueado é só informação: quem lança o bloqueio decide se houve resultado útil.

---

### 2. A data que aparece

**Antes.** A data digitada na ficha (ou da planilha) podia aparecer como se fosse o prazo.

**Agora.** O prazo da fila é o **calculado**. A data digitada fica à parte, como conferência. Se divergir, vira item de cadastro. O cálculo prevalece.

**O que fazer.** Não apague a data digitada. Use-a para conferir.

---

### 3. As três colunas da inscrição

**Antes.** O detalhe misturava cenário jurídico, memória e lacunas (Tema, Súmula, “piso”, “CENÁRIO”).

**Agora.** Cada relógio (Decadência · Prescrição ordinária · Intercorrente) tem seis blocos: Situação, Datas, Ocorrências, Estimativas, Conferir nos autos, e o rodapé **Regras v2026.09**. Marcar um item em Conferir tira esse item da coluna Conferir da aba Prazos extintivos.

**O que fazer.** Expanda a inscrição. Leia a Situação. Use **Copiar memória técnica** quando for colar em peça (aí sim vêm as citações).

---

### 4. Inscrição garantida, parcelada ou no IDPJ

**Antes.** Podiam sumir da fila urgente.

**Agora.**

- **Garantida:** continua visível. Só perde prioridade.
- **Parcelada sem evento:** continua visível, pedindo o cadastro da adesão (e do fim, se já acabou).
- **IDPJ / cautelar:** continua visível. O visto sozinho **não** pausa o relógio. Só pausa se houver evento de constrição. O app também mostra o que aconteceria **sem** essa pausa.

**O que fazer.** Não trate “sumiu da fila” como “está seguro”. Se o feito está no incidente, cadastre a constrição quando ela existir.

---

### 5. Execução antiga, sem ciência lançada

**Antes.** Às vezes aparecia um prazo como se o 1+5 já tivesse começado.

**Agora.** O app **não inventa** ciência. Mostra **não antes de…** (ainda impossível). Consumo ainda é impossível.

**O que fazer.** Se houver ciência nos autos, lance. Sem ciência, acompanhe — não declare prescrita só pela idade do feito.

---

### 6. Arquivada art. 40, sem data

**Antes.** Podia parecer resolvida.

**Agora.** Vai para o grupo **2 (Provável — conferir)**. Sem a data da ciência não há teto.

**O que fazer.** Busque nos autos a data em que a Fazenda soube da não localização / inexistência de bens. Cadastre.

---

### 7. Previsão da planilha

**Antes.** Podia parecer prazo legal.

**Agora.** Só ajuda a ordenar. Não vira o prazo grave calculado do grupo 1.

**O que fazer.** Use a planilha como lembrete. Confie na Situação da coluna.

---

### 8. Parcelamento

**Antes.** Sem data de fim, o app podia tratar como prazo vencido ou como “pior caso” a conferir.

**Agora.** Inscrição **parcelada** (pelo status ou pelo evento de adesão vigente) **sai da fila**. Não há pendência. O app **não** pede a data de fim. Quando o parcelamento for rescindido, você lança a rescisão e o relógio volta.

**O que fazer.** Não use o app para vigiar o término do parcelamento. Na rescisão, lance o evento.

---

### 9. Depois da rescisão do parcelamento

Isso **não** é ciência de não localização. É escolha da casa.

**Padrão:** 1 ano + 5 anos (mais favorável à União).

**Opcional na ficha da inscrição:** só 5 anos.

A memória técnica traz a base. A coluna da inscrição fala o caso, sem a palavra “política”.

---

### 10. Aba Prazos extintivos

**Antes.** Os alertas ficavam espalhados no Painel (vários cards), na barra e no card do processo, às vezes com critérios diferentes.

**Agora.** Há uma aba **Prazos extintivos** no topo, para **todas** as operações. Cinco grupos: urgentes, a conferir, a completar, acompanhamento, ainda impossível. O Painel ficou com **um** indicador. A barra e o card do processo leem o mesmo radar.

**O que fazer.** Comece o dia por essa aba. Filtre por operação, por incidente ou só sem ciência lançada.

---

## Como conferir no app

1. Abra **Prazos extintivos** (topo).
2. Clique em **Abrir** numa inscrição, ou vá em Inscrições / Processos e **expanda** a CDA.
3. Leia as três colunas (Situação → Ocorrências → Conferir).
4. Teste **+ Evento**: família e tipo concreto.
5. **Copiar memória técnica** e cole num bloco de notas quando for redigir.
6. Em ⚙, **Regras de prazos** → **Abrir regras** (o mesmo texto do rodapé das colunas).

Na dúvida, o app **prefere alarmar a esconder**. Melhor um alarme a mais do que uma prescrição silenciosa.

---

## Depois desta publicação

No Apps Script, crie **Nova versão** na implantação, se for o fluxo habitual, para o webapp aberto no navegador passar a usar esta versão. A publicação conjunta destas regras fica para o fim da série (versão **2.0.0**).
