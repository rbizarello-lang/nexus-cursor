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
