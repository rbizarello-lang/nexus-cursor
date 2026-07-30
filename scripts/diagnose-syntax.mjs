import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'Nexus.html'), 'utf8');
const mount = html.indexOf('ReactDOM.createRoot');
const open = html.lastIndexOf('<script>', mount) + '<script>'.length;
const closeMatch = html.slice(open).search(/<\/script/i);
console.log('app script length', closeMatch);
console.log('createRoot offset in script', mount - open);
console.log('createRoot before close?', mount - open < closeMatch);

const code = html.slice(open, open + closeMatch);
const lines = code.split('\n');
const line = lines[17340];
console.log('line 17341 JSON:', JSON.stringify(line));
console.log(
  'chars:',
  [...line].map((ch, i) => (ch === '`' || ch.charCodeAt(0) > 127 ? `${i}:${ch}(U+${ch.charCodeAt(0).toString(16)})` : null)).filter(Boolean)
);

// Any non-ASCII backticks / lookalikes in whole file?
const lookalikes = [];
for (let i = 0; i < code.length; i++) {
  const c = code.charCodeAt(i);
  if (c === 0x2018 || c === 0x2019 || c === 0x201c || c === 0x201d || c === 0xff40 || c === 0x00b4) {
    lookalikes.push({ i, c, line: code.slice(0, i).split('\n').length });
  }
}
console.log('lookalike quotes', lookalikes.length, lookalikes.slice(0, 10));

// Find </script variants inside script body
const closes = [];
const re = /<\/\s*script/gi;
let m;
while ((m = re.exec(code))) closes.push({ index: m.index, match: m[0], line: code.slice(0, m.index).split('\n').length });
console.log('</script-like inside app JS:', closes);

// Nested template risk: count backticks balance up to line 17341
const prefix = lines.slice(0, 17341).join('\n');
let inBacktick = false;
let inSingle = false;
let inDouble = false;
let escaped = false;
let inLineComment = false;
let inBlockComment = false;
for (let i = 0; i < prefix.length; i++) {
  const ch = prefix[i];
  const next = prefix[i + 1];
  if (inLineComment) {
    if (ch === '\n') inLineComment = false;
    continue;
  }
  if (inBlockComment) {
    if (ch === '*' && next === '/') {
      inBlockComment = false;
      i++;
    }
    continue;
  }
  if (escaped) {
    escaped = false;
    continue;
  }
  if (inSingle) {
    if (ch === '\\') escaped = true;
    else if (ch === "'") inSingle = false;
    continue;
  }
  if (inDouble) {
    if (ch === '\\') escaped = true;
    else if (ch === '"') inDouble = false;
    continue;
  }
  if (inBacktick) {
    if (ch === '\\') escaped = true;
    else if (ch === '`') inBacktick = false;
    continue;
  }
  if (ch === '/' && next === '/') {
    inLineComment = true;
    i++;
    continue;
  }
  if (ch === '/' && next === '*') {
    inBlockComment = true;
    i++;
    continue;
  }
  if (ch === "'") inSingle = true;
  else if (ch === '"') inDouble = true;
  else if (ch === '`') inBacktick = true;
}
console.log('string state at 17341:', { inBacktick, inSingle, inDouble, inLineComment, inBlockComment });
console.log('So the reason:` at 17341 is inside already-open backtick?', inBacktick);

try {
  new Function(code);
  console.log('Node parse: OK');
} catch (e) {
  console.log('Node parse FAIL', e.message);
}
