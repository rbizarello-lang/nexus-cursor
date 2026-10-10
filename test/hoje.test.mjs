import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cargaUrgencia, cargaItens, cargaMapa, composicaoDia,
  resumoCarga, resumoOperacao, resumoPlain, resumoPartes,
  atencaoItens, atencaoFrase, dowDmIso, dmIso,
  atuacoesSemana, janelaPrazos, proximoTermo, modelosReconferir,
} from '../src/lib/hoje.js';

const TODAY = '2026-10-01'; // quinta-feira

const intim = (id, deadline, extra = {}) => ({ id, dateDeadline: deadline, parties: 'Parte ' + id, status: 'pendente_analise', ...extra });
const task = (id, due, extra = {}) => ({ id, title: 'Tarefa ' + id, dueDate: due, status: 'pendente', ...extra });
const hear = (id, date, extra = {}) => ({ id, date, hearingType: 'una', time: '16:00', status: 'agendada', ...extra });

describe('Carga de prazos — itens abertos com data', () => {
  it('cor pela urgência: vencido, até 2 dias, 3 a 7 dias, 8 dias ou mais', () => {
    assert.equal(cargaUrgencia(-1), 0);
    assert.equal(cargaUrgencia(0), 1);
    assert.equal(cargaUrgencia(2), 1);
    assert.equal(cargaUrgencia(3), 2);
    assert.equal(cargaUrgencia(7), 2);
    assert.equal(cargaUrgencia(8), 3);
    assert.equal(cargaUrgencia(null), 3);
  });

  it('mesma regra da Fila: só intimação aberta com prazo, tarefa aberta com data, audiência não realizada', () => {
    const data = {
      intimations: [
        intim('a', '2026-10-04'),
        intim('b', '2026-10-05', { responseAction: { type: 'ciencia', respondedAt: '2026-09-30' } }),
        intim('c', '2026-10-05', { status: 'analisado' }),
        intim('d', ''),
      ],
      tasks: [task('a', '2026-10-04'), task('b', '2026-10-04', { status: 'concluida' }), task('c', '2026-10-04', { status: 'cancelada' }), task('d', '')],
      hearings: [hear('a', '2026-10-03'), hear('b', '2026-10-03', { status: 'realizada' }), hear('c', '2026-10-03', { status: 'cancelada' }), hear('d', '')],
    };
    const its = cargaItens(data, TODAY);
    assert.deepEqual(its.map(i => i.key).sort(), ['h' + 'a', 'ia', 'ta']);
    const byKey = Object.fromEntries(its.map(i => [i.key, i]));
    assert.equal(byKey.ia.dd, 3);
    assert.equal(byKey.ia.urg, 2);
    assert.equal(byKey.ha.urg, 1);
    assert.match(byKey.ha.label, /16:00/);
  });
});

