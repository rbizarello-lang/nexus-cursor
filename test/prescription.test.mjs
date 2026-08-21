import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessDays, daysBetween, daysUntil, isBusinessDay, setExtraHolidays } from '../src/lib/dates.js';
import {
  buildPrescricaoReport,
  buildProcessPrescricaoReport,
  calcPrescription,
  computeCdaLegalTimeline,
  computeDecadencia,
  computeOrdinaria,
  computePrescription,
  createPrescDateLookup,
  createPrescLookup,
  fillRequestDate,
  eventNeedsRequestDate,
  IDPJ_CONSTRICTION_TYPE,
  idpjPropagationPayload,
  migratePrescriptionEvents,
  shouldPropagateIdpjAsSuspension,
  suggestLaunchMode,
  inferParcelamentoEnds,
} from '../src/lib/prescription.js';

const ASOF = '2026-08-16';

const cda = (over = {}) => ({ id: 'd1', inscriptionDate: '2020-01-15', processNumber: '50012345620234047001', ...over });
const ef = (over = {}) => ({ id: 'e1', processNumber: '50012345620234047001', protocolDate: '2021-03-01', ...over });

describe('computePrescription — decisões fechadas', () => {
  it('1. ajuizada sem marco: não inicia, sem termo final, sem alarme', () => {
    const r = computePrescription({ debt: cda(), executions: [ef()], events: [], asOf: ASOF });
    assert.equal(r.phase, 'nao_iniciado');
    assert.equal(r.status, 'seguro');
    assert.equal(r.diesAdQuem, null);
    assert.equal(r.daysLeft, null);
  });

  it('2. não ajuizada: inscrição + 5 anos civis, origem estimativa', () => {
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2022-01-10' },
      executions: [],
      events: [],
      asOf: ASOF
    });
    assert.equal(r.segment, 'credito');
    assert.equal(r.origin, 'estimativa');
    assert.equal(r.diesAdQuem, '2027-01-10');
    assert.ok(r.gaps.some(g => /constituição|inscrição/i.test(g)));
  });

  it('3. marco isolado: 1 ano civil + 5 anos civis (não 365/1825)', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2024-02-29' }],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2024-02-29');
    // 1 ano civil a partir de 29/02/2024 → 28/02/2025 (JS); depois +5 anos
    assert.ok(r.diesAdQuem.startsWith('2030-02') || r.diesAdQuem.startsWith('2030-03') || r.diesAdQuem === '2029-02-28' || r.diesAdQuem >= '2029-02-28');
    assert.notEqual(r.daysLeft, 5 * 365 - daysUntil('2024-02-29', ASOF));
    assert.equal(r.origin, 'calculo_validado');
    assert.ok(r.phase === 'correndo' || r.phase === 'suspensao_art40');
  });

  it('4. marco + susp_art40 no mesmo dia: ano contado uma vez', () => {
    const events = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2023-08-16' },
      { id: 's', executionId: 'e1', type: 'susp_art40', date: '2023-08-16' }
    ];
    const a = computePrescription({ debt: cda(), executions: [ef()], events: [events[0]], asOf: ASOF });
    const b = computePrescription({ debt: cda(), executions: [ef()], events, asOf: ASOF });
    assert.equal(a.diesAdQuem, b.diesAdQuem);
  });

  it('5. parcelamento encerrado: quinquênio integral da rescisão, sem o ano do art. 40', () => {
    const withParc = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-06-01', endDate: '2021-06-01' }
      ],
      asOf: ASOF
    });
    assert.equal(withParc.diesAQuo, '2021-06-01');
    assert.equal(withParc.diesAdQuem, '2026-06-01');
    assert.equal(withParc.phase, 'consumado');
    assert.ok(withParc.detail.includes('rescisão') || withParc.memory.some(m => /rescisão/i.test(m.effect)));
  });

  it('6. penhora na EF com pedido anterior: interrompe retroagindo ao pedido', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_penhora', requestDate: '2023-03-10', date: '2023-08-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.equal(r.status, 'seguro');
    assert.ok(r.detail.includes('interrompida') || r.prescriptionInterrupted);
  });

  it('7. pedido na janela 1+5, efetivação depois: salva o feito', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_sisbajud', requestDate: '2023-12-01', date: '2025-06-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.equal(r.status, 'seguro');
  });

  it('8. pedido após a janela: não salva', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_sisbajud', requestDate: '2024-06-01', date: '2024-07-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'consumado');
    assert.equal(r.status, 'prescrito');
  });

  it('9. IDPJ com constrição: suspende desde o pedido; cessação retoma sem zerar', () => {
    const eventsOpen = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
      { id: 'i', executionId: 'e1', type: IDPJ_CONSTRICTION_TYPE, requestDate: '2022-01-10', date: '2022-03-01', _inheritedFromIDPJ: 'idpj1' }
    ];
    const open = computePrescription({ debt: cda(), executions: [ef()], events: eventsOpen, asOf: ASOF });
    assert.equal(open.phase, 'suspenso');
    assert.notEqual(open.status, 'seguro');

    const closed = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ ...eventsOpen[0] }, { ...eventsOpen[1], endDate: '2023-01-10' }],
      asOf: ASOF
    });
    assert.notEqual(closed.phase, 'interrompido');
    assert.ok(closed.diesAdQuem);
    const baseline = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [eventsOpen[0]],
      asOf: ASOF
    });
    assert.ok(closed.diesAdQuem > baseline.diesAdQuem);
  });

  it('10. MCF com indisponibilidade: mesma suspensão', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'i', executionId: 'e1', type: IDPJ_CONSTRICTION_TYPE, requestDate: '2021-05-01', date: '2021-06-01', _inheritedFromIDPJ: 'mcf1' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'suspenso');
  });

  it('11. evento só em cdaId entra no cômputo do processo', () => {
    const events = [
      { id: 'm', cdaId: 'd1', type: 'marco_sem_bens', date: '2023-01-01' }
    ];
    const viaCda = computePrescription({ debt: cda(), executions: [ef()], events, asOf: ASOF });
    const kpi = calcPrescription('e1', events, { debts: [cda()], executions: [ef()], asOf: ASOF });
    assert.ok(viaCda.diesAdQuem);
    assert.notEqual(kpi.status, 'sem_dados');
    assert.notEqual(kpi.status, 'seguro');
  });

  it('12. constrição na EF: fase interrompido; CDA não some (lookup tem memória)', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_penhora', date: '2022-01-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.ok(r.memory.length > 0);
    const date = createPrescDateLookup([cda()], [ef()], [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
      { id: 'p', executionId: 'e1', type: 'int_penhora', date: '2022-01-01' }
    ], ASOF)(cda());
    assert.equal(date, '');
  });
});

