/**
 * Motor único de prescrição.
 * Modo originário (CDA não ajuizada, art. 174) e modo intercorrente (art. 40 da LEF).
 * Sem React. Anos civis. Retroação ao pedido quando a constrição efetiva é verificada.
 */
import {
  addCalendarDays,
  addCalendarYears,
  daysBetween,
  daysUntil,
  fmtDate,
  localIso,
  normProc,
  sameProc,
  toDayKey,
} from './dates.js';
import { engineMoreGraveThanDecision, groupFromPrescDecision } from './presc-import.js';

export const PRESC_EVENT_TYPES = {
  marco_nao_localizacao: { label: 'Não localização do devedor', category: 'marco', color: 'var(--red)', desc: 'Ciência pela FP da não localização do devedor (art. 40, §1º LEF). Inicia automaticamente 1 ano de suspensão.' },
  marco_sem_bens: { label: 'Ausência de bens penhoráveis', category: 'marco', color: 'var(--red)', desc: 'Ciência pela FP da inexistência de bens penhoráveis. Inicia automaticamente 1 ano de suspensão (Tema 566).' },
  marco_insuficiencia_bens: { label: 'Insuficiência de bens penhoráveis', category: 'marco', color: 'var(--red)', desc: 'Aplicação analógica — insuficiência equiparada à inexistência (STJ).' },
  int_citacao: { label: 'Citação do devedor', category: 'interruptiva', color: 'var(--green)', desc: 'Citação válida interrompe prescrição (art. 174, p.ú., I CTN).' },
  int_penhora: { label: 'Penhora efetiva', category: 'interruptiva', color: 'var(--green)', desc: 'Efetiva constrição patrimonial. Mero peticionamento NÃO basta (Tema 568). O efeito retroage à data do pedido (4ª tese Tema 566).' },
  int_arresto: { label: 'Arresto / Bloqueio de bens', category: 'interruptiva', color: 'var(--green)', desc: 'Arresto ou bloqueio com resultado positivo (Tema 568 + AREsp 2.619.243/PE). Retroage à data do pedido.' },
  int_sisbajud: { label: 'Bloqueio via Sisbajud', category: 'interruptiva', color: 'var(--green)', desc: 'Constrição via Sisbajud com resultado positivo. Retroage à data do pedido se este entrou na janela de 1+5 anos.' },
  int_cnib: { label: 'Indisponibilidade CNIB/CCS', category: 'interruptiva', color: 'var(--green)', desc: 'Decretação de indisponibilidade com resultado útil. Na própria EF, interrompe. Via IDPJ/MCF, suspende as EFs abrangidas desde o pedido.' },
  int_reconhecimento: { label: 'Reconhecimento da dívida', category: 'interruptiva', color: 'var(--green)', desc: 'Ato inequívoco do devedor reconhecendo a dívida (art. 174, p.ú., IV CTN).' },
  int_despacho_citacao: { label: 'Despacho que ordena citação', category: 'interruptiva', color: 'var(--green)', desc: 'Despacho do juiz que ordena citação (art. 174, p.ú., I CTN — LC 118/2005).' },
  int_protesto_judicial: { label: 'Protesto judicial', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto judicial (art. 174, p.ú., II CTN).' },
  int_protesto_extrajudicial: { label: 'Protesto extrajudicial da CDA', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto extrajudicial da CDA (art. 174, p.ú., CTN, LC 208/2024). Só interrompe se lavrado a partir de 03/07/2024. Data: registro no cartório.' },
  int_outra: { label: 'Outra causa interruptiva', category: 'interruptiva', color: 'var(--green)', desc: 'Outra causa interruptiva com fundamentação.' },
  susp_parcelamento: { label: 'Parcelamento (efeito duplo)', category: 'suspensiva', color: 'var(--blue)', desc: 'Pedido/adesão interrompe (art. 174, p.ú., IV CTN; Súmula 653; TRF4) e suspende a exigibilidade enquanto vigente (art. 151, VI). Na intercorrente, após a rescisão conta-se 1 ano + 5 anos (modo 1+5, por equiparação ao art. 40 / Tema 566).' },
  int_rescisao_parcelamento: { label: 'Rescisão de parcelamento', category: 'interruptiva', color: 'var(--red)', desc: 'Fim da vigência. Originário: o quinquênio recomeça nesta data. Intercorrente: inicia o ciclo 1+5 (1 ano de suspensão + 5 anos), por equiparação da rescisão ao marco do art. 40.' },
  susp_embargos: { label: 'Embargos com efeito suspensivo', category: 'suspensiva', color: 'var(--blue)', desc: 'Embargos à execução recebidos com efeito suspensivo.' },
  susp_decisao_judicial: { label: 'Decisão judicial suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Liminar, tutela antecipada ou decisão judicial que suspende a exigibilidade.' },
  susp_deposito: { label: 'Depósito judicial integral', category: 'suspensiva', color: 'var(--blue)', desc: 'Depósito integral suspende exigibilidade (art. 151, II CTN).' },
  susp_falencia: { label: 'Falência / Recuperação judicial', category: 'suspensiva', color: 'var(--blue)', desc: 'Processo de falência ou recuperação judicial suspende prescrição.' },
  susp_art40: { label: 'Suspensão art. 40 LEF (1 ano)', category: 'suspensiva', color: 'var(--blue)', desc: 'Registro informativo do ano automático. O marco já inicia a suspensão — não soma um segundo ano.' },
  susp_idpj_mcf_constricao: { label: 'Constrição via IDPJ / Cautelar fiscal', category: 'suspensiva', color: 'var(--blue)', desc: 'Constrição efetiva no incidente (indisponibilidade/tutela). Suspende o prazo das EFs abrangidas desde a data do pedido; não interrompe o ciclo da originária. Cessada, retoma de onde parou. MCF: tese fazendária (não pacificada).' },
  susp_idpj_mcf: { label: 'Suspensão da execução (IDPJ / Cautelar)', category: 'suspensiva', color: 'var(--blue)', desc: 'A execução ficou suspensa por IDPJ ou cautelar, mesmo sem constrição. Não interrompe o ciclo. A prescrição intercorrente pausa até o fim do incidente.' },
  susp_outra: { label: 'Outra causa suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Outra causa suspensiva com fundamentação.' },
  info_peticao_sem_resultado: { label: 'Petição sem resultado útil', category: 'info', color: 'var(--text-muted)', desc: 'Mero peticionamento. NÃO interrompe (Tema 568).' },
  info_arquivamento: { label: 'Arquivamento (art. 40, §3º)', category: 'info', color: 'var(--text-muted)', desc: 'Arquivamento provisório após 1 ano de suspensão.' },
  info_desarquivamento: { label: 'Desarquivamento', category: 'info', color: 'var(--text-muted)', desc: 'Desarquivamento do feito.' },
  info_decisao_prescricao: { label: 'Decisão sobre prescrição', category: 'info', color: 'var(--text-muted)', desc: 'Decisão judicial relacionada à prescrição intercorrente.' },
  info_outro: { label: 'Outro evento', category: 'info', color: 'var(--text-muted)', desc: 'Registro informativo sem efeito no cômputo.' }
};

/**
 * Cadastro simplificado: 7 famílias. O motor continua lendo os tipos antigos
 * (eventos já gravados não se perdem). A família só escolhe o tipo concreto.
 */
export const PRESC_EVENT_FAMILIES = [
  {
    id: 'marco',
    label: 'Marco do art. 40 — ciência',
    desc: 'A Fazenda tomou ciência de que não achou o devedor ou bens. Só isso inicia o ciclo de 1 ano + 5 anos.',
    variants: [
      { type: 'marco_sem_bens', label: 'Não achou bens' },
      { type: 'marco_nao_localizacao', label: 'Não achou o devedor' },
      { type: 'marco_insuficiencia_bens', label: 'Bens insuficientes (analogia)' }
    ]
  },
  {
    id: 'resultado_util',
    label: 'Resultado útil — interrompe o art. 40',
    desc: 'Citação ou constrição com resultado. Pedido sem êxito não basta. Retroage à data do pedido se este entrou na janela de 1 ano + 5 anos.',
    variants: [
      { type: 'int_citacao', label: 'Citação efetiva' },
      { type: 'int_penhora', label: 'Penhora' },
      { type: 'int_sisbajud', label: 'Sisbajud positivo' },
      { type: 'int_arresto', label: 'Arresto / bloqueio' },
      { type: 'int_cnib', label: 'CNIB / CCS na própria EF' }
    ]
  },
  {
    id: 'parcelamento',
    label: 'Parcelamento',
    desc: 'Adesão interrompe e suspende. Enquanto vigente (evento ou status parcelada), some da fila de prazos. O app não pede a data de fim. Rescisão abre ciclo de 1 ano + 5 anos.',
    variants: [
      { type: 'susp_parcelamento', label: 'Adesão / pedido' },
      { type: 'int_rescisao_parcelamento', label: 'Rescisão / encerramento' }
    ]
  },
  {
    id: 'pausa',
    label: 'Pausa da exigibilidade (art. 151)',
    desc: 'O relógio para e depois retoma. Não zera o ciclo do art. 40.',
    variants: [
      { type: 'susp_embargos', label: 'Embargos com efeito suspensivo' },
      { type: 'susp_decisao_judicial', label: 'Liminar / decisão suspensiva' },
      { type: 'susp_deposito', label: 'Depósito integral' },
      { type: 'susp_falencia', label: 'Falência / recuperação' },
      { type: 'susp_outra', label: 'Outra causa' }
    ]
  },
  {
    id: 'idpj',
    label: 'IDPJ / Cautelar',
    desc: 'Constrição no incidente pausa desde o pedido e não encerra o ciclo. Suspensão da execução (mesmo sem constrição) também pausa a intercorrente até o fim do incidente.',
    variants: [
      { type: 'susp_idpj_mcf_constricao', label: 'Constrição no incidente' },
      { type: 'susp_idpj_mcf', label: 'Suspensão da execução (sem constrição)' }
    ]
  },
  {
    id: 'art174',
    label: 'Outras causas do art. 174',
    desc: 'Valem na prescrição ordinária. Na intercorrente não encerram o ciclo de 1 ano + 5 anos.',
    variants: [
      { type: 'int_despacho_citacao', label: 'Despacho que ordena citação' },
      { type: 'int_reconhecimento', label: 'Reconhecimento da dívida' },
      { type: 'int_protesto_judicial', label: 'Protesto judicial' },
      { type: 'int_protesto_extrajudicial', label: 'Protesto extrajudicial da CDA' },
      { type: 'int_outra', label: 'Outra (com nota)' }
    ]
  },
  {
    id: 'situacao',
    label: 'Situação do feito',
    desc: 'Arquivamento datado limita o prazo. Suspensão art. 40 com data, sem ciência lançada, vale como ciência com aviso.',
    variants: [
      { type: 'info_arquivamento', label: 'Arquivamento art. 40' },
      { type: 'susp_art40', label: 'Suspensão art. 40 (1 ano) — com data' },
      { type: 'info_peticao_sem_resultado', label: 'Pedido ainda sem resultado' },
      { type: 'info_desarquivamento', label: 'Desarquivamento' },
      { type: 'info_decisao_prescricao', label: 'Decisão sobre prescrição' },
      { type: 'info_outro', label: 'Outro registro' }
    ]
  }
];

export function familyOfPrescEvent(type) {
  const t = type === 'int_citacao_devedor' ? 'int_citacao' : type;
  return PRESC_EVENT_FAMILIES.find(f => f.variants.some(v => v.type === t)) || null;
}

export const PARC_RESTART_ONE_PLUS_FIVE = '1+5';
export const PARC_RESTART_FIVE_ONLY = '5';
export const RULE_VERSION = '2026.09';

/** Constrição na própria EF: interrompe a intercorrente. */
export const EF_CONSTRICTION_TYPES = new Set(['int_penhora', 'int_arresto', 'int_sisbajud', 'int_cnib']);
/** Alias legado — tratado como int_citacao. */
export const CITACAO_ALIASES = new Set(['int_citacao', 'int_citacao_devedor']);

export const IDPJ_CONSTRICTION_TYPE = 'susp_idpj_mcf_constricao';
export const IDPJ_STAY_TYPE = 'susp_idpj_mcf';

export const normalizePrescEventType = (type) => (type === 'int_citacao_devedor' ? 'int_citacao' : type);

/** Tipos com duas datas: pedido (retroação) e efetivação. */
export function eventNeedsRequestDate(type) {
  const t = normalizePrescEventType(type);
  return EF_CONSTRICTION_TYPES.has(t) || t === IDPJ_CONSTRICTION_TYPE || CITACAO_ALIASES.has(t);
}

/** Se o pedido veio vazio, grava igual à efetivação — o formulário não perde a âncora. */
export function fillRequestDate(evt) {
  if (!evt) return evt;
  const type = normalizePrescEventType(evt.type);
  const next = { ...evt, type };
  if (eventNeedsRequestDate(type) && !asIso(next.requestDate) && asIso(next.date)) {
    next.requestDate = asIso(next.date);
  }
  return next;
}

/** Modalidades de lançamento — definem a regra do dies a quo da decadência. */
export const LAUNCH_MODES = {
  homologacao_pagamento: { label: 'Homologação — com pagamento antecipado', rule: '150_4', desc: 'Art. 150, §4º, CTN: decadência conta da data do fato gerador (Tema 163/STJ).' },
  homologacao_sem_pagamento: { label: 'Homologação — sem pagamento nem declaração', rule: '173_1', desc: 'Art. 173, I, CTN: 1º dia do exercício seguinte (Súmula 555/STJ).' },
  oficio: { label: 'Lançamento de ofício / auto de infração', rule: '173_1', desc: 'Art. 173, I, CTN: 1º dia do exercício seguinte àquele em que o lançamento poderia ter sido efetuado.' },
  declarado: { label: 'Declarado pelo contribuinte (DCTF/GFIP/GIA)', rule: 'declarado', desc: 'Súmula 436/STJ: a declaração constitui o crédito — decadência prejudicada; prescrição conta da entrega ou do vencimento, o que for posterior.' },
  vicio_formal: { label: 'Relançamento — anulação por vício formal', rule: '173_2', desc: 'Art. 173, II, CTN: novo quinquênio conta da decisão definitiva que anulou o lançamento.' },
};

/** Heurística: sugere a modalidade a partir do texto do SIDA (Forma de Constituição / Doc. de Origem). */
export function suggestLaunchMode(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return '';
  if (/dctf|gfip|gia\b|dirf|per\/?dcomp|declara|confiss/.test(t)) return 'declarado';
  if (/auto de infra|notifica[çc][ãa]o de lan[çc]amento|lan[çc]amento de of[ií]cio|\bai\b|nfld/.test(t)) return 'oficio';
  return '';
}

const asIso = (v) => toDayKey(v) || '';

/** Vigência da LC 208/2024 — protesto extrajudicial só interrompe a partir desta data. */
export const LC208_VIGENCIA = '2024-07-03';

export function protestoExtrajudicialInterrompe(iso) {
  const d = asIso(iso);
  return !!(d && d >= LC208_VIGENCIA);
}

export const PRESC_FLAGS = {
  PARC_SEM_FIM: 'parc_sem_fim',
  PEDIDO_SEM_DESFECHO: 'pedido_sem_desfecho'
};

const emptyResult = (overrides = {}) => ({
  segment: null,
  origin: 'estimativa',
  phase: 'sem_dados',
  status: 'sem_dados',
  diesAQuo: null,
  diesAdQuem: null,
  daysLeft: null,
  detail: 'Sem dados para calcular.',
  memory: [],
  gaps: [],
  timeline: [],
  prescriptionInterrupted: false,
  prescDaysConsumed: 0,
  suspDaysConsumed: 0,
  activeSuspensions: [],
  flags: [],
  bounds: null,
  cycleKind: null,
  parcRestartMode: PARC_RESTART_ONE_PLUS_FIVE,
  scenario: '',
  summary: '',
  occurrences: [],
  estimates: [],
  checks: [],
  rulesApplied: [],
  ruleVersion: RULE_VERSION,
  estimated: false,
  altWithoutIncident: null,
  incidents: [],
  informedDate: '',
  forecastDate: '',
  informedConflict: false,
  ...overrides
});

const statusFrom = (phase, daysLeft) => {
  if (phase === 'estimado') {
    if (daysLeft == null) return 'alerta';
    if (daysLeft <= 0) return 'alerta';
    if (daysLeft <= 365) return 'critico';
    if (daysLeft <= 730) return 'alerta';
    return 'correndo';
  }
  if (phase === 'consumado' || (daysLeft != null && daysLeft <= 0 && (phase === 'correndo' || phase === 'originario'))) return 'prescrito';
  if (phase === 'nao_iniciado') return 'indeterminado';
  if (phase === 'interrompido') return 'interrompido';
  if (phase === 'suspenso' || phase === 'suspenso_art151') return 'suspenso';
  if (daysLeft == null) return 'sem_dados';
  if (daysLeft <= 365) return 'critico';
  if (daysLeft <= 730) return 'alerta';
  return 'correndo';
};

function parcRestartModeOf(debt, exec) {
  const raw = (debt && debt.parcRestartMode) || (exec && exec.parcRestartMode) || PARC_RESTART_ONE_PLUS_FIVE;
  return raw === PARC_RESTART_FIVE_ONLY ? PARC_RESTART_FIVE_ONLY : PARC_RESTART_ONE_PLUS_FIVE;
}

function pickFiscalExec(matchingExecs) {
  if (!matchingExecs || !matchingExecs.length) return null;
  const efs = matchingExecs.filter(e => e && e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  return efs[0] || null;
}

export const prescOriginLabel = (r) => {
  if (!r) return '';
  if (r.origin === 'data_informada') return 'informada';
  if (r.origin === 'calculo_validado') return 'calculada';
  if (r.origin === 'estimativa_pessimista') return 'estimado';
  if (r.origin === 'estimativa') return 'estimativa';
  return '';
};

function isBareExecEvent(e) {
  return !!(e && e.executionId && !e.cdaId && (!e.batchCdaIds || e.batchCdaIds.length === 0));
}

/** Índices O(1) para collectEventsForCda — createPrescLookup monta uma vez e reusa em todas as CDAs. */
function buildPrescCollectIndex(executions, events) {
  const execByProc = new Map();
  const execsByProc = new Map();
  const execById = new Map();
  for (const e of executions || []) {
    if (e && e.id) execById.set(e.id, e);
    const n = normProc(e && e.processNumber);
    if (n) {
      if (!execByProc.has(n)) execByProc.set(n, e); // compatibilidade: primeiro registro
      if (!execsByProc.has(n)) execsByProc.set(n, []);
      execsByProc.get(n).push(e);
    }
  }
  const byCda = new Map();
  const byExecBare = new Map();
  const byInheritedParent = new Map();
  const idpjByLinkedExec = new Map();
  const push = (map, key, ev) => {
    if (!key) return;
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(ev);
  };
  for (const e of executions || []) {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) continue;
    for (const linkedId of e.linkedExecutionIds || []) {
      if (!linkedId) continue;
      let arr = idpjByLinkedExec.get(linkedId);
      if (!arr) { arr = []; idpjByLinkedExec.set(linkedId, arr); }
      arr.push(e.id);
    }
  }
  for (const ev of events || []) {
    if (!ev) continue;
    if (ev.cdaId) push(byCda, ev.cdaId, ev);
    if (ev.batchCdaIds && ev.batchCdaIds.length) {
      for (const id of ev.batchCdaIds) push(byCda, id, ev);
    }
    if (isBareExecEvent(ev)) push(byExecBare, ev.executionId, ev);
    if (ev._inheritedFromParent) push(byInheritedParent, ev._inheritedFromParent, ev);
  }
  return { execByProc, execsByProc, execById, byCda, byExecBare, byInheritedParent, idpjByLinkedExec };
}

export function collectEventsForCda(debt, executions, events, collectIndex) {
  const execs = executions || [];
  const evts = events || [];
  const matchingExecs = debt && debt.processNumber
    ? (collectIndex
      ? (collectIndex.execsByProc?.get(normProc(debt.processNumber)) || (collectIndex.execByProc.get(normProc(debt.processNumber)) ? [collectIndex.execByProc.get(normProc(debt.processNumber))] : []))
      : execs.filter(e => sameProc(e.processNumber, debt.processNumber)))
    : [];
  const exec = pickFiscalExec(matchingExecs);
  const incidentOnly = !exec && matchingExecs.some(e => e && (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal'));
  let direct;
  if (collectIndex) {
    direct = [
      ...(collectIndex.byCda.get(debt && debt.id) || []),
      ...matchingExecs.flatMap(item => collectIndex.byExecBare.get(item.id) || []),
    ];
  } else {
    const matchingIds = new Set(matchingExecs.map(item => item.id));
    direct = evts.filter(e =>
      e.cdaId === debt.id ||
      (e.batchCdaIds && e.batchCdaIds.includes(debt.id)) ||
      (isBareExecEvent(e) && matchingIds.has(e.executionId))
    );
  }
  let inherited = [];
  const parentIds = new Set(matchingExecs.map(item => item.parentExecutionId).filter(Boolean));
  if (parentIds.size > 0) {
    if (collectIndex) {
      inherited = [...parentIds].flatMap(parentId => [
        ...(collectIndex.byExecBare.get(parentId) || []),
        ...(collectIndex.byInheritedParent.get(parentId) || []),
      ]);
    } else {
      inherited = evts.filter(e =>
        (isBareExecEvent(e) && parentIds.has(e.executionId)) ||
        parentIds.has(e._inheritedFromParent)
      );
    }
  }
  const coveringIds = coveringIdpjIds(matchingExecs, execs, collectIndex);
  if (coveringIds.size) {
    const alreadyFrom = new Set();
    for (const e of direct) if (e && e._inheritedFromIDPJ) alreadyFrom.add(e._inheritedFromIDPJ);
    for (const e of inherited) if (e && e._inheritedFromIDPJ) alreadyFrom.add(e._inheritedFromIDPJ);
    for (const idpjId of coveringIds) {
      if (alreadyFrom.has(idpjId)) continue;
      const src = collectIndex
        ? (collectIndex.byExecBare.get(idpjId) || [])
        : evts.filter(e => isBareExecEvent(e) && e.executionId === idpjId);
      for (const ev of src) {
        if (!ev) continue;
        inherited.push(mapCoveringIdpjEvent(ev, idpjId));
      }
    }
  }
  const seen = new Set();
  const merged = [];
  for (const e of [...direct, ...inherited]) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  merged.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  return { exec, events: merged, incidentOnly, incidents: listIncidents(matchingExecs, execs, evts, collectIndex) };
}

function listIncidents(matchingExecs, executions, events, collectIndex) {
  const ids = coveringIdpjIds(matchingExecs, executions, collectIndex);
  if (!ids.size) return [];
  const byId = collectIndex && collectIndex.execById
    ? collectIndex.execById
    : new Map((executions || []).filter(e => e && e.id).map(e => [e.id, e]));
  const incidents = [];
  for (const id of ids) {
    const inc = byId.get(id);
    if (!inc) continue;
    const src = collectIndex
      ? (collectIndex.byExecBare.get(id) || [])
      : (events || []).filter(e => isBareExecEvent(e) && e.executionId === id);
    const cons = src.filter(e => normalizePrescEventType(e.type) === IDPJ_CONSTRICTION_TYPE && asIso(e.date));
    const stays = src.filter(e => normalizePrescEventType(e.type) === IDPJ_STAY_TYPE && asIso(e.date));
    incidents.push({
      id: inc.id,
      processNumber: inc.processNumber || '',
      tag: inc.processTag === 'cautelar_fiscal' ? 'cautelar_fiscal' : 'idpj',
      hasConstriction: cons.length > 0,
      constrictionOpen: cons.some(e => !asIso(e.endDate)),
      hasStay: stays.length > 0,
      stayOpen: stays.some(e => !asIso(e.endDate)),
      status: inc.status || ''
    });
  }
  return incidents;
}

function coveringIdpjIds(matchingExecs, executions, collectIndex) {
  const ids = new Set();
  if (!matchingExecs.length) return ids;
  if (collectIndex && collectIndex.idpjByLinkedExec) {
    for (const item of matchingExecs) {
      const arr = collectIndex.idpjByLinkedExec.get(item.id);
      if (arr) for (const id of arr) ids.add(id);
    }
    return ids;
  }
  const execIds = new Set(matchingExecs.map(item => item.id));
  for (const e of executions || []) {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) continue;
    const linked = e.linkedExecutionIds || [];
    for (let i = 0; i < linked.length; i++) {
      if (execIds.has(linked[i])) { ids.add(e.id); break; }
    }
  }
  return ids;
}

function mapCoveringIdpjEvent(ev, idpjId) {
  const mapped = shouldPropagateIdpjAsSuspension(ev.type)
    ? { ...idpjPropagationPayload(ev), _inheritedFromIDPJ: idpjId }
    : { ...ev, _inheritedFromIDPJ: ev._inheritedFromIDPJ || idpjId };
  return mapped;
}

/** Data em que o efeito entra na linha do tempo: pedido (se constrição verificada) ou a data do fato. */
function sortKey(evt) {
  const type = normalizePrescEventType(evt.type);
  const efetivacao = asIso(evt.date);
  const pedido = asIso(evt.requestDate);
  const verifiedConstriction = efetivacao && (EF_CONSTRICTION_TYPES.has(type) || type === IDPJ_CONSTRICTION_TYPE || CITACAO_ALIASES.has(type));
  if (verifiedConstriction && pedido) return pedido;
  return efetivacao || pedido || '9999';
}

function pausedAt(iso, pauses) {
  return pauses.some(p => p.start <= iso && (!p.end || iso < p.end));
}

/**
 * Parcelamento sem cessação no cadastro não permanece vigente se há adesão ou
 * rescisão posterior — a importação Debcad/SIDA costuma omitir o encerramento
 * dos parcelamentos intermediários, e tratar o intervalo até hoje infla o originário.
 * Map: eventId → { end, reason: 'adesao_seguinte'|'rescisao' }
 */
export function inferParcelamentoEnds(cdaEvents) {
  const parcs = (cdaEvents || [])
    .filter(e => normalizePrescEventType(e.type) === 'susp_parcelamento' && asIso(e.date))
    .sort((a, b) => asIso(a.date).localeCompare(asIso(b.date)) || String(a.id || '').localeCompare(String(b.id || '')));
  const rescisoes = (cdaEvents || [])
    .filter(e => normalizePrescEventType(e.type) === 'int_rescisao_parcelamento' && asIso(e.date))
    .map(e => asIso(e.date))
    .sort();
  const inferred = new Map();
  for (let i = 0; i < parcs.length; i++) {
    if (asIso(parcs[i].endDate)) continue;
    const start = asIso(parcs[i].date);
    const nextStart = parcs[i + 1] ? asIso(parcs[i + 1].date) : '';
    const nextParc = nextStart && nextStart > start ? nextStart : '';
    const nextResc = rescisoes.find(d => d > start && (!nextParc || d < nextParc));
    if (nextResc) inferred.set(parcs[i].id, { end: nextResc, reason: 'rescisao' });
    else if (nextParc) inferred.set(parcs[i].id, { end: nextParc, reason: 'adesao_seguinte' });
  }
  return inferred;
}

function resolvedSuspEnd(evt, asOfIso, inferredEnds) {
  const type = normalizePrescEventType(evt.type);
  const stored = asIso(evt.endDate);
  const inferred = (!stored && type === 'susp_parcelamento') ? inferredEnds.get(evt.id) : null;
  const rawEnd = stored || (inferred && inferred.end) || '';
  const end = rawEnd || asOfIso;
  return {
    stored,
    inferred,
    rawEnd,
    end,
    ongoing: !rawEnd || rawEnd > asOfIso,
    openWithoutProof: false
  };
}

function pauseIntervals(pauses) {
  return (pauses || [])
    .filter(p => p && p.start)
    .map(p => ({ start: p.start, end: p.end || '9999-12-31' }))
    .filter(p => p.end > p.start)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

function skipCoveringPauses(startIso, intervals) {
  let d = startIso;
  let guard = 0;
  while (guard++ < 100) {
    const covering = intervals.find(p => p.start <= d && d < p.end);
    if (!covering) return d;
    d = covering.end;
  }
  return d;
}

/**
 * Avança `need` dias não pausados. O dia em que a pausa começa não entra no vão
 * disponível (sem o −1 que deslocava o termo em um dia).
 */
export function addUnpausedDays(startIso, need, pauses) {
  if (need <= 0) return startIso;
  const intervals = pauseIntervals(pauses);
  let d = startIso;
  let remaining = need;
  let guard = 0;
  while (remaining > 0 && guard++ < 10000) {
    const covering = intervals.find(p => p.start <= d && d < p.end);
    if (covering) {
      d = covering.end;
      continue;
    }
    const next = intervals.find(p => p.start > d);
    if (!next) return addCalendarDays(d, remaining);
    const gap = Math.max(0, daysBetween(d, next.start));
    if (remaining <= gap) return addCalendarDays(d, remaining);
    remaining -= gap;
    d = next.start;
  }
  return addCalendarDays(d, remaining);
}

/** Anos civis com o relógio parado nas pausas (evita dia extra por ano bissexto). */
export function addUnpausedCalendarYears(startIso, years, pauses) {
  if (!startIso || years <= 0) return startIso;
  const intervals = pauseIntervals(pauses);
  const start = skipCoveringPauses(startIso, intervals);
  let end = addCalendarYears(start, years);
  for (let n = 0; n < 40; n++) {
    let extra = 0;
    for (const p of intervals) {
      const ps = p.start < start ? start : p.start;
      const pe = p.end > end ? end : p.end;
      if (pe > ps) extra += daysBetween(ps, pe);
    }
    const next = extra ? addCalendarDays(addCalendarYears(start, years), extra) : addCalendarYears(start, years);
    if (next === end) return end;
    end = next;
  }
  return end;
}

function yearSpanDays(startIso, years) {
  const end = addCalendarYears(startIso, years);
  return Math.max(0, daysBetween(startIso, end));
}

/** 1 ano de suspensão (art. 40) + 5 anos civis, descontadas pausas. */
function addArt40PlusFive(startIso, pauses) {
  const art40End = addUnpausedCalendarYears(startIso, 1, pauses);
  return { art40End, diesAdQuem: addUnpausedCalendarYears(art40End, 5, pauses) };
}

/** Ciclo da rescisão: 1 ano + 5 anos (padrão) ou só 5 anos. */
function addParcCycle(startIso, pauses, mode) {
  if (mode === PARC_RESTART_FIVE_ONLY) {
    return { art40End: startIso, diesAdQuem: addUnpausedCalendarYears(startIso, 5, pauses) };
  }
  return addArt40PlusFive(startIso, pauses);
}

function noteDuplicateConstriction(cdaEvents, gaps) {
  const byDay = new Map();
  for (const e of cdaEvents || []) {
    const t = normalizePrescEventType(e.type);
    if (!EF_CONSTRICTION_TYPES.has(t) && t !== IDPJ_CONSTRICTION_TYPE) continue;
    const day = asIso(e.requestDate) || asIso(e.date);
    if (!day) continue;
    if (!byDay.has(day)) byDay.set(day, new Set());
    byDay.get(day).add(t);
  }
  for (const [day, types] of byDay) {
    if (types.has('int_sisbajud') && types.has(IDPJ_CONSTRICTION_TYPE)) {
      gaps.push(`Sisbajud e constrição via IDPJ/cautelar no mesmo pedido (${fmtDate(day)}). Conferir se é a mesma diligência — o efeito não se duplica.`);
    }
  }
}

function memPush(memory, date, label, effect) {
  memory.push({ date, event: label, effect });
}

/**
 * @param {{ debt: object, executions?: object[], events?: object[], asOf?: string|Date }} args
 */
export function computePrescription({ debt, executions = [], events = [], asOf, collectIndex } = {}) {
  if (!debt) return emptyResult();
  const asOfIso = asIso(asOf) || localIso(new Date());
  const { exec, events: cdaEvents, incidentOnly, incidents } = collectEventsForCda(debt, executions, events, collectIndex);
  const memory = [];
  const gaps = [];
  const timeline = [];

  const informed = asIso(debt.prescriptionDate);
  const forecast = exec ? asIso(exec.prescriptionForecast) : '';

  if (incidentOnly) {
    gaps.push('O número de processo desta CDA coincide com um IDPJ/cautelar, não com uma execução fiscal. A intercorrente do art. 40 não se calcula pelo protocolo do incidente.');
  }

  if (!exec) {
    return withCaseView(computeOriginario({
      debt, exec: null, cdaEvents, asOfIso, informed, memory, gaps, timeline, incidents
    }), { debt, exec: null, asOfIso, incidents, cdaEvents });
  }

  const args = { debt, exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline, incidents };
  let r = computeIntercorrente(args);
  const hasIdpjPause = cdaEvents.some(e => normalizePrescEventType(e.type) === IDPJ_CONSTRICTION_TYPE && asIso(e.date));
  if (hasIdpjPause) {
    const alt = computeIntercorrente({
      ...args,
      skipIdpjPauses: true,
      memory: [],
      gaps: [],
      timeline: []
    });
    r.altWithoutIncident = {
      diesAdQuem: alt.diesAdQuem,
      daysLeft: alt.daysLeft,
      phase: alt.phase
    };
  }
  r.incidents = incidents;
  return withCaseView(r, { debt, exec, asOfIso, incidents, cdaEvents });
}

function applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup, originario }) {
  const pauses = [];
  const inferredEnds = inferParcelamentoEnds(cdaEvents);
  for (const evt of cdaEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type];
    if (!meta || meta.category !== 'suspensiva') continue;
    if (skipArt40Dup && type === 'susp_art40') continue;
    if (type === IDPJ_CONSTRICTION_TYPE && !asIso(evt.date)) continue;
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;
    const start = asIso(evt.requestDate) || efetivacao;
    if (start > asOfIso) continue;
    const resolved = resolvedSuspEnd(evt, asOfIso, inferredEnds);
    if (resolved.end <= start) continue;
    pauses.push({
      id: evt.id,
      start,
      end: resolved.end,
      type,
      originario,
      ongoing: resolved.ongoing,
      inferredEnd: resolved.inferred || null
    });
  }
  return pauses;
}

function computeOriginario({ debt, exec = null, cdaEvents, asOfIso, informed, memory, gaps, timeline, incidents = [] }) {
  const constitution = asIso(debt.constitutionDate);
  const start = constitution || asIso(debt.inscriptionDate);
  const protocol = exec ? (asIso(exec.protocolDate) || asIso(debt.protocolDate)) : '';
  if (!start && exec) {
    gaps.push('Sem âncora de constituição/inscrição para o quinquênio do art. 174.');
    return {
      ...emptyResult(),
      segment: 'credito',
      origin: 'estimativa',
      phase: 'interrompido',
      status: 'seguro',
      detail: 'Ajuizada — prescrição ordinária interrompida com retroação à propositura. Sem âncora para reconstituir o quinquênio.',
      prescriptionInterrupted: true,
      memory, gaps, timeline, incidents
    };
  }
  if (!start && !informed) {
    return emptyResult({
      segment: 'credito',
      gaps: ['Sem data de inscrição nem data informada.'],
      memory, timeline, incidents
    });
  }
  if (!start) gaps.push('Sem inscrição — usando só a data informada.');
  else if (!constitution && !asIso(debt.firstChargeDate)) {
    gaps.push('Âncora é a inscrição, não a constituição definitiva.');
  }

  let originStart = start;
  let pauses = applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup: true, originario: true });
  if (exec && protocol) {
    pauses = pauses.map(p => {
      if (p.start > protocol) return null;
      const end = p.end && p.end > protocol ? protocol : p.end;
      if (!end || end <= p.start) return null;
      return { ...p, end };
    }).filter(Boolean);
  }
  const inferredEnds = inferParcelamentoEnds(cdaEvents);

  if (!exec) {
    const citacaoOrdem = cdaEvents.some(e => {
      const t = normalizePrescEventType(e.type);
      return (t === 'int_despacho_citacao' || CITACAO_ALIASES.has(t)) && asIso(e.date);
    });
    if (citacaoOrdem) {
      gaps.push('Há despacho que ordena citação (ou citação) sem execução vinculada. Conferir se a CDA foi ajuizada ou se o ajuizamento foi desfeito (retrocesso).');
    }
  }

  for (const evt of cdaEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type];
    if (!meta) continue;
    const efetivacao = asIso(evt.date);
    if (!efetivacao || efetivacao > asOfIso) continue;
    const effectDate = (EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type)) && asIso(evt.requestDate)
      ? asIso(evt.requestDate) : efetivacao;

    if (exec && protocol && effectDate > protocol) {
      timeline.push({ ...evt, effect: 'posterior ao ajuizamento — não afeta o art. 174', phase: 'originario' });
      continue;
    }

    const inferred = type === 'susp_parcelamento' ? inferredEnds.get(evt.id) : null;

    if (type === 'int_protesto_extrajudicial' && !protestoExtrajudicialInterrompe(effectDate)) {
      memPush(memory, effectDate, meta.label, `Protesto anterior à vigência da LC 208/2024 (${fmtDate(LC208_VIGENCIA)}) — não interrompe o art. 174.`);
      gaps.push(`Protesto extrajudicial de ${fmtDate(effectDate)} é anterior a ${fmtDate(LC208_VIGENCIA)} e não interrompe.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'originario' });
      continue;
    }

    if (meta.category === 'interruptiva' || type === 'susp_parcelamento') {
      if (type === 'int_rescisao_parcelamento' || type === 'susp_parcelamento' || meta.category === 'interruptiva') {
        originStart = effectDate;
        let parcEffect = 'Interrompe o originário (Súmula 653) e suspende enquanto vigente.';
        if (type === 'susp_parcelamento' && inferred) {
          const how = inferred.reason === 'rescisao' ? 'rescisão posterior' : 'adesão seguinte';
          parcEffect = `Interrompe o originário (Súmula 653) e suspende enquanto vigente. Sem cessação no cadastro — suspensão encerrada pela ${how} em ${fmtDate(inferred.end)}.`;
        } else if (type === 'susp_parcelamento' && !asIso(evt.endDate)) {
          parcEffect = 'Interrompe o originário (Súmula 653) e suspende enquanto vigente. O app não pede a data de fim.';
        }
        memPush(memory, effectDate, meta.label, type === 'susp_parcelamento'
          ? parcEffect
          : 'Interrompe — quinquênio reinicia.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'originario' });
      }
    } else if (meta.category === 'suspensiva' && type !== 'susp_art40') {
      const from = asIso(evt.requestDate) || efetivacao;
      memPush(memory, from, meta.label, `Suspende até ${evt.endDate ? fmtDate(evt.endDate) : 'hoje'}.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'originario' });
    } else if (meta.category === 'info') {
      timeline.push({ ...evt, effect: meta.desc, phase: 'originario' });
    }
  }

  if (!originStart && informed) {
    return {
      ...emptyResult(),
      segment: 'credito',
      origin: 'data_informada',
      phase: 'originario',
      diesAdQuem: informed,
      daysLeft: daysUntil(informed, asOfIso),
      status: statusFrom('originario', daysUntil(informed, asOfIso)),
      detail: 'Data de prescrição informada (sem âncora de inscrição).',
      memory, gaps, timeline, incidents
    };
  }

  const diesAdQuemComputed = addUnpausedCalendarYears(originStart, 5, pauses);
  const need = yearSpanDays(originStart, 5);
  const activeNow = pauses.filter(p => p.ongoing);

  // Ajuizada: o quinquênio do art. 174 termina no ajuizamento.
  if (exec) {
    const originExec = constitution || cdaEvents.some(e => PRESC_EVENT_TYPES[normalizePrescEventType(e.type)]) ? 'calculo_validado' : 'estimativa';
    memPush(memory, originStart, 'Dies a quo', constitution
      ? 'Constituição definitiva do crédito (art. 174, caput, CTN).'
      : 'Inscrição em dívida ativa — estimativa; a âncora legal é a constituição definitiva.');
    memPush(memory, diesAdQuemComputed, 'Termo final projetado', '5 anos civis, descontadas suspensões do art. 151 CTN.');
    if (protocol && protocol > diesAdQuemComputed) {
      memPush(memory, protocol, 'Ajuizamento', 'APÓS o termo final do quinquênio — risco de prescrição ordinária consumada antes da propositura.');
      return {
        segment: 'credito', origin: originExec, phase: 'consumado', status: 'prescrito',
        diesAQuo: originStart, diesAdQuem: diesAdQuemComputed, daysLeft: daysUntil(diesAdQuemComputed, asOfIso),
        detail: `Prescrição ordinária consumada em ${fmtDate(diesAdQuemComputed)}, antes do ajuizamento (${fmtDate(protocol)}). Verificar causas interruptivas não registradas anteriores à propositura.`,
        memory, gaps, timeline, incidents,
        prescriptionInterrupted: false, prescDaysConsumed: need, suspDaysConsumed: 0,
        activeSuspensions: activeNow.map(p => p.id)
      };
    }
    if (protocol) {
      memPush(memory, protocol, 'Ajuizamento', 'Interrompe a prescrição com retroação à propositura (art. 174, p.ú., I, CTN; Tema 383/STJ).');
    } else {
      gaps.push('Data de protocolo da execução não informada — interrupção presumida pelo ajuizamento (Tema 383).');
    }
    return {
      segment: 'credito', origin: originExec, phase: 'interrompido', status: 'seguro',
      diesAQuo: originStart, diesAdQuem: null, daysLeft: null,
      detail: `Ajuizada em ${protocol ? fmtDate(protocol) : 'data não informada'}, dentro dos 5 anos contados de ${fmtDate(originStart)}. Prazo interrompido pela propositura.`,
      memory, gaps, timeline, incidents,
      prescriptionInterrupted: true, prescDaysConsumed: 0, suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    };
  }

  const diesAdQuem = diesAdQuemComputed;
  const origin = constitution || cdaEvents.some(e => PRESC_EVENT_TYPES[normalizePrescEventType(e.type)]) ? 'calculo_validado' : 'estimativa';
  if (!exec && activeNow.some(p => p.type === 'susp_parcelamento')) {
    return {
      segment: 'credito',
      origin,
      phase: 'suspenso',
      status: 'suspenso',
      diesAQuo: originStart,
      diesAdQuem: null,
      daysLeft: null,
      detail: 'Parcelamento vigente. O prazo ordinário não corre. Na rescisão, o quinquênio recomeça.',
      memory, gaps, timeline, incidents,
      prescriptionInterrupted: true, prescDaysConsumed: 0, suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    };
  }
  if (informed && informed !== diesAdQuemComputed) {
    gaps.push(`Data digitada na CDA (${fmtDate(informed)}) diverge do termo calculado (${fmtDate(diesAdQuemComputed)}). O cálculo prevalece.`);
  }
  const daysLeft = daysUntil(diesAdQuem, asOfIso);
  let phase = 'originario';
  if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
  else if (activeNow.filter(p => !diesAdQuem || p.start < diesAdQuem).length) phase = 'suspenso';

  memPush(memory, originStart, 'Dies a quo', constitution
    ? 'Constituição definitiva do crédito (art. 174, caput, CTN).'
    : `Início do quinquênio originário (${origin === 'estimativa' ? 'inscrição + 5, estimativa' : 'após último interruptivo'}).`);
  memPush(memory, diesAdQuemComputed, 'Dies ad quem (calculado)', `5 anos civis, descontadas suspensões.`);

  return {
    segment: 'credito',
    origin,
    phase,
    status: statusFrom(phase === 'originario' ? 'correndo' : phase, daysLeft),
    diesAQuo: originStart,
    diesAdQuem,
    daysLeft,
    detail: phase === 'consumado'
      ? `Prescrição originária consumada em ${fmtDate(diesAdQuem)}.`
      : (phase === 'suspenso'
        ? `Originário suspenso. Termo final projetado: ${fmtDate(diesAdQuem)}.`
        : `Prescrição originária: ${fmtDate(originStart)} + 5 anos → ${fmtDate(diesAdQuem)}${origin === 'estimativa' ? ' (estimativa: inscrição)' : ''}.`),
    memory, gaps, timeline, incidents,
    prescriptionInterrupted: false,
    prescDaysConsumed: Math.max(0, need - Math.max(0, daysLeft || 0)),
    suspDaysConsumed: 0,
    activeSuspensions: activeNow.map(p => p.id),
    flags: [],
    informedDate: informed || '',
    informedConflict: !!(informed && informed !== diesAdQuemComputed)
  };
}

