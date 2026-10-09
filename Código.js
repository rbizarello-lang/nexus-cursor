
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
var LOG_MAX_ROWS = 500;

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
var GZIP_PAYLOAD_PREFIX = 'GZB64:';

/** O cliente envia o JSON em gzip+base64 (o banco passou de 20 MB e o google.script.run recusava com 400). */
function decodeSavePayload_(payload) {
  var s = String(payload == null ? '' : payload);
  if (s.indexOf(GZIP_PAYLOAD_PREFIX) !== 0) return s;
  var bytes = Utilities.base64Decode(s.slice(GZIP_PAYLOAD_PREFIX.length));
  return Utilities.ungzip(Utilities.newBlob(bytes, 'application/x-gzip')).getDataAsString('UTF-8');
}

function saveNexusData(jsonString, expectedRev, force) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'Outra sincronização em andamento. Tente novamente em alguns segundos.' };
  }

  try {
    try {
      jsonString = decodeSavePayload_(jsonString);
    } catch (decErr) {
      return { success: false, error: 'Falha ao descompactar — arquivo NÃO foi sobrescrito. ' + decErr.message };
    }
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
    // Falha no log nunca derruba o save (arquivo já gravado)
    try {
      var sheet = getLogSheet_();
      sheet.getRange('A1').setValue('NEXUS Data → ' + DATA_FILENAME + ' (' + (jsonString.length / 1024).toFixed(1) + ' KB)');
      var nextRow = Math.max(sheet.getLastRow() + 1, 2);
      sheet.getRange('A' + nextRow).setValue(new Date().toLocaleString('pt-BR'));
      sheet.getRange('B' + nextRow).setValue((jsonString.length / 1024).toFixed(1) + ' KB');
      // Mantém só os últimos LOG_MAX_ROWS registros (abaixo do cabeçalho)
      var excedente = sheet.getLastRow() - 1 - LOG_MAX_ROWS;
      if (excedente > 0) sheet.deleteRows(2, excedente);
    } catch (logErr) {
      Logger.log('Log planilha: ' + logErr.message);
    }

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

// ══════════════════════════════════════════════════════════════
// Trilha de atividade (NDJSON diário) e exportações para Docs/Sheets
// ══════════════════════════════════════════════════════════════

var TRILHA_FOLDER_NAME = 'Trilha';
var RELATORIOS_FOLDER_NAME = 'Relatórios';
var TRILHA_MAX_CHARS = 20 * 1024 * 1024;
var TRILHA_LIGHT_TEXT_MAX = 300;
var TRILHA_LIGHT_DETAILS_MAX = 50;
var QUOTA_MSG_ = 'Limite diário do Google para criar documentos atingido. Tente amanhã.';

/** Nome do arquivo do dia; parte 1 sem sufixo, demais com _N. */
function trilhaFileNameForDay_(day, part) {
  var p = part == null ? 1 : Number(part);
  return 'nexus_trilha_' + day + (p > 1 ? '_' + p : '') + '.ndjson';
}

/** Lê dia e parte de um nome de arquivo da trilha; null se não for. */
function trilhaParseName_(name) {
  var m = /^nexus_trilha_(\d{4}-\d{2}-\d{2})(?:_(\d+))?\.ndjson$/.exec(String(name || ''));
  if (!m) return null;
  return { day: m[1], part: m[2] ? Number(m[2]) : 1, name: m[0] };
}

/** Filtra nomes de arquivos no intervalo [from, to] (inclusive) e ordena por dia e parte. */
function trilhaDaysInRange_(names, from, to) {
  var out = [];
  for (var i = 0; i < names.length; i++) {
    var p = trilhaParseName_(names[i]);
    if (!p) continue;
    if (from && p.day < from) continue;
    if (to && p.day > to) continue;
    out.push(p);
  }
  out.sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.part - b.part; });
  return out.map(function (p) { return p.name; });
}

/** Ids presentes num texto NDJSON. */
function trilhaIdsFromText_(text) {
  var ids = {};
  var lines = String(text || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
      var ev = JSON.parse(lines[i]);
      if (ev && ev.id != null) ids[String(ev.id)] = true;
    } catch (e) { /* linha corrompida: ignora */ }
  }
  return ids;
}

/** Acrescenta eventos novos ao texto NDJSON, deduplicando por id (knownIds: ids de outras partes do dia). */
function trilhaMergeLines_(existingText, events, knownIds) {
  var seen = trilhaIdsFromText_(existingText);
  var k;
  for (k in (knownIds || {})) if (Object.prototype.hasOwnProperty.call(knownIds, k)) seen[k] = true;
  var text = String(existingText || '');
  if (text && text.charAt(text.length - 1) !== '\n') text += '\n';
  var appended = 0, duplicates = 0;
  for (var i = 0; i < events.length; i++) {
    var id = String(events[i].id);
    if (seen[id]) { duplicates++; continue; }
    seen[id] = true;
    text += JSON.stringify(events[i]) + '\n';
    appended++;
  }
  return { text: text, appended: appended, duplicates: duplicates };
}

/** Evento válido: id não vazio e day AAAA-MM-DD. */
function trilhaValidEvent_(ev) {
  return !!(ev && typeof ev === 'object' && ev.id != null && String(ev.id) !== '' &&
    typeof ev.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ev.day));
}

/** Versão leve do evento para listas: sem restore, textos cortados, detalhes limitados. */
function trilhaLighten_(event) {
  var ev = JSON.parse(JSON.stringify(event));
  delete ev.restore;
  var cut = function (s) { return typeof s === 'string' && s.length > TRILHA_LIGHT_TEXT_MAX; };
  if (Array.isArray(ev.textChanges)) {
    ev.textChanges = ev.textChanges.map(function (tc) {
      if (!tc || typeof tc !== 'object') return tc;
      var cutAny = false;
      ['from', 'to'].forEach(function (f) {
        if (cut(tc[f])) { tc[f] = tc[f].slice(0, TRILHA_LIGHT_TEXT_MAX); cutAny = true; }
      });
      if (cutAny) tc.cut = true;
      return tc;
    });
  }
  if (ev.batch && Array.isArray(ev.batch.details) && ev.batch.details.length > TRILHA_LIGHT_DETAILS_MAX) {
    ev.batch.details = ev.batch.details.slice(0, TRILHA_LIGHT_DETAILS_MAX);
    ev.batch.detailsCut = true;
  }
  return ev;
}

/** Erro de cota/limite do Google? */
function isQuotaError_(err) {
  var msg = String(err && err.message != null ? err.message : err || '');
  return /service invoked too many times|quota|limit/i.test(msg);
}

function exportErrorMessage_(err) {
  if (isQuotaError_(err)) return QUOTA_MSG_;
  return 'Falha ao exportar: ' + String(err && err.message != null ? err.message : err);
}

/** Subpasta por nome dentro da pasta de dados (cria se faltar). */
function getSubFolder_(name, create) {
  var parent = getDataFolder_();
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return create ? parent.createFolder(name) : null;
}

function readFileText_(file) {
  return file.getBlob().getDataAsString('UTF-8');
}

/** Partes existentes do dia: [{file, text}] em ordem. */
function trilhaReadDayParts_(folder, day) {
  var parts = [];
  for (var p = 1; ; p++) {
    var it = folder.getFilesByName(trilhaFileNameForDay_(day, p));
    if (!it.hasNext()) break;
    var f = it.next();
    parts.push({ file: f, text: readFileText_(f) });
  }
  return parts;
}

