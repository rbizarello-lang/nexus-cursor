# NEXUS — Plano de implementação de confiabilidade e testes críticos

Data da avaliação: 26/08/2026  
Natureza: plano técnico para avaliação; não implica alteração do aplicativo nem publicação  
Escopo: frontend React, motor jurídico, importadores, Google Apps Script, armazenamento em Drive, backups e pipeline de publicação

## 1. Objetivo executivo

Transformar a suíte atual em uma barreira efetiva contra regressões nas regras que podem causar perda de informação, sobrescrita de dados ou silêncio indevido sobre risco prescricional.

O projeto já possui uma base útil: `npm test` existe e, nesta avaliação, os 70 testes passaram. Isso supera parcialmente o diagnóstico original, que registrava ausência de testes comportamentais. O resultado 70/70, porém, não equivale a cobertura integral: ainda faltam testes de importação de datas do eproc, ciclo de intimações resolvidas/reabertas, comportamento do e-mail diário, conflito entre máquinas, backup/restauração, migração de esquema e equivalência dos alertas entre superfícies.

O plano preserva a arquitetura atual e recomenda extrações graduais. Não propõe reescrever o aplicativo.

## 2. Vereditos que orientam o plano

Estes pontos são requisitos, e não apenas recomendações:

1. **Build e sintaxe não provam comportamento.** O artefato pode abrir normalmente e ainda calcular, agrupar, importar ou alertar incorretamente.
2. **Os 70 testes atuais são uma fundação, não uma certificação.** A suíte deve crescer em torno dos riscos materiais e dos defeitos já encontrados.
3. **Falso negativo prescricional é a falha prioritária.** Se os dados não permitem uma conclusão segura, o resultado deve ser `revisao_necessaria`, nunca silêncio ou aparência de segurança.
4. **Toda CDA ativa deve ser contabilizada.** Ela precisa pertencer a exatamente uma categoria operacional. Só um estado terminal comprovado pode retirá-la do radar ativo.
5. **A mesma avaliação deve alimentar todas as superfícies.** Painel, detalhe da CDA, relatório, e-mail diário e eventual consulta mobile não podem aplicar critérios divergentes.
6. **O teste não cria a regra jurídica.** Cada caso de referência deve ter resultado previamente validado, fonte da orientação, data de validação e responsável pela validação.
7. **Toda correção de defeito deve gerar um teste permanente de regressão.** O problema corrigido não pode reaparecer silenciosamente.
8. **Publicação deve ser bloqueada por falha crítica.** Não se publica se houver teste crítico reprovado, artefato dessincronizado, dado incompatível com o esquema ou build inválido.
9. **Casos de teste não devem conter dados pessoais reais.** Usar dados sintéticos ou recortes anonimizados e aprovados.

## 3. Retorno aos oito achados da auditoria original

Para fins de rastreabilidade, os achados originais são identificados como A1 a A8.