function intercorrenteWindowEnd({ marco, parcRestartAt, pauses, beforeIso, mode }) {
  const relevant = beforeIso ? pauses.filter(p => p.start < beforeIso) : pauses;
  if (parcRestartAt) {
    return addParcCycle(parcRestartAt, relevant, mode).diesAdQuem;
  }
  if (!marco) return null;
  return addArt40PlusFive(marco, relevant).diesAdQuem;
}

const FLOOR_ANCHOR_LABEL = {
  protocolo: 'protocolo da execução',
  citacao: 'citação efetiva',
  despacho: 'despacho que ordena citação',
  constricao: 'constrição útil antes da ciência'
};

export function computeIntercorrenteBounds({ exec, debt, cdaEvents = [], asOfIso } = {}) {
  const asOf = asIso(asOfIso) || localIso(new Date());
  const anchors = [];
  const protocol = asIso(exec && exec.protocolDate) || asIso(debt && debt.protocolDate);
  if (protocol && protocol <= asOf) anchors.push({ iso: protocol, kind: 'protocolo' });
  for (const e of cdaEvents || []) {
    const t = normalizePrescEventType(e.type);
    const d = asIso(e.date);
    const req = asIso(e.requestDate);
    const iso = req || d;
    if (!iso || iso > asOf) continue;
    if (CITACAO_ALIASES.has(t)) anchors.push({ iso, kind: 'citacao' });
    else if (t === 'int_despacho_citacao') anchors.push({ iso, kind: 'despacho' });
    else if (EF_CONSTRICTION_TYPES.has(t)) anchors.push({ iso, kind: 'constricao' });
  }
  anchors.sort((a, b) => a.iso.localeCompare(b.iso));
  const latest = anchors.length ? anchors[anchors.length - 1] : null;
  const floor = latest ? addCalendarYears(latest.iso, 6) : null;
  const pauses = applyPausesFromEvents(cdaEvents, asOf, { skipArt40Dup: true, originario: false });
  let ceiling = null;
  for (const e of cdaEvents || []) {
    if (normalizePrescEventType(e.type) !== 'info_arquivamento') continue;
    const a = asIso(e.date);
    if (!a || a > asOf) continue;
    let extra = 0;
    for (const p of pauses) {
      if (!p.start || p.start < a) continue;
      const pe = p.end && p.end < '9999-12-31' ? p.end : asOf;
      if (pe > p.start) extra += daysBetween(p.start, pe);
    }
    const cand = extra ? addCalendarDays(addCalendarYears(a, 6), extra) : addCalendarYears(a, 6);
    if (!ceiling || cand < ceiling) ceiling = cand;
  }
  return {
    floor,
    floorDays: floor ? daysUntil(floor, asOf) : null,
    floorAnchor: latest,
    ceiling,
    ceilingDays: ceiling ? daysUntil(ceiling, asOf) : null
  };
}

