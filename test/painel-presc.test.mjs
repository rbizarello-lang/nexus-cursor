import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPainelPrescAlerts, classifyPainelPrescAlert } from '../src/lib/prescription.js';

const ASOF = '2026-08-16';
const op = { id: 'op1', name: 'Op Teste', status: 'ativa' };
const cda = (over = {}) => ({ id: 'd1', operationId: 'op1', status: 'ativa', ...over });
const ef = (over = {}) => ({ id: 'e1', processNumber: '50012345620234047001', protocolDate: '2021-03-01', ...over });

describe('classifyPainelPrescAlert — avisos do Painel', () => {
  it('ajuizada sem marco: avaliar intercorrente, nunca iminente', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2020-01-15' });
    const a = classifyPainelPrescAlert(debt, [ef()], [], ASOF);
    assert.equal(a.kind, 'avaliar_intercorrente');
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

  it('decadência consumada sozinha não gera card de aviso', () => {
    const debt = cda({
      processNumber: '50012345620234047001',
      inscriptionDate: '2020-01-15',
      launchMode: 'oficio',
      taxPeriodEnd: '2010-01-01'
    });
    const a = classifyPainelPrescAlert(debt, [ef()], [], ASOF);
    assert.equal(a.kind, 'avaliar_intercorrente');
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
    const ids = [...b.iminente, ...b.vencido, ...b.avaliar_174, ...b.avaliar_intercorrente].map(x => x.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(b.iminente.some(x => x.id === 'd-im'));
    assert.ok(b.avaliar_174.some(x => x.id === 'd-174'));
    assert.ok(!ids.includes('d-far'));
  });
});
