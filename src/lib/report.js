/**
 * Relatório da operação (Nexus, todas as edições) — funções puras.
 * Não usam React nem `window`: recebem os dados já filtrados/calculados por
 * quem chama (o app) e devolvem uma string HTML pronta para baixar/imprimir.
 *
 * Modelos: 'passagem' (passagem de serviço completa), 'resumo' (só a página
 * 1 da passagem de serviço) e 'prestacao' (prestação de contas de um período).
 */
import { addCalendarDays } from './dates.js';

export const REPORT_MODELS = {
  passagem: { label: 'Passagem de serviço' },
  resumo: { label: 'Resumo de uma página' },
  prestacao: { label: 'Prestação de contas' },
};

export const REPORT_SECTION_KEYS = ['leitura', 'proximos', 'alertas', 'frentes', 'diario', 'lembretes', 'bens', 'partes', 'fontes'];

export function defaultReportSections() {
  const out = {};
  REPORT_SECTION_KEYS.forEach(k => { out[k] = true; });
  return out;
}

export function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ───────────────────── Leitura da operação ─────────────────────
/**
 * Entrada em destaque: a entrada do diário tipo 'estrategia' fixada mais
 * recente; senão a fixada mais recente de qualquer tipo; senão null (omitir).
 */
export function pickHighlightEntry(entries) {
  const pinned = (entries || []).filter(e => e && e.pinned);
  if (!pinned.length) return null;
  const sortKey = (e) => e.eventDate || (e.createdAt || '').slice(0, 10) || '';
  const byDateDesc = (a, b) => sortKey(b).localeCompare(sortKey(a));
  const estrategia = pinned.filter(e => e.type === 'estrategia').sort(byDateDesc);
  if (estrategia.length) return estrategia[0];
  return [...pinned].sort(byDateDesc)[0];
}

// ───────────────────── Próximos 15 dias ─────────────────────
/**
 * Junta prazos, audiências, tarefas e termos de prescrição numa lista só,
 * em ordem de data, cortando no horizonte (padrão 15 dias) e devolvendo o
 * excedente ("depois +N", com o primeiro item do excedente como prévia).
 * @param {Array<{date:string,kind:string,time?:string,urgent?:boolean}>} items
 * @param {{fromIso:string, days?:number}} opts
 */
export function buildNext15Days(items, opts) {
  const { fromIso, days = 15 } = opts || {};
  const horizonEnd = fromIso ? addCalendarDays(fromIso, days) : '';
  const rank = { aud: 0, prazo: 1, tarefa: 2, presc: 3 };
  const sorted = (items || [])
    .filter(it => it && it.date && (!fromIso || it.date >= fromIso))
    .slice()
    .sort((a, b) =>
      a.date.localeCompare(b.date)
      || (rank[a.kind] ?? 9) - (rank[b.kind] ?? 9)
      || String(a.time || '').localeCompare(String(b.time || ''))
    );
  const within = horizonEnd ? sorted.filter(it => it.date <= horizonEnd) : sorted;
  const overflow = horizonEnd ? sorted.filter(it => it.date > horizonEnd) : [];
  return { items: within, overflow, overflowCount: overflow.length, overflowFirst: overflow[0] || null };
}

// ───────────────────── Prestação de contas ─────────────────────
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function monthLabel(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  const y = Number(m[1]), mo = Number(m[2]);
  return `${MONTHS_PT[mo - 1] || ''} de ${y}`;
}

/**
 * Agrupa os eventos da prestação de contas por mês (mais recente primeiro),
 * mantendo a ordem cronológica decrescente dentro de cada grupo.
 * @param {Array<{date:string,kind:string,text:string}>} events
 */
export function groupAccountingByMonth(events) {
  const sorted = (events || [])
    .filter(e => e && e.date)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const groups = [];
  let cur = null;
  sorted.forEach(ev => {
    const key = ev.date.slice(0, 7);
    if (!cur || cur.key !== key) {
      cur = { key, label: monthLabel(ev.date), events: [] };
      groups.push(cur);
    }
    cur.events.push(ev);
  });
  return groups;
}

