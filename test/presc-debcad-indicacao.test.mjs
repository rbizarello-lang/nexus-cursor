import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDebcadLines, classifyDebcadPhase } from '../src/lib/debcad-parser.js';
import {
  buildPrescricaoReport,
  computePrescription,
  INDICACAO_PARCELAMENTO_TYPE,
  isIndicacaoParcelamentoEvent,
  isRescisaoSemFonteEvent,
  prescEventAsStored,
} from '../src/lib/prescription.js';

// Caso de regressão: despacho de citação em 04/02/2013; Debcad com a fase 760
// “INDICADO P/INCLUSÃO PARC.LEI12996/2014” (fase 21/08/2014, registro 12/06/2016),
// “NAO INCLU. EM PARC ESP L.12996/14” em 26/08/2016, adesão em 14/03/2023 e
// rescisão em 12/10/2024.
const ASOF = '2026-10-07';
const debt = { id: 'd', cdaNumber: '123', inscriptionDate: '2012-05-10', processNumber: 'P1' };
const exec = { id: 'e', processNumber: 'P1', protocolDate: '2013-01-28' };
const IND = 'INDICADO P/INCLUSAO PARC.LEI12996/2014';

// O que o importador anterior gravava: indicação como parcelamento, com a data de registro,
// encerrada no início do parcelamento seguinte por uma rescisão “implícita”.
const legado = () => [
  { id: 'dc', cdaId: 'd', type: 'int_despacho_citacao', date: '2013-02-04' },
  { id: 'p1', cdaId: 'd', type: 'susp_parcelamento', date: '2016-06-12', endDate: '2023-03-14', processRef: 'Fase 760',
    notes: `${IND} · RESCISÃO em 14/03/2023 (Rescindido (implícito))` },
  { id: 'r1', cdaId: 'd', type: 'int_rescisao_parcelamento', date: '2023-03-14',
    notes: `Rescindido (implícito) · ${IND} · Adesão: 12/06/2016` },
  { id: 'p2', cdaId: 'd', type: 'susp_parcelamento', date: '2023-03-14', endDate: '2024-10-12', processRef: 'Fase 733',
    notes: 'EM NEGOCIACAO NO SISPAR · RESCISÃO em 12/10/2024 (Rescindido s/ pagamento)' },
  { id: 'r2', cdaId: 'd', type: 'int_rescisao_parcelamento', date: '2024-10-12', notes: 'Rescindido s/ pagamento' },
];
const calc = (events) => computePrescription({ debt, executions: [exec], events, asOf: ASOF });

