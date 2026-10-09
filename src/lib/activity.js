/**
 * Registro de trabalho ("Minha atividade") — funções puras, sem DOM, React nem I/O.
 *
 * Fluxo: `diffForActivity(prev, next)` compara dois estados do app por referência e devolve as
 * mudanças cruas; `interpretActivity(raw, ctx)` transforma isso em eventos legíveis (com antes/depois
 * completos para restaurar); `coalesceOutbox(events)` junta ajustes repetidos antes do envio.
 * Nenhuma função altera os objetos recebidos.
 *
 * Convenções:
 *  - item/coleção sem mudança mantém a mesma referência (upsert imutável do app) → pula sem comparar;
 *  - um salvamento sem mudança real (só `updatedAt` novo) não gera mudança;
 *  - vazio é vazio: null, undefined, '' e [] são tratados como iguais (formulário que troca
 *    "ausente" por '' não cria evento);
 *  - briefing e links têm comparadores próprios (caminho no campo `f`, ex. `briefing.entries[id].html`).
 */

/** Coleções rastreadas (desk, models, importLogs, changeLog e calendar ficam de fora). */
export const TRACKED_COLLECTIONS = [
  'operations', 'people', 'debts', 'executions', 'measures', 'assets', 'documents',
  'prescriptionEvents', 'intimations', 'tasks', 'stickyNotes', 'watchlist', 'hearings',
];
const LINK_LISTS = ['measurePeople', 'measureAssets', 'cdaResponsibilities'];
const IGNORED_FIELDS = new Set(['updatedAt', 'createdAt', 'lastAccessed', 'prescriptionSnapshot', 'seen']);
const MAX_TEXT = 200 * 1024; // limite por texto guardado no evento
const MAX_DETAILS = 2000; // linhas de detalhe de uma importação
const MAX_CREATES = 200; // criações num commit sem contexto de lote → evento de sistema

const isIgnored = (f) => IGNORED_FIELDS.has(f) || f.charCodeAt(0) === 95; // '_'
const actIsEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

function deepEqual(a, b) {
  if (a === b) return true;
  if (actIsEmpty(a) && actIsEmpty(b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) return false;
  const aa = Array.isArray(a);
  if (aa !== Array.isArray(b)) return false;
  if (aa) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  for (const k in a) {
    if (isIgnored(k)) continue;
    if (!deepEqual(a[k], b[k])) return false;
  }
  for (const k in b) {
    if (isIgnored(k) || k in a) continue;
    if (!actIsEmpty(b[k])) return false;
  }
  return true;
}

// ─── Diff cru ───────────────────────────────────────────────────────────────────────────────

/** Compara dois itens e devolve os campos alterados `[{f, from, to}]` (sem os ignorados). */
function diffFields(a, b, skip) {
  const out = [];
  for (const k in a) {
    if (isIgnored(k) || (skip && skip.has(k))) continue;
    if (!deepEqual(a[k], b[k])) out.push({ f: k, from: a[k], to: b[k] });
  }
  for (const k in b) {
    if (k in a || isIgnored(k) || (skip && skip.has(k))) continue;
    if (!actIsEmpty(b[k])) out.push({ f: k, from: undefined, to: b[k] });
  }
  return out;
}

const byId = (arr) => {
  const m = new Map();
  for (const x of arr) if (x && x.id != null) m.set(x.id, x);
  return m;
};

/**
 * Compara duas listas de itens com `id`. Caminho rápido: mesma posição + mesmo id; só monta mapas
 * se a lista foi reordenada/inserida/removida. Chama `onPair(prevItem|undefined, nextItem|undefined)`
 * para cada par com referência diferente.
 */
function walkList(a, b, onPair) {
  a = Array.isArray(a) ? a : [];
  b = Array.isArray(b) ? b : [];
  if (a === b) return;
  let aligned = a.length === b.length;
  if (aligned) {
    for (let i = 0; i < b.length; i++) {
      const x = a[i], y = b[i];
      if (x === y) continue;
      if (!x || !y || x.id !== y.id) { aligned = false; break; }
    }
  }
  if (aligned) {
    for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) onPair(a[i], b[i]);
    return;
  }
  const ma = byId(a), mb = byId(b);
  for (const [id, y] of mb) {
    const x = ma.get(id);
    if (x !== y) onPair(x, y);
  }
  for (const [id, x] of ma) if (!mb.has(id)) onPair(x, undefined);
}

const actPlain = (h) => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
/**
 * O diário converte entradas do formato antigo ({title, body}) para {type, html} ao salvar qualquer entrada.
 * Essa conversão não é edição: compara como se o antigo já estivesse no formato novo.
 */
function actNormEntryPair(x, y) {
  if (!x || !y) return [x, y];
  const nx = { ...x }, ny = { ...y };
  delete nx.migrated; delete ny.migrated;
  if (!x.html && x.body != null) {
    delete nx.body; delete nx.title; delete ny.body; delete ny.title;
    const bodyText = String(x.body).replace(/\s+/g, ' ').trim(); // body é texto puro: não remove "tags"
    nx.html = bodyText === actPlain(y.html) ? y.html : x.body;
    if (!x.type) nx.type = y.type;
  }
  return [nx, ny];
}

/** Comparador do briefing: diário por id da entrada, fases por execId/stageKey, demais chaves inteiras. */
function diffBriefing(a, b) {
  const out = [];
  a = a || {}; b = b || {};
  if (a === b) return out;
  // Primeira gravação do diário: anotações antigas por campo (risks, strategicNotes…) viram entradas legacy_*; não é criação.
  const firstSave = !Array.isArray(a.entries) && Array.isArray(b.entries);
  walkList(a.entries, b.entries, (x, y) => {
    const id = (x || y).id;
    if (!x && firstSave && /^legacy_/.test(String(id))) return;
    [x, y] = actNormEntryPair(x, y);
    if (!x) out.push({ f: `briefing.entries[${id}]`, from: undefined, to: y });
    else if (!y) out.push({ f: `briefing.entries[${id}]`, from: x, to: undefined });
    else for (const d of diffFields(x, y)) out.push({ f: `briefing.entries[${id}].${d.f}`, from: d.from, to: d.to });
  });
  const sa = a.processStageV2, sb = b.processStageV2;
  if (sa !== sb) {
    const A = sa || {}, B = sb || {};
    for (const ex of new Set([...Object.keys(A), ...Object.keys(B)])) {
      if (A[ex] === B[ex]) continue;
      const pa = A[ex] || {}, pb = B[ex] || {};
      for (const st of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
        if (pa[st] === pb[st] || deepEqual(pa[st], pb[st])) continue;
        out.push({ f: `briefing.processStageV2.${ex}.${st}`, from: pa[st], to: pb[st] });
      }
    }
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'entries' || k === 'processStageV2' || isIgnored(k)) continue;
    if (!deepEqual(a[k], b[k])) out.push({ f: `briefing.${k}`, from: a[k], to: b[k] });
  }
  return out;
}

