import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  commitNexusPrescricao,
  engineMoreGraveThanDecision,
  parseNexusPrescricao,
  planNexusPrescricao
} from '../src/lib/presc-import.js';
import {
  buildPrazosRadar,
  classifyPainelPrescAlert,
  computePrescription,
  groupOfKind
} from '../src/lib/prescription.js';

const EXAMPLE = `[INÍCIO NEXUS]
PRESCRIÇÃO
PROCESSO | 0024201-06.2009.8.24.0064 | EF
FATO | CITACAO | 14/05/2010 | 10/11/2009 |  | (pg. 3, DOC7, Evento 12) | AR positivo
FATO | PARC-ADESAO | 28/01/2018 |  | N/I | (DOC2, Evento 41) | Debcad; fim não consta dos autos
FATO | SIT-PETICAO | 03/03/2021 |  |  | (DOC1, Evento 58) | Sisbajud requerido; resultado não juntado
FATO | PENHORA | 26/01/2024 | 15/12/2023 |  | (pg. 2, DOC4, Evento 77) | imóvel matrícula 12.345
PARECER | CICLO-ENCERRADO |  | 08/09/2026 | (DOC4, Evento 77) | penhora útil após parcelamento sem fim (EXECUÇÃO FISCAL, Parte 6, item 4)
---
PROCESSO | 5012910-42.2026.4.04.7201 | IDPJ
FATO | IDPJ-CONSTRICAO | 20/03/2026 | 05/03/2026 |  | (pg. 6, DOC3, Evento 18) | indisponibilidade CNIB dos sócios
[FIM NEXUS]`;

const ASOF = '2026-09-08';
let seq = 0;
const uid = () => 'u' + (++seq);

function seededData() {
  return {
    operations: [{ id: 'op1', name: 'Op', status: 'ativa' }],
    people: [],
    debts: [{
      id: 'd1', operationId: 'op1', cdaNumber: '91 2 09 000001-00',
      processNumber: '0024201-06.2009.8.24.0064', inscriptionDate: '2009-05-18', value: 1000, status: 'ativa'
    }],
    executions: [
      { id: 'ef1', operationId: 'op1', processNumber: '0024201-06.2009.8.24.0064', protocolDate: '2009-11-10', processTag: 'execucao_fiscal' },
      { id: 'idpj1', operationId: 'op1', processNumber: '5012910-42.2026.4.04.7201', processTag: 'idpj', linkedExecutionIds: ['ef1'] }
    ],
    prescriptionEvents: []
  };
}

describe('parseNexusPrescricao', () => {
  it('exemplo 9.6: quatro fatos na EF e um no IDPJ', () => {
    const r = parseNexusPrescricao(EXAMPLE);
    assert.equal(r.errors.length, 0);
    assert.equal(r.processes.length, 2);
    assert.equal(r.processes[0].facts.length, 4);
    assert.equal(r.processes[0].parecer.situation, 'CICLO-ENCERRADO');
    assert.equal(r.processes[0].facts[1].endDate, '');
    assert.equal(r.processes[0].facts[1].endNI, true);
    assert.equal(r.processes[1].kind, 'idpj');
    assert.equal(r.processes[1].facts[0].type, 'susp_idpj_mcf_constricao');
  });

  it('código inválido descarta a linha e segue', () => {
    const r = parseNexusPrescricao(`[INÍCIO NEXUS]\nPRESCRIÇÃO\nPROCESSO | 0024201-06.2009.8.24.0064 | EF\nFATO | FOO | 01/01/2020 |  |  | (DOC1, Evento 1) | x\nFATO | PENHORA | 26/01/2024 |  |  | (DOC4, Evento 77) | ok\n[FIM NEXUS]`);
    assert.ok(r.errors.some(e => /código inválido/i.test(e.reason)));
    assert.equal(r.processes[0].facts.length, 1);
  });

  it('linha sem Evento é descartada', () => {
    const r = parseNexusPrescricao(`[INÍCIO NEXUS]\nPRESCRIÇÃO\nPROCESSO | 0024201-06.2009.8.24.0064 | EF\nFATO | PENHORA | 26/01/2024 |  |  | (DOC4) | sem evento\n[FIM NEXUS]`);
    assert.ok(r.errors.some(e => /Evento/i.test(e.reason)));
    assert.equal(r.processes[0].facts.length, 0);
  });

  it('PARECER PROVAVEL-CONSUMACAO sem Termo é erro', () => {
    const r = parseNexusPrescricao(`[INÍCIO NEXUS]\nPRESCRIÇÃO\nPROCESSO | 0024201-06.2009.8.24.0064 | EF\nPARECER | PROVAVEL-CONSUMACAO |  | 08/09/2026 | (DOC4, Evento 77) | x\n[FIM NEXUS]`);
    assert.ok(r.errors.some(e => /Termo obrigatório/i.test(e.reason)));
  });

  it('bloco sem [FIM NEXUS] gera erro', () => {
    const r = parseNexusPrescricao(`[INÍCIO NEXUS]\nPRESCRIÇÃO\nPROCESSO | 0024201-06.2009.8.24.0064 | EF\n`);
    assert.ok(r.errors.some(e => /FIM NEXUS/.test(e.reason)));
  });
});

