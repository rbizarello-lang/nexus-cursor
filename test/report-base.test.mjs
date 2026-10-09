import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBaseRelatorio, renderBaseHtml, baseCronologiaCsv, maskCnjNumber, classifyBaseFronts } from '../src/lib/report-base.js';

const PROCESS_STAGES = {
  liminar: { label: 'Liminar', outcomes: { favoravel: 'favorável', desfavoravel: 'desfavorável' } },
  ajuizamento: { label: 'Ajuizamento', outcomes: {} },
};
const deps = {
  getStageRecords: (b, id) => (b.stages || {})[id] || {},
  resolveStageDef: (S, k) => S[k] || { label: k, outcomes: {} },
  isEfStylePanoramaCard: () => false,
  PROCESS_STAGES, CENTRAL_STAGES: {},
  getBriefingEntries: (b) => b.entries || [],
  BRIEFING_ENTRY_TYPES: { decisao: { label: 'Decisão judicial' }, observacao: { label: 'Observação' }, providencia: { label: 'Providência' } },
  CX_HEARING: { instrucao: 'Audiência de instrução' },
  ASSET_STATUSES: { indisponibilidade_ativa: { label: 'Indisponibilidade Ativa' }, liberado: { label: 'Liberado' } },
  EXEC_STATUSES: { ativa: { label: 'Ativa' } },
  ASSET_SUBTYPES: { imovel: 'Imóvel' },
};
const P = { idpj: '5000001-11.2024.4.04.7001', mcf: '5000002-22.2024.4.04.7001', central: '5000003-33.2023.4.04.7001', ef1: '5000004-44.2022.4.04.7001', ef2: '5000005-55.2021.4.04.7001' };

const input = () => ({
  op: { id: 'op1', name: 'Operação Teste', description: 'Fictícia', status: 'ativa' },
  debts: [
    { id: 'c1', cdaNumber: '1', value: 1000, status: 'ativa' },
    { id: 'c2', cdaNumber: '2', value: 500, status: 'garantida' },
    { id: 'c3', cdaNumber: '3', value: 200, status: 'extinta' },
  ],
  executions: [
    { id: 'x1', processNumber: P.idpj, className: 'IDPJ', court: '1ª Vara', processTag: 'idpj', status: 'ativa', linkedExecutionIds: ['x4'] },
    { id: 'x2', processNumber: P.mcf, className: 'Cautelar Fiscal', court: '2ª Vara', processTag: 'cautelar_fiscal', status: 'ativa' },
    { id: 'x3', processNumber: P.central, className: 'Execução Fiscal', court: '3ª Vara', processTag: 'central', status: 'ativa' },
    { id: 'x4', processNumber: P.ef1, className: 'Execução Fiscal', court: '4ª Vara', status: 'ativa' },
    { id: 'x5', processNumber: P.ef2, className: 'Execução Fiscal', court: '5ª Vara', status: 'ativa', proactiveActions: [{ date: '2026-03-10', summary: 'Pedido de penhora', pecaUrl: 'https://exemplo.test/p1' }] },
  ],
  intimations: [
    { id: 'i1', processNumber: P.ef1, eventDescription: 'Intimação para manifestar', dateStart: '2026-02-01', decisionSummary: 'Deferida a penhora.',
      responseAction: { type: 'peticionamento', peticionType: 'Manifestação', respondedAt: '2026-02-05T10:00:00', description: 'Peticionado.', peticionUrl: 'https://exemplo.test/m1' } },
    { id: 'i2', processNumber: P.central, eventDescription: 'Ciência da sentença', dateStart: '2026-04-01', responseAction: { type: 'ciencia', respondedAt: '2026-04-02T10:00:00', description: 'Ciente.' } },
  ],
  hearings: [
    { id: 'h1', date: '2026-05-10', time: '14:00', processNumber: P.idpj, hearingType: 'instrucao', status: 'agendada', parties: 'Fazenda x Fulano' },
    { id: 'h2', date: '2026-03-20', processNumber: P.idpj, hearingType: 'instrucao', status: 'realizada' },
    { id: 'h3', date: '2026-03-21', processNumber: P.idpj, hearingType: 'instrucao', status: 'cancelada' },
  ],
  assets: [
    { id: 'a1', description: 'Imóvel matrícula 1', subtype: 'imovel', value: 900000, status: 'indisponibilidade_ativa', holderId: 'p1', processRef: P.idpj, constrictionDate: '2026-02-15', createdAt: '2026-06-01T00:00:00Z' },
    { id: 'a2', description: 'Veículo', subtype: 'outro', value: 10, status: 'liberado', holderId: 'p1' },
  ],
  people: [
    { id: 'p1', name: 'Fulano de Tal', cpfCnpj: '123.456.789-00', role: 'Sócio', operationRole: 'alvo' },
    { id: 'p2', name: 'Beltrana', operationRole: 'relacionada' },
  ],
  documents: [
    { id: 'd1', title: 'Peça da intimação', url: 'https://exemplo.test/dup', processNumber: P.ef1, sourceIntimationId: 'i1', createdAt: '2026-02-05T10:00:00' },
    { id: 'd2', title: 'Atuação proativa', url: 'https://exemplo.test/dup2', processNumber: P.ef2, sourceActionType: 'proativa', createdAt: '2026-03-10T10:00:00' },
    { id: 'd3', title: 'Petição avulsa', type: 'Petição', url: 'https://exemplo.test/avulsa', processNumber: P.mcf, createdAt: '2026-01-15T10:00:00' },
  ],
  measures: [], prescriptionEvents: [], changeLog: [],
  briefing: {
    stages: { x1: { liminar: { date: '2026-01-20', outcome: 'favoravel', texto: 'Liminar concedida.' }, ajuizamento: { date: '2026-01-05' } } },
    entries: [
      { id: 'e1', type: 'decisao', eventDate: '2026-03-30', html: '<p>Sentença <b>procedente</b></p>' },
      { id: 'e2', type: 'observacao', eventDate: '2026-03-31', html: 'Anotação solta' },
      { id: 'e3', type: 'observacao', inReport: true, eventDate: '2026-04-05', html: 'Marcada' },
      { id: 'e4', type: 'decisao', inReport: false, eventDate: '2026-04-06', html: 'Desmarcada' },
    ],
  },
  deps,
});
const run = (opts) => buildBaseRelatorio(input(), { fromIso: '2026-01-01', toIso: '2026-12-31', periodLabel: 'ano de 2026', ...opts });
const h2 = (b) => b.blocks.filter(x => x.type === 'h2').map(x => x.text);
const section = (b, title) => {
  const i = b.blocks.findIndex(x => x.type === 'h2' && x.text === title);
  return b.blocks.slice(i + 1, b.blocks.findIndex((x, j) => j > i && x.type === 'h2') < 0 ? undefined : b.blocks.findIndex((x, j) => j > i && x.type === 'h2'));
};

