import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPrescLookup, buildPrazosRadar } from '../src/lib/prescription.js';
import { clkBuild, clkStrip, clkQuarterBins, clkApplySim } from '../src/lib/clocks.js';
import {
  MESA_CARDS,
  MESA_CARD_SHORT,
  buildMesaCards,
  mesaIsAction,
  mesaActionCount,
  mesaCardShort,
  mesaItemTone,
  mesaItemDays,
  mesaCdasMeta,
  mesaCdaRank,
  mesaFilaItems,
  mesaAgendaPoint,
  mesaIsVencida,
  mesaAlertGroups,
  mesaClockLead,
  mesaClockCard,
  mesaClockGroups,
  mesaClockKpis,
  mesaClockPoints,
  mesaCalPredominant,
  mesaCalTone,
} from '../src/lib/prazos-mesa.js';

/* Fase 4c — rótulos restantes e Relógios pelos cartões (funções puras). */

const TODAY = '2026-10-01';

// Item de cartão mínimo (o que as funções puras leem).
const ci = (id, card, over = {}) => ({
  debtId: id, card, debt: { id, operationId: 'op1', cdaNumber: 'CDA-' + id, processNumber: '', value: 100 }, value: 100,
  row: { id, prescDays: null, summary: 'resumo ' + id }, dateIsDeadline: false, sortDate: null, ajuizarLonge: false, cedoVencidaTardeNao: false, ...over,
});
const byDebtOf = (items) => new Map(items.map(i => [i.debtId, i]));
const cdasOf = (items) => items.map(i => i.debt);

describe('Fase 4c — selo e tom pelo cartão da CDA', () => {
  it('nome curto para cada um dos dez cartões', () => {
    assert.deepEqual(Object.keys(MESA_CARD_SHORT).sort(), MESA_CARDS.map(c => c.id).sort());
    assert.equal(mesaCardShort('ajuizar'), 'Ajuizar');
    assert.equal(mesaCardShort('calculo'), 'Conferir cálculo');
    assert.equal(mesaCardShort('vigiar'), 'Só vigiar');
    assert.equal(mesaCardShort('antigas'), 'Consumada');
  });

  it('tom é o do cartão; Ajuizar de 60 a 180 dias e a fileira 2 são neutros', () => {
    assert.equal(mesaItemTone(ci('a', 'ajuizar')), 'red');
    assert.equal(mesaItemTone(ci('a', 'ajuizar', { ajuizarLonge: true })), 'neutral');
    assert.equal(mesaItemTone(ci('b', 'calculo')), 'orange');
    assert.equal(mesaItemTone(ci('c', 'fato')), 'orange');
    assert.equal(mesaItemTone(ci('d', 'vigencia')), 'blue');
    assert.equal(mesaItemTone(ci('e', 'dado')), 'neutral');
    ['sempressa', 'vigiar', 'adiadas', 'tratadas', 'antigas'].forEach(c => assert.equal(mesaItemTone(ci('x', c)), 'neutral', c));
    assert.equal(mesaItemTone(null), 'neutral');
  });

  it('mesaItemDays: só quando a data é prazo; consumada antiga nunca; reserva pela linha só se pedida', () => {
    assert.equal(mesaItemDays(ci('a', 'ajuizar', { dateIsDeadline: true, sortDate: '2026-10-11' }), TODAY), 10);
    assert.equal(mesaItemDays(ci('b', 'calculo', { dateIsDeadline: true, sortDate: '2026-09-21' }), TODAY), -10);
    assert.equal(mesaItemDays(ci('c', 'calculo', { row: { prescDays: -40 } }), TODAY), null);
    assert.equal(mesaItemDays(ci('c', 'calculo', { row: { prescDays: -40 } }), TODAY, true), -40);
    assert.equal(mesaItemDays(ci('d', 'antigas', { dateIsDeadline: true, sortDate: '2020-01-01' }), TODAY), null);
    assert.equal(mesaItemDays(null, TODAY), null);
  });
});

