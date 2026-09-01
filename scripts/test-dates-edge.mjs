import { parseAnyDate, fmtDate, daysUntil, addBusinessDays } from '../src/lib/dates.js';

console.log('Testing parseAnyDate:');
console.log('  5001234-56.2020.4.04.7000 ->', JSON.stringify(parseAnyDate('5001234-56.2020.4.04.7000')));
console.log('  5001234-12-2020 ->', JSON.stringify(parseAnyDate('5001234-12-2020')));
console.log('  2024-05-10 ->', JSON.stringify(parseAnyDate('2024-05-10')));
console.log('  10/05/2024 ->', JSON.stringify(parseAnyDate('10/05/2024')));
console.log('  10/5/24 ->', JSON.stringify(parseAnyDate('10/5/24')));
console.log('  2024-5-1 ->', JSON.stringify(parseAnyDate('2024-5-1')));
console.log('  2024-02-29 ->', JSON.stringify(parseAnyDate('2024-02-29')));
console.log('  2024-02-31 (invalid day) ->', JSON.stringify(parseAnyDate('2024-02-31')));
console.log('  2024-13-40 (invalid month/day) ->', JSON.stringify(parseAnyDate('2024-13-40')));
console.log('  31/02/2024 (invalid BR day) ->', JSON.stringify(parseAnyDate('31/02/2024')));
console.log('  45450 (Excel serial) ->', JSON.stringify(parseAnyDate(45450)));
