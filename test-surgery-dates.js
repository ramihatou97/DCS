import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import extraction service
import extraction from './src/services/extraction.js';
const { extractMedicalEntities } = extraction;

// Enable feature flag for enhanced surgery dates
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; }
  };
}
localStorage.setItem('feature_enhanced_surgery_dates', 'true');

async function test() {
  // Load test case
  const testNotePath = path.join(__dirname, 'test-surgery-note.txt');
  const clinicalNote = fs.readFileSync(testNotePath, 'utf8');

  console.log('Testing Enhanced Surgery Date Extraction');
  console.log('=========================================\n');

  // Extract data
  const result = await extractMedicalEntities([clinicalNote], {
    format: 'text',
    deduplication: { enabled: false }
  });
  const extracted = result.extracted;

  console.log('Surgery/Procedure Information:');
  console.log('-----------------------------');
  console.log('Surgery Date:', extracted.surgeryDate || 'NOT FOUND');
  console.log('Surgery Type:', extracted.surgeryType || 'NOT FOUND');
  console.log('\nRaw Procedures Section:');
  if (extracted.procedures && extracted.procedures.length > 0) {
    extracted.procedures.forEach((proc, idx) => {
      console.log(`  ${idx + 1}. Date: ${proc.date || 'N/A'}, Procedure: ${proc.procedure || 'N/A'}`);
    });
  } else {
    console.log('  No procedures found');
  }

  // Look for specific patterns in the text
  console.log('\n\nSearching for surgery/procedure mentions:');
  console.log('------------------------------------------');

  // Common neurosurgery procedure patterns
  const procedurePatterns = [
    /craniotomy/i,
    /craniectomy/i,
    /EVD placement/i,
    /external ventricular drain/i,
    /ACDF/i,
    /anterior cervical/i,
    /fusion/i,
    /laminectomy/i,
    /tumor resection/i,
    /aneurysm clipping/i
  ];

  // Search for dates near procedures
  const dateNearProcedure = /(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\S]{0,100}(craniotomy|craniectomy|EVD|external ventricular drain|ACDF|anterior cervical|fusion|laminectomy|tumor|aneurysm)/gi;
  const procedureNearDate = /(craniotomy|craniectomy|EVD|external ventricular drain|ACDF|anterior cervical|fusion|laminectomy|tumor|aneurysm)[\s\S]{0,100}(\d{1,2}\/\d{1,2}\/\d{2,4})/gi;

  let matches = [];
  let match;

  while ((match = dateNearProcedure.exec(clinicalNote)) !== null) {
    matches.push(`Date ${match[1]} near "${match[2]}"`);
  }

  while ((match = procedureNearDate.exec(clinicalNote)) !== null) {
    matches.push(`"${match[1]}" near date ${match[2]}`);
  }

  if (matches.length > 0) {
    matches.forEach(m => console.log(`  Found: ${m}`));
  } else {
    console.log('  No date-procedure combinations found');
  }

  // Check for procedure mentions
  console.log('\nProcedure mentions in text:');
  procedurePatterns.forEach(pattern => {
    if (pattern.test(clinicalNote)) {
      console.log(`  ✓ Found: ${pattern.source}`);
    }
  });

  console.log('\n\nGround Truth (from test data):');
  console.log('------------------------------');
  console.log('Expected Surgery Date: 10/15/2023');
  console.log('Expected Surgery Type: Craniotomy for tumor resection');

  // Success check
  const success = extracted.surgeryDate === '10/15/2023';
  console.log('\n' + (success ? '✅ SUCCESS' : '❌ FAILED') + ': Surgery date extraction');
}

// Run test
test().catch(console.error);