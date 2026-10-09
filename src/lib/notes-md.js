/**
 * Notas do processo com formatação leve (Nexus Prumo) — funções puras, sem DOM.
 *
 * Armazenamento: a nota continua sendo TEXTO em `execution.notesList` (string, ou objeto com text/content/body),
 * com marcação leve que continua legível no Clássico e na Beta, que mostram o texto cru:
 *   **negrito**   *itálico*   ***negrito e itálico***
 *   linhas "- " (lista)   linhas "1. " (lista numerada)   [texto](https://link)   https://link solto
 * Cada linha vira um bloco; linha vazia = parágrafo em branco.
 *
 * mdNoteToHtml: markdown-lite → HTML SEGURO (todo o texto é escapado; só emite b/i/ul/ol/li/a/div/br,
 *   e <a> apenas para http(s)/mailto) — pode ir direto para o editor ou para dangerouslySetInnerHTML.
 * htmlToMdNote: HTML do editor (contenteditable) → markdown-lite. Lista branca de tags; todo o resto
 *   (scripts, estilos, atributos) é descartado, então também funciona como sanitização.
 */

const NMD_SAFE_URL = /^(https?:\/\/|mailto:)/i;

function nmdEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function nmdUnesc(s) {
  return String(s).replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d{1,6});/g, (a, n) => { try { return String.fromCodePoint(+n); } catch (e) { return a; } })
    .replace(/&amp;/gi, '&');
}

function nmdInline(src) {
  const slots = [];
  const hold = (html) => { slots.push(html); return '\u0000' + (slots.length - 1) + '\u0000'; };
  let s = nmdEsc(src);
  // [texto](url) — o conteúdo do texto ainda recebe negrito/itálico.
  s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (all, label, url) => {
    const raw = nmdUnesc(url);
    if (!NMD_SAFE_URL.test(raw)) return all;
    return hold('<a href="' + nmdEsc(raw) + '" target="_blank" rel="noopener noreferrer">' + nmdEmph(label) + '</a>');
  });
  // URL solta
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, (all, pre, url) => pre + hold('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'));
  s = nmdEmph(s);
  return s.replace(/\u0000(\d+)\u0000/g, (a, i) => slots[+i]);
}
function nmdEmph(s) {
  return s
    .replace(/\*\*\*(?=\S)(.+?)(?<=\S)\*\*\*/g, '<b><i>$1</i></b>')
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<b>$1</b>')
    .replace(/\*(?=\S)(.+?)(?<=\S)\*/g, '<i>$1</i>');
}

/** markdown-lite → HTML seguro (blocos <div>, <ul>, <ol>). */
export function mdNoteToHtml(md) {
  const lines = String(md == null ? '' : md).replace(/\r\n?/g, '\n').replace(/ /g, ' ').split('\n');
  const out = [];
  let list = null; // { tag, items }
  const flush = () => { if (list) { out.push('<' + list.tag + '>' + list.items.map(i => '<li>' + i + '</li>').join('') + '</' + list.tag + '>'); list = null; } };
  lines.forEach(line => {
    const ul = /^\s*[-•]\s+(.*)$/.exec(line);
    const ol = ul ? null : /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flush(); list = { tag, items: [] }; }
      list.items.push(nmdInline((ul || ol)[1]));
      return;
    }
    flush();
    out.push(line.trim() ? '<div>' + nmdInline(line) + '</div>' : '<div><br></div>');
  });
  flush();
  // remove linhas em branco nas pontas
  while (out.length && out[0] === '<div><br></div>') out.shift();
  while (out.length && out[out.length - 1] === '<div><br></div>') out.pop();
  return out.join('');
}

