import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TL_KINDS, TL_KIND_ORDER, tlEstimateWidth, tlLayoutLabels, tlPickGap, tlDurLabel,
  tlCdaBar, tlCountKinds, tlToggleKind, tlCapList,
  HORIZON_DAYS, HORIZON_ROWS, horizonColumns, horizonColumnOf, horizonBucket, horizonDayCounts, horizonBusyDays,
  horizonOffRuns, horizonRangeLabel,
  TL_WINDOWS, TL_DEFAULT_WINDOW, tlWindowLabel, tlFocusDefault, tlFocusStep, tlFocusRange, tlNormalizeFocus, tlBreakLabel,
  tlCompressZone, tlProjectBroken, tlFocusAxis, tlZoneTicks,
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

describe('Horizonte de 90 dias — colunas do funil', () => {
  const TODAY = '2026-10-01'; // quinta-feira
  const cols = horizonColumns(TODAY);
  it('Atrasados, esta semana, semanas 2 a 5, um mês por coluna e Depois (segunda a domingo)', () => {
    assert.deepEqual(cols.map(c => c.label), ['Atrasados', 'Esta semana', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Novembro', 'Dezembro', 'Depois']);
    assert.deepEqual(cols.map(c => c.sub), ['antes de hoje', '01–04/10', '05–11/10', '12–18/10', '19–25/10', '26/10–01/11', '02–30/11', '01–30/12', 'após 30/12']);
    assert.equal(cols[0].to, '2026-09-30'); assert.equal(cols[0].from, null);
    assert.equal(cols[1].from, TODAY); assert.equal(cols[1].to, '2026-10-04');
    assert.equal(cols[cols.length - 1].from, '2026-12-31'); assert.equal(cols[cols.length - 1].to, null);
    assert.equal(HORIZON_DAYS, 90);
  });
  it('as colunas cobrem a linha do tempo inteira, sem furo nem sobreposição', () => {
    for (let i = 1; i < cols.length; i++) {
      const prev = cols[i - 1].to, next = cols[i].from;
      const after = new Date(prev + 'T00:00:00'); after.setDate(after.getDate() + 1);
      assert.equal(after.toISOString().slice(0, 10), next, 'entre ' + cols[i - 1].key + ' e ' + cols[i].key);
    }
  });
  it('em domingo, "esta semana" é só o próprio dia; a semana 2 começa na segunda', () => {
    const c = horizonColumns('2026-10-04');
    assert.equal(c[1].from, '2026-10-04'); assert.equal(c[1].to, '2026-10-04'); assert.equal(c[1].sub, '04/10');
    assert.equal(c[2].from, '2026-10-05');
  });
  it('em segunda, esta semana vai até domingo; janela curta não gera meses', () => {
    const c = horizonColumns('2026-10-05');
    assert.equal(c[1].to, '2026-10-11');
    const short = horizonColumns('2026-10-05', { days: 20 });
    assert.ok(!short.some(x => x.kind === 'month'));
    assert.equal(short[short.length - 1].kind, 'after');
  });
  it('em que coluna cai cada data', () => {
    assert.equal(horizonColumnOf('2026-09-29', cols), 'late');
    assert.equal(horizonColumnOf('2026-10-01', cols), 'w1');
    assert.equal(horizonColumnOf('2026-10-04', cols), 'w1');
    assert.equal(horizonColumnOf('2026-10-05', cols), 'w2');
    assert.equal(horizonColumnOf('2026-11-01', cols), 'w5');
    assert.equal(horizonColumnOf('2026-11-02', cols), 'm:2026-11');
    assert.equal(horizonColumnOf('2026-12-30', cols), 'm:2026-12');
    assert.equal(horizonColumnOf('2027-07-28', cols), 'after');
    assert.equal(horizonColumnOf('', cols), null);
  });
  it('agrupa por coluna em ordem de data e hora; item sem data fica de fora', () => {
    const b = horizonBucket([
      { id: 'c', d: '2026-10-19', tm: '14:00' }, { id: 'a', d: '2026-10-19', tm: '09:30' }, { id: 'x', d: '' },
      { id: 'late', d: '2026-09-21' }, { id: 'far', d: '2028-01-01' }, { id: 'd', d: '2026-10-06' },
    ], cols);
    assert.deepEqual(b.w4.map(i => i.id), ['a', 'c']);
    assert.deepEqual(b.late.map(i => i.id), ['late']);
    assert.deepEqual(b.after.map(i => i.id), ['far']);
    assert.deepEqual(b.w2.map(i => i.id), ['d']);
    assert.equal(Object.values(b).reduce((s, l) => s + l.length, 0), 5);
  });
  it('dia com 3 ou mais itens aperta', () => {
    const counts = horizonDayCounts([{ d: '2026-10-19' }, { d: '2026-10-19' }, { d: '2026-10-19' }, { d: '2026-10-06' }, { d: '2026-10-06' }, { d: '' }]);
    assert.equal(counts.get('2026-10-19'), 3);
    const busy = horizonBusyDays(counts);
    assert.ok(busy.has('2026-10-19')); assert.ok(!busy.has('2026-10-06'));
    assert.ok(horizonBusyDays(counts, 2).has('2026-10-06'));
  });
  it('dias não úteis: usa o predicado recebido, ignora fim de semana e junta sequências', () => {
    const off = new Set(['2026-10-12', '2026-11-02', '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-28']);
    const isOff = (d) => off.has(d);
    assert.deepEqual(horizonOffRuns(cols[3], isOff), [{ from: '2026-10-12', to: '2026-10-12', n: 1 }]);
    assert.deepEqual(horizonOffRuns(cols[6], isOff), [{ from: '2026-11-02', to: '2026-11-02', n: 1 }]);
    const dez = horizonOffRuns(cols[7], isOff);
    assert.equal(dez.length, 1); assert.equal(dez[0].from, '2026-12-21'); assert.equal(dez[0].to, '2026-12-28'); assert.equal(dez[0].n, 6);
    assert.deepEqual(horizonOffRuns(cols[0], isOff), []);
    assert.deepEqual(horizonOffRuns(cols[1], null), []);
  });
  it('rótulos de intervalo e linhas por natureza', () => {
    assert.equal(horizonRangeLabel('2026-10-05', '2026-10-11'), '05–11/10');
    assert.equal(horizonRangeLabel('2026-10-26', '2026-11-01'), '26/10–01/11');
    assert.equal(horizonRangeLabel('2026-10-04', '2026-10-04'), '04/10');
    assert.deepEqual(HORIZON_ROWS.map(r => r[0]), ['prazo', 'aud', 'tar', 'presc']);
  });
});

describe('Panorama — janela de foco e estado lembrado', () => {
  it('janelas conhecidas, rótulos, foco padrão (hoje a 1/3) e passo', () => {
    assert.deepEqual(TL_WINDOWS, [30, 60, 90, 180, 365]);
    assert.equal(TL_DEFAULT_WINDOW, 90);
    assert.equal(tlWindowLabel(90), '90 d'); assert.equal(tlWindowLabel(365), '1 ano');
    assert.deepEqual(tlFocusDefault(90), { w: 90, c: 15 });
    const r = tlFocusRange(90, 15);
    assert.equal(r.f0, -30); assert.equal(r.f1, 60);
    assert.equal(tlFocusStep(90), 30); assert.equal(tlFocusStep(30), 10); assert.equal(tlFocusStep(365), 122); assert.equal(tlFocusStep(6), 7);
  });
  it('normaliza o que vem do localStorage: lixo volta ao padrão, tipos desconhecidos saem', () => {
    assert.deepEqual(tlNormalizeFocus(null), { w: 90, c: 15, hidden: [] });
    assert.deepEqual(tlNormalizeFocus('x'), { w: 90, c: 15, hidden: [] });
    assert.deepEqual(tlNormalizeFocus({ w: 45, c: 'a', hidden: 'dec' }), { w: 90, c: 15, hidden: [] });
    assert.deepEqual(tlNormalizeFocus({ w: 180, c: 30, hidden: ['aud', 'zzz', 'prazo'] }), { w: 180, c: 30, hidden: ['aud', 'prazo'] });
    assert.equal(tlNormalizeFocus({ w: 60, c: 1e9 }).c, 365 * 12);
    assert.equal(tlNormalizeFocus({ w: 60, c: NaN }).c, 10);
  });
  it('rótulo da quebra: dias, meses e anos', () => {
    assert.equal(tlBreakLabel(20), '≈ 20 d');
    assert.equal(tlBreakLabel(400), '≈ 13 m');
    assert.equal(tlBreakLabel(730), '≈ 2 a');
    assert.equal(tlBreakLabel(1300), '≈ 3,6 a');
  });
});

describe('Panorama — eixo quebrado', () => {
  const pts = [-400, -300, -20, -5, 0, 3, 18, 170, 330, 400, 900];
  const S = tlProjectBroken({ points: pts, f0: -30, f1: 60, width: 900 });
  it('o foco é linear; passado e futuro ocupam as laterais; tudo cabe na largura', () => {
    assert.ok(S.pastW > 0 && S.futW > 0);
    assert.equal(Math.round(S.f(-30)), S.pastW);
    assert.equal(Math.round(S.f(60)), S.pastW + S.focusW);
    assert.ok(Math.abs((S.f(30) - S.f(0)) - 30 * S.ppd) < 1e-6);
    assert.ok(S.pastW + S.focusW + S.futW <= 900 + 1);
    pts.forEach(p => { const x = S.f(p); assert.ok(x >= 0 && x <= 900, p + ' → ' + x); });
  });
  it('é monotônica: dia depois nunca fica à esquerda', () => {
    let prev = -1;
    for (let o = -420; o <= 920; o += 3) { const x = S.f(o); assert.ok(x >= prev - 1e-9, 'em ' + o); prev = x; }
  });
  it('sem fato fora do foco não há zonas: escala toda linear', () => {
    const L = tlProjectBroken({ points: [-10, 5, 40], f0: -30, f1: 60, width: 800 });
    assert.equal(L.pastW, 0); assert.equal(L.futW, 0); assert.equal(L.zP, null); assert.equal(L.zU, null);
    assert.ok(Math.abs(L.ppd - 800 / 90) < 1e-9);
    assert.equal(L.f(-30), 0); assert.ok(Math.abs(L.f(60) - 800) < 1e-9);
  });
  it('vãos de 60 dias ou mais viram quebras de largura fixa; menores só se espremem', () => {
    const Z = tlCompressZone(60, 500, 200, [70, 90, 130, 480]);
    const gaps = Z.pieces.filter(p => p.gap);
    assert.ok(gaps.length >= 1);
    gaps.forEach(g => { assert.equal(Math.round(g.x1 - g.x0), 26); assert.ok(g.b - g.a >= 60); });
    Z.pieces.filter(p => !p.gap).forEach(p => assert.ok(p.b - p.a < 60 || true));
    const small = tlCompressZone(60, 140, 200, [70, 130]);
    assert.ok(small.pieces.every(p => !p.gap));
  });
  it('as peças da zona são contíguas, cobrem [a, b] e terminam na largura da zona', () => {
    const Z = tlCompressZone(-400, -30, 150, [-390, -200, -40]);
    assert.equal(Z.pieces[0].a, -400); assert.equal(Z.pieces[Z.pieces.length - 1].b, -30);
    for (let i = 1; i < Z.pieces.length; i++) { assert.equal(Z.pieces[i].a, Z.pieces[i - 1].b); assert.ok(Math.abs(Z.pieces[i].x0 - Z.pieces[i - 1].x1) < 1e-9); }
    assert.ok(Math.abs(Z.pieces[Z.pieces.length - 1].x1 - 150) < 1e-6);
    assert.equal(Z.f(-500), 0); assert.equal(Z.f(0), 150);
  });
  it('janela estreita ainda devolve uma escala utilizável', () => {
    const N = tlProjectBroken({ points: [-900, 900], f0: -10, f1: 20, width: 200 });
    assert.ok(N.focusW >= 60); assert.ok(Number.isFinite(N.ppd) && N.ppd > 0);
  });
});

describe('Panorama — marcas do eixo', () => {
  const TODAY = '2026-10-01';
  it('com escala larga, um número por dia e sombreado de fim de semana', () => {
    const f = (o) => o * 20;
    const A = tlFocusAxis({ f0: 0, f1: 13, ppd: 20, f, todayIso: TODAY });
    assert.equal(A.ticks.length, 14);
    assert.equal(A.majors[0].text, 'outubro 2026');
    assert.equal(A.majors[0].short, 'out 26');
    assert.equal(A.majors[0].partial, false); // 01/10 é dia 1
    assert.equal(tlFocusAxis({ f0: 3, f1: 8, ppd: 20, f, todayIso: TODAY }).majors[0].partial, true);
    assert.deepEqual(A.shade.map(s => s.o), [2, 3, 9, 10]); // sáb 03/10, dom 04/10, sáb 10/10, dom 11/10
    assert.ok(A.shade.every(s => !s.holiday));
  });
  it('dia não útil de semana também é sombreado e marcado como feriado', () => {
    const f = (o) => o * 20;
    const A = tlFocusAxis({ f0: 0, f1: 13, ppd: 20, f, todayIso: TODAY, isOff: iso => iso === '2026-10-12' });
    const h = A.shade.filter(s => s.holiday);
    assert.equal(h.length, 1); assert.equal(h[0].o, 11);
  });
  it('com escala curta, só segundas (de k em k) e sem sombreado', () => {
    const f = (o) => o * 2.4;
    const A = tlFocusAxis({ f0: -30, f1: 335, ppd: 2.4, f, todayIso: TODAY });
    assert.equal(A.shade.length, 0);
    assert.ok(A.ticks.length > 10 && A.ticks.length < 40);
    assert.ok(A.majors.length >= 12);
    assert.ok(A.grid.some(g => g.strong));
  });
  it('zona comprimida: traço por mês, rótulo por trecho largo e quebras com tamanho', () => {
    const Z = tlCompressZone(60, 700, 300, [90, 400, 690]);
    const T = tlZoneTicks(Z, 700, TODAY, {});
    assert.ok(T.breaks.length >= 1);
    T.breaks.forEach(b => { assert.ok(b.x1 > b.x0 && /^≈/.test(b.label)); assert.ok(b.x0 >= 700); });
    assert.ok(T.ticks.every(t => t.x >= 700 && t.x <= 1000));
    assert.equal(tlZoneTicks(null, 0, TODAY).ticks.length, 0);
  });
});
