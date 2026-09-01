import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const jsxPath = path.join(root, 'src', 'app.jsx');
const datesPath = path.join(root, 'src', 'lib', 'dates.js');
const prescPath = path.join(root, 'src', 'lib', 'prescription.js');

function unwrapModule(src) {
  return src
    .replace(/^import\s+[^;]+;\s*$/gm, '')
    .replace(/^export\s+/gm, '');
}

const bundledAppJsx = [
  '/* --- src/lib/dates.js --- */',
  unwrapModule(fs.readFileSync(datesPath, 'utf8')),
  '/* --- src/lib/prescription.js --- */',
  unwrapModule(fs.readFileSync(prescPath, 'utf8')),
  '/* --- src/app.jsx --- */',
  fs.readFileSync(jsxPath, 'utf8'),
].join('\n');

const browserGlobals = new Set([
  'window', 'document', 'navigator', 'console', 'localStorage', 'sessionStorage',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'fetch', 'Blob', 'File', 'FileReader', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response',
  'alert', 'confirm', 'prompt', 'open', 'close', 'location', 'history', 'customElements',
  'Math', 'Date', 'JSON', 'RegExp', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Set', 'Map', 'WeakMap', 'WeakSet',
  'Promise', 'Symbol', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'btoa', 'atob', 'TextEncoder', 'TextDecoder', 'Intl', 'Infinity', 'NaN', 'undefined', 'ArrayBuffer', 'Uint8Array',
  'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Float32Array', 'Float64Array', 'DataView',
  'crypto', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'React', 'ReactDOM', 'XLSX', 'LZString', 'pdfjsLib', 'google', 'HtmlService', 'SpreadsheetApp', 'DriveApp', 'MailApp',
  'Utilities', 'Session', 'ScriptApp', 'PropertiesService', 'Logger', 'ContentService', 'LockService', 'CacheService',
  '__NEXUS_BUILD__', '__NEXUS_VERSION__', '__NEXUS_DEMO__', 'process', 'global', 'globalThis',
  // Lucide / Icons globals or libraries if loaded in shell
  'lucide'
]);

