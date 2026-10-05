/**
 * Registro de temas do Nexus Prumo (uiEdition 'claude') — puro, sem DOM nem React.
 * A chave '' é o Ardósia (padrão, claro). Os temas escuros ganham CSS em fase posterior.
 */
export const CX_THEMES = [
  { key: '', label: 'Ardósia', scheme: 'light' },
  { key: 'noite', label: 'Noite', scheme: 'dark' },
  { key: 'grafite', label: 'Grafite', scheme: 'dark' },
];

/** Valida uma chave vinda do localStorage: devolve a chave se existir no registro, senão '' (Ardósia). */
export function cxThemeKey(v) {
  return typeof v === 'string' && CX_THEMES.some(t => t.key === v) ? v : '';
}

/** Classe CSS aplicada ao .app-layout para a chave (Ardósia não tem classe). */
export function cxThemeClass(key) {
  const k = cxThemeKey(key);
  return k ? 'cx-theme-' + k : '';
}

/**
 * Cores de operação gravadas (op.color: as 5 amostras do modal "Editar operação", valores de Ardósia).
 * Só na exibição, no Prumo, viram o token da cor de situação do tema ativo; o dado gravado não muda.
 * Qualquer outro valor (ou vazio) passa direto.
 */
const CX_OP_COLOR_TOKENS = {
  '#c2323d': 'var(--cx-opc-maxima)',
  '#e0707a': 'var(--cx-opc-alta)',
  '#c99a1a': 'var(--cx-opc-media)',
  '#21845a': 'var(--cx-opc-baixa)',
  '#2d62d3': 'var(--cx-opc-parcel)',
};
export function cxMapOpColor(color) {
  if (typeof color !== 'string') return color;
  const k = color.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(CX_OP_COLOR_TOKENS, k) ? CX_OP_COLOR_TOKENS[k] : color;
}