| ID | Achado original | Veredito atual | Consequência no plano |
|---|---|---|---|
| A1 | Fazer o resumo diário resolver o mesmo `nexus_data.json` canônico do aplicativo | **Implementado funcionalmente; teste ausente.** O resumo usa o resolvedor comum, ID persistido e fallback limitado à pasta da planilha. | Criar teste do arquivo pinado, duplicidade de nomes e falha de resolução. |
| A2 | Salvar com revisão esperada dentro do mesmo `LockService`, evitando sobrescrita concorrente | **Implementado funcionalmente; cobertura insuficiente.** Há compare-and-swap, confirmação para forçar, backup prévio e incremento de revisão. O salvamento ainda prossegue se o backup pré-gravação falhar. | Testar duas máquinas, lock, conflito, força explícita, falha de backup e restauração. Adotar falha segura antes de sobrescrever. |
| A3 | Unificar os motores de prescrição e expor origem manual, calculada ou estimada | **Parcial.** O frontend possui um motor principal extraído e snapshots. Entretanto, data manual prevalece sem teste de conflito; ausência de marco pode resultar em `seguro`; o e-mail usa critérios próprios e snapshots potencialmente antigos; datas vencidas, `prescrito` e `prescriptionHandled` podem ser excluídos do e-mail. | Implantar contrato único de avaliação e radar, separar fase jurídica de situação operacional e eliminar saídas silenciosas. |
| A4 | Criar testes comportamentais de regras críticas | **Parcial.** Existem 70 testes, com boa cobertura do núcleo de prescrição, documentos e agrupamento de processos. Faltam as integrações e sequências mais perigosas. | É o eixo central das fases 0 a 6 deste plano. |
| A5 | Introduzir `schemaVersion`, migrações sequenciais e validação semântica | **Aberto.** Há `JSON.parse`, mas não há versão do esquema, cadeia de migração nem validação semântica antes de salvar/restaurar. | Implementar esquema, migrações idempotentes e validação fatal versus advertência. |
| A6 | Bloquear publicação quando origem e pasta `gas/` divergirem | **Quase resolvido.** O comparador de hashes existe e `push:check` passou. O comando de publicação, porém, não executa a suíte de testes antes de publicar. | Consolidar um único `quality:gate`, incluindo testes, build, verificação do payload, sincronização e hashes. |
| A7 | Modularizar gradualmente, somente sob proteção de testes | **Parcial.** Foram extraídos `dates.js`, `docs.js`, `prescription.js` e `processes.js`; `app.jsx` ainda tem aproximadamente 11,3 mil linhas e conserva regras testáveis dentro do componente. | Extrair apenas regras puras necessárias aos novos testes: intimações, radar, esquema e sincronização. Não fazer refatoração ampla. |
| A8 | Reforçar dependências externas e corrigir a terminologia da interface | **Aberto.** Cinco bibliotecas e o worker do PDF continuam carregados de CDN sem SRI; a interface ainda diz “Salvar na Planilha”, embora o dado canônico seja JSON no Drive; o manifesto não declara escopos explícitos. | Preferir dependências empacotadas; usar SRI como medida intermediária; corrigir textos e declarar escopos mínimos. |

## 4. Arquitetura-alvo dos testes

### 4.1 Manter a ferramenta atual

Manter `node:test`. Não há necessidade de trocar imediatamente para Jest ou Vitest. A prioridade é cobertura comportamental, não a ferramenta.

Estrutura proposta:

```text
test/
  fixtures/
    prescription/
    eproc/
    schema/
    sync/
  helpers/
    apps-script-mocks.mjs
    legal-case-runner.mjs
  dates.test.mjs
  eproc-import.test.mjs
  intimations.test.mjs
  prescription.test.mjs
  prescription-radar.test.mjs
  prescription-surfaces.test.mjs
  processes.test.mjs
  process-visibility.test.mjs
  schema.test.mjs
  migrations.test.mjs
  backend-sync.test.mjs
  backup-restore.test.mjs
  daily-summary.test.mjs
  release-gate.test.mjs
```

### 4.2 Testar o código efetivamente publicado

Para `Código.js` e `RESUMO-DIARIO.js`, carregar os próprios arquivos em `node:vm` com implementações falsas e controladas de:

- `DriveApp`;
- `SpreadsheetApp`;
- `PropertiesService`;
- `LockService`;
- `MailApp`;
- `Session`.

Isso permite simular duas máquinas, arquivos homônimos, locks, falhas de backup e restauração sem acessar o Drive real. Também evita testar uma reimplementação diferente da que será publicada.

### 4.3 Extrair regras puras do componente React

Extrair somente o necessário:

- `src/lib/intimations.js`: identidade, idempotência e merge de intimações do eproc;
- `src/lib/prescription-radar.js`: classificação única das CDAs e projeção para as superfícies;
- `src/lib/schema.js`: validação e migração;
- opcionalmente `src/lib/sync-client.js`: decisão do cliente diante de sucesso, conflito e falha.

