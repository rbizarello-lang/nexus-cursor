/**
 * Esteira da peça — etapas de produção de uma peça (intimação ou tarefa).
 * Módulo puro, sem React: estado da esteira, progresso, "onde parei" e
 * o template editável em ⚙ → Esteira da peça. Ver AGENTS.md e
 * design/mockups/prumo-esteira-da-peca.html.
 */

let _cxEstSeq = 0;
function cxEstGenId(prefix) {
  _cxEstSeq += 1;
  return (prefix || 'et') + '_' + Date.now().toString(36) + '_' + _cxEstSeq.toString(36);
}

/** Template padrão (⚙ → Esteira da peça). Ids fixos para estabilidade entre sessões. */
export const ESTEIRA_DEFAULT_TEMPLATE = [
  { id: 'anonimizacao', label: 'Anonimização', tool: 'Ferramenta própria', url: '' },
  { id: 'extracao', label: 'Extração do relatório e triagem', tool: 'Gemini', url: '' },
  { id: 'redacao', label: 'Redação fina', tool: 'Claude', url: '' },
  { id: 'leitura', label: 'Leitura e ajustes', tool: 'Claude', url: '' },
];

/* ─── Template (⚙) ─── */

export function esteiraSanitizeStep(step, i) {
  return {
    id: (step && step.id) ? String(step.id) : cxEstGenId('step' + (i == null ? '' : i)),
    label: (step && step.label) || '',
    tool: (step && step.tool) || '',
    url: (step && step.url) || '',
  };
}

export function esteiraSanitizeTemplate(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((s, i) => esteiraSanitizeStep(s, i));
}

export function esteiraTemplateNewStep() {
  return { id: cxEstGenId('step'), label: '', tool: '', url: '' };
}

export function esteiraTemplateAddStep(template) {
  return [...esteiraSanitizeTemplate(template), esteiraTemplateNewStep()];
}

export function esteiraTemplateRemoveStep(template, id) {
  return esteiraSanitizeTemplate(template).filter(s => s.id !== id);
}

export function esteiraTemplateUpdateStep(template, id, patch) {
  return esteiraSanitizeTemplate(template).map(s => s.id === id ? { ...s, ...patch } : s);
}

export function esteiraTemplateMoveStep(template, id, dir) {
  const list = esteiraSanitizeTemplate(template);
  const i = list.findIndex(s => s.id === id);
  if (i < 0) return list;
  const j = i + (dir < 0 ? -1 : 1);
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  const tmp = next[i]; next[i] = next[j]; next[j] = tmp;
  return next;
}

/* ─── Registro (intimação/tarefa): esteira = { etapas: [...], updatedAt } ─── */

/** Copia o template atual para um novo registro (etapas sempre 'todo'). */
export function esteiraCreate(template, now) {
  const ts = now || new Date().toISOString();
  const etapas = esteiraSanitizeTemplate(template).map(s => ({
    id: s.id, label: s.label, tool: s.tool, url: s.url || '',
    status: 'todo', startedAt: null, doneAt: null, note: '',
  }));
  return { etapas, updatedAt: ts };
}

/** "Começar": cria a esteira a partir do template e já inicia a 1ª etapa. */
export function esteiraBegin(template, now) {
  const ts = now || new Date().toISOString();
  return esteiraStartStep(esteiraCreate(template, ts), 0, ts);
}

export function esteiraStartStep(esteira, idx, now) {
  if (!esteira || !Array.isArray(esteira.etapas) || !esteira.etapas[idx]) return esteira;
  const ts = now || new Date().toISOString();
  if (esteira.etapas[idx].status !== 'todo') return esteira;
  const etapas = esteira.etapas.map((e, i) => i === idx ? { ...e, status: 'doing', startedAt: e.startedAt || ts } : e);
  return { ...esteira, etapas, updatedAt: ts };
}

export function esteiraCompleteStep(esteira, idx, now) {
  if (!esteira || !Array.isArray(esteira.etapas) || !esteira.etapas[idx]) return esteira;
  const ts = now || new Date().toISOString();
  let etapas = esteira.etapas.map((e, i) => i === idx ? { ...e, status: 'done', doneAt: ts, startedAt: e.startedAt || ts } : e);
  const next = idx + 1;
  if (etapas[next] && etapas[next].status === 'todo') {
    etapas = etapas.map((e, i) => i === next ? { ...e, status: 'doing', startedAt: ts } : e);
  }
  return { ...esteira, etapas, updatedAt: ts };
}

