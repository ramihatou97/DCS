/**
 * Test Phase 1 & 2 Optimizations
 * 
 * Tests:
 * 1. Fast models vs standard models
 * 2. Caching effectiveness
 * 3. Parallel processing speedup
 * 4. Quality maintenance
 * 5. preserveAllInfo option
 */

import { orchestrateSummaryGeneration } from './src/services/summaryOrchestrator.js';
import { clearCache, getCacheStats } from './src/utils/performanceCache.js';
import fs from 'fs';

// Sample clinical note (SAH case)
const sampleNote = `
ADMISSION NOTE - NEUROSURGERY

Patient: Jane Doe
MRN: 12345678
DOB: 01/15/1965
Admission Date: 10/01/2024
Attending: Dr. Smith

CHIEF COMPLAINT:
Sudden severe headache

HISTORY OF PRESENT ILLNESS:
58-year-old female presented to ED on 10/01/2024 with sudden onset severe headache ("worst headache of my life"), nausea, vomiting, and photophobia. Symptoms started while at work. No loss of consciousness. No focal neurological deficits noted.

PAST MEDICAL HISTORY:
- Hypertension (controlled on lisinopril)
- No prior surgeries

PHYSICAL EXAM:
Vitals: BP 165/95, HR 88, RR 16, Temp 98.6F
Neuro: GCS 15, alert and oriented x3
Motor: 5/5 all extremities
Sensory: Intact
Cranial nerves: II-XII intact
Neck: Mild nuchal rigidity

IMAGING:
CT Head (10/01/2024): Diffuse subarachnoid hemorrhage, Fisher Grade 3
CTA Head (10/01/2024): 7mm right PCOM aneurysm

HOSPITAL COURSE:

10/01/2024 (Day 1):
- Admitted to Neuro ICU
- Started nimodipine 60mg PO q4h for vasospasm prophylaxis
- External ventricular drain (EVD) placed by Dr. Smith for hydrocephalus management
- Opening pressure 25 cm H2O, draining clear CSF

10/02/2024 (Day 2):
- Underwent endovascular coiling of right PCOM aneurysm by Dr. Johnson (Interventional Neuroradiology)
- Procedure successful, complete occlusion achieved
- Post-procedure: Neurologically intact, GCS 15

10/03-10/07/2024 (Days 3-7):
- Monitored for vasospasm with daily TCDs
- EVD weaned gradually, ICP remained <15 mmHg
- No vasospasm detected
- Remained neurologically stable

10/08/2024 (Day 8):
- EVD removed successfully
- CT head: Resolving SAH, no new hemorrhage
- Cleared by PT/OT: Ambulating independently, no deficits

DISCHARGE STATUS (10/08/2024):
- Neurological exam: GCS 15, no focal deficits
- Motor: 5/5 all extremities
- Ambulating independently
- mRS: 0
- KPS: 90

DISCHARGE MEDICATIONS:
1. Nimodipine 60mg PO q4h x 21 days (continue until 10/22/2024)
2. Levetiracetam 500mg PO BID x 7 days (seizure prophylaxis)
3. Lisinopril 10mg PO daily (home medication)
4. Acetaminophen 650mg PO q6h PRN headache

DISCHARGE DISPOSITION:
Home with family support

FOLLOW-UP:
1. Neurosurgery clinic in 2 weeks (Dr. Smith)
2. CTA head in 6 months to assess aneurysm occlusion
3. Return to ED for severe headache, vision changes, weakness, or seizures
`;

/**
 * Test Configuration
 */
const testConfigs = [
  {
    name: 'Standard Models (Baseline)',
    options: {
      useFastModel: false,
      enableCache: false,
      preserveAllInfo: true
    }
  },
  {
    name: 'Fast Models (No Cache)',
    options: {
      useFastModel: true,
      enableCache: false,
      preserveAllInfo: false
    }
  },
  {
    name: 'Fast Models + Cache (First Run)',
    options: {
      useFastModel: true,
      enableCache: true,
      preserveAllInfo: false
    }
  },
  {
    name: 'Fast Models + Cache (Second Run - Cache Hit)',
    options: {
      useFastModel: true,
      enableCache: true,
      preserveAllInfo: false
    }
  },
  {
    name: 'Fast Models + preserveAllInfo',
    options: {
      useFastModel: true,
      enableCache: true,
      preserveAllInfo: true
    }
  }
];

/**
 * Run test with specific configuration
 */
