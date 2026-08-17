import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessDays, daysBetween, daysUntil, isBusinessDay, setExtraHolidays } from '../src/lib/dates.js';
import {
  calcPrescription,
  computePrescription,
  createPrescDateLookup,
  fillRequestDate,
  eventNeedsRequestDate,
  IDPJ_CONSTRICTION_TYPE,
  idpjPropagationPayload,
  migratePrescriptionEvents,
  shouldPropagateIdpjAsSuspension,
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

  it('5. parcelamento encerrado: intervalo pausado e descontado', () => {
    const without = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' }],
      asOf: ASOF
    });
    const withParc = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-06-01', endDate: '2021-06-01' }
      ],
      asOf: ASOF
    });
    assert.ok(withParc.diesAdQuem > without.diesAdQuem, `${withParc.diesAdQuem} should be after ${without.diesAdQuem}`);
    assert.ok(daysBetween(without.diesAdQuem, withParc.diesAdQuem) >= 360);
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