const OP_SKIP = new Set(['briefing']);

/**
 * Diff cru entre dois estados. Cada mudança:
 * `{ op:'create'|'update'|'delete', col, id, before, after, fields:[{f,from,to}] }`
 * (before/after = item completo, ou null; links usam col `links.<lista>` e id = chave do par).
 */
export function diffForActivity(prev, next) {
  const out = [];
  prev = prev || {}; next = next || {};
  for (const col of TRACKED_COLLECTIONS) {
    if (prev[col] === next[col]) continue;
    walkList(prev[col], next[col], (x, y) => {
      if (!x) { out.push({ op: 'create', col, id: y.id, before: null, after: y, fields: [] }); return; }
      if (!y) { out.push({ op: 'delete', col, id: x.id, before: x, after: null, fields: [] }); return; }
      const fields = diffFields(x, y, col === 'operations' ? OP_SKIP : null);
      if (col === 'operations' && x.briefing !== y.briefing) fields.push(...diffBriefing(x.briefing, y.briefing));
      if (fields.length) out.push({ op: 'update', col, id: y.id, before: x, after: y, fields });
    });
  }
  const la = prev.links, lb = next.links;
  if (la !== lb) {
    for (const name of LINK_LISTS) {
      const A = (la && la[name]) || [], B = (lb && lb[name]) || [];
      if (A === B) continue;
      const col = 'links.' + name;
      if (name === 'cdaResponsibilities') {
        walkList(A, B, (x, y) => {
          if (!x) out.push({ op: 'create', col, id: y.id, before: null, after: y, fields: [] });
          else if (!y) out.push({ op: 'delete', col, id: x.id, before: x, after: null, fields: [] });
          else {
            const fields = diffFields(x, y);
            if (fields.length) out.push({ op: 'update', col, id: y.id, before: x, after: y, fields });
          }
        });
        continue;
      }
      const key = name === 'measurePeople' ? (l) => l.measureId + '|' + l.personId : (l) => l.measureId + '|' + l.assetId;
      const ma = new Map(A.map((l) => [key(l), l])), mb = new Map(B.map((l) => [key(l), l]));
      for (const [k, l] of mb) if (!ma.has(k)) out.push({ op: 'create', col, id: k, before: null, after: l, fields: [] });
      for (const [k, l] of ma) if (!mb.has(k)) out.push({ op: 'delete', col, id: k, before: l, after: null, fields: [] });
    }
  }
  return out;
}

/**
 * Junta mudanças cruas de vários commits (um escopo de lote) numa só por item: `before` do primeiro,
 * `after` do último, campos do primeiro `from` ao último `to`. Criado+excluído e ida-e-volta somem.
 */
export function mergeRaw(list) {
  const m = new Map();
  for (const r of list || []) {
    const k = r.col + '' + r.id;
    const cur = m.get(k);
    if (!cur) { m.set(k, { ...r, fields: r.fields.map((d) => ({ ...d })) }); continue; }
    cur.after = r.after;
    const fm = new Map(cur.fields.map((d) => [d.f, d]));
    for (const d of r.fields) { const e = fm.get(d.f); if (e) e.to = d.to; else fm.set(d.f, { ...d }); }
    cur.fields = [...fm.values()].filter((d) => !deepEqual(d.from, d.to));
  }
  const out = [];
  for (const r of m.values()) {
    const b = r.before, a = r.after;
    if (!b && !a) continue;
    r.op = !b ? 'create' : !a ? 'delete' : 'update';
    if (r.op !== 'update') r.fields = [];
    else if (!r.fields.length) { r.fields = diffFields(b, a); if (!r.fields.length) continue; }
    out.push(r);
  }
  return out;
}

// ─── Datas e ids ────────────────────────────────────────────────────────────────────────────

let _dayFmt = null;
/** Dia local (America/Sao_Paulo) de um instante ISO/ms: 'AAAA-MM-DD'. Não depende do fuso da máquina. */
export function dayKey(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  if (isNaN(d.getTime())) return '';
  if (!_dayFmt) _dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  return _dayFmt.format(d);
}

let _seq = 0;
/** Id ordenável no tempo e único entre máquinas: ev_<ms base36 (9)>_<aparelho>_<seq base36 (4)>. */
function newEventId(tsMs, device, tab) {
  _seq = (_seq + 1) % 1679616;
  const t = Math.max(0, Math.floor(tsMs)).toString(36).padStart(9, '0');
  const dev = (String(device || 'x').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'x')
    + String(tab || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4); // sufixo da aba: ids únicos entre abas da mesma máquina
  return `ev_${t}_${dev}_${_seq.toString(36).padStart(4, '0')}`;
}

// ─── Rótulos e textos ───────────────────────────────────────────────────────────────────────

