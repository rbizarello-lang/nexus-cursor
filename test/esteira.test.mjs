import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTEIRA_DEFAULT_TEMPLATE,
  esteiraSanitizeTemplate,
  esteiraTemplateAddStep,
  esteiraTemplateRemoveStep,
  esteiraTemplateUpdateStep,
  esteiraTemplateMoveStep,
  esteiraCreate,
  esteiraBegin,
  esteiraStartStep,
  esteiraCompleteStep,
  esteiraUndoStep,
  esteiraSetNote,
  esteiraSetLink,
  esteiraHasStarted,
  esteiraSummary,
  esteiraProgress,
  esteiraResumeInfo,
  esteiraGroupLabel,
  esteiraStoppedLabel,
} from '../src/lib/esteira.js';

describe('Esteira — template (⚙)', () => {
  it('template padrão tem 4 etapas com ferramenta', () => {
    assert.equal(ESTEIRA_DEFAULT_TEMPLATE.length, 4);
    assert.equal(ESTEIRA_DEFAULT_TEMPLATE[0].label, 'Anonimização');
    assert.equal(ESTEIRA_DEFAULT_TEMPLATE[2].tool, 'Claude');
  });

  it('adiciona, remove, atualiza e reordena etapas do template', () => {
    let t = esteiraSanitizeTemplate(ESTEIRA_DEFAULT_TEMPLATE);
    t = esteiraTemplateAddStep(t);
    assert.equal(t.length, 5);
    const newId = t[4].id;
    t = esteiraTemplateUpdateStep(t, newId, { label: 'Revisão final', tool: 'Claude' });
    assert.equal(t[4].label, 'Revisão final');
    t = esteiraTemplateMoveStep(t, newId, -1);
    assert.equal(t[3].id, newId);
    t = esteiraTemplateRemoveStep(t, newId);
    assert.equal(t.length, 4);
    assert.ok(!t.some(s => s.id === newId));
  });

  it('mover a primeira etapa para cima ou a última para baixo não faz nada', () => {
    const t = esteiraSanitizeTemplate(ESTEIRA_DEFAULT_TEMPLATE);
    const up = esteiraTemplateMoveStep(t, t[0].id, -1);
    assert.deepEqual(up.map(s => s.id), t.map(s => s.id));
    const down = esteiraTemplateMoveStep(t, t[t.length - 1].id, 1);
    assert.deepEqual(down.map(s => s.id), t.map(s => s.id));
  });
});

