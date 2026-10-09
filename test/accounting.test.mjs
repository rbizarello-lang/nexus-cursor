import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assetConstrictionLine, collectOperationEvents, buildChangeLogEntries, formatChangeLogValue } from '../src/lib/accounting.js';

const deps = {
  getStageRecords: (briefing, id) => (briefing.stages || {})[id] || {},
  resolveStageDef: (STG, k) => STG[k] || { label: k },
  isEfStylePanoramaCard: () => false,
  PROCESS_STAGES: { sentenca: { label: 'Sentença' } },
  CENTRAL_STAGES: {},
  getBriefingEntries: (b) => b.entries || [],
  BRIEFING_ENTRY_TYPES: { observacao: { label: 'Observação' } },
  CX_HEARING: { instrucao: 'Audiência de instrução' },
  ASSET_STATUSES: { indisponibilidade_ativa: { label: 'Indisponibilidade Ativa' }, liberado: { label: 'Liberado' } },
  EXEC_STATUSES: {}, DEBT_STATUSES: {},
};
const period = { fromIso: '2026-09-01', toIso: '2026-09-30' };
const base = (extra = {}) => ({ op: { id: 'op1' }, deps, ...extra });
const run = (extra) => collectOperationEvents(base(extra), period);

describe('collectOperationEvents — o que continua igual', () => {
  it('reúne intimação, atuação, fase, diário, lembrete, audiência e tarefa concluída', () => {
    const ev = run({
      opIntimsAll: [{ processNumber: '1', responseAction: { type: 'ciencia', respondedAt: '2026-09-10T10:00:00Z', description: 'ok' } }],
      opExecs: [{ id: 'e1', processNumber: '2', proactiveActions: [{ date: '2026-09-11', summary: 'Pedido' }] }],
      briefing: {
        stages: { e1: { sentenca: { date: '2026-09-12', texto: 'procedente' } } },
        entries: [{ type: 'observacao', eventDate: '2026-09-13', html: '<p>Nota&nbsp;x</p>' }],
      },
      opReminders: [{ createdAt: '2026-09-14T09:00:00', content: 'Lembrar' }],
      opHearings: [{ status: 'realizada', date: '2026-09-15', hearingType: 'instrucao', parties: 'A x B' }],
      opChangeLog: [{ col: 'tasks', field: 'status', to: 'concluida', date: '2026-09-16T12:00:00Z', ref: 'Tarefa X' }],
      opDocuments: [{ createdAt: '2026-09-17T12:00:00Z', title: 'Petição avulsa' }],
    });
    const byKind = Object.fromEntries(ev.map(e => [e.kind, e.text]));
    assert.equal(byKind['Intimação'], 'Ciência — ok');
    assert.equal(byKind['Atuação'], 'Atuação proativa — Pedido');
    assert.equal(byKind['Fase'], 'Sentença — procedente');
    assert.equal(byKind['Diário'], 'Observação: Nota x');
    assert.equal(byKind['Lembrete'], 'Lembrar');
    assert.equal(byKind['Audiência'], 'Realizada — Audiência de instrução: A x B');
    assert.equal(byKind['Tarefa'], 'Concluída: Tarefa X');
    assert.equal(byKind['Peça'], 'Petição avulsa');
    assert.equal(ev.length, 8);
  });
  it('ignora eventos fora do período', () => {
    assert.equal(run({ opHearings: [{ status: 'realizada', date: '2026-10-02' }] }).length, 0);
  });
});

describe('collectOperationEvents — eventos de prescrição', () => {
  const opDebts = [{ id: 'c1', cdaNumber: '80.1' }, { id: 'c2', cdaNumber: '80.2' }];
  const opExecs = [{ id: 'e1', processNumber: '5001' }];
  it('reconhece por cdaId, sem operationId (importação)', () => {
    const ev = run({ opDebts, prescriptionEvents: [{ cdaId: 'c1', type: 'susp_parcelamento', date: '2026-09-05' }] });
    assert.equal(ev.length, 1);
    assert.match(ev[0].text, /CDA 80\.1/);
  });
  it('reconhece lote (batchCdaIds) e rotula "N CDAs"', () => {
    const ev = run({ opDebts, prescriptionEvents: [{ batchCdaIds: ['c1', 'c2'], type: 'x', date: '2026-09-05' }] });
    assert.equal(ev.length, 1);
    assert.match(ev[0].text, /2 CDAs/);
  });
  it('reconhece só por executionId e rotula o processo', () => {
    const ev = run({ opExecs, prescriptionEvents: [{ executionId: 'e1', type: 'x', date: '2026-09-05' }] });
    assert.equal(ev.length, 1);
    assert.match(ev[0].text, /Proc\. 5001/);
  });
  it('mantém o vínculo por operationId e descarta evento de outra operação', () => {
    const ev = run({ opDebts, prescriptionEvents: [
      { operationId: 'op1', type: 'a', date: '2026-09-05' },
      { operationId: 'op2', cdaId: 'zz', type: 'b', date: '2026-09-05' },
    ] });
    assert.equal(ev.length, 1);
    assert.equal(ev[0].text, 'Evento lançado: a');
  });
});

