/**
 * Compila src/app.jsx (JSX) → JavaScript e injeta em src/Nexus.shell.html,
 * gerando três HTMLs:
 *   Nexus.html              — clássico (doGet / Apps Script)
 *   Nexus.demo.html         — Demo (compartilhar e testes menores; UI clássica)
 *   demo_experimental.html  — Demo Experimental (Beta / testes desta trilha)
 *
 * Uso:  npm run build
 * Depois: clasp push
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const jsxPath = path.join(root, 'src', 'app.jsx');
const claudePath = path.join(root, 'src', 'edition-claude.jsx');
const datesPath = path.join(root, 'src', 'lib', 'dates.js');
const prescPath = path.join(root, 'src', 'lib', 'prescription.js');
const docsPath = path.join(root, 'src', 'lib', 'docs.js');
const importGuardPath = path.join(root, 'src', 'lib', 'import-guard.js');
const processesPath = path.join(root, 'src', 'lib', 'processes.js');
const diagnosticsPath = path.join(root, 'src', 'lib', 'diagnostics.js');
const exportPath = path.join(root, 'src', 'lib', 'export.js');
const agendaPath = path.join(root, 'src', 'lib', 'agenda.js');
const reportPath = path.join(root, 'src', 'lib', 'report.js');
const esteiraPath = path.join(root, 'src', 'lib', 'esteira.js');
const shellPath = path.join(root, 'src', 'Nexus.shell.html');
const outPath = path.join(root, 'Nexus.html');
const outDemoPath = path.join(root, 'Nexus.demo.html');
const outExperimentalPath = path.join(root, 'demo_experimental.html');
const leftoverAliases = [
  path.join(root, 'Nexus_demo.html'),
  path.join(root, 'Nexus_demo_experimental.html'),
];
const MARKER = '<!--INJECT_APP_JS-->';
const RULES_MARKER = '<!--INJECT_PRESC_RULES-->';
const rulesMdPath = path.join(root, 'MOTOR_PRESCRICAO.md');

function mdToHtml(src) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) {
      out.push('<p>' + inline(para.join(' ')) + '</p>');
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push('<' + list.tag + '>' + list.items.join('') + '</' + list.tag + '>');
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushPara();
      flushList();
      out.push('<hr/>');
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>');
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!list || list.tag !== 'ul') {
        flushList();
        list = { tag: 'ul', items: [] };
      }
      list.items.push('<li>' + inline(ul[1]) + '</li>');
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.tag !== 'ol') {
        flushList();
        list = { tag: 'ol', items: [] };
      }
      list.items.push('<li>' + inline(ol[1]) + '</li>');
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return out.join('\n');
}

function unwrapModule(src) {
  return src
    .replace(/^import\s+[^;]+;\s*$/gm, '')
    .replace(/^export\s+/gm, '');
}

const jsx = [
  '/* --- src/lib/dates.js --- */',
  unwrapModule(fs.readFileSync(datesPath, 'utf8')),
  '/* --- src/lib/prescription.js --- */',
  unwrapModule(fs.readFileSync(prescPath, 'utf8')),
  '/* --- src/lib/prazos-mesa.js --- */',
  unwrapModule(fs.readFileSync(path.join(root, 'src', 'lib', 'prazos-mesa.js'), 'utf8')),
  '/* --- src/lib/presc-import.js --- */',
  unwrapModule(fs.readFileSync(path.join(root, 'src', 'lib', 'presc-import.js'), 'utf8')),
  '/* --- src/lib/docs.js --- */',
  unwrapModule(fs.readFileSync(docsPath, 'utf8')),
  '/* --- src/lib/import-guard.js --- */',
  unwrapModule(fs.readFileSync(importGuardPath, 'utf8')),
  '/* --- src/lib/processes.js --- */',
  unwrapModule(fs.readFileSync(processesPath, 'utf8')),
  '/* --- src/lib/diagnostics.js --- */',
  unwrapModule(fs.readFileSync(diagnosticsPath, 'utf8')),
  '/* --- src/lib/export.js --- */',
  unwrapModule(fs.readFileSync(exportPath, 'utf8')),
  '/* --- src/lib/debcad-parser.js --- */',
  unwrapModule(fs.readFileSync(path.join(root, 'src', 'lib', 'debcad-parser.js'), 'utf8')),
  '/* --- src/lib/sida-parser.js --- */',
  unwrapModule(fs.readFileSync(path.join(root, 'src', 'lib', 'sida-parser.js'), 'utf8')),
  '/* --- src/lib/agenda.js --- */',
  unwrapModule(fs.readFileSync(agendaPath, 'utf8')),
  '/* --- src/lib/report.js --- */',
  unwrapModule(fs.readFileSync(reportPath, 'utf8')),
  '/* --- src/lib/esteira.js --- */',
  unwrapModule(fs.readFileSync(esteiraPath, 'utf8')),
  '/* --- src/edition-claude.jsx --- */',
  unwrapModule(fs.readFileSync(claudePath, 'utf8')),
  '/* --- src/app.jsx --- */',
  unwrapModule(fs.readFileSync(jsxPath, 'utf8')),
].join('\n');
let shell = fs.readFileSync(shellPath, 'utf8');

if (!shell.includes(MARKER)) {
  console.error(`ERRO: marcador ${MARKER} não encontrado em src/Nexus.shell.html`);
  process.exit(1);
}
if (!shell.includes(RULES_MARKER)) {
  console.error(`ERRO: marcador ${RULES_MARKER} não encontrado em src/Nexus.shell.html`);
  process.exit(1);
}
if (!fs.existsSync(rulesMdPath)) {
  console.error('ERRO: MOTOR_PRESCRICAO.md não encontrado');
  process.exit(1);
}
const rulesHtml = mdToHtml(fs.readFileSync(rulesMdPath, 'utf8'));
if (!/R1/.test(rulesHtml) || !/R12/.test(rulesHtml) || !/2026\.09/.test(rulesHtml)) {
  console.error('ERRO: MOTOR_PRESCRICAO.md precisa da versão 2026.09 e das regras R1–R12');
  process.exit(1);
}
shell = shell.replace(RULES_MARKER, () => rulesHtml);

if (!shell.includes(MARKER)) {
  console.error(`ERRO: marcador ${MARKER} não encontrado em src/Nexus.shell.html`);
  process.exit(1);
}
if (shell.includes('babel-standalone') || shell.includes('text/babel')) {
  console.error('ERRO: shell ainda referencia babel-standalone / text/babel');
  process.exit(1);
}

const t0 = Date.now();
const result = transformSync(jsx, {
  filename: 'app.jsx',
  presets: [
    [
      '@babel/preset-env',
      {
        // Evita template literals / syntax moderna que o HtmlService às vezes corrompe
        targets: { chrome: '90' },
        bugfixes: true,
        modules: false,
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'classic',
        development: false,
      },
    ],
  ],
  babelrc: false,
  configFile: false,
  sourceMaps: false,
  compact: false,
  comments: true,
});

if (!result || !result.code) {
  console.error('ERRO: Babel não retornou código');
  process.exit(1);
}

// O pipeline do HtmlService (Apps Script) corrompe JS inline grande que contém
// sequências parecidas com HTML (<style>, </body>, template literals com HTML...).
// Solução à prova de mangling: empacotar o código em BASE64 (alfabeto A-Za-z0-9+/=,
// nada que um parser de HTML possa interpretar) e decodificar no navegador.
const buildStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
let appVersion = '0.0.0';
try {
  appVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version || appVersion;
} catch (_) { /* ignore */ }
const b64 = Buffer.from(result.code, 'utf8').toString('base64');
// Quebra em pedaços para evitar uma única linha de ~1.2M chars
const CHUNK = 20000;
const parts = [];
for (let i = 0; i < b64.length; i += CHUNK) {
  parts.push(b64.slice(i, i + CHUNK));
}
const partsJs = parts.map((p) => `"${p}"`).join(',\n');

function buildInjected({ demo, share, bootLabel }) {
  return `<script>
(function () {
  window.__NEXUS_BUILD__ = '${buildStamp}';
  window.__NEXUS_VERSION__ = '${appVersion}';
  window.__NEXUS_DEMO__ = ${demo ? 'true' : 'false'};
  window.__NEXUS_SHARE_DEMO__ = ${share ? 'true' : 'false'};
  var boot = document.getElementById('nexus-boot');
  if (boot) boot.textContent = 'Carregando NEXUS ${appVersion}${bootLabel}… (build ${buildStamp})';
  try {
    var b64 = [
${partsJs}
    ].join('');
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var code = new TextDecoder('utf-8').decode(bytes);
    var s = document.createElement('script');
    s.textContent = code;
    document.body.appendChild(s);
  } catch (e) {
    var r = document.getElementById('root');
    if (r) r.textContent = 'Falha ao decodificar o app (build ${buildStamp}): ' + e.message;
  }
})();
</script>`;
}

