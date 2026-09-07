import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { clusterDuplicateExecutions, splitOtherProcGroups } from '../src/lib/processes.js';

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
  'normProc', 'isExecucaoFiscalClass', 'isHubProcess', 'isOtherProcClass', 'sortArquivadasLast', 'clusterDuplicateExecutions',
  `${extractFunction('buildCdaGroups')}\n${extractFunction('classifyProcGroups')}\nreturn { buildCdaGroups, classifyProcGroups };`
);
const { buildCdaGroups, classifyProcGroups } = factory(normProc, isExecucaoFiscalClass, isHubProcess, isOtherProcClass, sortArquivadasLast, clusterDuplicateExecutions);

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

  it('não aponta duplicidade quando o mesmo número tem espécies diversas', () => {
    const executions = [
      { id: 'g1', processNumber: '50011111120224047001', className: 'Procedimento comum', status: 'ativa' },
      { id: 'ap', processNumber: '5001111-11.2022.4.04.7001', className: 'Apelação', status: 'ativa' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.equal(classified.duplicates.length, 0);
    assert.equal(classified.dupExecIds.size, 0);
  });

  it('recupera em Outros qualquer combinação não classificada', () => {
    const executions = [{ id: 'legacy', processNumber: '', className: '', processTag: 'legado', status: 'desconhecido', parentExecutionId: 'inexistente' }];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.equal(representedIds(classified).has('legacy'), true);
  });

  it('central lista só apensos fiscais e ignora abrangidas', () => {
    const executions = [
      { id: 'c', processNumber: '50077778820224047002', className: 'Execução Fiscal', processTag: 'central', status: 'ativa', linkedExecutionIds: ['other'] },
      { id: 'ap', processNumber: '50077901020234047002', className: 'Execução Fiscal', status: 'ativa', parentExecutionId: 'c' },
      { id: 'emb', processNumber: '50077808820234047002', className: 'Embargos à Execução Fiscal', status: 'ativa', parentExecutionId: 'c' },
      { id: 'other', processNumber: '50000000020234047002', className: 'Execução Fiscal', status: 'ativa' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.equal(classified.hubs.some(group => group.exec.id === 'c'), true);
    assert.deepEqual((classified.coveredByHub.c || []).map(group => group.exec.id), ['ap']);
    assert.equal(classified.uncoveredEFs.some(group => group.exec.id === 'other'), true);
    assert.equal(classified.others.some(group => group.exec.id === 'emb'), true);
  });

  it('fatiar Outros coloca apelação em Recursos e embargos à execução em Embargos', () => {
    const executions = [
      { id: 'apl', processNumber: '50011111120224047001', className: 'Apelação', status: 'ativa' },
      { id: 'ai', processNumber: '50012505620254047001', className: 'Agravo de Instrumento', status: 'ativa' },
      { id: 'emb', processNumber: '50077808820234047002', className: 'Embargos à Execução Fiscal', status: 'ativa' },
      { id: 'et', processNumber: '50077818820234047002', className: 'Embargos de Terceiro', status: 'ativa' },
      { id: 'ed', processNumber: '50077828820234047002', className: 'Embargos de Declaração', status: 'ativa' },
      { id: 'cs', processNumber: '50022209920244047000', className: 'Cumprimento de Sentença', status: 'ativa' },
      { id: 'epe', processNumber: '50012405620244047001', className: 'Exceção de Pré-Executividade', status: 'ativa' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    const split = splitOtherProcGroups(classified.others);
    assert.deepEqual(new Set(split.recursos.map(g => g.exec.id)), new Set(['apl', 'ai', 'ed']));
    assert.deepEqual(new Set(split.embargos.map(g => g.exec.id)), new Set(['emb', 'et']));
    assert.deepEqual(new Set(split.outros.map(g => g.exec.id)), new Set(['cs', 'epe']));
    assert.deepEqual(representedIds(classified), new Set(['apl', 'ai', 'emb', 'et', 'ed', 'cs', 'epe']));
  });

  it('central sem apenso fiscal não mostra execuções abrangidas', () => {
    const executions = [
      { id: 'c', processNumber: '50077778820224047002', className: 'Execução Fiscal', processTag: 'central', status: 'ativa' },
    ];
    const classified = classifyProcGroups(buildCdaGroups(executions, []), executions);
    assert.deepEqual((classified.coveredByHub.c || []).map(group => group.exec.id), []);
    assert.equal(classified.hubs.some(group => group.exec.id === 'c'), true);
  });
});

const panoHelpers = new Function(
  `${extractFunction('isExecucaoFiscalClass')}\n${extractFunction('isHubProcess')}\n${extractFunction('isCentralProcess')}\n${extractFunction('isUserPanoramaEf')}\n${extractFunction('isEfStylePanoramaCard')}\nreturn { isUserPanoramaEf, isEfStylePanoramaCard, isHubProcess };`
)();

describe('execução fiscal no panorama sem marca de hub', () => {
  it('aceita EF comum marcada pelo usuário e não a trata como IDPJ/cautelar/central', () => {
    const ef = { id: 'e1', className: 'Execução Fiscal', processTag: 'normal', inPanorama: true, status: 'ativa' };
    assert.equal(panoHelpers.isUserPanoramaEf(ef), true);
    assert.equal(panoHelpers.isEfStylePanoramaCard(ef), true);
    assert.equal(panoHelpers.isHubProcess(ef), false);
  });

  it('não leva ao panorama EF sem a escolha do usuário', () => {
    const ef = { id: 'e1', className: 'Execução Fiscal', processTag: 'normal', status: 'ativa' };
    assert.equal(panoHelpers.isUserPanoramaEf(ef), false);
  });

  it('não duplica card de processo já marcado como central', () => {
    const ef = { id: 'e1', className: 'Execução Fiscal', processTag: 'central', inPanorama: true, status: 'ativa' };
    assert.equal(panoHelpers.isUserPanoramaEf(ef), false);
    assert.equal(panoHelpers.isEfStylePanoramaCard(ef), true);
  });
});
