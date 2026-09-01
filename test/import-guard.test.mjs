import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectPdfDebtors,
  assessPdfDebtorsAgainstOperation,
  buildPdfImportConfirmMessage
} from '../src/lib/import-guard.js';

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
