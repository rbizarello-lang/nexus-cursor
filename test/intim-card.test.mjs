import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  intimClassSigla, intimClassKey, bizDaysUntil, intimDueTone, intimPrazo, intimEmbargos,
  intimCardLayout, intimTribLines, intimNotesFit, intimProcCnj,
} from '../src/lib/intim-card.js';

const TODAY = '2026-10-08'; // quinta-feira; 12/10 é feriado nacional

describe('sigla da classe', () => {
  it('reconhece as classes do dicionário, com ou sem acento e com "da"/"de"', () => {
    assert.equal(intimClassSigla('Incidente de Desconsideração de Personalidade Jurídica'), 'IDPJ');
    assert.equal(intimClassSigla('Incidente de Desconsideração da Personalidade Jurídica'), 'IDPJ');
    assert.equal(intimClassSigla('EXECUÇÃO FISCAL'), 'EF');
    assert.equal(intimClassSigla('Execução de Título Extrajudicial'), 'ETE');
    assert.equal(intimClassSigla('Embargos à Execução Fiscal'), 'EEF');
    assert.equal(intimClassSigla('Embargos à Execução'), 'EE');
    assert.equal(intimClassSigla('Exceção de Pré-Executividade'), 'EPE');
    assert.equal(intimClassSigla('Medida Cautelar Fiscal'), 'MCF');
  });
  it('classe já gravada como sigla vale como está', () => {
    assert.equal(intimClassSigla('IDPJ'), 'IDPJ');
  });
  it('fora do dicionário (ou vazia) não inventa sigla', () => {
    assert.equal(intimClassSigla('Ação Civil Pública'), '');
    assert.equal(intimClassSigla(''), '');
    assert.equal(intimClassSigla(null), '');
  });
  it('número do processo em CNJ', () => {
    assert.equal(intimProcCnj('50008941820244047107'), '5000894-18.2024.4.04.7107');
    assert.equal(intimProcCnj('5059246-53.2025.4.04.7100'), '5059246-53.2025.4.04.7100');
    assert.equal(intimProcCnj('123'), '123');
    assert.equal(intimProcCnj(null), '');
  });
  it('chave normalizada', () => {
    assert.equal(intimClassKey('  Embargos  à Execução '), 'embargos a execucao');
  });
});

describe('prazo (só tempo)', () => {
  it('tom pela distância', () => {
    assert.equal(intimDueTone(null), 'none');
    assert.equal(intimDueTone(-2), 'late');
    assert.equal(intimDueTone(0), 'today');
    assert.equal(intimDueTone(1), 'today');
    assert.equal(intimDueTone(5), 'soon');
    assert.equal(intimDueTone(6), 'later');
  });
  it('dias úteis pulam fim de semana e feriado', () => {
    assert.equal(bizDaysUntil('2026-10-14', TODAY), 3); // sex 09, (12 feriado), ter 13, qua 14
  });
  it('data final com o dia da semana e a contagem no tooltip', () => {
    const p = intimPrazo({ dateDeadline: '2026-10-14' }, TODAY);
    assert.equal(p.tone, 'later');
    assert.equal(p.txt, 'Qua 14/10');
    assert.equal(p.title, 'Prazo final: 14/10/2026 · em 6 dias (3 dias úteis)');
  });
  it('vencida e amanhã', () => {
    assert.equal(intimPrazo({ dateDeadline: '2026-10-06' }, TODAY).title, 'Prazo final: 06/10/2026 · há 2 dias');
    const am = intimPrazo({ dateDeadline: '2026-10-09' }, TODAY);
    assert.equal(am.tone, 'today');
    assert.equal(am.txt, 'Sex 09/10');
  });
  it('sem prazo final e resolvida', () => {
    assert.deepEqual(intimPrazo({}, TODAY), { tone: 'none', txt: 'prazo fechado', title: 'Prazo ainda não aberto' });
    const r = intimPrazo({ dateDeadline: '2026-10-14', responseAction: { respondedAt: '2026-10-07T13:00:00' } }, TODAY);
    assert.equal(r.tone, 'done');
    assert.equal(r.txt, '✓ 07/10');
    assert.equal(r.title, 'Atuação em 07/10/2026');
  });
});

