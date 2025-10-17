/**
 * Diagnostic script to identify why treatment-outcome pairs are returning 0
 */

import { extractMedicalEntities } from '../src/services/extraction.js';

const sahNote = `
DISCHARGE SUMMARY

Patient: John Doe
Admission Date: March 15, 2024
Discharge Date: April 2, 2024

CHIEF COMPLAINT: Sudden severe headache, altered mental status

HOSPITAL COURSE:

March 15, 2024 (Day 1 - Admission):
- 18:00: Patient transferred to Neuro ICU, started on nimodipine 60mg Q4H for vasospasm prophylaxis
- Modified Fisher Grade 3, Hunt-Hess Grade 2

March 16, 2024 (Day 2):
- 08:00: Patient taken to OR for craniotomy and aneurysm clipping
- 12:00: Surgery completed successfully, aneurysm secured with titanium clip

March 20, 2024 (Day 6):
- 10:00: Patient developed new right-sided weakness (4/5 strength)
- 10:30: TCD showed elevated velocities in left MCA (180 cm/s)
- 11:00: CTA confirmed moderate vasospasm in left MCA

DISCHARGE MEDICATIONS:
1. Nimodipine 60 mg PO Q4H (continue through March 25)
2. Levetiracetam 500 mg PO BID (seizure prophylaxis)

DISCHARGE DIAGNOSIS:
- Aneurysmal subarachnoid hemorrhage, Hunt-Hess 2, Modified Fisher 3
- Delayed cerebral ischemia secondary to vasospasm, resolved
`;

console.log('='.repeat(80));
console.log('TREATMENT RESPONSE DIAGNOSTIC');
console.log('='.repeat(80));

const result = await extractMedicalEntities(sahNote);

console.log('\n1. EXTRACTED DATA STRUCTURE');
console.log('-'.repeat(80));
console.log('\nMedications structure:');
console.log('  extracted.medications:', typeof result.extracted.medications);
console.log('  Keys:', Object.keys(result.extracted.medications || {}));
console.log('  medications.medications:', Array.isArray(result.extracted.medications?.medications) ?
  `Array with ${result.extracted.medications.medications.length} items` :
  typeof result.extracted.medications?.medications);
console.log('  medications.current:', Array.isArray(result.extracted.medications?.current) ?
  `Array with ${result.extracted.medications.current.length} items` :
  typeof result.extracted.medications?.current);
console.log('\nFirst medication (if exists):');
if (result.extracted.medications?.medications?.[0]) {
  console.log('  From medications.medications:', JSON.stringify(result.extracted.medications.medications[0], null, 2));
}
if (result.extracted.medications?.current?.[0]) {
  console.log('  From medications.current:', JSON.stringify(result.extracted.medications.current[0], null, 2));
}

console.log('\nProcedures structure:');
console.log('  extracted.procedures:', typeof result.extracted.procedures);
console.log('  Keys:', Object.keys(result.extracted.procedures || {}));
console.log('  procedures.procedures:', Array.isArray(result.extracted.procedures?.procedures) ?
  `Array with ${result.extracted.procedures.procedures.length} items` :
  typeof result.extracted.procedures?.procedures);
console.log('\nFirst procedure (if exists):');
if (result.extracted.procedures?.procedures?.[0]) {
  console.log('  From procedures.procedures:', JSON.stringify(result.extracted.procedures.procedures[0], null, 2));
}

console.log('\nComplications structure:');
console.log('  extracted.complications:', typeof result.extracted.complications);
console.log('  Keys:', Object.keys(result.extracted.complications || {}));
console.log('  complications.complications:', Array.isArray(result.extracted.complications?.complications) ?
  `Array with ${result.extracted.complications.complications.length} items` :
  typeof result.extracted.complications?.complications);
console.log('\nFirst complication (if exists):');
if (result.extracted.complications?.complications?.[0]) {
  console.log('  From complications.complications:', JSON.stringify(result.extracted.complications.complications[0], null, 2));
}

console.log('\n\n2. TREATMENT RESPONSE TRACKING LOGIC');
console.log('-'.repeat(80));

// Simulate the logic from trackMedicationResponses
console.log('\nSimulating trackMedicationResponses:');
const medicationsList = result.extracted.medications?.current ||
                         result.extracted.medications?.medications ||
                         [];
console.log('  medicationsList length:', medicationsList.length);
console.log('  medicationsList:', JSON.stringify(medicationsList, null, 2));

if (medicationsList.length > 0) {
  console.log('\n  Checking first medication...');
  const med = medicationsList[0];
  const medName = med.name || med;
  console.log('    medName:', medName);
  console.log('    Contains "nimodipine"?', medName?.toLowerCase().includes('nimodipine'));
  console.log('    Contains "levetiracetam"?', medName?.toLowerCase().includes('levetiracetam'));
}

// Simulate the logic from trackProcedureOutcomes
console.log('\nSimulating trackProcedureOutcomes:');
console.log('  procedures?.procedures exists?', !!result.extracted.procedures?.procedures);
if (result.extracted.procedures?.procedures) {
  console.log('  procedures.procedures length:', result.extracted.procedures.procedures.length);
  console.log('  procedures.procedures:', JSON.stringify(result.extracted.procedures.procedures, null, 2));
}

// Check complications
console.log('\nSimulating checkForComplication:');
console.log('  complications?.complications exists?', !!result.extracted.complications?.complications);
if (result.extracted.complications?.complications) {
  console.log('  complications.complications length:', result.extracted.complications.complications.length);
  console.log('  complications.complications:', JSON.stringify(result.extracted.complications.complications, null, 2));
}

console.log('\n\n3. ACTUAL TREATMENT RESPONSE OUTPUT');
console.log('-'.repeat(80));
console.log('Treatment responses:', JSON.stringify(result.clinicalIntelligence?.treatmentResponses, null, 2));

console.log('\n' + '='.repeat(80));
