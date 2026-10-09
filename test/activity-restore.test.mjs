import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { diffForActivity, interpretActivity, mergeRaw, planRestore } from '../src/lib/activity.js';

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); }
  return o;
}
const emptyState = () => ({
  operations: [], people: [], debts: [], executions: [], measures: [], assets: [], documents: [], prescriptionEvents: [],
  intimations: [], tasks: [], stickyNotes: [], watchlist: [], hearings: [], desk: [], models: [], importLogs: [], changeLog: [],
  calendar: { extraHolidays: [] }, links: { measurePeople: [], measureAssets: [], cdaResponsibilities: [] },
});
const T0 = '2026-10-08T15:00:00.000Z';
const events = (prev, next, extra) => interpretActivity(diffForActivity(prev, next), { ts: T0, device: 'pc1', next, ...(extra || {}) });
const OP = { id: 'op1', name: 'Operação Fictícia', briefing: { entries: [], processStageV2: {} } };
const EXEC = { id: 'ex1', operationId: 'op1', processNumber: '0000001-00.2024.4.99.0001', notesList: ['nota 1'] };
const CDA = { id: 'cda1', operationId: 'op1', executionId: 'ex1', cdaNumber: '80 6 24 000001-00', status: 'ativa', value: 100, notes: 'x' };
const base = () => ({ ...emptyState(), operations: [OP], executions: [EXEC], debts: [CDA] });
const edit = (s, col, id, patch) => ({ ...s, [col]: s[col].map((x) => (x.id === id ? { ...x, ...patch } : x)) });

describe('planRestore — campo', () => {
  it('volta só o campo do evento e preserva edição posterior em outro campo', () => {
    const p = base();
    const n = edit(p, 'debts', 'cda1', { status: 'quitada' });
    const [ev] = events(p, n);
    const atual = deepFreeze(edit(n, 'debts', 'cda1', { value: 999 }));
    const r = planRestore(ev, atual);
    assert.equal(r.conflicts.length, 0);
    assert.equal(r.applied, 1);
    assert.equal(r.data.debts[0].status, 'ativa');
    assert.equal(r.data.debts[0].value, 999);
    assert.equal(atual.debts[0].status, 'quitada'); // imutável
  });
  it('conflito quando o mesmo campo mudou depois; force aplica', () => {
    const p = base();
    const n = edit(p, 'debts', 'cda1', { status: 'quitada' });
    const [ev] = events(p, n);
    const atual = deepFreeze(edit(n, 'debts', 'cda1', { status: 'suspensa' }));
    const r = planRestore(ev, atual);
    assert.equal(r.applied, 0);
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].col, 'debts');
    assert.equal(r.data.debts[0].status, 'suspensa');
    const f = planRestore(ev, atual, { force: true });
    assert.equal(f.data.debts[0].status, 'ativa');
    assert.equal(f.conflicts.length, 0);
  });
  it('only restringe a um campo', () => {
    const p = base();
    const n = edit(p, 'debts', 'cda1', { status: 'quitada', value: 5 });
    const [ev] = events(p, n);
    const r = planRestore(ev, deepFreeze(n), { only: [{ col: 'debts', id: 'cda1', field: 'value' }] });
    assert.equal(r.data.debts[0].value, 100);
    assert.equal(r.data.debts[0].status, 'quitada');
  });
});

describe('planRestore — exclusão em cascata', () => {
  it('reinsere a CDA com o evento de prescrição e o vínculo que saíram junto', () => {
    const pe = { id: 'pe1', cdaId: 'cda1', executionId: 'ex1', type: 'citacao' };
    const lk = { id: 'r1', cdaId: 'cda1', personId: 'p1', role: 'originario' };
    const p = { ...base(), prescriptionEvents: [pe], links: { ...emptyState().links, cdaResponsibilities: [lk] } };
    const n = { ...p, debts: [], prescriptionEvents: [], links: emptyState().links };
    const ev = events(p, n).find((e) => e.action === 'excluir');
    assert.equal(ev.restore.items.length, 3);
    const atual = deepFreeze(n);
    const r = planRestore(ev, atual);
    assert.deepEqual(r.data.debts, [CDA]);
    assert.deepEqual(r.data.prescriptionEvents, [pe]);
    assert.deepEqual(r.data.links.cdaResponsibilities, [lk]);
    assert.equal(atual.debts.length, 0);
  });
  it('não duplica se o id já existe', () => {
    const p = base();
    const [ev] = events(p, { ...p, debts: [] });
    const r = planRestore(ev, deepFreeze(p));
    assert.equal(r.data.debts.length, 1);
    assert.equal(r.applied, 0);
  });
});

