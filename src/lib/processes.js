/**
 * Integridade do cadastro de processos.
 *
 * Funções puras: não dependem de React nem de APIs do navegador. Isso permite
 * testar a consolidação antes de ligá-la à interface e ao save em nuvem.
 */

export const EXECUTION_MERGE_FIELDS = [
  'processNumber',
  'className',
  'court',
  'status',
  'processTag',
  'protocolDate',
  'prescriptionForecast',
  'parentExecutionId',
  'apensadoEm',
  'hasGuarantee',
  'prescriptionInterrupted',
  'analyticsRegistered',
  'digraTracked',
  'isRelevant',
];

export function normalizeExecutionProcessNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

const normalizeSpeciesText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Família da espécie/classe processual.
 * O mesmo número CNJ em graus diferentes (ex.: procedimento comum + apelação) não é duplicidade.
 */
export function processSpeciesKey(execution) {
  const cn = normalizeSpeciesText(execution?.className);
  if (!cn) return '_sem_especie';
  if (/^execucao\s+fiscal\b/.test(cn)) return 'execucao_fiscal';
  if (/agravo\s+de\s+instrumento|agravo\s+instrument/.test(cn)) return 'agravo_instrumento';
  if (/agravo\s+interno|agravo\s+regimental/.test(cn)) return 'agravo_interno';
  if (/apelacao/.test(cn)) return 'apelacao';
  if (/recurso\s+inominado/.test(cn)) return 'recurso_inominado';
  if (/recurso\s+especial/.test(cn)) return 'recurso_especial';
  if (/recurso\s+extraordinario/.test(cn)) return 'recurso_extraordinario';
  if (/reexame\s+necessario|remessa\s+necessaria/.test(cn)) return 'remessa_necessaria';
  if (/embargo/.test(cn)) return 'embargos';
  if (/mandado\s+de\s+seguranca|\bms\b/.test(cn)) return 'ms';
  if (/procedimento\s+comum|conhecimento|acao\s+ordinaria|monitoria/.test(cn)) return 'procedimento_comum';
  if (/cumprimento\s+de\s+sentenca/.test(cn)) return 'cumprimento_sentenca';
  if (/excecao\s+de\s+pre/.test(cn)) return 'epe';
  if (/idpj|desconsideracao/.test(cn)) return 'idpj';
  if (/cautelar/.test(cn)) return 'cautelar';
  return cn;
}

/**
 * Fatia visual de processos que não são EF nem hub: recursos, embargos à execução/terceiro, demais.
 * Embargos de declaração (e infringentes/divergência) entram em recursos.
 */
export function otherProcBucket(execution) {
  const cn = normalizeSpeciesText(execution?.className);
  if (!cn) return 'outros';
  if (/embargos?\s+(de\s+declaracao|infringente|de\s+divergencia)/.test(cn)) return 'recursos';
  if (/embargos?\s+de\s+terceir/.test(cn)) return 'embargos';
  if (/embargos?.{0,24}execucao/.test(cn)) return 'embargos';
  if (/\bembargos?\b/.test(cn)) return 'embargos';
  if (
    /apelacao/.test(cn)
    || /agravo/.test(cn)
    || /\brecurso\b/.test(cn)
    || /reexame\s+necessario|remessa\s+necessaria/.test(cn)
    || /reclamacao/.test(cn)
  ) return 'recursos';
  return 'outros';
}

export function splitOtherProcGroups(groups) {
  const recursos = [];
  const embargos = [];
  const outros = [];
  for (const group of groups || []) {
    const bucket = otherProcBucket(group?.exec);
    if (bucket === 'recursos') recursos.push(group);
    else if (bucket === 'embargos') embargos.push(group);
    else outros.push(group);
  }
  return { recursos, embargos, outros };
}

const isEmpty = (value) => value === undefined || value === null || value === '';

const stableValue = (value) => {
  if (Array.isArray(value)) return JSON.stringify([...value].sort());
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
};

