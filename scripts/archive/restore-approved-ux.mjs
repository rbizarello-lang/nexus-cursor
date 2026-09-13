/**
 * Restaura o UX aprovado (31/07) a partir do git stash@{0},
 * preservando Demo Experimental / Mar / Intimações-Tarefas / agenda semanal.
 *
 * Uso: node scripts/archive/restore-approved-ux.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appPath = path.join(root, 'src', 'app.jsx');
const shellPath = path.join(root, 'src', 'Nexus.shell.html');

const fail = (m) => { throw new Error(`restore-approved-ux: ${m}`); };
const gitShow = (spec) => execFileSync('git', ['show', spec], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

const replaceOnce = (source, search, replacement, label) => {
  const at = source.indexOf(search);
  if (at === -1) fail(`não encontrado: ${label}`);
  return source.slice(0, at) + replacement + source.slice(at + search.length);
};

const readText = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
let app = readText(appPath);
let shell = readText(shellPath);
const stashApp = gitShow('stash@{0}:src/app.jsx').replace(/\r\n/g, '\n');
const stashShell = gitShow('stash@{0}:src/Nexus.shell.html').replace(/\r\n/g, '\n');
// Windows: gravar com CRLF para manter checkout local estável
const writeText = (p, text) => fs.writeFileSync(p, text.replace(/\n/g, '\r\n'));

if (app.includes("prescricao_v2:'Processos e Prescrição'") && app.includes('process-summary') && shell.includes('.process-group')) {
  console.log('Já restaurado — nada a fazer.');
  process.exit(0);
}

// ─── 1) CSS do stash ───
const cssStart = stashShell.indexOf('.op-summary {');
const cssEndMarker = '  .op-summary-item { flex: 1 1 140px; }';
const cssEndAt = stashShell.indexOf(cssEndMarker, cssStart);
if (cssStart === -1 || cssEndAt === -1) fail('bloco CSS process/op-summary não encontrado no stash');
const cssEnd = stashShell.indexOf('\n', cssEndAt + cssEndMarker.length);
const cssBlock = '\n/* ─── UX aprovado 31/07: resumo da operação + processos colapsáveis ─── */\n'
  + stashShell.slice(cssStart, cssEnd + 1);

if (!shell.includes('.process-group')) {
  const insertAt = shell.indexOf('/* Demo Experimental');
  const altAt = shell.indexOf('.app-layout.edition-demo');
  const at = insertAt !== -1 ? insertAt : altAt;
  if (at === -1) fail('ponto de inserção CSS não encontrado');
  shell = shell.slice(0, at) + cssBlock + '\n' + shell.slice(at);
  writeText(shellPath, shell);
  console.log('OK  CSS process-group / op-summary inserido em Nexus.shell.html');
} else {
  console.log('OK  CSS já presente');
}

// ─── 2) Remap deep-links antigos → aba fundida ───
for (const oldTab of ['execucoes', 'dividas', 'prescricao']) {
  app = app.split(`setActiveTab('${oldTab}')`).join("setActiveTab('prescricao_v2')");
}

// ─── 3) tabList / tabLabels ───
app = replaceOnce(
  app,
  "  const tabList = ['notas','grafo','tarefas','importar','pessoas','dividas','execucoes','prescricao_v2','bens','timeline','docs','insights'];",
  "  const tabList = ['notas','pessoas','prescricao_v2','bens','tarefas','importar','docs'];",
  'tabList',
);
app = replaceOnce(
  app,
  "  const tabLabels = { notas:'Anotações', grafo:'Grafo', tarefas:'Tarefas', importar:'Importar', pessoas:'Pessoas', dividas:'CDAs', execucoes:'Processos', prescricao_v2:'Controle da Prescrição', bens:'Bens', timeline:'Linha do Tempo', docs:'Docs', insights:'Insights' };",
  "  const tabLabels = { notas:'Anotações', pessoas:'Pessoas', prescricao_v2:'Processos e Prescrição', bens:'Bens', tarefas:'Tarefas', importar:'Importar', docs:'Arquivos' };",
  'tabLabels',
);

// ─── 4) DEMO_ZONES alinhadas às abas slim ───
if (app.includes('const DEMO_ZONES = {')) {
  app = replaceOnce(
    app,
    `  const DEMO_ZONES = {
    briefing: { label: 'Briefing', tabs: ['notas'] },
    acervo: { label: 'Acervo', tabs: ['pessoas', 'dividas', 'execucoes', 'bens'] },
    risco: { label: 'Risco', tabs: ['prescricao_v2', 'timeline'] },
    ferramentas: { label: 'Ferramentas', tabs: ['tarefas', 'importar', 'docs', 'grafo', 'insights'] },
  };`,
    `  const DEMO_ZONES = {
    briefing: { label: 'Briefing', tabs: ['notas'] },
    acervo: { label: 'Acervo', tabs: ['pessoas', 'bens'] },
    risco: { label: 'Risco', tabs: ['prescricao_v2'] },
    ferramentas: { label: 'Ferramentas', tabs: ['tarefas', 'importar', 'docs'] },
  };`,
    'DEMO_ZONES',
  );
}

