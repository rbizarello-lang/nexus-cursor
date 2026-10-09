import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFrentesGraph, frentesHasFronts, frentesColumnLabels, frentesUpstream, frentesDownstream, frentesChain,
  frentesCriticalPath, FRENTES_EFFECT,
} from '../src/lib/frentes.js';

const TODAY = '2026-10-01';
const lane = (id, extra = {}) => ({ id, kind: 'proc', execId: id, name: id.toUpperCase(), ...extra });
const ev = (id, laneId, d, extra = {}) => ({ id, lane: laneId, d, kind: 'and', label: id, ...extra });

/* Fachada Norte, em miniatura: IDPJ cobre EF principal e EF apensa; agravo é filho do IDPJ; exceção é filha da EF. */
function fachada(over = {}) {
  const lanes = [
    lane('idpj', { incident: 'idpj', name: 'IDPJ 5009876' }),
    lane('ai', { name: 'AI 5001250' }),
    lane('ef1', { name: 'EF 5001234' }),
    lane('ef2', { name: 'EF 5001235' }),
    lane('epe', { name: 'EPE 5001240' }),
    { id: 'cda', kind: 'cda', name: 'CDAs sem processo' },
  ];
  const events = [
    ev('ef1-dist', 'ef1', '2025-07-10'),
    ev('ef2-dist', 'ef2', '2025-08-01'),
    ev('idpj-aj', 'idpj', '2026-06-03', { sk: 'ajuizamento' }),
    ev('idpj-lim', 'idpj', '2026-07-03', { kind: 'dec', sk: 'liminar', out: 'favoravel', label: 'Liminar · favorável' }),
    ev('epe-dist', 'epe', '2026-08-21'),
    ev('ai-dist', 'ai', '2026-09-11'),
    ev('idpj-prazo', 'idpj', '2026-09-29', { kind: 'prazo', open: true, late: true, label: 'Manifestação' }),
    ev('idpj-aud', 'idpj', '2026-10-05', { kind: 'aud', tm: '14:30', open: true, label: 'Audiência de justificação' }),
    ev('ef1-aud', 'ef1', '2026-10-19', { kind: 'aud', open: true, label: 'Audiência de instrução' }),
    ev('cda1', 'cda', '2027-07-28', { kind: 'presc', open: true, label: 'Ajuizar CDA 300-45' }),
  ];
  const links = [
    { type: 'cover', a: 'idpj', b: 'ef1' },
    { type: 'cover', a: 'idpj', b: 'ef2' },
    { type: 'parent', a: 'idpj', b: 'ai', label: 'agravo' },
    { type: 'parent', a: 'ef1', b: 'epe', label: 'exceção' },
    { type: 'parent', a: 'ef1', b: 'ef2', label: 'apenso' },
  ];
  return buildFrentesGraph({ lanes: over.lanes || lanes, events: over.events || events, links: over.links || links, todayIso: TODAY });
}
const edge = (g, type, a, b) => g.edges.find(e => e.type === type && e.a === a && e.b === b);

describe('frentesHasFronts', () => {
  it('IDPJ/MCF ou qualquer vínculo contam; processos soltos não', () => {
    assert.equal(frentesHasFronts({ lanes: [lane('a', { incident: 'mcf' })], links: [] }), true);
    assert.equal(frentesHasFronts({ lanes: [lane('a'), lane('b')], links: [{ type: 'parent', a: 'a', b: 'b' }] }), true);
    assert.equal(frentesHasFronts({ lanes: [lane('a'), lane('b')], links: [] }), false);
    assert.equal(frentesHasFronts({}), false);
  });
});

