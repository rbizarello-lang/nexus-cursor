import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { diffWords, diffSides, textdiffPlain } from '../src/lib/textdiff.js';

const join = (ops, t) => ops.filter((o) => o.t !== t).map((o) => o.s).join('');

describe('textdiff', () => {
  it('textos iguais: um bloco só', () => {
    assert.deepEqual(diffWords('a b c', 'a b c'), [{ t: 'eq', s: 'a b c' }]);
  });
  it('palavra trocada e palavra inserida', () => {
    const ops = diffWords('Prazo de 15 dias úteis.', 'Prazo de 30 dias úteis. Sem preparo.');
    assert.equal(join(ops, 'ins'), 'Prazo de 15 dias úteis.');
    assert.equal(join(ops, 'del'), 'Prazo de 30 dias úteis. Sem preparo.');
    assert.ok(ops.some((o) => o.t === 'del' && o.s === '15'));
    assert.ok(ops.some((o) => o.t === 'ins' && o.s.includes('30')));
  });
  it('vazio contra texto', () => {
    assert.deepEqual(diffWords('', 'novo texto'), [{ t: 'ins', s: 'novo texto' }]);
    assert.deepEqual(diffWords('velho', ''), [{ t: 'del', s: 'velho' }]);
    assert.deepEqual(diffWords('', ''), []);
  });
  it('lados reconstroem os textos originais', () => {
    const a = 'Contribuinte citado em 12/08.\nSem bens.', b = 'Contribuinte citado em 13/08.\nSem bens localizados.';
    const s = diffSides(a, b);
    assert.equal(s.before.map((x) => x.s).join(''), a);
    assert.equal(s.after.map((x) => x.s).join(''), b);
    assert.equal(s.changed, true);
    assert.equal(diffSides('x', 'x').changed, false);
  });
  it('texto enorme e diferente não trava: cai para bloco único', () => {
    const a = Array.from({ length: 5000 }, (_, i) => 'a' + i).join(' '), b = Array.from({ length: 5000 }, (_, i) => 'b' + i).join(' ');
    const ops = diffWords(a, b);
    assert.equal(join(ops, 'ins'), a);
    assert.equal(join(ops, 'del'), b);
  });
  it('html vira texto puro', () => {
    assert.equal(textdiffPlain('<p>Olá&nbsp;<b>mundo</b></p><p>fim &amp; tudo</p>'), 'Olá mundo\nfim & tudo');
    assert.equal(textdiffPlain(null), '');
  });
});
