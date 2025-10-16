/**
 * Debug test for POD resolution
 */

import { resolveRelativeDate } from './src/utils/temporalExtraction.js';
import { normalizeDate } from './src/utils/dateUtils.js';

console.log('Testing POD Resolution...\n');

// Test the normalizeDate function first
console.log('1. Testing normalizeDate function:');
const testDate = new Date('2024-10-01');
console.log(`   Input: ${testDate}`);
const normalized = normalizeDate(testDate);
console.log(`   Normalized: ${normalized}`);
console.log(`   Type: ${typeof normalized}\n`);

// Test POD resolution
console.log('2. Testing resolveRelativeDate:');

const test1 = {
  relativeRef: { type: 'pod', value: 3, pod: 3 },
  referenceDates: { firstProcedure: '2024-10-01' }
};

console.log('   Input:');
console.log(`     relativeRef:`, test1.relativeRef);
console.log(`     referenceDates:`, test1.referenceDates);

const result1 = resolveRelativeDate(test1.relativeRef, test1.referenceDates);
console.log(`   Result: ${result1}`);
console.log(`   Expected: 2024-10-04\n`);

// Test with admission date
const test2 = {
  relativeRef: { type: 'pod', value: 7, pod: 7 },
  referenceDates: { admission: '2024-09-25' }
};

console.log('3. Testing with admission date:');
console.log(`   relativeRef:`, test2.relativeRef);
console.log(`   referenceDates:`, test2.referenceDates);

const result2 = resolveRelativeDate(test2.relativeRef, test2.referenceDates);
console.log(`   Result: ${result2}`);
console.log(`   Expected: 2024-10-02\n`);
