import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { TRACKED_COLLECTIONS, coalesceOutbox, dayKey, diffForActivity, interpretActivity, systemEvent } from '../src/lib/activity.js';

// ─── helpers ────────────────────────────────────────────────────────────────────────────────
function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const k of Object.keys(o)) deepFreeze(o[k]);
  }
  return o;
}
const emptyState = () => ({
  operations: [], people: [], debts: [], executions: [], measures: [], assets: [], documents: [], prescriptionEvents: [],
  intimations: [], tasks: [], stickyNotes: [], watchlist: [], hearings: [], desk: [], models: [], importLogs: [], changeLog: [],
  calendar: { extraHolidays: [] }, links: { measurePeople: [], measureAssets: [], cdaResponsibilities: [] },
});
const T0 = '2026-10-08T15:00:00.000Z';
const ctxOf = (next, extra) => ({ ts: T0, device: 'pc1', next, ...(extra || {}) });
const run = (prev, next, extra) => interpretActivity(diffForActivity(prev, next), ctxOf(next, extra));
const OP = { id: 'op1', name: 'Operação Fictícia', briefing: { entries: [], processStageV2: {} } };
const EXEC = { id: 'ex1', operationId: 'op1', processNumber: '0000001-00.2024.4.99.0001', notesList: ['nota 1'] };
const CDA = { id: 'cda1', operationId: 'op1', cdaNumber: '80 6 24 000001-00', status: 'ativa', value: 100, processNumber: EXEC.processNumber };
const base = () => ({ ...emptyState(), operations: [OP], executions: [EXEC], debts: [CDA] });
const withCol = (s, col, list) => ({ ...s, [col]: list });
const replaceId = (arr, id, fn) => arr.map((x) => (x.id === id ? fn(x) : x));

describe('diff — referência e campos ignorados', () => {
  it('mesma referência não gera nada', () => {
    const s = deepFreeze(base());
    assert.deepEqual(diffForActivity(s, s), []);
    assert.deepEqual(run(s, s), []);
  });
  it('save sem mudança real (só updatedAt) não gera evento', () => {
    const p = deepFreeze(base());
    const n = withCol(p, 'debts', replaceId(p.debts, 'cda1', (d) => ({ ...d, updatedAt: 'x', createdAt: 'y', lastAccessed: 'z', seen: true, prescriptionSnapshot: { a: 1 }, mesaCard: { card: 'ajuizar', ord: 0 }, _flag: 1 })));
    assert.deepEqual(diffForActivity(p, n), []);
    assert.deepEqual(run(p, n), []);
  });
  it('ausente trocado por vazio não gera evento', () => {
    const p = deepFreeze(base());
    const n = withCol(p, 'debts', replaceId(p.debts, 'cda1', (d) => ({ ...d, tribute: '', notesList: [] })));
    assert.deepEqual(diffForActivity(p, n), []);
  });
  it('lista recriada com itens idênticos (outras referências) não gera nada', () => {
    const p = deepFreeze(base());
    const n = withCol(p, 'debts', JSON.parse(JSON.stringify(p.debts)));
    assert.deepEqual(diffForActivity(p, n), []);
  });
  it('coleções não rastreadas são ignoradas', () => {
    const p = deepFreeze(base());
    const n = { ...p, desk: [{ id: 'd', type: 'task' }], models: [{ id: 'm' }], changeLog: [{ id: 'c' }], importLogs: [{ id: 'i' }], calendar: { extraHolidays: ['2026-01-01'] } };
    assert.deepEqual(diffForActivity(p, n), []);
  });
});

