/**
 * Relógio da prescrição por CDA (Nexus Prumo, M4 da Linha do tempo) — funções puras, sem DOM nem React.
 *
 * Nada aqui calcula prescrição: tudo vem do motor (`prescLookup(debt)`) e da Mesa de prazos
 * (`buildPrazosRadar`: linhas e silenciados). Onde a Mesa tem uma linha para a CDA, o termo e os dias são os
 * DELA (`prescDate`/`prescDays`) — assim a tela de Relógios e a Mesa nunca discordam; onde a Mesa não lista
 * (termo distante, CDA ainda sem alarme), vale o termo do motor.
 *
 * Cada relógio vira uma linha com um dos tipos:
 *  - orig  : CDA sem processo, 5 anos para ajuizar (art. 174 CTN);
 *  - inter : prescrição intercorrente em curso (1 ano de suspensão + 5 anos, art. 40 LEF);
 *  - parc  : relógio parado (parcelamento/transação vigente ou pausa cadastrada);
 *  - piso  : sem relógio ativo — ciclo encerrado por ato útil ou intercorrente ainda não iniciada: só vale o piso;
 *  - sem   : sem dado para calcular.
 * e um dos grupos de risco: crit (≤ 90 d) · alerta (≤ 1 ano) · corre · parado · piso · sem.
 *
 * `clkSimulateFiling` responde "e se eu ajuizar hoje?" chamando o próprio motor com um ajuizamento hipotético
 * (processo e evento de mentira, só na memória): nada é gravado e a calculadora não é tocada.
 */
import { addCalendarYears, daysBetween, localIso, normProc, sameProc, toDayKey } from './dates.js';
import { computePrescription, isAdesaoType } from './prescription.js';

export const CLK_CRIT_DAYS = 90;
export const CLK_ALERT_DAYS = 365;

/** Grupos na ordem de leitura: [chave, rótulo, tom (token --cx-*)]. */
export const CLK_GROUPS = [
  { key: 'crit', label: 'Crítico · termo em até 90 dias', tone: 'red' },
  { key: 'alerta', label: 'Alerta · termo em até 1 ano', tone: 'orange' },
  { key: 'corre', label: 'Correndo', tone: 'yellow' },
  { key: 'parado', label: 'Relógio parado · parcelamento ou pausa vigente', tone: 'green' },
  { key: 'piso', label: 'Sem relógio ativo · só vale o piso', tone: 'cyan' },
  { key: 'sem', label: 'Sem dado para calcular o relógio', tone: 'grey' },
];
export const CLK_GROUP_KEYS = CLK_GROUPS.map(g => g.key);

const PARC_REASONS = new Set(['parcelamento_vigente', 'parcelada_ficha']);
const SIM_PROC = '9999999-99.9999.4.99.9999';

/** Grupo de risco de um termo a `days` dias de hoje (negativo = já passou). `forceCrit`: linha do grupo 1 da Mesa. */
export function clkGroupOfDays(days, forceCrit) {
  if (forceCrit) return 'crit';
  if (days == null) return 'sem';
  if (days <= CLK_CRIT_DAYS) return 'crit';
  if (days <= CLK_ALERT_DAYS) return 'alerta';
  return 'corre';
}

/** Data (ISO) da adesão mais recente na linha do tempo do motor — "vigente desde". Vazia se o motor não vê adesão. */
export function clkParcSince(r) {
  let best = '';
  ((r && r.timeline) || []).forEach(ev => {
    if (!ev || !isAdesaoType(ev.type)) return;
    const d = toDayKey(ev.requestDate || ev.date);
    if (d && d > best) best = d;
  });
  return best;
}

/**
 * Classifica UMA CDA. Entrada: { debt, r (motor), row (linha da Mesa ou undefined), silenced (item ou undefined), today }.
 * Devolve null (CDA fora: tratada/extinta), { skip: 'consumada' } (fica na aba Consumadas) ou o relógio:
 * { kind, group, term, termDays, start, floor, anchor, since, cause, segs, estimated }.
 */
