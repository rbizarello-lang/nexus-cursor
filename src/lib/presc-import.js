/**
 * Parser e plano de importação do formato NEXUS — seção PRESCRIÇÃO.
 * Puro: sem React. Datas em dd/mm/aaaa; N/I = vazio.
 */

import { fmtDate, normProc, parseAnyDate } from './dates.js';

export const FATO_CODE_MAP = {
  'MARCO-SEMBENS': 'marco_sem_bens',
  'MARCO-NAOLOC': 'marco_nao_localizacao',
  'MARCO-INSUF': 'marco_insuficiencia_bens',
  CITACAO: 'int_citacao',
  PENHORA: 'int_penhora',
  SISBAJUD: 'int_sisbajud',
  ARRESTO: 'int_arresto',
  CNIB: 'int_cnib',
  'PARC-ADESAO': 'susp_parcelamento',
  'PARC-RESCISAO': 'int_rescisao_parcelamento',
  'PAUSA-EMBARGOS': 'susp_embargos',
  'PAUSA-LIMINAR': 'susp_decisao_judicial',
  'PAUSA-DEPOSITO': 'susp_deposito',
  'PAUSA-FALENCIA': 'susp_falencia',
  'PAUSA-OUTRA': 'susp_outra',
  'IDPJ-CONSTRICAO': 'susp_idpj_mcf_constricao',
  'ART174-DESPACHO': 'int_despacho_citacao',
  'ART174-RECONHECIMENTO': 'int_reconhecimento',
  'ART174-PROTESTO-JUD': 'int_protesto_judicial',
  'ART174-PROTESTO-EXTRA': 'int_protesto_extrajudicial',
  'SIT-ARQUIVAMENTO': 'info_arquivamento',
  'SIT-SUSP40': 'susp_art40',
  'SIT-PETICAO': 'info_peticao_sem_resultado',
  'SIT-DESARQUIVAMENTO': 'info_desarquivamento',
  'SIT-DECISAO-PRESC': 'info_decisao_prescricao'
};

export const PARECER_SITUATIONS = {
  'SEM-MARCO': 'sem ciência lançada',
  'CICLO-EM-CURSO': 'ciclo em curso',
  'CICLO-ENCERRADO': 'ciclo encerrado',
  PAUSADO: 'pausado',
  'PROVAVEL-CONSUMACAO': 'provável consumação',
  DECLARADA: 'prescrição reconhecida'
};

function splitFields(line) {
  return String(line || '').split('|').map(s => s.trim());
}

function hasEvento(fonte) {
  return /evento/i.test(String(fonte || ''));
}

function parseFactDate(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s || s === 'N/I') return { iso: '', ni: s === 'N/I' };
  const iso = parseAnyDate(s);
  if (!iso) return { iso: '', invalid: s };
  return { iso };
}

function kindFromClass(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'IDPJ') return 'idpj';
  if (s === 'MCF') return 'cautelar_fiscal';
  if (/EMBARGO/.test(s)) return 'embargos';
  return 'ef';
}

function extractSection(text) {
  const src = String(text || '').replace(/\r\n/g, '\n');
  const start = src.search(/\[INÍCIO NEXUS\]/i);
  const errors = [];
  if (start < 0) {
    return { body: '', errors: [{ line: 0, reason: 'bloco sem [INÍCIO NEXUS]' }], closed: false };
  }
  const after = src.slice(start);
  const end = after.search(/\[FIM NEXUS\]/i);
  if (end < 0) {
    errors.push({ line: 0, reason: 'bloco sem [FIM NEXUS]' });
    return { body: after, errors, closed: false };
  }
  return { body: after.slice(0, end), errors, closed: true };
}

/**
 * parseNexusPrescricao(text) → { processes, errors }
 */
