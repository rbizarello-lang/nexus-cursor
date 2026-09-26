/**
 * Motor único de prescrição.
 * Modo originário (CDA não ajuizada, art. 174) e modo intercorrente (art. 40 da LEF).
 * Sem React. Anos civis. Retroação ao pedido quando a constrição efetiva é verificada.
 */
import {
  addCalendarDays,
  addCalendarYears,
  daysBetween,
  daysUntil,
  fmtDate,
  localIso,
  normProc,
  sameProc,
  toDayKey,
} from './dates.js';
import { engineMoreGraveThanDecision } from './presc-import.js';

export const PRESC_EVENT_TYPES = {
  marco_nao_localizacao: { label: 'Não localização do devedor', category: 'marco', color: 'var(--red)', desc: 'Ciência pela FP da não localização do devedor (art. 40, §1º LEF). Inicia automaticamente 1 ano de suspensão.' },
  marco_sem_bens: { label: 'Ausência de bens penhoráveis', category: 'marco', color: 'var(--red)', desc: 'Ciência pela FP da inexistência de bens penhoráveis. Inicia automaticamente 1 ano de suspensão (Tema 566).' },
  marco_insuficiencia_bens: { label: 'Insuficiência de bens penhoráveis', category: 'marco', color: 'var(--red)', desc: 'Aplicação analógica — insuficiência equiparada à inexistência (STJ).' },
  int_citacao: { label: 'Citação do devedor', category: 'interruptiva', color: 'var(--green)', desc: 'Citação válida interrompe prescrição (art. 174, p.ú., I CTN).' },
  int_penhora: { label: 'Penhora efetiva', category: 'interruptiva', color: 'var(--green)', desc: 'Efetiva constrição patrimonial. Mero peticionamento NÃO basta (Tema 568). O efeito retroage à data do pedido (4ª tese Tema 566).' },
  int_arresto: { label: 'Arresto / Bloqueio de bens', category: 'interruptiva', color: 'var(--green)', desc: 'Arresto ou bloqueio com resultado positivo (Tema 568 + AREsp 2.619.243/PE). Retroage à data do pedido.' },
  int_sisbajud: { label: 'Bloqueio via Sisbajud', category: 'interruptiva', color: 'var(--green)', desc: 'Constrição via Sisbajud com resultado positivo. Retroage à data do pedido se este entrou na janela de 1+5 anos.' },
  int_cnib: { label: 'Indisponibilidade CNIB/CCS', category: 'interruptiva', color: 'var(--green)', desc: 'Decretação de indisponibilidade com resultado útil. Na própria EF, interrompe. Via IDPJ/MCF, vale como interrupção das EFs abrangidas desde o pedido.' },
  int_reconhecimento: { label: 'Reconhecimento da dívida', category: 'interruptiva', color: 'var(--green)', desc: 'Ato inequívoco do devedor reconhecendo a dívida (art. 174, p.ú., IV CTN). Lançado por você quando julgar que o ato interrompe: vale na ordinária e na intercorrente (reinicia 5 anos).' },
  int_despacho_citacao: { label: 'Despacho que ordena citação', category: 'interruptiva', color: 'var(--green)', desc: 'Despacho do juiz que ordena citação (art. 174, p.ú., I CTN — LC 118/2005).' },
  int_protesto_judicial: { label: 'Protesto judicial', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto judicial (art. 174, p.ú., II CTN).' },
  int_protesto_extrajudicial: { label: 'Protesto extrajudicial da CDA', category: 'interruptiva', color: 'var(--green)', desc: 'Protesto extrajudicial da CDA (art. 174, p.ú., CTN, LC 208/2024). Só interrompe se lavrado a partir de 03/07/2024. Data: registro no cartório.' },
  int_outra: { label: 'Outra causa interruptiva', category: 'interruptiva', color: 'var(--green)', desc: 'Outra causa interruptiva que você declara, com fundamentação. Vale na ordinária e na intercorrente (reinicia 5 anos).' },
  int_pedido_parcelamento: { label: 'Pedido de parcelamento sem deferimento', category: 'interruptiva', color: 'var(--green)', desc: 'Pedido aguardando análise ou indeferido. Interrompe na data do pedido, sem pausa (Súmula 653/STJ).' },
  susp_parcelamento: { label: 'Parcelamento (efeito duplo)', category: 'suspensiva', color: 'var(--blue)', desc: 'Pedido/adesão interrompe (art. 174, p.ú., IV CTN; Súmula 653; TRF4) e suspende a exigibilidade enquanto vigente (art. 151, VI). Na intercorrente, após a rescisão conta-se 1 ano + 5 anos (modo 1+5, por equiparação ao art. 40 / Tema 566).' },
  susp_transacao: { label: 'Transação (adesão)', category: 'suspensiva', color: 'var(--blue)', desc: 'Adesão à transação. Mesmo efeito do parcelamento: interrompe e suspende enquanto vigente.' },
  int_rescisao_parcelamento: { label: 'Rescisão de parcelamento ou transação', category: 'interruptiva', color: 'var(--red)', desc: 'Fim da vigência. Data cedo: inadimplemento + 5 anos (sem o inadimplemento, a rescisão). Data tarde: rescisão + 1 ano + 5 anos na intercorrente (política da casa) e rescisão + 5 anos na ordinária.' },
  susp_embargos: { label: 'Embargos com efeito suspensivo', category: 'suspensiva', color: 'var(--blue)', desc: 'Embargos à execução recebidos com efeito suspensivo.' },
  susp_decisao_judicial: { label: 'Decisão judicial suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Liminar, tutela antecipada ou decisão judicial que suspende a exigibilidade.' },
  susp_deposito: { label: 'Depósito judicial integral', category: 'suspensiva', color: 'var(--blue)', desc: 'Depósito integral suspende exigibilidade (art. 151, II CTN).' },
  susp_falencia: { label: 'Recuperação judicial', category: 'info', color: 'var(--text-muted)', desc: 'Registro. A recuperação judicial não suspende a execução fiscal nem a prescrição (Lei 11.101, art. 6º, §7º-B). Eventos antigos “Falência / Recuperação” valem como este até você reclassificar.' },
  susp_falencia_decretada: { label: 'Falência decretada', category: 'suspensiva', color: 'var(--blue)', desc: 'Pausa só na leitura favorável (data tarde). A data cedo ignora a pausa.' },
  susp_art40: { label: 'Suspensão art. 40 LEF (1 ano)', category: 'suspensiva', color: 'var(--blue)', desc: 'Registro informativo do ano automático. O marco já inicia a suspensão — não soma um segundo ano.' },
  susp_idpj_mcf_constricao: { label: 'Constrição via IDPJ / Cautelar fiscal', category: 'suspensiva', color: 'var(--blue)', desc: 'Constrição efetiva no incidente (indisponibilidade/tutela). Vale como interrupção das EFs abrangidas, igual a uma penhora, desde a data do pedido (tese fazendária, não pacificada). Aos 5 anos da constrição, o card do processo pede esclarecimento; a fila geral não alarma.' },
  susp_idpj_mcf: { label: 'Suspensão da execução (IDPJ / Cautelar)', category: 'suspensiva', color: 'var(--blue)', desc: 'A execução ficou suspensa por IDPJ ou cautelar, mesmo sem constrição. Não interrompe o ciclo. A prescrição intercorrente pausa até o fim do incidente.' },
  susp_outra: { label: 'Outra causa suspensiva', category: 'suspensiva', color: 'var(--blue)', desc: 'Outra causa suspensiva com fundamentação.' },
  info_peticao_sem_resultado: { label: 'Petição sem resultado útil', category: 'info', color: 'var(--text-muted)', desc: 'Mero peticionamento. NÃO interrompe (Tema 568).' },
  info_arquivamento: { label: 'Arquivamento (art. 40, §3º)', category: 'info', color: 'var(--text-muted)', desc: 'Arquivamento provisório após 1 ano de suspensão.' },
  info_desarquivamento: { label: 'Desarquivamento', category: 'info', color: 'var(--text-muted)', desc: 'Desarquivamento do feito.' },
  info_decisao_prescricao: { label: 'Decisão sobre prescrição', category: 'info', color: 'var(--text-muted)', desc: 'Decisão judicial relacionada à prescrição intercorrente.' },
  info_dissolucao_irregular: { label: 'Dissolução irregular (indício)', category: 'info', color: 'var(--text-muted)', desc: 'Certidão ou ato que indica dissolução irregular da empresa. Usado no prazo informativo de redirecionamento (Tema 444/STJ).' },
  info_pedido_redirecionamento: { label: 'Pedido de redirecionamento', category: 'info', color: 'var(--text-muted)', desc: 'Pedido de redirecionamento ao sócio ou responsável. Informativo.' },
  info_outro: { label: 'Outro evento', category: 'info', color: 'var(--text-muted)', desc: 'Registro informativo sem efeito no cômputo.' }
};

/**
 * Cadastro simplificado: 7 famílias. O motor continua lendo os tipos antigos
 * (eventos já gravados não se perdem). A família só escolhe o tipo concreto.
 */
export const PRESC_EVENT_FAMILIES = [
  {
    id: 'marco',
    label: 'Marco do art. 40 — ciência',
    desc: 'A Fazenda tomou ciência de que não achou o devedor ou bens. Só isso inicia o ciclo de 1 ano + 5 anos.',
    variants: [
      { type: 'marco_sem_bens', label: 'Não achou bens' },
      { type: 'marco_nao_localizacao', label: 'Não achou o devedor' },
      { type: 'marco_insuficiencia_bens', label: 'Bens insuficientes (analogia)' }
    ]
  },
  {
    id: 'resultado_util',
    label: 'Resultado útil — interrompe o art. 40',
    desc: 'Citação ou constrição com resultado. Pedido sem êxito não basta. Retroage à data do pedido se este entrou na janela de 1 ano + 5 anos.',
    variants: [
      { type: 'int_citacao', label: 'Citação efetiva' },
      { type: 'int_penhora', label: 'Penhora' },
      { type: 'int_sisbajud', label: 'Sisbajud positivo' },
      { type: 'int_arresto', label: 'Arresto / bloqueio' },
      { type: 'int_cnib', label: 'CNIB / CCS na própria EF' }
    ]
  },
  {
    id: 'parcelamento',
    label: 'Parcelamento',
    desc: 'Adesão interrompe e suspende. Enquanto vigente, fica fora do alarme e volta à mesa 90 dias antes da data cedo (última conferência + 5 anos). Pedido sem deferimento só interrompe. Rescisão: cedo pelo inadimplemento, tarde pela rescisão.',
    variants: [
      { type: 'susp_parcelamento', label: 'Adesão (parcelamento)' },
      { type: 'susp_transacao', label: 'Adesão (transação)' },
      { type: 'int_pedido_parcelamento', label: 'Pedido sem deferimento' },
      { type: 'int_rescisao_parcelamento', label: 'Rescisão / encerramento' }
    ]
  },
  {
    id: 'pausa',
    label: 'Pausa da exigibilidade (art. 151)',
    desc: 'O relógio para e depois retoma. Não zera o ciclo do art. 40.',
    variants: [
      { type: 'susp_embargos', label: 'Embargos com efeito suspensivo' },
      { type: 'susp_decisao_judicial', label: 'Liminar / decisão suspensiva' },
      { type: 'susp_deposito', label: 'Depósito integral' },
      { type: 'susp_falencia_decretada', label: 'Falência decretada' },
      { type: 'susp_outra', label: 'Outra causa' }
    ]
  },
  {
    id: 'idpj',
    label: 'IDPJ / Cautelar',
    desc: 'Constrição no incidente vale como interrupção das execuções abrangidas, desde o pedido. Suspensão da execução (mesmo sem constrição) pausa a intercorrente até o fim do incidente.',
    variants: [
      { type: 'susp_idpj_mcf_constricao', label: 'Constrição no incidente' },
      { type: 'susp_idpj_mcf', label: 'Suspensão da execução (sem constrição)' }
    ]
  },
  {
    id: 'art174',
    label: 'Outras causas do art. 174',
    desc: 'Valem na prescrição ordinária. Reconhecimento e outra causa que você declarar também interrompem a intercorrente (reinicia 5 anos). Despacho e protestos não encerram o ciclo de 1 ano + 5 anos.',
    variants: [
      { type: 'int_despacho_citacao', label: 'Despacho que ordena citação' },
      { type: 'int_reconhecimento', label: 'Reconhecimento da dívida' },
      { type: 'int_protesto_judicial', label: 'Protesto judicial' },
      { type: 'int_protesto_extrajudicial', label: 'Protesto extrajudicial da CDA' },
      { type: 'int_outra', label: 'Outra (com nota)' }
    ]
  },
  {
    id: 'situacao',
    label: 'Situação do feito',
    desc: 'Arquivamento datado limita o prazo. Suspensão art. 40 com data, sem ciência lançada, vale como ciência com aviso.',
    variants: [
      { type: 'info_arquivamento', label: 'Arquivamento art. 40' },
      { type: 'susp_art40', label: 'Suspensão art. 40 (1 ano) — com data' },
      { type: 'info_peticao_sem_resultado', label: 'Pedido ainda sem resultado' },
      { type: 'info_desarquivamento', label: 'Desarquivamento' },
      { type: 'info_decisao_prescricao', label: 'Decisão sobre prescrição' },
      { type: 'susp_falencia', label: 'Recuperação judicial (não suspende)' },
      { type: 'info_dissolucao_irregular', label: 'Dissolução irregular (indício)' },
      { type: 'info_pedido_redirecionamento', label: 'Pedido de redirecionamento' },
      { type: 'info_outro', label: 'Outro registro' }
    ]
  }
];

export function familyOfPrescEvent(type) {
  const t = type === 'int_citacao_devedor' ? 'int_citacao' : type;
  return PRESC_EVENT_FAMILIES.find(f => f.variants.some(v => v.type === t)) || null;
}

export const PARC_RESTART_ONE_PLUS_FIVE = '1+5';
export const PARC_RESTART_FIVE_ONLY = '5';
export const RULE_VERSION = '2026.10';

/** Constrição na própria EF: interrompe a intercorrente. */
export const EF_CONSTRICTION_TYPES = new Set(['int_penhora', 'int_arresto', 'int_sisbajud', 'int_cnib']);
/** Alias legado — tratado como int_citacao. */
export const CITACAO_ALIASES = new Set(['int_citacao', 'int_citacao_devedor']);

export const IDPJ_CONSTRICTION_TYPE = 'susp_idpj_mcf_constricao';
export const IDPJ_STAY_TYPE = 'susp_idpj_mcf';

export const normalizePrescEventType = (type) => (type === 'int_citacao_devedor' ? 'int_citacao' : type);

/** Tipos com duas datas: pedido (retroação) e efetivação. */
export function eventNeedsRequestDate(type) {
  const t = normalizePrescEventType(type);
  return EF_CONSTRICTION_TYPES.has(t) || t === IDPJ_CONSTRICTION_TYPE || CITACAO_ALIASES.has(t);
}

/** Se o pedido veio vazio, grava igual à efetivação — o formulário não perde a âncora. */
export function fillRequestDate(evt) {
  if (!evt) return evt;
  const type = normalizePrescEventType(evt.type);
  const next = { ...evt, type };
  if (eventNeedsRequestDate(type) && !asIso(next.requestDate) && asIso(next.date)) {
    next.requestDate = asIso(next.date);
  }
  return next;
}

/** Modalidades de lançamento — definem a regra do dies a quo da decadência. */
export const LAUNCH_MODES = {
  homologacao_pagamento: { label: 'Homologação — com pagamento antecipado', rule: '150_4', desc: 'Art. 150, §4º, CTN: decadência conta da data do fato gerador (Tema 163/STJ).' },
  homologacao_sem_pagamento: { label: 'Homologação — sem pagamento nem declaração', rule: '173_1', desc: 'Art. 173, I, CTN: 1º dia do exercício seguinte (Súmula 555/STJ).' },
  oficio: { label: 'Lançamento de ofício / auto de infração', rule: '173_1', desc: 'Art. 173, I, CTN: 1º dia do exercício seguinte àquele em que o lançamento poderia ter sido efetuado.' },
  declarado: { label: 'Declarado pelo contribuinte (DCTF/GFIP/GIA)', rule: 'declarado', desc: 'Súmula 436/STJ: a declaração constitui o crédito — decadência prejudicada; prescrição conta da entrega ou do vencimento, o que for posterior.' },
  vicio_formal: { label: 'Relançamento — anulação por vício formal', rule: '173_2', desc: 'Art. 173, II, CTN: novo quinquênio conta da decisão definitiva que anulou o lançamento.' },
};

/** Heurística: sugere a modalidade a partir do texto do SIDA (Forma de Constituição / Doc. de Origem). */
export function suggestLaunchMode(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return '';
  if (/dctf|gfip|gia\b|dirf|per\/?dcomp|declara|confiss/.test(t)) return 'declarado';
  if (/auto de infra|notifica[çc][ãa]o de lan[çc]amento|lan[çc]amento de of[ií]cio|\bai\b|nfld/.test(t)) return 'oficio';
  return '';
}

const asIso = (v) => toDayKey(v) || '';

/** Vigência da LC 208/2024 — protesto extrajudicial só interrompe a partir desta data. */
export const LC208_VIGENCIA = '2024-07-03';

export function protestoExtrajudicialInterrompe(iso) {
  const d = asIso(iso);
  return !!(d && d >= LC208_VIGENCIA);
}

/** Adesão a parcelamento ou a transação: interrompe e suspende enquanto vigente (mesmo efeito). */
export function isAdesaoType(type) {
  const t = normalizePrescEventType(type);
  return t === 'susp_parcelamento' || t === 'susp_transacao';
}

/** Atos que você declara como interruptivos: valem também na intercorrente (reinicia 5 anos). */
export const DECLARED_INTERRUPT_TYPES = new Set(['int_reconhecimento', 'int_outra']);

/** LC 118/2005: despacho de citação a partir desta data interrompe; antes, só a citação. */
export const LC118_VIGENCIA = '2005-06-09';

/** Prazo para pagamento após a notificação ou a decisão definitiva (Súmula 622/STJ). */
export const PRAZO_PAGAMENTO_PADRAO = 30;

/**
 * Motivos que abrem a faixa entre a data cedo (leitura mais desfavorável, usada no alarme)
 * e a data tarde (tese da União). `dado`: falta um fato; `tese`: divergência de leitura.
 * `alarme: false`: a faixa aparece na ficha, mas não mexe na fila.
 */
export const BAND_MOTIVOS = {
  A1: { kind: 'tese', texto: 'Rescisão: cedo pelo inadimplemento + 5 anos; tarde pela rescisão (+ 1 ano + 5 anos na intercorrente).' },
  A2: { kind: 'tese', texto: 'Pedido de parcelamento sem deferimento: cedo pedido + 5 anos; tarde pedido + 1 ano + 5 anos.' },
  A4: { kind: 'tese', texto: 'Falência: a data cedo não conta a pausa.' },
  A5: { kind: 'dado', texto: 'Pausa sem data de fim: a data cedo presume que acabou na última conferência.' },
  A6: { kind: 'dado', texto: 'Parcelamento vigente: a data cedo presume rescisão logo após a última conferência.' },
  B1: { kind: 'tese', texto: 'Ciência eletrônica: cedo na disponibilização; tarde na abertura ou no 10º dia.' },
  B2: { kind: 'dado', texto: 'Só há a decisão de suspensão do art. 40: a ciência pode ser anterior. Falta a certidão.' },
  B3: { kind: 'dado', texto: 'Só há o arquivamento: cedo arquivamento + 5 anos; tarde + 6 anos. Falta a ciência.' },
  C1: { kind: 'dado', texto: 'Constituição definitiva não informada: cedo pelo vencimento ou período de apuração; tarde pela inscrição.' },
  C1x: { kind: 'dado', incerto: true, texto: 'Constituição definitiva e vencimento não informados: o termo conta da inscrição, o limite mais tardio.' },
  D3: { kind: 'tese', texto: 'Decadência (art. 173, I): cedo no ano seguinte ao fato gerador; tarde no ano seguinte ao vencimento.' }
};

function addMotivo(motivos, code) {
  if (motivos && !motivos.includes(code)) motivos.push(code);
}

/**
 * Constituição definitiva: a data digitada ou a calculada pela modalidade.
 * Declarado: entrega ou vencimento, o que for posterior (Tema 383; Súmula 436).
 * Lançamento de ofício: decisão definitiva ou notificação + prazo de pagamento (Súmula 622).
 * `lowerBound`: limite mínimo quando falta dado (o prazo nunca começa antes dele).
 */
export function constituicaoDefinitiva(debt) {
  const out = { date: '', how: '', lowerBound: '' };
  if (!debt) return out;
  const typed = asIso(debt.constitutionDate);
  if (typed) return { ...out, date: typed, how: 'informada na ficha' };
  const venc = asIso(debt.dueDate);
  const entrega = asIso(debt.declarationDate);
  const periodo = asIso(debt.taxPeriodEnd);
  const mode = debt.launchMode || '';
  if (mode === 'declarado') {
    if (entrega && venc) {
      return { ...out, date: entrega > venc ? entrega : venc, how: 'entrega da declaração ou vencimento, o que for posterior' };
    }
    out.lowerBound = entrega || venc || periodo || '';
    return out;
  }
  const prazo = Number(debt.paymentTermDays) > 0 ? Math.round(Number(debt.paymentTermDays)) : PRAZO_PAGAMENTO_PADRAO;
  const decisao = asIso(debt.finalDecisionDate);
  if (decisao) return { ...out, date: addCalendarDays(decisao, prazo), how: `ciência da decisão definitiva + ${prazo} dias para pagamento` };
  const notif = asIso(debt.assessmentNoticeDate);
  if (notif) return { ...out, date: addCalendarDays(notif, prazo), how: `notificação do lançamento + ${prazo} dias (sem impugnação)` };
  out.lowerBound = venc || entrega || periodo || '';
  return out;
}

function bandPoint(x) {
  if (!x) return null;
  return { diesAdQuem: x.diesAdQuem || null, daysLeft: x.daysLeft != null ? x.daysLeft : null, phase: x.phase || null };
}

/** Faixa cedo–tarde. Nula quando as duas leituras coincidem (selo “calculado”). */
function buildBand(tarde, cedo, motivos) {
  const codes = [...new Set(motivos || [])].filter(c => BAND_MOTIVOS[c]);
  if (!codes.length || !tarde || !cedo) return null;
  const same = (tarde.diesAdQuem || '') === (cedo.diesAdQuem || '') && tarde.phase === cedo.phase;
  const incerto = codes.some(c => BAND_MOTIVOS[c].incerto);
  if (same && !incerto) return null;
  const list = codes.map(c => ({ code: c, ...BAND_MOTIVOS[c] }));
  return {
    cedo: bandPoint(cedo),
    tarde: bandPoint(tarde),
    motivos: list,
    // Faixa mista alarma como tese: a providência processual não espera o dado.
    kind: list.some(m => m.kind === 'tese') ? 'tese' : 'dado',
    alarme: list.some(m => m.alarme !== false)
  };
}

/** Data de alarme: a cedo quando a faixa alarma; senão, o termo calculado. */
export function alarmPoint(r) {
  if (!r) return null;
  if (r.band && r.band.alarme !== false && r.band.cedo) return r.band.cedo;
  return { diesAdQuem: r.diesAdQuem || null, daysLeft: r.daysLeft != null ? r.daysLeft : null, phase: r.phase || null };
}

/** Antecedência dos avisos, em dias, contada da data cedo (resposta E1: 90 dias para tudo). */
export const PRESC_ALERT_WINDOW = 90;

/**
 * Constrição no incidente tratada como interrupção desta execução. Aos 5 anos da informação
 * da constrição, o card do processo pede esclarecimento; a fila geral não recebe alerta.
 */
function idpjConstrictionNotice(r, incidents, asOfIso) {
  if (!r || r.phase !== 'interrompido' || r.interruptVia !== IDPJ_CONSTRICTION_TYPE) return null;
  const informed = asIso(r.interruptEffAt) || asIso(r.interruptAt);
  if (!informed) return null;
  const limitDate = addCalendarYears(informed, 5);
  const daysLeft = daysUntil(limitDate, asOfIso);
  const inc = (incidents || []).find(i => i.id === r.interruptSource) || null;
  const kind = inc && inc.tag === 'cautelar_fiscal' ? 'Cautelar fiscal' : 'IDPJ';
  const num = inc ? (inc.processNumber || inc.id) : '';
  const quando = daysLeft != null && daysLeft <= 0 ? 'Em ' + fmtDate(limitDate) + ' completaram-se' : 'Em ' + fmtDate(limitDate) + ' completam-se';
  return {
    incidentId: r.interruptSource || '',
    incidentNumber: num,
    incidentKind: kind,
    constrictionDate: informed,
    limitDate,
    daysLeft,
    active: daysLeft != null && daysLeft <= PRESC_ALERT_WINDOW,
    text: `${kind}${num ? ' nº ' + num : ''}: constrição informada em ${fmtDate(informed)} e tratada como interrupção desta execução. ${quando} 5 anos sem outro ato aqui. Esclarecer se a constrição alcança esta execução ou lançar a ciência posterior.`
  };
}

/** Penhora ou bloqueio efetivo na própria execução: passados 6 anos da informação, vai à lista própria. */
export const PENHORA_ANTIGA_ANOS = 6;

export function penhoraAntigaInfo(r, asOf) {
  if (!r || r.segment !== 'intercorrente' || r.phase !== 'interrompido') return null;
  const via = normalizePrescEventType(r.interruptVia || '');
  if (!EF_CONSTRICTION_TYPES.has(via)) return null;
  const informed = asIso(r.interruptEffAt) || asIso(r.interruptAt);
  if (!informed) return null;
  const asOfIso = asIso(asOf) || localIso(new Date());
  const limitDate = addCalendarYears(informed, PENHORA_ANTIGA_ANOS);
  const daysLeft = daysUntil(limitDate, asOfIso);
  return {
    via,
    label: (PRESC_EVENT_TYPES[via] && PRESC_EVENT_TYPES[via].label) || via,
    requestDate: asIso(r.interruptAt) || informed,
    constrictionDate: informed,
    limitDate,
    daysLeft,
    due: daysLeft != null && daysLeft <= 0
  };
}

/** Pausas sem data de fim (e adesões vigentes): recebem o botão “ainda vale”, que grava `verifiedAt`. */
export function openPauseEvents(cdaEvents, asOf) {
  const asOfIso = asIso(asOf) || localIso(new Date());
  const dated = (cdaEvents || []).filter(e => asIso(e.date) && asIso(e.date) <= asOfIso);
  const inferred = inferParcelamentoEnds(dated);
  const out = [];
  for (const e of dated) {
    const t = normalizePrescEventType(e.type);
    const meta = PRESC_EVENT_TYPES[t];
    if (!meta || meta.category !== 'suspensiva') continue;
    if (t === 'susp_art40' || t === IDPJ_CONSTRICTION_TYPE) continue;
    if (asIso(e.endDate) || (isAdesaoType(t) && inferred.has(e.id))) continue;
    out.push({
      id: e.id,
      type: t,
      label: meta.label,
      start: asIso(e.requestDate) || asIso(e.date),
      verifiedAt: asIso(e.verifiedAt) || '',
      lastCheck: lastConference(e),
      adesao: isAdesaoType(t),
      inherited: !!e._inheritedFromIDPJ
    });
  }
  return out;
}

/**
 * Prazo informativo para redirecionar a execução ao sócio (sem alarme).
 * Conta 5 anos da citação da empresa; se a dissolução irregular é posterior à citação, dela.
 */
export function redirecionamentoInfo({ exec, events = [], asOf } = {}) {
  if (!exec) return null;
  const asOfIso = asIso(asOf) || localIso(new Date());
  const first = (pred) => firstIso((events || []).filter(e => pred(normalizePrescEventType(e.type))).map(e => asIso(e.date)).filter(d => d && d <= asOfIso));
  const citacao = first(t => CITACAO_ALIASES.has(t));
  const dissolucao = first(t => t === 'info_dissolucao_irregular');
  const pedido = first(t => t === 'info_pedido_redirecionamento');
  const basis = 'Tema 444/STJ (REsp 1.201.993): 5 anos da citação da empresa ou, se a dissolução irregular for posterior, do ato de dissolução; exige inércia da Fazenda no período.';
  if (!citacao && !dissolucao) {
    return { start: '', startHow: '', limitDate: '', daysLeft: null, pedido, status: 'sem_dados', text: 'Sem citação da empresa lançada. O prazo para redirecionar ainda não tem início.', basis };
  }
  let start = citacao;
  let startHow = 'citação da empresa';
  if (dissolucao && (!citacao || dissolucao > citacao)) {
    start = dissolucao;
    startHow = 'indício de dissolução irregular, posterior à citação';
  }
  const limitDate = addCalendarYears(start, 5);
  const daysLeft = daysUntil(limitDate, asOfIso);
  let status = daysLeft != null && daysLeft <= 0 ? 'vencido' : 'em_curso';
  let text = `Redirecionamento: 5 anos da ${startHow} (${fmtDate(start)}) → ${fmtDate(limitDate)}.`;
  if (pedido) {
    status = pedido >= start && pedido <= limitDate ? 'pedido_no_prazo' : (pedido < start ? 'pedido_anterior' : 'pedido_fora');
    text += status === 'pedido_no_prazo'
      ? ` Pedido de ${fmtDate(pedido)} dentro do prazo.`
      : (status === 'pedido_anterior' ? ` Pedido de ${fmtDate(pedido)} anterior ao início da contagem.` : ` Pedido de ${fmtDate(pedido)} depois do prazo; conferir se houve inércia.`);
  } else if (status === 'vencido') {
    text += ' Sem pedido lançado; conferir se houve inércia da Fazenda no período.';
  }
  return { start, startHow, limitDate, daysLeft, pedido, citacao, dissolucao, status, text, basis };
}

export const PRESC_FLAGS = {
  PARC_SEM_FIM: 'parc_sem_fim',
  PEDIDO_SEM_DESFECHO: 'pedido_sem_desfecho'
};

const emptyResult = (overrides = {}) => ({
  segment: null,
  origin: 'estimativa',
  phase: 'sem_dados',
  status: 'sem_dados',
  diesAQuo: null,
  diesAdQuem: null,
  daysLeft: null,
  detail: 'Sem dados para calcular.',
  memory: [],
  gaps: [],
  timeline: [],
  prescriptionInterrupted: false,
  prescDaysConsumed: 0,
  suspDaysConsumed: 0,
  activeSuspensions: [],
  flags: [],
  bounds: null,
  cycleKind: null,
  parcRestartMode: PARC_RESTART_ONE_PLUS_FIVE,
  scenario: '',
  summary: '',
  occurrences: [],
  estimates: [],
  checks: [],
  rulesApplied: [],
  ruleVersion: RULE_VERSION,
  estimated: false,
  idpjNotice: null,
  band: null,
  incidents: [],
  informedDate: '',
  forecastDate: '',
  informedConflict: false,
  ...overrides
});

const statusFrom = (phase, daysLeft) => {
  if (phase === 'estimado') {
    if (daysLeft == null) return 'alerta';
    if (daysLeft <= 0) return 'alerta';
    if (daysLeft <= 365) return 'critico';
    if (daysLeft <= 730) return 'alerta';
    return 'correndo';
  }
  if (phase === 'consumado' || (daysLeft != null && daysLeft <= 0 && (phase === 'correndo' || phase === 'originario'))) return 'prescrito';
  if (phase === 'nao_iniciado') return 'indeterminado';
  if (phase === 'interrompido') return 'interrompido';
  if (phase === 'suspenso' || phase === 'suspenso_art151') return 'suspenso';
  if (daysLeft == null) return 'sem_dados';
  if (daysLeft <= 365) return 'critico';
  if (daysLeft <= 730) return 'alerta';
  return 'correndo';
};

function parcRestartModeOf(debt, exec) {
  const raw = (debt && debt.parcRestartMode) || (exec && exec.parcRestartMode) || PARC_RESTART_ONE_PLUS_FIVE;
  return raw === PARC_RESTART_FIVE_ONLY ? PARC_RESTART_FIVE_ONLY : PARC_RESTART_ONE_PLUS_FIVE;
}

function pickFiscalExec(matchingExecs) {
  if (!matchingExecs || !matchingExecs.length) return null;
  const efs = matchingExecs.filter(e => e && e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  return efs[0] || null;
}

export const prescOriginLabel = (r) => {
  if (!r) return '';
  if (r.origin === 'data_informada') return 'informada';
  if (r.origin === 'calculo_validado') return 'calculada';
  if (r.origin === 'estimativa_pessimista') return 'estimado';
  if (r.origin === 'estimativa') return 'estimativa';
  return '';
};

function isBareExecEvent(e) {
  return !!(e && e.executionId && !e.cdaId && (!e.batchCdaIds || e.batchCdaIds.length === 0));
}

/** Índices O(1) para collectEventsForCda — createPrescLookup monta uma vez e reusa em todas as CDAs. */
export function buildPrescCollectIndex(executions, events) {
  const execByProc = new Map();
  const execsByProc = new Map();
  const execById = new Map();
  for (const e of executions || []) {
    if (e && e.id) execById.set(e.id, e);
    const n = normProc(e && e.processNumber);
    if (n) {
      if (!execByProc.has(n)) execByProc.set(n, e); // compatibilidade: primeiro registro
      if (!execsByProc.has(n)) execsByProc.set(n, []);
      execsByProc.get(n).push(e);
    }
  }
  const byCda = new Map();
  const byExec = new Map();
  const byExecBare = new Map();
  const byInheritedParent = new Map();
  const idpjByLinkedExec = new Map();
  const push = (map, key, ev) => {
    if (!key) return;
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(ev);
  };
  for (const e of executions || []) {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) continue;
    for (const linkedId of e.linkedExecutionIds || []) {
      if (!linkedId) continue;
      let arr = idpjByLinkedExec.get(linkedId);
      if (!arr) { arr = []; idpjByLinkedExec.set(linkedId, arr); }
      arr.push(e.id);
    }
  }
  for (const ev of events || []) {
    if (!ev) continue;
    if (ev.cdaId) push(byCda, ev.cdaId, ev);
    if (ev.batchCdaIds && ev.batchCdaIds.length) {
      for (const id of ev.batchCdaIds) push(byCda, id, ev);
    }
    if (ev.executionId) push(byExec, ev.executionId, ev);
    if (isBareExecEvent(ev)) push(byExecBare, ev.executionId, ev);
    if (ev._inheritedFromParent) push(byInheritedParent, ev._inheritedFromParent, ev);
  }
  return { execByProc, execsByProc, execById, byCda, byExec, byExecBare, byInheritedParent, idpjByLinkedExec };
}

export function collectEventsForCda(debt, executions, events, collectIndex) {
  const execs = executions || [];
  const evts = events || [];
  const matchingExecs = debt && debt.processNumber
    ? (collectIndex
      ? (collectIndex.execsByProc?.get(normProc(debt.processNumber)) || (collectIndex.execByProc.get(normProc(debt.processNumber)) ? [collectIndex.execByProc.get(normProc(debt.processNumber))] : []))
      : execs.filter(e => sameProc(e.processNumber, debt.processNumber)))
    : [];
  const exec = pickFiscalExec(matchingExecs);
  const incidentOnly = !exec && matchingExecs.some(e => e && (e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal'));
  let direct;
  if (collectIndex) {
    direct = [
      ...(collectIndex.byCda.get(debt && debt.id) || []),
      ...matchingExecs.flatMap(item => collectIndex.byExecBare.get(item.id) || []),
    ];
  } else {
    const matchingIds = new Set(matchingExecs.map(item => item.id));
    direct = evts.filter(e =>
      e.cdaId === debt.id ||
      (e.batchCdaIds && e.batchCdaIds.includes(debt.id)) ||
      (isBareExecEvent(e) && matchingIds.has(e.executionId))
    );
  }
  let inherited = [];
  const parentIds = new Set(matchingExecs.map(item => item.parentExecutionId).filter(Boolean));
  if (parentIds.size > 0) {
    if (collectIndex) {
      inherited = [...parentIds].flatMap(parentId => [
        ...(collectIndex.byExecBare.get(parentId) || []),
        ...(collectIndex.byInheritedParent.get(parentId) || []),
      ]);
    } else {
      inherited = evts.filter(e =>
        (isBareExecEvent(e) && parentIds.has(e.executionId)) ||
        parentIds.has(e._inheritedFromParent)
      );
    }
  }
  const coveringIds = coveringIdpjIds(matchingExecs, execs, collectIndex);
  if (coveringIds.size) {
    const alreadyFrom = new Set();
    for (const e of direct) if (e && e._inheritedFromIDPJ) alreadyFrom.add(e._inheritedFromIDPJ);
    for (const e of inherited) if (e && e._inheritedFromIDPJ) alreadyFrom.add(e._inheritedFromIDPJ);
    for (const idpjId of coveringIds) {
      if (alreadyFrom.has(idpjId)) continue;
      const src = collectIndex
        ? (collectIndex.byExecBare.get(idpjId) || [])
        : evts.filter(e => isBareExecEvent(e) && e.executionId === idpjId);
      for (const ev of src) {
        if (!ev) continue;
        inherited.push(mapCoveringIdpjEvent(ev, idpjId));
      }
    }
  }
  const seen = new Set();
  const merged = [];
  for (const e of [...direct, ...inherited]) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  merged.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  return { exec, events: merged, incidentOnly, incidents: listIncidents(matchingExecs, execs, evts, collectIndex) };
}

function listIncidents(matchingExecs, executions, events, collectIndex) {
  const ids = coveringIdpjIds(matchingExecs, executions, collectIndex);
  if (!ids.size) return [];
  const byId = collectIndex && collectIndex.execById
    ? collectIndex.execById
    : new Map((executions || []).filter(e => e && e.id).map(e => [e.id, e]));
  const incidents = [];
  for (const id of ids) {
    const inc = byId.get(id);
    if (!inc) continue;
    const src = collectIndex
      ? (collectIndex.byExecBare.get(id) || [])
      : (events || []).filter(e => isBareExecEvent(e) && e.executionId === id);
    const cons = src.filter(e => normalizePrescEventType(e.type) === IDPJ_CONSTRICTION_TYPE && asIso(e.date));
    const stays = src.filter(e => normalizePrescEventType(e.type) === IDPJ_STAY_TYPE && asIso(e.date));
    incidents.push({
      id: inc.id,
      processNumber: inc.processNumber || '',
      tag: inc.processTag === 'cautelar_fiscal' ? 'cautelar_fiscal' : 'idpj',
      hasConstriction: cons.length > 0,
      constrictionOpen: cons.some(e => !asIso(e.endDate)),
      hasStay: stays.length > 0,
      stayOpen: stays.some(e => !asIso(e.endDate)),
      status: inc.status || ''
    });
  }
  return incidents;
}

function coveringIdpjIds(matchingExecs, executions, collectIndex) {
  const ids = new Set();
  if (!matchingExecs.length) return ids;
  if (collectIndex && collectIndex.idpjByLinkedExec) {
    for (const item of matchingExecs) {
      const arr = collectIndex.idpjByLinkedExec.get(item.id);
      if (arr) for (const id of arr) ids.add(id);
    }
    return ids;
  }
  const execIds = new Set(matchingExecs.map(item => item.id));
  for (const e of executions || []) {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) continue;
    const linked = e.linkedExecutionIds || [];
    for (let i = 0; i < linked.length; i++) {
      if (execIds.has(linked[i])) { ids.add(e.id); break; }
    }
  }
  return ids;
}

function mapCoveringIdpjEvent(ev, idpjId) {
  const mapped = shouldPropagateIdpjAsSuspension(ev.type)
    ? { ...idpjPropagationPayload(ev), _inheritedFromIDPJ: idpjId }
    : { ...ev, _inheritedFromIDPJ: ev._inheritedFromIDPJ || idpjId };
  return mapped;
}

/** Data em que o efeito entra na linha do tempo: pedido (se constrição verificada) ou a data do fato. */
function sortKey(evt) {
  const type = normalizePrescEventType(evt.type);
  const efetivacao = asIso(evt.date);
  const pedido = asIso(evt.requestDate);
  const verifiedConstriction = efetivacao && (EF_CONSTRICTION_TYPES.has(type) || type === IDPJ_CONSTRICTION_TYPE || CITACAO_ALIASES.has(type));
  if (verifiedConstriction && pedido) return pedido;
  return efetivacao || pedido || '9999';
}

function pausedAt(iso, pauses) {
  return pauses.some(p => p.start <= iso && (!p.end || iso < p.end));
}

/**
 * Parcelamento sem cessação no cadastro não permanece vigente se há adesão ou
 * rescisão posterior — a importação Debcad/SIDA costuma omitir o encerramento
 * dos parcelamentos intermediários, e tratar o intervalo até hoje infla o originário.
 * Map: eventId → { end, reason: 'adesao_seguinte'|'rescisao' }
 */
export function inferParcelamentoEnds(cdaEvents) {
  const parcs = (cdaEvents || [])
    .filter(e => isAdesaoType(e.type) && asIso(e.date))
    .sort((a, b) => asIso(a.date).localeCompare(asIso(b.date)) || String(a.id || '').localeCompare(String(b.id || '')));
  const rescisoes = (cdaEvents || [])
    .filter(e => normalizePrescEventType(e.type) === 'int_rescisao_parcelamento' && asIso(e.date))
    .map(e => asIso(e.date))
    .sort();
  const inferred = new Map();
  for (let i = 0; i < parcs.length; i++) {
    if (asIso(parcs[i].endDate)) continue;
    const start = asIso(parcs[i].date);
    const nextStart = parcs[i + 1] ? asIso(parcs[i + 1].date) : '';
    const nextParc = nextStart && nextStart > start ? nextStart : '';
    const nextResc = rescisoes.find(d => d > start && (!nextParc || d < nextParc));
    if (nextResc) inferred.set(parcs[i].id, { end: nextResc, reason: 'rescisao' });
    else if (nextParc) inferred.set(parcs[i].id, { end: nextParc, reason: 'adesao_seguinte' });
  }
  return inferred;
}

function resolvedSuspEnd(evt, asOfIso, inferredEnds) {
  const type = normalizePrescEventType(evt.type);
  const stored = asIso(evt.endDate);
  const inferred = (!stored && isAdesaoType(type)) ? inferredEnds.get(evt.id) : null;
  const rawEnd = stored || (inferred && inferred.end) || '';
  const end = rawEnd || asOfIso;
  return {
    stored,
    inferred,
    rawEnd,
    end,
    ongoing: !rawEnd || rawEnd > asOfIso,
    openWithoutProof: false
  };
}

/** Inadimplemento informado em cada rescisão: data da rescisão → data do inadimplemento. */
function inadimplementoPorRescisao(cdaEvents) {
  const map = new Map();
  for (const e of cdaEvents || []) {
    if (normalizePrescEventType(e.type) !== 'int_rescisao_parcelamento') continue;
    const d = asIso(e.date);
    const inad = asIso(e.defaultDate);
    if (d && inad && inad < d) map.set(d, inad);
  }
  return map;
}

/**
 * Última conferência da pausa sem fim: o botão “ainda vale” grava `verifiedAt`.
 * Pausa lançada sem fim conta como conferida na data do registro.
 */
function lastConference(evt) {
  const v = asIso(evt && evt.verifiedAt);
  const c = asIso(evt && evt.createdAt);
  return v > c ? v : c;
}

/**
 * Fim da pausa conforme a leitura. Na cedo: a pausa sem fim acaba na última conferência
 * (A5/A6), e o parcelamento encerrado por rescisão acaba no inadimplemento (A1).
 */
function scenarioSuspEnd(evt, asOfIso, inferredEnds, scenario, motivos, inadByResc) {
  const r = resolvedSuspEnd(evt, asOfIso, inferredEnds);
  if (scenario !== 'cedo') return r;
  const start = asIso(evt.requestDate) || asIso(evt.date);
  if (r.rawEnd) {
    const inad = isAdesaoType(evt.type) && inadByResc ? inadByResc.get(r.rawEnd) : '';
    if (inad && inad > start && inad < r.rawEnd) {
      addMotivo(motivos, 'A1');
      return { ...r, rawEnd: inad, end: inad, ongoing: inad > asOfIso };
    }
    return r;
  }
  const conf = lastConference(evt);
  const end = conf && conf > start ? (conf < asOfIso ? conf : asOfIso) : start;
  addMotivo(motivos, isAdesaoType(evt.type) ? 'A6' : 'A5');
  return { ...r, rawEnd: end, end, ongoing: false, presumed: true };
}

function pauseIntervals(pauses) {
  const raw = (pauses || [])
    .filter(p => p && p.start)
    .map(p => ({ start: p.start, end: p.end || '9999-12-31' }))
    .filter(p => p.end > p.start)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  const merged = [];
  for (const p of raw) {
    const last = merged[merged.length - 1];
    if (!last || p.start > last.end) merged.push({ start: p.start, end: p.end });
    else if (p.end > last.end) last.end = p.end;
  }
  return merged;
}

function skipCoveringPauses(startIso, intervals) {
  let d = startIso;
  let guard = 0;
  while (guard++ < 100) {
    const covering = intervals.find(p => p.start <= d && d < p.end);
    if (!covering) return d;
    d = covering.end;
  }
  return d;
}

/**
 * Avança `need` dias não pausados. O dia em que a pausa começa não entra no vão
 * disponível (sem o −1 que deslocava o termo em um dia).
 */
export function addUnpausedDays(startIso, need, pauses) {
  if (need <= 0) return startIso;
  const intervals = pauseIntervals(pauses);
  let d = startIso;
  let remaining = need;
  let guard = 0;
  while (remaining > 0 && guard++ < 10000) {
    const covering = intervals.find(p => p.start <= d && d < p.end);
    if (covering) {
      d = covering.end;
      continue;
    }
    const next = intervals.find(p => p.start > d);
    if (!next) return addCalendarDays(d, remaining);
    const gap = Math.max(0, daysBetween(d, next.start));
    if (remaining <= gap) return addCalendarDays(d, remaining);
    remaining -= gap;
    d = next.start;
  }
  return addCalendarDays(d, remaining);
}

/** Anos civis com o relógio parado nas pausas (evita dia extra por ano bissexto). */
export function addUnpausedCalendarYears(startIso, years, pauses) {
  if (!startIso || years <= 0) return startIso;
  const intervals = pauseIntervals(pauses);
  const start = skipCoveringPauses(startIso, intervals);
  let end = addCalendarYears(start, years);
  for (let n = 0; n < 40; n++) {
    let extra = 0;
    for (const p of intervals) {
      const ps = p.start < start ? start : p.start;
      const pe = p.end > end ? end : p.end;
      if (pe > ps) extra += daysBetween(ps, pe);
    }
    const next = extra ? addCalendarDays(addCalendarYears(start, years), extra) : addCalendarYears(start, years);
    if (next === end) return end;
    end = next;
  }
  return end;
}

function yearSpanDays(startIso, years) {
  const end = addCalendarYears(startIso, years);
  return Math.max(0, daysBetween(startIso, end));
}

/** 1 ano de suspensão (art. 40) + 5 anos civis, descontadas pausas. */
function addArt40PlusFive(startIso, pauses) {
  const art40End = addUnpausedCalendarYears(startIso, 1, pauses);
  return { art40End, diesAdQuem: addUnpausedCalendarYears(art40End, 5, pauses) };
}

/** Ciclo da rescisão: 1 ano + 5 anos (padrão) ou só 5 anos. */
function addParcCycle(startIso, pauses, mode) {
  if (mode === PARC_RESTART_FIVE_ONLY) {
    return { art40End: startIso, diesAdQuem: addUnpausedCalendarYears(startIso, 5, pauses) };
  }
  return addArt40PlusFive(startIso, pauses);
}

function noteDuplicateConstriction(cdaEvents, gaps) {
  const byDay = new Map();
  for (const e of cdaEvents || []) {
    const t = normalizePrescEventType(e.type);
    if (!EF_CONSTRICTION_TYPES.has(t) && t !== IDPJ_CONSTRICTION_TYPE) continue;
    const day = asIso(e.requestDate) || asIso(e.date);
    if (!day) continue;
    if (!byDay.has(day)) byDay.set(day, new Set());
    byDay.get(day).add(t);
  }
  for (const [day, types] of byDay) {
    if (types.has('int_sisbajud') && types.has(IDPJ_CONSTRICTION_TYPE)) {
      gaps.push(`Sisbajud e constrição via IDPJ/cautelar no mesmo pedido (${fmtDate(day)}). Conferir se é a mesma diligência — o efeito não se duplica.`);
    }
  }
}

function memPush(memory, date, label, effect) {
  memory.push({ date, event: label, effect });
}

/**
 * @param {{ debt: object, executions?: object[], events?: object[], asOf?: string|Date }} args
 * Resultado principal = leitura tarde (tese da União). `band` traz a leitura cedo quando difere.
 */
export function computePrescription({ debt, executions = [], events = [], asOf, collectIndex } = {}) {
  if (!debt) return emptyResult();
  const asOfIso = asIso(asOf) || localIso(new Date());
  const { exec, events: cdaEvents, incidentOnly, incidents } = collectEventsForCda(debt, executions, events, collectIndex);
  const memory = [];
  const gaps = [];
  const timeline = [];

  const informed = asIso(debt.prescriptionDate);
  const forecast = exec ? asIso(exec.prescriptionForecast) : '';

  if (incidentOnly) {
    gaps.push('O número de processo desta CDA coincide com um IDPJ/cautelar, não com uma execução fiscal. A intercorrente do art. 40 não se calcula pelo protocolo do incidente.');
  }

  if (!exec) {
    const base = { debt, exec: null, cdaEvents, asOfIso, informed, incidents };
    const tarde = computeOriginario({ ...base, memory, gaps, timeline });
    const motivos = [];
    const cedo = computeOriginario({ ...base, memory: [], gaps: [], timeline: [], scenario: 'cedo', motivos });
    return withCaseView({
      ...tarde,
      band: buildBand(tarde, cedo, motivos),
      incidentOnly: !!incidentOnly
    }, { debt, exec: null, asOfIso, incidents, cdaEvents, incidentOnly: !!incidentOnly });
  }

  const args = { debt, exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline, incidents };
  const r = computeIntercorrente(args);
  const motivos = [];
  const cedo = computeIntercorrente({ ...args, scenario: 'cedo', motivos, memory: [], gaps: [], timeline: [] });
  let band = buildBand(r, cedo, motivos);
  if (r.phase === 'nao_iniciado' && r.bounds && r.bounds.ceiling && r.bounds.ceilingCedo) {
    const cd = r.bounds.ceilingCedo;
    const td = r.bounds.ceiling;
    const cdays = daysUntil(cd, asOfIso);
    const tdays = daysUntil(td, asOfIso);
    band = {
      cedo: { diesAdQuem: cd, daysLeft: cdays, phase: cdays <= 0 ? 'consumado' : 'correndo' },
      tarde: { diesAdQuem: td, daysLeft: tdays, phase: tdays <= 0 ? 'consumado' : 'correndo' },
      motivos: [{ code: 'B3', ...BAND_MOTIVOS.B3 }],
      kind: 'dado',
      alarme: true
    };
  }
  r.band = band;
  r.idpjNotice = idpjConstrictionNotice(r, incidents, asOfIso);
  r.incidents = incidents;
  r.incidentOnly = !!incidentOnly;
  return withCaseView(r, { debt, exec, asOfIso, incidents, cdaEvents });
}

function applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup, originario, scenario = 'tarde', motivos = null } = {}) {
  const pauses = [];
  const dated = (cdaEvents || []).filter(evt => {
    const d = asIso(evt.date);
    return !d || d <= asOfIso;
  });
  const inferredEnds = inferParcelamentoEnds(dated);
  const inadByResc = inadimplementoPorRescisao(dated);
  for (const evt of dated) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type];
    if (!meta || meta.category !== 'suspensiva') continue;
    if (skipArt40Dup && type === 'susp_art40') continue;
    // Constrição no incidente nunca é pausa: na tarde vale como interrupção; na cedo, é ignorada.
    if (type === IDPJ_CONSTRICTION_TYPE) continue;
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;
    const start = asIso(evt.requestDate) || efetivacao;
    if (start > asOfIso) continue;
    if (type === 'susp_falencia_decretada' && scenario === 'cedo') {
      addMotivo(motivos, 'A4');
      continue;
    }
    const resolved = scenarioSuspEnd(evt, asOfIso, inferredEnds, scenario, motivos, inadByResc);
    if (resolved.end <= start) continue;
    pauses.push({
      id: evt.id,
      start,
      end: resolved.end,
      type,
      originario,
      ongoing: resolved.ongoing,
      inferredEnd: resolved.inferred || null,
      presumed: !!resolved.presumed
    });
  }
  return pauses;
}