export function clkClassify({ debt, r, row, silenced, today }) {
  if (!debt || !r || debt.status === 'extinta') return null;
  if (row && row.group === 6) return { skip: 'consumada' };
  const t = toDayKey(today) || localIso(new Date());
  const days = (iso) => (iso ? daysBetween(t, iso) : null);
  const estimated = !!(row ? row.estimated || /estimad/i.test(String(row.prescKind || '')) : r.estimated);

  // Relógio parado: parcelamento/transação vigente (silenciado pela Mesa) ou pausa cadastrada que o motor já aplica.
  const parcSil = !!(silenced && PARC_REASONS.has(silenced.reason));
  if (parcSil || r.phase === 'suspenso' || r.status === 'suspenso') {
    const since = clkParcSince(r);
    const cause = parcSil || ((r.timeline || []).some(ev => ev && isAdesaoType(ev.type))) ? 'parcelamento' : 'pausa';
    return { kind: 'parc', group: 'parado', since, cause, term: '', termDays: null, estimated };
  }

  if (r.segment === 'intercorrente') {
    const floor = toDayKey(r.bounds && r.bounds.floor) || (row && (row.prescKind === 'acompanhar_piso' || row.prescKind === 'vigiar_interrompido') ? toDayKey(row.prescDate) : '');
    const closed = !!(r.interruptAt || r.phase === 'nao_iniciado' || r.phase === 'interrompido' || r.status === 'interrompido');
    if (closed) {
      if (!floor) return { kind: 'sem', group: 'sem', term: '', termDays: null, estimated };
      const fa = r.bounds && r.bounds.floorAnchor;
      const anchor = fa && toDayKey(fa.iso) ? { iso: toDayKey(fa.iso), kind: fa.kind || '' } : null;
      return { kind: 'piso', group: 'piso', floor, floorDays: days(floor), anchor, interruptAt: toDayKey(r.interruptAt) || '', ceased: !!r.interruptAt, term: '', termDays: null, estimated };
    }
    const term = toDayKey(row ? (row.prescDate || row.keyDate) : r.diesAdQuem) || toDayKey(r.diesAdQuem);
    if (!term) return { kind: 'sem', group: 'sem', term: '', termDays: null, estimated };
    const start = toDayKey(r.diesAQuo) || addCalendarYears(term, -6);
    const yearEnd = addCalendarYears(start, 1);
    const segs = [{ t: 'susp', from: start, to: yearEnd < term ? yearEnd : term }];
    if (yearEnd < term) segs.push({ t: 'inter', from: yearEnd, to: term });
    const d = row && row.prescDays != null ? row.prescDays : days(term);
    return { kind: 'inter', group: clkGroupOfDays(d, row && row.group === 1), term, termDays: d, start, segs, estimated };
  }

  // Originária (CDA ainda sem processo): 5 anos do dies a quo (ou, sem ele, os 5 anos que terminam no termo).
  const term = toDayKey(row ? (row.prescDate || row.keyDate) : r.diesAdQuem) || toDayKey(r.diesAdQuem);
  if (!term) return { kind: 'sem', group: 'sem', term: '', termDays: null, estimated };
  const d = row && row.prescDays != null ? row.prescDays : days(term);
  const start0 = toDayKey(r.diesAQuo);
  const start = start0 && start0 < term ? start0 : addCalendarYears(term, -5);
  return { kind: 'orig', group: clkGroupOfDays(d, row && row.group === 1), term, termDays: d, start, startKnown: !!(start0 && start0 < term), estimated };
}

const byTermAsc = (a, b) => {
  const da = a.term || a.floor || a.since || '9999-12-31';
  const db = b.term || b.floor || b.since || '9999-12-31';
  return da < db ? -1 : da > db ? 1 : (Number(b.value) || 0) - (Number(a.value) || 0);
};

/** Ordem de leitura: por grupo de risco e, dentro dele, o termo/piso mais próximo (depois o maior valor). */
export function clkSort(clocks) {
  const order = (c) => CLK_GROUP_KEYS.indexOf(c.group);
  return (clocks || []).slice().sort((a, b) => order(a) - order(b) || byTermAsc(a, b));
}

/**
 * Monta os relógios.
 *   data      — { debts, operations, executions, people? }
 *   rows      — prazosRadar.rows (Mesa);  silenced — prazosRadar.silenced
 *   lookup    — prescLookup (createPrescLookup)
 *   opId      — '' ou o id de uma operação; opIds (opcional) — conjunto permitido (padrão: operações não encerradas)
 *   debtIds   — (opcional) Set de ids de CDA: só estas entram (a aba Inscrições passa as que sobraram dos filtros de busca e Pessoa)
 * Uma linha por CDA sem processo; CDAs do mesmo processo (e do mesmo tipo de relógio) andam juntas numa linha só,
 * com `n` CDAs, o valor somado e o termo/piso mais próximo — como a Mesa agrupa a intercorrente.
 */
