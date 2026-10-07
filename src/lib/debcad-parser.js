/**
 * Parser puro do relatório PGFN "Resultado de Consulta do Debcad Localizado".
 * Recebe as linhas já agrupadas por Y (extractPDFText / fixture pdf.js) e devolve
 * o mesmo formato que parseDebcadPDF usava, agora com protestos e ajuizamentos.
 */

function foldKey(s) {
  return String(s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDebcadBRDate(s) {
  if (!s) return '';
  const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function parseMoneyNumber(s) {
  const m = String(s || '').match(/R\s*\$\s*([\d.]+,\d{2})/) || String(s || '').match(/([\d.]+,\d{2})/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseMoneyString(s) {
  const m = String(s || '').match(/R\s*\$\s*([\d.]+,\d{2})/) || String(s || '').match(/([\d.]+,\d{2})/);
  if (!m) return '';
  return m[1].replace(/\./g, '').replace(',', '.');
}

function isFooterLine(ln) {
  return /^(P\s*G\s*F\s*N\s*-\s*CONSULTA|SERPRO|P[áa]g\.\s*\d)/i.test(String(ln || '').trim());
}

function isBlockStart(ln) {
  return /^Debcad\s+\d+\s*\/\s*\d+$/i.test(String(ln || '').trim());
}

function isReportEnd(ln) {
  return /^FIM DO RELATORIO/.test(foldKey(ln));
}

function sectionOf(ln) {
  const k = foldKey(ln);
  if (k === 'HISTORICO') return 'historico';
  if (k === 'AJUIZAMENTO' || k === 'AJUIZAMENTOS') return 'ajuizamento';
  if (k === 'ATUALIZACOES') return 'atualizacoes';
  if (k === 'PROTESTOS') return 'protestos';
  if (k === 'DADOS GERAIS' || k === 'DADOS GERAIS DO DEBCAD') return 'dados';
  return null;
}

function isTableHeader(ln) {
  const k = foldKey(ln).replace(/\s+/g, ' ');
  const compact = k.replace(/\s/g, '');
  if (/^CODIGO\/NOME/.test(compact)) return true;
  if (/^DATAHORAFUN/.test(compact)) return true;
  if (/^FASEINFORMACAO/.test(compact)) return true;
  if (k === 'OCORRENCIAS DO PROTESTO' || compact === 'OCORRENCIASDOPROTESTO') return true;
  if (/^DATADESCRICAODOEVENTO/.test(compact)) return true;
  return false;
}

function valueAfterColon(ln) {
  const idx = String(ln || '').indexOf(':');
  if (idx < 0) return '';
  return String(ln).slice(idx + 1).trim();
}

function labelCompact(ln) {
  const left = String(ln || '').split(':')[0];
  return foldKey(left).replace(/\s+/g, '');
}

function meaningful(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (t === '0' || t === '-' || t === '—' || t === 'N/I') return '';
  return t;
}

function emptyRecord() {
  return {
    history: [],
    updates: [],
    protestos: [],
    ajuizamentos: [],
    parcelamentos: [],
    indicacoesParcelamento: [],
  };
}

function parseDados(rec, lines) {
  for (const ln of lines) {
    const lab = labelCompact(ln);
    const val = valueAfterColon(ln);
    if (lab === 'DEVEDORPRINCIPAL') rec.devedor = val;
    else if (lab === 'CPF/CNPJ' || lab === 'CNPJ' || lab === 'CPF') rec.cnpj = val.replace(/\D/g, '');
    else if (lab === 'DEBCAD' && !rec.cdaNumber) rec.cdaNumber = val.replace(/\s/g, '');
    else if (lab === 'SITUACAO' && !rec.situation) rec.situation = val;
    else if (lab === 'DATAINSCRICAO') rec.inscriptionDate = parseDebcadBRDate(val);
    else if (lab === 'PERIODODADIVIDA') rec.periodo = val;
    else if (lab === 'NATUREZADADIVIDA') rec.natureza = val;
    else if (lab === 'RECEITA') rec.receita = val;
    else if (lab === 'SISTEMADEORIGEM') rec.sistemaOrigem = val;
    else if (lab === 'ORGAODEORIGEM') rec.orgaoOrigem = val;
    else if (lab === 'VALORPRINCIPAL') {
      const n = parseMoneyNumber(val || ln);
      if (n != null) rec.valueInscrito = n;
    } else if (lab === 'VALORTOTAL') {
      const n = parseMoneyNumber(val || ln);
      if (n != null) rec.valueTotal = n;
    } else if (lab === 'NºJUDICIAL' || lab === 'NOJUDICIAL') rec.processNumber = meaningful(val);
    else if (lab === 'DATADEPROTOCOLO') rec.protocolDate = parseDebcadBRDate(val);
    else if (lab === 'JUIZO') rec.juizo = meaningful(val);
    else if (lab === 'FORMADECONSTITUICAO') rec.formaConstituicao = val;
    else if (lab === 'DOCUMENTODEORIGEM') rec.docOrigem = val;
    else if (lab === 'DATADODOCUMENTODEORIGEM') rec.dataDocumentoOrigem = parseDebcadBRDate(val);
  }
}

function parseHistorico(historyLines) {
  const recHistory = [];
  if (!historyLines.length) return recHistory;
  const joined = historyLines.join(' ').replace(/\s+/g, ' ');

  const segments = [];
  const codeSplitRegex = /\b(\d{3})\s*-\s*/g;
  const codePositions = [];
  let csm;
  while ((csm = codeSplitRegex.exec(joined)) !== null) {
    codePositions.push({ code: csm[1], idx: csm.index, endIdx: csm.index + csm[0].length });
  }
  for (let ci = 0; ci < codePositions.length; ci++) {
    const cp = codePositions[ci];
    const nextIdx = ci + 1 < codePositions.length ? codePositions[ci + 1].idx : joined.length;
    const segText = joined.slice(cp.endIdx, nextIdx).trim();
    segments.push({ code: cp.code, text: segText });
  }

  for (const seg of segments) {
    const dates = [];
    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
    let dm;
    while ((dm = dateRegex.exec(seg.text)) !== null) dates.push(dm[1]);
    if (dates.length === 0) continue;

    const timeMatch = seg.text.match(/(\d{2}:\d{2}:\d{2})/);
    const funcMatch = seg.text.match(/\b([A-Z][A-Z0-9_]{3,}(?:\/[A-Z0-9_]+)?)\b/);
    const descWords = seg.text
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
      .replace(/\d{2}:\d{2}:\d{2}/g, '')
      .replace(/\b[A-Z][A-Z0-9_]{3,}(?:\/[A-Z0-9_]+)?\b/g, (m) => {
        const knownFunctions = ['AACAOJUD', 'CDACAOJUD', 'AACAOMIGRADA', 'AFASE', 'ADEBINS', 'ADEB', 'COBBATWEB', 'COBBATGEN', 'COBDEVINC', 'COBCBCBPA', 'PDAPCBD', 'DIVBATJUD', 'DIVBATATL', 'DIVCDI', 'DAPBDP', 'ACONPAR', 'ARESPAR', 'ACANRES', 'NAOIDENTIFICADO'];
        if (knownFunctions.some((f) => m.startsWith(f))) return '';
        if (m.startsWith('SERIS_') || m.startsWith('COB') || m.startsWith('DIV') || m.startsWith('SIDAT_')) return '';
        return m;
      })
      .replace(/\s+/g, ' ')
      .trim();

    let fullDesc = descWords;
    const codeDescMap = {
      '520': 'INSCRICAO DE CREDITO EM DIVIDA ATIVA',
      '535': 'AJUIZAMENTO / DISTRIBUICAO',
      '551': 'SIDAT - BLOQUEADO PARA COBRANCA',
      '731': 'NEGOCIADO NO SISPAR',
      '733': 'EM NEGOCIACAO NO SISPAR',
      '760': 'PRE-PARCELAMENTO',
      '770': 'OPCAO REFIS / EXIGIBILIDADE SUSPENSA',
      '775': 'INCLUSAO EM PARCELAMENTO ESPECIAL LEI 11.941',
      '779': 'INCLUIDO EM PARCELAMENTO SIMPLIFICADO LEI 10.522',
      '792': 'RESCISAO/EXCLUSAO DE PARCELAMENTOS ESPECIAIS',
      '797': 'PARCELAMENTO RESCINDIDO',
      '518': 'PRE-INSCRICAO DE CREDITO',
      '514': 'PRE-INSCRICAO DE CREDITO DE LDCG/DCG',
    };
    if (!fullDesc || fullDesc.length < 3) fullDesc = codeDescMap[seg.code] || `Fase ${seg.code}`;

    const obsText = seg.text
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
      .replace(/\d{2}:\d{2}:\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const obs = obsText.length > 5 ? obsText : '';

    recHistory.push({
      code: seg.code,
      desc: fullDesc,
      date: parseDebcadBRDate(dates[0]),
      dateInfo: dates.length > 1 ? parseDebcadBRDate(dates[1]) : parseDebcadBRDate(dates[0]),
      funcao: funcMatch ? funcMatch[1] : '',
      obs,
    });
  }

  if (recHistory.length === 0) {
    const simpleRegex = /(\d{3})\s*-\s*(.+?)\s+(\d{2}\/\d{2}\/\d{4})/g;
    let sm;
    while ((sm = simpleRegex.exec(joined)) !== null) {
      recHistory.push({ code: sm[1], desc: sm[2].trim().replace(/\s+/g, ' '), date: parseDebcadBRDate(sm[3]) });
    }
  }
  return recHistory;
}

function parseAtualizacoes(updateLines) {
  const updates = [];
  if (!updateLines.length) return updates;
  const joinedUpd = updateLines.join(' ').replace(/\s+/g, ' ');
  const updRegex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+(.*?)(?=\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}|$)/g;
  let um;
  while ((um = updRegex.exec(joinedUpd)) !== null) {
    const obsRaw = um[4].trim();
    const matMatch = obsRaw.match(/^(\d{5,20})\s+(.*)/);
    updates.push({
      date: parseDebcadBRDate(um[1]),
      time: um[2],
      funcao: um[3].trim(),
      matricula: matMatch ? matMatch[1] : '',
      obs: matMatch ? matMatch[2].trim() : obsRaw,
    });
  }
  return updates;
}

const PROT_NEXT = '(?=Identifica(?:c|ç)(?:a|ã)o do Protesto\\s*:|Protocolo no Tabelionato\\s*:|Data do Protocolo\\s*:|Tabelionato Respons|Situa(?:c|ç)(?:a|ã)o do Protesto\\s*:|Valor do Protesto\\s*:|Ocorr(?:e|ê)ncias do Protesto|$)';

function captureLabeled(text, labelRe) {
  const re = new RegExp(labelRe.source + '\\s*(.*?)' + PROT_NEXT, labelRe.flags.includes('i') ? 'i' : '');
  const m = String(text || '').match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function parseEventChunk(chunk) {
  const dates = [];
  const dateRe = /(\d{2}\/\d{2}\/\d{4})/g;
  let dm;
  while ((dm = dateRe.exec(chunk)) !== null) dates.push(dm[1]);
  let desc = String(chunk || '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, ' ')
    .replace(/\d{2}:\d{2}:\d{2}/g, ' ')
    .replace(/\b\d{8,}\b/g, ' ')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, ' ')
    .replace(/\s[-–]\s/g, ' ')
    .replace(/(?:^|\s)\d(?:\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    dataCriacao: dates[0] ? parseDebcadBRDate(dates[0]) : '',
    dataEfetivacao: dates[1] ? parseDebcadBRDate(dates[1]) : '',
    descricao: desc,
  };
}

function parseProtestoEventos(block) {
  const occIdx = String(block).search(/Ocorr[eê]ncias do Protesto/i);
  const region = occIdx >= 0 ? String(block).slice(occIdx) : String(block);
  const cleaned = region
    .replace(/Ocorr[eê]ncias do Protesto/ig, ' ')
    .replace(/Data\s+Descri[cç][aã]o Do Evento\s+Efetiva[cç][aã]o\s+Usu[aá]rio\s+IP\s+Motivo/ig, ' ')
    .replace(/\s+/g, ' ');
  const starts = [];
  const re = /(\d{2}\/\d{2}\/\d{4})\s+(?=[A-Za-zÀ-ÿ(])/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    starts.push(m.index);
  }
  const eventos = [];
  for (let i = 0; i < starts.length; i++) {
    const chunk = cleaned.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : cleaned.length);
    const ev = parseEventChunk(chunk);
    if (ev.dataCriacao || ev.descricao) eventos.push(ev);
  }
  return eventos;
}

function parseProtestos(lines) {
  const joined = lines.join(' ').replace(/\s+/g, ' ').trim();
  if (!joined) return [];
  if (/NAO POSSUI PROTESTO/.test(foldKey(joined))) return [];
  const parts = joined.split(/Identifica[cç][aã]o do Protesto\s*:/i);
  const out = [];
  for (let i = 1; i < parts.length; i++) {
    const block = 'Identificação do Protesto: ' + parts[i];
    const prot = {
      identificacao: captureLabeled(block, /Identifica[cç][aã]o do Protesto\s*:/i),
      protocolo: captureLabeled(block, /Protocolo no Tabelionato\s*:/i),
      dataProtocolo: parseDebcadBRDate(captureLabeled(block, /Data do Protocolo\s*:/i)),
      tabelionato: captureLabeled(block, /Tabelionato Respons[aá]vel\s*:/i),
      situacao: captureLabeled(block, /Situa[cç][aã]o do Protesto\s*:/i),
      valor: parseMoneyString(captureLabeled(block, /Valor do Protesto\s*:/i)),
      eventos: parseProtestoEventos(block),
    };
    if (prot.identificacao || prot.situacao || (prot.eventos && prot.eventos.length)) out.push(prot);
  }
  return out;
}

function parseAjuizamentos(lines) {
  const joined = lines.join(' ').replace(/\s+/g, ' ').trim();
  if (!joined) return [];
  if (/NAO HA AJUIZAMENTO/.test(foldKey(joined))) return [];
  const nJudM = joined.match(/N[ºo°]\s*Judicial\s*:\s*(.*?)(?=Data de Protocolo|Ju[ií]zo|$)/i);
  const protM = joined.match(/Data de Protocolo\s*:\s*(.*?)(?=Ju[ií]zo|N[ºo°]\s*Judicial|$)/i);
  const juizoM = joined.match(/Ju[ií]zo\s*:\s*(.*?)(?=N[ºo°]\s*Judicial|Data de Protocolo|$)/i);
  const nJud = meaningful(nJudM ? nJudM[1] : '');
  const protVal = parseDebcadBRDate(protM ? protM[1] : '');
  const juizo = meaningful(juizoM ? juizoM[1] : '');
  if (!nJud && !protVal && !juizo) {
    const cnj = joined.match(/\b(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}|\d{20})\b/);
    if (cnj) return [{ processNumber: cnj[1], protocolDate: '', juizo: '', raw: joined }];
    return [];
  }
  return [{ processNumber: nJud, protocolDate: protVal, juizo, raw: joined }];
}

/**
 * Classifica a fase pelo status, não por palavra-chave solta.
 * - indicacao: "INDICADO P/INCLUSÃO" ou fase 760 (pré-parcelamento). Indício, sem adesão: não interrompe.
 * - nao_inclusao: "NÃO INCLUÍDO" encerra a indicação.
 * - adesao: inclusão, opção, negociação no SISPAR (ato do devedor).
 * - rescisao: rescisão ou exclusão do parcelamento.
 */
export function classifyDebcadPhase(h) {
  if (!h) return null;
  const txt = foldKey(`${h.desc || ''} ${h.obs || ''}`);
  if (/\bN[AÃ]O\s*INCLU/.test(txt)) return 'nao_inclusao';
  // Linha de Atualizações: só a não inclusão interessa (encerra a indicação).
  if (h.code === '999') return null;
  if (h.code === '760' || /INDICAD[OA]\s*P\s*\/?\s*INCLUS/.test(txt) || /PRE\s*-?\s*PARCELAMENTO/.test(txt)) return 'indicacao';
  if (h.code === '797' || h.code === '792') return 'rescisao';
  if (h.code === '731') return 'reativacao';
  if (['733', '779', '770', '775'].includes(h.code)) return 'adesao';
  return null;
}

/**
 * Parcelamentos e indicações a partir do histórico.
 * Data do fato = "Data Fase" (1ª coluna de data); a "Data Informação" é só o registro.
 * Cada parcelamento termina pelo próprio evento (rescisão ou exclusão). Uma nova adesão
 * não encerra a anterior: sem rescisão no relatório, o encerramento fica em aberto.
 */
function buildParcelamentosEIndicacoes(history, updates = []) {
  const out = { parcelamentos: [], indicacoes: [] };
  if (!history.length) return out;
  const fato = (h) => h.date || h.dateInfo || '';
  const registro = (h) => h.dateInfo || h.date || '';
  const naoInclusaoUpd = (updates || [])
    .filter((u) => u && u.date && /\bN[AÃ]O\s*INCLU/.test(foldKey(u.obs)))
    .map((u) => ({ code: '999', desc: u.obs, obs: u.obs, date: u.date, dateInfo: u.date }));
  const sortedHist = [...history, ...naoInclusaoUpd]
    .filter((h) => h.code !== '999' || classifyDebcadPhase(h) === 'nao_inclusao')
    .sort((a, b) => fato(a).localeCompare(fato(b)) || registro(a).localeCompare(registro(b)));
  let cur = null;
  let ind = null;
  for (const h of sortedHist) {
    const kind = classifyDebcadPhase(h);
    if (kind === 'indicacao') {
      if (ind && ind.data === fato(h)) continue;
      if (ind) out.indicacoes.push(ind);
      ind = { data: fato(h), registro: registro(h), desc: h.desc, tipo: `Fase ${h.code}`, situacao: 'Sem desfecho no relatório', obs: h.obs || '' };
    } else if (kind === 'nao_inclusao') {
      if (ind) {
        ind.encerramento = fato(h);
        ind.encerramentoRegistro = registro(h);
        ind.situacao = 'Não incluído';
        ind.encerramentoDesc = h.desc || h.obs || '';
        out.indicacoes.push(ind);
        ind = null;
      }
    } else if (kind === 'adesao') {
      if (cur && cur.adesao === fato(h)) continue;
      if (cur) {
        cur.situacao = 'Encerramento não informado';
        out.parcelamentos.push(cur);
      }
      cur = { adesao: fato(h), adesaoRegistro: registro(h), modalidade: h.desc, tipo: `Fase ${h.code}`, situacao: 'Em vigor', obs: h.obs || '' };
    } else if (kind === 'reativacao') {
      if (!cur) {
        cur = { adesao: fato(h), adesaoRegistro: registro(h), modalidade: h.desc, tipo: 'Fase 731 (reativação)', situacao: 'Em vigor', obs: h.obs || '' };
      } else {
        cur.deferimento = fato(h);
      }
    } else if (kind === 'rescisao') {
      if (cur) {
        cur.encerramento = fato(h);
        cur.encerramentoRegistro = registro(h);
        cur.situacao = h.obs?.includes('C PAG') ? 'Rescindido c/ pagamento' : h.obs?.includes('S PAG') || h.obs?.includes('S/PAG') ? 'Rescindido s/ pagamento' : 'Rescindido';
        out.parcelamentos.push(cur);
        cur = null;
      }
    }
  }
  if (cur) out.parcelamentos.push(cur);
  if (ind) out.indicacoes.push(ind);
  return out;
}

function mergeUpdatesIntoHistory(rec) {
  const histDates = new Set(rec.history.map((h) => h.date));
  rec.updates.forEach((u) => {
    if (u.obs && !histDates.has(u.date)) {
      rec.history.push({
        code: '999',
        desc: `[Atualização] ${u.funcao}`,
        date: u.date,
        funcao: u.funcao,
        obs: u.obs,
        source: 'atualizacoes',
      });
    }
  });
}

function parseOneRecord(lines) {
  const rec = emptyRecord();
  let section = 'dados';
  const buckets = {
    dados: [],
    historico: [],
    ajuizamento: [],
    atualizacoes: [],
    protestos: [],
  };
  for (const raw of lines) {
    const ln = String(raw || '');
    if (isReportEnd(ln)) break;
    if (isFooterLine(ln)) continue;
    const sec = sectionOf(ln);
    if (sec) {
      section = sec;
      continue;
    }
    if (isTableHeader(ln)) continue;
    if (buckets[section]) buckets[section].push(ln);
  }
  parseDados(rec, buckets.dados);
  rec.history = parseHistorico(buckets.historico);
  rec.updates = parseAtualizacoes(buckets.atualizacoes);
  rec.protestos = parseProtestos(buckets.protestos);
  rec.ajuizamentos = parseAjuizamentos(buckets.ajuizamento);
  mergeUpdatesIntoHistory(rec);
  const parc = buildParcelamentosEIndicacoes(rec.history, rec.updates);
  rec.parcelamentos = parc.parcelamentos;
  rec.indicacoesParcelamento = parc.indicacoes;
  return rec;
}

/**
 * @param {string[]} lines linhas do PDF já agrupadas por Y (topo→baixo) e X (esq→dir)
 * @returns {object[]}
 */
export function parseDebcadLines(lines) {
  const all = Array.isArray(lines) ? lines.map((l) => String(l || '')) : [];
  const records = [];
  const blockIdx = [];
  for (let i = 0; i < all.length; i++) {
    if (isBlockStart(all[i])) blockIdx.push(i);
  }
  if (blockIdx.length === 0) {
    const rec = parseOneRecord(all);
    if (rec.cdaNumber) records.push(rec);
    return records;
  }
  for (let b = 0; b < blockIdx.length; b++) {
    const start = blockIdx[b] + 1;
    const end = b + 1 < blockIdx.length ? blockIdx[b + 1] : all.length;
    const rec = parseOneRecord(all.slice(start, end));
    if (rec.cdaNumber) records.push(rec);
  }
  return records;
}
