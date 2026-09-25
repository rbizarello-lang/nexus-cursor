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
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  chevU: '<path d="m18 15-6-6-6 6"/>',
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
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M3 21v-5h5M21 3v5h-5"/>',
};
function CxIcon({ n, s = 16, className = '', style }) {
  return <svg className={'cx-i ' + className} width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" style={style} dangerouslySetInnerHTML={{ __html: CX_ICONS[n] || '' }} />;
}

/* ─── Helpers de leitura (não gravam nada) ─── */
const CX_DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const CX_DOW_L = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const CX_MES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const CX_ST_ORDER = ['pendente_analise', 'aguardando_subsidios', 'peca_edicao', 'analisado'];
const CX_ST = {
  pendente_analise: { l: 'Pendente de análise', c: 'var(--cx-yellow)' },
  aguardando_subsidios: { l: 'Aguardando subsídios', c: 'var(--cx-ink-3)' },
  peca_edicao: { l: 'Peça em edição', c: 'var(--cx-blue)' },
  peca_pronta: { l: 'Peça pronta', c: 'var(--cx-green)' },
  analisado: { l: 'Analisado', c: 'var(--cx-green)' },
};
const CX_IMP = { alta: 'Alta', normal: 'Média', baixa: 'Baixa' };
const CX_DIF = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const CX_HEARING = { instrucao: 'Audiência de instrução', conciliacao: 'Audiência de conciliação', una: 'Audiência una', justificacao: 'Audiência de justificação', inquiricao: 'Inquirição', outra: 'Audiência' };
const CX_OP_COLORS = ['var(--cx-op1)', 'var(--cx-op2)', 'var(--cx-op3)', 'var(--cx-op4)', 'var(--cx-op5)', 'var(--cx-op6)'];
const CX_OP_TABS = [['notas', 'Briefing'], ['prescricao_v2', 'Processos e prescrição'], ['dividas', 'Inscrições'], ['pessoas', 'Partes e bens'], ['tarefas', 'Tarefas'], ['docs', 'Arquivos'], ['importar', 'Importar']];
/* "Partes e bens" é uma aba só, com seletor interno; por baixo continuam as abas 'pessoas' e 'bens' do app. */
function cxTabOn(activeTab, key) { return key === 'pessoas' ? (activeTab === 'pessoas' || activeTab === 'bens') : activeTab === key; }