export function clkBuild({ data, rows, silenced, lookup, today, opId, debtIds } = {}) {
  const t = toDayKey(today) || localIso(new Date());
  const ops = new Map((data && data.operations || []).filter(o => o && o.status !== 'encerrada').map(o => [o.id, o]));
  const people = new Map(((data && data.people) || []).filter(p => p && p.id).map(p => [p.id, p]));
  const rowBy = new Map((rows || []).filter(Boolean).map(r => [r.id, r]));
  const silBy = new Map((silenced || []).filter(Boolean).map(s => [s.debtId, s]));
  const execs = (data && data.executions) || [];
  const groups = new Map();
  let consumadas = 0, tratadas = 0;
  ((data && data.debts) || []).forEach(debt => {
    if (!debt || !ops.has(debt.operationId) || (opId && debt.operationId !== opId)) return;
    if (debtIds && !debtIds.has(debt.id)) return; // recorte de quem chama (os filtros da aba Inscrições)
    if (debt.status === 'extinta') return;
    if (debt.prescriptionHandled && debt.prescriptionHandledType !== 'aguardando_reconhecimento') { tratadas++; return; }
    let r = null;
    try { r = lookup(debt); } catch (e) { r = null; }
    const row = rowBy.get(debt.id);
    const c = clkClassify({ debt, r, row, silenced: silBy.get(debt.id), today: t });
    if (!c) return;
    if (c.skip) { consumadas++; return; }
    const exec = debt.processNumber ? execs.find(e => e.operationId === debt.operationId && sameProc(e.processNumber, debt.processNumber)) : null;
    const procKey = debt.processNumber ? normProc(debt.processNumber) : '';
    const key = procKey ? [c.kind, debt.operationId, procKey].join('|') : 'cda|' + debt.id;
    const item = { debt, c, row, r };
    if (!groups.has(key)) groups.set(key, { key, kind: c.kind, operationId: debt.operationId, opName: ops.get(debt.operationId).name || '', processNumber: debt.processNumber || '', executionId: (exec && exec.id) || (row && row.executionId) || '', items: [] });
    groups.get(key).items.push(item);
  });
  const clocks = [];
  groups.forEach(g => {
    g.items.sort((a, b) => byTermAsc({ ...a.c, value: a.debt.value }, { ...b.c, value: b.debt.value }));
    const lead = g.items[0];
    const c = lead.c;
    const personId = lead.debt.personId;
    clocks.push({
      id: g.key,
      kind: g.kind,
      group: g.items.reduce((best, it) => (CLK_GROUP_KEYS.indexOf(it.c.group) < CLK_GROUP_KEYS.indexOf(best) ? it.c.group : best), c.group),
      operationId: g.operationId,
      opName: g.opName,
      processNumber: g.processNumber,
      executionId: g.executionId,
      leadId: lead.debt.id,
      leadNumber: lead.debt.cdaNumber || 'S/N',
      cdaIds: g.items.map(it => it.debt.id),
      cdaNumbers: g.items.map(it => it.debt.cdaNumber || 'S/N'),
      n: g.items.length,
      value: g.items.reduce((s, it) => s + (Number(it.debt.value) || 0), 0),
      tribute: lead.debt.tribute || lead.debt.origin || '',
      personName: (lead.row && lead.row.personName) || ((people.get(personId) || {}).name) || '',
      term: c.term || '',
      termDays: c.termDays == null ? null : c.termDays,
      start: c.start || '',
      startKnown: !!c.startKnown,
      segs: c.segs || [],
      floor: c.floor || '',
      floorDays: c.floorDays == null ? null : c.floorDays,
      anchor: c.anchor || null,
      since: c.since || '',
      cause: c.cause || '',
      estimated: !!c.estimated,
      mesaGroup: lead.row ? lead.row.group : null,
      mesaKind: lead.row ? (lead.row.prescKind || '') : '',
      hasRow: !!lead.row,
      row: lead.row || null,
      debt: lead.debt,
    });
  });
  return { clocks: clkSort(clocks), consumadas, tratadas, kpis: clkKpis(clocks, t), today: t };
}

/** Números do topo: próximo termo (o que ainda vai vencer), já vencidos, termos em até 1 ano, parado, sem relógio (piso). */
export function clkKpis(clocks, todayIso) {
  const list = clocks || [];
  const live = list.filter(c => (c.kind === 'orig' || c.kind === 'inter') && c.term);
  const upcoming = live.filter(c => c.termDays != null && c.termDays >= 0);
  const next = upcoming.slice().sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0))[0] || null;
  const overdue = live.filter(c => c.termDays != null && c.termDays < 0);
  const near = live.filter(c => c.termDays != null && c.termDays <= CLK_ALERT_DAYS);
  const sum = (arr) => arr.reduce((s, c) => s + (Number(c.value) || 0), 0);
  const cdas = (arr) => arr.reduce((s, c) => s + (c.n || 1), 0);
  const parc = list.filter(c => c.kind === 'parc');
  const piso = list.filter(c => c.kind === 'piso');
  const nearestFloor = piso.map(c => c.floor).filter(Boolean).sort()[0] || '';
  return {
    next: next ? { id: next.id, term: next.term, days: next.termDays, cda: next.leadNumber, opName: next.opName, n: next.n } : null,
    overdue: { rows: overdue.length, cdas: cdas(overdue), value: sum(overdue) },
    near: { rows: near.length, cdas: cdas(near), value: sum(near) },
    parc: { rows: parc.length, cdas: cdas(parc), value: sum(parc) },
    piso: { rows: piso.length, cdas: cdas(piso), value: sum(piso), nearestFloor },
  };
}

