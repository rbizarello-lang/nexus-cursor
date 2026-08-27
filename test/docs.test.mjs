import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  digitsOnly,
  normalizePersonName,
  cnpjRaiz,
  docsCompatible,
  preferCompleteDoc,
  findPersonByDoc,
  mergePersonDoc
} from '../src/lib/docs.js';

describe('src/lib/docs.js — utilitários de documentos e resolução de pessoas', () => {
  it('digitsOnly extrai apenas números ou string vazia', () => {
    assert.equal(digitsOnly('12.345.678/0001-95'), '12345678000195');
    assert.equal(digitsOnly('123.456.789-00'), '12345678900');
    assert.equal(digitsOnly('  '), '');
    assert.equal(digitsOnly(null), '');
  });

  it('normalizePersonName normaliza nomes removendo acentos e sufixos societários', () => {
    assert.equal(normalizePersonName('Indústria e Comércio Silva LTDA.'), 'INDUSTRIA E COMERCIO SILVA');
    assert.equal(normalizePersonName('Banco do Brasil S/A'), 'BANCO DO BRASIL');
    assert.equal(normalizePersonName('Comercial XPTO EIRELI'), 'COMERCIAL XPTO');
    assert.equal(normalizePersonName('Oficina Mecânica ME'), 'OFICINA MECANICA');
    assert.equal(normalizePersonName('Indústria ABC S.A.'), 'INDUSTRIA ABC');
  });

  it('cnpjRaiz extrai 8 primeiros dígitos', () => {
    assert.equal(cnpjRaiz('12.345.678/0001-95'), '12345678');
    assert.equal(cnpjRaiz('12345678'), '12345678');
    assert.equal(cnpjRaiz('12345'), '12345');
  });

  describe('docsCompatible', () => {
    it('exact match', () => {
      assert.equal(docsCompatible('12.345.678/0001-95', '12345678000195'), true);
      assert.equal(docsCompatible('123.456.789-00', '12345678900'), true);
      assert.equal(docsCompatible('12345678', '12345678'), true);
    });

    it('8 vs 14 same raiz', () => {
      assert.equal(docsCompatible('12345678', '12345678000195'), true);
      assert.equal(docsCompatible('12345678000195', '12345678'), true);
      assert.equal(docsCompatible('12345678', '99999999000195'), false);
    });

    it('12 vs 14 (base + filial sem DV)', () => {
      assert.equal(docsCompatible('123456780001', '12345678000195'), true);
      assert.equal(docsCompatible('12345678000195', '123456780001'), true);
      assert.equal(docsCompatible('123456780002', '12345678000195'), false);
    });

    it('CPF not prefix-matched', () => {
      assert.equal(docsCompatible('12345678', '12345678901'), false);
      assert.equal(docsCompatible('12345678901', '12345678'), false);
      assert.equal(docsCompatible('12345678901', '12345678902'), false);
    });

    it('two distinct 14-digit filiais sharing same raiz are NOT compatible', () => {
      assert.equal(docsCompatible('12345678000195', '12345678000276'), false);
    });

    it('empty doc returns false', () => {
      assert.equal(docsCompatible('', '12345678000195'), false);
      assert.equal(docsCompatible(null, '12345678000195'), false);
      assert.equal(docsCompatible('12345678', ''), false);
    });
  });

  describe('preferCompleteDoc', () => {
    it('longer digit length wins', () => {
      assert.equal(preferCompleteDoc('12.345.678', '12.345.678/0001-95'), '12.345.678/0001-95');
      assert.equal(preferCompleteDoc('12.345.678/0001-95', '12345678'), '12.345.678/0001-95');
    });

    it('equal digit length keeps existing format', () => {
      assert.equal(preferCompleteDoc('12.345.678/0001-95', '12345678000195'), '12.345.678/0001-95');
    });

    it('handles empty docs', () => {
      assert.equal(preferCompleteDoc('', '12345678000195'), '12345678000195');
      assert.equal(preferCompleteDoc('12.345.678', ''), '12.345.678');
    });
  });

  describe('findPersonByDoc', () => {
    const pMatriz = { id: 'p1', operationId: 'op1', name: 'Empresa Alfa Matriz LTDA', cpfCnpj: '12.345.678/0001-95' };
    const pFilial = { id: 'p2', operationId: 'op1', name: 'Empresa Alfa Filial Joinville', cpfCnpj: '12.345.678/0002-76' };
    const pRaizOnly = { id: 'p3', operationId: 'op1', name: 'Empresa Beta LTDA', cpfCnpj: '98.765.432' };
    const pCpf = { id: 'p4', operationId: 'op1', name: 'Fulano de Tal', cpfCnpj: '123.456.789-00' };

    const people = [pMatriz, pFilial, pRaizOnly, pCpf];

    it('finds exact match', () => {
      const res = findPersonByDoc(people, { operationId: 'op1', cpfCnpj: '12345678000195' });
      assert.equal(res?.id, 'p1');
    });

    it('8 vs 14 same raiz when unique in operation -> matches', () => {
      const res = findPersonByDoc([pRaizOnly], { operationId: 'op1', cpfCnpj: '98765432000100' });
      assert.equal(res?.id, 'p3');
    });

    it('8 vs two filiais without name -> returns null (ambiguous)', () => {
      const res = findPersonByDoc(people, { operationId: 'op1', cpfCnpj: '12345678' });
      assert.equal(res, null);
    });

    it('8 vs two filiais with matching name -> resolves the named filial', () => {
      const res = findPersonByDoc(people, {
        operationId: 'op1',
        cpfCnpj: '12345678',
        name: 'Empresa Alfa Matriz'
      });
      assert.equal(res?.id, 'p1');
    });

    it('14 vs unique 8-digit raiz in operation -> matches', () => {
      const res = findPersonByDoc(people, { operationId: 'op1', cpfCnpj: '98.765.432/0001-11' });
      assert.equal(res?.id, 'p3');
    });

    it('12 vs 14 matches when base + filial aligns', () => {
      const res = findPersonByDoc(people, { operationId: 'op1', cpfCnpj: '123456780002' });
      assert.equal(res?.id, 'p2');
    });

    it('CPF not prefix-matched', () => {
      const res = findPersonByDoc(people, { operationId: 'op1', cpfCnpj: '12345678' });
      assert.notEqual(res?.id, 'p4');
    });

    it('empty doc returns null', () => {
      assert.equal(findPersonByDoc(people, { operationId: 'op1', cpfCnpj: '' }), null);
    });
  });

  describe('mergePersonDoc', () => {
    it('updates person with more complete document', () => {
      const p = { id: 'p1', name: 'Empresa', cpfCnpj: '12.345.678' };
      const merged = mergePersonDoc(p, '12.345.678/0001-95');
      assert.equal(merged.cpfCnpj, '12.345.678/0001-95');
      assert.notEqual(merged, p);
    });

    it('returns original person when incoming doc is shorter or equal', () => {
      const p = { id: 'p1', name: 'Empresa', cpfCnpj: '12.345.678/0001-95' };
      const merged = mergePersonDoc(p, '12.345.678');
      assert.equal(merged, p);
    });
  });
});
