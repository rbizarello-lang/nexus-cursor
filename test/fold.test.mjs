import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { foldParse, foldIsOpen, foldSet, foldSetAll, foldMigrateLegacy, foldMigrateBriefingToVisao, FOLD_BRIEFING_TO_VISAO } from '../src/lib/fold.js';

describe('fold — estado recolher/expandir dos cartões do Prumo', () => {
  it('foldParse aceita só { escopo: { id: boolean } } e descarta o resto', () => {
    assert.deepEqual(foldParse(null), {});
    assert.deepEqual(foldParse('não é json'), {});
    assert.deepEqual(foldParse('["a"]'), {});
    assert.deepEqual(foldParse('{"visao":{"hz":true,"x":"sim","y":false},"ruim":[1],"vazio":{}}'), { visao: { hz: true, y: false } });
  });

  it('foldIsOpen: padrão aberto; escolha guardada vale; defaultOpen=false nasce fechado', () => {
    assert.equal(foldIsOpen({}, 'visao', 'hz'), true);
    assert.equal(foldIsOpen({ visao: { hz: true } }, 'visao', 'hz'), false);
    assert.equal(foldIsOpen({ visao: { hz: false } }, 'visao', 'hz'), true);
    assert.equal(foldIsOpen({}, 'processos', 'emb', false), false);
    assert.equal(foldIsOpen({ processos: { emb: false } }, 'processos', 'emb', false), true);
    assert.equal(foldIsOpen(undefined, 'a', 'b'), true);
  });

  it('foldSet / foldSetAll não mudam o estado original e mantêm os outros escopos', () => {
    const s0 = { painel: { ops: true } };
    const s1 = foldSet(s0, 'visao', 'hz', true);
    assert.deepEqual(s0, { painel: { ops: true } });
    assert.deepEqual(s1, { painel: { ops: true }, visao: { hz: true } });
    const s2 = foldSetAll(s1, 'visao', ['hz', 'int', 'agenda'], true);
    assert.deepEqual(s2.visao, { hz: true, int: true, agenda: true });
    assert.deepEqual(s2.painel, { ops: true });
    const s3 = foldSetAll(s2, 'visao', ['hz', 'int', 'agenda'], false);
    assert.equal(['hz', 'int', 'agenda'].every(id => foldIsOpen(s3, 'visao', id)), true);
  });

  it('foldMigrateLegacy converte as três chaves antigas', () => {
    const out = foldMigrateLegacy({}, {
      painel: '["ops","week"]',
      briefing: '{"evento":true,"notas":false,"efs":true}', // no formato antigo true = aberto
      horizonte: '1',
    });
    assert.deepEqual(out, { painel: { ops: true, week: true }, briefing: { notas: true }, visao: { hz: true } });
    assert.equal(foldIsOpen(out, 'briefing', 'evento'), true);
    assert.equal(foldIsOpen(out, 'briefing', 'notas'), false);
  });

  it('foldMigrateLegacy: horizonte "0", lixo e chaves ausentes não geram nada; não sobrescreve o novo', () => {
    assert.deepEqual(foldMigrateLegacy({}, { painel: 'lixo', briefing: '[1]', horizonte: '0' }), {});
    assert.deepEqual(foldMigrateLegacy({}, {}), {});
    assert.deepEqual(foldMigrateLegacy({}, null), {});
    const out = foldMigrateLegacy({ visao: { hz: false } }, { horizonte: '1' });
    assert.equal(out.visao.hz, false);
  });

  it('P6 · foldMigrateBriefingToVisao copia o recolhido de "briefing" para "visao" pelos ids novos', () => {
    const st = { briefing: { frentes: true, atuacoes: true, narr: true, diario: false, fontes: true, lembretes: true, checklists: true, tarefas: true, evento: true, notas: true, efs: false } };
    const out = foldMigrateBriefingToVisao(st);
    assert.deepEqual(out.visao, { frentes: true, atuacoes: true, hz: true, diario: false, fontes: true, lembretes: true, checklists: true, evento: true, notas: true, efs: false });
    assert.equal(foldIsOpen(out, 'visao', 'frentes'), false);
    assert.equal(foldIsOpen(out, 'visao', 'diario'), true);
    assert.equal(foldIsOpen(out, 'visao', 'hz'), false);
    assert.deepEqual(out.briefing, st.briefing, 'o escopo antigo não é alterado');
    assert.equal(out.visao.tarefas, undefined, 'Próximas tarefas deixou de existir (virou a Agenda)');
    assert.equal(out.visao.agenda, undefined);
  });

  it('P6 · não sobrescreve a escolha que já existe em "visao" e é idempotente', () => {
    const st = { briefing: { frentes: true, narr: true, diario: true }, visao: { frentes: false, hz: true, agenda: true } };
    const out = foldMigrateBriefingToVisao(st);
    assert.deepEqual(out.visao, { frentes: false, hz: true, agenda: true, diario: true });
    const again = foldMigrateBriefingToVisao(out);
    assert.equal(again, out, 'segunda passada não muda nada e devolve o mesmo objeto');
  });

  it('P6 · sem "briefing" (ou sem nada a copiar) devolve o mesmo estado', () => {
    const a = { visao: { hz: true } };
    assert.equal(foldMigrateBriefingToVisao(a), a);
    const e = {};
    assert.equal(foldMigrateBriefingToVisao(e), e);
    const b = { briefing: { tarefas: true, outro: true } };
    assert.equal(foldMigrateBriefingToVisao(b), b);
    assert.equal(foldMigrateBriefingToVisao(null), null);
    assert.equal(foldMigrateBriefingToVisao(undefined), undefined);
  });

  it('P6 · a migração das chaves antigas e a do Briefing encadeiam (cartões abertos no formato antigo viram "visao")', () => {
    const legacy = foldMigrateLegacy({}, { briefing: '{"evento":false,"notas":true,"efs":false}', horizonte: '1' });
    const out = foldMigrateBriefingToVisao(legacy);
    assert.equal(foldIsOpen(out, 'visao', 'evento'), false);
    assert.equal(foldIsOpen(out, 'visao', 'notas'), true);
    assert.equal(foldIsOpen(out, 'visao', 'efs'), false);
    assert.equal(foldIsOpen(out, 'visao', 'hz'), false, 'Horizonte recolhido continua recolhido');
    assert.ok(Object.values(FOLD_BRIEFING_TO_VISAO).includes('hz'));
  });
});