describe('Carga de prazos — mapa por dia', () => {
  const data = {
    intimations: [intim('1', '2026-09-29'), intim('2', '2026-10-04'), intim('3', '2026-10-04'), intim('4', '2026-10-09')],
    tasks: [task('1', '2026-09-27'), task('2', '2026-10-04'), task('3', '2026-10-04'), task('4', '2026-10-04'), task('5', '2026-10-08'), task('6', '2026-12-30')],
    hearings: [hear('1', '2026-10-03'), hear('2', '2026-10-05')],
  };
  const itens = cargaItens(data, TODAY);

  it('3 semanas = 21 dias a partir de hoje; 6 semanas = 42', () => {
    const m3 = cargaMapa(itens, { today: TODAY, weeks: 3 });
    assert.equal(m3.days.length, 21);
    assert.equal(m3.days[0].iso, '2026-10-01');
    assert.equal(m3.days[0].isToday, true);
    assert.equal(m3.days[20].iso, '2026-10-21');
    assert.equal(m3.semanas.length, 3);
    assert.equal(m3.semanas[0].from, '2026-10-01');
    assert.equal(m3.semanas[0].to, '2026-10-07');
    assert.equal(cargaMapa(itens, { today: TODAY, weeks: 6 }).days.length, 42);
  });

  it('nenhum item some: dias + vencidos + além do horizonte = total de itens', () => {
    const m = cargaMapa(itens, { today: TODAY, weeks: 3 });
    const nosDias = m.days.reduce((s, d) => s + d.count, 0);
    assert.equal(nosDias + m.vencidos.length + m.alem, itens.length);
    assert.equal(m.alem, 1); // tarefa de 30/12 fica além das 3 semanas
    assert.equal(cargaMapa(itens, { today: TODAY, weeks: 14 }).alem, 0);
    assert.equal(m.vencidos.length, 2);
    assert.equal(m.total, nosDias);
  });

  it('vencidos do mais antigo para o mais novo', () => {
    const m = cargaMapa(itens, { today: TODAY, weeks: 3 });
    assert.deepEqual(m.vencidos.map(i => i.key), ['t1', 'i1']);
    assert.equal(m.vencidos[0].dd, -4);
  });

  it('dia com mais de 5 itens ganha uma segunda coluna (nenhum ponto é descartado)', () => {
    const muitos = { tasks: Array.from({ length: 7 }, (_, k) => task('m' + k, '2026-10-02')) };
    const m = cargaMapa(cargaItens(muitos, TODAY), { today: TODAY, weeks: 3 });
    const dia = m.days.find(d => d.iso === '2026-10-02');
    assert.equal(dia.count, 7);
    assert.equal(dia.cols, 2);
    assert.equal(dia.items.length, 7);
    assert.equal(m.days.find(d => d.iso === '2026-10-01').cols, 1);
  });

  it('dentro do dia: audiência, intimação, tarefa; fim de semana marcado', () => {
    const m = cargaMapa(itens, { today: TODAY, weeks: 3 });
    const dom = m.days.find(d => d.iso === '2026-10-04');
    assert.equal(dom.isWeekend, true);
    assert.deepEqual(dom.items.map(i => i.kind), ['i', 'i', 't', 't', 't']);
    const sab = m.days.find(d => d.iso === '2026-10-03');
    assert.equal(sab.isWeekend, true);
    assert.equal(sab.items[0].kind, 'h');
  });

  it('totais por tipo, pico e semana mais pesada', () => {
    const m = cargaMapa(itens, { today: TODAY, weeks: 3 });
    assert.deepEqual(m.porTipo, { i: 3, t: 4, h: 2 });
    assert.equal(m.total, 9);
    assert.equal(m.pico.iso, '2026-10-04');
    assert.equal(m.pico.count, 5);
    assert.deepEqual([m.pico.i, m.pico.t, m.pico.h], [2, 3, 0]);
    assert.equal(composicaoDia(m.pico), '5 itens: 2 intimações e 3 tarefas');
    assert.deepEqual(m.semanas.map(s => s.count), [7, 2, 0]);
    assert.equal(m.semanaPesada.idx, 0);
  });

  it('pico concentrado: 3 itens ou mais e pelo menos 1,5 vez a média dos dias com item', () => {
    const m = cargaMapa(itens, { today: TODAY, weeks: 3 });
    // 5 itens contra média 9/6 = 1,5 → concentrado
    assert.equal(m.pico.concentrado, true);
    const plano = { tasks: [task('a', '2026-10-02'), task('b', '2026-10-02'), task('c', '2026-10-03'), task('d', '2026-10-03'), task('e', '2026-10-04'), task('f', '2026-10-04')] };
    const mp = cargaMapa(cargaItens(plano, TODAY), { today: TODAY, weeks: 3 });
    assert.equal(mp.pico.count, 2);
    assert.equal(mp.pico.concentrado, false); // menos de 3
    const tres = { tasks: [task('a', '2026-10-02'), task('b', '2026-10-02'), task('c', '2026-10-02'), task('d', '2026-10-03'), task('e', '2026-10-03'), task('f', '2026-10-03')] };
    const m3 = cargaMapa(cargaItens(tres, TODAY), { today: TODAY, weeks: 3 });
    assert.equal(m3.pico.count, 3);
    assert.equal(m3.pico.concentrado, false); // 3 contra média 3: abaixo de 1,5×
  });

  it('sem itens: sem pico nem semana pesada', () => {
    const m = cargaMapa([], { today: TODAY, weeks: 3 });
    assert.equal(m.pico, null);
    assert.equal(m.semanaPesada, null);
    assert.equal(m.total, 0);
  });
});

