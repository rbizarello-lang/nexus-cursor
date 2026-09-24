import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseDebcadLines } from '../src/lib/debcad-parser.js';

const fixtureDir = path.dirname(fileURLToPath(new URL('./fixtures/debcad/debcad-149630450.lines.json', import.meta.url)));
const lines = JSON.parse(readFileSync(path.join(fixtureDir, 'debcad-149630450.lines.json'), 'utf8'));
const recs = parseDebcadLines(lines);
const rec = recs[0];
const phases = (rec.history || []).filter(h => h.code !== '999');
const lavrado = ((rec.protestos || [])[0]?.eventos || []).find(ev => /lavrado/i.test(ev.descricao || ''));

describe('parseDebcadLines — fixture RelatorioCompleto-debcad-149630450', () => {
  it('lê uma inscrição com Debcad 149630450 e inscrição em 08/05/2021', () => {
    assert.equal(recs.length, 1);
    assert.equal(rec.cdaNumber, '149630450');
    assert.equal(rec.inscriptionDate, '2021-05-08');
    assert.equal(rec.devedor, 'AGROTRAC COMERCIO DE INSUMOS AGRICOLAS LTDA');
    assert.equal(rec.cnpj, '77986412000177');
    assert.equal(rec.valueTotal, 16518.19);
  });

  it('preenche protestos no mesmo formato do SIDA (lavrado em 17/03/2026)', () => {
    assert.equal(rec.protestos.length, 1);
    const p = rec.protestos[0];
    assert.equal(p.identificacao, '202603PR0125624090');
    assert.equal(p.protocolo, '0000009661');
    assert.equal(p.dataProtocolo, '2026-03-08');
    assert.match(p.tabelionato, /2 TABELIONATO DE PROTESTO/i);
    assert.equal(p.situacao, 'PROTESTO LAVRADO');
    assert.equal(p.valor, '16049.68');
    assert.ok(lavrado, 'evento "Protesto lavrado" ausente');
    assert.equal(lavrado.dataEfetivacao, '2026-03-17');
    assert.equal(lavrado.dataCriacao, '2026-03-20');
  });

  it('ajuizamentos fica vazio quando o relatório diz "Não há Ajuizamento."', () => {
    assert.deepEqual(rec.ajuizamentos, []);
  });

  it('histórico tem as fases 514, 520 e 551', () => {
    const codes = new Set(phases.map(h => h.code));
    assert.ok(codes.has('514'), 'falta fase 514');
    assert.ok(codes.has('520'), 'falta fase 520');
    assert.ok(codes.has('551'), 'falta fase 551');
    assert.ok(phases.filter(h => h.code === '520').length >= 2);
  });

  it('atualizações incluem as linhas PERT (pedido, deferimento, encerramento)', () => {
    const blob = rec.updates.map(u => `${u.funcao} ${u.obs}`).join(' | ');
    assert.match(blob, /INCL\.\s*PEDIDO DE PARCELAMENTO/i);
    assert.match(blob, /DEFERIMENTO PARCELAMENTO PERT/i);
    assert.match(blob, /ENC\.\s*DO PROCESSO DO PARC/i);
    assert.ok(rec.updates.some(u => u.date === '2018-08-23'));
    assert.ok(rec.updates.some(u => u.date === '2018-09-11'));
    assert.ok(rec.updates.some(u => u.date === '2021-03-11'));
  });

  it('nada da seção PROTESTOS vaza para atualizações', () => {
    const blob = JSON.stringify(rec.updates);
    assert.doesNotMatch(blob, /202603PR0125624090/);
    assert.doesNotMatch(blob, /PROTESTO LAVRADO/);
    assert.doesNotMatch(blob, /TABELIONATO DE PROTESTO/);
    assert.doesNotMatch(blob, /Ocorr[eê]ncias do Protesto/i);
    assert.ok(!rec.updates.some(u => u.date === '2026-03-17'), 'efetivação do lavrado não pode ir para updates');
    assert.ok(!rec.updates.some(u => u.date === '2026-03-08'), 'protocolo do protesto não pode ir para updates');
  });

  it('para no FIM DO RELATÓRIO e não inventa segundo registro', () => {
    assert.equal(recs.length, 1);
    assert.ok(lines.some(ln => /FIM DO RELAT/i.test(ln)));
  });
});
