import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJsx = fs.readFileSync(path.join(root, 'src', 'app.jsx'), 'utf8');

console.log('Searching for unguarded JSON.parse in src/app.jsx...');
const lines = appJsx.split('\n');
lines.forEach((l, i) => {
  if (l.includes('JSON.parse')) {
    const surrounding = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)).join('\n');
    if (!surrounding.includes('try') && !surrounding.includes('catch')) {
      console.log(`Unguarded JSON.parse at line ${i+1}: ${l.trim()}`);
    }
  }
});

console.log('\nSearching for unsafe match index access ([1] on match) in src/app.jsx...');
lines.forEach((l, i) => {
  // Check pattern: .match(...)[1] without optional chaining .match(...) ?.[1]
  if (/\.match\([^)]+\)\[\d+\]/.test(l)) {
    console.log(`Unsafe match index access at line ${i+1}: ${l.trim()}`);
  }
});

console.log('\nSearching for undefined variable typos in src/app.jsx event handlers...');
// Check for pattern: setX(x => ...) or onClick={() => ...} where typos might exist
