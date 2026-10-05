import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { foldParse, foldIsOpen, foldSet, foldSetAll, foldMigrateLegacy } from '../src/lib/fold.js';

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
});