describe('Colunas (eixo ordinal)', () => {
  it('cada fato ganha uma coluna, na ordem das datas', () => {
    const g = fachada();
    const real = g.nodes.filter(n => !n.ghost && !n.derived).sort((a, b) => a.col - b.col);
    for (let i = 1; i < real.length; i++) assert.ok(real[i - 1].d <= real[i].d, real[i - 1].id + ' antes de ' + real[i].id);
    assert.equal(g.byId.get('ef1-dist').col, 0);
    assert.equal(g.byId.get('cda1').col < g.cols.length, true);
  });
  it('mesmo dia em raias diferentes divide a coluna; na mesma raia, não', () => {
    const g = buildFrentesGraph({
      lanes: [lane('a'), lane('b')],
      events: [ev('a1', 'a', '2026-05-01'), ev('b1', 'b', '2026-05-01'), ev('a2', 'a', '2026-05-01'), ev('a3', 'a', '2026-06-01')],
      todayIso: TODAY,
    });
    assert.equal(g.byId.get('a1').col, g.byId.get('b1').col);
    assert.notEqual(g.byId.get('a2').col, g.byId.get('a1').col);
    assert.equal(g.cols.length, 3);
  });
  it('fato sem data ou de raia desconhecida não entra', () => {
    const g = buildFrentesGraph({ lanes: [lane('a')], events: [ev('x', 'a', ''), ev('y', 'zzz', '2026-01-01'), ev('z', 'a', '2026-01-02')], todayIso: TODAY });
    assert.deepEqual(g.nodes.map(n => n.id), ['z']);
  });
  it('rótulos: mês só quando muda, dia/mês em todas; fantasma sem data', () => {
    const g = fachada();
    const lb = frentesColumnLabels(g);
    assert.equal(lb.length, g.cols.length);
    assert.equal(lb[0].top, 'jul 25');
    assert.equal(lb[0].bottom, '10/07');
    assert.equal(lb[1].top, 'ago 25');
    const ghostCol = g.cols.findIndex(c => c.ghost);
    assert.ok(ghostCol > 0);
    assert.equal(lb[ghostCol].bottom, '');
    assert.equal(lb[ghostCol].top, '');
  });
  it('"hoje" fica antes da primeira coluna de hoje em diante', () => {
    const g = fachada();
    const first = g.cols.findIndex(c => c.ghost || c.d >= TODAY);
    assert.equal(g.todayCol, first);
    assert.ok(g.cols[g.todayCol - 1].d < TODAY);
  });
});

describe('Efeito: liminar ou decisão favorável do incidente alcança a execução coberta', () => {
  it('estação derivada na mesma coluna, em cada execução coberta, com seta de efeito', () => {
    const g = fachada();
    const src = g.byId.get('idpj-lim');
    ['ef1', 'ef2'].forEach(b => {
      const fx = g.byId.get('fx|idpj-lim|' + b);
      assert.ok(fx, 'derivada em ' + b);
      assert.equal(fx.derived, true);
      assert.equal(fx.label, FRENTES_EFFECT.liminar);
      assert.equal(fx.col, src.col);
      assert.equal(fx.d, src.d);
      assert.ok(edge(g, 'eff', 'idpj-lim', fx.id));
    });
  });
  it('com efeito derivado não há seta "cobre"; sem efeito, há (do 1º fato do incidente ao 1º da execução depois dele)', () => {
    const g = fachada();
    assert.equal(g.edges.some(e => e.type === 'cover'), false);
    const g2 = fachada({ events: [
      ev('ef1-dist', 'ef1', '2025-07-10'),
      ev('ef1-x', 'ef1', '2026-08-10'),
      ev('idpj-aj', 'idpj', '2026-06-03', { sk: 'ajuizamento' }),
      ev('idpj-lim', 'idpj', '2026-07-03', { kind: 'dec', sk: 'liminar', out: 'desfavoravel' }),
    ] });
    const c = g2.edges.find(e => e.type === 'cover' && e.b === 'ef1-x');
    assert.ok(c);
    assert.equal(c.a, 'idpj-aj');
    assert.equal(c.label, 'cobre');
  });
  it('desfecho desfavorável ou execução extinta não produz efeito', () => {
    const g = fachada({ events: [ev('idpj-lim', 'idpj', '2026-07-03', { sk: 'liminar', out: 'desfavoravel' })] });
    assert.equal(g.nodes.some(n => n.derived), false);
    const lanes = [lane('idpj', { incident: 'idpj' }), lane('ef1', { closed: true })];
    const g2 = buildFrentesGraph({ lanes, events: [ev('lim', 'idpj', '2026-07-03', { sk: 'liminar', out: 'favoravel' })], links: [{ type: 'cover', a: 'idpj', b: 'ef1' }], todayIso: TODAY });
    assert.equal(g2.nodes.some(n => n.derived), false);
  });
  it('decisão final favorável também vira efeito e some o fantasma da decisão', () => {
    const lanes = [lane('idpj', { incident: 'idpj' }), lane('ef1')];
    const g = buildFrentesGraph({
      lanes, events: [ev('dec', 'idpj', '2026-08-01', { kind: 'dec', sk: 'decisao', out: 'favoravel' })],
      links: [{ type: 'cover', a: 'idpj', b: 'ef1' }], todayIso: TODAY,
    });
    assert.equal(g.byId.get('fx|dec|ef1').label, FRENTES_EFFECT.decisao);
    assert.equal(g.nodes.some(n => n.ghost), false);
  });
});

