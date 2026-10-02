/**
 * Histórico de navegação interno do Nexus Prumo (botão "← Voltar") — lógica pura, sem DOM nem React.
 *
 * O app navega por estado do React dentro de um iframe do Apps Script, então o botão Voltar do navegador
 * não serve. Uma entrada do histórico é a "foto" do que o usuário percebe como uma tela:
 *   vm      — viewMode (hoje, operacoes, operation, prazos, cx_timeline, …)
 *   op, tab — operação ativa e aba (só quando vm === 'operation')
 *   tlOp, tlMode — Linha do tempo: operação e modo (Panorama / Frentes / Prescrição / Narrativa)
 *   prazos  — Prazos extintivos: 'mesa' | 'relogios' | 'lista'
 *   insc    — aba Inscrições da operação: 'tabela' | 'relogios'
 *   intim   — Intimações: 'lista' | 'foco'
 * Campos que não se aplicam à tela viram null, para que mexer num deles (ex.: o modo da Linha do tempo)
 * não gere entradas fantasma em outra tela. Gavetas e painéis laterais não são entradas.
 *
 * A pilha guarda as telas ANTERIORES à atual (a atual vive fora dela): navegar empilha a tela que ficou para
 * trás; voltar desempilha. Pilha imutável, no máximo NH_MAX entradas (as mais antigas caem), só em memória.
 */
export const NH_MAX = 20;
export const NH_TL_MODES = { panorama: 'Panorama', frentes: 'Frentes', prescricao: 'Prescrição', narrativa: 'Narrativa' };
export const NH_PRAZOS_VIEWS = { mesa: 'Mesa', relogios: 'Relógios', lista: 'Lista' };
export const NH_INSC_VIEWS = { tabela: 'Tabela', relogios: 'Relógios' };
export const NH_VIEW_LABELS = {
  hoje: 'Hoje', cx_timeline: 'Linha do tempo', intimacoes: 'Intimações', tarefas_global: 'Tarefas', mesa: 'Mesa de intimações',
  operacoes: 'Carteira', prazos: 'Prazos extintivos', audiencias: 'Agenda', acompanhar: 'Acompanhar', modelos: 'Biblioteca', painel: 'Painel',
};
/** Aba da operação que tem a visão Tabela/Relógios (Inscrições). */
export const NH_INSC_TAB = 'dividas';

const nhPick = (map, v, dflt) => (Object.prototype.hasOwnProperty.call(map, v) ? v : dflt);

/**
 * Foto normalizada a partir do estado bruto do app:
 * { viewMode, activeOpId, activeTab, tlOp, tlMode, prazosDeskMode, prazosView, inscView, intimView }.
 */
export function nhSnapshot(s) {
  const o = s || {};
  const vm = o.viewMode || 'hoje';
  const inOp = vm === 'operation';
  const insc = inOp && o.activeTab === NH_INSC_TAB;
  return {
    vm,
    op: inOp ? (o.activeOpId || null) : null,
    tab: inOp ? (o.activeTab || null) : null,
    tlOp: vm === 'cx_timeline' ? (o.tlOp || null) : null,
    tlMode: vm === 'cx_timeline' ? nhPick(NH_TL_MODES, o.tlMode, 'panorama') : null,
    prazos: vm === 'prazos' ? (o.prazosDeskMode === 'lista' ? 'lista' : (o.prazosView === 'relogios' ? 'relogios' : 'mesa')) : null,
    insc: insc ? nhPick(NH_INSC_VIEWS, o.inscView, 'tabela') : null,
    intim: vm === 'intimacoes' ? (o.intimView === 'foco' ? 'foco' : 'lista') : null,
  };
}

/** Chave de igualdade de duas fotos. */
export function nhKey(e) {
  if (!e) return '';
  return [e.vm, e.op, e.tab, e.tlOp, e.tlMode, e.prazos, e.insc, e.intim].map(x => (x == null ? '' : String(x))).join('|');
}
export const nhSame = (a, b) => nhKey(a) === nhKey(b);

/** Empilha `entry` (a tela que ficou para trás). Ignora vazio e duplicata consecutiva; mantém só as `max` mais recentes. */
export function nhPush(stack, entry, max = NH_MAX) {
  const st = Array.isArray(stack) ? stack : [];
  if (!entry) return st;
  if (st.length && nhSame(st[st.length - 1], entry)) return st;
  const next = st.concat([entry]);
  return next.length > max ? next.slice(next.length - max) : next;
}

/** Desempilha: { stack, entry } — entry é null se a pilha estava vazia. */
export function nhPop(stack) {
  const st = Array.isArray(stack) ? stack : [];
  if (!st.length) return { stack: st, entry: null };
  return { stack: st.slice(0, -1), entry: st[st.length - 1] };
}

export const nhPeek = (stack) => (Array.isArray(stack) && stack.length ? stack[stack.length - 1] : null);

/**
 * Rótulo do destino ("Hoje", "Agro Horizonte · Briefing", "Linha do tempo · Narrativa"…).
 * ctx: { opName(id) → string, tabLabel(tab) → string } — ambos opcionais.
 */
export function nhLabel(e, ctx) {
  if (!e) return '';
  const c = ctx || {};
  if (e.vm === 'operation') {
    const name = (c.opName && e.op ? c.opName(e.op) : '') || 'Operação';
    const tab = e.tab ? ((c.tabLabel && c.tabLabel(e.tab)) || e.tab) : '';
    const parts = [name, tab];
    if (e.insc) parts.push(NH_INSC_VIEWS[e.insc]);
    return parts.filter(Boolean).join(' · ');
  }
  const base = NH_VIEW_LABELS[e.vm] || 'NEXUS';
  if (e.vm === 'cx_timeline') {
    const name = c.opName && e.tlOp ? c.opName(e.tlOp) : '';
    return [base, name, NH_TL_MODES[e.tlMode || 'panorama']].filter(Boolean).join(' · ');
  }
  if (e.vm === 'prazos') return base + ' · ' + NH_PRAZOS_VIEWS[e.prazos || 'mesa'];
  if (e.vm === 'intimacoes' && e.intim === 'foco') return base + ' · Foco';
  return base;
}
