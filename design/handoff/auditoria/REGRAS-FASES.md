# Regras comuns a todas as fases da correção da auditoria

Repo: /home/user/nexus-cursor, branch `claude/quirky-davinci-zmvzh8` (já em checkout). Antes de começar: `git pull --ff-only origin claude/quirky-davinci-zmvzh8`.
Leia AGENTS.md. Só o Nexus Prumo muda (src/edition-claude.jsx + CSS `.cx*` em src/Nexus.shell.html; src/lib/*.js se necessário). Clássico, Beta e Demo devem continuar idênticos: NÃO altere estilos inline nem markup de src/app.jsx, a não ser que a fase diga explicitamente. Não mude modelo de dados, parsers, prescrição, sync.

Relatório da auditoria: /tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/audit/RELATORIO.md (as linhas citadas estão defasadas — use grep pelos seletores).

Decisões do usuário que prevalecem sobre o relatório:
- Card de intimação (CxIntimRow, classes .cx-ix*, .cx-it-*): tamanhos pedidos pelo usuário — parte 13px, nº processo mono 11,5px/400, objeto 12px, notas e teor 11,5px, data 12px sans, "Emb. dd/mm". Não aumente nada nele.
- Frentes processuais, cards "Evento da fase" e "Notas" (.cx-bfx*): texto 11,5px (pedido explícito). Não aumente.
- Na dúvida entre unificar para cima ou para baixo, unifique para o MENOR tamanho legível já usado em tela equivalente (o usuário acha as fontes grandes).
- Mudança visual mínima por item: convergir para a regra, sem redesenhar telas.

Fluxo obrigatório em cada fase:
1. Implementar só os itens da fase.
2. `npm run build` e `npm test` (todos passando).
3. Conferência visual com Playwright: helpers em /tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/qa-card/ (`lib.mjs` com launch/setup que serve CDN/fontes localmente; `app3.mjs` mostra como abrir file:///home/user/nexus-cursor/Nexus.html?edition=claude, carregar dados demo via ⚙ → "Resetar / carregar dados demo", e navegar). Não rode `playwright install`. Scripts e prints numa subpasta própria da fase em .../scratchpad/qa-card/fase-N/, nunca no repo. Tire prints das telas afetadas (antes e depois quando útil), tema claro e um escuro (⚙ → Noite), 1440px. Sem erros de console.
4. Commit em português, staging só dos arquivos alterados (nunca `git add -A`), terminando com:
   Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01SmGqYj4FSq4DdHxGHgksSJ
   Inclua Nexus.html, Nexus.demo.html, demo_experimental.html gerados pelo build. Depois `git push origin claude/quirky-davinci-zmvzh8`. Não abra PR.
5. Acrescente ao fim da entrada mais recente do Prumo em docs/MELHORIAS.md (seção "Já feito") um subitem curto descrevendo a fase.
6. Relatório final em português: o que mudou (seletor/componente → antes → depois), o que ficou de fora e por quê, prints, hash do commit.
