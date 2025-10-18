/**
 * Test Completeness Fix for 6-Dimension Quality Metrics
 *
 * This test verifies that the narrative engine now generates
 * all required sections for 95%+ completeness score.
 */

import extractionService from './src/services/extraction.js';
import narrativeEngine from './src/services/narrativeEngine.js';
import qualityMetrics from './src/services/qualityMetrics.js';

const { extractMedicalEntities } = extractionService;
const { generateNarrative } = narrativeEngine;
const { calculateQualityMetrics } = qualityMetrics;

// Test case with comprehensive data
const testNotes = `
Patient Name: John Smith
MRN: 987654
DOB: 1960-05-20
Age: 63 years
Gender: Male
Attending: Dr. Sarah Johnson

CHIEF COMPLAINT:
Sudden onset severe headache and loss of consciousness

HISTORY OF PRESENT ILLNESS:
63-year-old male presented on 11/01/2023 with acute onset severe headache followed by loss of consciousness. CT showed subarachnoid hemorrhage. CTA revealed 7mm anterior communicating artery aneurysm.

HOSPITAL COURSE:
Patient admitted to Neuro ICU on 11/01/2023. Underwent successful coiling of AComm aneurysm on 11/02/2023. Post-procedure, developed mild vasospasm on day 4, managed with hypertensive therapy. EVD placed for hydrocephalus on 11/05/2023. Gradual neurological improvement noted. EVD weaned and removed on 11/12/2023.

PROCEDURES:
1. Endovascular coiling of anterior communicating artery aneurysm - 11/02/2023
2. External ventricular drain placement - 11/05/2023

COMPLICATIONS:
1. Cerebral vasospasm - managed with triple-H therapy
2. Hydrocephalus - managed with EVD

MEDICATIONS ON DISCHARGE:
1. Nimodipine 60mg PO q4h x 21 days
2. Levetiracetam 500mg PO BID
3. Oxycodone 5mg PO q6h PRN pain
4. Docusate 100mg PO BID

PHYSICAL EXAM AT DISCHARGE:
Alert and oriented x3, GCS 15
Motor: 5/5 throughout
Sensory: Intact
Cranial nerves: II-XII intact

IMAGING:
1. CT Head (11/01/2023): Diffuse subarachnoid hemorrhage, Fisher grade 3
2. CTA (11/01/2023): 7mm AComm aneurysm
3. CT Head (11/14/2023): Resolving SAH, no hydrocephalus

LABS:
WBC 8.5, Hgb 12.3, Plt 245
Na 138, K 4.0, Cr 0.9
PT/INR 12.5/1.0

CONSULTATIONS:
1. Neurosurgery - managed EVD
2. Neuro-interventional - performed coiling
3. Physical therapy - recommended outpatient PT

DISCHARGE DISPOSITION:
Discharged home with family on 11/15/2023

DISCHARGE CONDITION:
Stable, ambulatory with supervision

FOLLOW-UP:
1. Neurosurgery clinic in 2 weeks
2. Neuro-interventional clinic in 6 weeks for follow-up angiogram
3. Primary care physician in 1 week
`;

console.log('=====================================');
console.log('COMPLETENESS FIX TEST');
console.log('=====================================\n');

