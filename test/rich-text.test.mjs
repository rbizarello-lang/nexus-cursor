import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  richHtmlToPlainText,
  normalizeWs,
  pickOpDescriptionHtml,
  buildOpDescriptionPatch,
  mapRichTextColors,
  mapRichTextColor,
  pickStageTextHtml,
  buildStageTextPatch,
  plainToParagraphs,
  plainToRichHtml,
  organizarParagrafos,
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

describe('mapRichTextColors (cores do editor → tokens --cx-rt-*, só exibição)', () => {
  it('mapeia as cinco cores da paleta, em rgb() e em hex', () => {
    assert.equal(mapRichTextColors('<span style="color:rgb(20, 22, 26)">a</span>'), '<span style="color:var(--cx-rt-ink)">a</span>');
    assert.equal(mapRichTextColors('<span style="color:rgb(194, 50, 61)">a</span>'), '<span style="color:var(--cx-rt-red)">a</span>');
    assert.equal(mapRichTextColors('<span style="color:rgb(148, 107, 0)">a</span>'), '<span style="color:var(--cx-rt-amber)">a</span>');
    assert.equal(mapRichTextColors('<span style="color:rgb(33, 132, 90)">a</span>'), '<span style="color:var(--cx-rt-green)">a</span>');
    assert.equal(mapRichTextColors('<span style="color:rgb(45, 98, 211)">a</span>'), '<span style="color:var(--cx-rt-blue)">a</span>');
    assert.equal(mapRichTextColors('<span style="color:#14161A">a</span>'), '<span style="color:var(--cx-rt-ink)">a</span>');
    assert.equal(mapRichTextColors('<span style="color: #c2323d;">a</span>'), '<span style="color: var(--cx-rt-red);">a</span>');
  });
  it('mantém o resto do style e as aspas simples', () => {
    assert.equal(
      mapRichTextColors('<span style="background-color:rgba(212, 168, 56, 0.45);border-radius:2px;color:rgb(33, 132, 90)">a</span>'),
      '<span style="background-color:rgba(212, 168, 56, 0.45);border-radius:2px;color:var(--cx-rt-green)">a</span>');
    assert.equal(mapRichTextColors("<b style='color:rgb(20,22,26)'>a</b>"), "<b style='color:var(--cx-rt-ink)'>a</b>");
  });
  it('não toca em background-color, cores fora da paleta, nomes de cor nem texto corrido', () => {
    const same = [
      '<span style="background-color:rgb(20, 22, 26)">a</span>',
      '<span style="color:rgb(1, 2, 3)">a</span>',
      '<span style="color:red">a</span>',
      '<span style="color:rgba(20, 22, 26, 0.5)">a</span>',
      '<p>color:#14161a e style="color:#14161a" no texto</p>',
      '<span>sem estilo</span>',
    ];
    for (const h of same) assert.equal(mapRichTextColors(h), h);
  });
  it('é idempotente e tolera vazio/nulo', () => {
    const once = mapRichTextColors('<span style="color:rgb(194, 50, 61)">a</span>');
    assert.equal(mapRichTextColors(once), once);
    assert.equal(mapRichTextColors(''), '');
    assert.equal(mapRichTextColors(null), '');
    assert.equal(mapRichTextColors(undefined), '');
  });
  it('mapRichTextColor: uma cor só', () => {
    assert.equal(mapRichTextColor('#14161a'), 'var(--cx-rt-ink)');
    assert.equal(mapRichTextColor('#abc'), '#abc');
  });
});

describe('richHtmlToPlainText { paragraphs: true }', () => {
  it('deixa linha em branco entre <p>; sem a opção, continua uma quebra só', () => {
    assert.equal(richHtmlToPlainText('<p>um</p><p>dois<br>três</p>', { paragraphs: true }), 'um\n\ndois\ntrês');
    assert.equal(richHtmlToPlainText('<p>um</p><p>dois</p>'), 'um\ndois');
    assert.equal(richHtmlToPlainText('<p>um</p><div>dois</div>', { paragraphs: true }), 'um\n\ndois');
  });
});

