/**
 * Fila e cópia local do registro de trabalho ("Minha atividade").
 *
 * Parte pura (testável sem navegador): divisão em lotes, poda por data, mescla por id, escopos de origem.
 * Parte de armazenamento: IndexedDB 'nexus_trilha' (stores 'outbox' = eventos ainda não enviados e
 * 'local' = cópia dos últimos 45 dias, para a tela funcionar offline e na Demo). Se o IndexedDB não
 * existir ou falhar, cai para memória sem quebrar nada.
 */
import { coalesceOutbox } from './activity.js';

export const ACTIVITY_DB = 'nexus_trilha';
export const LOCAL_DAYS = 45;
export const OUTBOX_MAX_EVENTS = 5000;
export const OUTBOX_MAX_BYTES = 20 * 1024 * 1024;
export const MAX_BATCH_BYTES = 4 * 1024 * 1024; // JSON antes do gzip

// ─── Puras ──────────────────────────────────────────────────────────────────────────────────

const actEvLen = (e) => { try { return JSON.stringify(e).length; } catch (x) { return 0; } };

/** Divide eventos em lotes de até `maxBytes` de JSON (um evento maior que o limite vai sozinho). */
export function splitBatches(events, maxBytes = MAX_BATCH_BYTES) {
  const out = [];
  let cur = [], size = 2;
  for (const e of events || []) {
    const n = actEvLen(e) + 1;
    if (cur.length && size + n > maxBytes) { out.push(cur); cur = []; size = 2; }
    cur.push(e);
    size += n;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Mantém só eventos com `ts` dentro dos últimos `days` dias. */
export function pruneByAge(events, days = LOCAL_DAYS, nowMs = Date.now()) {
  const min = nowMs - days * 86400000;
  return (events || []).filter((e) => { const t = Date.parse(e && e.ts); return !isNaN(t) && t >= min; });
}

/**
 * Poda a fila de saída (cronológica): descarta o que passou de `days` dias (ts inválido fica) e, se ainda
 * passar de `maxEvents` ou `maxBytes` de JSON, os mais antigos. Devolve `{ keep, dropped }`.
 */
export function pruneOutbox(events, opts) {
  const o = opts || {};
  const days = o.days != null ? o.days : LOCAL_DAYS;
  const maxEvents = o.maxEvents != null ? o.maxEvents : OUTBOX_MAX_EVENTS;
  const maxBytes = o.maxBytes != null ? o.maxBytes : OUTBOX_MAX_BYTES;
  const min = (o.nowMs != null ? o.nowMs : Date.now()) - days * 86400000;
  let keep = (events || []).filter((e) => { const t = Date.parse(e && e.ts); return isNaN(t) || t >= min; });
  let bytes = 0;
  const sizes = keep.map((e) => { const n = actEvLen(e) + 1; bytes += n; return n; });
  let from = 0;
  while (from < keep.length && (keep.length - from > maxEvents || bytes > maxBytes)) { bytes -= sizes[from]; from++; }
  keep = keep.slice(from);
  const ids = new Set(keep.map((e) => e.id));
  return { keep, dropped: (events || []).filter((e) => !ids.has(e.id)) };
}

const actIsFull = (e) => !!(e && e.restore && e.restore.items && e.restore.items.length);

/** Junta listas de eventos sem duplicar por id (prefere a cópia completa) e ordena do mais novo ao mais antigo. */
export function mergeEvents(...lists) {
  const m = new Map();
  for (const l of lists) {
    for (const e of l || []) {
      if (!e || !e.id) continue;
      const cur = m.get(e.id);
      if (!cur || (!actIsFull(cur) && actIsFull(e))) m.set(e.id, e);
    }
  }
  return [...m.values()].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

/** Eventos cujo dia ('AAAA-MM-DD') está no intervalo [fromDay, toDay] (qualquer ponta pode faltar). */
export function inDayRange(events, fromDay, toDay) {
  return (events || []).filter((e) => (!fromDay || e.day >= fromDay) && (!toDay || e.day <= toDay));
}

const actRnd = (n) => Math.random().toString(36).slice(2, 2 + n).padEnd(n, '0');
/** Apelido da máquina (localStorage 'nexus_device'); cria 'maq-xxxx' na primeira vez. */
export function getDeviceName(storage) {
  try {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    let v = st && st.getItem('nexus_device');
    if (!v) { v = 'maq-' + actRnd(4); if (st) st.setItem('nexus_device', v); }
    return v;
  } catch (e) { return 'maq-' + actRnd(4); }
}
export function setDeviceName(name, storage) {
  const v = String(name || '').trim().slice(0, 30);
  try { const st = storage || localStorage; if (v) st.setItem('nexus_device', v); else st.removeItem('nexus_device'); } catch (e) { /* sem storage */ }
  return v;
}
export const newTabId = () => actRnd(3);

/**
 * Escopos de origem: `begin({source,batchLabel,compared})` devolve `end()`; enquanto aberto, vale para os
 * diffs. O mais externo vale. `tag()` (chamado a cada setData) fixa o escopo vigente para o próximo diff —
 * assim o escopo pode terminar antes de o React confirmar a atualização.
 */
export function createScopeTracker() {
  const stack = [];
  let tagged = null, taggedAt = 0;
  return {
    /** `onEnd(scope)` roda quando o escopo fecha (o lote usa para emitir o evento único). */
    begin(opts, onEnd) {
      const o = opts || {};
      const scope = {
        source: o.source || 'manual', batchLabel: o.batchLabel || '', batchNoun: o.batchNoun || null,
        compared: o.compared != null ? o.compared : null,
        batchId: o.batchLabel ? 'b_' + Date.now().toString(36) + actRnd(4) : '',
        acc: [], next: null, ended: false, done: false, at: Date.now(),
      };
      stack.push(scope);
      const end = () => {
        const i = stack.indexOf(scope);
        if (i >= 0) stack.splice(i, 1);
        if (scope.ended) return;
        scope.ended = true;
        if (onEnd) onEnd(scope);
      };
      end.scope = scope;
      end.set = (patch) => { Object.assign(scope, patch || {}); };
      return end;
    },
    /** Escopo vigente (o mais externo). Escopo esquecido aberto por mais de 10 min é descartado. */
    current() {
      while (stack.length && Date.now() - stack[0].at > 600000) stack.shift();
      return stack[0] || null;
    },
    tag() { if (this.current()) { if (!tagged) tagged = stack[0]; taggedAt = Date.now(); } },
    /** Fixa um escopo já conhecido (o atualizador pode rodar depois de o escopo fechar). */
    tagScope(scope) { if (scope) { if (!tagged) tagged = scope; taggedAt = Date.now(); } },
    /** Escopo fixado pelo último setData (some se passou de `maxAgeMs`: setData sem efeito não deixa resíduo). */
    take(maxAgeMs = 3000) {
      const t = tagged && Date.now() - taggedAt <= maxAgeMs ? tagged : null;
      tagged = null;
      return t;
    },
  };
}

// ─── Armazenamento ──────────────────────────────────────────────────────────────────────────

const idbReq = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idbTxDone = (tx) => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });

function idbOpenActivity() {
  return new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') { rej(new Error('sem IndexedDB')); return; }
    let r;
    try { r = indexedDB.open(ACTIVITY_DB, 1); } catch (e) { rej(e); return; }
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore('outbox', { keyPath: 'id' });
      db.createObjectStore('local', { keyPath: 'id' }).createIndex('day', 'day');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error('IndexedDB bloqueado'));
  });
}