describe('Resumo da Carga de prazos (regras fixas, sem IA)', () => {
  function cenarioDemo() {
    // 14 itens na semana 1 (5 no dom 04/10), 18 na semana 2, 11 na semana 3, 2 vencidos
    const tasks = [];
    const add = (iso, n) => { for (let k = 0; k < n; k++) tasks.push(task(iso + '-' + k, iso)); };
    add('2026-10-02', 1); add('2026-10-03', 1); add('2026-10-04', 5); add('2026-10-05', 3); add('2026-10-06', 3); add('2026-10-07', 1); // 14
    add('2026-10-08', 3); add('2026-10-09', 3); add('2026-10-10', 4); add('2026-10-11', 2); add('2026-10-12', 4); add('2026-10-13', 2); // 18
    add('2026-10-15', 3); add('2026-10-16', 2); add('2026-10-17', 2); add('2026-10-19', 2); add('2026-10-20', 2); // 11
    tasks.push(task('v1', '2026-09-27'), task('v2', '2026-09-29'));
    return cargaMapa(cargaItens({ tasks }, TODAY), { today: TODAY, weeks: 3 });
  }

  it('pico + semana mais pesada + vencidos, em até 3 orações', () => {
    const m = cenarioDemo();
    assert.deepEqual(m.semanas.map(s => s.count), [14, 18, 11]);
    const txt = resumoPlain(resumoCarga(m));
    assert.equal(txt, 'Carga concentrada em dom 04/10 (5 itens: 5 tarefas). A semana de 08/10 é a mais pesada: 18 itens, contra 14 na atual. 2 itens vencidos; o mais antigo, há 4 dias.');
  });

  it('o texto marca os destaques em negrito (**) e não cita IA', () => {
    const m = cenarioDemo();
    const s = resumoCarga(m);
    const partes = resumoPartes(s);
    assert.ok(partes.some(p => p.b && p.t === 'dom 04/10'));
    assert.ok(!/\bIA\b|inteligência/i.test(resumoPlain(s)));
  });

  it('audiência em até 3 dias entra; mais longe não; no máximo 3 orações', () => {
    const m = cenarioDemo();
    const comAud = resumoPlain(resumoCarga(m, { dias: 2, time: '16:00' }));
    assert.equal(comAud.split('. ').length, 3); // a 4ª oração é cortada
    const so = cargaMapa([], { today: TODAY, weeks: 3 });
    assert.equal(resumoPlain(resumoCarga(so, { dias: 2, time: '16:00' })), 'Audiência em 2 dias (16:00).');
    assert.equal(resumoCarga(so, { dias: 5, time: '16:00' }), '');
    assert.equal(resumoPlain(resumoCarga(so, { dias: 0 })), 'Audiência hoje.');
  });

  it('um vencido só: singular', () => {
    const m = cargaMapa(cargaItens({ tasks: [task('v', '2026-09-30')] }, TODAY), { today: TODAY, weeks: 3 });
    assert.equal(resumoPlain(resumoCarga(m)), '1 item vencido; há 1 dia.');
  });

  it('nada a dizer: devolve vazio (a UI esconde a linha)', () => {
    assert.equal(resumoCarga(cargaMapa([], { today: TODAY, weeks: 3 })), '');
  });

  it('semana mais pesada só quando não é a atual', () => {
    const tasks = [task('a', '2026-10-02'), task('b', '2026-10-02'), task('c', '2026-10-09')];
    const m = cargaMapa(cargaItens({ tasks }, TODAY), { today: TODAY, weeks: 3 });
    assert.equal(m.semanaPesada.idx, 0);
    assert.equal(resumoCarga(m), '');
  });
});

