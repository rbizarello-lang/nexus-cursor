# Kit base · Prazos unificados (mockups)

Kit para desenhar propostas de layout da tela única de prazos extintivos do NEXUS. Visual: Nexus Prumo, tema Ardósia claro (opcional: `nx-classico`, areia). CSS puro e dados sintéticos; nada aqui toca o app.

| Arquivo | Para quê |
|---|---|
| `index.html` | **Página comparativa final** (abas Resumo · Proposta 1 · Proposta 2 · Proposta 3 · Comparativo · Decisões suas), com `base.css`, `dados.js` e os três mockups embutidos. Gerada; não editar à mão |
| `proposta-1.html` | Mockup standalone da Proposta 1 · Relógio |
| `proposta-2.html` | Mockup standalone da Proposta 2 · Fila de trabalho |
| `proposta-3.html` | Mockup standalone da Proposta 3 · Carteira por natureza |
| `base.css` | Tokens (`--nx-*`, só em `.nx-mock`, fundo claro fixo) e componentes `nx-*` |
| `dados.js` | `NX_HOJE = '2026-10-09'`, `NX_OPERACOES`, `NX_DADOS` (30 CDAs) e utilitários `NX.*` |
| `kit-preview.html` | Todos os componentes com os dados; copie a marcação e os trechos de JS de lá |

## Como abrir `index.html`

- Localmente: dê duplo clique em `index.html` (ou arraste para o navegador). Funciona offline, exceto as fontes do Google, que caem para a fonte do sistema. Não precisa de servidor, build nem `npm`.
- Formato: o arquivo é um fragmento de página (começa em `<title>` e `<style>`, sem `doctype`, `html`, `head` nem `body`), que é o que a publicação como artefato espera e envolve. Aberto direto, o navegador usa o modo de compatibilidade; o visual muda pouco.
- Abas: cada aba tem um token no endereço (`#resumo`, `#relogio`, `#fila`, `#carteira`, `#comparativo`, `#decisoes`); por exemplo, `index.html#carteira` abre direto a Proposta 3.
- Como é gerado: `index.html` junta `base.css` (sem o `@import`), `dados.js`, o CSS, o `<main>` e o JS de cada `proposta-N.html`, mais o texto da página. O script de montagem não faz parte do repositório; ao mudar um mockup, regenere o `index.html` (a página e os arquivos avulsos têm de ficar iguais).
- Os três mockups convivem na mesma página: CSS todo sob `#proposta-N`, JS em IIFE, ids com prefixo `pN-`, `dados.js` idempotente.

## Regra para as propostas

Cada proposta é um arquivo `proposta-N.html` standalone, na mesma pasta:

```html
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light">
<title>Prazos unificados · Proposta N</title>
<link rel="stylesheet" href="base.css">
<style>
  html, body { margin: 0; background: #f2f3f5; }          /* único CSS fora de #proposta-N */
  #proposta-N .meu-bloco { ... }                          /* TODO seletor começa por #proposta-N */
</style></head>
<body>
<main class="nx-mock" id="proposta-N"><div class="nx-page"> ... </div></main>
<script src="dados.js"></script>
<script>(function () { /* JS em IIFE, buscando só dentro de #proposta-N */ })();</script>
</body></html>
```

- Para fundir as três numa página (já feito em `index.html`): nada de seletor solto, de `:root`, `html`, `body` ou `*` dentro do `<style>` (a única exceção é a linha `html, body { margin: 0; background: ... }` do arquivo avulso, que a montagem retira); nomes de `@keyframes`, ids e variáveis próprias levam prefixo `pN-`. Não redefina `--nx-*` em `:root`; ajuste dentro de `#proposta-N`.
- Especificidade do kit é baixa de propósito: `#proposta-N .nx-row { ... }` sempre vence.
- Mobile: 390px sem rolagem horizontal (`.nx-mock` corta `overflow-x`; confira com o detector do preview).
- Quem altera registros (adiar, tratar) deve usar `const dados = NX.copia()`; `NX_DADOS` é compartilhado.

## Classes (base.css)

