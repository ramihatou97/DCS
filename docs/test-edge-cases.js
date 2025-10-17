/**
 * Edge Case Test Suite for DCS
 *
 * Tests system robustness against:
 * - Concurrent events
 * - Missing dates
 * - Malformed data
 * - Boundary cases
 * - Extreme values
 * - Data quality issues
 *
 * Each test verifies graceful degradation (no crashes) and reasonable fallbacks
 */

import { orchestrateSummaryGeneration } from '../src/services/summaryOrchestrator.js';

// ========================================
// CATEGORY 1: CONCURRENT EVENTS
// ========================================

/**
 * Edge Case 1: Multiple procedures on same date
 * Tests: Timeline deduplication, chronological ordering
 */
const edgeCase1_ConcurrentProcedures = `
ADMISSION NOTE - 01/15/2025

58F admitted with acute SDH after fall. Emergency craniotomy performed same day.
Also underwent ICP monitor placement and EVD insertion during same procedure.

OPERATIVE NOTE - 01/15/2025
1. Right frontoparietal craniotomy for SDH evacuation
2. ICP monitor placement
3. EVD insertion

All procedures completed successfully.

DISCHARGE NOTE - 01/25/2025
Patient recovered well. Discharged home.
`;

/**
 * Edge Case 2: Complication during procedure
 * Tests: Temporal linking, cause-effect relationships
 */
const edgeCase2_ComplicationDuringProcedure = `
ADMISSION: 02/10/2025
67M with GBM scheduled for resection.

OPERATIVE NOTE - 02/11/2025:
Left temporal craniotomy initiated. During tumor resection, patient developed
significant intraoperative hemorrhage requiring emergency management.
Blood loss 800mL. Procedure completed successfully after hemostasis achieved.

DISCHARGE: 02/20/2025
Patient stable, discharged to rehab.
`;

/**
 * Edge Case 3: Same-day medication changes
 * Tests: Medication timeline tracking
 */
const edgeCase3_SameDayMedicationChanges = `
ADMISSION: 03/01/2025
Patient admitted with seizures.

DAILY NOTE - 03/02/2025:
08:00 - Started levetiracetam 500mg BID
14:00 - Seizure activity observed
14:30 - Levetiracetam increased to 1000mg BID
20:00 - Added lacosamide 100mg BID

DISCHARGE: 03/10/2025
Seizure-free on dual therapy.
`;

// ========================================
// CATEGORY 2: MISSING DATES
// ========================================

/**
 * Edge Case 4: Missing admission date
 * Tests: Date inference, graceful degradation
 */
const edgeCase4_MissingAdmissionDate = `
ADMISSION NOTE

72M with SAH from ruptured aneurysm. Hunt-Hess 3.

Angiogram performed, showed PCOM aneurysm.
Endovascular coiling completed successfully.

POD 3: Developed vasospasm, started triple-H therapy.
POD 7: Vasospasm resolved.
POD 10: Discharged to rehab.

DISCHARGE SUMMARY
Patient recovered well from SAH and coiling procedure.
`;

/**
 * Edge Case 5: Only relative dates (POD references)
 * Tests: Relative date resolution
 */
const edgeCase5_OnlyRelativeDates = `
OPERATIVE NOTE
Patient underwent L4-L5 laminectomy and fusion.

POD 1: Mobilized with PT
POD 2: Pain controlled, advancing diet
POD 3: Ambulating with walker
POD 5: Discharged home

No specific dates documented.
`;

/**
 * Edge Case 6: Contradictory dates
 * Tests: Data validation, conflict resolution
 */
const edgeCase6_ContradictoryDates = `
ADMISSION: 04/01/2025
Patient admitted for elective VP shunt revision.

OPERATIVE NOTE - 03/30/2025
VP shunt revised successfully. [DATE BEFORE ADMISSION]

DISCHARGE: 04/05/2025
Patient doing well.
`;

// ========================================
// CATEGORY 3: MALFORMED DATA
// ========================================