describe('Resumo da Visão geral da operação', () => {
  it('exemplo da maquete (Fachada Norte)', () => {
    const txt = resumoOperacao({
      garantiaPct: 18, carteiraPct: 24,
      intimVencidas: { n: 1, maisAntigaDias: 2, parte: 'Marina Ferreira Norte' },
      cdasAlarme: 0, revisaoAtrasadaDias: 10,
      audiencia: { dias: 4, tipo: 'justificação', iso: '2026-10-05', time: '14:30' },
    });
    assert.equal(resumoPlain(txt), 'Garantia de 18%, abaixo da média da carteira (24%). 1 intimação vencida há 2 dias (Marina Ferreira Norte). Revisão atrasada há 10 dias. Próxima audiência: justificação, seg 05/10, 14:30.');
  });

  it('cada trecho só entra se a condição for verdadeira', () => {
    assert.equal(resumoOperacao({ garantiaPct: 20, carteiraPct: 24, intimVencidas: null, cdasAlarme: 0, revisaoAtrasadaDias: null, audiencia: null }), '');
    assert.equal(resumoPlain(resumoOperacao({ garantiaPct: 71, carteiraPct: 24, cdasAlarme: 2 })), 'Garantia de 71%, acima da média da carteira (24%). 2 CDAs a agir nos prazos extintivos.');
    assert.equal(resumoPlain(resumoOperacao({ garantiaPct: null, carteiraPct: 24, cdasAlarme: 1, revisaoAtrasadaDias: 1 })), '1 CDA a agir nos prazos extintivos. Revisão atrasada há 1 dia.');
    assert.equal(resumoOperacao({ audiencia: { dias: 9, tipo: 'una', iso: '2026-10-10' } }), '');
  });

  it('indisponibilidade: razão de 1× ou mais abre o Resumo e dispensa a comparação com a carteira', () => {
    const txt = resumoOperacao({ indispRatio: 2.6, indispPct: 100, indispCarteiraPct: 59, garantiaPct: 71, carteiraPct: 24 });
    assert.equal(resumoPlain(txt), 'Bens indisponíveis cobrem 2,6× a dívida. Garantia de 71%, acima da média da carteira (24%).');
    assert.equal(resumoPartes(txt).filter(x => x.b)[0].t, '2,6×');
  });

  it('indisponibilidade: 5 p.p. ou mais longe da carteira, antes da garantia', () => {
    const baixo = resumoOperacao({ indispRatio: 0.47, indispPct: 47, indispCarteiraPct: 59, garantiaPct: 18, carteiraPct: 24 });
    assert.equal(resumoPlain(baixo), 'Indisponibilidade de 47% da dívida, abaixo da média da carteira (59%). Garantia de 18%, abaixo da média da carteira (24%).');
    assert.equal(resumoPlain(resumoOperacao({ indispRatio: 0.8, indispPct: 80, indispCarteiraPct: 59 })), 'Indisponibilidade de 80% da dívida, acima da média da carteira (59%).');
  });

  it('indisponibilidade: diferença pequena ou sem comparação não entra (garantia segue igual)', () => {
    assert.equal(resumoOperacao({ indispRatio: 0.62, indispPct: 62, indispCarteiraPct: 59 }), '');
    assert.equal(resumoOperacao({ indispRatio: 0.2, indispPct: 20, indispCarteiraPct: null }), '');
    assert.equal(resumoOperacao({ indispRatio: null, indispPct: null, indispCarteiraPct: 59 }), '');
    assert.equal(resumoPlain(resumoOperacao({ indispPct: 55, indispCarteiraPct: 59, garantiaPct: 71, carteiraPct: 24 })), 'Garantia de 71%, acima da média da carteira (24%).');
  });
});

describe('Precisa de atenção', () => {
  // Linhas das CDAs a agir (fileira 1 dos cartões da Mesa); quem chama já filtra, a lib não olha mais o grupo do motor.
  const rows = [
    { id: 'd2', prescDays: 160, cdaNumber: '90.6.20.000881-40', operationId: 'op1', value: 95000 },
    { id: 'd1', prescDays: 70, cdaNumber: '90.6.23.000884-40', operationId: 'op1', value: 48000 },
    { id: 'd4', prescDays: null, cdaNumber: 'sem-data', operationId: 'op2', value: 1 },
  ];
  const operations = [
    { id: 'op1', name: 'Agro Horizonte' }, { id: 'op2', name: 'Fachada Norte' }, { id: 'op3', name: 'Holding' },
    { id: 'op4', name: 'Encerrada', status: 'encerrada' },
  ];
  const dias = { op1: -4, op2: -10, op3: 80, op4: -50 };
  const reviewOf = (op) => ({ overdue: dias[op.id] < 0, daysLeft: dias[op.id], intervalLabel: 'quinzenal' });

  it('CDAs a agir do termo mais próximo ao mais distante (sem data por último)', () => {
    const a = atencaoItens({ rows, operations, reviewOf });
    assert.deepEqual(a.cdas.map(r => r.id), ['d1', 'd2', 'd4']);
  });

  it('revisões atrasadas da mais atrasada para a menos, sem operações encerradas', () => {
    const a = atencaoItens({ rows, operations, reviewOf });
    assert.deepEqual(a.revisoes.map(r => [r.op.id, r.diasAtraso]), [['op2', 10], ['op1', 4]]);
    assert.equal(a.total, 5);
  });

  it('frase do painel', () => {
    assert.equal(atencaoFrase(atencaoItens({ rows: rows.slice(0, 2), operations, reviewOf })), '4 itens pedem uma decisão sua: 2 CDAs a agir e 2 revisões atrasadas');
    assert.equal(atencaoFrase(atencaoItens({ rows: [], operations: [], reviewOf })), '');
    assert.equal(atencaoFrase(atencaoItens({ rows: [rows[1]], operations: [], reviewOf })), '1 item pede uma decisão sua: 1 CDA a agir');
  });
});

