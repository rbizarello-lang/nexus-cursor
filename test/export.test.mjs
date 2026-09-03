import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EXPORT_SELECTION,
  EXPORT_DATASETS,
  buildExportWorkbook,
  countExportItems,
  filterDataForExport,
  formatCnpj,
  formatCpf,
  sheetsToCsvParts,
  splitPersonDoc,
} from '../src/lib/export.js';

const fixture = () => ({
  operations: [
    { id: 'op1', name: 'Operação Norte', status: 'ativa', description: 'Grupo A' },
    { id: 'op2', name: 'Operação Sul', status: 'encerrada', description: 'Grupo B' },
  ],
  people: [
    { id: 'pe1', operationId: 'op1', name: 'Empresa Alfa LTDA', subtype: 'PJ', cpfCnpj: '12.345.678/0001-95', role: 'Devedora', operationRole: 'alvo' },
    { id: 'pe2', operationId: 'op1', name: 'João Silva', subtype: 'PF', cpfCnpj: '123.456.789-09', role: 'Sócio', operationRole: 'alvo' },
    { id: 'pe3', operationId: 'op2', name: 'Beta Comércio', subtype: 'PJ', cpfCnpj: '12345678000195', role: 'Fachada', operationRole: 'relacionada' },
  ],
  debts: [
    { id: 'd1', operationId: 'op1', cdaNumber: 'CDA-1', value: 1000, status: 'ativa', tribute: 'IRPJ', processNumber: '5001234-56.2023.4.04.7001', personId: 'pe1', cnpj: '12345678000195' },
    { id: 'd2', operationId: 'op2', cdaNumber: 'CDA-2', value: 2000, status: 'extinta', personId: 'pe3' },
  ],
  executions: [
    { id: 'e1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal', court: '1ª VF', status: 'ativa' },
  ],
  assets: [
    { id: 'a1', operationId: 'op1', description: 'Imóvel matrícula 1', subtype: 'imovel', status: 'indisponibilidade_ativa', holderId: 'pe1', value: 900000 },
  ],
  intimations: [
    { id: 'i1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', dateDeadline: '2026-09-10', status: 'pendente_analise', eventDescription: 'Intimação' },
  ],
  tasks: [
    { id: 't1', operationId: 'op1', title: 'Minutar IDPJ', dueDate: '2026-09-05', status: 'pendente', priority: 'alta' },
  ],
  hearings: [
    { id: 'h1', operationId: 'op1', date: '2026-09-08', time: '14:00', processNumber: '5001234-56.2023.4.04.7001', hearingType: 'justificacao', status: 'agendada', parties: 'FN X Alfa' },
  ],
  links: { cdaResponsibilities: [{ id: 'r1', cdaId: 'd1', personId: 'pe1', role: 'originario' }] },
});

describe('src/lib/export.js', () => {
  it('catálogo inclui pessoas, CNPJs e JSON; padrão pré-marca pessoas e CNPJs', () => {
    const ids = EXPORT_DATASETS.map(d => d.id);
    assert.ok(ids.includes('pessoas'));
    assert.ok(ids.includes('cnpjs'));
    assert.ok(ids.includes('json'));
    assert.deepEqual(DEFAULT_EXPORT_SELECTION, ['pessoas', 'cnpjs']);
  });

  it('formatCpf / formatCnpj preenchem máscara a partir dos dígitos', () => {
    assert.equal(formatCnpj('12345678000195'), '12.345.678/0001-95');
    assert.equal(formatCpf('12345678909'), '123.456.789-09');
  });

  it('splitPersonDoc separa CPF de CNPJ pelo tamanho dos dígitos', () => {
    assert.deepEqual(splitPersonDoc({ subtype: 'PJ', cpfCnpj: '12.345.678/0001-95' }), { cpf: '', cnpj: '12.345.678/0001-95' });
    assert.deepEqual(splitPersonDoc({ subtype: 'PF', cpfCnpj: '123.456.789-09' }), { cpf: '123.456.789-09', cnpj: '' });
    assert.equal(splitPersonDoc({ cpfCnpj: '12345678000195' }).cnpj, '12.345.678/0001-95');
    assert.equal(splitPersonDoc({ cpfCnpj: '12345678909' }).cpf, '123.456.789-09');
  });

  it('aba Pessoas tem colunas Nome e CNPJ; CPF não vai para a coluna de CNPJ', () => {
    const wb = buildExportWorkbook(fixture(), ['pessoas']);
    assert.equal(wb.sheets.length, 1);
    const [header, ...body] = wb.sheets[0].rows;
    assert.deepEqual(header, ['Nome', 'Tipo', 'CPF', 'CNPJ', 'Papel', 'Posição', 'Operação']);
    const joao = body.find(r => r[0] === 'João Silva');
    const alfa = body.find(r => r[0] === 'Empresa Alfa LTDA');
    assert.ok(joao);
    assert.equal(joao[2], '123.456.789-09');
    assert.equal(joao[3], '');
    assert.ok(alfa);
    assert.equal(alfa[2], '');
    assert.equal(alfa[3], '12.345.678/0001-95');
  });

  it('aba CNPJs deduplica o mesmo CNPJ em pessoa e CDA', () => {
    const wb = buildExportWorkbook(fixture(), ['cnpjs']);
    const body = wb.sheets[0].rows.slice(1);
    assert.equal(body.length, 1);
    assert.equal(body[0][0], '12.345.678/0001-95');
    assert.match(body[0][3], /Pessoa/);
    assert.match(body[0][3], /CDA/);
  });

  it('recorte por operação filtra pessoas e não leva JSON da carteira inteira', () => {
    const scoped = filterDataForExport(fixture(), 'op2');
    assert.equal(scoped.people.length, 1);
    assert.equal(scoped.people[0].name, 'Beta Comércio');
    assert.equal(scoped.debts.length, 1);
    assert.equal(scoped.links.cdaResponsibilities.length, 0);
    const wb = buildExportWorkbook(fixture(), ['pessoas', 'json'], { operationId: 'op2' });
    assert.equal(countExportItems(scoped, 'pessoas'), 1);
    assert.equal(wb.includeJson, true);
    assert.equal(wb.scoped, true);
    assert.equal(wb.jsonData.operations.length, 1);
    assert.equal(wb.jsonData.people.length, 1);
  });

  it('CSV de fallback usa ponto-e-vírgula e escapa aspas', () => {
    const parts = sheetsToCsvParts([{ name: 'Pessoas', rows: [['Nome'], ['Alfa "X"']] }]);
    assert.equal(parts.length, 1);
    assert.match(parts[0].csv, /"Alfa ""X"""/);
    assert.match(parts[0].csv, /Nome/);
  });

  it('seleção vazia de abas ainda pode pedir só JSON', () => {
    const wb = buildExportWorkbook(fixture(), ['json']);
    assert.equal(wb.sheets.length, 0);
    assert.equal(wb.includeJson, true);
    assert.ok(wb.jsonData.people.length > 0);
  });
});
