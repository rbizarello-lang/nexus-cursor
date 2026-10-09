import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Carrega Código.js (Apps Script) num contexto sem serviços do Google: só as funções puras.
const src = fs.readFileSync(new URL('../Código.js', import.meta.url), 'utf8');
const ctx = vm.createContext({ console });
vm.runInContext(src, ctx);
const g = (n) => ctx[n];
const plain = (o) => JSON.parse(JSON.stringify(o));

describe('trilha: nomes e intervalo', () => {
  it('monta e interpreta nomes de arquivo', () => {
    assert.equal(g('trilhaFileNameForDay_')('2026-03-05'), 'nexus_trilha_2026-03-05.ndjson');
    assert.equal(g('trilhaFileNameForDay_')('2026-03-05', 1), 'nexus_trilha_2026-03-05.ndjson');
    assert.equal(g('trilhaFileNameForDay_')('2026-03-05', 3), 'nexus_trilha_2026-03-05_3.ndjson');
    assert.deepEqual(plain(g('trilhaParseName_')('nexus_trilha_2026-03-05_2.ndjson')), { day: '2026-03-05', part: 2, name: 'nexus_trilha_2026-03-05_2.ndjson' });
    assert.equal(g('trilhaParseName_')('outro.txt'), null);
  });
  it('filtra intervalo inclusivo e ordena por dia e parte', () => {
    const names = ['nexus_trilha_2026-03-06.ndjson', 'nexus_trilha_2026-03-05_2.ndjson', 'nexus_trilha_2026-03-05.ndjson',
      'nexus_trilha_2026-03-01.ndjson', 'lixo.txt', 'nexus_trilha_2026-03-09.ndjson'];
    assert.deepEqual(plain(g('trilhaDaysInRange_')(names, '2026-03-05', '2026-03-06')), [
      'nexus_trilha_2026-03-05.ndjson', 'nexus_trilha_2026-03-05_2.ndjson', 'nexus_trilha_2026-03-06.ndjson']);
  });
});

describe('trilha: deduplicação', () => {
  const ev = (id) => ({ id, day: '2026-03-05', kind: 'x' });
  it('acrescenta só os novos', () => {
    const r1 = g('trilhaMergeLines_')('', [ev('a'), ev('b')]);
    assert.equal(r1.appended, 2);
    const r2 = g('trilhaMergeLines_')(r1.text, [ev('b'), ev('c'), ev('c')]);
    assert.equal(r2.appended, 1);
    assert.equal(r2.duplicates, 2);
    assert.equal(r2.text.trim().split('\n').length, 3);
  });
  it('considera ids de outras partes', () => {
    const r = g('trilhaMergeLines_')('', [ev('a'), ev('z')], { a: true });
    assert.equal(r.appended, 1);
    assert.equal(r.duplicates, 1);
  });
  it('valida evento', () => {
    const v = g('trilhaValidEvent_');
    assert.equal(v({ id: 'a', day: '2026-03-05' }), true);
    assert.equal(v({ day: '2026-03-05' }), false);
    assert.equal(v({ id: 'a', day: '05/03/2026' }), false);
    assert.equal(v(null), false);
  });
});

describe('trilha: versão leve', () => {
  it('remove restore, corta textos e detalhes', () => {
    const big = 'x'.repeat(500);
    const e = {
      id: 'a', day: '2026-03-05', restore: { grande: 1 },
      textChanges: [{ from: big, to: 'curto' }, { from: 'a', to: 'b' }],
      batch: { details: Array.from({ length: 80 }, (_, i) => i) },
    };
    const l = g('trilhaLighten_')(e);
    assert.equal(l.restore, undefined);
    assert.equal(l.textChanges[0].from.length, 300);
    assert.equal(l.textChanges[0].cut, true);
    assert.equal(l.textChanges[1].cut, undefined);
    assert.equal(l.batch.details.length, 50);
    assert.equal(l.batch.detailsCut, true);
    assert.ok(e.restore, 'não altera o original');
  });
});

describe('exportação: erro de cota', () => {
  it('detecta e traduz', () => {
    const q = g('isQuotaError_');
    assert.equal(q(new Error('Service invoked too many times for one day: documents.')), true);
    assert.equal(q({ message: 'Quota exceeded' }), true);
    assert.equal(q(new Error('Rate limit hit')), true);
    assert.equal(q(new Error('falha qualquer')), false);
    assert.equal(g('exportErrorMessage_')(new Error('quota')), 'Limite diário do Google para criar documentos atingido. Tente amanhã.');
  });
});

describe('trilha: ids por regex', () => {
  it('extrai o id do começo da linha, com escape e fallback', () => {
    const ids = g('trilhaIdsFromText_')([
      JSON.stringify({ v: 1, id: 'abc', ts: 'x', changes: [{ id: 'nao' }] }),
      JSON.stringify({ v: 1, id: 'com"aspas', day: '2026-03-05' }),
      JSON.stringify({ kind: 'x', pad: 'y'.repeat(400), id: 'tarde' }),
      'lixo {',
      '',
    ].join('\n'));
    assert.deepEqual(Object.keys(plain(ids)).sort(), ['abc', 'com"aspas', 'tarde']);
  });
});
