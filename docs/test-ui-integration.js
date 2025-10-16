/**
 * Phase 1 Step 6 - UI Integration Test
 *
 * Test the full pipeline from extraction to UI data structure:
 * 1. Process a SAH discharge summary
 * 2. Verify pathology.subtype is populated
 * 3. Validate the data structure matches UI expectations
 */

import { extractMedicalEntities } from './src/services/extraction.js';

console.log('='.repeat(80));
console.log('PHASE 1 STEP 6 - UI INTEGRATION TEST');
console.log('Testing: Extraction → Subtype Detection → UI Data Structure');
console.log('='.repeat(80));
console.log();

// Test Case: SAH with Hunt & Hess 3, Fisher 3
const sahCase = {
  title: 'SAH Case - AComm Aneurysm with Hunt & Hess 3',
  notes: [
    {
      type: 'admission',
      content: `
ADMISSION NOTE

Patient: 55-year-old female
Presenting Complaint: Sudden onset severe headache, "worst headache of my life"

DIAGNOSIS: Aneurysmal subarachnoid hemorrhage from ruptured 8mm anterior communicating artery aneurysm

CLINICAL GRADING:
- Hunt & Hess Grade: 3 (drowsy, mild focal deficit)
- Modified Fisher Grade: 3 (thick SAH, IVH present)

IMAGING:
- CT Head: Diffuse subarachnoid hemorrhage, predominantly in basal cisterns
- CTA: 8mm AComm aneurysm with wide neck
- No hydrocephalus on initial imaging

HOSPITAL COURSE:
Admitted 05/15/2025. Patient underwent emergent craniotomy and microsurgical clipping on 05/15/2025.
Post-op course complicated by delayed cerebral ischemia on POD 6.

DAILY TCD MONITORING:
- POD 1-3: Normal velocities
- POD 4-7: Rising MCA velocities, consistent with vasospasm
- POD 8-14: Continued monitoring, gradual improvement

TREATMENT:
- Nimodipine 60mg q4h x 21 days (mandatory SAH protocol)
- Euvolemia maintained
- Daily neuro checks q1h x 48h
- Induced hypertension for DCI

COMPLICATIONS:
- Delayed cerebral ischemia (POD 6)
- Mild cognitive deficits at discharge

DISCHARGE: 06/02/2025
Destination: Acute rehab
mRS at discharge: 3 (moderate disability)

FOLLOW-UP:
- Neurosurgery clinic 2 weeks
- Repeat CTA at 6 months
      `
    }
  ],
  expectedSubtype: {
    type: 'SAH',
    riskLevel: 'MODERATE',
    hasPrognosisPrediction: true,
    hasAneurysmLocation: true,
    hasVasospasmRisk: true,
    hasTreatmentRecommendations: true,
    hasComplications: true
  }
};