const CASE_FACT = {
  marco_nao_localizacao: 'Ciência de não localização do devedor',
  marco_sem_bens: 'Ciência de ausência de bens',
  marco_insuficiencia_bens: 'Ciência de insuficiência de bens',
  int_citacao: 'Citação do devedor',
  int_penhora: 'Penhora efetiva',
  int_arresto: 'Arresto / bloqueio',
  int_sisbajud: 'Bloqueio Sisbajud',
  int_cnib: 'Indisponibilidade CNIB/CCS',
  int_reconhecimento: 'Reconhecimento da dívida',
  int_despacho_citacao: 'Despacho que ordena citação',
  int_protesto_judicial: 'Protesto judicial',
  int_protesto_extrajudicial: 'Protesto extrajudicial da CDA',
  int_outra: 'Outra causa interruptiva',
  susp_parcelamento: 'Parcelamento — adesão',
  int_rescisao_parcelamento: 'Rescisão de parcelamento',
  susp_embargos: 'Embargos com efeito suspensivo',
  susp_decisao_judicial: 'Decisão judicial suspensiva',
  susp_deposito: 'Depósito judicial integral',
  susp_falencia: 'Falência / recuperação judicial',
  susp_art40: 'Registro de suspensão do art. 40',
  susp_idpj_mcf_constricao: 'Constrição via incidente',
  susp_idpj_mcf: 'Suspensão da execução via incidente',
  susp_outra: 'Outra causa suspensiva',
  info_peticao_sem_resultado: 'Pedido ainda sem resultado',
  info_arquivamento: 'Arquivamento',
  info_desarquivamento: 'Desarquivamento',
  info_decisao_prescricao: 'Decisão sobre prescrição',
  info_outro: 'Outro registro'
};

function occurrenceSource(ev, incidents) {
  if (!ev) return 'evento';
  if (ev._inheritedFromIDPJ) {
    const inc = (incidents || []).find(i => i.id === ev._inheritedFromIDPJ);
    const kind = inc && inc.tag === 'cautelar_fiscal' ? 'MCF' : 'IDPJ';
    return kind + ' nº ' + ((inc && inc.processNumber) || ev._inheritedFromIDPJ);
  }
  if (ev.source === 'analise') {
    const evn = String(ev.sourceRef || '').match(/Evento\s*(\d+)/i);
    return evn ? ('Análise · Evento ' + evn[1]) : 'Análise';
  }
  if (ev._source === 'processo') return 'processo';
  if (ev._source === 'planilha') return 'planilha';
  return 'evento';
}

function occurrenceEffect(type, ev, r) {
  const t = normalizePrescEventType(type);
  if (ev && /posterior ao ajuizamento/.test(ev.effect || '')) {
    return 'posterior ao ajuizamento — não afeta o prazo ordinário';
  }
  if (t === 'susp_parcelamento') {
    return 'interrompe e pausa enquanto vigente';
  }
  if (t === 'int_rescisao_parcelamento') return 'restabelece a exigibilidade; abre ciclo de 1 ano + 5 anos';
  if (t === 'susp_idpj_mcf_constricao') return 'pausa o prazo das execuções abrangidas desde o pedido; não encerra o ciclo';
  if (t === 'susp_idpj_mcf') return 'pausa a intercorrente até o fim do incidente; não encerra o ciclo';
  if (EF_CONSTRICTION_TYPES.has(t) || CITACAO_ALIASES.has(t)) {
    const when = asIso(ev && ev.requestDate) || asIso(ev && ev.date);
    if (r && r.phase === 'interrompido' && r.interruptAt && when === r.interruptAt) return 'encerra o ciclo';
    if (r && r.phase === 'suspenso') return 'não encerra o ciclo enquanto o prazo está pausado';
    if (r && r.segment === 'intercorrente' && r.phase === 'nao_iniciado') return 'não inicia o prazo de 1 ano + 5 anos';
    return 'resultado útil';
  }
  if (t === 'marco_sem_bens' || t === 'marco_nao_localizacao' || t === 'marco_insuficiencia_bens') {
    return 'inicia o prazo de 1 ano + 5 anos';
  }
  if (t === 'info_arquivamento') return 'limite operacional do prazo (arquivamento + 6 anos)';
  if (t === 'susp_embargos' || t === 'susp_decisao_judicial' || t === 'susp_deposito' || t === 'susp_falencia' || t === 'susp_outra' || t === IDPJ_STAY_TYPE) {
    return 'pausa o prazo; depois retoma';
  }
  if (t === 'info_peticao_sem_resultado') return 'não encerra o ciclo; conferir o desfecho';
  return 'registro do caso';
}

const INTERRUPT_SHORT = {
  int_penhora: 'penhora',
  int_arresto: 'arresto',
  int_sisbajud: 'bloqueio Sisbajud',
  int_cnib: 'indisponibilidade',
  int_citacao: 'citação',
  int_reconhecimento: 'reconhecimento da dívida',
  int_outra: 'resultado útil'
};

function interruptFactLabel(r) {
  const ev = (r.timeline || []).find(e => e && e.phase === 'interrompido');
  if (ev) {
    const t = normalizePrescEventType(ev.type);
    if (INTERRUPT_SHORT[t]) return INTERRUPT_SHORT[t];
    const fact = CASE_FACT[t];
    return fact ? fact.toLowerCase() : 'resultado útil';
  }
  return 'resultado útil';
}

