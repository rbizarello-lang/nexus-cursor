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
 */
import { daysBetween } from './dates.js';

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
