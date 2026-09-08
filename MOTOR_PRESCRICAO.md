# Motor da prescrição — guia

Documento de leitura. Diz o que o Nexus **já calcula**, o que o **painel** faz com isso, e as regras operacionais que devem entrar (ou ser corrigidas) **sem mudar o dies a quo do Tema 566**.

Duas avaliações independentes (caderno de execução fiscal / Parte 7, e leitura do código em `src/lib/prescription.js`) convergem: **a tese jurídica está alinhada; o defeito é de classificação e de tradução.** O motor chama de “seguro” tanto “não sei” quanto “parou de correr”. O painel trata ausência de marco como um único cesto. A alteração útil muda a **pergunta da fila** — “esta inscrição precisa ser lida agora?” — e não o início legal do art. 40.

O detalhe de engenharia (casos reproduzidos, superfícies, fases de implementação) está em [`AVALIACAO_MOTOR_PRESCRICAO.md`](AVALIACAO_MOTOR_PRESCRICAO.md). Este guia é o contrato.

**Princípio de risco.** Falso positivo de prescrição consumada (o app pede conferência e o crédito ainda está vivo) é **muito melhor** do que falso negativo. Prescrição que se consume em silêncio, sem o app identificar, é o pior problema e o que mais se deve evitar. Na dúvida entre esconder e alarmar, **alarmar**. Remover da fila, rotular “seguro” ou deixar data informada calar o cálculo só se admite quando houver prova positiva de que o prazo **não corre**.

---

## 1. O que deve permanecer intacto

Três relógios separados. Confundi-los é o erro mais frequente.

Não inventar marco a partir do ajuizamento. A primeira tese do Tema 566 fixa o início na **ciência da Fazenda** sobre a não localização do devedor ou a inexistência de bens. Protocolo, despacho citatório, status “Arquivada art. 40” e “previsão” da planilha **não são** esse fato.

Contagem automática de **1 ano + 5 anos**, em **anos civis**, com ou sem decisão que declare a suspensão ou o arquivamento (teses primeira e segunda; Súmula 314/STJ; Tema 390/STF).

Interrupção só por **resultado útil** — citação efetiva, constrição efetiva, bloqueio Sisbajud positivo — e **retroação** do requerimento frutífero protocolado na janela. Pedido infrutífero não zera o ciclo (Tema 568). Pedido depois do termo 1+5 não salva o feito.

Suspensão do art. 151 **pausa e não zera**. Qualificar a causa da paralisação antes de somar anos.

Essas regras não se “afrouxam” para esvaziar o card. São o núcleo vinculante.

Há um quarto relógio, **fora deste card**: prescrição do **redirecionamento** (Tema 444) — regime autônomo. O art. 40 da originária não resolve o corresponsável.

A Primeira Turma do STJ, em maio de 2026, voltou a discutir o termo inicial da ciência no art. 40, com vista pendente. Ainda não altera teses. O motor continua **sem inventar marco** até haver desfecho.

---

## 2. Os três relógios

```
Decadência (constituir o crédito)
        ↓
Prescrição ordinária (art. 174) — até o ajuizamento
        ↓
Ajuizamento interrompe o art. 174 (Tema 383)
        ↓
Prescrição intercorrente (art. 40) — dentro da execução
```

**Decadência.** Arts. 150, § 4º, e 173 do CTN. Não alimenta o card “sem gatilho”.

**Ordinária (art. 174).** Quinquênio até o ajuizamento. Com processo vinculado, o app trata como interrompida (Tema 383), salvo se o protocolo já veio **depois** do termo — risco de ordinária consumada antes da propositura.

**Intercorrente (art. 40 da LEF; Súmula 314; Temas 566–571; Tema 390/STF).** Só depois de ajuizada. É o relógio deste guia e do card.

O cálculo vive em `src/lib/prescription.js`. Os avisos do painel, em `classifyPainelPrescAlert` / `buildPainelPrescAlerts`. KPI, sidebar, card de processo e e-mail diário **ainda leem critérios diferentes** — ver § 8.

---

## 3. O ciclo 1+5 — como o app conta hoje

Anos civis, não 365/1.825 dias. Pausas do art. 151 são descontadas: o relógio para e depois retoma.

Quando há **marco de ciência**:

1. Ciência da não localização, da ausência de bens ou da insuficiência de bens.
2. 1 ano de suspensão (art. 40) — o prazo não corre.
3. 5 anos — o quinquênio corre sozinho, com ou sem decisão de arquivo.
4. Termo final = marco + 1 + 5, empurrado pelas suspensões que **não** são do art. 40.

