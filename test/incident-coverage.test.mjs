import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Função ${name} não encontrada em src/app.jsx`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Função ${name} incompleta`);
}

const sameProc = (a, b) => {
  const x = String(a || '').replace(/\D/g, '');
  return !!x && x === String(b || '').replace(/\D/g, '');
};
const isExecucaoFiscalClass = (e) => /^execu[çc][ãa]o\s+fiscal\b/.test((e?.className || '').toLowerCase().trim());

const factory = new Function(
  'sameProc',
  'isExecucaoFiscalClass',
  `${extractFunction('isIncidentProcess')}
${extractFunction('execCdaValue')}
${extractFunction('computeIncidentCoverage')}
return { computeIncidentCoverage };`
);
const { computeIncidentCoverage } = factory(sameProc, isExecucaoFiscalClass);

describe('cobertura por incidentes', () => {
  it('soma o valor das EFs, não o do incidente', () => {
    const execs = [
      { id: 'ef1', processNumber: '5001111-11.2020.4.04.7000', className: 'Execução Fiscal', processTag: 'normal', status: 'ativa' },
      { id: 'ef2', processNumber: '5002222-22.2021.4.04.7000', className: 'Execução Fiscal', processTag: 'normal', status: 'ativa' },
      { id: 'idpj', processNumber: '5003333-33.2024.4.04.7000', className: 'IDPJ', processTag: 'idpj', status: 'ativa', linkedExecutionIds: ['ef1'] },
    ];
    const debts = [
      { processNumber: '5001111-11.2020.4.04.7000', value: 100 },
      { processNumber: '5002222-22.2021.4.04.7000', value: 300 },
    ];
    const r = computeIncidentCoverage(execs, debts);
    assert.equal(r.coveredTotal, 100);
    assert.equal(r.uncoveredTotal, 300);
    assert.equal(r.pct, 25);
  });

  it('com todas as EFs no incidente chega a 100%', () => {
    const execs = [
      { id: 'ef1', processNumber: '5001111-11.2020.4.04.7000', className: 'Execução Fiscal', processTag: 'normal', status: 'ativa' },
      { id: 'idpj', processNumber: '5003333-33.2024.4.04.7000', className: 'IDPJ', processTag: 'idpj', status: 'ativa', linkedExecutionIds: ['ef1'] },
    ];
    const debts = [{ processNumber: '5001111-11.2020.4.04.7000', value: 80 }];
    const r = computeIncidentCoverage(execs, debts);
    assert.equal(r.pct, 100);
    assert.equal(r.coveredTotal, 80);
  });

  it('não conta duas vezes a mesma EF ligada a dois incidentes', () => {
    const execs = [
      { id: 'ef1', processNumber: '5001111-11.2020.4.04.7000', className: 'Execução Fiscal', processTag: 'normal', status: 'ativa' },
      { id: 'mcf', processNumber: '5004444-44.2024.4.04.7000', className: 'Medida Cautelar Fiscal', processTag: 'cautelar_fiscal', status: 'ativa', linkedExecutionIds: ['ef1'] },
      { id: 'idpj', processNumber: '5003333-33.2024.4.04.7000', className: 'IDPJ', processTag: 'idpj', status: 'ativa', linkedExecutionIds: ['ef1'] },
    ];
    const debts = [{ processNumber: '5001111-11.2020.4.04.7000', value: 50 }];
    const r = computeIncidentCoverage(execs, debts);
    assert.equal(r.coveredTotal, 50);
    assert.equal(r.pct, 100);
  });

  it('inclui execução central ligada ao incidente', () => {
    const execs = [
      { id: 'efc', processNumber: '5007777-88.2022.4.04.7002', className: 'Execução Fiscal', processTag: 'central', status: 'ativa' },
      { id: 'mcf', processNumber: '5003333-22.2024.4.04.7002', className: 'Medida Cautelar Fiscal', processTag: 'cautelar_fiscal', status: 'ativa', linkedExecutionIds: ['efc'] },
    ];
    const debts = [{ processNumber: '5007777-88.2022.4.04.7002', value: 200 }];
    const r = computeIncidentCoverage(execs, debts);
    assert.equal(r.coveredTotal, 200);
    assert.equal(r.pct, 100);
  });
});
