import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  richHtmlToPlainText,
  normalizeWs,
  pickOpDescriptionHtml,
  buildOpDescriptionPatch,
} from '../src/lib/rich-text.js';

// Sanitizador de teste: devolve o HTML como veio (o do app, sanitizeNoteHtml, depende do DOM).
const ident = (h) => String(h || '');

describe('richHtmlToPlainText — texto simples do HTML rico', () => {
  it('<br> e blocos (div, p, li) viram quebras de linha; tags somem', () => {
    assert.equal(richHtmlToPlainText('linha 1<div>linha 2</div><div>linha 3</div>'), 'linha 1\nlinha 2\nlinha 3');
    assert.equal(richHtmlToPlainText('a<br>b<br><br>c'), 'a\nb\n\nc');
    assert.equal(richHtmlToPlainText('<p>um</p><p>dois</p>'), 'um\ndois');
    assert.equal(richHtmlToPlainText('<div>a<div>b</div></div>'), 'a\nb');
  });

  it('mantém linha em branco entre parágrafos, mas no máximo uma', () => {
    assert.equal(richHtmlToPlainText('a<div><br></div><div>b</div>'), 'a\n\nb');
    assert.equal(richHtmlToPlainText('a<br><br><br><br>b'), 'a\n\nb');
  });

  it('listas ganham marcador e formatação inline some sem colar palavras', () => {
    assert.equal(richHtmlToPlainText('<ul><li>um</li><li><b>dois</b></li></ul>'), '• um\n• dois');
    assert.equal(
      richHtmlToPlainText('Risco <b>alto</b> em <span style="color:rgb(194, 50, 61)">ITR</span> e <u>IRPF</u>'),
      'Risco alto em ITR e IRPF'
    );
  });

  it('decodifica entidades uma única vez e normaliza nbsp', () => {
    assert.equal(richHtmlToPlainText('A &amp; B &lt;c&gt; &quot;d&quot; &#39;e&#39;&nbsp;f'), 'A & B <c> "d" \'e\' f');
    assert.equal(richHtmlToPlainText('&amp;lt;'), '&lt;');
    assert.equal(richHtmlToPlainText('&#65;&#x42;'), 'AB');
    assert.equal(richHtmlToPlainText('&desconhecida;'), '&desconhecida;');
  });

  it('descarta script/style/comentários e aceita vazio', () => {
    assert.equal(richHtmlToPlainText('x<script>alert(1)</script>y<style>p{}</style><!-- c -->z'), 'xyz');
    assert.equal(richHtmlToPlainText(''), '');
    assert.equal(richHtmlToPlainText(null), '');
    assert.equal(richHtmlToPlainText('<div><br></div>'), '');
  });
});

describe('normalizeWs', () => {
  it('colapsa espaços e quebras de linha', () => {
    assert.equal(normalizeWs('  a \n\n b\t c  '), 'a b c');
    assert.equal(normalizeWs(null), '');
  });
});

describe('pickOpDescriptionHtml — regra de exibição da descrição rica', () => {
  const html = 'Produtor <b>rural</b><div>Renajud/CNIB</div>';
  it('mostra o HTML quando o texto simples dele ainda é igual a description (ignorando espaços)', () => {
    const op = { description: 'Produtor rural\nRenajud/CNIB', descriptionHtml: html };
    assert.equal(pickOpDescriptionHtml(op, ident), html);
    // quebras de linha/espaços diferentes (ex.: editou e salvou pelo modal sem mexer no texto)
    assert.equal(pickOpDescriptionHtml({ description: 'Produtor   rural Renajud/CNIB', descriptionHtml: html }, ident), html);
  });

  it('cai para o texto simples quando description foi alterada (modal clássico)', () => {
    assert.equal(pickOpDescriptionHtml({ description: 'Produtor rural (revisado)', descriptionHtml: html }, ident), '');
    assert.equal(pickOpDescriptionHtml({ description: '', descriptionHtml: html }, ident), '');
  });

  it('sem descriptionHtml (dados antigos) ou sem sanitizador, não mostra HTML', () => {
    assert.equal(pickOpDescriptionHtml({ description: 'x' }, ident), '');
    assert.equal(pickOpDescriptionHtml({ description: 'x', descriptionHtml: '' }, ident), '');
    assert.equal(pickOpDescriptionHtml({ description: 'x', descriptionHtml: '<b>x</b>' }), '');
    assert.equal(pickOpDescriptionHtml(null, ident), '');
  });

  it('reaplica o sanitizador e compara com o texto do HTML já sanitizado', () => {
    const op = { description: 'oi', descriptionHtml: 'oi<script>alert(1)</script>' };
    const strip = (h) => h.replace(/<script>.*?<\/script>/g, '');
    assert.equal(pickOpDescriptionHtml(op, strip), 'oi');
  });
});

describe('buildOpDescriptionPatch — o que é gravado na operação', () => {
  it('grava texto simples em description e o HTML em descriptionHtml quando há formatação', () => {
    const patch = buildOpDescriptionPatch('Risco <b>alto</b><div>Ver <span style="color:#c2323d">ITR</span></div>', ident);
    assert.equal(patch.description, 'Risco alto\nVer ITR');
    assert.equal(patch.descriptionHtml, 'Risco <b>alto</b><div>Ver <span style="color:#c2323d">ITR</span></div>');
    // o que foi gravado é exibido de volta
    assert.equal(pickOpDescriptionHtml(patch, ident), patch.descriptionHtml);
  });

  it('sem formatação, só texto simples (descriptionHtml antigo é limpo)', () => {
    assert.deepEqual(buildOpDescriptionPatch('linha 1<div>linha 2</div>', ident), { description: 'linha 1\nlinha 2', descriptionHtml: '' });
  });

  it('vazio limpa os dois campos', () => {
    assert.deepEqual(buildOpDescriptionPatch('<div><br></div>', ident), { description: '', descriptionHtml: '' });
    assert.deepEqual(buildOpDescriptionPatch('', ident), { description: '', descriptionHtml: '' });
  });

  it('lista conta como formatação', () => {
    const p = buildOpDescriptionPatch('<ul><li>a</li><li>b</li></ul>', ident);
    assert.equal(p.description, '• a\n• b');
    assert.equal(p.descriptionHtml, '<ul><li>a</li><li>b</li></ul>');
  });
});
