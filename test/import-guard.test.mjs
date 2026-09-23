import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectPdfDebtors,
  assessPdfDebtorsAgainstOperation,
  buildPdfImportConfirmMessage,
  ensureCorespPerson,
  dedupePeopleByDoc
} from '../src/lib/import-guard.js';
import { parseSIDALines } from '../src/lib/sida-parser.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('src/lib/import-guard.js — trava de operação no PDF SIDA/Debcad', () => {
  const ops = [
    { id: 'op-a', name: 'Operação Alfa' },
    { id: 'op-b', name: 'Operação Beta' }
  ];
  const people = [
    { id: 'p1', operationId: 'op-a', name: 'Empresa Alfa LTDA', cpfCnpj: '12.345.678' },
    { id: 'p2', operationId: 'op-b', name: 'Empresa Beta LTDA', cpfCnpj: '98.765.432/0001-00' }
  ];

  it('collectPdfDebtors junta principal, lista de devedores e corresponsáveis', () => {
    const debtors = collectPdfDebtors([
      {
        devedor: 'Empresa Alfa LTDA',
        cnpj: '12345678000195',
        devedores: [{ name: 'João', cpfCnpj: '123.456.789-00' }],
        coresponsibles: [{ name: 'Maria', cpfCnpj: '98765432100' }]
      }
    ]);
    assert.equal(debtors.length, 3);
    assert.ok(debtors.some(d => d.cpfCnpj.includes('12345678') || d.cpfCnpj.includes('12.345.678')));
  });

  it('não pede confirmação quando o CNPJ raiz da operação bate com o CNPJ completo do PDF', () => {
    const debtors = collectPdfDebtors([{ devedor: 'Empresa Alfa LTDA', cnpj: '12345678000195' }]);
    const a = assessPdfDebtorsAgainstOperation(debtors, people, ops, 'op-a');
    assert.equal(a.needsConfirmation, false);
    assert.equal(a.matched.length, 1);
  });

  it('pede confirmação quando ninguém da operação bate — e aponta a outra operação', () => {
    const debtors = collectPdfDebtors([{ devedor: 'Empresa Beta LTDA', cnpj: '98765432000100' }]);
    const a = assessPdfDebtorsAgainstOperation(debtors, people, ops, 'op-a');
    assert.equal(a.needsConfirmation, true);
    assert.equal(a.matched.length, 0);
    assert.equal(a.otherOps.length, 1);
    assert.equal(a.otherOps[0].operationName, 'Operação Beta');
    const msg = buildPdfImportConfirmMessage(a, 'Operação Alfa');
    assert.match(msg, /não parece pertencer/);
    assert.match(msg, /Operação Beta/);
    assert.match(msg, /Cancelar/);
  });

  it('corresponsável novo não dispara aviso se o principal já está na operação', () => {
    const debtors = collectPdfDebtors([{
      devedor: 'Empresa Alfa LTDA',
      cnpj: '12345678000195',
      coresponsibles: [{ name: 'Sócio Novo', cpfCnpj: '11122233344' }]
    }]);
    const a = assessPdfDebtorsAgainstOperation(debtors, people, ops, 'op-a');
    assert.equal(a.needsConfirmation, false);
    assert.ok(a.matched.length >= 1);
    assert.ok(a.unmatched.some(d => d.name === 'Sócio Novo'));
  });

  it('pede confirmação se o PDF não trouxe nenhum devedor identificável', () => {
    const a = assessPdfDebtorsAgainstOperation([], people, ops, 'op-a');
    assert.equal(a.needsConfirmation, true);
  });
});

describe('ensureCorespPerson — reutiliza ficha no mesmo lote', () => {
  const coresps = [
    { name: 'HIMUGUI - CONSTRUTORA LTDA', cpfCnpj: '08105727000145' },
    { name: 'NIVALDO OLAVIO TEIXEIRA', cpfCnpj: '56026668934' },
    { name: 'DANIEL MARTINELLO TEIXEIRA', cpfCnpj: '75848120072' }
  ];
  const ingest = (times, startPeople = []) => {
    let people = startPeople;
    let n = 0;
    let created = 0;
    const newId = () => 'new-' + (++n);
    for (let i = 0; i < times; i++) {
      for (const cr of coresps) {
        const r = ensureCorespPerson(people, { operationId: 'op-a', cr, now: '2026-09-19T12:00:00.000Z', newId });
        people = r.people;
        if (r.created) created++;
      }
    }
    return { people, created };
  };

  it('54 CDAs com os mesmos 3 corresponsáveis criam 3 fichas, não 162', () => {
    const { people, created } = ingest(54, [{
      id: 'p1', operationId: 'op-a', name: 'VERTICALI CONSTRUCOES', cpfCnpj: '00.841.065/0001-60', operationRole: 'alvo'
    }]);
    assert.equal(created, 3);
    assert.equal(people.length, 4);
    assert.equal(people.filter(p => /HIMUGUI/i.test(p.name)).length, 1);
    assert.equal(people.filter(p => /NIVALDO/i.test(p.name)).length, 1);
    assert.equal(people.filter(p => /DANIEL/i.test(p.name)).length, 1);
  });

  it('não recria quem já está na operação', () => {
    const { people, created } = ingest(2, [{
      id: 'him', operationId: 'op-a', name: 'HIMUGUI - CONSTRUTORA LTDA', cpfCnpj: '08.105.727/0001-45', operationRole: 'alvo'
    }]);
    assert.equal(created, 2);
    assert.equal(people.filter(p => /HIMUGUI/i.test(p.name)).length, 1);
    assert.equal(people.find(p => p.id === 'him').operationRole, 'alvo');
  });
});

