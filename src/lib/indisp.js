/**
 * Indisponibilidade de bens — métrica principal do Nexus Prumo (sem DOM nem React).
 *
 * "Indisponível" = bens com status `indisponibilidade_ativa` OU `indisponibilidade_requerida` (juntos, um só arco),
 * somando só `value > 0`, contra a dívida (CDAs não extintas) do mesmo escopo. O "garantido (CDA)" é outra coisa
 * (CDAs com status garantida) e não entra aqui.
 */

export const INDISP_STATUS_ATIVA = 'indisponibilidade_ativa';
export const INDISP_STATUS_REQUERIDA = 'indisponibilidade_requerida';

const ipVal = (a) => (a && Number(a.value) > 0 ? Number(a.value) : 0);
const ipFmtNum = (n, dec) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

/**
 * @param {Array<{status?:string, value?:number}>} assets bens do escopo (a função filtra pelo status)
 * @param {number} debtTotal dívida (CDAs não extintas) do mesmo escopo
 * @returns {{ativaVal:number, reqVal:number, totalVal:number, ativaN:number, reqN:number, n:number, semValorN:number,
 *   ratio:number|null, pct:number|null, over:boolean, kind:'sem_bens'|'sem_avaliacao'|'valor'}}
 */
export function indispStats(assets, debtTotal) {
  let ativaVal = 0, reqVal = 0, ativaN = 0, reqN = 0, semValorN = 0;
  (assets || []).forEach(a => {
    if (!a) return;
    const isA = a.status === INDISP_STATUS_ATIVA;
    const isR = a.status === INDISP_STATUS_REQUERIDA;
    if (!isA && !isR) return;
    const v = ipVal(a);
    if (isA) { ativaN++; ativaVal += v; } else { reqN++; reqVal += v; }
    if (!v) semValorN++;
  });
  const n = ativaN + reqN;
  const totalVal = ativaVal + reqVal;
  const debt = Number(debtTotal) > 0 ? Number(debtTotal) : 0;
  const ratio = debt > 0 ? totalVal / debt : null;
  const pct = ratio === null ? null : Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const kind = n === 0 ? 'sem_bens' : totalVal <= 0 ? 'sem_avaliacao' : 'valor';
  return { ativaVal, reqVal, totalVal, ativaN, reqN, n, semValorN, ratio, pct, over: ratio !== null && ratio >= 1, kind };
}

/** "47% da dívida" · "2,6× a dívida" (1 casa decimal com vírgula quando a razão chega a 1×) · null sem razão. */
export function indispRatioText(ratio) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return null;
  if (ratio >= 1) return ipFmtNum(ratio, 1) + '× a dívida';
  return Math.round(ratio * 100) + '% da dívida';
}

/** "R$ 1,2 mi ativa · R$ 300 mil requerida" (só as partes com valor); `money` formata o valor. */
export function indispSplitText(s, money) {
  if (!s) return '';
  const fmt = typeof money === 'function' ? money : (v) => String(v);
  const parts = [];
  if (s.ativaVal > 0) parts.push(fmt(s.ativaVal) + ' ativa');
  if (s.reqVal > 0) parts.push(fmt(s.reqVal) + ' requerida');
  return parts.join(' · ');
}

/** Diferença em pontos percentuais contra a carteira; só quando as duas pontas existem e |Δ| ≥ 1. */
export function indispDeltaPp(pctOp, pctCart) {
  if (pctOp === null || pctOp === undefined || pctCart === null || pctCart === undefined) return null;
  const d = pctOp - pctCart;
  if (Math.abs(d) < 1) return null;
  return { txt: (d > 0 ? '+' : '−') + Math.abs(d) + ' p.p. vs. carteira', dir: d > 0 ? 'up' : 'down', tone: d > 0 ? 'good' : 'bad' };
}
