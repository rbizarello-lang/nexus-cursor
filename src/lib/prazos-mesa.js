/**
 * Mesa de trabalho dos prazos (edição Beta).
 * Funções puras: seleção da fila, selos, frases da linha da CDA, texto sem jargão.
 */
import { addCalendarDays, addCalendarYears, daysBetween, daysUntil, fmtDate, normProc, sameProc, toDayKey } from './dates.js';
import {
  PENHORA_ANALISE_VALIDADE,
  PRESC_SNOOZE_REASONS,
  collectEventsForCda,
  createPrescLookup,
  penhoraAntigaInfo,
  snoozeLimitDays
} from './prescription.js';

/** Sem teto: tudo o que precisa de você aparece (resposta F2). */
export const MESA_CAP = Infinity;
export const MESA_ONE_CLICK = new Set(['criar_evento', 'corrigir_ficha', 'vincular_ef', 'confirmar_vigencia', 'lancar_ciencia']);

export function mesaCertainty(row) {
  const k = row && (row.prescKind || row.kind);
  if (row && row.bandHit) return row.bandHit.kind === 'tese' ? 'faixa' : 'dado';
  if (k === 'pedido_dado') return 'dado';
  if (k === 'penhora_antiga') return 'analisar';
  if (k === 'vencido' || k === 'iminente' || k === 'vigiar_interrompido' || k === 'correndo') return 'calculado';
  if (k === 'vencido_estimado' || k === 'residual_alta' || k === 'residual_media' || k === 'acompanhar_piso') return 'estimado';
  if (k === 'inconsistencia' || (row && row.group === 3)) return 'cadastro';
  if (row && row.group === 1) return 'calculado';
  if (row && row.group === 2) return 'estimado';
  return 'cadastro';
}

export function isG1Vencido(row) {
  if (!row || row.group !== 1) return false;
  if (row.prescKind === 'vencido') return true;
  return row.prescDays != null && row.prescDays <= 0;
}

export function mesaNeedsYou(row, todayIso) {
  if (!row) return false;
  if (row.group === 7) return false;
  if (row.group === 1) return true;
  if (row.prescKind === 'pedido_dado') return true;
  if (row.group === 2 && row.prescDays != null && row.prescDays <= 0) return true;
  const act = row.action && row.action.type;
  if (row.group === 3 && MESA_ONE_CLICK.has(act)) return true;
  if (row.reviewAt && todayIso && row.reviewAt <= todayIso) return true;
  return false;
}

/** Ordem da fila: data cedo (a data de alarme da linha), depois o maior valor. */
export function compareMesaRows(a, b) {
  const da = (a && (a.prescDate || a.keyDate)) || '9999-12-31';
  const db = (b && (b.prescDate || b.keyDate)) || '9999-12-31';
  if (da !== db) return da < db ? -1 : 1;
  return (Number(b && b.value) || 0) - (Number(a && a.value) || 0);
}

export function splitMesaRows(rows, todayIso, cap = MESA_CAP) {
  const needs = [];
  const rest = [];
  const penhoraAntiga = [];
  (rows || []).forEach(r => {
    if (r && r.group === 7) penhoraAntiga.push(r);
    else if (mesaNeedsYou(r, todayIso)) needs.push(r);
    else rest.push(r);
  });
  needs.sort(compareMesaRows);
  penhoraAntiga.sort(compareMesaRows);
  const hiddenG5 = rest.filter(r => r.group === 5);
  const restVisible = rest.filter(r => r.group !== 5);
  const limit = Number.isFinite(cap) ? cap : needs.length;
  return {
    needsYou: needs.slice(0, limit),
    overCap: needs.slice(limit),
    rest: restVisible,
    hiddenG5,
    penhoraAntiga
  };
}

/**
 * Linhas da Mesa agrupadas: intercorrente por execução (as CDAs do mesmo processo andam juntas);
 * ordinária, uma linha por CDA. Grupos na ordem da data cedo e do valor.
 */
export function groupMesaRows(rows) {
  const map = new Map();
  (rows || []).forEach(r => {
    if (!r) return;
    const inter = r.prescSegment === 'intercorrente' && (r.executionId || r.processNumber);
    const key = inter
      ? 'ex:' + (r.operationId || '') + '|' + (r.executionId || String(r.processNumber || '').replace(/\D/g, ''))
      : 'cda:' + r.id;
    if (!map.has(key)) {
      map.set(key, {
        key,
        type: inter ? 'execucao' : 'cda',
        processNumber: r.processNumber || '',
        executionId: r.executionId || '',
        operationId: r.operationId || '',
        opName: r.opName || '',
        court: r.court || '',
        rows: []
      });
    }
    map.get(key).rows.push(r);
  });
  const groups = [...map.values()];
  groups.forEach(g => {
    g.rows.sort(compareMesaRows);
    g.lead = g.rows[0];
    g.worstGroup = Math.min(...g.rows.map(r => r.group || 9));
    g.value = g.rows.reduce((s, r) => s + (Number(r.value) || 0), 0);
    g.date = (g.lead && (g.lead.prescDate || g.lead.keyDate)) || '';
  });
  groups.sort((a, b) => compareMesaRows(
    { prescDate: a.date, value: a.value },
    { prescDate: b.date, value: b.value }
  ));
  return groups;
}

export function formatPrescHorizon(days) {
  if (days == null || days === '') return '';
  const n = Number(days);
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs > 730) {
    const years = Math.max(1, Math.round(abs / 365));
    return n < 0 ? ('há ' + years + ' anos') : ('em ' + years + ' anos');
  }
  if (n < 0) return 'há ' + abs + 'd';
  if (n === 0) return 'hoje';
  return n + 'd';
}

function stripPrescritaIfEstimate(text, prescKind) {
  if (prescKind === 'vencido') return text;
  return String(text || '').replace(/\b[Pp]rescrita\b/g, 'prazo vencido (estimado)');
}

export function betaCdaPrescText(d, row, silenced) {
  if (!d) return 'sem dado de prazo';
  const terminal = d.prescriptionHandled && d.prescriptionHandledType !== 'aguardando_reconhecimento';
  if (terminal) {
    return d.prescriptionHandledAt ? ('Tratada em ' + fmtDate(d.prescriptionHandledAt)) : 'Tratada';
  }
  if (row && row.informedConflict && d.prescriptionDate && (row.prescDate || row.keyDate)) {
    return 'Ficha ' + fmtDate(d.prescriptionDate) + ' · app ' + fmtDate(row.prescDate || row.keyDate) + ' — conferir';
  }
  if (row) {
    let text = stripPrescritaIfEstimate(row.why || row.prescLabel || row.summary || '', row.prescKind);
    if (!text) text = 'prazo em acompanhamento';
    const horizon = formatPrescHorizon(row.prescDays);
    if (horizon && row.prescKind !== 'vigiar_interrompido' && !/ · /.test(text)) {
      return text + ' · ' + horizon;
    }
    return text;
  }
  if (silenced) {
    const until = silenced.until ? (' até ' + fmtDate(silenced.until)) : '';
    return (silenced.label || 'Fora da fila') + until;
  }
  return 'sem ciência lançada';
}

/** Causas interruptivas curtas (mesmo vocabulário do motor; só para a linha fechada). */
const BETA_INTERRUPT_BY = {
  int_penhora: 'penhora',
  int_arresto: 'arresto',
  int_sisbajud: 'bloqueio Sisbajud',
  int_cnib: 'indisponibilidade',
  int_citacao: 'citação',
  int_reconhecimento: 'reconhecimento da dívida',
  int_outra: 'resultado útil',
  susp_idpj_mcf_constricao: 'constrição no incidente'
};

