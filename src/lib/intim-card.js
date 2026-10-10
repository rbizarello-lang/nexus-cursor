/**
 * Card de intimação do Nexus Prumo (lista de Intimações e Processos › Substituição), versão "R" do mockup
 * `prumo-intimacao-card-b2-extremos.html` (D1 + sigla + Geist + prazo com contagem no tooltip) — cálculos puros,
 * sem DOM nem React. Nenhum campo novo: tudo sai de className, dateStart, dateDeadline, notesList e responseAction.
 *
 *  - Sigla da classe do processo (nome completo fica no tooltip); fora do dicionário, a UI mostra o nome por extenso.
 *  - Coluna de prazo só com tempo: data final (degrau 1) e, logo abaixo, o alerta de embargos de declaração
 *    (10 dias úteis do início do prazo, 5 faixas: nada · expirado · calmo · atenção ≤ 3 du · HOJE).
 *    A contagem ("em 5 dias · 2 úteis") vai para o tooltip da data.
 *  - Orçamento de linhas das colunas Objeto (objeto + teor da decisão) e Notas, pela largura da lista.
 */
import { toDayKey, daysUntil, addBusinessDays, isBusinessDay } from './dates.js';

/** Siglas das classes processuais (chave já normalizada por `intimClassKey`). */
export const INTIM_CLS_SIGLA = {
  'incidente de desconsideracao de personalidade juridica': 'IDPJ',
  'execucao fiscal': 'EF',
  'execucao de titulo extrajudicial': 'ETE',
  'embargos a execucao fiscal': 'EEF',
  'embargos a execucao': 'EE',
  'embargos de terceiro': 'ET',
  'excecao de pre-executividade': 'EPE',
  'cumprimento de sentenca': 'CS',
  'agravo de instrumento': 'AI',
  'apelacao civel': 'AC',
  'procedimento comum civel': 'PCC',
  'recuperacao judicial': 'RJ',
  'falencia': 'FAL',
  'mandado de seguranca': 'MS',
  'medida cautelar fiscal': 'MCF',
};

/** Chave de comparação: sem acento, minúscula, espaços simples; "da/do" viram "de" (o eproc varia a preposição). */
export const intimClassKey = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim()
  .replace(/\b(da|do|das|dos)\b/g, 'de');

/** Sigla da classe, ou '' quando não há (a UI cai no nome por extenso). Classe já gravada como sigla ("IDPJ") vale como está. */
export const intimClassSigla = (className) => {
  const raw = String(className || '').trim();
  if (!raw) return '';
  if (/^[A-Z]{2,5}$/.test(raw)) return raw;
  return INTIM_CLS_SIGLA[intimClassKey(raw)] || '';
};

/** Número do processo sempre no padrão CNJ quando tem 20 dígitos (o eproc às vezes exporta só os dígitos). */
export const intimProcCnj = (num) => {
  const d = String(num || '').replace(/\D/g, '');
  if (d.length !== 20) return num || '';
  return d.slice(0, 7) + '-' + d.slice(7, 9) + '.' + d.slice(9, 13) + '.' + d.slice(13, 14) + '.' + d.slice(14, 16) + '.' + d.slice(16);
};

const _DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const _cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const _dm = (k) => k.slice(8, 10) + '/' + k.slice(5, 7);
const _dmy = (k) => _dm(k) + '/' + k.slice(0, 4);
const _pl = (n, one, many) => n + ' ' + (n === 1 ? one : many);

/** Dias úteis de hoje (exclusive) até `iso` (inclusive). */
export const bizDaysUntil = (iso, asOf) => {
  const k = toDayKey(iso);
  if (!k) return null;
  const alvo = new Date(k + 'T00:00:00');
  const d = asOf ? new Date(toDayKey(asOf) + 'T00:00:00') : new Date();
  d.setHours(0, 0, 0, 0);
  let n = 0, guard = 0;
  while (d < alvo && guard++ < 800) { d.setDate(d.getDate() + 1); if (isBusinessDay(d)) n++; }
  return n;
};

/** Tom da data final: vencida · hoje/amanhã · até 5 dias · adiante · sem prazo. */
export const intimDueTone = (dd) => {
  if (dd === null || dd === undefined) return 'none';
  if (dd < 0) return 'late';
  if (dd <= 1) return 'today';
  if (dd <= 5) return 'soon';
  return 'later';
};

/**
 * Coluna de prazo. `{ tone, txt, title }`:
 *  - resolvida (responseAction): "✓ dd/mm" verde, tooltip com a data da atuação;
 *  - sem prazo final: "prazo fechado";
 *  - aberta: "Qua 14/10" (sempre com o dia da semana) e a contagem no tooltip.
 */
export const intimPrazo = (intim, asOf) => {
  const ra = intim && intim.responseAction;
  if (ra) {
    const k = toDayKey(ra.respondedAt);
    return { tone: 'done', txt: k ? '✓ ' + _dm(k) : '✓', title: k ? 'Atuação em ' + _dmy(k) : 'Atuação registrada' };
  }
  const end = toDayKey(intim && intim.dateDeadline);
  if (!end) return { tone: 'none', txt: 'prazo fechado', title: 'Prazo ainda não aberto' };
  const dd = daysUntil(end, asOf);
  let title = 'Prazo final: ' + _dmy(end);
  if (dd > 1) title += ' · em ' + _pl(dd, 'dia', 'dias') + ' (' + _pl(bizDaysUntil(end, asOf), 'dia útil', 'dias úteis') + ')';
  else if (dd === 1) title += ' · amanhã';
  else if (dd === 0) title += ' · hoje';
  else title += ' · há ' + _pl(-dd, 'dia', 'dias');
  return { tone: intimDueTone(dd), txt: _cap(_DOW[new Date(end + 'T00:00:00').getDay()]) + ' ' + _dm(end), title };
};