/** Números da prestação de contas: intimações tratadas, peças, fases/eventos, constrições, tarefas concluídas. */
export function tallyAccounting(events) {
  const t = { intimacoes: 0, pecas: 0, fases: 0, constricoes: 0, tarefas: 0 };
  (events || []).forEach(ev => {
    switch (ev && ev.kind) {
      case 'Intimação': t.intimacoes++; break;
      case 'Peça': t.pecas++; break;
      case 'Fase': case 'Prescrição': t.fases++; break;
      case 'Constrição': t.constricoes++; break;
      case 'Tarefa': t.tarefas++; break;
      default: break;
    }
  });
  return t;
}

// ───────────────────── CSS (compartilhado pelos 3 modelos) ─────────────────────
const REPORT_CSS = `
:root{--ink:#1b1d22;--ink2:#4d535e;--ink3:#7c828e;--line:#dcdfe4;--line2:#e3e5e9;--red:#c2323d;--orange:#bf5f16;--accent:#8a6722;}
*{box-sizing:border-box}
body{font-family:'Geist','Segoe UI',system-ui,-apple-system,sans-serif;font-size:11.5px;color:var(--ink);background:#d9dce1;margin:0;padding:26px 16px 60px}
.doc{max-width:820px;margin:0 auto;display:grid;gap:18px}
.a4{background:#fff;border-radius:3px;box-shadow:0 2px 10px rgba(0,0,0,.15);padding:34px 36px 30px;min-height:900px}
.a4-top{display:flex;justify-content:space-between;font:500 9.5px 'Geist Mono',ui-monospace,Consolas,monospace;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em;padding-bottom:10px;border-bottom:1px solid var(--line2)}
.a4 h1{font-size:22px;font-weight:600;letter-spacing:-.01em;margin:16px 0 0;display:flex;align-items:center;gap:8px}
.a4 .desc{color:var(--ink2);margin-top:4px;font-size:12px}
.a4 .meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.a4 .meta span{font-size:10px;padding:1px 6px;border:1px solid var(--line);border-radius:4px;color:var(--ink2)}
.a4 .meta span.late{color:var(--orange);border-color:#f0cfb2}
.a4 h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--ink3);margin:20px 0 8px;display:flex;gap:8px;align-items:center}
.a4 h2::after{content:'';flex:1;height:1px;background:var(--line2)}
.a4-lead{font-size:14px;line-height:1.5;border-left:3px solid var(--ink);padding:2px 0 2px 12px}
.a4-lead small{display:block;font-size:10px;color:var(--ink3);margin-top:4px}
.nums{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line2);border-radius:6px}
.nums div{padding:8px 10px;border-left:1px solid var(--line2)}
.nums div:first-child{border-left:0}
.nums small{display:block;font-size:9.5px;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em}
.nums b{font:600 13px 'Geist Mono',ui-monospace,Consolas,monospace}
.nums em{display:block;font-style:normal;font-size:10px;color:var(--ink2)}
.agenda{display:grid}
.ag{display:grid;grid-template-columns:58px 72px minmax(0,1fr);gap:8px;padding:5px 0;border-bottom:1px dotted var(--line);align-items:baseline}
.ag .d{font:600 10.5px 'Geist Mono',ui-monospace,Consolas,monospace}
.ag .k{font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink3)}
.ag .k.aud{color:#6a4fd4}
.ag .k.prz{color:var(--red)}
.ag .k.tar{color:#2d62d3}
.ag .k.prc{color:#946b00}
.ag .t b{font-weight:600}
.ag .t .mono{font-size:10px;color:var(--ink3);font-family:'Geist Mono',ui-monospace,Consolas,monospace}
.ag.muted{color:var(--ink3)}
.alert-box{border:1px solid #f2c9cc;background:#fdf3f4;border-radius:6px;padding:8px 10px}
.alert-box .row{display:grid;grid-template-columns:110px 72px minmax(0,1fr) 70px;gap:8px;font-size:10.5px;padding:3px 0}
.srcs{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:10.5px}
.srcs a{color:var(--ink);text-decoration:none}
.srcs span{color:var(--ink3)}
.a4 table{width:100%;border-collapse:collapse;font-size:10.5px}
.a4 th{text-align:left;font-weight:500;color:var(--ink3);font-size:9.5px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line);padding:4px 6px 4px 0}
.a4 td{padding:4px 6px 4px 0;border-bottom:1px dotted var(--line2);vertical-align:top}
.mono{font-family:'Geist Mono',ui-monospace,Consolas,monospace}
.front{border:1px solid var(--line2);border-radius:6px;padding:10px 12px;margin-bottom:10px}
.front-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.front-h b{font:600 11.5px 'Geist Mono',ui-monospace,Consolas,monospace}
.front-h .kind{font:600 9.5px 'Geist Mono',ui-monospace,Consolas,monospace;padding:0 6px;border-radius:4px;background:var(--line2);color:var(--ink2)}
.front-h .sp{flex:1}
.fr-rule{display:flex;flex-wrap:wrap;gap:4px 0;margin:8px 0 6px;font-size:10.5px}
.fr-rule span{padding-right:16px;position:relative}
.fr-rule span::after{content:'→';position:absolute;right:4px;color:#b5bac3}
.fr-rule span:last-child::after{content:''}
.fr-rule .fav{color:#21845a;font-weight:600}
.fr-txt{font-size:10.5px;color:var(--ink2)}
.sig{color:var(--ink3);font-size:10px}
.foot{margin-top:18px;padding-top:8px;border-top:1px solid var(--line2);font:400 9.5px 'Geist Mono',ui-monospace,Consolas,monospace;color:#9aa0aa;display:flex;justify-content:space-between}
.tally{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid var(--line2);border-radius:6px;margin-top:8px}
.tally div{padding:7px 9px;border-left:1px solid var(--line2)}
.tally div:first-child{border-left:0}
.tally b{display:block;font:600 14px 'Geist Mono',ui-monospace,Consolas,monospace}
.tally small{font-size:9.5px;color:var(--ink3)}
.log-d{font:600 10px 'Geist Mono',ui-monospace,Consolas,monospace;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 4px}
.log-r{display:grid;grid-template-columns:72px 92px minmax(0,1fr);gap:8px;padding:4px 0;border-bottom:1px dotted var(--line2);font-size:10.5px;align-items:baseline}
.log-r .k{font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink3)}
.note{font-size:10.5px;color:var(--ink3);margin-top:12px}
.note b{color:var(--orange)}
@media print{
  body{background:#fff;padding:0}
  .a4{box-shadow:none;border-radius:0;min-height:0;padding:16px 4mm 10mm;page-break-after:always}
  .a4:last-child{page-break-after:auto}
}
`;