const NOUN = {
  operations: 'a operação', people: 'a parte', debts: 'a CDA', executions: 'o processo', measures: 'a medida',
  assets: 'o bem', documents: 'o documento', prescriptionEvents: 'o evento de prescrição', intimations: 'a intimação',
  tasks: 'a tarefa', stickyNotes: 'o lembrete', watchlist: 'o item de acompanhamento', hearings: 'a audiência',
  'links.measurePeople': 'o vínculo medida-parte', 'links.measureAssets': 'o vínculo medida-bem',
  'links.cdaResponsibilities': 'a responsabilidade pela CDA',
};
const KIND = {
  operations: 'operacao', people: 'parte', debts: 'cda', executions: 'processo', measures: 'constricao', assets: 'bem',
  documents: 'documento', prescriptionEvents: 'prescricao', intimations: 'intimacao', tasks: 'tarefa',
  stickyNotes: 'lembrete', watchlist: 'acompanhamento', hearings: 'audiencia',
  'links.measurePeople': 'vinculo', 'links.measureAssets': 'vinculo', 'links.cdaResponsibilities': 'vinculo',
};
const FIELD_LABEL = {
  status: 'situação', value: 'valor', name: 'nome', title: 'título', dueDate: 'prazo', priority: 'prioridade',
  description: 'descrição', notesList: 'anotações', notes: 'observações', processNumber: 'nº do processo',
  cdaNumber: 'nº da CDA', dateDeadline: 'prazo final', content: 'texto', summary: 'resumo', pecaText: 'texto da peça',
  pecaUrl: 'link da peça', url: 'link', operationId: 'operação', personId: 'parte', holderId: 'titular', type: 'tipo',
  date: 'data', color: 'cor', tribute: 'tributo', court: 'vara/juízo', className: 'classe', processTag: 'etiqueta',
  responseAction: 'resposta', completedAt: 'conclusão', subtype: 'subtipo', registry: 'registro', role: 'papel',
  cpfCnpj: 'CPF/CNPJ', prescriptionDate: 'prescrição', hasGuarantee: 'garantia', proactiveActions: 'atuações proativas',
};
const TEXT_FIELDS = new Set(['html', 'notesList', 'notes', 'description', 'content', 'summary', 'pecaText', 'texto', 'body', 'observacao', 'observacoes', 'obs']);
const SIGNIFICANT = new Set(['status', 'value', 'dueDate', 'dateDeadline', 'responseAction', 'completedAt', 'outcome', 'personId', 'processNumber', 'cdaNumber', 'proactiveActions']);
const MAIN_EDIT_SKIP_MINOR = new Set(['documents', 'prescriptionEvents', 'stickyNotes']);

const lastSeg = (f) => f.replace(/\[[^\]]*\]/g, '').split('.').pop();
const isTextField = (f) => TEXT_FIELDS.has(lastSeg(f));
const fieldLabel = (col, f, labels) => {
  const custom = labels && labels.fields && ((labels.fields[col] && labels.fields[col][f]) || labels.fields[f]);
  if (custom) return custom;
  const m = f.match(/^briefing\.entries\[[^\]]*\]\.(.+)$/);
  if (m) return m[1] === 'html' ? 'texto' : (FIELD_LABEL[m[1]] || m[1]);
  return FIELD_LABEL[lastSeg(f)] || lastSeg(f);
};
const de = (noun) => (noun.startsWith('a ') ? 'da ' + noun.slice(2) : noun.startsWith('o ') ? 'do ' + noun.slice(2) : 'de ' + noun);

const stripHtml = (h) => String(h == null ? '' : h).replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const snip = (s, n = 70) => { s = stripHtml(s); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

/** Valor para exibição curta (não para restaurar). */
function brief(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.length > 200 ? v.slice(0, 199) + '…' : v;
  if (typeof v !== 'object') return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return '';
    if (v.every((x) => x == null || typeof x !== 'object')) return brief(v.join(', '));
    return v.length + (v.length === 1 ? ' item' : ' itens');
  }
  try { return brief(JSON.stringify(v)); } catch (e) { return ''; }
}
function statusText(labels, col, f, v) {
  if (v == null || v === '') return '';
  const m = labels && labels.status && labels.status[col];
  const map = m && (m[f] || (f === 'status' ? m : null));
  if (map && typeof map === 'object' && map[v] != null) {
    const x = map[v];
    return typeof x === 'object' ? x.label || String(v) : String(x);
  }
  return null;
}
const dispValue = (labels, col, f, v) => { const s = statusText(labels, col, f, v); return s != null ? s : brief(v); };

function toText(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map((x) => (x == null ? '' : typeof x === 'object' ? brief(x) : String(x))).join('\n\n');
  return typeof v === 'string' ? v : String(v);
}
function textChange(f, label, from, to, format) {
  let a = toText(from), b = toText(to), truncated = false;
  if (a.length > MAX_TEXT) { a = a.slice(0, MAX_TEXT); truncated = true; }
  if (b.length > MAX_TEXT) { b = b.slice(0, MAX_TEXT); truncated = true; }
  const fmt = format || (lastSeg(f) === 'html' || /<[a-z][^>]*>/i.test(b || a) ? 'html' : 'text');
  const o = { f, label, format: fmt, from: a, to: b };
  if (truncated) o.truncated = true;
  return o;
}

/** Separa os campos de uma mudança em `changes` (curtos) e `textChanges` (integrais). */
function actSplitFields(fields, col, labels, skip) {
  const changes = [], textChanges = [];
  for (const d of fields) {
    if (skip && skip.has(d.f)) continue;
    const label = fieldLabel(col, d.f, labels);
    const long = typeof d.to === 'string' && d.to.length > 500 || typeof d.from === 'string' && d.from.length > 500;
    if (isTextField(d.f) || long) { textChanges.push(textChange(d.f, label, d.from, d.to)); continue; }
    const c = { f: d.f, label, from: brief(d.from), to: brief(d.to) };
    const ft = dispValue(labels, col, d.f, d.from), tt = dispValue(labels, col, d.f, d.to);
    if (ft !== c.from) c.fromText = ft;
    if (tt !== c.to) c.toText = tt;
    changes.push(c);
  }
  return { changes, textChanges };
}
const shown = (c, side) => (side === 'from' ? (c.fromText != null ? c.fromText : c.from) : (c.toText != null ? c.toText : c.to));

/** Frase de edição a partir das mudanças simples (também usada ao coalescer). */
function editSummary(col, label, changes, textChanges) {
  const noun = NOUN[col] || 'o item';
  const who = label ? ' ' + label : '';
  if (changes.length === 1 && !textChanges.length) {
    const c = changes[0];
    const f = shown(c, 'from'), t = shown(c, 'to');
    return `Alterou ${c.label} ${de(noun)}${who}: ${f || '(vazio)'} → ${t || '(vazio)'}`;
  }
  const names = [...changes, ...textChanges].map((c) => c.label);
  if (!changes.length && textChanges.length === 1) return `Editou ${textChanges[0].label} ${de(noun)}${who}`;
  const uniq = [...new Set(names)];
  const list = uniq.length > 3 ? uniq.slice(0, 3).join(', ') + '…' : uniq.join(', ');
  return `Alterou ${uniq.length} campos ${de(noun)}${who} (${list})`;
}

// ─── Contexto de interpretação ──────────────────────────────────────────────────────────────

const SOURCES = ['manual', 'importacao', 'automatico', 'desfazer', 'restauracao', 'bot'];