function analyzeBundle(code, label) {
  console.log(`\n=================== Analyzing ${label} ===================`);
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (e) {
    console.error(`Syntax error in ${label}:`, e.message, 'at line', e.loc?.line, 'col', e.loc?.column);
    return { issues: [], googleScriptCalls: new Set() };
  }

  const issues = [];
  const googleScriptCalls = new Set();

  traverse(ast, {
    // Check undefined references
    Identifier(p) {
      if (p.isReferencedIdentifier()) {
        const name = p.node.name;
        if (!p.scope.hasBinding(name) && !browserGlobals.has(name)) {
          // Ignore property keys or member expressions where identifier is property
          if (p.parentPath.isMemberExpression() && p.parentPath.node.property === p.node && !p.parentPath.node.computed) {
            return;
          }
          issues.push({
            type: 'UNDEFINED_VARIABLE',
            line: p.node.loc?.start.line,
            message: `Undefined identifier "${name}"`
          });
        }
      }
    },
    // Check google.script.run calls
    MemberExpression(p) {
      // google.script.run.something()
      if (p.node.object?.type === 'MemberExpression' &&
          p.node.object.object?.type === 'Identifier' && p.node.object.object.name === 'google' &&
          p.node.object.property?.type === 'Identifier' && p.node.object.property.name === 'script') {
        // google.script.run
        if (p.node.property?.type === 'Identifier') {
          googleScriptCalls.add(p.node.property.name);
        }
      }
    },
    // Check JSON.parse without try-catch
    CallExpression(p) {
      if (p.node.callee.type === 'MemberExpression' &&
          p.node.callee.object?.type === 'Identifier' && p.node.callee.object.name === 'JSON' &&
          p.node.callee.property?.type === 'Identifier' && p.node.callee.property.name === 'parse') {
        let insideTry = false;
        let curr = p.parentPath;
        while (curr) {
          if (curr.isTryStatement()) {
            insideTry = true;
            break;
          }
          curr = curr.parentPath;
        }
        if (!insideTry) {
          issues.push({
            type: 'UNSAFE_JSON_PARSE',
            line: p.node.loc?.start.line,
            message: `JSON.parse called outside of try-catch block`
          });
        }
      }

      // Check useEffect missing cleanup for setInterval or addEventListener
      if (p.node.callee.type === 'Identifier' && p.node.callee.name === 'useEffect') {
        // Look inside the effect callback
        const arg = p.node.arguments[0];
        if (arg && (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression')) {
          let hasTimerOrListener = false;
          let hasCleanup = false;
          // Check if returns a function
          if (arg.body.type === 'BlockStatement') {
            for (const stmt of arg.body.body) {
              if (stmt.type === 'ReturnStatement' && (stmt.argument?.type === 'ArrowFunctionExpression' || stmt.argument?.type === 'FunctionExpression' || stmt.argument?.type === 'Identifier')) {
                hasCleanup = true;
              }
            }
          }
          // We can inspect if setInterval is called inside
        }
      }
    },
    // Check duplicate keys
    ObjectExpression(p) {
      const seen = new Set();
      for (const prop of p.node.properties) {
        if (prop.type === 'ObjectProperty') {
          let key = null;
          if (prop.key.type === 'Identifier' && !prop.computed) key = prop.key.name;
          else if (prop.key.type === 'StringLiteral') key = prop.key.value;
          if (key) {
            if (seen.has(key)) {
              issues.push({ type: 'DUPLICATE_KEY', line: prop.loc?.start.line, message: `Duplicate object key "${key}" in object literal` });
            }
            seen.add(key);
          }
        }
      }
    }
  });

  console.log(`Found ${issues.length} potential issues in ${label}`);
  for (const iss of issues) {
    console.log(`  [${iss.type}] L${iss.line}: ${iss.message}`);
  }
  return { issues, googleScriptCalls };
}

function analyzeAppsScript(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=================== Analyzing Apps Script ${path.basename(filePath)} ===================`);
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'script',
      plugins: []
    });
  } catch (e) {
    console.error(`Syntax error in ${filePath}:`, e.message);
    return { declaredFunctions: new Set(), issues: [] };
  }

  const declaredFunctions = new Set();
  const issues = [];

  traverse(ast, {
    FunctionDeclaration(p) {
      if (p.node.id) declaredFunctions.add(p.node.id.name);
    },
    Identifier(p) {
      if (p.isReferencedIdentifier()) {
        const name = p.node.name;
        if (!p.scope.hasBinding(name) && !browserGlobals.has(name)) {
          if (p.parentPath.isMemberExpression() && p.parentPath.node.property === p.node && !p.parentPath.node.computed) {
            return;
          }
          issues.push({
            type: 'APPS_SCRIPT_UNDEFINED_VAR',
            line: p.node.loc?.start.line,
            message: `Undefined identifier in Apps Script: "${name}"`
          });
        }
      }
    }
  });

  console.log(`Declared functions in ${path.basename(filePath)}:`, [...declaredFunctions].length);
  console.log(`Issues in ${path.basename(filePath)}:`, issues.length);
  for (const iss of issues) {
    console.log(`  [${iss.type}] L${iss.line}: ${iss.message}`);
  }
  return { declaredFunctions, issues };
}

const bundleResult = analyzeBundle(bundledAppJsx, 'Bundled Frontend App');
const codigoResult = analyzeAppsScript(path.join(root, 'Código.js'));
const resumoResult = analyzeAppsScript(path.join(root, 'RESUMO-DIARIO.js'));

// Compare frontend google.script.run calls with backend declared functions
console.log('\n=================== Verifying google.script.run vs backend ===================');
const allBackendFunctions = new Set([...codigoResult.declaredFunctions, ...resumoResult.declaredFunctions]);
// Note: withSuccessHandler and withFailureHandler are chained methods on google.script.run
for (const fn of bundleResult.googleScriptCalls) {
  if (['withSuccessHandler', 'withFailureHandler', 'withUserObject'].includes(fn)) continue;
  if (!allBackendFunctions.has(fn)) {
    console.log(`⚠️ Frontend calls google.script.run.${fn}(), but function "${fn}" is NOT declared in Código.js or RESUMO-DIARIO.js!`);
  } else {
    console.log(`✓ google.script.run.${fn}() exists in backend`);
  }
}