function htmlShell(title, bodyHtml) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${REPORT_CSS}</style></head><body><div class="doc">${bodyHtml}</div></body></html>`;
}

// ───────────────────── Blocos reutilizáveis ─────────────────────
function renderAgendaList(next15) {
  const items = (next15 && next15.items) || [];
  if (!items.length && !(next15 && next15.overflowCount)) return '<div class="fr-txt">Nada nos próximos dias.</div>';
  const kindCls = { aud: 'aud', prazo: 'prz', tarefa: 'tar', presc: 'prc' };
  const rows = items.map(it => `<div class="ag"><span class="d">${escHtml(it.dateLabel)}</span><span class="k ${kindCls[it.kind] || ''}">${escHtml(it.kindLabel)}</span><span class="t">${it.titleHtml || escHtml(it.title || '')}${it.mono ? ` <span class="mono">${escHtml(it.mono)}</span>` : ''}</span></div>`).join('');
  const overflow = (next15 && next15.overflowCount) ? `<div class="ag muted" style="border:0"><span class="d">depois</span><span class="k">+${next15.overflowCount}</span><span class="t">${next15.overflowFirst ? escHtml(next15.overflowFirst.title || '') + (next15.overflowFirst.dateLabel ? ', ' + escHtml(next15.overflowFirst.dateLabel) : '') : ''}</span></div>` : '';
  return `<div class="agenda">${rows}${overflow}</div>`;
}

function renderAlerts(alerts) {
  if (!alerts || !alerts.length) return '<div class="fr-txt">Sem CDAs no alarme (grupos 1 e 2).</div>';
  const head = `<div class="row" style="font-weight:600;color:#7c828e;font-size:9.5px;text-transform:uppercase"><span>CDA</span><span>Termo</span><span>Situação</span><span style="text-align:right">Valor</span></div>`;
  const rows = alerts.map(a => `<div class="row"><span class="mono">${escHtml(a.cda)}</span><span class="mono" style="color:${a.late ? 'var(--red)' : 'var(--orange)'};font-weight:600">${escHtml(a.termLabel)}</span><span>${escHtml(a.situacao)}</span><span class="mono" style="text-align:right">${escHtml(a.valorLabel)}</span></div>`).join('');
  return `<div class="alert-box">${head}${rows}</div>`;
}

function renderNumbers(numbers) {
  return `<div class="nums">${(numbers || []).map(n => `<div><small>${escHtml(n.label)}</small><b>${escHtml(n.value)}</b>${n.sub ? `<em>${escHtml(n.sub)}</em>` : ''}</div>`).join('')}</div>`;
}

function renderSources(sources) {
  if (!sources || !sources.length) return '<div class="fr-txt">Nenhuma fonte cadastrada.</div>';
  return `<div class="srcs">${sources.map(s => `<div>${s.url ? `<a href="${escHtml(s.url)}">${escHtml(s.label)}</a>` : escHtml(s.label)}${s.urlLabel ? ` <span>${escHtml(s.urlLabel)}</span>` : ''}</div>`).join('')}</div>`;
}

function renderFronts(fronts) {
  if (!fronts || !fronts.length) return '';
  return fronts.map(f => {
    const ruleParts = (f.steps || []).map(s => `<span class="${s.favoravel ? 'fav' : ''}">${escHtml(s.label)}${s.dateLabel ? ' ' + escHtml(s.dateLabel) : ''}</span>`).join('');
    const rule = ruleParts ? `<div class="fr-rule">${ruleParts}</div>` : '';
    const covered = (f.covered && f.covered.length)
      ? `<table style="margin-top:6px"><tr><th>${f.centralLabel || 'EF coberta'}</th><th>Situação</th><th>CDAs</th><th>Valor</th><th>Prescrição</th><th>Sinais</th></tr>${f.covered.map(c => `<tr><td class="mono">${escHtml(c.proc)}</td><td>${escHtml(c.situacao)}</td><td>${escHtml(c.cdas)}</td><td class="mono">${escHtml(c.valorLabel)}</td><td>${escHtml(c.prescricao)}</td><td class="sig">${escHtml(c.signals || '')}</td></tr>`).join('')}</table>`
      : '<div class="fr-txt" style="margin-top:4px">Nenhuma execução fiscal vinculada a este incidente.</div>';
    return `<div class="front"><div class="front-h"><span class="kind">${escHtml(f.kindLabel)}</span><b>${escHtml(f.title)}</b><span class="sp"></span>${f.valueLabel ? `<span class="mono">${escHtml(f.valueLabel)}</span>` : ''}</div>${f.statusLine ? `<div class="fr-txt">${escHtml(f.statusLine)}</div>` : ''}${rule}${f.currentPhaseText ? `<div class="fr-txt"><b>Fase atual:</b> ${escHtml(f.currentPhaseText)}</div>` : ''}${covered}</div>`;
  }).join('');
}

function renderTableBlock(kindLabel, title, valueLabel, rows, cols) {
  if (!rows || !rows.length) return '';
  const head = `<tr>${cols.map(c => `<th>${escHtml(c.label)}</th>`).join('')}</tr>`;
  const body = rows.map(r => `<tr>${cols.map(c => `<td${c.mono ? ' class="mono"' : ''}${c.right ? ' style="text-align:right"' : ''}>${escHtml(r[c.key] == null ? '' : r[c.key])}</td>`).join('')}</tr>`).join('');
  return `<div class="front"><div class="front-h"><span class="kind">${escHtml(kindLabel)}</span><b>${escHtml(title)}</b><span class="sp"></span>${valueLabel ? `<span class="mono">${escHtml(valueLabel)}</span>` : ''}</div><table style="margin-top:6px">${head}${body}</table></div>`;
}

function renderDiaryTable(entries) {
  if (!entries || !entries.length) return '<div class="fr-txt">Sem entradas no diário.</div>';
  return `<table><tr><th>Data</th><th>Tipo</th><th>Anotação</th></tr>${entries.map(e => `<tr><td class="mono" style="width:62px">${escHtml(e.dateLabel)}</td><td style="width:78px"><b>${escHtml(e.typeLabel)}</b></td><td>${e.html || ''}</td></tr>`).join('')}</table>`;
}

function renderRemindersTable(reminders) {
  if (!reminders || !reminders.length) return '<div class="fr-txt">Sem lembretes.</div>';
  return `<table><tr><th>Data</th><th>Lembrete</th></tr>${reminders.map(r => `<tr><td class="mono" style="width:62px">${escHtml(r.dateLabel)}</td><td>${escHtml(r.text)}</td></tr>`).join('')}</table>`;
}

function renderChecklists(checklists) {
  if (!checklists || !checklists.length) return '';
  return `<div class="fr-txt">${checklists.map(c => `${escHtml(c.label)}: ${c.done}/${c.total}`).join(' · ')}</div>`;
}

function renderAssetsTable(assets) {
  if (!assets || !assets.length) return '<div class="fr-txt">Sem bens cadastrados.</div>';
  return `<table><tr><th>Descrição</th><th>Titular</th><th>Situação</th><th>Origem</th><th>Valor</th></tr>${assets.map(a => `<tr><td>${escHtml(a.descricao)}</td><td>${escHtml(a.titular)}</td><td>${escHtml(a.situacao)}</td><td>${escHtml(a.origem)}</td><td class="mono">${escHtml(a.valorLabel)}</td></tr>`).join('')}</table>`;
}

function renderPeopleTable(title, people) {
  if (!people || !people.length) return '';
  return `<h3 style="font-size:11px;margin:10px 0 4px;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em">${escHtml(title)}</h3><table><tr><th>Nome</th><th>CPF/CNPJ</th><th>Papel</th></tr>${people.map(p => `<tr><td>${escHtml(p.nome)}</td><td class="mono">${escHtml(p.doc)}</td><td>${escHtml(p.tipo)}</td></tr>`).join('')}</table>`;
}

function renderOpenIntimationsTable(intims) {
  if (!intims || !intims.length) return '<div class="fr-txt">Nenhuma intimação aberta.</div>';
  return `<table><tr><th>Processo</th><th>Prazo final</th><th>Status</th><th>Evento</th></tr>${intims.map(x => `<tr><td class="mono">${escHtml(x.proc)}</td><td${x.late ? ' style="color:var(--red);font-weight:600"' : ''}>${escHtml(x.prazoLabel)}</td><td>${escHtml(x.status)}</td><td>${escHtml(x.evento)}</td></tr>`).join('')}</table>`;
}

function pageHeader(op, pageLabel) {
  const late = op.reviewLate ? ` <span class="late">${escHtml(op.reviewLabel)}</span>` : (op.reviewLabel ? `<span>${escHtml(op.reviewLabel)}</span>` : '');
  return `<div class="a4-top"><span>${escHtml(op.docTitle || 'Nexus')}</span><span>${escHtml(pageLabel)}</span></div>