function buildSummary(r, ctx) {
  if (!r) return '';
  if (r.segment === 'credito') {
    if (r.phase === 'consumado' && ctx.exec) {
      const p = asIso(ctx.exec.protocolDate);
      return `Prescrição ordinária consumada em ${fmtDate(r.diesAdQuem)}${p ? ', antes do ajuizamento de ' + fmtDate(p) : ''}.`;
    }
    if (r.phase === 'interrompido' && ctx.exec) {
      const p = asIso(ctx.exec.protocolDate);
      const insc = asIso(ctx.debt && ctx.debt.inscriptionDate);
      const fromInsc = !!(r.diesAQuo && insc && r.diesAQuo === insc);
      const janela = fromInsc
        ? ', dentro dos 5 anos contados da inscrição'
        : (r.diesAQuo ? ', dentro dos 5 anos contados de ' + fmtDate(r.diesAQuo) : '');
      return `Ajuizada em ${p ? fmtDate(p) : 'data não informada'}${janela}. Prazo interrompido pela propositura.`;
    }
    if (r.phase === 'consumado') return `Prescrição ordinária consumada em ${fmtDate(r.diesAdQuem)}.`;
    if (r.phase === 'suspenso') return `Prazo ordinário pausado. Termo projetado: ${fmtDate(r.diesAdQuem)}.`;
    if (r.diesAdQuem) return `Prescrição ordinária: termo em ${fmtDate(r.diesAdQuem)}.`;
    return r.detail || 'Sem dados para a prescrição ordinária.';
  }
  if (r.segment === 'intercorrente') {
    if (r.phase === 'interrompido') {
      const fact = interruptFactLabel(r);
      return `Ciclo encerrado pela ${fact} de ${fmtDate(r.interruptAt)}. Nenhuma ciência de não localização ou de ausência de bens lançada depois.`;
    }
    if (r.phase === 'nao_iniciado') {
      return 'Execução ajuizada, ainda sem ciência de não localização ou de ausência de bens. O ajuizamento não inicia o prazo de 1 ano + 5 anos.';
    }
    if (r.phase === 'consumado') return `Prazo de 1 ano + 5 anos vencido em ${fmtDate(r.diesAdQuem)}.`;
    if (r.phase === 'suspenso') {
      if (!r.diesAdQuem) return 'Prazo pausado. Parcelamento vigente.';
      return `Prazo pausado. Termo projetado: ${fmtDate(r.diesAdQuem)}.`;
    }
    if (r.phase === 'suspensao_art40') return `Primeiro ano após a ciência de não localização ou de ausência de bens. Termo: ${fmtDate(r.diesAdQuem)}.`;
    if (r.diesAdQuem) return `Prazo em curso. Termo: ${fmtDate(r.diesAdQuem)}.`;
    return r.detail || '';
  }
  return r.detail || '';
}

function buildOccurrences(r, ctx) {
  const occ = [];
  const seen = new Set();
  const push = (date, fact, effect, source, note) => {
    const key = [date, fact, effect, note || ''].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    occ.push({ date: date || '', fact, effect, source, note: note || '' });
  };
  if (r.segment === 'credito') {
    const insc = asIso(ctx.debt && ctx.debt.inscriptionDate);
    const consti = asIso(ctx.debt && ctx.debt.constitutionDate);
    if (consti) push(consti, 'Constituição definitiva', 'ponto de partida', 'processo');
    else if (insc) push(insc, 'Inscrição', 'ponto de partida (constituição não informada)', 'processo');
    const p = ctx.exec && asIso(ctx.exec.protocolDate);
    if (p) push(p, 'Ajuizamento', r.phase === 'consumado' ? 'depois do termo dos 5 anos' : 'interrompe', 'processo');
  }
  if (r.segment === 'intercorrente') {
    const p = ctx.exec && asIso(ctx.exec.protocolDate);
    if (p) push(p, 'Ajuizamento', 'ponto de partida; não inicia o 1 ano + 5 anos', 'processo');
  }
  for (const ev of r.timeline || []) {
    if (!ev) continue;
    if (r.segment === 'credito' && /posterior ao ajuizamento/.test(ev.effect || '')) continue;
    const t = normalizePrescEventType(ev.type);
    const date = asIso(ev.requestDate) || asIso(ev.date) || '';
    push(date, CASE_FACT[t] || (PRESC_EVENT_TYPES[t] && PRESC_EVENT_TYPES[t].label) || t, occurrenceEffect(t, ev, r), occurrenceSource(ev, r.incidents || ctx.incidents), ev.notes || ev.note || '');
  }
  occ.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.fact.localeCompare(b.fact));
  return occ;
}

function buildEstimates(r) {
  const estimates = [];
  if (r.phase === 'interrompido' && r.interruptAt) {
    estimates.push({
      label: 'Não pode ter prescrito antes de',
      date: addCalendarYears(r.interruptAt, 6),
      how: `${interruptFactLabel(r)} de ${fmtDate(r.interruptAt)} + 1 ano + 5 anos`
    });
  }
  if (r.bounds && r.bounds.floor && r.phase !== 'interrompido' && !(r.phase === 'suspenso' && !r.diesAdQuem)) {
    const kind = r.bounds.floorAnchor && FLOOR_ANCHOR_LABEL[r.bounds.floorAnchor.kind];
    estimates.push({
      label: 'Não pode ter prescrito antes de',
      date: r.bounds.floor,
      how: kind ? `${kind} + 1 ano + 5 anos` : 'ato mais recente + 1 ano + 5 anos'
    });
  }
  if (r.bounds && r.bounds.ceiling) {
    estimates.push({
      label: 'Não deveria passar de',
      date: r.bounds.ceiling,
      how: 'arquivamento datado + 6 anos, somadas as pausas posteriores'
    });
  }
  if (r.estimated && r.diesAdQuem) {
    estimates.push({
      label: 'Termo estimado (pior caso)',
      date: r.diesAdQuem,
      how: 'adesão sem data de fim: rescisão no dia da adesão + 1 ano + 5 anos'
    });
  } else if (r.diesAdQuem && r.phase !== 'interrompido' && r.phase !== 'nao_iniciado') {
    estimates.push({
      label: 'Termo calculado',
      date: r.diesAdQuem,
      how: r.cycleKind === 'politica_parc'
        ? 'rescisão + 1 ano + 5 anos'
        : 'ciência de não localização / ausência de bens + 1 ano + 5 anos'
    });
  }
  return estimates;
}

function buildIncidentChecks(r, ctx) {
  const checks = [];
  const incidents = r.incidents || ctx.incidents || [];
  const alt = r.altWithoutIncident;
  const altHot = !!(alt && (alt.phase === 'consumado' || (alt.daysLeft != null && alt.daysLeft <= 180)));
  for (const inc of incidents) {
    const num = inc.processNumber || inc.id;
    const kind = inc.tag === 'cautelar_fiscal' ? 'Cautelar fiscal' : 'IDPJ';
    const stayOpen = !!(inc.hasStay && inc.stayOpen)
      || (ctx.cdaEvents || r.timeline || []).some(e => normalizePrescEventType(e.type) === IDPJ_STAY_TYPE && asIso(e.date) && !asIso(e.endDate));
    if (!inc.hasConstriction && !inc.hasStay && !stayOpen) {
      checks.push(`${kind} nº ${num} abrange esta execução e não tem constrição lançada. Se houve indisponibilidade ou bloqueio, lançar com a data do pedido. Se a execução está suspensa pelo incidente mesmo sem constrição, lançar a suspensão.`);
    }
    if ((inc.hasConstriction && inc.constrictionOpen || stayOpen) && /extinta|arquivada/i.test(inc.status || '')) {
      checks.push(`Incidente nº ${num} encerrado; informar a data em que a pausa cessou.`);
    }
    if (inc.tag === 'cautelar_fiscal' && inc.hasConstriction && alt && alt.diesAdQuem) {
      checks.push(`Pausa baseada em cautelar fiscal — cenário sem a pausa: ${fmtDate(alt.diesAdQuem)}.`);
    } else if (inc.hasConstriction && altHot && alt && alt.diesAdQuem && inc.tag !== 'cautelar_fiscal') {
      checks.push(`Se a pausa pelo incidente nº ${num} não for reconhecida, o prazo venceria em ${fmtDate(alt.diesAdQuem)}.`);
    }
  }
  if ((r.flags || []).includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) {
    checks.push('Há pedido na janela de 1 ano + 5 anos sem resultado lançado. Conferir o desfecho nos autos.');
  }
  if (r.phase === 'interrompido' && r.interruptAt) {
    checks.push(`Depois da ${interruptFactLabel(r)} de ${fmtDate(r.interruptAt)}: houve certidão de não localização ou de ausência de bens? Se sim, lançar a ciência.`);
  }
  if (r.informedConflict && r.informedDate) {
    checks.push(`Data digitada na inscrição (${fmtDate(r.informedDate)}) diverge do termo calculado. Conferir qual vale.`);
  }
  if (r.segment === 'credito' && ctx.debt && !asIso(ctx.debt.constitutionDate) && asIso(ctx.debt.inscriptionDate)) {
    checks.push('Data de constituição definitiva não informada; o início usado é a inscrição.');
  }
  const decision = ctx.exec && ctx.exec.prescDecision;
  if (decision && decision.analysisDate) {
    const analysis = asIso(decision.analysisDate);
    let latest = '';
    for (const ev of ctx.cdaEvents || r.timeline || []) {
      const d = asIso(ev && ev.date) || asIso(ev && ev.requestDate);
      if (d && analysis && d > analysis && d > latest) latest = d;
    }
    if (latest) {
      checks.push(`Análise de ${fmtDate(analysis)} anterior à ocorrência de ${fmtDate(latest)} — revalidar.`);
    }
  }
  return [...new Set(checks)];
}

