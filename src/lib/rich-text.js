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
 */
export function richHtmlToPlainText(html) {
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
