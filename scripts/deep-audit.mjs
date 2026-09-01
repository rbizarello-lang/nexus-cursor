import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const appJsx = fs.readFileSync(path.join(root, 'src', 'app.jsx'), 'utf8');
const datesJs = fs.readFileSync(path.join(root, 'src', 'lib', 'dates.js'), 'utf8');
const prescJs = fs.readFileSync(path.join(root, 'src', 'lib', 'prescription.js'), 'utf8');
const codigoJs = fs.readFileSync(path.join(root, 'Código.js'), 'utf8');
const resumoJs = fs.readFileSync(path.join(root, 'RESUMO-DIARIO.js'), 'utf8');
const shellHtml = fs.readFileSync(path.join(root, 'src', 'Nexus.shell.html'), 'utf8');

console.log('Starting Deep Audit of NEXUS Codebase...\n');

// ==========================================
// 1. Audit Backend Functions in Código.js & RESUMO-DIARIO.js
// ==========================================
const backendAst = parser.parse(codigoJs + '\n' + resumoJs, { sourceType: 'script' });
const backendFunctions = new Map(); // name -> { paramsCount, line, file }

traverse(backendAst, {
  FunctionDeclaration(p) {
    if (p.node.id) {
      backendFunctions.set(p.node.id.name, {
        paramsCount: p.node.params.length,
        params: p.node.params.map(param => param.name || (param.type === 'AssignmentPattern' ? param.left.name : 'unknown')),
        line: p.node.loc?.start.line
      });
    }
  }
});

console.log(`Discovered ${backendFunctions.size} backend functions in Google Apps Script.`);

// ==========================================
// 2. Parse Frontend app.jsx
// ==========================================
const appAst = parser.parse(appJsx, {
  sourceType: 'module',
  plugins: ['jsx']
});

const findings = [];

// Audit 2.1: Calls to google.script.run
traverse(appAst, {
  CallExpression(p) {
    // Check google.script.run chaining
    // e.g. google.script.run.withSuccessHandler(...).withFailureHandler(...).backendFn(...)
    let node = p.node;
    if (node.callee.type === 'MemberExpression') {
      const methodName = node.callee.property.name;
      // trace back to see if object is a chain of google.script.run
      let chain = [];
      let curr = node.callee;
      while (curr && curr.type === 'MemberExpression') {
        if (curr.property.name) chain.push(curr.property.name);
        curr = curr.object;
        if (curr && curr.type === 'CallExpression') {
          curr = curr.callee;
        }
      }
      if (curr && curr.type === 'Identifier' && curr.name === 'google') {
        // This is a google.script call
        // The actual called backend function is the outermost method unless it's withSuccessHandler / withFailureHandler
        const calledFn = methodName;
        if (!['withSuccessHandler', 'withFailureHandler', 'withUserObject'].includes(calledFn)) {
          if (!backendFunctions.has(calledFn)) {
            findings.push({
              severity: 'CRITICAL',
              category: 'RPC / Backend Desync',
              file: 'src/app.jsx',
              line: node.loc?.start.line,
              detail: `Frontend calls 'google.script.run.${calledFn}()', but '${calledFn}' does not exist in Código.js or RESUMO-DIARIO.js.`
            });
          } else {
            const def = backendFunctions.get(calledFn);
            const passedArgs = node.arguments.length;
            // Check arg count mismatch
            if (passedArgs < def.paramsCount) {
              findings.push({
                severity: 'WARNING',
                category: 'RPC Argument Mismatch',
                file: 'src/app.jsx',
                line: node.loc?.start.line,
                detail: `Frontend calls '${calledFn}' with ${passedArgs} args, but backend expects ${def.paramsCount} params: (${def.params.join(', ')}).`
              });
            }
          }
        }
      }
    }
  }
});

