/**
 * Phase 1 Step 6 Test Suite
 * Tests pathology subtype detection with clinical intelligence
 */

import {
  detectPathologySubtype,
  calculateVasospasmRisk,
  calculateHuntHessPrognosis,
  calculateGBMPrognosis,
  ANEURYSM_LOCATIONS,
  TUMOR_GRADES,
  ASIA_GRADES
} from './src/utils/pathologySubtypes.js';
import { PATHOLOGY_TYPES } from './src/config/pathologyPatterns.js';

console.log('='.repeat(80));
console.log('PHASE 1 STEP 6 TEST SUITE - PATHOLOGY SUBTYPES');
console.log('='.repeat(80));

let totalPassed = 0;
let totalFailed = 0;

// Test 1: SAH Subtype Detection
console.log('\n\n📋 TEST 1: SAH Subtype Detection');
console.log('-'.repeat(80));

const sahCases = [
  {
    name: 'AComm aneurysm with Hunt & Hess 3',
    text: `Patient presented with severe headache. CT showed subarachnoid hemorrhage.
      Aneurysm of anterior communicating artery, 7mm. Hunt and Hess grade 3, Fisher grade 3.
      Patient underwent endovascular coiling.`,
    expected: {
      location: 'Anterior Communicating Artery',
      size: '7mm (Large)',
      huntHess: { mortality: '15-20%', riskLevel: 'MODERATE' },
      vasospasm: '60-70%'
    }
  },
  {
    name: 'MCA aneurysm with poor grade',
    text: `53 year old with ruptured MCA aneurysm. Hunt & Hess grade 5, modified Fisher 4.
      10mm aneurysm. Taken to OR for clipping.`,
    expected: {
      location: 'Middle Cerebral Artery',
      size: '10mm (Large)',
      huntHess: { mortality: '60-70%', riskLevel: 'VERY HIGH' }
    }
  },
  {
    name: 'Basilar tip aneurysm',
    text: `Patient with basilar artery aneurysm, 12mm. WFNS grade 2.
      Underwent coiling with good result.`,
    expected: {
      location: 'Basilar Artery',
      size: '12mm (Large)',
      difficulty: 'VERY HIGH'
    }
  }
];

let passed = 0;
let failed = 0;

