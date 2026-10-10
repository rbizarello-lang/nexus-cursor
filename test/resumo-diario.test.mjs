import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * RESUMO-DIARIO.js (Apps Script) carregado com `vm` e stubs mínimos. Hoje fica fixo em 09/10/2026, 07:00,
 * para os dias recalculados no e-mail serem determinísticos.
 */
const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'RESUMO-DIARIO.js');
const SRC = fs.readFileSync(FILE, 'utf8');
const RealDate = Date;
const NOW = [2026, 9, 9, 7, 0, 0]; // 09/10/2026 07:00 (mês zero-based)

class FixedDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(...NOW); }
  static now() { return new RealDate(...NOW).getTime(); }
}

function load(data) {
  const sent = [];
  const ctx = vm.createContext({
    Date: FixedDate,
    console,
    MailApp: { sendEmail(m) { sent.push(m); } },
    Session: { getActiveUser: () => ({ getEmail: () => 'conta@exemplo.com' }) },
    Logger: { log() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'ID-PINADO' }) },
    DriveApp: {
      getFileById: () => ({ isTrashed: () => false, getBlob: () => ({ getDataAsString: () => JSON.stringify(data) }) })
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => { throw new Error('não deve varrer a planilha'); } },
    ScriptApp: { newTrigger: () => ({}), getProjectTriggers: () => [], deleteTrigger() {} }
  });
  vm.runInContext(SRC, ctx, { filename: 'RESUMO-DIARIO.js' });
  return { ctx, sent, run: () => ctx.enviarResumoNexus() };
}

let seq = 0;
const cda = (id, card, ord, over = {}) => ({
  id, operationId: 'op1', personId: 'pe1', status: 'ativa', value: 1000, cdaNumber: 'CDA-' + id,
  processNumber: '5001234-56.2023.4.04.7001',
  mesaCard: { card, ord, longe: false, cedoTarde: false, dateKind: 'prazo', date: '2026-10-14', label: '' },
  ...over
});
const base = (over = {}) => ({
  operations: [{ id: 'op1', name: 'Operação Teste' }],
  people: [{ id: 'pe1', name: 'Devedor Exemplo Ltda' }],
  debts: [], intimations: [], hearings: [], tasks: [], desk: [],
  mesaCardsAt: new RealDate(2026, 9, 8, 14, 30).toISOString(),
  ...over
});
const intim = (dateDeadline, over = {}) => ({
  id: 'in' + (++seq), dateDeadline, partyName: 'Parte ' + seq, processNumber: '5009999-00.2024.4.04.7000', ...over
});
const html = (m) => m.htmlBody;

