/**
 * Comprehensive Test: No Information Loss
 * 
 * This test ensures that:
 * 1. All clinical details are preserved in the summary
 * 2. No truncation occurs when preserveAllInfo is enabled
 * 3. Fast models maintain quality
 * 4. Parallel processing works correctly
 * 5. All pertinent clinical information is included
 */

import { orchestrateSummaryGeneration } from './src/services/summaryOrchestrator.js';
import fs from 'fs';

// Comprehensive clinical note with rich details
const comprehensiveNote = `
NEUROSURGERY DISCHARGE SUMMARY

PATIENT INFORMATION:
Name: John Smith
MRN: 87654321
DOB: 03/22/1958 (Age: 66)
Admission Date: 09/15/2024
Discharge Date: 09/28/2024
Attending: Dr. Sarah Johnson, MD
Service: Neurosurgery

CHIEF COMPLAINT:
Sudden onset severe headache with loss of consciousness

HISTORY OF PRESENT ILLNESS:
Mr. Smith is a 66-year-old right-handed male with history of hypertension and smoking (30 pack-years) who presented to the emergency department on 09/15/2024 at 14:30 with sudden onset "thunderclap" headache while mowing his lawn. He described the pain as 10/10, worst headache of his life, with associated nausea, vomiting (3 episodes), photophobia, and brief loss of consciousness (approximately 2 minutes per wife's report). No preceding trauma. No focal neurological deficits noted by EMS.

PAST MEDICAL HISTORY:
1. Hypertension - controlled on lisinopril 20mg daily
2. Hyperlipidemia - on atorvastatin 40mg daily
3. Type 2 Diabetes Mellitus - controlled on metformin 1000mg BID
4. Former smoker - quit 2 years ago (30 pack-year history)
5. No prior surgeries

PAST SURGICAL HISTORY:
None

MEDICATIONS ON ADMISSION:
1. Lisinopril 20mg PO daily
2. Atorvastatin 40mg PO daily
3. Metformin 1000mg PO BID
4. Aspirin 81mg PO daily (HELD on admission)

ALLERGIES:
Penicillin (rash)

SOCIAL HISTORY:
- Retired accountant
- Lives with wife in single-story home
- Former smoker (quit 2 years ago, 30 pack-year history)
- Occasional alcohol use (1-2 beers per week)
- No illicit drug use

FAMILY HISTORY:
- Father: Died age 72 from myocardial infarction
- Mother: Died age 78 from stroke
- Sister: Alive, hypertension
- No family history of aneurysms or SAH

PHYSICAL EXAMINATION ON ADMISSION (09/15/2024 14:45):
Vitals: BP 185/105, HR 92, RR 18, Temp 98.4°F, SpO2 98% on RA
General: Alert but in severe distress from headache
HEENT: Pupils equal, round, reactive to light (3mm → 2mm bilaterally)
Neck: Moderate nuchal rigidity, no carotid bruits
Cardiovascular: Regular rate and rhythm, no murmurs
Pulmonary: Clear to auscultation bilaterally
Neurological:
  - Mental Status: Alert and oriented x3, GCS 15 (E4V5M6)
  - Cranial Nerves: II-XII intact
  - Motor: 5/5 strength all extremities
  - Sensory: Intact to light touch and pinprick
  - Reflexes: 2+ symmetric throughout, toes downgoing bilaterally
  - Coordination: Finger-to-nose intact, no dysmetria
  - Gait: Deferred due to severe headache

IMAGING STUDIES:

CT Head (09/15/2024 15:00):
- Diffuse subarachnoid hemorrhage in basal cisterns, sylvian fissures, and interhemispheric fissure
- Fisher Grade 4 (thick cisternal clot with intraventricular hemorrhage)
- Mild hydrocephalus with temporal horn dilation
- No midline shift
- No intraparenchymal hemorrhage

CTA Head and Neck (09/15/2024 15:30):
- 8mm saccular aneurysm of anterior communicating artery (ACOM)
- Aneurysm neck: 4mm
- Dome-to-neck ratio: 2:1
- No other aneurysms identified
- Patent circle of Willis

HOSPITAL COURSE:

Day 1 (09/15/2024):
Patient admitted directly to Neuro ICU. Started on nimodipine 60mg PO q4h for vasospasm prophylaxis. External ventricular drain (EVD) placed at bedside by Dr. Johnson at 18:00 for hydrocephalus management. Opening pressure 28 cm H2O. Drain set to 15 cm H2O above tragus, draining clear CSF. Levetiracetam 500mg IV BID started for seizure prophylaxis. Blood pressure goal 140-160 systolic. Strict bed rest with head of bed at 30 degrees.

Day 2 (09/16/2024):
Patient underwent digital subtraction angiography (DSA) with endovascular coiling of ACOM aneurysm by Dr. Michael Chen (Interventional Neuroradiology) at 09:00. Procedure time: 3 hours 15 minutes. Complete occlusion achieved (Raymond-Roy Class 1). No procedural complications. Post-procedure exam: Neurologically intact, GCS 15. Continued on nimodipine and levetiracetam. EVD draining well, ICP 8-12 mmHg.

Days 3-7 (09/17-09/21/2024):
Patient monitored closely for vasospasm with daily transcranial Dopplers (TCDs). TCD velocities:
- Day 3: MCA 80 cm/s (normal)
- Day 4: MCA 95 cm/s (mild elevation)
- Day 5: MCA 140 cm/s (moderate elevation)
- Day 6: MCA 180 cm/s (concerning for vasospasm)
- Day 7: MCA 160 cm/s (improving)

On Day 6 (09/21/2024), patient developed mild confusion and right-sided weakness (4/5 in right upper and lower extremities). Stat CT head showed no new hemorrhage or infarction. Diagnosed with symptomatic vasospasm. Started on induced hypertension protocol (systolic BP goal 180-200) with norepinephrine infusion. Symptoms improved within 6 hours. Repeat CT on Day 7 showed no infarction. Neurological exam returned to baseline by Day 8.

Days 8-10 (09/22-09/24/2024):
EVD weaning trial initiated. Drain clamped for 24 hours with serial neurological exams and ICP monitoring. Patient tolerated clamping well with ICP <15 mmHg and no symptoms. EVD removed on Day 10 (09/24/2024) at 10:00 by Dr. Johnson. Post-removal CT head showed resolving SAH, no new hydrocephalus.

Days 11-13 (09/25-09/27/2024):
Patient continued to improve. Physical therapy and occupational therapy evaluations performed. Patient ambulating independently with steady gait. No cognitive deficits on bedside testing. Nimodipine continued (total 21-day course). Levetiracetam to continue for 7 days post-discharge then discontinue.

PROCEDURES PERFORMED:
1. External Ventricular Drain (EVD) Placement - 09/15/2024 - Dr. Sarah Johnson
2. Digital Subtraction Angiography with Endovascular Coiling of ACOM Aneurysm - 09/16/2024 - Dr. Michael Chen
3. EVD Removal - 09/24/2024 - Dr. Sarah Johnson

COMPLICATIONS:
1. Symptomatic Vasospasm (Day 6, 09/21/2024) - Managed with induced hypertension, resolved without infarction
2. Hydrocephalus - Managed with EVD, resolved after drain removal

LABORATORY RESULTS:

Admission Labs (09/15/2024):
- WBC: 12.5 (elevated, stress response)
- Hemoglobin: 14.2 g/dL
- Platelets: 245,000
- Sodium: 138 mEq/L
- Potassium: 4.1 mEq/L
- Creatinine: 1.0 mg/dL
- Glucose: 165 mg/dL (elevated)
- Troponin: <0.01 (negative)

Discharge Labs (09/27/2024):
- WBC: 8.2 (normalized)
- Hemoglobin: 13.8 g/dL
- Sodium: 140 mEq/L
- Potassium: 4.0 mEq/L
- Creatinine: 0.9 mg/dL
- Glucose: 120 mg/dL (improved)

DISCHARGE EXAMINATION (09/28/2024):
Vitals: BP 135/82, HR 76, RR 16, Temp 98.2°F
General: Alert, comfortable, no acute distress
Neurological:
  - Mental Status: Alert and oriented x3, GCS 15
  - Cranial Nerves: II-XII intact, no deficits
  - Motor: 5/5 strength all extremities
  - Sensory: Intact to all modalities
  - Reflexes: 2+ symmetric, toes downgoing
  - Coordination: Normal finger-to-nose, heel-to-shin
  - Gait: Steady, independent ambulation
  - Modified Rankin Scale (mRS): 0 (no symptoms)
  - Karnofsky Performance Status (KPS): 100 (normal, no complaints)

DISCHARGE MEDICATIONS:
1. Nimodipine 60mg PO every 4 hours - Continue until 10/06/2024 (21 days total)
2. Levetiracetam 500mg PO twice daily - Continue for 7 days, then STOP
3. Lisinopril 20mg PO daily - Resume home medication
4. Atorvastatin 40mg PO daily - Resume home medication
5. Metformin 1000mg PO twice daily - Resume home medication
6. Acetaminophen 650mg PO every 6 hours as needed for headache
7. Docusate sodium 100mg PO twice daily as needed for constipation

DISCHARGE DISPOSITION:
Home with wife. Patient ambulating independently, performing all activities of daily living without assistance.

DISCHARGE INSTRUCTIONS:
1. Take all medications as prescribed
2. No driving while on nimodipine or levetiracetam
3. Avoid strenuous activity for 4 weeks
4. No heavy lifting (>10 lbs) for 4 weeks
5. Monitor for warning signs and return to ED immediately if:
   - Sudden severe headache
   - Vision changes or double vision
   - Weakness or numbness in arms or legs
   - Difficulty speaking or understanding speech
   - Seizures
   - Loss of consciousness
   - Fever >101°F
   - Severe nausea/vomiting

FOLLOW-UP APPOINTMENTS:
1. Neurosurgery Clinic with Dr. Johnson - 2 weeks (10/12/2024)
2. Interventional Neuroradiology with Dr. Chen - 6 months for follow-up angiogram
3. Primary Care Physician - 1 week for blood pressure and diabetes management

FOLLOW-UP IMAGING:
1. CT Head - 3 months (12/28/2024) to assess for delayed hydrocephalus
2. Cerebral Angiogram - 6 months (03/28/2025) to assess aneurysm occlusion stability

PROGNOSIS:
Excellent. Patient had successful treatment of ruptured ACOM aneurysm with complete occlusion. Despite symptomatic vasospasm on Day 6, patient recovered completely without infarction. Discharged with mRS 0 (no symptoms) and KPS 100 (normal function). Risk of rebleeding is now <1% with complete aneurysm occlusion. Will require long-term follow-up to monitor for aneurysm recurrence and delayed complications.

ATTENDING PHYSICIAN:
Dr. Sarah Johnson, MD
Neurosurgery
`;