describe('criar/editar/excluir em cada coleção rastreada', () => {
  const SAMPLES = {
    operations: { id: 'o9', name: 'Op nova' },
    people: { id: 'p9', operationId: 'op1', name: 'Fulano Fictício' },
    debts: { id: 'c9', operationId: 'op1', cdaNumber: '80 6 24 000009-00', status: 'ativa', value: 5 },
    executions: { id: 'e9', operationId: 'op1', processNumber: '0000009-00.2024.4.99.0001' },
    measures: { id: 'm9', operationId: 'op1', title: 'Sisbajud', status: 'pendente' },
    assets: { id: 'a9', operationId: 'op1', description: 'Imóvel fictício', status: 'liberado' },
    documents: { id: 'd9', operationId: 'op1', title: 'Petição' },
    prescriptionEvents: { id: 'pv9', operationId: 'op1', cdaId: 'c9', type: 'int_citacao' },
    intimations: { id: 'i9', operationId: 'op1', processNumber: '0000009-00.2024.4.99.0001', eventDescription: 'Manifestar', status: 'pendente_analise' },
    tasks: { id: 't9', operationId: 'op1', title: 'Fazer algo', status: 'pendente' },
    stickyNotes: { id: 's9', operationId: 'op1', content: 'lembrar do prazo' },
    watchlist: { id: 'w9', operationId: 'op1', title: 'Acompanhar' },
    hearings: { id: 'h9', operationId: 'op1', title: 'Audiência', date: '2026-11-01' },
  };
  const EDIT = { operations: 'name', people: 'name', debts: 'status', executions: 'court', measures: 'status', assets: 'status', documents: 'title', prescriptionEvents: 'type', intimations: 'status', tasks: 'priority', stickyNotes: 'color', watchlist: 'title', hearings: 'date' };
  for (const col of TRACKED_COLLECTIONS) {
    it(col, () => {
      const item = SAMPLES[col];
      const p = deepFreeze(emptyState());
      const created = deepFreeze(withCol(p, col, [item]));
      let ev = run(p, created);
      assert.equal(ev.length, 1);
      assert.equal(ev[0].action, 'criar');
      assert.equal(ev[0].restore.items[0].before, null);
      assert.equal(ev[0].restore.items[0].after.id, item.id);
      assert.equal(ev[0].v, 1);
      const edited = deepFreeze(withCol(created, col, [{ ...item, [EDIT[col]]: 'novo-valor' }]));
      ev = run(created, edited);
      assert.equal(ev.length, 1);
      assert.equal(ev[0].action, 'editar');
      assert.equal(ev[0].restore.items[0].before[EDIT[col]], item[EDIT[col]]);
      assert.equal(ev[0].restore.items[0].after[EDIT[col]], 'novo-valor');
      ev = run(edited, deepFreeze(withCol(edited, col, [])));
      assert.equal(ev.length, 1);
      assert.equal(ev[0].action, 'excluir');
      assert.equal(ev[0].restore.items[0].before[EDIT[col]], 'novo-valor');
      assert.equal(ev[0].restore.items[0].after, null);
    });
  }
  it('evento tem o esquema completo e id ordenável', () => {
    const p = deepFreeze(base());
    const n = deepFreeze(withCol(p, 'debts', replaceId(p.debts, 'cda1', (d) => ({ ...d, status: 'suspensa' }))));
    const [ev] = run(p, n, { labels: { status: { debts: { ativa: 'Ativa', suspensa: 'Suspensa' } } } });
    assert.equal(ev.summary, 'Alterou situação da CDA 80 6 24 000001-00: Ativa → Suspensa');
    assert.equal(ev.kind, 'cda');
    assert.equal(ev.minor, false);
    assert.deepEqual(ev.op, { id: 'op1', name: 'Operação Fictícia' });
    assert.equal(ev.entity.proc, EXEC.processNumber);
    assert.equal(ev.source, 'manual');
    assert.equal(ev.day, '2026-10-08');
    assert.equal(ev.batch, null);
    assert.match(ev.id, /^ev_[0-9a-z]{9}_pc1_[0-9a-z]{4}$/);
    const [ev2] = run(p, n, { ts: '2026-10-08T16:00:00.000Z' });
    assert.ok(ev2.id > ev.id);
  });
  it('campo comum sem relevância é ajuste menor', () => {
    const p = deepFreeze(base());
    const n = deepFreeze(withCol(p, 'executions', replaceId(p.executions, 'ex1', (e) => ({ ...e, court: '1ª Vara' }))));
    const [ev] = run(p, n);
    assert.equal(ev.minor, true);
  });
});