describe('E-mail diário — destino, assunto e decisão de enviar', () => {
  it('destinatário único e horário 7h', () => {
    const { ctx, sent, run } = load(base({ intimations: [intim('2026-10-05')] }));
    assert.equal(ctx.CONFIG.EMAIL, 'doutorjivago@mail.grokbot.com');
    assert.equal(ctx.CONFIG.HORA_ENVIO, 7);
    run();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'doutorjivago@mail.grokbot.com');
  });

  it('assunto: NEXUS · dd/mm · N vencidos · M a agir (cinza do Ajuizar não conta)', () => {
    const debts = [
      cda('a', 'calculo', 0), cda('b', 'fato', 0), cda('c', 'ajuizar', 0),
      cda('d', 'ajuizar', 1, { mesaCard: { card: 'ajuizar', ord: 1, longe: true, cedoTarde: false, dateKind: 'prazo', date: '2027-01-10', label: '' } })
    ];
    const { sent, run } = load(base({ debts, intimations: [intim('2026-10-05'), intim('2026-10-01')] }));
    run();
    assert.equal(sent[0].subject, 'NEXUS · 09/10 · 2 prazos vencidos · 3 a agir na prescrição');
  });

  it('omite as partes zeradas', () => {
    let l = load(base({ intimations: [intim('2026-10-05')] })); l.run();
    assert.equal(l.sent[0].subject, 'NEXUS · 09/10 · 1 prazo vencido');
    l = load(base({ debts: [cda('a', 'dado', 0)] })); l.run();
    assert.equal(l.sent[0].subject, 'NEXUS · 09/10 · 1 a agir na prescrição');
    l = load(base({ hearings: [{ id: 'h1', date: '2026-10-12', parties: 'Audiência X' }] })); l.run();
    assert.equal(l.sent[0].subject, 'NEXUS · 09/10');
  });

  it('tudo zero e ENVIAR_SE_VAZIO=false: não envia; só cinza (60 a 180 dias) não conta', () => {
    const longe = cda('d', 'ajuizar', 1, { mesaCard: { card: 'ajuizar', ord: 1, longe: true, cedoTarde: false, dateKind: 'prazo', date: '2027-01-10', label: '' } });
    const l = load(base({ debts: [longe] }));
    assert.match(l.run(), /não enviado/);
    assert.equal(l.sent.length, 0);
    l.ctx.CONFIG.ENVIAR_SE_VAZIO = true;
    l.run();
    assert.equal(l.sent.length, 1);
  });

  it('o total que decide o envio inclui as CDAs a agir', () => {
    const l = load(base({ debts: [cda('a', 'calculo', 0)] }));
    assert.match(l.run(), /Resumo enviado/);
    assert.equal(l.sent.length, 1);
  });

  it('qualquer intimação em aberto (longe ou sem prazo) já faz o e-mail sair', () => {
    let l = load(base({ intimations: [intim('2026-12-20')] }));
    l.run();
    assert.equal(l.sent.length, 1);
    assert.equal(l.sent[0].subject, 'NEXUS · 09/10');
    l = load(base({ intimations: [intim('')] }));
    l.run();
    assert.equal(l.sent.length, 1);
  });

  it('só respondidas (ou só analisada vencida) não fazem o e-mail sair', () => {
    const resp = { type: 'ciencia', respondedAt: new RealDate(2026, 9, 9, 2, 0).toISOString() };
    const l = load(base({ intimations: [intim('2026-10-12', { responseAction: resp }), intim('2026-10-01', { status: 'analisado' })] }));
    assert.match(l.run(), /não enviado/);
    assert.equal(l.sent.length, 0);
  });
});

