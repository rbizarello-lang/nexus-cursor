/**
 * Mesa de trabalho dos prazos (edição Beta).
 * Funções puras: seleção da fila, selos, frases da linha da CDA, texto sem jargão.
 */
import { addCalendarDays, fmtDate } from './dates.js';
import { PRESC_SNOOZE_REASONS, snoozeLimitDays } from './prescription.js';

export const MESA_CAP = 12;
export const MESA_ONE_CLICK = new Set(['criar_evento', 'corrigir_ficha', 'vincular_ef']);

export function mesaCertainty(row) {
  const k = row && (row.prescKind || row.kind);
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
  if (row.group === 1) return true;
  if (row.group === 2 && row.prescDays != null && row.prescDays <= 0) return true;
  const act = row.action && row.action.type;
  if (row.group === 3 && MESA_ONE_CLICK.has(act)) return true;
  if (row.reviewAt && todayIso && row.reviewAt <= todayIso) return true;
  return false;
}

export function splitMesaRows(rows, todayIso, cap = MESA_CAP) {
  const needs = [];
  const rest = [];
  (rows || []).forEach(r => {
    if (mesaNeedsYou(r, todayIso)) needs.push(r);
    else rest.push(r);
  });
  needs.sort((a, b) => (a.group || 9) - (b.group || 9) || (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  const hiddenG5 = rest.filter(r => r.group === 5);
  const restVisible = rest.filter(r => r.group !== 5);
  return {
    needsYou: needs.slice(0, cap),
    overCap: needs.slice(cap),
    rest: restVisible,
    hiddenG5
  };
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
  int_outra: 'resultado útil'
};

const BETA_SUSP_BY = {
  susp_parcelamento: 'parcelamento',
  susp_embargos: 'embargos',
  susp_decisao_judicial: 'decisão judicial',
  susp_deposito: 'depósito',
  susp_falencia: 'falência / recuperação',
  susp_idpj_mcf_constricao: 'constrição no incidente',
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
    return 'Constrição no incidente (pausa as EFs)';
  }
  if (family.id === 'marco') return 'Ciência do art. 40';
  return betaSafeUiText(family.label || '');
}

export function betaEventFamilyDesc(family, destIsIncident) {
  if (!family) return '';
  if (destIsIncident && family.id === 'resultado_util') {
    return 'Constrição no incidente pausa as execuções abrangidas desde o pedido. Não encerra o ciclo da execução.';
  }
  let desc = betaSafeUiText(family.desc || '');
  if (destIsIncident) desc = desc.replace(/resultado útil/gi, 'constrição').replace(/Penhora\s*\/\s*constrição/gi, 'Constrição');
  return desc;
}