describe('briefing', () => {
  const entry = (id, html) => ({ id, type: 'nota', html, pinned: false, eventDate: '2026-10-01', createdAt: 'a', updatedAt: 'a' });
  const opWith = (b) => ({ ...OP, briefing: { ...OP.briefing, ...b } });
  const st = (op) => ({ ...base(), operations: [op] });

  it('nova entrada de diário', () => {
    const p = deepFreeze(st(opWith({ entries: [] })));
    const n = deepFreeze(st(opWith({ entries: [entry('e1', '<p>Primeiro registro</p>')] })));
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'diario');
    assert.equal(ev[0].action, 'criar');
    assert.equal(ev[0].textChanges[0].to, '<p>Primeiro registro</p>');
    assert.equal(ev[0].textChanges[0].format, 'html');
    assert.equal(ev[0].minor, false);
  });
  it('edição de entrada com texto integral antes/depois; exclusão', () => {
    const e1 = entry('e1', '<p>Texto original completo</p>');
    const p = deepFreeze(st(opWith({ entries: [e1] })));
    const n = deepFreeze(st(opWith({ entries: [{ ...e1, html: '<p>Texto original completo e ampliado</p>', updatedAt: 'b' }] })));
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].action, 'editar');
    assert.equal(ev[0].textChanges[0].from, '<p>Texto original completo</p>');
    assert.equal(ev[0].textChanges[0].to, '<p>Texto original completo e ampliado</p>');
    assert.equal(ev[0].restore.items[0].path, 'briefing.entries[e1]');
    const del = run(n, deepFreeze(st(opWith({ entries: [] }))));
    assert.equal(del[0].action, 'excluir');
    assert.equal(del[0].textChanges[0].from, '<p>Texto original completo e ampliado</p>');
    assert.equal(del[0].restore.items[0].before.id, 'e1');
  });
  it('3 edições seguidas do mesmo diário = 3 eventos, cada um com antes/depois corretos', () => {
    const versions = ['v0', 'v1 mais texto', 'v2 ainda mais texto', 'v3 final'].map((t) => `<p>${t}</p>`);
    const states = versions.map((h) => deepFreeze(st(opWith({ entries: [entry('e1', h)] }))));
    const evs = [];
    for (let i = 1; i < states.length; i++) evs.push(...run(states[i - 1], states[i]));
    assert.equal(evs.length, 3);
    evs.forEach((e, i) => {
      assert.equal(e.textChanges[0].from, versions[i]);
      assert.equal(e.textChanges[0].to, versions[i + 1]);
    });
    assert.equal(new Set(evs.map((e) => e.id)).size, 3);
  });
  it('conversão do diário antigo ao salvar não vira evento; só a entrada editada', () => {
    const OP0 = { ...OP, briefing: { risks: 'Risco antigo' } };
    const legacy = { id: 'L1', title: 'Estratégia', body: 'Texto <antigo>', updatedAt: '2026-01-01T00:00:00Z' };
    const p = deepFreeze({ ...base(), operations: [{ ...OP0, briefing: { ...OP0.briefing, entries: [legacy, { id: 'e9', type: 'observacao', html: 'Velho' }] } }] });
    const n = deepFreeze({ ...base(), operations: [{ ...OP0, briefing: { ...OP0.briefing, entries: [
      { id: 'L1', type: 'estrategia', html: 'Texto &lt;antigo&gt;', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-10-08T12:00:00Z', migrated: true },
      { id: 'e9', type: 'observacao', html: 'Novo' },
    ] } }] });
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].textChanges[0].to, 'Novo');
    // primeira gravação: risks vira legacy_risks, sem evento de criação
    const p2 = deepFreeze({ ...base(), operations: [OP0] });
    const n2 = deepFreeze({ ...base(), operations: [{ ...OP0, briefing: { ...OP0.briefing, entries: [{ id: 'legacy_risks', type: 'risco', html: 'Risco antigo', migrated: true }] } }] });
    assert.equal(run(p2, n2).length, 0);
  });
  it('fase criada/alterada; com outcome vira decisão', () => {
    const p = deepFreeze(st(opWith({ processStageV2: {} })));
    const n1 = deepFreeze(st(opWith({ processStageV2: { ex1: { citacao: { date: '2026-09-01', texto: 'Citado' } } } })));
    let ev = run(p, n1);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'frente');
    assert.equal(ev[0].textChanges[0].to, 'Citado');
    assert.match(ev[0].summary, /fase citacao do processo 0000001-00/);
    const n2 = deepFreeze(st(opWith({ processStageV2: { ex1: { citacao: { date: '2026-09-01', texto: 'Citado', outcome: 'positiva' } } } })));
    ev = run(n1, n2);
    assert.equal(ev[0].kind, 'decisao');
    assert.equal(ev[0].minor, false);
    assert.equal(ev[0].entity.proc, EXEC.processNumber);
    assert.equal(ev[0].restore.items[0].path, 'briefing.processStageV2.ex1.citacao');
  });
  it('mudança de campo da operação e de diário no mesmo commit viram eventos separados', () => {
    const p = deepFreeze(st(opWith({ entries: [] })));
    const n = deepFreeze(st({ ...opWith({ entries: [entry('e1', '<p>x</p>')] }), name: 'Outro nome' }));
    const ev = run(p, n);
    assert.equal(ev.length, 2);
    assert.deepEqual(ev.map((e) => e.kind).sort(), ['diario', 'operacao']);
  });
});