/** Desfaz: feita → em andamento; em andamento → a fazer. Nunca mexe na situação da intimação/tarefa. */
export function esteiraUndoStep(esteira, idx, now) {
  if (!esteira || !Array.isArray(esteira.etapas) || !esteira.etapas[idx]) return esteira;
  const ts = now || new Date().toISOString();
  const cur = esteira.etapas[idx];
  if (cur.status === 'done') {
    let etapas = esteira.etapas.map((e, i) => i === idx ? { ...e, status: 'doing', doneAt: null } : e);
    const next = idx + 1;
    const nx = etapas[next];
    // Se a próxima foi só auto-iniciada (sem toque do usuário), volta a 'todo' também.
    if (nx && nx.status === 'doing' && !nx.doneAt && !nx.note && !nx.url) {
      etapas = etapas.map((e, i) => i === next ? { ...e, status: 'todo', startedAt: null } : e);
    }
    return { ...esteira, etapas, updatedAt: ts };
  }
  if (cur.status === 'doing') {
    const etapas = esteira.etapas.map((e, i) => i === idx ? { ...e, status: 'todo', startedAt: null } : e);
    return { ...esteira, etapas, updatedAt: ts };
  }
  return esteira;
}

export function esteiraSetNote(esteira, idx, note, now) {
  if (!esteira || !Array.isArray(esteira.etapas) || !esteira.etapas[idx]) return esteira;
  const ts = now || new Date().toISOString();
  const etapas = esteira.etapas.map((e, i) => i === idx ? { ...e, note: note || '' } : e);
  return { ...esteira, etapas, updatedAt: ts };
}

export function esteiraSetLink(esteira, idx, url, now) {
  if (!esteira || !Array.isArray(esteira.etapas) || !esteira.etapas[idx]) return esteira;
  const ts = now || new Date().toISOString();
  const etapas = esteira.etapas.map((e, i) => i === idx ? { ...e, url: url || '' } : e);
  return { ...esteira, etapas, updatedAt: ts };
}

/* ─── Leitura (resumo, progresso, "onde parei") ─── */

export function esteiraHasStarted(esteira) {
  return !!(esteira && Array.isArray(esteira.etapas) && esteira.etapas.length && esteira.etapas.some(e => e.status !== 'todo'));
}

export function esteiraSummary(esteira) {
  const etapas = (esteira && Array.isArray(esteira.etapas)) ? esteira.etapas : [];
  const total = etapas.length;
  const doneCount = etapas.filter(e => e.status === 'done').length;
  let currentIndex = etapas.findIndex(e => e.status === 'doing');
  if (currentIndex === -1) currentIndex = etapas.findIndex(e => e.status === 'todo');
  const isComplete = total > 0 && doneCount === total;
  return {
    total, doneCount, currentIndex,
    current: currentIndex >= 0 ? etapas[currentIndex] : null,
    isComplete,
    updatedAt: esteira ? esteira.updatedAt : null,
  };
}

/** Bolinhas para a barrinha: 'done' | 'doing' | 'todo', uma por etapa. */
export function esteiraProgress(esteira) {
  const etapas = (esteira && Array.isArray(esteira.etapas)) ? esteira.etapas : [];
  return etapas.map(e => (e.status === 'done' || e.status === 'doing') ? e.status : 'todo');
}

/** null se não iniciada ou já concluída — só quando há mesmo o que "continuar". */
export function esteiraResumeInfo(esteira) {
  if (!esteiraHasStarted(esteira)) return null;
  const s = esteiraSummary(esteira);
  if (s.isComplete || s.currentIndex < 0) return null;
  return { index: s.currentIndex, total: s.total, etapa: s.current, updatedAt: esteira.updatedAt };
}

/** Rótulo do grupo em "Agrupar → Etapa". */
export function esteiraGroupLabel(esteira) {
  if (!esteiraHasStarted(esteira)) return 'Sem esteira';
  const s = esteiraSummary(esteira);
  if (s.isComplete) return 'Esteira concluída';
  return (s.current && s.current.label) || 'Sem esteira';
}

/** Último instante em que a esteira foi tocada (para "parou ontem / há N dias / hoje HH:MM"). */
export function esteiraLastTouch(esteira) {
  return (esteira && esteira.updatedAt) || null;
}

/**
 * "hoje HH:MM" / "ontem" / "há N dias". withTime também acrescenta ", HH:MM"
 * quando não é hoje. `now` é injetável para teste determinístico.
 */
export function esteiraStoppedLabel(iso, opts) {
  if (!iso) return '';
  const t = new Date(iso);
  if (isNaN(t.getTime())) return '';
  const o = opts || {};
  const now = o.now ? new Date(o.now) : new Date();
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  const sameDay = t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth() && t.getDate() === now.getDate();
  if (sameDay) return 'hoje ' + hh + ':' + mm;
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d1 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const days = Math.round((d0 - d1) / 86400000);
  let base;
  if (days <= 0) base = 'agora';
  else if (days === 1) base = 'ontem';
  else base = 'há ' + days + ' dias';
  return o.withTime ? base + ', ' + hh + ':' + mm : base;
}
