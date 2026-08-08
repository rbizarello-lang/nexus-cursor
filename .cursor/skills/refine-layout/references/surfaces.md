# Superfícies de UI — NEXUS

Mapa rápido para saber o que inspecionar e onde o código costuma viver.

## Edições

| Edição | Como abrir | Artefato gerado |
|---|---|---|
| Clássico (default) | `Nexus.html` / `doGet` | `Nexus.html` |
| Demo Experimental | ⚙ Demo, `?edition=demo`, ou HTML demo | `Nexus.demo.html`, `Nexus_demo_experimental.html`, aliases |

Temas clássicos: Mar Profundo · Claro · Ferro e Maré.  
Temas Demo: Clara · Mar · Ardósia · Grafite.

CSS/tokens: `src/Nexus.shell.html`. Lógica/markup React: `src/app.jsx`.

## Clássico — superfícies frequentes

| Superfície | O que validar no layout |
|---|---|
| Lista / fila de intimações | Card: notas, Imp, Dif, Prazo, scan vertical |
| Operação aberta | Abas, densidade do painel, CTAs |
| Processos Visão D | Rail de hubs + painel; detalhe só ao selecionar |
| Prescrição / risco | Legibilidade do estado sem alarmismo decorativo |
| Partes / Bens | (P4 planejado: seletor numa aba — não antecipar fusão) |
| Configurações | Ativação Demo, temas, Visão Gemini |

## Demo Experimental — rail e zonas

Rail: **Hoje** · **Intimações e Tarefas** · **Carteira** · **Agenda** · **Biblioteca** · **Trabalho** (Mesa).

Zonas da operação: **Briefing** · **Acervo** (Pessoas \| Bens) · **Risco** (Processos e Prescrição) · **Ferramentas** (Tarefas \| Importar \| Arquivos).

| Superfície | O que validar |
|---|---|
| Hoje / Command Center | Uma composição; sem dashboard de widgets |
| Intimações e Tarefas | Mesma gramática de card; fila acionável |
| Carteira | Scan de operações sem ruído |
| Agenda | Grade/lista legível; hierarquia de eventos |
| Mesa / Operação | Zonas claras; rail não engole conteúdo |
| Processos A/B/C/D | Seletor de visão; padrão D master–detail se unset |

## Mockups e referências

- Planejados / exploração: `_design-mockups/` (ex.: `p1-demo.html`)
- Telas aprovadas pelo usuário: `_design-mockups/approved/`
- Roadmap de fases: `MELHORIAS.md` (P1✅ … P2–P6)

Ao refinar, preferir alinhar a referências **aprovadas** quando existirem; senão, aos princípios do checklist e ao card/gramática já em produção.