export function parseNexusPrescricao(text) {
  const { body, errors, closed } = extractSection(text);
  const processes = [];
  if (!body) return { processes, errors };
  const lines = body.split('\n');
  let inPresc = false;
  let current = null;
  const flush = () => {
    if (current) processes.push(current);
    current = null;
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const lineNo = idx + 1;
    if (!line) return;
    if (/^PRESCRIÇÃO$/i.test(line)) {
      inPresc = true;
      return;
    }
    if (!inPresc) return;
    if (/^---+$/.test(line)) {
      flush();
      return;
    }
    const parts = splitFields(line);
    const head = (parts[0] || '').toUpperCase();
    if (head === 'PROCESSO') {
      flush();
      current = {
        processNumber: parts[1] || '',
        className: parts[2] || '',
        kind: kindFromClass(parts[2]),
        facts: [],
        parecer: null
      };
      if (!normProc(current.processNumber)) {
        errors.push({ line: lineNo, reason: 'PROCESSO sem número' });
      }
      return;
    }
    if (head === 'FATO') {
      if (!current) {
        errors.push({ line: lineNo, reason: 'FATO sem PROCESSO' });
        return;
      }
      const code = (parts[1] || '').toUpperCase();
      const type = FATO_CODE_MAP[code];
      if (!type) {
        errors.push({ line: lineNo, reason: 'código inválido: ' + (parts[1] || '') });
        return;
      }
      const d1 = parseFactDate(parts[2]);
      const d2 = parseFactDate(parts[3]);
      const d3 = parseFactDate(parts[4]);
      if (d1.invalid) {
        errors.push({ line: lineNo, reason: 'data inválida: ' + d1.invalid });
        return;
      }
      if (d2.invalid) {
        errors.push({ line: lineNo, reason: 'data do pedido inválida: ' + d2.invalid });
        return;
      }
      if (d3.invalid) {
        errors.push({ line: lineNo, reason: 'data de fim inválida: ' + d3.invalid });
        return;
      }
      const fonte = parts[5] || '';
      if (!hasEvento(fonte)) {
        errors.push({ line: lineNo, reason: 'Fonte sem Evento' });
        return;
      }
      current.facts.push({
        code,
        type,
        date: d1.iso,
        requestDate: d2.iso,
        endDate: d3.iso,
        endNI: !!d3.ni,
        sourceRef: fonte,
        note: parts.slice(6).join(' | ')
      });
      return;
    }
    if (head === 'PARECER') {
      if (!current) {
        errors.push({ line: lineNo, reason: 'PARECER sem PROCESSO' });
        return;
      }
      const situation = (parts[1] || '').toUpperCase();
      if (!PARECER_SITUATIONS[situation]) {
        errors.push({ line: lineNo, reason: 'situação inválida: ' + (parts[1] || '') });
        return;
      }
      const termRaw = parts[2] || '';
      const analysisRaw = parts[3] || '';
      const fonte = parts[4] || '';
      const basis = parts.slice(5).join(' | ');
      const termP = parseFactDate(termRaw);
      const analysisP = parseFactDate(analysisRaw);
      if (termP.invalid) {
        errors.push({ line: lineNo, reason: 'termo inválido: ' + termP.invalid });
        return;
      }
      if (!analysisP.iso) {
        errors.push({ line: lineNo, reason: 'Data da análise obrigatória' });
        return;
      }
      if ((situation === 'DECLARADA' || situation === 'PROVAVEL-CONSUMACAO') && !termP.iso) {
        errors.push({ line: lineNo, reason: 'Termo obrigatório em ' + situation });
        return;
      }
      if (!hasEvento(fonte)) {
        errors.push({ line: lineNo, reason: 'Fonte sem Evento' });
        return;
      }
      current.parecer = {
        situation,
        term: termP.iso,
        analysisDate: analysisP.iso,
        sourceRef: fonte,
        basis
      };
    }
  });
  flush();
  if (!closed && !errors.some(e => /FIM NEXUS/.test(e.reason))) {
    errors.push({ line: 0, reason: 'bloco sem [FIM NEXUS]' });
  }
  return { processes, errors };
}