function makeCtx(ctx) {
  const c = ctx || {};
  const tsMs = c.ts != null ? (typeof c.ts === 'number' ? c.ts : Date.parse(c.ts)) : Date.now();
  const ts = new Date(isNaN(tsMs) ? Date.now() : tsMs).toISOString();
  const next = c.next || {};
  const cache = {};
  const maps = {};
  return {
    ts, tsMs: Date.parse(ts), device: c.device || '', tab: c.tab || '', labels: c.labels || null, next,
    source: SOURCES.includes(c.source) ? c.source : 'manual',
    batchLabel: c.batchLabel || '', batchId: c.batchId || '', batchNoun: c.batchNoun || null,
    compared: c.compared != null ? c.compared : null, replaced: c.replaced || null,
    /** Item da coleção por id (lazy, só do estado novo). */
    find(col, id) {
      if (!maps[col]) maps[col] = byId(Array.isArray(next[col]) ? next[col] : []);
      return maps[col].get(id);
    },
    opRef(id) {
      if (!id) return null;
      if (!(id in cache)) { const o = this.find('operations', id); cache[id] = { id, name: o ? o.name || o.title || '' : '' }; }
      return cache[id];
    },
  };
}

function entityOf(col, item, c) {
  const it = item || {};
  let label = '', proc = it.processNumber || '';
  switch (col) {
    case 'operations': case 'people': label = it.name || it.title || ''; break;
    case 'debts': label = it.cdaNumber || ''; break;
    case 'executions': label = it.processNumber || ''; break;
    case 'measures': label = it.title || it.type || it.name || ''; break;
    case 'assets': label = it.description || it.registry || ''; proc = proc || it.processRef || ''; break;
    case 'documents': label = it.title || ''; break;
    case 'prescriptionEvents': label = it.type || ''; break;
    case 'intimations': label = it.eventDescription || it.processNumber || ''; break;
    case 'tasks': label = it.title || ''; break;
    case 'stickyNotes': label = snip(it.content, 50); break;
    case 'watchlist': label = it.title || it.name || it.processNumber || ''; break;
    case 'hearings': label = it.title || it.type || it.processNumber || ''; break;
    default: label = it.id != null ? String(it.id) : '';
  }
  if (!proc && it.executionId) { const e = c.find('executions', it.executionId); if (e) proc = e.processNumber || ''; }
  if (!proc && it.cdaId && col === 'prescriptionEvents') { const d = c.find('debts', it.cdaId); if (d) proc = d.processNumber || ''; }
  return { type: col.startsWith('links.') ? 'vinculo' : col, id: String(it.id != null ? it.id : ''), col, label: String(label || ''), proc: String(proc || '') };
}
const opIdOf = (col, item) => (col === 'operations' ? item && item.id : item && item.operationId) || '';

function mkEvent(c, p) {
  const id = newEventId(c.tsMs, c.device, c.tab);
  return {
    v: 1, id, ts: c.ts, day: dayKey(c.ts),
    op: p.op || null,
    entity: p.entity || { type: 'sistema', id: '', label: '', proc: '' },
    kind: p.kind, action: p.action, summary: p.summary,
    changes: p.changes || [], textChanges: p.textChanges || [],
    source: p.source || c.source, batch: p.batch || null,
    minor: !!p.minor, restore: p.restore || { items: [] }, device: c.device,
    ...(p.cascade ? { cascade: p.cascade } : {}),
  };
}
const restoreOf = (r, path) => ({ col: r.col, id: r.id, before: r.before, after: r.after, ...(path ? { path } : {}) });

// ─── Interpretação ──────────────────────────────────────────────────────────────────────────

/** Evento de sistema avulso (ex.: "Dados carregados da nuvem") — para quem não quer nem fazer o diff. */
export function systemEvent(summary, ctx) {
  const c = makeCtx(ctx);
  return mkEvent(c, { kind: 'sistema', action: 'carregar', summary, source: ctx && ctx.source ? c.source : 'automatico', minor: false });
}

const isIndisp = (s) => typeof s === 'string' && s.startsWith('indisponibilidade');
const procOf = (x) => (x && x.processNumber) || '';
const actNormProc = (s) => String(s == null ? '' : s).replace(/\D/g, '');

/**
 * Transforma mudanças cruas em eventos.
 * ctx: { ts, device, tab?, source, batchLabel?, batchId?, batchNoun?:{s,p,f}, compared?, replaced?, labels?, next }
 *  - labels: { status:{ [col]:{ [valor]:'Rótulo' | {label} } }, fields:{ [col]:{ [campo]:'rótulo' } } }
 *  - replaced: true/texto → um único evento de sistema (estado inteiro substituído).
 */
export function interpretActivity(raw, ctx) {
  const list = Array.isArray(raw) ? raw : [];
  const c = makeCtx(ctx);
  if (!list.length) return [];
  if (c.replaced) {
    return [mkEvent(c, { kind: 'sistema', action: 'carregar', summary: c.replaced === true ? 'Dados substituídos por inteiro' : String(c.replaced), source: ctx.source ? c.source : 'automatico' })];
  }
  if (c.source === 'importacao' || c.batchLabel) return [batchEvent(list, c)];
  let creates = 0;
  for (const r of list) if (r.op === 'create') creates++;
  if (creates > MAX_CREATES) {
    return [mkEvent(c, { kind: 'sistema', action: 'carregar', summary: `Carga de ${creates} itens novos de uma vez`, source: ctx && ctx.source ? c.source : 'automatico' })];
  }

  const used = new Set();
  const events = [];
  correlateCascades(list, c, used, events);
  correlateResponses(list, c, used, events);
  correlateProactive(list, c, used, events);
  for (const r of list) if (!used.has(r)) singleEvents(r, c, events);
  return events;
}