/**
 * Edge Case 7: Missing demographics
 * Tests: Template fallbacks for missing patient info
 */
const edgeCase7_MissingDemographics = `
ADMISSION NOTE

Patient admitted with ICH.

CT shows 30cc left basal ganglia hemorrhage.

HOSPITAL COURSE:
Conservative management. BP control.

DISCHARGE:
Neurologically stable. To rehab.
`;

/**
 * Edge Case 8: Incomplete pathology information
 * Tests: Pathology inference, general fallbacks
 */
const edgeCase8_IncompletePathology = `
ADMISSION: 05/01/2025
52F admitted with neurological symptoms.

CT and MRI performed.
Treatment initiated.

DISCHARGE: 05/10/2025
Patient improved significantly.
Discharged with medications.
`;

/**
 * Edge Case 9: Empty/null fields
 * Tests: Null safety, default values
 */
const edgeCase9_EmptyFields = `
ADMISSION:

HOSPITAL COURSE:


DISCHARGE:

`;

/**
 * Edge Case 10: Truncated/corrupted text
 * Tests: Parsing robustness
 */
const edgeCase10_TruncatedText = `
ADMISSION NOTE - 06/01/2025

45M with SAH Hunt-Hess 3. Adm

[Text appears corrupted or truncated]

...ood recovery.

DISCHARGE: 06/15/2025
Patient discharged to
`;

// ========================================
// CATEGORY 4: BOUNDARY CASES
// ========================================

/**
 * Edge Case 11: Very short stay (<24 hours)
 * Tests: Brief hospitalization handling
 */
const edgeCase11_ShortStay = `
EMERGENCY NOTE - 07/01/2025 08:00

35M brought in with brief LOC after MVA. GCS 15 on arrival.

CT head negative for acute pathology.
Neuro exam normal.

DISCHARGE - 07/01/2025 20:00
Observed for 12 hours. Neurologically intact. Discharged home same day.
`;

/**
 * Edge Case 12: Very long stay (>90 days)
 * Tests: Extended timeline management
 */
const edgeCase12_LongStay = `
ADMISSION: 08/01/2025

28M with severe TBI after motorcycle accident. GCS 4.

Underwent decompressive craniectomy, prolonged ICU course.
Multiple complications: VAP, sepsis, DVT.

POD 30: Tracheostomy and PEG placement
POD 60: Cranioplasty
POD 90: Significant neurological recovery

DISCHARGE: 11/05/2025 (96 days post-admission)
Discharged to long-term acute care facility.
`;

/**
 * Edge Case 13: Patient expired
 * Tests: Death documentation, sensitive language
 */
const edgeCase13_PatientExpired = `
ADMISSION: 09/01/2025

82F with massive hemorrhagic stroke. GCS 3 on arrival.

Family meeting held. Goals of care discussion.
Transitioned to comfort measures.

FINAL NOTE - 09/03/2025:
Patient expired peacefully with family at bedside.

Time of death: 09/03/2025 14:32
`;

/**
 * Edge Case 14: Left Against Medical Advice (AMA)
 * Tests: AMA documentation
 */
const edgeCase14_LeftAMA = `
ADMISSION: 10/01/2025

42M with subdural hematoma. Recommended surgical evacuation.

Patient refused surgery despite counseling on risks.

AMA NOTE - 10/02/2025:
Patient insists on leaving against medical advice.
Explained risks: herniation, death, permanent disability.
Capacity assessment: patient has decision-making capacity.

Patient left AMA at 15:00.
`;

/**
 * Edge Case 15: Transfer to another facility
 * Tests: Transfer documentation
 */
const edgeCase15_Transfer = `
ADMISSION: 11/01/2025

68M with complex spine fracture requiring specialized surgical equipment
not available at this facility.

TRANSFER NOTE - 11/02/2025:
Patient transferred to Tertiary Spine Center for definitive management.
All records, imaging sent with patient.
Accepting physician: Dr. Smith
`;

// ========================================
// CATEGORY 5: EXTREME VALUES
// ========================================

