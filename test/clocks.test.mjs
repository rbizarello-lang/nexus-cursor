import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPrescLookup, buildPrazosRadar } from '../src/lib/prescription.js';
import {
  CLK_GROUPS, CLK_GROUP_KEYS, clkGroupOfDays, clkClassify, clkBuild, clkKpis, clkStrip, clkPct, clkSimulateFiling, clkParcSince, clkApplySim, clkSort,
  clkQuarterBins, clkBucketMatch, clkNextDates, clkTopGroup, CLK_CAL_MAX_COLS, clkCalCells, clkDateInBucket, clkByCda,
} from '../src/lib/clocks.js';

const TODAY = '2026-10-01';
const OP = { id: 'op1', name: 'Operação Teste', status: 'ativa' };
const debt = (o) => ({ operationId: 'op1', status: 'ativa', value: 100000, tribute: 'IRPJ', ...o });
function dataset() {
  return {
    operations: [OP, { id: 'op-enc', name: 'Encerrada', status: 'encerrada' }],
    people: [],
    debts: [
      debt({ id: 'd-crit', cdaNumber: '90.6.23.000884-40', prescriptionDate: '2026-12-10', value: 48000 }),
      debt({ id: 'd-alerta', cdaNumber: '90.6.20.000881-40', prescriptionDate: '2027-03-10', value: 95000 }),
      debt({ id: 'd-corre', cdaNumber: '90.6.23.000200-45', prescriptionDate: '2028-09-27', value: 180000 }),
      debt({ id: 'd-pass', cdaNumber: '90.6.19.000001-00', prescriptionDate: '2025-01-10', value: 1000 }),
      debt({ id: 'd-ef1', cdaNumber: '90.6.23.000123-45', processNumber: '5001234-56.2023.4.04.7001', status: 'ativa_ajuizada', value: 700000 }),
      debt({ id: 'd-ef2', cdaNumber: '90.6.23.000129-45', processNumber: '5001234-56.2023.4.04.7001', status: 'ativa_ajuizada', value: 300000 }),
      debt({ id: 'd-parc', cdaNumber: '90.6.22.000778-01', status: 'parcelada', prescriptionDate: '2028-06-12', value: 150000 }),
      debt({ id: 'd-treated', cdaNumber: '90.6.18.000001-00', prescriptionDate: '2026-11-01', prescriptionHandled: true, prescriptionHandledType: 'declarada' }),
      debt({ id: 'd-enc', operationId: 'op-enc', cdaNumber: '90.6.18.000002-00', prescriptionDate: '2026-11-01' }),
    ],
    executions: [{ id: 'ex1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', protocolDate: '2025-05-19', status: 'ativa', processTag: 'normal' }],
    prescriptionEvents: [{ id: 'pe1', cdaId: 'd-parc', type: 'susp_parcelamento', date: '2026-03-15' }],
  };
}
function build(data, opId) {
  const lookup = createPrescLookup(data.debts, data.executions, data.prescriptionEvents, TODAY);
  const radar = buildPrazosRadar(data, TODAY, lookup, { policy: 'v2' });
  return { lookup, radar, res: clkBuild({ data, rows: radar.rows, silenced: radar.silenced, lookup, today: TODAY, opId }) };
}

describe('Relógio da prescrição — grupos de risco', () => {
  it('90 dias é crítico, 1 ano é alerta, depois corre; sem dado vai para "sem"', () => {
    assert.equal(clkGroupOfDays(-30), 'crit');
    assert.equal(clkGroupOfDays(0), 'crit');
    assert.equal(clkGroupOfDays(90), 'crit');
    assert.equal(clkGroupOfDays(91), 'alerta');
    assert.equal(clkGroupOfDays(365), 'alerta');
    assert.equal(clkGroupOfDays(366), 'corre');
    assert.equal(clkGroupOfDays(null), 'sem');
    assert.equal(clkGroupOfDays(500, true), 'crit');
  });
  it('a ordem dos grupos é a da leitura e cada um tem tom e rótulo', () => {
    assert.deepEqual(CLK_GROUP_KEYS, ['crit', 'alerta', 'corre', 'parado', 'piso', 'sem']);
    CLK_GROUPS.forEach(g => { assert.ok(g.label); assert.ok(g.tone); });
  });
});

