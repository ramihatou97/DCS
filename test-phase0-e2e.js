import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import extraction service
import { extractMedicalEntities } from './src/services/extraction.js';

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

console.log('Phase 0 End-to-End Test');
console.log('=======================\n');

async function runTest() {
  const result = await extractMedicalEntities([clinicalNote], {
    format: 'text',
    deduplication: { enabled: true },
    targets: [
      'demographics', 'dates', 'pathology', 'presentingSymptoms',
      'procedures', 'complications', 'medications', 'imaging',
      'functionalScores', 'lateRecovery', 'followUp', 'discharge'
    ]
  });

  const extracted = result.extracted;

  console.log('Demographics:');
  console.log('------------');
  console.log(`  Name: ${extracted.demographics?.name || 'NOT FOUND'} ${extracted.demographics?.name === 'Robert Chen' ? '✅' : '❌'}`);
  console.log(`  MRN: ${extracted.demographics?.mrn || 'NOT FOUND'} ${extracted.demographics?.mrn === '123456' ? '✅' : '❌'}`);
  console.log(`  DOB: ${extracted.demographics?.dob || 'NOT FOUND'} ${extracted.demographics?.dob === '1965-03-15' ? '✅' : '❌'}`);
  console.log(`  Age: ${extracted.demographics?.age || 'NOT FOUND'} ${extracted.demographics?.age === 58 ? '✅' : '❌'}`);
  console.log(`  Gender: ${extracted.demographics?.gender || 'NOT FOUND'} ${extracted.demographics?.gender === 'M' ? '✅' : '❌'}`);
  console.log(`  Attending: ${extracted.demographics?.attendingPhysician || 'NOT FOUND'} ${extracted.demographics?.attendingPhysician?.includes('Johnson') ? '✅' : '❌'}`);

  console.log('\nDates:');
  console.log('------');
  console.log(`  Admission: ${extracted.dates?.admissionDate || 'NOT FOUND'} ${extracted.dates?.admissionDate === '2023-10-14' ? '✅' : '❌'}`);
  console.log(`  Surgery: ${extracted.dates?.surgeryDate || 'NOT FOUND'} ${extracted.dates?.surgeryDate === '2023-10-15' ? '✅' : '❌'}`);
  console.log(`  Discharge: ${extracted.dates?.dischargeDate || 'NOT FOUND'} ${extracted.dates?.dischargeDate === '2023-10-22' ? '✅' : '❌'}`);

  console.log('\nPathology:');
  console.log('----------');
  console.log(`  Primary: ${extracted.pathology?.primaryDiagnosis || extracted.pathology?.primary || 'NOT FOUND'}`);
  console.log(`  WHO Grade: ${extracted.pathology?.subtype?.whoGrade || extracted.pathology?.grades?.who || 'NOT FOUND'}`);

  console.log('\nProcedures:');
  console.log('-----------');
  if (extracted.procedures?.procedures?.length > 0) {
    extracted.procedures.procedures.slice(0, 3).forEach(proc => {
      console.log(`  - ${proc.date || 'N/A'}: ${proc.procedure || proc.name || proc}`);
    });
  } else {
    console.log('  No procedures found');
  }

  console.log('\nMedications:');
  console.log('------------');
  const medCount = extracted.medications?.medications?.length || 0;
  console.log(`  Total: ${medCount} medications ${medCount >= 6 ? '✅' : '❌'}`);
  if (medCount > 0) {
    const hasKeppra = extracted.medications.medications.some(m =>
      (m.name || m).toString().toLowerCase().includes('keppra')
    );
    const hasDex = extracted.medications.medications.some(m =>
      (m.name || m).toString().toLowerCase().includes('dexamethasone')
    );
    console.log(`  Has Keppra: ${hasKeppra ? '✅' : '❌'}`);
    console.log(`  Has Dexamethasone: ${hasDex ? '✅' : '❌'}`);
  }

  console.log('\nComplications:');
  console.log('--------------');
  const compCount = extracted.complications?.complications?.length || 0;
  console.log(`  Total: ${compCount} complications`);
  if (compCount > 0) {
    extracted.complications.complications.forEach(comp => {
      const severity = comp.severity?.level || 'unknown';
      console.log(`  - ${comp.name || comp} [${severity}]`);
    });
  }

  console.log('\nLate Recovery:');
  console.log('--------------');
  if (extracted.lateRecovery) {
    console.log(`  Has late recovery: ${extracted.lateRecovery.hasLateRecovery || false}`);
    console.log(`  Length of stay: ${extracted.lateRecovery.lengthOfStay || 'N/A'} days`);
    console.log(`  Indicators: ${extracted.lateRecovery.indicators?.length || 0}`);
  } else {
    console.log('  Not assessed');
  }

  console.log('\nFunctional Status:');
  console.log('-----------------');
  console.log(`  KPS: ${extracted.functionalScores?.kps || 'NOT FOUND'} ${extracted.functionalScores?.kps === 70 ? '✅' : '❌'}`);
  console.log(`  ECOG: ${extracted.functionalScores?.ecog || 'NOT FOUND'} ${extracted.functionalScores?.ecog === 2 ? '✅' : '❌'}`);
  console.log(`  mRS: ${extracted.functionalScores?.mRS || 'NOT FOUND'} ${extracted.functionalScores?.mRS === 3 ? '✅' : '❌'}`);

  // Calculate score
  let correct = 0;
  let total = 0;

  // Demographics (6 fields)
  if (extracted.demographics?.name === 'Robert Chen') correct++;
  total++;
  if (extracted.demographics?.mrn === '123456') correct++;
  total++;
  if (extracted.demographics?.dob === '1965-03-15') correct++;
  total++;
  if (extracted.demographics?.age === 58) correct++;
  total++;
  if (extracted.demographics?.gender === 'M') correct++;
  total++;
  if (extracted.demographics?.attendingPhysician?.includes('Johnson')) correct++;
  total++;

  // Dates (3 fields)
  if (extracted.dates?.admissionDate === '2023-10-14') correct++;
  total++;
  if (extracted.dates?.surgeryDate === '2023-10-15') correct++;
  total++;
  if (extracted.dates?.dischargeDate === '2023-10-22') correct++;
  total++;

  // Medications (2 checks)
  if (medCount >= 6) correct++;
  total++;
  if (extracted.medications?.medications?.some(m => (m.name || m).toString().toLowerCase().includes('keppra'))) correct++;
  total++;

  // Functional scores (3 fields)
  if (extracted.functionalScores?.kps === 70) correct++;
  total++;
  if (extracted.functionalScores?.ecog === 2) correct++;
  total++;
  if (extracted.functionalScores?.mRS === 3) correct++;
  total++;

  const accuracy = ((correct / total) * 100).toFixed(1);

  console.log('\n\n========== RESULTS ==========');
  console.log(`Accuracy: ${correct}/${total} = ${accuracy}%`);
  console.log(`Quality Score: ${(result.qualityMetrics?.overallScore * 100).toFixed(1)}%` || 'N/A');

  if (parseFloat(accuracy) >= 85) {
    console.log('\n✅ TARGET ACHIEVED: Phase 0 improvements successful!');
  } else {
    console.log(`\n⚠️ Current: ${accuracy}%, Target: 85%`);
  }
}

runTest().catch(console.error);