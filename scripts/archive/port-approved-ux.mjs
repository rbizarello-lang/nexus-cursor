/**
 * Aplica no src/app.jsx o UX aprovado da demo, com ajustes finais:
 * - sem aba "Mais"
 * - Bens e Importar expl├¡citos
 * - sem Linha do tempo / Grafo / Insights / CDAs / Processos (abas antigas)
 * - Processos e Prescri├º├úo unificados, colapsados
 *
 * Uso: node scripts/archive/port-approved-ux.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appPath = path.join(root, 'src', 'app.jsx');

const fail = (m) => { throw new Error(`port-approved-ux: ${m}`); };
const replaceOnce = (source, search, replacement, label) => {
  const at = source.indexOf(search);
  if (at === -1) fail(`n├úo encontrado: ${label}`);
  return source.slice(0, at) + replacement + source.slice(at + search.length);
};
const replaceRange = (source, startMarker, endMarker, replacement, label) => {
  const start = source.indexOf(startMarker);
  if (start === -1) fail(`in├¡cio n├úo encontrado: ${label}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end === -1) fail(`fim n├úo encontrado: ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
};

let app = fs.readFileSync(appPath, 'utf8');

if (app.includes("prescricao_v2:'Processos e Prescri├º├úo'") && app.includes('className="op-summary"')) {
  console.log('J├í portado ÔÇö nada a fazer.');
  process.exit(0);
}

for (const oldTab of ['execucoes', 'dividas', 'prescricao']) {
  app = app.split(`setActiveTab('${oldTab}')`).join("setActiveTab('prescricao_v2')");
}

app = replaceOnce(
  app,
  "  const tabList = ['notas','grafo','tarefas','importar','pessoas','dividas','execucoes','prescricao_v2','bens','timeline','docs','insights'];",
  "  const tabList = ['notas','pessoas','prescricao_v2','bens','tarefas','importar','docs'];",
  'tabList',
);
app = replaceOnce(
  app,
  "  const tabLabels = { notas:'Anota├º├Áes', grafo:'Grafo', tarefas:'Tarefas', importar:'Importar', pessoas:'Pessoas', dividas:'CDAs', execucoes:'Processos', prescricao_v2:'Controle da Prescri├º├úo', bens:'Bens', timeline:'Linha do Tempo', docs:'Docs', insights:'Insights' };",
  "  const tabLabels = { notas:'Anota├º├Áes', pessoas:'Pessoas', prescricao_v2:'Processos e Prescri├º├úo', bens:'Bens', tarefas:'Tarefas', importar:'Importar', docs:'Arquivos' };",
  'tabLabels',
);

app = replaceOnce(
  app,
  "            <div className=\"op-meta\">{pCount}P ┬À {dCount}CDAs {openTasks.length > 0 ? `┬À ${openTasks.length}Ô£ô` : ''}</div>",
  "            <div className=\"op-meta\">{pCount} pessoas ┬À {dCount} CDAs{openIntims.length > 0 ? ` ┬À ${openIntims.length} int.` : ''}{openTasks.length > 0 ? ` ┬À ${openTasks.length} tarefas` : ''}{alerts > 0 ? ` ┬À ${alerts} presc.` : ''}</div>",
  'sidebar meta',
);

const opAlertPills = `                          <div className="opc-alerts">
                            {opIntims.length > 0 && <span className="badge badge-yellow has-tip">­ƒô¼ {opIntims.length}<span className="tip-content">Intima├º├Áes abertas (Prazo Fechado, Pendente de An├ílise ou Pe├ºa em Edi├º├úo). Clique na opera├º├úo para tratar.</span></span>}
                            {opTasks.length > 0 && <span className="badge badge-blue has-tip">Ô£ô {opTasks.length}<span className="tip-content">Tarefas pendentes ou em andamento vinculadas a esta opera├º├úo.</span></span>}
                            {prescAlerts > 0 && <span className="badge badge-red has-tip">ÔÅ▒ {prescAlerts}<span className="tip-content">CDAs com risco de prescri├º├úo em at├® 6 meses, ainda sem tratamento. Acesse a aba Prescri├º├úo para analisar.</span></span>}
                          </div>`;
const opAlertText = `                          <div className="opc-alerts op-alerts-text">
                            {[opIntims.length > 0 ? \`\${opIntims.length} int.\` : '', opTasks.length > 0 ? \`\${opTasks.length} tarefas\` : '', prescAlerts > 0 ? \`\${prescAlerts} presc.\` : ''].filter(Boolean).join(' ┬À ') || 'Sem alertas abertos'}
                          </div>`;
if (app.includes(opAlertPills)) app = replaceOnce(app, opAlertPills, opAlertText, 'opc-alerts');

const statsStart = "        {opStats && <div style={{display:'flex',background:'var(--bg-main)',borderBottom:'1px solid var(--border)',alignItems:'stretch'}}><div className=\"stats-bar\" style={{flex:1,minWidth:0,borderBottom:'none'}}>";
const statsEnd = '        <div className="tabs">{tabList.map(t => {';
const statsReplacement = `        {opStats && <div className="op-summary">
          <div className="op-summary-item"><small>D├¡vida</small><strong>{fmtCur(opStats.total)}</strong></div>
          <div className="op-summary-item"><small>Garantido</small><strong>{fmtCur(opStats.guar)} ┬À {opStats.total>0?((opStats.guar/opStats.total)*100).toFixed(0):0}%</strong></div>
          <button type="button" className="op-summary-item" onClick={() => { if (opStats.indispCount>0) setActiveTab('bens'); }}><small>Bens indispon├¡veis</small><strong>{opStats.indispLabel}</strong></button>
          <div className="op-summary-item"><small>Prescri├º├úo</small><strong>{opStats.prescA} CDA ┬À {opStats.prescExec} interc.</strong></div>
          <button type="button" className="op-summary-item" onClick={() => { if (opStats.openIntims>0) setIntimWork(true); }}><small>Intima├º├Áes</small><strong>{opStats.openIntims}{opStats.overdueIntims>0?\` ┬À \${opStats.overdueIntims} venc.\`:''}</strong></button>
          <button type="button" className="op-summary-item" onClick={() => { if (opStats.openTasks>0) setActiveTab('tarefas'); }}><small>Tarefas</small><strong>{opStats.openTasks}{opStats.overdueTasks>0?\` ┬À \${opStats.overdueTasks} venc.\`:''}</strong></button>
          <div className="op-summary-actions">
            <button type="button" onClick={() => generateHandoverReport(activeOp)}>Relat├│rio</button>
            <button type="button" onClick={() => upsert('operations', { ...activeOp, lastReviewedAt: new Date().toISOString() })}>Marcar revisada</button>
            {(() => { const rs = reviewStatus(activeOp); return <span style={{color:rs.color}}>{rs.label}</span>; })()}
          </div>
        </div>}
`;
app = replaceRange(app, statsStart, statsEnd, statsReplacement, 'resumo da opera├º├úo');

const tabsStart = '        <div className="tabs">{tabList.map(t => {';
const tabsEnd = '        {(() => {\n          try { return renderTab(); }';
const tabsReplacement = `        <div className="tabs">
          {tabList.map(t => <button key={t} className={\`tab \${activeTab===t?'active':''}\`} onClick={() => startTabSwitch(() => { setActiveTab(t); setSelectedNode(null); })} style={isTabSwitching?{opacity:0.6}:undefined}>{tabLabels[t]}</button>)}
        </div>
`;
app = replaceRange(app, tabsStart, tabsEnd, tabsReplacement, 'abas da opera├º├úo');

// ÔöÇÔöÇÔöÇ Processos e Prescri├º├úo: vis├úo integrada aprovada ÔöÇÔöÇÔöÇ
const prescStart = app.indexOf("    if (activeTab === 'prescricao_v2') {");
if (prescStart === -1) fail('aba prescricao_v2 n├úo encontrada');
const prescEnd = app.indexOf("    if (activeTab === 'medidas') {", prescStart);
if (prescEnd === -1) fail('fim da aba prescricao_v2 n├úo encontrado');
let presc = app.slice(prescStart, prescEnd);

presc = replaceOnce(
  presc,
  '        return isExecucaoFiscalRegular(g.exec);',
  '        return true; // vis├úo integrada: todos os processos top-level',
  'incluir todos os processos',
);

const processPillsStart = "                <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:2,alignItems:'center'}}>";
const processPillsEnd = "                <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700}}>";
const processMetaLine = `                <div className="process-meta">
                  {isExec && <button type="button" className={isRelevant?'active':''} onClick={toggleRelevant}>{isRelevant?'Relevante':'Marcar relevante'}</button>}
                  {isApenso && <span>Apenso</span>}
                  {myApensosGroups.length > 0 && <span>{myApensosGroups.length} apenso(s)</span>}
                  {isTagged && <strong>{tagLabels[e.processTag]||e.processTag}</strong>}
                  {isLinkedToIDPJ2 && !isTagged && <span>Vinculada a IDPJ</span>}
                  <span>{st.label||e.status}</span>
                  {e.hasGuarantee && <span>Garantia</span>}
                  {e.prescriptionInterrupted && <span>PI</span>}
                  {procAlerts.intims.length > 0 && <span className={procAlerts.overdueIntim?'overdue':''}>{procAlerts.intims.length} intima├º├úo(├Áes)</span>}
                  {procAlerts.tasks.length > 0 && <span className={procAlerts.overdueTask?'overdue':''}>{procAlerts.tasks.length} tarefa(s)</span>}
                </div>
`;
presc = replaceRange(presc, processPillsStart, processPillsEnd, processMetaLine, 'metadados do processo');

const cardOpen = `        return (<div className="entity-card" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 0.9fr 0.7fr',gap:12,alignItems:'start',marginBottom:8,background:isRelevant?'rgba(200,160,74,0.04)':bgColor,borderLeft:\`\${borderLeftWidth}px solid \${isRelevant?'var(--gold)':borderLeftColor}\`,width:'100%',opacity:statusOpacity,transition:'opacity 0.2s'}}>`;
const cardOpenReplacement = `        const processKey = 'process-row-' + (isExec ? e.id : 'unlinked');
        const processExpanded = collapsedGroups.has(processKey);
        const riskDays = group.cdas
          .filter(d => !d.prescriptionHandled)
          .map(d => daysUntil(d.prescriptionDate || calcAutoPresc(d, execs, data.prescriptionEvents || [])))
          .filter(v => v !== null);
        const minRiskDays = riskDays.length ? Math.min(...riskDays) : null;
        const allHandled = group.cdas.length > 0 && group.cdas.every(d => d.prescriptionHandled);
        const riskLabel = allHandled ? 'Tratadas'
          : minRiskDays === null ? 'Sem dados'
          : minRiskDays <= 0 ? 'Prescrita'
          : minRiskDays <= 180 ? minRiskDays + 'd ┬À cr├¡tico'
          : minRiskDays <= 365 ? minRiskDays + 'd ┬À aten├º├úo'
          : minRiskDays + 'd';
        const riskClass = allHandled ? 'risk-ok'
          : minRiskDays !== null && minRiskDays <= 180 ? 'risk-critical'
          : minRiskDays !== null && minRiskDays <= 365 ? 'risk-warning'
          : '';

        return (<div className={\`process-group \${processExpanded ? 'open' : ''}\`}>
          <button type="button" className="process-summary" onClick={() => toggleGroup(processKey)} aria-expanded={processExpanded}>
            <span className="process-toggle">{processExpanded ? 'ÔêÆ' : '+'}</span>
            <span className="process-id">
              <strong>{isExec ? (e.processNumber || 'Processo sem n├║mero') : 'CDAs sem processo'}</strong>
              <small>{isExec ? [e.className, e.court].filter(Boolean).join(' ┬À ') : 'Cr├®ditos n├úo vinculados a uma execu├º├úo'}</small>
            </span>
            <span className="process-stat"><small>Status</small><strong>{isExec ? (st.label || e.status) : 'N├úo ajuizadas'}</strong></span>
            <span className="process-stat"><small>CDAs</small><strong>{group.cdas.length} ┬À {fmtCur(totalCDAValue)}</strong></span>
            <span className={\`process-risk \${riskClass}\`}><small>Prescri├º├úo</small><strong>{riskLabel}</strong></span>
          </button>
          {processExpanded && <div className="process-detail">
            <div className="entity-card" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 0.9fr 0.7fr',gap:12,alignItems:'start',marginBottom:8,background:isRelevant?'rgba(200,160,74,0.04)':bgColor,borderLeft:\`\${borderLeftWidth}px solid \${isRelevant?'var(--gold)':borderLeftColor}\`,width:'100%',opacity:statusOpacity,transition:'opacity 0.2s'}}>`;
presc = replaceOnce(presc, cardOpen, cardOpenReplacement, 'card colaps├ível');

const cdaRow = `                return (<div key={d.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderBottom:'1px dotted var(--border)',background:isAguardando?'rgba(245,158,11,0.08)':isHandled?'rgba(64,168,112,0.06)':isSelected?'var(--accent-dim)':'transparent',borderRadius:3,opacity:isHandled&&!isAguardando?0.85:1}}>`;
const cdaRowReplacement = `                return (<div key={d.id} className="cda-row" title="Abrir detalhes da CDA" onClick={(ev) => {
                  if (ev.target.closest && ev.target.closest('input,button')) return;
                  ev.stopPropagation();
                  setModal({type:'cdaDetail',entityType:'debt',initial:d});
                }} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderBottom:'1px dotted var(--border)',background:isAguardando?'rgba(245,158,11,0.08)':isHandled?'rgba(64,168,112,0.06)':isSelected?'var(--accent-dim)':'transparent',borderRadius:3,opacity:isHandled&&!isAguardando?0.85:1}}>`;
presc = replaceOnce(presc, cdaRow, cdaRowReplacement, 'CDA clic├ível');
presc = replaceOnce(
  presc,
  "<Copyable value={d.cdaNumber}>{d.cdaNumber || 'CDA'}</Copyable>",
  "<span className=\"cda-link\">{d.cdaNumber || 'CDA'}</span>",
  'link CDA',
);
presc = replaceOnce(
  presc,
  "<span className={`badge ${cdaSt.badge||''}`} style={{fontSize:8,padding:'1px 5px'}}>{cdaSt.label||d.status}</span>",
  "<span className=\"cda-status\">{cdaSt.label||d.status}</span>",
  'status CDA',
);

const cardClose = `        </div>);
      };

      // Recursive renderer`;
const cardCloseReplacement = `            </div>
          </div>}
        </div>);
      };

      // Recursive renderer`;
presc = replaceOnce(presc, cardClose, cardCloseReplacement, 'fechamento card');

const legalStart = '        {/* Legal reference */}';
const legalEnd = '        {/* Bulk selection bar */}';
const legalReplacement = `        {/* Orienta├º├úo da vis├úo integrada */}
        <div className="presc-legal-ref">
          <strong>Processos, CDAs e prescri├º├úo em uma ├║nica vis├úo.</strong>
          {' '}Os processos come├ºam recolhidos. Abra uma linha para acessar o detalhamento, as notas, os eventos e as a├º├Áes. Clique numa CDA para ver o popup completo.
        </div>

`;
presc = replaceRange(presc, legalStart, legalEnd, legalReplacement, 'orienta├º├úo');

