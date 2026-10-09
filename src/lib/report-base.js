/**
 * Base do relatório (Nexus, 4º modelo da janela "Relatório") — função pura, sem DOM nem React.
 * Monta os blocos do Google Doc (visão geral, por frente, quadros e cronologia) e as abas da planilha
 * (Cronologia e Constrições) a partir dos dados da operação. Sem prosa analítica e sem pendências.
 *
 * buildBaseRelatorio(input, opts) → { title, sheetTitle, periodLabel, blocks, sheets, counts, records }
 *  input: { op, debts, executions, intimations, hearings, assets, people, documents, measures, briefing,
 *           prescriptionEvents, changeLog,
 *           deps: { getStageRecords, resolveStageDef, PROCESS_STAGES, CENTRAL_STAGES, isEfStylePanoramaCard,
 *                   getBriefingEntries, BRIEFING_ENTRY_TYPES, CX_HEARING, ASSET_STATUSES, EXEC_STATUSES, ASSET_SUBTYPES } }
 *  opts : { fromIso, toIso, fronts: [chaves], periodLabel? }
 */
import { toDayKey, fmtDate, normProc } from './dates.js';
import { diaryEntryInReport, htmlShell, escHtml, safeUrl } from './report.js';
import { intimationDecisionText } from './atuacoes.js';
import { sheetsToCsvParts } from './export.js';

export const BASE_FRONTS = {
  idpj: 'IDPJ',
  mcf: 'Medida Cautelar Fiscal',
  central: 'EF central',
  efs: 'EFs sem incidente',
};
const BASE_GERAL = 'geral';
const BASE_GERAL_LABEL = 'Geral da operação';
export const BASE_CRONO_HEADER = ['Data', 'Processo', 'Frente', 'Tipo', 'Fato', 'Teor/Resumo', 'Valor', 'Link', 'Fonte no app'];
export const BASE_CONSTR_HEADER = ['Bem', 'Titular', 'Tipo', 'Data da constrição', 'Valor', 'Processo', 'Situação'];