const BETA_SUSP_BY = {
  susp_parcelamento: 'parcelamento',
  susp_transacao: 'transação',
  susp_embargos: 'embargos',
  susp_decisao_judicial: 'decisão judicial',
  susp_deposito: 'depósito',
  susp_falencia_decretada: 'falência',
  susp_idpj_mcf: 'incidente',
  susp_outra: 'causa suspensiva'
};

function betaInterruptCause(prescResult, blob) {
  const ev = ((prescResult && prescResult.timeline) || []).find(e => e && e.phase === 'interrompido');
  const t = ev && String(ev.type || '');
  if (t && BETA_INTERRUPT_BY[t]) return BETA_INTERRUPT_BY[t];
  if (/penhora/.test(blob)) return 'penhora';
  if (/cita[cç]/.test(blob)) return 'citação';
  if (/sisbajud|bloqueio/.test(blob)) return 'bloqueio Sisbajud';
  if (/indisponib/.test(blob)) return 'indisponibilidade';
  if (/arresto/.test(blob)) return 'arresto';
  return 'resultado útil';
}

function betaSuspensionCause(prescResult, blob) {
  const types = ((prescResult && prescResult.timeline) || [])
    .map(e => e && String(e.type || ''))
    .filter(Boolean);
  for (const t of types) {
    if (BETA_SUSP_BY[t]) return BETA_SUSP_BY[t];
  }
  if (/parcelamento/.test(blob)) return 'parcelamento';
  if (/embargos/.test(blob)) return 'embargos';
  if (/dep[oó]sito/.test(blob)) return 'depósito';
  if (/incidente|idpj|cautelar/.test(blob)) return 'incidente';
  return '';
}

/**
 * Linha fechada da CDA na Beta: STATUS — situação — data de consumação.
 * Usa só o que o cálculo/radar já produziu; não inventa data.
 */
export function betaCdaClosedLine(d, row, silenced, statusLabel, prescResult) {
  const status = String(statusLabel || (d && d.status) || '—').toUpperCase();
  const empty = { status, situation: '', date: '', dateLabel: '', fullText: status };

  if (!d) {
    return { ...empty, situation: 'sem dado de prazo', fullText: status + ' — sem dado de prazo' };
  }

  const terminal = d.prescriptionHandled && d.prescriptionHandledType !== 'aguardando_reconhecimento';
  if (terminal) {
    const situation = 'tratada';
    const date = d.prescriptionHandledAt || '';
    const dateLabel = date ? fmtDate(date) : '';
    const fullText = dateLabel ? (status + ' — ' + situation + ' — ' + dateLabel) : (status + ' — ' + situation);
    return { status, situation, date, dateLabel, fullText };
  }
  if (d.prescriptionHandledType === 'aguardando_reconhecimento' && d.prescriptionHandled) {
    const situation = 'aguardando reconhecimento judicial';
    return { status, situation, date: '', dateLabel: '', fullText: status + ' — ' + situation };
  }

  if (row && row.informedConflict && d.prescriptionDate && (row.prescDate || row.keyDate)) {
    const situation = 'conferir ficha × cálculo';
    const date = row.prescDate || row.keyDate || '';
    const dateLabel = date ? fmtDate(date) : '';
    const fullText = dateLabel
      ? (status + ' — ' + situation + ' — ' + dateLabel)
      : (status + ' — ' + situation);
    return { status, situation, date, dateLabel, fullText };
  }

  if (silenced && !row) {
    const situation = String(silenced.label || 'fora da fila').toLowerCase();
    const date = silenced.until || '';
    const dateLabel = date ? fmtDate(date) : '';
    const fullText = dateLabel
      ? (status + ' — ' + situation + ' — ' + dateLabel)
      : (status + ' — ' + situation);
    return { status, situation, date, dateLabel, fullText };
  }

  const r = prescResult || null;
  const kind = (row && row.prescKind) || '';
  const phase = (r && r.phase) || '';
  const segment = (r && r.segment) || (row && row.prescSegment) || '';
  const clock = (row && row.clock) || '';
  const isOrdinary = segment === 'credito' || clock === 'ordinaria';
  const blob = [
    r && r.summary, r && r.detail, row && row.summary, row && row.why, row && row.prescLabel
  ].filter(Boolean).join(' ').toLowerCase();

  let situation = '';
  let showDate = true;

  if (isOrdinary) {
    if (phase === 'consumado' || kind === 'vencido') situation = 'prescrição ordinária consumada';
    else if (phase === 'interrompido') {
      situation = 'prescrição ordinária interrompida pelo ajuizamento';
      showDate = false;
    } else if (phase === 'suspenso' || kind === 'pausa_cadastrada') {
      const cause = betaSuspensionCause(r, blob);
      situation = cause
        ? ('prescrição ordinária suspensa por ' + cause)
        : 'prescrição ordinária suspensa';
      if (!(r && r.diesAdQuem) && !(row && row.prescDate)) showDate = false;
    } else if ((r && r.diesAdQuem) || (row && row.prescDate)) {
      situation = 'prescrição ordinária em curso';
    } else {
      situation = 'prescrição ordinária sem data';
      showDate = false;
    }
  } else {
    // Intercorrente (ou ainda sem segmento claro)
    if (phase === 'nao_iniciado' || kind === 'residual_alta' || kind === 'residual_media' || kind === 'acompanhar_piso' || (row && row.noCiencia)) {
      situation = 'prescrição intercorrente ainda não iniciada';
      showDate = false;
    } else if (phase === 'interrompido' || kind === 'vigiar_interrompido') {
      situation = 'prescrição intercorrente interrompida por ' + betaInterruptCause(r, blob);
      showDate = false;
    } else if (phase === 'suspenso' || kind === 'pausa_cadastrada') {
      const cause = betaSuspensionCause(r, blob)
        || (/parcelamento/.test(blob) || !(r && r.diesAdQuem) ? 'parcelamento' : '');
      situation = cause
        ? ('prescrição intercorrente suspensa por ' + cause)
        : 'prescrição intercorrente suspensa';
      if (!(r && r.diesAdQuem) && !(row && row.prescDate)) showDate = false;
    } else if (kind === 'pedido_dado') {
      situation = 'falta dado — ' + String(row.prescLabel || 'completar').toLowerCase();
    } else if (phase === 'consumado' || kind === 'vencido' || kind === 'vencido_estimado') {
      situation = kind === 'vencido_estimado'
        ? 'prescrição intercorrente consumada (estimada)'
        : 'prescrição intercorrente consumada';
    } else if (kind === 'inconsistencia') {
      situation = stripPrescritaIfEstimate(
        betaSafeUiText(row.why || row.prescLabel || 'conferir cadastro'),
        kind
      ).toLowerCase();
      showDate = !!(row && row.prescDate);
    } else if (kind === 'correndo' || kind === 'iminente' || phase === 'correndo' || phase === 'suspensao_art40' || (r && r.diesAdQuem) || (row && row.prescDate)) {
      situation = 'prescrição intercorrente em curso';
    } else if (row) {
      situation = stripPrescritaIfEstimate(
        betaSafeUiText(row.why || row.prescLabel || row.summary || 'prazo em acompanhamento'),
        kind
      ).toLowerCase();
      showDate = !!(row.prescDate) && kind !== 'vigiar_interrompido';
    } else {
      situation = 'sem ciência lançada';
      showDate = false;
    }
  }

  const date = showDate
    ? ((r && r.diesAdQuem) || (row && row.prescDate) || '')
    : '';
  const dateLabel = date ? fmtDate(date) : '';
  const fullText = dateLabel
    ? (status + ' — ' + situation + ' — ' + dateLabel)
    : (status + ' — ' + situation);
  return { status, situation, date, dateLabel, fullText };
}

