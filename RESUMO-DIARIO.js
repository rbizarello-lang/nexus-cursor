/**
 * NEXUS — RESUMO DIÁRIO POR E-MAIL
 * ---------------------------------------------------------------------------
 * Lê o nexus_data.json (o mesmo arquivo que o app sincroniza no Drive) e envia
 * um e-mail compacto (tabelas densas, uma linha por item) com, nesta ordem:
 * TODAS as intimações em aberto (sem responseAction), agrupadas pela situação do
 * prazo (vencidas · hoje e amanhã · até 7 dias · 8 a 30 dias · mais de 30 dias ·
 * sem prazo), audiências, prescrição (cartões da Mesa de prazos), tarefas
 * urgentes e de prioridade alta e, no fim, a Mesa de trabalho.
 * Intimação em aberto = sem responseAction; a «analisada» com prazo vencido sai
 * (análise ≠ peticionamento). Uma linha discreta conta as respondidas nas últimas 24 h.
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
  DIAS_AUDIENCIA: 15,     // audiências: idem
  DIAS_TAREFA_ALTA: 7,    // tarefas de prioridade alta: entram se vencem em até N dias (ou já venceram)
  CDAS_POR_CARTAO: 10,    // prescrição: CDAs listadas por cartão ("+N CDAs no app" para o resto)
  CHARS_NOTA: 140,        // intimações: tamanho máximo da última nota no e-mail
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
// Grupos de intimações por situação do prazo, na ordem do e-mail. `curto` entra na linha de totais.
var GRUPOS_INTIM = [
  { id: 'venc', nome: 'Vencidas', curto: 'vencidas' },
  { id: 'hoje', nome: 'Hoje e amanhã', curto: 'hoje/amanhã' },
  { id: 'sete', nome: 'Até 7 dias', curto: 'até 7 dias' },
  { id: 'trinta', nome: '8 a 30 dias', curto: 'até 30' },
  { id: 'mais', nome: 'Mais de 30 dias', curto: 'depois' },
  { id: 'sem', nome: 'Sem prazo', curto: 'sem prazo' }
];
// Rótulos de INTIM_STATUSES (src/app.jsx), incluindo o legado «analisado».
var STATUS_INTIM = {
  pendente_analise: 'Pendente de Análise',
  em_analise: 'Em Análise',
  analise_concluida: 'Análise Concluída',
  aguardando_subsidios: 'Aguardando Subsídios',
  aguardar: 'Aguardar',
  peca_edicao: 'Peça em Edição',
  ciencia_renuncia: 'Ciência com Renúncia',
  peca_pronta: 'Peça Pronta',
  analisado: 'Analisado'
};
// Cores do e-mail: só o alerta (prazo vencido/hoje, urgente) é colorido.
var COR_ALERTA = '#c0392b';
var COR_TEXTO = '#1f2733';
var COR_CINZA = '#6b7785';
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
  // Todas as intimações em aberto contam para decidir o envio (as respondidas nas últimas 24 h, não).
  var aAgir = r.presc.total;
  var total = r.intim.total + r.audiencias.length + aAgir + r.tarefas.length;
  if (total === 0 && !CONFIG.ENVIAR_SE_VAZIO) return 'Nada pendente hoje — e-mail não enviado.';

  var email = CONFIG.EMAIL || Session.getActiveUser().getEmail();
  var assunto = _assunto_(r.intim.contagem.venc, aAgir);

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

  var out = { intim: null, audiencias: [], presc: null, tarefas: [], mesa: [] };

  // Intimações: TODAS as em aberto (sem responseAction), agrupadas pela situação do prazo.
  out.intim = _coletarIntimacoes_(d, nomeOp);

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
  out.audiencias.sort(porData); out.tarefas.sort(porData);
  return out;
}

/** Última nota da intimação (notesList, senão notes), sem HTML, em uma linha e cortada em CONFIG.CHARS_NOTA. */
function _ultimaNota_(x) {
  var n = null;
  if (x.notesList && x.notesList.length) n = x.notesList[x.notesList.length - 1];
  if (n && typeof n === 'object') n = n.text || n.html || '';
  if (!n && x.notes) n = x.notes;
  var t = String(n == null ? '' : n).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  var lim = CONFIG.CHARS_NOTA;
  return t.length > lim ? t.slice(0, lim - 1).replace(/\s+\S*$/, '').replace(/[\s,;:.\-—]+$/, '') + '…' : t;
}

