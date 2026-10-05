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