export function mesaDrawerItems({ rows, silenced, hideG5 = true } = {}) {
  const seen = new Set();
  const items = [];
  (silenced || []).forEach(s => {
    if (!s || !s.debtId || seen.has(s.debtId)) return;
    seen.add(s.debtId);
    items.push({
      kind: 'silenced',
      id: s.debtId,
      debtId: s.debtId,
      reason: s.reason,
      until: s.until,
      label: s.label,
      group: s.group,
      canReopen: !!(s.reason && PRESC_SNOOZE_REASONS[s.reason])
    });
  });
  (rows || []).forEach(r => {
    if (!r || seen.has(r.id)) return;
    if (r.silenceReason) {
      seen.add(r.id);
      items.push({
        kind: 'silenceReason',
        id: r.id,
        debtId: r.id,
        reason: r.silenceReason,
        until: r.reviewAt,
        label: r.why || r.prescLabel || 'Aguardando decisão',
        group: r.group,
        row: r,
        canReopen: false
      });
      return;
    }
    if (hideG5 && r.group === 5) {
      seen.add(r.id);
      items.push({
        kind: 'g5',
        id: r.id,
        debtId: r.id,
        reason: 'ainda_impossivel',
        until: r.reviewAt || r.keyDate,
        label: r.why || r.prescLabel || 'Ainda impossível',
        group: 5,
        row: r,
        canReopen: false
      });
    }
  });
  return items;
}

export function countSnoozeDueThisWeek(silenced, todayIso) {
  if (!todayIso) return 0;
  const end = addCalendarDays(todayIso, 7);
  return (silenced || []).filter(s => {
    if (!s || !s.until) return false;
    if (s.reason && !PRESC_SNOOZE_REASONS[s.reason] && s.reason !== 'outro') return false;
    return s.until >= todayIso && s.until <= end;
  }).length;
}

export function snoozeMaxUntil(group, fromIso) {
  return addCalendarDays(fromIso, snoozeLimitDays(group));
}

export function betaSafeUiText(text) {
  let s = String(text || '');
  s = s.replace(/Temas?\s+\d+(?:\s*[\/,eE]\s*\d+)*/g, '');
  s = s.replace(/S[uú]mula(?:s)?\s+\d+(\/?STJ|\/?STF)?/gi, '');
  s = s.replace(/\bpol[ií]tica\b/gi, 'escolha da casa');
  s = s.replace(/\bpiso\b/gi, 'limite mínimo');
  s = s.replace(/\bteto\b/gi, 'limite máximo');
  s = s.replace(/\bdies\b/gi, 'termo');
  s = s.replace(/\bmarco\b/gi, 'ciência');
  s = s.replace(/\bCENÁRIO\b/g, 'situação');
  s = s.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/^[.,;:\s]+/, '').trim();
  return s;
}

export function betaEventFamilyLabel(family, destIsIncident) {
  if (!family) return '';
  if (destIsIncident && family.id === 'resultado_util') {
    return 'Constrição no incidente (interrompe as EFs)';
  }
  if (family.id === 'marco') return 'Ciência do art. 40';
  return betaSafeUiText(family.label || '');
}

export function betaEventFamilyDesc(family, destIsIncident) {
  if (!family) return '';
  if (destIsIncident && family.id === 'resultado_util') {
    return 'Constrição no incidente vale como interrupção das execuções abrangidas, desde o pedido. Aos 5 anos, o card do processo pede esclarecimento.';
  }
  let desc = betaSafeUiText(family.desc || '');
  if (destIsIncident) desc = desc.replace(/resultado útil/gi, 'constrição').replace(/Penhora\s*\/\s*constrição/gi, 'Constrição');
  return desc;
}

/* ───────── Cartões da Mesa (fase 1): uma CDA, um cartão ───────── */

/** Cartões na ordem de trabalho. Fileira 1 pede ação; fileira 2 é acompanhamento e registro. */
export const MESA_CARDS = [
  { id: 'calculo', fileira: 1, nome: 'Conferir o cálculo',
    tip: 'Consumadas há até 6 meses e análise importada que diverge do cálculo: confira nos autos se algum fato interrompeu o prazo antes de aceitar a consumação.' },
  { id: 'ajuizar', fileira: 1, nome: 'Ajuizar',
    tip: 'Ordinária ainda não ajuizada cuja data cedo cai nos próximos 60 dias: ajuíze antes que os 5 anos se consumem. Em cinza, as que vencem entre 60 e 180 dias.' },
  { id: 'fato', fileira: 1, nome: 'Lançar fato ou ciência',
    tip: 'Há fato nos autos que o app não conhece (ciência da suspensão, resultado de bloqueio, rescisão de parcelamento): lance-o e o cálculo se refaz.' },
  { id: 'vigencia', fileira: 1, nome: 'Confirmar vigência',
    tip: 'Pausa ou parcelamento cujo prazo presume que já acabou: confirme com um clique se ainda vale.' },
  { id: 'dado', fileira: 1, nome: 'Completar dado',
    tip: 'Falta dado na ficha para o cálculo fechar: informar as datas ou vincular a CDA à execução certa.' },
  { id: 'sempressa', fileira: 2, nome: 'Conferir sem pressa',
    tip: 'Nada vence agora, mas vale olhar: constrição na execução há mais de 4 anos sem outro fato, constrição via IDPJ a menos de 90 dias dos 5 anos, ou «não antes de» passado há mais de 2 anos sem fato lançado.' },
  { id: 'vigiar', fileira: 2, nome: 'Só vigiar',
    tip: 'Nada a fazer agora: ciclo encerrado por penhora, parcelamento vigente, IDPJ com constrição recente, prazo ainda impossível ou ordinária ainda longe do prazo.' },
  { id: 'adiadas', fileira: 2, nome: 'Adiadas',
    tip: 'Itens que você mesmo adiou, com motivo e data de volta. Quando o adiamento vence, o item volta ao cartão da sua ação.' },
  { id: 'tratadas', fileira: 2, nome: 'Tratadas',
    tip: 'Prescrição já tratada (aguardando reconhecimento, reconhecida, analisada). Fica só aqui: não gera aviso nem lembrete.' },
  { id: 'antigas', fileira: 2, nome: 'Consumadas antigas',
    tip: 'Consumadas há mais de 6 meses: só registro, sem alarme.' }
];

/** Ordinária não ajuizada: aviso com alarme até 60 dias; cinza entre 60 e 180. */
export const AJUIZAR_DIAS = 60;
export const AJUIZAR_JANELA = 180;
/** Exibição: constrição na execução sem outro fato vai a «Conferir sem pressa» aos 4 anos (o motor segue com 6). */
export const PENHORA_SEM_PRESSA_ANOS = 4;

/** Espécies cuja data é um prazo que se aproxima ou venceu (as demais não mostram data de posição). */
const MESA_DEADLINE_KINDS = new Set([
  'iminente', 'vencido', 'vencido_estimado', 'correndo', 'pausa_cadastrada', 'pedido_dado'
]);
const MESA_PARC_SILENCE = new Set(['parcelamento_vigente', 'parcelada_ficha']);

/**
 * Análise de penhora vigente: menos de 365 dias E nenhum fato datado depois dela na CDA ou na execução
 * (mesma regra do motor, penhoraAnaliseVigente). `data` traz executions e prescriptionEvents.
 */