describe('Esteira — registro (intimação/tarefa)', () => {
  it('Começar copia o template e já inicia a 1ª etapa', () => {
    const est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-24T10:00:00.000Z');
    assert.equal(est.etapas.length, 4);
    assert.equal(est.etapas[0].status, 'doing');
    assert.equal(est.etapas[0].startedAt, '2026-09-24T10:00:00.000Z');
    assert.equal(est.etapas[1].status, 'todo');
    assert.equal(esteiraHasStarted(est), true);
  });

  it('mudanças futuras no template não afetam esteira já iniciada (cópia)', () => {
    const template = esteiraSanitizeTemplate(ESTEIRA_DEFAULT_TEMPLATE);
    const est = esteiraCreate(template, '2026-09-20T00:00:00.000Z');
    // Renomeia o template DEPOIS de criar a peça
    esteiraTemplateUpdateStep(template, template[0].id, { label: 'Novo nome' });
    assert.equal(est.etapas[0].label, 'Anonimização');
  });

  it('concluir uma etapa passa a próxima para em andamento', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraCompleteStep(est, 0, '2026-09-21T09:00:00.000Z');
    assert.equal(est.etapas[0].status, 'done');
    assert.equal(est.etapas[0].doneAt, '2026-09-21T09:00:00.000Z');
    assert.equal(est.etapas[1].status, 'doing');
    assert.equal(est.etapas[1].startedAt, '2026-09-21T09:00:00.000Z');
  });

  it('desfazer uma etapa feita volta para em andamento e reverte a auto-iniciada', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraCompleteStep(est, 0, '2026-09-21T09:00:00.000Z');
    est = esteiraUndoStep(est, 0, '2026-09-21T10:00:00.000Z');
    assert.equal(est.etapas[0].status, 'doing');
    assert.equal(est.etapas[0].doneAt, null);
    assert.equal(est.etapas[1].status, 'todo');
    assert.equal(est.etapas[1].startedAt, null);
  });

  it('desfazer não reverte a próxima se ela já foi tocada (nota ou link)', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraCompleteStep(est, 0, '2026-09-21T09:00:00.000Z');
    est = esteiraSetNote(est, 1, 'já escrevi algo aqui', '2026-09-21T09:30:00.000Z');
    est = esteiraUndoStep(est, 0, '2026-09-21T10:00:00.000Z');
    assert.equal(est.etapas[1].status, 'doing');
    assert.equal(est.etapas[1].note, 'já escrevi algo aqui');
  });

  it('desfazer uma etapa em andamento volta para a fazer', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraUndoStep(est, 0, '2026-09-20T11:00:00.000Z');
    assert.equal(est.etapas[0].status, 'todo');
    assert.equal(est.etapas[0].startedAt, null);
  });

  it('nota e link ficam por etapa e atualizam updatedAt', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraSetNote(est, 0, 'onde parei: falta X', '2026-09-20T12:00:00.000Z');
    est = esteiraSetLink(est, 0, 'https://claude.ai/chat/abc', '2026-09-20T12:05:00.000Z');
    assert.equal(est.etapas[0].note, 'onde parei: falta X');
    assert.equal(est.etapas[0].url, 'https://claude.ai/chat/abc');
    assert.equal(est.updatedAt, '2026-09-20T12:05:00.000Z');
  });

  it('concluir a última etapa fecha a esteira (isComplete)', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    for (let i = 0; i < 4; i++) est = esteiraCompleteStep(est, i, '2026-09-2' + (i + 1) + 'T10:00:00.000Z');
    const s = esteiraSummary(est);
    assert.equal(s.isComplete, true);
    assert.equal(s.doneCount, 4);
    assert.equal(esteiraResumeInfo(est), null);
    assert.equal(esteiraGroupLabel(est), 'Esteira concluída');
  });

  it('esteiraProgress devolve o status de cada etapa, na ordem', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraCompleteStep(est, 0, '2026-09-21T10:00:00.000Z');
    assert.deepEqual(esteiraProgress(est), ['done', 'doing', 'todo', 'todo']);
  });

  it('registro sem esteira: hasStarted falso, resumo/grupo neutros', () => {
    assert.equal(esteiraHasStarted(null), false);
    assert.equal(esteiraHasStarted(undefined), false);
    assert.equal(esteiraResumeInfo(null), null);
    assert.equal(esteiraGroupLabel(null), 'Sem esteira');
  });

  it('esteiraResumeInfo aponta a etapa em andamento e o total', () => {
    let est = esteiraBegin(ESTEIRA_DEFAULT_TEMPLATE, '2026-09-20T10:00:00.000Z');
    est = esteiraCompleteStep(est, 0, '2026-09-21T10:00:00.000Z');
    const info = esteiraResumeInfo(est);
    assert.equal(info.index, 1);
    assert.equal(info.total, 4);
    assert.equal(info.etapa.label, 'Extração do relatório e triagem');
  });
});

describe('Esteira — "parou ontem / há N dias / hoje HH:MM"', () => {
  const now = '2026-09-25T14:30:00.000Z';
  it('mesmo dia mostra "hoje HH:MM"', () => {
    assert.equal(esteiraStoppedLabel('2026-09-25T09:05:00.000Z', { now }), 'hoje 09:05');
  });
  it('um dia antes mostra "ontem"', () => {
    assert.equal(esteiraStoppedLabel('2026-09-24T18:40:00.000Z', { now }), 'ontem');
  });
  it('vários dias antes mostra "há N dias"', () => {
    assert.equal(esteiraStoppedLabel('2026-09-22T18:40:00.000Z', { now }), 'há 3 dias');
  });
  it('withTime acrescenta a hora mesmo quando não é hoje', () => {
    assert.equal(esteiraStoppedLabel('2026-09-24T18:40:00.000Z', { now, withTime: true }), 'ontem, 18:40');
  });
  it('sem data devolve string vazia', () => {
    assert.equal(esteiraStoppedLabel('', { now }), '');
    assert.equal(esteiraStoppedLabel(null, { now }), '');
  });
});
