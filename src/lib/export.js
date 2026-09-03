/**
 * Exportação tabular da carteira (XLSX) e recorte JSON.
 * Sem dependências de UI / React.
 */
import { digitsOnly } from './docs.js';

export const EXPORT_DATASETS = [
  { id: 'pessoas', label: 'Pessoas', hint: 'Nome, CPF, CNPJ, papel e operação', sheet: 'Pessoas' },
  { id: 'cnpjs', label: 'CNPJs', hint: 'CNPJs únicos de pessoas e CDAs', sheet: 'CNPJs' },
  { id: 'operacoes', label: 'Operações', hint: 'Nome, status e descrição da carteira', sheet: 'Operacoes' },
  { id: 'inscricoes', label: 'Inscrições (CDAs)', hint: 'CDA, valor, status e processo', sheet: 'Inscricoes' },
  { id: 'processos', label: 'Processos', hint: 'Número, classe, juízo e status', sheet: 'Processos' },
  { id: 'bens', label: 'Bens', hint: 'Descrição, titular e status', sheet: 'Bens' },
  { id: 'intimacoes', label: 'Intimações', hint: 'Processo, prazo e status', sheet: 'Intimacoes' },
  { id: 'tarefas', label: 'Tarefas', hint: 'Título, vencimento e status', sheet: 'Tarefas' },
  { id: 'audiencias', label: 'Audiências', hint: 'Data, processo e tipo', sheet: 'Audiencias' },
  { id: 'json', label: 'Backup JSON', hint: 'Arquivo completo para restaurar no NEXUS', kind: 'json' },
];

export const DEFAULT_EXPORT_SELECTION = ['pessoas', 'cnpjs'];

const SCOPED_COLS = [
  'people', 'debts', 'executions', 'assets', 'intimations', 'tasks', 'hearings',
  'measures', 'documents', 'prescriptionEvents', 'stickyNotes', 'watchlist', 'importLogs',
];

const PERSON_POS = { alvo: 'Alvo Direto', relacionada: 'Relacionada (análise)' };
const DEBT_ST = {
  ativa: 'Ativa', ativa_ajuizada: 'Ativa Ajuizada', ativa_nao_ajuizavel: 'Não Ajuizável',
  parcelada: 'Parcelada', negociada_sispar: 'Negociada SISPAR', suspensa_judicial: 'Suspensa (Judicial)',
  suspensa_admin: 'Suspensa (Admin)', garantida: 'Garantida', extinta: 'Extinta',
};
const EXEC_ST = {
  ativa: 'Ativa', suspensa: 'Suspensa', suspensa_parcelamento: 'Suspensão parcelamento',
  arquivada: 'Arquivada art. 40', extinta: 'Extinta',
};
const ASSET_ST = {
  indisponibilidade_ativa: 'Indisponibilidade Ativa',
  indisponibilidade_requerida: 'Indisponibilidade Requerida',
  liberado: 'Liberado', controvertido: 'Controvertido',
};
const ASSET_SUB = {
  imovel: 'Imóvel', veiculo: 'Veículo', conta_bancaria: 'Conta Bancária',
  investimento: 'Investimento', participacao: 'Participação Societária', outro: 'Outro',
};
const INTIM_ST = {
  pendente_analise: 'Pendente de Análise', aguardando_subsidios: 'Aguardando Subsídios',
  analisado: 'Analisado', peca_edicao: 'Peça em Edição',
};
const TASK_ST = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' };
const HEAR_ST = { agendada: 'Agendada', redesignada: 'Redesignada', realizada: 'Realizada', cancelada: 'Cancelada' };
const HEAR_TYPE = {
  instrucao: 'Instrução', conciliacao: 'Conciliação', una: 'Una',
  justificacao: 'Justificação', inquiricao: 'Inquirição', outra: 'Outra',
};
const OP_ST = { ativa: 'Ativa', encerrada: 'Encerrada' };