async function testCompletenessImprovement() {
  try {
    const startTime = Date.now();

    // Step 1: Extract data
    console.log('Step 1: Extracting medical entities...');
    const extractedData = await extractMedicalEntities(testNotes);

    // Step 2: Generate narrative with completeness fix
    console.log('Step 2: Generating narrative with ALL sections...');
    const narrative = await generateNarrative(extractedData, testNotes, {
      pathologyType: 'SAH',
      style: 'formal',
      useLLM: false // Force template-based to test section generation
    });

    // List all generated sections
    console.log('\n📋 GENERATED SECTIONS:');
    const sections = Object.keys(narrative).filter(k =>
      k !== 'metadata' &&
      k !== 'qualityMetrics' &&
      narrative[k] !== null &&
      narrative[k] !== undefined
    );

    sections.forEach((section, i) => {
      const hasContent = narrative[section] &&
        (typeof narrative[section] === 'string' ? narrative[section].length > 0 : true);
      const status = hasContent ? '✅' : '❌';
      console.log(`${i + 1}. ${status} ${section}`);
    });

    // Step 3: Calculate quality metrics
    console.log('\nStep 3: Calculating 6-dimension quality metrics...');

    const performanceMetrics = {
      processingTime: Date.now() - startTime,
      extractionTime: 500,
      narrativeTime: 1500,
      qualityTime: 100
    };

    const quality = calculateQualityMetrics(
      extractedData,
      narrative,
      testNotes,
      performanceMetrics,
      {
        strictMode: false, // Don't apply penalty for testing
        extractionMethod: 'hybrid'
      }
    );

    // Display results
    console.log('\n=====================================');
    console.log('QUALITY METRICS RESULTS');
    console.log('=====================================');

    console.log(`\n📊 Overall Quality: ${quality.overall.percentage}% (${quality.overall.rating.rating})`);
    console.log(`   Confidence: ${Math.round(quality.overall.confidence * 100)}%`);

    console.log('\n📈 Dimension Scores:');
    console.log(`   Completeness (30%): ${Math.round(quality.dimensions.completeness.score * 100)}% ${quality.dimensions.completeness.score >= 0.95 ? '✅' : '⚠️'}`);
    console.log(`   Accuracy (25%): ${Math.round(quality.dimensions.accuracy.score * 100)}%`);
    console.log(`   Consistency (20%): ${Math.round(quality.dimensions.consistency.score * 100)}%`);
    console.log(`   Narrative Quality (15%): ${Math.round(quality.dimensions.narrativeQuality.score * 100)}%`);
    console.log(`   Specificity (5%): ${Math.round(quality.dimensions.specificity.score * 100)}%`);
    console.log(`   Timeliness (5%): ${Math.round(quality.dimensions.timeliness.score * 100)}%`);

    // Detailed completeness breakdown
    console.log('\n📋 COMPLETENESS BREAKDOWN:');
    const comp = quality.dimensions.completeness;

    if (comp.details) {
      console.log(`   Critical Sections: ${comp.details.criticalSections.points}/${comp.details.criticalSections.maxPoints}`);

      // Show missing critical sections
      const criticalIssues = comp.details.criticalSections.issues || [];
      if (criticalIssues.length > 0) {
        console.log('   Missing Critical:');
        criticalIssues.forEach(issue => {
          console.log(`     - ${issue.section}`);
        });
      }

      console.log(`   Important Sections: ${comp.details.importantSections.points}/${comp.details.importantSections.maxPoints}`);

      // Show missing important sections
      const importantIssues = comp.details.importantSections.issues || [];
      if (importantIssues.length > 0) {
        console.log('   Missing Important:');
        importantIssues.forEach(issue => {
          console.log(`     - ${issue.section}`);
        });
      }

      console.log(`   Field Completeness: ${Math.round(comp.details.fieldCompleteness.points / comp.details.fieldCompleteness.maxPoints * 100)}%`);
    }

    // Issues summary
    console.log('\n⚠️ ISSUES SUMMARY:');
    console.log(`   Total: ${quality.summary.totalIssues}`);
    console.log(`   Critical: ${quality.summary.criticalIssues}`);
    console.log(`   Major: ${quality.summary.majorIssues}`);
    console.log(`   Minor: ${quality.summary.minorIssues}`);

    // Top issues
    if (quality.issues.length > 0) {
      console.log('\n🔍 TOP ISSUES:');
      quality.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}] ${issue.type}`);
        if (issue.suggestion) {
          console.log(`      → ${issue.suggestion}`);
        }
      });
    }

    // Final verdict
    console.log('\n=====================================');
    console.log('TEST RESULTS');
    console.log('=====================================');

    const completenessTarget = 0.95; // 95% target
    const overallTarget = 0.85; // 85% overall target

    const completenessPass = quality.dimensions.completeness.score >= completenessTarget;
    const overallPass = quality.overall.score >= overallTarget;

    console.log(`\nCompleteness Test: ${completenessPass ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Score: ${Math.round(quality.dimensions.completeness.score * 100)}%`);
    console.log(`  Target: ${Math.round(completenessTarget * 100)}%`);

    console.log(`\nOverall Quality Test: ${overallPass ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Score: ${Math.round(quality.overall.score * 100)}%`);
    console.log(`  Target: ${Math.round(overallTarget * 100)}%`);

    console.log(`\nProcessing Time: ${Date.now() - startTime}ms`);

    // Return success status
    return {
      success: completenessPass && overallPass,
      completenessScore: quality.dimensions.completeness.score,
      overallScore: quality.overall.score,
      sectionsGenerated: sections.length,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
console.log('Starting completeness improvement test...\n');
testCompletenessImprovement()
  .then(result => {
    console.log('\n=====================================');
    console.log('TEST COMPLETE');
    console.log('=====================================');

    if (result.success) {
      console.log('✅ SUCCESS: Completeness fix is working!');
      console.log(`   Completeness: ${Math.round(result.completenessScore * 100)}%`);
      console.log(`   Overall Quality: ${Math.round(result.overallScore * 100)}%`);
      console.log(`   Sections Generated: ${result.sectionsGenerated}`);
    } else {
      console.log('❌ FAILURE: Completeness still needs work');
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }

    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });