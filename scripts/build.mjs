/**
 * Compila src/app.jsx (JSX) → JavaScript e injeta em src/Nexus.shell.html,
 * gerando Nexus.html (artefato de deploy do Apps Script).
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
const shellPath = path.join(root, 'src', 'Nexus.shell.html');
const outPath = path.join(root, 'Nexus.html');
const MARKER = '<!--INJECT_APP_JS-->';

const jsx = fs.readFileSync(jsxPath, 'utf8');
const shell = fs.readFileSync(shellPath, 'utf8');

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
const b64 = Buffer.from(result.code, 'utf8').toString('base64');
// Quebra em pedaços para evitar uma única linha de ~1.2M chars
const CHUNK = 20000;
const parts = [];
for (let i = 0; i < b64.length; i += CHUNK) {
  parts.push(b64.slice(i, i + CHUNK));
}
const partsJs = parts.map((p) => `"${p}"`).join(',\n');

const banner =
  `<!-- GERADO por scripts/build.mjs em ${new Date().toISOString()}. ` +
  `NAO edite Nexus.html. Edite src/app.jsx e src/Nexus.shell.html, depois: npm run build -->`;

const injected = `<script>
(function () {
  window.__NEXUS_BUILD__ = '${buildStamp}';
  var boot = document.getElementById('nexus-boot');
  if (boot) boot.textContent = 'Carregando NEXUS… (build ${buildStamp})';
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

// Validação: o fim do documento não pode aparecer no meio do arquivo.
const docEnd = '</body>\n</html>';
const endPositions = [];
let from = 0;
while (true) {
  const p = html.indexOf(docEnd, from);
  if (p === -1) break;
  endPositions.push(p);
  from = p + 1;
}
if (endPositions.length !== 1) {
  console.error(`ERRO: esperado 1 '</body></html>', achei ${endPositions.length}. Build corrompido.`);
  process.exit(1);
}
if (endPositions[0] < html.length - docEnd.length - 5) {
  console.error('ERRO: </body></html> não está no fim do arquivo. Build corrompido.');
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
new Function(decoded); // valida sintaxe; lança se inválido
const appLen = decoded.length;

fs.writeFileSync(outPath, html, 'utf8');

const ms = Date.now() - t0;
const jsxKb = (Buffer.byteLength(jsx, 'utf8') / 1024).toFixed(1);
const outKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`OK  src/app.jsx (${jsxKb} KB) → Nexus.html (${outKb} KB) em ${ms} ms`);
console.log(`    script do app: ${(appLen / 1024).toFixed(1)} KB (íntegro)`);
console.log('    babel-standalone removido — o navegador recebe JS já compilado.');
console.log('    Próximo passo: clasp push');