describe('plan e commit', () => {
  it('processo não cadastrado recusa o bloco', () => {
    const parsed = parseNexusPrescricao(EXAMPLE);
    const plan = planNexusPrescricao(parsed, { executions: [], debts: [] });
    assert.ok(plan.processes.every(p => p.refused));
    assert.match(plan.processes[0].refuseReason, /cadastre o processo antes/);
    assert.equal(plan.canCommit, false);
  });

  it('grava quatro fatos na EF e um no IDPJ; a pausa propaga', () => {
    const data = seededData();
    const parsed = parseNexusPrescricao(EXAMPLE);
    const plan = planNexusPrescricao(parsed, data);
    assert.equal(plan.processes[0].newFacts.length, 4);
    assert.equal(plan.processes[1].newFacts.length, 1);
    const { data: next, added } = commitNexusPrescricao(data, plan, { uid, now: '2026-09-08T12:00:00.000Z' });
    assert.equal(added.length, 5);
    const efEv = next.prescriptionEvents.filter(e => e.executionId === 'ef1');
    const idpjEv = next.prescriptionEvents.filter(e => e.executionId === 'idpj1');
    assert.equal(efEv.length, 4);
    assert.equal(idpjEv.length, 1);
    assert.equal(efEv[0].source, 'analise');
    const r = computePrescription({
      debt: next.debts[0],
      executions: next.executions,
      events: next.prescriptionEvents,
      asOf: ASOF
    });
    assert.ok(r.incidents && r.incidents.length);
    assert.equal(next.executions.find(e => e.id === 'ef1').prescDecision.situation, 'CICLO-ENCERRADO');
  });

  it('reimportar o mesmo bloco não cria eventos nem empilha parecer', () => {
    const data = seededData();
    const parsed = parseNexusPrescricao(EXAMPLE);
    const plan1 = planNexusPrescricao(parsed, data);
    const first = commitNexusPrescricao(data, plan1, { uid, now: '2026-09-08T12:00:00.000Z' });
    const plan2 = planNexusPrescricao(parsed, first.data);
    assert.equal(plan2.processes[0].newFacts.length, 0);
    assert.equal(plan2.processes[0].parecerDuplicate, true);
    const second = commitNexusPrescricao(first.data, plan2, { uid, now: '2026-09-08T13:00:00.000Z' });
    assert.equal(second.added.length, 0);
    assert.equal((second.data.executions.find(e => e.id === 'ef1').prescDecisionHistory || []).length, 0);
  });

  it('evento manual com a mesma chave prevalece e só recebe sourceRef', () => {
    const data = seededData();
    data.prescriptionEvents = [{
      id: 'manual', executionId: 'ef1', type: 'int_penhora',
      date: '2024-01-26', requestDate: '2023-12-15', notes: 'lançado à mão'
    }];
    const parsed = parseNexusPrescricao(EXAMPLE);
    const plan = planNexusPrescricao(parsed, data);
    assert.ok(plan.processes[0].existingFacts.some(x => x.event.id === 'manual'));
    assert.ok(!plan.processes[0].newFacts.some(f => f.type === 'int_penhora'));
    const { data: next } = commitNexusPrescricao(data, plan, { uid, now: '2026-09-08T12:00:00.000Z' });
    const man = next.prescriptionEvents.find(e => e.id === 'manual');
    assert.equal(man.notes, 'lançado à mão');
    assert.match(man.sourceRef, /Evento 77/);
    assert.equal(next.prescriptionEvents.filter(e => e.type === 'int_penhora').length, 1);
  });
});