function firstIso(list) {
  return list.filter(Boolean).sort()[0] || '';
}

function computeOriginario({ debt, exec = null, cdaEvents, asOfIso, informed, memory, gaps, timeline, incidents = [], scenario = 'tarde', motivos = null }) {
  const consti = constituicaoDefinitiva(debt);
  const constitution = consti.date;
  const inscription = asIso(debt.inscriptionDate);
  let start = constitution || inscription;
  if (!constitution && scenario === 'cedo') {
    const lower = consti.lowerBound;
    if (lower && (!inscription || lower < inscription)) {
      start = lower;
      addMotivo(motivos, 'C1');
    } else if (inscription) {
      addMotivo(motivos, 'C1x');
    }
  }
  const protocol = exec ? (asIso(exec.protocolDate) || asIso(debt.protocolDate)) : '';
  if (!start && exec) {
    gaps.push('Sem âncora de constituição/inscrição para o quinquênio do art. 174.');
    return {
      ...emptyResult(),
      segment: 'credito',
      origin: 'estimativa',
      phase: 'interrompido',
      status: 'interrompido',
      detail: 'Ajuizada — prescrição ordinária interrompida com retroação à propositura. Sem âncora para reconstituir o quinquênio.',
      prescriptionInterrupted: true,
      memory, gaps, timeline, incidents
    };
  }
  if (!start && !informed) {
    return emptyResult({
      segment: 'credito',
      gaps: ['Sem data de inscrição nem data informada.'],
      memory, timeline, incidents
    });
  }
  if (!start) gaps.push('Sem inscrição — usando só a data informada.');
  else if (!constitution && !asIso(debt.firstChargeDate)) {
    gaps.push('Âncora é a inscrição, não a constituição definitiva.');
  }

  let originStart = start;
  let pauses = applyPausesFromEvents(cdaEvents, asOfIso, { skipArt40Dup: true, originario: true, scenario, motivos });
  if (exec && protocol) {
    pauses = pauses.map(p => {
      if (p.start > protocol) return null;
      const end = p.end && p.end > protocol ? protocol : p.end;
      if (!end || end <= p.start) return null;
      return { ...p, end };
    }).filter(Boolean);
  }
  const inferredEnds = inferParcelamentoEnds(cdaEvents);

  if (!exec) {
    const citacaoOrdem = cdaEvents.some(e => {
      const t = normalizePrescEventType(e.type);
      return (t === 'int_despacho_citacao' || CITACAO_ALIASES.has(t)) && asIso(e.date);
    });
    if (citacaoOrdem) {
      gaps.push('Há despacho que ordena citação (ou citação) sem execução vinculada. Conferir se a CDA foi ajuizada ou se o ajuizamento foi desfeito (retrocesso).');
    }
  }

  for (const evt of cdaEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type];
    if (!meta) continue;
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;
    if (efetivacao > asOfIso) {
      gaps.push(`Evento com data futura (${fmtDate(efetivacao)}) — ignorado no cômputo.`);
      timeline.push({ ...evt, effect: 'evento com data futura — ignorado no cômputo', phase: 'originario' });
      continue;
    }
    let effectDate = (EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type)) && asIso(evt.requestDate)
      ? asIso(evt.requestDate) : efetivacao;
    if (type === 'int_rescisao_parcelamento' && scenario === 'cedo') {
      const inad = asIso(evt.defaultDate);
      if (inad && inad < efetivacao) {
        effectDate = inad;
        addMotivo(motivos, 'A1');
      }
    }

    if (exec && protocol && effectDate > protocol) {
      timeline.push({ ...evt, effect: 'posterior ao ajuizamento — não afeta o art. 174', phase: 'originario' });
      continue;
    }

    const inferred = isAdesaoType(type) ? inferredEnds.get(evt.id) : null;

    if (type === 'int_protesto_extrajudicial' && !protestoExtrajudicialInterrompe(effectDate)) {
      memPush(memory, effectDate, meta.label, `Protesto anterior à vigência da LC 208/2024 (${fmtDate(LC208_VIGENCIA)}) — não interrompe o art. 174.`);
      gaps.push(`Protesto extrajudicial de ${fmtDate(effectDate)} é anterior a ${fmtDate(LC208_VIGENCIA)} e não interrompe.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'originario' });
      continue;
    }

    if (meta.category === 'interruptiva' || isAdesaoType(type)) {
      originStart = effectDate;
      let effect = 'Interrompe — quinquênio reinicia.';
      if (isAdesaoType(type)) {
        effect = 'Interrompe o originário (Súmula 653) e suspende enquanto vigente.';
        if (inferred) {
          const how = inferred.reason === 'rescisao' ? 'rescisão posterior' : 'adesão seguinte';
          effect = `Interrompe o originário (Súmula 653) e suspende enquanto vigente. Sem cessação no cadastro — suspensão encerrada pela ${how} em ${fmtDate(inferred.end)}.`;
        } else if (!asIso(evt.endDate)) {
          effect = 'Interrompe o originário (Súmula 653) e suspende enquanto vigente.';
        }
      } else if (type === 'int_pedido_parcelamento') {
        effect = 'Pedido de parcelamento sem deferimento: interrompe na data do pedido, sem pausa (Súmula 653).';
      } else if (type === 'int_rescisao_parcelamento' && effectDate !== efetivacao) {
        effect = `Leitura cedo: o quinquênio reinicia no inadimplemento (${fmtDate(effectDate)}), antes da rescisão.`;
      }
      memPush(memory, effectDate, meta.label, effect);
      timeline.push({ ...evt, effect, phase: 'originario' });
    } else if (meta.category === 'suspensiva' && type !== 'susp_art40') {
      const from = asIso(evt.requestDate) || efetivacao;
      const effect = type === 'susp_falencia_decretada' && scenario === 'cedo'
        ? 'Falência: a leitura cedo não conta a pausa.'
        : `Suspende até ${evt.endDate ? fmtDate(evt.endDate) : 'hoje'}.`;
      memPush(memory, from, meta.label, effect);
      timeline.push({ ...evt, effect, phase: 'originario' });
    } else if (meta.category === 'info') {
      timeline.push({ ...evt, effect: meta.desc, phase: 'originario' });
    }
  }

  if (!originStart && informed) {
    return {
      ...emptyResult(),
      segment: 'credito',
      origin: 'data_informada',
      phase: 'originario',
      diesAdQuem: informed,
      daysLeft: daysUntil(informed, asOfIso),
      status: statusFrom('originario', daysUntil(informed, asOfIso)),
      detail: 'Data de prescrição informada (sem âncora de inscrição).',
      memory, gaps, timeline, incidents
    };
  }

  const diesAdQuemComputed = addUnpausedCalendarYears(originStart, 5, pauses);
  const need = yearSpanDays(originStart, 5);
  const activeNow = pauses.filter(p => p.ongoing);
  const startLabel = constitution
    ? `Constituição definitiva do crédito (${consti.how}; art. 174, caput, CTN).`
    : (start !== inscription && start
      ? 'Vencimento ou período de apuração — limite mínimo; a constituição definitiva não foi informada.'
      : 'Inscrição em dívida ativa — estimativa; a âncora legal é a constituição definitiva.');

  // Ajuizada: o quinquênio do art. 174 termina no ajuizamento.
  if (exec) {
    const originExec = constitution || cdaEvents.some(e => PRESC_EVENT_TYPES[normalizePrescEventType(e.type)]) ? 'calculo_validado' : 'estimativa';
    memPush(memory, originStart, 'Dies a quo', startLabel);
    memPush(memory, diesAdQuemComputed, 'Termo final projetado', '5 anos civis, descontadas suspensões do art. 151 CTN.');
    if (protocol && protocol > diesAdQuemComputed) {
      memPush(memory, protocol, 'Ajuizamento', 'APÓS o termo final do quinquênio — risco de prescrição ordinária consumada antes da propositura.');
      return {
        segment: 'credito', origin: originExec, phase: 'consumado', status: 'prescrito',
        diesAQuo: originStart, diesAdQuem: diesAdQuemComputed, daysLeft: daysUntil(diesAdQuemComputed, asOfIso),
        detail: `Prescrição ordinária consumada em ${fmtDate(diesAdQuemComputed)}, antes do ajuizamento (${fmtDate(protocol)}). Verificar causas interruptivas não registradas anteriores à propositura.`,
        memory, gaps, timeline, incidents,
        prescriptionInterrupted: false, prescDaysConsumed: need, suspDaysConsumed: 0,
        activeSuspensions: activeNow.map(p => p.id),
        constitutionHow: consti.how
      };
    }
    let lc118Pendente = false;
    if (protocol) {
      const despacho = firstIso(cdaEvents.filter(e => normalizePrescEventType(e.type) === 'int_despacho_citacao').map(e => asIso(e.date)));
      const citacao = firstIso(cdaEvents.filter(e => CITACAO_ALIASES.has(normalizePrescEventType(e.type))).map(e => asIso(e.date)));
      const preLc118 = despacho ? despacho < LC118_VIGENCIA : protocol < LC118_VIGENCIA;
      if (preLc118 && !citacao) {
        lc118Pendente = true;
        gaps.push('Despacho de citação anterior a 09/06/2005: pela redação original do art. 174, só a citação interrompia. Informar a data da citação.');
        memPush(memory, protocol, 'Ajuizamento', 'Interrompe só se houve citação (regra anterior à LC 118/2005); a interrupção retroage à propositura.');
      } else {
        memPush(memory, protocol, 'Ajuizamento', 'Interrompe a prescrição com retroação à propositura (art. 174, p.ú., I, CTN; Tema 383/STJ).');
      }
    } else {
      gaps.push('Data de protocolo da execução não informada — interrupção presumida pelo ajuizamento (Tema 383).');
    }
    return {
      segment: 'credito', origin: originExec, phase: 'interrompido', status: 'interrompido',
      diesAQuo: originStart, diesAdQuem: null, daysLeft: null,
      detail: lc118Pendente
        ? `Ajuizada em ${fmtDate(protocol)}. Interrompida se houve citação (regra anterior à LC 118/2005).`
        : `Ajuizada em ${protocol ? fmtDate(protocol) : 'data não informada'}, dentro dos 5 anos contados de ${fmtDate(originStart)}. Prazo interrompido pela propositura.`,
      memory, gaps, timeline, incidents,
      prescriptionInterrupted: true, prescDaysConsumed: 0, suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id),
      lc118Pendente,
      constitutionHow: consti.how
    };
  }

  const diesAdQuem = diesAdQuemComputed;
  const origin = constitution || cdaEvents.some(e => PRESC_EVENT_TYPES[normalizePrescEventType(e.type)]) ? 'calculo_validado' : 'estimativa';
  if (!exec && activeNow.some(p => isAdesaoType(p.type))) {
    return {
      segment: 'credito',
      origin,
      phase: 'suspenso',
      status: 'suspenso',
      diesAQuo: originStart,
      diesAdQuem: null,
      daysLeft: null,
      detail: 'Parcelamento vigente. O prazo ordinário não corre. Na rescisão, o quinquênio recomeça.',
      memory, gaps, timeline, incidents,
      prescriptionInterrupted: true, prescDaysConsumed: 0, suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id),
      constitutionHow: consti.how
    };
  }
  if (informed && informed !== diesAdQuemComputed) {
    gaps.push(`Data digitada na CDA (${fmtDate(informed)}) diverge do termo calculado (${fmtDate(diesAdQuemComputed)}). O cálculo prevalece.`);
  }
  const daysLeft = daysUntil(diesAdQuem, asOfIso);
  let phase = 'originario';
  if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
  else if (activeNow.filter(p => !diesAdQuem || p.start < diesAdQuem).length) phase = 'suspenso';

  memPush(memory, originStart, 'Dies a quo', startLabel);
  memPush(memory, diesAdQuemComputed, 'Dies ad quem (calculado)', `5 anos civis, descontadas suspensões.`);

  return {
    segment: 'credito',
    origin,
    phase,
    status: statusFrom(phase === 'originario' ? 'correndo' : phase, daysLeft),
    diesAQuo: originStart,
    diesAdQuem,
    daysLeft,
    detail: phase === 'consumado'
      ? `Prescrição originária consumada em ${fmtDate(diesAdQuem)}.`
      : (phase === 'suspenso'
        ? `Originário suspenso. Termo projetado: ${fmtDate(diesAdQuem)}.`
        : `Prescrição originária: ${fmtDate(originStart)} + 5 anos → ${fmtDate(diesAdQuem)}${origin === 'estimativa' ? ' (estimativa: inscrição)' : ''}.`),
    memory, gaps, timeline, incidents,
    prescriptionInterrupted: false,
    prescDaysConsumed: Math.max(0, need - Math.max(0, daysLeft || 0)),
    suspDaysConsumed: 0,
    activeSuspensions: activeNow.map(p => p.id),
    flags: [],
    informedDate: informed || '',
    informedConflict: !!(informed && informed !== diesAdQuemComputed),
    constitutionHow: consti.how
  };
}

function intercorrenteWindowEnd({ marco, parcRestartAt, pauses, beforeIso, mode }) {
  const relevant = beforeIso ? pauses.filter(p => p.start < beforeIso) : pauses;
  if (parcRestartAt) {
    return addParcCycle(parcRestartAt, relevant, mode).diesAdQuem;
  }
  if (!marco) return null;
  return addArt40PlusFive(marco, relevant).diesAdQuem;
}

const FLOOR_ANCHOR_LABEL = {
  protocolo: 'protocolo da execução',
  citacao: 'citação efetiva',
  despacho: 'despacho que ordena citação',
  constricao: 'constrição útil antes da ciência'
};

/** Último ato conhecido antes de uma data (protocolo, citação, despacho ou constrição). */
function latestActBefore(exec, debt, cdaEvents, beforeIso) {
  let best = asIso(exec && exec.protocolDate) || asIso(debt && debt.protocolDate) || '';
  if (best && best > beforeIso) best = '';
  for (const e of cdaEvents || []) {
    const t = normalizePrescEventType(e.type);
    if (!(CITACAO_ALIASES.has(t) || t === 'int_despacho_citacao' || EF_CONSTRICTION_TYPES.has(t))) continue;
    const d = asIso(e.requestDate) || asIso(e.date);
    if (d && d < beforeIso && d > best) best = d;
  }
  return best;
}

export function computeIntercorrenteBounds({ exec, debt, cdaEvents = [], asOfIso } = {}) {
  const asOf = asIso(asOfIso) || localIso(new Date());
  const anchors = [];
  const protocol = asIso(exec && exec.protocolDate) || asIso(debt && debt.protocolDate);
  if (protocol && protocol <= asOf) anchors.push({ iso: protocol, kind: 'protocolo' });
  for (const e of cdaEvents || []) {
    const t = normalizePrescEventType(e.type);
    const d = asIso(e.date);
    const req = asIso(e.requestDate);
    const iso = req || d;
    if (!iso || iso > asOf) continue;
    if (CITACAO_ALIASES.has(t)) anchors.push({ iso, kind: 'citacao' });
    else if (t === 'int_despacho_citacao') anchors.push({ iso, kind: 'despacho' });
    else if (EF_CONSTRICTION_TYPES.has(t)) anchors.push({ iso, kind: 'constricao' });
  }
  anchors.sort((a, b) => a.iso.localeCompare(b.iso));
  const latest = anchors.length ? anchors[anchors.length - 1] : null;
  const floor = latest ? addCalendarYears(latest.iso, 6) : null;
  const pauses = applyPausesFromEvents(cdaEvents, asOf, { skipArt40Dup: true, originario: false });
  const pauseIv = pauseIntervals(pauses);
  let ceiling = null;
  let ceilingCedo = null;
  for (const e of cdaEvents || []) {
    if (normalizePrescEventType(e.type) !== 'info_arquivamento') continue;
    const a = asIso(e.date);
    if (!a || a > asOf) continue;
    let extra = 0;
    for (const p of pauseIv) {
      if (!p.start || p.start < a) continue;
      const pe = p.end && p.end < '9999-12-31' ? p.end : asOf;
      if (pe > p.start) extra += daysBetween(p.start, pe);
    }
    const cand = extra ? addCalendarDays(addCalendarYears(a, 6), extra) : addCalendarYears(a, 6);
    const candCedo = extra ? addCalendarDays(addCalendarYears(a, 5), extra) : addCalendarYears(a, 5);
    if (!ceiling || cand < ceiling) {
      ceiling = cand;
      ceilingCedo = candCedo;
    }
  }
  return {
    floor,
    floorDays: floor ? daysUntil(floor, asOf) : null,
    floorAnchor: latest,
    ceiling,
    ceilingDays: ceiling ? daysUntil(ceiling, asOf) : null,
    ceilingCedo,
    ceilingCedoDays: ceilingCedo ? daysUntil(ceilingCedo, asOf) : null
  };
}

const CASE_FACT = {
  marco_nao_localizacao: 'Ciência de não localização do devedor',
  marco_sem_bens: 'Ciência de ausência de bens',
  marco_insuficiencia_bens: 'Ciência de insuficiência de bens',
  int_citacao: 'Citação do devedor',
  int_penhora: 'Penhora efetiva',
  int_arresto: 'Arresto / bloqueio',
  int_sisbajud: 'Bloqueio Sisbajud',
  int_cnib: 'Indisponibilidade CNIB/CCS',
  int_reconhecimento: 'Reconhecimento da dívida',
  int_despacho_citacao: 'Despacho que ordena citação',
  int_protesto_judicial: 'Protesto judicial',
  int_protesto_extrajudicial: 'Protesto extrajudicial da CDA',
  int_outra: 'Outra causa interruptiva',
  int_pedido_parcelamento: 'Pedido de parcelamento sem deferimento',
  susp_parcelamento: 'Parcelamento — adesão',
  susp_transacao: 'Transação — adesão',
  int_rescisao_parcelamento: 'Rescisão de parcelamento ou transação',
  susp_embargos: 'Embargos com efeito suspensivo',
  susp_decisao_judicial: 'Decisão judicial suspensiva',
  susp_deposito: 'Depósito judicial integral',
  susp_falencia: 'Recuperação judicial',
  susp_falencia_decretada: 'Falência decretada',
  susp_art40: 'Suspensão do art. 40',
  susp_idpj_mcf_constricao: 'Constrição no incidente',
  susp_idpj_mcf: 'Suspensão da execução via incidente',
  susp_outra: 'Outra causa suspensiva',
  info_peticao_sem_resultado: 'Pedido ainda sem resultado',
  info_arquivamento: 'Arquivamento',
  info_desarquivamento: 'Desarquivamento',
  info_decisao_prescricao: 'Decisão sobre prescrição',
  info_dissolucao_irregular: 'Dissolução irregular (indício)',
  info_pedido_redirecionamento: 'Pedido de redirecionamento',
  info_outro: 'Outro registro'
};

function occurrenceSource(ev, incidents) {
  if (!ev) return 'evento';
  if (ev._inheritedFromIDPJ) {
    const inc = (incidents || []).find(i => i.id === ev._inheritedFromIDPJ);
    const kind = inc && inc.tag === 'cautelar_fiscal' ? 'MCF' : 'IDPJ';
    return kind + ' nº ' + ((inc && inc.processNumber) || ev._inheritedFromIDPJ);
  }
  if (ev.source === 'analise') {
    const evn = String(ev.sourceRef || '').match(/Evento\s*(\d+)/i);
    return evn ? ('Análise · Evento ' + evn[1]) : 'Análise';
  }
  if (ev._source === 'processo') return 'processo';
  if (ev._source === 'planilha') return 'planilha';
  return 'evento';
}

function occurrenceEffect(type, ev, r) {
  const t = normalizePrescEventType(type);
  if (ev && /posterior ao ajuizamento/.test(ev.effect || '')) {
    return 'posterior ao ajuizamento — não afeta o prazo ordinário';
  }
  if (isAdesaoType(t)) {
    return 'interrompe e pausa enquanto vigente';
  }
  if (t === 'int_rescisao_parcelamento') {
    if (r && r.segment === 'credito') return 'restabelece a exigibilidade; o prazo de 5 anos recomeça';
    return 'restabelece a exigibilidade; abre ciclo de 1 ano + 5 anos';
  }
  if (t === 'int_pedido_parcelamento') return 'interrompe na data do pedido, sem pausa';
  if (DECLARED_INTERRUPT_TYPES.has(t)) return 'interrompe; o prazo de 5 anos recomeça';
  if (t === 'susp_falencia') return 'registro; a recuperação judicial não pausa o prazo';
  if (t === 'susp_falencia_decretada') return 'pausa só na data tarde; a data cedo ignora a pausa';
  if (t === 'info_dissolucao_irregular' || t === 'info_pedido_redirecionamento') return 'registro para o prazo de redirecionamento';
  if (t === 'int_protesto_extrajudicial') {
    const d = asIso(ev && ev.date);
    if (r && r.segment === 'intercorrente') {
      if (protestoExtrajudicialInterrompe(d)) return 'não encerra o ciclo de 1 ano + 5 anos';
      return 'não interrompe (anterior à LC 208/2024)';
    }
    if (protestoExtrajudicialInterrompe(d)) return 'interrompe a prescrição ordinária (LC 208/2024)';
    return 'não interrompe (anterior à LC 208/2024)';
  }
  if (t === 'susp_idpj_mcf_constricao') {
    if (r && r.phase === 'interrompido' && r.interruptVia === IDPJ_CONSTRICTION_TYPE) return 'vale como interrupção desta execução, desde o pedido';
    if (r && r.segment === 'intercorrente') return 'vale como interrupção se houver prazo em curso';
    return 'registro do incidente';
  }
  if (t === 'susp_idpj_mcf') return 'pausa a intercorrente até o fim do incidente; não encerra o ciclo';
  if (EF_CONSTRICTION_TYPES.has(t) || CITACAO_ALIASES.has(t)) {
    const when = asIso(ev && ev.requestDate) || asIso(ev && ev.date);
    if (r && r.phase === 'interrompido' && r.interruptAt && when === r.interruptAt) return 'encerra o ciclo';
    if (r && r.phase === 'suspenso') return 'não encerra o ciclo enquanto o prazo está pausado';
    if (r && r.segment === 'intercorrente' && r.phase === 'nao_iniciado') return 'não inicia o prazo de 1 ano + 5 anos';
    return 'resultado útil';
  }
  if (t === 'marco_sem_bens' || t === 'marco_nao_localizacao' || t === 'marco_insuficiencia_bens') {
    if (ev && /não reinicia/i.test(ev.effect || '')) return 'nova certidão — não reinicia';
    if (r && r.diesAQuo && asIso(ev && ev.date) && asIso(ev.date) !== r.diesAQuo) return 'nova certidão — não reinicia';
    return 'inicia o prazo de 1 ano + 5 anos';
  }
  if (t === 'susp_art40') {
    if (ev && /Tratado como marco|vale como ciência/i.test(ev.effect || '')) return 'vale como ciência';
    if (r && r.diesAQuo && asIso(ev && ev.date) === r.diesAQuo) return 'vale como ciência';
    return 'registro do caso';
  }
  if (t === 'info_arquivamento') return 'limite do prazo: entre arquivamento + 5 anos e + 6 anos';
  if (t === 'susp_embargos' || t === 'susp_decisao_judicial' || t === 'susp_deposito' || t === 'susp_outra' || t === IDPJ_STAY_TYPE) {
    return 'pausa o prazo; depois retoma';
  }
  if (t === 'info_peticao_sem_resultado') return 'não encerra o ciclo; conferir o desfecho';
  return 'registro do caso';
}

const INTERRUPT_SHORT = {
  int_penhora: 'penhora',
  int_arresto: 'arresto',
  int_sisbajud: 'bloqueio Sisbajud',
  int_cnib: 'indisponibilidade',
  int_citacao: 'citação',
  int_reconhecimento: 'reconhecimento da dívida',
  int_outra: 'resultado útil',
  susp_idpj_mcf_constricao: 'constrição no incidente'
};

function interruptType(r) {
  if (r.interruptVia) return normalizePrescEventType(r.interruptVia);
  const ev = (r.timeline || []).find(e => e && e.phase === 'interrompido');
  return ev ? normalizePrescEventType(ev.type) : '';
}

function interruptFactLabel(r) {
  const t = interruptType(r);
  if (t && INTERRUPT_SHORT[t]) return INTERRUPT_SHORT[t];
  const fact = t && CASE_FACT[t];
  return fact ? fact.toLowerCase() : 'resultado útil';
}

const INTERRUPT_PREP = {
  int_penhora: 'pela',
  int_arresto: 'pelo',
  int_sisbajud: 'pelo',
  int_cnib: 'pela',
  int_citacao: 'pela',
  int_reconhecimento: 'pelo',
  int_outra: 'pelo',
  susp_idpj_mcf_constricao: 'pela'
};

function interruptPrep(r) {
  const t = interruptType(r);
  return INTERRUPT_PREP[t] || 'pelo';
}

function pendingPetitionDate(r, ctx) {
  const dates = (ctx && ctx.pendingPetitions) || r.pendingPetitions || [];
  if (dates.length) return dates[0];
  for (const ev of r.timeline || []) {
    if (normalizePrescEventType(ev.type) === 'info_peticao_sem_resultado') {
      const d = asIso(ev.requestDate) || asIso(ev.date);
      if (d) return d;
    }
  }
  return '';
}

function buildSummary(r, ctx) {
  if (!r) return '';
  if (r.segment === 'credito') {
    if (r.phase === 'consumado' && ctx.exec) {
      const p = asIso(ctx.exec.protocolDate);
      return `Consumada antes do ajuizamento: termo em ${fmtDate(r.diesAdQuem)}${p ? ', ajuizada em ' + fmtDate(p) : ''}. Conferir interrupções anteriores.`;
    }
    if (r.phase === 'interrompido' && ctx.exec && r.lc118Pendente) {
      const p = asIso(ctx.exec.protocolDate);
      return `Ajuizada em ${p ? fmtDate(p) : 'data não informada'}. Interrompida se houve citação (regra anterior à LC 118/2005).`;
    }
    if (r.phase === 'interrompido' && ctx.exec) {
      const p = asIso(ctx.exec.protocolDate);
      const insc = asIso(ctx.debt && ctx.debt.inscriptionDate);
      const fromInsc = !!(r.diesAQuo && insc && r.diesAQuo === insc);
      const janela = fromInsc
        ? ', dentro dos 5 anos contados da inscrição'
        : (r.diesAQuo ? ', dentro dos 5 anos contados de ' + fmtDate(r.diesAQuo) : '');
      return `Ajuizada em ${p ? fmtDate(p) : 'data não informada'}${janela}. Prazo interrompido pela propositura.`;
    }
    if (r.phase === 'consumado') return `Prescrição ordinária consumada em ${fmtDate(r.diesAdQuem)}.`;
    if (r.phase === 'suspenso') return `Prazo ordinário pausado. Termo projetado: ${fmtDate(r.diesAdQuem)}.`;
    if (r.diesAdQuem) return `Prescrição ordinária: termo em ${fmtDate(r.diesAdQuem)}.`;
    return r.detail || 'Sem dados para a prescrição ordinária.';
  }
  if (r.segment === 'intercorrente') {
    if (r.phase === 'interrompido') {
      const fact = interruptFactLabel(r);
      return `Ciclo encerrado ${interruptPrep(r)} ${fact} de ${fmtDate(r.interruptAt)}. Nenhuma ciência de não localização ou de ausência de bens lançada depois.`;
    }
    if (r.phase === 'nao_iniciado') {
      return 'Execução ajuizada, ainda sem ciência de não localização ou de ausência de bens. O ajuizamento não inicia o prazo de 1 ano + 5 anos.';
    }
    if (r.phase === 'consumado') return `Prazo de 1 ano + 5 anos vencido em ${fmtDate(r.diesAdQuem)}.`;
    if (r.phase === 'suspenso') {
      if (!r.diesAdQuem) return 'Prazo pausado. Parcelamento vigente.';
      return `Prazo pausado. Termo projetado: ${fmtDate(r.diesAdQuem)}.`;
    }
    if (r.phase === 'suspensao_art40') {
      if (r.cycleKind === 'politica_parc') {
        return `Primeiro ano após a rescisão do parcelamento. Termo: ${fmtDate(r.diesAdQuem)}.`;
      }
      return `Primeiro ano após a ciência de não localização ou de ausência de bens. Termo: ${fmtDate(r.diesAdQuem)}.`;
    }
    if ((r.flags || []).includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO) && r.daysLeft != null && r.daysLeft < 0 && r.diesAdQuem) {
      const pet = pendingPetitionDate(r, ctx);
      return `Termo calculado em ${fmtDate(r.diesAdQuem)} já passou; há pedido${pet ? ' de ' + fmtDate(pet) : ''} sem resultado — conferir antes de declarar`;
    }
    if (r.diesAdQuem) return `Prazo em curso. Termo: ${fmtDate(r.diesAdQuem)}.`;
    return r.detail || '';
  }
  return r.detail || '';
}

function buildOccurrences(r, ctx) {
  const occ = [];
  const seen = new Set();
  const push = (date, fact, effect, source, note) => {
    const key = [date, fact, effect, note || ''].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    occ.push({ date: date || '', fact, effect, source, note: note || '' });
  };
  if (r.segment === 'credito') {
    const insc = asIso(ctx.debt && ctx.debt.inscriptionDate);
    const cd = constituicaoDefinitiva(ctx.debt);
    if (cd.date) push(cd.date, 'Constituição definitiva', 'ponto de partida' + (cd.how && cd.how !== 'informada na ficha' ? ' (' + cd.how + ')' : ''), 'processo');
    else {
      if (cd.lowerBound) push(cd.lowerBound, 'Vencimento ou período de apuração', 'início mais cedo possível (data cedo)', 'processo');
      if (insc) push(insc, 'Inscrição', 'ponto de partida (constituição não informada)', 'processo');
    }
    const p = ctx.exec && asIso(ctx.exec.protocolDate);
    if (p) push(p, 'Ajuizamento', r.phase === 'consumado' ? 'depois do termo dos 5 anos' : 'interrompe', 'processo');
  }
  if (r.segment === 'intercorrente') {
    const p = ctx.exec && asIso(ctx.exec.protocolDate);
    if (p) push(p, 'Ajuizamento', 'ponto de partida; não inicia o 1 ano + 5 anos', 'processo');
  }
  for (const ev of r.timeline || []) {
    if (!ev) continue;
    if (r.segment === 'credito' && /posterior ao ajuizamento/.test(ev.effect || '')) continue;
    const t = normalizePrescEventType(ev.type);
    const date = asIso(ev.requestDate) || asIso(ev.date) || '';
    push(date, CASE_FACT[t] || (PRESC_EVENT_TYPES[t] && PRESC_EVENT_TYPES[t].label) || t, occurrenceEffect(t, ev, r), occurrenceSource(ev, r.incidents || ctx.incidents), ev.notes || ev.note || '');
  }
  occ.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.fact.localeCompare(b.fact));
  return occ;
}

function buildEstimates(r) {
  const estimates = [];
  if (r.phase === 'interrompido' && r.interruptAt) {
    estimates.push({
      label: 'Não pode ter prescrito antes de',
      date: addCalendarYears(r.interruptAt, 6),
      how: `${interruptFactLabel(r)} de ${fmtDate(r.interruptAt)} + 1 ano + 5 anos`
    });
  }
  if (r.bounds && r.bounds.floor && r.phase !== 'interrompido' && !(r.phase === 'suspenso' && !r.diesAdQuem)) {
    const kind = r.bounds.floorAnchor && FLOOR_ANCHOR_LABEL[r.bounds.floorAnchor.kind];
    estimates.push({
      label: 'Não pode ter prescrito antes de',
      date: r.bounds.floor,
      how: kind ? `${kind} + 1 ano + 5 anos` : 'ato mais recente + 1 ano + 5 anos'
    });
  }
  if (r.bounds && r.bounds.ceilingCedo && r.phase === 'nao_iniciado') {
    estimates.push({
      label: 'Pode ter vencido a partir de',
      date: r.bounds.ceilingCedo,
      how: 'arquivamento datado + 5 anos (a ciência costuma ser anterior ao arquivamento)'
    });
  }
  if (r.bounds && r.bounds.ceiling) {
    estimates.push({
      label: 'Não deveria passar de',
      date: r.bounds.ceiling,
      how: 'arquivamento datado + 6 anos, somadas as pausas posteriores'
    });
  }
  if (r.estimated && r.diesAdQuem) {
    estimates.push({
      label: 'Termo estimado (pior caso)',
      date: r.diesAdQuem,
      how: 'adesão sem data de fim: rescisão no dia da adesão + 1 ano + 5 anos'
    });
  } else if (r.diesAdQuem && r.phase !== 'interrompido' && r.phase !== 'nao_iniciado') {
    estimates.push({
      label: r.origin === 'data_informada' ? 'Termo informado' : 'Termo calculado',
      date: r.diesAdQuem,
      how: r.segment === 'credito'
        ? (r.origin === 'data_informada' ? 'data digitada na ficha, sem inscrição' : 'início do prazo + 5 anos, descontadas as pausas')
        : (r.cycleKind === 'politica_parc'
          ? 'rescisão + 1 ano + 5 anos'
          : 'ciência de não localização / ausência de bens + 1 ano + 5 anos')
    });
  }
  return estimates;
}

function buildCadastroChecks(r, ctx) {
  const checks = [];
  if (r.informedConflict && r.informedDate) {
    checks.push(`Data digitada na inscrição (${fmtDate(r.informedDate)}) diverge do termo calculado. Conferir qual vale.`);
  }
  if (r.segment === 'credito' && ctx.debt && !constituicaoDefinitiva(ctx.debt).date && asIso(ctx.debt.inscriptionDate)) {
    checks.push('Data de constituição definitiva não informada; o início usado é a inscrição. Informar vencimento, entrega da declaração ou notificação do lançamento.');
  }
  if (r.segment === 'credito' && r.lc118Pendente) {
    checks.push('Despacho de citação anterior a 09/06/2005: antes da LC 118/2005 só a citação interrompia. Informar a data da citação.');
  }
  for (const g of r.gaps || []) {
    if (/evento com data futura/i.test(g) || /Marco com data futura/i.test(g)) {
      checks.push(g);
    }
    if (/ciência anterior ao ajuizamento/i.test(g)) {
      checks.push('ciência anterior ao ajuizamento — conferir data');
    }
  }
  return checks;
}

function buildIncidentChecks(r, ctx) {
  const checks = [];
  const incidents = r.incidents || ctx.incidents || [];
  for (const inc of incidents) {
    const num = inc.processNumber || inc.id;
    const kind = inc.tag === 'cautelar_fiscal' ? 'Cautelar fiscal' : 'IDPJ';
    const stayOpen = !!(inc.hasStay && inc.stayOpen)
      || (ctx.cdaEvents || r.timeline || []).some(e => normalizePrescEventType(e.type) === IDPJ_STAY_TYPE && asIso(e.date) && !asIso(e.endDate));
    if (!inc.hasConstriction && !inc.hasStay && !stayOpen) {
      checks.push(`${kind} nº ${num} abrange esta execução e não tem constrição lançada. Se houve indisponibilidade ou bloqueio, lançar com a data do pedido. Se a execução está suspensa pelo incidente mesmo sem constrição, lançar a suspensão.`);
    }
    if (stayOpen && /extinta|arquivada/i.test(inc.status || '')) {
      checks.push(`Incidente nº ${num} encerrado; informar a data em que a pausa cessou.`);
    }
  }
  if ((r.flags || []).includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) {
    checks.push('Há pedido na janela de 1 ano + 5 anos sem resultado lançado. Conferir o desfecho nos autos.');
  }
  if (r.phase === 'interrompido' && r.interruptAt && r.interruptVia !== IDPJ_CONSTRICTION_TYPE) {
    checks.push(`Depois da ${interruptFactLabel(r)} de ${fmtDate(r.interruptAt)}: houve certidão de não localização ou de ausência de bens? Se sim, lançar a ciência.`);
  }
  if ((r.gaps || []).some(g => /sem evento de marco/i.test(g))) {
    checks.push('certidão de não localização/sem bens não lançada — confirmar data');
  }
  const decision = ctx.exec && ctx.exec.prescDecision;
  if (decision && decision.analysisDate) {
    const analysis = asIso(decision.analysisDate);
    let latest = '';
    for (const ev of ctx.cdaEvents || r.timeline || []) {
      const d = asIso(ev && ev.date) || asIso(ev && ev.requestDate);
      if (d && analysis && d > analysis && d > latest) latest = d;
    }
    if (latest) {
      checks.push(`Análise de ${fmtDate(analysis)} anterior à ocorrência de ${fmtDate(latest)} — revalidar.`);
    }
  }
  return [...new Set(checks)];
}

function buildRulesApplied(r, ctx) {
  const rules = new Set();
  if (r.segment === 'credito' || r.segment === 'intercorrente' || r.segment === 'decadencia') rules.add('R1');
  if (r.segment === 'intercorrente') {
    rules.add('R2');
    if (r.phase === 'interrompido') rules.add('R3');
    if ((r.timeline || []).some(e => {
      const t = normalizePrescEventType(e.type);
      return t === 'susp_embargos' || t === 'susp_decisao_judicial' || t === 'susp_deposito' || t === 'susp_falencia_decretada' || t === IDPJ_STAY_TYPE;
    })) rules.add('R4');
    if (r.cycleKind === 'politica_parc' || (r.timeline || []).some(e => {
      const t = normalizePrescEventType(e.type);
      return isAdesaoType(t) || t === 'int_rescisao_parcelamento' || t === 'int_pedido_parcelamento';
    })) rules.add('R5');
    if (r.phase === 'suspenso' && ((r.timeline || []).some(e => isAdesaoType(e.type) && !asIso(e.endDate))
      || (ctx.debt && (ctx.debt.status === 'parcelada' || ctx.debt.status === 'negociada_sispar')))) rules.add('R6');
    if ((r.incidents || ctx.incidents || []).length) rules.add('R7');
    if (r.bounds && r.bounds.floor) rules.add('R8');
    if (r.bounds && r.bounds.ceiling) rules.add('R9');
    if ((r.timeline || []).some(e => normalizePrescEventType(e.type) === 'susp_art40') && r.gaps && r.gaps.some(g => /sem evento de marco/i.test(g))) rules.add('R10');
    if (r.informedConflict || r.forecastDate) rules.add('R11');
  }
  if (r.segment === 'credito' && ctx.exec) rules.add('R12');
  return [...rules].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function withCaseView(r, ctx = {}) {
  if (!r) return r;
  const incidents = r.incidents || ctx.incidents || [];
  const summary = buildSummary(r, ctx);
  const occurrences = buildOccurrences(r, ctx);
  const estimates = buildEstimates(r);
  const incidentChecks = r.segment === 'intercorrente' ? buildIncidentChecks(r, ctx) : [];
  const checks = [...new Set([...buildCadastroChecks(r, ctx), ...incidentChecks])];
  const rulesApplied = buildRulesApplied(r, ctx);
  return {
    ...r,
    incidents,
    incidentOnly: !!(r.incidentOnly || ctx.incidentOnly),
    summary,
    occurrences,
    estimates,
    checks,
    rulesApplied,
    ruleVersion: RULE_VERSION,
    scenario: summary
  };
}

function sealIntercorrente(r, ctx) {
  const { debt, exec, cdaEvents, asOfIso, informed, forecast, flags, cycleKind, parcRestartMode, pendingPetitions } = ctx;
  const bounds = computeIntercorrenteBounds({ exec, debt, cdaEvents, asOfIso });
  const gaps = [...(r.gaps || [])];
  const memory = r.memory || [];
  const nextFlags = [...new Set(flags || [])];
  let diesAdQuem = r.diesAdQuem;
  let origin = r.origin;
  let daysLeft = r.daysLeft;
  let phase = r.phase;
  let status = r.status;
  let detail = r.detail;
  const cycleStarted = phase && phase !== 'nao_iniciado' && phase !== 'sem_dados' && phase !== 'pre_marco';
  const computed = r.computedDiesAdQuem || (cycleStarted && origin !== 'data_informada' ? r.diesAdQuem : null);

  if (cycleStarted && computed) {
    diesAdQuem = computed;
    origin = r.estimated ? 'estimativa_pessimista' : 'calculo_validado';
    daysLeft = daysUntil(diesAdQuem, asOfIso);
    if (informed && informed !== diesAdQuem) {
      gaps.push(`Data digitada na CDA (${fmtDate(informed)}) diverge do termo calculado (${fmtDate(diesAdQuem)}). O cálculo prevalece; conferir a divergência.`);
    }
  } else if (!cycleStarted) {
    diesAdQuem = null;
    daysLeft = null;
    origin = 'estimativa';
    if (informed) gaps.push(`Data digitada na CDA (${fmtDate(informed)}) sem ciclo do art. 40 — não é dies a quo.`);
    if (forecast) gaps.push(`Previsão da planilha (${fmtDate(forecast)}): sem marco legal — só ordena a fila.`);
  }

  const windowStart = r.diesAQuo;
  const windowEnd = computed || diesAdQuem;
  if (windowStart && windowEnd && (pendingPetitions || []).some(d => d >= windowStart && d <= windowEnd)) {
    if (!nextFlags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) nextFlags.push(PRESC_FLAGS.PEDIDO_SEM_DESFECHO);
  }
  if (cycleStarted && computed && phase !== 'interrompido' && phase !== 'suspenso' && !r.estimated) {
    if (daysLeft != null && daysLeft <= 0) {
      phase = 'consumado';
      status = 'prescrito';
    } else {
      status = statusFrom(phase === 'suspensao_art40' ? 'correndo' : phase, daysLeft);
    }
  }
  if (phase === 'consumado' && nextFlags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO)) {
    phase = 'correndo';
    status = 'critico';
    const pet = (pendingPetitions || []).find(d => d) || '';
    detail = `Termo calculado em ${fmtDate(diesAdQuem)} já passou; há pedido${pet ? ' de ' + fmtDate(pet) : ''} sem resultado — conferir antes de declarar`;
  }

  if (r.estimated) {
    origin = 'estimativa_pessimista';
    if (phase !== 'suspenso' && phase !== 'interrompido') phase = 'estimado';
    status = statusFrom('estimado', daysLeft);
    if (!detail || /CONSUMADA/i.test(detail)) {
      detail = `Parcelamento sem data de encerramento: termo estimado ${fmtDate(diesAdQuem)} (pior caso). Conferir a data da rescisão.`;
    }
  }

  if (phase === 'nao_iniciado') status = 'indeterminado';
  if (phase === 'interrompido') status = 'interrompido';

  if (bounds.floor && !memory.some(m => m.event === 'Piso operacional')) {
    const kind = bounds.floorAnchor && FLOOR_ANCHOR_LABEL[bounds.floorAnchor.kind];
    memPush(memory, bounds.floor, 'Piso operacional', `Não é marco. Acompanhar a partir desta data${kind ? ' (' + kind + ' + 6 anos)' : ''}.`);
  }
  if (bounds.ceiling && !memory.some(m => m.event === 'Teto operacional')) {
    memPush(memory, bounds.ceiling, 'Teto operacional', 'Arquivamento datado + 6 anos (data tarde). A data cedo é arquivamento + 5 anos. Não é dies a quo do Tema 566.');
  }

  const out = {
    ...r,
    diesAdQuem,
    origin,
    daysLeft,
    phase,
    status,
    detail,
    gaps,
    memory,
    flags: nextFlags,
    bounds,
    cycleKind: cycleKind || null,
    parcRestartMode: parcRestartMode || PARC_RESTART_ONE_PLUS_FIVE,
    informedDate: informed || '',
    forecastDate: forecast || '',
    informedConflict: !!(informed && diesAdQuem && informed !== diesAdQuem && cycleStarted),
    estimated: !!r.estimated,
    incidents: r.incidents || ctx.incidents || [],
    pendingPetitions: pendingPetitions || r.pendingPetitions || []
  };
  return out;
}

function computeIntercorrente({ debt, exec, cdaEvents, asOfIso, informed, forecast, memory, gaps, timeline, incidents = [], scenario = 'tarde', motivos = null }) {
  const baseMode = parcRestartModeOf(debt, exec);
  // Prazo que recomeça depois de parcelamento, pedido ou ato declarado.
  const restartModeFor = (kind) => {
    if (kind === 'declarado') return PARC_RESTART_FIVE_ONLY;
    if (scenario === 'cedo') {
      if (baseMode !== PARC_RESTART_FIVE_ONLY) addMotivo(motivos, kind === 'pedido' ? 'A2' : 'A1');
      return PARC_RESTART_FIVE_ONLY;
    }
    return baseMode;
  };
  let restartMode = baseMode;
  let restartKind = null;
  const flags = [];
  const pendingPetitions = [];
  const loopEvents = cdaEvents;
  const pauses = applyPausesFromEvents(loopEvents, asOfIso, { skipArt40Dup: true, originario: false, scenario, motivos });
  const inferredEnds = inferParcelamentoEnds(loopEvents);
  const inadByResc = inadimplementoPorRescisao(loopEvents);
  let marco = null;
  let interrupted = false;
  let interruptAt = null;
  let interruptEffAt = null;
  let interruptVia = null;
  let interruptSource = null;
  let tooLate = false;
  let parcMode = false;
  let parcOngoing = false;
  let parcRestartAt = null;
  let lastParcAdesao = null;
  let notedParcRule = false;
  let marcoFromSuspArt40 = false;

  const noteParcRule = () => {
    if (notedParcRule) return;
    notedParcRule = true;
    const modoTxt = baseMode === PARC_RESTART_FIVE_ONLY
      ? 'modo só 5 anos (linha Pitten / 1ª Turma do TRF4)'
      : 'modo 1+5 (1 ano de suspensão + 5 anos — mais favorável à União)';
    gaps.push(`Ciclo pós-parcelamento (política interna, não é marco do art. 40 / Tema 566). O pedido interrompe (art. 174, p.ú., IV CTN; Súmula 653). Com a rescisão, conta-se ${modoTxt}.`);
  };

  const ctx = () => ({
    debt, exec, cdaEvents: loopEvents, asOfIso, informed, forecast, flags, pendingPetitions,
    cycleKind: parcMode && parcRestartAt && !interrupted ? 'politica_parc' : (marco || interrupted ? 'art40' : null),
    parcRestartMode: restartMode,
    restartKind,
    incidents
  });

  noteDuplicateConstriction(loopEvents, gaps);

  for (const evt of loopEvents) {
    const type = normalizePrescEventType(evt.type);
    const meta = PRESC_EVENT_TYPES[type] || { category: 'info', label: type, desc: '' };
    const efetivacao = asIso(evt.date);
    if (!efetivacao) continue;

    // Constrição no incidente (IDPJ/MCF): vale como interrupção desta execução, igual a uma penhora.
    // A dúvida sobre esse efeito não vai à fila: o card do processo avisa aos 5 anos da constrição.
    const idpjAsInterrupt = type === IDPJ_CONSTRICTION_TYPE;
    const isConstriction = EF_CONSTRICTION_TYPES.has(type) || CITACAO_ALIASES.has(type) || idpjAsInterrupt;
    const effectDate = (isConstriction && asIso(evt.requestDate)) ? asIso(evt.requestDate) : efetivacao;

    if (efetivacao > asOfIso) {
      if (isConstriction) {
        pendingPetitions.push(asIso(evt.requestDate) || efetivacao);
        memPush(memory, effectDate, meta.label, 'Pedido com efetivação futura — ainda sem resultado. Não encerra o ciclo.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'pre_marco' });
      } else {
        gaps.push(`Evento com data futura (${fmtDate(efetivacao)}) — ignorado no cômputo.`);
        timeline.push({ ...evt, effect: 'evento com data futura — ignorado no cômputo', phase: 'pre_marco' });
      }
      continue;
    }
    if (type === 'info_peticao_sem_resultado' && efetivacao <= asOfIso) {
      pendingPetitions.push(asIso(evt.requestDate) || efetivacao);
    }

    if (meta.category === 'marco') {
      let marcoDate = efetivacao;
      if (scenario === 'cedo') {
        const disp = asIso(evt.availableDate);
        if (disp && disp < efetivacao) {
          marcoDate = disp;
          addMotivo(motivos, 'B1');
        }
      }
      if (parcOngoing) {
        memPush(memory, marcoDate, meta.label, 'Ciência na vigência do parcelamento — não inaugura o ciclo do art. 40 enquanto a exigibilidade está suspensa (art. 151, VI).');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
        continue;
      }
      if (parcMode && parcRestartAt) {
        memPush(memory, marcoDate, meta.label, 'O prazo já corre desde o reinício (parcelamento, pedido ou ato interruptivo); este marco não inicia segundo ciclo.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'prescricao_correndo' });
        continue;
      }
      const protocol = asIso(exec && exec.protocolDate) || asIso(debt && debt.protocolDate);
      if (protocol && marcoDate < protocol) {
        gaps.push('ciência anterior ao ajuizamento — conferir data');
      }
      if (marco && !interrupted) {
        memPush(memory, marcoDate, meta.label, `Nova certidão em ${fmtDate(marcoDate)} — não reinicia o ciclo.`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'prescricao_correndo' });
        continue;
      }
      marco = marcoDate;
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      memPush(memory, marcoDate, meta.label, marcoDate !== efetivacao
        ? 'Leitura cedo: a ciência conta da disponibilização da intimação. Inicia suspensão de 1 ano (art. 40 LEF / Tema 566).'
        : 'Inicia suspensão de 1 ano (art. 40 LEF / Tema 566).');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspensao_art40' });
      continue;
    }

    if (type === 'susp_art40') {
      if (!marco && !parcOngoing && !(parcMode && parcRestartAt) && efetivacao <= asOfIso) {
        let marcoDate = efetivacao;
        if (scenario === 'cedo') {
          const pedido = asIso(evt.requestDate);
          const anchor = pedido && pedido < efetivacao ? pedido : latestActBefore(exec, debt, loopEvents, efetivacao);
          if (anchor && anchor < efetivacao) marcoDate = anchor;
          addMotivo(motivos, 'B2');
        }
        marco = marcoDate;
        marcoFromSuspArt40 = true;
        interrupted = false;
        interruptAt = null;
        tooLate = false;
        gaps.push('Informado como suspensão art. 40, sem evento de marco. Tratado como ciência nesta data. Conferir nos autos.');
        memPush(memory, marcoDate, meta.label, marcoDate !== efetivacao
          ? 'Leitura cedo: a ciência pode ser anterior à decisão de suspensão. Conta do pedido da Fazenda ou do último ato conhecido.'
          : 'Tratado como marco (cadastro sem evento de ciência). Inicia o ciclo 1+5, com aviso.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspensao_art40' });
      } else {
        timeline.push({ ...evt, effect: 'Registro do ano do art. 40 — o marco já inicia a suspensão (não soma segundo ano).', phase: marco ? 'suspensao_art40' : 'pre_marco' });
      }
      continue;
    }

    if (isConstriction && efetivacao <= asOfIso) {
      if (parcOngoing) {
        memPush(memory, effectDate, meta.label, 'Constrição na vigência do parcelamento — exigibilidade suspensa (art. 151, VI). O quinquênio só volta a fluir da rescisão.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
        continue;
      }
      const restartClock = parcMode && parcRestartAt;
      if (!marco && !restartClock) {
        memPush(memory, effectDate, meta.label, idpjAsInterrupt
          ? 'Constrição no incidente sem ciclo do art. 40 em curso — não inaugura a intercorrente.'
          : 'Constrição/citação efetiva sem ciclo do art. 40 em curso — não inaugura a intercorrente (Tema 566). Originária já interrompida pelo ajuizamento (Tema 383).');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'pre_marco' });
        continue;
      }
      const prescEnd = intercorrenteWindowEnd({
        marco,
        parcRestartAt: restartClock ? parcRestartAt : null,
        pauses,
        beforeIso: effectDate,
        mode: restartMode
      });
      if (prescEnd && effectDate > prescEnd) {
        tooLate = true;
        memPush(memory, effectDate, meta.label, restartClock
          ? 'Pedido fora da janela contada do reinício — não salva o feito.'
          : 'Pedido fora da janela de 1+5 anos — não salva o feito.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'consumado' });
      } else {
        interrupted = true;
        interruptAt = effectDate;
        interruptEffAt = efetivacao;
        interruptVia = type;
        interruptSource = evt._inheritedFromIDPJ || null;
        parcMode = false;
        parcOngoing = false;
        restartKind = null;
        const retro = asIso(evt.requestDate) && asIso(evt.requestDate) !== efetivacao
          ? ` Retroage ao pedido (${fmtDate(evt.requestDate)}).` : '';
        memPush(memory, effectDate, meta.label, idpjAsInterrupt
          ? `A constrição no incidente vale como interrupção desta execução — ciclo encerrado.${retro}`
          : `INTERROMPE a intercorrente — ciclo encerrado.${retro}`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'interrompido' });
      }
      continue;
    }

    if (type === 'int_rescisao_parcelamento') {
      noteParcRule();
      let at = efetivacao;
      if (scenario === 'cedo') {
        const inad = asIso(evt.defaultDate);
        if (inad && inad < efetivacao) {
          at = inad;
          addMotivo(motivos, 'A1');
        }
      }
      parcMode = true;
      parcOngoing = false;
      parcRestartAt = at;
      restartKind = 'parcelamento';
      restartMode = restartModeFor('parcelamento');
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      memPush(memory, at, meta.label, restartMode === PARC_RESTART_FIVE_ONLY
        ? `Rescisão: exigibilidade restabelecida. Conta-se 5 anos${at !== efetivacao ? ' a partir do inadimplemento' : ''}.`
        : 'Rescisão: exigibilidade restabelecida. Ciclo pós-parcelamento (política): 1+5, por equiparação — não é marco do art. 40.');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'prescricao_correndo' });
      continue;
    }

    if (type === 'int_pedido_parcelamento' || DECLARED_INTERRUPT_TYPES.has(type)) {
      const kind = type === 'int_pedido_parcelamento' ? 'pedido' : 'declarado';
      if (parcOngoing) {
        memPush(memory, efetivacao, meta.label, 'Na vigência do parcelamento o prazo não corre; o ato não muda a contagem.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
        continue;
      }
      if (!marco && !(parcMode && parcRestartAt)) {
        memPush(memory, efetivacao, meta.label, 'Sem ciclo do art. 40 em curso — interrompe a ordinária, mas não inaugura a intercorrente.');
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'pre_marco' });
        continue;
      }
      parcMode = true;
      parcOngoing = false;
      parcRestartAt = efetivacao;
      restartKind = kind;
      restartMode = restartModeFor(kind);
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      memPush(memory, efetivacao, meta.label, kind === 'pedido'
        ? `Pedido de parcelamento sem deferimento: interrompe na data do pedido, sem pausa (Súmula 653). Conta-se ${restartMode === PARC_RESTART_FIVE_ONLY ? '5 anos' : '1 ano + 5 anos'}.`
        : 'Ato interruptivo que você declarou (art. 174, p.ú., IV, CTN): o prazo recomeça e conta 5 anos.');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'prescricao_correndo' });
      continue;
    }

    if (meta.category === 'interruptiva') {
      if (type === 'int_protesto_extrajudicial') {
        memPush(memory, effectDate, meta.label, protestoExtrajudicialInterrompe(efetivacao)
          ? 'Interrompe a originária (LC 208/2024, a partir de 03/07/2024). Na intercorrente, o Tema 568 não lista o protesto como interruptivo do ciclo do art. 40.'
          : `Anterior à vigência da LC 208/2024 (${fmtDate(LC208_VIGENCIA)}) — não interrompe.`);
        timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: marco || parcMode ? 'prescricao_correndo' : 'pre_marco' });
        continue;
      }
      memPush(memory, effectDate, meta.label, 'Causa interruptiva do art. 174 — na intercorrente não encerra o ciclo do art. 40 (salvo constrição/citação efetiva).');
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: marco || parcMode ? 'prescricao_correndo' : 'pre_marco' });
      continue;
    }

    if (isAdesaoType(type)) {
      noteParcRule();
      const resolved = scenarioSuspEnd(evt, asOfIso, inferredEnds, scenario, motivos, inadByResc);
      const inferred = inferredEnds.get(evt.id);
      lastParcAdesao = efetivacao;
      parcMode = true;
      restartKind = 'parcelamento';
      interrupted = false;
      interruptAt = null;
      tooLate = false;
      if (resolved.ongoing) {
        parcOngoing = true;
        parcRestartAt = null;
      } else {
        parcOngoing = false;
        parcRestartAt = resolved.rawEnd || efetivacao;
        restartMode = resolved.presumed ? PARC_RESTART_FIVE_ONLY : restartModeFor('parcelamento');
      }
      const until = resolved.rawEnd ? fmtDate(resolved.rawEnd) : 'hoje';
      const inferTag = resolved.presumed
        ? ' (leitura cedo: rescisão presumida logo após a última conferência)'
        : (inferred ? ` (cessação inferida — ${inferred.reason === 'rescisao' ? 'rescisão posterior' : 'adesão seguinte'})` : '');
      const modoTxt = restartMode === PARC_RESTART_FIVE_ONLY ? 'só 5 anos' : '1 ano + 5 anos';
      memPush(memory, efetivacao, meta.label, resolved.ongoing
        ? `INTERROMPE a intercorrente (art. 174, p.ú., IV CTN; Súmula 653) e suspende a exigibilidade enquanto vigente (art. 151, VI). Após a rescisão, ciclo pós-parcelamento (política): ${modoTxt}.`
        : `INTERROMPE a intercorrente. Vigente até ${until}${inferTag}. Ciclo pós-parcelamento: ${modoTxt} a partir de ${fmtDate(parcRestartAt)}.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: resolved.ongoing ? 'suspenso' : 'prescricao_correndo' });
      continue;
    }

    if (type === IDPJ_STAY_TYPE) {
      const from = asIso(evt.requestDate) || efetivacao;
      memPush(memory, from, meta.label, `Suspende a execução (IDPJ/cautelar), mesmo sem constrição. Não interrompe o ciclo. A intercorrente pausa até ${evt.endDate ? fmtDate(evt.endDate) : 'o fim do incidente'}.`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    if (meta.category === 'suspensiva') {
      const from = asIso(evt.requestDate) || efetivacao;
      memPush(memory, from, meta.label, type === 'susp_falencia_decretada' && scenario === 'cedo'
        ? 'Falência: a leitura cedo não conta a pausa.'
        : `Suspende o cômputo até ${evt.endDate ? fmtDate(evt.endDate) : 'hoje'} (art. 151 / causa diversa do art. 40).`);
      timeline.push({ ...evt, effect: memory[memory.length - 1].effect, phase: 'suspenso' });
      continue;
    }

    timeline.push({ ...evt, effect: meta.desc || 'Registro informativo', phase: marco || parcMode ? 'prescricao_correndo' : 'pre_marco' });
  }

  const activeNow = pauses.filter(p => p.ongoing);

  if (parcOngoing) {
    memPush(memory, lastParcAdesao, 'Dies a quo', 'Pedido/adesão ao parcelamento — interrupção (art. 174, p.ú., IV).');
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: 'calculo_validado',
      phase: 'suspenso',
      status: 'suspenso',
      diesAQuo: lastParcAdesao,
      diesAdQuem: null,
      computedDiesAdQuem: null,
      daysLeft: null,
      detail: 'Parcelamento vigente. O prazo não corre. Na rescisão, conta-se 1 ano + 5 anos.',
      memory, gaps, timeline,
      prescriptionInterrupted: true,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    }, ctx());
  }

  if (interrupted && !tooLate) {
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: 'calculo_validado',
      phase: 'interrompido',
      status: 'interrompido',
      diesAQuo: marco,
      diesAdQuem: null,
      computedDiesAdQuem: null,
      daysLeft: null,
      interruptAt,
      interruptEffAt,
      interruptVia,
      interruptSource,
      detail: `Prazo encerrado (${interruptVia === IDPJ_CONSTRICTION_TYPE ? 'constrição no incidente' : 'constrição/citação efetiva'}${interruptAt ? ' em ' + fmtDate(interruptAt) : ''}). Vigiar nova inércia; só reinicia com nova ciência de não localização ou de ausência de bens.`,
      memory, gaps, timeline,
      prescriptionInterrupted: true,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    }, { ...ctx(), cycleKind: 'art40' });
  }

  if (parcMode && parcRestartAt) {
    const { art40End, diesAdQuem: diesAdQuemComputed } = addParcCycle(parcRestartAt, pauses, restartMode);
    const daysLeft = daysUntil(diesAdQuemComputed, asOfIso);
    const activeBeforeTerm = activeNow.filter(p => !diesAdQuemComputed || p.start < diesAdQuemComputed);
    const estimated = !!(flags.includes(PRESC_FLAGS.PARC_SEM_FIM) && lastParcAdesao && parcRestartAt === lastParcAdesao);
    const five = restartMode === PARC_RESTART_FIVE_ONLY;
    const origemTxt = restartKind === 'pedido'
      ? 'pedido de parcelamento sem deferimento'
      : (restartKind === 'declarado' ? 'ato interruptivo declarado' : 'rescisão');
    let phase = 'correndo';
    if (estimated) phase = 'estimado';
    else if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
    else if (activeBeforeTerm.length) phase = 'suspenso';
    else if (!five && asOfIso < art40End) phase = 'suspensao_art40';
    memPush(memory, parcRestartAt, `Dies a quo (${origemTxt})`, five
      ? `Reinício pelo ${origemTxt}: 5 anos a partir desta data.`
      : `Ciclo pós-parcelamento (política): 1+5 a partir do ${origemTxt}. Não é marco do art. 40 / Tema 566.`);
    if (!five) {
      memPush(memory, art40End, 'Fim do 1º ano', `1 ano civil de suspensão a partir do ${origemTxt} (modo 1+5).`);
    }
    memPush(memory, diesAdQuemComputed, 'Dies ad quem (calculado)', five
      ? '5 anos civis, descontadas pausas do art. 151.'
      : '5 anos civis após o ano de suspensão, descontadas outras causas do art. 151.');
    const prazoTxt = five ? '5 anos' : '1 ano + 5 anos';
    const detail = estimated
      ? `Parcelamento sem data de encerramento. Termo estimado: ${fmtDate(diesAdQuemComputed)} (pior caso: rescisão no dia da adesão). Conferir a data.`
      : (phase === 'suspenso'
        ? `Prazo pausado. Termo projetado: ${fmtDate(diesAdQuemComputed)}.`
        : (phase === 'suspensao_art40'
          ? `Primeiro ano após o reinício (${origemTxt}). O prazo de 5 anos começa em ${fmtDate(art40End)}. Termo: ${fmtDate(diesAdQuemComputed)}.`
          : (phase === 'consumado'
            ? `Prazo de ${prazoTxt} vencido em ${fmtDate(diesAdQuemComputed)} (após ${origemTxt}).`
            : `Prazo em curso desde ${fmtDate(parcRestartAt)} (${origemTxt}). Termo: ${fmtDate(diesAdQuemComputed)} (${daysLeft}d).`)));
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: estimated ? 'estimativa_pessimista' : 'calculo_validado',
      phase,
      status: statusFrom(estimated ? 'estimado' : (phase === 'suspensao_art40' ? 'correndo' : phase), daysLeft),
      diesAQuo: parcRestartAt,
      diesAdQuem: diesAdQuemComputed,
      computedDiesAdQuem: diesAdQuemComputed,
      daysLeft,
      detail,
      memory, gaps, timeline,
      estimated,
      prescriptionInterrupted: false,
      prescDaysConsumed: Math.max(0, yearSpanDays(parcRestartAt, five ? 5 : 6) - Math.max(0, daysLeft || 0)),
      suspDaysConsumed: 0,
      activeSuspensions: activeBeforeTerm.map(p => p.id),
      incidents
    }, { ...ctx(), cycleKind: 'politica_parc' });
  }

  if (!marco) {
    gaps.push('Sem marco de não localização / ausência de bens. Intercorrente não iniciada (Tema 566). Originária interrompida pelo ajuizamento (Tema 383).');
    return sealIntercorrente({
      segment: 'intercorrente',
      origin: 'estimativa',
      phase: 'nao_iniciado',
      status: 'indeterminado',
      diesAQuo: asIso(exec.protocolDate) || null,
      diesAdQuem: null,
      computedDiesAdQuem: null,
      daysLeft: null,
      detail: 'Ainda sem ciência de não localização ou de ausência de bens. O ajuizamento não inicia o prazo de 1 ano + 5 anos.',
      memory, gaps, timeline,
      prescriptionInterrupted: false,
      prescDaysConsumed: 0,
      suspDaysConsumed: 0,
      activeSuspensions: activeNow.map(p => p.id)
    }, { ...ctx(), cycleKind: null });
  }

  const { art40End, diesAdQuem: prescEndComputed } = addArt40PlusFive(marco, pauses);
  const daysLeft = daysUntil(prescEndComputed, asOfIso);

  let phase;
  if (daysLeft != null && daysLeft <= 0) phase = 'consumado';
  else if (activeNow.filter(p => !prescEndComputed || p.start < prescEndComputed).length) phase = 'suspenso';
  else if (asOfIso < art40End) phase = 'suspensao_art40';
  else phase = 'correndo';

  const unpaused = Math.max(0, daysBetween(marco, asOfIso) - pauseIntervals(pauses).reduce((s, p) => {
    const a = p.start < marco ? marco : p.start;
    const b = (p.end || asOfIso) > asOfIso ? asOfIso : (p.end || asOfIso);
    return s + (b > a ? daysBetween(a, b) : 0);
  }, 0));
  const art40Need = yearSpanDays(marco, 1);
  const suspDaysConsumed = Math.min(art40Need, unpaused);
  const prescDaysConsumed = Math.max(0, unpaused - art40Need);

  memPush(memory, marco, 'Dies a quo (marco)', marcoFromSuspArt40
    ? 'Ciência inferida do evento “suspensão art. 40” (sem marco cadastrado). Conferir nos autos.'
    : 'Ciência da não localização / ausência de bens.');
  memPush(memory, art40End, 'Fim da suspensão art. 40', '1 ano civil, descontadas pausas do art. 151 / IDPJ.');
  memPush(memory, prescEndComputed, 'Dies ad quem (calculado)', '5 anos civis após o ano do art. 40.');

  let detail;
  if (phase === 'suspenso') detail = `Prazo pausado. Termo projetado: ${fmtDate(prescEndComputed)}.`;
  else if (phase === 'suspensao_art40') detail = `Primeiro ano após a ciência. O prazo de 5 anos começa em ${fmtDate(art40End)}. Termo: ${fmtDate(prescEndComputed)}.`;
  else if (phase === 'consumado') detail = `Prazo de 1 ano + 5 anos vencido em ${fmtDate(prescEndComputed)}.`;
  else detail = `Prazo em curso. Termo: ${fmtDate(prescEndComputed)} (${daysLeft}d).`;

  return sealIntercorrente({
    segment: 'intercorrente',
    origin: 'calculo_validado',
    phase,
    status: statusFrom(phase === 'suspensao_art40' ? 'correndo' : phase, daysLeft),
    diesAQuo: marco,
    diesAdQuem: prescEndComputed,
    computedDiesAdQuem: prescEndComputed,
    daysLeft,
    detail,
    memory, gaps, timeline,
    prescriptionInterrupted: false,
    prescDaysConsumed,
    suspDaysConsumed,
    activeSuspensions: activeNow.map(p => p.id)
  }, { ...ctx(), cycleKind: 'art40' });
}