describe('links', () => {
  it('vínculo criado/removido (sem id: chave = combinação)', () => {
    const p = deepFreeze(base());
    const n = deepFreeze({ ...p, links: { ...p.links, measurePeople: [{ measureId: 'm1', personId: 'p1' }] } });
    let ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'vinculo');
    assert.equal(ev[0].action, 'criar');
    assert.equal(ev[0].minor, true);
    ev = run(n, deepFreeze({ ...n, links: { ...n.links, measurePeople: [] } }));
    assert.equal(ev[0].action, 'excluir');
    assert.equal(ev[0].restore.items[0].before.personId, 'p1');
    const na = deepFreeze({ ...p, links: { ...p.links, measureAssets: [{ measureId: 'm1', assetId: 'a1' }], cdaResponsibilities: [{ id: 'r1', cdaId: 'cda1', personId: 'p1', role: 'devedor' }] } });
    assert.equal(run(p, na).length, 2);
  });
});

describe('correlação do mesmo ato', () => {
  it('resposta a intimação (intimação + nota + documento) = 1 evento', () => {
    const i2 = { id: 'in1', operationId: 'op1', processNumber: '0000001-00.2024.4.99.0001', eventDescription: 'Contrarrazões', status: 'pendente_analise' };
    const p = deepFreeze({ ...base(), intimations: [i2] });
    const action = { type: 'peticionamento', peticionType: 'Contrarrazões', description: 'Protocolada a peça', respondedAt: T0 };
    const n = deepFreeze({
      ...p,
      intimations: [{ ...i2, status: 'respondida', responseAction: action, _importFlag: null, updatedAt: T0 }],
      executions: [{ ...EXEC, notesList: [...EXEC.notesList, 'Peticionou contrarrazões'] }],
      documents: [{ id: 'doc9', operationId: 'op1', title: 'Peticionamento', sourceIntimationId: 'in1' }],
    });
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'intimacao');
    assert.equal(ev[0].action, 'registrar');
    assert.match(ev[0].summary, /^Registrou peticionamento \(Contrarrazões\) na intimação/);
    assert.equal(ev[0].restore.items.length, 3);
    assert.ok(ev[0].textChanges.some((t) => t.f === 'notesList' && t.to.includes('Peticionou contrarrazões') && t.from === 'nota 1'));
  });
  it('atuação proativa (proactiveActions + nota + documento) = 1 evento', () => {
    const act = { id: 'pa-1', date: '2026-10-08', summary: 'Requereu penhora de imóvel', pecaText: 'Texto da peça', pecaUrl: 'https://x.test/p', createdAt: T0 };
    const p = deepFreeze(base());
    const n = deepFreeze({
      ...p,
      executions: [{ ...EXEC, notesList: [...EXEC.notesList, 'Atuação proativa registrada'], proactiveActions: [act] }],
      documents: [{ id: 'doc-pa-1', operationId: 'op1', title: 'Atuação proativa', sourceActionType: 'proativa' }],
    });
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'atuacao');
    assert.equal(ev[0].restore.items.length, 2);
    assert.equal(ev[0].textChanges.find((t) => t.f === 'proactiveActions.pecaText').to, 'Texto da peça');
  });
  it('exclusão em cascata = 1 evento com os itens no restore', () => {
    const p = deepFreeze({
      ...base(),
      debts: [CDA, { ...CDA, id: 'cda2', cdaNumber: 'B' }],
      prescriptionEvents: [{ id: 'pv1', operationId: 'op1', cdaId: 'cda1', type: 'int_citacao' }],
      people: [{ id: 'pe1', operationId: 'op1', name: 'Parte' }],
      assets: [{ id: 'as1', operationId: 'op1', description: 'Bem', holderId: 'pe1', status: 'liberado' }],
      links: { measurePeople: [], measureAssets: [], cdaResponsibilities: [{ id: 'r1', cdaId: 'cda1', personId: 'pe1', role: 'x' }] },
    });
    const n = deepFreeze({ ...emptyState(), operations: [] });
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].action, 'excluir');
    assert.equal(ev[0].kind, 'operacao');
    assert.equal(ev[0].summary, 'Excluiu a operação Operação Fictícia e 6 itens vinculados');
    const ids = ev[0].restore.items.map((r) => r.col + ':' + r.id).sort();
    assert.deepEqual(ids, ['assets:as1', 'debts:cda1', 'debts:cda2', 'executions:ex1', 'links.cdaResponsibilities:r1', 'operations:op1', 'people:pe1', 'prescriptionEvents:pv1']);
  });
  it('excluir CDA com seus eventos e vínculo; referências limpas entram no restore', () => {
    const p = deepFreeze({
      ...base(),
      people: [{ id: 'pe1', operationId: 'op1', name: 'Parte' }],
      prescriptionEvents: [{ id: 'pv1', operationId: 'op1', cdaId: 'cda1', type: 'x' }, { id: 'pv2', operationId: 'op1', cdaId: 'cdaX', type: 'y' }],
      links: { measurePeople: [], measureAssets: [], cdaResponsibilities: [{ id: 'r1', cdaId: 'cda1', personId: 'pe1', role: 'x' }] },
    });
    const n = deepFreeze({ ...p, debts: [], prescriptionEvents: [p.prescriptionEvents[1]], links: { ...p.links, cdaResponsibilities: [] } });
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].summary, 'Excluiu a CDA 80 6 24 000001-00 e 1 item vinculado');
    assert.equal(ev[0].restore.items.length, 3);
    const q = deepFreeze({ ...base(), executions: [EXEC, { id: 'ex2', operationId: 'op1', processNumber: 'filho', parentExecutionId: 'ex1' }] });
    const m = deepFreeze({ ...q, executions: [{ ...q.executions[1], parentExecutionId: null }] });
    const ev2 = run(q, m);
    assert.equal(ev2.length, 1);
    assert.equal(ev2[0].restore.items.length, 2);
  });
});

