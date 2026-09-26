/**
 * Parser puro do relatório PGFN "Resultado da Consulta de Inscrição Localizada" (SIDA).
 * Recebe as linhas já agrupadas por Y (extractPDFText / fixture pdf.js) e devolve
 * o mesmo formato que parseSIDAPDF usava, agora com todas as seções do Relatório Completo.
 */

function sidaFoldKey(s) {
  return String(s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSidaBRDate(s) {
  if (!s) return '';
  const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

export function parseSidaMoneyNumber(s) {
  const m = String(s || '').match(/R\s*\$\s*([\d.,]+)/);
  if (!m) return null;
  const raw = m[1];
  const dec = raw.match(/[.,](\d{2})$/);
  if (!dec) {
    const n = parseFloat(raw.replace(/[.,]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  const body = raw.slice(0, -3).replace(/[.,]/g, '');
  const n = parseFloat(`${body}.${dec[1]}`);
  return Number.isFinite(n) ? n : null;
}

export function parseSidaMoneyString(s) {
  const n = parseSidaMoneyNumber(s);
  return n == null ? '' : String(n);
}

function sidaIsFooterLine(ln) {
  const t = String(ln || '').trim();
  if (!t) return true;
  if (/^P\s*G\s*F\s*N\s*-\s*CONSULTA/i.test(t)) return true;
  if (/^SERPRO$/i.test(t)) return true;
  if (/^P[áa]g\.\s*\d/i.test(t)) return true;
  if (/^MINIST[EÉ]RIO DA ECONOMIA/i.test(t)) return true;
  if (/^Procuradoria-?\s*Geral da Fazenda Nacional/i.test(t)) return true;
  if (/^Resultado da Consulta/i.test(t)) return true;
  if (/^Inscri[cç][oõ]es (Localizadas|Selecionadas):/i.test(t)) return true;
  if (/^Par[âa]metro de Localiza[cç][aã]o:/i.test(t)) return true;
  if (/^Se[cç][oõ]es Selecionadas:/i.test(t)) return true;
  if (/^A T E N/i.test(t)) return true;
  if (/^OS VALORES PRECEDIDOS/i.test(t)) return true;
  if (/\(CZ=CRUZADOS/i.test(t)) return true;
  return false;
}

function sidaIsTableHeader(ln) {
  const k = sidaFoldKey(ln);
  const compact = k.replace(/\s/g, '');
  if (compact === 'DATA/HORADESCRICAOSITUACAO' || compact === 'DATAHORADESCRICAOSITUACAO') return true;
  if (/^DATACRIACAO/.test(compact) && /EFETIVACAO/.test(compact)) return true;
  if (k === 'EVENTOS') return true;
  if (k === 'DADOS DO DEVEDOR NA PGFN' || k === 'DADOS DO DEVEDOR NA RFB') return true;
  return false;
}

function sidaIsBlockStart(ln) {
  return /^Inscrição\s+\d+\s*\/\s*\d+$/i.test(String(ln || '').trim());
}

function sidaIsReportEnd(ln) {
  return /^FIM DO RELATORIO/.test(sidaFoldKey(ln));
}

function sidaSectionOf(ln) {
  const k = sidaFoldKey(ln);
  if (k === 'DADOS GERAIS DA INSCRICAO' || k === 'DADOS GERAIS') return 'dados';
  if (k.includes('INFORMACOES SOBRE OS DEVEDORES')) return 'devedores';
  if (k.includes('INFORMACOES SOBRE O PARCELAMENTO') || k === 'PARCELAMENTO DA INSCRICAO') return 'parcelamentos';
  if (k === 'PROTESTOS') return 'protestos';
  if (k === 'OCORRENCIAS') return 'ocorrencias';
  return null;
}

function sidaValueAfterColon(ln) {
  const idx = String(ln || '').indexOf(':');
  if (idx < 0) return '';
  return String(ln).slice(idx + 1).trim();
}

function sidaLabelCompact(ln) {
  const left = String(ln || '').split(':')[0];
  return sidaFoldKey(left).replace(/\s+/g, '');
}

function sidaMeaningful(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (t === '0' || t === '-' || t === '—' || t === 'N/I') return '';
  return t;
}

function sidaDigitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

function fixMojibake(s) {
  let t = String(s || '');
  if (!/[ÃÂ]/.test(t)) return t;
  t = t
    .replace(/Ã\s+£/g, 'ã')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã§/g, 'ç')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã /g, 'à')
    .replace(/Âº/g, 'º')
    .replace(/Â /g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function sidaEmptyRecord() {
  return {
    parcelamentos: [],
    occurrences: [],
    coresponsibles: [],
    devedores: [],
    protestos: [],
    pagamentos: [],
    cadin: [],
    bloqueios: [],
    ajuizamentos: [],
    suspensoes: [],
  };
}

function sidaParseDados(rec, lines) {
  for (const ln of lines) {
    if (!String(ln).includes(':')) continue;
    const lab = sidaLabelCompact(ln);
    const val = sidaValueAfterColon(ln);
    if (lab === 'DEVEDORPRINCIPAL') rec.devedor = val;
    else if (lab === 'CPF/CNPJ' || lab === 'CNPJ' || lab === 'CPF') rec.cnpj = sidaDigitsOnly(val);
    else if (lab === 'INSCRICAO' && !rec.cdaNumber) rec.cdaNumber = val.replace(/\s+/g, ' ').trim();
    else if (lab === 'NPROCESSOADMINISTRATIVO') rec.processoAdministrativo = val;
    else if (lab === 'SITUACAO' && !rec.situation) rec.situation = val;
    else if (lab === 'SERIEDAINSCRICAO') rec.serie = val;
    else if (lab === 'NATUREZADADIVIDA') rec.natureza = val;
    else if (lab === 'DATADEINSCRICAO') rec.inscriptionDate = parseSidaBRDate(val);
    else if (lab === 'DATAPRIMEIRACOBRANCA') rec.firstChargeDate = parseSidaBRDate(val);
    else if (lab === 'CADASTRONACIONALDEOBRAS') rec.cadastroNacionalObras = sidaMeaningful(val);
    else if (lab === 'RECEITADADIVIDA' || lab === 'TRIBUTO') rec.tribute = val;
    else if (lab === 'VALORINSCRITO') {
      const n = parseSidaMoneyNumber(val || ln);
      if (n != null) rec.valueInscrito = n;
    } else if (lab === 'VALORREMANESCENTE') {
      const n = parseSidaMoneyNumber(val || ln);
      if (n != null) rec.valueRemanescente = n;
    } else if (lab === 'VALORCONSOLIDADO') {
      const n = parseSidaMoneyNumber(val || ln);
      if (n != null) rec.valueConsolidado = n;
    } else if (lab === 'QTD.DEDEBITOS' || lab === 'QTDDEDEBITOS') rec.qtdDebitos = val;
    else if (lab === 'QTD.DEPAGAMENTOS' || lab === 'QTDDEPAGAMENTOS') rec.qtdPagamentos = val;
    else if (lab === 'QTD.DEDEVEDORES' || lab === 'QTDDEDEVEDORES') rec.qtdDevedores = val;
    else if (lab === 'QTD.DEPARCELAMENTOS' || lab === 'QTDDEPARCELAMENTOS') rec.qtdParcelamentos = val;
    else if (lab === 'NAGRUPAMENTOPARAAJUIZAMENTO') rec.agrupamentoAjuizamento = sidaMeaningful(val);
    else if (lab === 'NPROCESSOJUDICIAL' && !rec.processoJudicial) rec.processoJudicial = sidaMeaningful(val);
    else if (lab === 'NUNICODEPROCESSOJUDICIAL') rec.processNumber = sidaMeaningful(val);
    else if (lab === 'DATADEPROTOCOLO') rec.protocolDate = parseSidaBRDate(val);
    else if (lab === 'DATADEDISTRIBUICAO') rec.distributionDate = parseSidaBRDate(val);
    else if (lab === 'ORGAODEJUSTICA') rec.orgaoJustica = val;
    else if (lab === 'JUIZO') rec.juizo = val;
    else if (lab === 'DATADEFALENCIA') rec.dataFalencia = parseSidaBRDate(val);
    else if (lab === 'PFNDEINSCRICAO') rec.pfnInscricao = val;
    else if (lab === 'PFNRESPONSAVEL') rec.pfnResponsavel = val;
    else if (lab === 'ORGAODEORIGEM') rec.orgaoOrigem = val;
    else if (lab === 'NDOAUTODEINFRACAO') rec.autoInfracao = sidaMeaningful(val);
    else if (lab === 'DEVOLUCAO/ARQUIVAMENTO') rec.devolucaoArquivamento = sidaMeaningful(val);
    else if (lab === 'NDOIMOVEL(CIB)') rec.imovelCib = sidaMeaningful(val);
    else if (lab === 'NDOIMOVEL(RIP)') rec.imovelRip = sidaMeaningful(val);
    else if (lab === 'DATADAEXTINCAO') rec.dataExtincao = parseSidaBRDate(val);
    else if (lab === 'MOTIVODESUSPENSAODEEXIGIBILIDADE') rec.motivoSuspensao = sidaMeaningful(val);
    else if (lab === 'MOTIVODAEXTINCAO') rec.motivoExtincao = sidaMeaningful(val);
    else if (lab === 'BLOQUEIODOAJUIZAMENTO') rec.bloqueioAjuizamento = sidaMeaningful(val);
    else if (lab === 'ENVIODEANALISEDOORGAODEORIGEM') rec.envioAnaliseOrigem = val;
  }
}

function parseDevedores(lines) {
  const out = [];
  let cur = null;
  let zone = 'pgfn';
  const flush = () => {
    if (cur && (cur.cpfCnpj || cur.name)) out.push(cur);
    cur = null;
  };
  for (const raw of lines) {
    const ln = String(raw || '');
    const k = sidaFoldKey(ln);
    if (k === 'DADOS DO DEVEDOR NA PGFN') { zone = 'pgfn'; continue; }
    if (k === 'DADOS DO DEVEDOR NA RFB') { zone = 'rfb'; continue; }
    if (!ln.includes(':')) continue;
    const lab = sidaLabelCompact(ln);
    const val = sidaValueAfterColon(ln);
    if (lab === 'CPF/CNPJ' || lab === 'CNPJ' || lab === 'CPF') {
      flush();
      cur = { cpfCnpj: val.trim(), tipo: '', name: '', endereco: '', municipio: '', uf: '', situacaoCadastral: '' };
      zone = 'pgfn';
      continue;
    }
    if (!cur) continue;
    if (lab === 'NOMECOMPLETO') {
      if (zone === 'pgfn' || !cur.name) cur.name = val;
    } else if (lab === 'TIPODEDEVEDOR') cur.tipo = val;
    else if (lab === 'ATIVIDADE/PROFISSAO') cur.atividade = val;
    else if (lab === 'DATAPRIMEIRACOBRANCA') cur.firstChargeDate = parseSidaBRDate(val);
    else if (lab === 'ENDERECO') {
      if (zone === 'pgfn' && !cur.endereco) cur.endereco = val;
      else if (zone === 'rfb' && !cur.endereco) cur.endereco = val;
      if (zone === 'rfb') cur.enderecoRfb = val;
    } else if (lab === 'BAIRRO') {
      if (zone === 'pgfn' || !cur.bairro) cur.bairro = val;
    } else if (lab === 'MUNICIPIO') {
      if (zone === 'pgfn' || !cur.municipio) cur.municipio = val;
    } else if (lab === 'UF') {
      if (zone === 'pgfn' || !cur.uf) cur.uf = val;
    } else if (lab === 'CEP') {
      if (zone === 'pgfn' || !cur.cep) cur.cep = val;
    } else if (lab === 'ORIGEM') cur.origem = val;
    else if (lab === 'SITUACAOCADASTRAL') cur.situacaoCadastral = val;
    else if (lab === 'CNAE/OCUPACAO') cur.cnae = val;
  }
  flush();
  return out;
}

function parseParcelamentos(lines) {
  const out = [];
  let cur = null;
  let lastKey = null;
  let grupo = 'deferido';
  const flush = () => {
    if (cur && (cur.adesao || cur.encerramento || cur.tipo)) out.push(cur);
    cur = null;
    lastKey = null;
  };
  const appendable = new Set(['tipo', 'modalidade', 'situacao', 'obs']);
  for (const raw of lines) {
    const ln = String(raw || '');
    const k = sidaFoldKey(ln);
    if (k.includes('PARCELAMENTOS INDEFERIDOS')) { grupo = 'indeferido'; continue; }
    if (k.includes('PARCELAMENTOS DEFERIDOS')) { grupo = 'deferido'; continue; }
    const hasColon = ln.includes(':');
    const lab = sidaLabelCompact(ln);
    const val = sidaValueAfterColon(ln);
    if (lab === 'ADESAO' && hasColon) {
      flush();
      cur = { adesao: parseSidaBRDate(val), grupo };
      lastKey = 'adesao';
      continue;
    }
    if (!cur) continue;
    if (hasColon) {
      if (lab === 'DEFERIMENTO') { cur.deferimento = parseSidaBRDate(val); lastKey = 'deferimento'; }
      else if (lab === 'ENCERRAMENTO') { cur.encerramento = parseSidaBRDate(val); lastKey = 'encerramento'; }
      else if (lab === 'CONTA') { cur.conta = sidaMeaningful(val); lastKey = 'conta'; }
      else if (lab === 'SITUACAO') { cur.situacao = val; lastKey = 'situacao'; }
      else if (lab === 'TIPO') { cur.tipo = val; lastKey = 'tipo'; }
      else if (lab === 'MODALIDADE') { cur.modalidade = val; lastKey = 'modalidade'; }
      else if (lab === 'SISTEMA') { cur.sistema = val; lastKey = 'sistema'; }
    } else if (lastKey && appendable.has(lastKey) && ln.trim()) {
      cur[lastKey] = `${cur[lastKey] || ''} ${ln.trim()}`.replace(/\s+/g, ' ').trim();
    }
  }
  flush();
  return out;
}

function sidaParseProtestoEventos(lines) {
  const chunks = [];
  let cur = '';
  for (const raw of lines) {
    const ln = String(raw || '').trim();
    if (!ln || sidaIsTableHeader(ln)) continue;
    if (/^Identifica/i.test(ln) || /^Protocolo no Tabelionato/i.test(ln)) continue;
    if (/^Data de Cria[cç]/i.test(ln)) continue;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(ln)) {
      if (cur) chunks.push(cur);
      cur = ln;
    } else if (cur) {
      cur += ` ${ln}`;
    }
  }
  if (cur) chunks.push(cur);
  const eventos = [];
  for (let chunk of chunks) {
    chunk = chunk.replace(/\s+/g, ' ').trim();
    const m = chunk.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4}|-)\s+(?:(\d{2}:\d{2}:\d{2})\s+)?(.*)$/);
    let dataCriacao = '';
    let dataEfetivacao = '';
    let descricao = chunk;
    if (m) {
      dataCriacao = parseSidaBRDate(m[1]);
      dataEfetivacao = m[2] === '-' ? '' : parseSidaBRDate(m[2]);
      descricao = (m[4] || '').replace(/^\d{2}:\d{2}:\d{2}\s+/, '').trim();
    } else {
      const dates = chunk.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
      dataCriacao = dates[0] ? parseSidaBRDate(dates[0]) : '';
      dataEfetivacao = dates[1] ? parseSidaBRDate(dates[1]) : '';
      descricao = chunk.replace(/\d{2}\/\d{2}\/\d{4}/g, ' ').replace(/\d{2}:\d{2}:\d{2}/g, ' ').replace(/\s+/g, ' ').trim();
    }
    descricao = descricao
      .replace(/\(\s*Inf\.\s*do\s*0\s+Cart/i, '(Inf. do Cart')
      .replace(/Data de Cria[cç][aã]o Data de Efetiva[cç][aã]o Descri[cç][aã]o Motivo/ig, ' ')
      .replace(/pelo\s+06\s+Tabelionato/i, 'pelo Tabelionato')
      .replace(/\s+-\s+-\s+/g, ' — ')
      .replace(/\s+/g, ' ')
      .trim();
    if (dataCriacao || descricao) {
      eventos.push({ dataCriacao, dataEfetivacao, descricao });
    }
  }
  return eventos;
}

function sidaParseProtestos(lines) {
  const joinedProbe = lines.join(' ');
  if (/NAO POSSUI PROTESTO|INSCRICAO NAO POSSUI PROTESTOS/i.test(sidaFoldKey(joinedProbe))) return [];
  const out = [];
  let cur = null;
  let eventoLines = [];
  let inEventos = false;
  const flush = () => {
    if (!cur) return;
    cur.eventos = sidaParseProtestoEventos(eventoLines);
    if (cur.identificacao || cur.situacao || (cur.eventos && cur.eventos.length)) out.push(cur);
    cur = null;
    eventoLines = [];
    inEventos = false;
  };
  for (const raw of lines) {
    const ln = String(raw || '');
    const k = sidaFoldKey(ln);
    if (k === 'EVENTOS') { inEventos = true; continue; }
    if (/^Identifica/i.test(ln) && /Protesto/i.test(ln)) {
      flush();
      cur = { identificacao: fixMojibake(ln.replace(/^Identif[^:]*:/i, '').trim()), eventos: [] };
      inEventos = false;
      continue;
    }
    if (!cur) continue;
    if (inEventos) {
      eventoLines.push(ln);
      continue;
    }
    if (/^Protocolo no Tabelionato:/i.test(ln)) cur.protocolo = sidaValueAfterColon(ln);
    else if (/^Data do Protocolo:/i.test(ln)) cur.dataProtocolo = parseSidaBRDate(ln);
    else if (/^Tabelionato respons/i.test(ln)) cur.tabelionato = fixMojibake(ln.replace(/^Tabelionato[^:]*:/i, '').trim());
    else if (/^Situa.*Protesto/i.test(ln)) cur.situacao = sidaValueAfterColon(ln);
    else if (/^Valor.*Protesto/i.test(ln)) cur.valor = parseSidaMoneyString(ln);
  }
  flush();
  return out;
}

function parseOccurrences(lines) {
  const occs = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    const desc = cur.parts.join(' ').replace(/\s+/g, ' ').trim();
    occs.push({ date: cur.date, time: cur.time || '', desc });
    cur = null;
  };
  for (const raw of lines) {
    const ln = String(raw || '');
    if (sidaIsTableHeader(ln)) continue;
    const dm = ln.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.*)$/);
    if (dm) {
      flush();
      cur = { date: parseSidaBRDate(dm[1]), time: '', parts: [dm[2].trim()] };
      continue;
    }
    const tm = ln.trim().match(/^(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*(.*)$/);
    if (tm && cur) {
      if (!cur.time) cur.time = tm[1];
      if (tm[2]) cur.parts.push(tm[2].trim());
      continue;
    }
    if (cur && ln.trim()) cur.parts.push(ln.trim());
  }
  flush();
  return occs;
}

export const SIDA_PARC_ADESAO_PATTERNS = [
  /CONSOLIDACAO\s*PARCEL/i,
  /NEGOCIACAO\s*PARC/i,
  /INCLUSAO\s*EM\s*PARC/i,
  /ADESAO\s*(?:PARC|A\s*PARCELAMENTO)/i,
  /CONFIRM\s*ADESAO\s*PARC/i,
  /OPCAO\s*(?:REFIS|PAES)/i,
  /PARCELAMENTO\s*(?:SIMPLIFICADO|ESPECIAL|LEI)/i,
  /CADASTR\s*DESP(?:ACHO)?\s*DEFERIDO/i,
];

export const SIDA_PARC_RESCISAO_PATTERNS = [
  /ENC\.\s*RESCISAO/i,
  /RESCISAO\s*(?:PARCEL|PARC|LEI|DO\s*PARCEL|\.)/i,
  /EXCLUSAO\s*(?:PARCEL|PARC|DO\s*PARCEL|DE\s*CREDITO)/i,
  /DESISTENCIA\s*PARC/i,
];

export function isSidaProtestoLine(desc) {
  const d = String(desc || '').toUpperCase();
  if (/REMESSA|ENVIO|ENCAMINH|EXPEDIC|PRE-?\s*SELECAO|SELECIONADA|APRESENTACAO|DEVOLVIDO/i.test(d)) return false;
  if (/CANCELA|DESISTENCIA|BAIXA\s*DE\s*PROTESTO|SUSTACAO/i.test(d)) return false;
  if (/PROTESTO\s+(LAVRADO|REGISTRADO|EFETIVADO|EFETUADO|CONCLU)/i.test(d)) return true;
  if (/PROTESTADO|INSCRICAO\s+PROTESTADA|TITULO\s+PROTESTADO/i.test(d)) return true;
  if (/PROTESTO DA CDA/i.test(d) && /efetiva/i.test(d)) return true;
  if (/^PROTESTO$/i.test(d.trim())) return true;
  return false;
}

export function classifySidaOccurrence(desc) {
  const d = String(desc || '');
  if (/INCLUSAO DE CO-?\s*RESPONSAVEL/i.test(d)) return 'coresponsavel';
  if (/INCLUSAO DE PAGAMENTO/i.test(d)) return 'pagamento';
  if (/CADIN/i.test(d)) return /BAIXA/i.test(d) ? 'cadin_baixa' : 'cadin_inclusao';
  if (SIDA_PARC_RESCISAO_PATTERNS.some((p) => p.test(d))) return 'parc_rescisao';
  if (SIDA_PARC_ADESAO_PATTERNS.some((p) => p.test(d))) return 'parc_adesao';
  if (isSidaProtestoLine(d)) return 'protesto';
  if (/AJUIZAMENTO CONFIRMADO/i.test(d) || /RECEP DIST EXEC FISCAL/i.test(d)) return 'ajuizamento';
  if (/BLOQUEIO/i.test(d)) return 'bloqueio';
  if (/FALENC|RECUPERACAO JUDICIAL/i.test(d)) return 'falencia';
  if (/PENHORA|SISBAJUD|CNIB|ARRESTO/i.test(d)) return 'constricao';
  if (/CITAC/i.test(d)) return 'citacao';
  if (/EMBARGO/i.test(d)) return 'embargos';
  if (/ARQUIVAMENTO/i.test(d)) return 'arquivamento';
  return 'info';
}

/** Pedido aguardando análise ou indeferido (sem deferimento): vira “pedido de parcelamento sem deferimento”. */
export function sidaPedidoSemDeferimento(parc) {
  if (!parc || !parc.adesao || parc.deferimento) return false;
  const sit = sidaFoldKey(parc.situacao || '');
  return /AGUARDANDO/.test(sit) || /INDEFER/.test(sit) || parc.grupo === 'indeferido';
}

export function shouldEmitSidaParcelamentoEvents(parc) {
  if (!parc) return false;
  const sit = sidaFoldKey(parc.situacao || '');
  if (/AGUARDANDO/.test(sit)) return false;
  if (/INDEFER/.test(sit) && !parc.deferimento) return false;
  if (parc.grupo === 'indeferido' && /INDEFER/.test(sit)) return false;
  return !!(parc.adesao || parc.encerramento);
}

function buildParcelamentosFromOccurrences(occurrences) {
  const occParcs = [];
  let curOccParc = null;
  const sortedOccs = [...occurrences].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  for (const occ of sortedOccs) {
    const desc = occ.desc || '';
    const isAdesao = SIDA_PARC_ADESAO_PATTERNS.some((p) => p.test(desc));
    const isRescisao = SIDA_PARC_RESCISAO_PATTERNS.some((p) => p.test(desc));
    if (isAdesao && !isRescisao) {
      if (curOccParc) {
        curOccParc.encerramento = occ.date;
        curOccParc.situacao = 'Rescindido (implícito)';
        occParcs.push(curOccParc);
      }
      curOccParc = { adesao: occ.date, modalidade: desc, tipo: 'Ocorrência SIDA', situacao: 'Em vigor', obs: desc, grupo: 'ocorrencia' };
    } else if (isRescisao) {
      if (curOccParc) {
        curOccParc.encerramento = occ.date;
        curOccParc.situacao = /ENC\./i.test(desc) ? 'Rescindido (encerramento)' : 'Rescindido';
        occParcs.push(curOccParc);
        curOccParc = null;
      } else {
        occParcs.push({ adesao: '', encerramento: occ.date, modalidade: desc, tipo: 'Rescisão SIDA', situacao: 'Rescindido', obs: desc, grupo: 'ocorrencia' });
      }
    }
  }
  if (curOccParc) occParcs.push(curOccParc);
  return occParcs;
}

function extractCorespFromOcc(occ) {
  if (!/INCLUSAO DE CO-?\s*RESPONSAVEL/i.test(occ.desc || '')) return null;
  const m = String(occ.desc || '').match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})/);
  if (!m) return null;
  return {
    cpfCnpj: sidaDigitsOnly(m[1]),
    cpfCnpjFormatted: m[1],
    date: occ.date,
    source: 'SIDA-OCORRENCIA',
  };
}