function mesaPenhoraAnaliseVigente(debt, todayIso, data) {
  const at = toDayKey(debt && debt.penhoraAnalise && debt.penhoraAnalise.at);
  if (!at) return false;
  if (!(daysBetween(at, todayIso) < PENHORA_ANALISE_VALIDADE)) return false;
  let related = [];
  try {
    related = collectEventsForCda(debt, (data && data.executions) || [], (data && data.prescriptionEvents) || []).events || [];
  } catch (e) { related = []; }
  for (const ev of related) {
    const d = toDayKey(ev && ev.date) || toDayKey(ev && ev.requestDate);
    if (d && d > at) return false;
  }
  return true;
}

function mesaSafeLookup(prescLookup, debt) {
  try { return prescLookup(debt) || null; } catch (e) { return null; }
}

/** Cartão de uma linha do radar (regras 3 a 9). Devolve { card, prescResult? }. */
function mesaCardOfRow(row, debt, prescLookup, todayIso, data) {
  const kind = row.prescKind || row.kind;
  const act = (row.action && row.action.type) || '';
  let prescResult;

  // 3. Conferir sem pressa, antes das consumadas (o motor marca piso antigo como consumada 'old').
  if (kind === 'penhora_antiga') return { card: 'sempressa' };
  if (kind === 'vigiar_interrompido') {
    prescResult = mesaSafeLookup(prescLookup, debt);
    const pen = prescResult ? penhoraAntigaInfo(prescResult, todayIso) : null;
    if (pen && pen.constrictionDate
      && addCalendarYears(pen.constrictionDate, PENHORA_SEM_PRESSA_ANOS) <= todayIso
      && !mesaPenhoraAnaliseVigente(debt, todayIso, data)) {
      return { card: 'sempressa', prescResult };
    }
  }
  if (row.idpjNotice && row.idpjNotice.active) return { card: 'sempressa', prescResult };
  if (kind === 'residual_alta' && /não antes de/.test(row.prescLabel || '')) return { card: 'sempressa', prescResult };

  // 4 e 5. Consumadas e divergência da análise importada.
  if (row.consumada === 'old') return { card: 'antigas', prescResult };
  if (row.consumada === 'recent' || row.decisionNote) return { card: 'calculo', prescResult };

  // 6. Ordinária.
  if (row.prescSegment === 'ordinaria') {
    if (act === 'confirmar_vigencia') return { card: 'vigencia', prescResult };
    if (act === 'vincular_ef') return { card: 'dado', prescResult };
    return { card: 'ajuizar', prescResult };
  }

  // 7. Intercorrente que precisa de você, pela ação.
  if (mesaNeedsYou(row, todayIso)) {
    if (act === 'confirmar_vigencia') return { card: 'vigencia', prescResult };
    if (act === 'corrigir_ficha' || act === 'vincular_ef') return { card: 'dado', prescResult };
    if (act === 'lancar_ciencia' || act === 'criar_evento' || act === 'conferir_autos') return { card: 'fato', prescResult };
  }
  // 8. O resto do grupo 3 (ex.: «correndo» rebaixado por cadastro).
  if (row.group === 3) return { card: 'dado', prescResult };
  // 9.
  return { card: 'vigiar', prescResult };
}

/** Data de posição, "cedo venceu, tarde não" e se a data é um prazo. */
function mesaPosition(row, todayIso) {
  const kind = row.prescKind || row.kind;
  const dateIsDeadline = MESA_DEADLINE_KINDS.has(kind);
  if (!dateIsDeadline) return { dateIsDeadline, sortDate: null, cedoVencidaTardeNao: false };
  const cedo = row.bandCedo || '';
  const tarde = row.bandTarde || '';
  if (cedo && cedo <= todayIso && (!tarde || tarde > todayIso) && !row.consumada) {
    return { dateIsDeadline, sortDate: tarde || null, cedoVencidaTardeNao: true };
  }
  return { dateIsDeadline, sortDate: row.prescDate || row.keyDate || null, cedoVencidaTardeNao: false };
}

function mesaCompareValue(a, b) {
  return (b.value - a.value) || String(a.debtId).localeCompare(String(b.debtId));
}

function mesaCompareByDate(a, b) {
  const ha = !!a.sortDate;
  const hb = !!b.sortDate;
  if (ha !== hb) return ha ? -1 : 1;
  if (ha && a.sortDate !== b.sortDate) return a.sortDate < b.sortDate ? -1 : 1;
  return mesaCompareValue(a, b);
}

/** Descendente por texto ISO; vazio por último. */
function mesaCompareDesc(fa, fb) {
  return (a, b) => {
    const x = fa(a) || '';
    const y = fb(b) || '';
    if (x !== y) {
      if (!x) return 1;
      if (!y) return -1;
      return x < y ? 1 : -1;
    }
    return mesaCompareValue(a, b);
  };
}

const MESA_SORTERS = {
  adiadas: (a, b) => {
    const x = a.until || '';
    const y = b.until || '';
    if (x !== y) {
      if (!x) return 1;
      if (!y) return -1;
      return x < y ? -1 : 1;
    }
    return mesaCompareValue(a, b);
  },
  tratadas: mesaCompareDesc(i => i.handledAt, i => i.handledAt),
  antigas: mesaCompareDesc(
    i => i.row && (i.row.prescDate || i.row.keyDate),
    i => i.row && (i.row.prescDate || i.row.keyDate)
  ),
  vigiar: mesaCompareValue
};

/**
 * Cada CDA do universo cai em exatamente um cartão (a primeira regra que casar vale).
 * Camada de exibição: não altera o motor, só lê radar e cálculo.
 */
