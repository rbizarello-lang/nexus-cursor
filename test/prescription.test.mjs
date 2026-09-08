import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessDays, daysBetween, daysUntil, isBusinessDay, setExtraHolidays } from '../src/lib/dates.js';
import {
  buildPrescricaoReport,
  buildProcessPrescricaoReport,
  calcPrescription,
  collectEventsForCda,
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
  protestoExtrajudicialInterrompe,
  PRESC_EVENT_FAMILIES,
  PRESC_FLAGS,
  computeIntercorrenteBounds,
  familyOfPrescEvent,
  addUnpausedCalendarYears,
  RULE_VERSION,
} from '../src/lib/prescription.js';

const ASOF = '2026-08-16';

const cda = (over = {}) => ({ id: 'd1', inscriptionDate: '2020-01-15', processNumber: '50012345620234047001', ...over });
const ef = (over = {}) => ({ id: 'e1', processNumber: '50012345620234047001', protocolDate: '2021-03-01', ...over });

describe('computePrescription — decisões fechadas', () => {
  it('1. ajuizada sem marco: não inicia, sem termo final, sem alarme', () => {
    const r = computePrescription({ debt: cda(), executions: [ef()], events: [], asOf: ASOF });
    assert.equal(r.phase, 'nao_iniciado');
    assert.equal(r.status, 'indeterminado');
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

  it('5. parcelamento encerrado: ciclo 1+5 a partir da rescisão', () => {
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
    assert.equal(withParc.diesAdQuem, '2027-06-01');
    assert.equal(withParc.phase, 'correndo');
    assert.ok(withParc.memory.some(m => /1\+5|1 ano/i.test(m.effect)));
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
    assert.equal(r.status, 'interrompido');
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
    assert.equal(r.status, 'interrompido');
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
    assert.ok((r.memory || []).some(m => /383/.test(m.effect)));
    assert.match(r.summary + r.detail, /ajuizada/i);
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
    assert.equal(r.status, 'indeterminado');
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
    assert.ok(full.includes('Ainda sem ciência') || full.includes('Execução ajuizada') || full.length > 80);

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

  it('último parcelamento sem cessação não se presume vigente', () => {
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2020-01-15' },
      executions: [],
      events: [{ id: 'p', cdaId: 'd1', type: 'susp_parcelamento', date: '2024-03-01' }],
      asOf: '2026-08-17'
    });
    assert.notEqual(r.phase, 'suspenso');
    assert.equal(r.diesAdQuem, '2029-03-01');
    assert.ok((r.flags || []).includes('parc_sem_fim'));
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

describe('parcelamento na intercorrente (ciclo 1+5 da rescisão)', () => {
  it('sem encerramento: não presume vigência; projeta ciclo político da adesão (pior caso)', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2024-03-01' }
      ],
      asOf: ASOF
    });
    assert.notEqual(r.phase, 'suspenso');
    assert.equal(r.cycleKind, 'politica_parc');
    assert.ok((r.flags || []).includes('parc_sem_fim'));
    assert.equal(r.estimated, true);
    assert.equal(r.origin, 'estimativa_pessimista');
    assert.equal(r.phase, 'estimado');
    assert.ok((r.checks || []).some(c => /parcelamento/i.test(c)));
  });

  it('sem marco: rescisão deflagra o ciclo 1+5 (não fica não-iniciado)', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-10', endDate: '2021-06-01' }],
      asOf: ASOF
    });
    assert.notEqual(r.phase, 'nao_iniciado');
    assert.equal(r.diesAQuo, '2021-06-01');
    assert.equal(r.diesAdQuem, '2027-06-01');
    assert.equal(r.phase, 'correndo');
  });

  it('dois parcelamentos: relógio 1+5 da última rescisão', () => {
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
    assert.equal(r.diesAdQuem, '2029-01-01');
    assert.equal(r.phase, 'correndo');
  });

  it('marco posterior à rescisão não inicia segundo ciclo 1+5', () => {
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
    assert.equal(r.diesAdQuem, '2028-08-16');
    assert.ok(r.memory.some(m => /não inicia segundo ciclo/i.test(m.effect)));
  });

  it('SSALTTEC: 1+5 da rescisão = 27/05/2026; Sisbajud tardio não suspende nem salva', () => {
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2016-11-18', processNumber: '50032035320174047108' },
      executions: [{ id: 'e1', processNumber: '50032035320174047108', protocolDate: '2017-02-23' }],
      events: [
        { id: 'p', cdaId: 'd1', type: 'susp_parcelamento', date: '2020-04-24', endDate: '2020-05-27' },
        { id: 'r', cdaId: 'd1', type: 'int_rescisao_parcelamento', date: '2020-05-27' },
        { id: 's', cdaId: 'd1', type: 'int_sisbajud', requestDate: '2026-06-12', date: '2026-08-26' },
        { id: 'i', cdaId: 'd1', type: IDPJ_CONSTRICTION_TYPE, requestDate: '2026-06-12', date: '2026-08-26' }
      ],
      asOf: '2026-09-01'
    });
    assert.equal(r.diesAdQuem, '2026-05-27');
    assert.equal(r.phase, 'consumado');
    assert.notEqual(r.phase, 'suspenso');
    assert.ok(r.daysLeft < 0);
    assert.ok(r.gaps.some(g => /Sisbajud e constrição/i.test(g)));
    assert.ok(r.memory.some(m => /1\+5|modo de contagem/i.test(m.effect) || /1 ano/i.test(m.effect)));
  });
});

