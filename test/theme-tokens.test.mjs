import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CX_THEMES } from '../src/lib/themes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shell = fs.readFileSync(path.join(root, 'src', 'Nexus.shell.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Corpo `{ ... }` do primeiro bloco cujo seletor é exatamente `selector` (sem aninhamento nos blocos de tokens). */
export function ruleBody(selector) {
  const re = new RegExp('(^|\\n)' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = re.exec(shell);
  assert.ok(m, 'bloco não encontrado: ' + selector);
  return m[2];
}
export function tokens(body) {
  const map = new Map();
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) map.set(m[1], m[2].trim());
  return map;
}

// Tokens que não são cor: fontes, escala tipográfica (--cx-fs-*) e dimensões ficam no bloco base e valem para qualquer tema.
const NOT_COLOUR = new Set(['--cx-font', '--cx-mono', '--cx-ctl-h', '--cx-sbw', '--font-display', '--font-ui', '--font-body', '--font-mono']);

const ardosia = tokens(ruleBody('.app-layout.edition-claude'));
const darkKeys = CX_THEMES.filter(t => t.scheme === 'dark').map(t => t.key);

describe('tokens dos temas escuros do Prumo', () => {
  it('o bloco Ardósia tem os tokens esperados (sanidade do parser)', () => {
    assert.ok(ardosia.has('--cx-ground') && ardosia.has('--bg-deep') && ardosia.has('--cx-on-solid'));
    assert.ok([...ardosia.keys()].filter(k => k.startsWith('--cx-')).length > 40);
  });
  it('há um bloco por tema escuro do registro', () => {
    assert.deepEqual(darkKeys, ['noite', 'grafite']);
    for (const k of darkKeys) assert.ok(tokens(ruleBody('.app-layout.edition-claude.cx-theme-' + k)).size > 40, k);
  });
  for (const k of darkKeys) {
    describe('tema ' + k, () => {
      const dark = tokens(ruleBody('.app-layout.edition-claude.cx-theme-' + k));
      it('redefine todos os tokens de cor do Ardósia (--cx-* e clássicos)', () => {
        const missing = [...ardosia.keys()].filter(t => !NOT_COLOUR.has(t) && !t.startsWith('--cx-fs-') && !dark.has(t));
        assert.deepEqual(missing, []);
      });
      it('declara color-scheme: dark', () => {
        assert.match(ruleBody('.app-layout.edition-claude.cx-theme-' + k), /color-scheme:\s*dark\s*;/);
      });
      it('não mexe em fontes nem dimensões', () => {
        for (const t of NOT_COLOUR) assert.ok(!dark.has(t), t);
        for (const t of dark.keys()) assert.ok(!t.startsWith('--cx-fs-'), t);
      });
      it('tokens clássicos apontam para cx-* (ou para uma cor própria, nunca para o valor claro do Ardósia)', () => {
        for (const t of ['--bg-deep', '--bg-card', '--text-primary', '--text-secondary', '--text-muted', '--border', '--red', '--red-dim']) {
          assert.match(dark.get(t), /^var\(--cx-/, t);
        }
      });
    });
  }
});