export function createPrescLookup(debts, executions, events = [], asOf) {
  const map = new Map();
  const execs = executions || [];
  const evts = events || [];
  const collectIndex = buildPrescCollectIndex(execs, evts);
  for (const d of debts || []) {
    if (!d || !d.id) continue;
    map.set(d.id, computePrescription({ debt: d, executions: execs, events: evts, asOf, collectIndex }));
  }
  const get = (debt) => {
    if (!debt) return emptyResult();
    if (debt.id && map.has(debt.id)) return map.get(debt.id);
    return computePrescription({ debt, executions: execs, events: evts, asOf, collectIndex });
  };
  get.date = (debt) => {
    if (!debt) return '';
    const r = get(debt);
    return (r && r.diesAdQuem) || '';
  };
  return get;
}

/** Compatível com getPrescDate antigo: devolve ISO ou ''. */
export function createPrescDateLookup(debts, executions, events = [], asOf) {
  const lookup = createPrescLookup(debts, executions, events, asOf);
  return (debt) => lookup.date(debt);
}

/**
 * Adaptador do KPI por execução: pior status entre as CDAs do feito;
 * se não houver CDA, usa só os eventos da execução (via CDA sintética).
 */
export function calcPrescription(executionId, events, extra = {}) {
  const { debts = [], executions = [], asOf } = extra;
  const exec = executions.find(e => e.id === executionId);
  const cdas = (debts || []).filter(d => exec && d.processNumber && sameProc(d.processNumber, exec.processNumber));
  const targets = cdas.length ? cdas : [{ id: '_exec_' + executionId, processNumber: exec && exec.processNumber, inscriptionDate: exec && exec.protocolDate }];
  const results = targets.map(d => computePrescription({ debt: d, executions, events, asOf }));
  const rank = { prescrito: 0, critico: 1, alerta: 2, indeterminado: 3, interrompido: 3, suspenso: 4, correndo: 5, seguro: 6, sem_dados: 7 };
  results.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
  const best = results[0] || emptyResult({ detail: 'Sem eventos registrados.' });
  const phaseMap = {
    nao_iniciado: 'pre_marco',
    suspensao_art40: 'suspensao_art40',
    correndo: 'prescricao_correndo',
    originario: 'prescricao_correndo',
    consumado: 'prescrito',
    interrompido: 'interrompido',
    suspenso: 'prescricao_correndo',
    sem_dados: 'pre_marco'
  };
  return {
    status: best.status,
    daysLeft: best.daysLeft,
    timeline: best.timeline,
    detail: best.detail,
    phase: phaseMap[best.phase] || 'pre_marco',
    prescDaysConsumed: best.prescDaysConsumed,
    suspDaysConsumed: best.suspDaysConsumed,
    prescriptionInterrupted: best.prescriptionInterrupted,
    activeSuspensions: best.activeSuspensions,
    _computed: best
  };
}