describe('clkBuild — recorte por CDA (aba Inscrições)', () => {
  const data = dataset();
  const lookup = createPrescLookup(data.debts, data.executions, data.prescriptionEvents, TODAY);
  const radar = buildPrazosRadar(data, TODAY, lookup, { policy: 'v2' });
  const run = (extra) => clkBuild({ data, rows: radar.rows, silenced: radar.silenced, lookup, today: TODAY, opId: 'op1', ...extra });
  const ids = (r) => r.clocks.flatMap(c => c.cdaIds).sort();
  it('sem debtIds nada muda; com debtIds entram só as CDAs pedidas', () => {
    assert.deepEqual(ids(run({ debtIds: null })), ids(run({})));
    assert.deepEqual(ids(run({ debtIds: new Set(['d-crit', 'd-corre']) })), ['d-corre', 'd-crit']);
  });
  it('CDAs do mesmo processo se separam quando só uma passa no filtro', () => {
    const r = run({ debtIds: new Set(['d-ef1']) });
    assert.equal(r.clocks.length, 1);
    assert.equal(r.clocks[0].n, 1);
    assert.equal(r.clocks[0].value, 700000);
  });
  it('recorte vazio dá zero relógios (a tela mostra o aviso), sem quebrar as contagens', () => {
    const r = run({ debtIds: new Set() });
    assert.equal(r.clocks.length, 0);
    assert.equal(r.consumadas, 0);
  });
  it('o recorte nunca traz CDA de fora da operação pedida', () => {
    const r = run({ debtIds: new Set(['d-enc', 'd-crit']) });
    assert.deepEqual(ids(r), ['d-crit']);
  });
});

describe('clkBuild — relógios a partir da Mesa e do motor', () => {
  const data = dataset();
  const { radar, res } = build(data);
  const by = (id) => res.clocks.find(c => c.cdaIds.includes(id));
  it('exclui operação encerrada, CDA tratada e extinta', () => {
    assert.equal(by('d-enc'), undefined);
    assert.equal(by('d-treated'), undefined);
    assert.equal(res.tratadas, 1);
  });
  it('agrupa por risco: iminente = crítico, termo em 1 ano = alerta, termo distante = correndo', () => {
    assert.equal(by('d-crit').group, 'crit');
    assert.equal(by('d-crit').kind, 'orig');
    assert.equal(by('d-alerta').group, 'alerta');
    assert.equal(by('d-corre').group, 'corre');
    assert.equal(by('d-crit').term, '2026-12-10');
    assert.equal(by('d-crit').termDays, 70);
  });
  it('parcelamento vigente fica "parado" e informa desde quando', () => {
    const c = by('d-parc');
    assert.equal(c.kind, 'parc');
    assert.equal(c.group, 'parado');
    assert.equal(c.cause, 'parcelamento');
    assert.equal(c.since, '2026-03-15');
  });
  it('intercorrente ainda não iniciada: CDAs do mesmo processo andam numa linha só, com o piso mais próximo', () => {
    const c = by('d-ef1');
    assert.equal(c.kind, 'piso');
    assert.equal(c.group, 'piso');
    assert.equal(c.n, 2);
    assert.deepEqual(c.cdaIds.sort(), ['d-ef1', 'd-ef2']);
    assert.equal(c.value, 1000000);
    assert.ok(c.floor > TODAY);
    assert.equal(by('d-ef2'), c);
  });
  it('ordena por grupo e, dentro dele, pelo termo mais próximo', () => {
    const order = res.clocks.map(c => CLK_GROUP_KEYS.indexOf(c.group));
    assert.deepEqual(order, order.slice().sort((a, b) => a - b));
    const crit = res.clocks.filter(c => c.group === 'crit' && c.term);
    for (let i = 1; i < crit.length; i++) assert.ok(crit[i - 1].term <= crit[i].term);
  });
  it('mesmos termos que a Mesa: onde a Mesa tem linha, o termo e os dias do relógio são os dela', () => {
    let checked = 0;
    radar.rows.forEach(r => {
      if (r.group === 6) return;
      const c = res.clocks.find(x => x.cdaIds.includes(r.id));
      if (!c || (c.kind !== 'orig' && c.kind !== 'inter')) return;
      if (c.cdaIds[0] !== r.id && c.leadId !== r.id) return;
      assert.equal(c.term, r.prescDate, 'termo da CDA ' + r.cdaNumber);
      assert.equal(c.termDays, r.prescDays, 'dias da CDA ' + r.cdaNumber);
      checked++;
    });
    assert.ok(checked >= 1);
  });
  it('filtra por operação', () => {
    const none = build(data, 'outra').res;
    assert.equal(none.clocks.length, 0);
    assert.equal(build(data, 'op1').res.clocks.length, res.clocks.length);
  });
  it('o termo vencido há mais tempo ainda é "crítico" e aparece (não some)', () => {
    const c = by('d-pass');
    if (c) { assert.equal(c.group, 'crit'); assert.ok(c.termDays < 0); }
    else assert.ok(res.consumadas >= 1, 'se não está nos relógios, está em Consumadas');
  });
});

