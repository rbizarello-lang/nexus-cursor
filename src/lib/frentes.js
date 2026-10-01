/**
 * Mapa de frentes e dependências (M3 da Linha do tempo do Nexus Prumo, estilo metrô) — funções puras, sem DOM nem React.
 *
 * "O que depende de quê?" Uma raia por processo (IDPJ, MCF, EF principal, EF apensa, exceção, agravo…) e uma raia para as
 * CDAs sem processo; eixo ORDINAL — cada coluna é um acontecimento, na ordem das datas, e a data vai no rótulo (a distância
 * entre colunas não vale tempo). Setas: efeito (algo que já aconteceu e produz consequência em outro processo) e
 * condição (algo esperado que depende de uma decisão ainda por vir).
 *
 * Nada aqui inventa dado. A tela entrega fatos que o app já tem; as ligações saem dos campos que já existem:
 *  - `parentExecutionId` (apenso, exceção, recurso, embargos) → seta de ORIGEM (do último fato do processo-pai até o
 *    primeiro fato do filho);
 *  - `linkedExecutionIds` (IDPJ/MCF "cobre" a execução) → seta de EFEITO: liminar ou decisão final FAVORÁVEL do incidente
 *    (registro de fase com `outcome: 'favoravel'`) vira uma estação derivada (vazada) na execução coberta, na mesma coluna;
 *    sem efeito derivável, uma seta tracejada "cobre" liga o incidente à execução;
 *  - estações FANTASMA (tracejadas, sem data) só onde o dado as sustenta: IDPJ/MCF ativo sem decisão final com desfecho
 *    registrado → "Decisão final"; recurso com desfecho `pendente` → "Julgamento do recurso"; e, para cada execução ativa
 *    coberta por um IDPJ ainda sem decisão, "Pedir redirecionamento" ligado por seta condicional ("se procedente").
 *    Não há data esperada para nenhuma delas: ficam depois de "hoje", em coluna própria.
 *
 * Entradas:
 *  lanes  : [{ id, kind: 'proc' | 'cda', incident?: 'idpj' | 'mcf', closed?: bool, name?: 'IDPJ 5009876-11', … }] na ordem da tela
 *           (campos extras passam adiante); `id` do processo = id da execução.
 *  events : [{ id, lane, d (ISO), tm?, kind: dec|and|aud|prazo|presc|cda, label, sk? (chave da fase), out? (desfecho),
 *             open? (aguarda providência), late?, … }] — só os datados entram.
 *  links  : [{ type: 'cover' | 'parent', a, b, label? }] entre ids de raia (cover: a cobre b; parent: a é pai de b).
 */
import { toDayKey, localIso } from './dates.js';

export const FRENTES_EDGE_TYPES = ['lane', 'flow', 'eff', 'cond', 'cover'];
export const FRENTES_EDGE_LABEL = {
  lane: 'Sequência no processo',
  flow: 'Origem (apenso, exceção, recurso)',
  eff: 'Efeito já ocorrido',
  cond: 'Condicional',
  cover: 'Cobertura (IDPJ/MCF)',
};
/** Estação derivada na execução coberta, por fase favorável do incidente (chave da fase → rótulo). */
export const FRENTES_EFFECT = { liminar: 'Efeito da liminar', decisao: 'Efeito da decisão' };
const FR_RECURSO_KEYS = new Set(['recurso', 'recurso1', 'recurso2']);
const FR_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const frDmy = (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '');
const frDmyFull = (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '');

/** A operação tem frentes para mapear? IDPJ/MCF, ou ao menos um vínculo (cobre, apenso, exceção, recurso). */
export function frentesHasFronts({ lanes, links } = {}) {
  return (lanes || []).some(l => l && l.incident) || (links || []).length > 0;
}

/** Rótulos de cabeçalho das colunas: mês (só quando muda) e dia/mês; fantasma não tem data. */
export function frentesColumnLabels(graph) {
  let last = '';
  return (graph && graph.cols ? graph.cols : []).map(c => {
    if (!c.d) return { index: c.index, top: '', bottom: '' };
    const m = FR_MES[+c.d.slice(5, 7) - 1] + ' ' + c.d.slice(2, 4);
    const top = m !== last ? m : '';
    last = m;
    return { index: c.index, top, bottom: frDmy(c.d) };
  });
}

/**
 * Monta o grafo. Devolve { lanes (com `nodes`), nodes, edges, cols, byId, out, inn, todayCol, today, hasFronts }.
 * Cada nó: { id, lane, col, d, tm, kind, label, ghost, derived, open, late, note?, … } (mais o que veio no evento).
 * Cada aresta: { id, a, b, type: lane|flow|eff|cond|cover, label, ghost, dep }.
 */
