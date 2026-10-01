import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NARR_CATS, NARR_PAST_STEP, narrRangeLabel, narrWeeks, narrClassify, narrFilter, narrCounts,
  narrSectionsFocus, narrPaginate, narrSectionsChrono, narrSummary,
} from '../src/lib/narrativa.js';

const TODAY = '2026-10-01'; // quinta-feira
const e = (id, cat, d, o = {}) => ({ id, cat, d, title: id, ...o });

describe('Narrativa — semanas e rótulos', () => {
  it('esta semana vai até o domingo; a próxima, de segunda a domingo', () => {
    assert.deepEqual(narrWeeks(TODAY), { today: '2026-10-01', thisEnd: '2026-10-04', nextStart: '2026-10-05', nextEnd: '2026-10-11' });
  });
  it('no domingo, "esta semana" é só hoje', () => {
    const w = narrWeeks('2026-10-04');
    assert.equal(w.thisEnd, '2026-10-04');
    assert.equal(w.nextStart, '2026-10-05');
  });
  it('faixa de dias com mês abreviado, no mesmo mês ou atravessando', () => {
    assert.equal(narrRangeLabel('2026-10-01', '2026-10-04'), '01 a 04/out');
    assert.equal(narrRangeLabel('2026-09-28', '2026-10-04'), '28/set a 04/out');
    assert.equal(narrRangeLabel('2026-10-04', '2026-10-04'), '04/out');
    assert.equal(narrRangeLabel('', '2026-10-04'), '');
  });
});

describe('narrClassify', () => {
  it('providência aberta e vencida = atrasado; concluída ou fato do passado = passado; de hoje em diante = a vir', () => {
    assert.equal(narrClassify(e('a', 'prazo', '2026-09-29', { open: true }), TODAY), 'late');
    assert.equal(narrClassify(e('b', 'dec', '2026-09-29'), TODAY), 'past');
    assert.equal(narrClassify(e('c', 'tar', '2026-09-29', { open: true, done: true }), TODAY), 'past');
    assert.equal(narrClassify(e('d', 'prazo', '2026-10-01', { open: true }), TODAY), 'future');
    assert.equal(narrClassify(e('f', 'aud', '2026-12-01'), TODAY), 'future');
    assert.equal(narrClassify(e('g', 'tar', '', {}), TODAY), 'nodate');
    assert.equal(narrClassify(null, TODAY), 'nodate');
  });
});

const sample = () => [
  e('late1', 'prazo', '2026-09-29', { open: true }),
  e('w1a', 'aud', '2026-10-03', { tm: '14:30' }),
  e('w1b', 'prazo', '2026-10-02', { open: true }),
  e('w2', 'prazo', '2026-10-06', { open: true }),
  e('later1', 'presc', '2027-07-28', { deadline: true }),
  e('later2', 'tar', '2026-11-05', { open: true }),
  e('r1', 'mine', '2026-09-25', { mineKind: 'resposta' }),
  e('r2', 'dec', '2026-09-18', { big: true, out: 'favoravel' }),
  e('m1', 'dec', '2026-07-03', { big: true, out: 'favoravel' }),
  e('o1', 'dec', '2026-03-10'),
  e('nd', 'mine', '', { mineKind: 'tarefa' }),
];

describe('narrFilter e narrCounts', () => {
  it('filtra por natureza e por processo, e conta por chip respeitando o processo', () => {
    const list = sample().concat([e('x', 'dec', '2026-09-01', { execId: 'ex1' }), e('y', 'prazo', '2026-10-09', { execId: 'ex1', open: true })]);
    assert.equal(narrFilter(list, { cat: 'prazo' }).length, 4);
    assert.equal(narrFilter(list, { execId: 'ex1' }).length, 2);
    assert.equal(narrFilter(list, { cat: 'prazo', execId: 'ex1' }).length, 1);
    const c = narrCounts(list, 'ex1');
    assert.equal(c.all, 2); assert.equal(c.dec, 1); assert.equal(c.prazo, 1); assert.equal(c.aud, 0);
    assert.deepEqual(NARR_CATS.map(x => x[0]), ['all', 'dec', 'prazo', 'aud', 'presc', 'mine', 'tar']);
  });
  it('entrada em mais de uma natureza (cats) entra nos dois chips', () => {
    const list = [e('t', 'mine', '2026-09-20', { cats: ['tar'] })];
    assert.equal(narrFilter(list, { cat: 'tar' }).length, 1);
    assert.equal(narrFilter(list, { cat: 'mine' }).length, 1);
    assert.equal(narrFilter(list, { cat: 'aud' }).length, 0);
  });
});