/** Desempate dentro do dia: urgente primeiro, depois prioridade (alta, normal, baixa). */
function _pesoPrioridade_(x) {
  if (x.urgente) return 0;
  var p = String(x.prioridade || '').toLowerCase();
  return p === 'urgente' ? 0 : p === 'alta' ? 1 : p === 'baixa' ? 3 : 2;
}

function _grupoIntim_(dias) {
  if (dias === null) return 'sem';
  if (dias < 0) return 'venc';
  if (dias <= 1) return 'hoje';
  if (dias <= 7) return 'sete';
  if (dias <= 30) return 'trinta';
  return 'mais';
}

/**
 * Intimações em aberto (sem responseAction), em grupos fixos (GRUPOS_INTIM) já ordenados por prazo e, no
 * empate, urgente/prioridade. «Analisada» com prazo vencido sai. `respondidas` = com responseAction.respondedAt
 * nas últimas 24 h (só contagem).
 */
function _coletarIntimacoes_(d, nomeOp) {
  var grupos = {}, contagem = {};
  GRUPOS_INTIM.forEach(function (g) { grupos[g.id] = []; contagem[g.id] = 0; });
  var total = 0, respondidas = 0;
  var agora = new Date().getTime();
  (d.intimations || []).forEach(function (x) {
    if (!x) return;
    if (x.responseAction) {
      var t = x.responseAction.respondedAt ? new Date(x.responseAction.respondedAt).getTime() : NaN;
      if (!isNaN(t) && agora - t >= 0 && agora - t <= 86400000) respondidas++;
      return;
    }
    var dias = x.dateDeadline ? _dias_(x.dateDeadline) : null;
    // Analisado sem atuação: só some depois que o prazo vence (análise ≠ peticionamento).
    if (x.status === 'analisado' && dias !== null && dias < 0) return;
    var g = _grupoIntim_(dias);
    grupos[g].push({
      dias: dias, data: dias === null ? '' : x.dateDeadline,
      proc: x.processNumber || '', classe: x.className || '',
      parte: x.partyName || x.parties || '',
      evento: x.eventDescription || '',
      op: nomeOp(x.operationId),
      status: x.status ? (STATUS_INTIM[x.status] || String(x.status)) : '',
      prioridade: x.priority || '', urgente: !!x.urgent,
      nota: _ultimaNota_(x)
    });
    contagem[g]++; total++;
  });
  GRUPOS_INTIM.forEach(function (g) {
    grupos[g.id].sort(function (a, b) {
      var da = a.dias === null ? 0 : a.dias, db = b.dias === null ? 0 : b.dias;
      return (da - db) || (_pesoPrioridade_(a) - _pesoPrioridade_(b));
    });
  });
  return {
    total: total, contagem: contagem, respondidas: respondidas,
    grupos: GRUPOS_INTIM.map(function (g) { return { id: g.id, nome: g.nome, curto: g.curto, itens: grupos[g.id] }; })
  };
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
  var r = { texto: '', data: '', cor: COR_TEXTO, chip: m.cedoTarde ? 'cedo venceu, tarde não' : '' };
  if (m.dateKind === 'tarde') {
    if (dias === null) { r.texto = m.label || 'sem data tarde'; return r; }
    r.texto = 'tarde ' + _horizonte_(dias);
    r.data = _fmtData_(m.date);
    return r;
  }
  if (m.dateKind === 'consumada' && dias !== null) {
    r.texto = 'consumada ' + _horizonte_(dias);
    r.data = _fmtData_(m.date);
    r.cor = COR_ALERTA;
    return r;
  }
  if (m.dateKind === 'prazo' && dias !== null) {
    r.texto = _horizonte_(dias);
    r.data = m.label || _fmtData_(m.date);
    if (dias <= 0) r.cor = COR_ALERTA;
    return r;
  }
  r.texto = m.label || (m.date ? _fmtData_(m.date) : '—');
  return r;
}