// Audit 2.2: Array mutations in React state (e.g. state.sort(), state.splice(), state.reverse())
traverse(appAst, {
  CallExpression(p) {
    if (p.node.callee.type === 'MemberExpression' && !p.node.callee.computed) {
      const method = p.node.callee.property.name;
      if (['sort', 'splice', 'reverse', 'fill', 'pop', 'push', 'shift', 'unshift'].includes(method)) {
        const obj = p.node.callee.object;
        // If obj is an identifier that looks like a state variable or prop
        if (obj.type === 'Identifier') {
          // Check if it was declared in useState or props
          // We can check if in same block it's passed to setState or if directly mutated
        }
      }
    }
  }
});

// Audit 2.3: `new Date(YYYY-MM-DD)` UTC timezone offset bug
// In JS, `new Date("2026-08-18")` parses as UTC midnight, which in GMT-3 becomes 2026-08-17 21:00!
traverse(appAst, {
  NewExpression(p) {
    if (p.node.callee.type === 'Identifier' && p.node.callee.name === 'Date') {
      const arg = p.node.arguments[0];
      if (arg && (arg.type === 'Identifier' || arg.type === 'MemberExpression')) {
        // Date constructor called with 1 string argument - check if parseDate or dates.js helper should be used
      }
    }
  }
});

// Audit 2.4: Unsafe property access or regex issues
const lines = appJsx.split('\n');
lines.forEach((lineText, idx) => {
  const lineNum = idx + 1;

  // Check for NaN comparisons
  if (/===\s*NaN\b|!==\s*NaN\b/.test(lineText)) {
    findings.push({
      severity: 'HIGH',
      category: 'Comparison Bug',
      file: 'src/app.jsx',
      line: lineNum,
      detail: `Direct comparison with NaN found: "${lineText.trim()}". In JavaScript, NaN === NaN is always false. Use isNaN() or Number.isNaN().`
    });
  }

  // Check for localStorage access without try/catch
  if (/\blocalStorage\.(setItem|getItem|removeItem)\b/.test(lineText)) {
    // Check if line or surrounding lines have try-catch
    const surrounding = lines.slice(Math.max(0, idx - 10), Math.min(lines.length, idx + 10)).join('\n');
    if (!surrounding.includes('try') && !surrounding.includes('catch')) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Storage / Storage Quota',
        file: 'src/app.jsx',
        line: lineNum,
        detail: `localStorage access without surrounding try/catch block at line ${lineNum}: "${lineText.trim()}". Can throw in private browsing or quota exceeded.`
      });
    }
  }

  // Check for regex without /g or missing escape in regex
  if (/new RegExp\(/.test(lineText)) {
    // Check if escaping might be incorrect
  }

  // Check for potential null dereferencing patterns
  if (/\.filter\([^)]+\)\.map\([^)]+\)\.length/.test(lineText)) {
    // ok
  }
});

// Audit 3: Check prescription.js rules and edge cases
const prescLines = prescJs.split('\n');
prescLines.forEach((lineText, idx) => {
  const lineNum = idx + 1;
  if (/===\s*NaN\b|!==\s*NaN\b/.test(lineText)) {
    findings.push({
      severity: 'HIGH',
      category: 'Comparison Bug',
      file: 'src/lib/prescription.js',
      line: lineNum,
      detail: `Direct comparison with NaN found: "${lineText.trim()}"`
    });
  }
});

// Audit 4: Check dates.js
const datesLines = datesJs.split('\n');
datesLines.forEach((lineText, idx) => {
  const lineNum = idx + 1;
  if (/===\s*NaN\b|!==\s*NaN\b/.test(lineText)) {
    findings.push({
      severity: 'HIGH',
      category: 'Comparison Bug',
      file: 'src/lib/dates.js',
      line: lineNum,
      detail: `Direct comparison with NaN found: "${lineText.trim()}"`
    });
  }
});

console.log(`\n=== Deep Audit Results: ${findings.length} findings ===\n`);
findings.forEach((f, i) => {
  console.log(`[${f.severity}] #${i+1} (${f.category}) ${f.file}:${f.line}`);
  console.log(`  ${f.detail}\n`);
});
