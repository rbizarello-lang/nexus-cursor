import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addCalendarYears } from '../src/lib/dates.js';
import {
  addUnpausedCalendarYears,
  buildCdaColumnView,
  buildPainelPrescAlerts,
  buildPrazosRadar,
  classifyPainelPrescAlert,
  computeCdaLegalTimeline,
  computeOrdinaria,
  computePrescription,
  groupOfKind,
  isCdaParcelada,
  isPainelPrescCandidate,
  PRESC_SNOOZE_REASONS,
  snoozeLimitDays,
  UI_FORBIDDEN,
} from '../src/lib/prescription.js';

const ASOF = '2026-09-17';
const op = { id: 'op1', name: 'Op Teste', status: 'ativa' };
const cda = (over = {}) => ({
  id: 'd1',
  operationId: 'op1',
  status: 'ativa',
  inscriptionDate: '2015-01-01',
  processNumber: '50011111120154047000',
  ...over
});
const ef = (over = {}) => ({
  id: 'e1',
  processNumber: '50011111120154047000',
  protocolDate: '2016-01-01',
  operationId: 'op1',
  ...over
});

describe('2.A — LEAP-29FEV / addCalendarYears', () => {
  it('29/02 + anos cai no último dia de fevereiro', () => {
    assert.equal(addCalendarYears('2024-02-29', 1), '2025-02-28');
    assert.equal(addCalendarYears('2024-02-29', 6), '2030-02-28');
    assert.equal(addCalendarYears('2024-01-31', 1), '2025-01-31');
  });

  it('marco em 29/02: termo em 28/02/2030', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef({ protocolDate: '2020-01-01' })],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2024-02-29' }],
      asOf: ASOF
    });
    assert.equal(r.diesAdQuem, '2030-02-28');
  });
});

describe('2.A — ARITH-PAUSE-OVERLAP', () => {
  it('pausas sobrepostas são fundidas antes de descontar', () => {
    const pauses = [
      { start: '2018-01-01', end: '2020-01-01' },
      { start: '2019-01-01', end: '2021-01-01' }
    ];
    const merged = addUnpausedCalendarYears(addUnpausedCalendarYears('2016-01-01', 1, pauses), 5, pauses);
    assert.equal(merged, '2025-01-01');
    const r = computePrescription({
      debt: cda({ inscriptionDate: '2014-01-01' }),
      executions: [ef({ protocolDate: '2014-01-01' })],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2016-01-01' },
        { id: 'a', executionId: 'e1', type: 'susp_embargos', date: '2018-01-01', endDate: '2020-01-01' },
        { id: 'b', executionId: 'e1', type: 'susp_deposito', date: '2019-01-01', endDate: '2021-01-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.diesAdQuem, '2025-01-01');
  });
});

describe('2.A — MARCO-SOBRESCREVE-MARCO', () => {
  it('primeira ciência inicia; a posterior não reinicia', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm1', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
        { id: 'm2', executionId: 'e1', type: 'marco_nao_localizacao', date: '2019-06-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2018-01-01');
    assert.equal(r.diesAdQuem, '2024-01-01');
    assert.ok((r.occurrences || []).some(o => /não reinicia/i.test(o.effect || '')));
  });
});

describe('2.A — H-FUTURE', () => {
  it('adesão futura não pausa o ciclo', () => {
    const base = computePrescription({
      debt: cda({ inscriptionDate: '2020-01-01' }),
      executions: [ef({ protocolDate: '2021-01-01' })],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2022-01-01' }],
      asOf: ASOF
    });
    const r = computePrescription({
      debt: cda({ inscriptionDate: '2020-01-01' }),
      executions: [ef({ protocolDate: '2021-01-01' })],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2022-01-01' },
        { id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2027-06-01' }
      ],
      asOf: ASOF
    });
    assert.equal(r.phase, base.phase);
    assert.equal(r.diesAdQuem, base.diesAdQuem);
    assert.ok((r.gaps || []).some(g => /data futura/i.test(g)));
    assert.ok((r.checks || []).some(c => /data futura/i.test(c)));
  });

  it('rescisão futura não reinicia o ciclo', () => {
    const r = computePrescription({
      debt: cda({ inscriptionDate: '2020-01-01' }),
      executions: [ef({ protocolDate: '2021-01-01' })],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2022-01-01' },
        { id: 'x', executionId: 'e1', type: 'int_rescisao_parcelamento', date: '2027-06-01' }
      ],
      asOf: ASOF
    });
    assert.notEqual(r.diesAQuo, '2027-06-01');
    assert.equal(r.diesAdQuem, '2028-01-01');
  });
});

describe('2.A — TEXT-PETICAO-EM-CURSO-VENCIDO', () => {
  it('termo passado com pedido pendente não diz prazo em curso', () => {
    const d = cda({ inscriptionDate: '2014-01-01' });
    const e = [ef({ protocolDate: '2015-01-01' })];
    const ev = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
      { id: 'i', executionId: 'e1', type: 'info_peticao_sem_resultado', date: '2022-01-01' }
    ];
    const r = computePrescription({ debt: d, executions: e, events: ev, asOf: ASOF });
    assert.ok(r.daysLeft < 0);
    assert.doesNotMatch(r.summary, /Prazo em curso/i);
    assert.match(r.summary, /já passou/);
    assert.match(r.summary, /pedido/);
    const a = classifyPainelPrescAlert(d, e, ev, ASOF, r);
    assert.equal(a.kind, 'vencido');
    assert.match(a.label, /pedido pendente/i);
  });
});