// ─── E-MAIL (HTML compacto, estilos inline) ─────────────────────────────────

function _esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var TD = 'padding:3px 4px;border-bottom:1px solid #e3e6ea;vertical-align:top;';

function _cinza_(txt, px) {
  return '<span style="color:' + COR_CINZA + ';font-size:' + (px || 11) + 'px">' + txt + '</span>';
}

/** Título de seção: negrito simples, filete fino, com a contagem. */
function _titulo_(texto, extra) {
  return '<div style="font-size:13px;font-weight:700;color:' + COR_TEXTO + ';margin:14px 0 3px;padding:0 0 2px;border-bottom:1px solid #9aa4af">' +
    _esc_(texto) + (extra ? ' <span style="font-weight:400;color:' + COR_CINZA + '">' + extra + '</span>' : '') + '</div>';
}

/**
 * Linha de tabela: cada célula é HTML pronto; `nowrap` marca (por índice) as que não quebram e `larg` dá a
 * largura (px ou %) de colunas. As classes nx-* só servem ao CSS do celular (ver _html_); sem ele, a tabela segue válida.
 */
function _linha_(cels, nowrap, larg) {
  return '<tr class="nx-r">' + cels.map(function (c, i) {
    return '<td class="nx-c"' + (larg && larg[i] ? ' width="' + larg[i] + '"' : '') + ' style="' + TD + (nowrap && nowrap.indexOf(i) >= 0 ? 'white-space:nowrap;' : '') + '">' + c + '</td>';
  }).join('') + '</tr>';
}

function _tabela_(linhas) {
  return '<table class="nx-t" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;color:' + COR_TEXTO + '">' + linhas + '</table>';
}

/** Nº do processo sem quebra (no celular o CSS libera a quebra, classe nx-p). */
function _proc_(proc) {
  return proc ? '<span class="nx-p" style="white-space:nowrap">' + _esc_(proc) + '</span>' : _cinza_('<i>sem processo</i>', 12);
}

function _op_(op) {
  return op ? _cinza_('◎ ' + _esc_(op)) : '';
}

/** dd/mm (com /aa se o ano não for o atual). */
function _fmtCurta_(iso) {
  var k = _diaKey_(iso);
  if (!k) return iso ? _esc_(iso) : '—';
  var p = k.split('-');
  return p[2] + '/' + p[1] + (+p[0] !== new Date().getFullYear() ? '/' + p[0].slice(2) : '');
}

/** Texto do prazo: «vencida há 4d», «hoje», «amanhã», «em 12d» (9999/null = sem prazo). */
function _prazoTexto_(dias) {
  if (dias === null || dias === 9999) return 'sem prazo';
  if (dias < 0) return 'vencida há ' + Math.abs(dias) + 'd';
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return 'em ' + dias + 'd';
}

/** Célula do prazo: data curta em negrito + texto; vermelho se vencido ou hoje. */
function _celPrazo_(dias, data) {
  if (dias === null || dias === 9999) return _cinza_('sem prazo', 12);
  var cor = dias <= 0 ? COR_ALERTA : COR_TEXTO;
  return '<span style="color:' + cor + ';font-weight:' + (dias <= 0 ? 700 : 400) + '"><b>' + _fmtCurta_(data) + '</b> ' + _prazoTexto_(dias) + '</span>';
}

