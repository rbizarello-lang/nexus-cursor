/**
 * Cálculos puros da Linha do tempo do Nexus Prumo — sem DOM nem React (os componentes ficam em
 * src/edition-claude.jsx). Tudo sai de campos que o app já tem; nada aqui inventa dado.
 *
 *  - Vocabulário: um tipo de fato = uma forma (◆ decisão, ○ andamento, ■ audiência, ▼ prazo,
 *    ⬢ prescrição, ◔ revisão). Compartilhado pela régua, pelos filtros da legenda e pelos modos
 *    futuros (narrativa, frentes, relógio, miniaturas).
 *  - Rótulos sem colisão: `tlLayoutLabels` distribui os rótulos em faixas acima da linha de marcos,
 *    prioriza o que está perto de "hoje", vira o rótulo para a esquerda na borda e descarta (com
 *    contagem) o que não cabe — o tooltip cobre o resto.
 *  - Texto na barra do processo: `tlPickGap` acha um vão sem marcador para o rótulo de status.
 *  - CDAs a ajuizar: `tlCdaBar` (posição proporcional do "hoje" entre o início e o termo).
 *  - Panorama (M1, régua com foco no agora): `tlProjectBroken` projeta datas (em dias a partir de hoje) num eixo
 *    quebrado — o foco (30 d … 1 ano) em escala linear e o passado/futuro comprimidos nas laterais (cada uma
 *    com no máximo 18% da largura e 3 quebras hachuradas "≈ 13 m" nos maiores vãos sem fato; o resto é espremido) —, `tlFocusAxis`/`tlZoneTicks` geram as marcas do eixo,
 *    `tlNormalizeFocus` protege o estado lembrado no navegador.
 *  - Miniaturas (M6): `tlPulseLayout`/`tlPulseSummary` (pulso de 120 dias da Carteira: pontos em dias a partir de hoje,
 *    marcas de semana e de mês, frase "Próximo …"), `tlPhaseTrail` (trilha de fases de um processo: cumpridas, atual,
 *    sem registro e esperadas, com os dias entre fases) e `tlMiniTrail` (a trilha curta de até 6 pontos da gaveta da
 *    intimação: fases cumpridas, "você está aqui" e o que vem).
 *  - Horizonte de 90 dias (M5): `horizonColumns` (funil Atrasados · esta semana · semanas 2-5 · meses · Depois),
 *    `horizonBucket` (itens por coluna), `horizonDayCounts`/`horizonBusyDays` (dias com 3 ou mais itens) e
 *    `horizonOffRuns` (dias úteis que não são úteis: feriado, recesso ou calendário local — o predicado vem de fora).
 */
import { daysBetween, addCalendarDays, toDayKey, localIso } from './dates.js';

/** Um tipo de fato = uma forma. A ordem é a da legenda. */
export const TL_KINDS = {
  dec: { label: 'Decisão', plural: 'Decisões', glyph: '◆' },
  and: { label: 'Andamento', plural: 'Andamentos', glyph: '○' },
  aud: { label: 'Audiência', plural: 'Audiências', glyph: '■' },
  prazo: { label: 'Prazo', plural: 'Prazos', glyph: '▼' },
  presc: { label: 'Prescrição', plural: 'Prescrição', glyph: '⬢' },
  rev: { label: 'Revisão', plural: 'Revisões', glyph: '◔' },
};
export const TL_KIND_ORDER = ['dec', 'and', 'aud', 'prazo', 'presc', 'rev'];
/** Peso de cada tipo na disputa por rótulo (maior = mais importante). */
export const TL_KIND_WEIGHT = { aud: 5, prazo: 5, dec: 4, presc: 3, rev: 2, and: 1 };

/** Largura estimada de um texto (px) quando não há como medir no navegador. */
export function tlEstimateWidth(text, fontPx = 11) {
  return String(text == null ? '' : text).length * fontPx * 0.56;
}

/**
 * Distribui rótulos em faixas (níveis) sem sobreposição.
 * items: [{ id, x, w, prio }] — x é o centro do marcador, w a largura do texto, prio menor = mais importante.
 * Cada rótulo tenta ficar à direita do marcador; se estourar a borda direita, vira para a esquerda.
 * Retorna { placed: [{ id, level, anchor, x0, x1 }], dropped: [id], levels } — `levels` é quantos
 * níveis foram usados (altura da linha).
 */
export function tlLayoutLabels(items, opts = {}) {
  const minX = opts.minX == null ? 0 : opts.minX;
  const maxX = opts.maxX == null ? Infinity : opts.maxX;
  const gap = opts.gap == null ? 6 : opts.gap;
  const pad = opts.pad == null ? 8 : opts.pad;
  const maxLevels = opts.levels == null ? 3 : opts.levels;
  const order = (items || []).map((it, i) => ({ it, i })).sort((a, b) => {
    const pa = a.it.prio == null ? 0 : a.it.prio, pb = b.it.prio == null ? 0 : b.it.prio;
    if (pa !== pb) return pa - pb;
    if (a.it.x !== b.it.x) return a.it.x - b.it.x;
    return a.i - b.i;
  });
  const busy = [];
  for (let l = 0; l < maxLevels; l++) busy.push([]);
  const placed = [], dropped = [];
  const free = (lv, x0, x1) => busy[lv].every(s => x1 + gap <= s[0] || x0 >= s[1] + gap);
  order.forEach(({ it }) => {
    const w = Math.max(0, it.w || 0);
    const right = { anchor: 'start', x0: it.x + pad, x1: it.x + pad + w };
    const left = { anchor: 'end', x0: it.x - pad - w, x1: it.x - pad };
    const fits = c => c.x0 >= minX && c.x1 <= maxX;
    const cands = (fits(right) ? [right, left] : [left, right]).filter(fits);
    let hit = null;
    for (let lv = 0; lv < maxLevels && !hit; lv++) {
      for (const c of cands) { if (free(lv, c.x0, c.x1)) { hit = { ...c, level: lv }; break; } }
    }
    if (hit) { busy[hit.level].push([hit.x0, hit.x1]); placed.push({ id: it.id, level: hit.level, anchor: hit.anchor, x0: hit.x0, x1: hit.x1 }); }
    else dropped.push(it.id);
  });
  const levels = placed.reduce((m, p) => Math.max(m, p.level + 1), 0);
  const byId = new Map(placed.map(p => [p.id, p]));
  return { placed: (items || []).map(it => byId.get(it.id)).filter(Boolean), dropped, levels };
}

/**
 * Primeiro vão horizontal de largura `w` entre `from` e `to` sem nenhum marcador (cada marcador
 * ocupa meia-largura `half` para cada lado). Retorna o x inicial ou null se não houver vão.
 */
export function tlPickGap(markerXs, from, to, w, opts = {}) {
  const half = opts.half == null ? 8 : opts.half;
  const pad = opts.pad == null ? 4 : opts.pad;
  const xs = (markerXs || []).filter(x => Number.isFinite(x)).sort((a, b) => a - b);
  const cands = [from];
  xs.forEach(x => { cands.push(x + half + pad); });
  for (const c of cands) {
    if (c < from || c + w > to) continue;
    if (xs.every(x => x + half <= c || x - half >= c + w)) return c;
  }
  return null;
}

/** Corta o texto em `n` caracteres com reticências (sem deixar espaço antes do "…"). */
export function tlClip(text, n) {
  const s = String(text == null ? '' : text).trim();
  return s.length <= n ? s : s.slice(0, Math.max(1, n - 1)).trimEnd() + '…';
}

/** "10 meses", "2,5 anos", "3 dias", "hoje"; negativos viram "há …". */
/**
 * Forma curta do nº do processo para rótulos estreitos.
 * - CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO, com ou sem pontuação) → "NNNNNNN-DD".
 * - Formato antigo da JF (AAAA.TT.SS.NNNNNN-D, com ou sem pontuação: 15 dígitos) → número inteiro
 *   formatado, porque o ano sozinho ("2005") não identifica o processo.
 * - Qualquer outro texto → como veio.
 */
export function tlProcShort(num) {
  const raw = String(num == null ? '' : num).trim();
  if (!raw) return '—';
  const d = raw.replace(/\D/g, '');
  if (d.length === 20 && /^\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}$/.test(raw)) return d.slice(0, 7) + '-' + d.slice(7, 9);
  if (d.length === 15 && /^\d{4}\.?\d{2}\.?\d{2}\.?\d{6}-?\d$/.test(raw)) return d.slice(0, 4) + '.' + d.slice(4, 6) + '.' + d.slice(6, 8) + '.' + d.slice(8, 14) + '-' + d.slice(14);
  return raw;
}

export function tlDurLabel(days) {
  if (days === null || days === undefined || Number.isNaN(days)) return '';
  if (days === 0) return 'hoje';
  const n = Math.abs(days);
  let t;
  if (n === 1) t = '1 dia';
  else if (n < 45) t = n + ' dias';
  else if (n < 365) { const m = Math.round(n / 30.44); t = m + (m === 1 ? ' mês' : ' meses'); }
  else {
    const y = n / 365.25;
    const r = Math.round(y * 10) / 10;
    t = Number.isInteger(r) ? r + (r === 1 ? ' ano' : ' anos') : String(r).replace('.', ',') + ' anos';
  }
  return days < 0 ? 'há ' + t : t;
}

/**
 * Barra de uma CDA sem processo (prazo de 5 anos para ajuizar): quanto já correu e quanto falta.
 * `today` e as datas em ISO. pct em 0..1 (já truncado).
 */
export function tlCdaBar({ start, end, today }) {
  const total = Math.max(1, daysBetween(start, end));
  const gone = daysBetween(start, today);
  const left = daysBetween(today, end);
  return { total, gone, left, pct: Math.max(0, Math.min(1, gone / total)), late: left < 0 };
}

/** Legenda: quantos itens de cada tipo (só os que têm data). items: [{ kind }]. */
export function tlCountKinds(items) {
  const c = {};
  TL_KIND_ORDER.forEach(k => { c[k] = 0; });
  (items || []).forEach(it => { if (it && c[it.kind] !== undefined) c[it.kind]++; });
  return c;
}

/** Liga/desliga um tipo no conjunto de ocultos (devolve um conjunto novo). */
export function tlToggleKind(hidden, kind) {
  const n = new Set(hidden || []);
  if (n.has(kind)) n.delete(kind); else n.add(kind);
  return n;
}

/** Limita uma lista a `cap` itens, a menos que `expanded`. Nada é descartado em silêncio: devolve `more`. */
export function tlCapList(list, cap, expanded) {
  const all = list || [];
  if (expanded || all.length <= cap) return { shown: all, more: 0 };
  return { shown: all.slice(0, cap), more: all.length - cap };
}

/* ═════════════ Horizonte de 90 dias (M5) ═════════════ */
const HZ_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const HORIZON_DAYS = 90;
/** Nº de itens num mesmo dia a partir do qual o dia "aperta" (colunas com um dia assim ganham destaque). */
export const HORIZON_BUSY_MIN = 3;
/** Linhas do Horizonte, por natureza: [chave, rótulo, subtítulo]. */
export const HORIZON_ROWS = [['prazo', 'Prazos', 'intimações'], ['aud', 'Audiências', ''], ['tar', 'Tarefas', ''], ['presc', 'Prescrição e revisões', 'termos · revisão']];

const hzDm = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7);
const hzDow = (iso) => new Date(iso + 'T00:00:00').getDay();
/** "05–11/10" (mesmo mês) ou "26/10–01/11"; um dia só: "04/10". */
export function horizonRangeLabel(from, to) {
  if (!from || !to) return '';
  if (from === to) return hzDm(from);
  if (from.slice(0, 7) === to.slice(0, 7)) return from.slice(8, 10) + '–' + hzDm(to);
  return hzDm(from) + '–' + hzDm(to);
}

/**
 * Colunas do funil, da esquerda para a direita:
 *   Atrasados (antes de hoje) · Esta semana (hoje até domingo) · Semana 2..5 (segunda a domingo) ·
 *   um mês por coluna até o fim da janela (hoje + `days`) · Depois (além da janela).
 * Cada coluna: { key, kind, label, sub, from, to } com from/to em ISO (null = aberto).
 */
export function horizonColumns(todayIso, opts = {}) {
  const today = toDayKey(todayIso);
  const days = opts.days == null ? HORIZON_DAYS : opts.days;
  const end = addCalendarDays(today, days);
  const cols = [{ key: 'late', kind: 'late', label: 'Atrasados', sub: 'antes de hoje', from: null, to: addCalendarDays(today, -1) }];
  const dow = hzDow(today);
  let from = today;
  let to = addCalendarDays(today, dow === 0 ? 0 : 7 - dow);
  for (let w = 1; w <= 5 && from <= end; w++) {
    const t = to > end ? end : to;
    cols.push({ key: 'w' + w, kind: 'week', label: w === 1 ? 'Esta semana' : 'Semana ' + w, sub: horizonRangeLabel(from, t), from, to: t });
    from = addCalendarDays(to, 1);
    to = addCalendarDays(from, 6);
  }
  let guard = 0;
  while (from <= end && guard++ < 24) {
    const y = +from.slice(0, 4), m = +from.slice(5, 7);
    const monthEnd = localIso(new Date(y, m, 0)); // último dia do mês (m é 1-based; dia 0 do mês seguinte)
    const t = monthEnd > end ? end : monthEnd;
    cols.push({ key: 'm:' + from.slice(0, 7), kind: 'month', label: HZ_MESES[m - 1], sub: horizonRangeLabel(from, t), from, to: t });
    from = addCalendarDays(monthEnd, 1);
  }
  cols.push({ key: 'after', kind: 'after', label: 'Depois', sub: 'após ' + hzDm(end), from: addCalendarDays(end, 1), to: null });
  return cols;
}

/** Em que coluna cai uma data (ISO)? Antes de hoje = Atrasados; depois do fim da janela = Depois. Sem data: null. */
export function horizonColumnOf(iso, columns) {
  const d = toDayKey(iso);
  if (!d) return null;
  for (const c of columns) {
    if ((c.from === null || d >= c.from) && (c.to === null || d <= c.to)) return c.key;
  }
  return null;
}

/** Agrupa itens ({ d, tm? }) por coluna, em ordem de data e hora. Itens sem data ficam de fora. */
export function horizonBucket(items, columns) {
  const out = {};
  columns.forEach(c => { out[c.key] = []; });
  (items || []).forEach(it => {
    const k = horizonColumnOf(it && it.d, columns);
    if (k) out[k].push(it);
  });
  Object.keys(out).forEach(k => out[k].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.tm || '').localeCompare(String(b.tm || '')))));
  return out;
}

/** Quantos itens em cada dia (ISO → n). */
export function horizonDayCounts(items) {
  const m = new Map();
  (items || []).forEach(it => { const d = toDayKey(it && it.d); if (d) m.set(d, (m.get(d) || 0) + 1); });
  return m;
}
/** Dias com `min` itens ou mais (o aperto da semana). */
export function horizonBusyDays(counts, min = HORIZON_BUSY_MIN) {
  const s = new Set();
  counts.forEach((n, d) => { if (n >= min) s.add(d); });
  return s;
}