describe('clkKpis e clkStrip', () => {
  const data = dataset();
  const { res } = build(data);
  it('KPIs: próximo termo, termos em até 1 ano, parado e piso', () => {
    const k = res.kpis;
    assert.equal(k.next.term, '2026-12-10');
    assert.equal(k.next.days, 70);
    assert.ok(k.overdue.cdas >= 0);
    assert.ok(k.near.cdas >= 2);
    assert.equal(k.parc.cdas, 1);
    assert.equal(k.parc.value, 150000);
    assert.equal(k.piso.cdas, 2);
    assert.ok(k.piso.nearestFloor > TODAY);
  });
  it('sem relógios, os KPIs ficam zerados e sem próximo termo', () => {
    const k = clkKpis([], TODAY);
    assert.equal(k.next, null);
    assert.equal(k.near.cdas, 0);
  });
  it('calendário: pontos em ordem, eixo até o fim do último ano e anos listados', () => {
    const s = clkStrip(res.clocks, TODAY);
    assert.equal(s.from, TODAY);
    for (let i = 1; i < s.points.length; i++) assert.ok(s.points[i - 1].d <= s.points[i].d);
    assert.ok(s.to >= s.points[s.points.length - 1].d);
    assert.equal(s.years[0], 2026);
    assert.equal(s.to.slice(5), '12-31');
    assert.ok(s.points.some(p => p.kind === 'piso'));
    assert.ok(s.points.some(p => p.kind === 'term'));
  });
  it('calendário: cada ponto leva o valor do relógio (val) e o número de CDAs (n)', () => {
    const s = clkStrip(res.clocks, TODAY);
    s.points.forEach(p => {
      const c = res.clocks.find(x => x.id === p.id);
      assert.equal(p.val, c.value);
      assert.equal(p.n, c.n);
    });
    assert.ok(s.points.some(p => p.n > 1 && p.val > 0));
  });
  it('clkPct fica entre 0 e 1', () => {
    assert.equal(clkPct('2026-01-01', '2026-01-11', '2026-01-06'), 0.5);
    assert.equal(clkPct('2026-01-01', '2026-01-11', '2025-01-01'), 0);
    assert.equal(clkPct('2026-01-01', '2026-01-11', '2030-01-01'), 1);
    assert.equal(clkPct('2026-01-01', '2026-01-01', '2026-01-01'), 0);
  });
});