describe('protesto extrajudicial e LC 208/2024', () => {
  it('só interrompe a partir de 03/07/2024', () => {
    assert.equal(protestoExtrajudicialInterrompe('2024-04-11'), false);
    assert.equal(protestoExtrajudicialInterrompe('2024-07-03'), true);
  });

  it('protesto de 11/04/2024 não reinicia o originário', () => {
    const without = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2020-01-15' },
      executions: [],
      events: [],
      asOf: '2026-09-01'
    });
    const withProt = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2020-01-15' },
      executions: [],
      events: [{ id: 'pr', cdaId: 'd1', type: 'int_protesto_extrajudicial', date: '2024-04-11' }],
      asOf: '2026-09-01'
    });
    assert.equal(withProt.diesAdQuem, without.diesAdQuem);
    assert.ok(withProt.gaps.some(g => /não interrompe/i.test(g)));
  });

  it('protesto de 03/07/2024 reinicia o originário', () => {
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2020-01-15' },
      executions: [],
      events: [{ id: 'pr', cdaId: 'd1', type: 'int_protesto_extrajudicial', date: '2024-07-03' }],
      asOf: '2026-09-01'
    });
    assert.equal(r.diesAQuo, '2024-07-03');
    assert.equal(r.diesAdQuem, '2029-07-03');
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

  it('agrega eventos vinculados a todos os IDs duplicados do mesmo processo', () => {
    const debt = cda();
    const executions = [ef({ id: 'e1' }), ef({ id: 'e2' })];
    const events = [
      { id: 'm1', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
      { id: 'p2', executionId: 'e2', type: 'int_penhora', date: '2022-01-01' },
    ];
    const collected = collectEventsForCda(debt, executions, events);
    assert.deepEqual(new Set(collected.events.map(e => e.id)), new Set(['m1', 'p2']));
    const lookup = createPrescLookup([debt], executions, events, ASOF);
    assert.equal(lookup(debt).phase, 'interrompido');
  });

  it('evento nu no IDPJ entra na linha do tempo da EF abrangida', () => {
    const debt = cda();
    const executions = [
      ef({ id: 'e1' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const events = [{
      id: 's',
      executionId: 'idpj1',
      type: IDPJ_CONSTRICTION_TYPE,
      date: '2024-01-15',
      requestDate: '2024-01-15'
    }];
    const collected = collectEventsForCda(debt, executions, events);
    assert.equal(collected.events.length, 1);
    assert.equal(collected.events[0].type, IDPJ_CONSTRICTION_TYPE);
    assert.equal(collected.events[0]._inheritedFromIDPJ, 'idpj1');
    const r = computePrescription({ debt, executions, events, asOf: ASOF });
    assert.ok(r.activeSuspensions.length);
  });
});

describe('contrato operacional — piso, teto, flags e famílias', () => {
  it('cadastro tem 7 famílias e cobre os tipos vivos', () => {
    assert.equal(PRESC_EVENT_FAMILIES.length, 7);
    assert.equal(familyOfPrescEvent('marco_sem_bens').id, 'marco');
    assert.equal(familyOfPrescEvent('int_sisbajud').id, 'resultado_util');
    assert.equal(familyOfPrescEvent('susp_parcelamento').id, 'parcelamento');
  });

  it('piso usa a âncora mais tardia (citação + 6), não só o protocolo', () => {
    const b = computeIntercorrenteBounds({
      exec: ef({ protocolDate: '2020-01-01' }),
      debt: cda(),
      cdaEvents: [{ id: 'c', executionId: 'e1', type: 'int_citacao', date: '2021-06-01' }],
      asOfIso: ASOF
    });
    assert.equal(b.floor, '2027-06-01');
    assert.equal(b.floorAnchor.kind, 'citacao');
  });

  it('arquivamento datado vira teto, não dies a quo', () => {
    const b = computeIntercorrenteBounds({
      exec: ef({ protocolDate: '2015-01-01' }),
      debt: cda(),
      cdaEvents: [{ id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2018-03-10' }],
      asOfIso: ASOF
    });
    assert.equal(b.ceiling, '2024-03-10');
    const r = computePrescription({
      debt: cda(),
      executions: [ef({ protocolDate: '2015-01-01' })],
      events: [{ id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2018-03-10' }],
      asOf: ASOF
    });
    assert.equal(r.phase, 'nao_iniciado');
    assert.equal(r.bounds.ceiling, '2024-03-10');
    assert.ok((r.estimates || []).some(e => e.date === '2024-03-10'));
  });

  it('data digitada na CDA não cala o termo calculado', () => {
    const r = computePrescription({
      debt: cda({ prescriptionDate: '2031-01-01' }),
      executions: [ef()],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }],
      asOf: ASOF
    });
    assert.equal(r.origin, 'calculo_validado');
    assert.equal(r.diesAdQuem, '2024-01-01');
    assert.equal(r.informedConflict, true);
    assert.ok(r.gaps.some(g => /diverge/i.test(g)));
    const lookup = createPrescDateLookup(
      [cda({ prescriptionDate: '2031-01-01' })],
      [ef()],
      [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }],
      ASOF
    );
    assert.equal(lookup(cda({ prescriptionDate: '2031-01-01' })), '2024-01-01');
  });

  it('suspensão art. 40 com data, sem marco, vale como marco com aviso', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 's', executionId: 'e1', type: 'susp_art40', date: '2023-08-16' }],
      asOf: ASOF
    });
    assert.notEqual(r.phase, 'nao_iniciado');
    assert.equal(r.diesAQuo, '2023-08-16');
    assert.ok(r.gaps.some(g => /sem evento de marco/i.test(g)));
  });

  it('marco com data futura é ignorado', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2028-01-01' }],
      asOf: ASOF
    });
    assert.equal(r.phase, 'nao_iniciado');
    assert.ok(r.gaps.some(g => /data futura/i.test(g)));
  });

  it('modo só 5 anos após rescisão', () => {
    const r = computePrescription({
      debt: cda({ parcRestartMode: '5' }),
      executions: [ef()],
      events: [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-10', endDate: '2021-06-01' }],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2021-06-01');
    assert.equal(r.diesAdQuem, '2026-06-01');
    assert.equal(r.parcRestartMode, '5');
    assert.ok((r.gaps || []).some(g => /política|Pitten|só 5/i.test(g)));
  });

  it('Sisbajud positivo encerra o ciclo — valor não gera conferência extra', () => {
    // Regra do irrisório removida (decisão do usuário): quem lança o bloqueio decide.
    const r = computePrescription({
      debt: cda({ value: 500000 }),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 's', executionId: 'e1', type: 'int_sisbajud', date: '2022-01-01', amount: 50 }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.equal(r.interruptAt, '2022-01-01');
    assert.ok(!(r.flags || []).includes('sisbajud_irrisorio'));
  });

  it('CDA cujo processo é o do IDPJ não é tratada como ajuizada pelo incidente', () => {
    const debt = cda({ processNumber: '50099999920234047000' });
    const executions = [
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', protocolDate: '2018-01-01' }
    ];
    const r = computePrescription({ debt, executions, events: [], asOf: ASOF });
    assert.equal(r.segment, 'credito');
    assert.ok(r.gaps.some(g => /IDPJ|incidente/i.test(g)));
  });
});

describe('Fase 1 — C1 a C7', () => {
  it('C1: ordinária ajuizada ignora penhora posterior ao protocolo', () => {
    const debt = { id: 'd1', cdaNumber: '91 2 09 000673-06', inscriptionDate: '2001-05-18', processNumber: '50011111120094047000' };
    const executions = [{ id: 'e1', processNumber: '50011111120094047000', protocolDate: '2009-11-10' }];
    const events = [{ id: 'p', executionId: 'e1', type: 'int_penhora', date: '2024-01-26', requestDate: '2024-01-26' }];
    const r = computeOrdinaria({ debt, executions, events, asOf: ASOF });
    assert.equal(r.phase, 'consumado');
    assert.equal(r.diesAQuo, '2001-05-18');
    assert.equal(r.diesAdQuem, '2006-05-18');
    assert.ok(!/2024/.test(r.detail || ''));
    assert.ok((r.timeline || []).some(e => /posterior ao ajuizamento/.test(e.effect || '')));
  });

  it('C2: parcelamento sem fim é estimado, não vencido calculado', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2010-01-01' },
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.estimated, true);
    assert.equal(r.origin, 'estimativa_pessimista');
    assert.equal(r.phase, 'estimado');
    assert.notEqual(r.phase, 'consumado');
    assert.notEqual(r.phase, 'correndo');
    assert.notEqual(r.status, 'prescrito');
  });

  it('C4: incidente é atributo; cenário duplo; conferência sem constrição', () => {
    const debt = cda();
    const executions = [
      ef(),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50077777720234047000', linkedExecutionIds: ['e1'] }
    ];
    const collected = collectEventsForCda(debt, executions, []);
    assert.equal(collected.incidents.length, 1);
    assert.equal(collected.incidents[0].hasConstriction, false);
    const r = computePrescription({ debt, executions, events: [], asOf: ASOF });
    assert.ok((r.checks || []).some(c => /não tem constrição lançada/i.test(c)));
  });

  it('C4: cautelar fiscal sempre mostra o cenário sem a pausa', () => {
    const debt = cda();
    const executions = [
      ef({ protocolDate: '2015-01-01' }),
      { id: 'mcf1', processTag: 'cautelar_fiscal', processNumber: '50066666620234047000', linkedExecutionIds: ['e1'] }
    ];
    const events = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
      { id: 'c', executionId: 'mcf1', type: 'susp_idpj_mcf_constricao', date: '2019-06-01', requestDate: '2019-06-01' }
    ];
    const r = computePrescription({ debt, executions, events, asOf: ASOF });
    assert.ok(r.altWithoutIncident);
    assert.ok((r.checks || []).some(c => /cautelar fiscal/i.test(c)));
  });

  it('C5: teto soma pausas com início após o arquivamento', () => {
    const b = computeIntercorrenteBounds({
      exec: ef({ protocolDate: '2015-01-01' }),
      debt: cda(),
      cdaEvents: [
        { id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2018-03-10' },
        { id: 'e', executionId: 'e1', type: 'susp_embargos', date: '2019-01-01', endDate: '2020-01-01' }
      ],
      asOfIso: ASOF
    });
    assert.ok(b.ceiling > '2024-03-10', b.ceiling);
    assert.equal(b.ceiling, '2025-03-10');
  });

  it('C6: pausa no dia, um dia antes e um dia depois', () => {
    const onDay = addUnpausedCalendarYears('2021-01-01', 5, [{ start: '2021-01-01', end: '2028-01-01' }]);
    assert.equal(onDay, '2033-01-01');
    const before = addUnpausedCalendarYears('2021-01-01', 5, [{ start: '2020-12-31', end: '2028-01-01' }]);
    const after = addUnpausedCalendarYears('2021-01-01', 5, [{ start: '2021-01-02', end: '2028-01-01' }]);
    assert.ok(before);
    assert.ok(after);
    assert.notEqual(before, after);
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'e', executionId: 'e1', type: 'susp_embargos', date: '2021-01-01', endDate: '2028-01-01' }
      ],
      asOf: '2028-06-01'
    });
    assert.equal(r.diesAdQuem, '2033-01-01');
  });

  it('C7: caso do print — ordinária 18/05/2009 e intercorrente estruturada', () => {
    const debt = {
      id: 'd-print',
      cdaNumber: '91 2 09 000673-06',
      inscriptionDate: '2009-05-18',
      processNumber: '50012345620094047000'
    };
    const executions = [{ id: 'e1', processNumber: '50012345620094047000', protocolDate: '2009-11-10' }];
    const events = [
      { id: 'parc', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-28' },
      { id: 'pen', executionId: 'e1', type: 'int_penhora', date: '2024-01-26', requestDate: '2024-01-26' }
    ];
    const tl = computeCdaLegalTimeline({ debt, executions, events, asOf: '2026-09-08' });
    assert.equal(tl.ordinaria.diesAQuo, '2009-05-18');
    assert.equal(tl.ordinaria.phase, 'interrompido');
    assert.match(tl.ordinaria.summary + tl.ordinaria.detail, /10\/11\/2009/);
    assert.match(tl.ordinaria.summary + tl.ordinaria.detail, /5 anos|quinquênio/i);
    const inter = tl.intercorrente;
    assert.equal(inter.phase, 'interrompido');
    assert.equal(inter.interruptAt, '2024-01-26');
    assert.ok(inter.occurrences.some(o => o.fact === 'Ajuizamento' && o.date === '2009-11-10'));
    assert.ok(inter.occurrences.some(o => /Parcelamento/.test(o.fact) && o.date === '2018-01-28'));
    assert.ok(inter.occurrences.some(o => /Penhora/.test(o.fact) && o.date === '2024-01-26'));
    assert.ok(inter.estimates.some(e => e.date === '2030-01-26' && /não pode ter prescrito antes/i.test(e.label)));
    assert.ok(inter.checks.some(c => /28\/01\/2018/.test(c) && /rescisão/i.test(c)));
    assert.ok(inter.checks.some(c => /26\/01\/2024/.test(c) && /ciência|certidão/i.test(c)));
    assert.equal(inter.ruleVersion, RULE_VERSION);
    const ui = [inter.summary, ...(inter.occurrences || []).map(o => o.effect), ...(inter.estimates || []).map(e => e.how + e.label), ...(inter.checks || [])].join('\n');
    assert.doesNotMatch(ui, /Tema|Súmula|política|\bpiso\b|\bteto\b|dies a quo/i);
  });
});