export function attachPrescriptionSnapshots(data, asOf) {
  if (!data || !Array.isArray(data.debts)) return data;
  const lookup = createPrescLookup(data.debts, data.executions || [], data.prescriptionEvents || [], asOf);
  const collectIndex = buildPrescCollectIndex(data.executions || [], data.prescriptionEvents || []);
  const computedAt = asIso(asOf) || localIso(new Date());
  data.debts.forEach(d => {
    const r = lookup(d);
    const alert = classifyPainelPrescAlert(d, data.executions || [], data.prescriptionEvents || [], asOf, r, { collectIndex });
    const kind = alert && alert.kind;
    const row = {
      prescKind: kind,
      checks: r.checks || (alert && alert.checks) || [],
      incident: (alert && alert.incident) || ((r.incidents && r.incidents[0]) || null),
      informedConflict: !!r.informedConflict,
      incidentOnly: (r.gaps || []).some(g => /coincide com um IDPJ/i.test(g)),
      prescDate: alert ? alert.date : (r.diesAdQuem || ''),
      interruptAt: r.interruptAt || ''
    };
    const group = kind ? groupOfKind(kind, row) : 0;
    const key = prazosKeyMeta(kind, row);
    const classified = applyConsumadaClassification({
      ...row,
      group,
      prescDays: r.daysLeft,
      prescKind: kind || ''
    });
    d.prescriptionSnapshot = {
      diesAdQuem: r.diesAdQuem || '',
      daysLeft: r.daysLeft,
      origin: r.origin,
      phase: r.phase,
      segment: r.segment,
      status: r.status,
      detail: r.detail,
      flags: r.flags || [],
      cycleKind: r.cycleKind || null,
      scenario: r.summary || r.scenario || '',
      summary: r.summary || '',
      checks: r.checks || [],
      estimated: !!r.estimated,
      incidents: r.incidents || [],
      group: classified.group,
      consumada: classified.consumada || '',
      prescKind: kind || '',
      keyDate: key.date || '',
      keyLabel: key.label || '',
      firstCheck: ((openChecks(r.checks, d.prescChecks)[0] || {}).text) || '',
      incident: row.incident,
      computedAt
    };
  });
  return data;
}