describe('constrição e tarefa', () => {
  it('bem criado já indisponível → constricao', () => {
    const p = deepFreeze(base());
    const n = deepFreeze(withCol(p, 'assets', [{ id: 'a1', operationId: 'op1', description: 'Imóvel X', status: 'indisponibilidade_ativa' }]));
    const [ev] = run(p, n, { labels: { status: { assets: { status: { indisponibilidade_ativa: 'Indisponibilidade Ativa' } } } } });
    assert.equal(ev.kind, 'constricao');
    assert.equal(ev.summary, 'Registrou constrição: Imóvel X (Indisponibilidade Ativa)');
    assert.equal(ev.minor, false);
  });
  it('bem com status alterado para indisponibilidade → constricao', () => {
    const p = deepFreeze(withCol(base(), 'assets', [{ id: 'a1', operationId: 'op1', description: 'Imóvel X', status: 'controvertido' }]));
    const n = deepFreeze(withCol(p, 'assets', [{ ...p.assets[0], status: 'indisponibilidade_requerida' }]));
    const [ev] = run(p, n);
    assert.equal(ev.kind, 'constricao');
    assert.equal(ev.action, 'editar');
    const n2 = deepFreeze(withCol(p, 'assets', [{ ...p.assets[0], registry: '45.678' }]));
    assert.equal(run(p, n2)[0].kind, 'bem');
  });
  it('tarefa concluída/reaberta', () => {
    const p = deepFreeze(withCol(base(), 'tasks', [{ id: 't1', operationId: 'op1', title: 'Peticionar', status: 'pendente' }]));
    const n = deepFreeze(withCol(p, 'tasks', [{ ...p.tasks[0], status: 'concluida', completedAt: T0 }]));
    const [ev] = run(p, n);
    assert.equal(ev.action, 'concluir');
    assert.equal(ev.minor, false);
    assert.equal(run(n, p)[0].action, 'reabrir');
  });
});