function extractPagamento(occ) {
  if (!/INCLUSAO DE PAGAMENTO/i.test(occ.desc || '')) return null;
  const arrec = parseSidaBRDate(occ.desc);
  const valorM = String(occ.desc).match(/VALOR\s+([\d.]+,\d{2})/i);
  let valor = null;
  if (valorM) {
    valor = parseFloat(valorM[1].replace(/\./g, '').replace(',', '.'));
  }
  return { date: occ.date, arrecadacaoDate: arrec || '', valor, desc: occ.desc };
}

function extractCadin(occ) {
  if (!/CADIN/i.test(occ.desc || '')) return null;
  const prot = String(occ.desc).match(/EMFPG[-\s]*[\d-]+/i);
  return {
    date: occ.date,
    tipo: /BAIXA/i.test(occ.desc) ? 'baixa' : 'inclusao',
    protocolo: prot ? prot[0].replace(/\s+/g, '') : '',
    desc: occ.desc,
  };
}

function extractBloqueio(occ) {
  if (!/BLOQUEIO/i.test(occ.desc || '')) return null;
  return { date: occ.date, desc: occ.desc };
}

function extractAjuizamentoOcc(occ) {
  if (!/AJUIZAMENTO CONFIRMADO/i.test(occ.desc || '') && !/RECEP DIST EXEC FISCAL/i.test(occ.desc || '')) return null;
  const cnj = String(occ.desc).match(/\b(\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}|\d{20})\b/);
  return {
    processNumber: cnj ? cnj[1] : '',
    protocolDate: occ.date,
    juizo: '',
    source: 'ocorrencia',
    raw: occ.desc,
  };
}

