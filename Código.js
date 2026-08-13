
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
      if (!pd) return;
      var dd = Math.ceil((new Date(pd + 'T00:00:00') - today) / 86400000);
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
    var pd = d.prescriptionDate;
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