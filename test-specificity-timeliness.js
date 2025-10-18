#!/usr/bin/env node

/**
 * Test Specificity and Timeliness Issues
 *
 * This script diagnoses why specificity is at 80% and timeliness at 48%
 */

import { extractMedicalEntities } from './src/services/extraction.js';
import { generateNarrative } from './src/services/narrativeEngine.js';
import { calculateSpecificityScore } from './src/services/quality/specificityScorer.js';
import { calculateTimelinessScore } from './src/services/quality/timelinessScorer.js';

// Test case with SAH patient
const testCase = {
  text: `
    DISCHARGE SUMMARY

    Patient: John Smith
    MRN: 987654
    DOB: 5/20/1960
    Age: 63 years
    Gender: Male

    Admission Date: 11/1/2023
    Discharge Date: 11/15/2023

    PRIMARY DIAGNOSIS:
    Aneurysmal subarachnoid hemorrhage (aSAH)
    - Hunt-Hess grade 3
    - Fisher grade 3
    - 7mm anterior communicating artery aneurysm

    HOSPITAL COURSE:
    Mr. Smith presented with sudden severe headache and brief loss of consciousness.
    CT head showed diffuse SAH, Fisher grade 3. CTA revealed 7mm AComm aneurysm.
    He underwent successful endovascular coiling on 11/2/2023.

    Post-procedure course was complicated by:
    - Mild vasospasm on day 5, managed with hypertensive therapy
    - Hydrocephalus requiring EVD placement on 11/5/2023

    GCS improved from 13 to 15. No seizures occurred.
    EVD weaned and removed on 11/12/2023.

    MEDICATIONS AT DISCHARGE:
    1. Nimodipine 60mg PO q4h x 21 days total
    2. Levetiracetam 500mg PO BID x 7 days
    3. Oxycodone 5mg PO q6h PRN pain
    4. Docusate 100mg PO BID

    FOLLOW-UP:
    - Neurosurgery clinic in 2 weeks
    - Repeat angiogram in 6 weeks
    - Primary care physician in 1 week

    DISCHARGE DISPOSITION:
    Home with family
  `,
  expectedPathology: 'SAH'
};

