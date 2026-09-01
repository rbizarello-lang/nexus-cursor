/**
 * NEXUS — RESUMO DIÁRIO POR E-MAIL
 * ---------------------------------------------------------------------------
 * Lê o nexus_data.json (o mesmo arquivo que o app sincroniza no Drive) e envia
 * um e-mail com o que exige atuação: prazos, audiências, prescrições, tarefas
 * e a Mesa de trabalho.
 *
 * COMO INSTALAR
 *   Prefira o mesmo projeto Apps Script do NEXUS (npm run push já inclui
 *   este arquivo). Assim o resumo usa o mesmo arquivo pinado por ID que o app.
 *   Se colar à mão: Arquivo → Novo → Script, nomeie "resumo-diario", cole
 *   o conteúdo, rode testarResumoAgora e depois instalarResumoDiario.
 *
 * NÃO busca nexus_data.json pelo nome no Drive inteiro — isso pegava o
 * primeiro arquivo homônimo (cópia de teste, outro acervo).
 *
 * PARA DESLIGAR: rode  removerResumoDiario
 * PARA MUDAR O HORÁRIO: altere HORA_ENVIO e rode instalarResumoDiario de novo.
 */

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────────
var CONFIG = {
  EMAIL: '',              // vazio = envia para a conta que roda o script
  HORA_ENVIO: 7,          // 0–23 (horário do fuso do projeto)
  ARQUIVO: 'nexus_data.json',
  DIAS_PRAZO: 7,          // intimações: alertar com esta antecedência
  DIAS_AUDIENCIA: 15,     // audiências: idem
  DIAS_PRESCRICAO: 90,    // CDAs prescrevendo: idem
  PROXIMOS_PRAZOS: 5,     // além dos urgentes, mostrar sempre as N intimações mais próximas
  ENVIAR_SE_VAZIO: false  // true = manda e-mail mesmo sem nada pendente
};
// Tarefas: só entram no e-mail as marcadas com esta prioridade.
var PRIORIDADE_TAREFA = 'urgente';

// ─── FUNÇÕES QUE VOCÊ EXECUTA ───────────────────────────────────────────────

/** Envia o resumo agora (use para testar). */
function testarResumoAgora() {
  var r = enviarResumoNexus();
  Logger.log(r);
  return r;
}

/** Agenda o envio diário no horário de CONFIG.HORA_ENVIO. */
function instalarResumoDiario() {
  removerResumoDiario();
  ScriptApp.newTrigger('enviarResumoNexus')
    .timeBased()
    .atHour(CONFIG.HORA_ENVIO)
    .nearMinute(0)
    .everyDays(1)
    .create();
  var msg = 'Resumo diário agendado para ~' + CONFIG.HORA_ENVIO + 'h.';
  Logger.log(msg);
  return msg;
}

/** Cancela o envio diário. */
function removerResumoDiario() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'enviarResumoNexus') { ScriptApp.deleteTrigger(t); n++; }
  });
  Logger.log('Agendamentos removidos: ' + n);
  return n;
}

// ─── MOTOR ──────────────────────────────────────────────────────────────────

function enviarResumoNexus() {
  var dados = _lerDados_();
  if (!dados) return 'ERRO: arquivo de dados do NEXUS não encontrado na pasta da planilha.';

  var r = _coletar_(dados);
  // O radar é informativo (horizonte) e não conta como pendência para decidir o envio.
  var total = r.vencidas.length + r.prazos.length + r.audiencias.length + r.prescricoes.length + r.tarefas.length;
  if (total === 0 && r.radar.length === 0 && !CONFIG.ENVIAR_SE_VAZIO) return 'Nada pendente hoje — e-mail não enviado.';

  var email = CONFIG.EMAIL || Session.getActiveUser().getEmail();
  var urgentes = r.vencidas.length + r.prazos.filter(function (x) { return x.dias <= 2; }).length;
  var assunto = 'NEXUS · ' + (urgentes > 0 ? '⚠ ' + urgentes + ' urgente(s) · ' : '') + total + ' pendência(s) — ' + _hojeBR_();

  MailApp.sendEmail({ to: email, subject: assunto, htmlBody: _html_(r), name: 'NEXUS' });
  return 'Resumo enviado para ' + email + ' (' + total + ' itens).';
}