O componente React deve consumir essas funções. Não copiar a regra para dentro do teste.

### 4.4 Casos jurídicos de referência

Cada fixture prescricional deve registrar, no mínimo:

```js
{
  caseId: 'PRESC-001',
  description: '...',
  legalBasis: ['Tema ...', 'art. ...'],
  ruleVersion: 'prescription-2026.1',
  validatedAt: 'YYYY-MM-DD',
  validatedBy: 'revisão jurídica',
  input: { /* dados sintéticos */ },
  expected: { /* fase, categoria, data ou revisão necessária */ }
}
```

Quando a orientação depender de avaliação jurídica não consolidada, o resultado esperado não deve fingir certeza. O teste deve exigir `revisao_necessaria` e a explicitação da divergência.

## 5. Contrato de segurança da prescrição

### 5.1 Separar conceitos hoje misturados

O motor deve produzir campos distintos:

```js
{
  phase,                 // fase jurídica: pré-marco, art. 40, correndo, suspensa etc.
  bucket,                // categoria operacional única
  manualDate,
  computedDate,
  alertDate,             // data conservadora usada pelo radar
  origin,
  confidence,
  reviewRequired,
  reviewReasons,
  workflowState,         // ativo, aguardando reconhecimento, reconhecido, encerrado
  terminal,
  computedAt,
  engineVersion,
  calendarVersion,
  inputHash
}
```

Categorias operacionais sugeridas:

- `vencida_aguardando_atuacao`;
- `critica`;
- `alerta`;
- `monitoramento`;
- `segura_verificada`;
- `revisao_necessaria`;
- `terminal`.

`segura_verificada` exige confirmação de completude do histórico até uma data de corte. A mera ausência de marco cadastrado não comprova que o marco não ocorreu.

### 5.2 Política conservadora para datas conflitantes

Manter separadas a data manual e a calculada. Se houver divergência material:

- não sobrescrever uma pela outra;
- exibir a divergência e sua origem;
- usar, no radar, a data mais antiga como alerta conservador até validação humana;
- exigir registro da escolha validada e sua data;
- reabrir revisão se os eventos de entrada mudarem após a validação.

### 5.3 Substituir `prescriptionHandled` como chave de ocultação

Migrar o booleano para estados explícitos. Em particular:

- `aguardando_reconhecimento` não é terminal e continua no radar e no e-mail;
- `prescrita` pelo cálculo, mas sem reconhecimento/baixa, continua visível;
- apenas reconhecimento/encerramento comprovado pode tornar o item terminal;
- o histórico da transição deve ser preservado.

### 5.4 Snapshot seguro para e-mail e outras superfícies

O snapshot deve ser gerado pelo mesmo motor usado no frontend. O e-mail pode consumir o snapshot, mas deve:

- recalcular os dias restantes a partir de `alertDate` e da data corrente, sem confiar em `daysLeft` antigo;
- incluir prazos negativos;
- incluir itens aguardando reconhecimento;
- incluir `revisao_necessaria` e estimativas como advertência, não descartá-las;
- sinalizar snapshot ausente ou antigo;
- comparar `engineVersion` e `inputHash`.

## 6. Fases de implementação

### Fase 0 — Baseline e governança dos casos

Mapeamento: A3, A4, A5, A6 e A7.  
Estimativa: 1–2 dias de desenvolvimento, em paralelo com validação jurídica.

Entregas:

1. Registrar o baseline de 70 testes e os comandos que passaram.
2. Inventariar o que cada teste realmente garante.
3. Criar a convenção das fixtures jurídicas e seus metadados.
4. Selecionar de 12 a 20 casos iniciais de prescrição, sintéticos ou anonimizados.
5. Registrar explicitamente comportamentos atuais que serão alterados, como “sem marco = seguro” e exclusão de vencidos do e-mail.

