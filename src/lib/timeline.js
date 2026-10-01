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
 *    quebrado — o foco (30 d … 1 ano) em escala linear e o passado/futuro comprimidos nas laterais, com vãos
 *    longos sem fato viram quebras hachuradas ("≈ 13 m") —, `tlFocusAxis`/`tlZoneTicks` geram as marcas do eixo,
 *    `tlNormalizeFocus` protege o estado lembrado no navegador.
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

/**
 * Comprime o trecho [a, b] (dias) em `px` pixels. Cada ponto de interesse mantém uma janela de ±`win` dias em escala
 * (uniforme entre as janelas); o que sobra entre elas e tem `minGap` dias ou mais vira uma quebra de largura fixa
 * (`breakW`); vãos menores são só espremidos. Retorna { f, pieces, px, a, b }; f(dia) → x dentro da zona.
 */
export function tlCompressZone(a, b, px, points, opts = {}) {
  const win = opts.win == null ? 22 : opts.win;
  const minGap = opts.minGap == null ? 60 : opts.minGap;
  const breakW = opts.breakW == null ? 26 : opts.breakW;
  const wins = [];
  (points || []).filter(p => Number.isFinite(p) && p >= a - 1 && p <= b + 1).sort((x, y) => x - y).forEach(p => {
    const s0 = Math.max(a, p - win), e0 = Math.min(b, p + win);
    if (wins.length && s0 <= wins[wins.length - 1][1] + 1) wins[wins.length - 1][1] = Math.max(wins[wins.length - 1][1], e0);
    else wins.push([s0, e0]);
  });
  const pieces = [];
  let cur = a;
  wins.forEach(([s0, e0]) => {
    if (s0 > cur) pieces.push({ a: cur, b: s0, gap: s0 - cur >= minGap });
    pieces.push({ a: s0, b: e0, gap: false });
    cur = e0;
  });
  if (cur < b) pieces.push({ a: cur, b, gap: b - cur >= minGap });
  const nb = pieces.filter(p => p.gap).length;
  const nd = pieces.filter(p => !p.gap).reduce((t, p) => t + (p.b - p.a), 0) || 1;
  const avail = Math.max(12, px - nb * breakW);
  let x = 0;
  pieces.forEach(p => { p.x0 = x; p.x1 = x + (p.gap ? breakW : (p.b - p.a) / nd * avail); x = p.x1; });
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
export function tlProjectBroken({ points, f0, f1, width, pastFrac = 0.17, futFrac = 0.2, pad = 4 }) {
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
 * Marcas de uma zona comprimida: um traço por início de mês dentro dos trechos em escala, rótulo "mmm aa" no início
 * de cada trecho largo o bastante (ou do primeiro do passado) e as quebras com o tamanho do vão.
 * `x0` é o deslocamento da zona no canvas. Retorna { ticks, labels, breaks }.
 */
export function tlZoneTicks(zone, x0, todayIso, opts = {}) {
  const out = { ticks: [], labels: [], breaks: [] };
  if (!zone) return out;
  const minLabelW = opts.minLabelW == null ? 30 : opts.minLabelW;
  let firstScaled = true;
  zone.pieces.forEach(p => {
    if (p.gap) { out.breaks.push({ x0: x0 + p.x0, x1: x0 + p.x1, days: p.b - p.a, label: tlBreakLabel(p.b - p.a) }); return; }
    const start = addCalendarDays(todayIso, Math.ceil(p.a));
    if (p.x1 - p.x0 >= minLabelW || (opts.labelFirst && firstScaled)) {
      out.labels.push({ x: x0 + p.x0, text: TL_MES[+start.slice(5, 7) - 1] + ' ' + start.slice(2, 4) });
    }
    firstScaled = false;
    let y = +start.slice(0, 4), m = +start.slice(5, 7) - (+start.slice(8, 10) > 1 ? 0 : 1);
    for (let g = 0; g < 400; g++) {
      m++;
      if (m > 11) { m = 0; y++; }
      const iso = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      const o = daysBetween(todayIso, iso);
      if (o > p.b) break;
      if (o >= p.a) out.ticks.push({ x: x0 + zone.f(o), o });
    }
  });
  return out;
}
