/**
 * Últimas atuações da operação (Briefing do Nexus Prumo) — funções puras, sem DOM nem React.
 *
 * Junta, numa lista só e da mais recente para a mais antiga, o que foi feito na operação:
 *  - respostas a intimações (`intimation.responseAction`, com `respondedAt`);
 *  - tarefas concluídas (`task.completedAt`; nas antigas, sem essa data, `updatedAt`; sem nenhuma das
 *    duas, a tarefa vai para o fim da lista como "sem data");
 *  - atuações proativas (`execution.proactiveActions[]`, registradas na ficha do processo).
 */
import { toDayKey } from './dates.js';
import { safeUrl } from './report.js';
import { appendAtuacaoNoteToExecution, buildProactiveProcessNote } from './processes.js';

export const ATUACAO_KINDS = {
  resposta: 'Resposta à intimação',
  tarefa: 'Tarefa concluída',
  proativa: 'Atuação proativa',
};

/**
 * Mantém `task.completedAt` coerente com `task.status` — usada por todo salvamento de tarefa
 * (upsert do app): vale para os botões de concluir/reabrir do Clássico e do Prumo, o quadro, a Mesa
 * e a troca de situação no formulário.
 *  - passou a 'concluida': grava `nowIso`;
 *  - continua 'concluida': preserva a data já registrada (ou, nas antigas, a melhor estimativa: o
 *    `updatedAt` anterior) para uma simples edição não "refazer" a conclusão;
 *  - qualquer outra situação (reaberta, em andamento, cancelada): remove `completedAt`.
 * Não muda nenhum outro campo e não altera o objeto recebido.
 */
export function applyTaskCompletion(prev, next, nowIso) {
  if (!next) return next;
  const wasDone = !!prev && prev.status === 'concluida';
  if (next.status === 'concluida') {
    if (!wasDone) return { ...next, completedAt: nowIso };
    const keep = next.completedAt || prev.completedAt || prev.updatedAt || '';
    return keep && keep !== next.completedAt ? { ...next, completedAt: keep } : next;
  }
  if (next.completedAt || (prev && prev.completedAt)) return { ...next, completedAt: undefined };
  return next;
}

function responseTypeLabel(ra) {
  if (ra.type === 'peticionamento') return ra.peticionType ? `Peticionamento · ${ra.peticionType}` : 'Peticionamento';
  if (ra.type === 'ciencia') return 'Ciência';
  return 'Outra medida';
}

const str = (v) => String(v == null ? '' : v).trim();

/**
 * Lista as últimas atuações de uma operação, da mais recente para a mais antiga (sem data, no fim).
 * Cada linha: { key, kind, kindLabel, date ('AAAA-MM-DD' ou ''), title, processNumber, url,
 *   intimationId | taskId | executionId+actionId, hasText }.
 */
export function buildUltimasAtuacoes({ operationId, intimations, tasks, executions } = {}) {
  const rows = [];

  (intimations || []).forEach((x) => {
    if (!x || x.operationId !== operationId || !x.responseAction) return;
    const ra = x.responseAction;
    const at = str(ra.respondedAt);
    const desc = str(ra.description);
    rows.push({
      key: 'resposta:' + x.id,
      kind: 'resposta',
      kindLabel: ATUACAO_KINDS.resposta,
      date: toDayKey(at),
      ts: at,
      title: [responseTypeLabel(ra), desc].filter(Boolean).join(' — '),
      processNumber: str(x.processNumber),
      url: safeUrl(ra.type === 'peticionamento' ? ra.peticionUrl : ra.docUrl),
      intimationId: x.id,
    });
  });

  (tasks || []).forEach((t) => {
    if (!t || t.operationId !== operationId || t.status !== 'concluida') return;
    const at = str(t.completedAt) || str(t.updatedAt);
    rows.push({
      key: 'tarefa:' + t.id,
      kind: 'tarefa',
      kindLabel: ATUACAO_KINDS.tarefa,
      date: toDayKey(at),
      ts: at,
      title: str(t.title) || str(t.description) || 'Tarefa',
      processNumber: str(t.processNumber),
      url: safeUrl(t.docUrl),
      taskId: t.id,
    });
  });

  (executions || []).forEach((e) => {
    if (!e || e.operationId !== operationId || !Array.isArray(e.proactiveActions)) return;
    e.proactiveActions.forEach((a) => {
      if (!a) return;
      const created = str(a.createdAt);
      rows.push({
        key: 'proativa:' + e.id + ':' + a.id,
        kind: 'proativa',
        kindLabel: ATUACAO_KINDS.proativa,
        date: toDayKey(a.date) || toDayKey(created),
        ts: created || str(a.date),
        title: str(a.summary) || 'Atuação proativa',
        processNumber: str(e.processNumber),
        url: safeUrl(a.pecaUrl),
        executionId: e.id,
        actionId: a.id,
        hasText: !!str(a.pecaText),
      });
    });
  });

  return rows.sort((a, b) => {
    if (!a.date !== !b.date) return a.date ? -1 : 1;
    return (b.date || '').localeCompare(a.date || '') || (b.ts || '').localeCompare(a.ts || '') || a.key.localeCompare(b.key);
  });
}