describe('narrSectionsFocus — próximo → antigo', () => {
  const f = narrSectionsFocus(sample(), TODAY);
  const keys = f.sections.map(s => s.key);
  it('seções na ordem Atrasado · esta semana · próxima · mais adiante · passado', () => {
    assert.deepEqual(keys, ['late', 'w1', 'w2', 'later', 'recent', 'mid', 'old', 'nodate']);
    assert.equal(f.now, 4);
    assert.equal(f.ahead, 6);
    assert.equal(f.past, 5);
  });
  it('o que vem em ordem de data (e hora), o passado do mais recente ao mais antigo', () => {
    const by = (k) => f.sections.find(s => s.key === k).items.map(i => i.id);
    assert.deepEqual(by('w1'), ['w1b', 'w1a']);
    assert.deepEqual(by('later'), ['later2', 'later1']);
    assert.deepEqual(by('recent'), ['r1', 'r2']);
    assert.deepEqual(by('mid'), ['m1']);
    assert.deepEqual(by('old'), ['o1']);
  });
  it('as semanas trazem o intervalo de datas', () => {
    assert.equal(f.sections.find(s => s.key === 'w1').sub, '01 a 04/out');
    assert.equal(f.sections.find(s => s.key === 'w2').sub, '05 a 11/out');
  });
  it('atrasado carrega o tom "late"; lista vazia não gera seções', () => {
    assert.equal(f.sections[0].tone, 'late');
    assert.deepEqual(narrSectionsFocus([], TODAY).sections, []);
  });
});

describe('narrPaginate', () => {
  const many = [];
  for (let i = 0; i < 25; i++) many.push(e('p' + i, 'dec', '2026-09-' + String(20 - (i % 15)).padStart(2, '0'), {}));
  it('mostra o passado de 10 em 10 e conta o que ficou de fora; o que vem não é cortado', () => {
    const f = narrSectionsFocus(many.concat([e('f1', 'prazo', '2026-10-02', { open: true })]), TODAY);
    const p1 = narrPaginate(f, { pastShown: NARR_PAST_STEP });
    const nPast = p1.sections.slice(f.now).reduce((n, s) => n + s.items.length, 0);
    assert.equal(nPast, 10);
    assert.equal(p1.hiddenPast, 15);
    assert.equal(p1.sections[0].items.length, 1);
    const p2 = narrPaginate(f, { pastShown: 20 });
    assert.equal(p2.hiddenPast, 5);
    const all = narrPaginate(f, { pastShown: 99 });
    assert.equal(all.hiddenPast, 0);
  });
  it('"mais adiante" pode ser limitado e expandido', () => {
    const list = [];
    for (let i = 0; i < 9; i++) list.push(e('l' + i, 'prazo', '2026-12-' + String(10 + i), { open: true }));
    const f = narrSectionsFocus(list, TODAY);
    const cap = narrPaginate(f, { laterCap: 4 });
    assert.equal(cap.sections[0].items.length, 4);
    assert.equal(cap.hiddenLater, 5);
    assert.equal(narrPaginate(f, { laterCap: 4, laterExpanded: true }).hiddenLater, 0);
  });
  it('a página não altera as seções originais', () => {
    const f = narrSectionsFocus(many, TODAY);
    const before = JSON.stringify(f);
    narrPaginate(f, { pastShown: 3 });
    assert.equal(JSON.stringify(f), before);
  });
});

describe('narrSectionsChrono', () => {
  it('por mês, do mais antigo ao mais novo, com "Hoje" antes do primeiro item de hoje em diante', () => {
    const c = narrSectionsChrono(sample(), TODAY);
    assert.deepEqual(c.sections.map(s => s.key), ['2026-03', '2026-07', '2026-09', '2026-10', '2026-11', '2027-07', 'nodate']);
    assert.equal(c.sections[2].label, 'setembro 2026');
    assert.deepEqual(c.sections[2].items.map(i => i.id), ['r2', 'r1', 'late1']);
    assert.deepEqual(c.nowAt, { section: 3, index: 0 });
  });
  it('sem nada de hoje em diante não há divisor', () => {
    assert.equal(narrSectionsChrono([e('a', 'dec', '2025-01-01')], TODAY).nowAt, null);
  });
});

describe('narrSummary', () => {
  const s = narrSummary(sample().concat([e('au', 'aud', '2026-10-05', { tm: '14:30', title: 'Justificação' })]), TODAY);
  it('conta vencidos, prazos em 14 dias, próxima audiência, termo e última decisão', () => {
    assert.equal(s.late.n, 1);
    assert.equal(s.late.first.id, 'late1');
    assert.equal(s.soon.n, 2);
    assert.equal(s.aud.d, '2026-10-03');
    assert.equal(s.aud.days, 2);
    assert.equal(s.audN, 2);
    assert.equal(s.term.d, '2027-07-28');
    assert.equal(s.decision.d, '2026-09-18');
  });
  it('o que eu fiz em 30 dias e o último movimento', () => {
    assert.equal(s.done30.resp, 1);
    assert.equal(s.done30.total, 1);
    assert.deepEqual(s.done30.last, { d: '2026-09-25', days: 6 });
  });
  it('sem nada, resumo vazio e sem exceção', () => {
    const z = narrSummary([], TODAY);
    assert.equal(z.late.n, 0);
    assert.equal(z.aud, null);
    assert.equal(z.done30.last, null);
  });
});