describe('lote, rede de segurança e substituição', () => {
  const many = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  it('importação = 1 evento com contagens, details e restore.items', () => {
    const debts = many(63, (i) => ({ id: 'c' + i, operationId: 'op1', cdaNumber: 'CDA' + i, status: 'ativa', value: i }));
    const p = deepFreeze({ ...base(), debts });
    const n = deepFreeze({ ...p, debts: [...debts.map((d, i) => (i < 7 ? { ...d, status: 'suspensa' } : d)), { id: 'cNew', operationId: 'op1', cdaNumber: 'NOVA', status: 'ativa' }] });
    const ev = run(p, n, { source: 'importacao', batchLabel: 'SIDA', compared: 63, batchNoun: { s: 'CDA', p: 'CDAs', f: true } });
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'importacao');
    assert.equal(ev[0].action, 'importar');
    assert.equal(ev[0].summary, 'Importação SIDA: 63 CDAs comparadas, 7 alteradas, 1 nova');
    assert.equal(ev[0].batch.count, 8);
    assert.equal(ev[0].batch.stats.update, 7);
    assert.equal(ev[0].batch.details.length, 8);
    assert.equal(ev[0].restore.items.length, 8);
    assert.equal(ev[0].restore.items[0].before.status, 'ativa');
    assert.equal(ev[0].restore.items[0].after.status, 'suspensa');
  });
  it('detalhes limitados a 2000, restore completo', () => {
    const p = deepFreeze(emptyState());
    const n = deepFreeze(withCol(p, 'debts', many(2500, (i) => ({ id: 'c' + i, cdaNumber: 'x' + i }))));
    const [ev] = run(p, n, { source: 'importacao', batchLabel: 'X' });
    assert.equal(ev.batch.details.length, 2000);
    assert.equal(ev.restore.items.length, 2500);
  });
  it('ctx.replaced → 1 evento de sistema sem detalhes', () => {
    const p = deepFreeze(base());
    const n = deepFreeze({ ...base(), debts: [], executions: [] });
    const ev = run(p, n, { replaced: 'Dados carregados da nuvem' });
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'sistema');
    assert.equal(ev[0].action, 'carregar');
    assert.equal(ev[0].summary, 'Dados carregados da nuvem');
    assert.equal(ev[0].restore.items.length, 0);
    assert.equal(systemEvent('Reset', { ts: T0 }).kind, 'sistema');
  });
  it('mais de 200 criações num commit sem lote → 1 evento de sistema', () => {
    const p = deepFreeze(emptyState());
    const n = deepFreeze(withCol(p, 'debts', many(201, (i) => ({ id: 'c' + i }))));
    const ev = run(p, n);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'sistema');
    const n2 = deepFreeze(withCol(p, 'debts', many(200, (i) => ({ id: 'c' + i }))));
    assert.equal(run(p, n2).length, 200);
  });
  it('texto acima de 200 KB é truncado com flag', () => {
    const big = 'a'.repeat(250 * 1024);
    const p = deepFreeze(withCol(base(), 'tasks', [{ id: 't1', operationId: 'op1', title: 'x', description: 'curto' }]));
    const n = deepFreeze(withCol(p, 'tasks', [{ ...p.tasks[0], description: big }]));
    const [ev] = run(p, n);
    assert.equal(ev.textChanges[0].truncated, true);
    assert.equal(ev.textChanges[0].to.length, 200 * 1024);
  });
});

describe('coalesceOutbox', () => {
  const edit = (from, to, ts) => {
    const p = deepFreeze(withCol(base(), 'debts', [{ ...CDA, status: from }]));
    const n = deepFreeze(withCol(base(), 'debts', [{ ...CDA, status: to }]));
    return run(p, n, { ts })[0];
  };
  it('campo simples da mesma entidade coalesce', () => {
    const a = deepFreeze(edit('ativa', 'suspensa', '2026-10-08T15:00:00Z'));
    const b = deepFreeze(edit('suspensa', 'extinta', '2026-10-08T15:05:00Z'));
    const out = coalesceOutbox([a, b]);
    assert.equal(out.length, 1);
    assert.equal(out[0].coalesced, 2);
    assert.equal(out[0].changes[0].from, 'ativa');
    assert.equal(out[0].changes[0].to, 'extinta');
    assert.equal(out[0].restore.items[0].before.status, 'ativa');
    assert.equal(out[0].restore.items[0].after.status, 'extinta');
    assert.equal(out[0].id, a.id);
  });
  it('fora da janela não coalesce', () => {
    const a = edit('ativa', 'suspensa', '2026-10-08T15:00:00Z');
    const b = edit('suspensa', 'extinta', '2026-10-08T16:00:00Z');
    assert.equal(coalesceOutbox([a, b]).length, 2);
  });
  it('ida-e-volta é descartada', () => {
    const a = edit('ativa', 'suspensa', '2026-10-08T15:00:00Z');
    const b = edit('suspensa', 'ativa', '2026-10-08T15:02:00Z');
    assert.equal(coalesceOutbox([a, b]).length, 0);
  });
  it('texto nunca coalesce', () => {
    const t = (from, to) => {
      const p = deepFreeze(withCol(base(), 'tasks', [{ id: 't1', operationId: 'op1', title: 'x', description: from }]));
      const n = deepFreeze(withCol(base(), 'tasks', [{ id: 't1', operationId: 'op1', title: 'x', description: to }]));
      return run(p, n)[0];
    };
    assert.equal(coalesceOutbox([t('a', 'b'), t('b', 'c')]).length, 2);
  });
  it('exclusão não coalesce', () => {
    const p = deepFreeze(base());
    const del = run(p, deepFreeze(withCol(p, 'debts', [])))[0];
    assert.equal(coalesceOutbox([del, del]).length, 2);
  });
});