export function buildMesaCards({ data, radar, prescLookup, today } = {}) {
  const todayIso = today;
  const debts = (data && data.debts) || [];
  const lookup = prescLookup || createPrescLookup(
    debts, (data && data.executions) || [], (data && data.prescriptionEvents) || [], todayIso
  );
  const ops = new Map(((data && data.operations) || []).filter(o => o && o.id).map(o => [o.id, o]));
  const rowById = new Map(((radar && radar.rows) || []).filter(r => r && r.id).map(r => [r.id, r]));
  const silById = new Map();
  ((radar && radar.silenced) || []).forEach(s => {
    if (s && s.debtId && !silById.has(s.debtId)) silById.set(s.debtId, s);
  });

  const items = [];
  const byDebt = new Map();
  const seen = new Set();

  debts.forEach(debt => {
    if (!debt || !debt.id || seen.has(debt.id)) return;
    if (debt.status === 'extinta') return;
    const op = ops.get(debt.operationId);
    if (!op || op.status === 'encerrada') return;
    seen.add(debt.id);

    const row = rowById.get(debt.id) || null;
    const sil = silById.get(debt.id) || null;
    const item = {
      debtId: debt.id,
      card: '',
      row,
      debt,
      value: Number(debt.value) || 0,
      sortDate: null,
      dateIsDeadline: false,
      cedoVencidaTardeNao: false,
      ajuizarLonge: false,
      snoozeExpired: false,
      derived: false,
      until: '',
      handledAt: ''
    };

    const silSnooze = !!(sil && sil.reason && PRESC_SNOOZE_REASONS[sil.reason]);

    if (debt.prescriptionHandled || (row && row.prescKind === 'aguardando_reconhecimento')) {
      // 1. Tratadas
      item.card = 'tratadas';
      item.handledAt = debt.prescriptionHandledAt || '';
    } else if (silSnooze) {
      // 2. Adiadas
      item.card = 'adiadas';
      item.until = sil.until || '';
    } else {
      // Adiamento furado ou vencido: a CDA tem linha e ainda guarda o adiamento.
      item.snoozeExpired = !!(row && debt.prescSnooze);
      if (row) {
        const res = mesaCardOfRow(row, debt, lookup, todayIso, data);
        item.card = res.card;
        if (res.prescResult) item.prescResult = res.prescResult;
        const pos = mesaPosition(row, todayIso);
        item.dateIsDeadline = pos.dateIsDeadline;
        item.sortDate = pos.sortDate;
        item.cedoVencidaTardeNao = pos.cedoVencidaTardeNao;
        // Cedo é o critério de urgência: cedo vencida nunca é "longe", mesmo com a tarde distante.
        if (item.card === 'ajuizar' && item.sortDate && !item.cedoVencidaTardeNao) {
          const d = daysUntil(item.sortDate, todayIso);
          item.ajuizarLonge = d != null && d > AJUIZAR_DIAS;
        }
      } else if (sil && MESA_PARC_SILENCE.has(sil.reason)) {
        // 10. Sem linha: parcelamento vigente ou da ficha
        item.card = 'vigiar';
      } else {
        const r = mesaSafeLookup(lookup, debt);
        if (r) item.prescResult = r;
        const open = r && r.segment === 'credito' && r.status !== 'sem_dados'
          && r.phase !== 'suspenso' && r.phase !== 'interrompido';
        const target = open ? ((r.band && r.band.cedo && r.band.cedo.diesAdQuem) || r.diesAdQuem || '') : '';
        const dias = target ? daysUntil(target, todayIso) : null;
        if (dias != null) {
          item.dateIsDeadline = true;
          item.sortDate = target;
          if (dias <= AJUIZAR_JANELA) {
            item.card = 'ajuizar';
            item.derived = true;
            item.ajuizarLonge = dias > AJUIZAR_DIAS;
          } else {
            item.card = 'vigiar';
          }
        } else if (!r || r.status === 'sem_dados' || r.phase === 'sem_dados') {
          item.card = 'dado';
        } else {
          item.card = 'vigiar';
        }
      }
    }
    items.push(item);
    byDebt.set(debt.id, item);
  });

  const byCard = {};
  const totals = {};
  MESA_CARDS.forEach(c => {
    byCard[c.id] = [];
    totals[c.id] = { n: 0, value: 0, nLonge: 0, valueLonge: 0 };
  });
  items.forEach(it => {
    byCard[it.card].push(it);
    const t = totals[it.card];
    if (it.card === 'ajuizar' && it.ajuizarLonge) {
      t.nLonge++;
      t.valueLonge += it.value;
    } else {
      t.n++;
      t.value += it.value;
    }
  });
  MESA_CARDS.forEach(c => {
    byCard[c.id].sort(MESA_SORTERS[c.id] || mesaCompareByDate);
  });

  return { items, byCard, totals, byDebt };
}

/** Totais por cartão a partir de uma lista de itens (por exemplo, já filtrada por operação, pessoa ou busca). */
export function mesaTotalsOf(items) {
  const totals = {};
  // nLonge/valueLonge em todos os cartões: a UI soma value + valueLonge em qualquer seção.
  MESA_CARDS.forEach(c => { totals[c.id] = { n: 0, value: 0, nLonge: 0, valueLonge: 0 }; });
  (items || []).forEach(it => {
    const t = totals[it.card];
    if (!t) return;
    if (it.card === 'ajuizar' && it.ajuizarLonge) {
      t.nLonge++;
      t.valueLonge += it.value;
    } else {
      t.n++;
      t.value += it.value;
    }
  });
  return totals;
}

/**
 * Número único «pede você» fora da Mesa (badge do menu, Hoje, Painel): soma da fileira 1
 * (Conferir o cálculo + Ajuizar até 60 dias + Lançar fato + Confirmar vigência + Completar dado).
 * O «entre 60 e 180 dias» do Ajuizar (cinza) não entra.
 */
export function mesaActionCount(totals) {
  let n = 0;
  let value = 0;
  MESA_CARDS.forEach(c => {
    if (c.fileira !== 1) return;
    const t = totals && totals[c.id];
    if (!t) return;
    n += Number(t.n) || 0;
    value += Number(t.value) || 0;
  });
  return { n, value };
}

/** Cartão e tom (cor) dos cartões da fileira 1; a fileira 2 é sempre neutra. */
export const MESA_CARD_TONE = { calculo: 'orange', ajuizar: 'red', fato: 'orange', vigencia: 'blue', dado: 'neutral' };
export const MESA_HANDLED_LABEL = {
  aguardando_reconhecimento: 'Aguardando reconhecimento',
  declarada: 'Declarada',
  analisada_nao_consumada: 'Analisada — não houve prescrição',
  extinta: 'Extinta',
  reconhecida: 'Reconhecida'
};

/** Item que conta no número único «pede você» (fileira 1, sem o Ajuizar de 60 a 180 dias). */
export function mesaIsAction(item) {
  if (!item) return false;
  const c = MESA_CARDS.find(x => x.id === item.card);
  return !!c && c.fileira === 1 && !(item.card === 'ajuizar' && item.ajuizarLonge);
}

function mesaDM(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] : '—';
}

/**
 * Relógio da linha com radar: texto grande, data de apoio e tom.
 * Nunca «há N anos» para data que não é prazo; consumada antiga mostra «consumada» + data.
 * Devolve { text, date, plain, gray, late }.
 */
export function mesaItemClock(item, todayIso) {
  const r = item && item.row;
  if (!r) return null;
  if (item.cedoVencidaTardeNao) {
    const dias = r.bandTarde ? daysUntil(r.bandTarde, todayIso) : null;
    return {
      text: dias != null ? 'tarde em ' + formatPrescHorizon(dias) : 'sem data tarde',
      date: r.bandTarde ? fmtDate(r.bandTarde) : '',
      plain: false, gray: false, late: false
    };
  }
  if (item.card === 'antigas') {
    const d = r.prescDate || r.keyDate || '';
    return { text: 'consumada', date: d ? fmtDate(d) : '', plain: false, gray: false, late: false };
  }
  if (!item.dateIsDeadline) {
    return { text: r.keyLabel || (r.keyDate ? fmtDate(r.keyDate) : '—'), date: '', plain: true, gray: false, late: false };
  }
  const text = formatPrescHorizon(r.prescDays);
  return {
    text: text || (r.keyDate ? fmtDate(r.keyDate) : '—'),
    date: text && r.keyDate ? (r.bandHit ? r.keyLabel : fmtDate(r.keyDate)) : '',
    plain: false,
    gray: !!item.ajuizarLonge,
    late: isG1Vencido(r)
  };
}

/** Chip de adiamento que perdeu a vez («adiada até dd/mm/aaaa (venceu)»); vazio se não se aplica. */
export function mesaSnoozeLabel(item, todayIso) {
  if (!item || !item.snoozeExpired) return '';
  const until = (item.debt && item.debt.prescSnooze && item.debt.prescSnooze.until) || '';
  if (until && until > todayIso) return 'adiamento furado (era até ' + fmtDate(until) + ')';
  return until ? 'adiada até ' + fmtDate(until) + ' (venceu)' : 'adiada (venceu)';
}

/**
 * Linha simples de item sem linha do radar (tratadas, adiadas, ordinária derivada, parcelada, sem dados).
 * Devolve { why, date, when, whenGray, chips:[texto], reopen }.
 */
