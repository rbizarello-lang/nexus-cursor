import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { indispStats, indispRatioText, indispSplitText, indispDeltaPp } from '../src/lib/indisp.js';

const A = (value, status = 'indisponibilidade_ativa') => ({ status, value });
const money = (v) => 'R$ ' + v;

describe('indispStats', () => {
  it('sem bens: nenhum bem em indisponibilidade (outros status ignorados)', () => {
    const s = indispStats([], 1000);
    assert.equal(s.kind, 'sem_bens');
    assert.equal(s.n, 0);
    assert.equal(s.totalVal, 0);
    assert.equal(s.ratio, 0);
    assert.equal(s.pct, 0);
    assert.equal(s.over, false);
    const t = indispStats([{ status: 'livre', value: 500 }, { status: 'penhorado', value: 900 }, null], 1000);
    assert.equal(t.kind, 'sem_bens');
    assert.equal(t.n, 0);
    assert.equal(indispStats(undefined, 10).kind, 'sem_bens');
  });

  it('só bens sem valor: sem avaliação', () => {
    const s = indispStats([A(0), A(undefined, 'indisponibilidade_requerida'), A(-5)], 1000);
    assert.equal(s.kind, 'sem_avaliacao');
    assert.equal(s.n, 3);
    assert.equal(s.semValorN, 3);
    assert.equal(s.totalVal, 0);
    assert.equal(s.pct, 0);
  });

  it('misto: ativa e requerida somadas num só arco, valor > 0, sem valor contado à parte', () => {
    const s = indispStats([A(300), A(200), A(100, 'indisponibilidade_requerida'), A(0), { status: 'livre', value: 999 }], 1000);
    assert.equal(s.kind, 'valor');
    assert.equal(s.ativaVal, 500);
    assert.equal(s.reqVal, 100);
    assert.equal(s.totalVal, 600);
    assert.equal(s.ativaN, 3);
    assert.equal(s.reqN, 1);
    assert.equal(s.n, 4);
    assert.equal(s.semValorN, 1);
    assert.equal(s.ratio, 0.6);
    assert.equal(s.pct, 60);
    assert.equal(s.over, false);
  });

  it('dívida zero ou ausente: razão e pct nulos', () => {
    for (const d of [0, null, undefined, -10]) {
      const s = indispStats([A(100)], d);
      assert.equal(s.ratio, null);
      assert.equal(s.pct, null);
      assert.equal(s.over, false);
      assert.equal(s.kind, 'valor');
    }
  });

  it('acima de 100%: pct preso em 100, razão preservada, over verdadeiro', () => {
    const s = indispStats([A(2600)], 1000);
    assert.equal(s.ratio, 2.6);
    assert.equal(s.pct, 100);
    assert.equal(s.over, true);
    assert.equal(indispStats([A(1000)], 1000).over, true);
    assert.equal(indispStats([A(999)], 1000).over, false);
  });

  it('arredondamento do pct', () => {
    assert.equal(indispStats([A(1)], 3).pct, 33);
    assert.equal(indispStats([A(2)], 3).pct, 67);
    assert.equal(indispStats([A(5)], 1000).pct, 1);
    assert.equal(indispStats([A(4)], 1000).pct, 0);
  });
});

describe('indispRatioText', () => {
  it('percentual abaixo de 1×, razão com vírgula a partir de 1×', () => {
    assert.equal(indispRatioText(null), null);
    assert.equal(indispRatioText(undefined), null);
    assert.equal(indispRatioText(0), '0% da dívida');
    assert.equal(indispRatioText(0.47), '47% da dívida');
    assert.equal(indispRatioText(0.994), '99% da dívida');
    assert.equal(indispRatioText(1), '1,0× a dívida');
    assert.equal(indispRatioText(2.6), '2,6× a dívida');
    assert.equal(indispRatioText(2.64), '2,6× a dívida');
    assert.equal(indispRatioText(2.66), '2,7× a dívida');
  });
});

describe('indispSplitText', () => {
  it('ativa e requerida, só as partes com valor', () => {
    assert.equal(indispSplitText({ ativaVal: 1200000, reqVal: 300000 }, (v) => v === 1200000 ? 'R$ 1,2 mi' : 'R$ 300 mil'), 'R$ 1,2 mi ativa · R$ 300 mil requerida');
    assert.equal(indispSplitText({ ativaVal: 10, reqVal: 0 }, money), 'R$ 10 ativa');
    assert.equal(indispSplitText({ ativaVal: 0, reqVal: 7 }, money), 'R$ 7 requerida');
    assert.equal(indispSplitText({ ativaVal: 0, reqVal: 0 }, money), '');
    assert.equal(indispSplitText(null, money), '');
  });
});

describe('indispDeltaPp', () => {
  it('só com as duas pontas e |Δ| ≥ 1; sinal e tom', () => {
    assert.equal(indispDeltaPp(null, 50), null);
    assert.equal(indispDeltaPp(50, null), null);
    assert.equal(indispDeltaPp(undefined, undefined), null);
    assert.equal(indispDeltaPp(50, 50), null);
    assert.deepEqual(indispDeltaPp(71, 59), { txt: '+12 p.p. vs. carteira', dir: 'up', tone: 'good' });
    assert.deepEqual(indispDeltaPp(30, 59), { txt: '−29 p.p. vs. carteira', dir: 'down', tone: 'bad' });
    assert.deepEqual(indispDeltaPp(60, 59), { txt: '+1 p.p. vs. carteira', dir: 'up', tone: 'good' });
    assert.equal(indispDeltaPp(0, 0), null);
    assert.deepEqual(indispDeltaPp(0, 5), { txt: '−5 p.p. vs. carteira', dir: 'down', tone: 'bad' });
  });
});