describe('clkParcSince e clkClassify', () => {
  it('usa a adesão mais recente da linha do tempo; sem adesão, não inventa data', () => {
    assert.equal(clkParcSince({ timeline: [{ type: 'susp_parcelamento', date: '2024-01-02' }, { type: 'susp_parcelamento', date: '2026-03-15' }, { type: 'int_citacao', date: '2026-09-01' }] }), '2026-03-15');
    assert.equal(clkParcSince({ timeline: [], diesAQuo: '2025-05-05' }), '');
    assert.equal(clkParcSince(null), '');
  });
  it('consumada (grupo 6) sai; CDA extinta e sem motor também', () => {
    assert.deepEqual(clkClassify({ debt: { id: 'x' }, r: { segment: 'credito' }, row: { group: 6 }, today: TODAY }), { skip: 'consumada' });
    assert.equal(clkClassify({ debt: { id: 'x', status: 'extinta' }, r: {}, today: TODAY }), null);
    assert.equal(clkClassify({ debt: null, r: {}, today: TODAY }), null);
  });
  it('originária sem termo calculável vira "sem"', () => {
    const c = clkClassify({ debt: { id: 'x' }, r: { segment: 'credito', diesAdQuem: null }, today: TODAY });
    assert.equal(c.kind, 'sem');
    assert.equal(c.group, 'sem');
  });
});

describe('clkSimulateFiling — "e se eu ajuizar hoje?" sem gravar nada', () => {
  const data = dataset();
  it('devolve o piso de 6 anos a partir de hoje e não altera os dados recebidos', () => {
    const before = JSON.stringify({ d: data.debts, e: data.executions, p: data.prescriptionEvents });
    const sim = clkSimulateFiling({ debt: data.debts[0], executions: data.executions, events: data.prescriptionEvents, today: TODAY });
    assert.equal(sim.ok, true);
    assert.equal(sim.floor, '2032-10-01');
    assert.equal(sim.anchor.iso, TODAY);
    assert.equal(sim.segment, 'intercorrente');
    assert.equal(JSON.stringify({ d: data.debts, e: data.executions, p: data.prescriptionEvents }), before);
  });
  it('CDA que já tem processo não simula', () => {
    const sim = clkSimulateFiling({ debt: data.debts.find(d => d.id === 'd-ef1'), executions: data.executions, events: [], today: TODAY });
    assert.equal(sim.ok, false);
    assert.match(sim.reason, /já tem processo/);
  });
  it('termo que já passou não simula (ajuizar tarde não reinicia o prazo)', () => {
    const sim = clkSimulateFiling({ debt: data.debts.find(d => d.id === 'd-pass'), executions: [], events: [], today: TODAY });
    assert.equal(sim.ok, false);
    assert.match(sim.reason, /termo já passou/i);
  });
  it('sem CDA não simula', () => {
    assert.equal(clkSimulateFiling({}).ok, false);
  });
});

describe('próximo termo ignora o que já passou', () => {
  it('o vencido entra em "overdue", não em "next"', () => {
    const mk = (id, term, days) => ({ id, kind: 'orig', term, termDays: days, n: 1, value: 10, leadNumber: id, opName: 'Op' });
    const k = clkKpis([mk('a', '2019-06-06', -100), mk('b', '2027-01-01', 90), mk('c', '2027-06-01', 240)], TODAY);
    assert.equal(k.next.id, 'b');
    assert.equal(k.overdue.cdas, 1);
    assert.equal(k.near.cdas, 3);
  });
});

describe('clkApplySim', () => {
  const clock = { id: 'cda|d1', kind: 'orig', group: 'alerta', term: '2027-03-10', termDays: 160, n: 1, value: 95000 };
  it('mostra o cenário como "sem relógio ativo" com o piso, sem mexer no relógio original', () => {
    const sim = { ok: true, floor: '2032-10-01', anchor: { iso: TODAY, kind: 'despacho' } };
    const out = clkApplySim(clock, sim, TODAY);
    assert.equal(out.kind, 'piso');
    assert.equal(out.group, 'piso');
    assert.equal(out.floor, '2032-10-01');
    assert.equal(out.simulated, true);
    assert.equal(out.simBefore.term, '2027-03-10');
    assert.equal(out.value, 95000);
    assert.equal(clock.kind, 'orig');
    assert.equal(clock.floor, undefined);
  });
  it('simulação inválida ou ausente devolve o relógio como está', () => {
    assert.equal(clkApplySim(clock, null, TODAY), clock);
    assert.equal(clkApplySim(clock, { ok: false, reason: 'x' }, TODAY), clock);
  });
});

