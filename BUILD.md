# Build do NEXUS (pré-compilação do JSX)

O frontend deixa de ser transpilado no navegador (`babel-standalone`).
O JSX é compilado **na sua máquina** antes do `clasp push`.

## Arquivos

| Arquivo | Função |
|---|---|
| `src/app.jsx` | **Edite aqui** a lógica React / parsers / domínio |
| `src/Nexus.shell.html` | **Edite aqui** HTML, CSS, CDN e o portal de tooltips |
| `Nexus.html` | **Gerado** pelo build (clássico) — não edite à mão |
| `Nexus.demo.html` | **Gerado** pelo build (Demo Experimental) — não edite à mão |
| `scripts/build.mjs` | Compila JSX e monta o par canônico acima |

O build também escreve aliases locais (`Nexus_demo.html`, `Nexus_demo_experimental.html`, `demo_experimental.html`) com o mesmo conteúdo de `Nexus.demo.html`. Eles servem para atalhos no computador e **não** são versionados.

## Deploy (Apps Script)

O `npm run push` agora:
1. Compila `src/app.jsx` → `Nexus.html`
2. Copia só os 4 arquivos necessários para `gas/`
3. Roda `clasp push` com `rootDir: gas` (evita varrer `node_modules` e demos)

**Não cole** o `Nexus.html` (~1,5 MB) no editor do Apps Script — o editor não aguenta. Use só o `clasp push`.

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
