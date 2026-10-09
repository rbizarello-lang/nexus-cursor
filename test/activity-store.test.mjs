import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pruneOutbox, createActivityStore, createScopeTracker, flushOutbox, getDeviceName, inDayRange, mergeEvents, pruneByAge, splitBatches } from '../src/lib/activity-store.js';

const ev = (id, ts, extra) => ({ id, ts, day: ts.slice(0, 10), summary: id, restore: { items: [] }, ...(extra || {}) });

describe('splitBatches', () => {
  it('divide por tamanho e preserva a ordem', () => {
    const list = Array.from({ length: 10 }, (_, i) => ev('e' + i, '2026-10-08T10:00:0' + i + 'Z', { pad: 'x'.repeat(100) }));
    const lotes = splitBatches(list, 400);
    assert.ok(lotes.length > 1);
    assert.deepEqual(lotes.flat().map((e) => e.id), list.map((e) => e.id));
    for (const l of lotes) assert.ok(JSON.stringify(l).length <= 400 + 150);
  });
  it('evento maior que o limite vai sozinho; vazio gera zero lotes', () => {
    const grande = ev('g', '2026-10-08T10:00:00Z', { pad: 'x'.repeat(1000) });
    assert.deepEqual(splitBatches([ev('a', '2026-10-08T10:00:00Z'), grande, ev('b', '2026-10-08T10:00:01Z')], 300).map((l) => l.map((e) => e.id)), [['a'], ['g'], ['b']]);
    assert.deepEqual(splitBatches([]), []);
  });
});

describe('pruneByAge', () => {
  it('descarta o que passou de 45 dias', () => {
    const now = Date.parse('2026-10-08T12:00:00Z');
    const list = [ev('novo', '2026-10-01T12:00:00Z'), ev('limite', '2026-08-24T12:00:00Z'), ev('velho', '2026-08-23T11:00:00Z'), { id: 'semts' }];
    assert.deepEqual(pruneByAge(list, 45, now).map((e) => e.id), ['novo', 'limite']);
  });
});

describe('mergeEvents', () => {
  it('não duplica por id, prefere a cópia completa e ordena desc por ts', () => {
    const leve = ev('a', '2026-10-08T10:00:00Z');
    const cheio = ev('a', '2026-10-08T10:00:00Z', { restore: { items: [{ col: 'debts', id: 'x' }] } });
    const out = mergeEvents([leve, ev('b', '2026-10-08T11:00:00Z')], [cheio, ev('c', '2026-10-07T09:00:00Z')]);
    assert.deepEqual(out.map((e) => e.id), ['b', 'a', 'c']);
    assert.equal(out[1].restore.items.length, 1);
  });
  it('aceita listas ausentes', () => {
    assert.deepEqual(mergeEvents(null, undefined, []), []);
  });
});

describe('inDayRange', () => {
  it('filtra por dia', () => {
    const l = [ev('a', '2026-10-06T10:00:00Z'), ev('b', '2026-10-07T10:00:00Z'), ev('c', '2026-10-09T10:00:00Z')];
    assert.deepEqual(inDayRange(l, '2026-10-07', '2026-10-08').map((e) => e.id), ['b']);
    assert.equal(inDayRange(l).length, 3);
  });
});

describe('escopos de origem', () => {
  it('o mais externo vale; tag fixa o escopo mesmo após end()', () => {
    const t = createScopeTracker();
    assert.equal(t.current(), null);
    const e1 = t.begin({ source: 'importacao', batchLabel: 'Importação SIDA' });
    const e2 = t.begin({ source: 'automatico' });
    assert.equal(t.current().source, 'importacao');
    t.tag();
    e2(); e1();
    assert.equal(t.current(), null);
    const s = t.take();
    assert.equal(s.batchLabel, 'Importação SIDA');
    assert.ok(s.batchId);
    assert.equal(t.take(), null);
  });
  it('tag velho demais é ignorado (setData sem efeito não deixa resíduo)', () => {
    const t = createScopeTracker();
    const end = t.begin({ source: 'automatico' });
    t.tag();
    end();
    assert.equal(t.take(-1), null);
  });
  it('set atualiza o total comparado', () => {
    const t = createScopeTracker();
    const end = t.begin({ source: 'importacao', batchLabel: 'X' });
    end.set({ compared: 63 });
    assert.equal(t.current().compared, 63);
    end();
  });
});

describe('apelido da máquina', () => {
  it('gera maq-xxxx e mantém', () => {
    const m = new Map();
    const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
    const a = getDeviceName(st);
    assert.match(a, /^maq-[a-z0-9]{4}$/);
    assert.equal(getDeviceName(st), a);
  });
});