/** Resolve o mesmo arquivo que o app (ID persistido / pasta da planilha). Nunca varre o Drive pelo nome. */
function _resolverArquivoDados_() {
  if (typeof resolveDataFile_ === 'function') return resolveDataFile_();
  if (typeof findDataFile_ === 'function') return findDataFile_();
  try {
    var id = PropertiesService.getScriptProperties().getProperty('NEXUS_DATA_FILE_ID');
    if (id) {
      var pinned = DriveApp.getFileById(id);
      if (pinned && !pinned.isTrashed()) return pinned;
    }
  } catch (e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var parents = DriveApp.getFileById(ss.getId()).getParents();
    var folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
    var files = folder.getFilesByName(CONFIG.ARQUIVO);
    if (files.hasNext()) return files.next();
  } catch (e2) {}
  return null;
}

/** Lê e desserializa o nexus_data.json canônico. */
function _lerDados_() {
  var file = _resolverArquivoDados_();
  if (!file) return null;
  try { return JSON.parse(file.getBlob().getDataAsString()); } catch (e) { return null; }
}

/** Normaliza qualquer data para YYYY-MM-DD (eproc, ISO com hora, DD/MM/AAAA). */
function _diaKey_(iso) {
  if (iso == null || iso === '') return '';
  var s = String(iso).trim();
  var m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) {
    var y = m[3];
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
    return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  }
  return '';
}

/** Dias entre hoje e uma data (negativo = vencido). */
function _dias_(iso) {
  var k = _diaKey_(iso);
  if (!k) return null;
  var p = k.split('-');
  var alvo = new Date(+p[0], +p[1] - 1, +p[2]);
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
}