describe('collectOperationEvents — contagem dupla de peças', () => {
  it('documento de resposta a intimação ou de atuação proativa não vira "Peça"', () => {
    const ev = run({ opDocuments: [
      { createdAt: '2026-09-10T12:00:00Z', title: 'A', sourceIntimationId: 'i1' },
      { createdAt: '2026-09-10T12:00:00Z', title: 'B', sourceActionType: 'proativa' },
      { createdAt: '2026-09-10T12:00:00Z', title: 'C' },
    ] });
    assert.deepEqual(ev.map(e => e.text), ['C']);
  });
});

describe('collectOperationEvents — bem já cadastrado em constrição', () => {
  const asset = { id: 'a1', status: 'indisponibilidade_ativa', description: 'Imóvel fictício', createdAt: '2026-09-08T10:00:00Z' };
  it('gera "Constrição" na data de cadastro', () => {
    const ev = run({ opAssets: [asset, { id: 'a2', status: 'liberado', createdAt: '2026-09-08T10:00:00Z' }] });
    assert.equal(ev.length, 1);
    assert.equal(ev[0].kind, 'Constrição');
    assert.match(ev[0].text, /Bem cadastrado como Indisponibilidade Ativa/);
  });
  it('usa a data da constrição (constrictionDate) no lugar da data de cadastro', () => {
    const ev = run({ opAssets: [{ ...asset, createdAt: '2026-10-20T10:00:00Z', constrictionDate: '2026-09-15' }] });
    assert.equal(ev.length, 1);
    assert.equal(ev[0].date, '2026-09-15');
    assert.equal(run({ opAssets: [{ ...asset, constrictionDate: '2026-08-15' }] }).length, 0);
  });
  it('não duplica quando o changeLog já registra o status do bem', () => {
    const ev = run({ opAssets: [asset], opChangeLog: [{ col: 'assets', entityId: 'a1', field: 'status', to: 'indisponibilidade_ativa', date: '2026-09-09T10:00:00Z', ref: 'Bem X' }] });
    assert.equal(ev.length, 1);
    assert.match(ev[0].text, /Bem X →/);
  });
});

describe('buildChangeLogEntries / formatChangeLogValue', () => {
  let n = 0;
  const mk = (over) => buildChangeLogEntries({
    col: 'intimations', now: '2026-09-01T00:00:00Z', auditFields: ['status', 'responseAction', 'classifications'],
    refFn: () => 'Intimação 1', uid: () => 'id' + (++n), ...over,
  });
  it('responseAction vira texto legível', () => {
    assert.equal(formatChangeLogValue('responseAction', { type: 'peticionamento', peticionType: 'Contrarrazões' }), 'Peticionamento (Contrarrazões)');
    assert.equal(formatChangeLogValue('responseAction', { type: 'ciencia' }), 'Ciência');
    assert.equal(formatChangeLogValue('responseAction', { type: 'outra' }), 'Outra medida');
    const out = mk({ before: { id: 'i1' }, entity: { id: 'i1', responseAction: { type: 'ciencia', respondedAt: 'x' } } });
    assert.equal(out.length, 1);
    assert.equal(out[0].from, '(vazio)');
    assert.equal(out[0].to, 'Ciência');
  });
  it('objeto genérico vira JSON curto, nunca [object Object]', () => {
    const s = formatChangeLogValue('x', { a: 1 });
    assert.equal(s, '{"a":1}');
    assert.ok(!s.includes('[object Object]'));
  });
  it('array vira lista separada por vírgula', () => {
    assert.equal(formatChangeLogValue('classifications', ['a', 'b']), 'a,b');
  });
  it('grava a origem quando informada e não grava quando ausente', () => {
    const args = { before: { id: 'i1', status: 'a' }, entity: { id: 'i1', status: 'b' } };
    assert.equal(mk({ ...args, source: 'importacao' })[0].source, 'importacao');
    assert.ok(!('source' in mk(args)[0]));
  });
  it('campo não tocado ou igual não gera entrada; criação não gera', () => {
    assert.equal(mk({ before: { id: 'i1', status: 'a' }, entity: { id: 'i1', responseAction: undefined } }).length, 0);
    assert.equal(mk({ before: { id: 'i1', status: 'a' }, entity: { id: 'i1', status: 'a' } }).length, 0);
    assert.equal(mk({ before: null, entity: { id: 'i1', status: 'a' } }).length, 0);
  });
});

describe('assetConstrictionLine', () => {
  it('ativa e requerida mostram a data; sem data ou liberado, nada', () => {
    assert.equal(assetConstrictionLine({ status: 'indisponibilidade_ativa', constrictionDate: '2026-09-15' }), 'Indisponível desde 15/09/2026');
    assert.equal(assetConstrictionLine({ status: 'indisponibilidade_requerida', constrictionDate: '2026-09-15' }), 'Requerida em 15/09/2026');
    assert.equal(assetConstrictionLine({ status: 'indisponibilidade_ativa' }), '');
    assert.equal(assetConstrictionLine({ status: 'liberado', constrictionDate: '2026-09-15' }), '');
  });
});
