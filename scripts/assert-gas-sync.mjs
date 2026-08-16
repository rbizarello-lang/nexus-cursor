/**
 * Bloqueia clasp push se gas/ estiver dessincronizado da origem.
 * O clasp usa rootDir: gas — um push direto publica o que estiver lá,
 * mesmo que Nexus.html / Código.js / RESUMO-DIARIO.js na raiz sejam mais novos.
 *
 * Uso: node scripts/assert-gas-sync.mjs
 *      npm run push:check
 *      npm run clasp:push
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = path.join(root, 'gas');
const files = ['Nexus.html', 'Código.js', 'RESUMO-DIARIO.js', 'appsscript.json'];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

if (!fs.existsSync(gas)) {
  console.error('ERRO: pasta gas/ não existe. Rode npm run push (ele sincroniza e publica).');
  console.error('Não use clasp push direto.');
  process.exit(1);
}

let diverged = false;
for (const name of files) {
  const src = path.join(root, name);
  const dst = path.join(gas, name);
  if (!fs.existsSync(src)) {
    console.error('ERRO: falta na origem:', name);
    diverged = true;
    continue;
  }
  if (!fs.existsSync(dst)) {
    console.error('ERRO: falta em gas/:', name, '— rode node scripts/sync-gas.mjs');
    diverged = true;
    continue;
  }
  const a = sha256(src);
  const b = sha256(dst);
  if (a !== b) {
    const srcStat = fs.statSync(src);
    const dstStat = fs.statSync(dst);
    console.error('DIVERGE:', name);
    console.error('  origem', (srcStat.size / 1024).toFixed(0) + ' KB  ' + srcStat.mtime.toISOString());
    console.error('  gas/   ', (dstStat.size / 1024).toFixed(0) + ' KB  ' + dstStat.mtime.toISOString());
    diverged = true;
  } else {
    console.log('OK ', name);
  }
}

if (diverged) {
  console.error('');
  console.error('Publicação bloqueada: gas/ não é cópia da origem.');
  console.error('Use:  npm run push');
  console.error('Não use clasp push direto — publica arquivos velhos.');
  process.exit(1);
}

console.log('gas/ sincronizado — pode publicar.');