describe('Fase 4c — mesaCdasMeta: «a agir» por processo, execução, incidente, intimação', () => {
  const items = [
    ci('a1', 'ajuizar', { dateIsDeadline: true, sortDate: '2026-10-21' }), // 20 dias
    ci('a2', 'ajuizar', { dateIsDeadline: true, sortDate: '2027-01-20', ajuizarLonge: true }), // cinza: não conta
    ci('f1', 'fato', { dateIsDeadline: true, sortDate: '2026-10-11', value: 50 }), // 10 dias
    ci('v1', 'vigiar'),
    ci('t1', 'tratadas'),
    ci('d1', 'dado', { value: 7 }),
  ];
  const by = byDebtOf(items);
  const meta = (ids) => mesaCdasMeta(cdasOf(items.filter(i => ids.includes(i.debtId))), by, TODAY);

  it('conta só a fileira 1 (Ajuizar cinza e fileira 2 ficam de fora)', () => {
    const m = meta(['a1', 'a2', 'f1', 'v1', 't1', 'd1']);
    assert.equal(m.nAct, 3);
    assert.equal(m.n, 5, 'tratada não entra no n');
    assert.equal(m.value, 100 + 50 + 7);
    assert.equal(m.label, '3 a agir');
    assert.equal(m.riskClass, 'critical', 'há Ajuizar vermelho');
    assert.equal(m.minRiskDays, 10);
  });

  it('o selo é o do cartão mais urgente: o prazo mais curto entre os a agir do mesmo cartão-base', () => {
    const m = meta(['a1', 'f1']);
    assert.equal(m.card, 'ajuizar', 'ordem da Mesa: Ajuizar vem antes de Lançar fato');
    assert.equal(m.tone, 'red');
    assert.equal(m.days, 20);
    assert.equal(m.iso, '2026-10-21');
  });

  it('uma CDA: o selo é o nome curto do cartão; CDA fora da fileira 1 não é «a agir»', () => {
    assert.equal(meta(['f1']).label, 'Lançar fato');
    assert.equal(meta(['f1']).riskClass, 'warning');
    const v = meta(['v1']);
    assert.equal(v.nAct, 0);
    assert.equal(v.label, 'Só vigiar');
    assert.equal(v.riskClass, '');
    const g = meta(['a2']);
    assert.equal(g.nAct, 0);
    assert.equal(g.label, 'Ajuizar');
    assert.equal(g.tone, 'neutral');
  });

  it('todas tratadas: «Tratadas», classe ok; sem CDA com cartão: traço', () => {
    const m = meta(['t1']);
    assert.equal(m.label, 'Tratadas');
    assert.equal(m.riskClass, 'ok');
    assert.equal(m.nAct, 0);
    assert.equal(mesaCdasMeta([{ id: 'zz' }], by, TODAY).label, '—');
    assert.equal(mesaCdasMeta([], by, TODAY).nAct, 0);
  });

  it('mesma contagem de mesaActionCount para o mesmo conjunto', () => {
    const totals = {}; MESA_CARDS.forEach(c => { totals[c.id] = { n: 0, value: 0 }; });
    items.forEach(i => { if (!(i.card === 'ajuizar' && i.ajuizarLonge)) { totals[i.card].n++; totals[i.card].value += i.value; } });
    assert.equal(meta(items.map(i => i.debtId)).nAct, mesaActionCount(totals).n);
  });

  it('mesaCdaRank: a agir antes de fileira 2, tratada por último, depois o prazo mais curto', () => {
    const r = (i) => mesaCdaRank(i, TODAY);
    assert.ok(r(items[0]).rank < r(items[3]).rank);
    assert.ok(r(items[3]).rank < r(items[4]).rank);
    assert.ok(r(items[1]).rank > r(items[0]).rank && r(items[1]).rank < r(items[3]).rank, 'Ajuizar cinza entre a fileira 1 e a 2');
    assert.equal(r(items[2]).days, 10);
    assert.equal(r(null).rank, 98);
  });

  it('mesaIsVencida: só a agir, com prazo chegado e sem ser «cedo venceu, tarde não»', () => {
    assert.equal(mesaIsVencida(ci('x', 'fato', { dateIsDeadline: true, sortDate: '2026-09-01' }), TODAY), true);
    assert.equal(mesaIsVencida(ci('x', 'fato', { dateIsDeadline: true, sortDate: '2026-12-01' }), TODAY), false);
    assert.equal(mesaIsVencida(ci('x', 'fato', { dateIsDeadline: true, sortDate: '2027-02-01', cedoVencidaTardeNao: true }), TODAY), false);
    assert.equal(mesaIsVencida(ci('x', 'vigiar', { dateIsDeadline: true, sortDate: '2026-09-01' }), TODAY), false);
  });
});