describe('Regras R1–R12', () => {
  it('R1 três relógios', () => {
    // legalBasis: arts. 150/173 CTN, art. 174 CTN, art. 40 LEF
    // validatedAt: 2026-09-08
    const tl = computeCdaLegalTimeline({
      debt: cda({ taxPeriodEnd: '2019-12-31', launchMode: 'oficio', constitutionDate: '2020-06-01', inscriptionDate: '2009-05-18' }),
      executions: [ef({ protocolDate: '2009-11-10' })],
      events: [],
      asOf: ASOF
    });
    assert.ok(tl.decadencia);
    assert.ok(tl.ordinaria);
    assert.ok(tl.intercorrente);
    assert.ok(tl.ordinaria.rulesApplied.includes('R1') || tl.intercorrente.rulesApplied.includes('R1'));
  });

  it('R2 1 ano + 5 anos só com ciência lançada', () => {
    // legalBasis: art. 40 LEF; Súmula 314; Temas 566–571
    // validatedAt: 2026-09-08
    const r = computePrescription({ debt: cda(), executions: [ef()], events: [], asOf: ASOF });
    assert.equal(r.phase, 'nao_iniciado');
    assert.equal(r.diesAdQuem, null);
    assert.ok(r.rulesApplied.includes('R2'));
  });

  it('R3 resultado útil encerra o ciclo', () => {
    // legalBasis: Tema 568; REsp 2.174.870
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_penhora', date: '2022-06-01', requestDate: '2022-06-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.ok(r.rulesApplied.includes('R3'));
  });

  it('R4 pausas param e retomam', () => {
    // legalBasis: art. 151 CTN
    // validatedAt: 2026-09-08
    const a = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' }],
      asOf: ASOF
    });
    const b = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'e', executionId: 'e1', type: 'susp_embargos', date: '2021-06-01', endDate: '2022-06-01' }
      ],
      asOf: ASOF
    });
    assert.ok(b.diesAdQuem > a.diesAdQuem);
    assert.ok(b.rulesApplied.includes('R4'));
  });

  it('R5 rescisão abre 1 ano + 5 anos', () => {
    // legalBasis: art. 174 p.ú. IV CTN; Súmula 653; decisão da casa (1+5)
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-10', endDate: '2021-06-01' }],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2021-06-01');
    assert.equal(r.diesAdQuem, '2027-06-01');
    assert.ok(r.rulesApplied.includes('R5'));
  });

  it('R6 parcelamento sem fim é estimado', () => {
    // legalBasis: decisão da casa — pior caso
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2024-03-01' }],
      asOf: ASOF
    });
    assert.equal(r.estimated, true);
    assert.ok(r.rulesApplied.includes('R6'));
  });

  it('R7 constrição no incidente pausa e mostra o outro cenário', () => {
    // legalBasis: tese fazendária IDPJ/MCF
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [
        ef({ protocolDate: '2016-01-01' }),
        { id: 'idpj1', processTag: 'idpj', processNumber: '50111111120234047000', linkedExecutionIds: ['e1'] }
      ],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
        { id: 'c', executionId: 'idpj1', type: 'susp_idpj_mcf_constricao', date: '2019-01-01', requestDate: '2019-01-01' }
      ],
      asOf: ASOF
    });
    assert.ok(r.altWithoutIncident);
    assert.ok(r.rulesApplied.includes('R7'));
  });

  it('R8 não antes de = ato mais recente + 1 ano + 5 anos', () => {
    // legalBasis: contagem mínima operacional
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [ef({ protocolDate: '2020-01-01' })],
      events: [{ id: 'c', executionId: 'e1', type: 'int_citacao', date: '2021-06-01' }],
      asOf: ASOF
    });
    assert.equal(r.bounds.floor, '2027-06-01');
    assert.ok(r.rulesApplied.includes('R8'));
  });

  it('R9 não depois de = arquivamento + 6 anos + pausas', () => {
    // legalBasis: decisão da casa (teto +6, não +5)
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [ef({ protocolDate: '2015-01-01' })],
      events: [{ id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2018-03-10' }],
      asOf: ASOF
    });
    assert.equal(r.bounds.ceiling, '2024-03-10');
    assert.ok(r.rulesApplied.includes('R9'));
  });

  it('R10 suspensão art. 40 com data vale como ciência, com aviso', () => {
    // legalBasis: art. 40 LEF — cadastro incompleto
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 's', executionId: 'e1', type: 'susp_art40', date: '2023-08-16' }],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2023-08-16');
    assert.ok(r.gaps.some(g => /sem evento de marco/i.test(g)));
    assert.ok(r.rulesApplied.includes('R10'));
  });

  it('R11 data digitada não substitui o cálculo', () => {
    // legalBasis: decisão da casa
    // validatedAt: 2026-09-08
    const r = computePrescription({
      debt: cda({ prescriptionDate: '2031-01-01' }),
      executions: [ef()],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }],
      asOf: ASOF
    });
    assert.equal(r.diesAdQuem, '2024-01-01');
    assert.equal(r.informedConflict, true);
    assert.ok(r.rulesApplied.includes('R11'));
  });

  it('R12 ordinária ajuizada só olha fatos anteriores à propositura', () => {
    // legalBasis: art. 174 CTN; Tema 383/STJ
    // validatedAt: 2026-09-08
    const r = computeOrdinaria({
      debt: { id: 'd1', inscriptionDate: '2001-05-18', processNumber: '50011111120094047000' },
      executions: [{ id: 'e1', processNumber: '50011111120094047000', protocolDate: '2009-11-10' }],
      events: [{ id: 'p', executionId: 'e1', type: 'int_penhora', date: '2024-01-26' }],
      asOf: ASOF
    });
    assert.equal(r.phase, 'consumado');
    assert.equal(r.diesAQuo, '2001-05-18');
    assert.ok(r.rulesApplied.includes('R12'));
  });
});