export function mesaLiteInfo(item, sil, todayIso) {
  const d = (item && item.debt) || {};
  const out = { why: '', date: '', when: '', whenGray: false, chips: [], reopen: false };
  if (item.card === 'tratadas') {
    const t = (item.row && item.row.prescKind === 'aguardando_reconhecimento' && !d.prescriptionHandledType)
      ? 'aguardando_reconhecimento' : d.prescriptionHandledType;
    out.why = MESA_HANDLED_LABEL[t] || 'Tratada';
    out.date = item.handledAt ? fmtDate(item.handledAt) : '';
  } else if (item.card === 'adiadas') {
    const sz = d.prescSnooze || {};
    out.why = PRESC_SNOOZE_REASONS[sz.reason] || (sil && PRESC_SNOOZE_REASONS[sil.reason]) || (sil && sil.label) || 'Adiada';
    out.when = item.until ? 'volta em ' + mesaDM(item.until) : '';
    out.reopen = true;
  } else if (item.derived) {
    out.chips = ['Ordinária', 'fora dos 90 dias'];
    out.why = 'Ordinária ainda não ajuizada' + (item.sortDate ? ' · data-alvo ' + fmtDate(item.sortDate) : '');
    const dias = item.sortDate ? daysUntil(item.sortDate, todayIso) : null;
    out.when = dias != null ? 'em ' + formatPrescHorizon(dias) : '';
    out.whenGray = !!item.ajuizarLonge;
  } else if (item.card === 'dado') {
    out.why = 'Sem dados para calcular';
  } else if (sil && (sil.reason === 'parcelamento_vigente' || sil.reason === 'parcelada_ficha')) {
    out.why = sil.reason === 'parcelamento_vigente' ? 'Parcelamento vigente' : 'Parcelada na ficha';
  } else {
    out.why = betaSafeUiText((item.prescResult && (item.prescResult.summary || item.prescResult.detail)) || '') || 'Sem alarme';
  }
  return out;
}

/* ───────────────────────── Fase 2 · Filtros da Mesa ─────────────────────────
 * Uma só função de filtro para os cartões e as listas das três Mesas (Prumo, clássico, Beta).
 * Campos do filtro (todos guardados em prazosFilters): operationId, personId, q, nat, cedoTarde, idpj, minVal, juntar.
 * Só leem os itens de buildMesaCards; não mudam o motor. */

/** Valores neutros dos campos da Mesa (juntar é exibição, não filtro). */
export const MESA_FILTER_DEFAULTS = {
  operationId: '', personId: 'all', q: '', nat: '', cedoTarde: false, idpj: false, minVal: 0, juntar: false
};