describe('Fase 4c — Hoje: fila de prescrição pelos cartões', () => {
  const items = [
    ci('f1', 'fato', { dateIsDeadline: true, sortDate: '2026-10-11' }),
    ci('c1', 'calculo', { row: { prescDays: -40 } }),
    ci('d1', 'dado'),
    ci('v1', 'vigiar', { dateIsDeadline: true, sortDate: '2026-10-21' }),
    ci('v2', 'vigiar', { dateIsDeadline: true, sortDate: '2027-05-01' }),
    ci('x1', 'antigas', { dateIsDeadline: true, sortDate: '2020-01-01' }),
    ci('t1', 'tratadas', { dateIsDeadline: true, sortDate: '2026-10-05' }),
    ci('s1', 'adiadas', { dateIsDeadline: true, sortDate: '2026-10-05' }),
    ci('g1', 'ajuizar', { dateIsDeadline: true, sortDate: '2027-01-01', ajuizarLonge: true }),
  ];
  it("modo 'agir': a fileira 1 (sem o Ajuizar cinza), com dias e urgência = com prazo", () => {
    const out = mesaFilaItems(items, TODAY, 'agir');
    assert.deepEqual(out.map(o => o.debtId), ['f1', 'c1', 'd1']);
    assert.deepEqual(out.map(o => o.days), [10, -40, null]);
    assert.deepEqual(out.map(o => o.urgent), [true, true, false]);
  });
  it("modo 'ate30': prazo de até 30 dias em qualquer cartão em andamento; fora tratadas, adiadas e antigas", () => {
    const out = mesaFilaItems(items, TODAY, 'ate30');
    assert.deepEqual(out.map(o => o.debtId).sort(), ['c1', 'f1', 'v1']);
    assert.ok(out.every(o => o.urgent));
  });
});

describe('Fase 4c — Agenda: ponto de prescrição pelo cartão', () => {
  it('só com data de prazo; Tratadas, Adiadas, Consumadas antigas e Ajuizar de 60 a 180 dias nunca; urgente = fileira 1', () => {
    const dl = { dateIsDeadline: true, sortDate: '2026-10-05' };
    assert.deepEqual(mesaAgendaPoint(ci('a', 'fato', dl)), { d: '2026-10-05', urgent: true });
    assert.deepEqual(mesaAgendaPoint(ci('b', 'vigiar', dl)), { d: '2026-10-05', urgent: false });
    assert.deepEqual(mesaAgendaPoint(ci('c', 'sempressa', dl)), { d: '2026-10-05', urgent: false });
    assert.equal(mesaAgendaPoint(ci('d', 'ajuizar', { ...dl, ajuizarLonge: true })), null);
    assert.equal(mesaAgendaPoint(ci('e', 'ajuizar', dl)).urgent, true);
    ['tratadas', 'adiadas', 'antigas'].forEach(c => assert.equal(mesaAgendaPoint(ci('x', c, dl)), null, c));
    assert.equal(mesaAgendaPoint(ci('f', 'fato')), null, 'sem prazo');
    assert.equal(mesaAgendaPoint(null), null);
  });
});

describe('Fase 4c — relatório de passagem: CDAs a agir por cartão', () => {
  const mc = (() => {
    const items = [
      ci('a1', 'ajuizar', { dateIsDeadline: true, sortDate: '2026-10-21' }),
      ci('a2', 'ajuizar', { dateIsDeadline: true, sortDate: '2027-01-20', ajuizarLonge: true }),
      ci('c1', 'calculo', { row: { prescDays: -40, keyDate: '2026-08-22', summary: 'consumada há pouco' } }),
      ci('f1', 'fato', { dateIsDeadline: true, sortDate: '2026-09-20', debt: { id: 'f1', operationId: 'op2', cdaNumber: 'OUTRA', value: 5 } }),
      ci('v1', 'vigiar'),
    ];
    const byCard = {}; MESA_CARDS.forEach(c => { byCard[c.id] = []; });
    items.forEach(i => byCard[i.card].push(i));
    return { items, byCard, byDebt: byDebtOf(items) };
  })();

  it('um grupo por cartão da fileira 1, na ordem da Mesa; só a operação; sem Ajuizar cinza nem fileira 2', () => {
    const g = mesaAlertGroups(mc, { opId: 'op1', today: TODAY, fmtCur: v => 'R$ ' + v });
    assert.deepEqual(g.map(x => x.card), ['calculo', 'ajuizar']);
    assert.deepEqual(g.map(x => x.nome), ['Conferir o cálculo', 'Ajuizar']);
    assert.deepEqual(g[1].items.map(x => x.cda), ['CDA-a1']);
    assert.equal(g[1].items[0].termLabel, '21/10/2026');
    assert.equal(g[1].items[0].late, false);
    assert.equal(g[0].items[0].late, true, 'consumada há pouco fica em vermelho');
    assert.equal(g[0].items[0].situacao, 'consumada há pouco');
    assert.equal(g[1].items[0].valorLabel, 'R$ 100');
  });

  it('sem filtro de operação entram todas; sem nada a agir, lista vazia', () => {
    assert.deepEqual(mesaAlertGroups(mc, { today: TODAY }).map(x => x.card), ['calculo', 'ajuizar', 'fato']);
    assert.deepEqual(mesaAlertGroups({ items: [], byCard: {} }, { today: TODAY }), []);
    assert.deepEqual(mesaAlertGroups(null, {}), []);
  });

  it('situação padrão: com processo «em acompanhamento»; sem processo «sem processo — ajuizar»', () => {
    const a = ci('z1', 'dado', { row: null });
    const b = ci('z2', 'dado', { row: null, debt: { id: 'z2', operationId: 'op1', cdaNumber: 'Z2', processNumber: '5000001-00.2020.4.04.7000', value: 1 } });
    const byCard = {}; MESA_CARDS.forEach(c => { byCard[c.id] = []; }); byCard.dado = [a, b];
    const g = mesaAlertGroups({ items: [a, b], byCard }, { opId: 'op1', today: TODAY });
    assert.deepEqual(g[0].items.map(x => x.situacao), ['sem processo — ajuizar', 'em acompanhamento']);
  });
});

