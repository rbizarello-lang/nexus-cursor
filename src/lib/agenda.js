/**
 * Agenda unificada (Nexus Prumo) e "Próximos 15 dias" do Relatório — mesma lógica.
 * Função pura: recebe os dados brutos e devolve os itens agrupados por dia.
 * Quem chama (edição Prumo, ou o montador do Relatório) injeta os pequenos
 * helpers que dependem do app (rótulo de audiência, nome da parte, filtro de
 * urgência etc.) para este módulo continuar sem depender de `window`/React.
 */
import { toDayKey } from './dates.js';
import { mesaAgendaPoint, mesaCardName } from './prazos-mesa.js';

export const AGENDA_KIND_RANK = { aud: 0, prazo: 1, tarefa: 2, presc: 3 };

/**
 * Junta, por dia, audiências, prazos de intimação, tarefas com data limite e
 * termos de prescrição pelos cartões da Mesa de prazos (mesaAgendaPoint): CDAs com data de prazo, fora Tratadas, Adiadas,
 * Consumadas antigas e o Ajuizar de 60 a 180 dias. A prescrição é «urgente» quando a CDA está na fileira 1 (a agir).
 *
 * @param {object} data - { hearings, intimations, tasks }
 * @param {object} mesaCards - saída de buildMesaCards ({ items: [...] })
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
export function buildAgendaByDay(data, mesaCards, fromIso, toIso, opF, helpers) {
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
  ((mesaCards && mesaCards.items) || []).forEach(it => {
    const pt = mesaAgendaPoint(it);
    if (!pt || !okOp(it.debt.operationId)) return;
    const r = it.row;
    put(pt.d, {
      id: 'p' + it.debtId, kind: 'presc', title: 'CDA ' + (it.debt.cdaNumber || 'S/N'), sub: safeText((r && (r.why || r.summary)) || '') || mesaCardName(it.card),
      op: it.debt.operationId, urgent: pt.urgent, card: it.card,
      ref: r || { id: it.debtId, operationId: it.debt.operationId, cdaNumber: it.debt.cdaNumber }
    });
  });

  Object.keys(by).forEach(k => by[k].sort((a, b) =>
    AGENDA_KIND_RANK[a.kind] - AGENDA_KIND_RANK[b.kind]
    || String(a.time || '').localeCompare(String(b.time || ''))
    || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)
  ));
  return by;
}
