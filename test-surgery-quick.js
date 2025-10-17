import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import extraction service functions directly
import extraction from './src/services/extraction.js';
const { extractDates, extractProcedures } = extraction;

// Enable feature flag for enhanced surgery dates
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; }
  };
}
localStorage.setItem('feature_enhanced_surgery_dates', 'true');

// Load test case
const testNotePath = path.join(__dirname, 'test-surgery-note.txt');
const clinicalNote = fs.readFileSync(testNotePath, 'utf8');

console.log('Testing Enhanced Surgery Date Extraction');
console.log('=========================================\n');

// Test direct pattern extraction (not LLM)
const dates = extractDates(clinicalNote, ['TUMORS']);
const procedures = extractProcedures(clinicalNote, ['TUMORS']);

console.log('Extracted Dates:');
console.log('---------------');
console.log('Surgery Date (singular):', dates.data.surgeryDate || 'NOT FOUND');
console.log('Surgery Dates (array):', dates.data.surgeryDates.length > 0 ? dates.data.surgeryDates : 'NONE');
console.log('Surgery Type:', dates.data.surgeryType || 'NOT SET');
console.log('Admission Date:', dates.data.admissionDate || 'NOT FOUND');
console.log('Discharge Date:', dates.data.dischargeDate || 'NOT FOUND');

console.log('\nExtracted Procedures:');
console.log('--------------------');
if (procedures.data.procedures && procedures.data.procedures.length > 0) {
  procedures.data.procedures.forEach((proc, idx) => {
    console.log(`  ${idx + 1}. Date: ${proc.date || 'N/A'}, Procedure: ${proc.procedure || 'N/A'}`);
  });
} else {
  console.log('  No procedures found');
}

// Look for specific patterns in the text
console.log('\nDirect Pattern Search:');
console.log('---------------------');
const surgeryMatch = clinicalNote.match(/craniotomy.*?on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
if (surgeryMatch) {
  console.log('  Found craniotomy on:', surgeryMatch[1]);
}

const evdMatch = clinicalNote.match(/EVD.*?(\d{1,2}\/\d{1,2}\/\d{4})/i);
if (evdMatch) {
  console.log('  Found EVD on:', evdMatch[1]);
}

console.log('\nGround Truth:');
console.log('-------------');
console.log('Expected Surgery Date: 10/15/2023');
console.log('Expected Surgery Type: Craniotomy for tumor resection');

// Success check
const success = dates.data.surgeryDate === '2023-10-15' || dates.data.surgeryDate === '10/15/2023';
console.log('\n' + (success ? '✅ SUCCESS' : '❌ FAILED') + ': Surgery date extraction');
console.log('Date format:', dates.data.surgeryDate);