/**
 * Sequências de dias de semana não úteis (feriado, recesso, calendário local) dentro de uma coluna.
 * `isOff(iso)` diz se o dia é não útil; sábados e domingos nunca contam. Colunas abertas (Atrasados/Depois) não têm.
 * Retorna [{ from, to, n }].
 */
export function horizonOffRuns(column, isOff) {
  if (!column || !column.from || !column.to || typeof isOff !== 'function') return [];
  const runs = [];
  let cur = null;
  for (let d = column.from, g = 0; d <= column.to && g < 400; d = addCalendarDays(d, 1), g++) {
    const w = hzDow(d);
    if (w === 0 || w === 6) continue;
    if (isOff(d)) {
      if (cur && !hzWeekdayGap(cur.to, d, isOff)) { cur.to = d; cur.n++; }
      else { cur = { from: d, to: d, n: 1 }; runs.push(cur); }
    } else cur = null;
  }
  return runs;
}
/* Entre dois dias não úteis há algum dia de semana útil? (então são sequências separadas) */
function hzWeekdayGap(a, b, isOff) {
  for (let d = addCalendarDays(a, 1); d < b; d = addCalendarDays(d, 1)) {
    const w = hzDow(d);
    if (w !== 0 && w !== 6 && !isOff(d)) return true;
  }
  return false;
}

/* ═════════════ Panorama (M1) — eixo quebrado e janela de foco ═════════════ */
const TL_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const TL_MES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** Janelas de foco, em dias. */
export const TL_WINDOWS = [30, 60, 90, 180, 365];
export const TL_DEFAULT_WINDOW = 90;
export const tlWindowLabel = (w) => (w === 365 ? '1 ano' : w + ' d');
/** Foco padrão: hoje a 1/3 da janela (mais futuro que passado). `c` é o centro da janela, em dias desde hoje. */
export const tlFocusDefault = (w) => ({ w, c: Math.round(w / 6) });
/** Passo dos botões ‹ ›: um terço da janela (no mínimo 7 dias). */
export const tlFocusStep = (w) => Math.max(7, Math.round(w / 3));
export const tlFocusRange = (w, c) => ({ f0: c - w / 2, f1: c + w / 2 });
const TL_FOCUS_LIMIT = 365 * 12;
/**
 * Estado do foco lembrado no navegador ({ w, c, hidden }): aceita só janelas conhecidas, centro numérico
 * (limitado a ±12 anos) e tipos de fato conhecidos; qualquer outra coisa volta ao padrão.
 */
export function tlNormalizeFocus(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const w = TL_WINDOWS.includes(o.w) ? o.w : TL_DEFAULT_WINDOW;
  const cOk = typeof o.c === 'number' && Number.isFinite(o.c);
  const c = cOk ? Math.max(-TL_FOCUS_LIMIT, Math.min(TL_FOCUS_LIMIT, Math.round(o.c))) : tlFocusDefault(w).c;
  const hidden = Array.isArray(o.hidden) ? o.hidden.filter(k => TL_KIND_ORDER.includes(k)) : [];
  return { w, c, hidden };
}

/** "≈ 13 m", "≈ 3,5 a" — o tamanho de um vão comprimido. */
export function tlBreakLabel(days) {
  if (days < 45) return '≈ ' + Math.max(1, Math.round(days)) + ' d';
  const months = Math.round(days / 30.44);
  if (months < 24) return '≈ ' + months + ' m';
  const y = Math.round(days / 365.25 * 10) / 10;
  return '≈ ' + String(y).replace('.', ',') + ' a';
}

/** Quebras do eixo por zona comprimida (no máximo), largura-alvo e largura mínima (px). */
export const TL_MAX_BREAKS = 3;
export const TL_BREAK_W = 30;
export const TL_BREAK_MIN_W = 20;
/** Fonte (px) do rótulo da quebra — o rótulo só aparece se couber nessa medida. */
export const TL_BREAK_FONT = 10;
/** Quanto de um vão sem fato (não escolhido como quebra) conta na escala, em dias: ele é só espremido. */
const TL_SQUEEZE_CAP = 90;

/**
 * Comprime o trecho [a, b] (dias) em `px` pixels, sempre dentro de `px`. Cada ponto de interesse mantém uma janela de
 * ±`win` dias em escala; entre as janelas ficam os vãos sem fato. Só os `maxBreaks` MAIORES vãos (com `minGap` dias ou
 * mais) viram quebra hachurada de largura fixa (`breakW`, no mínimo `minBreakW`; todas juntas ocupam no máximo metade da
 * zona); os demais são espremidos (peça `squeezed`: pesa no máximo TL_SQUEEZE_CAP dias na escala) ou se fundem às peças em escala vizinhas.
 * Muitos fatos espalhados por anos, portanto, dão no máximo `maxBreaks` quebras — nunca centenas.
 * Retorna { f, pieces, px, a, b }; f(dia) → x dentro da zona; cada peça tem { a, b, gap, x0, x1 } e as peças cobrem [0, px].
 */