/**
 * Pontos do calendário de termos (hoje → último termo/piso): { id, d, kind: 'term'|'piso', group, label }.
 * `to` é o fim do eixo (último ponto, arredondado para o fim do ano), `from` é hoje.
 */
export function clkStrip(clocks, todayIso) {
  const t = toDayKey(todayIso) || localIso(new Date());
  const pts = [];
  (clocks || []).forEach(c => {
    if ((c.kind === 'orig' || c.kind === 'inter') && c.term) pts.push({ id: c.id, d: c.term, kind: 'term', group: c.group, n: c.n, number: c.leadNumber });
    else if (c.kind === 'piso' && c.floor) pts.push({ id: c.id, d: c.floor, kind: 'piso', group: c.group, n: c.n, number: c.leadNumber });
  });
  pts.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const last = pts.length ? pts[pts.length - 1].d : t;
  const toYear = Math.max(+t.slice(0, 4) + 1, +last.slice(0, 4));
  const from = t;
  const to = toYear + '-12-31';
  const overdue = pts.filter(p => p.d < t);
  return { from, to, points: pts, overdue: overdue.length, years: Array.from({ length: toYear - +t.slice(0, 4) + 1 }, (_, i) => +t.slice(0, 4) + i) };
}

/** Posição (0..1) de `iso` entre `a` e `b`, truncada. */
export function clkPct(a, b, iso) {
  const tot = daysBetween(a, b);
  if (!(tot > 0)) return 0;
  return Math.max(0, Math.min(1, daysBetween(a, iso) / tot));
}

/**
 * "E se eu ajuizar hoje?" — roda o motor com um ajuizamento hipotético (processo e despacho que ordena a citação,
 * ambos de hoje), só na memória. Só vale para CDA ainda sem processo e com termo ainda por vir.
 * Devolve { ok:true, floor, anchor, status, phase, segment, gaps } ou { ok:false, reason } (o motivo vira o texto
 * do botão desativado). Nunca grava nada nem altera os argumentos.
 */
export function clkSimulateFiling({ debt, executions, events, today } = {}) {
  const t = toDayKey(today) || localIso(new Date());
  if (!debt) return { ok: false, reason: 'CDA não encontrada.' };
  if (debt.processNumber) return { ok: false, reason: 'Esta CDA já tem processo: não há ajuizamento a simular.' };
  let before = null;
  try { before = computePrescription({ debt, executions: executions || [], events: events || [], asOf: t }); } catch (e) { before = null; }
  if (!before || before.segment !== 'credito') return { ok: false, reason: 'O motor não trata esta CDA como ainda não ajuizada.' };
  const term = toDayKey(before.diesAdQuem);
  if (term && term < t) return { ok: false, reason: 'O termo já passou: ajuizar hoje não reinicia o prazo. Confira nos autos.' };
  const simExec = { id: '__sim_exec__', processNumber: SIM_PROC, protocolDate: t, status: 'ativa', operationId: debt.operationId };
  const simDebt = { ...debt, processNumber: SIM_PROC };
  const simEvents = (events || []).concat([{ id: '__sim_ev__', cdaId: debt.id, executionId: simExec.id, type: 'int_despacho_citacao', date: t }]);
  let after = null;
  try { after = computePrescription({ debt: simDebt, executions: (executions || []).concat([simExec]), events: simEvents, asOf: t }); } catch (e) { after = null; }
  const floor = after && after.bounds && toDayKey(after.bounds.floor);
  if (!after || !floor) return { ok: false, reason: 'O motor não devolveu um piso para este cenário.' };
  const fa = after.bounds.floorAnchor;
  return { ok: true, floor, anchor: { iso: toDayKey(fa && fa.iso) || t, kind: (fa && fa.kind) || 'despacho' }, status: after.status, phase: after.phase, segment: after.segment, before: { term, status: before.status } };
}

/**
 * Aplica o resultado de `clkSimulateFiling` a um relógio (só para exibir): vira "sem relógio ativo" com o piso do
 * cenário e `simulated: true`. Sem simulação válida devolve o mesmo relógio. Não altera o original.
 */
export function clkApplySim(clock, sim, today) {
  if (!clock || !sim || !sim.ok) return clock;
  const t = toDayKey(today) || localIso(new Date());
  return {
    ...clock,
    kind: 'piso',
    group: 'piso',
    term: '',
    termDays: null,
    floor: sim.floor,
    floorDays: daysBetween(t, sim.floor),
    anchor: sim.anchor,
    simulated: true,
    simBefore: { term: clock.term, termDays: clock.termDays, group: clock.group },
  };
}