describe('dayKey', () => {
  it('usa America/Sao_Paulo, não o fuso da máquina', () => {
    assert.equal(dayKey('2026-10-09T01:30:00Z'), '2026-10-08');
    assert.equal(dayKey('2026-10-09T03:00:00Z'), '2026-10-09');
    assert.equal(dayKey('lixo'), '');
  });
});

// ─── Desempenho num banco fictício de ~20 MB ───────────────────────────────────────────────
function buildBigDb() {
  const para = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
  const html = (i) => `<p><b>Registro ${i}</b></p><p>${para.repeat(10)}</p><ul><li>${para}</li></ul>`;
  const operations = Array.from({ length: 200 }, (_, o) => ({
    id: 'op' + o, name: 'Operação Fictícia ' + o, status: 'ativa', createdAt: 'x', updatedAt: 'x',
    briefing: {
      entries: Array.from({ length: 25 }, (_, k) => ({ id: `en${o}_${k}`, type: 'nota', html: html(k), pinned: false, eventDate: '2026-09-01', createdAt: 'x', updatedAt: 'x' })),
      processStageV2: { ['ex' + o * 30]: { citacao: { date: '2026-01-01', texto: para } } },
      hipoteses: [{ id: 'h', title: 'Hipótese', body: para }],
    },
  }));
  const debts = Array.from({ length: 40000 }, (_, i) => ({
    id: 'cda' + i, operationId: 'op' + (i % 200), personId: 'pe' + (i % 900), cdaNumber: `80 6 24 ${String(i).padStart(6, '0')}-00`, value: 1000 + i, system: 'SIDA',
    status: 'ativa', prescriptionDate: '2028-01-01', inscriptionDate: '2024-01-01', processNumber: `${String(i % 6000).padStart(7, '0')}-00.2024.4.99.0001`,
    tribute: 'IRPJ', launchMode: 'oficio', taxPeriodEnd: '2022-12-31', constitutionDate: '2023-06-01', updatedAt: 'x',
    notesList: ['Observação fictícia ' + i], prescriptionSnapshot: { a: 1, b: [1, 2, 3] },
  }));
  const executions = Array.from({ length: 6000 }, (_, i) => ({
    id: 'ex' + i, operationId: 'op' + (i % 200), processNumber: `${String(i).padStart(7, '0')}-00.2024.4.99.0001`, className: 'Execução Fiscal',
    court: '1ª Vara Federal fictícia', status: 'ativa', protocolDate: '2024-01-01', notesList: [para, para, para, para, 'nota ' + i], updatedAt: 'x',
  }));
  const intimations = Array.from({ length: 12000 }, (_, i) => ({
    id: 'in' + i, operationId: 'op' + (i % 200), processNumber: `${String(i % 6000).padStart(7, '0')}-00.2024.4.99.0001`, eventDescription: 'Manifestar sobre petição — 15 dias ' + para,
    dateStart: '2026-01-01', dateDeadline: '2026-01-20', status: 'pendente_analise', priority: 'alta', notesList: [para], updatedAt: 'x',
  }));
  const assets = Array.from({ length: 5000 }, (_, i) => ({
    id: 'as' + i, operationId: 'op' + (i % 200), description: 'Bem fictício ' + i + ' ' + para, subtype: 'imovel', value: 1000 * i, status: 'liberado', registry: String(i), updatedAt: 'x',
  }));
  return { ...emptyState(), operations, debts, executions, intimations, assets };
}

