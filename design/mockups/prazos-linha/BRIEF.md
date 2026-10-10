# Brief — reformulação da linha/card da inscrição (CDA) na Mesa de prazos

Repositório NEXUS (Google Apps Script + React). Leia `AGENTS.md` e `docs/prazos-unificados/PLANO.md` (decisões 1–19).
Escopo: **só mockups HTML** nesta etapa. Nenhuma mudança em `src/`.

## Situação atual (prints nesta pasta)
- `atual-lista.png` — Lista: cada CDA ocupa ~145 px de altura; a régua ocupa meia largura e fica solta; ações (Conferir · Tratar… · Adiar… · Evento · Abrir) em linha própria; valor e relógio isolados à direita; devedor/operação em texto cinza pequeno; muito espaço vazio à direita.
- `atual-tabela.png` — Tabela: a coluna "Cartão" quebra em 3 linhas ("Conferir / o / cálculo"), cada linha fica alta; a coluna "Situação" repete a mesma frase em todas as linhas; 5.022 CDAs exigem densidade; colunas não aproveitam a largura.
- `atual-gaveta-cda.png` — gaveta da CDA (abre à direita): conteúdo bom (prescrição ordinária, decadência, ocorrências, conferências, botões Evento/Tratada/Aguardando reconhecimento/Memória técnica/Editar). **Problema 2:** hoje, clicar na CDA na Mesa leva à página da operação; o usuário quer que a gaveta abra **ali mesmo, sobre a Mesa de prazos**, e que ir à operação seja escolha dele (um link/botão "Abrir operação" na gaveta).

Componentes atuais no código (para referência, não editar): Prumo `CxMesaRow`/`CxMesaLite`/`CxClkBar compact` em `src/edition-claude.jsx`; clássico/Beta `renderMesaRow`/`renderMesaLite` em `src/app.jsx`; dados de cada item em `buildMesaCards` (`src/lib/prazos-mesa.js`): card, CDA, devedor, processo, operação, natureza (ordinária/intercorrente), certeza (Calculado/Estimado/Cedo–tarde/Falta dado/Analisar), relógio (`mesaItemClock`: "há 125d", "tarde em 160d", "não antes de …"), data, valor, situação (frase), faixa cedo–tarde, chips (cedo venceu/tarde não, adiada até…, fora dos 90 dias), ação principal do cartão (Conferir, Ajuizei — informar processo, Lançar fato, Ainda vale, Informar dado, Marcar analisada, Reabrir…), ações secundárias (Tratar…, Adiar…, Evento, Abrir, E se eu ajuizar hoje?), seleção para lote.

Regras que NÃO mudam: cartões e contagens; cada CDA num cartão; nunca "há N anos" em data que não é prazo; cor = cor do cartão (sem grupo G1–G7); decadência só consulta.

## O que cada proposta entrega
Um único arquivo `proposta-<id>.html` nesta pasta (autocontido: CSS/JS inline, sem CDN obrigatória; fonte do sistema ou Google Fonts opcional), visual Nexus Prumo claro (pode reaproveitar tokens de `design/mockups/prazos-unificados/base.css` copiando o necessário para dentro do arquivo). Deve mostrar, com dados sintéticos realistas (≥ 12 CDAs de vários cartões, nomes de devedor longos, valores de R$ 2 mil a R$ 5 mi, processos CNJ, CDAs "sem processo"):
1. **Lista** reformulada (o card/linha da CDA).
2. **Tabela** reformulada (densa, legível, para milhares de linhas).
3. **Gaveta da CDA abrindo sobre a Mesa** (sem sair da página), com o conteúdo da gaveta atual reorganizado se fizer sentido, e o atalho "Abrir operação" explícito.
4. Interações funcionando no mockup (hover, expandir, selecionar, abrir gaveta, ação principal, teclado se houver).
5. Topo do arquivo: um bloco curto "Ideia / O que muda / Custo de implementação (baixo/médio/alto) / Riscos".
Largura 1280 e 390 px sem rolagem horizontal da página.

## Pesquisa
Antes de desenhar, consulte padrões atuais de UI de produtividade densa (ex.: Linear, Height, Superhuman, GitHub Projects, Notion databases, Airtable, Attio, shadcn/ui data-table, Radix, master-detail/side-sheet, command palette, inline actions on hover, sticky group headers, density toggles, row virtualization) e, se a rede permitir, as referências do usuário:
- https://mcpmarket.com/tools/skills/mcp-ui-app-implementation
- https://github.com/maxbogo/awesome-ai-tools-for-ui
Cite no bloco do topo o que foi aproveitado. Não instale pacotes no repositório.