describe('Debcad: indicação para parcelamento não é adesão', () => {
  it('reconhece a indicação pela fase 760 ou pelo texto, e a prova do devedor desfaz a leitura', () => {
    const p1 = legado()[1];
    assert.equal(isIndicacaoParcelamentoEvent(p1), true);
    assert.equal(isIndicacaoParcelamentoEvent({ ...p1, processRef: '', notes: IND }), true);
    assert.equal(isIndicacaoParcelamentoEvent({ ...p1, adesaoConfirmada: true }), true, 'confirmação sem prova não basta');
    assert.equal(isIndicacaoParcelamentoEvent({ ...p1, adesaoConfirmada: true, provaAtoDevedor: 'Recibo SISPAR 123' }), false);
    assert.equal(isIndicacaoParcelamentoEvent(legado()[3]), false);
    assert.equal(isRescisaoSemFonteEvent(legado()[2]), true);
    assert.equal(isRescisaoSemFonteEvent(legado()[4]), false);
  });

  it('dados legados: 2016 vira indício, a rescisão de 2023 sai do cálculo, o termo segue 12/10/2030', () => {
    const r = calc(legado());
    assert.equal(r.diesAdQuem, '2030-10-12');
    assert.equal(r.band.cedo.diesAdQuem, '2029-10-12', 'conservadora: 5 anos da rescisão');
    const m2016 = r.memory.find(m => m.date === '2016-06-12');
    assert.ok(m2016, 'indicação aparece na memória');
    assert.match(m2016.effect, /Indício, sem adesão/);
    assert.ok(!r.memory.some(m => /INTERROMPE/.test(m.effect) && m.date === '2016-06-12'));
    assert.ok(!r.memory.some(m => m.date === '2023-03-14' && /exigibilidade restabelecida/.test(m.effect)), 'sem rescisão em 14/03/2023');
    assert.doesNotMatch(m2016.effect, /14\/03\/2023/, 'a rescisão implícita não encerra a indicação');
    assert.ok(r.checks.some(c => /Indicação para parcelamento de 12\/06\/2016/.test(c)));
    assert.ok(r.checks.some(c => /Rescisão de 14\/03\/2023 deduzida/.test(c)));
    // O formulário edita o tipo gravado.
    const ev = r.timeline.find(e => e.id === 'p1');
    assert.equal(ev.type, INDICACAO_PARCELAMENTO_TYPE);
    assert.equal(prescEventAsStored(ev).type, 'susp_parcelamento');
  });

  it('reimportação: indicação com data da fase, registro e não inclusão', () => {
    const events = legado().filter(e => e.id !== 'p1' && e.id !== 'r1');
    events.push({ id: 'i1', cdaId: 'd', type: INDICACAO_PARCELAMENTO_TYPE, date: '2014-08-21', registeredAt: '2016-06-12', endDate: '2016-08-26', processRef: 'Fase 760', notes: IND });
    const r = calc(events);
    const m = r.memory.find(x => x.date === '2014-08-21');
    assert.match(m.effect, /Fato em 21\/08\/2014; registrado em 12\/06\/2016/);
    assert.match(m.effect, /Encerrado em 26\/08\/2016/);
    assert.match(m.effect, /Sem prova de pedido do devedor/);
    assert.equal(r.diesAdQuem, '2030-10-12');
    const txt = buildPrescricaoReport({ debt, timeline: { intercorrente: r }, exec, scope: 'intercorrente', asOf: ASOF });
    assert.match(txt, /fato em 21\/08\/2014; registrado em 12\/06\/2016/);
    assert.match(txt, /Conclusão \(leitura tarde — tese da União\)/);
    assert.match(txt, /Cedo \(mais desfavorável à União; dá o alarme\): 12\/10\/2029/);
    assert.match(txt, /política interna/);
  });

  it('dois cenários da ciência: AR em 2014 consome em 2020 e a adesão de 2023 não salva; ciência em 2020 salva', () => {
    const events = [
      ...legado(),
      { id: 'm', cdaId: 'd', type: 'marco_nao_localizacao', date: '2020-03-02', arReturnDate: '2014-05-19' },
    ];
    const r = calc(events);
    assert.equal(r.diesAdQuem, '2030-10-12', 'tarde: ciência de 2020, adesão de 2023 interrompe');
    assert.equal(r.band.cedo.diesAdQuem, '2020-05-19', 'cedo: devolução do AR + 1 ano + 5 anos');
    assert.equal(r.band.cedo.phase, 'consumado');
    assert.ok(r.band.motivos.some(m => m.code === 'B4'));
    assert.ok(r.checks.some(c => /AR negativo devolvido em 19\/05\/2014/.test(c)));
    const txt = buildPrescricaoReport({ debt, timeline: { intercorrente: r }, exec, scope: 'intercorrente', asOf: ASOF });
    assert.match(txt, /não salvam a execução \(posteriores à consumação\): Parcelamento \(efeito duplo\) de 14\/03\/2023/);
  });

  it('o piso operacional sai da linha do tempo e vira referência', () => {
    const r = calc([{ id: 'dc', cdaId: 'd', type: 'int_despacho_citacao', date: '2013-02-04' }]);
    assert.ok(!r.memory.some(m => /Piso operacional/.test(m.event)));
    assert.ok((r.operational || []).some(o => /Não pode ter prescrito antes de/.test(o.event)));
  });

  it('confere a divergência de ajuizamento entre Nexus e Debcad', () => {
    const d = { ...debt, debcad: { dadosGerais: { protocolDate: '2014-02-19', processNumber: 'P1' }, ajuizamentos: [] } };
    const r = computePrescription({ debt: d, executions: [{ ...exec, protocolDate: '2013-12-01' }], events: legado(), asOf: ASOF });
    assert.ok(r.checks.some(c => /Ajuizamento diverge do Debcad: Nexus 01\/12\/2013, Debcad 19\/02\/2014/.test(c)));
  });
});

