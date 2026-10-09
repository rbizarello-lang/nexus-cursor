import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mdNoteToHtml, htmlToMdNote, noteRawText, notesNewestFirst, replaceNoteText } from '../src/lib/notes-md.js';

describe('mdNoteToHtml', () => {
  it('negrito, itálico e negrito+itálico', () => {
    assert.equal(mdNoteToHtml('um **forte** e *leve* e ***ambos***'), '<div>um <b>forte</b> e <i>leve</i> e <b><i>ambos</i></b></div>');
  });
  it('listas com marcadores e numeradas', () => {
    assert.equal(mdNoteToHtml('- a\n- b\n1. x\n2. y'), '<ul><li>a</li><li>b</li></ul><ol><li>x</li><li>y</li></ol>');
  });
  it('link seguro e URL solta; javascript: não vira link', () => {
    assert.match(mdNoteToHtml('[site](https://ex.com/a?b=1&c=2)'), /<a href="https:\/\/ex\.com\/a\?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">site<\/a>/);
    assert.match(mdNoteToHtml('veja https://ex.com/x.'), /<a href="https:\/\/ex\.com\/x"/);
    assert.ok(!/<a /.test(mdNoteToHtml('[x](javascript:alert(1))')));
  });
  it('escapa HTML', () => {
    assert.equal(mdNoteToHtml('<script>alert(1)</script> & "x"'), '<div>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;</div>');
  });
  it('asteriscos soltos ficam como estão', () => {
    assert.equal(mdNoteToHtml('2 * 3 * 4'), '<div>2 * 3 * 4</div>');
  });
  it('linha em branco vira bloco vazio; pontas são aparadas', () => {
    assert.equal(mdNoteToHtml('\na\n\nb\n'), '<div>a</div><div><br></div><div>b</div>');
  });
  it('texto simples antigo (sem marcação) continua texto', () => {
    assert.equal(mdNoteToHtml('Penhora imóvel ativa'), '<div>Penhora imóvel ativa</div>');
  });
});

describe('htmlToMdNote', () => {
  it('negrito/itálico (b/strong/i/em)', () => {
    assert.equal(htmlToMdNote('x <b>forte</b> <em>leve</em> <strong><i>ambos</i></strong>'), 'x **forte** *leve* ***ambos***');
  });
  it('espaço dentro do negrito vai para fora do marcador', () => {
    assert.equal(htmlToMdNote('<b>forte </b>fim'), '**forte** fim');
  });
  it('listas', () => {
    assert.equal(htmlToMdNote('<ul><li>a</li><li>b</li></ul><ol><li>x</li><li>y</li></ol>'), '- a\n- b\n1. x\n2. y');
  });
  it('linhas em div, br e vazias', () => {
    assert.equal(htmlToMdNote('a<div>b</div><div><br></div><div>c<br></div>'), 'a\nb\n\nc');
    assert.equal(htmlToMdNote('x<br>y'), 'x\ny');
  });
  it('links; URL igual ao texto vira URL solta; href inseguro some', () => {
    assert.equal(htmlToMdNote('<a href="https://ex.com">site</a>'), '[site](https://ex.com)');
    assert.equal(htmlToMdNote('<a href="https://ex.com">https://ex.com</a>'), 'https://ex.com');
    assert.equal(htmlToMdNote('<a href="javascript:alert(1)">x</a>'), 'x');
  });
  it('descarta scripts, estilos e atributos; decodifica entidades', () => {
    assert.equal(htmlToMdNote('<div style="color:red" onclick="x()">a &amp; b&nbsp;c</div><script>alert(1)</script>'), 'a & b c');
  });
  it('vazio', () => {
    assert.equal(htmlToMdNote('<div><br></div>'), '');
    assert.equal(htmlToMdNote(''), '');
  });
  it('item de lista com negrito', () => {
    assert.equal(htmlToMdNote('<ul><li>um <b>dois</b></li></ul>'), '- um **dois**');
  });
});

describe('ida e volta', () => {
  const cases = [
    'simples',
    'a **b** *c*',
    '- um\n- dois\n\ntexto depois',
    '1. x\n2. y',
    'veja [o site](https://ex.com/p) agora',
    'linha 1\n\nlinha 3',
    'https://ex.com/solta',
  ];
  cases.forEach(c => it(JSON.stringify(c), () => assert.equal(htmlToMdNote(mdNoteToHtml(c)), c)));
});

describe('auxiliares', () => {
  it('noteRawText', () => {
    assert.equal(noteRawText('a'), 'a');
    assert.equal(noteRawText({ content: 'b' }), 'b');
    assert.equal(noteRawText(null), '');
  });
  it('notesNewestFirst mantém o índice gravado', () => {
    assert.deepEqual(notesNewestFirst(['a', 'b', 'c']).map(x => x.idx), [2, 1, 0]);
  });
  it('replaceNoteText preserva objeto', () => {
    assert.deepEqual(replaceNoteText(['a', { body: 'b', date: '2026-01-01' }], 1, 'N'), ['a', { body: 'N', date: '2026-01-01' }]);
    assert.deepEqual(replaceNoteText(['a', 'b'], 0, 'N'), ['N', 'b']);
  });
});