describe('2.A — MARCO-ANTES-PROTOCOLO', () => {
  it('ciência anterior ao ajuizamento gera conferência e mantém o cálculo', () => {
    const r = computePrescription({
      debt: cda(),
      executions: [ef({ protocolDate: '2020-06-01' })],
      events: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }],
      asOf: ASOF
    });
    assert.equal(r.diesAQuo, '2018-01-01');
    assert.ok((r.gaps || []).some(g => /ciência anterior ao ajuizamento/i.test(g)));
    assert.ok((r.checks || []).some(c => /ciência anterior ao ajuizamento/i.test(c)));
  });
});

describe('2.A — GRAMMAR-PELA', () => {
  it('arresto e Sisbajud usam pelo', () => {
    const arresto = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2023-01-01' },
        { id: 'a', executionId: 'e1', type: 'int_arresto', date: '2023-06-01' }
      ],
      asOf: ASOF
    });
    assert.match(arresto.summary, /pelo arresto/);
    const sis = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2023-01-01' },
        { id: 'a', executionId: 'e1', type: 'int_sisbajud', date: '2023-06-01' }
      ],
      asOf: ASOF
    });
    assert.match(sis.summary, /pelo bloqueio Sisbajud/);
    const pen = computePrescription({
      debt: cda(),
      executions: [ef()],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2023-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_penhora', date: '2023-06-01' }
      ],
      asOf: ASOF
    });
    assert.match(pen.summary, /pela penhora/);
  });
});

describe('2.A — STATUS-SEGURO-ORDINARIA', () => {
  it('ordinária ajuizada devolve interrompido, não seguro', () => {
    const r = computeOrdinaria({
      debt: cda({ constitutionDate: '2014-01-01' }),
      executions: [ef({ protocolDate: '2016-01-01' })],
      events: [],
      asOf: ASOF
    });
    assert.equal(r.phase, 'interrompido');
    assert.equal(r.status, 'interrompido');
    assert.notEqual(r.status, 'seguro');
  });
});

describe('2.A — COL-ART40-SEM-CIENCIA', () => {
  it('R10: coluna mostra início, ocorrência e Conferir', () => {
    const d = cda({ inscriptionDate: '2010-01-01' });
    const e = [ef({ protocolDate: '2012-01-01' })];
    const ev = [{ id: 's', executionId: 'e1', type: 'susp_art40', date: '2015-06-01' }];
    const tl = computeCdaLegalTimeline({ debt: d, executions: e, events: ev, asOf: ASOF });
    const col = buildCdaColumnView(tl.intercorrente, { key: 'intercorrente' });
    assert.match(col.datesLine, /01\/06\/2015/);
    assert.doesNotMatch(col.datesLine, /sem ciência lançada/);
    assert.ok(col.occurrences.some(o => /Suspensão do art\. 40/i.test(o.fact) && /vale como ciência/i.test(o.effect)));
    assert.ok(col.checks.some(c => /certidão de não localização/i.test(c.text)));
  });
});

