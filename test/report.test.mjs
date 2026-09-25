import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  escHtml,
  pickHighlightEntry,
  buildNext15Days,
  groupAccountingByMonth,
  tallyAccounting,
  renderReportDocument,
  reportFileName,
  defaultReportSections,
} from '../src/lib/report.js';
import { buildAgendaByDay } from '../src/lib/agenda.js';

describe('escHtml — escapa texto do usuário', () => {
  it('neutraliza &, <, > para não injetar HTML', () => {
    assert.equal(escHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.equal(escHtml('A & B'), 'A &amp; B');
    assert.equal(escHtml(null), '');
    assert.equal(escHtml(undefined), '');
  });
});

describe('pickHighlightEntry — Leitura da operação', () => {
  it('prefere a Estratégia fixada mais recente', () => {
    const entries = [
      { id: '1', type: 'observacao', pinned: true, eventDate: '2026-09-20' },
      { id: '2', type: 'estrategia', pinned: true, eventDate: '2026-09-10' },
      { id: '3', type: 'estrategia', pinned: true, eventDate: '2026-09-18' },
      { id: '4', type: 'estrategia', pinned: false, eventDate: '2026-09-25' },
    ];
    const picked = pickHighlightEntry(entries);
    assert.equal(picked.id, '3');
  });

  it('sem Estratégia fixada, usa a fixada mais recente de qualquer tipo', () => {
    const entries = [
      { id: '1', type: 'observacao', pinned: true, eventDate: '2026-09-12' },
      { id: '2', type: 'risco', pinned: true, createdAt: '2026-09-20T10:00:00.000Z' },
      { id: '3', type: 'providencia', pinned: false, eventDate: '2026-09-25' },
    ];
    const picked = pickHighlightEntry(entries);
    assert.equal(picked.id, '2');
  });

  it('sem nenhuma entrada fixada, omite (retorna null)', () => {
    assert.equal(pickHighlightEntry([{ id: '1', type: 'estrategia', pinned: false }]), null);
    assert.equal(pickHighlightEntry([]), null);
    assert.equal(pickHighlightEntry(null), null);
  });
});

describe('buildNext15Days — próximos 15 dias', () => {
  const base = { fromIso: '2026-09-25', days: 15 };
  it('ordena por data e, no empate, por tipo (audiência, prazo, tarefa, prescrição)', () => {
    const items = [
      { date: '2026-09-28', kind: 'tarefa', title: 'Tarefa A' },
      { date: '2026-09-28', kind: 'prazo', title: 'Prazo B' },
      { date: '2026-09-27', kind: 'aud', title: 'Audiência' },
      { date: '2026-09-28', kind: 'aud', title: 'Audiência 2' },
    ];
    const { items: out } = buildNext15Days(items, base);
    assert.deepEqual(out.map(i => i.title), ['Audiência', 'Audiência 2', 'Prazo B', 'Tarefa A']);
  });

  it('corta no horizonte e devolve o excedente com o primeiro item como prévia', () => {
    const items = [
      { date: '2026-09-26', kind: 'tarefa', title: 'Dentro' },
      { date: '2026-10-06', kind: 'aud', title: 'No limite (11 dias)' },
      { date: '2026-10-15', kind: 'tarefa', title: 'Ofício à meeira' },
      { date: '2026-11-01', kind: 'tarefa', title: 'Bem depois' },
    ];
    const { items: within, overflow, overflowCount, overflowFirst } = buildNext15Days(items, base);
    assert.deepEqual(within.map(i => i.title), ['Dentro', 'No limite (11 dias)']);
    assert.equal(overflowCount, 2);
    assert.equal(overflow.length, 2);
    assert.equal(overflowFirst.title, 'Ofício à meeira');
  });

  it('ignora itens sem data ou anteriores ao ponto de partida', () => {
    const items = [
      { date: '', kind: 'tarefa', title: 'Sem data' },
      { date: '2026-09-01', kind: 'tarefa', title: 'Passado' },
      { date: '2026-09-25', kind: 'tarefa', title: 'Hoje' },
    ];
    const { items: within } = buildNext15Days(items, base);
    assert.deepEqual(within.map(i => i.title), ['Hoje']);
  });
});

describe('groupAccountingByMonth / tallyAccounting — Prestação de contas', () => {
  const events = [
    { date: '2026-09-25', kind: 'Peça', text: 'Minuta' },
    { date: '2026-09-22', kind: 'Diário', text: 'Risco' },
    { date: '2026-09-18', kind: 'Intimação', text: 'Manifestação' },
    { date: '2026-08-16', kind: 'Prescrição', text: 'Evento' },
    { date: '2026-08-16', kind: 'Constrição', text: 'Fazenda → ativa' },
    { date: '2026-08-05', kind: 'Intimação', text: 'Ciência' },
    { date: '2026-09-12', kind: 'Tarefa', text: 'Concluída: juntar matrícula' },
  ];

  it('agrupa por mês (mais recente primeiro) mantendo a ordem cronológica decrescente dentro do grupo', () => {
    const groups = groupAccountingByMonth(events);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].label, 'Setembro de 2026');
    assert.deepEqual(groups[0].events.map(e => e.date), ['2026-09-25', '2026-09-22', '2026-09-18', '2026-09-12']);
    assert.equal(groups[1].label, 'Agosto de 2026');
    assert.deepEqual(groups[1].events.map(e => e.date), ['2026-08-16', '2026-08-16', '2026-08-05']);
  });

  it('conta intimações, peças, fases/eventos, constrições e tarefas', () => {
    const tally = tallyAccounting(events);
    assert.deepEqual(tally, { intimacoes: 2, pecas: 1, fases: 1, constricoes: 1, tarefas: 1 });
  });

  it('eventos sem data não entram em nenhum grupo', () => {
    const groups = groupAccountingByMonth([{ date: '', kind: 'Peça', text: 'x' }, ...events.slice(0, 1)]);
    const total = groups.reduce((s, g) => s + g.events.length, 0);
    assert.equal(total, 1);
  });
});