Critérios de aceite:

- nenhum teste atual é removido sem justificativa;
- toda mudança de comportamento tem um caso aprovado antes da implementação;
- dados reais identificáveis não entram no repositório.

### Fase 1 — Infraestrutura de testes e extrações mínimas

Mapeamento: A4 e A7.  
Estimativa: 3–5 dias.

Entregas:

1. Criar mocks de Apps Script e executor de fixtures.
2. Extrair merge de intimações, radar e esquema para funções puras.
3. Fazer os testes importarem diretamente os módulos, evitando extração textual de funções de `app.jsx`.
4. Criar comandos separados para testes unitários, integração Apps Script e conjunto crítico.

Critérios de aceite:

- as regras extraídas continuam sendo as usadas pela interface;
- os 70 testes antigos continuam aprovados;
- os testes do backend executam offline e de forma determinística.

### Fase 2 — Prescrição sem falso negativo silencioso

Mapeamento: A3, A4 e A5.  
Estimativa: 6–9 dias, além da validação jurídica dos resultados.

Entregas:

1. Introduzir o contrato descrito na seção 5.
2. Transformar ausência não verificada de dados em `revisao_necessaria`.
3. Separar data manual, calculada e data de alerta.
4. Migrar `prescriptionHandled` para estado operacional explícito.
5. Criar uma única função `buildPrescriptionRadar(data, asOf)`.
6. Alimentar painel, relatórios e snapshot a partir desse radar.
7. Ajustar o e-mail diário para nunca descartar vencidos, estimativas incertas ou itens aguardando reconhecimento.
8. Não mutar o estado React durante a serialização para a nuvem; gerar uma cópia com snapshots.

Casos mínimos obrigatórios:

| Caso | Resultado obrigatório |
|---|---|
| Ajuizada sem marco e sem revisão de completude | `revisao_necessaria`, nunca `segura_verificada` |
| Ausência de marco formalmente conferida até data de corte | `segura_verificada` ou fase validada, com data da revisão |
| Data manual posterior à calculada | divergência visível; radar usa a mais antiga até validação |
| Data manual anterior à calculada | alerta pela data manual; divergência preservada |
| Data vencida sem reconhecimento judicial | permanece no painel e no e-mail |
| “Aguardando reconhecimento” | não terminal; continua no radar |
| Suspensão sem término | fase suspensa e revisão necessária; nunca silêncio indefinido |
| Snapshot antigo ou de versão anterior | revisão necessária e aviso de desatualização |
| CDA sem data calculável | revisão necessária |
| CDA extinta/reconhecida com prova registrada | terminal, com histórico auditável |
| Todas as CDAs ativas de uma base | pertencem a exatamente uma categoria |
| Mesma base em painel, relatório e e-mail | mesmos IDs e mesma prioridade |

Critérios de aceite:

- zero CDA ativa não classificada;
- zero falso negativo no corpus jurídico aprovado;
- todo caso incompleto é visível como revisão necessária;
- nenhuma superfície suprime vencidos ou aguardando reconhecimento;
- diferenças entre manual e calculado são rastreáveis.

### Fase 3 — Datas, eproc, intimações e processos

Mapeamento: A4 e A7.  
Estimativa: 5–7 dias.

#### 3.1 Datas e dias úteis

1. Tornar o parser estrito: `31/02/2026` deve ser rejeitado, não normalizado.
2. Testar ISO, ISO com horário, `DD/MM/AAAA`, serial do Excel, campos vazios e valores inválidos.
3. Impedir deslocamento de um dia por fuso horário.
4. Versionar calendários por tribunal/ano e registrar a fonte de feriados e suspensões locais.
5. Separar claramente anos civis da prescrição e dias úteis de prazos processuais.
6. Testar ano bissexto, recesso, fim de semana e suspensão local.

#### 3.2 Importação do eproc

