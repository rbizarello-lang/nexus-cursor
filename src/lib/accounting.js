/**
 * Prestação de contas e histórico de alterações (Nexus) — funções puras, sem DOM nem React.
 *
 *  - collectOperationEvents: junta, num período, o que foi feito na operação (Prestação de contas);
 *  - buildChangeLogEntries: monta as entradas do histórico de alterações (changeLog) de um save.
 */
import { toDayKey, fmtDate } from './dates.js';

const _acShort = (s, n) => { const t = String(s == null ? '' : s); return t.length > n ? t.slice(0, n) + '…' : t; };

/**
 * Eventos da prestação de contas de uma operação.
 * @param input  dados já filtrados da operação + `deps` (helpers/constantes que só existem no app):
 *   { op, opDebts, opExecs, opAssets, opIntimsAll, opDocuments, opHearings, opReminders, opChangeLog,
 *     briefing, prescriptionEvents,
 *     deps: { getStageRecords, resolveStageDef, isEfStylePanoramaCard, PROCESS_STAGES, CENTRAL_STAGES,
 *             getBriefingEntries, BRIEFING_ENTRY_TYPES, CX_HEARING, ASSET_STATUSES, EXEC_STATUSES, DEBT_STATUSES } }
 * @param period { fromIso, toIso } — dias (YYYY-MM-DD) já resolvidos, inclusivos.
 */