describe('clkSort', () => {
  it('grupo de risco primeiro, depois o termo mais próximo, sem alterar a lista recebida', () => {
    const list = [
      { id: 'p', group: 'piso', floor: '2030-01-01' },
      { id: 'c2', group: 'crit', term: '2026-12-01' },
      { id: 'a', group: 'alerta', term: '2027-01-01' },
      { id: 'c1', group: 'crit', term: '2026-11-01' },
      { id: 'p0', group: 'piso', floor: '2029-01-01' },
    ];
    const out = clkSort(list);
    assert.deepEqual(out.map(c => c.id), ['c1', 'c2', 'a', 'p0', 'p']);
    assert.equal(list[0].id, 'p');
  });
});

describe('clkQuarterBins — faixas por trimestre do calendário', () => {
  const T = '2026-10-06'; // 4º trimestre de 2026
  const pt = (id, d, kind, group, n, val, number) => ({ id, d, kind, group, n, val, number: number || id });
  const pts = [
    pt('a', '2026-08-12', 'term', 'crit', 1, 1000, 'A'),          // vencido
    pt('b', '2026-10-05', 'term', 'crit', 2, 2000, 'B'),          // vencido (ontem)
    pt('c', '2026-10-06', 'term', 'crit', 1, 500, 'C'),           // hoje: ainda não venceu
    pt('d', '2026-12-31', 'term', 'alerta', 3, 3000, 'D'),
    pt('e', '2027-01-10', 'term', 'corre', 1, 400, 'E'),
    pt('f', '2027-02-24', 'term', 'alerta', 2, 600, 'F'),         // mesmo trimestre de E: alerta vence corre
    pt('g', '2027-07-07', 'piso', 'piso', 4, 4000, 'G'),
    pt('h', '2026-05-01', 'piso', 'piso', 1, 99, 'H'),            // piso que já passou
    pt('i', '2028-12-31', 'term', 'corre', 1, 50, 'I'),
  ];
  const r = clkQuarterBins(pts, T);
  it('começa no trimestre de hoje e vai até o fim do último ano', () => {
    assert.equal(r.gran, 'q');
    assert.equal(r.cols[0].key, '2026-Q4');
    assert.equal(r.cols[0].from, T, 'a primeira faixa começa hoje, não no 1º dia do trimestre');
    assert.equal(r.cols[0].to, '2026-12-31');
    assert.equal(r.cols[1].key, '2027-Q1');
    assert.equal(r.cols[1].from, '2027-01-01');
    assert.equal(r.cols[1].to, '2027-03-31');
    assert.equal(r.cols[r.cols.length - 1].key, '2028-Q4');
    assert.equal(r.cols.length, 9);
    assert.equal(r.cols[0].label, '4º tri 2026');
    assert.equal(r.cols[0].short, '4º');
    assert.deepEqual(r.years, [{ year: 2026, start: 0, span: 1 }, { year: 2027, start: 1, span: 4 }, { year: 2028, start: 5, span: 4 }]);
  });
  it('vencidos: termos antes de hoje; o termo de hoje ainda está na primeira faixa; piso passado fica de fora', () => {
    assert.equal(r.overdue.cdas, 3);
    assert.equal(r.overdue.value, 3000);
    assert.equal(r.overdue.group, 'crit');
    assert.deepEqual(r.overdue.points.map(p => p.id), ['a', 'b']);
    assert.equal(r.skipped, 1);
    assert.equal(r.cols[0].term.cdas, 4);   // C (1) + D (3)
    assert.equal(r.cols[0].term.value, 3500);
  });
  it('soma CDAs (n) e valor (val) por pista e pega o grupo mais urgente', () => {
    const q1 = r.cols[1];
    assert.equal(q1.term.cdas, 3);
    assert.equal(q1.term.value, 1000);
    assert.equal(q1.term.group, 'alerta');
    assert.equal(r.cols[0].term.group, 'crit');
    assert.equal(r.cols[3].piso.cdas, 4);   // 3º tri 2027
    assert.equal(r.cols[3].piso.group, 'piso');
    assert.equal(r.cols[3].term.cdas, 0);
    assert.equal(r.cols[3].term.group, '');
    assert.deepEqual(r.cols[3].term.points, []);
    assert.equal(r.cols[8].term.cdas, 1);
    assert.equal(r.cols[8].term.group, 'corre');
  });
  it('o total conta o que aparece (vencidos + faixas), sem o piso que já passou', () => {
    assert.equal(r.total.cdas, 15);
    assert.equal(r.total.value, 11550);
    const soma = r.cols.reduce((n, c) => n + c.term.cdas + c.piso.cdas, r.overdue.cdas);
    assert.equal(soma, r.total.cdas);
  });
  it('sem pontos: faixas vazias e nada vencido', () => {
    const e = clkQuarterBins([], T);
    assert.equal(e.overdue.cdas, 0);
    assert.equal(e.overdue.points.length, 0);
    assert.equal(e.cols.length, 5);   // 4º tri 2026 até o fim de 2027
    assert.ok(e.cols.every(c => c.term.cdas === 0 && c.piso.cdas === 0));
    assert.equal(e.total.cdas, 0);
  });
  it('clkTopGroup: crit > alerta > corre > piso', () => {
    assert.equal(clkTopGroup([{ group: 'corre' }, { group: 'alerta' }]), 'alerta');
    assert.equal(clkTopGroup([{ group: 'piso' }, { group: 'corre' }, { group: 'crit' }]), 'crit');
    assert.equal(clkTopGroup([{ group: 'piso' }]), 'piso');
    assert.equal(clkTopGroup([]), 'piso');
  });
});