describe('E-mail diário — prescrição pelos cartões da Mesa', () => {
  it('um bloco por cartão, na ordem da Mesa, com nº de CDAs e valor total', () => {
    const debts = [
      cda('p5', 'dado', 0, { value: 500 }), cda('p3', 'fato', 0, { value: 300 }),
      cda('p1', 'calculo', 0, { value: 1200.5 }), cda('p1b', 'calculo', 1, { value: 800 }),
      cda('p2', 'ajuizar', 0, { value: 250 }), cda('p4', 'vigencia', 0, { value: 100 })
    ];
    const { sent, run } = load(base({ debts }));
    run();
    const h = html(sent[0]);
    const pos = ['Conferir o cálculo', 'Ajuizar', 'Lançar fato ou ciência', 'Confirmar vigência', 'Completar dado'].map(n => h.indexOf('>' + n + '<'));
    assert.ok(pos.every(p => p > 0), 'todos os cartões presentes');
    assert.deepEqual(pos.slice().sort((a, b) => a - b), pos, 'ordem da Mesa');
    assert.match(h, /Conferir o cálculo<\/span> <span[^>]*>2 CDAs · R\$ 2\.000,50/);
    assert.match(h, /Ajuizar<\/span> <span[^>]*>1 CDA · R\$ 250,00/);
  });

  it('até 10 CDAs por cartão na ordem da Mesa (ord) e «+N CDAs no app»', () => {
    const debts = [];
    for (let i = 0; i < 13; i++) debts.push(cda('x' + String(i).padStart(2, '0'), 'fato', 12 - i, { value: 100 }));
    const { sent, run } = load(base({ debts }));
    run();
    const h = html(sent[0]);
    // ord 0..9 são x12..x03; ficam de fora x02, x01, x00
    for (let i = 3; i <= 12; i++) assert.ok(h.includes('CDA CDA-x' + String(i).padStart(2, '0')), 'x' + i);
    for (let i = 0; i <= 2; i++) assert.ok(!h.includes('CDA CDA-x0' + i + '<') && !h.includes('CDA CDA-x0' + i + ' '), 'fora x' + i);
    const ordem = [...h.matchAll(/CDA CDA-x(\d\d)/g)].map(m => +m[1]);
    assert.deepEqual(ordem, [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
    assert.match(h, /\+3 CDAs no app/);
    assert.match(h, /13 CDAs · R\$ 1\.300,00/);
  });

  it('exatamente 10 não mostra «no app»', () => {
    const debts = [];
    for (let i = 0; i < 10; i++) debts.push(cda('y' + i, 'calculo', i));
    const { sent, run } = load(base({ debts }));
    run();
    assert.doesNotMatch(html(sent[0]), /no app/);
  });

  it('Ajuizar: só até 60 dias; os de 60 a 180 viram «+N entre 60 e 180 dias»', () => {
    const longe = (id, ord) => cda(id, 'ajuizar', ord, { mesaCard: { card: 'ajuizar', ord, longe: true, cedoTarde: false, dateKind: 'prazo', date: '2026-12-20', label: '' } });
    const debts = [cda('near1', 'ajuizar', 0), cda('near2', 'ajuizar', 1), longe('far1', 2), longe('far2', 3), longe('far3', 4)];
    const { sent, run } = load(base({ debts }));
    run();
    const h = html(sent[0]);
    assert.match(h, /2 CDAs · R\$ 2\.000,00/);
    assert.match(h, /\+3 entre 60 e 180 dias/);
    assert.ok(h.includes('CDA-near1') && h.includes('CDA-near2'));
    assert.ok(!h.includes('CDA-far1') && !h.includes('CDA-far2') && !h.includes('CDA-far3'));
  });

  it('Ajuizar só com cinza: cabeçalho sem contagem de ação e a linha cinza', () => {
    const debts = [cda('far1', 'ajuizar', 0, { mesaCard: { card: 'ajuizar', ord: 0, longe: true, cedoTarde: false, dateKind: 'prazo', date: '2026-12-20', label: '' } })];
    const l = load(base({ debts, intimations: [intim('2026-10-05')] }));
    l.run();
    assert.match(html(l.sent[0]), /nenhuma nos 60 dias/);
    assert.match(html(l.sent[0]), /\+1 entre 60 e 180 dias/);
  });

  it('nunca entram fileira 2, consumadas antigas, decadência, tratadas, extintas nem o snapshot antigo', () => {
    const debts = [
      cda('ok', 'fato', 0),
      cda('v', 'vigiar', 0), cda('s', 'sempressa', 0), cda('ad', 'adiadas', 0), cda('tr', 'tratadas', 0), cda('an', 'antigas', 0),
      cda('dec', 'decadencia', 0),
      cda('ext', 'fato', 1, { status: 'extinta' }),
      cda('hand', 'fato', 2, { prescriptionHandled: true }),
      { id: 'old', operationId: 'op1', cdaNumber: 'CDA-old', value: 1, status: 'ativa',
        prescriptionSnapshot: { group: 1, keyDate: '2026-10-12', daysLeft: 3, summary: 'x' } },
      { id: 'dc', operationId: 'op1', cdaNumber: 'CDA-dc', value: 1, status: 'ativa', constitutionDate: '2015-01-01' }
    ];
    const { sent, run } = load(base({ debts }));
    run();
    const h = html(sent[0]);
    assert.ok(h.includes('CDA-ok'));
    ['v', 's', 'ad', 'tr', 'an', 'dec', 'ext', 'hand', 'old', 'dc'].forEach(id => assert.ok(!h.includes('CDA-' + id), id));
    assert.doesNotMatch(h, /Prescrição se aproximando/);
    assert.match(sent[0].subject, /1 a agir na prescrição/);
  });

  it('linha da CDA: CDA, devedor, processo ou «sem processo», operação e valor', () => {
    const debts = [cda('a', 'dado', 0, { value: 1234.5 }), cda('b', 'dado', 1, { processNumber: '', personId: 'x' })];
    const { sent, run } = load(base({ debts }));
    run();
    const h = html(sent[0]);
    assert.match(h, /CDA CDA-a[^<]*<span[^>]*>· Devedor Exemplo Ltda/);
    assert.match(h, /5001234-56\.2023\.4\.04\.7001/);
    assert.match(h, /sem processo/);
    assert.match(h, /R\$ 1\.234,50/);
    assert.match(h, /◎ Operação Teste/);
  });

  it('relógio: dias recomputados hoje; tarde com selo; consumada recente; «não antes de» sem dias', () => {
    const mc = (card, ord, over) => ({ card, ord, longe: false, cedoTarde: false, dateKind: 'prazo', date: '', label: '', ...over });
    const debts = [
      cda('prazo', 'fato', 0, { mesaCard: mc('fato', 0, { dateKind: 'prazo', date: '2026-10-14' }) }),
      cda('vencida', 'fato', 1, { mesaCard: mc('fato', 1, { dateKind: 'prazo', date: '2026-10-04' }) }),
      cda('tarde', 'fato', 2, { mesaCard: mc('fato', 2, { dateKind: 'tarde', cedoTarde: true, date: '2026-10-21' }) }),
      cda('semtarde', 'fato', 3, { mesaCard: mc('fato', 3, { dateKind: 'tarde', cedoTarde: true, date: '', label: 'sem data tarde' }) }),
      cda('consum', 'calculo', 0, { mesaCard: mc('calculo', 0, { dateKind: 'consumada', date: '2026-08-30' }) }),
      cda('nao', 'calculo', 1, { mesaCard: mc('calculo', 1, { dateKind: 'nao_antes', date: '2024-05-03', label: 'não antes de 03/05/2024' }) })
    ];
    const { sent, run } = load(base({ debts }));
    run();
    const h = html(sent[0]);
    assert.match(h, />em 5d</);
    assert.match(h, />há 5d</);
    assert.match(h, />tarde em 12d</);
    assert.match(h, /cedo venceu, tarde não/);
    assert.match(h, />sem data tarde</);
    assert.match(h, />consumada há 40d</);
    assert.match(h, />não antes de 03\/05\/2024</);
    // a data que não é prazo nunca vira «há N anos»
    const bloco = h.slice(h.indexOf('CDA-nao'), h.indexOf('CDA-nao') + 600);
    assert.doesNotMatch(bloco, /há \d+ anos/);
    assert.equal((h.match(/cedo venceu, tarde não/g) || []).length, 2);
  });

  it('sem nenhum mesaCard (e sem mesaCardsAt): nota para abrir o NEXUS 3.5 e sincronizar', () => {
    const debts = [{ id: 'a', operationId: 'op1', cdaNumber: 'CDA-a', value: 1, status: 'ativa' }];
    const l = load(base({ debts, mesaCardsAt: undefined, intimations: [intim('2026-10-05')] }));
    l.run();
    const h = html(l.sent[0]);
    assert.ok(h.includes('Abra o NEXUS 3.5 e sincronize para o e-mail passar a mostrar os cartões de prescrição.'));
    assert.doesNotMatch(h, /Cartões calculados/);
  });

  it('com mesaCardsAt e nenhum a agir: sem nota (não é falta de sincronização)', () => {
    const l = load(base({ debts: [], intimations: [intim('2026-10-05')] }));
    l.run();
    assert.ok(!html(l.sent[0]).includes('Abra o NEXUS 3.5'));
  });

  it('sempre mostra, discreta, a hora do cálculo', () => {
    const l = load(base({ debts: [cda('a', 'dado', 0)] }));
    l.run();
    assert.match(html(l.sent[0]), /Cartões calculados na sincronização de 08\/10 às 14:30/);
    const m = load(base({ debts: [], intimations: [intim('2026-10-05')] }));
    m.run();
    assert.match(html(m.sent[0]), /Cartões calculados na sincronização de 08\/10 às 14:30/);
  });
});

describe('E-mail diário — tarefas', () => {
  const T = (over) => ({ id: 't' + (++seq), status: 'pendente', operationId: 'op1', ...over });

  it('urgentes (com ou sem prazo) + alta com prazo em até 7 dias (ou vencida); o resto fica fora', () => {
    const tasks = [
      T({ title: 'Urgente sem prazo', priority: 'urgente' }),
      T({ title: 'Urgente longe', priority: 'urgente', dueDate: '2026-12-31' }),
      T({ title: 'Alta em 7 dias', priority: 'alta', dueDate: '2026-10-16' }),
      T({ title: 'Alta em 8 dias', priority: 'alta', dueDate: '2026-10-17' }),
      T({ title: 'Alta vencida', priority: 'alta', dueDate: '2026-10-02' }),
      T({ title: 'Alta sem prazo', priority: 'alta' }),
      T({ title: 'Media em 1 dia', priority: 'media', dueDate: '2026-10-10' }),
      T({ title: 'Alta concluida', priority: 'alta', dueDate: '2026-10-10', status: 'concluida' }),
      T({ title: 'Urgente cancelada', priority: 'urgente', status: 'cancelada' })
    ];
    const { sent, run } = load(base({ tasks }));
    run();
    const h = html(sent[0]);
    ['Urgente sem prazo', 'Urgente longe', 'Alta em 7 dias', 'Alta vencida'].forEach(t => assert.ok(h.includes(t), t));
    ['Alta em 8 dias', 'Alta sem prazo', 'Media em 1 dia', 'Alta concluida', 'Urgente cancelada'].forEach(t => assert.ok(!h.includes(t), t));
    assert.ok(h.includes('Tarefas urgentes e de prioridade alta'));
    assert.match(h, />URGENTE<\/span> Urgente sem prazo/);
    assert.match(h, />ALTA<\/span> Alta vencida/);
    assert.match(h, /vencida há 7d/);
    assert.match(h, /sem prazo/);
  });
});

describe('E-mail diário — ordem das seções', () => {
  it('intimações em aberto · audiências · prescrição · tarefas · mesa de trabalho (no fim) · rodapé', () => {
    const data = base({
      intimations: [intim('2026-10-05'), intim('2026-10-12'), intim('2026-12-01')],
      hearings: [{ id: 'h1', date: '2026-10-15', parties: 'Audiência X', time: '14:00' }],
      debts: [cda('a', 'fato', 0)],
      tasks: [{ id: 'tk1', title: 'Tarefa urgente', priority: 'urgente', status: 'pendente' },
        { id: 'tk2', title: 'Tarefa da mesa', priority: 'media', status: 'pendente' }],
      desk: [{ type: 'task', id: 'tk2' }]
    });
    const { sent, run } = load(data);
    run();
    const h = html(sent[0]);
    const marcas = ['Intimações em aberto', 'Audiências', 'Prescrição — a agir', 'Tarefas urgentes e de prioridade alta', 'Na mesa de trabalho', 'Enviado automaticamente'];
    const pos = marcas.map(m => h.indexOf(m));
    pos.forEach((p, i) => assert.ok(p >= 0, marcas[i]));
    assert.deepEqual(pos.slice().sort((a, b) => a - b), pos, 'ordem das seções');
    assert.ok(h.includes('Tarefa da mesa'));
    ['Prazos vencidos', 'Prazos a vencer', 'No radar'].forEach(t => assert.ok(!h.includes(t), 'seção antiga ' + t));
  });

  it('seção da mesa só aparece se houver itens; a de prescrição some sem nada a agir', () => {
    const { sent, run } = load(base({ intimations: [intim('2026-10-05')] }));
    run();
    const h = html(sent[0]);
    assert.ok(!h.includes('Na mesa de trabalho'));
    assert.ok(!h.includes('Prescrição — a agir'));
  });
});

describe('E-mail diário — intimações em aberto (todas, por grupo de prazo)', () => {
  const NOMES = ['Vencidas', 'Hoje e amanhã', 'Até 7 dias', '8 a 30 dias', 'Mais de 30 dias', 'Sem prazo'];
  const grupos = (h) => NOMES.map(n => h.indexOf('>' + n + ' <'));
  const tudo = () => [
    intim('2026-10-05', { partyName: 'P-venc' }),        // vencida há 4d
    intim('2026-10-09', { partyName: 'P-hoje' }),        // hoje
    intim('2026-10-10', { partyName: 'P-amanha' }),      // amanhã
    intim('2026-10-11', { partyName: 'P-2d' }),          // em 2d
    intim('2026-10-16', { partyName: 'P-7d' }),          // em 7d
    intim('2026-10-17', { partyName: 'P-8d' }),          // em 8d
    intim('2026-11-08', { partyName: 'P-30d' }),         // em 30d
    intim('2026-11-09', { partyName: 'P-31d' }),         // em 31d
    intim('2027-03-01', { partyName: 'P-longe' }),
    intim('', { partyName: 'P-sem' }),
    intim(undefined, { partyName: 'P-sem2', dateDeadline: undefined })
  ];

  it('inclui TODAS (não só 7 dias + 5 próximas), com o cabeçalho de total e contagem por grupo', () => {
    const muitas = [];
    for (let i = 0; i < 20; i++) muitas.push(intim('2026-12-' + String(1 + i).padStart(2, '0'), { partyName: 'Longe-' + i }));
    const { sent, run } = load(base({ intimations: [...tudo(), ...muitas] }));
    run();
    const h = html(sent[0]);
    for (let i = 0; i < 20; i++) assert.ok(h.includes('Longe-' + i + '<'), 'Longe-' + i);
    assert.match(h, /Intimações em aberto: 31<\/div>|Intimações em aberto: 31 <span/);
    assert.ok(h.includes('— 1 vencidas · 2 hoje/amanhã · 2 até 7 dias · 2 até 30 · 22 depois · 2 sem prazo'), h.match(/Intimações em aberto[^]{0,300}/)[0]);
  });

  it('grupos na ordem Vencidas · Hoje e amanhã · Até 7 dias · 8 a 30 dias · Mais de 30 dias · Sem prazo, com as fronteiras certas', () => {
    const { sent, run } = load(base({ intimations: tudo() }));
    run();
    const h = html(sent[0]);
    const pos = grupos(h);
    pos.forEach((p, i) => assert.ok(p > 0, NOMES[i]));
    assert.deepEqual(pos.slice().sort((a, b) => a - b), pos);
    const parte = (n) => h.indexOf('>' + n + '<');
    const entre = (nome, i) => [pos[i], i < 5 ? pos[i + 1] : h.length].map((x, k, a) => x);
    const dentro = (nome, i) => { const [a, b] = entre(nome, i); const p = parte(nome); return p > a && p < b; };
    ['P-venc'].forEach(n => assert.ok(dentro(n, 0), n));
    ['P-hoje', 'P-amanha'].forEach(n => assert.ok(dentro(n, 1), n));
    ['P-2d', 'P-7d'].forEach(n => assert.ok(dentro(n, 2), n));
    ['P-8d', 'P-30d'].forEach(n => assert.ok(dentro(n, 3), n));
    ['P-31d', 'P-longe'].forEach(n => assert.ok(dentro(n, 4), n));
    ['P-sem', 'P-sem2'].forEach(n => assert.ok(dentro(n, 5), n));
    assert.match(h, /Vencidas <span[^>]*>\(1\)/);
    assert.match(h, /Sem prazo <span[^>]*>\(2\)/);
  });

  it('grupo vazio não aparece e some da linha de totais', () => {
    const { sent, run } = load(base({ intimations: [intim('2026-10-12')] }));
    run();
    const h = html(sent[0]);
    assert.ok(h.includes('Intimações em aberto: 1'));
    assert.ok(h.includes('— 1 até 7 dias<'));
    ['>Vencidas <', '>Hoje e amanhã <', '>8 a 30 dias <', '>Mais de 30 dias <', '>Sem prazo <'].forEach(t => assert.ok(!h.includes(t), t));
  });

  it('prazo: dd/mm + «vencida há Nd» / «hoje» / «amanhã» / «em Nd»; vermelho só em vencida e hoje', () => {
    const { sent, run } = load(base({ intimations: tudo() }));
    run();
    const h = html(sent[0]);
    assert.match(h, /<b>05\/10<\/b> vencida há 4d/);
    assert.match(h, /<b>09\/10<\/b> hoje/);
    assert.match(h, /<b>10\/10<\/b> amanhã/);
    assert.match(h, /<b>11\/10<\/b> em 2d/);
    assert.match(h, /<b>01\/03\/27<\/b> em \d+d/);
    const cor = (txt) => h.slice(h.lastIndexOf('<span', h.indexOf(txt)), h.indexOf(txt));
    assert.match(cor('<b>05/10</b>'), /#c0392b/);
    assert.match(cor('<b>09/10</b>'), /#c0392b/);
    assert.doesNotMatch(cor('<b>10/10</b>'), /#c0392b/);
    assert.doesNotMatch(cor('<b>11/10</b>'), /#c0392b/);
  });

  it('campos: processo, classe, parte, evento, operação, situação (rótulo), prioridade, URGENTE e última nota', () => {
    const x = intim('2026-10-12', {
      processNumber: '5001234-56.2023.4.04.7001', className: 'Execução Fiscal', partyName: 'Comercial Fachada Norte LTDA',
      eventDescription: 'Manifestar sobre exceção', operationId: 'op1', status: 'aguardando_subsidios', priority: 'alta', urgent: true,
      notesList: ['nota antiga', 'nota recente <b>com</b> html']
    });
    const { sent, run } = load(base({ intimations: [x] }));
    run();
    const h = html(sent[0]);
    ['5001234-56.2023.4.04.7001', '· Execução Fiscal', 'Comercial Fachada Norte LTDA', 'Manifestar sobre exceção', '◎ Operação Teste',
      'Aguardando Subsídios', '<b>alta</b>', 'nota recente com html'].forEach(t => assert.ok(h.includes(t), t));
    assert.ok(!h.includes('nota antiga'));
    assert.match(h, /<b style="color:#c0392b">URGENTE<\/b> Manifestar/);
  });

  it('rótulos de situação (incluindo o legado «analisado») e valor desconhecido', () => {
    const { ctx } = load(base());
    const L = ctx.STATUS_INTIM;
    assert.equal(L.pendente_analise, 'Pendente de Análise');
    assert.equal(L.em_analise, 'Em Análise');
    assert.equal(L.analise_concluida, 'Análise Concluída');
    assert.equal(L.aguardando_subsidios, 'Aguardando Subsídios');
    assert.equal(L.aguardar, 'Aguardar');
    assert.equal(L.peca_edicao, 'Peça em Edição');
    assert.equal(L.ciencia_renuncia, 'Ciência com Renúncia');
    assert.equal(L.peca_pronta, 'Peça Pronta');
    assert.equal(L.analisado, 'Analisado');
    const l = load(base({ intimations: [intim('2026-10-20', { status: 'analisado' }), intim('2026-10-20', { status: 'xyz_novo' })] }));
    l.run();
    assert.ok(html(l.sent[0]).includes('Analisado'));
    assert.ok(html(l.sent[0]).includes('xyz_novo'));
  });

  it('nota: cai para `notes` sem notesList; corta em ~140 caracteres com reticências; sem nota, sem aspas', () => {
    const longa = 'palavra '.repeat(40).trim();
    const l = load(base({ intimations: [
      intim('2026-10-12', { partyName: 'N-longa', notesList: [longa] }),
      intim('2026-10-13', { partyName: 'N-notes', notes: 'texto simples' }),
      intim('2026-10-14', { partyName: 'N-sem' })
    ] }));
    l.run();
    const h = html(l.sent[0]);
    const m = h.match(/“(palavra[^”]*)”/);
    assert.ok(m, 'nota longa');
    assert.ok(m[1].length <= 140 && m[1].endsWith('…'), m[1].length + ' ' + m[1].slice(-5));
    assert.ok(m[1].length > 120);
    assert.ok(h.includes('“texto simples”'));
    assert.equal((h.match(/“/g) || []).length, 2);
  });

  it('analisada com prazo vencido sai; analisada no prazo e sem prazo ficam; com responseAction sai', () => {
    const resp = { type: 'ciencia', respondedAt: '2026-09-01T10:00:00Z' };
    const intimations = [
      intim('2026-10-01', { partyName: 'A-venc', status: 'analisado' }),
      intim('2026-10-20', { partyName: 'A-prazo', status: 'analisado' }),
      intim('', { partyName: 'A-semprazo', status: 'analisado' }),
      intim('2026-10-20', { partyName: 'R-resp', responseAction: resp }),
      intim('2026-10-01', { partyName: 'P-venc-pendente', status: 'pendente_analise' })
    ];
    const { sent, run } = load(base({ intimations }));
    run();
    const h = html(sent[0]);
    ['A-prazo', 'A-semprazo', 'P-venc-pendente'].forEach(t => assert.ok(h.includes(t + '<'), t));
    ['A-venc', 'R-resp'].forEach(t => assert.ok(!h.includes(t + '<'), t));
    assert.equal(sent[0].subject, 'NEXUS · 09/10 · 1 prazo vencido');
  });

  it('ordem dentro do grupo: prazo e, no empate, urgente e depois prioridade', () => {
    const d = '2026-10-14';
    const intimations = [
      intim('2026-10-15', { partyName: 'O-depois', priority: 'alta', urgent: true }),
      intim(d, { partyName: 'O-baixa', priority: 'baixa' }),
      intim(d, { partyName: 'O-normal', priority: 'normal' }),
      intim(d, { partyName: 'O-alta', priority: 'alta' }),
      intim(d, { partyName: 'O-urgente', priority: 'baixa', urgent: true })
    ];
    const { sent, run } = load(base({ intimations }));
    run();
    const h = html(sent[0]);
    const ordem = ['O-urgente', 'O-alta', 'O-normal', 'O-baixa', 'O-depois'].map(n => h.indexOf('>' + n + '<'));
    assert.ok(ordem.every(p => p > 0));
    assert.deepEqual(ordem.slice().sort((a, b) => a - b), ordem);
  });

  it('«Respondidas nas últimas 24 h: N» conta só as de 24 h, sem listá-las', () => {
    const resp = (h) => ({ type: 'ciencia', respondedAt: new RealDate(2026, 9, 9, 7 - h, 0).toISOString() });
    const intimations = [
      intim('2026-10-20', { partyName: 'Aberta' }),
      intim('2026-10-20', { partyName: 'Resp-1h', responseAction: resp(1) }),
      intim('2026-10-20', { partyName: 'Resp-23h', responseAction: resp(23) }),
      intim('2026-10-20', { partyName: 'Resp-25h', responseAction: resp(25) }),
      intim('2026-10-20', { partyName: 'Resp-semdata', responseAction: { type: 'ciencia' } })
    ];
    const { sent, run } = load(base({ intimations }));
    run();
    const h = html(sent[0]);
    assert.ok(h.includes('Respondidas nas últimas 24 h: 2<'));
    ['Resp-1h', 'Resp-23h', 'Resp-25h', 'Resp-semdata'].forEach(t => assert.ok(!h.includes(t), t));
    assert.ok(h.includes('Intimações em aberto: 1'));
  });

  it('sem intimações: a seção some', () => {
    const { sent, run } = load(base({ debts: [cda('a', 'dado', 0)] }));
    run();
    assert.ok(!html(sent[0]).includes('Intimações em aberto'));
  });
});

describe('E-mail diário — formato compacto', () => {
  const completo = () => base({
    intimations: [intim('2026-10-05'), intim('2026-10-12')],
    hearings: [{ id: 'h1', date: '2026-10-15', parties: 'Audiência X', time: '14:00' }],
    debts: [cda('a', 'fato', 0)],
    tasks: [{ id: 'tk1', title: 'Tarefa urgente', priority: 'urgente', status: 'pendente' }]
  });

  it('sem cabeçalho escuro, sombra, cantos arredondados nem fundo colorido; fonte 13px; tabelas com largura 100%', () => {
    const { sent, run } = load(completo());
    run();
    const h = html(sent[0]);
    assert.doesNotMatch(h, /#1f2733;color:#e2ded0/);
    assert.doesNotMatch(h, /box-shadow|border-radius|text-transform/);
    assert.doesNotMatch(h, /background:#(?!fff)/i);
    assert.match(h, /font-size:13px/);
    assert.doesNotMatch(h, /(?<!max-)width:\d{3,}px/);
    assert.ok(/max-width:\d+px/.test(h));
  });

  it('cor só no alerta: vermelho presente; sem cores de seção (azul, âmbar, dourado)', () => {
    const { sent, run } = load(completo());
    run();
    const h = html(sent[0]);
    assert.ok(h.includes('#c0392b'));
    ['#2c6ba0', '#b8860b', '#c2631a', '#96762e', '#8a6d1f'].forEach(c => assert.ok(!h.includes(c), c));
  });

  it('rodapé de uma linha e instrução de desativar', () => {
    const { sent, run } = load(completo());
    run();
    const h = html(sent[0]);
    const rod = h.slice(h.indexOf('Enviado automaticamente'));
    assert.ok(rod.includes('removerResumoDiario'));
    assert.doesNotMatch(rod, /<br/);
  });

  it('escapa HTML vindo dos dados', () => {
    const { sent, run } = load(base({ intimations: [intim('2026-10-12', { partyName: '<script>x</script>', eventDescription: 'a & b', notesList: ['<img src=x>'] })] }));
    run();
    const h = html(sent[0]);
    assert.ok(!h.includes('<script>'));
    assert.ok(h.includes('&lt;script&gt;') && h.includes('a &amp; b'));
    assert.ok(!h.includes('<img'));
  });
});