<h1>${escHtml(op.name)}</h1>
<div class="desc">${escHtml(op.description || '')}</div>
<div class="meta"><span>${escHtml(op.priorityLabel || '')}</span><span>${escHtml(op.statusLabel || '')}</span>${(op.tagsExtra || []).map(t => `<span>${escHtml(t)}</span>`).join('')}${late}</div>`;
}

// ───────────────────── Página 1 (capa) ─────────────────────
function renderCapa(rd, pageLabel) {
  const s = rd.sections || {};
  let out = pageHeader(rd.op, pageLabel);
  if (s.leitura && rd.highlight) {
    out += `<h2>Leitura da operação</h2><div class="a4-lead">${rd.highlight.html || ''}<small>${escHtml(rd.highlight.typeLabel)}${rd.highlight.dateLabel ? ' · fixada em ' + escHtml(rd.highlight.dateLabel) : ''}</small></div>`;
  }
  if (s.proximos) {
    out += `<h2>Próximos 15 dias</h2>${renderAgendaList(rd.next15)}`;
  }
  if (s.alertas) {
    out += `<h2>Alertas</h2>${renderAlerts(rd.alerts)}`;
  }
  out += `<h2>Números</h2>${renderNumbers(rd.numbers)}`;
  if (s.fontes) {
    out += `<h2>Onde estão as coisas</h2>${renderSources(rd.sources)}`;
  }
  out += `<div class="foot"><span>Gerado pelo Nexus em ${escHtml(rd.generatedAtLabel)}</span><span>${escHtml(rd.pageFooter || '')}</span></div>`;
  return `<div class="a4">${out}</div>`;
}

// ───────────────────── Página 2 (frentes) ─────────────────────
function renderFrentes(rd, pageLabel) {
  const s = rd.sections || {};
  if (!s.frentes) return '';
  let out = `<div class="a4-top"><span>${escHtml(rd.op.name)} · frentes processuais</span><span>${escHtml(pageLabel)}</span></div>
