import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import extraction service functions directly
import extraction from './src/services/extraction.js';
const { extractMedications } = extraction;

// Enable feature flag for discharge medications
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; }
  };
}
localStorage.setItem('feature_discharge_medications', 'true');

// Load test case
const testNotePath = path.join(__dirname, 'test-surgery-note.txt');
const clinicalNote = fs.readFileSync(testNotePath, 'utf8');

console.log('Testing Discharge Medications Extraction');
console.log('========================================\n');

// Test medication extraction
const medications = extractMedications(clinicalNote, {});

console.log('Extracted Medications:');
console.log('---------------------');
if (medications.data.medications && medications.data.medications.length > 0) {
  medications.data.medications.forEach((med, idx) => {
    console.log(`${idx + 1}. ${med.name || med}`);
    if (med.doseWithUnit) console.log(`   Dose: ${med.doseWithUnit}`);
    if (med.frequency) console.log(`   Frequency: ${med.frequency}`);
    if (med.indication) console.log(`   Indication: ${med.indication}`);
    if (med.source) console.log(`   Source: ${med.source}`);
    console.log('');
  });
} else {
  console.log('  No medications found');
}

console.log('\nExpected Discharge Medications:');
console.log('-------------------------------');
const expected = [
  'Keppra 500mg BID',
  'Dexamethasone 4mg Q6H',
  'Omeprazole 20mg daily',
  'Metformin 500mg BID',
  'Lisinopril 10mg daily',
  'Oxycodone 5mg Q4H PRN'
];
expected.forEach((med, idx) => {
  console.log(`${idx + 1}. ${med}`);
});

// Check success
const foundKeppra = medications.data.medications.some(med =>
  med.name && med.name.toLowerCase().includes('keppra')
);
const foundCount = medications.data.medications.length;

console.log('\n' + (foundKeppra ? '✅' : '❌') + ' Found Keppra');
console.log((foundCount >= 6 ? '✅' : '❌') + ` Found ${foundCount}/6 expected medications`);