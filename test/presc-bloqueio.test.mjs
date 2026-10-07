import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOQUEIO_NEGOCIACAO_TYPE,
  classifyPainelPrescAlert,
  collectEventsForCda,
  computeOrdinaria,
  computePrescription,
  inferParcelamentoEnds,
  isBloqueioNegociacaoEvent,
  isCdaParcelada,
  openPauseEvents,
  prescEventAsStored,
} from '../src/lib/prescription.js';

const ASOF = '2026-09-28';
const DESC = 'BLOQUEIO NEGOCIACAO L11941 ATIVA AJUIZADA BLOQUEADA';
const debt = { id: 'd', inscriptionDate: '1999-06-01', processNumber: 'P1' };
const exec = { id: 'e', processNumber: 'P1', protocolDate: '2003-04-08' };

// Importador anterior a 19/09/2026: a ocorrência BLOQUEIO NEGOCIACAO virava adesão em vigor
// e encerrava o parcelamento anterior por rescisão implícita na mesma data.
const bloqueio = (over = {}) => ({
  id: 'a4', cdaId: 'd', type: 'susp_parcelamento', date: '2011-07-02',
  createdAt: '2026-09-18T12:00:00Z', processRef: 'Ocorrência SIDA',
  legalBasis: 'Art. 174, p.ú., IV CTN + Art. 151, VI CTN (extraído do SIDA)',
  notes: `${DESC} · Em vigor — exigibilidade suspensa · ${DESC}`,
  ...over
});
const historico = () => [
  { id: 'a1', cdaId: 'd', type: 'susp_parcelamento', date: '2000-03-13', createdAt: '2026-09-18T12:00:00Z', notes: 'OPCAO REFIS · Em vigor — exigibilidade suspensa' },
  { id: 'a2', cdaId: 'd', type: 'susp_parcelamento', date: '2003-07-28', endDate: '2006-04-03' },
  { id: 'r2', cdaId: 'd', type: 'int_rescisao_parcelamento', date: '2006-04-03' },
  { id: 'a3', cdaId: 'd', type: 'susp_parcelamento', date: '2009-12-03', endDate: '2011-07-02' },
  bloqueio(),
  { id: 'r3', cdaId: 'd', type: 'int_rescisao_parcelamento', date: '2011-07-02', notes: 'Rescindido (implícito) · NEGOCIACAO PARC L11941 · Adesão: 03/12/2009' }
];
const inter = (events) => computePrescription({ debt, executions: [exec], events, asOf: ASOF });

describe('BLOQUEIO NEGOCIACAO importado como parcelamento', () => {
  it('reconhece o evento pela nota e respeita a confirmação de adesão', () => {
    assert.equal(isBloqueioNegociacaoEvent(bloqueio()), true);
    assert.equal(isBloqueioNegociacaoEvent(bloqueio({ adesaoConfirmada: true })), false);
    assert.equal(isBloqueioNegociacaoEvent(bloqueio({ notes: 'NEGOCIACAO PARC L11941 · Em vigor' })), false);
    assert.equal(isBloqueioNegociacaoEvent({ id: 'x', type: 'int_citacao', date: '2011-07-02', notes: DESC }), false);
  });

  it('vira registro sem pausa: a intercorrente volta a correr da rescisão de 2011', () => {
    const r = inter(historico());
    assert.equal(r.phase, 'consumado');
    assert.equal(r.diesAdQuem, '2017-07-02');
    assert.equal(r.band.cedo.diesAdQuem, '2016-07-02');
    const occ = (r.occurrences || []).find(o => o.date === '2011-07-02' && /Bloqueio para negociação/.test(o.fact));
    assert.ok(occ, 'bloqueio aparece como registro na linha do tempo');
    assert.match(occ.effect, /sem pausa/);
  });

  it('com adesão confirmada, o parcelamento segue vigente (a rescisão implícita não tem fonte)', () => {
    const r = inter(historico().map(e => (e.id === 'a4' ? bloqueio({ adesaoConfirmada: true }) : e)));
    assert.equal(r.phase, 'suspenso');
    assert.equal(r.diesAdQuem, null);
    assert.equal(r.band.cedo.diesAdQuem, '2031-09-18');
    assert.deepEqual(r.checks.filter(c => /BLOQUEIO NEGOCIACAO/.test(c)), []);
  });

  it('pede conferência com a data e a rescisão implícita', () => {
    const r = inter(historico());
    const check = r.checks.find(c => /BLOQUEIO NEGOCIACAO/.test(c));
    assert.ok(check);
    assert.match(check, /^Evento importado como parcelamento a partir de BLOQUEIO NEGOCIACAO \(02\/07\/2011\) — confira\./);
    assert.match(check, /rescisão do parcelamento anterior nessa data também foi deduzida do bloqueio/);
    const ord = computeOrdinaria({ debt, executions: [exec], events: historico(), asOf: ASOF });
    assert.ok(ord.checks.includes(check), 'mesmo aviso (mesmo id) na coluna da ordinária');
  });

  it('não pausa a ordinária da CDA não ajuizada', () => {
    const d = { id: 'd', inscriptionDate: '2008-01-10' };
    const evs = [
      { id: 'p1', cdaId: 'd', type: 'susp_parcelamento', date: '2009-12-03', endDate: '2011-07-02' },
      { ...bloqueio(), date: '2011-07-02' }
    ];
    const r = computePrescription({ debt: d, executions: [], events: evs, asOf: ASOF });
    assert.equal(r.phase, 'consumado');
    assert.equal(r.diesAdQuem, '2016-07-02');
  });

  it('fica fora das pausas abertas, do parcelamento vigente e das inferências', () => {
    const evs = historico();
    assert.deepEqual(openPauseEvents(evs, ASOF).map(p => p.id), []);
    assert.equal(isCdaParcelada(debt, [exec], evs, ASOF), false);
    const ends = inferParcelamentoEnds(evs);
    assert.equal(ends.has('a4'), false);
    assert.equal(ends.get('a1').end, '2003-07-28');
    const alert = classifyPainelPrescAlert(debt, [exec], evs, ASOF, null, { policy: 'v2' });
    assert.equal(alert && alert.kind, 'vencido');
  });

  it('rescisão implícita do próprio bloqueio também não conta', () => {
    const evs = [
      ...historico().map(e => (e.id === 'a4' ? bloqueio({ endDate: '2014-08-25' }) : e)),
      { id: 'r4', cdaId: 'd', type: 'int_rescisao_parcelamento', date: '2014-08-25', notes: `Rescindido (implícito) · ${DESC} · Adesão: 02/07/2011` }
    ];
    const r = inter(evs);
    assert.equal(r.diesAdQuem, '2017-07-02');
  });

  it('o formulário edita o evento como gravado', () => {
    const mapped = collectEventsForCda(debt, [exec], historico()).events.find(e => e.id === 'a4');
    assert.equal(mapped.type, BLOQUEIO_NEGOCIACAO_TYPE);
    const stored = prescEventAsStored(mapped);
    assert.equal(stored.type, 'susp_parcelamento');
    assert.equal('_bloqueioNegociacao' in stored, false);
    assert.equal(stored.notes, bloqueio().notes);
  });
});
