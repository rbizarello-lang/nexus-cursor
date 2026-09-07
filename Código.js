
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
var LOG_SHEET_NAME = 'NEXUS_Log';

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

/** Aba fixa do log de sync — nunca a aba que estiver aberta no editor. */
function getLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(LOG_SHEET_NAME);
  return sh;
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

    // Log na planilha (aba dedicada — não a aba ativa)
    var sheet = getLogSheet_();
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
    if (!backupName || String(backupName).indexOf(BACKUP_PREFIX) !== 0 || !String(backupName).endsWith('.json')) {
      return { success: false, error: 'Nome de backup inválido.' };
    }
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
  var file = resolveDataFile_();
  if (file) {
    try {
      var existing = JSON.parse(file.getBlob().getDataAsString() || '{}');
      if (existing && existing.operations && existing.operations.length) {
        Logger.log('testSave recusado: o arquivo canônico já tem operações. Não grava payload de teste.');
        return { success: false, error: 'Arquivo canônico já tem acervo — testSave não grava.' };
      }
    } catch (e) {
      Logger.log('testSave recusado: não foi possível ler o canônico. ' + e.message);
      return { success: false, error: 'Não foi possível ler o arquivo canônico.' };
    }
  }
  var result = saveNexusData('{"test": true, "ts": "' + new Date().toISOString() + '"}');
  Logger.log('Resultado: ' + JSON.stringify(result));
  return result;
}

function testSaveInvalid() {
  var result = saveNexusData('isso não é json');
  Logger.log('Resultado teste inválido: ' + JSON.stringify(result));
}

function testListBackups() {
  var result = listBackups();
  Logger.log('Backups: ' + JSON.stringify(result));
}
