import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const shellSource = fs.readFileSync(new URL('../src/Nexus.shell.html', import.meta.url), 'utf8');

describe('fluxo de ações dentro do diagnóstico', () => {
  it('abre consolidação e reassociação acima do diagnóstico sem desmontá-lo', () => {
    assert.match(appSource, /function Modal\(\{[^}]*stacked\s*=\s*false[^}]*\}\)/);
    assert.match(appSource, /title="Consolidar processos duplicados"[^>]*\bwide\s+stacked>/);
    assert.match(appSource, /title="Vincular processo a uma operação"[^>]*\bwide\s+stacked>/);
    assert.match(appSource, /Diagnóstico desta operação/);
    assert.match(appSource, /openDiagnostico\(activeOpId\)/);
    assert.match(appSource, /openDiagnostico\(activeOp\.id\)[\s\S]{0,500}generateHandoverReport\(activeOp\)[\s\S]{0,500}lastReviewedAt/s);
    assert.match(appSource, /runDiagnostics\(data, diagnosticoOpId \? \{ operationId: diagnosticoOpId \} : \{\}\)/);
    assert.match(shellSource, /\.modal-overlay\.modal-overlay-stacked\s*\{\s*z-index:\s*1200;/);
    assert.match(shellSource, /\.global-search-overlay\s*\{[^}]*z-index:\s*1100;/s);
  });
});