describe('decisão importada governa o grupo', () => {
  it('CICLO-ENCERRADO fica no grupo 4 mesmo com cálculo consumado', () => {
    assert.equal(groupOfKind('vencido', { prescDecision: { situation: 'CICLO-ENCERRADO' } }), 4);
    const note = engineMoreGraveThanDecision(
      { phase: 'consumado', diesAdQuem: '2020-01-01', daysLeft: -100, status: 'prescrito' },
      { situation: 'CICLO-ENCERRADO', analysisDate: '2026-09-08' }
    );
    assert.match(note, /mais grave/);
    assert.match(note, /Decisão mantida/);
  });

  it('DECLARADA sai da fila', () => {
    const alert = classifyPainelPrescAlert(
      { id: 'd1', status: 'ativa', processNumber: '50011111120204047000', inscriptionDate: '2020-01-15' },
      [{ id: 'e1', processNumber: '50011111120204047000', prescDecision: { situation: 'DECLARADA', term: '2026-01-01', analysisDate: '2026-09-08' } }],
      [],
      ASOF
    );
    assert.equal(alert, null);
  });

  it('evento posterior à análise gera conferência de revalidação', () => {
    const r = computePrescription({
      debt: { id: 'd1', inscriptionDate: '2020-01-15', processNumber: '50012345620234047001' },
      executions: [{ id: 'e1', processNumber: '50012345620234047001', protocolDate: '2021-03-01', prescDecision: { situation: 'CICLO-ENCERRADO', analysisDate: '2024-01-01' } }],
      events: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2022-01-01' },
        { id: 'p', executionId: 'e1', type: 'int_penhora', date: '2025-06-01', requestDate: '2025-06-01' }
      ],
      asOf: ASOF
    });
    assert.ok(r.checks.some(c => /revalidar/i.test(c)));
  });

  it('radar conta divergência e não move o grupo da decisão', () => {
    const data = {
      operations: [{ id: 'op1', name: 'Op', status: 'ativa' }],
      people: [],
      debts: [{ id: 'd1', operationId: 'op1', cdaNumber: '1', processNumber: '50012345620204047000', inscriptionDate: '2010-01-01', value: 1, status: 'ativa' }],
      executions: [{
        id: 'e1', operationId: 'op1', processNumber: '50012345620204047000', protocolDate: '2011-01-01',
        prescDecision: { situation: 'CICLO-ENCERRADO', analysisDate: '2026-09-08' }
      }],
      prescriptionEvents: [
        { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2012-01-01' }
      ]
    };
    const radar = buildPrazosRadar(data, ASOF);
    const row = radar.rows.find(x => x.id === 'd1');
    assert.ok(row);
    assert.equal(row.group, 4);
    assert.match(row.decisionNote || '', /mais grave|Decisão mantida/);
    assert.equal(radar.divergencias, 1);
  });
});