describe('propagação IDPJ e migração', () => {
  it('pedido vazio na constrição grava igual à efetivação; alias da citação some', () => {
    const filled = fillRequestDate({ type: 'int_penhora', date: '2024-05-01' });
    assert.equal(filled.requestDate, '2024-05-01');
    const cit = fillRequestDate({ type: 'int_citacao_devedor', date: '2024-01-02' });
    assert.equal(cit.type, 'int_citacao');
    assert.equal(cit.requestDate, '2024-01-02');
    assert.equal(eventNeedsRequestDate('int_sisbajud'), true);
    assert.equal(eventNeedsRequestDate('marco_sem_bens'), false);
  });

  it('int_cnib no incidente vira suspensão com requestDate', () => {
    const p = idpjPropagationPayload({ type: 'int_cnib', date: '2024-05-01', requestDate: '2024-04-01' });
    assert.equal(p.type, IDPJ_CONSTRICTION_TYPE);
    assert.equal(p.requestDate, '2024-04-01');
    assert.equal(shouldPropagateIdpjAsSuspension('int_cnib'), true);
    assert.equal(shouldPropagateIdpjAsSuspension('int_citacao'), false);
    const pEmpty = idpjPropagationPayload({ type: 'int_cnib', date: '2024-05-01' });
    assert.equal(pEmpty.type, IDPJ_CONSTRICTION_TYPE);
    assert.equal(pEmpty.requestDate, '2024-05-01');
  });

  it('migra eventos herdados de IDPJ que ainda têm tipo cru', () => {
    const out = migratePrescriptionEvents([
      { id: '1', type: 'int_cnib', date: '2024-01-01', _inheritedFromIDPJ: 'x' },
      { id: '2', type: 'int_citacao_devedor', date: '2024-01-02' }
    ]);
    assert.equal(out[0].type, IDPJ_CONSTRICTION_TYPE);
    assert.equal(out[0].requestDate, '2024-01-01');
    assert.equal(out[1].type, 'int_citacao');
  });
});