describe('desempenho (banco fictício ≥ 20 MB)', () => {
  it('diff + interpret dentro das metas (falha só acima de 3x)', () => {
    const t0 = performance.now();
    const db = buildBigDb();
    const tGen = performance.now() - t0;
    const t1 = performance.now();
    const size = Buffer.byteLength(JSON.stringify(db));
    const tStr = performance.now() - t1;
    console.log(`[activity] fixture: ${(size / 1048576).toFixed(1)} MB (gerar ${tGen.toFixed(0)} ms; stringify ${tStr.toFixed(0)} ms)`);
    assert.ok(size >= 20 * 1048576, 'fixture precisa ter ≥ 20 MB, tem ' + size);
    deepFreeze(db);

    const timeIt = (fn, n = 15) => { fn(); const t = performance.now(); for (let i = 0; i < n; i++) fn(); return (performance.now() - t) / n; };

    // (a) edição comum: troca 1 CDA como o upsert (nova lista, mesma referência nos demais itens)
    const nextA = { ...db, debts: db.debts.map((d, i) => (i === 12345 ? { ...d, status: 'suspensa', updatedAt: 'y' } : d)) };
    let evs;
    const a = timeIt(() => { evs = interpretActivity(diffForActivity(db, nextA), { ts: T0, device: 'pc1', next: nextA }); });
    assert.equal(evs.length, 1);
    assert.equal(evs[0].restore.items[0].before.status, 'ativa');

    // (b) importação que altera 60 CDAs
    const set = new Set(Array.from({ length: 60 }, (_, k) => k * 600));
    const nextB = { ...db, debts: db.debts.map((d, i) => (set.has(i) ? { ...d, value: d.value + 1, updatedAt: 'y' } : d)) };
    const b = timeIt(() => { evs = interpretActivity(diffForActivity(db, nextB), { ts: T0, device: 'pc1', source: 'importacao', batchLabel: 'SIDA', next: nextB }); });
    assert.equal(evs.length, 1);
    assert.equal(evs[0].batch.count, 60);

    // (c) edição de 1 entrada de diário
    const o = db.operations[77];
    const newOp = { ...o, updatedAt: 'y', briefing: { ...o.briefing, entries: o.briefing.entries.map((e, i) => (i === 3 ? { ...e, html: e.html + '<p>mais</p>', updatedAt: 'y' } : e)) } };
    const nextC = { ...db, operations: db.operations.map((x) => (x === o ? newOp : x)) };
    const c = timeIt(() => { evs = interpretActivity(diffForActivity(db, nextC), { ts: T0, device: 'pc1', next: nextC }); });
    assert.equal(evs.length, 1);
    assert.equal(evs[0].kind, 'diario');

    // (d) pior caso do diff: criação no começo e exclusão de 1 CDA (lista desalinhada → monta mapas)
    const nextD = { ...db, debts: [{ id: 'cdaNova', cdaNumber: 'N' }, ...db.debts.filter((d, i) => i !== 20000)] };
    const d = timeIt(() => { evs = interpretActivity(diffForActivity(db, nextD), { ts: T0, device: 'pc1', next: nextD }); }, 5);
    assert.equal(evs.length, 2);
    console.log(`[activity] (d) lista desalinhada (cria + exclui): ${d.toFixed(2)} ms`);

    console.log(`[activity] (a) edição comum: ${a.toFixed(2)} ms (meta 30) | (b) importação 60 CDAs: ${b.toFixed(2)} ms (meta 100) | (c) diário: ${c.toFixed(2)} ms (meta 30)`);
    assert.ok(a < 90, `(a) ${a} ms`);
    assert.ok(b < 300, `(b) ${b} ms`);
    assert.ok(c < 90, `(c) ${c} ms`);
    // Pior caso, sem meta: com a suíte inteira em paralelo chega perto de 90 ms; limite só contra regressão grosseira.
    assert.ok(d < 300, `(d) ${d} ms`);
  });
});

describe('coalesceOutbox — conteúdo real (ida-e-volta)', () => {
  const stEv = (from, to, ts) => run(
    deepFreeze(withCol(base(), 'debts', [{ ...CDA, status: from }])),
    deepFreeze(withCol(base(), 'debts', [{ ...CDA, status: to }])), { ts })[0];
  it('valor longo A→B→C só com o final diferente não é apagado', () => {
    const long = 'x'.repeat(300);
    const a = stEv(long + 'A', long + 'B', '2026-10-08T15:00:00Z');
    const b = stEv(long + 'B', long + 'C', '2026-10-08T15:01:00Z');
    assert.equal(coalesceOutbox([a, b]).length, 1);
  });
  it('lista com o mesmo nº de itens mas conteúdo diferente não é apagada', () => {
    const mk = (from, to, ts) => run(
      deepFreeze(withCol(base(), 'executions', [{ ...EXEC, proactiveActions: from }])),
      deepFreeze(withCol(base(), 'executions', [{ ...EXEC, proactiveActions: to }])), { ts })[0];
    const x1 = [{ id: 'a1', summary: 'um' }], x2 = [{ id: 'a1', summary: 'dois' }], x3 = [{ id: 'a1', summary: 'três' }];
    const out = coalesceOutbox([mk(x1, x2, '2026-10-08T15:00:00Z'), mk(x2, x3, '2026-10-08T15:01:00Z')]);
    assert.equal(out.length, 1);
    const back = coalesceOutbox([mk(x1, x2, '2026-10-08T15:00:00Z'), mk(x2, x1, '2026-10-08T15:01:00Z')]);
    assert.equal(back.length, 0);
  });
});
