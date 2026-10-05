import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CX_THEMES } from '../src/lib/themes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shell = fs.readFileSync(path.join(root, 'src', 'Nexus.shell.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function themeTokens(key) {
  const sel = '.app-layout.edition-claude.cx-theme-' + key;
  const i = shell.indexOf('\n' + sel + ' {');
  assert.ok(i >= 0, 'bloco não encontrado: ' + sel);
  const body = shell.slice(shell.indexOf('{', i) + 1, shell.indexOf('}', i));
  const map = {};
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) map[m[1]] = m[2].trim();
  return map;
}
const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
function lum(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  assert.ok(m, 'cor opaca em hex esperada: ' + hex);
  const n = parseInt(m[1], 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export function contrast(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('contraste WCAG dos temas escuros', () => {
  it('a calculadora confere com valores conhecidos', () => {
    assert.ok(Math.abs(contrast('#000000', '#ffffff') - 21) < 1e-9);
    assert.ok(Math.abs(contrast('#777777', '#ffffff') - 4.48) < 0.01);
  });
  for (const t of CX_THEMES.filter(x => x.scheme === 'dark')) {
    const v = themeTokens(t.key);
    const need = (name, min, bg) => assert.ok(contrast(v[name], v[bg]) >= min, `${t.key}: ${name} ${v[name]} sobre ${bg} ${v[bg]} = ${contrast(v[name], v[bg]).toFixed(2)} (mín. ${min})`);
    describe(t.label, () => {
      it('ink >= 12 sobre surface e ground', () => { need('--cx-ink', 12, '--cx-surface'); need('--cx-ink', 12, '--cx-ground'); });
      it('ink-2 >= 7 sobre surface e ground', () => { need('--cx-ink-2', 7, '--cx-surface'); need('--cx-ink-2', 7, '--cx-ground'); });
      it('ink-3 >= 4.5 sobre surface e ground', () => { need('--cx-ink-3', 4.5, '--cx-surface'); need('--cx-ink-3', 4.5, '--cx-ground'); });
      it('cores de status >= 4.5 sobre surface', () => {
        for (const c of ['red', 'orange', 'yellow', 'blue', 'green', 'violet', 'cyan']) need('--cx-' + c, 4.5, '--cx-surface');
      });
      it('texto do botão primário >= 4.5 sobre o botão', () => { need('--cx-btn-ink', 4.5, '--cx-btn'); need('--cx-btn-ink', 4.5, '--cx-btn-hover'); });
      it('texto sobre preenchimento sólido (on-solid) >= 4.5 sobre vermelho, accent, azul e verde', () => {
        for (const c of ['--cx-red', '--cx-accent', '--cx-blue', '--cx-green']) need('--cx-on-solid', 4.5, c);
      });
    });
  }
});