describe('calendário de prazos', () => {
  it('fim de semana e recesso não são dia útil', () => {
    assert.equal(isBusinessDay(new Date('2026-08-15T00:00:00')), false); // sábado
    assert.equal(isBusinessDay(new Date('2026-12-24T00:00:00')), false); // recesso
  });

  it('feriado local extra entra no cômputo', () => {
    setExtraHolidays([]);
    const without = addBusinessDays('2026-08-17', 1); // segunda → terça 18
    setExtraHolidays(['2026-08-18']);
    const withLocal = addBusinessDays('2026-08-17', 1);
    assert.equal(without, '2026-08-18');
    assert.equal(withLocal, '2026-08-19');
    setExtraHolidays([]);
  });
});

describe('decadência e prescrição ordinária', () => {
  it('150 §4º obstada: homologação com pagamento, constituição dentro do quinquênio', () => {
    const r = computeDecadencia({
      launchMode: 'homologacao_pagamento',
      taxPeriodEnd: '2019-06-30',
      constitutionDate: '2023-05-10'
    }, ASOF);
    assert.equal(r.rule, '150_4');
    assert.equal(r.diesAQuo, '2019-06-30');
    assert.equal(r.diesAdQuem, '2024-06-30');
    assert.equal(r.status, 'obstada');
  });

  it('regra geral sem modalidade + constituição tardia: 173 I consumada, com gap', () => {
    const r = computeDecadencia({
      taxPeriodEnd: '2019-03-31',
      constitutionDate: '2026-02-01'
    }, ASOF);
    assert.equal(r.diesAQuo, '2020-01-01');
    assert.equal(r.diesAdQuem, '2025-01-01');
    assert.equal(r.status, 'consumada');
    assert.ok(r.gaps.length > 0);
  });

  it('declarado: obstada pela Súmula 436', () => {
    const r = computeDecadencia({
      launchMode: 'declarado',
      constitutionDate: '2020-05-05'
    }, ASOF);
    assert.equal(r.status, 'obstada');
    assert.equal(r.rule, 'declarado');
    assert.ok(r.detail.includes('436'));
  });

  it('sem âncoras: sem_dados e gaps', () => {
    const r = computeDecadencia({}, ASOF);
    assert.equal(r.status, 'sem_dados');
    assert.ok(r.gaps.length > 0);
  });

  it('presunção pela inscrição: ofício obstada com origem estimativa', () => {
    const r = computeDecadencia({
      launchMode: 'oficio',
      taxPeriodEnd: '2018-12-31',
      inscriptionDate: '2022-06-01'
    }, ASOF);
    assert.equal(r.diesAQuo, '2019-01-01');
    assert.equal(r.diesAdQuem, '2024-01-01');
    assert.equal(r.status, 'obstada');
    assert.equal(r.origin, 'estimativa');
  });

  it('ordinária ajuizada dentro do quinquênio: interrompida (Tema 383)', () => {
    const r = computeOrdinaria({
      debt: cda({ constitutionDate: '2020-06-01' }),
      executions: [ef()],
      events: [],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.equal(r.status, 'seguro');
    assert.equal(r.diesAdQuem, null);
    assert.ok(r.detail.includes('383'));
  });

  it('ordinária ajuizada fora do quinquênio: consumada', () => {
    const r = computeOrdinaria({
      debt: cda({ constitutionDate: '2014-01-01' }),
      executions: [ef()],
      events: [],
      asOf: ASOF
    });
    assert.equal(r.phase, 'consumado');
    assert.equal(r.status, 'prescrito');
  });

  it('não ajuizada inalterada: inscrição + 5 anos', () => {
    const r = computeOrdinaria({
      debt: { id: 'd1', inscriptionDate: '2022-01-10' },
      executions: [],
      events: [],
      asOf: ASOF
    });
    assert.equal(r.diesAdQuem, '2027-01-10');
  });

  it('citação sem marco não inaugura a intercorrente', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'c', executionId: 'e1', type: 'int_citacao', date: '2024-12-25' }],
      asOf: ASOF
    });
    assert.equal(r.phase, 'nao_iniciado');
    assert.equal(r.status, 'seguro');
    assert.ok(r.memory.some(m => /não inaugura/i.test(m.effect)));
  });

  it('computeCdaLegalTimeline: ajuizada tem os três segmentos; não ajuizada sem intercorrente', () => {
    const ajuizada = computeCdaLegalTimeline({
      debt: cda({ constitutionDate: '2020-06-01', taxPeriodEnd: '2019-12-31', launchMode: 'oficio' }),
      executions: [ef()],
      events: [],
      asOf: ASOF
    });
    assert.ok(ajuizada.decadencia);
    assert.ok(ajuizada.ordinaria);
    assert.ok(ajuizada.intercorrente);
    assert.ok(ajuizada.worst.key);

    const naoAjuizada = computeCdaLegalTimeline({
      debt: { id: 'x', inscriptionDate: '2022-01-10' },
      executions: [],
      events: [],
      asOf: ASOF
    });
    assert.equal(naoAjuizada.intercorrente, null);
  });

  it('relatórios: memória técnica, recorte de decadência e consolidado de 2 inscrições', () => {
    const debt = cda({ constitutionDate: '2020-06-01', taxPeriodEnd: '2019-12-31', launchMode: 'oficio' });
    const timeline = computeCdaLegalTimeline({
      debt,
      executions: [ef()],
      events: [],
      asOf: ASOF
    });
    const full = buildPrescricaoReport({ debt, timeline, personName: 'Fulano', exec: ef(), scope: 'completo', asOf: ASOF });
    assert.ok(full.includes('MEMÓRIA TÉCNICA'));

    const onlyDec = buildPrescricaoReport({ debt, timeline, personName: 'Fulano', exec: ef(), scope: 'decadencia', asOf: ASOF });
    assert.ok(!onlyDec.includes('PRESCRIÇÃO ORDINÁRIA'));

    const other = { id: 'd2', inscriptionDate: '2022-01-10' };
    const process = buildProcessPrescricaoReport({
      exec: ef(),
      entries: [
        { debt, timeline, personName: 'Fulano' },
        { debt: other, timeline: computeCdaLegalTimeline({ debt: other, executions: [], events: [], asOf: ASOF }), personName: 'Beltrano' }
      ],
      scope: 'completo',
      asOf: ASOF
    });
    assert.ok(process.includes('2 inscrição'));
  });

  it('suggestLaunchMode: DCTF, auto de infração e vazio', () => {
    assert.equal(suggestLaunchMode('DCTF ...'), 'declarado');
    assert.equal(suggestLaunchMode('AUTO DE INFRAÇÃO'), 'oficio');
    assert.equal(suggestLaunchMode(''), '');
  });
});

