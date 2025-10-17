import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import extraction functions
import extraction from './src/services/extraction.js';
const { extractMedications, extractLateRecovery, extractComplications, extractDates } = extraction;

// Enable all Phase 0 feature flags
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; }
  };
}

// Enable all Phase 0 flags
localStorage.setItem('feature_enhanced_demographics', 'true');
localStorage.setItem('feature_enhanced_surgery_dates', 'true');
localStorage.setItem('feature_attending_physician', 'true');
localStorage.setItem('feature_discharge_medications', 'true');
localStorage.setItem('feature_late_recovery_detection', 'true');

// Test Case 1: Standard recovery
const normalRecoveryCase = `
DISCHARGE SUMMARY

Patient Name: John Smith
MRN: 789012
DOB: 05/20/1970
Admission Date: 11/01/2023
Discharge Date: 11/05/2023

HOSPITAL COURSE:
Patient underwent uncomplicated ACDF C5-6 on 11/02/2023. Post-operative course was uneventful.
Patient was extubated in OR and transferred to floor on POD#1. Ambulating well by POD#2.

COMPLICATIONS:
None

MEDICATIONS ON DISCHARGE:
1. Gabapentin 300mg PO TID
2. Flexeril 10mg PO TID PRN
3. Norco 5/325 1-2 tabs PO Q4H PRN pain

DISCHARGE DISPOSITION:
Home with family
`;

// Test Case 2: Late recovery with complications
const lateRecoveryCase = `
DISCHARGE SUMMARY

Patient Name: Mary Johnson
MRN: 345678
DOB: 03/10/1955
Admission Date: 10/01/2023
Discharge Date: 10/28/2023

HOSPITAL COURSE:
Patient underwent right frontal craniotomy for GBM resection on 10/02/2023.
Post-operative course complicated by:
- Severe vasospasm on POD#3 requiring triple-H therapy
- Prolonged intubation with failed extubation attempts
- Tracheostomy placement on POD#14
- Persistent altered mental status requiring 18 days in ICU
- Development of ventilator-associated pneumonia on POD#7
- Acute kidney injury requiring CRRT

Patient showed slow improvement and was eventually transferred to LTAC on POD#26.

COMPLICATIONS:
1. Severe cerebral vasospasm with delayed cerebral ischemia
2. Ventilator-associated pneumonia
3. Acute kidney injury
4. Prolonged mechanical ventilation requiring tracheostomy
5. ICU delirium

MEDICATIONS ON DISCHARGE:
1. Keppra 1000mg PO BID
2. Nimodipine 60mg PO Q4H
3. Dexamethasone 4mg PO Q6H with taper
4. Vancomycin 1g IV Q12H (to complete 14-day course)
5. Multiple other medications per LTAC formulary

DISCHARGE DISPOSITION:
Transfer to long-term acute care facility
`;

console.log('Day 3 Comprehensive Test Suite');
console.log('==============================\n');

// Test medications with deduplication
console.log('TEST 1: Medication Extraction & Deduplication');
console.log('----------------------------------------------');
const meds1 = extractMedications(normalRecoveryCase, {});
console.log(`Normal case: Found ${meds1.data.medications.length} medications`);
meds1.data.medications.forEach(med => {
  console.log(`  - ${med.name || med} ${med.doseWithUnit || ''} ${med.frequency || ''}`);
});

const meds2 = extractMedications(lateRecoveryCase, {});
console.log(`\nLate recovery case: Found ${meds2.data.medications.length} medications`);
meds2.data.medications.forEach(med => {
  console.log(`  - ${med.name || med} ${med.doseWithUnit || ''} ${med.frequency || ''}`);
});

// Test late recovery detection
console.log('\n\nTEST 2: Late Recovery Detection');
console.log('--------------------------------');

const dates1 = extractDates(normalRecoveryCase, []);
const recovery1 = extractLateRecovery(normalRecoveryCase, dates1.data);
console.log(`Normal case:`);
console.log(`  Has late recovery: ${recovery1.hasLateRecovery}`);
console.log(`  Length of stay: ${recovery1.lengthOfStay} days`);
console.log(`  Indicators: ${recovery1.indicators.length}`);

const dates2 = extractDates(lateRecoveryCase, []);
const recovery2 = extractLateRecovery(lateRecoveryCase, dates2.data);
console.log(`\nLate recovery case:`);
console.log(`  Has late recovery: ${recovery2.hasLateRecovery}`);
console.log(`  Length of stay: ${recovery2.lengthOfStay} days`);
console.log(`  Max POD: ${recovery2.maxPOD}`);
console.log(`  Indicators (${recovery2.indicators.length}):`);
recovery2.indicators.forEach(ind => {
  console.log(`    - ${ind.type}: ${ind.value} [${ind.severity}]`);
});

// Test complications with severity grading
console.log('\n\nTEST 3: Complications with Severity Grading');
console.log('--------------------------------------------');

const comp1 = extractComplications(normalRecoveryCase, [], {});
console.log(`Normal case: ${comp1.data.complications.length} complications`);

const comp2 = extractComplications(lateRecoveryCase, [], {});
console.log(`\nLate recovery case: ${comp2.data.complications.length} complications`);
comp2.data.complications.forEach(comp => {
  const severity = comp.severity || {};
  console.log(`  - ${comp.name || comp}`);
  console.log(`    Severity: ${severity.level || 'unknown'}, Resolved: ${severity.resolved || false}`);
  if (comp.onsetDate) console.log(`    Onset: ${comp.onsetDate}`);
});

// Summary
console.log('\n\n========== TEST SUMMARY ==========');

const test1Pass = meds1.data.medications.length === 3 && meds2.data.medications.length >= 5;
const test2Pass = !recovery1.hasLateRecovery && recovery2.hasLateRecovery && recovery2.lengthOfStay === 27;
const test3Pass = comp1.data.complications.length === 0 && comp2.data.complications.length >= 5;

console.log(`✅ Medication deduplication: ${test1Pass ? 'PASS' : 'FAIL'}`);
console.log(`✅ Late recovery detection: ${test2Pass ? 'PASS' : 'FAIL'}`);
console.log(`✅ Complications with severity: ${test3Pass ? 'PASS' : 'FAIL'}`);

const allPass = test1Pass && test2Pass && test3Pass;
console.log(`\nOVERALL: ${allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (!allPass) {
  console.log('\nDebug info:');
  if (!test1Pass) console.log('  - Check medication extraction counts');
  if (!test2Pass) console.log('  - Check late recovery indicators and LOS calculation');
  if (!test3Pass) console.log('  - Check complications extraction and severity grading');
}