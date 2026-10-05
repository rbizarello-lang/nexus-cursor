import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CX_THEMES, cxThemeKey, cxThemeClass } from '../src/lib/themes.js';

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
});
