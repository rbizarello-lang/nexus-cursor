/**
 * Diagnóstico de integridade do cadastro.
 * Funções puras — testáveis sem React.
 *
 * options.operationId restringe os achados à operação aberta, para corrigir
 * um caso sem varrer a carteira inteira.
 */

import { docsCompatible } from './docs.js';
import { findDuplicateExecutionGroups } from './processes.js';
import { normProc, sameProc, toDayKey } from './dates.js';

const _diagFmtCur = (v) => {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const ofOperation = (arr, operationId) => {
  if (!operationId) return arr || [];
  return (arr || []).filter(x => x && x.operationId === operationId);
};

/**
 * Varre inconsistências silenciosas (formatos divergentes, órfãos, duplicatas).
 * Cada achado traz `fix` quando a correção é segura e automatizável.
 *
 * @param {object} data
 * @param {{ operationId?: string }} [options]
 */
export function runDiagnostics(data, options) {
  const d = data || {};
  const operationId = options && options.operationId ? String(options.operationId) : '';
  const scoped = !!operationId;

  const ops = d.operations || [];
  const execsAll = d.executions || [];
  const debtsAll = d.debts || [];
  const intimsAll = d.intimations || [];
  const peopleAll = d.people || [];
  const hearingsAll = d.hearings || [];
  const tasksAll = d.tasks || [];
  const assetsAll = d.assets || [];
  const desk = d.desk || [];

  const execs = ofOperation(execsAll, operationId);
  const debts = ofOperation(debtsAll, operationId);
  const intims = ofOperation(intimsAll, operationId);
  const people = ofOperation(peopleAll, operationId);

  const opIds = new Set(ops.map(o => o.id));
  const execIds = new Set(execsAll.map(e => e.id));
  const out = [];
  const add = (sev, id, titulo, itens, detalhe, fix) => { if (itens.length) out.push({ sev, id, titulo, itens, detalhe, fix }); };

  // 1. Mesmo processo gravado com formatos diferentes (raiz do cruzamento que falhava)
  const byDigits = {};
  const push = (col, x, label) => { const n = normProc(x.processNumber); if (!n) return; (byDigits[n] = byDigits[n] || []).push({ col, label, raw: x.processNumber }); };
  execs.forEach(x => push('executions', x, 'processo'));
  debts.forEach(x => push('debts', x, 'CDA ' + (x.cdaNumber || 's/n')));
  intims.forEach(x => push('intimations', x, 'intimação'));
  const divergentes = Object.entries(byDigits)
    .filter(([, arr]) => new Set(arr.map(a => a.raw)).size > 1)
    .map(([n, arr]) => ({ id: n, texto: [...new Set(arr.map(a => a.raw))].join('  ↔  '), sub: arr.length + ' registro(s)' }));
  add('media', 'formato', 'Mesmo processo com formatos diferentes', divergentes,
    'O cruzamento já é feito por dígitos, então não há mais perda de dados — mas padronizar deixa as buscas e a leitura consistentes.', 'padronizar');

  // 2. Execuções duplicadas: mesmo número DENTRO da mesma operação.
  const duplicateExecutionGroups = findDuplicateExecutionGroups(d)
    .filter(group => !scoped || group.operationId === operationId);
  add('alta', 'dupexec', 'Processos cadastrados em duplicidade',
    duplicateExecutionGroups.map(group => {
      const op = ops.find(o => o.id === group.operationId);
      return {
        id: group.recommendedId,
        texto: group.processNumber || group.processDigits || 's/nº',
        sub: `${group.executionIds.length} cadastros · ${op?.name || 'operação não localizada'} · ${group.conflicts.length} conflito(s)`,
        group,
      };
    }),
    'Há mais de um cadastro interno para o mesmo processo na mesma operação. Use “Consolidar” para escolher o registro principal e migrar eventos, apensamentos, incidentes e histórico sem perda.');

  // 3. Pessoas duplicadas por CPF/CNPJ na mesma operação
  const dupPersonGroups = [];
  const handledP = new Set();
  people.forEach(p => {
    if (handledP.has(p.id) || !p.cpfCnpj) return;
    const group = people.filter(other => other.operationId === p.operationId && other.cpfCnpj && docsCompatible(p.cpfCnpj, other.cpfCnpj));
    if (group.length > 1) {
      group.forEach(g => handledP.add(g.id));
      dupPersonGroups.push(group);
    }
  });
  add('media', 'duppessoa', 'Pessoas duplicadas (mesmo CPF/CNPJ)',
    dupPersonGroups.map(a => ({ id: a[0].id, texto: a[0].name || 's/nome', sub: a.length + ' cadastros · ' + (a[0].cpfCnpj || '') })),
    'Mesmo documento cadastrado mais de uma vez na operação — divide responsabilidades e bens.');

  // 4–4b. Órfãos globais: processos sem operação e restos de operação excluída.
  // Fora do escopo da operação aberta — use o diagnóstico da carteira.
  if (!scoped) {
    const execSemOperacao = execsAll.filter(x => !x.operationId || !opIds.has(x.operationId));
    add('alta', 'execsemop', 'Processos sem operação válida',
      execSemOperacao.map(x => ({
        id: x.id,
        executionId: x.id,
        texto: x.processNumber || x.id,
        sub: x.operationId ? 'operação inexistente' : 'sem operação',
      })),
      'Esses processos existem no banco, mas não entram em nenhuma operação. Use “Vincular” para escolher a operação correta; registros processuais órfãos do mesmo número também podem ser reassociados.');

    const orfaos = [];
    [['debts', debtsAll, 'CDA'], ['intimations', intimsAll, 'intimação'], ['hearings', hearingsAll, 'audiência'], ['people', peopleAll, 'pessoa'], ['assets', assetsAll, 'bem']]
      .forEach(([, arr, lbl]) => arr.forEach(x => { if (x.operationId && !opIds.has(x.operationId)) orfaos.push({ id: x.id, texto: lbl + ': ' + (x.processNumber || x.cdaNumber || x.name || x.parties || x.description || x.id), sub: 'operação inexistente' }); }));
    add('alta', 'orfaos', 'Registros de operação excluída', orfaos,
      'Sobraram apontando para uma operação que não existe mais — invisíveis na interface, mas ocupam espaço e distorcem totais.', 'desvincular');
  }

  // 5. Vínculos entre processos apontando para o vazio (só execuções da operação, se filtrada)
  const vinculos = [];
  execs.forEach(e => {
    if (e.parentExecutionId && !execIds.has(e.parentExecutionId)) vinculos.push({ id: e.id, texto: e.processNumber || e.id, sub: 'apensado a processo inexistente' });
    (e.linkedExecutionIds || []).forEach(x => { if (!execIds.has(x)) vinculos.push({ id: e.id, texto: e.processNumber || e.id, sub: 'abrange execução inexistente' }); });
  });
  add('media', 'vinculos', 'Vínculos entre processos quebrados', vinculos,
    'Apensamento ou abrangência de incidente apontando para processo excluído.', 'limpar');

  // 6. Refs mortas na Mesa — fila global (refs {type,id} sem operação). Fora do diagnóstico da operação.
  if (!scoped) {
    const alive = { intimation: new Set(intimsAll.map(i => i.id)), task: new Set(tasksAll.map(t => t.id)), hearing: new Set(hearingsAll.map(h => h.id)) };
    add('info', 'mesa', 'Itens da Mesa que não existem mais',
      desk.filter(x => !x || !alive[x.type] || !alive[x.type].has(x.id)).map((x, i) => ({ id: 'desk' + i, texto: (x && x.type) || '?', sub: 'registro excluído' })),
      'Restos na fila de foco. Não aparecem na tela, mas viajam para a nuvem.', 'limpar');
  }

  // 7. CDA sem responsável originário
  const respCda = new Set(((d.links || {}).cdaResponsibilities || []).filter(r => r.role === 'originario').map(r => r.cdaId));
  add('info', 'semresp', 'CDAs sem devedor originário',
    debts.filter(x => x.status !== 'extinta' && !respCda.has(x.id) && !x.personId).map(x => ({ id: x.id, texto: 'CDA ' + (x.cdaNumber || 's/n'), sub: _diagFmtCur(x.value || 0) })),
    'Sem devedor vinculado, a CDA não entra na exposição por pessoa.');

  // 8. Intimação sem operação, mas cujo processo existe numa operação
  const execPool = scoped ? execs : execsAll;
  const semOp = intimsAll.filter(x => !x.operationId && x.processNumber && !x.responseAction).map(x => {
    const e = execPool.find(ex => sameProc(ex.processNumber, x.processNumber));
    return e && e.operationId ? { id: x.id, texto: x.processNumber, sub: '→ ' + ((ops.find(o => o.id === e.operationId) || {}).name || '?'), opId: e.operationId } : null;
  }).filter(Boolean);
  add('media', 'intimsemop', 'Intimações que podem ser vinculadas', semOp,
    'O processo dessas intimações já existe numa operação cadastrada — dá para vincular automaticamente.', 'vincular');

  // 8b. Intimação ativa sem prazo final parseável — some da agenda e do e-mail
  add('alta', 'intimsemprazo', 'Intimações ativas sem prazo final',
    intims.filter(x => !x.responseAction && x.status !== 'analisado' && !toDayKey(x.dateDeadline))
      .map(x => ({ id: x.id, texto: x.processNumber || 's/nº', sub: (x.eventDescription || 'sem Final Prazo').slice(0, 48) })),
    'Sem data de prazo final reconhecível, a intimação não entra no e-mail diário nem na agenda da semana. Reimporte o XLS do eproc (Prazos em aberto) ou preencha Final Prazo à mão.');

  // 9. CDA cujo processo não está cadastrado (existência no cadastro global, CDA da operação)
  add('info', 'cdasemproc', 'CDAs com processo não cadastrado',
    debts.filter(x => x.processNumber && x.status !== 'extinta' && !execsAll.some(e => sameProc(e.processNumber, x.processNumber)))
      .map(x => ({ id: x.id, texto: 'CDA ' + (x.cdaNumber || 's/n'), sub: x.processNumber })),
    'A execução correspondente não existe no cadastro — o valor não é somado ao processo.');

  return out;
}

/**
 * Aplica a correção automatizável de um achado.
 * Com operationId, mutações de formato/vínculos/mesa ficam restritas à operação.
 */
export function applyDiagnosticFix(data, finding, options) {
  const next = { ...(data || {}) };
  const f = finding || {};
  const operationId = options && options.operationId ? String(options.operationId) : '';

  if (f.id === 'mesa') {
    const alive = {
      intimation: new Set((next.intimations || []).map(i => i.id)),
      task: new Set((next.tasks || []).map(t => t.id)),
      hearing: new Set((next.hearings || []).map(h => h.id)),
    };
    next.desk = (next.desk || []).filter(x => {
      const live = x && alive[x.type] && alive[x.type].has(x.id);
      if (live) return true;
      if (operationId && x && x.operationId && x.operationId !== operationId) return true;
      return false;
    });
  } else if (f.id === 'vinculos') {
    const ids = new Set((next.executions || []).map(e => e.id));
    next.executions = (next.executions || []).map(e => {
      if (operationId && e.operationId !== operationId) return e;
      let ch = e;
      if (ch.parentExecutionId && !ids.has(ch.parentExecutionId)) ch = { ...ch, parentExecutionId: null };
      if (Array.isArray(ch.linkedExecutionIds) && ch.linkedExecutionIds.some(x => !ids.has(x))) ch = { ...ch, linkedExecutionIds: ch.linkedExecutionIds.filter(x => ids.has(x)) };
      return ch;
    });
  } else if (f.id === 'orfaos') {
    const kill = new Set((f.itens || []).map(i => i.id));
    ['debts', 'executions', 'intimations', 'hearings', 'people', 'assets'].forEach(col => {
      next[col] = (next[col] || []).map(x => kill.has(x.id) ? { ...x, operationId: '' } : x);
    });
  } else if (f.id === 'intimsemop') {
    const map = {};
    (f.itens || []).forEach(i => { map[i.id] = i.opId; });
    next.intimations = (next.intimations || []).map(x => map[x.id] ? { ...x, operationId: map[x.id] } : x);
  } else if (f.id === 'formato') {
    const canon = {};
    (next.executions || []).forEach(e => {
      if (operationId && e.operationId !== operationId) return;
      const n = normProc(e.processNumber);
      if (n && e.processNumber) canon[n] = e.processNumber;
    });
    ['debts', 'intimations', 'hearings'].forEach(col => {
      next[col] = (next[col] || []).map(x => {
        if (operationId && x.operationId !== operationId) return x;
        const n = normProc(x.processNumber);
        return (n && canon[n] && canon[n] !== x.processNumber) ? { ...x, processNumber: canon[n] } : x;
      });
    });
  }
  return next;
}
