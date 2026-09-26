import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  parseSIDALines,
  parseSidaMoneyNumber,
  shouldEmitSidaParcelamentoEvents,
  sidaPedidoSemDeferimento,
  classifySidaOccurrence,
  isSidaProtestoLine,
  isSidaCondensedNote,
  buildSidaDebtPayload,
  draftSidaPrescriptionEvents,
} from '../src/lib/sida-parser.js';

const fixtureDir = path.dirname(fileURLToPath(new URL('./fixtures/sida/sida-18092026.lines.json', import.meta.url)));
const lines = JSON.parse(readFileSync(path.join(fixtureDir, 'sida-18092026.lines.json'), 'utf8'));
const recs = parseSIDALines(lines);
const rec = recs[0];
const recLavrado = recs.find((r) => r.cdaNumber === '00 2 19 021348-10');
const recSemProt = recs.find((r) => r.cdaNumber === '00 2 13 000562-92');
const recLast = recs[recs.length - 1];
const lavrados = recs.filter((r) => (r.protestos || []).some((p) => /LAVRADO/i.test(p.situacao || '')));

describe('parseSIDALines — fixture SIDA-Relatorio-Completo-18092026', () => {
  it('lê 54 inscrições e para no FIM DO RELATÓRIO', () => {
    assert.equal(recs.length, 54);
    assert.ok(lines.some((ln) => /FIM DO RELAT/i.test(ln)));
    assert.equal(recLast.cdaNumber, '00 7 24 012036-94');
    assert.equal(recLast.inscriptionDate, '2024-10-25');
  });

  it('Dados Gerais da 1ª inscrição (VERTICALI, 17/03/2011)', () => {
    assert.equal(rec.cdaNumber, '00 2 11 002974-31');
    assert.equal(rec.devedor, 'VERTICALI- CONSTRUCOES E INCORPORACOES LTDA');
    assert.equal(rec.cnpj, '00841065000160');
    assert.equal(rec.inscriptionDate, '2011-03-17');
    assert.equal(rec.firstChargeDate, '2012-06-17');
    assert.equal(rec.situation, 'ATIVA AJUIZADA EM PROCESSO DE NEGOCIACAO NO SISPAR');
    assert.equal(rec.serie, 'IMPOSTO DE RENDA PESSOA JURIDICA');
    assert.equal(rec.natureza, 'TRIBUTARIA');
    assert.equal(rec.tribute, '3551- DIV.ATIVA- IRPJ');
    assert.equal(rec.processoAdministrativo, '11080 500384/2011-09');
    assert.equal(rec.processNumber, '50020753220124047121');
    assert.equal(rec.protocolDate, '2012-06-11');
    assert.equal(rec.distributionDate, '2012-06-11');
    assert.equal(rec.juizo, '16ª Vara Federal de Porto Alegre');
    assert.match(rec.orgaoJustica, /CAPAO DA CANOA/i);
    assert.equal(rec.valueInscrito, 48088.85);
    assert.equal(rec.valueRemanescente, 45961.74);
    assert.equal(rec.valueConsolidado, 133204.04);
    assert.equal(rec.qtdDevedores, '4');
    assert.equal(rec.qtdParcelamentos, '6');
    assert.equal(rec.agrupamentoAjuizamento, '000012905609');
    assert.equal(rec.pfnResponsavel, 'QUARTA REGIAO');
    assert.match(rec.orgaoOrigem, /RECEITA FEDERAL/i);
    assert.equal(rec.dataFalencia, '');
    assert.equal(rec.motivoSuspensao, '');
  });

  it('aceita o rótulo partido CPF/ CNPJ e o valor R $ com espaço', () => {
    assert.ok(lines.some((ln) => /^CPF\/ CNPJ:/.test(ln)));
    assert.equal(parseSidaMoneyNumber('R $ 48.088,85'), 48088.85);
    assert.equal(parseSidaMoneyNumber('R $ 40,549,63'), 40549.63);
    assert.equal(recs.every((r) => r.cnpj === '00841065000160'), true);
  });

  it('Devedores/corresponsáveis: 1 principal + 3 corresponsáveis na 1ª inscrição', () => {
    assert.equal(rec.devedores.length, 4);
    assert.equal(rec.devedores.filter((d) => /PRINCIPAL/i.test(d.tipo)).length, 1);
    assert.equal(rec.devedores.filter((d) => /CORRESPONS/i.test(d.tipo)).length, 3);
    assert.equal(rec.coresponsibles.length, 3);
    const docs = new Set(rec.coresponsibles.map((c) => c.cpfCnpj));
    assert.ok(docs.has('08105727000145'));
    assert.ok(docs.has('56026668934'));
    assert.ok(docs.has('75848120072'));
    assert.equal(rec.coresponsibles.find((c) => c.cpfCnpj === '56026668934').date, '2025-11-07');
    assert.match(rec.coresponsibles.find((c) => c.cpfCnpj === '08105727000145').name, /HIMUGUI/i);
  });

  it('Parcelamentos estruturados (6 na 1ª; 189 no relatório; tipo quebrado em duas linhas)', () => {
    assert.equal(rec.parcelamentos.length, 6);
    assert.equal(recs.reduce((s, r) => s + r.parcelamentos.length, 0), 189);
    const paes = rec.parcelamentos.find((p) => p.adesao === '2003-07-31');
    assert.equal(paes.encerramento, '2012-03-23');
    assert.equal(paes.situacao, 'ENCERRADA POR RESCISAO');
    assert.match(paes.tipo, /10\.684/);
    const aguard = rec.parcelamentos.find((p) => p.adesao === '2026-09-17');
    assert.equal(aguard.situacao, 'AGUARDANDO');
    assert.equal(shouldEmitSidaParcelamentoEvents(aguard), false);
    const indef = rec.parcelamentos.find((p) => /INDEFERIMENTO/i.test(p.situacao || ''));
    assert.equal(shouldEmitSidaParcelamentoEvents(indef), false);
    assert.equal(indef.grupo, 'indeferido');
    assert.match(indef.tipo, /N 01\/2026/);
    const cancel = rec.parcelamentos.find((p) => /CANCELAMENTO/i.test(p.situacao || ''));
    assert.equal(shouldEmitSidaParcelamentoEvents(cancel), true);
    assert.equal(cancel.deferimento, '2025-09-18');
    assert.equal(cancel.encerramento, '2026-03-07');
  });

  it('Protestos: 14 lavrados, 4 sem protesto, 1ª inscrição devolvida', () => {
    assert.equal(lavrados.length, 14);
    assert.equal(recs.filter((r) => (r.protestos || []).length === 0).length, 4);
    assert.ok(recSemProt);
    assert.deepEqual(recSemProt.protestos, []);
    assert.equal(rec.protestos.length, 1);
    const p = rec.protestos[0];
    assert.equal(p.identificacao, '202605RS010000000000026312626');
    assert.equal(p.protocolo, '8504628');
    assert.equal(p.dataProtocolo, '2026-05-06');
    assert.equal(p.situacao, 'ENCERRADO - CDA DEVOLVIDA');
    assert.equal(p.valor, '131135.78');
    assert.match(p.tabelionato, /Servi[cç]os de Registros P[uú]blicos de Cap[aã]o da Canoa/i);
    assert.ok(p.eventos.some((ev) => /Devolu/i.test(ev.descricao) && ev.dataEfetivacao === '2026-05-08'));
    assert.ok(!p.eventos.some((ev) => /Data de Cria/i.test(ev.descricao)));
  });

  it('Protesto lavrado da CDA 00 2 19 021348-10 em 23/02/2026', () => {
    assert.ok(recLavrado);
    assert.equal(recLavrado.protestos.length, 1);
    const p = recLavrado.protestos[0];
    assert.equal(p.identificacao, '202602RS0124487251');
    assert.equal(p.situacao, 'PROTESTO LAVRADO');
    assert.equal(p.valor, '40549.63');
    assert.equal(p.dataProtocolo, '2026-02-11');
    const lav = p.eventos.find((ev) => /lavrado/i.test(ev.descricao || ''));
    assert.ok(lav);
    assert.equal(lav.dataEfetivacao, '2026-02-23');
    assert.equal(lav.dataCriacao, '2026-02-26');
  });

  it('Ocorrências da 1ª inscrição: 50 linhas, data+hora juntas, CADIN e pagamentos extraídos', () => {
    assert.equal(rec.occurrences.length, 50);
    assert.equal(rec.occurrences[0].date, '2011-03-17');
    assert.equal(rec.occurrences[0].time, '23:59:59.99');
    assert.match(rec.occurrences[0].desc, /INSCRICAO ATIVA A SER COBRADA/i);
    assert.ok(rec.occurrences.some((o) => /INCLUSAO DE CO-?\s*RESPONSAVEL/i.test(o.desc)));
    assert.equal(rec.pagamentos.length, 6);
    assert.ok(rec.pagamentos.some((p) => p.valor === 1332.88 && p.arrecadacaoDate === '2013-08-30'));
    assert.equal(rec.cadin.length, 2);
    assert.ok(rec.cadin.some((c) => c.tipo === 'inclusao' && /EMFPG-2026-06-00114578/.test(c.protocolo)));
    assert.ok(rec.cadin.some((c) => c.tipo === 'baixa'));
    assert.ok(rec.bloqueios.length >= 1);
  });

  it('Ajuizamento vem dos Dados Gerais (processo único + protocolo 11/06/2012)', () => {
    const aj = rec.ajuizamentos.find((a) => a.source === 'dados_gerais');
    assert.ok(aj);
    assert.equal(aj.processNumber, '50020753220124047121');
    assert.equal(aj.protocolDate, '2012-06-11');
    assert.equal(aj.juizo, '16ª Vara Federal de Porto Alegre');
  });

  it('todas as 54 inscrições têm juízo, CNPJ, valor inscrito e nº de processo', () => {
    assert.equal(recs.filter((r) => r.juizo).length, 54);
    assert.equal(recs.filter((r) => r.cnpj === '00841065000160').length, 54);
    assert.equal(recs.filter((r) => r.valueInscrito != null).length, 54);
    assert.equal(recs.filter((r) => r.processNumber).length, 54);
    const procs = new Set(recs.map((r) => r.processNumber));
    assert.ok(procs.has('50020753220124047121'));
    assert.ok(procs.has('50418988520264047100'));
    assert.ok(procs.size >= 8);
  });
});