async function runTest() {
  try {
    console.log(`📋 Test Case: ${sahCase.title}`);
    console.log('-'.repeat(80));
    console.log();

    // Extract data from notes
    console.log('🔄 Running extraction pipeline...');
    const result = await extractMedicalEntities(sahCase.notes);

    // extractMedicalEntities returns { extracted: {...}, validation: {...}, metadata: {...} }
    const extractedData = result.extracted;

    console.log('✅ Extraction complete');
    console.log();

    // Validate pathology extraction
    console.log('📊 PATHOLOGY DATA:');
    console.log(JSON.stringify(extractedData.pathology, null, 2));
    console.log();

    // Validate subtype detection
    if (!extractedData.pathology) {
      console.log('❌ FAIL: No pathology data extracted');
      return false;
    }

    if (!extractedData.pathology.subtype) {
      console.log('❌ FAIL: No subtype detected');
      console.log('Expected subtype to be populated for SAH case');
      return false;
    }

    console.log('✅ Subtype detected!');
    console.log();

    // Display full subtype structure
    console.log('🎯 PATHOLOGY SUBTYPE DATA (UI DISPLAY DATA):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(extractedData.pathology.subtype, null, 2));
    console.log('='.repeat(80));
    console.log();

    // Validate expected fields for UI
    console.log('🧪 VALIDATION CHECKS:');
    console.log('-'.repeat(80));

    const checks = [
      {
        name: 'Subtype type matches pathology',
        pass: extractedData.pathology.subtype.type === sahCase.expectedSubtype.type,
        value: extractedData.pathology.subtype.type
      },
      {
        name: 'Risk level is defined',
        pass: extractedData.pathology.subtype.riskLevel !== undefined,
        value: extractedData.pathology.subtype.riskLevel
      },
      {
        name: 'Clinical details present',
        pass: extractedData.pathology.subtype.details !== undefined,
        value: Object.keys(extractedData.pathology.subtype.details || {}).length + ' fields'
      },
      {
        name: 'Aneurysm location identified',
        pass: extractedData.pathology.subtype.details?.aneurysmLocation !== undefined,
        value: extractedData.pathology.subtype.details?.aneurysmLocation
      },
      {
        name: 'Aneurysm size extracted',
        pass: extractedData.pathology.subtype.details?.aneurysmSize !== undefined,
        value: extractedData.pathology.subtype.details?.aneurysmSize
      },
      {
        name: 'Prognosis predictions included',
        pass: extractedData.pathology.subtype.prognosis !== undefined,
        value: Object.keys(extractedData.pathology.subtype.prognosis || {}).length + ' predictions'
      },
      {
        name: 'Mortality percentage provided',
        pass: extractedData.pathology.subtype.prognosis?.mortality !== undefined,
        value: extractedData.pathology.subtype.prognosis?.mortality
      },
      {
        name: 'Vasospasm risk calculated',
        pass: extractedData.pathology.subtype.prognosis?.vasospasmRisk !== undefined,
        value: extractedData.pathology.subtype.prognosis?.vasospasmRisk
      },
      {
        name: 'Treatment recommendations provided',
        pass: extractedData.pathology.subtype.recommendations !== undefined,
        value: Object.keys(extractedData.pathology.subtype.recommendations || {}).length + ' categories'
      },
      {
        name: 'Imaging protocols specified',
        pass: extractedData.pathology.subtype.recommendations?.imaging?.length > 0,
        value: extractedData.pathology.subtype.recommendations?.imaging?.length + ' protocols'
      },
      {
        name: 'Medication protocols specified',
        pass: extractedData.pathology.subtype.recommendations?.medications?.length > 0,
        value: extractedData.pathology.subtype.recommendations?.medications?.length + ' protocols'
      },
      {
        name: 'Monitoring protocols specified',
        pass: extractedData.pathology.subtype.recommendations?.monitoring?.length > 0,
        value: extractedData.pathology.subtype.recommendations?.monitoring?.length + ' protocols'
      },
      {
        name: 'Complications watch list provided',
        pass: extractedData.pathology.subtype.complications?.length > 0,
        value: extractedData.pathology.subtype.complications?.length + ' complications'
      }
    ];

    let passCount = 0;
    let totalCount = checks.length;

    checks.forEach((check, idx) => {
      const status = check.pass ? '✅' : '❌';
      const result = check.pass ? 'PASS' : 'FAIL';
      console.log(`${idx + 1}. ${status} ${check.name}: ${result}`);
      if (check.value) {
        console.log(`   Value: ${check.value}`);
      }
      if (check.pass) passCount++;
    });

    console.log('-'.repeat(80));
    console.log(`📈 RESULT: ${passCount}/${totalCount} checks passed (${Math.round(passCount/totalCount*100)}%)`);
    console.log();

    // UI Component Readiness
    console.log('🎨 UI COMPONENT READINESS:');
    console.log('-'.repeat(80));
    console.log('The PathologySubtypePanel component expects the following structure:');
    console.log('  ✓ subtype.type: string (SAH, Tumor, Spine)');
    console.log('  ✓ subtype.riskLevel: string (LOW, MODERATE, HIGH, VERY HIGH)');
    console.log('  ✓ subtype.details: object (pathology-specific details)');
    console.log('  ✓ subtype.prognosis: object (mortality, survival, recovery)');
    console.log('  ✓ subtype.recommendations: object (imaging, medications, monitoring)');
    console.log('  ✓ subtype.complications: array (watch list with risk levels)');
    console.log();

    if (passCount === totalCount) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('The extracted data structure is fully compatible with the UI component.');
      console.log('The PathologySubtypePanel will display:');
      console.log(`  - Risk Level Badge: ${extractedData.pathology.subtype.riskLevel}`);
      console.log(`  - Aneurysm Location: ${extractedData.pathology.subtype.details?.aneurysmLocation}`);
      console.log(`  - Aneurysm Size: ${extractedData.pathology.subtype.details?.aneurysmSize}`);
      console.log(`  - Vasospasm Risk: ${extractedData.pathology.subtype.prognosis?.vasospasmRisk}`);
      console.log(`  - Mortality: ${extractedData.pathology.subtype.prognosis?.mortality}`);
      console.log(`  - Good Outcome: ${extractedData.pathology.subtype.prognosis?.goodOutcome}`);
      console.log(`  - ${extractedData.pathology.subtype.recommendations?.imaging?.length || 0} imaging protocols`);
      console.log(`  - ${extractedData.pathology.subtype.recommendations?.medications?.length || 0} medication protocols`);
      console.log(`  - ${extractedData.pathology.subtype.recommendations?.monitoring?.length || 0} monitoring protocols`);
      console.log(`  - ${extractedData.pathology.subtype.complications?.length || 0} complications to watch`);
      return true;
    } else {
      console.log('⚠️  SOME CHECKS FAILED');
      console.log('Review the failed checks above and verify the extraction logic.');
      return false;
    }

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    return false;
  }
}

// Run the test
runTest().then(success => {
  console.log();
  console.log('='.repeat(80));
  if (success) {
    console.log('✅ UI INTEGRATION TEST PASSED');
    console.log('Phase 1 Step 6 is ready for production use.');
  } else {
    console.log('❌ UI INTEGRATION TEST FAILED');
    console.log('Review the output above for details.');
  }
  console.log('='.repeat(80));
  process.exit(success ? 0 : 1);
});
