# NEXUS — instruções para agentes Cursor

Painel de Operações Fiscais (Google Apps Script + React). Frontend pré-compilado localmente; o Apps Script serve JS pronto.

## Onde editar

| Arquivo | Função |
|---|---|
| `src/app.jsx` | Lógica React, parsers, domínio, UI clássica e demo |
| `src/Nexus.shell.html` | HTML, CSS, CDN, portal de tooltips (`<!--INJECT_APP_JS-->`) |
| `Código.js` | Backend Apps Script (`doGet`, sync, Gemini view, etc.) |
| `RESUMO-DIARIO.js` | Lógica de resumo diário no Apps Script |

**Nunca editar à mão** (gerados por `npm run build`):

- `Nexus.html` (clássico — default do `doGet`)
- `Nexus.demo.html`, `Nexus_demo.html`, `Nexus_demo_experimental.html`, `demo_experimental.html`

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
- **Demo Experimental**: `uiEdition: 'demo'` — rail Hoje / Intimações e Tarefas / Carteira / Agenda / Biblioteca / Trabalho. Ativar via ⚙, `?edition=demo`, ou abrir os HTML demo na raiz.
- Demo **não** substitui o clássico. Modelo de dados, parsers, sync Drive, formulários e calculadora de prescrição devem permanecer compatíveis entre edições, salvo pedido explícito.

## Planejamento

- `MELHORIAS.md` — banco de anotações / fases. Pedidos típicos: “vamos fazer o item N” ou “vamos fazer o P2”.
- Redesign progressivo: **uma fase por vez** → build → validação → próxima.
- Mockups em `_design-mockups/`. Arquivos `**/*.md`, `src/`, `scripts/` e toolchain **não** sobem no `clasp push` (`.claspignore`).

## Princípios de mudança

- Preferir edições mínimas e focadas no pedido.
- Não refatorar parsers, prescrição ou sync Drive “de passagem”.
- Em UI: preservar o card atual de intimação (notas) salvo fase explícita do plano.
- `MELHORIAS.md` e `BUILD.md` são documentação humana; estas instruções em `AGENTS.md` e `.cursor/rules/` têm prioridade para o Agent.

## Cursor Cloud

- Setup: `npm install && npm run build`.
- Para validar clássico vs demo localmente, abrir os HTML gerados na raiz após o build.
- `npm run push` só faz sentido com `clasp` autenticado e `.clasp.json` apontando ao projeto correto; não assumir push remoto sem isso.
