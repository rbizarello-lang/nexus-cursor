/**
 * Mesa de trabalho dos prazos (edição Beta).
 * Funções puras: seleção da fila, selos, frases da linha da CDA, texto sem jargão.
 */
import { addCalendarDays, addCalendarYears, daysBetween, daysUntil, fmtDate } from './dates.js';
import {
  PENHORA_ANALISE_VALIDADE,
  PRESC_SNOOZE_REASONS,
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

function mesaPenhoraAnaliseVigente(debt, todayIso) {
  const at = debt && debt.penhoraAnalise && debt.penhoraAnalise.at;
  if (!at) return false;
  const n = daysBetween(at, todayIso);
  return n < PENHORA_ANALISE_VALIDADE;
}

function mesaSafeLookup(prescLookup, debt) {
  try { return prescLookup(debt) || null; } catch (e) { return null; }
}

/** Cartão de uma linha do radar (regras 3 a 9). Devolve { card, prescResult? }. */
function mesaCardOfRow(row, debt, prescLookup, todayIso) {
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
      && !mesaPenhoraAnaliseVigente(debt, todayIso)) {
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
        const res = mesaCardOfRow(row, debt, lookup, todayIso);
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
    totals[c.id] = { n: 0, value: 0 };
  });
  totals.ajuizar.nLonge = 0;
  totals.ajuizar.valueLonge = 0;
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