describe('clkQuarterBins — granularidade (trimestre, semestre ou ano)', () => {
  const T = '2026-10-06';
  const at = (d) => [{ id: 'x', d, kind: 'term', group: 'corre', n: 1, val: 1, number: 'X' }];
  it('até 24 faixas: trimestres', () => {
    // 4º tri 2026 … 4º tri 2031 = 1 + 5×4 = 21 faixas
    const r = clkQuarterBins(at('2031-03-15'), T);
    assert.equal(r.gran, 'q');
    assert.equal(r.cols.length, 21);
    // 4º tri 2026 … 4º tri 2032 = 25 faixas > 24
    assert.equal(clkQuarterBins(at('2032-03-15'), T).gran, 'h');
    assert.equal(CLK_CAL_MAX_COLS, 24);
  });
  it('mais de 24 trimestres: semestres (2º sem de hoje até o fim do último ano)', () => {
    const r = clkQuarterBins(at('2032-03-15'), T);
    assert.equal(r.gran, 'h');
    assert.equal(r.cols.length, 13);   // 2º sem 2026 + 6 anos × 2
    assert.equal(r.cols[0].key, '2026-H2');
    assert.equal(r.cols[0].label, '2º sem 2026');
    assert.equal(r.cols[0].short, '2º');
    assert.equal(r.cols[0].from, T);
    assert.equal(r.cols[1].key, '2027-H1');
    assert.equal(r.cols[1].to, '2027-06-30');
    assert.equal(r.cols[12].to, '2032-12-31');
    const c = r.cols.find(x => x.key === '2032-H1');
    assert.equal(c.term.cdas, 1);
  });
  it('mais de 24 semestres: anos', () => {
    const r = clkQuarterBins(at('2039-03-15'), T);   // 2º sem 2026 … 2039 = 27 semestres
    assert.equal(r.gran, 'y');
    assert.equal(r.cols.length, 14);
    assert.equal(r.cols[0].key, '2026');
    assert.equal(r.cols[0].label, '2026');
    assert.equal(r.cols[0].short, '');
    assert.equal(r.cols[0].from, T);
    assert.equal(r.cols[13].key, '2039');
    assert.equal(r.cols[13].term.cdas, 1);
  });
  it('maxCols configurável e nenhum ponto futuro fica sem faixa', () => {
    const pts = [at('2027-03-01')[0], { ...at('2029-11-30')[0], id: 'y' }];
    assert.equal(clkQuarterBins(pts, T, { maxCols: 8 }).gran, 'h');
    for (const maxCols of [24, 8, 3]) {
      const r = clkQuarterBins(pts, T, { maxCols });
      assert.equal(r.cols.reduce((n, c) => n + c.term.cdas, 0), 2, 'granularidade ' + r.gran);
    }
  });
});