describe('planRestore — desfazer importação', () => {
  const novo = { id: 'cda9', operationId: 'op1', cdaNumber: '80 6 24 000009-00', status: 'ativa', value: 7 };
  const mk = () => {
    const p = base();
    const n = { ...p, debts: [{ ...CDA, value: 150 }, novo] };
    return { p, n, ev: events(p, n, { source: 'importacao', batchLabel: 'Importação SIDA', compared: 2 })[0] };
  };
  it('remove os criados e volta os alterados', () => {
    const { n, ev } = mk();
    const r = planRestore(ev, deepFreeze(n));
    assert.equal(r.conflicts.length, 0);
    assert.deepEqual(r.data.debts.map((d) => d.id), ['cda1']);
    assert.equal(r.data.debts[0].value, 100);
  });
  it('conflito se o criado foi editado depois', () => {
    const { n, ev } = mk();
    const atual = deepFreeze(edit(n, 'debts', 'cda9', { value: 8 }));
    const r = planRestore(ev, atual);
    assert.equal(r.conflicts.length, 1);
    assert.ok(r.data.debts.some((d) => d.id === 'cda9'));
    assert.equal(planRestore(ev, atual, { force: true }).data.debts.some((d) => d.id === 'cda9'), false);
  });
  it('ignora updatedAt ao comparar o criado', () => {
    const { n, ev } = mk();
    const atual = deepFreeze(edit(n, 'debts', 'cda9', { updatedAt: 'depois' }));
    assert.equal(planRestore(ev, atual).conflicts.length, 0);
  });
});

describe('planRestore — briefing por caminho', () => {
  const withBrief = (s, b) => ({ ...s, operations: [{ ...OP, briefing: { ...OP.briefing, ...b } }] });
  it('restaura só a entrada do diário e a fase', () => {
    const p = base();
    const e1 = { id: 'e1', html: '<p>texto</p>', eventDate: '2026-10-01' };
    const n1 = withBrief(p, { entries: [e1] });
    const [evNovo] = events(p, n1);
    assert.equal(planRestore(evNovo, deepFreeze(n1)).data.operations[0].briefing.entries.length, 0);
    const n2 = withBrief(p, { entries: [{ ...e1, html: '<p>novo</p>' }] });
    const [evEd] = events(n1, n2);
    assert.equal(planRestore(evEd, deepFreeze(n2)).data.operations[0].briefing.entries[0].html, '<p>texto</p>');
    const n3 = withBrief(p, { entries: [e1], processStageV2: { ex1: { citacao: { texto: 'a', outcome: 'x' } } } });
    const evF = events(n1, n3)[0];
    assert.ok(evF.restore.items[0].path.startsWith('briefing.processStageV2'));
    const r3 = planRestore(evF, deepFreeze(n3));
    assert.equal(r3.data.operations[0].briefing.processStageV2.ex1.citacao, undefined);
    assert.equal(r3.data.operations[0].briefing.entries.length, 1);
  });
  it('conflito quando a entrada mudou depois', () => {
    const p = base();
    const e1 = { id: 'e1', html: '<p>a</p>' };
    const n1 = withBrief(p, { entries: [e1] });
    const n2 = withBrief(p, { entries: [{ ...e1, html: '<p>b</p>' }] });
    const [ev] = events(n1, n2);
    const atual = deepFreeze(withBrief(p, { entries: [{ ...e1, html: '<p>c</p>' }] }));
    assert.equal(planRestore(ev, atual).conflicts.length, 1);
    assert.equal(planRestore(ev, atual, { force: true }).data.operations[0].briefing.entries[0].html, '<p>a</p>');
  });
});

describe('planRestore — vínculos e imutabilidade', () => {
  it('reinsere vínculo excluído sem mutar o estado', () => {
    const l = { measureId: 'm1', personId: 'p1' };
    const p = deepFreeze({ ...base(), links: { ...emptyState().links, measurePeople: [l] } });
    const n = deepFreeze({ ...p, links: { ...p.links, measurePeople: [] } });
    const [ev] = events(p, n);
    const r = planRestore(ev, n);
    assert.deepEqual(r.data.links.measurePeople, [l]);
    assert.equal(n.links.measurePeople.length, 0);
  });
});

describe('mergeRaw — vários commits de um lote', () => {
  it('criado e depois editado vira um create com o último estado; criado e excluído some', () => {
    const s0 = base();
    const s1 = { ...s0, debts: [...s0.debts, { id: 'n1', cdaNumber: 'N1', value: 1 }, { id: 'n2', cdaNumber: 'N2', value: 2 }] };
    const s2 = { ...s1, debts: s1.debts.map((d) => (d.id === 'n1' ? { ...d, value: 5 } : d)) };
    const s3 = { ...s2, debts: s2.debts.filter((d) => d.id !== 'n2').map((d) => (d.id === 'cda1' ? { ...d, value: 7 } : d)) };
    const raw = mergeRaw([...diffForActivity(s0, s1), ...diffForActivity(s1, s2), ...diffForActivity(s2, s3)]);
    const por = Object.fromEntries(raw.map((r) => [r.id, r]));
    assert.equal(raw.length, 2);
    assert.equal(por.n1.op, 'create');
    assert.equal(por.n1.after.value, 5);
    assert.equal(por.cda1.op, 'update');
    assert.equal(por.cda1.fields[0].to, 7);
    const [ev] = interpretActivity(raw, { ts: T0, device: 'pc1', next: s3, source: 'importacao', batchLabel: 'SIDA' });
    assert.equal(ev.restore.items.length, 2);
    const r = planRestore(ev, deepFreeze(s3));
    assert.equal(r.conflicts.length, 0);
    assert.equal(r.data.debts.length, 1);
    assert.equal(r.data.debts[0].value, 100);
  });
  it('ida-e-volta não gera nada', () => {
    const s0 = base();
    const s1 = edit(s0, 'debts', 'cda1', { value: 1 });
    const s2 = edit(s1, 'debts', 'cda1', { value: 100 });
    assert.deepEqual(mergeRaw([...diffForActivity(s0, s1), ...diffForActivity(s1, s2)]), []);
  });
});
