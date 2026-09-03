import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  appendAtuacaoNoteToExecution,
  buildAtuacaoProcessNote,
  findDuplicateExecutionGroups,
  getExecutionMergeConflicts,
  isRedundantImportedProcessNote,
  mergeDuplicateExecutions,
  mergeImportedExecution,
  migrateAtuacaoNotesToProcessCards,
  relinkExecutionToOperation,
  sanitizeImportedExecutionNotes,
} from '../src/lib/processes.js';

const baseData = () => ({
  operations: [{
    id: 'op1', name: 'Operação 1', briefing: {
      processStageV2: {
        a: { ajuizamento: { date: '2020-01-01', evento: '1', texto: 'Ajuizamento A' } },
        b: { liminar: { date: '2021-01-01', evento: '5', texto: 'Liminar B' } },
      },
    },
  }, { id: 'op2', name: 'Operação 2' }],
  executions: [
    { id: 'a', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal', status: 'ativa', notesList: ['Nota A'], createdAt: '2024-01-01T00:00:00Z' },
    { id: 'b', operationId: 'op1', processNumber: '50012345620234047001', className: 'Execução Fiscal Previdenciária', status: 'suspensa', parentExecutionId: 'p', notesList: ['Nota B'], createdAt: '2024-02-01T00:00:00Z' },
    { id: 'p', operationId: 'op1', processNumber: '5009999-99.2020.4.04.7001', className: 'Execução Fiscal', status: 'ativa' },
    { id: 'child', operationId: 'op1', processNumber: '5008888-88.2024.4.04.7001', className: 'Embargos', status: 'ativa', parentExecutionId: 'b' },
    { id: 'hub', operationId: 'op1', processNumber: '5007777-77.2024.4.04.7001', className: 'IDPJ', processTag: 'idpj', status: 'ativa', linkedExecutionIds: ['b'] },
  ],
  debts: [{ id: 'd1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001' }],
  prescriptionEvents: [
    { id: 'ev1', operationId: 'op1', executionId: 'a', type: 'marco_sem_bens', date: '2020-01-01' },
    { id: 'ev2', operationId: 'op1', executionId: 'b', type: 'int_penhora', date: '2022-01-01' },
    { id: 'ev3', operationId: 'op1', executionId: 'child', _inheritedFromParent: 'b', type: 'info_arquivamento', date: '2023-01-01' },
    { id: 'ev4', operationId: 'op1', executionId: 'child', _inheritedFromIDPJ: 'b', type: 'susp_idpj_mcf_constricao', date: '2023-02-01' },
  ],
  measures: [{ id: 'm1', operationId: 'op1', executionId: 'b', linkedExecutionIds: ['a', 'b'] }],
  changeLog: [{ id: 'cl1', col: 'executions', entityId: 'b', operationId: 'op1' }],
  intimations: [], tasks: [], hearings: [], documents: [], watchlist: [],
});

describe('diagnóstico e consolidação de processos duplicados', () => {
  it('agrupa somente o mesmo número dentro da mesma operação', () => {
    const data = baseData();
    data.executions.push({ id: 'other-op', operationId: 'op2', processNumber: '50012345620234047001', className: 'Execução Fiscal' });
    const groups = findDuplicateExecutionGroups(data);
    assert.equal(groups.length, 1);
    assert.deepEqual(new Set(groups[0].executionIds), new Set(['a', 'b']));
    assert.ok(getExecutionMergeConflicts([data.executions[0], data.executions[1]]).some(c => c.field === 'status'));
  });

  it('migra referências, preserva eventos e arquiva os registros absorvidos', () => {
    const data = baseData();
    const beforeEvents = data.prescriptionEvents.length;
    const result = mergeDuplicateExecutions(data, {
      canonicalId: 'a',
      duplicateIds: ['b'],
      fieldSources: { status: 'b', className: 'b', parentExecutionId: 'b' },
      now: '2026-08-24T12:00:00.000Z',
    });
    const out = result.data;
    const canonical = out.executions.find(e => e.id === 'a');
    assert.equal(out.executions.some(e => e.id === 'b'), false);
    assert.equal(canonical.status, 'suspensa');
    assert.equal(canonical.className, 'Execução Fiscal Previdenciária');
    assert.equal(canonical.parentExecutionId, 'p');
    assert.deepEqual(canonical.notesList, ['Nota A', 'Nota B']);
    assert.deepEqual(canonical.mergedFromExecutionIds, ['b']);
    assert.equal(out.executions.find(e => e.id === 'child').parentExecutionId, 'a');
    assert.deepEqual(out.executions.find(e => e.id === 'hub').linkedExecutionIds, ['a']);
    assert.equal(out.prescriptionEvents.length, beforeEvents);
    assert.equal(out.prescriptionEvents.find(e => e.id === 'ev2').executionId, 'a');
    assert.equal(out.prescriptionEvents.find(e => e.id === 'ev3')._inheritedFromParent, 'a');
    assert.equal(out.prescriptionEvents.find(e => e.id === 'ev4')._inheritedFromIDPJ, 'a');
    assert.equal(out.measures[0].executionId, 'a');
    assert.deepEqual(out.measures[0].linkedExecutionIds, ['a']);
    assert.ok(out.operations[0].briefing.processStageV2.a.ajuizamento);
    assert.ok(out.operations[0].briefing.processStageV2.a.liminar);
    assert.equal(out.operations[0].briefing.processStageV2.b, undefined);
    assert.equal(out.operations[0].briefing.processMergeArchive.length, 1);
    assert.ok(out.operations[0].briefing.processMergeArchive[0].processStageV2.liminar);
    assert.equal(out.changeLog[0].entityId, 'a');
    assert.equal(result.report.beforeExecutionCount - result.report.afterExecutionCount, 1);
  });

  it('recusa consolidação entre operações diferentes', () => {
    const data = baseData();
    data.executions.find(e => e.id === 'b').operationId = 'op2';
    assert.throws(() => mergeDuplicateExecutions(data, { canonicalId: 'a', duplicateIds: ['b'] }), /mesma operação/i);
  });
});

describe('reassociação e prevenção', () => {
  it('vincula processo e registros órfãos correlatos à operação escolhida', () => {
    const data = baseData();
    data.executions.find(e => e.id === 'a').operationId = '';
    data.debts[0].operationId = '';
    data.intimations.push({ id: 'i1', operationId: '', processNumber: '50012345620234047001' });
    data.prescriptionEvents[0].operationId = '';
    const out = relinkExecutionToOperation(data, 'a', 'op1');
    assert.equal(out.executions.find(e => e.id === 'a').operationId, 'op1');
    assert.equal(out.debts[0].operationId, 'op1');
    assert.equal(out.intimations[0].operationId, 'op1');
    assert.equal(out.prescriptionEvents[0].operationId, 'op1');
  });

  it('merge de importação preenche lacunas sem reabrir status decidido pelo usuário', () => {
    const existing = { id: 'a', status: 'suspensa', className: '', hasGuarantee: false, notesList: ['Manual'] };
    const incoming = { status: 'ativa', className: 'Execução Fiscal', hasGuarantee: true, notes: 'Importada' };
    const merged = mergeImportedExecution(existing, incoming);
    assert.equal(merged.status, 'suspensa');
    assert.equal(merged.className, 'Execução Fiscal');
    assert.equal(merged.hasGuarantee, true);
    assert.deepEqual(merged.notesList, ['Manual', 'Importada']);
  });

  it('não grava espécie da inscrição (SIDA/DEBCAD) como nota na reimportação', () => {
    const existing = { id: 'a', notesList: ['Classe: SIDA', 'Penhora imóvel'] };
    const incoming = { notes: 'DEBCAD' };
    const merged = mergeImportedExecution(existing, incoming);
    assert.deepEqual(merged.notesList, ['Penhora imóvel']);
    assert.equal(merged.notes, undefined);
  });
});

describe('notas automáticas da planilha de processos', () => {
  it('reconhece classe e espécie importadas como nota redundante', () => {
    assert.equal(isRedundantImportedProcessNote('Classe: Execução Fiscal'), true);
    assert.equal(isRedundantImportedProcessNote('Classe: SIDA'), true);
    assert.equal(isRedundantImportedProcessNote('SIDA'), true);
    assert.equal(isRedundantImportedProcessNote('DEBCAD'), true);
    assert.equal(isRedundantImportedProcessNote('Execução Fiscal (SIDA)'), true);
    assert.equal(isRedundantImportedProcessNote('Execução Fiscal (DEBCAD)'), true);
    assert.equal(isRedundantImportedProcessNote('Penhora imóvel ativa'), false);
  });

  it('descarta nota só de espécie quando o processo é novo', () => {
    const clean = sanitizeImportedExecutionNotes({ processNumber: '1', notes: 'Classe: DEBCAD' });
    assert.equal(clean.notesList, undefined);
    assert.equal(clean.notes, undefined);
    assert.equal(clean.processNumber, '1');
  });

  it('a planilha de processos não copia classe/espécie para nota', () => {
    const app = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
    const start = app.indexOf('function parseProcessosXLS');
    const next = app.indexOf('\nfunction ', start + 1);
    const fn = app.slice(start, next > start ? next : undefined);
    assert.equal(fn.includes('notes: `Classe:'), false);
  });
});

describe('nota de atuação no card do processo', () => {
  it('monta nota com tipo, data, texto do usuário e link da peça', () => {
    const note = buildAtuacaoProcessNote(
      { eventDescription: 'Intimação pessoal — redirecionamento' },
      {
        type: 'peticionamento',
        peticionType: 'Manifestação',
        description: 'Peticionado sustentando art. 135 CTN.',
        peticionUrl: 'https://docs.google.com/document/d/exemplo',
      },
      '2026-09-03T12:00:00.000Z'
    );
    assert.match(note, /^\[Atuação · Manifestação · 03\/09\/2026\]/);
    assert.match(note, /Peticionado sustentando art\. 135 CTN\./);
    assert.match(note, /Peça: https:\/\/docs\.google\.com\/document\/d\/exemplo/);
    assert.equal(isRedundantImportedProcessNote(note), false);
  });

  it('migra atuações legadas para notesList e não duplica na segunda passagem', () => {
    const data = {
      operations: [{
        id: 'op1',
        briefing: { entries: [{ id: 'be1', type: 'atuacao', sourceIntimationId: 'i1', html: 'errada' }, { id: 'be2', type: 'observacao', html: 'ok' }] },
      }],
      executions: [{ id: 'a', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', notesList: ['Penhora imóvel'] }],
      intimations: [{
        id: 'i1',
        operationId: 'op1',
        processNumber: '50012345620234047001',
        eventDescription: 'Vista',
        responseAction: { type: 'ciencia', description: 'Ciência registrada.', respondedAt: '2026-08-01T00:00:00.000Z' },
      }],
    };
    migrateAtuacaoNotesToProcessCards(data);
    const notes = data.executions[0].notesList;
    assert.equal(notes.length, 2);
    assert.match(notes[1], /\[Atuação · Ciência · 01\/08\/2026\]/);
    assert.match(notes[1], /Ciência registrada\./);
    assert.equal(data.intimations[0].responseAction._noteOnProcessCard, true);
    assert.deepEqual(data.operations[0].briefing.entries.map(e => e.id), ['be2']);
    migrateAtuacaoNotesToProcessCards(data);
    assert.equal(data.executions[0].notesList.length, 2);
  });

  it('não marca a intimação se o processo ainda não está cadastrado', () => {
    const data = {
      operations: [{ id: 'op1' }],
      executions: [],
      intimations: [{
        id: 'i1',
        operationId: 'op1',
        processNumber: '5001234-56.2023.4.04.7001',
        responseAction: { type: 'ciencia', description: 'Ciência.' },
      }],
    };
    migrateAtuacaoNotesToProcessCards(data);
    assert.equal(data.intimations[0].responseAction._noteOnProcessCard, undefined);
  });
});