function assembleHtml({ fileName, title, bootLabel, demo, share }) {
  const banner =
    `<!-- GERADO por scripts/build.mjs em ${new Date().toISOString()}. ` +
    `NAO edite ${fileName}. Edite src/app.jsx e src/Nexus.shell.html, depois: npm run build -->`;
  const injected = buildInjected({ demo, share, bootLabel });
  // IMPORTANTE: usar função no replace. Se passar a string direto, o JS interpreta
  // padrões especiais ($', $&, $1...) e corrompe o HTML (causa "Conteúdo HTML inválido").
  let html = shell.replace(MARKER, () => injected);

  // Banner DENTRO do head (nunca antes do <!DOCTYPE> — o Apps Script rejeita).
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n${banner}`);
  } else {
    console.error('ERRO: <head> não encontrado no shell');
    process.exit(1);
  }

  if (title) {
    html = html.replace(
      '<title>NEXUS — Painel de Operações Fiscais v2</title>',
      `<title>${title}</title>`
    );
  }

  // Validação: o fim do documento não pode aparecer no meio do arquivo.
  // Aceita LF e CRLF (Windows).
  const docEndMatch = html.match(/<\/body>\r?\n<\/html>\s*$/);
  const docEndCount = (html.match(/<\/body>\r?\n<\/html>/g) || []).length;
  if (docEndCount !== 1 || !docEndMatch) {
    console.error(`ERRO: esperado 1 '</body></html>' no fim do arquivo, achei ${docEndCount}. Build corrompido.`);
    process.exit(1);
  }

  // Validação: o payload base64 precisa decodificar de volta EXATAMENTE ao código compilado.
  const b64InHtml = html.match(/var b64 = \[\n([\s\S]*?)\n\s*\]\.join\(''\);/);
  if (!b64InHtml) {
    console.error('ERRO: payload base64 não encontrado no HTML gerado.');
    process.exit(1);
  }
  const rebuilt = b64InHtml[1]
    .split(',')
    .map((s) => s.trim().replace(/^"|"$/g, ''))
    .join('');
  const decoded = Buffer.from(rebuilt, 'base64').toString('utf8');
  if (decoded !== result.code) {
    console.error('ERRO: base64 não bate com o código compilado. Build corrompido.');
    process.exit(1);
  }
  return { html, appLen: decoded.length };
}

new Function(result.code); // valida sintaxe; lança se inválido

const classic = assembleHtml({
  fileName: 'Nexus.html',
  title: null,
  bootLabel: '',
  demo: false,
  share: false,
});
fs.writeFileSync(outPath, classic.html, 'utf8');

const shareDemo = assembleHtml({
  fileName: 'Nexus.demo.html',
  title: 'NEXUS Demo',
  bootLabel: ' Demo',
  demo: false,
  share: true,
});
fs.writeFileSync(outDemoPath, shareDemo.html, 'utf8');

const experimental = assembleHtml({
  fileName: 'demo_experimental.html',
  title: 'NEXUS Demo Experimental',
  bootLabel: ' Demo Experimental',
  demo: true,
  share: false,
});
fs.writeFileSync(outExperimentalPath, experimental.html, 'utf8');

for (const leftover of leftoverAliases) {
  if (fs.existsSync(leftover)) {
    fs.unlinkSync(leftover);
    console.log(`    removido alias duplicado: ${path.basename(leftover)}`);
  }
}

const ms = Date.now() - t0;
const jsxKb = (Buffer.byteLength(jsx, 'utf8') / 1024).toFixed(1);
const outKb = (Buffer.byteLength(classic.html, 'utf8') / 1024).toFixed(1);
const shareKb = (Buffer.byteLength(shareDemo.html, 'utf8') / 1024).toFixed(1);
const expKb = (Buffer.byteLength(experimental.html, 'utf8') / 1024).toFixed(1);
console.log(`OK  NEXUS ${appVersion} · src/app.jsx (${jsxKb} KB) → Nexus.html (${outKb} KB) em ${ms} ms`);
console.log(`    + Nexus.demo.html (${shareKb} KB) — Demo (clássico, compartilhar)`);
console.log(`    + demo_experimental.html (${expKb} KB) — Demo Experimental (Beta)`);
console.log(`    script do app: ${(classic.appLen / 1024).toFixed(1)} KB (íntegro)`);
console.log('    babel-standalone removido — o navegador recebe JS já compilado.');
console.log('    Próximo passo: clasp push');