/**
 * Link da peça digitado pelo usuário → URL http(s) segura. Aceita "docs.google.com/…" (sem esquema,
 * ganha https://); qualquer outra coisa que não seja http(s) vira '' (inválido).
 */
export function normalizePecaUrl(value) {
  const s = str(value);
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return safeUrl(s);
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|\?|#|$)/i.test(s)) return safeUrl('https://' + s);
  return '';
}

/**
 * Atuação proativa (registrada na ficha do processo, sem intimação) — mesmas consequências de
 * responder uma intimação (handleRespondIntim):
 *  - nota no card do processo ("Atuação proativa");
 *  - registro guardado na própria execução (`execution.proactiveActions[]`), de onde sai o card
 *    "Últimas atuações" e o relatório de prestação de contas — vai junto com o upsert/sync da
 *    execução, sem coleção nova;
 *  - com link da peça, um documento na operação (aba Arquivos), `sourceActionType: 'proativa'`.
 * Devolve { execution, document|null, action } ou { error } (resumo obrigatório; link, se
 * informado, precisa ser http(s)). Não altera o objeto recebido.
 */
export function planProactiveAction({ exec, fields, ids, nowIso } = {}) {
  if (!exec) return { error: 'Processo não encontrado.' };
  const f = fields || {};
  const summary = str(f.summary);
  if (!summary) return { error: 'Informe o resumo da atuação.' };
  const rawUrl = str(f.pecaUrl);
  const pecaUrl = normalizePecaUrl(rawUrl);
  if (rawUrl && !pecaUrl) return { error: 'O link da peça precisa começar com http:// ou https://.' };
  const nowDay = toDayKey(nowIso);
  const action = {
    id: (ids && ids.action) || 'pa-' + nowIso,
    date: toDayKey(f.date) || nowDay,
    summary,
    pecaText: String(f.pecaText == null ? '' : f.pecaText).replace(/\r\n?/g, '\n').trim(),
    pecaUrl,
    createdAt: nowIso,
  };
  const execution = {
    ...appendAtuacaoNoteToExecution(exec, buildProactiveProcessNote(action)),
    proactiveActions: [...(Array.isArray(exec.proactiveActions) ? exec.proactiveActions : []), action],
  };
  let document = null;
  if (pecaUrl && exec.operationId) {
    document = {
      id: (ids && ids.doc) || 'doc-' + action.id,
      operationId: exec.operationId,
      title: 'Atuação proativa' + (exec.processNumber ? ' — ' + exec.processNumber : ''),
      type: 'Atuação proativa',
      url: pecaUrl,
      processNumber: exec.processNumber || '',
      sourceActionType: 'proativa',
      description: 'Atuação proativa registrada. ' + summary + (/[.!?]$/.test(summary) ? '' : '.'),
      actionDate: action.date,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }
  return { execution, document, action };
}

/** Teor da decisão da intimação (`decisionSummary`, 1–2 linhas, opcional): texto aparado ou ''. Usado pela Base do relatório. */
export function intimationDecisionText(intim) {
  return intim && intim.decisionSummary != null ? String(intim.decisionSummary).trim() : '';
}

/**
 * Teor a gravar na intimação ao registrar a atuação, ou `undefined` (nada a mudar).
 *  - ciência: a descrição do ato vira o teor se a intimação ainda não tem um;
 *  - peticionamento/outra: o campo opcional "Teor da decisão" (`action.decisionSummary`), se alterado.
 */
export function decisionSummaryFromAction(intim, action) {
  const cur = intimationDecisionText(intim);
  if (!action) return undefined;
  if (action.type === 'ciencia') {
    const d = String(action.description == null ? '' : action.description).trim();
    return !cur && d ? d : undefined;
  }
  if (action.decisionSummary == null) return undefined;
  const v = String(action.decisionSummary).trim();
  return v !== cur ? v : undefined;
}
