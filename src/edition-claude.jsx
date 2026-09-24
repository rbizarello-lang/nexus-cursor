/* ═══════════════════════════════════════════════════════════════════════════
   NEXUS · Edição Claude (Ardósia) — Fase 1
   Casca nova (menu lateral + barra superior), Hoje e Intimações (lista, quadro,
   foco e gaveta). Lê e grava os MESMOS dados do App (props); não tem estado de
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
        <button type="button" className={'cx-nav-item' + (onOp && activeTab === 'notas' ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, 'notas')}><span className="cx-lbl">Visão geral · Briefing</span></button>
        {CX_OP_TABS.slice(1).map(t => <button key={t[0]} type="button" className={'cx-nav-item' + (onOp && activeTab === t[0] ? ' on' : '')} onClick={() => p.onOpenOpTab(o.id, t[0])}><span className="cx-lbl">{t[1]}</span></button>)}
      </div> : null}
    </div>;
  };
  return <aside className="cx cx-side" aria-label="Navegação">
    <div className="cx-side-head">
      <button type="button" className="cx-brand" onClick={() => p.onNav('hoje')} title="NEXUS · edição Claude (Ardósia)">
        <span className="cx-brand-mark">N</span>
        <span className="cx-ell"><span className="cx-brand-name">NEXUS</span><span className="cx-brand-sub">Ardósia · {NEXUS_VERSION}</span></span>
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
      <span>Edição Claude · Ardósia</span>
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
