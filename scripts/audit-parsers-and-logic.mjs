import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Let's import prescription.js and dates.js directly to test edge cases
const datesModule = await import('../src/lib/dates.js');
const prescModule = await import('../src/lib/prescription.js');

console.log('Testing dates.js functions...');
const { parseAnyDate, fmtDate, addBusinessDays, isBusinessDay, daysUntil, addCalendarYears } = datesModule;

console.log('1. parseAnyDate edge cases:');
console.log('  parseAnyDate(null):', parseAnyDate(null));
console.log('  parseAnyDate(undefined):', parseAnyDate(undefined));
console.log('  parseAnyDate(""):', parseAnyDate(""));
console.log('  parseAnyDate("invalid"):', parseAnyDate("invalid"));
console.log('  parseAnyDate("2026-02-29") [non-leap]:', parseAnyDate("2026-02-29"));
console.log('  parseAnyDate("29/02/2024") [leap]:', parseAnyDate("29/02/2024"));
console.log('  parseAnyDate("2026-08-19T00:00:00.000Z"):', parseAnyDate("2026-08-19T00:00:00.000Z"));

console.log('\n2. addCalendarYears edge cases:');
console.log('  addCalendarYears("2024-02-29", 1):', addCalendarYears("2024-02-29", 1)); // Feb 29 + 1 year
console.log('  addCalendarYears("2024-02-29", 4):', addCalendarYears("2024-02-29", 4)); // Feb 29 + 4 years (leap)
console.log('  addCalendarYears("2024-02-29", 5):', addCalendarYears("2024-02-29", 5)); // Feb 29 + 5 years

console.log('\n3. daysUntil edge cases:');
console.log('  daysUntil(null):', daysUntil(null));
console.log('  daysUntil("invalid"):', daysUntil("invalid"));

console.log('\n4. addBusinessDays / isBusinessDay edge cases:');
console.log('  addBusinessDays("2026-12-18", 5):', addBusinessDays("2026-12-18", 5)); // Recesso forense (20/12 to 20/01)
console.log('  addBusinessDays("2026-12-19", 1):', addBusinessDays("2026-12-19", 1)); // Saturday before recess
console.log('  isBusinessDay(2026-12-25 Christmas):', isBusinessDay(new Date('2026-12-25T00:00:00')));
console.log('  fmtDate("2024-05-10"):', fmtDate('2024-05-10'));

console.log('\nTesting prescription.js calculations...');
const { computePrescription, computeCdaLegalTimeline, computeDecadencia, computeOrdinaria } = prescModule;

// Test with empty/null/unusual inputs
try {
  const r1 = computePrescription({ debt: null, events: [] });
  console.log('  computePrescription(null debt): OK ->', r1.status);
} catch (e) {
  console.log('  computePrescription(null debt) ERROR:', e.message);
}

try {
  const r2 = computePrescription({ debt: {}, events: [] });
  console.log('  computePrescription(empty debt): OK ->', r2.status);
} catch (e) {
  console.log('  computePrescription(empty debt) ERROR:', e.message);
}

try {
  const r3 = computePrescription({ debt: { id: 'c1', ajuizada: true, dataAjuizamento: '2020-01-01' }, events: [{ type: 'unknown_type', date: '2021-01-01' }] });
  console.log('  computePrescription(unknown event type): OK ->', r3.status);
} catch (e) {
  console.log('  computePrescription(unknown event type) ERROR:', e.message);
}

try {
  const r4 = computeCdaLegalTimeline({ debt: { id: 'c1', inscriptionDate: '2020-01-01' }, events: [] });
  console.log('  computeCdaLegalTimeline(debt without ajuizamento): OK ->', r4.worst);
} catch (e) {
  console.log('  computeCdaLegalTimeline(debt without ajuizamento) ERROR:', e.message);
}

try {
  const r5 = computeDecadencia({ id: 'c1' });
  console.log('  computeDecadencia(minimal debt): OK ->', r5.status);
} catch (e) {
  console.log('  computeDecadencia(minimal debt) ERROR:', e.message);
}

try {
  const r6 = computeOrdinaria({ debt: { id: 'c1' }, events: [] });
  console.log('  computeOrdinaria(minimal debt): OK ->', r6.status);
} catch (e) {
  console.log('  computeOrdinaria(minimal debt) ERROR:', e.message);
}