export function migratePrescriptionEvents(events) {
  const constriction = new Set(['int_penhora', 'int_arresto', 'int_sisbajud', 'int_cnib']);
  return (events || []).map(ev => {
    if (!ev) return ev;
    let next = ev;
    if (ev.type === 'int_citacao_devedor') next = { ...next, type: 'int_citacao' };
    if (next._inheritedFromIDPJ && constriction.has(next.type)) {
      next = {
        ...next,
        type: IDPJ_CONSTRICTION_TYPE,
        requestDate: next.requestDate || next.date,
        _migratedIdpjConstriction: true
      };
    }
    return next;
  });
}

/** Eventos de constrição no IDPJ/MCF viram suspensão nas EFs, com retroação ao pedido. */
export function idpjPropagationPayload(sourceEvent) {
  const type = normalizePrescEventType(sourceEvent.type);
  if (type === IDPJ_STAY_TYPE) return { ...sourceEvent, type: IDPJ_STAY_TYPE };
  const isConstriction = EF_CONSTRICTION_TYPES.has(type) || type === IDPJ_CONSTRICTION_TYPE;
  if (!isConstriction) return { ...sourceEvent };
  return {
    ...sourceEvent,
    type: IDPJ_CONSTRICTION_TYPE,
    requestDate: sourceEvent.requestDate || sourceEvent.date,
    date: sourceEvent.date
  };
}

export const shouldPropagateIdpjAsSuspension = (type) => {
  const t = normalizePrescEventType(type);
  return EF_CONSTRICTION_TYPES.has(t) || t === IDPJ_CONSTRICTION_TYPE || t === IDPJ_STAY_TYPE;
};

// ═══════════════════════════════════════════════════════════════════════════
// DECADÊNCIA (arts. 150, §4º, e 173 CTN) e PRESCRIÇÃO ORDINÁRIA (art. 174 CTN)
// ═══════════════════════════════════════════════════════════════════════════

const decResult = (over = {}) => ({
  segment: 'decadencia', rule: '', status: 'sem_dados', origin: 'estimativa',
  diesAQuo: null, diesAdQuem: null, daysLeft: null, detail: '', memory: [], gaps: [], ...over
});

/**
 * Decadência do direito de constituir o crédito.
 * Âncoras: debt.launchMode (regra), debt.taxPeriodEnd (fato gerador / decisão
 * anulatória no 173, II), debt.constitutionDate (constituição definitiva).
 */
function withDecadenciaView(r, debt) {
  if (!r) return r;
  const mode = debt && debt.launchMode && LAUNCH_MODES[debt.launchMode] ? debt.launchMode : '';
  const anchor = asIso(debt && debt.taxPeriodEnd);
  const constitution = debt ? lancamentoDate(debt) : '';
  const inscription = asIso(debt && debt.inscriptionDate);
  const checks = [];
  const occurrences = [];
  let summary = r.detail || '';
  if (!anchor && !mode) {
    summary = 'Não calculada: faltam período de apuração e modalidade de lançamento.';
    checks.push('Informar período de apuração e modalidade de lançamento na inscrição.');
  } else if (!anchor) {
    summary = 'Não calculada: falta o período de apuração.';
    checks.push('Informar o período de apuração na inscrição.');
  } else if (!mode) {
    summary = r.status === 'sem_dados'
      ? 'Não calculada: falta a modalidade de lançamento.'
      : (r.status === 'obstada' && constitution
        ? `Crédito constituído em ${fmtDate(constitution)}, dentro do prazo.`
        : r.status === 'consumada' && constitution
          ? `Constituição em ${fmtDate(constitution)}, depois do fim do prazo.`
          : `Prazo em curso. Modalidade de lançamento não informada; aplicada a regra geral.`);
    checks.push('Informar a modalidade de lançamento na inscrição.');
  } else if (mode === 'declarado') {
    summary = 'Crédito constituído pela declaração do contribuinte. Não há decadência a discutir.';
  } else if (r.status === 'obstada' && constitution) {
    summary = `Crédito constituído em ${fmtDate(constitution)}, dentro do prazo.`;
  } else if (r.status === 'obstada' && inscription) {
    summary = `Inscrição em ${fmtDate(inscription)}, anterior ao fim do prazo. Constituição não informada.`;
    checks.push('Informar a data de constituição definitiva na inscrição.');
  } else if (r.status === 'consumada' && constitution) {
    summary = `Constituição em ${fmtDate(constitution)}, depois do fim do prazo.`;
  } else if (r.diesAdQuem) {
    summary = r.daysLeft != null && r.daysLeft <= 0
      ? `Prazo vencido em ${fmtDate(r.diesAdQuem)} sem constituição registrada.`
      : `Prazo em curso até ${fmtDate(r.diesAdQuem)}.`;
  }
  if (constitution && (r.status === 'obstada' || r.status === 'consumada')) {
    occurrences.push({
      date: constitution,
      fact: 'Constituição definitiva',
      effect: r.status === 'consumada' ? 'depois do fim do prazo' : 'encerra a decadência se dentro do prazo',
      source: 'processo'
    });
  }
  return {
    ...r,
    summary,
    occurrences,
    estimates: [],
    checks,
    rulesApplied: ['R1'],
    ruleVersion: RULE_VERSION,
    scenario: summary
  };
}

