import {
  computePrescription,
  computeCdaLegalTimeline,
  computeDecadencia,
  computeOrdinaria,
  buildPrescricaoReport,
  LAUNCH_MODES
} from '../src/lib/prescription.js';

console.log('Testing prescription.js fuzzing & edge cases...');

// Case 1: CDA with negative value or missing fields
const debt1 = { id: 'cda1', value: -100, inscriptionNumber: '123' };
console.log('Case 1 (empty debt):', computePrescription({ debt: debt1 }).status);

// Case 2: Events with start > end or requestDate > date
const debt2 = { id: 'cda2', ajuizada: true, dataAjuizamento: '2020-01-01', processNumber: '5001234' };
const exec2 = { id: 'e1', processNumber: '5001234' };
const events2 = [
  { id: 'ev1', executionId: 'e1', type: 'marco_sem_bens', date: '2020-05-01' },
  { id: 'ev2', executionId: 'e1', type: 'int_penhora', date: '2022-01-01', requestDate: '2023-01-01' } // requestDate AFTER date
];
console.log('Case 2 (requestDate > date):', computePrescription({ debt: debt2, executions: [exec2], events: events2 }).status);

// Case 3: Overlapping suspensions
const events3 = [
  { id: 'ev1', executionId: 'e1', type: 'marco_sem_bens', date: '2020-01-01' },
  { id: 'ev2', executionId: 'e1', type: 'susp_embargos', date: '2021-01-01', endDate: '2022-01-01' },
  { id: 'ev3', executionId: 'e1', type: 'susp_parcelamento', date: '2021-06-01', endDate: '2023-01-01' }
];
console.log('Case 3 (overlapping suspensions):', computePrescription({ debt: debt2, executions: [exec2], events: events3 }).status);

// Case 4: Decadence with all launch modes
Object.keys(LAUNCH_MODES).forEach(mode => {
  const dec = computeDecadencia({
    id: 'cda_dec',
    launchMode: mode,
    taxPeriodEnd: '2015-05-10',
    constitutionDate: '2020-12-01'
  });
  console.log(`Case 4 (launch mode: ${mode}):`, dec.status);
});

// Case 4b: Ordinary prescription with a minimal debt
const ord = computeOrdinaria({ debt: debt1 });
console.log('Case 4b (ordinaria, minimal debt):', ord.status);

// Case 5: Report generation from the legal timeline of one CDA
const timeline2 = computeCdaLegalTimeline({
  debt: debt2,
  executions: [exec2],
  events: events2
});
const report = buildPrescricaoReport({
  debt: debt2,
  timeline: timeline2,
  exec: exec2
});
console.log('Case 5 (report generated):', report ? 'OK (length: ' + report.length + ')' : 'FAIL');