async function runTest(config, testNumber) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${testNumber}: ${config.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log('Options:', JSON.stringify(config.options, null, 2));

  const startTime = Date.now();

  try {
    const result = await orchestrateSummaryGeneration(sampleNote, {
      ...config.options,
      enableLearning: false,
      enableFeedbackLoops: false
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ Test completed in ${duration.toFixed(2)}s`);

    // Extract quality metrics
    const quality = result.qualityMetrics || {};
    console.log('\n📊 QUALITY METRICS:');
    console.log(`  Overall: ${(quality.overall * 100).toFixed(1)}%`);
    console.log(`  Completeness: ${(quality.completeness * 100).toFixed(1)}%`);
    console.log(`  Accuracy: ${(quality.accuracy * 100).toFixed(1)}%`);
    console.log(`  Consistency: ${(quality.consistency * 100).toFixed(1)}%`);
    console.log(`  Narrative Quality: ${(quality.narrativeQuality * 100).toFixed(1)}%`);
    console.log(`  Specificity: ${(quality.specificity * 100).toFixed(1)}%`);
    console.log(`  Timeliness: ${(quality.timeliness * 100).toFixed(1)}%`);

    // Cache stats
    const cacheStats = getCacheStats();
    console.log('\n💾 CACHE STATS:');
    console.log(`  Extraction: ${cacheStats.extraction?.active || 0} active, ${cacheStats.extraction?.expired || 0} expired`);
    console.log(`  Narrative: ${cacheStats.narrative?.active || 0} active, ${cacheStats.narrative?.expired || 0} expired`);
    console.log(`  LLM: ${cacheStats.llm?.active || 0} active, ${cacheStats.llm?.expired || 0} expired`);

    return {
      config: config.name,
      duration,
      quality,
      cacheStats,
      success: true
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.error(`\n❌ Test failed after ${duration.toFixed(2)}s`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return {
      config: config.name,
      duration,
      error: error.message,
      success: false
    };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 PHASE 1 & 2 OPTIMIZATION TESTS');
  console.log('='.repeat(80));
  console.log('Testing:');
  console.log('  1. Fast models vs standard models');
  console.log('  2. Caching effectiveness');
  console.log('  3. Quality maintenance');
  console.log('  4. preserveAllInfo option');
  console.log('='.repeat(80));

  const results = [];

  // Clear cache before starting
  clearCache();
  console.log('\n🧹 Cache cleared');

  // Run all tests
  for (let i = 0; i < testConfigs.length; i++) {
    const result = await runTest(testConfigs[i], i + 1);
    results.push(result);

    // Wait 2 seconds between tests
    if (i < testConfigs.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Print summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(80)}`);

  console.log('\n| Test | Duration | Quality | Status |');
  console.log('|------|----------|---------|--------|');

  for (const result of results) {
    const duration = result.duration.toFixed(2) + 's';
    const quality = result.quality ? (result.quality.overall * 100).toFixed(1) + '%' : 'N/A';
    const status = result.success ? '✅' : '❌';
    console.log(`| ${result.config} | ${duration} | ${quality} | ${status} |`);
  }

  // Calculate speedup
  const baseline = results[0];
  const fastNoCache = results[1];
  const fastWithCache = results[3]; // Second run with cache

  if (baseline.success && fastNoCache.success) {
    const speedup = ((baseline.duration - fastNoCache.duration) / baseline.duration * 100).toFixed(1);
    console.log(`\n⚡ SPEEDUP (Fast Models): ${speedup}% faster`);
    console.log(`   Baseline: ${baseline.duration.toFixed(2)}s → Fast: ${fastNoCache.duration.toFixed(2)}s`);
  }

  if (baseline.success && fastWithCache.success) {
    const speedup = ((baseline.duration - fastWithCache.duration) / baseline.duration * 100).toFixed(1);
    console.log(`\n⚡ SPEEDUP (Fast Models + Cache): ${speedup}% faster`);
    console.log(`   Baseline: ${baseline.duration.toFixed(2)}s → Fast+Cache: ${fastWithCache.duration.toFixed(2)}s`);
  }

  // Quality comparison
  console.log('\n📊 QUALITY COMPARISON:');
  for (const result of results) {
    if (result.success && result.quality) {
      console.log(`  ${result.config}: ${(result.quality.overall * 100).toFixed(1)}%`);
    }
  }

  // Save results to file
  const resultsFile = 'PHASE1_TEST_RESULTS.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to ${resultsFile}`);

  console.log('\n✅ All tests complete!');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