function mergeOccurrenceDerived(rec) {
  const existingCpfs = new Set(rec.coresponsibles.map((c) => c.cpfCnpj));
  for (const occ of rec.occurrences) {
    const cr = extractCorespFromOcc(occ);
    if (cr && cr.cpfCnpj && !existingCpfs.has(cr.cpfCnpj)) {
      rec.coresponsibles.push(cr);
      existingCpfs.add(cr.cpfCnpj);
    }
    const pag = extractPagamento(occ);
    if (pag) rec.pagamentos.push(pag);
    const cad = extractCadin(occ);
    if (cad) rec.cadin.push(cad);
    const bl = extractBloqueio(occ);
    if (bl) rec.bloqueios.push(bl);
    const aj = extractAjuizamentoOcc(occ);
    if (aj) rec.ajuizamentos.push(aj);
  }

  rec.devedores.forEach((dev) => {
    if (!dev.tipo || sidaFoldKey(dev.tipo) === 'PRINCIPAL') return;
    const cpfDigits = sidaDigitsOnly(dev.cpfCnpj);
    if (cpfDigits && !existingCpfs.has(cpfDigits)) {
      rec.coresponsibles.push({
        cpfCnpj: cpfDigits,
        cpfCnpjFormatted: dev.cpfCnpj,
        name: dev.name || '',
        endereco: dev.endereco || '',
        municipio: dev.municipio || '',
        uf: dev.uf || '',
        situacaoCadastral: dev.situacaoCadastral || '',
        source: 'SIDA-DEVEDORES',
      });
      existingCpfs.add(cpfDigits);
    } else if (cpfDigits) {
      const hit = rec.coresponsibles.find((c) => c.cpfCnpj === cpfDigits);
      if (hit && !hit.name && dev.name) {
        hit.name = dev.name;
        hit.endereco = hit.endereco || dev.endereco || '';
        hit.municipio = hit.municipio || dev.municipio || '';
        hit.uf = hit.uf || dev.uf || '';
        hit.situacaoCadastral = hit.situacaoCadastral || dev.situacaoCadastral || '';
      }
    }
  });

  const occParcs = buildParcelamentosFromOccurrences(rec.occurrences);
  // Relatório Completo já traz a seção estruturada. Ocorrências só preenchem
  // parcelamento quando essa seção veio vazia (formato antigo / recorte).
  if (occParcs.length && rec.parcelamentos.length === 0) {
    rec.parcelamentos.push(...occParcs);
  }
}

