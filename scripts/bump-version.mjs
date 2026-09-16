/**
 * Incrementa a versão semver em package.json.
 * Uso: node scripts/bump-version.mjs [patch|minor|major]
 * Default: patch (1.1.2 → 1.1.3)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = path.join(root, 'package.json');
const level = (process.argv[2] || 'patch').toLowerCase();
if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('Uso: node scripts/bump-version.mjs [patch|minor|major]');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const parts = String(pkg.version || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
while (parts.length < 3) parts.push(0);
let [major, minor, patch] = parts;
if (level === 'major') { major += 1; minor = 0; patch = 0; }
else if (level === 'minor') { minor += 1; patch = 0; }
else { patch += 1; }
const next = `${major}.${minor}.${patch}`;
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`OK  versão ${parts.join('.')} → ${next} (${level})`);
