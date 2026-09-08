import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE_VERSION } from '../src/lib/prescription.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(root, 'MOTOR_PRESCRICAO.md'), 'utf8');

describe('documento de regras 2026.09', () => {
  it('tem versão alinhada ao motor e as doze regras', () => {
    assert.equal(RULE_VERSION, '2026.09');
    assert.match(md, /ruleVersion:\s*2026\.09/);
    for (let i = 1; i <= 12; i++) {
      assert.match(md, new RegExp('## R' + i + '\\b'));
    }
    assert.match(md, /\*\*Frase\.\*\*/);
    assert.match(md, /\*\*Base\.\*\*/);
    assert.match(md, /\*\*Exemplo\.\*\*/);
    assert.match(md, /\*\*Na tela\.\*\*/);
  });

  it('registra as decisões da casa e o que a tela não mostra', () => {
    assert.match(md, /Decisões de política/);
    assert.match(md, /Sisbajud/);
    assert.doesNotMatch(md, /IRRISORIO|irrisório não encerra/i);
    assert.match(md, /O que a tela da inscrição não mostra/);
    assert.match(md, /Histórico das regras/);
  });
});