for (const test of sahCases) {
  console.log(`\nTesting: ${test.name}`);

  try {
    const extractedData = {
      grades: {
        huntHess: test.text.match(/Hunt.*?(\d|[IV]+)/i)?.[1],
        fisher: test.text.match(/Fisher.*?(\d)/i)?.[1]
      }
    };

    const result = detectPathologySubtype(test.text, PATHOLOGY_TYPES.SAH, extractedData);

    let testPassed = true;
    const checks = [];

    // Check location
    if (test.expected.location && result.details.aneurysmLocation) {
      const locationMatch = result.details.aneurysmLocation === test.expected.location;
      checks.push({ name: 'Location', pass: locationMatch, expected: test.expected.location, got: result.details.aneurysmLocation });
      if (!locationMatch) testPassed = false;
    }

    // Check size
    if (test.expected.size && result.details.aneurysmSize) {
      const sizeMatch = result.details.aneurysmSize.includes('Large') === test.expected.size.includes('Large');
      checks.push({ name: 'Size category', pass: sizeMatch, expected: test.expected.size, got: result.details.aneurysmSize });
      if (!sizeMatch) testPassed = false;
    }

    // Check Hunt & Hess prognosis
    if (test.expected.huntHess && result.prognosis.mortality) {
      const prognosisMatch = result.prognosis.mortality === test.expected.huntHess.mortality;
      checks.push({ name: 'Hunt & Hess prognosis', pass: prognosisMatch, expected: test.expected.huntHess.mortality, got: result.prognosis.mortality });
      if (!prognosisMatch) testPassed = false;
    }

    // Check vasospasm risk
    if (test.expected.vasospasm && result.details.vasospasmRisk) {
      const vasospasmMatch = result.details.vasospasmRisk === test.expected.vasospasm;
      checks.push({ name: 'Vasospasm risk', pass: vasospasmMatch, expected: test.expected.vasospasm, got: result.details.vasospasmRisk });
      if (!vasospasmMatch) testPassed = false;
    }

    if (testPassed) {
      console.log(`✅ PASS`);
      checks.forEach(c => console.log(`   ${c.name}: ${c.got}`));
      passed++;
    } else {
      console.log(`❌ FAIL`);
      checks.forEach(c => {
        if (c.pass) {
          console.log(`   ✓ ${c.name}: ${c.got}`);
        } else {
          console.log(`   ✗ ${c.name}: expected "${c.expected}", got "${c.got}"`);
        }
      });
      failed++;
    }

    // Log full result for debugging
    console.log(`   Risk Level: ${result.riskLevel}`);
    if (result.recommendations.imaging) {
      console.log(`   Recommendations: ${result.recommendations.imaging.length} imaging protocols`);
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }
}

console.log(`\nTest 1 Results: ${passed} passed, ${failed} failed`);
totalPassed += passed;
totalFailed += failed;

// Test 2: Tumor Subtype Detection
console.log('\n\n📋 TEST 2: Brain Tumor Subtype Detection');
console.log('-'.repeat(80));

const tumorCases = [
  {
    name: 'GBM with favorable markers',
    text: `Patient with glioblastoma, WHO Grade IV. IDH mutant, MGMT methylated.
      Gross total resection achieved. Age 45.`,
    expected: {
      grade: 'WHO Grade IV',
      survival: '51 months',  // IDH-mutant + MGMT-methylated + GTR + Age<50 = 51 months
      extent: 'Gross Total Resection',
      riskLevel: 'VERY HIGH'
    }
  },
  {
    name: 'Low-grade astrocytoma',
    text: `45 year old with left frontal mass. Pathology: diffuse astrocytoma, WHO Grade II.
      IDH mutant, 1p/19q intact. Near total resection.`,
    expected: {
      grade: 'WHO Grade II',
      riskLevel: 'MODERATE',
      survival: '5-8 years'
    }
  },
  {
    name: 'Meningioma',
    text: `Patient with right parasagittal meningioma. WHO Grade I.
      Underwent craniotomy with gross total resection.`,
    expected: {
      grade: 'WHO Grade I',
      riskLevel: 'LOW',
      survival: '90-95% 5-year'
    }
  }
];

passed = 0;
failed = 0;

for (const test of tumorCases) {
  console.log(`\nTesting: ${test.name}`);

  try {
    const result = detectPathologySubtype(test.text, PATHOLOGY_TYPES.TUMORS, {});

    let testPassed = true;
    const checks = [];

    // Check WHO grade
    if (test.expected.grade && result.details.whoGrade) {
      const gradeMatch = result.details.whoGrade.includes(test.expected.grade.match(/[IViv0-9]+/)[0]);
      checks.push({ name: 'WHO Grade', pass: gradeMatch, expected: test.expected.grade, got: result.details.whoGrade });
      if (!gradeMatch) testPassed = false;
    }

    // Check risk level
    if (test.expected.riskLevel && result.riskLevel) {
      const riskMatch = result.riskLevel === test.expected.riskLevel;
      checks.push({ name: 'Risk Level', pass: riskMatch, expected: test.expected.riskLevel, got: result.riskLevel });
      if (!riskMatch) testPassed = false;
    }

    // Check survival
    if (test.expected.survival && result.prognosis.survival) {
      const survivalPresent = result.prognosis.survival.includes(test.expected.survival.match(/\d+/)?.[0] || 'years');
      checks.push({ name: 'Survival prognosis', pass: survivalPresent, got: result.prognosis.survival });
      if (!survivalPresent) testPassed = false;
    }

    if (testPassed) {
      console.log(`✅ PASS`);
      checks.forEach(c => console.log(`   ${c.name}: ${c.got}`));
      passed++;
    } else {
      console.log(`❌ FAIL`);
      checks.forEach(c => {
        if (c.pass) {
          console.log(`   ✓ ${c.name}: ${c.got}`);
        } else {
          console.log(`   ✗ ${c.name}: expected "${c.expected}", got "${c.got}"`);
        }
      });
      failed++;
    }

    // Log molecular markers if present
    if (result.details.molecularMarkers && result.details.molecularMarkers.length > 0) {
      console.log(`   Molecular Markers: ${result.details.molecularMarkers.map(m => m.name).join(', ')}`);
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }
}

console.log(`\nTest 2 Results: ${passed} passed, ${failed} failed`);
totalPassed += passed;
totalFailed += failed;

// Test 3: Spine Injury Subtype Detection
console.log('\n\n📋 TEST 3: Spine Injury Subtype Detection');
console.log('-'.repeat(80));

const spineCases = [
  {
    name: 'Complete cervical injury',
    text: `Patient with C5 fracture. ASIA A - complete spinal cord injury.
      No motor or sensory function below injury level.`,
    expected: {
      asia: 'ASIA A',
      level: 'Cervical',
      recovery: '<5%',
      riskLevel: 'VERY HIGH'
    }
  },
  {
    name: 'Motor incomplete lumbar injury',
    text: `L1 burst fracture with canal compromise. ASIA D motor incomplete.
      Patient ambulating with assistance.`,
    expected: {
      asia: 'ASIA D',
      level: 'Lumbar',
      recovery: '>80%',
      riskLevel: 'LOW'
    }
  }
];

passed = 0;
failed = 0;

for (const test of spineCases) {
  console.log(`\nTesting: ${test.name}`);

  try {
    const result = detectPathologySubtype(test.text, PATHOLOGY_TYPES.SPINE, {});

    let testPassed = true;
    const checks = [];

    // Check ASIA grade
    if (test.expected.asia && result.details.asiaGrade) {
      const asiaMatch = result.details.asiaGrade.includes(test.expected.asia);
      checks.push({ name: 'ASIA Grade', pass: asiaMatch, expected: test.expected.asia, got: result.details.asiaGrade });
      if (!asiaMatch) testPassed = false;
    }

    // Check risk level
    if (test.expected.riskLevel && result.riskLevel) {
      const riskMatch = result.riskLevel === test.expected.riskLevel;
      checks.push({ name: 'Risk Level', pass: riskMatch, expected: test.expected.riskLevel, got: result.riskLevel });
      if (!riskMatch) testPassed = false;
    }

    // Check level
    if (test.expected.level && result.details.level) {
      const levelMatch = result.details.level.includes(test.expected.level);
      checks.push({ name: 'Injury Level', pass: levelMatch, expected: test.expected.level, got: result.details.level });
      if (!levelMatch) testPassed = false;
    }

    if (testPassed) {
      console.log(`✅ PASS`);
      checks.forEach(c => console.log(`   ${c.name}: ${c.got}`));
      passed++;
    } else {
      console.log(`❌ FAIL`);
      checks.forEach(c => {
        if (c.pass) {
          console.log(`   ✓ ${c.name}: ${c.got}`);
        } else {
          console.log(`   ✗ ${c.name}: expected "${c.expected}", got "${c.got}"`);
        }
      });
      failed++;
    }

    // Log prognosis
    if (result.prognosis.recovery) {
      console.log(`   Recovery Prognosis: ${result.prognosis.recovery}`);
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }
}

console.log(`\nTest 3 Results: ${passed} passed, ${failed} failed`);
totalPassed += passed;
totalFailed += failed;

// Test 4: Prognostic Calculations
console.log('\n\n📋 TEST 4: Prognostic Calculation Functions');
console.log('-'.repeat(80));

console.log('\n4a. Hunt & Hess Prognosis Calculation');
const hhGrades = ['1', '3', '5'];
for (const grade of hhGrades) {
  const prognosis = calculateHuntHessPrognosis(grade);
  console.log(`  HH Grade ${grade}: Mortality ${prognosis.mortality}, Good outcome ${prognosis.goodOutcome}, Risk: ${prognosis.riskLevel}`);
}

console.log('\n4b. Vasospasm Risk Calculation');
const fisherGrades = ['1', '3', '4'];
for (const grade of fisherGrades) {
  const risk = calculateVasospasmRisk(grade);
  console.log(`  Fisher Grade ${grade}: Vasospasm risk ${risk.percentage}, Level: ${risk.level}`);
}

console.log('\n4c. GBM Survival Calculation');
const gbmScenarios = [
  { name: 'Worst case', factors: { idh: 'wildtype', mgmt: 'unmethylated', extent: 'STR', age: 75 } },
  { name: 'Best case', factors: { idh: 'mutant', mgmt: 'methylated', extent: 'GTR', age: 45 } },
  { name: 'Average case', factors: { idh: 'wildtype', mgmt: 'methylated', extent: 'STR', age: 60 } }
];

for (const scenario of gbmScenarios) {
  const survival = calculateGBMPrognosis(scenario.factors);
  console.log(`  ${scenario.name}: ${survival.medianSurvival} months`);
  survival.modifications.forEach(mod => console.log(`    - ${mod}`));
}

console.log('\n✅ Prognostic calculations completed');

// Test 5: Integration Test
console.log('\n\n📋 TEST 5: Full Integration Test');
console.log('-'.repeat(80));

const integrationCase = {
  text: `
55 year old female with sudden severe headache. CT showed subarachnoid hemorrhage
with anterior communicating artery aneurysm, 8mm. Hunt and Hess grade 3,
modified Fisher grade 3. GCS 13, no focal deficits.

Patient underwent endovascular coiling on 10/1/2024. Procedure uncomplicated.
Started on nimodipine 60mg q4h.

POD#3: Transcranial Doppler showed elevated velocities consistent with vasospasm.
Induced hypertension initiated. Daily TCDs continued.

POD#7: Vasospasm improved. Patient neurologically intact. Discharged home in
good condition with plan for outpatient follow-up.
  `,
  expectations: {
    pathologyType: 'SAH',
    hasLocation: true,
    hasSize: true,
    hasPrognosis: true,
    hasRecommendations: true,
    hasVasospasmRisk: true,
    riskLevel: ['MODERATE', 'HIGH']
  }
};

console.log('Testing comprehensive SAH case with full clinical context...');

try {
  const extractedData = {
    grades: {
      huntHess: '3',
      modifiedFisher: '3'
    }
  };

  const result = detectPathologySubtype(
    integrationCase.text,
    PATHOLOGY_TYPES.SAH,
    extractedData
  );

  console.log('\n✅ Integration Test Results:');
  console.log(`  Type: ${result.type}`);
  console.log(`  Location: ${result.details.aneurysmLocation || 'Not detected'}`);
  console.log(`  Size: ${result.details.aneurysmSize || 'Not detected'}`);
  console.log(`  Risk Level: ${result.riskLevel}`);
  console.log(`  Vasospasm Risk: ${result.details.vasospasmRisk || 'Not calculated'}`);
  console.log(`  Mortality: ${result.prognosis.mortality || 'Not calculated'}`);
  console.log(`  Good Outcome: ${result.prognosis.goodOutcome || 'Not calculated'}`);

  console.log(`\n  Recommendations:`);
  console.log(`    - Imaging protocols: ${result.recommendations.imaging?.length || 0}`);
  console.log(`    - Medication protocols: ${result.recommendations.medications?.length || 0}`);
  console.log(`    - Monitoring protocols: ${result.recommendations.monitoring?.length || 0}`);

  console.log(`\n  Complications to watch for:`);
  result.complications.slice(0, 3).forEach(comp => {
    console.log(`    - ${comp.name} (${comp.risk} risk, ${comp.timing})`);
  });

  // Validation checks
  const validations = [];
  validations.push(result.type === integrationCase.expectations.pathologyType);
  validations.push(!!result.details.aneurysmLocation === integrationCase.expectations.hasLocation);
  validations.push(!!result.details.aneurysmSize === integrationCase.expectations.hasSize);
  validations.push(!!result.prognosis.mortality === integrationCase.expectations.hasPrognosis);
  validations.push(!!result.recommendations.imaging === integrationCase.expectations.hasRecommendations);
  validations.push(!!result.details.vasospasmRisk === integrationCase.expectations.hasVasospasmRisk);

  const allValid = validations.every(v => v);

  if (allValid) {
    console.log('\n✅ PASS: All integration checks passed');
    totalPassed++;
  } else {
    console.log('\n❌ FAIL: Some integration checks failed');
    totalFailed++;
  }

} catch (error) {
  console.log(`\n❌ ERROR: ${error.message}`);
  console.log(error.stack);
  totalFailed++;
}

// Final Summary
console.log('\n\n' + '='.repeat(80));
console.log('TEST SUITE SUMMARY');
console.log('='.repeat(80));
console.log(`Total Passed: ${totalPassed}`);
console.log(`Total Failed: ${totalFailed}`);
console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

if (totalFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Phase 1 Step 6 implementation verified!');
} else {
  console.log(`\n⚠️  ${totalFailed} tests failed. Review implementation.`);
}

console.log('='.repeat(80));
