/**
 * Agenda unificada (Nexus Prumo) e "Próximos 15 dias" do Relatório — mesma lógica.
 * Função pura: recebe os dados brutos e devolve os itens agrupados por dia.
 * Quem chama (edição Prumo, ou o montador do Relatório) injeta os pequenos
 * helpers que dependem do app (rótulo de audiência, nome da parte, filtro de
 * urgência etc.) para este módulo continuar sem depender de `window`/React.
 */
import { toDayKey } from './dates.js';

export const AGENDA_KIND_RANK = { aud: 0, prazo: 1, tarefa: 2, presc: 3 };

/**
 * Junta, por dia, audiências, prazos de intimação, tarefas com data limite e
 * termos de prescrição (grupos 1 a 4).
 *
 * @param {object} data - { hearings, intimations, tasks }
 * @param {object} prazosRadar - { rows: [...] }
 * @param {string} fromIso
 * @param {string} toIso
 * @param {string} opF - 'all' | 'none' | id da operação
 * @param {object} [helpers]
 * @param {(hearingType:string)=>string} [helpers.hearingLabel]
 * @param {(intim:object)=>string} [helpers.partyName]
 * @param {(intim:object)=>boolean} [helpers.intimOnAgenda] - se a intimação entra na agenda (prazo aberto)
 * @param {(intim:object)=>boolean} [helpers.isUrgentIntim]
 * @param {(task:object)=>boolean} [helpers.taskOpen]
 * @param {(text:string)=>string} [helpers.safeText] - normaliza texto (ex.: sem jargão da Beta)
 * @returns {Record<string, Array<object>>}
 */
export function buildAgendaByDay(data, prazosRadar, fromIso, toIso, opF, helpers) {
  const {
    hearingLabel = () => 'Audiência',
    partyName = (x) => (x && x.processNumber) || '—',
    intimOnAgenda = (x) => !!(x && x.dateDeadline),
    isUrgentIntim = () => false,
    taskOpen = (t) => t.status !== 'concluida' && t.status !== 'cancelada',
    safeText = (s) => s,
  } = helpers || {};

  const by = {};
  const put = (iso, it) => {
    const k = toDayKey(iso);
    if (!k || k < fromIso || k > toIso) return;
    (by[k] || (by[k] = [])).push(it);
  };
  const okOp = (id) => opF === 'all' || (opF === 'none' ? !id : id === opF);

  (data.hearings || []).forEach(h => {
    if (!h.date || h.status === 'cancelada' || h.status === 'realizada' || !okOp(h.operationId)) return;
    put(h.date, { id: 'h' + h.id, kind: 'aud', time: h.time || '', title: hearingLabel(h.hearingType), sub: h.parties || h.processNumber || '', op: h.operationId, ref: h });
  });
  (data.intimations || []).forEach(x => {
    if (!intimOnAgenda(x) || !okOp(x.operationId)) return;
    put(x.dateDeadline, { id: 'i' + x.id, kind: 'prazo', title: partyName(x), sub: x.eventDescription || x.className || '', op: x.operationId, urgent: isUrgentIntim(x), ref: x });
  });
  (data.tasks || []).forEach(t => {
    if (!t.dueDate || !taskOpen(t) || !okOp(t.operationId)) return;
    put(t.dueDate, { id: 't' + t.id, kind: 'tarefa', title: t.title || 'Tarefa', sub: t.description || '', op: t.operationId, urgent: t.priority === 'urgente', ref: t });
  });
  ((prazosRadar && prazosRadar.rows) || []).forEach(r => {
    if (!r.keyDate || r.group > 4 || r.silenceReason || !okOp(r.operationId)) return;
    put(r.keyDate, { id: 'p' + r.id, kind: 'presc', title: 'CDA ' + (r.cdaNumber || 'S/N'), sub: safeText(r.why || r.summary || ''), op: r.operationId, urgent: r.group === 1, ref: r });
  });

  Object.keys(by).forEach(k => by[k].sort((a, b) =>
    AGENDA_KIND_RANK[a.kind] - AGENDA_KIND_RANK[b.kind]
    || String(a.time || '').localeCompare(String(b.time || ''))
    || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)
  ));
  return by;
}