function cxOpColor(id) {
  let h = 0;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CX_OP_COLORS[h % CX_OP_COLORS.length];
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
function cxEprocUrl(num) { return 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&num_processo=' + String(num || '').replace(/[.\-]/g, ''); }

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

/* ─── Peças visuais ─── */
function CxStatusIcon({ s }) {
  const c = (CX_ST[s] || CX_ST.pendente_analise).c;
  let inner;
  if (s === 'analisado') inner = '<circle cx="7" cy="7" r="6" style="fill:' + c + '"/><path d="M4.4 7.2 6.2 9l3.4-3.6" style="fill:none;stroke:var(--cx-surface);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round"/>';
  else if (s === 'peca_edicao') inner = '<circle cx="7" cy="7" r="5.4" style="fill:none;stroke:' + c + ';stroke-width:1.5"/><path d="M7 3.4a3.6 3.6 0 0 1 0 7.2z" style="fill:' + c + '"/>';
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
  const inner = <><span className="cx-op-sq" style={{ background: cxOpColor(op.id) }} /><span className="cx-ell">{cxOpName(op)}</span></>;
  if (!onOpen) return <span className="cx-op-tag" title={op.name}>{inner}</span>;
  return <button type="button" className="cx-op-tag cx-link" onClick={e => { e.stopPropagation(); onOpen(op.id); }} title={'Abrir ' + op.name}>{inner}</button>;
}
function CxSeg({ value, onChange, options, label, className = '' }) {
  return <div className={'cx-seg ' + className} role="group" aria-label={label}>
    {options.map(o => <button key={o[0]} type="button" className={value === o[0] ? 'on' : ''} aria-pressed={value === o[0]} onClick={() => onChange(o[0])}>
      {o[2] ? <CxIcon n={o[2]} s={13} /> : null}{o[1]}{o[3] != null ? <span className="cx-n">{o[3]}</span> : null}
    </button>)}
  </div>;
}
function CxSelect({ id, pre, value, onChange, options, label }) {
  return <label className="cx-sel">
    {pre ? <span className="cx-pre">{pre}</span> : null}
    <select id={id} value={value} onChange={e => onChange(e.target.value)} aria-label={label || pre} style={pre ? { paddingLeft: (pre.length * 7 + 20) + 'px' } : null}>
      {options.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
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
  const ops = (data.operations || []).slice().sort(sortOpsByName);
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
  const item = (vm, icon, label, extra, onClick) => {
    const on = viewMode === vm;
    return <button key={vm} type="button" className={'cx-nav-item' + (on ? ' on' : '')} aria-current={on ? 'page' : undefined} onClick={onClick || (() => p.onNav(vm))}>
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
        <span className="cx-op-sq" style={{ background: cxOpColor(o.id) }} />
        <span className="cx-lbl" title={o.name}>{cxOpName(o)}</span>
        {m.overdueIntims > 0 ? <span className="cx-dot" style={{ background: 'var(--cx-red)' }} title={cxPl(m.overdueIntims, 'intimação vencida', 'intimações vencidas')} />
          : m.alerts > 0 ? <span className="cx-dot" style={{ background: 'var(--cx-violet)' }} title={cxPl(m.alerts, 'CDA com prazo extintivo urgente', 'CDAs com prazo extintivo urgente')} /> : null}
      </div>
      {open ? <div className="cx-nav-sub">
        <button type="button" className={'cx-nav-item' + (onOp && activeTab === 'visao' ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, 'visao')}><span className="cx-lbl">Visão geral</span></button>
        {CX_OP_TABS.map(t => <button key={t[0]} type="button" className={'cx-nav-item' + (onOp && cxTabOn(activeTab, t[0]) ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, t[0] === 'pessoas' && onOp && activeTab === 'bens' ? 'bens' : t[0])}><span className="cx-lbl">{t[1]}</span></button>)}
      </div> : null}
    </div>;
  };
  return <aside className="cx cx-side" aria-label="Navegação">
    <div className="cx-side-head">
      <button type="button" className="cx-brand" onClick={() => p.onNav('hoje')} title="Nexus Prumo · início">
        <span className="cx-brand-mark">N</span>
        <span className="cx-ell"><span className="cx-brand-name">NEXUS</span><span className="cx-brand-sub">Prumo · {NEXUS_VERSION}</span></span>
      </button>
      <button type="button" className="cx-icon-btn" onClick={p.onSearch} title="Buscar (Ctrl+K)" aria-label="Buscar"><CxIcon n="search" /></button>
      <button type="button" className="cx-icon-btn cx-side-close" onClick={p.onClose} aria-label="Fechar menu"><CxIcon n="x" /></button>
    </div>
    <div className="cx-side-scroll">
      <nav className="cx-nav">
        {item('hoje', 'home', 'Hoje')}
        {item('intimacoes', 'inbox', 'Intimações', counts.openIntims ? <span className={'cx-badge' + (counts.lateIntims ? ' red' : '')} title={counts.lateIntims ? cxPl(counts.lateIntims, 'vencida', 'vencidas') : undefined}>{counts.openIntims}</span> : null)}
        {item('tarefas_global', 'check', 'Tarefas', counts.openTasks ? <span className="cx-count">{counts.openTasks}</span> : null)}
        {item('mesa', 'desk', 'Mesa', counts.desk ? <span className="cx-count">{counts.desk}</span> : null)}
        <button type="button" className="cx-nav-item" onClick={p.onSearch}><CxIcon n="search" /><span className="cx-lbl">Buscar</span><kbd className="cx-kbd">/</kbd></button>
      </nav>
      <div className="cx-nav-sec"><span>Trabalho</span></div>
      <nav className="cx-nav">
        {item('operacoes', 'briefcase', 'Carteira', <span className="cx-count">{totalActive}</span>)}
        {item('prazos', 'hourglass', 'Prazos extintivos', counts.presc1 ? <span className="cx-badge red">{counts.presc1}</span> : null)}
        {item('cx_timeline', 'timeline', 'Linha do tempo')}
        {item('audiencias', 'calendar', 'Agenda', counts.hearings ? <span className="cx-count">{counts.hearings}</span> : null)}
        {item('acompanhar', 'eye', 'Acompanhar', counts.watch ? <span className="cx-count">{counts.watch}</span> : null)}
        {item('modelos', 'book', 'Biblioteca', counts.models ? <span className="cx-count">{counts.models}</span> : null)}
        {item('painel', 'chart', 'Painel')}
        <button type="button" className="cx-nav-item" onClick={p.onImportEproc}><CxIcon n="upload" /><span className="cx-lbl">Importar eproc</span></button>
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
        {active.length === 0 && !(cls === 'encerrada' && closed.length) ? <div className="cx-side-empty">{!ops.length ? 'Crie sua primeira operação.' : q ? 'Nenhuma operação com esse nome' + (cls !== 'all' ? ' neste filtro.' : '.') : 'Nenhuma operação neste filtro.'}</div> : null}
        {closed.length && cls !== 'encerrada' ? <button type="button" className="cx-nav-item cx-nav-closed" onClick={() => setShowClosed(v => !v)}><span className="cx-chev" style={{ transform: showClosed ? 'rotate(90deg)' : 'none' }}><CxIcon n="chevR" s={12} /></span><span className="cx-lbl">Encerradas</span><span className="cx-count">{closed.length}</span></button> : null}
        {closedOpen ? closed.map(renderOp) : null}
      </nav>
    </div>
    <div className="cx-side-foot">
      <span>Nexus Prumo</span>
      <button type="button" className="cx-link-btn" onClick={p.onSwitchClassic} title="Voltar à edição clássica">Voltar ao Clássico</button>
    </div>
  </aside>;
}

/* ═════════════════════ Barra superior ═════════════════════ */
function EditionClaudeTopbar(p) {
  const s = p.sync || {};
  const syncTxt = s.status === 'syncing' ? 'Sincronizando…' : s.status === 'error' ? 'Erro na sincronização' : s.lastSync ? 'Planilha · ' + s.lastSync : 'Planilha';
  const syncColor = s.status === 'error' ? 'var(--cx-red)' : s.status === 'syncing' ? 'var(--cx-yellow)' : s.status === 'connected' ? 'var(--cx-green)' : 'var(--cx-ink-3)';
  return <header className="cx cx-top">
    <button type="button" className="cx-icon-btn cx-menu-btn" onClick={p.onMenu} aria-label="Abrir menu"><CxIcon n="menu" /></button>
    <div className="cx-crumb">
      <span>NEXUS</span>
      {p.crumbs.map((c, k) => <React.Fragment key={k}><span className="cx-sep">/</span>{k === p.crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}</React.Fragment>)}
    </div>
    <div className="cx-top-r">
      {s.isGAS ? <button type="button" className="cx-sync" onClick={s.onPush} title={(s.msg ? s.msg + ' · ' : '') + 'Clique para salvar na Planilha agora'}><span className="cx-dot" style={{ background: syncColor }} />{syncTxt}</button> : null}
      <button type="button" className="cx-search" onClick={p.onSearch} aria-label="Buscar"><CxIcon n="search" s={14} /><span className="cx-t">Buscar processo, CDA…</span><kbd className="cx-kbd">Ctrl K</kbd></button>
      <button type="button" className="cx-btn primary" onClick={p.onNewIntim} title="Nova intimação"><CxIcon n="plus" s={14} /><span className="cx-lbl">Nova intimação</span></button>
      <div className="cx-settings-anchor">
        <button type="button" className="cx-icon-btn" onClick={p.onToggleSettings} title="Ajustes" aria-label="Ajustes"><CxIcon n="settings" /></button>
        {p.settingsPanel}
      </div>
    </div>
  </header>;
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
      if (dd !== null && dd >= -7) q.push({ key: 'i' + x.id, kind: 'Intimação', ic: 'inbox', title: cxPartyName(x), sub: x.eventDescription || x.className || '', opId: x.operationId, doneIso: at, doneAt: dd, intim: x });
      return;
    }
    if (x.status === 'analisado' || !x.dateDeadline) return;
    q.push({ key: 'i' + x.id, kind: 'Intimação', ic: 'inbox', title: cxPartyName(x), sub: x.eventDescription || x.className || '', opId: x.operationId, iso: x.dateDeadline, due: daysUntil(x.dateDeadline), st: x.status, intim: x });
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
function EditionClaudeHoje(p) {
  const { data, prazosRadar, prazosByDebt, opsById } = p;
  const [tab, setTab] = React.useState('proximos');
  const queue = React.useMemo(() => cxBuildQueue(data, prazosByDebt, opsById), [data, prazosByDebt, opsById]);
  const continueQueue = React.useMemo(() => cxContinueQueue(data), [data]);
  const intims = data.intimations || [];
  const open = intims.filter(cxIsOpen);
  const tribCounts = cxTribCounts(intims);
  const late = open.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d < 0; });
  const today = open.filter(x => daysUntil(x.dateDeadline) === 0);
  const next5 = open.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d >= 0 && d <= 5; });
  const t = prazosRadar.totals || {};
  const n1 = (t[1] && t[1].n) || 0;
  const riskVal = ((t[1] && t[1].value) || 0) + ((t[2] && t[2].value) || 0);
  const activeOps = (data.operations || []).filter(o => o.status !== 'encerrada');
  const activeDebts = (data.debts || []).filter(d => d.status !== 'extinta');
  const debtTotal = activeDebts.reduce((s, d) => s + (d.value || 0), 0);
  const guarTotal = activeDebts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  const gpct = debtTotal > 0 ? Math.round(guarTotal / debtTotal * 100) : 0;

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
    const nx = open.filter(x => x.operationId === o.id && x.dateDeadline).sort(cxByDeadline)[0];
    const targets = (data.people || []).filter(pp => pp.operationId === o.id && pp.operationRole === 'alvo');
    const cls = getOpClassifications(o)[0];
    return { o, total, guar, nx, targets, cls };
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
      {n1 ? <>. {n1 === 1 ? '1 CDA está' : n1 + ' CDAs estão'} no grupo urgente de prescrição</> : null}.
    </p>

    <div className="cx-kpis">
      <div className="cx-kpi" role="button" tabIndex={0} onClick={() => p.onNav('intimacoes')} onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onNav('intimacoes'); } }}>
        <span className="cx-kpi-l"><CxIcon n="inbox" s={14} />Intimações abertas</span>
        <span className="cx-kpi-v">{open.length}</span>
        <span className={'cx-kpi-s' + (late.length ? ' red' : '')}>{cxPl(late.length, 'vencida', 'vencidas')} · {today.length} hoje</span>
        {tribCounts.length ? <span className="cx-kpi-uf">{tribCounts.map(([j, v]) => <button key={j} type="button" className="cx-kpi-uf-i" onClick={e => { e.stopPropagation(); p.onOpenIntimUf(j); }}>{j} {v.total}</button>)}</span> : null}
        <span className="cx-spark" title="Intimações recebidas por dia útil (data de envio), últimos 14 dias úteis" aria-hidden="true">{intake.map((v, k) => <i key={k} className={k === intake.length - 1 ? 'last' : ''} style={{ height: Math.max(4, v / intakeMax * 100) + '%' }} />)}</span>
      </div>
      <button type="button" className="cx-kpi" onClick={() => p.onNav('intimacoes')}>
        <span className="cx-kpi-l"><CxIcon n="clock" s={14} />Vencem em 5 dias</span>
        <span className="cx-kpi-v">{next5.length}</span>
        <span className="cx-kpi-s orange">{next5.filter(x => intimImpKey(x) === 'alta').length} de importância alta</span>
      </button>
      <button type="button" className="cx-kpi" onClick={() => p.openPrazos(1)}>
        <span className="cx-kpi-l"><CxIcon n="hourglass" s={14} />Prazos extintivos</span>
        <span className="cx-kpi-v">{n1}<small>urgentes</small></span>
        <span className="cx-kpi-s violet">{riskVal ? cxMoneyShort(riskVal) + ' em risco' : 'Situação controlada'}</span>
      </button>
      <button type="button" className="cx-kpi" onClick={() => p.onNav('operacoes')}>
        <span className="cx-kpi-l"><CxIcon n="briefcase" s={14} />Crédito sob gestão</span>
        <span className="cx-kpi-v">{cxMoneyShort(debtTotal)}</span>
        <span className="cx-meter" title={gpct + '% garantido'}><i style={{ width: gpct + '%' }} /></span>
        <span className="cx-kpi-s">{gpct}% garantido · {cxPl(activeOps.length, 'operação', 'operações')}</span>
      </button>
    </div>

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
              <CxSeg label="Filtro da fila" value={tab} onChange={setTab} options={[['proximos', 'Próximos', null, lists.proximos.length], ['vencidos', 'Vencidos', null, lists.vencidos.length], ['feitos', 'Feitos', null, lists.feitos.length]]} />
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

        <section className="cx-card" aria-labelledby="cx-h-cart">
          <div className="cx-card-h"><h2 id="cx-h-cart">Carteira</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={() => p.onNav('operacoes')}>Todas as operações<CxIcon n="chevR" s={13} /></button></div></div>
          {carteira.length ? <div className="cx-tbl-wrap"><table className="cx-tbl">
            <thead><tr><th>Operação</th><th>Classificação</th><th>Garantido</th><th className="num">Dívida</th><th>Próximo prazo</th><th>Alvos</th></tr></thead>
            <tbody>{carteira.slice(0, 8).map(r => {
              const pct = r.total > 0 ? Math.round(r.guar / r.total * 100) : 0;
              const cls = r.cls ? OP_CLASSIFICATIONS[r.cls] : null;
              return <tr key={r.o.id} className="click" onClick={() => p.onOpenOp(r.o.id)}>
                <td><span className="cx-op-cell" title={r.o.name}><span className="cx-op-sq" style={{ background: cxOpColor(r.o.id) }} /><span className="cx-ell">{cxOpName(r.o)}</span></span></td>
                <td>{cls ? <span className="cx-pill"><span className="cx-dot" style={{ background: cls.color }} />{cls.label}</span> : <span className="cx-muted">—</span>}</td>
                <td><span className="cx-cover"><span className="cx-bar"><i style={{ width: pct + '%' }} /></span><span className="cx-pct">{pct}%</span></span></td>
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

        <section className="cx-card" aria-labelledby="cx-h-prox">
          <div className="cx-card-h"><h2 id="cx-h-prox">Próximos prazos</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={() => p.onNav('audiencias')}><CxIcon n="calendar" s={13} />Agenda</button></div></div>
          {upcoming.length === 0 ? <div className="cx-empty-row">Nada nos próximos 7 dias.</div> : buckets.map(b => b[1].length ? <div key={b[0]}>
            <div className="cx-dl-h"><b>{b[0]}</b><span>{b[1].length}</span></div>
            {b[1].slice(0, 6).map(x => <button key={x.key} type="button" className="cx-dl-item" onClick={() => openItem(x)}>
              <span className="cx-op-sq" style={{ background: x.opId ? cxOpColor(x.opId) : 'var(--cx-line-strong)' }} />
              <span className="cx-t">{x.intim ? (x.sub || x.title) : x.title}</span>
              {x.intim ? <CxImp intim={x.intim} /> : x.prio ? <CxPrio v={x.prio} /> : <CxIcon n={x.ic} s={13} className="cx-muted" />}
              {b[0] === 'Próximos 7 dias' ? <span className="cx-due later cx-dl-dow">{cxCap(CX_DOW[(cxDate(x.iso) || new Date()).getDay()])}</span> : null}
            </button>)}
            {b[1].length > 6 ? <div className="cx-more">+{b[1].length - 6} mais</div> : null}
          </div> : null)}
          <div style={{ height: 6 }} />
        </section>

        <section className="cx-card" aria-labelledby="cx-h-act">
          <div className="cx-card-h"><h2 id="cx-h-act">Atividade recente</h2><div className="cx-aside">{lastImport ? <span className="cx-muted cx-small" title={'Último import: ' + new Date(lastImport.timestamp).toLocaleString('pt-BR')}>Import {cxRelTime(lastImport.timestamp)}</span> : null}</div></div>
          {activity.length ? activity.map(a => <div key={a.id} className="cx-act">
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
    groups = ids.map(id => { const op = opsById.get(id); return { key: 'op' + id, label: op ? cxOpName(op) : 'Sem operação', sortKey: op ? cxOpName(op) : '\uffff', icon: op ? <span className="cx-op-sq" style={{ background: cxOpColor(op.id) }} /> : dot('var(--cx-line-strong)'), items: open.filter(x => (x.operationId || '') === id) }; })
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
function CxIntimRow({ intim, op, sel, onOpen, onOpenOp }) {
  const notes = cxNotes(intim);
  const resolved = !!intim.responseAction;
  const done = resolved || intim.status === 'analisado';
  const urgent = intimIsUrgent(intim) && !done;
  const ra = intim.responseAction;
  return <div className={'cx-i-row' + (urgent ? ' urgent' : '') + (sel ? ' sel' : '') + (done ? ' done' : '')} role="button" tabIndex={0}
    onClick={() => onOpen(intim.id)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(intim.id); } }}>
    <CxStatusIcon s={resolved ? 'analisado' : intim.status} />
    <div className="cx-i-main">
      <div className="cx-i-party">
        {urgent ? <span className="cx-urg">URGENTE</span> : null}
        <span className="cx-ell">{cxPartyName(intim)}</span>
        {intim._importFlag === 'new' ? <span className="cx-tag blue">Novo</span> : intim._importFlag === 'updated' ? <span className="cx-tag">Atualizada</span> : null}
        {intim.hasPending ? <span className="cx-flag" title="Pendência marcada"><CxIcon n="flag" s={11} /></span> : null}
      </div>
      <div className="cx-i-ev">{intim.eventDescription || intim.className || '—'}</div>
      {resolved ? <div className="cx-i-note"><CxIcon n="send" s={12} /><span className="cx-ell">{ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida'}{ra.description ? ' · ' + ra.description : ''}</span></div>
        : notes[0] ? <div className="cx-i-note" title={notes.join('\n')}><CxIcon n="note" s={12} /><span className="cx-ell">{notes[notes.length - 1]}</span>{notes.length > 1 ? <span className="cx-mono">+{notes.length - 1}</span> : null}</div> : null}
      <CxEstLine esteira={intim.esteira} />
      <div className="cx-i-sub"><CxProc num={intim.processNumber} uf={intim.jurisdiction} /><CxOpTag op={op} /><CxImp intim={intim} /><CxDif intim={intim} /></div>
    </div>
    <div className="cx-c-proc"><CxProc num={intim.processNumber} uf={intim.jurisdiction} /><span className="cx-cls">{intim.className || '—'}</span></div>
    <div className="cx-c-op"><CxOpTag op={op} onOpen={onOpenOp} /></div>
    <div className="cx-c-imp"><CxImp intim={intim} /></div>
    <div className="cx-c-dif"><CxDif intim={intim} /></div>
    <div className="cx-c-due">
      {resolved ? <CxDue doneIso={ra.respondedAt || ''} /> : <CxDue iso={intim.dateDeadline} />}
      <span className="cx-sub">{resolved ? 'atuação registrada' : intim.dateDeadline ? 'final ' + cxDM(intim.dateDeadline) : 'prazo fechado'}</span>
    </div>
  </div>;
}
function CxIntimList({ items, groups, sort, onOpen, onOpenOp, selId, opsById, emptyText }) {
  const [closed, setClosed] = React.useState({});
  if (!groups.length) return <div className="cx-list"><div className="cx-empty-row" style={{ borderTop: 0 }}>{emptyText || 'Nenhuma intimação com esses filtros.'}</div></div>;
  return <div className="cx-list">
    <div className="cx-list-h"><span /><span>Parte · evento · notas</span><span>Processo</span><span className="cx-h-op">Operação</span><span title="Importância">Imp.</span><span title="Complexidade">Compl.</span><span className="r">Prazo</span></div>
    {groups.map(g => {
      const isClosed = closed[g.key] != null ? closed[g.key] : !!g.closedDefault;
      const sorted = g.items.slice().sort(cxSortFn(sort));
      return <React.Fragment key={g.key}>
        <button type="button" className={'cx-grp' + (isClosed ? ' closed' : '')} aria-expanded={!isClosed} onClick={() => setClosed(c => ({ ...c, [g.key]: !isClosed }))}>
          <span className="cx-caret"><CxIcon n="chevD" s={14} /></span>{g.icon}<span>{g.label}</span><span className="cx-n">{g.items.length}</span>{g.sub ? <span className="cx-grp-sub">· {g.sub}</span> : null}
        </button>
        {isClosed ? null : sorted.map(x => <CxIntimRow key={x.id} intim={x} op={opsById.get(x.operationId)} sel={selId === x.id} onOpen={onOpen} onOpenOp={onOpenOp} />)}
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
          <span className="cx-b-row"><CxOpTag op={opsById.get(x.operationId)} /><CxDue iso={x.dateDeadline} /></span>
          <span className="cx-b-row" style={{ fontWeight: 500 }}>{intimIsUrgent(x) && !done ? <span className="cx-urg">URGENTE</span> : null}<span className="cx-ell">{cxPartyName(x)}</span></span>
          <span className="cx-b-ev">{x.eventDescription || x.className || '—'}</span>
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
        <CxSeg className="lg" label="Visualização" value={view} onChange={setView} options={[['lista', 'Lista', 'list'], ['quadro', 'Quadro', 'board'], ['foco', 'Foco', 'zap']]} />
      </div>
    </div>
    {view === 'foco' ? <EditionClaudeFocus {...p} /> : <>
      <div className="cx-toolbar">
        <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-f-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Parte, processo, evento ou nota" aria-label="Filtrar intimações" /></label>
        <CxSelect id="cx-f-op" pre="Operação" value={opF} onChange={setOpF} options={opOptions} label="Filtrar por operação" />
        {view === 'lista' ? <CxSeg label="Ativas ou resolvidas" value={scope} onChange={setScope} options={[['ativas', 'Ativas'], ['resolvidas', 'Resolvidas', null, resolvedCount]]} /> : null}
        <span className="cx-sp" />
        {view === 'lista' && scope === 'ativas' ? <CxSelect id="cx-f-g" pre="Agrupar" value={groupBy} onChange={setGroupBy} options={[['prazo', 'Prazo'], ['situacao', 'Situação'], ['operacao', 'Operação'], ['uf', 'UF'], ['etapa', 'Etapa']]} /> : null}
        <CxSelect id="cx-f-s" pre="Ordenar" value={sort} onChange={setSort} options={[['atencao', 'Atenção'], ['prazo', 'Prazo final'], ['importancia', 'Importância'], ['complexidade', 'Complexidade']]} />
      </div>
      {view === 'quadro'
        ? <CxBoard items={filtered.filter(cxIsActive)} sort={sort} onOpen={p.onOpenIntim} opsById={opsById} onSetStatus={(id, s) => { const x = all.find(i => i.id === id); if (x && x.status !== s) { p.upsert('intimations', { ...x, status: s }); cxNotify('Situação: ' + CX_ST[s].l); } }} />
        : <CxIntimList items={filtered} groups={groups} sort={sort} onOpen={p.onOpenIntim} onOpenOp={p.onOpenOp} selId={p.drawerId} opsById={opsById} emptyText={all.length ? null : 'Nenhuma intimação ainda. Importe o XLS do eproc para começar.'} />}
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
  return <div className="cx-pl">
    {items.length ? items.map(it => <div key={it.key} className="cx-pl-row">
      <span className="cx-pl-ic">{(it.label || '?').trim().slice(0, 2).toUpperCase()}</span>
      <div className="cx-minw0"><div className="cx-ell">{it.label}</div><div className="cx-muted cx-small">{it.origin}</div></div>
      {it.custom ? <button type="button" className="cx-icon-btn cx-sm" onClick={() => remove(it.idx)} title="Remover" aria-label="Remover link"><CxIcon n="x" s={12} /></button> : null}
      <a className="cx-a cx-small" href={it.url} target="_blank" rel="noopener noreferrer">Abrir<CxIcon n="arrowUR" s={11} /></a>
    </div>) : <div className="cx-muted cx-small">Nenhum link ainda.</div>}
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
function CxBlock({ title, summary, count, open, onToggle, children }) {
  return <div className="cx-blk">
    <button type="button" className="cx-blk-h" aria-expanded={open} onClick={onToggle}>
      <span className="cx-blk-chev"><CxIcon n={open ? 'chevD' : 'chevR'} s={13} /></span>
      <span className="cx-blk-t">{title}</span>
      {!open ? <span className="cx-blk-s cx-ell">{summary}</span> : <span className="cx-sp" />}
      {count != null ? <span className="cx-blk-n">{count}</span> : null}
    </button>
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
  const isPet = type === 'peticionamento';
  const canSave = isPet ? !!peticionUrl.trim() : !!description.trim();
  return <form className="cx-form" onSubmit={e => { e.preventDefault(); if (canSave) onSave({ type, description, peticionType, peticionUrl, docUrl }); }}>
    <h3>Registrar atuação</h3>
    <CxSeg label="Tipo de atuação" value={type} onChange={setType} options={[['peticionamento', 'Peticionamento'], ['ciencia', 'Ciência'], ['outra', 'Outra medida']]} />
    {isPet ? <div className="cx-row2">
      <label>Tipo de peça<select id={'cx-r-piece-' + intim.id} className="cx-input" value={peticionType} onChange={e => setPeticionType(e.target.value)}>{PETITION_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Link da peça (Docs ou arquivo) *<input id={'cx-r-url-' + intim.id} className="cx-input" value={peticionUrl} onChange={e => setPeticionUrl(e.target.value)} placeholder="https://docs.google.com/…" autoFocus /></label>
    </div> : <label>Link do documento (opcional)<input id={'cx-r-doc-' + intim.id} className="cx-input" value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://docs.google.com/…" /></label>}
    <label>{isPet ? 'Observações (opcional)' : type === 'ciencia' ? 'Qual decisão ou despacho foi objeto da ciência *' : 'Descrição da medida adotada *'}
      <textarea id={'cx-r-desc-' + intim.id} className="cx-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} autoFocus={!isPet} placeholder={isPet ? 'Ex.: manifestação pedindo mandado de penhora' : 'Ex.: ciência da decisão do evento 52, sem necessidade de manifestação'} />
    </label>
    <div className="cx-form-note">A intimação será arquivada em Resoluções, como no Clássico. {isPet || docUrl.trim() ? 'O link vai para a aba Arquivos da operação.' : ''}</div>
    {isPet && !canSave ? <div className="cx-form-warn">Informe o link da peça para registrar. Sem o link definitivo, cole uma referência provisória (ex.: “pendente upload”) e edite depois.</div> : null}
    <div className="cx-form-acts"><button type="button" className="cx-btn ghost" onClick={onCancel}>Cancelar</button><button type="submit" className="cx-btn primary" disabled={!canSave}><CxIcon n="tick" s={14} />Registrar e arquivar</button></div>
  </form>;
}
function CxIntimDetail({ intim, a, showRespond, setShowRespond }) {
  const { data, opsById, prazosByDebt } = a;
  const op = opsById.get(intim.operationId);
  const notes = cxNotes(intim);
  const [nt, setNt] = React.useState('');
  const [blocks, setBlocks] = React.useState(cxLoadDrawerBlocks);
  const toggleBlock = (key) => setBlocks(prev => { const next = { ...prev, [key]: !prev[key] }; cxSaveDrawerBlocks(next); return next; });
  const setAllBlocks = (open) => setBlocks(() => { const next = {}; Object.keys(CX_BLK_DEFAULTS).forEach(k => { next[k] = open; }); cxSaveDrawerBlocks(next); return next; });
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
  const pecas = cxPecasList(intim, data);
  const resume = esteiraResumeInfo(intim.esteira);
  const estSummary = esteiraSummary(intim.esteira);
  const template = a.esteiraTemplate || ESTEIRA_DEFAULT_TEMPLATE;

  return <div>
    <div className="cx-blk-toggle-all">
      <button type="button" className="cx-link-btn cx-small" onClick={() => setAllBlocks(true)}>Expandir tudo</button>
      <span className="cx-muted">·</span>
      <button type="button" className="cx-link-btn cx-small" onClick={() => setAllBlocks(false)}>Recolher tudo</button>
    </div>
    <div className="cx-d-chips">
      <CxOpTag op={op} onOpen={a.onOpenOp} />
      <span className="cx-chip"><CxStatusIcon s={resolved ? 'analisado' : intim.status} />{resolved ? 'Resolvida' : (CX_ST[intim.status] || {}).l || intim.status}</span>
      {intim._importFlag === 'new' ? <span className="cx-tag blue">Novo no último import</span> : intim._importFlag === 'updated' ? <span className="cx-tag">Atualizada no último import</span> : null}
      {!resolved ? <button type="button" className={'cx-chip cx-pend' + (intim.hasPending ? ' on' : '')} aria-pressed={!!intim.hasPending} onClick={() => set({ hasPending: !intim.hasPending })} title="Marcar pendência (algo a fazer aqui)"><CxIcon n="flag" s={12} />Pendência</button> : null}
    </div>
    <h2 className="cx-d-title">{cxPartyName(intim)}</h2>
    <p className="cx-d-ev">{intim.eventDescription || intim.className || '—'}</p>
    <CxRuler intim={intim} />

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
        {notes.length === 0 ? <div className="cx-muted cx-small">Sem notas ainda.</div> : null}
        <form className="cx-note-add" onSubmit={e => { e.preventDefault(); const v = nt.trim(); if (!v) return; set({ notesList: [...notes, v] }); setNt(''); cxNotify('Nota adicionada'); }}>
          <textarea id={'cx-nt-' + intim.id} value={nt} onChange={e => setNt(e.target.value)} placeholder="Adicionar nota…" aria-label="Nova nota" onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} />
          <button type="submit" className="cx-btn">Anotar</button>
        </form>
      </div>
    </CxBlock>

    <CxBlock title={resolved ? 'Atuação' : 'Gramática'} open={!!blocks.gram} onToggle={() => toggleBlock('gram')}
      summary={resolved ? (ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida') + (ra.respondedAt ? ' · ' + cxDM(ra.respondedAt) : '') : 'Importância ' + String(CX_IMP[impK] || impK).toLowerCase() + ' · complexidade ' + String(CX_DIF[difK] || difK).toLowerCase() + (urg ? ' · urgente' : '')}>
      {resolved ? <div className="cx-note cx-note-done">
        <b>{ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida'}</b>{ra.respondedAt ? ' · ' + fmtDate(ra.respondedAt) : ''}
        {ra.description ? <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{ra.description}</div> : null}
        {(ra.peticionUrl || ra.docUrl) ? <div style={{ marginTop: 6 }}><a className="cx-a" href={ra.peticionUrl || ra.docUrl} target="_blank" rel="noopener noreferrer"><CxIcon n="link" s={13} />{String(ra.peticionUrl || ra.docUrl).includes('docs.google') ? 'Google Docs' : 'Abrir peça'}</a></div> : null}
      </div> : <div className="cx-gram">
        <div className="cx-gram-f"><span>Importância</span><CxSeg label="Importância" value={impK} onChange={v => set({ priority: v })} options={[['baixa', 'Baixa'], ['normal', 'Média'], ['alta', 'Alta']]} /></div>
        <div className="cx-gram-f"><span>Complexidade</span><CxSeg label="Complexidade" value={difK} onChange={v => set({ difficulty: v })} options={[['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta']]} /></div>
        <div className="cx-gram-f"><span>Marcação</span><button type="button" className={'cx-urg-t' + (urg ? ' on' : '')} aria-pressed={urg} onClick={() => set(urg ? { urgent: false, priority: (intim.priority === 'urgente' || intim.priority === 'urgent') ? 'alta' : intim.priority } : { urgent: true })}><CxIcon n="flag" s={13} />Urgente</button></div>
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
        <dt>Processo</dt><dd>{intim.processNumber ? <><CxProc num={intim.processNumber} uf={intim.jurisdiction} /><button type="button" className="cx-copy" title="Copiar número" aria-label="Copiar número" onClick={() => cxCopy(intim.processNumber)}><CxIcon n="copy" s={13} /></button><a className="cx-a cx-small" href={cxEprocUrl(intim.processNumber)} target="_blank" rel="noopener noreferrer">eproc<CxIcon n="arrowUR" s={11} /></a></> : '—'}</dd>
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
    <button type="button" className="cx-btn" onClick={() => { a.upsert('intimations', { ...intim, status: intim.status === 'peca_edicao' ? 'pendente_analise' : 'peca_edicao' }); }}>{intim.status === 'peca_edicao' ? 'Voltar a pendente' : 'Peça em edição'}</button>
    <button type="button" className="cx-btn ghost" onClick={() => { a.upsert('intimations', { ...intim, status: intim.status === 'aguardando_subsidios' ? 'pendente_analise' : 'aguardando_subsidios' }); cxNotify(intim.status === 'aguardando_subsidios' ? 'Voltou a pendente de análise' : 'Marcada como aguardando subsídios'); }}>{intim.status === 'aguardando_subsidios' ? 'Subsídios chegaram' : 'Aguardar subsídios'}</button>
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
        <div className="cx-crumb"><span>Intimações</span><span className="cx-sep">/</span><b>{op ? cxOpName(op) : 'Sem operação'}</b></div>
        {idx >= 0 ? <span className="cx-mono cx-muted cx-small">{idx + 1} de {order.length}</span> : null}
        <button type="button" className="cx-icon-btn" disabled={idx <= 0} onClick={() => a.onOpenIntim(order[idx - 1])} title="Anterior (K)" aria-label="Anterior"><CxIcon n="chevU" /></button>
        <button type="button" className="cx-icon-btn" disabled={idx < 0 || idx >= order.length - 1} onClick={() => a.onOpenIntim(order[idx + 1])} title="Próxima (J)" aria-label="Próxima"><CxIcon n="chevD" /></button>
        <button type="button" className="cx-icon-btn" onClick={onClose} title="Fechar (Esc)" aria-label="Fechar"><CxIcon n="x" /></button>
      </div>
      <div className="cx-dr-body" ref={bodyRef}><CxIntimDetail intim={intim} a={a} showRespond={showRespond} setShowRespond={setShowRespond} /></div>
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
              <div className="cx-op-h"><span className="cx-op-sq" style={{ background: cxOpColor(op.id) }} /><span className="cx-op-nm">{cxOpName(op)}</span></div>
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
const CX_GROUP_C = { 1: 'var(--cx-red)', 2: 'var(--cx-orange)', 3: 'var(--cx-yellow)', 4: 'var(--cx-blue)', 5: 'var(--cx-ink-3)', 6: 'var(--cx-ink-3)' };
const CX_CERT = { calculado: 'Calculado', estimado: 'Estimado', cadastro: 'Cadastro' };
const CX_CERT_TIP = {
  calculado: 'Data exata pelo cálculo, com os fatos lançados.',
  estimado: 'Faixa provável. Confira nos autos antes de agir.',
  cadastro: 'Falta um dado na ficha para calcular.',
};
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
  return <span className={'cx-tag ' + (k === 'maxima' ? 'red' : 'orange')}>{long ? 'Prioridade ' + lab.toLowerCase() : lab}</span>;
}
function cxClsTag(k) {
  const c = OP_CLASSIFICATIONS[k];
  if (!c) return null;
  return <span key={k} className="cx-tag cx-cls-tag" style={{ '--c': c.color }}>{c.label}</span>;
}

/* ─── Índice por operação (uma passada no acervo) ─── */
function cxOpIndex(data, prazosByDebt) {
  const idx = {};
  const get = (id) => idx[id] || (idx[id] = { debts: [], execs: [], open: [], late: 0, risk: 0, riskValue: 0, targets: [], next: null, tasks: 0 });
  (data.debts || []).forEach(d => {
    if (!d.operationId || d.status === 'extinta') return;
    const x = get(d.operationId); x.debts.push(d);
    const row = prazosByDebt.get(d.id);
    if (row && (row.group === 1 || row.group === 2) && !d.prescriptionHandled) { x.risk++; x.riskValue += d.value || 0; }
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
  return (id) => get(id);
}

/* ═════════════════════ Carteira ═════════════════════ */
function EditionClaudeCarteira(p) {
  const { data, prazosByDebt } = p;
  const [localF, setLocalF] = React.useState('all');
  const filter = p.classFilter || localF;
  const setFilter = p.setClassFilter || setLocalF;
  const [q, setQ] = React.useState('');
  const [sort, setSortS] = React.useState(() => { try { return localStorage.getItem('nexus_cx_cart_sort') || 'nome'; } catch (e) { return 'nome'; } });
  const setSort = (v) => { setSortS(v); try { localStorage.setItem('nexus_cx_cart_sort', v); } catch (e) { /* ignore */ } };
  const idx = React.useMemo(() => cxOpIndex(data, prazosByDebt), [data, prazosByDebt]);
  const ops = data.operations || [];
  const chips = [['all', 'Todas', ops.filter(o => o.status !== 'encerrada').length]];
  opClassChipKeys(ops, { hideEmpty: true }).forEach(k => { if (OP_CLASSIFICATIONS[k]) chips.push([k, OP_CLASSIFICATIONS[k].label, ops.filter(o => opMatchesClassFilter(o, k)).length]); });
  const nClosed = ops.filter(o => o.status === 'encerrada').length;
  if (nClosed) chips.push(['encerrada', 'Encerradas', nClosed]);
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  let list = ops.filter(o => (filter === 'all' ? o.status !== 'encerrada' : opMatchesClassFilter(o, filter)))
    .filter(o => !toks.length || toks.every(t => cxNorm(o.name + ' ' + (o.description || '')).includes(t)));
  const money = (o) => idx(o.id).debts.reduce((s, d) => s + (d.value || 0), 0);
  const guar = (o) => idx(o.id).debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  const cov = (o) => { const t = money(o); return t > 0 ? guar(o) / t : 1; };
  const sorters = {
    nome: sortOpsByName,
    valor: (a, b) => money(b) - money(a),
    cobertura: (a, b) => cov(a) - cov(b) || money(b) - money(a),
    risco: (a, b) => idx(b.id).risk - idx(a.id).risk || money(b) - money(a),
    revisao: (a, b) => ((cxRS(a).daysLeft ?? 99999) - (cxRS(b).daysLeft ?? 99999)),
    intimacoes: (a, b) => idx(b.id).open.length - idx(a.id).open.length || sortOpsByName(a, b),
  };
  list = list.slice().sort(sorters[sort] || sortOpsByName);
  const active = ops.filter(o => o.status !== 'encerrada');
  const totalAll = active.reduce((s, o) => s + money(o), 0);
  const guarAll = active.reduce((s, o) => s + guar(o), 0);
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Carteira</h1><p>{cxPl(active.length, 'operação ativa', 'operações ativas')} · {cxMoneyShort(totalAll)} sob gestão · {totalAll ? Math.round(guarAll / totalAll * 100) : 0}% garantido. A barra verde é a parte garantida da dívida.</p></div>
      <div className="cx-acts"><button type="button" className="cx-btn primary" onClick={p.onNewOp}><CxIcon n="plus" s={14} />Nova operação</button></div>
    </div>
    <div className="cx-toolbar">
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-cart-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Nome ou descrição da operação" aria-label="Buscar operação" /></label>
      <span className="cx-sp" />
      <CxSelect id="cx-cart-sort" pre="Ordenar" value={sort} onChange={setSort} options={[['nome', 'Nome'], ['valor', 'Maior dívida'], ['cobertura', 'Menor garantia'], ['risco', 'Risco prescricional'], ['revisao', 'Revisão mais atrasada'], ['intimacoes', 'Mais intimações']]} />
    </div>
    <div className="cx-chips" role="group" aria-label="Filtrar por classificação">
      {chips.map(c => <button key={c[0]} type="button" className={'cx-fchip' + (filter === c[0] ? ' on' : '')} aria-pressed={filter === c[0]} onClick={() => setFilter(c[0])} style={OP_CLASSIFICATIONS[c[0]] ? { '--c': OP_CLASSIFICATIONS[c[0]].color } : null}>
        {OP_CLASSIFICATIONS[c[0]] ? <span className="cx-dot" style={{ background: OP_CLASSIFICATIONS[c[0]].color }} /> : null}{c[1]}<span className="cx-n">{c[2]}</span>
      </button>)}
    </div>
    {list.length === 0 ? <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>{ops.length ? 'Nenhuma operação neste filtro.' : 'Nenhuma operação ainda. Crie a primeira.'}</div></div> :
    <div className="cx-op-grid">{list.map(o => {
      const x = idx(o.id);
      const total = money(o), g = guar(o), pct = total > 0 ? Math.round(g / total * 100) : 0;
      const cls = getOpClassifications(o);
      const closed = o.status === 'encerrada';
      return <button key={o.id} type="button" className={'cx-op-card' + (closed ? ' closed' : '')} onClick={() => p.onOpenOp(o.id)}>
        <span className="cx-op-h">
          <span className="cx-op-sq" style={{ background: cxOpColor(o.id) }} />
          <span className="cx-op-nm cx-ell" title={o.name}>{cxOpName(o)}</span>
          {cxOpPrioTag(o)}
          <span className="cx-sp" />
          {closed ? <span className="cx-tag">Encerrada</span> : cxReviewTag(o)}
        </span>
        <span className="cx-op-desc">{o.description || <span className="cx-muted">Sem descrição.</span>}</span>
        {cls.length ? <span className="cx-tags">{cls.slice(0, 3).map(cxClsTag)}{cls.length > 3 ? <span className="cx-tag">+{cls.length - 3}</span> : null}</span> : null}
        <span className="cx-op-money"><b>{total ? cxMoneyShort(total) : '—'}</b><span className="cx-pct">{pct}% garantido</span></span>
        <span className="cx-bar cx-bar-full"><i style={{ width: pct + '%' }} /></span>
        <span className="cx-op-meta">
          <span title="Processos"><CxIcon n="scale" s={13} />{x.execs.length}</span>
          <span title="CDAs ativas"><CxIcon n="file" s={13} />{x.debts.length}</span>
          <span title="Intimações abertas" className={x.late ? 'cx-red-t' : ''}><CxIcon n="inbox" s={13} />{x.open.length}{x.late ? ' · ' + x.late + ' venc.' : ''}</span>
          {x.risk ? <span title="CDAs nos grupos urgentes de prescrição" className="cx-violet-t"><CxIcon n="hourglass" s={13} />{x.risk}</span> : null}
          <span title="Próximo prazo"><CxIcon n="clock" s={13} />{x.next ? <CxDue iso={x.next.dateDeadline} /> : '—'}</span>
          <span className="cx-sp" />
          {x.targets.length ? <CxAvatars people={x.targets} /> : null}
        </span>
      </button>;
    })}</div>}
  </div>;
}

/* ═════════════════════ Linha do tempo ═════════════════════ */
const CX_TL_SCALES = { semanas: { ppd: 22 }, meses: { ppd: 3.2 }, anos: { ppd: 0.6 } };
const CX_TL_ROW = 36, CX_TL_AXIS = 50;
const CX_TAG_C = { idpj: 'var(--cx-red)', cautelar_fiscal: 'var(--cx-yellow)', central: 'var(--cx-violet)', normal: 'var(--cx-cyan)' };
function cxExecTag(e) {
  if (e.processTag === 'idpj') return 'IDPJ';
  if (e.processTag === 'cautelar_fiscal') return 'MCF';
  if (e.processTag === 'central') return 'CENTRAL';
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
  if (t === 'EF') return 'var(--cx-cyan)';
  return 'var(--cx-ink-3)';
}
function cxEvColor(type) {
  const t = String(type || '');
  if (t === 'susp_parcelamento' || t === 'int_rescisao_parcelamento') return 'var(--cx-green)';
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
/* Monta as linhas da régua a partir dos dados reais. Datas em ISO. */
function cxBuildTimeline(data, op, prescLookup) {
  const execs = (data.executions || []).filter(e => e.operationId === op.id);
  const ids = new Set(execs.map(e => e.id));
  const events = data.prescriptionEvents || [];
  const today = localIso(new Date());
  const isHub = (e) => ['idpj', 'cautelar_fiscal', 'central'].includes(e.processTag);
  const info = new Map();
  execs.forEach(e => {
    const stages = getStageRecords(op.briefing, e.id) || {};
    const DEF = (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') ? PROCESS_STAGES : CENTRAL_STAGES;
    const evs = [];
    Object.keys(stages).forEach(k => {
      const rec = stages[k]; if (!rec) return;
      const def = resolveStageDef(DEF, k, rec);
      if (def.multiRecurso) getRecursos(rec).forEach(r => { const d = toDayKey(r.date); if (d) evs.push({ d, l: def.label + (r.parte === 'adversa' ? ' (parte adversa)' : '') + (r.outcome && RECURSO_OUTCOMES[r.outcome] ? ' · ' + RECURSO_OUTCOMES[r.outcome] : ''), c: cxOutcomeColor(r.outcome), k: 'stage' }); });
      else { const d = toDayKey(rec.date); if (d) evs.push({ d, l: def.label + (rec.outcome && def.outcomes && def.outcomes[rec.outcome] ? ' · ' + def.outcomes[rec.outcome] : ''), c: cxOutcomeColor(rec.outcome), k: 'stage', decisive: !!rec.outcome }); }
    });
    const seen = new Set();
    events.forEach(pe => {
      if (pe.executionId !== e.id) return;
      const d = toDayKey(pe.requestDate || pe.date); if (!d) return;
      const key = pe.type + '|' + d; if (seen.has(key)) return; seen.add(key);
      const t = PRESC_EVENT_TYPES[normalizePrescEventType(pe.type)] || {};
      evs.push({ d, l: t.label || pe.type, c: cxEvColor(pe.type), k: 'presc' });
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
      if (r.segment === 'intercorrente' && r.diesAQuo) {
        const m = (r.memory || []).find(x => /Fim da suspens|Fim do 1º ano/.test(String(x.event || '')));
        let yearEnd = m && toDayKey(m.date);
        if (!yearEnd && r.phase === 'suspensao_art40') yearEnd = addCalendarYears(r.diesAQuo, 1);
        const stop = toDayKey(r.interruptAt) || null;
        if (yearEnd) segs.push({ from: r.diesAQuo, to: stop && stop < yearEnd ? stop : yearEnd, t: 'susp' });
        const interFrom = yearEnd || r.diesAQuo;
        const interTo = stop || toDayKey(r.diesAdQuem);
        if (interTo && interTo > interFrom && (!stop || stop > interFrom)) segs.push({ from: interFrom, to: interTo, t: 'inter' });
        if (stop) marks.push({ d: stop, l: 'Ciclo encerrado em ' + fmtDate(stop), c: 'var(--cx-cyan)' });
        else if (r.diesAdQuem) marks.push({ d: toDayKey(r.diesAdQuem), l: 'Termo ' + (r.estimated ? 'estimado' : 'calculado') + ' · ' + fmtDate(r.diesAdQuem), c: 'var(--cx-violet)', big: true, deadline: true });
      }
      let parcEnds = null; try { parcEnds = inferParcelamentoEnds(r.timeline || []); } catch (err) { parcEnds = null; }
      (r.timeline || []).forEach(ev => {
        const t = PRESC_EVENT_TYPES[normalizePrescEventType(ev.type)];
        if (!t || t.category !== 'suspensiva' || ev.type === 'susp_art40') return;
        const from = toDayKey(ev.requestDate || ev.date); if (!from) return;
        const inf = parcEnds && parcEnds.get ? parcEnds.get(ev.id) : null;
        const to = toDayKey(ev.endDate) || (inf && toDayKey(inf.end)) || today;
        segs.push({ from, to: to < from ? from : to, t: ev.type === 'susp_parcelamento' ? 'pausa' : 'susp2', l: t.label });
      });
      if (!segs.length && r.bounds && r.bounds.floor) marks.push({ d: toDayKey(r.bounds.floor), l: 'Não pode ter prescrito antes de ' + fmtDate(r.bounds.floor), c: 'var(--cx-ink-3)', hollow: true });
      presc = { r, debt: worstDebt, n: debts.length, segs, marks };
    }
    const intims = (data.intimations || []).filter(i => cxIsOpen(i) && i.dateDeadline && sameProc(i.processNumber, e.processNumber));
    info.set(e.id, { e, evs, start, presc, intims, end: e.status === 'extinta' ? (evs.map(x => x.d).sort().pop() || toDayKey(e.updatedAt)) : null });
  });
  const byStart = (a, b) => String(info.get(a.id).start).localeCompare(String(info.get(b.id).start));
  const tops = execs.filter(e => !e.parentExecutionId || !ids.has(e.parentExecutionId));
  const ordered = [...tops.filter(isHub).sort(byStart), ...tops.filter(e => !isHub(e)).sort(byStart)];
  const rows = [{ kind: 'ms' }];
  const pushExec = (e, depth) => {
    const x = info.get(e.id);
    rows.push({ kind: 'proc', x, depth });
    if (x.presc && (x.presc.segs.length || x.presc.marks.length)) rows.push({ kind: 'presc', x, depth });
    x.intims.forEach(i => rows.push({ kind: 'prazo', i, x, depth }));
    execs.filter(c => c.parentExecutionId === e.id).sort(byStart).forEach(c => pushExec(c, depth + 1));
  };
  ordered.forEach(e => pushExec(e, 0));
  // CDAs sem processo nesta operação, com o prazo para ajuizar apertado (ordinária)
  const cdas = [];
  (data.debts || []).forEach(d => {
    if (d.operationId !== op.id || d.status === 'extinta' || d.prescriptionHandled) return;
    if (d.processNumber && execs.some(e => sameProc(e.processNumber, d.processNumber))) return;
    let r = null; try { r = prescLookup(d); } catch (err) { r = null; }
    if (!r || r.segment !== 'credito' || !r.diesAdQuem) return;
    if (r.status !== 'critico' && r.status !== 'alerta' && r.status !== 'prescrito') return;
    const end = toDayKey(r.diesAdQuem);
    cdas.push({ d, r, end, start: toDayKey(r.diesAQuo) || addCalendarYears(end, -5) });
  });
  cdas.sort((a, b) => a.end.localeCompare(b.end));
  if (cdas.length) { rows.push({ kind: 'cdah', n: cdas.length }); cdas.slice(0, 10).forEach(c => rows.push({ kind: 'cda', c })); }
  // Marcos da operação
  const ms = [];
  (data.hearings || []).forEach(h => { if (h.operationId === op.id && h.date && h.status !== 'cancelada') ms.push({ d: toDayKey(h.date), l: (CX_HEARING[h.hearingType] || 'Audiência') + (h.time ? ' · ' + h.time : ''), c: 'var(--cx-orange)', hearing: h }); });
  info.forEach(x => { x.evs.forEach(ev => { if (ev.decisive) ms.push({ d: ev.d, l: ev.l, c: ev.c }); }); if (x.presc) x.presc.marks.forEach(m => { if (m.deadline) ms.push({ d: m.d, l: 'Prescrição · ' + fmtDate(m.d), c: m.c, big: true }); }); });
  cdas.slice(0, 10).forEach(c => ms.push({ d: c.end, l: 'Ajuizar CDA ' + (c.d.cdaNumber || '') + ' até ' + fmtDate(c.end), c: 'var(--cx-violet)', big: true }));
  const rv = cxReviewNext(op);
  if (rv) ms.push({ d: rv, l: 'Revisão ' + ((REVIEW_INTERVALS[op.reviewInterval || 'mensal'] || {}).label || '').toLowerCase(), c: 'var(--cx-accent)' });
  ms.sort((a, b) => String(a.d).localeCompare(String(b.d)));
  const covers = [];
  execs.forEach(e => (e.linkedExecutionIds || []).forEach(c => { if (ids.has(c)) covers.push([e.id, c]); }));
  const parents = execs.filter(e => e.parentExecutionId && ids.has(e.parentExecutionId)).map(e => [e.parentExecutionId, e.id]);
  const allDates = [];
  info.forEach(x => { allDates.push(x.start); x.evs.forEach(v => allDates.push(v.d)); if (x.presc) { x.presc.segs.forEach(s => { allDates.push(s.from); allDates.push(s.to); }); x.presc.marks.forEach(m => allDates.push(m.d)); } });
  ms.forEach(m => allDates.push(m.d));
  cdas.slice(0, 10).forEach(c => { allDates.push(c.start); allDates.push(c.end); });
  return { rows, ms, covers, parents, allDates: allDates.filter(Boolean), empty: execs.length === 0 && cdas.length === 0 };
}
function EditionClaudeTimeline({ data, op, prescLookup, scale, setScale, onOpenIntim, onOpenHearing, onOpenCda, compact }) {
  const tl = React.useMemo(() => cxBuildTimeline(data, op, prescLookup), [data, op, prescLookup]);
  const sc = CX_TL_SCALES[scale] || CX_TL_SCALES.meses;
  const offs = tl.allDates.map(d => daysUntil(d)).filter(v => v !== null);
  let from, to;
  if (scale === 'semanas') { from = -28; to = 49; }
  else if (scale === 'meses') { from = -300; to = 240; }
  else { from = Math.max(-365 * 16, Math.min(-365 * 2, ...offs) - 60); to = Math.min(365 * 8, Math.max(365, ...offs) + 120); }
  const W = Math.round((to - from) * sc.ppd);
  const x = (off) => (off - from) * sc.ppd;
  const xi = (iso) => { const o = daysUntil(iso); return o === null ? null : x(o); };
  const scRef = React.useRef(null);
  React.useLayoutEffect(() => { const el = scRef.current; if (el) el.scrollLeft = Math.max(0, x(0) - el.clientWidth * 0.45); }, [op.id, scale]);
  if (tl.empty) return <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>Esta operação ainda não tem processos cadastrados. Eles aparecem aqui assim que forem lançados na aba Processos e prescrição.</div></div>;
  const clamp = (a, b) => { const s = Math.max(a, from), e = Math.min(b, to); return e <= s ? null : { left: x(s), width: Math.max(4, (e - s) * sc.ppd) }; };
  const clampIso = (fa, tb) => { const a = daysUntil(fa), b = daysUntil(tb); if (a === null || b === null) return null; return clamp(a, b); };
  const axis = [], grid = [];
  const base = new Date(); base.setHours(12, 0, 0, 0);
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  for (let d = from; d <= to; d++) {
    const D = new Date(base); D.setDate(D.getDate() + d);
    const dd = D.getDate(), mm = D.getMonth(), wd = D.getDay();
    if (scale === 'semanas') {
      axis.push(<span key={'t' + d} className={'cx-tl-tick' + (wd === 0 || wd === 6 ? ' we' : '')} style={{ left: x(d) + sc.ppd / 2 }}>{dd}</span>);
      if (wd === 6) grid.push(<span key={'w' + d} className="cx-tl-shade" style={{ left: x(d), width: sc.ppd * 2 }} />);
      if (dd === 1 || d === from) axis.push(<span key={'m' + d} className="cx-tl-major" style={{ left: x(d) }}>{CX_MES_L[mm]} {D.getFullYear()}</span>);
      if (wd === 1) grid.push(<span key={'g' + d} className="cx-tl-grid" style={{ left: x(d) }} />);
    } else if (scale === 'meses') {
      if (dd === 1) { axis.push(<span key={'t' + d} className="cx-tl-tick" style={{ left: x(d) + 15 * sc.ppd }}>{MES[mm]}</span>); grid.push(<span key={'g' + d} className="cx-tl-grid strong" style={{ left: x(d) }} />); }
      else if (wd === 1) grid.push(<span key={'g' + d} className="cx-tl-grid" style={{ left: x(d) }} />);
      if ((dd === 1 && mm === 0) || d === from) axis.push(<span key={'y' + d} className="cx-tl-major" style={{ left: x(d) }}>{D.getFullYear()}</span>);
    } else {
      if (dd === 1 && mm % 3 === 0) { axis.push(<span key={'t' + d} className="cx-tl-tick" style={{ left: x(d) + 45 * sc.ppd }}>{'T' + (mm / 3 + 1)}</span>); grid.push(<span key={'g' + d} className={'cx-tl-grid' + (mm === 0 ? ' strong' : '')} style={{ left: x(d) }} />); }
      if ((dd === 1 && mm === 0) || d === from) axis.push(<span key={'y' + d} className="cx-tl-major" style={{ left: x(d) }}>{D.getFullYear()}</span>);
    }
  }
  const rowY = {};
  tl.rows.forEach((r, k) => { if (r.kind === 'proc') rowY[r.x.e.id] = CX_TL_AXIS + k * CX_TL_ROW + CX_TL_ROW / 2; });
  const H = CX_TL_AXIS + tl.rows.length * CX_TL_ROW;
  const links = [];
  tl.parents.concat(tl.covers).forEach(([a, b]) => {
    if (rowY[a] == null || rowY[b] == null) return;
    const rowB = tl.rows.find(r => r.kind === 'proc' && r.x.e.id === b);
    const xa = rowB ? xi(rowB.x.start) : null;
    if (xa === null || xa < 0 || xa > W) return;
    links.push([xa, rowY[a], rowY[b]]);
  });
  const minLbl = scale === 'anos' ? 160 : 110;
  const left = (r, k) => {
    const pad = { paddingLeft: 12 + (r.depth || 0) * 14 };
    if (r.kind === 'ms') return <div key={k} className="cx-tl-rl ms"><CxIcon n="flag" s={13} />Marcos da operação<span className="cx-count" style={{ marginLeft: 'auto' }}>{tl.ms.length}</span></div>;
    if (r.kind === 'proc') { const e = r.x.e; return <div key={k} className="cx-tl-rl" style={pad} title={(e.className || '') + ' · ' + (e.processNumber || '')}><span className="cx-ptag" style={{ '--c': cxTagColor(e) }}>{cxExecTag(e)}</span><span className="cx-tl-l2"><span className="cx-ell" style={{ fontWeight: 500 }}>{e.className || 'Processo'}</span><span className="cx-ell cx-mono cx-tl-who">{e.processNumber || '—'}</span></span></div>; }
    if (r.kind === 'cdah') return <div key={k} className="cx-tl-rl ms"><CxIcon n="file" s={13} /><span className="cx-ell" title="CDAs desta operação sem processo, com o prazo de 5 anos para ajuizar perto do fim">CDAs sem processo · ajuizar</span><span className="cx-count" style={{ marginLeft: 'auto' }}>{r.n}</span></div>;
    if (r.kind === 'cda') { const c = r.c; return <div key={k} className={'cx-tl-rl sub' + (onOpenCda ? ' click' : '')} style={{ paddingLeft: 26 }} role={onOpenCda ? 'button' : undefined} tabIndex={onOpenCda ? 0 : undefined} onClick={onOpenCda ? () => onOpenCda({ id: c.d.id, operationId: c.d.operationId }) : undefined} onKeyDown={onOpenCda ? (ev => { if (ev.key === 'Enter') onOpenCda({ id: c.d.id, operationId: c.d.operationId }); }) : undefined} title={c.r.detail || ''}><CxIcon n="hourglass" s={13} style={{ color: 'var(--cx-violet)' }} /><span className="cx-mono" style={{ fontSize: 11.5 }}>{c.d.cdaNumber || 'S/N'}</span><span className="cx-ell cx-muted">{c.r.status === 'prescrito' ? 'venceu em ' + fmtDate(c.end) : 'até ' + fmtDate(c.end)}</span></div>; }
    if (r.kind === 'presc') { const pr = r.x.presc; return <div key={k} className="cx-tl-rl sub" style={{ paddingLeft: 26 + (r.depth || 0) * 14 }} title={pr.r.summary || ''}><CxIcon n="hourglass" s={13} style={{ color: 'var(--cx-violet)' }} /><span className="cx-ell">Prescrição · {CX_PRESC_TXT[pr.r.status] || pr.r.status}{pr.n > 1 ? ' · pior de ' + pr.n + ' CDAs' : ''}</span></div>; }
    return <div key={k} className="cx-tl-rl sub" style={{ paddingLeft: 26 + (r.depth || 0) * 14 }}><CxStatusIcon s={r.i.status} /><span className="cx-ell">{r.i.eventDescription || r.i.className || 'Intimação'}</span></div>;
  };
  const right = (r, k) => {
    const inner = [];
    if (r.kind === 'cdah') return <div key={k} className="cx-tl-rr ms" />;
    if (r.kind === 'cda') {
      const c = r.c, b = clampIso(c.start, c.end), o = daysUntil(c.end);
      if (b) inner.push(<span key="s" className="cx-tl-seg inter" style={{ left: b.left, width: b.width }} title={'Prazo de 5 anos para ajuizar · termo ' + (c.r.estimated ? 'estimado' : 'calculado') + ' em ' + fmtDate(c.end)} />);
      if (b && b.width > minLbl) inner.push(<span key="sl" className="cx-tl-seg-l" style={{ left: b.left }}>{c.r.diesAQuo ? 'Prazo para ajuizar' : 'Prazo para ajuizar (início estimado)'}</span>);
      if (o !== null && o >= from && o <= to) inner.push(<span key="m" className="cx-tl-dm lg" style={{ left: x(o), '--c': c.r.status === 'prescrito' ? 'var(--cx-red)' : 'var(--cx-violet)' }} title={'Termo ' + fmtDate(c.end)} />);
      if (!inner.length) inner.push(<span key="h" className="cx-tl-hint">Termo em {fmtDate(c.end)}, fora desta escala</span>);
      return <div key={k} className="cx-tl-rr">{inner}</div>;
    }
    if (r.kind === 'ms') {
      const vis = tl.ms.filter(m => { const o = daysUntil(m.d); return o !== null && o >= from && o <= to; });
      vis.forEach((m, j) => {
        const X = xi(m.d), next = vis[j + 1], room = next ? xi(next.d) - X - 14 : 200;
        inner.push(<span key={'d' + j} className={'cx-tl-dm' + (m.big ? ' lg' : '')} style={{ left: X, '--c': m.c, cursor: m.hearing ? 'pointer' : 'default' }} title={fmtDate(m.d) + ' · ' + m.l} onClick={m.hearing && onOpenHearing ? () => onOpenHearing(m.hearing) : undefined} />);
        if (room >= 90) inner.push(<span key={'l' + j} className="cx-tl-dm-l" style={{ left: X, maxWidth: Math.min(room, 220) }}>{m.l}</span>);
      });
    } else if (r.kind === 'proc') {
      const X = r.x, e = X.e;
      const b = clampIso(X.start, X.end || localIso(new Date(Date.now() + to * 86400000)));
      if (b) inner.push(<div key="b" className={'cx-tl-bar' + (X.end ? ' ended' : ' open-end')} style={{ left: b.left, width: b.width, '--c': cxTagColor(e) }} title={(e.className || '') + ' · desde ' + fmtDate(X.start)}>{b.width > 70 ? <span className="cx-tl-lbl">{EXEC_STATUSES[e.status] ? EXEC_STATUSES[e.status].label : ''}{X.end ? ' · extinta' : ''}</span> : null}</div>);
      X.evs.forEach((ev, j) => { const o = daysUntil(ev.d); if (o === null || o < from || o > to) return; inner.push(<span key={'e' + j} className="cx-tl-dm" style={{ left: x(o), '--c': ev.c }} title={fmtDate(ev.d) + ' · ' + ev.l} />); });
    } else if (r.kind === 'presc') {
      const pr = r.x.presc;
      pr.segs.forEach((s, j) => {
        const b = clampIso(s.from, s.to); if (!b) return;
        const names = { susp: 'Suspensão de 1 ano', inter: 'Contagem de 5 anos', pausa: 'Parcelamento', susp2: s.l || 'Pausa' };
        inner.push(<span key={'s' + j} className={'cx-tl-seg ' + s.t} style={{ left: b.left, width: b.width }} title={names[s.t] + ' · ' + fmtDate(s.from) + ' a ' + fmtDate(s.to)} />);
        if (b.width > minLbl * 0.8) inner.push(<span key={'sl' + j} className="cx-tl-seg-l" style={{ left: b.left }}>{names[s.t]}</span>);
      });
      pr.marks.forEach((m, j) => { const o = daysUntil(m.d); if (o === null || o < from || o > to) return; inner.push(<span key={'m' + j} className={'cx-tl-dm' + (m.big ? ' lg' : '') + (m.hollow ? ' hollow' : '')} style={{ left: x(o), '--c': m.c }} title={m.l} />); });
      if (!inner.length || (pr.r.status === 'indeterminado' && !pr.segs.length)) {
        const fl = pr.marks.find(m => m.hollow);
        const txt = pr.r.status === 'indeterminado' ? 'A contagem do art. 40 ainda não começou' : 'Nada nesta escala';
        inner.unshift(<span key="h" className="cx-tl-hint">{txt}{fl ? ' · não prescreve antes de ' + fmtDate(fl.d) : ''}</span>);
      }
    } else {
      const i = r.i, info = cxDue(daysUntil(i.dateDeadline), i.dateDeadline);
      const c = info.tone === 'late' ? 'var(--cx-red)' : info.tone === 'today' ? 'var(--cx-orange)' : info.tone === 'soon' ? 'var(--cx-yellow)' : 'var(--cx-ink-3)';
      const st = toDayKey(i.dateStart) || toDayKey(i.dateSent) || toDayKey(i.dateDeadline);
      const end = toDayKey(i.dateDeadline);
      const b = clampIso(st, localIso(new Date(new Date(end + 'T12:00:00').getTime() + 86400000)));
      if (b) inner.push(<div key="p" className="cx-tl-bar prazo" role="button" tabIndex={0} style={{ left: b.left, width: b.width, '--c': c }} onClick={() => onOpenIntim && onOpenIntim(i.id)} onKeyDown={ev => { if (ev.key === 'Enter' && onOpenIntim) onOpenIntim(i.id); }} title={(i.eventDescription || '') + ' · final ' + fmtDate(end)}>{b.width > 110 ? <span className="cx-tl-lbl">Prazo · final {cxDM(end)}</span> : null}</div>);
    }
    return <div key={k} className={'cx-tl-rr' + (r.kind === 'ms' ? ' ms' : '')}>{inner}</div>;
  };
  return <div>
    {!compact ? null : <div className="cx-tl-tools"><CxSeg label="Escala" value={scale} onChange={setScale} options={[['semanas', 'Semanas'], ['meses', 'Meses'], ['anos', 'Anos']]} /></div>}
    <div className="cx-tl">
      <div className="cx-tl-l"><div className="cx-tl-hd">Processo · evento</div>{tl.rows.map(left)}</div>
      <div className="cx-tl-r" ref={scRef}>
        <div className="cx-tl-cv" style={{ width: W, height: H }}>
          <div className="cx-tl-axis">{axis}</div>
          {grid}
          {tl.rows.map(right)}
          <svg className="cx-tl-svg" width={W} height={H} aria-hidden="true">{links.map((l, k) => <g key={k}><path d={'M' + l[0] + ' ' + l[1] + ' C ' + (l[0] - 16) + ' ' + l[1] + ', ' + (l[0] - 16) + ' ' + l[2] + ', ' + l[0] + ' ' + l[2]} style={{ fill: 'none', stroke: 'var(--cx-line-strong)', strokeWidth: 1.5 }} /><circle cx={l[0]} cy={l[2]} r="2.5" style={{ fill: 'var(--cx-ink-3)' }} /></g>)}</svg>
          <div className="cx-tl-today" style={{ left: x(0) }}><span>Hoje</span></div>
        </div>
      </div>
    </div>
    <div className="cx-tl-legend">
      <span><i className="cx-lg-sw" style={{ background: 'color-mix(in srgb, var(--cx-cyan) 14%, var(--cx-surface))', border: '1px solid color-mix(in srgb, var(--cx-cyan) 40%, transparent)' }} />Processo</span>
      <span><i className="cx-tl-dm cx-lg" style={{ '--c': 'var(--cx-green)' }} />Favorável</span>
      <span><i className="cx-tl-dm cx-lg" style={{ '--c': 'var(--cx-red)' }} />Desfavorável</span>
      <span><i className="cx-tl-dm cx-lg" style={{ '--c': 'var(--cx-cyan)' }} />Resultado útil</span>
      <span><i className="cx-tl-dm cx-lg" style={{ '--c': 'var(--cx-orange)' }} />Audiência</span>
      <span><i className="cx-lg-sw cx-tl-seg susp" />Suspensão de 1 ano</span>
      <span><i className="cx-lg-sw cx-tl-seg inter" />Contagem de 5 anos</span>
      <span><i className="cx-lg-sw cx-tl-seg pausa" />Parcelamento</span>
      <span><i className="cx-lg-sw cx-tl-seg susp2" />Outra pausa</span>
    </div>
  </div>;
}
function EditionClaudeTimelinePage({ data, opId, setOpId, prescLookup, scale, setScale, onOpenIntim, onOpenHearing, onOpenOp, onOpenCda }) {
  const ops = (data.operations || []).filter(o => o.status !== 'encerrada').slice().sort(sortOpsByName);
  const op = ops.find(o => o.id === opId) || ops[0];
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-page-h"><div><h1>Linha do tempo</h1><p>Processos, prazos e a contagem da prescrição da operação numa mesma régua. A faixa lilás usa o cálculo do app, pela CDA em pior situação de cada processo.</p></div>
      {op ? <div className="cx-acts"><button type="button" className="cx-btn" onClick={() => onOpenOp(op.id)}>Abrir operação<CxIcon n="chevR" s={13} /></button></div> : null}</div>
    {!op ? <div className="cx-card"><div className="cx-empty-row" style={{ borderTop: 0 }}>Nenhuma operação ativa.</div></div> : <>
      <div className="cx-tl-tools">
        <CxSelect id="cx-tl-op" pre="Operação" value={op.id} onChange={setOpId} options={ops.map(o => [o.id, cxOpName(o)])} />
        <CxSeg className="lg" label="Escala" value={scale} onChange={setScale} options={[['semanas', 'Semanas'], ['meses', 'Meses'], ['anos', 'Anos']]} />
        <span className="cx-sp" />
        <span className="cx-muted cx-small">Clique num prazo para abrir a intimação. Use Anos para ver o 1 ano + 5 anos inteiro.</span>
      </div>
      <EditionClaudeTimeline data={data} op={op} prescLookup={prescLookup} scale={scale} setScale={setScale} onOpenIntim={onOpenIntim} onOpenHearing={onOpenHearing} onOpenCda={onOpenCda} />
    </>}
  </div>;
}

/* ═════════════════════ Visão geral da operação ═════════════════════ */
function EditionClaudeOpOverview(p) {
  const { data, op, opStats: s, prazosRadar } = p;
  const [scale, setScale] = React.useState('meses');
  const rs = cxRS(op);
  const cls = getOpClassifications(op);
  const open = (data.intimations || []).filter(i => i.operationId === op.id && cxIsOpen(i)).sort(cxAttention);
  const today = localIso(new Date());
  const prazoRows = (prazosRadar.rows || []).filter(r => r.operationId === op.id && r.group !== 6);
  const split = splitMesaRows(prazoRows, today);
  const hearings = (data.hearings || []).filter(h => h.operationId === op.id && h.date && h.status !== 'realizada' && h.status !== 'cancelada' && daysUntil(h.date) >= 0).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const indisp = (data.assets || []).filter(x => x.operationId === op.id && (x.status === 'indisponibilidade_ativa' || x.status === 'indisponibilidade_requerida') && x.value > 0).reduce((t, x) => t + x.value, 0);
  const tasks = (data.tasks || []).filter(t => t.operationId === op.id && t.status !== 'concluida' && t.status !== 'cancelada').sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
  const stat = (label, value, sub, opts = {}) => {
    const body = <><span className="cx-stat-l">{label}</span><span className={'cx-stat-v ' + (opts.tone || '')}>{value}</span><span className="cx-stat-s">{sub}</span></>;
    return opts.onClick
      ? <button type="button" className="cx-stat click" onClick={opts.onClick} title={opts.tip}>{body}</button>
      : <div className="cx-stat" title={opts.tip}>{body}</div>;
  };
  return <div className="cx cx-page cx-page-wide cx-op-page">
    <div className="cx-op-top">
      <div className="cx-minw0">
        <div className="cx-eyebrow">Operação{op.status === 'encerrada' ? ' · encerrada' : ''}</div>
        <div className="cx-op-hero"><span className="cx-sq-lg" style={{ background: cxOpColor(op.id) }} /><h1>{op.name}</h1>{cxOpPrioTag(op, true)}</div>
        {op.description ? <p className="cx-lede cx-op-lede">{op.description}</p> : null}
        <div className="cx-tags" style={{ marginTop: 10 }}>{cls.map(cxClsTag)}{cxReviewTag(op)}</div>
      </div>
      <div className="cx-op-actions">
        <button type="button" className={'cx-btn' + (rs.overdue ? ' primary' : '')} onClick={p.onReviewed} title="Marcar a operação como revisada hoje"><CxIcon n="tick" s={14} />Revisada</button>
        <button type="button" className="cx-btn" onClick={p.onEdit}><CxIcon n="edit" s={14} />Editar</button>
        <button type="button" className="cx-btn ghost" onClick={p.onDiag}>Diagnóstico</button>
        <button type="button" className="cx-btn ghost" onClick={p.onReport} title="Relatório de passagem de serviço (HTML)"><CxIcon n="file" s={14} />Relatório</button>
      </div>
    </div>
    <nav className="cx-optabs" aria-label="Abas da operação">
      <button type="button" className="on" aria-current="page">Visão geral</button>
      {CX_OP_TABS.map(t => <button key={t[0]} type="button" onClick={() => p.onTab(t[0])}>{t[1]}</button>)}
    </nav>
    {s ? <div className="cx-stats">
      {stat('Dívida total', cxMoneyShort(s.total), cxPl(s.debts, 'CDA', 'CDAs'), { onClick: () => p.onTab('dividas') })}
      {stat('Garantido (CDA)', cxMoneyShort(s.guar), (s.total ? Math.round(s.guar / s.total * 100) : 0) + '% da dívida', { tip: 'CDAs com status Garantida' })}
      {stat('Indisponibilidades', s.indispHasValue ? cxMoneyShort(indisp) : s.indispLabel, s.indispCount ? cxPl(s.indispCount, 'bem', 'bens') : 'nenhum bem', { onClick: s.indispCount ? () => p.onTab('bens') : null })}
      {stat('Cobertura', (s.covPct != null ? s.covPct + '%' : '—'), 'pelos incidentes', { tip: 'Parte do valor das execuções coberta por IDPJ ou cautelar' })}
      {stat('Prescrição · CDAs', s.prescA, 'nos grupos urgentes', { tone: s.prescA ? 'violet' : '', onClick: p.onOpenPrazos })}
      {stat('Processos em alerta', s.prescExec, 'crítico, alerta ou vencido', { tone: s.prescExec ? 'violet' : '', onClick: () => p.onTab('prescricao_v2') })}
      {stat('Intimações', s.openIntims, s.overdueIntims ? cxPl(s.overdueIntims, 'vencida', 'vencidas') : 'nenhuma vencida', { tone: s.overdueIntims ? 'red' : '' })}
      {stat('Tarefas', s.openTasks, s.overdueTasks ? cxPl(s.overdueTasks, 'vencida', 'vencidas') : 'em aberto', { tone: s.overdueTasks ? 'red' : '', onClick: () => p.onTab('tarefas') })}
    </div> : null}
    <div className="cx-sub-h"><h2>Linha do tempo</h2><span className="cx-sp" /><CxSeg label="Escala" value={scale} onChange={setScale} options={[['semanas', 'Semanas'], ['meses', 'Meses'], ['anos', 'Anos']]} /></div>
    <EditionClaudeTimeline data={data} op={op} prescLookup={p.prescLookup} scale={scale} setScale={setScale} onOpenIntim={p.onOpenIntim} onOpenHearing={p.onOpenHearing} onOpenCda={p.onOpenCda} />
    <div className="cx-home-grid" style={{ marginTop: 22 }}>
      <section className="cx-card">
        <div className="cx-card-h"><h2>Intimações abertas</h2><div className="cx-aside"><span className="cx-count">{open.length}</span></div></div>
        {open.length ? open.slice(0, 10).map(i => <button key={i.id} type="button" className="cx-q-row cx-q-compact" onClick={() => p.onOpenIntim(i.id)}>
          <span className="cx-q-ic"><CxStatusIcon s={i.status} /></span>
          <span className="cx-q-main"><span className="cx-q-title">{intimIsUrgent(i) ? <span className="cx-urg">URGENTE</span> : null}<b>{cxPartyName(i)}</b></span><span className="cx-q-meta">{i.eventDescription || i.className}</span></span>
          <span className="cx-q-glyph"><CxImp intim={i} /></span>
          <span className="cx-q-due"><CxDue iso={i.dateDeadline} /></span>
        </button>) : <div className="cx-empty-row">Nenhuma intimação aberta nesta operação.</div>}
        {open.length > 10 ? <div className="cx-more">+{open.length - 10} na lista de Intimações</div> : null}
      </section>
      <div className="cx-col">
        <section className="cx-card">
          <div className="cx-card-h"><h2>Prazos extintivos</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={p.onOpenPrazos}>Mesa<CxIcon n="chevR" s={13} /></button></div></div>
          {split.needsYou.length ? split.needsYou.slice(0, 5).map(r => <button key={r.id} type="button" className="cx-dl-item" onClick={() => p.onOpenCda(r)}>
            <span className="cx-gnum" style={{ '--c': CX_GROUP_C[r.group] }}>{r.group}</span>
            <span className="cx-t"><span className="cx-mono" style={{ fontSize: 11.5 }}>{r.cdaNumber || 'S/N'}</span> · {betaSafeUiText(r.why || r.prescLabel || '')}</span>
            <span className="cx-due late">{formatPrescHorizon(r.prescDays)}</span>
          </button>) : <div className="cx-empty-row">Nada exige decisão agora{split.rest.length ? ' · ' + cxPl(split.rest.length, 'CDA no radar', 'CDAs no radar') + ', sem alarme' : ''}.</div>}
          <div style={{ height: 6 }} />
        </section>
        <section className="cx-card">
          <div className="cx-card-h"><h2>Agenda</h2><div className="cx-aside"><span className="cx-count">{hearings.length + tasks.length}</span></div></div>
          {hearings.slice(0, 3).map(h => <button key={h.id} type="button" className="cx-dl-item" onClick={() => p.onOpenHearing(h)}><CxIcon n="gavel" s={13} className="cx-muted" /><span className="cx-t">{(CX_HEARING[h.hearingType] || 'Audiência') + (h.time ? ' · ' + h.time : '')}</span><CxDue iso={h.date} /></button>)}
          {tasks.slice(0, 5).map(t => <button key={t.id} type="button" className="cx-dl-item" onClick={() => p.onOpenTask(t)}><CxPrio v={t.priority} /><span className="cx-t">{t.title || t.description || 'Tarefa'}</span>{t.dueDate ? <CxDue iso={t.dueDate} /> : <span className="cx-muted cx-small">sem data</span>}</button>)}
          {!hearings.length && !tasks.length ? <div className="cx-empty-row">Sem audiências marcadas nem tarefas abertas.</div> : null}
          <div style={{ height: 6 }} />
        </section>
      </div>
    </div>
  </div>;
}

/* ═════════════════════ Prazos extintivos — Mesa ═════════════════════ */
function CxMesaRow({ r, debt, a }) {
  const [snooze, setSnooze] = React.useState(null);
  const [parc, setParc] = React.useState('');
  const cert = mesaCertainty(r);
  const isParc = r.action && r.action.type === 'criar_evento' && r.action.eventType === 'susp_parcelamento';
  const act = r.action && r.action.type;
  const actLabel = act === 'criar_evento' ? 'Lançar fato' : act === 'vincular_ef' ? 'Vincular EF' : act === 'corrigir_ficha' ? 'Corrigir ficha' : act === 'lancar_ciencia' ? 'Lançar ciência' : 'Agir';
  const today = localIso(new Date());
  const expired = !!(debt && debt.prescSnooze);
  const horizon = formatPrescHorizon(r.prescDays);
  const seg = r.prescSegment || r.clock;
  const clock = seg === 'ordinaria' || seg === 'credito' ? 'Ordinária' : seg === 'intercorrente' ? 'Intercorrente' : seg === 'decadencia' ? 'Decadência' : null;
  const vencido = isG1Vencido(r);
  return <div className={'cx-mesa-row g' + r.group + (vencido ? ' venc' : '')} style={{ '--c': CX_GROUP_C[r.group] }}>
    <div className="cx-mesa-main">
      <div className="cx-mesa-id">
        <span className="cx-gnum" title={'Grupo ' + r.group + ' · ' + (PRAZOS_GROUP_LABELS[r.group] || '')}>{r.group}</span>
        <span className="cx-mono cx-mesa-cda">{r.cdaNumber || 'S/N'}</span>
        <span className={'cx-cert ' + cert} title={CX_CERT_TIP[cert]}>{CX_CERT[cert]}</span>
        {clock ? <span className="cx-tag">{clock}</span> : null}
        {expired ? <span className="cx-tag orange">o adiamento venceu</span> : null}
      </div>
      <div className="cx-mesa-why">{betaSafeUiText(r.why || r.prescLabel || r.summary || '') || 'Prazo em acompanhamento.'}</div>
      <div className="cx-mesa-meta">
        {r.opName ? <span className="cx-op-tag"><span className="cx-op-sq" style={{ background: cxOpColor(r.operationId) }} /><span className="cx-ell">{String(r.opName).replace(/^Opera[çc][ãa]o\s+/i, '')}</span></span> : null}
        {r.processNumber ? <CxProc num={r.processNumber} /> : <span className="cx-muted">sem processo</span>}
        {r.personName ? <span className="cx-ell cx-muted">{r.personName}</span> : null}
      </div>
    </div>
    <div className="cx-mesa-side">
      <span className={'cx-mesa-when' + (vencido ? ' red' : '')}>{horizon || (r.keyDate ? cxDM(r.keyDate) : '—')}</span>
      {r.keyDate && horizon ? <span className="cx-mesa-date">{fmtDate(r.keyDate)}</span> : null}
      <span className="cx-mesa-val">{fmtCur(r.value || 0)}</span>
    </div>
    <div className="cx-mesa-acts">
      {act && act !== 'nenhuma' && act !== 'conferir_autos' && !isParc ? <button type="button" className="cx-btn sm primary" onClick={() => a.applyAction(r)}>{actLabel}</button> : null}
      {isParc ? <span className="cx-mesa-parc">
        <input id={'cx-parc-' + r.id} type="date" className="cx-input" value={parc} onChange={e => setParc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && parc) a.inlineParc(r, parc); }} aria-label="Data da adesão ao parcelamento" />
        <button type="button" className="cx-btn sm primary" disabled={!parc} onClick={() => { a.inlineParc(r, parc); setParc(''); }}>Lançar adesão</button>
      </span> : null}
      <button type="button" className="cx-btn sm" onClick={() => a.openEvent(r)}>Evento</button>
      <button type="button" className="cx-btn sm" onClick={() => a.openCda(r)}>Abrir</button>
      <button type="button" className="cx-btn sm ghost" onClick={() => a.applyAction({ ...r, action: { type: 'conferir_autos' } })}>Conferir</button>
      <button type="button" className="cx-btn sm ghost" onClick={() => setSnooze(snooze ? null : { reason: 'aguardando_certidao', until: snoozeMaxUntil(r.group, today), note: '' })} aria-expanded={!!snooze}>Adiar…</button>
    </div>
    {snooze ? <form className="cx-snooze" onSubmit={e => { e.preventDefault(); if (snooze.reason === 'outro' && !snooze.note.trim()) return; a.snooze(r, snooze.reason, snooze.until, snooze.note); setSnooze(null); }}>
      <label>Motivo<select id={'cx-sz-r-' + r.id} className="cx-input" value={snooze.reason} onChange={e => setSnooze({ ...snooze, reason: e.target.value })}>{Object.entries(PRESC_SNOOZE_REASONS).map(([k, lab]) => <option key={k} value={k}>{lab}</option>)}</select></label>
      <label>Volta à mesa em<input id={'cx-sz-u-' + r.id} type="date" className="cx-input" min={today} max={snoozeMaxUntil(r.group, today)} value={snooze.until} onChange={e => setSnooze({ ...snooze, until: e.target.value })} /></label>
      {snooze.reason === 'outro' ? <label className="cx-snooze-note">Descreva (obrigatório)<input id={'cx-sz-n-' + r.id} className="cx-input" value={snooze.note} onChange={e => setSnooze({ ...snooze, note: e.target.value })} placeholder="Por que adiar" autoFocus /></label> : null}
      <span className="cx-snooze-hint">Limite deste grupo: {snoozeLimitDays(r.group)} dias. Volta antes se entrar fato novo ou o grupo piorar.</span>
      <span className="cx-snooze-acts"><button type="button" className="cx-btn sm ghost" onClick={() => setSnooze(null)}>Cancelar</button><button type="submit" className="cx-btn sm primary" disabled={snooze.reason === 'outro' && !snooze.note.trim()}>Adiar</button></span>
    </form> : null}
  </div>;
}
function EditionClaudePrazos(p) {
  const { data, prazosRadar, pf, setPf, a } = p;
  const [overOpen, setOverOpen] = React.useState(false);
  const [restOpen, setRestOpen] = React.useState(false);
  const [silOpen, setSilOpen] = React.useState(false);
  const today = localIso(new Date());
  const opsOpen = (data.operations || []).filter(o => o.status !== 'encerrada').slice().sort(sortOpsByName);
  let rows = [...(prazosRadar.rows || [])];
  if (pf.operationId) rows = rows.filter(r => r.operationId === pf.operationId);
  const personIds = (pf.personId && pf.personId !== 'all') ? cdaIdsForPerson(data.links && data.links.cdaResponsibilities, pf.personId) : null;
  if (personIds) rows = rows.filter(r => personIds.has(r.id));
  const consumadas = rows.filter(r => r.group === 6 && rowShowsInConsumada(r)).length;
  rows = rows.filter(r => r.group !== 6);
  if (pf.q) {
    const raw = String(pf.q).toLowerCase(), qd = raw.replace(/\D/g, '');
    rows = rows.filter(r => (r.cdaNumber || '').toLowerCase().includes(raw) || (qd && (r.processNumber || '').replace(/\D/g, '').includes(qd)) || (r.personName || '').toLowerCase().includes(raw) || (r.opName || '').toLowerCase().includes(raw));
  }
  const split = splitMesaRows(rows, today);
  const drawer = mesaDrawerItems({ rows, silenced: prazosRadar.silenced || [], hideG5: true });
  const dueWeek = countSnoozeDueThisWeek(prazosRadar.silenced || [], today);
  const debtById = new Map((data.debts || []).map(d => [d.id, d]));
  const opName = (id) => { const o = (data.operations || []).find(x => x.id === id); return o ? cxOpName(o) : ''; };
  const needs = split.needsYou.concat(split.overCap);
  const needsValue = needs.reduce((s, r) => s + (r.value || 0), 0);
  const restByGroup = [1, 2, 3, 4].map(g => ({ g, rows: split.rest.filter(r => r.group === g) })).filter(x => x.rows.length);
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Prazos extintivos</h1><p>Vermelho só no que pede ato hoje. O resto fica à vista, contado e sem alarme. Nada some: o que sai da fila vai para Silenciados, com data para voltar.</p></div>
      <div className="cx-acts">
        <button type="button" className="cx-btn ghost" onClick={p.onOpenRules}><CxIcon n="book" s={14} />Regras</button>
        <CxSeg className="lg" label="Modo" value="mesa" onChange={v => { if (v === 'lista') p.onLista(); }} options={[['mesa', 'Mesa'], ['lista', 'Lista completa']]} />
      </div>
    </div>
    <div className="cx-pz-sum">
      <button type="button" className="cx-pz-tile need" onClick={() => document.getElementById('cx-pz-need') && document.getElementById('cx-pz-need').scrollIntoView({ behavior: 'smooth', block: 'start' })}>
        <span className="cx-pz-l">Precisa de você</span><span className="cx-pz-v">{needs.length}</span><span className="cx-pz-s">{needs.length ? cxMoneyShort(needsValue) + ' em jogo' : 'nada exige decisão agora'}</span>
      </button>
      <button type="button" className="cx-pz-tile" onClick={() => setRestOpen(true)}>
        <span className="cx-pz-l">No radar, sem alarme</span><span className="cx-pz-v">{split.rest.length}</span><span className="cx-pz-s">{[1, 2, 3, 4].map(g => 'G' + g + ' ' + split.rest.filter(r => r.group === g).length).join(' · ')}</span>
      </button>
      <button type="button" className="cx-pz-tile" onClick={() => setSilOpen(true)}>
        <span className="cx-pz-l">Silenciados</span><span className="cx-pz-v">{drawer.length}</span><span className={'cx-pz-s' + (dueWeek ? ' orange' : '')}>{dueWeek ? cxPl(dueWeek, 'volta esta semana', 'voltam esta semana') : 'parcelados, adiados e ainda impossíveis'}</span>
      </button>
      <button type="button" className="cx-pz-tile" onClick={p.onConsumadas} disabled={!consumadas}>
        <span className="cx-pz-l">Consumadas</span><span className="cx-pz-v">{consumadas}</span><span className="cx-pz-s">para análise, fora do alarme</span>
      </button>
    </div>
    <div className="cx-toolbar">
      <CxSelect id="cx-pz-op" pre="Operação" value={pf.operationId || ''} onChange={v => setPf({ operationId: v, personId: 'all' })} options={[['', 'Todas']].concat(opsOpen.map(o => [o.id, cxOpName(o)]))} />
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-pz-q" value={pf.q || ''} onChange={e => setPf({ q: e.target.value })} placeholder="CDA, processo ou devedor" aria-label="Buscar CDA" /></label>
    </div>
    {pf.operationId ? <div className="cx-pz-people"><PersonSubtabs data={data} opId={pf.operationId} currentFilter={pf.personId || 'all'} onChange={id => setPf({ personId: id })} mode="cda" /></div> : null}

    <section className="cx-card cx-pz-block" id="cx-pz-need">
      <div className="cx-card-h"><h2>Precisa de você</h2><div className="cx-aside"><span className="cx-muted cx-small">até {MESA_CAP} por vez, dos mais graves para os menos graves</span></div></div>
      {split.needsYou.length === 0 && split.overCap.length === 0 ? <div className="cx-empty-row">Nada exige decisão agora. O restante está abaixo, sem alarme.</div> : null}
      {split.needsYou.map(r => <CxMesaRow key={r.id} r={r} debt={debtById.get(r.id)} a={a} />)}
      {split.overCap.length ? <button type="button" className="cx-pz-more" onClick={() => setOverOpen(v => !v)} aria-expanded={overOpen}>{overOpen ? 'Esconder' : 'Mostrar'} {cxPl(split.overCap.length, 'item acima do limite', 'itens acima do limite')}<CxIcon n={overOpen ? 'chevU' : 'chevD'} s={13} /></button> : null}
      {overOpen ? split.overCap.map(r => <CxMesaRow key={r.id} r={r} debt={debtById.get(r.id)} a={a} />) : null}
    </section>

    <section className="cx-card cx-pz-block">
      <button type="button" className="cx-pz-fold" onClick={() => setRestOpen(v => !v)} aria-expanded={restOpen}>
        <span className="cx-caret" style={{ transform: restOpen ? 'none' : 'rotate(-90deg)' }}><CxIcon n="chevD" s={14} /></span>
        <b>No radar, sem alarme</b><span className="cx-n">{split.rest.length}</span>
        <span className="cx-pz-fold-s">{restByGroup.map(x => (PRAZOS_GROUP_LABELS[x.g] || 'G' + x.g) + ' ' + x.rows.length).join(' · ')}{split.hiddenG5.length ? ' · ainda impossível ' + split.hiddenG5.length + ' (em Silenciados)' : ''}</span>
      </button>
      {restOpen ? (restByGroup.length ? restByGroup.map(x => <div key={x.g}>
        <div className="cx-pz-gh"><span className="cx-gnum" style={{ '--c': CX_GROUP_C[x.g] }}>{x.g}</span>{PRAZOS_GROUP_LABELS[x.g]}<span className="cx-n">{x.rows.length}</span></div>
        {x.rows.map(r => <CxMesaRow key={r.id} r={r} debt={debtById.get(r.id)} a={a} />)}
      </div>) : <div className="cx-empty-row">Nada neste recorte além do bloco de cima.</div>) : null}
    </section>

    <section className="cx-card cx-pz-block">
      <button type="button" className="cx-pz-fold" onClick={() => setSilOpen(v => !v)} aria-expanded={silOpen}>
        <span className="cx-caret" style={{ transform: silOpen ? 'none' : 'rotate(-90deg)' }}><CxIcon n="chevD" s={14} /></span>
        <b>Silenciados</b><span className="cx-n">{drawer.length}</span>
        {dueWeek ? <span className="cx-pz-fold-s orange">{cxPl(dueWeek, 'adiamento vence', 'adiamentos vencem')} esta semana</span> : <span className="cx-pz-fold-s">fora do alarme, com motivo e data para voltar</span>}
      </button>
      {silOpen ? (drawer.length ? drawer.map(item => {
        const d = debtById.get(item.debtId);
        const reason = PRESC_SNOOZE_REASONS[item.reason] || (item.reason === 'aguardando_reconhecimento' ? 'Aguardando decisão' : item.reason === 'ainda_impossivel' ? 'Ainda impossível' : item.reason === 'parcelamento_vigente' ? 'Parcelamento vigente' : (item.reason || 'Fora da fila'));
        return <div key={item.id} className="cx-sil-row">
          <span className="cx-mono cx-mesa-cda">{(d && d.cdaNumber) || item.debtId}</span>
          <span className="cx-sil-why cx-ell">{item.label && item.label !== reason ? item.label : [d && d.operationId && opName(d.operationId), d && (d.tribute || d.origin)].filter(Boolean).join(' · ') || reason}</span>
          <span className="cx-sil-until">{reason}{item.until ? ' · até ' + fmtDate(item.until) : ''}</span>
          {item.canReopen ? <button type="button" className="cx-btn sm" onClick={() => a.clearSnooze(item.debtId)}>Reabrir agora</button> : <span />}
        </div>;
      }) : <div className="cx-empty-row">Nada silenciado.</div>) : null}
    </section>
    <div className="cx-pz-legend">
      <span><span className="cx-cert calculado">Calculado</span>{CX_CERT_TIP.calculado}</span>
      <span><span className="cx-cert estimado">Estimado</span>{CX_CERT_TIP.estimado}</span>
      <span><span className="cx-cert cadastro">Cadastro</span>{CX_CERT_TIP.cadastro}</span>
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
function cxLs(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
function cxLsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
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
      {t.status === 'concluida' ? <span className="cx-due done">✓ {t.updatedAt ? cxDM(t.updatedAt) : ''}</span> : <CxDue iso={t.dueDate} />}
      <span className="cx-sub">{t.status === 'concluida' ? 'concluída' : t.dueDate ? 'limite ' + cxDM(t.dueDate) : 'sem data'}</span>
    </div>
  </div>;
}
function cxGroupTasks(items, by, opsById) {
  const dot = (c) => <span className="cx-dot" style={{ background: c }} />;
  if (by === 'operacao') {
    const ids = [];
    items.forEach(t => { const k = t.operationId || ''; if (!ids.includes(k)) ids.push(k); });
    return ids.map(id => { const op = opsById.get(id); return { key: 'op' + id, label: op ? cxOpName(op) : 'Avulsas (sem operação)', sortKey: op ? cxOpName(op) : '￿', icon: op ? <span className="cx-op-sq" style={{ background: cxOpColor(op.id) }} /> : dot('var(--cx-line-strong)'), items: items.filter(t => (t.operationId || '') === id) }; })
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
  const done = filtered.filter(t => t.status === 'concluida').sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
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
      <CxSeg label="Quais tarefas" value={scope} onChange={setScope} options={[['globais', 'Globais e avulsas'], ['todas', 'Todas', null, hidden || null]]} />
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
  return buildAgendaByDay(data, prazosRadar, fromIso, toIso, opF, {
    hearingLabel: (t) => CX_HEARING[t] || 'Audiência',
    partyName: cxPartyName,
    intimOnAgenda: intimPrazoNaAgenda,
    isUrgentIntim: intimIsUrgent,
    taskOpen: cxTaskOpen,
    safeText: betaSafeUiText,
  });
}
function CxAgItem({ it, opsById, compact, onOpen }) {
  const op = opsById.get(it.op);
  return <button type="button" className={'cx-ag-it k-' + it.kind + (compact ? ' compact' : '')} style={{ '--c': CX_AG_C[it.kind] }} onClick={() => onOpen(it)}
    title={[it.time, it.title, it.sub, op ? op.name : ''].filter(Boolean).join(' · ')}>
    <span className="cx-ag-t">{it.urgent ? <span className="cx-ag-urg" aria-label="urgente">!</span> : null}{it.time ? <b className="cx-mono">{it.time}</b> : null}<span className="cx-ell">{it.title}</span></span>
    {compact ? null : <>
      {it.sub ? <span className="cx-ag-s">{it.sub}</span> : null}
      {op ? <span className="cx-ag-op"><span className="cx-op-sq" style={{ background: cxOpColor(op.id) }} /><span className="cx-ell">{cxOpName(op)}</span></span> : null}
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
  const [view, setViewS] = React.useState(() => cxLs('nexus_cx_ag_view', 'semana'));
  const setView = (v) => { setViewS(v); cxLsSet('nexus_cx_ag_view', v); };
  const [anchor, setAnchor] = React.useState(() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; });
  const [kinds, setKindsS] = React.useState(() => { try { const v = JSON.parse(localStorage.getItem('nexus_cx_ag_kinds') || 'null'); return v && typeof v === 'object' ? v : { aud: true, prazo: true, tarefa: true, presc: true }; } catch (e) { return { aud: true, prazo: true, tarefa: true, presc: true }; } });
  const setKinds = (v) => { setKindsS(v); cxLsSet('nexus_cx_ag_kinds', JSON.stringify(v)); };
  const [opFRaw, setOpF] = React.useState('all');
  const [pastOpen, setPastOpen] = React.useState(false);
  const todayIso = localIso(new Date());
  let days, label;
  if (view === 'mes') {
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
  const shift = (n) => { const d = new Date(anchor); if (view === 'mes') { d.setDate(1); d.setMonth(d.getMonth() + n); } else d.setDate(d.getDate() + (view === 'lista' ? 30 : 7) * n); setAnchor(d); };
  const goToday = () => { const d = new Date(); d.setHours(12, 0, 0, 0); setAnchor(d); };
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
      {CX_AG_KINDS.map(k => <button key={k[0]} type="button" className={'cx-fchip' + (kinds[k[0]] ? ' on' : '')} style={{ '--c': k[2] }} aria-pressed={!!kinds[k[0]]} onClick={() => setKinds({ ...kinds, [k[0]]: !kinds[k[0]] })}>
        <span className="cx-dot" style={{ background: k[2] }} />{k[1]}<span className="cx-n">{counts[k[0]]}</span>
      </button>)}
      <span className="cx-muted cx-small cx-ag-total">{cxPl(total, 'item', 'itens')} neste período</span>
    </div>
    {view === 'lista' ? <div className="cx-list cx-ag-list">
      {days.filter(d => (byDay[localIso(d)] || []).length).map(d => { const k = localIso(d); return <div key={k} className="cx-ag-lday">
        <div className={'cx-ag-lh' + (k === todayIso ? ' today' : '')}>{dayHead(d)}<span className="cx-muted cx-small">{CX_DOW_L[d.getDay()]}, {d.getDate()} de {CX_MES_L[d.getMonth()]}</span><span className="cx-n" style={{ marginLeft: 'auto' }}>{byDay[k].length}</span></div>
        <div className="cx-ag-lits">{byDay[k].map(it => <CxAgItem key={it.id} it={it} opsById={opsById} onOpen={open} />)}</div>
      </div>; })}
      {!total ? <div className="cx-empty-row" style={{ borderTop: 0 }}>Nada nos próximos 30 dias com esses filtros.</div> : null}
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
  const sub = d.type === 'intimation' ? (x.eventDescription || x.className || '') : d.type === 'task' ? (x.description || '') : ((CX_HEARING[x.hearingType] || 'Audiência') + (x.time ? ' · ' + x.time : '') + (x.location ? ' · ' + x.location : ''));
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
      <div><h1>Mesa de trabalho</h1><p>{items.length ? cxPl(items.length, 'item em foco', 'itens em foco') + '. ' : ''}O que você escolheu atacar agora. Tirar da mesa não conclui nada: o item continua na sua lista.</p></div>
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
function EditionClaudeOpHeader(p) {
  const { op, opStats: s, activeTab } = p;
  const rs = cxRS(op);
  const cls = getOpClassifications(op);
  const onPartes = activeTab === 'pessoas' || activeTab === 'bens';
  const sum = [];
  if (s) {
    sum.push(<span key="d"><b>{cxMoneyShort(s.total)}</b> em dívida</span>);
    sum.push(<span key="g">{s.total ? Math.round(s.guar / s.total * 100) : 0}% garantido</span>);
    sum.push(<span key="c">{cxPl(s.debts, 'CDA', 'CDAs')}</span>);
    sum.push(<span key="e">{cxPl(s.execs, 'processo', 'processos')}</span>);
    sum.push(<span key="i" className={s.overdueIntims ? 'cx-red-t' : ''}>{cxPl(s.openIntims, 'intimação aberta', 'intimações abertas')}{s.overdueIntims ? ' · ' + cxPl(s.overdueIntims, 'vencida', 'vencidas') : ''}</span>);
    if (s.prescA) sum.push(<button key="p" type="button" className="cx-violet-t cx-oph-link" onClick={p.onOpenPrazos}>{cxPl(s.prescA, 'CDA no alarme de prescrição', 'CDAs no alarme de prescrição')}</button>);
  }
  return <div className="cx cx-oph">
    <div className="cx-oph-top">
      <div className="cx-minw0 cx-oph-main">
        <div className="cx-oph-name">
          <span className="cx-sq-lg" style={{ background: cxOpColor(op.id) }} />
          <h1 className="cx-ell" title={op.name}>{op.name}</h1>
          {op.status === 'encerrada' ? <span className="cx-tag">Encerrada</span> : null}
          {cxOpPrioTag(op)}
          <span className="cx-oph-tags">{cls.map(cxClsTag)}{cxReviewTag(op)}</span>
        </div>
        {sum.length ? <div className="cx-oph-sum">{sum}</div> : null}
      </div>
      <div className="cx-op-actions">
        <button type="button" className={'cx-btn sm' + (rs.overdue ? ' primary' : '')} onClick={p.onReviewed} title="Marcar a operação como revisada hoje"><CxIcon n="tick" s={13} />Revisada</button>
        <button type="button" className="cx-btn sm" onClick={p.onEdit}><CxIcon n="edit" s={13} />Editar</button>
        <button type="button" className="cx-btn sm ghost" onClick={p.onDiag}>Diagnóstico</button>
        <button type="button" className="cx-btn sm ghost" onClick={p.onReport} title="Relatório de passagem de serviço (HTML)"><CxIcon n="file" s={13} />Relatório</button>
      </div>
    </div>
    <nav className="cx-optabs cx-oph-tabs" aria-label="Abas da operação">
      <button type="button" onClick={() => p.onTab('visao')}>Visão geral</button>
      {CX_OP_TABS.map(t => <button key={t[0]} type="button" className={cxTabOn(activeTab, t[0]) ? 'on' : ''} aria-current={cxTabOn(activeTab, t[0]) ? 'page' : undefined} onClick={() => { if (!(t[0] === 'pessoas' && onPartes)) p.onTab(t[0]); }}>{t[1]}</button>)}
    </nav>
    {onPartes ? <div className="cx-oph-sub">
      <CxSeg className="lg" label="Partes ou bens" value={activeTab} onChange={p.onTab} options={[['pessoas', 'Partes', null, s ? s.people : null], ['bens', 'Bens', null, s ? s.assets : null]]} />
      <span className="cx-muted cx-small">{activeTab === 'pessoas' ? 'Alvos e pessoas relacionadas, com a exposição de cada uma.' : 'Bens por situação, com titular, origem e processo.'}</span>
    </div> : null}
  </div>;
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
        {w.processNumber ? <a className="cx-a" href={cxEprocUrl(w.processNumber)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Abrir no eproc">eproc<CxIcon n="arrowUR" s={11} /></a> : null}
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
  const tile = (k, label, n, sub, tone) => <button key={k} type="button" className={'cx-pz-tile' + (scope === k ? ' on' : '')} onClick={() => setScope(k)} aria-pressed={scope === k}>
    <span className="cx-pz-l">{label}</span><span className={'cx-pz-v' + (tone ? ' ' + tone : '')}>{n}</span><span className="cx-pz-s">{sub}</span></button>;
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Acompanhar</h1><p>Processos que você monitora depois de uma manifestação pontual, quando não há garantia de nova intimação. O que passa de {CX_WATCH_STALE} dias sem conferência sobe na lista.</p></div>
      <div className="cx-acts"><button type="button" className="cx-btn primary" onClick={p.onNew}><CxIcon n="plus" s={14} />Acompanhar processo</button></div>
    </div>
    <div className="cx-pz-sum cx-w-sum">
      {tile('abertos', 'Em acompanhamento', counts.abertos, cxPl(counts.aguardando, 'aguardando', 'aguardando') + ' · ' + counts.movimentado + ' movimentado' + (counts.movimentado === 1 ? '' : 's'))}
      {tile('atencao', 'Sem conferência há ' + CX_WATCH_STALE + '+ dias', counts.atencao, counts.atencao ? 'vale abrir o eproc' : 'tudo conferido na semana', counts.atencao ? 'orange' : '')}
      {tile('movimentado', 'Movimentados', counts.movimentado, 'houve andamento; decida o próximo passo')}
      {tile('encerrados', 'Encerrados', counts.encerrados, 'histórico')}
    </div>
    <div className="cx-toolbar">
      <label className="cx-field"><CxIcon n="search" s={14} /><input id="cx-watch-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Processo, partes, motivo ou nota" aria-label="Filtrar acompanhamentos" /></label>
      <CxSelect id="cx-watch-op" pre="Operação" value={opF} onChange={setOpF} options={opOptions} label="Filtrar por operação" />
      <CxSeg label="Situação" value={scope} onChange={setScope} options={[['abertos', 'Abertos'], ['aguardando', 'Aguardando'], ['movimentado', 'Movimentados'], ['encerrados', 'Encerrados']]} />
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
/* Mesmas opções e rótulos da ordenação do Painel clássico (estado carteiraSort do app). */
const CX_PANEL_SORTS = [
  ['Financeiro', [['valor_desc', 'Maior valor de crédito'], ['valor_asc', 'Menor valor de crédito'], ['cobertura_asc', 'Menor cobertura de garantia']]],
  ['Risco e urgência', [['presc', 'Maior risco de prescrição'], ['intims', 'Mais intimações abertas'], ['tasks', 'Mais tarefas pendentes']]],
  ['Atividade', [['acesso_recente', 'Acessadas recentemente'], ['revisao_atrasada', 'Revisão mais atrasada']]],
  ['Estratégico', [['idpj', 'Mais IDPJs e cautelares'], ['nome', 'Nome (A a Z)']]],
];
const CX_PANEL_GROUPS = [[1, 'Urgentes'], [2, 'A conferir'], [3, 'A completar'], [4, 'Em acompanhamento'], [5, 'Ainda impossível'], [6, 'Consumadas']];
function cxPanelAnalytics(data, prazosByDebt) {
  const ops = (data.operations || []).filter(o => o.status !== 'encerrada');
  const by = new Map(ops.map(o => [o.id, { op: o, totalValue: 0, guaranteedValue: 0, prescRisk: 0, openIntims: 0, lateIntims: 0, openTasks: 0, debtsCount: 0, execsCount: 0, assetsCount: 0, idpjCount: 0, cautelarCount: 0, daysSinceAccess: null }]));
  (data.debts || []).forEach(d => {
    const x = by.get(d.operationId); if (!x || d.status === 'extinta') return;
    x.debtsCount++; x.totalValue += d.value || 0;
    if (d.status === 'garantida') x.guaranteedValue += d.value || 0;
    const g = (prazosByDebt.get(d.id) || {}).group;
    if (g === 1 || g === 2) x.prescRisk++;
  });
  (data.executions || []).forEach(e => { const x = by.get(e.operationId); if (!x) return; x.execsCount++; if (e.processTag === 'idpj') x.idpjCount++; if (e.processTag === 'cautelar_fiscal') x.cautelarCount++; });
  (data.assets || []).forEach(a => { const x = by.get(a.operationId); if (x) x.assetsCount++; });
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
  const fns = {
    valor_desc: (a, b) => b.totalValue - a.totalValue,
    valor_asc: (a, b) => a.totalValue - b.totalValue,
    presc: (a, b) => b.prescRisk - a.prescRisk || b.totalValue - a.totalValue,
    intims: (a, b) => b.openIntims - a.openIntims || b.totalValue - a.totalValue,
    tasks: (a, b) => b.openTasks - a.openTasks || b.totalValue - a.totalValue,
    cobertura_asc: (a, b) => cov(a) - cov(b),
    acesso_recente: (a, b) => (a.daysSinceAccess === null ? 99999 : a.daysSinceAccess) - (b.daysSinceAccess === null ? 99999 : b.daysSinceAccess),
    revisao_atrasada: (a, b) => (cxRS(a.op).daysLeft ?? 99999) - (cxRS(b.op).daysLeft ?? 99999),
    nome: (a, b) => (a.op.name || '').localeCompare(b.op.name || '', 'pt-BR'),
    idpj: (a, b) => (b.idpjCount + b.cautelarCount) - (a.idpjCount + a.cautelarCount) || b.totalValue - a.totalValue,
  };
  return fns[k] || fns.valor_desc;
}
function EditionClaudePainel(p) {
  const { data, prazosRadar, prazosByDebt } = p;
  const rows = React.useMemo(() => cxPanelAnalytics(data, prazosByDebt), [data, prazosByDebt]);
  const sort = p.sort || 'valor_desc';
  const sorted = rows.slice().sort(cxPanelSortFn(sort));
  const sortLabel = (CX_PANEL_SORTS.flatMap(g => g[1]).find(o => o[0] === sort) || [null, ''])[1];
  const t = prazosRadar.totals || {};
  const gN = (g) => (t[g] && t[g].n) || 0;
  const gV = (g) => (t[g] && t[g].value) || 0;
  // Indicadores: mesmo escopo do Painel clássico (todas as CDAs não extintas); a tabela cobre as operações ativas.
  const liveDebts = (data.debts || []).filter(d => d.status !== 'extinta');
  const kpiCredito = liveDebts.reduce((s, d) => s + (d.value || 0), 0);
  const kpiGarantido = liveDebts.filter(d => d.status === 'garantida').reduce((s, d) => s + (d.value || 0), 0);
  const pctGar = kpiCredito > 0 ? Math.round(kpiGarantido / kpiCredito * 100) : 0;
  const totalCredito = rows.reduce((s, o) => s + o.totalValue, 0);
  const totalGarantido = rows.reduce((s, o) => s + o.guaranteedValue, 0);
  const pctGarAtivas = totalCredito > 0 ? Math.round(totalGarantido / totalCredito * 100) : 0;
  const nExecs = (data.executions || []).length;
  const openIntims = (data.intimations || []).filter(x => intimIsOpenWork(x));
  const lateIntims = openIntims.filter(x => { const dd = daysUntil(x.dateDeadline); return dd !== null && dd < 0; }).length;
  const riskN = gN(1) + gN(2), riskV = gV(1) + gV(2);
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
  const colSort = (k, extra) => ({ onClick: () => p.setSort(k), onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.setSort(k); } }, tabIndex: 0, className: 'cx-th-sort' + (sort === k ? ' on' : '') + (extra ? ' ' + extra : ''), 'aria-sort': sort === k ? (k === 'valor_asc' || k === 'cobertura_asc' || k === 'nome' || k === 'acesso_recente' || k === 'revisao_atrasada' ? 'ascending' : 'descending') : undefined });
  if (!(data.operations || []).length) return <div className="cx cx-page"><div className="cx-page-h"><div><h1>Painel</h1><p>Crie a primeira operação para ver a carteira em números.</p></div><div className="cx-acts"><button type="button" className="cx-btn primary" onClick={p.onNewOp}><CxIcon n="plus" s={14} />Nova operação</button></div></div></div>;
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-page-h">
      <div><h1>Painel</h1><p>A carteira inteira em números: onde está o crédito, quanto está garantido e onde está o risco. Clique numa operação para abri-la.</p></div>
    </div>
    <div className="cx-kpis cx-kpis-5">
      <div className="cx-kpi cx-kpi-static">
        <span className="cx-kpi-l"><CxIcon n="briefcase" s={14} />Crédito sob gestão</span>
        <span className="cx-kpi-v">{cxMoneyShort(kpiCredito)}</span>
        <span className="cx-kpi-s">{cxPl(liveDebts.length, 'CDA', 'CDAs')} · {cxPl(rows.length, 'operação ativa', 'operações ativas')}{(data.operations || []).length > rows.length ? ' de ' + (data.operations || []).length : ''} · {cxPl(nExecs, 'processo', 'processos')}</span>
      </div>
      <div className="cx-kpi cx-kpi-static" title={'Soma das CDAs com status Garantida: ' + fmtCur(kpiGarantido)}>
        <span className="cx-kpi-l"><CxIcon n="check" s={14} />Garantido</span>
        <span className="cx-kpi-v">{pctGar}<small>%</small></span>
        <span className="cx-meter" aria-hidden="true"><i style={{ width: pctGar + '%' }} /></span>
        <span className="cx-kpi-s">{cxMoneyShort(kpiGarantido)} em CDAs garantidas</span>
      </div>
      <button type="button" className="cx-kpi" onClick={p.onOpenPrazos} title="Mesmos números da tela Prazos extintivos (grupos 1 e 2)">
        <span className="cx-kpi-l"><CxIcon n="hourglass" s={14} />Risco prescricional</span>
        <span className="cx-kpi-v">{riskN}<small>{riskN === 1 ? 'CDA' : 'CDAs'}</small></span>
        <span className={'cx-kpi-s' + (riskN ? ' violet' : '')}>{riskN ? cxMoneyShort(riskV) + ' em risco' : 'situação controlada'}</span>
      </button>
      <button type="button" className="cx-kpi" onClick={p.onOpenIntims}>
        <span className="cx-kpi-l"><CxIcon n="inbox" s={14} />Intimações abertas</span>
        <span className="cx-kpi-v">{openIntims.length}</span>
        <span className={'cx-kpi-s' + (lateIntims ? ' red' : '')}>{lateIntims ? cxPl(lateIntims, 'vencida', 'vencidas') : 'nenhuma vencida'}</span>
      </button>
      <button type="button" className="cx-kpi" onClick={() => { const el = document.getElementById('cx-panel-rev'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
        <span className="cx-kpi-l"><CxIcon n="history" s={14} />Revisões devidas</span>
        <span className="cx-kpi-v">{due.length}</span>
        <span className={'cx-kpi-s' + (due.length ? ' orange' : '')}>{due.length ? 'operações com revisão atrasada' : 'todas em dia'}</span>
      </button>
    </div>

    <section className="cx-card cx-panel-ops">
      <div className="cx-card-h">
        <h2>Operações</h2><span className="cx-muted cx-small">{sortLabel} · {cxPl(rows.length, 'ativa', 'ativas')}</span>
        <div className="cx-aside">
          <span className="cx-panel-legend" aria-hidden="true"><i className="cx-lg-g" />Garantido<i className="cx-lg-n" />Sem garantia</span>
          <label className="cx-sel"><span className="cx-pre">Ordenar</span>
            <select id="cx-panel-sort" value={sort} onChange={e => p.setSort(e.target.value)} aria-label="Ordenar operações" style={{ paddingLeft: '72px' }}>
              {CX_PANEL_SORTS.map(g => <optgroup key={g[0]} label={g[0]}>{g[1].map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</optgroup>)}
            </select><CxIcon n="chevD" s={12} /></label>
        </div>
      </div>
      <div className="cx-tbl-wrap">
        <table className="cx-tbl cx-panel-tbl">
          <thead><tr>
            <th scope="col" {...colSort('nome')}>Operação</th>
            <th scope="col" {...colSort('valor_desc')}>Crédito</th>
            <th scope="col" {...colSort('cobertura_asc', 'num')}>Garantia</th>
            <th scope="col" {...colSort('presc', 'num')} title="CDAs nos grupos 1 e 2 da tela Prazos extintivos">Prescrição</th>
            <th scope="col" {...colSort('intims', 'num')}>Intimações</th>
            <th scope="col" {...colSort('tasks', 'num')}>Tarefas</th>
            <th scope="col" {...colSort('idpj', 'num')} title="IDPJs e cautelares fiscais">IDPJ · MCF</th>
            <th scope="col" {...colSort('revisao_atrasada')}>Revisão</th>
          </tr></thead>
          <tbody>{sorted.map((o, i) => {
            const pctW = o.totalValue / maxV * 100;
            const gPct = o.totalValue > 0 ? o.guaranteedValue / o.totalValue * 100 : 0;
            const rs = cxRS(o.op);
            return <tr key={o.op.id} className="click" onClick={() => p.onOpenOp(o.op.id)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) p.onOpenOp(o.op.id); }}>
              <td><span className="cx-op-cell"><span className="cx-panel-rank">{i + 1}</span><span className="cx-op-sq" style={{ background: cxOpColor(o.op.id) }} /><span className="cx-ell" title={o.op.name}>{cxOpName(o.op)}</span>{cxOpPrioTag(o.op)}</span>
                <span className="cx-panel-sub">{cxPl(o.debtsCount, 'CDA', 'CDAs')} · {o.execsCount} proc. · {cxPl(o.assetsCount, 'bem', 'bens')}</span></td>
              <td className="cx-panel-bar-td" title={'Crédito ' + fmtCur(o.totalValue) + ' · garantido ' + fmtCur(o.guaranteedValue) + ' (' + Math.round(gPct) + '%)'}>
                <span className="cx-panel-val">{cxMoneyShort(o.totalValue)}</span>
                <span className="cx-panel-bar" style={{ width: Math.max(2, pctW) + '%' }}>{o.guaranteedValue > 0 ? <i className="g" style={{ width: gPct + '%' }} /> : null}{gPct < 100 ? <i className="n" /> : null}</span>
              </td>
              <td className="num"><span className={'cx-pct' + (o.totalValue > 0 && gPct < 25 ? ' cx-orange-t' : '')}>{o.totalValue > 0 ? Math.round(gPct) + '%' : '—'}</span></td>
              <td className="num">{o.prescRisk ? <span className="cx-violet-t cx-mono">{o.prescRisk}</span> : <span className="cx-muted">—</span>}</td>
              <td className="num">{o.openIntims ? <span className="cx-mono">{o.openIntims}{o.lateIntims ? <span className="cx-red-t"> · {o.lateIntims} venc.</span> : null}</span> : <span className="cx-muted">—</span>}</td>
              <td className="num">{o.openTasks ? <span className="cx-mono">{o.openTasks}</span> : <span className="cx-muted">—</span>}</td>
              <td className="num">{o.idpjCount + o.cautelarCount ? <span className="cx-mono">{o.idpjCount}{' · '}{o.cautelarCount}</span> : <span className="cx-muted">—</span>}</td>
              <td>{rs.daysLeft === null ? <span className="cx-muted">—</span> : <span className={rs.overdue ? 'cx-orange-t' : 'cx-muted'}>{rs.label}</span>}</td>
            </tr>;
          })}</tbody>
          <tfoot><tr>
            <td>Total das ativas</td>
            <td><span className="cx-panel-val">{cxMoneyShort(totalCredito)}</span></td>
            <td className="num">{pctGarAtivas}%</td>
            <td className="num">{rows.reduce((s, o) => s + o.prescRisk, 0) || '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.openIntims, 0) || '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.openTasks, 0) || '—'}</td>
            <td className="num">{rows.reduce((s, o) => s + o.idpjCount, 0)}{' · '}{rows.reduce((s, o) => s + o.cautelarCount, 0)}</td>
            <td>{due.length ? cxPl(due.length, 'atrasada', 'atrasadas') : 'em dia'}</td>
          </tr></tfoot>
        </table>
      </div>
    </section>

    <div className="cx-panel-grid">
      <section className="cx-card">
        <div className="cx-card-h"><h2>Prescrição na carteira</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={p.onOpenPrazos}>Mesa<CxIcon n="chevR" s={13} /></button></div></div>
        <div className="cx-panel-groups">{CX_PANEL_GROUPS.map(([g, l]) => <button key={g} type="button" className="cx-panel-g" onClick={() => p.onOpenGroup(g)} title={'Abrir a lista completa filtrada: ' + l}>
          <span className="cx-gnum" style={{ '--c': CX_GROUP_C[g] || 'var(--cx-ink-3)' }}>{g}</span><span className="cx-lbl">{l}</span>
          <span className="cx-mono cx-panel-gn">{gN(g)}</span><span className="cx-muted cx-small cx-panel-gv">{gV(g) ? cxMoneyShort(gV(g)) : ''}</span>
        </button>)}</div>
        <div className="cx-more">Mesmos números da tela Prazos extintivos. Clique num grupo para ver a lista.</div>
      </section>
      <section className="cx-card" id="cx-panel-rev">
        <div className="cx-card-h"><h2>Revisões devidas</h2><div className="cx-aside"><span className="cx-count">{due.length}</span></div></div>
        {due.length ? due.map(o => <div key={o.op.id} className="cx-panel-rev">
          <button type="button" className="cx-op-tag cx-link" onClick={() => p.onOpenOp(o.op.id)} title={'Abrir ' + o.op.name}><span className="cx-op-sq" style={{ background: cxOpColor(o.op.id) }} /><span className="cx-ell">{cxOpName(o.op)}</span></button>
          <span className="cx-orange-t cx-small">{o.rs.label}</span>
          <button type="button" className="cx-btn sm" onClick={() => p.onReviewed(o.op)} title="Marcar a operação como revisada hoje"><CxIcon n="tick" s={12} />Revisada</button>
        </div>) : <div className="cx-empty-row">Nenhuma revisão atrasada.</div>}
        <div style={{ height: 6 }} />
      </section>
      <section className="cx-card">
        <div className="cx-card-h"><h2>Próximos 7 dias</h2><div className="cx-aside"><button type="button" className="cx-link-btn" onClick={p.onOpenAgenda}>Agenda<CxIcon n="chevR" s={13} /></button></div></div>
        <div className="cx-panel-week">
          <button type="button" onClick={p.onOpenAgenda}><span className="cx-dot" style={{ background: CX_AG_C.aud }} /><span className="cx-lbl">Audiências</span><b className="cx-mono">{wk.aud}</b></button>
          <button type="button" onClick={p.onOpenAgenda}><span className="cx-dot" style={{ background: CX_AG_C.prazo }} /><span className="cx-lbl">Finais de prazo</span><b className="cx-mono">{wk.prazo}</b></button>
          <button type="button" onClick={p.onOpenAgenda}><span className="cx-dot" style={{ background: CX_AG_C.tarefa }} /><span className="cx-lbl">Tarefas com data limite</span><b className="cx-mono">{wk.tarefa}</b></button>
        </div>
        <div className="cx-more">O calendário completo, com a prescrição, fica na Agenda.</div>
      </section>
    </div>
  </div>;
}

/* ═════════════════════ Briefing (Nexus Prumo) — fase 7a/7b ═════════════════════
 * Substitui o conteúdo da aba "notas" (rótulo "Briefing") só na edição claude.
 * Não tem estado de dados próprio: lê `op.briefing` e grava pelas mesmas funções
 * do app (upsert, updateBriefing, setModal, setData). O Clássico e a Beta não
 * mudam — continuam com o painel antigo em app.jsx.
 */
const CX_STAGE_SUGGEST_MAX = 3;

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
function EditionClaudeBriefingDiary({ op, upsert, editRequestId, onEditConsumed }) {
  const briefing = op.briefing || {};
  const entries = getBriefingEntries(briefing);
  const [composer, setComposer] = React.useState(null); // null | { mode:'new'|'edit', entry }
  const [draftType, setDraftType] = React.useState('observacao');
  const [draftDate, setDraftDate] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');
  const draftHtmlRef = React.useRef('');

  const materialize = (list) => list.map(en => en._legacy
    ? { id: en.id, type: en.type, html: en.html, pinned: !!en.pinned, eventDate: en.eventDate || '', createdAt: en.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), migrated: true }
    : en);
  const persist = (list) => { upsert('operations', { ...op, briefing: { ...briefing, entries: materialize(list) } }); };

  const openNew = () => { setDraftType('observacao'); setDraftDate(new Date().toISOString().slice(0, 10)); setComposer({ mode: 'new', entry: null }); };
  const openEdit = (en) => { setDraftType(en.type || 'observacao'); setDraftDate(en.eventDate || ''); setComposer({ mode: 'edit', entry: en }); };
  const saveComposer = () => {
    const clean = sanitizeNoteHtml(draftHtmlRef.current);
    if (!htmlToPlainText(clean)) { alert('A entrada está vazia.'); return; }
    const now = new Date().toISOString();
    if (composer.mode === 'new') {
      persist([{ id: uid(), type: draftType, html: clean, pinned: false, eventDate: draftDate || '', createdAt: now, updatedAt: now }, ...entries]);
    } else {
      persist(entries.map(x => x.id === composer.entry.id
        ? { id: x.id, type: draftType, html: clean, pinned: !!x.pinned, eventDate: draftDate || '', createdAt: x.createdAt || now, updatedAt: now, migrated: !!(x.migrated || x._legacy) }
        : x));
    }
    setComposer(null);
  };
  const togglePin = (en) => persist(entries.map(x => x.id === en.id ? { ...x, pinned: !x.pinned, updatedAt: new Date().toISOString() } : x));
  const removeEntry = (en) => { if (!confirm('Excluir esta entrada?')) return; persist(entries.filter(x => x.id !== en.id)); };

  React.useEffect(() => {
    if (!editRequestId) return;
    const en = entries.find(e => e.id === editRequestId);
    if (en) openEdit(en);
    if (onEditConsumed) onEditConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRequestId]);

  const sortKey = (en) => en.eventDate || (en.createdAt || '').slice(0, 10);
  const sorted = [...entries].sort((a, b) => { const p = (!!b.pinned) - (!!a.pinned); if (p) return p; return sortKey(b).localeCompare(sortKey(a)); });
  const countByType = { all: entries.length };
  Object.keys(BRIEFING_ENTRY_TYPES).forEach(k => { countByType[k] = entries.filter(e => (e.type || 'observacao') === k).length; });
  const visible = filterType === 'all' ? sorted : sorted.filter(en => (en.type || 'observacao') === filterType);

  const renderComposer = () => (<div className="cx-bf-diary-composer">
    <div className="cx-bf-diary-composer-hd">
      <select value={draftType} onChange={e => setDraftType(e.target.value)} className="cx-input" style={{ width: 'auto' }}>
        {Object.entries(BRIEFING_ENTRY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} className="cx-input" style={{ width: 'auto' }} title="Data do fato (opcional)" />
      <span className="cx-sp" />
      <button type="button" className="cx-btn sm ghost" onClick={() => setComposer(null)}>Cancelar</button>
      <button type="button" className="cx-btn sm primary" onClick={saveComposer}>{composer.mode === 'new' ? '+ Adicionar' : 'Salvar'}</button>
    </div>
    <RichNoteEditor initialHtml={composer.mode === 'edit' ? (composer.entry.html || '') : ''} placeholder="Registrar risco, estratégia, decisão, providência…" draftRef={draftHtmlRef} autoFocus />
  </div>);

  return (<div className="cx-bf-diary">
    <div className="cx-bf-diary-hd">
      <h5>Diário</h5>
      <div className="cx-bf-diary-filters">
        <button type="button" className={filterType === 'all' ? 'on' : ''} onClick={() => setFilterType('all')}>Todos<i>{countByType.all}</i></button>
        {Object.entries(BRIEFING_ENTRY_TYPES).map(([k, v]) => <button key={k} type="button" className={filterType === k ? 'on' : ''} onClick={() => setFilterType(k)}>{v.label}<i>{countByType[k] || 0}</i></button>)}
      </div>
    </div>
    {!composer && <div className="cx-bf-diary-compose" onClick={openNew}>✎ Registrar risco, estratégia, decisão, providência…</div>}
    {composer && composer.mode === 'new' && renderComposer()}
    {!sorted.length && !composer && <div className="cx-empty-row">Nenhuma entrada. Registre riscos, estratégias, decisões e providências em blocos datados.</div>}
    {sorted.length > 0 && !visible.length && !composer && <div className="cx-empty-row">Nenhuma entrada do tipo selecionado. <span className="cx-link" onClick={() => setFilterType('all')}>Ver todas</span></div>}
    <div className="cx-bf-diary-feed">
      {visible.map(en => {
        if (composer && composer.mode === 'edit' && composer.entry.id === en.id) return <React.Fragment key={en.id}>{renderComposer()}</React.Fragment>;
        const t = BRIEFING_ENTRY_TYPES[en.type] || BRIEFING_ENTRY_TYPES.observacao;
        const dt = en.eventDate ? fmtDate(en.eventDate) : (en.createdAt ? fmtDate(en.createdAt.slice(0, 10)) : '');
        return (<div key={en.id} className="cx-bf-ent">
          <div className="cx-bf-ent-d">{dt || '—'}</div>
          <div className="cx-bf-ent-b">
            <div className="cx-bf-ent-hd">
              <span className="cx-bf-type" style={{ color: t.color, background: t.bg }}>{t.label}</span>
              {en.pinned && <span className="cx-bf-pin" title="Fixada">📌</span>}
              <span className="cx-sp" />
              <button type="button" className="cx-bf-ic" title={en.pinned ? 'Desafixar' : 'Fixar'} onClick={() => togglePin(en)}>📌</button>
              <button type="button" className="cx-bf-ic" title="Editar" onClick={() => openEdit(en)}>✎</button>
              <button type="button" className="cx-bf-ic" title="Excluir" onClick={() => removeEntry(en)}>✕</button>
            </div>
            <div className="cx-bf-ent-txt" dangerouslySetInnerHTML={{ __html: en.html || '' }} />
          </div>
        </div>);
      })}
    </div>
  </div>);
}

function EditionClaudeBriefing(p) {
  const { op, data, opId, opDebts, opExecs, opAssets, opTasks, opIntims, upsert, setData, setModal, setActiveTab } = p;
  const briefing = op.briefing || {};
  const updateBriefing = (field, value) => upsert('operations', { ...op, briefing: { ...briefing, [field]: value } });
  const [expandedPinned, setExpandedPinned] = React.useState(false);
  const [selected, setSelected] = React.useState({}); // execId -> stage key selecionada
  const [popup, setPopup] = React.useState(null); // { execId, sk }
  const [addMenu, setAddMenu] = React.useState(null); // execId
  const [laneMenu, setLaneMenu] = React.useState(null); // execId
  const [linkAdd, setLinkAdd] = React.useState(false);
  const [diaryEditId, setDiaryEditId] = React.useState(null);

  const setRec = (execId, sk, patch) => cxStageSetRec(op, upsert, execId, sk, patch);
  const delRec = (execId, sk) => cxStageDelRec(op, upsert, execId, sk);

  /* ── Novidades do último import ── */
  const opLogs = (data.importLogs || []).filter(l => l.operationId === opId && l.diff && !l.seen).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  const lastLog = opLogs[0];
  const [newsOpen, setNewsOpen] = React.useState(false);
  const d = lastLog && lastLog.diff;
  const newsTotal = d ? ((d.newDebts?.length || 0) + (d.newExecs?.length || 0) + (d.newAssets?.length || 0) + (d.newPeople?.length || 0) + (d.changedDebts?.length || 0) + (d.changedAssets?.length || 0)) : 0;

  /* ── Leitura da operação (mesma regra do relatório) ── */
  const entries = getBriefingEntries(briefing);
  const pinned = entries.filter(e => e && e.pinned);
  const highlight = pickHighlightEntry(entries);
  const otherPinned = highlight ? pinned.filter(e => e.id !== highlight.id) : [];

  /* ── Frentes processuais: IDPJ + MCF + Central + EF levada ao panorama ── */
  const idpjs = opExecs.filter(isIncidentOnPanorama);
  const centrais = opExecs.filter(e => e.processTag === 'central' && e.status !== 'extinta' && e.status !== 'arquivada');
  const panoEFs = opExecs.filter(isUserPanoramaEf);
  const fronts = [...idpjs, ...centrais, ...panoEFs];
  const coverage = computeIncidentCoverage(opExecs, opDebts);
  const keepCoveredEF = (e) => e && !isIncidentProcess(e) && isExecucaoFiscalClass(e) && e.status !== 'extinta';
  const withCda = (ef) => ({ ...ef, _cdaValue: execCdaValue(ef, opDebts) });
  const panoCoveredIds = new Set();
  idpjs.forEach(ip => (coverage.efsByIncident[ip.id] || []).forEach(ef => panoCoveredIds.add(ef.id)));
  const efStyleCards = [...centrais, ...panoEFs];
  efStyleCards.forEach(c => {
    opExecs.filter(e => e.parentExecutionId === c.id && keepCoveredEF(e)).forEach(e => panoCoveredIds.add(e.id));
  });
  const coveredEFsFor = (front) => {
    if (isEfStylePanoramaCard(front)) {
      return opExecs.filter(e => e.parentExecutionId === front.id && keepCoveredEF(e)).map(withCda);
    }
    return (coverage.efsByIncident[front.id] || []);
  };
  const today = localIso(new Date());
  const mainEFs = opExecs.filter(e => (!e.processTag || e.processTag === 'normal') && !e.parentExecutionId && e.status !== 'extinta' && e.status !== 'arquivada');
  const semIncidenteEFs = mainEFs.filter(ef => !panoCoveredIds.has(ef.id) && isExecucaoFiscalClass(ef) && !ef.inPanorama).map(withCda);
  const semIncidenteVal = semIncidenteEFs.reduce((s, e) => s + (e._cdaValue || 0), 0);

  const frontRows = fronts.map(front => {
    const bm = badgeFor(front);
    const STAGES = isEfStylePanoramaCard(front) ? CENTRAL_STAGES : PROCESS_STAGES;
    const stageKeys = Object.keys(STAGES);
    const recs = getStageRecords(briefing, front.id);
    const metas = stageMeta(STAGES, stageKeys, recs);
    const visible = metas.filter(m => m.has || m.alwaysShow).sort(compareStagesByDate);
    const registeredKeys = new Set(metas.filter(m => m.has).map(m => m.k));
    let lastIdx = -1;
    stageKeys.forEach((k, i) => { if (registeredKeys.has(k)) lastIdx = i; });
    const dismissed = new Set(Object.keys(recs).filter(k => isDismissedOnlyStageRec(recs[k])));
    const hasRecursoRegistered = [...registeredKeys].some(k => STAGES[k] && STAGES[k].multiRecurso);
    const suggestedLabels = new Set();
    const suggestions = [];
    for (let i = lastIdx + 1; i < stageKeys.length && suggestions.length < CX_STAGE_SUGGEST_MAX; i++) {
      const k = stageKeys[i];
      if (registeredKeys.has(k) || dismissed.has(k)) continue;
      const sd = STAGES[k];
      if (sd.multiRecurso && hasRecursoRegistered) continue;
      if (suggestedLabels.has(sd.label)) continue;
      suggestedLabels.add(sd.label);
      suggestions.push({ k, sd });
    }
    const hearing = (data.hearings || []).find(h => h.operationId === opId && h.processNumber && sameProc(h.processNumber, front.processNumber) && h.status === 'agendada' && h.date && h.date >= today);
    const covered = coveredEFsFor(front).sort((a, b) => (a.status === 'arquivada' ? 1 : 0) - (b.status === 'arquivada' ? 1 : 0));
    const coveredVal = covered.reduce((s, e) => s + (e._cdaValue || 0), 0);
    const withHas = visible.filter(m => m.has);
    const defaultSel = (withHas.length ? withHas[withHas.length - 1] : visible[visible.length - 1]) || null;
    const selKey = selected[front.id] || (defaultSel && defaultSel.k) || null;
    const focused = visible.find(m => m.k === selKey) || defaultSel;
    return { front, bm, STAGES, stageKeys, recs, metas, visible, suggestions, hearing, covered, coveredVal, focused };
  });

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

  /* ── Lembretes ── */
  const reminders = (data.stickyNotes || []).filter(n => n.operationId === opId).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

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

  /* ── Próximas tarefas ── */
  const nextTasks = [...opTasks].filter(t => t.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 3);

  const addStage = (front, sk) => {
    const sd = front.STAGES ? front.STAGES[sk] : null;
    const target = sd || (isEfStylePanoramaCard(front.front) ? CENTRAL_STAGES : PROCESS_STAGES)[sk];
    const patch = target && target.multiRecurso ? { _present: true, recursos: [emptyRecurso()] } : target && target.textOnly ? { _present: true, texto: '' } : { _present: true, date: '', evento: '', texto: '', outcome: '' };
    setRec(front.front.id, sk, patch);
    setSelected(prev => ({ ...prev, [front.front.id]: sk }));
    setPopup({ execId: front.front.id, sk });
    setAddMenu(null);
  };
  const addCustomStage = (front, name) => {
    const label = String(name || '').trim();
    if (!label) return;
    const sk = 'custom_' + uid();
    setRec(front.front.id, sk, { _present: true, _custom: true, label, date: '', evento: '', texto: '', outcome: '' });
    setSelected(prev => ({ ...prev, [front.front.id]: sk }));
    setPopup({ execId: front.front.id, sk });
    setAddMenu(null);
  };
  const addRecursoStage = (front) => {
    const unused = front.metas.find(m => m.sd.multiRecurso && !m.has);
    if (unused) { addStage(front, unused.k); return; }
    const sk = 'recurso_' + uid();
    setRec(front.front.id, sk, { _present: true, _custom: true, multiRecurso: true, label: 'Recurso', recursos: [emptyRecurso()] });
    setSelected(prev => ({ ...prev, [front.front.id]: sk }));
    setPopup({ execId: front.front.id, sk });
    setAddMenu(null);
  };
  const dismissSuggestion = (front, sk) => setRec(front.front.id, sk, { _dismissed: true });
  const registerSuggestion = (front, sk) => addStage(front, sk);

  return (<div className="cx cx-page cx-page-wide cx-bf">
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

    <div className="cx-bf-grid">
      <div className="cx-bf-main">
        {/* Leitura da operação */}
        <section className="cx-card cx-bf-lead">
          {highlight ? (<>
            <div className="cx-bf-lead-hd">
              <span className="cx-bf-type" style={{ color: (BRIEFING_ENTRY_TYPES[highlight.type] || BRIEFING_ENTRY_TYPES.observacao).color, background: (BRIEFING_ENTRY_TYPES[highlight.type] || BRIEFING_ENTRY_TYPES.observacao).bg }}>{(BRIEFING_ENTRY_TYPES[highlight.type] || BRIEFING_ENTRY_TYPES.observacao).label}</span>
              <span className="cx-muted cx-small">{highlight.eventDate ? 'fixada · ' + fmtDate(highlight.eventDate) : (highlight.createdAt ? 'fixada · ' + fmtDate(highlight.createdAt.slice(0, 10)) : 'fixada')}</span>
              <span className="cx-sp" />
              <button type="button" className="cx-bf-ic" title="Editar" onClick={() => setDiaryEditId(highlight.id)}>✎</button>
            </div>
            <div className="cx-bf-lead-txt" dangerouslySetInnerHTML={{ __html: highlight.html || '' }} />
            <div className="cx-bf-lead-ft">
              <span className="cx-muted cx-small">{(highlight.type === 'estrategia' ? 'Estratégia fixada mais recente' : 'Entrada fixada mais recente')}{otherPinned.length ? ` · mais ${otherPinned.length} fixada${otherPinned.length > 1 ? 's' : ''}` : ''}</span>
              {otherPinned.length > 0 && <button type="button" className="cx-link" onClick={() => setExpandedPinned(o => !o)}>{expandedPinned ? 'Ocultar ▴' : 'Ver as outras ▾'}</button>}
            </div>
            {expandedPinned && otherPinned.map(en => {
              const t = BRIEFING_ENTRY_TYPES[en.type] || BRIEFING_ENTRY_TYPES.observacao;
              return <div key={en.id} className="cx-bf-lead-other"><span className="cx-bf-type" style={{ color: t.color, background: t.bg }}>{t.label}</span><div dangerouslySetInnerHTML={{ __html: en.html || '' }} /></div>;
            })}
          </>) : (
            <div className="cx-empty-row">Fixe a entrada que resume a operação — no Diário abaixo, use 📌.</div>
          )}
        </section>

        {/* Frentes processuais */}
        <section className="cx-card cx-bf-fronts">
          <div className="cx-card-h"><h5>Frentes processuais</h5><span className="cx-count">{fronts.length}</span><span className="cx-sp" /><button type="button" className="cx-link-btn" onClick={() => setActiveTab('prescricao_v2')}>Processos e prescrição<CxIcon n="chevR" s={13} /></button></div>
          {fronts.length === 0 && <div className="cx-empty-row">Nenhum IDPJ, MCF, execução central ou EF levada ao panorama.</div>}
          {frontRows.map(fr => {
            const front = fr.front;
            const addOpen = addMenu === front.id;
            const menuOpen = laneMenu === front.id;
            return (
              <div key={front.id} className="cx-bf-lane">
                <div className="cx-bf-lane-h">
                  <span className="cx-bf-kind" style={{ color: fr.bm.color, background: fr.bm.bg }}>{fr.bm.label}</span>
                  <div className="cx-bf-lane-t">
                    <div className="cx-bf-lane-title">{fr.bm.title || front.className || fr.bm.label} <span className="cx-mono cx-muted cx-small">{front.processNumber}</span></div>
                    <div className="cx-bf-lane-sub cx-muted cx-small">{front.court || 'juízo não informado'}{front.status ? ' · ' + ((EXEC_STATUSES[front.status] || {}).label || front.status) : ''}</div>
                  </div>
                  <div className="cx-bf-lane-m"><small>Cobre</small><strong>{fr.covered.length} {fr.bm.unit}{fr.covered.length !== 1 ? 's' : ''}</strong></div>
                  <div className="cx-bf-lane-m"><small>Valor</small><strong>{fr.coveredVal > 0 ? fmtCur(fr.coveredVal) : '—'}</strong></div>
                  <div className="cx-bf-lane-menu">
                    <button type="button" className="cx-bf-ic" title="Menu" onClick={() => setLaneMenu(menuOpen ? null : front.id)}>⋯</button>
                    {menuOpen && (<>
                      <div className="cx-menu-scrim" onClick={() => setLaneMenu(null)} />
                      <div className="cx-menu-pop">
                        <button type="button" onClick={() => { setModal({ type: 'edit', entityType: 'execution', initial: front }); setLaneMenu(null); }}>Dados</button>
                        <button type="button" onClick={() => { upsert('executions', { ...front, inPanorama: false }); setLaneMenu(null); }}>Retirar</button>
                      </div>
                    </>)}
                  </div>
                </div>

                <div className="cx-bf-ruler">
                  {fr.visible.map(m => {
                    const isCustom = !!(m.rec && m.rec._custom) && !m.sd.multiRecurso;
                    const color = m.sd.multiRecurso ? m.c : (isCustom ? 'var(--cx-violet)' : m.c);
                    const meta = stageCompactMeta(m);
                    return (
                      <button key={m.k} type="button" className={'cx-bf-stp' + (fr.focused && fr.focused.k === m.k ? ' now' : '')} style={{ '--c': color }} onClick={() => setSelected(s => ({ ...s, [front.id]: m.k }))} title={m.sd.label}>
                        <span className="d" />
                        <span className="l">{m.sd.label}{m.outcomeLabel ? ' · ' + m.outcomeLabel : ''}</span>
                        <span className="w">{meta || (isCustom ? 'evento livre' : '')}</span>
                      </button>
                    );
                  })}
                  {fr.suggestions.map(s => (
                    <span key={s.k} className="cx-bf-stp ghost">
                      <button type="button" className="cx-bf-stp-main" onClick={() => registerSuggestion(fr, s.k)} title="Registrar esta fase">
                        <span className="d" /><span className="l">{s.sd.label}</span><span className="w">sugerida</span>
                      </button>
                      <span className="x2" onClick={() => dismissSuggestion(fr, s.k)} title="Dispensar sugestão">✕</span>
                    </span>
                  ))}
                  {fr.hearing && (
                    <button type="button" className="cx-bf-stp ghost hearing" onClick={() => setModal({ type: 'edit', entityType: 'hearing', initial: fr.hearing })} title="Audiência agendada">
                      <span className="d" /><span className="l">Audiência</span><span className="w">{fmtDate(fr.hearing.date)} (agendada)</span>
                    </button>
                  )}
                  <span className="cx-bf-stp add">
                    <button type="button" onClick={() => setAddMenu(addOpen ? null : front.id)}>+ Evento</button>
                    {addOpen && (<>
                      <div className="cx-menu-scrim" onClick={() => setAddMenu(null)} />
                      <div className="cx-menu-pop cx-bf-addmenu">
                        <input autoFocus placeholder="digite o nome e Enter (evento livre)" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) addCustomStage(fr, e.target.value.trim()); else if (e.key === 'Escape') setAddMenu(null); }} />
                        <button type="button" onClick={() => addRecursoStage(fr)}>Recurso</button>
                        {fr.metas.filter(m => !m.has && !m.alwaysShow && !m.sd.custom && !m.sd.multiRecurso).map(m => <button key={m.k} type="button" onClick={() => addStage(fr, m.k)}>{m.sd.label}</button>)}
                      </div>
                    </>)}
                  </span>
                </div>

                {fr.focused && (() => {
                  const m = fr.focused;
                  const noteTxt = (m.rec?.texto && String(m.rec.texto).trim()) || '';
                  const phaseTitle = m.sd.label + (m.outcomeLabel ? ' · ' + m.outcomeLabel : '');
                  const rawNotes = front.notesList || (front.notes ? [front.notes] : []);
                  const cardNotes = rawNotes.map((n, idx) => ({ n, idx })).filter(({ n }) => !isRedundantImportedProcessNote(n));
                  const setNotes = (arr) => upsert('executions', { ...front, notesList: arr });
                  return (
                    <div className="cx-bf-work">
                      <div className="cx-bf-work-k">
                        <span style={{ color: m.c }}>{phaseTitle}</span>
                        <span className="cx-sp" />
                        <button type="button" className="cx-btn sm" onClick={() => setPopup({ execId: front.id, sk: m.k })}>Editar fase</button>
                      </div>
                      {m.sd.multiRecurso ? (
                        (m.recursos || []).length ? <ol className="cx-bf-work-list">{(m.recursos || []).map((r, ri) => {
                          const bits = [];
                          if (r.outcome && m.sd.outcomes[r.outcome]) bits.push(m.sd.outcomes[r.outcome]);
                          if (r.date) bits.push(fmtDate(r.date));
                          if (r.proc) bits.push(r.proc);
                          return <li key={ri}>{bits.join(' · ') || (r.texto || '—')}</li>;
                        })}</ol> : <div className="cx-muted cx-small">Sem julgamentos listados.</div>
                      ) : (
                        <p className="cx-bf-work-txt">{noteTxt || '—'}</p>
                      )}
                      <div className="cx-bf-work-k" style={{ marginTop: 10 }}>
                        <span>Notas do processo</span><span className="cx-sp" />
                        <button type="button" className="cx-bf-ic" title="Adicionar nota" onClick={() => { const t = prompt('Nova nota:'); if (t && t.trim()) setNotes([...rawNotes, t.trim()]); }}>+</button>
                      </div>
                      {cardNotes.length ? cardNotes.map(({ n, idx }) => (
                        <div key={idx} className="cx-bf-note"><span>{n}</span><button type="button" className="cx-bf-ic" onClick={() => setNotes(rawNotes.filter((_, j) => j !== idx))}>✕</button></div>
                      )) : <div className="cx-muted cx-small">Nenhuma nota.</div>}
                      <div className="cx-bf-work-k" style={{ marginTop: 10 }}><span>EFs cobertas</span></div>
                      {fr.covered.length ? fr.covered.slice(0, 8).map(ef => (
                        <button key={ef.id} type="button" className="cx-bf-cov" onClick={() => setModal({ type: 'edit', entityType: 'execution', initial: ef })}>
                          <span className="cx-mono">{ef.processNumber || '—'}</span>
                          <span className="cx-mono">{ef._cdaValue > 0 ? fmtCur(ef._cdaValue) : '—'}</span>
                          <span className="cx-tag">{(EXEC_STATUSES[ef.status] || {}).label || ef.status || ''}</span>
                        </button>
                      )) : <div className="cx-muted cx-small">{isEfStylePanoramaCard(front) ? 'Nenhum apenso fiscal.' : `Nenhuma ${fr.bm.unit} vinculada.`}</div>}
                    </div>
                  );
                })()}
                {popup && popup.execId === front.id && (() => {
                  const m = fr.metas.find(x => x.k === popup.sk);
                  if (!m) return null;
                  return <StagePopup key={'cxstagepop-' + front.id + '-' + m.k} sd={m.sd} rec={m.rec}
                    onCommit={(patch) => setRec(front.id, m.k, { ...patch, _present: true })}
                    onDelete={() => { delRec(front.id, m.k); setPopup(null); }}
                    onAddNote={(text) => { upsert('executions', { ...front, notesList: [...(front.notesList || []), text] }); }}
                    onClose={() => setPopup(null)} />;
                })()}
              </div>
            );
          })}
          {semIncidenteEFs.length > 0 && (
            <div className="cx-bf-lane quiet">
              <div className="cx-bf-lane-h">
                <span className="cx-bf-kind" style={{ color: 'var(--cx-ink-3)', background: 'var(--cx-line-soft, rgba(0,0,0,.06))' }}>EF</span>
                <div className="cx-bf-lane-t"><div className="cx-bf-lane-title">Sem incidente</div><div className="cx-bf-lane-sub cx-muted cx-small">{semIncidenteEFs.length} execuç{semIncidenteEFs.length !== 1 ? 'ões' : 'ão'} fora de IDPJ, MCF e central</div></div>
                <div className="cx-bf-lane-m"><small>EFs</small><strong>{semIncidenteEFs.length}</strong></div>
                <div className="cx-bf-lane-m"><small>Valor</small><strong>{semIncidenteVal > 0 ? fmtCur(semIncidenteVal) : '—'}</strong></div>
              </div>
              <div className="cx-bf-quiet-list">
                {semIncidenteEFs.map(ef => (
                  <button key={ef.id} type="button" className="cx-bf-cov" onClick={() => setModal({ type: 'edit', entityType: 'execution', initial: ef })}>
                    <span className="cx-mono">{ef.processNumber || '—'}</span>
                    <span className="cx-mono">{ef._cdaValue > 0 ? fmtCur(ef._cdaValue) : '—'}</span>
                    <span className="cx-tag">{(EXEC_STATUSES[ef.status] || {}).label || ef.status || ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Diário */}
        <section className="cx-card">
          <EditionClaudeBriefingDiary op={op} upsert={upsert} editRequestId={diaryEditId} onEditConsumed={() => setDiaryEditId(null)} />
        </section>
      </div>

      {/* Coluna de apoio */}
      <aside className="cx-bf-rail">
        <section className="cx-card cx-bf-rail-card">
          <div className="cx-card-h"><h5>Fontes</h5><span className="cx-sp" /><button type="button" className="cx-link-btn" onClick={() => setLinkAdd(o => !o)}>+ link</button></div>
          <div className="cx-bf-rail-b">
            {migratedLinks.map((lnk, idx) => (
              <div key={idx} className="cx-bf-src"><a href={lnk.url} target="_blank" rel="noopener noreferrer">{lnk.label || 'Link'}</a><button type="button" className="cx-bf-ic" onClick={() => removeLink(idx)}>✕</button></div>
            ))}
            {!migratedLinks.length && !linkAdd && <div className="cx-muted cx-small">Nenhuma fonte cadastrada.</div>}
            {linkAdd && <input autoFocus placeholder="colar URL e Enter" className="cx-input" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { addLink(e.target.value.trim()); e.target.value = ''; setLinkAdd(false); } else if (e.key === 'Escape') setLinkAdd(false); }} onBlur={() => setLinkAdd(false)} />}
          </div>
        </section>
        <section className="cx-card cx-bf-rail-card">
          <div className="cx-card-h"><h5>Lembretes</h5><span className="cx-count">{reminders.length}</span><span className="cx-sp" /><button type="button" className="cx-link-btn" onClick={() => setModal({ type: 'create', entityType: 'stickyNote', initial: { operationId: opId, color: 'yellow' } })}>+</button></div>
          <div className="cx-bf-rail-b">
            {reminders.length === 0 && <div className="cx-muted cx-small">Nenhum lembrete.</div>}
            {reminders.slice(0, 6).map(n => (
              <div key={n.id} className="cx-bf-rem" onClick={() => setModal({ type: 'edit', entityType: 'stickyNote', initial: n })}>
                <span>{n.title ? <b>{n.title}: </b> : null}{truncate(n.content || '', 90)}</span>
                <span className="cx-muted cx-small">{n.updatedAt ? fmtDate(n.updatedAt.slice(0, 10)) : ''}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="cx-card cx-bf-rail-card">
          <div className="cx-card-h"><h5>Checklists</h5><span className="cx-count">{checklistDone}/{checklistTotal}</span></div>
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
        </section>
        <section className="cx-card cx-bf-rail-card">
          <div className="cx-card-h"><h5>Próximas tarefas</h5><span className="cx-count">{opTasks.length}</span><span className="cx-sp" /><button type="button" className="cx-link-btn" onClick={() => setActiveTab('tarefas')}>Tarefas<CxIcon n="chevR" s={13} /></button></div>
          <div className="cx-bf-rail-b">
            {nextTasks.length === 0 && <div className="cx-muted cx-small">Nenhuma tarefa com data.</div>}
            {nextTasks.map(t => (
              <div key={t.id} className="cx-bf-task" onClick={() => setModal({ type: 'edit', entityType: 'task', initial: t })}>
                <span className={'p' + (daysUntil(t.dueDate) < 0 ? ' late' : '')} />
                <span className="cx-ell">{t.title}</span>
                <span className="cx-mono cx-small cx-muted">{fmtDate(t.dueDate)}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASE 8 — Processos e prescrição no Prumo: passo 0 aparte (dedupe de sugestões,
   já acima). 8a: sinais fixos + ficha lateral. 8b: EditionClaudeProcessos
   (cartões para dezenas de processos). Lê os MESMOS `classified`/`prazosByDebt`
   que o app já calcula (processTabModel); não toca parsers, prescrição ou sync.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Sinais (mesmos desenhos/cores/ordem do ProcRowSymbols — app.jsx) ─── */
const CX_SIG_DEFS = [
  { k: 'star', label: 'Relevante' },
  { k: 'pin', label: 'Meu acervo' },
  { k: 'watch', label: 'Acompanhar' },
  { k: 'copy', label: 'Cópia na pasta' },
  { k: 'lock', label: 'Constrição' },
  { k: 'task', label: 'Tarefa aberta' },
  { k: 'intim', label: 'Intimação aberta' },
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
function CxSigGlyph({ k }) {
  switch (k) {
    case 'star': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 1.5l1.76 3.56 3.94.57-2.85 2.78.67 3.92L8 10.48l-3.52 1.85.67-3.92L2.3 5.63l3.94-.57L8 1.5z" /></svg>;
    case 'pin': return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 11.2 12 4.2l8.5 7" /><path d="M6 10.6V19.5h12V10.6" /><path d="M10 19.5v-5h4v5" /></svg>;
    case 'watch': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 3.2C4.6 3.2 1.85 5.85 1.2 8c.65 2.15 3.4 4.8 6.8 4.8s6.15-2.65 6.8-4.8C14.15 5.85 11.4 3.2 8 3.2zm0 8A3.2 3.2 0 118 4.8a3.2 3.2 0 010 6.4zm0-1.7A1.5 1.5 0 108 5.5a1.5 1.5 0 000 3z" /></svg>;
    case 'copy': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 1.5h5.2L13 5.3V14a.8.8 0 01-.8.8H4.8A.8.8 0 014 14V1.5zm5 0v3.2H12L9 1.5zM5.5 8h5v1h-5V8zm0 2.5h5v1h-5v-1z" /></svg>;
    case 'lock': return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 1.6A2.9 2.9 0 005.1 4.5V6H4.2A1.2 1.2 0 003 7.2v5.1c0 .66.54 1.2 1.2 1.2h7.6c.66 0 1.2-.54 1.2-1.2V7.2c0-.66-.54-1.2-1.2-1.2h-.9V4.5A2.9 2.9 0 008 1.6zm0 1.3c.9 0 1.6.7 1.6 1.6V6H6.4V4.5c0-.9.7-1.6 1.6-1.6zM8 9.1a1.1 1.1 0 110 2.2A1.1 1.1 0 018 9.1z" /></svg>;
    case 'task': return <span className="cx-sig-dot cx-sig-dot-task" aria-hidden="true" />;
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

/* ═════════════ Ficha lateral (8a) — processo ou CDA avulsa ═════════════ */
function EditionClaudeProcDrawer(p) {
  const { group, data, opId, hubLabel, apensoNums, prazosByDebt, selectedCDAs, setSelectedCDAs, setModal, setData, upsert, onClose, onOpenExec, onOpenCda, relatedOthers, linkify } = p;
  const [tab, setTab] = React.useState('resumo');
  React.useEffect(() => { setTab('resumo'); }, [group && group.type === 'exec' ? group.exec.id : (group && group.cdas && group.cdas[0] && group.cdas[0].id)]);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .global-search-overlay')) onClose(); };
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
  const copyProcNum = () => { try { navigator.clipboard.writeText(e ? (e.processNumber || '') : ''); } catch { } };
  const batchEventOnGroup = () => setModal({ type: 'create', entityType: 'prescriptionEvent', initial: { batchCdaIds: cdas.map(d => d.id) } });
  const genTask = () => setModal({ type: 'create', entityType: 'task', initial: { operationId: opId, processNumber: e ? e.processNumber : '', title: e ? `Providência — ${e.className || 'processo'}` : 'Providência', priority: 'media', status: 'pendente', taskVisibility: 'operation' } });
  return <>
    <div className="cx-scrim" onClick={onClose} />
    <aside className="cx cx-drawer cx-pd" role="dialog" aria-modal="true" aria-label="Processo">
      <div className="cx-dr-top">
        <div className="cx-crumb"><span className={'cx-pd-kind ' + kind.cls}>{kind.label}</span>
          {e ? <Copyable value={e.processNumber || ''} className="cx-mono cx-pd-num">{e.processNumber || 'S/N'}</Copyable> : <b>CDAs sem processo</b>}
          {e && e.processNumber ? <a href={cxEprocUrl(e.processNumber)} target="_blank" rel="noreferrer" className="cx-icon-btn" title="Abrir no eproc" aria-label="Abrir no eproc"><CxIcon n="arrowUR" s={14} /></a> : null}
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
          {openTasks.length > 0 && <button type="button" className="cx-pd-auto cx-pd-auto-btn" onClick={() => setModal({ type: 'edit', entityType: 'task', initial: openTasks[0] })}><CxSigGlyph k="task" />{openTasks.length} {openTasks.length === 1 ? 'tarefa' : 'tarefas'}</button>}
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
        {e && <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'execution', initial: e })}>Dados do processo</button>}
      </div>
    </aside>
  </>;
}

/* ═════════════ Ficha lateral da CDA (8c) — mesmo padrão da ficha do processo ═════════════
   Aberta ao clicar numa linha de CDA (cartão "CDAs não ajuizadas" e a lista de CDAs dentro
   da ficha do processo, aba CDAs). Só leitura do motor de prescrição existente — nenhum
   cálculo novo aqui. Pronta para reuso pela futura aba Inscrições (props explícitas). */

/** Três contagens empilhadas (decadência/ordinária/intercorrente), a mais grave primeiro —
 *  mesmo cálculo que a aba CDAs da ficha do processo já fazia inline; extraído para reuso. */
function CxCdaPrescStack({ debt, data, togglePrescCheck }) {
  const tl = computeCdaLegalTimeline({ debt, executions: data.executions, events: data.prescriptionEvents || [] });
  const segKeys = ['decadencia', 'ordinaria', 'intercorrente'].filter(k => tl[k]);
  const ordered = tl.worst && tl.worst.key && segKeys.includes(tl.worst.key)
    ? [tl.worst.key, ...segKeys.filter(k => k !== tl.worst.key)]
    : segKeys;
  return <div className="cx-pd-cda-stack">
    {ordered.map(k => <CdaPrescColumns key={k} timeline={{ [k]: tl[k], exec: tl.exec }} debt={debt} onToggleCheck={togglePrescCheck} onOpenRules={() => { }} isDemo={false} />)}
  </div>;
}

/** Bloco "Prazos extintivos": situação na Mesa (prazosByDebt), o mesmo rótulo e barra de
 *  horizonte usados na coluna Prescrição da aba, e as três contagens empilhadas. */
function CxCdaPrazosBlock({ debt, prazosByDebt, data, togglePrescCheck }) {
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
      {row.keyDate ? <span className="cx-muted">termo {fmtDate(row.keyDate)}</span> : null}
      {row.prescDays != null ? <span className="cx-muted">{formatPrescHorizon(row.prescDays)}</span> : null}
    </div> : null}
    {row && (row.why || row.summary) ? <div className="cx-cd-prazos-why">{betaSafeUiText(row.why || row.summary)}</div> : null}
    <CxCdaPrescStack debt={debt} data={data} togglePrescCheck={togglePrescCheck} />
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
          <CxCdaPrazosBlock debt={d} prazosByDebt={prazosByDebt} data={data} togglePrescCheck={togglePrescCheck} />
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
        <button type="button" className="cx-btn sm ghost" onClick={() => setModal({ type: 'edit', entityType: 'debt', initial: d })}>✎ Editar inscrição</button>
      </div>
    </aside>
  </>;
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
    procCdaQuery, setProcCdaQuery, cdaPersonFilter, setCdaPersonFilter, people, linkify } = p;
  const { hubs, coveredByHub, uncoveredEFs, extinct, others, othersByParent, apensosByParent, unlinked, duplicates } = classified;

  const [sigActive, setSigActive] = React.useState(() => new Set());
  const toggleSigFilter = (k) => setSigActive(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const [sortBy, setSortBy] = React.useState('valor');
  const [drawerExecId, setDrawerExecId] = React.useState(null);
  const [drawerCda, setDrawerCda] = React.useState(null); // { id, execId } | null — exclusivo com drawerExecId
  const [cardGroupSel, setCardGroupSel] = React.useState({ inc: 'all' });
  const [bandsOn, setBandsOn] = React.useState(() => ({ ativa: true, suspensa: true, suspensa_parcelamento: true, arquivada: true, nao_ajuizada: true, extinta: false }));
  const [showMore, setShowMore] = React.useState({});
  const [collapsedCards, setCollapsedCards] = React.useState(() => new Set(['emb', 'out']));
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
  const embargosOpenPrazo = (otherBuckets.embargos || []).some(g => (openIntimsByProc.get(normProc(g.exec.processNumber)) || []).length > 0);

  // Só uma ficha por vez: abrir a do processo fecha a da CDA e vice-versa.
  const openDrawerFor = (execId) => { setDrawerExecId(execId); setDrawerCda(null); };
  const closeDrawer = () => setDrawerExecId(null);
  const openCdaDrawer = (cdaId, execId) => { setDrawerCda({ id: cdaId, execId: execId || null }); setDrawerExecId(null); };
  const closeCdaDrawer = () => setDrawerCda(null);
  const drawerOpen = !!drawerExecId || !!drawerCda;
  const scrollToCard = (id) => { const el = document.getElementById('cx-pcard-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (collapsedCards.has(id)) setCollapsedCards(prev => { const n = new Set(prev); n.delete(id); return n; }); };

  const toggleGroupSelect = (cdas) => setSelectedCDAs(prev => { const n = new Set(prev); const all = cdas.every(d => n.has(d.id)); cdas.forEach(d => all ? n.delete(d.id) : n.add(d.id)); return n; });
  const toggleCdaSel = (id) => setSelectedCDAs(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const rowKey = (g) => g.type === 'exec' ? g.exec.id : 'unlinked';

  /* Linha de um processo (EF, hub, recurso, embargo…), com apensos aninhados. */
  const ProcRow = ({ g, depth = 0 }) => {
    const meta = cxEfMeta(g, prazosByDebt);
    const apensos = (apensosByParent && apensosByParent[g.exec.id]) || [];
    const isSel = (g.cdas || []).length > 0 && g.cdas.every(d => selectedCDAs.has(d.id));
    return <React.Fragment key={g.exec.id}>
      <tr className={'cx-pt-row' + (drawerExecId === g.exec.id ? ' on' : '')} onClick={() => openDrawerFor(g.exec.id)}>
        <td className="cx-pt-ck" onClick={ev => ev.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleGroupSelect(g.cdas || [])} disabled={!(g.cdas || []).length} /></td>
        <td className={'cx-pt-num' + (depth > 0 ? ' nest' + Math.min(depth, 2) : '')}>{depth > 1 && <span className="cx-pt-nest">↳</span>}<span className="cx-mono">{g.exec.processNumber || 'S/N'}</span>{apensos.length > 0 && <span className="cx-pt-apc">{apensos.length} ap.</span>}</td>
        {!drawerOpen && <td className="cx-pt-sig"><ProcRowSymbols exec={g.exec} data={data} fixed /></td>}
        <td className="cx-pt-st"><span className={'badge ' + (meta.st.badge || 'badge-muted')}>{meta.st.label || g.exec.status || '—'}</span></td>
        {!drawerOpen && <td className="cx-pt-r">{(g.cdas || []).length}</td>}
        <td className="cx-pt-r cx-mono">{fmtCur(meta.total)}</td>
        <CxPrescCell cdas={g.cdas} prazosByDebt={prazosByDebt} />
      </tr>
      {apensos.map(ap => <ProcRow key={ap.exec.id} g={ap} depth={depth + 1} />)}
    </React.Fragment>;
  };

  const ProcTableHead = () => (
    <thead><tr><th className="cx-pt-ck"></th><th>Processo</th>{!drawerOpen && <th className="cx-pt-sig">Marcadores</th>}<th>Situação</th>{!drawerOpen && <th className="cx-pt-r">CDAs</th>}<th className="cx-pt-r">Valor</th><th>Prescrição</th></tr></thead>
  );

  /* Grupo com linha de subtotal + "mostrar mais" após 8 linhas. */
  const GroupBlock = ({ groupKey, label, rows, extra, depth = 0 }) => {
    const sorted = [...rows].sort(cmp);
    const shown = showMore[groupKey] || 8;
    const visible = sorted.slice(0, shown);
    const rest = sorted.length - visible.length;
    const totals = rows.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
    const cdaCount = rows.reduce((s, g) => s + (g.cdas || []).length, 0);
    const groupCdas = rows.flatMap(g => g.cdas || []);
    const restVal = sorted.slice(shown).reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0);
    return <React.Fragment>
      {label && <tr className="cx-pt-band">
        <td className="cx-pt-ck"></td><td colSpan={drawerOpen ? 2 : 3}><b>{label}</b> <span className="cx-muted cx-small">{rows.length} {rows.length === 1 ? 'processo' : 'processos'}</span></td>
        {!drawerOpen && <td className="cx-pt-r">{cdaCount}</td>}
        <td className="cx-pt-r cx-mono">{fmtCur(totals)}</td>
        <CxPrescCell cdas={groupCdas} prazosByDebt={prazosByDebt} />
      </tr>}
      {visible.map(g => <ProcRow key={rowKey(g)} g={g} depth={depth} />)}
      {rest > 0 && <tr className="cx-pt-more"><td colSpan={7}><button type="button" className="cx-link-btn" onClick={() => setShowMore(prev => ({ ...prev, [groupKey]: shown + 20 }))}>Mostrar mais {rest} · {fmtCur(restVal)}</button></td></tr>}
      {extra}
    </React.Fragment>;
  };

  /* ── Cartão: Incidentes e execução de destaque ── */
  const incGroups = hubs.map(h => ({ h, covered: filterRows(coveredByHub[h.exec.id] || []) }));
  const incSel = cardGroupSel.inc || 'all';
  const incVisibleHubs = incSel === 'all' ? incGroups : incGroups.filter(x => x.h.exec.id === incSel);
  const isHubOpen = (id) => hubOpenOverride.hasOwnProperty(id)
    ? hubOpenOverride[id]
    : (incVisibleHubs.length === 1 || id === (hubs[0] && hubs[0].exec.id));
  const toggleHubOpen = (id) => setHubOpenOverride(prev => ({ ...prev, [id]: !isHubOpen(id) }));
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
          <span className="cx-mono">{h.exec.processNumber || 'S/N'}</span>
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

  const cardCollapsed = (id) => collapsedCards.has(id);
  const toggleCard = (id) => setCollapsedCards(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

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
      <select className="cx-sel sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="valor">Ordenar: valor</option>
        <option value="prescricao">Ordenar: prescrição</option>
        <option value="numero">Ordenar: número</option>
      </select>
      <button type="button" className="cx-btn sm primary" onClick={() => setModal({ type: 'create', entityType: 'execution', initial: {} })}>+ Processo</button>
    </div>

    <div className="cx-pp-summary">
      <button type="button" className="cx-pp-sum-cell" onClick={() => scrollToCard('inc')}><small>Incidentes e destaque</small><b>{hubs.length}</b><em>{fmtCur(incValue)}</em>{incAlarms > 0 && <i className="al">{incAlarms} no alarme</i>}</button>
      <button type="button" className="cx-pp-sum-cell" onClick={() => scrollToCard('semv')}><small>Execuções sem vínculo</small><b>{uncoveredEFs.length}</b><em>{fmtCur(semVincValue)}</em>{semVincAlarms > 0 && <i className="al">{semVincAlarms} no alarme</i>}</button>
      <button type="button" className="cx-pp-sum-cell" onClick={() => scrollToCard('na')}><small>Não ajuizadas</small><b>{unlinkedCdas.length} CDAs</b><em>{fmtCur(naValue)}</em>{naRisk.riskClass === 'critical' && <i className="al">no alarme</i>}</button>
      <button type="button" className="cx-pp-sum-cell" onClick={() => scrollToCard('rec')}><small>Recursos</small><b>{otherBuckets.recursos.length}</b></button>
      <button type="button" className="cx-pp-sum-cell" onClick={() => scrollToCard('emb')}><small>Embargos</small><b>{otherBuckets.embargos.length}</b>{embargosOpenPrazo && <i className="al">prazo aberto</i>}</button>
      <button type="button" className="cx-pp-sum-cell" onClick={() => scrollToCard('out')}><small>Outros</small><b>{otherBuckets.outros.length}</b></button>
    </div>

    {duplicates && duplicates.length > 0 && (
      <div className="cx-pp-dup">⚠ {duplicates.length} {duplicates.length === 1 ? 'duplicidade detectada' : 'duplicidades detectadas'} — mesmo número e espécie cadastrados mais de uma vez.</div>
    )}

    <div className="cx-pp-body">
      <div className="cx-pp-cards">
        {/* Incidentes e execução de destaque */}
        <section className="cx-card cx-pcard" id="cx-pcard-inc">
          <div className="cx-card-h" onClick={() => toggleCard('inc')}>
            <span className="cx-chev">{cardCollapsed('inc') ? '▸' : '▾'}</span><h5>Incidentes e execução de destaque</h5><span className="cx-count">{hubs.length}</span>
            <span className="cx-muted cx-small">· IDPJ, cautelar e central com as EFs cobertas</span>
          </div>
          {!cardCollapsed('inc') && hubs.length > 0 && <>
            <div className="cx-pp-grpbar">
              <button type="button" className={incSel === 'all' ? 'on' : ''} onClick={() => setCardGroupSel(s => ({ ...s, inc: 'all' }))}>Todos <i>{hubs.length}</i></button>
              {incGroups.map(({ h, covered }) => (
                <button key={h.exec.id} type="button" className={incSel === h.exec.id ? 'on' : ''} onClick={() => setCardGroupSel(s => ({ ...s, inc: h.exec.id }))}>
                  <em className={'cx-pd-kind ' + cxProcKind(h.exec).cls}>{cxProcKind(h.exec).label}</em>{h.exec.processNumber} <i>{covered.length} EFs · {fmtCur(cxEfMeta(h, prazosByDebt).total + covered.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0))}</i>
                </button>
              ))}
            </div>
            <div className="cx-pt-wrap"><table className="cx-pt"><ProcTableHead /><tbody>
              {incVisibleHubs.map(({ h, covered }) => <HubGroupRow key={h.exec.id} h={h} covered={covered} />)}
            </tbody></table></div>
          </>}
          {!cardCollapsed('inc') && hubs.length === 0 && <div className="cx-empty-row">Nenhum IDPJ, MCF ou execução central levada ao panorama.</div>}
        </section>

        {/* Execuções sem vínculo */}
        <section className="cx-card cx-pcard" id="cx-pcard-semv">
          <div className="cx-card-h" onClick={() => toggleCard('semv')}>
            <span className="cx-chev">{cardCollapsed('semv') ? '▸' : '▾'}</span><h5>Execuções sem vínculo</h5><span className="cx-count">{uncoveredEFs.length}</span>
            <span className="cx-muted cx-small">· fora de IDPJ, cautelar e central</span>
          </div>
          {!cardCollapsed('semv') && <>
            <div className="cx-pp-grpbar">
              {EF_BANDS.map(b => (
                <button key={b.key} type="button" className={bandsOn[b.key] ? 'on' : 'off'} onClick={() => setBandsOn(s => ({ ...s, [b.key]: !s[b.key] }))}>{b.label} <i>{(semVincBands[b.key] || []).length}</i></button>
              ))}
            </div>
            <div className="cx-pt-wrap"><table className="cx-pt"><ProcTableHead /><tbody>
              {['ativa', 'suspensa', 'suspensa_parcelamento', 'arquivada'].filter(k => bandsOn[k] && (semVincBands[k] || []).length).map(k => {
                const bd = EF_BANDS.find(b => b.key === k);
                return <GroupBlock key={k} groupKey={'sv-' + k} label={bd.label} rows={semVincBands[k] || []} />;
              })}
              {bandsOn.extinta && extinctVisible.length > 0 && <GroupBlock groupKey="sv-ext" label="Extintas" rows={extinctVisible} />}
              {!bandsOn.extinta && extinctVisible.length > 0 && <tr className="cx-pt-more dim"><td colSpan={7}>{extinctVisible.length} extintas ocultas · {fmtCur(extinctVisible.reduce((s, g) => s + cxEfMeta(g, prazosByDebt).total, 0))} <button type="button" className="cx-link-btn" onClick={() => setBandsOn(s => ({ ...s, extinta: true }))}>mostrar</button></td></tr>}
            </tbody></table></div>
          </>}
        </section>

        <section className="cx-card cx-pcard" id="cx-pcard-na">
          <div className="cx-card-h" onClick={() => toggleCard('na')}>
            <span className="cx-chev">{cardCollapsed('na') ? '▸' : '▾'}</span><h5>CDAs não ajuizadas</h5><span className="cx-count">{unlinkedCdas.length}</span>
            <span className="cx-muted cx-small">· sem processo</span>
          </div>
          {!cardCollapsed('na') && <div className="cx-pt-wrap"><table className="cx-pt"><ProcTableHead /><tbody>
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
                    <td className="cx-pt-num"><span className="cx-mono">{d.cdaNumber || 'CDA'}</span> <span className="cx-muted cx-small">{cdaEspecie(d)}</span></td>
                    {!drawerOpen && <td className="cx-pt-sig"></td>}
                    <td className="cx-pt-st"><span className="badge badge-muted">Não ajuizada</span></td>
                    {!drawerOpen && <td className="cx-pt-r">—</td>}
                    <td className="cx-pt-r cx-mono">{fmtCur(d.value)}</td>
                    <CxPrescCell cdas={[d]} prazosByDebt={prazosByDebt} />
                  </tr>;
                })}
                {restN > 0 && <tr className="cx-pt-more"><td colSpan={7}><button type="button" className="cx-link-btn" onClick={() => setShowMore(s => ({ ...s, na: shownN + 20 }))}>Mostrar mais {restN} CDAs</button></td></tr>}
              </React.Fragment>;
            })()}
          </tbody></table></div>}
        </section>

        {/* Recursos */}
        <section className="cx-card cx-pcard" id="cx-pcard-rec">
          <div className="cx-card-h" onClick={() => toggleCard('rec')}>
            <span className="cx-chev">{cardCollapsed('rec') ? '▸' : '▾'}</span><h5>Recursos</h5><span className="cx-count">{otherBuckets.recursos.length}</span>
            <span className="cx-muted cx-small">· agrupados pelo processo principal</span>
          </div>
          {!cardCollapsed('rec') && <div className="cx-pt-wrap"><table className="cx-pt"><ProcTableHead /><tbody>
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
        </section>

        {/* Embargos */}
        <section className="cx-card cx-pcard" id="cx-pcard-emb">
          <div className="cx-card-h" onClick={() => toggleCard('emb')}>
            <span className="cx-chev">{cardCollapsed('emb') ? '▸' : '▾'}</span><h5>Embargos</h5><span className="cx-count">{otherBuckets.embargos.length}</span>
            <span className="cx-muted cx-small">· embargos à execução, à execução fiscal e de terceiro</span>
            {embargosOpenPrazo && <span className="cx-badge red">prazo aberto</span>}
          </div>
          {!cardCollapsed('emb') && <div className="cx-pt-wrap"><table className="cx-pt"><ProcTableHead /><tbody>
            <GroupBlock groupKey="emb-all" label={null} rows={filterRows(otherBuckets.embargos)} />
            {otherBuckets.embargos.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhum embargo.</td></tr>}
          </tbody></table></div>}
        </section>

        {/* Outros */}
        <section className="cx-card cx-pcard" id="cx-pcard-out">
          <div className="cx-card-h" onClick={() => toggleCard('out')}>
            <span className="cx-chev">{cardCollapsed('out') ? '▸' : '▾'}</span><h5>Outros</h5><span className="cx-count">{otherBuckets.outros.length}</span>
            <span className="cx-muted cx-small">· cumprimento, procedimento comum e demais</span>
          </div>
          {!cardCollapsed('out') && <div className="cx-pt-wrap"><table className="cx-pt"><ProcTableHead /><tbody>
            <GroupBlock groupKey="out-all" label={null} rows={filterRows(otherBuckets.outros)} />
            {otherBuckets.outros.length === 0 && <tr><td colSpan={7} className="cx-empty-row">Nenhum outro processo.</td></tr>}
          </tbody></table></div>}
        </section>
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
