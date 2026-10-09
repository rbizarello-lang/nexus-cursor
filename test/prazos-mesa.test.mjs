import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UI_FORBIDDEN, buildPrazosRadar, createPrescLookup } from '../src/lib/prescription.js';
import {
  MESA_CAP,
  mesaCertainty,
  mesaNeedsYou,
  splitMesaRows,
  groupMesaRows,
  formatPrescHorizon,
  betaCdaPrescText,
  betaCdaClosedLine,
  mesaDrawerItems,
  countSnoozeDueThisWeek,
  snoozeMaxUntil,
  betaSafeUiText,
  betaEventFamilyLabel,
  MESA_CARDS,
  AJUIZAR_DIAS,
  AJUIZAR_JANELA,
  PENHORA_SEM_PRESSA_ANOS,
  buildMesaCards,
  mesaTotalsOf,
  mesaActionCount,
  mesaIsAction,
  mesaItemClock,
  mesaSnoozeLabel,
  mesaLiteInfo,
  MESA_FILTER_DEFAULTS,
  parseMesaMinVal,
  formatMesaMinVal,
  mesaItemNature,
  mesaItemIdpj,
  filterMesaItems,
  filterMesaCards,
  mesaCedoCount,
  mesaHasCut,
  mesaActiveFilters,
  mesaRemovePatch,
  mesaResetPatch,
  mesaClearAllPatch,
  MESA_TRATAR_FORMAS,
  mesaCanSnooze,
  mesaCanTratar,
  mesaPrimaryAction,
  captureUndo,
  applyUndo,
  mesaFormatCnj,
  mesaCnjCheck,
  mesaPlanAjuizar,
  mesaCardName,
  mesaDestText,
  mesaCdaCount,
  mesaSelectionTotals,
  mesaBatchCan,
  mesaSnoozeMaxFor,
  mesaDadoCampos,
} from '../src/lib/prazos-mesa.js';

describe('Mesa — seleção PRECISA DE VOCÊ', () => {
  it('G1 entra sempre; G2 só com estimativa já passada; G3 de um clique; reviewAt vencido', () => {
    assert.equal(mesaNeedsYou({ group: 1, prescKind: 'iminente', prescDays: 10 }, '2026-09-18'), true);
    assert.equal(mesaNeedsYou({ group: 2, prescKind: 'vencido_estimado', prescDays: -3 }, '2026-09-18'), true);
    assert.equal(mesaNeedsYou({ group: 2, prescKind: 'residual_alta', prescDays: 40 }, '2026-09-18'), false);
    assert.equal(mesaNeedsYou({ group: 3, action: { type: 'criar_evento', eventType: 'susp_parcelamento' } }, '2026-09-18'), true);
    assert.equal(mesaNeedsYou({ group: 3, action: { type: 'conferir_autos' } }, '2026-09-18'), false);
    assert.equal(mesaNeedsYou({ group: 4, reviewAt: '2026-09-01', action: { type: 'nenhuma' } }, '2026-09-18'), true);
    assert.equal(mesaNeedsYou({ group: 4, reviewAt: '2026-12-01' }, '2026-09-18'), false);
  });

  it('sem teto: mostra todas; ordem pela data cedo e, no empate, pelo maior valor', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ id: 'd' + i, group: 1, prescDays: -i, prescDate: '2026-09-' + String(15 - (i % 5)).padStart(2, '0'), value: i }));
    const split = splitMesaRows(rows, '2026-09-18');
    assert.equal(MESA_CAP, Infinity);
    assert.equal(split.needsYou.length, 15);
    assert.equal(split.overCap.length, 0);
    assert.equal(split.needsYou[0].prescDate, '2026-09-11');
    assert.equal(split.needsYou[0].id, 'd14');
    assert.equal(split.needsYou[1].id, 'd9');
  });

  it('penhora antiga fica na lista própria; pedido de dado precisa de você', () => {
    const split = splitMesaRows([
      { id: 'p', group: 7, prescKind: 'penhora_antiga' },
      { id: 'q', group: 3, prescKind: 'pedido_dado', action: { type: 'conferir_autos' }, prescDate: '2026-11-01' }
    ], '2026-09-18');
    assert.deepEqual(split.penhoraAntiga.map(r => r.id), ['p']);
    assert.deepEqual(split.needsYou.map(r => r.id), ['q']);
  });

  it('agrupa a intercorrente por execução e a ordinária por CDA', () => {
    const groups = groupMesaRows([
      { id: 'a', prescSegment: 'intercorrente', executionId: 'e1', operationId: 'op', prescDate: '2026-10-01', value: 10, group: 1 },
      { id: 'b', prescSegment: 'intercorrente', executionId: 'e1', operationId: 'op', prescDate: '2026-10-01', value: 30, group: 1 },
      { id: 'c', prescSegment: 'ordinaria', operationId: 'op', prescDate: '2026-09-20', value: 5, group: 1 },
      { id: 'd', prescSegment: 'ordinaria', operationId: 'op', prescDate: '2026-12-20', value: 5, group: 3 }
    ]);
    assert.deepEqual(groups.map(g => g.type), ['cda', 'execucao', 'cda']);
    assert.deepEqual(groups[1].rows.map(r => r.id), ['b', 'a']);
    assert.equal(groups[1].value, 40);
  });

  it('G5 some do resto (vai para a gaveta)', () => {
    const split = splitMesaRows([
      { id: 'a', group: 4, reviewAt: '2027-01-01' },
      { id: 'b', group: 5, prescKind: 'acompanhar_piso' }
    ], '2026-09-18');
    assert.equal(split.rest.map(r => r.id).join(), 'a');
    assert.equal(split.hiddenG5.map(r => r.id).join(), 'b');
  });
});

describe('Mesa — selos e frases', () => {
  it('certeza deriva do kind/grupo', () => {
    assert.equal(mesaCertainty({ prescKind: 'vencido', group: 1 }), 'calculado');
    assert.equal(mesaCertainty({ prescKind: 'vencido_estimado', group: 2 }), 'estimado');
    assert.equal(mesaCertainty({ prescKind: 'inconsistencia', group: 3 }), 'cadastro');
  });

  it('horizonte acima de 730 dias vira anos', () => {
    assert.equal(formatPrescHorizon(-800), 'há 2 anos');
    assert.equal(formatPrescHorizon(1100), 'em 3 anos');
    assert.equal(formatPrescHorizon(10), '10d');
    assert.equal(formatPrescHorizon(-5), 'há 5d');
  });

  it('linha da CDA nunca é travessão; tratada e conflito têm frases próprias', () => {
    assert.equal(betaCdaPrescText({ prescriptionHandled: true, prescriptionHandledType: 'declarada', prescriptionHandledAt: '2026-01-15' }), 'Tratada em 15/01/2026');
    assert.match(
      betaCdaPrescText(
        { prescriptionDate: '2027-01-26' },
        { informedConflict: true, prescDate: '2031-08-14', prescKind: 'inconsistencia', why: 'x' }
      ),
      /Ficha 26\/01\/2027 · app 14\/08\/2031 — conferir/
    );
    const line = betaCdaPrescText({}, { why: 'pausado · parcelamento', prescKind: 'pausa_cadastrada', group: 4 });
    assert.equal(line.includes('—'), false);
    assert.match(line, /pausado/);
    const est = betaCdaPrescText({}, { why: 'Prescrita no cadastro', prescKind: 'vencido_estimado', group: 2, prescDays: -10 });
    assert.equal(/Prescrita/i.test(est), false);
  });

  it('linha fechada Beta: STATUS — situação — data; omite data se o ciclo não tem termo', () => {
    const emCurso = betaCdaClosedLine(
      { status: 'ativa' },
      { prescKind: 'correndo', prescSegment: 'intercorrente', prescDate: '2029-11-29', prescDays: 1100 },
      null,
      'Ativa',
      { segment: 'intercorrente', phase: 'correndo', diesAdQuem: '2029-11-29' }
    );
    assert.equal(emCurso.fullText, 'ATIVA — prescrição intercorrente em curso — 29/11/2029');
    assert.match(emCurso.status, /ATIVA/);

    const interrompida = betaCdaClosedLine(
      { status: 'ativa' },
      { prescKind: 'vigiar_interrompido', prescSegment: 'intercorrente', interruptAt: '2024-01-10' },
      null,
      'Ativa',
      { segment: 'intercorrente', phase: 'interrompido', interruptAt: '2024-01-10', timeline: [{ phase: 'interrompido', type: 'int_penhora' }] }
    );
    assert.equal(interrompida.fullText, 'ATIVA — prescrição intercorrente interrompida por penhora');
    assert.equal(interrompida.dateLabel, '');

    const naoIniciada = betaCdaClosedLine(
      { status: 'ativa' },
      { prescKind: 'residual_media', noCiencia: true, prescSegment: 'intercorrente' },
      null,
      'Ativa',
      { segment: 'intercorrente', phase: 'nao_iniciado' }
    );
    assert.equal(naoIniciada.fullText, 'ATIVA — prescrição intercorrente ainda não iniciada');
  });

  it('texto da UI Beta não usa o jargão proibido', () => {
    const raw = 'Tema 566/568 e Súmula 314: o piso e o teto do dies / marco CENÁRIO política';
    const out = betaSafeUiText(raw);
    assert.equal(UI_FORBIDDEN.test(out), false);
    assert.equal(betaEventFamilyLabel({ id: 'resultado_util', label: 'Resultado útil — interrompe' }, true), 'Constrição no incidente (interrompe as EFs)');
    assert.equal(betaEventFamilyLabel({ id: 'marco', label: 'Marco do art. 40 — ciência' }, false), 'Ciência do art. 40');
    assert.equal(UI_FORBIDDEN.test(betaEventFamilyLabel({ id: 'marco', label: 'Marco do art. 40 — ciência' }, false)), false);
  });
});