describe('pickStageTextHtml — regra de exibição do texto rico da fase', () => {
  const html = '<p>Vistos.</p><p>Defiro o <b>pedido</b>.</p>';
  const texto = 'Vistos.\n\nDefiro o pedido.';
  it('mostra o HTML enquanto o texto simples for equivalente (ignorando espaços e quebras)', () => {
    assert.equal(pickStageTextHtml({ texto, textoHtml: html }, ident), html);
    assert.equal(pickStageTextHtml({ texto: 'Vistos. Defiro o   pedido.', textoHtml: html }, ident), html);
  });
  it('cai para o texto simples quando `texto` foi alterado em outro lugar (StagePopup do Clássico)', () => {
    assert.equal(pickStageTextHtml({ texto: texto + ' Intime-se.', textoHtml: html }, ident), '');
    assert.equal(pickStageTextHtml({ texto: '', textoHtml: html }, ident), '');
  });
  it('sem textoHtml (dados antigos), sem sanitizador ou registro nulo: texto simples', () => {
    assert.equal(pickStageTextHtml({ texto }, ident), '');
    assert.equal(pickStageTextHtml({ texto, textoHtml: '' }, ident), '');
    assert.equal(pickStageTextHtml({ texto, textoHtml: html }), '');
    assert.equal(pickStageTextHtml(null, ident), '');
    assert.equal(pickStageTextHtml({ texto, textoHtml: 42 }, ident), '');
  });
  it('reaplica o sanitizador antes de comparar', () => {
    const strip = (h) => h.replace(/<script>.*?<\/script>/g, '');
    assert.equal(pickStageTextHtml({ texto: 'oi', textoHtml: 'oi<script>x</script>' }, strip), 'oi');
  });
  it('registro que vem do merge do StagePopup (texto aparado, outros campos) segue válido', () => {
    const rec = { date: '2026-06-10', evento: '12', outcome: '', _present: true, texto: texto.trim(), textoHtml: html };
    assert.equal(pickStageTextHtml(rec, ident), html);
  });
});

describe('buildStageTextPatch — o que é gravado na fase', () => {
  it('texto simples com linha em branco entre parágrafos + HTML quando há formatação', () => {
    const h = '<p>Vistos.</p><p>Defiro o <b>pedido</b>.</p>';
    const patch = buildStageTextPatch(h, ident);
    assert.equal(patch.texto, 'Vistos.\n\nDefiro o pedido.');
    assert.equal(patch.textoHtml, h);
    assert.equal(pickStageTextHtml(patch, ident), h); // o que foi gravado é exibido de volta
  });
  it('sem formatação só o texto (textoHtml antigo é limpo)', () => {
    assert.deepEqual(buildStageTextPatch('<p>a</p><p>b</p>', ident), { texto: 'a\n\nb', textoHtml: '' });
  });
  it('vazio limpa os dois; lista e cor contam como formatação', () => {
    assert.deepEqual(buildStageTextPatch('<p><br></p>', ident), { texto: '', textoHtml: '' });
    assert.equal(buildStageTextPatch('<ul><li>a</li></ul>', ident).textoHtml, '<ul><li>a</li></ul>');
    assert.equal(buildStageTextPatch('x <span style="color:#c2323d">y</span>', ident).textoHtml, 'x <span style="color:#c2323d">y</span>');
  });
});

