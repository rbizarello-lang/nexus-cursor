
// ══════════════════════════════════════════════════════════
// NEXUS Cloud — Google Apps Script Backend v5
// ══════════════════════════════════════════════════════════
// Salva JSON como arquivo no Google Drive (sem limite de 50k)
// A planilha serve apenas como log de sincronizações.
//
// v5 — Integridade (ago/2026):
//   - Arquivo de dados pinado por ID (PropertiesService), não por nome no Drive
//   - Save atômico: compare-and-swap da revisão dentro do LockService
//   - Snapshot do conteúdo ANTERIOR à gravação + diários 14d + semanais 8w
//   (mantém v4: listBackups/restoreBackup; v3: LockService, JSON.parse)

var DATA_FILENAME = 'nexus_data.json';
var DATA_FILE_ID_KEY = 'NEXUS_DATA_FILE_ID';
var DATA_REV_KEY = 'NEXUS_DATA_REV';
var BACKUP_PREFIX = 'nexus_backup_';
var BACKUP_WEEK_PREFIX = 'nexus_backup_week_';
var BACKUP_KEEP_DAYS = 14;
var BACKUP_KEEP_WEEKS = 8;

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;

  if (action === 'ping') {
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'NEXUS Cloud v5 ativo' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var html = HtmlService.createHtmlOutputFromFile('Nexus')
    .setTitle('NEXUS — Painel de Operações Fiscais')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  html.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  return html;
}

// ── Helpers ──

function getDataFolder_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ssFile = DriveApp.getFileById(ss.getId());
  var parents = ssFile.getParents();
  return parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
}

function scriptProps_() {
  return PropertiesService.getScriptProperties();
}

function getStoredDataFileId_() {
  return scriptProps_().getProperty(DATA_FILE_ID_KEY);
}

function storeDataFileId_(id) {
  if (id) scriptProps_().setProperty(DATA_FILE_ID_KEY, id);
}

function getDataRev_() {
  var r = scriptProps_().getProperty(DATA_REV_KEY);
  var n = r ? parseInt(r, 10) : 0;
  return isNaN(n) ? 0 : n;
}

function setDataRev_(n) {
  scriptProps_().setProperty(DATA_REV_KEY, String(n));
}

function findDataFile_() {
  var folder = getDataFolder_();
  var files = folder.getFilesByName(DATA_FILENAME);
  if (!files.hasNext()) return null;
  var file = files.next();
  if (files.hasNext()) {
    Logger.log('AVISO: mais de um ' + DATA_FILENAME + ' na pasta da planilha; usando id=' + file.getId());
  }
  return file;
}

/** Arquivo canônico: ID persistido, com fallback para a pasta da planilha. */
function resolveDataFile_() {
  var id = getStoredDataFileId_();
  if (id) {
    try {
      var pinned = DriveApp.getFileById(id);
      if (pinned && !pinned.isTrashed()) return pinned;
    } catch (e) {
      Logger.log('ID de dados obsoleto (' + id + '): ' + e.message);
    }
  }
  var file = findDataFile_();
  if (file) storeDataFileId_(file.getId());
  return file;
}

function createDataFile_(content) {
  var folder = getDataFolder_();
  var file = folder.createFile(DATA_FILENAME, content || '{}', 'application/json');
  storeDataFileId_(file.getId());
  return file;
}

function conflictResult_(file, rev, extraMsg) {
  var mtime = file ? file.getLastUpdated().toISOString() : null;
  return {
    success: false,
    conflict: true,
    rev: rev,
    mtime: mtime,
    error: extraMsg || 'Conflito de versão: a nuvem mudou desde o último save desta máquina. Use ⬇ para carregar ou confirme sobrescrever.'
  };
}

// ── Backup helpers ──

function nowLocal_() {
  var now = new Date();
  var offset = -3; // BRT
  return new Date(now.getTime() + offset * 3600000);
}

function todayStr_() {
  return nowLocal_().toISOString().slice(0, 10);
}

function isoWeekKeyFromYmd_(ymd) {
  var parts = String(ymd).split('-');
  var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
  var date = new Date(Date.UTC(y, m - 1, d));
  var dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  var wy = date.getUTCFullYear();
  return wy + '-W' + ('0' + weekNo).slice(-2);
}