describe('buildBaseRelatorio', () => {
  it('seções fixas na ordem certa e títulos (snapshot)', () => {
    const b = run();
    assert.deepEqual(h2(b), [
      '1. Visão geral da operação', '2. Por frente processual', '3. Quadro de decisões judiciais',
      '4. Quadro de constrições e valores', '5. Quadro de providências e peças', '6. Cronologia completa',
    ]);
    assert.equal(b.blocks[0].type, 'h1');
    assert.equal(b.blocks[0].text, 'Operação Teste');
    assert.equal(b.title, 'Base do relatório — Operação Teste — ano de 2026');
    assert.deepEqual(section(b, '2. Por frente processual').filter(x => x.type === 'h3').map(x => x.text),
      ['IDPJ', 'Medida Cautelar Fiscal', 'EF central', 'EFs sem incidente', 'Geral da operação']);
    assert.ok(!JSON.stringify(b.blocks).toLowerCase().includes('pendência'));
  });

  it('classifica frentes: EF coberta pelo IDPJ fica no IDPJ, as demais em EFs sem incidente', () => {
    const f = classifyBaseFronts(input().executions);
    assert.deepEqual([f.x1, f.x2, f.x3, f.x4, f.x5], ['idpj', 'mcf', 'central', 'idpj', 'efs']);
  });

  it('CDAs só em totais, processos com máscara CNJ', () => {
    const b = run();
    const s1 = section(b, '1. Visão geral da operação');
    const list = s1.filter(x => x.type === 'list').map(x => x.items.join('|')).join('||');
    assert.match(list, /Quantidade: 3/);
    assert.match(list, /Valor total: R\$ 1\.700,00/);
    assert.match(list, /Valor garantido: R\$ 500,00/);
    assert.match(list, /Extintas: 1/);
    assert.match(list, /Fulano de Tal/);
    assert.ok(!s1.some(x => x.type === 'table' && x.header.includes('CDA')));
    const tab = s1.find(x => x.type === 'table');
    assert.deepEqual(tab.header, ['Número CNJ', 'Tipo/espécie', 'Vara/juízo', 'Situação']);
    assert.equal(tab.rows.length, 5);
    assert.deepEqual(tab.mono, [0]);
    assert.equal(maskCnjNumber('50000011120244047001'), '5000001-11.2024.4.04.7001');
  });

  it('não duplica peça de intimação nem de atuação proativa', () => {
    const b = run();
    const prov = section(b, '5. Quadro de providências e peças').find(x => x.type === 'table');
    assert.deepEqual(prov.header, ['Data', 'Processo', 'Tipo', 'Resumo', 'Link']);
    const links = prov.rows.map(r => r[4]);
    assert.ok(!links.includes('https://exemplo.test/dup'));
    assert.ok(!links.includes('https://exemplo.test/dup2'));
    assert.deepEqual(prov.rows.map(r => r[2]), ['Petição', 'Manifestação', 'Atuação proativa', 'Ciência']);
    assert.equal(prov.rows[1][4], 'https://exemplo.test/m1');
    assert.equal(prov.rows[0][0], '15/01/2026');
  });

  it('decisões vêm das fases, das intimações com teor e do diário marcado', () => {
    const b = run();
    const dec = section(b, '3. Quadro de decisões judiciais').find(x => x.type === 'table');
    assert.deepEqual(dec.header, ['Data', 'Processo', 'Evento', 'Teor', 'Desfecho']);
    assert.equal(dec.rows.length, 3);
    const txt = dec.rows.map(r => r.join('|')).join('\n');
    assert.match(txt, /Liminar — favorável\|Liminar concedida\.\|favorável/);
    assert.match(txt, /Deferida a penhora\./);
    assert.match(txt, /Sentença procedente/);
    assert.ok(!/Desmarcada/.test(txt));
  });

  it('constrição usa a data da constrição e traz titular, tipo e valor', () => {
    const b = run();
    const t = section(b, '4. Quadro de constrições e valores').find(x => x.type === 'table');
    assert.deepEqual(t.rows, [['Imóvel matrícula 1', 'Fulano de Tal', 'Imóvel', '15/02/2026', 'R$ 900.000,00', P.idpj, 'Indisponibilidade Ativa']]);
    // sem constrictionDate, cai no cadastro
    const inp = input(); delete inp.assets[0].constrictionDate;
    const b2 = buildBaseRelatorio(inp, { fromIso: '2026-01-01', toIso: '2026-12-31' });
    assert.equal(b2.sheets[1].rows[0][3], '01/06/2026');
  });

  it('cronologia em ordem crescente, com intimação, audiências (sem cancelada) e diário só marcado', () => {
    const b = run();
    const keys = b.records.map(r => r.date);
    assert.deepEqual(keys, [...keys].sort());
    const kinds = b.counts.kinds;
    assert.equal(kinds['Audiência'], 2);
    assert.equal(kinds['Intimação'], 2);
    assert.equal(kinds['Diário'], 1);
    const cron = b.sheets[0].rows.map(r => r.join('|')).join('\n');
    assert.match(cron, /Marcada/);
    assert.ok(!/Anotação solta/.test(cron));
    assert.ok(!/Desmarcada/.test(cron));
    assert.match(cron, /designada às 14:00/);
    assert.match(cron, /realizada/);
  });

  it('filtro de período', () => {
    const b = run({ fromIso: '2026-03-01', toIso: '2026-03-31' });
    assert.ok(b.records.length > 0);
    assert.ok(b.records.every(r => r.date >= '2026-03-01' && r.date <= '2026-03-31'));
    assert.equal(b.counts.sections.s4, 0);
    const empty = section(b, '4. Quadro de constrições e valores');
    assert.equal(empty[0].type, 'p');
  });

  it('filtro de frentes: o que sai não aparece; o geral fica', () => {
    const b = run({ fronts: ['mcf'] });
    assert.deepEqual(section(b, '2. Por frente processual').filter(x => x.type === 'h3').map(x => x.text), ['Medida Cautelar Fiscal', 'Geral da operação']);
    assert.ok(b.records.every(r => r.front === 'mcf' || r.front === 'geral'));
    const tab = section(b, '1. Visão geral da operação').find(x => x.type === 'table');
    assert.equal(tab.rows.length, 1);
    // a contagem por frente continua completa para a prévia
    assert.equal(b.counts.fronts.length, 4);
    assert.ok(b.counts.fronts.find(f => f.key === 'idpj').count > 0);
  });

  it('planilha: Cronologia (9 colunas, sempre) e Constrições', () => {
    const b = run({ fromIso: '2030-01-01', toIso: '2030-12-31' });
    assert.deepEqual(b.sheets.map(s => s.name), ['Cronologia', 'Constrições']);
    assert.deepEqual(b.sheets[0].header, ['Data', 'Processo', 'Frente', 'Tipo', 'Fato', 'Teor/Resumo', 'Valor', 'Link', 'Fonte no app']);
    assert.deepEqual(b.sheets[1].header, ['Bem', 'Titular', 'Tipo', 'Data da constrição', 'Valor', 'Processo', 'Situação']);
    assert.equal(b.sheets[0].rows.length, 0);
    const full = run();
    assert.ok(full.sheets[0].rows.every(r => r.length === 9));
  });

  it('HTML e CSV de apoio', () => {
    const b = run();
    const html = renderBaseHtml(b, '01/01/2026');
    assert.match(html, /<h2>6\. Cronologia completa<\/h2>/);
    assert.match(html, /href="https:\/\/exemplo\.test\/m1"/);
    const csv = baseCronologiaCsv(b);
    assert.ok(csv.startsWith('﻿Data;Processo;Frente;Tipo;Fato;Teor/Resumo;Valor;Link;Fonte no app'));
  });
});