- **Estrutura**: `.nx-page` `.nx-page-h` `.nx-card` (`-h` `-b` `-f`) `.nx-sub-h` `.nx-split` (`.side-left`) `.nx-cols` `.nx-stack` `.nx-cluster`; utilitários `.nx-mono` `.nx-num` `.nx-muted` `.nx-small` `.nx-ell` `.nx-sp` `.nx-sr`, cores `.nx-c-red|orange|yellow|blue|green|violet|cyan|gray` (definem `--c`).
- **Contadores**: `.nx-stats > .nx-stat` com `.nx-stat-l` rótulo, `-n` número, `-v` valor R$, `-s` nota; `.is-active`; `button.nx-stat` é clicável; tom `red orange blue green violet muted`.
- **Chips** `.nx-chip` + natureza `decadencia ordinaria intercorrente` · certeza `calculado faixa dado analisar` · `situacao` `abrangida` `adiada` `tratada` `consumada` `silenciada` · tons `t-red…t-gray` · `sm`.
- **Linha** `.nx-row` (`.nx-row-main > .nx-row-id, .nx-row-who, .nx-row-why`; `.nx-row-side > .nx-when, .nx-date, .nx-val`; `.nx-row-acts`) + `.nx-cda` `.nx-proc` `.nx-devedor` `.nx-op` `.nx-sq`; variantes `dense` `cols` `is-venc` `is-strong` `is-quiet` `is-selected` `is-open`.
- **Grupo** `.nx-groups > .nx-group` (`button.nx-group-h` com `.nx-chev`, `.nx-group-title/-n/-sum`; `.nx-group-notes > .nx-notice`; `.nx-group-body`); colapsa com `.is-collapsed` (ou `<details class="nx-group">`); `flat`.
- **Régua** `.nx-ruler > .nx-ruler-track > .nx-seg.{correndo|suspensao|pausa|aguardando}`, `.nx-band` (faixa cedo–tarde), `.nx-mark.{cedo|tarde|termo|hoje|ciclo|fato}` (posição por `left:%`); `.nx-ruler-ends`, `.nx-ruler-legend > .nx-key`; `.mini` para dentro da linha. Quase sempre use `NX.reguaHTML`.
- **Conferir** `.nx-checks > label.nx-check > input + span`; **avisos** `.nx-notice` (`orange red blue violet green gray`).
- **Botões** `.nx-btn` + `primary secondary quiet danger sm icon`; grupo `.nx-btn-group`.
- **Formulário inline** `.nx-inline-form > .nx-field (grow) > .nx-input | .nx-select | .nx-textarea`, `.nx-inline-form-acts`, `.nx-hint`; dentro de `.nx-row` ocupa a linha toda.
- **Navegação**: `.nx-tabs` (`.on`/`aria-selected`, `.nx-n`), `.nx-filters`, `.nx-sel` (rótulo + select), `.nx-search`, `.nx-fchip.on`, `.nx-seg-ctl`.
- **Lote** `.nx-batch` (`.sticky`, `.nx-batch-n/-s`); **tooltip** `.nx-tip[data-tip]` (`left right down`); **vazio** `.nx-empty` (`.plain`, `.nx-empty-t/-s`); **colapsado** `button.nx-fold` (`aria-expanded`, `.nx-fold-s`).
- **Tabela** `.nx-table-wrap > .nx-table` (`dense`, `.num`, `.mono`, `.nowrap`, `th.sort`, `tr.is-selected`).
- **Gaveta** `.nx-drawer-host` (moldura posicionada) `> .nx-scrim + .nx-drawer` (`.docked` estático, `.fixed` na viewport) com `.nx-drawer-top/-body/-foot`, `.nx-d-title`, `.nx-sec/.nx-sec-h`, `.nx-props` (dl), `.nx-events > li > .nx-ev-date/.nx-ev-fato/.nx-ev-efeito`.

## Dados (dados.js)

Cada CDA em `NX_DADOS`: `id cda devedor operacao valor processo abrangidaPor natureza fase situacao termoCedo termoTarde diasRestantes certeza podeSalvar acao{tipo,rotulo,umClique} conferir[] eventos[{data,fato,efeito}] consumadaHa silenciadaAte adiada{ate,motivo,desde} tratada{tipo,rotulo,desde} regua{inicio,fim,segmentos[{de,ate,tipo,rotulo?}],marcas[{data,rotulo,tipo}]}` e, além do pedido, **`fila`** (sugestão de agrupamento: `agir conferir vigiar registro adiada tratada impossivel`; 11/2/7/5/2/2/1). Campo opcional **`divergencia`** (`true` = a análise importada diverge do cálculo; a certeza continua a do cálculo, com selo à parte). Dicionário completo no cabeçalho do arquivo. Datas ISO; `diasRestantes` é de hoje até a data cedo (negativo = vencido, `null` = sem contagem); `regua` pode ser `null`.

Regras de exibição compartilhadas (só leem os campos acima): `NX.semPrazo(r)` (a data é «não antes de» ou registro de um fato, não prazo: nunca vai para «vencido»/«cedo venceu»; vai para «Sem prazo calculável»), `NX.derivada(r)` (ordinária não ajuizada a mais de 90 dias: selo «Fora dos 90 dias», sem «Adiar…»), `NX.tese(r)` + `NX.chaveTese(r)` («Cedo venceu, tarde não»: ordena pela data tarde, sem tarde por último; o relógio principal é «tarde em …»), `NX.lembreteVencido(r)` (aguardando reconhecimento com o lembrete de 60 dias vencido).

Utilitários: `NX.fmtData` `fmtDataCurta` `fmtMoeda` `fmtMoedaCurta` `dias` `fmtDias` `fmtDuracao` `tomDias` `esc` · `NX.op(nome)` `soma` `agrupar(lista, fn)` `da(fila)` `copia` `adiamentoVencido` · `NX.tom(r)` `quando(r)` · HTML pronto: `NX.chipsHTML(r)` `reguaHTML(r,{mini})` `linhaHTML(r,{selecionavel,sel,dense,cols,regua,acoes})` `grupoHTML({titulo,n,valor,avisos,corpo,colapsado,flat})` · vocabulário `NX.ROTULOS` `FILAS` `MOTIVOS_ADIAMENTO`.

## Convenções e limites

- Rótulos vêm do app: certeza (`Calculado`, `Cedo–tarde`, `Falta dado`, `Analisar`), ações (`Lançar ciência`, `Ainda vale`…), motivos de adiamento.
- `podeSalvar`: `true` = a ação cabe num formulário inline (tudo está na tela); `false` = antes é preciso ver os autos ou abrir a ficha. `adiada.ate <= NX_HOJE` = adiamento vencido (o item volta à fila `agir`).
- Fonte Geist via Google Fonts (`@import` em `base.css`); sem internet cai em Segoe UI/system-ui. Usa `color-mix` e `:has` (Chrome 111+, Safari 16.2+, Firefox 121+).
- Os formulários do preview só simulam; nada é gravado.
