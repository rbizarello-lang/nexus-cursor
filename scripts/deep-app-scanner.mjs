import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJsx = fs.readFileSync(path.join(root, 'src', 'app.jsx'), 'utf8');

const ast = parser.parse(appJsx, {
  sourceType: 'module',
  plugins: ['jsx']
});

const issues = [];

// 1. Check for mutating array methods directly on state or props: .sort(), .reverse(), .splice()
traverse(ast, {
  CallExpression(p) {
    if (p.node.callee.type === 'MemberExpression' && !p.node.callee.computed) {
      const method = p.node.callee.property.name;
      if (['sort', 'reverse'].includes(method)) {
        const obj = p.node.callee.object;
        // If obj is not an array literal [...] or slice() or Array.from or [...x]
        const isSafe = (
          obj.type === 'ArrayExpression' ||
          (obj.type === 'CallExpression' && obj.callee.type === 'MemberExpression' && ['slice', 'filter', 'map', 'concat', 'toSorted', 'toReversed'].includes(obj.callee.property.name)) ||
          (obj.type === 'CallExpression' && obj.callee.type === 'MemberExpression' && obj.callee.object.name === 'Array' && obj.callee.property.name === 'from')
        );
        if (!isSafe) {
          // If inside a component or function, it might mutate props/state in-place
          issues.push({
            type: 'ARRAY_MUTATION_IN_PLACE',
            line: p.node.loc?.start.line,
            detail: `.${method}() called directly on potentially immutable or state object: check if mutating state in place.`
          });
        }
      }
    }
  }
});

// 2. Check for form inputs where checkbox uses e.target.value instead of e.target.checked
traverse(ast, {
  JSXElement(p) {
    const opening = p.node.openingElement;
    if (opening.name.name === 'input') {
      let isCheckbox = false;
      let onChangeAttr = null;
      for (const attr of opening.attributes) {
        if (attr.type === 'JSXAttribute') {
          if (attr.name.name === 'type' && attr.value?.value === 'checkbox') {
            isCheckbox = true;
          }
          if (attr.name.name === 'onChange') {
            onChangeAttr = attr;
          }
        }
      }
      if (isCheckbox && onChangeAttr) {
        // Inspect onChange body for e.target.value
        // Traverse JSX attribute
        const attrCode = appJsx.slice(onChangeAttr.start, onChangeAttr.end);
        if (attrCode.includes('.target.value') && !attrCode.includes('.target.checked')) {
          issues.push({
            type: 'CHECKBOX_TARGET_VALUE_BUG',
            line: onChangeAttr.loc?.start.line,
            detail: `Checkbox input uses e.target.value instead of e.target.checked: ${attrCode}`
          });
        }
      }
    }
  }
});

// 3. Check for select dropdowns or radio buttons without onChange or readOnly
traverse(ast, {
  JSXElement(p) {
    const name = p.node.openingElement.name.name;
    if (['input', 'select', 'textarea'].includes(name)) {
      let hasValue = false;
      let hasOnChange = false;
      let hasReadOnly = false;
      let hasDisabled = false;
      let isCheckboxOrRadio = false;
      for (const attr of p.node.openingElement.attributes) {
        if (attr.type === 'JSXAttribute') {
          if (attr.name.name === 'value') hasValue = true;
          if (attr.name.name === 'onChange') hasOnChange = true;
          if (attr.name.name === 'readOnly') hasReadOnly = true;
          if (attr.name.name === 'disabled') hasDisabled = true;
          if (attr.name.name === 'type' && ['checkbox', 'radio', 'button', 'submit', 'file'].includes(attr.value?.value)) isCheckboxOrRadio = true;
        }
      }
      if (hasValue && !hasOnChange && !hasReadOnly && !hasDisabled && !isCheckboxOrRadio) {
        issues.push({
          type: 'CONTROLLED_INPUT_NO_ONCHANGE',
          line: p.node.loc?.start.line,
          detail: `<${name} value={...}> has value prop but no onChange or readOnly handler (React controlled component lock).`
        });
      }
    }
  }
});

// 4. Check for unhandled Promise / async functions in useEffect
traverse(ast, {
  CallExpression(p) {
    if (p.node.callee.type === 'Identifier' && p.node.callee.name === 'useEffect') {
      const arg = p.node.arguments[0];
      if (arg && arg.async) {
        issues.push({
          type: 'ASYNC_USE_EFFECT',
          line: p.node.loc?.start.line,
          detail: `useEffect callback cannot be async directly because it must return a cleanup function or undefined (returns Promise instead).`
        });
      }
    }
  }
});

console.log(`Scan completed. Found ${issues.length} potential issues:\n`);
issues.forEach((iss, i) => {
  console.log(`[${iss.type}] #${i+1} at Line ${iss.line}: ${iss.detail}`);
});