<h2 style="margin-top:14px">Frentes processuais</h2>${renderFronts(rd.fronts)}`;
  out += renderTableBlock('EF', 'Sem incidente', rd.semIncidenteValueLabel, rd.semIncidente, [
    { key: 'proc', label: 'Processo', mono: true }, { key: 'situacao', label: 'Situação' },
    { key: 'cdas', label: 'CDAs' }, { key: 'valorLabel', label: 'Valor', mono: true }, { key: 'prescricao', label: 'Prescrição' },
  ]);
  out += renderTableBlock('CDA', 'Não ajuizadas', rd.naoAjuizadasValueLabel, rd.naoAjuizadas, [
    { key: 'cda', label: 'CDA', mono: true }, { key: 'tributo', label: 'Tributo' },
    { key: 'valorLabel', label: 'Valor', mono: true }, { key: 'prescricao', label: 'Prescrição' },
  ]);
  if ((s.diario && rd.diarioDestaque && rd.diarioDestaque.length) || (s.lembretes && rd.lembretesDestaque && rd.lembretesDestaque.length)) {
    const nDiario = (rd.diarioDestaque || []).length;
    const nLemb = (rd.lembretesDestaque || []).length;
    out += `<h2>Diário (${nDiario}) · lembretes (${nLemb})</h2><table>`;
    (rd.diarioDestaque || []).forEach(e => { out += `<tr><td class="mono" style="width:62px">${escHtml(e.dateLabel)}</td><td style="width:78px"><b>${escHtml(e.typeLabel)}</b></td><td>${e.html || ''}</td></tr>`; });
    (rd.lembretesDestaque || []).forEach(r => { out += `<tr><td class="mono" style="width:62px">${escHtml(r.dateLabel)}</td><td style="width:78px"><b>Lembrete</b></td><td>${escHtml(r.text)}</td></tr>`; });
    out += '</table>';
  }
  if (rd.anexosNote) out += `<h2>Anexos</h2><div class="fr-txt" style="line-height:1.7">${rd.anexosNote}</div>`;
  out += `<div class="foot"><span>${escHtml(rd.op.name)}</span><span>${escHtml(rd.pageFooter2 || '')}</span></div>`;
  return `<div class="a4">${out}</div>`;
}

// ───────────────────── Anexos (páginas 3+) ─────────────────────
function renderAnexos(rd, pageLabel) {
  const s = rd.sections || {};
  let out = `<div class="a4-top"><span>${escHtml(rd.op.name)} · anexos</span><span>${escHtml(pageLabel)}</span></div>`;
  if (s.diario) out += `<h2>Diário completo (${(rd.diary || []).length})</h2>${renderDiaryTable(rd.diary)}`;
  if (s.lembretes) out += `<h2>Lembretes (${(rd.reminders || []).length})</h2>${renderRemindersTable(rd.reminders)}${renderChecklists(rd.checklists)}`;
  if (s.bens) out += `<h2>Bens (${(rd.assets || []).length})</h2>${renderAssetsTable(rd.assets)}`;
  if (s.partes) out += `<h2>Partes</h2>${renderPeopleTable('Alvos', rd.people && rd.people.alvos)}${renderPeopleTable('Relacionadas', rd.people && rd.people.relacionadas)}`;
  out += `<h2>Intimações abertas (${(rd.openIntimations || []).length})</h2>${renderOpenIntimationsTable(rd.openIntimations)}`;
  out += `<div class="foot"><span>Gerado pelo Nexus em ${escHtml(rd.generatedAtLabel)}</span><span>${escHtml(pageLabel)}</span></div>`;
  return `<div class="a4">${out}</div>`;
}

function renderPassagemOuResumo(rd) {
  const resumo = rd.model === 'resumo';
  const total = resumo ? 1 : (2 + (rd.hasAnexos ? 1 : 0));
  const pages = [renderCapa(rd, `${escHtml(rd.generatedDateLabel)} · página 1 de ${total}`)];
  if (!resumo) {
    pages.push(renderFrentes(rd, `página 2 de ${total}`));
    if (rd.hasAnexos) pages.push(renderAnexos(rd, `página 3 de ${total}`));
  }
  return htmlShell(`Nexus · ${resumo ? 'Resumo' : 'Passagem de serviço'} — ${rd.op.name}`, pages.join(''));
}

// ───────────────────── Prestação de contas ─────────────────────
function renderPrestacaoContas(rd) {
  const groups = groupAccountingByMonth(rd.accountingEvents);
  const tally = tallyAccounting(rd.accountingEvents);
  const kindMap = { Intimação: 'k', Peça: 'k', Fase: 'k', Prescrição: 'k', Diário: 'k', Lembrete: 'k', Bem: 'k', Tarefa: 'k', Audiência: 'k' };
  let out = `<div class="a4-top"><span>Nexus · Prestação de contas</span><span>${escHtml(rd.periodLabel)} · página 1 de 1</span></div>