describe('Mesa — gaveta e adiamento', () => {
  it('gaveta junta silenciados + silenceReason + G5', () => {
    const items = mesaDrawerItems({
      silenced: [{ debtId: 's1', reason: 'peca_protocolada', until: '2026-10-01', label: 'Peça protocolada', group: 2 }],
      rows: [
        { id: 's1', group: 2 },
        { id: 'a', group: 4, silenceReason: 'aguardando_reconhecimento', why: 'aguarda decisão' },
        { id: 'g', group: 5, why: 'ainda não pode' }
      ]
    });
    assert.equal(items.length, 3);
    assert.equal(items.filter(i => i.canReopen).length, 1);
  });

  it('conta adiamentos que vencem nesta semana', () => {
    const n = countSnoozeDueThisWeek([
      { debtId: 'a', until: '2026-09-20', reason: 'peca_protocolada' },
      { debtId: 'b', until: '2026-11-01', reason: 'peca_protocolada' }
    ], '2026-09-18');
    assert.equal(n, 1);
  });

  it('validade do adiamento respeita o teto do grupo', () => {
    assert.equal(snoozeMaxUntil(1, '2026-09-18'), '2026-10-02');
    assert.equal(snoozeMaxUntil(3, '2026-09-18'), '2026-09-25');
  });
});

