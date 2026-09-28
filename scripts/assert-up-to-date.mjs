/**
 * Bloqueia a publicação se a cópia local não contém o master mais recente do GitHub.
 *
 * Causa comum: a publicação anterior altera package.json (versão) e os HTML gerados;
 * o `git pull` seguinte recusa sobrescrevê-los e para com erro, e o `npm run push`
 * publicaria o código antigo com um número de versão novo.
 *
 * Uso: node scripts/assert-up-to-date.mjs   (roda no início de npm run push)
 * Pular (não recomendado): NEXUS_SKIP_UPDATE_CHECK=1
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (args) => execSync('git ' + args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

if (process.env.NEXUS_SKIP_UPDATE_CHECK === '1') {
  console.warn('AVISO: conferência de atualização pulada (NEXUS_SKIP_UPDATE_CHECK=1).');
  process.exit(0);
}

try {
  git('rev-parse --is-inside-work-tree');
} catch {
  console.warn('AVISO: pasta fora do git; não dá para conferir se o código está atualizado.');
  process.exit(0);
}

try {
  git('fetch origin master --quiet');
} catch {
  console.warn('AVISO: não consegui consultar o GitHub (sem internet?). Publicando sem conferir se a cópia está atualizada.');
  process.exit(0);
}

const upstream = git('rev-parse origin/master');
let upToDate = true;
try {
  git(`merge-base --is-ancestor ${upstream} HEAD`);
} catch {
  upToDate = false;
}

if (!upToDate) {
  let branch = '';
  try { branch = git('rev-parse --abbrev-ref HEAD'); } catch { /* ignore */ }
  const lines = [
    '',
    'ERRO: sua cópia do projeto está desatualizada em relação ao GitHub.',
    'A publicação foi cancelada para não enviar a versão antiga ao Apps Script.',
    '',
    'Rode, nesta ordem:',
    '  git stash',
    ...(branch && branch !== 'master' ? ['  git checkout master'] : []),
    '  git pull origin master',
    '  npm run push',
    '',
    '(git stash guarda as alterações automáticas da publicação anterior: número de versão e arquivos gerados.)',
    ''
  ];
  console.error(lines.join('\n'));
  process.exit(1);
}

console.log(`OK  cópia local em dia com o GitHub (master ${upstream.slice(0, 7)})`);