// zoneOf helper (Demo deep-links)
if (app.includes("if (['pessoas','dividas','execucoes','bens'].includes(tab)) return 'acervo';")) {
  app = replaceOnce(
    app,
    `    const zoneOf = (tab) => {
      if (['pessoas','dividas','execucoes','bens'].includes(tab)) return 'acervo';
      if (['prescricao_v2','timeline','prescricao'].includes(tab)) return 'risco';
      if (['tarefas','importar','docs','grafo','insights'].includes(tab)) return 'ferramentas';
      return 'briefing';
    };`,
    `    const zoneOf = (tab) => {
      if (['pessoas','bens'].includes(tab)) return 'acervo';
      if (['prescricao_v2','prescricao','dividas','execucoes','timeline'].includes(tab)) return 'risco';
      if (['tarefas','importar','docs','grafo','insights'].includes(tab)) return 'ferramentas';
      return 'briefing';
    };`,
    'zoneOf',
  );
}

// ─── 5) Redirect abas removidas ───
if (!app.includes("if (!tabList.includes(activeTab)) setActiveTab('prescricao_v2')")) {
  app = replaceOnce(
    app,
    "  const tabLabels = { notas:'Anotações', pessoas:'Pessoas', prescricao_v2:'Processos e Prescrição', bens:'Bens', tarefas:'Tarefas', importar:'Importar', docs:'Arquivos' };",
    `  const tabLabels = { notas:'Anotações', pessoas:'Pessoas', prescricao_v2:'Processos e Prescrição', bens:'Bens', tarefas:'Tarefas', importar:'Importar', docs:'Arquivos' };
  React.useEffect(() => {
    // Abas removidas (grafo, insights, timeline, CDAs, Processos) → visão integrada
    if (!tabList.includes(activeTab)) setActiveTab('prescricao_v2');
  }, [activeTab]);`,
    'orphan-tab redirect',
  );
}

// ─── 6) Substituir corpo da aba prescricao_v2 pelo do stash ───
const stashPrescStart = stashApp.indexOf("    if (activeTab === 'prescricao_v2') {");
const stashPrescEnd = stashApp.indexOf("    if (activeTab === 'medidas') {", stashPrescStart);
const headPrescStart = app.indexOf("    if (activeTab === 'prescricao_v2') {");
const headPrescEnd = app.indexOf("    if (activeTab === 'medidas') {", headPrescStart);
if (stashPrescStart === -1 || stashPrescEnd === -1) fail('bloco presc stash não encontrado');
if (headPrescStart === -1 || headPrescEnd === -1) fail('bloco presc HEAD não encontrado');
const stashPresc = stashApp.slice(stashPrescStart, stashPrescEnd);
if (!stashPresc.includes('process-group')) fail('bloco stash sem process-group');
app = app.slice(0, headPrescStart) + stashPresc + app.slice(headPrescEnd);
console.log('OK  aba Processos e Prescrição (fundida) restaurada do stash');

// ─── 7) Busca global: remap de abas antigas ───
if (app.includes('if (r.tab) setActiveTab(r.tab);') && !app.includes("dividas:'prescricao_v2',execucoes:'prescricao_v2'")) {
  app = replaceOnce(
    app,
    'if (r.tab) setActiveTab(r.tab);',
    "if (r.tab) setActiveTab(({dividas:'prescricao_v2',execucoes:'prescricao_v2',prescricao:'prescricao_v2',timeline:'prescricao_v2',grafo:'pessoas',insights:'notas'}[r.tab]) || r.tab);",
    'busca global remap',
  );
  console.log('OK  remap busca global para abas fundidas');
}

// ─── Validações ───
if (!app.includes("prescricao_v2:'Processos e Prescrição'")) fail('rótulo fundido ausente');
if (!app.includes('process-summary')) fail('process-summary ausente');
if (/tabList = \[[^\]]*timeline/.test(app)) fail('timeline ainda na tabList');
if (/tabList = \[[^\]]*grafo/.test(app)) fail('grafo ainda na tabList');
if (!fs.readFileSync(shellPath, 'utf8').includes('.process-group')) fail('CSS process-group ausente');

writeText(appPath, app);
console.log('OK  UX aprovado restaurado em src/app.jsx');
console.log('    Abas: Anotações · Pessoas · Processos e Prescrição · Bens · Tarefas · Importar · Arquivos');
console.log('    Demo/Mar/Intimações-Tarefas/Agenda semanal preservados');
