# Relatório da Beta — o que mudou e o que depende de você

**Para:** Roger  
**Data:** 18/09/2026  
**Base:** versão estável `1dc76ea`  
**Nada disto foi gravado no git.** Este texto não altera o app. Serve para você marcar **adotar** ou **não** no inventário, com o comportamento explicado em português.

Inventário técnico (linhas 1–202): `docs/INVENTARIO-BETA.md`.  
Regras do app (R1–R12): `MOTOR_PRESCRICAO.md`.  
Telas de conferência: `C:\Users\User\AppData\Local\Temp\nexus-audit\qa-final\beta\` (e o clássico desta mesma data em `qa-final\classic-now\`). A pasta `beta-mesa` pedida no plano **não existe**; as telas da Mesa estão em `beta\03-mesa.png`, `04-mesa-resto.png`, `05-gaveta.png`, `07-adiar-gaveta.png`.

Como ler cada capítulo: o que aparece na tela, como o clássico faz hoje, por que mudou, se há uma escolha sua, quais números do inventário cobrem o tema, e como testar com os dados demo (Fachada Norte, Laranjas do Vale, Sucessão Empresarial Sul, Holding Atlântico, Agro Horizonte).

---

## 0. O que é a Beta, em uma página

A **Nova versão (beta)** é a sucessora da antiga “Demo Experimental”. Não substitui o clássico. O app que você abre no dia a dia (`Nexus.html`) continua sendo o clássico. A Beta abre por ⚙ → **Nova versão (beta)**, ou pelo arquivo `Nexus.demo.html`. A aba do navegador passa a dizer **NEXUS Beta**.

A Beta usa a **mesma casa** do clássico: coluna da esquerda com as cinco operações, faixa de abas em cima, e, dentro da operação, Briefing · Pessoas · Inscrições · Processos e Prescrição · Bens · Tarefas · Importar · Arquivos. Saiu o trilho estreito “Central de Comando”, o título enorme, as quatro “zonas” e as paletas Clara / Ardósia / Grafite. Os temas são os três que você já conhece: Mar Profundo, Claro, Ferro e Maré.

O princípio que organiza a Beta é **alarme ≠ consciência**. Vermelho, KPI e o bloco **PRECISA DE VOCÊ** existem só para o que pede decisão **hoje**. O resto continua visível, sem alarme, com contagem. Nada some: o que saiu da fila principal vai para a gaveta **SILENCIADOS (N)** no rodapé da Mesa. Parcelamento vigente, “ainda impossível” e o que você mesmo adiou ficam lá, com data.

A Mesa de prazos (Prazos → **Mesa**) é a novidade visível. A lista de grupos (Urgentes / A conferir / …) continua a um clique, no botão **Lista**. Há outra “Mesa” na faixa de cima — a antiga, de pins de intimação. As duas coexistem. Esta Beta não apagou a Mesa de pins.

Os dados demo são os mesmos de sempre. Nenhuma operação foi inventada para este lote.

### Alarme ≠ consciência

Destaque (borda vermelha, selo VENCIDA, número no KPI) só para o que exige ato seu agora: termo calculado nos 180 dias, cadastro que se completa com um clique, ou data de rever já passada. O restante — prazo em curso, ainda impossível, parcelamento vigente, aguardando decisão — permanece na tela, sem gritar. A gaveta Silenciados é a garantia de que o app não “come” inscrição.

### O que o clássico já recebeu, além das contas (Bloco C)

Mesmo se você **rejeitar a Beta inteira**, o clássico desta árvore de trabalho **não** é bit a bit o de `1dc76ea`. Ele já ganhou:

- campos mínimos obrigatórios (número da CDA, processo ou descrição da intimação, título da tarefa, nome da operação) e faixa vermelha dentro da janela;
- tecla Esc fecha a janela; clique no fundo escuro fecha; se você já digitou, o navegador pergunta;
- recado curto no rodapé ao salvar (“CDA salva”, “Ciência registrada — ver Resolvidas”);
- ⚙ com botão ✕, clique fora e Esc; o interruptor passou a dizer **Nova versão (beta)** em vez de “Demo Experimental”;
- o tubo de ensaio “Resetar / carregar dados demo” saiu da coluna da esquerda e ficou só no ⚙;
- ao parar o mouse em **NÃO AJ** / **AJ** e nas setas ⬇ ⬆, aparece o nome por extenso;
- cartão de Briefing sem texto deixa de aparecer;
- no Painel, ao voltar de Mês para Semana, a grade cai na semana de **hoje** (14–20 set 2026 nos testes), não na primeira semana do mês;
- o ⚙ mostra **NEXUS 2.0.7**.

Isso é o Bloco C. Detalhe no capítulo C.

### Recapitulação do Bloco A (já explicado)

Itens **#1–#20** do inventário. Corrigem a **conta** nas três colunas da CDA e, no clássico, na lista “Prazos extintivos”. Valem nas duas edições. Pausas que se sobrepõem deixam de ser somadas duas vezes; a primeira ciência inicia o 1 ano + 5 anos; fato datado depois de hoje não entra na conta; 29/02 aniversaria em 28/02; ordinária ajuizada deixa de se chamar “seguro”; suspensão do art. 40 datada vale como ciência, com aviso. Recusar o Bloco A **mantém o erro de conta**. Recusar só a Beta e **adotar o A** é coerente: o clássico fica com a conta certa e sem Mesa. Recusar o A e adotar a Mesa **não** é coerente: a Mesa lê o radar; as contas erradas apareceriam nas frases. O e-mail da manhã **não** acompanha o A até alguém pedir (capítulo H).

---

## Bloco B — A fila nova (só Beta)

O clássico continua com a fila antiga (política v1). A Beta pede a fila nova (v2). Mesmo cadastro, duas leituras. É a mudança de fundo da Mesa: quem entra, quem vai à gaveta, quem some de vez.

### Duas filas no mesmo app

**O que você vê.** Abrir o clássico: aba **Prazos extintivos**, cinco contadores. Nos dados demo, em 18/09/2026: **2 urgentes · 0 a conferir · 8 a completar · 0 acompanhamento · 2 ainda impossível** (`qa-final\classic-now\02-prazos.png`). Abrir a Beta: aba **Prazos**, seletor Mesa | Lista. Na Lista: **2 urgentes · 0 a conferir · 1 a completar · 0 acompanhamento · 9 ainda impossível** (`qa-final\beta\12-prazos-lista.png`). As duas CDAs urgentes são as mesmas (ITR e IRPF da Agro, sem processo). O que mudou foi o miolo: oito “a completar” viraram um; dois “ainda impossível” viraram nove.

**Antes.** Uma fila só. Status “parcelada” ou “tratada — aguardando reconhecimento” tiravam a CDA da aba. IDPJ sem constrição puxava inscrição “ainda impossível” para “cadastro a completar”.

**Por que mudou.** A auditoria mostrou falsos negativos (ficha parcelada sem adesão sumia; “aguardando reconhecimento” sumia) e falsos alarmes (piso futuro + IDPJ sem constrição virava “completar cadastro”). O plano pediu: clássico intocado na fila; Beta com a política nova.

**Decisão sua.** **A fila v2 vale só na Beta.** Alternativa: levar a mesma fila ao clássico — a lista “Prazos extintivos” mudaria de oito para um “a completar” e a gaveta não existiria lá. Outra alternativa: rejeitar a v2 e ficar com a Mesa lendo a fila antiga — as frases e a gaveta perderiam o sentido. Consequência de adotar: você passa a ter dois recortes da mesma carteira, conforme a edição. Consequência de recusar: a Beta vira só rearranjo visual da fila que você já conhece, e vários temas abaixo caem juntos.

**Itens do inventário:** #21, #22.

**Como testar.** ⚙ → Clássico → Prazos extintivos: anote os cinco números. ⚙ → Nova versão (beta) → Prazos → Lista: compare. Os dois urgentes da Agro devem permanecer; o “a completar” deve cair de 8 para 1.

### “Aguardando reconhecimento” continua visível

**O que você vê.** Na Beta, CDA marcada “Prescrita — aguardando reconhecimento judicial” **não some**. Vai para acompanhamento / Silenciados, selo “aguardando decisão”, frase “A prescrição já foi apontada e aguarda decisão judicial.” Só saem de vez: declaração em juízo, reconhecimento, CDA extinta.

**Antes.** No clássico, “aguardando reconhecimento” tira a inscrição da aba Prazos, como se o caso tivesse acabado.

**Por que mudou.** Achado da auditoria: o app calava um crédito que ainda depende de decisão judicial. O princípio do plano: nunca calar por status sozinho. Terminais de verdade são só os três acima.

**Decisão sua.** **“Aguardando” fica visível, sem alarme.** Alternativa: voltar a esconder (como o clássico). Consequência de adotar: a gaveta/acompanhamento cresce com casos que você já apontou e ainda não transitou. Consequência de recusar: esses casos saem da consciência diária até você lembrar de abrir a ficha.

**Itens do inventário:** #23, #24.

**Como testar.** Na Lista da Beta, abra uma CDA → Tratar → escolha aguardando reconhecimento. Ela deve permanecer na fila/gaveta, não desaparecer. Marcar “declarada” deve tirá-la.

### Ficha parcelada sem adesão = cadastro a completar

**O que você vê.** Status “parcelada” / “negociada SISPAR” / execução “suspensa por parcelamento”, **sem** evento de adesão vigente: a Beta **não** tira da fila. Vira inconsistência, frase “A ficha diz parcelada, mas não há adesão lançada — o prazo segue correndo.” Há campo de data na linha da Mesa: Enter lança a adesão. Nos dados demo, a gaveta rotula como **Parcelamento vigente · até 17/12/2026** as CDAs `90.6.22.000777-01`, `778-01` e `779-01` (Laranjas) e `90.6.18.000300-30`, `301-30` e `302-30` (Holding) — 90 dias depois de hoje, só para você rever se a pausa ainda vale. Nem todas essas seis têm o selo Parcelada na ficha; o que as silencia é o **fato de adesão vigente** que o app liga à inscrição.

**Antes.** Status “parcelada” sozinho escondia a CDA da aba Prazos, mesmo sem data de adesão. R6 do caderno de regras (“parcelamento vigente sai da fila”) era lido pelo **status**, não só pelo fato.

**Por que mudou.** Falso negativo: alguém pintava a ficha de parcelada e o prazo continuava correndo sem pausa, fora da vista.

**Decisão sua.** **Status sem fato não pausa nem esconde; pede a data da adesão.** Alternativa: manter o clássico (status sozinho tira da fila). Consequência de adotar: mais linhas de cadastro na Mesa até você lançar a adesão — e o 1 ano + 5 anos **segue** até lá. Consequência de recusar: a Beta volta a calar ficha “parcelada na caneta”.

**Itens do inventário:** #25 (a ação de um clique é #114, no capítulo E).

**Como testar.** Mesa → SILENCIADOS: as seis números acima, com “Parcelamento vigente”. Se você criar uma CDA só com status Parcelada e sem adesão, ela deve permanecer na Mesa pedindo a data — não ir à gaveta.

### Ordinária consumada em CDA ajuizada vira urgente

**O que você vê.** CDA já ajuizada cuja prescrição **ordinária** (os 5 anos da inscrição até o ajuizamento) já venceu: na Beta entra no grupo 1, frase “Os 5 anos da inscrição venceram antes do ajuizamento.” Não cai mais em “ainda impossível”.

**Antes.** Esse caso ia para o grupo 5 e saía do alarme, como se o ciclo intercorrente (que ainda nem começou) fosse o único relógio.

**Por que mudou.** R1 diz que os três relógios não se misturam. R12 diz que a ordinária ajuizada olha o que veio **antes** da propositura. A fila antiga tratava “ajuizada” como “ordinária resolvida”, mesmo quando o quinquênio da inscrição já tinha estourado.

**Decisão sua.** **Ordinária vencida em CDA ajuizada = alarme (grupo 1).** Alternativa: deixar no grupo 5 (como o clássico). Consequência de adotar: entra no vermelho um crédito que o clássico considerava “ainda impossível”. Consequência de recusar: o ajuizamento tardio continua invisível na fila.

**Itens do inventário:** #26.

**Como testar.** Os dados demo desta data **não** trazem esse caso na Mesa. A regra está coberta pelos testes do motor. Se quiser ver na tela: CDA com inscrição antiga, ajuizamento depois dos 5 anos, sem ciência do art. 40.

### CDA só no IDPJ pede vínculo à execução fiscal

**O que você vê.** Número da CDA aponta para IDPJ ou cautelar, não para execução fiscal. A Beta não trata como “sem processo”. Pede: “O número apontado é de incidente, não de execução fiscal.” Botão **Vincular EF**.

**Antes.** Podia cair no recorte de inscrição sem processo (R6 das decisões de política: só alerta se a ordinária já venceu ou está a 180 dias).

**Por que mudou.** O número existe; está no processo errado. Completar o vínculo é o ato, não “cadastrar processo do zero”.

**Decisão sua.** **Incidente no lugar da EF = inconsistência, não “sem processo”.** Alternativa: tratar como inscrição sem execução (alerta só se a ordinária apertar). Consequência de adotar: mais “cadastro a completar” quando o número da CDA for o do IDPJ. Consequência de recusar: a Beta deixa de empurrar o vínculo.

**Itens do inventário:** #27 (o motor já marca o caso no #16, Bloco A).

**Como testar.** Na Mesa, se aparecer linha com “Vincular EF”, o número deve ser de IDPJ/cautelar. O botão foca o campo do processo na ficha.

### Piso futuro não vira alarme de cadastro

**O que você vê.** CDA da Sucessão `90.6.19.000047-88` (PIS/COFINS, R$ 890.000), execução `5000045-12.2019.4.04.7003`, IDPJ `5008890-77.2025.4.04.7003` sem constrição lançada. Na Beta a frase é “Ainda não pode ter prescrito: o ato mais recente mais 1 ano e 5 anos não chegou.” Data: até 02/05/2028. **Não** sobe a PRECISA DE VOCÊ. Vai para Silenciados como **Ainda impossível** (`05-gaveta.png`). A irmã `90.6.19.000045-88` (IRPJ, R$ 5.600.000) **não** é este caso: o ciclo já corre e a ficha diverge do termo (26/01/2027 × 14/08/2031); ela fica em **O RESTO**, grupo 3, sem alarme vermelho (`04-mesa-resto.png`).

**Antes.** No clássico, a `000047-88` aparece como grupo **3** (“a completar”), com o texto longo do IDPJ sem constrição **em cada CDA** daquela execução (`classic-now\02-prazos.png`). O “não antes de 02/05/2028” existia, mas o alarme era de cadastro, não de “ainda impossível”.

**Por que mudou.** R8 (“não antes de”): enquanto o ato mais recente + 1 ano + 5 anos não chegou, consumação é impossível. O IDPJ sem constrição é nota, não deve roubar o grupo. Além disso, o mesmo recado “não tem constrição lançada” se repetia em cada CDA do processo.

**Decisão sua (piso).** **Piso futuro permanece grupo 5, mesmo com IDPJ sem constrição.** Alternativa: clássico (o incidente puxa para grupo 3). Consequência de adotar: R$ 890.000 da `047-88` saem do “a completar” e vão à gaveta até 2028. Consequência de recusar: a Mesa gritria cadastro num prazo que ainda não pode ter prescrito.

**Decisão sua (recado uma vez).** O motor tira o aviso repetido da linha da CDA e guarda uma nota **por processo**. **A Mesa não lista essa nota em lugar nenhum.** Alternativa: mostrar o recado uma vez no processo (não foi feito). Consequência de adotar como está: o IDPJ sem constrição some da linha da CDA e **não reaparece** numa tela da Mesa; a CDA grupo 5 continua na gaveta. Consequência de recusar o dedupe: o texto volta a se repetir em cada irmã, como no clássico.

**Itens do inventário:** #28, #29, #123.

**Como testar.** Beta → Prazos → Mesa → abra **SILENCIADOS**. Ache `90.6.19.000047-88`. Compare com o clássico: lá ela está em “A completar”, não em “Ainda impossível”.

### Análise importada não apaga o vermelho

**O que você vê.** Se você cola uma análise (bloco NEXUS) dizendo “ciclo encerrado”, mas o cálculo do app está com termo já vencido (grupo 1), a Beta **mantém o vermelho**. A análise continua anotada. A comparação do que piorou usa a fila v2.

**Antes.** A decisão importada governava o grupo. Um “ciclo encerrado” colado rebaixava o alarme.

**Por que mudou.** R11: data digitada e planilha não calam o cálculo. A análise colada é do mesmo jaez.

**Decisão sua.** **Importada não rebaixa grupo 1 calculado.** Alternativa: a análise manda (clássico). Consequência de adotar: você não consegue “desligar” um vencido só colando texto. Consequência de recusar: uma análise otimista esconde o termo calculado.

**Itens do inventário:** #30, #142.

**Como testar.** Prazos → **Importar análise (formato NEXUS)**. Cole um bloco que diga ciclo encerrado numa CDA que a Mesa mostra como termo nos 180 dias. O vermelho deve permanecer; a nota da análise, também.

### Uma frase e uma ação por linha

**O que você vê.** Cada linha da Mesa traz **por que está ali**, em português curto, sem Tema, Súmula, “piso”, “teto”, “dies”, “marco”, “CENÁRIO”. Exemplos reais da conferência:

- Agro `90.6.23.000884-40` (ITR, R$ 48.000, sem processo, selo **CALCULADO**): “O termo calculado cai nos próximos 180 dias.”
- Agro `90.6.20.000881-40` (IRPF, R$ 95.000): a mesma frase.
- Sucessão `90.6.19.000045-88`: “O prazo de 1 ano + 5 anos está em curso.”
- Gaveta, parceladas: “Parcelamento vigente”.
- Gaveta, `000047-88`: “Ainda não pode ter prescrito…”.

Há também um tipo de ação sugerida (lançar fato, conferir nos autos, corrigir ficha, vincular EF, lançar ciência, ou nenhuma). A Mesa usa isso nos botões (capítulo E).

**Antes.** A lista clássica mistura resumo técnico, data, travessão e o texto do IDPJ. “Tema/Súmula” nas dicas do formulário. A coluna da inscrição no clássico já evitava essas palavras (caderno de regras, “O que a tela da inscrição não mostra”); a **fila** ainda não.

**Por que mudou.** Princípio do plano: uma frase, um selo, uma ação. Jargão só na memória técnica (Copiar) e na página ⓘ Regras.

**Decisão sua.** O catálogo de frases **fixa 180 dias** na boca da Mesa (“cai nos próximos 180 dias”). Isso já era decisão da casa no caderno (fila urgente: 180 dias). Recusar o catálogo e manter a Mesa deixa as linhas mudas ou com o texto antigo. Atenção honesta: a frase de ciclo encerrado ainda diz **“resultado útil”** (“O ciclo encerrou por resultado útil; vigiar nova inércia.”). O filtro da Beta tira Tema/Súmula/piso; não tira essa expressão. A memória técnica continua com a base legal.

**Itens do inventário:** #31, #152, #99 (filtro de jargão, capítulo E).

**Como testar.** Mesa: leia as duas linhas da Agro. Não deve aparecer “Tema”, “Súmula” nem travessão solto. Abrir ⓘ Regras deve continuar com o caderno completo, inclusive Temas.

### Data para rever (fora dos grupos 1 e 2)

**O que você vê.** Você não vê o nome técnico. Vê o efeito: uma linha de acompanhamento pode **subir** a PRECISA DE VOCÊ quando a data de rever já passou. Regras internas: pausa → fim conhecido ou +90 dias; ciclo encerrado para vigiar → interrupção + 1 ano (no mínimo hoje + 30 dias); ainda impossível → a data do “não antes de”; aguardando decisão → +90 dias; inconsistência de cadastro → +30 dias.

**Antes.** Não havia “voltar a me mostrar isto em dd/mm”. Grupo 4 e 5 só saíam da vista ou ficavam no fundo da lista.

**Por que mudou.** Alarme ≠ consciência precisa de um despertador para o que hoje não é urgente.

**Decisão sua.** **Adotar esses prazos de revisita** (90 / 1 ano / 30 / data do piso). Alternativa: nunca puxar acompanhamento de volta ao bloco vermelho. Consequência de adotar: daqui a 90 dias uma pausa ou um “aguardando” pode voltar a PRECISA DE VOCÊ sozinha. Consequência de recusar: o que hoje está quieto só volta se você abrir a gaveta.

**Itens do inventário:** #32.

**Como testar.** Na Mesa, uma linha grupo 4 com data de rever no passado deveria estar em PRECISA DE VOCÊ mesmo sem ser grupo 1. Nos dados demo desta data, o bloco de cima só tem as duas da Agro (grupo 1); o despertador não disparou em ninguém do meio.

### Silenciados no motor (antes da gaveta)

**O que você vê.** A fila v2 devolve, além das linhas da Mesa, uma lista do que ficou de fora: parcelamento **vigente por evento** e itens que você adiou. O clássico não tem essa lista. Sem ela, a gaveta do capítulo E não existe.

**Antes.** Parcelamento vigente sumia da aba. Não havia gaveta.

**Por que mudou.** “Nada some.” R6 continua: parcelamento vigente **não gera alerta**. A novidade é não desaparecer.

**Decisão sua.** Cobre-se com a da gaveta (capítulo E) e com a do parcelamento sem adesão, acima.

**Itens do inventário:** #33, #158.

**Como testar.** Mesa → SILENCIADOS (15) nos dados demo. Seis parceladas visíveis no topo da gaveta; o restante é “ainda impossível”.

### Adiar: o motor por trás do botão

**O que você vê.** Você esconde a linha até uma data, com motivo fechado. O motor **fura** o silêncio (a linha volta sozinha) se: a data passou; o grupo **piorou**; entrou fato novo depois que você adiou; o motivo foi “Outro” sem texto; ou o motivo é desconhecido. Limites máximos: grupo 1 = **14 dias**, grupo 2 = **30**, grupo 3 = **7**, grupo 5 = **90**, demais = **30**. Motivos: Aguardando certidão, Peça protocolada, Garantia em análise, Não priorizar agora, Outro (texto obrigatório).

**Antes.** Não existia. No clássico, “Tratar” tira da fila de outro jeito (handled), sem data de volta.

**Por que mudou.** Precisava de um silêncio **temporário**, que não sobreviva a um fato novo. Campo novo e opcional na CDA (`prescSnooze`). O clássico ignora.

**Decisão sua.** **Adotar estes tetos e estes furos.** Alternativa: tetos maiores (ex.: 30 dias no grupo 1) — o urgente poderia sumir um mês. Alternativa: não furar quando o grupo piora — um adiamento “não priorizar” esconderia uma consumação nova. Consequência de adotar: grupo 1 só some no máximo duas semanas, e volta se o caso piorar. Consequência de recusar o Adiar: a Mesa não tem como calar uma linha sem “Tratar”.

**Itens do inventário:** #34, #35, #161–#166.

**Como testar.** Ver capítulo E, tema Adiar (os mesmos números, na tela).

---

## Bloco C — Correções que já estão no clássico

Tudo abaixo aparece em **Nexus.html** e na Beta, salvo onde o texto disser o contrário. Se você adotar só o clássico, estas telas mudam mesmo assim.

### Formulários: não grava vazio, avisa, Esc, clique fora

**O que você vê.** Sem o número da CDA, Salvar não grava; faixa vermelha **dentro** da janela: “Informe o número da CDA.” Intimação sem processo **e** sem descrição: “Informe o número do processo ou a descrição do evento.” Tarefa sem título, bem sem descrição/matrícula, operação sem nome: o mesmo padrão. Esc fecha. Clique no fundo escuro fecha. Se você já escreveu, o navegador pergunta “Há texto digitado. Fechar sem salvar?”. Na conferência da Beta, a janela de intimação nova se chama **Nova intimação** (`19-validacao.png`); o título limpo é só Beta (capítulo F). A validação em si vale nos dois.

**Antes.** Dava para salvar CDA sem número. Esc não fechava. Clique fora fechava sem perguntar.

**Por que mudou.** Achado de uso: fichas vazias e perda de texto ao clicar fora.

**Decisão sua.** Nenhuma — correção/ajuste de tela. (Se recusar, o clássico volta a aceitar ficha sem número.)

**Itens do inventário:** #36, #37, #38, #39, #40, #58.

**Como testar.** Clássico ou Beta: + Inscrição → Salvar em branco. Deve aparecer a faixa vermelha. Digite um número, clique fora: deve perguntar.

### Recado ao salvar e ao registrar atuação

**O que você vê.** Depois de Salvar, caixa no rodapé (~3 segundos): “Intimação salva”, “CDA salva”, “Tarefa salva”, “Operação salva”, ou “Salvo”. Ao registrar ciência/peticionamento na intimação: “Ciência registrada — ver Resolvidas” (e equivalentes). Não abre a aba sozinho.

**Antes.** O registro ia para Resolvidas sem confirmação visível.

**Por que mudou.** Dúvida de “foi ou não foi”.

**Decisão sua.** Nenhuma — correção/ajuste de tela.

**Itens do inventário:** #41, #42, #43.

**Como testar.** Salve uma intimação. Olhe o rodapé.

### Painel ⚙: dá para fechar de verdade

**O que você vê.** Cabeçalho com **✕**. Clique fora do retângulo fecha. Esc fecha. Trocar de Painel para Intimações fecha o ⚙. O interruptor de edição diz **Clássico** | **Nova versão (beta)**, com o texto “A nova versão (beta) usa a mesma navegação do clássico, com Hoje e Agenda unificada…”. Versão **NEXUS 2.0.7**. Regras: **Versão 2026.09** (o número no título **não** virou 2026.09a; o parágrafo novo está dentro de Abrir regras). Captura: `classic-now\13-settings.png` e `beta\20-settings.png`.

**Antes.** Só clicando de novo na engrenagem. Rótulo “Demo Experimental”. Versão 2.0.6.

**Por que mudou.** O ⚙ ficava preso na frente da tela.

**Decisão sua.** Nenhuma — correção/ajuste de tela. O nome “Nova versão (beta)” é rótulo; a edição em si é o resto deste relatório.

**Itens do inventário:** #44–#49, #56, #59, #60.

**Como testar.** ⚙ → clique no ✕; abra de novo → Esc; abra de novo → clique no fundo.

### Tubo de ensaio saiu da coluna da esquerda

**O que você vê.** A sidebar, nas duas edições, não tem mais **Resetar / carregar dados demo**. Continua em ⚙ → Dados / Sync. As setas ⬇ ⬆ ganharam o nome ao parar o mouse: Exportar JSON / Importar JSON.

**Antes.** O botão de demo ficava à esquerda, fácil de clicar sem querer e **zerar** o cadastro local pelos dados fictícios.

**Por que mudou.** Risco de apagar o acervo de trabalho numa sessão local.

**Decisão sua.** Nenhuma — correção/ajuste de tela. Os dados demo **continuam** existindo; só o atalho mudou de lugar.

**Itens do inventário:** #50, #51, #186.

**Como testar.** Olhe a coluna da esquerda: só + Operação e as setas. ⚙ → Dados / Sync: o tubo de ensaio está lá.

### Selos por extenso ao parar o mouse

**O que você vê.** **NÃO AJ** na CDA `90.8.21.000200-02` (Agro, FGTS) mostra “Não ajuizada”. **AJ** mostra “Ajuizada”. O código curto do processo (A, IA…) ganha a frase completa.

**Antes.** O `title` longo das colunas já existia; o selo curto não dizia o nome.

**Por que mudou.** Sigla opaca na lista.

**Decisão sua.** Nenhuma — correção/ajuste de tela.

**Itens do inventário:** #52, #53.

**Como testar.** Inscrições da Agro → pare o mouse em NÃO AJ.

### Briefing: cartão vazio some

**O que você vê.** Cartão “Observação” (e equivalentes) **sem texto** não aparece mais, nas duas edições. Títulos antigos (Hipótese, Situação, Pendências…) são lidos como os tipos novos. Os textos demo da Fachada Norte etc. continuam, porque têm corpo.

**Antes.** Um cartão oco ocupava a página.

**Por que mudou.** Achado de tela: ruído.

**Decisão sua.** Nenhuma — correção/ajuste de tela.

**Itens do inventário:** #54.

**Como testar.** Abra o Briefing de uma operação demo. Não deve haver cartão de observação em branco.

### Agenda da semana: volta para a semana de hoje

**O que você vê.** No **Painel** (clássico e Beta), o quadro Semana/Mês/Hoje, ao sair do mês e voltar para Semana, mostra a semana corrente. Na conferência: **14–20 set 2026**. Antes, ia para a semana do dia 1 daquele mês.

**Antes.** Mês → Semana = primeira semana do mês que você estava olhando.

**Por que mudou.** Você perdia a semana de trabalho.

**Decisão sua.** Nenhuma — correção/ajuste de tela. (Na Beta, a aba **Agenda** reutiliza o mesmo quadro — capítulo D.)

**Itens do inventário:** #55.

**Como testar.** Painel → Mês → Semana. Deve cair em 14–20 set (ou a semana de hoje, se a data do sistema mudou).

### Atributos invisíveis (preparação para a Beta)

**O que você vê.** No clássico, nada. Por baixo, a linha da CDA ganha um identificador para a Beta poder rolar até as três colunas, e alguns campos ganham marca para o cursor cair na data. Ao salvar, o app apaga essas marcas para não ir para o JSON / Planilha.

**Antes.** Não existiam.

**Por que mudou.** Sem isso, “Abrir” / “Conferir” na Mesa não acertam as colunas.

**Decisão sua.** Nenhuma — correção/ajuste de tela.

**Itens do inventário:** #40, #57, #58.

---

## Bloco D — Estrutura da Beta (layout, Hoje, Agenda)

### A Beta mora na casa do clássico

**O que você vê.** Coluna da esquerda com as cinco operações. Faixa de cima. Temas Mar / Claro / Ferro. Captura da primeira tela: `01-hoje.png`. Tema Claro: `24-tema-claro.png` — mesmo layout, papel claro, **sem** a paleta Ardósia/Grafite. Quem tinha salvado “Ardósia” na Demo antiga volta ao tema clássico gravado (em geral Mar Profundo).

**Antes.** Demo = trilho preto 76 px, título enorme “Hoje / Carteira / Biblioteca”, pílula **Demo**, quatro zonas dentro da operação, gaveta Trabalho, visões A/B/C de Processos.

**Por que mudou.** Princípio do plano: clássico intocado; Beta herda a navegação que você já usa, não uma casa paralela.

**Decisão sua.** **Adotar este casco** (sidebar + top-nav). Alternativa neste lote **não existe**: o trilho foi apagado da Beta. Recusar o casco e “ficar com a Demo antiga” exigiria restaurar o que saiu, não é um interruptor. Consequência de adotar: some Central de Comando, zonas, árvore Carteira no trilho, ranking extra em Operações, A/B/C. Consequência de recusar a Beta: você permanece no clássico, que nunca teve trilho.

**Itens do inventário:** #61, #62, #63, #64, #65, #82, #83, #181, #188.

**Como testar.** ⚙ → Nova versão (beta). Deve haver sidebar. Não deve haver barra “Central de Comando”. ⚙ → Aparência/Tema: só Mar, Claro, Ferro.

### O que saiu da Demo antiga (e o que ficou no arquivo sem tela)

**O que você vê.** Dentro da Agro Horizonte, as abas clássicas — não Briefing/Acervo/Risco/Ferramentas. Sem chevron “Trabalho”. Sem lista de operações **dentro** do trilho. Sem bloco “Painel da Carteira” **em Operações** (o ranking do **Painel** clássico, visível em `02-painel-kpi.png`, **não** é isso: ele já existia no clássico e continua). Processos: só a visão master–detail. A busca “Filtrar processo / CDA” ocupa o lugar do seletor A/B/C.

Você **não vê** Ardósia/Grafite. Há desenho antigo ainda no arquivo, desligado. O ranking da Carteira da Demo permanece no arquivo, sem tela. Não é capacidade nova nem tela extra.

**Antes.** Demo Experimental com trilho, zonas, A/B/C, Trabalho.

**Por que mudou.** Uma navegação só.

**Decisão sua.** Nenhuma — o casco do tema acima já decide. Limpeza futura do desenho morto não muda o que você usa.

**Itens do inventário:** #66–#70, #81, #182–#185, #189, #193, #194.

### Faixa de cima: nove itens, e o que não cabe vai para Mais

**O que você vê.** **Hoje · Painel · Prazos · Operações · Intimações e Tarefas (40) · Mesa (7) · Acompanhar (6) · Agenda (8) · Modelos (6)** e, à direita, o nome da operação truncado (`Operação Agro Hori…`). Não diz “Prazos extintivos” nem “Audiências”. **Intimações** e **Tarefas** são **um** botão na faixa, com a soma; por dentro, as duas abas continuam (Intimações · 20 / Tarefas · 28 na captura `18-intimacoes.png`). A **Mesa** desta faixa é a de **pins de intimação**, não a Mesa de prazos. Prazos da prescrição estão no item **Prazos**.

Se a janela ou o zoom não couber, os últimos itens saem da faixa e entram em **Mais ▾**. Não quebra linha. Nos testes 90/100/110 %, a faixa inteira coube, sem Mais.

**Antes.** Clássico: Painel, Prazos extintivos, Operações, Intimações e Tarefas, Mesa, Acompanhar, Audiências, Modelos. Demo: trilho + topbar próprio.

**Por que mudou.** Zoom 90 + nome da operação quebrava a faixa.

**Decisão sua.** Nenhuma — ajuste de tela, dado o casco. Atenção: duas coisas chamadas “Mesa”. Se isso confundir, o remédio seria renomear uma delas — **não foi feito**.

**Itens do inventário:** #71, #72, #73, #157, #201.

**Como testar.** Olhe a faixa em `01-hoje.png`. Aperte o zoom. Se algum item sumir, deve estar em Mais ▾, não numa segunda linha.

### Vista Hoje como primeira tela

**O que você vê.** Ao ligar a Beta, a primeira tela é **Hoje**. Kicker: **NEXUS · Nova versão (beta)**. Título: **Bom dia. O que exige ação hoje?** Fila única de intimações, tarefas, audiências e riscos. Botões: Abrir Intimações (20), Abrir Tarefas (20), Abrir Mesa (7), Nova intimação, Ver operações. Primeira linha da fila nos dados demo: tarefa **Analisar viabilidade de redirecionamento à sucessora** (Sucessão, **4d atrasado**). Em seguida a intimação IDPJ da Fachada Norte `5009876-11.2024.4.04.7001` (**2d atrasado**) e a audiência 16:00 da Agro. Não há botão de resetar dados demo nesta página. `01-hoje.png`.

Ao **voltar** para Clássico estando em Hoje, o app cai no **Painel** (o clássico não tem aba Hoje).

**Antes.** Demo abria num “Central de Comando” com outro texto. Clássico abre no Painel.

**Por que mudou.** Herança útil da Demo: um lugar que responde “o que eu faço agora?”, sem o casco antigo.

**Decisão sua.** Nenhuma — ajuste de tela, se a Beta for adotada. O retorno ao Painel (#153) evita uma tela fantasma no clássico.

**Itens do inventário:** #74, #75, #76, #77, #153, #186.

**Como testar.** ⚙ → Nova versão (beta): deve abrir Hoje. Nova intimação a partir daí, com a Agro aberta: o campo operação já vem **Operação Agro Horizonte**. ⚙ → Clássico: deve ir ao Painel.

### Agenda unificada

**O que você vê.** Item **Agenda** (não “Audiências”). Em cima: grade Semana | Mês, setas **‹ ›**, botão **Hoje**, intervalo **14 de set. – 20 de set. de 2026**. Embaixo: a lista que você já conhece — **Esta semana** (audiência 20 set 16:00 Agro; 22 set 14:30 Fachada Norte) e **Este mês**. `21-agenda-semana.png`. O mês: calendário de setembro de 2026 + a mesma lista (`22-agenda-mes.png`). No clássico a aba continua só a lista, nome **Audiências**.

**Antes.** Demo tinha agenda à parte; clássico, só cards Esta semana / Este mês.

**Por que mudou.** Um lugar só para “quando”.

**Decisão sua.** Nenhuma — ajuste de tela. A troca Mês→Semana cair na semana de hoje já vale no Painel clássico (#55).

**Itens do inventário:** #78, #79.

**Como testar.** Beta → Agenda. Deve ver a grade **e** os cards. Clássico → Audiências: só os cards.

### Título da janela e tela de carregamento

**O que você vê.** Aba do navegador: **NEXUS Beta**. “Carregando NEXUS 2.0.7 Beta…”.

**Antes.** “NEXUS Demo — Central de Comando”.

**Decisão sua.** Nenhuma — ajuste de tela.

**Itens do inventário:** #80, #147.

---

## Bloco E — Prazos / Mesa de trabalho

Aqui está o coração visível da Beta. Preferência gravada: Mesa ou Lista (padrão **Mesa**). O clássico não tem o seletor.

### A Mesa e seu teto de 12

**O que você vê.** Prazos abre em **Mesa**. Filtros: operação + busca “CDA, processo ou devedor”. Bloco de cima, borda esquerda vermelha, título **PRECISA DE VOCÊ**. Nos dados demo: **duas** linhas — `90.6.23.000884-40` (R$ 48.000) e `90.6.20.000881-40` (R$ 95.000), ambas Agro, **sem processo**, selo verde **CALCULADO**, frase dos 180 dias, botões Evento · Abrir · Conferir · Adiar…. Abaixo, uma linha só: **O RESTO G1 0 · G2 0 · G3 1 · G4 0 · G5 9**. Clique expande. Sem alarme vermelho. `03-mesa.png`, `04-mesa-resto.png`.

Quem entra em PRECISA DE VOCÊ: grupo 1 **sempre**; grupo 2 só se a estimativa **já passou**; grupo 3 só se a ação for lançar fato / corrigir ficha / vincular EF; qualquer grupo se a data de rever já passou. **“Só conferir nos autos” no grupo 3 não sobe.** Por isso a `000045-88` (R$ 5,6 mi, Sucessão, prazo em curso, cadastro a completar por conflito de data e IDPJ) fica em O RESTO, não no vermelho.

Teto: **12** linhas no bloco de cima. A 13ª vira botão vermelho **+K acima do orçamento**, clicável. Nos dados demo o teto não dispara (só 2). Numa carteira de teste grande, o botão leu **+828 acima do orçamento**, com 12 linhas visíveis; depois de um ajuste de desenho, o botão **não** fica escondido atrás da barra Silenciados.

Vazio: “Nada exige decisão agora. O restante está abaixo, sem alarme.” Termo já passado ganha o mesmo vermelho das intimações vencidas. Selo de certeza: calculado / estimado / cadastro.

**Antes.** Lista de cinco grupos, todos com o mesmo peso visual de contador. Oito “a completar” no mesmo andar que dois urgentes. Sem teto. Sem “precisa de você”.

**Por que mudou.** Alarme ≠ consciência. Uma lista de 15 urgentes sem corte vira parede. Grupo 3 “só ler os autos” não é ato de um clique.

**Decisão sua (teto 12).** **No máximo 12 no bloco vermelho; o resto atrás de um botão.** Alternativa: sem teto (tudo vermelho) ou teto maior. Consequência de adotar: na carteira real, o 13º urgente exige um clique a mais. Consequência de recusar o teto: o bloco de cima pode ficar maior que a tela (o teste grande mostrou centenas acima de 12).

**Decisão sua (quem sobe).** **Grupo 3 só sobe com ação de um clique; G3 “conferir autos” fica no RESTO; G5 sai do RESTO e vai à gaveta.** Alternativa: todo grupo 3 no vermelho — a `000045-88` de R$ 5,6 mi subiria, embora a ação seja conferir, não lançar fato. Alternativa: G5 no RESTO — “ainda impossível” inflaria o meio da tela. Consequência de adotar: o vermelho da demo são só as duas da Agro (R$ 143.000). A de R$ 5,6 mi continua visível, sem alarme.

**Itens do inventário:** #84, #85, #86, #87, #88, #89, #90, #91, #92, #93, #94, #95, #96, #97, #98, #101, #167, #168, #169, #170, #171.

**Como testar.** Beta → Prazos. Deve abrir Mesa, duas linhas vermelhas da Agro, RESTO com G3 1, Silenciados (15). Clique O RESTO: a `000045-88` de R$ 5.600.000. Clique Lista: os cinco contadores da fila v2.

### A gaveta Silenciados

**O que você vê.** Barra no rodapé: **SILENCIADOS (15) ▸**. Abre a lista. Parceladas com evento: “Parcelamento vigente · até 17/12/2026”, **sem** botão Reabrir. Ainda impossível: `90.6.19.000047-88` “Ainda impossível · até 02/05/2028”, e irmãs da Agro/Holding/Fachada com datas até 2032. `05-gaveta.png`. Se um Adiar seu acaba nesta semana, a barra avisa em amarelo: “K adiamentos vencem esta semana”.

**Antes.** Essas CDAs ou sumiam (parcelamento) ou inchavam “A completar” / “Ainda impossível” na lista. Não havia gaveta.

**Por que mudou.** Nada some. R6 respeitado (sem alerta), com consciência.

**Decisão sua.** **G5 e parcelamento vigente moram na gaveta, não no alarme.** Alternativa: G5 continuar nos contadores do meio (clássico lista). Consequência de adotar: nove “ainda impossível” saem da vista principal; você só as vê abrindo a gaveta. Consequência de recusar a gaveta: a Mesa perde o lugar do que não é alarme — voltariam à lista ou sumiriam.

**Itens do inventário:** #109, #110, #111, #158, #174.

**Como testar.** Clique SILENCIADOS (15). Confira as seis parceladas no topo e a `000047-88`. Parcelamento vigente **não** deve ter Reabrir agora.

### Adiar com motivo

**O que você vê.** Botão **Adiar…** na linha. Motivo (lista fechada), data (mínimo hoje, máximo o teto do grupo), texto se Outro. Sem motivo/data não grava. Toast “Adiada até …”. Conferência: a ITR `000884-40` com **Peça protocolada** até **02/10/2026** (hoje 18/09 + 14 dias) some de PRECISA DE VOCÊ e vai à gaveta com **Reabrir agora**. Silenciados passa a (16). A IRPF `000881-40` permanece no vermelho. Toast “Adiada até 02/10/2026”. `07-adiar-gaveta.png`. Reabrir: toast “Reaberta na mesa”; a ITR volta. `08-reabrir.png`. Se o adiamento caducar ou o motor furar, a linha volta com selo **expirou o silêncio**.

**Antes.** Não havia. Só Tratar (tira de outro modo) ou deixar no vermelho.

**Por que mudou.** Precisava calar o alarme **com prazo e motivo**, sem fingir que o crédito acabou.

**Decisão sua.** Os tetos e furos já estão no Bloco B. Na tela: **sem texto em “Outro”, não adia** (toast “Descreva o motivo para adiar”). Alternativa: aceitar “Outro” vazio — o motivo some e o silêncio fica opaco. O campo fica no JSON; o clássico não lê (capítulo H).

**Itens do inventário:** #112, #94, #165.

**Como testar.** Na ITR da Agro → Adiar… → Peça protocolada → data máxima → Adiar. A linha some do vermelho. Gaveta → Reabrir agora. Deve voltar.

### Ações de um clique

**O que você vê.** Além dos quatro botões fixos, a Mesa pode mostrar um botão extra: **Lançar fato**, **Vincular EF**, **Corrigir ficha**, **Lançar ciência**. Parcelada sem adesão: **campo de data na própria linha**, “Enter lança a adesão”, toast “Adesão lançada” — sem abrir a janela grande. Vincular EF foca o número do processo; corrigir ficha foca a data de prescrição.

**Antes.** Abrir + Evento em branco, ou editar a ficha caçando o campo.

**Por que mudou.** Cadastro a completar tem de ser ato, não leitura.

**Decisão sua.** Nenhuma além das do Bloco B (o que **é** inconsistência). O desenho do clique é ajuste de tela.

**Itens do inventário:** #113, #114.

**Como testar.** Crie uma CDA Parcelada sem adesão. Na Mesa deve aparecer o campo de data. Enter com uma data de hoje: a linha deve sair do vermelho/cadastro e, se a adesão ficar vigente, ir à gaveta.

### + Evento e o IDPJ

**O que você vê.** **Evento** na linha já traz a CDA. Conferência: título **Novo(a) Evento Prescricional**, faixa “CDA: 90.6.23.000884-40 — R$ 48.000”. Como essa ITR **não tem** execução, o campo EXECUÇÃO FISCAL fica em **Selecione…** (as quatro EFs da Agro aparecem na lista). O cursor cai na data. `09-evento-prefill.png`. Na **Lista** da Beta, + Evento faz o mesmo.

Se o destino escolhido for IDPJ/cautelar, a família deixa de se chamar “Penhora / resultado útil” e passa a **Constrição no incidente (pausa as EFs)**. A família de ciência passa a **Ciência do art. 40**. Confirmado na reteste da conferência (depois de escolher o incidente). Sisbajud: “se houve constrição”, não “resultado útil”. Formulário da CDA na Beta: some “(política interna)”; “Datas do crédito…” no lugar de “Marcos do crédito”; dica da data digitada: “Se o app já calculou o termo, esta data aparece como conflito — não cala o cálculo.” O clássico **continua** com Tema 566 e Súmula 622 nas dicas — a janela é a mesma; só a Beta troca o texto.

**Antes.** + Evento pedia CDA/EF na mão. No IDPJ, o menu falava como se fosse a execução.

**Por que mudou.** R7: constrição no incidente **pausa** as EFs; não encerra o ciclo da execução. O rótulo antigo induzia “resultado útil na EF”.

**Decisão sua.** Nenhuma — ajuste de tela, alinhado a R7. Recusar só o filtro de jargão (#99) deixa Tema 566 nas dicas da Beta.

**Itens do inventário:** #115, #116, #117, #99.

**Como testar.** Mesa → Evento na ITR da Agro: CDA preenchida, data em foco, EF vazia. Numa CDA da Sucessão com IDPJ, abra Evento, escolha o IDPJ na execução: a família deve dizer constrição no incidente.

### Abrir / Conferir: cai nas três colunas

**O que você vê.** **Abrir** ou **Conferir** vai à aba Inscrições da operação, **rola até as três colunas**, com **Copiar / Evento / Editar** grudados em cima. `10-conferir.png`, `11-abrir-colunas.png`. Cabeçalho da Agro começa **recolhido** (sem a faixa DÍVIDA TOTAL / PRESC. CDA) — capítulo F. Embaixo, as ajuizadas já mostram a frase nova: “Ainda não pode ter prescrito… · em 6 anos”.

**Antes.** Abrir ia às Inscrições, mas você caía no topo da lista e as colunas ficavam fora da vista. Os três botões sumiam ao rolar.

**Por que mudou.** Conferir nos autos é olhar as colunas, não a lista.

**Decisão sua.** Nenhuma — ajuste de tela.

**Itens do inventário:** #118, #119, #178.

**Como testar.** Mesa → Conferir na ITR. Deve ver Decadência | Prescrição ordinária no alto, Copiar/Evento/Editar visíveis, Regras v2026.09.

### KPI honesto

**O que você vê.** Painel da Beta, quarto cartão, rótulo **Prazos**: **2 urgentes · 1 para completar cadastro · R$ 143.000,00**, subtítulo **só o que pede decisão agora**. O real é o das **urgentes** (grupo 1), não a soma com grupo 2. A `000045-88` de R$ 5,6 mi **não** entra nesse R$. `02-painel-kpi.png`. Abaixo, o azulejo “Prazos extintivos” ainda mostra 2 urgentes · 0 a conferir · 1 a completar (os três números da fila v2).

No cabeçalho da operação (quando você **abre** o resumo ▾): o clássico diz **PRESC. CDA 2 risco (1+2)**. A Beta conta **só o grupo 1** e, se já venceu, o selo **VENCIDA** no mesmo peso da intimação. Card de processo: se alguma CDA está grupo 1 vencido, o card grita **VENCIDA**.

**Antes.** “Risco prescricional **2** · R$ 143.000 em risco” no clássico — neste demo o R$ coincidiu porque não há grupo 2. O “8 a completar” do clássico **incluía** as ainda impossíveis puxadas pelo IDPJ. “risco (1+2)” no cabeçalho misturava calculado e estimado.

**Por que mudou.** KPI que soma estimado com calculado e que inclui “ainda impossível” como cadastro mente sobre o que é urgente hoje.

**Decisão sua.** **O R$ do cartão Prazos é só grupo 1.** Alternativa: somar grupo 2 (estimado) — o número de crédito “em risco” sobe com hipótese, não com termo calculado. Alternativa: incluir G3 no R$ — a Sucessão de R$ 5,6 mi inflaria o cartão embora esteja em O RESTO. Consequência de adotar: o Painel da Beta, neste demo, mostra R$ 143.000, não R$ 5,7 mi. Consequência de recusar: o cartão volta a parecer o clássico e o princípio alarme ≠ consciência enfraquece no primeiro número que você vê de manhã.

**Itens do inventário:** #107, #108, #106.

**Como testar.** Beta → Painel: leia o quarto cartão. Compare com Clássico → Painel: “Risco prescricional 2 · R$ 143.000”. Abra a Agro na Beta, expanda o resumo ▾: PRESC. CDA deve ser 2, sem o texto “risco (1+2)”.

### A linha da inscrição

**O que você vê.** Inscrições da Agro (`13-inscricoes.png`): campo **Filtrar processo / CDA**. FGTS `90.8.21.000200-02`: “Prescrição: **sem ciência lançada**” (não um travessão). IRPF `000881-40`: “O termo calculado cai nos próximos 180 dias. · 160d”. ITR `000884-40`: a mesma frase · **70d**. Some a tag “(informada)” ao lado do rótulo; se a ficha diverge, a frase vira “Ficha 26/01/2027 · app 14/08/2031 — conferir”. CDA já tratada: “Tratada em dd/mm”, não a contagem. Prazos longos: **em N anos** / **há N anos**, nunca um número absurdo entre parênteses. No card do processo, a Beta evita a palavra **Prescrita** quando o app só estimou.

Processos e Prescrição (`14-processos.png`): o mesmo filtro; visão D; cautelar `5006699-22.2025.4.04.7006` com “ainda impossível”; sem seletor A/B/C.

**Antes.** “27/03/2027 (190d)” ou “—”. “(informada)” no rótulo. Estimativa podia dizer Prescrita.

**Por que mudou.** R11 (ficha não cala o cálculo) precisa aparecer na linha, não só nas colunas. Travessão não é informação.

**Decisão sua.** Nenhuma — ajuste de tela, lendo a fila v2. Recusar o filtro de jargão deixa “piso” nas frases se o texto cru voltar.

**Itens do inventário:** #102, #103, #104, #105, #154, #135, #136.

**Como testar.** Agro → Inscrições. Digite `884-40`: deve sobrar a ITR. A linha não deve ser “—”. Ajuizadas: “em 6 anos”, não um inteiro enorme.

### Lista da Beta (se você recusar a Mesa)

**O que você vê.** Botão **Lista**: os cinco contadores da v2, agrupado por processo, + Evento pré-preenchido, frases passadas pelo filtro de jargão. `12-prazos-lista.png`. A `000047-88` aparece como grupo **5** (não 3). Rodapé: “Ainda impossível — 8 inscrição(ões) recolhidas.”

**Antes.** A lista clássica com 8 a completar.

**Decisão sua.** Nenhuma além de Mesa vs Lista. Dá para adotar a Beta **sem** a Mesa: fica esta Lista v2.

**Itens do inventário:** #122, #84.

**Como testar.** Mesa | Lista → Lista. Compare os contadores com o clássico.

### Arquivada art. 40: pede a data

**O que você vê.** Ao marcar o processo **Arquivada art. 40** na Beta, em vez do sim/não das CDAs, abre a janela **Arquivada art. 40 — lançar a data**. “O que você tem em mãos?”: data da ciência (não localização / sem bens) ou data do arquivamento. Se ciência: tipo **Suspensão do art. 40 (vale como ciência)** ou **Ciência de ausência de bens**. Data obrigatória. **Agora não** / **Lançar**. Sem data: toast “Informe a data”. Lançar cria um evento **por CDA ligada**. Toast “N evento(s) lançado(s)”. Processo da conferência: `5006610-22.2022.4.04.7006`. Extinta na Beta **ainda** usa o confirm antigo.

**Antes.** Um sim/não. Status “Arquivada art. 40” **sem data** não inicia o ciclo (R10). Fácil marcar o status e ficar sem ciência lançada.

**Por que mudou.** R10: suspensão do art. 40 **com data** vale como ciência, com aviso. Status sozinho não prova a data.

**Decisão sua.** Nenhuma — o R10 você já adotou no caderno. A janela só impede o status oco. Recusar a janela: a Beta volta ao sim/não e o risco do R10 volta.

**Itens do inventário:** #120.

**Como testar.** Agro → Processos → uma EF → status Arquivada art. 40. Deve pedir a data. Lançar ciência: a coluna da CDA deve mostrar Início nessa data (Bloco A #13).

### Status garantida: Sisbajud não pinta sozinho

**O que você vê.** Na Beta, lançar **bloqueio Sisbajud**, **CNIB** ou **constrição de IDPJ** **não** muda o status da CDA para Garantida. **Penhora** e **arresto** ainda pintam, e o app marca que foi ele quem pintou (`statusSource: auto`). O clássico **continua** promovendo Sisbajud/CNIB/IDPJ a garantida.

**Antes.** Qualquer desses fatos pintava Garantida. O KPI GARANTIDO e os filtros acompanhavam.

**Por que mudou.** Quem lança o Sisbajud decide se houve constrição / resultado útil (decisão de política n. 6 do caderno). Pintar Garantida no status misturava “houve bloqueio” com “há garantia”. R3: bloqueio positivo **na própria execução** encerra o ciclo — isso continua no **cálculo**, se você lançar o fato como resultado útil. O que parou foi o **status** automático.

**Decisão sua.** **Na Beta, só penhora e arresto pintam Garantida.** Alternativa: clássico (Sisbajud/CNIB/IDPJ também pintam). Consequência de adotar: o cartão GARANTIDO da operação **não** sobe só porque houve Sisbajud; você pinta na mão se quiser. Consequência de recusar: a Beta volta a inflar “garantido” com bloqueio de conta. Se você lançar Sisbajud na Beta e depois voltar ao clássico, o status **não** terá sido pintado — o clássico não “completa” o que a Beta recusou.

**Itens do inventário:** #121, #202 (o campo `statusSource`).

**Como testar.** Na Beta, Evento → Sisbajud numa CDA ativa. O selo da inscrição **não** deve virar Garantida. Repita penhora: deve virar.

---

## Bloco F — Demais telas da Beta

### Intimações: vencidas primeiro, dois blocos

**O que você vê.** Modo padrão **Prazo final (mais próximo)**. Título **Vencidas** (vermelho) acima de **Urgentes no prazo** (amarelo). Primeira: Fachada Norte, Marina Ferreira Norte, `5009876-11.2024.4.04.7001`, IDPJ, **VENCIDA 2d**, mesmo com ⚑ Urgente em outras que ainda têm prazo. `18-intimacoes.png`. **Importar eproc** continua no canto. Janela nova: título **Nova intimação** (não “Novo(a) Intimação”); **Cancelar/Salvar** grudados embaixo; operação já preenchida se você veio de uma operação aberta (`19-validacao.png`).

**Antes.** Urgente manual podia ficar acima de uma já vencida. Título “Novo(a) Intimação”. Salvar sumia em intimação longa.

**Por que mudou.** Vencida é fato; Urgente é marca sua. Fato primeiro.

**Decisão sua.** Nenhuma — ajuste de tela. Recusar só isto: a ordem volta à do clássico, com Urgente podendo cobrir vencida.

**Itens do inventário:** #124, #125, #126, #127, #128, #176.

**Como testar.** Beta → Intimações e Tarefas. A VENCIDA da Fachada Norte deve ser a primeira. + Intimação: título “Nova intimação”.

### Tarefas: um número, atraso visível

**O que você vê.** Aba Tarefas da operação: “N aberta(s)” e a linha “G globais · M só na operação”. Some o itálico longo do clássico (“Todas as tarefas desta operação…”). Na lista geral, a mesma conta. Tarefa com prazo passado: selo **ATRASADA Nd**, no padrão das intimações. A de redirecionamento à sucessora (4d atrasada na Hoje) é o exemplo.

**Antes.** “4 aberta(s) · 0 concluída(s)” e o texto 🔒. Atraso só na cor da data.

**Decisão sua.** Nenhuma — ajuste de tela.

**Itens do inventário:** #129, #130, #131, #132.

**Como testar.** Agro → Tarefas. Deve dizer globais vs só na operação. Sucessão → a tarefa de redirecionamento, se ainda atrasada, com ATRASADA.

### Relatório gerado

**O que você vê.** Depois do HTML de passagem de serviço, um recado curto **Relatório gerado** (além do download).

**Decisão sua.** Nenhuma — ajuste de tela.

**Itens do inventário:** #133.

### Cabeçalho da operação começa fechado

**O que você vê.** Ao abrir a Agro na Beta, os cartões DÍVIDA TOTAL / GARANTIDO / PRESC. CDA começam **fechados**. O botão ▾/▴ abre. Os chips do panorama do Briefing **já** nasciam fechados — isso não mudou. Capturas 10/11/13/14: chips ALTA · Em Andamento no canto, sem a faixa de oito cartões.

**Antes.** Os oito cartões ocupavam o primeiro terço da operação.

**Por que mudou.** Pedido de uso: chips/KPIs recolhidos; a ficha primeiro.

**Decisão sua.** Nenhuma — ajuste de tela. A preferência grava-se no navegador; se você já abriu o resumo, ele lembra.

**Itens do inventário:** #134.

**Como testar.** ⚙ → Beta (de uma sessão limpa). Abra a Agro: sem a faixa de KPIs até clicar ▾.

### Busca, chips zerados, KPIs numa linha, dicas abaixo

**O que você vê.** **Filtrar processo / CDA** em Inscrições e em Processos. Chip “Parcelamento Integral (0)” **não aparece** na Beta; no clássico o chip zerado continua. Tema Claro + zoom 90: os cartões do cabeçalho (quando abertos) tentam ficar numa faixa só, sem quebrar palavra no meio. Dicas (tooltip) abrem **abaixo** do alvo, para não cobrir a Agenda nem o nome da operação na faixa.

**Decisão sua.** Nenhuma — ajuste de tela.

**Itens do inventário:** #135, #136, #137, #138, #139, #177, #179.

**Como testar.** Operações na Beta: não deve haver chip com (0). Passe o mouse num selo da faixa de cima: a dica deve nascer abaixo.

### Rótulo Aparência

**O que você vê.** No ⚙ da Beta, o grupo Mar / Claro / Ferro chama-se **Aparência**. No clássico, **Tema**. (A captura `20-settings.png` mostra o grupo em maiúsculas; o texto-fonte desta árvore é Aparência na Beta.)

**Decisão sua.** Nenhuma — ajuste de tela.

**Itens do inventário:** #140.

### Abrir CDA a partir da lista clássica

**O que você vê.** “Abrir” na aba Prazos, nas duas edições, vai sempre a Inscrições. O desvio das zonas da Demo antiga acabou.

**Decisão sua.** Nenhuma — correção/ajuste de tela.

**Itens do inventário:** #141.

---

## Bloco G — Documentação, testes e o que você não vê

Este bloco quase não tem tela. Existe para o app não regressar e para o HTML da Beta existir.

**O que você vê.** Página ⓘ **Regras de prazos**: o histórico ganha o parágrafo **2026.09a** (18/09/2026) descrevendo as contas do Bloco A. O **número** no título da janela e no ⚙ continua **v2026.09**. Sem gerar o HTML (`npm run build`), só o arquivo no computador muda. O caderno `docs/MELHORIAS.md` passou a chamar a Demo de Nova versão (beta); a data do topo do caderno **não** foi atualizada (continua 03/08/2026). Esse caderno **não** sobe para o Apps Script.

**Antes.** Histórico parava em 2026.09.

**Por que mudou.** As contas mudaram; o número da versão na tela **não** foi promovido, de propósito, para não sugerir um pacote de regras novo além do parágrafo.

**Decisão sua.** Nenhuma — o 2026.09a é o texto do Bloco A. Recusar só o parágrafo deixa a página de regras muda sobre as contas novas.

**Itens do inventário:** #143, #144, #145, #19.

**Como testar.** Qualquer edição → ⚙ → Abrir regras → final do texto, Histórico 2026.09a.

### Rede de segurança (testes e compilação)

Não é tela. 37 testes a mais (27 da política/contas + 10 da Mesa). A suíte vai de 196 para 233. Sem o arquivo da Mesa entrar no HTML gerado, a Beta não tem frases nem recorte. Atalhos antigos no seu computador (`Nexus_demo.html` etc.) ainda abrem a Beta; não vão para o git. Comentários do compilador dizem “NEXUS Beta”.

Há restos **invisíveis**: um fechamento de modal de atuação declarado e não usado; o ranking da Carteira da Demo ainda no arquivo; CSS do trilho antigo desligado. A regra da casa é não apagar capacidade sem pedido. Nada disso muda o que você clica.

**Decisão sua.** Nenhuma — sem isto a Beta não monta. Recusar testes é recusar a rede que prova o Bloco A e a Mesa.

**Itens do inventário:** #146–#151, #155, #156, #159, #160, #192, #195.

---

## Bloco H — O que não mudou

Confirmado pelo confronto com a versão `1dc76ea`. Não há alteração no servidor Apps Script (`Código.js`: abertura do app, backups, Drive). Não há alteração nos leitores de planilha/PDF (eproc, XLS da Procuradoria, bens, processos, PDF PGFN). **Importar eproc continua no botão** — não foi removido. Sync ⬆⬇ e auto-sync no ⚙ são os mesmos (só o tubo de ensaio saiu da sidebar). Os dados demo das cinco operações são os mesmos, inclusive a audiência 16:00 da Agro. A calculadora **v1** do clássico (a fila antiga) permanece para quem abre `Nexus.html`. Formulários além da validação e dos textos listados: iguais.

### O e-mail da manhã continua o de antes

**O que você vê (na prática, na caixa de entrada).** O resumo diário **não foi mexido**. Ele ainda:

- olha o **retrato gravado** de cada CDA no JSON (o que o app grava ao salvar na Planilha), classificado pela fila **antiga** (v1) — mesmo que você esteja usando a Beta na tela;
- usa janela de **90 dias** para acompanhamento (grupo 4), não os 180 da fila da tela;
- inclui grupos 1, 2 e 3 desse retrato; grupo 5 **nunca**; “aguardando reconhecimento” **não entra** (está marcada como tratada);
- ficha parcelada **sem** adesão **não entra** (v1 esconde);
- a seção “Mesa” do e-mail é a Mesa **de pins** (intimações/tarefas/audiências), não a Mesa de prazos.

O plano registrou, **fora de escopo**: não tratar a data de interrupção como se fosse o termo; incluir grupo 1 vencidos com mais clareza; janela por grupo. **Ninguém fez.**

**Por que importa.** Você pode adotar as contas certas e a Mesa honesta **e**, na manhã seguinte, o e-mail ainda listar as oito “a completar” do clássico (IDPJ puxando ainda impossível) e **calar** a ficha parcelada sem adesão. Tela e e-mail passam a discordar.

**Decisão sua.** **Deixar o e-mail antigo** (o que este lote faz) **ou** pedir um lote específico para o resumo diário. Alternativa não feita: o e-mail ler a fila v2, incluir Silenciados, usar 180 dias, não calar “aguardando”. Consequência de adotar o lote como está: a Beta na tela não muda o e-mail das 7h. Consequência de recusar o lote por causa do e-mail: você segura a tela certa por um canal que nem foi alterado.

**Itens do inventário:** #196, #197, #190.

### Campos novos se você usar a Beta e voltar ao clássico

**O que você vê.** Nada, no clássico. Por baixo, a CDA pode ganhar `prescSnooze` (o Adiar) e `statusSource` (marca de status pintado pelo app). JSON antigo abre nas duas edições. Rejeitar a Beta **não** exige migrar arquivo.

Se você adiar na Beta e voltar ao clássico: o campo fica parado; o clássico **mostra a CDA na fila** como se não houvesse adiamento. Se a Beta recusou pintar Garantida no Sisbajud e você volta ao clássico: o status continua o que era (não-garantida), até você lançar de novo no clássico — aí o clássico pinta.

**Decisão sua.** Nenhuma obrigação de migrar. Só saber: **Adiar não viaja para o clássico.** Status que a Beta não pintou também não aparece pintado lá.

**Itens do inventário:** #202.

### A Mesa de pins não foi o alvo

A vista **Mesa** da faixa (7 pins no demo) continua. A Mesa nova é a de **Prazos**. Duas portas, mesmo nome. Inventário #201.

### Parsers, sync, dataset

**Itens do inventário:** #198, #199, #200.

---

## Bloco I — Leitura do DEBCAD (correção de 18/09/2026)

Correção nas **duas edições**. Não é tela da Beta. O PDF `RelatorioCompleto-debcad-149630450.pdf` (AGROTRAC, inscrição 08/05/2021, não ajuizada) era o caso.

**O que você vê.** Na ficha da CDA 149630450, a coluna de prescrição ordinária deixa de mostrar “consumada em 08/05/2026” em vermelho. Depois de importar o PDF Debcad, aparece o protesto lavrado e o termo **17/03/2031**. A nota cinza `[Debcad] Histórico (4 fases): …` some. No lugar, um bloco recolhido **Histórico DEBCAD** (cabeçalho com a conta de fases, atualizações, protestos e se há ajuizamento). Aberto: tabela das fases, o card do protesto (identificação, tabelionato, situação LAVRADO, valor) com a linha “Protesto lavrado” marcada como o evento de prescrição em 17/03/2026, a linha “Não há ajuizamento.” e as atualizações (CADIN, PERT) atrás de outro clique, porque são muitas.

**Antes.** O leitor só conhecia as seções Dados, Histórico e Atualizações. O bloco PROTESTOS do relatório PGFN era engolido pelas atualizações e perdido. Só o PDF do SIDA criava o evento de protesto extrajudicial. A ordinária da AGROTRAC rodava só da inscrição (08/05/2021 + 5 anos = 08/05/2026), já vencida, no grau máximo de urgência. O histórico vinha como um parágrafo único ilegível.

**Por que mudou.** LC 208/2024: protesto extrajudicial da CDA lavrado a partir de 03/07/2024 interrompe a ordinária (art. 174, parágrafo único, II, CTN, na redação da lei). O motor **já** sabia disso (`int_protesto_extrajudicial`). Faltava o Debcad entregar o fato. A efetivação do “Protesto lavrado (Inf. do Cartório)” neste PDF é **17/03/2026** — depois da vigência. O protocolo (08/03/2026) e a data de criação da ocorrência (20/03/2026) **não** são a data do evento.

**Decisão sua.** Duas escolhas deste lote: (1) a data que conta é a **efetivação do lavrado**, não o protocolo no tabelionato — a mesma regra já usada no SIDA; (2) a nota condensada `[Debcad] Histórico` **sai** e o histórico passa a ser ficha estruturada. Recusar #204 mantém a ordinária “consumada” neste caso. Recusar #206 devolve o parágrafo feio se alguém reimportar com o código antigo.

**Itens do inventário:** #203–#208.

**Como testar.** Clássico (`Nexus.html`) ou Beta. Operação qualquer → criar a pessoa AGROTRAC e a CDA **149630450** (não ajuizada, inscrição 08/05/2021) → Importar → PDFs (SIDA/Debcad) → o arquivo `RelatorioCompleto-debcad-149630450.pdf`. Conferir o log (“1 protesto”, evento LC 208/2024). Abrir a ficha da CDA → expandir Histórico DEBCAD → conferir a linha marcada do lavrado e a coluna ordinária com termo 17/03/2031.

---

## Resumo das decisões que dependem de você

Escolha feita neste lote em **negrito**. Marque o inventário ao lado.

1. **Fila nova só na Beta; clássico permanece na fila antiga.** Alternativa: levar a v2 ao clássico, ou rejeitar a v2 (a Mesa perde o sentido). (#21, #22)
2. **“Aguardando reconhecimento” permanece visível, sem alarme.** Alternativa: esconder como o clássico. (#23, #24)
3. **Ficha parcelada / SISPAR / execução suspensa por parcelamento, sem adesão lançada = cadastro a completar; o prazo segue correndo.** Alternativa: status sozinho tira da fila (R6 lido pelo status). (#25)
4. **Ordinária já vencida em CDA ajuizada = grupo 1 (urgente), não “ainda impossível”.** Alternativa: grupo 5. (#26)
5. **CDA cujo número é de IDPJ/cautelar pede vínculo à execução fiscal**, não é tratada como “sem processo”. (#27)
6. **Piso futuro (“não antes de”) permanece grupo 5 mesmo com IDPJ sem constrição.** Alternativa: o incidente puxa para “cadastro a completar”, como o clássico. (#28)
7. **O recado “IDPJ sem constrição” sai da linha de cada CDA e hoje não tem tela na Mesa.** Alternativa: mostrar uma vez no processo (não feito). (#29, #123)
8. **Análise colada não rebaixa grupo 1 calculado.** Alternativa: a análise manda. (#30, #142)
9. **A frase de iminente fixa a janela de 180 dias** (já era decisão da casa no caderno). Recusar o catálogo deixa a Mesa sem frase clara. A expressão “resultado útil” **permanece** na frase de vigiar. (#31, #152)
10. **Acompanhamento volta ao alarme pela data de rever** (pausa +90d / vigiar +1 ano / piso na data / aguardando +90d / cadastro +30d). Alternativa: nunca puxar sozinho. (#32)
11. **Parcelamento vigente por evento vai à gaveta (até +90d para você conferir se ainda vale), não some.** Alternativa: sumir como o clássico. (#33)
12. **Adiar: tetos 14 / 30 / 7 / 90 dias (grupos 1 / 2 / 3 / 5) e furos se o grupo piorar, se entrar fato novo, se a data passar, ou se “Outro” vier sem texto.** Alternativa: tetos maiores ou silêncio cego. (#34, #35, #112, #165, #166)
13. **Teto de 12 linhas em PRECISA DE VOCÊ; o restante atrás de “+K acima do orçamento”.** Alternativa: sem teto. (#85, #92)
14. **PRECISA DE VOCÊ = grupo 1 + grupo 2 já estourado + grupo 3 só com ação de um clique + data de rever vencida. Grupo 5 vai à gaveta, não ao RESTO.** Alternativa: todo G3 no vermelho (a CDA de R$ 5,6 mi subiria) ou G5 no meio da tela. (#86, #87, #168)
15. **O R$ do cartão Prazos (e o número PRESC. CDA da operação) é só grupo 1.** Alternativa: somar grupo 2 e/ou o valor do cadastro. (#107, #108)
16. **Na Beta, Sisbajud / CNIB / constrição de IDPJ não pintam status Garantida; penhora e arresto pintam.** Alternativa: clássico (os três também pintam). (#121)
17. **Casco da Beta = sidebar e abas do clássico; Demo antiga (trilho, zonas, A/B/C, Ardósia) não volta por interruptor.** Recusar isto é recusar a Beta deste lote. (#61–#70)
18. **O e-mail das 7h permanece com a lógica antiga (90 dias, fila v1, sem gaveta).** Alternativa: um lote só para o resumo diário — não feito. (#197)
19. **Adiar e a marca de status automático ficam no cadastro, opcionais; o clássico ignora.** Voltar ao clássico depois da Beta não some dado, mas o adiamento **não esconde** a linha lá. (#202)
20. **No Debcad, a data do protesto que interrompe a ordinária é a efetivação do “Protesto lavrado”, não o protocolo; a nota condensada `[Debcad] Histórico` sai em favor da ficha estruturada.** Alternativa: contar o protocolo (08/03/2026 neste caso) ou manter o parágrafo único. (#203–#207)

Itens de tela sem escolha jurídica (Esc, toast, ✕ do ⚙, tooltips, Briefing vazio, semana de hoje, título Nova intimação, ATRASADA, filtro CDA, chips zero, dicas abaixo, Aparência, testes, CSS): trate como pacote de acabamento da edição que você adotar. Inventário no final de cada tema, acima.

---

## Combinações possíveis

Três pacotes realistas. Tudo parte do Bloco A: as contas certas.

### (1) Só Bloco A + C no clássico, sem Beta

Você publica o clássico com as contas corrigidas e o acabamento (formulários, ⚙, toast, demo só no ⚙). **Não** liga a Nova versão.

**O que você ganha.** Termo certo (pausas fundidas, primeira ciência, fato futuro ignorado, 29/02, art. 40 datado, ordinária “interrompida”). Menos ficha vazia. ⚙ que fecha.

**O que você abre mão.** Mesa, gaveta, Adiar, fila v2, Hoje, Agenda unificada, KPI só grupo 1, Sisbajud que não pinta Garantida, “aguardando” visível, parcelada-sem-adesão visível, ordinária consumada ajuizada no alarme. A aba Prazos extintivos **continua** com os oito “a completar” e as duas “ainda impossível” deste demo. O e-mail, como neste lote, também.

### (2) A + C + Beta inteira

Clássico com A+C **e** ⚙ → Nova versão (beta) no dia a dia. Mesa padrão, Lista a um clique.

**O que você ganha.** Tudo o que a Mesa mostra neste relatório: duas urgentes da Agro no vermelho, R$ 143.000 no KPI, R$ 5,6 mi visível sem alarme, quinze na gaveta, Adiar de 14 dias, Hoje, Agenda, intimações vencidas primeiro.

**O que você abre mão.** A Demo Experimental (trilho, Ardósia). Uma só “Mesa” com nome inequívoco (continuam duas). E-mail alinhado à tela (continuam divergentes). Recado de IDPJ numa tela própria (hoje não há). Teto 12: o 13º urgente pede clique. G5 só na gaveta: “ainda impossível” exige abrir o rodapé.

### (3) A + C + Beta sem Mesa (só a Lista v2)

Beta ligada, Prazos no botão **Lista** (a preferência grava). Sem o bloco PRECISA DE VOCÊ, sem gaveta naquela vista, sem Adiar na linha.

**O que você ganha.** A fila nova (1 a completar, 9 ainda impossível, parcelada-sem-adesão visível, aguardando visível) **e** Hoje / Agenda / intimações / KPI do Painel. Frases mais limpas. + Evento pré-preenchido.

**O que você abre mão.** O recorte “só o que precisa de você hoje”, o teto 12, a gaveta na cara, o Adiar, as ações de um clique na linha, o silêncio furado. O KPI honesto do Painel **permanece** (ele lê a fila, não a Mesa). Silenciados existem no motor, mas **você não tem a gaveta** para abri-los — as nove ainda impossíveis ficam no contador 5 da Lista, recolhidas atrás de “Expandir”, como o clássico já fazia com o grupo 5.

---

*Fim do relatório. Nenhuma alteração foi gravada no git. Para marcar item a item, use `docs/INVENTARIO-BETA.md` com este texto ao lado.*