function lbl(map, key) {
  if (key == null || key === '') return '';
  return (map && map[key]) || String(key);
}

function opNameMap(ops) {
  const m = {};
  (ops || []).forEach(o => { if (o && o.id) m[o.id] = o.name || o.id; });
  return m;
}

function opNameOf(map, id) {
  if (!id) return '';
  return map[id] || '';
}

function sortPt(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'pt-BR', { sensitivity: 'base' });
}

export function isCnpjDigits(d) {
  const n = String(d || '');
  return n.length === 14 || n.length === 12 || n.length === 8;
}

export function isCpfDigits(d) {
  return String(d || '').length === 11;
}

export function formatCnpj(raw) {
  const d = digitsOnly(raw);
  if (d.length === 14) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12) + '-' + d.slice(12);
  if (d.length === 12) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12);
  if (d.length === 8) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8);
  return String(raw || '').trim();
}

export function formatCpf(raw) {
  const d = digitsOnly(raw);
  if (d.length === 11) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
  return String(raw || '').trim();
}

/**
 * Separa o campo misturado cpfCnpj em colunas CPF e CNPJ.
 * PJ / 8–12–14 dígitos → CNPJ; PF / 11 dígitos → CPF.
 */
export function splitPersonDoc(person) {
  const raw = String((person && person.cpfCnpj) || '').trim();
  const d = digitsOnly(raw);
  const subtype = person && person.subtype;
  if (isCpfDigits(d)) return { cpf: formatCpf(raw) || raw, cnpj: '' };
  if (isCnpjDigits(d)) return { cpf: '', cnpj: formatCnpj(raw) || raw };
  if (subtype === 'PF') return { cpf: raw, cnpj: '' };
  if (subtype === 'PJ') return { cpf: '', cnpj: raw };
  return { cpf: raw, cnpj: '' };
}

export function filterDataForExport(data, operationId) {
  const src = data || {};
  if (!operationId) return src;
  const out = Object.assign({}, src, {
    operations: (src.operations || []).filter(o => o && o.id === operationId),
  });
  SCOPED_COLS.forEach(k => {
    out[k] = (src[k] || []).filter(x => x && x.operationId === operationId);
  });
  const cdaIds = {};
  (out.debts || []).forEach(d => { if (d && d.id) cdaIds[d.id] = true; });
  const links = Object.assign({}, src.links || {});
  links.cdaResponsibilities = (links.cdaResponsibilities || []).filter(r => r && cdaIds[r.cdaId]);
  out.links = links;
  return out;
}

function buildPessoas(data) {
  const ops = opNameMap(data.operations);
  const rows = [['Nome', 'Tipo', 'CPF', 'CNPJ', 'Papel', 'Posição', 'Operação']];
  const people = [...(data.people || [])].sort((a, b) => {
    const op = sortPt(opNameOf(ops, a.operationId), opNameOf(ops, b.operationId));
    if (op) return op;
    return sortPt(a.name, b.name);
  });
  people.forEach(p => {
    const doc = splitPersonDoc(p);
    rows.push([
      p.name || '',
      p.subtype || '',
      doc.cpf,
      doc.cnpj,
      p.role || '',
      lbl(PERSON_POS, p.operationRole),
      opNameOf(ops, p.operationId),
    ]);
  });
  return rows;
}

function addCnpjEntry(byDigits, raw, name, opName, origem) {
  const d = digitsOnly(raw);
  if (!isCnpjDigits(d)) return;
  const prev = byDigits.get(d) || { cnpj: formatCnpj(raw) || raw, names: new Set(), ops: new Set(), origens: new Set() };
  if (formatCnpj(raw).length > String(prev.cnpj || '').length) prev.cnpj = formatCnpj(raw);
  if (name) prev.names.add(name);
  if (opName) prev.ops.add(opName);
  if (origem) prev.origens.add(origem);
  byDigits.set(d, prev);
}