/**
 * Cria o armazenamento. Todas as operações são assíncronas e nunca lançam: falha de IndexedDB
 * troca para memória. `mode` é 'idb' ou 'memory'.
 */
export function createActivityStore(opts) {
  const o = opts || {};
  const mem = { outbox: new Map(), local: new Map() };
  let db = null, mode = 'memory', pending = 0;
  let chain = Promise.resolve();
  const ready = (o.forceMemory ? Promise.reject(new Error('memória')) : idbOpenActivity())
    .then((d) => { db = d; mode = 'idb'; })
    .catch(() => { mode = 'memory'; });

  // Operações em série: evita corrida entre enfileirar, enviar e podar.
  const run = (fn) => {
    const p = chain.then(() => ready).then(fn);
    chain = p.catch(() => {});
    return p;
  };
  const useMem = (e) => { if (mode === 'idb') console.error('nexus_trilha: caindo para memória', e); mode = 'memory'; };

  async function all(store) {
    if (mode === 'idb') {
      try { return await idbReq(db.transaction(store).objectStore(store).getAll()); } catch (e) { useMem(e); }
    }
    return [...mem[store].values()];
  }
  async function write(store, puts, dels) {
    if (mode === 'idb') {
      try {
        const tx = db.transaction(store, 'readwrite');
        const os = tx.objectStore(store);
        for (const id of dels || []) os.delete(id);
        for (const e of puts || []) os.put(e);
        await idbTxDone(tx);
        return;
      } catch (e) { useMem(e); }
    }
    for (const id of dels || []) mem[store].delete(id);
    for (const e of puts || []) mem[store].set(e.id, e);
  }
  const actByTs = (a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : a.id < b.id ? -1 : 1);

  const api = {
    get mode() { return mode; },
    ready,
    /** Fila de saída (cronológica). */
    getOutbox: () => run(async () => (await all('outbox')).sort(actByTs)),
    /** Enfileira: coalesce sobre o pendente + novos; grava no outbox e na cópia local. */
    enqueue: (events) => run(async () => {
      const novos = (events || []).filter((e) => e && e.id);
      if (!novos.length) return;
      const antigos = await all('outbox');
      const todos = [...antigos, ...novos].sort(actByTs);
      const { keep: merged, dropped } = pruneOutbox(coalesceOutbox(todos));
      if (dropped.length) console.warn('trilha: fila de envio podada (' + dropped.length + ' eventos antigos descartados)');
      const keep = new Set(merged.map((e) => e.id));
      const gone = [...new Set(todos.map((e) => e.id))].filter((id) => !keep.has(id));
      // grava só o que é novo ou mudou (coalescido); o resto já está no outbox e na cópia local
      const velho = new Map(antigos.map((e) => [e.id, e]));
      const mudou = merged.filter((e) => { const v = velho.get(e.id); return !v || v.ts !== e.ts || (v.coalesced || 0) !== (e.coalesced || 0); });
      await write('outbox', mudou, gone);
      await write('local', mudou, gone);
      pending = merged.length;
    }),
    /**
     * Remove do outbox o que foi enviado. Aceita ids ou eventos; evento só sai se ainda for idêntico
     * (`ts` e `coalesced`) — se foi coalescido durante o envio, a versão nova fica para o próximo ciclo.
     */
    removeOutbox: (sent) => run(async () => {
      const cur = new Map((await all('outbox')).map((e) => [e.id, e]));
      const ids = [];
      for (const x of sent || []) {
        if (x && typeof x === 'object') {
          const c = cur.get(x.id);
          if (c && c.ts === x.ts && (c.coalesced || 0) === (x.coalesced || 0)) ids.push(x.id);
        } else ids.push(x);
      }
      await write('outbox', [], ids);
      pending = cur.size - ids.filter((id) => cur.has(id)).length;
    }),
    /** Cópia local no intervalo de dias. */
    getLocal: (fromDay, toDay) => run(async () => inDayRange(await all('local'), fromDay, toDay)),
    getLocalById: (id) => run(async () => (await all('local')).find((e) => e.id === id) || null),
    /** Apaga da cópia local o que passou de 45 dias. */
    prune: (days = LOCAL_DAYS) => run(async () => {
      const list = await all('local');
      const keep = new Set(pruneByAge(list, days).map((e) => e.id));
      const gone = list.map((e) => e.id).filter((id) => !keep.has(id));
      if (gone.length) await write('local', [], gone);
      const ob = await all('outbox');
      const { dropped } = pruneOutbox(ob.sort(actByTs), { days });
      if (dropped.length) { await write('outbox', [], dropped.map((e) => e.id)); pending = ob.length - dropped.length; }
    }),
    /** Carrega a contagem de pendentes (uma vez, na abertura). */
    init: () => run(async () => { pending = (await all('outbox')).length; return pending; }),
    pendingCount: () => pending,
  };
  return api;
}