/**
 * Edge Case 16: Newborn patient (age 0)
 * Tests: Pediatric/neonatal handling
 */
const edgeCase16_Newborn = `
ADMISSION: 12/01/2025

Newborn female (DOB 12/01/2025) with congenital hydrocephalus.

MRI shows severe ventriculomegaly.

POD 1: VP shunt placed successfully.

DISCHARGE: 12/10/2025
Infant doing well. Head circumference stabilized. To pediatric neurosurgery clinic.
`;

/**
 * Edge Case 17: Elderly patient (100+)
 * Tests: Geriatric handling
 */
const edgeCase17_Centenarian = `
ADMISSION: 01/01/2026

102F with chronic SDH. Remarkable for age, independent at baseline.

Conservative management initially.
SDH enlarged, underwent burr hole drainage.

DISCHARGE: 01/15/2026
Returned to baseline. Back to assisted living.
`;

/**
 * Edge Case 18: Comatose patient (GCS 3)
 * Tests: Severe neurological impairment
 */
const edgeCase18_Comatose = `
ADMISSION: 02/01/2026

19M with GCS 3 after drowning accident.

Underwent hypothermia protocol.
MRI showed severe anoxic brain injury.

Family meeting: poor prognosis discussed.

DISCHARGE: 02/28/2026
Transferred to long-term care facility. Persistent vegetative state.
GCS remains 3. PEG and trach in place.
`;

/**
 * Edge Case 19: Many medications (>20)
 * Tests: Extensive medication list handling
 */
const edgeCase19_ManyMedications = `
ADMISSION: 03/01/2026

75M with multiple comorbidities admitted for tumor resection.

HOME MEDICATIONS (22 total):
1. Metformin 1000mg BID
2. Glipizide 10mg daily
3. Lisinopril 40mg daily
4. Amlodipine 10mg daily
5. Atorvastatin 80mg daily
6. Aspirin 81mg daily (HELD perioperatively)
7. Clopidogrel 75mg daily (HELD perioperatively)
8. Metoprolol 100mg BID
9. Furosemide 40mg daily
10. Levothyroxine 100mcg daily
11. Omeprazole 40mg daily
12. Allopurinol 300mg daily
13. Tamsulosin 0.4mg daily
14. Finasteride 5mg daily
15. Gabapentin 300mg TID
16. Duloxetine 60mg daily
17. Trazodone 50mg qHS
18. Melatonin 5mg qHS
19. Vitamin D 2000 units daily
20. Calcium carbonate 1000mg BID
21. Multivitamin daily
22. Fish oil 1000mg daily

POST-OP: Added dexamethasone, levetiracetam, pantoprazole IV.

DISCHARGE: Complex medication reconciliation performed.
`;

/**
 * Edge Case 20: Multiple complications (>10)
 * Tests: Extensive complication tracking
 */
const edgeCase20_ManyComplications = `
ADMISSION: 04/01/2026

55M with GBM resection, complicated postoperative course.

COMPLICATIONS:
1. Wound infection (POD 3)
2. CSF leak (POD 5)
3. Pseudomeningocele (POD 7)
4. Seizures (POD 8)
5. DVT (POD 10)
6. Pulmonary embolism (POD 11)
7. Acute kidney injury (POD 12)
8. Atrial fibrillation (POD 14)
9. Pneumonia (POD 16)
10. C. diff colitis (POD 20)
11. Hyponatremia (POD 22)
12. Pressure ulcer (POD 25)

Multiple interventions required. Prolonged ICU stay.

DISCHARGE: 05/15/2026 (44 days)
All complications resolved or managed. To rehab.
`;

// ========================================
// CATEGORY 6: DATA QUALITY ISSUES
// ========================================

/**
 * Edge Case 21: Inconsistent terminology
 * Tests: Terminology normalization
 */