describe('Mesa — cartões (fase 1): uma CDA, um cartão', () => {
  const TODAY = '2026-09-17';
  const OP = { id: 'op1', name: 'Op', status: 'ativa' };
  const debt = (id, over = {}) => ({ id, operationId: 'op1', status: 'ativa', value: 100, ...over });
  const row = (id, over = {}) => ({
    id, group: 4, value: 100, prescKind: 'correndo', prescSegment: 'intercorrente',
    action: { type: 'nenhuma' }, ...over
  });
  // prescLookup falso: devolve o resultado combinado por id (ou sem dados).
  const mk = ({ debts, rows = [], silenced = [], results = {}, ops = [OP] }) => {
    const lookup = d => results[d.id] || { segment: null, phase: 'sem_dados', status: 'sem_dados' };
    return buildMesaCards({
      data: { debts, operations: ops, executions: [], prescriptionEvents: [] },
      radar: { rows, silenced },
      prescLookup: lookup,
      today: TODAY
    });
  };
  const cardOf = (out, id) => out.byDebt.get(id).card;

  it('exporta os dez cartões na ordem de trabalho, em duas fileiras', () => {
    assert.deepEqual(MESA_CARDS.map(c => c.id),
      ['calculo', 'ajuizar', 'fato', 'vigencia', 'dado', 'sempressa', 'vigiar', 'adiadas', 'tratadas', 'antigas']);
    assert.deepEqual(MESA_CARDS.map(c => c.fileira), [1, 1, 1, 1, 1, 2, 2, 2, 2, 2]);
    assert.ok(MESA_CARDS.every(c => c.nome && c.tip));
    assert.equal(AJUIZAR_DIAS, 60);
    assert.equal(AJUIZAR_JANELA, 180);
    assert.equal(PENHORA_SEM_PRESSA_ANOS, 4);
  });

  it('universo: fora extinta e operação encerrada', () => {
    const out = mk({
      debts: [debt('a'), debt('b', { status: 'extinta' }), debt('c', { operationId: 'op2' })],
      ops: [OP, { id: 'op2', status: 'encerrada' }]
    });
    assert.deepEqual(out.items.map(i => i.debtId), ['a']);
  });

  it('regra 1: tratada (inclusive aguardando reconhecimento e analisada) vence consumada e adiamento', () => {
    const out = mk({
      debts: [
        debt('t1', { prescriptionHandled: true, prescriptionHandledType: 'declarada', prescriptionHandledAt: '2026-01-01' }),
        debt('t2', { prescriptionHandled: true, prescriptionHandledType: 'analisada_nao_consumada' }),
        debt('t3'),
        debt('t4', { prescriptionHandled: true })
      ],
      rows: [
        row('t2', { prescKind: 'vencido', group: 1, consumada: 'recent' }),
        row('t3', { prescKind: 'aguardando_reconhecimento', group: 4 }),
        row('t4', { prescKind: 'vencido_estimado', group: 6, consumada: 'old' })
      ],
      silenced: [{ debtId: 't1', reason: 'peca_protocolada', until: '2026-10-01' }]
    });
    ['t1', 't2', 't3', 't4'].forEach(id => assert.equal(cardOf(out, id), 'tratadas', id));
  });

  it('regra 2: adiada some da ação; adiamento furado volta ao cartão da ação com snoozeExpired', () => {
    const out = mk({
      debts: [debt('s1'), debt('s2', { prescSnooze: { reason: 'peca_protocolada', until: '2026-09-01' } })],
      rows: [row('s2', { prescKind: 'vencido', group: 1, prescDays: -3, prescDate: '2026-09-14', action: { type: 'conferir_autos' } })],
      silenced: [{ debtId: 's1', reason: 'outro', until: '2026-10-05', label: 'Outro' }]
    });
    assert.equal(cardOf(out, 's1'), 'adiadas');
    assert.equal(out.byDebt.get('s1').until, '2026-10-05');
    assert.equal(out.byDebt.get('s1').snoozeExpired, false);
    assert.equal(cardOf(out, 's2'), 'fato');
    assert.equal(out.byDebt.get('s2').snoozeExpired, true);
  });

  it('regra 3a-d: conferir sem pressa; d vence consumada old', () => {
    const penhoraResult = (constr) => ({
      segment: 'intercorrente', phase: 'interrompido', interruptVia: 'int_penhora', interruptAt: constr, interruptEffAt: constr
    });
    const out = mk({
      debts: [debt('a'), debt('b'), debt('b2'), debt('b3'), debt('c'), debt('d'), debt('d2')],
      rows: [
        row('a', { prescKind: 'penhora_antiga', group: 7 }),
        row('b', { prescKind: 'vigiar_interrompido' }),
        row('b2', { prescKind: 'vigiar_interrompido' }),
        row('b3', { prescKind: 'vigiar_interrompido' }),
        row('c', { idpjNotice: { active: true } }),
        row('d', { prescKind: 'residual_alta', group: 6, consumada: 'old', prescLabel: 'Data "não antes de" já passou há mais de 2 anos sem evento datado' }),
        row('d2', { prescKind: 'residual_alta', group: 2, prescLabel: 'Previsão de planilha, sem ciência lançada' })
      ],
      results: { b: penhoraResult('2022-09-17'), b2: penhoraResult('2022-09-18'), b3: penhoraResult('2020-01-01') }
    });
    assert.equal(cardOf(out, 'a'), 'sempressa');
    assert.equal(cardOf(out, 'b'), 'sempressa'); // 4 anos exatos hoje
    assert.equal(cardOf(out, 'b2'), 'vigiar'); // faltam 1 dia
    assert.equal(cardOf(out, 'c'), 'sempressa');
    assert.equal(cardOf(out, 'd'), 'sempressa');
    assert.equal(cardOf(out, 'd2'), 'vigiar'); // sem a frase, grupo 2 não precisa de você sem ação
    assert.equal(out.byDebt.get('d').row.consumada, 'old');
    // 3b com análise vigente (menos de 365 dias) não entra; vencida volta a entrar
    const vig = mk({
      debts: [debt('b3', { penhoraAnalise: { at: '2026-03-01' } }), debt('b4', { penhoraAnalise: { at: '2025-09-01' } })],
      rows: [row('b3', { prescKind: 'vigiar_interrompido' }), row('b4', { prescKind: 'vigiar_interrompido' })],
      results: { b3: penhoraResult('2020-01-01'), b4: penhoraResult('2020-01-01') }
    });
    assert.equal(cardOf(vig, 'b3'), 'vigiar');
    assert.equal(cardOf(vig, 'b4'), 'sempressa');
  });

  it('regras 4 e 5: antigas, e consumada recente só em «calculo» (sem dupla contagem)', () => {
    const out = mk({
      debts: [debt('o'), debt('r'), debt('n')],
      rows: [
        row('o', { prescKind: 'vencido', group: 6, consumada: 'old', alertGroup: 1 }),
        row('r', { prescKind: 'vencido', group: 1, consumada: 'recent', prescSegment: 'ordinaria' }),
        row('n', { prescKind: 'correndo', group: 4, decisionNote: 'Análise importada diverge do cálculo' })
      ]
    });
    assert.equal(cardOf(out, 'o'), 'antigas');
    assert.equal(cardOf(out, 'r'), 'calculo');
    assert.equal(cardOf(out, 'n'), 'calculo');
    assert.equal(out.totals.calculo.n, 2);
    assert.equal(out.totals.antigas.n, 1);
    assert.equal(out.totals.ajuizar.n + out.totals.ajuizar.nLonge, 0);
  });

  it('regra 6: ordinária por ação', () => {
    const o = (id, type, kind = 'vencido') => row(id, { prescSegment: 'ordinaria', prescKind: kind, group: 1, action: { type } });
    const out = mk({
      debts: ['v', 'e', 'a1', 'a2', 'a3'].map(id => debt(id)),
      rows: [
        o('v', 'confirmar_vigencia', 'pausa_cadastrada'),
        o('e', 'vincular_ef', 'inconsistencia'),
        o('a1', 'conferir_autos', 'iminente'),
        o('a2', 'nenhuma', 'vencido_estimado'),
        o('a3', 'corrigir_ficha', 'pedido_dado')
      ]
    });
    assert.equal(cardOf(out, 'v'), 'vigencia');
    assert.equal(cardOf(out, 'e'), 'dado');
    assert.equal(cardOf(out, 'a1'), 'ajuizar');
    assert.equal(cardOf(out, 'a2'), 'ajuizar');
    assert.equal(cardOf(out, 'a3'), 'ajuizar');
  });

  it('regra 7: intercorrente por ação, só se precisa de você', () => {
    const g1 = (id, type) => row(id, { group: 1, prescKind: 'vencido', action: { type } });
    const out = mk({
      debts: ['v', 'd1', 'd2', 'f1', 'f2', 'f3', 'nn'].map(id => debt(id)),
      rows: [
        g1('v', 'confirmar_vigencia'), g1('d1', 'corrigir_ficha'), g1('d2', 'vincular_ef'),
        g1('f1', 'lancar_ciencia'), g1('f2', 'criar_evento'), g1('f3', 'conferir_autos'),
        row('nn', { group: 4, prescKind: 'vigiar_interrompido', action: { type: 'lancar_ciencia' } }) // não precisa de você
      ]
    });
    assert.equal(cardOf(out, 'v'), 'vigencia');
    assert.equal(cardOf(out, 'd1'), 'dado');
    assert.equal(cardOf(out, 'd2'), 'dado');
    ['f1', 'f2', 'f3'].forEach(id => assert.equal(cardOf(out, id), 'fato'));
    assert.equal(cardOf(out, 'nn'), 'vigiar');
  });

  it('regras 8 e 9: resto do grupo 3 vai a «dado»; linha restante a «vigiar»', () => {
    const out = mk({
      debts: [debt('g3'), debt('rest')],
      rows: [
        row('g3', { group: 3, prescKind: 'correndo', action: { type: 'conferir_autos' } }),
        row('rest', { group: 4, prescKind: 'pausa_cadastrada', action: { type: 'confirmar_vigencia' } })
      ]
    });
    assert.equal(cardOf(out, 'g3'), 'dado');
    assert.equal(cardOf(out, 'rest'), 'vigiar');
  });

  it('regra 10: sem linha', () => {
    const credito = (dias, extra = {}) => {
      const [y, m, d] = TODAY.split('-').map(Number);
      const iso = new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
      return { segment: 'credito', phase: 'originario', status: 'critico', diesAdQuem: iso, daysLeft: dias, ...extra };
    };
    const out = mk({
      debts: ['p', 'pf', 'o30', 'o100', 'o400', 'ocedo', 'sd', 'int'].map(id => debt(id)),
      silenced: [
        { debtId: 'p', reason: 'parcelamento_vigente', until: '2027-01-01' },
        { debtId: 'pf', reason: 'parcelada_ficha', until: '' }
      ],
      results: {
        o30: credito(30),
        o100: credito(100),
        o400: credito(400),
        ocedo: credito(400, { band: { cedo: { diesAdQuem: '2026-10-17' }, tarde: { diesAdQuem: '2027-10-17' } } }),
        int: { segment: 'intercorrente', phase: 'correndo', status: 'alerta', diesAdQuem: '2031-01-01' }
      }
    });
    assert.equal(cardOf(out, 'p'), 'vigiar');
    assert.equal(cardOf(out, 'pf'), 'vigiar');
    assert.equal(cardOf(out, 'o30'), 'ajuizar');
    assert.equal(out.byDebt.get('o30').derived, true);
    assert.equal(out.byDebt.get('o30').ajuizarLonge, false);
    assert.equal(cardOf(out, 'o100'), 'ajuizar');
    assert.equal(out.byDebt.get('o100').ajuizarLonge, true);
    assert.equal(cardOf(out, 'o400'), 'vigiar');
    assert.equal(out.byDebt.get('o400').derived, false);
    assert.equal(cardOf(out, 'ocedo'), 'ajuizar'); // pela data cedo da faixa
    assert.equal(out.byDebt.get('ocedo').ajuizarLonge, false);
    assert.equal(cardOf(out, 'sd'), 'dado');
    assert.equal(cardOf(out, 'int'), 'vigiar');
    // n de ajuizar exclui as longe
    assert.equal(out.totals.ajuizar.n, 2);
    assert.equal(out.totals.ajuizar.nLonge, 1);
    assert.equal(out.byCard.ajuizar.length, 3);
  });

  it('ajuizar vindo de linha: longe quando a data de posição passa de 60 dias', () => {
    const out = mk({
      debts: [debt('n1'), debt('n2')],
      rows: [
        row('n1', { prescSegment: 'ordinaria', prescKind: 'iminente', group: 1, prescDate: '2026-10-10', action: { type: 'conferir_autos' } }),
        row('n2', { prescSegment: 'ordinaria', prescKind: 'iminente', group: 1, prescDate: '2026-12-31', action: { type: 'conferir_autos' } })
      ]
    });
    assert.equal(out.byDebt.get('n1').ajuizarLonge, false);
    assert.equal(out.byDebt.get('n2').ajuizarLonge, true);
    assert.equal(out.totals.ajuizar.n, 1);
    assert.equal(out.totals.ajuizar.nLonge, 1);
  });

  it('data de posição: cedo venceu e tarde não ordena pela tarde; sem tarde vai ao fim; só prazos mostram data', () => {
    const ord = (id, over) => row(id, {
      prescSegment: 'ordinaria', prescKind: 'vencido_estimado', group: 2, action: { type: 'conferir_autos' }, ...over
    });
    const out = mk({
      debts: ['a', 'b', 'c', 'd', 'e'].map(id => debt(id, { value: id === 'c' ? 900 : 100 })),
      rows: [
        ord('a', { value: 100, prescDate: '2026-12-01', keyDate: '2026-12-01' }),
        ord('b', { value: 100, prescDate: '2026-05-01', bandCedo: '2026-05-01', bandTarde: '2026-11-01' }),
        ord('c', { value: 900, prescDate: '2026-06-01', bandCedo: '2026-06-01', bandTarde: '' }),
        ord('d', { value: 100, prescDate: '2026-05-01', bandCedo: '2026-05-01', bandTarde: '2026-07-01', consumada: 'recent' }),
        row('e', { prescKind: 'vigiar_interrompido', group: 1, action: { type: 'conferir_autos' }, prescDate: '2020-01-01', keyDate: '2020-01-01' })
      ]
    });
    const b = out.byDebt.get('b');
    assert.equal(b.cedoVencidaTardeNao, true);
    assert.equal(b.sortDate, '2026-11-01');
    const c = out.byDebt.get('c');
    assert.equal(c.cedoVencidaTardeNao, true);
    assert.equal(c.sortDate, null);
    assert.equal(out.byDebt.get('d').cedoVencidaTardeNao, false); // tarde também venceu
    assert.equal(out.byDebt.get('d').card, 'calculo');
    assert.equal(out.byDebt.get('e').sortDate, null);
    assert.equal(out.byDebt.get('e').dateIsDeadline, false);
    assert.equal(out.byDebt.get('a').dateIsDeadline, true);
    // ajuizar: b (tarde 01/11), a (01/12), depois c (sem data)
    assert.deepEqual(out.byCard.ajuizar.map(i => i.debtId), ['b', 'a', 'c']);
  });

  it('ordem: adiadas por retorno, tratadas por tratamento recente, antigas por data recente, vigiar por valor', () => {
    const out = mk({
      debts: [
        debt('s1'), debt('s2'), debt('s3'),
        debt('t1', { prescriptionHandled: true, prescriptionHandledAt: '2026-01-01' }),
        debt('t2', { prescriptionHandled: true, prescriptionHandledAt: '2026-06-01' }),
        debt('o1'), debt('o2'),
        debt('v1', { value: 10 }), debt('v2', { value: 500 }), debt('v3', { value: 50 })
      ],
      silenced: [
        { debtId: 's1', reason: 'peca_protocolada', until: '2026-11-01' },
        { debtId: 's2', reason: 'peca_protocolada', until: '2026-10-01' },
        { debtId: 's3', reason: 'outro', until: '2026-10-20' }
      ],
      rows: [
        row('o1', { prescKind: 'vencido', group: 6, consumada: 'old', prescDate: '2024-01-01' }),
        row('o2', { prescKind: 'vencido', group: 6, consumada: 'old', prescDate: '2025-01-01' }),
        row('v1', {}), row('v2', {}), row('v3', {})
      ]
    });
    assert.deepEqual(out.byCard.adiadas.map(i => i.debtId), ['s2', 's3', 's1']);
    assert.deepEqual(out.byCard.tratadas.map(i => i.debtId), ['t2', 't1']);
    assert.deepEqual(out.byCard.antigas.map(i => i.debtId), ['o2', 'o1']);
    assert.deepEqual(out.byCard.vigiar.map(i => i.debtId), ['v2', 'v3', 'v1']);
  });

  it('bloco com data antes do bloco sem data; empate e sem data por maior valor', () => {
    const f = (id, over) => row(id, { group: 1, prescKind: 'vencido', action: { type: 'conferir_autos' }, ...over });
    const out = mk({
      debts: [debt('a', { value: 5 }), debt('b', { value: 50 }), debt('c', { value: 1 }), debt('d', { value: 80 })],
      rows: [
        f('a', { value: 5, prescDate: '2026-09-10' }),
        f('b', { value: 50, prescDate: '2026-09-10' }),
        f('c', { value: 1, prescDate: '2026-09-01' }),
        f('d', { value: 80, prescKind: 'vigiar_interrompido', group: 1 })
      ]
    });
    assert.deepEqual(out.byCard.fato.map(i => i.debtId), ['c', 'b', 'a', 'd']);
  });

  it('soma dos totals = CDAs do universo (motor real, sem dupla contagem)', () => {
    const asOf = '2026-09-17';
    const mkD = (id, ins, over = {}) => ({ id, operationId: 'op1', status: 'ativa', inscriptionDate: ins, value: 100, ...over });
    const debts = [
      mkD('rec', '2021-08-01'),                // consumada recente, ordinária
      mkD('hoje', '2021-09-17'),               // vence hoje
      mkD('o30', '2021-10-17'),                // 30 dias
      mkD('o100', '2021-12-26'),               // 100 dias
      mkD('o165', '2022-03-01'),               // 165 dias
      mkD('o471', '2023-01-01'),               // longe
      mkD('ef', '2015-01-01', { processNumber: '50011111120154047000' }),
      mkD('ef2', '2016-01-01', { processNumber: '50011111120164047000' }),
      mkD('tr', '2015-01-01', { prescriptionHandled: true, prescriptionHandledType: 'declarada' }),
      mkD('ex', '2015-01-01', { status: 'extinta' }),
      mkD('snz', '2021-08-01', { prescSnooze: { reason: 'peca_protocolada', until: '2026-10-05', at: '2026-09-10', group: 1 } }),
      mkD('sd', '')
    ];
    const executions = [
      { id: 'e1', processNumber: '50011111120154047000', protocolDate: '2016-01-01', operationId: 'op1' },
      { id: 'e2', processNumber: '50011111120164047000', protocolDate: '2017-01-01', operationId: 'op1', status: 'arquivada' }
    ];
    const events = [{ id: 'm', executionId: 'e1', type: 'marco_sem_bens', date: '2018-01-01' }];
    const data = { operations: [OP], debts, executions, prescriptionEvents: events, people: [] };
    const lookup = createPrescLookup(debts, executions, events, asOf);
    const radar = buildPrazosRadar(data, asOf, lookup, { policy: 'v2' });
    const out = buildMesaCards({ data, radar, prescLookup: lookup, today: asOf });
    const universo = debts.filter(d => d.status !== 'extinta').length;
    assert.equal(out.items.length, universo);
    assert.equal(new Set(out.items.map(i => i.debtId)).size, universo);
    const soma = Object.values(out.totals).reduce((s, t) => s + t.n + (t.nLonge || 0), 0);
    assert.equal(soma, universo);
    const somaCards = Object.values(out.byCard).reduce((s, l) => s + l.length, 0);
    assert.equal(somaCards, universo);
    assert.equal(out.byDebt.get('rec').card, 'calculo');
    assert.equal(out.byDebt.get('o30').card, 'ajuizar');
    assert.equal(out.byDebt.get('o30').ajuizarLonge, false);
    assert.equal(out.byDebt.get('o100').card, 'ajuizar');
    assert.equal(out.byDebt.get('o100').derived, true);
    assert.equal(out.byDebt.get('o100').ajuizarLonge, true);
    assert.equal(out.byDebt.get('o165').ajuizarLonge, true);
    assert.equal(out.byDebt.get('o471').card, 'vigiar');
    assert.equal(out.byDebt.get('tr').card, 'tratadas');
    assert.equal(out.byDebt.get('snz').card, 'adiadas');
    assert.equal(out.totals.ajuizar.n, out.byCard.ajuizar.filter(i => !i.ajuizarLonge).length);
  });
});

describe('mesaActionCount / mesaTotalsOf', () => {
  it('soma só a fileira 1 e deixa de fora o Ajuizar longe', () => {
    const totals = {
      calculo: { n: 2, value: 20 },
      ajuizar: { n: 3, value: 30, nLonge: 9, valueLonge: 900 },
      fato: { n: 4, value: 40 },
      vigencia: { n: 1, value: 10 },
      dado: { n: 5, value: 50 },
      sempressa: { n: 100, value: 1000 },
      vigiar: { n: 100, value: 1000 },
      adiadas: { n: 100, value: 1000 },
      tratadas: { n: 100, value: 1000 },
      antigas: { n: 100, value: 1000 }
    };
    assert.deepEqual(mesaActionCount(totals), { n: 15, value: 150 });
    assert.deepEqual(mesaActionCount({}), { n: 0, value: 0 });
    assert.deepEqual(mesaActionCount(null), { n: 0, value: 0 });
  });

  it('mesaTotalsOf refaz os totais de qualquer subconjunto de itens', () => {
    const items = [
      { card: 'ajuizar', ajuizarLonge: false, value: 10 },
      { card: 'ajuizar', ajuizarLonge: true, value: 5 },
      { card: 'dado', ajuizarLonge: false, value: 7 },
      { card: 'tratadas', value: 1 }
    ];
    const t = mesaTotalsOf(items);
    assert.deepEqual(t.ajuizar, { n: 1, value: 10, nLonge: 1, valueLonge: 5 });
    assert.deepEqual(t.dado, { n: 1, value: 7, nLonge: 0, valueLonge: 0 });
    assert.deepEqual(t.calculo, { n: 0, value: 0, nLonge: 0, valueLonge: 0 });
    assert.deepEqual(mesaActionCount(t), { n: 2, value: 17 });
  });

  it('com buildMesaCards: mesaTotalsOf(items) = totals', () => {
    const data = { operations: [{ id: 'op1', name: 'Op' }], debts: [{ id: 'a', operationId: 'op1', status: 'ativa', value: 10, inscriptionDate: '' }], executions: [], prescriptionEvents: [], people: [] };
    const asOf = '2026-09-17';
    const lookup = createPrescLookup(data.debts, data.executions, data.prescriptionEvents, asOf);
    const radar = buildPrazosRadar(data, asOf, lookup, { policy: 'v2' });
    const out = buildMesaCards({ data, radar, prescLookup: lookup, today: asOf });
    assert.deepEqual(mesaTotalsOf(out.items), out.totals);
  });
});

describe('Mesa — relógio e linhas das listas', () => {
  const T = '2026-09-17';
  it('mesaIsAction: fileira 1, sem o Ajuizar de 60 a 180 dias', () => {
    assert.equal(mesaIsAction({ card: 'fato' }), true);
    assert.equal(mesaIsAction({ card: 'ajuizar', ajuizarLonge: false }), true);
    assert.equal(mesaIsAction({ card: 'ajuizar', ajuizarLonge: true }), false);
    assert.equal(mesaIsAction({ card: 'vigiar' }), false);
    assert.equal(mesaIsAction(null), false);
  });

  it('relógio: cedo venceu/tarde não, consumada antiga, data que não é prazo e prazo comum', () => {
    const tarde = mesaItemClock({ row: { bandTarde: '2026-12-26', keyDate: '2026-01-01' }, cedoVencidaTardeNao: true, dateIsDeadline: true }, T);
    assert.match(tarde.text, /^tarde em /);
    assert.equal(tarde.date, '26/12/2026');
    const semTarde = mesaItemClock({ row: {}, cedoVencidaTardeNao: true, dateIsDeadline: true }, T);
    assert.equal(semTarde.text, 'sem data tarde');
    const antiga = mesaItemClock({ card: 'antigas', row: { prescDate: '2020-03-01', prescDays: -2400 }, dateIsDeadline: true }, T);
    assert.equal(antiga.text, 'consumada');
    assert.equal(antiga.date, '01/03/2020');
    const piso = mesaItemClock({ card: 'sempressa', row: { keyLabel: 'não antes de 01/01/2019', keyDate: '2019-01-01', prescDays: -2800 }, dateIsDeadline: false }, T);
    assert.equal(piso.plain, true);
    assert.equal(piso.text, 'não antes de 01/01/2019');
    assert.doesNotMatch(piso.text, /há \d+ anos/);
    const prazo = mesaItemClock({ card: 'ajuizar', row: { prescDays: 100, keyDate: '2026-12-26' }, dateIsDeadline: true, ajuizarLonge: true }, T);
    assert.equal(prazo.text, '100d');
    assert.equal(prazo.gray, true);
    assert.equal(mesaItemClock({ row: null }, T), null);
  });

  it('chip de adiamento vencido', () => {
    const it = (until) => ({ snoozeExpired: true, debt: { prescSnooze: { until } } });
    assert.equal(mesaSnoozeLabel(it('2026-09-01'), T), 'adiada até 01/09/2026 (venceu)');
    assert.equal(mesaSnoozeLabel(it('2026-10-01'), T), 'adiamento furado (era até 01/10/2026)');
    assert.equal(mesaSnoozeLabel({ snoozeExpired: false, debt: {} }, T), '');
  });

  it('linha simples: tratada, adiada, derivada, sem dados', () => {
    const tr = mesaLiteInfo({ card: 'tratadas', debt: { prescriptionHandledType: 'declarada' }, handledAt: '2026-05-02' }, null, T);
    assert.equal(tr.why, 'Declarada');
    assert.equal(tr.date, '02/05/2026');
    assert.equal(tr.reopen, false);
    const ad = mesaLiteInfo({ card: 'adiadas', debt: { prescSnooze: { reason: 'peca_protocolada' } }, until: '2026-10-05' }, null, T);
    assert.equal(ad.when, 'volta em 05/10');
    assert.equal(ad.reopen, true);
    const dv = mesaLiteInfo({ card: 'ajuizar', derived: true, ajuizarLonge: true, sortDate: '2026-12-26', debt: {} }, null, T);
    assert.deepEqual(dv.chips, ['Ordinária', 'fora dos 90 dias']);
    assert.equal(dv.whenGray, true);
    assert.match(dv.when, /^em /);
    assert.equal(mesaLiteInfo({ card: 'dado', debt: {} }, null, T).why, 'Sem dados para calcular');
  });
});

describe('Mesa — filtros (fase 2)', () => {
  const dbt = (id, over = {}) => ({ id, operationId: 'op1', cdaNumber: 'CDA ' + id, processNumber: '', personId: 'p1', value: 100, ...over });
  const mk = (id, card, over = {}, debtOver = {}) => ({
    debtId: id, card, debt: dbt(id, debtOver), row: null, value: (debtOver.value != null ? debtOver.value : 100),
    cedoVencidaTardeNao: false, ajuizarLonge: false, derived: false, ...over
  });
  const ctx = {
    personIds: new Set(['a', 'b']),
    personOf: d => (d.personId === 'p1' ? 'Maria Souza' : 'Empresa Alfa'),
    opNameOf: id => (id === 'op1' ? 'Operação Tempestade' : 'Operação Brisa')
  };

  it('parseMesaMinVal: formatos livres em português', () => {
    assert.equal(parseMesaMinVal('500.000'), 500000);
    assert.equal(parseMesaMinVal('500000'), 500000);
    assert.equal(parseMesaMinVal('500 mil'), 500000);
    assert.equal(parseMesaMinVal('1,5 mi'), 1500000);
    assert.equal(parseMesaMinVal('1,5 milhões'), 1500000);
    assert.equal(parseMesaMinVal('2 bi'), 2e9);
    assert.equal(parseMesaMinVal('R$ 1.500,50'), 1500.5);
    assert.equal(parseMesaMinVal('1.5'), 1.5);
    assert.equal(parseMesaMinVal('2k'), 2000);
    assert.equal(parseMesaMinVal(''), 0);
    assert.equal(parseMesaMinVal('abc'), 0);
    assert.equal(parseMesaMinVal(null), 0);
    assert.equal(parseMesaMinVal('-5'), 0);
    assert.equal(formatMesaMinVal(500000), '500.000');
    assert.equal(formatMesaMinVal(1500.5), '1.500,50');
    assert.equal(formatMesaMinVal(0), '');
  });

  it('natureza: linha, derivada, resultado do cálculo e consulta; decadência e sem dado ficam só em «Todas»', () => {
    assert.equal(mesaItemNature(mk('a', 'ajuizar', { row: { prescSegment: 'intercorrente' } })), 'intercorrente');
    assert.equal(mesaItemNature(mk('a', 'ajuizar', { row: { prescSegment: 'ordinaria' } })), 'ordinaria');
    assert.equal(mesaItemNature(mk('a', 'ajuizar', { derived: true })), 'ordinaria');
    assert.equal(mesaItemNature(mk('a', 'tratadas', { prescResult: { segment: 'credito' } })), 'ordinaria');
    assert.equal(mesaItemNature(mk('a', 'tratadas', { prescResult: { segment: 'intercorrente' } })), 'intercorrente');
    assert.equal(mesaItemNature(mk('a', 'tratadas', { prescResult: { segment: 'decadencia' } })), '');
    assert.equal(mesaItemNature(mk('a', 'tratadas'), () => ({ segment: 'credito' })), 'ordinaria');
    assert.equal(mesaItemNature(mk('a', 'tratadas'), () => { throw new Error('x'); }), '');
    assert.equal(mesaItemNature(mk('a', 'tratadas')), '');
  });

  it('IDPJ ou cautelar: incident ou hasIDPJ na linha', () => {
    assert.equal(mesaItemIdpj(mk('a', 'fato', { row: { incident: { kind: 'idpj' } } })), true);
    assert.equal(mesaItemIdpj(mk('a', 'fato', { row: { hasIDPJ: true } })), true);
    assert.equal(mesaItemIdpj(mk('a', 'fato', { row: {} })), false);
    assert.equal(mesaItemIdpj(mk('a', 'tratadas')), false);
  });

  it('filtro de operação, pessoa e busca (CDA, processo, devedor, operação), mantendo a ordem', () => {
    const items = [
      mk('a', 'fato', {}, { cdaNumber: 'CDA 111', processNumber: '5001234-56.2020.4.04.7000' }),
      mk('b', 'fato', {}, { cdaNumber: 'CDA 222', operationId: 'op2', personId: 'p2' }),
      mk('c', 'dado', {}, { cdaNumber: 'CDA 333' }),
      mk('d', 'dado', {}, { cdaNumber: 'CDA 444' })
    ];
    const ids = f => filterMesaItems(items, f, ctx).map(i => i.debtId).join('');
    assert.equal(ids({}), 'abcd');
    assert.equal(ids({ operationId: 'op2' }), 'b');
    assert.equal(ids({ operationId: 'op1', personId: 'x' }), 'a', 'operação e pessoa se somam');
    assert.equal(filterMesaItems(items, { personId: 'x' }, { ...ctx, personIds: null }).length, 4, 'sem conjunto de CDAs a pessoa não corta');
    assert.equal(ids({ personId: 'x' }), 'ab', 'só as CDAs da pessoa');
    assert.equal(ids({ personId: 'all' }), 'abcd');
    assert.equal(ids({ q: 'cda 22' }), 'b');
    assert.equal(ids({ q: '5001234' }), 'a');
    assert.equal(ids({ q: 'alfa' }), 'b');
    assert.equal(ids({ q: 'maria' }), 'acd');
    assert.equal(ids({ q: 'brisa' }), 'b');
    assert.equal(ids({ q: '  ' }), 'abcd');
    assert.equal(ids({ operationId: 'op1', q: 'cda 44' }), 'd');
  });

  it('natureza, cedo venceu/tarde não, IDPJ e valor mínimo', () => {
    const items = [
      mk('o', 'ajuizar', { row: { prescSegment: 'ordinaria' } }, { value: 1000 }),
      mk('i', 'fato', { row: { prescSegment: 'intercorrente', incident: {} }, cedoVencidaTardeNao: true }, { value: 600000 }),
      mk('j', 'fato', { row: { prescSegment: 'intercorrente', hasIDPJ: true } }, { value: 50 }),
      mk('t', 'tratadas', {}, { value: 2000000 })
    ];
    const ids = f => filterMesaItems(items, f, ctx).map(i => i.debtId).join('');
    assert.equal(ids({ nat: 'ordinaria' }), 'o');
    assert.equal(ids({ nat: 'intercorrente' }), 'ij');
    assert.equal(ids({ cedoTarde: true }), 'i');
    assert.equal(ids({ idpj: true }), 'ij');
    assert.equal(ids({ minVal: 500000 }), 'it');
    assert.equal(ids({ minVal: 500000, nat: 'intercorrente', idpj: true, cedoTarde: true }), 'i');
    assert.equal(ids({ minVal: 5e6 }), '');
    assert.equal(ids({ nat: '' }), 'oijt');
  });

  it('filterMesaCards: por cartão, com totais refeitos e contagem «cedo venceu» dentro dos outros filtros', () => {
    const a = mk('a', 'fato', { cedoVencidaTardeNao: true, row: { prescSegment: 'intercorrente' } }, { value: 10 });
    const b = mk('b', 'fato', { row: { prescSegment: 'intercorrente' } }, { value: 20 });
    const c = mk('c', 'ajuizar', { ajuizarLonge: true, derived: true, cedoVencidaTardeNao: true }, { value: 30, operationId: 'op2' });
    const mc = { byCard: { fato: [b, a], ajuizar: [c] }, items: [a, b, c] };
    const out = filterMesaCards(mc, { nat: 'intercorrente' }, ctx);
    assert.deepEqual(out.by.fato.map(i => i.debtId), ['b', 'a']);
    assert.deepEqual(out.by.ajuizar, []);
    assert.equal(out.n, 2);
    assert.deepEqual(out.by.dado, []);
    assert.equal(out.totals.fato.n, 2);
    assert.equal(out.totals.fato.value, 30);
    assert.equal(filterMesaCards(mc, { cedoTarde: true }, ctx).n, 2);
    assert.equal(mesaCedoCount(mc, {}, ctx), 2);
    assert.equal(mesaCedoCount(mc, { cedoTarde: true }, ctx), 2, 'a caixa marcada não zera a própria contagem');
    assert.equal(mesaCedoCount(mc, { operationId: 'op1' }, ctx), 1);
    assert.equal(mesaCedoCount(mc, { minVal: 25 }, ctx), 1);
  });

  it('chips, remoção e limpeza', () => {
    assert.deepEqual(mesaActiveFilters(MESA_FILTER_DEFAULTS), []);
    assert.equal(mesaHasCut(MESA_FILTER_DEFAULTS), false);
    assert.equal(mesaHasCut({ ...MESA_FILTER_DEFAULTS, juntar: true }), false, 'juntar é exibição, não corte');
    const f = { operationId: 'op1', personId: 'p9', q: ' abc ', nat: 'ordinaria', cedoTarde: true, idpj: true, minVal: 500000, juntar: true };
    const chips = mesaActiveFilters(f, { opName: 'Tempestade', personName: 'Maria' });
    assert.deepEqual(chips.map(c => c.k), ['op', 'person', 'nat', 'cedoTarde', 'idpj', 'minVal', 'q', 'juntar']);
    assert.equal(chips[0].t, 'Operação: Tempestade');
    assert.equal(chips[2].t, 'Natureza: ordinária');
    assert.equal(chips[5].t, 'Valor a partir de R$ 500.000');
    assert.equal(chips[6].t, 'Busca: «abc»');
    assert.equal(chips.filter(c => c.panel).length, 5);
    assert.equal(mesaHasCut(f), true);
    assert.deepEqual(mesaRemovePatch('op'), { operationId: '', personId: 'all' });
    assert.deepEqual(mesaRemovePatch('minVal'), { minVal: 0 });
    assert.deepEqual(mesaRemovePatch('zzz'), {});
    chips.forEach(c => assert.notDeepEqual(mesaRemovePatch(c.k), {}));
    const cleared = { ...f, ...mesaClearAllPatch() };
    assert.deepEqual(mesaActiveFilters(cleared), []);
    const reset = { ...f, ...mesaResetPatch() };
    assert.equal(reset.juntar, true, 'o reinício por navegação não mexe na exibição');
    assert.equal(mesaHasCut(reset), false);
  });
});

describe('Mesa — fase 3: análise de penhora e fato posterior', () => {
  const TODAY = '2026-09-17';
  const OP = { id: 'op1', name: 'Op', status: 'ativa' };
  const penhoraResult = (constr) => ({
    segment: 'intercorrente', phase: 'interrompido', interruptVia: 'int_penhora', interruptAt: constr, interruptEffAt: constr
  });
  const mk = ({ debts, executions = [], events = [] }) => buildMesaCards({
    data: { debts, operations: [OP], executions, prescriptionEvents: events },
    radar: { rows: debts.map(d => ({ id: d.id, group: 4, value: 100, prescKind: 'vigiar_interrompido', prescSegment: 'intercorrente', action: { type: 'nenhuma' } })), silenced: [] },
    prescLookup: () => penhoraResult('2020-01-01'),
    today: TODAY
  });
  const debt = (id, over = {}) => ({ id, operationId: 'op1', status: 'ativa', value: 100, processNumber: '5000001-00.2020.4.04.7000', ...over });

  it('cada CDA olha só os fatos que lhe dizem respeito', () => {
    const ex = { id: 'ex1', operationId: 'op1', processNumber: '5000001-00.2020.4.04.7000', processTag: 'normal' };
    const out = mk({
      debts: [debt('a', { penhoraAnalise: { at: '2026-03-01' } }), debt('b', { penhoraAnalise: { at: '2026-03-01' } })],
      executions: [ex],
      events: [
        { id: 'e1', cdaId: 'b', type: 'info_outro', date: '2026-05-10' },
        { id: 'e2', executionId: 'ex1', type: 'info_outro', date: '2025-12-31' }
      ]
    });
    assert.equal(out.byDebt.get('a').card, 'vigiar');
    assert.equal(out.byDebt.get('b').card, 'sempressa');
  });

  it('fato anterior à análise não derruba; posterior derruba', () => {
    const ex = { id: 'ex1', operationId: 'op1', processNumber: '5000001-00.2020.4.04.7000', processTag: 'normal' };
    const before = mk({ debts: [debt('a', { penhoraAnalise: { at: '2026-03-01' } })], executions: [ex], events: [{ id: 'e', executionId: 'ex1', type: 'info_outro', date: '2025-12-31' }] });
    assert.equal(before.byDebt.get('a').card, 'vigiar');
    const after = mk({ debts: [debt('a', { penhoraAnalise: { at: '2026-03-01' } })], executions: [ex], events: [{ id: 'e', executionId: 'ex1', type: 'info_outro', date: '2026-05-10' }] });
    assert.equal(after.byDebt.get('a').card, 'sempressa');
    const onCda = mk({ debts: [debt('a', { penhoraAnalise: { at: '2026-03-01' } })], executions: [ex], events: [{ id: 'e', cdaId: 'a', type: 'info_outro', date: '2026-05-10' }] });
    assert.equal(onCda.byDebt.get('a').card, 'sempressa');
    const sameDay = mk({ debts: [debt('a', { penhoraAnalise: { at: '2026-03-01' } })], executions: [ex], events: [{ id: 'e', cdaId: 'a', type: 'info_outro', date: '2026-03-01' }] });
    assert.equal(sameDay.byDebt.get('a').card, 'vigiar', 'mesmo dia não é posterior');
  });
});

describe('Mesa — fase 3: ação principal por cartão', () => {
  const it_ = (card, row, over = {}) => ({ debtId: 'x', card, row, debt: { id: 'x' }, value: 10, ...over });
  const r = (action, over = {}) => ({ id: 'x', group: 3, prescKind: 'pedido_dado', action, ...over });

  it('um verbo por cartão', () => {
    assert.deepEqual(mesaPrimaryAction(it_('ajuizar', null)), { kind: 'ajuizar', label: 'Ajuizei — informar processo' });
    assert.deepEqual(mesaPrimaryAction(it_('fato', r({ type: 'lancar_ciencia' }))), { kind: 'fato', label: 'Lançar ciência', type: 'marco_sem_bens' });
    assert.deepEqual(mesaPrimaryAction(it_('fato', r({ type: 'criar_evento', eventType: 'susp_parcelamento' }))), { kind: 'fato', label: 'Lançar fato', type: 'susp_parcelamento' });
    assert.deepEqual(mesaPrimaryAction(it_('fato', r({ type: 'conferir_autos' }))), { kind: 'fato', label: 'Lançar fato', type: '' });
    assert.deepEqual(mesaPrimaryAction(it_('vigencia', r({ type: 'confirmar_vigencia' }))), { kind: 'vigencia', label: 'Ainda vale' });
    assert.equal(mesaPrimaryAction(it_('vigencia', null)), null);
    assert.equal(mesaPrimaryAction(it_('dado', r({ type: 'vincular_ef' }))).kind, 'vincular');
    assert.equal(mesaPrimaryAction(it_('dado', r({ type: 'corrigir_ficha', field: 'constituicao' }))).field, 'constituicao');
    assert.equal(mesaPrimaryAction(it_('dado', null)).label, 'Informar dado');
    assert.equal(mesaPrimaryAction(it_('calculo', r({ type: 'nenhuma' }))).label, 'Conferir');
    assert.equal(mesaPrimaryAction(it_('adiadas', null)).kind, 'reabrir');
    assert.equal(mesaPrimaryAction(it_('tratadas', null)).label, 'Desfazer tratamento');
    assert.equal(mesaPrimaryAction(it_('vigiar', r({ type: 'nenhuma' }))), null);
  });

  it('conferir sem pressa: penhora marca analisada; IDPJ e «não antes de» lançam fato', () => {
    assert.equal(mesaPrimaryAction(it_('sempressa', r({ type: 'analisar_penhora' }, { prescKind: 'penhora_antiga' }))).kind, 'analisar');
    assert.equal(mesaPrimaryAction(it_('sempressa', r({ type: 'nenhuma' }, { prescKind: 'vigiar_interrompido' }))).kind, 'analisar');
    assert.equal(mesaPrimaryAction(it_('sempressa', r({ type: 'nenhuma' }, { prescKind: 'vigiar_interrompido', idpjNotice: { active: true } }))).kind, 'fato');
    assert.equal(mesaPrimaryAction(it_('sempressa', r({ type: 'nenhuma' }, { prescKind: 'residual_alta' }))).kind, 'fato');
  });

  it('quem pode adiar e tratar', () => {
    assert.equal(mesaCanSnooze(it_('fato', r({}))), true);
    assert.equal(mesaCanSnooze(it_('fato', null)), false, 'sem linha do radar não há grupo para o teto');
    ['antigas', 'tratadas', 'adiadas'].forEach(c => assert.equal(mesaCanSnooze(it_(c, r({}))), false, c));
    assert.equal(mesaCanTratar(it_('antigas', null)), true);
    assert.equal(mesaCanTratar(it_('tratadas', null)), false);
    assert.equal(mesaCanTratar(it_('adiadas', null)), false);
    assert.deepEqual(MESA_TRATAR_FORMAS.map(f => f[0]), ['aguardando_reconhecimento', 'declarada', 'analisada_nao_consumada', 'extinta']);
  });

  it('lote: só vale a ação que cabe em todos', () => {
    const a = it_('ajuizar', r({}));
    const b = it_('fato', r({}));
    const c = it_('antigas', r({}));
    assert.deepEqual(mesaBatchCan([a, a]), { adiar: true, tratar: true, fato: true, ajuizar: true });
    assert.equal(mesaBatchCan([a, b]).ajuizar, false);
    assert.equal(mesaBatchCan([a, c]).adiar, false);
    assert.equal(mesaBatchCan([it_('tratadas', null)]).tratar, false);
    assert.deepEqual(mesaBatchCan([]), { adiar: false, tratar: false, fato: false, ajuizar: false });
    assert.deepEqual(mesaSelectionTotals([{ value: 10 }, { value: 5.5 }]), { n: 2, value: 15.5 });
    assert.equal(mesaCdaCount(1), '1 CDA');
    assert.equal(mesaCdaCount(3), '3 CDAs');
  });

  it('teto do adiamento do lote é o menor entre os grupos; sem linha vale o grupo 4', () => {
    assert.equal(mesaSnoozeMaxFor([{ row: { group: 1 } }, { row: { group: 6 } }], '2026-09-18'), '2026-10-02');
    assert.equal(mesaSnoozeMaxFor([{ row: { group: 3 } }, { row: { group: 1 } }], '2026-09-18'), '2026-09-25');
    assert.equal(mesaSnoozeMaxFor([{}], '2026-09-18'), '2026-10-18');
    assert.deepEqual(mesaDadoCampos('constituicao').map(c => c[0]), ['dueDate', 'constitutionDate']);
    assert.equal(mesaDadoCampos('ficha')[0][0], 'prescriptionDate');
  });
});

describe('Mesa — fase 3: Desfazer', () => {
  const base = () => ({
    debts: [{ id: 'd1', operationId: 'op', processNumber: '', updatedAt: '2026-01-01T00:00:00Z' }, { id: 'd2', operationId: 'op', processNumber: '123', updatedAt: '2026-01-01T00:00:00Z' }, { id: 'd3', operationId: 'op' }],
    executions: [{ id: 'ex0', operationId: 'op', processNumber: '9' }],
    prescriptionEvents: [{ id: 'ev0', cdaId: 'd3', type: 'info_outro', date: '2026-01-01', verifiedAt: '' }]
  });

  it('captura o estado e marca como null o que ainda não existe', () => {
    const snap = captureUndo(base(), { debtIds: ['d1'], executionIds: ['exNovo', 'ex0'], eventIds: ['evNovo'] }, '2026-09-17T10:00:00Z');
    assert.equal(snap.debts.d1.id, 'd1');
    assert.equal(snap.executions.exNovo, null);
    assert.equal(snap.executions.ex0.processNumber, '9');
    assert.equal(snap.prescriptionEvents.evNovo, null);
    assert.deepEqual(snap.knownEventIds, ['ev0']);
    assert.equal(snap.at, '2026-09-17T10:00:00Z');
  });

  it('o snapshot é cópia: mudar o data depois não o altera', () => {
    const d = base();
    const snap = captureUndo(d, { debtIds: ['d1'] });
    d.debts[0].processNumber = 'MUDOU';
    assert.equal(snap.debts.d1.processNumber, '');
  });

  it('desfaz Ajuizar: restaura processNumber, remove a execução criada, não toca no resto', () => {
    const before = base();
    const snap = captureUndo(before, { debtIds: ['d1', 'd2'], executionIds: ['exNovo'] }, '2026-09-17T10:00:00Z');
    // ação + uma edição alheia depois (d3 e um evento novo de outra origem)
    const after = {
      ...before,
      debts: before.debts.map(d => d.id === 'd1' || d.id === 'd2' ? { ...d, processNumber: 'NOVO', updatedAt: '2026-09-17T10:00:01Z' } : (d.id === 'd3' ? { ...d, value: 777 } : d)),
      executions: [...before.executions, { id: 'exNovo', operationId: 'op', processNumber: 'NOVO' }],
      prescriptionEvents: [...before.prescriptionEvents, { id: 'evAlheio', cdaId: 'd3', type: 'info_outro' }]
    };
    const out = applyUndo(after, snap, { executionIds: ['exNovo'] }, '2026-09-17T10:05:00Z');
    assert.equal(out.debts.find(d => d.id === 'd1').processNumber, '');
    assert.equal(out.debts.find(d => d.id === 'd2').processNumber, '123');
    assert.equal(out.debts.find(d => d.id === 'd1').updatedAt, '2026-09-17T10:05:00Z', 'a volta conta como edição nova');
    assert.equal(out.debts.find(d => d.id === 'd3').value, 777, 'outra CDA não é tocada');
    assert.deepEqual(out.executions.map(e => e.id), ['ex0']);
    assert.deepEqual(out.prescriptionEvents.map(e => e.id), ['ev0', 'evAlheio']);
  });

  it('desfaz evento lançado (e os propagados), restaura o evento conferido', () => {
    const before = base();
    const snap = captureUndo(before, { debtIds: ['d1'], eventIds: ['evNovo', 'ev0'] }, '2026-09-17T10:00:00Z');
    const after = {
      ...before,
      debts: before.debts.map(d => d.id === 'd1' ? { ...d, status: 'parcelada' } : d),
      prescriptionEvents: [
        { ...before.prescriptionEvents[0], verifiedAt: '2026-09-17' },
        { id: 'evNovo', cdaId: 'd1', type: 'susp_parcelamento', createdAt: '2026-09-17T10:00:00Z' },
        { id: 'evProp', executionId: 'ex0', _inheritedFromParent: 'ex0', createdAt: '2026-09-17T10:00:00Z' },
        { id: 'evAntigo', executionId: 'ex0', _inheritedFromParent: 'ex0', createdAt: '2026-01-01T00:00:00Z' }
      ]
    };
    const known = captureUndo({ ...before, prescriptionEvents: [...before.prescriptionEvents, { id: 'evAntigo' }] }, {}).knownEventIds;
    snap.knownEventIds = known;
    const out = applyUndo(after, snap, { eventIds: ['evNovo'] }, '2026-09-17T10:05:00Z');
    assert.equal(out.debts.find(d => d.id === 'd1').status, undefined);
    assert.deepEqual(out.prescriptionEvents.map(e => e.id), ['ev0', 'evAntigo']);
    assert.equal(out.prescriptionEvents[0].verifiedAt, '');
  });

  it('sem snapshot devolve o data como veio', () => {
    const d = base();
    assert.equal(applyUndo(d, null), d);
  });
});

describe('Mesa — fase 3: Ajuizar', () => {
  const data = () => ({
    debts: [
      { id: 'a', operationId: 'op1', processNumber: '' },
      { id: 'b', operationId: 'op1' },
      { id: 'c', operationId: 'op2' }
    ],
    executions: [
      { id: 'ef', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal', processTag: 'normal' },
      { id: 'idpj', operationId: 'op1', processNumber: '5009876-11.2024.4.04.7001', className: 'Incidente', processTag: 'idpj' },
      { id: 'efOutra', operationId: 'op2', processNumber: '5001234-56.2023.4.04.7001', processTag: 'normal' }
    ]
  });

  it('formata e valida o CNJ só com aviso', () => {
    assert.equal(mesaFormatCnj('50012345620234047001'), '5001234-56.2023.4.04.7001');
    assert.equal(mesaFormatCnj('  123/2024 '), '123/2024');
    assert.equal(mesaCnjCheck('').level, '');
    assert.equal(mesaCnjCheck('123/2024').level, 'warn');
    assert.match(mesaCnjCheck('123/2024').msg, /20 dígitos/);
    // DV correto: 0000001-95.2020.8.26.0100 (calculado pela regra mod 97)
    const body = '0000001' + '2020' + '8' + '26' + '0100';
    let rem = 0; for (const ch of body + '00') rem = (rem * 10 + (+ch)) % 97;
    const dv = String(98 - rem).padStart(2, '0');
    const good = '0000001' + dv + '2020' + '8' + '26' + '0100';
    assert.equal(mesaCnjCheck(good).level, 'ok');
    const bad = '0000001' + String((+dv + 1) % 100).padStart(2, '0') + '2020' + '8' + '26' + '0100';
    assert.equal(mesaCnjCheck(bad).level, 'warn');
    assert.match(mesaCnjCheck(bad).msg, /verificador/);
  });

  it('cria a execução quando o número é novo (e guarda o processNumber anterior)', () => {
    const p = mesaPlanAjuizar({ data: data(), debtIds: ['a', 'b'], processNumber: '5000001-00.2026.4.04.7000', date: '2026-09-17', court: ' 1ª Vara ', newExecId: 'nova' });
    assert.equal(p.ok, true);
    assert.equal(p.linkExecutionId, '');
    assert.deepEqual(p.execution, { id: 'nova', operationId: 'op1', processNumber: '5000001-00.2026.4.04.7000', className: 'Execução Fiscal', court: '1ª Vara', processTag: 'normal', status: 'ativa', protocolDate: '2026-09-17' });
    assert.deepEqual(p.prev, { a: '', b: '' });
    assert.deepEqual(p.debtIds, ['a', 'b']);
  });

  it('só vincula quando já há execução fiscal com o mesmo número (qualquer máscara)', () => {
    const p = mesaPlanAjuizar({ data: data(), debtIds: ['a'], processNumber: '50012345620234047001', date: '2026-09-17', newExecId: 'nova' });
    assert.equal(p.ok, true);
    assert.equal(p.execution, null);
    assert.equal(p.linkExecutionId, 'ef');
    assert.equal(p.processNumber, '5001234-56.2023.4.04.7001');
  });

  it('só olha execuções da mesma operação', () => {
    const p = mesaPlanAjuizar({ data: data(), debtIds: ['c'], processNumber: '5001234-56.2023.4.04.7001', date: '2026-09-17', newExecId: 'nova' });
    assert.equal(p.linkExecutionId, 'efOutra');
    const q = mesaPlanAjuizar({ data: data(), debtIds: ['a'], processNumber: '5001234-56.2023.4.04.7001', date: '2026-09-17', newExecId: 'nova' });
    assert.equal(q.linkExecutionId, 'ef');
  });

  it('bloqueia: sem número, sem data, sem CDA, operações diferentes, número de incidente', () => {
    const d = data();
    assert.match(mesaPlanAjuizar({ data: d, debtIds: ['a'], processNumber: ' ', date: '2026-09-17' }).error, /número do processo/);
    assert.match(mesaPlanAjuizar({ data: d, debtIds: ['a'], processNumber: '1', date: '' }).error, /data/);
    assert.match(mesaPlanAjuizar({ data: d, debtIds: [], processNumber: '1', date: '2026-09-17' }).error, /Nenhuma CDA/);
    assert.match(mesaPlanAjuizar({ data: d, debtIds: ['a', 'c'], processNumber: '1', date: '2026-09-17' }).error, /operações diferentes/);
    assert.match(mesaPlanAjuizar({ data: d, debtIds: ['a'], processNumber: '5009876-11.2024.4.04.7001', date: '2026-09-17' }).error, /incidente/);
  });

  it('número fora do formato CNJ avisa mas não bloqueia', () => {
    const p = mesaPlanAjuizar({ data: data(), debtIds: ['a'], processNumber: '123/2026', date: '2026-09-17', newExecId: 'n' });
    assert.equal(p.ok, true);
    assert.equal(p.cnj.level, 'warn');
  });
});

describe('Mesa — fase 3: texto «Foi para»', () => {
  const by = new Map([['a', { card: 'sempressa' }], ['b', { card: 'vigiar' }], ['c', { card: 'ajuizar' }]]);
  it('um item que mudou, um que ficou, vários', () => {
    assert.equal(mesaDestText(by, ['a'], { a: 'fato' }), 'Foi para «Conferir sem pressa».');
    assert.equal(mesaDestText(by, ['c'], { c: 'ajuizar' }), 'Continua em «Ajuizar».');
    assert.equal(mesaDestText(by, ['a', 'b'], { a: 'fato', b: 'fato' }), 'Foram para «Conferir sem pressa» (1) e «Só vigiar» (1).');
    assert.equal(mesaDestText(by, ['a', 'b'], { a: 'sempressa', b: 'vigiar' }), 'Continuam em «Conferir sem pressa» (1) e «Só vigiar» (1).');
    assert.equal(mesaDestText(by, ['zz'], {}), '');
    assert.equal(mesaCardName('antigas'), 'Consumadas antigas');
    assert.equal(mesaDestText(new Map([['a', { card: 'vigiar' }], ['b', { card: 'vigiar' }]]), ['a', 'b'], { a: 'fato', b: 'fato' }), 'Foram para «Só vigiar».');
  });
});