describe('Fase 4c — Relógios agrupados e coloridos pelos cartões', () => {
  const OP = { id: 'op1', name: 'Operação Teste', status: 'ativa' };
  const debt = (o) => ({ operationId: 'op1', status: 'ativa', value: 100000, tribute: 'IRPJ', ...o });
  const data = {
    operations: [OP],
    people: [],
    debts: [
      debt({ id: 'd-crit', cdaNumber: '90.6.23.000884-40', prescriptionDate: '2026-12-10', value: 48000 }),
      debt({ id: 'd-alerta', cdaNumber: '90.6.20.000881-40', prescriptionDate: '2027-03-10', value: 95000 }),
      debt({ id: 'd-corre', cdaNumber: '90.6.23.000200-45', prescriptionDate: '2028-09-27', value: 180000 }),
      debt({ id: 'd-ef1', cdaNumber: '90.6.23.000123-45', processNumber: '5001234-56.2023.4.04.7001', status: 'ativa_ajuizada', value: 700000 }),
      debt({ id: 'd-ef2', cdaNumber: '90.6.23.000129-45', processNumber: '5001234-56.2023.4.04.7001', status: 'ativa_ajuizada', value: 300000 }),
      debt({ id: 'd-parc', cdaNumber: '90.6.22.000778-01', status: 'parcelada', prescriptionDate: '2028-06-12', value: 150000 }),
      debt({ id: 'd-treated', cdaNumber: '90.6.18.000001-00', prescriptionDate: '2026-11-01', prescriptionHandled: true, prescriptionHandledType: 'declarada' }),
    ],
    executions: [{ id: 'ex1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', protocolDate: '2025-05-19', status: 'ativa', processTag: 'normal' }],
    prescriptionEvents: [{ id: 'pe1', cdaId: 'd-parc', type: 'susp_parcelamento', date: '2026-03-15' }],
  };
  const lookup = createPrescLookup(data.debts, data.executions, data.prescriptionEvents, TODAY);
  const radar = buildPrazosRadar(data, TODAY, lookup, { policy: 'v2' });
  const mc = buildMesaCards({ data, radar, prescLookup: lookup, today: TODAY });
  const res = clkBuild({ data, rows: radar.rows, silenced: radar.silenced, lookup, today: TODAY, opId: '' });

  it('cada relógio cai no cartão da sua CDA; os grupos seguem a ordem de MESA_CARDS', () => {
    const groups = mesaClockGroups(res.clocks, mc);
    const order = MESA_CARDS.map(c => c.id);
    const idx = groups.map(g => order.indexOf(g.card));
    assert.deepEqual(idx, idx.slice().sort((a, b) => a - b));
    assert.ok(groups.length >= 2, 'a amostra tem mais de um cartão');
    // cada CDA de cada relógio aparece no grupo de um cartão que é o mais urgente dela (ou o de um irmão de processo)
    groups.forEach(g => g.rows.forEach(r => {
      const cards = r.clock.cdaIds.map(id => mc.byDebt.get(id).card);
      assert.equal(g.card, cards.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b))[0]);
      assert.equal(r.card, g.card);
    }));
    // nenhum relógio some
    assert.equal(groups.reduce((s, g) => s + g.rows.length, 0), res.clocks.length);
  });

  it('dentro do grupo, a ordem é a da Mesa (a mesma de mesaListOrder)', () => {
    const groups = mesaClockGroups(res.clocks, mc);
    groups.forEach(g => {
      const mesaOrder = (mc.byCard[g.card] || []).map(i => i.debtId);
      const pos = g.rows.map(r => mesaOrder.indexOf(r.lead.debtId));
      assert.deepEqual(pos, pos.slice().sort((a, b) => a - b), g.card);
    });
  });

  it('CDA sem cartão vai a «Só vigiar»', () => {
    const fake = { id: 'k', cdaIds: ['sem-cartao'], leadId: 'sem-cartao', n: 1 };
    assert.equal(mesaClockCard(fake, mc.byDebt), 'vigiar');
    assert.equal(mesaClockLead(fake, mc.byDebt), null);
    const g = mesaClockGroups([fake], mc);
    assert.equal(g.length, 1);
    assert.equal(g[0].card, 'vigiar');
    assert.equal(g[0].rows[0].tone, 'neutral');
  });

  it('KPI «A agir» bate com os cartões do mesmo recorte (operação e debtIds)', () => {
    const k = mesaClockKpis(res.clocks, mc, TODAY);
    const esperado = mc.items.filter(mesaIsAction);
    assert.equal(k.agir.cdas, esperado.length);
    assert.equal(k.agir.value, esperado.reduce((s, i) => s + i.value, 0));
    assert.equal(k.agir.cdas, mesaActionCount(mc.totals).n);
    // recorte por debtIds: só as CDAs pedidas
    const ids = new Set(['d-crit', 'd-corre']);
    const sub = clkBuild({ data, rows: radar.rows, silenced: radar.silenced, lookup, today: TODAY, opId: 'op1', debtIds: ids });
    const ks = mesaClockKpis(sub.clocks, mc, TODAY);
    assert.equal(ks.agir.cdas, mc.items.filter(i => ids.has(i.debtId) && mesaIsAction(i)).length);
    // o resto (próximo termo, parado, piso) continua o de clkKpis
    assert.equal(k.parc.cdas, 1);
    assert.ok(k.next && k.next.term);
  });

  it('pontos do calendário ganham o cartão do relógio; a célula usa o cartão predominante e o tom da Mesa', () => {
    const strip = clkStrip(res.clocks, TODAY);
    const pts = mesaClockPoints(strip.points, res.clocks, mc.byDebt);
    assert.equal(pts.length, strip.points.length);
    pts.forEach(p => assert.ok(MESA_CARDS.some(c => c.id === p.card) && p.group === p.card));
    const cal = clkQuarterBins(pts, TODAY, { groupOf: mesaCalPredominant });
    const cells = [cal.overdue, ...cal.cols.flatMap(c => [c.term, c.piso])].filter(c => c.points.length);
    assert.ok(cells.length > 0);
    cells.forEach(c => assert.ok(MESA_CARDS.some(m => m.id === c.group) || c.group === 'piso'));
    // tom da célula: o do cartão (nunca crit/alerta/corre)
    cells.forEach(c => assert.ok(['red', 'orange', 'blue', 'neutral'].includes(mesaCalTone(c.group))));
  });

  it('simulação «E se eu ajuizar hoje?» mantém o cartão do relógio (só a leitura muda)', () => {
    const c = res.clocks.find(x => x.kind === 'orig');
    assert.ok(c, 'há um relógio de originária na amostra');
    const sim = { ok: true, floor: '2032-10-01', anchor: { iso: TODAY, kind: 'despacho' } };
    const s = clkApplySim(c, sim, TODAY);
    assert.equal(s.kind, 'piso');
    assert.equal(mesaClockCard(s, mc.byDebt), mesaClockCard(c, mc.byDebt));
  });
});

describe('Fase 4c — a Mesa de prazos não mudou', () => {
  it('buildMesaCards segue devolvendo um cartão por CDA, e mesaIsAction só a fileira 1', () => {
    const OP = { id: 'op1', name: 'Op', status: 'ativa' };
    const data = { debts: [{ id: 'a', operationId: 'op1', status: 'ativa', value: 1 }], operations: [OP], executions: [], prescriptionEvents: [] };
    const out = buildMesaCards({ data, radar: { rows: [], silenced: [] }, prescLookup: () => ({ segment: null, phase: 'sem_dados', status: 'sem_dados' }), today: TODAY });
    assert.equal(out.items.length, 1);
    assert.equal(out.items[0].card, 'dado');
    assert.equal(mesaIsAction(out.items[0]), true);
  });
});