const uniqueStrings = (values) => {
  const out = [];
  const seen = new Set();
  for (const value of values || []) {
    const text = String(value || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
};

const replaceExecutionId = (value, removedIds, canonicalId) =>
  value && removedIds.has(value) ? canonicalId : value;

const replaceExecutionIdList = (list, removedIds, canonicalId, ownerId) => {
  const out = [];
  const seen = new Set();
  for (const rawId of Array.isArray(list) ? list : []) {
    const id = replaceExecutionId(rawId, removedIds, canonicalId);
    if (!id || id === ownerId || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

export function countExecutionReferences(data, executionId) {
  const d = data || {};
  const counts = {
    events: 0,
    parentLinks: 0,
    coveredLinks: 0,
    measures: 0,
    stages: 0,
    changeLog: 0,
  };
  for (const event of d.prescriptionEvents || []) {
    if (event.executionId === executionId || event._inheritedFromIDPJ === executionId || event._inheritedFromParent === executionId) counts.events++;
  }
  for (const execution of d.executions || []) {
    if (execution.parentExecutionId === executionId) counts.parentLinks++;
    if ((execution.linkedExecutionIds || []).includes(executionId)) counts.coveredLinks++;
  }
  for (const measure of d.measures || []) {
    if (measure.executionId === executionId || (measure.linkedExecutionIds || []).includes(executionId)) counts.measures++;
  }
  for (const operation of d.operations || []) {
    if (operation?.briefing?.processStageV2?.[executionId]) counts.stages++;
  }
  for (const entry of d.changeLog || []) {
    if (entry.col === 'executions' && entry.entityId === executionId) counts.changeLog++;
  }
  counts.total = counts.events + counts.parentLinks + counts.coveredLinks + counts.measures + counts.stages + counts.changeLog;
  return counts;
}

export function getExecutionMergeConflicts(executions) {
  const records = executions || [];
  return EXECUTION_MERGE_FIELDS.map((field) => {
    const values = [];
    const seen = new Set();
    for (const execution of records) {
      const value = execution[field];
      if (isEmpty(value)) continue;
      const key = stableValue(value);
      if (seen.has(key)) continue;
      seen.add(key);
      values.push({ executionId: execution.id, value });
    }
    return values.length > 1 ? { field, values } : null;
  }).filter(Boolean);
}

function executionQualityScore(data, execution) {
  const fields = EXECUTION_MERGE_FIELDS.filter((field) => !isEmpty(execution[field])).length;
  const notes = (execution.notesList || (execution.notes ? [execution.notes] : [])).length;
  const links = (execution.linkedExecutionIds || []).length + (execution.parentExecutionId ? 1 : 0);
  const refs = countExecutionReferences(data, execution.id).total;
  const hub = ['idpj', 'cautelar_fiscal', 'central'].includes(execution.processTag) ? 4 : 0;
  return fields + notes * 2 + links * 3 + refs * 4 + hub;
}

/**
 * Duplicidade consolidável = mesmo número e mesma família de espécie, na mesma operação.
 * Espécies diversas com o mesmo número CNJ (1º grau e recurso) não entram neste resultado.
 * Sem classe no cadastro, o alerta permanece — não dá para afirmar que são espécies diversas.
 * Repetições entre operações também são excluídas.
 */
export function clusterDuplicateExecutions(executions) {
  const byDigits = new Map();
  for (const execution of executions || []) {
    const processDigits = normalizeExecutionProcessNumber(execution.processNumber);
    if (!processDigits) continue;
    if (!byDigits.has(processDigits)) byDigits.set(processDigits, []);
    byDigits.get(processDigits).push(execution);
  }
  const clusters = [];
  for (const [processDigits, records] of byDigits) {
    if (records.length < 2) continue;
    for (const group of splitDuplicateClustersBySpecies(records)) {
      clusters.push({ processDigits, executions: group });
    }
  }
  return clusters;
}

function splitDuplicateClustersBySpecies(records) {
  const unknown = [];
  const bySpecies = new Map();
  for (const execution of records) {
    const species = processSpeciesKey(execution);
    if (species === '_sem_especie') {
      unknown.push(execution);
      continue;
    }
    if (!bySpecies.has(species)) bySpecies.set(species, []);
    bySpecies.get(species).push(execution);
  }
  const knownKeys = [...bySpecies.keys()];
  if (unknown.length && knownKeys.length <= 1) {
    const known = knownKeys.length === 1 ? bySpecies.get(knownKeys[0]) : [];
    const merged = [...known, ...unknown];
    return merged.length > 1 ? [merged] : [];
  }
  const clusters = [];
  for (const group of bySpecies.values()) {
    if (group.length > 1) clusters.push(group);
  }
  if (unknown.length > 1) clusters.push(unknown);
  return clusters;
}

export function findDuplicateExecutionGroups(data) {
  const d = data || {};
  const byOp = new Map();
  for (const execution of d.executions || []) {
    const processDigits = normalizeExecutionProcessNumber(execution.processNumber);
    const operationId = String(execution.operationId || '').trim();
    if (!processDigits || !operationId) continue;
    if (!byOp.has(operationId)) byOp.set(operationId, []);
    byOp.get(operationId).push(execution);
  }
  const out = [];
  for (const [operationId, executions] of byOp) {
    for (const cluster of clusterDuplicateExecutions(executions)) {
      const ranked = [...cluster.executions].sort((a, b) => executionQualityScore(d, b) - executionQualityScore(d, a));
      out.push({
        key: `${operationId}::${cluster.processDigits}::${cluster.executions.map((e) => e.id).sort().join('+')}`,
        operationId,
        processDigits: cluster.processDigits,
        processNumber: cluster.executions.find((e) => e.processNumber)?.processNumber || '',
        executionIds: cluster.executions.map((e) => e.id),
        recommendedId: ranked[0]?.id || cluster.executions[0].id,
        conflicts: getExecutionMergeConflicts(cluster.executions),
      });
    }
  }
  return out;
}

function mergeStageRecord(current, incoming, sourceId) {
  if (!current) return { ...incoming };
  if (!incoming) return { ...current };
  const out = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (isEmpty(out[key])) {
      out[key] = value;
      continue;
    }
    if (key === 'resources' && Array.isArray(value)) {
      const byKey = new Map();
      for (const resource of [...(Array.isArray(out.resources) ? out.resources : []), ...value]) {
        const resourceKey = stableValue(resource);
        if (!byKey.has(resourceKey)) byKey.set(resourceKey, resource);
      }
      out.resources = [...byKey.values()];
      continue;
    }
    if ((key === 'texto' || key === 'text' || key === 'notes') && stableValue(out[key]) !== stableValue(value)) {
      const marker = `[Consolidado de ${sourceId}]`;
      if (!String(out[key]).includes(String(value))) out[key] = `${out[key]}\n\n${marker} ${value}`;
    }
  }
  return out;
}

function mergeStageMaps(base, incoming, sourceId) {
  const out = { ...(base || {}) };
  for (const [phase, record] of Object.entries(incoming || {})) {
    out[phase] = mergeStageRecord(out[phase], record, sourceId);
  }
  return out;
}

function scanRemovedExecutionReferences(data, removedIds) {
  const hits = [];
  for (const execution of data.executions || []) {
    if (removedIds.has(execution.parentExecutionId)) hits.push(`executions.${execution.id}.parentExecutionId`);
    for (const id of execution.linkedExecutionIds || []) if (removedIds.has(id)) hits.push(`executions.${execution.id}.linkedExecutionIds`);
  }
  for (const event of data.prescriptionEvents || []) {
    for (const field of ['executionId', '_inheritedFromIDPJ', '_inheritedFromParent']) {
      if (removedIds.has(event[field])) hits.push(`prescriptionEvents.${event.id}.${field}`);
    }
  }
  for (const measure of data.measures || []) {
    if (removedIds.has(measure.executionId)) hits.push(`measures.${measure.id}.executionId`);
    for (const id of measure.linkedExecutionIds || []) if (removedIds.has(id)) hits.push(`measures.${measure.id}.linkedExecutionIds`);
  }
  for (const operation of data.operations || []) {
    for (const id of Object.keys(operation?.briefing?.processStageV2 || {})) {
      if (removedIds.has(id)) hits.push(`operations.${operation.id}.briefing.processStageV2.${id}`);
    }
  }
  return hits;
}

/**
 * Consolida registros duplicados e remapeia todas as referências conhecidas.
 * `fieldSources` tem formato { status: 'execution-id', court: 'execution-id' }.
 */
export function mergeDuplicateExecutions(data, options = {}) {
  const canonicalId = options.canonicalId;
  const requestedDuplicateIds = new Set(options.duplicateIds || []);
  requestedDuplicateIds.delete(canonicalId);
  const d = data || {};
  const byId = new Map((d.executions || []).map((execution) => [execution.id, execution]));
  const canonical = byId.get(canonicalId);
  if (!canonical) throw new Error('Processo canônico não encontrado.');
  const duplicates = [...requestedDuplicateIds].map((id) => byId.get(id)).filter(Boolean);
  if (duplicates.length !== requestedDuplicateIds.size || duplicates.length === 0) throw new Error('Seleção de duplicidades inválida ou vazia.');
  const records = [canonical, ...duplicates];
  const operationId = String(canonical.operationId || '').trim();
  const processDigits = normalizeExecutionProcessNumber(canonical.processNumber);
  if (!operationId || !processDigits) throw new Error('O processo canônico precisa estar vinculado a uma operação e possuir número.');
  for (const execution of duplicates) {
    if (String(execution.operationId || '').trim() !== operationId || normalizeExecutionProcessNumber(execution.processNumber) !== processDigits) {
      throw new Error('Só é possível consolidar o mesmo processo dentro da mesma operação.');
    }
  }

  const now = options.now || new Date().toISOString();
  const fieldSources = options.fieldSources || {};
  const sourceById = new Map(records.map((record) => [record.id, record]));
  let merged = { ...canonical };

  // Completa campos vazios e une arrays genéricos sem apagar a base escolhida.
  for (const record of duplicates) {
    for (const [field, value] of Object.entries(record)) {
      if (['id', 'operationId', 'notes', 'notesList', 'linkedExecutionIds', 'parentExecutionId'].includes(field)) continue;
      if (isEmpty(merged[field]) && !isEmpty(value)) merged[field] = value;
      else if (Array.isArray(merged[field]) && Array.isArray(value)) merged[field] = [...new Set([...merged[field], ...value])];
    }
  }
  for (const field of EXECUTION_MERGE_FIELDS) {
    const selected = sourceById.get(fieldSources[field]);
    if (selected && Object.prototype.hasOwnProperty.call(selected, field)) merged[field] = selected[field];
  }

  const notes = [];
  for (const record of records) notes.push(...(record.notesList || (record.notes ? [record.notes] : [])));
  merged.notesList = uniqueStrings(notes);
  merged.notes = null;
  merged.linkedExecutionIds = replaceExecutionIdList(
    records.flatMap((record) => record.linkedExecutionIds || []),
    requestedDuplicateIds,
    canonicalId,
    canonicalId
  );
  merged.parentExecutionId = replaceExecutionId(merged.parentExecutionId, requestedDuplicateIds, canonicalId);
  if (merged.parentExecutionId === canonicalId) merged.parentExecutionId = null;
  merged.mergedFromExecutionIds = [...new Set([...(canonical.mergedFromExecutionIds || []), ...duplicates.flatMap((record) => [record.id, ...(record.mergedFromExecutionIds || [])])])];
  merged.mergedAt = now;
  merged.updatedAt = now;
  const createdDates = records.map((record) => record.createdAt).filter(Boolean).sort();
  if (createdDates.length) merged.createdAt = createdDates[0];

  let nextExecutions = (d.executions || [])
    .filter((execution) => !requestedDuplicateIds.has(execution.id))
    .map((execution) => {
      if (execution.id === canonicalId) return merged;
      const parentExecutionId = replaceExecutionId(execution.parentExecutionId, requestedDuplicateIds, canonicalId);
      const linkedExecutionIds = replaceExecutionIdList(execution.linkedExecutionIds, requestedDuplicateIds, canonicalId, execution.id);
      return { ...execution, parentExecutionId: parentExecutionId === execution.id ? null : parentExecutionId, linkedExecutionIds };
    });

  const nextEvents = (d.prescriptionEvents || []).map((event) => ({
    ...event,
    executionId: replaceExecutionId(event.executionId, requestedDuplicateIds, canonicalId),
    _inheritedFromIDPJ: replaceExecutionId(event._inheritedFromIDPJ, requestedDuplicateIds, canonicalId),
    _inheritedFromParent: replaceExecutionId(event._inheritedFromParent, requestedDuplicateIds, canonicalId),
  }));

  const nextMeasures = (d.measures || []).map((measure) => ({
    ...measure,
    executionId: replaceExecutionId(measure.executionId, requestedDuplicateIds, canonicalId),
    linkedExecutionIds: replaceExecutionIdList(measure.linkedExecutionIds, requestedDuplicateIds, canonicalId, null),
  }));

  const archiveSnapshots = duplicates.map((record) => ({
    mergedAt: now,
    canonicalId,
    sourceExecutionId: record.id,
    execution: record,
  }));
  const nextOperations = (d.operations || []).map((operation) => {
    const briefing = operation.briefing || {};
    const stages = briefing.processStageV2 || {};
    const hasStage = records.some((record) => stages[record.id]);
    if (operation.id !== operationId && !hasStage) return operation;
    let canonicalStages = { ...(stages[canonicalId] || {}) };
    for (const record of duplicates) canonicalStages = mergeStageMaps(canonicalStages, stages[record.id], record.id);
    const nextStages = { ...stages, [canonicalId]: canonicalStages };
    for (const record of duplicates) delete nextStages[record.id];
    const operationArchive = archiveSnapshots
      .filter(snapshot => operation.id === operationId || stages[snapshot.sourceExecutionId])
      .map(snapshot => ({
      ...snapshot,
      processStageV2: stages[snapshot.sourceExecutionId] || null,
      }));
    const processMergeArchive = [...(briefing.processMergeArchive || []), ...operationArchive];
    return { ...operation, briefing: { ...briefing, processStageV2: nextStages, processMergeArchive } };
  });

  const nextChangeLog = (d.changeLog || []).map((entry) =>
    entry.col === 'executions' && requestedDuplicateIds.has(entry.entityId)
      ? { ...entry, entityId: canonicalId, mergedFromEntityId: entry.entityId }
      : entry
  );

  const next = {
    ...d,
    executions: nextExecutions,
    prescriptionEvents: nextEvents,
    measures: nextMeasures,
    operations: nextOperations,
    changeLog: nextChangeLog,
  };
  const dangling = scanRemovedExecutionReferences(next, requestedDuplicateIds);
  if (dangling.length) throw new Error(`A consolidação deixou referências órfãs: ${dangling.slice(0, 5).join(', ')}`);
  if (nextEvents.length !== (d.prescriptionEvents || []).length) throw new Error('A consolidação alterou a quantidade de eventos prescricionais.');
  if (nextExecutions.some((execution) => execution.parentExecutionId === execution.id || (execution.linkedExecutionIds || []).includes(execution.id))) {
    throw new Error('A consolidação criaria autorreferência entre processos.');
  }

  return {
    data: next,
    report: {
      canonicalId,
      removedIds: [...requestedDuplicateIds],
      eventCount: nextEvents.length,
      archivedSnapshots: archiveSnapshots.length,
      beforeExecutionCount: (d.executions || []).length,
      afterExecutionCount: nextExecutions.length,
    },
  };
}

/** Reassocia um processo invisível e registros processuais órfãos correlatos. */
export function relinkExecutionToOperation(data, executionId, operationId, options = {}) {
  const d = data || {};
  const targetOperation = (d.operations || []).find((operation) => operation.id === operationId);
  const execution = (d.executions || []).find((item) => item.id === executionId);
  if (!targetOperation) throw new Error('Operação de destino não encontrada.');
  if (!execution) throw new Error('Processo não encontrado.');
  const processDigits = normalizeExecutionProcessNumber(execution.processNumber);
  const validOperationIds = new Set((d.operations || []).map((operation) => operation.id));
  const isOrphanOperation = (value) => !value || !validOperationIds.has(value);
  const includeRelated = options.includeRelated !== false;
  const sameProcess = (item) => processDigits && normalizeExecutionProcessNumber(item?.processNumber) === processDigits;
  const next = { ...d };
  next.executions = (d.executions || []).map((item) => item.id === executionId ? { ...item, operationId, updatedAt: options.now || new Date().toISOString() } : item);
  for (const collection of ['debts', 'intimations', 'tasks', 'hearings', 'documents', 'watchlist']) {
    next[collection] = (d[collection] || []).map((item) =>
      includeRelated && sameProcess(item) && isOrphanOperation(item.operationId) ? { ...item, operationId } : item
    );
  }
  next.prescriptionEvents = (d.prescriptionEvents || []).map((event) =>
    event.executionId === executionId && isOrphanOperation(event.operationId) ? { ...event, operationId } : event
  );
  return next;
}

/**
 * Notas geradas pela planilha de processos (classe/espécie).
 * SIDA, DEBCAD e similares já aparecem no selo do card — não devem ir para notas.
 */
export function isRedundantImportedProcessNote(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  if (/^[\s·]*classe\s*:/i.test(raw)) return true;
  const n = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^[\s·]+|[\s·]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  if (/^(sida|debcad|deb cad|fgts|pandora|caixa)$/.test(n)) return true;
  if (/^execucao fiscal\s*\(?\s*(sida|debcad|deb cad|fgts|pandora|caixa)\s*\)?$/.test(n)) return true;
  return false;
}

export function filterImportedProcessNotes(notes) {
  return uniqueStrings(notes).filter((n) => !isRedundantImportedProcessNote(n));
}

/** Nota automática no card do processo (aba Processos e Prescrição) após registro de atuação. */
export function buildAtuacaoProcessNote(intim, action, respondedAt) {
  const ra = action || {};
  const typeLabels = { peticionamento: ra.peticionType || 'Peticionamento', ciencia: 'Ciência', outra: 'Outra medida' };
  const lbl = typeLabels[ra.type] || 'Atuação';
  let datePart = '';
  const iso = String(respondedAt || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    datePart = ` · ${d}/${m}/${y}`;
  }
  const chunks = [`[Atuação · ${lbl}${datePart}]`];
  const desc = String(ra.description || '').trim();
  if (desc) chunks.push(desc);
  const ev = String(intim?.eventDescription || '').trim();
  if (ev && !desc.includes(ev)) chunks.push(`(${ev})`);
  const linkUrl = ra.type === 'peticionamento' ? ra.peticionUrl : ra.docUrl;
  if (linkUrl && String(linkUrl).trim()) chunks.push(`Peça: ${String(linkUrl).trim()}`);
  return chunks.join(' ');
}

export function appendAtuacaoNoteToExecution(execution, noteText) {
  if (!execution || !noteText) return execution;
  const existing = execution.notesList || (execution.notes ? [execution.notes] : []);
  return { ...execution, notesList: [...existing, noteText] };
}

/**
 * Migra atuações já registradas para notesList do processo correspondente.
 * Idempotente via responseAction._noteOnProcessCard. Sem processo cadastrado, tenta de novo na próxima carga.
 */
export function migrateAtuacaoNotesToProcessCards(data) {
  if (!data) return data;
  (data.intimations || []).forEach((intim) => {
    const ra = intim.responseAction;
    if (!ra || ra._noteOnProcessCard || !intim.operationId) return;
    if (!intim.processNumber) {
      intim.responseAction = { ...ra, _noteOnProcessCard: true };
      return;
    }
    const targetDigits = normalizeExecutionProcessNumber(intim.processNumber);
    const idx = (data.executions || []).findIndex((e) =>
      e.operationId === intim.operationId &&
      normalizeExecutionProcessNumber(e.processNumber) === targetDigits
    );
    if (idx < 0) return;
    data.executions[idx] = appendAtuacaoNoteToExecution(
      data.executions[idx],
      buildAtuacaoProcessNote(intim, ra, ra.respondedAt || intim.updatedAt)
    );
    intim.responseAction = { ...ra, _noteOnProcessCard: true };
  });
  (data.operations || []).forEach((op) => {
    if (!op.briefing?.entries?.length) return;
    const filtered = op.briefing.entries.filter((e) => !(e.type === 'atuacao' && e.sourceIntimationId));
    if (filtered.length !== op.briefing.entries.length) op.briefing.entries = filtered;
  });
  return data;
}

export function sanitizeImportedExecutionNotes(record) {
  if (!record) return record;
  const notes = filterImportedProcessNotes(record.notesList || (record.notes ? [record.notes] : []));
  const out = { ...record };
  delete out.notes;
  if (notes.length) out.notesList = notes;
  else delete out.notesList;
  return out;
}

/** Merge conservador para reimportações: preenche lacunas sem apagar decisões manuais. */
export function mergeImportedExecution(existing, incoming) {
  if (!existing) return sanitizeImportedExecutionNotes({ ...incoming });
  const out = { ...existing };
  for (const field of ['className', 'court', 'protocolDate', 'prescriptionForecast']) {
    if (isEmpty(out[field]) && !isEmpty(incoming[field])) out[field] = incoming[field];
  }
  for (const field of ['hasGuarantee', 'prescriptionInterrupted', 'digraTracked']) {
    if (incoming[field] === true) out[field] = true;
  }
  const notes = filterImportedProcessNotes([
    ...(existing.notesList || (existing.notes ? [existing.notes] : [])),
    ...(incoming.notesList || (incoming.notes ? [incoming.notes] : [])),
  ]);
  delete out.notes;
  if (notes.length) out.notesList = notes;
  else delete out.notesList;
  return out;
}