export function tlCompressZone(a, b, px, points, opts = {}) {
  const win = opts.win == null ? 22 : opts.win;
  const minGap = opts.minGap == null ? 60 : opts.minGap;
  const breakW = opts.breakW == null ? TL_BREAK_W : opts.breakW;
  const minBreakW = opts.minBreakW == null ? TL_BREAK_MIN_W : opts.minBreakW;
  const maxBreaks = opts.maxBreaks == null ? TL_MAX_BREAKS : opts.maxBreaks;
  const wins = [];
  (points || []).filter(p => Number.isFinite(p) && p >= a - 1 && p <= b + 1).sort((x, y) => x - y).forEach(p => {
    const s0 = Math.max(a, p - win), e0 = Math.min(b, p + win);
    if (wins.length && s0 <= wins[wins.length - 1][1] + 1) wins[wins.length - 1][1] = Math.max(wins[wins.length - 1][1], e0);
    else wins.push([s0, e0]);
  });
  const raw = [];
  let cur = a;
  wins.forEach(([s0, e0]) => {
    if (s0 > cur) raw.push({ a: cur, b: s0, gap: s0 - cur >= minGap, win: false });
    raw.push({ a: s0, b: e0, gap: false, win: true });
    cur = e0;
  });
  if (cur < b) raw.push({ a: cur, b, gap: b - cur >= minGap, win: false });
  /* só os maiores vãos viram quebra, e só quantos couberem em metade da zona */
  const order = raw.map((p, i) => ({ p, i })).filter(o => o.p.gap).sort((x, y) => (y.p.b - y.p.a) - (x.p.b - x.p.a) || x.i - y.i);
  let nb = Math.min(Math.max(0, maxBreaks), order.length);
  let bw = nb ? Math.min(breakW, Math.floor(px * 0.5 / nb)) : 0;
  while (nb > 0 && bw < minBreakW) { nb--; bw = nb ? Math.min(breakW, Math.floor(px * 0.5 / nb)) : 0; }
  const keep = new Set(order.slice(0, nb).map(o => o.p));
  const flat = [];
  raw.forEach(p => {
    const isBreak = keep.has(p);
    const q = { a: p.a, b: p.b, gap: isBreak, squeezed: !isBreak && !p.win && p.b - p.a > TL_SQUEEZE_CAP };
    const last = flat[flat.length - 1];
    if (!isBreak && !q.squeezed && last && !last.gap && !last.squeezed) { last.b = q.b; last.w += weight(q); } // vizinhas em escala linear se fundem
    else flat.push({ ...q, w: isBreak ? 0 : weight(q) });
  });
  function weight(q) { return q.squeezed ? TL_SQUEEZE_CAP : q.b - q.a; }
  const pieces = flat;
  const nd = pieces.filter(p => !p.gap).reduce((t, p) => t + p.w, 0) || 1;
  const avail = Math.max(0, px - nb * bw);
  let x = 0;
  pieces.forEach(p => { p.x0 = x; p.x1 = x + (p.gap ? bw : p.w / nd * avail); x = p.x1; delete p.w; });
  if (pieces.length) pieces[pieces.length - 1].x1 = px; // sem erro de arredondamento no fim
  const f = (o) => {
    if (o <= a) return 0;
    if (o >= b) return px;
    for (const p of pieces) if (o <= p.b) return p.x0 + (o - p.a) / ((p.b - p.a) || 1) * (p.x1 - p.x0);
    return px;
  };
  return { f, pieces, px, a, b };
}

/**
 * Projeção de eixo quebrado: foco [f0, f1] em escala linear no meio; antes dele o passado e depois o futuro,
 * comprimidos (só existem se houver fato fora do foco). `points` são todos os dias (desde hoje) que importam.
 * Retorna { f, f0, f1, lo, hi, pastW, futW, focusW, ppd, zP, zU, width }; `f(dia)` → x no canvas inteiro.
 */
export function tlProjectBroken({ points, f0, f1, width, pastFrac = 0.17, futFrac = 0.18, pad = 4 }) {
  const pts = (points || []).filter(Number.isFinite);
  const minP = Math.min(...pts), maxP = Math.max(...pts);
  const past = pts.length > 0 && minP < f0 - 1, fut = pts.length > 0 && maxP > f1 + 1;
  const lo = past ? minP - pad : f0, hi = fut ? maxP + pad : f1;
  let pastW = past ? Math.round(pastFrac * width) : 0;
  let futW = fut ? Math.round(futFrac * width) : 0;
  const focusW = Math.max(60, width - pastW - futW);
  if (pastW + futW + focusW > width) { const k = (width - focusW) / Math.max(1, pastW + futW); pastW = Math.floor(pastW * k); futW = Math.floor(futW * k); }
  const ppd = focusW / (f1 - f0);
  const zP = pastW ? tlCompressZone(lo, f0, pastW, pts.filter(o => o < f0).concat([f0])) : null;
  const zU = futW ? tlCompressZone(f1, hi, futW, pts.filter(o => o > f1).concat([f1])) : null;
  const f = (o) => (o <= f0 ? (zP ? zP.f(o) : 0) : o <= f1 ? pastW + (o - f0) * ppd : pastW + focusW + (zU ? zU.f(o) : futW));
  return { f, f0, f1, lo, hi, pastW, futW, focusW, ppd, zP, zU, width };
}