// Importação: um evento só, com contagens, detalhes e todos os itens para desfazer a importação.
function batchEvent(list, c) {
  const n = { create: 0, update: 0, delete: 0 };
  const details = [];
  const items = [];
  for (const r of list) {
    n[r.op]++;
    items.push(restoreOf(r));
    if (details.length < MAX_DETAILS) {
      const ent = entityOf(r.col, r.after || r.before, c);
      details.push({ op: r.op, col: r.col, id: r.id, label: ent.label, proc: ent.proc, fields: r.fields.slice(0, 12).map((d) => fieldLabel(r.col, d.f, c.labels)) });
    }
  }
  const noun = c.batchNoun || { s: 'item', p: 'itens', f: false };
  const fem = !!noun.f;
  const ag = (k, m, f, pl) => `${k} ${k === 1 ? (fem ? f : m) : (fem ? f + 's' : m + 's')}`;
  const parts = [];
  if (c.compared != null) parts.push(`${c.compared} ${c.compared === 1 ? noun.s : noun.p} ${fem ? (c.compared === 1 ? 'comparada' : 'comparadas') : (c.compared === 1 ? 'comparado' : 'comparados')}`);
  parts.push(ag(n.update, 'alterado', 'alterada'));
  parts.push(`${n.create} ${n.create === 1 ? (fem ? 'nova' : 'novo') : (fem ? 'novas' : 'novos')}`);
  if (n.delete) parts.push(ag(n.delete, 'removido', 'removida'));
  const label = c.batchLabel || 'lote';
  const batch = { id: c.batchId || newEventId(c.tsMs, c.device, c.tab), label, count: list.length, stats: n, details };
  return mkEvent(c, {
    kind: 'importacao', action: c.source === 'importacao' ? 'importar' : c.source === 'restauracao' ? 'restaurar' : 'editar',
    summary: `${c.source === 'importacao' ? 'Importação ' : c.source === 'restauracao' ? 'Restauração ' : c.source === 'desfazer' ? 'Desfez ' : ''}${label}: ${parts.join(', ')}`,
    batch, restore: { items }, minor: false, source: c.source,
  });
}

const CASCADE_RANK = { operations: 0, executions: 1, debts: 2, people: 3, measures: 4, assets: 5 };
const CLEAN_FIELDS = new Set(['parentExecutionId', 'linkedExecutionIds', 'holderId', 'personId']);
const refIds = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Exclusão em cascata: raiz + dependentes + vínculos + referências limpas → um evento só.
function correlateCascades(list, c, used, events) {
  const dels = list.filter((r) => r.op === 'delete' && !r.col.startsWith('links.'));
  if (!dels.length) return;
  const roots = dels.slice().sort((a, b) => (CASCADE_RANK[a.col] ?? 9) - (CASCADE_RANK[b.col] ?? 9));
  for (const root of roots) {
    if (used.has(root)) continue;
    used.add(root);
    const deps = [];
    const ids = new Set([root.id]);
    const claimDeps = (test) => {
      for (const o of dels) {
        if (used.has(o) || !test(o)) continue;
        used.add(o); deps.push(o); ids.add(o.id);
      }
    };
    if (root.col === 'operations') claimDeps((o) => o.before && o.before.operationId === root.id);
    claimDeps((o) => o.col === 'prescriptionEvents' && o.before && (ids.has(o.before.cdaId) || (!o.before.cdaId && ids.has(o.before.executionId))));
    const links = [];
    for (const o of list) {
      if (used.has(o) || o.op !== 'delete' || !o.col.startsWith('links.')) continue;
      const b = o.before || {};
      if (ids.has(b.measureId) || ids.has(b.personId) || ids.has(b.assetId) || ids.has(b.cdaId)) { used.add(o); links.push(o); }
    }
    const touched = [];
    for (const o of list) {
      if (used.has(o) || o.op !== 'update' || !CLEAN_FIELDS.size || !['executions', 'assets', 'debts'].includes(o.col)) continue;
      if (!o.fields.every((d) => CLEAN_FIELDS.has(d.f))) continue;
      if (o.fields.some((d) => refIds(d.from).some((x) => ids.has(x)))) { used.add(o); touched.push(o); }
    }
    const ent = entityOf(root.col, root.before, c);
    const noun = NOUN[root.col] || 'o item';
    const byType = {};
    for (const d of deps) byType[d.col] = (byType[d.col] || 0) + 1;
    const nDeps = deps.length;
    const summary = `Excluiu ${noun}${ent.label ? ' ' + ent.label : ''}` + (nDeps ? ` e ${nDeps} ${nDeps === 1 ? 'item vinculado' : 'itens vinculados'}` : '');
    const { textChanges } = actSplitFields(
      Object.keys(root.before || {}).filter((k) => !isIgnored(k) && (TEXT_FIELDS.has(k)) && !actIsEmpty(root.before[k])).map((k) => ({ f: k, from: root.before[k], to: '' })),
      root.col, c.labels);
    events.push(mkEvent(c, {
      op: c.opRef(opIdOf(root.col, root.before)) || null,
      entity: ent, kind: KIND[root.col] || 'sistema', action: 'excluir', summary, textChanges,
      minor: false, cascade: { count: nDeps, byType },
      restore: { items: [root, ...deps, ...links, ...touched].map((r) => restoreOf(r)) },
    }));
  }
}

const RESP_LABEL = { peticionamento: 'peticionamento', ciencia: 'ciência', outra: 'outra medida' };

// Resposta a intimação: intimação + nota no processo + documento = um evento.
function correlateResponses(list, c, used, events) {
  for (const r of list) {
    if (used.has(r) || r.col !== 'intimations' || r.op !== 'update') continue;
    const was = r.before && r.before.responseAction, now = r.after && r.after.responseAction;
    if (actIsEmpty(now) || (was && was.respondedAt === now.respondedAt)) continue;
    used.add(r);
    const rel = [r];
    const textChanges = [];
    const ra = now || {};
    const kindTxt = (RESP_LABEL[ra.type] || ra.type || 'resposta') + (ra.type === 'peticionamento' && ra.peticionType ? ` (${ra.peticionType})` : '');
    if (ra.description) textChanges.push(textChange('responseAction.description', 'Descrição da resposta', was && was.description, ra.description, 'text'));
    const proc = actNormProc(r.after.processNumber);
    for (const o of list) {
      if (used.has(o)) continue;
      if (o.col === 'executions' && o.op === 'update' && proc && actNormProc(o.after.processNumber) === proc && o.fields.some((d) => d.f === 'notesList')) {
        used.add(o); rel.push(o);
        const d = o.fields.find((x) => x.f === 'notesList');
        textChanges.push(textChange('notesList', 'Anotações do processo', d.from, d.to, 'text'));
      } else if (o.col === 'documents' && o.op === 'create' && o.after.sourceIntimationId === r.id) {
        used.add(o); rel.push(o);
      }
    }
    const { changes } = actSplitFields(r.fields, 'intimations', c.labels, new Set(['responseAction', 'operationId']));
    const ent = entityOf('intimations', r.after, c);
    events.push(mkEvent(c, {
      op: c.opRef(opIdOf('intimations', r.after)), entity: ent, kind: 'intimacao', action: 'registrar',
      summary: `Registrou ${kindTxt} na intimação${ent.proc ? ' ' + ent.proc : ''}`,
      changes, textChanges, minor: false, restore: { items: rel.map((x) => restoreOf(x)) },
    }));
  }
}