**Não usar a data do arquivamento como início dos 5 anos.** O Tema 566 faz o quinquênio começar ao fim do ano de suspensão, automaticamente. Arquivo tardio como dies a quo **subconta** o prazo já fluído. Arquivamento datado pode servir de **teto** operacional (§ 10.2), o que é outra coisa.

```
Ajuizada sem marco  →  o ciclo legal NÃO começa
        │
Marco de ciência  →  1 ano (suspensão)  →  5 anos
        │                                      │
        │                      sem resultado útil → consumada
        │                      constrição/citação na janela → ciclo encerrado
        │                      parcelamento vigente → pausa
        │                              │
        │                       rescisão → ciclo político 1+5 (não é art. 40)
```

---

## 4. Gatilhos — o que inicia o ciclo

| Evento no app | Natureza | Efeito |
|---|---|---|
| Não localização do devedor | Legal (art. 40, § 1º; Tema 566) | Inicia 1+5 |
| Ausência de bens penhoráveis | Legal (Tema 566: inexistência) | Inicia 1+5 |
| Insuficiência de bens | **Analogia** confessada | Inicia 1+5; **não** promove garantia irrisória a “ciclo encerrado” |
| Rescisão / fim de parcelamento | **Política interna**, não tese do Tema 566 | Inicia 1+5 por equiparação |

A adesão ao parcelamento está correta: **interrompe** (art. 174, parágrafo único, IV; Súmula 653) e **suspende** a exigibilidade (art. 151, VI). Na intercorrente, encerra o ciclo em curso.

A **rescisão** não é marco de ciência. O ciclo anterior já foi interrompido pela adesão; o art. 40 só recomeça com **nova** ciência de não localização ou de inexistência de bens. Equiparar a rescisão a marco é analogia. Contar 1+5 nessa hipótese (em vez de só 5 anos, linha Pitten / 1ª Turma do TRF4) é **mais favorável à União**. Deve permanecer **rotulado como política**, configurável (modo 1+5 ou modo só 5), e a interface deve dizer **“ciclo pós-parcelamento (política)”**, não “art. 40”.

O que **não** inicia o ciclo, mesmo cadastrado:

- protocolo / ajuizamento;
- citação ou despacho que ordena citação;
- penhora, Sisbajud, CNIB **antes** de existir ciclo (são âncoras de **piso**, não marco — § 10.1);
- status do processo (“suspensa”, “Arquivada art. 40”);
- flag “garantia = sim”;
- previsão da planilha;
- petição sem resultado útil.

Citação e constrição **interrompem** um ciclo já aberto. Não criam o estado de inércia do art. 40.

**Exceção operacional (não é fingir marco):** o evento **“Suspensão art. 40”** com **data**, sem marco ao lado, é quem lançou registrando a ciência. Pode ser tratado como marco **com aviso** (“informado como suspensão art. 40, sem evento de marco”). O **status** “Arquivada art. 40” **sem data** não substitui isso: só prova que o juízo entrou no regime (faixa Alta).

---

## 5. O que interrompe e o que suspende

### Interrompem e encerram o ciclo (Tema 568)

- citação efetiva;
- penhora efetiva;
- arresto / bloqueio com resultado;
- bloqueio Sisbajud positivo (REsp 2.174.870: não se exige termo de penhora);
- indisponibilidade CNIB/CCS com resultado útil **na própria execução**.

Pedido **dentro** da janela 1+5: o efeito **retroage ao pedido**, mesmo que a efetivação seja posterior. Pedido **depois** do termo: não salva o feito.

**Ressalva — valor irrisório.** Todo Sisbajud positivo hoje encerra o ciclo. A Parte 7 classifica a constrição desproporcional ao débito como **controvertida**. O painel não deve promover isso a “interrompido” silencioso. Destino operacional: **“possível interrupção — conferir proporcionalidade”**.

**Pedido na janela sem resultado no cadastro.** A quarta tese do Tema 566 é a proteção mais forte da União. Se houver petição de constrição ou citação dentro do 1+5 e o desfecho ainda não estiver lançado, a inscrição **não** pode ir para “consumado”. Destino: **“diligência tempestiva sem desfecho — conferir autos”**.

### Também interrompe — e suspende enquanto vigente

- adesão a parcelamento.

### Não interrompem o art. 40