/**
 * Marcas do eixo dentro do foco: rótulos de mês, números de dia (todos os dias se couber; senão as segundas,
 * de k em k), linhas de grade e sombreado de fim de semana/dia não útil (só com escala de 3 px por dia ou mais).
 * `todayIso`: referência de dia 0; `isOff(iso)`: dia de semana não útil (opcional).
 */
export function tlFocusAxis({ f0, f1, ppd, f, todayIso, isOff }) {
  const majors = [], ticks = [], grid = [], shade = [];
  const first = Math.ceil(f0), last = Math.floor(f1);
  const everyDay = ppd >= 16;
  const k = Math.max(1, Math.ceil(30 / (7 * ppd)));
  let mondays = 0;
  for (let o = first; o <= last; o++) {
    const iso = addCalendarDays(todayIso, o);
    const dow = new Date(iso + 'T00:00:00').getDay();
    const dd = +iso.slice(8, 10), mm = +iso.slice(5, 7) - 1;
    const x = f(o);
    if (dd === 1 || o === first) majors.push({ x, o, iso, partial: dd !== 1, text: TL_MES_L[mm] + ' ' + iso.slice(0, 4), short: TL_MES[mm] + ' ' + iso.slice(2, 4) });
    if (dd === 1) grid.push({ x, strong: true });
    if (dow === 1) grid.push({ x, strong: false });
    if (everyDay) ticks.push({ x: x + ppd / 2, o, text: String(dd), we: dow === 0 || dow === 6 });
    else if (dow === 1 && (mondays++ % k === 0)) ticks.push({ x, o, text: String(dd), we: false });
    if (ppd >= 3) {
      const off = dow === 0 || dow === 6 || (typeof isOff === 'function' && isOff(iso));
      if (off) shade.push({ x, w: Math.max(1, f(o + 1) - x), o, holiday: !(dow === 0 || dow === 6) });
    }
  }
  return { majors, ticks, grid, shade };
}

/**
 * Marcas de uma zona comprimida: traços de mês (ou de 3, 6, 12… meses, conforme a escala — nunca mais de um a cada
 * `minTickGap` px), rótulos "mmm aa" no início dos trechos largos (e o ano, em janeiro, quando o passo é de um ano ou mais)
 * sem sobreposição e dentro da zona, e as quebras com o tamanho do vão — `showLabel` só quando o texto cabe na quebra
 * (senão o tooltip diz o tamanho). Trechos espremidos (`squeezed`: vãos longos que não viraram quebra) não ganham traços, pois a escala ali não é linear; a tela os sombreia de leve, com o tamanho no tooltip.
 * `x0` é o deslocamento da zona no canvas. Retorna { ticks, labels, breaks, squeezed }.
 */
export function tlZoneTicks(zone, x0, todayIso, opts = {}) {
  const out = { ticks: [], labels: [], breaks: [], squeezed: [] };
  if (!zone) return out;
  const minLabelW = opts.minLabelW == null ? 30 : opts.minLabelW;
  const minTickGap = opts.minTickGap == null ? 10 : opts.minTickGap;
  const cand = [], rawTicks = [];
  let firstScaled = true;
  zone.pieces.forEach(p => {
    if (p.gap) {
      const label = tlBreakLabel(p.b - p.a);
      out.breaks.push({ x0: x0 + p.x0, x1: x0 + p.x1, a: p.a, b: p.b, days: p.b - p.a, label, showLabel: p.x1 - p.x0 >= tlEstimateWidth(label, TL_BREAK_FONT) + 2 });
      return;
    }
    const start = addCalendarDays(todayIso, Math.ceil(p.a));
    if (p.x1 - p.x0 >= minLabelW || (opts.labelFirst && firstScaled)) {
      cand.push({ x: x0 + p.x0, text: TL_MES[+start.slice(5, 7) - 1] + ' ' + start.slice(2, 4), prio: opts.labelFirst && firstScaled ? 0 : 1 });
    }
    firstScaled = false;
    if (p.squeezed) { out.squeezed.push({ x0: x0 + p.x0, x1: x0 + p.x1, a: p.a, b: p.b, days: p.b - p.a, label: tlBreakLabel(p.b - p.a) }); return; }
    const ppd = (p.x1 - p.x0) / ((p.b - p.a) || 1);
    const step = [1, 3, 6, 12, 24, 60].find(st => st * 30.44 * ppd >= minTickGap) || 120;
    let y = +start.slice(0, 4), m = +start.slice(5, 7) - (+start.slice(8, 10) > 1 ? 0 : 1);
    for (let g = 0; g < 2000; g++) {
      m++;
      if (m > 11) { m = 0; y++; }
      const iso = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      const o = daysBetween(todayIso, iso);
      if (o > p.b) break;
      if (o < p.a || (y * 12 + m) % step !== 0) continue;
      const x = x0 + zone.f(o);
      rawTicks.push(x);
      if (step >= 12 && m === 0) cand.push({ x, text: String(y), prio: 2 });
    }
  });
  rawTicks.sort((a, b) => a - b).forEach(x => { if (!out.ticks.length || x - out.ticks[out.ticks.length - 1].x >= minTickGap) out.ticks.push({ x }); });
  /* rótulos: os de início de trecho primeiro; nenhum por cima de outro nem para fora da zona */
  const taken = [];
  cand.sort((a, b) => a.prio - b.prio || a.x - b.x).forEach(c => {
    const w = tlEstimateWidth(c.text, 11) + 8;
    if (c.x + w > x0 + zone.px + 1 && c.prio !== 0) return;
    if (taken.every(t => c.x + w + 2 <= t[0] || c.x >= t[1] + 2)) { taken.push([c.x, c.x + w]); out.labels.push({ x: c.x, text: c.text }); }
  });
  out.labels.sort((a, b) => a.x - b.x);
  return out;
}