describe('formatação de datas curtas', () => {
  it('dia da semana e dd/mm', () => {
    assert.equal(dowDmIso('2026-10-04'), 'dom 04/10');
    assert.equal(dowDmIso('2026-10-01'), 'qui 01/10');
    assert.equal(dmIso('2026-10-08'), '08/10');
  });
});

describe('Números dos cartões da tela Hoje', () => {
  const resp = (id, at) => ({ id, responseAction: { type: 'ciencia', respondedAt: at } });

  it('atuadas em 7 dias contra os 7 anteriores', () => {
    const r = atuacoesSemana([
      resp('a', '2026-10-01T10:00:00.000Z'), resp('b', '2026-09-28T10:00:00.000Z'), resp('c', '2026-09-25'), // atual: hoje, -3, -6
      resp('d', '2026-09-24'), // -7: anterior
      resp('e', '2026-09-18'), // -13: anterior
      resp('f', '2026-09-17'), // -14: fora
      resp('g', '2026-10-02'), // futuro: fora
      { id: 'h' }, // sem atuação
    ], TODAY);
    assert.deepEqual(r, { atual: 3, anterior: 2, delta: 1 });
  });

  it('janela de prazos: 5 dias, 5 seguintes e o próximo', () => {
    const j = janelaPrazos([
      intim('1', '2026-10-01'), intim('2', '2026-10-04'), intim('3', '2026-10-06'), // 0, 3, 5
      intim('4', '2026-10-07'), intim('5', '2026-10-11'), // 6, 10
      intim('6', '2026-10-12'), // 11: fora
      intim('7', '2026-09-30'), // vencida: fora
      intim('8', ''),
    ], TODAY);
    assert.equal(j.prox5, 3);
    assert.equal(j.seg5, 2);
    assert.equal(j.delta, -1);
    assert.equal(j.proximo.iso, '2026-10-01');
    assert.equal(janelaPrazos([], TODAY).proximo, null);
  });

  it('próximo termo: menor prescDays entre as CDAs a agir, com a data a partir de hoje', () => {
    const t = proximoTermo([
      { id: 'a', prescDays: 160 }, { id: 'b', prescDays: 70 }, { id: 'd', prescDays: null },
    ], TODAY);
    assert.equal(t.dias, 70);
    assert.equal(t.iso, '2026-12-10');
    assert.equal(t.row.id, 'b');
    assert.equal(proximoTermo([{ id: 'x', prescDays: null }], TODAY), null);
    assert.equal(proximoTermo([], TODAY), null);
  });
});

describe('Biblioteca — vigência a reconferir', () => {
  const mod = (id, extra = {}) => ({ id, number: id, title: 'Modelo ' + id, ...extra });

  it('entra quem tem pontos a reconferir ou consolidação com 180 dias ou mais', () => {
    const r = modelosReconferir([
      mod('1'),
      mod('2', { vigencia: { recheck: ['a', 'b', '  ', ''] }, consolidatedAt: '2026-08-28' }),
      mod('3', { consolidatedAt: '2026-03-31' }), // 184 dias
      mod('4', { consolidatedAt: '2026-04-05' }), // 179 dias: ainda não
      mod('5', { vigencia: { fragile: 'texto', recheck: [] } }),
    ], TODAY);
    assert.deepEqual(r.map(x => x.model.id), ['2', '3']);
    assert.equal(r[0].pontos, 2);
    assert.equal(r[0].diasConsolidado, 34);
    assert.equal(r[1].pontos, 0);
    assert.equal(r[1].diasConsolidado, 184);
  });

  it('ordena por pontos e, no empate, pela consolidação mais antiga; sem nada, lista vazia', () => {
    const r = modelosReconferir([
      mod('a', { vigencia: { recheck: ['x'] }, consolidatedAt: '2026-09-01' }),
      mod('b', { vigencia: { recheck: ['x'] }, consolidatedAt: '2026-01-01' }),
      mod('c', { vigencia: { recheck: ['x', 'y'] } }),
    ], TODAY);
    assert.deepEqual(r.map(x => x.model.id), ['c', 'b', 'a']);
    assert.deepEqual(modelosReconferir([mod('z'), null], TODAY), []);
    assert.deepEqual(modelosReconferir(undefined, TODAY), []);
  });
});