function sidaParseOneRecord(lines) {
  const rec = sidaEmptyRecord();
  let section = 'dados';
  const buckets = {
    dados: [],
    devedores: [],
    parcelamentos: [],
    protestos: [],
    ocorrencias: [],
  };
  for (const raw of lines) {
    const ln = String(raw || '');
    if (sidaIsReportEnd(ln)) break;
    if (sidaIsFooterLine(ln)) continue;
    const sec = sidaSectionOf(ln);
    if (sec) {
      section = sec;
      continue;
    }
    if (sidaIsTableHeader(ln) && section !== 'protestos') continue;
    if (buckets[section]) buckets[section].push(ln);
  }
  sidaParseDados(rec, buckets.dados);
  rec.devedores = parseDevedores(buckets.devedores);
  rec.parcelamentos = parseParcelamentos(buckets.parcelamentos);
  rec.protestos = sidaParseProtestos(buckets.protestos);
  rec.occurrences = parseOccurrences(buckets.ocorrencias);
  if (rec.processNumber || rec.protocolDate || rec.juizo) {
    rec.ajuizamentos.unshift({
      processNumber: rec.processNumber || '',
      protocolDate: rec.protocolDate || '',
      distributionDate: rec.distributionDate || '',
      juizo: rec.juizo || '',
      orgaoJustica: rec.orgaoJustica || '',
      agrupamento: rec.agrupamentoAjuizamento || '',
      source: 'dados_gerais',
    });
  }
  if (rec.motivoSuspensao || rec.dataFalencia) {
    rec.suspensoes.push({
      motivo: rec.motivoSuspensao || '',
      dataFalencia: rec.dataFalencia || '',
      dataExtincao: rec.dataExtincao || '',
      motivoExtincao: rec.motivoExtincao || '',
    });
  }
  mergeOccurrenceDerived(rec);
  return rec;
}