describe('helpers de mapeamento SIDA', () => {
  it('classifySidaOccurrence distingue cadin, pagamento, corresponsável e protesto', () => {
    assert.equal(classifySidaOccurrence('INCLUSAO NO CADIN - EMFPG-2026-06-00114578'), 'cadin_inclusao');
    assert.equal(classifySidaOccurrence('BAIXA A INSCRICAO DO CADIN - EMFPG-x'), 'cadin_baixa');
    assert.equal(classifySidaOccurrence('INCLUSAO DE PAGAMENTO ARREC 30/08/2013 VALOR 1.332,88'), 'pagamento');
    assert.equal(classifySidaOccurrence('INCLUSAO DE CO- RESPONSAVEL CPF/ CNPJ 560.266.689-34'), 'coresponsavel');
    assert.equal(classifySidaOccurrence('PROTESTO DA CDA - Data efetivação: 23/02/2026'), 'protesto');
    assert.equal(isSidaProtestoLine('PROTESTO- PRE- SELECAO DA CDA'), false);
    assert.equal(isSidaProtestoLine('Protesto lavrado (Inf. do Cartório)'), true);
  });

  it('shouldEmitSidaParcelamentoEvents ignora AGUARDANDO e indeferimento sem deferimento', () => {
    assert.equal(shouldEmitSidaParcelamentoEvents({ adesao: '2026-09-17', situacao: 'AGUARDANDO' }), false);
    assert.equal(shouldEmitSidaParcelamentoEvents({ adesao: '2025-07-17', encerramento: '2025-08-09', situacao: 'ENCERRADA POR INDEFERIMENTO', grupo: 'indeferido' }), false);
    assert.equal(shouldEmitSidaParcelamentoEvents({ adesao: '2020-08-25', encerramento: '2021-06-11', situacao: 'ENCERRADA POR RESCISAO' }), true);
  });

  it('pedido aguardando ou indeferido vira pedido sem deferimento (interrompe, sem pausa)', () => {
    assert.equal(sidaPedidoSemDeferimento({ adesao: '2026-09-17', situacao: 'AGUARDANDO' }), true);
    assert.equal(sidaPedidoSemDeferimento({ adesao: '2025-07-17', encerramento: '2025-08-09', situacao: 'ENCERRADA POR INDEFERIMENTO', grupo: 'indeferido' }), true);
    assert.equal(sidaPedidoSemDeferimento({ adesao: '2020-08-25', deferimento: '2020-09-01', situacao: 'ENCERRADA POR RESCISAO' }), false);
  });

  it('buildSidaDebtPayload e nota condensada [SIDA]', () => {
    const payload = buildSidaDebtPayload(rec, '2026-09-19T12:00:00.000Z');
    assert.equal(payload.source, 'sida');
    assert.equal(payload.importedAt, '2026-09-19T12:00:00.000Z');
    assert.equal(payload.dadosGerais.cdaNumber, rec.cdaNumber);
    assert.equal(payload.occurrences.length, 50);
    assert.equal(payload.protestos.length, 1);
    assert.equal(payload.devedores.length, 4);
    assert.equal(isSidaCondensedNote('[SIDA] Histórico (4 fases): foo'), true);
    assert.equal(isSidaCondensedNote('nota qualquer'), false);
  });

  it('draftSidaPrescriptionEvents: rescisões da 1ª CDA; protesto só se lavrado', () => {
    const drafts = draftSidaPrescriptionEvents(rec);
    assert.ok(drafts.some((e) => e.type === 'susp_parcelamento' && e.date === '2020-08-25'));
    assert.ok(drafts.some((e) => e.type === 'int_rescisao_parcelamento' && e.date === '2021-06-11'));
    assert.ok(drafts.some((e) => e.type === 'int_pedido_parcelamento' && e.date === '2026-09-17'));
    assert.ok(!drafts.some((e) => e.type === 'susp_parcelamento' && e.date === '2026-09-17'));
    assert.ok(!drafts.some((e) => e.type === 'int_protesto_extrajudicial'));
    const keys = drafts.map((e) => `${e.type}|${e.date}`);
    assert.equal(keys.length, new Set(keys).size);
    const lavDrafts = draftSidaPrescriptionEvents(recLavrado);
    const prot = lavDrafts.find((e) => e.type === 'int_protesto_extrajudicial');
    assert.ok(prot);
    assert.equal(prot.date, '2026-02-23');
    const allProt = recs.flatMap((r) => draftSidaPrescriptionEvents(r).filter((e) => e.type === 'int_protesto_extrajudicial'));
    assert.equal(allProt.length, 14);
  });
});
