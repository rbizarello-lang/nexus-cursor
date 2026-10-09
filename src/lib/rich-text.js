/**
 * Texto rico curto (descrição da operação no Nexus Prumo) — funções puras, sem DOM.
 *
 * Modelo de dados (retrocompatível): `operation.description` continua sendo TEXTO SIMPLES
 * (busca, Clássico, Beta, relatório e o modal "Editar operação" seguem usando só ele) e
 * `operation.descriptionHtml` é opcional (HTML já sanitizado pelo editor rico do Prumo).
 * O HTML só vale enquanto o seu texto simples ainda for igual a `description`; se alguém
 * editar a descrição no modal clássico, a versão simples passa a mandar.
 */

const BLOCK_TAGS = new Set(['div', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'blockquote']);
const FORMAT_TAGS_RE = /<(b|strong|i|em|u|s|strike|span|ul|ol|li)\b/i;

const NAMED_ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodeEntities(text) {
  return String(text).replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]+));/gi, (all, dec, hex, name) => {
    if (name) return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name.toLowerCase()) ? NAMED_ENTITIES[name.toLowerCase()] : all;
    const code = dec ? parseInt(dec, 10) : parseInt(hex, 16);
    if (!code || code > 0x10ffff) return all;
    try { return String.fromCodePoint(code); } catch (e) { return all; }
  });
}

/**
 * Texto simples de um HTML rico: <br> e o fim/início de blocos (div, p, li…) viram quebra de
 * linha, itens de lista ganham "• ", tags somem e entidades são decodificadas.
 * `{ paragraphs: true }` deixa uma linha em branco entre parágrafos (<p>…</p><p>…</p> → "a\n\nb").
 */