<h1>${escHtml(rd.op.name)}</h1>
<div class="desc">O que foi feito na operação no período, em ordem de data.</div>
<div class="tally">
  <div><b>${tally.intimacoes}</b><small>intimações tratadas</small></div>
  <div><b>${tally.pecas}</b><small>peças e documentos</small></div>
  <div><b>${tally.fases}</b><small>fases e eventos</small></div>
  <div><b>${tally.constricoes}</b><small>constrições obtidas</small></div>
  <div><b>${tally.tarefas}</b><small>tarefas concluídas</small></div>
</div>
<div class="log">`;
  if (!groups.length) out += '<div class="fr-txt" style="margin-top:10px">Nenhum evento registrado no período.</div>';
  groups.forEach(g => {
    out += `<div class="log-d">${escHtml(g.label)}</div>`;
    g.events.forEach(ev => {
      out += `<div class="log-r"><span class="mono">${escHtml(ev.dateLabel || ev.date)}</span><span class="k">${escHtml(ev.kind)}</span><span>${escHtml(ev.text)}${ev.mono ? ` <span class="mono">${escHtml(ev.mono)}</span>` : ''}</span></div>`;
    });
  });
  out += '</div>';
  out += `<p class="note"><b>Limite de hoje:</b> ${escHtml(rd.accountingNote || 'o histórico de alterações guarda só os últimos 500 registros do app.')}</p>`;
  out += `<div class="foot"><span>Gerado pelo Nexus em ${escHtml(rd.generatedAtLabel)}</span><span>1/1</span></div>`;
  return htmlShell(`Nexus · Prestação de contas — ${rd.op.name}`, `<div class="a4">${out}</div>`);
}

/**
 * Monta o documento HTML completo do relatório.
 * @param {object} rd - dados já filtrados/calculados (ver README/uso no app)
 * @returns {string} HTML pronto para baixar ou abrir numa aba nova
 */
export function renderReportDocument(rd) {
  if (!rd) return htmlShell('Nexus · Relatório', '<div class="a4">Sem dados.</div>');
  if (rd.model === 'prestacao') return renderPrestacaoContas(rd);
  return renderPassagemOuResumo(rd);
}

/** Nome do arquivo baixado, no padrão pedido: passagem_servico_<op>_<data>.html etc. */
export function reportFileName(model, opName, dateIso) {
  const prefix = model === 'prestacao' ? 'prestacao_contas' : model === 'resumo' ? 'resumo' : 'passagem_servico';
  const safeName = String(opName || 'operacao').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 40);
  return `${prefix}_${safeName}_${dateIso}.html`;
}