export function buildFrentesGraph({ lanes = [], events = [], links = [], todayIso } = {}) {
  const today = toDayKey(todayIso) || localIso(new Date());
  const laneList = (lanes || []).filter(Boolean);
  const laneById = new Map(laneList.map(l => [l.id, l]));
  const laneOrder = new Map(laneList.map((l, i) => [l.id, i]));
  const nodes = [];
  const byId = new Map();
  const cols = []; // { d, tm, lanes: Set, ids: [] }
  const edges = [];
  const addNode = (n) => { nodes.push(n); byId.set(n.id, n); return n; };
  const colIdx = (c) => cols.indexOf(c);
  const newCol = (d, tm, at) => {
    const c = { d: d || '', tm: tm || '', lanes: new Set(), ids: [] };
    if (at == null) cols.push(c); else cols.splice(at, 0, c);
    return c;
  };
  const put = (n, col) => { n._col = col; col.lanes.add(n.lane); col.ids.push(n.id); };
  const laneNodes = (laneId) => nodes.filter(n => n.lane === laneId).sort((a, b) => colIdx(a._col) - colIdx(b._col));

  /* 1. Estações reais: uma coluna cada; o mesmo dia e hora em raias diferentes divide a coluna. */
  const real = (events || [])
    .filter(e => e && laneById.has(e.lane) && toDayKey(e.d))
    .map((e, i) => ({ ...e, d: toDayKey(e.d), tm: e.tm || '', _i: i }))
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.tm).localeCompare(String(b.tm)) || a._i - b._i));
  real.forEach(e => {
    const { _i, ...rest } = e;
    const n = addNode({ ghost: false, derived: false, open: false, late: false, ...rest });
    const last = cols[cols.length - 1];
    if (last && last.d === n.d && last.tm === n.tm && !last.lanes.has(n.lane)) put(n, last);
    else put(n, newCol(n.d, n.tm));
  });

  const closed = (laneId) => !!(laneById.get(laneId) || {}).closed;
  const nameOf = (laneId) => { const l = laneById.get(laneId) || {}; return l.name || l.title || l.id || ''; };
  const covers = (links || []).filter(l => l && l.type === 'cover' && laneById.has(l.a) && laneById.has(l.b));
  const parents = (links || []).filter(l => l && l.type === 'parent' && laneById.has(l.a) && laneById.has(l.b));
  const addEdge = (a, b, type, label, extra) => {
    const id = 'ed|' + type + '|' + a + '|' + b;
    if (edges.some(e => e.id === id)) return null;
    const e = { id, a, b, type, label: label || '', ghost: false, dep: true, ...(extra || {}) };
    edges.push(e);
    return e;
  };

  /* 2. Efeitos: liminar ou decisão FAVORÁVEL do incidente alcança a execução coberta (estação derivada, mesma coluna). */
  const effectPairs = new Set();
  covers.forEach(l => {
    if (closed(l.b)) return;
    nodes.filter(n => n.lane === l.a && !n.ghost && !n.derived && FRENTES_EFFECT[n.sk] && n.out === 'favoravel').forEach(src => {
      const id = 'fx|' + src.id + '|' + l.b;
      if (byId.has(id)) return;
      const lb = laneById.get(l.b) || {};
      const n = addNode({
        id, lane: l.b, d: src.d, tm: src.tm, kind: 'and', label: FRENTES_EFFECT[src.sk], short: FRENTES_EFFECT[src.sk],
        derived: true, ghost: false, open: false, late: false, color: 'var(--cx-green)', ref: lb.execId ? { t: 'exec', id: lb.execId } : null,
        note: 'Derivado do vínculo "cobre": ' + nameOf(l.a) + ' (' + (src.label || 'fase') + ', ' + frDmyFull(src.d) + ') alcança ' + nameOf(l.b) + '. Não é um fato registrado nesta execução.',
        from: src.id,
      });
      const sc = src._col;
      if (!sc.lanes.has(l.b)) put(n, sc); else put(n, newCol(src.d, src.tm, colIdx(sc) + 1));
      addEdge(src.id, id, 'eff', '');
      effectPairs.add(l.a + '>' + l.b);
    });
  });

  /* 3. Fantasmas: o que o dado deixa esperar, sem data. Entram depois de "hoje", em coluna própria. */
  const lastPastIdx = () => { let k = -1; cols.forEach((c, i) => { if (c.d && c.d <= today) k = i; }); return k; };
  const ghostCols = new Map(); // coluna-âncora → coluna fantasma logo depois dela
  const placeGhost = (g, extraAnchors, alsoLanes) => {
    let anchor = lastPastIdx();
    // Raia do próprio fantasma: depois de tudo o que já está nela (inclusive outro fantasma); raias irmãs: só os fatos reais.
    const own = laneNodes(g.lane);
    if (own.length) anchor = Math.max(anchor, colIdx(own[own.length - 1]._col));
    (alsoLanes || []).forEach(id => {
      const ln = laneNodes(id).filter(n => !n.ghost);
      if (ln.length) anchor = Math.max(anchor, colIdx(ln[ln.length - 1]._col));
    });
    (extraAnchors || []).forEach(id => { const n = byId.get(id); if (n) anchor = Math.max(anchor, colIdx(n._col)); });
    const anchorCol = anchor >= 0 ? cols[anchor] : null;
    let gc = anchorCol ? ghostCols.get(anchorCol) : null;
    if (gc && !gc.lanes.has(g.lane) && cols.includes(gc)) { put(g, gc); return; }
    const at = (gc && cols.includes(gc) ? colIdx(gc) : anchor) + 1;
    gc = newCol('', '', at);
    if (anchorCol) ghostCols.set(anchorCol, gc);
    put(g, gc);
  };
  const ghost = (id, lane, kind, label, note, extra) => {
    const l = laneById.get(lane) || {};
    return addNode({ id, lane, d: '', tm: '', kind, label, short: label, ghost: true, derived: false, open: true, late: false, note, ref: l.execId ? { t: 'exec', id: l.execId } : null, ...(extra || {}) });
  };
  // 3a. Decisão final de IDPJ/MCF ativo ainda sem desfecho registrado.
  const decisionGhost = new Map(); // lane → id
  laneList.forEach(l => {
    if (!l.incident || l.closed) return;
    const decided = nodes.some(n => n.lane === l.id && n.sk === 'decisao' && (n.out === 'favoravel' || n.out === 'desfavoravel'));
    if (decided) return;
    const what = l.incident === 'idpj' ? 'IDPJ' : 'MCF';
    const g = ghost('gh|dec|' + l.id, l.id, 'dec', 'Decisão final do ' + what,
      'Esperada: ainda não há decisão final com desfecho registrada em ' + nameOf(l.id) + '. Sem data.');
    placeGhost(g);
    decisionGhost.set(l.id, g.id);
  });
  // 3b. Recurso pendente de julgamento.
  nodes.filter(n => !n.ghost && !n.derived && FR_RECURSO_KEYS.has(n.sk) && n.out === 'pendente' && !closed(n.lane)).forEach(n => {
    const g = ghost('gh|rec|' + n.id, n.lane, 'dec', 'Julgamento do recurso',
      'Esperado: o recurso de ' + frDmyFull(n.d) + ' em ' + nameOf(n.lane) + ' consta como pendente de julgamento. Sem data.');
    placeGhost(g);
  });
  // 3c. Redirecionamento nas execuções cobertas por IDPJ ainda sem decisão: depende de a decisão ser procedente.
  const condFirst = new Set();
  const redLanes = (a) => covers.filter(c => c.a === a && !closed(c.b)).map(c => c.b);
  covers.forEach(l => {
    const dg = decisionGhost.get(l.a);
    if (!dg || (laneById.get(l.a) || {}).incident !== 'idpj' || closed(l.b)) return;
    const g = ghost('gh|red|' + l.a + '|' + l.b, l.b, 'and', 'Pedir redirecionamento',
      'Condicional: se o ' + nameOf(l.a) + ' for julgado procedente, pedir o redirecionamento em ' + nameOf(l.b) + '. Sem data.',
      { laneDep: false });
    placeGhost(g, [dg], redLanes(l.a)); // todas as execuções cobertas na mesma coluna
    addEdge(dg, g.id, 'cond', condFirst.has(dg) ? '' : 'se procedente');
    condFirst.add(dg);
  });

  /* Índices finais das colunas. */
  const colList = cols.map((c, i) => ({ index: i, d: c.d, tm: c.tm, ghost: !c.d, ids: c.ids.slice() }));
  nodes.forEach(n => { n.col = colIdx(n._col); delete n._col; });
  const todayCol = (() => { const i = colList.findIndex(c => c.ghost || c.d >= today); return i < 0 ? colList.length : i; })();

  /* 4. Sequência dentro de cada raia (e a raia de CDAs). */
  laneList.forEach(l => {
    const ln = nodes.filter(n => n.lane === l.id).sort((a, b) => a.col - b.col);
    for (let i = 1; i < ln.length; i++) {
      const e = addEdge(ln[i - 1].id, ln[i].id, 'lane', '', { ghost: ln[i].ghost });
      if (e && ln[i].ghost && ln[i].laneDep === false) e.dep = false;
    }
  });

  /* 5. Origem: do último fato do processo-pai (até o primeiro do filho) ao primeiro fato do filho. */
  parents.forEach(l => {
    const child = nodes.filter(n => n.lane === l.b && !n.ghost).sort((a, b) => a.col - b.col)[0];
    if (!child) return;
    const pred = nodes.filter(n => n.lane === l.a && !n.ghost && !n.derived && n.col <= child.col).sort((a, b) => b.col - a.col)[0];
    if (pred) addEdge(pred.id, child.id, 'flow', l.label || '');
  });

  /* 6. Cobertura sem efeito derivável: seta tracejada do primeiro fato do incidente ao primeiro da execução depois dele. */
  covers.forEach(l => {
    if (effectPairs.has(l.a + '>' + l.b)) return;
    const src = nodes.filter(n => n.lane === l.a && !n.ghost).sort((a, b) => a.col - b.col)[0];
    if (!src) return;
    const tgt = nodes.filter(n => n.lane === l.b && !n.ghost && n.col > src.col).sort((a, b) => a.col - b.col)[0];
    if (tgt) addEdge(src.id, tgt.id, 'cover', 'cobre');
  });

  const out = {}, inn = {};
  edges.forEach(e => { (out[e.a] = out[e.a] || []).push(e); (inn[e.b] = inn[e.b] || []).push(e); });
  const lanesOut = laneList.map(l => ({ ...l, nodes: nodes.filter(n => n.lane === l.id).sort((a, b) => a.col - b.col).map(n => n.id) }));
  return { lanes: lanesOut, nodes, edges, cols: colList, byId, out, inn, todayCol, today, hasFronts: frentesHasFronts({ lanes: laneList, links }) };
}

