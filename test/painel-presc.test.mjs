import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPainelPrescAlerts, classifyPainelPrescAlert, groupOfKind, buildPrazosRadar, attachPrescriptionSnapshots } from '../src/lib/prescription.js';

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

  it('não ajuizada com prazo longo: em acompanhamento (correndo)', () => {
    const debt = cda({ inscriptionDate: '2025-01-01' });
    const a = classifyPainelPrescAlert(debt, [], [], ASOF);
    assert.equal(a.kind, 'correndo');
    assert.equal(groupOfKind(a.kind, a), 4);
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
    assert.ok(b.correndo.some(x => x.id === 'd-far'));
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
    assert.equal(groupOfKind(a.kind, a), 2);
  });
});

describe('groupOfKind — cinco grupos do radar', () => {
  it('mapeia buckets internos sem rebaixar 1 e 2 por cadastro', () => {
    assert.equal(groupOfKind('vencido', { informedConflict: true }), 1);
    assert.equal(groupOfKind('iminente', { incident: { hasConstriction: false } }), 1);
    assert.equal(groupOfKind('vencido_estimado', {}), 2);
    assert.equal(groupOfKind('residual_alta', { incident: { hasConstriction: false } }), 2);
    assert.equal(groupOfKind('inconsistencia', {}), 3);
    assert.equal(groupOfKind('residual_media', { incident: { hasConstriction: false } }), 3);
    assert.equal(groupOfKind('acompanhar_piso', { incident: { hasConstriction: false } }), 3);
    assert.equal(groupOfKind('correndo', {}), 4);
    assert.equal(groupOfKind('vigiar_interrompido', {}), 4);
    assert.equal(groupOfKind('pausa_cadastrada', {}), 4);
    assert.equal(groupOfKind('residual_media', {}), 4);
    assert.equal(groupOfKind('avaliar_174', {}), 4);
    assert.equal(groupOfKind('acompanhar_piso', {}), 5);
  });

  it('arquivada sem data e sob IDPJ fica no grupo 2', () => {
    const debt = cda({ processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' });
    const executions = [
      ef({ id: 'e1', protocolDate: '2018-01-01', status: 'arquivada' }),
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const a = classifyPainelPrescAlert(debt, executions, [], ASOF);
    assert.equal(a.kind, 'residual_alta');
    assert.equal(groupOfKind(a.kind, a), 2);
  });

  it('pausa por IDPJ com cenário sem pausa vencido fica no grupo 2, com check', () => {
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
    assert.equal(groupOfKind(a.kind, a), 2);
    assert.ok((a.checks || []).some(c => /pausa/i.test(c)));
  });
});

describe('buildPrazosRadar — cobertura completa', () => {
  it('30 CDAs ativas caem em exatamente um grupo e a soma bate', () => {
    const executions = [
      ef({ id: 'e-im', processNumber: '50011111120234047001', protocolDate: '2021-03-01', operationId: 'op1' }),
      ef({ id: 'e-venc', processNumber: '50022222220234047001', protocolDate: '2018-01-01', operationId: 'op1' }),
      ef({ id: 'e-vig', processNumber: '50033333320234047001', protocolDate: '2018-01-01', operationId: 'op1' }),
      ef({ id: 'e-piso', processNumber: '50044444420234047001', protocolDate: '2021-03-01', operationId: 'op1' }),
      ef({ id: 'e-alta', processNumber: '50055555520234047001', protocolDate: '2018-01-01', status: 'arquivada', operationId: 'op1' }),
      ef({ id: 'e-media', processNumber: '50066666620234047001', protocolDate: '2019-06-01', operationId: 'op1' }),
      ef({ id: 'e-inc', processNumber: '50077777720234047001', protocolDate: '2018-01-01', operationId: 'op1' }),
      ef({ id: 'e-alt', processNumber: '50088888820234047001', protocolDate: '2015-01-01', operationId: 'op1' }),
      ef({ id: 'e-pausa', processNumber: '50099900020234047001', protocolDate: '2018-01-01', operationId: 'op1' }),
      ef({ id: 'e-parc', processNumber: '50099911120234047001', protocolDate: '2018-01-01', operationId: 'op1' }),
      { id: 'idpj-alta', processTag: 'idpj', processNumber: '50000000120234047000', linkedExecutionIds: ['e-alta'], operationId: 'op1' },
      { id: 'idpj-alt', processTag: 'idpj', processNumber: '50000000220234047000', linkedExecutionIds: ['e-alt'], operationId: 'op1' },
      { id: 'idpj-piso', processTag: 'idpj', processNumber: '50000000320234047000', linkedExecutionIds: ['e-piso'], operationId: 'op1' }
    ];
    const events = [
      { id: 'm-im', executionId: 'e-im', type: 'marco_sem_bens', date: '2020-11-14' },
      { id: 'm-venc', executionId: 'e-venc', type: 'marco_sem_bens', date: '2018-01-01' },
      { id: 'm-vig', executionId: 'e-vig', type: 'marco_sem_bens', date: '2020-01-01' },
      { id: 'p-vig', executionId: 'e-vig', type: 'int_penhora', date: '2022-01-01' },
      { id: 'm-alt', executionId: 'e-alt', type: 'marco_sem_bens', date: '2018-01-01' },
      { id: 'c-alt', executionId: 'idpj-alt', type: 'susp_idpj_mcf_constricao', date: '2020-01-01', requestDate: '2020-01-01' },
      { id: 'm-pausa', executionId: 'e-pausa', type: 'marco_sem_bens', date: '2020-01-01' },
      { id: 's-pausa', executionId: 'e-pausa', type: 'susp_embargos', date: '2021-01-01' },
      { id: 'parc', executionId: 'e-parc', type: 'susp_parcelamento', date: '2019-01-01' }
    ];
    const debts = [
      cda({ id: 'd01', cdaNumber: '01', processNumber: '50011111120234047001', inscriptionDate: '2020-01-15', value: 1 }),
      cda({ id: 'd02', cdaNumber: '02', processNumber: '50011111120234047001', inscriptionDate: '2020-01-15', value: 1 }),
      cda({ id: 'd03', cdaNumber: '03', processNumber: '50022222220234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd04', cdaNumber: '04', processNumber: '50022222220234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd05', cdaNumber: '05', processNumber: '50033333320234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd06', cdaNumber: '06', processNumber: '50033333320234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd07', cdaNumber: '07', processNumber: '50044444420234047001', inscriptionDate: '2020-01-15', value: 1 }),
      cda({ id: 'd08', cdaNumber: '08', processNumber: '50044444420234047001', inscriptionDate: '2020-01-15', value: 1 }),
      cda({ id: 'd09', cdaNumber: '09', processNumber: '50055555520234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd10', cdaNumber: '10', processNumber: '50055555520234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd11', cdaNumber: '11', processNumber: '50066666620234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd12', cdaNumber: '12', processNumber: '50066666620234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd13', cdaNumber: '13', processNumber: '50077777720234047001', status: 'parcelada', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd14', cdaNumber: '14', processNumber: '50088888820234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd15', cdaNumber: '15', processNumber: '50099900020234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd16', cdaNumber: '16', processNumber: '50099911120234047001', inscriptionDate: '2010-01-15', value: 1 }),
      cda({ id: 'd17', cdaNumber: '17', inscriptionDate: '2021-11-14', value: 1 }),
      cda({ id: 'd18', cdaNumber: '18', inscriptionDate: '2021-11-14', value: 1 }),
      cda({ id: 'd19', cdaNumber: '19', inscriptionDate: '2018-01-01', value: 1 }),
      cda({ id: 'd20', cdaNumber: '20', inscriptionDate: '2018-01-01', value: 1 }),
      cda({ id: 'd21', cdaNumber: '21', inscriptionDate: '2025-01-01', value: 1 }),
      cda({ id: 'd22', cdaNumber: '22', inscriptionDate: '2025-01-01', value: 1 }),
      cda({ id: 'd23', cdaNumber: '23', inscriptionDate: '2025-06-01', value: 1 }),
      cda({ id: 'd24', cdaNumber: '24', value: 1 }),
      cda({ id: 'd25', cdaNumber: '25', value: 1 }),
      cda({ id: 'd26', cdaNumber: '26', value: 1 }),
      cda({ id: 'd27', cdaNumber: '27', inscriptionDate: '2024-12-01', value: 1 }),
      cda({ id: 'd28', cdaNumber: '28', inscriptionDate: '2023-01-01', value: 1 }),
      cda({ id: 'd29', cdaNumber: '29', processNumber: '50011111120234047001', inscriptionDate: '2020-01-15', value: 1 }),
      cda({ id: 'd30', cdaNumber: '30', processNumber: '50044444420234047001', inscriptionDate: '2020-01-15', value: 1 })
    ];
    const data = { operations: [op], executions, prescriptionEvents: events, debts, people: [] };
    const radar = buildPrazosRadar(data, ASOF);
    const ids = radar.rows.map(r => r.id);
    assert.equal(ids.length, 30);
    assert.equal(new Set(ids).size, 30);
    const sum = Object.values(radar.totals).reduce((s, t) => s + t.n, 0);
    assert.equal(sum, 30);
    radar.rows.forEach(r => {
      assert.ok(r.group >= 1 && r.group <= 5, r.id + ' sem grupo');
    });
    const d09 = radar.rows.find(r => r.id === 'd09');
    assert.equal(d09.group, 2);
    const d14 = radar.rows.find(r => r.id === 'd14');
    assert.equal(d14.group, 2);
    assert.ok((d14.checks || []).some(c => /pausa/i.test(c)));
    const d07 = radar.rows.find(r => r.id === 'd07');
    assert.equal(d07.group, 3);
    const opTot = radar.byOp.op1;
    assert.equal(opTot.risco, radar.totals[1].n + radar.totals[2].n);
    assert.equal(opTot.completar, radar.totals[3].n);
  });

  it('snapshot grava grupo, data-chave e primeiro check', () => {
    const data = {
      operations: [op],
      executions: [ef({ operationId: 'op1' })],
      prescriptionEvents: [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }],
      debts: [cda({ id: 'd-snap', processNumber: '50012345620234047001', inscriptionDate: '2010-01-15' })]
    };
    attachPrescriptionSnapshots(data, ASOF);
    const snap = data.debts[0].prescriptionSnapshot;
    assert.equal(snap.group, 1);
    assert.ok(snap.summary);
    assert.ok(snap.keyDate);
    assert.equal(typeof snap.firstCheck, 'string');
  });
});

