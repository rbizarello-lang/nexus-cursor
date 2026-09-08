import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCdaColumnView,
  cdaDetailSnapshot,
  checkId,
  computeCdaLegalTimeline,
  openChecks,
  UI_FORBIDDEN
} from '../src/lib/prescription.js';

const PRINT_ASOF = '2026-09-08';

const printDebt = () => ({
  id: 'd-print',
  cdaNumber: '91 2 09 000673-06',
  inscriptionDate: '2009-05-18',
  processNumber: '50012345620094047000'
});
const printExec = () => [{ id: 'e1', processNumber: '50012345620094047000', protocolDate: '2009-11-10' }];
const printEvents = () => [
  { id: 'parc', executionId: 'e1', type: 'susp_parcelamento', date: '2018-01-28' },
  { id: 'pen', executionId: 'e1', type: 'int_penhora', date: '2024-01-26', requestDate: '2024-01-26' }
];

describe('detalhe da inscrição — três colunas', () => {
  it('CDA do print: snapshot das três colunas', () => {
    const tl = computeCdaLegalTimeline({
      debt: printDebt(),
      executions: printExec(),
      events: printEvents(),
      asOf: PRINT_ASOF
    });
    const snap = cdaDetailSnapshot(tl);
    const dec = buildCdaColumnView(tl.decadencia, { key: 'decadencia' });
    const ord = buildCdaColumnView(tl.ordinaria, { key: 'ordinaria' });
    const inter = buildCdaColumnView(tl.intercorrente, { key: 'intercorrente' });

    assert.equal(dec.seal, 'sem dados');
    assert.equal(dec.summary, 'Não calculada: faltam período de apuração e modalidade de lançamento.');
    assert.equal(dec.datesLine, '—');
    assert.equal(dec.occurrences.length, 0);
    assert.ok(dec.checks.some(c => c.text === 'Informar período de apuração e modalidade de lançamento na inscrição.'));

    assert.equal(ord.seal, 'calculado');
    assert.equal(ord.summary, 'Ajuizada em 10/11/2009, dentro dos 5 anos contados da inscrição. Prazo interrompido pela propositura.');
    assert.match(ord.datesLine, /Início: 18\/05\/2009/);
    assert.match(ord.datesLine, /Fim: interrompido em 10\/11\/2009/);
    assert.ok(ord.occurrences.some(o => o.date === '2009-05-18' && o.fact === 'Inscrição' && /constituição não informada/i.test(o.effect)));
    assert.ok(ord.occurrences.some(o => o.date === '2009-11-10' && o.fact === 'Ajuizamento' && o.effect === 'interrompe'));
    assert.ok(!ord.occurrences.some(o => /Penhora|Parcelamento/.test(o.fact)));
    assert.ok(ord.checks.some(c => c.text === 'Data de constituição definitiva não informada; o início usado é a inscrição.'));

    assert.equal(inter.seal, 'calculado');
    assert.equal(inter.summary, 'Ciclo encerrado pela penhora de 26/01/2024. Nenhuma ciência de não localização ou de ausência de bens lançada depois.');
    assert.match(inter.datesLine, /Início: sem ciência lançada/);
    assert.match(inter.datesLine, /Fim: —/);
    assert.ok(inter.occurrences.some(o => o.date === '2009-11-10' && o.fact === 'Ajuizamento'));
    assert.ok(inter.occurrences.some(o => o.date === '2018-01-28' && /Parcelamento/.test(o.fact)));
    assert.ok(inter.occurrences.some(o => o.date === '2024-01-26' && /Penhora/.test(o.fact)));
    assert.ok(inter.estimates.some(e => /Não pode ter prescrito antes de 26\/01\/2030/.test(e.line) && /penhora de 26\/01\/2024 \+ 1 ano \+ 5 anos/.test(e.line)));
    assert.ok(inter.checks.some(c => /28\/01\/2018/.test(c.text) && /rescisão/i.test(c.text)));
    assert.ok(inter.checks.some(c => /26\/01\/2024/.test(c.text) && /ciência|certidão/i.test(c.text)));

    assert.match(snap, /## Decadência/);
    assert.match(snap, /## Prescrição ordinária/);
    assert.match(snap, /## Intercorrente/);
    assert.doesNotMatch(snap, UI_FORBIDDEN);
    assert.doesNotMatch(dec.summary + ord.summary + inter.summary, UI_FORBIDDEN);
  });

  it('CDA com ciência e pausa por IDPJ: origem do incidente e vocabulário da tela', () => {
    const debt = { id: 'd2', cdaNumber: '88 1 20 000001-00', inscriptionDate: '2020-01-15', processNumber: '50011111120204047000' };
    const executions = [
      { id: 'e1', processNumber: '50011111120204047000', protocolDate: '2021-03-01' },
      { id: 'idpj1', processTag: 'idpj', processNumber: '50099999920234047000', linkedExecutionIds: ['e1'] }
    ];
    const events = [
      { id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2022-01-10' },
      { id: 'c', executionId: 'idpj1', type: 'susp_idpj_mcf_constricao', date: '2023-02-01', requestDate: '2023-01-15' }
    ];
    const tl = computeCdaLegalTimeline({ debt, executions, events, asOf: PRINT_ASOF });
    const snap = cdaDetailSnapshot(tl);
    const inter = buildCdaColumnView(tl.intercorrente, { key: 'intercorrente' });
    assert.ok(inter.occurrences.some(o => /Ciência/.test(o.fact)));
    assert.ok(inter.occurrences.some(o => /IDPJ nº/.test(o.source || o.sourceLabel)));
    assert.doesNotMatch(snap, UI_FORBIDDEN);
    assert.doesNotMatch(inter.summary + inter.occurrences.map(o => o.fact + o.effect + o.source).join(' '), UI_FORBIDDEN);
  });

  it('CDA não ajuizada: sem coluna intercorrente; ordinária em curso ou estimada', () => {
    const debt = { id: 'd3', cdaNumber: '77 1 21 000002-00', inscriptionDate: '2021-11-14' };
    const tl = computeCdaLegalTimeline({ debt, executions: [], events: [], asOf: PRINT_ASOF });
    assert.equal(tl.intercorrente, null);
    const snap = cdaDetailSnapshot(tl);
    assert.match(snap, /## Decadência/);
    assert.match(snap, /## Prescrição ordinária/);
    assert.doesNotMatch(snap, /## Intercorrente/);
    assert.doesNotMatch(snap, UI_FORBIDDEN);
  });

  it('marcar conferência remove o item da coluna Conferir da aba Prazos', () => {
    const tl = computeCdaLegalTimeline({
      debt: printDebt(),
      executions: printExec(),
      events: printEvents(),
      asOf: PRINT_ASOF
    });
    const checks = tl.ordinaria.checks;
    assert.ok(checks.length > 0);
    const id = checkId(checks[0]);
    const openBefore = openChecks(checks, []);
    assert.equal(openBefore.length, checks.length);
    const openAfter = openChecks(checks, [{ id, doneAt: '2026-09-08' }]);
    assert.equal(openAfter.length, checks.length - 1);
    assert.ok(!openAfter.some(c => c.id === id));
    const again = openChecks(checks.concat(['Novo item gerado pelo motor']), [{ id, doneAt: '2026-09-08' }]);
    assert.ok(again.some(c => /Novo item/.test(c.text)));
  });
});