describe('clkBucketMatch e clkNextDates', () => {
  const T = '2026-10-06';
  const termo = (term) => ({ kind: 'orig', term, floor: '' });
  const inter = (term) => ({ kind: 'inter', term, floor: '' });
  const piso = (floor) => ({ kind: 'piso', term: '', floor });
  it('termos vencidos: termo antes de hoje (hoje não é vencido); pisos nunca', () => {
    const b = { lane: 'over' };
    assert.equal(clkBucketMatch(termo('2026-10-05'), b, T), true);
    assert.equal(clkBucketMatch(termo('2026-10-06'), b, T), false);
    assert.equal(clkBucketMatch(inter('2020-01-01'), b, T), true);
    assert.equal(clkBucketMatch(piso('2020-01-01'), b, T), false);
    assert.equal(clkBucketMatch({ kind: 'parc', term: '', floor: '' }, b, T), false);
  });
  it('faixa: termo na pista de termos e piso na pista de pisos, limites inclusivos', () => {
    const bt = { lane: 'term', from: '2030-07-01', to: '2030-09-30' };
    const bp = { lane: 'piso', from: '2030-07-01', to: '2030-09-30' };
    assert.equal(clkBucketMatch(termo('2030-07-01'), bt, T), true);
    assert.equal(clkBucketMatch(termo('2030-09-30'), bt, T), true);
    assert.equal(clkBucketMatch(termo('2030-10-01'), bt, T), false);
    assert.equal(clkBucketMatch(piso('2030-08-01'), bt, T), false);
    assert.equal(clkBucketMatch(piso('2030-08-01'), bp, T), true);
    assert.equal(clkBucketMatch(termo('2030-08-01'), bp, T), false);
    assert.equal(clkBucketMatch(termo('2030-08-01'), null, T), true, 'sem recorte, tudo passa');
  });
  it('o filtro reproduz a célula: os relógios que casam são exatamente os pontos dela', () => {
    const { res } = build(dataset());
    const s = clkStrip(res.clocks, TODAY);
    const r = clkQuarterBins(s.points, TODAY);
    const check = (bucket, cell) => {
      const ids = res.clocks.filter(c => clkBucketMatch(c, bucket, TODAY)).map(c => c.id).sort();
      assert.deepEqual(ids, cell.points.map(p => p.id).sort());
    };
    check({ lane: 'over' }, r.overdue);
    r.cols.forEach(c => { check({ lane: 'term', from: c.from, to: c.to }, c.term); check({ lane: 'piso', from: c.from, to: c.to }, c.piso); });
    assert.ok(r.cols.some(c => c.term.points.length) && r.cols.some(c => c.piso.points.length));
  });
  it('próximas datas: do mesmo dia e tipo viram uma só, com "+N" das outras CDAs; passadas ficam de fora', () => {
    const p = (id, d, kind, n, number) => ({ id, d, kind, n, number, group: 'corre', val: 1 });
    const out = clkNextDates([
      p('old', '2026-09-01', 'term', 1, '000001-01'),
      p('a', '2027-01-10', 'term', 1, '002108-15'),
      p('b2', '2027-02-24', 'term', 3, '004295-07'),
      p('b1', '2027-02-24', 'term', 5, '004294-18'),
      p('c', '2027-07-07', 'piso', 1, '043518-98'),
      p('d', '2028-01-01', 'term', 1, '000009-09'),
    ], T);
    assert.equal(out.length, 3);
    assert.deepEqual(out[0], { d: '2027-01-10', kind: 'term', number: '002108-15', cdas: 1, others: 0 });
    assert.equal(out[1].d, '2027-02-24');
    assert.equal(out[1].number, '004294-18');
    assert.equal(out[1].cdas, 8);
    assert.equal(out[1].others, 7);
    assert.equal(out[2].kind, 'piso');
    assert.equal(clkNextDates([], T).length, 0);
    assert.equal(clkNextDates([p('d', '2028-01-01', 'term', 1, 'Z')], T, 3).length, 1);
  });
});