const edgeCase21_InconsistentTerminology = `
ADMISSION: 05/01/2026

Patient with SAH. Subarachnoid bleed from ruptured berry aneurysm.
Hunt and Hess grade 3. Fisher scale 4.

Angiogram showed PCOM artery aneurysm. Underwent coiling procedure.
Post-coil angiography confirmed aneurysm obliteration.

Follow-up for vasospasm. TCD studies daily.

DISCHARGE: Patient recovered from subarachnoid hemorrhage.
`;

/**
 * Edge Case 22: Duplicate entries
 * Tests: Deduplication logic
 */
const edgeCase22_DuplicateEntries = `
ADMISSION: 06/01/2026

Patient underwent craniotomy.
Patient underwent craniotomy for tumor resection.
Craniotomy performed for left temporal tumor.

Started dexamethasone.
Dexamethasone 4mg q6h initiated.
Started on dexamethasone 4mg every 6 hours.

DISCHARGE: Patient discharged.
Patient was discharged home.
Discharge to home today.
`;

/**
 * Edge Case 23: Missing procedure details
 * Tests: Procedure documentation fallbacks
 */
const edgeCase23_MissingProcedureDetails = `
ADMISSION: 07/01/2026

Patient admitted for surgery.

OPERATIVE NOTE: Procedure performed.

DISCHARGE: Patient doing well post-procedure.
`;

/**
 * Edge Case 24: Ambiguous clinical information
 * Tests: Ambiguity handling
 */
const edgeCase24_AmbiguousInformation = `
ADMISSION: 08/01/2026

Patient admitted with possible stroke vs seizure vs tumor.

Imaging somewhat concerning for possible lesion.

Treatment may include surgery if needed.

DISCHARGE: Patient probably improved. Follow up as needed.
`;

/**
 * Edge Case 25: Mixed date formats
 * Tests: Date format normalization
 */
const edgeCase25_MixedDateFormats = `
ADMISSION: 09/01/2026

Patient admitted on 9-1-26.

Surgery performed 9/5/2026.

Follow-up scheduled for September 15th, 2026.

Medications started 09.10.26.

DISCHARGE: 2026-09-20
`;

// ========================================
// TEST RUNNER
// ========================================

const edgeCases = [
  { name: 'Concurrent Procedures', notes: edgeCase1_ConcurrentProcedures, category: 'CONCURRENT', expectedQuality: 40 },
  { name: 'Complication During Procedure', notes: edgeCase2_ComplicationDuringProcedure, category: 'CONCURRENT', expectedQuality: 45 },
  { name: 'Same-Day Medication Changes', notes: edgeCase3_SameDayMedicationChanges, category: 'CONCURRENT', expectedQuality: 40 },

  { name: 'Missing Admission Date', notes: edgeCase4_MissingAdmissionDate, category: 'MISSING_DATES', expectedQuality: 35 },
  { name: 'Only Relative Dates', notes: edgeCase5_OnlyRelativeDates, category: 'MISSING_DATES', expectedQuality: 30 },
  { name: 'Contradictory Dates', notes: edgeCase6_ContradictoryDates, category: 'MISSING_DATES', expectedQuality: 35 },

  { name: 'Missing Demographics', notes: edgeCase7_MissingDemographics, category: 'MALFORMED', expectedQuality: 30 },
  { name: 'Incomplete Pathology', notes: edgeCase8_IncompletePathology, category: 'MALFORMED', expectedQuality: 25 },
  { name: 'Empty Fields', notes: edgeCase9_EmptyFields, category: 'MALFORMED', expectedQuality: 10 },
  { name: 'Truncated Text', notes: edgeCase10_TruncatedText, category: 'MALFORMED', expectedQuality: 20 },

  { name: 'Very Short Stay', notes: edgeCase11_ShortStay, category: 'BOUNDARY', expectedQuality: 45 },
  { name: 'Very Long Stay', notes: edgeCase12_LongStay, category: 'BOUNDARY', expectedQuality: 50 },
  { name: 'Patient Expired', notes: edgeCase13_PatientExpired, category: 'BOUNDARY', expectedQuality: 40 },
  { name: 'Left AMA', notes: edgeCase14_LeftAMA, category: 'BOUNDARY', expectedQuality: 45 },
  { name: 'Transfer', notes: edgeCase15_Transfer, category: 'BOUNDARY', expectedQuality: 40 },

  { name: 'Newborn Patient', notes: edgeCase16_Newborn, category: 'EXTREME', expectedQuality: 45 },
  { name: 'Centenarian Patient', notes: edgeCase17_Centenarian, category: 'EXTREME', expectedQuality: 45 },
  { name: 'Comatose Patient', notes: edgeCase18_Comatose, category: 'EXTREME', expectedQuality: 45 },
  { name: 'Many Medications', notes: edgeCase19_ManyMedications, category: 'EXTREME', expectedQuality: 50 },
  { name: 'Many Complications', notes: edgeCase20_ManyComplications, category: 'EXTREME', expectedQuality: 50 },

  { name: 'Inconsistent Terminology', notes: edgeCase21_InconsistentTerminology, category: 'DATA_QUALITY', expectedQuality: 45 },
  { name: 'Duplicate Entries', notes: edgeCase22_DuplicateEntries, category: 'DATA_QUALITY', expectedQuality: 40 },
  { name: 'Missing Procedure Details', notes: edgeCase23_MissingProcedureDetails, category: 'DATA_QUALITY', expectedQuality: 25 },
  { name: 'Ambiguous Information', notes: edgeCase24_AmbiguousInformation, category: 'DATA_QUALITY', expectedQuality: 20 },
  { name: 'Mixed Date Formats', notes: edgeCase25_MixedDateFormats, category: 'DATA_QUALITY', expectedQuality: 40 },
];

