import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ATUACAO_KINDS, applyTaskCompletion, buildUltimasAtuacoes, decisionSummaryFromAction, intimationDecisionText, normalizePecaUrl, planProactiveAction } from '../src/lib/atuacoes.js';

const NOW = '2026-10-01T15:00:00.000Z';

describe('applyTaskCompletion — completedAt acompanha a situação da tarefa', () => {
  it('ao concluir, grava completedAt com a hora do salvamento', () => {
    const out = applyTaskCompletion({ id: 't', status: 'pendente' }, { id: 't', status: 'concluida' }, NOW);
    assert.equal(out.completedAt, NOW);
    assert.equal(out.status, 'concluida');
  });

  it('tarefa nova já criada como concluída também recebe a data', () => {
    assert.equal(applyTaskCompletion(null, { id: 't', status: 'concluida' }, NOW).completedAt, NOW);
  });

  it('ao reabrir (ou cancelar), remove completedAt', () => {
    const prev = { id: 't', status: 'concluida', completedAt: '2026-09-01T10:00:00.000Z' };
    assert.equal(applyTaskCompletion(prev, { ...prev, status: 'pendente' }, NOW).completedAt, undefined);
    assert.equal(applyTaskCompletion(prev, { ...prev, status: 'em_andamento' }, NOW).completedAt, undefined);
    assert.equal(applyTaskCompletion(prev, { ...prev, status: 'cancelada' }, NOW).completedAt, undefined);
    assert.ok('completedAt' in applyTaskCompletion(prev, { ...prev, status: 'pendente' }, NOW), 'a chave existe para sobrescrever o valor antigo no merge do upsert');
  });

  it('editar uma tarefa já concluída preserva a data de conclusão', () => {
    const prev = { id: 't', status: 'concluida', completedAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-20T10:00:00.000Z' };
    const out = applyTaskCompletion(prev, { ...prev, title: 'novo título' }, NOW);
    assert.equal(out.completedAt, '2026-09-01T10:00:00.000Z');
    // entidade parcial (sem completedAt) continua herdando a do registro anterior
    assert.equal(applyTaskCompletion(prev, { id: 't', status: 'concluida', title: 'x' }, NOW).completedAt, '2026-09-01T10:00:00.000Z');
  });

  it('tarefa concluída antiga, sem completedAt, congela o updatedAt anterior em vez de virar "hoje"', () => {
    const prev = { id: 't', status: 'concluida', updatedAt: '2026-06-10T09:00:00.000Z' };
    const out = applyTaskCompletion(prev, { ...prev, title: 'ajuste' }, NOW);
    assert.equal(out.completedAt, '2026-06-10T09:00:00.000Z');
    // sem nenhuma pista, não inventa data
    assert.equal(applyTaskCompletion({ id: 't', status: 'concluida' }, { id: 't', status: 'concluida' }, NOW).completedAt, undefined);
  });

  it('não mexe em tarefas que não estão concluídas e não têm completedAt', () => {
    const next = { id: 't', status: 'pendente', title: 'a' };
    assert.equal(applyTaskCompletion({ id: 't', status: 'em_andamento' }, next, NOW), next);
  });

  it('não altera o objeto recebido', () => {
    const next = Object.freeze({ id: 't', status: 'concluida' });
    const out = applyTaskCompletion({ id: 't', status: 'pendente' }, next, NOW);
    assert.notEqual(out, next);
    assert.equal(next.completedAt, undefined);
  });
});

describe('buildUltimasAtuacoes — respostas, tarefas concluídas e atuações proativas', () => {
  const op = 'op1';
  const intimations = [
    { id: 'i1', operationId: op, processNumber: '5001234-56.2023.4.04.7001', eventDescription: 'Vista', responseAction: { type: 'peticionamento', peticionType: 'Manifestação', description: 'Pediu penhora', peticionUrl: 'https://docs.google.com/document/d/abc', respondedAt: '2026-09-20T12:00:00.000Z' } },
    { id: 'i2', operationId: op, processNumber: '5009999-00.2022.4.04.7002', responseAction: { type: 'ciencia', description: 'Ciência da decisão do evento 52', respondedAt: '2026-09-25T12:00:00.000Z' } },
    { id: 'i3', operationId: op, processNumber: '5000000-00.2021.4.04.7003', responseAction: { type: 'outra', docUrl: 'javascript:alert(1)', respondedAt: '2026-08-01T12:00:00.000Z' } },
    { id: 'i4', operationId: op, processNumber: 'sem resposta' },
    { id: 'i5', operationId: 'outra', responseAction: { type: 'ciencia', respondedAt: '2026-09-30T12:00:00.000Z' } },
  ];
  const tasks = [
    { id: 't1', operationId: op, status: 'concluida', title: 'Juntar matrícula', completedAt: '2026-09-22T18:00:00.000Z', updatedAt: '2026-09-29T10:00:00.000Z', processNumber: '5001234-56.2023.4.04.7001', docUrl: 'https://drive.google.com/x' },
    { id: 't2', operationId: op, status: 'concluida', title: 'Antiga com updatedAt', updatedAt: '2026-07-10T10:00:00.000Z' },
    { id: 't3', operationId: op, status: 'concluida', title: 'Antiga sem nada' },
    { id: 't4', operationId: op, status: 'pendente', title: 'Aberta' },
    { id: 't5', operationId: 'outra', status: 'concluida', title: 'De outra operação', completedAt: '2026-09-30T10:00:00.000Z' },
    { id: 't6', operationId: op, status: 'cancelada', title: 'Cancelada', updatedAt: '2026-09-30T10:00:00.000Z' },
  ];
  const executions = [
    { id: 'e1', operationId: op, processNumber: '5001234-56.2023.4.04.7001', proactiveActions: [
      { id: 'pa1', date: '2026-09-23', summary: 'Requereu SISBAJUD', pecaText: 'Texto integral da peça', pecaUrl: 'https://docs.google.com/document/d/zzz', createdAt: '2026-09-24T09:00:00.000Z' },
      { id: 'pa2', date: '2026-09-10', summary: 'Juntou documentos', pecaText: '', pecaUrl: '', createdAt: '2026-09-10T09:00:00.000Z' },
    ] },
    { id: 'e2', operationId: 'outra', processNumber: '1', proactiveActions: [{ id: 'pa3', date: '2026-09-29', summary: 'De outra operação' }] },
    { id: 'e3', operationId: op, processNumber: '2' },
  ];
  const rows = buildUltimasAtuacoes({ operationId: op, intimations, tasks, executions });
  const keys = rows.map(r => r.key);

  it('lista só o que é da operação e só o que foi de fato feito', () => {
    assert.deepEqual([...keys].sort(), ['resposta:i1', 'resposta:i2', 'resposta:i3', 'proativa:e1:pa1', 'proativa:e1:pa2', 'tarefa:t1', 'tarefa:t2', 'tarefa:t3'].sort());
  });

  it('ordena da mais recente para a mais antiga e deixa "sem data" no fim', () => {
    assert.deepEqual(keys, ['resposta:i2', 'proativa:e1:pa1', 'tarefa:t1', 'resposta:i1', 'proativa:e1:pa2', 'resposta:i3', 'tarefa:t2', 'tarefa:t3']);
    assert.equal(rows[rows.length - 1].date, '');
    assert.equal(rows[rows.length - 1].title, 'Antiga sem nada');
  });

  it('respostas a intimações: tipo, peticionType, descrição, processo e link da peça', () => {
    const r = rows.find(x => x.key === 'resposta:i1');
    assert.equal(r.kind, 'resposta');
    assert.equal(r.kindLabel, ATUACAO_KINDS.resposta);
    assert.equal(r.title, 'Peticionamento · Manifestação — Pediu penhora');
    assert.equal(r.date, '2026-09-20');
    assert.equal(r.processNumber, '5001234-56.2023.4.04.7001');
    assert.equal(r.url, 'https://docs.google.com/document/d/abc');
    assert.equal(r.intimationId, 'i1');
    assert.equal(rows.find(x => x.key === 'resposta:i2').title, 'Ciência — Ciência da decisão do evento 52');
    assert.equal(rows.find(x => x.key === 'resposta:i3').title, 'Outra medida');
  });

  it('só aceita link http(s)/mailto na peça (javascript: e referências provisórias não viram link)', () => {
    assert.equal(rows.find(x => x.key === 'resposta:i3').url, '');
    const provisional = buildUltimasAtuacoes({ operationId: op, intimations: [{ id: 'z', operationId: op, responseAction: { type: 'peticionamento', peticionUrl: 'pendente upload', respondedAt: '2026-09-01T00:00:00.000Z' } }] });
    assert.equal(provisional[0].url, '');
    assert.equal(provisional[0].title, 'Peticionamento');
  });

  it('tarefas concluídas: completedAt, senão updatedAt, senão sem data', () => {
    assert.equal(rows.find(x => x.key === 'tarefa:t1').date, '2026-09-22');
    assert.equal(rows.find(x => x.key === 'tarefa:t1').url, 'https://drive.google.com/x');
    assert.equal(rows.find(x => x.key === 'tarefa:t2').date, '2026-07-10');
    assert.equal(rows.find(x => x.key === 'tarefa:t3').date, '');
    assert.equal(rows.find(x => x.key === 'tarefa:t1').kindLabel, ATUACAO_KINDS.tarefa);
  });

  it('atuações proativas: data própria, resumo, processo da execução, link e indicação de peça colada', () => {
    const r = rows.find(x => x.key === 'proativa:e1:pa1');
    assert.equal(r.kind, 'proativa');
    assert.equal(r.kindLabel, ATUACAO_KINDS.proativa);
    assert.equal(r.date, '2026-09-23');
    assert.equal(r.title, 'Requereu SISBAJUD');
    assert.equal(r.processNumber, '5001234-56.2023.4.04.7001');
    assert.equal(r.url, 'https://docs.google.com/document/d/zzz');
    assert.equal(r.hasText, true);
    assert.equal(r.executionId, 'e1');
    assert.equal(r.actionId, 'pa1');
    assert.equal(rows.find(x => x.key === 'proativa:e1:pa2').hasText, false);
  });

  it('no mesmo dia, a mais recente (pelo horário) vem antes', () => {
    const out = buildUltimasAtuacoes({
      operationId: op,
      intimations: [{ id: 'a', operationId: op, responseAction: { type: 'ciencia', respondedAt: '2026-09-20T08:00:00.000Z' } }],
      tasks: [{ id: 'b', operationId: op, status: 'concluida', title: 'B', completedAt: '2026-09-20T17:00:00.000Z' }],
    });
    assert.deepEqual(out.map(r => r.key), ['tarefa:b', 'resposta:a']);
  });

  it('entradas vazias ou ausentes não quebram', () => {
    assert.deepEqual(buildUltimasAtuacoes(), []);
    assert.deepEqual(buildUltimasAtuacoes({ operationId: op }), []);
    assert.deepEqual(buildUltimasAtuacoes({ operationId: op, intimations: [null], tasks: [undefined], executions: [{ operationId: op, proactiveActions: [null] }] }), []);
  });
});

describe('normalizePecaUrl — link da peça', () => {
  it('aceita http(s) e acrescenta https:// quando o usuário cola só o endereço', () => {
    assert.equal(normalizePecaUrl('https://docs.google.com/document/d/abc'), 'https://docs.google.com/document/d/abc');
    assert.equal(normalizePecaUrl(' http://exemplo.com.br/peca.pdf '), 'http://exemplo.com.br/peca.pdf');
    assert.equal(normalizePecaUrl('docs.google.com/document/d/abc'), 'https://docs.google.com/document/d/abc');
    assert.equal(normalizePecaUrl(''), '');
    assert.equal(normalizePecaUrl(null), '');
  });
  it('recusa esquemas perigosos e texto que não é endereço', () => {
    assert.equal(normalizePecaUrl('javascript:alert(1)'), '');
    assert.equal(normalizePecaUrl('data:text/html,<script>1</script>'), '');
    assert.equal(normalizePecaUrl('pendente upload'), '');
    assert.equal(normalizePecaUrl('ftp://x.com/a'), '');
  });
});

describe('planProactiveAction — registrar atuação proativa', () => {
  const NOW = '2026-10-01T15:00:00.000Z';
  const exec = { id: 'e1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal', notesList: ['Nota antiga'] };
  const fields = { date: '2026-09-30', summary: '  Requereu SISBAJUD  ', pecaText: 'Linha 1\r\nLinha 2  \n', pecaUrl: 'docs.google.com/document/d/zzz' };
  const ids = { action: 'act1', doc: 'doc1' };

  it('grava o registro dentro da execução, com a nota no card e o documento em Arquivos', () => {
    const plan = planProactiveAction({ exec, fields, ids, nowIso: NOW });
    assert.equal(plan.error, undefined);
    assert.deepEqual(plan.action, {
      id: 'act1', date: '2026-09-30', summary: 'Requereu SISBAJUD', pecaText: 'Linha 1\nLinha 2', pecaUrl: 'https://docs.google.com/document/d/zzz', createdAt: NOW,
    });
    assert.deepEqual(plan.execution.proactiveActions, [plan.action]);
    assert.deepEqual(plan.execution.notesList, ['Nota antiga', '[Atuação proativa · 30/09/2026] Requereu SISBAJUD Peça: https://docs.google.com/document/d/zzz']);
    assert.equal(plan.execution.id, 'e1');
    assert.deepEqual(plan.document, {
      id: 'doc1', operationId: 'op1', title: 'Atuação proativa — 5001234-56.2023.4.04.7001', type: 'Atuação proativa',
      url: 'https://docs.google.com/document/d/zzz', processNumber: '5001234-56.2023.4.04.7001', sourceActionType: 'proativa',
      description: 'Atuação proativa registrada. Requereu SISBAJUD.', actionDate: '2026-09-30', createdAt: NOW, updatedAt: NOW,
    });
    assert.equal('sourceIntimationId' in plan.document, false);
  });

  it('é aditivo: acrescenta às atuações anteriores e não altera a execução recebida', () => {
    const before = Object.freeze({ ...exec, notesList: Object.freeze([...exec.notesList]), proactiveActions: Object.freeze([{ id: 'old', date: '2026-08-01', summary: 'antiga' }]) });
    const plan = planProactiveAction({ exec: before, fields, ids, nowIso: NOW });
    assert.deepEqual(plan.execution.proactiveActions.map(a => a.id), ['old', 'act1']);
    assert.equal(before.proactiveActions.length, 1);
    assert.equal(before.notesList.length, 1);
  });

  it('sem link não cria documento; sem texto da peça guarda vazio', () => {
    const plan = planProactiveAction({ exec, fields: { summary: 'Só resumo', date: '2026-09-30' }, ids, nowIso: NOW });
    assert.equal(plan.document, null);
    assert.equal(plan.action.pecaText, '');
    assert.equal(plan.action.pecaUrl, '');
    assert.equal(plan.execution.notesList[1], '[Atuação proativa · 30/09/2026] Só resumo');
  });

  it('resumo é obrigatório e o link, se vier, precisa ser http(s)', () => {
    assert.match(planProactiveAction({ exec, fields: { summary: '   ' }, ids, nowIso: NOW }).error, /resumo/i);
    assert.match(planProactiveAction({ exec, fields: { summary: 'x', pecaUrl: 'javascript:alert(1)' }, ids, nowIso: NOW }).error, /http/i);
    assert.match(planProactiveAction({ exec: null, fields, ids, nowIso: NOW }).error, /Processo/);
  });

  it('data em branco assume o dia do registro', () => {
    assert.equal(planProactiveAction({ exec, fields: { summary: 'x', date: '' }, ids, nowIso: NOW }).action.date, '2026-10-01');
  });

  it('o registro aparece em "Últimas atuações" com data, resumo, link e texto da peça', () => {
    const plan = planProactiveAction({ exec, fields, ids, nowIso: NOW });
    const rows = buildUltimasAtuacoes({ operationId: 'op1', executions: [plan.execution] });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kind, 'proativa');
    assert.equal(rows[0].date, '2026-09-30');
    assert.equal(rows[0].title, 'Requereu SISBAJUD');
    assert.equal(rows[0].url, 'https://docs.google.com/document/d/zzz');
    assert.equal(rows[0].hasText, true);
  });
});

describe('teor da decisão da intimação', () => {
  it('intimationDecisionText apara e tolera vazio', () => {
    assert.equal(intimationDecisionText({ decisionSummary: '  Defere penhora  ' }), 'Defere penhora');
    assert.equal(intimationDecisionText({}), '');
    assert.equal(intimationDecisionText(null), '');
  });
  it('ciência: a descrição vira o teor só se a intimação não tem um', () => {
    assert.equal(decisionSummaryFromAction({}, { type: 'ciencia', description: ' Indefere ' }), 'Indefere');
    assert.equal(decisionSummaryFromAction({ decisionSummary: 'Já tinha' }, { type: 'ciencia', description: 'Outro' }), undefined);
  });
  it('peticionamento/outra: grava só se alterado', () => {
    assert.equal(decisionSummaryFromAction({ decisionSummary: 'A' }, { type: 'peticionamento', decisionSummary: 'A' }), undefined);
    assert.equal(decisionSummaryFromAction({ decisionSummary: 'A' }, { type: 'outra', decisionSummary: 'B' }), 'B');
    assert.equal(decisionSummaryFromAction({}, { type: 'outra' }), undefined);
  });
});