function buildCnpjs(data) {
  const ops = opNameMap(data.operations);
  const byDigits = new Map();
  (data.people || []).forEach(p => {
    const doc = splitPersonDoc(p);
    if (doc.cnpj) addCnpjEntry(byDigits, p.cpfCnpj || doc.cnpj, p.name, opNameOf(ops, p.operationId), 'Pessoa');
  });
  (data.debts || []).forEach(d => {
    const op = opNameOf(ops, d.operationId);
    if (d.cnpj) addCnpjEntry(byDigits, d.cnpj, d.devedor || '', op, 'CDA');
    (d.devedores || []).forEach(dev => {
      const raw = dev && (dev.cpfCnpj || dev.cnpj);
      if (raw) addCnpjEntry(byDigits, raw, (dev && dev.name) || d.devedor || '', op, 'CDA');
    });
  });
  const rows = [['CNPJ', 'Nome', 'Operação', 'Origem']];
  const entries = [...byDigits.values()].sort((a, b) => sortPt([...a.names][0], [...b.names][0]) || sortPt(a.cnpj, b.cnpj));
  entries.forEach(e => {
    rows.push([
      e.cnpj,
      [...e.names].filter(Boolean).join('; '),
      [...e.ops].filter(Boolean).join('; '),
      [...e.origens].join('; '),
    ]);
  });
  return rows;
}

function buildOperacoes(data) {
  const rows = [['Nome', 'Status', 'Prioridade', 'Descrição']];
  const ops = [...(data.operations || [])].sort((a, b) => sortPt(a.name, b.name));
  ops.forEach(o => {
    rows.push([o.name || '', lbl(OP_ST, o.status) || (o.status || ''), o.priority || '', o.description || '']);
  });
  return rows;
}

function personNameById(data) {
  const m = {};
  (data.people || []).forEach(p => { if (p && p.id) m[p.id] = p.name || ''; });
  return m;
}

function buildInscricoes(data) {
  const ops = opNameMap(data.operations);
  const names = personNameById(data);
  const rows = [['CDA', 'Valor', 'Status', 'Tributo', 'Processo', 'Devedor', 'CNPJ da CDA', 'Operação']];
  const debts = [...(data.debts || [])].sort((a, b) => sortPt(a.cdaNumber, b.cdaNumber));
  debts.forEach(d => {
    rows.push([
      d.cdaNumber || d.number || '',
      d.value == null ? '' : d.value,
      lbl(DEBT_ST, d.status),
      d.tribute || '',
      d.processNumber || '',
      names[d.personId] || d.devedor || '',
      d.cnpj ? formatCnpj(d.cnpj) : '',
      opNameOf(ops, d.operationId),
    ]);
  });
  return rows;
}

function buildProcessos(data) {
  const ops = opNameMap(data.operations);
  const rows = [['Processo', 'Classe', 'Juízo', 'Status', 'Marcador', 'Operação']];
  const execs = [...(data.executions || [])].sort((a, b) => sortPt(a.processNumber, b.processNumber));
  execs.forEach(e => {
    rows.push([
      e.processNumber || '',
      e.className || '',
      e.court || '',
      lbl(EXEC_ST, e.status),
      e.processTag || '',
      opNameOf(ops, e.operationId),
    ]);
  });
  return rows;
}

function buildBens(data) {
  const ops = opNameMap(data.operations);
  const names = personNameById(data);
  const rows = [['Descrição', 'Tipo', 'Registro', 'Titular', 'Status', 'Valor', 'Origem', 'Processo', 'Operação']];
  const assets = [...(data.assets || [])].sort((a, b) => sortPt(a.description, b.description));
  assets.forEach(a => {
    rows.push([
      a.description || '',
      lbl(ASSET_SUB, a.subtype) || (a.subtype || ''),
      a.registry || '',
      names[a.holderId] || a.holderDoc || '',
      lbl(ASSET_ST, a.status),
      a.value == null ? '' : a.value,
      a.source || '',
      a.processRef || '',
      opNameOf(ops, a.operationId),
    ]);
  });
  return rows;
}