// Atuação proativa: item em proactiveActions + nota + documento 'doc-<id>' = um evento.
function correlateProactive(list, c, used, events) {
  for (const r of list) {
    if (used.has(r) || r.col !== 'executions' || r.op !== 'update') continue;
    const pa = r.fields.find((d) => d.f === 'proactiveActions');
    if (!pa) continue;
    const old = new Set((Array.isArray(pa.from) ? pa.from : []).map((a) => a && a.id));
    const added = (Array.isArray(pa.to) ? pa.to : []).filter((a) => a && !old.has(a.id));
    if (!added.length) continue;
    used.add(r);
    const rel = [r];
    for (const a of added) {
      for (const o of list) {
        if (!used.has(o) && o.col === 'documents' && o.op === 'create' && o.after.id === 'doc-' + a.id) { used.add(o); rel.push(o); }
      }
    }
    const a0 = added[0];
    const textChanges = [textChange('proactiveActions.summary', 'Resumo da atuação', '', a0.summary, 'text')];
    if (a0.pecaText) textChanges.push(textChange('proactiveActions.pecaText', 'Texto da peça', '', a0.pecaText, 'text'));
    const { changes, textChanges: tx } = actSplitFields(r.fields, 'executions', c.labels, new Set(['proactiveActions']));
    const ent = entityOf('executions', r.after, c);
    events.push(mkEvent(c, {
      op: c.opRef(r.after.operationId), entity: ent, kind: 'atuacao', action: 'registrar',
      summary: `Registrou atuação proativa no processo ${ent.label}: ${snip(a0.summary, 80)}`,
      changes, textChanges: [...textChanges, ...tx], minor: false, restore: { items: rel.map((x) => restoreOf(x)) },
    }));
  }
}

// Mudanças isoladas (sem correlação): uma ou mais frases por mudança crua.
function singleEvents(r, c, events) {
  const col = r.col;
  const item = r.after || r.before;
  const ent = entityOf(col, item, c);
  const noun = NOUN[col] || 'o item';
  const kind = KIND[col] || 'sistema';
  const op = c.opRef(opIdOf(col, item)) || (col.startsWith('links.') ? c.opRef(((c.find('measures', item && item.measureId)) || {}).operationId || (c.find('debts', item && item.cdaId) || {}).operationId) : null);
  const base = { op, entity: ent, kind, restore: { items: [restoreOf(r)] } };
  const lbl = ent.label ? ' ' + ent.label : '';

  if (r.op === 'create') {
    const { textChanges } = actSplitFields(Object.keys(r.after).filter((k) => !isIgnored(k) && TEXT_FIELDS.has(k) && !actIsEmpty(r.after[k])).map((k) => ({ f: k, from: '', to: r.after[k] })), col, c.labels);
    const constr = col === 'assets' && isIndisp(r.after.status);
    const st = constr ? dispValue(c.labels, 'assets', 'status', r.after.status) : '';
    events.push(mkEvent(c, {
      ...base, kind: constr ? 'constricao' : kind, action: 'criar', textChanges,
      summary: constr ? `Registrou constrição: ${ent.label || 'bem'}${st ? ' (' + st + ')' : ''}` : `Criou ${noun}${lbl}`,
      minor: col.startsWith('links.'),
    }));
    return;
  }
  if (r.op === 'delete') {
    const { textChanges } = actSplitFields(Object.keys(r.before).filter((k) => !isIgnored(k) && TEXT_FIELDS.has(k) && !actIsEmpty(r.before[k])).map((k) => ({ f: k, from: r.before[k], to: '' })), col, c.labels);
    events.push(mkEvent(c, { ...base, action: 'excluir', summary: `Excluiu ${noun}${lbl}`, textChanges, minor: col.startsWith('links.') }));
    return;
  }
  // update
  const plain = r.fields.filter((d) => !d.f.startsWith('briefing.'));
  const brf = r.fields.filter((d) => d.f.startsWith('briefing.'));
  if (plain.length) {
    const { changes, textChanges } = actSplitFields(plain, col, c.labels);
    const st = plain.find((d) => d.f === 'status');
    let action = 'editar', k = kind, summary = editSummary(col, ent.label, changes, textChanges);
    if (col === 'tasks' && st) {
      if (st.to === 'concluida') { action = 'concluir'; summary = `Concluiu a tarefa${lbl}`; }
      else if (st.from === 'concluida') { action = 'reabrir'; summary = `Reabriu a tarefa${lbl}`; }
    }
    if (col === 'assets' && st && (isIndisp(st.to) || isIndisp(st.from))) k = 'constricao';
    const significant = plain.some((d) => SIGNIFICANT.has(lastSeg(d.f))) || (textChanges.length > 0 && !MAIN_EDIT_SKIP_MINOR.has(col) && (col === 'executions' || col === 'intimations' || col === 'debts' || col === 'tasks' || col === 'operations'));
    events.push(mkEvent(c, { ...base, kind: k, action, summary, changes, textChanges, minor: !significant }));
  }
  if (brf.length) briefingEvents(r, brf, c, events);
}

