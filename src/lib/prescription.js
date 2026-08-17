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
  int_protesto_extrajudicial: { label: 'Protesto extrajudicial da CDA', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto extrajudicial da CDA (art. 174, p.ú., CTN, LC 208/2024). Data: registro no cartório.' },
  int_outra: { label: 'Outra causa interruptiva', category: 'interruptiva', color: 'var(--green)', desc: 'Outra causa interruptiva com fundamentação.' },
  susp_parcelamento: { label: 'Parcelamento (efeito duplo)', category: 'suspensiva', color: 'var(--blue)', desc: 'Originário: interrompe (Súmula 653) e suspende enquanto vigente (art. 151, VI). Intercorrente: só suspende (não zera o ciclo do art. 40).' },
  int_rescisao_parcelamento: { label: 'Rescisão de parcelamento', category: 'interruptiva', color: 'var(--red)', desc: 'Fim da vigência. No originário, o quinquênio reinicia da rescisão. Na intercorrente, apenas encerra a pausa.' },
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

const asIso = (v) => toDayKey(v) || '';

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

export function collectEventsForCda(debt, executions, events) {
  const execs = executions || [];
  const evts = events || [];
  const exec = debt && debt.processNumber ? execs.find(e => sameProc(e.processNumber, debt.processNumber)) : null;
  const direct = evts.filter(e =>
    e.cdaId === debt.id ||
    (e.batchCdaIds && e.batchCdaIds.includes(debt.id)) ||
    (exec && e.executionId === exec.id && !e.cdaId && (!e.batchCdaIds || e.batchCdaIds.length === 0))
  );
  let inherited = [];
  if (exec && exec.parentExecutionId) {
    const parent = execs.find(e => e.id === exec.parentExecutionId);
    if (parent) {
      inherited = evts.filter(e =>
        (e.executionId === parent.id && !e.cdaId && (!e.batchCdaIds || e.batchCdaIds.length === 0)) ||
        e._inheritedFromParent === parent.id
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

function memPush(memory, date, label, effect) {
  memory.push({ date, event: label, effect });
}

/**
 * @param {{ debt: object, executions?: object[], events?: object[], asOf?: string|Date }} args
 */
export function computePrescription({ debt, executions = [], events = [], asOf } = {}) {
  if (!debt) return emptyResult();
  const asOfIso = asIso(asOf) || localIso(new Date());
  const { exec, events: cdaEvents } = collectEventsForCda(debt, executions, events);
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
    let end = asIso(evt.endDate) || asOfIso;
    if (end > asOfIso) end = asOfIso;
    if (end <= start) continue;
    pauses.push({ id: evt.id, start, end, type, originario, ongoing: !asIso(evt.endDate) || asIso(evt.endDate) > asOfIso });
  }
  return pauses;
}

function computeOriginario({ debt, cdaEvents, asOfIso, informed, memory, gaps, timeline }) {
  const start = asIso(debt.inscriptionDate);
  if (!start && !informed) {
    return emptyResult({
      segment: 'credito',
      gaps: ['Sem data de inscrição nem data informada.'],
      memory, timeline
    });
  }
  if (!start) gaps.push('Sem inscrição — usando só a data informada.');
  else if (!asIso(debt.constitutionDate) && !asIso(debt.firstChargeDate)) {
    gaps.push('Âncora é a inscrição, não a constituição definitiva.');
  }

  let originStart = start;
  const pauses = applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup: true, originario: true });

  for (const evt of cdaEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type];
    if (!meta) continue;
    const efetivacao = asIso(evt.date);
    if (!efetivacao || efetivacao > asOfIso) continue;
    const effectDate = (EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type)) && asIso(evt.requestDate)
      ? asIso(evt.requestDate) : efetivacao;

    if (meta.category === 'interruptiva' || type === 'susp_parcelamento') {
      if (type === 'int_rescisao_parcelamento' || type === 'susp_parcelamento' || meta.category === 'interruptiva') {
        originStart = type === 'susp_parcelamento' ? effectDate : effectDate;
        memPush(memory, effectDate, meta.label, type === 'susp_parcelamento'
          ? 'Interrompe o originário (Súmula 653) e suspende enquanto vigente.'
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
  const diesAdQuem = informed || diesAdQuemComputed;
  const origin = informed ? 'data_informada' : (cdaEvents.some(e => PRESC_EVENT_TYPES[normalizePrescEventType(e.type)]) ? 'calculo_validado' : 'estimativa');
  const daysLeft = daysUntil(diesAdQuem, asOfIso);
  let phase = 'originario';
  if (activeNow.length) phase = 'suspenso';
  else if (daysLeft != null && daysLeft <= 0) phase = 'consumado';

  memPush(memory, originStart, 'Dies a quo', `Início do quinquênio originário (${origin === 'estimativa' ? 'inscrição + 5, estimativa' : 'após último interruptivo'}).`);
  memPush(memory, diesAdQuemComputed, 'Dies ad quem (calculado)', `5 anos civis, descontadas suspensões.`);

  return {
    segment: 'credito',
    origin,
    phase,
    status: statusFrom(phase === 'originario' ? 'correndo' : phase, daysLeft),
    diesAQuo: originStart,
    diesAdQuem,
    daysLeft,
    detail: activeNow.length
      ? `Originário suspenso. Termo final projetado: ${fmtDate(diesAdQuem)}.`
      : (phase === 'consumado'
        ? `Prescrição originária consumada em ${fmtDate(diesAdQuem)}.`
        : `Prescrição originária: ${fmtDate(originStart)} + 5 anos → ${fmtDate(diesAdQuem)}${origin === 'estimativa' ? ' (estimativa: inscrição)' : ''}.`),
    memory, gaps, timeline,
    prescriptionInterrupted: false,
    prescDaysConsumed: Math.max(0, need - Math.max(0, daysLeft || 0)),
    suspDaysConsumed: 0,
    activeSuspensions: activeNow.map(p => p.id)
  };
}

function computeIntercorrente({ exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline }) {
  const pauses = applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup: true, originario: false });
  let marco = null;
  let interrupted = false;
  let interruptAt = null;
  let tooLate = false;

  for (const evt of cdaEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type] || { category: 'info', label: type, desc: '' };
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;
    if (type === IDPJ_CONSTRICTION_TYPE && efetivacao > asOfIso) continue;

    const isConstriction = EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type);
    const effectDate = (isConstriction && asIso(evt.requestDate)) ? asIso(evt.requestDate) : efetivacao;

    if (meta.category === 'marco') {
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
      if (!marco) {
        interrupted = true;
        memPush(memory, effectDate, meta.label, 'Constrição/citação na EF. Sem marco ativo — ciclo do art. 40 continua não iniciado.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'interrompido' });
        continue;
      }
      const art40Need = yearSpanDays(marco, 1);
      const art40End = addUnpausedDays(marco, art40Need, pauses.filter(p => p.start < effectDate));
      const prescNeed = yearSpanDays(art40End, 5);
      const prescEnd = addUnpausedDays(art40End, prescNeed, pauses.filter(p => p.start < effectDate));
      if (effectDate > prescEnd) {
        tooLate = true;
        memPush(memory, effectDate, meta.label, 'Pedido fora da janela de 1+5 anos — não salva o feito.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'consumado' });
      } else {
        interrupted = true;
        interruptAt = effectDate;
        const retro = asIso(evt.requestDate) && asIso(evt.requestDate) !== efetivacao
          ? ` Retroage ao pedido (${fmtDate(evt.requestDate)}).` : '';
        memPush(memory, effectDate, meta.label, `INTERROMPE a intercorrente — ciclo encerrado.${retro}`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'interrompido' });
      }
      continue;
    }

    if (type === 'int_rescisao_parcelamento') {
      timeline.push({ ...evt, effect: 'Rescisão: encerra a pausa do art. 151 na intercorrente (não zera o ciclo do art. 40).', phase: marco ? 'prescricao_correndo' : 'pre_marco' });
      continue;
    }

    if (meta.category === 'interruptiva') {
      memPush(memory, effectDate, meta.label, 'Causa interruptiva do art. 174 — na intercorrente não encerra o ciclo do art. 40 (salvo constrição/citação efetiva).');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: marco ? 'prescricao_correndo' : 'pre_marco' });
      continue;
    }

    if (type === IDPJ_CONSTRICTION_TYPE) {
      const from = asIso(evt.requestDate) || efetivacao;
      const tag = exec && (evt._inheritedFromIDPJ) ? ' Tese fazendária se a origem for MCF.' : '';
      memPush(memory, from, meta.label, `Suspende as EFs abrangidas desde o pedido (${fmtDate(from)}). Não interrompe o ciclo.${tag}`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    if (meta.category === 'suspensiva') {
      const from = asIso(evt.requestDate) || efetivacao;
      memPush(memory, from, meta.label, `Suspende o cômputo até ${evt.endDate ? fmtDate(evt.endDate) : 'hoje'} (art. 151 / causa diversa do art. 40).`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    timeline.push({ ...evt, effect: meta.desc || 'Registro informativo', phase: marco ? 'prescricao_correndo' : 'pre_marco' });
  }

  const activeNow = pauses.filter(p => p.ongoing);

  if (interrupted && !tooLate) {
    const r = {
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
    return r;
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
  if (activeNow.length) phase = 'suspenso';
  else if (asOfIso < art40End) phase = 'suspensao_art40';
  else if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
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
  for (const d of debts || []) {
    if (!d || !d.id) continue;
    map.set(d.id, computePrescription({ debt: d, executions: execs, events: evts, asOf }));
  }
  const get = (debt) => {
    if (!debt) return emptyResult();
    if (debt.id && map.has(debt.id)) return map.get(debt.id);
    return computePrescription({ debt, executions: execs, events: evts, asOf });
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
