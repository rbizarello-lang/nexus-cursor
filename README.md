# NEXUS — Painel de Operações Fiscais

Aplicativo de controle processual e operações fiscais.
A tela (React) é compilada no computador; o Google Apps Script só serve o JavaScript já pronto.

## Como gerar e testar

```bash
npm install    # só na primeira vez
npm test       # testes automáticos
npm run build  # gera Nexus.html, Nexus.demo.html e demo_experimental.html
```

## Qual HTML abrir

| Arquivo | Para quê |
|---|---|
| `Nexus.html` | Clássico — o app do dia a dia (é o que o Apps Script publica) |
| `Nexus.demo.html` | **Demo** — mesma interface clássica, para compartilhar e testes menores |
| `demo_experimental.html` | **Demo Experimental** — nova versão (beta) para os testes desta trilha |

Depois do `npm run build`, abra o arquivo no navegador (arquivo local).
Em qualquer um: ⚙ → Resetar / carregar dados demo.

## Onde fica o app publicado

O código publicado vive no projeto Google Apps Script ligado por `.clasp.json`.
A página da web é a implantação desse projeto: `doGet` abre o arquivo `Nexus` (clássico).
Não altere o `scriptId` sem pedido explícito.

Para enviar ao Apps Script (precisa do clasp autenticado):

```bash
npm run push
```

## Onde editar

| Pasta / arquivo | Função |
|---|---|
| `src/` | Tela e regras do painel |
| `Código.js`, `RESUMO-DIARIO.js` | Backend do Apps Script |
| `MOTOR_PRESCRICAO.md` | Regras da calculadora (o build injeta este arquivo) |
| `docs/MELHORIAS.md` | Planejamento e fases |
| `AGENTS.md`, `BUILD.md` | Instruções de edição e de build |