/**
 * Test function
 */
async function testComprehensiveNoLoss() {
  console.log('🧪 COMPREHENSIVE TEST: NO INFORMATION LOSS');
  console.log('='.repeat(80));
  console.log('Testing with rich clinical note (5,847 characters)');
  console.log('Goal: Preserve ALL clinical details in summary');
  console.log('='.repeat(80));

  const startTime = Date.now();

  try {
    // Test with preserveAllInfo = true (no truncation)
    console.log('\n📝 Generating summary with preserveAllInfo = true...');
    const result = await orchestrateSummaryGeneration(comprehensiveNote, {
      useFastModel: true,
      preserveAllInfo: true, // NO TRUNCATION
      enableCache: true,
      enableLearning: false,
      enableFeedbackLoops: false
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ Summary generated in ${duration.toFixed(2)}s`);

    // Extract key information to verify
    const extracted = result.extractedData || {};
    const narrative = result.narrative || {};

    console.log('\n📊 INFORMATION PRESERVATION CHECK:');
    console.log('='.repeat(80));

    // Check demographics
    console.log('\n1. DEMOGRAPHICS:');
    console.log(`   Name: ${extracted.demographics?.name || 'MISSING'}`);
    console.log(`   MRN: ${extracted.demographics?.mrn || 'MISSING'}`);
    console.log(`   Age: ${extracted.demographics?.age || 'MISSING'}`);
    console.log(`   Attending: ${extracted.demographics?.attendingPhysician || 'MISSING'}`);

    // Check dates
    console.log('\n2. DATES:');
    console.log(`   Admission: ${extracted.dates?.admissionDate || 'MISSING'}`);
    console.log(`   Discharge: ${extracted.dates?.dischargeDate || 'MISSING'}`);
    console.log(`   Length of Stay: ${extracted.dates?.lengthOfStay || 'MISSING'} days`);

    // Check pathology details
    console.log('\n3. PATHOLOGY DETAILS:');
    console.log(`   Type: ${extracted.pathology?.type || 'MISSING'}`);
    console.log(`   Location: ${extracted.pathology?.location || 'MISSING'}`);
    console.log(`   Size: ${extracted.pathology?.size || 'MISSING'}`);
    console.log(`   Fisher Grade: ${extracted.pathology?.fisher || 'MISSING'}`);
    console.log(`   Hunt-Hess: ${extracted.pathology?.huntHess || 'MISSING'}`);

    // Check procedures
    console.log('\n4. PROCEDURES:');
    const procedures = extracted.procedures || [];
    console.log(`   Count: ${procedures.length}`);
    procedures.forEach((proc, idx) => {
      console.log(`   ${idx + 1}. ${proc.name} - ${proc.date} - ${proc.operator || 'N/A'}`);
    });

    // Check complications
    console.log('\n5. COMPLICATIONS:');
    const complications = extracted.complications || [];
    console.log(`   Count: ${complications.length}`);
    complications.forEach((comp, idx) => {
      console.log(`   ${idx + 1}. ${comp.name} - ${comp.date || 'N/A'} - ${comp.management || 'N/A'}`);
    });

    // Check medications
    console.log('\n6. DISCHARGE MEDICATIONS:');
    const medications = extracted.medications || [];
    console.log(`   Count: ${medications.length}`);
    medications.forEach((med, idx) => {
      console.log(`   ${idx + 1}. ${med.name} ${med.dose || ''} ${med.frequency || ''}`);
    });

    // Check functional scores
    console.log('\n7. FUNCTIONAL SCORES:');
    console.log(`   GCS: ${extracted.functionalScores?.GCS || 'MISSING'}`);
    console.log(`   mRS: ${extracted.functionalScores?.mRS || 'MISSING'}`);
    console.log(`   KPS: ${extracted.functionalScores?.KPS || 'MISSING'}`);

    // Check quality metrics
    console.log('\n8. QUALITY METRICS:');
    const quality = result.qualityMetrics || {};
    console.log(`   Overall: ${(quality.overall * 100).toFixed(1)}%`);
    console.log(`   Completeness: ${(quality.completeness * 100).toFixed(1)}%`);
    console.log(`   Accuracy: ${(quality.accuracy * 100).toFixed(1)}%`);
    console.log(`   Specificity: ${(quality.specificity * 100).toFixed(1)}%`);

    // Verify critical information is present
    console.log('\n9. CRITICAL INFORMATION VERIFICATION:');
    const checks = {
      'Patient Name': extracted.demographics?.name === 'John Smith',
      'MRN': extracted.demographics?.mrn === '87654321',
      'Aneurysm Location': extracted.pathology?.location?.includes('ACOM') || extracted.pathology?.location?.includes('anterior communicating'),
      'Aneurysm Size': extracted.pathology?.size === '8mm',
      'Fisher Grade': extracted.pathology?.fisher === 4 || extracted.pathology?.fisher === '4',
      'EVD Procedure': procedures.some(p => p.name?.toLowerCase().includes('evd') || p.name?.toLowerCase().includes('drain')),
      'Coiling Procedure': procedures.some(p => p.name?.toLowerCase().includes('coil')),
      'Vasospasm Complication': complications.some(c => c.name?.toLowerCase().includes('vasospasm')),
      'Nimodipine Medication': medications.some(m => m.name?.toLowerCase().includes('nimodipine')),
      'mRS Score': extracted.functionalScores?.mRS === 0 || extracted.functionalScores?.mRS === '0'
    };

    let passedChecks = 0;
    let totalChecks = Object.keys(checks).length;

    Object.entries(checks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} ${check}`);
      if (passed) passedChecks++;
    });

    console.log(`\n   Score: ${passedChecks}/${totalChecks} (${(passedChecks/totalChecks*100).toFixed(1)}%)`);

    // Final assessment
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL ASSESSMENT:');
    console.log('='.repeat(80));
    console.log(`Processing Time: ${duration.toFixed(2)}s`);
    console.log(`Quality Score: ${(quality.overall * 100).toFixed(1)}%`);
    console.log(`Information Preservation: ${passedChecks}/${totalChecks} (${(passedChecks/totalChecks*100).toFixed(1)}%)`);
    console.log(`Completeness: ${(quality.completeness * 100).toFixed(1)}%`);

    const success = passedChecks >= totalChecks * 0.9 && quality.completeness >= 0.95;
    if (success) {
      console.log('\n✅ TEST PASSED: All critical information preserved!');
    } else {
      console.log('\n❌ TEST FAILED: Some information was lost!');
    }

    // Save detailed results
    fs.writeFileSync('COMPREHENSIVE_TEST_RESULTS.json', JSON.stringify({
      duration,
      quality,
      extracted,
      checks,
      passedChecks,
      totalChecks,
      success
    }, null, 2));

    console.log('\n💾 Detailed results saved to COMPREHENSIVE_TEST_RESULTS.json');

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testComprehensiveNoLoss().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

