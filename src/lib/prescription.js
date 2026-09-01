/**
 * Motor único de prescrição.
 * Modo originário (CDA não ajuizada, art. 174) e modo intercorrente (art. 40 LEF / Tema 566).
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
  susp_outra: { label: 'Outra causa suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Outra causa suspensiva com fundamentação.' },
  info_peticao_sem_resultado: { label: 'Petição sem resultado útil', category: 'info', color: 'var(--text-muted)', desc: 'Mero peticionamento. NÃO interrompe (Tema 568).' },
  info_arquivamento: { label: 'Arquivamento (art. 40, §3º)', category: 'info', color: 'var(--text-muted)', desc: 'Arquivamento provisório após 1 ano de suspensão.' },
  info_desarquivamento: { label: 'Desarquivamento', category: 'info', color: 'var(--text-muted)', desc: 'Desarquivamento do feito.' },
  info_decisao_prescricao: { label: 'Decisão sobre prescrição', category: 'info', color: 'var(--text-muted)', desc: 'Decisão judicial relacionada à prescrição intercorrente.' },
  info_outro: { label: 'Outro evento', category: 'info', color: 'var(--text-muted)', desc: 'Registro informativo sem efeito no cômputo.' }
};

/** Constrição na própria EF: interrompe a intercorrente (Tema 568). */
export const EF_CONSTRICTION_TYPES = new Set(['int_penhora', 'int_arresto', 'int_sisbajud', 'int_cnib']);
/** Alias legado — tratado como int_citacao. */
export const CITACAO_ALIASES = new Set(['int_citacao', 'int_citacao_devedor']);

export const IDPJ_CONSTRICTION_TYPE = 'susp_idpj_mcf_constricao';

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
  ...overrides
});

const statusFrom = (phase, daysLeft) => {
  if (phase === 'consumado' || (daysLeft != null && daysLeft <= 0 && (phase === 'correndo' || phase === 'originario'))) return 'prescrito';
  if (phase === 'interrompido' || phase === 'nao_iniciado') return 'seguro';
  if (phase === 'suspenso' || phase === 'suspenso_art151') return 'suspenso';
  if (daysLeft == null) return 'sem_dados';
  if (daysLeft <= 365) return 'critico';
  if (daysLeft <= 730) return 'alerta';
  return 'correndo';
};

export const prescOriginLabel = (r) => {
  if (!r) return '';
  if (r.origin === 'data_informada') return 'informada';
  if (r.origin === 'calculo_validado') return 'calculada';
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
  const push = (map, key, ev) => {
    if (!key) return;
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(ev);
  };
  for (const ev of events || []) {
    if (!ev) continue;
    if (ev.cdaId) push(byCda, ev.cdaId, ev);
    if (ev.batchCdaIds && ev.batchCdaIds.length) {
      for (const id of ev.batchCdaIds) push(byCda, id, ev);
    }
    if (isBareExecEvent(ev)) push(byExecBare, ev.executionId, ev);
    if (ev._inheritedFromParent) push(byInheritedParent, ev._inheritedFromParent, ev);
  }
  return { execByProc, execsByProc, execById, byCda, byExecBare, byInheritedParent };
}

export function collectEventsForCda(debt, executions, events, collectIndex) {
  const execs = executions || [];
  const evts = events || [];
  const matchingExecs = debt && debt.processNumber
    ? (collectIndex
      ? (collectIndex.execsByProc?.get(normProc(debt.processNumber)) || (collectIndex.execByProc.get(normProc(debt.processNumber)) ? [collectIndex.execByProc.get(normProc(debt.processNumber))] : []))
      : execs.filter(e => sameProc(e.processNumber, debt.processNumber)))
    : [];
  const exec = matchingExecs[0] || null;
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
  const seen = new Set();
  const merged = [];
  for (const e of [...direct, ...inherited]) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  merged.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  return { exec, events: merged };
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
  let end = rawEnd || asOfIso;
  if (end > asOfIso) end = asOfIso;
  return {
    stored,
    inferred,
    rawEnd,
    end,
    ongoing: !rawEnd || rawEnd > asOfIso
  };
}