/** Seção «Intimações em aberto»: total + contagem por grupo no título, uma tabela com subtítulos de grupo. */
function _secaoIntimacoes_(it) {
  if (!it.total) return '';
  var cab = [];
  it.grupos.forEach(function (g) { if (g.itens.length) cab.push(g.itens.length + ' ' + g.curto); });
  var larg = [null, null, '15%', '34%', '14%'];
  var linhas = '<tr class="nx-h">' + ['Prazo', 'Processo · classe', 'Parte', 'Evento · nota', 'Operação'].map(function (h, i) {
    return '<td ' + (larg[i] ? 'width="' + larg[i] + '" ' : '') + 'style="padding:2px 4px;border-bottom:1px solid #9aa4af;color:' + COR_CINZA + ';font-size:11px">' + h + '</td>';
  }).join('') + '</tr>';
  it.grupos.forEach(function (g) {
    if (!g.itens.length) return;
    linhas += '<tr class="nx-g"><td colspan="5" style="padding:7px 4px 2px;font-weight:700;font-size:12px;color:' + (g.id === 'venc' ? COR_ALERTA : COR_TEXTO) + '">' +
      _esc_(g.nome) + ' <span style="font-weight:400;color:' + COR_CINZA + '">(' + g.itens.length + ')</span></td></tr>';
    g.itens.forEach(function (x) {
      var meta = [];
      if (x.status) meta.push(_esc_(x.status));
      if (x.prioridade) meta.push(x.prioridade === 'alta' ? '<b>alta</b>' : _esc_(x.prioridade));
      linhas += _linha_([
        _celPrazo_(x.dias, x.data) + (meta.length ? '<br>' + _cinza_(meta.join(' · ')) : ''),
        _proc_(x.proc) + (x.classe ? ' <span style="color:' + COR_CINZA + '">· ' + _esc_(x.classe) + '</span>' : ''),
        _esc_(x.parte),
        (x.urgente ? '<b style="color:' + COR_ALERTA + '">URGENTE</b> ' : '') + _esc_(x.evento) +
          (x.nota ? ' ' + _cinza_('— “' + _esc_(x.nota) + '”') : ''),
        _op_(x.op)
      ], [0], larg);
    });
  });
  return _titulo_('Intimações em aberto: ' + it.total, '— ' + cab.join(' · ')) + _tabela_(linhas);
}

/** Linha discreta com as intimações respondidas nas últimas 24 h (só a contagem). */
function _linhaRespondidas_(it) {
  return '<div style="margin:5px 0 0;color:' + COR_CINZA + ';font-size:11px">Respondidas nas últimas 24 h: ' + it.respondidas + '</div>';
}

function _secaoAudiencias_(itens) {
  if (!itens.length) return '';
  return _titulo_('Audiências', '(' + itens.length + ')') + _tabela_(itens.map(function (x) {
    return _linha_([_celPrazo_(x.dias, x.data), _proc_(x.proc), _esc_(x.titulo), _esc_(x.extra), _op_(x.op)], [0], null);
  }).join(''));
}

function _secaoTarefas_(itens) {
  if (!itens.length) return '';
  return _titulo_('Tarefas urgentes e de prioridade alta', '(' + itens.length + ')') + _tabela_(itens.map(function (x) {
    var tag = '<span style="font-size:10px;font-weight:700;color:' + (x.tag === 'URGENTE' ? COR_ALERTA : COR_TEXTO) + '">' + x.tag + '</span> ';
    return _linha_([
      _celPrazo_(x.dias, x.data),
      tag + _esc_(x.titulo),
      _cinza_(_esc_(x.extra), 12),
      _op_(x.op)
    ], [0]);
  }).join(''));
}