export function buildSidaDebtPayload(rec, importedAt) {
  return {
    importedAt: importedAt || new Date().toISOString(),
    source: 'sida',
    situation: rec.situation || '',
    dadosGerais: {
      devedor: rec.devedor || '',
      cnpj: rec.cnpj || '',
      cdaNumber: rec.cdaNumber || '',
      situation: rec.situation || '',
      inscriptionDate: rec.inscriptionDate || '',
      firstChargeDate: rec.firstChargeDate || '',
      processoAdministrativo: rec.processoAdministrativo || '',
      serie: rec.serie || '',
      natureza: rec.natureza || '',
      tribute: rec.tribute || '',
      valueInscrito: rec.valueInscrito,
      valueRemanescente: rec.valueRemanescente,
      valueConsolidado: rec.valueConsolidado,
      qtdDebitos: rec.qtdDebitos || '',
      qtdPagamentos: rec.qtdPagamentos || '',
      qtdDevedores: rec.qtdDevedores || '',
      qtdParcelamentos: rec.qtdParcelamentos || '',
      agrupamentoAjuizamento: rec.agrupamentoAjuizamento || '',
      processNumber: rec.processNumber || '',
      protocolDate: rec.protocolDate || '',
      distributionDate: rec.distributionDate || '',
      juizo: rec.juizo || '',
      orgaoJustica: rec.orgaoJustica || '',
      dataFalencia: rec.dataFalencia || '',
      pfnInscricao: rec.pfnInscricao || '',
      pfnResponsavel: rec.pfnResponsavel || '',
      orgaoOrigem: rec.orgaoOrigem || '',
      autoInfracao: rec.autoInfracao || '',
      devolucaoArquivamento: rec.devolucaoArquivamento || '',
      imovelCib: rec.imovelCib || '',
      imovelRip: rec.imovelRip || '',
      dataExtincao: rec.dataExtincao || '',
      motivoSuspensao: rec.motivoSuspensao || '',
      motivoExtincao: rec.motivoExtincao || '',
      bloqueioAjuizamento: rec.bloqueioAjuizamento || '',
      envioAnaliseOrigem: rec.envioAnaliseOrigem || '',
      cadastroNacionalObras: rec.cadastroNacionalObras || '',
    },
    devedores: rec.devedores || [],
    parcelamentos: rec.parcelamentos || [],
    protestos: rec.protestos || [],
    occurrences: rec.occurrences || [],
    pagamentos: rec.pagamentos || [],
    cadin: rec.cadin || [],
    bloqueios: rec.bloqueios || [],
    ajuizamentos: rec.ajuizamentos || [],
    suspensoes: rec.suspensoes || [],
    coresponsibles: rec.coresponsibles || [],
  };
}