function buildRulesApplied(r, ctx) {
  const rules = new Set();
  if (r.segment === 'credito' || r.segment === 'intercorrente' || r.segment === 'decadencia') rules.add('R1');
  if (r.segment === 'intercorrente') {
    rules.add('R2');
    if (r.phase === 'interrompido') rules.add('R3');
    if ((r.timeline || []).some(e => {
      const t = normalizePrescEventType(e.type);
      return t === 'susp_embargos' || t === 'susp_decisao_judicial' || t === 'susp_deposito' || t === 'susp_falencia' || t === IDPJ_CONSTRICTION_TYPE || t === IDPJ_STAY_TYPE;
    })) rules.add('R4');
    if (r.cycleKind === 'politica_parc' || (r.timeline || []).some(e => {
      const t = normalizePrescEventType(e.type);
      return t === 'susp_parcelamento' || t === 'int_rescisao_parcelamento';
    })) rules.add('R5');
    if (r.phase === 'suspenso' && ((r.timeline || []).some(e => normalizePrescEventType(e.type) === 'susp_parcelamento' && !asIso(e.endDate))
      || (ctx.debt && (ctx.debt.status === 'parcelada' || ctx.debt.status === 'negociada_sispar')))) rules.add('R6');
    if ((r.incidents || ctx.incidents || []).length) rules.add('R7');
    if (r.bounds && r.bounds.floor) rules.add('R8');
    if (r.bounds && r.bounds.ceiling) rules.add('R9');
    if ((r.timeline || []).some(e => normalizePrescEventType(e.type) === 'susp_art40') && r.gaps && r.gaps.some(g => /sem evento de marco/i.test(g))) rules.add('R10');
    if (r.informedConflict || r.forecastDate) rules.add('R11');
  }
  if (r.segment === 'credito' && ctx.exec) rules.add('R12');
  return [...rules].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function withCaseView(r, ctx = {}) {
  if (!r) return r;
  const incidents = r.incidents || ctx.incidents || [];
  const summary = buildSummary(r, ctx);
  const occurrences = buildOccurrences(r, ctx);
  const estimates = buildEstimates(r);
  const checks = buildIncidentChecks(r, ctx);
  const rulesApplied = buildRulesApplied(r, ctx);
  return {
    ...r,
    incidents,
    summary,
    occurrences,
    estimates,
    checks,
    rulesApplied,
    ruleVersion: RULE_VERSION,
    scenario: summary
  };
}

function sealIntercorrente(r, ctx) {
  const { debt, exec, cdaEvents, asOfIso, informed, forecast, flags, cycleKind, parcRestartMode, pendingPetitions } = ctx;
  const bounds = computeIntercorrenteBounds({ exec, debt, cdaEvents, asOfIso });
  const gaps = [...(r.gaps || [])];
  const memory = r.memory || [];
  const nextFlags = [...new Set(flags || [])];
  let diesAdQuem = r.diesAdQuem;
  let origin = r.origin;
  let daysLeft = r.daysLeft;
  let phase = r.phase;
  let status = r.status;
  let detail = r.detail;
  const cycleStarted = phase && phase !== 'nao_iniciado' && phase !== 'sem_dados' && phase !== 'pre_marco';
  const computed = r.computedDiesAdQuem || (cycleStarted && origin !== 'data_informada' ? r.diesAdQuem : null);

  if (cycleStarted && computed) {
    diesAdQuem = computed;
    origin = r.estimated ? 'estimativa_pessimista' : 'calculo_validado';
    daysLeft = daysUntil(diesAdQuem, asOfIso);
    if (informed && informed !== diesAdQuem) {
      gaps.push(`Data digitada na CDA (${fmtDate(informed)}) diverge do termo calculado (${fmtDate(diesAdQuem)}). O cálculo prevalece; conferir a divergência.`);
    }
  } else if (!cycleStarted) {
    diesAdQuem = null;
    daysLeft = null;
    origin = 'estimativa';
    if (informed) gaps.push(`Data digitada na CDA (${fmtDate(informed)}) sem ciclo do art. 40 — não é dies a quo.`);
    if (forecast) gaps.push(`Previsão da planilha (${fmtDate(forecast)}): sem marco legal — só ordena a fila.`);
  }

  const windowStart = r.diesAQuo;
  const windowEnd = computed || diesAdQuem;
  if (windowStart && windowEnd && (pendingPetitions || []).some(d => d >= windowStart && d <= windowEnd)) {
    if (!nextFlags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) nextFlags.push(PRESC_FLAGS.PEDIDO_SEM_DESFECHO);
  }
  if (cycleStarted && computed && phase !== 'interrompido' && phase !== 'suspenso' && !r.estimated) {
    if (daysLeft != null && daysLeft <= 0) {
      phase = 'consumado';
      status = 'prescrito';
    } else {
      status = statusFrom(phase === 'suspensao_art40' ? 'correndo' : phase, daysLeft);
    }
  }
  if (phase === 'consumado' && nextFlags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) {
    phase = 'correndo';
    status = 'critico';
    detail = `Há pedido na janela de 1 ano + 5 anos sem resultado lançado. Não declarar o prazo vencido. Termo calculado: ${fmtDate(diesAdQuem)}. Conferir autos.`;
  }

  if (r.estimated) {
    origin = 'estimativa_pessimista';
    if (phase !== 'suspenso' && phase !== 'interrompido') phase = 'estimado';
    status = statusFrom('estimado', daysLeft);
    if (!detail || /CONSUMADA/i.test(detail)) {
      detail = `Parcelamento sem data de encerramento: termo estimado ${fmtDate(diesAdQuem)} (pior caso). Conferir a data da rescisão.`;
    }
  }

  if (phase === 'nao_iniciado') status = 'indeterminado';
  if (phase === 'interrompido') status = 'interrompido';

  if (bounds.floor && !memory.some(m => m.event === 'Piso operacional')) {
    const kind = bounds.floorAnchor && FLOOR_ANCHOR_LABEL[bounds.floorAnchor.kind];
    memPush(memory, bounds.floor, 'Piso operacional', `Não é marco. Acompanhar a partir desta data${kind ? ' (' + kind + ' + 6 anos)' : ''}.`);
  }
  if (bounds.ceiling && !memory.some(m => m.event === 'Teto operacional')) {
    memPush(memory, bounds.ceiling, 'Teto operacional', 'Arquivamento datado + 6 anos. Não é dies a quo do Tema 566.');
  }

  const out = {
    ...r,
    diesAdQuem,
    origin,
    daysLeft,
    phase,
    status,
    detail,
    gaps,
    memory,
    flags: nextFlags,
    bounds,
    cycleKind: cycleKind || null,
    parcRestartMode: parcRestartMode || PARC_RESTART_ONE_PLUS_FIVE,
    informedDate: informed || '',
    forecastDate: forecast || '',
    informedConflict: !!(informed && diesAdQuem && informed !== diesAdQuem && cycleStarted),
    estimated: !!r.estimated,
    incidents: r.incidents || ctx.incidents || []
  };
  return out;
}

function computeIntercorrente({ debt, exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline, skipIdpjPauses = false, incidents = [] }) {
  const parcRestartMode = parcRestartModeOf(debt, exec);
  const flags = [];
  const pendingPetitions = [];
  const loopEvents = skipIdpjPauses
    ? cdaEvents.filter(e => normalizePrescEventType(e.type) !== IDPJ_CONSTRICTION_TYPE)
    : cdaEvents;
  const pauses = applyPausesFromEvents(loopEvents, asOfIso, { skipArt40Dup: true, originario: false });
  const inferredEnds = inferParcelamentoEnds(loopEvents);
  let marco = null;
  let interrupted = false;
  let interruptAt = null;
  let tooLate = false;
  let parcMode = false;
  let parcOngoing = false;
  let parcRestartAt = null;
  let lastParcAdesao = null;
  let notedParcRule = false;
  let marcoFromSuspArt40 = false;

  const noteParcRule = () => {
    if (notedParcRule) return;
    notedParcRule = true;
    const modoTxt = parcRestartMode === PARC_RESTART_FIVE_ONLY
      ? 'modo só 5 anos (linha Pitten / 1ª Turma do TRF4)'
      : 'modo 1+5 (1 ano de suspensão + 5 anos — mais favorável à União)';
    gaps.push(`Ciclo pós-parcelamento (política interna, não é marco do art. 40 / Tema 566). O pedido interrompe (art. 174, p.ú., IV CTN; Súmula 653). Com a rescisão, conta-se ${modoTxt}.`);
  };

  const ctx = () => ({
    debt, exec, cdaEvents: loopEvents, asOfIso, informed, forecast, flags, pendingPetitions,
    cycleKind: parcMode && parcRestartAt && !interrupted ? 'politica_parc' : (marco || interrupted ? 'art40' : null),
    parcRestartMode,
    incidents
  });

  noteDuplicateConstriction(loopEvents, gaps);

  for (const evt of loopEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type] || { category: 'info', label: type, desc: '' };
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;

    const isConstriction = EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type);
    const effectDate = (isConstriction && asIso(evt.requestDate)) ? asIso(evt.requestDate) : efetivacao;

    if (type === IDPJ_CONSTRICTION_TYPE && efetivacao > asOfIso) continue;
    if (meta.category === 'marco' && efetivacao > asOfIso) {
      gaps.push(`Marco com data futura (${fmtDate(efetivacao)}) — ignorado no cômputo (erro de digitação).`);
      continue;
    }
    if (isConstriction && efetivacao > asOfIso) {
      pendingPetitions.push(asIso(evt.requestDate) || efetivacao);
      memPush(memory, effectDate, meta.label, 'Pedido com efetivação futura — ainda sem resultado. Não encerra o ciclo.');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'pre_marco' });
      continue;
    }
    if (type === 'info_peticao_sem_resultado' && efetivacao <= asOfIso) {
      pendingPetitions.push(asIso(evt.requestDate) || efetivacao);
    }

    if (meta.category === 'marco') {
      if (parcOngoing) {
        memPush(memory, efetivacao, meta.label, 'Ciência na vigência do parcelamento — não inaugura o ciclo do art. 40 enquanto a exigibilidade está suspensa (art. 151, VI).');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
        continue;
      }
      if (parcMode && parcRestartAt) {
        memPush(memory, efetivacao, meta.label, 'O ciclo 1+5 já corre da rescisão do parcelamento; este marco não inicia segundo ciclo.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'prescricao_correndo' });
        continue;
      }
      marco = efetivacao;
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      memPush(memory, efetivacao, meta.label, 'Inicia suspensão de 1 ano (art. 40 LEF / Tema 566).');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspensao_art40' });
      continue;
    }

    if (type === 'susp_art40') {
      if (!marco && !parcOngoing && !(parcMode && parcRestartAt) && efetivacao <= asOfIso) {
        marco = efetivacao;
        marcoFromSuspArt40 = true;
        interrupted = false;
        interruptAt = null;
        tooLate = false;
        gaps.push('Informado como suspensão art. 40, sem evento de marco. Tratado como ciência nesta data. Conferir nos autos.');
        memPush(memory, efetivacao, meta.label, 'Tratado como marco (cadastro sem evento de ciência). Inicia o ciclo 1+5, com aviso.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspensao_art40' });
      } else {
        timeline.push({ ...evt, effect: 'Registro do ano do art. 40 — o marco já inicia a suspensão (não soma segundo ano).', phase: marco ? 'suspensao_art40' : 'pre_marco' });
      }
      continue;
    }

    if (isConstriction && efetivacao <= asOfIso) {
      if (parcOngoing) {
        memPush(memory, effectDate, meta.label, 'Constrição na vigência do parcelamento — exigibilidade suspensa (art. 151, VI). O quinquênio só volta a fluir da rescisão.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
        continue;
      }
      const restartClock = parcMode && parcRestartAt;
      if (!marco && !restartClock) {
        memPush(memory, effectDate, meta.label, 'Constrição/citação efetiva sem ciclo do art. 40 em curso — não inaugura a intercorrente (Tema 566). Originária já interrompida pelo ajuizamento (Tema 383).');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'pre_marco' });
        continue;
      }
      const prescEnd = intercorrenteWindowEnd({
        marco,
        parcRestartAt: restartClock ? parcRestartAt : null,
        pauses,
        beforeIso: effectDate,
        mode: parcRestartMode
      });
      if (prescEnd && effectDate > prescEnd) {
        tooLate = true;
        memPush(memory, effectDate, meta.label, restartClock
          ? 'Pedido fora da janela 1+5 contada da rescisão do parcelamento — não salva o feito.'
          : 'Pedido fora da janela de 1+5 anos — não salva o feito.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'consumado' });
      } else {
        interrupted = true;
        interruptAt = effectDate;
        parcMode = false;
        parcOngoing = false;
        const retro = asIso(evt.requestDate) && asIso(evt.requestDate) !== efetivacao
          ? ` Retroage ao pedido (${fmtDate(evt.requestDate)}).` : '';
        memPush(memory, effectDate, meta.label, `INTERROMPE a intercorrente — ciclo encerrado.${retro}`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'interrompido' });
      }
      continue;
    }

    if (type === 'int_rescisao_parcelamento') {
      noteParcRule();
      parcMode = true;
      parcOngoing = false;
      parcRestartAt = efetivacao;
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      memPush(memory, efetivacao, meta.label, parcRestartMode === PARC_RESTART_FIVE_ONLY
        ? 'Rescisão: exigibilidade restabelecida. Ciclo pós-parcelamento (política): só 5 anos (linha Pitten).'
        : 'Rescisão: exigibilidade restabelecida. Ciclo pós-parcelamento (política): 1+5, por equiparação — não é marco do art. 40.');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'prescricao_correndo' });
      continue;
    }

    if (meta.category === 'interruptiva') {
      if (type === 'int_protesto_extrajudicial') {
        memPush(memory, effectDate, meta.label, protestoExtrajudicialInterrompe(efetivacao)
          ? 'Interrompe a originária (LC 208/2024, a partir de 03/07/2024). Na intercorrente, o Tema 568 não lista o protesto como interruptivo do ciclo do art. 40.'
          : `Anterior à vigência da LC 208/2024 (${fmtDate(LC208_VIGENCIA)}) — não interrompe.`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: marco || parcMode ? 'prescricao_correndo' : 'pre_marco' });
        continue;
      }
      memPush(memory, effectDate, meta.label, 'Causa interruptiva do art. 174 — na intercorrente não encerra o ciclo do art. 40 (salvo constrição/citação efetiva).');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: marco || parcMode ? 'prescricao_correndo' : 'pre_marco' });
      continue;
    }

    if (type === IDPJ_CONSTRICTION_TYPE) {
      const from = asIso(evt.requestDate) || efetivacao;
      const windowEnd = intercorrenteWindowEnd({
        marco,
        parcRestartAt: parcMode && parcRestartAt && !parcOngoing ? parcRestartAt : null,
        pauses,
        beforeIso: from,
        mode: parcRestartMode
      });
      if (windowEnd && from > windowEnd) {
        memPush(memory, from, meta.label, `Pedido após o termo (${fmtDate(windowEnd)}) — não suspende prazo já consumado.`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'consumado' });
        continue;
      }
      const tag = exec && (evt._inheritedFromIDPJ) ? ' Tese fazendária se a origem for MCF.' : '';
      memPush(memory, from, meta.label, `Suspende as EFs abrangidas desde o pedido (${fmtDate(from)}). Não interrompe o ciclo.${tag}`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    if (type === 'susp_parcelamento') {
      noteParcRule();
      const resolved = resolvedSuspEnd(evt, asOfIso, inferredEnds);
      const inferred = inferredEnds.get(evt.id);
      lastParcAdesao = efetivacao;
      parcMode = true;
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      if (resolved.ongoing) {
        parcOngoing = true;
        parcRestartAt = null;
      } else {
        parcOngoing = false;
        parcRestartAt = resolved.rawEnd || efetivacao;
      }
      const until = resolved.rawEnd ? fmtDate(resolved.rawEnd) : 'hoje';
      const inferTag = inferred ? ` (cessação inferida — ${inferred.reason === 'rescisao' ? 'rescisão posterior' : 'adesão seguinte'})` : '';
      const modoTxt = parcRestartMode === PARC_RESTART_FIVE_ONLY ? 'só 5 anos' : '1 ano + 5 anos';
      memPush(memory, efetivacao, meta.label, resolved.ongoing
        ? `INTERROMPE a intercorrente (art. 174, p.ú., IV CTN; Súmula 653) e suspende a exigibilidade enquanto vigente (art. 151, VI). Após a rescisão, ciclo pós-parcelamento (política): ${modoTxt}.`
        : `INTERROMPE a intercorrente. Vigente até ${until}${inferTag}. Ciclo pós-parcelamento (política): ${modoTxt} a partir de ${fmtDate(parcRestartAt)}.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: resolved.ongoing ? 'suspenso' : 'prescricao_correndo' });
      continue;
    }

    if (type === IDPJ_STAY_TYPE) {
      const from = asIso(evt.requestDate) || efetivacao;
      memPush(memory, from, meta.label, `Suspende a execução (IDPJ/cautelar), mesmo sem constrição. Não interrompe o ciclo. A intercorrente pausa até ${evt.endDate ? fmtDate(evt.endDate) : 'o fim do incidente'}.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    if (meta.category === 'suspensiva') {
      const from = asIso(evt.requestDate) || efetivacao;
      memPush(memory, from, meta.label, `Suspende o cômputo até ${evt.endDate ? fmtDate(evt.endDate) : 'hoje'} (art. 151 / causa diversa do art. 40).`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    timeline.push({ ...evt, effect: meta.desc || 'Registro informativo', phase: marco || parcMode ? 'prescricao_correndo' : 'pre_marco' });
  }

  const activeNow = pauses.filter(p => p.ongoing);

  if (parcOngoing) {
    memPush(memory, lastParcAdesao, 'Dies a quo', 'Pedido/adesão ao parcelamento — interrupção (art. 174, p.ú., IV).');
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: 'calculo_validado',
      phase: 'suspenso',
      status: 'suspenso',
      diesAQuo: lastParcAdesao,
      diesAdQuem: null,
      computedDiesAdQuem: null,
      daysLeft: null,
      detail: 'Parcelamento vigente. O prazo não corre. Na rescisão, conta-se 1 ano + 5 anos.',
      memory, gaps, timeline,
      prescriptionInterrupted: true,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    }, ctx());
  }

  if (interrupted && !tooLate) {
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: 'calculo_validado',
      phase: 'interrompido',
      status: 'interrompido',
      diesAQuo: marco,
      diesAdQuem: null,
      computedDiesAdQuem: null,
      daysLeft: null,
      interruptAt,
      detail: `Prazo encerrado (constrição/citação efetiva${interruptAt ? ' em ' + fmtDate(interruptAt) : ''}). Vigiar nova inércia; só reinicia com nova ciência de não localização ou de ausência de bens.`,
      memory, gaps, timeline,
      prescriptionInterrupted: true,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    }, { ...ctx(), cycleKind: 'art40' });
  }

  if (parcMode && parcRestartAt) {
    const { art40End, diesAdQuem: diesAdQuemComputed } = addParcCycle(parcRestartAt, pauses, parcRestartMode);
    const daysLeft = daysUntil(diesAdQuemComputed, asOfIso);
    const activeBeforeTerm = activeNow.filter(p => !diesAdQuemComputed || p.start < diesAdQuemComputed);
    const estimated = !!(flags.includes(PRESC_FLAGS.PARC_SEM_FIM) && lastParcAdesao && parcRestartAt === lastParcAdesao);
    let phase = 'correndo';
    if (estimated) phase = 'estimado';
    else if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
    else if (activeBeforeTerm.length) phase = 'suspenso';
    else if (parcRestartMode !== PARC_RESTART_FIVE_ONLY && asOfIso < art40End) phase = 'suspensao_art40';
    memPush(memory, parcRestartAt, 'Dies a quo (rescisão)', parcRestartMode === PARC_RESTART_FIVE_ONLY
      ? 'Ciclo pós-parcelamento (política): só 5 anos a partir da rescisão.'
      : 'Ciclo pós-parcelamento (política): 1+5. A rescisão NÃO é marco do art. 40 / Tema 566.');
    if (parcRestartMode !== PARC_RESTART_FIVE_ONLY) {
      memPush(memory, art40End, 'Fim do 1º ano', '1 ano civil de suspensão a partir da rescisão (modo 1+5).');
    }
    memPush(memory, diesAdQuemComputed, 'Dies ad quem (calculado)', parcRestartMode === PARC_RESTART_FIVE_ONLY
      ? '5 anos civis a partir da rescisão, descontadas pausas do art. 151.'
      : '5 anos civis após o ano de suspensão, descontadas outras causas do art. 151.');
    const detail = estimated
      ? `Parcelamento sem data de encerramento. Termo estimado: ${fmtDate(diesAdQuemComputed)} (pior caso: rescisão no dia da adesão). Conferir a data.`
      : (phase === 'suspenso'
        ? `Prazo pausado. Termo projetado: ${fmtDate(diesAdQuemComputed)}.`
        : (phase === 'suspensao_art40'
          ? `Primeiro ano após a rescisão do parcelamento. O prazo de 5 anos começa em ${fmtDate(art40End)}. Termo: ${fmtDate(diesAdQuemComputed)}.`
          : (phase === 'consumado'
            ? `Prazo de 1 ano + 5 anos vencido em ${fmtDate(diesAdQuemComputed)} (após parcelamento).`
            : `Prazo em curso desde a rescisão (${fmtDate(parcRestartAt)}). Termo: ${fmtDate(diesAdQuemComputed)} (${daysLeft}d).`)));
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: estimated ? 'estimativa_pessimista' : 'calculo_validado',
      phase,
      status: statusFrom(estimated ? 'estimado' : (phase === 'suspensao_art40' ? 'correndo' : phase), daysLeft),
      diesAQuo: parcRestartAt,
      diesAdQuem: diesAdQuemComputed,
      computedDiesAdQuem: diesAdQuemComputed,
      daysLeft,
      detail,
      memory, gaps, timeline,
      estimated,
      prescriptionInterrupted: false,
      prescDaysConsumed: Math.max(0, yearSpanDays(parcRestartAt, parcRestartMode === PARC_RESTART_FIVE_ONLY ? 5 : 6) - Math.max(0, daysLeft || 0)),
      suspDaysConsumed: 0,
      activeSuspensions: activeBeforeTerm.map(p => p.id),
      incidents
    }, { ...ctx(), cycleKind: 'politica_parc' });
  }

  if (!marco) {
    gaps.push('Sem marco de não localização / ausência de bens. Intercorrente não iniciada (Tema 566). Originária interrompida pelo ajuizamento (Tema 383).');
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: 'estimativa',
      phase: 'nao_iniciado',
      status: 'indeterminado',
      diesAQuo: asIso(exec.protocolDate) || null,
      diesAdQuem: null,
      computedDiesAdQuem: null,
      daysLeft: null,
      detail: 'Ainda sem ciência de não localização ou de ausência de bens. O ajuizamento não inicia o prazo de 1 ano + 5 anos.',
      memory, gaps, timeline,
      prescriptionInterrupted: false,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    }, { ...ctx(), cycleKind: null });
  }

  const { art40End, diesAdQuem: prescEndComputed } = addArt40PlusFive(marco, pauses);
  const daysLeft = daysUntil(prescEndComputed, asOfIso);

  let phase;
  if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
  else if (activeNow.filter(p => !prescEndComputed || p.start < prescEndComputed).length) phase = 'suspenso';
  else if (asOfIso < art40End) phase = 'suspensao_art40';
  else phase = 'correndo';

  const unpaused = Math.max(0, daysBetween(marco, asOfIso) - pauses.reduce((s, p) => {
    const a = p.start < marco ? marco : p.start;
    const b = (p.end || asOfIso) > asOfIso ? asOfIso : (p.end || asOfIso);
    return s + (b > a ? daysBetween(a, b) : 0);
  }, 0));
  const art40Need = yearSpanDays(marco, 1);
  const suspDaysConsumed = Math.min(art40Need, unpaused);
  const prescDaysConsumed = Math.max(0, unpaused - art40Need);

  memPush(memory, marco, 'Dies a quo (marco)', marcoFromSuspArt40
    ? 'Ciência inferida do evento “suspensão art. 40” (sem marco cadastrado). Conferir nos autos.'
    : 'Ciência da não localização / ausência de bens.');
  memPush(memory, art40End, 'Fim da suspensão art. 40', '1 ano civil, descontadas pausas do art. 151 / IDPJ.');
  memPush(memory, prescEndComputed, 'Dies ad quem (calculado)', '5 anos civis após o ano do art. 40.');

  let detail;
  if (phase === 'suspenso') detail = `Prazo pausado. Termo projetado: ${fmtDate(prescEndComputed)}.`;
  else if (phase === 'suspensao_art40') detail = `Primeiro ano após a ciência. O prazo de 5 anos começa em ${fmtDate(art40End)}. Termo: ${fmtDate(prescEndComputed)}.`;
  else if (phase === 'consumado') detail = `Prazo de 1 ano + 5 anos vencido em ${fmtDate(prescEndComputed)}.`;
  else detail = `Prazo em curso. Termo: ${fmtDate(prescEndComputed)} (${daysLeft}d).`;

  return sealIntercorrente({
    segment: 'intercorrente',
    origin: 'calculo_validado',
    phase,
    status: statusFrom(phase === 'suspensao_art40' ? 'correndo' : phase, daysLeft),
    diesAQuo: marco,
    diesAdQuem: prescEndComputed,
    computedDiesAdQuem: prescEndComputed,
    daysLeft,
    detail,
    memory, gaps, timeline,
    prescriptionInterrupted: false,
    prescDaysConsumed,
    suspDaysConsumed,
    activeSuspensions: activeNow.map(p => p.id)
  }, { ...ctx(), cycleKind: 'art40' });
}

