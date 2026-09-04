import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJsx = fs.readFileSync(path.join(root, 'src', 'app.jsx'), 'utf8');
const datesJs = fs.readFileSync(path.join(root, 'src', 'lib', 'dates.js'), 'utf8');
const prescJs = fs.readFileSync(path.join(root, 'src', 'lib', 'prescription.js'), 'utf8');
const codigoJs = fs.readFileSync(path.join(root, 'Código.js'), 'utf8');
const resumoJs = fs.readFileSync(path.join(root, 'RESUMO-DIARIO.js'), 'utf8');

const bugReport = [];

// Helper to record a bug
function addBug(category, file, line, title, description, recommendation) {
  bugReport.push({ category, file, line, title, description, recommendation });
}

// 1. Check Date construction with date strings like YYYY-MM-DD
// In JS: `new Date("2026-08-19")` creates UTC midnight. In GMT-3, `d.getDate()` or `d.getDay()` will be previous day!
// But `new Date("2026-08-19T00:00:00")` creates local time.
// Let's check where `new Date(string)` is used directly without 'T00:00:00'
const dateWithoutTimeRegex = /new\s+Date\(\s*([a-zA-Z0-9_$.]+(?:\.date|\.data|Date|Deadline|Sent|Ajuizamento|Inscricao|At))\s*\)/g;
let match;
const lines = appJsx.split('\n');
lines.forEach((lineText, idx) => {
  const line = idx + 1;

  // 1. Direct date subtraction with string YYYY-MM-DD
  // e.g. new Date(a.dateDeadline) - new Date(b.dateDeadline) -> if date is "2026-08-18", new Date("2026-08-18") is UTC.
  // In comparisons (a - b) UTC vs UTC is ok, but if compared with local `now` or `new Date()`, it can be off by 3 hours!
  if (/new Date\([^)]+\)\s*<\s*now\b/.test(lineText) && !lineText.includes('T00:00:00')) {
    addBug(
      'Timezone / Data',
      'src/app.jsx',
      line,
      'Comparação de data UTC com data local sem T00:00:00',
      `Linha ${line}: ${lineText.trim()}\nAo criar 'new Date(dataStr)' sem 'T00:00:00', o JavaScript interpreta "YYYY-MM-DD" como UTC meia-noite (no fuso de Brasília GMT-3 isso vira 21:00 do dia anterior).`,
      `Usar 'new Date(dataStr + "T00:00:00")' ou o helper 'daysUntil(dataStr) < 0' para evitar desvio de fuso horário.`
    );
  }

  // 2. LocalStorage without try-catch
  if (/localStorage\.(setItem|getItem|removeItem)\(/.test(lineText)) {
    const surrounding = lines.slice(Math.max(0, idx - 8), Math.min(lines.length, idx + 8)).join('\n');
    if (!surrounding.includes('try') && !surrounding.includes('catch')) {
      addBug(
        'Armazenamento / Exceção Não Tratada',
        'src/app.jsx',
        line,
        'Acesso a localStorage sem bloco try/catch',
        `Linha ${line}: ${lineText.trim()}\nSe o usuário estiver em navegação privada (com cookies bloqueados) ou se a cota do localStorage for excedida (comum no Safari/Chrome quando próximo de 5MB), 'localStorage.setItem' lança uma exceção que derruba o app React se não houver try/catch.`,
        `Envolver em helper seguro 'safeGetItem' / 'safeSetItem' ou bloco try-catch.`
      );
    }
  }

  // 3. Potential undefined map/filter on nullable arrays
  // Check patterns like `(item.someArray).map(...)` where someArray might be undefined
  if (/\b([a-zA-Z0-9_]+)\.(events|cdas|links|executions|debts|people|assets|tasks|briefings)\.(map|filter|forEach|reduce|some|every)\b/.test(lineText)) {
    // Check if optional chaining or || [] is missing
    const m = lineText.match(/\b([a-zA-Z0-9_]+)\.(events|cdas|links|executions|debts|people|assets|tasks|briefings)\.(map|filter|forEach|reduce|some|every)\b/);
    if (m && !lineText.includes(m[1] + '?.' + m[2]) && !lineText.includes('(' + m[1] + '.' + m[2] + ' || [])')) {
      // Check if guarded in previous lines or not
    }
  }
});

// Check dates.js regex issues
const datesLines = datesJs.split('\n');
datesLines.forEach((lineText, idx) => {
  const line = idx + 1;
  if (/parseAnyDate/.test(lineText) || idx < 25) {
    if (lineText.includes('s.match(/(\\d{4})-(\\d{1,2})-(\\d{1,2})/)')) {
      addBug(
        'Parser de Data / Falso Positivo',
        'src/lib/dates.js',
        line,
        'Expressão regular de data ISO sem âncora de início/fim',
        `Linha ${line}: 's.match(/(\\d{4})-(\\d{1,2})-(\\d{1,2})/)'. Se uma string contiver números como número de processo ou documento (ex: '5001234-12-2020'), ela casa indevidamente com '1234-12-20' e converte para data inexistente ou corrompida. Além disso, meses > 12 ou dias > 31 não são validados.`,
        `Adicionar âncora/limite de palavra '^\\s*(\\d{4})-(\\d{1,2})-(\\d{1,2})' ou validar valores numéricos (ano 1900-2100, mês 1-12, dia 1-31).`
      );
    }
  }
});

console.log(`Found ${bugReport.length} specific issues in initial sweep.`);
for (const b of bugReport) {
  console.log(`\n[${b.category}] ${b.file}:${b.line} - ${b.title}`);
  console.log(`  Descrição: ${b.description}`);
  console.log(`  Recomendação: ${b.recommendation}`);
}
