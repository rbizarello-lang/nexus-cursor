# NEXUS — instruções para agentes Cursor

Painel de Operações Fiscais (Google Apps Script + React). Frontend pré-compilado localmente; o Apps Script serve JS pronto.

## Onde editar

| Arquivo | Função |
|---|---|
| `src/app.jsx` | Lógica React, parsers, domínio, UI clássica e demo |
| `src/edition-claude.jsx` | Nexus Prumo (menu, barra, Hoje, Intimações, Carteira, Visão geral, Linha do tempo, Mesa de prazos, Tarefas, Agenda, Mesa de trabalho, Acompanhar, Painel). Concatenado antes de `app.jsx` |
| `src/Nexus.shell.html` | HTML, CSS, CDN, portal de tooltips (`<!--INJECT_APP_JS-->`) |
| `Código.js` | Backend Apps Script (`doGet`, sync Drive, backups) |
| `RESUMO-DIARIO.js` | Lógica de resumo diário no Apps Script |

**Nunca editar à mão** (gerados por `npm run build`):

- `Nexus.html` (clássico — default do `doGet`)
- `Nexus.demo.html` (Demo — interface clássica, para compartilhar e testes menores)
- `demo_experimental.html` (Demo Experimental — Nova versão / Beta)

Não gerar aliases (`Nexus_demo.html`, `Nexus_demo_experimental.html`). Se ainda existirem no disco, o build apaga.

Detalhes: `BUILD.md`.

## Comandos

```bash
npm install          # 1ª vez
npm run build        # após alterar src/app.jsx ou src/Nexus.shell.html
npm run push         # build + clasp push (requer clasp autenticado)
```

Após mudanças em `src/`, rode `npm run build` antes de considerar a tarefa pronta. Inclua os HTML gerados no commit quando o build alterar a saída.

## Edições de UI

- **Clássico** (default): `Nexus.html` / `doGet`. Temas: Mar Profundo · Claro · Ferro e Maré.
- **Demo** (`Nexus.demo.html`): mesma interface do clássico, para compartilhar e testes menores. ⚙ → Resetar dados demo.
- **Demo Experimental** (`demo_experimental.html`): `uiEdition: 'demo'` — Nova versão (beta): Hoje, Agenda unificada, Mesa de prazos. Ativar também via ⚙ → “Nova versão (beta)” ou `?edition=demo`.
- **Nexus Prumo** (antes “Claude · Ardósia”; tema Ardósia): `uiEdition: 'claude'` (chave interna mantida) — menu lateral com operações, Hoje, Intimações, Carteira, Visão geral da operação (aba `visao`, só nesta edição), cabeçalho próprio nas abas da operação, aba única Partes e bens (seletor sobre `pessoas`/`bens`), Linha do tempo (`viewMode: 'cx_timeline'`), Mesa de prazos extintivos, Tarefas, Agenda, Mesa de trabalho, Acompanhar e Painel novos; Biblioteca e os formulários (modais) são os do app com visual Prumo por CSS; demais telas vêm do app dentro da casca. Ativar via ⚙ ou `?edition=claude`. Código em `src/edition-claude.jsx`.
- A Beta e o Nexus Prumo **não** substituem o clássico. Modelo de dados, parsers, sync Drive, formulários e calculadora de prescrição devem permanecer compatíveis entre edições, salvo pedido explícito.

## Planejamento

- `docs/MELHORIAS.md` — banco de anotações / fases. Pedidos típicos: “vamos fazer o item N” ou “vamos fazer o P2”.
- Redesign progressivo: **uma fase por vez** → build → validação → próxima.
- Mockups em `design/mockups/`. Arquivos `**/*.md`, `src/`, `scripts/` e toolchain **não** sobem no `clasp push` (`.claspignore`).

## Princípios de mudança

- Preferir edições mínimas e focadas no pedido.
- Não refatorar parsers, prescrição ou sync Drive “de passagem”.
- Em UI: preservar o card atual de intimação (notas) salvo fase explícita do plano.
- `docs/MELHORIAS.md` e `BUILD.md` são documentação humana; estas instruções em `AGENTS.md` e `.cursor/rules/` têm prioridade para o Agent.

## Cursor Cloud

- Setup: `npm install && npm run build`.
- Para validar localmente, abrir `Nexus.html` (clássico), `Nexus.demo.html` (Demo) e `demo_experimental.html` (Beta) após o build.
- `npm run push` só faz sentido com `clasp` autenticado e `.clasp.json` apontando ao projeto correto; não assumir push remoto sem isso.