function appendActivity(payload) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'Outra gravação em andamento.', retry: true };
  }
  try {
    var events = JSON.parse(decodeSavePayload_(payload));
    if (!Array.isArray(events)) return { success: false, error: 'Payload inválido: esperado array de eventos.' };
    var byDay = {}, invalid = 0, i;
    for (i = 0; i < events.length; i++) {
      if (!trilhaValidEvent_(events[i])) { invalid++; continue; }
      (byDay[events[i].day] = byDay[events[i].day] || []).push(events[i]);
    }
    var folder = getSubFolder_(TRILHA_FOLDER_NAME, true);
    var appended = 0, duplicates = 0;
    Object.keys(byDay).forEach(function (day) {
      var parts = trilhaReadDayParts_(folder, day);
      var known = {};
      parts.forEach(function (pt) {
        var ids = trilhaIdsFromText_(pt.text);
        for (var k in ids) known[k] = true;
      });
      // dedup contra todas as partes; grava só na última
      var fresh = trilhaMergeLines_('', byDay[day], known);
      appended += fresh.appended;
      duplicates += fresh.duplicates;
      if (!fresh.appended) return;
      var last = parts.length ? parts[parts.length - 1] : null;
      if (last && last.text.length + fresh.text.length <= TRILHA_MAX_CHARS) {
        var sep = last.text && last.text.slice(-1) !== '\n' ? '\n' : '';
        last.file.setContent(last.text + sep + fresh.text);
      } else {
        folder.createFile(trilhaFileNameForDay_(day, parts.length + 1), fresh.text, 'text/plain');
      }
    });
    return { success: true, appended: appended, duplicates: duplicates, invalid: invalid };
  } catch (err) {
    return { success: false, error: String(err && err.message != null ? err.message : err) };
  } finally {
    try { lock.releaseLock(); } catch (e2) { /* ignora */ }
  }
}

function trilhaListNames_(folder) {
  var names = [], it = folder.getFiles();
  while (it.hasNext()) names.push(it.next().getName());
  return names;
}

function loadActivity(fromDay, toDay, light) {
  try {
    var folder = getSubFolder_(TRILHA_FOLDER_NAME, false);
    var all = [];
    if (folder) {
      var names = trilhaDaysInRange_(trilhaListNames_(folder), fromDay, toDay);
      names.forEach(function (n) {
        var it = folder.getFilesByName(n);
        if (!it.hasNext()) return;
        var lines = readFileText_(it.next()).split('\n');
        for (var i = 0; i < lines.length; i++) {
          if (!lines[i]) continue;
          try {
            var ev = JSON.parse(lines[i]);
            all.push(light ? trilhaLighten_(ev) : ev);
          } catch (e) { /* linha corrompida */ }
        }
      });
    }
    var gz = Utilities.gzip(Utilities.newBlob(JSON.stringify(all), 'application/json', 'trilha.json'));
    return { success: true, payload: GZIP_PAYLOAD_PREFIX + Utilities.base64Encode(gz.getBytes()), count: all.length };
  } catch (err) {
    return { success: false, error: String(err && err.message != null ? err.message : err) };
  }
}

function loadActivityEvent(day, id) {
  try {
    var folder = getSubFolder_(TRILHA_FOLDER_NAME, false);
    if (folder && /^\d{4}-\d{2}-\d{2}$/.test(String(day))) {
      var parts = trilhaReadDayParts_(folder, day);
      for (var p = 0; p < parts.length; p++) {
        var lines = parts[p].text.split('\n');
        for (var i = 0; i < lines.length; i++) {
          if (!lines[i]) continue;
          try {
            var ev = JSON.parse(lines[i]);
            if (ev && String(ev.id) === String(id)) return { success: true, event: ev };
          } catch (e) { /* linha corrompida */ }
        }
      }
    }
    return { success: false, error: 'Evento não encontrado.' };
  } catch (err) {
    return { success: false, error: String(err && err.message != null ? err.message : err) };
  }
}

/** Move o arquivo recém-criado para a subpasta Relatórios. */
function moveToRelatorios_(id) {
  var file = DriveApp.getFileById(id);
  file.moveTo(getSubFolder_(RELATORIOS_FOLDER_NAME, true));
  return file;
}