/* ═════════════ Miniaturas (M6) ═════════════ */
/** Janela do pulso da Carteira: 30 dias para trás e 90 para a frente (120 dias). */
export const TL_PULSE_FROM = -30;
export const TL_PULSE_TO = 90;
const PULSE_ACT = new Set(['prazo', 'aud', 'tar']);

/**
 * Pulso de uma operação: pontos (prazos, audiências, tarefas, decisões e termos) na janela [from, to] em dias a partir
 * de hoje, empilhados quando caem no mesmo dia (`lvl` 0, 1, 2…), com marcas de segunda-feira e de início de mês e a faixa
 * dos próximos 7 dias. items: [{ id, kind, d }]. Retorna { width, X0, X1, x(o), today, next7: { x0, x1 }, ticks, points, hidden }
 * — `hidden` conta o que ficou fora da janela (a tela avisa com o selo de termo).
 */
export function tlPulseLayout(items, { todayIso, from = TL_PULSE_FROM, to = TL_PULSE_TO, width = 380, pad = 10 } = {}) {
  const X0 = pad, X1 = width - pad;
  const x = (o) => X0 + (o - from) / (to - from) * (X1 - X0);
  const ticks = [];
  for (let o = from; o <= to; o++) {
    const iso = addCalendarDays(todayIso, o);
    const dow = new Date(iso + 'T00:00:00').getDay();
    const dd = +iso.slice(8, 10);
    if (dd === 1) ticks.push({ o, x: x(o), type: 'month', label: TL_MES[+iso.slice(5, 7) - 1] });
    else if (dow === 1) ticks.push({ o, x: x(o), type: 'week', label: '' });
  }
  const seen = new Map();
  const points = [];
  let hidden = 0;
  (items || []).filter(it => it && toDayKey(it.d)).map((it, i) => ({ it, i, o: daysBetween(todayIso, toDayKey(it.d)) }))
    .sort((a, b) => a.o - b.o || a.i - b.i)
    .forEach(({ it, o }) => {
      if (o < from || o > to) { hidden++; return; }
      const lvl = seen.get(o) || 0;
      seen.set(o, lvl + 1);
      points.push({ id: it.id, kind: it.kind, o, x: x(o), lvl });
    });
  return { width, X0, X1, x, today: x(0), next7: { x0: x(0), x1: x(Math.min(to, 7)) }, ticks, points, hidden, from, to };
}

/**
 * Frase do pulso: o próximo prazo/audiência/tarefa (a data e a hora, em dias), quantos vencidos, quantos nos próximos
 * 7 dias e o próximo termo de prescrição (com "+N" se houver mais). items: [{ id, kind, d, tm?, title }] — todos os
 * fatos da operação, não só os da janela (o termo pode estar a anos). Retorna { next, late, in7, term }.
 */
export function tlPulseSummary(items, todayIso) {
  const rows = (items || []).filter(it => it && toDayKey(it.d)).map(it => ({ ...it, o: daysBetween(todayIso, toDayKey(it.d)) }));
  const act = rows.filter(r => PULSE_ACT.has(r.kind));
  const up = act.filter(r => r.o >= 0).sort((a, b) => a.o - b.o || String(a.tm || '').localeCompare(String(b.tm || '')) || String(a.id).localeCompare(String(b.id)));
  const terms = rows.filter(r => r.kind === 'presc' && r.o >= 0).sort((a, b) => a.o - b.o);
  return {
    next: up[0] ? { id: up[0].id, kind: up[0].kind, d: up[0].d, o: up[0].o, tm: up[0].tm || '', title: up[0].title || '' } : null,
    late: act.filter(r => r.o < 0 && r.kind !== 'aud').length,
    in7: up.filter(r => r.o <= 7).length,
    term: terms.length ? { d: terms[0].d, o: terms[0].o, extra: terms.length - 1 } : null,
  };
}

/**
 * Trilha de fases de um processo, na ordem do tipo de processo (IDPJ/MCF ou central). stages: [{ key, label, has, multi,
 * d, out, outLabel, text, ev, recursos: [{ d, out, outLabel, parte, texto, proc }] }]; hearings: [{ d, tm, label }]
 * futuras do processo. Cada passo: { id, key, label, state, d, tm, out, outLabel, text, ev, gap, hearing, parte }
 *   state: 'done' (registrada, até hoje) · 'cur' (a última registrada: "onde estamos") · 'next' (esperada: sem registro,
 *          registrada com data futura, ou registrada sem data nem desfecho depois da última fase datada) ·
 *          'skip' (sem registro, mas já passou: uma fase seguinte foi cumprida).
 * `gap` = dias desde a fase datada anterior (só quando positivo). Uma audiência futura do processo dá data à fase
 * "audiencia" ainda sem registro. Retorna { steps, done, total, curIndex }.
 */