function _fmtData_(iso) {
  var k = _diaKey_(iso);
  if (!k) return iso ? String(iso) : '—';
  var p = k.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function _hojeBR_() {
  var d = new Date();
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

function _fmtMoeda_(v) {
  if (!v && v !== 0) return '—';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Reúne tudo que merece atenção. */
function _coletar_(d) {
  var ops = {};
  (d.operations || []).forEach(function (o) { ops[o.id] = o.name; });
  var nomeOp = function (id) { return id && ops[id] ? ops[id] : ''; };

  var out = { vencidas: [], prazos: [], radar: [], audiencias: [], prescricoes: [], tarefas: [], mesa: [] };

  // Intimações em aberto com prazo
  var futuras = [];
  (d.intimations || []).forEach(function (x) {
    if (x.responseAction || !x.dateDeadline) return;
    var dias = _dias_(x.dateDeadline);
    if (dias === null) return;
    // Analisado sem atuação: só some depois que o prazo vence (análise ≠ peticionamento).
    if (x.status === 'analisado' && dias < 0) return;
    var item = {
      dias: dias, data: x.dateDeadline,
      titulo: x.partyName || x.parties || x.processNumber || 'Intimação',
      proc: x.processNumber || '', op: nomeOp(x.operationId),
      extra: x.eventDescription || ''
    };
    if (dias < 0) out.vencidas.push(item);
    else if (dias <= CONFIG.DIAS_PRAZO) out.prazos.push(item);
    else futuras.push(item); // além da janela — candidatas ao "radar"
  });
  // Radar: as próximas N intimações que ficaram fora da janela de alerta,
  // para haver sempre visibilidade do horizonte (não só do que já está em cima).
  futuras.sort(function (a, b) { return a.dias - b.dias; });
  out.radar = futuras.slice(0, CONFIG.PROXIMOS_PRAZOS);

  // Audiências futuras
  (d.hearings || []).forEach(function (h) {
    if (h.status === 'realizada' || h.status === 'cancelada' || !h.date) return;
    var dias = _dias_(h.date);
    if (dias === null || dias < 0 || dias > CONFIG.DIAS_AUDIENCIA) return;
    out.audiencias.push({
      dias: dias, data: h.date,
      titulo: h.parties || 'Audiência',
      proc: h.processNumber || '', op: nomeOp(h.operationId),
      extra: (h.time ? h.time + ' · ' : '') + (h.modality === 'virtual' ? 'Virtual' : 'Presencial') + (h.location ? ' · ' + h.location : '')
    });
  });

  // CDAs prescrevendo: data informada, ou snapshot do motor (fase crítica/alerta).
  // Estimativa de inscrição+5 e prescrições já consumidas/vencidas não entram no e-mail.
  (d.debts || []).forEach(function (x) {
    if (x.prescriptionHandled || x.status === 'extinta') return;
    var snap = x.prescriptionSnapshot || {};
    if (snap.origin === 'estimativa') return;
    if (snap.status === 'prescrito') return;
    var pd = x.prescriptionDate || '';
    var dias = null;
    if (pd) {
      dias = _dias_(pd);
    } else if (snap.status === 'critico' || snap.status === 'alerta') {
      if (snap.origin !== 'calculo_validado' && snap.origin !== 'data_informada') return;
      pd = snap.diesAdQuem || '';
      dias = snap.daysLeft != null ? snap.daysLeft : _dias_(pd);
    } else {
      return;
    }
    if (dias === null || dias < 0 || dias > CONFIG.DIAS_PRESCRICAO) return;
    out.prescricoes.push({
      dias: dias, data: pd,
      titulo: 'CDA ' + (x.cdaNumber || 's/nº'),
      proc: x.processNumber || '', op: nomeOp(x.operationId),
      extra: _fmtMoeda_(x.value) + (snap.origin ? ' · ' + snap.origin : '')
    });
  });

  // Tarefas: somente as marcadas como URGENTE (independe do prazo — urgente é urgente).
  // Sem prazo definido, entram no fim da lista.
  (d.tasks || []).forEach(function (t) {
    if (t.status === 'concluida' || t.status === 'cancelada') return;
    if (String(t.priority || '') !== PRIORIDADE_TAREFA) return;
    var dias = t.dueDate ? _dias_(t.dueDate) : null;
    out.tarefas.push({
      dias: dias === null ? 9999 : dias,
      data: t.dueDate || '',
      titulo: t.title || 'Tarefa',
      proc: '', op: nomeOp(t.operationId),
      extra: t.description ? String(t.description).slice(0, 120) : ''
    });
  });

  // Mesa de trabalho (fila de foco montada no app)
  var vivos = { intimation: {}, task: {}, hearing: {} };
  (d.intimations || []).forEach(function (x) { vivos.intimation[x.id] = x; });
  (d.tasks || []).forEach(function (x) { vivos.task[x.id] = x; });
  (d.hearings || []).forEach(function (x) { vivos.hearing[x.id] = x; });
  (d.desk || []).forEach(function (ref) {
    var x = ref && vivos[ref.type] ? vivos[ref.type][ref.id] : null;
    if (!x) return;
    var rot = { intimation: 'Intimação', task: 'Tarefa', hearing: 'Audiência' }[ref.type];
    out.mesa.push({ tipo: rot, titulo: x.title || x.partyName || x.parties || x.processNumber || rot, op: nomeOp(x.operationId) });
  });

  var porData = function (a, b) { return a.dias - b.dias; };
  out.vencidas.sort(porData); out.prazos.sort(porData);
  out.audiencias.sort(porData); out.prescricoes.sort(porData); out.tarefas.sort(porData);
  return out;
}

/** Texto do prazo (9999 = tarefa urgente sem data marcada). */
function _prazoTexto_(dias) {
  if (dias === 9999) return 'sem prazo';
  if (dias < 0) return 'vencido há ' + Math.abs(dias) + 'd';
  if (dias === 0) return 'HOJE';
  if (dias === 1) return 'amanhã';
  return 'em ' + dias + ' dias';
}

// ─── E-MAIL (HTML) ──────────────────────────────────────────────────────────

function _esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _corPrazo_(dias) {
  if (dias === 9999) return '#7b8896';
  if (dias < 0) return '#c0392b';
  if (dias <= 2) return '#c0392b';
  if (dias <= 7) return '#b8860b';
  return '#5a6b7d';
}

function _secao_(titulo, itens, cor, mostrarValor) {
  if (!itens.length) return '';
  var linhas = itens.map(function (x) {
    return '' +
      '<tr>' +
      '<td style="padding:9px 10px;border-bottom:1px solid #eceff3;white-space:nowrap;vertical-align:top">' +
      '<span style="color:' + _corPrazo_(x.dias) + ';font-weight:700;font-size:13px">' + _prazoTexto_(x.dias) + '</span><br>' +
      '<span style="color:#95a3b3;font-size:11px">' + _fmtData_(x.data) + '</span>' +
      '</td>' +
      '<td style="padding:9px 10px;border-bottom:1px solid #eceff3;vertical-align:top">' +
      '<div style="color:#1f2733;font-size:14px;font-weight:600">' + _esc_(x.titulo) + '</div>' +
      (x.proc ? '<div style="color:#5a6b7d;font-size:12px;font-family:monospace">' + _esc_(x.proc) + '</div>' : '') +
      (x.extra ? '<div style="color:#7b8896;font-size:12px;margin-top:2px">' + _esc_(x.extra) + '</div>' : '') +
      (x.op ? '<div style="color:#96762e;font-size:11px;margin-top:3px">◎ ' + _esc_(x.op) + '</div>' : '') +
      '</td>' +
      '</tr>';
  }).join('');

  return '' +
    '<div style="margin:0 0 22px">' +
    '<div style="font-size:13px;font-weight:700;color:' + cor + ';text-transform:uppercase;letter-spacing:.6px;padding:0 0 7px">' +
    _esc_(titulo) + ' <span style="color:#b6c0cb;font-weight:600">(' + itens.length + ')</span></div>' +
    '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4e8ee;border-radius:6px">' +
    linhas + '</table></div>';
}

function _html_(r) {
  var mesa = '';
  if (r.mesa.length) {
    mesa = '<div style="margin:0 0 22px">' +
      '<div style="font-size:13px;font-weight:700;color:#5a6b7d;text-transform:uppercase;letter-spacing:.6px;padding:0 0 7px">Na mesa de trabalho <span style="color:#b6c0cb">(' + r.mesa.length + ')</span></div>' +
      '<div style="background:#fff;border:1px solid #e4e8ee;border-radius:6px;padding:4px 0">' +
      r.mesa.map(function (m) {
        return '<div style="padding:6px 12px;font-size:13px;color:#1f2733">' +
          '<span style="font-size:10px;color:#7b8896;border:1px solid #dfe4ea;border-radius:3px;padding:1px 6px;margin-right:7px">' + _esc_(m.tipo) + '</span>' +
          _esc_(m.titulo) + (m.op ? ' <span style="color:#96762e;font-size:11px">◎ ' + _esc_(m.op) + '</span>' : '') + '</div>';
      }).join('') + '</div></div>';
  }

  var corpo = '' +
    _secao_('Prazos vencidos', r.vencidas, '#c0392b') +
    _secao_('Prazos a vencer', r.prazos, '#b8860b') +
    _secao_('No radar — próximos prazos', r.radar, '#5a6b7d') +
    _secao_('Audiências', r.audiencias, '#8a6d1f') +
    _secao_('Prescrição se aproximando', r.prescricoes, '#c0392b') +
    _secao_('Tarefas urgentes', r.tarefas, '#2c6ba0');

  if (!corpo && !mesa) corpo = '<div style="padding:26px;text-align:center;color:#7b8896;background:#fff;border:1px solid #e4e8ee;border-radius:6px">Nenhuma pendência no período. ✓</div>';

  return '' +
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f6f9;padding:22px;margin:0">' +
    '<div style="max-width:640px;margin:0 auto">' +
    '<div style="background:#1f2733;color:#e2ded0;padding:15px 18px;border-radius:6px 6px 0 0">' +
    '<div style="font-size:17px;font-weight:700;letter-spacing:.5px">NEXUS</div>' +
    '<div style="font-size:12px;color:#9fb0c8;margin-top:2px">Resumo de ' + _hojeBR_() + '</div>' +
    '</div>' +
    '<div style="background:#f4f6f9;padding:18px 0 0">' + mesa + corpo + '</div>' +
    '<div style="color:#9aa7b4;font-size:11px;text-align:center;padding:10px 0 0;border-top:1px solid #e4e8ee">' +
    'Enviado automaticamente pelo NEXUS · para desativar, rode <code>removerResumoDiario</code> no Apps Script' +
    '</div></div></div>';
}