async function analyzeSpecificityIssues() {
  console.log('=====================================');
  console.log('SPECIFICITY & TIMELINESS ANALYSIS');
  console.log('=====================================\n');

  // Track timing
  const startTime = Date.now();
  const timingMetrics = {};

  // Step 1: Extract with timing
  console.log('Step 1: Extracting medical entities...');
  const extractionStart = Date.now();
  const extractedData = await extractMedicalEntities(testCase.text);
  timingMetrics.extractionTime = Date.now() - extractionStart;
  console.log(`   Extraction time: ${timingMetrics.extractionTime}ms\n`);

  // Step 2: Generate narrative with timing
  console.log('Step 2: Generating narrative...');
  const narrativeStart = Date.now();
  const narrative = await generateNarrative(extractedData, { useLLM: false });
  timingMetrics.narrativeTime = Date.now() - narrativeStart;
  console.log(`   Narrative generation time: ${timingMetrics.narrativeTime}ms\n`);

  timingMetrics.processingTime = Date.now() - startTime;
  console.log(`   Total processing time: ${timingMetrics.processingTime}ms\n`);

  // Step 3: Analyze specificity
  console.log('Step 3: Analyzing SPECIFICITY issues...');
  const specificityResult = calculateSpecificityScore(narrative, extractedData);

  console.log(`\n📊 SPECIFICITY SCORE: ${Math.round(specificityResult.score * 100)}%`);
  console.log('\nSpecificity Breakdown:');
  console.log(`   Value Specificity: ${specificityResult.details.valueSpecificity.specificChecks}/${specificityResult.details.valueSpecificity.totalChecks}`);
  console.log(`   Temporal Specificity: ${specificityResult.details.temporalSpecificity.specificChecks}/${specificityResult.details.temporalSpecificity.totalChecks}`);
  console.log(`   Clinical Detail: ${specificityResult.details.clinicalSpecificity.specificChecks}/${specificityResult.details.clinicalSpecificity.totalChecks}`);
  console.log(`   Medication Specificity: ${specificityResult.details.medicationSpecificity.specificChecks}/${specificityResult.details.medicationSpecificity.totalChecks}`);
  console.log(`   Procedure Specificity: ${specificityResult.details.procedureSpecificity.specificChecks}/${specificityResult.details.procedureSpecificity.totalChecks}`);

  console.log('\n🔍 SPECIFICITY ISSUES:');
  const specificityIssues = specificityResult.issues.slice(0, 10);
  for (const issue of specificityIssues) {
    console.log(`   [${issue.severity}] ${issue.type}`);
    if (issue.term) console.log(`      Term: "${issue.term}"`);
    if (issue.field) console.log(`      Field: ${issue.field}`);
    if (issue.value) console.log(`      Value: ${issue.value}`);
    console.log(`      → ${issue.suggestion}`);
  }

  // Step 4: Analyze timeliness
  console.log('\n\nStep 4: Analyzing TIMELINESS issues...');
  const timelinessResult = calculateTimelinessScore(timingMetrics, extractedData);

  console.log(`\n⏱️ TIMELINESS SCORE: ${Math.round(timelinessResult.score * 100)}%`);
  console.log('\nTimeliness Breakdown:');
  console.log(`   Processing Speed: ${timelinessResult.details.processingSpeed.points}/${timelinessResult.details.processingSpeed.maxPoints}`);
  console.log(`   Component Performance: ${timelinessResult.details.componentPerformance.points}/${timelinessResult.details.componentPerformance.maxPoints}`);
  console.log(`   Extraction Efficiency: ${timelinessResult.details.extractionEfficiency.points}/${timelinessResult.details.extractionEfficiency.maxPoints}`);
  console.log(`   Narrative Generation: ${timelinessResult.details.narrativeGeneration.points}/${timelinessResult.details.narrativeGeneration.maxPoints}`);

  console.log('\n🔍 TIMELINESS ISSUES:');
  const timelinessIssues = timelinessResult.issues.slice(0, 10);
  for (const issue of timelinessIssues) {
    console.log(`   [${issue.severity}] ${issue.type}`);
    if (issue.time) console.log(`      Time: ${issue.time}ms`);
    if (issue.target) console.log(`      Target: ${issue.target}ms`);
    console.log(`      → ${issue.suggestion}`);
  }

  console.log('\n⚡ PERFORMANCE BOTTLENECKS:');
  for (const bottleneck of timelinessResult.bottlenecks || []) {
    console.log(`   - ${bottleneck.component}: ${bottleneck.issue}`);
  }

  // Check narrative for vague terms
  console.log('\n\n📝 CHECKING NARRATIVE FOR VAGUE TERMS:');
  const narrativeText = JSON.stringify(narrative).toLowerCase();
  const vagueTerms = ['several', 'multiple', 'numerous', 'many', 'few', 'some', 'various'];
  const foundVagueTerms = [];

  for (const term of vagueTerms) {
    if (narrativeText.includes(term)) {
      foundVagueTerms.push(term);
    }
  }

  if (foundVagueTerms.length > 0) {
    console.log('   Found vague terms:', foundVagueTerms.join(', '));

    // Show context for each vague term
    for (const term of foundVagueTerms) {
      const regex = new RegExp(`.{0,30}${term}.{0,30}`, 'gi');
      const matches = narrativeText.match(regex) || [];
      if (matches.length > 0) {
        console.log(`\n   Context for "${term}":`);
        matches.slice(0, 2).forEach(match => {
          console.log(`      ...${match}...`);
        });
      }
    }
  } else {
    console.log('   ✅ No vague terms found');
  }

  return {
    specificity: specificityResult,
    timeliness: timelinessResult,
    timingMetrics,
    foundVagueTerms
  };
}

// Run the analysis
analyzeSpecificityIssues()
  .then(results => {
    console.log('\n=====================================');
    console.log('ANALYSIS COMPLETE');
    console.log('=====================================');
    console.log(`Specificity: ${Math.round(results.specificity.score * 100)}%`);
    console.log(`Timeliness: ${Math.round(results.timeliness.score * 100)}%`);
    console.log(`Processing Time: ${results.timingMetrics.processingTime}ms`);

    if (results.specificity.score < 0.95) {
      console.log('\n❌ Specificity needs improvement (target: 95%+)');
    }
    if (results.timeliness.score < 0.95) {
      console.log('❌ Timeliness needs improvement (target: 95%+)');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });