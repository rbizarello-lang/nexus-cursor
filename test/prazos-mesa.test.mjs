import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UI_FORBIDDEN } from '../src/lib/prescription.js';
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
