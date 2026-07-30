# Build do NEXUS (pré-compilação do JSX)

O frontend deixa de ser transpilado no navegador (`babel-standalone`).
O JSX é compilado **na sua máquina** antes do `clasp push`.

## Arquivos

| Arquivo | Função |
|---|---|
| `src/app.jsx` | **Edite aqui** a lógica React / parsers / domínio |
| `src/Nexus.shell.html` | **Edite aqui** HTML, CSS, CDN e o portal de tooltips |
| `Nexus.html` | **Gerado** pelo build — não edite à mão |
| `scripts/build.mjs` | Compila JSX e monta `Nexus.html` |

## Comandos

```powershell
# 1ª vez (instala Babel localmente)
npm install

# Sempre que alterar src/app.jsx ou src/Nexus.shell.html
npm run build

# Build + envio ao Apps Script
npm run push
```

## Por que isso acelera

Antes, a cada abertura o navegador baixava ~3 MB do Babel e convertia
~760 KB de JSX em JavaScript. Agora o Apps Script serve JavaScript já
pronto — a abertura fica tipicamente 2–5 s mais rápida.
