---
name: build-nexus
description: Compila o frontend do Nexus (JSX → HTML gerados), verifica saída e prepara checklist de deploy clasp. Use quando alterar src/, após features de UI, ou quando o usuário pedir build, push ou deploy do Apps Script.
---

# Build Nexus

## Quando usar

- Depois de editar `src/app.jsx` ou `src/Nexus.shell.html`
- Antes de considerar pronta uma mudança de UI/lógica frontend
- Quando o usuário pedir build, `clasp push`, ou deploy

## Passos

1. Confirmar que as edições foram só na fonte (`src/`), não nos HTML gerados na raiz.
2. Se `node_modules` não existir: `npm install`
3. Rodar:

```bash
npm run build
```

4. Verificar sucesso no terminal (sem ERRO do `scripts/build.mjs`).
5. Conferir que o par canônico foi atualizado/existe:
   - `Nexus.html` (clássico)
   - `Nexus.demo.html` (Demo Experimental)
   O build pode ainda gerar aliases locais (`Nexus_demo.html`, `Nexus_demo_experimental.html`, `demo_experimental.html`) — mesmo conteúdo da demo; não commitar.
6. Se o shell foi tocado: garantir que `<!--INJECT_APP_JS-->` ainda existe e que não voltou `babel-standalone`.

## Deploy (só se o usuário pedir push/deploy)

```bash
npm run push
```

Requisitos: `clasp` no PATH, login feito, `.clasp.json` correto.  
Depois do push: lembrar o usuário de criar **Nova versão** na implantação do Apps Script (se for o fluxo dele).

## Não fazer

- Não editar `Nexus.html` (nem demos) para “corrigir” o build — corrigir a fonte e recompilar
- Não commitar só `src/` sem os HTML gerados quando o build mudou a saída
- Não rodar `clasp push` sem pedido explícito (pode afetar o projeto Apps Script ligado)

## Referência rápida

| Pedido | Ação |
|---|---|
| “só build” | `npm run build` |
| “build + push” / deploy | `npm run push` |
| falha de sintaxe | ver `scripts/diagnose-syntax.mjs` / `scripts/verify.mjs` se útil |