describe('parcelamento sem cessação no originário', () => {
  it('adesões intermediárias sem endDate não projetam asOf+5 (CDA não ajuizada)', () => {
    const events = [
      { id: 'p1', cdaId: 'd1', type: 'susp_parcelamento', date: '2000-04-20', endDate: '2009-11-25' },
      { id: 'p2', cdaId: 'd1', type: 'susp_parcelamento', date: '2009-11-25' },
      { id: 'p3', cdaId: 'd1', type: 'susp_parcelamento', date: '2011-05-22' },
      { id: 'p4', cdaId: 'd1', type: 'susp_parcelamento', date: '2016-06-11', endDate: '2017-10-31' },
      { id: 'cit', cdaId: 'd1', type: 'int_despacho_citacao', date: '2017-10-31' },
      { id: 'p5', cdaId: 'd1', type: 'susp_parcelamento', date: '2019-07-09', endDate: '2021-10-04' }
    ];
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '1999-05-20' },
      executions: [],
      events,
      asOf: '2026-08-17'
    });
    assert.notEqual(r.diesAdQuem, '2031-08-17');
    assert.notEqual(r.phase, 'suspenso');
    assert.ok(r.diesAdQuem >= '2026-10-01' && r.diesAdQuem <= '2026-10-10', r.diesAdQuem);
    assert.ok(r.daysLeft != null && r.daysLeft < 90, String(r.daysLeft));
    assert.ok(r.gaps.some(g => /cessação|adesão seguinte/i.test(g)));
    assert.ok(r.gaps.some(g => /citação|ajuiz/i.test(g)));
    const inferred = inferParcelamentoEnds(events);
    assert.equal(inferred.get('p2').end, '2011-05-22');
    assert.equal(inferred.get('p3').end, '2016-06-11');
    assert.equal(inferred.has('p5'), false);
  });

  it('último parcelamento sem cessação permanece vigente', () => {
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2020-01-15' },
      executions: [],
      events: [{ id: 'p', cdaId: 'd1', type: 'susp_parcelamento', date: '2024-03-01' }],
      asOf: '2026-08-17'
    });
    assert.equal(r.phase, 'suspenso');
    assert.ok(r.diesAdQuem === '2031-08-16' || r.diesAdQuem === '2031-08-17', r.diesAdQuem);
    assert.ok(r.daysLeft >= 1820, String(r.daysLeft));
  });

  it('rescisão posterior encerra parcelamento aberto mesmo sem nova adesão', () => {
    const events = [
      { id: 'p', cdaId: 'd1', type: 'susp_parcelamento', date: '2020-01-10' },
      { id: 'r', cdaId: 'd1', type: 'int_rescisao_parcelamento', date: '2021-06-01' }
    ];
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2018-01-01' },
      executions: [],
      events,
      asOf: '2026-08-17'
    });
    assert.notEqual(r.phase, 'suspenso');
    assert.equal(r.diesAdQuem, '2026-06-01');
    assert.equal(inferParcelamentoEnds(events).get('p').reason, 'rescisao');
  });
});