export function checkId(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

export function allCheckItems(checks, prescChecks) {
  const doneMap = new Map((prescChecks || []).filter(c => c && c.id).map(c => [c.id, c.doneAt || '']));
  return (checks || []).map(text => {
    const id = checkId(text);
    return { id, text, doneAt: doneMap.get(id) || '' };
  });
}

export function openChecks(checks, prescChecks) {
  return allCheckItems(checks, prescChecks).filter(c => !c.doneAt);
}

const COL_TITLES = {
  decadencia: 'Decadência',
  ordinaria: 'Prescrição ordinária',
  intercorrente: 'Intercorrente'
};

/** Base legal discreta (tooltip) de cada coluna. */
const COL_BASIS = {
  decadencia: 'Arts. 150, §4º, e 173 do CTN; Súmulas 555 e 622/STJ',
  ordinaria: 'Art. 174 do CTN; Súmulas 436 e 653/STJ; Tema 383/STJ',
  intercorrente: 'Art. 40 da LEF; Súmula 314/STJ; Temas 566 a 571/STJ'
};

/** Faixa cedo–tarde com datas diferentes (a faixa “incerta” de mesma data não muda o selo). */
function bandIsOpen(band) {
  if (!band || !band.cedo || !band.tarde) return false;
  return (band.cedo.diesAdQuem || '') !== (band.tarde.diesAdQuem || '') || band.cedo.phase !== band.tarde.phase;
}

function bandView(seg) {
  const band = seg && seg.band;
  if (!band) return null;
  const lbl = (p) => (p && p.diesAdQuem ? fmtDate(p.diesAdQuem) : (p && p.phase === 'suspenso' ? 'pausado, sem termo' : 'sem termo'));
  const motivos = (band.motivos || []).map(m => m.texto);
  const open = bandIsOpen(band);
  return {
    open,
    kind: band.kind,
    alarme: band.alarme !== false,
    cedo: band.cedo ? band.cedo.diesAdQuem || '' : '',
    tarde: band.tarde ? band.tarde.diesAdQuem || '' : '',
    motivos,
    line: open
      ? 'Data cedo ' + lbl(band.cedo) + ' · data tarde ' + lbl(band.tarde) + (band.alarme === false ? ' (sem alarme)' : '')
      : 'Data provável ' + lbl(band.tarde) + ', sem o dado que a confirmaria'
  };
}

function columnSeal(key, seg) {
  if (!seg) return 'sem dados';
  if (bandIsOpen(seg.band)) return 'faixa';
  if (key === 'decadencia' && seg.rule === 'declarado') return 'calculado';
  if (key === 'decadencia' && (seg.status === 'sem_dados' || (!seg.diesAQuo && !seg.diesAdQuem))) return 'sem dados';
  if (seg.phase !== 'interrompido' && (seg.estimated || seg.phase === 'estimado' || seg.origin === 'estimativa_pessimista')) return 'estimado';
  if (seg.origin === 'estimativa' && key !== 'decadencia') return 'estimado';
  if (seg.status === 'sem_dados' && !seg.diesAdQuem && seg.phase !== 'interrompido') return 'sem dados';
  return 'calculado';
}

function columnDates(key, seg) {
  if (key === 'decadencia') {
    if (!seg.diesAQuo && !seg.diesAdQuem) return { start: '—', end: '—' };
    return {
      start: seg.diesAQuo ? fmtDate(seg.diesAQuo) : 'sem data de início',
      end: seg.diesAdQuem ? fmtDate(seg.diesAdQuem) : 'sem termo'
    };
  }
  if (key === 'ordinaria') {
    const start = seg.diesAQuo ? fmtDate(seg.diesAQuo) : 'sem data de início';
    let end = 'sem termo calculado';
    if (seg.phase === 'interrompido') {
      const aj = (seg.occurrences || []).find(o => o.fact === 'Ajuizamento');
      end = aj && aj.date ? 'interrompido em ' + fmtDate(aj.date) : 'interrompido pela propositura';
    } else if (seg.diesAdQuem) end = fmtDate(seg.diesAdQuem);
    return { start, end };
  }
  const hasCiencia = (seg.occurrences || []).some(o =>
    /^Ciência /i.test(o.fact || '') || /vale como ciência/i.test(o.effect || '')
  ) || !!((seg.cycleKind === 'art40' || seg.cycleKind === 'politica_parc') && seg.diesAQuo && seg.phase && seg.phase !== 'nao_iniciado');
  const start = hasCiencia && seg.diesAQuo ? fmtDate(seg.diesAQuo) : 'sem ciência lançada';
  let end = 'sem termo calculado';
  if (seg.phase === 'interrompido') end = '—';
  else if (seg.diesAdQuem) end = fmtDate(seg.diesAdQuem);
  return { start, end };
}

export function buildCdaColumnView(seg, { key, prescChecks } = {}) {
  const title = COL_TITLES[key] || key;
  const seal = columnSeal(key, seg);
  const dates = columnDates(key, seg);
  const datesLine = key === 'decadencia' && dates.start === '—' && dates.end === '—'
    ? '—'
    : 'Início: ' + dates.start + ' · Fim: ' + dates.end;
  const estimates = (seg.estimates || []).map(e => ({
    label: e.label,
    date: e.date,
    how: e.how,
    line: (e.label + (e.date ? ' ' + fmtDate(e.date) : '') + (e.how ? ' — ' + e.how : '')).replace(/\s+/g, ' ').trim()
  }));
  const checks = allCheckItems(seg.checks, prescChecks);
  const occurrences = (seg.occurrences || []).map(o => ({
    ...o,
    dateLabel: o.date ? fmtDate(o.date) : '',
    // Não exibir "processo"/"evento": a CDA já está no processo e o fato já nomeia o evento.
    sourceLabel: o.source && /IDPJ|MCF|planilha|Análise/i.test(o.source) ? o.source : ''
  }));
  return {
    key,
    title,
    seal,
    summary: seg.summary || '',
    dates,
    datesLine,
    band: bandView(seg),
    basis: COL_BASIS[key] || '',
    occurrences,
    estimates,
    checks,
    footer: 'Regras v' + RULE_VERSION
  };
}

/**
 * Régua do tempo: fatos, pausas e a faixa cedo–tarde de um relógio.
 * Modelo puro; a tela só desenha. Datas ISO.
 */
export function buildPrescRulerModel(seg, asOf) {
  if (!seg) return null;
  const today = asIso(asOf) || localIso(new Date());
  const band = seg.band && bandIsOpen(seg.band) ? seg.band : null;
  const termo = seg.diesAdQuem || '';
  const facts = [];
  const pauses = [];
  for (const o of seg.occurrences || []) {
    if (o && o.date) facts.push({ date: o.date, label: o.fact + (o.effect ? ' — ' + o.effect : '') });
  }
  for (const ev of seg.timeline || []) {
    const t = normalizePrescEventType(ev && ev.type);
    const meta = PRESC_EVENT_TYPES[t];
    if (!meta || meta.category !== 'suspensiva' || t === 'susp_art40' || t === IDPJ_CONSTRICTION_TYPE) continue;
    const from = asIso(ev.requestDate) || asIso(ev.date);
    if (!from || from > today) continue;
    const end = asIso(ev.endDate);
    pauses.push({ from, to: end && end < today ? end : today, open: !end, label: meta.label });
  }
  const dates = [seg.diesAQuo, termo, today, band && band.cedo && band.cedo.diesAdQuem, band && band.tarde && band.tarde.diesAdQuem,
    ...facts.map(f => f.date), ...pauses.map(p => p.from)].map(asIso).filter(Boolean).sort();
  if (!dates.length) return null;
  const start = asIso(seg.diesAQuo) || dates[0];
  const last = dates[dates.length - 1];
  if (!(last > start)) return null;
  return {
    start: start < dates[0] ? start : dates[0],
    end: last,
    today,
    phase: seg.phase || '',
    termo,
    cedo: band && band.cedo ? band.cedo.diesAdQuem || '' : '',
    tarde: band && band.tarde ? band.tarde.diesAdQuem || '' : '',
    bandKind: band ? band.kind : '',
    facts: facts.sort((a, b) => a.date.localeCompare(b.date)),
    pauses
  };
}

export function cdaDetailSnapshot(timeline, prescChecks) {
  const parts = [];
  ['decadencia', 'ordinaria', 'intercorrente'].forEach(key => {
    if (!timeline[key]) return;
    const col = buildCdaColumnView(timeline[key], { key, prescChecks });
    parts.push('## ' + col.title);
    parts.push('Selo: ' + col.seal);
    parts.push('Situação: ' + col.summary);
    parts.push('Datas: ' + col.datesLine);
    parts.push('Ocorrências: ' + (col.occurrences.length
      ? col.occurrences.map(o => [o.dateLabel, o.fact, o.effect].filter(Boolean).join(' · ')).join(' | ')
      : 'nenhuma'));
    if (col.estimates.length) parts.push('Estimativas: ' + col.estimates.map(e => e.line).join(' | '));
    const open = col.checks.filter(c => !c.doneAt);
    parts.push('Conferir: ' + (open.length ? open.map(c => c.text).join(' | ') : 'nenhuma'));
  });
  return parts.join('\n');
}

export const UI_FORBIDDEN = /Tema|Súmula|política|\bpiso\b|\bteto\b|\bdies\b|\bmarco\b|CENÁRIO/i;

export function computeDecadencia(debt, asOf) {
  const tarde = computeDecadenciaCore(debt, asOf, 'vencimento');
  const view = withDecadenciaView(tarde, debt);
  if (tarde.startFrom === 'vencimento') {
    const cedo = computeDecadenciaCore(debt, asOf, 'fato_gerador');
    if (cedo.diesAdQuem && cedo.diesAdQuem !== tarde.diesAdQuem) {
      const point = (x) => ({ diesAdQuem: x.diesAdQuem, daysLeft: x.daysLeft != null ? x.daysLeft : daysUntil(x.diesAdQuem, asIso(asOf) || localIso(new Date())), phase: x.status });
      view.band = {
        cedo: point(cedo),
        tarde: point(tarde),
        motivos: [{ code: 'D3', ...BAND_MOTIVOS.D3 }],
        kind: 'tese',
        // A decadência nunca alarma.
        alarme: false
      };
    }
  }
  return view;
}

/** Lançamento que obsta a decadência: notificação do lançamento ou a constituição informada. */
function lancamentoDate(debt) {
  return asIso(debt.assessmentNoticeDate) || asIso(debt.constitutionDate);
}

function computeDecadenciaCore(debt, asOf, yearFrom = 'fato_gerador') {
  if (!debt) return decResult({ detail: 'Sem dados.' });
  const asOfIso = asIso(asOf) || localIso(new Date());
  const memory = [];
  const gaps = [];
  const mode = LAUNCH_MODES[debt.launchMode] ? debt.launchMode : '';
  const anchor = asIso(debt.taxPeriodEnd);
  const constitution = lancamentoDate(debt);
  const inscription = asIso(debt.inscriptionDate);
  const venc = asIso(debt.dueDate);

  if (mode === 'declarado') {
    memPush(memory, constitution || anchor || null, 'Crédito declarado pelo contribuinte',
      'Súmula 436/STJ — a entrega da declaração constitui o crédito, dispensado lançamento. Não há decadência a discutir.');
    return decResult({
      rule: 'declarado', status: 'obstada',
      origin: constitution ? 'calculo_validado' : 'estimativa',
      detail: 'Decadência prejudicada — crédito constituído pela própria declaração (Súmula 436/STJ).',
      memory, gaps
    });
  }

  if (!anchor) {
    gaps.push('Sem período de apuração/fato gerador' + (mode ? '' : ' nem modalidade de lançamento') + ' — informe na inscrição para calcular a decadência.');
    return decResult({ rule: mode ? LAUNCH_MODES[mode].rule : '', detail: 'Sem âncoras para o cálculo da decadência.', memory, gaps });
  }

  const rule = mode ? LAUNCH_MODES[mode].rule : '173_1';
  if (!mode) gaps.push('Modalidade de lançamento não informada — aplicada a regra geral do art. 173, I, CTN (Súmula 555/STJ).');

  let diesAQuo;
  let startFrom = '';
  if (rule === '150_4') {
    diesAQuo = anchor;
    memPush(memory, diesAQuo, 'Dies a quo — fato gerador', 'Art. 150, §4º, CTN: homologação com pagamento antecipado (Tema 163/STJ). Dolo/fraude comprovados deslocam para o art. 173, I.');
  } else if (rule === '173_2') {
    diesAQuo = anchor;
    memPush(memory, diesAQuo, 'Dies a quo — decisão anulatória definitiva', 'Art. 173, II, CTN: novo quinquênio após anulação por vício formal.');
  } else {
    const byVenc = yearFrom === 'vencimento' && venc && venc.slice(0, 4) > anchor.slice(0, 4);
    const baseYear = parseInt((byVenc ? venc : anchor).slice(0, 4), 10);
    diesAQuo = `${baseYear + 1}-01-01`;
    startFrom = byVenc ? 'vencimento' : 'fato_gerador';
    memPush(memory, diesAQuo, 'Dies a quo — 1º dia do exercício seguinte', 'Art. 173, I, CTN' + (mode ? '' : ' (regra geral — Súmula 555/STJ)')
      + (byVenc ? `; exercício seguinte ao vencimento (${fmtDate(venc)})` : '; exercício seguinte ao fato gerador') + '.');
  }
  const diesAdQuem = addCalendarYears(diesAQuo, 5);
  memPush(memory, diesAdQuem, 'Termo final do quinquênio decadencial', '5 anos civis. A decadência não se suspende nem se interrompe.');
  const decOut = (over) => decResult({ startFrom, ...over });

  if (constitution) {
    if (constitution <= diesAdQuem) {
      memPush(memory, constitution, 'Constituição definitiva', 'Notificação/constituição dentro do quinquênio — decadência obstada (Súmula 622/STJ).');
      return decOut({
        rule, status: 'obstada', origin: 'calculo_validado', diesAQuo, diesAdQuem,
        detail: `Decadência obstada — constituição em ${fmtDate(constitution)}, dentro do quinquênio (termo final ${fmtDate(diesAdQuem)}).`,
        memory, gaps
      });
    }
    memPush(memory, constitution, 'Constituição definitiva', 'APÓS o termo final do quinquênio decadencial.');
    return decOut({
      rule, status: 'consumada', origin: 'calculo_validado', diesAQuo, diesAdQuem,
      detail: `Constituição em ${fmtDate(constitution)}, APÓS o termo final (${fmtDate(diesAdQuem)}) — decadência consumada (art. 156, V, CTN). Verificar a modalidade e eventual dolo/fraude (art. 173, I).`,
      memory, gaps
    });
  }

  if (inscription) {
    if (inscription <= diesAdQuem) {
      gaps.push('Sem data de constituição definitiva — presunção pela inscrição, anterior ao termo final. Confirmar a notificação do lançamento nos autos.');
      return decOut({
        rule, status: 'obstada', origin: 'estimativa', diesAQuo, diesAdQuem,
        detail: `Decadência presumidamente obstada — inscrição em ${fmtDate(inscription)}, anterior ao termo final (${fmtDate(diesAdQuem)}). Constituição necessariamente anterior à inscrição.`,
        memory, gaps
      });
    }
    gaps.push('Inscrição posterior ao termo final do quinquênio — apurar a data exata da constituição definitiva.');
    return decOut({
      rule, status: 'risco', origin: 'estimativa', diesAQuo, diesAdQuem,
      detail: `Inscrição (${fmtDate(inscription)}) posterior ao termo final (${fmtDate(diesAdQuem)}). Se a constituição também foi posterior, a decadência consumou-se — verificar.`,
      memory, gaps
    });
  }

  const daysLeft = daysUntil(diesAdQuem, asOfIso);
  gaps.push('Sem constituição nem inscrição informadas.');
  return decOut({
    rule, status: daysLeft != null && daysLeft <= 0 ? 'risco' : 'em_curso', origin: 'estimativa',
    diesAQuo, diesAdQuem, daysLeft,
    detail: daysLeft != null && daysLeft <= 0
      ? `Quinquênio decadencial vencido em ${fmtDate(diesAdQuem)} sem constituição registrada — verificar.`
      : `Prazo decadencial em curso até ${fmtDate(diesAdQuem)} (${daysLeft}d).`,
    memory, gaps
  });
}

/** Prescrição ordinária (art. 174 CTN) — mesmo motor do originário, com a checagem do ajuizamento. */
export function computeOrdinaria({ debt, executions = [], events = [], asOf, collectIndex } = {}) {
  if (!debt) return emptyResult();
  const asOfIso = asIso(asOf) || localIso(new Date());
  const idx = collectIndex || buildPrescCollectIndex(executions, events);
  const { exec, events: cdaEvents, incidents, incidentOnly } = collectEventsForCda(debt, executions, events, idx);
  const base = { debt, exec, cdaEvents, asOfIso, informed: exec ? '' : asIso(debt.prescriptionDate), incidents };
  const r = computeOriginario({ ...base, memory: [], gaps: [], timeline: [] });
  const motivos = [];
  const cedo = computeOriginario({ ...base, memory: [], gaps: [], timeline: [], scenario: 'cedo', motivos });
  r.band = buildBand(r, cedo, motivos);
  // CDA ajuizada: a ordinária aparece na coluna, mas não alarma.
  if (r.band && exec) r.band.alarme = false;
  r.incidentOnly = !!incidentOnly;
  return withCaseView(r, { debt, exec, asOfIso, incidents, cdaEvents, incidentOnly });
}

const LEGAL_SEVERITY = {
  prescrito: 6, consumada: 6, consumado: 6,
  critico: 5, alerta: 4, risco: 3,
  correndo: 2, em_curso: 2, originario: 2, interrompido: 2, indeterminado: 2, estimado: 3,
  suspenso: 1,
  seguro: 0, obstada: 0,
  sem_dados: -1
};
export const legalSeverity = (status) => (LEGAL_SEVERITY[status] != null ? LEGAL_SEVERITY[status] : -1);

/** Os três segmentos extintivos da CDA + o pior status para radar. */
export function computeCdaLegalTimeline({ debt, executions = [], events = [], asOf, collectIndex } = {}) {
  const idx = collectIndex || buildPrescCollectIndex(executions, events);
  const decadencia = computeDecadencia(debt, asOf);
  const ordinaria = computeOrdinaria({ debt, executions, events, asOf, collectIndex: idx });
  const { exec } = collectEventsForCda(debt, executions, events, idx);
  const intercorrente = exec ? computePrescription({ debt, executions, events, asOf, collectIndex: idx }) : null;
  const segs = [
    { key: 'decadencia', r: decadencia },
    { key: 'ordinaria', r: ordinaria },
    { key: 'intercorrente', r: intercorrente }
  ].filter(s => s.r);
  let worst = { key: null, status: 'sem_dados', sev: -1 };
  segs.forEach(s => {
    const sev = legalSeverity(s.r.status);
    if (sev > worst.sev) worst = { key: s.key, status: s.r.status, sev };
  });
  return { decadencia, ordinaria, intercorrente, exec: exec || null, worst };
}

const PAINEL_PRESC_WINDOW = 180;
const CDA_RECORTE_STATUS = new Set(['garantida', 'parcelada', 'negociada_sispar']);
const PAINEL_PRESC_KINDS = [
  'iminente', 'vencido', 'vencido_estimado', 'residual_alta', 'residual_media',
  'acompanhar_piso', 'inconsistencia', 'vigiar_interrompido',
  'pausa_cadastrada', 'avaliar_174', 'correndo', 'aguardando_reconhecimento',
  'pedido_dado', 'penhora_antiga'
];
const HANDLED_TERMINAL = new Set(['declarada', 'reconhecida', 'extinta']);

export const PRESC_SNOOZE_REASONS = {
  aguardando_certidao: 'Aguardando certidão',
  peca_protocolada: 'Peça protocolada',
  garantia_em_analise: 'Garantia em análise',
  nao_priorizar_agora: 'Não priorizar agora',
  outro: 'Outro'
};

export function snoozeLimitDays(group) {
  if (group === 1) return 14;
  if (group === 2) return 30;
  if (group === 3) return 7;
  if (group === 5) return 90;
  if (group === 6) return 90;
  return 30;
}

function resolvePolicy(opts) {
  if (!opts) return 'v1';
  if (opts === 'v2' || opts === 'v1') return opts;
  return opts.policy === 'v2' ? 'v2' : 'v1';
}

function resolveRadarTail(lookupOrOpts, opts) {
  if (lookupOrOpts && typeof lookupOrOpts !== 'function') {
    return { lookup: null, opts: lookupOrOpts || {} };
  }
  return { lookup: lookupOrOpts || null, opts: opts || {} };
}

function collectIndexFrom(fifth) {
  if (!fifth) return null;
  if (fifth.byCda && fifth.execByProc) return fifth;
  return fifth.collectIndex || null;
}

export function isPainelPrescCandidate(debt, executions, opts = {}) {
  if (!debt || debt.status === 'extinta') return false;
  const policy = resolvePolicy(opts);
  if (debt.prescriptionHandled) {
    const typ = debt.prescriptionHandledType || 'declarada';
    if (policy === 'v2' && typ === 'aguardando_reconhecimento') {
      // permanece candidata
    } else {
      return false;
    }
  }
  const execs = matchingExecsForDebt(debt, executions, opts && opts.collectIndex);
  if (execs.some(e => e && e.prescDecision && e.prescDecision.situation === 'DECLARADA')) return false;
  return true;
}

/** Ciclo do art. 40 já tem gatilho (marco ou quinquênio pós-parcelamento). */
function intercorrenteCycleStarted(inter) {
  if (!inter) return false;
  const p = inter.phase;
  if (!p || p === 'nao_iniciado' || p === 'sem_dados' || p === 'pre_marco') return false;
  return true;
}

function isOverdueResult(r) {
  if (!r || r.estimated || r.phase === 'estimado') return false;
  if (r.status === 'prescrito' || r.status === 'consumado' || r.status === 'consumada') return true;
  return r.diesAdQuem && r.daysLeft != null && r.daysLeft <= 0;
}

function isImminentResult(r, windowDays = PAINEL_PRESC_WINDOW) {
  if (!r || r.estimated || r.phase === 'estimado') return false;
  if (!r.diesAdQuem || r.daysLeft == null) return false;
  return r.daysLeft > 0 && r.daysLeft <= windowDays;
}

function matchingExecsForDebt(debt, executions, collectIndex) {
  if (!debt || !debt.processNumber) return [];
  const n = normProc(debt.processNumber);
  if (!n) return [];
  if (collectIndex && collectIndex.execsByProc) {
    return collectIndex.execsByProc.get(n) || [];
  }
  if (collectIndex && collectIndex.execByProc) {
    const one = collectIndex.execByProc.get(n);
    return one ? [one] : [];
  }
  return (executions || []).filter(e => e && normProc(e.processNumber) === n);
}

function eventTouchesDebt(ev, debt, execIds) {
  if (!ev) return false;
  if (ev.cdaId === debt.id) return true;
  if (ev.batchCdaIds && ev.batchCdaIds.includes(debt.id)) return true;
  return !!(ev.executionId && execIds.has(ev.executionId));
}

function eventsTouchingDebt(debt, execs, events, collectIndex) {
  if (collectIndex && (collectIndex.byCda || collectIndex.byExec)) {
    const seen = new Set();
    const out = [];
    const add = (ev) => {
      if (!ev) return;
      const key = ev.id || ev;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(ev);
    };
    for (const ev of collectIndex.byCda.get(debt && debt.id) || []) add(ev);
    for (const e of execs || []) {
      const fromExec = (collectIndex.byExec && collectIndex.byExec.get(e.id))
        || (collectIndex.byExecBare && collectIndex.byExecBare.get(e.id))
        || [];
      for (const ev of fromExec) add(ev);
    }
    return out;
  }
  const execIds = new Set((execs || []).map(e => e.id));
  return (events || []).filter(ev => eventTouchesDebt(ev, debt, execIds));
}

function hasDatedPrescEvent(debt, execs, events, collectIndex) {
  return eventsTouchingDebt(debt, execs, events, collectIndex)
    .some(ev => asIso(ev.date) || asIso(ev.requestDate));
}

function hasParcelamentoEvent(debt, execs, events, collectIndex) {
  return eventsTouchingDebt(debt, execs, events, collectIndex).some(ev => {
    const t = normalizePrescEventType(ev.type);
    return isAdesaoType(t) || t === 'int_rescisao_parcelamento';
  });
}

function latestEventIso(related) {
  let max = '';
  for (const ev of related || []) {
    const d = asIso(ev.date) || asIso(ev.requestDate);
    if (d && d > max) max = d;
  }
  return max;
}

function parcelamentoVigentePorEvento(related, asOfIso) {
  const inferred = inferParcelamentoEnds(related);
  let lastAdesao = '';
  let lastResc = '';
  let open = false;
  for (const ev of related || []) {
    const t = normalizePrescEventType(ev.type);
    const d = asIso(ev.date);
    if (!d || d > asOfIso) continue;
    if (t === 'int_rescisao_parcelamento' && d > lastResc) lastResc = d;
    if (isAdesaoType(t)) {
      if (d > lastAdesao) lastAdesao = d;
      const inferredEnd = inferred.get(ev.id);
      const end = asIso(ev.endDate) || (inferredEnd && inferredEnd.end) || '';
      if (!end || end > asOfIso) open = true;
    }
  }
  if (lastResc && (!lastAdesao || lastResc >= lastAdesao)) return false;
  return open;
}

/** Parcelada por status ou por adesão ainda vigente. Rescisão posterior prevalece. */
export function isCdaParcelada(debt, executions = [], events = [], asOf, fifth) {
  if (!debt) return false;
  const asOfIso = asIso(asOf) || localIso(new Date());
  const collectIndex = collectIndexFrom(fifth);
  const ignoreStatus = !!(fifth && fifth.ignoreStatus);
  const execs = matchingExecsForDebt(debt, executions, collectIndex);
  const related = eventsTouchingDebt(debt, execs, events, collectIndex);
  if (parcelamentoVigentePorEvento(related, asOfIso)) return true;
  if (ignoreStatus) return false;
  const st = debt.status;
  if (st === 'parcelada' || st === 'negociada_sispar') return true;
  return (execs || []).some(e => e && e.status === 'suspensa_parcelamento');
}

function isCoveredByIdpj(debt, executions) {
  const execs = matchingExecsForDebt(debt, executions).filter(e => e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  const execIds = new Set(execs.map(e => e.id));
  if (!execIds.size) return false;
  return (executions || []).some(e => {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) return false;
    return (e.linkedExecutionIds || []).some(id => execIds.has(id));
  });
}

function cadastroInconsistencia(debt, execs, events, collectIndex) {
  const st = debt && debt.status;
  if (st === 'suspensa_judicial' || st === 'suspensa_admin') {
    const related = eventsTouchingDebt(debt, execs, events, collectIndex);
    const hasSusp = related.some(ev => {
      const meta = PRESC_EVENT_TYPES[normalizePrescEventType(ev.type)];
      return meta && meta.category === 'suspensiva';
    });
    if (!hasSusp) return `Status diz ${st}, sem evento suspensivo. Cadastre ou corrija.`;
  }
  return '';
}

/** Protocolo + 6 anos civis. Não é marco: só prova que a consumação ainda é impossível. */
export function pessimisticIntercorrenteFloor(protocolIso, asOfIso) {
  const start = asIso(protocolIso);
  if (!start) return null;
  const date = addCalendarYears(start, 6);
  return { date, days: daysUntil(date, asOfIso) };
}

function alertPayload(kind, r, segment, extra = {}) {
  const incident = extra.incident !== undefined
    ? extra.incident
    : ((r.incidents && r.incidents[0]) || null);
  const payload = {
    kind,
    segment,
    days: extra.days != null ? extra.days : r.daysLeft,
    date: extra.date != null ? extra.date : (r.diesAdQuem || ''),
    status: r.status || extra.status || 'sem_dados',
    faixa: extra.faixa || '',
    label: extra.label || '',
    flags: r.flags || [],
    scenario: r.summary || r.scenario || extra.scenario || '',
    summary: r.summary || '',
    checks: r.checks || [],
    incident
  };
  if (extra.action) payload.action = extra.action;
  if (extra.clock) payload.clock = extra.clock;
  if (extra.silenceReason) payload.silenceReason = extra.silenceReason;
  if (extra.bandHit) payload.bandHit = extra.bandHit;
  if (extra.penhora) payload.penhora = extra.penhora;
  return payload;
}

/** Ação do pedido de dado conforme o motivo da faixa. */
const BAND_DADO_ACTION = {
  A5: { type: 'confirmar_vigencia', label: 'A pausa ainda vale?' },
  A6: { type: 'confirmar_vigencia', label: 'O parcelamento segue vigente?' },
  B2: { type: 'lancar_ciencia', label: 'Lançar a data da ciência (certidão)' },
  B3: { type: 'lancar_ciencia', label: 'Lançar a data da ciência' },
  C1: { type: 'corrigir_ficha', field: 'constituicao', label: 'Informar vencimento ou constituição definitiva' }
};

/**
 * Alarme pela data cedo. Faixa de tese: vermelho a partir de 90 dias antes da cedo.
 * Faixa de dado: pedido de dado (grupo 3) até a cedo; depois, provável (grupo 2).
 */
function bandAlert(r, segment, windowDays, pauseIdsOf) {
  const band = r && r.band;
  if (!band || band.alarme === false || !band.cedo || !band.cedo.diesAdQuem) return null;
  const c = band.cedo;
  if (c.daysLeft == null || c.daysLeft > windowDays) return null;
  const codes = (band.motivos || []).map(m => m.code);
  const hit = { kind: band.kind, motivos: codes, cedo: c, tarde: band.tarde || null };
  const base = { days: c.daysLeft, date: c.diesAdQuem, bandHit: hit };
  const texto = ((band.motivos || [])[0] || {}).texto || '';
  if (band.kind === 'tese') {
    return alertPayload(c.daysLeft <= 0 ? 'vencido' : 'iminente', r, segment, {
      ...base,
      faixa: 'alta',
      label: 'data cedo · ' + texto
    });
  }
  if (c.daysLeft <= 0) {
    return alertPayload('vencido_estimado', r, segment, {
      ...base,
      faixa: 'alta',
      label: 'A data cedo passou. ' + texto
    });
  }
  const code = codes.find(k => BAND_DADO_ACTION[k]) || '';
  const act = BAND_DADO_ACTION[code] || { type: 'conferir_autos', label: 'Completar o dado que falta' };
  const action = { type: act.type };
  if (act.field) action.field = act.field;
  if (act.type === 'confirmar_vigencia' && pauseIdsOf) {
    const ids = pauseIdsOf();
    if (ids && ids.length) action.eventIds = ids;
  }
  return alertPayload('pedido_dado', r, segment, {
    ...base,
    faixa: 'media',
    label: act.label,
    action
  });
}

/** Penhora antiga já analisada: sai da lista até novo evento ou por 1 ano. */
export const PENHORA_ANALISE_VALIDADE = 365;

function penhoraAnaliseVigente(debt, related, asOfIso) {
  const a = debt && debt.penhoraAnalise;
  const at = a && asIso(a.at);
  if (!at) return false;
  if (latestEventIso(related) > at) return false;
  return daysBetween(at, asOfIso) < PENHORA_ANALISE_VALIDADE;
}

/**
 * Um aviso operacional por CDA ativa, sem decadência.
 * Recorte de cadastro nunca remove da fila — rebaixa ou vai a sublista.
 */
export function classifyPainelPrescAlert(debt, executions = [], events = [], asOf, prescResult, opts = {}) {
  const policy = resolvePolicy(opts);
  const v2 = policy === 'v2';
  const windowDays = v2 ? PRESC_ALERT_WINDOW : PAINEL_PRESC_WINDOW;
  const collectIndex = (opts && opts.collectIndex) || null;
  if (!isPainelPrescCandidate(debt, executions, { policy, collectIndex })) return null;

  const asOfIso = asIso(asOf) || localIso(new Date());
  const execs = matchingExecsForDebt(debt, executions, collectIndex);
  const related = eventsTouchingDebt(debt, execs, events, collectIndex);
  const parcEvento = parcelamentoVigentePorEvento(related, asOfIso);
  const parcSoStatus = !parcEvento && (
    debt.status === 'parcelada' || debt.status === 'negociada_sispar'
    || (execs || []).some(e => e && e.status === 'suspensa_parcelamento')
  );

  // Ficha parcelada sem adesão lançada: tratada como parcelada até prova em contrário.
  if (parcSoStatus) return null;
  if (parcEvento && !v2) return null;

  const r = prescResult || computePrescription({ debt, executions, events, asOf, collectIndex });
  const wrapAguardando = (alert) => {
    if (!v2 || debt.prescriptionHandledType !== 'aguardando_reconhecimento') return alert;
    const base = alert || alertPayload('aguardando_reconhecimento', r, r.segment || 'intercorrente', {
      faixa: 'media',
      label: 'aguardando decisão'
    });
    return {
      ...base,
      kind: 'aguardando_reconhecimento',
      label: 'aguardando decisão',
      silenceReason: 'aguardando_reconhecimento',
      faixa: 'media'
    };
  };
  const ajuizada = r.segment === 'intercorrente';
  const seg = ajuizada ? 'intercorrente' : 'ordinaria';
  let pauseIdsMemo = null;
  const pauseIds = () => {
    if (!pauseIdsMemo) {
      const cdaEvents = collectEventsForCda(debt, executions, events, collectIndex).events;
      pauseIdsMemo = openPauseEvents(cdaEvents, asOfIso).map(p => p.id);
    }
    return pauseIdsMemo;
  };
  const bandHit = v2 ? bandAlert(r, seg, windowDays, pauseIds) : null;

  // Parcelamento vigente: fora do alarme até 90 dias antes da data cedo (última conferência + 5 anos).
  if (parcEvento) return wrapAguardando(bandHit);

  const incidentOnly = !!(r.incidentOnly || (r.gaps || []).some(g => /coincide com um IDPJ/i.test(g)));
  if (v2 && incidentOnly) {
    return wrapAguardando(alertPayload('inconsistencia', r, 'ordinaria', {
      faixa: 'alta',
      label: 'vincule à execução fiscal',
      action: { type: 'vincular_ef' }
    }));
  }

  const cycle = ajuizada && intercorrenteCycleStarted(r);
  const fiscalExecs = execs.filter(e => e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal');
  const exec = r.exec || pickFiscalExec(execs) || fiscalExecs[0] || execs[0];
  const bounds = (r && r.bounds) || computeIntercorrenteBounds({
    exec, debt, cdaEvents: collectEventsForCda(debt, executions, events, collectIndex).events, asOfIso
  });
  const flags = r.flags || [];
  const conferirFlag = flags.includes(PRESC_FLAGS.PEDIDO_SEM_DESFECHO);

  if (ajuizada) {
    if (cycle && r.phase === 'interrompido') {
      const pen = v2 ? penhoraAntigaInfo(r, asOfIso) : null;
      if (pen && pen.due && !penhoraAnaliseVigente(debt, related, asOfIso)) {
        return wrapAguardando(alertPayload('penhora_antiga', r, 'intercorrente', {
          days: pen.daysLeft,
          date: pen.limitDate,
          faixa: 'media',
          label: `${pen.label} informada em ${fmtDate(pen.constrictionDate)}: mais de 6 anos sem outro fato lançado`,
          action: { type: 'analisar_penhora' },
          penhora: pen
        }));
      }
      // Constrição no incidente: sem alerta na fila; o card do processo pede esclarecimento.
      return wrapAguardando(alertPayload('vigiar_interrompido', r, 'intercorrente', {
        days: null,
        date: r.interruptAt || '',
        faixa: 'media',
        label: 'Ciclo encerrado — vigiar nova inércia'
      }));
    }
    if (cycle && r.estimated && r.daysLeft != null && r.daysLeft <= windowDays) {
      return wrapAguardando(alertPayload('vencido_estimado', r, 'intercorrente', {
        faixa: 'alta',
        label: 'Estimado — conferir nos autos'
      }));
    }
    if (cycle && r.phase === 'suspenso') {
      if (bandHit) return wrapAguardando(bandHit);
      return wrapAguardando(alertPayload('pausa_cadastrada', r, 'intercorrente', {
        faixa: 'media',
        label: 'Exigibilidade suspensa — conferir evento'
      }));
    }
    if (cycle && isOverdueResult(r)) {
      if (conferirFlag) {
        return wrapAguardando(alertPayload('vencido', r, 'intercorrente', {
          faixa: 'alta',
          label: 'pedido pendente'
        }));
      }
      return wrapAguardando(alertPayload('vencido', r, 'intercorrente', { faixa: 'alta' }));
    }
    if (cycle && isImminentResult(r, windowDays)) {
      return wrapAguardando(alertPayload('iminente', r, 'intercorrente', { faixa: 'alta' }));
    }
    if (bandHit) return wrapAguardando(bandHit);
    if (cycle) {
      if (conferirFlag) {
        return wrapAguardando(alertPayload('residual_alta', r, 'intercorrente', {
          faixa: 'alta',
          label: 'Conferir cadastro / autos'
        }));
      }
      return wrapAguardando(alertPayload('correndo', r, 'intercorrente', {
        faixa: 'media',
        label: 'Prazo em curso'
      }));
    }

    // CDA ajuizada: a ordinária aparece na coluna, sem alerta na fila.

    const inconsist = cadastroInconsistencia(debt, execs, events, collectIndex);
    if (inconsist) {
      return wrapAguardando(alertPayload('inconsistencia', r, 'intercorrente', {
        days: bounds.floorDays,
        date: bounds.floor || '',
        faixa: 'alta',
        label: inconsist,
        ...(v2 ? { action: { type: 'criar_evento' } } : {})
      }));
    }

    if (bounds.ceiling && bounds.ceilingDays != null && bounds.ceilingDays <= 0) {
      return wrapAguardando(alertPayload('vencido_estimado', r, 'intercorrente', {
        days: bounds.ceilingDays,
        date: bounds.ceiling,
        faixa: 'alta',
        label: 'Vencido — conferir (estimado). Arquivamento datado + 6 anos.'
      }));
    }

    const forecast = asIso(exec && exec.prescriptionForecast);
    const forecastDays = forecast ? daysUntil(forecast, asOfIso) : null;
    const arquivadaSemData = execs.some(e => e.status === 'arquivada');
    const floorAhead = bounds.floor && bounds.floorDays != null && bounds.floorDays > 0;
    const floorOverdue = bounds.floor && bounds.floorDays != null && bounds.floorDays <= 0;
    const floorOverdue2y = bounds.floor && bounds.floorDays != null && bounds.floorDays <= -730;
    const datedEvt = hasDatedPrescEvent(debt, execs, events, collectIndex);
    const planilhaAlta = forecast && forecastDays != null && forecastDays <= windowDays;
    const garantia = CDA_RECORTE_STATUS.has(debt.status) && debt.status === 'garantida'
      || (execs || []).some(e => e.hasGuarantee);
    const planilhaInterrompida = (execs || []).some(e => e.prescriptionInterrupted);

    if (floorAhead) {
      return wrapAguardando(alertPayload('acompanhar_piso', r, 'intercorrente', {
        days: bounds.floorDays,
        date: bounds.floor,
        faixa: 'baixa',
        label: 'Acompanhar a partir de ' + fmtDate(bounds.floor)
      }));
    }

    let alta = !!(arquivadaSemData || planilhaAlta || (floorOverdue2y && !datedEvt) || conferirFlag);
    let media = !!(floorOverdue || !bounds.floor);
    if (planilhaInterrompida && !arquivadaSemData && !planilhaAlta) {
      alta = false;
      media = true;
    }
    if (garantia && alta && !arquivadaSemData) {
      alta = false;
      media = true;
    }

    if (alta) {
      return wrapAguardando(alertPayload('residual_alta', r, 'intercorrente', {
        days: planilhaAlta ? forecastDays : bounds.floorDays,
        date: (planilhaAlta ? forecast : bounds.floor) || '',
        faixa: 'alta',
        label: arquivadaSemData
          ? 'Arquivada art. 40 sem data de ciência — pedir a data'
          : (planilhaAlta
            ? 'Previsão de planilha, sem ciência lançada'
            : 'Data "não antes de" já passou há mais de 2 anos sem evento datado')
      }));
    }
    return wrapAguardando(alertPayload('residual_media', r, 'intercorrente', {
      days: bounds.floorDays,
      date: (forecast || bounds.floor) || '',
      faixa: 'media',
      label: !bounds.floor
        ? 'Sem protocolo — data "não antes de" incalculável'
        : (forecast ? 'Previsão de planilha, sem ciência lançada' : 'Data "não antes de" já passou — sem agravantes')
    }));
  }

  // Não ajuizada: só a ordinária alarma.
  const pausada = r.phase === 'suspenso';
  if (pausada && bandHit) return wrapAguardando(bandHit);
  if (!pausada && isOverdueResult(r)) {
    return wrapAguardando(alertPayload('vencido', r, 'ordinaria', { faixa: 'alta' }));
  }
  if (!(pausada && r.band) && isImminentResult(r, windowDays)) {
    return wrapAguardando(alertPayload('iminente', r, 'ordinaria', { faixa: 'alta' }));
  }
  if (bandHit) return wrapAguardando(bandHit);
  return wrapAguardando(null);
}

export function buildPainelPrescAlerts(data, asOf, prescLookup, opts) {
  const tail = resolveRadarTail(prescLookup, opts);
  const policy = resolvePolicy(tail.opts);
  const buckets = {};
  PAINEL_PRESC_KINDS.forEach(k => { buckets[k] = []; });
  if (!data) return buckets;
  const ops = {};
  (data.operations || []).forEach(o => {
    if (o && o.status !== 'encerrada') ops[o.id] = o;
  });
  const executions = data.executions || [];
  const events = data.prescriptionEvents || [];
  const collectIndex = tail.opts.collectIndex || buildPrescCollectIndex(executions, events);
  const lookup = tail.lookup || createPrescLookup(data.debts || [], executions, events, asOf);
  const peopleById = new Map((data.people || []).filter(p => p && p.id).map(p => [p.id, p]));
  const execById = new Map();

  const idpjCovered = new Set();
  const execIdByOpProc = new Map();
  for (let i = 0; i < executions.length; i++) {
    const e = executions[i];
    if (!e) continue;
    if (e.id) execById.set(e.id, e);
    if ((e.processTag === 'idpj' || e.processTag === 'cautelar_fiscal') && e.linkedExecutionIds) {
      for (let j = 0; j < e.linkedExecutionIds.length; j++) idpjCovered.add(e.linkedExecutionIds[j]);
    }
    const n = normProc(e.processNumber);
    if (n && e.operationId && e.id) execIdByOpProc.set(e.operationId + '|' + n, e.id);
  }

  (data.debts || []).forEach(d => {
    const op = ops[d.operationId];
    if (!op) return;
    const r = lookup(d);
    const alert = classifyPainelPrescAlert(d, executions, events, asOf, r, { policy, collectIndex });
    if (!alert || !buckets[alert.kind]) return;
    const execId = d.processNumber ? execIdByOpProc.get(d.operationId + '|' + normProc(d.processNumber)) : null;
    const execObj = execId ? execById.get(execId) : null;
    const row = {
      id: d.id,
      cdaNumber: d.cdaNumber,
      processNumber: d.processNumber,
      status: d.status,
      value: d.value,
      tribute: d.tribute || '',
      personName: ((peopleById.get(d.personId) || {}).name) || '',
      operationId: d.operationId,
      executionId: execId || '',
      court: (execObj && execObj.court) || '',
      prescDate: alert.date,
      prescDays: alert.days,
      prescKind: alert.kind,
      prescSegment: alert.segment,
      prescFaixa: alert.faixa,
      prescLabel: alert.label,
      summary: r.summary || alert.summary || '',
      checks: r.checks || alert.checks || [],
      prescChecks: d.prescChecks || [],
      incident: alert.incident || ((r.incidents && r.incidents[0]) || null),
      informedConflict: !!r.informedConflict,
      estimated: !!r.estimated,
      hasCiencia: r.segment === 'intercorrente' && r.phase !== 'nao_iniciado' && r.cycleKind === 'art40',
      noCiencia: r.segment === 'intercorrente' && r.phase === 'nao_iniciado',
      incidentOnly: !!(r.incidentOnly || (r.gaps || []).some(g => /coincide com um IDPJ/i.test(g))),
      interruptAt: r.interruptAt || '',
      flags: r.flags || [],
      prescDecision: (execObj && execObj.prescDecision) || null,
      decisionNote: engineMoreGraveThanDecision(r, execObj && execObj.prescDecision),
      opName: op.name,
      opId: op.id,
      hasIDPJ: !!(execId && idpjCovered.has(execId)),
      bandCedo: (r.band && r.band.cedo && r.band.cedo.diesAdQuem) || '',
      bandTarde: (r.band && r.band.tarde && r.band.tarde.diesAdQuem) || '',
      bandKind: (r.band && r.band.kind) || '',
      bandMotivos: r.band ? (r.band.motivos || []).map(m => m.code) : [],
      idpjNotice: r.idpjNotice || null
    };
    if (alert.bandHit) row.bandHit = alert.bandHit;
    if (alert.penhora) row.penhora = alert.penhora;
    if (alert.action) row.action = alert.action;
    if (alert.clock) row.clock = alert.clock;
    if (alert.silenceReason) row.silenceReason = alert.silenceReason;
    if (policy === 'v2') row.policy = 'v2';
    buckets[alert.kind].push(row);
  });
  buckets.iminente.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  buckets.vencido.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  buckets.vencido_estimado.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  buckets.acompanhar_piso.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  buckets.residual_alta.sort((a, b) => (a.prescDays ?? 0) - (b.prescDays ?? 0));
  buckets.residual_media.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  if (buckets.correndo) buckets.correndo.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  if (buckets.aguardando_reconhecimento) {
    buckets.aguardando_reconhecimento.sort((a, b) => (a.prescDays ?? 9999) - (b.prescDays ?? 9999));
  }
  return buckets;
}

export const PRAZOS_GROUP_LABELS = {
  1: 'Vencido ou iminente',
  2: 'Provável — conferir nos autos',
  3: 'Cadastro a completar',
  4: 'Em acompanhamento',
  5: 'Ainda impossível',
  6: 'Consumada',
  7: 'Penhora antiga — analisar'
};

/** Mesma janela do painel iminente (180d ≈ 6 meses): consumada recente ainda gera alerta. */
export const CONSUMADA_ALERT_WINDOW = PAINEL_PRESC_WINDOW;

const CONSUMADA_KINDS = new Set(['vencido', 'vencido_estimado', 'residual_alta']);

/**
 * Classifica prazo já vencido com o cálculo existente (prescDays).
 * null = ainda não consumada; 'recent' = ≤6 meses (alerta + Consumada); 'old' = >6 meses (só Consumada).
 */
export function consumadaClass(row) {
  if (!row) return null;
  // Alarme pela data cedo: só é consumada quando a data tarde também passou.
  const hit = row.bandHit;
  const days = hit ? (hit.tarde && hit.tarde.diesAdQuem ? hit.tarde.daysLeft : null) : row.prescDays;
  if (days == null || days > 0) return null;
  const k = row.prescKind || row.kind;
  if (!CONSUMADA_KINDS.has(k)) return null;
  if (days >= -CONSUMADA_ALERT_WINDOW) return 'recent';
  return 'old';
}

/** Linha entra na sub-aba / card Consumada (recentes e antigas). */
export function rowShowsInConsumada(row) {
  return !!(row && (row.group === 6 || row.consumada === 'recent' || row.consumada === 'old'));
}

/** Ajusta grupo: antiga sai do alerta (vira 6); recente mantém o grupo de alerta e marca consumada. */
export function applyConsumadaClassification(row) {
  if (!row) return row;
  const cls = consumadaClass(row);
  if (!cls) return row;
  row.consumada = cls;
  if (cls === 'old') {
    if (row.alertGroup == null) row.alertGroup = row.group;
    row.group = 6;
  }
  return row;
}

function rowNeedsCadastro(row) {
  if (!row) return false;
  if (row.informedConflict) return true;
  const inc = row.incident;
  if (inc && !inc.hasConstriction && !inc.hasStay) return true;
  if (inc && inc.hasConstriction && inc.constrictionOpen && /extinta|arquivada/i.test(inc.status || '')) return true;
  if (inc && inc.hasStay && inc.stayOpen && /extinta|arquivada/i.test(inc.status || '')) return true;
  const checks = row.checks || [];
  return checks.some(c =>
    /não tem constrição lançada/i.test(c) ||
    /encerrado; informar a data/i.test(c) ||
    /diverge do termo calculado/i.test(c)
  );
}

/**
 * Prioridade: 1, 2, 3 (cadastro), 5, 4; 7 é a lista própria de penhoras antigas.
 * Grupos 1 e 2 não são rebaixados por cadastro. O cálculo prevalece sobre a análise importada.
 */
export function groupOfKind(kind, row, opts) {
  const policy = resolvePolicy(opts || (row && row.policy));
  let g = 4;
  if (kind === 'vencido' || kind === 'iminente') g = 1;
  else if (kind === 'vencido_estimado' || kind === 'residual_alta') g = 2;
  else if (kind === 'penhora_antiga') g = 7;
  else if (kind === 'aguardando_reconhecimento') g = 4;
  else if (kind === 'pedido_dado') g = 3;
  else if (policy === 'v2' && kind === 'acompanhar_piso') g = 5;
  else if (kind === 'inconsistencia' || rowNeedsCadastro(row)) g = 3;
  else if (kind === 'acompanhar_piso') g = 5;
  return g;
}

export function prazosKeyMeta(kind, row) {
  const date = (row && (row.prescDate || row.date)) || '';
  const hit = row && row.bandHit;
  if (hit && hit.cedo && (kind === 'vencido' || kind === 'iminente' || kind === 'vencido_estimado' || kind === 'pedido_dado')) {
    const tarde = hit.tarde && hit.tarde.diesAdQuem ? ' · tarde ' + fmtDate(hit.tarde.diesAdQuem) : '';
    return { date, label: 'cedo ' + fmtDate(date) + tarde, band: true };
  }
  if (kind === 'vencido' || kind === 'iminente') {
    return { date, label: date ? fmtDate(date) : '—' };
  }
  if (kind === 'penhora_antiga') {
    const p = row && row.penhora;
    return { date: (p && p.constrictionDate) || date, label: p ? ('penhora de ' + fmtDate(p.constrictionDate)) : '—' };
  }
  if (kind === 'vencido_estimado' || kind === 'residual_alta') {
    return { date, label: date ? ('estimado · ' + fmtDate(date)) : 'estimado' };
  }
  if (kind === 'vigiar_interrompido') {
    const enc = (row && row.interruptAt) || date;
    return { date: enc, label: enc ? ('encerrado em ' + fmtDate(enc)) : 'encerrado' };
  }
  if (kind === 'acompanhar_piso' || kind === 'residual_media') {
    return { date, label: date ? ('não antes de ' + fmtDate(date)) : '—' };
  }
  if (kind === 'correndo') {
    return { date, label: date ? fmtDate(date) : 'em curso' };
  }
  if (kind === 'pausa_cadastrada') {
    return { date, label: date ? ('pausado · ' + fmtDate(date)) : 'pausado' };
  }
  if (kind === 'avaliar_174') {
    return { date, label: date ? fmtDate(date) : 'sem dados' };
  }
  if (kind === 'aguardando_reconhecimento') {
    return { date, label: 'aguardando decisão' };
  }
  return { date, label: date ? fmtDate(date) : '—' };
}

export function incidentDot(incident) {
  if (!incident) return 'none';
  if ((incident.hasConstriction && incident.constrictionOpen) || (incident.hasStay && incident.stayOpen)) return 'open';
  if (incident.hasConstriction || incident.hasStay) return 'closed';
  return 'cover';
}

export function groupPrazosByProcess(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const proc = r.processNumber ? normProc(r.processNumber) : '';
    const key = (r.operationId || '') + '|' + (proc || ('cda:' + r.id));
    if (!map.has(key)) {
      map.set(key, {
        key,
        processNumber: r.processNumber || '',
        court: r.court || '',
        opName: r.opName || '',
        operationId: r.operationId,
        incident: r.incident || null,
        rows: []
      });
    }
    const g = map.get(key);
    g.rows.push(r);
    if (!g.incident && r.incident) g.incident = r.incident;
    if (!g.court && r.court) g.court = r.court;
  }
  const groups = [...map.values()];
  groups.forEach(g => {
    g.rows.sort((a, b) => a.group - b.group || (a.keyDate || '9999').localeCompare(b.keyDate || '9999'));
    g.worstGroup = Math.min(...g.rows.map(r => r.group));
    g.value = g.rows.reduce((s, r) => s + (r.value || 0), 0);
  });
  groups.sort((a, b) => a.worstGroup - b.worstGroup || (a.processNumber || '').localeCompare(b.processNumber || ''));
  return groups;
}

export function buildPrazosIncidentBlocks(data, rows) {
  const executions = (data && data.executions) || [];
  const events = (data && data.prescriptionEvents) || [];
  const rowsByExecId = new Map();
  for (const r of rows || []) {
    if (!r.executionId) continue;
    if (!rowsByExecId.has(r.executionId)) rowsByExecId.set(r.executionId, []);
    rowsByExecId.get(r.executionId).push(r);
  }
  const blocks = [];
  for (const e of executions) {
    if (!e || (e.processTag !== 'idpj' && e.processTag !== 'cautelar_fiscal')) continue;
    const linked = e.linkedExecutionIds || [];
    const efRows = [];
    const efs = [];
    for (const id of linked) {
      const arr = rowsByExecId.get(id) || [];
      efRows.push(...arr);
      const sample = arr[0];
      efs.push({
        executionId: id,
        processNumber: (sample && sample.processNumber) || '',
        worstGroup: arr.length ? Math.min(...arr.map(r => r.group || 9)) : 0,
        cdaCount: arr.length
      });
    }
    const src = events.filter(ev => isBareExecEvent(ev) && ev.executionId === e.id);
    const cons = src.filter(ev => normalizePrescEventType(ev.type) === IDPJ_CONSTRICTION_TYPE && asIso(ev.date));
    const hasConstriction = cons.length > 0;
    const constrictionOpen = cons.some(ev => !asIso(ev.endDate));
    const requestDate = cons.map(ev => asIso(ev.requestDate) || asIso(ev.date)).filter(Boolean).sort()[0] || '';
    const closed = /extinta|arquivada/i.test(e.status || '');
    let conference = 'Sem incidente de constrição lançado.';
    if (!hasConstriction) {
      conference = 'Sem constrição lançada. Se houve indisponibilidade ou bloqueio, lançar com a data do pedido.';
    } else if (closed && constrictionOpen) {
      conference = 'Incidente encerrado; informar a data em que a pausa cessou.';
    } else if (requestDate) {
      conference = 'Constrição lançada · pedido em ' + fmtDate(requestDate);
    } else {
      conference = 'Constrição lançada.';
    }
    const worstGroup = efRows.reduce((m, r) => Math.min(m, r.group || 9), 9);
    blocks.push({
      id: e.id,
      processNumber: e.processNumber || '',
      tag: e.processTag,
      court: e.court || '',
      status: e.status || '',
      operationId: e.operationId,
      opName: ((data.operations || []).find(o => o.id === e.operationId) || {}).name || '',
      hasConstriction,
      constrictionOpen,
      requestDate,
      closed,
      conference,
      worstGroup: worstGroup === 9 ? 0 : worstGroup,
      efCount: linked.length,
      efs,
      rows: efRows
    });
  }
  blocks.sort((a, b) => Number(a.hasConstriction) - Number(b.hasConstriction) || (a.processNumber || '').localeCompare(b.processNumber || ''));
  return blocks;
}

const RADAR_BASIS = {
  intercorrente: 'Art. 40 da LEF; Tema 566/STJ (REsp 1.340.553)',
  ordinaria: 'Art. 174 do CTN',
  ordinaria_ajuizada: 'Art. 174, p.ú., I, do CTN; Tema 383/STJ',
  interrupcao: 'Tema 568/STJ; REsp 2.174.870 (Sisbajud e CNIB)',
  pausa: 'Art. 151 do CTN',
  parcelamento: 'Art. 151, VI, e 174, p.ú., IV, do CTN; Súmula 653/STJ',
  A1: 'Rescisão do parcelamento: STJ diverge entre inadimplemento e exclusão formal',
  A2: 'Súmula 653/STJ: o pedido de parcelamento interrompe',
  A4: 'Lei 11.101, art. 6º, §7º-B: a recuperação judicial não suspende a execução fiscal',
  B1: 'Lei 11.419, art. 5º, §3º: ciência tácita no 10º dia',
  B2: 'Tema 566/STJ: a ciência pode anteceder a decisão de suspensão',
  B3: 'Art. 40, §2º, da LEF: o arquivamento vem depois do ano de suspensão',
  C1: 'Tema 383/STJ; Súmulas 436 e 622/STJ: o prazo corre da constituição definitiva',
  penhora: 'Temas 566 e 568/STJ: nova inércia exige nova ciência'
};

function basisFor(row) {
  const hit = row.bandHit;
  if (hit && hit.motivos && hit.motivos.length) {
    const own = hit.motivos.map(c => RADAR_BASIS[c]).filter(Boolean);
    if (own.length) return own.join(' · ');
  }
  const kind = row.prescKind || row.kind;
  if (kind === 'penhora_antiga') return RADAR_BASIS.penhora;
  if (kind === 'vigiar_interrompido') return RADAR_BASIS.interrupcao;
  if (kind === 'pausa_cadastrada') return RADAR_BASIS.pausa;
  if (row.prescSegment === 'ordinaria' || row.clock === 'ordinaria') return RADAR_BASIS.ordinaria;
  return RADAR_BASIS.intercorrente;
}

function radarWhyActionCore(row) {
  const kind = row.prescKind || row.kind;
  const action = row.action || { type: 'nenhuma' };
  const ordinaria = row.prescSegment === 'ordinaria' || row.clock === 'ordinaria';
  const hit = row.bandHit;
  let why = '';
  if (hit && (kind === 'vencido' || kind === 'iminente')) {
    why = kind === 'vencido'
      ? 'Pela leitura mais desfavorável (data cedo), o prazo já venceu. A data tarde é a tese da União.'
      : 'A data cedo cai nos próximos 90 dias. Peticionar antes dela; a data tarde é a tese da União.';
    return { why, action: { type: 'conferir_autos' } };
  }
  if (kind === 'pedido_dado') {
    why = 'Falta um dado para fechar a data. Sem ele, a data cedo cai nos próximos 90 dias.';
    return { why, action: action.type ? action : { type: 'conferir_autos' } };
  }
  if (kind === 'penhora_antiga') {
    why = 'Penhora ou bloqueio efetivo há mais de 6 anos, sem outro fato lançado. Analisar o caso: houve nova ciência de insuficiência?';
    return { why, action: { type: 'analisar_penhora' } };
  }
  if (kind === 'vencido' && ordinaria) {
    why = row.clock === 'ordinaria'
      ? 'Os 5 anos da constituição venceram antes do ajuizamento.'
      : 'Os 5 anos para ajuizar já venceram no cálculo.';
    return { why, action: action.type && action.type !== 'nenhuma' ? action : { type: 'conferir_autos' } };
  }
  if (kind === 'iminente' && ordinaria) {
    why = 'Os 5 anos para ajuizar vencem nos próximos 90 dias.';
    return { why, action: { type: 'conferir_autos' } };
  }
  if (kind === 'vencido' && /pedido pendente/i.test(row.prescLabel || '')) {
    why = 'O termo calculado já passou, mas há pedido sem resultado nos autos.';
    return { why, action: { type: 'conferir_autos' } };
  }
  if (kind === 'vencido') {
    why = 'O prazo de 1 ano + 5 anos já venceu no cálculo.';
    return { why, action: { type: 'conferir_autos' } };
  }
  if (kind === 'iminente') {
    why = 'O termo calculado cai nos próximos 90 dias.';
    return { why, action: { type: 'conferir_autos' } };
  }
  if (kind === 'vencido_estimado') {
    why = hit
      ? 'A data cedo já passou e falta o dado que a confirmaria. Conferir nos autos.'
      : 'Pelo cadastro, a consumação já é a hipótese mais provável — conferir nos autos.';
    return { why, action: { type: 'conferir_autos' } };
  }
  if (kind === 'residual_alta') {
    why = 'Falta ciência lançada e o prazo operacional já apertou.';
    return { why, action: /ciência|Arquivada/i.test(row.prescLabel || '') ? { type: 'lancar_ciencia' } : { type: 'conferir_autos' } };
  }
  if (kind === 'inconsistencia' && action.type === 'vincular_ef') {
    why = 'O número apontado é de incidente, não de execução fiscal.';
    return { why, action };
  }
  if (kind === 'inconsistencia') {
    why = 'Há dado da ficha sem o fato correspondente nos eventos.';
    return { why, action: action.type ? action : { type: 'corrigir_ficha' } };
  }
  if (kind === 'aguardando_reconhecimento') {
    why = 'A prescrição já foi apontada e aguarda decisão judicial.';
    return { why, action: { type: 'nenhuma' }, silenceReason: 'aguardando_reconhecimento' };
  }
  if (kind === 'acompanhar_piso') {
    why = 'Ainda não pode ter prescrito: o ato mais recente mais 1 ano e 5 anos não chegou.';
    return { why, action: { type: 'lancar_ciencia' } };
  }
  if (kind === 'vigiar_interrompido') {
    why = 'O ciclo encerrou por resultado útil; vigiar nova inércia.';
    return { why, action: { type: 'lancar_ciencia' } };
  }
  if (kind === 'pausa_cadastrada') {
    why = 'O prazo está pausado por fato lançado; conferir se a pausa ainda vale.';
    return { why, action: { type: 'confirmar_vigencia' } };
  }
  if (kind === 'residual_media') {
    why = 'Sem ciência lançada; a data de acompanhamento já passou, sem agravante.';
    return { why, action: { type: 'lancar_ciencia' } };
  }
  if (kind === 'correndo') {
    why = 'O prazo de 1 ano + 5 anos está em curso.';
    return { why, action: { type: 'nenhuma' } };
  }
  return { why: 'Esta inscrição está na fila de prazos.', action };
}

function radarWhyAction(row) {
  const out = radarWhyActionCore(row);
  return { ...out, basis: basisFor(row) };
}

/** Data fixa de reconferência (não anda com o dia). Vazia quando o grupo já pede ação. */
function reviewAtFor(row, asOfIso, debt) {
  const group = row.group;
  if (group === 1 || group === 2 || group === 3 || group === 7) return '';
  const kind = row.prescKind;
  if (kind === 'aguardando_reconhecimento') {
    const at = asIso(debt && debt.prescriptionHandledAt);
    return addCalendarDays(at || asOfIso, 60);
  }
  if (kind === 'pausa_cadastrada') {
    const cedo = row.bandCedo || '';
    if (cedo) return addCalendarDays(cedo, -PRESC_ALERT_WINDOW);
    return row.prescDate ? addCalendarDays(row.prescDate, -PRESC_ALERT_WINDOW) : '';
  }
  if (kind === 'acompanhar_piso') return row.prescDate || row.keyDate || '';
  return '';
}

function snoozeEffectiveUntil(snooze, asOfIso) {
  if (!snooze || !snooze.until) return '';
  const until = asIso(snooze.until);
  const at = asIso(snooze.at) || asOfIso;
  const limit = snoozeLimitDays(snooze.group);
  const maxUntil = addCalendarDays(at, limit);
  if (!until) return '';
  return until < maxUntil ? until : maxUntil;
}

function snoozePierced(debt, currentGroup, related, asOfIso) {
  const s = debt && debt.prescSnooze;
  if (!s || !s.until) return { pierced: true };
  if (s.reason === 'outro' && !(s.note || s.text || s.detail)) return { pierced: true };
  if (s.reason && !PRESC_SNOOZE_REASONS[s.reason]) return { pierced: true };
  const until = snoozeEffectiveUntil(s, asOfIso);
  if (!until || until <= asOfIso) return { pierced: true, why: 'until' };
  if (s.group != null && currentGroup < s.group) return { pierced: true, why: 'grupo' };
  const at = asIso(s.at);
  if (at && latestEventIso(related) > at) return { pierced: true, why: 'evento' };
  return { pierced: false, until };
}

export function buildPrazosRadar(data, asOf, prescLookup, opts) {
  const tail = resolveRadarTail(prescLookup, opts);
  const policy = resolvePolicy(tail.opts);
  const executions = (data && data.executions) || [];
  const events = (data && data.prescriptionEvents) || [];
  const collectIndex = tail.opts.collectIndex || buildPrescCollectIndex(executions, events);
  const asOfIso = asIso(asOf) || localIso(new Date());
  const debtById = new Map(((data && data.debts) || []).filter(d => d && d.id).map(d => [d.id, d]));
  const lookup = tail.lookup || createPrescLookup((data && data.debts) || [], executions, events, asOf);
  const buckets = buildPainelPrescAlerts(data, asOf, lookup, { ...tail.opts, policy, collectIndex });
  const rows = [];
  const silenced = [];
  const processNotes = [];
  const seenIncident = new Set();

  Object.keys(buckets).forEach(kind => {
    (buckets[kind] || []).forEach(r => {
      const group = groupOfKind(r.prescKind || kind, r, { policy });
      const key = prazosKeyMeta(r.prescKind || kind, r);
      const row = {
        ...r,
        group,
        keyDate: key.date,
        keyLabel: key.label,
        incidentDot: incidentDot(r.incident)
      };
      if (policy === 'v2') {
        const wa = radarWhyAction(row);
        row.why = wa.why;
        row.action = row.action || wa.action;
        if (wa.silenceReason && !row.silenceReason) row.silenceReason = wa.silenceReason;
        row.basis = wa.basis || '';
        const rev = reviewAtFor(row, asOfIso, debtById.get(row.id));
        if (rev) row.reviewAt = rev;
        const note = row.idpjNotice;
        if (note && note.active) {
          const procKey = 'idpjc|' + (normProc(row.processNumber) || row.id);
          if (!seenIncident.has(procKey)) {
            seenIncident.add(procKey);
            processNotes.push({
              processNumber: row.processNumber || '',
              incidentId: note.incidentId,
              kind: 'idpj_constricao',
              text: note.text
            });
          }
        }
        const inc = row.incident;
        if (inc && !inc.hasConstriction && !inc.hasStay) {
          const procKey = normProc(row.processNumber) || inc.id;
          if (!seenIncident.has(procKey)) {
            seenIncident.add(procKey);
            const tag = inc.tag === 'cautelar_fiscal' ? 'Cautelar fiscal' : 'IDPJ';
            processNotes.push({
              processNumber: row.processNumber || '',
              incidentId: inc.id,
              text: `${tag} nº ${inc.processNumber || inc.id} sem constrição lançada — lance o fato ou vincule à execução fiscal.`
            });
          }
          row.checks = (row.checks || []).filter(c => !/não tem constrição lançada/i.test(c));
        }
        const debt = debtById.get(row.id);
        if (debt && debt.prescSnooze) {
          const related = eventsTouchingDebt(debt, matchingExecsForDebt(debt, executions, collectIndex), events, collectIndex);
          const sn = snoozePierced(debt, group, related, asOfIso);
          if (!sn.pierced) {
            silenced.push({
              debtId: row.id,
              reason: debt.prescSnooze.reason || 'outro',
              until: sn.until,
              label: PRESC_SNOOZE_REASONS[debt.prescSnooze.reason] || 'Adiada',
              group
            });
            return;
          }
        }
      }
      applyConsumadaClassification(row);
      rows.push(row);
    });
  });

  if (policy === 'v2' && data) {
    const inRows = new Set(rows.map(r => r.id));
    const inSilenced = new Set(silenced.map(s => s.debtId));
    const ops = {};
    (data.operations || []).forEach(o => {
      if (o && o.status !== 'encerrada') ops[o.id] = o;
    });
    for (const d of data.debts || []) {
      if (!d || !ops[d.operationId] || inRows.has(d.id) || inSilenced.has(d.id)) continue;
      if (d.status === 'extinta') continue;
      const typ = d.prescriptionHandledType || '';
      if (d.prescriptionHandled && HANDLED_TERMINAL.has(typ || 'declarada') && typ !== 'aguardando_reconhecimento') continue;
      const execsD = matchingExecsForDebt(d, executions, collectIndex);
      const related = eventsTouchingDebt(d, execsD, events, collectIndex);
      if (parcelamentoVigentePorEvento(related, asOfIso)) {
        const r = lookup(d);
        const cedo = r && r.band && r.band.cedo && r.band.cedo.diesAdQuem;
        silenced.push({
          debtId: d.id,
          reason: 'parcelamento_vigente',
          until: cedo ? addCalendarDays(cedo, -PRESC_ALERT_WINDOW) : '',
          label: 'Parcelamento vigente',
          group: 4
        });
      } else if (d.status === 'parcelada' || d.status === 'negociada_sispar' || execsD.some(e => e && e.status === 'suspensa_parcelamento')) {
        silenced.push({
          debtId: d.id,
          reason: 'parcelada_ficha',
          until: '',
          label: 'Parcelada na ficha (adesão não lançada)',
          group: 4
        });
      }
    }
  }

  const totals = {
    1: { n: 0, value: 0 },
    2: { n: 0, value: 0 },
    3: { n: 0, value: 0 },
    4: { n: 0, value: 0 },
    5: { n: 0, value: 0 },
    6: { n: 0, value: 0 },
    7: { n: 0, value: 0 }
  };
  const byOp = {};
  rows.forEach(r => {
    if (totals[r.group]) {
      totals[r.group].n++;
      totals[r.group].value += r.value || 0;
    }
    // Consumada recente continua no grupo de alerta e também conta no card Consumada
    if (r.consumada === 'recent' && totals[6]) {
      totals[6].n++;
      totals[6].value += r.value || 0;
    }
    if (!r.operationId) return;
    if (!byOp[r.operationId]) byOp[r.operationId] = { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, g6: 0, g7: 0, risco: 0, completar: 0 };
    const slot = byOp[r.operationId];
    slot['g' + r.group] = (slot['g' + r.group] || 0) + 1;
    if (r.consumada === 'recent') slot.g6 = (slot.g6 || 0) + 1;
    if (r.group === 1 || r.group === 2) slot.risco++;
    if (r.group === 3) slot.completar++;
  });
  const out = {
    rows,
    totals,
    byOp,
    incidents: buildPrazosIncidentBlocks(data, rows),
    buckets,
    divergencias: rows.filter(r => r.decisionNote).length
  };
  if (policy === 'v2') {
    out.silenced = silenced;
    out.processNotes = processNotes;
  }
  return out;
}

export function prazosRiskMetaForCdas(cdas, byDebt) {
  let n1 = 0;
  let n2 = 0;
  let n3 = 0;
  let minGroup = 9;
  const days = [];
  (cdas || []).forEach(d => {
    if (!d || d.prescriptionHandled) return;
    const row = byDebt && typeof byDebt.get === 'function' ? byDebt.get(d.id) : null;
    const g = (row && row.group) || 0;
    if (g === 1) n1++;
    else if (g === 2) n2++;
    else if (g === 3) n3++;
    if (g && g < minGroup) minGroup = g;
    if (row && (g === 1 || g === 2) && row.prescDays != null) days.push(row.prescDays);
  });
  const allHandled = (cdas || []).length > 0 && (cdas || []).every(d => d.prescriptionHandled);
  const risco = n1 + n2;
  const label = allHandled ? 'Tratadas'
    : n1 ? n1 + ' urgentes'
    : n2 ? n2 + ' a conferir'
    : n3 ? n3 + ' a completar'
    : minGroup === 5 ? 'ainda impossível'
    : minGroup === 6 ? 'consumada'
    : minGroup < 9 ? 'em acompanhamento'
    : '—';
  const riskClass = allHandled ? 'ok' : n1 ? 'critical' : (n2 || n3) ? 'warning' : '';
  const minRiskDays = days.length ? Math.min(...days) : null;
  return { n1, n2, n3, risco, label, riskClass, minRiskDays };
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMÓRIA TÉCNICA EXPORTÁVEL (texto para colar em peça)
// ═══════════════════════════════════════════════════════════════════════════

const _money = (v) => (v == null || isNaN(Number(v))) ? '—'
  : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REPORT_SECTION_TITLES = {
  decadencia: 'DECADÊNCIA (arts. 150, §4º, e 173 do CTN; Súmulas 555 e 622/STJ; Tema 163/STJ)',
  ordinaria: 'PRESCRIÇÃO ORDINÁRIA (art. 174 do CTN; Tema 383/STJ; Súmulas 436 e 653/STJ)',
  intercorrente: 'PRESCRIÇÃO INTERCORRENTE (art. 40 da LEF; Súmula 314/STJ; Temas 566–571/STJ; Tema 390/STF). Ciclo pós-parcelamento = política interna, não marco do Tema 566.'
};

function reportSection(lines, roman, key, result) {
  if (!result) return;
  lines.push(`${roman}. ${REPORT_SECTION_TITLES[key]}`);
  if (result.summary) lines.push(result.summary);
  let n = 1;
  (result.memory || []).forEach(m => {
    lines.push(`${n++}. ${m.date ? fmtDate(m.date) + ' — ' : ''}${m.event}: ${m.effect}`);
  });
  if (result.detail) lines.push(`Conclusão: ${result.detail}`);
  (result.flags || []).forEach(f => {
    if (f === PRESC_FLAGS.PEDIDO_SEM_DESFECHO) lines.push('🔴 Pedido na janela 1+5 sem resultado lançado — não declarar consumada.');
  });
  (result.gaps || []).forEach(g => lines.push(`🔴 ${g}`));
  lines.push('');
}

/**
 * Memória técnica de uma CDA — texto numerado e neutro, pronto para colar.
 * scope: 'completo' | 'decadencia' | 'ordinaria' | 'intercorrente'
 */
export function buildPrescricaoReport({ debt, timeline, personName = '', exec = null, scope = 'completo', asOf, includeHeader = true } = {}) {
  if (!debt || !timeline) return '';
  const L = [];
  if (includeHeader) {
    L.push('MEMÓRIA TÉCNICA — DECADÊNCIA E PRESCRIÇÃO');
    L.push('');
  }
  L.push(`CDA ${debt.cdaNumber || 's/nº'}${debt.tribute ? ' · ' + debt.tribute : ''}${debt.value != null ? ' · ' + _money(debt.value) : ''}`);
  if (personName) L.push(`Devedor: ${personName}`);
  if (debt.inscriptionDate) L.push(`Inscrição em dívida ativa: ${fmtDate(debt.inscriptionDate)}`);
  if (debt.processNumber) L.push(`Execução fiscal: ${debt.processNumber}${exec && exec.court ? ' — ' + exec.court : ''}${exec && exec.protocolDate ? ' — ajuizada em ' + fmtDate(exec.protocolDate) : ''}`);
  if (includeHeader) {
    L.push(`Gerada em ${fmtDate(asIso(asOf) || localIso(new Date()))} pelo NEXUS. Conferir os marcos nos autos antes de utilizar; itens 🔴 pendem de confirmação.`);
  }
  L.push('');
  const romans = { decadencia: 'I', ordinaria: 'II', intercorrente: 'III' };
  ['decadencia', 'ordinaria', 'intercorrente'].forEach(key => {
    if (scope !== 'completo' && scope !== key) return;
    reportSection(L, romans[key], key, timeline[key]);
  });
  return L.join('\n').trim();
}

/** Memória técnica consolidada de um processo — todas as CDAs vinculadas. */
export function buildProcessPrescricaoReport({ exec, entries = [], scope = 'completo', asOf } = {}) {
  const L = [];
  L.push('MEMÓRIA TÉCNICA CONSOLIDADA — DECADÊNCIA E PRESCRIÇÃO');
  L.push('');
  if (exec) {
    L.push(`Execução fiscal: ${exec.processNumber || 's/nº'}${exec.court ? ' — ' + exec.court : ''}${exec.protocolDate ? ' — ajuizada em ' + fmtDate(exec.protocolDate) : ''}`);
  }
  const total = entries.reduce((s, e) => s + (e.debt && e.debt.value ? e.debt.value : 0), 0);
  L.push(`${entries.length} inscrição(ões) — total ${_money(total)}`);
  L.push(`Gerada em ${fmtDate(asIso(asOf) || localIso(new Date()))} pelo NEXUS. Conferir os marcos nos autos antes de utilizar; itens 🔴 pendem de confirmação.`);
  L.push('');
  entries.forEach((e, i) => {
    L.push(`═══ ${i + 1}/${entries.length} ═══`);
    L.push(buildPrescricaoReport({ debt: e.debt, timeline: e.timeline, personName: e.personName || '', exec: e.exec || exec || null, scope, asOf, includeHeader: false }));
    L.push('');
  });
  return L.join('\n').trim();
}