/** Seção «Prescrição — a agir»: um bloco por cartão da Mesa (fileira 1), com a hora do cálculo no fim. */
function _secaoPrescricao_(p) {
  var hora = p.calculadoEm ? '<div style="margin:4px 0 0;color:' + COR_CINZA + ';font-size:11px">Cartões calculados na sincronização de ' + _esc_(p.calculadoEm) + '</div>' : '';
  if (p.semCartoes) {
    return _titulo_('Prescrição — a agir') + '<div style="color:' + COR_CINZA + '">' + _esc_(NOTA_SEM_CARTOES) + '</div>' + hora;
  }
  if (!p.blocos.length) return hora; // nada a agir: some a seção; fica só a hora do cálculo, discreta
  var corpo = p.blocos.map(function (b) {
    var linhas = b.itens.map(function (x) {
      var rel = x.relogio;
      return _linha_([
        '<span style="color:' + rel.cor + ';font-weight:' + (rel.cor === COR_ALERTA ? 700 : 400) + '">' + _esc_(rel.texto) + '</span>' +
          (rel.data ? ' ' + _cinza_(_esc_(rel.data)) : ''),
        'CDA ' + _esc_(x.cda) + (x.devedor ? ' <span style="color:' + COR_CINZA + '">· ' + _esc_(x.devedor) + '</span>' : ''),
        _proc_(x.proc),
        '<span style="white-space:nowrap">' + _fmtMoeda_(x.valor) + '</span>' + (rel.chip ? ' ' + _cinza_('· ' + _esc_(rel.chip)) : ''),
        _op_(x.op)
      ], [0], null);
    }).join('');
    var resumo = b.n
      ? b.n + (b.n === 1 ? ' CDA' : ' CDAs') + ' · ' + _fmtMoeda_(b.valor)
      : 'nenhuma nos 60 dias';
    return '<div style="margin:8px 0 0">' +
      '<span style="font-weight:700">' + _esc_(b.nome) + '</span> <span style="color:' + COR_CINZA + ';font-size:12px">' + _esc_(resumo) + '</span>' +
      (linhas ? _tabela_(linhas) : '') +
      (b.mais > 0 ? '<div style="color:' + COR_CINZA + ';font-size:11px;padding:2px 4px 0">+' + b.mais + (b.mais === 1 ? ' CDA' : ' CDAs') + ' no app</div>' : '') +
      (b.id === 'ajuizar' && b.longe > 0 ? '<div style="color:' + COR_CINZA + ';font-size:11px;padding:2px 4px 0">+' + b.longe + ' entre 60 e 180 dias</div>' : '') +
      '</div>';
  }).join('');
  return _titulo_('Prescrição — a agir', '(' + p.total + ')') + corpo + hora;
}

function _secaoMesa_(itens) {
  if (!itens.length) return '';
  return _titulo_('Na mesa de trabalho', '(' + itens.length + ')') + _tabela_(itens.map(function (m) {
    return _linha_([_cinza_(_esc_(m.tipo), 12), _esc_(m.titulo), _op_(m.op)], [0]);
  }).join(''));
}

function _html_(r) {
  // Ordem: intimações em aberto · audiências · prescrição · tarefas · mesa de trabalho (no fim) · rodapé.
  var corpo = '' +
    _secaoIntimacoes_(r.intim) +
    ((r.intim.total || r.intim.respondidas) ? _linhaRespondidas_(r.intim) : '') +
    _secaoAudiencias_(r.audiencias) +
    _secaoPrescricao_(r.presc) +
    _secaoTarefas_(r.tarefas) +
    _secaoMesa_(r.mesa);

  var temItens = r.intim.total + r.audiencias.length + r.presc.total + r.tarefas.length + r.mesa.length;
  if (!temItens && !r.presc.semCartoes) {
    corpo = '<div style="margin:14px 0 0;color:' + COR_CINZA + '">Nenhuma pendência no período. ✓</div>' + corpo;
  }

  // CSS só para telas estreitas (Gmail aceita <style> com @media): as linhas viram parágrafos corridos.
  var css = '<style>@media only screen and (max-width:600px){' +
    '.nx-t,.nx-t tbody,.nx-r,.nx-g,.nx-g td{display:block !important;width:auto !important}' +
    '.nx-h{display:none !important}.nx-p{white-space:normal !important}' +
    '.nx-r{padding:3px 0 !important;border-bottom:1px solid #e3e6ea !important}' +
    '.nx-c{display:inline !important;border:0 !important;padding:0 6px 0 0 !important;width:auto !important}' +
    '}</style>';
  return css +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.35;color:' + COR_TEXTO + ';background:#ffffff;margin:0;padding:8px;max-width:820px;width:auto">' +
    '<div style="font-size:15px;font-weight:700">NEXUS <span style="font-weight:400;font-size:13px;color:' + COR_CINZA + '">· resumo de ' + _hojeBR_() + '</span></div>' +
    corpo +
    '<div style="color:' + COR_CINZA + ';font-size:11px;margin:16px 0 0;padding:4px 0 0;border-top:1px solid #e3e6ea">' +
    'Enviado automaticamente pelo NEXUS · para desativar, rode <code>removerResumoDiario</code></div>' +
    '</div>';
}