- mero peticionamento / consulta infrutífera;
- reconhecimento da dívida, protesto judicial, despacho de citação, “outra causa interruptiva”;
- protesto extrajudicial da CDA — só interrompe o **art. 174** a partir de 03/07/2024 (LC 208/2024); o Tema 568 não o lista na intercorrente;
- constrição via **IDPJ / cautelar fiscal**: **pausa** as execuções abrangidas desde o pedido; **não** zera o ciclo da originária. A tese da cautelar não está pacificada. O “✓” de cobertura **não** retira a inscrição da fila.

### Pausam (art. 151 e afins) — não zeram

Parcelamento vigente, embargos com efeito suspensivo, liminar, depósito integral, falência / recuperação, constrição via IDPJ/MCF, outra causa suspensiva.

O evento “Suspensão art. 40 (1 ano)” **não soma um segundo ano** se o marco já existe.

**Parcelamento importado sem termo final.** Hoje, se a importação não trouxe encerramento e não há adesão seguinte nem rescisão, o último aberto é tratado como **ainda vigente**. Isso **infla o prazo e esconde risco**. Ausência de encerramento **não prova** vigência. Destino operacional: **“parcelamento importado sem encerramento — conferir”**. Status `parcelada` sem evento **não** pausa o relógio legal.

---

## 6. Fases que o motor devolve hoje

| Fase | O que o cálculo está dizendo |
|---|---|
| Não iniciado | Ajuizada, sem marco e sem ciclo pós-parcelamento |
| Suspensão art. 40 | Ainda no 1º ano após o marco (ou após a rescisão, no modo político) |
| Correndo | Quinquênio em curso |
| Suspenso | Causa do art. 151 (ou similar) vigente |
| Interrompido | Constrição, citação ou parcelamento encerrou o ciclo |
| Consumado | Termo final atingido |

**Tradução defeituosa.** `nao_iniciado` e `interrompido` viram `status: 'seguro'`. “Seguro” deveria significar “há prova de que não corre”. Aqui significa “não sei” ou “parou um dia”. O KPI, o card de processo e o e-mail herdam o erro.

Interrupção **não** torna a inscrição segura para sempre. Feito penhorado em 2013 e parado 13 anos some de todos os cards — é justamente onde nasce marco não cadastrado. Estado devido: **interrompido, vigiar**, com data sugerida de revisão.

---

## 7. O card “sem gatilho”

Não é lista de prescritas. É cesto residual: CDA ativa, não marcada como tratada, ajuizada, **sem ciclo do art. 40 no cadastro**.

O motor, de propósito, não inventa o 1+5 a partir do ajuizamento. Sem marco, a fase fica “não iniciado”. Isso está certo como tese e **inútil como fila**: mistura feito de 2023, feito de 2012 sem evento, e processo já arquivado pelo art. 40 sem data.

A fila deve passar a perguntar: **esta inscrição precisa ser lida agora?**

---

## 8. Dados que o cadastro já tem — e armadilhas

| Dado | Cálculo legal hoje | Uso operacional correto |
|---|---|---|
| Protocolo da EF | Tema 383 (ordinária). **Não** inicia o 1+5 | Âncora de **piso** |
| Citação / despacho citatório | Não inaugura o art. 40 | Âncora de **piso** |
| Constrição efetiva **antes** do marco | Não inaugura o art. 40 | Âncora de **piso** (ciência de “sem bens” só pode ser posterior) |
| Evento “arquivamento” com data | Informativo; ignorado no prazo | **Teto** do marco (§ 10.2) |
| Evento “suspensão art. 40” com data, sem marco | Informativo; ignorado | Pode valer como marco **com aviso** |
| Status `arquivada` sem data | Visual | Faixa **Alta**; pedir a data |
| “Previsão” da planilha | Sem marco, vira termo no motor com o mesmo rótulo da data digitada na CDA | **Não** é dies a quo. Ordena o residual com rótulo de origem. **Não** entra no card grave de iminente/vencido do ciclo calculado |
| Data digitada na CDA (`prescriptionDate`) | **Sobrepõe o cálculo** quando há marco | Com ciclo calculado, a informada é **divergência a resolver**, não a verdade |
| Garantia / CDA `garantida` | Não afeta o prazo | **Peso** de fila, **não** remoção. O app grava `garantida` sozinho a partir de Sisbajud e IDPJ — recorte por status seria circular |
| `parcelada` / `negociada_sispar` / `suspensa_*` sem evento | O relógio **não** pausa (certo) | Faixa **inconsistência**: “status diz X, sem evento — cadastre ou corrija” |
| “Intercorrente interrompida = SIM” na planilha | Não entra no cálculo | Rebaixa prioridade; **nunca** remove (a planilha não identifica o ato do Tema 568) |
| IDPJ / cautelar cobrindo a EF | “✓” no card | Sublista **“sob incidente”**. Só pausa o motor se o **evento** estiver lançado |