export function createPrescLookup(debts, executions, events = [], asOf) {
  const map = new Map();
  const execs = executions || [];
  const evts = events || [];
  const collectIndex = buildPrescCollectIndex(execs, evts);
  for (const d of debts || []) {
    if (!d || !d.id) continue;
    map.set(d.id, computePrescription({ debt: d, executions: execs, events: evts, asOf, collectIndex }));
  }
  const get = (debt) => {
    if (!debt) return emptyResult();
    if (debt.id && map.has(debt.id)) return map.get(debt.id);
    return computePrescription({ debt, executions: execs, events: evts, asOf, collectIndex });
  };
  get.date = (debt) => {
    if (!debt) return '';
    const r = get(debt);
    return (r && r.diesAdQuem) || '';
  };
  return get;
}

/** Compatível com getPrescDate antigo: devolve ISO ou ''. */
export function createPrescDateLookup(debts, executions, events = [], asOf) {
  const lookup = createPrescLookup(debts, executions, events, asOf);
  return (debt) => lookup.date(debt);
}

/**
 * Adaptador do KPI por execução: pior status entre as CDAs do feito;
 * se não houver CDA, usa só os eventos da execução (via CDA sintética).
 */
export function calcPrescription(executionId, events, extra = {}) {
  const { debts = [], executions = [], asOf } = extra;
  const exec = executions.find(e => e.id === executionId);
  const cdas = (debts || []).filter(d => exec && d.processNumber && sameProc(d.processNumber, exec.processNumber));
  const targets = cdas.length ? cdas : [{ id: '_exec_' + executionId, processNumber: exec && exec.processNumber, inscriptionDate: exec && exec.protocolDate }];
  const results = targets.map(d => computePrescription({ debt: d, executions, events, asOf }));
  const rank = { prescrito: 0, critico: 1, alerta: 2, indeterminado: 3, interrompido: 3, suspenso: 4, correndo: 5, seguro: 6, sem_dados: 7 };
  results.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
  const best = results[0] || emptyResult({ detail: 'Sem eventos registrados.' });
  const phaseMap = {
    nao_iniciado: 'pre_marco',
    suspensao_art40: 'suspensao_art40',
    correndo: 'prescricao_correndo',
    originario: 'prescricao_correndo',
    consumado: 'prescrito',
    interrompido: 'interrompido',
    suspenso: 'prescricao_correndo',
    sem_dados: 'pre_marco'
  };
  return {
    status: best.status,
    daysLeft: best.daysLeft,
    timeline: best.timeline,
    detail: best.detail,
    phase: phaseMap[best.phase] || 'pre_marco',
    prescDaysConsumed: best.prescDaysConsumed,
    suspDaysConsumed: best.suspDaysConsumed,
    prescriptionInterrupted: best.prescriptionInterrupted,
    activeSuspensions: best.activeSuspensions,
    _computed: best
  };
}

export function attachPrescriptionSnapshots(data, asOf) {
  if (!data || !Array.isArray(data.debts)) return data;
  const lookup = createPrescLookup(data.debts, data.executions || [], data.prescriptionEvents || [], asOf);
  const computedAt = asIso(asOf) || localIso(new Date());
  data.debts.forEach(d => {
    const r = lookup(d);
    const alert = classifyPainelPrescAlert(d, data.executions || [], data.prescriptionEvents || [], asOf, r);
    const kind = alert && alert.kind;
    const row = {
      prescKind: kind,
      checks: r.checks || (alert && alert.checks) || [],
      incident: (alert && alert.incident) || ((r.incidents && r.incidents[0]) || null),
      informedConflict: !!r.informedConflict,
      incidentOnly: (r.gaps || []).some(g => /coincide com um IDPJ/i.test(g)),
      prescDate: alert ? alert.date : (r.diesAdQuem || ''),
      interruptAt: r.interruptAt || ''
    };
    const group = kind ? groupOfKind(kind, row) : 0;
    const key = prazosKeyMeta(kind, row);
    d.prescriptionSnapshot = {
      diesAdQuem: r.diesAdQuem || '',
      daysLeft: r.daysLeft,
      origin: r.origin,
      phase: r.phase,
      segment: r.segment,
      status: r.status,
      detail: r.detail,
      flags: r.flags || [],
      cycleKind: r.cycleKind || null,
      scenario: r.summary || r.scenario || '',
      summary: r.summary || '',
      checks: r.checks || [],
      estimated: !!r.estimated,
      incidents: r.incidents || [],
      group,
      prescKind: kind || '',
      keyDate: key.date || '',
      keyLabel: key.label || '',
      firstCheck: ((openChecks(r.checks, d.prescChecks)[0] || {}).text) || '',
      incident: row.incident,
      computedAt
    };
  });
  return data;
}

export function migratePrescriptionEvents(events) {
  const constriction = new Set(['int_penhora', 'int_arresto', 'int_sisbajud', 'int_cnib']);
  return (events || []).map(ev => {
    if (!ev) return ev;
    let next = ev;
    if (ev.type === 'int_citacao_devedor') next = { ...next, type: 'int_citacao' };
    if (next._inheritedFromIDPJ && constriction.has(next.type)) {
      next = {
        ...next,
        type: IDPJ_CONSTRICTION_TYPE,
        requestDate: next.requestDate || next.date,
        _migratedIdpjConstriction: true
      };
    }
    return next;
  });
}

/** Eventos de constrição no IDPJ/MCF viram suspensão nas EFs, com retroação ao pedido. */
export function idpjPropagationPayload(sourceEvent) {
  const type = normalizePrescEventType(sourceEvent.type);
  if (type === IDPJ_STAY_TYPE) return { ...sourceEvent, type: IDPJ_STAY_TYPE };
  const isConstriction = EF_CONSTRICTION_TYPES.has(type) || type === IDPJ_CONSTRICTION_TYPE;
  if (!isConstriction) return { ...sourceEvent };
  return {
    ...sourceEvent,
    type: IDPJ_CONSTRICTION_TYPE,
    requestDate: sourceEvent.requestDate || sourceEvent.date,
    date: sourceEvent.date
  };
}

export const shouldPropagateIdpjAsSuspension = (type) => {
  const t = normalizePrescEventType(type);
  return EF_CONSTRICTION_TYPES.has(t) || t === IDPJ_CONSTRICTION_TYPE || t === IDPJ_STAY_TYPE;
};

// ═══════════════════════════════════════════════════════════════════════════
// DECADÊNCIA (arts. 150, §4º, e 173 CTN) e PRESCRIÇÃO ORDINÁRIA (art. 174 CTN)
// ═══════════════════════════════════════════════════════════════════════════

const decResult = (over = {}) => ({
  segment: 'decadencia', rule: '', status: 'sem_dados', origin: 'estimativa',
  diesAQuo: null, diesAdQuem: null, daysLeft: null, detail: '', memory: [], gaps: [], ...over
});

/**
 * Decadência do direito de constituir o crédito.
 * Âncoras: debt.launchMode (regra), debt.taxPeriodEnd (fato gerador / decisão
 * anulatória no 173, II), debt.constitutionDate (constituição definitiva).
 */
function withDecadenciaView(r, debt) {
  if (!r) return r;
  const mode = debt && debt.launchMode && LAUNCH_MODES[debt.launchMode] ? debt.launchMode : '';
  const anchor = asIso(debt && debt.taxPeriodEnd);
  const constitution = asIso(debt && debt.constitutionDate);
  const inscription = asIso(debt && debt.inscriptionDate);
  const checks = [];
  const occurrences = [];
  let summary = r.detail || '';
  if (!anchor && !mode) {
    summary = 'Não calculada: faltam período de apuração e modalidade de lançamento.';
    checks.push('Informar período de apuração e modalidade de lançamento na inscrição.');
  } else if (!anchor) {
    summary = 'Não calculada: falta o período de apuração.';
    checks.push('Informar o período de apuração na inscrição.');
  } else if (!mode) {
    summary = r.status === 'sem_dados'
      ? 'Não calculada: falta a modalidade de lançamento.'
      : (r.status === 'obstada' && constitution
        ? `Crédito constituído em ${fmtDate(constitution)}, dentro do prazo.`
        : r.status === 'consumada' && constitution
          ? `Constituição em ${fmtDate(constitution)}, depois do fim do prazo.`
          : `Prazo em curso. Modalidade de lançamento não informada; aplicada a regra geral.`);
    checks.push('Informar a modalidade de lançamento na inscrição.');
  } else if (mode === 'declarado') {
    summary = 'Crédito constituído pela declaração do contribuinte. Não há decadência a discutir.';
  } else if (r.status === 'obstada' && constitution) {
    summary = `Crédito constituído em ${fmtDate(constitution)}, dentro do prazo.`;
  } else if (r.status === 'obstada' && inscription) {
    summary = `Inscrição em ${fmtDate(inscription)}, anterior ao fim do prazo. Constituição não informada.`;
    checks.push('Informar a data de constituição definitiva na inscrição.');
  } else if (r.status === 'consumada' && constitution) {
    summary = `Constituição em ${fmtDate(constitution)}, depois do fim do prazo.`;
  } else if (r.diesAdQuem) {
    summary = r.daysLeft != null && r.daysLeft <= 0
      ? `Prazo vencido em ${fmtDate(r.diesAdQuem)} sem constituição registrada.`
      : `Prazo em curso até ${fmtDate(r.diesAdQuem)}.`;
  }
  if (constitution && (r.status === 'obstada' || r.status === 'consumada')) {
    occurrences.push({
      date: constitution,
      fact: 'Constituição definitiva',
      effect: r.status === 'consumada' ? 'depois do fim do prazo' : 'encerra a decadência se dentro do prazo',
      source: 'processo'
    });
  }
  return {
    ...r,
    summary,
    occurrences,
    estimates: [],
    checks,
    rulesApplied: ['R1'],
    ruleVersion: RULE_VERSION,
    scenario: summary
  };
}

