import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import extraction functions directly
import extraction from './src/services/extraction.js';
const {
  extractDemographics,
  extractDates,
  extractMedications,
  extractLateRecovery,
  extractComplications,
  extractFunctionalScores
} = extraction;

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

// Load test case
const testNotePath = path.join(__dirname, 'test-surgery-note.txt');
const clinicalNote = fs.readFileSync(testNotePath, 'utf8');

console.log('Phase 0 Pattern-Based Extraction Test');
console.log('=====================================\n');

// Test demographics
const demographics = extractDemographics(clinicalNote);
console.log('Demographics:');
console.log('------------');
console.log(`  Name: ${demographics.data.name || 'NOT FOUND'} ${demographics.data.name === 'Robert Chen' ? '✅' : '❌'}`);
console.log(`  MRN: ${demographics.data.mrn || 'NOT FOUND'} ${demographics.data.mrn === '123456' ? '✅' : '❌'}`);
console.log(`  DOB: ${demographics.data.dob || 'NOT FOUND'} ${demographics.data.dob === '1965-03-15' ? '✅' : '❌'}`);
console.log(`  Attending: ${demographics.data.attendingPhysician || 'NOT FOUND'} ${demographics.data.attendingPhysician?.includes('Johnson') ? '✅' : '❌'}`);

// Test dates
const dates = extractDates(clinicalNote, ['TUMORS']);
console.log('\nDates:');
console.log('------');
console.log(`  Admission: ${dates.data.admissionDate || 'NOT FOUND'} ${dates.data.admissionDate === '2023-10-14' ? '✅' : '❌'}`);
console.log(`  Surgery: ${dates.data.surgeryDate || 'NOT FOUND'} ${dates.data.surgeryDate === '2023-10-15' ? '✅' : '❌'}`);
console.log(`  Discharge: ${dates.data.dischargeDate || 'NOT FOUND'} ${dates.data.dischargeDate === '2023-10-22' ? '✅' : '❌'}`);

// Test medications
const medications = extractMedications(clinicalNote, {});
console.log('\nMedications:');
console.log('------------');
console.log(`  Total: ${medications.data.medications.length} medications`);
const hasKeppra = medications.data.medications.some(m =>
  (m.name || m).toString().toLowerCase().includes('keppra')
);
const hasDex = medications.data.medications.some(m =>
  (m.name || m).toString().toLowerCase().includes('dexamethasone')
);
console.log(`  Has Keppra: ${hasKeppra ? '✅' : '❌'}`);
console.log(`  Has Dexamethasone: ${hasDex ? '✅' : '❌'}`);

// Test late recovery
const lateRecovery = extractLateRecovery(clinicalNote, dates.data);
console.log('\nLate Recovery:');
console.log('--------------');
console.log(`  Has late recovery: ${lateRecovery.hasLateRecovery}`);
console.log(`  Length of stay: ${lateRecovery.lengthOfStay || 'N/A'} days`);

// Test complications
const complications = extractComplications(clinicalNote, ['TUMORS'], {});
console.log('\nComplications:');
console.log('--------------');
console.log(`  Total: ${complications.data.complications.length} complications`);
if (complications.data.complications.length > 0) {
  complications.data.complications.forEach(comp => {
    const severity = comp.severity?.level || 'unknown';
    console.log(`  - ${comp.name || comp} [${severity}]`);
  });
}

// Test functional scores
const functionalScores = extractFunctionalScores(clinicalNote);
console.log('\nFunctional Scores:');
console.log('-----------------');
console.log(`  KPS: ${functionalScores.data.kps || 'NOT FOUND'} ${functionalScores.data.kps === 70 ? '✅' : '❌'}`);
console.log(`  ECOG: ${functionalScores.data.ecog || 'NOT FOUND'} ${functionalScores.data.ecog === 2 ? '✅' : '❌'}`);
console.log(`  mRS: ${functionalScores.data.mRS || 'NOT FOUND'} ${functionalScores.data.mRS === 3 ? '✅' : '❌'}`);

// Calculate accuracy
let correct = 0;
let total = 0;

// Score each field
const scores = [
  demographics.data.name === 'Robert Chen',
  demographics.data.mrn === '123456',
  demographics.data.dob === '1965-03-15',
  demographics.data.attendingPhysician?.includes('Johnson'),
  dates.data.admissionDate === '2023-10-14',
  dates.data.surgeryDate === '2023-10-15',
  dates.data.dischargeDate === '2023-10-22',
  medications.data.medications.length >= 6,
  hasKeppra,
  hasDex,
  !lateRecovery.hasLateRecovery, // Should not have late recovery
  functionalScores.data.kps === 70,
  functionalScores.data.ecog === 2,
  functionalScores.data.mRS === 3
];

correct = scores.filter(s => s).length;
total = scores.length;

const accuracy = ((correct / total) * 100).toFixed(1);

console.log('\n========== RESULTS ==========');
console.log(`Pattern Extraction Accuracy: ${correct}/${total} = ${accuracy}%`);

if (parseFloat(accuracy) >= 85) {
  console.log('\n✅ PHASE 0 SUCCESS: Target accuracy achieved!');
} else {
  console.log(`\n⚠️ Current: ${accuracy}%, Target: 85%`);
  console.log('\nFailed checks:');
  const fieldNames = [
    'Name', 'MRN', 'DOB', 'Attending',
    'Admission Date', 'Surgery Date', 'Discharge Date',
    'Med Count >= 6', 'Has Keppra', 'Has Dex',
    'No Late Recovery', 'KPS', 'ECOG', 'mRS'
  ];
  scores.forEach((passed, idx) => {
    if (!passed) console.log(`  - ${fieldNames[idx]}`);
  });
}