// Briefing: uma entrada de diário = um evento; uma fase = um evento.
function briefingEvents(r, fields, c, events) {
  const opRef = c.opRef(r.id);
  const opName = (opRef && opRef.name) || (r.after && r.after.name) || '';
  const groups = new Map();
  for (const d of fields) {
    const m = d.f.match(/^briefing\.entries\[([^\]]*)\](?:\.(.+))?$/);
    if (m) { const g = groups.get('e:' + m[1]) || { type: 'entry', id: m[1], items: [] }; g.items.push({ ...d, sub: m[2] || null }); groups.set('e:' + m[1], g); continue; }
    const s = d.f.match(/^briefing\.processStageV2\.([^.]+)\.(.+)$/);
    if (s) { groups.set('s:' + s[1] + '.' + s[2], { type: 'stage', execId: s[1], key: s[2], d }); continue; }
    const o = groups.get('other') || { type: 'other', items: [] };
    o.items.push(d); groups.set('other', o);
  }
  const pathOf = (p) => ({ col: 'operations', id: r.id, path: p });
  for (const g of groups.values()) {
    if (g.type === 'entry') {
      const whole = g.items.find((i) => !i.sub);
      const path = `briefing.entries[${g.id}]`;
      let entry = whole ? (whole.to || whole.from) : null;
      if (!entry) {
        const e = ((r.after.briefing || {}).entries || []).find((x) => x && x.id === g.id);
        entry = e || {};
      }
      const label = entry.eventDate ? String(entry.eventDate).slice(0, 10) : snip(entry.html, 40);
      const ent = { type: 'diario', id: String(g.id), col: 'operations', label, proc: '' };
      const src = { op: opRef, entity: ent, kind: 'diario', minor: false };
      if (whole && !whole.from) {
        events.push(mkEvent(c, { ...src, action: 'criar', summary: `Registrou no diário${opName ? ' da operação ' + opName : ''}: ${snip(whole.to.html, 60)}`,
          textChanges: [textChange(path + '.html', 'Texto do diário', '', whole.to.html, 'html')], restore: { items: [{ ...pathOf(path), before: null, after: whole.to }] } }));
      } else if (whole && !whole.to) {
        events.push(mkEvent(c, { ...src, action: 'excluir', summary: `Excluiu entrada do diário${opName ? ' da operação ' + opName : ''}: ${snip(whole.from.html, 60)}`,
          textChanges: [textChange(path + '.html', 'Texto do diário', whole.from.html, '', 'html')], restore: { items: [{ ...pathOf(path), before: whole.from, after: null }] } }));
      } else {
        const before = ((r.before.briefing || {}).entries || []).find((x) => x && x.id === g.id) || null;
        const after = ((r.after.briefing || {}).entries || []).find((x) => x && x.id === g.id) || null;
        const { changes, textChanges } = actSplitFields(g.items.map((i) => ({ f: i.f, from: i.from, to: i.to })), 'operations', c.labels);
        events.push(mkEvent(c, { ...src, action: 'editar', summary: `Editou entrada do diário${opName ? ' da operação ' + opName : ''}: ${snip((after && after.html) || '', 60)}`,
          changes, textChanges, restore: { items: [{ ...pathOf(path), before, after }] } }));
      }
    } else if (g.type === 'stage') {
      const d = g.d;
      const ex = c.find('executions', g.execId) || (r.after && null) || {};
      const proc = ex.processNumber || '';
      const to = d.to || {}, from = d.from || {};
      const outcome = to.outcome || from.outcome;
      const ent = { type: 'fase', id: g.execId + '.' + g.key, col: 'operations', label: g.key, proc };
      const textChanges = (from.texto !== to.texto) ? [textChange(d.f + '.texto', 'Texto da fase', from.texto, to.texto)] : [];
      const sub = [];
      for (const k of new Set([...Object.keys(from), ...Object.keys(to)])) {
        if (k === 'texto' || isIgnored(k) || deepEqual(from[k], to[k])) continue;
        sub.push({ f: d.f + '.' + k, label: k === 'outcome' ? 'desfecho' : (FIELD_LABEL[k] || k), from: brief(from[k]), to: brief(to[k]) });
      }
      const verbo = !d.from ? 'Registrou' : !d.to ? 'Removeu' : 'Alterou';
      events.push(mkEvent(c, {
        op: opRef, entity: ent, kind: to.outcome ? 'decisao' : 'frente', action: !d.to ? 'excluir' : !d.from ? 'registrar' : 'editar',
        summary: `${verbo} ${to.outcome ? 'decisão (' + brief(to.outcome) + ') na ' : ''}fase ${g.key}${proc ? ' do processo ' + proc : ''}`,
        changes: sub, textChanges, minor: !to.outcome && !!d.from && !!d.to && !textChanges.length,
        restore: { items: [{ ...pathOf(d.f), before: d.from === undefined ? null : d.from, after: d.to === undefined ? null : d.to }] },
      }));
    } else {
      const { changes, textChanges } = actSplitFields(g.items, 'operations', c.labels);
      events.push(mkEvent(c, {
        op: opRef, entity: entityOf('operations', r.after, c), kind: 'operacao', action: 'editar',
        summary: editSummary('operations', opName, changes, textChanges), changes, textChanges, minor: true,
        restore: { items: g.items.map((i) => ({ ...pathOf(i.f), before: i.from === undefined ? null : i.from, after: i.to === undefined ? null : i.to })) },
      }));
    }
  }
}

// ─── Fila de envio ──────────────────────────────────────────────────────────────────────────

/**
 * Junta, na fila de saída (ordem cronológica), ajustes de campo simples da mesma entidade + mesmos
 * campos + mesma origem dentro de `windowMs`: `from` do primeiro, `to` do último, `coalesced: n`,
 * `restore.before` do primeiro. Ida-e-volta (from === to) é descartada. Texto, lote e exclusão
 * nunca são coalescidos. Mantém o id do primeiro evento e o ts do último.
 */
export function coalesceOutbox(events, windowMs = 10 * 60 * 1000) {
  const out = [];
  const open = new Map(); // entidade → { key, ev, last }
  for (const ev of events || []) {
    const simple = ev && ev.action === 'editar' && !ev.batch && !(ev.textChanges && ev.textChanges.length) && ev.changes && ev.changes.length
      && ev.restore && ev.restore.items && ev.restore.items.length === 1 && ev.restore.items[0].before && ev.restore.items[0].after;
    const ek = ev && ev.entity ? ev.entity.type + '|' + ev.entity.id : '';
    if (!simple || !ek) { if (ek) open.delete(ek); out.push(ev); continue; }
    const key = ev.source + '|' + ev.changes.map((x) => x.f).sort().join(',');
    const cur = open.get(ek);
    const t = Date.parse(ev.ts);
    if (cur && cur.key === key && t - cur.last <= windowMs) {
      const m = cur.ev;
      m.changes = m.changes.map((x) => {
        const y = ev.changes.find((z) => z.f === x.f);
        const n = { ...x, to: y.to };
        if (y.toText != null) n.toText = y.toText; else delete n.toText;
        return n;
      });
      m.ts = ev.ts; m.day = ev.day;
      m.coalesced = (m.coalesced || 1) + 1;
      m.restore = { items: [{ ...m.restore.items[0], after: ev.restore.items[0].after }] };
      m.summary = editSummary(ev.entity.col, m.entity.label, m.changes, []);
      cur.last = t;
      continue;
    }
    const copy = { ...ev, changes: ev.changes.map((x) => ({ ...x })), restore: { items: [{ ...ev.restore.items[0] }] } };
    out.push(copy);
    open.set(ek, { key, ev: copy, last: t });
  }
  // ida-e-volta: nenhum campo terminou diferente do começo
  return out.filter((ev) => !(ev.coalesced && ev.changes.every((x) => (x.fromText != null ? x.fromText : x.from) === (x.toText != null ? x.toText : x.to))));
}

