import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CX_THEMES, cxThemeKey, cxThemeClass, cxMapOpColor } from '../src/lib/themes.js';

describe('themes', () => {
  it('registry has Ardósia first, with empty key, plus two dark themes', () => {
    assert.equal(CX_THEMES[0].key, '');
    assert.equal(CX_THEMES[0].scheme, 'light');
    assert.deepEqual(CX_THEMES.slice(1).map(t => t.key), ['noite', 'grafite']);
    assert.ok(CX_THEMES.slice(1).every(t => t.scheme === 'dark'));
  });
  it('keys are unique', () => {
    assert.equal(new Set(CX_THEMES.map(t => t.key)).size, CX_THEMES.length);
  });
  it('cxThemeKey keeps known keys and falls back to empty', () => {
    assert.equal(cxThemeKey('noite'), 'noite');
    assert.equal(cxThemeKey('grafite'), 'grafite');
    assert.equal(cxThemeKey(''), '');
    for (const bad of ['nope', 'NOITE', undefined, null, 3, {}, [], 'cx-theme-noite']) assert.equal(cxThemeKey(bad), '');
  });
  it('cxThemeClass maps keys to classes', () => {
    assert.equal(cxThemeClass(''), '');
    assert.equal(cxThemeClass('noite'), 'cx-theme-noite');
    assert.equal(cxThemeClass('grafite'), 'cx-theme-grafite');
    assert.equal(cxThemeClass('bogus'), '');
    assert.equal(cxThemeClass(undefined), '');
  });
  it('cxMapOpColor mapeia as 5 amostras de op.color para os tokens de situação', () => {
    assert.equal(cxMapOpColor('#c2323d'), 'var(--cx-opc-maxima)');
    assert.equal(cxMapOpColor('#e0707a'), 'var(--cx-opc-alta)');
    assert.equal(cxMapOpColor('#c99a1a'), 'var(--cx-opc-media)');
    assert.equal(cxMapOpColor('#21845a'), 'var(--cx-opc-baixa)');
    assert.equal(cxMapOpColor('#2d62d3'), 'var(--cx-opc-parcel)');
    assert.equal(cxMapOpColor('#2D62D3'), 'var(--cx-opc-parcel)');
    assert.equal(cxMapOpColor(' #2d62d3 '), 'var(--cx-opc-parcel)');
  });
  it('cxMapOpColor deixa passar o resto (vazio, outras cores, tokens, não-string)', () => {
    assert.equal(cxMapOpColor(''), '');
    assert.equal(cxMapOpColor('#123456'), '#123456');
    assert.equal(cxMapOpColor('var(--cx-op1)'), 'var(--cx-op1)');
    assert.equal(cxMapOpColor(undefined), undefined);
    assert.equal(cxMapOpColor(null), null);
  });
});