/**
 * Run edge case tests
 */
async function runEdgeCaseTests() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('  DCS EDGE CASE TEST SUITE');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  const results = [];
  const categories = {
    CONCURRENT: { passed: 0, failed: 0, crashed: 0 },
    MISSING_DATES: { passed: 0, failed: 0, crashed: 0 },
    MALFORMED: { passed: 0, failed: 0, crashed: 0 },
    BOUNDARY: { passed: 0, failed: 0, crashed: 0 },
    EXTREME: { passed: 0, failed: 0, crashed: 0 },
    DATA_QUALITY: { passed: 0, failed: 0, crashed: 0 },
  };

  for (let i = 0; i < edgeCases.length; i++) {
    const testCase = edgeCases[i];
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`TEST ${i + 1}/${edgeCases.length}: ${testCase.name} [${testCase.category}]`);
    console.log(`${'─'.repeat(80)}\n`);

    const startTime = Date.now();

    try {
      // Run orchestration
      const result = await orchestrateSummaryGeneration(testCase.notes, {
        refinementIterations: 1, // Minimal refinement for speed
      });

      const duration = Date.now() - startTime;

      // Validate result structure
      const hasExtracted = result.extracted && typeof result.extracted === 'object';
      const hasIntelligence = result.intelligence && typeof result.intelligence === 'object';
      const hasNarrative = result.narrative && typeof result.narrative === 'object';
      const hasQuality = typeof result.qualityScore === 'number';

      const structureComplete = hasExtracted && hasIntelligence && hasNarrative && hasQuality;

      // Check for crashes or errors
      const crashed = false;

      // Determine pass/fail
      let status;
      let statusSymbol;

      if (crashed) {
        status = 'CRASHED';
        statusSymbol = '💥';
        categories[testCase.category].crashed++;
      } else if (!structureComplete) {
        status = 'FAILED';
        statusSymbol = '❌';
        categories[testCase.category].failed++;
      } else if (result.qualityScore < testCase.expectedQuality) {
        status = 'WARNING';
        statusSymbol = '⚠️';
        categories[testCase.category].passed++; // Still passed, just low quality
      } else {
        status = 'PASSED';
        statusSymbol = '✅';
        categories[testCase.category].passed++;
      }

      results.push({
        name: testCase.name,
        category: testCase.category,
        status,
        qualityScore: result.qualityScore,
        expectedQuality: testCase.expectedQuality,
        duration,
        structureComplete,
        crashed,
      });

      console.log(`${statusSymbol} ${status}`);
      console.log(`   Quality: ${result.qualityScore?.toFixed(1) ?? 'N/A'}% (expected: ${testCase.expectedQuality}%)`);
      console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Structure: ${structureComplete ? '✓ Complete' : '✗ Incomplete'}`);

      // Log key metrics
      if (hasExtracted) {
        const extractedCount = {
          dates: result.extracted.dates ? 1 : 0,
          pathology: result.extracted.pathology ? 1 : 0,
          procedures: result.extracted.procedures?.procedures?.length || 0,
          complications: result.extracted.complications?.length || 0,
          medications: result.extracted.medications?.length || 0,
        };
        console.log(`   Extracted: ${Object.values(extractedCount).reduce((a, b) => a + b, 0)} entities`);
      }

      if (hasNarrative) {
        const narrativeSections = Object.keys(result.narrative).filter(k =>
          result.narrative[k] && typeof result.narrative[k] === 'string' && result.narrative[k].length > 20
        ).length;
        console.log(`   Narrative: ${narrativeSections}/8 sections present`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      results.push({
        name: testCase.name,
        category: testCase.category,
        status: 'CRASHED',
        qualityScore: 0,
        expectedQuality: testCase.expectedQuality,
        duration,
        structureComplete: false,
        crashed: true,
        error: error.message,
      });

      categories[testCase.category].crashed++;

      console.log(`💥 CRASHED`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    }
  }

  // Print summary
  console.log('\n\n════════════════════════════════════════════════════════════════════════════════');
  console.log('  EDGE CASE TEST SUMMARY');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  const totalPassed = Object.values(categories).reduce((sum, cat) => sum + cat.passed, 0);
  const totalFailed = Object.values(categories).reduce((sum, cat) => sum + cat.failed, 0);
  const totalCrashed = Object.values(categories).reduce((sum, cat) => sum + cat.crashed, 0);
  const total = edgeCases.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${totalPassed} (${((totalPassed / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed / total) * 100).toFixed(1)}%)`);
  console.log(`💥 Crashed: ${totalCrashed} (${((totalCrashed / total) * 100).toFixed(1)}%)`);
  console.log('');

  // Category breakdown
  console.log('By Category:');
  Object.entries(categories).forEach(([category, stats]) => {
    const categoryTotal = stats.passed + stats.failed + stats.crashed;
    console.log(`  ${category}: ${stats.passed}/${categoryTotal} passed, ${stats.crashed} crashed`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log('ROBUSTNESS ANALYSIS:');
  console.log('─'.repeat(80) + '\n');

  const robustness = (totalPassed / total) * 100;
  const noCrashes = totalCrashed === 0;

  if (noCrashes && robustness >= 80) {
    console.log('✅ EXCELLENT: System handles edge cases gracefully');
  } else if (noCrashes && robustness >= 60) {
    console.log('✅ GOOD: Most edge cases handled, some quality issues');
  } else if (noCrashes) {
    console.log('⚠️  FAIR: Many edge cases have quality issues, but no crashes');
  } else {
    console.log('❌ POOR: System crashes on some edge cases - needs defensive programming');
  }

  console.log(`\nRobustness Score: ${robustness.toFixed(1)}%`);
  console.log(`Crash-Free: ${noCrashes ? 'Yes ✅' : 'No ❌'}`);

  // Performance
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`\nAverage Duration: ${(avgDuration / 1000).toFixed(1)}s`);

  console.log('\n════════════════════════════════════════════════════════════════════════════════\n');

  return {
    results,
    categories,
    summary: {
      total,
      passed: totalPassed,
      failed: totalFailed,
      crashed: totalCrashed,
      robustness,
      noCrashes,
      avgDuration,
    },
  };
}

// Run tests
console.log('Starting edge case test suite...\n');
runEdgeCaseTests()
  .then(testResults => {
    console.log('Edge case testing complete!');
    process.exit(testResults.summary.crashed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error running edge case tests:', error);
    process.exit(1);
  });
