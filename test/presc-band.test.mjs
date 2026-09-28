import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  alarmPoint,
  buildPrazosRadar,
  computeDecadencia,
  computeOrdinaria,
  computePrescription,
  constituicaoDefinitiva,
  openPauseEvents,
  penhoraAntigaInfo,
  redirecionamentoInfo,
  UI_FORBIDDEN,
} from '../src/lib/prescription.js';

const ASOF = '2026-09-26';
const cda = (over = {}) => ({ id: 'd1', inscriptionDate: '2015-01-15', processNumber: '50012345620154047001', ...over });
const ef = (over = {}) => ({ id: 'e1', processNumber: '50012345620154047001', protocolDate: '2015-03-01', ...over });
const naoAjuizada = (over = {}) => ({ id: 'd1', inscriptionDate: '2022-01-10', ...over });
const inter = (events, debt = cda(), exec = ef()) => computePrescription({ debt, executions: [exec], events, asOf: ASOF });
const marco = { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2016-01-01' };

describe('faixa cedo–tarde: parcelamento (A1, A2, A6)', () => {
  it('A1: rescisão com inadimplemento — cedo inadimplemento + 5; tarde rescisão + 1 + 5', () => {
    const r = inter([
      marco,
      { id: 'a', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-10' },
      { id: 'x', executionId: 'e1', type: 'int_rescisao_parcelamento', date: '2021-06-15', defaultDate: '2021-03-20' }
    ]);
    assert.equal(r.diesAdQuem, '2027-06-15');
    assert.equal(r.band.cedo.diesAdQuem, '2026-03-20');
    assert.equal(r.band.cedo.phase, 'consumado');
    assert.equal(r.band.kind, 'tese');
    assert.deepEqual(r.band.motivos.map(m => m.code), ['A1']);
    assert.equal(alarmPoint(r).diesAdQuem, '2026-03-20');
  });

  it('A1: sem inadimplemento, a rescisão vale nas duas pontas (cedo + 5; tarde + 1 + 5)', () => {
    const r = inter([
      marco,
      { id: 'a', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-10' },
      { id: 'x', executionId: 'e1', type: 'int_rescisao_parcelamento', date: '2021-06-15' }
    ]);
    assert.equal(r.diesAdQuem, '2027-06-15');
    assert.equal(r.band.cedo.diesAdQuem, '2026-06-15');
  });

  it('A1: na ordinária, a rescisão reinicia 5 anos; a cedo conta do inadimplemento', () => {
    const r = computePrescription({
      debt: naoAjuizada({ constitutionDate: '2017-01-01' }),
      events: [
        { id: 'a', cdaId: 'd1', type: 'susp_parcelamento', date: '2018-01-10' },
        { id: 'x', cdaId: 'd1', type: 'int_rescisao_parcelamento', date: '2021-06-15', defaultDate: '2021-03-20' }
      ],
      asOf: ASOF
    });
    assert.equal(r.segment, 'credito');
    assert.equal(r.diesAdQuem, '2026-06-15');
    assert.equal(r.band.cedo.diesAdQuem, '2026-03-20');
  });

  it('transação tem o efeito do parcelamento', () => {
    const r = inter([
      marco,
      { id: 't', executionId: 'e1', type: 'susp_transacao', date: '2020-02-01' }
    ]);
    assert.equal(r.phase, 'suspenso');
    assert.ok(r.rulesApplied.includes('R5'));
  });

  it('A2: pedido sem deferimento interrompe na data do pedido, sem pausa', () => {
    const r = inter([marco, { id: 'p', executionId: 'e1', type: 'int_pedido_parcelamento', date: '2019-09-17' }]);
    assert.equal(r.diesAQuo, '2019-09-17');
    assert.equal(r.diesAdQuem, '2025-09-17');
    assert.equal(r.band.cedo.diesAdQuem, '2024-09-17');
    assert.deepEqual(r.band.motivos.map(m => m.code), ['A2']);
    const ord = computePrescription({
      debt: naoAjuizada({ constitutionDate: '2021-05-10' }),
      events: [{ id: 'p', cdaId: 'd1', type: 'int_pedido_parcelamento', date: '2024-09-17' }],
      asOf: ASOF
    });
    assert.equal(ord.diesAdQuem, '2029-09-17');
  });

  it('A6: parcelamento vigente — cedo = última conferência + 5 anos; tarde sem termo', () => {
    const r = inter([marco, { id: 'a', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-10', verifiedAt: '2024-05-01' }]);
    assert.equal(r.phase, 'suspenso');
    assert.equal(r.diesAdQuem, null);
    assert.equal(r.band.cedo.diesAdQuem, '2029-05-01');
    assert.equal(r.band.kind, 'dado');
    assert.deepEqual(r.band.motivos.map(m => m.code), ['A6']);
  });

  it('A6: sem conferência, a cedo conta da própria adesão', () => {
    const r = inter([marco, { id: 'a', executionId: 'e1', type: 'susp_parcelamento', date: '2020-01-10' }]);
    assert.equal(r.band.cedo.diesAdQuem, '2025-01-10');
    assert.equal(r.band.cedo.phase, 'consumado');
  });
});

describe('faixa cedo–tarde: pausas (A3, A4, A5)', () => {
  it('A3: reconhecimento que você declara reinicia 5 anos nas duas datas', () => {
    const r = inter([marco, { id: 'r', executionId: 'e1', type: 'int_reconhecimento', date: '2019-05-01' }]);
    assert.equal(r.diesAQuo, '2019-05-01');
    assert.equal(r.diesAdQuem, '2024-05-01');
    assert.equal(r.band, null);
  });

  it('A4: recuperação judicial não pausa; falência pausa só na data tarde', () => {
    const rj = inter([marco, { id: 'f', executionId: 'e1', type: 'susp_falencia', date: '2019-01-01' }]);
    assert.equal(rj.diesAdQuem, '2022-01-01');
    assert.equal(rj.phase, 'consumado');
    const fal = inter([marco, { id: 'f', executionId: 'e1', type: 'susp_falencia_decretada', date: '2019-01-01' }]);
    assert.equal(fal.phase, 'suspenso');
    assert.equal(fal.band.cedo.diesAdQuem, '2022-01-01');
    assert.deepEqual(fal.band.motivos.map(m => m.code), ['A4']);
  });

  it('A5: pausa sem fim — cedo presume o fim na última conferência', () => {
    const base = { id: 'l', cdaId: 'd1', type: 'susp_decisao_judicial', date: '2021-03-01' };
    const semConferencia = computePrescription({ debt: naoAjuizada({ constitutionDate: '2020-06-01' }), events: [base], asOf: ASOF });
    assert.equal(semConferencia.phase, 'suspenso');
    assert.equal(semConferencia.band.cedo.diesAdQuem, '2025-06-01');
    assert.equal(semConferencia.band.kind, 'dado');
    const conferida = computePrescription({
      debt: naoAjuizada({ constitutionDate: '2020-06-01' }),
      events: [{ ...base, verifiedAt: '2021-09-01' }],
      asOf: ASOF
    });
    assert.equal(conferida.band.cedo.diesAdQuem, '2025-12-02');
    const lancada = computePrescription({
      debt: naoAjuizada({ constitutionDate: '2020-06-01' }),
      events: [{ ...base, createdAt: '2021-09-01T12:00:00.000Z' }],
      asOf: ASOF
    });
    assert.equal(lancada.band.cedo.diesAdQuem, '2025-12-02', 'o lançamento sem fim vale como conferência');
  });

  it('openPauseEvents lista pausas sem fim e adesões vigentes', () => {
    const list = openPauseEvents([
      { id: 'l', type: 'susp_decisao_judicial', date: '2021-03-01', verifiedAt: '2021-09-01' },
      { id: 'e', type: 'susp_embargos', date: '2021-03-01', endDate: '2022-01-01' },
      { id: 'a', type: 'susp_parcelamento', date: '2023-01-01' },
      { id: 'c', type: 'susp_idpj_mcf_constricao', date: '2023-01-01' }
    ], ASOF);
    assert.deepEqual(list.map(p => p.id), ['l', 'a']);
    assert.equal(list[0].verifiedAt, '2021-09-01');
    assert.equal(list[1].adesao, true);
  });
});

describe('faixa cedo–tarde: ciência (B1, B2, B3) e penhora antiga (B4)', () => {
  it('B1: ciência eletrônica — cedo na disponibilização; tarde na abertura', () => {
    const r = inter([{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-03-15', availableDate: '2020-03-05' }]);
    assert.equal(r.diesAdQuem, '2026-03-15');
    assert.equal(r.band.cedo.diesAdQuem, '2026-03-05');
    assert.deepEqual(r.band.motivos.map(m => m.code), ['B1']);
  });

  it('B2: só a decisão de suspensão — cedo pelo último ato conhecido; pedido da Fazenda prevalece', () => {
    const cit = { id: 'c', executionId: 'e1', type: 'int_citacao', date: '2016-03-01' };
    const r = inter([cit, { id: 's', executionId: 'e1', type: 'susp_art40', date: '2019-06-01' }]);
    assert.equal(r.diesAdQuem, '2025-06-01');
    assert.equal(r.band.cedo.diesAdQuem, '2022-03-01');
    assert.equal(r.band.kind, 'dado');
    const comPedido = inter([cit, { id: 's', executionId: 'e1', type: 'susp_art40', date: '2019-06-01', requestDate: '2019-02-01' }]);
    assert.equal(comPedido.band.cedo.diesAdQuem, '2025-02-01');
  });

  it('B3: só o arquivamento — cedo arquivamento + 5; tarde + 6', () => {
    const r = inter([{ id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2021-06-01' }]);
    assert.equal(r.phase, 'nao_iniciado');
    assert.equal(r.band.cedo.diesAdQuem, '2026-06-01');
    assert.equal(r.band.tarde.diesAdQuem, '2027-06-01');
    assert.equal(r.band.kind, 'dado');
    assert.ok(r.estimates.some(e => e.date === '2026-06-01'));
  });

  it('B4: penhora efetiva há mais de 6 anos vai à lista própria', () => {
    const r = inter([marco, { id: 'p', executionId: 'e1', type: 'int_penhora', requestDate: '2017-01-10', date: '2017-03-01' }]);
    assert.equal(r.phase, 'interrompido');
    const info = penhoraAntigaInfo(r, ASOF);
    assert.equal(info.limitDate, '2023-03-01');
    assert.equal(info.due, true);
    assert.equal(penhoraAntigaInfo(inter([marco]), ASOF), null);
  });
});

describe('ordinária e decadência (C1, D1, D2, D3) e redirecionamento (D4)', () => {
  it('C1: constituição pela modalidade — declarado: entrega ou vencimento, o que for posterior', () => {
    assert.equal(constituicaoDefinitiva({ launchMode: 'declarado', declarationDate: '2020-05-10', dueDate: '2020-04-30' }).date, '2020-05-10');
    assert.equal(constituicaoDefinitiva({ launchMode: 'oficio', assessmentNoticeDate: '2021-02-01' }).date, '2021-03-03');
    assert.equal(constituicaoDefinitiva({ launchMode: 'oficio', finalDecisionDate: '2021-02-01', paymentTermDays: 60 }).date, '2021-04-02');
    const r = computePrescription({ debt: naoAjuizada({ launchMode: 'declarado', declarationDate: '2020-05-10', dueDate: '2020-04-30' }), asOf: ASOF });
    assert.equal(r.diesAdQuem, '2025-05-10');
    assert.equal(r.band, null);
  });

  it('C1: sem constituição — cedo pelo vencimento; tarde pela inscrição', () => {
    const r = computePrescription({ debt: naoAjuizada({ launchMode: 'declarado', dueDate: '2020-04-30' }), asOf: ASOF });
    assert.equal(r.diesAdQuem, '2027-01-10');
    assert.equal(r.band.cedo.diesAdQuem, '2025-04-30');
    assert.equal(r.band.kind, 'dado');
    assert.equal(alarmPoint(r).diesAdQuem, '2025-04-30');
  });

  it('C1: sem nenhuma data além da inscrição — faixa incerta, mesma data', () => {
    const r = computePrescription({ debt: naoAjuizada(), asOf: ASOF });
    assert.equal(r.band.motivos[0].code, 'C1x');
    assert.equal(r.band.cedo.diesAdQuem, r.band.tarde.diesAdQuem);
  });

  it('D1: ordinária consumada antes do ajuizamento fica na coluna, sem alarme', () => {
    const r = computeOrdinaria({
      debt: cda({ constitutionDate: '2008-01-01', inscriptionDate: '2014-01-01' }),
      executions: [ef({ protocolDate: '2014-03-01' })],
      asOf: ASOF
    });
    assert.equal(r.phase, 'consumado');
    assert.match(r.summary, /Consumada antes do ajuizamento/);
    assert.match(r.summary, /Conferir interrupções anteriores/);
  });

  it('D1: faixa da ordinária de CDA ajuizada não alarma', () => {
    const r = computeOrdinaria({
      debt: cda({ inscriptionDate: '2014-01-01', launchMode: 'declarado', dueDate: '2008-04-30' }),
      executions: [ef({ protocolDate: '2014-03-01' })],
      asOf: ASOF
    });
    assert.equal(r.band.cedo.phase, 'consumado');
    assert.equal(r.band.alarme, false);
  });

  it('D2: despacho anterior à LC 118/2005 — interrompida só se houve citação', () => {
    const r = computeOrdinaria({
      debt: cda({ inscriptionDate: '2003-01-01' }),
      executions: [ef({ protocolDate: '2004-03-01' })],
      asOf: ASOF
    });
    assert.equal(r.lc118Pendente, true);
    assert.match(r.summary, /Interrompida se houve citação/);
    assert.ok(r.checks.some(c => /data da citação/.test(c)));
    const citada = computeOrdinaria({
      debt: cda({ inscriptionDate: '2003-01-01' }),
      executions: [ef({ protocolDate: '2004-03-01' })],
      events: [{ id: 'c', executionId: 'e1', type: 'int_citacao', date: '2004-06-01' }],
      asOf: ASOF
    });
    assert.equal(citada.lc118Pendente, false);
  });

  it('D3: decadência — cedo no ano seguinte ao fato gerador; tarde no ano seguinte ao vencimento; nunca alarma', () => {
    const r = computeDecadencia({ launchMode: 'oficio', taxPeriodEnd: '2018-12-31', dueDate: '2019-01-31' }, ASOF);
    assert.equal(r.diesAQuo, '2020-01-01');
    assert.equal(r.diesAdQuem, '2025-01-01');
    assert.equal(r.band.cedo.diesAdQuem, '2024-01-01');
    assert.equal(r.band.alarme, false);
    const mesmoAno = computeDecadencia({ launchMode: 'oficio', taxPeriodEnd: '2018-03-31', dueDate: '2018-04-30' }, ASOF);
    assert.equal(mesmoAno.band, undefined);
  });

  it('D3: a notificação do lançamento obsta a decadência', () => {
    const r = computeDecadencia({ launchMode: 'oficio', taxPeriodEnd: '2018-12-31', assessmentNoticeDate: '2022-05-01' }, ASOF);
    assert.equal(r.status, 'obstada');
  });

  it('D4: redirecionamento conta da dissolução posterior à citação; pedido no prazo', () => {
    const events = [
      { id: 'c', type: 'int_citacao', date: '2018-05-01' },
      { id: 'd', type: 'info_dissolucao_irregular', date: '2020-02-01' }
    ];
    const r = redirecionamentoInfo({ exec: ef(), events, asOf: ASOF });
    assert.equal(r.start, '2020-02-01');
    assert.equal(r.limitDate, '2025-02-01');
    assert.equal(r.status, 'vencido');
    const comPedido = redirecionamentoInfo({ exec: ef(), events: [...events, { id: 'p', type: 'info_pedido_redirecionamento', date: '2024-06-01' }], asOf: ASOF });
    assert.equal(comPedido.status, 'pedido_no_prazo');
    assert.doesNotMatch(comPedido.text, /Tema|Súmula/);
  });
});

describe('fila v2: alarme pela data cedo (E1, E2, E3, B4)', () => {
  const op = { id: 'op1', name: 'Op', status: 'ativa' };
  const radarOf = (debts, events, executions = [ef({ operationId: 'op1' })]) => buildPrazosRadar({
    operations: [op], executions, prescriptionEvents: events, debts: debts.map(d => ({ operationId: 'op1', status: 'ativa', value: 1, ...d })), people: []
  }, ASOF, { policy: 'v2' });

  it('E1: janela de 90 dias — termo em 120 dias ainda não é iminente', () => {
    const r = radarOf([cda()], [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2021-01-24' }]);
    const row = r.rows.find(x => x.id === 'd1');
    assert.equal(row.prescKind, 'correndo');
    const r2 = radarOf([cda()], [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2020-11-24' }]);
    assert.equal(r2.rows.find(x => x.id === 'd1').prescKind, 'iminente');
  });

  it('E2: faixa de tese vai ao grupo 1 quando a data cedo entra na janela', () => {
    const r = radarOf([cda()], [
      marco,
      { id: 'a', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-10' },
      { id: 'x', executionId: 'e1', type: 'int_rescisao_parcelamento', date: '2021-12-01' }
    ]);
    const row = r.rows.find(x => x.id === 'd1');
    assert.equal(row.group, 1);
    assert.equal(row.prescKind, 'iminente');
    assert.equal(row.prescDate, '2026-12-01');
    assert.match(row.keyLabel, /cedo 01\/12\/2026 · tarde 01\/12\/2027/);
    assert.match(row.basis, /inadimplemento e exclusão formal/);
    assert.doesNotMatch(row.why, UI_FORBIDDEN);
  });

  it('E2: faixa de dado vira pedido de dado (grupo 3) antes da cedo e grupo 2 depois', () => {
    const antes = radarOf([cda()], [{ id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2021-11-01' }]);
    const r1 = antes.rows.find(x => x.id === 'd1');
    assert.equal(r1.prescKind, 'pedido_dado');
    assert.equal(r1.group, 3);
    assert.equal(r1.action.type, 'lancar_ciencia');
    const depois = radarOf([cda()], [{ id: 'a', executionId: 'e1', type: 'info_arquivamento', date: '2021-06-01' }]);
    const r2 = depois.rows.find(x => x.id === 'd1');
    assert.equal(r2.group, 2);
    assert.notEqual(r2.consumada, 'old');
  });

  it('E3: aguardando reconhecimento tem lembrete fixo de 60 dias da marcação', () => {
    const r = radarOf([cda({ prescriptionHandled: true, prescriptionHandledType: 'aguardando_reconhecimento', prescriptionHandledAt: '2026-08-01' })],
      [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }]);
    const row = r.rows.find(x => x.id === 'd1');
    assert.equal(row.group, 4);
    assert.equal(row.reviewAt, '2026-09-30');
  });

  it('B4: penhora efetiva há mais de 6 anos vai ao grupo 7; analisada sai por 1 ano ou até novo evento', () => {
    const ev = [marco, { id: 'p', executionId: 'e1', type: 'int_penhora', requestDate: '2017-01-10', date: '2017-03-01' }];
    const r = radarOf([cda()], ev);
    const row = r.rows.find(x => x.id === 'd1');
    assert.equal(row.group, 7);
    assert.equal(row.prescKind, 'penhora_antiga');
    assert.equal(r.totals[7].n, 1);
    const analisada = radarOf([cda({ penhoraAnalise: { at: '2026-05-01', nota: 'bens garantem' } })], ev);
    assert.equal(analisada.rows.find(x => x.id === 'd1').group, 4);
    const novoFato = radarOf([cda({ penhoraAnalise: { at: '2026-05-01' } })], [...ev, { id: 'o', executionId: 'e1', type: 'info_outro', date: '2026-06-01' }]);
    assert.equal(novoFato.rows.find(x => x.id === 'd1').group, 7);
  });

  it('B5: constrição no incidente não gera alerta na fila; o aviso vai às notas do processo', () => {
    const executions = [
      ef({ operationId: 'op1' }),
      { id: 'idpj1', operationId: 'op1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const r = radarOf([cda()], [marco, { id: 'c', executionId: 'idpj1', type: 'susp_idpj_mcf_constricao', requestDate: '2019-01-01', date: '2019-02-01' }], executions);
    const row = r.rows.find(x => x.id === 'd1');
    assert.equal(row.group, 4);
    assert.ok(r.processNotes.some(n => n.kind === 'idpj_constricao' && /IDPJ nº 50099999920234047000/.test(n.text)));
  });
});
