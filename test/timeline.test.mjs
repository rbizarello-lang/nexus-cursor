import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TL_KINDS, TL_KIND_ORDER, tlEstimateWidth, tlLayoutLabels, tlPickGap, tlDurLabel,
  tlCdaBar, tlCountKinds, tlToggleKind, tlCapList,
} from '../src/lib/timeline.js';

describe('Vocabulário da Linha do tempo', () => {
  it('cada tipo tem forma própria e todos aparecem na ordem da legenda', () => {
    assert.deepEqual(TL_KIND_ORDER, ['dec', 'and', 'aud', 'prazo', 'presc', 'rev']);
    const glyphs = TL_KIND_ORDER.map(k => TL_KINDS[k].glyph);
    assert.equal(new Set(glyphs).size, glyphs.length);
    assert.equal(TL_KINDS.dec.glyph, '◆');
    assert.equal(TL_KINDS.and.glyph, '○');
    assert.equal(TL_KINDS.aud.glyph, '■');
    assert.equal(TL_KINDS.prazo.glyph, '▼');
    assert.equal(TL_KINDS.presc.glyph, '⬢');
  });
  it('conta por tipo e liga/desliga sem mutar o conjunto original', () => {
    const c = tlCountKinds([{ kind: 'dec' }, { kind: 'dec' }, { kind: 'prazo' }, { kind: 'xyz' }, null]);
    assert.equal(c.dec, 2); assert.equal(c.prazo, 1); assert.equal(c.aud, 0);
    const a = new Set(['aud']);
    const b = tlToggleKind(a, 'prazo');
    assert.ok(b.has('prazo') && b.has('aud')); assert.ok(!a.has('prazo'));
    assert.ok(!tlToggleKind(b, 'aud').has('aud'));
  });
});

describe('Rótulos sem colisão', () => {
  const W = 400;
  const overlap = (a, b) => a.level === b.level && a.x0 < b.x1 && b.x0 < a.x1;
  it('rótulos que cabem lado a lado ficam no mesmo nível', () => {
    const r = tlLayoutLabels([{ id: 'a', x: 20, w: 60, prio: 0 }, { id: 'b', x: 200, w: 60, prio: 1 }], { maxX: W });
    assert.deepEqual(r.placed.map(p => p.level), [0, 0]);
    assert.equal(r.levels, 1); assert.deepEqual(r.dropped, []);
  });
  it('um cacho de marcos vira níveis diferentes, sem nenhuma sobreposição', () => {
    const items = [0, 6, 12, 18].map((o, i) => ({ id: 'm' + i, x: 150 + o, w: 90, prio: i }));
    const r = tlLayoutLabels(items, { maxX: W, levels: 4 });
    assert.equal(r.placed.length + r.dropped.length, 4);
    for (let i = 0; i < r.placed.length; i++) for (let j = i + 1; j < r.placed.length; j++) assert.ok(!overlap(r.placed[i], r.placed[j]), 'colisão ' + i + '/' + j);
  });
  it('perto da borda direita o rótulo vira para a esquerda do marcador', () => {
    const r = tlLayoutLabels([{ id: 'a', x: 380, w: 90, prio: 0 }], { maxX: W });
    assert.equal(r.placed[0].anchor, 'end');
    assert.ok(r.placed[0].x1 <= 380 && r.placed[0].x0 >= 0);
  });
  it('perto da borda esquerda fica à direita; se não cabe em lugar nenhum, descarta', () => {
    const a = tlLayoutLabels([{ id: 'a', x: 10, w: 90, prio: 0 }], { maxX: W });
    assert.equal(a.placed[0].anchor, 'start');
    const b = tlLayoutLabels([{ id: 'a', x: 30, w: 500, prio: 0 }], { maxX: W });
    assert.deepEqual(b.dropped, ['a']); assert.equal(b.placed.length, 0);
  });
  it('quem tem prioridade menor (mais perto de hoje) ganha o nível 0; o excedente é descartado e contado', () => {
    const items = [{ id: 'longe', x: 100, w: 120, prio: 9 }, { id: 'perto', x: 100, w: 120, prio: 1 }];
    const r = tlLayoutLabels(items, { maxX: W, levels: 1 });
    assert.deepEqual(r.placed.map(p => p.id), ['perto']);
    assert.deepEqual(r.dropped, ['longe']);
  });
  it('a ordem de retorno acompanha a ordem de entrada', () => {
    const r = tlLayoutLabels([{ id: 'b', x: 300, w: 40, prio: 5 }, { id: 'a', x: 20, w: 40, prio: 0 }], { maxX: W });
    assert.deepEqual(r.placed.map(p => p.id), ['b', 'a']);
  });
  it('estimativa de largura cresce com o texto', () => {
    assert.ok(tlEstimateWidth('Justificação 05/10') > tlEstimateWidth('05/10'));
    assert.equal(tlEstimateWidth(''), 0);
  });
});

describe('Vão para o texto da barra do processo', () => {
  it('começa na borda se não há marcador no caminho', () => {
    assert.equal(tlPickGap([300], 10, 400, 60), 10);
  });
  it('pula o marcador que cortaria o texto e usa o vão depois dele', () => {
    const x = tlPickGap([20, 40], 10, 400, 60);
    assert.ok(x >= 40 + 8, 'depois do último marcador: ' + x);
  });
  it('sem vão suficiente devolve null (o texto some, a barra tem tooltip)', () => {
    assert.equal(tlPickGap([30, 90, 150], 10, 160, 70), null);
    assert.equal(tlPickGap([], 10, 50, 70), null);
  });
});

describe('Durações e barra de CDA', () => {
  it('rotula dias, meses e anos; passado vira "há"', () => {
    assert.equal(tlDurLabel(0), 'hoje');
    assert.equal(tlDurLabel(1), '1 dia');
    assert.equal(tlDurLabel(12), '12 dias');
    assert.equal(tlDurLabel(300), '10 meses');
    assert.equal(tlDurLabel(730), '2 anos');
    assert.equal(tlDurLabel(913), '2,5 anos');
    assert.equal(tlDurLabel(-12), 'há 12 dias');
    assert.equal(tlDurLabel(null), '');
  });
  it('barra da CDA: proporção decorrida e dias que faltam', () => {
    const b = tlCdaBar({ start: '2021-12-10', end: '2026-12-10', today: '2026-10-01' });
    assert.equal(b.left, 70);
    assert.ok(b.pct > 0.95 && b.pct < 1);
    assert.equal(b.late, false);
    const v = tlCdaBar({ start: '2020-01-01', end: '2025-01-01', today: '2026-10-01' });
    assert.equal(v.pct, 1); assert.equal(v.late, true); assert.ok(v.left < 0);
  });
  it('limita listas sem perder itens em silêncio', () => {
    const l = [1, 2, 3, 4, 5];
    assert.deepEqual(tlCapList(l, 3, false), { shown: [1, 2, 3], more: 2 });
    assert.deepEqual(tlCapList(l, 3, true), { shown: l, more: 0 });
    assert.deepEqual(tlCapList(l, 9, false), { shown: l, more: 0 });
  });
});
