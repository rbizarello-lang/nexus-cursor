import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPrescLookup, buildPrazosRadar } from '../src/lib/prescription.js';
import {
  CLK_GROUPS, CLK_GROUP_KEYS, clkGroupOfDays, clkClassify, clkBuild, clkKpis, clkStrip, clkPct, clkSimulateFiling, clkParcSince, clkApplySim, clkSort,
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