const _rbStr = (v) => String(v == null ? '' : v).trim();
const _rbPlain = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Máscara CNJ (0000000-00.0000.0.00.0000) quando há 20 dígitos; senão devolve o texto como veio. */
export function maskCnjNumber(v) {
  const raw = _rbStr(v);
  const d = normProc(raw);
  if (d.length === 20) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`;
  return raw;
}

/** "R$ 1.234,56"; vazio quando não há valor. */
export function baseMoney(n) {
  if (n == null || n === '' || !isFinite(+n)) return '';
  const v = Math.abs(+n);
  const [i, f] = v.toFixed(2).split('.');
  return (n < 0 ? '-' : '') + 'R$ ' + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + f;
}

/** Frente de cada execução: IDPJ / MCF / EF central; as demais seguem o incidente que as cobre (ou o pai) e, sem vínculo, são "EFs sem incidente". */
export function classifyBaseFronts(executions) {
  const execs = executions || [];
  const byId = new Map(execs.map(e => [e.id, e]));
  const own = (e) => (e.processTag === 'idpj' ? 'idpj' : e.processTag === 'cautelar_fiscal' ? 'mcf' : e.processTag === 'central' ? 'central' : '');
  const coverBy = new Map();
  ['idpj', 'mcf'].forEach(k => execs.forEach(h => {
    if (own(h) !== k) return;
    const ids = new Set(h.linkedExecutionIds || []);
    execs.forEach(e => { if (e.parentExecutionId === h.id) ids.add(e.id); });
    ids.forEach(id => { if (!coverBy.has(id)) coverBy.set(id, k); });
  }));
  const out = {};
  const resolve = (e, depth) => {
    if (!e) return 'efs';
    if (out[e.id]) return out[e.id];
    let k = own(e) || coverBy.get(e.id) || '';
    if (!k && e.parentExecutionId && depth < 6) {
      const p = byId.get(e.parentExecutionId);
      if (p) k = resolve(p, depth + 1);
    }
    return k || 'efs';
  };
  execs.forEach(e => { out[e.id] = resolve(e, 0); });
  return out;
}

/** Registros datados da operação (providências, decisões, constrições, intimações, audiências, fases, diário). */
function collectBaseRecords(input, frontOfExec, execByProc) {
  const {
    executions = [], intimations = [], hearings = [], assets = [], people = [], documents = [],
    briefing = {}, changeLog = [], deps = {},
  } = input || {};
  const {
    getStageRecords = () => ({}), resolveStageDef = (S, k) => S[k] || { label: k, outcomes: {} },
    PROCESS_STAGES = {}, CENTRAL_STAGES = {}, isEfStylePanoramaCard = () => false,
    getBriefingEntries = () => [], BRIEFING_ENTRY_TYPES = {}, CX_HEARING = {}, ASSET_STATUSES = {}, ASSET_SUBTYPES = {},
  } = deps;
  const out = [];
  const procInfo = (num, execId) => {
    const ex = execId ? executions.find(e => e.id === execId) : execByProc.get(normProc(num));
    const frontKey = ex ? (frontOfExec[ex.id] || 'efs') : BASE_GERAL;
    return { proc: maskCnjNumber(num || (ex && ex.processNumber) || ''), execId: ex ? ex.id : '', front: frontKey };
  };
  const push = (r) => {
    const d = toDayKey(r.date);
    if (!d && r.kind !== 'Constrição') return; // constrição sem data entra como "sem data"
    out.push({ teor: '', value: null, link: '', outcome: '', tipo: '', ...r, date: d, seq: out.length });
  };

  // Intimações: o recebimento (início do prazo ou envio), o teor da decisão e a resposta.
  intimations.forEach(x => {
    const pi = procInfo(x.processNumber);
    const recv = x.dateStart || x.dateSent;
    const desc = _rbStr(x.eventDescription) || _rbStr(x.className) || 'Intimação';
    push({ ...pi, date: recv, kind: 'Intimação', fact: desc, source: 'Intimações' });
    const teor = intimationDecisionText(x);
    if (teor) push({ ...pi, date: recv, kind: 'Decisão', fact: desc, teor, source: 'Intimações', tipo: 'Intimação' });
    const a = x.responseAction;
    if (a && a.respondedAt) {
      const tipo = a.type === 'peticionamento' ? (a.peticionType || 'Manifestação') : a.type === 'ciencia' ? 'Ciência' : 'Outra';
      const resumo = _rbStr(a.description);
      const doc = documents.find(dc => dc.sourceIntimationId === x.id && dc.url);
      push({ ...pi, date: a.respondedAt, kind: 'Providência', tipo, fact: tipo + (resumo ? ' — ' + resumo : ''), teor: resumo, link: _rbStr(a.peticionUrl) || (doc ? _rbStr(doc.url) : ''), source: 'Intimações (resposta)' });
    }
  });
  // Atuações proativas
  executions.forEach(ex => (Array.isArray(ex.proactiveActions) ? ex.proactiveActions : []).forEach(a => {
    if (!a) return;
    const pi = procInfo(ex.processNumber, ex.id);
    push({ ...pi, date: a.date || a.createdAt, kind: 'Providência', tipo: 'Atuação proativa', fact: 'Atuação proativa — ' + _rbStr(a.summary), teor: _rbStr(a.summary), link: _rbStr(a.pecaUrl), source: 'Atuações do processo' });
  }));
  // Documentos manuais (os de intimação e os de atuação proativa já entram acima)
  documents.forEach(dc => {
    if (!dc || dc.sourceIntimationId || dc.sourceActionType === 'proativa') return;
    const pi = procInfo(dc.processNumber);
    push({ ...pi, date: dc.actionDate || dc.createdAt, kind: 'Providência', tipo: _rbStr(dc.type) || 'Peça', fact: _rbStr(dc.title) || _rbStr(dc.type) || 'Documento', teor: _rbStr(dc.description), link: _rbStr(dc.url), source: 'Arquivos' });
  });
  // Fases dos processos (com desfecho, viram decisão)
  executions.forEach(ex => {
    const recs = getStageRecords(briefing, ex.id) || {};
    const STG = isEfStylePanoramaCard(ex) ? CENTRAL_STAGES : PROCESS_STAGES;
    const pi = procInfo(ex.processNumber, ex.id);
    Object.keys(recs).forEach(k => {
      const rec = recs[k];
      if (!rec) return;
      const sd = resolveStageDef(STG, k, rec) || { label: k, outcomes: {} };
      const label = sd.label || k;
      const items = Array.isArray(rec.recursos) && rec.recursos.length ? rec.recursos : [rec];
      items.forEach(it => {
        if (!it || !toDayKey(it.date)) return;
        const oc = it.outcome ? ((sd.outcomes || {})[it.outcome] || it.outcome) : '';
        const texto = _rbStr(it.texto != null ? it.texto : rec.texto);
        push({ ...pi, date: it.date, kind: oc ? 'Decisão' : 'Fase', fact: label + (oc ? ' — ' + oc : ''), teor: texto, outcome: oc, source: 'Fases do processo' });
      });
    });
  });
  // Constrições: bens em situação de indisponibilidade
  const personName = new Map(people.map(p => [p.id, p.name]));
  const logDate = (a) => {
    const ds = changeLog
      .filter(l => l.col === 'assets' && l.entityId === a.id && l.field === 'status' && /indispon/i.test(String(l.to || '')))
      .map(l => toDayKey(l.date)).filter(Boolean).sort();
    return ds[0] || '';
  };
  assets.forEach(a => {
    if (!a || !String(a.status || '').startsWith('indisponibilidade_')) return;
    const d = toDayKey(a.constrictionDate) || logDate(a) || toDayKey(a.createdAt);
    const pi = procInfo(a.processRef || a.processNumber);
    const st = (ASSET_STATUSES[a.status] || {}).label || a.status;
    push({
      ...pi, date: d, kind: 'Constrição', fact: `${_rbStr(a.description) || 'Bem'} — ${st}`, value: a.value != null && a.value !== '' ? +a.value : null,
      source: 'Bens', asset: { bem: _rbStr(a.description), titular: personName.get(a.holderId) || '', tipo: ASSET_SUBTYPES[a.subtype] || a.subtype || '', situacao: st },
    });
  });
  // Audiências realizadas ou designadas (com data)
  hearings.forEach(h => {
    if (!h || !h.date || h.status === 'cancelada') return;
    const pi = procInfo(h.processNumber);
    const real = h.status === 'realizada';
    push({ ...pi, date: h.date, kind: 'Audiência', fact: `${CX_HEARING[h.hearingType] || 'Audiência'} (${real ? 'realizada' : 'designada'}${h.time ? ' às ' + h.time : ''})`, teor: _rbStr(h.parties), source: 'Audiências' });
  });
  // Diário: só as entradas marcadas "No relatório"
  getBriefingEntries(briefing).forEach(en => {
    if (!diaryEntryInReport(en)) return;
    const t = (BRIEFING_ENTRY_TYPES[en.type] || { label: '' }).label;
    const pi = procInfo(en.processNumber);
    push({ ...pi, date: en.eventDate || en.createdAt, kind: en.type === 'decisao' ? 'Decisão' : 'Diário', tipo: t, fact: t || 'Diário', teor: _rbPlain(en.html), source: 'Diário' });
  });
  return out;
}

// Listas de entrada podem trazer buracos (null/undefined): descarta antes de usar.
const _RB_LISTS = ['people', 'intimations', 'executions', 'assets', 'documents', 'hearings', 'debts', 'entries', 'measures', 'prescriptionEvents', 'changeLog'];
function _rbClean(input) {
  const out = { ...(input || {}) };
  _RB_LISTS.forEach(k => { if (Array.isArray(out[k])) out[k] = out[k].filter(Boolean); });
  return out;
}

const _rbTable = (header, rows, mono) => ({ type: 'table', header, rows, mono: mono || [] });

/** Monta a Base do relatório. Ver o cabeçalho do arquivo. */
export function buildBaseRelatorio(input0, opts) {
  const input = _rbClean(input0);
  const { op = {}, debts = [], executions = [], people = [], deps = {} } = input || {};
  const { EXEC_STATUSES = {} } = deps;
  const o = opts || {};
  const fromIso = o.fromIso || '0001-01-01';
  const toIso = o.toIso || '9999-12-31';
  const allKeys = Object.keys(BASE_FRONTS);
  const chosen = new Set(Array.isArray(o.fronts) ? o.fronts : allKeys);
  const periodLabel = o.periodLabel || `${fmtDate(fromIso)} a ${fmtDate(toIso)}`;

  const frontOfExec = classifyBaseFronts(executions);
  const execByProc = new Map();
  executions.forEach(e => { const k = normProc(e.processNumber); if (k && !execByProc.has(k)) execByProc.set(k, e); });
  const all = collectBaseRecords(input, frontOfExec, execByProc)
    .filter(r => !r.date || (r.date >= fromIso && r.date <= toIso)) // sem data: o período não se aplica
    .sort((a, b) => (a.date === b.date ? a.seq - b.seq : !a.date ? 1 : !b.date ? -1 : a.date < b.date ? -1 : 1)); // sem data no fim
  const frontLabel = (k) => (k === BASE_GERAL ? BASE_GERAL_LABEL : BASE_FRONTS[k] || k);
  const recs = all.filter(r => r.front === BASE_GERAL || chosen.has(r.front));
  const D = (r) => (r.date ? fmtDate(r.date) : 'sem data');
  const dated = recs.filter(r => r.date); // seções 2 e 6 só com fatos datados

  const blocks = [];
  const name = _rbStr(op.name) || 'Operação';
  blocks.push({ type: 'h1', text: name });

  // 1. Visão geral
  blocks.push({ type: 'h2', text: '1. Visão geral da operação' });
  const ident = [`Operação: ${name}`];
  if (_rbStr(op.description)) ident.push(`Descrição: ${_rbStr(op.description)}`);
  ident.push(`Situação: ${op.status === 'encerrada' ? 'Encerrada' : 'Em andamento'}`);
  ident.push(`Período do relatório: ${periodLabel}`);
  blocks.push({ type: 'list', items: ident });
  const alvos = people.filter(p => p && p.operationRole === 'alvo');
  blocks.push({ type: 'h3', text: 'Devedores principais' });
  if (alvos.length) blocks.push({ type: 'list', items: alvos.map(p => `${p.name}${p.cpfCnpj ? ' (' + p.cpfCnpj + ')' : ''}${p.role ? ' — ' + p.role : ''}`) });
  else blocks.push({ type: 'p', text: 'Nenhuma parte marcada como alvo.', italic: true });
  const procs = executions.filter(e => chosen.has(frontOfExec[e.id] || 'efs'));
  blocks.push({ type: 'h3', text: 'Processos' });
  if (procs.length) {
    blocks.push(_rbTable(['Número CNJ', 'Tipo/espécie', 'Vara/juízo', 'Situação'], procs.map(e => [
      maskCnjNumber(e.processNumber), _rbStr(e.className), _rbStr(e.court), (EXEC_STATUSES[e.status] || {}).label || _rbStr(e.status),
    ]), [0]));
  } else blocks.push({ type: 'p', text: 'Nenhum processo nas frentes escolhidas.', italic: true });
  const totalVal = debts.reduce((s, d) => s + (+d.value || 0), 0);
  const guarVal = debts.filter(d => d.status === 'garantida').reduce((s, d) => s + (+d.value || 0), 0);
  const extintas = debts.filter(d => d.status === 'extinta').length;
  const prescritas = debts.filter(d => d.status === 'prescrita').length;
  blocks.push({ type: 'h3', text: 'CDAs (totais)' });
  const cdaItems = [`Quantidade: ${debts.length}`, `Valor total: ${baseMoney(totalVal) || 'R$ 0,00'}`];
  if (guarVal > 0) cdaItems.push(`Valor garantido: ${baseMoney(guarVal)}`);
  cdaItems.push(`Extintas: ${extintas}`);
  if (prescritas) cdaItems.push(`Prescritas: ${prescritas}`);
  blocks.push({ type: 'list', items: cdaItems });

  // 2. Por frente
  blocks.push({ type: 'h2', text: '2. Por frente processual' });
  const frontKeys = [...allKeys.filter(k => chosen.has(k)), BASE_GERAL];
  const perFront = {};
  frontKeys.forEach(k => {
    const list = dated.filter(r => r.front === k);
    perFront[k] = list.length;
    if (k === BASE_GERAL && !list.length) return;
    const ps = executions.filter(e => (frontOfExec[e.id] || 'efs') === k).map(e => maskCnjNumber(e.processNumber)).filter(Boolean);
    blocks.push({ type: 'h3', text: frontLabel(k) });
    if (ps.length) blocks.push({ type: 'p', text: 'Processos: ' + ps.join('; '), small: true });
    if (!list.length) { blocks.push({ type: 'p', text: 'Nenhum fato no período.', italic: true }); return; }
    blocks.push(_rbTable(['Data', 'Tipo', 'Fato'], list.map(r => [
      D(r), r.kind,
      [r.proc && (ps.length > 1 || k === BASE_GERAL) ? 'Proc. ' + r.proc + ' — ' : '', r.fact, r.teor && (r.kind === 'Decisão' || r.kind === 'Diário') ? ': ' + r.teor : '', r.value != null ? ' (' + baseMoney(r.value) + ')' : ''].join(''),
    ])));
  });

  // 3. Decisões
  const dec = recs.filter(r => r.kind === 'Decisão');
  blocks.push({ type: 'h2', text: '3. Quadro de decisões judiciais' });
  if (dec.length) blocks.push(_rbTable(['Data', 'Processo', 'Evento', 'Teor', 'Desfecho'], dec.map(r => [D(r), r.proc, r.fact, r.teor, r.outcome]), [1]));
  else blocks.push({ type: 'p', text: 'Nenhuma decisão no período.', italic: true });

  // 4. Constrições
  const cons = recs.filter(r => r.kind === 'Constrição');
  blocks.push({ type: 'h2', text: '4. Quadro de constrições e valores' });
  const consRows = cons.map(r => [r.asset.bem, r.asset.titular, r.asset.tipo, D(r), baseMoney(r.value), r.proc, r.asset.situacao]);
  if (cons.length) blocks.push(_rbTable(BASE_CONSTR_HEADER, consRows, [5]));
  else blocks.push({ type: 'p', text: 'Nenhuma constrição no período.', italic: true });

  // 5. Providências e peças
  const prov = recs.filter(r => r.kind === 'Providência');
  blocks.push({ type: 'h2', text: '5. Quadro de providências e peças' });
  if (prov.length) blocks.push(_rbTable(['Data', 'Processo', 'Tipo', 'Resumo', 'Link'], prov.map(r => [D(r), r.proc, r.tipo, r.teor || r.fact, r.link]), [1]));
  else blocks.push({ type: 'p', text: 'Nenhuma providência no período.', italic: true });

  // 6. Cronologia completa (anexo)
  blocks.push({ type: 'pagebreak' });
  blocks.push({ type: 'h2', text: '6. Cronologia completa' });
  const cronoRows = dated.map(r => [D(r), r.proc, frontLabel(r.front), r.kind, r.fact, r.teor, baseMoney(r.value), r.link, r.source]);
  if (cronoRows.length) blocks.push(_rbTable(BASE_CRONO_HEADER, cronoRows, [1]));
  else blocks.push({ type: 'p', text: 'Nenhum registro no período.', italic: true });

  const sheets = [
    { name: 'Cronologia', header: BASE_CRONO_HEADER, rows: cronoRows, mono: [1] },
    { name: 'Constrições', header: BASE_CONSTR_HEADER, rows: consRows, mono: [5] },
  ];
  const counts = {
    total: recs.length,
    sections: { s1: procs.length, s2: Object.values(perFront).reduce((s, n) => s + n, 0), s3: dec.length, s4: cons.length, s5: prov.length, s6: cronoRows.length },
    fronts: allKeys.map(k => ({
      key: k, label: BASE_FRONTS[k],
      count: all.filter(r => r.front === k).length,
      processes: executions.filter(e => (frontOfExec[e.id] || 'efs') === k).length,
    })),
    geral: all.filter(r => r.front === BASE_GERAL).length,
    kinds: recs.reduce((m, r) => { m[r.kind] = (m[r.kind] || 0) + 1; return m; }, {}),
  };
  return {
    title: `Base do relatório — ${name} — ${periodLabel}`,
    sheetTitle: `Base do relatório (cronologia) — ${name} — ${periodLabel}`,
    periodLabel, blocks, sheets, counts, records: recs,
  };
}

/** HTML imprimível da Base (alternativa ao Google Doc fora do app publicado). */
export function renderBaseHtml(base, generatedAtLabel) {
  const cell = (v, mono) => {
    const s = _rbStr(v);
    if (/^https?:\/\//i.test(s)) { const u = safeUrl(s); return u ? `<a href="${escHtml(u)}">abrir</a>` : ''; }
    return mono ? `<span class="mono">${escHtml(s)}</span>` : escHtml(s);
  };
  let body = '';
  (base.blocks || []).forEach(b => {
    if (b.type === 'h1') body += `<h1>${escHtml(b.text)}</h1><div class="desc">${escHtml(base.periodLabel || '')}</div>`;
    else if (b.type === 'h2') body += `<h2>${escHtml(b.text)}</h2>`;
    else if (b.type === 'h3') body += `<h3 style="font-size:12px;margin:14px 0 4px">${escHtml(b.text)}</h3>`;
    else if (b.type === 'p') body += `<p class="${b.small ? 'sig' : 'fr-txt'}"${b.italic ? ' style="font-style:italic"' : ''}>${escHtml(b.text)}</p>`;
    else if (b.type === 'list') body += `<ul>${(b.items || []).map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`;
    else if (b.type === 'table') {
      const mono = new Set(b.mono || []);
      body += `<table><thead><tr>${(b.header || []).map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead><tbody>${(b.rows || []).map(r => `<tr>${r.map((c, i) => `<td>${cell(c, mono.has(i))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    } else if (b.type === 'pagebreak') body += '<div style="page-break-after:always"></div>';
  });
  body += `<div class="foot"><span>Gerado pelo Nexus${generatedAtLabel ? ' em ' + escHtml(generatedAtLabel) : ''}</span><span></span></div>`;
  return htmlShell(base.title, `<div class="a4">${body}</div>`);
}

/** CSV (;, BOM UTF-8) da aba Cronologia. */
export function baseCronologiaCsv(base) {
  const s = ((base && base.sheets) || [])[0];
  if (!s) return '';
  return sheetsToCsvParts([{ name: s.name, rows: [s.header, ...s.rows] }])[0].csv;
}