describe('Relógios — fase 4a: mapa por CDA e células do calendário', () => {
  it('clkByCda: cada CDA de um processo acha o relógio do seu grupo; CDA sem relógio fica de fora', () => {
    const data = dataset();
    const { res } = build(data, '');
    const m = clkByCda(res.clocks);
    assert.ok(m.get('d-ef1') && m.get('d-ef2'), 'as duas CDAs do mesmo processo');
    assert.equal(m.get('d-ef1'), m.get('d-ef2'));
    assert.ok(m.get('d-ef1').n >= 2);
    assert.ok(m.get('d-crit'));
    assert.equal(m.get('d-treated'), undefined, 'tratada não tem relógio');
    assert.equal(m.get('d-enc'), undefined, 'operação encerrada fica fora');
    const total = res.clocks.reduce((s, c) => s + c.cdaIds.length, 0);
    assert.equal(m.size, total, 'cada CDA de cada relógio aparece uma vez');
  });

  it('clkQuarterBins com groupOf: a regra de cor da célula é de quem chama', () => {
    const pts = [
      { id: 'a', d: '2026-11-10', kind: 'term', group: 'crit', n: 1, number: '1', val: 10 },
      { id: 'b', d: '2026-11-12', kind: 'term', group: 'corre', n: 1, number: '2', val: 20 },
      { id: 'c', d: '2025-01-01', kind: 'term', group: 'crit', n: 1, number: '3', val: 5 },
    ];
    const base = clkQuarterBins(pts, TODAY);
    assert.equal(base.cols[0].term.group, 'crit');
    const custom = clkQuarterBins(pts, TODAY, { groupOf: () => 'X' });
    assert.equal(custom.cols[0].term.group, 'X');
    assert.equal(custom.overdue.group, 'X');
    assert.equal(custom.cols[0].piso.group, '', 'célula vazia continua sem grupo');
  });

  it('clkCalCells e clkDateInBucket: mesmas faixas que clkBucketMatch', () => {
    const pts = [
      { id: 'a', d: '2026-11-10', kind: 'term', group: 'crit', n: 1, number: '1', val: 10 },
      { id: 'p', d: '2027-05-10', kind: 'piso', group: 'piso', n: 1, number: '2', val: 20 },
      { id: 'o', d: '2025-01-01', kind: 'term', group: 'crit', n: 1, number: '3', val: 5 },
    ];
    const cal = clkQuarterBins(pts, TODAY);
    const cells = clkCalCells(cal);
    assert.ok(cells.has('over'));
    assert.ok(cells.has('term|2026-Q4'));
    assert.ok(cells.has('piso|2027-Q2'));
    assert.equal(cells.get('piso|2027-Q2').short, '2º tri 2027 · pisos');
    pts.forEach(p => {
      cells.forEach(x => {
        const clock = p.kind === 'piso' ? { kind: 'piso', floor: p.d } : { kind: 'orig', term: p.d };
        assert.equal(clkDateInBucket(p.d, p.kind, x.bucket, TODAY), clkBucketMatch(clock, x.bucket, TODAY), p.id + ' ' + x.label);
      });
    });
    assert.equal(clkDateInBucket('', 'term', { lane: 'over' }, TODAY), false);
    assert.equal(clkCalCells(null).size, 0);
  });
});