function exportToGoogleDoc(payload) {
  try {
    var spec = JSON.parse(decodeSavePayload_(payload));
    var doc = DocumentApp.create(String(spec.title || 'Relatório NEXUS'));
    var body = doc.getBody();
    var H = { h1: DocumentApp.ParagraphHeading.HEADING1, h2: DocumentApp.ParagraphHeading.HEADING2, h3: DocumentApp.ParagraphHeading.HEADING3 };
    (spec.blocks || []).forEach(function (b) {
      if (!b) return;
      var t = String(b.text == null ? '' : b.text);
      if (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') {
        body.appendParagraph(t).setHeading(H[b.type]);
      } else if (b.type === 'p') {
        var para = body.appendParagraph(t);
        para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
        if (b.italic) para.setItalic(true);
        if (b.small) para.setFontSize(9);
      } else if (b.type === 'list') {
        (b.items || []).forEach(function (it) { body.appendListItem(String(it)).setGlyphType(DocumentApp.GlyphType.BULLET); });
      } else if (b.type === 'table') {
        var data = [b.header || []].concat(b.rows || []).map(function (r) {
          return r.map(function (c) { return String(c == null ? '' : c); });
        });
        var table = body.appendTable(data);
        var mono = b.mono || [];
        for (var r = 0; r < table.getNumRows(); r++) {
          var row = table.getRow(r);
          for (var c = 0; c < row.getNumCells(); c++) {
            var cell = row.getCell(c);
            if (r === 0) { if (cell.getText()) cell.editAsText().setBold(true); cell.setBackgroundColor('#EEEEEE'); }
            else if (mono.indexOf(c) >= 0 && cell.getText()) cell.editAsText().setFontFamily('Courier New');
          }
        }
        if (b.widths) for (var w = 0; w < b.widths.length; w++) { if (b.widths[w]) table.setColumnWidth(w, b.widths[w]); }
      } else if (b.type === 'pagebreak') {
        body.appendPageBreak();
      }
    });
    // remove o parágrafo vazio inicial criado pelo Doc
    if (body.getNumChildren() > 1) {
      var first = body.getChild(0);
      if (first.getType() === DocumentApp.ElementType.PARAGRAPH && first.asParagraph().getText() === '') body.removeChild(first);
    }
    doc.saveAndClose();
    var file = moveToRelatorios_(doc.getId());
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (err) {
    return { success: false, error: exportErrorMessage_(err) };
  }
}

function exportToSpreadsheet(payload) {
  try {
    var spec = JSON.parse(decodeSavePayload_(payload));
    var ss = SpreadsheetApp.create(String(spec.title || 'Relatório NEXUS'));
    (spec.sheets || []).forEach(function (s, idx) {
      var sh = idx === 0 ? ss.getSheets()[0] : ss.insertSheet();
      sh.setName(String(s.name || 'Aba ' + (idx + 1)).slice(0, 99));
      var header = (s.header || []).map(String);
      var ncols = header.length;
      (s.rows || []).forEach(function (r) { if (r.length > ncols) ncols = r.length; });
      if (!ncols) return;
      var values = [header].concat(s.rows || []).map(function (r) {
        var out = [];
        for (var c = 0; c < ncols; c++) {
          var v = c < r.length && r[c] != null ? r[c] : '';
          if (typeof v === 'string' && v.charAt(0) === '=') v = "'" + v; // texto, não fórmula
          out.push(v);
        }
        return out;
      });
      sh.getRange(1, 1, values.length, ncols).setValues(values);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, ncols).setFontWeight('bold').setBackground('#EEEEEE');
      sh.getRange(1, 1, values.length, ncols).createFilter();
      (s.mono || []).forEach(function (c) {
        if (c >= 0 && c < ncols) sh.getRange(1, c + 1, values.length, 1).setFontFamily('Roboto Mono');
      });
      sh.autoResizeColumns(1, ncols);
      for (var c2 = 1; c2 <= ncols; c2++) {
        var wpx = s.widths && s.widths[c2 - 1];
        if (wpx) sh.setColumnWidth(c2, wpx);
        else if (sh.getColumnWidth(c2) > 400) sh.setColumnWidth(c2, 400);
      }
    });
    SpreadsheetApp.flush();
    var file = moveToRelatorios_(ss.getId());
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (err) {
    return { success: false, error: exportErrorMessage_(err) };
  }
}
