import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'Nexus.html'), 'utf8');

const m = html.match(/var b64 = \[\n([\s\S]*?)\n\s*\]\.join/);
if (!m) {
  console.log('FAIL: base64 nao encontrado');
  process.exit(1);
}
const b64 = m[1].split(',').map((s) => s.trim().replace(/^"|"$/g, '')).join('');
const code = Buffer.from(b64, 'base64').toString('utf8');
console.log('decoded bytes:', code.length);
console.log('has createRoot:', code.includes('ReactDOM.createRoot'));
console.log('has ErrorBoundary:', code.includes('class ErrorBoundary'));
try {
  new Function(code);
  console.log('parse: OK');
} catch (e) {
  console.log('parse FAIL:', e.message);
  process.exit(1);
}
console.log('createRoot exposto fora do base64 (deve ser false):', html.includes('ReactDOM.createRoot('));
console.log('build stamp:', (html.match(/__NEXUS_BUILD__ = '([^']+)'/) || [])[1]);
console.log('html total bytes:', html.length);
console.log('TextDecoder usado:', html.includes('TextDecoder'));