1. Extrair a normalização para função pura.
2. Definir identidade estável da intimação, preferindo identificador/evento de origem.
3. Garantir idempotência: importar o mesmo arquivo duas vezes não duplica registros.
4. Rejeitar ou colocar em quarentena datas inválidas; nunca adivinhar silenciosamente.
5. Preservar valor bruto e origem para auditoria.

#### 3.3 Resolvidas e reabertas

Testar a sequência completa:

1. importar intimação;
2. marcar como resolvida e registrar atuação;
3. reimportar a mesma intimação — deve permanecer resolvida;
4. importar nova intimação do mesmo processo — deve criar novo registro aberto;
5. preservar histórico, notas e documentos do registro anterior;
6. uma mudança apenas de espaços/acentos na descrição não pode decidir sozinha entre atualização e nova intimação.

#### 3.4 Agrupamento de processos

1. Mover a classificação restante para módulo testável diretamente.
2. Manter a invariante: todo `execution.id` aparece exatamente uma vez na visão principal apropriada, sem contar referências secundárias deliberadas.
3. Cobrir principais, apensos, incidentes, hubs extintos, EFs extintas, duplicidades e registros legados.
4. Testar consolidação idempotente e preservação de referências.
5. Acrescentar um smoke test da renderização final, pois modelo correto não garante tela correta.

Critérios de aceite da fase:

- nenhuma data inválida é convertida em data válida;
- reimportação idêntica não altera contagens;
- intimação resolvida não é sobrescrita por evento novo;
- nenhum processo desaparece da visão;
- o teste visual confirma os casos de hubs, extintas e duplicidades.

### Fase 4 — Sincronização, backup, restauração e esquema

Mapeamento: A1, A2 e A5.  
Estimativa: 5–8 dias.

#### 4.1 Conflito entre máquinas

Testes obrigatórios:

1. A e B carregam revisão 10.
2. A salva e produz revisão 11.
3. B tenta salvar revisão 10.
4. O backend devolve conflito e não altera arquivo, revisão nem backup.
5. Se o usuário cancelar, nada muda.
6. Se o usuário confirmar força, o conteúdo da revisão 11 é salvo antes em backup e somente então B grava a revisão 12.
7. Auto-sync nunca força sobrescrita.
8. Falha ao obter o lock não grava parcialmente.

#### 4.2 Backup e restauração

1. Backup pré-gravação deve conter byte a byte o estado anterior.
2. Falha de backup deve impedir a sobrescrita por padrão.
3. Restauração deve validar e migrar o conteúdo antes de gravá-lo.
4. Antes de restaurar, criar backup recuperável do estado corrente.
5. Após restaurar, incrementar revisão e invalidar clientes antigos.
6. Testar backup inexistente, JSON corrompido, esquema futuro e referência inválida.

#### 4.3 Esquema e migrações

Introduzir no documento raiz:

```js
{
  schemaVersion: 1,
  meta: {
    lastMigratedAt: '...',
    prescriptionEngineVersion: '...',
    calendarVersion: '...'
  }
}
```

Regras:

- migrações sequenciais: `v1 -> v2 -> v3`;
- migrações idempotentes;
- nunca rebaixar automaticamente um esquema futuro;
- preservar campos desconhecidos sempre que possível;
- guardar backup bruto antes da migração;
- distinguir erros fatais de advertências reparáveis.

Validações fatais sugeridas:

- raiz não é objeto;
- coleção essencial não é array;
- IDs duplicados na mesma coleção;
- versão de esquema futura não suportada;
- datas críticas estruturalmente inválidas;
- migração interrompida.

Advertências sugeridas:

- referência a operação inexistente;
- processo sem operação;
- número CNJ inválido;
- data de prazo ausente;
- evento prescricional incompleto.

Advertência não deve ser apagada: deve alimentar o diagnóstico e, quando envolver prescrição, `revisao_necessaria`.

Critérios de aceite da fase:

