/**
 * Quick Edge Case Validation (5 Tests)
 * Runs a representative subset to validate robustness quickly
 */

import { orchestrateSummaryGeneration } from '../src/services/summaryOrchestrator.js';

// 5 representative edge cases (one from each category)
const quickEdgeCases = [
  {
    name: 'Concurrent Procedures',
    category: 'CONCURRENT',
    expectedQuality: 40,
    notes: `ADMISSION NOTE - 01/15/2025
58F admitted with acute SDH after fall. Emergency craniotomy performed same day.
Also underwent ICP monitor placement and EVD insertion during same procedure.

OPERATIVE NOTE - 01/15/2025
1. Right frontoparietal craniotomy for SDH evacuation
2. ICP monitor placement
3. EVD insertion

All procedures completed successfully.

DISCHARGE NOTE - 01/25/2025
Patient recovered well. Discharged home.`
  },
  {
    name: 'Missing Admission Date',
    category: 'MISSING_DATES',
    expectedQuality: 35,
    notes: `ADMISSION NOTE
72M with SAH from ruptured aneurysm. Hunt-Hess 3.

Angiogram performed, showed PCOM aneurysm.
Endovascular coiling completed successfully.

POD 3: Developed vasospasm, started triple-H therapy.
POD 7: Vasospasm resolved.
POD 10: Discharged to rehab.

DISCHARGE SUMMARY
Patient recovered well from SAH and coiling procedure.`
  },
  {
    name: 'Empty Fields',
    category: 'MALFORMED',
    expectedQuality: 10,
    notes: `ADMISSION:

HOSPITAL COURSE:


DISCHARGE:`
  },
  {
    name: 'Patient Expired',
    category: 'BOUNDARY',
    expectedQuality: 40,
    notes: `ADMISSION: 09/01/2025
82F with massive hemorrhagic stroke. GCS 3 on arrival.

Family meeting held. Goals of care discussion.
Transitioned to comfort measures.

FINAL NOTE - 09/03/2025:
Patient expired peacefully with family at bedside.

Time of death: 09/03/2025 14:32`
  },
  {
    name: 'Many Medications (20+)',
    category: 'EXTREME',
    expectedQuality: 50,
    notes: `ADMISSION: 03/01/2026
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

DISCHARGE: Complex medication reconciliation performed.`
  }
];

async function runQuickValidation() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('  QUICK EDGE CASE VALIDATION (5 Tests)');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  const results = [];
  let passed = 0;
  let failed = 0;
  let crashed = 0;

  for (let i = 0; i < quickEdgeCases.length; i++) {
    const testCase = quickEdgeCases[i];
    console.log(`\nTest ${i + 1}/5: ${testCase.name} [${testCase.category}]`);

    const startTime = Date.now();

    try {
      const result = await orchestrateSummaryGeneration(testCase.notes, {
        refinementIterations: 1,
      });

      const duration = Date.now() - startTime;

      const hasStructure = result.extracted && result.intelligence && result.narrative && typeof result.qualityScore === 'number';

      if (hasStructure) {
        console.log(`✅ PASSED - Quality: ${result.qualityScore?.toFixed(1) ?? 'N/A'}% (${(duration/1000).toFixed(1)}s)`);
        passed++;
      } else {
        console.log(`❌ FAILED - Incomplete structure (${(duration/1000).toFixed(1)}s)`);
        failed++;
      }

      results.push({
        name: testCase.name,
        category: testCase.category,
        passed: hasStructure,
        qualityScore: result.qualityScore,
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`💥 CRASHED - ${error.message}`);
      crashed++;

      results.push({
        name: testCase.name,
        category: testCase.category,
        passed: false,
        crashed: true,
        error: error.message,
        duration,
      });
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('QUICK VALIDATION SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 5 tests`);
  console.log(`✅ Passed: ${passed} (${(passed/5*100).toFixed(0)}%)`);
  console.log(`❌ Failed: ${failed} (${(failed/5*100).toFixed(0)}%)`);
  console.log(`💥 Crashed: ${crashed} (${(crashed/5*100).toFixed(0)}%)`);

  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`Average Duration: ${(avgDuration/1000).toFixed(1)}s`);

  console.log('\n' + '─'.repeat(80));
  if (crashed === 0 && passed >= 4) {
    console.log('✅ EXCELLENT: System handles edge cases robustly');
  } else if (crashed === 0 && passed >= 3) {
    console.log('✅ GOOD: Most edge cases handled well');
  } else if (crashed === 0) {
    console.log('⚠️  FAIR: Some edge cases have issues, but no crashes');
  } else {
    console.log('❌ POOR: System crashes on some edge cases');
  }

  console.log('\n════════════════════════════════════════════════════════════════════════════════\n');

  return { passed, failed, crashed, results };
}

console.log('Starting quick edge case validation...\n');
runQuickValidation()
  .then(results => {
    console.log('Quick validation complete!');
    process.exit(results.crashed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