describe('plainToParagraphs / plainToRichHtml', () => {
  it('linha em branco separa parágrafos; quebra simples vira linha dentro do parágrafo', () => {
    assert.deepEqual(plainToParagraphs('a\nb\n\n\n  \nc  d'), [['a', 'b'], ['c d']]);
    assert.deepEqual(plainToParagraphs(''), []);
    assert.deepEqual(plainToParagraphs(null), []);
    assert.deepEqual(plainToParagraphs('a\r\n\r\nb'), [['a'], ['b']]);
  });
  it('plainToRichHtml escapa HTML e monta <p> / <br>', () => {
    assert.equal(plainToRichHtml('a & b <c>\nlinha 2\n\nSegundo'), '<p>a &amp; b &lt;c&gt;<br>linha 2</p><p>Segundo</p>');
    assert.equal(plainToRichHtml('   '), '');
  });
  it('ida e volta: plain → html → plain preserva o texto (com parágrafos)', () => {
    const t = 'Vistos.\n\n1) Defiro.\n2) Intime-se <já>.\n\nCumpra-se.';
    assert.equal(richHtmlToPlainText(plainToRichHtml(t), { paragraphs: true }), t);
  });
});

describe('organizarParagrafos', () => {
  const sameWords = (a, b) => assert.equal(normalizeWs(a), normalizeWs(b), 'só espaços e quebras podem mudar');

  const EPROC = 'Vistos. 1) Defiro o pedido de fls. 12 e determino a penhora de ativos financeiros até o limite de R$ 1.000,00, ' +
    'nos termos do art. 835, I, do CPC. 2) Intime-se a parte executada. 3) Após, venham conclusos. ' +
    'Ante o exposto, DEFIRO o pedido. Intime-se. Cumpra-se.';

  it('decisão colada num bloco: enumeradores e marcadores abrem parágrafo', () => {
    const out = organizarParagrafos(EPROC);
    assert.equal(out, [
      'Vistos.',
      '1) Defiro o pedido de fls. 12 e determino a penhora de ativos financeiros até o limite de R$ 1.000,00, nos termos do art. 835, I, do CPC.',
      '2) Intime-se a parte executada.',
      '3) Após, venham conclusos.',
      'Ante o exposto, DEFIRO o pedido.',
      'Intime-se.',
      'Cumpra-se.',
    ].join('\n\n'));
    sameWords(out, EPROC);
  });

  it('despacho com relatório, fundamentação e dispositivo', () => {
    const t = 'É o relatório. Decido. Fundamentação. A parte exequente requereu a inclusão do sócio no polo passivo. ' +
      'Diante do exposto, DEFIRO a desconsideração da personalidade jurídica. Dispositivo: INDEFIRO o pedido de gratuidade. Publique-se. Cite-se.';
    const out = organizarParagrafos(t);
    assert.deepEqual(out.split('\n\n'), [
      'É o relatório.',
      'Decido.',
      'Fundamentação.',
      'A parte exequente requereu a inclusão do sócio no polo passivo.',
      'Diante do exposto, DEFIRO a desconsideração da personalidade jurídica.',
      'Dispositivo:',
      'INDEFIRO o pedido de gratuidade.',
      'Publique-se.',
      'Cite-se.',
    ]);
    sameWords(out, t);
  });

  it('enumeradores romanos, de letra e com travessão', () => {
    const t = 'Determino: I – a citação do executado; II - a penhora de bens; III) a avaliação. Dispositivo: a) prazo de 5 dias; b) multa diária. Intimem-se.';
    const out = organizarParagrafos(t);
    assert.deepEqual(out.split('\n\n'), [
      'Determino:',
      'I – a citação do executado;',
      'II - a penhora de bens;',
      'III) a avaliação.',
      'Dispositivo:',
      'a) prazo de 5 dias;',
      'b) multa diária.',
      'Intimem-se.',
    ]);
    sameWords(out, t);
  });

  it('não parte "Ante o exposto, DEFIRO" nem marcadores no meio da frase', () => {
    const t = 'Ante o exposto, DEFIRO o pedido, conforme o Dispositivo legal, e determino que se Cumpra-se o mandado.';
    assert.equal(organizarParagrafos(t), t);
  });

  it('falsos positivos: artigos, valores, número de processo, datas e abreviaturas', () => {
    const cases = [
      'Nos termos do art. 135 do CTN e do art. 133, § 1º, do CPC, o valor de R$ 1.000,00 foi bloqueado.',
      'Processo nº 5001234-56.2023.4.04.7001 distribuído em 10/06/2026, às 14h30.',
      'Conforme fls. 2) e ev. 15, a parte foi intimada.',
      'Ver ev. 12. Defiro conforme art. 5. Sem quebra aqui.',
      'A dívida de 2023. 15 dias depois, a parte foi intimada em 10. 5 dias. Valor R$ 1.000,00. 3,5% ao mês.',
      'No ano de 1) alfa e a) beta, sem pontuação antes, ficam juntos.',
      'Ante o exposto, defiro. Fulano V. Silva compareceu.',
    ];
    for (const t of cases) assert.equal(organizarParagrafos(t), t, t);
  });

  it('não corta depois de abreviatura (fls., art., n., ev.) mesmo com enumerador na sequência', () => {
    assert.equal(organizarParagrafos('Vide fls. 2) e ainda art. 3) do regimento.'), 'Vide fls. 2) e ainda art. 3) do regimento.');
    assert.equal(organizarParagrafos('Juntado no ev. 4. Intime-se.'), 'Juntado no ev. 4.\n\nIntime-se.'); // aqui o ponto é final de frase
  });

  it('normaliza espaços e quebras, sem mexer nas palavras', () => {
    assert.equal(organizarParagrafos('  Vistos.   1)  Defiro.  \r\n\r\n\r\n\r\n 2) Intime-se.  '), 'Vistos.\n\n1) Defiro.\n\n2) Intime-se.');
    assert.equal(organizarParagrafos('a b   c\t\td'), 'a b c d');
    assert.equal(organizarParagrafos(''), '');
    assert.equal(organizarParagrafos(null), '');
  });

  it('quebra simples antes de marcador vira linha em branco; lista em linhas (enumeradores) fica tight', () => {
    assert.equal(organizarParagrafos('Defiro o pedido.\nIntime-se.'), 'Defiro o pedido.\n\nIntime-se.');
    assert.equal(organizarParagrafos('Decido:\n1) a\n2) b\n3) c'), 'Decido:\n1) a\n2) b\n3) c');
  });

  it('"Vistos" no início abre parágrafo; "Vistos, etc." também', () => {
    assert.equal(organizarParagrafos('Vistos. Trata-se de execução fiscal.'), 'Vistos.\n\nTrata-se de execução fiscal.');
    assert.equal(organizarParagrafos('Vistos, etc. Trata-se de execução fiscal.'), 'Vistos, etc.\n\nTrata-se de execução fiscal.');
    assert.equal(organizarParagrafos('Vistos em inspeção. Defiro.'), 'Vistos em inspeção. Defiro.');
  });

  it('idempotente (inclusive sobre amostras diversas)', () => {
    const samples = [
      EPROC,
      'É o relatório. Decido. Fundamentação. Texto. Diante do exposto, DEFIRO. Publique-se.',
      'Determino: I – a; II - b; III) c. Fixo: a) x; b) y. Intimem-se.',
      'Nos termos do art. 135 do CTN, R$ 1.000,00, 10/06/2026.',
      'Decido:\n1) a\n2) b\n3) c\n\nCumpra-se.',
      'Vistos, etc. Defiro. Intime-se.\n\n\n\nCumpra-se.',
    ];
    for (const t of samples) {
      const once = organizarParagrafos(t);
      assert.equal(organizarParagrafos(once), once, t);
      sameWords(once, t);
      assert.ok(!/\n{3,}/.test(once));
    }
  });

  it('o resultado alimenta o editor e volta como o mesmo texto (plain → html → plain)', () => {
    const out = organizarParagrafos(EPROC);
    assert.equal(richHtmlToPlainText(plainToRichHtml(out), { paragraphs: true }), out);
  });
});
