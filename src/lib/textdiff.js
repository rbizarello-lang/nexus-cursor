/**
 * Diferença de textos por palavras — pura, sem DOM nem React. Usada na tela "Minha atividade"
 * para mostrar, lado a lado, o texto antes e depois com o que saiu e o que entrou destacado.
 */

/** Texto puro de um trecho HTML (quebras de bloco viram quebra de linha; entidades comuns decodificadas). */
export function textdiffPlain(html) {
  return String(html == null ? '' : html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const tokens = (s) => String(s == null ? '' : s).split(/(\s+)/).filter((x) => x !== '');
const MAX_CELLS = 4e6; // limite da tabela de programação dinâmica

/**
 * Compara `a` (antes) e `b` (depois) palavra a palavra. Devolve `[{ t: 'eq' | 'del' | 'ins', s }]`,
 * com trechos vizinhos do mesmo tipo já juntados. `del` só existe no antes; `ins`, só no depois.
 * Textos muito grandes e diferentes demais caem para um bloco removido + um bloco inserido.
 */
export function diffWords(a, b) {
  const A = tokens(a), B = tokens(b);
  const out = [];
  const push = (t, s) => {
    if (!s) return;
    const last = out[out.length - 1];
    if (last && last.t === t) last.s += s; else out.push({ t, s });
  };
  let pre = 0;
  while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
  let suf = 0;
  while (suf < A.length - pre && suf < B.length - pre && A[A.length - 1 - suf] === B[B.length - 1 - suf]) suf++;
  const x = A.slice(pre, A.length - suf), y = B.slice(pre, B.length - suf);
  push('eq', A.slice(0, pre).join(''));
  const n = x.length, m = y.length;
  if (!n || !m || (n + 1) * (m + 1) > MAX_CELLS) {
    push('del', x.join('')); push('ins', y.join(''));
  } else {
    const w = m + 1;
    const L = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        L[i * w + j] = x[i] === y[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
      }
    }
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (x[i] === y[j]) { push('eq', x[i]); i++; j++; }
      else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) { push('del', x[i]); i++; }
      else { push('ins', y[j]); j++; }
    }
    while (i < n) push('del', x[i++]);
    while (j < m) push('ins', y[j++]);
  }
  push('eq', A.slice(A.length - suf).join(''));
  return out;
}

/** Lados da comparação: `before` (eq + del) e `after` (eq + ins), prontos para renderizar. */
export function diffSides(a, b) {
  const ops = diffWords(a, b);
  return {
    before: ops.filter((o) => o.t !== 'ins').map((o) => ({ s: o.s, hl: o.t === 'del' })),
    after: ops.filter((o) => o.t !== 'del').map((o) => ({ s: o.s, hl: o.t === 'ins' })),
    changed: ops.some((o) => o.t !== 'eq'),
  };
}