describe('parcelamento na intercorrente (TRF4)', () => {
  it('vigente: suspende a exigibilidade e não deixa o quinquênio fluir', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2024-03-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'suspenso');
    assert.equal(r.status, 'suspenso');
    assert.ok(/interrompe/i.test(r.detail));
    assert.ok(r.memory.some(m => /174|Súmula 653|TRF4/i.test(m.effect)));
  });

  it('sem marco: rescisão já deflagra o quinquênio (não fica não-iniciado)', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-10', endDate: '2021-06-01' }],
      asOf: ASOF
    });
    assert.notEqual(r.phase, 'nao_iniciado');
    assert.equal(r.diesAQuo, '2021-06-01');
    assert.equal(r.diesAdQuem, '2026-06-01');
    assert.equal(r.phase, 'consumado');
  });

  it('dois parcelamentos: relógio da última rescisão', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'p1', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-01', endDate: '2019-01-01' },
        { id: 'p2', executionId: 'e1', type: 'susp_parcelamento', date: '2022-01-01', endDate: '2023-01-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2023-01-01');
    assert.equal(r.diesAdQuem, '2028-01-01');
    assert.equal(r.phase, 'correndo');
  });

  it('marco posterior à rescisão não soma o ano do art. 40', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-01', endDate: '2022-08-16' },
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2023-01-10' }
      ],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2022-08-16');
    assert.equal(r.diesAdQuem, '2027-08-16');
    assert.ok(r.memory.some(m => /não se soma o ano/i.test(m.effect)));
  });
});

describe('createPrescLookup — índice de eventos', () => {
  it('bate com computePrescription isolado (evento em lote + evento da execução)', () => {
    const debts = [
      cda({ id: 'd1' }),
      cda({ id: 'd2', processNumber: '50099995620234047001' })
    ];
    const execs = [
      ef({ id: 'e1' }),
      ef({ id: 'e2', processNumber: '50099995620234047001' })
    ];
    const events = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2024-02-29' },
      { id: 'b', batchCdaIds: ['d1', 'd2'], type: 'int_citacao', date: '2024-03-10' }
    ];
    const lookup = createPrescLookup(debts, execs, events, ASOF);
    for (const d of debts) {
      const a = lookup(d);
      const b = computePrescription({ debt: d, executions: execs, events, asOf: ASOF });
      assert.equal(a.phase, b.phase, d.id);
      assert.equal(a.diesAdQuem, b.diesAdQuem, d.id);
      assert.equal(a.origin, b.origin, d.id);
    }
  });
});