describe('2.A — Conferir duplicado', () => {
  it('aviso de incidente só na coluna intercorrente', () => {
    const debt = cda();
    const executions = [
      ef({ protocolDate: '2018-01-01' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const tl = computeCdaLegalTimeline({ debt, executions, events: [], asOf: ASOF });
    assert.ok(!(tl.ordinaria.checks || []).some(c => /não tem constrição lançada/i.test(c)));
    assert.ok((tl.intercorrente.checks || []).some(c => /não tem constrição lançada/i.test(c)));
  });
});

describe('2.B — v1 permanece o comportamento clássico', () => {
  it('status parcelada sem evento sai da fila em v1', () => {
    const d = cda({ status: 'parcelada', inscriptionDate: '2010-01-01' });
    assert.equal(classifyPainelPrescAlert(d, [ef({ protocolDate: '2018-01-01' })], [], ASOF), null);
  });

  it('handled esconde em v1, inclusive aguardando', () => {
    const d = cda({
      prescriptionHandled: true,
      prescriptionHandledType: 'aguardando_reconhecimento',
      inscriptionDate: '2010-01-01'
    });
    assert.equal(isPainelPrescCandidate(d, [ef()]), false);
    assert.equal(classifyPainelPrescAlert(d, [ef()], [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2016-01-01' }], ASOF), null);
  });

  it('acompanhar_piso + incidente sem constrição continua grupo 3 em v1', () => {
    assert.equal(groupOfKind('acompanhar_piso', { incident: { hasConstriction: false } }), 3);
  });
});

describe('2.B — FN-PARCELADA-STATUS-SEM-EVENTO', () => {
  it('v2: status parcelada sem adesão é tratada como parcelada e sai do alarme', () => {
    const d = cda({ status: 'parcelada', inscriptionDate: '2014-01-01' });
    const e = [ef({ protocolDate: '2015-01-01' })];
    const ev = [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2016-01-01' }];
    const r = computePrescription({ debt: d, executions: e, events: ev, asOf: ASOF });
    assert.equal(r.phase, 'consumado');
    assert.equal(isCdaParcelada(d, e, ev, ASOF), true);
    const a = classifyPainelPrescAlert(d, e, ev, ASOF, r, { policy: 'v2' });
    assert.equal(a, null);
    const radar = buildPrazosRadar({
      operations: [op], executions: e, prescriptionEvents: ev, debts: [d], people: []
    }, ASOF, { policy: 'v2' });
    assert.ok(!radar.rows.some(row => row.id === d.id));
    assert.ok(radar.silenced.some(x => x.debtId === d.id && x.reason === 'parcelada_ficha'));
  });
});

describe('2.B — FN-HANDLED-AGUARDANDO', () => {
  it('v2: aguardando reconhecimento permanece no radar no grupo 4', () => {
    const d = cda({
      inscriptionDate: '2014-01-01',
      prescriptionHandled: true,
      prescriptionHandledType: 'aguardando_reconhecimento'
    });
    const e = [ef({ protocolDate: '2015-01-01', operationId: 'op1' })];
    const ev = [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2016-01-01' }];
    assert.equal(isPainelPrescCandidate(d, e, { policy: 'v2' }), true);
    const a = classifyPainelPrescAlert(d, e, ev, ASOF, undefined, { policy: 'v2' });
    assert.equal(a.kind, 'aguardando_reconhecimento');
    assert.equal(a.silenceReason, 'aguardando_reconhecimento');
    assert.equal(groupOfKind(a.kind, a, { policy: 'v2' }), 4);
    const radar = buildPrazosRadar({
      operations: [op],
      executions: e,
      prescriptionEvents: ev,
      debts: [d],
      people: []
    }, ASOF, { policy: 'v2' });
    assert.ok(radar.rows.some(row => row.id === d.id && row.prescKind === 'aguardando_reconhecimento'));
  });

  it('v2: declarada continua fora', () => {
    const d = cda({ prescriptionHandled: true, prescriptionHandledType: 'declarada', inscriptionDate: '2010-01-01' });
    assert.equal(isPainelPrescCandidate(d, [ef()], { policy: 'v2' }), false);
  });
});

describe('2.B — ORD-CONSUMADA-AJUIZADA', () => {
  it('v2: ordinária consumada em CDA ajuizada fica só na coluna, sem alarme', () => {
    const d = cda({ inscriptionDate: '2010-01-01' });
    const e = [ef({ protocolDate: '2016-06-01' })];
    const a = classifyPainelPrescAlert(d, e, [], ASOF, undefined, { policy: 'v2' });
    assert.notEqual(a && a.clock, 'ordinaria');
    assert.notEqual(a && a.kind, 'vencido');
    const ord = computeOrdinaria({ debt: d, executions: e, asOf: ASOF });
    assert.equal(ord.phase, 'consumado');
    assert.match(ord.summary, /Consumada antes do ajuizamento/);
  });
});

describe('2.B — I-ORD-ALERT / incidentOnly', () => {
  it('v2: CDA só no IDPJ pede vínculo à execução fiscal', () => {
    const d = cda({ inscriptionDate: '2010-01-01', processNumber: '50099999920194047000' });
    const e = [{ id: 'idpj1', processNumber: '50099999920194047000', processTag: 'idpj', protocolDate: '2019-05-01' }];
    const r = computePrescription({ debt: d, executions: e, events: [], asOf: ASOF });
    assert.equal(r.segment, 'credito');
    const a = classifyPainelPrescAlert(d, e, [], ASOF, r, { policy: 'v2' });
    assert.equal(a.kind, 'inconsistencia');
    assert.equal(a.action.type, 'vincular_ef');
    assert.match(a.label, /vincule à execução fiscal/i);
  });
});

describe('2.B — GROUP5-ROUBADO-POR-CADASTRO e dedupe', () => {
  it('v2: piso futuro permanece grupo 5; aviso vai a processNotes', () => {
    const d1 = cda({ id: 'd-piso-1', inscriptionDate: '2024-01-01', processNumber: '50044444420244047001' });
    const d2 = cda({ id: 'd-piso-2', inscriptionDate: '2024-01-01', processNumber: '50044444420244047001' });
    const executions = [
      ef({ id: 'e-piso', processNumber: '50044444420244047001', protocolDate: '2024-06-01', operationId: 'op1' }),
      { id: 'idpj-piso', processTag: 'idpj', processNumber: '50000000320244047000', linkedExecutionIds: ['e-piso'], operationId: 'op1' }
    ];
    const v1 = classifyPainelPrescAlert(d1, executions, [], ASOF);
    assert.equal(v1.kind, 'acompanhar_piso');
    assert.equal(groupOfKind(v1.kind, { ...v1, incident: { hasConstriction: false, hasStay: false } }), 3);
    const radar = buildPrazosRadar({
      operations: [op],
      executions,
      prescriptionEvents: [],
      debts: [d1, d2],
      people: []
    }, ASOF, { policy: 'v2' });
    const rows = radar.rows.filter(r => r.id === 'd-piso-1' || r.id === 'd-piso-2');
    assert.ok(rows.length >= 1);
    rows.forEach(r => assert.equal(r.group, 5));
    const notes = (radar.processNotes || []).filter(n => /sem constrição lançada/i.test(n.text));
    assert.equal(notes.length, 1);
  });
});

describe('2.B — decisão importada não rebaixa G1', () => {
  it('CICLO-ENCERRADO não tira vencido do grupo 1', () => {
    assert.equal(groupOfKind('vencido', { prescDecision: { situation: 'CICLO-ENCERRADO' } }), 1);
    assert.equal(groupOfKind('vencido', { prescDecision: { situation: 'CICLO-ENCERRADO' } }, { policy: 'v2' }), 1);
  });
});

describe('2.B — reviewAt, why, action, silenced, snooze', () => {
  it('exporta razões e limites de adiar', () => {
    assert.equal(PRESC_SNOOZE_REASONS.aguardando_certidao, 'Aguardando certidão');
    assert.equal(snoozeLimitDays(1), 14);
    assert.equal(snoozeLimitDays(2), 30);
    assert.equal(snoozeLimitDays(3), 7);
  });

  it('radar v2 preenche why, action e reviewAt fora de G1/G2', () => {
    const d = cda({ id: 'd-piso', inscriptionDate: '2024-01-01', processNumber: '50055555520244047001' });
    const e = [ef({ id: 'e-piso', processNumber: '50055555520244047001', protocolDate: '2024-06-01', operationId: 'op1' })];
    const radar = buildPrazosRadar({
      operations: [op], executions: e, prescriptionEvents: [], debts: [d], people: []
    }, ASOF, { policy: 'v2' });
    const row = radar.rows.find(r => r.id === 'd-piso');
    assert.ok(row);
    assert.ok(row.why);
    assert.doesNotMatch(row.why, UI_FORBIDDEN);
    assert.ok(row.action && row.action.type);
    if (row.group > 2) assert.ok(row.reviewAt);
  });

  it('parcelamento vigente por evento fica em silenced até 90 dias antes da data cedo', () => {
    const d = cda({ id: 'd-parc', inscriptionDate: '2014-01-01' });
    const e = [ef({ operationId: 'op1' })];
    const ev = [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-01', verifiedAt: '2026-06-01' }];
    const radar = buildPrazosRadar({
      operations: [op], executions: e, prescriptionEvents: ev, debts: [d], people: []
    }, ASOF, { policy: 'v2' });
    assert.ok(!radar.rows.some(r => r.id === 'd-parc'));
    const s = (radar.silenced || []).find(x => x.debtId === 'd-parc' && x.reason === 'parcelamento_vigente');
    assert.ok(s);
    assert.equal(s.until, '2031-03-03');
  });

  it('parcelamento vigente sem conferência há mais de 5 anos volta à fila', () => {
    const d = cda({ id: 'd-parc', inscriptionDate: '2014-01-01' });
    const e = [ef({ operationId: 'op1' })];
    const near = [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2021-02-01', createdAt: '2021-10-20T10:00:00.000Z' }];
    const r1 = buildPrazosRadar({ operations: [op], executions: e, prescriptionEvents: near, debts: [d], people: [] }, ASOF, { policy: 'v2' });
    const row1 = r1.rows.find(r => r.id === 'd-parc');
    assert.equal(row1.prescKind, 'pedido_dado');
    assert.equal(row1.group, 3);
    assert.equal(row1.action.type, 'confirmar_vigencia');
    assert.deepEqual(row1.action.eventIds, ['p']);
    const old = [{ id: 'p', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-01' }];
    const r2 = buildPrazosRadar({ operations: [op], executions: e, prescriptionEvents: old, debts: [d], people: [] }, ASOF, { policy: 'v2' });
    const row2 = r2.rows.find(r => r.id === 'd-parc');
    assert.equal(row2.group, 2);
  });

  it('snooze rebaixa até until e fura se o grupo piorou ou o prazo passou', () => {
    const d = cda({
      id: 'd-snz',
      inscriptionDate: '2024-01-01',
      processNumber: '50066666620244047001',
      prescSnooze: { until: '2026-12-01', reason: 'nao_priorizar_agora', at: '2026-09-01', group: 5 }
    });
    const e = [ef({ id: 'e-snz', processNumber: '50066666620244047001', protocolDate: '2024-06-01', operationId: 'op1' })];
    const radar = buildPrazosRadar({
      operations: [op], executions: e, prescriptionEvents: [], debts: [d], people: []
    }, ASOF, { policy: 'v2' });
    assert.ok((radar.silenced || []).some(s => s.debtId === 'd-snz'));
    assert.ok(!radar.rows.some(r => r.id === 'd-snz'));

    const expired = {
      ...d,
      id: 'd-exp',
      prescSnooze: { until: '2026-09-01', reason: 'nao_priorizar_agora', at: '2026-08-01', group: 5 }
    };
    const radar2 = buildPrazosRadar({
      operations: [op], executions: e, prescriptionEvents: [], debts: [expired], people: []
    }, ASOF, { policy: 'v2' });
    assert.ok(radar2.rows.some(r => r.id === 'd-exp'));
  });

  it('v1 não devolve silenced nem why', () => {
    const d = cda({ id: 'd-v1', inscriptionDate: '2024-01-01', processNumber: '50077777720244047001' });
    const e = [ef({ id: 'e-v1', processNumber: '50077777720244047001', protocolDate: '2024-06-01', operationId: 'op1' })];
    const radar = buildPrazosRadar({
      operations: [op], executions: e, prescriptionEvents: [], debts: [d], people: []
    }, ASOF);
    assert.equal(radar.silenced, undefined);
    assert.equal(radar.processNotes, undefined);
    const row = radar.rows.find(r => r.id === 'd-v1');
    assert.ok(row);
    assert.equal(row.why, undefined);
  });
});