const frWalk = (start, adj, pick, onlyDep) => {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const x = q.shift();
    (adj[x] || []).forEach(e => {
      if (onlyDep && e.dep === false) return;
      const y = pick(e);
      if (!seen.has(y)) { seen.add(y); q.push(y); }
    });
  }
  return seen;
};
/** Tudo o que originou a estação (a montante), incluindo ela mesma. */
export function frentesUpstream(graph, id, onlyDep = false) { return frWalk(id, graph.inn, e => e.a, onlyDep); }
/** Tudo o que a estação destrava (a jusante), incluindo ela mesma. */
export function frentesDownstream(graph, id, onlyDep = false) { return frWalk(id, graph.out, e => e.b, onlyDep); }
/** A cadeia inteira de uma estação: montante e jusante (o que se realça ao passar o mouse). */
export function frentesChain(graph, id) {
  if (!graph || !graph.byId.has(id)) return new Set();
  const s = frentesUpstream(graph, id);
  frentesDownstream(graph, id).forEach(x => s.add(x));
  return s;
}

/** Providência ainda em aberto: fantasma, ou prazo/audiência/CDA marcados como `open` que vencem hoje ou depois (ou já vencidos). */
function frIsOpenNode(n, today) {
  if (n.ghost) return true;
  if (!n.open) return false;
  return !!n.late || !n.d || n.d >= today;
}