const NMD_BLOCKS = new Set(['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'tr', 'section', 'article']);

/** HTML do editor → markdown-lite. */
export function htmlToMdNote(html) {
  let s = String(html == null ? '' : html);
  s = s.replace(/<!--[\s\S]*?(-->|$)/g, '').replace(/<(script|style|template|noscript)\b[\s\S]*?(<\/\1\s*>|$)/gi, '');
  const lines = [];
  let cur = '';
  let prefix = '';
  let pendingOpen = []; // marcadores abertos ainda sem texto
  let openStack = [];   // marcadores já emitidos
  let br = false;
  let hasContent = false; // houve texto no bloco atual
  let inLi = false;
  const lists = []; // { tag, n }
  const links = []; // pilha de { href, start }

  const endLine = (force) => {
    const body = cur.replace(/[ \t]+$/, '');
    if (body || prefix) { if (body) lines.push(prefix + body); }
    else if (force) lines.push('');
    cur = ''; prefix = ''; hasContent = false; br = false;
  };
  const addText = (t) => {
    if (!t) return;
    if (!/\S/.test(t)) { if (cur && !/\s$/.test(cur)) cur += ' '; return; }
    if (br) { if (inLi) cur += ' '; else endLine(false); br = false; }
    const lead = /^\s*/.exec(t)[0];
    const rest = t.slice(lead.length);
    if (lead && cur && !/\s$/.test(cur)) cur += ' ';
    if (pendingOpen.length) { cur += pendingOpen.join(''); openStack = openStack.concat(pendingOpen); pendingOpen = []; }
    cur += rest;
    hasContent = true;
  };
  const openMark = (m) => { pendingOpen.push(m); };
  const closeMark = (m) => {
    const pi = pendingOpen.lastIndexOf(m);
    if (pi >= 0) { pendingOpen.splice(pi, 1); return; } // vazio
    const oi = openStack.lastIndexOf(m);
    if (oi < 0) return;
    openStack.splice(oi, 1);
    const trail = /\s*$/.exec(cur)[0];
    cur = cur.slice(0, cur.length - trail.length) + m + (trail ? ' ' : '');
  };

  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let last = 0, m;
  while ((m = tagRe.exec(s))) {
    addText(nmdUnesc(s.slice(last, m.index)).replace(/\s+/g, ' '));
    last = tagRe.lastIndex;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (name === 'br') { br = true; continue; }
    if (name === 'b' || name === 'strong') { closing ? closeMark('**') : openMark('**'); continue; }
    if (name === 'i' || name === 'em') { closing ? closeMark('*') : openMark('*'); continue; }
    if (name === 'a') {
      if (!closing) {
        const hm = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[3]);
        const href = nmdUnesc(hm ? (hm[2] != null ? hm[2] : hm[3] != null ? hm[3] : hm[4]) : '').trim();
        links.push({ href: NMD_SAFE_URL.test(href) ? href : '', start: cur.length });
      } else {
        const l = links.pop();
        if (l && l.href && hasContent) {
          const label = cur.slice(l.start);
          if (label.replace(/[*\s]/g, '') === l.href.replace(/[*\s]/g, '') || label.trim() === l.href) { cur = cur.slice(0, l.start) + l.href; }
          else {
            const lead = /^\s*/.exec(label)[0], trail = /\s*$/.exec(label)[0];
            const core = label.slice(lead.length, label.length - trail.length);
            cur = cur.slice(0, l.start) + lead + '[' + core + '](' + l.href.replace(/\(/g, '%28').replace(/\)/g, '%29') + ')' + trail;
          }
        }
      }
      continue;
    }
    if (name === 'ul' || name === 'ol') {
      if (!closing) { endLine(false); lists.push({ tag: name, n: 0 }); } else { endLine(false); lists.pop(); }
      continue;
    }
    if (name === 'li') {
      if (!closing) {
        endLine(false);
        const L = lists[lists.length - 1] || { tag: 'ul', n: 0 };
        L.n++;
        prefix = (L.tag === 'ol' ? L.n + '. ' : '- ');
        inLi = true;
      } else { endLine(false); inLi = false; }
      continue;
    }
    if (NMD_BLOCKS.has(name)) {
      if (!closing) { endLine(false); }
      else { // fecha: <div><br></div> vira linha em branco
        if (!hasContent && !cur && br) { lines.push(''); br = false; } else endLine(false);
      }
      continue;
    }
    // span, u, font e demais: só o conteúdo
  }
  addText(nmdUnesc(s.slice(last)).replace(/\s+/g, ' '));
  endLine(false);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}

/** Texto cru de uma nota (string ou objeto text/content/body). */
export function noteRawText(raw) {
  return typeof raw === 'string' ? raw : ((raw && (raw.text || raw.content || raw.body)) || '');
}

/** Ordem de exibição: mais recentes primeiro, sem mexer na ordem gravada. [{ n, idx }] */
export function notesNewestFirst(list) {
  return (list || []).map((n, idx) => ({ n, idx })).reverse();
}

/** Grava `md` no lugar da nota `idx`, preservando notas-objeto (a chave de texto original). */
export function replaceNoteText(list, idx, md) {
  const arr = (list || []).slice();
  const raw = arr[idx];
  if (raw && typeof raw === 'object') {
    const key = ['text', 'content', 'body'].find(k => raw[k] != null) || 'text';
    arr[idx] = { ...raw, [key]: md };
  } else arr[idx] = md;
  return arr;
}
