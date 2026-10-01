/**
 * Cálculos puros da tela Hoje e da Visão geral do Nexus Prumo (Polimento a partir da referência) —
 * sem DOM nem React. Tudo sai de campos que o app já tem; nada é inventado nem vem de IA.
 *
 *  - Carga de prazos: um ponto por item aberto com data (intimações pelo prazo final, tarefas pela data
 *    limite, audiências), agrupados por dia a partir de hoje (3 ou 6 semanas), com pico, semana mais pesada
 *    e vencidos. Nenhum item é descartado: a UI parte os dias com mais de `perCol` itens em colunas finas.
 *  - Resumo: frase montada por regras fixas (cada trecho só entra se a condição for verdadeira). Os
 *    destaques vêm entre `**` (a UI troca por negrito); `resumoPlain` tira as marcas.
 *  - Precisa de atenção: CDAs no alarme (grupo 1 da Mesa de prazos) e operações com revisão atrasada.
 */
import { toDayKey, daysUntil, addCalendarDays } from './dates.js';

export const CARGA_DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
/** Ordem dentro do dia (de baixo para cima na pilha): audiência, intimação, tarefa. */
export const CARGA_KIND_ORDER = { h: 0, i: 1, t: 2 };
export const CARGA_KIND_LABEL = { i: ['intimação', 'intimações'], t: ['tarefa', 'tarefas'], h: ['audiência', 'audiências'] };
/** Dia concentrado: pelo menos este nº de itens e pelo menos 1,5 vez a média dos dias com item. */
export const CARGA_PICO_MIN = 3;
export const CARGA_PICO_RATIO = 1.5;
/** Audiência citada no Resumo da tela Hoje: em até 3 dias (na Visão geral da operação: em até 7). */
export const RESUMO_AUDIENCIA_DIAS_HOJE = 3;
export const RESUMO_AUDIENCIA_DIAS_OP = 7;
/** Diferença mínima (p.p.) entre a garantia da operação e a da carteira para o Resumo comentar. */
export const RESUMO_GARANTIA_PP = 5;

export const dmIso = (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '—');
export const dowIso = (iso) => CARGA_DOW[new Date(iso + 'T00:00:00').getDay()];
/** "dom 04/10" */
export const dowDmIso = (iso) => (iso ? dowIso(iso) + ' ' + dmIso(iso) : '—');
const hjPlural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const hjJoinE = (list) => (list.length <= 1 ? list.join('') : list.slice(0, -1).join(', ') + ' e ' + list[list.length - 1]);

/** Cor por urgência: 0 vencido, 1 até 2 dias, 2 de 3 a 7 dias, 3 de 8 dias em diante. */
export function cargaUrgencia(dd) {
  if (dd === null || dd === undefined) return 3;
  if (dd < 0) return 0;
  if (dd <= 2) return 1;
  if (dd <= 7) return 2;
  return 3;
}

/**
 * Itens abertos com data. `helpers` (todos opcionais) injetam as regras do app:
 *  isOpenIntim(x), isOpenTask(t), intimLabel(x), hearingLabel(h), taskLabel(t).
 * Mesma regra da Fila do dia: intimação aberta e sem atuação, com prazo final; tarefa nem concluída nem
 * cancelada, com data limite; audiência nem realizada nem cancelada, com data.
 */
export function cargaItens(data, today, helpers = {}) {
  const {
    isOpenIntim = (x) => !x.responseAction && x.status !== 'analisado',
    isOpenTask = (t) => t.status !== 'concluida' && t.status !== 'cancelada',
    intimLabel = (x) => x.parties || x.processNumber || 'Intimação',
    hearingLabel = () => 'Audiência',
    taskLabel = (t) => t.title || t.description || 'Tarefa',
  } = helpers;
  const out = [];
  const add = (key, kind, rawIso, label, sub, opId, ref) => {
    const iso = toDayKey(rawIso);
    if (!iso) return;
    const dd = daysUntil(iso, today);
    if (dd === null) return;
    out.push({ key, kind, iso, dd, urg: cargaUrgencia(dd), label, sub: sub || '', opId: opId || '', ref });
  };
  (data.intimations || []).forEach(x => { if (isOpenIntim(x) && x.dateDeadline) add('i' + x.id, 'i', x.dateDeadline, intimLabel(x), x.eventDescription || x.className || '', x.operationId, x); });
  (data.tasks || []).forEach(t => { if (isOpenTask(t) && t.dueDate) add('t' + t.id, 't', t.dueDate, taskLabel(t), '', t.operationId, t); });
  (data.hearings || []).forEach(h => {
    if (h.status === 'realizada' || h.status === 'cancelada' || !h.date) return;
    add('h' + h.id, 'h', h.date, hearingLabel(h) + (h.time ? ' · ' + h.time : ''), h.parties || h.processNumber || '', h.operationId, h);
  });
  return out;
}

function hjSortDay(a, b) {
  return (CARGA_KIND_ORDER[a.kind] - CARGA_KIND_ORDER[b.kind]) || String(a.label).localeCompare(String(b.label), 'pt-BR');
}

/**
 * Mapa de pontos: `weeks` semanas de 7 dias a partir de `today` (semana 1 = hoje + 6 dias).
 * Devolve dias, semanas, vencidos (do mais antigo para o mais novo), totais, pico e semana mais pesada.
 * Itens além do horizonte não entram nos dias; ficam contados em `alem`.
 */
export function cargaMapa(itens, { today, weeks = 3, perCol = 5 } = {}) {
  const nDays = weeks * 7;
  const days = [];
  for (let k = 0; k < nDays; k++) {
    const iso = addCalendarDays(today, k);
    const dow = new Date(iso + 'T00:00:00').getDay();
    days.push({ iso, dow, week: Math.floor(k / 7), isToday: k === 0, isWeekend: dow === 0 || dow === 6, items: [], count: 0, cols: 1 });
  }
  const byIso = new Map(days.map(d => [d.iso, d]));
  const vencidos = [];
  let alem = 0;
  (itens || []).forEach(it => {
    if (it.dd < 0) { vencidos.push(it); return; }
    const d = byIso.get(it.iso);
    if (d) d.items.push(it); else alem++;
  });
  vencidos.sort((a, b) => a.dd - b.dd || hjSortDay(a, b));
  days.forEach(d => { d.items.sort(hjSortDay); d.count = d.items.length; d.cols = Math.max(1, Math.ceil(d.count / perCol)); });

  const semanas = [];
  for (let w = 0; w < weeks; w++) {
    const ds = days.slice(w * 7, w * 7 + 7);
    semanas.push({ idx: w, from: ds[0].iso, to: ds[ds.length - 1].iso, count: ds.reduce((s, d) => s + d.count, 0) });
  }
  const porTipo = { i: 0, t: 0, h: 0 };
  days.forEach(d => d.items.forEach(it => { porTipo[it.kind]++; }));
  const total = porTipo.i + porTipo.t + porTipo.h;

  const comItem = days.filter(d => d.count > 0);
  const media = comItem.length ? total / comItem.length : 0;
  let pico = null;
  comItem.forEach(d => { if (!pico || d.count > pico.count) pico = d; });
  const picoInfo = pico ? {
    iso: pico.iso, count: pico.count,
    i: pico.items.filter(x => x.kind === 'i').length, t: pico.items.filter(x => x.kind === 't').length, h: pico.items.filter(x => x.kind === 'h').length,
    concentrado: pico.count >= CARGA_PICO_MIN && pico.count >= CARGA_PICO_RATIO * media,
  } : null;

  let pesada = null;
  semanas.forEach(s => { if (!pesada || s.count > pesada.count) pesada = s; });
  const semanaPesada = pesada && pesada.count > 0 ? { idx: pesada.idx, from: pesada.from, count: pesada.count, atual: semanas[0].count, deltaAtual: pesada.count - semanas[0].count } : null;

  return { today, weeks, days, semanas, vencidos, total, porTipo, pico: picoInfo, semanaPesada, media: Math.round(media * 10) / 10, alem, perCol };
}

/** Texto do item de pico: "5 itens: 2 intimações e 3 tarefas". */
export function composicaoDia(c) {
  const parts = ['i', 't', 'h'].filter(k => c[k] > 0).map(k => hjPlural(c[k], CARGA_KIND_LABEL[k][0], CARGA_KIND_LABEL[k][1]));
  return hjPlural(c.count, 'item', 'itens') + (parts.length ? ': ' + hjJoinE(parts) : '');
}

/**
 * Resumo da Carga de prazos (tela Hoje). Regras, nesta ordem, no máximo 3 orações:
 *  (1) dia de pico concentrado; (2) semana mais pesada que a atual; (3) vencidos, com o mais antigo;
 *  (4) audiência em até 3 dias. Devolve '' quando nenhuma vale.
 * @param {object} mapa resultado de cargaMapa
 * @param {{dias:number, tipo?:string, time?:string}|null} [audiencia] próxima audiência
 */
export function resumoCarga(mapa, audiencia = null) {
  const out = [];
  if (mapa.pico && mapa.pico.concentrado) {
    out.push('Carga concentrada em **' + dowDmIso(mapa.pico.iso) + '** (' + composicaoDia({ ...mapa.pico }) + ').');
  }
  const sp = mapa.semanaPesada;
  if (sp && sp.idx > 0 && sp.count > sp.atual) {
    out.push('A semana de **' + dmIso(sp.from) + '** é a mais pesada: **' + hjPlural(sp.count, 'item', 'itens') + '**, contra ' + sp.atual + ' na atual.');
  }
  if (mapa.vencidos.length) {
    const old = -mapa.vencidos[0].dd;
    out.push('**' + hjPlural(mapa.vencidos.length, 'item vencido', 'itens vencidos') + '**; ' + (mapa.vencidos.length === 1 ? 'há ' : 'o mais antigo, há ') + hjPlural(old, 'dia', 'dias') + '.');
  }
  if (audiencia && audiencia.dias !== null && audiencia.dias >= 0 && audiencia.dias <= RESUMO_AUDIENCIA_DIAS_HOJE) {
    const quando = audiencia.dias === 0 ? 'hoje' : audiencia.dias === 1 ? 'amanhã' : 'em ' + audiencia.dias + ' dias';
    out.push('Audiência **' + quando + '**' + (audiencia.time ? ' (' + audiencia.time + ')' : '') + '.');
  }
  return out.slice(0, 3).join(' ');
}

/**
 * Resumo da Visão geral da operação (regras fixas; cada trecho só entra se valer):
 *  garantia contra a média da carteira (diferença de 5 p.p. ou mais) · intimação vencida (a mais antiga e a
 *  parte) · CDAs no alarme · revisão atrasada · audiência marcada (em até 7 dias).
 * @param {object} i
 * @param {number|null} i.garantiaPct % garantido da operação (null se sem dívida)
 * @param {number|null} i.carteiraPct % garantido da carteira
 * @param {{n:number, maisAntigaDias:number, parte?:string}|null} i.intimVencidas
 * @param {number} i.cdasAlarme CDAs da operação nos grupos urgentes
 * @param {number|null} i.revisaoAtrasadaDias dias de atraso (null se em dia)
 * @param {{dias:number, tipo?:string, iso?:string, time?:string}|null} i.audiencia
 */
export function resumoOperacao(i) {
  const out = [];
  if (i.garantiaPct != null && i.carteiraPct != null) {
    const dif = i.garantiaPct - i.carteiraPct;
    if (Math.abs(dif) >= RESUMO_GARANTIA_PP) out.push('Garantia de **' + i.garantiaPct + '%**, ' + (dif < 0 ? 'abaixo' : 'acima') + ' da média da carteira (' + i.carteiraPct + '%).');
  }
  const iv = i.intimVencidas;
  if (iv && iv.n > 0) {
    out.push('**' + hjPlural(iv.n, 'intimação vencida', 'intimações vencidas') + '** há ' + hjPlural(iv.maisAntigaDias, 'dia', 'dias') + (iv.parte ? ' (' + iv.parte + ')' : '') + '.');
  }
  if (i.cdasAlarme > 0) out.push('**' + hjPlural(i.cdasAlarme, 'CDA', 'CDAs') + '** no alarme de prescrição.');
  if (i.revisaoAtrasadaDias != null && i.revisaoAtrasadaDias > 0) out.push('Revisão atrasada há ' + hjPlural(i.revisaoAtrasadaDias, 'dia', 'dias') + '.');
  const a = i.audiencia;
  if (a && a.dias !== null && a.dias >= 0 && a.dias <= RESUMO_AUDIENCIA_DIAS_OP) {
    out.push('Próxima audiência: ' + (a.tipo ? a.tipo + ', ' : '') + '**' + (a.iso ? dowDmIso(a.iso) : '') + (a.time ? ', ' + a.time : '') + '**.');
  }
  return out.join(' ');
}

/** Tira as marcas `**` do Resumo (texto simples, para testes e títulos). */
export const resumoPlain = (s) => String(s || '').replace(/\*\*/g, '');

/**
 * Partes do Resumo para a UI: [{ t: 'texto', b: true|false }].
 */
export function resumoPartes(s) {
  return String(s || '').split('**').map((t, k) => ({ t, b: k % 2 === 1 })).filter(p => p.t);
}

/**
 * "Precisa de atenção": CDAs no alarme (linhas do grupo 1 da Mesa de prazos, da mais próxima do termo para a mais
 * distante) e operações ativas com a revisão fora do prazo (da mais atrasada para a menos).
 * @param {object} i
 * @param {Array} i.rows prazosRadar.rows
 * @param {Array} i.operations operações
 * @param {(op:object)=>{overdue:boolean, daysLeft:number|null, intervalLabel?:string}} i.reviewOf
 */
export function atencaoItens({ rows, operations, reviewOf }) {
  const cdas = (rows || []).filter(r => r && r.group === 1).slice().sort((a, b) => {
    const da = a.prescDays == null ? Infinity : a.prescDays, db = b.prescDays == null ? Infinity : b.prescDays;
    return da - db || String(a.cdaNumber || '').localeCompare(String(b.cdaNumber || ''));
  });
  const revisoes = [];
  (operations || []).forEach(op => {
    if (!op || op.status === 'encerrada') return;
    const rs = reviewOf(op);
    if (rs && rs.overdue && rs.daysLeft != null) revisoes.push({ op, diasAtraso: -rs.daysLeft, intervalo: rs.intervalLabel || '' });
  });
  revisoes.sort((a, b) => b.diasAtraso - a.diasAtraso || String(a.op.name || '').localeCompare(String(b.op.name || ''), 'pt-BR'));
  return { cdas, revisoes, total: cdas.length + revisoes.length };
}

/** Frase do cabeçalho do painel: "4 itens pedem uma decisão sua: 2 CDAs no alarme e 2 revisões atrasadas". */
export function atencaoFrase(a) {
  if (!a.total) return '';
  const parts = [];
  if (a.cdas.length) parts.push(hjPlural(a.cdas.length, 'CDA no alarme', 'CDAs no alarme'));
  if (a.revisoes.length) parts.push(hjPlural(a.revisoes.length, 'revisão atrasada', 'revisões atrasadas'));
  return (a.total === 1 ? '1 item pede' : a.total + ' itens pedem') + ' uma decisão sua: ' + hjJoinE(parts);
}
