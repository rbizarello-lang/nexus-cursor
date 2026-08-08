# Checklist de aperfeiçoamento de layout — NEXUS

Usar em ordem. Falhas = defeitos a corrigir ou reportar.

## 1. Relevância da informação (prioridade máxima)

- [ ] Em menos de 2 segundos, o olho encontra o que manda a ação agora (prazo, urgência, intimação crítica, operação aberta)?
- [ ] Imp / Dif / Prazo no card de intimação estão legíveis e não competem com metadados secundários?
- [ ] Status de risco/prescrição (quando na tela) tem peso visual coerente com a gravidade — sem “sumir” no muted?
- [ ] Nada decorativo (badge, chip, label solto) cobre ou rouba atenção do dado operacional?

## 2. Uma composição / um trabalho por região

- [ ] A viewport principal tem um propósito claro (fila, detalhe, briefing) — não parece dashboard de widgets?
- [ ] Cada seção tem um título + no máximo uma frase de apoio (quando precisar)?
- [ ] Rail / nav (Demo) e conteúdo principal estão balanceados — o rail não compete com a mesa de trabalho?

## 3. Densidade e cansaço

- [ ] Cards/listas colapsam o que pode ficar fechado por padrão (ex.: processos detalhados)?
- [ ] Há scroll vazio, padding excessivo, ou o contrário — amontoado ilegível?
- [ ] Controles repetidos (filtros, botões, pills) estão agrupados; sem fileiras de chips sem ação?
- [ ] Em listas longas, a linha/card permite scan vertical rápido (âncora tipográfica estável)?

## 4. Hierarquia tipográfica e cor

- [ ] Usa tokens do shell (`--text-primary`, `--text-secondary`, `--accent`, etc.) em vez de cores soltas?
- [ ] Primário = ação/dado; secundário = contexto; muted = auxiliar — não o inverso?
- [ ] Contraste suficiente no tema ativo (Mar Profundo / Claro / Ferro e Maré; Demo Clara·Mar·Ardósia·Grafite)?
- [ ] Accent/pgfn/red/yellow usados com significado (não só decoração)?

## 5. Layout estrutural

- [ ] Sem overflow horizontal indesejado; texto não corta sem tooltip/título completo?
- [ ] Master–detail (Visão D): lista + painel — detalhe só após seleção; Extintas/Outros não dominam?
- [ ] Demo: zonas Briefing · Acervo · Risco · Ferramentas coerentes com a aba atual?
- [ ] Formulários/modais: foco claro; não empurram o conteúdo crítico para fora da dobra sem necessidade?

## 6. Clássico vs Demo

- [ ] Mudança aplicada na edição correta (ou em ambas se o pedido for compartilhado de token/CSS)?
- [ ] Não removeu/fundiu navegação Demo no clássico (nem o contrário) sem pedido explícito?
- [ ] Modelo de dados e ações continuam acessíveis — só a apresentação mudou?

## 7. Movimento e ruído

- [ ] Pulse/animação só onde sinaliza urgência real (P5: preferir calmo)?
- [ ] Hover/CTA perceptível sem brilho/glow excessivo?

## 8. Fechamento

- [ ] Diff mínimo alinhado ao pedido
- [ ] `npm run build` ok; HTML gerados atualizados se necessário
- [ ] Screenshot ou Design Mode confirma a melhoria
- [ ] Se aprovado pelo usuário: candidatar print a `_design-mockups/approved/`