- nenhuma escrita concorrente silenciosa nos cenários simulados;
- nenhuma restauração sem backup anterior e validação;
- arquivos homônimos fora da pasta/ID canônico nunca são lidos;
- toda versão antiga suportada migra de modo determinístico;
- esquema futuro é recusado sem sobrescrita.

### Fase 5 — Gate de publicação, segurança e modularização controlada

Mapeamento: A6, A7 e A8.  
Estimativa: 3–5 dias.

#### 5.1 Gate único

Ordem mínima do fluxo de publicação:

1. executar testes críticos;
2. executar a suíte completa;
3. atualizar versão;
4. gerar os HTMLs;
5. decodificar e validar sintaxe do payload gerado;
6. sincronizar os quatro arquivos com `gas/`;
7. comparar hashes;
8. executar smoke tests sobre os arquivos de `gas/`;
9. somente então executar `clasp push`.

Comandos sugeridos:

```json
{
  "test:critical": "node --test test/prescription*.test.mjs test/dates*.test.mjs test/backend-sync.test.mjs test/backup-restore.test.mjs test/daily-summary.test.mjs",
  "test:integration": "node --test test/*integration*.test.mjs test/backend-sync.test.mjs test/backup-restore.test.mjs",
  "test:coverage": "node --experimental-test-coverage --test test/*.test.mjs",
  "verify": "node scripts/verify.mjs",
  "quality:gate": "npm run test:critical && npm test && npm run build && npm run verify && node scripts/sync-gas.mjs && npm run push:check"
}
```

Cobertura percentual é indicador auxiliar. A aprovação depende principalmente da matriz de decisões e das invariantes críticas.

#### 5.2 Dependências e manifesto

Ordem recomendada:

1. preferir empacotar React, ReactDOM, XLSX, LZ-String e pdf.js no artefato, eliminando dependência de rede em tempo de execução;
2. se o empacotamento não for imediato, aplicar SRI e `crossorigin="anonymous"` às dependências compatíveis;
3. tratar separadamente o worker do pdf.js;
4. revisar Google Fonts: remover, empacotar ou aceitar formalmente a dependência;
5. declarar no manifesto apenas os escopos OAuth necessários a Drive, Planilhas e e-mail;
6. manter o web app restrito ao próprio usuário;
7. substituir “Salvar/Carregar na Planilha” por “Salvar/Carregar da nuvem” ou “Drive”; reservar “Planilha” para log e exportação Gemini.

#### 5.3 Modularização

Depois das fases anteriores, extrair módulos apenas quando houver teste cobrindo o comportamento antes e depois. Evitar uma divisão ampla das 11 mil linhas no mesmo ciclo da correção prescricional.

Critérios de aceite:

- nenhuma rota oficial de publicação ignora os testes críticos;
- falha em qualquer etapa impede o push;
- `gas/` corresponde exatamente à origem;
- o aplicativo abre sem dependência externa não aprovada ou com integridade verificada;
- os textos da interface descrevem corretamente onde os dados são armazenados.

### Fase 6 — Corpus piloto e política permanente de regressão

Mapeamento: A3, A4, A5 e A6.  
Estimativa inicial: 2–4 dias; manutenção contínua.

Entregas:

1. Ampliar para 20–30 cronologias prescricionais anonimizadas e juridicamente revisadas.
2. Executar comparação entre resultado do NEXUS e resultado de referência.
3. Registrar falso positivo, falso negativo e caso inconclusivo.
4. Exigir zero falso negativo no corpus aprovado antes de publicar alterações do motor.
5. Transformar todo defeito de produção em fixture e teste.
6. Considerar teste de mutação no motor crítico para verificar se a suíte detecta alterações indevidas de operadores, datas e limites.

## 7. Matriz mínima de cobertura