export function tlPhaseTrail({ stages, hearings, todayIso } = {}) {
  const today = toDayKey(todayIso);
  const raw = [];
  (stages || []).forEach(st => {
    if (!st) return;
    if (st.multi && st.has && (st.recursos || []).length) {
      st.recursos.forEach((r, i) => raw.push({ id: st.key + '#' + i, key: st.key, label: st.label + (r.parte === 'adversa' ? ' (parte adversa)' : ''), has: true, d: toDayKey(r.d) || '', out: r.out || '', outLabel: r.outLabel || '', text: [r.proc ? 'Proc. ' + r.proc : '', r.texto || ''].filter(Boolean).join(' · '), ev: '', parte: r.parte || '' }));
    } else raw.push({ id: st.key, key: st.key, label: st.label, has: !!st.has, d: toDayKey(st.d) || '', out: st.out || '', outLabel: st.outLabel || '', text: st.text || '', textHtml: st.textHtml || '', ev: st.ev || '', parte: '' });
  });
  const lastDoneIdx = (() => { let k = -1; raw.forEach((r, i) => { if (r.has && (!r.d || r.d <= today)) k = i; }); return k; })();
  /* Registro sem data e sem desfecho depois da última fase datada = o que se espera ("Decisão final — aguardando…"). */
  const lastDatedIdx = (() => { let k = -1; raw.forEach((r, i) => { if (r.has && r.d && r.d <= today) k = i; }); return k; })();
  const hear = (hearings || []).filter(h => h && toDayKey(h.d) && toDayKey(h.d) >= today).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const steps = raw.map((r, i) => {
    const base = { ...r, tm: '', hearing: false, gap: null };
    if (r.has) {
      if (r.d) return { ...base, state: r.d <= today ? 'done' : 'next' };
      return { ...base, state: !r.out && lastDatedIdx >= 0 && i > lastDatedIdx ? 'next' : 'done' };
    }
    if (r.key === 'audiencia' && hear[0]) return { ...base, state: 'next', d: toDayKey(hear[0].d), tm: hear[0].tm || '', hearing: true, label: hear[0].label || r.label };
    return { ...base, state: i < lastDoneIdx ? 'skip' : 'next' };
  });
  /* "cur" = a fase registrada mais recente (maior data; no empate, a última da ordem) */
  let cur = -1, bestD = '';
  steps.forEach((s, i) => { if (s.state === 'done' && (cur < 0 || s.d >= bestD)) { cur = i; bestD = s.d; } });
  if (cur >= 0) steps[cur].state = 'cur';
  let prev = '';
  steps.forEach(s => {
    if ((s.state === 'done' || s.state === 'cur') && s.d) {
      if (prev) { const g = daysBetween(prev, s.d); if (g > 0) s.gap = g; }
      prev = s.d;
    }
  });
  const done = steps.filter(s => s.state === 'done' || s.state === 'cur').length;
  return { steps, done, total: steps.length, curIndex: cur };
}

/**
 * Trilha curta ("você está aqui") para a gaveta da intimação: até 3 fases cumpridas (as mais recentes), o prazo desta
 * intimação, a próxima coisa com data (audiência) e a próxima fase esperada (tracejada). `trail` vem de tlPhaseTrail;
 * `you` = { d, label, late }. Retorna [{ k: 'done'|'you'|'future'|'ghost', label, d, tm, out, hearing }] com no máximo `max`.
 */
export function tlMiniTrail(trail, you, { max = 6 } = {}) {
  const steps = (trail && trail.steps) || [];
  const past = steps.filter(s => (s.state === 'done' || s.state === 'cur') && s.d).slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const futureDated = steps.filter(s => s.state === 'next' && s.d).slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const ghost = past.length ? steps.find(s => s.state === 'next' && !s.d) : null; // sem fase cumprida, "a próxima fase" não quer dizer nada
  const tail = [];
  if (futureDated[0]) tail.push({ k: 'future', label: futureDated[0].label, d: futureDated[0].d, tm: futureDated[0].tm, out: futureDated[0].out, hearing: !!futureDated[0].hearing });
  if (ghost) tail.push({ k: 'ghost', label: ghost.label, d: '', tm: '', out: '', hearing: false });
  const keep = Math.max(0, max - 1 - tail.length);
  const head = past.slice(Math.max(0, past.length - Math.min(3, keep))).map(s => ({ k: 'done', label: s.label, d: s.d, tm: '', out: s.out, hearing: false }));
  return head.concat([{ k: 'you', label: (you && you.label) || 'Este prazo', d: (you && you.d) || '', tm: '', out: '', hearing: false, late: !!(you && you.late) }], tail).slice(0, max);
}
