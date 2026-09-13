/**
 * Acelera transições entre abas/operações:
 *  1) Cache das listas filtradas por operação (getOpSlices) — trocar de aba
 *     reutiliza as fatias em vez de refiltrar todas as coleções.
 *  2) Clique em operação: gravação de lastAccessed adiada (não bloqueia a abertura).
 *  3) useTransition nos cliques de aba/operação — a UI não congela durante o render.
 * Uso único: node scripts/archive/refactor-transicoes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = path.join(root, 'src', 'app.jsx');
let src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');

const appStart = lines.findIndex((l) => l === 'function App() {') + 1; // 1-based
const appEnd = lines.findIndex((l) => l.startsWith('function Copyable(')) + 1;
if (appStart <= 0 || appEnd <= appStart) {
  console.error('ABORT: limites do App não encontrados', { appStart, appEnd });
  process.exit(1);
}

// ── 1) Inserir getOpSlices + useTransition depois do estado cdaPopup ──
const anchorIdx = lines.findIndex((l) => l.includes('const [cdaPopup, setCdaPopup] = useState(null);'));
if (anchorIdx < 0 || anchorIdx > appEnd) { console.error('ABORT: âncora cdaPopup não encontrada'); process.exit(1); }

const insertBlock = `  // ─── PERF: fatias por operação com cache (invalidado quando 'data' muda) ───
  // Trocar de aba reutiliza listas já filtradas em vez de refiltrar todas as coleções.
  const opSlicesCache = useMemo(() => new Map(), [data]);
  const getOpSlices = (oid) => {
    let s = opSlicesCache.get(oid);
    if (!s) {
      s = {
        people: data.people.filter(p => p.operationId === oid),
        debts: data.debts.filter(d => d.operationId === oid),
        executions: data.executions.filter(e => e.operationId === oid),
        assets: data.assets.filter(a => a.operationId === oid),
        measures: (data.measures || []).filter(m => m.operationId === oid),
      };
      opSlicesCache.set(oid, s);
    }
    return s;
  };
  // Transição não-bloqueante ao trocar de aba/operação (React 18)
  const [isTabSwitching, startTabSwitch] = React.useTransition();`;

lines.splice(anchorIdx + 1, 0, insertBlock);
src = lines.join('\n');

// ── 2) Substituir refiltragens uniformes DENTRO do App ──
const collections = ['people', 'debts', 'executions', 'assets', 'measures'];
let replaced = 0;
const bodyLines = src.split('\n');
const appStart2 = bodyLines.findIndex((l) => l === 'function App() {');
const appEnd2 = bodyLines.findIndex((l) => l.startsWith('function Copyable('));
for (let i = appStart2; i < appEnd2; i++) {
  for (const col of collections) {
    const re = new RegExp(`(data\\.${col}|\\(data\\.${col} \\|\\| \\[\\]\\))\\.filter\\(\\w+ => \\w+\\.operationId === opId\\)`, 'g');
    const before = bodyLines[i];
    bodyLines[i] = bodyLines[i].replace(re, `getOpSlices(opId).${col}`);
    if (bodyLines[i] !== before) replaced++;
  }
}
src = bodyLines.join('\n');
if (replaced < 25) { console.error(`ABORT: esperava >=25 substituições de fatias, fiz ${replaced}`); process.exit(1); }

// ── 3) Cliques ──
function mustSwap(from, to, expected, label) {
  const count = src.split(from).length - 1;
  if (count !== expected) {
    console.error(`ABORT: ${label} — esperado ${expected}x, achei ${count}x`);
    process.exit(1);
  }
  src = src.split(from).join(to);
}

// 3a) Troca de aba com transição
mustSwap(
  'onClick={() => {setActiveTab(t);setSelectedNode(null);}}',
  'onClick={() => startTabSwitch(() => {setActiveTab(t);setSelectedNode(null);})} style={isTabSwitching?{opacity:0.6}:undefined}',
  1,
  'clique de aba'
);

// 3b) Sidebar: abrir operação — transição + lastAccessed adiado
mustSwap(
  "onClick={() => { setActiveOpId(op.id); setSelectedNode(null); setImportResult(null); setViewMode('operation'); upsert('operations', {...op, lastAccessed: new Date().toISOString()}); }}",
  "onClick={() => { startTabSwitch(() => { setActiveOpId(op.id); setSelectedNode(null); setImportResult(null); setViewMode('operation'); }); setTimeout(() => upsert('operations', {...op, lastAccessed: new Date().toISOString()}), 800); }}",
  1,
  'clique de operação (sidebar)'
);

// 3c) Painel: abrir operação — idem
mustSwap(
  "onClick={() => { setActiveOpId(op.id); setViewMode('operation'); upsert('operations', {...op, lastAccessed: new Date().toISOString()}); }}",
  "onClick={() => { startTabSwitch(() => { setActiveOpId(op.id); setViewMode('operation'); }); setTimeout(() => upsert('operations', {...op, lastAccessed: new Date().toISOString()}), 800); }}",
  1,
  'clique de operação (painel)'
);

// ── Sanidade ──
const checks = [
  ['getOpSlices(opId).', replaced],
  ['const getOpSlices = (oid) =>', 1],
  ['React.useTransition()', 1],
  ['startTabSwitch', 4],
];
for (const [needle, min] of checks) {
  const count = src.split(needle).length - 1;
  if (count < min) { console.error(`ABORT (pós): "${needle}" esperado >=${min}, achei ${count}`); process.exit(1); }
}

fs.writeFileSync(file, src, 'utf8');
console.log(`OK — ${replaced} linhas de refiltragem trocadas por fatias em cache; 3 cliques otimizados.`);
