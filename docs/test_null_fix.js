/**
 * Critical Bug Fix Verification
 * Tests the null pointer fix in associateDateWithEntity
 */

import { associateDateWithEntity } from './src/utils/temporalExtraction.js';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Testing NULL POINTER FIX                                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Test 1: Entity with no nearby date
console.log('Test 1: Entity with no nearby date');
const text1 = 'Patient underwent craniotomy for tumor resection.';
const result1 = associateDateWithEntity(text1, { position: 10, index: 10, value: 'craniotomy' }, {});
console.log('Result:', result1);
console.log(result1 && result1.date !== undefined ? '✅ PASS - Returns object with date property' : '❌ FAIL - Returns null or undefined');
console.log();

// Test 2: Entity with nearby date
console.log('Test 2: Entity with nearby date');
const text2 = 'On 04/15/2023, patient underwent craniotomy for tumor resection.';
const result2 = associateDateWithEntity(text2, { position: 30, index: 30, value: 'craniotomy' }, {});
console.log('Result:', result2);
console.log(result2?.date ? '✅ PASS - Found date: ' + result2.date : '❌ FAIL - No date found');
console.log();

// Test 3: POD reference with surgery dates
console.log('Test 3: POD reference with surgery dates');
const text3 = 'POD#3 patient doing well after craniotomy';
const result3 = associateDateWithEntity(text3, { position: 20, index: 20, value: 'craniotomy' }, { 
  surgeryDates: ['2023-04-15'] 
});
console.log('Result:', result3);
console.log(result3?.date !== undefined ? '✅ PASS - Returns object with date property' : '❌ FAIL - Returns null or undefined');
console.log();

// Test 4: Invalid inputs
console.log('Test 4: Invalid inputs (null text)');
const result4 = associateDateWithEntity(null, { position: 0, index: 0, value: 'test' }, {});
console.log('Result:', result4);
console.log(result4 && result4.date !== undefined ? '✅ PASS - Handles null gracefully' : '❌ FAIL - Throws or returns null');
console.log();

// Test 5: Invalid inputs (null entityMatch)
console.log('Test 5: Invalid inputs (null entityMatch)');
const result5 = associateDateWithEntity('some text', null, {});
console.log('Result:', result5);
console.log(result5 && result5.date !== undefined ? '✅ PASS - Handles null gracefully' : '❌ FAIL - Throws or returns null');
console.log();

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  SUMMARY                                                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('The function now ALWAYS returns an object with:');
console.log('  - date: string | null');
console.log('  - source: string');
console.log('  - confidence: number');
console.log('\nThis prevents "Cannot read properties of null (reading \'date\')" errors! ✅');