// ─── Restauração ────────────────────────────────────────────────────────────────────────────

const colList = (d, col) => (col.startsWith('links.') ? ((d.links || {})[col.slice(6)] || []) : (d[col] || []));
const keyOf = (col, x) => (col === 'links.measurePeople' ? x.measureId + '|' + x.personId : col === 'links.measureAssets' ? x.measureId + '|' + x.assetId : x.id);
const itemLabel = (it) => String((it && (it.name || it.title || it.cdaNumber || it.processNumber || it.description || it.eventDescription || it.type || it.id)) || '');

/** Caminho do briefing ("briefing.entries[e1].html") → passos { k } (chave) ou { id } (item de lista por id). */
function parsePath(path) {
  const steps = [];
  const re = /([^.[\]]+)|\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(path))) steps.push(m[1] != null ? { k: m[1] } : { id: m[2] });
  return steps;
}
function getAt(obj, steps, i = 0) {
  if (i >= steps.length) return obj;
  if (obj == null) return undefined;
  const s = steps[i];
  const child = s.id != null ? (Array.isArray(obj) ? obj.find((x) => x && String(x.id) === s.id) : undefined) : obj[s.k];
  return getAt(child, steps, i + 1);
}
/** Grava (ou remove, se `val === undefined`) no caminho, sem mutar. */
function setAt(obj, steps, val, i = 0) {
  if (i >= steps.length) return val;
  const s = steps[i];
  if (s.id != null) {
    const arr = Array.isArray(obj) ? obj : [];
    const idx = arr.findIndex((x) => x && String(x.id) === s.id);
    const nv = setAt(idx >= 0 ? arr[idx] : undefined, steps, val, i + 1);
    if (nv === undefined) return idx >= 0 ? arr.filter((_, j) => j !== idx) : arr;
    if (idx >= 0) return arr.map((x, j) => (j === idx ? nv : x));
    return [...arr, nv];
  }
  const base = obj && typeof obj === 'object' ? obj : {};
  const nv = setAt(base[s.k], steps, val, i + 1);
  if (nv === undefined) { const c = { ...base }; delete c[s.k]; return c; }
  return { ...base, [s.k]: nv };
}

/**
 * Planeja a restauração de um evento sobre o estado atual (sem aplicar nada além do retorno).
 * Devolve `{ data, applied, conflicts:[{col,id,label,motivo}] }`; `data` é um estado novo (imutável).
 *  - update: volta só os campos que o evento mudou para o `before`; conflito se o valor atual ≠ `after`;
 *  - item excluído: reinsere se o id não existir; item criado (desfazer importação): remove se ainda igual ao `after`;
 *  - itens com `path` (briefing): restaura só aquele caminho da operação.
 * opts: { force?:bool (aplica mesmo com conflito), only?:[{col,id,field?}], now?:ISO }
 */
export function planRestore(event, data, opts) {
  const o = opts || {};
  const items = (event && event.restore && event.restore.items) || [];
  const now = o.now || new Date().toISOString();
  const lists = new Map();
  const get = (col) => { if (!lists.has(col)) lists.set(col, colList(data || {}, col).slice()); return lists.get(col); };
  const conflicts = [];
  let applied = 0;
  const conflict = (it, label, motivo) => conflicts.push({ col: it.col, id: it.id, label: label || '', motivo });
  const matches = (it) => !o.only || o.only.some((x) => x.col === it.col && String(x.id) === String(it.id));
  const fieldsOf = (it) => {
    if (!o.only) return null;
    const fs = o.only.filter((x) => x.col === it.col && String(x.id) === String(it.id));
    return fs.some((x) => !x.field) ? null : new Set(fs.map((x) => x.field));
  };

  for (const it of items) {
    if (!it || !it.col || !matches(it)) continue;
    const only = fieldsOf(it);
    const list = get(it.col);
    const idx = list.findIndex((x) => x && String(keyOf(it.col, x)) === String(it.id));
    const cur = idx >= 0 ? list[idx] : null;
    const hasB = it.before != null, hasA = it.after != null;
    const lbl = itemLabel(it.before || it.after);

    if (it.path) { // briefing: só o caminho
      if (only && !only.has(it.path)) continue;
      if (!cur) { conflict(it, lbl, 'a operação não existe mais'); continue; }
      const steps = parsePath(it.path);
      const now0 = getAt(cur, steps);
      if (deepEqual(now0, it.before == null ? undefined : it.before)) continue;
      if (!o.force && !deepEqual(now0, it.after == null ? undefined : it.after)) { conflict(it, cur.name || lbl, 'alterado depois do evento'); continue; }
      list[idx] = setAt(cur, steps, it.before == null ? undefined : it.before);
      applied++;
      continue;
    }
    if (hasB && hasA) { // campo(s)
      if (!cur) { conflict(it, lbl, 'o item não existe mais'); continue; }
      let next = null;
      let touched = false;
      for (const d of diffFields(it.before, it.after)) {
        if (only && !only.has(d.f)) continue;
        if (deepEqual(cur[d.f], d.from)) continue; // já está como antes
        if (!o.force && !deepEqual(cur[d.f], d.to)) { conflict(it, lbl, `campo "${d.f}" alterado depois do evento`); continue; }
        next = next || { ...cur };
        if (d.from === undefined) delete next[d.f]; else next[d.f] = d.from;
        touched = true;
      }
      if (touched) { next.updatedAt = now; list[idx] = next; applied++; }
      continue;
    }
    if (hasB) { // excluído → reinsere
      if (cur) continue;
      list.push(it.before);
      applied++;
      continue;
    }
    if (hasA) { // criado → remove se ainda igual
      if (!cur) continue;
      if (!o.force && !deepEqual(cur, it.after)) { conflict(it, itemLabel(cur) || lbl, 'alterado depois do evento'); continue; }
      list.splice(idx, 1);
      applied++;
    }
  }

  let out = data || {};
  if (lists.size) {
    out = { ...out };
    for (const [col, arr] of lists) {
      if (col.startsWith('links.')) out.links = { ...(out.links || {}), [col.slice(6)]: arr };
      else out[col] = arr;
    }
  }
  return { data: out, applied, conflicts };
}