function mondayOfIsoWeekKey_(key) {
  var y = parseInt(String(key).slice(0, 4), 10);
  var w = parseInt(String(key).replace(/^.*W/, ''), 10);
  if (isNaN(y) || isNaN(w)) return null;
  var jan4 = new Date(Date.UTC(y, 0, 4));
  var day = jan4.getUTCDay() || 7;
  var monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (day - 1) + (w - 1) * 7);
  return monday;
}

function writeBackupIfAbsent_(folder, name, jsonString) {
  var existing = folder.getFilesByName(name);
  if (existing.hasNext()) return false;
  folder.createFile(name, jsonString, 'application/json');
  return true;
}

/** Snapshot do conteúdo ANTERIOR à gravação: rolling + 1º save do dia + 1º save da semana. */
function createPreWriteBackups_(oldContent) {
  if (oldContent == null || oldContent === '') return;
  var folder = getDataFolder_();
  var prewriteName = BACKUP_PREFIX + 'prewrite.json';
  var existing = folder.getFilesByName(prewriteName);
  if (existing.hasNext()) {
    existing.next().setContent(oldContent);
  } else {
    folder.createFile(prewriteName, oldContent, 'application/json');
  }
  writeBackupIfAbsent_(folder, BACKUP_PREFIX + todayStr_() + '.json', oldContent);
  writeBackupIfAbsent_(folder, BACKUP_WEEK_PREFIX + isoWeekKeyFromYmd_(todayStr_()) + '.json', oldContent);
}

function pruneOldBackups_() {
  var folder = getDataFolder_();
  var today = todayStr_();
  var todayParts = today.split('-');
  var dailyCutoff = new Date(parseInt(todayParts[0], 10), parseInt(todayParts[1], 10) - 1, parseInt(todayParts[2], 10));
  dailyCutoff.setDate(dailyCutoff.getDate() - BACKUP_KEEP_DAYS);
  var weekCutoff = mondayOfIsoWeekKey_(isoWeekKeyFromYmd_(today));
  if (weekCutoff) weekCutoff = new Date(weekCutoff.getTime() - BACKUP_KEEP_WEEKS * 7 * 86400000);

  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var name = f.getName();
    if (name.indexOf(BACKUP_PREFIX) !== 0) continue;
    if (!name.endsWith('.json')) continue;
    if (name.indexOf('pre-restore') !== -1) continue;
    if (name.indexOf('prewrite') !== -1) continue;

    if (name.indexOf(BACKUP_WEEK_PREFIX) === 0) {
      var weekKey = name.replace(BACKUP_WEEK_PREFIX, '').replace('.json', '');
      var monday = mondayOfIsoWeekKey_(weekKey);
      if (monday && weekCutoff && monday < weekCutoff) f.setTrashed(true);
      continue;
    }

    var dateStr = name.replace(BACKUP_PREFIX, '').replace('.json', '');
    var parts = dateStr.split('-');
    if (parts.length !== 3) continue;
    var fileDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (fileDate < dailyCutoff) f.setTrashed(true);
  }
}

// ── API chamada pelo frontend via google.script.run ──

function loadNexusData() {
  var file = resolveDataFile_();
  if (!file) return '{}';
  return file.getBlob().getDataAsString();
}

function getRemoteMtime() {
  var file = resolveDataFile_();
  if (!file) return { success: true, exists: false, mtime: null, size: 0, rev: getDataRev_() };
  return {
    success: true,
    exists: true,
    mtime: file.getLastUpdated().toISOString(),
    size: file.getSize(),
    rev: getDataRev_(),
    fileId: file.getId()
  };
}

/**
 * Grava o JSON canônico.
 * expectedRev: revisão que o cliente viu por último (número).
 * force: true só após o usuário confirmar sobrescrita explícita.
 * A comparação ocorre DENTRO do lock — não há janela entre checagem e escrita.
 */
