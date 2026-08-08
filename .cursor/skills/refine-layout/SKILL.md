---
name: refine-layout
description: Aperfeiçoa layout e hierarquia visual do Nexus (clássico ou Demo) para que informação crítica (prazo, Imp/Dif, urgência, operação) ganhe relevância e a tela fique menos cansativa. Use quando o usuário pedir refino de layout/UI/UX, densidade, espaçamento, contraste, clutter, Design Mode, ou validação visual de telas.
---

# Refine Layout — NEXUS

Objetivo: corrigir defeitos de layout que **escondem**, **diluem** ou **competem** com informação operacional — sem reinventar o design system nem misturar clássico e Demo.

## Quando usar

- Pedidos de layout, hierarquia, densidade, “cansativo”, “pouco intuitivo”, contraste, espaçamento
- Ajuste pontual após Design Mode / screenshot / mockup
- Validação visual pós-mudança de UI (antes de dar por pronto)
- Comparar tela atual com `_design-mockups/` ou `_design-mockups/approved/`

## Não usar para

- Parsers, sync Drive, calculadora de prescrição, backend Apps Script
- Redesign estrutural grande (P3–P6) sem Plan Mode + fase explícita do `MELHORIAS.md`
- Unificar clássico e Demo Experimental

## Fonte da verdade

| Editar | Não editar |
|---|---|
| `src/Nexus.shell.html` — tokens CSS, temas, layout shell | HTML gerados na raiz (`Nexus.html`, demos) |
| `src/app.jsx` — estrutura de componentes, ordem visual, classes | Parsers / domínio “de passagem” |

Detalhes: `AGENTS.md`, `BUILD.md`. Checklist completo: `references/checklist.md`. Superfícies: `references/surfaces.md`.

## Fluxo operacional

1. **Identificar superfície** — clássico ou Demo? Qual tela/zona? (ver `references/surfaces.md`)
2. **Obter evidência visual** (obrigatório se possível):
   - Design Mode (Agents Window browser, `Cmd/Ctrl+Shift+D`): clicar/desenhar no elemento
   - Browser Agent: screenshot da viewport relevante
   - Print ou mockup colado pelo usuário / `_design-mockups/`
3. **Diagnosticar com o checklist** — ler `references/checklist.md`; listar 2–5 problemas concretos (hierarquia, clutter, densidade, contraste, overflow)
4. **Editar mínimo**:
   - Preferir tokens/variáveis em `Nexus.shell.html`
   - Mudanças estruturais só em `src/app.jsx` quando CSS sozinho não resolve
   - Preservar card de intimação (notas + Imp+Dif+Prazo) salvo pedido/fase explícita
5. **Build** — seguir skill `/build-nexus` (`npm run build`); incluir HTML gerados se mudarem
6. **Revalidar** — novo screenshot / Design Mode; confirmar que a informação crítica ficou mais óbvia e a tela menos ruidosa
7. **Referência** — se o usuário aprovar a tela, sugerir guardar print em `_design-mockups/approved/`

## Princípios de produto (não negociar sem pedido)

- Clássico é default; Demo é trilha paralela
- Gramática do card: Importância + Dificuldade + Prazo visível; ordenação do usuário
- Processos: manter família de cards / Visão D; não trocar por tabela “do zero”
- Uma fase do redesign (`MELHORIAS.md` P2–P6) por vez
- Preferir diffs pequenos e focados

## Anti-padrões

- Inventar tema/estilo genérico (ex.: purple gradient, cards decorativos sem ação)
- Espalhar cores hex hardcoded quando existe token CSS
- Editar `Nexus.html` / demos gerados à mão
- “Limpar” removendo dados ou ações que o usuário precisa
- Refatorar estado/parsers junto com layout

## Saída esperada ao usuário

- O que estava errado (em termos de relevância da informação / fadiga)
- O que mudou (arquivos)
- Como revalidar (clássico vs demo, tela)
- Build feito ou pendente
