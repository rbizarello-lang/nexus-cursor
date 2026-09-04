/**
 * Proteção na importação de PDF SIDA/Debcad:
 * confirma se os devedores do relatório batem com pessoas da operação aberta.
 * Sem dependências de UI / React.
 */
import {
  digitsOnly,
  findPersonByDoc,
  formatCpfCnpj,
  normalizePersonName
} from './docs.js';

function findPersonByUniqueName(people, operationId, name) {
  const n = normalizePersonName(name);
  if (!n) return null;
  const hits = (people || []).filter(p => p && p.operationId === operationId && normalizePersonName(p.name) === n);
  return hits.length === 1 ? hits[0] : null;
}

/**
 * Extrai devedores únicos de registros já parseados (SIDA ou Debcad).
 */
export function collectPdfDebtors(records) {
  const byKey = new Map();
  const add = (name, cpfCnpj, source) => {
    const digits = digitsOnly(cpfCnpj);
    const key = digits || (name ? 'name:' + normalizePersonName(name) : '');
    if (!key) return;
    if (byKey.has(key)) {
      const prev = byKey.get(key);
      if (!prev.name && name) prev.name = name;
      if (digitsOnly(cpfCnpj).length > digitsOnly(prev.cpfCnpj).length) prev.cpfCnpj = cpfCnpj;
      return;
    }
    byKey.set(key, { name: name || '', cpfCnpj: cpfCnpj || '', source });
  };

  for (const rec of records || []) {
    if (!rec) continue;
    add(rec.devedor || '', rec.cnpj || '', 'principal');
    for (const d of rec.devedores || []) {
      add(d.name || '', d.cpfCnpj || '', 'devedores');
    }
    for (const cr of rec.coresponsibles || []) {
      add(cr.name || '', cr.cpfCnpjFormatted || cr.cpfCnpj || '', 'coresponsavel');
    }
  }
  return [...byKey.values()];
}

/**
 * Compara os devedores do PDF com as pessoas da operação aberta.
 * needsConfirmation = ninguém bateu (ou o PDF não trouxe documento/nome).
 */
export function assessPdfDebtorsAgainstOperation(debtors, people, operations, activeOpId) {
  const list = Array.isArray(debtors) ? debtors : [];
  const matched = [];
  const unmatched = [];
  const otherOps = [];

  for (const d of list) {
    let inOp = findPersonByDoc(people, { operationId: activeOpId, cpfCnpj: d.cpfCnpj, name: d.name });
    if (!inOp && !digitsOnly(d.cpfCnpj) && d.name) {
      inOp = findPersonByUniqueName(people, activeOpId, d.name);
    }
    if (inOp) {
      matched.push({ debtor: d, person: inOp });
      continue;
    }

    unmatched.push(d);

    for (const op of operations || []) {
      if (!op || op.id === activeOpId) continue;
      let hit = findPersonByDoc(people, { operationId: op.id, cpfCnpj: d.cpfCnpj, name: d.name });
      if (!hit && !digitsOnly(d.cpfCnpj) && d.name) {
        hit = findPersonByUniqueName(people, op.id, d.name);
      }
      if (hit) {
        otherOps.push({ debtor: d, operationName: op.name || 'outra operação', operationId: op.id });
        break;
      }
    }
  }

  return {
    debtors: list,
    matched,
    unmatched,
    otherOps,
    needsConfirmation: list.length === 0 || matched.length === 0
  };
}

function labelDebtor(d) {
  const doc = formatCpfCnpj(d.cpfCnpj) || d.cpfCnpj || '';
  if (d.name && doc) return `${d.name} (${doc})`;
  return d.name || doc || 'devedor sem nome';
}

/**
 * Texto do pedido de confirmação (caixa nativa do navegador).
 */
export function buildPdfImportConfirmMessage(assessment, operationName) {
  const op = operationName || 'esta operação';
  const shown = (assessment.unmatched && assessment.unmatched.length
    ? assessment.unmatched
    : assessment.debtors || []
  ).slice(0, 5);

  let msg = `Este relatório não parece pertencer à operação "${op}".\n\n`;
  if (shown.length) {
    msg += 'Devedores no PDF:\n' + shown.map(d => '• ' + labelDebtor(d)).join('\n') + '\n\n';
  } else {
    msg += 'Não foi possível identificar CPF/CNPJ de devedor no arquivo.\n\n';
  }

  if (assessment.otherOps && assessment.otherOps.length) {
    const byOp = {};
    assessment.otherOps.forEach(x => {
      const name = x.operationName || 'outra operação';
      byOp[name] = byOp[name] || [];
      byOp[name].push(labelDebtor(x.debtor));
    });
    msg += 'Essas pessoas já estão em outra operação:\n';
    Object.entries(byOp).forEach(([opName, peopleLabels]) => {
      msg += `• ${opName}: ${peopleLabels.slice(0, 3).join(', ')}\n`;
    });
    msg += '\n';
  } else {
    msg += 'Nenhuma dessas pessoas está cadastrada nesta operação.\n\n';
  }

  msg += 'Cancelar: não importa nada.\nOK: importar mesmo assim.';
  return msg;
}
