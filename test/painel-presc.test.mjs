import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPainelPrescAlerts, classifyPainelPrescAlert } from '../src/lib/prescription.js';

const ASOF = '2026-08-16';
const op = { id: 'op1', name: 'Op Teste', status: 'ativa' };
const cda = (over = {}) => ({ id: 'd1', operationId: 'op1', status: 'ativa', ...over });
const ef = (over = {}) => ({ id: 'e1', processNumber: '50012345620234047001', protocolDate: '2021-03-01', ...over });
const allRows = (b) => Object.values(b).flat();

describe('classifyPainelPrescAlert — avisos do Painel', () => {
  it('ajuizada sem marco e protocolo antigo: residual alta (piso vencido > 2 anos), nunca iminente', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2018-01-01' })], [], ASOF);
    assert.equal(a.kind, 'residual_alta');
    assert.equal(a.faixa, 'alta');
  });

  it('ajuizada sem marco e protocolo recente: acompanhar pelo piso (não é marco)', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2020-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2021-03-01' })], [], ASOF);
    assert.equal(a.kind, 'acompanhar_piso');
    assert.equal(a.date, '2027-03-01');
    assert.ok(a.days > 0);
    assert.equal(a.faixa, 'baixa');
  });

  it('ajuizada garantida sem marco: permanece na fila, rebaixada', () => {
    const debt = cda({ processNumber: '50012345620234047001', status: 'garantida', inscriptionDate: '2010-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2018-01-01' })], [], ASOF);
    assert.ok(a);
    assert.notEqual(a.kind, 'iminente');
    assert.ok(a.kind === 'residual_media' || a.kind === 'residual_alta');
  });

  it('ajuizada com garantia na execução: permanece na fila', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2018-01-01', hasGuarantee: true })], [], ASOF);
    assert.ok(a);
  });

  it('ajuizada parcelada sem evento: inconsistência, não some', () => {
    const debt = cda({ processNumber: '50012345620234047001', status: 'parcelada', inscriptionDate: '2010-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2018-01-01' })], [], ASOF);
    assert.equal(a.kind, 'inconsistencia');
  });

  it('suspensão de parcelamento no processo sem evento: inconsistência', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2018-01-01', status: 'suspensa_parcelamento' })], [], ASOF);
    assert.equal(a.kind, 'inconsistencia');
  });

  it('evento de constrição no IDPJ não some da fila e não cai em sob_incidente', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const executions = [
      ef({ id: 'e1', protocolDate: '2018-01-01' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const events = [{
      id: 's',
      executionId: 'idpj1',
      type: 'susp_idpj_mcf_constricao',
      date: '2024-01-15',
      requestDate: '2024-01-15'
    }];
    const a = classifyPainelPrescAlert(debt, executions, events, ASOF);
    assert.ok(a);
    assert.notEqual(a.kind, 'sob_incidente');
    assert.ok(a.incident || (a.kind && a.kind !== 'sob_incidente'));
  });

  it('só o vínculo ao IDPJ, sem constrição, permanece na fila (prioridade normal, não sob_incidente)', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const executions = [
      ef({ id: 'e1', protocolDate: '2018-01-01' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const a = classifyPainelPrescAlert(debt, executions, [], ASOF);
    assert.ok(a);
    assert.notEqual(a.kind, 'sob_incidente');
  });

  it('ajuizada com marco e ~90 dias: iminente grave', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2020-01-15' });
    const events = [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-11-14' }];
    const a = classifyPainelPrescAlert(debt, [ef()], events, ASOF);
    assert.equal(a.kind, 'iminente');
    assert.equal(a.segment, 'intercorrente');
    assert.ok(a.days > 0 && a.days <= 180);
  });

  it('ajuizada com marco já vencido: card vencido, não some', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const events = [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }];
    const a = classifyPainelPrescAlert(debt, [ef()], events, ASOF);
    assert.equal(a.kind, 'vencido');
    assert.ok(a.days == null || a.days <= 0);
  });

  it('penhora que encerra o ciclo: vigiar, não some como seguro', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const events = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
      { id: 'p', executionId: 'e1', type: 'int_penhora', date: '2022-01-01' }
    ];
    const a = classifyPainelPrescAlert(debt, [ef()], events, ASOF);
    assert.equal(a.kind, 'vigiar_interrompido');
  });

  it('não ajuizada com quinquênio em 90 dias: iminente (art. 174)', () => {
    const debt = cda({ inscriptionDate: '2021-11-14' });
    const a = classifyPainelPrescAlert(debt, [], [], ASOF);
    assert.equal(a.kind, 'iminente');
    assert.equal(a.segment, 'ordinaria');
  });

  it('não ajuizada sem datas: avaliar ajuizamento art. 174', () => {
    const debt = cda();
    const a = classifyPainelPrescAlert(debt, [], [], ASOF);
    assert.equal(a.kind, 'avaliar_174');
  });

  it('não ajuizada com prazo longo: não gera aviso', () => {
    const debt = cda({ inscriptionDate: '2025-01-01' });
    const a = classifyPainelPrescAlert(debt, [], [], ASOF);
    assert.equal(a, null);
  });

  it('extinta e tratada não entram', () => {
    assert.equal(classifyPainelPrescAlert(cda({ status: 'extinta', inscriptionDate: '2021-11-14' }), [], [], ASOF), null);
    assert.equal(classifyPainelPrescAlert(cda({ prescriptionHandled: true, inscriptionDate: '2021-11-14' }), [], [], ASOF), null);
  });

  it('decadência consumada sozinha não gera card grave de iminente', () => {
    const debt = cda({
      processNumber: '50012345620234047001',
      inscriptionDate: '2020-01-15',
      launchMode: 'oficio',
      taxPeriodEnd: '2010-01-01'
    });
    const a = classifyPainelPrescAlert(debt, [ef()], [], ASOF);
    assert.equal(a.kind, 'acompanhar_piso');
  });

  it('previsão da planilha no prazo vai ao residual alta, não ao iminente calculado', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef({ protocolDate: '2018-01-01', prescriptionForecast: '2026-09-01' })], [], ASOF);
    assert.notEqual(a.kind, 'iminente');
    assert.ok(a.kind === 'residual_alta' || a.kind === 'vencido_estimado');
    assert.ok(/planilha|não antes/i.test(a.label));
  });
});