/** Limite de dias úteis dos embargos de declaração, contado do início do prazo. */
export const INTIM_EMB_DU = 10;
/** Até quantos dias úteis o alerta fica em "atenção" (âmbar). */
export const INTIM_EMB_WARN_DU = 3;

/**
 * Alerta de embargos de declaração, ou null quando não se aplica (resolvida, analisada, sem início ou já expirado).
 * `{ date, du, tone: 'today' | 'warn' | 'calm', txt, aria, title }`.
 */
export const intimEmbargos = (intim, asOf) => {
  if (!intim || intim.responseAction || intim.status === 'analisado') return null;
  const start = toDayKey(intim.dateStart);
  if (!start) return null;
  const date = addBusinessDays(start, INTIM_EMB_DU);
  const dd = daysUntil(date, asOf);
  if (dd === null || dd < 0) return null;
  const du = dd === 0 ? 0 : bizDaysUntil(date, asOf);
  const tone = dd === 0 ? 'today' : du <= INTIM_EMB_WARN_DU ? 'warn' : 'calm';
  const end = toDayKey(intim.dateDeadline);
  const after = end && date > end ? ' (depois do prazo final)' : '';
  return {
    date, du, tone,
    txt: tone === 'today' ? 'Emb. HOJE' : 'Emb. ' + _dm(date),
    aria: 'Embargos de declaração ' + (tone === 'today' ? 'vencem hoje' : 'até ' + _dm(date) + ', ' + _pl(du, 'dia útil', 'dias úteis')),
    title: 'Embargos de declaração até ' + _dmy(date) + ' (' + (tone === 'today' ? 'hoje' : _pl(du, 'dia útil', 'dias úteis')) + ')' + after,
  };
};

/**
 * Orçamento de linhas pela largura da lista (px): caracteres por linha (cpl) e linhas totais das colunas
 * Objeto (Tr) e Notas (Nt). Mesmas faixas do CSS (container queries): ≥ 1480 as duas zonas lado a lado,
 * 860–1479 empilhadas, < 860 celular.
 */
export const intimCardLayout = (W) => {
  const w = Number(W) || 0;
  if (w >= 1480) {
    // id 290 · objeto 1,25fr · notas 1fr · sinais 118 · prazo 88; fonte 12px ≈ 5,9 px/char, notas 11,5px ≈ 5,6 (+12 do marcador)
    const av = w - 28 - 290 - 118 - 88;
    return { mode: 'wide', cplTr: Math.max(20, Math.floor((av * 1.25 / 2.25 - 36) / 5.9)), cplNt: Math.max(20, Math.floor((av / 2.25 - 48) / 5.6)), budTr: 4, budNt: 4 };
  }
  if (w >= 860) {
    const c3 = w - 28 - 260 - 110 - 84 - 36;
    return { mode: 'mid', cplTr: Math.max(20, Math.floor(c3 / 5.9)), cplNt: Math.max(20, Math.floor((c3 - 12) / 5.6)), budTr: 3, budNt: 3 };
  }
  const c = w - 28 - 28 - 20;
  return { mode: 'mob', cplTr: Math.max(20, Math.floor(c / 5.9)), cplNt: Math.max(20, Math.floor((c - 12) / 5.6)), budTr: 4, budNt: 3 };
};

const _lines = (t, cpl, max) => Math.min(max, Math.max(1, Math.ceil(String(t || '').length / cpl)));

/** Linhas do objeto (até 2) e do teor da decisão (1 a 3, no que sobrar do orçamento). */
export const intimTribLines = (obj, teor, cpl, budget) => {
  const ol = _lines(obj || 'Objeto não definido', cpl, 2);
  if (!teor) return { ol, tl: 0 };
  return { ol, tl: Math.max(1, Math.min(_lines(teor, cpl, 3), budget - ol)) };
};

/**
 * Notas que cabem no orçamento, das mais recentes (fim da lista) para trás. Nota única pode ter até 3 linhas;
 * com várias, até 2 cada. Se sobrar nota de fora, reserva uma linha para "+N notas anteriores".
 * `{ shown: [{ t, l }], rest }` — `shown` em ordem cronológica.
 */
export const intimNotesFit = (notes, cpl, budget) => {
  const list = (notes || []).map(n => String(n == null ? '' : n)).filter(n => n.trim());
  if (!list.length) return { shown: [], rest: 0 };
  const cap = list.length === 1 ? 3 : 2;
  const pick = (b) => {
    const out = [];
    let used = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      let l = _lines(list[i], cpl, cap);
      if (used + l > b) { if (out.length) break; l = Math.max(1, b); }
      out.unshift({ t: list[i], l });
      used += l;
    }
    return { shown: out, rest: list.length - out.length };
  };
  const r = pick(budget);
  return r.rest ? pick(budget - 1) : r;
};