export function isSidaCondensedNote(n) {
  const text = typeof n === 'string' ? n : (n && (n.text || n.content)) || '';
  return /\[SIDA\]\s*(Hist[oó]rico|Ocorr[eê]ncias)/i.test(text);
}

/**
 * Eventos de prescrição que o import criaria a partir deste registro.
 * Dedup por (type, date). Pedido AGUARDANDO/indeferido entra como pedido sem deferimento (só interrompe).
 */
export function draftSidaPrescriptionEvents(rec) {
  const out = [];
  const seen = new Set();
  const push = (type, date, source, line) => {
    if (!date) return;
    const key = `${type}|${date}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ type, date, source, line });
  };
  for (const parc of rec.parcelamentos || []) {
    if (!shouldEmitSidaParcelamentoEvents(parc)) {
      if (sidaPedidoSemDeferimento(parc)) {
        push('int_pedido_parcelamento', parc.adesao, 'parcelamento', `Pedido sem deferimento ${parc.adesao} · ${parc.tipo || parc.modalidade || ''} · ${parc.situacao || ''}`);
      }
      continue;
    }
    if (parc.adesao) {
      push('susp_parcelamento', parc.adesao, 'parcelamento', `Adesão ${parc.adesao} · ${parc.tipo || parc.modalidade || ''} · ${parc.situacao || ''}`);
    }
    if (parc.encerramento) {
      push('int_rescisao_parcelamento', parc.encerramento, 'parcelamento', `Encerramento ${parc.encerramento} · ${parc.situacao || ''} · ${parc.tipo || ''}`);
    }
  }
  for (const prot of rec.protestos || []) {
    const sit = String(prot.situacao || '').toUpperCase();
    if (!/LAVRADO|REGISTRADO/.test(sit)) continue;
    const lavrado = (prot.eventos || []).find((ev) => /lavrado|registrado|efetivado/i.test(ev.descricao || ''));
    const effectiveDate = (lavrado && (lavrado.dataEfetivacao || lavrado.dataCriacao)) || '';
    if (effectiveDate) {
      push('int_protesto_extrajudicial', effectiveDate, 'protestos', `Protesto ${prot.situacao || ''} · ${prot.identificacao || ''} · ${lavrado ? lavrado.descricao : ''}`.trim());
    }
  }
  const hasStructuredProtesto = (rec.protestos || []).length > 0;
  if (!hasStructuredProtesto) {
    for (const occ of rec.occurrences || []) {
      if (!isSidaProtestoLine(occ.desc)) continue;
      const efet = String(occ.desc || '').match(/Data efetiva[cç][aã]o:\s*(\d{2}\/\d{2}\/\d{4})/i);
      const date = efet ? parseSidaBRDate(efet[1]) : occ.date;
      push('int_protesto_extrajudicial', date, 'ocorrencia', occ.desc);
    }
  }
  if (rec.dataFalencia) {
    push('susp_falencia_decretada', rec.dataFalencia, 'dados_gerais', 'Data de Falência');
  }
  return out;
}

/**
 * @param {string[]} lines linhas do PDF já agrupadas por Y (topo→baixo) e X (esq→dir)
 * @returns {object[]}
 */
export function parseSIDALines(lines) {
  const all = Array.isArray(lines) ? lines.map((l) => String(l || '')) : [];
  const records = [];
  const blockIdx = [];
  for (let i = 0; i < all.length; i++) {
    if (sidaIsBlockStart(all[i])) blockIdx.push(i);
  }
  if (blockIdx.length === 0) {
    const rec = sidaParseOneRecord(all);
    if (rec.cdaNumber) records.push(rec);
    return records;
  }
  for (let b = 0; b < blockIdx.length; b++) {
    const start = blockIdx[b] + 1;
    const end = b + 1 < blockIdx.length ? blockIdx[b + 1] : all.length;
    const rec = sidaParseOneRecord(all.slice(start, end));
    if (rec.cdaNumber) records.push(rec);
  }
  return records;
}
