/**
 * Proteção na importação de PDF SIDA/Debcad:
 * confirma se os devedores do relatório batem com pessoas da operação aberta.
 * Sem dependências de UI / React.
 */
import {
  digitsOnly,
  findPersonByDoc,
  formatCpfCnpj,
  mergePersonDoc,
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

function isPlaceholderPersonName(name) {
  return /^\[Importado SIDA\]/i.test(String(name || '').trim());
}

/**
 * Localiza ou cria o corresponsável na lista de trabalho (a mesma da importação em curso).
 * Sem essa lista, cada CDA do PDF gerava uma ficha nova da mesma pessoa.
 */
export function ensureCorespPerson(people, { operationId, cr, now, newId, note } = {}) {
  const list = Array.isArray(people) ? people : [];
  const doc = (cr && (cr.cpfCnpjFormatted || cr.cpfCnpj)) || '';
  if (!digitsOnly(doc)) return { person: null, created: false, changed: false, people: list };

  let person = findPersonByDoc(list, { operationId, cpfCnpj: doc, name: cr && cr.name });
  if (person) {
    const updated = mergePersonDoc(person, doc);
    if (updated === person) return { person, created: false, changed: false, people: list };
    return {
      person: updated,
      created: false,
      changed: true,
      people: list.map(p => p.id === person.id ? updated : p)
    };
  }

  const digits = digitsOnly(doc);
  const hasName = cr && cr.name && String(cr.name).trim().length > 2;
  const stamp = now || new Date().toISOString();
  person = {
    id: typeof newId === 'function' ? newId() : `p-${digits}`,
    operationId,
    name: hasName ? String(cr.name).trim() : `[Importado SIDA] ${formatCpfCnpj(doc) || doc}`,
    cpfCnpj: formatCpfCnpj(doc) || doc,
    subtype: digits.length > 11 ? 'PJ' : 'PF',
    operationRole: 'relacionada',
    role: 'Corresponsável',
    notesList: note ? [note] : [],
    createdAt: stamp,
    updatedAt: stamp
  };
  return { person, created: true, changed: true, people: [...list, person] };
}

function personDocGroupKey(person) {
  const d = digitsOnly(person && person.cpfCnpj);
  if (d.length !== 11 && d.length !== 14) return '';
  return `${person.operationId || ''}|${d}`;
}

function scoreKeeper(person) {
  let s = 0;
  if ((person.operationRole || 'alvo') === 'alvo') s += 100;
  if (!isPlaceholderPersonName(person.name)) s += 20;
  const notes = person.notesList || [];
  s += Math.min(5, notes.length);
  return s;
}

function pickKeeper(group) {
  return [...group].sort((a, b) => {
    const ds = scoreKeeper(b) - scoreKeeper(a);
    if (ds) return ds;
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
      || String(a.id).localeCompare(String(b.id));
  })[0];
}

function uniqNotes(lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists || []) {
    for (const n of list || []) {
      const text = typeof n === 'string' ? n : (n && (n.text || n.content)) || '';
      const key = String(text).trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
  }
  return out;
}

function mergeKeeperPerson(keeper, group) {
  let next = { ...keeper };
  for (const p of group) {
    if (p.id === keeper.id) continue;
    next = mergePersonDoc(next, p.cpfCnpj);
    if (isPlaceholderPersonName(next.name) && p.name && !isPlaceholderPersonName(p.name)) {
      next = { ...next, name: p.name };
    }
    if ((p.operationRole || 'alvo') === 'alvo') next.operationRole = 'alvo';
  }
  next.notesList = uniqNotes(group.map(p => p.notesList));
  return next;
}

function remapPersonId(id, remap) {
  return (id && remap.has(id)) ? remap.get(id) : id;
}

function dedupeLinkList(links, remap, keyFn) {
  const seen = new Set();
  const out = [];
  for (const link of links || []) {
    if (!link) continue;
    const next = { ...link, personId: remapPersonId(link.personId, remap) };
    const key = keyFn(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out;
}

/**
 * Junta fichas da mesma pessoa (mesmo CPF de 11 dígitos ou CNPJ de 14)
 * dentro da mesma operação. Reaponta CDA, bem e vínculos.
 * Não mistura filiais (CNPJs 14 distintos) nem operações diferentes.
 */
export function dedupePeopleByDoc(data) {
  if (!data || !Array.isArray(data.people)) return { data, removed: 0 };

  const groups = new Map();
  for (const person of data.people) {
    if (!person) continue;
    const key = personDocGroupKey(person);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(person);
  }

  const remap = new Map();
  const drop = new Set();
  const keeperById = new Map();

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keeper = pickKeeper(group);
    keeperById.set(keeper.id, mergeKeeperPerson(keeper, group));
    for (const person of group) {
      if (person.id === keeper.id) continue;
      remap.set(person.id, keeper.id);
      drop.add(person.id);
    }
  }

  if (remap.size === 0) return { data, removed: 0 };

  const people = data.people
    .filter(p => p && !drop.has(p.id))
    .map(p => keeperById.get(p.id) || p);

  const debts = (data.debts || []).map(d => (
    d && d.personId && remap.has(d.personId) ? { ...d, personId: remap.get(d.personId) } : d
  ));
  const assets = (data.assets || []).map(a => (
    a && a.holderId && remap.has(a.holderId) ? { ...a, holderId: remap.get(a.holderId) } : a
  ));
  const links = { ...(data.links || {}) };
  links.cdaResponsibilities = dedupeLinkList(
    links.cdaResponsibilities,
    remap,
    l => `${l.cdaId || ''}|${l.personId || ''}|${l.role || ''}`
  );
  links.measurePeople = dedupeLinkList(
    links.measurePeople,
    remap,
    l => `${l.measureId || ''}|${l.personId || ''}`
  );

  return {
    data: { ...data, people, debts, assets, links },
    removed: drop.size
  };
}
