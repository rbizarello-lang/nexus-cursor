/**
 * Estado recolher/expandir dos cartões do Nexus Prumo — lógica pura, sem DOM nem React.
 *
 * Formato guardado no navegador (localStorage 'nexus.cxFold'):  { [escopo]: { [idDoCartão]: true | false } }
 *   true  = recolhido;  false = aberto de propósito (só importa para cartão que nasce fechado);
 *   ausente = vale o padrão do cartão (`defaultOpen`, normalmente aberto).
 * Só apresentação: nunca entra nos dados da carteira.
 *
 * Migração única das chaves antigas (cada tela tinha o seu idioma):
 *   nexus.cxPanelFold   → JSON ["ops","presc",…]        ids recolhidos do Painel          → escopo 'painel'
 *   nexus_cx_bf_cards   → JSON {evento,notas,efs: bool}  true = ABERTO (padrão); false = recolhido → escopo 'briefing'
 *   nexus_cx_hz_folded  → '1' | '0'                      Horizonte recolhido               → escopo 'visao', id 'hz'
 * (Os cartões de Processos e prescrição não eram persistidos; começam como antes: Embargos e Outros fechados.)
 * Depois de migrar, as chaves antigas deixam de ser lidas (ficam no disco, sem efeito).
 */
export const FOLD_KEY = 'nexus.cxFold';
export const FOLD_LEGACY_KEYS = { painel: 'nexus.cxPanelFold', briefing: 'nexus_cx_bf_cards', horizonte: 'nexus_cx_hz_folded' };

const foldIsObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Lê o JSON guardado; qualquer coisa fora do formato { escopo: { id: boolean } } é descartada. */
export function foldParse(raw) {
  let parsed = null;
  try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { parsed = null; }
  const out = {};
  if (!foldIsObj(parsed)) return out;
  Object.keys(parsed).forEach((scope) => {
    if (!foldIsObj(parsed[scope])) return;
    const ids = {};
    Object.keys(parsed[scope]).forEach((id) => { if (typeof parsed[scope][id] === 'boolean') ids[id] = parsed[scope][id]; });
    if (Object.keys(ids).length) out[scope] = ids;
  });
  return out;
}

/** O cartão está aberto? `defaultOpen` vale enquanto não houver escolha guardada. */
export function foldIsOpen(state, scope, id, defaultOpen = true) {
  const v = state && state[scope] ? state[scope][id] : undefined;
  return v === undefined ? defaultOpen !== false : !v;
}

/** Novo estado com um cartão recolhido (true) ou aberto (false). Não altera o original. */
export function foldSet(state, scope, id, collapsed) {
  return { ...state, [scope]: { ...(state && state[scope]), [id]: !!collapsed } };
}

/** Novo estado com vários cartões do mesmo escopo no mesmo estado (recolher tudo / expandir tudo). */
export function foldSetAll(state, scope, ids, collapsed) {
  const next = { ...(state && state[scope]) };
  (ids || []).forEach((id) => { next[id] = !!collapsed; });
  return { ...state, [scope]: next };
}

/**
 * Converte as chaves antigas (strings cruas do localStorage, ou null) para o formato novo.
 * Não sobrescreve o que o estado novo já tenha. Valores ilegíveis são ignorados.
 */
export function foldMigrateLegacy(state, legacy) {
  let next = { ...(state || {}) };
  const L = legacy || {};
  const put = (scope, id, collapsed) => {
    if (next[scope] && next[scope][id] !== undefined) return;
    next = foldSet(next, scope, id, collapsed);
  };
  if (L.painel) {
    let arr = null;
    try { arr = JSON.parse(L.painel); } catch (e) { arr = null; }
    if (Array.isArray(arr)) arr.forEach((id) => { if (typeof id === 'string' && id) put('painel', id, true); });
  }
  if (L.briefing) {
    let obj = null;
    try { obj = JSON.parse(L.briefing); } catch (e) { obj = null; }
    if (foldIsObj(obj)) Object.keys(obj).forEach((id) => { if (obj[id] === false) put('briefing', id, true); });
  }
  if (L.horizonte === '1') put('visao', 'hz', true);
  return next;
}
