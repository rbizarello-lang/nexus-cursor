/**
 * Restaura APENAS:
 * 1) Layout da operação: stats-bar com stat-cards (formato aprovado)
 * 2) Card processo central: régua vertical com desfecho (proc-stage-vertical)
 * Sem tocar no restante (Briefing, +Processo, temas, agenda, etc.).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appPath = path.join(root, 'src', 'app.jsx');
let app = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');

const fail = (m) => { throw new Error(m); };

// ─── 1) Operation metrics: op-summary → stats-bar (aprovado) ───
const opSummaryRe = /\{opStats && <div className="op-summary">[\s\S]*?<\/div>\s*<\/div>\}/;
if (!opSummaryRe.test(app)) fail('bloco op-summary não encontrado');

const statsBar = `{opStats && <div style={{display:'flex',background:'var(--bg-main)',borderBottom:'1px solid var(--border)',alignItems:'stretch',flexShrink:0}}>
          <div className="stats-bar" style={{flex:1,minWidth:0,borderBottom:'none'}}>
            <div className="stat-card"><div className="stat-label">Dívida Total</div><div className="stat-value" style={{color:'var(--text-primary)',fontSize:15}}>{fmtCur(opStats.total)}</div><div className="stat-sub">{opStats.debts} CDAs</div></div>
            <div className="stat-card"><div className="stat-label has-tip">Garantido (CDA)<span className="tip-content">Soma dos valores das CDAs com status "Garantida". Reflete a garantia formal reconhecida por CDA, não o valor de mercado dos bens constritados.</span></div><div className="stat-value" style={{color:'var(--text-secondary)',fontSize:15}}>{fmtCur(opStats.guar)}</div><div className="stat-sub">{opStats.total>0?((opStats.guar/opStats.total)*100).toFixed(0):0}%</div></div>
            <div className="stat-card has-tip" onClick={() => { if (opStats.indispCount>0) setActiveTab('bens'); }} style={{cursor:opStats.indispCount>0?'pointer':'default'}}>
              <div className="stat-label">Indisponibilidades</div>
              <div className="stat-value" style={{color:opStats.indispHasValue?'var(--text-primary)':'var(--text-muted)',fontSize:opStats.indispHasValue?15:12}}>{opStats.indispLabel}</div>
              <div className="stat-sub">{opStats.indispCount > 0 ? \`\${opStats.indispCount} bem(ns)\` : ''}</div>
              <span className="tip-content">{opStats.indispCount === 0 ? 'Nenhum bem com status de indisponibilidade cadastrado nesta operação.' : opStats.indispHasValue ? \`Soma dos valores dos \${opStats.indispCount} bem(ns) com indisponibilidade ativa/requerida que possuem valor informado. Clique para ver a aba Bens.\` : \`\${opStats.indispCount} bem(ns) constritado(s), mas nenhum com valor de avaliação preenchido. Informe os valores na aba Bens para ver o total aqui.\`}</span>
            </div>
            <div className="stat-card"><div className="stat-label">Presc. CDA</div><div className="stat-value" style={{color:opStats.prescA>0?'var(--red)':'var(--text-muted)',fontSize:15}}>{opStats.prescA}</div><div className="stat-sub">≤180 dias</div></div>
            <div className="stat-card"><div className="stat-label">Presc. Interc.</div><div className="stat-value" style={{color:opStats.prescExec>0?'var(--red)':'var(--text-muted)',fontSize:15}}>{opStats.prescExec}</div><div className="stat-sub">≤365 dias</div></div>
            <div className={\`stat-card \${opStats.openIntims>0?'alert-pulse-blue':''}\`} onClick={() => { if (opStats.openIntims>0) setIntimWork(true); }} style={{cursor:opStats.openIntims>0?'pointer':'default'}}>
              <div className="stat-label">Intimações</div>
              <div className="stat-value" style={{color: opStats.overdueIntims > 0 ? 'var(--red)' : opStats.openIntims > 0 ? 'var(--blue)' : 'var(--text-muted)',fontSize:15}}>{opStats.openIntims}</div>
              <div className="stat-sub">{opStats.overdueIntims > 0 ? \`\${opStats.overdueIntims} vencida(s)\` : opStats.openIntims > 0 ? 'em aberto' : 'nenhuma'}</div>
            </div>
            <div className={\`stat-card \${opStats.openTasks>0?'alert-pulse-yellow':''}\`} onClick={() => { if (opStats.openTasks>0) setActiveTab('tarefas'); }} style={{cursor:opStats.openTasks>0?'pointer':'default'}}>
              <div className="stat-label">Tarefas</div>
              <div className="stat-value" style={{color: opStats.overdueTasks > 0 ? 'var(--red)' : opStats.openTasks > 0 ? 'var(--yellow)' : 'var(--text-muted)',fontSize:15}}>{opStats.openTasks}</div>
              <div className="stat-sub">{opStats.overdueTasks > 0 ? \`\${opStats.overdueTasks} vencida(s)\` : opStats.openTasks > 0 ? 'em aberto' : 'nenhuma'}</div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:6,padding:'8px 18px',flexShrink:0,borderLeft:'1px solid var(--border)',background:'var(--bg-main)'}}>
            <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
              <button className="btn-secondary btn-sm has-tip" onClick={() => generateHandoverReport(activeOp)}>📄 Relatório<span className="tip-content">Gerar relatório de passagem de serviço (HTML imprimível): briefing, processos ativos, prazos abertos, bens constritos e alvos. Útil para férias, substituição ou prestação de contas.</span></button>
              <button className="btn-secondary btn-sm" onClick={() => upsert('operations', { ...activeOp, lastReviewedAt: new Date().toISOString() })}>✓ Revisada</button>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}}>
              {(() => { const rs = reviewStatus(activeOp); return (<span style={{fontSize:9,color:rs.color,fontWeight:600,padding:'2px 8px',borderRadius:3,background:\`\${rs.color.replace('var(--','rgba(').replace(')',', 0.1)')}\`,border:\`1px solid \${rs.color.replace('var(--','rgba(').replace(')',', 0.25)')}\`}}>{rs.label}</span>); })()}
              <span style={{fontSize:9,color:'var(--text-muted)'}}>Atualizada {activeOp.updatedAt ? new Date(activeOp.updatedAt).toLocaleDateString('pt-BR') : '—'}</span>
            </div>
          </div>
        </div>}`;

app = app.replace(opSummaryRe, statsBar);
console.log('OK stats-bar (layout operação)');

// ─── 2) Process card: horizontal ruler → vertical approved ───
if (app.includes('proc-stage-vertical')) fail('proc-stage-vertical já presente — abortar para não duplicar');
if (!app.includes('proc-stage-ruler')) fail('proc-stage-ruler não encontrado');

const helpers = `              const stageMeta = (STAGES, STAGE_KEYS, recs) => STAGE_KEYS.map((k, i) => {
                const sd = STAGES[k];
                const rec = recs[k];
                const recursos = sd.multiRecurso ? getRecursos(rec) : null;
                const has = sd.multiRecurso
                  ? recursos.length > 0
                  : !!(rec && (rec.date || rec.evento || rec.outcome || (rec.texto && String(rec.texto).trim())));
                const c = sd.multiRecurso ? recursoColor(recursos) : stageRecColor(rec);
                let info = '';
                if (sd.multiRecurso) {
                  info = recursos.length ? recursos.length + (recursos.length === 1 ? ' recurso' : ' recursos') : '';
                } else if (sd.textOnly) {
                  info = (rec?.texto && String(rec.texto).trim()) || '';
                } else if (has) {
                  const parts = [];
                  if (rec.date) parts.push(fmtDate(rec.date));
                  if (rec.evento) parts.push('Ev. ' + rec.evento);
                  if (rec.texto && String(rec.texto).trim()) parts.push(String(rec.texto).trim());
                  info = parts.join(' · ');
                }
                const outcomeLabel = (!sd.multiRecurso && rec?.outcome && sd.outcomes[rec.outcome]) ? sd.outcomes[rec.outcome] : '';
                return { k, i, sd, rec, recursos, has, c, info, outcomeLabel };
              });
              const renderStageRuler = (ip, STAGES, STAGE_KEYS, recs) => {
                const metas = stageMeta(STAGES, STAGE_KEYS, recs);
                const openPop = (k) => toggleGroup('stagepop-' + ip.id + '-' + k);
                const popupFor = (m) => collapsedGroups.has('stagepop-' + ip.id + '-' + m.k) && (
                  <StagePopup key={'stagepop-' + ip.id + '-' + m.k} sd={m.sd} rec={m.rec}
                    onCommit={(patch) => setRec(ip.id, m.k, patch)}
                    onDelete={() => { delRec(ip.id, m.k); openPop(m.k); }}
                    onAddNote={(text) => { upsert('executions', { ...ip, notesList: [...(ip.notesList || []), text] }); alert('Registrado como nota no card.'); }}
                    onClose={() => openPop(m.k)} />
                );
                return (<div className="proc-stage-vertical" style={{margin:'10px 0 4px',display:'flex',flexDirection:'column',gap:0}}>
                  {metas.map((m) => (
                    <div key={m.k} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'}} onClick={() => openPop(m.k)} title={m.has ? m.sd.label + ' — editar' : 'Registrar ' + m.sd.label}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:16,flexShrink:0,paddingTop:2}}>
                        <div style={{width:12,height:12,borderRadius:'50%',background:m.has?m.c:'transparent',border:\`2px solid \${m.has?m.c:'var(--border-light)'}\`}} />
                        {m.i < metas.length - 1 && <div style={{width:2,flex:1,minHeight:10,marginTop:3,background:m.has?'var(--text-muted)':'var(--border)'}} />}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                          <span style={{fontSize:12,fontWeight:m.has?700:500,color:m.has?m.c:'var(--text-muted)',fontFamily:'var(--font-display)'}}>{m.sd.label}</span>
                          {m.outcomeLabel && <span style={{fontSize:11,color:m.c}}>{m.outcomeLabel}</span>}
                          {m.info && <span style={{fontSize:11,color:'var(--text-secondary)',fontFamily:m.sd.textOnly?'var(--font-display)':'var(--font-mono)'}}>{m.info}</span>}
                          {!m.has && <span style={{fontSize:11,color:'var(--text-muted)'}}>—</span>}
                        </div>
                      </div>
                      {popupFor(m)}
                    </div>
                  ))}
                </div>);
              };
`;

const badgeMarker = '              // Badge por tipo de processo-mãe (IDPJ/MCF/Central)';
if (!app.includes(badgeMarker)) fail('marker badgeFor não encontrado no panorama');
if (app.includes('const stageMeta = ')) fail('stageMeta já existe');
app = app.replace(badgeMarker, helpers + badgeMarker);
console.log('OK helpers stageMeta/renderStageRuler');

// Replace horizontal ruler + StagePopup maps with single renderStageRuler call
const rulerBlockRe = /\{\/\* Régua de fases[\s\S]*?\{STAGE_KEYS\.map\(\(k\) => \{[\s\S]*?<\/StagePopup>;\s*\}\)\}\s*\}/;
if (!rulerBlockRe.test(app)) {
  // try without comment
  const alt = /<div className="proc-stage-ruler">[\s\S]*?\{STAGE_KEYS\.map\(\(k\) => \{[\s\S]*?<\/StagePopup>;\s*\}\)\}\s*\}/;
  if (!alt.test(app)) fail('bloco régua horizontal não encontrado');
  app = app.replace(alt, '{renderStageRuler(ip, STAGES, STAGE_KEYS, recs)}');
} else {
  app = app.replace(rulerBlockRe, '{renderStageRuler(ip, STAGES, STAGE_KEYS, recs)}');
}
console.log('OK régua vertical no card');

if (app.includes('proc-stage-ruler')) console.warn('AVISO: ainda há proc-stage-ruler no arquivo');
if (!app.includes('proc-stage-vertical')) fail('proc-stage-vertical não foi inserido');
if (!app.includes('stats-bar')) fail('stats-bar não foi inserido');
if (!app.includes("notas:'Briefing'") && !app.includes('Briefing')) console.warn('AVISO: checar Briefing');

fs.writeFileSync(appPath, app.replace(/\n/g, '\r\n'));
console.log('OK gravado src/app.jsx');
