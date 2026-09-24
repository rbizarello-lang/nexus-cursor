# NEXUS · Claude-experimental

Protótipo de layout, separado do app. Não entra no build (`npm run build`) nem no `clasp push` (`design/**` está no `.claspignore`).

- Arquivo único: `index.html`. Abra direto no navegador (precisa de internet para React e fontes).
- Dados fictícios, com datas relativas ao dia em que o arquivo é aberto.
- Nada é salvo nos dados reais. Só a direção visual e alguns filtros ficam no navegador.

## O que tem na parte 1

| Tela | O que testa |
|---|---|
| Hoje | Saudação com resumo, 4 indicadores, fila do dia, carteira, próximos prazos, atividade |
| Intimações | Lista agrupada (prazo, estado ou operação), quadro por estado e modo foco para triagem |
| Gaveta da intimação | Régua do prazo (envio, início, embargos de declaração, final), gramática, notas, contexto do processo, registrar atuação |
| Linha do tempo | Processos, prazos e contagem do art. 40 numa régua (semanas, meses, anos) |
| Carteira e operação | Cartões por operação e página da operação com indicadores, linha do tempo e intimações |
| Prazos extintivos | Os 5 grupos e um "relógio" do prazo por CDA |
| Busca ⌘K | Intimações, processos, CDAs, pessoas e operações; números funcionam sem pontuação |

As outras entradas do menu mostram o que vem nas próximas partes.

## Direções visuais

Troque no pé do menu (ou pela busca ⌘K):

- **Grafite**: escuro, denso, dourado discreto.
- **Ardósia**: claro, papel frio, botões em tinta.
- **Maré**: azul-marinho e dourado, herança do Mar Profundo.
- **Auto**: segue o tema do sistema (Ardósia de dia, Grafite à noite).

## Atalhos

`⌘K` ou `Ctrl+K` busca · `/` busca · `J`/`K` próxima e anterior na gaveta e no foco · `R` registrar atuação no foco · `U` urgente no foco · `Esc` fecha.

Links diretos: `index.html#hoje`, `#intimacoes`, `#foco`, `#timeline`, `#carteira`, `#prazos`.