export function factKey(processNumber, type, date, requestDate) {
  return [normProc(processNumber), type, date || '', requestDate || ''].join('|');
}

function findExecutions(data, processNumber) {
  const n = normProc(processNumber);
  if (!n) return [];
  return ((data && data.executions) || []).filter(e => e && normProc(e.processNumber) === n);
}

function existingEventKey(ev) {
  return [(ev && ev.type) || '', parseAnyDate(ev && ev.date) || '', parseAnyDate(ev && ev.requestDate) || ''].join('|');
}

function parecerEqual(a, b) {
  if (!a || !b) return false;
  return a.situation === b.situation
    && (a.term || '') === (b.term || '')
    && (a.analysisDate || '') === (b.analysisDate || '');
}

function cdasOfExec(data, exec) {
  if (!exec) return [];
  const n = normProc(exec.processNumber);
  const op = exec.operationId;
  return ((data && data.debts) || []).filter(d => d && d.operationId === op && normProc(d.processNumber) === n);
}

/**
 * Plano de importação (prévia). Não grava.
 */
export function planNexusPrescricao(parsed, data) {
  const processes = [];
  for (const p of (parsed && parsed.processes) || []) {
    const matches = findExecutions(data, p.processNumber);
    const exec = matches[0] || null;
    if (!exec) {
      processes.push({
        processNumber: p.processNumber,
        kind: p.kind,
        refused: true,
        refuseReason: 'cadastre o processo antes',
        newFacts: [],
        existingFacts: [],
        parecer: p.parecer,
        parecerDuplicate: false,
        cdas: []
      });
      continue;
    }
    const evs = ((data && data.prescriptionEvents) || []).filter(e => e && e.executionId === exec.id);
    const byKey = new Map(evs.map(e => [existingEventKey(e), e]));
    const newFacts = [];
    const existingFacts = [];
    for (const f of p.facts || []) {
      const k = [f.type, f.date || '', f.requestDate || ''].join('|');
      const hit = byKey.get(k);
      if (hit) existingFacts.push({ fact: f, event: hit });
      else newFacts.push(f);
    }
    const parecerDuplicate = !!(p.parecer && parecerEqual(p.parecer, exec.prescDecision));
    processes.push({
      processNumber: p.processNumber,
      kind: p.kind,
      execId: exec.id,
      operationId: exec.operationId,
      refused: false,
      newFacts,
      existingFacts,
      parecer: p.parecer,
      parecerDuplicate,
      cdas: cdasOfExec(data, exec).map(d => ({ id: d.id, cdaNumber: d.cdaNumber, processNumber: d.processNumber }))
    });
  }
  return {
    errors: (parsed && parsed.errors) || [],
    processes,
    canCommit: processes.some(p => !p.refused && (p.newFacts.length || (p.parecer && !p.parecerDuplicate)))
  };
}

/**
 * Aplica o plano. Retorna o próximo estado de dados (imutável).
 */
