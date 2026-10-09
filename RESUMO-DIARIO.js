/**
 * NEXUS — RESUMO DIÁRIO POR E-MAIL
 * ---------------------------------------------------------------------------
 * Lê o nexus_data.json (o mesmo arquivo que o app sincroniza no Drive) e envia
 * um e-mail com o que exige atuação, nesta ordem: prazos vencidos, prazos a
 * vencer, radar de intimações, audiências, prescrição (cartões da Mesa de
 * prazos), tarefas urgentes e de prioridade alta e, no fim, a Mesa de trabalho.
 *
 * DESTINO: CONFIG.EMAIL = doutorjivago@mail.grokbot.com (só esse endereço).
 * Horário: 7h (CONFIG.HORA_ENVIO).
 *
 * PRESCRIÇÃO: o Apps Script não roda o bundle do app, então é o APP quem grava
 * o cartão de cada CDA (debt.mesaCard) e a hora do cálculo (data.mesaCardsAt)
 * ao salvar na nuvem (NEXUS 3.5 ou mais novo). O e-mail só lê esses campos:
 * Conferir o cálculo · Ajuizar (até 60 dias; de 60 a 180 vira uma linha cinza) ·
 * Lançar fato ou ciência · Confirmar vigência · Completar dado — na mesma ordem
 * da Mesa, até 10 CDAs por cartão. Nunca entram a fileira 2 (conferir sem pressa,
 * só vigiar, adiadas, tratadas), as consumadas antigas nem a decadência. Os dias
 * são recalculados na manhã do envio. Se nenhuma CDA tiver mesaCard, o e-mail
 * pede para abrir o NEXUS 3.5 e sincronizar.
 *
 * COMO INSTALAR
 *   Prefira o mesmo projeto Apps Script do NEXUS (npm run push já inclui
 *   este arquivo). Assim o resumo usa o mesmo arquivo pinado por ID que o app.
 *   Se colar à mão: Arquivo → Novo → Script, nomeie "resumo-diario", cole
 *   o conteúdo, rode testarResumoAgora e depois instalarResumoDiario.
 *   (O e-mail estava suspenso: para retomar, rode instalarResumoDiario.)
 *
 * NÃO busca nexus_data.json pelo nome no Drive inteiro — isso pegava o
 * primeiro arquivo homônimo (cópia de teste, outro acervo).
 *
 * PARA DESLIGAR: rode  removerResumoDiario
 * PARA MUDAR O HORÁRIO: altere HORA_ENVIO e rode instalarResumoDiario de novo.
 */

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────────
var CONFIG = {
  EMAIL: 'doutorjivago@mail.grokbot.com', // destinatário único (vazio = conta que roda o script)
  HORA_ENVIO: 7,          // 0–23 (horário do fuso do projeto)
  ARQUIVO: 'nexus_data.json',
  DIAS_PRAZO: 7,          // intimações: alertar com esta antecedência
  DIAS_AUDIENCIA: 15,     // audiências: idem
  DIAS_TAREFA_ALTA: 7,    // tarefas de prioridade alta: entram se vencem em até N dias (ou já venceram)
  CDAS_POR_CARTAO: 10,    // prescrição: CDAs listadas por cartão ("+N CDAs no app" para o resto)
  PROXIMOS_PRAZOS: 5,     // além dos urgentes, mostrar sempre as N intimações mais próximas
  ENVIAR_SE_VAZIO: false  // true = manda e-mail mesmo sem nada pendente
};
// Tarefas: urgentes entram sempre (com ou sem prazo); as de prioridade alta só com prazo em CONFIG.DIAS_TAREFA_ALTA.
var PRIORIDADE_TAREFA = 'urgente';
var PRIORIDADE_TAREFA_ALTA = 'alta';
// Cartões da fileira 1 da Mesa de prazos, na ordem da Mesa (ids gravados em debt.mesaCard.card).
var CARTOES_PRESC = [
  { id: 'calculo', nome: 'Conferir o cálculo', cor: '#c2631a' },
  { id: 'ajuizar', nome: 'Ajuizar', cor: '#c0392b' },
  { id: 'fato', nome: 'Lançar fato ou ciência', cor: '#c2631a' },
  { id: 'vigencia', nome: 'Confirmar vigência', cor: '#2c6ba0' },
  { id: 'dado', nome: 'Completar dado', cor: '#5a6b7d' }
];
var NOTA_SEM_CARTOES = 'Abra o NEXUS 3.5 e sincronize para o e-mail passar a mostrar os cartões de prescrição.';

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
  var aAgir = r.presc.total;
  var total = r.vencidas.length + r.prazos.length + r.audiencias.length + aAgir + r.tarefas.length;
  if (total === 0 && r.radar.length === 0 && !CONFIG.ENVIAR_SE_VAZIO) return 'Nada pendente hoje — e-mail não enviado.';

  var email = CONFIG.EMAIL || Session.getActiveUser().getEmail();
  var assunto = _assunto_(r.vencidas.length, aAgir);

  MailApp.sendEmail({ to: email, subject: assunto, htmlBody: _html_(r), name: 'NEXUS' });
  return 'Resumo enviado para ' + email + ' (' + total + ' itens).';
}