presc = presc
  .split('­ƒøí´©Å Incidentes de Desconsidera├º├úo / Cautelares Fiscais')
  .join('Incidentes de Desconsidera├º├úo / Cautelares Fiscais')
  .split('ÔÜû´©Å­ƒöù Execu├º├Áes Fiscais vinculadas ao Incidente/Cautelar')
  .join('Execu├º├Áes Fiscais vinculadas ao Incidente/Cautelar')
  .split('ÔÜû´©Å Demais Processos')
  .join('Demais Processos')
  .split('>Ôèò Selecionar CDAs das EFs cobertas')
  .join('>Selecionar CDAs das EFs cobertas')
  .split('>ÔÅ▒ + Evento</button>')
  .join('>+ Evento</button>')
  .split('>Ô£Ä Dados do Processo</button>')
  .join('>Dados do Processo</button>')
  .split('>­ƒôï Gerar Tarefa</button>')
  .join('>Gerar Tarefa</button>');

app = app.slice(0, prescStart) + presc + app.slice(prescEnd);

// Timeline: stub unreachable branch (tab removida)
const tlStart = app.indexOf("    if (activeTab === 'timeline') {");
const tlEnd = app.indexOf("    if (activeTab === 'docs') {", tlStart);
if (tlStart !== -1 && tlEnd !== -1) {
  app = app.slice(0, tlStart) +
    "    if (activeTab === 'timeline') {\n      // Removida da navega├º├úo ÔÇö mantido s├│ como fallback in├│cuo.\n      return null;\n    }\n\n" +
    app.slice(tlEnd);
}

if (!app.includes('className="op-summary"')) fail('resumo n├úo aplicado');
if (!app.includes('process-summary')) fail('processos colapsados n├úo aplicados');
if (!app.includes("prescricao_v2:'Processos e Prescri├º├úo'")) fail('r├│tulos n├úo aplicados');
if (app.includes("'timeline'") && app.includes("tabList = [") && /tabList = \[[^\]]*timeline/.test(app)) fail('timeline ainda na tabList');

fs.writeFileSync(appPath, app);
console.log('OK  UX aprovado aplicado em src/app.jsx');
console.log('    Abas: Anota├º├Áes ┬À Pessoas ┬À Processos e Prescri├º├úo ┬À Bens ┬À Tarefas ┬À Importar ┬À Arquivos');
console.log('    Removidos da navega├º├úo: Mais, Linha do tempo, Grafo, Insights, CDAs, Processos');