describe('armazenamento (memória) e envio', () => {
  const edit = (id, ts, to) => ({
    v: 1, id, ts, day: ts.slice(0, 10), action: 'editar', source: 'manual', batch: null,
    entity: { type: 'debts', id: 'cda1', col: 'debts', label: '80 6 24' },
    changes: [{ f: 'status', label: 'situação', from: 'ativa', to }], textChanges: [],
    restore: { items: [{ col: 'debts', id: 'cda1', before: { id: 'cda1', status: 'ativa' }, after: { id: 'cda1', status: to } }] },
  });
  it('enfileira com coalesce e grava no local; envia e remove só o enviado', async () => {
    const st = createActivityStore({ forceMemory: true });
    await st.enqueue([edit('a', '2026-10-08T10:00:00.000Z', 'suspensa')]);
    await st.enqueue([edit('b', '2026-10-08T10:01:00.000Z', 'quitada')]);
    const out = await st.getOutbox();
    assert.equal(out.length, 1);
    assert.equal(out[0].changes[0].to, 'quitada');
    assert.equal(st.pendingCount(), 1);
    assert.equal((await st.getLocal('2026-10-08', '2026-10-08')).length, 1);
    const enviados = [];
    const r = await flushOutbox(st, async (lote) => { enviados.push(lote.map((e) => e.id)); return { success: true }; });
    assert.equal(r.sent, 1);
    assert.deepEqual(enviados, [['a']]);
    assert.equal(st.pendingCount(), 0);
    assert.equal((await st.getLocal()).length, 1); // a cópia local continua
  });
  it('recusa definitiva isola o evento ruim e não trava o resto da fila', async () => {
    const st = createActivityStore({ forceMemory: true });
    await st.enqueue([edit('a', '2026-10-08T10:00:00.000Z', 'suspensa')]);
    await st.enqueue([edit('b', '2026-10-08T11:00:00.000Z', 'quitada')]);
    assert.equal(st.pendingCount(), 2);
    const r = await flushOutbox(st, async (lote) => (lote.some((e) => e.id === 'a') ? { success: false, error: 'inválido' } : { success: true }));
    assert.equal(r.sent, 1);
    assert.equal(st.pendingCount(), 0);
    assert.equal((await st.getLocal()).length, 2); // o recusado continua na cópia local
  });
  it('erro mantém no outbox; ida-e-volta é descartada também do local', async () => {
    const st = createActivityStore({ forceMemory: true });
    await st.enqueue([edit('a', '2026-10-08T10:00:00.000Z', 'suspensa')]);
    const r = await flushOutbox(st, async () => ({ success: false, retry: true }));
    assert.equal(r.sent, 0);
    assert.equal(st.pendingCount(), 1);
    const st2 = createActivityStore({ forceMemory: true });
    await st2.enqueue([edit('a', '2026-10-08T10:00:00.000Z', 'suspensa')]);
    await st2.enqueue([edit('b', '2026-10-08T10:01:00.000Z', 'ativa')]);
    assert.equal((await st2.getOutbox()).length, 0);
    assert.equal((await st2.getLocal()).length, 0);
  });
  it('poda a cópia local por idade', async () => {
    const st = createActivityStore({ forceMemory: true });
    const velho = { ...edit('v', '2020-01-01T10:00:00.000Z', 'x'), entity: { type: 'debts', id: 'outra' } };
    await st.enqueue([velho, edit('n', new Date().toISOString(), 'y')]);
    await st.prune(45);
    assert.deepEqual((await st.getLocal()).map((e) => e.id), ['n']);
  });
});

describe('fila: poda, remoção segura e escopo', () => {
  it('pruneOutbox descarta por idade e por quantidade (mais antigos primeiro)', () => {
    const now = Date.parse('2026-10-08T12:00:00Z');
    const lista = [ev('velho', '2026-08-01T00:00:00Z'), ev('a', '2026-10-01T00:00:00Z'), ev('b', '2026-10-02T00:00:00Z'), ev('c', '2026-10-03T00:00:00Z')];
    assert.deepEqual(pruneOutbox(lista, { nowMs: now }).keep.map((e) => e.id), ['a', 'b', 'c']);
    assert.deepEqual(pruneOutbox(lista, { nowMs: now, maxEvents: 2 }).keep.map((e) => e.id), ['b', 'c']);
    assert.deepEqual(pruneOutbox(lista, { nowMs: now, maxBytes: 1 }).keep.length, 0);
  });
  it('removeOutbox não apaga a versão coalescida durante o envio', async () => {
    const st = createActivityStore({ forceMemory: true });
    const e = (id, ts, to) => ({
      v: 1, id, ts, day: ts.slice(0, 10), action: 'editar', source: 'manual', batch: null,
      entity: { type: 'debts', id: 'c1', col: 'debts', label: 'x' }, changes: [{ f: 'status', from: 'ativa', to }], textChanges: [],
      restore: { items: [{ col: 'debts', id: 'c1', before: { id: 'c1', status: 'ativa' }, after: { id: 'c1', status: to } }] },
    });
    await st.enqueue([e('a', '2026-10-08T10:00:00.000Z', 'suspensa')]);
    const enviado = await st.getOutbox();
    await st.enqueue([e('b', '2026-10-08T10:01:00.000Z', 'quitada')]); // coalesce no mesmo id 'a'
    await st.removeOutbox(enviado);
    const resto = await st.getOutbox();
    assert.equal(resto.length, 1);
    assert.equal(resto[0].changes[0].to, 'quitada');
  });
  it('tagScope fixa o escopo mesmo depois de fechado; sem tag, take é nulo', () => {
    const t = createScopeTracker();
    const end = t.begin({ source: 'automatico' });
    const sc = end.scope;
    assert.equal(t.take(), null);
    end();
    t.tagScope(sc);
    assert.equal(t.take(), sc);
  });
});