export function richHtmlToPlainText(html, opts) {
  const paragraphs = !!(opts && opts.paragraphs);
  let s = String(html == null ? '' : html);
  s = s.replace(/<!--[\s\S]*?(-->|$)/g, '');
  s = s.replace(/<(script|style|template|noscript)\b[\s\S]*?(<\/\1\s*>|$)/gi, '');
  let out = '';
  const ensureNewline = () => { if (out && !out.endsWith('\n')) out += '\n'; };
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let last = 0;
  let m;
  while ((m = tagRe.exec(s))) {
    out += decodeEntities(s.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (name === 'br') { out += '\n'; continue; }
    if (!BLOCK_TAGS.has(name)) continue;
    ensureNewline();
    if (!closing && name === 'li') out += '• ';
    // Com { paragraphs: true }, o fim de um <p> deixa uma linha em branco (texto longo de decisão).
    if (paragraphs && closing && name === 'p') out += '\n';
  }
  out += decodeEntities(s.slice(last));
  return out
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Compara textos ignorando diferenças de espaços e quebras de linha. */
export function normalizeWs(text) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
}

/**
 * HTML a exibir para a descrição da operação, ou '' quando deve valer o texto simples.
 * `sanitize` é o sanitizador do app (sanitizeNoteHtml) — reaplicado aqui, no render.
 */
export function pickOpDescriptionHtml(op, sanitize) {
  const raw = op && op.descriptionHtml;
  if (!raw || typeof raw !== 'string') return '';
  const clean = typeof sanitize === 'function' ? sanitize(raw) : '';
  if (!clean) return '';
  const plain = normalizeWs(richHtmlToPlainText(clean));
  if (!plain || plain !== normalizeWs(op.description)) return '';
  return clean;
}

/**
 * Campos a gravar na operação a partir do HTML do editor: `description` (texto simples) e
 * `descriptionHtml` (só quando há formatação — negrito, cor, marca-texto, lista…; sem formatação
 * o texto simples basta e o HTML antigo é descartado).
 */
export function buildOpDescriptionPatch(html, sanitize) {
  const clean = typeof sanitize === 'function' ? sanitize(html) : '';
  const plain = richHtmlToPlainText(clean);
  if (!plain) return { description: '', descriptionHtml: '' };
  return { description: plain, descriptionHtml: FORMAT_TAGS_RE.test(clean) ? clean : '' };
}

/**
 * Cores de texto do editor rico do Prumo (valores gravados, que são os de Ardósia) → tokens `--cx-rt-*`
 * dos temas. Só para EXIBIR: o HTML gravado não muda, senão o texto "escuro" sumiria no tema escuro.
 * Mexe apenas em `color:` dentro de atributos style (nunca em `background-color` nem em texto corrido);
 * cores fora da paleta passam direto.
 */
const RICH_TEXT_COLOR_TOKENS = {
  '20,22,26': 'var(--cx-rt-ink)',
  '194,50,61': 'var(--cx-rt-red)',
  '148,107,0': 'var(--cx-rt-amber)',
  '33,132,90': 'var(--cx-rt-green)',
  '45,98,211': 'var(--cx-rt-blue)',
};
function richColorToRgbKey(v) {
  const s = String(v).trim().toLowerCase();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
  }
  m = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(s);
  return m ? [m[1], m[2], m[3]].map(n => String(parseInt(n, 10))).join(',') : '';
}
/** Uma cor (#hex ou rgb()) → token `--cx-rt-*` se for da paleta do editor; senão devolve a própria cor. */
export function mapRichTextColor(color) {
  const tok = RICH_TEXT_COLOR_TOKENS[richColorToRgbKey(color)];
  return tok || color;
}
export function mapRichTextColors(html) {
  const src = String(html == null ? '' : html);
  // Só dentro de tags (texto corrido que mencione style="color:…" não é tocado).
  return src.replace(/<[a-zA-Z][^>]*>/g, (tag) => tag.replace(/(\bstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (all, pre, dq, sq) => {
    const body = dq !== undefined ? dq : sq;
    const mapped = body.replace(/(^|[\s;])color(\s*:\s*)(#[0-9a-f]{3,6}|rgb\([^)]*\))/gi, (a, lead, colon, val) => lead + 'color' + colon + mapRichTextColor(val));
    if (mapped === body) return all;
    return pre + (dq !== undefined ? '"' + mapped + '"' : "'" + mapped + "'");
  }));
}

/**
 * Texto de eventos das fases do processo (Frentes processuais, Nexus Prumo).
 *
 * Mesma ideia da descrição da operação: `rec.texto` é SEMPRE o texto simples (Clássico, Beta, busca,
 * relatório e o StagePopup seguem usando só ele) e `rec.textoHtml` é opcional (HTML do editor rico,
 * sanitizado). O HTML só vale enquanto o seu texto simples ainda for igual a `texto` (ignorando espaços
 * e quebras); se o texto foi editado em outro lugar (StagePopup), a versão simples passa a mandar.
 */
function pickRichHtml(html, plainText, sanitize) {
  if (!html || typeof html !== 'string') return '';
  const clean = typeof sanitize === 'function' ? sanitize(html) : '';
  if (!clean) return '';
  const plain = normalizeWs(richHtmlToPlainText(clean));
  if (!plain || plain !== normalizeWs(plainText)) return '';
  return clean;
}
/** HTML a exibir para o texto de uma fase, ou '' quando deve valer o texto simples. */
export function pickStageTextHtml(rec, sanitize) {
  return pickRichHtml(rec && rec.textoHtml, rec && rec.texto, sanitize);
}
/**
 * Campos a gravar na fase a partir do HTML do editor: `texto` (simples, com linha em branco entre
 * parágrafos) e `textoHtml` (só quando há formatação — negrito, cor, marca-texto, lista…; sem ela o
 * texto simples basta e o HTML antigo é descartado).
 */
export function buildStageTextPatch(html, sanitize) {
  const clean = typeof sanitize === 'function' ? sanitize(html) : '';
  const texto = richHtmlToPlainText(clean, { paragraphs: true });
  if (!texto) return { texto: '', textoHtml: '' };
  return { texto, textoHtml: FORMAT_TAGS_RE.test(clean) ? clean : '' };
}

/** Texto simples → parágrafos (linhas em branco separam) → linhas (quebra simples). [[linha, …], …] */
export function plainToParagraphs(text) {
  const src = String(text == null ? '' : text).replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
  return src.split(/\n[ \t]*(?:\n[ \t]*)+/)
    .map(p => p.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean))
    .filter(p => p.length);
}
const rtEscapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Texto simples → HTML do editor: escapa, parágrafos viram <p>, quebra simples vira <br>. */
export function plainToRichHtml(text) {
  return plainToParagraphs(text).map(p => '<p>' + p.map(rtEscapeHtml).join('<br>') + '</p>').join('');
}

/**
 * "Organizar parágrafos": o texto colado do eproc costuma vir num bloco só. Insere linha em branco
 * (\n\n) antes de enumeradores (1) 2. I – a)) e de marcadores de decisão (Vistos, Ante o exposto,
 * DEFIRO, Intime-se…) — SÓ mexe em espaços e quebras de linha, nunca nas palavras. Idempotente.
 *
 * Conservador de propósito: um enumerador/marcador só abre parágrafo quando vem logo depois de
 * pontuação final (. : ; ! ?), e nunca depois de abreviatura (fls., art., n.,
 * ev.…). Assim "art. 135", "R$ 1.000,00", "5001234-56.2023.4.04.7001" e "10/06/2026" ficam intactos,
 * e "Ante o exposto, DEFIRO" não é cortado em dois.
 */
const ORG_MARKERS = [
  'Vistos', 'Ante o exposto', 'Diante do exposto', 'Pelo exposto', 'Isso posto', 'Dispositivo', 'Decido',
  'Intime-se', 'Intimem-se', 'Cumpra-se', 'Publique-se', 'Cite-se', 'É o relatório', 'Relatório', 'Fundamentação',
];
const ORG_MARKERS_UPPER = ['DEFIRO', 'INDEFIRO', 'DECIDO'];
const ORG_ABBREV = 'fls?|art|arts|n|nº|n°|nos|ev|evs|evt|p|pp|pág|págs|doc|docs|id|ids|inc|al|cf|obs|proc|vs|sr|sra|dr|dra|ed|vol|seq|nr|num|v|ss';
const orgEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
const ORG_MARKER_ALT = ORG_MARKERS.flatMap(m => [m, m.toUpperCase()]).concat(ORG_MARKERS_UPPER).map(orgEsc).join('|');
// Enumeradores: 1) 2. 3 – · I – II) · a) b)
const ORG_ENUM_ALT = [
  '\\d{1,2}[º°]?\\)',                          // 1)  2º)
  '\\d{1,2}\\.(?=[ \\t]+[\\p{L}"“(])',          // 2. Intime-se (ponto + espaço + maiúscula)
  '\\d{1,2}[ \\t]*[-–—](?=[ \\t]+[\\p{L}"“(])',  // 3 – Defiro
  '[IVX]{1,4}(?:\\)|[ \\t]*[-–—](?=[ \\t]+[\\p{L}"“(]))', // I – / IV)
  '[a-z]\\)',                                   // a)
].join('|');
// pontuação final (com fecha-aspas/parêntese opcional) logo antes do espaço que antecede o item
const ORG_BOUNDARY = '([.:;!?][)"”\']?)([ \\t]*\\n?[ \\t]*)';
const ORG_RE_ENUM = new RegExp(ORG_BOUNDARY + '(?=(?:' + ORG_ENUM_ALT + ')(?:[ \\t]|\\p{L}|$))', 'gu');
const ORG_RE_MARK = new RegExp(ORG_BOUNDARY + '(?=(?:' + ORG_MARKER_ALT + ')(?![\\p{L}\\p{N}]))', 'gu');
const ORG_ABBREV_END = new RegExp('(?:^|[^\\p{L}\\p{N}])(?:' + ORG_ABBREV + ')\\.$', 'iu');
// Título/fórmula sozinho no início do parágrafo ("Vistos.", "Relatório:", "Decido.") → o que vem depois abre outro parágrafo.
const ORG_HEADINGS = ['Vistos(?:,?[ \\t]*etc\\.?)?', 'Relatório', 'RELATÓRIO', 'É\\s+o\\s+relatório', 'É\\s+O\\s+RELATÓRIO', 'Fundamentação', 'FUNDAMENTAÇÃO', 'Dispositivo', 'DISPOSITIVO', 'Decido', 'DECIDO', 'VISTOS'];
const ORG_RE_HEADING = new RegExp('(^|\\n)(' + ORG_HEADINGS.join('|') + ')([.:])[ \\t]+(?=[^\\s])', 'gu');
export function organizarParagrafos(text) {
  let s = String(text == null ? '' : text)
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();
  // marcador: abre parágrafo (uma quebra simples antes dele também vira linha em branco)
  s = s.replace(ORG_RE_MARK, (m, punct, ws, off) => {
    if (ORG_ABBREV_END.test(s.slice(0, off) + punct)) return m;
    if (!ws) return m; // ".Intime-se": colado, não é início de frase
    return punct + '\n\n';
  });
  s = s.replace(ORG_RE_HEADING, '$1$2$3\n\n');
  // enumerador: abre parágrafo se estava na mesma linha; quebra simples (lista em linhas) fica como está
  s = s.replace(ORG_RE_ENUM, (m, punct, ws, off) => {
    if (ORG_ABBREV_END.test(s.slice(0, off) + punct)) return m;
    if (!ws) return m;
    if (ws.indexOf('\n') >= 0) return m;
    return punct + '\n\n';
  });
  return s.replace(/\n{3,}/g, '\n\n').trim();
}
