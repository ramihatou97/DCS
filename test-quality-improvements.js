#!/usr/bin/env node

/**
 * Test Quality Improvements for Specificity and Timeliness
 */

import { extractMedicalEntities } from './src/services/extraction.js';
import { generateNarrative } from './src/services/narrativeEngine.js';
import { calculateQualityMetrics } from './src/services/qualityMetrics.js';
import { measurePerformanceAsync } from './src/utils/performanceCache.js';

const testCase = `
DISCHARGE SUMMARY

Patient: Sarah Johnson
MRN: 123456
DOB: 3/15/1955
Age: 68 years
Gender: Female

Admission Date: 12/1/2023
Discharge Date: 12/12/2023

PRIMARY DIAGNOSIS:
Ischemic stroke, left MCA territory
- NIHSS 8 on admission, 3 at discharge
- 2.5cm infarct in left frontal lobe

HOSPITAL COURSE:
Patient presented with acute onset right-sided weakness and aphasia.
CT showed left MCA stroke. She received tPA within 3-hour window.
Hospital course complicated by:
1. Aspiration pneumonia on day 3, treated with antibiotics
2. Urinary tract infection on day 5, treated with ciprofloxacin
3. Mild dysphagia requiring modified diet

She underwent 2 procedures:
1. Mechanical thrombectomy on 12/1/2023
2. PEG tube placement on 12/8/2023

MEDICATIONS AT DISCHARGE (5 total):
1. Aspirin 81mg PO daily
2. Atorvastatin 80mg PO daily
3. Lisinopril 10mg PO daily
4. Metoprolol 25mg PO BID
5. Ciprofloxacin 500mg PO BID x 3 days

LAB RESULTS (3 tests):
1. WBC: 12.3 K/uL (ref: 4-11)
2. Hemoglobin: 11.2 g/dL (ref: 12-16)
3. Creatinine: 1.1 mg/dL (ref: 0.6-1.2)

IMAGING (2 studies):
1. CT Head (12/1): Left MCA infarct, 2.5cm
2. MRI Brain (12/3): Confirmed left frontal infarct, no hemorrhage

CONSULTATIONS (3 obtained):
1. Neurology: Recommended antiplatelet therapy
2. Speech therapy: Modified diet, outpatient therapy
3. Physical therapy: Inpatient rehab recommended

FOLLOW-UP (4 appointments):
1. Neurology in 2 weeks
2. Primary care in 1 week
3. Speech therapy starting 12/15
4. Physical therapy at rehab facility

DISCHARGE DISPOSITION:
Acute inpatient rehabilitation facility
`;

async function testQualityImprovements() {
  console.log('=====================================');
  console.log('QUALITY IMPROVEMENTS TEST');
  console.log('=====================================\n');

  const startTime = Date.now();

  // Extract with performance measurement
  console.log('Step 1: Extracting medical entities...');
  const extractedData = await measurePerformanceAsync('extraction', async () => {
    return await extractMedicalEntities(testCase);
  });

  // Generate narrative with template-based (faster) method
  console.log('\nStep 2: Generating narrative (template-based for speed)...');
  const narrative = await measurePerformanceAsync('narrative', async () => {
    return await generateNarrative(extractedData, testCase, {
      useLLM: false, // Force template for consistent testing
      applyLearnedPatterns: false // Disable ML for speed
    });
  });

  const totalTime = Date.now() - startTime;

  // Calculate quality metrics
  console.log('\nStep 3: Calculating quality metrics...');
  const metrics = {
    processingTime: totalTime,
    extractionTime: Math.round(totalTime * 0.75), // Estimate
    narrativeTime: Math.round(totalTime * 0.25)    // Estimate
  };

  const qualityResult = await calculateQualityMetrics(
    narrative,
    extractedData,
    metrics,
    testCase
  );

  // Display results
  console.log('\n=====================================');
  console.log('QUALITY METRICS RESULTS');
  console.log('=====================================\n');

  console.log(`📊 Overall Quality: ${Math.round(qualityResult.overall * 100)}%\n`);

  console.log('📈 Dimension Scores:');
  for (const [dimension, data] of Object.entries(qualityResult.dimensions || {})) {
    const percentage = Math.round(data.score * 100);
    const status = percentage >= 95 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`   ${dimension} (${Math.round(data.weight * 100)}%): ${percentage}% ${status}`);
  }

  // Check for vague terms in narrative
  console.log('\n🔍 SPECIFICITY CHECK:');
  const narrativeText = JSON.stringify(narrative).toLowerCase();
  const vagueTerms = ['multiple', 'several', 'various', 'numerous', 'many', 'few', 'some'];
  const foundVague = vagueTerms.filter(term => narrativeText.includes(term));

  if (foundVague.length === 0) {
    console.log('   ✅ No vague quantifiers found!');
  } else {
    console.log(`   ⚠️ Found vague terms: ${foundVague.join(', ')}`);
  }

  // Check specific improvements
  console.log('\n📋 SPECIFIC IMPROVEMENTS:');

  // Check if exact counts are used
  const hasExactCounts = narrativeText.includes('5 total') ||
                        narrativeText.includes('3 tests') ||
                        narrativeText.includes('2 studies') ||
                        narrativeText.includes('3 obtained') ||
                        narrativeText.includes('4 appointments');

  console.log(`   Exact counts used: ${hasExactCounts ? '✅ Yes' : '❌ No'}`);

  // Check if specific timeframes are used
  const hasSpecificTimeframes = narrativeText.includes('2 weeks') ||
                                narrativeText.includes('1 week') ||
                                narrativeText.includes('3 days');

  console.log(`   Specific timeframes: ${hasSpecificTimeframes ? '✅ Yes' : '❌ No'}`);

  // Performance check
  console.log('\n⏱️ PERFORMANCE:');
  console.log(`   Total processing time: ${totalTime}ms`);
  console.log(`   Target: 3000ms`);
  console.log(`   Status: ${totalTime <= 3000 ? '✅ PASSED' : totalTime <= 5000 ? '⚠️ ACCEPTABLE' : '❌ TOO SLOW'}`);

  // Final verdict
  console.log('\n=====================================');
  console.log('TEST RESULTS');
  console.log('=====================================\n');

  const specificityScore = qualityResult.dimensions?.specificity?.score || 0;
  const timelinessScore = qualityResult.dimensions?.timeliness?.score || 0;

  console.log(`Specificity: ${Math.round(specificityScore * 100)}% (Target: 95%+)`);
  console.log(`   Status: ${specificityScore >= 0.95 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);

  console.log(`\nTimeliness: ${Math.round(timelinessScore * 100)}% (Target: 95%+)`);
  console.log(`   Status: ${timelinessScore >= 0.95 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);

  console.log(`\nOverall Quality: ${Math.round(qualityResult.overall * 100)}%`);
  console.log(`   Status: ${qualityResult.overall >= 0.95 ? '✅ EXCELLENT' : qualityResult.overall >= 0.85 ? '⚠️ GOOD' : '❌ NEEDS WORK'}`);

  return {
    specificity: specificityScore,
    timeliness: timelinessScore,
    overall: qualityResult.overall,
    processingTime: totalTime
  };
}

// Run test
testQualityImprovements()
  .then(results => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });