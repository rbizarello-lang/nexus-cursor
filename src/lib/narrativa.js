/**
 * Narrativa da operação (Nexus Prumo, M2 da Linha do tempo e card do Briefing) — funções puras, sem DOM nem React.
 *
 * A tela monta as "entradas" (decisões e fases, prazos, audiências, prescrição, tarefas e as atuações de
 * `buildUltimasAtuacoes`) a partir dos dados que o app já tem; este módulo só classifica, filtra, agrupa e resume.
 * Nenhum campo novo de dado.
 *
 * Entrada (`entry`): { id, cat, d (ISO ou ''), tm?, title, text?, open?, done?, big?, execId?, ... }
 *   cat  : 'dec' (decisões e fases) · 'prazo' · 'aud' · 'presc' · 'mine' (minhas atuações) · 'tar' (tarefas)
 *   open : aguardando providência (prazo aberto, tarefa aberta, revisão, CDA a ajuizar) — vencida vira "Atrasado"
 *   done : já cumprida (tarefa concluída, intimação respondida, audiência realizada) — nunca é "a vir"
 *
 * Ordem "Próximo → antigo": Atrasado · Esta semana · Próxima semana · Mais adiante · (Hoje) · Últimos 35 dias ·
 * Entre 5 e 18 semanas atrás · Antes disso · Sem data. Ordem "Cronológica": do mais antigo ao mais novo, por mês.
 */
import { addCalendarDays, daysBetween, localIso, toDayKey } from './dates.js';

export const NARR_CATS = [
  ['all', 'Tudo'],
  ['dec', 'Decisões e fases'],
  ['prazo', 'Prazos'],
  ['aud', 'Audiências'],
  ['presc', 'Prescrição'],
  ['mine', 'Minhas atuações'],
  ['tar', 'Tarefas'],
];
export const NARR_PAST_RECENT = 35;
export const NARR_PAST_MID = 130;
export const NARR_PAST_STEP = 10;
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "01 a 04/out" (mesmo mês) ou "28/set a 04/out"; um dia só: "04/out". */
export function narrRangeLabel(from, to) {
  const a = toDayKey(from), b = toDayKey(to);
  if (!a || !b) return '';
  const dd = (x) => x.slice(8, 10);
  const mm = (x) => MES[+x.slice(5, 7) - 1];
  if (a === b) return dd(a) + '/' + mm(a);
  if (a.slice(0, 7) === b.slice(0, 7)) return dd(a) + ' a ' + dd(b) + '/' + mm(b);
  return dd(a) + '/' + mm(a) + ' a ' + dd(b) + '/' + mm(b);
}

/** Fim da semana de hoje (domingo, inclusive) e a semana seguinte (segunda a domingo). */
export function narrWeeks(todayIso) {
  const t = toDayKey(todayIso) || localIso(new Date());
  const dow = new Date(t + 'T00:00:00').getDay();
  const thisEnd = addCalendarDays(t, dow === 0 ? 0 : 7 - dow);
  const nextStart = addCalendarDays(thisEnd, 1);
  const nextEnd = addCalendarDays(nextStart, 6);
  return { today: t, thisEnd, nextStart, nextEnd };
}

/** 'late' (providência vencida) · 'future' (de hoje em diante) · 'past' · 'nodate'. */
export function narrClassify(entry, todayIso) {
  const t = toDayKey(todayIso) || localIso(new Date());
  const d = toDayKey(entry && entry.d);
  if (!d) return 'nodate';
  if (entry.done) return 'past';
  if (d < t) return entry.open ? 'late' : 'past';
  return 'future';
}

const tmKey = (e) => String(e.tm || '');
const asc = (a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : tmKey(a).localeCompare(tmKey(b)) || String(a.id).localeCompare(String(b.id)));
const desc = (a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : tmKey(b).localeCompare(tmKey(a)) || String(a.id).localeCompare(String(b.id)));

/** Filtra por natureza ('all' = tudo) e por processo ('' = todos). */
export function narrFilter(entries, { cat = 'all', execId = '' } = {}) {
  return (entries || []).filter(e => e && (cat === 'all' || e.cat === cat || (e.cats && e.cats.includes(cat))) && (!execId || e.execId === execId));
}

/** Contagem por natureza para os chips (respeita o filtro de processo). */
export function narrCounts(entries, execId = '') {
  const base = narrFilter(entries, { execId });
  const out = {};
  NARR_CATS.forEach(([k]) => { out[k] = k === 'all' ? base.length : narrFilter(base, { cat: k }).length; });
  return out;
}

/**
 * Seções na ordem "Próximo → antigo". Cada seção: { key, label, tone, sub?, items }. `now` é o índice (em `sections`)
 * antes do qual vem o divisor "Hoje" (= número de seções do "que vem").
 */
export function narrSectionsFocus(entries, todayIso) {
  const w = narrWeeks(todayIso);
  const buckets = { late: [], w1: [], w2: [], later: [], recent: [], mid: [], old: [], nodate: [] };
  (entries || []).forEach(e => {
    const c = narrClassify(e, w.today);
    if (c === 'late') buckets.late.push(e);
    else if (c === 'future') {
      if (e.d <= w.thisEnd) buckets.w1.push(e);
      else if (e.d <= w.nextEnd) buckets.w2.push(e);
      else buckets.later.push(e);
    } else if (c === 'past') {
      const ago = daysBetween(e.d, w.today);
      if (ago <= NARR_PAST_RECENT) buckets.recent.push(e);
      else if (ago <= NARR_PAST_MID) buckets.mid.push(e);
      else buckets.old.push(e);
    } else buckets.nodate.push(e);
  });
  const ahead = [
    { key: 'late', label: 'Atrasado', tone: 'late', items: buckets.late.sort(asc) },
    { key: 'w1', label: 'Esta semana', sub: narrRangeLabel(w.today, w.thisEnd), items: buckets.w1.sort(asc) },
    { key: 'w2', label: 'Próxima semana', sub: narrRangeLabel(w.nextStart, w.nextEnd), items: buckets.w2.sort(asc) },
    { key: 'later', label: 'Mais adiante', items: buckets.later.sort(asc) },
  ].filter(s => s.items.length);
  const past = [
    { key: 'recent', label: 'Últimos ' + NARR_PAST_RECENT + ' dias', items: buckets.recent.sort(desc) },
    { key: 'mid', label: 'Entre 5 e 18 semanas atrás', items: buckets.mid.sort(desc) },
    { key: 'old', label: 'Antes disso', items: buckets.old.sort(desc) },
    { key: 'nodate', label: 'Sem data', items: buckets.nodate.sort((a, b) => String(a.id).localeCompare(String(b.id))) },
  ].filter(s => s.items.length);
  return { sections: ahead.concat(past), now: ahead.length, ahead: ahead.reduce((n, s) => n + s.items.length, 0), past: past.reduce((n, s) => n + s.items.length, 0) };
}

/**
 * Pagina o passado e limita "Mais adiante": o que vem (atrasado, esta semana e a próxima) aparece inteiro;
 * do passado mostra os `pastShown` mais recentes (os "sem data" por último) e conta o que ficou de fora.
 * Devolve { sections, hiddenPast, hiddenLater }.
 */
export function narrPaginate(focus, { pastShown = NARR_PAST_STEP, laterCap = Infinity, laterExpanded = false } = {}) {
  let left = pastShown;
  let hiddenPast = 0, hiddenLater = 0;
  const sections = [];
  focus.sections.forEach((s, i) => {
    if (i < focus.now) {
      if (s.key === 'later' && !laterExpanded && s.items.length > laterCap) {
        hiddenLater = s.items.length - laterCap;
        sections.push({ ...s, items: s.items.slice(0, laterCap), total: s.items.length });
      } else sections.push(s);
      return;
    }
    if (left <= 0) { hiddenPast += s.items.length; return; }
    if (s.items.length <= left) { left -= s.items.length; sections.push(s); return; }
    sections.push({ ...s, items: s.items.slice(0, left), total: s.items.length });
    hiddenPast += s.items.length - left;
    left = 0;
  });
  return { sections, now: focus.now, hiddenPast, hiddenLater };
}

/** Ordem cronológica: [{ key, label, items }] por mês, e `now` = índice da seção cujo início já é de hoje em diante. */
export function narrSectionsChrono(entries, todayIso) {
  const t = toDayKey(todayIso) || localIso(new Date());
  const dated = (entries || []).filter(e => toDayKey(e.d)).slice().sort(asc);
  const nodate = (entries || []).filter(e => !toDayKey(e.d));
  const months = [];
  dated.forEach(e => {
    const k = e.d.slice(0, 7);
    let m = months[months.length - 1];
    if (!m || m.key !== k) { m = { key: k, label: MESL[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4), items: [] }; months.push(m); }
    m.items.push(e);
  });
  if (nodate.length) months.push({ key: 'nodate', label: 'Sem data', items: nodate });
  /* O divisor "Hoje" entra antes do primeiro item de hoje em diante: { section, index }. */
  let nowAt = null;
  for (let si = 0; si < months.length && !nowAt; si++) {
    const idx = months[si].items.findIndex(e => toDayKey(e.d) && e.d >= t);
    if (idx >= 0) nowAt = { section: si, index: idx };
  }
  return { sections: months, nowAt };
}

/**
 * Frase-resumo (dados, não texto): prazos vencidos, prazos nos próximos 14 dias, próxima audiência, última decisão,
 * primeiro termo de prescrição à frente e o que eu fiz nos últimos 30 dias.
 */
export function narrSummary(entries, todayIso) {
  const t = toDayKey(todayIso) || localIso(new Date());
  const list = entries || [];
  const lateP = list.filter(e => e.cat === 'prazo' && e.open && toDayKey(e.d) && e.d < t).sort(asc);
  const soon = list.filter(e => e.cat === 'prazo' && e.open && toDayKey(e.d) && e.d >= t && daysBetween(t, e.d) <= 14);
  const aud = list.filter(e => e.cat === 'aud' && !e.done && toDayKey(e.d) && e.d >= t).sort(asc)[0] || null;
  const dec = list.filter(e => e.cat === 'dec' && e.big && toDayKey(e.d) && e.d <= t).sort(desc)[0] || null;
  const term = list.filter(e => e.cat === 'presc' && e.deadline && toDayKey(e.d) && e.d >= t).sort(asc)[0] || null;
  const mine = list.filter(e => e.cat === 'mine' && toDayKey(e.d) && e.d <= t);
  const m30 = mine.filter(e => daysBetween(e.d, t) <= 30);
  const kindN = (k) => m30.filter(e => e.mineKind === k).length;
  const last = mine.slice().sort(desc)[0] || null;
  const pendingRec = list.filter(e => e.cat === 'dec' && e.pending).length;
  return {
    late: { n: lateP.length, first: lateP[0] || null },
    soon: { n: soon.length },
    aud: aud ? { d: aud.d, tm: aud.tm || '', days: daysBetween(t, aud.d), title: aud.title } : null,
    decision: dec ? { d: dec.d, title: dec.title, out: dec.out || '' } : null,
    term: term ? { d: term.d, days: daysBetween(t, term.d), title: term.title } : null,
    audN: list.filter(e => e.cat === 'aud' && !e.done && toDayKey(e.d) && e.d >= t).length,
    pendingRec,
    done30: { resp: kindN('resposta'), pro: kindN('proativa'), tar: kindN('tarefa'), total: m30.length, last: last ? { d: last.d, days: daysBetween(last.d, t) } : null },
  };
}