describe('Fantasmas: só onde o dado sustenta', () => {
  it('IDPJ ativo sem decisão final: "Decisão final" depois de hoje e, nas EFs cobertas, "Pedir redirecionamento" condicional', () => {
    const g = fachada();
    const dg = g.byId.get('gh|dec|idpj');
    assert.ok(dg && dg.ghost && dg.d === '' && dg.lane === 'idpj');
    assert.ok(dg.col >= g.todayCol);
    assert.ok(dg.col > g.byId.get('idpj-aud').col, 'depois da última estação da própria raia');
    const r1 = g.byId.get('gh|red|idpj|ef1'), r2 = g.byId.get('gh|red|idpj|ef2');
    assert.ok(r1 && r2);
    assert.equal(r1.col, r2.col, 'as duas redireções na mesma coluna');
    assert.ok(r1.col > dg.col);
    const c1 = edge(g, 'cond', dg.id, r1.id), c2 = edge(g, 'cond', dg.id, r2.id);
    assert.equal(c1.label, 'se procedente');
    assert.equal(c2.label, '', 'só a primeira seta leva o rótulo');
    assert.ok(g.nodes.filter(n => n.ghost).every(n => n.col >= g.todayCol));
  });
  it('decisão com desfecho registrado, incidente extinto ou raia que não é incidente: sem fantasma', () => {
    const l = (x) => [lane('idpj', { incident: 'idpj', ...x }), lane('ef1')];
    const lk = [{ type: 'cover', a: 'idpj', b: 'ef1' }];
    const decided = buildFrentesGraph({ lanes: l(), events: [ev('d', 'idpj', '2026-08-01', { sk: 'decisao', out: 'desfavoravel' })], links: lk, todayIso: TODAY });
    assert.equal(decided.nodes.some(n => n.ghost), false);
    const closed = buildFrentesGraph({ lanes: l({ closed: true }), events: [ev('x', 'idpj', '2026-08-01')], links: lk, todayIso: TODAY });
    assert.equal(closed.nodes.some(n => n.ghost), false);
    const plain = buildFrentesGraph({ lanes: [lane('a'), lane('b')], events: [ev('x', 'a', '2026-08-01')], links: [{ type: 'cover', a: 'a', b: 'b' }], todayIso: TODAY });
    assert.equal(plain.nodes.some(n => n.ghost), false);
  });
  it('decisão com data mas sem desfecho continua esperada', () => {
    const lanes = [lane('idpj', { incident: 'idpj' })];
    const g = buildFrentesGraph({ lanes, events: [ev('d', 'idpj', '2026-08-01', { sk: 'decisao', out: '' })], todayIso: TODAY });
    assert.ok(g.byId.has('gh|dec|idpj'));
  });
  it('MCF ganha a decisão esperada, mas não o pedido de redirecionamento (isso é do IDPJ)', () => {
    const lanes = [lane('mcf', { incident: 'mcf' }), lane('ef1')];
    const g = buildFrentesGraph({ lanes, events: [ev('a', 'mcf', '2026-08-01'), ev('b', 'ef1', '2026-07-01')], links: [{ type: 'cover', a: 'mcf', b: 'ef1' }], todayIso: TODAY });
    assert.ok(g.byId.get('gh|dec|mcf'));
    assert.equal(g.byId.get('gh|dec|mcf').label, 'Decisão final do MCF');
    assert.equal(g.nodes.some(n => n.id.indexOf('gh|red') === 0), false);
  });
  it('recurso com desfecho pendente ganha "Julgamento do recurso" na própria raia', () => {
    const g = buildFrentesGraph({ lanes: [lane('p')], events: [ev('rec', 'p', '2026-09-01', { sk: 'recurso1', out: 'pendente' }), ev('rec2', 'p', '2026-08-01', { sk: 'recurso2', out: 'provido' })], todayIso: TODAY });
    const gh = g.nodes.filter(n => n.ghost);
    assert.equal(gh.length, 1);
    assert.equal(gh[0].id, 'gh|rec|rec');
    assert.equal(gh[0].lane, 'p');
    assert.ok(gh[0].col > g.byId.get('rec').col);
    assert.ok(edge(g, 'lane', 'rec', gh[0].id).ghost);
  });
  it('o fantasma vem depois dos fatos de hoje em diante da própria raia, mesmo com fato futuro em outra raia mais adiante', () => {
    const lanes = [lane('idpj', { incident: 'idpj' }), lane('x')];
    const g = buildFrentesGraph({ lanes, events: [ev('i1', 'idpj', '2026-10-05'), ev('x1', 'x', '2027-01-01')], todayIso: TODAY });
    const dg = g.byId.get('gh|dec|idpj');
    assert.ok(dg.col > g.byId.get('i1').col);
    assert.ok(dg.col < g.byId.get('x1').col, 'o fantasma entra logo depois do último fato da raia, não no fim do mapa');
  });
});

