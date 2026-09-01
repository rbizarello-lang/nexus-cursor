/** Utilitários de data — módulo puro, sem React. */

const _pad2 = (n) => String(n).padStart(2, '0');

export const localIso = (d) => `${d.getFullYear()}-${_pad2(d.getMonth() + 1)}-${_pad2(d.getDate())}`;

export const parseAnyDate = (v) => {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v.getTime())) return localIso(v);
  const s = String(v).trim();
  if (!s || s === '-' || /^nan|undefined|null$/i.test(s)) return '';
  const iso = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${_pad2(iso[2])}-${_pad2(iso[3])}`;
  const dmy = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (dmy) {
    let y = dmy[3];
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
    return `${y}-${_pad2(dmy[2])}-${_pad2(dmy[1])}`;
  }
  const num = parseFloat(s);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(num) * 86400000).toISOString().slice(0, 10);
  }
  return '';
};

export const toDayKey = (v) => parseAnyDate(v);

export const extractPrazoDias = (desc) => {
  const m = String(desc || '').match(/(\d+)\s*dias?/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return (n > 0 && n <= 365) ? n : null;
};

export const fmtDate = (d) => {
  const k = toDayKey(d);
  if (!k) return '—';
  return new Date(k + 'T00:00:00').toLocaleDateString('pt-BR');
};

export const daysUntil = (d, asOf) => {
  const k = toDayKey(d);
  if (!k) return null;
  const alvo = new Date(k + 'T00:00:00');
  const hoje = asOf ? new Date(toDayKey(asOf) + 'T00:00:00') : new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
};

export const addCalendarYears = (iso, n) => {
  const key = toDayKey(iso);
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  d.setFullYear(d.getFullYear() + n);
  return localIso(d);
};

export const addCalendarDays = (iso, n) => {
  const key = toDayKey(iso);
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return localIso(d);
};

export const daysBetween = (a, b) => {
  const ka = toDayKey(a);
  const kb = toDayKey(b);
  if (!ka || !kb) return 0;
  const da = new Date(ka + 'T00:00:00');
  const db = new Date(kb + 'T00:00:00');
  return Math.round((db - da) / 86400000);
};

export const normProc = (s) => String(s == null ? '' : s).replace(/\D/g, '');
export const sameProc = (a, b) => { const x = normProc(a); return !!x && x === normProc(b); };

const _easterDate = (y) => {
  const a = y % 19, b = Math.floor(y / 100), cc = y % 100, dd = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30,
        i = Math.floor(cc / 4), k = cc % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
};

const _holidayCache = {};
let _extraHolidays = new Set();

/** Feriados/suspensões locais (ISO YYYY-MM-DD). Usado só em prazos processuais. */
export const setExtraHolidays = (isoList) => {
  _extraHolidays = new Set((isoList || []).map(toDayKey).filter(Boolean));
};

export const getExtraHolidays = () => [..._extraHolidays];

const _nationalHolidays = (y) => {
  if (_holidayCache[y]) return _holidayCache[y];
  const iso = (dt) => `${dt.getFullYear()}-${_pad2(dt.getMonth() + 1)}-${_pad2(dt.getDate())}`;
  const easter = _easterDate(y);
  const shift = (base, days) => { const d = new Date(base); d.setDate(d.getDate() + days); return d; };
  const set = new Set([
    `${y}-01-01`, `${y}-04-21`, `${y}-05-01`, `${y}-09-07`, `${y}-10-12`,
    `${y}-11-02`, `${y}-11-15`, `${y}-11-20`, `${y}-12-25`,
    iso(shift(easter, -48)), iso(shift(easter, -47)),
    iso(shift(easter, -2)),
    iso(shift(easter, 60)),
    `${y}-08-11`, `${y}-11-01`, `${y}-12-08`
  ]);
  _holidayCache[y] = set;
  return set;
};

const _inForensicRecess = (d) => {
  const m = d.getMonth(), day = d.getDate();
  return (m === 11 && day >= 20) || (m === 0 && day <= 20);
};

export const isBusinessDay = (d) => {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  if (_inForensicRecess(d)) return false;
  const key = `${d.getFullYear()}-${_pad2(d.getMonth() + 1)}-${_pad2(d.getDate())}`;
  if (_nationalHolidays(d.getFullYear()).has(key)) return false;
  if (_extraHolidays.has(key)) return false;
  return true;
};

export const addBusinessDays = (dateStr, n) => {
  const key = toDayKey(dateStr);
  if (!key || !n) return null;
  const d = new Date(key + 'T00:00:00');
  let added = 0, guard = 0;
  while (added < n && guard++ < 400) { d.setDate(d.getDate() + 1); if (isBusinessDay(d)) added++; }
  return localIso(d);
};

export const coerceIntimDates = (intim) => {
  const out = { ...intim };
  ['dateSent', 'dateStart', 'dateDeadline'].forEach(f => { if (out[f]) { const n = parseAnyDate(out[f]); if (n) out[f] = n; } });
  if (!toDayKey(out.dateDeadline) && out.dateStart) {
    const dias = extractPrazoDias(out.eventDescription);
    if (dias) out.dateDeadline = addBusinessDays(out.dateStart, dias);
  }
  return out;
};