describe('embargos de declaração (10 dias úteis do início)', () => {
  it('HOJE', () => {
    const e = intimEmbargos({ dateStart: '2026-09-24', dateDeadline: '2026-10-09', status: 'em_analise' }, TODAY);
    assert.equal(e.date, '2026-10-08');
    assert.equal(e.tone, 'today');
    assert.equal(e.txt, 'Emb. HOJE');
  });
  it('atenção com até 3 dias úteis', () => {
    const e = intimEmbargos({ dateStart: '2026-09-28', dateDeadline: '2026-10-19', status: 'aguardando_subsidios' }, TODAY);
    assert.equal(e.date, '2026-10-13');
    assert.equal(e.du, 2);
    assert.equal(e.tone, 'warn');
    assert.equal(e.txt, 'Emb. 13/10');
  });
  it('calmo, e o aviso quando cai depois do prazo final', () => {
    const e = intimEmbargos({ dateStart: '2026-10-06', dateDeadline: '2026-10-13', status: 'pendente_analise' }, TODAY);
    assert.equal(e.date, '2026-10-21');
    assert.equal(e.tone, 'calm');
    assert.match(e.title, /depois do prazo final/);
    assert.match(e.aria, /dias úteis/);
    assert.match(e.title, /dias úteis/);
  });
  it('nada quando expirado, sem início, analisada ou resolvida', () => {
    assert.equal(intimEmbargos({ dateStart: '2026-08-25', dateDeadline: '2026-10-13' }, TODAY), null);
    assert.equal(intimEmbargos({ dateDeadline: '2026-10-13' }, TODAY), null);
    assert.equal(intimEmbargos({ dateStart: '2026-10-06', status: 'analisado' }, TODAY), null);
    assert.equal(intimEmbargos({ dateStart: '2026-10-06', responseAction: { type: 'ciencia' } }, TODAY), null);
  });
});

describe('orçamento de linhas', () => {
  it('faixas de largura iguais às do CSS', () => {
    assert.equal(intimCardLayout(1900).mode, 'wide');
    assert.equal(intimCardLayout(1480).mode, 'wide');
    assert.equal(intimCardLayout(1479).mode, 'mid');
    assert.equal(intimCardLayout(860).mode, 'mid');
    assert.equal(intimCardLayout(390).mode, 'mob');
    assert.ok(intimCardLayout(0).cplTr >= 20);
    // fontes menores e colunas estreitas: mais caracteres por linha que na versão anterior (6,35 px/char)
    assert.ok(intimCardLayout(1920).cplTr > 60);
    assert.ok(intimCardLayout(1920).cplNt > 40);
    assert.ok(intimCardLayout(1920).cplTr > intimCardLayout(1480).cplTr);
  });
  it('tribunal: objeto até 2 linhas e teor no que sobra', () => {
    assert.deepEqual(intimTribLines('curto', null, 60, 4), { ol: 1, tl: 0 });
    assert.deepEqual(intimTribLines('x'.repeat(200), 'y'.repeat(300), 60, 4), { ol: 2, tl: 2 });
    assert.deepEqual(intimTribLines('x'.repeat(200), 'y'.repeat(300), 60, 3), { ol: 2, tl: 1 });
  });
  it('notas: as mais recentes primeiro, com "+N anteriores" quando não cabem', () => {
    const notes = ['a'.repeat(100), 'b', 'c'.repeat(100)];
    const r = intimNotesFit(notes, 60, 4);
    assert.deepEqual(r.shown.map(x => x.t[0]), ['b', 'c']);
    assert.equal(r.rest, 1);
    assert.equal(r.shown.reduce((s, x) => s + x.l, 0) + 1 <= 4, true);
    const one = intimNotesFit(['z'.repeat(500)], 60, 4);
    assert.equal(one.shown[0].l, 3);
    assert.equal(one.rest, 0);
    assert.deepEqual(intimNotesFit([], 60, 4), { shown: [], rest: 0 });
  });
});