export function checkId(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

export function allCheckItems(checks, prescChecks) {
  const doneMap = new Map((prescChecks || []).filter(c => c && c.id).map(c => [c.id, c.doneAt || '']));
  return (checks || []).map(text => {
    const id = checkId(text);
    return { id, text, doneAt: doneMap.get(id) || '' };
  });
}

export function openChecks(checks, prescChecks) {
  return allCheckItems(checks, prescChecks).filter(c => !c.doneAt);
}

const COL_TITLES = {
  decadencia: 'Decadência',
  ordinaria: 'Prescrição ordinária',
  intercorrente: 'Intercorrente'
};

function columnSeal(key, seg) {
  if (!seg) return 'sem dados';
  if (key === 'decadencia' && seg.rule === 'declarado') return 'calculado';
  if (key === 'decadencia' && (seg.status === 'sem_dados' || (!seg.diesAQuo && !seg.diesAdQuem))) return 'sem dados';
  if (seg.phase !== 'interrompido' && (seg.estimated || seg.phase === 'estimado' || seg.origin === 'estimativa_pessimista')) return 'estimado';
  if (seg.origin === 'estimativa' && key !== 'decadencia') return 'estimado';
  if (seg.status === 'sem_dados' && !seg.diesAdQuem && seg.phase !== 'interrompido') return 'sem dados';
  return 'calculado';
}

function columnDates(key, seg) {
  if (key === 'decadencia') {
    if (!seg.diesAQuo && !seg.diesAdQuem) return { start: '—', end: '—' };
    return {
      start: seg.diesAQuo ? fmtDate(seg.diesAQuo) : 'sem data de início',
      end: seg.diesAdQuem ? fmtDate(seg.diesAdQuem) : 'sem termo'
    };
  }
  if (key === 'ordinaria') {
    const start = seg.diesAQuo ? fmtDate(seg.diesAQuo) : 'sem data de início';
    let end = 'sem termo calculado';
    if (seg.phase === 'interrompido') {
      const aj = (seg.occurrences || []).find(o => o.fact === 'Ajuizamento');
      end = aj && aj.date ? 'interrompido em ' + fmtDate(aj.date) : 'interrompido pela propositura';
    } else if (seg.diesAdQuem) end = fmtDate(seg.diesAdQuem);
    return { start, end };
  }
  const hasCiencia = (seg.occurrences || []).some(o => /^Ciência /i.test(o.fact || ''));
  const start = hasCiencia && seg.diesAQuo ? fmtDate(seg.diesAQuo) : 'sem ciência lançada';
  let end = 'sem termo calculado';
  if (seg.phase === 'interrompido') end = '—';
  else if (seg.diesAdQuem) end = fmtDate(seg.diesAdQuem);
  return { start, end };
}

export function buildCdaColumnView(seg, { key, prescChecks } = {}) {
  const title = COL_TITLES[key] || key;
  const seal = columnSeal(key, seg);
  const dates = columnDates(key, seg);
  const datesLine = key === 'decadencia' && dates.start === '—' && dates.end === '—'
    ? '—'
    : 'Início: ' + dates.start + ' · Fim: ' + dates.end;
  const estimates = (seg.estimates || []).map(e => ({
    label: e.label,
    date: e.date,
    how: e.how,
    line: (e.label + (e.date ? ' ' + fmtDate(e.date) : '') + (e.how ? ' — ' + e.how : '')).replace(/\s+/g, ' ').trim()
  }));
  const checks = allCheckItems(seg.checks, prescChecks);
  const occurrences = (seg.occurrences || []).map(o => ({
    ...o,
    dateLabel: o.date ? fmtDate(o.date) : '',
    sourceLabel: o.source && /IDPJ|MCF|processo|planilha|evento/i.test(o.source) ? o.source : 'evento'
  }));
  return {
    key,
    title,
    seal,
    summary: seg.summary || '',
    dates,
    datesLine,
    occurrences,
    estimates,
    checks,
    footer: 'Regras v' + RULE_VERSION
  };
}

export function cdaDetailSnapshot(timeline, prescChecks) {
  const parts = [];
  ['decadencia', 'ordinaria', 'intercorrente'].forEach(key => {
    if (!timeline[key]) return;
    const col = buildCdaColumnView(timeline[key], { key, prescChecks });
    parts.push('## ' + col.title);
    parts.push('Selo: ' + col.seal);
    parts.push('Situação: ' + col.summary);
    parts.push('Datas: ' + col.datesLine);
    parts.push('Ocorrências: ' + (col.occurrences.length
      ? col.occurrences.map(o => [o.dateLabel, o.fact, o.effect].filter(Boolean).join(' · ')).join(' | ')
      : 'nenhuma'));
    if (col.estimates.length) parts.push('Estimativas: ' + col.estimates.map(e => e.line).join(' | '));
    const open = col.checks.filter(c => !c.doneAt);
    parts.push('Conferir: ' + (open.length ? open.map(c => c.text).join(' | ') : 'nenhuma'));
  });
  return parts.join('\n');
}

export const UI_FORBIDDEN = /Tema|Súmula|política|\bpiso\b|\bteto\b|\bdies\b|\bmarco\b|CENÁRIO/i;

export function computeDecadencia(debt, asOf) {
  return withDecadenciaView(computeDecadenciaCore(debt, asOf), debt);
}

function computeDecadenciaCore(debt, asOf) {
  if (!debt) return decResult({ detail: 'Sem dados.' });
  const asOfIso = asIso(asOf) || localIso(new Date());
  const memory = [];
  const gaps = [];
  const mode = LAUNCH_MODES[debt.launchMode] ? debt.launchMode : '';
  const anchor = asIso(debt.taxPeriodEnd);
  const constitution = asIso(debt.constitutionDate);
  const inscription = asIso(debt.inscriptionDate);

  if (mode === 'declarado') {
    memPush(memory, constitution || anchor || null, 'Crédito declarado pelo contribuinte',
      'Súmula 436/STJ — a entrega da declaração constitui o crédito, dispensado lançamento. Não há decadência a discutir.');
    return decResult({
      rule: 'declarado', status: 'obstada',
      origin: constitution ? 'calculo_validado' : 'estimativa',
      detail: 'Decadência prejudicada — crédito constituído pela própria declaração (Súmula 436/STJ).',
      memory, gaps
    });
  }

  if (!anchor) {
    gaps.push('Sem período de apuração/fato gerador' + (mode ? '' : ' nem modalidade de lançamento') + ' — informe na inscrição para calcular a decadência.');
    return decResult({ rule: mode ? LAUNCH_MODES[mode].rule : '', detail: 'Sem âncoras para o cálculo da decadência.', memory, gaps });
  }

  const rule = mode ? LAUNCH_MODES[mode].rule : '173_1';
  if (!mode) gaps.push('Modalidade de lançamento não informada — aplicada a regra geral do art. 173, I, CTN (Súmula 555/STJ).');

  let diesAQuo;
  if (rule === '150_4') {
    diesAQuo = anchor;
    memPush(memory, diesAQuo, 'Dies a quo — fato gerador', 'Art. 150, §4º, CTN: homologação com pagamento antecipado (Tema 163/STJ). Dolo/fraude comprovados deslocam para o art. 173, I.');
  } else if (rule === '173_2') {
    diesAQuo = anchor;
    memPush(memory, diesAQuo, 'Dies a quo — decisão anulatória definitiva', 'Art. 173, II, CTN: novo quinquênio após anulação por vício formal.');
  } else {
    diesAQuo = `${parseInt(anchor.slice(0, 4), 10) + 1}-01-01`;
    memPush(memory, diesAQuo, 'Dies a quo — 1º dia do exercício seguinte', 'Art. 173, I, CTN' + (mode ? '' : ' (regra geral — Súmula 555/STJ)') + '.');
  }
  const diesAdQuem = addCalendarYears(diesAQuo, 5);
  memPush(memory, diesAdQuem, 'Termo final do quinquênio decadencial', '5 anos civis. A decadência não se suspende nem se interrompe.');

  if (constitution) {
    if (constitution <= diesAdQuem) {
      memPush(memory, constitution, 'Constituição definitiva', 'Notificação/constituição dentro do quinquênio — decadência obstada (Súmula 622/STJ).');
      return decResult({
        rule, status: 'obstada', origin: 'calculo_validado', diesAQuo, diesAdQuem,
        detail: `Decadência obstada — constituição em ${fmtDate(constitution)}, dentro do quinquênio (termo final ${fmtDate(diesAdQuem)}).`,
        memory, gaps
      });
    }
    memPush(memory, constitution, 'Constituição definitiva', 'APÓS o termo final do quinquênio decadencial.');
    return decResult({
      rule, status: 'consumada', origin: 'calculo_validado', diesAQuo, diesAdQuem,
      detail: `Constituição em ${fmtDate(constitution)}, APÓS o termo final (${fmtDate(diesAdQuem)}) — decadência consumada (art. 156, V, CTN). Verificar a modalidade e eventual dolo/fraude (art. 173, I).`,
      memory, gaps
    });
  }

  if (inscription) {
    if (inscription <= diesAdQuem) {
      gaps.push('Sem data de constituição definitiva — presunção pela inscrição, anterior ao termo final. Confirmar a notificação do lançamento nos autos.');
      return decResult({
        rule, status: 'obstada', origin: 'estimativa', diesAQuo, diesAdQuem,
        detail: `Decadência presumidamente obstada — inscrição em ${fmtDate(inscription)}, anterior ao termo final (${fmtDate(diesAdQuem)}). Constituição necessariamente anterior à inscrição.`,
        memory, gaps
      });
    }
    gaps.push('Inscrição posterior ao termo final do quinquênio — apurar a data exata da constituição definitiva.');
    return decResult({
      rule, status: 'risco', origin: 'estimativa', diesAQuo, diesAdQuem,
      detail: `Inscrição (${fmtDate(inscription)}) posterior ao termo final (${fmtDate(diesAdQuem)}). Se a constituição também foi posterior, a decadência consumou-se — verificar.`,
      memory, gaps
    });
  }

  const daysLeft = daysUntil(diesAdQuem, asOfIso);
  gaps.push('Sem constituição nem inscrição informadas.');
  return decResult({
    rule, status: daysLeft != null && daysLeft <= 0 ? 'risco' : 'em_curso', origin: 'estimativa',
    diesAQuo, diesAdQuem, daysLeft,
    detail: daysLeft != null && daysLeft <= 0
      ? `Quinquênio decadencial vencido em ${fmtDate(diesAdQuem)} sem constituição registrada — verificar.`
      : `Prazo decadencial em curso até ${fmtDate(diesAdQuem)} (${daysLeft}d).`,
    memory, gaps
  });
}

/** Prescrição ordinária (art. 174 CTN) — mesmo motor do originário, com a checagem do ajuizamento. */
export function computeOrdinaria({ debt, executions = [], events = [], asOf } = {}) {
  if (!debt) return emptyResult();
  const asOfIso = asIso(asOf) || localIso(new Date());
  const { exec, events: cdaEvents, incidents } = collectEventsForCda(debt, executions, events);
  const r = computeOriginario({
    debt, exec, cdaEvents, asOfIso,
    informed: exec ? '' : asIso(debt.prescriptionDate),
    memory: [], gaps: [], timeline: [], incidents
  });
  return withCaseView(r, { debt, exec, asOfIso, incidents, cdaEvents });
}

const LEGAL_SEVERITY = {
  prescrito: 6, consumada: 6, consumado: 6,
  critico: 5, alerta: 4, risco: 3,
  correndo: 2, em_curso: 2, originario: 2, interrompido: 2, indeterminado: 2, estimado: 3,
  suspenso: 1,
  seguro: 0, obstada: 0,
  sem_dados: -1
};
export const legalSeverity = (status) => (LEGAL_SEVERITY[status] != null ? LEGAL_SEVERITY[status] : -1);

/** Os três segmentos extintivos da CDA + o pior status para radar. */
export function computeCdaLegalTimeline({ debt, executions = [], events = [], asOf } = {}) {
  const decadencia = computeDecadencia(debt, asOf);
  const ordinaria = computeOrdinaria({ debt, executions, events, asOf });
  const { exec } = collectEventsForCda(debt, executions, events);
  const intercorrente = exec ? computePrescription({ debt, executions, events, asOf }) : null;
  const segs = [
    { key: 'decadencia', r: decadencia },
    { key: 'ordinaria', r: ordinaria },
    { key: 'intercorrente', r: intercorrente }
  ].filter(s => s.r);
  let worst = { key: null, status: 'sem_dados', sev: -1 };
  segs.forEach(s => {
    const sev = legalSeverity(s.r.status);
    if (sev > worst.sev) worst = { key: s.key, status: s.r.status, sev };
  });
  return { decadencia, ordinaria, intercorrente, exec: exec || null, worst };
}

const PAINEL_PRESC_WINDOW = 180;
const CDA_RECORTE_STATUS = new Set(['garantida', 'parcelada', 'negociada_sispar']);
const PAINEL_PRESC_KINDS = [
  'iminente', 'vencido', 'vencido_estimado', 'residual_alta', 'residual_media',
  'acompanhar_piso', 'inconsistencia', 'vigiar_interrompido',
  'pausa_cadastrada', 'avaliar_174', 'correndo'
];

function isPainelPrescCandidate(debt, executions) {
  if (!debt || debt.status === 'extinta') return false;
  if (debt.prescriptionHandled) return false;
  const execs = matchingExecsForDebt(debt, executions);
  if (execs.some(e => e && e.prescDecision && e.prescDecision.situation === 'DECLARADA')) return false;
  return true;
}

/** Ciclo do art. 40 já tem gatilho (marco ou quinquênio pós-parcelamento). */
function intercorrenteCycleStarted(inter) {
  if (!inter) return false;
  const p = inter.phase;
  if (!p || p === 'nao_iniciado' || p === 'sem_dados' || p === 'pre_marco') return false;
  return true;
}

function isOverdueResult(r) {
  if (!r || r.estimated || r.phase === 'estimado') return false;
  if (r.status === 'prescrito' || r.status === 'consumado' || r.status === 'consumada') return true;
  return r.diesAdQuem && r.daysLeft != null && r.daysLeft <= 0;
}

function isImminentResult(r) {
  if (!r || r.estimated || r.phase === 'estimado') return false;
  if (!r.diesAdQuem || r.daysLeft == null) return false;
  return r.daysLeft > 0 && r.daysLeft <= PAINEL_PRESC_WINDOW;
}

function matchingExecsForDebt(debt, executions) {
  if (!debt || !debt.processNumber) return [];
  const n = normProc(debt.processNumber);
  if (!n) return [];
  return (executions || []).filter(e => e && normProc(e.processNumber) === n);
}

function eventTouchesDebt(ev, debt, execIds) {
  if (!ev) return false;
  if (ev.cdaId === debt.id) return true;
  if (ev.batchCdaIds && ev.batchCdaIds.includes(debt.id)) return true;
  return !!(ev.executionId && execIds.has(ev.executionId));
}

function hasDatedPrescEvent(debt, execs, events) {
  const execIds = new Set((execs || []).map(e => e.id));
  return (events || []).some(ev => eventTouchesDebt(ev, debt, execIds) && (asIso(ev.date) || asIso(ev.requestDate)));
}

function hasParcelamentoEvent(debt, execs, events) {
  const execIds = new Set((execs || []).map(e => e.id));
  return (events || []).some(ev => {
    const t = normalizePrescEventType(ev.type);
    if (t !== 'susp_parcelamento' && t !== 'int_rescisao_parcelamento') return false;
    return eventTouchesDebt(ev, debt, execIds);
  });
}

/** Parcelada por status ou por adesão ainda vigente. Rescisão posterior prevalece. */
export function isCdaParcelada(debt, executions = [], events = [], asOf) {
  if (!debt) return false;
  const asOfIso = asIso(asOf) || localIso(new Date());
  const execs = matchingExecsForDebt(debt, executions);
  const execIds = new Set((execs || []).map(e => e.id));
  const related = (events || []).filter(ev => eventTouchesDebt(ev, debt, execIds));
  const inferred = inferParcelamentoEnds(related);
  let lastAdesao = '';
  let lastResc = '';
  let open = false;
  for (const ev of related) {
    const t = normalizePrescEventType(ev.type);
    const d = asIso(ev.date);
    if (!d) continue;
    if (t === 'int_rescisao_parcelamento' && d > lastResc) lastResc = d;
    if (t === 'susp_parcelamento') {
      if (d > lastAdesao) lastAdesao = d;
      const inferredEnd = inferred.get(ev.id);
      const end = asIso(ev.endDate) || (inferredEnd && inferredEnd.end) || '';
      if (!end || end > asOfIso) open = true;
    }
  }
  if (lastResc && (!lastAdesao || lastResc >= lastAdesao)) return false;
  if (open) return true;
  const st = debt.status;
  if (st === 'parcelada' || st === 'negociada_sispar') return true;
  return (execs || []).some(e => e && e.status === 'suspensa_parcelamento');
}

function isCoveredByIdpj(debt, executions) {
  const execs = matchingExecsForDebt(debt, executions).filter(e => e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  const execIds = new Set(execs.map(e => e.id));
  if (!execIds.size) return false;
  return (executions || []).some(e => {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) return false;
    return (e.linkedExecutionIds || []).some(id => execIds.has(id));
  });
}

function cadastroInconsistencia(debt, execs, events) {
  const st = debt && debt.status;
  if (st === 'suspensa_judicial' || st === 'suspensa_admin') {
    const execIds = new Set((execs || []).map(e => e.id));
    const hasSusp = (events || []).some(ev => {
      const meta = PRESC_EVENT_TYPES[normalizePrescEventType(ev.type)];
      return meta && meta.category === 'suspensiva' && eventTouchesDebt(ev, debt, execIds);
    });
    if (!hasSusp) return `Status diz ${st}, sem evento suspensivo. Cadastre ou corrija.`;
  }
  return '';
}

/** Protocolo + 6 anos civis. Não é marco: só prova que a consumação ainda é impossível. */
export function pessimisticIntercorrenteFloor(protocolIso, asOfIso) {
  const start = asIso(protocolIso);
  if (!start) return null;
  const date = addCalendarYears(start, 6);
  return { date, days: daysUntil(date, asOfIso) };
}

function alertPayload(kind, r, segment, extra = {}) {
  const incident = extra.incident !== undefined
    ? extra.incident
    : ((r.incidents && r.incidents[0]) || null);
  return {
    kind,
    segment,
    days: extra.days != null ? extra.days : r.daysLeft,
    date: extra.date != null ? extra.date : (r.diesAdQuem || ''),
    status: r.status || extra.status || 'sem_dados',
    faixa: extra.faixa || '',
    label: extra.label || '',
    flags: r.flags || [],
    scenario: r.summary || r.scenario || extra.scenario || '',
    summary: r.summary || '',
    checks: r.checks || [],
    incident
  };
}

/**
 * Um aviso operacional por CDA ativa, sem decadência.
 * Recorte de cadastro nunca remove da fila — rebaixa ou vai a sublista.
 */
export function classifyPainelPrescAlert(debt, executions = [], events = [], asOf, prescResult) {
  if (!isPainelPrescCandidate(debt, executions)) return null;
  if (isCdaParcelada(debt, executions, events, asOf)) return null;
  const r = prescResult || computePrescription({ debt, executions, events, asOf });
  const ajuizada = r.segment === 'intercorrente';
  const cycle = ajuizada && intercorrenteCycleStarted(r);
  const asOfIso = asIso(asOf) || localIso(new Date());
  const execs = matchingExecsForDebt(debt, executions);
  const fiscalExecs = execs.filter(e => e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  const exec = r.exec || pickFiscalExec(execs) || fiscalExecs[0] || execs[0];
  const bounds = (r && r.bounds) || computeIntercorrenteBounds({
    exec, debt, cdaEvents: collectEventsForCda(debt, executions, events).events, asOfIso
  });
  const flags = r.flags || [];
  const conferirFlag = flags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO);

  if (ajuizada) {
    if (cycle && r.phase === 'interrompido') {
      return alertPayload('vigiar_interrompido', r, 'intercorrente', {
        days: null,
        date: r.interruptAt || '',
        faixa: 'media',
        label: 'Ciclo encerrado — vigiar nova inércia'
      });
    }
    const alt = r.altWithoutIncident;
    if (cycle && alt && (alt.phase === 'consumado' || (alt.daysLeft != null && alt.daysLeft <= PAINEL_PRESC_WINDOW))) {
      return alertPayload('vencido_estimado', r, 'intercorrente', {
        days: alt.daysLeft,
        date: alt.diesAdQuem || '',
        faixa: 'alta',
        label: (r.checks || []).find(c => /pausa/i.test(c)) || 'Cenário sem a pausa do incidente'
      });
    }
    if (cycle && r.estimated && r.daysLeft != null && r.daysLeft <= PAINEL_PRESC_WINDOW) {
      return alertPayload('vencido_estimado', r, 'intercorrente', {
        faixa: 'alta',
        label: 'Estimado — conferir nos autos'
      });
    }
    if (cycle && r.phase === 'suspenso') {
      return alertPayload('pausa_cadastrada', r, 'intercorrente', {
        faixa: 'media',
        label: 'Exigibilidade suspensa — conferir evento'
      });
    }
    if (cycle && isOverdueResult(r) && !flags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) {
      return alertPayload('vencido', r, 'intercorrente', { faixa: 'alta' });
    }
    if (cycle && isImminentResult(r)) {
      return alertPayload('iminente', r, 'intercorrente', { faixa: 'alta' });
    }
    if (cycle) {
      if (conferirFlag) {
        return alertPayload('residual_alta', r, 'intercorrente', {
          faixa: 'alta',
          label: 'Conferir cadastro / autos'
        });
      }
      return alertPayload('correndo', r, 'intercorrente', {
        faixa: 'media',
        label: 'Prazo em curso'
      });
    }

    const inconsist = cadastroInconsistencia(debt, execs, events);
    if (inconsist) {
      return alertPayload('inconsistencia', r, 'intercorrente', {
        days: bounds.floorDays,
        date: bounds.floor || '',
        faixa: 'alta',
        label: inconsist
      });
    }

    if (bounds.ceiling && bounds.ceilingDays != null && bounds.ceilingDays <= 0) {
      return alertPayload('vencido_estimado', r, 'intercorrente', {
        days: bounds.ceilingDays,
        date: bounds.ceiling,
        faixa: 'alta',
        label: 'Vencido — conferir (estimado). Arquivamento datado + 6 anos.'
      });
    }

    const forecast = asIso(exec && exec.prescriptionForecast);
    const forecastDays = forecast ? daysUntil(forecast, asOfIso) : null;
    const arquivadaSemData = execs.some(e => e.status === 'arquivada');
    const floorAhead = bounds.floor && bounds.floorDays != null && bounds.floorDays > 0;
    const floorOverdue = bounds.floor && bounds.floorDays != null && bounds.floorDays <= 0;
    const floorOverdue2y = bounds.floor && bounds.floorDays != null && bounds.floorDays <= -730;
    const datedEvt = hasDatedPrescEvent(debt, execs, events);
    const planilhaAlta = forecast && forecastDays != null && forecastDays <= PAINEL_PRESC_WINDOW;
    const garantia = CDA_RECORTE_STATUS.has(debt.status) && debt.status === 'garantida'
      || (execs || []).some(e => e.hasGuarantee);
    const planilhaInterrompida = (execs || []).some(e => e.prescriptionInterrupted);

    if (floorAhead) {
      return alertPayload('acompanhar_piso', r, 'intercorrente', {
        days: bounds.floorDays,
        date: bounds.floor,
        faixa: 'baixa',
        label: 'Acompanhar a partir de ' + fmtDate(bounds.floor)
      });
    }

    let alta = !!(arquivadaSemData || planilhaAlta || (floorOverdue2y && !datedEvt) || conferirFlag);
    let media = !!(floorOverdue || !bounds.floor);
    if (planilhaInterrompida && !arquivadaSemData && !planilhaAlta) {
      alta = false;
      media = true;
    }
    if (garantia && alta && !arquivadaSemData) {
      alta = false;
      media = true;
    }

    if (alta) {
      return alertPayload('residual_alta', r, 'intercorrente', {
        days: planilhaAlta ? forecastDays : bounds.floorDays,
        date: (planilhaAlta ? forecast : bounds.floor) || '',
        faixa: 'alta',
        label: arquivadaSemData
          ? 'Arquivada art. 40 sem data de ciência — pedir a data'
          : (planilhaAlta
            ? 'Previsão de planilha, sem ciência lançada'
            : 'Data "não antes de" já passou há mais de 2 anos sem evento datado')
      });
    }
    return alertPayload('residual_media', r, 'intercorrente', {
      days: bounds.floorDays,
      date: (forecast || bounds.floor) || '',
      faixa: 'media',
      label: !bounds.floor
        ? 'Sem protocolo — data "não antes de" incalculável'
        : (forecast ? 'Previsão de planilha, sem ciência lançada' : 'Data "não antes de" já passou — sem agravantes')
    });
  }

  if (isOverdueResult(r)) {
    return alertPayload('vencido', r, 'ordinaria', { faixa: 'alta' });
  }
  if (isImminentResult(r)) {
    return alertPayload('iminente', r, 'ordinaria', { faixa: 'alta' });
  }
  return null;
}

export function buildPainelPrescAlerts(data, asOf, prescLookup) {
  const buckets = {};
  PAINEL_PRESC_KINDS.forEach(k => { buckets[k] = []; });
  if (!data) return buckets;
  const ops = {};
  (data.operations || []).forEach(o => {
    if (o && o.status !== 'encerrada') ops[o.id] = o;
  });
  const executions = data.executions || [];
  const events = data.prescriptionEvents || [];
  const lookup = prescLookup || createPrescLookup(data.debts || [], executions, events, asOf);
  const peopleById = new Map((data.people || []).filter(p => p && p.id).map(p => [p.id, p]));
  const execById = new Map();

  const idpjCovered = new Set();
  const execIdByOpProc = new Map();
  for (let i = 0; i < executions.length; i++) {
    const e = executions[i];
    if (!e) continue;
    if (e.id) execById.set(e.id, e);
    if ((e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') && e.linkedExecutionIds) {
      for (let j = 0; j < e.linkedExecutionIds.length; j++) idpjCovered.add(e.linkedExecutionIds[j]);
    }
    const n = normProc(e.processNumber);
    if (n && e.operationId && e.id) execIdByOpProc.set(e.operationId + '|' + n, e.id);
  }

  (data.debts || []).forEach(d => {
    const op = ops[d.operationId];
    if (!op) return;
    const r = lookup(d);
    const alert = classifyPainelPrescAlert(d, executions, events, asOf, r);
    if (!alert || !buckets[alert.kind]) return;
    const execId = d.processNumber ? execIdByOpProc.get(d.operationId + '|' + normProc(d.processNumber)) : null;
    const execObj = execId ? execById.get(execId) : null;
    buckets[alert.kind].push({
      id: d.id,
      cdaNumber: d.cdaNumber,
      processNumber: d.processNumber,
      status: d.status,
      value: d.value,
      tribute: d.tribute || '',
      personName: ((peopleById.get(d.personId) || {}).name) || '',
      operationId: d.operationId,
      executionId: execId || '',
      court: (execObj && execObj.court) || '',
      prescDate: alert.date,
      prescDays: alert.days,
      prescKind: alert.kind,
      prescSegment: alert.segment,
      prescFaixa: alert.faixa,
      prescLabel: alert.label,
      summary: r.summary || alert.summary || '',
      checks: r.checks || alert.checks || [],
      prescChecks: d.prescChecks || [],
      incident: alert.incident || ((r.incidents && r.incidents[0]) || null),
      informedConflict: !!r.informedConflict,
      estimated: !!r.estimated,
      hasCiencia: r.segment === 'intercorrente' && r.phase !== 'nao_iniciado' && r.cycleKind === 'art40',
      noCiencia: r.segment === 'intercorrente' && r.phase === 'nao_iniciado',
      incidentOnly: (r.gaps || []).some(g => /coincide com um IDPJ/i.test(g)),
      interruptAt: r.interruptAt || '',
      flags: r.flags || [],
      prescDecision: (execObj && execObj.prescDecision) || null,
      decisionNote: engineMoreGraveThanDecision(r, execObj && execObj.prescDecision),
      opName: op.name,
      opId: op.id,
      hasIDPJ: !!(execId && idpjCovered.has(execId))
    });
  });
  buckets.iminente.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  buckets.vencido.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  buckets.vencido_estimado.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  buckets.acompanhar_piso.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  buckets.residual_alta.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  buckets.residual_media.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  if (buckets.correndo) buckets.correndo.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  return buckets;
}

export const PRAZOS_GROUP_LABELS = {
  1: 'Vencido ou iminente (calculado)',
  2: 'Provável — conferir nos autos',
  3: 'Cadastro a completar',
  4: 'Em acompanhamento',
  5: 'Ainda impossível'
};

function rowNeedsCadastro(row) {
  if (!row) return false;
  if (row.informedConflict) return true;
  const inc = row.incident;
  if (inc && !inc.hasConstriction && !inc.hasStay) return true;
  if (inc && inc.hasConstriction && inc.constrictionOpen && /extinta|arquivada/i.test(inc.status || '')) return true;
  if (inc && inc.hasStay && inc.stayOpen && /extinta|arquivada/i.test(inc.status || '')) return true;
  const checks = row.checks || [];
  return checks.some(c =>
    /não tem constrição lançada/i.test(c) ||
    /encerrado; informar a data/i.test(c) ||
    /diverge do termo calculado/i.test(c)
  );
}

/** Prioridade: 1, 2, 3 (cadastro), 5, 4. Grupos 1 e 2 não são rebaixados por cadastro. A decisão importada governa. */
export function groupOfKind(kind, row) {
  let g = 4;
  if (kind === 'vencido' || kind === 'iminente') g = 1;
  else if (kind === 'vencido_estimado' || kind === 'residual_alta') g = 2;
  else if (kind === 'inconsistencia' || rowNeedsCadastro(row)) g = 3;
  else if (kind === 'acompanhar_piso') g = 5;
  const decided = groupFromPrescDecision(row && row.prescDecision, g);
  return decided == null ? g : decided;
}

export function prazosKeyMeta(kind, row) {
  const decision = row && row.prescDecision;
  const date = (row && (row.prescDate || row.date)) || '';
  if (decision && decision.term) {
    const engine = date ? (' · cálculo do app: ' + fmtDate(date)) : '';
    return { date: asIso(decision.term) || date, label: fmtDate(decision.term) + engine, decisionSeal: true };
  }
  if (kind === 'vencido' || kind === 'iminente') {
    return { date, label: date ? fmtDate(date) : '—' };
  }
  if (kind === 'vencido_estimado' || kind === 'residual_alta') {
    return { date, label: date ? ('estimado · ' + fmtDate(date)) : 'estimado' };
  }
  if (kind === 'vigiar_interrompido') {
    const enc = (row && row.interruptAt) || date;
    return { date: enc, label: enc ? ('encerrado em ' + fmtDate(enc)) : 'encerrado' };
  }
  if (kind === 'acompanhar_piso' || kind === 'residual_media') {
    return { date, label: date ? ('não antes de ' + fmtDate(date)) : '—' };
  }
  if (kind === 'correndo') {
    return { date, label: date ? fmtDate(date) : 'em curso' };
  }
  if (kind === 'pausa_cadastrada') {
    return { date, label: date ? ('pausado · ' + fmtDate(date)) : 'pausado' };
  }
  if (kind === 'avaliar_174') {
    return { date, label: date ? fmtDate(date) : 'sem dados' };
  }
  return { date, label: date ? fmtDate(date) : '—' };
}

export function incidentDot(incident) {
  if (!incident) return 'none';
  if ((incident.hasConstriction && incident.constrictionOpen) || (incident.hasStay && incident.stayOpen)) return 'open';
  if (incident.hasConstriction || incident.hasStay) return 'closed';
  return 'cover';
}

export function groupPrazosByProcess(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const proc = r.processNumber ? normProc(r.processNumber) : '';
    const key = (r.operationId || '') + '|' + (proc || ('cda:' + r.id));
    if (!map.has(key)) {
      map.set(key, {
        key,
        processNumber: r.processNumber || '',
        court: r.court || '',
        opName: r.opName || '',
        operationId: r.operationId,
        incident: r.incident || null,
        rows: []
      });
    }
    const g = map.get(key);
    g.rows.push(r);
    if (!g.incident && r.incident) g.incident = r.incident;
    if (!g.court && r.court) g.court = r.court;
  }
  const groups = [...map.values()];
  groups.forEach(g => {
    g.rows.sort((a, b) => a.group - b.group || (a.keyDate || '9999').localeCompare(b.keyDate || '9999'));
    g.worstGroup = Math.min(...g.rows.map(r => r.group));
    g.value = g.rows.reduce((s, r) => s + (r.value || 0), 0);
  });
  groups.sort((a, b) => a.worstGroup - b.worstGroup || (a.processNumber || '').localeCompare(b.processNumber || ''));
  return groups;
}

export function buildPrazosIncidentBlocks(data, rows) {
  const executions = (data && data.executions) || [];
  const events = (data && data.prescriptionEvents) || [];
  const rowsByExecId = new Map();
  for (const r of rows || []) {
    if (!r.executionId) continue;
    if (!rowsByExecId.has(r.executionId)) rowsByExecId.set(r.executionId, []);
    rowsByExecId.get(r.executionId).push(r);
  }
  const blocks = [];
  for (const e of executions) {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) continue;
    const linked = e.linkedExecutionIds || [];
    const efRows = [];
    const efs = [];
    for (const id of linked) {
      const arr = rowsByExecId.get(id) || [];
      efRows.push(...arr);
      const sample = arr[0];
      efs.push({
        executionId: id,
        processNumber: (sample && sample.processNumber) || '',
        worstGroup: arr.length ? Math.min(...arr.map(r => r.group || 9)) : 0,
        cdaCount: arr.length
      });
    }
    const src = events.filter(ev => isBareExecEvent(ev) && ev.executionId === e.id);
    const cons = src.filter(ev => normalizePrescEventType(ev.type) === IDPJ_CONSTRICTION_TYPE && asIso(ev.date));
    const hasConstriction = cons.length > 0;
    const constrictionOpen = cons.some(ev => !asIso(ev.endDate));
    const requestDate = cons.map(ev => asIso(ev.requestDate) || asIso(ev.date)).filter(Boolean).sort()[0] || '';
    const closed = /extinta|arquivada/i.test(e.status || '');
    let conference = 'Sem incidente de constrição lançado.';
    if (!hasConstriction) {
      conference = 'Sem constrição lançada. Se houve indisponibilidade ou bloqueio, lançar com a data do pedido.';
    } else if (closed && constrictionOpen) {
      conference = 'Incidente encerrado; informar a data em que a pausa cessou.';
    } else if (requestDate) {
      conference = 'Constrição lançada · pedido em ' + fmtDate(requestDate);
    } else {
      conference = 'Constrição lançada.';
    }
    const worstGroup = efRows.reduce((m, r) => Math.min(m, r.group || 9), 9);
    blocks.push({
      id: e.id,
      processNumber: e.processNumber || '',
      tag: e.processTag,
      court: e.court || '',
      status: e.status || '',
      operationId: e.operationId,
      opName: ((data.operations || []).find(o => o.id === e.operationId) || {}).name || '',
      hasConstriction,
      constrictionOpen,
      requestDate,
      closed,
      conference,
      worstGroup: worstGroup === 9 ? 0 : worstGroup,
      efCount: linked.length,
      efs,
      rows: efRows
    });
  }
  blocks.sort((a, b) => Number(a.hasConstriction) - Number(b.hasConstriction) || (a.processNumber || '').localeCompare(b.processNumber || ''));
  return blocks;
}