| Família | Unidade | Integração | Superfície final | Achados atendidos |
|---|---:|---:|---:|---|
| Prescrição e estados operacionais | Sim | Sim | Painel, relatório e e-mail | A3, A4, A5 |
| Dias úteis e normalização de datas | Sim | Sim, com eproc | Importação e agenda | A4, A7 |
| Intimações resolvidas/reabertas | Sim | Sim, sequência de importações | Fila e histórico | A4, A7 |
| Processos principais/apensos/incidentes | Sim | Sim, consolidação | Visão renderizada | A4, A7 |
| Arquivo canônico do resumo | — | Sim, Apps Script mockado | E-mail | A1, A4 |
| Conflito entre máquinas | — | Sim, Apps Script mockado | Mensagem e ausência de escrita | A2, A4 |
| Backup/restauração | — | Sim, Apps Script mockado | Lista/restauração | A2, A5 |
| Esquema/migrações | Sim | Sim, load/save/restore | Diagnóstico de dados | A5 |
| Build, hashes e publicação | — | Sim | Artefato `gas/` | A6 |
| CDN, manifesto e terminologia | Validação estática | Smoke test | HTML final | A8 |

## 8. Métricas e critérios de liberação

Uma versão que altera regra crítica só pode ser considerada pronta quando:

- testes existentes e novos passam;
- falsos negativos no corpus aprovado: **zero**;
- CDAs ativas sem categoria: **zero**;
- divergências de IDs entre painel, relatório e e-mail: **zero**;
- importação repetida do mesmo eproc não aumenta contagens;
- perda de registros na classificação de processos: **zero**;
- sobrescritas concorrentes não confirmadas: **zero**;
- restaurações sem backup anterior: **zero**;
- build e payload decodificado são válidos;
- hashes de origem e `gas/` coincidem;
- migrações e calendário possuem versão;
- revisão jurídica dos casos afetados está registrada.

Não usar como único critério “100% das linhas cobertas”. Cobertura alta pode coexistir com testes incapazes de distinguir uma resposta juridicamente errada.

## 9. Ordem, dependências e estimativa global

Ordem recomendada:

```text
Fase 0
  -> Fase 1
      -> Fase 2 (prescrição)
      -> Fase 3 (datas/eproc/intimações/processos)
      -> Fase 4 (sync/backup/esquema)
          -> Fase 5 (gate/segurança)
              -> Fase 6 (piloto e manutenção)
```

As fases 2, 3 e 4 podem avançar em paralelo depois que a infraestrutura da fase 1 estiver estável. Para um desenvolvedor, a estimativa conservadora é de **25 a 40 dias úteis**, incluindo integração e estabilização, mas não o tempo de espera pela validação jurídica. Com frentes paralelas, o prazo de calendário pode ser reduzido.

## 10. Priorização recomendada

### Bloqueador imediato

- Fase 2: radar prescricional, vencidos, aguardando reconhecimento, dados incompletos e equivalência do e-mail.

### Alta prioridade

- Fase 4: testes de conflito, backup/restauração e esquema.
- Fase 3: parser estrito e sequência de intimações.
- Inclusão dos testes no gate de publicação.

### Prioridade subsequente

- Empacotamento das dependências externas.
- Modularização adicional protegida por testes.
- Smoke/E2E visual mais amplo.

## 11. Definição de concluído

Este plano não estará concluído apenas porque novos arquivos de teste foram criados. A implementação será considerada concluída quando:

1. os comportamentos críticos estiverem expressos em fixtures verificáveis;
2. os casos tiverem sido validados quanto à resposta esperada;
3. as mesmas funções forem consumidas pelo aplicativo real;
4. painel, e-mail, relatórios e futura consulta mobile apresentarem classificação coerente;
5. conflitos, backups e migrações forem testados contra o código Apps Script efetivamente publicado;
6. a publicação for tecnicamente bloqueada quando qualquer garantia crítica falhar;
7. a documentação dos oito achados A1–A8 for atualizada com evidência de fechamento.

