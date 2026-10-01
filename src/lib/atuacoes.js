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