describe('renderReportDocument / reportFileName', () => {
  const op = { name: 'Operação Agro Horizonte', description: 'Produtor rural', priorityLabel: 'Prioridade Alta', statusLabel: 'Em andamento', tagsExtra: [], reviewLabel: '', reviewLate: false, docTitle: 'Nexus' };

  it('escapa HTML perigoso vindo de campos de texto simples (nome, alertas)', () => {
    const rd = {
      model: 'resumo', op: { ...op, name: '<img src=x onerror=alert(1)>' }, sections: defaultReportSections(),
      generatedAtLabel: '25/09/2026, 10:20', generatedDateLabel: '25/09/2026',
      highlight: null, next15: { items: [], overflowCount: 0, overflowFirst: null },
      alerts: [{ cda: '<b>x</b>', termLabel: '04/12/2026', late: true, situacao: 'ordinária', valorLabel: 'R$ 48.000' }],
      numbers: [{ label: 'Crédito', value: 'R$ 1,29 mi', sub: '6 CDAs' }],
      sources: [],
    };
    const html = renderReportDocument(rd);
    assert.doesNotMatch(html, /<img src=x onerror=/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  });

  it('modelo resumo gera só a página 1 (uma div.a4)', () => {
    const rd = {
      model: 'resumo', op, sections: defaultReportSections(),
      generatedAtLabel: '25/09/2026, 10:20', generatedDateLabel: '25/09/2026',
      highlight: null, next15: { items: [], overflowCount: 0, overflowFirst: null }, alerts: [], numbers: [], sources: [],
    };
    const html = renderReportDocument(rd);
    assert.equal((html.match(/class="a4"/g) || []).length, 1);
  });

  it('reportFileName usa o prefixo certo por modelo', () => {
    assert.match(reportFileName('passagem', 'Agro Horizonte', '2026-09-25'), /^passagem_servico_Agro_Horizonte_2026-09-25\.html$/);
    assert.match(reportFileName('resumo', 'Agro Horizonte', '2026-09-25'), /^resumo_/);
    assert.match(reportFileName('prestacao', 'Agro Horizonte', '2026-09-25'), /^prestacao_contas_/);
  });

  it('prestação de contas embute a nota do limite de 500 registros', () => {
    const rd = { model: 'prestacao', op, sections: defaultReportSections(), generatedAtLabel: '25/09/2026, 10:20', periodLabel: '01/08/2026 a 25/09/2026', accountingEvents: [], accountingNote: 'o histórico guarda só os últimos 500 registros do app.' };
    const html = renderReportDocument(rd);
    assert.match(html, /últimos 500 registros/);
  });
});

describe('buildAgendaByDay (src/lib/agenda.js)', () => {
  const data = {
    hearings: [
      { id: 'h1', operationId: 'op1', date: '2026-09-27', time: '16:00', status: 'agendada', hearingType: 'una', parties: 'Fazenda x Fulano' },
      { id: 'h2', operationId: 'op1', date: '2026-09-27', status: 'cancelada', hearingType: 'una' },
      { id: 'h3', operationId: 'op1', date: '2026-09-27', status: 'realizada', hearingType: 'una' },
    ],
    intimations: [
      { id: 'i1', operationId: 'op1', dateDeadline: '2026-09-28', processNumber: '123' },
    ],
    tasks: [
      { id: 't1', operationId: 'op1', dueDate: '2026-09-28', title: 'Tarefa', status: 'pendente', priority: 'urgente' },
      { id: 't2', operationId: 'op1', dueDate: '2026-09-29', title: 'Concluída', status: 'concluida' },
    ],
  };
  const prazosRadar = { rows: [
    { id: 'p1', operationId: 'op1', keyDate: '2026-09-29', group: 1, cdaNumber: '90.6.20.000881-40' },
    { id: 'p2', operationId: 'op1', keyDate: '2026-09-29', group: 5, cdaNumber: 'fora-do-radar' },
    { id: 'p3', operationId: 'op2', keyDate: '2026-09-29', group: 1, cdaNumber: 'outra-operacao' },
  ] };

  it('junta audiências (exceto canceladas/realizadas), prazos, tarefas abertas e termos de prescrição (grupos 1-4), filtrando por operação', () => {
    const by = buildAgendaByDay(data, prazosRadar, '2026-09-25', '2026-10-10', 'op1', {
      hearingLabel: () => 'Audiência',
      partyName: (x) => x.processNumber,
      intimOnAgenda: (x) => !!x.dateDeadline,
      isUrgentIntim: () => false,
      taskOpen: (t) => t.status !== 'concluida' && t.status !== 'cancelada',
      safeText: (s) => s,
    });
    assert.deepEqual(Object.keys(by).sort(), ['2026-09-27', '2026-09-28', '2026-09-29']);
    assert.equal(by['2026-09-27'].length, 1);
    assert.equal(by['2026-09-27'][0].kind, 'aud');
    assert.equal(by['2026-09-28'][0].kind, 'prazo');
    // t2 (2026-09-29) está concluída — só o termo de prescrição entra.
    assert.equal(by['2026-09-29'].length, 1);
    assert.deepEqual(by['2026-09-29'].map(i => i.kind), ['presc']);
  });

  it('fora do intervalo de datas não entra', () => {
    const by = buildAgendaByDay(data, prazosRadar, '2026-10-01', '2026-10-10', 'op1', {});
    assert.deepEqual(by, {});
  });
});