/** NEXUS · dd/mm · N prazo(s) vencido(s) · M a agir na prescrição (partes zeradas são omitidas). */
function _assunto_(vencidos, aAgir) {
  var partes = ['NEXUS', _hojeCurtoBR_()];
  if (vencidos > 0) partes.push(vencidos + (vencidos === 1 ? ' prazo vencido' : ' prazos vencidos'));
  if (aAgir > 0) partes.push(aAgir + ' a agir na prescrição');
  return partes.join(' · ');
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

function _hojeCurtoBR_() {
  var d = new Date();
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
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

  var out = { vencidas: [], prazos: [], radar: [], audiencias: [], presc: null, tarefas: [], mesa: [] };

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

  // Prescrição: cartões da Mesa gravados pelo app em cada CDA (debt.mesaCard); nada é recalculado aqui.
  out.presc = _coletarPrescricao_(d, nomeOp);

  // Tarefas: urgentes (independe do prazo — urgente é urgente; sem prazo vão para o fim) e de
  // prioridade ALTA com prazo em até CONFIG.DIAS_TAREFA_ALTA dias (ou já vencido).
  (d.tasks || []).forEach(function (t) {
    if (t.status === 'concluida' || t.status === 'cancelada') return;
    var prio = String(t.priority || '');
    var dias = t.dueDate ? _dias_(t.dueDate) : null;
    var tag;
    if (prio === PRIORIDADE_TAREFA) {
      tag = 'URGENTE';
    } else if (prio === PRIORIDADE_TAREFA_ALTA) {
      if (dias === null || dias > CONFIG.DIAS_TAREFA_ALTA) return;
      tag = 'ALTA';
    } else {
      return;
    }
    out.tarefas.push({
      dias: dias === null ? 9999 : dias,
      data: t.dueDate || '',
      titulo: t.title || 'Tarefa',
      tag: tag,
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
  out.audiencias.sort(porData); out.tarefas.sort(porData);
  return out;
}

/**
 * Cartões de prescrição a partir de debt.mesaCard. Só a fileira 1; o Ajuizar de 60 a 180 dias (longe)
 * vira contagem cinza. Cada bloco: n, valor, até CONFIG.CDAS_POR_CARTAO CDAs na ordem da Mesa (ord) e
 * quantas ficaram de fora (mais). `semCartoes` = o app ainda não gravou nenhum cartão nem mesaCardsAt.
 */
function _coletarPrescricao_(d, nomeOp) {
  var pessoas = {};
  (d.people || []).forEach(function (p) { if (p && p.id) pessoas[p.id] = p.name || ''; });
  var porCartao = {};
  CARTOES_PRESC.forEach(function (c) { porCartao[c.id] = { agir: [], longe: 0 }; });
  var gravadas = 0;

  (d.debts || []).forEach(function (x) {
    var m = x && x.mesaCard;
    if (!m || !porCartao[m.card]) return;        // fileira 2, antigas e decadência nunca têm cartão aqui
    if (x.status === 'extinta' || x.prescriptionHandled) return;
    gravadas++;
    if (m.card === 'ajuizar' && m.longe) { porCartao.ajuizar.longe++; return; }
    porCartao[m.card].agir.push({
      ord: Number(m.ord) || 0, valor: Number(x.value) || 0, m: m,
      cda: x.cdaNumber || 's/nº',
      devedor: (x.personId && pessoas[x.personId]) || '',
      proc: x.processNumber || '',
      op: nomeOp(x.operationId)
    });
  });

  var blocos = [];
  var total = 0;
  CARTOES_PRESC.forEach(function (c) {
    var g = porCartao[c.id];
    if (!g.agir.length && !g.longe) return;
    g.agir.sort(function (a, b) { return (a.ord - b.ord) || (b.valor - a.valor); });
    var valor = 0;
    g.agir.forEach(function (it) { valor += it.valor; });
    var lim = CONFIG.CDAS_POR_CARTAO;
    blocos.push({
      id: c.id, nome: c.nome, cor: c.cor,
      n: g.agir.length, valor: valor, longe: g.longe,
      itens: g.agir.slice(0, lim).map(function (it) {
        return { cda: it.cda, devedor: it.devedor, proc: it.proc, op: it.op, valor: it.valor, relogio: _relogioCartao_(it.m) };
      }),
      mais: Math.max(0, g.agir.length - lim)
    });
    total += g.agir.length;
  });

  var em = d.mesaCardsAt ? new Date(d.mesaCardsAt) : null;
  if (em && isNaN(em.getTime())) em = null;
  return {
    blocos: blocos,
    total: total,
    semCartoes: gravadas === 0 && !em,
    calculadoEm: em ? ('0' + em.getDate()).slice(-2) + '/' + ('0' + (em.getMonth() + 1)).slice(-2) +
      ' às ' + ('0' + em.getHours()).slice(-2) + ':' + ('0' + em.getMinutes()).slice(-2) : ''
  };
}

/** «hoje», «em 12d», «há 40d»; acima de 2 anos, em anos (mesmo critério da tela). */
function _horizonte_(dias) {
  var abs = Math.abs(dias);
  if (abs > 730) {
    var anos = Math.max(1, Math.round(abs / 365));
    return dias < 0 ? 'há ' + anos + ' anos' : 'em ' + anos + ' anos';
  }
  if (dias < 0) return 'há ' + abs + 'd';
  if (dias === 0) return 'hoje';
  return 'em ' + dias + 'd';
}

/**
 * Relógio da CDA no cartão, com os dias recomputados hoje a partir de m.date (mesmo critério da Mesa):
 * «tarde em …» + selo «cedo venceu, tarde não»; consumada recente «consumada há Nd»; data que não é prazo
 * («não antes de …») aparece só como texto, nunca como «há N anos».
 */
function _relogioCartao_(m) {
  var dias = m.date ? _dias_(m.date) : null;
  var r = { texto: '', data: '', cor: '#7b8896', chip: m.cedoTarde ? 'cedo venceu, tarde não' : '' };
  if (m.dateKind === 'tarde') {
    if (dias === null) { r.texto = m.label || 'sem data tarde'; return r; }
    r.texto = 'tarde ' + _horizonte_(dias);
    r.data = _fmtData_(m.date);
    r.cor = '#b8860b';
    return r;
  }
  if (m.dateKind === 'consumada' && dias !== null) {
    r.texto = 'consumada ' + _horizonte_(dias);
    r.data = _fmtData_(m.date);
    r.cor = '#c0392b';
    return r;
  }
  if (m.dateKind === 'prazo' && dias !== null) {
    r.texto = _horizonte_(dias);
    r.data = m.label || _fmtData_(m.date);
    r.cor = _corPrazo_(dias);
    return r;
  }
  r.texto = m.label || (m.date ? _fmtData_(m.date) : '—');
  return r;
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

/** Selo de prioridade da tarefa (URGENTE / ALTA). */
function _tag_(tag) {
  if (!tag) return '';
  var cor = tag === 'URGENTE' ? '#c0392b' : '#b8860b';
  return '<span style="font-size:10px;font-weight:700;color:' + cor + ';border:1px solid ' + cor +
    ';border-radius:3px;padding:1px 5px;margin-right:6px;letter-spacing:.4px;vertical-align:1px">' + tag + '</span>';
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
      '<div style="color:#1f2733;font-size:14px;font-weight:600">' + _tag_(x.tag) + _esc_(x.titulo) + '</div>' +
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

/** Seção «Prescrição — a agir»: um bloco por cartão da Mesa (fileira 1), com a hora do cálculo no rodapé. */
function _secaoPrescricao_(p) {
  var cinza = 'color:#9aa7b4;font-size:11px';
  var corpo = '';
  if (p.semCartoes) {
    corpo = '<div style="padding:12px 14px;background:#fff;border:1px solid #e4e8ee;border-radius:6px;color:#5a6b7d;font-size:13px">' +
      _esc_(NOTA_SEM_CARTOES) + '</div>';
  } else if (!p.blocos.length) {
    // Nada a agir: some a seção, como as demais; fica só a hora do cálculo, discreta.
    return p.calculadoEm ? '<div style="' + cinza + ';padding:0 2px 18px">Cartões calculados na sincronização de ' + _esc_(p.calculadoEm) + '</div>' : '';
  } else {
    corpo = p.blocos.map(function (b) {
      var linhas = b.itens.map(function (x) {
        var rel = x.relogio;
        return '' +
          '<tr>' +
          '<td style="padding:9px 10px;border-bottom:1px solid #eceff3;white-space:nowrap;vertical-align:top">' +
          '<span style="color:' + rel.cor + ';font-weight:700;font-size:13px">' + _esc_(rel.texto) + '</span>' +
          (rel.data ? '<br><span style="color:#95a3b3;font-size:11px">' + _esc_(rel.data) + '</span>' : '') +
          '</td>' +
          '<td style="padding:9px 10px;border-bottom:1px solid #eceff3;vertical-align:top">' +
          '<div style="color:#1f2733;font-size:14px;font-weight:600">CDA ' + _esc_(x.cda) +
          (x.devedor ? ' <span style="font-weight:400;color:#5a6b7d">· ' + _esc_(x.devedor) + '</span>' : '') + '</div>' +
          '<div style="color:#5a6b7d;font-size:12px;margin-top:1px"><span style="font-family:monospace">' +
          (x.proc ? _esc_(x.proc) : '<i style="font-family:inherit">sem processo</i>') + '</span> · ' + _fmtMoeda_(x.valor) + '</div>' +
          (rel.chip ? '<div style="margin-top:3px"><span style="font-size:10px;color:#8a6d1f;background:#fbf3dc;border:1px solid #ecd9a0;border-radius:3px;padding:1px 6px">' + _esc_(rel.chip) + '</span></div>' : '') +
          (x.op ? '<div style="color:#96762e;font-size:11px;margin-top:3px">◎ ' + _esc_(x.op) + '</div>' : '') +
          '</td>' +
          '</tr>';
      }).join('');
      var resumo = b.n
        ? b.n + (b.n === 1 ? ' CDA' : ' CDAs') + ' · ' + _fmtMoeda_(b.valor)
        : 'nenhuma nos 60 dias';
      return '' +
        '<div style="margin:0 0 12px">' +
        '<div style="padding:0 0 6px"><span style="font-size:13px;font-weight:700;color:' + b.cor + '">' + _esc_(b.nome) + '</span>' +
        ' <span style="color:#7b8896;font-size:12px">' + _esc_(resumo) + '</span></div>' +
        (linhas ? '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4e8ee;border-radius:6px">' + linhas + '</table>' : '') +
        (b.mais > 0 ? '<div style="' + cinza + ';padding:5px 2px 0">+' + b.mais + (b.mais === 1 ? ' CDA' : ' CDAs') + ' no app</div>' : '') +
        (b.id === 'ajuizar' && b.longe > 0 ? '<div style="color:#8a96a3;font-size:12px;padding:5px 2px 0">+' + b.longe + ' entre 60 e 180 dias</div>' : '') +
        '</div>';
    }).join('');
  }
  return '' +
    '<div style="margin:0 0 22px">' +
    '<div style="font-size:13px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:.6px;padding:0 0 7px">' +
    'Prescrição — a agir' + (p.semCartoes ? '' : ' <span style="color:#b6c0cb;font-weight:600">(' + p.total + ')</span>') + '</div>' +
    corpo +
    (p.calculadoEm ? '<div style="' + cinza + ';padding:2px 2px 0">Cartões calculados na sincronização de ' + _esc_(p.calculadoEm) + '</div>' : '') +
    '</div>';
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

  // Ordem: prazos vencidos · a vencer · radar · audiências · prescrição · tarefas · mesa de trabalho (no fim).
  var corpo = '' +
    _secao_('Prazos vencidos', r.vencidas, '#c0392b') +
    _secao_('Prazos a vencer', r.prazos, '#b8860b') +
    _secao_('No radar — próximos prazos', r.radar, '#5a6b7d') +
    _secao_('Audiências', r.audiencias, '#8a6d1f') +
    _secaoPrescricao_(r.presc) +
    _secao_('Tarefas urgentes e de prioridade alta', r.tarefas, '#2c6ba0') +
    mesa;

  var temItens = r.vencidas.length + r.prazos.length + r.radar.length + r.audiencias.length +
    r.presc.total + r.tarefas.length + r.mesa.length;
  if (!temItens && !r.presc.semCartoes) {
    corpo = '<div style="padding:26px;text-align:center;color:#7b8896;background:#fff;border:1px solid #e4e8ee;border-radius:6px;margin:0 0 22px">Nenhuma pendência no período. ✓</div>' + corpo;
  }

  return '' +
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f6f9;padding:22px;margin:0">' +
    '<div style="max-width:640px;margin:0 auto">' +
    '<div style="background:#1f2733;color:#e2ded0;padding:15px 18px;border-radius:6px 6px 0 0">' +
    '<div style="font-size:17px;font-weight:700;letter-spacing:.5px">NEXUS</div>' +
    '<div style="font-size:12px;color:#9fb0c8;margin-top:2px">Resumo de ' + _hojeBR_() + '</div>' +
    '</div>' +
    '<div style="background:#f4f6f9;padding:18px 0 0">' + corpo + '</div>' +
    '<div style="color:#9aa7b4;font-size:11px;text-align:center;padding:10px 0 0;border-top:1px solid #e4e8ee">' +
    'Enviado automaticamente pelo NEXUS · para desativar, rode <code>removerResumoDiario</code> no Apps Script' +
    '</div></div></div>';
}
