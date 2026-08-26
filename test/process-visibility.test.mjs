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

const normProc = value => String(value || '').replace(/\D/g, '');
const isExecucaoFiscalClass = execution => /^execu[çc][ãa]o\s+fiscal\b/.test((execution?.className || '').toLowerCase().trim());
const isHubProcess = execution => !!execution && ['idpj', 'cautelar_fiscal', 'central'].includes(execution.processTag);
const isOtherProcClass = execution => !!execution && !isHubProcess(execution) && !isExecucaoFiscalClass(execution);
const sortArquivadasLast = groups => [...(groups || [])].sort((a, b) => (a?.exec?.status === 'arquivada' ? 1 : 0) - (b?.exec?.status === 'arquivada' ? 1 : 0));

const factory = new Function(
  'normProc', 'isExecucaoFiscalClass', 'isHubProcess', 'isOtherProcClass', 'sortArquivadasLast',
  `${extractFunction('buildCdaGroups')}\n${extractFunction('classifyProcGroups')}\nreturn { buildCdaGroups, classifyProcGroups };`
);
const { buildCdaGroups, classifyProcGroups } = factory(normProc, isExecucaoFiscalClass, isHubProcess, isOtherProcClass, sortArquivadasLast);

function representedIds(classified) {
  return new Set([
    ...classified.hubs,
    ...Object.values(classified.coveredByHub).flat(),
    ...classified.uncoveredEFs,
    ...classified.extinct,
    ...classified.others,
    ...Object.values(classified.apensosByParent).flat(),
  ].filter(group => group?.exec?.id).map(group => group.exec.id));
}

describe('partição visual de Processos e Prescrição', () => {
  it('mantém hub extinto e EF filha visíveis', () => {
    const executions = [
      { id: 'hub', processNumber: '50099999920244047000', className: 'IDPJ', processTag: 'idpj', status: 'extinta' },
      { id: 'ef', processNumber: '50012345620234047001', className: 'Execução Fiscal', status: 'ativa', parentExecutionId: 'hub' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.deepEqual(representedIds(classified), new Set(['hub', 'ef']));
    assert.equal(classified.hubs.some(group => group.exec.id === 'hub'), true);
  });

  it('mantém EF extinta abrangida dentro do hub', () => {
    const executions = [
      { id: 'hub', processNumber: '50099999920244047000', className: 'IDPJ', processTag: 'idpj', status: 'ativa', linkedExecutionIds: ['ef'] },
      { id: 'ef', processNumber: '50012345620234047001', className: 'Execução Fiscal', status: 'extinta' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.equal(classified.coveredByHub.hub.some(group => group.exec.id === 'ef'), true);
    const renderingSource = source.slice(source.indexOf('const renderProcViewMasterDetail'), source.indexOf('const renderProcViewList'));
    assert.doesNotMatch(renderingSource, /coveredByHub\[[^\]]+\][\s\S]{0,120}filter\(g\s*=>\s*g\.exec\.status\s*!==\s*['"]extinta['"]\)/);
  });

  it('não suprime cadastros duplicados antes da consolidação', () => {
    const executions = [
      { id: 'a', processNumber: '50012345620234047001', className: 'Execução Fiscal', status: 'ativa' },
      { id: 'b', processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal', status: 'ativa' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.deepEqual(representedIds(classified), new Set(['a', 'b']));
    assert.equal(classified.duplicates.length, 1);
  });

  it('recupera em Outros qualquer combinação não classificada', () => {
    const executions = [{ id: 'legacy', processNumber: '', className: '', processTag: 'legado', status: 'desconhecido', parentExecutionId: 'inexistente' }];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.equal(representedIds(classified).has('legacy'), true);
  });
});