function saveNexusData(jsonString, expectedRev, force) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'Outra sincronização em andamento. Tente novamente em alguns segundos.' };
  }

  try {
    try {
      JSON.parse(jsonString);
    } catch (parseErr) {
      return { success: false, error: 'JSON inválido — arquivo NÃO foi sobrescrito. ' + parseErr.message };
    }

    var file = resolveDataFile_();
    var currentRev = getDataRev_();
    var forced = force === true || force === 'true';

    if (!forced && file) {
      var sent = expectedRev !== null && expectedRev !== undefined && expectedRev !== '';
      if (!sent) {
        if (currentRev > 0) return conflictResult_(file, currentRev, 'Revisão não enviada. Recarregue os dados (⬇) e tente de novo.');
      } else if (Number(expectedRev) !== Number(currentRev)) {
        return conflictResult_(file, currentRev);
      }
    }

    if (file) {
      try {
        createPreWriteBackups_(file.getBlob().getDataAsString());
      } catch (bkErr) {
        Logger.log('Backup pré-gravação: ' + bkErr.message);
      }
      file.setContent(jsonString);
    } else {
      file = createDataFile_(jsonString);
    }
    storeDataFileId_(file.getId());

    var newRev = currentRev + 1;
    setDataRev_(newRev);

    try {
      pruneOldBackups_();
    } catch (pruneErr) {
      Logger.log('Backup prune: ' + pruneErr.message);
    }

    // Log na planilha
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var nextRow = Math.min(sheet.getLastRow() + 1, 200);
    if (nextRow < 2) nextRow = 2;
    sheet.getRange('A1').setValue('NEXUS Data → ' + DATA_FILENAME + ' (' + (jsonString.length / 1024).toFixed(1) + ' KB)');
    sheet.getRange('A' + nextRow).setValue(new Date().toLocaleString('pt-BR'));
    sheet.getRange('B' + nextRow).setValue((jsonString.length / 1024).toFixed(1) + ' KB');

    return {
      success: true,
      size: jsonString.length,
      mtime: file.getLastUpdated().toISOString(),
      rev: newRev,
      fileId: file.getId()
    };
  } catch (err) {
    return { success: false, error: 'Erro ao salvar: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

// ── Backup management (chamado pelo frontend) ──

function listBackups() {
  var folder = getDataFolder_();
  var files = folder.getFiles();
  var backups = [];
  while (files.hasNext()) {
    var f = files.next();
    var name = f.getName();
    if (name.indexOf(BACKUP_PREFIX) !== 0 || !name.endsWith('.json')) continue;
    backups.push({
      name: name,
      date: name.replace(BACKUP_PREFIX, '').replace('.json', ''),
      size: f.getSize(),
      mtime: f.getLastUpdated().toISOString()
    });
  }
  backups.sort(function(a, b) { return b.date.localeCompare(a.date); });
  return { success: true, backups: backups };
}

function restoreBackup(backupName) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'Outra operação em andamento.' };
  }
  try {
    var folder = getDataFolder_();
    var files = folder.getFilesByName(backupName);
    if (!files.hasNext()) return { success: false, error: 'Backup não encontrado: ' + backupName };
    var backupFile = files.next();
    var content = backupFile.getBlob().getDataAsString();
    try { JSON.parse(content); } catch (e) {
      return { success: false, error: 'Backup corrompido (JSON inválido).' };
    }
    // Salva estado atual como backup de emergência antes de restaurar
    var mainFile = resolveDataFile_();
    if (mainFile) {
      var emergName = BACKUP_PREFIX + 'pre-restore-' + todayStr_() + '.json';
      var existing = folder.getFilesByName(emergName);
      if (!existing.hasNext()) {
        folder.createFile(emergName, mainFile.getBlob().getDataAsString(), 'application/json');
      }
      mainFile.setContent(content);
    } else {
      mainFile = createDataFile_(content);
    }
    storeDataFileId_(mainFile.getId());
    var newRev = getDataRev_() + 1;
    setDataRev_(newRev);
    return {
      success: true,
      size: content.length,
      restoredFrom: backupName,
      rev: newRev,
      mtime: mainFile.getLastUpdated().toISOString(),
      fileId: mainFile.getId()
    };
  } catch (err) {
    return { success: false, error: 'Erro ao restaurar: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

// ── Teste ──

function testPing() { Logger.log('Script OK — v5 integridade'); }

function testLoad() {
  var data = loadNexusData();
  Logger.log('Dados (' + data.length + ' chars): ' + data.substring(0, 200));
}

function testSave() {
  var result = saveNexusData('{"test": true, "ts": "' + new Date().toISOString() + '"}');
  Logger.log('Resultado: ' + JSON.stringify(result));
}

function testSaveInvalid() {
  var result = saveNexusData('isso não é json');
  Logger.log('Resultado teste inválido: ' + JSON.stringify(result));
}

function testListBackups() {
  var result = listBackups();
  Logger.log('Backups: ' + JSON.stringify(result));
}

// ══════════════════════════════════════════════════════════
// Visão Gemini (opção Workspace) — materializa abas legíveis
// ══════════════════════════════════════════════════════════
// O Gemini do Google Workspace analisa bem Planilhas/Docs, não o
// nexus_data.json bruto. Esta rotina gera/atualiza abas "Gemini_*"
// a partir do acervo (JSON do cliente ou do Drive).
//
// Escopos: 'carteira' | 'hoje' | 'operacao'
// opts: { scope, operationId, jsonString }

var GEMINI_SHEET_PREFIX = 'Gemini_';
var GEMINI_SHEETS = ['Meta', 'Ops', 'Intimacoes', 'Prescricao', 'Tarefas', 'Briefing'];

function exportGeminiView(opts) {
  opts = opts || {};
  var scope = opts.scope || 'carteira';
  var operationId = opts.operationId || '';
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { success: false, error: 'Outra exportação em andamento. Tente em alguns segundos.' };
  }
  try {
    var raw = opts.jsonString;
    if (!raw) raw = loadNexusData();
    var data;
    try {
      data = JSON.parse(raw || '{}');
    } catch (e) {
      return { success: false, error: 'JSON inválido: ' + e.message };
    }

    var filtered = filterGeminiData_(data, scope, operationId);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var written = {};
    written.Meta = writeGeminiSheet_(ss, 'Meta', buildGeminiMeta_(scope, operationId, filtered));
    written.Ops = writeGeminiSheet_(ss, 'Ops', buildGeminiOps_(filtered));
    written.Intimacoes = writeGeminiSheet_(ss, 'Intimacoes', buildGeminiIntims_(filtered));
    written.Prescricao = writeGeminiSheet_(ss, 'Prescricao', buildGeminiPresc_(filtered));
    written.Tarefas = writeGeminiSheet_(ss, 'Tarefas', buildGeminiTasks_(filtered));
    written.Briefing = writeGeminiSheet_(ss, 'Briefing', buildGeminiBriefing_(filtered));

    // Leva o usuário para a aba Meta (instruções)
    var meta = ss.getSheetByName(GEMINI_SHEET_PREFIX + 'Meta');
    if (meta) ss.setActiveSheet(meta);

    return {
      success: true,
      scope: scope,
      operationId: operationId || null,
      spreadsheetUrl: ss.getUrl(),
      sheets: written,
      counts: {
        ops: Math.max(0, (written.Ops || 1) - 1),
        intimacoes: Math.max(0, (written.Intimacoes || 1) - 1),
        prescricoes: Math.max(0, (written.Prescricao || 1) - 1),
        tarefas: Math.max(0, (written.Tarefas || 1) - 1),
        briefings: Math.max(0, (written.Briefing || 1) - 1)
      },
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: 'Erro na visão Gemini: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

function filterGeminiData_(data, scope, operationId) {
  var ops = data.operations || [];
  var intimations = data.intimations || [];
  var tasks = data.tasks || [];
  var debts = data.debts || [];
  var executions = data.executions || [];
  var prescriptionEvents = data.prescriptionEvents || [];
  var people = data.people || [];
  var hearings = data.hearings || [];

  if (scope === 'operacao' && operationId) {
    ops = ops.filter(function(o) { return o.id === operationId; });
  } else if (scope === 'hoje') {
    // Operações com intimação/tarefa/audiência/prescrição em atenção próxima
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var hot = {};
    intimations.forEach(function(x) {
      if (x.responseAction || !x.operationId) return;
      var raw = x.dateDeadline ? String(x.dateDeadline) : '';
      var dk = (raw.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
      if (!dk) { if (x.status !== 'analisado') hot[x.operationId] = true; return; }
      var dd = Math.round((new Date(dk + 'T00:00:00') - today) / 86400000);
      if (x.status === 'analisado' && dd < 0) return;
      if (dd <= 7) hot[x.operationId] = true;
    });
    tasks.forEach(function(t) {
      if (t.status === 'concluida' || t.status === 'cancelada' || !t.operationId) return;
      if (!t.dueDate) { hot[t.operationId] = true; return; }
      var dd = Math.ceil((new Date(t.dueDate + 'T00:00:00') - today) / 86400000);
      if (dd <= 7) hot[t.operationId] = true;
    });
    hearings.forEach(function(h) {
      if (!h.operationId || !h.date || h.status === 'cancelada' || h.status === 'realizada') return;
      var dd = Math.round((new Date(h.date + 'T00:00:00') - today) / 86400000);
      if (dd >= 0 && dd <= 7) hot[h.operationId] = true;
    });
    debts.forEach(function(d) {
      if (!d.operationId || d.prescriptionHandled) return;
      var pd = d.prescriptionDate;
      var snap = d.prescriptionSnapshot || {};
      if (!pd && (snap.status === 'critico' || snap.status === 'alerta' || snap.status === 'prescrito')) pd = snap.diesAdQuem;
      if (!pd) return;
      var dd = snap.daysLeft != null && !d.prescriptionDate ? snap.daysLeft : Math.ceil((new Date(pd + 'T00:00:00') - today) / 86400000);
      if (dd <= 180) hot[d.operationId] = true;
    });
    ops = ops.filter(function(o) { return hot[o.id]; });
  } else {
    // carteira: só ativas (ou todas se status vazio)
    ops = ops.filter(function(o) { return o.status !== 'encerrada'; });
  }

  var opIds = {};
  ops.forEach(function(o) { opIds[o.id] = true; });

  return {
    operations: ops,
    intimations: intimations.filter(function(x) { return !x.operationId || opIds[x.operationId]; }),
    tasks: tasks.filter(function(t) { return !t.operationId || opIds[t.operationId]; }),
    debts: debts.filter(function(d) { return d.operationId && opIds[d.operationId]; }),
    executions: executions.filter(function(e) { return e.operationId && opIds[e.operationId]; }),
    prescriptionEvents: prescriptionEvents,
    people: people.filter(function(p) { return p.operationId && opIds[p.operationId]; }),
    hearings: hearings.filter(function(h) { return h.operationId && opIds[h.operationId]; })
  };
}

function writeGeminiSheet_(ss, shortName, matrix) {
  var name = GEMINI_SHEET_PREFIX + shortName;
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  if (!matrix || !matrix.length) {
    sh.getRange(1, 1).setValue('(vazio)');
    return 1;
  }
  var rows = matrix.length;
  var cols = matrix[0].length;
  sh.getRange(1, 1, rows, cols).setValues(matrix);
  sh.setFrozenRows(1);
  try {
    sh.autoResizeColumns(1, Math.min(cols, 12));
  } catch (e) {}
  return rows;
}

function opNameMap_(ops) {
  var m = {};
  (ops || []).forEach(function(o) { m[o.id] = o.name || o.id; });
  return m;
}

function buildGeminiMeta_(scope, operationId, filtered) {
  var ts = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
  var scopeLabel = scope === 'hoje' ? 'Fila de hoje (atenção ≤7d / presc. ≤180d)'
    : scope === 'operacao' ? ('Operação selecionada' + (operationId ? ' · ' + operationId : ''))
    : 'Carteira (operações ativas)';
  return [
    ['Campo', 'Valor'],
    ['Atualizado em', ts],
    ['Escopo', scopeLabel],
    ['Operações neste recorte', String((filtered.operations || []).length)],
    ['Como usar', 'Abra o Gemini no painel lateral desta Planilha (Workspace) e pergunte sobre as abas Gemini_*.'],
    ['Sugestão 1', 'Quais CDAs em Gemini_Prescricao exigem atuação esta semana e por quê?'],
    ['Sugestão 2', 'Resuma cada operação em Gemini_Briefing e proponha próximos 3 passos.'],
    ['Sugestão 3', 'Cruze Gemini_Intimacoes abertas com Gemini_Ops e liste prioridades.'],
    ['Aviso', 'Estas abas são um espelho materializado. Reexporte após alterações relevantes no NEXUS.'],
    ['Abas', GEMINI_SHEETS.map(function(s) { return GEMINI_SHEET_PREFIX + s; }).join(', ')]
  ];
}

function buildGeminiOps_(filtered) {
  var header = ['operacao_id', 'nome', 'status', 'classificacoes', 'credito_ativo', 'cdas', 'processos', 'pessoas', 'intimacoes_abertas', 'tarefas_abertas', 'ultima_revisao', 'descricao'];
  var rows = [header];
  var debts = filtered.debts || [];
  var execs = filtered.executions || [];
  var people = filtered.people || [];
  var intims = filtered.intimations || [];
  var tasks = filtered.tasks || [];
  (filtered.operations || []).forEach(function(op) {
    var opDebts = debts.filter(function(d) { return d.operationId === op.id && d.status !== 'extinta'; });
    var credito = 0;
    opDebts.forEach(function(d) { credito += Number(d.value) || 0; });
    var openIntims = intims.filter(function(x) {
      return x.operationId === op.id && !x.responseAction &&
        (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao');
    }).length;
    var openTasks = tasks.filter(function(t) {
      return t.operationId === op.id && t.status !== 'concluida' && t.status !== 'cancelada';
    }).length;
    var cls = '';
    if (Array.isArray(op.classifications)) cls = op.classifications.join('; ');
    else if (op.opCategory) cls = String(op.opCategory);
    rows.push([
      op.id || '',
      op.name || '',
      op.status || 'ativa',
      cls,
      credito,
      opDebts.length,
      execs.filter(function(e) { return e.operationId === op.id; }).length,
      people.filter(function(p) { return p.operationId === op.id; }).length,
      openIntims,
      openTasks,
      op.lastReviewedAt || '',
      truncateGemini_(op.description || '', 240)
    ]);
  });
  return rows;
}

function buildGeminiIntims_(filtered) {
  var names = opNameMap_(filtered.operations);
  var header = ['intimacao_id', 'operacao', 'processo', 'status', 'prazo', 'parte', 'classe', 'jurisdicao', 'objeto_resumo', 'respondida'];
  var rows = [header];
  (filtered.intimations || []).forEach(function(x) {
    var open = !x.responseAction &&
      (x.status === 'pendente_analise' || x.status === 'aguardando_subsidios' || x.status === 'peca_edicao');
    // Na visão: prioriza abertas; inclui resolvidas só se escopo pequeno
    if (!open && (filtered.operations || []).length > 8) return;
    rows.push([
      x.id || '',
      names[x.operationId] || x.operationId || '',
      x.processNumber || '',
      x.status || '',
      x.dateDeadline || '',
      truncateGemini_(x.partyName || '', 80),
      truncateGemini_(x.className || '', 80),
      x.jurisdiction || '',
      truncateGemini_(x.object || x.eventDescription || '', 200),
      x.responseAction ? 'sim' : 'nao'
    ]);
  });
  return rows;
}

function buildGeminiPresc_(filtered) {
  var names = opNameMap_(filtered.operations);
  var header = ['cda_id', 'operacao', 'cda', 'processo', 'valor', 'status', 'data_prescricao', 'tratada', 'notas'];
  var rows = [header];
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  (filtered.debts || []).forEach(function(d) {
    if (d.status === 'extinta') return;
    var pd = d.prescriptionDate || (d.prescriptionSnapshot && d.prescriptionSnapshot.diesAdQuem) || '';
    if (!pd && !d.prescriptionHandled) {
      // ainda lista CDAs sem data se forem do recorte pequeno
      if ((filtered.operations || []).length > 5) return;
    }
    if (pd) {
      var dd = Math.ceil((new Date(pd + 'T00:00:00') - today) / 86400000);
      if (dd > 180 && !d.prescriptionHandled && (filtered.operations || []).length > 3) return;
    }
    rows.push([
      d.id || '',
      names[d.operationId] || d.operationId || '',
      d.cdaNumber || d.number || '',
      d.processNumber || '',
      Number(d.value) || 0,
      d.status || '',
      pd || '',
      d.prescriptionHandled ? 'sim' : 'nao',
      truncateGemini_(d.notes || '', 160)
    ]);
  });
  return rows;
}

function buildGeminiTasks_(filtered) {
  var names = opNameMap_(filtered.operations);
  var header = ['tarefa_id', 'operacao', 'titulo', 'status', 'prioridade', 'vencimento', 'descricao'];
  var rows = [header];
  (filtered.tasks || []).forEach(function(t) {
    if (t.status === 'concluida' || t.status === 'cancelada') return;
    rows.push([
      t.id || '',
      names[t.operationId] || t.operationId || '(sem operação)',
      t.title || '',
      t.status || '',
      t.priority || '',
      t.dueDate || '',
      truncateGemini_(t.description || '', 200)
    ]);
  });
  return rows;
}

function buildGeminiBriefing_(filtered) {
  var header = ['operacao_id', 'nome', 'briefing', 'anotacoes'];
  var rows = [header];
  (filtered.operations || []).forEach(function(op) {
    var notes = '';
    if (Array.isArray(op.notesList)) notes = op.notesList.join(' | ');
    else if (op.notes) notes = String(op.notes);
    var briefing = op.strategy || op.briefing || op.description || '';
    rows.push([
      op.id || '',
      op.name || '',
      truncateGemini_(briefing, 4000),
      truncateGemini_(notes, 2000)
    ]);
  });
  return rows;
}

function truncateGemini_(s, n) {
  s = String(s || '');
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}