/* ═══════════════════════════════════════════════════════════════════════════
   Nexus Prumo (uiEdition 'claude', tema Ardósia) — Fases 1 a 5
   Casca nova (menu lateral + barra superior), Hoje e Intimações (lista, quadro,
   foco e gaveta); Carteira, Visão geral da operação, Linha do tempo e Mesa de
   prazos extintivos (Fase 2); Tarefas, Agenda e Mesa de trabalho (Fase 3);
   cabeçalho da operação para as abas do app e aba Partes e bens (Fase 4);
   Acompanhar e Painel (Fase 5). Lê e grava os MESMOS dados do App (props); não tem estado de
   dados próprio. Telas ainda não redesenhadas continuam vindo do App.
   Concatenado ANTES de src/app.jsx pelo scripts/build.mjs — só declarações de
   função e constantes; helpers do app (daysUntil, INTIM_STATUSES…) são usados
   apenas em tempo de render.
   ═══════════════════════════════════════════════════════════════════════════ */

const CX_ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.8-5"/>',
  tick: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  desk: '<path d="M3 7h18"/><path d="M5 7v13M19 7v13"/><path d="M8 3h8l1 4H7z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  scale: '<path d="M12 3v18"/><path d="M7 21h10"/><path d="M4 7h16"/><path d="M4 7l-2.5 6a3 3 0 0 0 5 0z"/><path d="M20 7l-2.5 6a3 3 0 0 0 5 0z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  chevU: '<path d="m18 15-6-6-6 6"/>',
  expandAll: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  collapseAll: '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
  arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  gavel: '<path d="m14.5 12.5-8 8a2.12 2.12 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  board: '<rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/>',
  note: '<path d="M4 4h16v11l-5 5H4z"/><path d="M15 20v-5h5"/><path d="M8 9h8M8 13h4"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',
  timeline: '<path d="M3 6h9M3 12h14M3 18h6"/><circle cx="15" cy="6" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="12" cy="18" r="2"/>',
  bold: '<path d="M7 4h6a4 4 0 0 1 0 8H7z"/><path d="M7 12h7a4 4 0 0 1 0 8H7z"/>',
  italic: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
  listOl: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M3.5 5.5 5 4.5V9M3.5 14.5c0-1 3-1 3 .6 0 1-3 2.4-3 3.4h3"/>',
  pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M3 21v-5h5M21 3v5h-5"/>',
};
function CxIcon({ n, s = 16, className = '', style }) {
  return <svg className={'cx-i ' + className} width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" style={style} dangerouslySetInnerHTML={{ __html: CX_ICONS[n] || '' }} />;
}

function DocsPieceGlyph() {
  return <svg className="nx-piece-glyph" width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M37 45H11a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h19l10 10v29a3 3 0 0 1-3 3z" />
    <path fill="#A8C7FA" d="M30 3v9a1 1 0 0 0 1 1h9z" />
    <path fill="#fff" d="M15 23h18v2.2H15zm0 5h18v2.2H15zm0 5h12v2.2H15z" />
  </svg>;
}

/** Texto da nota de atuação e, se houver peça, o ícone que abre o documento. */
function AtuacaoNoteView({ text, url }) {
  return <>
    {text}
    {url ? <>{' / Peça: '}<a className="nx-piece-link" href={url} target="_blank" rel="noopener noreferrer" title="Abrir peça" aria-label="Abrir peça" onClick={e => e.stopPropagation()}><DocsPieceGlyph /></a></> : null}
  </>;
}

function renderProcessNote(note, linkify) {
  const raw = typeof note === 'string' ? note : ((note && (note.text || note.content || note.body)) || '');
  const atu = presentAtuacaoProcessNote(raw);
  if (atu) return <AtuacaoNoteView text={atu.text} url={atu.url} />;
  return linkify ? linkify(raw) : raw;
}

/* ─── Helpers de leitura (não gravam nada) ─── */
const CX_DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const CX_DOW_L = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const CX_MES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const CX_ST_ORDER = ['pendente_analise', 'em_analise', 'aguardando_subsidios', 'analise_concluida', 'peca_edicao', 'analisado'];
const CX_ST = {
  pendente_analise: { l: 'Pendente de análise', c: 'var(--cx-yellow)' },
  em_analise: { l: 'Em análise', c: 'var(--cx-violet)' },
  analise_concluida: { l: 'Análise concluída', c: 'var(--cx-green)' },
  aguardando_subsidios: { l: 'Aguardando subsídios', c: 'var(--cx-ink-3)' },
  peca_edicao: { l: 'Peça em edição', c: 'var(--cx-blue)' },
  peca_pronta: { l: 'Peça pronta', c: 'var(--cx-green)' },
  analisado: { l: 'Analisado', c: 'var(--cx-green)' },
};
const CX_IMP = { alta: 'Alta', normal: 'Média', baixa: 'Baixa' };
const CX_DIF = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const CX_HEARING = { instrucao: 'Audiência de instrução', conciliacao: 'Audiência de conciliação', una: 'Audiência una', justificacao: 'Audiência de justificação', inquiricao: 'Inquirição', outra: 'Audiência' };
const CX_OP_COLORS = ['var(--cx-op1)', 'var(--cx-op2)', 'var(--cx-op3)', 'var(--cx-op4)', 'var(--cx-op5)', 'var(--cx-op6)'];
const CX_OP_TABS = [['prescricao_v2', 'Processos e prescrição'], ['dividas', 'Inscrições'], ['pessoas', 'Partes'], ['bens', 'Bens'], ['tarefas', 'Tarefas'], ['docs', 'Arquivos'], ['importar', 'Importar']];
const SUBSTITUICAO_OP_ID = 'op-substituicao';
function isSubstituicaoOp(op) {
  return !!(op && (op.id === SUBSTITUICAO_OP_ID || op.kind === 'substituicao'));
}
function intimDaSubstituicao(x) {
  return !!(x && x.operationId === SUBSTITUICAO_OP_ID);
}
function substituicaoOpRecord() {
  return {
    id: SUBSTITUICAO_OP_ID,
    name: 'EM SUBSTITUIÇÃO',
    description: 'Feitos no lugar de outro procurador.',
    status: 'ativa',
    kind: 'substituicao',
    createdAt: '2026-10-06T00:00:00.000Z'
  };
}
/* Partes e Bens são abas independentes (antes, uma aba só com seletor interno). */
/* 'notas' (antiga aba Briefing) virou parte da Visão geral: no Prumo é só um apelido de 'visao'. */
function cxTabOn(activeTab, key) { return activeTab === key || (key === 'visao' && activeTab === 'notas'); }

/* Registro global de operações por id, atualizado a cada render do App (ver app.jsx, perto de
   `opsById`). Permite que cxOpColor/CxOpSquare recebam só o id em telas que não têm o objeto
   operação à mão, sem precisar passar opsById por toda a árvore. */
let CX_OPS_REGISTRY = null;
function cxSetOpsRegistry(map) { CX_OPS_REGISTRY = map; }
function cxResolveOp(opOrId) {
  if (opOrId && typeof opOrId === 'object') return opOrId;
  if (!opOrId) return null;
  return (CX_OPS_REGISTRY && CX_OPS_REGISTRY.get) ? (CX_OPS_REGISTRY.get(opOrId) || null) : null;
}
function cxOpColorHash(id) {
  let h = 0;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CX_OP_COLORS[h % CX_OP_COLORS.length];
}
/* Cor do quadradinho da operação: manual (op.color) > parcelamento ativo > prioridade > cinza.
   Aceita o objeto operação ou (se só o id estiver à mão) resolve pelo registro; sem registro,
   cai no hash antigo por id, só para não quebrar telas que ainda não foram atualizadas. */
function cxOpColor(opOrId) {
  const op = cxResolveOp(opOrId);
  if (!op) return cxOpColorHash(opOrId);
  if (op.color) return cxMapOpColor(op.color);
  const cls = getOpClassifications(op);
  if (cls.includes('parcelamento_parcial') || cls.includes('parcelamento_integral') || op.opCategory === 'parcelada') return 'var(--cx-opc-parcel)';
  if (!op.priority) return 'var(--cx-opc-none)';
  const k = normalizeOpPriority(op.priority);
  if (k === 'maxima') return 'var(--cx-opc-maxima)';
  if (k === 'alta') return 'var(--cx-opc-alta)';
  if (k === 'baixa') return 'var(--cx-opc-baixa)';
  return 'var(--cx-opc-media)';
}
/* Operações "novas" (classificação 'novas' ou opCategory 'nova') ganham um anel em torno do quadradinho. */
function cxOpIsNew(op) {
  if (!op) return false;
  return getOpClassifications(op).includes('novas') || op.opCategory === 'nova';
}
/* Quadradinho colorido da operação, com anel para operações novas. Aceita o objeto (`op`) ou,
   quando só o id estiver disponível, `opId` (resolvido pelo registro quando possível). */
function CxOpSquare({ op, opId, size = 9, className = 'cx-op-sq', title }) {
  const resolved = op || cxResolveOp(opId);
  if (!resolved && !opId) return <span className={className} style={{ width: size, height: size, background: 'var(--cx-line-strong)' }} title={title} />;
  const isNew = cxOpIsNew(resolved);
  const style = { width: size, height: size, background: cxOpColor(resolved || opId) };
  if (isNew) { style.outline = '2px solid var(--cx-violet)'; style.outlineOffset = '1.5px'; }
  return <span className={className} style={style} title={title !== undefined ? title : (isNew ? 'Nova' : undefined)} />;
}
function cxOpName(op) { const n = (op && op.name) || ''; return n.replace(/^Opera[çc][ãa]o\s+/i, '') || n; }
function cxCap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function cxDate(iso) { const k = toDayKey(iso); return k ? new Date(k + 'T00:00:00') : null; }
function cxDM(iso) { const d = cxDate(iso); return d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') : '—'; }
function cxDue(dd, iso) {
  if (dd === null || dd === undefined) return { tone: 'none', txt: 'sem prazo' };
  if (dd < -1) return { tone: 'late', txt: 'há ' + (-dd) + 'd' };
  if (dd === -1) return { tone: 'late', txt: 'Ontem' };
  if (dd === 0) return { tone: 'today', txt: 'Hoje' };
  if (dd === 1) return { tone: 'today', txt: 'Amanhã' };
  const d = cxDate(iso);
  if (dd <= 5 && d) return { tone: 'soon', txt: cxCap(CX_DOW[d.getDay()]) + ' ' + cxDM(iso) };
  return { tone: 'later', txt: cxDM(iso) };
}
function cxBizUntil(iso) {
  const alvo = cxDate(iso);
  if (!alvo) return null;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  let n = 0, guard = 0;
  while (d < alvo && guard++ < 800) { d.setDate(d.getDate() + 1); if (isBusinessDay(d)) n++; }
  return n;
}
function cxRelTime(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return 'há ' + min + ' min';
  const h = Math.round(min / 60);
  if (h < 24) return 'há ' + h + ' h';
  const d = Math.round(h / 24);
  if (d === 1) return 'ontem';
  return 'há ' + d + ' dias';
}
function cxMoneyShort(v) {
  v = v || 0;
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' bi';
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mi';
  if (v >= 1e3) return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  return fmtCur(v);
}
/* Horizonte de um termo em dias: "em 70 dias", "hoje", "há 4 dias" (acima de 2 anos, em anos, como a Mesa). */
function cxHorizonTxt(days) {
  const n = Number(days);
  if (days == null || !Number.isFinite(n)) return '';
  if (Math.abs(n) > 730) return formatPrescHorizon(n);
  if (n < 0) return 'há ' + cxPl(-n, 'dia', 'dias');
  if (n === 0) return 'hoje';
  return 'em ' + cxPl(n, 'dia', 'dias');
}
function cxPl(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function cxNorm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
/* Mesma regra do card clássico: parte adversa, nunca a Fazenda/União. */
function cxPartyName(intim) {
  const name = intim.partyName || '';
  if (name && !name.toUpperCase().includes('FAZENDA') && !name.toUpperCase().includes('UNIÃO')) return name;
  const parts = (intim.parties || '').split(/\s+X\s+/i);
  for (const p of parts) {
    if (p && !p.toUpperCase().includes('FAZENDA') && !p.toUpperCase().includes('UNIÃO')) {
      return p.replace(/^(Executado|Embargante|Autor|Réu|Requerido|Requerente|Exequente|Embargado|Impetrante)\s+/i, '').replace(/\(.*/, '').trim() || '—';
    }
  }
  return intim.processNumber || '—';
}
function cxNotes(intim) {
  return intim.notesList && intim.notesList.length > 0 ? intim.notesList : [intim.obs1, intim.obs2].filter(Boolean);
}
const cxIsActive = (x) => !x.responseAction;
const cxIsOpen = (x) => !x.responseAction && x.status !== 'analisado';

/* ─── Objeto da intimação: definido pelo usuário > eventDescription (se não for o texto
   genérico da importação do eproc) > indefinido. Usado no lugar do eventDescription cru em
   todo subtítulo de intimação no Prumo. ─── */
const CX_OBJ_GENERIC_RE = /expedida\s*\/?\s*certificada|intima[çc][aã]o eletr[oô]nica/i;
function cxIntimObjeto(intim) {
  if (!intim) return null;
  if (intim.object) return intim.object;
  const ev = intim.eventDescription;
  if (ev && !CX_OBJ_GENERIC_RE.test(ev)) return ev;
  return null;
}
const CX_OBJ_UNDEF_TXT = 'Objeto não definido';
function cxIntimObjetoText(intim) { return cxIntimObjeto(intim) || CX_OBJ_UNDEF_TXT; }
/* Subtítulo somente-leitura (lista, quadro, foco, Hoje, Mesa, Visão geral, Agenda). */
function CxObj({ intim }) {
  const v = cxIntimObjeto(intim);
  return v ? v : <span className="cx-obj-undef">{CX_OBJ_UNDEF_TXT}</span>;
}

/* ─── Intimações por tribunal: mesmos números dos cartões do Clássico/Beta ───
   (app.jsx, tela de intimações: conta intimações ativas — !intimIsClosed —,
   abertas = com dateDeadline, fechadas = sem dateDeadline.) */
const CX_TRIB_NAMES = { PR: 'TRF4 · Paraná', RS: 'TRF4 · Rio Grande do Sul', SC: 'TRF4 · Santa Catarina' };
function cxTribCounts(items, opF) {
  const by = {};
  (items || []).forEach(x => {
    if (intimIsClosed(x)) return;
    if (opF && (opF === 'none' ? !!x.operationId : opF !== 'all' && x.operationId !== opF)) return;
    const j = x.jurisdiction || '?';
    if (!by[j]) by[j] = { total: 0, abertos: 0, fechados: 0 };
    by[j].total++;
    if (x.dateDeadline) by[j].abertos++; else by[j].fechados++;
  });
  return Object.entries(by).sort((a, b) => (jurisRank(a[0]) - jurisRank(b[0])) || a[0].localeCompare(b[0]));
}
function cxAttention(a, b) {
  const ua = intimIsUrgent(a) ? 0 : 1, ub = intimIsUrgent(b) ? 0 : 1; if (ua !== ub) return ua - ub;
  const ia = intimImpOrder(a), ib = intimImpOrder(b); if (ia !== ib) return ia - ib;
  const da = intimDifOrder(a), db = intimDifOrder(b); if (da !== db) return da - db;
  return cxByDeadline(a, b);
}
function cxByDeadline(a, b) {
  if (!a.dateDeadline && !b.dateDeadline) return 0;
  if (!a.dateDeadline) return 1;
  if (!b.dateDeadline) return -1;
  return String(toDayKey(a.dateDeadline)).localeCompare(String(toDayKey(b.dateDeadline)));
}
function cxSortFn(k) {
  if (k === 'prazo') return cxByDeadline;
  if (k === 'importancia') return (a, b) => (intimImpOrder(a) - intimImpOrder(b)) || cxByDeadline(a, b);
  if (k === 'complexidade') return (a, b) => (intimDifOrder(a) - intimDifOrder(b)) || cxByDeadline(a, b);
  return cxAttention;
}
/* Pequeno aviso passageiro compartilhado pelas telas novas. */
function cxNotify(msg) { try { window.dispatchEvent(new CustomEvent('cx-toast', { detail: msg })); } catch (e) { /* ignore */ } }
function cxCopy(text) {
  copyText(text);
  cxNotify('Copiado: ' + text);
}
function CxNumCopy({ value, children }) {
  return <button type="button" className="cx-proc-copy" title="Copiar número" onClick={e => { e.stopPropagation(); if (value) cxCopy(value); }}>{children}</button>;
}
/* Dica flutuante única (reaproveita o visual .cx-tl-tip). Fica dentro do app (herda os tokens do tema) e em posição fixa,
   então não é cortada por tabelas com rolagem. `d` = { when, title, lines, tone }. */
let CX_HINT_EL = null;
function cxHintHide() { if (CX_HINT_EL) CX_HINT_EL.style.display = 'none'; }
function cxHintShow(target, d) {
  if (!target || !d || typeof document === 'undefined') return;
  const host = (target.closest && target.closest('.app-layout')) || document.body;
  if (!CX_HINT_EL || CX_HINT_EL.parentNode !== host) {
    if (CX_HINT_EL && CX_HINT_EL.parentNode) CX_HINT_EL.parentNode.removeChild(CX_HINT_EL);
    CX_HINT_EL = document.createElement('div');
    CX_HINT_EL.className = 'cx-tl-tip cx-hint';
    CX_HINT_EL.setAttribute('role', 'tooltip');
    host.appendChild(CX_HINT_EL);
  }
  const el = CX_HINT_EL;
  el.textContent = '';
  const add = (cls, txt) => { if (!txt) return; const n = document.createElement('div'); n.className = cls; n.textContent = txt; el.appendChild(n); };
  add('cx-tl-tip-w' + (d.tone ? ' ' + d.tone : ''), d.when);
  add('cx-tl-tip-t', d.title);
  (d.lines || []).forEach(l => add('cx-tl-tip-s', l));
  el.style.visibility = 'hidden'; el.style.display = 'block';
  const r = target.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  el.style.left = left + 'px'; el.style.top = top + 'px'; el.style.visibility = '';
}
/* Props de dica (mouse e teclado) para qualquer elemento: `get()` devolve { when, title, lines, tone }. */
function cxHintProps(get) {
  return {
    onMouseEnter: (e) => cxHintShow(e.currentTarget, get()),
    onMouseLeave: cxHintHide,
    onFocus: (e) => cxHintShow(e.currentTarget, get()),
    onBlur: cxHintHide,
  };
}
/* Número do processo copiável: o próprio número é o alvo (sem ícone). Copia COM máscara; o clique não propaga
   (não expande linha nem abre gaveta). Dica "Clique para copiar" → "Copiado ✓". */
function CxCopyNum({ num, className = '' }) {
  const tRef = React.useRef(null);
  const ref = React.useRef(null);
  React.useEffect(() => () => { clearTimeout(tRef.current); }, []);
  const value = String(num || '').trim();
  if (!value) return <span className="cx-copynum cx-copynum-empty">—</span>;
  const m = /^(\d{7}-\d{2})(\.\d{4}\.\d\.\d{2}\.\d{4})$/.exec(value);
  const doCopy = (e) => {
    e.stopPropagation();
    if (e.type === 'keydown') e.preventDefault();
    try { copyText(value); } catch (err) { /* ignore */ }
    const el = ref.current || e.currentTarget;
    cxHintShow(el, { title: 'Copiado ✓', tone: 'ok' });
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      const hovered = el && el.matches && (el.matches(':hover') || el === document.activeElement);
      if (hovered) cxHintShow(el, { title: 'Clique para copiar' }); else cxHintHide();
    }, 1500);
  };
  return <span ref={ref} className={'cx-copynum' + (className ? ' ' + className : '')} role="button" tabIndex={0}
    aria-label={'Copiar número do processo ' + value}
    onClick={doCopy} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') doCopy(e); }}
    onMouseEnter={e => { clearTimeout(tRef.current); cxHintShow(e.currentTarget, { title: 'Clique para copiar' }); }}
    onFocus={e => { clearTimeout(tRef.current); cxHintShow(e.currentTarget, { title: 'Clique para copiar' }); }}
    onMouseLeave={() => { clearTimeout(tRef.current); cxHintHide(); }} onBlur={() => { clearTimeout(tRef.current); cxHintHide(); }}>
    {m ? <>{m[1]}<i>{m[2]}</i></> : value}
  </span>;
}

/* ─── Peças visuais ─── */
function CxStatusIcon({ s }) {
  const c = (CX_ST[s] || CX_ST.pendente_analise).c;
  let inner;
  if (s === 'analisado') inner = '<circle cx="7" cy="7" r="6" style="fill:' + c + '"/><path d="M4.4 7.2 6.2 9l3.4-3.6" style="fill:none;stroke:var(--cx-surface);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round"/>';
  else if (s === 'peca_edicao') inner = '<circle cx="7" cy="7" r="5.4" style="fill:none;stroke:' + c + ';stroke-width:1.5"/><path d="M7 3.4a3.6 3.6 0 0 1 0 7.2z" style="fill:' + c + '"/>';
  else if (s === 'em_analise') inner = '<circle cx="7" cy="7" r="5.4" style="fill:none;stroke:' + c + ';stroke-width:1.5"/><circle cx="7" cy="7" r="2.2" style="fill:' + c + '"/>';
  else if (s === 'analise_concluida') inner = '<circle cx="7" cy="7" r="5.4" style="fill:none;stroke:' + c + ';stroke-width:1.5"/><path d="M4.6 7.2 6.3 8.8l3.1-3.3" style="fill:none;stroke:' + c + ';stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"/>';
  else if (s === 'peca_pronta') inner = '<circle cx="7" cy="7" r="5.4" style="fill:' + c + '"/>';
  else if (s === 'aguardando_subsidios') inner = '<circle cx="7" cy="7" r="5.4" style="fill:none;stroke:' + c + ';stroke-width:1.5;stroke-dasharray:2.2 2.2"/>';
  else inner = '<circle cx="7" cy="7" r="5.4" style="fill:none;stroke:' + c + ';stroke-width:1.5"/>';
  return <span className="cx-st-ic" title={(CX_ST[s] || {}).l || s}><svg width="14" height="14" viewBox="0 0 14 14" dangerouslySetInnerHTML={{ __html: inner }} /></span>;
}
function CxImp({ intim, v }) {
  const k = v || intimImpKey(intim);
  return <span className="cx-imp" data-v={k} title={'Importância ' + (CX_IMP[k] || 'Média').toLowerCase()}><i /><i /><i /></span>;
}
function CxDif({ intim, v }) {
  const k = v || intimDifKey(intim);
  return <span className="cx-dif" data-v={k} title={'Complexidade ' + (CX_DIF[k] || 'Média').toLowerCase()}><i /><i /><i /></span>;
}
function CxPrio({ v }) {
  if (v === 'urgente') return <span className="cx-imp-urg" title="Prioridade urgente">!</span>;
  const k = v === 'alta' ? 'alta' : v === 'baixa' ? 'baixa' : 'normal';
  return <span className="cx-imp" data-v={k} title={'Prioridade ' + (TASK_PRIORITIES[v] ? TASK_PRIORITIES[v].label.toLowerCase() : 'média')}><i /><i /><i /></span>;
}
function CxDue({ iso, dd, doneIso }) {
  if (doneIso) return <span className="cx-due done" title={'Atuação em ' + fmtDate(doneIso)}>✓ {cxDM(doneIso)}</span>;
  const d = dd === undefined ? daysUntil(iso) : dd;
  const info = cxDue(d, iso);
  return <span className={'cx-due ' + info.tone} title={iso ? 'Final do prazo: ' + fmtDate(iso) : 'Prazo ainda não aberto'}>{info.txt}</span>;
}
function CxProc({ num, uf }) {
  const m = /^(\d{7}-\d{2})(\.\d{4}\.\d\.\d{2}\.\d{4})$/.exec(num || '');
  return <span className="cx-proc">{uf ? <span className="cx-uf">{uf}</span> : null}{m ? <>{m[1]}<span className="cx-d">{m[2]}</span></> : (num || '—')}</span>;
}
function CxOpTag({ op, onOpen }) {
  if (!op) return <span className="cx-op-tag cx-muted">Sem operação</span>;
  const inner = <><CxOpSquare op={op} /><span className="cx-ell">{cxOpName(op)}</span></>;
  if (!onOpen) return <span className="cx-op-tag" title={op.name}>{inner}</span>;
  return <button type="button" className="cx-op-tag cx-link" onClick={e => { e.stopPropagation(); onOpen(op.id); }} title={'Abrir ' + op.name}>{inner}</button>;
}
/* Ícone da peça (estilo Google Docs) na linha da lista / cartão do Quadro, quando há minutaUrl. */
function CxDocIcon({ url, size = 18 }) {
  if (!url) return null;
  return <a className="cx-doc-ic" href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Abrir peça" aria-label="Abrir peça" style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="1" width="20" height="22" rx="3" fill="#4285f4" />
      <path d="M14 1 22 9h-6a2 2 0 0 1-2-2z" fill="#8ab4f8" />
      <rect x="6" y="12" width="12" height="1.7" rx="0.85" fill="#fff" />
      <rect x="6" y="15.6" width="12" height="1.7" rx="0.85" fill="#fff" />
      <rect x="6" y="19.2" width="7.5" height="1.7" rx="0.85" fill="#fff" />
    </svg>
  </a>;
}
function CxSeg({ value, onChange, options, label, className = '' }) {
  return <div className={'cx-seg ' + className} role="group" aria-label={label}>
    {options.map(o => <button key={o[0]} type="button" className={(value === o[0] ? 'on' : '') + (o[4] && o[4].disabled ? ' dis' : '')} aria-pressed={value === o[0]} aria-disabled={o[4] && o[4].disabled ? true : undefined} title={o[4] && o[4].title ? o[4].title : undefined} onClick={() => { if (!(o[4] && o[4].disabled)) onChange(o[0]); }}>
      {o[2] ? <CxIcon n={o[2]} s={13} /> : null}{o[1]}{o[3] != null ? <span className="cx-n">{o[3]}</span> : null}
    </button>)}
  </div>;
}
/* Chips de filtro unificados (Polimento · Kit visual): contorno fino, contagem numa caixa cinza e ativo em cinza
   claro (nunca preto). options: [chave, rótulo, contagem?, cor do ponto?]. Contagem 0 fica apagada, mas clicável. */
function CxChips({ value, onChange, options, label, sm = false, className = '', group = '' }) {
  return <div className={'cx-chipset ' + className} role="group" aria-label={label}>
    {group ? <span className="cx-chip-grp">{group}</span> : null}
    {options.map(o => <button key={o[0]} type="button" className={'cx-fchip' + (sm ? ' sm' : '') + (value === o[0] ? ' on' : '') + (o[2] === 0 ? ' zero' : '')} aria-pressed={value === o[0]} onClick={() => onChange(o[0])}>
      {o[3] ? <span className="cx-dot" style={{ background: o[3] }} /> : null}{o[1]}{o[2] != null ? <span className="cx-fcn">{o[2]}</span> : null}
    </button>)}
  </div>;
}
/* Cartão de KPI (Polimento · K1): rótulo, número, linha descritiva, divisor fino e rodapé com o contexto (ou a
   comparação, quando existe). Delta só onde há comparação calculável: `delta = { txt, dir: 'up'|'down'|'none', tone:
   'good'|'bad'|'neutral' }`. `tone` ('red'|'orange'|'violet') colore o número/linha só quando descrevem um estado.
   Sem `onClick`, o cartão é um bloco; com ele, um botão. */
function CxKpiCard({ label, value, unit, desc, tone, descTone, side, tag, foot, footTone, footR, footRTone, delta, pair, onClick, nested, on, tip, disabled, pressed, className = '' }) {
  const top = <>
    <div className="cx-kc-t"><span className="cx-kc-l" title={typeof label === 'string' ? label : undefined}>{label}</span>{tag || null}</div>
    <div className="cx-kc-n"><span className={'cx-kc-v' + (tone ? ' ' + tone : '')}>{value}{unit ? <small>{unit}</small> : null}</span>{side || null}</div>
    <div className={'cx-kc-d' + (descTone ? ' ' + descTone : '')} title={typeof desc === 'string' ? desc : undefined}>{desc}</div>
  </>;
  const cls = 'cx-kc' + (onClick ? ' click' : '') + (on ? ' on' : '') + (className ? ' ' + className : '');
  if (pair) {
    /* Variante com métrica par no rodapé: duas áreas clicáveis independentes (principal e par). */
    const pb = <>
      <span className="cx-pt"><span>{pair.label}</span>{pair.ctx ? <span className="cx-pctx">{pair.ctx}</span> : null}</span>
      <span className="cx-pv"><b className={pair.tone || ''}>{pair.value}</b><span className={pair.noteTone || ''}>{pair.note}</span></span>
    </>;
    return <div className={cls.replace(' click', '') + ' has-pair'}>
      {onClick ? <button type="button" className="cx-kc-b click" onClick={onClick} title={tip}>{top}</button> : <div className="cx-kc-b" title={tip}>{top}</div>}
      {pair.onClick ? <button type="button" className="cx-kc-pair click" onClick={pair.onClick} title={pair.tip}>{pb}</button> : <div className="cx-kc-pair" title={pair.tip}>{pb}</div>}
    </div>;
  }
  const body = <>
    <div className="cx-kc-b">{top}</div>
    <div className="cx-kc-f"><span className={footTone ? footTone : ''} title={typeof foot === 'string' ? foot : undefined}>{foot}</span>{delta ? <span className={'cx-dl ' + (delta.dir || 'none') + ' ' + (delta.tone || 'neutral')}>{delta.txt}</span> : footR ? <span className={'cx-kc-fr' + (footRTone ? ' ' + footRTone : '')}>{footR}</span> : null}</div>
  </>;
  if (onClick && nested) {
    /* Cartão com botões dentro (ex.: chips de tribunal): não pode ser <button>, vira área clicável acessível. */
    return <div className={cls} role="button" tabIndex={0} onClick={onClick} title={tip}
      onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>{body}</div>;
  }
  return onClick
    ? <button type="button" className={cls} onClick={onClick} title={tip} disabled={disabled} aria-pressed={pressed === undefined ? undefined : !!pressed}>{body}</button>
    : <div className={cls} title={tip}>{body}</div>;
}
/* Anel segmentado (Polimento · K5): só para razão (x de y) ou etapas, sempre com o número escrito ao lado.
   20 segmentos finos; `pct` 0–100. */
function CxRing({ pct, size = 44, stroke = 6, color = 'var(--cx-green)', label }) {
  const n = 20, r = (size - stroke) / 2, c = size / 2;
  const p = Math.max(0, Math.min(100, pct || 0));
  let filled = Math.round(p / 100 * n);
  if (p > 0 && filled === 0) filled = 1;
  if (p < 100 && filled === n) filled = n - 1;
  const pt = (deg) => { const a = deg * Math.PI / 180; return (c + r * Math.sin(a)).toFixed(2) + ' ' + (c - r * Math.cos(a)).toFixed(2); };
  const segs = [];
  for (let i = 0; i < n; i++) {
    const a0 = i * 18 + 3, a1 = i * 18 + 15;
    segs.push(<path key={i} d={'M' + pt(a0) + ' A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 1 ' + pt(a1)} stroke={i < filled ? color : 'var(--cx-line-strong)'} />);
  }
  return <svg className="cx-ring" width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} role="img" aria-label={label || (Math.round(p) + '%')} style={{ strokeWidth: stroke, fill: 'none', strokeLinecap: 'butt' }}><title>{label || (Math.round(p) + '%')}</title>{segs}</svg>;
}
/* Tile de iniciais na cor da operação (Polimento · K3); anel violeta para operação nova, como o quadradinho. */
function cxOpInitials(op) {
  const all = cxOpName(op).split(/\s+/).filter(Boolean);
  const words = all.filter(w => !/^(d[aeo]s?|e)$/i.test(w));
  return ((words.length ? words : all).slice(0, 2).map(w => w.charAt(0)).join('') || '?').toUpperCase();
}
function CxOpTile({ op, size = 40 }) {
  const isNew = cxOpIsNew(op);
  const style = { '--c': cxOpColor(op), '--s': size + 'px' };
  if (isNew) { style.outline = '2px solid var(--cx-violet)'; style.outlineOffset = '1.5px'; }
  return <span className="cx-tile" style={style} title={isNew ? 'Nova' : undefined} aria-hidden="true">{cxOpInitials(op)}</span>;
}
/* Carteira inteira: dívida e garantia sobre as CDAs não extintas (mesma conta do cartão "Crédito sob gestão") e a
   indisponibilidade de todos os bens (soma por operação, sem deduplicar). */
function cxCarteiraTotals(data) {
  const debts = (data.debts || []).filter(d => d.status !== 'extinta');
  const total = debts.reduce((t, d) => t + (d.value || 0), 0);
  const guar = debts.filter(d => d.status === 'garantida').reduce((t, d) => t + (d.value || 0), 0);
  return { total, guar, pct: total > 0 ? Math.round(guar / total * 100) : null, indisp: indispStats(data.assets || [], total) };
}
/* Indisponibilidade (Prumo): anel e texto contam só bens com indisponibilidade ativa ou requerida (src/lib/indisp.js). */
const CX_INDISP_DUP = 'soma por operação: um mesmo bem lançado em duas operações conta duas vezes';
const CX_INDISP_RING = 'Parte da dívida (CDAs não extintas) coberta por bens com indisponibilidade, ativa ou requerida.';
function cxIndispSplit(s) { return indispSplitText(s, cxMoneyShort); }
/* "47%" no anel/tabela; acima de 100% da dívida, a razão ("2,6×") em vez de um 100% que esconderia o excesso. */
function cxIndispPctTxt(s) {
  if (!s || s.pct === null) return '—';
  if (s.over) return (Math.round(s.ratio * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '×';
  return s.pct + '%';
}
/* Linha de Resumo (Polimento · K7): frase montada por regras fixas (src/lib/hoje.js), nunca por IA. */
function CxResumo({ text, className = '' }) {
  if (!text) return null;
  return <div className={'cx-rs ' + className}>
    <span className="cx-rs-chip" title="Calculado a partir dos dados desta tela, por regras fixas. Sem IA."><CxIcon n="list" s={12} />Resumo</span>
    <span>{resumoPartes(text).map((x, k) => x.b ? <b key={k}>{x.t}</b> : <React.Fragment key={k}>{x.t}</React.Fragment>)}</span>
  </div>;
}
function CxKpiStrip({ n, dense = true, className = '', children }) {
  return <div className={'cx-ks' + (dense ? ' dense' : '') + (n >= 5 ? ' many' : '') + (className ? ' ' + className : '')} style={{ '--n': n }}>{children}</div>;
}
function CxSelect({ id, pre, value, onChange, options, label }) {
  return <label className="cx-sel">
    {pre ? <span className="cx-pre">{pre}</span> : null}
    <select id={id} value={value} onChange={e => onChange(e.target.value)} aria-label={label || pre} style={pre ? { paddingLeft: (pre.length * 7 + 20) + 'px' } : null}>
      {options.map(o => <option key={o[0]} value={o[0]} disabled={o[2] === 'dis'} hidden={o[2] === 'dis'}>{o[1]}</option>)}
    </select>
    <CxIcon n="chevD" s={12} />
  </label>;
}
function CxAvatars({ people, max = 3 }) {
  const list = people.slice(0, max);
  const ini = (n) => String(n || '?').replace(/\b(LTDA|S\/A|SA|ME|EIRELI|EPP)\b/gi, '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return <span className="cx-avs">
    {list.map(p => <span key={p.id} className={'cx-av' + (p.subtype === 'PJ' ? ' pj' : '')} title={p.name + (p.subtype ? ' · ' + p.subtype : '')}>{ini(p.name)}</span>)}
    {people.length > list.length ? <span className="cx-av" title="Outros alvos">+{people.length - list.length}</span> : null}
  </span>;
}
function CxToastHost() {
  const [msg, setMsg] = React.useState(null);
  const tRef = React.useRef(null);
  React.useEffect(() => {
    const on = (e) => { setMsg(e.detail); clearTimeout(tRef.current); tRef.current = setTimeout(() => setMsg(null), 2600); };
    window.addEventListener('cx-toast', on);
    return () => { window.removeEventListener('cx-toast', on); clearTimeout(tRef.current); };
  }, []);
  if (!msg) return null;
  return <div className="cx-toast" role="status"><CxIcon n="tick" s={14} />{msg}</div>;
}

/* Estado da sincronização com a Planilha (rodapé do menu e faixa de erro). */
function cxSyncInfo(s) {
  const txt = s.status === 'syncing' ? 'Sincronizando…' : s.status === 'error' ? 'Erro na sincronização' : s.lastSync ? 'Planilha · ' + s.lastSync : 'Planilha';
  const color = s.status === 'error' ? 'var(--cx-red)' : s.status === 'syncing' ? 'var(--cx-yellow)' : s.status === 'connected' ? 'var(--cx-green)' : 'var(--cx-ink-3)';
  const title = (s.msg ? s.msg + ' · ' : '') + 'Clique para salvar na Planilha agora' + (s.pending ? ' (há alterações não salvas)' : '');
  return { txt, color, title };
}

/* ═════════════════════ Menu lateral ═════════════════════ */
function EditionClaudeSidebar(p) {
  const { data, viewMode, activeOpId, activeTab, counts, opMeta } = p;
  const [openOps, setOpenOps] = React.useState(() => ({}));
  const [filter, setFilter] = React.useState('');
  const [showClosed, setShowClosed] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [localCls, setLocalCls] = React.useState('all');
  const cls = p.classFilter || localCls;
  const setCls = p.setClassFilter || setLocalCls;
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!menu) return undefined;
    const raf = requestAnimationFrame(() => { const el = menuRef.current && menuRef.current.querySelector('.cx-side-menu'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); });
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);
  const ops = (data.operations || []).filter(o => !isSubstituicaoOp(o)).slice().sort(sortOpsByName);
  const substOp = (data.operations || []).find(isSubstituicaoOp);
  const q = cxNorm(filter.trim());
  const match = (o) => (!q || cxNorm(o.name + ' ' + (o.description || '')).includes(q)) && opMatchesClassFilter(o, cls);
  const active = ops.filter(o => o.status !== 'encerrada' && match(o));
  const closed = ops.filter(o => o.status === 'encerrada' && match(o));
  const totalActive = ops.filter(o => o.status !== 'encerrada').length;
  const nClosedAll = ops.length - totalActive;
  const clsKeys = opClassChipKeys(ops, { hideEmpty: true });
  const clsMeta = cls !== 'all' && cls !== 'encerrada' ? OP_CLASSIFICATIONS[resolveOpClassKey(cls) || cls] : null;
  const pick = (k) => { setCls(k); setMenu(false); };
  const closedOpen = showClosed || cls === 'encerrada';
  const substOpenCount = substOp ? (data.intimations || []).filter(x => x.operationId === substOp.id && cxIsOpen(x)).length : 0;
  const showSubst = !!(substOp && cls === 'all' && (!q || cxNorm('em substituição').includes(q)));
  const item = (vm, icon, label, extra, onClick) => {
    const on = viewMode === vm;
    return <button key={vm} type="button" className={'cx-nav-item' + (on ? ' on' : '')} aria-current={on ? 'page' : undefined} title={label} onClick={onClick || (() => p.onNav(vm))}>
      <CxIcon n={icon} /><span className="cx-lbl">{label}</span>{extra || null}
    </button>;
  };
  const renderOp = (o) => {
    const open = !!openOps[o.id] || (viewMode === 'operation' && activeOpId === o.id);
    const onOp = viewMode === 'operation' && activeOpId === o.id;
    const m = opMeta[o.id] || {};
    return <div key={o.id}>
      <div className={'cx-nav-item cx-nav-op' + (open ? ' open' : '') + (onOp ? ' on' : '')} role="button" tabIndex={0}
        onClick={() => { p.onOpenOp(o.id); setOpenOps(s => ({ ...s, [o.id]: true })); }}
        onKeyDown={e => { if (e.key === 'Enter') p.onOpenOp(o.id); }}>
        <span className="cx-chev" role="button" aria-label={open ? 'Recolher' : 'Expandir'} onClick={e => { e.stopPropagation(); setOpenOps(s => ({ ...s, [o.id]: !open })); }}><CxIcon n="chevR" s={12} /></span>
        <CxOpSquare op={o} title={o.name} />
        <span className="cx-lbl" title={o.name}>{cxOpName(o)}</span>
        {m.overdueIntims > 0 ? <span className="cx-dot" style={{ background: 'var(--cx-red)' }} title={cxPl(m.overdueIntims, 'intimação vencida', 'intimações vencidas')} />
          : m.alerts > 0 ? <span className="cx-dot" style={{ background: 'var(--cx-violet)' }} title={cxPl(m.alerts, 'CDA a agir nos prazos extintivos', 'CDAs a agir nos prazos extintivos')} /> : null}
      </div>
      {open ? <div className="cx-nav-sub">
        <button type="button" className={'cx-nav-item' + (onOp && cxTabOn(activeTab, 'visao') ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, 'visao')}><span className="cx-lbl">Visão geral</span></button>
        {CX_OP_TABS.map(t => <button key={t[0]} type="button" className={'cx-nav-item' + (onOp && cxTabOn(activeTab, t[0]) ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, t[0])}><span className="cx-lbl">{t[1]}</span></button>)}
      </div> : null}
    </div>;
  };
  return <aside className="cx cx-side" aria-label="Navegação">
    <div className="cx-side-head">
      <button type="button" className="cx-brand" onClick={() => p.onNav('hoje')} title="Nexus Prumo · início">
        <span className="cx-brand-mark">N</span>
        <span className="cx-ell"><span className="cx-brand-name">NEXUS</span><span className="cx-brand-sub">Prumo · {NEXUS_VERSION}</span></span>
      </button>
      <button type="button" className="cx-icon-btn cx-side-collapse-btn" onClick={p.onToggleCollapsed} title={p.collapsed ? 'Expandir menu' : 'Recolher menu'} aria-label={p.collapsed ? 'Expandir menu' : 'Recolher menu'}><CxIcon n={p.collapsed ? 'chevR' : 'chevL'} /></button>
      <button type="button" className="cx-icon-btn cx-side-search-btn" onClick={p.onSearch} title="Buscar (Ctrl+K)" aria-label="Buscar"><CxIcon n="search" /></button>
      <button type="button" className="cx-icon-btn cx-side-close" onClick={p.onClose} aria-label="Fechar menu"><CxIcon n="x" /></button>
    </div>
    <div className="cx-side-scroll">
      <nav className="cx-nav">
        {item('hoje', 'home', 'Hoje')}
        {item('intimacoes', 'inbox', 'Intimações', counts.openIntims ? <>{counts.lateIntims ? <span className="cx-cb red" title={cxPl(counts.lateIntims, 'intimação vencida', 'intimações vencidas')}>{counts.lateIntims} venc.</span> : null}<span className="cx-count">{counts.openIntims}</span></> : null)}
        {item('tarefas_global', 'check', 'Tarefas', counts.openTasks ? <span className="cx-count">{counts.openTasks}</span> : null)}
        {item('mesa', 'desk', 'Mesa de intimações', counts.desk ? <span className="cx-count">{counts.desk}</span> : null)}
        <button type="button" className="cx-nav-item" title="Buscar" onClick={p.onSearch}><CxIcon n="search" /><span className="cx-lbl">Buscar</span><kbd className="cx-kbd">/</kbd></button>
      </nav>
      <div className="cx-nav-sec"><span>Trabalho</span></div>
      <nav className="cx-nav">
        {item('operacoes', 'briefcase', 'Carteira', <span className="cx-count">{totalActive}</span>)}
        {item('prazos', 'hourglass', 'Prazos extintivos', counts.presc1 ? <span className="cx-cb red" title={cxPl(counts.presc1, 'CDA a agir nos prazos extintivos', 'CDAs a agir nos prazos extintivos')}>{counts.presc1}</span> : null)}
        {item('cx_timeline', 'timeline', 'Linha do tempo')}
        {item('audiencias', 'calendar', 'Agenda', counts.hearings ? <span className="cx-count">{counts.hearings}</span> : null)}
        {item('acompanhar', 'eye', 'Acompanhar', counts.watch ? <span className="cx-count">{counts.watch}</span> : null)}
        {item('modelos', 'book', 'Biblioteca', counts.models ? <span className="cx-count">{counts.models}</span> : null)}
        {item('painel', 'chart', 'Painel')}
        {item('cx_atividade', 'history', 'Minha atividade')}
        <button type="button" className="cx-nav-item" title="Importar eproc" onClick={p.onImportEproc}><CxIcon n="upload" /><span className="cx-lbl">Importar eproc</span></button>
      </nav>
      <div className="cx-nav-sec"><span>Operações</span><button type="button" className="cx-icon-btn cx-sm" title="Nova operação" aria-label="Nova operação" onClick={p.onNewOp}><CxIcon n="plus" s={14} /></button></div>
      {ops.length ? <div className="cx-side-tools" ref={menuRef}>
        <label className="cx-side-filter">
          <CxIcon n="search" s={13} />
          <input id="cx-op-filter" value={filter} onChange={e => setFilter(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setFilter(''); }} placeholder="Buscar operação" aria-label="Buscar operação pelo nome" />
          {filter ? <button type="button" className="cx-icon-btn cx-sm" onClick={() => setFilter('')} aria-label="Limpar busca" title="Limpar busca"><CxIcon n="x" s={12} /></button> : null}
        </label>
        <button type="button" className={'cx-icon-btn cx-side-fbtn' + (cls !== 'all' ? ' on' : '') + (menu ? ' open' : '')} onClick={() => setMenu(v => !v)} aria-haspopup="true" aria-expanded={menu} title="Filtrar por classificação" aria-label="Filtrar por classificação"><CxIcon n="filter" s={14} /></button>
        {menu ? <div className="cx-side-menu" role="menu" aria-label="Classificação da operação">
          <button type="button" role="menuitemradio" aria-checked={cls === 'all'} className={'cx-side-mi' + (cls === 'all' ? ' on' : '')} onClick={() => pick('all')}><span className="cx-dot" style={{ background: 'var(--cx-ink-3)' }} /><span className="cx-lbl">Todas</span><span className="cx-count">{ops.length}</span></button>
          {clsKeys.map(k => { const m = OP_CLASSIFICATIONS[k]; return m ? <button key={k} type="button" role="menuitemradio" aria-checked={cls === k} className={'cx-side-mi' + (cls === k ? ' on' : '')} onClick={() => pick(k)}><span className="cx-dot" style={{ background: m.color }} /><span className="cx-lbl">{m.label}</span><span className="cx-count">{ops.filter(o => opMatchesClassFilter(o, k)).length}</span></button> : null; })}
          {nClosedAll ? <button type="button" role="menuitemradio" aria-checked={cls === 'encerrada'} className={'cx-side-mi' + (cls === 'encerrada' ? ' on' : '')} onClick={() => pick('encerrada')}><span className="cx-dot" style={{ background: 'var(--cx-line-strong)' }} /><span className="cx-lbl">Encerradas</span><span className="cx-count">{nClosedAll}</span></button> : null}
        </div> : null}
      </div> : null}
      {cls !== 'all' ? <div className="cx-side-active">
        <span className="cx-dot" style={{ background: clsMeta ? clsMeta.color : 'var(--cx-line-strong)' }} />
        <span className="cx-ell">{clsMeta ? clsMeta.label : 'Encerradas'}</span>
        <span className="cx-count">{active.length + closed.length}</span>
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => setCls('all')} aria-label="Limpar filtro" title="Mostrar todas"><CxIcon n="x" s={12} /></button>
      </div> : null}
      <nav className="cx-nav">
        {active.map(renderOp)}
        {showSubst ? <button type="button" className={'cx-nav-item cx-nav-op' + (viewMode === 'operation' && activeOpId === substOp.id ? ' on' : '')} title="EM SUBSTITUIÇÃO" onClick={() => p.onOpenOp(substOp.id)}>
          <CxOpSquare op={substOp} title="EM SUBSTITUIÇÃO" />
          <span className="cx-lbl">EM SUBSTITUIÇÃO</span>
          {substOpenCount ? <span className="cx-count">{substOpenCount}</span> : null}
        </button> : null}
        {!p.collapsed && active.length === 0 && !showSubst && !(cls === 'encerrada' && closed.length) ? <div className="cx-side-empty">{!ops.length ? 'Crie sua primeira operação.' : q ? 'Nenhuma operação com esse nome' + (cls !== 'all' ? ' neste filtro.' : '.') : 'Nenhuma operação neste filtro.'}</div> : null}
        {!p.collapsed && closed.length && cls !== 'encerrada' ? <button type="button" className="cx-nav-item cx-nav-closed" onClick={() => setShowClosed(v => !v)}><span className="cx-chev" style={{ transform: showClosed ? 'rotate(90deg)' : 'none' }}><CxIcon n="chevR" s={12} /></span><span className="cx-lbl">Encerradas</span><span className="cx-count">{closed.length}</span></button> : null}
        {!p.collapsed && closedOpen ? closed.map(renderOp) : null}
      </nav>
    </div>
    <div className="cx-side-foot">
      <span>Nexus Prumo</span>
      <button type="button" className="cx-link-btn" onClick={p.onCloudPull} title="Trazer o JSON salvo no Drive e substituir os dados desta tela">Carregar da Planilha</button>
      {p.sync && p.sync.isGAS ? (() => { const si = cxSyncInfo(p.sync); return <button type="button" className="cx-side-sync" onClick={p.sync.onPush} title={si.title} aria-label={si.txt + (p.sync.pending ? ' · pendente' : '') + '. Salvar na Planilha agora'}>
        <span className="cx-dot" style={{ background: si.color }} />
        <span className="cx-side-sync-t cx-ell">{si.txt}</span>
        {p.sync.pending ? <span className="cx-side-sync-p">· pend.</span> : null}
      </button>; })() : null}
    </div>
  </aside>;
}

/* ═════════════════════ Barra superior ═════════════════════ */
function EditionClaudeTopbar(p) {
  return <header className="cx cx-top">
    <button type="button" className="cx-icon-btn cx-menu-btn" onClick={p.onMenu} aria-label="Abrir menu"><CxIcon n="menu" /></button>
    {p.backLabel ? <button type="button" className="cx-back" onClick={p.onBack} title={'Voltar para ' + p.backLabel + ' (Alt+←)'} aria-label={'Voltar para ' + p.backLabel}><span aria-hidden="true">←</span></button> : null}
    <div className="cx-crumb">
      <span>NEXUS</span>
      {p.crumbs.map((c, k) => <React.Fragment key={k}><span className="cx-sep">/</span>{k === p.crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}</React.Fragment>)}
    </div>
    <div className="cx-top-r">
      <button type="button" className="cx-search" onClick={p.onSearch} aria-label="Buscar"><CxIcon n="search" s={14} /><span className="cx-t">Buscar processo, CDA…</span><kbd className="cx-kbd">Ctrl K</kbd></button>
      {p.lastOp ? <button type="button" className="cx-last-op" onClick={p.onOpenLastOp} title={'Voltar para ' + p.lastOp.name}>{p.lastOp.name}</button> : null}
      <div className="cx-settings-anchor">
        <button type="button" className="cx-icon-btn" onClick={p.onToggleSettings} title="Ajustes" aria-label="Ajustes"><CxIcon n="settings" /></button>
        {p.settingsPanel}
      </div>
    </div>
  </header>;
}

/* Faixa de erro de sincronização: uma falha ao salvar pode significar edições perdidas. */
function CxSyncErrorBanner({ msg, onRetry }) {
  return <div className="cx cx-banner cx-banner-err" role="alert">
    <CxIcon n="alert" s={14} />
    <b>Não foi possível salvar na Planilha</b>
    {msg ? <span className="cx-ell">{msg}</span> : null}
    <button type="button" className="cx-banner-act" onClick={onRetry}>Tentar agora</button>
  </div>;
}

/* Aviso de audiência em até 48h (substitui a faixa vermelha do clássico nesta edição). */
function CxHearingBanner({ item, more, onOpen }) {
  const dd = item.dd, h = item.h;
  return <div className={'cx cx-banner' + (dd === 0 ? ' today' : '')} role="button" tabIndex={0} onClick={onOpen} onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}>
    <CxIcon n="gavel" s={14} />
    <b>{dd === 0 ? 'Audiência hoje' : dd === 1 ? 'Audiência amanhã' : 'Audiência em ' + dd + ' dias'}</b>
    <span className="cx-ell">{[h.time, h.parties || h.processNumber].filter(Boolean).join(' · ')}</span>
    {more > 0 ? <span className="cx-banner-more">+{more} em até 48 h</span> : null}
  </div>;
}

/* ═════════════════════ Hoje ═════════════════════ */
function cxBuildQueue(data, prazosByDebt, opsById) {
  const q = [];
  const opName = (id) => (opsById.get(id) || {}).name || '';
  (data.intimations || []).forEach(x => {
    if (x.responseAction) {
      const at = x.responseAction.respondedAt;
      const dd = at ? daysUntil(at) : null;
      if (dd !== null && dd >= -7) q.push({ key: 'i' + x.id, kind: 'Intimação', ic: 'inbox', title: cxPartyName(x), sub: <CxObj intim={x} />, opId: x.operationId, doneIso: at, doneAt: dd, intim: x });
      return;
    }
    if (x.status === 'analisado' || !x.dateDeadline) return;
    q.push({ key: 'i' + x.id, kind: 'Intimação', ic: 'inbox', title: cxPartyName(x), sub: <CxObj intim={x} />, opId: x.operationId, iso: x.dateDeadline, due: daysUntil(x.dateDeadline), st: x.status, intim: x });
  });
  (data.tasks || []).forEach(t => {
    if (t.status === 'concluida' || t.status === 'cancelada' || !t.dueDate) return;
    q.push({ key: 't' + t.id, kind: 'Tarefa', ic: 'check', title: t.title || t.description || 'Tarefa', sub: ['Tarefa', opName(t.operationId)].filter(Boolean).join(' · '), opId: t.operationId, iso: t.dueDate, due: daysUntil(t.dueDate), prio: t.priority, task: t });
  });
  (data.hearings || []).forEach(h => {
    if (h.status === 'realizada' || h.status === 'cancelada' || !h.date) return;
    q.push({ key: 'h' + h.id, kind: 'Audiência', ic: 'calendar', title: (CX_HEARING[h.hearingType] || 'Audiência') + (h.time ? ' · ' + h.time : ''), sub: h.parties || h.processNumber || '', opId: h.operationId, iso: h.date, due: daysUntil(h.date), hearing: h });
  });
  (data.debts || []).forEach(d => {
    if (d.prescriptionHandled) return;
    const row = prazosByDebt.get(d.id);
    if (!row || (row.group !== 1 && row.group !== 2)) return;
    q.push({ key: 'p' + d.id, kind: 'Prescrição', ic: 'hourglass', title: 'CDA ' + (d.cdaNumber || d.number || '') + (d.tribute ? ' · ' + d.tribute : ''), sub: row.summary || fmtCur(d.value || 0), opId: d.operationId, due: row.prescDays == null ? null : row.prescDays, g: row.group, debt: d });
  });
  return q;
}
/* Intimações e tarefas abertas com uma esteira pela metade — cartão "Continuar de onde parou" (Hoje). */
function cxContinueQueue(data) {
  const out = [];
  (data.intimations || []).forEach(x => {
    if (!cxIsOpen(x)) return;
    const info = esteiraResumeInfo(x.esteira);
    if (!info) return;
    out.push({ key: 'i' + x.id, intim: x, info, due: daysUntil(x.dateDeadline), iso: x.dateDeadline, title: cxPartyName(x), updatedAt: x.esteira.updatedAt });
  });
  (data.tasks || []).forEach(t => {
    if (!cxTaskOpen(t)) return;
    const info = esteiraResumeInfo(t.esteira);
    if (!info) return;
    out.push({ key: 't' + t.id, task: t, info, due: daysUntil(t.dueDate), iso: t.dueDate, title: (t.title || 'Tarefa') + ' · tarefa', updatedAt: t.esteira.updatedAt });
  });
  out.sort((a, b) => {
    const da = a.due === null ? Infinity : a.due, db = b.due === null ? Infinity : b.due;
    if (da !== db) return da - db;
    return String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''));
  });
  return out;
}
/* ─── Carga de prazos (Polimento · Hoje): mapa de pontos, um ponto por item aberto com data ───
   Cálculo em src/lib/hoje.js (cargaItens/cargaMapa/resumoCarga). Cor = urgência (vencido, até 2 dias, 3 a 7, 8+),
   forma = tipo (círculo intimação, quadrado tarefa, losango audiência). Dia com mais de 5 itens ganha coluna fina extra:
   nenhum ponto some. Clicar num dia abre a Agenda só nesse dia. */
const CX_URG_C = ['var(--cx-red)', 'var(--cx-orange)', 'var(--cx-opc-media)', 'var(--cx-opc-none)'];
const CX_KIND_SHAPE = { i: 'ki', t: 'kt', h: 'kh' };
const CX_KIND_NAME = { i: 'Intimação', t: 'Tarefa', h: 'Audiência' };
function cxDotTitle(it, iso) {
  return dowDmIso(iso) + ' · ' + CX_KIND_NAME[it.kind] + ' — ' + it.label + (it.sub ? ' · ' + it.sub : '');
}
function CxCargaStack({ items, perCol }) {
  const cols = Math.max(1, Math.ceil(items.length / perCol));
  const out = [];
  for (let c = 0; c < cols; c++) {
    const slots = [];
    for (let k = 0; k < perCol; k++) {
      const it = items[c * perCol + k];
      slots.push(it ? <i key={k} className={'cx-hd ' + CX_KIND_SHAPE[it.kind] + ' u' + it.urg} title={cxDotTitle(it, it.iso)} /> : <i key={k} className="cx-dot7" />);
    }
    out.push(<div key={c} className="cx-sc">{slots}</div>);
  }
  return <div className="cx-stack">{out}</div>;
}
function CxCargaCard({ mapa, weeks, setWeeks, resumo, onOpenDay, onVencidos }) {
  const long = weeks > 3;
  const pico = mapa.pico, sp = mapa.semanaPesada;
  const venc = mapa.vencidos;
  const tipoLeg = [['i', 'Intimações'], ['t', 'Tarefas'], ['h', 'Audiências']];
  const sbarColor = { i: 'var(--cx-ink-2)', t: 'var(--cx-opc-none)', h: 'var(--cx-line-strong)' };
  return <section className="cx-card cx-cg-card" aria-labelledby="cx-h-carga">
    <div className="cx-cg">
      <div className="cx-cg-l">
        <div>
          <div className="cx-kc-l" style={{ marginBottom: 8 }}>Itens em {weeks} semanas</div>
          <div className="cx-cg-n"><span className="big">{mapa.total}</span><span className="cap">itens em {weeks * 7} dias</span></div>
        </div>
        <div className="cx-sbar" title={tipoLeg.map(t => t[1] + ' ' + mapa.porTipo[t[0]]).join(' · ')}>{tipoLeg.filter(t => mapa.porTipo[t[0]] > 0).map(t => <i key={t[0]} style={{ flex: mapa.porTipo[t[0]], background: sbarColor[t[0]] }} />)}</div>
        <div className="cx-cg-lg">{tipoLeg.map(t => <div key={t[0]}><span className={'cx-sh ' + CX_KIND_SHAPE[t[0]]} style={{ background: sbarColor[t[0]] }} />{t[1]}<b>{mapa.porTipo[t[0]]}</b></div>)}</div>
        <div className="cx-ug">{[['vencido', 0], ['até 2 dias', 1], ['3 a 7 dias', 2], ['8 dias ou mais', 3]].map(u => <span key={u[1]}><i className="sw" style={{ background: CX_URG_C[u[1]] }} />{u[0]}</span>)}</div>
      </div>
      <div className="cx-cg-r">
        <div className="cx-cg-h">
          <h2 id="cx-h-carga" title="Um ponto por item. Clicar num dia abre a Agenda nesse dia.">Carga de prazos</h2>
          {pico ? <span className="cx-chp"><CxIcon n="flag" s={12} />Pico: <b>{dowDmIso(pico.iso)}</b> · {cxPl(pico.count, 'item', 'itens')}</span> : null}
          {venc.length ? <button type="button" className="cx-chp red" onClick={onVencidos} title="Ver os vencidos na Fila do dia">{cxPl(venc.length, 'vencido', 'vencidos')}</button> : null}
          {sp ? <span className="cx-chp">Semana {sp.idx + 1} · <b>{cxPl(sp.count, 'item', 'itens')}</b>{sp.idx > 0 && sp.deltaAtual !== 0 ? <span className={'cx-dl ' + (sp.deltaAtual > 0 ? 'up' : 'down') + ' neutral'} style={{ fontSize: 11 }} title="Contra a semana 1">{(sp.deltaAtual > 0 ? '+' : '−') + Math.abs(sp.deltaAtual)}</span> : null}</span> : null}
          <CxSelect id="cx-carga-w" value={String(weeks)} onChange={v => setWeeks(Number(v))} options={[['3', '3 semanas'], ['6', '6 semanas']]} label="Horizonte da carga de prazos" />
        </div>
        <div className="cx-hm">
          <div className="cx-hm-v">
            <div className="cx-wkh"><div style={{ border: 0, paddingLeft: 4 }}><b>Vencidos</b></div></div>
            <button type="button" className="cx-hc" onClick={onVencidos} disabled={!venc.length} title={cxPl(venc.length, 'item vencido', 'itens vencidos')}>
              <CxCargaStack items={venc} perCol={mapa.perCol} />
              <div className={'cx-dlb' + (venc.length ? ' ven' : '')}>venc.<b>{venc.length}</b></div>
            </button>
          </div>
          <div className="cx-hm-wk">
            <div className="cx-wkh">{mapa.semanas.map(w => <div key={w.idx} style={{ flex: 7 }}>{long ? 'S' + (w.idx + 1) : 'Semana ' + (w.idx + 1)} · {w.from.slice(5, 7) === w.to.slice(5, 7) ? w.from.slice(8, 10) + '–' + dmIso(w.to) : dmIso(w.from) + '–' + dmIso(w.to)} · <b>{long ? w.count : cxPl(w.count, 'item', 'itens')}</b></div>)}</div>
            <div className="cx-cols">{mapa.days.map(d => <button key={d.iso} type="button" className={'cx-hc' + (d.isWeekend ? ' we' : '') + (d.week > 0 && d.iso === mapa.semanas[d.week].from ? ' wkb' : '')} style={d.cols > 1 ? { minWidth: d.cols * 12 } : null}
              onClick={() => onOpenDay(d.iso)} title={dowDmIso(d.iso) + ' · ' + cxPl(d.count, 'item', 'itens') + ' · abrir a Agenda neste dia'}>
              <CxCargaStack items={d.items} perCol={mapa.perCol} />
              <div className={'cx-dlb' + (d.isToday ? ' today' : '')}>{long ? '' : dowIso(d.iso)}<b>{d.iso.slice(8, 10)}</b></div>
            </button>)}</div>
          </div>
        </div>
        {resumo ? <CxResumo text={resumo} className="cx-cg-rs" /> : null}
      </div>
    </div>
  </section>;
}
/* ─── Precisa de atenção (Polimento · Hoje): CDAs no alarme e operações com a revisão atrasada ─── */
function CxAtencaoCard({ atencao, today, opsById, onOpenCda, onReviewed, onOpenPrazos, onOpenCarteira }) {
  const a = atencao;
  const CAP = 4;
  const frase = atencaoFrase(a);
  return <section className="cx-card" aria-labelledby="cx-h-aten">
    <div className="cx-card-h"><h2 id="cx-h-aten">Precisa de atenção</h2><div className="cx-aside"><span className="cx-count">{a.total}</span></div></div>
    {a.total ? <>
      <div className="cx-at-top"><span className="big">{a.total}</span><span className="cap">{frase.replace(/^\d+ /, '')}</span></div>
      <div className="cx-at-txt"><p>CDAs a agir nos prazos extintivos (fileira de cima da Mesa de prazos), do termo mais próximo ao mais distante, e operações com a revisão fora do prazo.</p></div>
      {a.cdas.slice(0, CAP).map(r => <div key={'c' + r.id} className="cx-ar">
        <span className="ico"><CxIcon n="hourglass" s={16} /></span>
        <div className="cx-minw0">
          <div className="tt cx-ell"><span className="cx-mono">{r.cdaNumber || 'S/N'}</span><span className="cd">{r.prescDays == null ? 'sem data' : cxHorizonTxt(r.prescDays)}</span></div>
          <div className="mm">{[cxOpName(opsById.get(r.operationId)), r.prescDays == null ? '' : fmtDate(addCalendarDays(today, r.prescDays)), r.value ? cxMoneyShort(r.value) : ''].filter(Boolean).join(' · ')}</div>
        </div>
        <button type="button" className="cx-btn sm" onClick={() => onOpenCda(r)}>Abrir CDA</button>
      </div>)}
      {a.revisoes.slice(0, CAP).map(v => <div key={'r' + v.op.id} className="cx-ar">
        <span className="ico o"><CxIcon n="history" s={16} /></span>
        <div className="cx-minw0">
          <div className="tt cx-ell">{cxOpName(v.op)}</div>
          <div className="mm">Atrasada há {cxPl(v.diasAtraso, 'dia', 'dias')}{v.intervalo ? ' · revisão ' + v.intervalo : ''}</div>
        </div>
        <button type="button" className="cx-btn sm" onClick={() => onReviewed(v.op)} title="Marcar a operação como revisada hoje"><CxIcon n="tick" s={13} />Revisada</button>
      </div>)}
      {a.cdas.length > CAP || a.revisoes.length > CAP ? <div className="cx-more">
        {a.cdas.length > CAP ? <button type="button" className="cx-link-btn" onClick={onOpenPrazos}>+{a.cdas.length - CAP} na Mesa de prazos</button> : null}
        {a.revisoes.length > CAP ? <button type="button" className="cx-link-btn" onClick={onOpenCarteira}>+{a.revisoes.length - CAP} na Carteira</button> : null}
      </div> : null}
    </> : <div className="cx-empty-row">Nada pede uma decisão sua agora: nenhuma CDA a agir nos prazos extintivos e nenhuma revisão atrasada.</div>}
  </section>;
}
function EditionClaudeHoje(p) {
  const { data, prazosRadar, prazosByDebt, opsById } = p;
  const [tab, setTab] = React.useState('proximos');
  const [cargaW, setCargaWS] = React.useState(() => (cxLs('nexus_cx_carga_weeks', '3') === '6' ? 6 : 3));
  const setCargaW = (v) => { setCargaWS(v); cxLsSet('nexus_cx_carga_weeks', String(v)); };
  const queue = React.useMemo(() => cxBuildQueue(data, prazosByDebt, opsById), [data, prazosByDebt, opsById]);
  const continueQueue = React.useMemo(() => cxContinueQueue(data), [data]);
  const intims = data.intimations || [];
  const open = intims.filter(cxIsOpen);
  const tribCounts = cxTribCounts(intims);
  const late = open.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d < 0; });
  const today = open.filter(x => daysUntil(x.dateDeadline) === 0);
  const next5 = open.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d >= 0 && d <= 5; });
  // Número único dos prazos extintivos: soma da fileira 1 da Mesa (a mesma do menu).
  const mc = p.mesaCards;
  const mesaAct = React.useMemo(() => mesaActionCount(mc.totals), [mc]);
  const n1 = mesaAct.n;
  const riskVal = mesaAct.value;
  const activeOps = (data.operations || []).filter(o => o.status !== 'encerrada' && !isSubstituicaoOp(o));
  const activeDebts = (data.debts || []).filter(d => d.status !== 'extinta');
  const debtTotal = activeDebts.reduce((s, d) => s + (d.value || 0), 0);
  const guarTotal = activeDebts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  const gpct = debtTotal > 0 ? Math.round(guarTotal / debtTotal * 100) : 0;
  const cartInd = indispStats(data.assets || [], debtTotal);
  const todayIso = localIso(new Date());
  const atuacoes = atuacoesSemana(intims, todayIso);
  const janela = janelaPrazos(open, todayIso);
  const mesaRows = React.useMemo(() => cxMesaActionRows(mc, todayIso), [mc, todayIso]);
  const termo = proximoTermo(mesaRows, todayIso);
  const cargaIts = React.useMemo(() => cargaItens(data, todayIso, { isOpenIntim: cxIsOpen, isOpenTask: cxTaskOpen, intimLabel: cxPartyName, hearingLabel: h => CX_HEARING[h.hearingType] || 'Audiência', taskLabel: t => t.title || t.description || 'Tarefa' }), [data, todayIso]);
  const mapa = React.useMemo(() => cargaMapa(cargaIts, { today: todayIso, weeks: cargaW }), [cargaIts, todayIso, cargaW]);
  const nextAud = cargaIts.filter(x => x.kind === 'h' && x.dd >= 0).sort((a, b) => a.dd - b.dd || String(a.iso).localeCompare(String(b.iso)))[0];
  const resumoCargaTxt = resumoCarga(mapa, nextAud ? { dias: nextAud.dd, time: nextAud.ref.time || '' } : null);
  const atencao = React.useMemo(() => atencaoItens({ rows: mesaRows, operations: (data.operations || []).filter(o => !isSubstituicaoOp(o)), reviewOf: (op) => { const rs = cxRS(op); return { overdue: rs.overdue, daysLeft: rs.daysLeft, intervalLabel: ((REVIEW_INTERVALS[op.reviewInterval || 'mensal'] || {}).label || '').toLowerCase() }; } }), [prazosRadar, data.operations]);

  // Entradas por dia útil (data de envio do eproc), últimos 14 dias úteis
  const intake = React.useMemo(() => {
    const days = [];
    const d = new Date(); d.setHours(0, 0, 0, 0);
    let guard = 0;
    while (days.length < 14 && guard++ < 40) { if (d.getDay() !== 0 && d.getDay() !== 6) days.unshift(localIso(d)); d.setDate(d.getDate() - 1); }
    const count = {};
    intims.forEach(x => { const k = toDayKey(x.dateSent); if (k) count[k] = (count[k] || 0) + 1; });
    return days.map(k => count[k] || 0);
  }, [intims]);
  const intakeMax = Math.max(1, ...intake);

  const lists = {
    proximos: queue.filter(x => !x.doneIso && x.due !== null && x.due >= 0 && x.due <= 7).sort((a, b) => a.due - b.due),
    vencidos: queue.filter(x => !x.doneIso && x.due !== null && x.due < 0).sort((a, b) => a.due - b.due),
    feitos: queue.filter(x => x.doneIso).sort((a, b) => String(b.doneIso).localeCompare(String(a.doneIso))),
  };
  const shown = lists[tab];
  const upcoming = queue.filter(x => !x.doneIso && x.kind !== 'Prescrição' && x.due !== null && x.due >= 0 && x.due <= 7).sort((a, b) => a.due - b.due);
  const buckets = [['Hoje', upcoming.filter(x => x.due === 0)], ['Amanhã', upcoming.filter(x => x.due === 1)], ['Próximos 7 dias', upcoming.filter(x => x.due > 1)]];
  const hearing = queue.filter(x => x.kind === 'Audiência' && x.due !== null && x.due >= 0 && x.due <= 2).sort((a, b) => a.due - b.due)[0];

  const carteira = React.useMemo(() => activeOps.map(o => {
    const debts = activeDebts.filter(d => d.operationId === o.id);
    const total = debts.reduce((s, d) => s + (d.value || 0), 0);
    const guar = debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
    const ind = indispStats((data.assets || []).filter(a => a.operationId === o.id), total);
    const nx = open.filter(x => x.operationId === o.id && x.dateDeadline).sort(cxByDeadline)[0];
    const targets = (data.people || []).filter(pp => pp.operationId === o.id && pp.operationRole === 'alvo');
    const cls = getOpClassifications(o)[0];
    return { o, total, guar, ind, nx, targets, cls };
  }).sort((a, b) => b.total - a.total), [data, activeOps.length]);

  const activity = React.useMemo(() => {
    const labels = { status: 'Situação', responseAction: 'Atuação', dateDeadline: 'Prazo final', prescriptionHandled: 'Prescrição tratada', prescriptionDate: 'Data de prescrição', value: 'Valor', processTag: 'Natureza', hasGuarantee: 'Garantia', prescriptionInterrupted: 'Presc. interrompida', classifications: 'Classificação', dueDate: 'Vencimento' };
    const stLabel = (v) => (INTIM_STATUSES[v] || TASK_STATUSES[v] || EXEC_STATUSES[v] || {}).label || v;
    return (data.changeLog || []).slice(0, 6).map(le => {
      let txt;
      if (le.field === 'responseAction') txt = 'Atuação registrada';
      else if (le.field === 'status') txt = (labels.status) + ': ' + stLabel(le.from) + ' → ' + stLabel(le.to);
      else txt = (labels[le.field] || le.field) + ': ' + truncate(le.from, 24) + ' → ' + truncate(le.to, 24);
      return { id: le.id, ref: le.ref, txt, at: le.date, ic: le.col === 'debts' ? 'hourglass' : le.col === 'intimations' ? 'inbox' : le.col === 'tasks' ? 'check' : le.col === 'executions' ? 'scale' : 'history' };
    });
  }, [data.changeLog]);
  // Cartão "Atividade": 5 últimos registros relevantes de hoje, vindos da trilha; sem trilha, cai para o changeLog acima.
  const [trail, setTrail] = React.useState(null);
  React.useEffect(() => {
    if (!p.activity) return undefined;
    let dead = false;
    const t = setTimeout(() => {
      const day = dayKey(new Date());
      (p.activity.listLocal || p.activity.list)(day, day).then(r => { if (!dead) setTrail((r || []).filter(e => !e.minor && e.kind !== 'sistema').sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 5)); }).catch(() => { if (!dead) setTrail([]); });
    }, 1200);
    return () => { dead = true; clearTimeout(t); };
  }, [p.activity, data.changeLog]);
  const lastImport = React.useMemo(() => (data.importLogs || []).slice().sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))[0], [data.importLogs]);

  const openItem = (x) => {
    if (x.intim) p.onOpenIntim(x.intim.id);
    else if (x.task) p.onOpenTask(x.task);
    else if (x.hearing) p.onOpenHearing(x.hearing);
    else if (x.g) p.openPrazos(x.g);
  };
  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Bom dia.' : hr < 18 ? 'Boa tarde.' : 'Boa noite.';
  const now = new Date();
  const lede = [];
  if (late.length) lede.push(<b key="l">{cxPl(late.length, 'prazo vencido', 'prazos vencidos')}</b>);
  if (today.length) lede.push(<b key="t">{today.length === 1 ? '1 vence hoje' : today.length + ' vencem hoje'}</b>);
  if (!lede.length) lede.push(<span key="n">nenhum prazo vencido ou vencendo hoje</span>);

  return <div className="cx cx-page">
    <div className="cx-eyebrow">{CX_DOW_L[now.getDay()]}, {now.getDate()} de {CX_MES_L[now.getMonth()]}</div>
    <h1 className="cx-hello">{hello} O que exige ação hoje?</h1>
    <p className="cx-lede">
      Na sua fila: {lede.length === 2 ? [lede[0], ' e ', lede[1]] : lede}
      {hearing ? <>. {cxCap(hearing.title.split(' · ')[0].toLowerCase())} <b>{hearing.due === 0 ? 'hoje' : hearing.due === 1 ? 'amanhã' : 'em ' + hearing.due + ' dias'}{hearing.hearing.time ? ', ' + hearing.hearing.time : ''}</b></> : null}
      {n1 ? <>. {n1 === 1 ? '1 CDA pede' : n1 + ' CDAs pedem'} providência na Mesa de prazos</> : null}.
    </p>

    <CxKpiStrip n={4} dense={false} className="cx-hoje-ks">
      <CxKpiCard label="Intimações abertas" value={open.length} nested onClick={() => p.onNav('intimacoes')}
        tag={tribCounts.length ? <span className="cx-kc-tribs">{tribCounts.map(([j, v]) => <button key={j} type="button" className="cx-mini" title={'Ver só ' + j + ' em Intimações'} onClick={e => { e.stopPropagation(); p.onOpenIntimUf(j); }}>{j}<b>{v.total}</b></button>)}</span> : null}
        side={<span className="cx-kc-spark" title="Intimações recebidas por dia útil (data de envio), últimos 14 dias úteis" aria-hidden="true">{intake.map((v, k) => <i key={k} className={k === intake.length - 1 ? 'last' : ''} style={{ height: Math.max(4, v / intakeMax * 100) + '%' }} />)}</span>}
        desc={<>{late.length ? <span className="cx-red-t">{cxPl(late.length, 'vencida', 'vencidas')}</span> : '0 vencidas'} · {today.length} hoje</>}
        foot={<>Atuadas em 7 dias: <b>{atuacoes.atual}</b></>}
        delta={atuacoes.delta !== 0 ? { txt: (atuacoes.delta > 0 ? '+' : '−') + Math.abs(atuacoes.delta) + ' vs. anteriores', dir: atuacoes.delta > 0 ? 'up' : 'down', tone: atuacoes.delta > 0 ? 'good' : 'bad' } : null}
        footR={atuacoes.delta === 0 && atuacoes.anterior > 0 ? 'igual aos 7 anteriores' : null} />
      <CxKpiCard label="Vencem em 5 dias" value={next5.length} onClick={() => p.onNav('intimacoes')}
        desc={<span className="cx-orange-t">{next5.filter(x => intimImpKey(x) === 'alta').length} de importância alta</span>}
        foot={janela.proximo ? <>Próximo: <b>{cxDue(janela.proximo.dd, janela.proximo.iso).txt}</b></> : 'Nenhum prazo aberto'}
        delta={janela.delta !== 0 ? { txt: (janela.delta > 0 ? '+' : '−') + Math.abs(janela.delta) + ' nos 5 seguintes', dir: janela.delta > 0 ? 'up' : 'down', tone: 'neutral' } : null} />
      <CxKpiCard label="Prazos extintivos" value={n1} unit={n1 === 1 ? 'CDA' : 'CDAs'} onClick={() => p.onOpenMesa('')}
        tip="Mesmo número do menu: soma dos cartões Conferir o cálculo, Ajuizar (até 60 dias), Lançar fato, Confirmar vigência e Completar dado"
        desc={<span className="cx-violet-t">{n1 ? cxMoneyShort(riskVal) + ' a agir' : 'Situação controlada'}</span>}
        foot={termo ? <>Próximo termo: <b>{fmtDate(termo.iso)}</b></> : 'Nenhuma CDA a agir'}
        footR={termo ? cxHorizonTxt(termo.dias) : null} footRTone="violet" />
      <CxKpiCard label="Crédito sob gestão" value={cxMoneyShort(debtTotal)} onClick={() => p.onNav('operacoes')}
        tip={[CX_INDISP_RING, cxIndispSplit(cartInd), CX_INDISP_DUP].filter(Boolean).join(' · ')}
        side={debtTotal > 0 ? <span className="cx-kc-ring"><CxRing pct={cartInd.pct || 0} size={44} stroke={6} label={cxIndispPctTxt(cartInd) + ' indisponível'} /></span> : null}
        desc={(debtTotal > 0 ? (cartInd.over ? indispRatioText(cartInd.ratio) : cxIndispPctTxt(cartInd)) + ' indisponível' : 'sem dívida') + ' · ' + gpct + '% garantido'}
        foot={<><b>{cxMoneyShort(cartInd.totalVal)}</b> indisponível</>} footR={cxPl(activeOps.length, 'operação', 'operações')} />
    </CxKpiStrip>

    <CxCargaCard mapa={mapa} weeks={cargaW} setWeeks={setCargaW} resumo={resumoCargaTxt} onOpenDay={(iso) => p.onOpenAgendaDay(iso)} onVencidos={() => setTab('vencidos')} />

    <div className="cx-home-grid">
      <div className="cx-col">
        {continueQueue.length ? <section className="cx-card" aria-labelledby="cx-h-cont">
          <div className="cx-card-h"><h2 id="cx-h-cont">Continuar de onde parou</h2><div className="cx-aside"><span className="cx-muted cx-small">{cxPl(continueQueue.length, 'peça pela metade', 'peças pela metade')}</span></div></div>
          {continueQueue.slice(0, 8).map(it => <div key={it.key} className="cx-cont-row">
            <div className="cx-minw0">
              <div className="cx-cont-p"><span className="cx-ell">{it.title}</span>{it.iso ? <span className="cx-muted cx-small cx-mono"> · final {cxDM(it.iso)}</span> : null}</div>
              <div className="cx-cont-s"><CxEstProgress esteira={it.intim ? it.intim.esteira : it.task.esteira} size="sm" /><b>{it.info.etapa.label}</b><span className="cx-muted"> · {esteiraStoppedLabel(it.updatedAt)}</span>{it.info.etapa.note ? <><span className="cx-muted"> · </span><i className="cx-cont-note cx-ell">“{it.info.etapa.note}”</i></> : null}</div>
            </div>
            <button type="button" className="cx-btn sm" onClick={() => it.intim ? p.onOpenIntim(it.intim.id) : p.onOpenTask(it.task)}>Retomar</button>
          </div>)}
        </section> : null}
        <section className="cx-card" aria-labelledby="cx-h-fila">
          <div className="cx-card-h">
            <h2 id="cx-h-fila">Fila do dia</h2>
            <div className="cx-aside">
              <CxChips sm label="Filtro da fila" value={tab} onChange={setTab} options={[['proximos', 'Próximos', lists.proximos.length], ['vencidos', 'Vencidos', lists.vencidos.length], ['feitos', 'Feitos', lists.feitos.length]]} />
              <button type="button" className="cx-link-btn" onClick={() => p.onStartFocus()} title="Triagem das intimações, uma por vez"><CxIcon n="zap" s={13} />Foco</button>
            </div>
          </div>
          {shown.length ? shown.slice(0, 12).map(x => <button key={x.key} type="button" className="cx-q-row" onClick={() => openItem(x)}>
            <span className="cx-q-ic">{x.st ? <CxStatusIcon s={x.st} /> : <CxIcon n={x.ic} s={14} />}</span>
            <span className="cx-q-main"><span className="cx-q-title">{x.intim && intimIsUrgent(x.intim) && !x.doneIso ? <span className="cx-urg">URGENTE</span> : null}<b>{x.title}</b></span><span className="cx-q-meta">{x.sub}</span></span>
            <span className="cx-kind">{x.kind}</span>
            <span className="cx-q-glyph">{x.intim ? <CxImp intim={x.intim} /> : x.prio ? <CxPrio v={x.prio} /> : x.g ? <span className="cx-gnum" style={{ '--c': x.g === 1 ? 'var(--cx-red)' : 'var(--cx-orange)' }}>{x.g}</span> : null}</span>
            <span className="cx-q-due">{x.doneIso ? <CxDue doneIso={x.doneIso} /> : <CxDue iso={x.iso} dd={x.due} />}</span>
          </button>) : <div className="cx-empty-row">{tab === 'vencidos' ? 'Nenhum prazo vencido.' : tab === 'feitos' ? 'Nenhuma atuação registrada nos últimos 7 dias.' : 'Nada para os próximos 7 dias.'}</div>}
          {shown.length > 12 ? <div className="cx-more">+{shown.length - 12} na lista completa</div> : null}
        </section>

        <section className="cx-card" aria-labelledby="cx-h-pz">
          <div className="cx-card-h"><h2 id="cx-h-pz">Prazos extintivos</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={() => p.onOpenMesa('')}>Mesa<CxIcon n="chevR" s={13} /></button></div></div>
          <div className="cx-pz-embed"><CxMesaStrip mc={mc} mini onOpen={p.onOpenMesa} /></div>
        </section>

        <section className="cx-card" aria-labelledby="cx-h-cart">
          <div className="cx-card-h"><h2 id="cx-h-cart">Carteira</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={() => p.onNav('operacoes')}>Todas as operações<CxIcon n="chevR" s={13} /></button></div></div>
          {carteira.length ? <div className="cx-tbl-wrap"><table className="cx-tbl">
            <thead><tr><th>Operação</th><th>Classificação</th><th>Indisponível</th><th className="num">Dívida</th><th>Próximo prazo</th><th>Alvos</th></tr></thead>
            <tbody>{carteira.slice(0, 8).map(r => {
              const gp = r.total > 0 ? Math.round(r.guar / r.total * 100) : 0;
              const cls = r.cls ? OP_CLASSIFICATIONS[r.cls] : null;
              const ipTip = [cxIndispSplit(r.ind) || 'sem bens indisponíveis com valor', gp + '% garantido'].join(' · ');
              return <tr key={r.o.id} className="click" onClick={() => p.onOpenOp(r.o.id)}>
                <td><span className="cx-op-cell" title={r.o.name}><CxOpTile op={r.o} size={26} /><span className="cx-ell">{cxOpName(r.o)}</span></span></td>
                <td>{cls ? <span className="cx-pill"><span className="cx-dot" style={{ background: cls.color }} />{cls.label}</span> : <span className="cx-muted">—</span>}</td>
                <td title={ipTip}><span className="cx-cover"><CxRing pct={r.ind.pct || 0} size={26} stroke={4} label={cxIndispPctTxt(r.ind) + ' indisponível'} /><span className="cx-pct">{r.ind.pct === null ? '0%' : cxIndispPctTxt(r.ind)}</span></span></td>
                <td className="num cx-mono">{r.total ? cxMoneyShort(r.total) : '—'}</td>
                <td>{r.nx ? <CxDue iso={r.nx.dateDeadline} /> : <span className="cx-muted">—</span>}</td>
                <td>{r.targets.length ? <CxAvatars people={r.targets} /> : <span className="cx-muted">—</span>}</td>
              </tr>;
            })}</tbody>
          </table></div> : <div className="cx-empty-row">Nenhuma operação ativa.</div>}
          {carteira.length > 8 ? <div className="cx-more">+{carteira.length - 8} operações na Carteira</div> : null}
        </section>
      </div>

      <div className="cx-col">
        {hearing ? <div className="cx-callout" role="note">
          <span className="cx-callout-ic"><CxIcon n="gavel" s={16} /></span>
          <div className="cx-minw0">
            <div className="cx-callout-t">{hearing.title.split(' · ')[0]} {hearing.due === 0 ? 'hoje' : hearing.due === 1 ? 'amanhã' : 'em ' + hearing.due + ' dias'}{hearing.hearing.time ? ', ' + hearing.hearing.time : ''}</div>
            <div className="cx-callout-s">{hearing.hearing.parties || '—'}</div>
            <div className="cx-callout-s">{hearing.hearing.processNumber ? <CxProc num={hearing.hearing.processNumber} /> : null}{hearing.hearing.modality ? ' · ' + (hearing.hearing.modality === 'virtual' ? 'Virtual' : 'Presencial') : ''}</div>
            <div className="cx-callout-a">
              <button type="button" className="cx-btn sm" onClick={() => p.onOpenHearing(hearing.hearing)}><CxIcon n="file" s={13} />Abrir audiência</button>
              {hearing.opId ? <button type="button" className="cx-btn sm ghost" onClick={() => p.onOpenOp(hearing.opId)}>Abrir operação</button> : null}
            </div>
          </div>
        </div> : null}

        <CxAtencaoCard atencao={atencao} today={todayIso} opsById={opsById} onOpenCda={p.onOpenCda} onReviewed={p.onReviewed} onOpenPrazos={() => p.onOpenMesa('')} onOpenCarteira={() => p.onNav('operacoes')} />

        <section className="cx-card" aria-labelledby="cx-h-prox">
          <div className="cx-card-h"><h2 id="cx-h-prox">Próximos prazos</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={() => p.onNav('audiencias')}><CxIcon n="calendar" s={13} />Agenda</button></div></div>
          {upcoming.length === 0 ? <div className="cx-empty-row">Nada nos próximos 7 dias.</div> : buckets.map(b => b[1].length ? <div key={b[0]}>
            <div className="cx-dl-h"><b>{b[0]}</b><span>{b[1].length}</span></div>
            {b[1].slice(0, 6).map(x => <button key={x.key} type="button" className="cx-dl-item" onClick={() => openItem(x)}>
              <CxOpSquare opId={x.opId} />
              <span className="cx-t">{x.intim ? (x.sub || x.title) : x.title}</span>
              {x.intim ? <CxImp intim={x.intim} /> : x.prio ? <CxPrio v={x.prio} /> : <CxIcon n={x.ic} s={13} className="cx-muted" />}
              {b[0] === 'Próximos 7 dias' ? <span className="cx-due later cx-dl-dow">{cxCap(CX_DOW[(cxDate(x.iso) || new Date()).getDay()]) + ' ' + cxDM(x.iso)}</span> : null}
            </button>)}
            {b[1].length > 6 ? <div className="cx-more">+{b[1].length - 6} mais</div> : null}
          </div> : null)}
          <div style={{ height: 6 }} />
        </section>

        <section className="cx-card" aria-labelledby="cx-h-act">
          <div className="cx-card-h"><h2 id="cx-h-act">{trail && trail.length ? 'Atividade' : 'Atividade recente'}</h2><div className="cx-aside">
            {!(trail && trail.length) && lastImport ? <span className="cx-muted cx-small" title={'Último import: ' + new Date(lastImport.timestamp).toLocaleString('pt-BR')}>Import {cxRelTime(lastImport.timestamp)}</span> : null}
            {p.onOpenAtividade ? <button type="button" className="cx-link-btn" onClick={p.onOpenAtividade}>ver tudo →</button> : null}
          </div></div>
          {trail && trail.length ? trail.map(e => <div key={e.id} className="cx-act">
            <span className="cx-act-tm" style={{ paddingTop: 2, minWidth: 38 }}>{cxActTime(e.ts)}</span>
            <div className="cx-minw0"><div style={{ fontWeight: 500 }}>{e.summary}</div>{e.op && e.op.name ? <div className="cx-act-txt cx-ell">{e.op.name}</div> : null}</div>
          </div>)
          : activity.length ? activity.map(a => <div key={a.id} className="cx-act">
            <span className="cx-act-ic"><CxIcon n={a.ic} s={12} /></span>
            <div className="cx-minw0"><div className="cx-ell" style={{ fontWeight: 500 }}>{a.ref}</div><div className="cx-act-txt">{a.txt}</div><time>{cxRelTime(a.at)}</time></div>
          </div>) : <div className="cx-empty-row">As mudanças de situação, prazos e atuações aparecem aqui.</div>}
        </section>
      </div>
    </div>
  </div>;
}

/* ═════════════════════ Intimações ═════════════════════ */
function cxGroupIntims(items, by, opsById) {
  const open = items.filter(cxIsOpen);
  const analis = items.filter(x => !x.responseAction && x.status === 'analisado');
  const dot = (c) => <span className="cx-dot" style={{ background: c }} />;
  let groups;
  if (by === 'situacao') {
    groups = CX_ST_ORDER.filter(s => s !== 'analisado').map(s => ({ key: s, label: CX_ST[s].l, icon: <CxStatusIcon s={s} />, items: open.filter(x => x.status === s) }));
  } else if (by === 'operacao') {
    const ids = [];
    open.forEach(x => { const k = x.operationId || ''; if (!ids.includes(k)) ids.push(k); });
    groups = ids.map(id => { const op = opsById.get(id); return { key: 'op' + id, label: op ? cxOpName(op) : 'Sem operação', sortKey: op ? cxOpName(op) : '\uffff', icon: op ? <CxOpSquare op={op} /> : dot('var(--cx-line-strong)'), items: open.filter(x => (x.operationId || '') === id) }; })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'pt-BR'));
  } else if (by === 'uf') {
    const ufs = [];
    open.forEach(x => { const k = x.jurisdiction || '?'; if (!ufs.includes(k)) ufs.push(k); });
    groups = ufs.sort((a, b) => (jurisRank(a) - jurisRank(b)) || a.localeCompare(b)).map(u => {
      const items = open.filter(x => (x.jurisdiction || '?') === u);
      const abertos = items.filter(x => x.dateDeadline).length;
      const fechados = items.length - abertos;
      return { key: 'uf' + u, label: u === '?' ? 'Sem UF' : u, sub: cxPl(abertos, 'aberto', 'abertos') + ' · ' + cxPl(fechados, 'fechado', 'fechados'), icon: <span className="cx-uf">{u}</span>, items };
    });
  } else if (by === 'etapa') {
    const bucketOf = (x) => {
      if (!esteiraHasStarted(x.esteira)) return { key: 'none', label: 'Sem esteira', rank: 2 };
      const s = esteiraSummary(x.esteira);
      if (s.isComplete) return { key: 'done', label: 'Esteira concluída', rank: 1 };
      return { key: 'step:' + (s.current && s.current.id), label: (s.current && s.current.label) || 'Em andamento', rank: 0 };
    };
    const map = new Map();
    open.forEach(x => {
      const b = bucketOf(x);
      if (!map.has(b.key)) map.set(b.key, { key: b.key, label: b.label, rank: b.rank, icon: dot(b.rank === 0 ? 'var(--cx-blue)' : b.rank === 1 ? 'var(--cx-green)' : 'var(--cx-line-strong)'), items: [] });
      map.get(b.key).items.push(x);
    });
    groups = [...map.values()].sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label, 'pt-BR'));
  } else {
    const dd = (x) => daysUntil(x.dateDeadline);
    groups = [
      { key: 'late', label: 'Vencidas', icon: dot('var(--cx-red)'), items: open.filter(x => { const d = dd(x); return d !== null && d < 0; }) },
      { key: 'now', label: 'Hoje e amanhã', icon: dot('var(--cx-orange)'), items: open.filter(x => { const d = dd(x); return d !== null && d >= 0 && d <= 1; }) },
      { key: 'soon', label: 'Próximos 5 dias', icon: dot('var(--cx-yellow)'), items: open.filter(x => { const d = dd(x); return d !== null && d >= 2 && d <= 5; }) },
      { key: 'later', label: 'Mais adiante', icon: dot('var(--cx-ink-3)'), items: open.filter(x => { const d = dd(x); return d !== null && d > 5; }) },
      { key: 'none', label: 'Sem prazo aberto', icon: dot('var(--cx-line-strong)'), items: open.filter(x => dd(x) === null) },
    ];
  }
  groups.push({ key: 'analis', label: 'Analisadas, sem atuação registrada', icon: <CxStatusIcon s="analisado" />, items: analis, closedDefault: true });
  return groups.filter(g => g.items.length);
}
function cxGroupResolved(items) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(today); week.setDate(week.getDate() - 7);
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const bucket = (x) => {
    const at = x.responseAction && x.responseAction.respondedAt;
    if (!at) return 'Sem data de atuação';
    const d = new Date(at); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'Hoje';
    if (d >= week) return 'Últimos 7 dias';
    if (d >= month) return 'Este mês';
    return 'Anteriores';
  };
  const order = ['Hoje', 'Últimos 7 dias', 'Este mês', 'Anteriores', 'Sem data de atuação'];
  return order.map(k => ({ key: 'r' + k, label: k, icon: <CxStatusIcon s="analisado" />, items: items.filter(x => bucket(x) === k) })).filter(g => g.items.length);
}
/* Card de intimação da lista (versão R do mockup prumo-intimacao-card-b2-extremos: D1 + sigla + Geist + prazo com
   contagem no tooltip). Quatro zonas: identidade (operação · sinais no topo, situação + parte, nº + sigla + Imp/Compl/peça,
   esteira) · Tribunal (objeto e teor da decisão) · Minhas notas · Prazo (só tempo: data final e embargos). Cálculos em
   src/lib/intim-card.js. Classes novas cx-ix-* / cx-it-*: Tarefas e Acompanhar seguem com cx-i-row/cx-c-*. */
function cxRaKind(ra) { return ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida'; }
function CxIntimRow({ intim, op, sel, onOpen, onOpenOp, L, hideOp }) {
  const ra = intim.responseAction;
  const resolved = !!ra;
  const done = resolved || intim.status === 'analisado';
  const urgent = intimIsUrgent(intim) && !done;
  const cls = intim.className || '';
  const sigla = intimClassSigla(cls);
  const obj = cxIntimObjeto(intim);
  const teor = intimationDecisionText(intim);
  const tl = intimTribLines(obj, teor, L.cplTr, L.budTr);
  const pz = intimPrazo(intim);
  const emb = intimEmbargos(intim);
  const notes = cxNotes(intim);
  const fit = resolved ? null : intimNotesFit(notes, L.cplNt, L.budNt);
  const hasNt = resolved || fit.shown.length > 0;
  const flag = intim._importFlag === 'new' ? <span className="cx-tag blue xs">Novo</span> : intim._importFlag === 'updated' ? <span className="cx-tag xs">Atualizada</span> : null;
  const tags = urgent || flag || intim.hasPending;
  const num = intimProcCnj(intim.processNumber);
  return <div className={'cx-ix' + (urgent ? ' urgent' : '') + (sel ? ' sel' : '') + (done ? ' done' : '') + (hasNt ? '' : ' nt-empty')} role="button" tabIndex={0}
    onClick={() => onOpen(intim.id)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(intim.id); } }}>
    <div className="cx-ix-id">
      {hideOp && !tags ? null : <div className="cx-it-opl">
        {hideOp ? <span /> : op
          ? <button type="button" className="cx-it-op cx-link" onClick={e => { e.stopPropagation(); if (onOpenOp) onOpenOp(op.id); }} title={'Abrir ' + op.name}><CxOpSquare op={op} size={8} /><span className="cx-ell">{cxOpName(op)}</span></button>
          : <span className="cx-it-op none"><CxOpSquare size={8} /><span className="cx-ell">Sem operação</span></span>}
        <span className="cx-it-tags">{urgent ? <span className="cx-urg">URGENTE</span> : null}{flag}{intim.hasPending ? <span className="cx-flag" title="Pendência marcada"><CxIcon n="flag" s={11} /></span> : null}</span>
      </div>}
      <div className="cx-ix-party"><CxStatusIcon s={resolved ? 'analisado' : intim.status} /><span className="cx-ell" title={cxPartyName(intim)}>{cxPartyName(intim)}</span></div>
      <div className="cx-ix-pc">
        <button type="button" className="cx-proc-copy" title="Copiar número do processo" onClick={e => { e.stopPropagation(); if (intim.processNumber) cxCopy(intim.processNumber); }}><CxProc num={num} uf={intim.jurisdiction} /></button>
        {sigla ? <span className="cx-ix-sg" title={cls}>{sigla}</span> : null}
        <span className="cx-ix-sig"><CxImp intim={intim} /><CxDif intim={intim} />{intim.minutaUrl ? <CxDocIcon url={intim.minutaUrl} size={14} /> : null}</span>
      </div>
      {!sigla && cls ? <div className="cx-ix-cls" title={cls}>{cls}</div> : null}
      <CxEstLine esteira={intim.esteira} />
    </div>
    <div className="cx-it-tr">
      <div className="cx-it-obj" style={{ '--ol': tl.ol }} title={obj || CX_OBJ_UNDEF_TXT}>{obj || <span className="cx-obj-undef">{CX_OBJ_UNDEF_TXT}</span>}</div>
      {teor ? <div className="cx-it-teor" style={{ '--tl': tl.tl }} title={teor}><span className="lbl">Decisão</span>{teor.replace(/\s*\n+\s*/g, ' ¶ ')}</div> : null}
    </div>
    <div className={'cx-it-nt' + (hasNt ? '' : ' empty')} title={resolved ? undefined : notes.join('\n')}>
      {resolved
        ? <div className="cx-it-note act" style={{ '--nl': 2 }}><span className="zl">Atuação</span>{cxRaKind(ra)}{ra.description ? ' · ' + ra.description : ''}</div>
        : <>{fit.shown.map((n, i) => <div key={i} className="cx-it-note" style={{ '--nl': n.l }}>{i === 0 ? <span className="zl">Notas</span> : null}{n.t}</div>)}
          {fit.rest ? <div className="cx-it-more">+{fit.rest} {fit.rest === 1 ? 'nota anterior' : 'notas anteriores'}</div> : null}</>}
    </div>
    <div className="cx-ix-pz">
      <span className={'cx-due ' + pz.tone} title={pz.title}>{pz.txt}</span>
      {emb ? <span className={'cx-emb ' + emb.tone} aria-label={emb.aria} title={emb.title}>{emb.txt}</span> : null}
    </div>
  </div>;
}
function EditionClaudeSubstituicao({ data, op, opsById, onOpen, onOpenOp }) {
  const items = (data.intimations || []).filter(x => x.operationId === op.id);
  const abertas = items.filter(cxIsOpen);
  const resolvidas = items.filter(x => !cxIsOpen(x));
  if (!items.length) {
    return <div className="cx cx-page"><div className="cx-page-h"><div><h1>Processos</h1><p>Nenhuma intimação ainda.</p></div></div>
      <div className="cx-empty-row" style={{ borderTop: 0 }}>Na ficha da intimação, em Operação vinculada, escolha EM SUBSTITUIÇÃO.</div></div>;
  }
  const groups = [
    { key: 'ab', label: 'Abertas', items: abertas, icon: <CxStatusIcon s="pendente_analise" />, closedDefault: false },
    { key: 'rs', label: 'Resolvidas', items: resolvidas, icon: <CxStatusIcon s="analisado" />, closedDefault: true }
  ];
  return <div className="cx cx-page">
    <div className="cx-page-h"><div><h1>Processos</h1><p>{cxPl(abertas.length, 'aberta', 'abertas')} · {cxPl(resolvidas.length, 'resolvida', 'resolvidas')}. O card é o mesmo da aba Intimações.</p></div></div>
    <CxIntimList items={items} groups={groups} sort="atencao" onOpen={onOpen} onOpenOp={onOpenOp} opsById={opsById} hideOp />
  </div>;
}
function CxIntimList({ items, groups, sort, onOpen, onOpenOp, selId, opsById, emptyText, hideOp }) {
  const [closed, setClosed] = React.useState({});
  const ref = React.useRef(null);
  const [w, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const m = () => setW(el.clientWidth);
    m();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(m) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', m);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', m); };
  }, [groups.length > 0]);
  if (!groups.length) return <div className="cx-list"><div className="cx-empty-row" style={{ borderTop: 0 }}>{emptyText || 'Nenhuma intimação com esses filtros.'}</div></div>;
  const L = intimCardLayout(w || 1200);
  return <div className="cx-list cx-it-list" ref={ref}>
    <div className="cx-ix-h"><span className="h-id"><b>Parte</b>processo · esteira</span>
      <span className="h-tr"><b>Tribunal</b><span className="w-only">objeto · decisão</span><span className="m-only">· minhas notas</span></span>
      <span className="h-nt"><b>Minhas notas</b>o que fazer</span><span className="h-pz"><b>Prazo</b>embargos</span></div>
    {groups.map(g => {
      const isClosed = closed[g.key] != null ? closed[g.key] : !!g.closedDefault;
      const sorted = g.items.slice().sort(cxSortFn(sort));
      return <React.Fragment key={g.key}>
        <button type="button" className={'cx-grp' + (isClosed ? ' closed' : '')} aria-expanded={!isClosed} onClick={() => setClosed(c => ({ ...c, [g.key]: !isClosed }))}>
          <span className="cx-caret"><CxIcon n="chevD" s={14} /></span>{g.icon}<span>{g.label}</span><span className="cx-n">{g.items.length}</span>{g.sub ? <span className="cx-grp-sub">· {g.sub}</span> : null}
        </button>
        {isClosed ? null : sorted.map(x => <CxIntimRow key={x.id} intim={x} op={opsById.get(x.operationId)} sel={selId === x.id} onOpen={onOpen} onOpenOp={onOpenOp} L={L} hideOp={hideOp} />)}
      </React.Fragment>;
    })}
  </div>;
}
function CxBoard({ items, sort, onOpen, onSetStatus, opsById }) {
  const [over, setOver] = React.useState(null);
  return <div className="cx-board">{CX_ST_ORDER.map(s => {
    const col = items.filter(x => x.status === s).sort(cxSortFn(sort));
    return <div key={s} className={'cx-b-col' + (over === s ? ' over' : '')}
      onDragOver={e => { e.preventDefault(); if (over !== s) setOver(s); }}
      onDragLeave={() => setOver(o => (o === s ? null : o))}
      onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) onSetStatus(id, s); }}>
      <div className="cx-b-h"><CxStatusIcon s={s} />{CX_ST[s].l}<span className="cx-n">{col.length}</span></div>
      <div className="cx-b-list">{col.length ? col.map(x => {
        const notes = cxNotes(x);
        const done = x.status === 'analisado';
        return <button key={x.id} type="button" className="cx-b-card" draggable onDragStart={e => e.dataTransfer.setData('text/plain', x.id)} onClick={() => onOpen(x.id)}>
          <span className="cx-b-row"><CxOpTag op={opsById.get(x.operationId)} />{x.minutaUrl ? <CxDocIcon url={x.minutaUrl} size={14} /> : null}<CxDue iso={x.dateDeadline} /></span>
          <span className="cx-b-row" style={{ fontWeight: 500 }}>{intimIsUrgent(x) && !done ? <span className="cx-urg">URGENTE</span> : null}<span className="cx-ell">{cxPartyName(x)}</span></span>
          <span className="cx-b-ev"><CxObj intim={x} /></span>
          {notes.length ? <span className="cx-b-nt">{notes[notes.length - 1]}</span> : null}
          <span className="cx-b-row"><CxProc num={x.processNumber} /><span className="cx-b-glyphs"><CxImp intim={x} /><CxDif intim={x} /></span></span>
        </button>;
      }) : <div className="cx-b-empty">Arraste um cartão para cá</div>}</div>
    </div>;
  })}</div>;
}
function CxTribBar({ counts, active, onToggle }) {
  if (!counts.length) return null;
  return <div className="cx-trib" aria-label="Intimações ativas por tribunal">
    <span className="cx-trib-k">Por tribunal</span>
    {counts.map(([j, v]) => {
      const pct = v.total > 0 ? Math.round(v.abertos / v.total * 100) : 0;
      const on = active === j;
      const name = CX_TRIB_NAMES[j] || j;
      const aria = name + ': ' + cxPl(v.abertos, 'aberto', 'abertos') + ', ' + cxPl(v.fechados, 'fechado', 'fechados') + ', ' + cxPl(v.total, 'total ativa', 'total ativas') + '. ' + (on ? 'Clique para limpar o filtro.' : 'Clique para ver só ' + j + '.');
      return <button key={j} type="button" className={'cx-tb' + (on ? ' on' : '')} aria-pressed={on} aria-label={aria} onClick={() => onToggle(j)}>
        <span className="cx-uf">{j}</span>
        <span className="cx-tb-n">{v.total}</span>
        <span className="cx-tb-bar"><i style={{ width: pct + '%' }} /></span>
        {on ? <span className="cx-tb-x" aria-hidden="true">✕</span> : null}
        <span className="cx-tb-tip" role="tooltip">
          <b>{name}</b>
          <div className="cx-tb-tip-r"><span>Abertos (com prazo)</span><span>{v.abertos}</span></div>
          <div className="cx-tb-tip-r"><span>Fechados (sem prazo)</span><span>{v.fechados}</span></div>
          <div className="cx-tb-tip-r"><span>Total ativas</span><span>{v.total}</span></div>
          <small>{on ? 'Clique para limpar o filtro' : 'Clique para ver só ' + j}</small>
        </span>
      </button>;
    })}
  </div>;
}
function EditionClaudeIntimacoes(p) {
  const { data, opsById, view, setView } = p;
  const [q, setQ] = React.useState('');
  const [opFRaw, setOpF] = React.useState('all');
  const [scope, setScope] = React.useState('ativas');
  const [ufFilter, setUfFilter] = React.useState(() => p.initialUf || null);
  React.useEffect(() => { if (p.initialUf && p.onInitialUfConsumed) p.onInitialUfConsumed(); }, []);
  const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const [groupBy, setGroupByS] = React.useState(() => lsGet('nexus_cx_group', 'prazo'));
  const [sort, setSortS] = React.useState(() => lsGet('nexus_cx_sort', 'atencao'));
  const setGroupBy = (v) => { setGroupByS(v); try { localStorage.setItem('nexus_cx_group', v); } catch (e) { /* ignore */ } };
  const setSort = (v) => { setSortS(v); try { localStorage.setItem('nexus_cx_sort', v); } catch (e) { /* ignore */ } };
  const all = data.intimations || [];
  const opF = (opFRaw === 'all' || opFRaw === 'none' || (opsById.has(opFRaw) && all.some(x => x.operationId === opFRaw))) ? opFRaw : 'all';
  const opIds = [...new Set(all.map(x => x.operationId).filter(Boolean))];
  const opOptions = [['all', 'Todas'], ['none', 'Sem operação']].concat(opIds.map(id => opsById.get(id)).filter(Boolean).sort(sortOpsByName).map(o => [o.id, cxOpName(o)]));
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  const filtered = all.filter(x => {
    if (scope === 'ativas' ? !!x.responseAction : !x.responseAction) return false;
    if (opF === 'none' ? !!x.operationId : opF !== 'all' && x.operationId !== opF) return false;
    if (ufFilter && (x.jurisdiction || '?') !== ufFilter) return false;
    if (!toks.length) return true;
    const hay = cxNorm([cxPartyName(x), x.parties, x.eventDescription, x.className, x.subject, x.object, x.processNumber, (opsById.get(x.operationId) || {}).name, cxNotes(x).join(' ')].join(' '));
    const dig = String(x.processNumber || '').replace(/\D/g, '');
    return toks.every(t => hay.includes(t) || (t.replace(/\D/g, '').length >= 3 && dig.includes(t.replace(/\D/g, ''))));
  });
  const open = all.filter(cxIsOpen);
  const late = open.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d < 0; }).length;
  const resolvedCount = all.filter(x => !!x.responseAction).length;
  const groups = scope === 'ativas' ? cxGroupIntims(filtered, groupBy, opsById) : cxGroupResolved(filtered);
  const tribCounts = cxTribCounts(all, opF);
  const openInUf = ufFilter ? open.filter(x => (x.jurisdiction || '?') === ufFilter).length : null;
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Intimações</h1>
        <p>{ufFilter ? <>{openInUf} de {open.length} abertas · só {ufFilter}</> : <>{cxPl(open.length, 'aberta', 'abertas')}, {cxPl(late, 'vencida', 'vencidas')}</>}. Ordem padrão: urgente, importância, complexidade e prazo.</p>
        <CxTribBar counts={tribCounts} active={ufFilter} onToggle={j => setUfFilter(f => f === j ? null : j)} />
      </div>
      <div className="cx-acts">
        <button type="button" className="cx-btn" onClick={p.onImportEproc}><CxIcon n="upload" s={14} />Importar eproc</button>
        <button type="button" className="cx-btn" onClick={p.onNewIntim}><CxIcon n="plus" s={14} />Nova intimação</button>
        <CxSeg className="lg" label="Visualização" value={view} onChange={setView} options={[['lista', 'Lista', 'list'], ['quadro', 'Quadro', 'board'], ['foco', 'Foco', 'zap']]} />
      </div>
    </div>
    {view === 'foco' ? <EditionClaudeFocus {...p} /> : <>
      <div className="cx-toolbar">
        <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-f-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Parte, processo, evento ou nota" aria-label="Filtrar intimações" /></label>
        <CxSelect id="cx-f-op" pre="Operação" value={opF} onChange={setOpF} options={opOptions} label="Filtrar por operação" />
        {view === 'lista' ? <CxChips sm label="Ativas ou resolvidas" value={scope} onChange={setScope} options={[['ativas', 'Ativas', all.length - resolvedCount], ['resolvidas', 'Resolvidas', resolvedCount]]} /> : null}
        <span className="cx-sp" />
        {view === 'lista' && scope === 'ativas' ? <CxSelect id="cx-f-g" pre="Agrupar" value={groupBy} onChange={setGroupBy} options={[['prazo', 'Prazo'], ['situacao', 'Situação'], ['operacao', 'Operação'], ['uf', 'UF'], ['etapa', 'Etapa']]} /> : null}
        <CxSelect id="cx-f-s" pre="Ordenar" value={sort} onChange={setSort} options={[['atencao', 'Atenção'], ['prazo', 'Prazo final'], ['importancia', 'Importância'], ['complexidade', 'Complexidade']]} />
      </div>
      {view === 'quadro'
        ? <CxBoard items={filtered.filter(cxIsActive)} sort={sort} onOpen={p.onOpenIntim} opsById={opsById} onSetStatus={(id, s) => { const x = all.find(i => i.id === id); if (x && x.status !== s) { p.upsert('intimations', { ...x, status: s }); cxNotify('Situação: ' + CX_ST[s].l); } }} />
        : <CxIntimList items={filtered} groups={groups} sort={sort} onOpen={p.onOpenIntim} onOpenOp={p.onOpenOp} selId={p.drawerId} opsById={opsById} emptyText={all.length ? null : 'Nenhuma intimação ainda. Use Nova intimação ou importe o XLS do eproc.'} />}
    </>}
  </div>;
}

/* ═════════════════════ Esteira da peça (UI) ═════════════════════
   Modelo: src/lib/esteira.js (concatenado pelo build, funções puras).
   intim.esteira / task.esteira = { etapas: [{id,label,tool,url,status,startedAt,doneAt,note}], updatedAt }.
   ═════════════════════════════════════════════════════════════════ */
function cxEstToolClass(tool) {
  const s = String(tool || '');
  if (/claude/i.test(s)) return 'cla';
  if (/gemini/i.test(s)) return 'gem';
  if (/pr[oó]pria/i.test(s)) return 'own';
  return 'oth';
}
/* Barrinha de N casas: verde feita, azul em andamento, cinza a fazer. */
function CxEstProgress({ esteira, size }) {
  const st = esteiraProgress(esteira);
  if (!st.length) return null;
  return <span className={'cx-est-prog' + (size === 'sm' ? ' sm' : '')} aria-hidden="true">{st.map((s, i) => <i key={i} className={s === 'done' ? 'd' : s === 'doing' ? 'n' : ''} />)}</span>;
}
/* Linha compacta para lista, Mesa e Hoje. Nada se a esteira não foi iniciada. */
function CxEstLine({ esteira }) {
  if (!esteiraHasStarted(esteira)) return null;
  const s = esteiraSummary(esteira);
  const label = s.isComplete ? 'Esteira concluída' : (s.current ? s.current.label : '—');
  const when = s.isComplete ? 'concluída ' + cxDM(esteira.updatedAt) : 'parou ' + esteiraStoppedLabel(esteira.updatedAt);
  return <div className="cx-i-est"><CxEstProgress esteira={esteira} size="sm" /><b className="cx-ell">{label}</b><span className="cx-muted"> · {when}</span></div>;
}

/* ⚙ → Esteira da peça: template editável (nome, ferramenta, link padrão). */
function CxEsteiraTemplateEditor({ template, onChange }) {
  const list = esteiraSanitizeTemplate(template && template.length ? template : ESTEIRA_DEFAULT_TEMPLATE);
  const upd = (id, patch) => onChange(esteiraTemplateUpdateStep(list, id, patch));
  return <div className="cx-est-tpl">
    {list.map((s, i) => <div key={s.id} className="cx-est-tpl-card">
      <div className="cx-est-tpl-top">
        <span className="cx-est-tpl-grip" aria-hidden="true">⠿</span>
        <span className="cx-est-tpl-n">Etapa {i + 1}</span>
        <span className="cx-sp" />
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => onChange(esteiraTemplateMoveStep(list, s.id, -1))} disabled={i === 0} title="Mover para cima" aria-label="Mover etapa para cima"><CxIcon n="chevU" s={12} /></button>
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => onChange(esteiraTemplateMoveStep(list, s.id, 1))} disabled={i === list.length - 1} title="Mover para baixo" aria-label="Mover etapa para baixo"><CxIcon n="chevD" s={12} /></button>
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => onChange(esteiraTemplateRemoveStep(list, s.id))} title="Remover etapa" aria-label="Remover etapa"><CxIcon n="x" s={12} /></button>
      </div>
      <input className="cx-input" value={s.label} onChange={e => upd(s.id, { label: e.target.value })} placeholder="Nome da etapa" aria-label={'Nome da etapa ' + (i + 1)} />
      <input className="cx-input" value={s.tool} onChange={e => upd(s.id, { tool: e.target.value })} placeholder="Ferramenta" aria-label={'Ferramenta da etapa ' + (i + 1)} />
      <input className="cx-input" value={s.url} onChange={e => upd(s.id, { url: e.target.value })} placeholder="Link padrão (opcional)" aria-label={'Link padrão da etapa ' + (i + 1)} />
    </div>)}
    <button type="button" className="cx-btn sm" onClick={() => onChange(esteiraTemplateAddStep(list))}><CxIcon n="plus" s={12} />Etapa</button>
    <div className="cx-muted cx-small" style={{ marginTop: 6 }}>Renomear ou reordenar vale para as próximas peças; as que já começaram guardam as etapas que tinham.</div>
  </div>;
}

/* Corpo da esteira (passos, começar, concluir, desfazer, nota e link por etapa).
   Usado na gaveta (bloco "Esteira da peça") e no formulário de tarefa (seção "Esteira da peça"). */
function CxEsteiraBody({ esteira, onChange, template, onSuggestStatus }) {
  const est = esteira;
  const set = onChange;
  if (!est || !est.etapas || !est.etapas.length) {
    return <div className="cx-est-empty">
      <span className="cx-muted cx-small">Esteira não iniciada.</span>
      <button type="button" className="cx-btn sm" onClick={() => { set(esteiraBegin(template)); if (onSuggestStatus) onSuggestStatus('begin'); }}>Começar</button>
    </div>;
  }
  const etapas = est.etapas;
  return <div className="cx-est-steps">
    {etapas.map((et, i) => {
      const status = et.status || 'todo';
      return <div key={et.id} className={'cx-est-row cx-est-' + status}>
        <button type="button" className="cx-est-dot" onClick={() => status === 'todo' && set(esteiraStartStep(est, i))} disabled={status !== 'todo'}
          aria-label={et.label + ' — ' + (status === 'done' ? 'feita' : status === 'doing' ? 'em andamento' : 'a fazer, clique para começar')}>{status === 'done' ? <CxIcon n="tick" s={10} /> : null}</button>
        <div className="cx-est-main">
          <div className="cx-est-l">{et.label} <span className={'cx-est-tool ' + cxEstToolClass(et.tool)}>{et.tool || '—'}</span></div>
          <div className="cx-est-m">
            {status === 'done' ? 'feita ' + cxDM(et.doneAt) : status === 'doing' ? 'em andamento desde ' + cxDM(et.startedAt) : 'a fazer'}
            {et.url ? <> · <a className="cx-a cx-small" href={et.url} target="_blank" rel="noopener noreferrer">link<CxIcon n="arrowUR" s={10} /></a></> : null}
          </div>
          {status === 'doing' ? <div className="cx-est-editor">
            <textarea className="cx-input" defaultValue={et.note || ''} placeholder="Onde parei…" rows={2} aria-label="Onde parei"
              onBlur={e => { if (e.target.value !== (et.note || '')) set(esteiraSetNote(est, i, e.target.value)); }} />
            <div className="cx-est-editor-row">
              <input className="cx-input" defaultValue={et.url || ''} placeholder="Link (conversa ou arquivo)" aria-label="Link da etapa"
                onBlur={e => { if (e.target.value !== (et.url || '')) set(esteiraSetLink(est, i, e.target.value)); }} />
              <button type="button" className="cx-btn sm" onClick={() => { const wasLast = i === etapas.length - 1; set(esteiraCompleteStep(est, i)); if (wasLast && onSuggestStatus) onSuggestStatus('complete'); }}><CxIcon n="tick" s={12} />Concluir</button>
            </div>
          </div> : null}
          {status !== 'todo' ? <button type="button" className="cx-link-btn cx-small" onClick={() => set(esteiraUndoStep(est, i))}>Desfazer</button> : null}
        </div>
        <span className="cx-est-r cx-mono">{status === 'done' ? cxDM(et.doneAt) : status === 'doing' ? 'agora' : '—'}</span>
      </div>;
    })}
  </div>;
}
/* Envolve o corpo com a sugestão discreta de mudar a situação. Só quando o chamador passa
   `statusValue`/`onApplyStatus` (gaveta da intimação); no formulário de tarefa não há sugestão.
   `resetKey` limpa a sugestão ao trocar de registro (ex.: navegar J/K entre intimações). */
function CxEsteiraSection({ esteira, onChange, template, statusValue, onApplyStatus, resetKey }) {
  const [sug, setSug] = React.useState(null);
  React.useEffect(() => { setSug(null); }, [resetKey]);
  const onSuggestStatus = (kind) => {
    if (!onApplyStatus) return;
    if (kind === 'begin' && statusValue !== 'peca_edicao') setSug('begin');
    else if (kind === 'complete') setSug('complete');
  };
  return <>
    <CxEsteiraBody esteira={esteira} onChange={onChange} template={template} onSuggestStatus={onSuggestStatus} />
    {sug ? <div className="cx-est-sug">
      <span>{sug === 'begin' ? 'Mudar situação para Peça em edição?' : 'Marcar como Peça pronta?'}</span>
      <button type="button" className="cx-btn sm" onClick={() => { onApplyStatus(sug === 'begin' ? 'peca_edicao' : 'peca_pronta'); setSug(null); }}>Mudar</button>
      <button type="button" className="cx-icon-btn cx-sm" onClick={() => setSug(null)} aria-label="Dispensar sugestão"><CxIcon n="x" s={12} /></button>
    </div> : null}
  </>;
}

/* "Peças e links": minuta, links das etapas da esteira, documentos da operação com o mesmo
   processo (ou ligados à intimação), a peça protocolada e links avulsos (intim.links). */
function cxPecasList(intim, data) {
  const out = [];
  if (intim.minutaUrl) out.push({ key: 'minuta', label: 'Minuta', origin: 'minuta da intimação', url: intim.minutaUrl });
  ((intim.esteira && intim.esteira.etapas) || []).forEach(et => {
    if (et.url) out.push({ key: 'et-' + et.id, label: et.label, origin: 'esteira · ' + (et.status === 'done' ? 'feita' : et.status === 'doing' ? 'em andamento' : 'a fazer'), url: et.url });
  });
  (data.documents || []).forEach(d => {
    const linked = d.sourceIntimationId === intim.id;
    const sameOpProc = !!intim.operationId && d.operationId === intim.operationId && sameProc(d.processNumber, intim.processNumber);
    if (linked || sameOpProc) out.push({ key: 'doc-' + d.id, label: d.title || d.type || 'Documento', origin: linked ? 'documento desta intimação' : 'arquivo da operação · mesmo processo', url: d.url });
  });
  const ra = intim.responseAction;
  if (ra && (ra.peticionUrl || ra.docUrl)) out.push({ key: 'ra', label: ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : 'Atuação', origin: 'atuação registrada', url: ra.peticionUrl || ra.docUrl });
  (intim.links || []).forEach((l, i) => out.push({ key: 'lnk-' + i, label: l.label || 'Link', origin: 'link adicionado', url: l.url, custom: true, idx: i }));
  return out.filter(x => x.url);
}
function CxPecasBlock({ intim, data, a }) {
  const items = cxPecasList(intim, data);
  const [label, setLabel] = React.useState('');
  const [url, setUrl] = React.useState('');
  const add = (e) => {
    e.preventDefault();
    const u = url.trim();
    if (!u) return;
    const links = [...(intim.links || []), { label: label.trim() || 'Link', url: u, addedAt: new Date().toISOString() }];
    a.upsert('intimations', { ...intim, links });
    setLabel(''); setUrl('');
  };
  const remove = (idx) => { const links = (intim.links || []).filter((_, i) => i !== idx); a.upsert('intimations', { ...intim, links }); };
  return <div className="cx-pecas">
    {items.length ? items.map(it => <div key={it.key} className="cx-pl-row">
      <span className="cx-pl-ic">{(it.label || '?').trim().slice(0, 2).toUpperCase()}</span>
      <div className="cx-minw0"><div className="cx-ell">{it.label}</div><div className="cx-muted cx-small">{it.origin}</div></div>
      {it.custom ? <button type="button" className="cx-icon-btn cx-sm" onClick={() => remove(it.idx)} title="Remover" aria-label="Remover link"><CxIcon n="x" s={12} /></button> : null}
      <a className="cx-a cx-small" href={it.url} target="_blank" rel="noopener noreferrer">Abrir<CxIcon n="arrowUR" s={11} /></a>
    </div>) : <div className="cx-empty-note">Nenhum link ainda.</div>}
    <form className="cx-pl-add" onSubmit={add}>
      <input className="cx-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Rótulo (opcional)" aria-label="Rótulo do link" />
      <input className="cx-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" aria-label="URL do link" />
      <button type="submit" className="cx-btn sm" disabled={!url.trim()}><CxIcon n="plus" s={12} />link</button>
    </form>
  </div>;
}

/* Bloco recolhível genérico da gaveta em blocos. */
const CX_BLK_DEFAULTS = { esteira: true, pecas: true, notas: true, gram: false, ctx: false, dados: false };
function cxLoadDrawerBlocks() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_cx_drawer_blocks') || 'null');
    if (raw && typeof raw === 'object') return { ...CX_BLK_DEFAULTS, ...raw };
  } catch (e) { /* ignore */ }
  return { ...CX_BLK_DEFAULTS };
}
function cxSaveDrawerBlocks(v) { try { localStorage.setItem('nexus_cx_drawer_blocks', JSON.stringify(v)); } catch (e) { /* ignore */ } }
function CxBlock({ title, summary, count, open, onToggle, aside, children }) {
  return <div className="cx-blk">
    <div className="cx-blk-bar">
      <button type="button" className="cx-blk-h" aria-expanded={open} onClick={onToggle}>
        <span className="cx-blk-chev"><CxIcon n={open ? 'chevD' : 'chevR'} s={13} /></span>
        <span className="cx-blk-t">{title}</span>
        {!open ? <span className="cx-blk-s cx-ell">{summary}</span> : <span className="cx-sp" />}
        {count != null ? <span className="cx-blk-n">{count}</span> : null}
      </button>
      {aside || null}
    </div>
    {open ? <div className="cx-blk-b">{children}</div> : null}
  </div>;
}

/* ═════════════════════ Detalhe da intimação ═════════════════════ */
function CxRuler({ intim }) {
  const resolved = !!intim.responseAction;
  const sent = toDayKey(intim.dateSent), start = toDayKey(intim.dateStart), end = toDayKey(intim.dateDeadline);
  if (!end) {
    return <div className="cx-ruler"><div className="cx-ruler-h"><span className="cx-ruler-big">Prazo ainda não aberto</span><span className="cx-ruler-s">{sent ? 'enviada em ' + fmtDate(sent) : 'sem data de envio'}</span></div>
      <div className="cx-ruler-foot">O prazo começa a contar da ciência. Edite a intimação para lançar início e final.</div></div>;
  }
  const ed = start ? addBusinessDays(start, 10) : null;
  const dd = daysUntil(end);
  const off = (k) => daysUntil(k);
  const pts = [sent, start, ed, end].filter(Boolean).map(off);
  const lo = Math.min(...pts, 0), hi = Math.max(...pts, 0) + 1;
  const span = Math.max(1, hi - lo);
  const pos = (k) => Math.max(0, Math.min(100, ((typeof k === 'number' ? k : off(k)) - lo) / span * 100));
  const info = cxDue(dd, end);
  const biz = cxBizUntil(end);
  let big, sub;
  if (resolved) { big = 'Atuação registrada em ' + fmtDate(intim.responseAction.respondedAt); sub = 'prazo era ' + fmtDate(end); }
  else if (dd < 0) { big = 'Vencida há ' + cxPl(-dd, 'dia', 'dias'); sub = 'final em ' + fmtDate(end); }
  else if (dd === 0) { big = 'Vence hoje'; sub = 'final em ' + fmtDate(end); }
  else { big = 'Faltam ' + cxPl(dd, 'dia', 'dias'); sub = cxPl(biz, 'dia útil', 'dias úteis') + ' · final em ' + fmtDate(end); }
  const edDd = ed ? daysUntil(ed) : null;
  const edTxt = edDd === null ? '' : edDd < 0 ? 'expirado' : edDd === 0 ? 'hoje' : cxPl(cxBizUntil(ed), 'dia útil', 'dias úteis');
  return <div className="cx-ruler">
    <div className="cx-ruler-h"><span className={'cx-ruler-big ' + (resolved ? 'done' : info.tone)}>{big}</span><span className="cx-ruler-s">{sub}</span></div>
    <div className="cx-track" aria-hidden="true">
      <i className={'cx-fill' + (dd < 0 && !resolved ? ' late' : '')} style={{ width: pos(0) + '%' }} />
      {sent ? <i className="cx-mk" style={{ left: pos(sent) + '%' }} title={'Envio ' + fmtDate(sent)} /> : null}
      {start ? <i className="cx-mk" style={{ left: pos(start) + '%' }} title={'Início ' + fmtDate(start)} /> : null}
      {ed ? <i className="cx-mk ed" style={{ left: pos(ed) + '%' }} title={'Embargos de declaração até ' + fmtDate(ed)} /> : null}
      <i className="cx-mk final" style={{ left: pos(end) + '%' }} title={'Final ' + fmtDate(end)} />
      {!resolved ? <i className="cx-now" style={{ left: pos(0) + '%' }} title="Hoje" /> : null}
    </div>
    <div className="cx-ruler-l">
      <span>Envio<b>{sent ? cxDM(sent) : '—'}</b></span>
      <span>Início<b>{start ? cxDM(start) : '—'}</b></span>
      <span className="ed">Emb. decl.{edTxt ? ' · ' + edTxt : ''}<b>{ed ? cxDM(ed) : '—'}</b></span>
      <span>Final<b>{cxDM(end)}</b></span>
    </div>
    <div className="cx-ruler-foot">Embargos de declaração: 10 dias úteis contados do início, com feriados e recesso do calendário do app.</div>
  </div>;
}
function CxRespondForm({ intim, onSave, onCancel }) {
  const PETITION_TYPES = ['Manifestação', 'Contestação', 'Impugnação', 'Réplica', 'Contrarrazões', 'Recurso', 'Embargos de Declaração', 'Petição Avulsa', 'Outro'];
  const [type, setType] = React.useState('peticionamento');
  const [peticionType, setPeticionType] = React.useState('Manifestação');
  const [peticionUrl, setPeticionUrl] = React.useState('');
  const [docUrl, setDocUrl] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [teor, setTeor] = React.useState(intimationDecisionText(intim));
  const isPet = type === 'peticionamento';
  const canSave = isPet ? !!peticionUrl.trim() : !!description.trim();
  // Ciência: a descrição do ato é o teor da decisão (vem pré-preenchida se a intimação já tem um).
  const pickType = (v) => { setType(v); if (v === 'ciencia' && !description.trim()) setDescription(intimationDecisionText(intim)); };
  return <form className="cx-form" onSubmit={e => { e.preventDefault(); if (canSave) onSave({ type, description, peticionType, peticionUrl, docUrl, ...(type !== 'ciencia' ? { decisionSummary: teor } : {}) }); }}>
    <h3>Registrar atuação</h3>
    <CxSeg label="Tipo de atuação" value={type} onChange={pickType} options={[['peticionamento', 'Peticionamento'], ['ciencia', 'Ciência'], ['outra', 'Outra medida']]} />
    {isPet ? <div className="cx-row2">
      <label>Tipo de peça<select id={'cx-r-piece-' + intim.id} className="cx-input" value={peticionType} onChange={e => setPeticionType(e.target.value)}>{PETITION_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Link da peça (Docs ou arquivo) *<input id={'cx-r-url-' + intim.id} className="cx-input" value={peticionUrl} onChange={e => setPeticionUrl(e.target.value)} placeholder="https://docs.google.com/…" autoFocus /></label>
    </div> : <label>Link do documento (opcional)<input id={'cx-r-doc-' + intim.id} className="cx-input" value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://docs.google.com/…" /></label>}
    <label>{isPet ? 'Observações (opcional)' : type === 'ciencia' ? 'Qual decisão ou despacho foi objeto da ciência *' : 'Descrição da medida adotada *'}
      <textarea id={'cx-r-desc-' + intim.id} className="cx-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} autoFocus={!isPet} placeholder={isPet ? 'Ex.: manifestação pedindo mandado de penhora' : 'Ex.: ciência da decisão do evento 52, sem necessidade de manifestação'} />
    </label>
    {type !== 'ciencia' ? <label>Teor da decisão (opcional)<input className="cx-input" value={teor} onChange={e => setTeor(e.target.value)} placeholder="Ex.: defere a penhora de ativos financeiros" /></label> : null}
    <div className="cx-form-note">A intimação será arquivada em Resoluções, como no Clássico. {isPet || docUrl.trim() ? 'O link vai para a aba Arquivos da operação.' : ''}</div>
    {isPet && !canSave ? <div className="cx-form-warn">Informe o link da peça para registrar. Sem o link definitivo, cole uma referência provisória (ex.: “pendente upload”) e edite depois.</div> : null}
    <div className="cx-form-acts"><button type="button" className="cx-btn ghost" onClick={onCancel}>Cancelar</button><button type="submit" className="cx-btn primary" disabled={!canSave}><CxIcon n="tick" s={14} />Registrar e arquivar</button></div>
  </form>;
}
/* Objeto da intimação editável com um clique, no subtítulo da gaveta (abaixo do nome da parte). */
function CxIntimObjEditable({ intim, upsert }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (!editing) return;
    setVal(intim.object || '');
    const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    return () => clearTimeout(t);
  }, [editing, intim.id]);
  const save = () => { upsert('intimations', { ...intim, object: val.trim() }); setEditing(false); };
  if (editing) {
    return <input ref={inputRef} className="cx-input cx-d-ev-input" value={val} onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); } }}
      onBlur={save} placeholder="Objeto da intimação" aria-label="Objeto da intimação" />;
  }
  const v = cxIntimObjeto(intim);
  return <p className="cx-d-ev cx-d-ev-edit" role="button" tabIndex={0} onClick={() => setEditing(true)}
    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setEditing(true); } }} title="Clique para editar o objeto">
    {v ? v : <span className="cx-obj-undef">Definir objeto…</span>}
  </p>;
}
/* Teor da decisão (decisionSummary): linha discreta abaixo do objeto, editável com um clique. Vazio = só o link "Adicionar…". */
function CxIntimTeorEditable({ intim, upsert }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (!editing) return;
    setVal(intimationDecisionText(intim));
    const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    return () => clearTimeout(t);
  }, [editing, intim.id]);
  const save = () => { const v = val.trim(); if (v !== intimationDecisionText(intim)) upsert('intimations', { ...intim, decisionSummary: v }); setEditing(false); };
  if (editing) {
    return <input ref={inputRef} className="cx-input cx-d-ev-input cx-teor-input" value={val} onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); } }}
      onBlur={save} placeholder="Teor da decisão (1–2 linhas)" aria-label="Teor da decisão" />;
  }
  const v = intimationDecisionText(intim);
  return <p className="cx-d-teor" role="button" tabIndex={0} onClick={() => setEditing(true)}
    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setEditing(true); } }} title="Clique para editar o teor da decisão">
    {v ? <><span className="cx-teor-k">Teor:</span> {v}</> : <span className="cx-teor-add">Adicionar teor da decisão…</span>}
  </p>;
}
/* Chip do link da peça no topo fixo da gaveta, junto aos demais chips (item 4). */
function CxPecaChip({ intim, upsert }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (!editing) return;
    setVal(intim.minutaUrl || '');
    const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    return () => clearTimeout(t);
  }, [editing, intim.id]);
  const save = () => { upsert('intimations', { ...intim, minutaUrl: val.trim() }); setEditing(false); };
  if (editing) {
    return <input ref={inputRef} className="cx-input cx-small cx-peca-input" value={val} onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); } }}
      onBlur={save} placeholder="Link da peça (https://…)" aria-label="Link da peça" />;
  }
  if (intim.minutaUrl) {
    return <span className="cx-chip cx-peca-chip">
      <a className="cx-peca-open" href={intim.minutaUrl} target="_blank" rel="noopener noreferrer" title="Abrir a peça"><CxIcon n="file" s={12} />Peça<CxIcon n="arrowUR" s={11} /></a>
      <button type="button" className="cx-peca-pencil" onClick={() => setEditing(true)} title="Editar o link da peça" aria-label="Editar o link da peça"><CxIcon n="edit" s={11} /></button>
    </span>;
  }
  return <button type="button" className="cx-chip cx-peca-add" onClick={() => setEditing(true)}><CxIcon n="plus" s={11} />link da peça</button>;
}
/* Estado dos blocos recolhíveis da gaveta (persistido). Fica na gaveta para o botão "Expandir/Recolher tudo" do cabeçalho. */
function useCxDrawerBlocks() {
  const [blocks, setBlocks] = React.useState(cxLoadDrawerBlocks);
  const toggleBlock = React.useCallback((key) => setBlocks(prev => { const next = { ...prev, [key]: !prev[key] }; cxSaveDrawerBlocks(next); return next; }), []);
  const setAllBlocks = React.useCallback((open) => setBlocks(() => { const next = {}; Object.keys(CX_BLK_DEFAULTS).forEach(k => { next[k] = open; }); cxSaveDrawerBlocks(next); return next; }), []);
  return { blocks, toggleBlock, setAllBlocks, allOpen: Object.keys(CX_BLK_DEFAULTS).every(k => blocks[k]) };
}
function CxIntimDetail({ intim, a, showRespond, setShowRespond, blocksCtl }) {
  const { data, opsById, prazosByDebt } = a;
  const op = opsById.get(intim.operationId);
  const notes = cxNotes(intim);
  const [nt, setNt] = React.useState('');
  const ownBlocks = useCxDrawerBlocks();
  const { blocks, toggleBlock, setAllBlocks } = blocksCtl || ownBlocks;
  const resolved = !!intim.responseAction;
  const set = (patch) => a.upsert('intimations', { ...intim, ...patch });
  const exec = (data.executions || []).find(e => sameProc(e.processNumber, intim.processNumber) && (!intim.operationId || e.operationId === intim.operationId))
    || (data.executions || []).find(e => sameProc(e.processNumber, intim.processNumber));
  const cdas = (data.debts || []).filter(d => sameProc(d.processNumber, intim.processNumber));
  const siblings = (data.intimations || []).filter(x => x.id !== intim.id && sameProc(x.processNumber, intim.processNumber) && cxIsOpen(x)).sort(cxByDeadline);
  const impK = intimImpKey(intim), difK = intimDifKey(intim), urg = intimIsUrgent(intim);
  const ra = intim.responseAction;
  const alarmCount = cdas.filter(d => { const row = prazosByDebt.get(d.id); return row && row.group === 1; }).length;
  const showCtx = !!(exec || cdas.length || siblings.length);
  /* Trilha curta "você está aqui" (M6-B): fases cumpridas do processo, este prazo e o que vem. Só na gaveta. */
  const trailPts = React.useMemo(() => {
    if (!exec) return null;
    const todayIso = localIso(new Date());
    const tr = cxProcTrail(data, op || (data.operations || []).find(o => o.id === exec.operationId), exec, todayIso);
    if (!tr || !tr.steps.length) return null;
    const dl = toDayKey(intim.dateDeadline);
    const pts = tlMiniTrail(tr, { d: dl || '', label: 'Este prazo', late: !!(dl && !intim.responseAction && daysUntil(dl) < 0) });
    return pts.length > 1 ? pts : null; // só "este prazo" não conta nada
  }, [data, op, exec, intim.dateDeadline, intim.responseAction]);
  const pecas = cxPecasList(intim, data);
  const resume = esteiraResumeInfo(intim.esteira);
  const estSummary = esteiraSummary(intim.esteira);
  const template = a.esteiraTemplate || ESTEIRA_DEFAULT_TEMPLATE;

  return <div>
    {!blocksCtl ? <div className="cx-blk-toggle-all">
      <button type="button" className="cx-link-btn cx-small" onClick={() => setAllBlocks(true)}>Expandir tudo</button>
      <span className="cx-muted">·</span>
      <button type="button" className="cx-link-btn cx-small" onClick={() => setAllBlocks(false)}>Recolher tudo</button>
    </div> : null}
    <div className="cx-d-chips">
      <CxOpTag op={op} onOpen={a.onOpenOp} />
      <span className="cx-chip"><CxStatusIcon s={resolved ? 'analisado' : intim.status} />{resolved ? 'Resolvida' : (CX_ST[intim.status] || {}).l || intim.status}</span>
      {intim._importFlag === 'new' ? <span className="cx-tag blue">Novo no último import</span> : intim._importFlag === 'updated' ? <span className="cx-tag">Atualizada no último import</span> : null}
      {!resolved ? <button type="button" className={'cx-chip cx-pend' + (intim.hasPending ? ' on' : '')} aria-pressed={!!intim.hasPending} onClick={() => set({ hasPending: !intim.hasPending })} title="Marcar pendência (algo a fazer aqui)"><CxIcon n="flag" s={12} />Pendência</button> : null}
      <CxPecaChip intim={intim} upsert={a.upsert} />
    </div>
    <h2 className="cx-d-title">{cxPartyName(intim)}</h2>
    <CxIntimObjEditable intim={intim} upsert={a.upsert} />
    <CxIntimTeorEditable intim={intim} upsert={a.upsert} />
    <CxRuler intim={intim} />
    {trailPts ? <div className="cx-mt-wrap"><div className="cx-mt-cap">Onde este prazo cai no processo</div><CxMiniTrail points={trailPts} /></div> : null}

    {resume ? <div className="cx-resume">
      <div className="cx-resume-k">Continuar · etapa {resume.index + 1} de {resume.total} · parou {esteiraStoppedLabel(resume.updatedAt, { withTime: true })}</div>
      <div className="cx-resume-t">{resume.etapa.label} <span className={'cx-est-tool ' + cxEstToolClass(resume.etapa.tool)}>{resume.etapa.tool || '—'}</span></div>
      {resume.etapa.note ? <div className="cx-resume-n">“{resume.etapa.note}”</div> : null}
      <div className="cx-resume-a">
        {resume.etapa.url ? <a className="cx-btn primary sm" href={resume.etapa.url} target="_blank" rel="noopener noreferrer"><CxIcon n="arrowUR" s={12} />Abrir {resume.etapa.tool || 'link'}</a> : null}
        <button type="button" className="cx-btn sm" onClick={() => set({ esteira: esteiraCompleteStep(intim.esteira, resume.index) })}><CxIcon n="tick" s={12} />Concluir etapa</button>
      </div>
    </div> : null}

    <CxBlock title="Esteira da peça" open={!!blocks.esteira} onToggle={() => toggleBlock('esteira')}
      count={estSummary.total ? estSummary.doneCount + '/' + estSummary.total : null}
      summary={estSummary.total ? <><CxEstProgress esteira={intim.esteira} size="sm" />{estSummary.isComplete ? 'Esteira concluída' : (estSummary.current && estSummary.current.label)}</> : 'Não iniciada'}>
      <CxEsteiraSection esteira={intim.esteira} onChange={nextEst => set({ esteira: nextEst })} template={template}
        statusValue={intim.status} onApplyStatus={status => set({ status })} resetKey={intim.id} />
    </CxBlock>

    <CxBlock title="Peças e links" open={!!blocks.pecas} onToggle={() => toggleBlock('pecas')} count={pecas.length}
      summary={pecas.length ? pecas[0].label : 'Nada ainda'}>
      <CxPecasBlock intim={intim} data={data} a={a} />
    </CxBlock>

    <CxBlock title="Notas" open={!!blocks.notas} onToggle={() => toggleBlock('notas')} count={notes.length}
      summary={notes.length ? notes[notes.length - 1] : 'Sem notas ainda'}>
      <div className="cx-notes">
        {notes.map((n, k) => <div key={k} className="cx-note">{a.linkify ? a.linkify(n) : n}</div>)}
        {notes.length === 0 ? <div className="cx-empty-note">Sem notas ainda.</div> : null}
        <form className="cx-note-add" onSubmit={e => { e.preventDefault(); const v = nt.trim(); if (!v) return; set({ notesList: [...notes, v] }); setNt(''); cxNotify('Nota adicionada'); }}>
          <textarea id={'cx-nt-' + intim.id} value={nt} onChange={e => setNt(e.target.value)} placeholder="Adicionar nota…" aria-label="Nova nota" onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} />
          <button type="submit" className="cx-btn">Anotar</button>
        </form>
      </div>
    </CxBlock>

    <CxBlock title={resolved ? 'Atuação' : 'Classificação'} open={!!blocks.gram} onToggle={() => toggleBlock('gram')}
      summary={resolved ? (ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida') + (ra.respondedAt ? ' · ' + cxDM(ra.respondedAt) : '') : 'Importância ' + String(CX_IMP[impK] || impK).toLowerCase() + ' · complexidade ' + String(CX_DIF[difK] || difK).toLowerCase() + (urg ? ' · urgente' : '')}>
      {resolved ? <div className="cx-note cx-note-done">
        <b>{ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida'}</b>{ra.respondedAt ? ' · ' + fmtDate(ra.respondedAt) : ''}
        {ra.description ? <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{ra.description}</div> : null}
        {(ra.peticionUrl || ra.docUrl) ? <div style={{ marginTop: 6 }}><a className="cx-a" href={ra.peticionUrl || ra.docUrl} target="_blank" rel="noopener noreferrer"><CxIcon n="link" s={13} />{String(ra.peticionUrl || ra.docUrl).includes('docs.google') ? 'Google Docs' : 'Abrir peça'}</a></div> : null}
      </div> : <div className="cx-gram">
        <div className="cx-gram-f"><span>Importância</span><CxSeg label="Importância" value={impK} onChange={v => set({ priority: v })} options={[['baixa', 'Baixa'], ['normal', 'Média'], ['alta', 'Alta']]} /></div>
        <div className="cx-gram-f"><span>Complexidade</span><CxSeg label="Complexidade" value={difK} onChange={v => set({ difficulty: v })} options={[['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta']]} /></div>
        <div className="cx-gram-f"><span>Marcação</span><button type="button" className={'cx-urg-t' + (urg ? ' on' : '')} aria-pressed={urg} onClick={() => set(urg ? { urgent: false, priority: (intim.priority === 'urgente' || intim.priority === 'urgent') ? 'alta' : intim.priority } : { urgent: true })}><CxIcon n="flag" s={13} />Urgente</button></div>
        <div className="cx-gram-f cx-gram-status"><span>Situação</span><div className="cx-gram-status-b">
          {intim.status === 'em_analise'
            ? <button type="button" className="cx-btn sm" onClick={() => { set({ status: 'analise_concluida' }); cxNotify('Análise concluída'); }}>Concluir análise</button>
            : intim.status !== 'analise_concluida'
              ? <button type="button" className="cx-btn sm" onClick={() => { set({ status: 'em_analise' }); cxNotify('Marcada como em análise'); }}>Em análise</button>
              : null}
          <button type="button" className="cx-btn sm" onClick={() => set({ status: intim.status === 'peca_edicao' ? 'pendente_analise' : 'peca_edicao' })}>{intim.status === 'peca_edicao' ? 'Voltar a pendente' : 'Peça em edição'}</button>
          <button type="button" className="cx-btn sm" onClick={() => { set({ status: intim.status === 'aguardando_subsidios' ? 'pendente_analise' : 'aguardando_subsidios' }); cxNotify(intim.status === 'aguardando_subsidios' ? 'Voltou a pendente de análise' : 'Marcada como aguardando subsídios'); }}>{intim.status === 'aguardando_subsidios' ? 'Subsídios chegaram' : 'Aguardar subsídios'}</button>
        </div></div>
      </div>}
    </CxBlock>

    {showCtx ? <CxBlock title="Contexto do processo" open={!!blocks.ctx} onToggle={() => toggleBlock('ctx')}
      summary={<>{cxPl(cdas.length, 'CDA', 'CDAs')}{alarmCount ? <> · <span className="cx-tag red">{alarmCount} no alarme</span></> : ''}{siblings.length ? ' · ' + cxPl(siblings.length, 'outra intimação', 'outras intimações') : ''}</>}>
      <div className="cx-ctx">
        {exec ? <div className="cx-ctx-h"><span className="cx-ell" style={{ fontWeight: 500 }}>{exec.className || 'Processo'}</span><span className="cx-muted cx-small cx-ell">{exec.court || ''}</span>{EXEC_STATUSES[exec.status] ? <span className="cx-tag">{EXEC_STATUSES[exec.status].label}</span> : null}</div> : null}
        {cdas.slice(0, 8).map(d => {
          const row = prazosByDebt.get(d.id);
          const g = row && row.group;
          const glabel = { 1: 'Urgente', 2: 'A conferir', 3: 'A completar', 4: 'Acompanhamento', 5: 'Sem risco' }[g] || null;
          return <div key={d.id} className="cx-ctx-row">
            <span className="cx-ell"><span className="cx-mono" style={{ fontSize: 12 }}>{d.cdaNumber || '—'}</span> <span className="cx-muted">· {[d.tribute, fmtCur(d.value || 0)].filter(Boolean).join(' · ')}</span></span>
            {glabel ? <span className={'cx-presc g' + (g <= 4 ? g : 0)}><CxIcon n="hourglass" s={11} />{d.prescriptionHandled ? 'Tratada' : glabel}</span> : <span />}
            {g && g <= 3 && !d.prescriptionHandled && row.summary ? <span className="cx-ctx-s">{row.summary}</span> : null}
          </div>;
        })}
        {cdas.length > 8 ? <div className="cx-ctx-row"><span className="cx-muted cx-small">+{cdas.length - 8} CDAs neste processo</span></div> : null}
        {siblings.length ? <div className="cx-ctx-row" style={{ display: 'block' }}>
          <div className="cx-small cx-muted" style={{ marginBottom: 4 }}>Outras intimações abertas neste processo</div>
          {siblings.slice(0, 4).map(s => <button key={s.id} type="button" className="cx-dl-item cx-dl-flat" onClick={() => a.onOpenIntim(s.id)}><CxStatusIcon s={s.status} /><span className="cx-t">{s.eventDescription || s.className}</span><CxDue iso={s.dateDeadline} /></button>)}
        </div> : null}
      </div>
    </CxBlock> : null}

    <CxBlock title="Dados" open={!!blocks.dados} onToggle={() => toggleBlock('dados')}
      summary={[intim.className, intim.organ].filter(Boolean).join(' · ') || '—'}>
      <dl className="cx-props">
        <dt>Processo</dt><dd>{intim.processNumber ? <><CxProc num={intim.processNumber} uf={intim.jurisdiction} /><button type="button" className="cx-copy" title="Copiar número" aria-label="Copiar número" onClick={() => cxCopy(intim.processNumber)}><CxIcon n="copy" s={13} /></button></> : '—'}</dd>
        <dt>Classe</dt><dd>{intim.className || '—'}</dd>
        {intim.organ ? <><dt>Órgão</dt><dd>{intim.organ}</dd></> : null}
        {intim.parties ? <><dt>Partes</dt><dd>{intim.parties}</dd></> : null}
        {intim.subject ? <><dt>Assunto</dt><dd>{intim.subject}</dd></> : null}
        <dt>Objeto</dt><dd>{intim.object || <span className="cx-muted">—</span>}</dd>
        {intim.minutaUrl ? <><dt>Minuta</dt><dd><a className="cx-a" href={intim.minutaUrl} target="_blank" rel="noopener noreferrer"><CxIcon n="link" s={13} />{intim.minutaUrl.includes('docs.google') ? 'Google Docs' : 'Documento'}</a></dd></> : null}
      </dl>
    </CxBlock>

    {showRespond && !resolved ? <CxRespondForm intim={intim} onCancel={() => setShowRespond(false)} onSave={(action) => { a.onRespond(intim, action); setShowRespond(false); cxNotify('Atuação registrada. A intimação foi para Resolvidas.'); }} /> : null}
  </div>;
}
function CxDetailActions({ intim, a, onRespond, compact }) {
  const onDesk = a.isOnDesk('intimation', intim.id);
  return <>
    <button type="button" className="cx-btn primary" onClick={onRespond}><CxIcon n="send" s={14} />Registrar atuação{compact ? <kbd className="cx-kbd">R</kbd> : null}</button>
    <span className="cx-sp" />
    <button type="button" className={'cx-icon-btn' + (onDesk ? ' on' : '')} onClick={() => { a.toggleDesk('intimation', intim.id, daysUntil(intim.dateDeadline)); cxNotify(onDesk ? 'Removida da Mesa' : 'Enviada para a Mesa'); }} title={onDesk ? 'Remover da Mesa' : 'Enviar para a Mesa'} aria-label={onDesk ? 'Remover da Mesa' : 'Enviar para a Mesa'}><CxIcon n="desk" /></button>
    <button type="button" className="cx-icon-btn" onClick={() => a.onWatch(intim)} title="Acompanhar este processo" aria-label="Acompanhar este processo"><CxIcon n="eye" /></button>
    <button type="button" className="cx-icon-btn" onClick={() => a.onEditFull(intim)} title="Editar todos os campos" aria-label="Editar todos os campos"><CxIcon n="edit" /></button>
  </>;
}
function EditionClaudeDrawer({ intimId, order, a, onClose }) {
  const intim = (a.data.intimations || []).find(x => x.id === intimId);
  const [showRespond, setShowRespond] = React.useState(false);
  const bodyRef = React.useRef(null);
  const blocksCtl = useCxDrawerBlocks();
  React.useEffect(() => { setShowRespond(false); if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [intimId]);
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) { onClose(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const ix = order.indexOf(intimId);
      if (e.key.toLowerCase() === 'j' && ix >= 0 && ix < order.length - 1) a.onOpenIntim(order[ix + 1]);
      if (e.key.toLowerCase() === 'k' && ix > 0) a.onOpenIntim(order[ix - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [intimId, order]);
  if (!intim) return null;
  const idx = order.indexOf(intim.id);
  const op = a.opsById.get(intim.operationId);
  const resolved = !!intim.responseAction;
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer" role="dialog" aria-modal="true" aria-label={'Intimação · ' + cxPartyName(intim)}>
      <div className="cx-dr-top">
        <div className="cx-crumb"><span>Intimações</span><span className="cx-sep">/</span>
          {intim.processNumber
            ? <CxNumCopy value={intim.processNumber}><b className="cx-crumb-proc"><CxProc num={intim.processNumber} /><span className="cx-crumb-copy" aria-hidden="true"><CxIcon n="copy" s={13} /></span></b></CxNumCopy>
            : <b>{op ? cxOpName(op) : 'Sem operação'}</b>}
        </div>
        <button type="button" className="cx-icon-btn" onClick={() => blocksCtl.setAllBlocks(!blocksCtl.allOpen)} title={blocksCtl.allOpen ? 'Recolher tudo' : 'Expandir tudo'} aria-label={blocksCtl.allOpen ? 'Recolher tudo' : 'Expandir tudo'}><CxIcon n={blocksCtl.allOpen ? 'collapseAll' : 'expandAll'} /></button>
        {idx >= 0 ? <span className="cx-mono cx-muted cx-small">{idx + 1} de {order.length}</span> : null}
        <button type="button" className="cx-icon-btn" disabled={idx <= 0} onClick={() => a.onOpenIntim(order[idx - 1])} title="Anterior (K)" aria-label="Anterior"><CxIcon n="chevU" /></button>
        <button type="button" className="cx-icon-btn" disabled={idx < 0 || idx >= order.length - 1} onClick={() => a.onOpenIntim(order[idx + 1])} title="Próxima (J)" aria-label="Próxima"><CxIcon n="chevD" /></button>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body" ref={bodyRef}><CxIntimDetail intim={intim} a={a} showRespond={showRespond} setShowRespond={setShowRespond} blocksCtl={blocksCtl} /></div>
      {!resolved && !showRespond ? <div className="cx-dr-foot"><CxDetailActions intim={intim} a={a} onRespond={() => setShowRespond(true)} /></div> : null}
      {resolved ? <div className="cx-dr-foot"><span className="cx-muted cx-small">Resolvida. Para mudar a atuação, edite a intimação.</span><span className="cx-sp" /><button type="button" className="cx-btn" onClick={() => a.onEditFull(intim)}><CxIcon n="edit" s={14} />Editar</button></div> : null}
    </aside>
  </>;
}

/* ═════════════════════ Modo foco (triagem) ═════════════════════ */
function EditionClaudeFocus(p) {
  const a = p.detailActions;
  const all = p.data.intimations || [];
  const queue = React.useMemo(() => all.filter(cxIsOpen).sort(cxAttention).map(x => x.id), []);
  const [ix, setIx] = React.useState(0);
  const [showRespond, setShowRespond] = React.useState(false);
  const cur = all.find(x => x.id === queue[ix]);
  const handled = queue.filter(id => { const x = all.find(y => y.id === id); return x && !!x.responseAction; }).length;
  React.useEffect(() => { setShowRespond(false); }, [ix]);
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey || p.drawerId || document.querySelector('.modal-overlay, .global-search-overlay')) return;
      const k = e.key.toLowerCase();
      if (k === 'j' || e.key === 'ArrowRight') { e.preventDefault(); setIx(v => Math.min(queue.length, v + 1)); }
      else if (k === 'k' || e.key === 'ArrowLeft') { e.preventDefault(); setIx(v => Math.max(0, v - 1)); }
      else if (k === 'r' && cur && !cur.responseAction) { e.preventDefault(); setShowRespond(true); }
      else if (k === 'u' && cur && !cur.responseAction) { e.preventDefault(); const urg = intimIsUrgent(cur); a.upsert('intimations', urg ? { ...cur, urgent: false, priority: (cur.priority === 'urgente' || cur.priority === 'urgent') ? 'alta' : cur.priority } : { ...cur, urgent: true }); }
      else if (e.key === 'Escape') p.setView('lista');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cur, queue, p.drawerId]);
  if (!queue.length) {
    return <div className="cx-focus-wrap"><div className="cx-focus-card cx-focus-done"><div className="cx-eyebrow">Triagem</div><h2 className="cx-d-title">Nenhuma intimação aberta.</h2><p className="cx-d-ev">Quando o próximo import do eproc chegar, a fila aparece aqui.</p>
      <div className="cx-focus-acts"><button type="button" className="cx-btn primary" onClick={() => p.setView('lista')}>Voltar à lista</button></div></div></div>;
  }
  const pct = Math.round(Math.min(ix, queue.length) / queue.length * 100);
  if (!cur) {
    return <div className="cx-focus-wrap">
      <div className="cx-focus-top"><span className="cx-cnt">{queue.length} de {queue.length}</span><span className="cx-progress"><i style={{ width: '100%' }} /></span></div>
      <div className="cx-focus-card cx-focus-done"><div className="cx-eyebrow">Triagem concluída</div><h2 className="cx-d-title">Você passou por {cxPl(queue.length, 'intimação', 'intimações')}.</h2><p className="cx-d-ev">{cxPl(handled, 'teve atuação registrada', 'tiveram atuação registrada')} nesta rodada. As demais continuam na lista com a gramática que você ajustou.</p>
        <div className="cx-focus-acts"><button type="button" className="cx-btn primary" onClick={() => p.setView('lista')}>Voltar à lista</button><button type="button" className="cx-btn" onClick={() => setIx(0)}>Recomeçar</button></div></div>
    </div>;
  }
  const op = p.opsById.get(cur.operationId);
  const sameOp = cur.operationId ? all.filter(x => x.operationId === cur.operationId && x.id !== cur.id && cxIsOpen(x)).sort(cxByDeadline) : [];
  const resolved = !!cur.responseAction;
  return <div className="cx-focus-wrap">
    <div className="cx-focus-top">
      <button type="button" className="cx-icon-btn" onClick={() => setIx(Math.max(0, ix - 1))} disabled={ix === 0} aria-label="Anterior"><CxIcon n="chevL" /></button>
      <span className="cx-cnt">{ix + 1} de {queue.length}</span>
      <button type="button" className="cx-icon-btn" onClick={() => setIx(ix + 1)} aria-label="Próxima"><CxIcon n="chevR" /></button>
      <span className="cx-progress" aria-hidden="true"><i style={{ width: pct + '%' }} /></span>
      <button type="button" className="cx-btn sm ghost" onClick={() => p.setView('lista')}>Sair do foco <kbd className="cx-kbd">Esc</kbd></button>
    </div>
    <div className="cx-focus">
      <div className="cx-focus-card">
        <CxIntimDetail intim={cur} a={a} showRespond={showRespond} setShowRespond={setShowRespond} />
        {!resolved && !showRespond ? <div className="cx-focus-acts"><CxDetailActions intim={cur} a={a} onRespond={() => setShowRespond(true)} compact /><button type="button" className="cx-btn ghost" onClick={() => setIx(ix + 1)}>Pular <kbd className="cx-kbd">J</kbd></button></div> : null}
        {resolved ? <div className="cx-focus-acts"><button type="button" className="cx-btn primary" onClick={() => setIx(ix + 1)}>Próxima <kbd className="cx-kbd">J</kbd></button></div> : null}
        <div className="cx-keys"><span><kbd className="cx-kbd">J</kbd><kbd className="cx-kbd">K</kbd>navegar</span><span><kbd className="cx-kbd">R</kbd>registrar atuação</span><span><kbd className="cx-kbd">U</kbd>urgente</span><span><kbd className="cx-kbd">Esc</kbd>sair</span></div>
      </div>
      <div className="cx-focus-side">
        <section className="cx-card">
          <div className="cx-card-h"><h2>Operação</h2>{op ? <div className="cx-aside"><button type="button" className="cx-link-btn" onClick={() => p.onOpenOp(op.id)}>Abrir<CxIcon n="chevR" s={13} /></button></div> : null}</div>
          <div className="cx-pad">
            {op ? <>
              <div className="cx-op-h"><CxOpSquare op={op} /><span className="cx-op-nm">{cxOpName(op)}</span></div>
              {op.description ? <p className="cx-op-desc">{op.description}</p> : null}
              <div className="cx-tags">{getOpClassifications(op).map(k => <span key={k} className="cx-tag" style={{ color: OP_CLASSIFICATIONS[k].color }}>{OP_CLASSIFICATIONS[k].label}</span>)}</div>
            </> : <span className="cx-muted cx-small">Intimação sem operação vinculada. Use “Editar todos os campos” para vincular.</span>}
          </div>
        </section>
        {op ? <section className="cx-card">
          <div className="cx-card-h"><h2>Na mesma operação</h2><div className="cx-aside"><span className="cx-count">{sameOp.length}</span></div></div>
          {sameOp.length ? sameOp.slice(0, 5).map(x => <button key={x.id} type="button" className="cx-dl-item" onClick={() => { const k = queue.indexOf(x.id); if (k >= 0) setIx(k); else p.onOpenIntim(x.id); }}><CxStatusIcon s={x.status} /><span className="cx-t">{x.eventDescription || x.className}</span><CxDue iso={x.dateDeadline} /></button>) : <div className="cx-empty-row">Nenhuma outra intimação aberta.</div>}
          <div style={{ height: 6 }} />
        </section> : null}
      </div>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 2 — Carteira, Visão geral da operação, Linha do tempo e Mesa de prazos.
   Só leitura, exceto as ações da Mesa, que chamam as MESMAS funções do app
   (applyMesaAction, applyPrescSnooze, clearPrescSnooze, createInlineParcelamento…).
   ═══════════════════════════════════════════════════════════════════════════ */
const CX_GROUP_C = { 1: 'var(--cx-red)', 2: 'var(--cx-orange)', 3: 'var(--cx-yellow)', 4: 'var(--cx-blue)', 5: 'var(--cx-ink-3)', 6: 'var(--cx-ink-3)', 7: 'var(--cx-violet)' };
const CX_CERT = { calculado: 'Calculado', estimado: 'Estimado', cadastro: 'Cadastro', faixa: 'Cedo–tarde', dado: 'Falta dado', analisar: 'Analisar' };
const CX_CERT_TIP = {
  calculado: 'Data exata pelo cálculo, com os fatos lançados.',
  estimado: 'Faixa provável. Confira nos autos antes de agir.',
  cadastro: 'Falta um dado na ficha para calcular.',
  faixa: 'Duas leituras: a data cedo (mais desfavorável) dá o alarme; a tarde é a tese da União.',
  dado: 'Falta um fato para fechar a data. A data cedo mostra o risco se ele não vier.',
  analisar: 'Penhora ou bloqueio antigo: análise caso a caso.',
};
/** Linhas da Mesa agrupadas por execução (intercorrente) ou por CDA (ordinária), com as notas do processo. */
function cxMesaGroups(list, notesByProc, render) {
  return groupMesaRows(list).map(g => {
    const notes = g.type === 'execucao' ? (notesByProc.get(normProc(g.processNumber)) || []) : [];
    if (g.type !== 'execucao' || (g.rows.length < 2 && !notes.length)) return g.rows.map(render);
    return <div key={g.key} className="cx-mesa-exec">
      <div className="cx-mesa-exec-h">
        {g.processNumber ? <CxProc num={g.processNumber} /> : <span className="cx-muted">sem processo</span>}
        <span className="cx-muted cx-small">{cxPl(g.rows.length, 'CDA', 'CDAs')} · {fmtCur(g.value)}</span>
        {notes.map((n, i) => <div key={i} className={'cx-mesa-exec-note ' + (n.kind || 'idpj')}>{betaSafeUiText(n.text)}</div>)}
      </div>
      {g.rows.map(render)}
    </div>;
  });
}
/* reviewStatus do app lança erro se op.reviewInterval tiver um valor desconhecido (ex.: dado importado);
   no Prumo a tela não pode cair por isso. */
function cxRS(op) {
  try { return reviewStatus(op); } catch (e) { return { overdue: false, daysLeft: null, label: '', color: 'var(--text-muted)' }; }
}
function cxReviewNext(op) {
  const it = REVIEW_INTERVALS[op.reviewInterval || 'mensal'];
  if (!it || !it.days || !op.lastReviewedAt) return null;
  const d = new Date(op.lastReviewedAt); d.setDate(d.getDate() + it.days);
  return localIso(d);
}
function cxReviewTag(op) {
  const rs = cxRS(op);
  if (rs.daysLeft === null) return null;
  const tone = rs.overdue ? 'orange' : rs.daysLeft <= 3 ? 'yellow' : '';
  return <span className={'cx-tag ' + tone} title={'Revisão ' + ((REVIEW_INTERVALS[op.reviewInterval || 'mensal'] || {}).label || '').toLowerCase()}><CxIcon n="history" s={11} />{rs.label}</span>;
}
function cxOpPrioTag(op, long) {
  const k = normalizeOpPriority(op.priority);
  if (k !== 'maxima' && k !== 'alta') return null;
  const lab = OP_PRIORITIES[k].label;
  return <span className="cx-tag"><span className="cx-dot cx-dot-s" style={{ background: k === 'maxima' ? 'var(--cx-opc-maxima)' : 'var(--cx-opc-alta)' }} />{long ? 'Prioridade ' + lab.toLowerCase() : lab}</span>;
}
function cxClsTag(k) {
  const c = OP_CLASSIFICATIONS[k];
  if (!c) return null;
  return <span key={k} className="cx-tag"><span className="cx-dot cx-dot-s" style={{ background: c.color }} />{c.label}</span>;
}

/* Linhas "no formato do radar" (group 1) para as CDAs da fileira 1 da Mesa de prazos: alimentam o próximo termo e o
   painel «Precisa de atenção» do Hoje com o mesmo critério do número do menu (cartões «a agir»). */
function cxMesaActionRows(mc, todayIso) {
  const out = [];
  ((mc && mc.items) || []).forEach(it => {
    if (!mesaIsAction(it)) return;
    const d = it.debt || {};
    const dias = it.sortDate ? daysUntil(it.sortDate, todayIso) : (it.row && it.row.prescDays != null ? it.row.prescDays : null);
    out.push({ ...(it.row || {}), id: d.id || it.debtId, operationId: d.operationId, cdaNumber: d.cdaNumber || (it.row && it.row.cdaNumber) || '', value: it.value, prescDays: dias, group: 1 });
  });
  return out;
}
/* ─── Índice por operação (uma passada no acervo) ─── */
function cxOpIndex(data, mesaCards) {
  const idx = {};
  const get = (id) => idx[id] || (idx[id] = { debts: [], execs: [], open: [], late: 0, risk: 0, riskValue: 0, targets: [], next: null, tasks: 0, assets: [] });
  (data.debts || []).forEach(d => {
    if (!d.operationId || d.status === 'extinta') return;
    const x = get(d.operationId); x.debts.push(d);
    if (mesaIsAction(mesaCards.byDebt.get(d.id))) { x.risk++; x.riskValue += d.value || 0; }
  });
  (data.executions || []).forEach(e => { if (e.operationId) get(e.operationId).execs.push(e); });
  (data.intimations || []).forEach(i => {
    if (!i.operationId || !cxIsOpen(i)) return;
    const x = get(i.operationId); x.open.push(i);
    const dd = daysUntil(i.dateDeadline);
    if (dd !== null && dd < 0) x.late++;
    if (i.dateDeadline && (!x.next || cxByDeadline(i, x.next) < 0)) x.next = i;
  });
  (data.people || []).forEach(p => { if (p.operationId && p.operationRole === 'alvo') get(p.operationId).targets.push(p); });
  (data.tasks || []).forEach(t => { if (t.operationId && t.status !== 'concluida' && t.status !== 'cancelada') get(t.operationId).tasks++; });
  (data.assets || []).forEach(a => { if (a.operationId) get(a.operationId).assets.push(a); });
  return (id) => get(id);
}

/* ═════════════════════ Carteira ═════════════════════ */
function EditionClaudeCarteira(p) {
  const { data, mesaCards, prescLookup } = p;
  const todayIso = localIso(new Date());
  const [localF, setLocalF] = React.useState('all');
  const filter = p.classFilter || localF;
  const setFilter = p.setClassFilter || setLocalF;
  const [q, setQ] = React.useState('');
  const [prio, setPrio] = React.useState(null); // filtro opcional por prioridade (alterna ao clicar de novo)
  const [sort, setSortS] = React.useState(() => { try { return localStorage.getItem('nexus_cx_cart_sort') || 'nome'; } catch (e) { return 'nome'; } });
  const setSort = (v) => { setSortS(v); try { localStorage.setItem('nexus_cx_cart_sort', v); } catch (e) { /* ignore */ } };
  const idx = React.useMemo(() => cxOpIndex(data, mesaCards), [data, mesaCards]);
  const ops = (data.operations || []).filter(o => !isSubstituicaoOp(o));
  /* Pulso de 120 dias de cada operação ativa (M6-A): um cxBuildTimeline por operação, só quando os dados mudam. */
  const pulses = React.useMemo(() => {
    const m = new Map();
    if (!prescLookup) return m;
    ops.filter(o => o.status !== 'encerrada').forEach(o => { try { m.set(o.id, cxPulseData(data, o, prescLookup, todayIso)); } catch (err) { /* sem pulso */ } });
    return m;
  }, [data, prescLookup, todayIso]);
  const pulseTip = useCxTip(React.useCallback((key) => {
    const rest = key.replace(/^pl\|/, '');
    for (const pu of pulses.values()) {
      const it = pu.items.find(i => i.id === rest); if (!it) continue;
      const d = cxTlTipData(it.tip, pu.execById);
      d.lines = (d.lines || []).filter(l => l.indexOf('Clique') !== 0);
      if (it.kind === 'tar') d.lines.unshift('Tarefa');
      return d;
    }
    return null;
  }, [pulses]));
  const chips = [['all', 'Todas', ops.filter(o => o.status !== 'encerrada').length]];
  opClassChipKeys(ops, { hideEmpty: true }).forEach(k => { if (OP_CLASSIFICATIONS[k]) chips.push([k, OP_CLASSIFICATIONS[k].label, ops.filter(o => opMatchesClassFilter(o, k)).length]); });
  const nClosed = ops.filter(o => o.status === 'encerrada').length;
  if (nClosed) chips.push(['encerrada', 'Encerradas', nClosed]);
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  let list = ops.filter(o => (filter === 'all' ? o.status !== 'encerrada' : opMatchesClassFilter(o, filter)))
    .filter(o => !toks.length || toks.every(t => cxNorm(o.name + ' ' + (o.description || '')).includes(t)))
    .filter(o => !prio || normalizeOpPriority(o.priority) === prio);
  const prioOps = ops.filter(o => o.status !== 'encerrada');
  const prioChips = ['maxima', 'alta', 'media', 'baixa'].map(k => [k, OP_PRIORITIES[k].label, prioOps.filter(o => normalizeOpPriority(o.priority) === k).length, ({ maxima: 'var(--cx-opc-maxima)', alta: 'var(--cx-opc-alta)', media: 'var(--cx-opc-media)', baixa: 'var(--cx-opc-baixa)' })[k]]);
  const money = (o) => idx(o.id).debts.reduce((s, d) => s + (d.value || 0), 0);
  const guar = (o) => idx(o.id).debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  const cov = (o) => { const t = money(o); return t > 0 ? guar(o) / t : 1; };
  const indOf = (o) => indispStats(idx(o.id).assets, money(o));
  const indRatio = (o) => { const r = indOf(o).ratio; return r === null ? 1 : r; };
  const sorters = {
    nome: sortOpsByName,
    valor: (a, b) => money(b) - money(a),
    cobertura: (a, b) => cov(a) - cov(b) || money(b) - money(a),
    indisp: (a, b) => indRatio(a) - indRatio(b) || money(b) - money(a),
    risco: (a, b) => idx(b.id).risk - idx(a.id).risk || money(b) - money(a),
    revisao: (a, b) => ((cxRS(a).daysLeft ?? 99999) - (cxRS(b).daysLeft ?? 99999)),
    intimacoes: (a, b) => idx(b.id).open.length - idx(a.id).open.length || sortOpsByName(a, b),
  };
  list = list.slice().sort(sorters[sort] || sortOpsByName);
  const active = ops.filter(o => o.status !== 'encerrada');
  const totalAll = active.reduce((s, o) => s + money(o), 0);
  const guarAll = active.reduce((s, o) => s + guar(o), 0);
  const indAll = indispStats(active.flatMap(o => idx(o.id).assets), totalAll);
  const indAllTxt = indispRatioText(indAll.ratio);
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Carteira</h1><p>{cxPl(active.length, 'operação ativa', 'operações ativas')} · {cxMoneyShort(totalAll)} sob gestão{indAllTxt ? ' · ' + indAllTxt + ' com bens indisponíveis' : ''} · {totalAll ? Math.round(guarAll / totalAll * 100) : 0}% garantido. O anel mostra a parte da dívida coberta por indisponibilidade (ativa e requerida).</p></div>
      <div className="cx-acts"><button type="button" className="cx-btn primary" onClick={p.onNewOp}><CxIcon n="plus" s={14} />Nova operação</button></div>
    </div>
    <div className="cx-toolbar">
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-cart-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Nome ou descrição da operação" aria-label="Buscar operação" /></label>
      <span className="cx-sp" />
      <CxSelect id="cx-cart-sort" pre="Ordenar" value={sort} onChange={setSort} options={[['nome', 'Nome'], ['valor', 'Maior dívida'], ['indisp', 'Menor indisponibilidade'], ['cobertura', 'Menor garantia'], ['risco', 'Risco prescricional'], ['revisao', 'Revisão mais atrasada'], ['intimacoes', 'Mais intimações']]} />
    </div>
    <CxChips label="Filtrar por classificação" group="Classificação" className="cx-chips cx-chips-tight" value={filter} onChange={setFilter} options={chips.map(c => [c[0], c[1], c[2], OP_CLASSIFICATIONS[c[0]] ? OP_CLASSIFICATIONS[c[0]].color : null])} />
    <CxChips label="Filtrar por prioridade" group="Prioridade" className="cx-chips" value={prio} onChange={v => setPrio(prio === v ? null : v)} options={prioChips} />
    {list.length === 0 ? <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>{ops.length ? 'Nenhuma operação neste filtro.' : 'Nenhuma operação ainda. Crie a primeira.'}</div></div> :
    <div className="cx-op-grid" {...pulseTip.bind}>{list.map(o => {
      const x = idx(o.id);
      const total = money(o), g = guar(o), pct = total > 0 ? Math.round(g / total * 100) : 0;
      const ind = indOf(o);
      const ipSplit = cxIndispSplit(ind);
      const cls = getOpClassifications(o);
      const closed = o.status === 'encerrada';
      const since = o.lastReviewedAt ? cxDaysSince(o.lastReviewedAt) : null;
      const meta = (closed ? 'Encerrada' : 'Ativa') + ' · ' + (since === null ? 'nunca revisada' : since <= 0 ? 'revisada hoje' : 'revisada há ' + cxPl(since, 'dia', 'dias'));
      const rv = closed ? null : cxReviewTag(o);
      return <button key={o.id} type="button" className={'cx-op-card cx-oc' + (closed ? ' closed' : '')} onClick={() => p.onOpenOp(o.id)}>
        <span className="cx-oc-h">
          <CxOpTile op={o} size={40} />
          <span className="cx-minw0">
            <span className="cx-oc-n"><span className="cx-op-nm cx-ell" title={o.name}>{cxOpName(o)}</span>{cxOpPrioTag(o)}</span>
            <span className="cx-oc-meta">{meta}</span>
          </span>
        </span>
        <span className="cx-oc-rv">{rv}</span>
        <span className="cx-op-desc">{o.description || <span className="cx-muted">Sem descrição.</span>}</span>
        <span className="cx-tags">{cls.slice(0, 3).map(cxClsTag)}{cls.length > 3 ? <span className="cx-tag">+{cls.length - 3}</span> : null}</span>
        <span className="cx-oc-m" title={[ipSplit || 'Sem bens indisponíveis com valor', pct + '% garantido'].join(' · ')}>
          <CxRing pct={ind.pct || 0} size={40} stroke={5.5} label={cxIndispPctTxt(ind) + ' indisponível'} />
          <span><b>{total ? cxMoneyShort(total) : '—'}</b><span className="cx-pct ip">{ind.pct === null ? '0%' : cxIndispPctTxt(ind)} indisponível</span><span className="cx-pct">{pct}% garantido</span></span>
        </span>
        {pulses.get(o.id) ? <CxPulse pulse={pulses.get(o.id)} todayIso={todayIso} /> : <span className="cx-pulse" aria-hidden="true" />}
        <span className="cx-oc-f">
          <span className="cx-pl" title="Processos"><CxIcon n="scale" s={13} /><b>{x.execs.length}</b></span>
          <span className="cx-pl" title="CDAs ativas"><CxIcon n="file" s={13} /><b>{x.debts.length}</b></span>
          <span className={'cx-pl' + (x.late ? ' red' : '')} title="Intimações abertas"><CxIcon n="inbox" s={13} /><b>{x.open.length}</b>{x.late ? ' · ' + x.late + ' venc.' : ''}</span>
          {x.risk ? <span className="cx-pl viol" title="CDAs a agir nos prazos extintivos (cartões da fileira 1 da Mesa)"><CxIcon n="hourglass" s={13} /><b>{x.risk}</b></span> : null}
          <span className="cx-pl" title="Próximo prazo"><CxIcon n="clock" s={13} />{x.next ? <CxDue iso={x.next.dateDeadline} /> : '—'}</span>
          {x.targets.length ? <span className="cx-oc-av"><CxAvatars people={x.targets} /></span> : null}
        </span>
      </button>;
    })}</div>}
    {pulseTip.node}
  </div>;
}

/* ═════════════════════ Linha do tempo ═════════════════════ */
const CX_TL_AXIS = 56;
const CX_TAG_C = { idpj: 'var(--cx-red)', cautelar_fiscal: 'var(--cx-yellow)', central: 'var(--cx-violet)', normal: 'var(--cx-cyan)' };
function cxExecTag(e) {
  if (e.processTag === 'idpj') return 'IDPJ';
  if (e.processTag === 'cautelar_fiscal') return 'MCF';
  if (e.processTag === 'central') return 'CENTRAL';
  if (e.processTag === 'peticao_incidente_ef') return 'INC';
  const c = cxNorm(e.className);
  if (c.includes('embargos')) return 'EMB';
  if (c.includes('agravo') || c.includes('apela') || c.includes('recurso')) return 'REC';
  if (c.includes('excecao')) return 'EXC';
  if (c.includes('execucao fiscal')) return 'EF';
  return 'PROC';
}
function cxTagColor(e) {
  if (CX_TAG_C[e.processTag] && e.processTag !== 'normal') return CX_TAG_C[e.processTag];
  const t = cxExecTag(e);
  if (t === 'EMB' || t === 'EXC') return 'var(--cx-orange)';
  if (t === 'REC') return 'var(--cx-blue)';
  if (t === 'EF' || t === 'INC') return 'var(--cx-cyan)';
  return 'var(--cx-ink-3)';
}
function cxEvColor(type) {
  const t = String(type || '');
  if (isAdesaoType(t) || t === 'int_rescisao_parcelamento' || t === 'int_pedido_parcelamento') return 'var(--cx-green)';
  if (t.indexOf('int_') === 0) return 'var(--cx-cyan)';
  if (t.indexOf('susp_idpj') === 0) return 'var(--cx-red)';
  if (t.indexOf('susp_') === 0) return 'var(--cx-blue)';
  if (t.indexOf('marco_') === 0) return 'var(--cx-ink)';
  return 'var(--cx-ink-3)';
}
function cxOutcomeColor(o) {
  if (o === 'favoravel' || o === 'provido') return 'var(--cx-green)';
  if (o === 'desfavoravel' || o === 'nao_provido') return 'var(--cx-red)';
  if (o === 'pendente') return 'var(--cx-yellow)';
  return 'var(--cx-blue)';
}
const CX_SEV = { prescrito: 9, critico: 8, alerta: 7, correndo: 6, interrompido: 5, suspenso: 4, indeterminado: 3, seguro: 2, sem_dados: 1 };
const CX_PRESC_TXT = { prescrito: 'vencida', critico: 'crítica', alerta: 'em alerta', correndo: 'correndo', interrompido: 'ciclo encerrado', suspenso: 'pausada', indeterminado: 'sem ciência lançada', seguro: 'sem risco próximo', sem_dados: 'sem dados' };
/* Mesmas frentes do Briefing: IDPJ/MCF no panorama, execução central, ou EF levada ao panorama
   pelo usuário. Usado para separar "Marcos da operação" e as linhas da régua entre frentes e
   "Outras execuções" (item 7). */
function cxIsFront(e) {
  if (!e) return false;
  return isIncidentOnPanorama(e) || (e.processTag === 'central' && e.status !== 'extinta' && e.status !== 'arquivada') || isUserPanoramaEf(e);
}
const CX_FLOOR_KIND = { protocolo: 'protocolo', citacao: 'citação', despacho: 'despacho de citação', constricao: 'constrição' };
const CX_HEARING_SHORT = { instrucao: 'Instrução', conciliacao: 'Conciliação', una: 'Audiência una', justificacao: 'Justificação', inquiricao: 'Inquirição', outra: 'Audiência' };
/* Número curto do processo ("5001234-56"), como o advogado o cita. */
function cxExecShortNum(e) { return tlProcShort(e && e.processNumber); }
/* Devedor do processo: o responsável originário da primeira CDA, o devedor da ficha ou, na falta de CDA
   (IDPJ, MCF, exceção, recurso), a parte mais citada nas intimações do processo. */
function cxExecWho(data, e, cdas) {
  const resp = (data.links && data.links.cdaResponsibilities) || [];
  for (const d of cdas) {
    const r = resp.find(x => x.cdaId === d.id && x.role === 'originario');
    const p = r ? (data.people || []).find(x => x.id === r.personId) : null;
    if (p && p.name) return p.name;
    if (d.devedor) return d.devedor;
  }
  const cnt = new Map();
  (data.intimations || []).forEach(i => { if (i.partyName && sameProc(i.processNumber, e.processNumber)) cnt.set(i.partyName, (cnt.get(i.partyName) || 0) + 1); });
  let best = '', n = 0;
  cnt.forEach((v, k) => { if (v > n) { best = k; n = v; } });
  return best;
}
/* Papel do processo na operação ("EF principal", "EF apensa", "Exceção de pré-exec."): é o que diferencia duas
   "Execução Fiscal" lado a lado. A relação com o pai ("apenso de 5001234-56") vai na segunda linha. */
function cxExecRole(e, parent, hasChildren) {
  const tag = cxExecTag(e);
  if (tag === 'IDPJ') return 'Desconsideração (IDPJ)';
  if (tag === 'MCF') return 'Medida cautelar fiscal';
  if (tag === 'CENTRAL') return 'EF central';
  if (tag === 'EF') return parent ? 'EF apensa' : (hasChildren ? 'EF principal' : 'Execução fiscal');
  if (tag === 'EXC') return 'Exceção de pré-exec.';
  if (tag === 'EMB') return 'Embargos à execução';
  if (tag === 'REC') return e.className || 'Recurso';
  return e.className || 'Processo';
}
function cxExecRel(e, parent) {
  if (!parent) return '';
  const tag = cxExecTag(e);
  return (tag === 'EF' || tag === 'CENTRAL' ? 'apenso de ' : 'em ') + cxExecShortNum(parent);
}
/* Relação do processo filho com o pai, para o tooltip do conector. */
function cxLinkText(kind, a, b) {
  const ta = cxExecTag(a), tb = cxExecTag(b);
  const na = ta + ' ' + cxExecShortNum(a), nb = tb + ' ' + cxExecShortNum(b);
  if (kind === 'cover') return na + ' cobre ' + nb;
  if (tb === 'EF' || tb === 'CENTRAL') return nb + ' é apenso de ' + na;
  if (tb === 'EXC') return nb + ' é exceção nos autos de ' + na;
  if (tb === 'REC') return nb + ' é recurso de ' + na;
  if (tb === 'EMB') return nb + ' é embargos de ' + na;
  return nb + ' é vinculado a ' + na;
}
/* Monta os dados da régua a partir dos dados reais. Datas em ISO.
   `items` é a lista única de fatos com data (decisão, andamento, audiência, prazo, prescrição, revisão), cada um com
   `kind` (vocabulário de src/lib/timeline.js), `ref` (o que abrir ao clicar) e `execId` (processo dono, ou null) — é a
   base dos filtros da legenda e dos modos da página (Panorama hoje; Frentes, Prescrição e Narrativa depois).
   `procs` são as linhas de processo na ordem da régua (`front`: IDPJ/MCF/central/EF no panorama do Briefing;
   `depth`: filhos sob o pai); `cdas` as CDAs sem processo a ajuizar (todas: o limite de linhas é da tela); `links` os
   conectores nomeados (cobre · apenso/exceção/recurso de); `info` guarda por processo o papel, o devedor e a prescrição
   (`presc`: segmentos, marcos e a faixa até o piso); `allDates` serve ao eixo (`datesWithout(ids)`: o mesmo sem as linhas recolhidas). */
function cxBuildTimeline(data, op, prescLookup) {
  const execs = (data.executions || []).filter(e => e.operationId === op.id);
  const ids = new Set(execs.map(e => e.id));
  const execById = new Map(execs.map(e => [e.id, e]));
  const events = data.prescriptionEvents || [];
  const today = localIso(new Date());
  const info = new Map();
  const items = [];
  let seq = 0;
  const nid = (p) => p + '|' + (seq++);
  execs.forEach(e => {
    const stages = getStageRecords(op.briefing, e.id) || {};
    const DEF = (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') ? PROCESS_STAGES : CENTRAL_STAGES;
    const evs = [];
    const addEv = (it) => { const x = { id: nid('ev'), execId: e.id, ref: { t: 'exec', id: e.id }, short: it.l, ...it }; evs.push(x); items.push(x); return x; };
    Object.keys(stages).forEach(k => {
      const rec = stages[k]; if (!rec) return;
      const def = resolveStageDef(DEF, k, rec);
      if (def.multiRecurso) getRecursos(rec).forEach(r => { const d = toDayKey(r.date); if (d) addEv({ d, l: def.label + (r.parte === 'adversa' ? ' (parte adversa)' : '') + (r.outcome && RECURSO_OUTCOMES[r.outcome] ? ' · ' + RECURSO_OUTCOMES[r.outcome] : ''), c: (r.outcome === 'provido' && isRecursoAdverso(r)) ? 'var(--cx-red)' : cxOutcomeColor(r.outcome), k: 'stage', sk: k, kind: r.outcome ? 'dec' : 'and', out: r.outcome || '', t: [r.proc ? 'Proc. ' + r.proc : '', String(r.texto || '').trim()].filter(Boolean).join(' · ') }); });
      else { const d = toDayKey(rec.date); if (d) addEv({ d, l: def.label + (rec.outcome && def.outcomes && def.outcomes[rec.outcome] ? ' · ' + def.outcomes[rec.outcome] : ''), c: cxOutcomeColor(rec.outcome), k: 'stage', sk: k, kind: rec.outcome ? 'dec' : 'and', decisive: !!rec.outcome, out: rec.outcome || '', t: [rec.evento ? 'Ev. ' + rec.evento : '', String(rec.texto || '').trim()].filter(Boolean).join(' · ') }); }
    });
    const seen = new Set();
    events.forEach(pe => {
      if (pe.executionId !== e.id) return;
      const d = toDayKey(pe.requestDate || pe.date); if (!d) return;
      const key = pe.type + '|' + d; if (seen.has(key)) return; seen.add(key);
      const t = PRESC_EVENT_TYPES[normalizePrescEventType(pe.type)] || {};
      addEv({ d, l: t.label || pe.type, c: cxEvColor(pe.type), k: 'presc', kind: 'presc', pcat: t.category || '' });
    });
    const start = toDayKey(e.protocolDate) || (evs.map(x => x.d).sort()[0]) || toDayKey(e.createdAt) || today;
    // Prescrição: pior CDA do processo
    const debts = (data.debts || []).filter(d => d.status !== 'extinta' && sameProc(d.processNumber, e.processNumber));
    let worst = null, worstDebt = null;
    debts.forEach(d => {
      let r = null; try { r = prescLookup(d); } catch (err) { r = null; }
      if (!r) return;
      const s = CX_SEV[r.status] || 0, ws = worst ? (CX_SEV[worst.status] || 0) : -1;
      if (s > ws || (s === ws && (r.daysLeft ?? 1e9) < (worst.daysLeft ?? 1e9))) { worst = r; worstDebt = d; }
    });
    let presc = null;
    if (worst) {
      const segs = [], marks = [];
      const r = worst;
      const addMark = (m) => { const x = { id: nid('pm'), execId: e.id, ref: { t: 'exec', id: e.id }, kind: 'presc', mark: true, short: m.deadline ? 'Prescrição' : m.l, ...m }; marks.push(x); items.push(x); };
      if (r.segment === 'intercorrente' && r.diesAQuo) {
        const m = (r.memory || []).find(x => /Fim da suspens|Fim do 1º ano/.test(String(x.event || '')));
        let yearEnd = m && toDayKey(m.date);
        if (!yearEnd && r.phase === 'suspensao_art40') yearEnd = addCalendarYears(r.diesAQuo, 1);
        const stop = toDayKey(r.interruptAt) || null;
        if (yearEnd) segs.push({ from: r.diesAQuo, to: stop && stop < yearEnd ? stop : yearEnd, t: 'susp' });
        const interFrom = yearEnd || r.diesAQuo;
        const interTo = stop || toDayKey(r.diesAdQuem);
        if (interTo && interTo > interFrom && (!stop || stop > interFrom)) segs.push({ from: interFrom, to: interTo, t: 'inter' });
        if (stop) addMark({ d: stop, l: 'Ciclo encerrado em ' + fmtDate(stop), c: 'var(--cx-cyan)' });
        else if (r.diesAdQuem) addMark({ d: toDayKey(r.diesAdQuem), l: 'Termo ' + (r.estimated ? 'estimado' : 'calculado') + ' · ' + fmtDate(r.diesAdQuem), c: 'var(--cx-violet)', big: true, deadline: true });
      }
      let parcEnds = null; try { parcEnds = inferParcelamentoEnds(r.timeline || []); } catch (err) { parcEnds = null; }
      (r.timeline || []).forEach(ev => {
        const t = PRESC_EVENT_TYPES[normalizePrescEventType(ev.type)];
        if (!t || t.category !== 'suspensiva' || ev.type === 'susp_art40' || ev.type === 'susp_idpj_mcf_constricao') return;
        const from = toDayKey(ev.requestDate || ev.date); if (!from) return;
        const inf = parcEnds && parcEnds.get ? parcEnds.get(ev.id) : null;
        const to = toDayKey(ev.endDate) || (inf && toDayKey(inf.end)) || today;
        segs.push({ from, to: to < from ? from : to, t: isAdesaoType(ev.type) ? 'pausa' : 'susp2', l: t.label });
      });
      const cedo = r.band && r.band.alarme !== false && r.band.cedo && toDayKey(r.band.cedo.diesAdQuem);
      if (cedo && cedo !== toDayKey(r.diesAdQuem)) addMark({ d: cedo, l: 'Data cedo · ' + fmtDate(cedo) + ' (leitura mais desfavorável)', c: 'var(--cx-red)', deadline: true });
      if (!segs.length && r.bounds && r.bounds.floor) addMark({ d: toDayKey(r.bounds.floor), l: 'Não pode ter prescrito antes de ' + fmtDate(r.bounds.floor), c: 'var(--cx-ink-3)', hollow: true });
      /* Faixa do piso: do último ato que fecha o ciclo (citação, despacho, constrição) até 6 anos depois. */
      const fa = r.bounds && r.bounds.floorAnchor, fl = r.bounds && toDayKey(r.bounds.floor);
      const band = !segs.length && fl && fa && toDayKey(fa.iso) ? { from: toDayKey(fa.iso), to: fl, kind: CX_FLOOR_KIND[fa.kind] || '' } : null;
      presc = { r, debt: worstDebt, n: debts.length, segs, marks, band };
    }
    const intims = (data.intimations || []).filter(i => cxIsOpen(i) && i.dateDeadline && sameProc(i.processNumber, e.processNumber)).map(i => {
      const end = toDayKey(i.dateDeadline);
      const it = { id: 'pz|' + i.id, kind: 'prazo', d: end, from: toDayKey(i.dateStart) || toDayKey(i.dateSent) || end, l: i.eventDescription || i.className || 'Intimação', short: 'Prazo', execId: e.id, ref: { t: 'intim', id: i.id }, i, st: i.status };
      items.push(it);
      return it;
    });
    const cdaVal = debts.reduce((s, d) => s + (d.value || 0), 0);
    info.set(e.id, { e, evs, start, presc, intims, debts, cdaN: debts.length, cdaVal, who: cxExecWho(data, e, debts), end: e.status === 'extinta' ? (evs.map(x => x.d).sort().pop() || toDayKey(e.updatedAt)) : null });
  });
  info.forEach(x => {
    const parent = x.e.parentExecutionId && ids.has(x.e.parentExecutionId) ? execById.get(x.e.parentExecutionId) : null;
    x.role = cxExecRole(x.e, parent, execs.some(c => c.parentExecutionId === x.e.id));
    x.rel = cxExecRel(x.e, parent);
  });
  const byStart = (a, b) => String(info.get(a.id).start).localeCompare(String(info.get(b.id).start));
  const tops = execs.filter(e => !e.parentExecutionId || !ids.has(e.parentExecutionId));
  // Frentes do Briefing (IDPJ/MCF no panorama, execução central, EF levada ao panorama) primeiro;
  // as demais execuções ficam abaixo de uma divisória ("Outras execuções").
  const frontsTop = tops.filter(cxIsFront).sort(byStart);
  const othersTop = tops.filter(e => !cxIsFront(e)).sort(byStart);
  /* Linhas de processo na ordem da régua: frentes primeiro, cada pai seguido de seus filhos (apensos, exceções, recursos). */
  const procs = [];
  const pushExec = (e, depth, front) => {
    procs.push({ x: info.get(e.id), depth, front });
    execs.filter(c => c.parentExecutionId === e.id).sort(byStart).forEach(c => pushExec(c, depth + 1, front));
  };
  frontsTop.forEach(e => pushExec(e, 0, true));
  othersTop.forEach(e => pushExec(e, 0, false));
  // CDAs sem processo nesta operação, com o prazo para ajuizar apertado (ordinária). Todas entram: o limite de
  // linhas visíveis é da tela (com "+N" que expande), nunca um corte silencioso aqui.
  const cdas = [];
  (data.debts || []).forEach(d => {
    if (d.operationId !== op.id || d.status === 'extinta' || d.prescriptionHandled) return;
    if (d.processNumber && execs.some(e => sameProc(e.processNumber, d.processNumber))) return;
    let r = null; try { r = prescLookup(d); } catch (err) { r = null; }
    if (!r || r.segment !== 'credito' || !r.diesAdQuem) return;
    if (r.status !== 'critico' && r.status !== 'alerta' && r.status !== 'prescrito') return;
    const end = toDayKey(r.diesAdQuem);
    const num = d.cdaNumber || 'S/N';
    const it = { id: 'cda|' + d.id, kind: 'presc', k: 'cda', d: end, l: 'Ajuizar a CDA ' + num + ' até ' + fmtDate(end), short: 'CDA …' + String(num).slice(-9), c: r.status === 'prescrito' ? 'var(--cx-red)' : 'var(--cx-violet)', big: true, ref: { t: 'cda', id: d.id, operationId: d.operationId }, debt: d, r, start: toDayKey(r.diesAQuo) || addCalendarYears(end, -5) };
    items.push(it);
    cdas.push({ d, r, end, start: it.start, it });
  });
  cdas.sort((a, b) => a.end.localeCompare(b.end));
  // Audiências (do processo, quando o número bate; senão ficam na linha "Operação") e a próxima revisão.
  (data.hearings || []).forEach(h => {
    if (h.operationId !== op.id || !h.date || h.status === 'cancelada') return;
    const owner = execs.find(e => sameProc(e.processNumber, h.processNumber));
    items.push({ id: 'au|' + h.id, kind: 'aud', d: toDayKey(h.date), tm: h.time || '', l: (CX_HEARING[h.hearingType] || 'Audiência') + (h.time ? ' · ' + h.time : ''), short: CX_HEARING_SHORT[h.hearingType] || 'Audiência', c: 'var(--cx-orange)', execId: owner ? owner.id : null, ref: { t: 'hearing', h }, hearing: h, realized: h.status === 'realizada' });
  });
  const rv = cxReviewNext(op);
  if (rv) items.push({ id: 'rv|' + op.id, kind: 'rev', d: rv, l: 'Revisão ' + ((REVIEW_INTERVALS[op.reviewInterval || 'mensal'] || {}).label || '').toLowerCase(), short: 'Revisão', c: 'var(--cx-accent)', ref: { t: 'op', id: op.id } });
  // Conectores nomeados: "cobre" (IDPJ/MCF → execução coberta) e "apenso/exceção/recurso de" (pai → filho).
  const links = [];
  execs.forEach(e => (e.linkedExecutionIds || []).forEach(c => { if (ids.has(c)) links.push({ id: 'lk|cover|' + e.id + '|' + c, type: 'cover', a: e.id, b: c, text: cxLinkText('cover', e, execById.get(c)) }); }));
  execs.filter(e => e.parentExecutionId && ids.has(e.parentExecutionId)).forEach(e => links.push({ id: 'lk|parent|' + e.parentExecutionId + '|' + e.id, type: 'parent', a: e.parentExecutionId, b: e.id, text: cxLinkText('parent', execById.get(e.parentExecutionId), e) }));
  /* Datas que importam ao eixo; `skip` (conjunto de ids de processo) deixa de fora as linhas recolhidas na tela. */
  const datesOf = (skip) => {
    const out = [];
    info.forEach((x, id) => {
      if (skip && skip.has(id)) return;
      out.push(x.start); x.evs.forEach(v => out.push(v.d));
      if (x.presc) { x.presc.segs.forEach(s => { out.push(s.from); out.push(s.to); }); x.presc.marks.forEach(m => out.push(m.d)); if (x.presc.band) { out.push(x.presc.band.from); out.push(x.presc.band.to); } }
    });
    items.forEach(it => { if (skip && it.execId && skip.has(it.execId)) return; if (it.d) out.push(it.d); if (it.from) out.push(it.from); });
    cdas.forEach(c => { out.push(c.start); out.push(c.end); });
    return out.filter(Boolean);
  };
  return { procs, items, links, cdas, execById, info, allDates: datesOf(null), datesWithout: datesOf, empty: execs.length === 0 && cdas.length === 0 };
}

/* ─── Glifo por tipo de fato (SVG): ◆ decisão · ○ andamento · ■ audiência · ▼ prazo · ⬢ prescrição · ◔ revisão ───
   Mesma forma na régua, na legenda e nos modos futuros. `c` é a cor (resultado, urgência, ato); `ghost` = esperado
   e sem data (tracejado); `hollow` = piso/não pode ter prescrito antes (vazado). */
function CxTlGlyph({ kind, c, ghost, hollow, s = 14 }) {
  const col = c || 'var(--cx-ink-2)';
  const ring = { fill: 'var(--cx-surface)', stroke: col, strokeWidth: 1.8, strokeDasharray: ghost || hollow ? '2.4 2' : undefined };
  const sf = { stroke: 'var(--cx-surface)', strokeWidth: 1.3, strokeLinejoin: 'round' };
  let shape;
  switch (kind) {
    case 'dec': shape = <rect x="3.1" y="3.1" width="9.8" height="9.8" rx="1.8" transform="rotate(45 8 8)" style={ghost ? ring : { fill: col, ...sf }} />; break;
    case 'and': shape = <circle cx="8" cy="8" r="4.3" style={{ fill: 'var(--cx-surface)', stroke: ghost ? col : 'var(--cx-ink-2)', strokeWidth: 1.9, strokeDasharray: ghost ? '2.4 2' : undefined }} />; break;
    case 'aud': shape = <rect x="3.3" y="3.3" width="9.4" height="9.4" rx="2" style={ghost ? ring : { fill: col, ...sf }} />; break;
    case 'prazo': shape = <path d="M2.4 4.2H13.6L8 12.8Z" style={ghost ? ring : { fill: col, ...sf }} />; break;
    case 'presc': shape = <polygon points="8,2.2 13,5.1 13,10.9 8,13.8 3,10.9 3,5.1" style={hollow || ghost ? ring : { fill: col, ...sf }} />; break;
    case 'rev': shape = <g><circle cx="8" cy="8" r="5.2" style={{ fill: 'var(--cx-surface)', stroke: col, strokeWidth: 1.6 }} /><path d="M8 5.2V8l2 1.4" style={{ fill: 'none', stroke: col, strokeWidth: 1.5, strokeLinecap: 'round' }} /></g>; break;
    /* Só da Narrativa: atuação minha (círculo cheio com visto) e tarefa (caixa; com visto = concluída). */
    case 'act': shape = <g><circle cx="8" cy="8" r="5.6" style={{ fill: col, stroke: 'var(--cx-surface)', strokeWidth: 1.3 }} /><path d="M5.5 8.2l1.8 1.8 3.4-3.8" style={{ fill: 'none', stroke: 'var(--cx-on-solid)', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }} /></g>; break;
    case 'tar': shape = <rect x="3.4" y="3.4" width="9.2" height="9.2" rx="2.4" style={{ fill: 'var(--cx-surface)', stroke: col, strokeWidth: 1.7 }} />; break;
    case 'tarok': shape = <g><rect x="3.4" y="3.4" width="9.2" height="9.2" rx="2.4" style={{ fill: 'var(--cx-surface)', stroke: col, strokeWidth: 1.7 }} /><path d="M5.6 8.2l1.7 1.7 3.2-3.6" style={{ fill: 'none', stroke: col, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }} /></g>; break;
    default: shape = <circle cx="8" cy="8" r="3" style={{ fill: col }} />;
  }
  return <svg className="cx-tl-gl" width={s} height={s} viewBox="0 0 16 16" aria-hidden="true">{shape}</svg>;
}
/* Cor de um prazo pela urgência (vencido, hoje, até 5 dias, depois). */
function cxTlPrazoColor(iso) {
  const info = cxDue(daysUntil(iso), iso);
  return info.tone === 'late' ? 'var(--cx-red)' : info.tone === 'today' ? 'var(--cx-orange)' : info.tone === 'soon' ? 'var(--cx-yellow)' : 'var(--cx-blue)';
}
/* Cor do glifo de um fato. */
function cxTlColor(it) {
  if (it.kind === 'prazo') return cxTlPrazoColor(it.d);
  if (it.kind === 'aud') return it.realized ? 'var(--cx-ink-3)' : 'var(--cx-orange)';
  return it.c || 'var(--cx-ink-2)';
}
/* Medidor de texto (canvas) com a fonte do Prumo; sem canvas, estimativa. */
const cxTlMeasure = (() => {
  let ctx = null, fam = '';
  return (text, px = 11) => {
    try {
      if (!ctx) { ctx = document.createElement('canvas').getContext('2d'); const el = document.querySelector('.cx') || document.body; fam = getComputedStyle(el).fontFamily || 'sans-serif'; }
      ctx.font = '400 ' + px + 'px ' + fam;
      const w = ctx.measureText(String(text)).width;
      return w > 0 ? w : tlEstimateWidth(text, px);
    } catch (err) { return tlEstimateWidth(text, px); }
  };
})();
/* Tooltip leve, sem estado do React: o elemento é preenchido direto no DOM a cada passada do mouse (a régua tem
   centenas de nós; re-renderizar a cada mousemove seria pesado). `resolve(chave)` devolve { when, title, lines, tone }
   ou null. Serve também ao foco do teclado. Reutilizável pelos outros modos da Linha do tempo. */
function useCxTip(resolve) {
  const ref = React.useRef(null);
  const keyRef = React.useRef('');
  const hide = () => { const el = ref.current; if (el) { el.style.display = 'none'; keyRef.current = ''; } };
  const show = (key, x, y) => {
    const el = ref.current; if (!el) return;
    const d = key ? resolve(key) : null;
    if (!d) { hide(); return; }
    if (keyRef.current !== key) {
      keyRef.current = key;
      el.textContent = '';
      const add = (cls, txt) => { if (!txt) return; const n = document.createElement('div'); n.className = cls; n.textContent = txt; el.appendChild(n); };
      add('cx-tl-tip-w' + (d.tone ? ' ' + d.tone : ''), d.when);
      add('cx-tl-tip-t', d.title);
      (d.lines || []).forEach(l => add('cx-tl-tip-s', l));
    }
    el.style.display = 'block';
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = x + 14, top = y + 16;
    if (left + w > window.innerWidth - 8) left = Math.max(8, x - w - 12);
    if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - 12);
    el.style.left = left + 'px'; el.style.top = top + 'px';
  };
  const keyOf = (ev) => { const t = ev.target && ev.target.closest ? ev.target.closest('[data-tl]') : null; return t ? t.getAttribute('data-tl') : ''; };
  const bind = {
    onMouseMove: (ev) => show(keyOf(ev), ev.clientX, ev.clientY),
    onMouseLeave: hide,
    onFocus: (ev) => { const k = keyOf(ev); if (!k) return; const r = ev.target.getBoundingClientRect(); show(k, r.left + r.width / 2, r.bottom); },
    onBlur: hide,
  };
  return { bind, node: <div ref={ref} className="cx-tl-tip" role="tooltip" style={{ display: 'none' }} /> };
}
/* Texto do tooltip de um fato da régua. */
function cxTlTipData(it, execById) {
  const dd = it.d ? daysUntil(it.d) : null;
  const dow = it.d ? CX_DOW[cxDate(it.d).getDay()] : '';
  const rel = dd === null ? '' : dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : dd === -1 ? 'ontem' : dd > 0 ? 'em ' + tlDurLabel(dd) : tlDurLabel(dd);
  const e = it.execId ? execById.get(it.execId) : null;
  const lines = [];
  if (it.kind === 'prazo') lines.push('Prazo de ' + cxDM(it.from) + ' a ' + cxDM(it.d));
  if (e) lines.push(cxExecTag(e) + ' ' + cxExecShortNum(e));
  if (it.kind === 'aud' && it.hearing && it.hearing.parties) lines.push(it.hearing.parties);
  if (it.k === 'cda' && it.debt) lines.push((it.debt.tribute || it.debt.system || 'CDA') + ' · ' + cxMoneyShort(it.debt.value) + ' · sem processo');
  const open = it.ref && it.ref.t === 'op' ? '' : it.ref && it.ref.t === 'hearing' ? 'Clique para abrir a audiência' : it.ref && it.ref.t === 'intim' ? 'Clique para abrir a intimação' : it.ref && it.ref.t === 'cda' ? 'Clique para abrir a CDA' : 'Clique para abrir o processo';
  if (open) lines.push(open);
  return { when: (it.d ? dow + ' ' + fmtDate(it.d) + (it.tm ? ' · ' + it.tm : '') + ' · ' + rel : 'sem data'), title: it.l, lines, tone: dd !== null && dd < 0 && it.kind === 'prazo' ? 'late' : '' };
}
/* Estado do foco da Panorama, lembrado por operação no navegador (nunca derruba a tela se o storage falhar). */
const CX_TL_STORE = 'nexus_cx_tl_focus_';
function cxTlLoadFocus(opId) {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(CX_TL_STORE + opId)); } catch (e) { raw = null; }
  const n = tlNormalizeFocus(raw);
  return { w: n.w, c: n.c, hidden: new Set(n.hidden) };
}
function cxTlSaveFocus(opId, st) {
  try { localStorage.setItem(CX_TL_STORE + opId, JSON.stringify({ w: st.w, c: st.c, hidden: Array.from(st.hidden) })); } catch (e) { /* ignore */ }
}
/* Prazo: "Manifestar sobre exceção de pré-executividade — 15 dias" → "Manifestar sobre exceção de pré-…". */
const cxTlShortDesc = (s, n = 26) => tlClip(String(s || '').replace(/\s*[—–-]\s*\d+\s*dias?\s*$/i, ''), n);
/* Texto do rótulo de um fato na régua. */
function cxTlLabelText(it) {
  const dm = cxDM(it.d);
  if (it.kind === 'prazo') return cxTlShortDesc(it.l) + ' ' + dm;
  if (it.kind === 'aud') return it.short + ' ' + dm + (it.tm ? ' ' + it.tm : '');
  if (it.kind === 'rev') return 'Revisão ' + dm;
  return tlClip(it.short || it.l, 30) + ' ' + dm;
}
/* Faixa-resumo acima da régua: o que mais importa na operação, sem abrir nada. */
function cxTlSummary(tl, todayIso) {
  const out = [];
  const pz = tl.items.filter(i => i.kind === 'prazo');
  const late = pz.filter(i => daysUntil(i.d) < 0).sort((a, b) => a.d.localeCompare(b.d));
  const soon = pz.filter(i => { const d = daysUntil(i.d); return d >= 0 && d <= 14; });
  const aud = tl.items.filter(i => i.kind === 'aud' && !i.realized && daysUntil(i.d) >= 0).sort((a, b) => a.d.localeCompare(b.d))[0];
  const cda = tl.cdas.filter(c => daysUntil(c.end) >= 0)[0] || tl.cdas[0];
  if (late.length) out.push({ k: 'late', node: <><b className="cx-red-t">{cxPl(late.length, 'prazo vencido', 'prazos vencidos')}</b> · {cxTlShortDesc(late[0].l, 34)}</> });
  out.push({ k: 'soon', node: <><b>{cxPl(soon.length, 'prazo', 'prazos')}</b> nos próximos 14 dias</> });
  if (aud) out.push({ k: 'aud', node: <>Próxima audiência: <b>{cxDM(aud.d)}{aud.tm ? ' ' + aud.tm : ''}</b> · {aud.l.replace(/ · .*$/, '')}</> });
  if (cda) out.push({ k: 'cda', node: <>Primeiro termo para ajuizar: <b>{fmtDate(cda.end)}</b> ({daysUntil(cda.end) < 0 ? 'vencido' : tlDurLabel(daysUntil(cda.end))})</> });
  return out;
}
/* Panorama (M1) — régua com foco no agora. Eixo quebrado (src/lib/timeline.js): o foco (30 d … 1 ano) em escala
   linear, passado e futuro comprimidos nas laterais, vãos longos sem fato viram quebras hachuradas ("≈ 13 m").
   Prazos (janela início → final) e audiências ficam na linha do processo; abaixo dela, a faixa de prescrição com
   o piso/termo. Todo marco é clicável (abre a gaveta que já existe). Estado (janela, posição e tipos ocultos)
   lembrado por operação. `tl` vem de cxBuildTimeline (compartilhado com os outros modos da página). */
function EditionClaudeTimelinePanorama({ tl, op, lead, onOpenIntim, onOpenHearing, onOpenCda, onOpenProc }) {
  const [st, setSt] = React.useState(() => cxTlLoadFocus(op.id));
  const upd = (patch) => setSt(prev => { const n = { ...prev, ...patch }; cxTlSaveFocus(op.id, n); return n; });
  const [cdaAll, setCdaAll] = React.useState(false);
  const rRef = React.useRef(null);
  const [cw, setCw] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = rRef.current; if (!el) return;
    const m = () => setCw(el.clientWidth);
    m();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(m) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', m);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', m); };
  }, []);
  const [, setFontTick] = React.useState(0);
  React.useEffect(() => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setFontTick(n => n + 1)); }, []);
  const todayIso = localIso(new Date());
  const CW = Math.max(520, (cw || 900) - 1);
  const { f0, f1 } = tlFocusRange(st.w, st.c);
  const step = tlFocusStep(st.w);
  /* Execuções extintas (fora das frentes): com 3 ou mais, ficam num grupo recolhido por padrão ("N execuções extintas · mostrar"). */
  const extIds = React.useMemo(() => tl.procs.filter(r => !r.front && r.x.e.status === 'extinta').map(r => r.x.e.id), [tl]);
  const extFold = extIds.length >= 3;
  const [extOpen, setExtOpen] = React.useState(false);
  const foldedIds = React.useMemo(() => (extFold && !extOpen ? new Set(extIds) : null), [extFold, extOpen, extIds]);
  const S = React.useMemo(() => {
    const pts = (foldedIds ? tl.datesWithout(foldedIds) : tl.allDates).map(d => daysUntil(d)).filter(v => v !== null);
    return tlProjectBroken({ points: pts, f0, f1, width: CW });
  }, [tl, foldedIds, f0, f1, CW]);
  const f = S.f, x0 = f(0);
  const isOff = (iso) => !isBusinessDay(new Date(iso + 'T00:00:00'));
  const hid = (k) => st.hidden.has(k);
  const counts = React.useMemo(() => tlCountKinds(tl.items), [tl]);
  const byId = React.useMemo(() => { const m = new Map(); tl.items.forEach(it => m.set(it.id, it)); return m; }, [tl]);
  const linkById = React.useMemo(() => { const m = new Map(); tl.links.forEach(l => m.set(l.id, l)); return m; }, [tl]);
  const brkRef = React.useRef([]);
  const tip = useCxTip(React.useCallback((key) => {
    if (key.indexOf('lk|') === 0) { const l = linkById.get(key); return l ? { when: l.type === 'cover' ? 'Cobertura' : 'Vínculo', title: l.text, lines: [] } : null; }
    if (key.indexOf('bar|') === 0) { const e = tl.execById.get(key.slice(4)); const x = e ? tl.info.get(e.id) : null; return x ? { when: (EXEC_STATUSES[e.status] || {}).label || 'Processo', title: x.role + ' · ' + cxExecShortNum(e), lines: [(e.className || '') + (x.who ? ' · ' + x.who : ''), 'Ajuizado em ' + fmtDate(x.start), 'Clique para abrir o processo'].filter(Boolean) } : null; }
    if (key.indexOf('seg|') === 0) { const parts = key.split('|'); return { when: 'Prescrição', title: parts[1], lines: [parts[2]] }; }
    if (key.indexOf('band|') === 0) { const x = tl.info.get(key.slice(5)); const b = x && x.presc && x.presc.band; return b ? { when: 'Prescrição · ' + (CX_PRESC_TXT[x.presc.r.status] || x.presc.r.status), title: 'Não prescreve antes de ' + fmtDate(b.to), lines: ['Último ato do ciclo: ' + fmtDate(b.from) + (b.kind ? ' (' + b.kind + ')' : ''), 'Piso = último ato + 6 anos (não é marco)'] } : null; }
    if (key.indexOf('brk|') === 0) { const b = brkRef.current[+key.slice(4)]; return b ? { when: b.sq ? 'Eixo espremido' : 'Eixo comprimido', title: 'Sem fatos por ' + b.label, lines: ['De ' + fmtDate(addCalendarDays(todayIso, Math.round(b.a))) + ' a ' + fmtDate(addCalendarDays(todayIso, Math.round(b.b))), b.sq ? 'O vão foi encurtado para caber na lateral' : 'Trecho vazio encurtado: o foco, ao lado, está em escala'] } : null; }
    const it = byId.get(key); return it ? cxTlTipData(it, tl.execById) : null;
  }, [byId, linkById, tl, todayIso]));
  if (tl.empty) return <div><div className="cx-tl-tools">{lead}</div><div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>Esta operação ainda não tem processos cadastrados. Eles aparecem aqui assim que forem lançados na aba Processos e prescrição.</div></div></div>;
  const open = (it) => {
    const r = it && it.ref; if (!r) return;
    if (r.t === 'intim') onOpenIntim && onOpenIntim(r.id);
    else if (r.t === 'hearing') onOpenHearing && onOpenHearing(r.h);
    else if (r.t === 'cda') onOpenCda && onOpenCda({ id: r.id, operationId: r.operationId });
    else if (r.t === 'exec') onOpenProc && onOpenProc(r.id);
  };
  const cl = (x) => Math.max(0, Math.min(CW, x));
  const span = (isoA, isoB) => { const a = daysUntil(isoA), b = daysUntil(isoB); if (a === null || b === null) return null; const xa = cl(f(a)), xb = cl(f(b)); return { left: xa, width: Math.max(3, xb - xa) }; };
  const inFocus = (iso) => { const o = daysUntil(iso); return o !== null && o >= f0 && o <= f1; };
  const msTxt = cxTlLabelText;
  /* ── linhas e geometria ── */
  const sections = [];
  const extSet = new Set(extFold ? extIds : []);
  const procRows = tl.procs.filter(r => !extSet.has(r.x.e.id));
  const hasFront = procRows.some(r => r.front), hasOther = procRows.some(r => !r.front);
  let prevFront = null;
  procRows.forEach(r => {
    if (r.depth === 0 && r.front !== prevFront) {
      if (r.front) sections.push({ kind: 'head', label: 'Frentes', sub: 'IDPJ · MCF · execução central' });
      else if (hasFront || hasOther) sections.push({ kind: 'head', label: hasFront ? 'Outras execuções' : 'Execuções' });
      prevFront = r.front;
    }
    sections.push({ kind: 'proc', x: r.x, depth: r.depth });
  });
  if (extFold) {
    sections.push({ kind: 'extgrp', n: extIds.length });
    if (extOpen) tl.procs.filter(r => extSet.has(r.x.e.id)).forEach(r => sections.push({ kind: 'proc', x: r.x, depth: r.depth > 0 && extSet.has(r.x.e.parentExecutionId) ? 1 : 0 }));
  }
  const cdaCap = tlCapList(tl.cdas, 10, cdaAll);
  if (tl.cdas.length && !hid('presc')) {
    sections.push({ kind: 'head', label: 'CDAs sem processo · ajuizar', sub: tl.cdas.length + ' em risco', icon: 'file' });
    cdaCap.shown.forEach(c => sections.push({ kind: 'cda', c }));
    if (cdaCap.more > 0 || (cdaAll && tl.cdas.length > 10)) sections.push({ kind: 'cdamore', n: cdaCap.more });
  }
  const orphan = tl.items.filter(i => !i.execId && !hid(i.kind) && (i.kind === 'aud' || i.kind === 'rev'));
  if (orphan.length) sections.push({ kind: 'op', its: orphan });
  /* rótulos: dentro do foco, em faixas; perto de "hoje" primeiro */
  const labelFor = (its) => {
    const cand = its.filter(it => !hid(it.kind) && inFocus(it.d));
    const lay = tlLayoutLabels(cand.map(it => ({ id: it.id, x: f(daysUntil(it.d)), w: cxTlMeasure(msTxt(it)) + 8, prio: Math.abs(daysUntil(it.d)) - (TL_KIND_WEIGHT[it.kind] || 0) * 25 })), { minX: S.pastW + 4, maxX: S.pastW + S.focusW - 4, levels: 3 });
    return { lay, placed: new Map(lay.placed.map(p => [p.id, p])) };
  };
  sections.forEach(v => {
    if (v.kind === 'proc') {
      const X = v.x;
      v.its = tl.items.filter(it => it.execId === X.e.id && it.d && !it.mark);
      v.lab = labelFor(v.its);
      const L = v.lab.lay.levels;
      v.by = L ? 24 + 13 * L : 22;
      v.strip = !!(X.presc && !hid('presc') && (X.presc.segs.length || X.presc.band || X.presc.marks.length));
      v.h = v.by + (v.strip ? 42 : 18);
    } else if (v.kind === 'op') {
      v.lab = labelFor(v.its);
      const L = v.lab.lay.levels;
      v.by = L ? 24 + 13 * L : 22;
      v.h = v.by + 14;
    } else if (v.kind === 'cda') v.h = 44;
    else if (v.kind === 'cdamore' || v.kind === 'extgrp') v.h = 32;
    else v.h = 30;
  });
  let yy = CX_TL_AXIS;
  sections.forEach(v => { v.y = yy; yy += v.h; });
  const H = yy;
  const rowY = {};
  sections.forEach(v => { if (v.kind === 'proc') rowY[v.x.e.id] = v.y + v.by; });
  const links = [];
  tl.links.forEach(l => {
    if (rowY[l.a] == null || rowY[l.b] == null) return;
    const xa = cl(f(daysUntil(tl.info.get(l.b).start)));
    links.push({ l, x: xa, ya: rowY[l.a], yb: rowY[l.b] });
  });
  /* ── eixo ── */
  const fa = tlFocusAxis({ f0, f1, ppd: S.ppd, f, todayIso, isOff });
  const zp = tlZoneTicks(S.zP, 0, todayIso, { labelFirst: true });
  const zu = tlZoneTicks(S.zU, S.pastW + S.focusW, todayIso, {});
  /* intervalo em dias de cada quebra (mesma ordem de zp.breaks + zu.breaks), para o tooltip */
  const brkAll = zp.breaks.concat(zu.breaks).concat(zp.squeezed.map(q => ({ ...q, sq: true })), zu.squeezed.map(q => ({ ...q, sq: true })));
  brkRef.current = brkAll;
  const nearToday = (px) => Math.abs(px - x0) < 22;
  /* rótulos de mês do foco: por extenso se couber (mês largo), abreviado se não; nunca um por cima do outro */
  const shortM = 30.44 * S.ppd < 92;
  const mLab = (m) => (shortM ? m.short : m.text);
  const mLw = (m) => cxTlMeasure(mLab(m), 11.5) + 12;
  const majors = [];
  let lastEnd = -1e9;
  fa.majors.filter(m => !m.partial).forEach(m => { if (m.x >= lastEnd + 4) { majors.push(m); lastEnd = m.x + mLw(m); } });
  const part = fa.majors.find(m => m.partial);
  if (part && (!majors.length || part.x + mLw(part) + 4 <= majors[0].x)) majors.unshift(part);
  /* ── marcador clicável ── */
  const mk = (it, X, Y) => <button key={it.id + '@' + Y} type="button" className="cx-tl-g" style={{ left: X, top: Y }} data-tl={it.id} aria-label={it.l + (it.d ? ' · ' + fmtDate(it.d) : '')} onClick={() => open(it)}><CxTlGlyph kind={it.kind} c={cxTlColor(it)} hollow={it.hollow} s={it.big ? 16 : 14} /></button>;
  const labelEls = (v, its, inner) => {
    its.forEach(it => {
      const pl = v.lab.placed.get(it.id); if (!pl) return;
      const X = f(daysUntil(it.d));
      const top = v.by - 20 - 13 * (pl.level + 1);
      if (pl.level > 0) inner.push(<span key={'ld' + it.id} className="cx-tl-lead" style={{ left: X, top: top + 13, height: v.by - 18 - (top + 13) }} />);
      inner.push(<span key={'l' + it.id} className={'cx-tl-dm-l' + (it.kind === 'prazo' && daysUntil(it.d) < 0 ? ' late' : '')} data-tl={it.id} onClick={() => open(it)} style={{ left: pl.x0, top, width: pl.x1 - pl.x0, textAlign: pl.anchor === 'end' ? 'right' : 'left' }}>{msTxt(it)}</span>);
    });
    const dropped = v.lab.lay.dropped.length;
    if (dropped) inner.push(<span key="drop" className="cx-tl-drop" style={{ top: 3 }} title="Marcos sem rótulo: passe o mouse sobre o marcador">+{dropped} sem rótulo</span>);
  };
  const left = (v, k) => {
    const st0 = { height: v.h };
    if (v.kind === 'head') return <div key={k} className="cx-tl-rl hd" style={st0}>{v.icon ? <CxIcon n={v.icon} s={13} /> : null}<span className="cx-ell">{v.label}</span>{v.sub ? <span className="cx-tl-hsub">{v.sub}</span> : null}</div>;
    if (v.kind === 'op') return <div key={k} className="cx-tl-rl" style={{ ...st0, alignItems: 'flex-end', paddingBottom: 10 }}><CxIcon n="flag" s={13} /><span className="cx-ell">Operação</span><span className="cx-tl-hsub">audiências · revisão</span></div>;
    if (v.kind === 'extgrp') return <div key={k} className="cx-tl-rl sub click" style={{ ...st0, paddingLeft: 12 }} role="button" tabIndex={0} aria-expanded={extOpen} onClick={() => setExtOpen(o => !o)} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setExtOpen(o => !o); } }} title="Execuções extintas ficam recolhidas para não dominar a régua; as datas delas só puxam o eixo quando você as mostra."><span aria-hidden="true" style={{ color: 'var(--cx-ink-3)', fontSize: 11, width: 13, textAlign: 'center' }}>{extOpen ? '▾' : '▸'}</span><span className="cx-ell cx-link-btn" style={{ padding: 0 }}>{v.n} execuções extintas · {extOpen ? 'ocultar' : 'mostrar'}</span></div>;
    if (v.kind === 'cdamore') return <div key={k} className="cx-tl-rl sub click" style={{ ...st0, paddingLeft: 26 }} role="button" tabIndex={0} onClick={() => setCdaAll(a => !a)} onKeyDown={ev => { if (ev.key === 'Enter') setCdaAll(a => !a); }}><span className="cx-ell cx-link-btn" style={{ padding: 0 }}>{cdaAll ? 'Mostrar só as 10 primeiras' : '+' + v.n + (v.n === 1 ? ' CDA' : ' CDAs') + ' · mostrar todas'}</span></div>;
    if (v.kind === 'cda') {
      const c = v.c, bar = tlCdaBar({ start: c.start, end: c.end, today: todayIso });
      return <div key={k} className={'cx-tl-rl pr sub' + (onOpenCda ? ' click' : '')} style={{ ...st0, paddingLeft: 26 }} role={onOpenCda ? 'button' : undefined} tabIndex={onOpenCda ? 0 : undefined} onClick={onOpenCda ? () => onOpenCda({ id: c.d.id, operationId: c.d.operationId }) : undefined} onKeyDown={onOpenCda ? (ev => { if (ev.key === 'Enter') onOpenCda({ id: c.d.id, operationId: c.d.operationId }); }) : undefined} title={c.r.detail || ''}>
        <CxIcon n="hourglass" s={13} style={{ color: 'var(--cx-violet)' }} />
        <span className="cx-tl-l2"><span className="cx-mono cx-ell" style={{ fontSize: 11.5 }}>{c.d.cdaNumber || 'S/N'}</span><span className="cx-ell cx-tl-who">{[c.d.tribute || c.d.system, c.d.value ? cxMoneyShort(c.d.value) : '', bar.late ? 'vencida' : 'faltam ' + tlDurLabel(bar.left)].filter(Boolean).join(' · ')}</span></span>
      </div>;
    }
    const e = v.x.e, X = v.x;
    const sub = [X.rel, X.who, X.cdaN ? cxPl(X.cdaN, 'CDA', 'CDAs') + (X.cdaVal ? ' · ' + cxMoneyShort(X.cdaVal) : '') : ''].filter(Boolean).join(' · ');
    const stat = e.status && e.status !== 'ativa' ? (EXEC_STATUSES[e.status] || {}).label : '';
    const statShort = { arquivada: 'Arquivada', suspensa: 'Suspensa', suspensa_parcelamento: 'Parcelamento', extinta: 'Extinta' }[e.status] || stat;
    return <div key={k} className={'cx-tl-rl pr' + (onOpenProc ? ' click' : '')} style={{ ...st0, paddingLeft: 12 + (v.depth || 0) * 14, alignItems: 'flex-start', paddingTop: Math.max(4, v.by - 17) }} role={onOpenProc ? 'button' : undefined} tabIndex={onOpenProc ? 0 : undefined}
      onClick={onOpenProc ? () => onOpenProc(e.id) : undefined} onKeyDown={onOpenProc ? (ev => { if (ev.key === 'Enter') onOpenProc(e.id); }) : undefined}
      title={[X.role, e.processNumber, X.rel, X.who, e.court, X.cdaN ? cxPl(X.cdaN, 'CDA', 'CDAs') + ' · ' + cxMoneyShort(X.cdaVal) : '', stat].filter(Boolean).join(' · ')}>
      <span className="cx-ptag" style={{ '--c': cxTagColor(e) }}>{cxExecTag(e)}</span>
      <span className="cx-tl-l2"><span className="cx-ell" style={{ fontWeight: 500 }}>{X.role}{stat ? <span className="cx-tl-stat" title={stat}>{statShort}</span> : null}</span><span className="cx-ell cx-tl-who"><span className="cx-mono">{cxExecShortNum(e)}</span>{sub ? ' · ' + sub : ''}</span></span>
    </div>;
  };
  const right = (v, k) => {
    const st0 = { height: v.h }, inner = [];
    if (v.kind === 'head' || v.kind === 'cdamore' || v.kind === 'extgrp') return <div key={k} className={'cx-tl-rr' + (v.kind === 'head' ? ' ms' : '')} style={st0} />;
    if (v.kind === 'op') {
      v.its.filter(it => !hid(it.kind)).forEach(it => { const o = daysUntil(it.d); if (o !== null) inner.push(mk(it, cl(f(o)), v.by)); });
      labelEls(v, v.its, inner);
      return <div key={k} className="cx-tl-rr" style={st0}>{inner}</div>;
    }
    if (v.kind === 'cda') {
      const c = v.c, it = c.it, bar = tlCdaBar({ start: c.start, end: c.end, today: todayIso }), Y = 30;
      const a = span(c.start, c.end), o = daysUntil(c.end);
      if (a) {
        const xn = Math.max(a.left, Math.min(a.left + a.width, x0));
        inner.push(<span key="s1" className="cx-tl-seg inter thin" data-tl={it.id} style={{ left: a.left, width: Math.max(2, xn - a.left), top: Y - 4 }} />);
        if (a.left + a.width > xn + 1) inner.push(<span key="s2" className="cx-tl-seg inter rest thin" data-tl={it.id} style={{ left: xn, width: a.left + a.width - xn, top: Y - 4 }} />);
      }
      const X = cl(f(o));
      const txt = bar.late ? 'venceu há ' + tlDurLabel(-bar.left).replace(/^há /, '') + ' · ' + cxDM(c.end) : 'ajuizar até ' + fmtDate(c.end) + ' · faltam ' + tlDurLabel(bar.left);
      const w = cxTlMeasure(txt) + 8, lx = Math.max(4, Math.min(X + 8 - w, CW - w - 4));
      inner.push(mk(it, X, Y));
      inner.push(<span key="tx" className={'cx-tl-cdal' + (bar.late ? ' late' : '')} data-tl={it.id} onClick={() => open(it)} style={{ left: lx, top: 4, width: w }}>{txt}</span>);
      return <div key={k} className="cx-tl-rr" style={st0}>{inner}</div>;
    }
    /* processo */
    const X = v.x, e = X.e, by = v.by;
    const bar = span(X.start, X.end || addCalendarDays(todayIso, Math.ceil(S.hi)));
    if (bar) inner.push(<div key="b" className={'cx-tl-bar thin' + (X.end ? ' ended' : ' open-end')} data-tl={'bar|' + e.id} style={{ left: bar.left, width: bar.width, top: by - 4, '--c': cxTagColor(e) }} />);
    /* janelas de prazo (início → final) acima da linha, com o ▼ no vencimento */
    v.its.filter(it => it.kind === 'prazo' && !hid('prazo')).forEach(it => {
      const w = span(it.from, it.d); if (!w) return;
      const c = cxTlPrazoColor(it.d);
      if (w.width >= 6) inner.push(<span key={'w' + it.id} className="cx-tl-win" data-tl={it.id} style={{ left: w.left, width: w.width, top: by - 12, '--c': c }} onClick={() => open(it)} />);
      inner.push(<button key={'g' + it.id} type="button" className="cx-tl-g" style={{ left: cl(f(daysUntil(it.d))), top: by - 9 }} data-tl={it.id} aria-label={it.l + ' · final ' + fmtDate(it.d)} onClick={() => open(it)}><CxTlGlyph kind="prazo" c={c} s={14} /></button>);
    });
    v.its.filter(it => it.kind !== 'prazo' && !hid(it.kind)).forEach(it => { const o = daysUntil(it.d); if (o !== null) inner.push(mk(it, cl(f(o)), by)); });
    labelEls(v, v.its, inner);
    /* faixa de prescrição sob a linha */
    if (v.strip) {
      const pr = X.presc, sy = by + 18;
      const mxs = pr.marks.map(m => cl(f(daysUntil(m.d))));
      pr.segs.forEach((s, j) => {
        const b = span(s.from, s.to); if (!b) return;
        const names = { susp: 'Suspensão de 1 ano', inter: 'Contagem de 5 anos', pausa: 'Parcelamento', susp2: s.l || 'Pausa' };
        inner.push(<span key={'s' + j} className={'cx-tl-seg ' + s.t} data-tl={'seg|' + names[s.t] + '|' + fmtDate(s.from) + ' a ' + fmtDate(s.to)} style={{ left: b.left, width: b.width, top: sy - 7 }} />);
        const w = cxTlMeasure(names[s.t]) + 6;
        if (b.width > w + 12) { const gx = tlPickGap(mxs, b.left + 4, b.left + b.width - 4, w, { half: 8 }); if (gx !== null) inner.push(<span key={'sl' + j} className="cx-tl-seg-l" style={{ left: gx - 6, top: sy - 18 }}>{names[s.t]}</span>); }
      });
      if (pr.band) {
        const b = span(pr.band.from, pr.band.to);
        if (b) {
          inner.push(<span key="band" className="cx-tl-band" data-tl={'band|' + e.id} style={{ left: b.left, width: b.width, top: sy - 6 }} />);
          const txt = 'Prescrição · ' + (CX_PRESC_TXT[pr.r.status] || pr.r.status) + ' · piso ' + fmtDate(pr.band.to);
          const tw = cxTlMeasure(txt, 11) + 6;
          inner.push(<span key="bandt" className="cx-tl-bandt" style={{ left: Math.max(6, Math.min(Math.max(b.left, b.left < S.pastW ? S.pastW + 6 : 0), CW - tw - 8)), top: sy + 7 }}>{txt}</span>);
        }
      }
      pr.marks.forEach(m => { const o = daysUntil(m.d); if (o !== null && !hid('presc')) inner.push(mk(m, cl(f(o)), sy)); });
    }
    return <div key={k} className="cx-tl-rr" style={st0}>{inner}</div>;
  };
  /* ── legenda e ferramentas ── */
  const legendKinds = TL_KIND_ORDER.filter(k => counts[k] > 0);
  const kindColor = (k) => (k === 'dec' ? 'var(--cx-green)' : k === 'prazo' ? 'var(--cx-blue)' : k === 'presc' ? 'var(--cx-violet)' : k === 'aud' ? 'var(--cx-orange)' : k === 'rev' ? 'var(--cx-accent)' : undefined);
  const sum = cxTlSummary(tl, todayIso);
  const setWindow = (w) => upd({ w, c: tlFocusDefault(w).c });
  const shift = (d) => upd({ c: st.c + d });
  const rd = (o) => { const iso = addCalendarDays(todayIso, Math.round(o)); return st.w >= 180 ? fmtDate(iso) : cxDM(iso); };
  const rangeTxt = rd(f0) + ' → ' + rd(f1);
  return <div onClick={ev => { const t = ev.target.closest && ev.target.closest('[data-tl]'); if (!t) return; const k = t.getAttribute('data-tl'); if (k.indexOf('bar|') === 0) onOpenProc && onOpenProc(k.slice(4)); }}>
    <div className="cx-tl-tools cx-tl-pan">
      {lead}
      <span className="cx-tl-leg-h" style={{ marginLeft: lead ? 10 : 0 }}>Janela de foco</span>
      <CxSeg className="lg" label="Janela de foco" value={String(st.w)} onChange={v => setWindow(+v)} options={TL_WINDOWS.map(w => [String(w), tlWindowLabel(w)])} />
      <span className="cx-sp" />
      <span className="cx-tl-rng">{rangeTxt}</span>
      <div className="cx-seg cx-tl-nav" role="group" aria-label="Mover a janela">
        <button type="button" onClick={() => shift(-step)} title={'Voltar ' + step + ' dias'}>‹ {step} d</button>
        <button type="button" onClick={() => upd({ c: tlFocusDefault(st.w).c })} title="Voltar o foco para hoje">Hoje</button>
        <button type="button" onClick={() => shift(step)} title={'Avançar ' + step + ' dias'}>{step} d ›</button>
      </div>
    </div>
    {sum.length ? <div className="cx-tl-sum">{sum.map(s => <span key={s.k} className={s.k}>{s.node}</span>)}</div> : null}
    <div className="cx-tl-legend top">
      <span className="cx-tl-leg-h">Mostrar</span>
      {legendKinds.map(k => <button key={k} type="button" className={'cx-fchip sm cx-tl-chip' + (hid(k) ? ' off' : ' on')} aria-pressed={!hid(k)} onClick={() => upd({ hidden: tlToggleKind(st.hidden, k) })} title={(hid(k) ? 'Mostrar ' : 'Ocultar ') + TL_KINDS[k].plural.toLowerCase()}>
        <CxTlGlyph kind={k} c={kindColor(k)} s={14} />{TL_KINDS[k].label}<span className="cx-fcn">{counts[k]}</span>
      </button>)}
      <span className="cx-tl-leg-br" />
      <span className="cx-tl-leg-h">Leitura</span>
      <span><i className="cx-lg-sw" style={{ background: 'color-mix(in srgb, var(--cx-cyan) 22%, var(--cx-surface))', border: '1px solid color-mix(in srgb, var(--cx-cyan) 45%, transparent)', height: 6 }} />Processo</span>
      <span><i className="cx-lg-sw cx-tl-win" style={{ position: 'static', '--c': 'var(--cx-blue)', height: 7 }} />Janela do prazo</span>
      <span><i className="cx-lg-sw cx-tl-band" style={{ position: 'static', height: 10 }} />Faixa até o piso</span>
      <span><i className="cx-lg-sw cx-tl-seg susp" />Suspensão de 1 ano</span>
      <span><i className="cx-lg-sw cx-tl-seg inter" />Contagem de 5 anos</span>
      <span><i className="cx-lg-sw cx-tl-seg pausa" />Parcelamento</span>
      <span><i className="cx-tl-brk-k" aria-hidden="true" />Quebra do eixo</span>
      <span className="cx-tl-leg-out"><i className="cx-tl-oc" style={{ background: 'var(--cx-green)' }} />favorável<i className="cx-tl-oc" style={{ background: 'var(--cx-red)' }} />desfavorável<i className="cx-tl-oc" style={{ background: 'var(--cx-yellow)' }} />pendente</span>
    </div>
    <div className="cx-tl" {...tip.bind}>
      <div className="cx-tl-l"><div className="cx-tl-hd">Processo · papel · devedor</div>{sections.map((v, k) => left(v, k))}</div>
      <div className="cx-tl-r" ref={rRef}>
        <div className="cx-tl-cv" style={{ width: CW, height: H }}>
          <div className="cx-tl-axis" style={{ height: CX_TL_AXIS }}>
            {S.pastW ? <span className="cx-tl-zl" style={{ left: 0, width: S.pastW }} /> : null}
            {S.futW ? <span className="cx-tl-zl" style={{ left: S.pastW + S.focusW, width: S.futW }} /> : null}
            {S.pastW >= 120 ? <span className="cx-tl-cap" style={{ left: 6 }}>PASSADO · COMPRIMIDO</span> : null}
            <span className="cx-tl-cap foc" style={{ left: S.pastW + 6 }}>FOCO · {st.w === 365 ? '1 ANO' : st.w + ' DIAS'} · {rangeTxt}</span>
            {S.futW >= 120 ? <span className="cx-tl-cap" style={{ right: 6 }}>FUTURO · COMPRIMIDO</span> : null}
            {majors.map((m, i) => <span key={'M' + i} className="cx-tl-major" style={{ left: m.x }}>{mLab(m)}</span>)}
            {fa.ticks.filter(tk => !nearToday(tk.x)).map((tk, i) => <span key={'T' + i} className={'cx-tl-tick' + (tk.we ? ' we' : '')} style={{ left: tk.x }}>{tk.text}</span>)}
            {zp.labels.concat(zu.labels).map((lb, i) => <span key={'Z' + i} className="cx-tl-major zn" style={{ left: lb.x }}>{lb.text}</span>)}
            {brkAll.map((b, i) => {
              const mid = (b.x0 + b.x1) / 2, hw = Math.max(22, b.x1 - b.x0);
              return <React.Fragment key={'br' + i}>
                {b.sq ? <span className="cx-tl-sqb" style={{ left: b.x0, width: Math.max(2, b.x1 - b.x0) }} /> : <span className="cx-tl-brk" style={{ left: mid - 6 }} />}
                <span className="cx-tl-brk-hit" data-tl={'brk|' + i} style={{ left: mid - hw / 2, width: hw, top: CX_TL_AXIS - 22 }} />
                {!b.sq && b.showLabel ? <span className="cx-tl-brk-l" style={{ left: mid - Math.max(22, b.x1 - b.x0) / 2, width: Math.max(22, b.x1 - b.x0) }}>{b.label}</span> : null}
              </React.Fragment>;
            })}
          </div>
          {S.pastW ? <span className="cx-tl-zone" style={{ left: 0, width: S.pastW, top: CX_TL_AXIS }} /> : null}
          {S.futW ? <span className="cx-tl-zone" style={{ left: S.pastW + S.focusW, width: S.futW, top: CX_TL_AXIS }} /> : null}
          {fa.shade.map((s, i) => <span key={'sh' + i} className={'cx-tl-shade' + (s.holiday ? ' hol' : '')} style={{ left: s.x, width: s.w }} />)}
          {fa.grid.map((g, i) => <span key={'g' + i} className={'cx-tl-grid' + (g.strong ? ' strong' : '')} style={{ left: g.x }} />)}
          {zp.ticks.concat(zu.ticks).map((tk, i) => <span key={'zt' + i} className="cx-tl-grid strong zt" style={{ left: tk.x }} />)}
          {brkAll.filter(b => !b.sq).map((b, i) => <span key={'bg' + i} className="cx-tl-brk-g" style={{ left: Math.round((b.x0 + b.x1) / 2), top: CX_TL_AXIS }} />)}
          {sections.map((v, k) => right(v, k))}
          <svg className="cx-tl-svg" width={CW} height={H}>{links.map((l, k) => { const d = 'M' + l.x + ' ' + l.ya + ' C ' + (l.x - 16) + ' ' + l.ya + ', ' + (l.x - 16) + ' ' + l.yb + ', ' + l.x + ' ' + l.yb; return <g key={k} data-tl={l.l.id}><path d={d} className={'cx-tl-link' + (l.l.type === 'cover' ? ' cover' : '')} /><path d={d} className="cx-tl-link-hit" /><circle cx={l.x} cy={l.yb} r="2.5" style={{ fill: 'var(--cx-ink-3)' }} /></g>; })}</svg>
          <div className="cx-tl-today" style={{ left: x0 }}><span>Hoje</span></div>
        </div>
      </div>
      {tip.node}
    </div>
  </div>;
}
/* Modos da página Linha do tempo: Panorama (M1, a régua), Frentes (M3, o mapa de dependências), Prescrição (M4, o relógio por CDA) e Narrativa (M2); um modo
   novo entra aqui: basta acrescentar [chave, rótulo] a CX_TL_MODES e o componente em CX_TL_VIEWS (recebe { tl, op, lead, … };
   `lead` é o seletor de operação mais o seletor de modo, e a visão o coloca na própria barra de ferramentas).
   Com um modo só, o seletor fica escondido. O modo escolhido é lembrado neste navegador. */
const CX_TL_MODES = [['panorama', 'Panorama'], ['frentes', 'Frentes'], ['prescricao', 'Prescrição'], ['narrativa', 'Narrativa']];
const CX_TL_VIEWS = { panorama: EditionClaudeTimelinePanorama, frentes: EditionClaudeTimelineFrentes, prescricao: EditionClaudeTimelineClocks, narrativa: EditionClaudeTimelineNarrative };
const CX_TL_DESC = {
  panorama: 'Processos, prazos e a contagem da prescrição numa régua com foco no agora: o passado e o futuro distantes ficam comprimidos nas laterais. Clique num marco para abrir o processo, a audiência, a intimação ou a CDA. A faixa de prescrição usa o cálculo do app, pela CDA em pior situação de cada processo.',
  frentes: 'O que depende de quê: uma raia por processo (IDPJ, MCF, execuções, exceção, agravo, CDAs) numa sequência de acontecimentos, com setas de efeito e de condição. Passe o mouse numa estação para ver o que a originou e o que ela destrava; "Caminho crítico" realça o que ainda precisa acontecer até o que está por decidir. Clique numa estação para abrir o processo, a intimação, a audiência ou a CDA.',
  prescricao: 'Quanto tempo falta, CDA por CDA: o que já parou ou zerou o relógio e o que reiniciaria a contagem. Termos e dias são os da Mesa de prazos; cada barra vale 5 anos (ou 1+5), então dá para comparar CDAs de idades diferentes. Clique numa CDA para abrir a ficha com a memória de cálculo.',
  narrativa: 'A história da operação em ordem de importância: o que está atrasado e o que vem (do mais próximo ao mais distante), e abaixo do divisor Hoje o que já houve, com as decisões em destaque e o que você mesmo fez. Filtre por natureza ou por processo; clique num cartão para abrir o processo, a intimação, a audiência, a tarefa ou a CDA.',
};
const CX_TL_MODE_STORE = 'nexus_cx_tl_mode';
function cxTlLoadMode() { const m = cxLs(CX_TL_MODE_STORE, 'panorama'); return CX_TL_VIEWS[m] ? m : 'panorama'; }
function EditionClaudeTimelinePage({ data, opId, setOpId, prescLookup, prazosRadar, onOpenIntim, onOpenHearing, onOpenOp, onOpenCda, onOpenProc, onOpenTask }) {
  const ops = (data.operations || []).filter(o => o.status !== 'encerrada' && !isSubstituicaoOp(o)).slice().sort(sortOpsByName);
  const op = ops.find(o => o.id === opId) || ops[0];
  const [mode, setModeS] = React.useState(cxTlLoadMode);
  const setMode = (m) => { setModeS(m); cxLsSet(CX_TL_MODE_STORE, m); };
  const tl = React.useMemo(() => (op ? cxBuildTimeline(data, op, prescLookup) : null), [data, op, prescLookup]);
  const View = CX_TL_VIEWS[mode] || CX_TL_VIEWS.panorama;
  const [proView, setProView] = React.useState(null); // leitura de uma atuação proativa (clique na Narrativa)
  const proExec = proView ? (data.executions || []).find(x => x.id === proView.execId) : null;
  const proAct = proExec ? (proExec.proactiveActions || []).find(x => x.id === proView.actionId) : null;
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-page-h"><div><h1>Linha do tempo</h1><p>{CX_TL_DESC[mode] || CX_TL_DESC.panorama}</p></div>
      {op ? <div className="cx-acts"><button type="button" className="cx-btn" onClick={() => onOpenOp(op.id)}>Abrir operação<CxIcon n="chevR" s={13} /></button></div> : null}</div>
    {!op ? <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma operação ativa.</div></div> : <>
      <View key={op.id + '|' + mode} tl={tl} op={op} data={data} prazosRadar={prazosRadar} prescLookup={prescLookup} lead={<>
        <CxSelect id="cx-tl-op" pre="Operação" value={op.id} onChange={setOpId} options={ops.map(o => [o.id, cxOpName(o)])} />
        {CX_TL_MODES.length > 1 ? <CxSeg className="lg" label="Modo" value={mode} onChange={setMode} options={CX_TL_MODES} /> : null}
      </>} onOpenIntim={onOpenIntim} onOpenHearing={onOpenHearing} onOpenCda={onOpenCda} onOpenProc={onOpenProc} onOpenTask={onOpenTask} onOpenProativa={(execId, actionId) => setProView({ execId, actionId })} />
    </>}
    {proAct ? <EditionClaudeAtuacaoView exec={proExec} action={proAct} onClose={() => setProView(null)} /> : null}
  </div>;
}

/* ═════════════════════ Relógio da prescrição por CDA (M4) ═════════════════════
   "Quanto tempo falta, CDA por CDA? O que já parou ou zerou o relógio, e o que eu precisaria fazer para reiniciá-lo?"
   Vive na aba Inscrições da operação (visão "Relógios") e na Linha do tempo (modo Prescrição, uma operação). Em Prazos
   extintivos os relógios foram fundidos à Mesa (fase 4a): régua compacta na linha da CDA e calendário recolhível. Tudo sai do motor e da Mesa (src/lib/clocks.js): onde a Mesa lista a CDA, o termo e os dias
   são os dela. A barra é normalizada (5 anos, ou 1+5): dá para comparar CDAs de idades diferentes; o calendário de
   termos mostra as datas absolutas. "E se eu ajuizar hoje?" roda o motor com um ajuizamento hipotético, só na tela. */
const CX_CLK_TONE = { red: 'var(--cx-red)', orange: 'var(--cx-orange)', yellow: 'var(--cx-yellow)', green: 'var(--cx-green)', cyan: 'var(--cx-cyan)', grey: 'var(--cx-ink-3)' };
const cxClkTone = (group) => CX_CLK_TONE[(CLK_GROUPS.find(g => g.key === group) || {}).tone] || 'var(--cx-ink-3)';
const CX_CLK_SIM_TIP = 'Roda o motor de prescrição com um ajuizamento hoje (despacho que ordena a citação), só nesta tela. Nada é gravado.';
function cxClkCountdown(c) {
  if (c.kind === 'orig') {
    const d = c.termDays;
    if (d == null) return { big: '—', sm: '' };
    if (d < 0) return { big: 'vencida', sm: tlDurLabel(d) + (c.estimated ? ' (estimado)' : ''), cls: 'late' };
    return { big: d === 0 ? 'hoje' : d < 366 ? d + (d === 1 ? ' dia' : ' dias') : tlDurLabel(d), sm: 'para ajuizar' + (c.estimated ? ' (est.)' : '') };
  }
  if (c.kind === 'inter') {
    const d = c.termDays;
    if (d != null && d < 0) return { big: 'vencida', sm: tlDurLabel(d) + (c.estimated ? ' (estimado)' : ''), cls: 'late' };
    return { big: d == null ? '—' : tlDurLabel(d), sm: 'de prescrição intercorrente' };
  }
  if (c.kind === 'parc') {
    const since = c.since ? tlDurLabel(-daysUntil(c.since)) : '';
    return { big: 'parado', sm: c.cause === 'pausa' ? 'pausa da exigibilidade' : (since ? since + ' de parcelamento' : 'parcelamento vigente'), small: true };
  }
  if (c.kind === 'piso') return { big: c.floor ? c.floor.slice(0, 4) : '—', sm: 'piso · ' + (c.floorDays != null ? tlDurLabel(c.floorDays) : ''), small: true };
  return { big: '—', sm: 'falta dado', small: true };
}
/* Dica (texto) da barra compacta: início, termo, faixa cedo–tarde e onde está o dia de hoje. */
function cxClkTipText(c, todayIso, band) {
  const out = [];
  if (c.kind === 'orig') out.push((c.startKnown ? 'constituição ' : 'início estimado ') + fmtDate(c.start) + ' → ' + (c.estimated ? 'termo estimado ' : 'termo ') + fmtDate(c.term));
  else if (c.kind === 'inter') out.push('marco ' + fmtDate(c.start) + ' (1 ano de suspensão) → ' + (c.estimated ? 'termo estimado ' : 'termo ') + fmtDate(c.term));
  else if (c.kind === 'parc') out.push(c.cause === 'pausa' ? 'pausa vigente: o relógio está parado' : 'parcelamento vigente' + (c.since ? ' desde ' + fmtDate(c.since) : '') + ': o relógio está parado');
  else if (c.kind === 'piso') out.push((c.anchor ? 'ciclo encerrado em ' + fmtDate(c.anchor.iso) + ' → ' : 'sem relógio ativo → ') + 'piso ' + fmtDate(c.floor) + ' (só há risco depois de novo marco)');
  else out.push('faltam dados para calcular o relógio');
  if (band && band.cedo && band.tarde) out.push('faixa cedo ' + fmtDate(band.cedo) + ' – tarde ' + fmtDate(band.tarde));
  out.push('hoje ' + fmtDate(todayIso));
  return out.join(' · ');
}
/* Barra do relógio. `compact` (linha da Mesa de prazos): fina, sem rótulos (a dica traz início e termo), na cor do cartão
   (`tone`) e com a faixa cedo–tarde (`band`: { cedo, tarde }) quando houver. Sem `compact`, a barra dos Relógios. */
function CxClkBar({ c, todayIso, compact, band, tone: toneIn }) {
  const tone = cxClkTone(c.group);
  const pc = (a, b, x) => clkPct(a, b, x) * 100;
  const inband = !!(compact && band && band.cedo && band.tarde && (c.kind === 'orig' || c.kind === 'inter'));
  // com a faixa, a escala vai até a data tarde (se for depois do termo) para a faixa caber na barra
  const endIso = inband && band.tarde > c.term ? band.tarde : c.term;
  let trk = null, left = null, right = null, hojeP = null, hojeTxt = 'HOJE', term = null;
  if (c.kind === 'orig') {
    const p = pc(c.start, endIso, todayIso), late = c.termDays != null && c.termDays < 0;
    hojeP = p; hojeTxt = compact ? 'HOJE' : 'HOJE · ' + (late ? '100' : Math.round(p)) + '%';
    trk = <><div className={'cx-clk-fill' + (late && !compact ? ' late' : '')} style={{ width: p + '%' }} />{compact ? null : [20, 40, 60, 80].map(t => <i key={t} className="cx-clk-tk" style={{ left: t + '%' }} />)}</>;
    left = <>{c.startKnown ? 'constituição' : 'início estimado'} <b>{fmtDate(c.start)}</b></>;
    right = <>{c.estimated ? 'termo estimado' : 'termo'} <b>{fmtDate(c.term)}</b></>;
    term = <CxTlGlyph kind="presc" c={tone} s={20} />;
  } else if (c.kind === 'inter') {
    const p = pc(c.start, endIso, todayIso);
    hojeP = p; if (compact) hojeTxt = 'HOJE';
    trk = <>{c.segs.map((s, i) => {
      const a = pc(c.start, endIso, s.from), b = pc(c.start, endIso, s.to);
      if (s.t === 'susp') return <div key={i} className="cx-clk-sg susp" style={{ left: a + '%', width: Math.max(0.6, b - a) + '%' }} />;
      return <React.Fragment key={i}><div className="cx-clk-sg rest" style={{ left: a + '%', width: Math.max(0, b - a) + '%' }} /><div className={'cx-clk-fill' + (c.termDays < 0 && !compact ? ' late' : '')} style={{ left: a + '%', width: Math.max(0, Math.min(p, b) - a) + '%' }} /></React.Fragment>;
    })}{compact ? null : [1, 2, 3, 4, 5].map(t => <i key={t} className="cx-clk-tk" style={{ left: (t / 6 * 100) + '%' }} />)}</>;
    left = <>marco <b>{fmtDate(c.start)}</b> · 1 ano de suspensão</>;
    right = <>{c.estimated ? 'termo estimado' : 'termo'} <b>{fmtDate(c.term)}</b></>;
    term = <CxTlGlyph kind="presc" c={tone} s={20} />;
  } else if (c.kind === 'parc') {
    hojeP = 46;
    trk = <><div className="cx-clk-sg parc" style={{ left: 0, width: '46%' }} /><div className="cx-clk-sg ghost" style={{ left: '46%', right: 0 }} /></>;
    left = c.since ? <>vigente desde <b>{fmtDate(c.since)}</b> · {tlDurLabel(-daysUntil(c.since))}</> : <><b>{c.cause === 'pausa' ? 'pausa vigente' : 'parcelamento vigente'}</b></>;
    right = c.cause === 'pausa' ? <>volta a correr <b>quando a pausa terminar</b></> : <>novo quinquênio <b>só na rescisão</b></>;
  } else if (c.kind === 'piso') {
    const a = (c.anchor && c.anchor.iso) || addCalendarYears(c.floor, -6);
    const p = Math.max(1.4, pc(a, c.floor, todayIso));
    hojeP = p;
    trk = <><div className="cx-clk-sg cyan" style={{ left: 0, width: p + '%' }} /><div className="cx-clk-sg rest" style={{ left: p + '%', right: 0 }} />{compact ? null : [1, 2, 3, 4, 5].map(t => <i key={t} className="cx-clk-tk" style={{ left: (t / 6 * 100) + '%' }} />)}</>;
    const ak = c.anchor && CX_FLOOR_KIND[c.anchor.kind];
    left = c.anchor ? <>{ak ? ak : 'ato'} <b>{fmtDate(c.anchor.iso)}</b> encerrou o ciclo{c.simulated ? <> · <b className="cx-clk-simtx">cenário simulado</b></> : null}</> : <>sem relógio ativo</>;
    right = <>piso <b>{fmtDate(c.floor)}</b> · só há risco depois de novo marco</>;
    term = <CxTlGlyph kind="presc" c="var(--cx-cyan)" hollow s={20} />;
  } else {
    trk = <div className="cx-clk-sg ghost" style={{ left: 0, right: 0 }} />;
    left = <>faltam dados para calcular o relógio</>;
  }
  if (compact) {
    const bandEl = inband ? (() => {
      const a = pc(c.start, endIso, band.cedo), b = pc(c.start, endIso, band.tarde);
      return <div className="cx-clk-band" style={{ left: a + '%', width: Math.max(1.2, b - a) + '%' }} />;
    })() : null;
    const tip = cxClkTipText(c, todayIso, inband ? band : null);
    return <div className="cx-clk-bar compact" style={toneIn ? { '--bar': toneIn } : undefined} title={tip} role="img" aria-label={'Relógio: ' + tip}>
      <div className="cx-clk-trk">
        <div className="cx-clk-tr">{trk}{bandEl}</div>
        {hojeP != null ? <div className="cx-clk-hoje" style={{ left: hojeP + '%' }}><span>{hojeTxt}</span></div> : null}
      </div>
    </div>;
  }
  return <div className="cx-clk-bar">
    <div className="cx-clk-trk">
      <div className="cx-clk-tr">{trk}</div>
      {hojeP != null ? <div className="cx-clk-hoje" style={{ left: hojeP + '%' }}><span>{hojeTxt}</span></div> : null}
      {term ? <span className="cx-clk-term">{term}</span> : null}
    </div>
    <div className="cx-clk-lbs"><span>{left}</span>{right ? <span className="r">{right}</span> : null}</div>
  </div>;
}
/* Valor curto do calendário ("48 mil", "1,2 mi"). */
function cxCalShort(v) {
  v = Number(v) || 0;
  if (v <= 0) return '—';
  if (v >= 1e9) return (Math.round(v / 1e8) / 10).toLocaleString('pt-BR') + ' bi';
  if (v >= 995000) { const x = v / 1e6; return (x >= 10 ? String(Math.round(x)) : (Math.round(x * 10) / 10).toLocaleString('pt-BR')) + ' mi'; }
  if (v >= 1000) return Math.round(v / 1000).toLocaleString('pt-BR') + ' mil';
  return 'R$ ' + Math.round(v);
}
/* Calendário dos termos (faixas por trimestre, semestre ou ano; pistas Termos e Pisos). Um só componente para os Relógios
   (Inscrições, Linha do tempo) e para a Mesa de prazos (`variant="mesa"`):
     cal    — saída de clkQuarterBins;  cells — clkCalCells(cal);  sel/onPick — chave da célula escolhida;
     next   — "Próximos termos" (clkNextDates);  noun — o que o clique filtra ("os relógios" | "a lista");
     cellClass(x) — classe de cor da célula (Relógios: grupo de risco; Mesa: cartão predominante, pisos em cinza);
     legend — legenda do cabeçalho;  collapsible/open/onToggle — card recolhível (Mesa: padrão recolhido).
   Nos Relógios o chip "Filtrando" fica dentro do card; na Mesa o chip mora junto dos filtros da página. */
function CxTermCalendar({ cal, cells, sel, onPick, onClear, next, variant, noun, cellClass, legend, collapsible, open, onToggle, emptyText }) {
  const mesa = variant === 'mesa';
  const selCell = sel ? cells.get(sel) || null : null;
  const tip = useCxTip(React.useCallback((key) => {
    if (key.indexOf('cal|') !== 0) return null;
    const x = cells.get(key.slice(4)); if (!x) return null;
    const pts = x.cell.points;
    const lines = pts.slice(0, 8).map(p => String(p.number).slice(-9) + (p.n > 1 ? ' +' + (p.n - 1) : '') + ' · ' + cxDM(p.d) + '/' + p.d.slice(2, 4) + ' · ' + cxMoneyShort(p.val) + ' · ' + (p.kind === 'piso' ? 'piso' : 'termo') + (p.card ? ' · ' + mesaCardName(p.card) : ''));
    if (pts.length > 8) { const rest = pts.slice(8); lines.push('+' + rest.length + (rest.length === 1 ? ' item' : ' itens') + ' (' + cxPl(rest.reduce((a, p) => a + (p.n || 1), 0), 'CDA', 'CDAs') + ')'); }
    lines.push(sel === key.slice(4) ? 'Clique para limpar o filtro' : 'Clique para filtrar ' + noun);
    return { when: x.label, title: cxPl(x.cell.cdas, 'CDA', 'CDAs') + ' · ' + cxMoneyShort(x.cell.value), lines, tone: x.lane === 'over' ? 'late' : '' };
  }, [cells, sel, noun]));
  const cellBtn = (k, col, row) => {
    const x = cells.get(k); if (!x) return null;
    const on = sel === k, c = x.cell;
    return <button key={k} type="button" className={'cx-cal-cc ' + cellClass(x) + (x.lane === 'over' ? ' venc' : '') + (on ? ' sel' : '')} style={{ gridColumn: col, gridRow: row }} data-tl={'cal|' + k} data-calk={k} aria-pressed={on}
      aria-label={x.label + ': ' + cxPl(c.cdas, 'CDA', 'CDAs') + ', ' + cxMoneyShort(c.value) + (on ? '. Clique para limpar o filtro.' : '. Clique para filtrar ' + noun + '.')} onClick={() => onPick(k)}>
      {x.lane === 'over' ? <span className="t0">Vencidos</span> : null}
      <span className="t1"><CxTlGlyph kind="presc" c="var(--c)" hollow={x.lane === 'piso'} s={x.lane === 'over' ? 12 : 11} />{c.cdas}{x.lane === 'over' ? <span className="t2i"> · {cxCalShort(c.value)}</span> : null}</span>
      {x.lane === 'over' ? null : <span className="t2">{cxCalShort(c.value)}</span>}
    </button>;
  };
  const clear = () => { if (onClear) onClear(); const k = sel; if (k) { const el = document.querySelector('[data-calk="' + k + '"]'); if (el) el.focus(); } };
  const overW = cal.overdue.points.length ? 96 : 74;
  const minW = 50 + overW + cal.cols.length * (cal.gran === 'q' ? 36 : cal.gran === 'h' ? 44 : 46);
  const showBody = !collapsible || open;
  const sub = cxPl(cal.total.cdas, 'CDA', 'CDAs') + ' · ' + cxMoneyShort(cal.total.value) + (cal.gran === 'h' ? ' · por semestre' : cal.gran === 'y' ? ' · por ano' : '');
  const nextEl = next.length ? <p className="cx-cal-next">Próximos termos: {next.map((x, i) => <React.Fragment key={x.d + x.kind}>{i ? ' · ' : ''}<b className={x.kind === 'piso' ? 'piso' : ''}>{cxDM(x.d)}/{x.d.slice(2, 4)}</b> {x.kind === 'piso' ? <span className="piso">piso </span> : null}{String(x.number).slice(-9)}{x.others > 0 ? ' +' + x.others : ''}</React.Fragment>)}</p> : (collapsible && !showBody ? <p className="cx-cal-next">Próximos termos: nenhum com data neste recorte.</p> : null);
  return <section className={'cx-card cx-clk-strip cx-cal' + (mesa ? ' mesa' : '') + (collapsible ? (open ? ' open' : ' shut') : '')} aria-label="Calendário dos termos" id={mesa ? 'cx-pz-cal' : undefined} {...tip.bind}>
    <div className="cx-cal-h">
      {collapsible
        ? <button type="button" className="cx-cal-fold" id="cx-pz-cal-btn" aria-expanded={!!open} aria-controls="cx-pz-cal-body" onClick={onToggle}>
          <span className="cx-caret" style={{ transform: open ? 'none' : 'rotate(-90deg)' }}><CxIcon n="chevD" s={14} /></span>
          <h3>Calendário dos termos</h3><span className="cx-cal-sub">{sub}</span>
        </button>
        : <div><h3>Calendário dos termos</h3><span className="cx-cal-sub">{sub}</span></div>}
      {showBody ? legend : null}
    </div>
    {showBody ? <div id="cx-pz-cal-body">
      {cal.total.cdas === 0 && !cal.overdue.points.length ? <p className="cx-cal-note">{emptyText || 'Nenhum termo ou piso com data.'}</p> : <div className="cx-cal-sc">
        <div className="cx-cal-grid" role="group" aria-label="Termos e pisos por faixa de tempo" style={{ gridTemplateColumns: '50px ' + overW + 'px repeat(' + cal.cols.length + ', minmax(0, 1fr))', minWidth: minW }}>
          <div className="cx-cal-lbg" style={{ gridRow: 2 }} /><div className="cx-cal-lbg" style={{ gridRow: 3 }} />
          <div className="cx-cal-ll" style={{ gridRow: 2 }}>Termos</div><div className="cx-cal-ll" style={{ gridRow: 3 }}>Pisos</div>
          <div className="cx-cal-hl">HOJE · {cxDM(localIso(new Date()))}</div>
          {cal.years.map((y, i) => <React.Fragment key={y.year}>
            <div className="cx-cal-yl" style={{ gridColumn: (3 + y.start) + ' / span ' + y.span, gridRow: 1 }}>{y.year}</div>
            {i > 0 ? <div className="cx-cal-ys" style={{ gridColumn: 3 + y.start, gridRow: '1 / 5' }} /> : null}
          </React.Fragment>)}
          <div className="cx-cal-hoje" style={{ gridColumn: 3, gridRow: '1 / 5' }} />
          {cells.has('over') ? cellBtn('over', 2, 2) : <span className="cx-cal-dot" style={{ gridColumn: 2, gridRow: 2 }} />}
          <span className="cx-cal-dot" style={{ gridColumn: 2, gridRow: 3 }} />
          {cal.cols.map((c, i) => ['term', 'piso'].map((lane, li) => {
            const k = lane + '|' + c.key;
            return cells.has(k) ? cellBtn(k, 3 + i, 2 + li) : <span key={k} className="cx-cal-dot" style={{ gridColumn: 3 + i, gridRow: 2 + li }} />;
          }))}
          {cal.gran === 'y' ? null : cal.cols.map((c, i) => <div key={'q' + c.key} className="cx-cal-ql" style={{ gridColumn: 3 + i, gridRow: 4 }}>{c.short}</div>)}
        </div>
      </div>}
    </div> : null}
    {nextEl}
    {showBody && !mesa ? <div className="cx-cal-f" aria-live="polite">{selCell ? <span className="cx-cal-fchip">Filtrando: <b>{selCell.short}</b><span className="n"> · {cxPl(selCell.cell.cdas, 'CDA', 'CDAs')}</span><button type="button" aria-label="Limpar filtro do calendário" onClick={clear}>×</button></span> : null}</div> : null}
    {showBody && cal.skipped ? <p className="cx-cal-note">{cxPl(cal.skipped, 'piso já passou e não aparece', 'pisos já passaram e não aparecem')} no calendário{mesa ? '' : '; segue nas linhas abaixo'}.</p> : null}
    {tip.node}
  </section>;
}
/* Relógios da prescrição (M4). Dois usos: página/aba solta (Prazos extintivos, Linha do tempo) e `embedded` dentro da aba
   Inscrições da operação — mesma tela, mesma conta; `debtIds` (Set) recorta às CDAs que passaram nos filtros da aba
   (busca e Pessoa) e `filtered` só ajusta o texto de "nada a mostrar". Sem `onOpenProc`, clicar numa linha com várias CDAs
   do mesmo processo abre a primeira CDA (na aba, a gaveta da CDA). */
function EditionClaudeClocks({ data, prazosRadar, prescLookup, opId, lead, onOpenCda, onOpenProc, debtIds, embedded, filtered }) {
  const todayIso = localIso(new Date());
  const res = React.useMemo(() => clkBuild({ data, rows: (prazosRadar && prazosRadar.rows) || [], silenced: (prazosRadar && prazosRadar.silenced) || [], lookup: prescLookup, today: todayIso, opId: opId || '', debtIds: debtIds || null }), [data, prazosRadar, prescLookup, opId, debtIds, todayIso]);
  const [sims, setSims] = React.useState({});
  const [simErr, setSimErr] = React.useState({});
  const [calSel, setCalSel] = React.useState(null);
  React.useEffect(() => { setSims({}); setSimErr({}); }, [opId, data]);
  React.useEffect(() => { setCalSel(null); }, [opId]);
  const clocks = React.useMemo(() => clkSort(res.clocks.map(c => (sims[c.id] ? clkApplySim(c, sims[c.id], todayIso) : c))), [res, sims, todayIso]);
  const kpis = React.useMemo(() => clkKpis(clocks, todayIso), [clocks, todayIso]);
  const strip = React.useMemo(() => clkStrip(clocks, todayIso), [clocks, todayIso]);
  const byId = React.useMemo(() => { const m = new Map(); clocks.forEach(c => m.set(c.id, c)); return m; }, [clocks]);
  const cal = React.useMemo(() => clkQuarterBins(strip.points, todayIso), [strip, todayIso]);
  /* Células não vazias do calendário, por chave ('over' | 'term|2030-Q3' | 'piso|2030-Q3'): rótulo, pontos e recorte. */
  const calCells = React.useMemo(() => clkCalCells(cal), [cal]);
  React.useEffect(() => { if (calSel && !calCells.has(calSel)) setCalSel(null); }, [calCells, calSel]);
  const selCell = calSel ? calCells.get(calSel) || null : null;
  const tip = useCxTip(React.useCallback((key) => {
    const c = byId.get(key.replace(/^clk\|/, '')); if (!c) return null;
    const d = c.kind === 'piso' ? c.floor : c.term;
    const g = CLK_GROUPS.find(x => x.key === c.group);
    const dd = d ? daysUntil(d) : null;
    return { when: (c.kind === 'piso' ? 'Piso · ' : 'Termo · ') + fmtDate(d) + (dd === null ? '' : ' · ' + (dd < 0 ? tlDurLabel(dd) : dd === 0 ? 'hoje' : 'em ' + tlDurLabel(dd))), title: 'CDA ' + c.leadNumber + (c.n > 1 ? ' +' + (c.n - 1) : ''), lines: [(embedded ? '' : cxOpName({ name: c.opName }) + ' · ') + cxMoneyShort(c.value), g ? g.label : '', 'Clique para abrir'].filter(Boolean), tone: c.group === 'crit' ? 'late' : '' };
  }, [byId, embedded]));
  const open = (c) => {
    if (c.n > 1 && c.executionId && onOpenProc) onOpenProc(c.executionId);
    else onOpenCda && onOpenCda({ id: c.leadId, operationId: c.operationId });
  };
  const toggleSim = (c) => {
    if (sims[c.id]) { setSims(prev => { const n = { ...prev }; delete n[c.id]; return n; }); return; }
    const out = clkSimulateFiling({ debt: c.debt, executions: data.executions || [], events: data.prescriptionEvents || [], today: todayIso });
    if (!out.ok) { setSimErr(prev => ({ ...prev, [c.id]: out.reason })); return; }
    setSimErr(prev => { const n = { ...prev }; delete n[c.id]; return n; });
    setSims(prev => ({ ...prev, [c.id]: out }));
  };
  /* ── calendário de termos (faixas por trimestre) ── */
  const calNext = React.useMemo(() => clkNextDates(strip.points, todayIso, 3), [strip, todayIso]);
  const calPick = (k) => setCalSel(prev => (prev === k ? null : k));
  const legend = <div className="cx-tl-legend cx-clk-leg">
    <span className="cx-tl-leg-h">Leitura</span>
    <span><i className="cx-lg-sw cx-clk-sw fill" />Tempo decorrido</span>
    <span><i className="cx-lg-sw cx-clk-sw rest" />Tempo restante</span>
    <span><i className="cx-lg-sw cx-tl-seg susp" />Suspensão de 1 ano (art. 40)</span>
    <span><i className="cx-lg-sw cx-tl-seg pausa" />Parcelamento ou pausa vigente</span>
    <span><i className="cx-lg-sw cx-clk-sw cyan" />Piso: só há risco depois de novo marco</span>
    <span><CxTlGlyph kind="presc" c="var(--cx-violet)" s={14} />termo<CxTlGlyph kind="presc" c="var(--cx-cyan)" hollow s={14} />piso</span>
  </div>;
  const shown = selCell ? clocks.filter(c => clkBucketMatch(c, selCell.bucket, todayIso)) : clocks;
  const groups = CLK_GROUPS.map(g => ({ g, rows: shown.filter(c => c.group === g.key) })).filter(x => x.rows.length);
  const mon = (v) => cxMoneyShort(v);
  const empty = !clocks.length;
  return <div className={'cx-clk' + (embedded ? ' emb' : '')} {...tip.bind}>
    {lead ? <div className="cx-tl-tools">{lead}</div> : null}
    {empty ? <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma CDA com relógio a mostrar{opId ? ' nesta operação' : ''}{filtered ? ' com os filtros da aba (busca e Pessoa)' : ''}.{res.consumadas ? ' ' + cxPl(res.consumadas, 'consumada está', 'consumadas estão') + ' em Consumadas.' : ''}</div></div> : <>
      <CxKpiStrip n={4} className="bare cx-ks-sp">
        <CxKpiCard label="Próximo termo" value={kpis.next ? (kpis.next.days === 0 ? 'hoje' : cxPl(kpis.next.days, 'dia', 'dias')) : '—'} tone={kpis.next && kpis.next.days <= 90 ? 'red' : ''}
          desc={<>{kpis.next ? 'CDA ' + String(kpis.next.cda).slice(-12) + (kpis.next.n > 1 ? ' +' + (kpis.next.n - 1) : '') + (embedded ? '' : ' · ' + cxOpName({ name: kpis.next.opName })) : 'nenhum termo à frente'}{kpis.overdue.cdas ? <b className="cx-red-t"> · {kpis.overdue.cdas} {kpis.overdue.cdas === 1 ? 'vencida' : 'vencidas'}</b> : null}</>} />
        <CxKpiCard label="Termo em até 1 ano" value={kpis.near.cdas ? mon(kpis.near.value) : '—'}
          desc={cxPl(kpis.near.cdas, 'CDA', 'CDAs') + ' com relógio em curso'} />
        <CxKpiCard label="Relógio parado" value={cxPl(kpis.parc.cdas, 'CDA', 'CDAs')} tone="green"
          desc={kpis.parc.cdas ? mon(kpis.parc.value) + ' · recomeça na rescisão' : 'nenhum parcelamento ou pausa'} />
        <CxKpiCard label="Sem relógio ativo · piso" value={kpis.piso.cdas ? mon(kpis.piso.value) : '—'} tone="cyan"
          desc={kpis.piso.cdas ? cxPl(kpis.piso.cdas, 'CDA', 'CDAs') + ' · piso mais próximo ' + fmtDate(kpis.piso.nearestFloor) : 'nenhum ciclo encerrado'} />
      </CxKpiStrip>
      <CxTermCalendar cal={cal} cells={calCells} sel={calSel} onPick={calPick} onClear={() => setCalSel(null)} next={calNext} variant="clocks" noun="os relógios"
        cellClass={x => 'g-' + x.cell.group}
        legend={<div className="cx-cal-leg" aria-hidden="true">
          <span><CxTlGlyph kind="presc" c="var(--cx-ink-2)" s={13} />termo</span>
          <span><CxTlGlyph kind="presc" c="var(--cx-ink-2)" hollow s={13} />piso</span>
          <span className="sep" />
          <span><i style={{ '--c': 'var(--cx-red)' }} />até 90 dias</span>
          <span><i style={{ '--c': 'var(--cx-orange)' }} />até 1 ano</span>
          <span><i style={{ '--c': 'var(--cx-yellow)' }} />mais de 1 ano</span>
          <span><i style={{ '--c': 'var(--cx-cyan)' }} />piso</span>
        </div>} />
      {groups.map(({ g, rows }) => <section key={g.key} aria-label={g.label}>
        <div className="cx-clk-g"><i style={{ background: cxClkTone(g.key) }} />{g.label}<span className="ln" /><span>{rows.length}</span></div>
        {rows.map(c => {
          const cd = cxClkCountdown(c);
          const tone = c.simulated ? 'var(--cx-cyan)' : cxClkTone(c.group);
          const cert = c.hasRow ? mesaCertainty(c.row) : '';
          const simDisabled = c.kind === 'orig' && c.termDays != null && c.termDays < 0;
          const canSim = c.kind === 'orig' || c.simulated;
          return <div key={c.id} className="cx-clk-row" style={{ '--c': tone }} role="button" tabIndex={0} onClick={() => open(c)} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) open(c); }}
            title={c.n > 1 ? c.cdaNumbers.join(' · ') : undefined}>
            <div className="cx-clk-id">
              <div className="n cx-mono">{c.leadNumber}{c.n > 1 ? <span className="more"> +{c.n - 1}</span> : null}</div>
              <div className="m">{embedded ? null : <span className="cx-op-tag"><CxOpSquare opId={c.operationId} /><span className="cx-ell">{cxOpName({ name: c.opName })}</span></span>}{c.tribute ? <span>{embedded ? '' : '· '}{c.tribute}</span> : null}<b>{mon(c.value)}</b>{embedded && c.personName ? <span className="cx-ell">· {c.personName}</span> : null}</div>
              <div className="m">{c.processNumber ? <CxProc num={c.processNumber} /> : <span className="cx-muted">sem processo</span>}
                {c.simulated ? <span className="cx-tag cyan">simulado</span> : null}
                {cert && !c.simulated ? <span className={'cx-cert ' + cert} title={CX_CERT_TIP[cert]}>{CX_CERT[cert]}</span> : null}</div>
            </div>
            <CxClkBar c={c} todayIso={todayIso} />
            <div className={'cx-clk-cd' + (cd.cls ? ' ' + cd.cls : '')}><div className={'big' + (cd.small ? ' sm' : '')}>{cd.big}</div><div className="sm">{cd.sm}</div></div>
            <div className="cx-clk-act">
              {canSim ? <button type="button" className="cx-btn sm" disabled={simDisabled} aria-pressed={!!c.simulated} title={simDisabled ? 'O termo já passou: ajuizar hoje não reinicia o prazo. Confira nos autos.' : c.simulated ? 'Voltar ao relógio real' : CX_CLK_SIM_TIP} onClick={e => { e.stopPropagation(); toggleSim(c); }}>{c.simulated ? 'Desfazer simulação' : 'E se eu ajuizar hoje?'}</button> : null}
              {simErr[c.id] ? <span className="small cx-red-t" role="status">{simErr[c.id]}</span> : null}
              <span className="small cx-muted">{c.simulated ? 'nada foi gravado' : c.kind === 'orig' ? 'ajuizar' : c.kind === 'parc' ? 'acompanhar rescisão' : c.kind === 'inter' ? 'monitorar' : c.kind === 'piso' ? 'aguardar novo marco' : 'completar o cadastro'}</span>
            </div>
          </div>;
        })}
      </section>)}
      {legend}
      <p className="cx-clk-foot">{res.tratadas ? cxPl(res.tratadas, 'CDA tratada fica', 'CDAs tratadas ficam') + ' fora do relógio. ' : ''}{res.consumadas ? cxPl(res.consumadas, 'prescrição consumada está', 'prescrições consumadas estão') + ' em Consumadas, para análise.' : ''} Termos e dias são os mesmos da Mesa de prazos; o piso é o que a calculadora garante até haver novo marco, não um prazo a cumprir.</p>
    </>}
    {tip.node}
  </div>;
}
function EditionClaudeTimelineClocks({ op, lead, data, prazosRadar, prescLookup, onOpenCda, onOpenProc }) {
  return <EditionClaudeClocks data={data} prazosRadar={prazosRadar} prescLookup={prescLookup} opId={op.id} lead={lead} onOpenCda={onOpenCda} onOpenProc={onOpenProc} />;
}

/* ═════════════════════ Narrativa da operação (M2) ═════════════════════
   "Me conte a história desta operação: o que foi decidido, o que eu já fiz, o que está atrasado e o que vem — na ordem
   em que importa." Vive na Linha do tempo (modo Narrativa, com o painel de leitura ao lado) e no Briefing (o card que
   era "Últimas atuações" — veja docs/MELHORIAS.md: um card só, com o passado e o futuro). Mesmos dados da régua
   (`cxBuildTimeline`) mais as atuações de `buildUltimasAtuacoes` (respostas a intimações, tarefas concluídas, atuações
   proativas) e as tarefas abertas; a classificação, os filtros e a frase-resumo são de src/lib/narrativa.js. */
const CX_NARR_KIND = { dec: 'Decisão', and: 'Fase', aud: 'Audiência', prazo: 'Prazo', presc: 'Prescrição', rev: 'Revisão', resposta: 'Resposta à intimação', proativa: 'Atuação proativa', tarefa: 'Tarefa', tarok: 'Tarefa concluída' };
const CX_NARR_ORDERS = [['foco', 'Próximo → antigo'], ['cron', 'Cronológica']];
function cxBuildNarrative(data, op, tl, todayIso) {
  const out = [];
  const execOfNum = (pn) => { const e = pn ? (tl.procs.map(r => r.x.e).find(x => sameProc(x.processNumber, pn))) : null; return e ? e.id : ''; };
  tl.items.forEach(it => {
    const base = { id: it.id, d: it.d || '', execId: it.execId || '', ref: it.ref, color: cxTlColor(it), glyph: it.kind, kindLabel: CX_NARR_KIND[it.kind] || '', title: it.l, text: '', badges: [] };
    if (it.k === 'stage' && (it.kind === 'dec' || it.kind === 'and')) {
      const pending = it.out === 'pendente';
      out.push({ ...base, cat: 'dec', big: it.kind === 'dec' && !pending, pending, out: it.out || '', text: it.t || '' });
    } else if (it.kind === 'presc' && it.k === 'cda') {
      const dbt = it.debt || {};
      out.push({ ...base, cat: 'presc', open: true, deadline: true, big: false, text: [dbt.tribute || dbt.system || '', cxMoneyShort(dbt.value), 'sem processo'].filter(Boolean).join(' · '), glyph: 'presc' });
    } else if (it.kind === 'presc') {
      const interrupts = it.pcat === 'interruptiva', suspends = it.pcat === 'suspensiva';
      out.push({ ...base, cat: 'presc', deadline: !!(it.mark && it.deadline), text: it.mark ? 'Prescrição pela CDA em pior situação do processo' : '', badges: interrupts ? [{ t: '⌛ interrompe a prescrição', c: 'var(--cx-violet)' }] : suspends ? [{ t: 'suspende a prescrição', c: 'var(--cx-blue)' }] : [] });
    } else if (it.kind === 'prazo') {
      const dd = daysUntil(it.d);
      const bd = [];
      if (intimIsUrgent(it.i)) bd.push({ t: 'URGENTE', c: 'var(--cx-red)' });
      if (dd !== null && dd < 0) bd.push({ t: 'vencido há ' + tlDurLabel(-dd).replace(/^há /, ''), c: 'var(--cx-red)' });
      else if (dd !== null && dd <= 7) bd.push({ t: dd === 0 ? 'vence hoje' : 'faltam ' + tlDurLabel(dd), c: cxTlColor(it) });
      else bd.push({ t: 'prazo de ' + cxDM(it.from) + ' a ' + cxDM(it.d), c: cxTlColor(it) });
      const teorP = intimationDecisionText(it.i);
      out.push({ ...base, cat: 'prazo', open: true, text: cxPartyName(it.i) + (teorP ? ' · Teor: ' + teorP : ''), badges: bd });
    } else if (it.kind === 'aud') {
      out.push({ ...base, cat: 'aud', tm: it.tm || '', done: !!it.realized, open: !it.realized, text: (it.hearing && it.hearing.parties) || '', badges: it.realized ? [{ t: 'realizada', c: 'var(--cx-ink-3)' }] : [] });
    } else if (it.kind === 'rev') {
      const late = daysUntil(it.d) < 0;
      out.push({ ...base, cat: 'prazo', open: true, title: late ? it.l + ' atrasada' : it.l, text: late ? 'Marque como revisada no cabeçalho da operação depois de conferir prazos e prescrição.' : '', badges: late ? [{ t: 'vencida há ' + tlDurLabel(-daysUntil(it.d)).replace(/^há /, ''), c: 'var(--cx-red)' }] : [], ref: null });
    }
  });
  /* Intimações com teor da decisão que não aparecem como prazo aberto: um item na data da intimação, com o teor como texto. */
  const comPrazo = new Set(tl.items.filter(it => it.kind === 'prazo' && it.i).map(it => it.i.id));
  (data.intimations || []).forEach(x => {
    if (x.operationId !== op.id || comPrazo.has(x.id)) return;
    const teor = intimationDecisionText(x); if (!teor) return;
    const d = toDayKey(x.dateStart) || toDayKey(x.dateSent) || toDayKey(x.responseAction && x.responseAction.respondedAt) || toDayKey(x.createdAt); if (!d) return;
    out.push({ id: 'it|' + x.id, cat: 'dec', glyph: 'and', kindLabel: 'Intimação', d, done: true, execId: execOfNum(x.processNumber), ref: { t: 'intim', id: x.id }, color: 'var(--cx-ink-2)', title: 'Intimação — ' + (x.eventDescription || x.className || 'sem descrição'), text: 'Teor: ' + teor, badges: [], procNum: x.processNumber || '' });
  });
  (data.tasks || []).forEach(k => {
    if (k.operationId !== op.id || !cxTaskOpen(k) || !k.dueDate) return;
    const d = toDayKey(k.dueDate); if (!d) return;
    out.push({ id: 'tk|' + k.id, cat: 'tar', glyph: 'tar', kindLabel: CX_NARR_KIND.tarefa, d, open: true, execId: execOfNum(k.processNumber), ref: { t: 'task', k }, color: 'var(--cx-blue)', title: k.title || k.description || 'Tarefa', text: k.description && k.title ? k.description : '', badges: k.priority === 'urgente' ? [{ t: 'URGENTE', c: 'var(--cx-red)' }] : [], procNum: k.processNumber || '' });
  });
  buildUltimasAtuacoes({ operationId: op.id, intimations: data.intimations, tasks: data.tasks, executions: data.executions }).forEach(r => {
    const task = r.kind === 'tarefa';
    out.push({ id: 'at|' + r.key, cat: 'mine', cats: task ? ['tar'] : undefined, mineKind: r.kind, glyph: task ? 'tarok' : 'act', kindLabel: r.kindLabel, d: r.date || '', done: true, execId: execOfNum(r.processNumber), color: 'var(--cx-green)', title: r.title, text: '', url: r.url, procNum: r.processNumber,
      ref: r.kind === 'resposta' ? { t: 'intim', id: r.intimationId } : task ? { t: 'taskId', id: r.taskId } : { t: 'pro', execId: r.executionId, actionId: r.actionId },
      badges: r.kind === 'resposta' ? [{ t: 'respondida', c: 'var(--cx-green)' }] : [] });
  });
  return out;
}
/* Frase-resumo escrita só com os próprios dados (sem IA, sem campo novo). */
function cxNarrSentence(sum) {
  const bits = [];
  if (sum.late.n) bits.push(<span key="l">Há <b className="cx-red-t">{cxPl(sum.late.n, 'prazo vencido', 'prazos vencidos')}</b>{sum.late.first ? ' (' + cxTlShortDesc(sum.late.first.title, 34) + ')' : ''} e <b>{cxPl(sum.soon.n, 'prazo', 'prazos')}</b> nos próximos 14 dias.</span>);
  else bits.push(<span key="l">Nenhum prazo vencido; <b>{cxPl(sum.soon.n, 'prazo', 'prazos')}</b> nos próximos 14 dias.</span>);
  if (sum.aud) bits.push(<span key="a">A próxima audiência é <b>{sum.aud.days === 0 ? 'hoje' : 'em ' + tlDurLabel(sum.aud.days)}</b> ({cxDM(sum.aud.d)}{sum.aud.tm ? ' ' + sum.aud.tm : ''}).</span>);
  if (sum.decision) bits.push(<span key="d">A última decisão foi <b>{cxTlShortDesc(sum.decision.title, 44)}</b>, em {fmtDate(sum.decision.d)}.</span>);
  if (sum.term) bits.push(<span key="t">O próximo termo de prescrição é em <b>{fmtDate(sum.term.d)}</b> ({sum.term.days === 0 ? 'hoje' : 'em ' + tlDurLabel(sum.term.days)}).</span>);
  else bits.push(<span key="t">Nenhum termo de prescrição à frente.</span>);
  return bits.reduce((a, b, i) => (i ? a.concat([' ', b]) : [b]), []);
}
function CxNarrItem({ it, todayIso, onOpen }) {
  const dd = it.d ? daysUntil(it.d) : null;
  const late = !!it.open && !it.done && dd !== null && dd < 0;
  const rel = dd === null ? 'sem data' : dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : dd === -1 ? 'ontem' : dd > 0 ? 'em ' + tlDurLabel(dd) : tlDurLabel(dd);
  const c = it.color || 'var(--cx-ink-2)';
  const clickable = !!it.ref;
  return <div className={'cx-nr-it' + (it.big ? ' big' : '') + (late ? ' late' : '') + (it.done ? ' done' : '') + (clickable ? ' click' : '')} style={{ '--c': c }}
    role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined} onClick={clickable ? () => onOpen(it) : undefined}
    onKeyDown={clickable ? (e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(it); } }) : undefined}>
    <span className="cx-nr-mk"><CxTlGlyph kind={it.glyph} c={c} s={18} /></span>
    <span className="cx-nr-t"><span className="cx-nr-k">{it.kindLabel}</span><span className="cx-nr-tt">{it.title}</span></span>
    <span className="cx-nr-w">{it.d ? <><b>{CX_DOW[cxDate(it.d).getDay()]} {cxDM(it.d)}{it.tm ? ' · ' + it.tm : ''}</b>{rel}</> : <><b>sem data</b></>}</span>
    {it.text ? <span className="cx-nr-s">{it.text}</span> : null}
    <span className="cx-nr-m">
      {it.badges.map((b, i) => <span key={i} className="cx-nr-b" style={{ '--c': b.c }}>{b.t}</span>)}
      {it.procLabel ? <><span className="cx-ptag" style={{ '--c': it.procColor }}>{it.procTag}</span><span className="cx-mono cx-small cx-muted">{it.procLabel}</span></> : it.procNum ? <span className="cx-mono cx-small cx-muted">{it.procNum}</span> : null}
      {it.url ? <CxDocIcon url={it.url} size={16} /> : null}
    </span>
  </div>;
}
function EditionClaudeNarrative({ tl, op, data, variant = 'page', lead, shell, onOpenIntim, onOpenHearing, onOpenCda, onOpenProc, onOpenTask, onOpenProativa, onOpenTimeline }) {
  const todayIso = localIso(new Date());
  const card = variant === 'card';
  const [cat, setCat] = React.useState('all');
  const [execId, setExecId] = React.useState('');
  const [order, setOrder] = React.useState('foco');
  const [pastShown, setPastShown] = React.useState(NARR_PAST_STEP);
  const [laterAll, setLaterAll] = React.useState(false);
  const entries = React.useMemo(() => {
    const execOf = new Map(tl.procs.map(r => [r.x.e.id, r.x.e]));
    return cxBuildNarrative(data, op, tl, todayIso).map(it => {
      const e = it.execId ? execOf.get(it.execId) : null;
      return e ? { ...it, procTag: cxExecTag(e), procColor: cxTagColor(e), procLabel: cxExecShortNum(e) } : it;
    });
  }, [data, op, tl, todayIso]);
  /* No Briefing o card só olha para frente (atrasado e a vir): o passado é do card "Atuações recentes"; a frase-resumo
     segue usando tudo. Na Linha do tempo a narrativa é inteira (passado e futuro). */
  const listed = React.useMemo(() => (card ? entries.filter(it => { const c = narrClassify(it, todayIso); return c === 'late' || c === 'future'; }) : entries), [entries, card, todayIso]);
  const counts = React.useMemo(() => narrCounts(listed, execId), [listed, execId]);
  const shown = React.useMemo(() => narrFilter(listed, { cat, execId }), [listed, cat, execId]);
  const sum = React.useMemo(() => narrSummary(entries, todayIso), [entries, todayIso]);
  const focus = React.useMemo(() => narrSectionsFocus(shown, todayIso), [shown, todayIso]);
  const pg = React.useMemo(() => narrPaginate(focus, { pastShown, laterCap: card ? 6 : Infinity, laterExpanded: laterAll }), [focus, pastShown, card, laterAll]);
  const chrono = React.useMemo(() => (order === 'cron' ? narrSectionsChrono(shown, todayIso) : null), [shown, todayIso, order]);
  const open = (it) => {
    const r = it.ref; if (!r) return;
    if (r.t === 'intim') onOpenIntim && onOpenIntim(r.id);
    else if (r.t === 'hearing') onOpenHearing && onOpenHearing(r.h);
    else if (r.t === 'cda') onOpenCda && onOpenCda({ id: r.id, operationId: r.operationId });
    else if (r.t === 'exec') onOpenProc && onOpenProc(r.id);
    else if (r.t === 'task') onOpenTask && onOpenTask(r.k);
    else if (r.t === 'taskId') { const t = (data.tasks || []).find(x => x.id === r.id); if (t && onOpenTask) onOpenTask(t); }
    else if (r.t === 'pro') onOpenProativa && onOpenProativa(r.execId, r.actionId);
  };
  const items = (list) => list.map(it => <CxNarrItem key={it.id} it={it} todayIso={todayIso} onOpen={open} />);
  const nowRow = <div className="cx-nr-now"><span className="pin"><svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" style={{ fill: 'var(--cx-on-solid)' }} /></svg></span><b>Hoje · {CX_DOW[cxDate(todayIso).getDay()]} {fmtDate(todayIso)}</b><span className="ln" /><span className="cx-small cx-muted">acima: o que vem · abaixo: o que já houve</span></div>;
  const group = (s) => <React.Fragment key={s.key}>
    <div className={'cx-nr-g' + (s.tone === 'late' ? ' late' : '')}>{s.label}{s.sub ? <span className="sub"> · {s.sub}</span> : null}<span className="cnt">{s.total || s.items.length}</span></div>
    {items(s.items)}
  </React.Fragment>;
  let body;
  if (!shown.length) body = <div className="cx-empty-row" style={{ borderTop: 0 }}>{listed.length ? 'Nada com esses filtros.' : card ? 'Nada à frente: nenhum prazo, audiência, tarefa ou termo de prescrição à vista.' : 'Esta operação ainda não tem fatos para contar.'}</div>;
  else if (card) {
    body = <>
      {pg.sections.map(group)}
      {pg.hiddenLater > 0 ? <div className="cx-nr-more"><button type="button" className="cx-link-btn" onClick={() => setLaterAll(true)}>Mostrar mais {pg.hiddenLater} adiante</button></div> : null}
    </>;
  } else if (order === 'cron' && chrono) {
    body = chrono.sections.map((s, si) => <React.Fragment key={s.key}>
      <div className="cx-nr-g">{s.label}<span className="cnt">{s.items.length}</span></div>
      {s.items.map((it, ii) => <React.Fragment key={it.id}>{chrono.nowAt && chrono.nowAt.section === si && chrono.nowAt.index === ii ? nowRow : null}<CxNarrItem it={it} todayIso={todayIso} onOpen={open} /></React.Fragment>)}
    </React.Fragment>);
    if (!chrono.nowAt) body.push(<React.Fragment key="now-end">{nowRow}</React.Fragment>);
  } else {
    body = <>
      {pg.sections.slice(0, pg.now).map(group)}
      {nowRow}
      {pg.sections.slice(pg.now).map(group)}
      {pg.hiddenLater > 0 ? <div className="cx-nr-more"><button type="button" className="cx-link-btn" onClick={() => setLaterAll(true)}>Mostrar mais {pg.hiddenLater} adiante</button></div> : null}
      {pg.hiddenPast > 0 ? <div className="cx-nr-more"><button type="button" className="cx-link-btn" onClick={() => setPastShown(n => n + NARR_PAST_STEP)}>Mostrar mais {Math.min(NARR_PAST_STEP, pg.hiddenPast)}</button><span className="cx-muted cx-small">{pg.hiddenPast} {pg.hiddenPast === 1 ? 'anterior' : 'anteriores'} ainda fora da lista</span></div> : null}
    </>;
  }
  const chips = <div className="cx-nr-chips">
    {NARR_CATS.filter(([k]) => !(card && k === 'mine')).map(([k, l]) => <button key={k} type="button" className={'cx-fchip sm' + (cat === k ? ' on' : '') + (counts[k] === 0 && k !== 'all' ? ' zero' : '')} aria-pressed={cat === k} onClick={() => { setCat(k); setPastShown(NARR_PAST_STEP); }}>{l}<span className="cx-fcn">{counts[k]}</span></button>)}
    <span className="cx-sp" />
    <CxSelect id={card ? 'cx-nr-proc-card' : 'cx-nr-proc'} pre="Processo" value={execId} onChange={v => { setExecId(v); setPastShown(NARR_PAST_STEP); }} options={[['', 'Todos']].concat(tl.procs.map(r => [r.x.e.id, cxExecTag(r.x.e) + ' ' + cxExecShortNum(r.x.e)]))} />
  </div>;
  if (card) {
    // Dentro do cartão "O que vem" (Visão geral): `shell` monta o cartão, o seletor de visão e o link da Linha do tempo.
    return shell({ cls: 'cx-bf-nr', count: listed.length, summary: cxNarrSentence(sum), children:
      <div className="cx-nr-body">
        <p className="cx-nr-sent">{cxNarrSentence(sum)}</p>
        {chips}
        <div className="cx-nr-sc compact"><div className="cx-nr-story">{body}</div></div>
      </div> });
  }
  const pendRec = sum.pendingRec;
  return <div>
    <div className="cx-tl-tools">
      {lead}
      <span className="cx-sp" />
      <span className="cx-tl-leg-h">Ordem</span>
      <CxSeg className="lg" label="Ordem da narrativa" value={order} onChange={setOrder} options={CX_NARR_ORDERS} />
    </div>
    <div className="cx-nr-grid">
      <div className="cx-nr-main">
        {chips}
        <div className="cx-nr-sc"><div className="cx-nr-story">{body}</div></div>
      </div>
      <aside className="cx-nr-side">
        <div className="cx-card cx-nr-sc-card"><h5>Em uma frase</h5><p>{cxNarrSentence(sum)}</p></div>
        <div className="cx-card cx-nr-sc-card"><h5>Panorama</h5><div className="cx-nr-kv">
          <div><b className={sum.late.n ? 'red' : ''}>{sum.late.n}</b><span>{sum.late.n === 1 ? 'prazo vencido' : 'prazos vencidos'}</span></div>
          <div><b>{sum.soon.n}</b><span>prazos em 14 dias</span></div>
          <div><b>{sum.audN}</b><span>{sum.audN === 1 ? 'audiência à frente' : 'audiências à frente'}</span></div>
          <div><b className={pendRec ? 'yel' : ''}>{pendRec}</b><span>{pendRec === 1 ? 'recurso pendente' : 'recursos pendentes'}</span></div>
        </div></div>
        <div className="cx-card cx-nr-sc-card"><h5>O que eu já fiz (30 dias)</h5>
          {sum.done30.total ? <p className="cx-small"><b>{sum.done30.resp}</b> {sum.done30.resp === 1 ? 'intimação respondida' : 'intimações respondidas'} · <b>{sum.done30.pro}</b> {sum.done30.pro === 1 ? 'atuação proativa' : 'atuações proativas'} · <b>{sum.done30.tar}</b> {sum.done30.tar === 1 ? 'tarefa concluída' : 'tarefas concluídas'}. Último movimento seu: <b>{fmtDate(sum.done30.last.d)}</b>, {sum.done30.last.days === 0 ? 'hoje' : tlDurLabel(-sum.done30.last.days)}.</p> : <p className="cx-small cx-muted">Nenhuma atuação sua registrada nos últimos 30 dias.</p>}</div>
        <div className="cx-card cx-nr-sc-card"><h5>Como ler</h5><p className="cx-small cx-muted">Cartões com <b>borda grossa</b> são decisões e desfechos; vermelho é vencido. O divisor <b>Hoje</b> separa o que vem (do mais próximo ao mais distante) do que já houve (do mais recente). Tarefas sem data limite não entram.</p></div>
      </aside>
    </div>
  </div>;
}
function EditionClaudeTimelineNarrative({ tl, op, lead, data, onOpenIntim, onOpenHearing, onOpenCda, onOpenProc, onOpenTask, onOpenProativa }) {
  return <EditionClaudeNarrative tl={tl} op={op} data={data} lead={lead} variant="page" onOpenIntim={onOpenIntim} onOpenHearing={onOpenHearing} onOpenCda={onOpenCda} onOpenProc={onOpenProc} onOpenTask={onOpenTask} onOpenProativa={onOpenProativa} />;
}
/* Cartão "O que vem" da Visão geral: UM cartão, três visões escolhidas num seletor no cabeçalho — "Horizonte" (os próximos
   90 dias, em colunas de urgência), "Narrativa" (o que vem, em texto, por prazo) e "Mapa de frentes" (M3). A escolha fica
   lembrada neste navegador; sem frentes para mapear (nenhum IDPJ/MCF nem processos vinculados), o mapa fica desabilitado.
   Um só link para a Linha do tempo, que abre no modo da visão (Horizonte → Panorama). `shell` (função) monta o cartão e é
   chamada por cada visão com o que é dela: contagem, resumo (recolhido), extras de cabeçalho e o corpo. */
const CX_OQ_VIEW = 'nexus_cx_oq_view';
function cxOqLoadView() { const v = cxLs(CX_OQ_VIEW, 'horizonte'); return v === 'narrativa' || v === 'mapa' ? v : 'horizonte'; }
function CxOqVem({ op, data, prazosRadar, prescLookup, hz, nr, onOpenTimeline, bare }) {
  const tl = React.useMemo(() => cxBuildTimeline(data, op, prescLookup), [data, op, prescLookup]);
  const [saved, setSaved] = React.useState(cxOqLoadView);
  const canMap = React.useMemo(() => frentesHasFronts({ lanes: tl.procs.map(r => ({ incident: r.x.e.processTag === 'idpj' || r.x.e.processTag === 'cautelar_fiscal' })), links: tl.links }), [tl]);
  const view = saved === 'mapa' && !canMap ? 'horizonte' : saved;
  const pick = (v) => { setSaved(v); cxLsSet(CX_OQ_VIEW, v); };
  const sw = <CxSeg className="cx-oq-sw" label="O que mostrar neste cartão" value={view} onChange={pick}
    options={[['horizonte', 'Horizonte'], ['narrativa', 'Narrativa'], ['mapa', 'Mapa de frentes', null, null, canMap ? null : { disabled: true, title: CX_FR_NOHINT }]]} />;
  const tlMode = view === 'mapa' ? 'frentes' : view === 'narrativa' ? 'narrativa' : 'panorama';
  const shell = ({ cls, count, sub, summary, extras, children }) => <CxFoldOrBare bare={bare} id="hz" scope="visao" as="h2" className={'cx-oq ' + (cls || '')} title="O que vem" ariaLabel="O que vem" count={count} sub={sub} summary={summary}
    actions={<>
      {sw}{extras || null}
      {onOpenTimeline ? <button type="button" className="cx-link-btn" onClick={() => onOpenTimeline(tlMode)}>Abrir na Linha do tempo<CxIcon n="chevR" s={13} /></button> : null}
    </>}>{children}</CxFoldOrBare>;
  if (view === 'mapa') return <EditionClaudeFrentes key={op.id + '|mapa'} tl={tl} op={op} variant="card" shell={shell} onOpenIntim={nr.onOpenIntim} onOpenHearing={nr.onOpenHearing} onOpenCda={nr.onOpenCda} onOpenProc={nr.onOpenProc} />;
  if (view === 'narrativa') return <EditionClaudeNarrative key={op.id} tl={tl} op={op} data={data} variant="card" shell={shell} onOpenIntim={nr.onOpenIntim} onOpenHearing={nr.onOpenHearing} onOpenCda={nr.onOpenCda} onOpenProc={nr.onOpenProc} onOpenTask={nr.onOpenTask} onOpenProativa={nr.onOpenProativa} />;
  return <EditionClaudeHorizon data={data} opIds={[op.id]} prazosRadar={prazosRadar} shell={shell} onOpenIntim={hz.onOpenIntim} onOpenHearing={hz.onOpenHearing} onOpenTask={hz.onOpenTask} onOpenCda={hz.onOpenCda} />;
}

/* ═════════════════════ Mapa de frentes e dependências (M3, estilo metrô) ═════════════════════
   "O que depende de quê? Quando o IDPJ decidir, o que destrava nas execuções — e qual é o caminho crítico?" Uma raia por
   processo (IDPJ, MCF, EF principal, EF apensa, exceção, agravo…) e uma para as CDAs sem processo; eixo ORDINAL (cada coluna
   é um acontecimento, a data vai no rótulo); setas de efeito (verde), de condição (violeta tracejada), de origem (cinza) e
   de cobertura; estações vazadas = derivadas do vínculo; tracejadas = esperadas, sem data. Passar o mouse numa estação
   realça o que a originou e o que ela destrava. Tudo sai dos dados que o app já tem (`cxBuildTimeline` + vínculos
   `parentExecutionId`/`linkedExecutionIds` + registros de fase); grafo, colunas, setas, cadeia e caminho crítico são puros
   (src/lib/frentes.js). Vive na Linha do tempo (modo Frentes) e no Briefing (card Narrativa, no seletor "Narrativa | Mapa de
   frentes"). */
function cxFrParentLabel(e) {
  if (/agravo/i.test(e.className || '')) return 'agravo';
  const t = cxExecTag(e);
  return t === 'EXC' ? 'exceção' : t === 'REC' ? 'recurso' : t === 'EMB' ? 'embargos' : t === 'EF' || t === 'CENTRAL' ? 'apenso' : 'vínculo';
}
/* Adapta a régua (`cxBuildTimeline`) às entradas do grafo puro. */
function cxBuildFrentesGraph(tl, op, todayIso) {
  const lanes = [], events = [], links = [];
  let orphans = 0;
  const execLabel = (e) => cxExecTag(e) + ' ' + cxExecShortNum(e);
  tl.procs.forEach(r => {
    const x = r.x, e = x.e;
    const coveredBy = tl.links.filter(l => l.type === 'cover' && l.b === e.id).map(l => tl.execById.get(l.a)).filter(Boolean);
    const covers = tl.links.filter(l => l.type === 'cover' && l.a === e.id).length;
    lanes.push({
      id: e.id, kind: 'proc', execId: e.id, tag: cxExecTag(e), color: cxTagColor(e), title: x.role, num: cxExecShortNum(e), name: execLabel(e), who: x.who,
      sub: [x.rel, coveredBy.length ? 'coberta por ' + coveredBy.map(execLabel).join(', ') : '', covers ? 'cobre ' + cxPl(covers, 'execução', 'execuções') : '', x.cdaN ? cxPl(x.cdaN, 'CDA', 'CDAs') + ' · ' + cxMoneyShort(x.cdaVal) : ''].filter(Boolean),
      incident: e.processTag === 'idpj' ? 'idpj' : e.processTag === 'cautelar_fiscal' ? 'mcf' : '',
      closed: e.status === 'extinta' || e.status === 'arquivada',
    });
  });
  if (tl.cdas.length) lanes.push({ id: 'cda', kind: 'cda', tag: 'CDA', color: 'var(--cx-violet)', title: 'CDAs sem processo', num: '', name: 'CDAs sem processo', sub: [cxPl(tl.cdas.length, 'a ajuizar', 'a ajuizar')] });
  tl.links.forEach(l => links.push({ type: l.type, a: l.a, b: l.b, label: l.type === 'parent' ? cxFrParentLabel(tl.execById.get(l.b)) : 'cobre' }));
  const hasAjuiz = new Set();
  tl.items.forEach(it => {
    if (!it.d || it.kind === 'rev') return;
    if (it.kind === 'presc' && it.mark && !it.deadline) return;
    const lane = it.k === 'cda' ? 'cda' : it.execId;
    if (!lane) { if (it.kind === 'aud') orphans++; return; }
    if (it.sk === 'ajuizamento' || it.sk === 'ajuizamento_ef') hasAjuiz.add(lane);
    const label = it.k === 'cda' ? 'Ajuizar CDA …' + String((it.debt && it.debt.cdaNumber) || 'S/N').slice(-9) : it.kind === 'aud' ? String(it.l).replace(/ · .*$/, '') : it.kind === 'prazo' ? cxTlShortDesc(it.l, 44) : it.l;
    events.push({
      id: it.id, lane, d: it.d, tm: it.tm || '', kind: it.kind, label, color: cxTlColor(it), sk: it.sk || '', out: it.out || '',
      open: it.kind === 'prazo' || (it.kind === 'aud' && !it.realized) || it.k === 'cda', late: it.kind === 'prazo' && daysUntil(it.d) < 0, ref: it.ref, item: it,
    });
  });
  tl.procs.forEach(r => {
    const e = r.x.e, d = toDayKey(e.protocolDate);
    if (!d || hasAjuiz.has(e.id)) return;
    events.push({ id: 'dist|' + e.id, lane: e.id, d, tm: '', kind: 'and', label: 'Distribuição', color: 'var(--cx-ink-2)', open: false, late: false, ref: { t: 'exec', id: e.id } });
  });
  const g = buildFrentesGraph({ lanes, events, links, todayIso: todayIso || localIso(new Date()) });
  g.orphans = orphans;
  return g;
}
const CX_FR = { LW: 196, PADL: 24, COLW: 62, LH: 108, TOP: 50 };
const CX_FR_NOHINT = 'Esta operação não tem frentes para mapear: nenhum IDPJ, MCF nem processos vinculados (apenso, exceção, recurso).';
/* Quebra o rótulo em até 2 linhas que caibam em `maxW` px (reticências no que sobra). */
function cxFrWrap(text, maxW) {
  const rest = String(text || '').split(/\s+/).filter(Boolean);
  const fit = (t) => cxTlMeasure(t, 11) <= maxW;
  const clip = (t) => { let s = t; while (s.length > 1 && !fit(s + '…')) s = s.slice(0, -1); return s + '…'; };
  const lines = [];
  while (rest.length && lines.length < 2) {
    let cur = '';
    while (rest.length && fit(cur ? cur + ' ' + rest[0] : rest[0])) cur = cur ? cur + ' ' + rest.shift() : rest.shift();
    if (!cur) cur = rest.shift(); // palavra maior que a linha
    lines.push(cur);
  }
  const k = lines.length - 1;
  if (rest.length) lines[k] = clip(lines[k] + ' ' + rest.join(' '));
  else if (k >= 0 && !fit(lines[k])) lines[k] = clip(lines[k]);
  return lines;
}
const CX_FR_EDGE = { eff: { c: 'var(--cx-green)', mk: 'cx-fr-ar-eff' }, cond: { c: 'var(--cx-violet)', mk: 'cx-fr-ar-cond', dash: '5 4' }, flow: { c: 'var(--cx-ink-3)', mk: 'cx-fr-ar-flow' }, cover: { c: 'var(--cx-ink-3)', mk: 'cx-fr-ar-flow', dash: '2 4' } };
function CxFrMap({ graph, tl, crit, onlyCrit, onOpen }) {
  const { LW, PADL, COLW, LH, TOP } = CX_FR;
  const [hl, setHl] = React.useState('');
  const wrapRef = React.useRef(null);
  const ncols = graph.cols.length;
  const W = PADL + ncols * COLW + 56;
  const H = TOP + graph.lanes.length * LH + 6;
  const laneIdx = React.useMemo(() => new Map(graph.lanes.map((l, i) => [l.id, i])), [graph]);
  const pos = (n) => ({ x: PADL + n.col * COLW + COLW / 2, y: TOP + laneIdx.get(n.lane) * LH + LH / 2 });
  const todayX = PADL + graph.todayCol * COLW;
  const labels = React.useMemo(() => frentesColumnLabels(graph), [graph]);
  const chain = React.useMemo(() => (hl ? frentesChain(graph, hl) : null), [graph, hl]);
  const lit = chain || (onlyCrit && crit.ids.length ? crit.set : null);
  const [, setFontTick] = React.useState(0);
  React.useEffect(() => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setFontTick(n => n + 1)); }, []);
  // Abre com o "hoje" visível (um pouco de passado à esquerda).
  React.useLayoutEffect(() => { const el = wrapRef.current; if (el) el.scrollLeft = Math.max(0, todayX - el.clientWidth * 0.4); }, [graph]);
  const tip = useCxTip(React.useCallback((key) => {
    if (key.indexOf('lane|') === 0) { const l = graph.lanes.find(x => x.id === key.slice(5)); return l ? { when: l.kind === 'cda' ? 'CDAs sem processo' : l.title, title: l.name, lines: [l.who ? 'Devedor: ' + l.who : '', l.sub.join(' · '), l.kind === 'cda' ? '' : 'Clique para abrir o processo'].filter(Boolean) } : null; }
    if (key.indexOf('ed|') === 0) {
      const e = graph.edges.find(x => x.id === key); if (!e) return null;
      const A = graph.byId.get(e.a), B = graph.byId.get(e.b);
      const ln = (n) => (n.label || '') + ' (' + ((graph.lanes.find(l => l.id === n.lane) || {}).name || '') + ')';
      return { when: FRENTES_EDGE_LABEL[e.type] || '', title: ln(A) + ' → ' + ln(B), lines: e.type === 'cond' ? ['Só vale se a decisão esperada for favorável'] : [] };
    }
    const n = graph.byId.get(key); if (!n) return null;
    const laneName = (graph.lanes.find(l => l.id === n.lane) || {}).name || '';
    if (n.item) { const d = cxTlTipData(n.item, tl.execById); if (n.open && !n.ghost && !n.late && n.d > graph.today) d.lines.push('Em aberto: está no caminho de quem depende dele'); return d; }
    if (n.ghost) return { when: 'Esperado · sem data', title: n.label, lines: [n.note, laneName, 'Clique para abrir o processo'].filter(Boolean) };
    if (n.derived) return { when: 'Derivado · ' + fmtDate(n.d), title: n.label, lines: [n.note, 'Clique para abrir o processo'] };
    return { when: CX_DOW[cxDate(n.d).getDay()] + ' ' + fmtDate(n.d), title: n.label, lines: [laneName, 'Clique para abrir o processo'] };
  }, [graph, tl]));
  const openNode = (n) => { const r = n && n.ref; if (r) onOpen(r); };
  const nodeOf = (ev) => { const t = ev.target && ev.target.closest ? ev.target.closest('[data-st]') : null; return t ? t.getAttribute('data-st') : ''; };
  const dim = (id) => !!lit && !lit.has(id);
  const o = [];
  /* faixa do futuro e grade das colunas */
  o.push(<rect key="fut" x={todayX} y={TOP - 8} width={Math.max(0, W - todayX)} height={H - TOP + 8} style={{ fill: 'var(--cx-surface-2)' }} />);
  labels.forEach((lb, i) => {
    const x = PADL + i * COLW + COLW / 2;
    o.push(<g key={'c' + i}>
      {lb.top ? <text x={x} y={16} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: 'var(--cx-ink-2)' }}>{lb.top}</text> : null}
      <text x={x} y={31} textAnchor="middle" style={{ fontSize: 10, fontFamily: 'var(--cx-mono)', fill: 'var(--cx-ink-3)' }}>{lb.bottom || 'a definir'}</text>
      <line x1={x} x2={x} y1={TOP - 8} y2={H} style={{ stroke: 'var(--cx-line)', strokeDasharray: '1 4', opacity: 0.7 }} />
    </g>);
  });
  o.push(<line key="axis" x1={0} x2={W} y1={TOP - 8} y2={TOP - 8} style={{ stroke: 'var(--cx-line)' }} />);
  /* raias (faixas) */
  graph.lanes.forEach((l, i) => {
    const y = TOP + i * LH;
    o.push(<g key={'l' + l.id}><rect x={0} y={y} width={W} height={LH} style={{ fill: i % 2 ? 'transparent' : 'var(--cx-surface-2)', opacity: 0.5 }} /><line x1={0} x2={W} y1={y + LH} y2={y + LH} style={{ stroke: 'var(--cx-line)' }} />
      {!l.nodes.length ? <text x={PADL + 8} y={y + LH / 2 + 4} style={{ fontSize: 11, fill: 'var(--cx-ink-3)', fontStyle: 'italic' }}>sem fatos datados</text> : null}</g>);
  });
  /* arestas: primeiro a sequência das raias, depois as setas entre raias */
  const laneCol = (id) => { const l = graph.lanes.find(x => x.id === id); return l ? l.color : 'var(--cx-ink-3)'; };
  graph.edges.filter(e => e.type === 'lane').forEach(e => {
    const A = graph.byId.get(e.a), B = graph.byId.get(e.b), a = pos(A), b = pos(B);
    o.push(<line key={e.id} className={lit && !(lit.has(e.a) && lit.has(e.b)) ? 'cx-fr-dim' : ''} x1={a.x} x2={b.x} y1={a.y} y2={b.y} style={{ stroke: laneCol(A.lane), strokeWidth: 3, strokeOpacity: e.ghost ? 0.3 : 0.55, strokeDasharray: e.ghost ? '3 5' : undefined, strokeLinecap: 'round' }} />);
  });
  graph.edges.filter(e => e.type !== 'lane').forEach(e => {
    const A = graph.byId.get(e.a), B = graph.byId.get(e.b), a = pos(A), b = pos(B), st = CX_FR_EDGE[e.type] || CX_FR_EDGE.flow;
    const down = b.y > a.y, sy = a.y + (down ? 9 : -9), ty = b.y + (down ? -9 : 9);
    let d, mx, my;
    if (Math.abs(a.x - b.x) < 3) { const jx = e.label ? 0 : 6; d = 'M' + (a.x + 5 + jx) + ' ' + sy + ' L' + (b.x + 5 + jx) + ' ' + ty; mx = a.x + 5 + jx; my = (sy + ty) / 2; }
    else { const k = down ? 30 : -30; d = 'M' + a.x + ' ' + sy + ' C' + a.x + ' ' + (sy + k) + ', ' + b.x + ' ' + (ty - k) + ', ' + b.x + ' ' + ty; mx = (a.x + b.x) / 2; my = (sy + ty) / 2; }
    const faded = lit && !(lit.has(e.a) && lit.has(e.b));
    o.push(<g key={e.id} className={faded ? 'cx-fr-dim' : ''} data-tl={e.id}>
      <path d={d} fill="none" style={{ stroke: st.c, strokeWidth: 2, strokeDasharray: st.dash }} markerEnd={'url(#' + st.mk + ')'} />
      <path d={d} fill="none" style={{ stroke: 'transparent', strokeWidth: 12 }} />
      {e.label ? <g><rect x={mx + 7} y={my - 8} width={cxTlMeasure(e.label, 10.5) + 10} height={16} rx={4} style={{ fill: 'var(--cx-surface)', stroke: 'var(--cx-line)' }} /><text x={mx + 12} y={my + 3.5} style={{ fontSize: 10.5, fill: st.c, fontWeight: 500 }}>{e.label}</text></g> : null}
    </g>);
  });
  /* estações */
  graph.lanes.forEach((l, li) => {
    l.nodes.forEach((id, idx) => {
      const n = graph.byId.get(id), p = pos(n);
      const above = idx % 2 === 0;
      const lines = cxFrWrap(n.label, COLW * 2 - 12);
      const dtxt = n.ghost ? 'a definir' : cxDM(n.d) + (n.tm ? ' ' + n.tm : '');
      const ty = above ? p.y - 22 - lines.length * 12 : p.y + 25;
      const col = n.ghost ? 'var(--cx-ink-3)' : n.color || 'var(--cx-ink-2)';
      const onCrit = crit.set.has(id);
      o.push(<g key={'s' + id} className={'cx-fr-st' + (dim(id) ? ' cx-fr-dim' : '') + (n.ghost ? ' ghost' : '')} data-st={id} data-tl={id} tabIndex={0} role="button" aria-label={n.label + (n.ghost ? ', esperado, sem data' : ', ' + fmtDate(n.d))}>
        <circle cx={p.x} cy={p.y} r={15} style={{ fill: hl === id || (onCrit && lit === crit.set) ? 'var(--cx-accent-soft)' : 'transparent' }} />
        <g transform={'translate(' + (p.x - 9) + ' ' + (p.y - 9) + ')'}>{n.derived
          ? <svg className="cx-tl-gl" width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" style={{ fill: 'var(--cx-surface)', stroke: 'var(--cx-green)', strokeWidth: 1.8 }} /><circle cx="8" cy="8" r="1.8" style={{ fill: 'var(--cx-green)' }} /></svg>
          : <CxTlGlyph kind={n.kind} c={col} ghost={n.ghost} s={18} />}</g>
        <text x={p.x} y={ty} textAnchor="middle" className="cx-fr-t" style={{ fontSize: 9.5, fontFamily: 'var(--cx-mono)', fill: n.late ? 'var(--cx-red)' : 'var(--cx-ink-3)' }}>{dtxt}</text>
        {lines.map((t, i) => <text key={i} x={p.x} y={ty + 12 + i * 12} textAnchor="middle" className="cx-fr-t" style={{ fontSize: 11, fill: n.late ? 'var(--cx-red)' : n.ghost ? 'var(--cx-ink-3)' : 'var(--cx-ink)', fontWeight: n.kind === 'dec' && !n.ghost ? 600 : 500, fontStyle: n.ghost ? 'italic' : undefined }}>{t}</text>)}
      </g>);
    });
  });
  /* hoje */
  o.push(<g key="hoje"><line x1={todayX} x2={todayX} y1={TOP - 8} y2={H} style={{ stroke: 'var(--cx-accent)', strokeWidth: 1.6 }} /><rect x={todayX - 22} y={H - 17} width={44} height={15} rx={4} style={{ fill: 'var(--cx-accent)' }} /><text x={todayX} y={H - 6} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: 'var(--cx-on-solid)', fontFamily: 'var(--cx-mono)' }}>HOJE</text></g>);
  const mark = (id, c) => <marker key={id} id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" style={{ fill: c }} /></marker>;
  const hoverBind = {
    onMouseOver: (ev) => { const k = nodeOf(ev); if (k !== hl) setHl(k); },
    onMouseMove: tip.bind.onMouseMove,
    onMouseLeave: () => { setHl(''); tip.bind.onMouseLeave(); },
    onFocus: (ev) => { const k = nodeOf(ev); if (k) setHl(k); tip.bind.onFocus(ev); },
    onBlur: (ev) => { setHl(''); tip.bind.onBlur(ev); },
    onClick: (ev) => { const k = nodeOf(ev); if (k) { openNode(graph.byId.get(k)); return; } const lane = ev.target.closest && ev.target.closest('[data-lane]'); if (lane) { const l = graph.lanes.find(x => x.id === lane.getAttribute('data-lane')); if (l && l.execId) onOpen({ t: 'exec', id: l.execId }); } },
    onKeyDown: (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.getAttribute && ev.target.getAttribute('data-st')) { ev.preventDefault(); openNode(graph.byId.get(ev.target.getAttribute('data-st'))); } },
  };
  return <div className="cx-fr-wrap" ref={wrapRef} {...hoverBind}>
    <div className="cx-fr-in" style={{ width: LW + W, height: H }}>
      <div className="cx-fr-lanes" style={{ width: LW, height: H }}>
        <div className="cx-fr-lh">Frentes <span>{graph.lanes.filter(l => l.kind === 'proc').length}</span></div>
        {graph.lanes.map((l, i) => <div key={l.id} className={'cx-fr-ln' + (l.closed ? ' off' : '') + (l.execId ? ' click' : '')} style={{ top: TOP + i * LH, height: LH }} data-lane={l.id} data-tl={'lane|' + l.id} role={l.execId ? 'button' : undefined} tabIndex={l.execId ? 0 : undefined}
          onKeyDown={l.execId ? (ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen({ t: 'exec', id: l.execId }); } }) : undefined}>
          <span className="cx-ptag" style={{ '--c': l.color }}>{l.tag}</span>
          <b>{l.title}</b>
          {l.num ? <span className="cx-mono cx-fr-num">{l.num}</span> : null}
          {l.sub.slice(0, 2).map((t, k) => <span key={k} className="cx-fr-sub">{t}</span>)}
        </div>)}
      </div>
      <svg className="cx-fr-svg" width={W} height={H} viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label="Mapa de frentes e dependências">
        <defs>{mark('cx-fr-ar-eff', 'var(--cx-green)')}{mark('cx-fr-ar-cond', 'var(--cx-violet)')}{mark('cx-fr-ar-flow', 'var(--cx-ink-3)')}</defs>
        {o}
      </svg>
    </div>
    {tip.node}
  </div>;
}
function cxFrLegend() {
  const ar = (c, dash) => <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true"><path d="M1 5H25" style={{ stroke: c, strokeWidth: 2, strokeDasharray: dash }} /><path d="M24 1.5L29 5L24 8.5z" style={{ fill: c }} /></svg>;
  return <div className="cx-tl-legend top">
    <span><CxTlGlyph kind="dec" c="var(--cx-blue)" /> decisão</span><span><CxTlGlyph kind="and" /> andamento</span><span><CxTlGlyph kind="aud" c="var(--cx-orange)" /> audiência</span><span><CxTlGlyph kind="prazo" c="var(--cx-yellow)" /> prazo</span><span><CxTlGlyph kind="presc" c="var(--cx-violet)" /> prescrição</span>
    <span><svg className="cx-tl-gl" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" style={{ fill: 'var(--cx-surface)', stroke: 'var(--cx-green)', strokeWidth: 1.8 }} /><circle cx="8" cy="8" r="1.8" style={{ fill: 'var(--cx-green)' }} /></svg> derivada do vínculo</span>
    <span><CxTlGlyph kind="dec" c="var(--cx-ink-3)" ghost /> esperada, sem data</span>
    <span className="cx-tl-leg-br" />
    <span>{ar('var(--cx-green)')} efeito já ocorrido</span><span>{ar('var(--cx-violet)', '5 4')} condicional</span><span>{ar('var(--cx-ink-3)')} origem (apenso, exceção, recurso)</span><span>{ar('var(--cx-ink-3)', '2 4')} cobertura</span>
  </div>;
}
/* Cartões do caminho crítico (abaixo do mapa): o que falta, em ordem, até o que está por decidir. */
function CxFrCrit({ graph, crit, onOpen }) {
  return <div className="cx-fr-crit">{crit.ids.map((id, i) => {
    const n = graph.byId.get(id), lane = graph.lanes.find(l => l.id === n.lane) || {};
    const dd = n.d ? daysUntil(n.d) : null;
    const when = n.ghost ? 'Sem data' : (CX_DOW[cxDate(n.d).getDay()] + ' ' + fmtDate(n.d) + (n.tm ? ' · ' + n.tm : '') + (dd === null ? '' : dd === 0 ? ' · hoje' : dd < 0 ? ' · vencido ' + tlDurLabel(dd) : ' · em ' + tlDurLabel(dd)));
    return <button key={id} type="button" className={'cx-fr-cr' + (n.ghost ? ' g' : '') + (n.late ? ' late' : '')} onClick={() => n.ref && onOpen(n.ref)}>
      <span className="n">CAMINHO CRÍTICO · {i + 1}</span><h6>{n.label}</h6><p>{when}</p><p className="cx-muted">{lane.name}{n.ghost && n.note ? ' · ' + n.note.replace(/ Sem data\.$/, '') : ''}</p>
    </button>;
  })}</div>;
}
function EditionClaudeFrentes({ tl, op, variant = 'page', lead, shell, onOpenIntim, onOpenHearing, onOpenCda, onOpenProc }) {
  const card = variant === 'card';
  const todayIso = localIso(new Date());
  const graph = React.useMemo(() => cxBuildFrentesGraph(tl, op, todayIso), [tl, op, todayIso]);
  const crit = React.useMemo(() => frentesCriticalPath(graph, todayIso), [graph, todayIso]);
  const [onlyCrit, setOnlyCrit] = React.useState(false);
  const open = (r) => {
    if (!r) return;
    if (r.t === 'intim') onOpenIntim && onOpenIntim(r.id);
    else if (r.t === 'hearing') onOpenHearing && onOpenHearing(r.h);
    else if (r.t === 'cda') onOpenCda && onOpenCda({ id: r.id, operationId: r.operationId });
    else if (r.t === 'exec') onOpenProc && onOpenProc(r.id);
  };
  const critBtn = <button type="button" className={'cx-fchip sm' + (onlyCrit ? ' on' : '') + (!crit.ids.length ? ' zero' : '')} aria-pressed={onlyCrit} disabled={!crit.ids.length}
    title={crit.ids.length ? 'Realça só o que ainda precisa acontecer até o que está por decidir (a decisão esperada e o que depende dela)' : 'Sem decisão esperada neste mapa (nenhum IDPJ/MCF ou recurso aguardando julgamento): não há caminho crítico a destacar'} onClick={() => setOnlyCrit(v => !v)}><span className="cx-dot" style={{ background: 'var(--cx-accent)' }} />Caminho crítico<span className="cx-fcn">{crit.ids.length}</span></button>;
  const nReal = graph.nodes.filter(n => !n.ghost && !n.derived).length;
  const body = !graph.hasFronts
    ? <div className="cx-empty-row" style={{ borderTop: 0 }}>{CX_FR_NOHINT}</div>
    : <>
      {cxFrLegend()}
      <CxFrMap graph={graph} tl={tl} crit={crit} onlyCrit={onlyCrit} onOpen={open} />
      {crit.ids.length && (onlyCrit || !card) ? <CxFrCrit graph={graph} crit={crit} onOpen={open} /> : null}
      <p className="cx-fr-note cx-muted cx-small">Cada coluna é um acontecimento, na ordem das datas (a distância não vale tempo). Setas e estações vazadas ou tracejadas saem dos vínculos entre processos e das fases registradas; nenhuma é fato novo.{graph.orphans ? ' ' + cxPl(graph.orphans, 'audiência sem número de processo fica', 'audiências sem número de processo ficam') + ' fora do mapa.' : ''} Tarefas e revisões não entram.</p>
    </>;
  if (card) {
    return shell({ cls: 'cx-bf-nr cx-bf-fr', count: nReal, sub: 'o que depende de quê', extras: graph.hasFronts ? critBtn : null, children: <div className="cx-nr-body">{body}</div> });
  }
  return <div>
    <div className="cx-tl-tools">{lead}<span className="cx-sp" />{graph.hasFronts ? critBtn : null}</div>
    <div className="cx-card cx-fr-card">{body}</div>
  </div>;
}
function EditionClaudeTimelineFrentes({ tl, op, lead, onOpenIntim, onOpenHearing, onOpenCda, onOpenProc }) {
  return <EditionClaudeFrentes tl={tl} op={op} variant="page" lead={lead} onOpenIntim={onOpenIntim} onOpenHearing={onOpenHearing} onOpenCda={onOpenCda} onOpenProc={onOpenProc} />;
}

/* ═════════════════════ Atuações recentes (Visão geral) ═════════════════════
   O que a operação já recebeu de mim: respostas a intimações, tarefas concluídas e atuações proativas, da mais
   recente para a mais antiga (agregação pura em src/lib/atuacoes.js), 10 por vez. É o passado, sozinho: a Narrativa
   do Briefing cuida do que vem. "Registrar atuação" precisa de um processo: abre a escolha do processo e, em seguida,
   o mesmo formulário da ficha do processo (EditionClaudeAtuacaoForm). */
const CX_UA_STEP = 10;
function CxAtuProcPicker({ execs, onPick, onClose }) {
  const [q, setQ] = React.useState('');
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const live = (e) => e.status !== 'extinta' && e.status !== 'arquivada';
  const sorted = React.useMemo(() => execs.slice().sort((a, b) => (live(b) ? 1 : 0) - (live(a) ? 1 : 0) || String(a.processNumber || '').localeCompare(String(b.processNumber || ''))), [execs]);
  const needle = q.trim().toLowerCase();
  const list = needle ? sorted.filter(e => (String(e.processNumber || '') + ' ' + (e.className || '') + ' ' + cxExecTag(e)).toLowerCase().includes(needle)) : sorted;
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <div className="cx cx-pick" role="dialog" aria-modal="true" aria-label="Em qual processo foi a atuação?">
      <div className="cx-pick-h"><b>Em qual processo foi a atuação?</b><span className="cx-sp" /><button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button></div>
      <p className="cx-pick-n">A atuação fica registrada no processo: entra nas notas dele, em Arquivos (se houver link) e aqui, em Atuações recentes.</p>
      {sorted.length > 6 ? <input className="cx-input" autoFocus placeholder="Filtrar por número ou classe" value={q} onChange={ev => setQ(ev.target.value)} aria-label="Filtrar processos" /> : null}
      <div className="cx-pick-l">
        {list.map(e => <button key={e.id} type="button" className={'cx-pick-r' + (live(e) ? '' : ' off')} onClick={() => onPick(e)}>
          <span className="cx-ptag" style={{ '--c': cxTagColor(e) }}>{cxExecTag(e)}</span>
          <span className="cx-mono cx-pick-num">{e.processNumber || 'S/N'}</span>
          <span className="cx-pick-c">{e.className || ''}{live(e) ? '' : ' · ' + ((EXEC_STATUSES[e.status] || {}).label || e.status || '')}</span>
        </button>)}
        {!list.length ? <div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhum processo com esse filtro.</div> : null}
      </div>
    </div>
  </>;
}
/* Eventos de fase mais recentes de cada processo (briefing.processStageV2): entram em "Atuações recentes" intercalados por data. */
function cxPhaseRows(op, execs) {
  const out = [];
  const briefing = op.briefing || {};
  (execs || []).forEach(e => {
    const recs = getStageRecords(briefing, e.id) || {};
    const { STAGES, keys } = cxBfStages(e);
    stageMeta(STAGES, keys, recs).forEach(m => {
      if (!m.has || !m.rec || isDismissedOnlyStageRec(m.rec) || m.sd.multiRecurso) return;
      const d = toDayKey(m.rec.date) || '';
      if (!d) return;
      out.push({ key: 'fase:' + e.id + ':' + m.k, kind: 'fase', kindLabel: 'Fase', date: d, title: (m.sd.label || m.k) + (m.rec.evento ? ' · Ev. ' + m.rec.evento : '') + (m.outcomeLabel ? ' · ' + m.outcomeLabel : ''), processNumber: e.processNumber || '', url: '', executionId: e.id });
    });
  });
  return out;
}
function cxAtuRows(op, data, execs) {
  const base = buildUltimasAtuacoes({ operationId: op.id, intimations: data.intimations, tasks: data.tasks, executions: data.executions });
  return base.concat(cxPhaseRows(op, execs)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
function CxBfAtuacoes({ op, data, execs, upsert, onOpenIntim, onOpenTask, onOpenProativa, onOpenProc, bare }) {
  const [shown, setShown] = React.useState(CX_UA_STEP);
  const [step, setStep] = React.useState(null); // null · 'pick' · { exec } (formulário)
  const rows = React.useMemo(() => cxAtuRows(op, data, execs), [op, data.intimations, data.tasks, data.executions, execs]);
  const open = (r) => {
    if (r.kind === 'fase') { if (onOpenProc) onOpenProc(r.executionId); }
    else if (r.kind === 'resposta') { if (onOpenIntim) onOpenIntim(r.intimationId); }
    else if (r.kind === 'tarefa') { const t = (data.tasks || []).find(x => x.id === r.taskId); if (t && onOpenTask) onOpenTask(t); }
    else if (onOpenProativa) onOpenProativa(r.executionId, r.actionId);
  };
  const start = () => { if (!execs.length) return; setStep(execs.length === 1 ? { exec: execs[0] } : 'pick'); };
  const save = (fields) => {
    const r = cxRegisterAtuacao({ data, upsert, exec: step.exec, fields });
    if (r.error) return r.error;
    setStep(null);
    setShown(CX_UA_STEP);
    return '';
  };
  return <>
    <CxFoldOrBare bare={bare} id="atuacoes" scope="visao" className="cx-bf-ua" ariaLabel="Atuações recentes" title="Atuações recentes" count={rows.length}
      summary={rows.length ? 'última: ' + (rows[0].title || rows[0].kindLabel) : 'nenhuma registrada'}
      actions={
        <button type="button" className="cx-link-btn" onClick={start} disabled={!execs.length}
          title={execs.length ? 'Registrar o que você fez por conta própria (petição, diligência…), sem intimação. Escolha o processo e preencha o resumo.' : 'Cadastre um processo nesta operação para registrar atuações.'}><CxIcon n="plus" s={13} />Registrar atuação</button>
      }>
    {rows.length === 0
      ? <div className="cx-empty-row">Nenhuma atuação registrada nesta operação ainda.</div>
      : <div className="cx-ua-list">
        {rows.slice(0, shown).map(r => <div key={r.key} className="cx-ua-row" role="button" tabIndex={0} onClick={() => open(r)}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); open(r); } }}>
          <span className={'cx-ua-d cx-mono' + (r.date ? '' : ' cx-muted')}>{r.date ? fmtDate(r.date) : 'sem data'}</span>
          <span className={'cx-ua-chip ' + r.kind}>{r.kindLabel}</span>
          <span className="cx-ua-t">{r.title}</span>
          <span className="cx-ua-p cx-mono">{r.processNumber}</span>
          <span className="cx-ua-l"><CxDocIcon url={r.url} size={16} /></span>
        </div>)}
      </div>}
    {rows.length > shown
      ? <div className="cx-ua-more"><button type="button" className="cx-link-btn" onClick={() => setShown(n => n + CX_UA_STEP)}>Mostrar mais {CX_UA_STEP}</button><span className="cx-muted cx-small">{shown} de {rows.length}</span></div>
      : null}
    </CxFoldOrBare>
    {step === 'pick' ? <CxAtuProcPicker execs={execs} onClose={() => setStep(null)} onPick={(e) => setStep({ exec: e })} /> : null}
    {step && step.exec ? <EditionClaudeAtuacaoForm exec={step.exec} onCancel={() => setStep(null)} onSave={save} /> : null}
  </>;
}

/* ═════════════════════ Miniaturas (M6) ═════════════════════
   "Onde estamos neste processo e o que vem aqui — sem sair da tela em que já estou?" O mesmo vocabulário de formas
   (◆ ○ ■ ▼ ⬢) em três usos: (A) pulso de 120 dias no cartão da Carteira; (B) trilha de 5-6 pontos "você está aqui" na
   gaveta da intimação (o cartão da lista não muda); (C) trilha vertical de fases + a barra de prescrição na ficha do
   processo. Cálculo em src/lib/timeline.js (tlPulseLayout, tlPulseSummary, tlPhaseTrail, tlMiniTrail); nada de dado novo. */
const CX_MT_OUT = { favoravel: 'var(--cx-green)', provido: 'var(--cx-green)', desfavoravel: 'var(--cx-red)', nao_provido: 'var(--cx-red)', pendente: 'var(--cx-yellow)' };
const cxMtOutColor = (o) => CX_MT_OUT[o] || 'var(--cx-ink-2)';
/* Trilha de fases do processo (ordem do tipo: IDPJ/MCF ou central), a partir do mesmo `stageMeta` do Briefing. */
function cxProcTrail(data, op, e, todayIso) {
  if (!e) return null;
  const idpj = e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal';
  const recs = getStageRecords((op && op.briefing) || {}, e.id) || {};
  const metas = stageMeta(idpj ? PROCESS_STAGES : CENTRAL_STAGES, idpj ? PROCESS_STAGE_KEYS : CENTRAL_STAGE_KEYS, recs);
  const stages = metas.map(m => ({
    key: m.k, label: m.sd.label, has: !!m.has, multi: !!m.sd.multiRecurso,
    d: toDayKey(m.rec && m.rec.date) || '', out: (m.rec && m.rec.outcome) || '', outLabel: m.outcomeLabel || '',
    text: String((m.rec && m.rec.texto) || '').trim(), textHtml: pickStageTextHtml(m.rec, cxSanitizeDesc), ev: (m.rec && m.rec.evento) || '',
    recursos: (m.recursos || []).map(r => ({ d: toDayKey(r.date) || '', out: r.outcome || '', outLabel: RECURSO_OUTCOMES[r.outcome] || '', parte: r.parte === 'adversa' ? 'adversa' : 'nossa', texto: String(r.texto || '').trim(), proc: r.proc || '' })),
  }));
  const hearings = (data.hearings || []).filter(h => h.date && h.status !== 'cancelada' && h.status !== 'realizada' && sameProc(h.processNumber, e.processNumber) && (!e.operationId || h.operationId === e.operationId))
    .map(h => ({ d: toDayKey(h.date), tm: h.time || '', label: CX_HEARING_SHORT[h.hearingType] || 'Audiência' }));
  return tlPhaseTrail({ stages, hearings, todayIso });
}
/* (B) Trilha curta da gaveta da intimação. */
function CxMiniTrail({ points }) {
  const you = points.findIndex(x => x.k === 'you');
  return <div className="cx-mt" role="list" aria-label="Onde este prazo cai no processo">
    {points.map((x, i) => {
      const c = x.k === 'you' ? (x.late ? 'var(--cx-red)' : 'var(--cx-accent)') : x.k === 'done' ? (x.out ? cxMtOutColor(x.out) : 'var(--cx-ink-2)') : x.hearing ? 'var(--cx-orange)' : 'var(--cx-ink-3)';
      const kind = x.k === 'you' ? 'prazo' : x.hearing ? 'aud' : x.out ? 'dec' : 'and';
      const when = x.d ? cxDM(x.d) + (x.tm ? ' ' + x.tm : '') : 'sem data';
      return <div key={i} role="listitem" className={'cx-mt-s ' + x.k + (i < you ? ' before' : '')} style={{ '--c': c }} title={x.label + ' · ' + (x.d ? fmtDate(x.d) : 'sem data') + (x.k === 'you' ? ' (este prazo)' : x.k === 'ghost' ? ' (fase esperada)' : '')}>
        <span className="cx-mt-g">{x.k === 'you' ? <span className="cx-mt-ring" /> : null}<CxTlGlyph kind={kind} c={c} ghost={x.k === 'ghost'} s={x.k === 'you' ? 18 : 15} /></span>
        <span className="cx-mt-l">{x.k === 'you' ? 'Este prazo' : tlClip(x.label, 22)}</span>
        <span className="cx-mt-d">{x.k === 'you' ? (x.d ? cxDM(x.d) : '') : when}</span>
      </div>;
    })}
  </div>;
}
/* Texto da fase na trilha da ficha: prévia de 3 linhas (com os parágrafos e a formatação), "mostrar mais" abre tudo. */
function CxPtText({ s }) {
  const [open, setOpen] = React.useState(false);
  const long = String(s.text || '').length > 170 || /\n/.test(s.text || '');
  return <div className="cx-pt-tx">
    {s.ev ? <div className="cx-pt-ev">Ev. {s.ev}</div> : null}
    {s.text ? <div className={'cx-pt-clamp' + (open ? ' open' : '')}><CxRichText text={s.text} html={s.textHtml} /></div> : null}
    {s.text && long ? <button type="button" className="cx-link-btn cx-pt-more" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? 'mostrar menos' : 'mostrar mais'}</button> : null}
  </div>;
}
/* (C) Trilha vertical de fases. */
function CxPhaseTrail({ trail, todayIso }) {
  const { steps, done, total } = trail;
  const cur = trail.curIndex;
  const nextDated = steps.find(s => s.state === 'next' && s.d);
  return <div className="cx-pt">
    <div className="cx-pt-sum"><span><b>{cur >= 0 ? 'Fase ' + (cur + 1) + ' de ' + total : cxPl(total, 'fase', 'fases')}</b> · {cxPl(done, 'cumprida', 'cumpridas')}</span><span className="cx-muted">{nextDated ? 'próxima com data: ' + fmtDate(nextDated.d) : ''}</span></div>
    <div className="cx-pt-prog" aria-hidden="true"><i style={{ width: (total ? done / total * 100 : 0) + '%', background: 'var(--cx-green)' }} />{cur >= 0 ? <i style={{ width: (total ? 1 / total * 100 : 0) + '%', background: 'var(--cx-accent)' }} /> : null}</div>
    <div className="cx-pt-list">
      {steps.map(s => {
        const dd = s.d ? daysUntil(s.d) : null;
        const oc = s.out ? cxMtOutColor(s.out) : '';
        const dt = s.state === 'skip' ? 'sem registro' : s.d ? fmtDate(s.d) + (s.tm ? ' · ' + s.tm : '') : s.state === 'next' ? 'sem data' : 'sem data';
        const extra = s.gap ? '+' + s.gap + ' d' : s.state === 'next' && dd !== null ? (dd === 0 ? 'hoje' : dd > 0 ? 'em ' + tlDurLabel(dd) : tlDurLabel(dd)) : '';
        return <div key={s.id} className={'cx-pt-s ' + s.state} style={{ '--c': oc || 'var(--cx-green)' }}>
          <span className="cx-pt-nd">{s.state === 'done' ? <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true"><path d="M1.5 4.6l2 2 4-4.4" fill="none" style={{ stroke: 'var(--cx-on-solid)' }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : s.state === 'cur' ? <span className="cx-pt-dot" /> : null}</span>
          <div className="cx-pt-tt"><span>{s.label}</span>{s.outLabel ? <span className="cx-nr-b" style={{ '--c': oc }}>{s.outLabel}</span> : null}<span className="cx-pt-dt">{dt}{extra ? ' · ' + extra : ''}</span></div>
          {s.text || s.ev ? <CxPtText s={s} /> : null}
        </div>;
      })}
    </div>
  </div>;
}
/* Barra de prescrição da ficha do processo: a pior CDA do processo (ou das EFs cobertas, no IDPJ/MCF), com a mesma
   leitura da tela de Relógios (CxClkBar). */
function cxProcPrescMini(data, e, cdas, prazosByDebt, todayIso) {
  if (!e) return null;
  let targets = (cdas || []).filter(d => d.status !== 'extinta' && !d.prescriptionHandled);
  let covered = false;
  if (!targets.length && (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal')) {
    const linked = (e.linkedExecutionIds || []).map(id => (data.executions || []).find(x => x.id === id)).filter(Boolean);
    targets = (data.debts || []).filter(d => d.status !== 'extinta' && !d.prescriptionHandled && linked.some(x => sameProc(x.processNumber, d.processNumber)));
    covered = targets.length > 0;
  }
  if (!targets.length) return null;
  let best = null;
  targets.forEach(d => {
    let r = null; try { r = computePrescription({ debt: d, executions: data.executions || [], events: data.prescriptionEvents || [] }); } catch (err) { r = null; }
    if (!r) return;
    const s = CX_SEV[r.status] || 0, bs = best ? (CX_SEV[best.r.status] || 0) : -1;
    if (s > bs || (s === bs && (r.daysLeft ?? 1e9) < (best.r.daysLeft ?? 1e9))) best = { d, r };
  });
  if (!best) return null;
  const c = clkClassify({ debt: best.d, r: best.r, row: prazosByDebt && prazosByDebt.get ? prazosByDebt.get(best.d.id) : undefined, today: todayIso });
  if (!c || c.skip) return null;
  return { c, n: targets.length, covered, status: best.r.status };
}
function CxProcPrescMini({ mini, todayIso }) {
  if (!mini) return null;
  return <div className="cx-pt-presc">
    <div className="cx-pt-presc-h"><span className="cx-pt-cap">Prescrição{mini.covered ? ' das EFs cobertas' : ''}</span><span className="cx-muted cx-small">{mini.n > 1 ? 'pior de ' + cxPl(mini.n, 'CDA', 'CDAs') : '1 CDA'} · {CX_PRESC_TXT[mini.status] || ''}</span></div>
    <CxClkBar c={mini.c} todayIso={todayIso} />
  </div>;
}
/* (A) Pulso de 120 dias (−30 … +90) do cartão da Carteira: um ponto por prazo, audiência, tarefa, decisão ou termo. */
function cxPulseData(data, op, prescLookup, todayIso) {
  const tl = cxBuildTimeline(data, op, prescLookup);
  const items = [];
  tl.items.forEach(it => {
    if (!it.d) return;
    if (it.kind === 'prazo') items.push({ id: it.id, kind: 'prazo', d: it.d, title: it.l, color: cxTlColor(it), tip: it });
    else if (it.kind === 'aud') items.push({ id: it.id, kind: 'aud', d: it.d, tm: it.tm || '', title: it.short || it.l, color: cxTlColor(it), tip: it });
    else if (it.k === 'stage' && it.kind === 'dec' && it.out !== 'pendente') items.push({ id: it.id, kind: 'dec', d: it.d, title: it.l, color: it.c, tip: it });
    else if (it.kind === 'presc' && (it.k === 'cda' || (it.mark && it.deadline))) items.push({ id: it.id, kind: 'presc', d: it.d, title: it.l, color: 'var(--cx-violet)', tip: it });
  });
  (data.tasks || []).forEach(k => {
    if (k.operationId !== op.id || !cxTaskOpen(k) || !k.dueDate) return;
    const d = toDayKey(k.dueDate); if (!d) return;
    items.push({ id: 'tk|' + k.id, kind: 'tar', d, title: k.title || k.description || 'Tarefa', color: 'var(--cx-blue)', tip: { id: 'tk|' + k.id, kind: 'and', d, l: k.title || k.description || 'Tarefa', ref: { t: 'task' } } });
  });
  return { items, layout: tlPulseLayout(items, { todayIso }), sum: tlPulseSummary(items, todayIso), execById: tl.execById };
}
function CxPulse({ pulse, todayIso }) {
  const { layout: L, sum, items } = pulse;
  const byId = new Map(items.map(i => [i.id, i]));
  const Y = 38;
  const rel = (o) => (o === 0 ? 'hoje' : o === 1 ? 'amanhã' : o > 0 ? 'em ' + tlDurLabel(o) : tlDurLabel(o));
  return <span className="cx-pulse">
    <svg viewBox={'0 0 ' + L.width + ' 60'} width="100%" role="img" aria-label="Pulso dos próximos 120 dias: de 30 dias atrás a 90 dias à frente">
      <line x1={L.X0} x2={L.X1} y1={Y} y2={Y} stroke="var(--cx-line-strong)" strokeWidth="1.5" />
      {L.ticks.map(t => t.type === 'month'
        ? <g key={'m' + t.o}><line x1={t.x} x2={t.x} y1={Y - 6} y2={Y + 8} stroke="var(--cx-ink-3)" /><text x={t.x + 3} y={Y + 19} className="cx-pulse-mo">{t.label}</text></g>
        : <line key={'w' + t.o} x1={t.x} x2={t.x} y1={Y - 3} y2={Y + 3} stroke="var(--cx-line-strong)" />)}
      <rect x={L.next7.x0} y={Y - 8} width={L.next7.x1 - L.next7.x0} height="16" rx="3" fill="var(--cx-accent)" opacity="0.1" />
      {L.points.map(p => { const it = byId.get(p.id); if (!it) return null; const y = Y - (p.lvl ? 9 * p.lvl + 4 : 0); return <g key={p.id} transform={'translate(' + (p.x - 7.5) + ',' + (y - 7.5) + ')'} data-tl={'pl|' + p.id} className="cx-pulse-pt"><CxTlGlyph kind={it.kind === 'tar' ? 'tar' : it.kind} c={it.color} s={15} /></g>; })}
      <line x1={L.today} x2={L.today} y1="2" y2="50" stroke="var(--cx-accent)" strokeWidth="1.6" />
      <text x={L.today + 3} y="9" className="cx-pulse-hj">HOJE</text>
    </svg>
    <span className="cx-pulse-ln">{sum.next
      ? <><span className="cx-dot" style={{ background: (byId.get(sum.next.id) || {}).color || 'var(--cx-ink-3)' }} /><span className="cx-pulse-nx"><span className="cx-pulse-pre">Próximo:</span><b className="cx-ell" title={sum.next.title}>{sum.next.title}</b><span className="cx-pulse-rel">· {rel(sum.next.o)}{sum.next.tm ? ' ' + sum.next.tm : ''}</span></span></>
      : <span className="cx-muted">Nada agendado à frente.</span>}</span>
    <span className="cx-pulse-ln sub">{sum.late ? <b className="cx-red-t">{sum.late} vencido{sum.late === 1 ? '' : 's'}</b> : null}{sum.late ? ' · ' : ''}{cxPl(sum.in7, 'item', 'itens')} nos próximos 7 dias{sum.term ? <> · <span className="cx-violet-t">⌛ {sum.term.o <= 90 ? 'termo em ' + tlDurLabel(sum.term.o) : 'próximo termo ' + cxDM(sum.term.d) + '/' + sum.term.d.slice(2, 4)}{sum.term.extra ? ' (+' + sum.term.extra + ')' : ''}</span></> : null}</span>
  </span>;
}

/* ═════════════════════ Horizonte de 90 dias (M5) ═════════════════════
   "O que eu preciso fazer, e em que ordem, nos próximos 90 dias?" Colunas em funil (Atrasados · esta semana ·
   semanas 2 a 5 · meses · Depois — src/lib/timeline.js, `horizonColumns`) e linhas por natureza (Prazos,
   Audiências, Tarefas, Prescrição e revisões). Cada cartão abre a gaveta/janela que já existe. Dia com 3 ou mais
   itens deixa a coluna âmbar e marca "!" no cartão. Dias não úteis vêm de `isBusinessDay` (feriados nacionais,
   recesso forense e o calendário local de ⚙): nenhuma tabela nova. Não é calendário (isso é a Agenda): é um
   resumo por urgência. `cxBuildHorizon` aceita várias operações — o componente é reutilizável. */
function cxBuildHorizon(data, opIds, prazosRadar, todayIso) {
  const ids = new Set(opIds);
  const showOp = ids.size > 1;
  const opSg = (id) => { const o = (data.operations || []).find(x => x.id === id); return o ? String(cxOpName(o)).split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() : ''; };
  const execOf = (pn) => (data.executions || []).find(e => sameProc(e.processNumber, pn));
  const procTxt = (pn, fallback) => { const e = pn ? execOf(pn) : null; return e ? cxExecTag(e) + ' ' + cxExecShortNum(e) : (fallback || ''); };
  const subOf = (opId, txt) => [showOp ? opSg(opId) : '', txt].filter(Boolean).join(' · ');
  const toneOf = (iso) => cxDue(daysUntil(iso), iso).tone;
  const items = [];
  (data.intimations || []).forEach(i => {
    if (!ids.has(i.operationId) || !cxIsOpen(i) || !i.dateDeadline) return;
    const d = toDayKey(i.dateDeadline); if (!d) return;
    items.push({ id: 'i|' + i.id, cat: 'prazo', d, tone: toneOf(d), urgent: intimIsUrgent(i), opId: i.operationId, title: i.eventDescription || i.className || 'Intimação', sub: subOf(i.operationId, procTxt(i.processNumber, cxPartyName(i))), ref: { t: 'intim', id: i.id } });
  });
  (data.hearings || []).forEach(h => {
    if (!ids.has(h.operationId) || !h.date || h.status === 'realizada' || h.status === 'cancelada') return;
    const d = toDayKey(h.date); if (!d || daysUntil(d) < 0) return;
    items.push({ id: 'h|' + h.id, cat: 'aud', d, tm: h.time || '', tone: toneOf(d), opId: h.operationId, title: CX_HEARING_SHORT[h.hearingType] || 'Audiência', sub: subOf(h.operationId, procTxt(h.processNumber, h.parties || '')), ref: { t: 'hearing', h } });
  });
  (data.tasks || []).forEach(k => {
    if (!ids.has(k.operationId) || !cxTaskOpen(k) || !k.dueDate) return;
    const d = toDayKey(k.dueDate); if (!d) return;
    items.push({ id: 't|' + k.id, cat: 'tar', d, tone: toneOf(d), opId: k.operationId, title: k.title || k.description || 'Tarefa', sub: subOf(k.operationId, k.processNumber ? procTxt(k.processNumber) : ''), ref: { t: 'task', k } });
  });
  const rows = ((prazosRadar && prazosRadar.rows) || []).filter(r => ids.has(r.operationId) && r.group !== 6);
  const split = splitMesaRows(rows, todayIso);
  split.needsYou.concat(split.overCap).forEach(r => {
    const d = toDayKey(r.prescDate || r.keyDate); if (!d) return;
    const late = daysUntil(d) < 0;
    items.push({ id: 'p|' + r.id, cat: 'presc', d, tone: late ? 'late' : toneOf(d), opId: r.operationId, title: (late ? 'Vencida · ' : 'Termo · ') + (r.cdaNumber || 'S/N'), sub: subOf(r.operationId, [r.value ? cxMoneyShort(r.value) : '', r.processNumber ? procTxt(r.processNumber) : 'sem processo'].filter(Boolean).join(' · ')), ref: { t: 'cda', row: r } });
  });
  (data.operations || []).forEach(o => {
    if (!ids.has(o.id) || o.status === 'encerrada') return;
    const d = cxReviewNext(o); if (!d) return;
    const dd = daysUntil(d);
    items.push({ id: 'r|' + o.id, cat: 'presc', rev: true, d, tone: dd < 0 ? 'late' : 'later', opId: o.id, title: dd < 0 ? 'Revisão atrasada' : 'Revisão da operação', sub: subOf(o.id, dd < 0 ? tlDurLabel(dd).replace(/^há /, '') + ' de atraso' : ((REVIEW_INTERVALS[o.reviewInterval || 'mensal'] || {}).label || '').toLowerCase()), ref: { t: 'rev' } });
  });
  const columns = horizonColumns(todayIso);
  const buckets = horizonBucket(items, columns);
  const busy = horizonBusyDays(horizonDayCounts(items));
  return { items, columns, buckets, busy, end: addCalendarDays(todayIso, HORIZON_DAYS) };
}
const CX_HZ_TONE = { late: 'var(--cx-red)', today: 'var(--cx-orange)', soon: 'var(--cx-yellow)', later: 'var(--cx-ink-3)', none: 'var(--cx-ink-3)' };
function EditionClaudeHorizon({ data, opIds, prazosRadar, shell, onOpenIntim, onOpenHearing, onOpenTask, onOpenCda }) {
  const todayIso = localIso(new Date());
  const hz = React.useMemo(() => cxBuildHorizon(data, opIds, prazosRadar, todayIso), [data, opIds.join(','), prazosRadar, todayIso]);
  const [open, setOpen] = React.useState(() => new Set());
  const toggle = (k) => setOpen(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const isOff = (iso) => !isBusinessDay(new Date(iso + 'T00:00:00'));
  const act = (it) => {
    const r = it.ref;
    if (r.t === 'intim') onOpenIntim && onOpenIntim(r.id);
    else if (r.t === 'hearing') onOpenHearing && onOpenHearing(r.h);
    else if (r.t === 'task') onOpenTask && onOpenTask(r.k);
    else if (r.t === 'cda') onOpenCda && onOpenCda(r.row);
  };
  const card = (it, col) => {
    const wk = col.kind === 'week';
    const d = it.d, dow = CX_DOW[cxDate(d).getDay()];
    const dl = (wk ? dow + ' ' + d.slice(8, 10) : cxDM(d)) + (it.tm ? ' · ' + it.tm : '');
    const busyDay = hz.busy.has(d);
    const clickable = it.ref.t !== 'rev';
    const Tag = clickable ? 'button' : 'div';
    return <Tag key={it.id} type={clickable ? 'button' : undefined} className={'cx-hz-it cat-' + it.cat + ' tone-' + it.tone + (busyDay ? ' crit' : '') + (it.urgent ? ' urg' : '')} style={{ '--ct': CX_HZ_TONE[it.tone] }}
      onClick={clickable ? () => act(it) : undefined} title={it.title + (it.sub ? ' · ' + it.sub : '') + ' · ' + fmtDate(d) + (busyDay ? ' · dia com ' + hz.items.filter(x => x.d === d).length + ' itens' : '') + (it.ref.t === 'rev' ? ' · use "Revisada" no cabeçalho da operação' : '')}>
      <span className="cx-hz-d"><span className="cx-hz-dl">{dl}</span>{busyDay ? <b className="cx-hz-bang" aria-label="dia com 3 ou mais itens">!</b> : null}{it.urgent ? <b className="cx-hz-urg">URGENTE</b> : null}</span>
      <span className="cx-hz-t">{it.title}</span>
      {it.sub ? <span className="cx-hz-s">{it.sub}</span> : null}
    </Tag>;
  };
  const total = hz.items.length;
  const lateN = hz.buckets.late.length;
  const rowsDef = HORIZON_ROWS;
  const summary = total + (total === 1 ? ' item' : ' itens') + ' nos próximos 90 dias' + (lateN ? ' · ' + lateN + (lateN === 1 ? ' atrasado' : ' atrasados') : '');
  return shell({ cls: 'cx-hz', summary, extras: <span className="cx-hz-range">{cxDM(todayIso)} → {fmtDate(hz.end)}</span>, children: <>
    <div className="cx-hz-h">
      <span className="cx-hz-sum"><b>{total}</b> {total === 1 ? 'item' : 'itens'} nos próximos 90 dias{lateN ? <> · <b className="cx-red-t">{lateN}</b> {lateN === 1 ? 'atrasado' : 'atrasados'}</> : null}</span>
      <span className="cx-hz-key"><i className="cx-hz-sw busy" />dia com 3 ou mais itens<span className="cx-hz-off-k" title="Dias de semana sem expediente: feriado nacional, recesso forense (20/12 a 20/01) ou dia marcado no calendário local (⚙)">● dia não útil</span></span>
    </div>
    <div className="cx-hz-scroll">
      <div className="cx-hz-grid" style={{ gridTemplateColumns: '112px repeat(' + hz.columns.length + ', minmax(116px, 1fr))' }}>
        <div className="cx-hz-corner" />
        {hz.columns.map(c => {
          const n = hz.buckets[c.key].length, offs = horizonOffRuns(c, isOff);
          return <div key={c.key} className={'cx-hz-ch ' + c.kind + (c.key === 'w1' ? ' now' : '')}>
            <b>{c.label}</b><span className="cx-hz-sub">{c.sub}</span>
            <span className="cx-hz-n">{n} {n === 1 ? 'item' : 'itens'}</span>
            {offs.map(r => <span key={r.from} className="cx-hz-off" title={(r.n === 1 ? 'Dia de semana sem expediente' : r.n + ' dias de semana sem expediente') + ': feriado, recesso forense ou calendário local (⚙)'}>● {r.from === r.to ? cxDM(r.from) : r.from.slice(8, 10) + '–' + cxDM(r.to)}</span>)}
          </div>;
        })}
        {rowsDef.map(([cat, label, subL]) => <React.Fragment key={cat}>
          <div className="cx-hz-rl"><b>{label}</b>{subL ? <span>{subL}</span> : null}</div>
          {hz.columns.map(c => {
            const list = hz.buckets[c.key].filter(i => i.cat === cat);
            const cellKey = cat + '|' + c.key;
            const cap = c.kind === 'week' ? 4 : 3;
            const cp = tlCapList(list, cap, open.has(cellKey));
            const crowded = list.some(i => hz.busy.has(i.d));
            return <div key={c.key} className={'cx-hz-c ' + c.kind + (c.key === 'w1' ? ' now' : '') + (crowded ? ' busy' : '')}>
              {list.length ? cp.shown.map(i => card(i, c)) : <span className="cx-hz-none">—</span>}
              {cp.more > 0 ? <button type="button" className="cx-hz-more" onClick={() => toggle(cellKey)}>+ {cp.more} {cp.more === 1 ? 'item' : 'itens'}</button> : (open.has(cellKey) && list.length > cap ? <button type="button" className="cx-hz-more" onClick={() => toggle(cellKey)}>recolher</button> : null)}
            </div>;
          })}
        </React.Fragment>)}
      </div>
    </div>
  </> });
}

/* ═════════════════════ Visão geral da operação ═════════════════════ */
/* Descrição da operação no cabeçalho da Visão geral. Texto simples em op.description (busca, Clássico,
   Beta, relatório e modal "Editar operação" seguem usando só ele) e, quando há formatação, HTML em
   op.descriptionHtml — exibido (sanitizado de novo) só enquanto o texto simples dele for igual a
   description; se alguém editar no modal clássico, volta ao texto simples. Edição inline com o mesmo
   editor rico do Diário (RichNoteEditor), com cor de texto. */
const cxSanitizeDesc = (h) => sanitizeNoteHtml(h, { color: true, links: true });
function EditionClaudeOpDesc({ op, upsert }) {
  const [editing, setEditing] = React.useState(false);
  const draftRef = React.useRef('');
  const plain = String(op.description || '').trim();
  const rich = React.useMemo(() => pickOpDescriptionHtml(op, cxSanitizeDesc), [op.description, op.descriptionHtml]);
  const cancel = () => setEditing(false);
  const save = () => {
    upsert('operations', { ...op, ...buildOpDescriptionPatch(draftRef.current, cxSanitizeDesc) });
    setEditing(false);
    cxNotify('Descrição salva');
  };
  if (editing) {
    return <div className="cx-opd cx-opd-edit"
      onKeyDown={e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); save(); }
      }}>
      <RichNoteEditor initialHtml={rich || escapeHtmlText(plain)} placeholder="Descreva a operação…" draftRef={draftRef} autoFocus colors />
      <div className="cx-opd-acts">
        <span className="cx-muted cx-small">Esc cancela · Ctrl+Enter salva</span>
        <span className="cx-sp" />
        <button type="button" className="cx-btn sm ghost" onClick={cancel}>Cancelar</button>
        <button type="button" className="cx-btn sm primary" onClick={save}>Salvar</button>
      </div>
    </div>;
  }
  if (!rich && !plain) {
    return <div className="cx-opd"><button type="button" className="cx-link-btn cx-opd-add" onClick={() => setEditing(true)}>Adicionar descrição</button></div>;
  }
  return <div className="cx-opd">
    {rich
      ? <div className="cx-opd-txt cx-opd-rich" dangerouslySetInnerHTML={{ __html: mapRichTextColors(rich) }} />
      : <p className="cx-opd-txt cx-opd-plain">{plain}</p>}
    <button type="button" className="cx-icon-btn cx-sm cx-opd-pen" onClick={() => setEditing(true)} title="Editar descrição" aria-label="Editar descrição"><CxIcon n="edit" s={13} /></button>
  </div>;
}
/* Texto de evento/decisão (fases das Frentes processuais e ficha do processo): parágrafos, respiro e formatação.
   `html` (já validado por pickStageTextHtml) → HTML sanitizado com as cores do editor mapeadas para o tema;
   senão `text` simples em parágrafos (linha em branco separa; quebra simples vira <br>) — tudo como elementos
   React, sem innerHTML. */
function CxRichText({ text, html, className }) {
  const clean = React.useMemo(() => (html ? cxSanitizeDesc(html) : ''), [html]);
  const cls = 'cx-rt' + (className ? ' ' + className : '');
  if (clean) return <div className={cls + ' cx-rt-html'} dangerouslySetInnerHTML={{ __html: mapRichTextColors(clean) }} />;
  const paras = plainToParagraphs(text);
  if (!paras.length) return null;
  return <div className={cls}>{paras.map((lines, i) => <p key={i}>{lines.map((l, j) => <React.Fragment key={j}>{j ? <br /> : null}{l}</React.Fragment>)}</p>)}</div>;
}
/* Editor inline do texto da fase: o mesmo editor rico do Diário e da descrição (negrito, itálico, sublinhado, marca-texto,
   cores, lista) + "Organizar parágrafos" (organizarParagrafos, só espaços/quebras; refaz o texto sem formatação, com Desfazer). */
function CxStageTextEditor({ texto, textoHtml, onSave, onCancel }) {
  const draftRef = React.useRef('');
  const [seed, setSeed] = React.useState(() => ({ n: 0, html: textoHtml || plainToRichHtml(texto) }));
  const [undo, setUndo] = React.useState(null);
  const organizar = () => {
    const before = cxSanitizeDesc(draftRef.current);
    const next = organizarParagrafos(richHtmlToPlainText(before, { paragraphs: true }));
    setUndo({ html: before, lost: /<(b|strong|i|em|u|s|strike|span|ul|ol|li)\b/i.test(before) });
    setSeed(sd => ({ n: sd.n + 1, html: plainToRichHtml(next) }));
  };
  const desfazer = () => { if (!undo) return; setSeed(sd => ({ n: sd.n + 1, html: undo.html })); setUndo(null); };
  return <div className="cx-opd-edit cx-rt-edit"
    onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); }
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); onSave(draftRef.current); }
    }}>
    <RichNoteEditor key={seed.n} initialHtml={seed.html} placeholder="Texto do evento…" draftRef={draftRef} autoFocus colors />
    <div className="cx-opd-acts">
      <button type="button" className="cx-btn sm" onClick={organizar} title="Insere linha em branco antes de 1) 2) a) b) I – e de Ante o exposto, DEFIRO, Intime-se… sem alterar as palavras. Refaz o texto sem a formatação (dá para desfazer).">Organizar parágrafos</button>
      {undo ? <button type="button" className="cx-link-btn" onClick={desfazer}>Desfazer</button> : null}
      <span className="cx-muted cx-small">{undo ? (undo.lost ? 'Formatação removida · Desfazer volta' : 'Revise antes de salvar') : 'Esc cancela · Ctrl+Enter salva'}</span>
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm ghost" onClick={onCancel}>Cancelar</button>
      <button type="button" className="cx-btn sm primary" onClick={() => onSave(draftRef.current)}>Salvar</button>
    </div>
  </div>;
}
/* Editor rico mínimo, no lugar (Evento da fase e Notas das Frentes): contenteditable com barra discreta
   (negrito, itálico, lista, lista numerada, link), Ctrl+B / Ctrl+I, Esc cancela, Ctrl+Enter salva.
   `enterSaves` (campo de nova nota): Enter salva, Shift+Enter quebra a linha; dentro de uma lista o Enter cria
   o item (Enter em item vazio sai da lista e o Enter seguinte salva). `actions` mostra Cancelar/Salvar.
   Devolve o HTML bruto em onSave(html) — quem chama sanitiza (cxSanitizeDesc) ou converte (htmlToMdNote). */
function cxNormalizeUrl(u) {
  u = String(u || '').trim();
  if (!u) return '';
  if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return 'mailto:' + u;
  if (/^[^\s:]+\.[^\s:]+/.test(u) && !/^[a-z][a-z0-9+.-]*:/i.test(u)) return 'https://' + u;
  return '';
}
function CxRichEdit({ html, onSave, onCancel, placeholder, compact, enterSaves, actions, autoFocus, ariaLabel }) {
  const ref = React.useRef(null);
  const savedSel = React.useRef(null);
  const [empty, setEmpty] = React.useState(!html);
  const [link, setLink] = React.useState(null); // null | string (URL em edição)
  const sync = () => { const ed = ref.current; if (ed) setEmpty(!String(ed.textContent || '').trim() && !ed.querySelector('li')); };
  React.useEffect(() => {
    const ed = ref.current; if (!ed) return;
    ed.innerHTML = html || '';
    sync();
    if (autoFocus) {
      ed.focus();
      try { const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
    }
  }, []);
  /* execCommand de lista dentro de <p> gera <p><ul>…</ul></p> (inválido): tira a lista de dentro do parágrafo. */
  const fixLists = () => {
    const ed = ref.current; if (!ed) return;
    ed.querySelectorAll('p > ul, p > ol').forEach(l => {
      const p = l.parentNode;
      p.parentNode.insertBefore(l, p.nextSibling);
      if (!String(p.textContent || '').trim() && !p.querySelector('img')) p.remove();
    });
  };
  const run = (c) => { const ed = ref.current; if (!ed) return; ed.focus(); try { document.execCommand(c, false, null); } catch (e) {} fixLists(); sync(); };
  const inList = () => {
    const ed = ref.current; const s = window.getSelection();
    let n = s && s.anchorNode;
    while (n && n !== ed) { if (n.nodeName === 'LI') return true; n = n.parentNode; }
    return false;
  };
  const commit = () => { const ed = ref.current; if (!ed) return; fixLists(); onSave(ed.innerHTML); };
  const openLink = () => {
    const s = window.getSelection();
    savedSel.current = s && s.rangeCount && ref.current.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
    setLink('');
  };
  const applyLink = () => {
    const url = cxNormalizeUrl(link);
    const ed = ref.current; setLink(null);
    if (!url || !ed) { if (ed) ed.focus(); return; }
    ed.focus();
    const s = window.getSelection();
    if (savedSel.current) { s.removeAllRanges(); s.addRange(savedSel.current); }
    try {
      if (s.isCollapsed) document.execCommand('insertHTML', false, '<a href="' + url.replace(/"/g, '%22') + '">' + url.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</a>&nbsp;');
      else document.execCommand('createLink', false, url);
    } catch (e) {}
    sync();
  };
  const onKeyDown = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel && onCancel(); return; }
    if (mod && !e.shiftKey && !e.altKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); run('bold'); return; }
    if (mod && !e.shiftKey && !e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); run('italic'); return; }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      if (mod) { e.preventDefault(); commit(); return; }
      if (enterSaves && !e.shiftKey && !inList()) { e.preventDefault(); commit(); }
    }
  };
  const onPaste = (e) => {
    const t = e.clipboardData && e.clipboardData.getData('text/plain');
    if (t == null) return;
    e.preventDefault();
    try { document.execCommand('insertText', false, t); } catch (er) {}
    sync();
  };
  const btn = (ic, title, fn) => <button type="button" className="cx-icon-btn cx-sm" title={title} aria-label={title} onClick={fn}><CxIcon n={ic} s={14} /></button>;
  return <div className={'cx-re' + (compact ? ' compact' : '') + (empty ? ' empty' : '')}>
    <div className="cx-re-tb" role="toolbar" aria-label="Formatação" onMouseDown={e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); }}>
      {btn('bold', 'Negrito (Ctrl+B)', () => run('bold'))}
      {btn('italic', 'Itálico (Ctrl+I)', () => run('italic'))}
      {btn('list', 'Lista', () => run('insertUnorderedList'))}
      {btn('listOl', 'Lista numerada', () => run('insertOrderedList'))}
      {btn('link', 'Link', openLink)}
      {link !== null ? <input className="cx-re-url" autoFocus placeholder="https://… e Enter" aria-label="Endereço do link" value={link}
        onChange={e => setLink(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); applyLink(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setLink(null); if (ref.current) ref.current.focus(); } }} /> : null}
    </div>
    <div ref={ref} className="cx-re-ed" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={ariaLabel || 'Texto'}
      data-ph={placeholder || ''} onInput={sync} onKeyDown={onKeyDown} onPaste={onPaste} />
    {actions ? <div className="cx-re-act">
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm ghost" onClick={onCancel}>Cancelar</button>
      <button type="button" className="cx-btn sm primary" onClick={commit}>Salvar</button>
    </div> : null}
  </div>;
}
/* Cartões da Visão geral (CxFoldAllBar): o que "Recolher tudo / Expandir tudo" alcança. Os blocos de dentro de cada frente
   (evento, notas, efs) ficam de fora de propósito. */
const CX_OV_FOLD_IDS = ['frentes', 'mural', 'apoio'];
function EditionClaudeOpOverview(p) {
  const { data, op, opStats: s, prazosRadar } = p;
  const rs = cxRS(op);
  const cls = getOpClassifications(op);
  const open = (data.intimations || []).filter(i => i.operationId === op.id && cxIsOpen(i)).sort(cxAttention);
  const today = localIso(new Date());
  const prazoRows = (prazosRadar.rows || []).filter(r => r.operationId === op.id && r.group !== 6);
  const split = splitMesaRows(prazoRows, today);
  const hearings = (data.hearings || []).filter(h => h.operationId === op.id && h.date && h.status !== 'realizada' && h.status !== 'cancelada' && daysUntil(h.date) >= 0).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const tasks = (data.tasks || []).filter(t => t.operationId === op.id && t.status !== 'concluida' && t.status !== 'cancelada').sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
  const cart = cxCarteiraTotals(data);
  const opPct = s && s.total > 0 ? Math.round(s.guar / s.total * 100) : null;
  const ind = s ? s.indisp : null;
  const indDelta = ind && ind.kind === 'valor' ? indispDeltaPp(ind.pct, cart.indisp.pct) : null;
  const indSplit = ind ? cxIndispSplit(ind) : '';
  const opCartShare = s && cart.total > 0 ? Math.round(s.total / cart.total * 100) : null;
  const opExecCount = (data.executions || []).filter(e => e.operationId === op.id).length;
  const nextTask = tasks.find(t => t.dueDate && daysUntil(t.dueDate) >= 0);
  const lateIntims = open.map(i => ({ i, dd: daysUntil(i.dateDeadline) })).filter(x => x.dd !== null && x.dd < 0).sort((a, b) => a.dd - b.dd);
  const nextHearing = hearings[0];
  const resumo = s ? resumoOperacao({
    garantiaPct: opPct, carteiraPct: cart.pct,
    indispPct: ind && ind.kind !== 'sem_avaliacao' ? ind.pct : null, indispCarteiraPct: cart.indisp.pct, indispRatio: ind && ind.kind !== 'sem_avaliacao' ? ind.ratio : null,
    intimVencidas: lateIntims.length ? { n: lateIntims.length, maisAntigaDias: -lateIntims[0].dd, parte: cxPartyName(lateIntims[0].i) } : null,
    cdasAlarme: s.prescA || 0,
    revisaoAtrasadaDias: rs.overdue && rs.daysLeft != null ? -rs.daysLeft : null,
    audiencia: nextHearing ? { dias: daysUntil(nextHearing.date), tipo: (CX_HEARING[nextHearing.hearingType] || '').replace(/^Audiência( de)? /i, '').toLowerCase(), iso: toDayKey(nextHearing.date), time: nextHearing.time || '' } : null,
  }) : '';
  const [proView, setProView] = React.useState(null); // { execId, actionId } — leitura de uma atuação proativa (Atuações recentes e Narrativa)
  const opExecs = React.useMemo(() => (data.executions || []).filter(e => e.operationId === op.id), [data.executions, op.id]);
  const opDebts = React.useMemo(() => (data.debts || []).filter(d => d.operationId === op.id), [data.debts, op.id]);
  const proExec = proView ? opExecs.find(x => x.id === proView.execId) : null;
  const proAct = proExec ? (proExec.proactiveActions || []).find(x => x.id === proView.actionId) : null;
  const openProativa = (execId, actionId) => setProView({ execId, actionId });
  const editTask = (t) => p.setModal({ type: 'edit', entityType: 'task', initial: t });
  return <div className="cx cx-page cx-page-wide cx-op-page">
    <EditionClaudeOpDesc key={op.id} op={op} upsert={p.upsert} />
    {s ? <CxResumo text={resumo} className="cx-rs-op" /> : null}
    <CxBfNews data={data} opId={op.id} setData={p.setData} />
    {s ? <CxKpiStrip n={4} dense={false} className="cpair">
      <CxKpiCard label="Dívida total" value={cxMoneyShort(s.total)} desc={cxPl(s.debts, 'CDA', 'CDAs') + (opCartShare !== null ? ' · ' + opCartShare + '% da carteira' : '')} onClick={() => p.onTab('dividas')}
        pair={{ label: 'Cobertura', value: s.coverageGrand > 0 ? s.covPct + '%' : '—', note: 'pelos incidentes', tip: 'Parte do valor das execuções coberta por IDPJ ou cautelar' }} />
      <CxKpiCard label="Indisponibilidade" value={ind.kind === 'sem_bens' ? 'Sem bens' : ind.kind === 'sem_avaliacao' ? 'Sem avaliação' : cxMoneyShort(ind.totalVal)} onClick={() => p.onTab('bens')}
        tip={[CX_INDISP_RING, indSplit, ind.semValorN ? cxPl(ind.semValorN, 'bem sem avaliação', 'bens sem avaliação') : ''].filter(Boolean).join(' · ')}
        side={ind.pct !== null ? <span className="cx-kc-ring"><CxRing pct={ind.pct} size={44} stroke={6} label={(ind.over ? indispRatioText(ind.ratio) : ind.pct + '% da dívida') + ' com bens indisponíveis'} /></span> : null}
        desc={ind.kind === 'sem_bens' ? 'nenhum bem indisponível' : ind.kind === 'sem_avaliacao' ? cxPl(ind.n, 'bem', 'bens') + ' sem valor lançado' : <>{indispRatioText(ind.ratio) || cxPl(ind.n, 'bem', 'bens')}{indDelta ? <span className={'cx-dl ' + indDelta.dir + ' ' + indDelta.tone} style={{ marginLeft: 8 }}>{indDelta.txt}</span> : null}</>}
        pair={{ label: 'Garantido (CDA)', value: cxMoneyShort(s.guar), note: opPct !== null ? opPct + '% da dívida' : 'sem dívida', tip: 'CDAs com status Garantida', onClick: () => p.onTab('dividas') }} />
      <CxKpiCard label="Prescrição · CDAs" value={s.prescA} tone={s.prescA ? 'violet' : ''} desc="a agir" tip="CDAs desta operação nos cartões «a agir» da Mesa de prazos (Conferir o cálculo, Ajuizar até 60 dias, Lançar fato, Confirmar vigência, Completar dado). Mesmo número do ponto no menu." onClick={p.onOpenPrazos}
        pair={{ label: 'Processos em alerta', value: s.prescExec, tone: s.prescExec ? 'violet' : '', note: 'de ' + cxPl(opExecCount, 'processo', 'processos') + ' · crítico, alerta ou vencido', onClick: () => p.onTab('prescricao_v2') }} />
      <CxKpiCard label="Intimações" value={s.openIntims} tone={s.overdueIntims ? 'red' : ''} desc={s.overdueIntims ? cxPl(s.overdueIntims, 'vencida', 'vencidas') : 'nenhuma vencida'} descTone={s.overdueIntims ? 'red' : ''}
        pair={{ label: 'Tarefas', ctx: nextTask ? <>próxima {cxDue(daysUntil(nextTask.dueDate), nextTask.dueDate).txt}</> : null, value: s.openTasks, note: 'em aberto, ' + (s.overdueTasks ? cxPl(s.overdueTasks, 'vencida', 'vencidas') : 'nenhuma vencida'), noteTone: s.overdueTasks ? 'cx-red-t' : '', onClick: () => p.onTab('tarefas') }} />
    </CxKpiStrip> : null}
    <CxFoldAllBar scope="visao" ids={CX_OV_FOLD_IDS} />
    <div className="cx-ov-stack">
      <CxBfFronts op={op} data={data} opExecs={opExecs} opDebts={opDebts} prazoRows={prazoRows} upsert={p.upsert} setModal={p.setModal}
        onOpenTab={p.onTab} onOpenPrazos={p.onOpenPrazos} onOpenIntim={p.onOpenIntim} onOpenHearing={p.onOpenHearing} onOpenProc={p.onOpenProc} />
      <CxBfMural op={op} data={data} upsert={p.upsert} setModal={p.setModal} />
      <CxBfApoio op={op} data={data} prazosRadar={prazosRadar} prescLookup={p.prescLookup} split={split} mesaCards={p.mesaCards} execs={opExecs} upsert={p.upsert}
        onOpenTimeline={p.onOpenTimeline} onOpenPrazos={p.onOpenPrazos} onOpenCda={p.onOpenCda} onOpenProc={p.onOpenProc} onOpenIntim={p.onOpenIntim}
        onOpenTask={editTask} onOpenProativa={openProativa}
        hz={{ onOpenIntim: p.onOpenIntim, onOpenHearing: p.onOpenHearing, onOpenTask: p.onOpenTask, onOpenCda: p.onOpenCda }}
        nr={{ onOpenIntim: p.onOpenIntim, onOpenHearing: (h) => p.setModal({ type: 'edit', entityType: 'hearing', initial: h }), onOpenCda: p.onOpenCdaDrawer, onOpenProc: p.onOpenProc, onOpenTask: editTask, onOpenProativa: openProativa }} />
    </div>
    {proAct ? <EditionClaudeAtuacaoView exec={proExec} action={proAct} onClose={() => setProView(null)} /> : null}
  </div>;
}

/* ═════════════════════ Prazos extintivos — Mesa ═════════════════════ */
/* ── Régua e simulação nas linhas da Mesa (fase 4a) ── */
const CX_TONE_VAR = { orange: 'var(--cx-orange)', red: 'var(--cx-red)', blue: 'var(--cx-blue)', neutral: 'var(--cx-ink-3)' };
/* Cor do cartão do item (a régua usa a cor do cartão, não a dos grupos crítico/alerta dos Relógios). Cinza para o Ajuizar de 60 a 180 dias. */
function cxCardColor(item) {
  if (!item || (item.card === 'ajuizar' && item.ajuizarLonge)) return CX_TONE_VAR.neutral;
  return CX_TONE_VAR[MESA_CARD_TONE[item.card] || 'neutral'];
}
/* Cartões em que a régua já aparece na linha; nos demais (Só vigiar, Adiadas, Tratadas, Consumadas antigas) só ao expandir. */
const CX_BAR_ALWAYS = { calculo: 1, ajuizar: 1, fato: 1, vigencia: 1, dado: 1, sempressa: 1 };
/* Régua do relógio da linha + botão de expandir (nos cartões em que a régua fica escondida). */
function useCxMesaBar(item, clk, today) {
  const [exp, setExp] = React.useState(false);
  const always = !!CX_BAR_ALWAYS[item.card];
  const show = !!clk && (always || exp);
  const bar = show ? <CxClkBar compact c={clk} todayIso={today} band={mesaItemBand(item)} tone={cxCardColor(item)} /> : null;
  const toggle = clk && !always ? <button type="button" className="cx-mesa-clkbtn" data-act="relogio" aria-expanded={exp} onClick={() => setExp(v => !v)}>
    <span className="cx-caret" style={{ transform: exp ? 'none' : 'rotate(-90deg)' }}><CxIcon n="chevD" s={12} /></span>Relógio</button> : null;
  return { bar, toggle };
}
/* «E se eu ajuizar hoje?» — simulação do motor (clkSimulateFiling), só na memória: nada é gravado. */
function useCxFilingSim(item, clk, data, today) {
  const [sim, setSim] = React.useState(null);
  const can = item.card === 'ajuizar' && !!item.debt && !item.debt.processNumber;
  const run = () => {
    if (sim) { setSim(null); return; }
    setSim(clkSimulateFiling({ debt: item.debt, executions: (data && data.executions) || [], events: (data && data.prescriptionEvents) || [], today }));
  };
  const btn = can ? <button type="button" className="cx-btn sm ghost" data-act="simular" aria-expanded={!!sim} title={CX_CLK_SIM_TIP} onClick={run}>E se eu ajuizar hoje?</button> : null;
  let out = null;
  if (can && sim) {
    const simClock = sim.ok && clk ? clkApplySim(clk, sim, today) : null;
    out = <div className="cx-sim" role="status" data-sim="out">
      <div className="cx-sim-h"><b>Simulação · nada foi gravado</b><button type="button" className="cx-btn sm ghost" data-act="fechar-sim" onClick={() => setSim(null)}>Fechar</button></div>
      {sim.ok
        ? <>
          <p>Se a ação fosse ajuizada hoje, a ordinária deixaria de correr{sim.before && sim.before.term ? <> (o termo era <b>{fmtDate(sim.before.term)}</b>)</> : null} e passaria a valer a <b>prescrição intercorrente</b>: o despacho de citação de <b>{fmtDate(sim.anchor.iso)}</b> encerra o ciclo e abre um novo relógio (1 ano de suspensão + 5 anos).</p>
          <p>Termo: <b>não antes de {fmtDate(sim.floor)}</b> — sem relógio ativo até lá; só há risco depois de novo marco.</p>
          {simClock ? <CxClkBar compact c={simClock} todayIso={today} tone="var(--cx-cyan)" /> : null}
        </>
        : <p>{sim.reason}</p>}
    </div>;
  }
  return { btn, out };
}
function CxMesaRow({ r, debt, a, item, clk, data }) {
  const [parc, setParc] = React.useState('');
  const cert = mesaCertainty(r);
  const isParc = r.action && r.action.type === 'criar_evento' && r.action.eventType === 'susp_parcelamento';
  const mz = a.mz;
  const today = localIso(new Date());
  // Com o item da Mesa por cartões: a data de posição só é prazo quando dateIsDeadline; nunca «há N anos» num piso.
  const snLabel = item ? mesaSnoozeLabel(item, today) : (debt && debt.prescSnooze ? 'o adiamento venceu' : '');
  const tardeNao = !!(item && item.cedoVencidaTardeNao);
  const ck = item ? mesaItemClock(item, today) : null;
  const noDeadline = !!(ck && ck.plain);
  const antiga = !!(item && item.card === 'antigas');
  const horizon = ck ? (ck.plain ? '' : ck.text) : formatPrescHorizon(r.prescDays);
  const seg = r.prescSegment || r.clock;
  const clock = seg === 'ordinaria' || seg === 'credito' ? 'Ordinária' : seg === 'intercorrente' ? 'Intercorrente' : seg === 'decadencia' ? 'Decadência' : null;
  const vencido = isG1Vencido(r) && !antiga;
  const rb = useCxMesaBar(item, clk, today);
  const fs = useCxFilingSim(item, clk, data, today);
  return <div className={'cx-mesa-row g' + r.group + (vencido && !tardeNao ? ' venc' : '') + (mz.sel.has(r.id) ? ' sel' : '')} style={{ '--c': CX_GROUP_C[r.group] }}>
    <div className="cx-mesa-main">
      <div className="cx-mesa-id">
        <MesaCk item={item} mz={mz} />
        <span className="cx-gnum" title={'Grupo ' + r.group + ' · ' + (PRAZOS_GROUP_LABELS[r.group] || '')}>{r.group}</span>
        <span className="cx-mono cx-mesa-cda">{r.cdaNumber || 'S/N'}</span>
        <span className={'cx-cert ' + cert} title={CX_CERT_TIP[cert]}>{CX_CERT[cert]}</span>
        {clock ? <span className="cx-tag">{clock}</span> : null}
        {tardeNao ? <span className="cx-tag orange" title="A data cedo já passou; a data tarde (tese da União) ainda não.">cedo venceu, tarde não</span> : null}
        {snLabel ? <span className="cx-tag orange">{snLabel}</span> : null}
      </div>
      <div className="cx-mesa-why" title={r.basis || undefined}>{betaSafeUiText(r.why || r.prescLabel || r.summary || '') || 'Prazo em acompanhamento.'}</div>
      {rb.bar}
      <div className="cx-mesa-meta">
        {rb.toggle}
        {r.opName ? <span className="cx-op-tag"><CxOpSquare opId={r.operationId} /><span className="cx-ell">{String(r.opName).replace(/^Opera[çc][ãa]o\s+/i, '')}</span></span> : null}
        {r.processNumber ? <CxProc num={r.processNumber} /> : <span className="cx-muted">sem processo</span>}
        {r.personName ? <span className="cx-ell cx-muted">{r.personName}</span> : null}
      </div>
    </div>
    <div className="cx-mesa-side">
      {noDeadline
        ? <span className="cx-mesa-when txt" title={r.basis || undefined}>{ck.text}</span>
        : <span className={'cx-mesa-when' + (vencido && !tardeNao ? ' red' : '') + (ck && ck.gray ? ' gray' : '')}>{horizon || (r.keyDate ? cxDM(r.keyDate) : '—')}</span>}
      {ck && ck.date ? <span className="cx-mesa-date" title={r.basis || undefined}>{ck.date}</span> : null}
      <span className="cx-mesa-val">{fmtCur(r.value || 0)}</span>
    </div>
    <div className="cx-mesa-acts">
      <MesaActs item={item} mz={mz} ui="cx" skipPrimary={isParc} extra={fs.btn} />
      {isParc ? <span className="cx-mesa-parc">
        <input id={'cx-parc-' + r.id} type="date" className="cx-input" value={parc} onChange={e => setParc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && parc) a.inlineParc(r, parc); }} aria-label="Data da adesão ao parcelamento" />
        <button type="button" className="cx-btn sm primary" disabled={!parc} onClick={() => { a.inlineParc(r, parc); setParc(''); }}>Lançar adesão</button>
      </span> : null}
    </div>
    {fs.out}
    <MesaInline item={item} mz={mz} ui="cx" />
  </div>;
}
const CX_PZ_TONE = MESA_CARD_TONE;
const CX_PZ_PAGE = 150;
/** Cartão da Mesa (usado na própria Mesa, no Hoje e no Painel). `on` undefined = cartão só de atalho. */
function CxMesaCard({ c, t, on, disabled, onClick }) {
  const zero = t.n === 0, only = c.id === 'ajuizar' && zero && t.nLonge > 0;
  const sub = t.n ? cxMoneyShort(t.value) : (only ? 'nenhuma nos 60 dias' : 'nenhum agora');
  return <button type="button" className={'cx-pz-card ' + (c.fileira === 1 ? CX_PZ_TONE[c.id] : 'neutral') + (on ? ' on' : '') + (zero ? ' zero' : '') + (only ? ' longe' : '')}
    title={c.tip} aria-pressed={on === undefined ? undefined : !!on} disabled={disabled} onClick={onClick}>
    <span className="cx-pz-card-n">{t.n}</span>
    <span className="cx-pz-card-t">
      <span className="cx-pz-card-l">{c.nome}</span>
      <span className="cx-pz-card-s">{sub}</span>
      {c.id === 'ajuizar' ? <span className="cx-pz-card-g"><b>+{t.nLonge}</b> entre 60 e 180 dias</span> : null}
    </span>
  </button>;
}
/** Cartões da Mesa como atalho (Hoje, Painel): fileira 1 em destaque, fileira 2 discreta. Clique abre a Mesa na seção. */
function CxMesaStrip({ mc, onOpen, mini }) {
  const t = mc.totals;
  const one = (c) => <CxMesaCard key={c.id} c={c} t={t[c.id]} disabled={t[c.id].n + (t[c.id].nLonge || 0) === 0} onClick={() => onOpen(c.id)} />;
  return <div className={'cx-pz-cards' + (mini ? ' mini' : '')} role="group" aria-label="Prazos extintivos por providência">
    <div className="cx-pz-row1">{MESA_CARDS.filter(c => c.fileira === 1).map(one)}</div>
    <div className="cx-pz-row2">{MESA_CARDS.filter(c => c.fileira === 2).map(one)}</div>
  </div>;
}
/** Item da Mesa sem linha do radar (tratadas, adiadas, ordinária derivada, sem dados, parcelada). */
function CxMesaLite({ item, a, opName, personName, sil, clk, data }) {
  const d = item.debt;
  const mz = a.mz;
  const today = localIso(new Date());
  const li = mesaLiteInfo(item, sil, today);
  const rb = useCxMesaBar(item, clk, today);
  const fs = useCxFilingSim(item, clk, data, today);
  return <div className={'cx-mesa-row cx-mesa-lite' + (item.ajuizarLonge ? ' longe' : '') + (mz.sel.has(item.debtId) ? ' sel' : '')}>
    <div className="cx-mesa-main">
      <div className="cx-mesa-id">
        <MesaCk item={item} mz={mz} />
        <span className="cx-mono cx-mesa-cda">{d.cdaNumber || 'S/N'}</span>
        {li.chips.map((c, i) => <span key={i} className="cx-tag" title={i === 1 ? 'A ordinária só entra na lista de alarmes a até 90 dias do prazo; esta ainda está fora.' : undefined}>{c}</span>)}
      </div>
      <div className="cx-mesa-why">{li.why}{li.date ? ' · ' + li.date : ''}</div>
      {rb.bar}
      <div className="cx-mesa-meta">
        {rb.toggle}
        {opName ? <span className="cx-op-tag"><CxOpSquare opId={d.operationId} /><span className="cx-ell">{String(opName).replace(/^Opera[çc][ãa]o\s+/i, '')}</span></span> : null}
        {d.processNumber ? <CxProc num={d.processNumber} /> : <span className="cx-muted">sem processo</span>}
        {personName ? <span className="cx-ell cx-muted">{personName}</span> : null}
      </div>
    </div>
    <div className="cx-mesa-side">
      {li.when ? <span className={'cx-mesa-when txt' + (li.whenGray ? ' gray' : '')}>{li.when}</span> : null}
      <span className="cx-mesa-val">{fmtCur(item.value || 0)}</span>
    </div>
    <div className="cx-mesa-acts">
      <MesaActs item={item} mz={mz} ui="cx" extra={fs.btn} />
    </div>
    {fs.out}
    <MesaInline item={item} mz={mz} ui="cx" />
  </div>;
}
/* Painel de Filtros da Mesa (decisão 7): natureza, marcações, valor mínimo e exibição. Tudo em prazosFilters. */
function CxMesaPainel({ pf, setPf, cedoN, onClose, onClearAll }) {
  const min = Number(pf.minVal) || 0;
  const [txt, setTxt] = React.useState(() => formatMesaMinVal(min));
  React.useEffect(() => { if (parseMesaMinVal(txt) !== min) setTxt(formatMesaMinVal(min)); }, [min]);
  return <section className="cx-card cx-pz-painel" id="cx-pz-painel" aria-label="Filtros">
    <div className="cx-pz-pg"><span className="cx-pz-pl">Natureza</span>
      <CxSeg label="Natureza" value={pf.nat || ''} onChange={v => setPf({ nat: v })} options={[['', 'Todas'], ['ordinaria', 'Ordinária'], ['intercorrente', 'Intercorrente']]} />
      <span className="cx-pz-pdica">A decadência não entra nesta escolha: é só consulta.</span>
    </div>
    <div className="cx-pz-pg"><span className="cx-pz-pl">Marcações</span>
      <label className="cx-pz-ck"><input id="cx-pz-ck-cedo" type="checkbox" checked={!!pf.cedoTarde} onChange={e => setPf({ cedoTarde: e.target.checked })} /><span>Só «cedo venceu, tarde não» <span className="cx-n">{cedoN}</span></span></label>
      <label className="cx-pz-ck"><input id="cx-pz-ck-idpj" type="checkbox" checked={!!pf.idpj} onChange={e => setPf({ idpj: e.target.checked })} /><span>Só abrangidas por IDPJ ou cautelar</span></label>
    </div>
    <div className="cx-pz-pg"><span className="cx-pz-pl">Valor a partir de</span>
      <label className="cx-pz-valor"><span>R$</span><input id="cx-pz-val" className="cx-input cx-mono" type="text" inputMode="decimal" autoComplete="off" placeholder="ex.: 500.000 ou 1,5 mi" aria-label="Valor a partir de, em reais" value={txt} onChange={e => { setTxt(e.target.value); setPf({ minVal: parseMesaMinVal(e.target.value) }); }} /></label>
      <span className="cx-pz-pdica">Campo livre: some o que for menor que o valor da CDA.</span>
    </div>
    <div className="cx-pz-pg"><span className="cx-pz-pl">Exibição</span>
      <label className="cx-pz-ck"><input id="cx-pz-ck-juntar" type="checkbox" checked={!!pf.juntar} onChange={e => setPf({ juntar: e.target.checked })} /><span>Juntar CDAs por processo</span></label>
      <span className="cx-pz-pdica">Análise conjunta: agrupa as linhas de cada seção por processo. Os cartões continuam contando por CDA.</span>
    </div>
    <div className="cx-pz-painel-f">
      <button type="button" id="cx-pz-limpar-tudo" className="cx-btn sm ghost" onClick={() => (onClearAll ? onClearAll() : setPf(mesaClearAllPatch()))}>Limpar tudo</button>
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm primary" onClick={onClose}>Fechar</button>
    </div>
  </section>;
}
/* Tabela da Mesa (fase 4a): os MESMOS itens da Lista, em linhas densas. Cartões, filtros e calendário valem para as duas
   formas de exibição. Clicar na linha abre a ação principal da Lista (formulário na própria linha) ou a CDA. */
function CxMesaTr({ row, mz, xOpen, setXOpen }) {
  const it = row.item, id = it.debtId;
  const pa = mesaPrimaryAction(it);
  const r = it.row || { id, operationId: it.debt.operationId, processNumber: it.debt.processNumber, cdaNumber: it.debt.cdaNumber };
  const isOpen = (k) => !!(mz.open && mz.open.id === id && mz.open.kind === k);
  const expanded = xOpen === id || !!(mz.open && mz.open.id === id);
  const go = () => {
    if (!pa || pa.kind === 'conferir') { mz.openCda(r); return; }
    if (MESA_INLINE_KINDS.includes(pa.kind)) { mz.setOpen(isOpen(pa.kind) ? null : { id, kind: pa.kind }); return; }
    setXOpen(xOpen === id ? '' : id); // ação de um clique (Ainda vale, Reabrir…): mostra os botões, quem confirma é você
  };
  const onClick = (e) => { if (e.target.closest && e.target.closest('a,button,input,label,select')) return; go(); };
  return <>
    <tr className={'cx-pz-tr' + (mz.sel.has(id) ? ' sel' : '') + (expanded ? ' open' : '')} data-cda={id} tabIndex={0} aria-expanded={expanded} onClick={onClick}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); go(); } }}>
      <td className="ck"><MesaCk item={it} mz={mz} /></td>
      <td className="c-card"><span className="cx-pz-tdot" style={{ background: cxCardColor(it) }} aria-hidden="true" /><span className="nm">{row.cardName}</span></td>
      <td className="c-cda cx-mono"><span className="cx-pz-tdot m" style={{ background: cxCardColor(it) }} title={row.cardName} aria-hidden="true" />{row.cda}</td>
      <td className="c-devedor"><span className="cx-ell" title={row.devedor}>{row.devedor || '—'}</span></td>
      <td className="c-processo">{row.processo ? <CxProc num={row.processo} /> : <span className="cx-muted">sem processo</span>}</td>
      <td className="c-operacao"><span className="cx-ell" title={row.operacao}>{String(row.operacao).replace(/^Opera[çc][ãa]o\s+/i, '') || '—'}</span></td>
      <td className="c-natureza">{row.natureza ? <span title={row.natureza}><span className="full">{row.natureza}</span><span className="abb">{row.natureza === 'Intercorrente' ? 'Interc.' : 'Ord.'}</span></span> : <span className="cx-muted">—</span>}</td>
      <td className="c-clock"><span className={'t' + (row.clockGray ? ' gray' : '')}>{row.clockText || '—'}</span>{row.clockDate ? <span className="d">{row.clockDate}</span> : null}</td>
      <td className="c-valor" title={fmtCur(row.valor)}><span className="full">{fmtCur(row.valor)}</span><span className="abb">{cxMoneyShort(row.valor)}</span></td>
      <td className="c-situacao"><span className="cx-ell" title={row.situacao}>{row.situacao}</span></td>
    </tr>
    {expanded ? <tr className="cx-pz-trx"><td colSpan={10}>
      <div className="cx-mesa-acts"><MesaActs item={it} mz={mz} ui="cx" /></div>
      <MesaInline item={it} mz={mz} ui="cx" />
    </td></tr> : null}
  </>;
}
function CxMesaTable({ groups, groupBy, lim, onMore, sort, onSort, mz, allIds }) {
  const [xOpen, setXOpen] = React.useState('');
  const selN = allIds.filter(id => mz.sel.has(id)).length;
  const allSel = allIds.length > 0 && selN === allIds.length;
  let shown = 0;
  const body = [];
  groups.forEach(g => {
    if (shown >= lim) return;
    const rows = g.rows.slice(0, lim - shown);
    shown += rows.length;
    if (groupBy) {
      const ids = g.rows.map(r => r.id);
      const gn = ids.filter(id => mz.sel.has(id)).length;
      body.push(<tr key={'g' + g.key + g.label} className="cx-pz-tgh"><td colSpan={10}>
        <label className="cx-pz-tgl"><input type="checkbox" className="mzf-ck" checked={ids.length > 0 && gn === ids.length} ref={el => { if (el) el.indeterminate = gn > 0 && gn < ids.length; }} onChange={e => mz.selMany(ids, e.target.checked)} aria-label={'Selecionar o grupo ' + g.label} />
          <b>{g.label}</b></label>
        <span className="cx-pz-tgs" data-n={g.n}>{mesaCdaCount(g.n)} · {fmtCur(g.value)}</span>
      </td></tr>);
    }
    rows.forEach(r => body.push(<CxMesaTr key={r.id} row={r} mz={mz} xOpen={xOpen} setXOpen={setXOpen} />));
  });
  const total = groups.reduce((s, g) => s + g.rows.length, 0);
  return <section className="cx-card cx-pz-tb-card" id="cx-pz-tabela" aria-label="Tabela de CDAs">
    <div className="cx-pz-tb-wrap">
      <table className="cx-pz-tb">
        <thead><tr>
          <th className="ck"><input type="checkbox" className="mzf-ck" id="cx-pz-tb-all" checked={allSel} ref={el => { if (el) el.indeterminate = selN > 0 && !allSel; }} onChange={e => mz.selMany(allIds, e.target.checked)} aria-label={'Selecionar as ' + allIds.length + ' CDAs da tabela'} /></th>
          {MESA_TABLE_COLS.map(c => <th key={c.k} className={'c-' + c.k + (c.k === 'valor' ? ' r' : '')} aria-sort={sort.k === c.k ? (sort.d === 'desc' ? 'descending' : 'ascending') : 'none'}>
            <button type="button" data-sort={c.k} onClick={() => onSort(c.k)} title={'Ordenar por ' + c.label.toLowerCase()}>{c.label}<span className="ar" aria-hidden="true">{sort.k === c.k ? (sort.d === 'desc' ? '▼' : '▲') : ''}</span></button>
          </th>)}
        </tr></thead>
        <tbody>{body}</tbody>
      </table>
    </div>
    {total > shown ? <button type="button" className="cx-pz-more" onClick={onMore}>Mostrar mais {Math.min(CX_PZ_PAGE, total - shown)} de {total - shown} restantes<CxIcon n="chevD" s={13} /></button> : null}
  </section>;
}
function EditionClaudePrazos(p) {
  const { data, prazosRadar, pf, setPf, a } = p;
  /* Uma só página. Exibir: Lista (seções por cartão) ou Tabela (os mesmos itens em linhas densas) — só muda o layout; cartões,
     filtros e calendário valem para as duas. Lembrado neste navegador. */
  const [exib, setExibS] = React.useState(() => (cxLs('nexus_cx_prazos_exib', 'lista') === 'tabela' ? 'tabela' : 'lista'));
  const setExib = (v) => { setExibS(v); cxLsSet('nexus_cx_prazos_exib', v); };
  const [calOpen, setCalOpenS] = React.useState(() => cxLs('nexus_cx_prazos_cal', '0') === '1');
  const setCalOpen = (v) => { setCalOpenS(v); cxLsSet('nexus_cx_prazos_cal', v ? '1' : '0'); };
  const [calSel, setCalSel] = React.useState(null);
  const [tSort, setTSort] = React.useState({ k: '', d: 'asc' });
  const [tGroup, setTGroup] = React.useState('');
  const [tLim, setTLim] = React.useState(CX_PZ_PAGE * 2);
  const [sec, setSec] = React.useState(p.initialSec || '');
  React.useEffect(() => { if (p.initialSec && p.onInitialSecConsumed) p.onInitialSecConsumed(); }, []);
  const [openMap, setOpenMap] = React.useState({});
  const [limMap, setLimMap] = React.useState({});
  const [painel, setPainel] = React.useState(false);
  const join = !!pf.juntar;
  const today = localIso(new Date());
  const opsOpen = (data.operations || []).filter(o => o.status !== 'encerrada').slice().sort(sortOpsByName);
  const mc = React.useMemo(() => p.mesaCards || buildMesaCards({ data, radar: prazosRadar, prescLookup: a.presc, today }), [p.mesaCards, data, prazosRadar, a.presc, today]);
  const peopleById = React.useMemo(() => new Map((data.people || []).map(x => [x.id, x])), [data.people]);
  const opsById = React.useMemo(() => new Map((data.operations || []).map(o => [o.id, o])), [data.operations]);
  const silById = React.useMemo(() => { const m = new Map(); (prazosRadar.silenced || []).forEach(x => { if (x && x.debtId && !m.has(x.debtId)) m.set(x.debtId, x); }); return m; }, [prazosRadar.silenced]);
  const personOf = (d) => ((peopleById.get(d.personId) || {}).name) || d.devedor || '';
  const opNameOf = (id) => { const o = opsById.get(id); return o ? cxOpName(o) : ''; };
  // Um só filtro (filterMesaItems) para cartões e listas: operação, pessoa, busca, natureza, marcações e valor.
  // fl0 = o universo filtrado (também alimenta o calendário e as réguas); a faixa escolhida no calendário (calSel) refina fl0 em fl,
  // e os totais dos cartões são refeitos a partir dos itens que passam.
  const fctx = { personIds: (pf.personId && pf.personId !== 'all') ? cdaIdsForPerson(data.links && data.links.cdaResponsibilities, pf.personId) : null, personOf, opNameOf: (id) => { const o = opsById.get(id); return (o && o.name) || ''; }, prescLookup: a.presc };
  const fl0 = React.useMemo(() => filterMesaCards(mc, pf, fctx), [mc, pf, peopleById, opsById, data.links, a.presc]);
  // Calendário dos termos: mesma posição da Mesa para cada CDA.
  const calBins = React.useMemo(() => mesaCalBins(fl0.items, today), [fl0, today]);
  const calCells = React.useMemo(() => clkCalCells(calBins.cal), [calBins]);
  const calNext = React.useMemo(() => clkNextDates(calBins.points, today, 3), [calBins, today]);
  React.useEffect(() => { if (calSel && !calCells.has(calSel)) setCalSel(null); }, [calCells, calSel]);
  const selCell = calSel ? calCells.get(calSel) || null : null;
  const fl = React.useMemo(() => (selCell ? mesaFilterByCal(fl0, selCell.bucket, today) : fl0), [fl0, selCell, today]);
  const by = fl.by, tot = fl.totals;
  // Réguas: um clkBuild para o universo filtrado, mapeado por id de CDA (uma linha de relógio junta as CDAs do mesmo processo).
  const clkMap = React.useMemo(() => {
    if (exib !== 'lista') return new Map();
    const ids = new Set(fl0.items.map(i => i.debtId));
    try { return clkByCda(clkBuild({ data, rows: prazosRadar.rows || [], silenced: prazosRadar.silenced || [], lookup: a.presc, today, opId: '', debtIds: ids }).clocks); } catch (e) { return new Map(); }
  }, [exib, fl0, data, prazosRadar, a.presc, today]);
  // Decadência (decisão 8): mesmo universo (operação, pessoa, busca, valor); natureza, marcações e calendário não se aplicam.
  const decaDec = sec ? null : mesaDecadenciaItems({ items: filterMesaItems(mc.items, { ...pf, nat: '', cedoTarde: false, idpj: false }, fctx), today });
  const cedoN = painel ? mesaCedoCount(mc, pf, fctx) : 0;
  const chips = mesaActiveFilters(pf, { opName: pf.operationId && opsById.get(pf.operationId) ? cxOpName(opsById.get(pf.operationId)) : '', personName: (peopleById.get(pf.personId) || {}).name });
  const nPanel = chips.filter(c => c.panel).length;
  const hasCut = mesaHasCut(pf) || !!selCell;
  const clearAll = () => { setPf(mesaClearAllPatch()); setCalSel(null); };
  const notesByProc = new Map();
  (prazosRadar.processNotes || []).forEach(n => { const k = normProc(n.processNumber); if (!k) return; if (!notesByProc.has(k)) notesByProc.set(k, []); notesByProc.get(k).push(n); });
  const isOpen = (c) => sec === c.id || (sec === '' && (openMap[c.id] != null ? openMap[c.id] : c.fileira === 1));
  const toggleOpen = (c) => setOpenMap(m => ({ ...m, [c.id]: !isOpen(c) }));
  const pick = (id) => setSec(cur => cur === id ? '' : id);
  const card = (c) => <CxMesaCard key={c.id} c={c} t={tot[c.id]} on={sec === c.id} disabled={by[c.id].length === 0 && sec !== c.id} onClick={() => pick(c.id)} />;
  const hasLine = (it) => !!it.row && it.card !== 'tratadas';
  const renderItem = (it) => hasLine(it)
    ? <CxMesaRow key={it.debtId} r={it.row} debt={it.debt} a={a} item={it} clk={clkMap.get(it.debtId)} data={data} />
    : <CxMesaLite key={it.debtId} item={it} a={a} opName={opNameOf(it.debt.operationId)} personName={personOf(it.debt)} sil={silById.get(it.debtId)} clk={clkMap.get(it.debtId)} data={data} />;
  const renderList = (list) => {
    if (!join) return list.map(renderItem);
    const withRow = list.filter(hasLine), byId = new Map(withRow.map(it => [it.debtId, it]));
    return cxMesaGroups(withRow.map(it => it.row), notesByProc, r => renderItem(byId.get(r.id))).concat(list.filter(it => !hasLine(it)).map(renderItem));
  };
  const section = (c) => {
    const list = by[c.id];
    if (!list.length || (sec && sec !== c.id)) return null;
    const t = tot[c.id], open = isOpen(c), lim = limMap[c.id] || CX_PZ_PAGE;
    const shown = list.slice(0, lim);
    const sumV = t.value + t.valueLonge;
    const principal = c.id === 'ajuizar' ? shown.filter(it => !it.ajuizarLonge) : shown;
    const longeL = c.id === 'ajuizar' ? shown.filter(it => it.ajuizarLonge) : [];
    return <section key={c.id} className="cx-card cx-pz-block" id={'cx-pz-sec-' + c.id}>
      <button type="button" className="cx-pz-fold" onClick={() => toggleOpen(c)} aria-expanded={open} title={c.tip}>
        <span className="cx-caret" style={{ transform: open ? 'none' : 'rotate(-90deg)' }}><CxIcon n="chevD" s={14} /></span>
        <b>{c.nome}</b><span className="cx-n">{list.length}</span>
        <span className="cx-pz-fold-s">{cxMoneyShort(sumV)}{c.id === 'ajuizar' && t.nLonge ? ' · +' + t.nLonge + ' entre 60 e 180 dias' : ''}</span>
      </button>
      {open ? <>
        <MesaSecBar items={list} mz={a.mz} />
        {renderList(principal)}
        {longeL.length ? <div className="cx-pz-gh longe">Entre 60 e 180 dias<span className="cx-n">{t.nLonge}</span></div> : null}
        {longeL.length ? renderList(longeL) : null}
        {list.length > lim ? <button type="button" className="cx-pz-more" onClick={() => setLimMap(m => ({ ...m, [c.id]: lim + CX_PZ_PAGE }))}>Mostrar mais {Math.min(CX_PZ_PAGE, list.length - lim)} de {list.length - lim} restantes<CxIcon n="chevD" s={13} /></button> : null}
      </> : null}
    </section>;
  };
  // Tabela: os mesmos itens (fl), na ordem da Lista; ordenação por coluna, agrupar por e CSV valem para o que está visível.
  const tableOn = exib === 'tabela';
  const tItems = React.useMemo(() => (tableOn ? mesaListOrder(sec ? { [sec]: fl.by[sec] || [] } : fl.by) : []), [tableOn, fl, sec]);
  const tRows = React.useMemo(() => (tableOn ? mesaTableRows(tItems, { today, opNameOf, personOf, silOf: (id) => silById.get(id), prescLookup: a.presc }) : []), [tableOn, tItems, silById, a.presc, today, peopleById, opsById]);
  const tGroups = React.useMemo(() => mesaTableGroups(mesaTableSort(tRows, tSort.k, tSort.d), tGroup), [tRows, tSort, tGroup]);
  const tAllIds = React.useMemo(() => tGroups.flatMap(g => g.rows.map(r => r.id)), [tGroups]);
  const onSort = (k) => { setTSort(cur => (cur.k !== k ? { k, d: 'asc' } : cur.d === 'asc' ? { k, d: 'desc' } : { k: '', d: 'asc' })); setTLim(CX_PZ_PAGE * 2); };
  const exportCsv = () => {
    const rows = tGroups.flatMap(g => g.rows);
    const blob = new Blob([mesaTableCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'prazos-extintivos-' + today + '.csv';
    document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const anyItem = MESA_CARDS.some(c => by[c.id].length);
  const head = <div className="cx-page-h">
      <div><h1>Prazos extintivos</h1><p>Cada CDA aparece uma só vez, na seção da providência que ela pede. Clique num cartão para ver só aquela seção; clique de novo para voltar a todas.</p></div>
      <div className="cx-acts">
        <button type="button" className="cx-btn ghost" onClick={p.onOpenRules}><CxIcon n="book" s={14} />Regras</button>
      </div>
    </div>;
  const calLegend = <div className="cx-cal-leg" aria-hidden="true">
    <span><CxTlGlyph kind="presc" c="var(--cx-ink-2)" s={13} />termo</span>
    <span><CxTlGlyph kind="presc" c="var(--cx-ink-2)" hollow s={13} />piso (não antes de)</span>
    <span className="sep" />
    <span><i style={{ '--c': 'var(--cx-red)' }} />Ajuizar</span>
    <span><i style={{ '--c': 'var(--cx-orange)' }} />Conferir o cálculo · Lançar fato</span>
    <span><i style={{ '--c': 'var(--cx-blue)' }} />Confirmar vigência</span>
    <span><i style={{ '--c': 'var(--cx-ink-3)' }} />demais</span>
  </div>;
  return <div className={'cx cx-page' + (tableOn ? ' cx-page-wide' : '')}>
    {head}
    <div className="cx-pz-cards" role="group" aria-label="Seções da Mesa de prazos">
      <div className="cx-pz-row1">{MESA_CARDS.filter(c => c.fileira === 1).map(card)}</div>
      <div className="cx-pz-row2">{MESA_CARDS.filter(c => c.fileira === 2).map(card)}</div>
    </div>
    <div className="cx-toolbar">
      <CxSelect id="cx-pz-op" pre="Operação" value={pf.operationId || ''} onChange={v => setPf({ operationId: v, personId: 'all' })} options={[['', 'Todas']].concat(opsOpen.map(o => [o.id, cxOpName(o)]))} />
      <button type="button" id="cx-pz-fbtn" className={'cx-btn cx-pz-fbtn' + (painel ? ' open' : '')} aria-expanded={painel} aria-controls="cx-pz-painel" onClick={() => setPainel(v => !v)}><CxIcon n="filter" s={14} />Filtros{nPanel ? <span className="cx-pz-fn">{nPanel}</span> : null}</button>
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-pz-q" value={pf.q || ''} onChange={e => setPf({ q: e.target.value })} placeholder="CDA, processo ou devedor" aria-label="Buscar CDA, processo ou devedor" /></label>
    </div>
    {pf.operationId ? <div className="cx-pz-people"><PersonSubtabs data={data} opId={pf.operationId} currentFilter={pf.personId || 'all'} onChange={id => setPf({ personId: id })} mode="cda" /></div> : null}
    {painel ? <CxMesaPainel pf={pf} setPf={setPf} cedoN={cedoN} onClose={() => setPainel(false)} onClearAll={clearAll} /> : null}
    {chips.length || selCell ? <div className="cx-pz-chips" id="cx-pz-chips" aria-live="polite">
      {chips.map(c => <span key={c.k} className="cx-pz-fc"><span title={c.t}>{c.t}</span><button type="button" data-chip={c.k} onClick={() => setPf(mesaRemovePatch(c.k))} aria-label={'Remover filtro: ' + c.t}>&times;</button></span>)}
      {selCell ? <span className="cx-pz-fc"><span title={'Calendário: ' + selCell.short}>Calendário: {selCell.short}</span><button type="button" data-chip="cal" onClick={() => setCalSel(null)} aria-label={'Remover filtro: Calendário: ' + selCell.short}>&times;</button></span> : null}
    </div> : null}
    {hasCut ? <div className="cx-pz-mostrando" id="cx-pz-mostrando">Mostrando <b>{fl.n}</b> de <b>{mc.items.length}</b> CDAs<span className="cx-sp" /><button type="button" className="cx-btn sm ghost" id="cx-pz-limpar" onClick={clearAll}>Limpar</button></div> : null}
    <CxTermCalendar cal={calBins.cal} cells={calCells} sel={calSel} onPick={k => setCalSel(prev => (prev === k ? null : k))} onClear={() => setCalSel(null)} next={calNext} variant="mesa" noun="a lista"
      collapsible open={calOpen} onToggle={() => setCalOpen(!calOpen)} legend={calLegend} emptyText="Nenhuma CDA com data de termo ou piso neste recorte."
      cellClass={x => (x.lane === 'piso' ? 'm-piso' : 'm-' + mesaCalTone(x.cell.group))} />
    <div className="cx-pz-exib" id="cx-pz-exib">
      <span className="cx-pz-pl">Exibir</span>
      <CxSeg label="Exibir" value={exib} onChange={setExib} options={[['lista', 'Lista'], ['tabela', 'Tabela']]} />
      {tableOn ? <>
        <CxSelect id="cx-pz-grp" pre="Agrupar por" value={tGroup} onChange={v => { setTGroup(v); setTLim(CX_PZ_PAGE * 2); }} options={MESA_GROUP_BYS} />
        {tSort.k ? <button type="button" className="cx-btn sm ghost" id="cx-pz-ordem" onClick={() => setTSort({ k: '', d: 'asc' })}>Ordem da Mesa</button> : null}
        <span className="cx-sp" />
        <button type="button" className="cx-btn sm" id="cx-pz-csv" onClick={exportCsv} disabled={!tAllIds.length}><CxIcon n="download" s={13} />Exportar CSV</button>
      </> : null}
    </div>

    <MesaFeitoStrip mz={a.mz} ui="cx" />
    {tableOn
      ? (tAllIds.length ? <>
        <p className="cx-pz-tb-sum" id="cx-pz-tb-sum"><b>{tAllIds.length}</b> {tAllIds.length === 1 ? 'CDA' : 'CDAs'} · {fmtCur(tRows.reduce((s, r) => s + r.valor, 0))}{sec ? ' · só «' + mesaCardName(sec) + '»' : ''}</p>
        <CxMesaTable groups={tGroups} groupBy={tGroup} lim={tLim} onMore={() => setTLim(v => v + CX_PZ_PAGE)} sort={tSort} onSort={onSort} mz={a.mz} allIds={tAllIds} />
      </> : null)
      : MESA_CARDS.map(section)}
    {!anyItem || (sec && !by[sec].length) ? <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma CDA neste recorte.</div></div> : null}
    {!sec ? <MesaDecadencia dec={decaDec} mz={a.mz} ui="cx" opNameOf={opNameOf} personOf={personOf} /> : null}
    <MesaBatchBar items={fl.items.filter(it => a.mz.sel.has(it.debtId))} mz={a.mz} ui="cx" />

    <div className="cx-pz-legend">
      <span><span className="cx-cert calculado">Calculado</span>{CX_CERT_TIP.calculado}</span>
      <span><span className="cx-cert estimado">Estimado</span>{CX_CERT_TIP.estimado}</span>
      <span><span className="cx-cert cadastro">Cadastro</span>{CX_CERT_TIP.cadastro}</span>
      <span><span className="cx-cert faixa">Cedo–tarde</span>{CX_CERT_TIP.faixa}</span>
      <span><span className="cx-cert dado">Falta dado</span>{CX_CERT_TIP.dado}</span>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 3 — Tarefas, Agenda e Mesa de trabalho.
   Gravações só pelas funções do app, recebidas por props (upsert, handleSave,
   toggleDesk, removeFromDesk, reorderDeskInColumn). Edição completa continua
   nos formulários do app (setModal).
   ═══════════════════════════════════════════════════════════════════════════ */
const CX_PRIO_ORDER = { urgente: 0, alta: 1, media: 2, baixa: 3 };
const CX_TASK_ST_ORDER = ['pendente', 'em_andamento', 'concluida'];
const CX_TASK_ST = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' };
/* Sub-estados que o histórico (← Voltar) trata como "outra tela": modo da Linha do tempo, visão dos Prazos extintivos
   e visão das Inscrições. Cada um já vive em localStorage (lido ao montar o componente). Para o histórico poder
   observá-los e restaurá-los sem levantar estado, os setters passam por cxLsSet, que mantém um espelho em memória
   (vale mesmo sem localStorage) e avisa o app com o evento 'nexus-cx-nav'; cxLs lê o espelho antes do storage. */
const CX_NAV_KEYS = { nexus_cx_tl_mode: 1, nexus_cx_insc_view: 1 };
const cxNavMirror = {};
function cxLs(k, d) {
  if (CX_NAV_KEYS[k] && cxNavMirror[k]) return cxNavMirror[k];
  try { return localStorage.getItem(k) || d; } catch (e) { return d; }
}
function cxLsSet(k, v) {
  if (CX_NAV_KEYS[k]) {
    const changed = cxNavMirror[k] !== v;
    cxNavMirror[k] = v;
    if (changed) { try { window.dispatchEvent(new Event('nexus-cx-nav')); } catch (e) { /* ignore */ } }
  }
  try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
}
function cxTaskNotes(t) { return Array.isArray(t.notesList) ? t.notesList : (t.notes ? [t.notes] : []); }
/* Mesma regra da tela clássica: sem operação, global ou legado aparecem na lista geral; "interna" fica só na operação. */
function cxTaskIsGlobal(t) { return !t.operationId || t.taskVisibility !== 'operation'; }
const cxTaskOpen = (t) => t.status !== 'concluida' && t.status !== 'cancelada';
function cxTaskSort(a, b) {
  const pa = CX_PRIO_ORDER[a.priority] ?? 2, pb = CX_PRIO_ORDER[b.priority] ?? 2;
  if (pa !== pb) return pa - pb;
  if (a.dueDate && b.dueDate) return String(a.dueDate).localeCompare(String(b.dueDate));
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR');
}
function cxDeskBtn(on, onClick) {
  return <button type="button" className={'cx-desk-btn' + (on ? ' on' : '')} aria-pressed={on} title={on ? 'Tirar da Mesa' : 'Enviar para a Mesa'} onClick={e => { e.stopPropagation(); onClick(); }}><CxIcon n="desk" s={12} />{on ? 'na mesa' : 'Mesa'}</button>;
}

/* ═════════════════════ Tarefas ═════════════════════ */
function CxTaskRow({ t, op, onOpen, onToggle, onOpenOp, deskOn, onDesk }) {
  const notes = cxTaskNotes(t);
  const done = t.status === 'concluida' || t.status === 'cancelada';
  const urgent = t.priority === 'urgente' && !done;
  return <div className={'cx-t-row' + (done ? ' done' : '') + (urgent ? ' urgent' : '')} role="button" tabIndex={0}
    onClick={() => onOpen(t)} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(t); }}>
    <button type="button" className={'cx-tcheck' + (t.status === 'concluida' ? ' on' : '')} title={t.status === 'concluida' ? 'Reabrir' : 'Concluir'} aria-label={t.status === 'concluida' ? 'Reabrir tarefa' : 'Concluir tarefa'}
      onClick={e => { e.stopPropagation(); onToggle(t); }}>{t.status === 'concluida' ? <CxIcon n="tick" s={11} /> : null}</button>
    <div className="cx-i-main">
      <div className="cx-t-title">
        {urgent ? <span className="cx-urg">URGENTE</span> : null}
        <span className="cx-ell">{t.title || 'Tarefa sem título'}</span>
        {t.status === 'em_andamento' ? <span className="cx-tag yellow">em andamento</span> : null}
        {t.status === 'cancelada' ? <span className="cx-tag">cancelada</span> : null}
        {!cxTaskIsGlobal(t) ? <span className="cx-tag" title="Tarefa interna: na lista clássica aparece só na operação">interna</span> : null}
      </div>
      {t.description ? <div className="cx-i-ev" title={t.description}>{t.description}</div> : null}
      {notes.length ? <div className="cx-i-note" title={notes.join('\n')}><CxIcon n="note" s={12} /><span className="cx-ell">{notes[notes.length - 1]}</span>{notes.length > 1 ? <span className="cx-mono">+{notes.length - 1}</span> : null}</div> : null}
      <CxEstLine esteira={t.esteira} />
      <div className="cx-i-sub"><CxOpTag op={op} /><CxPrio v={t.priority} />{t.processNumber ? <CxProc num={t.processNumber} /> : null}</div>
    </div>
    <div className="cx-c-proc">{op ? <CxOpTag op={op} onOpen={onOpenOp} /> : <span className="cx-op-tag cx-muted">Avulsa</span>}{t.processNumber ? <CxProc num={t.processNumber} /> : null}</div>
    <div className="cx-c-imp"><CxPrio v={t.priority} /></div>
    <div className="cx-t-acts">
      {t.docUrl ? <a className="cx-icon-btn cx-sm" href={t.docUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Abrir documento" aria-label="Abrir documento"><CxIcon n="file" s={13} /></a> : null}
      {done ? null : cxDeskBtn(deskOn, onDesk)}
    </div>
    <div className="cx-c-due">
      {t.status === 'concluida' ? <span className="cx-due done">✓ {t.completedAt || t.updatedAt ? cxDM(t.completedAt || t.updatedAt) : ''}</span> : <CxDue iso={t.dueDate} />}
      <span className="cx-sub">{t.status === 'concluida' ? 'concluída' : t.dueDate ? 'limite ' + cxDM(t.dueDate) : 'sem data'}</span>
    </div>
  </div>;
}
function cxGroupTasks(items, by, opsById) {
  const dot = (c) => <span className="cx-dot" style={{ background: c }} />;
  if (by === 'operacao') {
    const ids = [];
    items.forEach(t => { const k = t.operationId || ''; if (!ids.includes(k)) ids.push(k); });
    return ids.map(id => { const op = opsById.get(id); return { key: 'op' + id, label: op ? cxOpName(op) : 'Avulsas (sem operação)', sortKey: op ? cxOpName(op) : '￿', icon: op ? <CxOpSquare op={op} /> : dot('var(--cx-line-strong)'), items: items.filter(t => (t.operationId || '') === id) }; })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'pt-BR'));
  }
  if (by === 'prioridade') {
    return ['urgente', 'alta', 'media', 'baixa'].map(k => ({ key: 'p' + k, label: TASK_PRIORITIES[k].label, icon: <CxPrio v={k} />, items: items.filter(t => (CX_PRIO_ORDER[t.priority] != null ? t.priority : 'media') === k) })).filter(g => g.items.length);
  }
  const dd = (t) => daysUntil(t.dueDate);
  return [
    { key: 'late', label: 'Atrasadas', icon: dot('var(--cx-red)'), items: items.filter(t => { const d = dd(t); return d !== null && d < 0; }) },
    { key: 'today', label: 'Hoje', icon: dot('var(--cx-orange)'), items: items.filter(t => dd(t) === 0) },
    { key: 'week', label: 'Próximos 7 dias', icon: dot('var(--cx-yellow)'), items: items.filter(t => { const d = dd(t); return d !== null && d >= 1 && d <= 7; }) },
    { key: 'later', label: 'Mais adiante', icon: dot('var(--cx-ink-3)'), items: items.filter(t => { const d = dd(t); return d !== null && d > 7; }) },
    { key: 'none', label: 'Sem data limite', icon: dot('var(--cx-line-strong)'), items: items.filter(t => dd(t) === null) },
  ].filter(g => g.items.length);
}
function CxTaskBoard({ items, done, opsById, onOpen, onSetStatus }) {
  const [over, setOver] = React.useState(null);
  return <div className="cx-board cx-board-3">{CX_TASK_ST_ORDER.map(s => {
    const col = s === 'concluida' ? done.slice(0, 20) : items.filter(t => (t.status || 'pendente') === s).sort(cxTaskSort);
    const n = s === 'concluida' ? done.length : col.length;
    return <div key={s} className={'cx-b-col' + (over === s ? ' over' : '')}
      onDragOver={e => { e.preventDefault(); if (over !== s) setOver(s); }}
      onDragLeave={() => setOver(o => (o === s ? null : o))}
      onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) onSetStatus(id, s); }}>
      <div className="cx-b-h"><span className="cx-dot" style={{ background: s === 'pendente' ? 'var(--cx-ink-3)' : s === 'em_andamento' ? 'var(--cx-yellow)' : 'var(--cx-green)' }} />{CX_TASK_ST[s]}<span className="cx-n">{n}</span></div>
      <div className="cx-b-list">{col.length ? col.map(t => {
        const notes = cxTaskNotes(t);
        return <button key={t.id} type="button" className={'cx-b-card' + (s === 'concluida' ? ' cx-b-done' : '')} draggable onDragStart={e => e.dataTransfer.setData('text/plain', t.id)} onClick={() => onOpen(t)}>
          <span className="cx-b-row"><CxOpTag op={opsById.get(t.operationId)} />{s === 'concluida' ? null : <CxDue iso={t.dueDate} />}</span>
          <span className="cx-b-row" style={{ fontWeight: 500 }}>{t.priority === 'urgente' && s !== 'concluida' ? <span className="cx-urg">URGENTE</span> : null}<span className="cx-ell">{t.title || 'Tarefa'}</span></span>
          {t.description ? <span className="cx-b-ev">{t.description}</span> : null}
          {notes.length ? <span className="cx-b-nt">{notes[notes.length - 1]}</span> : null}
          <span className="cx-b-row">{t.processNumber ? <CxProc num={t.processNumber} /> : <span className="cx-muted cx-small">sem processo</span>}<span className="cx-b-glyphs"><CxPrio v={t.priority} /></span></span>
        </button>;
      }) : <div className="cx-b-empty">Arraste uma tarefa para cá</div>}</div>
    </div>;
  })}</div>;
}
function EditionClaudeTarefas(p) {
  const { data, opsById } = p;
  const [scope, setScopeS] = React.useState(() => cxLs('nexus_cx_task_scope', 'globais'));
  const [view, setViewS] = React.useState(() => cxLs('nexus_cx_task_view', 'lista'));
  const [groupBy, setGroupByS] = React.useState(() => cxLs('nexus_cx_task_group', 'prazo'));
  const setScope = (v) => { setScopeS(v); cxLsSet('nexus_cx_task_scope', v); };
  const setView = (v) => { setViewS(v); cxLsSet('nexus_cx_task_view', v); };
  const setGroupBy = (v) => { setGroupByS(v); cxLsSet('nexus_cx_task_group', v); };
  const [q, setQ] = React.useState('');
  const [opFRaw, setOpF] = React.useState('all');
  const [closed, setClosed] = React.useState({ done: true });
  const [draft, setDraft] = React.useState({ title: '', dueDate: '', priority: 'media', operationId: '' });
  const all = data.tasks || [];
  const opF = (opFRaw === 'all' || opFRaw === 'none' || (opsById.has(opFRaw) && all.some(x => x.operationId === opFRaw))) ? opFRaw : 'all';
  const inScope = all.filter(t => scope === 'todas' || cxTaskIsGlobal(t));
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  const filtered = inScope.filter(t => {
    if (opF === 'none' ? !!t.operationId : opF !== 'all' && t.operationId !== opF) return false;
    if (!toks.length) return true;
    const hay = cxNorm([t.title, t.description, t.processNumber, (opsById.get(t.operationId) || {}).name, cxTaskNotes(t).join(' ')].join(' '));
    return toks.every(tk => hay.includes(tk));
  });
  const open = filtered.filter(cxTaskOpen);
  const done = filtered.filter(t => t.status === 'concluida').sort((a, b) => String(b.completedAt || b.updatedAt || '').localeCompare(String(a.completedAt || a.updatedAt || '')));
  const openAll = inScope.filter(cxTaskOpen);
  const late = openAll.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d < 0; }).length;
  const week = openAll.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d >= 0 && d <= 7; }).length;
  const hidden = all.filter(t => cxTaskOpen(t) && !cxTaskIsGlobal(t)).length;
  const opIds = [...new Set(all.map(t => t.operationId).filter(Boolean))];
  const opOptions = [['all', 'Todas'], ['none', 'Avulsas']].concat(opIds.map(id => opsById.get(id)).filter(Boolean).sort(sortOpsByName).map(o => [o.id, cxOpName(o)]));
  const opsOpen = (data.operations || []).filter(o => o.status !== 'encerrada').slice().sort(sortOpsByName);
  const groups = cxGroupTasks(open, groupBy, opsById);
  const toggle = (t) => { const next = t.status === 'concluida' ? 'pendente' : 'concluida'; p.upsert('tasks', { ...t, status: next }); cxNotify(next === 'concluida' ? 'Tarefa concluída' : 'Tarefa reaberta'); };
  const addTask = (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    p.onCreate({ title, dueDate: draft.dueDate || '', priority: draft.priority, operationId: draft.operationId || '' });
    setDraft({ ...draft, title: '', dueDate: '' });
  };
  const row = (t) => <CxTaskRow key={t.id} t={t} op={opsById.get(t.operationId)} onOpen={p.onOpenTask} onToggle={toggle} onOpenOp={p.onOpenOp} deskOn={p.isOnDesk('task', t.id)} onDesk={() => p.toggleDesk('task', t.id, daysUntil(t.dueDate))} />;
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Tarefas</h1><p>{cxPl(openAll.length, 'aberta', 'abertas')}{late ? ', ' + cxPl(late, 'atrasada', 'atrasadas') : ''}{week ? ', ' + week + ' para os próximos 7 dias' : ''}. {scope === 'globais' && hidden ? cxPl(hidden, 'tarefa interna fica', 'tarefas internas ficam') + ' só na operação.' : 'Ordem: prioridade, depois data limite.'}</p></div>
      <div className="cx-acts">
        <button type="button" className="cx-btn" onClick={p.onNewTask}><CxIcon n="plus" s={14} />Tarefa completa</button>
        <CxSeg className="lg" label="Visualização" value={view} onChange={setView} options={[['lista', 'Lista', 'list'], ['quadro', 'Quadro', 'board']]} />
      </div>
    </div>
    <form className="cx-quick" onSubmit={addTask}>
      <CxIcon n="plus" s={15} className="cx-muted" />
      <input id="cx-task-new" className="cx-quick-t" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Nova tarefa: escreva e tecle Enter" aria-label="Título da nova tarefa" />
      <input id="cx-task-new-d" type="date" className="cx-input cx-quick-d" value={draft.dueDate} onChange={e => setDraft({ ...draft, dueDate: e.target.value })} aria-label="Data limite" title="Data limite (opcional)" />
      <select id="cx-task-new-p" className="cx-input cx-quick-p" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value })} aria-label="Prioridade">{Object.keys(TASK_PRIORITIES).map(k => <option key={k} value={k}>{TASK_PRIORITIES[k].label}</option>)}</select>
      <select id="cx-task-new-o" className="cx-input cx-quick-o" value={draft.operationId} onChange={e => setDraft({ ...draft, operationId: e.target.value })} aria-label="Operação"><option value="">Sem operação</option>{opsOpen.map(o => <option key={o.id} value={o.id}>{cxOpName(o)}</option>)}</select>
      <button type="submit" className="cx-btn sm primary" disabled={!draft.title.trim()}>Criar</button>
    </form>
    <div className="cx-toolbar">
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-task-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Título, descrição, processo ou nota" aria-label="Filtrar tarefas" /></label>
      <CxSelect id="cx-task-op" pre="Operação" value={opF} onChange={setOpF} options={opOptions} label="Filtrar por operação" />
      <CxChips sm label="Quais tarefas" value={scope} onChange={setScope} options={[['globais', 'Globais e avulsas'], ['todas', 'Todas', hidden || null]]} />
      <span className="cx-sp" />
      {view === 'lista' ? <CxSelect id="cx-task-g" pre="Agrupar" value={groupBy} onChange={setGroupBy} options={[['prazo', 'Data limite'], ['prioridade', 'Prioridade'], ['operacao', 'Operação']]} /> : null}
    </div>
    {view === 'quadro'
      ? <CxTaskBoard items={open} done={done} opsById={opsById} onOpen={p.onOpenTask} onSetStatus={(id, s) => { const t = all.find(x => x.id === id); if (t && t.status !== s) { p.upsert('tasks', { ...t, status: s }); cxNotify(CX_TASK_ST[s]); } }} />
      : <div className="cx-list">
        {!groups.length && !done.length ? <div className="cx-empty-row" style={{ borderTop: 0 }}>{all.length ? 'Nenhuma tarefa com esses filtros.' : 'Nenhuma tarefa ainda. Escreva a primeira no campo acima.'}</div> : null}
        {!groups.length && done.length ? <div className="cx-empty-row" style={{ borderTop: 0 }}>Nada em aberto neste recorte.</div> : null}
        {groups.map(g => {
          const isClosed = !!closed[g.key];
          return <React.Fragment key={g.key}>
            <button type="button" className={'cx-grp' + (isClosed ? ' closed' : '')} aria-expanded={!isClosed} onClick={() => setClosed(c => ({ ...c, [g.key]: !isClosed }))}>
              <span className="cx-caret"><CxIcon n="chevD" s={14} /></span>{g.icon}<span>{g.label}</span><span className="cx-n">{g.items.length}</span>
            </button>
            {isClosed ? null : g.items.slice().sort(cxTaskSort).map(row)}
          </React.Fragment>;
        })}
        {done.length ? <>
          <button type="button" className={'cx-grp' + (closed.done ? ' closed' : '')} aria-expanded={!closed.done} onClick={() => setClosed(c => ({ ...c, done: !c.done }))}>
            <span className="cx-caret"><CxIcon n="chevD" s={14} /></span><CxIcon n="check" s={14} className="cx-muted" /><span>Concluídas</span><span className="cx-n">{done.length}</span>
          </button>
          {closed.done ? null : done.slice(0, 30).map(row)}
          {!closed.done && done.length > 30 ? <div className="cx-more">+{done.length - 30} concluídas mais antigas</div> : null}
        </> : null}
      </div>}
  </div>;
}

/* ═════════════════════ Agenda ═════════════════════ */
const CX_AG_KINDS = [['aud', 'Audiências', 'var(--cx-orange)'], ['prazo', 'Prazos', 'var(--cx-blue)'], ['tarefa', 'Tarefas', 'var(--cx-green)'], ['presc', 'Prescrição', 'var(--cx-violet)']];
const CX_AG_C = { aud: 'var(--cx-orange)', prazo: 'var(--cx-blue)', tarefa: 'var(--cx-green)', presc: 'var(--cx-violet)' };
function cxMonday(d) { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function cxAddDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
/* Junta, por dia, audiências, prazos de intimação, tarefas com data limite e termos de prescrição (grupos 1 a 4).
   A lógica em si mora em src/lib/agenda.js (buildAgendaByDay), reaproveitada pelo Relatório. */
function cxAgendaByDay(data, prazosRadar, fromIso, toIso, opF) {
  const by = buildAgendaByDay(data, prazosRadar, fromIso, toIso, opF, {
    hearingLabel: (t) => CX_HEARING[t] || 'Audiência',
    partyName: cxPartyName,
    intimOnAgenda: intimPrazoNaAgenda,
    isUrgentIntim: intimIsUrgent,
    taskOpen: cxTaskOpen,
    safeText: betaSafeUiText,
  });
  // Prazo de intimação: objeto definido pelo usuário no lugar do eventDescription cru (item 1).
  Object.keys(by).forEach(k => by[k].forEach(it => { if (it.kind === 'prazo' && it.ref) it.subText = cxIntimObjetoText(it.ref); }));
  return by;
}
function CxAgItem({ it, opsById, compact, onOpen }) {
  const op = opsById.get(it.op);
  const sub = it.subText != null ? <CxObj intim={it.ref} /> : it.sub;
  return <button type="button" className={'cx-ag-it k-' + it.kind + (compact ? ' compact' : '')} style={{ '--c': CX_AG_C[it.kind] }} onClick={() => onOpen(it)}
    title={[it.time, it.title, it.subText != null ? it.subText : it.sub, op ? op.name : ''].filter(Boolean).join(' · ')}>
    <span className="cx-ag-t">{it.urgent ? <span className="cx-ag-urg" aria-label="urgente">!</span> : null}{it.time ? <b className="cx-mono">{it.time}</b> : null}<span className="cx-ell">{it.title}</span></span>
    {compact ? null : <>
      {sub ? <span className="cx-ag-s">{sub}</span> : null}
      {op ? <span className="cx-ag-op"><CxOpSquare op={op} /><span className="cx-ell">{cxOpName(op)}</span></span> : null}
    </>}
  </button>;
}
function CxHearingRow({ h, op, onOpen, onOpenOp, deskOn, onDesk }) {
  const closed = h.status === 'realizada' || h.status === 'cancelada';
  const d = cxDate(h.date);
  const dd = daysUntil(h.date);
  const tone = closed ? '' : dd !== null && dd >= 0 && dd <= 2 ? 'red' : dd !== null && dd > 2 && dd <= 7 ? 'yellow' : '';
  const when = closed ? (AUDIENCIA_STATUSES[h.status] || {}).label.replace(/^[^ ]+ /, '') : dd === null ? 'sem data' : dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : dd > 0 ? 'em ' + dd + ' dias' : 'há ' + (-dd) + ' dias';
  const mat = h.roteiro || (h.notesList && h.notesList.length) || (h.documentIds && h.documentIds.length);
  return <div className={'cx-h-row' + (closed ? ' done' : '') + (tone ? ' ' + tone : '')} role="button" tabIndex={0} onClick={() => onOpen(h)} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(h); }}>
    <div className="cx-h-date"><b>{d ? d.getDate() : '—'}</b><span>{d ? CX_MES_L[d.getMonth()].slice(0, 3) : ''}</span>{h.time ? <span className="cx-mono cx-h-time">{h.time}</span> : null}</div>
    <div className="cx-i-main">
      <div className="cx-t-title"><span className="cx-ell">{h.parties || 'Audiência'}</span></div>
      <div className="cx-h-meta">
        <span className="cx-tag">{CX_HEARING[h.hearingType] || 'Audiência'}</span>
        {h.status === 'redesignada' ? <span className="cx-tag yellow">redesignada</span> : null}
        <span className="cx-muted">{h.modality === 'virtual' ? 'Virtual' : 'Presencial'}{h.location ? ' · ' + h.location : ''}</span>
        {mat ? <span className="cx-tag blue" title="Roteiro, notas ou documentos anexados"><CxIcon n="note" s={11} />material</span> : null}
      </div>
      {h.processNumber ? <div className="cx-h-proc"><CxProc num={h.processNumber} /></div> : null}
    </div>
    <div className="cx-h-side">
      <span className={'cx-h-when' + (tone ? ' ' + tone : '')}>{when}</span>
      {op ? <CxOpTag op={op} onOpen={onOpenOp} /> : <span className="cx-op-tag cx-muted">Sem operação</span>}
      <span className="cx-h-acts">
        {h.docUrl ? <a className="cx-icon-btn cx-sm" href={h.docUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Abrir documento" aria-label="Abrir documento"><CxIcon n="file" s={13} /></a> : null}
        {closed ? null : cxDeskBtn(deskOn, onDesk)}
      </span>
    </div>
  </div>;
}
function EditionClaudeAgenda(p) {
  const { data, opsById, prazosRadar } = p;
  const [viewState, setViewS] = React.useState(() => cxLs('nexus_cx_ag_view', 'semana'));
  /* Foco num dia (vindo do mapa "Carga de prazos" da Hoje): mostra só esse dia, em lista. Trocar a visão, "Hoje"
     ou o × do chip desfaz o foco; ‹ › andam um dia. */
  const [dayFocus, setDayFocus] = React.useState(() => p.initialDay || null);
  React.useEffect(() => { if (p.initialDay && p.onInitialDayConsumed) p.onInitialDayConsumed(); }, []);
  const view = dayFocus ? 'lista' : viewState;
  const [anchor, setAnchor] = React.useState(() => { const d = p.initialDay ? new Date(p.initialDay + 'T12:00:00') : new Date(); d.setHours(12, 0, 0, 0); return d; });
  const setView = (v) => { if (dayFocus) { setAnchor(new Date(dayFocus + 'T12:00:00')); setDayFocus(null); } setViewS(v); cxLsSet('nexus_cx_ag_view', v); };
  const [kinds, setKindsS] = React.useState(() => { try { const v = JSON.parse(localStorage.getItem('nexus_cx_ag_kinds') || 'null'); return v && typeof v === 'object' ? v : { aud: true, prazo: true, tarefa: true, presc: true }; } catch (e) { return { aud: true, prazo: true, tarefa: true, presc: true }; } });
  const setKinds = (v) => { setKindsS(v); cxLsSet('nexus_cx_ag_kinds', JSON.stringify(v)); };
  const [opFRaw, setOpF] = React.useState('all');
  const [pastOpen, setPastOpen] = React.useState(false);
  const todayIso = localIso(new Date());
  let days, label;
  if (dayFocus) {
    const fd = new Date(dayFocus + 'T12:00:00');
    days = [fd];
    label = cxCap(CX_DOW_L[fd.getDay()]) + ', ' + fd.getDate() + ' de ' + CX_MES_L[fd.getMonth()] + ' de ' + fd.getFullYear();
  } else if (view === 'mes') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const start = cxMonday(first);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
    const n = Math.round((cxAddDays(cxMonday(last), 6) - start) / 86400000) + 1;
    days = Array.from({ length: n }, (_, i) => cxAddDays(start, i));
    label = cxCap(CX_MES_L[anchor.getMonth()]) + ' de ' + anchor.getFullYear();
  } else if (view === 'lista') {
    const start = new Date(anchor); start.setHours(12, 0, 0, 0);
    days = Array.from({ length: 30 }, (_, i) => cxAddDays(start, i));
    label = 'De ' + cxDM(localIso(days[0])) + ' a ' + cxDM(localIso(days[29])) + '/' + days[29].getFullYear();
  } else {
    const start = cxMonday(anchor);
    days = Array.from({ length: 7 }, (_, i) => cxAddDays(start, i));
    const a = days[0], b = days[6];
    label = a.getDate() + (a.getMonth() !== b.getMonth() ? ' de ' + CX_MES_L[a.getMonth()] : '') + ' a ' + b.getDate() + ' de ' + CX_MES_L[b.getMonth()] + ' de ' + b.getFullYear();
  }
  const fromIso = localIso(days[0]), toIso = localIso(days[days.length - 1]);
  const opF = (opFRaw === 'all' || opFRaw === 'none' || (opsById.has(opFRaw) && [].concat(data.hearings || [], data.intimations || [], data.tasks || []).some(x => x.operationId === opFRaw))) ? opFRaw : 'all';
  const byDayAll = cxAgendaByDay(data, prazosRadar, fromIso, toIso, opF);
  const byDay = {};
  const counts = { aud: 0, prazo: 0, tarefa: 0, presc: 0 };
  Object.keys(byDayAll).forEach(k => { byDayAll[k].forEach(it => { counts[it.kind]++; }); byDay[k] = byDayAll[k].filter(it => kinds[it.kind]); });
  const shift = (n) => { if (dayFocus) { setDayFocus(localIso(cxAddDays(new Date(dayFocus + 'T12:00:00'), n))); return; } const d = new Date(anchor); if (view === 'mes') { d.setDate(1); d.setMonth(d.getMonth() + n); } else d.setDate(d.getDate() + (view === 'lista' ? 30 : 7) * n); setAnchor(d); };
  const goToday = () => { const d = new Date(); d.setHours(12, 0, 0, 0); setAnchor(d); setDayFocus(null); };
  const open = (it) => {
    if (it.kind === 'aud') p.onOpenHearing(it.ref);
    else if (it.kind === 'prazo') p.onOpenIntim(it.ref.id);
    else if (it.kind === 'tarefa') p.onOpenTask(it.ref);
    else p.onOpenCda(it.ref);
  };
  const opIds = [...new Set([].concat((data.hearings || []).map(h => h.operationId), (data.intimations || []).map(x => x.operationId), (data.tasks || []).map(t => t.operationId)).filter(Boolean))];
  const opOptions = [['all', 'Todas'], ['none', 'Sem operação']].concat(opIds.map(id => opsById.get(id)).filter(Boolean).sort(sortOpsByName).map(o => [o.id, cxOpName(o)]));
  const hearings = (data.hearings || []).filter(h => opF === 'all' || (opF === 'none' ? !h.operationId : h.operationId === opF));
  const isClosedH = (h) => h.status === 'realizada' || h.status === 'cancelada';
  const upcoming = hearings.filter(h => !isClosedH(h) && h.date && daysUntil(h.date) >= 0).sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || '').localeCompare(String(b.time || '')));
  const noDate = hearings.filter(h => !isClosedH(h) && !h.date);
  const past = hearings.filter(h => isClosedH(h) || (h.date && daysUntil(h.date) < 0)).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const hRow = (h) => <CxHearingRow key={h.id} h={h} op={opsById.get(h.operationId)} onOpen={p.onOpenHearing} onOpenOp={p.onOpenOp} deskOn={p.isOnDesk('hearing', h.id)} onDesk={() => p.toggleDesk('hearing', h.id, daysUntil(h.date))} />;
  const total = Object.values(byDay).reduce((s, a) => s + a.length, 0);
  const dayHead = (d) => { const k = localIso(d); return <><span className="cx-ag-dow">{CX_DOW[d.getDay()]}</span><span className={'cx-ag-n' + (k === todayIso ? ' today' : '')}>{d.getDate()}</span></>; };
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-page-h">
      <div><h1>Agenda</h1><p>Audiências, finais de prazo, tarefas com data limite e termos de prescrição num só calendário. Clique num item para abrir.</p></div>
      <div className="cx-acts">
        <button type="button" className="cx-btn primary" onClick={p.onNewHearing}><CxIcon n="plus" s={14} />Nova audiência</button>
      </div>
    </div>
    <div className="cx-toolbar">
      <CxSeg className="lg" label="Visualização" value={view} onChange={setView} options={[['semana', 'Semana'], ['mes', 'Mês'], ['lista', 'Lista']]} />
      <span className="cx-ag-nav">
        <button type="button" className="cx-icon-btn" onClick={() => shift(-1)} aria-label="Anterior" title="Anterior"><CxIcon n="chevL" s={15} /></button>
        <button type="button" className="cx-btn sm" onClick={goToday}>Hoje</button>
        <button type="button" className="cx-icon-btn" onClick={() => shift(1)} aria-label="Próximo" title="Próximo"><CxIcon n="chevR" s={15} /></button>
      </span>
      <b className="cx-ag-label">{label}</b>
      <span className="cx-sp" />
      <CxSelect id="cx-ag-op" pre="Operação" value={opF} onChange={setOpF} options={opOptions} label="Filtrar por operação" />
    </div>
    <div className="cx-chips" role="group" aria-label="Mostrar na agenda">
      {CX_AG_KINDS.map(k => <button key={k[0]} type="button" className={'cx-fchip' + (kinds[k[0]] ? ' on' : '') + (counts[k[0]] === 0 ? ' zero' : '')} aria-pressed={!!kinds[k[0]]} onClick={() => setKinds({ ...kinds, [k[0]]: !kinds[k[0]] })}>
        <span className="cx-dot" style={{ background: k[2] }} />{k[1]}<span className="cx-fcn">{counts[k[0]]}</span>
      </button>)}
      {dayFocus ? <button type="button" className="cx-fchip sm on" onClick={() => { setAnchor(new Date(dayFocus + 'T12:00:00')); setDayFocus(null); }} title="Voltar à visão da agenda">Só este dia<span className="cx-fcn">✕</span></button> : null}
      <span className="cx-muted cx-small cx-ag-total">{cxPl(total, 'item', 'itens')} {dayFocus ? 'neste dia' : 'neste período'}</span>
    </div>
    {view === 'lista' ? <div className="cx-list cx-ag-list">
      {days.filter(d => (byDay[localIso(d)] || []).length).map(d => { const k = localIso(d); return <div key={k} className="cx-ag-lday">
        <div className={'cx-ag-lh' + (k === todayIso ? ' today' : '')}>{dayHead(d)}<span className="cx-muted cx-small">{CX_DOW_L[d.getDay()]}, {d.getDate()} de {CX_MES_L[d.getMonth()]}</span><span className="cx-n" style={{ marginLeft: 'auto' }}>{byDay[k].length}</span></div>
        <div className="cx-ag-lits">{byDay[k].map(it => <CxAgItem key={it.id} it={it} opsById={opsById} onOpen={open} />)}</div>
      </div>; })}
      {!total ? <div className="cx-empty-row" style={{ borderTop: 0 }}>{dayFocus ? 'Nada neste dia com esses filtros.' : 'Nada nos próximos 30 dias com esses filtros.'}</div> : null}
    </div> : <div className={'cx-ag-grid' + (view === 'mes' ? ' month' : '')}>
      {view === 'mes' ? ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(n => <div key={n} className="cx-ag-mh">{n}</div>) : null}
      {days.map(d => {
        const k = localIso(d), its = byDay[k] || [];
        const out = view === 'mes' && d.getMonth() !== anchor.getMonth();
        const we = d.getDay() === 0 || d.getDay() === 6;
        const max = view === 'mes' ? 3 : 99;
        return <div key={k} className={'cx-ag-day' + (k === todayIso ? ' today' : '') + (k < todayIso ? ' past' : '') + (out ? ' out' : '') + (we ? ' we' : '')}>
          <div className="cx-ag-dh">{view === 'mes' ? <span className={'cx-ag-n' + (k === todayIso ? ' today' : '')}>{d.getDate()}</span> : dayHead(d)}</div>
          <div className="cx-ag-its">
            {its.slice(0, max).map(it => <CxAgItem key={it.id} it={it} opsById={opsById} compact={view === 'mes'} onOpen={open} />)}
            {its.length > max ? <button type="button" className="cx-ag-more" onClick={() => { setAnchor(new Date(d)); setView('semana'); }}>+{its.length - max} mais</button> : null}
            {!its.length && view === 'semana' ? <span className="cx-ag-empty">—</span> : null}
          </div>
        </div>;
      })}
    </div>}
    <div className="cx-sub-h"><h2>Audiências</h2><span className="cx-count">{upcoming.length} agendada{upcoming.length === 1 ? '' : 's'}</span></div>
    <div className="cx-list">
      {!hearings.length ? <div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma audiência cadastrada. Cadastre para acompanhar data, roteiro e material de apoio, e ser avisado quando a data se aproximar.</div> : null}
      {upcoming.map(hRow)}
      {noDate.length ? <><div className="cx-pz-gh">Sem data definida<span className="cx-n">{noDate.length}</span></div>{noDate.map(hRow)}</> : null}
      {past.length ? <>
        <button type="button" className={'cx-grp' + (pastOpen ? '' : ' closed')} aria-expanded={pastOpen} onClick={() => setPastOpen(v => !v)}><span className="cx-caret"><CxIcon n="chevD" s={14} /></span><span>Realizadas e passadas</span><span className="cx-n">{past.length}</span></button>
        {pastOpen ? past.slice(0, 30).map(hRow) : null}
      </> : null}
    </div>
  </div>;
}

/* ═════════════════════ Mesa de trabalho ═════════════════════ */
const CX_DESK_COLS = [['intimation', 'Intimações', 'inbox'], ['task', 'Tarefas', 'check'], ['hearing', 'Audiências', 'gavel']];
function cxDeskResolve(data, d) {
  const coll = d.type === 'intimation' ? data.intimations : d.type === 'task' ? data.tasks : data.hearings;
  const x = (coll || []).find(i => i.id === d.id);
  if (!x) return null;
  const iso = d.type === 'intimation' ? x.dateDeadline : d.type === 'task' ? x.dueDate : x.date;
  const notes = d.type === 'intimation' ? cxNotes(x) : cxTaskNotes(x);
  const title = d.type === 'intimation' ? cxPartyName(x) : d.type === 'task' ? (x.title || 'Tarefa') : (x.parties || 'Audiência');
  const sub = d.type === 'intimation' ? <CxObj intim={x} /> : d.type === 'task' ? (x.description || '') : ((CX_HEARING[x.hearingType] || 'Audiência') + (x.time ? ' · ' + x.time : '') + (x.location ? ' · ' + x.location : ''));
  return { d, x, iso, notes, title, sub, doc: d.type === 'intimation' ? x.minutaUrl : x.docUrl, urgent: d.type === 'intimation' ? intimIsUrgent(x) : d.type === 'task' ? x.priority === 'urgente' : false };
}
function cxDeskWhen(dd) {
  if (dd === null) return { t: 'sem data', c: '' };
  if (dd < 0) return { t: 'vencido há ' + (-dd) + 'd', c: 'red' };
  if (dd === 0) return { t: 'hoje', c: 'red' };
  if (dd === 1) return { t: 'amanhã', c: 'orange' };
  if (dd <= 7) return { t: 'em ' + dd + ' dias', c: 'yellow' };
  return { t: 'em ' + dd + ' dias', c: '' };
}
function EditionClaudeMesa(p) {
  const { data, opsById, a } = p;
  const [drag, setDrag] = React.useState(null);
  const [overId, setOverId] = React.useState(null);
  const [sugOpen, setSugOpenS] = React.useState(() => cxLs('nexus_cx_desk_sug', '1') === '1');
  const setSugOpen = (v) => { setSugOpenS(v); cxLsSet('nexus_cx_desk_sug', v ? '1' : '0'); };
  const items = (data.desk || []).map(d => cxDeskResolve(data, d)).filter(Boolean);
  const onDesk = new Set((data.desk || []).map(d => d.type + ':' + d.id));
  // Sugestões: o que vence logo e ainda não está na mesa
  const sug = [];
  (data.intimations || []).forEach(x => { if (!cxIsOpen(x) || onDesk.has('intimation:' + x.id)) return; const dd = daysUntil(x.dateDeadline); if ((dd !== null && dd <= 2) || intimIsUrgent(x)) sug.push({ type: 'intimation', x, dd, why: intimIsUrgent(x) && (dd === null || dd > 2) ? 'urgente' : cxDeskWhen(dd).t }); });
  (data.tasks || []).forEach(t => { if (!cxTaskOpen(t) || onDesk.has('task:' + t.id)) return; const dd = daysUntil(t.dueDate); if ((dd !== null && dd <= 1) || t.priority === 'urgente') sug.push({ type: 'task', x: t, dd, why: t.priority === 'urgente' && (dd === null || dd > 1) ? 'urgente' : cxDeskWhen(dd).t }); });
  (data.hearings || []).forEach(h => { if (!h.date || h.status === 'realizada' || h.status === 'cancelada' || onDesk.has('hearing:' + h.id)) return; const dd = daysUntil(h.date); if (dd !== null && dd >= 0 && dd <= 3) sug.push({ type: 'hearing', x: h, dd, why: cxDeskWhen(dd).t }); });
  sug.sort((m, n) => (m.dd ?? 999) - (n.dd ?? 999));
  const openItem = (type, x) => { if (type === 'intimation') a.openIntim(x.id); else if (type === 'task') a.openTask(x); else a.openHearing(x); };
  const move = (type, col, i, dir) => { const j = i + dir; if (j < 0 || j >= col.length) return; a.reorder(type, col[i].d.id, col[j].d.id); };
  const card = (it, i, col) => {
    const { d, x } = it;
    const dd = daysUntil(it.iso);
    const w = cxDeskWhen(dd);
    const op = opsById.get(x.operationId);
    const key = d.type + ':' + d.id;
    return <div key={key} className={'cx-dk-card' + (drag === key ? ' dragging' : '') + (overId === key ? ' over' : '')} draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', key); e.dataTransfer.effectAllowed = 'move'; setDrag(key); }}
      onDragEnd={() => { setDrag(null); setOverId(null); }}
      onDragOver={e => { if (drag && drag.split(':')[0] === d.type) { e.preventDefault(); if (overId !== key) setOverId(key); } }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); const from = e.dataTransfer.getData('text/plain'); setDrag(null); setOverId(null); if (!from) return; const [ft, fid] = from.split(':'); if (ft === d.type && fid !== d.id) a.reorder(d.type, fid, d.id); }}>
      <div className="cx-dk-top">
        <span className="cx-dk-grip" title="Arraste para reordenar" aria-hidden="true">⠿</span>
        <span className={'cx-dk-when' + (w.c ? ' ' + w.c : '')}>{w.t}{it.iso ? <span className="cx-mono"> · {cxDM(it.iso)}</span> : null}</span>
        <span className="cx-sp" />
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => move(d.type, col, i, -1)} disabled={i === 0} aria-label="Subir" title="Subir"><CxIcon n="chevU" s={13} /></button>
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => move(d.type, col, i, 1)} disabled={i === col.length - 1} aria-label="Descer" title="Descer"><CxIcon n="chevD" s={13} /></button>
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => a.remove(d.type, d.id)} aria-label="Tirar da mesa" title="Tirar da mesa (sem concluir)"><CxIcon n="x" s={13} /></button>
      </div>
      <button type="button" className="cx-dk-title" onClick={() => openItem(d.type, x)}>{it.urgent ? <span className="cx-urg">URGENTE</span> : null}<span>{it.title}</span></button>
      {it.sub ? <div className="cx-dk-sub">{it.sub}</div> : null}
      <CxEstLine esteira={x.esteira} />
      <div className="cx-dk-meta">{x.processNumber ? <CxProc num={x.processNumber} /> : null}{op ? <CxOpTag op={op} onOpen={a.openOp} /> : null}</div>
      {it.notes.length ? <div className="cx-dk-notes">{it.notes.slice(-2).map((n, k) => <div key={k} className="cx-dk-note">{n}</div>)}{it.notes.length > 2 ? <span className="cx-muted cx-small">+{it.notes.length - 2} nota{it.notes.length - 2 === 1 ? '' : 's'}</span> : null}</div> : null}
      <div className="cx-dk-acts">
        {it.doc ? <a className="cx-btn sm" href={it.doc} target="_blank" rel="noopener noreferrer"><CxIcon n="file" s={12} />Documento</a> : null}
        {d.type === 'intimation' ? <button type="button" className="cx-btn sm" onClick={() => a.openIntim(x.id)}><CxIcon n="send" s={12} />Registrar atuação</button> : null}
        <button type="button" className="cx-btn sm ghost" onClick={() => openItem(d.type, x)}>Abrir</button>
      </div>
    </div>;
  };
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-page-h">
      <div><h1>Mesa de intimações</h1><p>{items.length ? cxPl(items.length, 'item em foco', 'itens em foco') + '. ' : ''}O que você escolheu atacar agora. Tirar da mesa não conclui nada: o item continua na sua lista.</p></div>
    </div>
    {sug.length ? <section className="cx-card cx-dk-sug">
      <button type="button" className="cx-pz-fold" onClick={() => setSugOpen(!sugOpen)} aria-expanded={sugOpen}>
        <span className="cx-caret" style={{ transform: sugOpen ? 'none' : 'rotate(-90deg)' }}><CxIcon n="chevD" s={14} /></span>
        <b>Sugestões</b><span className="cx-n">{sug.length}</span><span className="cx-pz-fold-s">vence logo ou está marcado como urgente, e ainda não está na mesa</span>
      </button>
      {sugOpen ? <div className="cx-dk-sug-list">{sug.slice(0, 8).map(s => {
        const r = cxDeskResolve(data, { type: s.type, id: s.x.id });
        const icon = CX_DESK_COLS.find(c => c[0] === s.type)[2];
        return <div key={s.type + s.x.id} className="cx-dk-sug-row">
          <CxIcon n={icon} s={14} className="cx-muted" />
          <button type="button" className="cx-dk-sug-t" onClick={() => openItem(s.type, s.x)}><span className="cx-ell">{r ? r.title : ''}</span><span className="cx-ell cx-muted">{r ? r.sub : ''}</span></button>
          <span className={'cx-dk-when ' + cxDeskWhen(s.dd).c}>{s.why}</span>
          <button type="button" className="cx-btn sm" onClick={() => a.toggle(s.type, s.x.id, s.dd)}><CxIcon n="plus" s={12} />Mesa</button>
        </div>;
      })}{sug.length > 8 ? <div className="cx-more">+{sug.length - 8} nas listas de Intimações, Tarefas e Agenda</div> : null}</div> : null}
    </section> : null}
    <div className="cx-dk-board">{CX_DESK_COLS.map(c => {
      const col = items.filter(it => it.d.type === c[0]);
      return <section key={c[0]} className="cx-dk-col"
        onDragOver={e => { if (drag && drag.split(':')[0] === c[0]) e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); const from = e.dataTransfer.getData('text/plain'); setDrag(null); setOverId(null); if (!from || !col.length) return; const [ft, fid] = from.split(':'); const last = col[col.length - 1]; if (ft === c[0] && fid !== last.d.id) a.reorder(c[0], fid, last.d.id); }}>
        <div className="cx-b-h"><CxIcon n={c[2]} s={14} className="cx-muted" />{c[1]}<span className="cx-n">{col.length}</span></div>
        <div className="cx-dk-list">{col.length ? col.map((it, i) => card(it, i, col)) : <div className="cx-b-empty">Nada aqui. Use o botão Mesa nas listas{c[0] === 'intimation' ? ' ou na gaveta da intimação' : ''}.</div>}</div>
      </section>;
    })}</div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 4 — Cabeçalho da operação para as abas do app (Briefing, Processos e
   prescrição, Inscrições, Partes e bens, Tarefas, Arquivos, Importar).
   O conteúdo das abas é o do app, com o visual Prumo aplicado pelo CSS.
   ═══════════════════════════════════════════════════════════════════════════ */
/* Contador da aba só para o que pede ação (sem contador quando é zero): intimações vencidas na Visão geral e tarefas
   vencidas em Tarefas (vermelho); CDAs no alarme de prescrição em Processos e prescrição (violeta, a cor do alarme
   no resumo do cabeçalho). Números de opStats; nenhum cálculo novo. */
function cxOpTabAlert(tab, s) {
  if (!s) return null;
  if (tab === 'visao' && s.overdueIntims) return { n: s.overdueIntims, tone: 'late', txt: cxPl(s.overdueIntims, 'intimação vencida', 'intimações vencidas') };
  if (tab === 'tarefas' && s.overdueTasks) return { n: s.overdueTasks, tone: 'late', txt: cxPl(s.overdueTasks, 'tarefa vencida', 'tarefas vencidas') };
  if (tab === 'prescricao_v2' && s.prescA) return { n: s.prescA, tone: 'presc', txt: cxPl(s.prescA, 'CDA a agir nos prazos extintivos', 'CDAs a agir nos prazos extintivos') };
  return null;
}
function EditionClaudeOpHeader(p) {
  const { op, opStats: s, activeTab } = p;
  const rs = isSubstituicaoOp(op) ? { overdue: false, daysLeft: null, label: '', color: 'var(--text-muted)' } : cxRS(op);
  const cls = getOpClassifications(op);
  const [intimDrawer, setIntimDrawer] = React.useState(false);
  const opOpenIntims = React.useMemo(() => (p.data && p.data.intimations || []).filter(x => x.operationId === op.id && !x.responseAction && intimIsOpenWork(x)), [p.data, op.id]);
  /* Barra de abas: `fits` desliga o esmaecer das bordas quando todas cabem; a aba ativa rola para a vista (celular). */
  const tabsRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = tabsRef.current; if (!el) return;
    const m = () => el.classList.toggle('fits', el.scrollWidth <= el.clientWidth + 1);
    m();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(m) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [op.id]);
  React.useEffect(() => {
    const el = tabsRef.current; const on = el && el.querySelector('button.on');
    if (on && el.scrollWidth > el.clientWidth + 1 && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTab, op.id]);
  if (isSubstituicaoOp(op)) {
    const onProc = activeTab !== 'docs';
    return <div className="cx cx-oph">
      <div className="cx-oph-top">
        <div className="cx-minw0 cx-oph-main">
          <div className="cx-oph-name">
            <CxOpSquare op={op} size={14} className="cx-sq-lg" />
            <h1 className="cx-ell" title={op.name}>{op.name}</h1>
          </div>
        </div>
      </div>
      <div className="cx-oph-sum"><span>Feitos no lugar de outro procurador. Não entra na carteira.</span></div>
      <nav className="cx-optabs cx-oph-tabs" aria-label="Abas de EM SUBSTITUIÇÃO">
        <button type="button" className={onProc ? 'on' : ''} aria-current={onProc ? 'page' : undefined} onClick={() => { if (!onProc) p.onTab('subst'); }}>Processos</button>
        <button type="button" className={activeTab === 'docs' ? 'on' : ''} aria-current={activeTab === 'docs' ? 'page' : undefined} onClick={() => { if (activeTab !== 'docs') p.onTab('docs'); }}>Arquivos</button>
      </nav>
    </div>;
  }
  const sum = [];
  if (s) {
    sum.push(<span key="d"><b>{cxMoneyShort(s.total)}</b> em dívida</span>);
    if (s.indisp && s.indisp.kind === 'valor') sum.push(<span key="ix" title={cxIndispSplit(s.indisp)}><b>{cxMoneyShort(s.indisp.totalVal)}</b> indisponível{indispRatioText(s.indisp.ratio) ? ' · ' + indispRatioText(s.indisp.ratio) : ''}</span>);
    sum.push(<span key="g">{s.total ? Math.round(s.guar / s.total * 100) : 0}% garantido</span>);
    sum.push(<span key="c">{cxPl(s.debts, 'CDA', 'CDAs')}</span>);
    sum.push(<span key="e">{cxPl(s.execs, 'processo', 'processos')}</span>);
    sum.push(<button key="i" type="button" className={'cx-oph-link' + (s.overdueIntims ? ' cx-red-t' : '')} onClick={() => setIntimDrawer(true)}>{cxPl(s.openIntims, 'intimação aberta', 'intimações abertas')}{s.overdueIntims ? ' · ' + cxPl(s.overdueIntims, 'vencida', 'vencidas') : ''}</button>);
    if (s.prescA) sum.push(<button key="p" type="button" className="cx-violet-t cx-oph-link" onClick={p.onOpenPrazos}>{cxPl(s.prescA, 'CDA a agir nos prazos extintivos', 'CDAs a agir nos prazos extintivos')}</button>);
  }
  return <div className="cx cx-oph">
    {intimDrawer && <EditionClaudeOpIntimDrawer op={op} items={opOpenIntims} onClose={() => setIntimDrawer(false)}
      onOpenIntim={id => { setIntimDrawer(false); p.onOpenIntim && p.onOpenIntim(id); }} />}
    <div className="cx-oph-top">
      <div className="cx-minw0 cx-oph-main">
        <div className="cx-oph-name">
          <CxOpSquare op={op} size={14} className="cx-sq-lg" />
          <h1 className="cx-ell" title={op.name}>{op.name}</h1>
          {op.status === 'encerrada' ? <span className="cx-tag">Encerrada</span> : null}
          {cxOpPrioTag(op)}
        </div>
      </div>
      <div className="cx-op-actions">
        <button type="button" className={'cx-btn' + (rs.overdue ? ' primary' : '')} onClick={p.onReviewed} title="Marcar a operação como revisada hoje"><CxIcon n="tick" s={14} />Revisada</button>
        <button type="button" className="cx-btn" onClick={p.onEdit}><CxIcon n="edit" s={14} />Editar</button>
        <button type="button" className="cx-btn ghost" onClick={p.onDiag}>Diagnóstico</button>
        <button type="button" className="cx-btn ghost" onClick={p.onReport} title="Relatório de passagem de serviço (HTML)"><CxIcon n="file" s={14} />Relatório</button>
      </div>
    </div>
    <div className="cx-oph-tags">{cls.map(cxClsTag)}{cxReviewTag(op)}</div>
    {sum.length ? <div className="cx-oph-sum">{sum}</div> : null}
    <nav ref={tabsRef} className="cx-optabs cx-oph-tabs" aria-label="Abas da operação">
      {[['visao', 'Visão geral']].concat(CX_OP_TABS).map(t => {
        const on = cxTabOn(activeTab, t[0]);
        const al = cxOpTabAlert(t[0], s);
        return <button key={t[0]} type="button" className={on ? 'on' : ''} aria-current={on ? 'page' : undefined} aria-label={al ? t[1] + ', ' + al.txt : undefined} title={al ? al.txt : undefined}
          onClick={() => { if (!on) p.onTab(t[0]); }}>{t[1]}{al ? <span className={'cx-tab-al ' + al.tone} aria-hidden="true">{al.n}</span> : null}</button>;
      })}
    </nav>
  </div>;
}

/* Gaveta "Intimações abertas" a partir do cabeçalho da operação (item 8): mesmo padrão visual
   (cx-drawer / cx-scrim) das demais gavetas Prumo, com um card resumido por intimação. Clicar
   no card abre a gaveta completa (EditionClaudeDrawer) por cima, via onOpenIntim. */
function EditionClaudeOpIntimDrawer({ op, items, onClose, onOpenIntim }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const sorted = [...(items || [])].sort((a, b) => {
    const da = daysUntil(a.dateDeadline), db = daysUntil(b.dateDeadline);
    const oa = da != null && da < 0, ob = db != null && db < 0;
    if (oa !== ob) return oa ? -1 : 1;
    return (a.dateDeadline || '9999-99-99').localeCompare(b.dateDeadline || '9999-99-99');
  });
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-opid-drawer" role="dialog" aria-modal="true" aria-label="Intimações abertas">
      <div className="cx-dr-top">
        <div className="cx-crumb"><b>Intimações abertas</b><span className="cx-muted cx-small">· {op.name}</span></div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        {sorted.length === 0 && <div className="cx-empty-row">Nenhuma intimação aberta nesta operação.</div>}
        {sorted.map(x => {
          const dd = daysUntil(x.dateDeadline);
          const overdue = dd != null && dd < 0;
          return <button key={x.id} type="button" className={'cx-opid-card' + (overdue ? ' late' : '')} onClick={() => onOpenIntim(x.id)}>
            <div className="cx-opid-top">
              <CxProc num={x.processNumber} uf={x.jurisdiction} />
              <span className="cx-sp" />
              {x.minutaUrl ? <CxDocIcon url={x.minutaUrl} size={14} /> : null}
            </div>
            <div className="cx-opid-obj cx-ell"><CxObj intim={x} /></div>
            <div className="cx-opid-meta">
              <CxDue iso={x.dateDeadline} />
              <CxImp intim={x} /><CxDif intim={x} />
            </div>
            <CxEstLine esteira={x.esteira} />
          </button>;
        })}
      </div>
    </aside>
  </>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 5 — Acompanhar e Painel. Gravações só pelas funções do app (upsert);
   edição completa continua no formulário do app (setModal).
   ═══════════════════════════════════════════════════════════════════════════ */
const CX_WATCH = {
  aguardando: { l: 'Aguardando', c: 'var(--cx-yellow)' },
  movimentado: { l: 'Movimentado', c: 'var(--cx-blue)' },
  encerrado: { l: 'Encerrado', c: 'var(--cx-green)' },
};
const CX_WATCH_STALE = 7; // dias sem verificar para pedir atenção
function cxDaysSince(iso) { if (!iso) return null; const t = new Date(iso); if (isNaN(t)) return null; const d0 = new Date(); d0.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0); return Math.round((d0 - t) / 86400000); }
function cxWatchNotes(w) { return Array.isArray(w.notesList) ? w.notesList : (w.notes ? [w.notes] : []); }
function cxWatchCheckAge(w) { const a = cxDaysSince(w.lastCheckedAt); return a !== null ? a : cxDaysSince(w.createdAt); }
function CxWatchRow({ w, op, onOpen, onOpenOp, onCheck, onStatus }) {
  const st = CX_WATCH[w.status] || CX_WATCH.aguardando;
  const closed = w.status === 'encerrado';
  const since = cxDaysSince(w.createdAt);
  const checked = cxDaysSince(w.lastCheckedAt);
  const stale = !closed && (checked === null ? (since !== null && since >= CX_WATCH_STALE) : checked >= CX_WATCH_STALE);
  const notes = cxWatchNotes(w);
  return <div className={'cx-w-row' + (closed ? ' done' : '') + (stale ? ' stale' : '')} role="button" tabIndex={0}
    onClick={() => onOpen(w)} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(w); }}>
    <span className="cx-dot cx-w-dot" style={{ background: st.c }} title={st.l} />
    <div className="cx-i-main">
      <div className="cx-t-title"><span className="cx-mono cx-w-proc">{w.processNumber ? <CxProc num={w.processNumber} /> : <span className="cx-muted">Sem nº</span>}</span>
        {w.processNumber ? <button type="button" className="cx-copy" onClick={e => { e.stopPropagation(); cxCopy(w.processNumber); }} title="Copiar o número" aria-label="Copiar o número do processo"><CxIcon n="copy" s={12} /></button> : null}
      </div>
      {w.parties ? <div className="cx-i-ev">{w.parties}</div> : null}
      <div className="cx-w-reason" title={w.reason || ''}><span className="cx-muted">Motivo:</span> {w.reason || '—'}</div>
      {notes.length ? <div className="cx-i-note" title={notes.join('\n')}><CxIcon n="note" s={12} /><span className="cx-ell">{notes[notes.length - 1]}</span>{notes.length > 1 ? <span className="cx-mono">+{notes.length - 1}</span> : null}</div> : null}
      <div className="cx-i-sub"><CxOpTag op={op} /><span className={'cx-w-age' + (stale ? ' stale' : '')}>{checked === null ? 'nunca verificado' : checked === 0 ? 'verificado hoje' : 'verificado há ' + checked + 'd'}</span></div>
    </div>
    <div className="cx-c-proc">{op ? <CxOpTag op={op} onOpen={onOpenOp} /> : <span className="cx-op-tag cx-muted">Avulso</span>}<span className="cx-cls">{since !== null ? 'acompanhando há ' + since + 'd' : ''}</span></div>
    <div className="cx-w-check">
      <span className={'cx-w-age' + (stale ? ' stale' : '')}>{checked === null ? 'nunca verificado' : checked === 0 ? 'verificado hoje' : 'verificado há ' + checked + 'd'}</span>
      {closed ? null : <button type="button" className="cx-btn sm" onClick={e => { e.stopPropagation(); onCheck(w); }} title="Registrar que você conferiu o processo hoje"><CxIcon n="tick" s={12} />Verificar</button>}
    </div>
    <label className="cx-w-st" onClick={e => e.stopPropagation()}>
      <select id={'cx-w-st-' + w.id} className="cx-input" value={w.status || 'aguardando'} onChange={e => onStatus(w, e.target.value)} aria-label="Situação do acompanhamento" style={{ '--c': st.c }}>
        {Object.keys(CX_WATCH).map(k => <option key={k} value={k}>{CX_WATCH[k].l}</option>)}
      </select>
    </label>
  </div>;
}
function EditionClaudeAcompanhar(p) {
  const { data, opsById } = p;
  const [scope, setScopeS] = React.useState(() => cxLs('nexus_cx_watch_scope', 'abertos'));
  const setScope = (v) => { setScopeS(v); cxLsSet('nexus_cx_watch_scope', v); };
  const [sort, setSortS] = React.useState(() => cxLs('nexus_cx_watch_sort', 'verificacao'));
  const setSort = (v) => { setSortS(v); cxLsSet('nexus_cx_watch_sort', v); };
  const [q, setQ] = React.useState('');
  const [opFRaw, setOpF] = React.useState('all');
  const all = data.watchlist || [];
  const opF = (opFRaw === 'all' || opFRaw === 'none' || (opsById.has(opFRaw) && all.some(x => x.operationId === opFRaw))) ? opFRaw : 'all';
  const openAll = all.filter(w => w.status !== 'encerrado');
  const closedAll = all.filter(w => w.status === 'encerrado');
  const isStale = (w) => { const a = cxWatchCheckAge(w); return w.status !== 'encerrado' && a !== null && a >= CX_WATCH_STALE; };
  const counts = { abertos: openAll.length, aguardando: openAll.filter(w => (w.status || 'aguardando') === 'aguardando').length, movimentado: openAll.filter(w => w.status === 'movimentado').length, atencao: openAll.filter(isStale).length, encerrados: closedAll.length };
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  let list = scope === 'encerrados' ? closedAll : scope === 'aguardando' ? openAll.filter(w => (w.status || 'aguardando') === 'aguardando') : scope === 'movimentado' ? openAll.filter(w => w.status === 'movimentado') : scope === 'atencao' ? openAll.filter(isStale) : openAll;
  list = list.filter(w => {
    if (opF === 'none' ? !!w.operationId : opF !== 'all' && w.operationId !== opF) return false;
    if (!toks.length) return true;
    const hay = cxNorm([w.processNumber, w.parties, w.reason, (opsById.get(w.operationId) || {}).name, cxWatchNotes(w).join(' ')].join(' '));
    const dig = String(w.processNumber || '').replace(/\D/g, '');
    return toks.every(t => hay.includes(t) || (t.replace(/\D/g, '').length >= 3 && dig.includes(t.replace(/\D/g, ''))));
  });
  const so = { aguardando: 0, movimentado: 1, encerrado: 2 };
  const sorters = {
    verificacao: (a, b) => (cxWatchCheckAge(b) ?? -1) - (cxWatchCheckAge(a) ?? -1),
    situacao: (a, b) => ((so[a.status || 'aguardando'] ?? 0) - (so[b.status || 'aguardando'] ?? 0)) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    recentes: (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  };
  list = list.slice().sort(sorters[sort] || sorters.verificacao);
  const opIds = [...new Set(all.map(w => w.operationId).filter(Boolean))];
  const opOptions = [['all', 'Todas'], ['none', 'Avulsos']].concat(opIds.map(id => opsById.get(id)).filter(Boolean).sort(sortOpsByName).map(o => [o.id, cxOpName(o)]));
  const check = (w) => { p.upsert('watchlist', { ...w, lastCheckedAt: new Date().toISOString() }); cxNotify('Verificado hoje'); };
  const setStatus = (w, s) => { if (s === w.status) return; p.upsert('watchlist', { ...w, status: s }); cxNotify('Situação: ' + CX_WATCH[s].l); };
  const tile = (k, label, n, sub, tone) => <CxKpiCard key={k} label={label} value={n} tone={tone} desc={sub} on={scope === k} pressed={scope === k} onClick={() => setScope(k)} />;
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Acompanhar</h1><p>Processos que você monitora depois de uma manifestação pontual, quando não há garantia de nova intimação. O que passa de {CX_WATCH_STALE} dias sem conferência sobe na lista.</p></div>
      <div className="cx-acts"><button type="button" className="cx-btn primary" onClick={p.onNew}><CxIcon n="plus" s={14} />Acompanhar processo</button></div>
    </div>
    <CxKpiStrip n={4} className="bare cx-ks-sp">
      {tile('abertos', 'Em acompanhamento', counts.abertos, cxPl(counts.aguardando, 'aguardando', 'aguardando') + ' · ' + counts.movimentado + ' movimentado' + (counts.movimentado === 1 ? '' : 's'))}
      {tile('atencao', 'Sem conferência há ' + CX_WATCH_STALE + '+ dias', counts.atencao, counts.atencao ? 'vale abrir o eproc' : 'tudo conferido na semana', counts.atencao ? 'orange' : '')}
      {tile('movimentado', 'Movimentados', counts.movimentado, 'houve andamento; decida o próximo passo')}
      {tile('encerrados', 'Encerrados', counts.encerrados, 'histórico')}
    </CxKpiStrip>
    <div className="cx-toolbar">
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-watch-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Processo, partes, motivo ou nota" aria-label="Filtrar acompanhamentos" /></label>
      <CxSelect id="cx-watch-op" pre="Operação" value={opF} onChange={setOpF} options={opOptions} label="Filtrar por operação" />
      <CxChips sm label="Situação" value={scope} onChange={setScope} options={[['abertos', 'Abertos', counts.abertos], ['aguardando', 'Aguardando', counts.aguardando], ['movimentado', 'Movimentados', counts.movimentado], ['encerrados', 'Encerrados', counts.encerrados]]} />
      <span className="cx-sp" />
      <CxSelect id="cx-watch-sort" pre="Ordenar" value={sort} onChange={setSort} options={[['verificacao', 'Conferência mais antiga'], ['situacao', 'Situação'], ['recentes', 'Mais recentes']]} />
    </div>
    <div className="cx-list">
      {list.length ? list.map(w => <CxWatchRow key={w.id} w={w} op={opsById.get(w.operationId)} onOpen={p.onOpen} onOpenOp={p.onOpenOp} onCheck={check} onStatus={setStatus} />)
        : <div className="cx-empty-row" style={{ borderTop: 0 }}>{all.length ? 'Nada neste recorte.' : 'Nenhum processo em acompanhamento. Use para monitorar processos depois de uma manifestação pontual, quando não há garantia de nova intimação. Também dá para criar a partir da gaveta de uma intimação (Acompanhar).'}</div>}
    </div>
  </div>;
}

/* ═════════════════════ Painel da carteira ═════════════════════ */
/* Mesmas opções e rótulos da ordenação do Painel clássico (estado carteiraSort do app), mais 'indisp_asc' (só Prumo;
   o app volta a 'valor_desc' ao sair do Prumo). */
const CX_PANEL_SORTS = [
  ['Financeiro', [['valor_desc', 'Maior valor de crédito'], ['valor_asc', 'Menor valor de crédito'], ['indisp_asc', 'Menor indisponibilidade'], ['cobertura_asc', 'Menor cobertura de garantia']]],
  ['Risco e urgência', [['presc', 'Mais CDAs a agir (prazos extintivos)'], ['intims', 'Mais intimações abertas'], ['tasks', 'Mais tarefas pendentes']]],
  ['Atividade', [['acesso_recente', 'Acessadas recentemente'], ['revisao_atrasada', 'Revisão mais atrasada']]],
  ['Estratégico', [['idpj', 'Mais IDPJs e cautelares'], ['nome', 'Nome (A a Z)']]],
];
const CX_PANEL_GROUPS = [[1, 'Urgentes'], [2, 'A conferir'], [3, 'A completar'], [4, 'Em acompanhamento'], [5, 'Ainda impossível'], [6, 'Consumadas']];
function cxPanelAnalytics(data, prazosByDebt, mesaCards) {
  const ops = (data.operations || []).filter(o => o.status !== 'encerrada' && !isSubstituicaoOp(o));
  const by = new Map(ops.map(o => [o.id, { op: o, totalValue: 0, guaranteedValue: 0, assets: [], ind: null, prescRisk: 0, openIntims: 0, lateIntims: 0, openTasks: 0, debtsCount: 0, execsCount: 0, assetsCount: 0, idpjCount: 0, cautelarCount: 0, daysSinceAccess: null }]));
  (data.debts || []).forEach(d => {
    const x = by.get(d.operationId); if (!x || d.status === 'extinta') return;
    x.debtsCount++; x.totalValue += d.value || 0;
    if (d.status === 'garantida') x.guaranteedValue += d.value || 0;
    if (mesaCards ? mesaIsAction(mesaCards.byDebt.get(d.id)) : [1, 2].includes((prazosByDebt.get(d.id) || {}).group)) x.prescRisk++;
  });
  (data.executions || []).forEach(e => { const x = by.get(e.operationId); if (!x) return; x.execsCount++; if (e.processTag === 'idpj') x.idpjCount++; if (e.processTag === 'cautelar_fiscal') x.cautelarCount++; });
  (data.assets || []).forEach(a => {
    const x = by.get(a.operationId); if (!x) return;
    x.assetsCount++;
    x.assets.push(a);
  });
  by.forEach(x => { x.ind = indispStats(x.assets, x.totalValue); });
  (data.intimations || []).forEach(i => {
    const x = by.get(i.operationId); if (!x || !intimIsOpenWork(i)) return;
    x.openIntims++;
    const dd = daysUntil(i.dateDeadline);
    if (dd !== null && dd < 0) x.lateIntims++;
  });
  (data.tasks || []).forEach(t => { const x = by.get(t.operationId); if (x && t.status !== 'concluida' && t.status !== 'cancelada') x.openTasks++; });
  by.forEach(x => { if (x.op.lastAccessed) { const d = new Date(x.op.lastAccessed); if (!isNaN(d)) x.daysSinceAccess = Math.floor((Date.now() - d.getTime()) / 86400000); } });
  return [...by.values()];
}
function cxPanelSortFn(k) {
  const cov = (o) => (o.totalValue > 0 ? o.guaranteedValue / o.totalValue : 1);
  const ind = (o) => (o.ind && o.ind.ratio !== null ? o.ind.ratio : 1);
  const fns = {
    valor_desc: (a, b) => b.totalValue - a.totalValue,
    valor_asc: (a, b) => a.totalValue - b.totalValue,
    presc: (a, b) => b.prescRisk - a.prescRisk || b.totalValue - a.totalValue,
    intims: (a, b) => b.openIntims - a.openIntims || b.totalValue - a.totalValue,
    tasks: (a, b) => b.openTasks - a.openTasks || b.totalValue - a.totalValue,
    cobertura_asc: (a, b) => cov(a) - cov(b),
    indisp_asc: (a, b) => ind(a) - ind(b) || b.totalValue - a.totalValue,
    acesso_recente: (a, b) => (a.daysSinceAccess === null ? 99999 : a.daysSinceAccess) - (b.daysSinceAccess === null ? 99999 : b.daysSinceAccess),
    revisao_atrasada: (a, b) => (cxRS(a.op).daysLeft ?? 99999) - (cxRS(b.op).daysLeft ?? 99999),
    nome: (a, b) => (a.op.name || '').localeCompare(b.op.name || '', 'pt-BR'),
    idpj: (a, b) => (b.idpjCount + b.cautelarCount) - (a.idpjCount + a.cautelarCount) || b.totalValue - a.totalValue,
  };
  return fns[k] || fns.valor_desc;
}
/* ═════════════════════ Cartões recolhíveis (um só idioma) ═════════════════════
 * cxUseFold(escopo) + CxFoldCard + CxFoldAllBar. Estado em localStorage 'nexus.cxFold' ({ escopo: { id: true=recolhido } },
 * lógica pura em src/lib/fold.js), compartilhado entre os componentes da página (barra "Recolher tudo" e cartões).
 * Só apresentação: não entra nos dados. Sem localStorage vale só nesta sessão. */
let cxFoldStore = null;
const cxFoldSubs = new Set();
function cxFoldLoad() {
  if (cxFoldStore) return cxFoldStore;
  let raw = null;
  try { raw = localStorage.getItem(FOLD_KEY); } catch (e) { raw = null; }
  let st;
  if (raw !== null) st = foldParse(raw);
  else {
    // 1ª vez: traz o que as chaves antigas guardavam (Painel, cartões do Briefing, Horizonte) e passa a ler só a nova.
    const legacy = {};
    try { legacy.painel = localStorage.getItem(FOLD_LEGACY_KEYS.painel); legacy.briefing = localStorage.getItem(FOLD_LEGACY_KEYS.briefing); legacy.horizonte = localStorage.getItem(FOLD_LEGACY_KEYS.horizonte); } catch (e) { /* sem armazenamento */ }
    st = foldMigrateLegacy({}, legacy);
  }
  // P6: os cartões do Briefing passaram para a Visão geral (escopo 'visao'); copia o que estava recolhido, sem sobrescrever.
  const moved = foldMigrateBriefingToVisao(st);
  cxFoldStore = moved;
  if (raw === null || moved !== st) { try { localStorage.setItem(FOLD_KEY, JSON.stringify(cxFoldStore)); } catch (e) { /* ignore */ } }
  return cxFoldStore;
}
function cxFoldCommit(next) {
  cxFoldStore = next;
  try { localStorage.setItem(FOLD_KEY, JSON.stringify(next)); } catch (e) { /* sem armazenamento: vale só nesta sessão */ }
  cxFoldSubs.forEach(fn => fn());
}
/** Estado de um escopo (uma tela). isOpen(id, defaultOpen=true) · toggle(id, defaultOpen=true) · set(id, collapsed) ·
 *  setAll(ids, collapsed) (recolher/expandir tudo). */
function cxUseFold(scope) {
  const [, bump] = React.useReducer(n => n + 1, 0);
  React.useEffect(() => { cxFoldSubs.add(bump); return () => { cxFoldSubs.delete(bump); }; }, []);
  const st = cxFoldLoad();
  const isOpen = (id, defaultOpen = true) => foldIsOpen(st, scope, id, defaultOpen);
  return {
    isOpen,
    toggle: (id, defaultOpen = true) => cxFoldCommit(foldSet(cxFoldLoad(), scope, id, foldIsOpen(cxFoldLoad(), scope, id, defaultOpen))),
    set: (id, collapsed) => cxFoldCommit(foldSet(cxFoldLoad(), scope, id, collapsed)),
    setAll: (ids, collapsed) => cxFoldCommit(foldSetAll(cxFoldLoad(), scope, ids, collapsed)),
  };
}
/** Cartão com cabeçalho clicável (recolhe/expande). `summary` aparece só recolhido; `sub` sempre; `actions` à direita
 *  (cliques em botão/link/campo dentro dele não alternam). `domId` vira o id do <section> (para rolar até o cartão). */
function CxFoldCard({ id, scope, title, count, summary, sub, actions, className = '', defaultOpen = true, as = 'h2', domId, ariaLabel, children }) {
  const fold = cxUseFold(scope);
  const open = fold.isOpen(id, defaultOpen);
  const flip = () => fold.toggle(id, defaultOpen);
  const onClick = (e) => {
    const hit = e.target.closest ? e.target.closest('button, a, input, select, textarea, label') : null;
    if (hit && hit !== e.currentTarget && e.currentTarget.contains(hit)) return;
    flip();
  };
  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  };
  return <section className={'cx-card cx-fold' + (open ? '' : ' folded') + (className ? ' ' + className : '')} id={domId} aria-label={ariaLabel}>
    <div className="cx-card-h cx-fold-h" role="button" tabIndex={0} aria-expanded={open} title={open ? 'Recolher' : 'Expandir'} onClick={onClick} onKeyDown={onKeyDown}>
      <span className="cx-fold-chev" aria-hidden="true"><CxIcon n="chevD" s={13} /></span>
      {React.createElement(as, { className: 'cx-fold-title' }, title)}
      {count != null ? <span className="cx-count">{count}</span> : null}
      {sub ? <span className="cx-muted cx-small cx-fold-sub">{sub}</span> : null}
      {!open && summary ? <span className="cx-fold-sum cx-ell">{summary}</span> : null}
      {actions ? <div className="cx-aside cx-fold-act">{actions}</div> : null}
    </div>
    {open ? children : null}
  </section>;
}
/** Mesmo conteúdo do cartão, mas sem o cartão: dentro do Painel de apoio (aba). As ações do cabeçalho viram uma linha de ferramentas. */
function CxFoldOrBare({ bare, actions, className = '', children, ...rest }) {
  if (!bare) return <CxFoldCard {...rest} className={className} actions={actions}>{children}</CxFoldCard>;
  return <div className={'cx-ap-pane' + (className ? ' ' + className : '')}>
    {actions ? <div className="cx-ap-tools">{actions}</div> : null}
    {children}
  </div>;
}
function CxFoldAllBar({ scope, ids, className = '' }) {
  const fold = cxUseFold(scope);
  return <div className={'cx-fold-all' + (className ? ' ' + className : '')}>
    <button type="button" className="cx-fold-all-b" onClick={() => fold.setAll(ids, true)}>Recolher tudo</button>
    <span aria-hidden="true">·</span>
    <button type="button" className="cx-fold-all-b" onClick={() => fold.setAll(ids, false)}>Expandir tudo</button>
  </div>;
}
const CX_PANEL_OPS_LIMIT = 10;
function EditionClaudePainel(p) {
  const { data, prazosRadar, prazosByDebt, mesaCards } = p;
  const rows = React.useMemo(() => cxPanelAnalytics(data, prazosByDebt, mesaCards), [data, prazosByDebt, mesaCards]);
  const fold = cxUseFold('painel');
  const [allOps, setAllOps] = React.useState(false);
  const sort = p.sort || 'valor_desc';
  const sorted = rows.slice().sort(cxPanelSortFn(sort));
  const shownOps = allOps ? sorted : sorted.slice(0, CX_PANEL_OPS_LIMIT);
  const hiddenOps = sorted.length - shownOps.length;
  const sortLabel = (CX_PANEL_SORTS.flatMap(g => g[1]).find(o => o[0] === sort) || [null, ''])[1];
  // Indicadores: mesmo escopo do Painel clássico (todas as CDAs não extintas); a tabela cobre as operações ativas.
  const liveDebts = (data.debts || []).filter(d => d.status !== 'extinta');
  const kpiCredito = liveDebts.reduce((s, d) => s + (d.value || 0), 0);
  const kpiGarantido = liveDebts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  const pctGar = kpiCredito > 0 ? Math.round(kpiGarantido / kpiCredito * 100) : 0;
  const kpiInd = indispStats(data.assets || [], kpiCredito);
  const totalCredito = rows.reduce((s, o) => s + o.totalValue, 0);
  const totalInd = indispStats(rows.flatMap(o => o.assets), totalCredito);
  const nExecs = (data.executions || []).length;
  const openIntims = (data.intimations || []).filter(x => intimIsOpenWork(x));
  const lateIntims = openIntims.filter(x => { const dd = daysUntil(x.dateDeadline); return dd !== null && dd < 0; }).length;
  const { n: riskN, value: riskV } = mesaActionCount(mesaCards.totals);
  const due = rows.map(o => ({ op: o.op, rs: cxRS(o.op) })).filter(o => o.rs.overdue).sort((a, b) => a.rs.daysLeft - b.rs.daysLeft);
  const maxV = Math.max(1, ...rows.map(o => o.totalValue));
  // Próximos 7 dias: o mesmo recorte da Agenda
  const today = localIso(new Date());
  const in7 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return localIso(d); })();
  const inWeek = (iso) => { const k = toDayKey(iso); return !!k && k >= today && k <= in7; };
  const wk = {
    aud: (data.hearings || []).filter(h => h.date && h.status !== 'cancelada' && h.status !== 'realizada' && inWeek(h.date)).length,
    prazo: (data.intimations || []).filter(x => intimPrazoNaAgenda(x) && inWeek(x.dateDeadline)).length,
    tarefa: (data.tasks || []).filter(tk => tk.dueDate && cxTaskOpen(tk) && inWeek(tk.dueDate)).length,
  };
  const colSort = (k, extra) => ({ onClick: () => p.setSort(k), onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.setSort(k); } }, tabIndex: 0, className: 'cx-th-sort' + (sort === k ? ' on' : '') + (extra ? ' ' + extra : ''), 'aria-sort': sort === k ? (k === 'valor_asc' || k === 'cobertura_asc' || k === 'indisp_asc' || k === 'nome' || k === 'acesso_recente' || k === 'revisao_atrasada' ? 'ascending' : 'descending') : undefined });
  if (!(data.operations || []).length) return <div className="cx cx-page"><div className="cx-page-h"><div><h1>Painel</h1><p>Crie a primeira operação para ver a carteira em números.</p></div><div className="cx-acts"><button type="button" className="cx-btn primary" onClick={p.onNewOp}><CxIcon n="plus" s={14} />Nova operação</button></div></div></div>;
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-page-h">
      <div><h1>Painel</h1><p>A carteira inteira em números: onde está o crédito, quanto dele tem bens indisponíveis e onde está o risco. Clique numa operação para abri-la.</p></div>
    </div>
    <CxKpiStrip n={5} className="bare cx-ks-sp">
      <CxKpiCard label="Crédito sob gestão" value={cxMoneyShort(kpiCredito)}
        desc={cxPl(liveDebts.length, 'CDA', 'CDAs') + ' · ' + cxPl(rows.length, 'operação ativa', 'operações ativas') + ((data.operations || []).length > rows.length ? ' de ' + (data.operations || []).length : '') + ' · ' + cxPl(nExecs, 'processo', 'processos')} />
      <CxKpiCard label="Indisponível" value={kpiInd.pct === null ? '—' : kpiInd.over ? Math.round(kpiInd.ratio * 10) / 10 : kpiInd.pct} unit={kpiInd.pct === null ? '' : kpiInd.over ? '×' : '%'}
        tip={[CX_INDISP_RING, cxIndispSplit(kpiInd), CX_INDISP_DUP].filter(Boolean).join(' · ')}
        side={kpiInd.pct !== null ? <span className="cx-kc-ring"><CxRing pct={kpiInd.pct} size={44} stroke={6} label={cxIndispPctTxt(kpiInd) + ' da dívida indisponível'} /></span> : null}
        desc={cxMoneyShort(kpiInd.totalVal) + ' indisponível · ' + pctGar + '% garantido'} />
      <CxKpiCard label="Risco prescricional" value={riskN} unit={riskN === 1 ? 'CDA' : 'CDAs'} tone={riskN ? 'violet' : ''} onClick={p.onOpenPrazos} tip="Mesmo número do menu e da Mesa de prazos: soma dos cartões Conferir o cálculo, Ajuizar (até 60 dias), Lançar fato, Confirmar vigência e Completar dado"
        desc={riskN ? cxMoneyShort(riskV) + ' a agir' : 'situação controlada'} descTone={riskN ? 'violet' : ''} />
      <CxKpiCard label="Intimações abertas" value={openIntims.length} tone={lateIntims ? 'red' : ''} onClick={p.onOpenIntims}
        desc={lateIntims ? cxPl(lateIntims, 'vencida', 'vencidas') : 'nenhuma vencida'} descTone={lateIntims ? 'red' : ''} />
      <CxKpiCard label="Revisões devidas" value={due.length} tone={due.length ? 'orange' : ''} onClick={() => { fold.set('rev', false); setTimeout(() => { const el = document.getElementById('cx-panel-rev'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); }}
        desc={due.length ? 'operações com revisão atrasada' : 'todas em dia'} descTone={due.length ? 'orange' : ''} />
    </CxKpiStrip>

    <CxFoldCard id="ops" scope="painel" title="Operações" className="cx-panel-ops"
      sub={sortLabel + ' · ' + cxPl(rows.length, 'ativa', 'ativas')}
      summary={cxMoneyShort(totalCredito) + ' sob gestão' + (totalCredito > 0 ? ' · ' + cxIndispPctTxt(totalInd) + ' indisponível' : '')}
      actions={fold.isOpen('ops') ? <>
        <span className="cx-panel-legend" aria-hidden="true"><i className="cx-lg-g" />Indisponível<i className="cx-lg-n" />Descoberta</span>
        <label className="cx-sel"><span className="cx-pre">Ordenar</span>
          <select id="cx-panel-sort" value={sort} onChange={e => p.setSort(e.target.value)} aria-label="Ordenar operações" style={{ paddingLeft: '72px' }}>
            {CX_PANEL_SORTS.map(g => <optgroup key={g[0]} label={g[0]}>{g[1].map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</optgroup>)}
          </select><CxIcon n="chevD" s={12} /></label>
      </> : null}>
      <div className="cx-tbl-wrap">
        <table className="cx-tbl cx-panel-tbl">
          <thead><tr>
            <th scope="col" {...colSort('nome')}>Operação</th>
            <th scope="col" {...colSort('valor_desc')}>Crédito</th>
            <th scope="col" {...colSort('indisp_asc', 'num')} title="Parte da dívida coberta por bens com indisponibilidade, ativa ou requerida">Indisponível</th>
            <th scope="col" {...colSort('presc', 'num')} title="CDAs que pedem providência na Mesa de prazos (fileira de cima dos cartões)">Prescrição</th>
            <th scope="col" {...colSort('intims', 'num')}>Intimações</th>
            <th scope="col" {...colSort('tasks', 'num')}>Tarefas</th>
            <th scope="col" {...colSort('idpj', 'num')} title="IDPJs e cautelares fiscais">IDPJ · MCF</th>
            <th scope="col" {...colSort('revisao_atrasada')}>Revisão</th>
          </tr></thead>
          <tbody>{shownOps.map((o, i) => {
            const pctW = o.totalValue / maxV * 100;
            const gPct = o.totalValue > 0 ? o.guaranteedValue / o.totalValue * 100 : 0;
            const iPct = o.ind.pct === null ? 0 : o.ind.pct;
            const rs = cxRS(o.op);
            return <tr key={o.op.id} className="click" onClick={() => p.onOpenOp(o.op.id)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) p.onOpenOp(o.op.id); }}>
              <td><span className="cx-op-cell"><span className="cx-panel-rank">{i + 1}</span><CxOpSquare op={o.op} /><span className="cx-ell" title={o.op.name}>{cxOpName(o.op)}</span>{cxOpPrioTag(o.op)}</span>
                <span className="cx-panel-sub">{cxPl(o.debtsCount, 'CDA', 'CDAs')} · {o.execsCount} proc. · {cxPl(o.assetsCount, 'bem', 'bens')}</span></td>
              <td className="cx-panel-bar-td" title={'Crédito ' + fmtCur(o.totalValue) + ' · ' + (cxIndispSplit(o.ind) || 'sem bens indisponíveis com valor') + ' (' + cxIndispPctTxt(o.ind) + ') · garantido ' + Math.round(gPct) + '%'}>
                <span className="cx-panel-val">{cxMoneyShort(o.totalValue)}</span>
                <span className="cx-panel-bar" style={{ width: Math.max(2, pctW) + '%' }}>{iPct > 0 ? <i className="g" style={{ width: iPct + '%' }} /> : null}{iPct < 100 ? <i className="n" /> : null}</span>
              </td>
              <td className="num"><span className={'cx-pct' + (o.totalValue > 0 && iPct < 25 ? ' cx-orange-t' : '')}>{o.totalValue > 0 ? cxIndispPctTxt(o.ind) : '—'}</span></td>
              <td className="num">{o.prescRisk ? <span className="cx-violet-t cx-mono">{o.prescRisk}</span> : <span className="cx-muted">—</span>}</td>
              <td className="num">{o.openIntims ? <span className="cx-mono">{o.openIntims}{o.lateIntims ? <span className="cx-red-t"> · {o.lateIntims} venc.</span> : null}</span> : <span className="cx-muted">—</span>}</td>
              <td className="num">{o.openTasks ? <span className="cx-mono">{o.openTasks}</span> : <span className="cx-muted">—</span>}</td>
              <td className="num">{o.idpjCount + o.cautelarCount ? <span className="cx-mono">{o.idpjCount}{' · '}{o.cautelarCount}</span> : <span className="cx-muted">—</span>}</td>
              <td>{rs.daysLeft === null ? <span className="cx-muted">—</span> : <span className={rs.overdue ? 'cx-orange-t' : 'cx-muted'}>{rs.label}</span>}</td>
            </tr>;
          })}
          {sorted.length > CX_PANEL_OPS_LIMIT && <tr className="cx-pt-more"><td colSpan={8}>
            <button type="button" className="cx-link-btn" onClick={() => setAllOps(v => !v)}>
              {allOps ? 'Mostrar só as ' + CX_PANEL_OPS_LIMIT + ' primeiras' : 'Mostrar mais ' + cxPl(hiddenOps, 'operação', 'operações')}
            </button>
          </td></tr>}</tbody>
          <tfoot><tr>
            <td>Total das ativas</td>
            <td><span className="cx-panel-val">{cxMoneyShort(totalCredito)}</span></td>
            <td className="num" title={CX_INDISP_DUP}>{totalCredito > 0 ? cxIndispPctTxt(totalInd) : '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.prescRisk, 0) || '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.openIntims, 0) || '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.openTasks, 0) || '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.idpjCount, 0)}{' · '}{rows.reduce((s, o) => s + o.cautelarCount, 0)}</td>
            <td>{due.length ? cxPl(due.length, 'atrasada', 'atrasadas') : 'em dia'}</td>
          </tr></tfoot>
        </table>
      </div>
    </CxFoldCard>

    <CxFoldCard id="presc" scope="painel" title="Prescrição na carteira" className="cx-panel-presc"
        summary={riskN ? cxPl(riskN, 'CDA a agir', 'CDAs a agir') + ' · ' + cxMoneyShort(riskV) : 'situação controlada'}
        actions={<button type="button" className="cx-link-btn" onClick={() => p.onOpenMesa('')}>Mesa<CxIcon n="chevR" s={13} /></button>}>
        <><div className="cx-pz-embed"><CxMesaStrip mc={mesaCards} onOpen={p.onOpenMesa} /></div>
        <div className="cx-more">Mesmos cartões da Mesa de prazos. Clique num cartão para abrir a seção.</div></>
    </CxFoldCard>
    <div className="cx-panel-grid two">
      <CxFoldCard id="rev" scope="painel" title="Revisões devidas" domId="cx-panel-rev" count={due.length}
        summary={due.length ? 'operações com revisão atrasada' : 'todas em dia'}>
        {due.length ? due.map(o => <div key={o.op.id} className="cx-panel-rev">
          <button type="button" className="cx-op-tag cx-link" onClick={() => p.onOpenOp(o.op.id)} title={'Abrir ' + o.op.name}><CxOpSquare op={o.op} /><span className="cx-ell">{cxOpName(o.op)}</span></button>
          <span className="cx-orange-t cx-small">{o.rs.label}</span>
          <button type="button" className="cx-btn sm" onClick={() => p.onReviewed(o.op)} title="Marcar a operação como revisada hoje"><CxIcon n="tick" s={12} />Revisada</button>
        </div>) : <div className="cx-empty-row">Nenhuma revisão atrasada.</div>}
        <div style={{ height: 6 }} />
      </CxFoldCard>
      <CxFoldCard id="week" scope="painel" title="Próximos 7 dias"
        summary={cxPl(wk.aud, 'audiência', 'audiências') + ' · ' + cxPl(wk.prazo, 'prazo', 'prazos') + ' · ' + cxPl(wk.tarefa, 'tarefa', 'tarefas')}
        actions={<button type="button" className="cx-link-btn" onClick={p.onOpenAgenda}>Agenda<CxIcon n="chevR" s={13} /></button>}>
        <><div className="cx-panel-week">
          <button type="button" onClick={p.onOpenAgenda}><span className="cx-dot" style={{ background: CX_AG_C.aud }} /><span className="cx-lbl">Audiências</span><b className="cx-mono">{wk.aud}</b></button>
          <button type="button" onClick={p.onOpenAgenda}><span className="cx-dot" style={{ background: CX_AG_C.prazo }} /><span className="cx-lbl">Finais de prazo</span><b className="cx-mono">{wk.prazo}</b></button>
          <button type="button" onClick={p.onOpenAgenda}><span className="cx-dot" style={{ background: CX_AG_C.tarefa }} /><span className="cx-lbl">Tarefas com data limite</span><b className="cx-mono">{wk.tarefa}</b></button>
        </div>
        <div className="cx-more">O calendário completo, com a prescrição, fica na Agenda.</div></>
      </CxFoldCard>
    </div>
  </div>;
}

/* ═════════════════════ Briefing (Nexus Prumo) — fase 7a/7b ═════════════════════
 * Substitui o conteúdo da aba "notas" (rótulo "Briefing") só na edição claude.
 * Não tem estado de dados próprio: lê `op.briefing` e grava pelas mesmas funções
 * do app (upsert, updateBriefing, setModal, setData). O Clássico e a Beta não
 * mudam — continuam com o painel antigo em app.jsx.
 */

function cxStageSetRec(op, upsert, execId, sk, patch) {
  const briefing = op.briefing || {};
  const recs = getStageRecords(briefing, execId);
  const cur = recs[sk] || {};
  upsert('operations', { ...op, briefing: { ...briefing, processStageV2: { ...(briefing.processStageV2 || {}), [execId]: { ...recs, [sk]: { ...cur, ...patch } } } } });
}
function cxStageDelRec(op, upsert, execId, sk) {
  const briefing = op.briefing || {};
  const recs = { ...getStageRecords(briefing, execId) };
  delete recs[sk];
  upsert('operations', { ...op, briefing: { ...briefing, processStageV2: { ...(briefing.processStageV2 || {}), [execId]: recs } } });
}

/* Diário — mesma persistência (materialize/persist) e o mesmo formato de
 * briefing.entries que o BriefingStrategyPanel clássico, com outra apresentação:
 * data na margem, filtro por tipo sempre visível (com contagem), editor inline. */
/* ─── Mural (Visão geral) ───
   Une as entradas do Diário da operação (briefing.entries) e os Lembretes (stickyNotes da operação) em post-its. Cor pelo
   tipo (diário) ou pela cor escolhida (lembrete); o rótulo do tipo vem sempre escrito. Lembrete aceita `dueDate` (AAAA-MM-DD)
   e `done` (opcionais: ausentes = comportamento antigo). Clique abre o editor existente (diário: compositor daqui; lembrete: modal). */
const CX_MU_DIARY_CLS = { estrategia: 'y', risco: 'r', decisao: 'b', providencia: 'g', observacao: 'n', replicacao: 'v' };
const CX_MU_NOTE_CLS = { yellow: 'y', green: 'g', red: 'r', blue: 'b' };
const CX_MU_FILTERS = [['tudo', 'Tudo', 'layers'], ['lembrete', 'Lembretes', 'clock'], ['estrategia', 'Estratégia', 'flag'], ['risco', 'Risco', 'alert'], ['decisao', 'Decisão judicial', 'gavel'], ['providencia', 'Providência', 'check'], ['observacao', 'Observação', 'eye'], ['replicacao', 'Replicação', 'sync']];
function cxMuItems(op, data) {
  const entries = getBriefingEntries(op.briefing || {});
  const notes = (data.stickyNotes || []).filter(n => n.operationId === op.id);
  const items = [];
  entries.forEach(en => {
    const type = BRIEFING_ENTRY_TYPES[en.type] ? en.type : 'observacao';
    items.push({ id: 'd:' + en.id, src: 'd', type, label: BRIEFING_ENTRY_TYPES[type].label, cls: CX_MU_DIARY_CLS[type] || 'n', date: en.eventDate || (en.createdAt || '').slice(0, 10), pinned: !!en.pinned, html: en.html || '', entry: en });
  });
  notes.forEach(n => {
    items.push({ id: 'l:' + n.id, src: 'l', type: 'lembrete', label: 'Lembrete', cls: CX_MU_NOTE_CLS[n.color] || 'y', date: (n.updatedAt || n.createdAt || '').slice(0, 10), dueDate: toDayKey(n.dueDate) || '', done: !!n.done, title: n.title || '', text: n.content || '', note: n });
  });
  return items;
}
/* Ordem: fixadas → lembretes vencidos → lembretes por data → demais por data (desc) → lembretes feitos. */
function cxMuSort(items, todayIso) {
  const rank = (it) => {
    if (it.src === 'd' && it.pinned) return [0, it.date || ''];
    if (it.src === 'l') {
      if (it.done) return [4, it.date || ''];
      if (it.dueDate && it.dueDate < todayIso) return [1, it.dueDate];
      if (it.dueDate) return [2, it.dueDate];
      return [2.5, it.date || ''];
    }
    return [3, it.date || ''];
  };
  return items.slice().sort((a, b) => {
    const x = rank(a), y = rank(b);
    if (x[0] !== y[0]) return x[0] - y[0];
    if (x[0] === 1 || x[0] === 2) return String(x[1]).localeCompare(String(y[1]));
    return String(y[1]).localeCompare(String(x[1]));
  });
}
function cxMuDuePill(it, todayIso) {
  if (it.done) return { tone: 'green', txt: 'feito' };
  const dd = daysUntil(it.dueDate);
  if (dd === null || dd === undefined) return { tone: '', txt: fmtDate(it.dueDate) };
  if (it.dueDate < todayIso) return { tone: 'red', txt: 'vencido há ' + cxPl(-dd, 'dia', 'dias') };
  if (dd === 0) return { tone: 'yellow', txt: 'hoje' };
  return { tone: '', txt: dd === 1 ? 'amanhã' : 'em ' + dd + ' dias' };
}
function CxBfMural({ op, data, upsert, setModal }) {
  const briefing = op.briefing || {};
  const entries = getBriefingEntries(briefing);
  const todayIso = localIso(new Date());
  const [filter, setFilter] = React.useState('tudo');
  const [menu, setMenu] = React.useState(false);
  const [composer, setComposer] = React.useState(null); // null | { mode:'new'|'edit', entry }
  const [draftType, setDraftType] = React.useState('observacao');
  const [draftDate, setDraftDate] = React.useState('');
  const [draftPin, setDraftPin] = React.useState(false);
  const [draftInReport, setDraftInReport] = React.useState(false);
  const inReportManual = React.useRef(false); // depois do clique do usuário, trocar o tipo não mexe mais na marca
  const draftHtmlRef = React.useRef('');
  const items = React.useMemo(() => cxMuItems(op, data), [op, data.stickyNotes]);
  const hasRepl = items.some(i => i.type === 'replicacao');
  const sorted = cxMuSort(items, todayIso);
  const visible = filter === 'tudo' ? sorted : sorted.filter(i => i.type === filter);
  const countOf = (k) => k === 'tudo' ? items.length : items.filter(i => i.type === k).length;

  const materialize = (list) => list.map(en => en._legacy
    ? { id: en.id, type: en.type, html: en.html, pinned: !!en.pinned, eventDate: en.eventDate || '', createdAt: en.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), migrated: true }
    : en);
  const persist = (list) => { upsert('operations', { ...op, briefing: { ...briefing, entries: materialize(list) } }); };
  const openNew = () => { setDraftType('observacao'); setDraftDate(todayIso); setDraftPin(false); inReportManual.current = false; setDraftInReport(diaryEntryInReport({ type: 'observacao' })); setComposer({ mode: 'new', entry: null }); };
  const openEdit = (en) => { setDraftType(en.type || 'observacao'); setDraftDate(en.eventDate || ''); setDraftPin(!!en.pinned); inReportManual.current = typeof en.inReport === 'boolean'; setDraftInReport(diaryEntryInReport(en)); setComposer({ mode: 'edit', entry: en }); };
  const pickType = (t) => { setDraftType(t); if (!inReportManual.current) setDraftInReport(diaryEntryInReport({ type: t })); };
  const saveComposer = () => {
    const clean = sanitizeNoteHtml(draftHtmlRef.current);
    if (!htmlToPlainText(clean)) { alert('A entrada está vazia.'); return; }
    const now = new Date().toISOString();
    if (composer.mode === 'new') {
      persist([{ id: uid(), type: draftType, html: clean, pinned: draftPin, eventDate: draftDate || '', inReport: draftInReport, createdAt: now, updatedAt: now }, ...entries]);
    } else {
      persist(entries.map(x => x.id === composer.entry.id
        ? { id: x.id, type: draftType, html: clean, pinned: draftPin, eventDate: draftDate || '', inReport: draftInReport, createdAt: x.createdAt || now, updatedAt: now, migrated: !!(x.migrated || x._legacy) }
        : x));
    }
    setComposer(null);
  };
  const removeEntry = () => { if (!confirm('Excluir esta entrada?')) return; persist(entries.filter(x => x.id !== composer.entry.id)); setComposer(null); };
  const toggleDone = (it) => upsert('stickyNotes', { ...it.note, done: !it.note.done });
  const openItem = (it) => { if (it.src === 'd') openEdit(it.entry); else setModal({ type: 'edit', entityType: 'stickyNote', initial: it.note }); };
  const addReminder = () => { setMenu(false); setModal({ type: 'create', entityType: 'stickyNote', initial: { operationId: op.id, color: 'yellow' } }); };
  const addEntry = () => { setMenu(false); setFilter('tudo'); openNew(); };

  return <CxFoldCard id="mural" scope="visao" title="Mural" count={items.length} ariaLabel="Mural" className="cx-mu"
    summary={items.length ? cxPl(items.length, 'nota', 'notas') : 'nenhuma nota'}
    actions={<span className="cx-mu-add">
      <button type="button" className="cx-link-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(v => !v)}><CxIcon n="plus" s={12} />Nota</button>
      {menu ? <>
        <div className="cx-menu-scrim" onClick={() => setMenu(false)} />
        <div className="cx-menu-pop" role="menu">
          <button type="button" role="menuitem" onClick={addReminder}>Lembrete</button>
          <button type="button" role="menuitem" onClick={addEntry}>Entrada do diário</button>
        </div>
      </> : null}
    </span>}>
    {composer ? <div className="cx-mu-comp">
      <div className="cx-bf-diary-composer-hd">
        <select value={draftType} onChange={e => pickType(e.target.value)} className="cx-input" style={{ width: 'auto' }} aria-label="Tipo da entrada">
          {Object.entries(BRIEFING_ENTRY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} className="cx-input" style={{ width: 'auto' }} title="Data do fato (opcional)" aria-label="Data do fato" />
        <button type="button" className={'cx-bf-inrep' + (draftInReport ? ' on' : '')} aria-pressed={draftInReport} title="No relatório" aria-label="No relatório" onClick={() => { inReportManual.current = true; setDraftInReport(v => !v); }}><CxIcon n="file" s={13} /></button>
        <label className="cx-mu-pin"><input type="checkbox" checked={draftPin} onChange={e => setDraftPin(e.target.checked)} />Fixar</label>
        <span className="cx-sp" />
        {composer.mode === 'edit' ? <button type="button" className="cx-btn sm ghost" onClick={removeEntry}>Excluir</button> : null}
        <button type="button" className="cx-btn sm ghost" onClick={() => setComposer(null)}>Cancelar</button>
        <button type="button" className="cx-btn sm primary" onClick={saveComposer}>{composer.mode === 'new' ? 'Adicionar' : 'Salvar'}</button>
      </div>
      <RichNoteEditor key={composer.mode + (composer.entry ? composer.entry.id : '')} initialHtml={composer.mode === 'edit' ? (composer.entry.html || '') : ''} placeholder="Registrar risco, estratégia, decisão, providência…" draftRef={draftHtmlRef} autoFocus />
    </div> : null}
    <div className="cx-mu-f" role="group" aria-label="Filtrar o mural">
      {CX_MU_FILTERS.filter(f => f[0] !== 'replicacao' || hasRepl).map(([k, lab, ic]) => <button key={k} type="button" className="cx-mu-fb" aria-pressed={filter === k} aria-label={lab}
        {...cxHintProps(() => ({ title: lab + ' · ' + countOf(k) }))} onClick={() => setFilter(k)}><CxIcon n={ic} s={14} /></button>)}
    </div>
    <div className="cx-mu-grid">
      {visible.map(it => {
        const pill = it.src === 'l' && it.dueDate ? cxMuDuePill(it, todayIso) : null;
        return <article key={it.id} className={'cx-pi ' + it.cls + (it.pinned ? ' pin' : '') + (it.done ? ' done' : '')} role="button" tabIndex={0}
          onClick={() => openItem(it)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); openItem(it); } }}>
          <div className="cx-pi-h">
            {it.src === 'l' ? <button type="button" className="cx-rchk" role="checkbox" aria-checked={it.done} aria-label={it.done ? 'Reabrir lembrete' : 'Concluir lembrete'}
              onClick={e => { e.stopPropagation(); toggleDone(it); }} onKeyDown={e => e.stopPropagation()}><CxIcon n="tick" s={9} /></button> : null}
            {it.pinned ? <span className="cx-pi-pin" title="Fixada" role="img" aria-label="Fixada"><CxIcon n="pin" s={11} /></span> : null}
            <span className="cx-pi-lab">{it.label}</span>
            {it.src === 'd' && diaryEntryInReport(it.entry) ? <span className="cx-pi-rep" title="Entra na Base do relatório" role="img" aria-label="No relatório"><CxIcon n="file" s={10} /></span> : null}
            <span className="cx-pi-d">{it.date ? fmtDate(it.date) : ''}</span>
          </div>
          {it.src === 'l'
            ? <div className="cx-pi-t">{it.title ? <b>{it.title}: </b> : null}{it.text}</div>
            : <div className="cx-pi-t cx-pi-rich" dangerouslySetInnerHTML={{ __html: mapRichTextColors(it.html) }} />}
          {pill ? <div className="cx-pi-f"><span className={'cx-pi-pill ' + pill.tone}><CxIcon n="clock" s={11} />{fmtDate(it.dueDate)} · {pill.txt}</span></div> : null}
        </article>;
      })}
      {!visible.length ? <div className="cx-empty-row cx-mu-empty">{items.length ? 'Nenhuma nota neste filtro.' : 'Nenhuma nota. Use + Nota para registrar um lembrete ou uma entrada do diário.'}</div> : null}
    </div>
  </CxFoldCard>;
}

/* ─── Painel de apoio (Visão geral) ───
   Abas: O que vem · Prazos extintivos · Checklists · Fontes · Atuações recentes. Cada aba mostra o conteúdo dos antigos cartões,
   sem o cartão em volta. A aba escolhida fica lembrada (localStorage). */
const CX_AP_TAB_KEY = 'nexus_cx_apoio_tab';
const CX_AP_TABS = [['vem', 'O que vem'], ['prazos', 'Prazos extintivos'], ['check', 'Checklists'], ['fontes', 'Fontes'], ['atu', 'Atuações recentes']];
function CxBfApoio({ op, data, prazosRadar, prescLookup, split, mesaCards, execs, upsert, onOpenTimeline, onOpenPrazos, onOpenCda, onOpenProc, onOpenIntim, onOpenTask, onOpenProativa, hz, nr }) {
  const [tab, setTabS] = React.useState(() => { const v = cxLs(CX_AP_TAB_KEY, 'vem'); return CX_AP_TABS.some(t => t[0] === v) ? v : 'vem'; });
  const setTab = (v) => { setTabS(v); try { localStorage.setItem(CX_AP_TAB_KEY, v); } catch (e) { /* ignore */ } };
  const todayIso = localIso(new Date());
  const vemN = React.useMemo(() => cxBuildHorizon(data, [op.id], prazosRadar, todayIso).items.length, [data, op.id, prazosRadar, todayIso]);
  const atuN = React.useMemo(() => cxAtuRows(op, data, execs).length, [op, data.intimations, data.tasks, data.executions, execs]);
  const chk = cxChkCounts(op.briefing);
  const nSrc = cxBfLinks(op.briefing || {}).length;
  /* Prazos extintivos da operação: as CDAs dos cartões «a agir» da Mesa (fileira 1), na ordem dos cartões — o mesmo número do menu. */
  const needs = React.useMemo(() => {
    const out = [];
    MESA_CARDS.filter(c => c.fileira === 1).forEach(c => ((mesaCards && mesaCards.byCard[c.id]) || []).forEach(it => { if (mesaIsAction(it) && it.debt && it.debt.operationId === op.id) out.push(it); }));
    return out;
  }, [mesaCards, op.id]);
  const vigiarN = ((mesaCards && mesaCards.byCard.vigiar) || []).filter(it => it.debt && it.debt.operationId === op.id).length;
  const counts = { vem: vemN, prazos: needs.length, check: chk.done + '/' + chk.total, fontes: nSrc, atu: atuN };
  const onKey = (e) => {
    const i = CX_AP_TABS.findIndex(t => t[0] === tab);
    let j = i;
    if (e.key === 'ArrowRight') j = (i + 1) % CX_AP_TABS.length; else if (e.key === 'ArrowLeft') j = (i + CX_AP_TABS.length - 1) % CX_AP_TABS.length; else return;
    e.preventDefault(); setTab(CX_AP_TABS[j][0]);
    setTimeout(() => { const el = document.getElementById('cx-ap-tab-' + CX_AP_TABS[j][0]); if (el) el.focus(); }, 0);
  };
  return <CxFoldCard id="apoio" scope="visao" title="Painel de apoio" ariaLabel="Painel de apoio" className="cx-ap"
    summary={CX_AP_TABS.map(t => t[1]).join(' · ')}>
    <div className="cx-ap-tabs" role="tablist" aria-label="Painel de apoio" onKeyDown={onKey}>
      {CX_AP_TABS.map(([k, lab]) => <button key={k} type="button" role="tab" id={'cx-ap-tab-' + k} aria-selected={tab === k} aria-controls="cx-ap-panel" tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}>
        {lab}<span className={'cx-ap-n' + (k === 'prazos' && needs.length ? ' red' : '')}>{counts[k]}</span>
      </button>)}
    </div>
    <div id="cx-ap-panel" role="tabpanel" aria-labelledby={'cx-ap-tab-' + tab} className="cx-ap-body">
      {tab === 'vem' ? <CxOqVem bare op={op} data={data} prazosRadar={prazosRadar} prescLookup={prescLookup} onOpenTimeline={onOpenTimeline} hz={hz} nr={nr} /> : null}
      {tab === 'prazos' ? <div className="cx-ap-pane">
        <div className="cx-ap-tools"><button type="button" className="cx-link-btn" onClick={onOpenPrazos}>Mesa<CxIcon n="chevR" s={13} /></button></div>
        {needs.length ? needs.slice(0, 8).map(it => { const ck = mesaItemClock(it, todayIso); return <button key={it.debtId} type="button" className="cx-dl-item" onClick={() => onOpenCda({ id: it.debtId, operationId: op.id })}>
          <CxIcon n="hourglass" s={13} className="cx-muted" />
          <span className="cx-t"><span className="cx-mono" style={{ fontSize: 11.5 }}>{(it.debt && it.debt.cdaNumber) || 'S/N'}</span> · {mesaCardName(it.card)}</span>
          {ck ? <span className={'cx-due' + (ck.late ? ' late' : '')}>{ck.text}</span> : null}
        </button>; }) : <div className="cx-empty-row">Nada a agir agora{vigiarN ? ' · ' + cxPl(vigiarN, 'CDA só em vigilância', 'CDAs só em vigilância') : ''}.</div>}
        {needs.length > 8 ? <div className="cx-more">+{needs.length - 8} na Mesa de prazos</div> : null}
      </div> : null}
      {tab === 'check' ? <CxBfChecklists bare op={op} upsert={upsert} /> : null}
      {tab === 'fontes' ? <CxBfSources bare op={op} upsert={upsert} /> : null}
      {tab === 'atu' ? <CxBfAtuacoes bare op={op} data={data} execs={execs} upsert={upsert} onOpenIntim={onOpenIntim} onOpenTask={onOpenTask} onOpenProativa={onOpenProativa} onOpenProc={onOpenProc} /> : null}
    </div>
  </CxFoldCard>;
}

/* ─── Seções do antigo Briefing, agora parte da Visão geral (P6) ───
   Cada seção é um componente próprio: lê `op.briefing`/os dados e grava pelas mesmas funções do app (upsert, setModal,
   setData), como o Briefing fazia. Os cartões usam o escopo de recolher/expandir 'visao' (cxUseFold). A aba "Briefing"
   deixou de existir no Prumo ('notas' é só um apelido de 'visao'); o Clássico e a Beta seguem com o painel antigo. */

/* Estado (localStorage) do recolher/expandir de cada frente processual (por id da frente — item 11).
   Os três blocos da área de trabalho da fase (item 12: evento, notas, efs) e os cartões da página usam cxUseFold('visao'). */
function cxLoadBfLanes() {
  try { const raw = JSON.parse(localStorage.getItem('nexus_cx_bf_lanes') || 'null'); if (raw && typeof raw === 'object') return raw; } catch (e) { /* ignore */ }
  return {};
}
function cxSaveBfLanes(v) { try { localStorage.setItem('nexus_cx_bf_lanes', JSON.stringify(v)); } catch (e) { /* ignore */ } }

/* Novidades do último import (faixa no topo da Visão geral) */
function CxBfNews({ data, opId, setData }) {
  const [newsOpen, setNewsOpen] = React.useState(false);
  const opLogs = (data.importLogs || []).filter(l => l.operationId === opId && l.diff && !l.seen).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  const lastLog = opLogs[0];
  const d = lastLog && lastLog.diff;
  const newsTotal = d ? ((d.newDebts?.length || 0) + (d.newExecs?.length || 0) + (d.newAssets?.length || 0) + (d.newPeople?.length || 0) + (d.changedDebts?.length || 0) + (d.changedAssets?.length || 0)) : 0;
  return (<>
    {lastLog && newsTotal > 0 && (
      <div className="cx-bf-news">
        <span className="cx-bf-news-ic">{newsTotal}</span>
        <b>Novidades do último import</b>
        <span className="cx-muted">{new Date(lastLog.timestamp).toLocaleString('pt-BR')} · {(lastLog.fileNames || []).join(', ')}</span>
        <span className="cx-sp" />
        <button type="button" className="cx-btn sm" onClick={() => setNewsOpen(o => !o)}>{newsOpen ? 'Ocultar' : 'Ver'}</button>
        <button type="button" className="cx-btn sm ghost" onClick={() => setData(prev => ({ ...prev, importLogs: (prev.importLogs || []).map(l => l.id === lastLog.id ? { ...l, seen: true } : l) }))}>✓ Marcar como visto</button>
      </div>
    )}
    {newsOpen && d && (
      <div className="cx-bf-news-detail">
        {d.newDebts?.length > 0 && <div><b className="cx-green-t">+ {d.newDebts.length} CDA(s) nova(s)</b>{d.newDebts.slice(0, 6).map(x => <div key={x.id} className="cx-small">{x.cdaNumber || 'CDA'} — {fmtCur(x.value || 0)}</div>)}</div>}
        {d.newExecs?.length > 0 && <div><b className="cx-green-t">+ {d.newExecs.length} processo(s) novo(s)</b>{d.newExecs.slice(0, 6).map(x => <div key={x.id} className="cx-small cx-mono">{x.processNumber || 'S/N'}</div>)}</div>}
        {d.newAssets?.length > 0 && <div><b className="cx-green-t">+ {d.newAssets.length} bem(ns) novo(s)</b>{d.newAssets.slice(0, 6).map(x => <div key={x.id} className="cx-small">{x.description || 'Bem'}</div>)}</div>}
        {d.newPeople?.length > 0 && <div><b className="cx-green-t">+ {d.newPeople.length} pessoa(s) nova(s)</b>{d.newPeople.slice(0, 6).map(x => <div key={x.id} className="cx-small">{x.name}</div>)}</div>}
        {d.changedDebts?.length > 0 && <div><b className="cx-yellow-t">~ {d.changedDebts.length} CDA(s) alterada(s)</b></div>}
        {d.changedAssets?.length > 0 && <div><b className="cx-yellow-t">~ {d.changedAssets.length} bem(ns) alterado(s)</b></div>}
      </div>
    )}
  </>);
}

/* ─── Frentes processuais (Visão geral) — tabela ───
   Linhas: IDPJ + MCF + Central + EF levada ao panorama (ordem de sempre), cada uma com os processos ligados por
   parentExecutionId recuados logo abaixo; depois o grupo "Sem incidente", "Operação (geral)" e os Acompanhar da operação.
   A linha aberta traz a régua de fases, "Evento da fase", "Notas" e uma linha de atalhos. */
const CX_BF_KIND_MAP = { APL: 'AP', EPE: 'EXC', AG: 'AI', PROC: 'PROC', OUTROS: '···' };
/* Tipo curto (chip) de um processo. */
function cxBfKind(e) {
  const tag = e && e.processTag;
  if (tag === 'idpj') return { code: 'IDPJ', cls: 'idpj', label: 'Incidente de desconsideração da personalidade jurídica' };
  if (tag === 'cautelar_fiscal') return { code: 'MCF', cls: 'mcf', label: 'Medida cautelar fiscal' };
  if (tag === 'central') return { code: 'Central', cls: 'central', label: 'Execução fiscal de destaque' };
  if (isPeticaoIncidenteEf(e)) return { code: 'INC', cls: 'inc', label: 'Petição cível — incidente em execução fiscal' };
  if (isExecucaoFiscalClass(e)) return { code: 'EF', cls: 'ef', label: 'Execução fiscal' };
  const sp = otherSpecies(e);
  const code = CX_BF_KIND_MAP[sp.code] || sp.code;
  const cls = code === 'EMB' || code === 'ET' || code === 'ED' ? 'emb' : code === 'EXC' ? 'exc' : (code === 'AI' || code === 'AP' || code === 'AGI' || code === 'RI' || code === 'RESP' || code === 'RE' || code === 'RN') ? 'rec' : 'out';
  return { code, cls, label: sp.label };
}
/* Etiqueta de vínculo da linha (principal, apensa, incidental, recurso ou "cobre N EFs"). */
function cxBfRel(e, hasParent, coveredN) {
  const tag = e && e.processTag;
  if (tag === 'idpj' || tag === 'cautelar_fiscal') return coveredN ? 'cobre ' + cxPl(coveredN, 'EF', 'EFs') : 'sem EF vinculada';
  if (tag === 'central') return coveredN ? 'principal · cobre ' + cxPl(coveredN, 'apenso', 'apensos') : 'principal';
  if (!hasParent) return coveredN ? 'principal · cobre ' + cxPl(coveredN, 'apenso', 'apensos') : 'principal';
  if (isExecucaoFiscalClass(e) && !isPeticaoIncidenteEf(e)) return 'apensa';
  const code = cxBfKind(e).code;
  if (code === 'AI' || code === 'AP' || code === 'AGI' || code === 'RI' || code === 'RESP' || code === 'RE' || code === 'RN') return 'recurso';
  if (code === 'EMB' || code === 'EXC' || code === 'ET' || code === 'ED' || code === 'INC') return 'incidental';
  return 'vinculada';
}
/* Fases de um processo: fases da EF (central) para execuções fiscais e centrais; do processo comum para o resto. */
function cxBfStages(e) {
  const efStyle = isEfStylePanoramaCard(e) || (isExecucaoFiscalClass(e) && !isIncidentProcess(e));
  return efStyle ? { STAGES: CENTRAL_STAGES, keys: Object.keys(CENTRAL_STAGES) } : { STAGES: PROCESS_STAGES, keys: Object.keys(PROCESS_STAGES) };
}
/* Régua de um processo: só eventos ocorridos (fases registradas + eventos livres), em ordem de data; `cur` = a mais recente. */
function cxBfRuler(briefing, e) {
  const { STAGES, keys } = cxBfStages(e);
  const recs = getStageRecords(briefing, e.id);
  const metas = stageMeta(STAGES, keys, recs);
  const visible = metas.filter(m => m.has || m.alwaysShow).sort(compareStagesByDate);
  const withHas = visible.filter(m => m.has);
  const cur = (withHas.length ? withHas[withHas.length - 1] : visible[visible.length - 1]) || null;
  return { STAGES, keys, recs, metas, visible, cur };
}
const CX_BF_CON_STATUS = new Set(['indisponibilidade_ativa', 'indisponibilidade_requerida']);
/* O que está em aberto num processo: intimações, tarefas, audiências, constrições e prescrição (pelo nº CNJ). */
function cxBfPending(e, data, prazoRows, today) {
  const num = e && e.processNumber;
  const has = !!normProc(num);
  const sameOp = (x) => !e.operationId || !x.operationId || x.operationId === e.operationId;
  const intims = has ? (data.intimations || []).filter(x => intimIsOpenWork(x) && sameProc(x.processNumber, num) && sameOp(x)).sort(cxAttention) : [];
  const tasks = has ? (data.tasks || []).filter(t => taskMatchesExec(e, t)).sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))) : [];
  const hearings = has ? (data.hearings || []).filter(h => h.date && h.status !== 'realizada' && h.status !== 'cancelada' && sameProc(h.processNumber, num) && sameOp(h) && daysUntil(h.date) >= 0).sort((a, b) => String(a.date).localeCompare(String(b.date))) : [];
  const assets = has ? (data.assets || []).filter(a => a.operationId === e.operationId && a.processRef && sameProc(a.processRef, num) && CX_BF_CON_STATUS.has(a.status)) : [];
  const presc = has ? (prazoRows || []).filter(r => (r.group === 1 || r.group === 2) && sameProc(r.processNumber, num)).sort((a, b) => (a.prescDays == null ? 1e9 : a.prescDays) - (b.prescDays == null ? 1e9 : b.prescDays)) : [];
  const items = [];
  intims.forEach(i => items.push({ k: 'int', iso: i.dateDeadline || '', days: i.dateDeadline ? daysUntil(i.dateDeadline) : null, txt: 'Intimação · ' + cxIntimObjetoText(i), ref: i }));
  tasks.forEach(t => items.push({ k: 'tar', iso: t.dueDate || '', days: t.dueDate ? daysUntil(t.dueDate) : null, txt: t.title || t.description || 'Tarefa', ref: t }));
  hearings.forEach(h => items.push({ k: 'aud', iso: h.date, days: daysUntil(h.date), txt: (CX_HEARING_SHORT[h.hearingType] || 'Audiência') + (h.time ? ' · ' + h.time : ''), ref: h }));
  if (presc.length) {
    const r = presc[0];
    items.push({ k: 'pre', iso: r.prescDays == null ? '' : addCalendarDays(today, r.prescDays), days: r.prescDays == null ? null : r.prescDays, txt: 'Prescrição · CDA ' + (r.cdaNumber || 'S/N'), ref: r });
  }
  items.sort((a, b) => (a.days == null ? 1e9 : a.days) - (b.days == null ? 1e9 : b.days));
  const conN = assets.length || (execShowsConstriction(e, data) ? 1 : 0);
  return { intims, tasks, hearings, assets, presc, items, conN };
}
/* Pílula de prazo da coluna "Próximo ato". */
function CxBfDue({ it }) {
  if (!it) return null;
  let tone = 'later', txt;
  if (it.k === 'pre' && it.days != null && Math.abs(it.days) > 60) { tone = it.days < 0 ? 'late' : 'later'; txt = formatPrescHorizon(it.days); }
  else if (it.days == null) { tone = 'none'; txt = 'sem prazo'; }
  else { const c = cxDue(it.days, it.iso); tone = c.tone; txt = c.txt; }
  return <span className={'cx-bft-due ' + tone}>{txt}</span>;
}
const CX_BF_SIG = [
  ['int', 'inbox', 'Intimações abertas'],
  ['tar', 'check', 'Tarefas em aberto'],
  ['aud', 'gavel', 'Audiências marcadas'],
  ['con', 'lock', 'Constrições'],
  ['pre', 'hourglass', 'Prescrição'],
];
function cxBfSigTip(k, e, pd) {
  const dm = (iso) => iso ? cxDM(iso) : 'sem prazo';
  if (k === 'int') return { title: cxPl(pd.intims.length, 'intimação aberta', 'intimações abertas'), lines: pd.intims.slice(0, 6).map(i => dm(i.dateDeadline) + ' · ' + cxPartyName(i) + ' · ' + cxIntimObjetoText(i)).concat(pd.intims.length > 6 ? ['+' + (pd.intims.length - 6)] : []) };
  if (k === 'tar') return { title: cxPl(pd.tasks.length, 'tarefa em aberto', 'tarefas em aberto'), lines: pd.tasks.slice(0, 6).map(t => dm(t.dueDate) + ' · ' + (t.title || t.description || 'Tarefa')).concat(pd.tasks.length > 6 ? ['+' + (pd.tasks.length - 6)] : []) };
  if (k === 'aud') return { title: cxPl(pd.hearings.length, 'audiência marcada', 'audiências marcadas'), lines: pd.hearings.slice(0, 6).map(h => cxDM(h.date) + (h.time ? ' ' + h.time : '') + ' · ' + (CX_HEARING[h.hearingType] || 'Audiência')) };
  if (k === 'con') return { title: pd.assets.length ? cxPl(pd.assets.length, 'bem com constrição', 'bens com constrição') : 'Constrição registrada no processo', lines: pd.assets.slice(0, 6).map(a => a.description || a.name || 'Bem') };
  return { title: cxPl(pd.presc.length, 'CDA com prazo extintivo a decidir', 'CDAs com prazo extintivo a decidir'), lines: pd.presc.slice(0, 6).map(r => (r.cdaNumber || 'S/N') + ' · ' + (r.prescDays == null ? '—' : formatPrescHorizon(r.prescDays))) };
}
function CxBfSignals({ e, pd }) {
  const n = { int: pd.intims.length, tar: pd.tasks.length, aud: pd.hearings.length, con: pd.conN, pre: pd.presc.length };
  const red = {
    int: pd.intims.some(i => i.dateDeadline && daysUntil(i.dateDeadline) < 0),
    tar: pd.tasks.some(t => t.dueDate && daysUntil(t.dueDate) < 0),
    aud: false, con: false,
    pre: pd.presc.some(r => r.prescDays != null && r.prescDays < 0),
  };
  return <div className="cx-bft-sg">
    {CX_BF_SIG.map(([k, ic, label]) => n[k] ? <span key={k} className={'s' + (red[k] ? ' red' : '')} role="img" tabIndex={0}
      aria-label={label + ': ' + n[k]} {...cxHintProps(() => { const t = cxBfSigTip(k, e, pd); return { when: label, title: t.title, lines: t.lines, tone: red[k] ? 'late' : '' }; })}>
      <CxIcon n={ic} s={13} /><b>{n[k]}</b>
    </span> : <span key={k} className="s e" />)}
  </div>;
}
/* Valor da frente: CDAs do próprio processo + as dos cobertos (sem contar duas vezes). */
function cxBfValue(e, covered, opDebts) {
  const seen = new Set([e.id]);
  let val = execCdaValue(e, opDebts);
  let n = (opDebts || []).filter(d => sameProc(d.processNumber, e.processNumber)).length;
  (covered || []).forEach(c => {
    if (!c || seen.has(c.id)) return;
    seen.add(c.id);
    val += execCdaValue(c, opDebts);
    n += (opDebts || []).filter(d => sameProc(d.processNumber, c.processNumber)).length;
  });
  return { val, n };
}
function cxMoneyMi(v) {
  v = v || 0;
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi';
  return cxMoneyShort(v);
}
function cxNoteText(raw) { return typeof raw === 'string' ? raw : ((raw && (raw.text || raw.content || raw.body)) || ''); }
function cxNoteDate(raw) {
  if (!raw || typeof raw === 'string') return '';
  const d = raw.date || raw.createdAt || '';
  return d ? fmtDate(String(d).slice(0, 10)) : '';
}

/* Parte aberta de uma linha: régua + Evento da fase + Notas + atalhos. */
function CxBfFrontX({ e, op, data, upsert, setModal, pd, prazoRows, retirable, onOpenTab, onOpenPrazos, onOpenIntim, onOpenHearing, onOpenProc }) {
  const briefing = op.briefing || {};
  const R = cxBfRuler(briefing, e);
  const [sel, setSel] = React.useState(null);
  const [popup, setPopup] = React.useState(null);
  const [addMenu, setAddMenu] = React.useState(false);
  const [noteEdit, setNoteEdit] = React.useState(null); // { idx, val, atu } — atu: nota de atuação (edição em texto puro)
  const [evEdit, setEvEdit] = React.useState(null); // chave da fase cujo texto está em edição inline
  const [noteDel, setNoteDel] = React.useState(null); // índice da nota aguardando confirmação de exclusão
  const [composeKey, setComposeKey] = React.useState(0);
  const focused = R.visible.find(m => m.k === sel) || R.cur;
  const setRec = (sk, patch) => cxStageSetRec(op, upsert, e.id, sk, patch);
  const delRec = (sk) => cxStageDelRec(op, upsert, e.id, sk);
  const pick = (sk) => { setSel(sk); setPopup(sk); setAddMenu(false); };
  const addStage = (sk) => {
    const sd = R.STAGES[sk];
    const patch = sd && sd.multiRecurso ? { _present: true, recursos: [emptyRecurso()] } : sd && sd.textOnly ? { _present: true, texto: '' } : { _present: true, date: '', evento: '', texto: '', outcome: '' };
    setRec(sk, patch); pick(sk);
  };
  const addCustomStage = (name) => {
    const label = String(name || '').trim(); if (!label) return;
    const sk = 'custom_' + uid();
    setRec(sk, { _present: true, _custom: true, label, date: '', evento: '', texto: '', outcome: '' }); pick(sk);
  };
  const addRecursoStage = () => {
    const unused = R.metas.find(m => m.sd.multiRecurso && !m.has);
    if (unused) { addStage(unused.k); return; }
    const sk = 'recurso_' + uid();
    setRec(sk, { _present: true, _custom: true, multiRecurso: true, label: 'Recurso', recursos: [emptyRecurso()] }); pick(sk);
  };
  const rawNotes = e.notesList || (e.notes ? [e.notes] : []);
  const notes = rawNotes.map((n, idx) => ({ n, idx })).filter(({ n }) => !isRedundantImportedProcessNote(n));
  const setNotes = (arr) => upsert('executions', { ...e, notesList: arr });
  /* Notas: texto com marcação leve (**negrito**, *itálico*, "- ", "1. ", [texto](url)) — o Clássico mostra o texto legível. */
  const addNote = (html) => {
    const md = htmlToMdNote(html);
    if (!md) return;
    setNotes([...rawNotes, md]);
    setComposeKey(k => k + 1);
  };
  const startEdit = (idx, raw) => {
    const txt = cxNoteText(raw);
    const atu = presentAtuacaoProcessNote(txt);
    setNoteDel(null);
    setNoteEdit({ idx, val: atu ? atu.text : txt, atu: !!atu });
  };
  const saveRichEdit = (html) => {
    if (!noteEdit) return;
    const md = htmlToMdNote(html);
    const idx = noteEdit.idx;
    setNoteEdit(null);
    if (!md) return;
    setNotes(replaceNoteText(rawNotes, idx, md));
  };
  const saveEdit = () => {
    if (!noteEdit) return;
    const next = noteEdit.val.trim();
    const raw = rawNotes[noteEdit.idx];
    if (!noteEdit.atu) return;
    setNoteEdit(null);
    if (!next) return;
    const txt = cxNoteText(raw);
    const atu = presentAtuacaoProcessNote(txt);
    let stored = next;
    if (atu && atu.url) {
      const body = next.replace(/^Registro de atuação:\s*/, '').trim();
      stored = (body ? `Registro de atuação: ${body}` : 'Registro de atuação') + ` / Peça: ${atu.url}`;
    }
    const arr = rawNotes.slice();
    if (raw && typeof raw === 'object') { const key = ['text', 'content', 'body'].find(k => raw[k] != null) || 'text'; arr[noteEdit.idx] = { ...raw, [key]: stored }; }
    else arr[noteEdit.idx] = stored;
    setNotes(arr);
  };
  const m = focused;
  const phaseTitle = m ? m.sd.label : '';
  const outcomeCls = (o) => (o === 'favoravel' || o === 'provido') ? 'fav' : (o === 'desfavoravel' || o === 'nao_provido') ? 'des' : o === 'pendente' ? 'par' : '';
  const nearestPresc = pd.presc.length && pd.presc[0].prescDays != null ? addCalendarDays(localIso(new Date()), pd.presc[0].prescDays) : '';
  const lateIntims = pd.intims.filter(i => i.dateDeadline && daysUntil(i.dateDeadline) < 0).length;
  const shortcuts = [];
  if (pd.intims.length) shortcuts.push(<button key="i" type="button" className={'cx-link-btn' + (lateIntims ? ' red' : '')} onClick={() => onOpenIntim(pd.intims[0].id)}><CxIcon n="inbox" s={12} />Intimações <b>{pd.intims.length}</b>{lateIntims ? ' · ' + cxPl(lateIntims, 'vencida', 'vencidas') : ''}</button>);
  if (pd.tasks.length) shortcuts.push(<button key="t" type="button" className="cx-link-btn" onClick={() => onOpenTab('tarefas')}><CxIcon n="check" s={12} />Tarefas <b>{pd.tasks.length}</b></button>);
  if (pd.hearings.length) shortcuts.push(<button key="a" type="button" className="cx-link-btn" onClick={() => onOpenHearing(pd.hearings[0])}><CxIcon n="gavel" s={12} />Audiências <b>{pd.hearings.length}</b></button>);
  if (pd.presc.length) shortcuts.push(<button key="p" type="button" className={'cx-link-btn' + (pd.presc[0].prescDays != null && pd.presc[0].prescDays < 0 ? ' red' : '')} onClick={onOpenPrazos}><CxIcon n="hourglass" s={12} />Prescrição{nearestPresc ? ' ' + cxDM(nearestPresc) : ''}</button>);
  return <div className="cx-bfx">
    <div className="cx-bfx-r">
      <ol className="cx-bfx-ruler" aria-label="Fases do processo">
        {R.visible.map(s => {
          const isCur = R.cur && R.cur.k === s.k;
          const idxCur = R.visible.findIndex(x => x.k === (R.cur && R.cur.k));
          const idx = R.visible.indexOf(s);
          const state = isCur ? 'cur' : idx < idxCur ? 'done' : 'done';
          const d = stageEventDate(s);
          const l2 = [d ? fmtDate(d) : '', s.rec && s.rec.evento ? 'Ev. ' + s.rec.evento : ''].filter(Boolean).join(' · ') || (s.sd.multiRecurso && (s.recursos || []).length ? cxPl(s.recursos.length, 'julgamento', 'julgamentos') : '');
          const compl = (s.k === 'constricoes' || s.k === 'garantia') && s.rec && s.rec.texto ? String(s.rec.texto).trim().split(/\n/)[0].slice(0, 26) : '';
          const on = focused && focused.k === s.k;
          return <li key={s.k} className={'rs ' + state + (on ? ' sel' : '')}>
            <button type="button" className="bt" aria-pressed={on} aria-label={s.sd.label + (isCur ? ' (atual)' : '')} onClick={() => { setSel(s.k); setEvEdit(null); }}>
              <span className="rd" /><span className="rl">{s.sd.label}</span><span className="re">{l2 || '\u00a0'}</span>
              {compl ? <span className="rt"><CxIcon n="lock" s={10} />{compl}</span> : null}
            </button>
          </li>;
        })}
        <li className="rs add">
          <button type="button" className="bt" aria-expanded={addMenu} onClick={() => setAddMenu(v => !v)}><span className="rd"><CxIcon n="plus" s={9} /></span><span className="rl">Evento</span><span className="re">{'\u00a0'}</span></button>
          {addMenu ? <>
            <div className="cx-menu-scrim" onClick={() => setAddMenu(false)} />
            <div className="cx-menu-pop cx-bf-addmenu">
              <input autoFocus placeholder="digite o nome e Enter (evento livre)" onKeyDown={ev => { if (ev.key === 'Enter' && ev.target.value.trim()) addCustomStage(ev.target.value.trim()); else if (ev.key === 'Escape') setAddMenu(false); }} />
              <button type="button" onClick={addRecursoStage}>Recurso</button>
              {R.metas.filter(x => !x.has && !x.alwaysShow && !x.sd.custom && !x.sd.multiRecurso).map(x => <button key={x.k} type="button" onClick={() => addStage(x.k)}>{x.sd.label}</button>)}
            </div>
          </> : null}
        </li>
      </ol>
    </div>
    <div className="cx-bfx-box cx-bfx-ev">
      <div className="cx-bfx-bh"><h3>Evento da fase</h3><span className="push" />
        {m && !m.sd.multiRecurso ? <>
          <button type="button" className={'cx-icon-btn cx-sm' + (evEdit === m.k ? ' on' : '')} title="Editar o texto da fase" aria-label="Editar o texto da fase" onClick={() => setEvEdit(evEdit === m.k ? null : m.k)}><CxIcon n="edit" s={13} /></button>
          <button type="button" className="cx-icon-btn cx-sm" title="Data, evento, desfecho e outros campos" aria-label="Data, evento, desfecho e outros campos da fase" onClick={() => setPopup(m.k)}><CxIcon n="settings" s={13} /></button>
        </> : null}
        {m && m.sd.multiRecurso ? <button type="button" className="cx-icon-btn cx-sm" title="Editar fase" aria-label="Editar fase" onClick={() => setPopup(m.k)}><CxIcon n="edit" s={13} /></button> : null}
      </div>
      {m ? <>
        <div className="cx-bfx-evh">
          <strong>{phaseTitle}</strong>
          {!m.sd.multiRecurso && m.rec && m.rec.date ? <span className="m">{fmtDate(m.rec.date)}</span> : null}
          {!m.sd.multiRecurso && m.rec && m.rec.evento ? <span className="evn">Ev. {m.rec.evento}</span> : null}
          {m.outcomeLabel ? <span className={'oc ' + outcomeCls(m.rec.outcome)}>{m.outcomeLabel}</span> : null}
        </div>
        {m.sd.multiRecurso ? (
          (m.recursos || []).length ? <ol className="cx-bfx-rec">{m.recursos.map((r, ri) => {
            const rt = String(r.texto || '').trim();
            const oc = r.outcome && m.sd.outcomes[r.outcome];
            return <li key={ri}>
              <div className="rh">{oc ? <span className={'oc ' + outcomeCls(r.outcome)}>{oc}</span> : null}{r.parte === 'adversa' ? <span className="oc">adversa</span> : null}{r.date ? <span className="m">{fmtDate(r.date)}</span> : null}{r.proc ? <span className="m">{r.proc}</span> : null}</div>
              {rt ? <CxRichText text={rt} className="cx-bfx-rt" /> : null}
            </li>;
          })}</ol> : <div className="cx-bfx-empty">Sem julgamentos listados.</div>
        ) : (
          evEdit === m.k
            ? <CxRichEdit key={'ev-' + e.id + '-' + m.k} actions autoFocus placeholder="Texto do evento…" ariaLabel={'Texto da fase ' + phaseTitle}
                html={pickStageTextHtml(m.rec, cxSanitizeDesc) || plainToRichHtml(m.rec && m.rec.texto)}
                onCancel={() => setEvEdit(null)}
                onSave={(h) => { setRec(m.k, { ...buildStageTextPatch(h, cxSanitizeDesc), _present: true }); setEvEdit(null); }} />
            : (m.rec && String(m.rec.texto || '').trim())
              ? <CxRichText className="cx-bfx-rt" text={String(m.rec.texto).trim()} html={pickStageTextHtml(m.rec, cxSanitizeDesc)} />
              : <div className="cx-bfx-empty">Sem texto neste evento. <button type="button" className="cx-link-btn" onClick={() => setEvEdit(m.k)}>Escrever</button></div>
        )}
      </> : <div className="cx-bfx-empty">Nenhuma fase registrada. Use “+ Evento” na régua.</div>}
    </div>
    <div className="cx-bfx-box cx-bfx-nt">
      <div className="cx-bfx-bh"><h3>Notas</h3><span className="cx-bfx-n">{notes.length}</span></div>
      <div className="cx-bfx-nl">
        {[...notes].reverse().map(({ n, idx }) => { /* gravadas em sequência; exibidas da mais recente para a mais antiga */
          const dt = cxNoteDate(n);
          const editing = noteEdit && noteEdit.idx === idx;
          const atu = presentAtuacaoProcessNote(cxNoteText(n));
          return <div key={idx} className="cx-bfx-note">
            {editing && noteEdit.atu
              ? <input className="cx-bfx-ni" autoFocus value={noteEdit.val} onChange={ev => setNoteEdit({ ...noteEdit, val: ev.target.value })}
                  onKeyDown={ev => { if (ev.key === 'Enter') { ev.preventDefault(); saveEdit(); } else if (ev.key === 'Escape') setNoteEdit(null); }} onBlur={saveEdit} />
              : editing
                ? <CxRichEdit key={'ne-' + idx} actions autoFocus ariaLabel="Editar nota" html={mdNoteToHtml(cxNoteText(n))} onCancel={() => setNoteEdit(null)} onSave={saveRichEdit} />
                : atu
                  ? <div className="t">{renderProcessNote(n)}</div>
                  : <div className="t cx-nt-rich" dangerouslySetInnerHTML={{ __html: mdNoteToHtml(cxNoteText(n)) }} />}
            {!editing || noteEdit.atu ? <div className="f">
              {dt ? <time>{dt}</time> : null}
              {noteDel === idx
                ? <span className="cx-bfx-del" role="group" aria-label="Confirmar exclusão">Excluir esta nota?
                    <button type="button" className="cx-link-btn red" autoFocus onClick={() => { setNotes(rawNotes.filter((_, j) => j !== idx)); setNoteDel(null); }}>Excluir</button>
                    <button type="button" className="cx-link-btn" onClick={() => setNoteDel(null)}>Manter</button></span>
                : <span className="na">
                    <button type="button" className="cx-icon-btn cx-sm" title="Editar nota" aria-label="Editar nota" onMouseDown={ev => ev.preventDefault()} onClick={() => startEdit(idx, n)}><CxIcon n="edit" s={12} /></button>
                    <button type="button" className="cx-icon-btn cx-sm del" title="Excluir nota" aria-label="Excluir nota" onClick={() => setNoteDel(idx)}><CxIcon n="x" s={12} /></button>
                  </span>}
            </div> : null}
          </div>;
        })}
        {!notes.length ? <div className="cx-bfx-empty">Nenhuma nota.</div> : null}
      </div>
      <div className="cx-bfx-compose">
        <CxRichEdit key={'nc-' + composeKey} compact enterSaves autoFocus={composeKey > 0} ariaLabel="Nova nota do processo"
          placeholder="Escrever nota…" onSave={addNote} onCancel={() => setComposeKey(k => k + 1)} />
      </div>
    </div>
    <div className="cx-bfx-o">
      {shortcuts}
      <span className="push" />
      <button type="button" className="cx-link-btn" onClick={() => onOpenProc(e.id)}>Ficha</button>
      <button type="button" className="cx-link-btn" onClick={() => setModal({ type: 'edit', entityType: 'execution', initial: e })}>Dados</button>
      {retirable ? <button type="button" className="cx-link-btn" onClick={() => upsert('executions', { ...e, inPanorama: false })}>Retirar</button> : null}
    </div>
    {popup && (() => {
      const pm = R.metas.find(x => x.k === popup);
      if (!pm) return null;
      return <StagePopup key={'cxstagepop-' + e.id + '-' + pm.k} sd={pm.sd} rec={pm.rec}
        onCommit={(patch) => setRec(pm.k, { ...patch, _present: true })}
        onDelete={() => { delRec(pm.k); setPopup(null); setSel(null); }}
        onAddNote={(text) => { upsert('executions', { ...e, notesList: [...(e.notesList || []), text] }); }}
        onClose={() => setPopup(null)} />;
    })()}
  </div>;
}

/* Frente processual da Visão geral do Prumo: a escolha é do usuário (`inPanorama`). Por padrão, IDPJ, MCF e
   execuções centrais; a EF de petição incidental entra como no Panorama do Clássico; qualquer outro processo
   (EF, agravo, embargos…) só entra se o usuário levar à frente. Qualquer frente pode ser retirada. */
function cxIsBfFront(e) {
  if (!e) return false;
  const active = e.status !== 'extinta' && e.status !== 'arquivada';
  if (isIncidentProcess(e)) return e.inPanorama !== false;
  if (e.processTag === 'central') return active && e.inPanorama !== false;
  if (isUserPanoramaEf(e)) return true;
  return active && e.inPanorama === true;
}
function CxBfFronts({ op, data, opExecs, opDebts, prazoRows, upsert, setModal, onOpenTab, onOpenPrazos, onOpenIntim, onOpenHearing, onOpenProc }) {
  const briefing = op.briefing || {};
  const [laneOpenMap, setLaneOpenMap] = React.useState(cxLoadBfLanes);
  const isLaneOpen = (id) => laneOpenMap[id] === true;
  const toggleLane = (id) => setLaneOpenMap(prev => { const next = { ...prev, [id]: !(prev[id] === true) }; cxSaveBfLanes(next); return next; });
  const today = localIso(new Date());

  /* ── Frentes: só o que o usuário mantém na frente (cxIsBfFront). Apensos, recursos e demais processos ficam na aba
     Processos e prescrição; aqui aparecem no texto da linha ("cobre 7 apensos") e no valor. ── */
  const fronts = opExecs.filter(cxIsBfFront);
  const frontIds = new Set(fronts.map(f => f.id));
  const coverage = computeIncidentCoverage(opExecs, opDebts);
  const keepCoveredEF = (e) => e && !isIncidentProcess(e) && isExecucaoFiscalClass(e) && e.status !== 'extinta';
  const coveredEFsFor = (front) => isEfStylePanoramaCard(front)
    ? opExecs.filter(e => e.parentExecutionId === front.id && keepCoveredEF(e))
    : (coverage.efsByIncident[front.id] || []);
  /* Fio de ligação só entre frentes: a frente cujo processo-pai também está na frente fica logo abaixo dele. */
  const kidsOf = (e) => fronts.filter(x => x.parentExecutionId === e.id && x.id !== e.id);
  const tops = fronts.filter(f => !f.parentExecutionId || !frontIds.has(f.parentExecutionId) || f.parentExecutionId === f.id);

  /* Linhas em ordem; cada grupo (<tbody>) = uma frente com a sua família. */
  const seen = new Set();
  const build = (e, depth) => {
    if (seen.has(e.id) || depth > 3) return null;
    seen.add(e.id);
    const kids = kidsOf(e).map(k => build(k, depth + 1)).filter(Boolean);
    return { e, depth, kids };
  };
  const groups = tops.map(f => build(f, 0)).filter(Boolean);
  fronts.forEach(f => { if (!seen.has(f.id)) { const g = build(f, 0); if (g) groups.push(g); } }); /* ciclo de pais: nenhuma frente se perde */
  const countNodes = (nodes) => nodes.reduce((s, n) => s + 1 + countNodes(n.kids), 0);
  const execRows = countNodes(groups);

  const opTasks = (data.tasks || []).filter(t => t.operationId === op.id && t.status !== 'concluida' && t.status !== 'cancelada' && !normProc(t.processNumber))
    .sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
  const watches = (data.watchlist || []).filter(w => w.operationId === op.id && w.status !== 'encerrado');

  /* ── Linha de processo (principal) + sua parte aberta ── */
  const renderNode = (node, last, isTop) => {
    const e = node.e;
    const open = isLaneOpen(e.id);
    const kind = cxBfKind(e);
    const covered = coveredEFsFor(e);
    const rel = cxBfRel(e, !!e.parentExecutionId, covered.length);
    const R = cxBfRuler(briefing, e);
    const pd = cxBfPending(e, data, prazoRows, today);
    const px = pd.items[0], more = pd.items.length - 1;
    const v = cxBfValue(e, covered, opDebts);
    const hasKids = node.kids.length > 0;
    const rowCls = 'r ' + (isTop ? 'parent' : 'child') + (node.depth > 2 ? ' d2' : '') + (last ? ' last' : '') + (hasKids ? ' has-kids' : '') + (open ? ' open' : '');
    const retirable = true;
    const faseTip = () => ({ when: 'Fases registradas', title: R.cur ? R.cur.sd.label + ' (atual)' : 'Nenhuma fase registrada', lines: R.visible.map(m => (R.cur && m.k === R.cur.k ? '▸ ' : '✓ ') + m.sd.label) });
    const mini = R.visible.length ? (() => {
      const idxCur = R.visible.findIndex(m => R.cur && m.k === R.cur.k);
      const w = R.visible.length > 1 ? Math.round(64 * Math.max(0, idxCur) / (R.visible.length - 1)) : 0;
      return <div className="mr" aria-hidden="true"><span className="pg" style={{ width: w + 'px' }} />{R.visible.slice(0, 9).map((m, i) => <span key={m.k} className={'d' + (i === idxCur ? ' cur' : i < idxCur ? ' done' : '')} />)}</div>;
    })() : null;
    return <React.Fragment key={e.id}>
      <tr className={rowCls} data-id={e.id} onClick={() => toggleLane(e.id)}>
        <td className="c1"><button type="button" className="chev" aria-expanded={open} aria-controls={'cx-bfx-' + e.id}
          aria-label={(open ? 'Recolher' : 'Expandir') + ' detalhes de ' + (e.processNumber || 'processo sem número')} onClick={ev => { ev.stopPropagation(); toggleLane(e.id); }}><CxIcon n="chevR" s={13} /></button></td>
        <td className="c-kind"><span className={'kind k-' + kind.cls} {...cxHintProps(() => ({ title: kind.label }))}>{kind.code}</span></td>
        <td className="c-proc"><div className="pr1"><CxCopyNum num={e.processNumber} /></div>
          <div className="pr2"><span className="cls">{e.className || kind.label}</span><span className="rel">{rel}</span></div></td>
        <td className="c-jz" {...(e.court ? cxHintProps(() => ({ title: e.court })) : {})}>{e.court || '—'}</td>
        <td className="c-fase" {...cxHintProps(faseTip)}>{R.cur ? <>{mini}<span className="fase">{R.cur.sd.label}</span></> : <span className="cx-muted">—</span>}</td>
        <td className="c-prox">{px ? <>
          <div><CxBfDue it={px} /></div>
          <div className="nxt"><span className="t">{px.txt}</span>{more > 0 ? <span className="more" {...cxHintProps(() => ({ title: more === 1 ? '1 outro item em aberto' : more + ' outros itens em aberto', lines: pd.items.slice(1, 7).map(it => (it.iso ? cxDM(it.iso) + ' · ' : '') + it.txt) }))}>+{more}</span> : null}</div>
        </> : <span className="cx-muted cx-bft-none">Nada em aberto</span>}</td>
        <td className="c-sg"><CxBfSignals e={e} pd={pd} /></td>
        <td className="c-val">{v.val > 0 ? <div className="val" {...cxHintProps(() => ({ title: fmtCur(v.val) }))}>{cxMoneyMi(v.val)}</div> : <div className="val cx-muted">—</div>}
          <div className="val-s">{v.n ? cxPl(v.n, 'CDA', 'CDAs') : (covered.length ? 'cobre' : '')}{v.n && covered.length ? ' · cobre' : ''}</div></td>
      </tr>
      {open ? <tr className={'x' + (hasKids ? ' pass' : '')} id={'cx-bfx-' + e.id}>
        <td className="gut" /><td className="xc" colSpan={7}>
          <CxBfFrontX e={e} op={op} data={data} upsert={upsert} setModal={setModal} pd={pd} prazoRows={prazoRows} retirable={retirable}
            onOpenTab={onOpenTab} onOpenPrazos={onOpenPrazos} onOpenIntim={onOpenIntim} onOpenHearing={onOpenHearing} onOpenProc={onOpenProc} />
        </td>
      </tr> : null}
    </React.Fragment>;
  };
  const renderFamily = (node, isTop) => <>
    {renderNode(node, false, isTop)}
    {node.kids.map((k, i) => <React.Fragment key={k.e.id}>{renderFamilyKid(k, i === node.kids.length - 1)}</React.Fragment>)}
  </>;
  const renderFamilyKid = (node, last) => <>
    {renderNode(node, last, false)}
    {node.kids.map((k, i) => <React.Fragment key={k.e.id}>{renderFamilyKid(k, i === node.kids.length - 1)}</React.Fragment>)}
  </>;

  const dueItemOf = (t) => ({ k: 'tar', iso: t.dueDate || '', days: t.dueDate ? daysUntil(t.dueDate) : null });
  const summary = fronts.length ? Array.from(new Set(fronts.map(f => badgeFor(f).label))).join(' · ') : 'nenhuma frente';
  const empty = !groups.length && !opTasks.length && !watches.length;
  return (
    <CxFoldCard id="frentes" scope="visao" className="cx-bf-fronts cx-bft" title="Frentes processuais" count={execRows} summary={summary}
      actions={<button type="button" className="cx-link-btn" onClick={() => setModal({ type: 'create', entityType: 'execution', initial: { operationId: op.id } })}><CxIcon n="plus" s={12} />Frente</button>}>
      {empty ? <div className="cx-empty-row">Nenhuma frente. IDPJ, MCF e execuções centrais entram por padrão; outros processos, pela ficha do processo (Levar à frente).</div> : <div className="cx-bft-tw">
        <table className="tt" aria-label="Frentes processuais da operação">
          <colgroup><col className="w-chev" /><col className="w-kind" /><col className="w-proc" /><col className="w-jz" /><col className="w-fase" /><col /><col className="w-sg" /><col className="w-val" /></colgroup>
          <thead><tr><th><span className="sr">Expandir</span></th><th>Tipo</th><th>Processo</th><th>Juízo</th><th>Fase</th><th>Próximo ato</th><th>Sinais</th><th className="r">Valor</th></tr></thead>
          {groups.map(g => <tbody key={g.e.id} className="grp">{renderFamily(g, true)}</tbody>)}
          {(opTasks.length || watches.length) ? <tbody className="grp fixed">
            {opTasks.length ? <tr className={'r parent' + (watches.length ? ' has-kids' : '')} onClick={() => onOpenTab('tarefas')}>
              <td className="c1"><span className="sp" aria-hidden="true" /></td>
              <td className="c-kind"><span className="kind k-op" {...cxHintProps(() => ({ title: 'Operação (sem processo)' }))}>OP</span></td>
              <td className="c-proc"><div className="pr1"><b className="cx-bft-grp">Operação (geral)</b></div><div className="pr2"><span className="cls">sem processo vinculado</span></div></td>
              <td className="c-jz cx-muted">—</td><td className="c-fase cx-muted">—</td>
              <td className="c-prox"><div><CxBfDue it={dueItemOf(opTasks[0])} /></div><div className="nxt"><span className="t">{opTasks[0].title || opTasks[0].description || 'Tarefa'}</span>{opTasks.length > 1 ? <span className="more">+{opTasks.length - 1}</span> : null}</div></td>
              <td className="c-sg"><div className="cx-bft-sg"><span className={'s' + (opTasks.some(t => t.dueDate && daysUntil(t.dueDate) < 0) ? ' red' : '')} role="img" tabIndex={0} aria-label={'Tarefas em aberto: ' + opTasks.length}
                {...cxHintProps(() => ({ when: 'Tarefas em aberto', title: cxPl(opTasks.length, 'tarefa', 'tarefas'), lines: opTasks.slice(0, 6).map(t => (t.dueDate ? cxDM(t.dueDate) : 'sem prazo') + ' · ' + (t.title || t.description || 'Tarefa')) }))}><CxIcon n="check" s={13} /><b>{opTasks.length}</b></span></div></td>
              <td className="c-val"><div className="val cx-muted">—</div></td>
            </tr> : null}
            {watches.map((w, i) => <tr key={w.id} className={'r child' + (i === watches.length - 1 ? ' last' : '')}>
              <td className="c1" />
              <td className="c-kind"><span className="kind k-acp" {...cxHintProps(() => ({ title: 'Acompanhar' }))}><CxIcon n="eye" s={12} /></span></td>
              <td className="c-proc"><div className="pr1"><CxCopyNum num={w.processNumber} /></div><div className="pr2"><span className="cls">{w.parties || 'Em acompanhamento'}</span>{w.reason ? <span className="rel">{w.reason}</span> : null}</div></td>
              <td className="c-jz cx-muted">—</td><td className="c-fase cx-muted">—</td><td className="c-prox cx-muted">—</td>
              <td className="c-sg"><div className="cx-bft-sg"><span className="s" role="img" tabIndex={0} aria-label="Em acompanhamento" {...cxHintProps(() => ({ when: 'Acompanhar', title: (CX_WATCH[w.status || 'aguardando'] || CX_WATCH.aguardando).l, lines: [w.reason, w.parties].filter(Boolean) }))}><CxIcon n="eye" s={13} /><b>1</b></span></div></td>
              <td className="c-val"><div className="val cx-muted">—</div></td>
            </tr>)}
          </tbody> : null}
        </table>
      </div>}
    </CxFoldCard>
  );
}

/* Fontes: links externos da operação (briefing.externalLinks; migra notebookLmUrl/docUrl antigos) */
function cxBfLinks(briefing) {
  const links = briefing.externalLinks || [];
  const out = [...links];
  if (briefing.notebookLmUrl && !links.some(l => l.url === briefing.notebookLmUrl)) out.push({ label: 'NotebookLM', url: briefing.notebookLmUrl });
  if (briefing.docUrl && !links.some(l => l.url === briefing.docUrl)) out.push({ label: 'Resumos e anotações', url: briefing.docUrl });
  return out;
}
function CxBfSources({ op, upsert, bare }) {
  const briefing = op.briefing || {};
  const fold = cxUseFold('visao');
  const [linkAdd, setLinkAdd] = React.useState(false);
  const updateBriefing = (field, value) => upsert('operations', { ...op, briefing: { ...briefing, [field]: value } });
  /* ── Fontes ── */
  const links = briefing.externalLinks || [];
  const migratedLinks = [...links];
  if (briefing.notebookLmUrl && !links.some(l => l.url === briefing.notebookLmUrl)) migratedLinks.push({ label: 'NotebookLM', url: briefing.notebookLmUrl });
  if (briefing.docUrl && !links.some(l => l.url === briefing.docUrl)) migratedLinks.push({ label: 'Resumos e anotações', url: briefing.docUrl });
  const setLinks = (next) => updateBriefing('externalLinks', next);
  const removeLink = (idx) => { const next = [...migratedLinks]; next.splice(idx, 1); setLinks(next); };
  const addLink = (url) => {
    if (!url) return;
    let label = 'Link';
    try { label = new URL(url).hostname.replace('www.', '').split('.')[0]; } catch { /* mantém padrão */ }
    setLinks([...migratedLinks, { label, url }]);
  };
  return (
    <CxFoldOrBare bare={bare} id="fontes" scope="visao" title="Fontes"
      summary={migratedLinks.length ? cxPl(migratedLinks.length, 'fonte', 'fontes') : 'nenhuma cadastrada'}
      actions={<button type="button" className="cx-link-btn" onClick={() => { fold.set('fontes', false); setLinkAdd(o => !o); }}>+ link</button>}>
      <div className="cx-bf-rail-b">
        {migratedLinks.map((lnk, idx) => (
          <div key={idx} className="cx-bf-src"><a href={lnk.url} target="_blank" rel="noopener noreferrer">{lnk.label || 'Link'}</a><button type="button" className="cx-bf-ic" onClick={() => removeLink(idx)}>✕</button></div>
        ))}
        {!migratedLinks.length && !linkAdd && <div className="cx-empty-note">Nenhuma fonte cadastrada.</div>}
        {linkAdd && <input autoFocus placeholder="colar URL e Enter" className="cx-input" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { addLink(e.target.value.trim()); e.target.value = ''; setLinkAdd(false); } else if (e.key === 'Escape') setLinkAdd(false); }} onBlur={() => setLinkAdd(false)} />}
      </div>
    </CxFoldOrBare>
  );
}

/* Checklists: 1ª vista da operação e decisão final do IDPJ */
const CX_CHK_IDPJ = [['idpj_efs', 'EFs da inicial abrangidas'], ['idpj_requeridos', 'Requeridos incluídos'], ['idpj_preclusao', 'Sem termo "preclusão"'], ['idpj_formulario', 'Formulário de indisponib.'], ['idpj_saj', 'Corresponsáveis no SAJ']];
const CX_CHK_VISTA = [['vista_triar', 'Triar a operação'], ['vista_formulario', 'Formulário de indisponib.'], ['vista_bens', 'Bens do IDPJ indisponib.'], ['vista_analisar', 'Analisar com calma']];
function cxChkCounts(briefing) {
  const chk = (briefing || {}).checklists || {};
  return { done: [...CX_CHK_IDPJ, ...CX_CHK_VISTA].filter(([k]) => chk[k]).length, total: CX_CHK_IDPJ.length + CX_CHK_VISTA.length };
}
function CxBfChecklists({ op, upsert, bare }) {
  const briefing = op.briefing || {};
  const updateBriefing = (field, value) => upsert('operations', { ...op, briefing: { ...briefing, [field]: value } });
  /* ── Checklists ── */
  const chk = briefing.checklists || {};
  const toggleChk = (key) => updateBriefing('checklists', { ...chk, [key]: !chk[key] });
  const idpjItems = [['idpj_efs', 'EFs da inicial abrangidas'], ['idpj_requeridos', 'Requeridos incluídos'], ['idpj_preclusao', 'Sem termo "preclusão"'], ['idpj_formulario', 'Formulário de indisponib.'], ['idpj_saj', 'Corresponsáveis no SAJ']];
  const vistaItems = [['vista_triar', 'Triar a operação'], ['vista_formulario', 'Formulário de indisponib.'], ['vista_bens', 'Bens do IDPJ indisponib.'], ['vista_analisar', 'Analisar com calma']];
  const checklistGroups = [
    { label: '1ª vista da operação', items: vistaItems },
    { label: 'Decisão final do IDPJ', items: idpjItems },
  ];
  const checklistDone = [...idpjItems, ...vistaItems].filter(([k]) => chk[k]).length;
  const checklistTotal = idpjItems.length + vistaItems.length;
  return (
    <CxFoldOrBare bare={bare} id="checklists" scope="visao" title="Checklists" count={checklistDone + '/' + checklistTotal}
      summary={checklistDone === checklistTotal ? 'tudo feito' : cxPl(checklistTotal - checklistDone, 'item pendente', 'itens pendentes')}>
      <div className="cx-bf-rail-b">
        {checklistGroups.map(g => {
          const done = g.items.filter(([k]) => chk[k]).length;
          return (<div key={g.label} className="cx-bf-chk-group">
            <div className="cx-bf-chk-row-hd"><span>{g.label}</span><span className="cx-mono cx-muted cx-small">{done}/{g.items.length}</span></div>
            <div className="cx-bar"><i style={{ width: (g.items.length ? Math.round(done / g.items.length * 100) : 0) + '%' }} /></div>
            {g.items.map(([k, l]) => (
              <div key={k} className={'cx-bf-chk-item' + (chk[k] ? ' done' : '')} onClick={() => toggleChk(k)}>
                <span className="ck">{chk[k] ? '✓' : '○'}</span><span>{l}</span>
              </div>
            ))}
          </div>);
        })}
      </div>
    </CxFoldOrBare>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 8 — Processos e prescrição no Prumo: passo 0 aparte (dedupe de sugestões,
   já acima). 8a: sinais fixos + ficha lateral. 8b: EditionClaudeProcessos
   (cartões para dezenas de processos). Lê os MESMOS `classified`/`prazosByDebt`
   que o app já calcula (processTabModel); não toca parsers, prescrição ou sync.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Sinais (mesmos desenhos/cores/ordem do ProcRowSymbols — app.jsx) ─── */
const CX_SIG_DEFS = [
  { k: 'task', label: 'Tarefa aberta' },
  { k: 'intim', label: 'Intimação aberta' },
  { k: 'star', label: 'Relevante' },
  { k: 'pin', label: 'Meu acervo' },
  { k: 'watch', label: 'Acompanhar' },
  { k: 'copy', label: 'Cópia na pasta' },
  { k: 'lock', label: 'Constrição' },
];
const CX_SIG_FIELD = { star: 'isRelevant', pin: 'meuAcervo', watch: 'acompanhar', copy: 'copiaNaPasta' };
function cxSigFlags(exec, data) {
  if (!exec) return { star: false, pin: false, watch: false, copy: false, lock: false, task: false, intim: false };
  return {
    star: !!exec.isRelevant,
    pin: !!exec.meuAcervo,
    watch: !!exec.acompanhar,
    copy: !!exec.copiaNaPasta,
    lock: execShowsConstriction(exec, data),
    task: execHasOpenTask(exec, data),
    intim: execHasOpenIntim(exec, data),
  };
}
function CxSigGlyph({ k, tone }) {
  switch (k) {
    case 'star': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 1.5l1.76 3.56 3.94.57-2.85 2.78.67 3.92L8 10.48l-3.52 1.85.67-3.92L2.3 5.63l3.94-.57L8 1.5z" /></svg>;
    case 'pin': return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 11.2 12 4.2l8.5 7" /><path d="M6 10.6V19.5h12V10.6" /><path d="M10 19.5v-5h4v5" /></svg>;
    case 'watch': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 3.2C4.6 3.2 1.85 5.85 1.2 8c.65 2.15 3.4 4.8 6.8 4.8s6.15-2.65 6.8-4.8C14.15 5.85 11.4 3.2 8 3.2zm0 8A3.2 3.2 0 118 4.8a3.2 3.2 0 010 6.4zm0-1.7A1.5 1.5 0 108 5.5a1.5 1.5 0 000 3z" /></svg>;
    case 'copy': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 1.5h5.2L13 5.3V14a.8.8 0 01-.8.8H4.8A.8.8 0 014 14V1.5zm5 0v3.2H12L9 1.5zM5.5 8h5v1h-5V8zm0 2.5h5v1h-5v-1z" /></svg>;
    case 'lock': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 1.6A2.9 2.9 0 005.1 4.5V6H4.2A1.2 1.2 0 003 7.2v5.1c0 .66.54 1.2 1.2 1.2h7.6c.66 0 1.2-.54 1.2-1.2V7.2c0-.66-.54-1.2-1.2-1.2h-.9V4.5A2.9 2.9 0 008 1.6zm0 1.3c.9 0 1.6.7 1.6 1.6V6H6.4V4.5c0-.9.7-1.6 1.6-1.6zM8 9.1a1.1 1.1 0 110 2.2A1.1 1.1 0 018 9.1z" /></svg>;
    case 'task': return <span className={'cx-sig-dot cx-sig-dot-task' + (tone === 'hi' ? ' cx-sig-dot-task-hi' : '')} aria-hidden="true" />;
    case 'intim': return <span className="cx-sig-dot cx-sig-dot-intim" aria-hidden="true" />;
    default: return null;
  }
}
/* Barra de filtros pelos 7 sinais — contagem entre parênteses, combinam por AND. */
function CxSigFilterBar({ counts, active, onToggle }) {
  return (
    <div className="cx-sigf">
      {CX_SIG_DEFS.map(s => (
        <button key={s.k} type="button" className={'cx-sigf-btn' + (active.has(s.k) ? ' on' : '')}
          onClick={() => onToggle(s.k)} title={s.label} aria-label={s.label} aria-pressed={active.has(s.k)}>
          <CxSigGlyph k={s.k} /><span className="cx-sigf-lbl">{s.label}</span><b>{counts[s.k] || 0}</b>
        </button>
      ))}
    </div>
  );
}

/* Espécie/rótulo curto do processo para a ficha e os grupos (IDPJ, MCF, Central, EF, Recurso…). */
function cxProcKind(exec) {
  if (!exec) return { label: 'CDA', cls: 'cda' };
  if (exec.processTag === 'idpj') return { label: 'IDPJ', cls: 'idpj' };
  if (exec.processTag === 'cautelar_fiscal') return { label: 'MCF', cls: 'idpj' };
  if (exec.processTag === 'central') return { label: 'Central', cls: 'cen' };
  if (exec.processTag === 'peticao_incidente_ef') return { label: 'Incidente', cls: 'ef' };
  if (isExecucaoFiscalClass(exec)) return { label: 'EF', cls: 'ef' };
  const bucket = otherProcBucket(exec);
  if (bucket === 'recursos') return { label: (otherSpecies(exec).code || 'Recurso'), cls: 'rec' };
  if (bucket === 'embargos') return { label: 'Embargos', cls: 'emb' };
  return { label: 'Outros', cls: 'out' };
}
/** Ordena por pior prescrição primeiro (crítica > alerta > ok), depois pelo prazo mais curto. */
function cxCdaPrescRank(d, prazosByDebt) {
  const rm = prazosRiskMetaForCdas([d], prazosByDebt);
  const rank = rm.riskClass === 'critical' ? 0 : rm.riskClass === 'warning' ? 1 : 2;
  return { rm, rank, days: rm.minRiskDays == null ? 1e9 : rm.minRiskDays };
}
function cxSortCdasByPresc(cdas, prazosByDebt) {
  return [...(cdas || [])].sort((a, b) => {
    if (!!a.prescriptionHandled !== !!b.prescriptionHandled) return a.prescriptionHandled ? 1 : -1;
    const ra = cxCdaPrescRank(a, prazosByDebt), rb = cxCdaPrescRank(b, prazosByDebt);
    if (ra.rank !== rb.rank) return ra.rank - rb.rank;
    return ra.days - rb.days;
  });
}

/* ═════════════ Atuação proativa (ficha do processo) ═════════════
   "Registrar atuação" no rodapé da ficha do processo: o que o usuário fez por conta própria, sem
   intimação. Gaveta (e não janela) porque o campo da peça recebe um texto longo colado. A gravação —
   nota no card do processo, execution.proactiveActions e, com link, o documento em Arquivos — é de
   planProactiveAction (src/lib/atuacoes.js), chamada por EditionClaudeProcDrawer. */
/* Grava uma atuação proativa: mesmas consequências de responder uma intimação (nota no card, registro no processo,
   documento em Arquivos quando há link). Uma única gravação da execução (nota + registro) para não sobrescrever uma à
   outra. Usada pela ficha do processo e pelo card "Atuações recentes" do Briefing. Devolve { ok } ou { error }. */
function cxRegisterAtuacao({ data, upsert, exec, fields }) {
  const latest = (data.executions || []).find(x => x.id === exec.id) || exec;
  const plan = planProactiveAction({ exec: latest, fields, ids: { action: uid(), doc: uid() }, nowIso: new Date().toISOString() });
  if (plan.error) return { error: plan.error };
  upsert('executions', plan.execution);
  if (plan.document) upsert('documents', plan.document);
  cxNotify('Atuação registrada: nota do processo e Atuações recentes' + (plan.document ? ' · peça em Arquivos' : ''));
  return { ok: true };
}
function EditionClaudeAtuacaoForm({ exec, onCancel, onSave }) {
  const [date, setDate] = React.useState(() => localIso(new Date()));
  const [summary, setSummary] = React.useState('');
  const [pecaText, setPecaText] = React.useState('');
  const [pecaUrl, setPecaUrl] = React.useState('');
  const [err, setErr] = React.useState('');
  const summaryRef = React.useRef(null);
  const dirty = !!(summary.trim() || pecaText.trim() || pecaUrl.trim());
  const dirtyRef = React.useRef(false);
  dirtyRef.current = dirty;
  // Um clique ou Esc sem querer não pode jogar fora um texto longo colado: pede confirmação se há algo digitado.
  const cancel = () => { if (dirtyRef.current && !confirm('Descartar o que foi digitado?')) return; onCancel(); };
  const cancelRef = React.useRef(cancel);
  cancelRef.current = cancel;
  React.useEffect(() => {
    if (summaryRef.current) summaryRef.current.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) { e.preventDefault(); cancelRef.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const urlBad = !!pecaUrl.trim() && !normalizePecaUrl(pecaUrl);
  const canSave = !!summary.trim() && !urlBad;
  const submit = (ev) => {
    ev.preventDefault();
    if (!canSave) return;
    const msg = onSave({ date, summary, pecaText, pecaUrl });
    if (msg) setErr(msg);
  };
  return <>
    <div className="cx-scrim" onClick={cancel} />
    <aside className="cx cx-drawer cx-pd cx-atu" role="dialog" aria-modal="true" aria-label="Registrar atuação">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className="cx-pd-kind">Registrar atuação</span><span className="cx-mono cx-pd-num">{exec.processNumber || 'S/N'}</span></div>
        <button type="button" className="cx-icon-btn" onClick={cancel} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <form id="cx-atu-form" className="cx-dr-body cx-atu-form" onSubmit={submit}>
        <label className="cx-atu-date">Data da atuação
          <input type="date" className="cx-input" value={date} onChange={ev => setDate(ev.target.value)} />
        </label>
        <label>Resumo da atuação *
          <textarea ref={summaryRef} className="cx-input" rows={3} value={summary} onChange={ev => setSummary(ev.target.value)} placeholder="Ex.: Petição requerendo SISBAJUD e penhora de faturamento" />
        </label>
        <label>Peça (texto integral, opcional)
          <textarea className="cx-input cx-atu-peca" value={pecaText} onChange={ev => setPecaText(ev.target.value)} placeholder="Cole aqui o texto completo da peça. Fica guardado no processo e pode ser lido depois em Atuações recentes, no Briefing." />
          {pecaText.trim() ? <span className="cx-form-note">{pecaText.length.toLocaleString('pt-BR')} caracteres</span> : null}
        </label>
        <label>Link da peça (opcional)
          <input className="cx-input" value={pecaUrl} onChange={ev => setPecaUrl(ev.target.value)} placeholder="https://docs.google.com/…" />
        </label>
        {urlBad ? <div className="cx-form-warn">O link da peça precisa começar com http:// ou https://.</div> : null}
        {err ? <div className="cx-form-warn">{err}</div> : null}
        <div className="cx-form-note">O resumo vai para as notas deste processo e para Atuações recentes, na Visão geral. {pecaUrl.trim() && !urlBad ? 'O link também vai para a aba Arquivos da operação.' : ''}</div>
      </form>
      <div className="cx-dr-foot">
        <button type="button" className="cx-btn ghost" onClick={cancel}>Cancelar</button>
        <span className="cx-sp" />
        <button type="submit" form="cx-atu-form" className="cx-btn primary" disabled={!canSave}><CxIcon n="tick" s={14} />Registrar atuação</button>
      </div>
    </aside>
  </>;
}

/* Leitura de uma atuação proativa (clique na linha em Atuações recentes, ou em "Minhas atuações" da Narrativa da Linha do tempo): resumo, data, link e o texto
   da peça colado, em bloco rolável. O texto é sempre exibido como texto puro (nunca como HTML). */
function EditionClaudeAtuacaoView({ exec, action, onClose }) {
  const [blocks, setBlocks] = React.useState({ resumo: true, peca: true });
  const toggle = (k) => setBlocks(prev => ({ ...prev, [k]: !prev[k] }));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const url = safeUrl(action.pecaUrl);
  const text = String(action.pecaText || '');
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd cx-atu" role="dialog" aria-modal="true" aria-label="Atuação proativa">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className="cx-pd-kind">Atuação proativa</span><span className="cx-mono cx-pd-num">{exec.processNumber || 'S/N'}</span></div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        <dl className="cx-pd-facts">
          <dt>Data</dt><dd>{action.date ? fmtDate(action.date) : '—'}</dd>
          <dt>Processo</dt><dd><span className="cx-mono cx-small">{exec.processNumber || 'S/N'}</span>{exec.className ? ' · ' + exec.className : ''}</dd>
          <dt>Peça</dt><dd>{url ? <a className="cx-a cx-a-flush" href={url} target="_blank" rel="noopener noreferrer"><CxIcon n="link" s={13} />{url.includes('docs.google') ? 'Google Docs' : 'Abrir peça'}</a> : <span className="cx-muted">Sem link</span>}</dd>
          {action.createdAt ? <><dt>Registrada</dt><dd className="cx-muted">{new Date(action.createdAt).toLocaleString('pt-BR')}</dd></> : null}
        </dl>
        <CxBlock title="Resumo" open={!!blocks.resumo} onToggle={() => toggle('resumo')} summary={action.summary}>
          <p className="cx-bf-work-txt cx-atu-sum">{action.summary}</p>
        </CxBlock>
        <CxBlock title="Texto da peça" open={!!blocks.peca} onToggle={() => toggle('peca')}
          count={text ? text.length.toLocaleString('pt-BR') + ' car.' : null} summary={text ? text.slice(0, 80) : 'Nenhum texto colado'}>
          {text
            ? <>
              <div className="cx-atu-tools"><button type="button" className="cx-link-btn" onClick={() => { cxCopy(text); cxNotify('Texto da peça copiado'); }}><CxIcon n="copy" s={13} />Copiar texto</button></div>
              <div className="cx-atu-text" tabIndex={0} aria-label="Texto da peça">{text}</div>
            </>
            : <div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhum texto da peça foi colado nesta atuação.</div>}
        </CxBlock>
      </div>
      <div className="cx-dr-foot">
        {url ? <a className="cx-btn sm primary" href={url} target="_blank" rel="noopener noreferrer">Abrir peça ↗</a> : null}
        <span className="cx-sp" />
        <button type="button" className="cx-btn sm ghost" onClick={onClose}>Fechar</button>
      </div>
    </aside>
  </>;
}

/* ═════════════ Ficha lateral (8a) — processo ou CDA avulsa ═════════════ */
function EditionClaudeProcDrawer(p) {
  const { group, data, opId, hubLabel, apensoNums, prazosByDebt, selectedCDAs, setSelectedCDAs, setModal, setData, upsert, onClose, onOpenExec, onOpenCda, relatedOthers, linkify } = p;
  const [tab, setTab] = React.useState('resumo');
  const [atuacaoOpen, setAtuacaoOpen] = React.useState(false); // formulário "Registrar atuação" (atuação proativa)
  const atuacaoOpenRef = React.useRef(false);
  atuacaoOpenRef.current = atuacaoOpen;
  React.useEffect(() => { setTab('resumo'); setAtuacaoOpen(false); }, [group && group.type === 'exec' ? group.exec.id : (group && group.cdas && group.cdas[0] && group.cdas[0].id)]);
  React.useEffect(() => {
    // Com o formulário aberto, o Esc é dele (confirma antes de descartar o que foi digitado).
    const onKey = (e) => { if (e.key === 'Escape' && !atuacaoOpenRef.current && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!group) return null;
  const isExec = group.type === 'exec';
  const e = isExec ? group.exec : null;
  const kind = cxProcKind(e);
  const cdas = cxSortCdasByPresc(group.cdas || [], prazosByDebt);
  const sig = cxSigFlags(e, data);
  const toggleSig = (k) => { if (!e || !CX_SIG_FIELD[k]) return; const field = CX_SIG_FIELD[k]; upsert('executions', { ...e, [field]: !e[field] }); };
  const openTasks = e ? (data.tasks || []).filter(t => t.operationId === opId && t.status !== 'concluida' && t.status !== 'cancelada' && sameProc(t.processNumber, e.processNumber)) : [];
  const openIntims = e ? (data.intimations || []).filter(x => x.operationId === opId && !x.responseAction && intimIsOpenWork(x) && sameProc(x.processNumber, e.processNumber)) : [];
  const linkedAssets = e ? (data.assets || []).filter(a => a.operationId === opId && a.processRef && sameProc(a.processRef, e.processNumber) && (a.status === 'indisponibilidade_ativa' || a.status === 'indisponibilidade_requerida')) : [];
  const execDebtor = (() => {
    const firstCda = cdas[0];
    if (firstCda) {
      const resp = (data.links?.cdaResponsibilities || []).find(r => r.cdaId === firstCda.id && r.role === 'originario');
      if (resp) { const pp = data.people.find(x => x.id === resp.personId); if (pp) return pp.name; }
      if (firstCda.devedor) return firstCda.devedor;
    }
    return null;
  })();
  const totalValue = cdas.reduce((s, d) => s + (d.value || 0), 0);
  const worst = cdas.length ? cxPrescDisplay(cdas, prazosByDebt) : null;
  // Intercorrente do processo: régua, aviso da constrição no incidente (5 anos) e prazo informativo de redirecionamento.
  const procPresc = (() => {
    if (!e || e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal' || e.processTag === 'central') return null;
    const live = cdas.filter(d => d.status !== 'extinta');
    const lead = live[0] || cdas[0];
    if (!lead) return null;
    const results = live.map(d => computePrescription({ debt: d, executions: data.executions, events: data.prescriptionEvents || [] }));
    const r = results[0] || computePrescription({ debt: lead, executions: data.executions, events: data.prescriptionEvents || [] });
    const notice = results.map(x => x.idpjNotice).find(n => n && n.active) || null;
    const cdaIds = new Set(cdas.map(d => d.id));
    const evs = (data.prescriptionEvents || []).filter(ev => ev.executionId === e.id || cdaIds.has(ev.cdaId) || (ev.batchCdaIds || []).some(id => cdaIds.has(id)));
    return { r, notice, redir: redirecionamentoInfo({ exec: e, events: evs }) };
  })();
  /* Trilha de fases e barra de prescrição da ficha (M6-C). */
  const todayIso = localIso(new Date());
  const trail = e ? cxProcTrail(data, (data.operations || []).find(o => o.id === (e.operationId || opId)), e, todayIso) : null;
  const prescMini = e ? cxProcPrescMini(data, e, cdas, prazosByDebt, todayIso) : null;
  const copyProcNum = () => { try { navigator.clipboard.writeText(e ? (e.processNumber || '') : ''); } catch { } };
  const batchEventOnGroup = () => setModal({ type: 'create', entityType: 'prescriptionEvent', initial: { batchCdaIds: cdas.map(d => d.id) } });
  const genTask = () => setModal({ type: 'create', entityType: 'task', initial: { operationId: opId, processNumber: e ? e.processNumber : '', title: e ? `Providência — ${e.className || 'processo'}` : 'Providência', priority: 'media', status: 'pendente', taskVisibility: 'operation' } });
  // Atuação proativa (gravação em cxRegisterAtuacao, compartilhada com o card "Atuações recentes" do Briefing).
  const registerAtuacao = (fields) => {
    const r = cxRegisterAtuacao({ data, upsert, exec: e, fields });
    if (r.error) return r.error;
    setAtuacaoOpen(false);
    setTab('notas');
    return '';
  };
  if (atuacaoOpen && e) return <EditionClaudeAtuacaoForm exec={e} onCancel={() => setAtuacaoOpen(false)} onSave={registerAtuacao} />;
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd" role="dialog" aria-modal="true" aria-label="Processo">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className={'cx-pd-kind ' + kind.cls}>{kind.label}</span>
          {e ? <Copyable value={e.processNumber || ''} className="cx-mono cx-pd-num">{e.processNumber || 'S/N'}</Copyable> : <b>CDAs sem processo</b>}
        </div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        {e && <div className="cx-pd-sigtog">
          {['star', 'pin', 'watch', 'copy'].map(k => (
            <button key={k} type="button" className={'cx-pd-sig' + (sig[k] ? ' on' : '')} onClick={() => toggleSig(k)}>
              <CxSigGlyph k={k} /><span>{CX_SIG_DEFS.find(d => d.k === k).label}{k === 'copy' && sig.copy && e.copiaNaPastaDate ? ' · ' + fmtDate(e.copiaNaPastaDate) : ''}</span>
            </button>
          ))}
        </div>}
        {e && (sig.lock || openTasks.length > 0 || openIntims.length > 0) && <div className="cx-pd-sigauto">
          {sig.lock && <span className="cx-pd-auto"><CxSigGlyph k="lock" />Constrição{linkedAssets.length ? `: ${linkedAssets.length} ${linkedAssets.length === 1 ? 'bem' : 'bens'} (${[...new Set(linkedAssets.map(a => a.source).filter(Boolean))].join(', ') || '—'})` : ''}</span>}
          {openTasks.length > 0 && <button type="button" className="cx-pd-auto cx-pd-auto-btn" onClick={() => setModal({ type: 'edit', entityType: 'task', initial: openTasks[0] })}><CxSigGlyph k="task" tone={openTasks.some(t => t.priority === 'urgente' || t.priority === 'alta') ? 'hi' : 'lo'} />{openTasks.length} {openTasks.length === 1 ? 'tarefa' : 'tarefas'}</button>}
          {openIntims.length > 0 && <button type="button" className="cx-pd-auto cx-pd-auto-btn" onClick={() => setModal({ type: 'edit', entityType: 'intimation', initial: openIntims[0] })}><CxSigGlyph k="intim" />{openIntims.length} {openIntims.length === 1 ? 'intimação' : 'intimações'}{openIntims[0].dateDeadline ? ' · prazo ' + fmtDate(openIntims[0].dateDeadline) : ''}</button>}
        </div>}
        {e && <dl className="cx-pd-facts">
          <dt>Juízo</dt><dd>{e.court || '—'}{e.className ? ' · ' + e.className : ''}</dd>
          {execDebtor && <><dt>Executado</dt><dd>{execDebtor}</dd></>}
          {hubLabel && <><dt>Coberta por</dt><dd>{hubLabel}</dd></>}
          {apensoNums && apensoNums.length > 0 && <><dt>Apensos</dt><dd className="cx-mono cx-small">{apensoNums.join(', ')}</dd></>}
          <dt>Status</dt><dd>{(EXEC_STATUSES[e.status] || {}).label || e.status || '—'}</dd>
        </dl>}
        <div className="cx-itabs">
          <button type="button" className={tab === 'resumo' ? 'on' : ''} onClick={() => setTab('resumo')}>Resumo</button>
          <button type="button" className={tab === 'cdas' ? 'on' : ''} onClick={() => setTab('cdas')}>CDAs · {cdas.length}</button>
          {e && <button type="button" className={tab === 'notas' ? 'on' : ''} onClick={() => setTab('notas')}>Notas · {(e.notesList || (e.notes ? [e.notes] : [])).length}</button>}
          {e && <button type="button" className={tab === 'recursos' ? 'on' : ''} onClick={() => setTab('recursos')}>Recursos · {(relatedOthers || []).length}</button>}
        </div>
        {tab === 'resumo' && <div className="cx-pd-tabpane">
          <div className="cx-pd-sum-row"><span>Valor total</span><b>{fmtCur(totalValue)}</b></div>
          <div className="cx-pd-sum-row"><span>CDAs</span><b>{cdas.length}</b></div>
          {worst && <div className="cx-pd-sum-row"><span>Pior prescrição</span><b className={'risk-' + worst.riskClass}>{worst.bar}{worst.text}</b></div>}
          {e && e.protocolDate && <div className="cx-pd-sum-row"><span>Protocolo</span><b>{fmtDate(e.protocolDate)}</b></div>}
          {procPresc && procPresc.r && procPresc.r.segment === 'intercorrente' && <div className="cx-pd-ruler"><span className="cx-muted cx-small">Intercorrente</span><PrescBandRuler seg={procPresc.r} /></div>}
          {procPresc && procPresc.notice && <div className="cx-pd-notice">{betaSafeUiText(procPresc.notice.text)}</div>}
          {procPresc && procPresc.redir && <div className="cx-pd-sum-row cx-pd-redir" title={procPresc.redir.basis}><span>Redirecionamento</span><b className="cx-small">{procPresc.redir.text}</b></div>}
          {e && ((trail && trail.done > 0) || prescMini) ? <div className="cx-pd-trail">
            {trail && trail.done > 0 ? <><div className="cx-pt-cap">Fases do processo</div><CxPhaseTrail trail={trail} todayIso={todayIso} /></> : null}
            <CxProcPrescMini mini={prescMini} todayIso={todayIso} />
          </div> : null}
        </div>}
        {tab === 'cdas' && <div className="cx-pd-tabpane cx-pd-cdas">
          {cdas.length === 0 && <div className="cx-empty-row">Sem CDAs vinculadas.</div>}
          {cdas.map(d => {
            const isSel = selectedCDAs.has(d.id);
            const isHandled = !!d.prescriptionHandled;
            const isAguardando = isHandled && d.prescriptionHandledType === 'aguardando_reconhecimento';
            const st = DEBT_STATUSES[d.status] || {};
            const pd = cxPrescDisplay([d], prazosByDebt);
            const toggleSel = () => setSelectedCDAs(prev => { const n = new Set(prev); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; });
            return (
              <div key={d.id} className={'cx-pd-cda' + (isHandled ? ' handled' : '')}>
                {/* Clique abre a ficha própria da CDA à direita (fecha esta); checkbox só seleciona. */}
                <div className="cx-pd-cda-h" onClick={() => onOpenCda && onOpenCda(d.id, e ? e.id : null)}>
                  <input type="checkbox" checked={isSel} onChange={ev => { ev.stopPropagation(); toggleSel(); }} onClick={ev => ev.stopPropagation()} />
                  <span className="cx-mono">{d.cdaNumber || 'CDA'}</span>
                  <span className="cx-muted cx-small">{cdaEspecie(d)}</span>
                  <span className="cx-sp" />
                  <span className="cx-mono cx-small">{fmtCur(d.value)}</span>
                </div>
                <div className="cx-pd-cda-s">{st.label || d.status} · {isAguardando ? <span className="cx-risk-critical">aguardando reconhecimento</span> : isHandled ? <span className="cx-risk-ok">tratada</span> : <span className={'cx-risk-' + pd.riskClass}>{pd.bar}{pd.text}</span>}</div>
              </div>
            );
          })}
        </div>}
        {tab === 'notas' && e && <div className="cx-pd-tabpane">
          {(e.notesList || (e.notes ? [e.notes] : [])).length === 0 && <div className="cx-empty-row">Sem notas.</div>}
          {(e.notesList || (e.notes ? [e.notes] : [])).map((n, i) => {
            const text = typeof n === 'string' ? n : ((n && (n.text || n.content || n.body)) || '');
            return <div key={i} className="cx-pd-note">{linkify ? linkify(text) : text}</div>;
          })}
        </div>}
        {tab === 'recursos' && e && <div className="cx-pd-tabpane">
          {(relatedOthers || []).length === 0 && <div className="cx-empty-row">Nenhum recurso, embargo ou outra ação vinculada.</div>}
          {(relatedOthers || []).map(og => {
            const k2 = cxProcKind(og.exec);
            return (
              <button key={og.exec.id} type="button" className="cx-pd-rel" onClick={() => onOpenExec && onOpenExec(og.exec.id)}>
                <span className={'cx-pd-kind ' + k2.cls}>{k2.label}</span>
                <span className="cx-mono cx-small">{og.exec.processNumber || 'S/N'}</span>
                <span className="cx-sp" />
                <span className="cx-muted cx-small">{(EXEC_STATUSES[og.exec.status] || {}).label || og.exec.status}</span>
              </button>
            );
          })}
        </div>}
        {e && openIntims.length > 0 && <div className="cx-pd-intims">
          <div className="cx-sec-t">Intimações em aberto</div>
          {openIntims.slice().sort(cxByDeadline).map(intim => {
            const notes = cxNotes(intim);
            const links = [];
            if (intim.minutaUrl) links.push({ url: intim.minutaUrl, label: String(intim.minutaUrl).includes('docs.google') ? 'Google Docs' : 'Documento' });
            const ra = intim.responseAction;
            if (ra && (ra.peticionUrl || ra.docUrl)) links.push({ url: ra.peticionUrl || ra.docUrl, label: String(ra.peticionUrl || ra.docUrl).includes('docs.google') ? 'Google Docs' : 'Peça' });
            return <div key={intim.id} className="cx-pd-intim">
              <div className="cx-pd-intim-h">{intim.eventDescription || intim.className || 'Intimação'}</div>
              <div className="cx-pd-intim-m">{cxPartyName(intim)}{(CX_ST[intim.status] || {}).l ? ' · ' + (CX_ST[intim.status] || {}).l : ''}{intim.dateDeadline ? ' · prazo ' + fmtDate(intim.dateDeadline) : ''}</div>
              {intim.object ? <div className="cx-pd-intim-obj">{intim.object}</div> : null}
              {notes.map((n, i) => {
                const text = typeof n === 'string' ? n : ((n && (n.text || n.content || n.body)) || '');
                return <div key={i} className="cx-pd-note">{linkify ? linkify(text) : text}</div>;
              })}
              {links.length > 0 && <div className="cx-pd-intim-docs">{links.map(l => <a key={l.url} className="cx-a" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>)}</div>}
            </div>;
          })}
        </div>}
      </div>
      <div className="cx-dr-foot">
        <button type="button" className="cx-btn sm" onClick={batchEventOnGroup} disabled={!cdas.length}>+ Evento nas {cdas.length} CDAs</button>
        <button type="button" className="cx-btn sm" onClick={genTask}>Gerar tarefa</button>
        {e && <button type="button" className="cx-btn sm" onClick={() => setAtuacaoOpen(true)} title="Registrar uma atuação sua neste processo, sem intimação">Registrar atuação</button>}
        {e && <button type="button" className="cx-btn sm" onClick={() => { const on = cxIsBfFront(e); upsert('executions', { ...e, inPanorama: !on }); cxNotify(on ? 'Retirado das Frentes processuais' : 'Levado às Frentes processuais'); }}
          title="Frentes processuais da Visão geral: só os processos que você quer acompanhar de perto">{cxIsBfFront(e) ? 'Retirar da frente' : 'Levar à frente'}</button>}
        {e && <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'execution', initial: e })}>Dados do processo</button>}
      </div>
    </aside>
  </>;
}

/* ═════════════ Ficha lateral da CDA (8c) — mesmo padrão da ficha do processo ═════════════
   Aberta ao clicar numa linha de CDA (cartão "CDAs não ajuizadas" e a lista de CDAs dentro
   da ficha do processo, aba CDAs). Só leitura do motor de prescrição existente — nenhum
   cálculo novo aqui. Pronta para reuso pela futura aba Inscrições (props explícitas). */

/** Três contagens empilhadas (intercorrente/ordinária/decadência, a ordem da Mesa; decadência por último) —
 *  mesmo cálculo que a aba CDAs da ficha do processo já fazia inline; extraído para reuso. */
function CxCdaPrescStack({ debt, data, togglePrescCheck, setData }) {
  const tl = computeCdaLegalTimeline({ debt, executions: data.executions, events: data.prescriptionEvents || [] });
  // “Ainda vale”: grava hoje como última conferência da pausa sem fim (mesma gravação do clássico).
  const confirmPause = setData ? (eventId) => {
    const today = localIso(new Date());
    const now = new Date().toISOString();
    setData(prev => ({ ...prev, prescriptionEvents: (prev.prescriptionEvents || []).map(ev => ev.id === eventId ? { ...ev, verifiedAt: today, updatedAt: now } : ev) }));
    cxNotify('Pausa conferida hoje');
  } : undefined;
  // Mesma ordem da Mesa: intercorrente se a CDA está ajuizada, senão ordinária; a decadência vem por último
  // (só consulta). O «pior» do motor não manda na ordem da tela.
  const ordered = (tl.exec ? ['intercorrente', 'ordinaria', 'decadencia'] : ['ordinaria', 'intercorrente', 'decadencia']).filter(k => tl[k]);
  return <div className="cx-pd-cda-stack">
    {ordered.map((k, i) => <CdaPrescColumns key={k} timeline={{ [k]: tl[k], exec: tl.exec }} debt={debt} onToggleCheck={togglePrescCheck} onOpenRules={() => { }} onConfirmPause={i === 0 ? confirmPause : undefined} isDemo={false} />)}
  </div>;
}

/** Bloco "Prazos extintivos": situação na Mesa (prazosByDebt), o mesmo rótulo e barra de
 *  horizonte usados na coluna Prescrição da aba, e as três contagens empilhadas. */
function CxCdaPrazosBlock({ debt, prazosByDebt, data, togglePrescCheck, setData }) {
  const row = prazosByDebt.get(debt.id);
  const pd = cxPrescDisplay([debt], prazosByDebt);
  const isHandled = !!debt.prescriptionHandled;
  const isAguardando = isHandled && debt.prescriptionHandledType === 'aguardando_reconhecimento';
  return <div className="cx-cd-prazos">
    <div className={'cx-cd-prazos-top cx-risk-' + pd.riskClass}>
      {pd.bar}<span>{pd.text}</span>
      {isAguardando ? <span className="cx-tag orange">aguardando reconhecimento</span> : isHandled ? <span className="cx-tag">tratada</span> : null}
    </div>
    {row ? <div className="cx-cd-prazos-row">
      <span className="cx-gnum" style={{ '--c': CX_GROUP_C[row.group] }} title={'Grupo ' + row.group}>{row.group}</span>
      <span>{PRAZOS_GROUP_LABELS[row.group] || ''}</span>
      {row.keyDate ? <span className="cx-muted" title={row.basis || undefined}>{row.bandHit ? row.keyLabel : 'termo ' + fmtDate(row.keyDate)}</span> : null}
      {row.prescDays != null ? <span className="cx-muted">{formatPrescHorizon(row.prescDays)}</span> : null}
    </div> : null}
    {row && (row.why || row.summary) ? <div className="cx-cd-prazos-why">{betaSafeUiText(row.why || row.summary)}</div> : null}
    <CxCdaPrescStack debt={debt} data={data} togglePrescCheck={togglePrescCheck} setData={setData} />
  </div>;
}

/** Bloco "Dados da inscrição" — mesmos campos do detalhe clássico (status, espécie, tributo,
 *  valor, inscrição, prescrição informada, tratamento, processo, situação origem). */
function CxCdaDadosBlock({ debt: d, exec }) {
  const st = DEBT_STATUSES[d.status] || {};
  const field = (label, value) => (value !== null && value !== undefined && value !== '') ? (
    <div key={label} className="cda-inline-field">
      <span className="im-label">{label}</span>
      <strong>{value}</strong>
    </div>
  ) : null;
  return <div className="cda-inline-fields">
    {field('Status', st.label || d.status)}
    {field('Espécie', cdaEspecie(d))}
    {field('Tributo', d.tribute)}
    {field('Valor', d.value != null ? fmtCur(d.value) : null)}
    {field('Inscrição', d.inscriptionDate ? fmtDate(d.inscriptionDate) : null)}
    {field('Prescrição informada (não substitui o cálculo)', d.prescriptionDate ? fmtDate(d.prescriptionDate) : null)}
    {field('Tratamento', d.prescriptionHandled ? (d.prescriptionHandledType === 'aguardando_reconhecimento' ? 'Aguardando reconhecimento' : 'Tratada') : null)}
    {field('Processo', d.processNumber ? d.processNumber + (exec && exec.court ? ' · ' + exec.court : '') : null)}
    {field('Situação origem', d.rawStatus)}
  </div>;
}

/** Bloco "Eventos": collectEventsForCda + inferParcelamentoEnds (mesmo motor do clássico); ✎ abre o evento. */
function CxCdaEventsBlock({ debt, data, setModal }) {
  const pevs = collectEventsForCda(debt, data.executions, data.prescriptionEvents || []).events;
  if (!pevs.length) return <div className="cx-empty-row">Sem eventos lançados.</div>;
  const inferredEnds = inferParcelamentoEnds(pevs);
  return <ul className="cx-cd-events">
    {pevs.map(ev => {
      const meta = PRESC_EVENT_TYPES[normalizePrescEventType(ev.type)] || {};
      const pedido = ev.requestDate && ev.requestDate !== ev.date;
      const inferred = !ev.endDate ? inferredEnds.get(ev.id) : null;
      return <li key={ev.id} className="cx-cd-event-row">
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => setModal({ type: 'edit', entityType: 'prescriptionEvent', initial: ev })} title="Editar evento" aria-label="Editar evento"><CxIcon n="edit" s={12} /></button>
        <span>
          <b>{meta.label || ev.type}</b>
          {pedido ? ' · pedido ' + fmtDate(ev.requestDate) : ''}
          {ev.date ? ' · ' + (pedido ? 'efetiva ' : '') + fmtDate(ev.date) : ''}
          {ev.endDate ? ' · até ' + fmtDate(ev.endDate) : (inferred ? ' · até ' + fmtDate(inferred.end) + ' (inferido)' : '')}
        </span>
      </li>;
    })}
  </ul>;
}

const CX_CDA_BLK_DEFAULTS = { prazos: true, resp: false, dados: false, eventos: false, hist: false, notas: false };
function cxLoadCdaDrawerBlocks() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_cx_cda_drawer_blocks') || 'null');
    if (raw && typeof raw === 'object') return { ...CX_CDA_BLK_DEFAULTS, ...raw };
  } catch (e) { /* ignore */ }
  return { ...CX_CDA_BLK_DEFAULTS };
}
function cxSaveCdaDrawerBlocks(v) { try { localStorage.setItem('nexus_cx_cda_drawer_blocks', JSON.stringify(v)); } catch (e) { /* ignore */ } }

/** Ficha da CDA — props explícitas para reuso (a futura aba Inscrições usa o mesmo componente):
 *  debt (a CDA), exec (execução vinculada, se houver), data, prazosByDebt, onClose, onOpenExec,
 *  setModal, selectedCDAs/setSelectedCDAs, setData, togglePrescCheck. */
function EditionClaudeCdaDrawer(p) {
  const { debt: d, exec, data, prazosByDebt, selectedCDAs, setSelectedCDAs, setModal, setData, togglePrescCheck, onClose, onOpenExec, opId, linkify } = p;
  const [blocks, setBlocks] = React.useState(cxLoadCdaDrawerBlocks);
  const toggleBlock = (key) => setBlocks(prev => { const next = { ...prev, [key]: !prev[key] }; cxSaveCdaDrawerBlocks(next); return next; });
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!d) return null;
  const st = DEBT_STATUSES[d.status] || {};
  const isHandled = !!d.prescriptionHandled;
  const isAguardando = isHandled && d.prescriptionHandledType === 'aguardando_reconhecimento';
  const respCount = (data.links?.cdaResponsibilities || []).filter(r => r.cdaId === d.id).length;
  const pevsCount = collectEventsForCda(d, data.executions, data.prescriptionEvents || []).events.length;
  const notes = (d.notesList || (d.notes ? [d.notes] : [])).filter(n => n && !(d.debcad && isDebcadCondensedNote(n)) && !(d.sida && isSidaCondensedNote(n)));
  const hasHist = !!(d.debcad || d.sida);
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd cx-cd" role="dialog" aria-modal="true" aria-label="CDA">
      <div className="cx-dr-top">
        <div className="cx-crumb">
          <span className="cx-pd-kind">CDA</span>
          <Copyable value={d.cdaNumber || ''} className="cx-mono cx-pd-num">{d.cdaNumber || 'S/N'}</Copyable>
        </div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        <dl className="cx-props">
          <dt>Espécie</dt><dd>{[cdaEspecie(d), d.tribute, d.system].filter(Boolean).join(' · ') || '—'}</dd>
          <dt>Valor</dt><dd className="cx-mono">{d.value != null ? fmtCur(d.value) : '—'}</dd>
          <dt>Situação</dt><dd>{isAguardando ? <span className="cx-risk-critical">aguardando reconhecimento</span> : isHandled ? <span className="cx-risk-ok">tratada</span> : (st.label || d.status || '—')}</dd>
          <dt>Inscrição</dt><dd>{d.inscriptionDate ? fmtDate(d.inscriptionDate) : '—'}</dd>
          {exec ? <><dt>Processo</dt><dd><button type="button" className="cx-link-btn" onClick={() => onOpenExec && onOpenExec(exec.id)}>{exec.processNumber || 'Abrir processo'}<CxIcon n="chevR" s={12} /></button></dd></> : (d.processNumber ? <><dt>Processo</dt><dd className="cx-mono cx-small">{d.processNumber}</dd></> : null)}
        </dl>

        <CxBlock title="Prazos extintivos" open={!!blocks.prazos} onToggle={() => toggleBlock('prazos')}>
          <CxCdaPrazosBlock debt={d} prazosByDebt={prazosByDebt} data={data} togglePrescCheck={togglePrescCheck} setData={setData} />
        </CxBlock>

        <CxBlock title="Responsáveis" count={respCount} open={!!blocks.resp} onToggle={() => toggleBlock('resp')}>
          <ResponsibilityChips cdaId={d.id} data={data} onClickPerson={(pp) => setModal({ type: 'edit', entityType: 'person', initial: pp })} />
        </CxBlock>

        <CxBlock title="Dados da inscrição" open={!!blocks.dados} onToggle={() => toggleBlock('dados')}>
          <CxCdaDadosBlock debt={d} exec={exec} />
        </CxBlock>

        <CxBlock title="Eventos" count={pevsCount} open={!!blocks.eventos} onToggle={() => toggleBlock('eventos')}>
          <CxCdaEventsBlock debt={d} data={data} setModal={setModal} />
        </CxBlock>

        {hasHist ? <CxBlock title="Histórico SIDA / Debcad" open={!!blocks.hist} onToggle={() => toggleBlock('hist')}>
          <DebcadHistoryBlock debt={d} />
          <SidaHistoryBlock debt={d} />
        </CxBlock> : null}

        <CxBlock title="Notas" count={notes.length} open={!!blocks.notas} onToggle={() => toggleBlock('notas')}>
          {notes.length === 0 ? <div className="cx-empty-row">Sem notas.</div> : notes.map((n, i) => {
            const text = typeof n === 'string' ? n : ((n && (n.text || n.content || n.body)) || '');
            return <div key={i} className="cx-pd-note">{linkify ? linkify(text) : text}</div>;
          })}
        </CxBlock>
      </div>
      <div className="cx-dr-foot">
        <button type="button" className="cx-btn sm" onClick={() => setModal({ type: 'create', entityType: 'prescriptionEvent', initial: { cdaId: d.id, executionId: exec ? exec.id : '', _focusDate: true } })}>+ Evento</button>
        <button type="button" className="cx-btn sm" onClick={() => toggleCdaHandled(d, selectedCDAs, setSelectedCDAs, setData)}>{isHandled ? '↻ Reabrir' : '✓ Tratada'}</button>
        {!isHandled ? <button type="button" className="cx-btn sm" onClick={() => markCdaAguardando(d, { selectedCDAs, setSelectedCDAs, setData, setModal, opId, procRef: exec ? (exec.processNumber || '') : null, className: exec ? exec.className : '', court: exec ? exec.court : '' })}>⏳ Aguardando reconhecimento</button> : null}
        <button type="button" className="cx-btn sm" onClick={() => cxCopyCdaMemoria(d, exec, data)}>Memória técnica</button>
        <button type="button" className="cx-icon-btn cx-sm" onClick={() => cxDownloadCdaMemoria(d, exec, data)} title="Baixar memória técnica (HTML)" aria-label="Baixar memória técnica (HTML)"><CxIcon n="file" s={13} /></button>
        <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'debt', initial: d })}>✎ Editar inscrição</button>
      </div>
    </aside>
  </>;
}
/** Memória técnica da CDA — mesmo texto/HTML que CdaLegalDetail (clássico) copia/baixa; reusado
 *  aqui e pela aba Inscrições do Prumo, sem duplicar o motor de prescrição. */
function cxCdaMemoriaText(d, exec, data) {
  const tl = computeCdaLegalTimeline({ debt: d, executions: data.executions, events: data.prescriptionEvents || [] });
  const person = (data.people || []).find(p => p.id === d.personId);
  const personName = (person && person.name) || d.devedor || '';
  return buildPrescricaoReport({ debt: d, timeline: tl, personName, exec: exec || tl.exec });
}
function cxCopyCdaMemoria(d, exec, data) {
  cxCopy(cxCdaMemoriaText(d, exec, data));
  cxNotify('Memória técnica copiada.');
}
function cxDownloadCdaMemoria(d, exec, data) {
  const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const report = cxCdaMemoriaText(d, exec, data);
  const title = `Memória técnica — CDA ${d.cdaNumber || 's/nº'}`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1><pre style="white-space:pre-wrap;font-family:'Consolas',monospace;font-size:13px">${escapeHtml(report)}</pre></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeCda = String(d.cdaNumber || 'sem_numero').replace(/[^a-z0-9_.-]+/gi, '_');
  a.href = url;
  a.download = `memoria_prescricao_${safeCda}_${localIso(new Date())}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ═════════════ Cartões para dezenas de processos (8b) ═════════════ */
function cxEfMeta(group, prazosByDebt) {
  const rm = prazosRiskMetaForCdas(group.cdas || [], prazosByDebt);
  const total = (group.cdas || []).reduce((s, d) => s + (d.value || 0), 0);
  const st = EXEC_STATUSES[group.exec && group.exec.status] || {};
  return { total, st, label: rm.label, riskClass: rm.riskClass, minRiskDays: rm.minRiskDays };
}
function cxProcSortCmp(sortBy, prazosByDebt) {
  const rank = (m) => m.riskClass === 'critical' ? 0 : m.riskClass === 'warning' ? 1 : 2;
  return (ga, gb) => {
    if (sortBy === 'numero') return String((ga.exec && ga.exec.processNumber) || '').localeCompare(String((gb.exec && gb.exec.processNumber) || ''));
    const ma = cxEfMeta(ga, prazosByDebt), mb = cxEfMeta(gb, prazosByDebt);
    if (sortBy === 'prescricao') {
      const ra = rank(ma), rb = rank(mb);
      if (ra !== rb) return ra - rb;
      return (ma.minRiskDays == null ? 1e9 : ma.minRiskDays) - (mb.minRiskDays == null ? 1e9 : mb.minRiskDays);
    }
    return (mb.total || 0) - (ma.total || 0);
  };
}
function cxAlarmCount(groups, prazosByDebt) {
  return (groups || []).filter(g => cxEfMeta(g, prazosByDebt).riskClass === 'critical').length;
}
/** Reúne uma lista de grupos (EF/hub) com os apensos aninhados (mesmo apensosByParent). */
function cxFlattenWithApensos(list, apensosByParent) {
  const out = [];
  (list || []).forEach(g => {
    out.push(g);
    const aps = (apensosByParent && g.exec && apensosByParent[g.exec.id]) || [];
    if (aps.length) out.push(...cxFlattenWithApensos(aps, apensosByParent));
  });
  return out;
}
/** A CDA (entre as não tratadas) com o prazo mais curto/grupo mais grave, para a barra e o "N dias · dd/mm". */
function cxWorstPrescRow(cdas, prazosByDebt) {
  let best = null;
  (cdas || []).forEach(d => {
    if (!d || d.prescriptionHandled) return;
    const row = prazosByDebt.get(d.id);
    if (!row) return;
    const g = row.group || 9;
    if (!best || g < best.group || (g === best.group && (row.prescDays ?? 1e9) < (best.prescDays ?? 1e9))) best = row;
  });
  return best;
}
/** Barra de horizonte: quanto falta até o termo, numa escala de 5 anos (1825 dias). Só quando há termo. */
function CxHorizonBar({ days, group }) {
  const pct = Math.max(2, Math.min(100, Math.round((Math.max(days, 0) / 1825) * 100)));
  const color = group <= 2 ? 'var(--cx-red)' : 'var(--cx-orange)';
  return <span className="cx-hb" aria-hidden="true"><i style={{ width: pct + '%', background: color }} /></span>;
}
/** Mesmo rótulo da coluna Prescrição do clássico/Beta (efRiskMeta/prazosRiskMetaForCdas);
 *  quando há dias contados (grupos 1–4), mostra "N dias · dd/mm" e a barra de horizonte. */
function cxPrescDisplay(cdas, prazosByDebt) {
  const rm = prazosRiskMetaForCdas(cdas, prazosByDebt);
  const worst = cxWorstPrescRow(cdas, prazosByDebt);
  const hasTerm = !!(worst && worst.group >= 1 && worst.group <= 4 && worst.prescDays != null);
  let text = rm.label;
  if (hasTerm) {
    const d = worst.prescDays;
    const target = addCalendarDays(localIso(new Date()), d);
    text = (d <= 0 ? Math.abs(d) + 'd vencido' : d + ' dias') + ' · ' + cxDM(target);
  }
  return { riskClass: rm.riskClass, text, bar: hasTerm ? <CxHorizonBar days={worst.prescDays} group={worst.group} /> : null };
}
function CxPrescCell({ cdas, prazosByDebt }) {
  const { riskClass, text, bar } = cxPrescDisplay(cdas, prazosByDebt);
  return <td className={'cx-pt-presc risk-' + riskClass}>{bar}{text}</td>;
}

/* ═══ Vínculo entre processos: árvore com curva de derivação (opção A escolhida em
   design/mockups/prumo-vinculo-processos.html) ═══
   Uma linha fina desce do condutor (hub/guarda-chuva) e faz uma curva até cada linha
   abrangida; a última do nível termina em curva, as anteriores seguem retas para a
   próxima. O nível 2 (apenso de um abrangido, ou CDA de uma execução vinculada) ganha
   uma segunda curva, com a linha do nível 1 passando reto por trás quando o abrangido
   pai ainda tem irmãos depois dele. Usado em EditionClaudeProcessos (EF/apenso sob hub)
   e EditionClaudeInscricoes (CDA sob execução vinculada sob guarda-chuva). Só
   apresentação — em cima de coveredByHub/apensosByParent/cxCdaGroupsByProcess, sem
   mexer na classificação. */
function cxTreeRowClass(level) {
  return level ? ' cx-tree-child' + (level > 1 ? ' cx-tree-l2' : '') : '';
}
function CxTreeMark({ level, isLast, parentHasMore }) {
  if (!level) return null;
  return <React.Fragment>
    {level > 1 && parentHasMore && <span className="cx-tree-anc" aria-hidden="true" />}
    <span className={'cx-tree-elbow' + (level > 1 ? ' lv2' : '')} aria-hidden="true" />
    {!isLast && <span className={'cx-tree-trunk' + (level > 1 ? ' lv2' : '')} aria-hidden="true" />}
  </React.Fragment>;
}
/** Fase atual do processStageV2 (mesma régua do Briefing), para a linha de grupo do hub. */
function cxHubStageInfo(exec, briefing) {
  if (!exec) return '';
  const STAGES = isEfStylePanoramaCard(exec) ? CENTRAL_STAGES : PROCESS_STAGES;
  const stageKeys = Object.keys(STAGES);
  const recs = getStageRecords(briefing, exec.id);
  const metas = stageMeta(STAGES, stageKeys, recs).filter(m => m.has && !isDismissedOnlyStageRec(m.rec));
  if (!metas.length) return '';
  const focused = [...metas].sort(compareStagesByDate).pop();
  if (!focused) return '';
  const dateStr = focused.rec && focused.rec.date ? fmtDate(focused.rec.date) : '';
  const label = focused.sd.label + (focused.outcomeLabel ? ' · ' + focused.outcomeLabel : '');
  return dateStr ? label + ' ' + dateStr : label;
}

function EditionClaudeProcessos(p) {
  const { opId, data, briefing, classified, execs, allDebts, prazosByDebt, openIntimsByProc, openTasksByProc,
    selectedCDAs, setSelectedCDAs, setModal, setData, upsert, togglePrescCheck,
    procCdaQuery, setProcCdaQuery, cdaPersonFilter, setCdaPersonFilter, people, linkify, focus, onFocusDone } = p;
  const { hubs, coveredByHub, uncoveredEFs, extinct, others, othersByParent, apensosByParent, unlinked, duplicates } = classified;

  const [sigActive, setSigActive] = React.useState(() => new Set());
  const toggleSigFilter = (k) => setSigActive(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const [sortBy, setSortBy] = React.useState('valor');
  const [drawerExecId, setDrawerExecId] = React.useState(null);
  const [drawerCda, setDrawerCda] = React.useState(null); // { id, execId } | null — exclusivo com drawerExecId
  const [showExtinct, setShowExtinct] = React.useState(false);
  /* Faixas de situação recolhidas (linha de grupo clicável); lembrado entre sessões. */
  const [bandsClosed, setBandsClosed] = React.useState(() => {
    try { const v = JSON.parse(localStorage.getItem('nexus_cx_bands_closed') || 'null'); if (v && typeof v === 'object') return v; } catch (e) {}
    return { suspensa: true, arquivada: true };
  });
  const toggleBand = (k) => setBandsClosed(prev => {
    const n = { ...prev, [k]: !prev[k] };
    try { localStorage.setItem('nexus_cx_bands_closed', JSON.stringify(n)); } catch (e) {}
    return n;
  });
  const [showMore, setShowMore] = React.useState({});
  const fold = cxUseFold('processos'); // Embargos e Outros nascem fechados (como antes); o resto, abertos; a escolha fica lembrada
  const CARD_OPEN = { inc: true, semv: true, na: true, rec: true, emb: false, out: false };
  const [peopleOpen, setPeopleOpen] = React.useState(false);
  const [hubOpenOverride, setHubOpenOverride] = React.useState({});

  const passSig = (exec) => {
    if (sigActive.size === 0) return true;
    if (!exec) return false;
    const f = cxSigFlags(exec, data);
    for (const k of sigActive) if (!f[k]) return false;
    return true;
  };
  const filterRows = (groups) => (groups || []).filter(g => g.type !== 'exec' || passSig(g.exec));

  const allExecGroups = React.useMemo(() => {
    const seen = new Set(); const out = [];
    const add = (g) => { if (g && g.exec && !seen.has(g.exec.id)) { seen.add(g.exec.id); out.push(g); } };
    hubs.forEach(add);
    Object.values(coveredByHub).forEach(arr => (arr || []).forEach(add));
    uncoveredEFs.forEach(add); extinct.forEach(add); others.forEach(add);
    return out;
  }, [classified]);
  const sigCounts = React.useMemo(() => {
    const c = { star: 0, pin: 0, watch: 0, copy: 0, lock: 0, task: 0, intim: 0 };
    allExecGroups.forEach(g => { const f = cxSigFlags(g.exec, data); CX_SIG_DEFS.forEach(s => { if (f[s.k]) c[s.k]++; }); });
    return c;
  }, [allExecGroups, data]);

  const cmp = cxProcSortCmp(sortBy, prazosByDebt);
  const otherBuckets = splitOtherProcGroups(others);
  const unlinkedCdas = (unlinked || []).flatMap(g => g.cdas || []);
  const unlinkedVisible = sigActive.size === 0 ? unlinkedCdas : [];
  const uncoveredVisible = filterRows(uncoveredEFs).sort(cmp);
  const extinctVisible = filterRows(extinct).sort(cmp);
  const incAlarms = cxAlarmCount([...hubs, ...Object.values(coveredByHub).flat()].filter(g => passSig(g.exec)), prazosByDebt);
  const semVincAlarms = cxAlarmCount(uncoveredVisible, prazosByDebt);
  const naRisk = prazosRiskMetaForCdas(unlinkedVisible, prazosByDebt);
  const incValue = [...hubs, ...Object.values(coveredByHub).flat()].filter(g => passSig(g.exec)).reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
  const semVincValue = uncoveredVisible.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
  const naValue = unlinkedVisible.reduce((s, d) => s + (d.value || 0), 0);
  const naHeaderValue = unlinkedCdas.reduce((s, d) => s + (d.value || 0), 0);
  const embargosOpenPrazo = (otherBuckets.embargos || []).some(g => (openIntimsByProc.get(normProc(g.exec.processNumber)) || []).length > 0);

  // Só uma ficha por vez: abrir a do processo fecha a da CDA e vice-versa.
  const openDrawerFor = (execId) => { setDrawerExecId(execId); setDrawerCda(null); };
  const closeDrawer = () => setDrawerExecId(null);
  const openCdaDrawer = (cdaId, execId) => { setDrawerCda({ id: cdaId, execId: execId || null }); setDrawerExecId(null); };
  const closeCdaDrawer = () => setDrawerCda(null);
  const drawerOpen = !!drawerExecId || !!drawerCda;
  /* Pedido de fora (Linha do tempo): abre a ficha do processo ou da CDA e avisa que consumiu o pedido. */
  React.useEffect(() => {
    if (!focus) return;
    if (focus.cdaId) openCdaDrawer(focus.cdaId, focus.execId || null);
    else if (focus.execId) openDrawerFor(focus.execId);
    if (onFocusDone) onFocusDone();
  }, [focus && focus.n]);
  const scrollToCard = (id) => { const el = document.getElementById('cx-pcard-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (!fold.isOpen(id, CARD_OPEN[id])) fold.set(id, false); };

  const toggleGroupSelect = (cdas) => setSelectedCDAs(prev => { const n = new Set(prev); const all = cdas.every(d => n.has(d.id)); cdas.forEach(d => all ? n.delete(d.id) : n.add(d.id)); return n; });
  const toggleCdaSel = (id) => setSelectedCDAs(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const rowKey = (g) => g.type === 'exec' ? g.exec.id : 'unlinked';

  /* Linha de um processo (EF, hub, recurso, embargo…), com apensos aninhados.
     depth 0 = condutor/sem vínculo (sem traço); depth 1 = abrangido do hub; depth 2 =
     apenso de um abrangido. isLast/parentHasMore alimentam a árvore (CxTreeMark). */
  const ProcRow = ({ g, depth = 0, isLast = true, parentHasMore = false }) => {
    const meta = cxEfMeta(g, prazosByDebt);
    const apensos = (apensosByParent && apensosByParent[g.exec.id]) || [];
    const isSel = (g.cdas || []).length > 0 && g.cdas.every(d => selectedCDAs.has(d.id));
    return <React.Fragment key={g.exec.id}>
      <tr className={'cx-pt-row' + cxTreeRowClass(depth) + (drawerExecId === g.exec.id ? ' on' : '')} onClick={() => openDrawerFor(g.exec.id)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleGroupSelect(g.cdas || [])} disabled={!(g.cdas || []).length} /></td>
        <td className={'cx-pt-num' + (depth > 0 ? ' nest' + Math.min(depth, 2) : '')}>
          <CxTreeMark level={depth} isLast={isLast} parentHasMore={parentHasMore} />
          <CxNumCopy value={g.exec.processNumber}><span className="cx-mono">{g.exec.processNumber || 'S/N'}</span></CxNumCopy>
          {apensos.length > 0 && <span className="cx-pt-apc">{apensos.length} ap.</span>}</td>
        {!drawerOpen && <td className="cx-pt-sig"><ProcRowSymbols exec={g.exec} data={data} fixed /></td>}
        <td className="cx-pt-st"><span className={'badge ' + (meta.st.badge || 'badge-muted')}>{meta.st.label || g.exec.status || '—'}</span></td>
        {!drawerOpen && <td className="cx-pt-r">{(g.cdas || []).length}</td>}
        <td className="cx-pt-r cx-mono">{fmtCur(meta.total)}</td>
        <CxPrescCell cdas={g.cdas} prazosByDebt={prazosByDebt} />
      </tr>
      {apensos.map((ap, i) => <ProcRow key={ap.exec.id} g={ap} depth={depth + 1} isLast={i === apensos.length - 1} parentHasMore={!isLast} />)}
    </React.Fragment>;
  };

  /* Colunas fixas e compartilhadas (A5): as seis tabelas empilhadas da aba usam o mesmo <colgroup>, então Situação, CDAs,
     Valor e Prescrição ficam alinhados de um cartão para o outro. `blank` (CDAs não ajuizadas) mantém as colunas
     Marcadores e CDAs, só que vazias, para Situação/Valor/Prescrição caírem nos mesmos x. */
  const ProcTableHead = ({ first = 'Processo', blank = false }) => (
    <>
      <colgroup><col className="cx-pt-c-ck" /><col />{!drawerOpen && <col className="cx-pt-c-sig" />}<col className="cx-pt-c-st" />{!drawerOpen && <col className="cx-pt-c-n" />}<col className="cx-pt-c-val" /><col className="cx-pt-c-presc" /></colgroup>
      <thead><tr><th className="cx-pt-ck"></th><th>{first}</th>{!drawerOpen && <th className="cx-pt-sig">{blank ? '' : 'Marcadores'}</th>}<th>Situação</th>{!drawerOpen && <th className="cx-pt-r">{blank ? '' : 'CDAs'}</th>}<th className="cx-pt-r">Valor</th><th>Prescrição</th></tr></thead>
    </>
  );

  /* Grupo com linha de subtotal + "mostrar mais" após 8 linhas. */
  const GroupBlock = ({ groupKey, label, rows, extra, depth = 0, collapsed = false, onToggle = null }) => {
    const sorted = [...rows].sort(cmp);
    const shown = showMore[groupKey] || 8;
    const visible = sorted.slice(0, shown);
    const rest = sorted.length - visible.length;
    const totals = rows.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
    const cdaCount = rows.reduce((s, g) => s + (g.cdas || []).length, 0);
    const groupCdas = rows.flatMap(g => g.cdas || []);
    const restVal = sorted.slice(shown).reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
    return <React.Fragment>
      {label && <tr className={'cx-pt-band' + (onToggle ? ' tgl' : '')} onClick={onToggle || undefined}>
        <td className="cx-pt-ck">{onToggle && <span className="cx-chev sm" aria-hidden="true">{collapsed ? '▸' : '▾'}</span>}</td><td colSpan={drawerOpen ? 2 : 3}><b>{label}</b> <span className="cx-muted cx-small">{rows.length} {rows.length === 1 ? 'processo' : 'processos'}</span></td>
        {!drawerOpen && <td className="cx-pt-r">{cdaCount}</td>}
        <td className="cx-pt-r cx-mono">{fmtCur(totals)}</td>
        <CxPrescCell cdas={groupCdas} prazosByDebt={prazosByDebt} />
      </tr>}
      {!collapsed && visible.map((g, i) => <ProcRow key={rowKey(g)} g={g} depth={depth} isLast={i === visible.length - 1 && rest === 0} />)}
      {!collapsed && rest > 0 && <tr className="cx-pt-more"><td colSpan={7}><button type="button" className="cx-link-btn" onClick={() => setShowMore(prev => ({ ...prev, [groupKey]: shown + 20 }))}>Mostrar mais {rest} · {fmtCur(restVal)}</button></td></tr>}
      {extra}
    </React.Fragment>;
  };

  /* ── Cartão: Incidentes e execução de destaque ── */
  const incGroups = hubs.map(h => ({ h, covered: filterRows(coveredByHub[h.exec.id] || []) }));
  const incVisibleHubs = incGroups;
  const isHubOpen = (id) => hubOpenOverride.hasOwnProperty(id)
    ? hubOpenOverride[id]
    : (incVisibleHubs.length === 1 || id === (hubs[0] && hubs[0].exec.id));
  const toggleHubOpen = (id) => setHubOpenOverride(prev => ({ ...prev, [id]: !isHubOpen(id) }));
  const allHubsOpen = incGroups.length > 0 && incGroups.every(x => isHubOpen(x.h.exec.id));
  const setAllHubsOpen = (open) => setHubOpenOverride(Object.fromEntries(incGroups.map(x => [x.h.exec.id, open])));
  /* Linha de grupo do hub (IDPJ/MCF/Central): fase atual, "cobre N EFs/apensos", sinais, subtotal e
     pior prescrição do próprio hub + tudo o que ele cobre (incl. apensos aninhados). Recolhível. */
  const HubGroupRow = ({ h, covered }) => {
    const open = isHubOpen(h.exec.id);
    const bm = badgeFor(h.exec);
    const kind = cxProcKind(h.exec);
    const coveredFlat = cxFlattenWithApensos(covered, apensosByParent);
    const allForHub = [h, ...coveredFlat];
    const cdaCount = allForHub.reduce((s, g) => s + (g.cdas || []).length, 0);
    const cdasFlat = allForHub.flatMap(g => g.cdas || []);
    const totalVal = allForHub.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
    const hMeta = cxEfMeta(h, prazosByDebt);
    const phase = cxHubStageInfo(h.exec, briefing);
    const unitLabel = covered.length + ' ' + bm.unit + (covered.length === 1 ? '' : 's');
    return <React.Fragment key={h.exec.id}>
      <tr className={'cx-pt-hubrow' + (drawerExecId === h.exec.id ? ' on' : '')} onClick={() => openDrawerFor(h.exec.id)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><button type="button" className="cx-chev sm" onClick={ev => { ev.stopPropagation(); toggleHubOpen(h.exec.id); }} aria-label={open ? 'Recolher' : 'Expandir'}>{open ? '▾' : '▸'}</button></td>
        <td className="cx-pt-num">
          <span className={'cx-pd-kind ' + kind.cls}>{kind.label}</span>
          <CxNumCopy value={h.exec.processNumber}><span className="cx-mono">{h.exec.processNumber || 'S/N'}</span></CxNumCopy>
          <div className="cx-pt-hub-s">{phase ? phase + ' · ' : ''}cobre {unitLabel}</div>
        </td>
        {!drawerOpen && <td className="cx-pt-sig"><ProcRowSymbols exec={h.exec} data={data} fixed /></td>}
        <td className="cx-pt-st"><span className={'badge ' + (hMeta.st.badge || 'badge-muted')}>{hMeta.st.label || h.exec.status || '—'}</span></td>
        {!drawerOpen && <td className="cx-pt-r">{cdaCount}</td>}
        <td className="cx-pt-r cx-mono"><b>{fmtCur(totalVal)}</b></td>
        <CxPrescCell cdas={cdasFlat} prazosByDebt={prazosByDebt} />
      </tr>
      {open && <GroupBlock groupKey={'inc-' + h.exec.id} label={null} rows={covered} depth={1} />}
    </React.Fragment>;
  };

  /* ── Cartão: Execuções sem vínculo ── */
  const bandOf = (list) => {
    const map = { ativa: [], suspensa: [], suspensa_parcelamento: [], arquivada: [] };
    (list || []).forEach(g => { const k = efBandKey(g.exec); if (map[k]) map[k].push(g); else map.ativa.push(g); });
    return map;
  };
  const semVincBands = bandOf(uncoveredVisible);

  const cardCollapsed = (id) => !fold.isOpen(id, CARD_OPEN[id]); // o corpo só é montado com o cartão aberto; as guardas abaixo são redundantes, de propósito

  /* ── Ficha lateral: monta o group/relacionados do exec aberto ── */
  const drawerCtx = React.useMemo(() => {
    if (!drawerExecId) return null;
    let g = allExecGroups.find(x => x.exec.id === drawerExecId);
    if (!g) {
      // pode ser um apenso, não incluído em allExecGroups (que só tem topo)
      const flatApensos = Object.values(apensosByParent || {}).flat();
      g = flatApensos.find(x => x.exec.id === drawerExecId);
    }
    if (!g) return null;
    let hubLabel = null;
    const hubEntry = hubs.find(h => (coveredByHub[h.exec.id] || []).some(c => c.exec.id === drawerExecId));
    if (hubEntry) hubLabel = cxProcKind(hubEntry.exec).label + ' ' + (hubEntry.exec.processNumber || '');
    const apensoNums = (apensosByParent[g.exec.id] || []).map(x => x.exec.processNumber).filter(Boolean);
    const relatedOthers = othersByParent[g.exec.id] || [];
    return { group: g, hubLabel, apensoNums, relatedOthers };
  }, [drawerExecId, classified]);

  const totalSelValue = allDebts.filter(d => selectedCDAs.has(d.id)).reduce((s, d) => s + (d.value || 0), 0);
  const selProcs = new Set(allDebts.filter(d => selectedCDAs.has(d.id)).map(d => normProc(d.processNumber)).filter(Boolean));
  const selNaCount = allDebts.filter(d => selectedCDAs.has(d.id) && !normProc(d.processNumber)).length;
  const bulkSetHandled = (val, type) => {
    const ids = [...selectedCDAs];
    const now = new Date().toISOString(); const today = now.slice(0, 10);
    setData(prev => ({ ...prev, debts: prev.debts.map(d => ids.includes(d.id) ? { ...d, prescriptionHandled: val, prescriptionHandledAt: val ? today : d.prescriptionHandledAt, prescriptionHandledType: val ? (type || 'declarada') : d.prescriptionHandledType, updatedAt: now } : d) }));
  };

  return <div className="cx cx-page cx-page-wide cx-pp">
    <CxKpiStrip n={6}>
      <CxKpiCard label="Incidentes e destaque" value={hubs.length} desc={fmtCur(incValue)} onClick={() => scrollToCard('inc')}
        foot={incAlarms > 0 ? cxPl(incAlarms, 'no alarme', 'no alarme') : 'Nenhum no alarme'} footTone={incAlarms > 0 ? 'cx-red-t' : ''} />
      <CxKpiCard label="Execuções sem vínculo" value={uncoveredEFs.length} desc={fmtCur(semVincValue)} onClick={() => scrollToCard('semv')}
        foot={semVincAlarms > 0 ? cxPl(semVincAlarms, 'no alarme', 'no alarme') : 'Nenhuma no alarme'} footTone={semVincAlarms > 0 ? 'cx-red-t' : ''} />
      <CxKpiCard label="Não ajuizadas" value={unlinkedCdas.length + ' CDAs'} desc={fmtCur(naValue)} onClick={() => scrollToCard('na')}
        foot={naRisk.riskClass === 'critical' ? 'No alarme' : 'Fora do alarme'} footTone={naRisk.riskClass === 'critical' ? 'cx-red-t' : ''} />
      <CxKpiCard label="Recursos" value={otherBuckets.recursos.length} desc="pelo processo principal" onClick={() => scrollToCard('rec')}
        foot={otherBuckets.recursos.length + ' de ' + cxPl(execs.length, 'processo', 'processos')} />
      <CxKpiCard label="Embargos" value={otherBuckets.embargos.length} desc="à execução e de terceiro" onClick={() => scrollToCard('emb')}
        foot={embargosOpenPrazo ? 'Prazo aberto' : 'Nenhum prazo aberto'} footTone={embargosOpenPrazo ? 'cx-red-t' : ''} />
      <CxKpiCard label="Outros" value={otherBuckets.outros.length} desc="demais processos" onClick={() => scrollToCard('out')}
        foot={otherBuckets.outros.length + ' de ' + cxPl(execs.length, 'processo', 'processos')} />
    </CxKpiStrip>

    <div className="cx-pp-toolbar">
      <input className="cx-tab-q" value={procCdaQuery} onChange={e => setProcCdaQuery(e.target.value)} placeholder="Filtrar processo ou CDA" />
      <div className="cx-pp-person">
        <button type="button" className={'cx-btn sm' + (cdaPersonFilter !== 'all' ? ' primary' : '')} onClick={() => setPeopleOpen(v => !v)}>Pessoa: {cdaPersonFilter === 'all' ? 'todas' : ((people || []).find(x => x.id === cdaPersonFilter) || {}).name || '—'}</button>
        {peopleOpen && <div className="cx-menu-pop cx-pp-people-pop">
          <button type="button" onClick={() => { setCdaPersonFilter('all'); setPeopleOpen(false); }}>Todas</button>
          {(people || []).map(pp => <button key={pp.id} type="button" onClick={() => { setCdaPersonFilter(pp.id); setPeopleOpen(false); }}>{pp.name}</button>)}
        </div>}
      </div>
      <CxSigFilterBar counts={sigCounts} active={sigActive} onToggle={toggleSigFilter} />
      <span className="cx-sp" />
      <CxSelect pre="Ordenar" label="Ordenar processos" value={sortBy} onChange={setSortBy} options={[['valor', 'Valor'], ['prescricao', 'Prescrição'], ['numero', 'Número']]} />
      <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'execution', initial: {} })}>+ Processo</button>
    </div>

    {duplicates && duplicates.length > 0 && (
      <div className="cx-pp-dup">⚠ {duplicates.length} {duplicates.length === 1 ? 'duplicidade detectada' : 'duplicidades detectadas'} — mesmo número e espécie cadastrados mais de uma vez.</div>
    )}

    <div className="cx-pp-body">
      <div className="cx-pp-cards cx-pp-cards-fold">
        {/* Incidentes e execução de destaque */}
        <CxFoldCard id="inc" scope="processos" as="h5" className="cx-pcard" domId="cx-pcard-inc" title="Incidentes e execução de destaque" count={hubs.length} sub="· IDPJ, cautelar e central com as EFs cobertas"
          summary={cxPl(hubs.length, 'incidente', 'incidentes')} actions={hubs.length >= 4 ? <button type="button" className="cx-link-btn cx-card-h-act" onClick={ev => { ev.stopPropagation(); setAllHubsOpen(!allHubsOpen); }}>{allHubsOpen ? 'recolher todos' : 'expandir todos'}</button> : null}>
          {!cardCollapsed('inc') && hubs.length > 0 && <>
            <div className="cx-pt-wrap"><table className="cx-pt cx-pt-fx"><ProcTableHead /><tbody>
              {incVisibleHubs.map(({ h, covered }) => <HubGroupRow key={h.exec.id} h={h} covered={covered} />)}
            </tbody></table></div>
          </>}
          {!cardCollapsed('inc') && hubs.length === 0 && <div className="cx-empty-row">Nenhum IDPJ, MCF ou execução central levada ao panorama.</div>}
        </CxFoldCard>

        {/* Execuções sem vínculo */}
        <CxFoldCard id="semv" scope="processos" as="h5" className="cx-pcard" domId="cx-pcard-semv" title="Execuções sem vínculo" count={uncoveredEFs.length} sub="· fora de IDPJ, cautelar e central"
          summary={cxPl(uncoveredEFs.length, 'execução', 'execuções')}>
          {!cardCollapsed('semv') && <>
            {uncoveredEFs.length === 0 && extinctVisible.length === 0 ? <div className="cx-empty-row">Nenhuma execução fora de IDPJ, cautelar e central.</div> :
            <div className="cx-pt-wrap"><table className="cx-pt cx-pt-fx"><ProcTableHead /><tbody>
              {['ativa', 'suspensa', 'suspensa_parcelamento', 'arquivada'].filter(k => (semVincBands[k] || []).length).map(k => {
                const bd = EF_BANDS.find(b => b.key === k);
                return <GroupBlock key={k} groupKey={'sv-' + k} label={bd.label} rows={semVincBands[k] || []} collapsed={!!bandsClosed[k]} onToggle={() => toggleBand(k)} />;
              })}
              {showExtinct && extinctVisible.length > 0 && <GroupBlock groupKey="sv-ext" label="Extintas" rows={extinctVisible} onToggle={() => setShowExtinct(false)} />}
              {!showExtinct && extinctVisible.length > 0 && <tr className="cx-pt-more dim"><td colSpan={7}>{extinctVisible.length} extintas ocultas · {fmtCur(extinctVisible.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0))} <button type="button" className="cx-link-btn" onClick={() => setShowExtinct(true)}>mostrar</button></td></tr>}
            </tbody></table></div>}
          </>}
        </CxFoldCard>

        <CxFoldCard id="na" scope="processos" as="h5" className="cx-pcard" domId="cx-pcard-na" title="CDAs não ajuizadas" count={unlinkedCdas.length} sub="· sem processo"
          summary={unlinkedCdas.length ? fmtCur(naHeaderValue) : 'nenhuma'}>
          {!cardCollapsed('na') && <div className="cx-pt-wrap"><table className="cx-pt cx-pt-fx"><ProcTableHead first="Inscrição" blank /><tbody>
            {unlinkedVisible.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhuma CDA não ajuizada.</td></tr>}
            {unlinkedVisible.length > 0 && (() => {
              const shownN = showMore['na'] || 8;
              const sortedNa = [...unlinkedVisible].sort((a, b) => sortBy === 'numero' ? String(a.cdaNumber || '').localeCompare(String(b.cdaNumber || '')) : (b.value || 0) - (a.value || 0));
              const visN = sortedNa.slice(0, shownN); const restN = sortedNa.length - visN.length;
              return <React.Fragment>
                {visN.map(d => {
                  const isSel = selectedCDAs.has(d.id);
                  const isOpen = !!drawerCda && drawerCda.id === d.id;
                  return <tr key={d.id} className={'cx-pt-row cx-pt-row-cda' + (isOpen ? ' on' : '')} onClick={() => openCdaDrawer(d.id)}>
                    <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleCdaSel(d.id)} /></td>
                    <td className="cx-pt-num"><CxNumCopy value={d.cdaNumber}><span className="cx-mono">{d.cdaNumber || 'CDA'}</span></CxNumCopy> <span className="cx-muted cx-small">{cdaEspecie(d)}</span></td>
                    {!drawerOpen && <td className="cx-pt-sig"></td>}
                    <td className="cx-pt-st"><span className="badge badge-muted">Não ajuizada</span></td>
                    {!drawerOpen && <td className="cx-pt-r"></td>}
                    <td className="cx-pt-r cx-mono">{fmtCur(d.value)}</td>
                    <CxPrescCell cdas={[d]} prazosByDebt={prazosByDebt} />
                  </tr>;
                })}
                {restN > 0 && <tr className="cx-pt-more"><td colSpan={7}><button type="button" className="cx-link-btn" onClick={() => setShowMore(s => ({ ...s, na: shownN + 20 }))}>Mostrar mais {restN} CDAs</button></td></tr>}
              </React.Fragment>;
            })()}
          </tbody></table></div>}
        </CxFoldCard>

        {/* Recursos */}
        <CxFoldCard id="rec" scope="processos" as="h5" className="cx-pcard" domId="cx-pcard-rec" title="Recursos" count={otherBuckets.recursos.length} sub="· agrupados pelo processo principal"
          summary={cxPl(otherBuckets.recursos.length, 'recurso', 'recursos')}>
          {!cardCollapsed('rec') && <div className="cx-pt-wrap"><table className="cx-pt cx-pt-fx"><ProcTableHead /><tbody>
            {(() => {
              const byParent = new Map();
              filterRows(otherBuckets.recursos).forEach(g => { const pid = g.exec.parentExecutionId || '—'; if (!byParent.has(pid)) byParent.set(pid, []); byParent.get(pid).push(g); });
              const parentExec = (id) => execs.find(e => e.id === id);
              return [...byParent.entries()].map(([pid, list]) => {
                const parent = parentExec(pid);
                const label = parent ? `de ${cxProcKind(parent).label} ${parent.processNumber || ''}` : 'sem processo principal identificado';
                return <GroupBlock key={pid} groupKey={'rec-' + pid} label={label} rows={list} />;
              });
            })()}
            {otherBuckets.recursos.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhum recurso.</td></tr>}
          </tbody></table></div>}
        </CxFoldCard>

        {/* Embargos */}
        <CxFoldCard id="emb" scope="processos" as="h5" className="cx-pcard" domId="cx-pcard-emb" title="Embargos" count={otherBuckets.embargos.length} sub={<>· embargos à execução, à execução fiscal e de terceiro {embargosOpenPrazo && <span className="cx-badge red">prazo aberto</span>}</>} defaultOpen={false}
          summary={embargosOpenPrazo ? 'prazo aberto' : cxPl(otherBuckets.embargos.length, 'embargo', 'embargos')}>
          {!cardCollapsed('emb') && <div className="cx-pt-wrap"><table className="cx-pt cx-pt-fx"><ProcTableHead /><tbody>
            <GroupBlock groupKey="emb-all" label={null} rows={filterRows(otherBuckets.embargos)} />
            {otherBuckets.embargos.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhum embargo.</td></tr>}
          </tbody></table></div>}
        </CxFoldCard>

        {/* Outros */}
        <CxFoldCard id="out" scope="processos" as="h5" className="cx-pcard" domId="cx-pcard-out" title="Outros" count={otherBuckets.outros.length} sub="· cumprimento, procedimento comum e demais" defaultOpen={false}
          summary={cxPl(otherBuckets.outros.length, 'processo', 'processos')}>
          {!cardCollapsed('out') && <div className="cx-pt-wrap"><table className="cx-pt cx-pt-fx"><ProcTableHead /><tbody>
            <GroupBlock groupKey="out-all" label={null} rows={filterRows(otherBuckets.outros)} />
            {otherBuckets.outros.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhum outro processo.</td></tr>}
          </tbody></table></div>}
        </CxFoldCard>
      </div>

      {drawerCda ? (() => {
        const d = allDebts.find(x => x.id === drawerCda.id);
        if (!d) return null;
        const exec = drawerCda.execId
          ? execs.find(x => x.id === drawerCda.execId)
          : (data.executions || []).find(x => x.processNumber && sameProc(x.processNumber, d.processNumber));
        return <EditionClaudeCdaDrawer debt={d} exec={exec} data={data} opId={opId} prazosByDebt={prazosByDebt}
          selectedCDAs={selectedCDAs} setSelectedCDAs={setSelectedCDAs} setModal={setModal} setData={setData}
          togglePrescCheck={togglePrescCheck} onClose={closeCdaDrawer} onOpenExec={openDrawerFor} linkify={p.linkify} />;
      })() : drawerCtx && (
        <EditionClaudeProcDrawer group={drawerCtx.group} data={data} opId={opId} hubLabel={drawerCtx.hubLabel}
          apensoNums={drawerCtx.apensoNums} relatedOthers={drawerCtx.relatedOthers} prazosByDebt={prazosByDebt}
          selectedCDAs={selectedCDAs} setSelectedCDAs={setSelectedCDAs} setModal={setModal} setData={setData}
          upsert={upsert} togglePrescCheck={togglePrescCheck} onClose={closeDrawer} onOpenExec={openDrawerFor}
          onOpenCda={openCdaDrawer} linkify={p.linkify} />
      )}
    </div>

    {selectedCDAs.size > 0 && (
      <div className="cx-pp-bulk">
        <b>{selectedCDAs.size} {selectedCDAs.size === 1 ? 'CDA selecionada' : 'CDAs selecionadas'}</b>
        <span className="cx-muted cx-small">{selProcs.size > 0 ? `· ${selProcs.size} ${selProcs.size === 1 ? 'processo' : 'processos'}` : ''}{selNaCount > 0 ? ` + ${selNaCount} não ajuizada(s)` : ''} · {fmtCur(totalSelValue)}</span>
        {selProcs.size > 1 && <span className="cx-pp-bulk-warn">Seleção multiprocesso — o evento em bloco grava um único registro (batchCdaIds) aplicado a todas.</span>}
        <span className="cx-sp" />
        <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'prescriptionEvent', initial: { batchCdaIds: [...selectedCDAs] } })}>+ Evento em lote</button>
        <button type="button" className="cx-btn sm" onClick={() => bulkSetHandled(true, 'declarada')}>✓ Marcar como tratadas</button>
        <button type="button" className="cx-btn sm" onClick={() => bulkSetHandled(true, 'aguardando_reconhecimento')}>⏳ Aguardando reconhecimento</button>
        <button type="button" className="cx-btn sm" onClick={() => bulkSetHandled(false)}>↻ Reabrir</button>
        <button type="button" className="cx-btn sm ghost" onClick={() => setSelectedCDAs(new Set())}>Limpar</button>
      </div>
    )}
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 9 — Inscrições, Partes e bens no Prumo: mesmo padrão da Fase 8 (números
   da aba, barra de ferramentas, tabela agrupada com subtotal, ficha lateral,
   lote no pé). Lê os MESMOS dados/estados do app (getOpSlices, prazosByDebt,
   cdaPersonFilter, procCdaQuery, cdaSort, selectedDebts/selectedAssets…); não
   toca parsers, prescrição ou sync. Em src/app.jsx (renderTab), quando
   isClaude, estes componentes substituem o conteúdo das abas 'dividas',
   'pessoas' e 'bens' — Clássico e Beta não mudam.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Inscrições: mesma estrutura "por processo" da aba clássica (guarda-chuva
   IDPJ/Cautelar/Central/EF-raiz → subgrupos por execução vinculada → CDAs;
   CDAs sem processo em "unajuizadas"). Leitura pura, nenhum cálculo novo. ─── */
function cxCdaGroupsByProcess(items, opExecs) {
  const execsById = Object.fromEntries((opExecs || []).map(e => [e.id, e]));
  const execsByProcNum = {};
  (opExecs || []).forEach(e => { if (e.processNumber) execsByProcNum[e.processNumber] = e; });
  const execToIdpj = {};
  (opExecs || []).filter(e => e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal').forEach(idpj => {
    (idpj.linkedExecutionIds || []).forEach(execId => { if (!execToIdpj[execId]) execToIdpj[execId] = idpj; });
  });
  const rootOf = (execId) => {
    let cur = execsById[execId];
    const seen = new Set();
    while (cur && cur.parentExecutionId && !seen.has(cur.id)) {
      seen.add(cur.id);
      const parent = execsById[cur.parentExecutionId];
      if (!parent) break;
      cur = parent;
    }
    return cur;
  };
  const umbrellaMap = {};
  const unajuizadas = [];
  (items || []).forEach(d => {
    if (!d.processNumber) { unajuizadas.push(d); return; }
    const directExec = execsByProcNum[d.processNumber];
    if (!directExec) { unajuizadas.push(d); return; }
    const rootExec = rootOf(directExec.id) || directExec;
    const umbrella = execToIdpj[directExec.id] || execToIdpj[rootExec.id] || rootExec;
    const uk = umbrella.id;
    if (!umbrellaMap[uk]) umbrellaMap[uk] = { umbrella, subGroups: {}, allCdas: [] };
    umbrellaMap[uk].allCdas.push(d);
    const subKey = directExec.id;
    if (!umbrellaMap[uk].subGroups[subKey]) umbrellaMap[uk].subGroups[subKey] = { subExec: directExec, cdas: [] };
    umbrellaMap[uk].subGroups[subKey].cdas.push(d);
  });
  const groups = Object.values(umbrellaMap);
  groups.forEach(g => {
    g.subGroupArr = Object.values(g.subGroups).sort((a, b) => (b.cdas.reduce((s, d) => s + (d.value || 0), 0)) - (a.cdas.reduce((s, d) => s + (d.value || 0), 0)));
  });
  groups.sort((a, b) => {
    const rank = (u) => u.processTag === 'idpj' ? 0 : u.processTag === 'cautelar_fiscal' ? 1 : u.processTag === 'central' ? 2 : 3;
    const ra = rank(a.umbrella), rb = rank(b.umbrella);
    if (ra !== rb) return ra - rb;
    return (b.allCdas.reduce((s, d) => s + (d.value || 0), 0)) - (a.allCdas.reduce((s, d) => s + (d.value || 0), 0));
  });
  return { groups, unajuizadas };
}

/* Contagem de CDAs por pessoa (todos os papéis de responsabilidade) — mesmo cálculo do
   PersonSubtabs clássico (mode 'cda'), para o seletor "Pessoa" da barra de Inscrições. */
function cxPersonCdaCounts(data, opId) {
  const opPeople = (data.people || []).filter(p => p.operationId === opId);
  const opDebts = (data.debts || []).filter(d => d.operationId === opId);
  const links = (data.links && data.links.cdaResponsibilities) || [];
  return opPeople.map(p => ({ person: p, count: links.filter(l => l.personId === p.id && opDebts.some(d => d.id === l.cdaId)).length }))
    .filter(x => x.count > 0).sort((a, b) => b.count - a.count);
}

/* Célula de Prescrição de uma CDA: mostra tratada/aguardando quando houver, senão a barra e o
   texto de horizonte da Fase 8 (mesmo cxPrescDisplay/CxHorizonBar — nenhum cálculo novo). */
function CxIncPrescCell({ d, prazosByDebt }) {
  const isHandled = !!d.prescriptionHandled;
  const isAguardando = isHandled && d.prescriptionHandledType === 'aguardando_reconhecimento';
  if (isAguardando) return <td className="cx-pt-presc risk-critical">⏳ aguardando reconhecimento</td>;
  if (isHandled) return <td className="cx-pt-presc risk-ok">✓ tratada</td>;
  return <CxPrescCell cdas={[d]} prazosByDebt={prazosByDebt} />;
}

/* Linha de uma CDA na tabela de Inscrições — mesmos dados do cartão clássico (status,
   decadência, ajuizada, alerta de processo extinto/arquivado, tratada/aguardando, notas). */
function CxIncRow({ d, data, prazosByDebt, isSel, onToggleSel, isOpen, onOpen, depth, isLast = true, parentHasMore = false }) {
  const st = DEBT_STATUSES[d.status] || {};
  const deca = (d.launchMode || d.taxPeriodEnd) ? computeDecadencia(d) : null;
  const sysAlerts = d.systemAlerts || [];
  const procStatusAlert = sysAlerts.find(a => a.type === 'process_status');
  const notes = (d.notesList || (d.notes ? [d.notes] : [])).filter(Boolean);
  return <tr className={'cx-pt-row cx-pt-row-cda' + cxTreeRowClass(depth) + (isOpen ? ' on' : '')} data-cda-id={d.id} onClick={() => onOpen(d.id)}>
    <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={onToggleSel} aria-label={'Selecionar CDA ' + (d.cdaNumber || '')} /></td>
    <td className={'cx-pt-num' + (depth ? ' nest' + Math.min(depth, 2) : '')}>
      <CxTreeMark level={depth} isLast={isLast} parentHasMore={parentHasMore} />
      <CxNumCopy value={d.cdaNumber}><span className="cx-mono">{d.cdaNumber || 'CDA'}</span></CxNumCopy>
      <span className="cx-muted cx-small"> · {cdaEspecie(d)}</span>
      {notes.length > 0 && <span className="cx-copy" title={notes.join('\n')} aria-label={notes.length + ' nota(s)'}><CxIcon n="note" s={11} /></span>}
    </td>
    <td className="cx-inc-resp"><ResponsibilityChips cdaId={d.id} data={data} onClickPerson={() => { }} /></td>
    <td className="cx-pt-st">
      <span className={'badge ' + (st.badge || 'badge-muted')}>{st.label || d.status || '—'}</span>
      {deca && (deca.status === 'consumada' || deca.status === 'risco') ? <span className="cx-tag" title={'Decadência: só consulta, não gera aviso. ' + deca.detail}>Decad.</span> : null}
      {procStatusAlert ? <span className="cx-tag orange" title={procStatusAlert.label}>⚠ Proc. {procStatusAlert.processStatus === 'extinta' ? 'extinto' : 'arquivado'}</span> : null}
    </td>
    <td className="cx-pt-r cx-mono">{fmtCur(d.value)}</td>
    <CxIncPrescCell d={d} prazosByDebt={prazosByDebt} />
  </tr>;
}

function EditionClaudeInscricoes(p) {
  const { opId, data, allDebts, opExecs, prazosByDebt, mesaCards, selectedDebts, setSelectedDebts,
    cdaPersonFilter, setCdaPersonFilter, procCdaQuery, setProcCdaQuery, cdaSort, setCdaSort,
    setModal, setData, togglePrescCheck, bulkDelete, linkify, collapsedGroups, toggleGroup } = p;

  const allLinks = (data.links && data.links.cdaResponsibilities) || [];
  let items = cdaPersonFilter === 'all' ? allDebts : allDebts.filter(d => allLinks.some(l => l.cdaId === d.id && l.personId === cdaPersonFilter));
  if (procCdaQuery) {
    const qRaw = String(procCdaQuery).trim().toLowerCase();
    const qDigits = qRaw.replace(/\D/g, '');
    items = items.filter(d => {
      const num = String(d.cdaNumber || d.number || '').toLowerCase();
      const proc = String(d.processNumber || '');
      return num.includes(qRaw) || proc.toLowerCase().includes(qRaw) || (qDigits && (num.replace(/\D/g, '') + proc.replace(/\D/g, '')).includes(qDigits));
    });
  }

  const [drawerCda, setDrawerCda] = React.useState(null); // { id, execId } | null
  /* Visão da aba: Tabela (padrão) ou Relógios (M4, só as CDAs desta operação). Lembrada neste navegador. */
  const [view, setViewS] = React.useState(() => (cxLs('nexus_cx_insc_view', 'tabela') === 'relogios' ? 'relogios' : 'tabela'));
  const setView = (v) => { setViewS(v); cxLsSet('nexus_cx_insc_view', v); };
  const [peopleOpen, setPeopleOpen] = React.useState(false);
  const [showMore, setShowMore] = React.useState({});

  const GROUP_MODES = ['por_processo', 'status', 'devedor', 'tribute', 'ajuizada'];
  const SORT_MODES = ['value_desc', 'value_asc', 'prescription'];

  const totalAtivo = items.filter(d => d.status !== 'extinta');
  const ajuizadas = items.filter(d => d.processNumber);
  const naoAjuizadas = items.filter(d => !d.processNumber);
  const noAlarme = items.filter(d => mesaIsAction(mesaCards.byDebt.get(d.id)));
  const tratadas = items.filter(d => d.prescriptionHandled && d.prescriptionHandledType !== 'aguardando_reconhecimento');
  const aguardando = items.filter(d => d.prescriptionHandled && d.prescriptionHandledType === 'aguardando_reconhecimento');

  const toggleSel = (id) => setSelectedDebts(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleGroupSel = (ids) => setSelectedDebts(prev => { const n = new Set(prev); const all = ids.every(id => n.has(id)); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; });
  const openDrawer = (id, execId) => setDrawerCda({ id, execId: execId || null });
  const closeDrawer = () => setDrawerCda(null);

  const personCounts = React.useMemo(() => cxPersonCdaCounts(data, opId), [data, opId]);

  let sorted = [...items];
  if (cdaSort === 'value_desc') sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
  else if (cdaSort === 'value_asc') sorted.sort((a, b) => (a.value || 0) - (b.value || 0));
  else if (cdaSort === 'prescription') sorted = cxSortCdasByPresc(sorted, prazosByDebt);

  const groupKey = (d) => {
    const person = data.people.find(x => x.id === d.personId);
    const st = DEBT_STATUSES[d.status] || {};
    if (cdaSort === 'status') return st.label || d.status || 'Sem status';
    if (cdaSort === 'devedor') return (person && person.name) || 'Sem devedor';
    if (cdaSort === 'tribute') return d.tribute || 'Sem tributo';
    if (cdaSort === 'ajuizada') return d.processNumber ? 'Ajuizadas' : 'Não ajuizadas';
    return null;
  };
  const genericGroups = GROUP_MODES.includes(cdaSort) && cdaSort !== 'por_processo' ? (() => {
    const map = {};
    sorted.forEach(d => { const gk = groupKey(d); if (!map[gk]) map[gk] = []; map[gk].push(d); });
    return Object.entries(map).map(([label, list]) => ({ label, items: list }));
  })() : null;

  const { groups, unajuizadas } = React.useMemo(() => cxCdaGroupsByProcess(sorted, opExecs), [sorted, opExecs]);
  /* Relógios: as CDAs que sobraram dos filtros da aba (busca e Pessoa); agrupar/ordenar da tabela não se aplicam. */
  const clkKey = items.map(d => d.id).join('|');
  const clkIds = React.useMemo(() => new Set(items.map(d => d.id)), [clkKey]);
  const clkFiltered = items.length !== allDebts.length;
  const openCdaFromClock = ({ id }) => {
    const d = allDebts.find(x => x.id === id);
    const exec = d && d.processNumber ? (opExecs || []).find(e => e.processNumber && sameProc(e.processNumber, d.processNumber)) : null;
    openDrawer(id, exec ? exec.id : null);
  };

  // "Abrir" vindo de Prazos/Mesa: abre a ficha da CDA e garante a linha visível além do "Mostrar mais".
  const { focusCda, onFocusCdaDone } = p;
  React.useEffect(() => {
    if (!focusCda || !focusCda.id) return;
    const d = allDebts.find(x => x.id === focusCda.id);
    if (!d) return;
    const exec = d.processNumber ? (opExecs || []).find(e => e.processNumber && sameProc(e.processNumber, d.processNumber)) : null;
    setDrawerCda({ id: d.id, execId: exec ? exec.id : null });
    if (cdaSort !== 'por_processo') {
      const key = genericGroups ? 'cda-' + groupKey(d) : 'cda-flat';
      const list = genericGroups ? (((genericGroups.find(g => 'cda-' + g.label === key)) || {}).items || []) : sorted;
      const idx = list.findIndex(x => x.id === d.id);
      if (idx >= 8) setShowMore(s => ({ ...s, [key]: Math.max(s[key] || 8, idx + 1) }));
    }
    if (onFocusCdaDone) onFocusCdaDone();
  }, [focusCda]);

  const totalSelValue = allDebts.filter(d => selectedDebts.has(d.id)).reduce((s, d) => s + (d.value || 0), 0);

  const bulkMemoria = () => {
    const selected = allDebts.filter(d => selectedDebts.has(d.id));
    const memGroups = new Map();
    selected.forEach(d => {
      const entry = { debt: d, timeline: computeCdaLegalTimeline({ debt: d, executions: data.executions, events: data.prescriptionEvents || [] }), personName: (data.people || []).find(pp => pp.id === d.personId)?.name || d.devedor || '' };
      const key = d.processNumber || ('__cda_' + d.id);
      if (!memGroups.has(key)) memGroups.set(key, { processNumber: d.processNumber || '', entries: [] });
      memGroups.get(key).entries.push(entry);
    });
    const reports = [];
    memGroups.forEach(group => {
      const exec = group.processNumber ? (data.executions || []).find(e => sameProc(e.processNumber, group.processNumber)) : null;
      if (exec) reports.push(buildProcessPrescricaoReport({ exec, entries: group.entries }));
      else group.entries.forEach(entry => reports.push(buildPrescricaoReport({ debt: entry.debt, timeline: entry.timeline, personName: entry.personName, exec: entry.timeline.exec })));
    });
    cxCopy(reports.join('\n\n\n'));
    cxNotify(`Memória técnica copiada — ${selected.length} CDA(s).`);
  };
  const copyProcMemoria = (umbrella, cdas) => {
    const entries = cdas.map(d => ({ debt: d, timeline: computeCdaLegalTimeline({ debt: d, executions: data.executions, events: data.prescriptionEvents || [] }), personName: (data.people || []).find(pp => pp.id === d.personId)?.name || d.devedor || '' }));
    cxCopy(buildProcessPrescricaoReport({ exec: umbrella, entries }));
    cxNotify(`Memória técnica copiada — ${entries.length} CDA(s).`);
  };

  const IncTableHead = () => <>
    <colgroup><col className="cx-pt-c-ck" /><col className="cx-pt-c-cda" /><col /><col className="cx-pt-c-st" /><col className="cx-pt-c-val" /><col className="cx-pt-c-presc" /></colgroup>
    <thead><tr><th className="cx-pt-ck"></th><th>CDA</th><th>Devedor · responsáveis</th><th>Situação</th><th className="cx-pt-r">Valor</th><th>Prescrição</th></tr></thead>
  </>;

  const SubGroupBlock = ({ g, sg, isLast = true }) => {
    const isSameAsUmbrella = sg.subExec.id === g.umbrella.id;
    const subTotal = sg.cdas.reduce((s, d) => s + (d.value || 0), 0);
    const kind = cxProcKind(sg.subExec);
    return <React.Fragment key={sg.subExec.id}>
      {!isSameAsUmbrella && <tr className={'cx-pt-band' + cxTreeRowClass(1)}>
        <td className="cx-pt-ck"></td>
        <td colSpan={3} className="cx-pt-num nest1"><CxTreeMark level={1} isLast={isLast} /><span className={'cx-pd-kind ' + kind.cls}>{kind.label}</span> <CxNumCopy value={sg.subExec.processNumber}><span className="cx-mono">{sg.subExec.processNumber || 'S/N'}</span></CxNumCopy><span className="cx-muted cx-small"> · {cxPl(sg.cdas.length, 'CDA', 'CDAs')}</span></td>
        <td className="cx-pt-r cx-mono">{fmtCur(subTotal)}</td>
        <CxPrescCell cdas={sg.cdas} prazosByDebt={prazosByDebt} />
      </tr>}
      {sg.cdas.map((d, i) => <CxIncRow key={d.id} d={d} data={data} prazosByDebt={prazosByDebt} isSel={selectedDebts.has(d.id)} onToggleSel={() => toggleSel(d.id)} isOpen={!!(drawerCda && drawerCda.id === d.id)} onOpen={id => openDrawer(id, sg.subExec.id)} depth={isSameAsUmbrella ? 0 : 2} isLast={i === sg.cdas.length - 1} parentHasMore={!isLast} />)}
    </React.Fragment>;
  };

  const GroupHeaderRow = ({ g }) => {
    const key = 'pp-u-' + g.umbrella.id;
    const isCollapsed = collapsedGroups.has(key);
    const total = g.allCdas.reduce((s, d) => s + (d.value || 0), 0);
    const isSel = g.allCdas.length > 0 && g.allCdas.every(d => selectedDebts.has(d.id));
    const kind = cxProcKind(g.umbrella);
    const single = g.subGroupArr.length === 1 ? g.subGroupArr[0] : null;
    const combinedEf = single && single.subExec.id !== g.umbrella.id ? single : null;
    return <React.Fragment key={g.umbrella.id}>
      <tr className="cx-pt-band cx-pt-clickable" onClick={() => toggleGroup(key)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleGroupSel(g.allCdas.map(d => d.id))} aria-label={'Selecionar grupo ' + (g.umbrella.processNumber || '')} /></td>
        <td colSpan={3}>
          <span className="cx-chev sm">{isCollapsed ? '▸' : '▾'}</span>
          <span className={'cx-pd-kind ' + kind.cls}>{kind.label}</span> <CxNumCopy value={g.umbrella.processNumber}><span className="cx-mono">{g.umbrella.processNumber || 'S/N'}</span></CxNumCopy>
          {combinedEf ? <> › <span className={'cx-pd-kind ' + cxProcKind(combinedEf.subExec).cls}>{cxProcKind(combinedEf.subExec).label}</span> <CxNumCopy value={combinedEf.subExec.processNumber}><span className="cx-mono">{combinedEf.subExec.processNumber || 'S/N'}</span></CxNumCopy></> : null}
          <span className="cx-muted cx-small"> · {cxPl(g.allCdas.length, 'CDA', 'CDAs')}</span>
          <span className="cx-pp-grpacts">
            <button type="button" className="cx-btn sm ghost" onClick={ev => { ev.stopPropagation(); copyProcMemoria(g.umbrella, g.allCdas); }}>📋 Presc.</button>
            <button type="button" className="cx-btn sm ghost" onClick={ev => { ev.stopPropagation(); setModal({ type: 'edit', entityType: 'execution', initial: g.umbrella }); }}>✎ Proc</button>
          </span>
        </td>
        <td className="cx-pt-r cx-mono">{fmtCur(total)}</td>
        <CxPrescCell cdas={g.allCdas} prazosByDebt={prazosByDebt} />
      </tr>
      {!isCollapsed && (combinedEf
        ? combinedEf.cdas.map((d, i) => <CxIncRow key={d.id} d={d} data={data} prazosByDebt={prazosByDebt} isSel={selectedDebts.has(d.id)} onToggleSel={() => toggleSel(d.id)} isOpen={!!(drawerCda && drawerCda.id === d.id)} onOpen={id => openDrawer(id, combinedEf.subExec.id)} depth={1} isLast={i === combinedEf.cdas.length - 1} />)
        : g.subGroupArr.map((sg, i) => <SubGroupBlock key={sg.subExec.id} g={g} sg={sg} isLast={i === g.subGroupArr.length - 1} />))}
    </React.Fragment>;
  };

  const NaGroupRow = () => {
    const key = 'pp-na';
    const isCollapsed = collapsedGroups.has(key);
    const total = unajuizadas.reduce((s, d) => s + (d.value || 0), 0);
    const isSel = unajuizadas.length > 0 && unajuizadas.every(d => selectedDebts.has(d.id));
    return <React.Fragment>
      <tr className="cx-pt-band cx-pt-clickable" onClick={() => toggleGroup(key)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleGroupSel(unajuizadas.map(d => d.id))} aria-label="Selecionar não ajuizadas" /></td>
        <td colSpan={3}><span className="cx-chev sm">{isCollapsed ? '▸' : '▾'}</span>Não ajuizadas<span className="cx-muted cx-small"> · {cxPl(unajuizadas.length, 'CDA', 'CDAs')}</span></td>
        <td className="cx-pt-r cx-mono">{fmtCur(total)}</td>
        <CxPrescCell cdas={unajuizadas} prazosByDebt={prazosByDebt} />
      </tr>
      {!isCollapsed && unajuizadas.map(d => <CxIncRow key={d.id} d={d} data={data} prazosByDebt={prazosByDebt} isSel={selectedDebts.has(d.id)} onToggleSel={() => toggleSel(d.id)} isOpen={!!(drawerCda && drawerCda.id === d.id)} onOpen={id => openDrawer(id, null)} depth={0} />)}
    </React.Fragment>;
  };

  const GenericGroupBlock = ({ g }) => {
    const key = 'cda-' + g.label;
    const isCollapsed = collapsedGroups.has(key);
    const total = g.items.reduce((s, d) => s + (d.value || 0), 0);
    const isSel = g.items.every(d => selectedDebts.has(d.id));
    const shown = showMore[key] || 8;
    const visible = g.items.slice(0, shown);
    const rest = g.items.length - visible.length;
    return <React.Fragment>
      <tr className="cx-pt-band cx-pt-clickable" onClick={() => toggleGroup(key)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleGroupSel(g.items.map(d => d.id))} aria-label={'Selecionar grupo ' + g.label} /></td>
        <td colSpan={3}><span className="cx-chev sm">{isCollapsed ? '▸' : '▾'}</span>{g.label}<span className="cx-muted cx-small"> · {cxPl(g.items.length, 'CDA', 'CDAs')}</span></td>
        <td className="cx-pt-r cx-mono">{fmtCur(total)}</td>
        <CxPrescCell cdas={g.items} prazosByDebt={prazosByDebt} />
      </tr>
      {!isCollapsed && visible.map(d => <CxIncRow key={d.id} d={d} data={data} prazosByDebt={prazosByDebt} isSel={selectedDebts.has(d.id)} onToggleSel={() => toggleSel(d.id)} isOpen={!!(drawerCda && drawerCda.id === d.id)} onOpen={id => openDrawer(id, null)} depth={0} />)}
      {!isCollapsed && rest > 0 && <tr className="cx-pt-more"><td colSpan={6}><button type="button" className="cx-link-btn" onClick={() => setShowMore(s => ({ ...s, [key]: shown + 20 }))}>Mostrar mais {rest}</button></td></tr>}
    </React.Fragment>;
  };

  return <div className="cx cx-page cx-page-wide cx-pp">
    <CxKpiStrip n={5}>
      <CxKpiCard label="Total ativo" value={fmtCur(totalAtivo.reduce((s, d) => s + (d.value || 0), 0))} desc={cxPl(totalAtivo.length, 'CDA', 'CDAs')} foot={'de ' + cxPl(allDebts.length, 'CDA', 'CDAs') + ' na operação'} />
      <CxKpiCard label="Ajuizadas" value={ajuizadas.length} desc={fmtCur(ajuizadas.reduce((s, d) => s + (d.value || 0), 0))} foot={'de ' + cxPl(allDebts.length, 'CDA', 'CDAs')} />
      <CxKpiCard label="Não ajuizadas" value={naoAjuizadas.length} desc={fmtCur(naoAjuizadas.reduce((s, d) => s + (d.value || 0), 0))} foot={'de ' + cxPl(allDebts.length, 'CDA', 'CDAs')} />
      <CxKpiCard label="A agir" tip="CDAs nos cartões «a agir» da Mesa de prazos" value={noAlarme.length} tone={noAlarme.length ? 'red' : ''} desc={fmtCur(noAlarme.reduce((s, d) => s + (d.value || 0), 0))} descTone={noAlarme.length ? 'red' : ''} foot={'de ' + cxPl(allDebts.length, 'CDA', 'CDAs')} />
      <CxKpiCard label="Tratadas" value={tratadas.length} desc={'aguardando reconhecimento: ' + aguardando.length} foot={'de ' + cxPl(allDebts.length, 'CDA', 'CDAs')} />
    </CxKpiStrip>

    <div className="cx-pp-toolbar">
      <CxSeg className="sm" label="Visão das inscrições" value={view} onChange={setView} options={[['tabela', 'Tabela'], ['relogios', 'Relógios']]} />
      <input className="cx-tab-q" value={procCdaQuery} onChange={e => setProcCdaQuery(e.target.value)} placeholder="Filtrar CDA ou processo" />
      <div className="cx-pp-person">
        <button type="button" className={'cx-btn sm' + (cdaPersonFilter !== 'all' ? ' primary' : '')} onClick={() => setPeopleOpen(v => !v)}>Pessoa: {cdaPersonFilter === 'all' ? 'todas' : ((data.people || []).find(x => x.id === cdaPersonFilter) || {}).name || '—'}</button>
        {peopleOpen && <div className="cx-menu-pop cx-pp-people-pop">
          <button type="button" onClick={() => { setCdaPersonFilter('all'); setPeopleOpen(false); }}>Todas · {allDebts.length}</button>
          {personCounts.map(({ person, count }) => <button key={person.id} type="button" onClick={() => { setCdaPersonFilter(person.id); setPeopleOpen(false); }}>{person.name} · {count}</button>)}
        </div>}
      </div>
      {view === 'tabela' ? <>
      <CxSelect pre="Agrupar" label="Agrupar inscrições" value={GROUP_MODES.includes(cdaSort) ? cdaSort : ''} onChange={v => { if (v) setCdaSort(v); }}
        options={[['', '—', 'dis'], ['por_processo', 'Processo'], ['status', 'Situação'], ['devedor', 'Devedor'], ['tribute', 'Tributo'], ['ajuizada', 'Ajuizada / não']]} />
      <CxSelect pre="Ordenar" label="Ordenar inscrições" value={SORT_MODES.includes(cdaSort) ? cdaSort : ''} onChange={v => { if (v) setCdaSort(v); }}
        options={[['', '—', 'dis'], ['value_desc', 'Valor ↓'], ['value_asc', 'Valor ↑'], ['prescription', 'Prescrição']]} />
      </> : null}
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'debt', initial: {} })}>+ Inscrição</button>
    </div>

    <div className="cx-pp-body">
      <div className="cx-pp-cards">
        {view === 'relogios' ? <EditionClaudeClocks embedded data={data} prazosRadar={p.prazosRadar} prescLookup={p.prescLookup} opId={opId} debtIds={clkIds} filtered={clkFiltered} onOpenCda={openCdaFromClock} /> : <div className="cx-card cx-pt-wrap"><table className="cx-pt cx-pt-fx"><IncTableHead />
          <tbody>
            {cdaSort === 'por_processo' ? <>
              {groups.map(g => <GroupHeaderRow key={g.umbrella.id} g={g} />)}
              {unajuizadas.length > 0 && <NaGroupRow />}
              {groups.length === 0 && unajuizadas.length === 0 && <tr><td colSpan={6} className="cx-empty-row">Nenhuma CDA.</td></tr>}
            </> : genericGroups ? <>
              {genericGroups.map(g => <GenericGroupBlock key={g.label} g={g} />)}
              {genericGroups.length === 0 && <tr><td colSpan={6} className="cx-empty-row">Nenhuma CDA.</td></tr>}
            </> : (() => {
              const key = 'cda-flat';
              const shown = showMore[key] || 8;
              const visible = sorted.slice(0, shown);
              const rest = sorted.length - visible.length;
              return <>
                {visible.map(d => <CxIncRow key={d.id} d={d} data={data} prazosByDebt={prazosByDebt} isSel={selectedDebts.has(d.id)} onToggleSel={() => toggleSel(d.id)} isOpen={!!(drawerCda && drawerCda.id === d.id)} onOpen={id => openDrawer(id, null)} depth={0} />)}
                {rest > 0 && <tr className="cx-pt-more"><td colSpan={6}><button type="button" className="cx-link-btn" onClick={() => setShowMore(s => ({ ...s, [key]: shown + 20 }))}>Mostrar mais {rest}</button></td></tr>}
                {sorted.length === 0 && <tr><td colSpan={6} className="cx-empty-row">Nenhuma CDA.</td></tr>}
              </>;
            })()}
          </tbody>
        </table></div>}
      </div>
      {drawerCda && (() => {
        const d = allDebts.find(x => x.id === drawerCda.id);
        if (!d) return null;
        const exec = drawerCda.execId ? opExecs.find(x => x.id === drawerCda.execId) : (data.executions || []).find(x => x.processNumber && sameProc(x.processNumber, d.processNumber));
        return <EditionClaudeCdaDrawer debt={d} exec={exec} data={data} opId={opId} prazosByDebt={prazosByDebt}
          selectedCDAs={selectedDebts} setSelectedCDAs={setSelectedDebts} setModal={setModal} setData={setData}
          togglePrescCheck={togglePrescCheck} onClose={closeDrawer}
          onOpenExec={execId => setModal({ type: 'edit', entityType: 'execution', initial: opExecs.find(x => x.id === execId) })}
          linkify={linkify} />;
      })()}
    </div>

    {selectedDebts.size > 0 && (
      <div className="cx-pp-bulk">
        <b>{cxPl(selectedDebts.size, 'CDA selecionada', 'CDAs selecionadas')}</b>
        <span className="cx-muted cx-small">· {fmtCur(totalSelValue)}</span>
        <span className="cx-sp" />
        <button type="button" className="cx-btn sm primary" onClick={bulkMemoria}>📋 Memória presc.</button>
        <button type="button" className="cx-btn sm" onClick={() => bulkDelete('debts', selectedDebts)}>Excluir</button>
        <button type="button" className="cx-btn sm ghost" onClick={() => setSelectedDebts(new Set())}>Limpar</button>
      </div>
    )}
  </div>;
}

/* ─── Partes: mesmo cálculo de exposição por pessoa da aba clássica (CDAs como
   originária vs corresponsável por papel, valor exposto, bens pelo CPF/CNPJ do
   titular, CDAs a agir) — o contador de prescrição usa os cartões da Mesa (mesaCards),
   o mesmo número do menu. ─── */
function cxPersonStats(data, opId, mesaCards) {
  const items = (data.people || []).filter(p => p.operationId === opId);
  const opDebts = (data.debts || []).filter(d => d.operationId === opId);
  const opAssets = (data.assets || []).filter(a => a.operationId === opId);
  const allLinks = (data.links && data.links.cdaResponsibilities) || [];
  return items.map(p => {
    const myLinks = allLinks.filter(l => l.personId === p.id && opDebts.some(d => d.id === l.cdaId));
    const linksByCda = {};
    myLinks.forEach(l => { const existing = linksByCda[l.cdaId]; if (!existing || (l.role === 'originario' && existing.role !== 'originario')) linksByCda[l.cdaId] = l; });
    const dedupedLinks = Object.values(linksByCda);
    const cdasOriginario = dedupedLinks.filter(l => l.role === 'originario').map(l => opDebts.find(d => d.id === l.cdaId)).filter(Boolean);
    const cdasCorresp = dedupedLinks.filter(l => l.role !== 'originario');
    const cdasCorrespByRole = {};
    cdasCorresp.forEach(l => { if (!cdasCorrespByRole[l.role]) cdasCorrespByRole[l.role] = []; const d = opDebts.find(dd => dd.id === l.cdaId); if (d) cdasCorrespByRole[l.role].push({ debt: d, link: l }); });
    const valOriginario = cdasOriginario.reduce((s, d) => s + (d.value || 0), 0);
    const valCorresp = cdasCorresp.reduce((s, l) => { const d = opDebts.find(dd => dd.id === l.cdaId); return s + (d ? (d.value || 0) : 0); }, 0);
    const myAssets = opAssets.filter(a => a.titularCpfCnpj === p.cpfCnpj);
    const valAssets = myAssets.reduce((s, a) => s + (a.value || 0), 0);
    const prescRisk = cdasOriginario.filter(d => mesaIsAction(mesaCards.byDebt.get(d.id))).length;
    return { person: p, cdasOriginario, cdasCorresp, cdasCorrespByRole, valOriginario, valCorresp, valTotal: valOriginario + valCorresp, myAssets, valAssets, prescRisk, totalCdas: cdasOriginario.length + cdasCorresp.length };
  });
}

/* Ficha lateral da pessoa (Partes) — mesmo padrão das demais (blocos recolhíveis); CDAs
   originária/corresponsável clicáveis abrem a ficha da CDA (onOpenCda, gerido pelo pai). */
function EditionClaudePersonDrawer({ s, data, onClose, setModal, onOpenCda }) {
  const [blocks, setBlocks] = React.useState({ resp: true, bens: false, notas: false });
  const toggle = (k) => setBlocks(prev => ({ ...prev, [k]: !prev[k] }));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const p2 = s.person;
  const notes = (p2.notesList || (p2.notes ? [p2.notes] : [])).filter(Boolean);
  const copyQualif = () => { cxCopy(buildPersonQualification(p2, data)); cxNotify('Qualificação copiada.'); };
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd" role="dialog" aria-modal="true" aria-label="Pessoa">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className={'cx-pd-kind ' + (p2.subtype === 'PJ' ? 'pj' : 'pf')}>{p2.subtype || 'PF'}</span><b className="cx-pd-num" style={{ fontFamily: 'var(--cx-font)' }}>{p2.name}</b></div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        <dl className="cx-pd-facts">
          <dt>CPF/CNPJ</dt><dd className="cx-mono">{p2.cpfCnpj || '—'}</dd>
          <dt>Papel</dt><dd>{p2.role || '—'}</dd>
          <dt>Posição</dt><dd>{(PERSON_OPERATION_ROLES[p2.operationRole || 'alvo'] || {}).label || '—'}</dd>
        </dl>
        <CxBlock title="Responde por" open={!!blocks.resp} onToggle={() => toggle('resp')}>
          <div className="cx-pd-sum-row"><span>Originária</span><b>{s.cdasOriginario.length ? cxPl(s.cdasOriginario.length, 'CDA', 'CDAs') + ' · ' + fmtCur(s.valOriginario) : '—'}</b></div>
          <div className="cx-pd-sum-row"><span>Corresponsável</span><b>{s.cdasCorresp.length ? cxPl(s.cdasCorresp.length, 'CDA', 'CDAs') + ' · ' + fmtCur(s.valCorresp) : '—'}</b></div>
          {s.cdasOriginario.length > 0 && <div style={{ marginTop: 6 }}>
            {s.cdasOriginario.map(d => <button key={d.id} type="button" className="cx-pd-rel" onClick={() => onOpenCda(d.id)}><span className="cx-mono">{d.cdaNumber || 'CDA'}</span><span className="cx-sp" /><span className="cx-mono cx-small">{fmtCur(d.value)}</span></button>)}
          </div>}
          {Object.entries(s.cdasCorrespByRole).map(([role, arr]) => <div key={role} className="cx-small" style={{ marginTop: 8 }}>
            <div className="cx-muted">{(RESPONSIBILITY_ROLES[role] || {}).label || role}</div>
            {arr.map(x => <button key={x.debt.id} type="button" className="cx-pd-rel" onClick={() => onOpenCda(x.debt.id)}><span className="cx-mono">{x.debt.cdaNumber || 'CDA'}</span><span className="cx-sp" /><span className="cx-mono cx-small">{fmtCur(x.debt.value)}</span></button>)}
          </div>)}
        </CxBlock>
        <CxBlock title="Patrimônio identificado" count={s.myAssets.length} open={!!blocks.bens} onToggle={() => toggle('bens')}>
          {s.myAssets.length === 0 ? <div className="cx-empty-row">Nenhum bem identificado.</div> : <>
            {s.myAssets.slice(0, 5).map(a => <div key={a.id} className="cx-pd-sum-row"><span className="cx-ell">{a.description || ASSET_SUBTYPES[a.subtype] || 'Bem'}</span><b className="cx-mono">{fmtCur(a.value)}</b></div>)}
            {s.myAssets.length > 5 && <div className="cx-muted cx-small">+{s.myAssets.length - 5}</div>}
          </>}
        </CxBlock>
        <CxBlock title="Notas" count={notes.length} open={!!blocks.notas} onToggle={() => toggle('notas')}>
          {notes.length === 0 ? <div className="cx-empty-row">Sem notas.</div> : notes.map((n, i) => <div key={i} className="cx-pd-note">{n}</div>)}
        </CxBlock>
      </div>
      <div className="cx-dr-foot">
        <button type="button" className="cx-btn sm primary" onClick={copyQualif}>Copiar qualificação</button>
        <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'person', initial: p2 })}>✎ Editar</button>
      </div>
    </aside>
  </>;
}

function EditionClaudePartes(p) {
  const { opId, data, prazosByDebt, setModal, upsert, onOpenAsset } = p;
  const [q, setQ] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all'); // all | PF | PJ
  const [drawerPersonId, setDrawerPersonId] = React.useState(null);
  const [drawerCda, setDrawerCda] = React.useState(null);

  const opDebts = (data.debts || []).filter(d => d.operationId === opId);
  const stats = React.useMemo(() => cxPersonStats(data, opId, p.mesaCards), [data, opId, p.mesaCards]);
  let filtered = stats;
  if (typeFilter !== 'all') filtered = filtered.filter(s => (s.person.subtype || 'PF') === typeFilter);
  if (q.trim()) {
    const qn = q.trim().toLowerCase();
    const qDigits = qn.replace(/\D/g, '');
    filtered = filtered.filter(s => s.person.name.toLowerCase().includes(qn) || (qDigits && String(s.person.cpfCnpj || '').replace(/\D/g, '').includes(qDigits)));
  }
  const alvos = filtered.filter(s => (s.person.operationRole || 'alvo') === 'alvo');
  const relacionadas = filtered.filter(s => s.person.operationRole === 'relacionada');

  const cdasInOp = new Set(opDebts.filter(d => d.status !== 'extinta').map(d => d.id));
  const grandTotalUnique = opDebts.filter(d => cdasInOp.has(d.id)).reduce((s, d) => s + (d.value || 0), 0);
  const sumOfExposures = stats.reduce((s, x) => s + x.valTotal, 0);
  const allAssetsIdentified = stats.reduce((s, x) => s + x.myAssets.length, 0);
  const allAssetsValue = stats.reduce((s, x) => s + x.valAssets, 0);

  const closeAll = () => { setDrawerPersonId(null); setDrawerCda(null); };
  const openCda = (id) => { setDrawerCda({ id }); setDrawerPersonId(null); };

  const PersonRow = ({ s }) => {
    const p2 = s.person;
    const isOpen = drawerPersonId === p2.id;
    return <tr className={'cx-pt-row' + (isOpen ? ' on' : '')} onClick={() => { setDrawerPersonId(p2.id); setDrawerCda(null); }}>
      <td className="cx-pt-num">
        <span className={'cx-pd-kind ' + (p2.subtype === 'PJ' ? 'pj' : 'pf')}>{p2.subtype || 'PF'}</span> {p2.name} <span className="cx-mono cx-small cx-muted">{p2.cpfCnpj}</span>
      </td>
      <td className="cx-small">{p2.role || '—'}</td>
      <td className="cx-pt-r">{s.cdasOriginario.length > 0 ? <span className="cx-tag blue">{s.cdasOriginario.length} orig.</span> : <span className="cx-muted">—</span>}{s.cdasCorresp.length > 0 ? <span className="cx-tag" style={{ marginLeft: 4 }}>{s.cdasCorresp.length} corr.</span> : null}</td>
      <td className="cx-pt-r cx-mono">{s.valTotal > 0 ? fmtCur(s.valTotal) : <span className="cx-muted">—</span>}</td>
      <td className="cx-pt-r cx-small">{s.myAssets.length > 0 ? <>{s.myAssets.length} · <span className="cx-mono">{fmtCur(s.valAssets)}</span></> : <span className="cx-muted">—</span>}</td>
      <td className="cx-small">{s.prescRisk > 0 ? <span className="cx-risk-critical">{cxPl(s.prescRisk, 'CDA a agir', 'CDAs a agir')}</span> : <span className="cx-muted">nenhuma a agir</span>}</td>
    </tr>;
  };

  const PersonTableHead = () => <>
    <colgroup><col /><col className="cx-pt-c-role" /><col className="cx-pt-c-n" /><col className="cx-pt-c-val" /><col className="cx-pt-c-n" /><col className="cx-pt-c-presc" /></colgroup>
    <thead><tr><th>Pessoa</th><th>Papel</th><th className="cx-pt-r">CDAs</th><th className="cx-pt-r">Responde por</th><th className="cx-pt-r">Bens</th><th>Prescrição</th></tr></thead>
  </>;

  return <div className="cx cx-page cx-page-wide cx-pp">
    <CxKpiStrip n={4}>
      <CxKpiCard label="Crédito da operação" value={fmtCur(grandTotalUnique)} desc={cxPl(cdasInOp.size, 'CDA ativa', 'CDAs ativas') + ' · total único'} foot={'de ' + cxPl(opDebts.length, 'CDA', 'CDAs') + ' na operação'} />
      <CxKpiCard label="Alvos" value={alvos.length} desc={cxPl(stats.filter(s => (s.person.subtype || 'PF') === 'PJ').length, 'PJ', 'PJ') + ' · ' + cxPl(stats.filter(s => (s.person.subtype || 'PF') === 'PF').length, 'PF', 'PF')} foot={'de ' + cxPl(stats.length, 'pessoa', 'pessoas') + ' na operação'} />
      <CxKpiCard label="Relacionadas" value={relacionadas.length} desc="subsídio analítico" foot={'de ' + cxPl(stats.length, 'pessoa', 'pessoas') + ' na operação'} />
      <CxKpiCard label="Patrimônio identificado" value={fmtCur(allAssetsValue)} desc={cxPl(allAssetsIdentified, 'bem', 'bens')} foot={'de ' + cxPl((data.assets || []).filter(a => a.operationId === opId).length, 'bem', 'bens') + ' na operação'} />
    </CxKpiStrip>

    <div className="cx-pp-toolbar">
      <input className="cx-tab-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nome ou CPF/CNPJ" />
      <CxSelect pre="Tipo" label="Filtrar por tipo de parte" value={typeFilter} onChange={setTypeFilter} options={[['all', 'Todos'], ['PJ', 'PJ'], ['PF', 'PF']]} />
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'person', initial: {} })}>+ Pessoa</button>
    </div>
    {sumOfExposures > grandTotalUnique * 1.01 && <div className="cx-pp-dup" style={{ background: 'var(--cx-yellow-soft)', color: 'var(--cx-yellow)' }}>ⓘ As exposições individuais somam {fmtCur(sumOfExposures)} — a diferença vem de responsabilidade compartilhada entre pessoas (mesma CDA contada para cada responsável). Para o crédito da operação, vale o total único acima.</div>}

    <div className="cx-pp-body">
      <div className="cx-pp-cards">
        <div className="cx-card cx-pt-wrap"><table className="cx-pt cx-pt-fx"><PersonTableHead />
          <tbody>
            {alvos.length > 0 && <tr className="cx-pt-band"><td colSpan={6}>Alvos diretos <span className="cx-muted cx-small">· {alvos.length}</span></td></tr>}
            {alvos.map(s => <PersonRow key={s.person.id} s={s} />)}
            {relacionadas.length > 0 && <tr className="cx-pt-band"><td colSpan={6}>Pessoas relacionadas <span className="cx-muted cx-small">· {relacionadas.length}</span></td></tr>}
            {relacionadas.map(s => <PersonRow key={s.person.id} s={s} />)}
            {filtered.length === 0 && <tr><td colSpan={6} className="cx-empty-row">Nenhuma pessoa.</td></tr>}
          </tbody>
        </table></div>
      </div>
      {drawerCda ? (() => {
        const d = opDebts.find(x => x.id === drawerCda.id);
        if (!d) return null;
        const exec = (data.executions || []).find(x => x.processNumber && sameProc(x.processNumber, d.processNumber));
        return <EditionClaudeCdaDrawer debt={d} exec={exec} data={data} opId={opId} prazosByDebt={prazosByDebt}
          selectedCDAs={new Set()} setSelectedCDAs={() => { }} setModal={setModal} setData={p.setData}
          togglePrescCheck={p.togglePrescCheck} onClose={closeAll}
          onOpenExec={execId => setModal({ type: 'edit', entityType: 'execution', initial: (data.executions || []).find(x => x.id === execId) })}
          linkify={p.linkify} />;
      })() : drawerPersonId && (() => {
        const s = stats.find(x => x.person.id === drawerPersonId);
        if (!s) return null;
        return <EditionClaudePersonDrawer s={s} data={data} onClose={closeAll} setModal={setModal} onOpenCda={openCda} />;
      })()}
    </div>
  </div>;
}

/* ─── Bens: mesma lógica clássica (agrupamento por situação/titular/processo/tipo,
   Sisbajud com valor em destaque, Analytics, lote). ─── */
function cxAssetGroupKey(a, data, mode) {
  if (mode === 'titular') { const h = (data.people || []).find(pp => pp.id === a.holderId); return h ? h.id : '_sem'; }
  if (mode === 'processo') return a.processRef || '_sem';
  if (mode === 'tipo') return a.subtype || 'outro';
  return a.status || 'liberado';
}
function cxAssetGroupLabel(key, mode, data) {
  if (mode === 'titular') { if (key === '_sem') return 'Sem titular'; const h = (data.people || []).find(pp => pp.id === key); return h ? h.name : 'Sem titular'; }
  if (mode === 'processo') return key === '_sem' ? 'Sem processo vinculado' : key;
  if (mode === 'tipo') return ASSET_SUBTYPES[key] || key;
  return (ASSET_STATUSES[key] || {}).label || key;
}

/* Ficha lateral do bem — descrição, identificação, titular (atalho para a pessoa), processo
   (atalho para a execução), origem e notas; mesmo padrão das demais fichas. */
function EditionClaudeAssetDrawer({ asset: a, data, opId, onClose, setModal }) {
  const [blocks, setBlocks] = React.useState({ desc: true, notas: false });
  const toggle = (k) => setBlocks(prev => ({ ...prev, [k]: !prev[k] }));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!a) return null;
  const holder = (data.people || []).find(pp => pp.id === a.holderId);
  const isSis = isSisbajudAsset(a);
  const idLine = !isSis ? assetIdentifier(a, data.people) : '';
  const st = ASSET_STATUSES[a.status] || {};
  const linkedExec = a.processRef ? (data.executions || []).find(e => e.operationId === opId && sameProc(e.processNumber, a.processRef)) : null;
  const notes = (a.notesList || (a.notes ? [a.notes] : [])).filter(Boolean);
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd" role="dialog" aria-modal="true" aria-label="Bem">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className="cx-pd-kind">{isSis ? 'SISBAJUD' : (ASSET_SUBTYPES[a.subtype] || 'BEM')}</span><b className="cx-pd-num" style={{ fontFamily: 'var(--cx-font)' }}>{isSis ? (a.value ? fmtCur(a.value) : 'sem valor') : (idLine || (a.description || 'Bem').slice(0, 44))}</b></div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        <dl className="cx-pd-facts">
          <dt>Valor</dt><dd className="cx-mono">{a.value != null ? fmtCur(a.value) : '—'}</dd>
          <dt>Situação</dt><dd><span className={'badge ' + (st.badge || 'badge-muted')}>{st.label || a.status || '—'}</span>{assetConstrictionLine(a) ? <span className="cx-muted cx-small" style={{ marginLeft: 8 }}>{assetConstrictionLine(a)}</span> : null}</dd>
          <dt>Titular</dt><dd>{holder ? <button type="button" className="cx-link-btn" onClick={() => setModal({ type: 'edit', entityType: 'person', initial: holder })}>{holder.name}{holder.cpfCnpj ? ' · ' + holder.cpfCnpj : ''}<CxIcon n="chevR" s={12} /></button> : (a.holderDoc || '—')}</dd>
          <dt>Processo</dt><dd>{a.processRef ? (linkedExec ? <button type="button" className="cx-link-btn" onClick={() => setModal({ type: 'edit', entityType: 'execution', initial: linkedExec })}>{a.processRef}<CxIcon n="chevR" s={12} /></button> : <span className="cx-mono cx-small">{a.processRef}</span>) : <span className="cx-muted">Sem processo vinculado</span>}</dd>
          <dt>Origem</dt><dd>{a.source || '—'}</dd>
          <dt>Analytics</dt><dd>{a.analyticsRegistered ? <span className="cx-tag green">Registrado</span> : <span className="cx-tag orange">Pendente</span>}</dd>
        </dl>
        <CxBlock title="Descrição" open={!!blocks.desc} onToggle={() => toggle('desc')}>
          {a.description ? <p className="cx-bf-work-txt">{a.description}</p> : <div className="cx-empty-row">Sem descrição.</div>}
        </CxBlock>
        <CxBlock title="Notas" count={notes.length} open={!!blocks.notas} onToggle={() => toggle('notas')}>
          {notes.length === 0 ? <div className="cx-empty-row">Sem notas.</div> : notes.map((n, i) => <div key={i} className="cx-pd-note">{n}</div>)}
        </CxBlock>
      </div>
      <div className="cx-dr-foot">
        <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'asset', initial: a })}>✎ Editar</button>
      </div>
    </aside>
  </>;
}

function EditionClaudeBens(p) {
  const { opId, data, allAssets, selectedAssets, setSelectedAssets, assetSort, setAssetSort,
    setModal, bulkDelete, bulkUpdateAssets, collapsedGroups, toggleGroup } = p;

  const [q, setQ] = React.useState('');
  const [numFilter, setNumFilter] = React.useState('all');
  const [drawerAssetId, setDrawerAssetId] = React.useState(null);
  const [showMore, setShowMore] = React.useState({});

  let items = allAssets;
  if (numFilter === 'ativa') items = items.filter(a => a.status === 'indisponibilidade_ativa');
  else if (numFilter === 'requerida') items = items.filter(a => a.status === 'indisponibilidade_requerida');
  else if (numFilter === 'semAnalytics') items = items.filter(a => !a.analyticsRegistered);
  if (q.trim()) {
    const qn = q.trim().toLowerCase();
    items = items.filter(a => [a.description, a.registry, a.processRef, a.source, assetIdentifier(a, data.people)].filter(Boolean).some(v => String(v).toLowerCase().includes(qn)));
  }

  const GROUP_MODES = ['status', 'titular', 'processo', 'tipo'];
  const SORT_MODES = ['valor_desc', 'valor_asc'];
  const mode = GROUP_MODES.includes(assetSort) ? assetSort : 'status';

  let groupEntries;
  if (SORT_MODES.includes(assetSort)) {
    const sorted = [...items].sort((a, b) => assetSort === 'valor_desc' ? (b.value || 0) - (a.value || 0) : (a.value || 0) - (b.value || 0));
    groupEntries = [{ key: 'all', label: 'Todos os bens', items: sorted }];
  } else {
    const map = {};
    items.forEach(a => { const k = cxAssetGroupKey(a, data, mode); if (!map[k]) map[k] = []; map[k].push(a); });
    groupEntries = Object.entries(map).map(([key, list]) => ({ key, label: cxAssetGroupLabel(key, mode, data), items: list }));
    if (mode === 'status') {
      const order = ['indisponibilidade_ativa', 'indisponibilidade_requerida', 'controvertido', 'liberado'];
      groupEntries.sort((a, b) => { const ia = order.indexOf(a.key), ib = order.indexOf(b.key); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    } else {
      groupEntries.sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }
  }

  const totalVal = allAssets.reduce((s, a) => s + (a.value || 0), 0);
  const ativaList = allAssets.filter(a => a.status === 'indisponibilidade_ativa');
  const reqList = allAssets.filter(a => a.status === 'indisponibilidade_requerida');
  const semAnalytics = allAssets.filter(a => !a.analyticsRegistered);

  const toggleSel = (id) => setSelectedAssets(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleGroupSel = (ids) => setSelectedAssets(prev => { const n = new Set(prev); const all = ids.every(id => n.has(id)); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; });

  const AssetRow = ({ a }) => {
    const holder = (data.people || []).find(pp => pp.id === a.holderId);
    const isSis = isSisbajudAsset(a);
    const idLine = !isSis ? assetIdentifier(a, data.people) : '';
    const st = ASSET_STATUSES[a.status] || {};
    const isSel = selectedAssets.has(a.id);
    const isOpen = drawerAssetId === a.id;
    return <tr className={'cx-pt-row' + (isOpen ? ' on' : '')} onClick={() => setDrawerAssetId(a.id)}>
      <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleSel(a.id)} aria-label="Selecionar bem" /></td>
      <td className="cx-pt-num">
        <span>{isSis ? 'SISBAJUD' : (ASSET_SUBTYPES[a.subtype] || 'Bem')}</span>
        {isSis ? <b className="cx-mono" style={{ marginLeft: 6 }}>{a.value ? fmtCur(a.value) : 'sem valor'}</b>
          : idLine ? <span className="cx-mono cx-small" style={{ marginLeft: 6 }}>{idLine}</span>
            : a.description ? <span className="cx-muted cx-small" style={{ marginLeft: 6 }}>{a.description.slice(0, 40)}</span> : null}
      </td>
      <td>{holder ? <>{holder.name} <span className="cx-mono cx-small cx-muted">{holder.cpfCnpj}</span></> : (a.holderDoc ? <span className="cx-muted cx-small">{a.holderDoc}</span> : <span className="cx-muted">—</span>)}</td>
      <td>{a.processRef ? <><span className="cx-mono cx-small">{a.processRef}</span>{a.source ? <span className="cx-tag" style={{ marginLeft: 6 }}>{a.source}</span> : null}</> : <span className="cx-muted cx-small">sem processo{a.source ? ' · ' + a.source : ''}</span>}</td>
      <td className="cx-pt-r cx-mono">{a.value != null ? fmtCur(a.value) : '—'}</td>
      <td><span className={'badge ' + (st.badge || 'badge-muted')}>{st.label || a.status || '—'}</span>{assetConstrictionLine(a) ? <div className="cx-muted cx-small">{assetConstrictionLine(a)}</div> : null}</td>
      <td><span className={'cx-tag' + (a.analyticsRegistered ? ' green' : ' orange')}>{a.analyticsRegistered ? 'A' : '!A'}</span></td>
    </tr>;
  };

  const GroupBlock = ({ g }) => {
    const key = 'asset-' + g.key;
    const isCollapsed = collapsedGroups.has(key);
    const total = g.items.reduce((s, a) => s + (a.value || 0), 0);
    const isSel = g.items.length > 0 && g.items.every(a => selectedAssets.has(a.id));
    const shown = showMore[key] || 8;
    const visible = g.items.slice(0, shown);
    const rest = g.items.length - visible.length;
    return <React.Fragment>
      <tr className="cx-pt-band cx-pt-clickable" onClick={() => toggleGroup(key)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleGroupSel(g.items.map(a => a.id))} aria-label={'Selecionar grupo ' + g.label} /></td>
        <td colSpan={3}><span className="cx-chev sm">{isCollapsed ? '▸' : '▾'}</span>{g.label}<span className="cx-muted cx-small"> · {cxPl(g.items.length, 'bem', 'bens')}</span></td>
        <td className="cx-pt-r cx-mono">{fmtCur(total)}</td>
        <td colSpan={2}></td>
      </tr>
      {!isCollapsed && visible.map(a => <AssetRow key={a.id} a={a} />)}
      {!isCollapsed && rest > 0 && <tr className="cx-pt-more"><td colSpan={7}><button type="button" className="cx-link-btn" onClick={() => setShowMore(s => ({ ...s, [key]: shown + 20 }))}>Mostrar mais {rest}</button></td></tr>}
    </React.Fragment>;
  };

  return <div className="cx cx-page cx-page-wide cx-pp">
    <CxKpiStrip n={4}>
      <CxKpiCard label="Total" value={fmtCur(totalVal)} desc={cxPl(allAssets.length, 'bem', 'bens')} on={numFilter === 'all'} onClick={() => setNumFilter('all')}
        foot={ativaList.length + (ativaList.length === 1 ? ' ativa' : ' ativas') + ' · ' + cxPl(reqList.length, 'requerida', 'requeridas')} />
      <CxKpiCard label="Indisponibilidade ativa" value={fmtCur(ativaList.reduce((s, a) => s + (a.value || 0), 0))} tone="green" desc={cxPl(ativaList.length, 'bem', 'bens')} on={numFilter === 'ativa'} onClick={() => setNumFilter(numFilter === 'ativa' ? 'all' : 'ativa')}
        foot={'de ' + cxPl(allAssets.length, 'bem', 'bens')} />
      <CxKpiCard label="Requerida" value={fmtCur(reqList.reduce((s, a) => s + (a.value || 0), 0))} desc={cxPl(reqList.length, 'bem', 'bens')} on={numFilter === 'requerida'} onClick={() => setNumFilter(numFilter === 'requerida' ? 'all' : 'requerida')}
        foot={'de ' + cxPl(allAssets.length, 'bem', 'bens')} />
      <CxKpiCard label="Sem Analytics" value={semAnalytics.length} tone={semAnalytics.length ? 'orange' : ''} desc="registrar" on={numFilter === 'semAnalytics'} onClick={() => setNumFilter(numFilter === 'semAnalytics' ? 'all' : 'semAnalytics')}
        foot={'de ' + cxPl(allAssets.length, 'bem', 'bens')} />
    </CxKpiStrip>

    <div className="cx-pp-toolbar">
      <input className="cx-tab-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar descrição, matrícula, placa" />
      <CxSelect pre="Agrupar" label="Agrupar bens" value={mode} onChange={setAssetSort} options={[['status', 'Situação'], ['titular', 'Titular'], ['processo', 'Processo'], ['tipo', 'Tipo']]} />
      <CxSelect pre="Ordenar" label="Ordenar bens" value={SORT_MODES.includes(assetSort) ? assetSort : ''} onChange={v => { if (v) setAssetSort(v); }}
        options={[['', '—', 'dis'], ['valor_desc', 'Valor ↓'], ['valor_asc', 'Valor ↑']]} />
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'asset', initial: {} })}>+ Bem</button>
    </div>

    <div className="cx-pp-body">
      <div className="cx-pp-cards">
        <div className="cx-card cx-pt-wrap"><table className="cx-pt cx-pt-fx">
          <colgroup><col className="cx-pt-c-ck" /><col /><col className="cx-pt-c-tit" /><col className="cx-pt-c-proc" /><col className="cx-pt-c-val" /><col className="cx-pt-c-st" /><col className="cx-pt-c-an" /></colgroup>
          <thead><tr><th className="cx-pt-ck"></th><th>Bem</th><th>Titular</th><th>Processo · origem</th><th className="cx-pt-r">Valor</th><th>Situação</th><th>Analytics</th></tr></thead>
          <tbody>
            {groupEntries.map(g => <GroupBlock key={g.key} g={g} />)}
            {groupEntries.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhum bem.</td></tr>}
          </tbody>
        </table></div>
      </div>
      {drawerAssetId && (() => {
        const a = allAssets.find(x => x.id === drawerAssetId);
        if (!a) return null;
        return <EditionClaudeAssetDrawer asset={a} data={data} opId={opId} setModal={setModal} onClose={() => setDrawerAssetId(null)} />;
      })()}
    </div>

    {selectedAssets.size > 0 && (
      <div className="cx-pp-bulk">
        <b>{cxPl(selectedAssets.size, 'bem selecionado', 'bens selecionados')}</b>
        <span className="cx-sp" />
        <CxSelect label="Alterar situação dos bens selecionados" value="" onChange={v => { if (v) bulkUpdateAssets('status', v); }}
          options={[['', 'Alterar situação…', 'dis']].concat(Object.entries(ASSET_STATUSES).map(([k, v]) => [k, v.label]))} />
        <button type="button" className="cx-btn sm" onClick={() => bulkUpdateAssets('analyticsRegistered', true)}>✓ Marcar Analytics</button>
        <button type="button" className="cx-btn sm" onClick={() => bulkUpdateAssets('analyticsRegistered', false)}>✗ Desmarcar</button>
        <button type="button" className="cx-btn sm" onClick={() => bulkDelete('assets', selectedAssets)}>Excluir</button>
        <button type="button" className="cx-btn sm ghost" onClick={() => setSelectedAssets(new Set())}>Limpar</button>
      </div>
    )}
  </div>;
}

/* ═════════════════════ Tarefas (aba da operação) ═════════════════════
   Reaproveita os mesmos componentes da tela Tarefas do Prumo (CxTaskRow,
   cxGroupTasks, cxTaskSort), só que filtrados nesta operação — mesma nota do
   mockup (design/mockups/prumo-abas-operacao.html): "o componente é o mesmo".
   Acrescenta a linha de números (padrão das demais abas) e a criação rápida. */
function EditionClaudeOpTarefas(p) {
  const { opId, data, opsById, upsert, isOnDesk, toggleDesk, onOpenTask, onNewTask, onCreate } = p;
  const [seg, setSeg] = React.useState('abertas'); // abertas | concluidas
  const [groupBy, setGroupBy] = React.useState('prazo'); // prazo | prioridade
  const [q, setQ] = React.useState('');
  const [closed, setClosed] = React.useState({});
  const [draft, setDraft] = React.useState({ title: '', dueDate: '' });

  const all = (data.tasks || []).filter(t => t.operationId === opId);
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  const filtered = !toks.length ? all : all.filter(t => {
    const hay = cxNorm([t.title, t.description, t.processNumber, cxTaskNotes(t).join(' ')].join(' '));
    return toks.every(tk => hay.includes(tk));
  });
  const open = filtered.filter(cxTaskOpen);
  const done = filtered.filter(t => t.status === 'concluida').sort((a, b) => String(b.completedAt || b.updatedAt || '').localeCompare(String(a.completedAt || a.updatedAt || '')));
  const late = open.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d < 0; }).length;
  const weekToday = open.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d >= 0 && d <= 7; }).length;
  const nextTask = open.filter(t => { const d = daysUntil(t.dueDate); return d !== null && d >= 0; }).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];

  const toggle = (t) => { const next = t.status === 'concluida' ? 'pendente' : 'concluida'; upsert('tasks', { ...t, status: next }); cxNotify(next === 'concluida' ? 'Tarefa concluída' : 'Tarefa reaberta'); };
  const addTask = (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    onCreate({ title, dueDate: draft.dueDate || '', priority: 'media' });
    setDraft({ title: '', dueDate: '' });
  };
  const groups = cxGroupTasks(open, groupBy, opsById);
  const row = (t) => <CxTaskRow key={t.id} t={t} op={opsById.get(t.operationId)} onOpen={onOpenTask} onToggle={toggle} onOpenOp={null} deskOn={isOnDesk('task', t.id)} onDesk={() => toggleDesk('task', t.id, daysUntil(t.dueDate))} />;

  return <div className="cx cx-page cx-page-wide cx-pp">
    <CxKpiStrip n={4}>
      <CxKpiCard label="Abertas" value={open.length} desc={cxPl(all.length, 'tarefa', 'tarefas') + ' no total'}
        foot={nextTask ? <>próxima: <b>{cxDue(daysUntil(nextTask.dueDate), nextTask.dueDate).txt}</b></> : 'nenhuma com data limite'} />
      <CxKpiCard label="Vencidas" value={late} tone={late ? 'red' : ''} desc={late ? 'atenção' : 'nenhuma'} descTone={late ? 'red' : ''} foot={'de ' + cxPl(open.length, 'aberta', 'abertas')} />
      <CxKpiCard label="Hoje / semana" value={weekToday} tone={weekToday ? 'orange' : ''} desc="próximos 7 dias" foot={'de ' + cxPl(open.length, 'aberta', 'abertas')} />
      <CxKpiCard label="Concluídas" value={done.length} desc="histórico" foot={'de ' + cxPl(all.length, 'tarefa', 'tarefas')} />
    </CxKpiStrip>

    <div className="cx-pp-toolbar">
      <input className="cx-tab-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar tarefa" aria-label="Buscar tarefa" />
      <CxChips sm label="Situação das tarefas" value={seg} onChange={setSeg} options={[['abertas', 'Abertas', open.length], ['concluidas', 'Concluídas', done.length]]} />
      <CxSelect pre="Agrupar" label="Agrupar tarefas" value={groupBy} onChange={setGroupBy} options={[['prazo', 'Prazo'], ['prioridade', 'Prioridade']]} />
      <span className="cx-muted cx-small">🌐 = aparece também na tela Tarefas</span>
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm" onClick={onNewTask}>+ Tarefa completa</button>
    </div>

    <form className="cx-quick" onSubmit={addTask}>
      <CxIcon n="plus" s={15} className="cx-muted" />
      <input className="cx-quick-t" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Nova tarefa: escreva e tecle Enter" aria-label="Título da nova tarefa" />
      <input type="date" className="cx-input cx-quick-d" value={draft.dueDate} onChange={e => setDraft({ ...draft, dueDate: e.target.value })} aria-label="Data limite" title="Data limite (opcional)" />
      <button type="submit" className="cx-btn sm primary" disabled={!draft.title.trim()}>Criar</button>
    </form>

    <div className="cx-pp-body">
      <div className="cx-pp-cards">
        <div className="cx-list">
          {seg === 'abertas' ? <>
            {!groups.length ? <div className="cx-empty-row" style={{ borderTop: 0 }}>{all.length ? 'Nenhuma tarefa aberta com esses filtros.' : 'Nenhuma tarefa ainda. Escreva a primeira acima.'}</div> : null}
            {groups.map(g => {
              const isClosed = !!closed[g.key];
              return <React.Fragment key={g.key}>
                <button type="button" className={'cx-grp' + (isClosed ? ' closed' : '')} aria-expanded={!isClosed} onClick={() => setClosed(c => ({ ...c, [g.key]: !isClosed }))}>
                  <span className="cx-caret"><CxIcon n="chevD" s={14} /></span>{g.icon}<span>{g.label}</span><span className="cx-n">{g.items.length}</span>
                </button>
                {isClosed ? null : g.items.slice().sort(cxTaskSort).map(row)}
              </React.Fragment>;
            })}
          </> : <>
            {!done.length ? <div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma tarefa concluída.</div> : done.slice(0, 30).map(row)}
            {done.length > 30 ? <div className="cx-more">+{done.length - 30} concluídas mais antigas</div> : null}
          </>}
        </div>
      </div>
    </div>
  </div>;
}

/* ═════════════════════ Arquivos (aba da operação) ═════════════════════
   Mesmos dados da aba clássica "docs" (título/URL, tipo, processo, origem —
   de intimação ou incluído à mão —, data de atuação), em tabela agrupada por
   tipo ou processo, com ficha lateral no lugar do botão ✎ por linha. */
function cxDocOrigin(d) { return d.sourceIntimationId ? 'intim' : 'manual'; }
function cxDocGroupKey(d, mode) { if (mode === 'processo') return d.processNumber || d.processRef || '_sem'; return d.type || d.docType || 'Outro'; }
function cxDocGroupLabel(key, mode) { if (mode === 'processo') return key === '_sem' ? 'Sem processo vinculado' : key; return key; }

/* Ficha lateral do documento — mesmo padrão das demais (blocos recolhíveis);
   quando vem de intimação, atalho "Ver intimação" abre a gaveta da intimação. */
function EditionClaudeDocDrawer({ doc: d, data, onClose, setModal, onOpenIntim }) {
  const [blocks, setBlocks] = React.useState({ origem: true, desc: true, notas: false });
  const toggle = (k) => setBlocks(prev => ({ ...prev, [k]: !prev[k] }));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!d) return null;
  const fromIntim = cxDocOrigin(d) === 'intim';
  const sourceIntim = fromIntim ? (data.intimations || []).find(i => i.id === d.sourceIntimationId) : null;
  const actDate = d.actionDate || (d.createdAt ? String(d.createdAt).slice(0, 10) : '');
  const procNum = d.processNumber || d.processRef || '';
  const notes = (d.notesList || (d.notes ? [d.notes] : [])).filter(Boolean);
  const typeLabel = d.type || d.docType || 'Outro';
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd" role="dialog" aria-modal="true" aria-label="Documento">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className="cx-pd-kind">{typeLabel}</span><b className="cx-pd-num cx-ell" style={{ fontFamily: 'var(--cx-font)' }} title={d.title || d.url}>{d.title || d.url || 'Documento'}</b></div>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body">
        <dl className="cx-pd-facts">
          <dt>Processo</dt><dd>{procNum ? <span className="cx-mono cx-small">{procNum}</span> : <span className="cx-muted">Sem processo vinculado</span>}</dd>
          <dt>Origem</dt><dd>{fromIntim ? <span className="cx-tag green">📬 intimação</span> : <span className="cx-tag">incluído</span>}</dd>
          <dt>Data</dt><dd>{actDate ? fmtDate(actDate) : '—'} <span className="cx-muted cx-small">{d.actionDate ? '· atuação' : (d.createdAt ? '· criação do registro' : '')}</span></dd>
        </dl>
        {fromIntim && <CxBlock title="Origem: intimação" open={!!blocks.origem} onToggle={() => toggle('origem')}>
          <div className="cx-small">{sourceIntim ? (sourceIntim.eventDescription || 'Intimação') : 'Intimação não encontrada (pode ter sido excluída).'}{sourceIntim && sourceIntim.dateDeadline ? ' · prazo ' + fmtDate(sourceIntim.dateDeadline) : ''}</div>
          {sourceIntim && onOpenIntim ? <button type="button" className="cx-link-btn" onClick={() => onOpenIntim(sourceIntim.id)}>Ver intimação<CxIcon n="chevR" s={12} /></button> : null}
        </CxBlock>}
        {d.description ? <CxBlock title="Descrição" open={!!blocks.desc} onToggle={() => toggle('desc')}><p className="cx-bf-work-txt">{d.description}</p></CxBlock> : null}
        <CxBlock title="Notas" count={notes.length} open={!!blocks.notas} onToggle={() => toggle('notas')}>
          {notes.length === 0 ? <div className="cx-empty-row">Sem notas.</div> : notes.map((n, i) => <div key={i} className="cx-pd-note">{n}</div>)}
        </CxBlock>
      </div>
      <div className="cx-dr-foot">
        {d.url ? <a className="cx-btn sm primary" href={d.url} target="_blank" rel="noopener noreferrer">Abrir ↗</a> : null}
        <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'document', initial: d })}>✎ Editar</button>
      </div>
    </aside>
  </>;
}

function EditionClaudeArquivos(p) {
  const { opId, data, setModal, onOpenIntim, collapsedGroups, toggleGroup } = p;
  const [q, setQ] = React.useState('');
  const [origin, setOrigin] = React.useState('all'); // all | intim | manual
  const [groupMode, setGroupMode] = React.useState('tipo'); // tipo | processo
  const [drawerId, setDrawerId] = React.useState(null);
  const [showMore, setShowMore] = React.useState({});

  const all = (data.documents || []).filter(d => d.operationId === opId);
  const nIntim = all.filter(d => cxDocOrigin(d) === 'intim').length;
  const nManual = all.length - nIntim;

  let items = origin === 'all' ? all : all.filter(d => cxDocOrigin(d) === origin);
  if (q.trim()) {
    const qn = q.trim().toLowerCase();
    items = items.filter(d => [d.title, d.processNumber, d.processRef, d.url].filter(Boolean).some(v => String(v).toLowerCase().includes(qn)));
  }
  items = [...items].sort((a, b) => String(b.actionDate || b.createdAt || '').localeCompare(String(a.actionDate || a.createdAt || '')));

  const map = {};
  items.forEach(d => { const k = cxDocGroupKey(d, groupMode); if (!map[k]) map[k] = []; map[k].push(d); });
  const groups = Object.entries(map).map(([key, list]) => ({ key, label: cxDocGroupLabel(key, groupMode), items: list }))
    .sort((a, b) => b.items.length - a.items.length || String(a.label).localeCompare(String(b.label), 'pt-BR'));

  const DocRow = ({ d }) => {
    const fromIntim = cxDocOrigin(d) === 'intim';
    const sourceIntim = fromIntim ? (data.intimations || []).find(i => i.id === d.sourceIntimationId) : null;
    const actDate = d.actionDate || (d.createdAt ? String(d.createdAt).slice(0, 10) : '');
    const procNum = d.processNumber || d.processRef || '';
    const isOpen = drawerId === d.id;
    return <tr className={'cx-pt-row' + (isOpen ? ' on' : '')} onClick={() => setDrawerId(d.id)}>
      <td className="cx-pt-num"><span className="cx-ell" title={d.title || d.url}>{d.title || d.url || 'Documento'}</span></td>
      <td>{procNum ? <span className="cx-mono cx-small">{procNum}</span> : <span className="cx-muted cx-small">—</span>}</td>
      <td>{fromIntim ? <span className="cx-tag green" title={sourceIntim ? (sourceIntim.eventDescription || '') : ''}>📬 intimação</span> : <span className="cx-tag">incluído</span>}</td>
      <td className="cx-small cx-mono">{actDate ? fmtDate(actDate) : '—'}</td>
    </tr>;
  };

  const GroupBlock = ({ g }) => {
    const key = 'doc-' + g.key;
    const isCollapsed = collapsedGroups.has(key);
    const shown = showMore[key] || 8;
    const visible = g.items.slice(0, shown);
    const rest = g.items.length - visible.length;
    return <React.Fragment>
      <tr className="cx-pt-band cx-pt-clickable" onClick={() => toggleGroup(key)}>
        <td colSpan={4}><span className="cx-chev sm">{isCollapsed ? '▸' : '▾'}</span>{g.label}<span className="cx-muted cx-small"> · {cxPl(g.items.length, 'documento', 'documentos')}</span></td>
      </tr>
      {!isCollapsed && visible.map(d => <DocRow key={d.id} d={d} />)}
      {!isCollapsed && rest > 0 && <tr className="cx-pt-more"><td colSpan={4}><button type="button" className="cx-link-btn" onClick={() => setShowMore(s => ({ ...s, [key]: shown + 20 }))}>Mostrar mais {rest}</button></td></tr>}
    </React.Fragment>;
  };

  return <div className="cx cx-page cx-page-wide cx-pp">
    <CxKpiStrip n={3}>
      <CxKpiCard label="Total" value={all.length} desc={cxPl(all.length, 'documento', 'documentos')} foot={cxPl(new Set(all.map(d => cxDocGroupKey(d, 'tipo'))).size, 'tipo', 'tipos') + ' de documento'} />
      <CxKpiCard label="De intimações" value={nIntim} desc="registrados automaticamente" foot={'de ' + cxPl(all.length, 'documento', 'documentos')} />
      <CxKpiCard label="Incluídos" value={nManual} desc="adicionados à mão" foot={'de ' + cxPl(all.length, 'documento', 'documentos')} />
    </CxKpiStrip>

    <div className="cx-pp-toolbar">
      <input className="cx-tab-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar título ou processo" aria-label="Buscar documento" />
      <CxChips sm label="Origem dos arquivos" value={origin} onChange={setOrigin} options={[['all', 'Todos', all.length], ['intim', 'De intimações', nIntim], ['manual', 'Incluídos', nManual]]} />
      <CxSelect pre="Agrupar" label="Agrupar documentos" value={groupMode} onChange={setGroupMode} options={[['tipo', 'Tipo'], ['processo', 'Processo']]} />
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'document', initial: {} })}>+ Documento</button>
    </div>

    <div className="cx-pp-body">
      <div className="cx-pp-cards">
        <div className="cx-card cx-pt-wrap"><table className="cx-pt">
          <thead><tr><th>Documento</th><th>Processo</th><th>Origem</th><th>Data da atuação</th></tr></thead>
          <tbody>
            {groups.map(g => <GroupBlock key={g.key} g={g} />)}
            {groups.length === 0 && <tr><td colSpan={4} className="cx-empty-row">Nenhum documento vinculado.</td></tr>}
          </tbody>
        </table></div>
      </div>
      {drawerId && (() => {
        const d = all.find(x => x.id === drawerId);
        if (!d) return null;
        return <EditionClaudeDocDrawer doc={d} data={data} onClose={() => setDrawerId(null)} setModal={setModal} onOpenIntim={onOpenIntim} />;
      })()}
    </div>
  </div>;
}

/* ═════════════════════ Importar (aba da operação) ═════════════════════
   Mesmos três modos e handlers da aba clássica (Planilhas/PDFs/Texto — cada
   um com seus três sub-tipos), só que em duas colunas: à esquerda o que
   fazer (modo, soltar arquivos, resultado logo abaixo); à direita o estado
   (atualização por fonte e histórico SIDA/Debcad). Nenhum handler muda. */
const CX_IMPORT_TYPE_LABELS = { xls: 'XLS Procuradoria', ai: 'Texto IA', eproc: 'Intimações eproc', pdf_sida: 'PDF SIDA', pdf_debcad: 'PDF Debcad', pdf_sida_debcad: 'PDF SIDA + Debcad', pdf_pgfn: 'PDF PGFN', assets: 'Bens em Lote' };
function cxImportRelTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'há poucos segundos';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'há 1 dia';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return `há ${Math.floor(months / 12)} ano(s)`;
}
function cxStalenessColor(iso) {
  const days = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) return 'var(--cx-green)';
  if (days < 30) return 'var(--cx-yellow)';
  return 'var(--cx-red)';
}
function EditionClaudeImportar(p) {
  const { opId, data, setData, importMode, setImportMode,
    xlsInputRef, eprocInputRef, pgfnPdfInputRef,
    handleXLSImport, handleEprocImport, handlePGFNPDFImport,
    textoImportKind, setTextoImportKind, aiText, setAiText, setPrescImport,
    assetText, setAssetText, handleAIImport, handleAssetBulkImport,
    collapsedGroups, toggleGroup, importResult, setImportResult, activeOpId } = p;

  const allLogs = (data.importLogs || []).filter(l => !l.operationId || l.operationId === opId);
  const lastByType = {};
  allLogs.forEach(l => { if (!lastByType[l.type] || l.timestamp > lastByType[l.type].timestamp) lastByType[l.type] = l; });
  const lastEntries = Object.values(lastByType).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const clearLogs = () => {
    if (!confirm('Apagar todo o histórico de importações desta operação? Os dados importados (CDAs, processos, intimações, etc.) NÃO serão afetados — apenas o log de quando foram importados.')) return;
    setData(prev => ({ ...prev, importLogs: (prev.importLogs || []).filter(l => l.operationId && l.operationId !== opId) }));
  };

  const op = (data.operations || []).find(o => o.id === opId);
  const hist = op?.importHistory || {};
  const fromLogs = (types) => (allLogs || []).filter(l => types.includes(l.type) && l.timestamp).map(l => l.timestamp);
  const sidaDates = [...(hist.sida && hist.sida.length ? hist.sida : fromLogs(['pdf_sida', 'pdf_sida_debcad']))].filter(Boolean).sort((a, b) => b.localeCompare(a));
  const debcadDates = [...(hist.debcad && hist.debcad.length ? hist.debcad : fromLogs(['pdf_debcad', 'pdf_sida_debcad']))].filter(Boolean).sort((a, b) => b.localeCompare(a));
  const fmtHist = (iso) => { try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (_) { return iso; } };

  const ResultLog = () => !importResult ? null : <div className="cx-card cx-imp-card cx-imp-log">
    <div className="cx-imp-log-h"><b>Resultado da importação</b><span className="cx-sp" /><button type="button" className="cx-btn sm ghost" onClick={() => setImportResult(null)}>Fechar</button></div>
    <div className="cx-log">{importResult.map((log, i) => <div key={i} className={log.startsWith('✅') ? 'ok' : log.startsWith('⚠️') || log.startsWith('ℹ️') ? 'wa' : log.startsWith('❌') ? 'err' : ''}>{log}</div>)}</div>
  </div>;

  return <div className="cx cx-page cx-page-wide cx-pp">
    <div className="cx-imp-wrap">
      <div className="cx-imp-col">
        <div className="cx-card cx-imp-card">
          <div className="cx-toolbar" style={{ marginBottom: 10 }}>
            <CxSeg value={importMode} onChange={setImportMode} options={[['planilhas', 'Planilhas (.xls)'], ['pdfs', 'PDFs (SIDA/Debcad)'], ['texto', 'Texto']]} />
            <span className="cx-sp" />
            <span className="cx-muted cx-small">O tipo é detectado pelo nome ou pelo conteúdo</span>
          </div>

          {importMode === 'planilhas' && <>
            <p className="cx-muted cx-small" style={{ marginBottom: 10 }}>Arraste ou selecione planilhas da Procuradoria (Inscrições / Processos) ou intimações do eproc. O sistema identifica o tipo automaticamente.</p>
            <div className="cx-imp-drops">
              <div>
                <div className="cx-imp-drop-lbl">XLS da Procuradoria</div>
                <div className="cx-drop" onClick={() => xlsInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('over')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('over'); handleXLSImport({ target: { files: e.dataTransfer.files } }); }}>
                  <b><CxIcon n="upload" s={14} /> Solte os arquivos ou clique</b>
                  <span className="cx-mono cx-small">RelatorioAbaInscricoes*.xls · RelatorioAbaProcessosJudiciais*.xls</span>
                </div>
                <input ref={xlsInputRef} type="file" accept=".xls,.xlsx" multiple style={{ display: 'none' }} onChange={handleXLSImport} />
              </div>
              <div>
                <div className="cx-imp-drop-lbl">Intimações eproc (TRF4)</div>
                <div className="cx-drop" onClick={() => eprocInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('over')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('over'); handleEprocImport({ target: { files: e.dataTransfer.files } }); }}>
                  <b><CxIcon n="upload" s={14} /> Solte os arquivos ou clique</b>
                  <span className="cx-mono cx-small">citacaoIntimacao*.xls</span>
                </div>
              </div>
            </div>
          </>}

          {importMode === 'pdfs' && <>
            <p className="cx-muted cx-small" style={{ marginBottom: 10 }}>Enriquece CDAs já cadastradas com datas de inscrição, eventos prescricionais (parcelamentos, ajuizamentos) e protestos. Importe a planilha primeiro — o match é por nº da CDA. Se os devedores do PDF não estiverem entre as pessoas desta operação, o app pede confirmação antes de gravar.</p>
            <div className="cx-drop" onClick={() => pgfnPdfInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over'); }}
              onDragLeave={e => e.currentTarget.classList.remove('over')}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('over'); handlePGFNPDFImport({ target: { files: e.dataTransfer.files } }); }}>
              <b>📑 Solte os arquivos ou clique</b>
              <span className="cx-mono cx-small">SIDA-Relatorio*.pdf · RelatorioCompleto-debcad*.pdf</span>
              <span className="cx-muted cx-small">Nome do arquivo deve conter "sida" ou "debcad"</span>
            </div>
            <input ref={pgfnPdfInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handlePGFNPDFImport} />
          </>}

          {importMode === 'texto' && <>
            <p className="cx-muted cx-small">Cole dados de pessoas (IA da Procuradoria), bens indisponibilizados, ou análise de prescrição (formato NEXUS).</p>
            <div className="cx-seg" style={{ marginBottom: 10 }}>
              <button type="button" className={textoImportKind === 'pessoas' ? 'on' : ''} onClick={() => { setTextoImportKind('pessoas'); if (collapsedGroups.has('import-assets-mode')) toggleGroup('import-assets-mode'); }}>Pessoas</button>
              <button type="button" className={textoImportKind === 'bens' ? 'on' : ''} onClick={() => { setTextoImportKind('bens'); if (!collapsedGroups.has('import-assets-mode')) toggleGroup('import-assets-mode'); }}>Bens em lote</button>
              <button type="button" className={textoImportKind === 'prescricao' ? 'on' : ''} onClick={() => setTextoImportKind('prescricao')}>Prescrição</button>
            </div>
            {textoImportKind === 'prescricao' ? <>
              <div className="cx-muted cx-small" style={{ marginBottom: 6 }}>Bloco <code>[INÍCIO NEXUS] … PRESCRIÇÃO … [FIM NEXUS]</code>. Sempre há prévia antes de gravar.</div>
              <textarea className="cx-input" value={aiText} onChange={e => setAiText(e.target.value)} rows={8}
                placeholder={'[INÍCIO NEXUS]\nPRESCRIÇÃO\nPROCESSO | … | EF\nFATO | PENHORA | 26/01/2024 | 15/12/2023 |  | (DOC4, Evento 77) | …\n[FIM NEXUS]'} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button type="button" className="cx-btn sm primary" onClick={() => setPrescImport({ text: aiText, plan: planNexusPrescricao(parseNexusPrescricao(aiText), data), after: null })} disabled={!aiText.trim()}>Prévia</button>
                <button type="button" className="cx-btn sm ghost" onClick={() => setAiText('')}>Limpar</button>
              </div>
            </> : !collapsedGroups.has('import-assets-mode') ? <>
              <div className="cx-muted cx-small" style={{ marginBottom: 6 }}>Formato: <code>Nome - CPF/CNPJ - Papel</code> · Para bens: <code>Bem: Descrição | Tipo | Obs</code></div>
              <textarea className="cx-input" value={aiText} onChange={e => setAiText(e.target.value)} rows={6}
                placeholder={"João da Silva - 123.456.789-00 - Sócio administrador\nEmpresa XYZ Ltda - 12.345.678/0001-00 - Fachada\nBem: Imóvel Matrícula 54321 CRI Curitiba | Imóvel | Em nome de Maria"} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button type="button" className="cx-btn sm primary" onClick={handleAIImport} disabled={!aiText.trim()}>Processar e Importar</button>
                <button type="button" className="cx-btn sm ghost" onClick={() => setAiText('')}>Limpar</button>
              </div>
            </> : <>
              <div className="cx-muted cx-small" style={{ marginBottom: 6 }}>Formato por linha, separado por <code>-</code> (traço), <code>|</code> ou TAB: <code style={{ display: 'block', marginTop: 4 }}>Tipo - Descrição - Registro - Valor - Status - CPF/CNPJ - Origem - Processo - Notas</code></div>
              <div className="cx-imp-legend">
                <div><b>Tipos:</b> I=Imóvel · V=Veículo · C=Conta · $=Investimento · S=Participação · O=Outro</div>
                <div><b>Status:</b> IND=Indisponibilizado · PEN=Penhorado · ARR=Arrestado · BLOQ=Bloqueado · LIV=Livre</div>
              </div>
              <textarea className="cx-input" value={assetText} onChange={e => setAssetText(e.target.value)} rows={6}
                placeholder={`Imóvel Matrícula 54.321 - CRI Curitiba - 54321 - 450.000,00 - IND - 123.456.789-00 - CNIB\nToyota Hilux 2022 ABC-1234 - ABC1234 - 180.000,00 - ARR - 12.345.678/0001-00 - Renajud`} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="cx-btn sm primary" onClick={handleAssetBulkImport} disabled={!assetText.trim() || !activeOpId}>Importar Bens</button>
                <button type="button" className="cx-btn sm ghost" onClick={() => setAssetText('')}>Limpar</button>
                {!activeOpId && <span className="cx-small" style={{ color: 'var(--cx-yellow)' }}>Selecione uma operação primeiro</span>}
              </div>
            </>}
          </>}
        </div>
        <ResultLog />
      </div>

      <div className="cx-imp-col cx-imp-side">
        <div className="cx-card cx-imp-card">
          <div className="cx-imp-log-h"><b>Atualização por fonte</b><span className="cx-sp" />{lastEntries.length > 0 && <button type="button" className="cx-btn sm ghost" onClick={clearLogs}>Limpar histórico</button>}</div>
          {lastEntries.length === 0 ? <div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma importação registrada ainda.</div> : lastEntries.map(l => {
            const label = CX_IMPORT_TYPE_LABELS[l.type] || l.type;
            const color = cxStalenessColor(l.timestamp);
            return <div key={l.id} className="cx-srcr">
              <span className="cx-dot" style={{ background: color }} />
              <div><div>{label}</div><div className="cx-muted cx-small">{l.summary}</div></div>
              <span className="cx-muted cx-small">{cxImportRelTime(l.timestamp)}</span>
            </div>;
          })}
          {allLogs.length > lastEntries.length && <div className="cx-muted cx-small" style={{ marginTop: 8, textAlign: 'right' }}>{allLogs.length} importação(ões) registrada(s) no total</div>}
        </div>
        <div className="cx-card cx-imp-card">
          <b>Histórico SIDA / Debcad</b>
          <div className="cx-imp-hist">
            <div><span className="cx-muted cx-small">SIDA</span>{sidaDates.length === 0 ? <div className="cx-muted cx-small" style={{ marginTop: 4 }}>Nenhuma importação SIDA ainda</div> : <ul>{sidaDates.map((iso, i) => <li key={'sida-' + iso + '-' + i} className="cx-small">{fmtHist(iso)}</li>)}</ul>}</div>
            <div><span className="cx-muted cx-small">DEBCAD</span>{debcadDates.length === 0 ? <div className="cx-muted cx-small" style={{ marginTop: 4 }}>Nenhuma importação DEBCAD ainda</div> : <ul>{debcadDates.map((iso, i) => <li key={'deb-' + iso + '-' + i} className="cx-small">{fmtHist(iso)}</li>)}</ul>}</div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

/* ═════════════════════ Minha atividade ═════════════════════
   Registro de trabalho: lista corrida do que foi alterado no Nexus, com antes e depois e restauração.
   Dados vêm de `activityApi` (src/app.jsx → createActivityApi); o diff de texto é de src/lib/textdiff.js. */
const CX_ACT_TYPES = {
  atuacao: 'Atuação', intimacao: 'Intimação', cda: 'CDA', bem: 'Bem/constrição', processo: 'Processo', fase: 'Fase', decisao: 'Decisão',
  diario: 'Diário', tarefa: 'Tarefa', lembrete: 'Lembrete', parte: 'Parte', documento: 'Documento', prescricao: 'Prescrição',
  acompanhamento: 'Acompanhar', audiencia: 'Audiência', operacao: 'Operação', vinculo: 'Vínculo', importacao: 'Importação',
  exclusao: 'Exclusão', restauracao: 'Restauração', sistema: 'Sistema',
};
const CX_ACT_ORIGIN = { importacao: 'importação', automatico: 'automático', desfazer: 'desfazer', restauracao: 'restauração', bot: 'bot', sistema: 'sistema' };
const CX_ACT_COLS = {
  operations: ['operação', 'operações'], people: ['parte', 'partes'], debts: ['CDA', 'CDAs'], executions: ['processo', 'processos'],
  measures: ['medida', 'medidas'], assets: ['bem', 'bens'], documents: ['documento', 'documentos'],
  prescriptionEvents: ['evento de prescrição', 'eventos de prescrição'], intimations: ['intimação', 'intimações'],
  tasks: ['tarefa', 'tarefas'], stickyNotes: ['lembrete', 'lembretes'], watchlist: ['item de acompanhamento', 'itens de acompanhamento'],
  hearings: ['audiência', 'audiências'],
};
function cxActColName(col, n) { const c = String(col || '').startsWith('links.') ? ['vínculo', 'vínculos'] : (CX_ACT_COLS[col] || ['item', 'itens']); return n === 1 ? c[0] : c[1]; }
const CX_ACT_KPIS = [
  ['atuacoes', 'Atuações', (e) => e.kind === 'atuacao'],
  ['cdas', 'CDAs alteradas', (e) => cxActCdaIds(e).length > 0],
  ['diario', 'Entradas no diário', (e) => e.kind === 'diario' && e.action !== 'excluir'],
  ['tarefas', 'Tarefas concluídas', (e) => e.kind === 'tarefa' && e.action === 'concluir'],
  ['excluidos', 'Itens excluídos', (e) => e.action === 'excluir' && e.kind !== 'sistema'],
];

function cxActType(ev) {
  if (ev.kind === 'sistema') return 'sistema';
  if (ev.source === 'restauracao') return 'restauracao';
  if (ev.kind === 'importacao') return 'importacao';
  if (ev.action === 'excluir') return 'exclusao';
  if (ev.kind === 'constricao') return 'bem';
  if (ev.kind === 'frente') return 'fase';
  return CX_ACT_TYPES[ev.kind] ? ev.kind : 'sistema';
}
function cxActCdaIds(ev) {
  if (ev.batch) return (ev.batch.details || []).filter(d => d.col === 'debts' && d.op !== 'delete').map(d => String(d.id));
  return ev.entity && ev.entity.col === 'debts' && ev.kind === 'cda' && ev.action !== 'excluir' ? [String(ev.entity.id)] : [];
}
function cxActMask(s) {
  const d = String(s || '').replace(/\D/g, '');
  return d.length === 20 ? d.slice(0, 7) + '-' + d.slice(7, 9) + '.' + d.slice(9, 13) + '.' + d.slice(13, 14) + '.' + d.slice(14, 16) + '.' + d.slice(16) : String(s || '');
}
function cxActTime(ts) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}
const cxActDmy = (day) => (/^\d{4}-\d{2}-\d{2}$/.test(day || '') ? day.slice(8) + '/' + day.slice(5, 7) + '/' + day.slice(0, 4) : String(day || ''));
function cxActDayLabel(day, today) {
  const d = new Date(day + 'T12:00:00');
  const full = (isNaN(d.getTime()) ? '' : CX_DOW_L[d.getDay()].split('-')[0] + ', ') + cxActDmy(day);
  if (day === today) return { main: 'Hoje', sub: full };
  if (day === addCalendarDays(today, -1)) return { main: 'Ontem', sub: full };
  return { main: full, sub: '' };
}
function cxActVal(v) {
  if (v == null) return '';
  const s = String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s);
  if (!m || !/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(s)) return s;
  if (!m[4]) return m[3] + '/' + m[2] + '/' + m[1];
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).replace(',', '');
}
const cxActShown = (c, side) => cxActVal(side === 'from' ? (c.fromText != null ? c.fromText : c.from) : (c.toText != null ? c.toText : c.to));
const cxActPlain = (tc, side) => (tc.format === 'html' ? textdiffPlain(tc[side]) : String(tc[side] == null ? '' : tc[side]));
const cxActSnip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

/* Período: [de, até] em AAAA-MM-DD e o rótulo do passo. */
function cxActRange(per, off, cust, today) {
  if (per === 'hoje') {
    const d = addCalendarDays(today, off);
    const lb = off === 0 ? 'Hoje' : off === -1 ? 'Ontem' : cxActDayLabel(d, today).main;
    return { from: d, to: d, label: lb + (off === 0 || off === -1 ? ' · ' + cxActDmy(d).slice(0, 5) : '') };
  }
  if (per === 'semana') {
    const base = addCalendarDays(today, 7 * off);
    const dow = new Date(base + 'T12:00:00').getDay();
    const mon = addCalendarDays(base, -((dow + 6) % 7));
    const sun = addCalendarDays(mon, 6);
    return { from: mon, to: sun, label: 'Semana · ' + cxActDmy(mon).slice(0, 5) + ' a ' + cxActDmy(sun).slice(0, 5) };
  }
  if (per === 'mes') {
    const t = new Date(today + 'T12:00:00');
    const a = new Date(t.getFullYear(), t.getMonth() + off, 1), b = new Date(t.getFullYear(), t.getMonth() + off + 1, 0);
    return { from: localIso(a), to: localIso(b), label: cxCap(CX_MES_L[a.getMonth()]) + ' de ' + a.getFullYear() };
  }
  const f = cust.from || today, t2 = cust.to || today;
  const lo = f <= t2 ? f : t2, hi = f <= t2 ? t2 : f;
  return { from: lo, to: hi, label: cxActDmy(lo) + ' a ' + cxActDmy(hi) };
}
function cxActBlob(ev) {
  const parts = [ev.summary, ev.op && ev.op.name, ev.entity && ev.entity.label, ev.entity && ev.entity.proc, ev.batch && ev.batch.label];
  (ev.changes || []).forEach(c => parts.push(c.label, cxActShown(c, 'from'), cxActShown(c, 'to')));
  (ev.textChanges || []).forEach(t => parts.push(t.label, cxActPlain(t, 'from'), cxActPlain(t, 'to')));
  if (ev.batch) (ev.batch.details || []).forEach(d => parts.push(d.label, d.proc, (d.fields || []).join(' ')));
  return cxNorm(parts.filter(Boolean).join(' \n '));
}
function cxActDigits(ev) {
  const parts = [ev.summary, ev.entity && ev.entity.label, ev.entity && ev.entity.proc];
  if (ev.batch) (ev.batch.details || []).forEach(d => parts.push(d.label, d.proc));
  (ev.changes || []).forEach(c => parts.push(cxActShown(c, 'from'), cxActShown(c, 'to')));
  return parts.filter(Boolean).map(x => String(x).replace(/\D/g, '')).filter(Boolean);
}
const cxActHasRestore = (ev) => ev.kind !== 'sistema' && (ev.restore ? (ev.restore.items || []).length > 0 : true);
/* Itens do `only` de planRestore para restaurar só um campo: itens de briefing casam pelo caminho, os demais pelo campo de nível 1. */
function cxActOnly(full, f) {
  const out = [];
  ((full.restore && full.restore.items) || []).forEach(it => {
    if (it.path) { if (f === it.path || String(f).indexOf(it.path) === 0 || it.path.indexOf(String(f)) === 0) out.push({ col: it.col, id: it.id, field: it.path }); }
    else out.push({ col: it.col, id: it.id, field: String(f).split('.')[0].replace(/\[.*$/, '') });
  });
  return out;
}
function cxActEvRow(ev) {
  const antes = [], depois = [];
  (ev.changes || []).forEach(c => { antes.push(c.label + ': ' + (cxActShown(c, 'from') || '—')); depois.push(c.label + ': ' + (cxActShown(c, 'to') || '—')); });
  (ev.textChanges || []).forEach(t => { antes.push(t.label + ': ' + cxActSnip(cxActPlain(t, 'from'), 500)); depois.push(t.label + ': ' + cxActSnip(cxActPlain(t, 'to'), 500)); });
  const org = ev.source && ev.source !== 'manual' ? (CX_ACT_ORIGIN[ev.source] || ev.source) + (ev.source === 'importacao' && ev.batch ? ' ' + ev.batch.label : '') : 'manual';
  return [cxActDmy(ev.day), cxActTime(ev.ts), (ev.op && ev.op.name) || '', cxActMask(ev.entity && ev.entity.proc), CX_ACT_TYPES[cxActType(ev)], ev.action || '', ev.summary || '', antes.join('\n'), depois.join('\n'), org];
}
const CX_ACT_HEADER = ['Data', 'Hora', 'Operação', 'Processo', 'Tipo', 'Ação', 'Resumo', 'Antes', 'Depois', 'Origem'];
/* "Excluiu o bem X e 2 itens vinculados" → "bem X". */
function cxActItemName(ev) { return String(ev.summary || '').replace(/^Excluiu\s+(o|a)\s+/, '').replace(/\s+e \d+ (item vinculado|itens vinculados)$/, ''); }
function cxActCsv(rows) {
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '﻿' + [CX_ACT_HEADER].concat(rows).map(r => r.map(q).join(';')).join('\r\n');
}
function cxActDownload(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function CxActTextDiff({ tc }) {
  const sides = React.useMemo(() => diffSides(cxActPlain(tc, 'from'), cxActPlain(tc, 'to')), [tc]);
  const render = (parts, tag) => parts.map((x, i) => (x.hl ? React.createElement(tag, { key: i }, x.s) : <React.Fragment key={i}>{x.s}</React.Fragment>));
  return <div className="cx-act-dg">
    <div className="cx-act-db"><h4>Antes</h4><div className="tx">{sides.before.length ? render(sides.before, 'del') : <i className="cx-muted">(vazio)</i>}</div></div>
    <div className="cx-act-db"><h4>Depois</h4><div className="tx">{sides.after.length ? render(sides.after, 'ins') : <i className="cx-muted">(vazio)</i>}</div></div>
  </div>;
}

function CxActDetail({ ev, full, onOpen, onRestore }) {
  const src = full && typeof full === 'object' ? full : ev;
  const [allRows, setAllRows] = React.useState(false);
  const can = cxActHasRestore(ev);
  const en = ev.entity || {};
  const entName = en.type === 'diario' ? 'Diário' : en.type === 'fase' ? 'Fase' : cxCap(cxActColName(en.col, 1));
  const changes = ev.changes || [];
  const texts = src.textChanges || ev.textChanges || [];
  const casc = ev.cascade && ev.cascade.byType ? Object.keys(ev.cascade.byType).map(k => [k, ev.cascade.byType[k]]) : [];
  const rowsAll = ev.batch ? (ev.batch.details || []) : [];
  const rows = allRows ? rowsAll : rowsAll.slice(0, 100);
  const opLbl = { create: 'nova', update: 'alterada', delete: 'removida' };
  const single = ev.action === 'criar' || ev.action === 'excluir' || ev.kind === 'importacao';
  return <div className="cx-act-rd">
    {ev.batch ? <>
      <table className="cx-act-tab"><thead><tr><th>Item</th><th>Alteração</th><th /></tr></thead><tbody>
        {rows.map((d, i) => <tr key={i}>
          <td>{cxCap(cxActColName(d.col, 1))} <b>{d.label || cxActMask(d.proc) || d.id}</b>{d.proc && d.label !== d.proc ? <span className="cx-muted cx-mono"> · {cxActMask(d.proc)}</span> : null}</td>
          <td>{opLbl[d.op] || d.op}{(d.fields || []).length ? ': ' + d.fields.join(', ') : ''}</td>
          <td className="r">{can ? <button type="button" className="cx-btn sm" onClick={() => onRestore({ ev, mode: 'row', row: d })}><CxIcon n="history" s={12} />{d.op === 'create' ? 'Desfazer' : 'Restaurar'}</button> : null}</td>
        </tr>)}
        {!rowsAll.length ? <tr><td colSpan={3} className="cx-muted">Sem detalhe por item neste registro.</td></tr> : null}
      </tbody></table>
      {rowsAll.length > rows.length ? <div className="cx-act-links"><button type="button" className="cx-link-btn" onClick={() => setAllRows(true)}>Mostrar os {rowsAll.length} itens</button></div> : null}
      {ev.batch.detailsCut ? <div className="cx-act-links">A lista de itens foi encurtada para caber no registro; “Desfazer importação inteira” cobre todos.</div> : null}
    </> : null}
    {changes.length ? <table className="cx-act-tab"><thead><tr><th>Campo</th><th>Antes</th><th>Depois</th><th /></tr></thead><tbody>
      {changes.map((c, i) => <tr key={i}>
        <td>{cxCap(c.label)}</td>
        <td className="b"><span>{cxActShown(c, 'from') || '—'}</span></td>
        <td className="a"><span>{cxActShown(c, 'to') || '—'}</span></td>
        <td className="r">{can && !single && cxActShown(c, 'from') !== '' ? <button type="button" className="cx-btn sm" onClick={() => onRestore({ ev, mode: 'field', f: c.f, change: c })}><CxIcon n="history" s={12} />Restaurar este campo</button> : null}</td>
      </tr>)}
    </tbody></table> : null}
    {texts.map((tc, i) => {
      const loading = tc.cut && !(full && typeof full === 'object');
      return <div key={i}>
        <div className="cx-act-dl">{tc.label} · texto completo, com diferenças{tc.truncated ? ' (texto muito longo, guardado só até 200 KB)' : ''}</div>
        {loading ? <div className="cx-muted cx-small" style={{ marginTop: 6 }}>{full === 'erro' ? 'Não foi possível carregar o texto completo.' : 'Carregando o texto completo…'}</div> : <CxActTextDiff tc={tc} />}
        {can && !single && tc.from ? <div className="cx-act-acts" style={{ marginTop: 6 }}><button type="button" className="cx-btn sm" onClick={() => onRestore({ ev, mode: 'text', f: tc.f, tc })}><CxIcon n="history" s={12} />Restaurar texto anterior</button></div> : null}
      </div>;
    })}
    {ev.action === 'excluir' && ev.kind !== 'sistema' ? <div className="cx-act-casc"><b>Apagado:</b> {cxActItemName(ev)}
      {casc.length ? <>
        <br />Também foi junto:
        <ul>{casc.map(([k, n]) => <li key={k}>{n} {cxActColName(k, n)}</li>)}</ul>
      </> : null}
    </div> : null}
    <div className="cx-act-links">
      <span>Ligado a:</span>
      <button type="button" className="cx-act-link" onClick={() => onOpen(ev)}>{entName}{en.label ? ' ' + en.label : ''}</button>
      {en.proc && en.col !== 'executions' ? <span className="cx-mono">Processo {cxActMask(en.proc)}</span> : null}
      {ev.op && ev.op.name ? <span>{ev.op.name}</span> : null}
    </div>
    <div className="cx-act-acts">
      {ev.kind !== 'sistema' ? <button type="button" className="cx-btn primary sm" onClick={() => onOpen(ev)}><CxIcon n="arrowUR" s={12} />Abrir no Nexus</button> : null}
      {can && ev.batch ? <button type="button" className="cx-btn sm cx-act-btn-w" onClick={() => onRestore({ ev, mode: 'batch' })}><CxIcon n="history" s={12} />Desfazer importação inteira</button> : null}
      {can && !ev.batch && ev.action === 'excluir' ? <button type="button" className="cx-btn sm cx-act-btn-w" onClick={() => onRestore({ ev, mode: 'recover' })}><CxIcon n="history" s={12} />Recuperar item</button> : null}
      {can && !ev.batch && ev.action === 'criar' ? <button type="button" className="cx-btn sm cx-act-btn-w" onClick={() => onRestore({ ev, mode: 'event' })}><CxIcon n="history" s={12} />Desfazer criação</button> : null}
      {can && !ev.batch && !single && (changes.length + texts.length) > 1 ? <button type="button" className="cx-btn sm cx-act-btn-w" onClick={() => onRestore({ ev, mode: 'event' })}><CxIcon n="history" s={12} />Restaurar valor anterior (alteração inteira)</button> : null}
    </div>
  </div>;
}

function CxActRow({ ev, open, full, opObj, onToggle, onOpen, onRestore }) {
  const ty = cxActType(ev);
  const en = ev.entity || {};
  const org = ev.source && ev.source !== 'manual' ? (CX_ACT_ORIGIN[ev.source] || ev.source) + (ev.source === 'importacao' && ev.batch && ev.batch.label ? ' · ' + ev.batch.label : '') : '';
  const proc = en.proc ? cxActMask(en.proc) : '';
  return <div className={'cx-act-row' + (open ? ' open' : '')}>
    <div className="cx-act-rh" role="button" tabIndex={0} aria-expanded={open} onClick={onToggle}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(); } }}>
      <span className="cx-act-tm">{cxActTime(ev.ts)}</span>
      <span className={'cx-act-b t-' + ty}>{CX_ACT_TYPES[ty]}</span>
      <span className="cx-minw0">
        <span className="cx-act-ph">{ev.summary}</span>
        <span className="cx-act-meta">
          {ev.op && ev.op.name ? <span className="cx-act-opc"><span className="cx-dot" style={{ background: opObj ? cxOpColor(opObj) : 'var(--cx-line-strong)' }} />{opObj ? cxOpName(opObj) : ev.op.name}</span> : null}
          {proc ? <CxNumCopy value={proc}><span className="cx-act-proc"><span className="cx-mono">{proc}</span><CxIcon n="copy" s={12} /></span></CxNumCopy> : null}
          {org ? <span className={'cx-act-org' + (ev.source === 'restauracao' ? ' res' : '')}>{org}</span> : null}
          {ev.minor ? <span className="cx-act-min">ajuste menor</span> : null}
          {ev.coalesced > 1 ? <span className="cx-act-min">{ev.coalesced} ajustes juntos</span> : null}
        </span>
      </span>
      <span className="cx-act-chev"><CxIcon n="chevR" s={14} /></span>
    </div>
    {open ? <CxActDetail ev={ev} full={full} onOpen={onOpen} onRestore={onRestore} /> : null}
  </div>;
}

/* Confirmação de restauração: simula antes (previewRestore), mostra o que volta e os conflitos, só então aplica. */
function CxActRestoreModal({ req, activity, onClose, onDone }) {
  const { ev, mode } = req;
  const [st, setSt] = React.useState({ loading: true });
  const [busy, setBusy] = React.useState(false);
  const optsFor = (full, force) => {
    const o = {};
    if (mode === 'field' || mode === 'text') o.only = cxActOnly(full, req.f);
    else if (mode === 'row') o.only = [{ col: req.row.col, id: req.row.id }];
    if (force) o.force = true;
    return o;
  };
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const full = await activity.getFull(ev);
        const r = await activity.previewRestore(full, optsFor(full, false));
        if (!dead) setSt({ full, r });
      } catch (e) { if (!dead) setSt({ error: String((e && e.message) || e) }); }
    })();
    return () => { dead = true; };
  }, []);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  const go = async (force) => {
    setBusy(true);
    try { onDone(await activity.restore(st.full, optsFor(st.full, force))); }
    catch (e) { setSt(s => ({ ...s, error: String((e && e.message) || e) })); setBusy(false); }
  };
  const full = st.full || ev;
  const T = { field: ['Restaurar o valor anterior?', 'Restaurar'], text: ['Restaurar o texto anterior?', 'Restaurar'], event: [ev.action === 'criar' ? 'Desfazer a criação?' : 'Restaurar a alteração inteira?', ev.action === 'criar' ? 'Desfazer criação' : 'Restaurar'],
    recover: ['Recuperar item excluído?', 'Recuperar tudo'], batch: ['Desfazer a importação inteira?', 'Desfazer importação'], row: ['Restaurar este item da importação?', 'Restaurar'] }[mode];
  const casc = ev.cascade && ev.cascade.byType ? Object.keys(ev.cascade.byType).map(k => ev.cascade.byType[k] + ' ' + cxActColName(k, ev.cascade.byType[k])) : [];
  const rev = [];
  if (mode === 'field') rev.push([req.change.label, cxActShown(req.change, 'to') || '(vazio)', cxActShown(req.change, 'from') || '(vazio)']);
  else if (mode === 'text') {
    const tc = (full.textChanges || []).find(x => x.f === req.f) || req.tc;
    rev.push([tc.label, '(texto atual, ' + cxActPlain(tc, 'to').length + ' caracteres)', '(texto anterior, ' + cxActPlain(tc, 'from').length + ' caracteres)']);
  } else if (mode === 'event' && ev.action !== 'criar') {
    (ev.changes || []).forEach(c => rev.push([c.label, cxActShown(c, 'to') || '(vazio)', cxActShown(c, 'from') || '(vazio)']));
    (full.textChanges || ev.textChanges || []).forEach(tc => rev.push([tc.label, '(texto atual)', '(texto anterior, ' + cxActPlain(tc, 'from').length + ' caracteres)']));
  } else if (mode === 'row') rev.push([cxCap(cxActColName(req.row.col, 1)), req.row.label || req.row.id, req.row.op === 'create' ? 'será removido' : req.row.op === 'delete' ? 'será recuperado' : 'volta ao valor anterior']);
  const stats = ev.batch && ev.batch.stats;
  const conf = st.r ? st.r.conflicts : [];
  const nothing = st.r && st.r.applied === 0 && !conf.length;
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <div className="cx cx-act-modal" role="dialog" aria-modal="true" aria-label={T[0]}>
      <div className="cx-act-mh"><h2>{T[0]}</h2><p>{ev.summary}{ev.entity && ev.entity.proc ? ' · ' + cxActMask(ev.entity.proc) : ''}</p></div>
      <div className="cx-act-mb">
        {rev.length ? <div className="cx-act-rev">{rev.map((r, i) => <div className="it" key={i}><span className="k">{r[0]}</span><span><span className="now">{r[1]}</span> &nbsp;→&nbsp; <span className="back">{r[2]}</span></span></div>)}</div> : null}
        {mode === 'recover' ? <div className="cx-act-rev">
          <div className="it"><span className="k">Item principal</span><span className="back">{cxActItemName(ev)}</span></div>
          {casc.map((c, i) => <div className="it" key={i}><span className="k">Vai junto</span><span className="back">{c}</span></div>)}
          {ev.op && ev.op.name ? <div className="it"><span className="k">Operação</span><span>{ev.op.name}</span></div> : null}
        </div> : null}
        {mode === 'batch' ? <div className="cx-act-rev">
          <div className="it"><span className="k">Importação</span><span>{ev.batch.label} · {cxActDmy(ev.day)} às {cxActTime(ev.ts)}</span></div>
          {stats ? <>
            {stats.update ? <div className="it"><span className="k">Alterados</span><span className="back">{stats.update} voltam ao valor anterior</span></div> : null}
            {stats.create ? <div className="it"><span className="k">Novos</span><span className="back">{stats.create} serão removidos</span></div> : null}
            {stats.delete ? <div className="it"><span className="k">Removidos</span><span className="back">{stats.delete} serão recuperados</span></div> : null}
          </> : null}
        </div> : null}
        {st.loading ? <div className="cx-act-mn">Conferindo o que muda…</div> : null}
        {st.error ? <div className="cx-act-mn warn">Não foi possível restaurar: {st.error}</div> : null}
        {st.r && !conf.length && !nothing ? <div className="cx-act-mn">{cxPl(st.r.applied, 'item será atualizado', 'itens serão atualizados')}. A restauração fica registrada como uma nova linha em “Minha atividade” (origem: restauração) e dá para restaurar de novo se mudar de ideia.</div> : null}
        {nothing ? <div className="cx-act-mn">Nada a restaurar: os dados já estão como estavam antes desta alteração.</div> : null}
        {conf.length ? <div className="cx-act-mn warn">Alguns itens foram <b>alterados depois por você</b>, então restaurar sobrescreve o que está lá agora:
          <ul>{conf.slice(0, 8).map((c, i) => <li key={i}>{c.label && cxNorm(c.label).indexOf(cxNorm(cxActColName(c.col, 1))) === 0 ? c.label : cxCap(cxActColName(c.col, 1)) + (c.label ? ' ' + c.label : '')} — {c.motivo}</li>)}</ul>
          {conf.length > 8 ? <div>… e mais {conf.length - 8}.</div> : null}
          {st.r.applied > 0 ? <div style={{ marginTop: 4 }}>{cxPl(st.r.applied, 'item não tem conflito', 'itens não têm conflito')} e pode voltar sem sobrescrever nada.</div> : null}
        </div> : null}
      </div>
      <div className="cx-act-mf">
        <button type="button" className="cx-btn" onClick={onClose}>Cancelar</button>
        {conf.length && st.r.applied > 0 ? <button type="button" className="cx-btn" disabled={busy} onClick={() => go(false)}>Restaurar o que não conflita</button> : null}
        {conf.length ? <button type="button" className="cx-btn primary" disabled={busy} onClick={() => go(true)}><CxIcon n="history" s={14} />Restaurar mesmo assim</button>
          : <button type="button" className="cx-btn primary" disabled={busy || !st.r || nothing} onClick={() => go(false)}><CxIcon n="history" s={14} />{T[1]}</button>}
      </div>
    </div>
  </>;
}

function EditionClaudeAtividade(p) {
  const { activity, data } = p;
  const today = React.useMemo(() => dayKey(new Date()), []);
  const [per, setPer] = React.useState('hoje');
  const [off, setOff] = React.useState(0);
  const [cust, setCust] = React.useState(() => ({ from: addCalendarDays(today, -6), to: today }));
  const [opId, setOpId] = React.useState('');
  const [q, setQ] = React.useState('');
  const [types, setTypes] = React.useState(() => new Set());
  const [minor, setMinor] = React.useState(false);
  const [kpi, setKpi] = React.useState(null);
  const [openIds, setOpenIds] = React.useState(() => new Set());
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [tick, setTick] = React.useState(0);
  const [fulls, setFulls] = React.useState({});
  const [restoreReq, setRestoreReq] = React.useState(null);
  const [menu, setMenu] = React.useState(null); // 'tipo' | 'exp'
  const [exp, setExp] = React.useState(null); // { busy } | { err, csv } | { url, kind }
  const [shown, setShown] = React.useState(200);
  const [pending, setPending] = React.useState(0);
  const wrapRef = React.useRef(null);
  const fetching = React.useRef(new Set());
  const blobs = React.useRef(new WeakMap());
  const range = React.useMemo(() => cxActRange(per, off, cust, today), [per, off, cust, today]);

  React.useEffect(() => {
    let dead = false;
    setLoading(true); setErr('');
    activity.list(range.from, range.to).then(r => {
      if (dead) return;
      setEvents((r || []).slice().sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : a.id < b.id ? 1 : -1)));
      setLoading(false);
    }).catch(e => { if (!dead) { setErr(String((e && e.message) || e)); setLoading(false); } });
    return () => { dead = true; };
  }, [range.from, range.to, tick, activity]);
  React.useEffect(() => { setShown(200); }, [range.from, range.to, opId, q, kpi, minor, types]);
  React.useEffect(() => {
    const gas = typeof activityGas === 'function' && activityGas();
    const read = () => setPending(gas ? activity.pendingCount() : 0);
    read();
    const t = setInterval(read, 4000);
    return () => clearInterval(t);
  }, [activity, tick]);
  React.useEffect(() => {
    if (!menu) return undefined;
    const down = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenu(null); };
    const key = (e) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [menu]);
  // Ao abrir um registro de lista leve com texto cortado, busca o evento completo.
  React.useEffect(() => {
    events.forEach(ev => {
      if (!openIds.has(ev.id) || fulls[ev.id] || fetching.current.has(ev.id)) return;
      if (!(ev.textChanges || []).some(t => t.cut)) return;
      fetching.current.add(ev.id);
      activity.getFull(ev).then(f => setFulls(s => ({ ...s, [ev.id]: f }))).catch(() => setFulls(s => ({ ...s, [ev.id]: 'erro' })));
    });
  }, [openIds, events]);

  const opById = React.useMemo(() => new Map((data.operations || []).map(o => [o.id, o])), [data.operations]);
  const base = React.useMemo(() => events.filter(e => !opId || (e.op && e.op.id === opId)), [events, opId]);
  const nMinor = base.filter(e => e.minor).length;
  const vis = React.useMemo(() => (minor ? base : base.filter(e => !e.minor)), [base, minor]);
  const typeCount = React.useMemo(() => { const m = {}; vis.forEach(e => { const t = cxActType(e); m[t] = (m[t] || 0) + 1; }); return m; }, [vis]);
  const typeKeys = React.useMemo(() => { const s = new Set(base.map(cxActType)); types.forEach(t => s.add(t)); return Object.keys(CX_ACT_TYPES).filter(t => s.has(t)); }, [base, types]);
  const kpiVals = React.useMemo(() => {
    const cda = new Set();
    vis.forEach(e => cxActCdaIds(e).forEach(i => cda.add(i)));
    return CX_ACT_KPIS.map(k => (k[0] === 'cdas' ? cda.size : vis.filter(k[2]).length));
  }, [vis]);
  const filtered = React.useMemo(() => {
    const kp = kpi ? CX_ACT_KPIS.find(k => k[0] === kpi) : null;
    const qs = q.trim();
    const qn = cxNorm(qs);
    const qd = /^[\d.\-/\s]+$/.test(qs) ? qs.replace(/\D/g, '') : '';
    return vis.filter(e => {
      if (types.size && !types.has(cxActType(e))) return false;
      if (kp && !kp[2](e)) return false;
      if (qs) {
        let b = blobs.current.get(e);
        if (!b) { b = { t: cxActBlob(e), d: cxActDigits(e) }; blobs.current.set(e, b); }
        if (!(b.t.includes(qn) || (qd.length >= 4 && b.d.some(x => x.includes(qd))))) return false;
      }
      return true;
    });
  }, [vis, types, kpi, q]);

  const setPeriod = (v) => { setPer(v); setOff(0); };
  const toggleType = (t) => setTypes(s => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const toggleOpen = (id) => setOpenIds(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const reloadSoon = () => { setTick(t => t + 1); setTimeout(() => setTick(t => t + 1), 900); setTimeout(() => setTick(t => t + 1), 2800); };
  const onDone = (res) => {
    setRestoreReq(null);
    cxNotify(res && res.applied > 0 ? 'Restaurado. Nova linha adicionada ao registro.' : 'Nada mudou: já estava como antes.');
    reloadSoon();
  };

  const title = 'Minha atividade — ' + range.label;
  const exportSheet = async () => {
    setMenu(null); setExp({ busy: true });
    const rows = filtered.map(cxActEvRow);
    try {
      const r = await activity.exportSheet({ title, sheets: [{ name: 'Atividade', header: CX_ACT_HEADER, rows, mono: [3] }] });
      setExp({ url: r.url, kind: 'Planilha' });
      try { window.open(r.url, '_blank', 'noopener'); } catch (e) { /* o aviso tem o link */ }
    } catch (e) { setExp({ err: String((e && e.message) || e), kind: 'Planilha' }); }
  };
  const exportDoc = async () => {
    setMenu(null); setExp({ busy: true });
    const blocks = [{ type: 'h1', text: title }, { type: 'p', text: filtered.length + ' registros · gerado em ' + new Date().toLocaleString('pt-BR'), small: true }];
    const byDay = new Map();
    filtered.slice().reverse().forEach(e => { if (!byDay.has(e.day)) byDay.set(e.day, []); byDay.get(e.day).push(e); });
    Array.from(byDay.keys()).sort().forEach(day => {
      const l = cxActDayLabel(day, today);
      blocks.push({ type: 'h2', text: l.sub || l.main });
      blocks.push({ type: 'table', header: ['Hora', 'Operação', 'Processo', 'Tipo', 'Resumo', 'Origem'], mono: [2],
        rows: byDay.get(day).map(e => { const r = cxActEvRow(e); return [r[1], r[2], r[3], r[4], r[6], r[9]]; }) });
    });
    try {
      const r = await activity.exportDoc({ title, blocks });
      setExp({ url: r.url, kind: 'Google Doc' });
      try { window.open(r.url, '_blank', 'noopener'); } catch (e) { /* o aviso tem o link */ }
    } catch (e) { setExp({ err: String((e && e.message) || e), kind: 'Google Doc' }); }
  };
  const downloadCsv = () => { cxActDownload('minha-atividade_' + range.from + '_' + range.to + '.csv', cxActCsv(filtered.map(cxActEvRow))); setExp(null); };

  const list = filtered.slice(0, shown);
  const groups = [];
  list.forEach(e => { const g = groups[groups.length - 1]; if (g && g.day === e.day) g.items.push(e); else groups.push({ day: e.day, items: [e] }); });
  const filtersOn = !!(q.trim() || types.size || kpi);
  const kpiName = kpi ? CX_ACT_KPIS.find(k => k[0] === kpi)[1] : '';

  return <div className="cx cx-page" ref={wrapRef}>
    <div className="cx-page-h">
      <div><h1>Minha atividade</h1><p>Tudo o que você alterou no Nexus, com antes e depois. Dá para conferir e, se precisar, restaurar.</p></div>
      <div className="cx-acts">
        {pending > 0 ? <span className="cx-muted cx-small" title="Ficam guardadas neste aparelho e seguem para o Drive quando houver conexão.">{cxPl(pending, 'alteração aguardando envio', 'alterações aguardando envio')}</span> : null}
        <span className="cx-act-pw">
          <button type="button" className="cx-btn" aria-haspopup="true" aria-expanded={menu === 'exp'} disabled={!filtered.length || (exp && exp.busy)} onClick={() => setMenu(menu === 'exp' ? null : 'exp')}><CxIcon n="upload" s={14} />Exportar período<CxIcon n="chevD" s={12} /></button>
          {menu === 'exp' ? <div className="cx-act-pop r" role="menu">
            <small>{range.label} · {cxPl(filtered.length, 'registro', 'registros')}</small>
            <button type="button" role="menuitem" onClick={exportSheet}><CxIcon n="list" s={14} />Planilha (Google Sheets)</button>
            <button type="button" role="menuitem" onClick={exportDoc}><CxIcon n="file" s={14} />Google Doc</button>
            <hr /><small>Exporta o que está filtrado na tela.</small>
          </div> : null}
        </span>
      </div>
    </div>

    {exp && (exp.busy || exp.url || exp.err) ? <div className="cx-act-note" role="status">
      {exp.busy ? <span>Gerando arquivo…</span> : null}
      {exp.url ? <><span>{exp.kind} criada no seu Drive.</span><a className="cx-act-link" href={exp.url} target="_blank" rel="noopener noreferrer">Abrir {exp.kind === 'Planilha' ? 'a planilha' : 'o documento'}</a></> : null}
      {exp.err ? <><span>{/app publicado/.test(exp.err) ? 'A exportação para o Google só funciona no app publicado (aberto pelo Apps Script).' : 'Não foi possível exportar: ' + exp.err}</span><button type="button" className="cx-btn sm" onClick={downloadCsv}><CxIcon n="upload" s={12} />Baixar CSV</button></> : null}
      {!exp.busy ? <button type="button" className="cx-icon-btn cx-sm" onClick={() => setExp(null)} aria-label="Fechar aviso"><CxIcon n="x" s={12} /></button> : null}
    </div> : null}

    <div className="cx-ks cx-act-ks" style={{ '--n': 5 }}>
      {CX_ACT_KPIS.map((k, i) => <button key={k[0]} type="button" className={'cx-kc click' + (kpi === k[0] ? ' on' : '')} aria-pressed={kpi === k[0]} title={kpi === k[0] ? 'Clique para limpar o filtro' : 'Filtrar a lista por ' + k[1].toLowerCase()} onClick={() => setKpi(kpi === k[0] ? null : k[0])}>
        <span className="cx-kc-l">{k[1]}</span><span className={'cx-kc-v' + (k[0] === 'excluidos' && kpiVals[i] ? ' red' : '')}>{kpiVals[i]}</span>
      </button>)}
    </div>

    <div className="cx-act-fil">
      <div className="cx-act-fr">
        <div className="cx-seg lg" role="group" aria-label="Período">
          {[['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês'], ['custom', 'Período…']].map(x => <button key={x[0]} type="button" className={per === x[0] ? 'on' : ''} onClick={() => setPeriod(x[0])}>{x[1]}</button>)}
        </div>
        {per === 'custom'
          ? <span className="cx-act-dates"><input type="date" className="cx-input" aria-label="De" value={cust.from} max={today} onChange={e => e.target.value && setCust(c => ({ ...c, from: e.target.value }))} />até<input type="date" className="cx-input" aria-label="Até" value={cust.to} max={today} onChange={e => e.target.value && setCust(c => ({ ...c, to: e.target.value }))} /></span>
          : <span className="cx-act-step">
            <button type="button" className="cx-icon-btn" onClick={() => setOff(off - 1)} aria-label="Período anterior"><CxIcon n="chevL" s={14} /></button>
            <span className="cx-act-lbl">{range.label}</span>
            <button type="button" className="cx-icon-btn" disabled={off >= 0} onClick={() => setOff(off + 1)} aria-label="Próximo período"><CxIcon n="chevR" s={14} /></button>
          </span>}
        <CxSelect value={opId} onChange={setOpId} label="Operação" options={[['', 'Todas as operações']].concat((data.operations || []).slice().sort(sortOpsByName).map(o => [o.id, cxOpName(o)]))} />
        <label className="cx-field"><CxIcon n="search" s={14} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar: nº do processo (com ou sem máscara), CDA, texto…" autoComplete="off" aria-label="Buscar na atividade" />
          {q ? <button type="button" className="cx-icon-btn cx-sm" onClick={() => setQ('')} aria-label="Limpar busca"><CxIcon n="x" s={12} /></button> : null}</label>
      </div>
      <div className="cx-act-fr">
        <span className="cx-act-pw">
          <button type="button" className="cx-btn" aria-haspopup="true" aria-expanded={menu === 'tipo'} onClick={() => setMenu(menu === 'tipo' ? null : 'tipo')}><CxIcon n="filter" s={13} />Tipo{types.size ? <span className="cx-act-tcount">{types.size}</span> : null}<CxIcon n="chevD" s={12} /></button>
          {menu === 'tipo' ? <div className="cx-act-pop" role="group" aria-label="Filtrar por tipo">
            {typeKeys.map(t => <label key={t}><input type="checkbox" checked={types.has(t)} onChange={() => toggleType(t)} />{CX_ACT_TYPES[t]}<em>{typeCount[t] || 0}</em></label>)}
            {!typeKeys.length ? <small>Nenhum tipo neste período.</small> : null}
            {types.size ? <><hr /><button type="button" onClick={() => setTypes(new Set())}>Limpar seleção</button></> : null}
          </div> : null}
        </span>
        {types.size ? <span className="cx-muted cx-small">{Array.from(types).map(t => CX_ACT_TYPES[t]).join(', ')}</span> : null}
        <span className="cx-sp" />
        <label className="cx-act-tog"><input type="checkbox" checked={minor} onChange={e => setMinor(e.target.checked)} /><span className="tr" />Mostrar também ajustes menores {nMinor ? <em>({minor ? nMinor + ' incluídos' : nMinor + ' ocultos'})</em> : null}</label>
      </div>
    </div>

    {loading && !events.length ? <div className="cx-act-list"><div className="cx-act-empty">Carregando o registro…</div></div>
      : err ? <div className="cx-act-list"><div className="cx-act-empty">Não foi possível carregar o registro: {err}<div style={{ marginTop: 10 }}><button type="button" className="cx-btn sm" onClick={() => setTick(t => t + 1)}>Tentar de novo</button></div></div></div>
      : !filtered.length ? <div className="cx-act-list"><div className="cx-act-empty">{filtersOn ? 'Nenhum registro com esses filtros.' : !vis.length && nMinor ? 'Só há ajustes menores neste período (' + nMinor + ' ocultos).' : 'Nada registrado neste período.'}</div></div>
      : groups.map(g => { const l = cxActDayLabel(g.day, today); return <div key={g.day}>
        <div className="cx-act-day">{l.main}{l.sub ? <span>{l.sub}</span> : null}</div>
        <div className="cx-act-list">{g.items.map(e => <CxActRow key={e.id} ev={e} open={openIds.has(e.id)} full={fulls[e.id]} opObj={e.op ? opById.get(e.op.id) : null}
          onToggle={() => toggleOpen(e.id)} onOpen={p.onOpenEntity} onRestore={setRestoreReq} />)}</div>
      </div>; })}
    {filtered.length > shown ? <div className="cx-act-more"><button type="button" className="cx-btn sm" onClick={() => setShown(shown + 200)}>Mostrar mais ({filtered.length - shown})</button></div> : null}

    <div className="cx-act-foot">
      <span>{cxPl(filtered.length, 'registro', 'registros')}{minor ? ' (inclui ajustes menores)' : ' relevantes'}{kpi ? ' · filtrando por ' + kpiName.toLowerCase() : ''}{kpi ? <> · <button type="button" className="cx-link-btn" onClick={() => setKpi(null)}>limpar</button></> : null}</span>
      <span>O registro é automático. Restaurar nunca apaga o histórico: gera uma nova linha.</span>
    </div>
    {restoreReq ? <CxActRestoreModal req={restoreReq} activity={activity} onClose={() => setRestoreReq(null)} onDone={onDone} /> : null}
  </div>;
}