/** Número em formato brasileiro: "500.000" = 500000; "1,5" = 1.5; "1.5" = 1.5. NaN se não for número. */
function mesaNumBR(t) {
  const s = String(t || '').replace(/\s/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return NaN;
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  const parts = s.split('.');
  if (parts.length > 1 && parts.slice(1).every(p => p.length === 3)) return parseFloat(parts.join(''));
  return parseFloat(s);
}

/**
 * Valor mínimo digitado à mão: "500.000", "500000", "500 mil", "1,5 mi", "2 bilhões", "R$ 1.500,50".
 * Vazio ou inválido = 0 (sem filtro).
 */
export function parseMesaMinVal(text) {
  const s = String(text == null ? '' : text).toLowerCase().replace(/r\$/g, '').trim();
  if (!s) return 0;
  const m = /^(.*?)\s*(bilh(?:ão|ao|ões|oes)|bi|milh(?:ão|ao|ões|oes)|mi|mm|mil|k)\.?$/.exec(s);
  let n;
  if (m && m[1]) {
    const unit = m[2];
    const mult = /^bi/.test(unit) ? 1e9 : (/^(mil$|k$)/.test(unit) ? 1e3 : 1e6);
    n = mesaNumBR(m[1]) * mult;
  } else {
    n = mesaNumBR(s);
  }
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** Número com milhares ("500.000", "1.500,5"), para o campo e os chips. */
export function formatMesaMinVal(n) {
  const v = Number(n) || 0;
  if (v <= 0) return '';
  const [int, dec] = String(Math.round(v * 100) / 100).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dec ? ',' + dec.padEnd(2, '0') : '');
}

/** Natureza do item: 'ordinaria', 'intercorrente' ou '' (sem dado: só aparece em «Todas»). Decadência nunca entra. */
export function mesaItemNature(item, prescLookup) {
  if (!item) return '';
  if (item.derived) return 'ordinaria';
  const rowSeg = item.row && item.row.prescSegment;
  if (rowSeg === 'ordinaria' || rowSeg === 'intercorrente') return rowSeg;
  let seg = item.prescResult && item.prescResult.segment;
  if (!seg && prescLookup && item.debt) seg = (mesaSafeLookup(prescLookup, item.debt) || {}).segment;
  if (seg === 'credito' || seg === 'ordinaria') return 'ordinaria';
  if (seg === 'intercorrente') return 'intercorrente';
  return '';
}

/** Abrangida por IDPJ ou cautelar (linha com incidente ou execução coberta). */
export function mesaItemIdpj(item) {
  const r = item && item.row;
  return !!(r && (r.incident || r.hasIDPJ));
}

/**
 * Filtra itens da Mesa, mantendo a ordem. f: { operationId, personId, q, nat, cedoTarde, idpj, minVal }.
 * ctx: { personIds: Set|null (CDAs da pessoa escolhida), personOf(debt), opNameOf(opId), prescLookup }.
 */
export function filterMesaItems(items, f, ctx) {
  const o = f || {};
  const c = ctx || {};
  const raw = String(o.q || '').trim().toLowerCase();
  const qd = raw.replace(/\D/g, '');
  const min = Number(o.minVal) || 0;
  const personIds = o.personId && o.personId !== 'all' ? (c.personIds || null) : null;
  return (items || []).filter(it => {
    const d = it && it.debt;
    if (!d) return false;
    if (o.operationId && d.operationId !== o.operationId) return false;
    if (personIds && !personIds.has(d.id)) return false;
    if (raw) {
      const ok = (d.cdaNumber || '').toLowerCase().includes(raw)
        || (qd && (d.processNumber || '').replace(/\D/g, '').includes(qd))
        || String((c.personOf && c.personOf(d)) || d.devedor || '').toLowerCase().includes(raw)
        || String((c.opNameOf && c.opNameOf(d.operationId)) || '').toLowerCase().includes(raw);
      if (!ok) return false;
    }
    if (o.nat && mesaItemNature(it, c.prescLookup) !== o.nat) return false;
    if (o.cedoTarde && !it.cedoVencidaTardeNao) return false;
    if (o.idpj && !mesaItemIdpj(it)) return false;
    if (min && (Number(it.value) || 0) < min) return false;
    return true;
  });
}

/** Aplica o filtro às listas de cada cartão. Devolve { by, items, n, totals } com os totais refeitos. */
export function filterMesaCards(mc, f, ctx) {
  const by = {};
  let all = [];
  MESA_CARDS.forEach(c => {
    by[c.id] = filterMesaItems((mc && mc.byCard && mc.byCard[c.id]) || [], f, ctx);
    all = all.concat(by[c.id]);
  });
  return { by, items: all, n: all.length, totals: mesaTotalsOf(all) };
}

/** Quantas CDAs são «cedo venceu, tarde não» dentro dos outros filtros (contagem ao lado da caixa). */
export function mesaCedoCount(mc, f, ctx) {
  const base = filterMesaCards(mc, { ...(f || {}), cedoTarde: false }, ctx);
  return base.items.filter(it => it.cedoVencidaTardeNao).length;
}

/** Filtros que valem como corte dos itens (sem a exibição «juntar»). */
export function mesaHasCut(f) {
  const o = f || {};
  return !!(o.operationId || (o.personId && o.personId !== 'all') || String(o.q || '').trim()
    || o.nat || o.cedoTarde || o.idpj || Number(o.minVal) > 0);
}

/**
 * Chips dos filtros ativos: [{ k, t }], k = chave de remoção. names: { opName, personName }.
 * `panel` marca os que moram no painel (contam no botão «Filtros (N)»).
 */
export function mesaActiveFilters(f, names) {
  const o = f || {};
  const n = names || {};
  const l = [];
  if (o.operationId) l.push({ k: 'op', t: 'Operação: ' + (n.opName || o.operationId), panel: false });
  if (o.personId && o.personId !== 'all') l.push({ k: 'person', t: 'Pessoa: ' + (n.personName || o.personId), panel: false });
  if (o.nat) l.push({ k: 'nat', t: 'Natureza: ' + (o.nat === 'ordinaria' ? 'ordinária' : 'intercorrente'), panel: true });
  if (o.cedoTarde) l.push({ k: 'cedoTarde', t: 'Cedo venceu, tarde não', panel: true });
  if (o.idpj) l.push({ k: 'idpj', t: 'Só abrangidas por IDPJ ou cautelar', panel: true });
  if (Number(o.minVal) > 0) l.push({ k: 'minVal', t: 'Valor a partir de R$ ' + formatMesaMinVal(o.minVal), panel: true });
  if (String(o.q || '').trim()) l.push({ k: 'q', t: 'Busca: «' + String(o.q).trim() + '»', panel: false });
  if (o.juntar) l.push({ k: 'juntar', t: 'CDAs juntas por processo', panel: true });
  return l;
}

/** Remendo de prazosFilters para remover um chip (k de mesaActiveFilters). */
export function mesaRemovePatch(k) {
  switch (k) {
    case 'op': return { operationId: '', personId: 'all' };
    case 'person': return { personId: 'all' };
    case 'nat': return { nat: '' };
    case 'cedoTarde': return { cedoTarde: false };
    case 'idpj': return { idpj: false };
    case 'minVal': return { minVal: 0 };
    case 'q': return { q: '' };
    case 'juntar': return { juntar: false };
    default: return {};
  }
}

/** Remendo que zera os cortes (operação, pessoa, busca, natureza, marcações, valor). Não mexe na exibição «juntar». */
export function mesaResetPatch() {
  const { juntar, ...cuts } = MESA_FILTER_DEFAULTS; // eslint-disable-line no-unused-vars
  return cuts;
}

/** «Limpar tudo» do painel: zera os cortes e a exibição. */
export function mesaClearAllPatch() {
  return { ...MESA_FILTER_DEFAULTS };
}

/* ───────────────────────── Fase 3 · Edição no lugar, lote, Desfazer e Ajuizar ─────────────────────────
 * Funções puras de apoio. As gravações ficam no app (setData/upsert/handleSave); aqui só ficam o que
 * pode ser testado sem tela: ação principal por cartão, Desfazer, plano do Ajuizar, textos da faixa «Feito». */

/** Formas de tratar a prescrição (mesmos valores da ficha da CDA). */
export const MESA_TRATAR_FORMAS = [
  ['aguardando_reconhecimento', 'Prescrita — aguardando reconhecimento judicial'],
  ['declarada', 'Declarada e baixada no processo'],
  ['analisada_nao_consumada', 'Analisada — não houve prescrição'],
  ['extinta', 'Extinta por prescrição']
];

/** Cartões em que a CDA não pode ser adiada / tratada. */
const MESA_SEM_ADIAR = new Set(['antigas', 'tratadas', 'adiadas']);
const MESA_SEM_TRATAR = new Set(['tratadas', 'adiadas']);

/** Item que aceita Adiar… (tem linha do radar para dar o grupo e não está em registro/adiada/tratada). */
export function mesaCanSnooze(item) {
  return !!(item && item.row && !MESA_SEM_ADIAR.has(item.card));
}
/** Item que aceita Tratar…. */
export function mesaCanTratar(item) {
  return !!(item && !MESA_SEM_TRATAR.has(item.card));
}

/**
 * Botão primário da linha, pelo verbo do cartão. Devolve { kind, label, type? } ou null.
 * kind: ajuizar · fato · vigencia · vincular · dado · conferir · analisar · reabrir · destratar.
 */
export function mesaPrimaryAction(item) {
  if (!item) return null;
  const r = item.row;
  const act = (r && r.action && r.action.type) || '';
  const kind = r && (r.prescKind || r.kind);
  const fato = () => {
    if (act === 'lancar_ciencia') return { kind: 'fato', label: 'Lançar ciência', type: 'marco_sem_bens' };
    return { kind: 'fato', label: 'Lançar fato', type: act === 'criar_evento' ? (r.action.eventType || '') : '' };
  };
  switch (item.card) {
    case 'ajuizar': return { kind: 'ajuizar', label: 'Ajuizei — informar processo' };
    case 'fato': return fato();
    case 'vigencia': return r ? { kind: 'vigencia', label: 'Ainda vale' } : null;
    case 'dado':
      if (act === 'vincular_ef') return { kind: 'vincular', label: 'Vincular EF' };
      return { kind: 'dado', label: 'Informar dado', field: (act === 'corrigir_ficha' && r.action.field === 'constituicao') ? 'constituicao' : 'ficha' };
    case 'calculo': return { kind: 'conferir', label: 'Conferir' };
    case 'sempressa': {
      const penhora = act === 'analisar_penhora' || kind === 'penhora_antiga'
        || (kind === 'vigiar_interrompido' && !(r && r.idpjNotice && r.idpjNotice.active));
      return penhora ? { kind: 'analisar', label: 'Marcar analisada' } : { kind: 'fato', label: 'Lançar fato', type: '' };
    }
    case 'adiadas': return { kind: 'reabrir', label: 'Reabrir agora' };
    case 'tratadas': return { kind: 'destratar', label: 'Desfazer tratamento' };
    default: return null;
  }
}

/* ── Desfazer ── */

function mesaClone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

/**
 * Guarda o estado das entidades que uma ação vai tocar, ANTES de gravar. Entidade que ainda não existe
 * (será criada pela ação) fica como null. Guarda também os ids de eventos/execuções existentes, para
 * reconhecer o que a ação criou além do previsto (eventos propagados aos apensos e às EFs do incidente).
 */
export function captureUndo(data, { debtIds = [], executionIds = [], eventIds = [] } = {}, nowIso) {
  const d = data || {};
  const pick = (col, ids) => {
    const by = new Map(((d[col]) || []).filter(e => e && e.id).map(e => [e.id, e]));
    const out = {};
    (ids || []).forEach(id => { out[id] = by.has(id) ? mesaClone(by.get(id)) : null; });
    return out;
  };
  return {
    at: nowIso || new Date().toISOString(),
    debts: pick('debts', debtIds),
    executions: pick('executions', executionIds),
    prescriptionEvents: pick('prescriptionEvents', eventIds),
    knownExecutionIds: ((d.executions) || []).map(e => e && e.id).filter(Boolean),
    knownEventIds: ((d.prescriptionEvents) || []).map(e => e && e.id).filter(Boolean)
  };
}

/**
 * Desfaz só o que a ação tocou: restaura as entidades guardadas (com updatedAt novo, para a nuvem
 * enxergar a volta como edição recente), remove as criadas (null no snapshot ou listadas em `created`)
 * e os eventos propagados que a ação gerou. Não mexe no resto do data.
 */
export function applyUndo(data, snap, created, nowIso) {
  if (!data || !snap) return data;
  const now = nowIso || new Date().toISOString();
  const c = created || {};
  const next = { ...data };
  const restore = (col, saved, dropIds) => {
    const drop = new Set(dropIds || []);
    Object.keys(saved || {}).forEach(id => { if (saved[id] == null) drop.add(id); });
    next[col] = ((data[col]) || []).flatMap(e => {
      if (!e) return [e];
      if (drop.has(e.id)) return [];
      if (saved && Object.prototype.hasOwnProperty.call(saved, e.id) && saved[e.id] != null) {
        return [{ ...mesaClone(saved[e.id]), updatedAt: now }];
      }
      return [e];
    });
  };
  restore('debts', snap.debts, []);
  restore('executions', snap.executions, c.executionIds);
  const knownEv = new Set(snap.knownEventIds || []);
  const propagated = ((data.prescriptionEvents) || []).filter(e => e && !knownEv.has(e.id)
    && (e._inheritedFromParent || e._inheritedFromIDPJ) && String(e.createdAt || '') >= String(snap.at || '')).map(e => e.id);
  restore('prescriptionEvents', snap.prescriptionEvents, [...(c.eventIds || []), ...propagated]);
  return next;
}

/* ── Ajuizar ── */

/** Dígito verificador CNJ (Res. 65/2008). null se não tem 20 dígitos. */
function mesaCnjDv(digits) {
  if (digits.length !== 20) return null;
  const mod97 = (str) => { let r = 0; for (const ch of str) r = (r * 10 + (ch.charCodeAt(0) - 48)) % 97; return r; };
  const calc = 98 - mod97(digits.slice(0, 7) + digits.slice(9) + '00');
  return String(calc).padStart(2, '0') === digits.slice(7, 9);
}

/** NNNNNNN-DD.AAAA.J.TR.OOOO se tiver 20 dígitos; senão o texto como veio (sem espaços nas pontas). */
export function mesaFormatCnj(text) {
  const t = String(text == null ? '' : text).trim();
  const d = t.replace(/\D/g, '');
  if (d.length !== 20) return t;
  return d.slice(0, 7) + '-' + d.slice(7, 9) + '.' + d.slice(9, 13) + '.' + d.slice(13, 14) + '.' + d.slice(14, 16) + '.' + d.slice(16);
}

/** Validação leve do número do processo: só avisa, nunca bloqueia. { level: ''|'ok'|'warn', msg }. */
export function mesaCnjCheck(text) {
  const d = String(text == null ? '' : text).replace(/\D/g, '');
  if (!d) return { level: '', msg: '' };
  if (d.length !== 20) return { level: 'warn', msg: 'Fora do formato CNJ (20 dígitos). Confira; pode gravar assim mesmo.' };
  if (mesaCnjDv(d) === false) return { level: 'warn', msg: 'Dígito verificador CNJ não confere. Confira o número; pode gravar assim mesmo.' };
  return { level: 'ok', msg: '' };
}

/**
 * Plano do Ajuizar (decisão 14): nº do processo + data do ajuizamento (+ vara) em uma ou várias CDAs.
 * Se já existe execução fiscal com o mesmo número na operação, só vincula; senão devolve a execução a criar.
 * { ok:false, error } ou { ok:true, operationId, debtIds, processNumber, date, court, execution|null, linkExecutionId, prev, cnj }.
 * `newExecId` é o id (gerado pelo app) da execução nova.
 */
export function mesaPlanAjuizar({ data, debtIds, processNumber, date, court, newExecId } = {}) {
  const proc = mesaFormatCnj(processNumber);
  if (!normProc(proc)) return { ok: false, error: 'Informe o número do processo.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return { ok: false, error: 'Informe a data do ajuizamento.' };
  const byId = new Map(((data && data.debts) || []).filter(d => d && d.id).map(d => [d.id, d]));
  const debts = [...new Set(debtIds || [])].map(id => byId.get(id)).filter(Boolean);
  if (!debts.length) return { ok: false, error: 'Nenhuma CDA para ajuizar.' };
  const ops = new Set(debts.map(d => d.operationId || ''));
  if (ops.size > 1) return { ok: false, error: 'As CDAs são de operações diferentes. Ajuíze uma operação por vez.' };
  const operationId = debts[0].operationId || '';
  const same = ((data && data.executions) || []).filter(e => e && (e.operationId || '') === operationId && sameProc(e.processNumber, proc));
  const fiscal = same.find(e => e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  if (!fiscal && same.length) {
    return { ok: false, error: 'Este número já está cadastrado na operação como incidente (IDPJ ou cautelar). Informe o número da execução fiscal.' };
  }
  const prev = {};
  debts.forEach(d => { prev[d.id] = d.processNumber || ''; });
  const vara = String(court || '').trim();
  return {
    ok: true,
    operationId,
    debtIds: debts.map(d => d.id),
    processNumber: proc,
    date,
    court: vara,
    linkExecutionId: fiscal ? fiscal.id : '',
    execution: fiscal ? null : {
      id: newExecId,
      operationId,
      processNumber: proc,
      className: 'Execução Fiscal',
      court: vara,
      processTag: 'normal',
      status: 'ativa',
      protocolDate: date
    },
    prev,
    cnj: mesaCnjCheck(proc)
  };
}

/* ── Faixa «Feito» ── */

export function mesaCardName(id) {
  const c = MESA_CARDS.find(x => x.id === id);
  return c ? c.nome : '';
}

/**
 * «Foi para «X»» a partir dos itens recalculados. from: { debtId: cartão de origem }.
 * Mesmo cartão = «Continua em «X»». Vários destinos: «Foram para «A» (2) e «B» (1)».
 */
export function mesaDestText(byDebt, debtIds, from) {
  const counts = new Map();
  let moved = false;
  (debtIds || []).forEach(id => {
    const it = byDebt && byDebt.get(id);
    if (!it) return;
    counts.set(it.card, (counts.get(it.card) || 0) + 1);
    if (!from || from[id] !== it.card) moved = true;
  });
  if (!counts.size) return '';
  const many = (debtIds || []).length > 1;
  const names = [...counts.entries()].map(([card, n]) => '«' + mesaCardName(card) + '»' + (counts.size > 1 ? ' (' + n + ')' : ''));
  const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0];
  const verb = moved ? (many ? 'Foram para ' : 'Foi para ') : (many ? 'Continuam em ' : 'Continua em ');
  return verb + list + '.';
}

/** «3 CDAs» / «1 CDA». */
export function mesaCdaCount(n) {
  return n + (n === 1 ? ' CDA' : ' CDAs');
}

/** Soma de valores e quantidade de uma seleção, para a barra de lote: { n, value }. */
export function mesaSelectionTotals(items) {
  let value = 0;
  (items || []).forEach(it => { value += Number(it && it.value) || 0; });
  return { n: (items || []).length, value };
}

/** Quais ações do lote valem para todos os itens selecionados. */
export function mesaBatchCan(items) {
  const l = items || [];
  return {
    adiar: l.length > 0 && l.every(mesaCanSnooze),
    tratar: l.length > 0 && l.every(mesaCanTratar),
    fato: l.length > 0 && l.every(it => it.card !== 'tratadas'),
    ajuizar: l.length > 0 && l.every(it => it.card === 'ajuizar')
  };
}

/** Data máxima do adiamento de um conjunto de itens: o menor teto entre os grupos (sem linha = grupo 4). */
export function mesaSnoozeMaxFor(items, todayIso) {
  let max = '';
  (items || []).forEach(it => {
    const g = (it && it.row && it.row.group) || 4;
    const m = snoozeMaxUntil(g, todayIso);
    if (!max || m < max) max = m;
  });
  return max || snoozeMaxUntil(4, todayIso);
}

/** Campos do «Informar dado» na linha: [campo, rótulo]. */
export function mesaDadoCampos(field) {
  return field === 'constituicao'
    ? [['dueDate', 'Vencimento'], ['constitutionDate', 'Constituição definitiva']]
    : [['prescriptionDate', 'Data de prescrição (ficha)'], ['inscriptionDate', 'Inscrição em dívida ativa'], ['dueDate', 'Vencimento'], ['constitutionDate', 'Constituição definitiva']];
}