export function commitNexusPrescricao(data, plan, { uid, now } = {}) {
  const stamp = now || new Date().toISOString();
  const importedAt = stamp.slice(0, 10);
  const makeId = uid || (() => 'imp-' + Math.random().toString(36).slice(2, 10));
  let events = [...((data && data.prescriptionEvents) || [])];
  let executions = [...((data && data.executions) || [])];
  let debts = [...((data && data.debts) || [])];
  const added = [];
  const patched = [];
  for (const p of (plan && plan.processes) || []) {
    if (p.refused || !p.execId) continue;
    const exec = executions.find(e => e.id === p.execId);
    if (!exec) continue;
    for (const pair of p.existingFacts || []) {
      const ev = pair.event;
      if (ev && !ev.sourceRef && pair.fact && pair.fact.sourceRef) {
        events = events.map(x => x.id === ev.id ? { ...x, sourceRef: pair.fact.sourceRef, updatedAt: stamp } : x);
        patched.push(ev.id);
      }
    }
    for (const f of p.newFacts || []) {
      const ev = {
        id: makeId(),
        executionId: p.execId,
        type: f.type,
        date: f.date || '',
        requestDate: f.requestDate || '',
        endDate: f.endDate || '',
        notes: f.note || '',
        source: 'analise',
        sourceRef: f.sourceRef || '',
        importedAt,
        createdAt: stamp,
        updatedAt: stamp
      };
      events.push(ev);
      added.push(ev);
    }
    if (p.parecer && !p.parecerDuplicate) {
      const incoming = { ...p.parecer, importedAt };
      executions = executions.map(e => {
        if (e.id !== p.execId) return e;
        const prev = e.prescDecision;
        const history = [...(e.prescDecisionHistory || [])];
        if (prev && !parecerEqual(prev, incoming)) history.push(prev);
        return { ...e, prescDecision: incoming, prescDecisionHistory: history, updatedAt: stamp };
      });
      if (p.parecer.situation === 'DECLARADA') {
        const n = normProc(p.processNumber);
        debts = debts.map(d => {
          if (d.operationId !== p.operationId || normProc(d.processNumber) !== n) return d;
          return {
            ...d,
            prescriptionHandled: true,
            prescriptionHandledAt: importedAt,
            prescriptionHandledType: d.prescriptionHandledType || 'declarada',
            updatedAt: stamp
          };
        });
      }
    }
  }
  return {
    data: { ...data, prescriptionEvents: events, executions, debts },
    added,
    patched
  };
}

export function groupFromPrescDecision(decision, engineGroup) {
  if (!decision || !decision.situation) return null;
  const sit = decision.situation;
  if (sit === 'DECLARADA') return 0;
  if (sit === 'CICLO-ENCERRADO' || sit === 'PAUSADO') return 4;
  if (sit === 'SEM-MARCO') return engineGroup === 5 ? 5 : 4;
  const term = parseAnyDate(decision.term);
  let termDays = null;
  if (term) {
    const a = new Date(term + 'T00:00:00');
    const b = new Date();
    b.setHours(0, 0, 0, 0);
    termDays = Math.round((a - b) / 86400000);
  }
  if (sit === 'PROVAVEL-CONSUMACAO') {
    if (termDays != null && termDays <= 180) return 1;
    return 2;
  }
  if (sit === 'CICLO-EM-CURSO') {
    if (termDays != null && termDays <= 180) return 1;
    return 4;
  }
  return null;
}

export function engineMoreGraveThanDecision(engine, decision) {
  if (!engine || !decision || !decision.situation) return '';
  const analysis = decision.analysisDate || '';
  const engineTerm = parseAnyDate(engine.diesAdQuem) || '';
  const consumed = engine.phase === 'consumado' || engine.status === 'prescrito' || engine.status === 'consumada'
    || (engine.daysLeft != null && engine.daysLeft <= 0 && !!engineTerm);
  const sit = decision.situation;
  const softer = sit === 'CICLO-ENCERRADO' || sit === 'PAUSADO' || sit === 'SEM-MARCO' || sit === 'CICLO-EM-CURSO';
  if (softer && consumed) {
    return `Cálculo do app mais grave que a análise de ${fmtDate(analysis)}: termo calculado ${fmtDate(engineTerm)}. Decisão mantida.`;
  }
  const decTerm = parseAnyDate(decision.term);
  if (decTerm && engineTerm && engineTerm < decTerm) {
    return `Cálculo do app mais grave que a análise de ${fmtDate(analysis)}: termo calculado ${fmtDate(engineTerm)}. Decisão mantida.`;
  }
  return '';
}

export function decisionLabel(situation) {
  return PARECER_SITUATIONS[situation] || situation || '';
}