/** Avança `need` dias não pausados a partir de start. */
function addUnpausedDays(startIso, need, pauses) {
  if (need <= 0) return startIso;
  let d = startIso;
  let added = 0;
  let guard = 0;
  while (added < need && guard++ < 5000) {
    d = addCalendarDays(d, 1);
    if (!pausedAt(d, pauses)) added++;
  }
  return d;
}

function yearSpanDays(startIso, years) {
  const end = addCalendarYears(startIso, years);
  return Math.max(0, daysBetween(startIso, end));
}

/** 1 ano de suspensão (art. 40) + 5 anos civis, descontadas pausas. */
function addArt40PlusFive(startIso, pauses) {
  const art40End = addUnpausedDays(startIso, yearSpanDays(startIso, 1), pauses);
  return { art40End, diesAdQuem: addUnpausedDays(art40End, yearSpanDays(art40End, 5), pauses) };
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
  const { exec, events: cdaEvents } = collectEventsForCda(debt, executions, events, collectIndex);
  const memory = [];
  const gaps = [];
  const timeline = [];

  const informed = asIso(debt.prescriptionDate);
  const forecast = exec ? asIso(exec.prescriptionForecast) : '';

  if (!exec) {
    return computeOriginario({ debt, cdaEvents, asOfIso, informed, memory, gaps, timeline });
  }
  return computeIntercorrente({ debt, exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline });
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

function computeOriginario({ debt, exec = null, cdaEvents, asOfIso, informed, memory, gaps, timeline }) {
  const constitution = asIso(debt.constitutionDate);
  const start = constitution || asIso(debt.inscriptionDate);
  if (!start && exec) {
    gaps.push('Sem âncora de constituição/inscrição para o quinquênio do art. 174.');
    return {
      ...emptyResult(),
      segment: 'credito',
      origin: 'estimativa',
      phase: 'interrompido',
      status: 'seguro',
      detail: 'Ajuizada — prescrição ordinária interrompida com retroação à propositura (Tema 383). Sem âncora para reconstituir o quinquênio.',
      prescriptionInterrupted: true,
      memory, gaps, timeline
    };
  }
  if (!start && !informed) {
    return emptyResult({
      segment: 'credito',
      gaps: ['Sem data de inscrição nem data informada.'],
      memory, timeline
    });
  }
  if (!start) gaps.push('Sem inscrição — usando só a data informada.');
  else if (!constitution && !asIso(debt.firstChargeDate)) {
    gaps.push('Âncora é a inscrição, não a constituição definitiva.');
  }

  let originStart = start;
  const pauses = applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup: true, originario: true });
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
          gaps.push(`Parcelamento de ${fmtDate(efetivacao)} sem data de cessação — tratado como encerrado em ${fmtDate(inferred.end)} (${how}). Conferir se ainda está vigente.`);
        } else if (type === 'susp_parcelamento' && !asIso(evt.endDate)) {
          parcEffect = 'Interrompe o originário (Súmula 653) e suspende enquanto vigente (sem cessação — tratado como em vigor).';
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
      memory, gaps, timeline
    };
  }

  const need = yearSpanDays(originStart, 5);
  const diesAdQuemComputed = addUnpausedDays(originStart, need, pauses);
  const activeNow = pauses.filter(p => p.ongoing);

  // ─── Ajuizada: o quinquênio do art. 174 termina no ajuizamento (Tema 383) ───
  if (exec) {
    const protocol = asIso(exec.protocolDate) || asIso(debt.protocolDate);
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
        detail: `Prescrição ordinária consumada em ${fmtDate(diesAdQuemComputed)}, ANTES do ajuizamento (${fmtDate(protocol)}). Verificar causas interruptivas não registradas (parcelamento, confissão — Súmula 653).`,
        memory, gaps, timeline,
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
      detail: `Prescrição ordinária interrompida pelo ajuizamento${protocol ? ' em ' + fmtDate(protocol) : ''} (Tema 383) — dentro do quinquênio iniciado em ${fmtDate(originStart)}. O risco passa à intercorrente.`,
      memory, gaps, timeline,
      prescriptionInterrupted: true, prescDaysConsumed: 0, suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    };
  }

  const diesAdQuem = informed || diesAdQuemComputed;
  const origin = informed ? 'data_informada' : (constitution || cdaEvents.some(e => PRESC_EVENT_TYPES[normalizePrescEventType(e.type)]) ? 'calculo_validado' : 'estimativa');
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
    memory, gaps, timeline,
    prescriptionInterrupted: false,
    prescDaysConsumed: Math.max(0, need - Math.max(0, daysLeft || 0)),
    suspDaysConsumed: 0,
    activeSuspensions: activeNow.map(p => p.id)
  };
}