**Outras superfícies.** Painel usa ciclo + 180 dias. KPI e sidebar usam a data (informada ou calculada) sem olhar se o ciclo começou. Card de processo pode escrever “Prescrita” com previsão de planilha vencida. E-mail diário usa 90 dias e **exclui** as já vencidas — o aviso que mais importa. Qualquer reforma da fila tem de unificar isso; senão o painel diz uma coisa e o KPI outra.

---

## 9. Defeitos do motor que o painel sozinho não cura

Confirmados contra o código; não mudam a tese do Tema 566.

1. **Data informada cala o cálculo.** Marco antigo, consumação calculada, data digitada no futuro: o app diz “correndo” e o painel some. Com marco ou ciclo pós-rescisão, o termo legal é o **calculado**. A informada aparece ao lado, como conflito, se divergir.
2. **Interrompido some para sempre** — ver § 6.
3. **Limite de 5.000 passos** no desconto de pausas: pausa longa (falência de muitos anos) **trunca** o termo em silêncio. Pode declarar consumação falsa.
4. **Fim futuro conhecido de pausa é cortado em “hoje”.** Embargos até 2028 geram “termo projetado” cedo demais. Cortar em hoje só quando o fim é desconhecido.
5. **Marco com data futura** é aceito. Deveria ser erro de digitação, ignorado no cômputo, com aviso.
6. **CDA cujo número de processo é o do IDPJ**, não o da execução: tratada como ajuizada pelo protocolo do incidente.

Esses itens não se resolvem “rebaixando o card”. Entraram no guia para não serem esquecidos na ordem de implementação.

---

## 10. Regras operacionais (contrato da fila)

Princípio: **não fingir marco.** Âncoras de piso e teto **não** são ciência da Fazenda. Recorte de cadastro **não** pausa o relógio legal.

### 10.1 Piso — “a consumação já é possível?”

O marco não pode ser anterior ao protocolo. Pausas só atrasam. Logo **protocolo + 1 + 5**, sem descontar pausas, é piso legítimo: se hoje ainda está antes, a intercorrente **não pode** ter-se consumado.

Se houver **citação efetiva**, o piso passa a ser **citação + 6 anos**. Não porque “a ciência da não localização nunca precede a citação”: citado o devedor, cessa o ramo da não localização; **permanece** o ramo da inexistência ou insuficiência de bens, que pode abrir **no mesmo dia** da citação. O piso é só o termo **mais cedo possível**, sem afirmar que o ciclo da ausência de bens está juridicamente impedido até lá.

Âncoras que o motor já tem e hoje descarta (“não inaugura a intercorrente”) também servem ao piso:

| Âncora | Por quê |
|---|---|
| Protocolo da EF | Marco é ato da execução |
| Despacho citatório / citação efetiva | Não localização na tentativa de citar; sem bens, no mais cedo, no dia da citação |
| Constrição efetiva **pré-marco** | Ciência de “sem bens” só pode ser **depois** de uma constrição útil |

`piso = âncora mais tardia + 1 ano + 5 anos`. Feitos **sem protocolo** ficam no cesto (correto).

Rótulo: **“acompanhar a partir de [data]”**. Nunca “não prescrita”. Marco posterior reabre ciclo.

### 10.2 Teto — “não depois de”

Complementar ao piso. Não é dies a quo.

| Fonte | Raciocínio |
|---|---|
| Evento de arquivamento com data A | O arquivo do art. 40, § 2º, pressupõe o ano de suspensão já decorrido. O termo **não passa** de A + 6 anos (rigoroso: marco ≤ A − 1 ano), mais pausas **registradas** |
| Status `arquivada` sem data | Sem teto numérico; faixa **Alta** e pedido de data |

Com piso e teto, o residual vira **intervalo**:

- hoje **antes** do piso → **Baixa** (“acompanhar a partir de…”), recolhida por padrão;
- hoje **depois** do teto → **“Vencido — conferir (estimado)”** — o card já se chama conferir; **não** se afirma marco;
- entre os dois, ou sem teto → Média ou Alta.

### 10.3 Recorte de cadastro — fila, nunca cômputo

Nenhuma destas linhas altera o termo legal.

