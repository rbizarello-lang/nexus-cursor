import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = path.join(root, 'gas');
fs.mkdirSync(gas, { recursive: true });
for (const f of ['Nexus.html', 'Código.js', 'RESUMO-DIARIO.js', 'appsscript.json']) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) {
    console.error('ERRO: falta', f);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(gas, f));
  console.log(' ', f, (fs.statSync(src).size/1024).toFixed(0) + ' KB');
}
console.log('OK  sync → gas/');