describe('buildPainelPrescAlerts', () => {
  it('cada CDA ativa cai em no máximo um card', () => {
    const data = {
      operations: [op],
      executions: [ef()],
      prescriptionEvents: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-11-14' }],
      debts: [
        cda({ id: 'd-im', processNumber: '50012345620234047001', inscriptionDate: '2020-01-15' }),
        cda({ id: 'd-174' }),
        cda({ id: 'd-far', inscriptionDate: '2025-01-01' })
      ]
    };
    const b = buildPainelPrescAlerts(data, ASOF);
    const ids = allRows(b).map(x => x.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(b.iminente.some(x => x.id === 'd-im'));
    assert.ok(b.avaliar_174.some(x => x.id === 'd-174'));
    assert.ok(!ids.includes('d-far'));
  });

  it('marca IDPJ uma vez, sem varrer execuções por linha', () => {
    const data = {
      operations: [op],
      executions: [
        ef({ id: 'e1', operationId: 'op1' }),
        { id: 'idpj1', operationId: 'op1', processTag: 'idpj', linkedExecutionIds: ['e1'], processNumber: '50099999920234047000' }
      ],
      prescriptionEvents: [],
      debts: [cda({ id: 'd-idpj', processNumber: '50012345620234047001' })]
    };
    const b = buildPainelPrescAlerts(data, ASOF);
    const row = allRows(b).find(x => x.id === 'd-idpj');
    assert.ok(row);
    assert.equal(row.hasIDPJ, true);
    assert.notEqual(row.prescKind, 'sob_incidente');
  });

  it('arquivada sem data e sob IDPJ é alta, não média', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const executions = [
      ef({ id: 'e1', protocolDate: '2018-01-01', status: 'arquivada' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const a = classifyPainelPrescAlert(debt, executions, [], ASOF);
    assert.equal(a.kind, 'residual_alta');
    assert.equal(a.faixa, 'alta');
  });

  it('pausa por IDPJ cujo cenário sem pausa está vencido vai a vencido_estimado', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const executions = [
      ef({ id: 'e1', protocolDate: '2015-01-01' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50088888820234047000', linkedExecutionIds: ['e1'] }
    ];
    const events = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' },
      { id: 'c', executionId: 'idpj1', type: 'susp_idpj_mcf_constricao', date: '2020-01-01', requestDate: '2020-01-01' }
    ];
    const a = classifyPainelPrescAlert(debt, executions, events, ASOF);
    assert.equal(a.kind, 'vencido_estimado');
    assert.ok((a.checks || []).some(c => /pausa/i.test(c)));
  });
});

