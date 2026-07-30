
// ══════════════════════════════════════════════════════════
// NEXUS Cloud — Google Apps Script Backend v4
// ══════════════════════════════════════════════════════════
// Salva JSON como arquivo no Google Drive (sem limite de 50k)
// A planilha serve apenas como log de sincronizações.
//
// v4 — Backup versionado (abril/2026):
//   - Backup diário automático (nexus_backup_YYYY-MM-DD.json)
//   - Rotação: mantém últimos 7 dias
//   - listBackups() e restoreBackup() para o frontend
//   (mantém tudo de v3: LockService, JSON.parse, DEFAULT)

var DATA_FILENAME = 'nexus_data.json';
var BACKUP_PREFIX = 'nexus_backup_';
var BACKUP_KEEP_DAYS = 7;

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;

  if (action === 'ping') {
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'NEXUS Cloud v4 ativo' })
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

function findDataFile_() {
  var folder = getDataFolder_();
  var files = folder.getFilesByName(DATA_FILENAME);
  return files.hasNext() ? files.next() : null;
}

function createDataFile_(content) {
  var folder = getDataFolder_();
  return folder.createFile(DATA_FILENAME, content || '{}', 'application/json');
}

// ── Backup helpers ──

function todayStr_() {
  var now = new Date();
  var offset = -3; // BRT
  var local = new Date(now.getTime() + offset * 3600000);
  return local.toISOString().slice(0, 10);
}

function createDailyBackup_(jsonString) {
  var folder = getDataFolder_();
  var today = todayStr_();
  var backupName = BACKUP_PREFIX + today + '.json';
  var existing = folder.getFilesByName(backupName);
  if (existing.hasNext()) return;
  folder.createFile(backupName, jsonString, 'application/json');
}

function pruneOldBackups_() {
  var folder = getDataFolder_();
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BACKUP_KEEP_DAYS);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var name = f.getName();
    if (name.indexOf(BACKUP_PREFIX) !== 0) continue;
    if (!name.endsWith('.json')) continue;
    if (name.indexOf('pre-restore') !== -1) continue; // nunca apaga backups de emergência
    var dateStr = name.replace(BACKUP_PREFIX, '').replace('.json', '');
    var parts = dateStr.split('-');
    if (parts.length !== 3) continue;
    var fileDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (fileDate < cutoff) {
      f.setTrashed(true);
    }
  }
}

// ── API chamada pelo frontend via google.script.run ──

function loadNexusData() {
  var file = findDataFile_();
  if (!file) return '{}';
  return file.getBlob().getDataAsString();
}

function getRemoteMtime() {
  var file = findDataFile_();
  if (!file) return { success: true, exists: false, mtime: null, size: 0 };
  return {
    success: true,
    exists: true,
    mtime: file.getLastUpdated().toISOString(),
    size: file.getSize()
  };
}

function saveNexusData(jsonString) {
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

    var file = findDataFile_();
    if (file) {
      file.setContent(jsonString);
    } else {
      file = createDataFile_(jsonString);
    }

    // Backup diário + rotação (best-effort, não impede o save principal)
    try {
      createDailyBackup_(jsonString);
      pruneOldBackups_();
    } catch (bkErr) {
      Logger.log('Backup warning: ' + bkErr.message);
    }

    // Log na planilha
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var nextRow = Math.min(sheet.getLastRow() + 1, 200);
    if (nextRow < 2) nextRow = 2;
    sheet.getRange('A1').setValue('NEXUS Data → ' + DATA_FILENAME + ' (' + (jsonString.length / 1024).toFixed(1) + ' KB)');
    sheet.getRange('A' + nextRow).setValue(new Date().toLocaleString('pt-BR'));
    sheet.getRange('B' + nextRow).setValue((jsonString.length / 1024).toFixed(1) + ' KB');

    return { success: true, size: jsonString.length, mtime: file.getLastUpdated().toISOString() };
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
    var mainFile = findDataFile_();
    if (mainFile) {
      var emergName = BACKUP_PREFIX + 'pre-restore-' + todayStr_() + '.json';
      var existing = folder.getFilesByName(emergName);
      if (!existing.hasNext()) {
        folder.createFile(emergName, mainFile.getBlob().getDataAsString(), 'application/json');
      }
      mainFile.setContent(content);
    } else {
      createDataFile_(content);
    }
    return { success: true, size: content.length, restoredFrom: backupName };
  } catch (err) {
    return { success: false, error: 'Erro ao restaurar: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

// ── Teste ──

function testPing() { Logger.log('Script OK — v4 Backup'); }

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