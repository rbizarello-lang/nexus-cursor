import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NH_MAX, nhSnapshot, nhKey, nhSame, nhPush, nhPop, nhPeek, nhLabel,
} from '../src/lib/navhist.js';

const snap = (o = {}) => nhSnapshot({ viewMode: 'hoje', ...o });
const opNames = { op1: 'Agro Horizonte', op2: 'Metal Norte' };
const ctx = {
  opName: (id) => opNames[id] || '',
  tabLabel: (t) => ({ visao: 'Visão geral', notas: 'Briefing', dividas: 'Inscrições', pessoas: 'Partes' }[t]),
};

describe('Histórico de navegação — foto da tela', () => {
  it('campos que não se aplicam à tela viram null (mexer neles não cria entrada em outra tela)', () => {
    const a = snap({ viewMode: 'hoje', activeOpId: 'op1', activeTab: 'notas', tlMode: 'frentes', prazosView: 'relogios', inscView: 'relogios' });
    const b = snap({ viewMode: 'hoje', activeOpId: 'op2', activeTab: 'visao', tlMode: 'narrativa', prazosView: 'mesa', inscView: 'tabela' });
    assert.ok(nhSame(a, b));
    assert.deepEqual(a, { vm: 'hoje', op: null, tab: null, tlOp: null, tlMode: null, prazos: null, insc: null, intim: null });
  });
  it('operação: guarda a operação e a aba; a visão das Inscrições só conta na aba Inscrições', () => {
    const a = snap({ viewMode: 'operation', activeOpId: 'op1', activeTab: 'notas', inscView: 'relogios' });
    const b = snap({ viewMode: 'operation', activeOpId: 'op1', activeTab: 'notas', inscView: 'tabela' });
    assert.ok(nhSame(a, b));
    assert.equal(a.insc, null);
    const c = snap({ viewMode: 'operation', activeOpId: 'op1', activeTab: 'dividas', inscView: 'relogios' });
    const d = snap({ viewMode: 'operation', activeOpId: 'op1', activeTab: 'dividas', inscView: 'tabela' });
    assert.equal(c.insc, 'relogios');
    assert.ok(!nhSame(c, d));
    assert.ok(!nhSame(a, snap({ viewMode: 'operation', activeOpId: 'op2', activeTab: 'notas' })));
  });
  it('Linha do tempo: modo e operação distinguem entradas; modo desconhecido cai em Panorama', () => {
    const a = snap({ viewMode: 'cx_timeline', tlOp: 'op1', tlMode: 'narrativa' });
    assert.ok(!nhSame(a, snap({ viewMode: 'cx_timeline', tlOp: 'op1', tlMode: 'frentes' })));
    assert.ok(!nhSame(a, snap({ viewMode: 'cx_timeline', tlOp: 'op2', tlMode: 'narrativa' })));
    assert.equal(snap({ viewMode: 'cx_timeline', tlMode: 'xyz' }).tlMode, 'panorama');
  });
  it('Prazos extintivos: Lista vem do modo da mesa; Mesa/Relógios, da visão local', () => {
    assert.equal(snap({ viewMode: 'prazos', prazosDeskMode: 'lista', prazosView: 'relogios' }).prazos, 'lista');
    assert.equal(snap({ viewMode: 'prazos', prazosDeskMode: 'mesa', prazosView: 'relogios' }).prazos, 'relogios');
    assert.equal(snap({ viewMode: 'prazos', prazosDeskMode: 'mesa' }).prazos, 'mesa');
  });
  it('Intimações: lista e foco são telas distintas', () => {
    assert.ok(!nhSame(snap({ viewMode: 'intimacoes', intimView: 'foco' }), snap({ viewMode: 'intimacoes', intimView: 'lista' })));
  });
  it('entrada vazia tem chave vazia; sem estado cai em Hoje', () => {
    assert.equal(nhKey(null), '');
    assert.equal(nhSnapshot().vm, 'hoje');
  });
});

describe('Histórico de navegação — pilha', () => {
  const E = (vm, extra = {}) => snap({ viewMode: vm, ...extra });
  it('empilha em ordem e desempilha o mais recente primeiro', () => {
    let st = [];
    st = nhPush(st, E('hoje'));
    st = nhPush(st, E('operacoes'));
    assert.equal(st.length, 2);
    assert.equal(nhPeek(st).vm, 'operacoes');
    const r = nhPop(st);
    assert.equal(r.entry.vm, 'operacoes');
    assert.equal(r.stack.length, 1);
    assert.equal(nhPop(r.stack).entry.vm, 'hoje');
    assert.deepEqual(nhPop([]), { stack: [], entry: null });
    assert.equal(nhPeek([]), null);
  });
  it('não empilha duplicata consecutiva nem entrada vazia, mas aceita a repetição não consecutiva', () => {
    let st = nhPush([], E('hoje'));
    st = nhPush(st, E('hoje'));
    st = nhPush(st, null);
    assert.equal(st.length, 1);
    st = nhPush(st, E('operacoes'));
    st = nhPush(st, E('hoje'));
    assert.deepEqual(st.map(e => e.vm), ['hoje', 'operacoes', 'hoje']);
  });
  it('mantém no máximo 20 entradas (as mais antigas caem)', () => {
    assert.equal(NH_MAX, 20);
    let st = [];
    for (let i = 0; i < 30; i++) st = nhPush(st, E('operation', { activeOpId: 'o' + i, activeTab: 'notas' }));
    assert.equal(st.length, 20);
    assert.equal(st[0].op, 'o10');
    assert.equal(nhPeek(st).op, 'o29');
  });
  it('é imutável: push e pop não alteram a pilha recebida', () => {
    const st = nhPush([], E('hoje'));
    const frozen = Object.freeze(st.slice());
    const a = nhPush(frozen, E('operacoes'));
    const b = nhPop(frozen);
    assert.equal(frozen.length, 1);
    assert.equal(a.length, 2);
    assert.equal(b.stack.length, 0);
  });
  it('simula a navegação: ir, ir, voltar, voltar', () => {
    let st = [], cur = E('hoje');
    const go = (next) => { if (!nhSame(cur, next)) { st = nhPush(st, cur); cur = next; } };
    const back = () => { const r = nhPop(st); st = r.stack; cur = r.entry; };
    go(E('operacoes'));
    go(E('operation', { activeOpId: 'op1', activeTab: 'visao' }));
    go(E('operation', { activeOpId: 'op1', activeTab: 'visao' })); // repetida: nada muda
    assert.equal(st.length, 2);
    back();
    assert.equal(cur.vm, 'operacoes');
    back();
    assert.equal(cur.vm, 'hoje');
    assert.equal(st.length, 0);
  });
});

describe('Histórico de navegação — rótulo do destino', () => {
  it('telas simples', () => {
    assert.equal(nhLabel(snap({ viewMode: 'hoje' }), ctx), 'Hoje');
    assert.equal(nhLabel(snap({ viewMode: 'operacoes' }), ctx), 'Carteira');
    assert.equal(nhLabel(snap({ viewMode: 'audiencias' }), ctx), 'Agenda');
    assert.equal(nhLabel(snap({ viewMode: 'intimacoes', intimView: 'foco' }), ctx), 'Intimações · Foco');
    assert.equal(nhLabel(snap({ viewMode: 'intimacoes' }), ctx), 'Intimações');
  });
  it('operação e aba, com a visão das Inscrições', () => {
    assert.equal(nhLabel(snap({ viewMode: 'operation', activeOpId: 'op1', activeTab: 'notas' }), ctx), 'Agro Horizonte · Briefing');
    assert.equal(nhLabel(snap({ viewMode: 'operation', activeOpId: 'op1', activeTab: 'visao' }), ctx), 'Agro Horizonte · Visão geral');
    assert.equal(nhLabel(snap({ viewMode: 'operation', activeOpId: 'op2', activeTab: 'dividas', inscView: 'relogios' }), ctx), 'Metal Norte · Inscrições · Relógios');
    assert.equal(nhLabel(snap({ viewMode: 'operation', activeOpId: 'zz', activeTab: 'notas' }), ctx), 'Operação · Briefing');
  });
  it('Linha do tempo e Prazos extintivos trazem o modo', () => {
    assert.equal(nhLabel(snap({ viewMode: 'cx_timeline', tlOp: 'op1', tlMode: 'narrativa' }), ctx), 'Linha do tempo · Agro Horizonte · Narrativa');
    assert.equal(nhLabel(snap({ viewMode: 'cx_timeline', tlMode: 'frentes' }), {}), 'Linha do tempo · Frentes');
    assert.equal(nhLabel(snap({ viewMode: 'prazos', prazosView: 'relogios' }), ctx), 'Prazos extintivos · Relógios');
    assert.equal(nhLabel(snap({ viewMode: 'prazos', prazosDeskMode: 'lista' }), ctx), 'Prazos extintivos · Lista');
  });
  it('entrada vazia dá texto vazio', () => { assert.equal(nhLabel(null, ctx), ''); });
});
