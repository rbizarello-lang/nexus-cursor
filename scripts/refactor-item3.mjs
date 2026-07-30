/**
 * Item 3 do MELHORIAS.md — move PersonProfileCard, ExecutadoLine e CDAList
 * para o escopo do módulo (identidade estável) com React.memo.
 * Uso único: node scripts/refactor-item3.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src', 'app.jsx');
const src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');

function assertLine(n, expectedStart) {
  const got = lines[n - 1];
  if (!got.trimStart().startsWith(expectedStart.trimStart())) {
    console.error(`ABORT: linha ${n} esperada começar com:\n  ${expectedStart}\nmas é:\n  ${got}`);
    process.exit(1);
  }
}

// ── Verificar âncoras (1-based) ──
assertLine(2599, 'function App() {');
assertLine(5156, 'const PersonProfileCard = ({ s }) => {');
assertLine(5243, '};');
assertLine(5724, 'const ExecutadoLine = ({ processNumber }) => {');
assertLine(5733, '};');
assertLine(5735, 'const CDAList = ({ cdas, processNumber }) => {');
assertLine(5744, '};');

// ── Extrair blocos (0-based slices) ──
const personBlock = lines.slice(5155, 5243).join('\n');
const execLineBlock = lines.slice(5723, 5733).join('\n');
const cdaListBlock = lines.slice(5734, 5744).join('\n');

function mustReplace(block, from, to, label) {
  if (!block.includes(from)) {
    console.error(`ABORT: não achei em ${label}:\n  ${from}`);
    process.exit(1);
  }
  return block.split(from).join(to);
}

// ── Transformar em componentes de módulo ──
let personMod = personBlock;
personMod = mustReplace(
  personMod,
  'const PersonProfileCard = ({ s }) => {',
  'const PersonProfileCard = React.memo(function PersonProfileCard({ s, data, allLinks, people, collapsedGroups, toggleGroup, setModal }) {',
  'PersonProfileCard header'
);
personMod = mustReplace(personMod, 'items.find(pp =>', 'people.find(pp =>', 'PersonProfileCard items.find');
if (!personMod.trimEnd().endsWith('};')) { console.error('ABORT: fim inesperado de PersonProfileCard'); process.exit(1); }
personMod = personMod.trimEnd().slice(0, -2) + '});';

let execMod = execLineBlock;
execMod = mustReplace(
  execMod,
  'const ExecutadoLine = ({ processNumber }) => {',
  'const ExecutadoLine = React.memo(function ExecutadoLine({ processNumber, getDebtors, onEditPerson }) {',
  'ExecutadoLine header'
);
execMod = mustReplace(execMod, 'const debtors = getDebtorsForProcess(processNumber);', 'const debtors = getDebtors(processNumber);', 'ExecutadoLine getDebtors');
execMod = mustReplace(
  execMod,
  "setModal({type:'edit',entityType:'person',initial:data.people.find(p=>p.id===d.id)});",
  'onEditPerson(d.id);',
  'ExecutadoLine onClick'
);
execMod = execMod.trimEnd().slice(0, -2) + '});';

let cdaMod = cdaListBlock;
cdaMod = mustReplace(
  cdaMod,
  'const CDAList = ({ cdas, processNumber }) => {',
  'const CDAList = React.memo(function CDAList({ cdas, processNumber, onShowAll }) {',
  'CDAList header'
);
cdaMod = mustReplace(cdaMod, 'setCdaPopup({ cdas, processNumber });', 'onShowAll({ cdas, processNumber });', 'CDAList onShowAll');
cdaMod = cdaMod.trimEnd().slice(0, -2) + '});';

const dedent = (t) => t.split('\n').map((l) => l.replace(/^ {6}/, '')).join('\n');

const moduleBlock = [
  '// ─── PERF (item 3): componentes movidos para FORA do App ───',
  '// Definidos dentro do App, eram recriados a cada render — o React os via como',
  '// componentes novos e desmontava/remontava toda a subárvore a cada tecla digitada.',
  '// No escopo do módulo a identidade é estável; React.memo evita re-renders extras.',
  '',
  dedent(execMod),
  '',
  dedent(cdaMod),
  '',
  dedent(personMod),
  '',
].join('\n');

// ── Cirurgia de linhas (de baixo para cima, índices 0-based) ──
// Remove CDAList (5735-5744) e a linha em branco 5734 entre os dois blocos
lines.splice(5733, 11); // remove 0-based 5733..5743 (linha 5734 em branco + bloco CDAList)
// Remove ExecutadoLine (5724-5733) e insere o helper de clique
lines.splice(5723, 10, "      const openEditPersonById = (pid) => setModal({type:'edit',entityType:'person',initial:data.people.find(p=>p.id===pid)});");
// Remove PersonProfileCard (5156-5243) e a linha em branco seguinte (5244)
lines.splice(5155, 89);
// Insere o bloco de módulo antes de function App() (linha 2599 → índice 2598)
lines.splice(2598, 0, moduleBlock);

let out = lines.join('\n');

// ── Call sites ──
const swaps = [
  [
    '{alvos.map(s => <PersonProfileCard key={s.person.id} s={s} />)}',
    '{alvos.map(s => <PersonProfileCard key={s.person.id} s={s} data={data} allLinks={allLinks} people={items} collapsedGroups={collapsedGroups} toggleGroup={toggleGroup} setModal={setModal} />)}',
    1,
  ],
  [
    '{relacionadas.map(s => <PersonProfileCard key={s.person.id} s={s} />)}',
    '{relacionadas.map(s => <PersonProfileCard key={s.person.id} s={s} data={data} allLinks={allLinks} people={items} collapsedGroups={collapsedGroups} toggleGroup={toggleGroup} setModal={setModal} />)}',
    1,
  ],
  [
    '<ExecutadoLine processNumber={ep.processNumber} />',
    '<ExecutadoLine processNumber={ep.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />',
    1,
  ],
  [
    '<ExecutadoLine processNumber={ap.processNumber} />',
    '<ExecutadoLine processNumber={ap.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />',
    1,
  ],
  [
    '<ExecutadoLine processNumber={e.processNumber} />',
    '<ExecutadoLine processNumber={e.processNumber} getDebtors={getDebtorsForProcess} onEditPerson={openEditPersonById} />',
    2,
  ],
  [
    '<CDAList cdas={linkedCDAs} processNumber={ep.processNumber} />',
    '<CDAList cdas={linkedCDAs} processNumber={ep.processNumber} onShowAll={setCdaPopup} />',
    2,
  ],
  [
    '<CDAList cdas={apCdas} processNumber={ap.processNumber} />',
    '<CDAList cdas={apCdas} processNumber={ap.processNumber} onShowAll={setCdaPopup} />',
    1,
  ],
  [
    '<CDAList cdas={linkedCDAs} processNumber={e.processNumber} />',
    '<CDAList cdas={linkedCDAs} processNumber={e.processNumber} onShowAll={setCdaPopup} />',
    2,
  ],
];

for (const [from, to, expected] of swaps) {
  const count = out.split(from).length - 1;
  if (count !== expected) {
    console.error(`ABORT: call site "${from.slice(0, 60)}..." esperado ${expected}x, achei ${count}x`);
    process.exit(1);
  }
  out = out.split(from).join(to);
}

// ── Sanidade final ──
const checks = [
  ['const PersonProfileCard = React.memo(', 1],
  ['const ExecutadoLine = React.memo(', 1],
  ['const CDAList = React.memo(', 1],
  ['const PersonProfileCard = ({ s }) => {', 0],
  ['const ExecutadoLine = ({ processNumber }) => {', 0],
  ['const CDAList = ({ cdas, processNumber }) => {', 0],
  ['onShowAll={setCdaPopup}', 5],
  ['getDebtors={getDebtorsForProcess}', 4],
  ['openEditPersonById', 5],
];
for (const [needle, expected] of checks) {
  const count = out.split(needle).length - 1;
  if (count !== expected) {
    console.error(`ABORT (pós): "${needle}" esperado ${expected}x, achei ${count}x`);
    process.exit(1);
  }
}

fs.writeFileSync(file, out, 'utf8');
console.log('OK — refactor aplicado.');
console.log('linhas antes:', src.split('\n').length, '→ depois:', out.split('\n').length);