describe('dedupePeopleByDoc — junta fichas já duplicadas', () => {
  it('reaponta vínculos e apaga as fichas repetidas do mesmo CPF/CNPJ', () => {
    const data = {
      people: [
        { id: 'v', operationId: 'op-a', name: 'VERTICALI', cpfCnpj: '00.841.065/0001-60', operationRole: 'alvo' },
        { id: 'h1', operationId: 'op-a', name: 'HIMUGUI', cpfCnpj: '08.105.727/0001-45', operationRole: 'relacionada', createdAt: '2026-01-01', notesList: ['nota A'] },
        { id: 'h2', operationId: 'op-a', name: 'HIMUGUI - CONSTRUTORA', cpfCnpj: '08105727000145', operationRole: 'relacionada', createdAt: '2026-02-01', notesList: ['nota A'] },
        { id: 'h3', operationId: 'op-a', name: '[Importado SIDA] 08.105.727/0001-45', cpfCnpj: '08.105.727/0001-45', operationRole: 'relacionada', createdAt: '2026-03-01' },
        { id: 'n1', operationId: 'op-a', name: 'NIVALDO', cpfCnpj: '560.266.689-34', operationRole: 'relacionada' },
        { id: 'other', operationId: 'op-b', name: 'HIMUGUI', cpfCnpj: '08.105.727/0001-45', operationRole: 'alvo' }
      ],
      debts: [
        { id: 'cda-1', personId: 'v' },
        { id: 'cda-2', personId: 'h2' }
      ],
      assets: [{ id: 'as-1', holderId: 'h3' }],
      links: {
        cdaResponsibilities: [
          { id: 'l1', cdaId: 'cda-1', personId: 'h1', role: 'coresponsavel_legal' },
          { id: 'l2', cdaId: 'cda-1', personId: 'h2', role: 'coresponsavel_legal' },
          { id: 'l3', cdaId: 'cda-2', personId: 'h3', role: 'coresponsavel_legal' },
          { id: 'l4', cdaId: 'cda-1', personId: 'v', role: 'originario' }
        ],
        measurePeople: [{ measureId: 'm1', personId: 'h2' }]
      }
    };
    const { data: next, removed } = dedupePeopleByDoc(data);
    assert.equal(removed, 2);
    assert.equal(next.people.filter(p => p.operationId === 'op-a' && /HIMUGUI/i.test(p.name)).length, 1);
    assert.equal(next.people.some(p => p.id === 'other'), true);
    const him = next.people.find(p => p.operationId === 'op-a' && /HIMUGUI/i.test(p.name));
    assert.equal(next.debts.find(d => d.id === 'cda-2').personId, him.id);
    assert.equal(next.assets[0].holderId, him.id);
    const himLinks = next.links.cdaResponsibilities.filter(l => l.personId === him.id);
    assert.equal(himLinks.filter(l => l.cdaId === 'cda-1').length, 1);
    assert.equal(himLinks.filter(l => l.cdaId === 'cda-2').length, 1);
    assert.equal(next.links.measurePeople[0].personId, him.id);
    assert.equal((him.notesList || []).length, 1);
  });

  it('não junta filiais com CNPJ 14 distinto nem pessoas sem documento', () => {
    const data = {
      people: [
        { id: 'a', operationId: 'op-a', name: 'Matriz', cpfCnpj: '12.345.678/0001-95', operationRole: 'alvo' },
        { id: 'b', operationId: 'op-a', name: 'Filial', cpfCnpj: '12.345.678/0002-76', operationRole: 'alvo' },
        { id: 'c', operationId: 'op-a', name: 'Sem doc', cpfCnpj: '', operationRole: 'relacionada' },
        { id: 'd', operationId: 'op-a', name: 'Sem doc 2', cpfCnpj: '', operationRole: 'relacionada' }
      ],
      debts: [],
      assets: [],
      links: { cdaResponsibilities: [], measurePeople: [] }
    };
    const { removed } = dedupePeopleByDoc(data);
    assert.equal(removed, 0);
  });

  it('fixture SIDA: todas as inscrições geram só 3 fichas novas de corresponsável', () => {
    const fixtureDir = path.dirname(fileURLToPath(new URL('./fixtures/sida/sida-18092026.lines.json', import.meta.url)));
    const lines = JSON.parse(readFileSync(path.join(fixtureDir, 'sida-18092026.lines.json'), 'utf8'));
    const recs = parseSIDALines(lines);
    let people = [{
      id: 'p1', operationId: 'op-a', name: 'VERTICALI- CONSTRUCOES E INCORPORACOES LTDA', cpfCnpj: '00.841.065/0001-60', operationRole: 'alvo'
    }];
    let n = 0;
    let created = 0;
    for (const rec of recs) {
      for (const cr of rec.coresponsibles || []) {
        const r = ensureCorespPerson(people, {
          operationId: 'op-a',
          cr,
          now: '2026-09-19T12:00:00.000Z',
          newId: () => 'new-' + (++n)
        });
        people = r.people;
        if (r.created) created++;
      }
    }
    assert.ok(recs.length >= 50);
    assert.equal(created, 3);
    assert.equal(people.length, 4);
  });
});