describe('Arestas', () => {
  it('sequência: cada raia liga seus fatos em ordem de coluna', () => {
    const g = fachada();
    const seq = g.lanes.find(l => l.id === 'idpj').nodes;
    for (let i = 1; i < seq.length; i++) assert.ok(edge(g, 'lane', seq[i - 1], seq[i]));
    assert.equal(seq[seq.length - 1], 'gh|dec|idpj');
  });
  it('origem: do último fato do pai até o primeiro do filho, com o nome do vínculo', () => {
    const g = fachada();
    const f = edge(g, 'flow', 'idpj-lim', 'ai-dist');
    assert.ok(f, 'agravo nasce do último fato do IDPJ até a distribuição do agravo');
    assert.equal(f.label, 'agravo');
    const ex = g.edges.find(e => e.type === 'flow' && e.b === 'epe-dist');
    assert.equal(ex.a, 'ef1-dist', 'a exceção parte do último fato da EF-pai até aquela data');
    assert.equal(ex.label, 'exceção');
  });
  it('pai sem fato anterior ao do filho: sem seta de origem', () => {
    const g = buildFrentesGraph({ lanes: [lane('p'), lane('c')], events: [ev('p1', 'p', '2026-09-01'), ev('c1', 'c', '2026-01-01')], links: [{ type: 'parent', a: 'p', b: 'c', label: 'recurso' }], todayIso: TODAY });
    assert.equal(g.edges.some(e => e.type === 'flow'), false);
  });
  it('raia sem fatos datados não quebra nada', () => {
    const g = buildFrentesGraph({ lanes: [lane('p'), lane('c')], events: [ev('p1', 'p', '2026-09-01')], links: [{ type: 'parent', a: 'p', b: 'c' }], todayIso: TODAY });
    assert.equal(g.lanes[1].nodes.length, 0);
    assert.equal(g.edges.length, 0);
  });
  it('sem duplicar aresta e com índice de saída/entrada coerente', () => {
    const g = fachada();
    assert.equal(new Set(g.edges.map(e => e.id)).size, g.edges.length);
    g.edges.forEach(e => {
      assert.ok(g.out[e.a].includes(e));
      assert.ok(g.inn[e.b].includes(e));
    });
  });
});

describe('Cadeia (passar o mouse)', () => {
  it('a montante e a jusante, incluindo a própria estação', () => {
    const g = fachada();
    const up = frentesUpstream(g, 'idpj-lim');
    assert.ok(up.has('idpj-lim') && up.has('idpj-aj'));
    assert.equal(up.has('idpj-prazo'), false);
    const down = frentesDownstream(g, 'idpj-lim');
    ['fx|idpj-lim|ef1', 'fx|idpj-lim|ef2', 'idpj-prazo', 'idpj-aud', 'gh|dec|idpj', 'ai-dist'].forEach(id => assert.ok(down.has(id), id));
    assert.equal(down.has('idpj-aj'), false);
    const chain = frentesChain(g, 'idpj-lim');
    assert.ok(chain.has('idpj-aj') && chain.has('gh|red|idpj|ef1'));
  });
  it('estação desconhecida: conjunto vazio', () => {
    assert.equal(frentesChain(fachada(), 'nada').size, 0);
  });
  it('um ciclo hipotético não trava a travessia', () => {
    const g = fachada();
    const a = g.byId.get('idpj-aj').id, b = g.byId.get('idpj-lim').id;
    const back = { id: 'ed|x', a: b, b: a, type: 'flow', label: '', ghost: false, dep: true };
    g.out[b].push(back); g.inn[a] = (g.inn[a] || []).concat(back);
    assert.ok(frentesChain(g, a).has(b));
  });
});

describe('Caminho crítico', () => {
  it('parte dos fantasmas e junta, a montante, só o que está em aberto', () => {
    const g = fachada();
    const cp = frentesCriticalPath(g, TODAY);
    assert.deepEqual(cp.ids.map(id => g.byId.get(id).label), ['Manifestação', 'Audiência de justificação', 'Decisão final do IDPJ', 'Pedir redirecionamento', 'Pedir redirecionamento']);
    assert.equal(cp.set.has('idpj-lim'), false, 'o que já aconteceu fica de fora');
    assert.equal(cp.set.has('ef1-aud'), false, 'fato aberto de outra raia que não alimenta a decisão fica de fora');
    assert.equal(cp.set.has('cda1'), false);
  });
  it('a ordem é a das colunas', () => {
    const g = fachada();
    const cols = frentesCriticalPath(g, TODAY).ids.map(id => g.byId.get(id).col);
    assert.deepEqual(cols, cols.slice().sort((a, b) => a - b));
  });
  it('sem estação esperada não há caminho crítico (prazos e audiências soltos são agenda)', () => {
    const lanes = [lane('a'), lane('b')];
    const g = buildFrentesGraph({
      lanes, events: [ev('p1', 'a', '2026-05-01'), ev('p2', 'a', '2026-10-06', { kind: 'prazo', open: true }), ev('q', 'b', '2026-10-10', { kind: 'prazo', open: true })],
      todayIso: TODAY,
    });
    assert.deepEqual(frentesCriticalPath(g, TODAY).ids, []);
    assert.equal(frentesCriticalPath(null).ids.length, 0);
  });
  it('prazo vencido ainda conta como em aberto; o que já foi cumprido não', () => {
    const g = buildFrentesGraph({
      lanes: [lane('idpj', { incident: 'idpj' })],
      events: [ev('feito', 'idpj', '2026-08-01'), ev('v', 'idpj', '2026-09-20', { kind: 'prazo', open: true, late: true })],
      todayIso: TODAY,
    });
    assert.deepEqual(frentesCriticalPath(g, TODAY).ids, ['v', 'gh|dec|idpj']);
  });
});