export function collectOperationEvents(input, period) {
  const {
    op = {}, opDebts = [], opExecs = [], opAssets = [], opIntimsAll = [], opDocuments = [], opHearings = [],
    opReminders = [], opChangeLog = [], briefing = {}, prescriptionEvents = [], deps = {},
  } = input || {};
  const {
    getStageRecords, resolveStageDef, isEfStylePanoramaCard, PROCESS_STAGES = {}, CENTRAL_STAGES = {},
    getBriefingEntries, BRIEFING_ENTRY_TYPES = {}, CX_HEARING = {}, ASSET_STATUSES = {}, EXEC_STATUSES = {}, DEBT_STATUSES = {},
  } = deps;
  const opId = op.id;
  const fromIso = period.fromIso;
  const toIso = period.toIso;
  const inPeriod = (iso) => { const k = toDayKey(iso); return !!k && k >= fromIso && k <= toIso; };
  const events = [];

  opIntimsAll.forEach(x => {
    const respAt = x.responseAction && x.responseAction.respondedAt;
    const d = respAt ? toDayKey(respAt) : '';
    if (!d || !inPeriod(d)) return;
    const a = x.responseAction || {};
    const typeLabel = a.type === 'peticionamento' ? (a.peticionType || 'Manifestação') : a.type === 'ciencia' ? 'Ciência' : 'Atuação';
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Intimação', text: `${typeLabel}${a.description ? ' — ' + a.description : ''}`, mono: x.processNumber || '' });
  });
  // Atuações proativas (execution.proactiveActions): entram como as respostas a intimações — só o resumo (o texto da peça não vai).
  opExecs.forEach(ex => (Array.isArray(ex.proactiveActions) ? ex.proactiveActions : []).forEach(a => {
    const d = a && (toDayKey(a.date) || toDayKey(a.createdAt));
    if (!d || !inPeriod(d)) return;
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Atuação', text: `Atuação proativa${a.summary ? ' — ' + a.summary : ''}`, mono: ex.processNumber || '' });
  }));
  opDocuments.forEach(doc => {
    // Documento criado ao responder intimação ou ao registrar atuação proativa já aparece como "Intimação"/"Atuação".
    if (doc.sourceIntimationId || doc.sourceActionType === 'proativa') return;
    const d = doc.createdAt ? toDayKey(doc.createdAt) : '';
    if (!d || !inPeriod(d)) return;
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Peça', text: doc.title || doc.type || 'Documento', mono: doc.processNumber || '' });
  });
  opExecs.forEach(ex => {
    const recs = getStageRecords(briefing, ex.id);
    Object.keys(recs).forEach(k => {
      const rec = recs[k];
      if (!rec || !rec.date) return;
      const d = toDayKey(rec.date);
      if (!d || !inPeriod(d)) return;
      const STG = isEfStylePanoramaCard(ex) ? CENTRAL_STAGES : PROCESS_STAGES;
      const sd = resolveStageDef(STG, k, rec);
      const isFree = !STG[k];
      events.push({ date: d, dateLabel: fmtDate(d), kind: 'Fase', text: `${isFree ? 'Evento livre: ' : ''}${sd.label}${rec.texto ? ' — ' + rec.texto : ''}`, mono: ex.processNumber || '' });
    });
  });
  // Eventos de prescrição: pertencem à operação pelo operationId OU pela CDA (cdaId/batchCdaIds) OU pelo processo (executionId).
  // Os criados por importação não trazem operationId.
  const debtById = new Map(opDebts.map(x => [x.id, x]));
  const execById = new Map(opExecs.map(x => [x.id, x]));
  prescriptionEvents.forEach(pe => {
    if (!pe) return;
    const batch = Array.isArray(pe.batchCdaIds) ? pe.batchCdaIds.filter(Boolean) : [];
    const belongs = pe.operationId === opId
      || (pe.cdaId && debtById.has(pe.cdaId))
      || batch.some(id => debtById.has(id))
      || (pe.executionId && execById.has(pe.executionId));
    if (!belongs) return;
    const d = pe.date ? toDayKey(pe.date) : '';
    if (!d || !inPeriod(d)) return;
    let where = '';
    const debt = pe.cdaId ? debtById.get(pe.cdaId) : null;
    if (debt) where = ' · CDA ' + (debt.cdaNumber || debt.id);
    else if (batch.length > 1) where = ` · ${batch.length} CDAs`;
    else if (batch.length === 1 && debtById.has(batch[0])) { const b = debtById.get(batch[0]); where = ' · CDA ' + (b.cdaNumber || b.id); }
    else if (pe.executionId && execById.has(pe.executionId)) { const ex = execById.get(pe.executionId); where = ' · Proc. ' + (ex.processNumber || ex.id); }
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Prescrição', text: `Evento lançado: ${pe.type || 'evento'}${where}` });
  });
  opDebts.forEach(dbt => {
    if (!dbt.prescriptionHandledAt) return;
    const d = toDayKey(dbt.prescriptionHandledAt);
    if (!d || !inPeriod(d)) return;
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Prescrição', text: `Prescrição tratada — CDA ${dbt.cdaNumber || dbt.id}` });
  });
  getBriefingEntries(briefing).forEach(en => {
    const d = en.eventDate ? toDayKey(en.eventDate) : (en.createdAt ? toDayKey(en.createdAt) : '');
    if (!d || !inPeriod(d)) return;
    const t = BRIEFING_ENTRY_TYPES[en.type] || BRIEFING_ENTRY_TYPES.observacao || { label: '' };
    const plain = String(en.html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Diário', text: `${t.label}: ${_acShort(plain, 140)}` });
  });
  opReminders.forEach(rm => {
    const d = toDayKey(rm.createdAt || rm.updatedAt);
    if (!d || !inPeriod(d)) return;
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Lembrete', text: _acShort(rm.content || '', 140) });
  });
  opHearings.forEach(h => {
    if (h.status !== 'realizada') return;
    const d = h.date ? toDayKey(h.date) : '';
    if (!d || !inPeriod(d)) return;
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Audiência', text: `Realizada — ${CX_HEARING[h.hearingType] || 'Audiência'}${h.parties ? ': ' + h.parties : ''}`, mono: h.processNumber || '' });
  });
  opChangeLog.forEach(le => {
    const d = le.date ? toDayKey(le.date) : '';
    if (!d || !inPeriod(d)) return;
    if (le.col === 'tasks' && le.field === 'status' && le.to === 'concluida') {
      events.push({ date: d, dateLabel: fmtDate(d), kind: 'Tarefa', text: `Concluída: ${le.ref || ''}` });
    } else if (le.col === 'assets' && le.field === 'status') {
      const toLabel = (ASSET_STATUSES[le.to] || {}).label || le.to;
      events.push({ date: d, dateLabel: fmtDate(d), kind: 'Constrição', text: `${le.ref || 'Bem'} → ${toLabel}` });
    } else if ((le.col === 'executions' || le.col === 'debts') && le.field === 'status') {
      const map = le.col === 'executions' ? EXEC_STATUSES : DEBT_STATUSES;
      const toLabel = (map[le.to] || {}).label || le.to;
      events.push({ date: d, dateLabel: fmtDate(d), kind: le.col === 'executions' ? 'Fase' : 'Prescrição', text: `${le.ref || ''} → ${toLabel}` });
    }
  });
  // Bem já cadastrado em situação de constrição não passa pelo changeLog (criação não é auditada): conta na data da constrição informada (constrictionDate) ou, sem ela, na do cadastro.
  const assetsWithStatusLog = new Set(opChangeLog.filter(le => le.col === 'assets' && le.field === 'status').map(le => le.entityId));
  opAssets.forEach(a => {
    if (!a || !String(a.status || '').startsWith('indisponibilidade_')) return;
    if (assetsWithStatusLog.has(a.id)) return;
    const d = toDayKey(a.constrictionDate) || (a.createdAt ? toDayKey(a.createdAt) : '');
    if (!d || !inPeriod(d)) return;
    const label = (ASSET_STATUSES[a.status] || {}).label || a.status;
    events.push({ date: d, dateLabel: fmtDate(d), kind: 'Constrição', text: `Bem cadastrado como ${label}${a.description ? ' — ' + _acShort(a.description, 60) : ''}` });
  });
  return events;
}

/** Linha do card do bem: "Indisponível desde dd/mm/aaaa" (ativa) ou "Requerida em dd/mm/aaaa"; sem data ou fora dessas situações, ''. */
export function assetConstrictionLine(a) {
  const d = a ? toDayKey(a.constrictionDate) : '';
  if (!d) return '';
  if (a.status === 'indisponibilidade_ativa') return 'Indisponível desde ' + fmtDate(d);
  if (a.status === 'indisponibilidade_requerida') return 'Requerida em ' + fmtDate(d);
  return '';
}

/** Texto legível de um valor do histórico: `responseAction` vira "Peticionamento (Tipo)"; outros objetos, JSON curto. */
export function formatChangeLogValue(field, v) {
  if (v === undefined || v === null || v === '') return '';
  if (Array.isArray(v)) return v.join(',');
  if (typeof v === 'object') {
    if (field === 'responseAction') {
      const t = v.type;
      if (t === 'peticionamento') return v.peticionType ? `Peticionamento (${v.peticionType})` : 'Peticionamento';
      if (t === 'ciencia') return 'Ciência';
      if (t === 'outra') return 'Outra medida';
      return t ? String(t) : '(vazio)';
    }
    try {
      const s = JSON.stringify(v);
      return s && s.length > 80 ? s.slice(0, 80) + '…' : (s || '');
    } catch (e) { return ''; }
  }
  return String(v);
}

/**
 * Entradas do histórico de alterações para um save (só edições, só campos auditáveis presentes em `entity`).
 * `refFn(col, entidadeMesclada)` devolve o rótulo; `uid()` o id; `source` (ex. 'importacao') é gravado quando informado.
 */
export function buildChangeLogEntries({ col, before, entity, now, source, auditFields, refFn, uid }) {
  const out = [];
  if (!before || !entity || !Array.isArray(auditFields)) return out;
  auditFields.forEach(f => {
    if (!(f in entity)) return; // campo não tocado neste save
    const a = formatChangeLogValue(f, before[f]);
    const b = formatChangeLogValue(f, entity[f]);
    if (a === b) return;
    const entry = {
      id: uid(), date: now, col, entityId: entity.id,
      ref: refFn(col, { ...before, ...entity }),
      operationId: entity.operationId || before.operationId || '',
      field: f, from: a || '(vazio)', to: b || '(vazio)',
    };
    if (source) entry.source = source;
    out.push(entry);
  });
  return out;
}
