import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiagnosticFix, runDiagnostics } from '../src/lib/diagnostics.js';

const fixture = () => ({
  operations: [
    { id: 'op1', name: 'Operação Norte' },
    { id: 'op2', name: 'Operação Sul' },
  ],
  executions: [
    { id: 'e1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal' },
    { id: 'e1b', operationId: 'op1', processNumber: '50012345620234047001', className: 'Execução Fiscal' },
    { id: 'e2', operationId: 'op2', processNumber: '5009999-00.2020.4.04.7000', className: 'Execução Fiscal' },
    { id: 'e2b', operationId: 'op2', processNumber: '50099990020204047000', className: 'Execução Fiscal' },
    { id: 'e-other-fmt', operationId: 'op2', processNumber: '5008888-88.2020.4.04.7000', className: 'Execução Fiscal' },
    { id: 'orphan', operationId: '', processNumber: '5000000-00.2019.4.04.7000', className: 'Execução Fiscal' },
    { id: 'e-fmt', operationId: 'op1', processNumber: '5005555-55.2021.4.04.7001', className: 'Execução Fiscal' },
  ],
  debts: [
    { id: 'd1', operationId: 'op1', cdaNumber: 'CDA-1', processNumber: '5001234-56.2023.4.04.7001', status: 'ativa', value: 10 },
    { id: 'd2', operationId: 'op2', cdaNumber: 'CDA-2', processNumber: '5009999-00.2020.4.04.7000', status: 'ativa', value: 20 },
    { id: 'd-fmt', operationId: 'op1', cdaNumber: 'CDA-fmt', processNumber: '50055555520214047001', status: 'ativa', value: 5 },
    { id: 'd-fmt2', operationId: 'op2', cdaNumber: 'CDA-fmt2', processNumber: '50088888820204047000', status: 'ativa', value: 8 },
  ],
  intimations: [
    { id: 'i1', operationId: 'op1', processNumber: '5001234-56.2023.4.04.7001', status: 'pendente_analise', dateDeadline: '2026-09-10' },
    { id: 'i2', operationId: 'op2', processNumber: '5009999-00.2020.4.04.7000', status: 'pendente_analise' },
    { id: 'i-link', operationId: '', processNumber: '5001234-56.2023.4.04.7001', status: 'pendente_analise', dateDeadline: '2026-09-10' },
    { id: 'i-link2', operationId: '', processNumber: '5009999-00.2020.4.04.7000', status: 'pendente_analise', dateDeadline: '2026-09-10' },
  ],
  people: [
    { id: 'p1', operationId: 'op1', name: 'Alpha', cpfCnpj: '12.345.678/0001-90' },
    { id: 'p1b', operationId: 'op1', name: 'Alpha Dup', cpfCnpj: '12345678000190' },
    { id: 'p2', operationId: 'op2', name: 'Beta', cpfCnpj: '22.333.444/0001-55' },
    { id: 'p2b', operationId: 'op2', name: 'Beta Dup', cpfCnpj: '22333444000155' },
  ],
  hearings: [],
  tasks: [],
  assets: [],
  desk: [{ type: 'intimation', id: 'ghost' }],
  links: { cdaResponsibilities: [] },
});

const idsOf = (achados, id) => (achados.find(f => f.id === id)?.itens || []).map(i => i.id || i.texto);

describe('diagnóstico de integridade por escopo', () => {
  it('carteira inteira concentra achados de todas as operações', () => {
    const achados = runDiagnostics(fixture());
    const dup = achados.find(f => f.id === 'dupexec');
    assert.ok(dup);
    assert.equal(dup.itens.length, 2);
    assert.ok(achados.find(f => f.id === 'execsemop'));
    assert.ok(achados.find(f => f.id === 'mesa'));
    const pessoas = achados.find(f => f.id === 'duppessoa');
    assert.equal(pessoas.itens.length, 2);
    const vincular = achados.find(f => f.id === 'intimsemop');
    assert.equal(vincular.itens.length, 2);
  });

  it('recorte da operação omite outras operações e categorias globais', () => {
    const achados = runDiagnostics(fixture(), { operationId: 'op1' });
    const dup = achados.find(f => f.id === 'dupexec');
    assert.equal(dup.itens.length, 1);
    assert.equal(dup.itens[0].group.operationId, 'op1');
    assert.equal(achados.find(f => f.id === 'execsemop'), undefined);
    assert.equal(achados.find(f => f.id === 'orfaos'), undefined);
    assert.equal(achados.find(f => f.id === 'mesa'), undefined);
    const pessoas = achados.find(f => f.id === 'duppessoa');
    assert.equal(pessoas.itens.length, 1);
    assert.equal(pessoas.itens[0].id, 'p1');
    assert.equal(achados.find(f => f.id === 'intimsemprazo'), undefined);
    const vincular = achados.find(f => f.id === 'intimsemop');
    assert.deepEqual(idsOf(achados, 'intimsemop'), ['i-link']);
    assert.equal(vincular.itens[0].opId, 'op1');
    const formato = achados.find(f => f.id === 'formato');
    assert.ok(formato);
    assert.ok(formato.itens.some(i => String(i.texto).includes('5005555')));
    assert.ok(!formato.itens.some(i => String(i.texto).includes('5008888')));
  });

  it('padronizar formato no recorte não altera registros de outra operação', () => {
    const data = fixture();
    const achados = runDiagnostics(data, { operationId: 'op1' });
    const formato = achados.find(f => f.id === 'formato');
    const next = applyDiagnosticFix(data, formato, { operationId: 'op1' });
    assert.equal(next.debts.find(d => d.id === 'd-fmt').processNumber, '5005555-55.2021.4.04.7001');
    assert.equal(next.debts.find(d => d.id === 'd-fmt2').processNumber, '50088888820204047000');
  });

  it('vincular intimações no recorte só aplica os itens da operação', () => {
    const data = fixture();
    const achados = runDiagnostics(data, { operationId: 'op1' });
    const finding = achados.find(f => f.id === 'intimsemop');
    const next = applyDiagnosticFix(data, finding, { operationId: 'op1' });
    assert.equal(next.intimations.find(i => i.id === 'i-link').operationId, 'op1');
    assert.equal(next.intimations.find(i => i.id === 'i-link2').operationId, '');
  });

  it('limpar mesa na carteira remove refs mortas', () => {
    const data = fixture();
    const achados = runDiagnostics(data);
    const mesa = achados.find(f => f.id === 'mesa');
    const next = applyDiagnosticFix(data, mesa);
    assert.equal(next.desk.length, 0);
  });

  it('não aponta duplicidade quando o mesmo número tem espécies diversas', () => {
    const data = fixture();
    data.executions.push(
      { id: 'pc', operationId: 'op1', processNumber: '5010000-00.2022.4.04.7001', className: 'Procedimento comum' },
      { id: 'apl', operationId: 'op1', processNumber: '50100000020224047001', className: 'Apelação' },
    );
    const achados = runDiagnostics(data, { operationId: 'op1' });
    const dup = achados.find(f => f.id === 'dupexec');
    assert.ok(dup);
    assert.equal(dup.itens.length, 1);
    assert.ok(!dup.itens.some(i => String(i.texto).includes('5010000')));
  });
});