function buildIntimacoes(data) {
  const ops = opNameMap(data.operations);
  const rows = [['Processo', 'Prazo', 'Status', 'Evento', 'Parte', 'Operação']];
  const list = [...(data.intimations || [])].sort((a, b) => sortPt(a.dateDeadline, b.dateDeadline) || sortPt(a.processNumber, b.processNumber));
  list.forEach(x => {
    rows.push([
      x.processNumber || '',
      x.dateDeadline || '',
      lbl(INTIM_ST, x.status),
      x.eventDescription || '',
      x.partyName || x.parties || '',
      opNameOf(ops, x.operationId),
    ]);
  });
  return rows;
}

function buildTarefas(data) {
  const ops = opNameMap(data.operations);
  const rows = [['Título', 'Vencimento', 'Status', 'Prioridade', 'Operação']];
  const list = [...(data.tasks || [])].sort((a, b) => sortPt(a.dueDate, b.dueDate) || sortPt(a.title, b.title));
  list.forEach(t => {
    rows.push([
      t.title || t.description || '',
      t.dueDate || '',
      lbl(TASK_ST, t.status),
      t.priority || '',
      opNameOf(ops, t.operationId),
    ]);
  });
  return rows;
}

function buildAudiencias(data) {
  const ops = opNameMap(data.operations);
  const rows = [['Data', 'Hora', 'Processo', 'Tipo', 'Status', 'Partes', 'Operação']];
  const list = [...(data.hearings || [])].sort((a, b) => sortPt(a.date, b.date) || sortPt(a.time, b.time));
  list.forEach(h => {
    rows.push([
      h.date || '',
      h.time || '',
      h.processNumber || '',
      lbl(HEAR_TYPE, h.hearingType) || (h.hearingType || ''),
      lbl(HEAR_ST, h.status),
      h.parties || '',
      opNameOf(ops, h.operationId),
    ]);
  });
  return rows;
}

const BUILDERS = {
  pessoas: buildPessoas,
  cnpjs: buildCnpjs,
  operacoes: buildOperacoes,
  inscricoes: buildInscricoes,
  processos: buildProcessos,
  bens: buildBens,
  intimacoes: buildIntimacoes,
  tarefas: buildTarefas,
  audiencias: buildAudiencias,
};

export function buildDatasetRows(data, datasetId) {
  const fn = BUILDERS[datasetId];
  return fn ? fn(data || {}) : [['']];
}

export function countExportItems(data, datasetId) {
  if (datasetId === 'json') return 1;
  const rows = buildDatasetRows(data, datasetId);
  return Math.max(0, rows.length - 1);
}

export function buildExportWorkbook(data, selectedIds, options) {
  const selected = new Set(selectedIds || []);
  const operationId = options && options.operationId;
  const scoped = filterDataForExport(data, operationId);
  const sheets = [];
  EXPORT_DATASETS.forEach(ds => {
    if (ds.kind === 'json') return;
    if (!selected.has(ds.id)) return;
    sheets.push({ id: ds.id, name: ds.sheet, rows: buildDatasetRows(scoped, ds.id) });
  });
  return {
    sheets,
    includeJson: selected.has('json'),
    jsonData: selected.has('json') ? scoped : null,
    scoped: !!operationId,
  };
}

/** Converte matrizes em CSV (separador ;, BOM UTF-8) para fallback sem SheetJS. */
export function sheetsToCsvParts(sheets) {
  return (sheets || []).map(s => {
    const body = (s.rows || []).map(r => (r || []).map(cell => {
      const v = cell == null ? '' : String(cell);
      if (/[";\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
      return v;
    }).join(';')).join('\r\n');
    return { name: s.name || 'dados', csv: '\uFEFF' + body };
  });
}
