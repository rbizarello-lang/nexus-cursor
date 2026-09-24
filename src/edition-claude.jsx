/* ═══════════════════════════════════════════════════════════════════════════
   Nexus Prumo (uiEdition 'claude', tema Ardósia) — Fases 1 a 3
   Casca nova (menu lateral + barra superior), Hoje e Intimações (lista, quadro,
   foco e gaveta); Carteira, Visão geral da operação, Linha do tempo e Mesa de
   prazos extintivos (Fase 2); Tarefas, Agenda e Mesa de trabalho (Fase 3). Lê e grava os MESMOS dados do App (props); não tem estado de
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
  analisado: { l: 'Analisado', c: 'var(--cx-green)' },
};
const CX_IMP = { alta: 'Alta', normal: 'Média', baixa: 'Baixa' };
const CX_DIF = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const CX_HEARING = { instrucao: 'Audiência de instrução', conciliacao: 'Audiência de conciliação', una: 'Audiência una', justificacao: 'Audiência de justificação', inquiricao: 'Inquirição', outra: 'Audiência' };
const CX_OP_COLORS = ['var(--cx-op1)', 'var(--cx-op2)', 'var(--cx-op3)', 'var(--cx-op4)', 'var(--cx-op5)', 'var(--cx-op6)'];
const CX_OP_TABS = [['notas', 'Briefing'], ['prescricao_v2', 'Processos e prescrição'], ['dividas', 'Inscrições'], ['pessoas', 'Pessoas'], ['bens', 'Bens'], ['tarefas', 'Tarefas'], ['docs', 'Arquivos'], ['importar', 'Importar']];

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
  const ops = (data.operations || []).slice().sort(sortOpsByName);
  const q = cxNorm(filter.trim());
  const match = (o) => !q || cxNorm(o.name).includes(q);
  const active = ops.filter(o => o.status !== 'encerrada' && match(o));
  const closed = ops.filter(o => o.status === 'encerrada' && match(o));
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
        {CX_OP_TABS.map(t => <button key={t[0]} type="button" className={'cx-nav-item' + (onOp && activeTab === t[0] ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, t[0])}><span className="cx-lbl">{t[1]}</span></button>)}
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
        {item('operacoes', 'briefcase', 'Carteira', <span className="cx-count">{active.length}</span>)}
        {item('prazos', 'hourglass', 'Prazos extintivos', counts.presc1 ? <span className="cx-badge red">{counts.presc1}</span> : null)}
        {item('cx_timeline', 'timeline', 'Linha do tempo')}
        {item('audiencias', 'calendar', 'Agenda', counts.hearings ? <span className="cx-count">{counts.hearings}</span> : null)}
        {item('acompanhar', 'eye', 'Acompanhar', counts.watch ? <span className="cx-count">{counts.watch}</span> : null)}
        {item('modelos', 'book', 'Biblioteca', counts.models ? <span className="cx-count">{counts.models}</span> : null)}
        {item('painel', 'chart', 'Painel')}
        <button type="button" className="cx-nav-item" onClick={p.onImportEproc}><CxIcon n="upload" /><span className="cx-lbl">Importar eproc</span></button>
      </nav>
      <div className="cx-nav-sec"><span>Operações</span><button type="button" className="cx-icon-btn cx-sm" title="Nova operação" aria-label="Nova operação" onClick={p.onNewOp}><CxIcon n="plus" s={14} /></button></div>
      {ops.length > 8 ? <label className="cx-side-filter"><CxIcon n="search" s={13} /><input id="cx-op-filter" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar operações" aria-label="Filtrar operações" /></label> : null}
      <nav className="cx-nav">
        {active.map(renderOp)}
        {active.length === 0 ? <div className="cx-side-empty">{ops.length ? 'Nenhuma operação com esse nome.' : 'Crie sua primeira operação.'}</div> : null}
        {closed.length ? <button type="button" className="cx-nav-item cx-nav-closed" onClick={() => setShowClosed(v => !v)}><span className="cx-chev" style={{ transform: showClosed ? 'rotate(90deg)' : 'none' }}><CxIcon n="chevR" s={12} /></span><span className="cx-lbl">Encerradas</span><span className="cx-count">{closed.length}</span></button> : null}
        {showClosed ? closed.map(renderOp) : null}
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
function EditionClaudeHoje(p) {
  const { data, prazosRadar, prazosByDebt, opsById } = p;
  const [tab, setTab] = React.useState('proximos');
  const queue = React.useMemo(() => cxBuildQueue(data, prazosByDebt, opsById), [data, prazosByDebt, opsById]);
  const intims = data.intimations || [];
  const open = intims.filter(cxIsOpen);
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
      <button type="button" className="cx-kpi" onClick={() => p.onNav('intimacoes')}>
        <span className="cx-kpi-l"><CxIcon n="inbox" s={14} />Intimações abertas</span>
        <span className="cx-kpi-v">{open.length}</span>
        <span className={'cx-kpi-s' + (late.length ? ' red' : '')}>{cxPl(late.length, 'vencida', 'vencidas')} · {today.length} hoje</span>
        <span className="cx-spark" title="Intimações recebidas por dia útil (data de envio), últimos 14 dias úteis" aria-hidden="true">{intake.map((v, k) => <i key={k} className={k === intake.length - 1 ? 'last' : ''} style={{ height: Math.max(4, v / intakeMax * 100) + '%' }} />)}</span>
      </button>
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
    groups = ufs.sort((a, b) => (jurisRank(a) - jurisRank(b)) || a.localeCompare(b)).map(u => ({ key: 'uf' + u, label: u === '?' ? 'Sem UF' : u, icon: <span className="cx-uf">{u}</span>, items: open.filter(x => (x.jurisdiction || '?') === u) }));
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
    onClick={() => onOpen(intim.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(intim.id); } }}>
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
          <span className="cx-caret"><CxIcon n="chevD" s={14} /></span>{g.icon}<span>{g.label}</span><span className="cx-n">{g.items.length}</span>
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
function EditionClaudeIntimacoes(p) {
  const { data, opsById, view, setView } = p;
  const [q, setQ] = React.useState('');
  const [opF, setOpF] = React.useState('all');
  const [scope, setScope] = React.useState('ativas');
  const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const [groupBy, setGroupByS] = React.useState(() => lsGet('nexus_cx_group', 'prazo'));
  const [sort, setSortS] = React.useState(() => lsGet('nexus_cx_sort', 'atencao'));
  const setGroupBy = (v) => { setGroupByS(v); try { localStorage.setItem('nexus_cx_group', v); } catch (e) { /* ignore */ } };
  const setSort = (v) => { setSortS(v); try { localStorage.setItem('nexus_cx_sort', v); } catch (e) { /* ignore */ } };
  const all = data.intimations || [];
  const opIds = [...new Set(all.map(x => x.operationId).filter(Boolean))];
  const opOptions = [['all', 'Todas'], ['none', 'Sem operação']].concat(opIds.map(id => opsById.get(id)).filter(Boolean).sort(sortOpsByName).map(o => [o.id, cxOpName(o)]));
  const toks = cxNorm(q).split(/\s+/).filter(Boolean);
  const filtered = all.filter(x => {
    if (scope === 'ativas' ? !!x.responseAction : !x.responseAction) return false;
    if (opF === 'none' ? !!x.operationId : opF !== 'all' && x.operationId !== opF) return false;
    if (!toks.length) return true;
    const hay = cxNorm([cxPartyName(x), x.parties, x.eventDescription, x.className, x.subject, x.object, x.processNumber, (opsById.get(x.operationId) || {}).name, cxNotes(x).join(' ')].join(' '));
    const dig = String(x.processNumber || '').replace(/\D/g, '');
    return toks.every(t => hay.includes(t) || (t.replace(/\D/g, '').length >= 3 && dig.includes(t.replace(/\D/g, ''))));
  });
  const open = all.filter(cxIsOpen);
  const late = open.filter(x => { const d = daysUntil(x.dateDeadline); return d !== null && d < 0; }).length;
  const resolvedCount = all.filter(x => !!x.responseAction).length;
  const groups = scope === 'ativas' ? cxGroupIntims(filtered, groupBy, opsById) : cxGroupResolved(filtered);
  return <div className="cx cx-page">
    <div className="cx-page-h">
      <div><h1>Intimações</h1><p>{cxPl(open.length, 'aberta', 'abertas')}, {cxPl(late, 'vencida', 'vencidas')}. Ordem padrão: urgente, importância, complexidade e prazo.</p></div>
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
        {view === 'lista' && scope === 'ativas' ? <CxSelect id="cx-f-g" pre="Agrupar" value={groupBy} onChange={setGroupBy} options={[['prazo', 'Prazo'], ['situacao', 'Situação'], ['operacao', 'Operação'], ['uf', 'UF']]} /> : null}
        <CxSelect id="cx-f-s" pre="Ordenar" value={sort} onChange={setSort} options={[['atencao', 'Atenção'], ['prazo', 'Prazo final'], ['importancia', 'Importância'], ['complexidade', 'Complexidade']]} />
      </div>
      {view === 'quadro'
        ? <CxBoard items={filtered.filter(cxIsActive)} sort={sort} onOpen={p.onOpenIntim} opsById={opsById} onSetStatus={(id, s) => { const x = all.find(i => i.id === id); if (x && x.status !== s) { p.upsert('intimations', { ...x, status: s }); cxNotify('Situação: ' + CX_ST[s].l); } }} />
        : <CxIntimList items={filtered} groups={groups} sort={sort} onOpen={p.onOpenIntim} onOpenOp={p.onOpenOp} selId={p.drawerId} opsById={opsById} emptyText={all.length ? null : 'Nenhuma intimação ainda. Importe o XLS do eproc para começar.'} />}
    </>}
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
  const resolved = !!intim.responseAction;
  const set = (patch) => a.upsert('intimations', { ...intim, ...patch });
  const exec = (data.executions || []).find(e => sameProc(e.processNumber, intim.processNumber) && (!intim.operationId || e.operationId === intim.operationId))
    || (data.executions || []).find(e => sameProc(e.processNumber, intim.processNumber));
  const cdas = (data.debts || []).filter(d => sameProc(d.processNumber, intim.processNumber));
  const siblings = (data.intimations || []).filter(x => x.id !== intim.id && sameProc(x.processNumber, intim.processNumber) && cxIsOpen(x)).sort(cxByDeadline);
  const impK = intimImpKey(intim), difK = intimDifKey(intim), urg = intimIsUrgent(intim);
  const ra = intim.responseAction;
  return <div>
    <div className="cx-d-chips">
      <CxOpTag op={op} onOpen={a.onOpenOp} />
      <span className="cx-chip"><CxStatusIcon s={resolved ? 'analisado' : intim.status} />{resolved ? 'Resolvida' : (CX_ST[intim.status] || {}).l || intim.status}</span>
      {intim._importFlag === 'new' ? <span className="cx-tag blue">Novo no último import</span> : intim._importFlag === 'updated' ? <span className="cx-tag">Atualizada no último import</span> : null}
      {!resolved ? <button type="button" className={'cx-chip cx-pend' + (intim.hasPending ? ' on' : '')} aria-pressed={!!intim.hasPending} onClick={() => set({ hasPending: !intim.hasPending })} title="Marcar pendência (algo a fazer aqui)"><CxIcon n="flag" s={12} />Pendência</button> : null}
    </div>
    <h2 className="cx-d-title">{cxPartyName(intim)}</h2>
    <p className="cx-d-ev">{intim.eventDescription || intim.className || '—'}</p>
    <CxRuler intim={intim} />

    {resolved ? <>
      <div className="cx-sec-t">Atuação</div>
      <div className="cx-note cx-note-done">
        <b>{ra.type === 'peticionamento' ? (ra.peticionType || 'Peticionamento') : ra.type === 'ciencia' ? 'Ciência' : 'Outra medida'}</b>{ra.respondedAt ? ' · ' + fmtDate(ra.respondedAt) : ''}
        {ra.description ? <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{ra.description}</div> : null}
        {(ra.peticionUrl || ra.docUrl) ? <div style={{ marginTop: 6 }}><a className="cx-a" href={ra.peticionUrl || ra.docUrl} target="_blank" rel="noopener noreferrer"><CxIcon n="link" s={13} />{String(ra.peticionUrl || ra.docUrl).includes('docs.google') ? 'Google Docs' : 'Abrir peça'}</a></div> : null}
      </div>
    </> : <>
      <div className="cx-sec-t">Gramática</div>
      <div className="cx-gram">
        <div className="cx-gram-f"><span>Importância</span><CxSeg label="Importância" value={impK} onChange={v => set({ priority: v })} options={[['baixa', 'Baixa'], ['normal', 'Média'], ['alta', 'Alta']]} /></div>
        <div className="cx-gram-f"><span>Complexidade</span><CxSeg label="Complexidade" value={difK} onChange={v => set({ difficulty: v })} options={[['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta']]} /></div>
        <div className="cx-gram-f"><span>Marcação</span><button type="button" className={'cx-urg-t' + (urg ? ' on' : '')} aria-pressed={urg} onClick={() => set(urg ? { urgent: false, priority: (intim.priority === 'urgente' || intim.priority === 'urgent') ? 'alta' : intim.priority } : { urgent: true })}><CxIcon n="flag" s={13} />Urgente</button></div>
      </div>
    </>}

    <div className="cx-sec-t">Notas <span className="cx-n">{notes.length}</span></div>
    <div className="cx-notes">
      {notes.map((n, k) => <div key={k} className="cx-note">{a.linkify ? a.linkify(n) : n}</div>)}
      {notes.length === 0 ? <div className="cx-muted cx-small">Sem notas ainda.</div> : null}
      <form className="cx-note-add" onSubmit={e => { e.preventDefault(); const v = nt.trim(); if (!v) return; set({ notesList: [...notes, v] }); setNt(''); cxNotify('Nota adicionada'); }}>
        <textarea id={'cx-nt-' + intim.id} value={nt} onChange={e => setNt(e.target.value)} placeholder="Adicionar nota…" aria-label="Nova nota" onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} />
        <button type="submit" className="cx-btn">Anotar</button>
      </form>
    </div>

    <div className="cx-sec-t">Dados</div>
    <dl className="cx-props">
      <dt>Processo</dt><dd>{intim.processNumber ? <><CxProc num={intim.processNumber} uf={intim.jurisdiction} /><button type="button" className="cx-copy" title="Copiar número" aria-label="Copiar número" onClick={() => cxCopy(intim.processNumber)}><CxIcon n="copy" s={13} /></button><a className="cx-a cx-small" href={cxEprocUrl(intim.processNumber)} target="_blank" rel="noopener noreferrer">eproc<CxIcon n="arrowUR" s={11} /></a></> : '—'}</dd>
      <dt>Classe</dt><dd>{intim.className || '—'}</dd>
      {intim.organ ? <><dt>Órgão</dt><dd>{intim.organ}</dd></> : null}
      {intim.parties ? <><dt>Partes</dt><dd>{intim.parties}</dd></> : null}
      {intim.subject ? <><dt>Assunto</dt><dd>{intim.subject}</dd></> : null}
      <dt>Objeto</dt><dd>{intim.object || <span className="cx-muted">—</span>}</dd>
      {intim.minutaUrl ? <><dt>Minuta</dt><dd><a className="cx-a" href={intim.minutaUrl} target="_blank" rel="noopener noreferrer"><CxIcon n="link" s={13} />{intim.minutaUrl.includes('docs.google') ? 'Google Docs' : 'Documento'}</a></dd></> : null}
    </dl>

    {(exec || cdas.length || siblings.length) ? <>
      <div className="cx-sec-t">Contexto do processo</div>
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
    </> : null}

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
function cxReviewNext(op) {
  const it = REVIEW_INTERVALS[op.reviewInterval || 'mensal'];
  if (!it || !it.days || !op.lastReviewedAt) return null;
  const d = new Date(op.lastReviewedAt); d.setDate(d.getDate() + it.days);
  return localIso(d);
}
function cxReviewTag(op) {
  const rs = reviewStatus(op);
  if (rs.daysLeft === null) return null;
  const tone = rs.overdue ? 'orange' : rs.daysLeft <= 3 ? 'yellow' : '';
  return <span className={'cx-tag ' + tone} title={'Revisão ' + ((REVIEW_INTERVALS[op.reviewInterval || 'mensal'] || {}).label || '').toLowerCase()}><CxIcon n="history" s={11} />{rs.label}</span>;
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
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sort, setSortS] = React.useState(() => { try { return localStorage.getItem('nexus_cx_cart_sort') || 'nome'; } catch (e) { return 'nome'; } });
  const setSort = (v) => { setSortS(v); try { localStorage.setItem('nexus_cx_cart_sort', v); } catch (e) { /* ignore */ } };
  const idx = React.useMemo(() => cxOpIndex(data, prazosByDebt), [data, prazosByDebt]);
  const ops = data.operations || [];
  const used = {};
  ops.forEach(o => getOpClassifications(o).forEach(k => { used[k] = (used[k] || 0) + 1; }));
  const chips = [['all', 'Todas', ops.filter(o => o.status !== 'encerrada').length]];
  ['alta_relevancia', 'parceladas'].forEach(k => { const n = ops.filter(o => opMatchesClassFilter(o, k)).length; if (n) chips.push([k, OP_CLASSIFICATIONS[k].label, n]); });
  Object.keys(used).filter(k => k !== 'alta_relevancia' && k !== 'parceladas').sort((a, b) => OP_CLASSIFICATIONS[a].label.localeCompare(OP_CLASSIFICATIONS[b].label, 'pt-BR')).forEach(k => chips.push([k, OP_CLASSIFICATIONS[k].label, used[k]]));
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
    revisao: (a, b) => ((reviewStatus(a).daysLeft ?? 99999) - (reviewStatus(b).daysLeft ?? 99999)),
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
          {o.priority === 'alta' ? <span className="cx-tag red">Alta</span> : null}
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
  const rs = reviewStatus(op);
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
  return <div className="cx cx-page cx-page-wide">
    <div className="cx-op-top">
      <div className="cx-minw0">
        <div className="cx-eyebrow">Operação{op.status === 'encerrada' ? ' · encerrada' : ''}</div>
        <div className="cx-op-hero"><span className="cx-sq-lg" style={{ background: cxOpColor(op.id) }} /><h1>{op.name}</h1>{op.priority === 'alta' ? <span className="cx-tag red">Prioridade alta</span> : null}</div>
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
function cxTaskNotes(t) { return t.notesList && t.notesList.length ? t.notesList : (t.notes ? [t.notes] : []); }
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
    onClick={() => onOpen(t)} onKeyDown={e => { if (e.key === 'Enter') onOpen(t); }}>
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
  const [opF, setOpF] = React.useState('all');
  const [closed, setClosed] = React.useState({ done: true });
  const [draft, setDraft] = React.useState({ title: '', dueDate: '', priority: 'media', operationId: '' });
  const all = data.tasks || [];
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
/* Junta, por dia, audiências, prazos de intimação, tarefas com data limite e termos de prescrição (grupos 1 a 4). */
function cxAgendaByDay(data, prazosRadar, fromIso, toIso, opF) {
  const by = {};
  const put = (iso, it) => { const k = toDayKey(iso); if (!k || k < fromIso || k > toIso) return; (by[k] || (by[k] = [])).push(it); };
  const okOp = (id) => opF === 'all' || (opF === 'none' ? !id : id === opF);
  (data.hearings || []).forEach(h => { if (!h.date || h.status === 'cancelada' || h.status === 'realizada' || !okOp(h.operationId)) return; put(h.date, { id: 'h' + h.id, kind: 'aud', time: h.time || '', title: (CX_HEARING[h.hearingType] || 'Audiência'), sub: h.parties || h.processNumber || '', op: h.operationId, ref: h }); });
  (data.intimations || []).forEach(x => { if (!intimPrazoNaAgenda(x) || !okOp(x.operationId)) return; put(x.dateDeadline, { id: 'i' + x.id, kind: 'prazo', title: cxPartyName(x), sub: x.eventDescription || x.className || '', op: x.operationId, urgent: intimIsUrgent(x), ref: x }); });
  (data.tasks || []).forEach(t => { if (!t.dueDate || !cxTaskOpen(t) || !okOp(t.operationId)) return; put(t.dueDate, { id: 't' + t.id, kind: 'tarefa', title: t.title || 'Tarefa', sub: t.description || '', op: t.operationId, urgent: t.priority === 'urgente', ref: t }); });
  (prazosRadar.rows || []).forEach(r => { if (!r.keyDate || r.group > 4 || r.silenceReason || !okOp(r.operationId)) return; put(r.keyDate, { id: 'p' + r.id, kind: 'presc', title: 'CDA ' + (r.cdaNumber || 'S/N'), sub: betaSafeUiText(r.why || r.summary || ''), op: r.operationId, urgent: r.group === 1, ref: r }); });
  const rank = { aud: 0, prazo: 1, tarefa: 2, presc: 3 };
  Object.keys(by).forEach(k => by[k].sort((a, b) => rank[a.kind] - rank[b.kind] || String(a.time || '').localeCompare(String(b.time || '')) || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)));
  return by;
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
  return <div className={'cx-h-row' + (closed ? ' done' : '') + (tone ? ' ' + tone : '')} role="button" tabIndex={0} onClick={() => onOpen(h)} onKeyDown={e => { if (e.key === 'Enter') onOpen(h); }}>
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
  const [opF, setOpF] = React.useState('all');
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