function intercorrenteWindowEnd({ marco, parcRestartAt, pauses, beforeIso }) {
  const relevant = beforeIso ? pauses.filter(p => p.start < beforeIso) : pauses;
  if (parcRestartAt) {
    return addArt40PlusFive(parcRestartAt, relevant).diesAdQuem;
  }
  if (!marco) return null;
  return addArt40PlusFive(marco, relevant).diesAdQuem;
}

function computeIntercorrente({ exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline }) {
  const pauses = applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup: true, originario: false });
  const inferredEnds = inferParcelamentoEnds(cdaEvents);
  let marco = null;
  let interrupted = false;
  let interruptAt = null;
  let tooLate = false;
  let parcMode = false;
  let parcOngoing = false;
  let parcRestartAt = null;
  let lastParcAdesao = null;
  let notedParcRule = false;

  const noteParcRule = () => {
    if (notedParcRule) return;
    notedParcRule = true;
    gaps.push('Modo de contagem após parcelamento na execução: o pedido interrompe (art. 174, p.ú., IV CTN; Súmula 653; TRF4). Com a rescisão, inicia-se o ciclo 1+5 (1 ano de suspensão + 5 anos), por equiparação da rescisão ao marco do art. 40 / Tema 566. A 1ª Turma do TRF4 (Pitten) em alguns acórdãos dispensa o ano do art. 40 — aqui o ano é contado.');
  };

  noteDuplicateConstriction(cdaEvents, gaps);

  for (const evt of cdaEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type] || { category: 'info', label: type, desc: '' };
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;
    if (type === IDPJ_CONSTRICTION_TYPE && efetivacao > asOfIso) continue;

    const isConstriction = EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type);
    const effectDate = (isConstriction && asIso(evt.requestDate)) ? asIso(evt.requestDate) : efetivacao;

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
      timeline.push({ ...evt, effect: 'Registro do ano do art. 40 — o marco já inicia a suspensão (não soma segundo ano).', phase: marco ? 'suspensao_art40' : 'pre_marco' });
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
        beforeIso: effectDate
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
      memPush(memory, efetivacao, meta.label, 'Rescisão: exigibilidade restabelecida. Inicia o ciclo 1+5 (1 ano + 5 anos), por equiparação ao marco do art. 40 / Tema 566.');
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
        beforeIso: from
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
      if (inferred) {
        gaps.push(`Parcelamento de ${fmtDate(efetivacao)} sem data de cessação — tratado como encerrado em ${fmtDate(inferred.end)}. Conferir se ainda está vigente.`);
      }
      const until = resolved.rawEnd ? fmtDate(resolved.rawEnd) : 'hoje';
      const inferTag = inferred ? ` (cessação inferida — ${inferred.reason === 'rescisao' ? 'rescisão posterior' : 'adesão seguinte'})` : '';
      memPush(memory, efetivacao, meta.label, resolved.ongoing
        ? `INTERROMPE a intercorrente (art. 174, p.ú., IV CTN; Súmula 653; TRF4) e suspende a exigibilidade enquanto vigente (art. 151, VI). Após a rescisão, conta-se 1+5 (modo art. 40 / Tema 566).`
        : `INTERROMPE a intercorrente (art. 174, p.ú., IV CTN; TRF4). Vigente até ${until}${inferTag}. Modo de contagem: 1 ano + 5 anos a partir de ${fmtDate(parcRestartAt)} (equiparação da rescisão ao marco do art. 40).`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: resolved.ongoing ? 'suspenso' : 'prescricao_correndo' });
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
    const diesAdQuemComputed = addCalendarYears(asOfIso, 6);
    const diesAdQuem = informed || diesAdQuemComputed;
    memPush(memory, lastParcAdesao, 'Dies a quo', 'Pedido/adesão ao parcelamento — interrupção (art. 174, p.ú., IV).');
    memPush(memory, diesAdQuemComputed, 'Termo final projetado', 'Parcelamento vigente. Após a rescisão, o ciclo será 1+5. Projeção: hoje + 1 ano + 5 anos.');
    return {
      segment: 'intercorrente',
      origin: informed ? 'data_informada' : 'calculo_validado',
      phase: 'suspenso',
      status: 'suspenso',
      diesAQuo: lastParcAdesao,
      diesAdQuem,
      daysLeft: daysUntil(diesAdQuem, asOfIso),
      detail: `Parcelamento vigente (art. 151, VI). Interrompe a intercorrente; após a rescisão conta-se 1+5. Termo projetado: ${fmtDate(diesAdQuem)}.`,
      memory, gaps, timeline,
      prescriptionInterrupted: true,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    };
  }

  if (interrupted && !tooLate) {
    return {
      segment: 'intercorrente',
      origin: informed ? 'data_informada' : 'calculo_validado',
      phase: 'interrompido',
      status: 'seguro',
      diesAQuo: marco,
      diesAdQuem: informed || null,
      daysLeft: informed ? daysUntil(informed, asOfIso) : null,
      detail: `Prescrição interrompida (constrição/citação efetiva${interruptAt ? ' em ' + fmtDate(interruptAt) : ''}). Ciclo do art. 40 encerrado — só reinicia com novo marco.`,
      memory, gaps, timeline,
      prescriptionInterrupted: true,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    };
  }

  if (parcMode && parcRestartAt) {
    const { art40End, diesAdQuem: diesAdQuemComputed } = addArt40PlusFive(parcRestartAt, pauses);
    const diesAdQuem = informed || diesAdQuemComputed;
    const origin = informed ? 'data_informada' : 'calculo_validado';
    const daysLeft = daysUntil(diesAdQuem, asOfIso);
    const activeBeforeTerm = activeNow.filter(p => !diesAdQuem || p.start < diesAdQuem);
    let phase = 'correndo';
    if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
    else if (activeBeforeTerm.length) phase = 'suspenso';
    else if (asOfIso < art40End) phase = 'suspensao_art40';
    memPush(memory, parcRestartAt, 'Dies a quo (rescisão)', 'Modo de contagem 1+5: a rescisão é equiparada ao marco do art. 40 / Tema 566.');
    memPush(memory, art40End, 'Fim do 1º ano', '1 ano civil de suspensão a partir da rescisão.');
    memPush(memory, diesAdQuemComputed, 'Dies ad quem (calculado)', '5 anos civis após o ano de suspensão, descontadas outras causas do art. 151.');
    const detail = phase === 'suspenso'
      ? `Prescrição suspensa (causa ativa). Termo final projetado: ${fmtDate(diesAdQuem)}.`
      : (phase === 'suspensao_art40'
        ? `Fase de suspensão (1º ano após a rescisão). O quinquênio começa em ${fmtDate(art40End)}. Termo final: ${fmtDate(diesAdQuem)}.`
        : (phase === 'consumado'
          ? `PRESCRIÇÃO INTERCORRENTE CONSUMADA em ${fmtDate(diesAdQuem)} (ciclo 1+5 contado da rescisão do parcelamento).`
          : `Ciclo 1+5 em curso desde a rescisão (${fmtDate(parcRestartAt)}). Termo final: ${fmtDate(diesAdQuem)} (${daysLeft}d).`));
    return {
      segment: 'intercorrente',
      origin,
      phase,
      status: statusFrom(phase === 'suspensao_art40' ? 'correndo' : phase, daysLeft),
      diesAQuo: parcRestartAt,
      diesAdQuem,
      daysLeft,
      detail,
      memory, gaps, timeline,
      prescriptionInterrupted: false,
      prescDaysConsumed: Math.max(0, yearSpanDays(parcRestartAt, 6) - Math.max(0, daysLeft || 0)),
      suspDaysConsumed: 0,
      activeSuspensions: activeBeforeTerm.map(p => p.id)
    };
  }

  if (!marco) {
    const diesAdQuem = informed || forecast || null;
    const origin = informed || forecast ? 'data_informada' : 'estimativa';
    if (!diesAdQuem) {
      gaps.push('Sem marco de não localização / ausência de bens. Intercorrente não iniciada (Tema 566). Originária interrompida pelo ajuizamento (Tema 383).');
    }
    const daysLeft = diesAdQuem ? daysUntil(diesAdQuem, asOfIso) : null;
    return {
      segment: 'intercorrente',
      origin: diesAdQuem ? 'data_informada' : 'estimativa',
      phase: 'nao_iniciado',
      status: diesAdQuem ? statusFrom('correndo', daysLeft) : 'seguro',
      diesAQuo: asIso(exec.protocolDate) || null,
      diesAdQuem,
      daysLeft,
      detail: diesAdQuem
        ? `Sem marco. Data informada (${origin === 'data_informada' ? (informed ? 'CDA' : 'previsão da planilha') : ''}): ${fmtDate(diesAdQuem)}.`
        : 'Nenhum marco prescricional ativo. Ciclo do art. 40 LEF não iniciado. Originária interrompida pelo ajuizamento (Tema 383).',
      memory, gaps, timeline,
      prescriptionInterrupted: false,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    };
  }

  const art40Need = yearSpanDays(marco, 1);
  const art40End = addUnpausedDays(marco, art40Need, pauses);
  const prescNeed = yearSpanDays(art40End, 5);
  const prescEndComputed = addUnpausedDays(art40End, prescNeed, pauses);
  const diesAdQuem = informed || prescEndComputed;
  const origin = informed ? 'data_informada' : 'calculo_validado';
  const daysLeft = daysUntil(diesAdQuem, asOfIso);

  let phase;
  if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
  else if (activeNow.filter(p => !diesAdQuem || p.start < diesAdQuem).length) phase = 'suspenso';
  else if (asOfIso < art40End) phase = 'suspensao_art40';
  else phase = 'correndo';

  const unpaused = Math.max(0, daysBetween(marco, asOfIso) - pauses.reduce((s, p) => {
    const a = p.start < marco ? marco : p.start;
    const b = (p.end || asOfIso) > asOfIso ? asOfIso : (p.end || asOfIso);
    return s + (b > a ? daysBetween(a, b) : 0);
  }, 0));
  const suspDaysConsumed = Math.min(art40Need, unpaused);
  const prescDaysConsumed = Math.max(0, unpaused - art40Need);

  memPush(memory, marco, 'Dies a quo (marco)', 'Ciência da não localização / ausência de bens.');
  memPush(memory, art40End, 'Fim da suspensão art. 40', '1 ano civil, descontadas pausas do art. 151 / IDPJ.');
  memPush(memory, prescEndComputed, 'Dies ad quem (calculado)', '5 anos civis após o ano do art. 40.');

  let detail;
  if (phase === 'suspenso') detail = `Prescrição suspensa (causa ativa). Termo final projetado: ${fmtDate(diesAdQuem)}.`;
  else if (phase === 'suspensao_art40') detail = `Fase de suspensão art. 40. O quinquênio começa em ${fmtDate(art40End)}. Termo final: ${fmtDate(diesAdQuem)}.`;
  else if (phase === 'consumado') detail = `PRESCRIÇÃO INTERCORRENTE CONSUMADA em ${fmtDate(diesAdQuem)}.`;
  else detail = `Prazo quinquenal em curso. Termo final: ${fmtDate(diesAdQuem)} (${daysLeft}d).`;

  return {
    segment: 'intercorrente',
    origin,
    phase,
    status: statusFrom(phase === 'suspensao_art40' ? 'correndo' : phase, daysLeft),
    diesAQuo: marco,
    diesAdQuem,
    daysLeft,
    detail,
    memory, gaps, timeline,
    prescriptionInterrupted: false,
    prescDaysConsumed,
    suspDaysConsumed,
    activeSuspensions: activeNow.map(p => p.id)
  };
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
    if (debt.prescriptionDate) return debt.prescriptionDate;
    const r = get(debt);
    return r.diesAdQuem || '';
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
  const rank = { prescrito: 0, critico: 1, alerta: 2, suspenso: 3, correndo: 4, seguro: 5, sem_dados: 6 };
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
    d.prescriptionSnapshot = {
      diesAdQuem: r.diesAdQuem || '',
      daysLeft: r.daysLeft,
      origin: r.origin,
      phase: r.phase,
      segment: r.segment,
      status: r.status,
      detail: r.detail,
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
  return EF_CONSTRICTION_TYPES.has(t) || t === IDPJ_CONSTRICTION_TYPE;
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
export function computeDecadencia(debt, asOf) {
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

/** Prescrição ordinária (art. 174 CTN) — mesmo motor do originário, com a checagem do Tema 383 quando ajuizada. */
export function computeOrdinaria({ debt, executions = [], events = [], asOf } = {}) {
  if (!debt) return emptyResult();
  const asOfIso = asIso(asOf) || localIso(new Date());
  const { exec, events: cdaEvents } = collectEventsForCda(debt, executions, events);
  return computeOriginario({
    debt, exec, cdaEvents, asOfIso,
    informed: exec ? '' : asIso(debt.prescriptionDate),
    memory: [], gaps: [], timeline: []
  });
}

const LEGAL_SEVERITY = {
  prescrito: 6, consumada: 6, consumado: 6,
  critico: 5, alerta: 4, risco: 3,
  correndo: 2, em_curso: 2, originario: 2,
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

function isPainelPrescCandidate(debt) {
  if (!debt || debt.status === 'extinta') return false;
  if (debt.prescriptionHandled) return false;
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
  if (!r) return false;
  if (r.status === 'prescrito' || r.status === 'consumado' || r.status === 'consumada') return true;
  return r.diesAdQuem && r.daysLeft != null && r.daysLeft <= 0;
}

function isImminentResult(r) {
  if (!r || !r.diesAdQuem || r.daysLeft == null) return false;
  return r.daysLeft > 0 && r.daysLeft <= PAINEL_PRESC_WINDOW;
}

/**
 * Um aviso operacional por CDA ativa, sem decadência.
 * kind: iminente | vencido | avaliar_174 | avaliar_intercorrente | null
 * prescResult: resultado já calculado de computePrescription (lookup do app).
 */
export function classifyPainelPrescAlert(debt, executions = [], events = [], asOf, prescResult) {
  if (!isPainelPrescCandidate(debt)) return null;
  const r = prescResult || computePrescription({ debt, executions, events, asOf });
  const ajuizada = r.segment === 'intercorrente';
  const cycle = ajuizada && intercorrenteCycleStarted(r);

  if (ajuizada) {
    if (cycle && isOverdueResult(r)) {
      return { kind: 'vencido', segment: 'intercorrente', days: r.daysLeft, date: r.diesAdQuem || '', status: r.status };
    }
    if (cycle && isImminentResult(r)) {
      return { kind: 'iminente', segment: 'intercorrente', days: r.daysLeft, date: r.diesAdQuem || '', status: r.status };
    }
    if (!cycle) {
      return { kind: 'avaliar_intercorrente', segment: 'intercorrente', days: null, date: '', status: r.status || 'sem_dados' };
    }
    return null;
  }

  if (isOverdueResult(r)) {
    return { kind: 'vencido', segment: 'ordinaria', days: r.daysLeft, date: r.diesAdQuem || '', status: r.status };
  }
  if (isImminentResult(r)) {
    return { kind: 'iminente', segment: 'ordinaria', days: r.daysLeft, date: r.diesAdQuem || '', status: r.status };
  }
  if (r.diesAdQuem && (r.daysLeft == null || r.daysLeft > PAINEL_PRESC_WINDOW)) return null;
  return {
    kind: 'avaliar_174',
    segment: 'ordinaria',
    days: r.daysLeft,
    date: r.diesAdQuem || '',
    status: r.status || 'sem_dados'
  };
}

export function buildPainelPrescAlerts(data, asOf, prescLookup) {
  const buckets = { iminente: [], vencido: [], avaliar_174: [], avaliar_intercorrente: [] };
  if (!data) return buckets;
  const ops = {};
  (data.operations || []).forEach(o => {
    if (o && o.status !== 'encerrada') ops[o.id] = o;
  });
  const executions = data.executions || [];
  const events = data.prescriptionEvents || [];
  const lookup = prescLookup || createPrescLookup(data.debts || [], executions, events, asOf);

  const idpjCovered = new Set();
  const execIdByOpProc = new Map();
  for (let i = 0; i < executions.length; i++) {
    const e = executions[i];
    if (!e) continue;
    if ((e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') && e.linkedExecutionIds) {
      for (let j = 0; j < e.linkedExecutionIds.length; j++) idpjCovered.add(e.linkedExecutionIds[j]);
    }
    const n = normProc(e.processNumber);
    if (n && e.operationId && e.id) execIdByOpProc.set(e.operationId + '|' + n, e.id);
  }

  (data.debts || []).forEach(d => {
    const op = ops[d.operationId];
    if (!op) return;
    const alert = classifyPainelPrescAlert(d, executions, events, asOf, lookup(d));
    if (!alert || !buckets[alert.kind]) return;
    const execId = d.processNumber ? execIdByOpProc.get(d.operationId + '|' + normProc(d.processNumber)) : null;
    buckets[alert.kind].push({
      id: d.id,
      cdaNumber: d.cdaNumber,
      processNumber: d.processNumber,
      status: d.status,
      value: d.value,
      operationId: d.operationId,
      prescDate: alert.date,
      prescDays: alert.days,
      prescKind: alert.kind,
      prescSegment: alert.segment,
      opName: op.name,
      opId: op.id,
      hasIDPJ: !!(execId && idpjCovered.has(execId))
    });
  });
  buckets.iminente.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  buckets.vencido.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  return buckets;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMÓRIA TÉCNICA EXPORTÁVEL (texto para colar em peça)
// ═══════════════════════════════════════════════════════════════════════════

const _money = (v) => (v == null || isNaN(Number(v))) ? '—'
  : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REPORT_SECTION_TITLES = {
  decadencia: 'DECADÊNCIA (arts. 150, §4º, e 173 do CTN; Súmulas 555 e 622/STJ; Tema 163/STJ)',
  ordinaria: 'PRESCRIÇÃO ORDINÁRIA (art. 174 do CTN; Tema 383/STJ; Súmulas 436 e 653/STJ)',
  intercorrente: 'PRESCRIÇÃO INTERCORRENTE (art. 40 da LEF; Súmula 314/STJ; Temas 566–571/STJ; Tema 390/STF; parcelamento: art. 174, p.ú., IV + ciclo 1+5 da rescisão)'
};

function reportSection(lines, roman, key, result) {
  if (!result) return;
  lines.push(`${roman}. ${REPORT_SECTION_TITLES[key]}`);
  let n = 1;
  (result.memory || []).forEach(m => {
    lines.push(`${n++}. ${m.date ? fmtDate(m.date) + ' — ' : ''}${m.event}: ${m.effect}`);
  });
  if (result.detail) lines.push(`Conclusão: ${result.detail}`);
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