/**
 * Envia o outbox em lotes de até `maxBytes`. `send(lote)` devolve `{success, ...}` (ou rejeita).
 * Remove só os ids de lotes com success; parou no primeiro erro (mantém o resto para a próxima).
 * Devolve `{sent, left}`. Chamadas simultâneas são ignoradas.
 */
let _actFlushing = false;
export async function flushOutbox(store, send, maxBytes = MAX_BATCH_BYTES) {
  if (_actFlushing) return { sent: 0, left: store.pendingCount(), skipped: true };
  _actFlushing = true;
  let sent = 0;
  try {
    const pend = await store.getOutbox();
    for (const batch of splitBatches(pend, maxBytes)) {
      let r = null;
      try { r = await send(batch); } catch (e) { r = null; }
      if (r && r.success) {
        await store.removeOutbox(batch);
        sent += batch.length;
        continue;
      }
      // Sem resposta ou "tente de novo": para e tenta no próximo ciclo.
      if (!r || r.retry) break;
      // Recusa definitiva: manda um a um para isolar o evento problemático; o recusado sai da fila
      // (continua na cópia local) para não travar o resto para sempre.
      let stop = false;
      for (const ev of batch) {
        let r1 = null;
        try { r1 = await send([ev]); } catch (e) { r1 = null; }
        if (r1 && r1.success) { await store.removeOutbox([ev]); sent++; }
        else if (r1 && !r1.retry) { console.warn('trilha: evento recusado pelo servidor', ev.id, r1.error); await store.removeOutbox([ev]); }
        else { stop = true; break; }
      }
      if (stop) break;
    }
  } catch (e) {
    console.error('flushOutbox', e);
  } finally {
    _actFlushing = false;
  }
  return { sent, left: store.pendingCount() };
}