describe('parser Debcad: indicação, data da fase e encerramento pelo próprio evento', () => {
  const lines = [
    'Debcad 1 / 1',
    'DADOS GERAIS DO DEBCAD',
    'Debcad: 123',
    'Data Inscrição: 10/05/2012',
    'HISTÓRICO',
    'Código/ Nome Data Fase Data Hora Função Observação',
    '760 - PRE- 21/08/2014 12/06/2016 10:00:00 ADEBINS INDICADO P/INCLUSAO PARC.LEI12996/2014',
    'PARCELAMENTO',
    '775 - INCLUSAO 26/08/2016 26/08/2016 11:00:00 ADEBINS NAO INCLU. EM PARC ESP L.12996/14',
    '733 - EM 14/03/2023 15/03/2023 09:00:00 ACONPAR NEGOCIACAO SISPAR',
    '797 - PARCELAMENTO 12/10/2024 13/10/2024 08:00:00 ARESPAR RESCINDIDO S PAG',
    'FIM DO RELATORIO',
  ];
  const rec = parseDebcadLines(lines)[0];

  it('a fase 760 é indicação, encerrada pela não inclusão, com data da fase e de registro', () => {
    assert.equal(rec.indicacoesParcelamento.length, 1);
    const ind = rec.indicacoesParcelamento[0];
    assert.equal(ind.data, '2014-08-21');
    assert.equal(ind.registro, '2016-06-12');
    assert.equal(ind.encerramento, '2016-08-26');
    assert.equal(ind.situacao, 'Não incluído');
  });

  it('o parcelamento usa a data da fase e termina na própria rescisão; nada de rescisão implícita', () => {
    assert.equal(rec.parcelamentos.length, 1);
    const p = rec.parcelamentos[0];
    assert.equal(p.adesao, '2023-03-14');
    assert.equal(p.adesaoRegistro, '2023-03-15');
    assert.equal(p.encerramento, '2024-10-12');
    assert.ok(!rec.parcelamentos.some(x => /impl[ií]cito/i.test(x.situacao || '')));
  });

  it('nova adesão não encerra a anterior', () => {
    const r2 = parseDebcadLines([
      'Debcad 1 / 1', 'Debcad: 9', 'HISTÓRICO',
      '779 - INCLUIDO 01/02/2010 01/02/2010 10:00:00 ADEB PARC',
      '733 - EM 14/03/2023 14/03/2023 09:00:00 ACONPAR NEGOCIACAO SISPAR',
      'FIM DO RELATORIO',
    ])[0];
    assert.equal(r2.parcelamentos.length, 2);
    assert.equal(r2.parcelamentos[0].encerramento, undefined);
    assert.equal(r2.parcelamentos[0].situacao, 'Encerramento não informado');
  });

  it('classifica pelo status', () => {
    assert.equal(classifyDebcadPhase({ code: '760', desc: 'PRE-PARCELAMENTO' }), 'indicacao');
    assert.equal(classifyDebcadPhase({ code: '775', desc: 'NAO INCLU. EM PARC ESP L.12996/14' }), 'nao_inclusao');
    assert.equal(classifyDebcadPhase({ code: '775', desc: 'INCLUSAO EM PARCELAMENTO ESPECIAL' }), 'adesao');
    assert.equal(classifyDebcadPhase({ code: '797', desc: 'PARCELAMENTO RESCINDIDO' }), 'rescisao');
  });
});