/**
 * Caminho crítico: o que ainda precisa acontecer, em ordem, até o que está por decidir. Parte das estações FANTASMA (a
 * decisão esperada e o que depende dela) e junta, a montante, só o que está EM ABERTO (prazo, audiência, CDA a ajuizar —
 * o que já aconteceu fica de fora). Sem estação esperada não há "o que está por decidir": o caminho fica vazio (prazos e
 * audiências soltos são agenda, não caminho). Devolve { ids (ordem: coluna, raia), set, targets }.
 */
export function frentesCriticalPath(graph, todayIso) {
  const today = toDayKey(todayIso) || (graph && graph.today) || localIso(new Date());
  const empty = { ids: [], set: new Set(), targets: [] };
  if (!graph) return empty;
  const laneIdx = new Map((graph.lanes || []).map((l, i) => [l.id, i]));
  const seeds = graph.nodes.filter(n => n.ghost);
  if (!seeds.length) return empty;
  const set = new Set();
  seeds.forEach(s => {
    set.add(s.id);
    frentesUpstream(graph, s.id, true).forEach(id => { const n = graph.byId.get(id); if (n && frIsOpenNode(n, today)) set.add(id); });
  });
  const ids = Array.from(set).sort((a, b) => {
    const A = graph.byId.get(a), B = graph.byId.get(b);
    return A.col - B.col || (laneIdx.get(A.lane) || 0) - (laneIdx.get(B.lane) || 0);
  });
  return { ids, set, targets: seeds.map(s => s.id) };
}