| Dado | Uso | Limite |
|---|---|---|
| CDA `garantida` / garantia na planilha | **Rebaixar** na fila urgente | Garantia irrisória não exclui marco por insuficiência. Status automático a partir de Sisbajud/IDPJ **não remove** |
| `parcelada` / `negociada_sispar` / `suspensa_parcelamento` | Sublista **“exigibilidade aparentemente suspensa — conferir evento”** | Sem evento, não pausa o motor. Um clique deve criar o evento, com data |
| `suspensa_judicial` / `suspensa_admin` | Idem | Status mente |
| “Intercorrente interrompida = SIM” | Faixa média; não repetir a mesma análise | A planilha não identifica o ato do Tema 568 |
| Previsão da planilha | Ordena o residual com rótulo **“previsão de planilha, sem marco legal”**. Se já passou ou está em 180 dias → **Alta** | **Não** entra no card grave de iminente/vencido do ciclo **calculado com marco**. **Não** vira dies a quo |
| IDPJ / cautelar cobrindo a EF | Sublista **“sob incidente”** | Só pausa o motor com **evento** lançado. O “✓” sozinho não tira da fila |

**Não remover** inscrição do radar por `garantida`, `parcelada` ou “interrompida = SIM”. Rebaixar, sim; apagar, não.

### 10.4 Faixas no que resta

| Faixa | Quem entra |
|---|---|
| **Vencido — conferir (estimado)** | Hoje depois do teto |
| **Alta** | Processo `arquivada` sem data de marco; previsão de planilha vencida ou em 180 dias; piso vencido há mais de 2 anos sem evento datado; inconsistência de cadastro |
| **Média** | Piso vencido, sem os agravantes; ou sem protocolo (piso incalculável) |
| **Baixa** | Hoje antes do piso — só a contagem, recolhida |

### 10.5 Flags de conferência (ainda não são cards)

- parcelamento importado sem termo final;
- Sisbajud de valor irrisório (interrupção possível, não silenciosa);
- pedido na janela 1+5 sem resultado lançado.

### 10.6 O que não implementar

- Tratar ajuizamento, citação, constrição pré-marco ou status “arquivada” como **marco**. São âncoras de piso/teto.
- Declarar o crédito **prescrito** só pela idade do feito. Pedir **conferência** (falso positivo) é o caminho certo; esconder (falso negativo) não é.
- Exigir marco lançado em toda a carteira como condição do painel.
- Deixar a data informada **calar** o cálculo (mostrar o conflito, não apagar o número do usuário).
- Remover da fila por status de cadastro ou pelo “✓” de IDPJ — isso gera exatamente o silêncio que se quer evitar.

---

## 11. O que já entrou no código

A fila e o motor passaram a seguir as §§ 10.1–10.5 e o item 12:

| Pedido do contrato | Situação |
|---|---|
| Piso com âncoras (protocolo, citação/despacho, constrição pré-marco) + teto de arquivamento datado | Feito. Rótulo: “acompanhar a partir de…”. Nunca “não prescrita”. |
| Recorte como peso / sublista / inconsistência | Feito. `garantida`, `parcelada` e “✓” de IDPJ **não removem** da fila |
| Faixas Alta / Média / Baixa; Arquivada art. 40 sem data em Alta | Feito |
| Previsão da planilha só no residual, com rótulo de origem | Feito. Não entra no card grave de iminente/vencido do ciclo calculado |
| Três flags de conferência | Feito (parcelamento sem termo; Sisbajud irrisório; pedido na janela sem desfecho) |
| Dois modos de rescisão; rótulo “ciclo pós-parcelamento (política)” | Feito (1+5 padrão; só 5 anos opcional na inscrição) |
| Data informada não cala o cálculo; `nao_iniciado`/`interrompido` deixam de ser “seguro” | Feito |
| Cadastro de eventos em 7 famílias | Feito. Os tipos antigos continuam no arquivo; o formulário pede família + tipo concreto |

O ajuizamento **continua sem ser marco**.

---

## 12. Próximo passo no app

Os sete passos deste item **já foram executados** (piso/teto, recorte visível, faixas, previsão de planilha, flags, modos de rescisão, defeitos do § 9).

O que permanece para depois, se fizer falta:

- Unificar o KPI da sidebar com as mesmas faixas do painel (hoje o KPI ainda conta “180 dias até o termo calculado”).
- Campo de valor nas demais constrições, não só Sisbajud, se a casa quiser a mesma conferência de proporcionalidade.

Nada disso altera a tese do Tema 566. O motor continua sem inventar marco.