export function buildPrazosRadar(data, asOf, prescLookup) {
  const buckets = buildPainelPrescAlerts(data, asOf, prescLookup);
  const rows = [];
  Object.keys(buckets).forEach(kind => {
    (buckets[kind] || []).forEach(r => {
      const group = groupOfKind(r.prescKind || kind, r);
      const key = prazosKeyMeta(r.prescKind || kind, r);
      rows.push({
        ...r,
        group,
        keyDate: key.date,
        keyLabel: key.label,
        incidentDot: incidentDot(r.incident)
      });
    });
  });
  const totals = {
    1: { n: 0, value: 0 },
    2: { n: 0, value: 0 },
    3: { n: 0, value: 0 },
    4: { n: 0, value: 0 },
    5: { n: 0, value: 0 }
  };
  const byOp = {};
  rows.forEach(r => {
    if (totals[r.group]) {
      totals[r.group].n++;
      totals[r.group].value += r.value || 0;
    }
    if (!r.operationId) return;
    if (!byOp[r.operationId]) byOp[r.operationId] = { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, risco: 0, completar: 0 };
    const slot = byOp[r.operationId];
    slot['g' + r.group] = (slot['g' + r.group] || 0) + 1;
    if (r.group === 1 || r.group === 2) slot.risco++;
    if (r.group === 3) slot.completar++;
  });
  return {
    rows,
    totals,
    byOp,
    incidents: buildPrazosIncidentBlocks(data, rows),
    buckets,
    divergencias: rows.filter(r => r.decisionNote).length
  };
}

export function prazosRiskMetaForCdas(cdas, byDebt) {
  let n1 = 0;
  let n2 = 0;
  let n3 = 0;
  let minGroup = 9;
  const days = [];
  (cdas || []).forEach(d => {
    if (!d || d.prescriptionHandled) return;
    const row = byDebt && typeof byDebt.get === 'function' ? byDebt.get(d.id) : null;
    const g = (row && row.group) || 0;
    if (g === 1) n1++;
    else if (g === 2) n2++;
    else if (g === 3) n3++;
    if (g && g < minGroup) minGroup = g;
    if (row && (g === 1 || g === 2) && row.prescDays != null) days.push(row.prescDays);
  });
  const allHandled = (cdas || []).length > 0 && (cdas || []).every(d => d.prescriptionHandled);
  const risco = n1 + n2;
  const label = allHandled ? 'Tratadas'
    : n1 ? n1 + ' urgentes'
    : n2 ? n2 + ' a conferir'
    : n3 ? n3 + ' a completar'
    : minGroup === 5 ? 'ainda impossível'
    : minGroup < 9 ? 'em acompanhamento'
    : '—';
  const riskClass = allHandled ? 'ok' : n1 ? 'critical' : (n2 || n3) ? 'warning' : '';
  const minRiskDays = days.length ? Math.min(...days) : null;
  return { n1, n2, n3, risco, label, riskClass, minRiskDays };
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMÓRIA TÉCNICA EXPORTÁVEL (texto para colar em peça)
// ═══════════════════════════════════════════════════════════════════════════

const _money = (v) => (v == null || isNaN(Number(v))) ? '—'
  : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REPORT_SECTION_TITLES = {
  decadencia: 'DECADÊNCIA (arts. 150, §4º, e 173 do CTN; Súmulas 555 e 622/STJ; Tema 163/STJ)',
  ordinaria: 'PRESCRIÇÃO ORDINÁRIA (art. 174 do CTN; Tema 383/STJ; Súmulas 436 e 653/STJ)',
  intercorrente: 'PRESCRIÇÃO INTERCORRENTE (art. 40 da LEF; Súmula 314/STJ; Temas 566–571/STJ; Tema 390/STF). Ciclo pós-parcelamento = política interna, não marco do Tema 566.'
};

function reportSection(lines, roman, key, result) {
  if (!result) return;
  lines.push(`${roman}. ${REPORT_SECTION_TITLES[key]}`);
  if (result.summary) lines.push(result.summary);
  let n = 1;
  (result.memory || []).forEach(m => {
    lines.push(`${n++}. ${m.date ? fmtDate(m.date) + ' — ' : ''}${m.event}: ${m.effect}`);
  });
  if (result.detail) lines.push(`Conclusão: ${result.detail}`);
  (result.flags || []).forEach(f => {
    if (f === PRESC_FLAGS.PEDIDO_SEM_DESFECHO) lines.push('🔴 Pedido na janela 1+5 sem resultado lançado — não declarar consumada.');
  });
  (result.gaps || []).forEach(g => lines.push(`🔴 ${g}`));
  lines.push('');
}

/**
 * Memória técnica de uma CDA — texto numerado e neutro, pronto para colar.
 * scope: 'completo' | 'decadencia' | 'ordinaria' | 'intercorrente'
 */
export function buildPrescricaoReport({ debt, timeline, personName = '', exec = null, scope = 'completo', asOf, includeHeader = true } = {}) {
  if (!debt || !timeline) return '';
  const L = [];
  if (includeHeader) {
    L.push('MEMÓRIA TÉCNICA — DECADÊNCIA E PRESCRIÇÃO');
    L.push('');
  }
  L.push(`CDA ${debt.cdaNumber || 's/nº'}${debt.tribute ? ' · ' + debt.tribute : ''}${debt.value != null ? ' · ' + _money(debt.value) : ''}`);
  if (personName) L.push(`Devedor: ${personName}`);
  if (debt.inscriptionDate) L.push(`Inscrição em dívida ativa: ${fmtDate(debt.inscriptionDate)}`);
  if (debt.processNumber) L.push(`Execução fiscal: ${debt.processNumber}${exec && exec.court ? ' — ' + exec.court : ''}${exec && exec.protocolDate ? ' — ajuizada em ' + fmtDate(exec.protocolDate) : ''}`);
  if (includeHeader) {
    L.push(`Gerada em ${fmtDate(asIso(asOf) || localIso(new Date()))} pelo NEXUS. Conferir os marcos nos autos antes de utilizar; itens 🔴 pendem de confirmação.`);
  }
  L.push('');
  const romans = { decadencia: 'I', ordinaria: 'II', intercorrente: 'III' };
  ['decadencia', 'ordinaria', 'intercorrente'].forEach(key => {
    if (scope !== 'completo' && scope !== key) return;
    reportSection(L, romans[key], key, timeline[key]);
  });
  return L.join('\n').trim();
}

/** Memória técnica consolidada de um processo — todas as CDAs vinculadas. */
export function buildProcessPrescricaoReport({ exec, entries = [], scope = 'completo', asOf } = {}) {
  const L = [];
  L.push('MEMÓRIA TÉCNICA CONSOLIDADA — DECADÊNCIA E PRESCRIÇÃO');
  L.push('');
  if (exec) {
    L.push(`Execução fiscal: ${exec.processNumber || 's/nº'}${exec.court ? ' — ' + exec.court : ''}${exec.protocolDate ? ' — ajuizada em ' + fmtDate(exec.protocolDate) : ''}`);
  }
  const total = entries.reduce((s, e) => s + (e.debt && e.debt.value ? e.debt.value : 0), 0);
  L.push(`${entries.length} inscrição(ões) — total ${_money(total)}`);
  L.push(`Gerada em ${fmtDate(asIso(asOf) || localIso(new Date()))} pelo NEXUS. Conferir os marcos nos autos antes de utilizar; itens 🔴 pendem de confirmação.`);
  L.push('');
  entries.forEach((e, i) => {
    L.push(`═══ ${i + 1}/${entries.length} ═══`);
    L.push(buildPrescricaoReport({ debt: e.debt, timeline: e.timeline, personName: e.personName || '', exec: e.exec || exec || null, scope, asOf, includeHeader: false }));
    L.push('');
  });
  return L.join('\n').trim();
}
