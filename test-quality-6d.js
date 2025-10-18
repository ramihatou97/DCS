/**
 * Test 6-Dimension Quality Metrics System
 *
 * This test validates the new 6-dimension quality scoring system
 * using the Robert Chen test case.
 *
 * Dimensions tested:
 * 1. Completeness (30%)
 * 2. Accuracy (25%)
 * 3. Consistency (20%)
 * 4. Narrative Quality (15%)
 * 5. Specificity (5%)
 * 6. Timeliness (5%)
 */

import extractionService from './src/services/extraction.js';
import narrativeEngine from './src/services/narrativeEngine.js';
import qualityMetrics from './src/services/qualityMetrics.js';

const { extractMedicalEntities } = extractionService;
const { generateNarrative } = narrativeEngine;
const { calculateQualityMetrics } = qualityMetrics;

// Robert Chen test case - comprehensive neurosurgery case
const testNotes = `
Patient Name: Robert Chen
MRN: 123456
DOB: 1965-03-15
Age: 58 years
Gender: Male
Attending: Dr. Michael Johnson

CHIEF COMPLAINT:
Severe headache, confusion, and right-sided weakness

HISTORY OF PRESENT ILLNESS:
Mr. Chen is a 58-year-old male who presented on 10/14/2023 with acute onset severe headache, confusion, and progressive right-sided weakness over the past 3 days. Initial CT showed a large left frontoparietal mass with significant midline shift and surrounding edema.

HOSPITAL COURSE:
The patient was admitted on 10/14/2023 for urgent neurosurgical evaluation. MRI revealed a 4.5 x 3.8 cm heterogeneous mass in the left frontoparietal region with marked perilesional edema and 12mm midline shift.

On 10/15/2023, the patient underwent left frontoparietal craniotomy for tumor resection. Intraoperative frozen section suggested high-grade glioma. Gross total resection was achieved with motor mapping and awake craniotomy technique.

Post-operatively, the patient was monitored in the Neuro ICU. Initial GCS was 13, improving to 15 by POD#1. Right-sided weakness improved from 3/5 to 4/5 strength. The patient developed mild expressive aphasia POD#2 which gradually improved with speech therapy.

Pathology confirmed WHO Grade IV glioblastoma multiforme, IDH-wildtype, MGMT methylated.

COMPLICATIONS:
- Post-operative cerebral edema managed with dexamethasone
- Transient expressive aphasia (resolved)
- Mild surgical site CSF leak (managed conservatively)

PROCEDURES:
10/15/2023 - Left frontoparietal craniotomy with tumor resection

MEDICATIONS ON DISCHARGE:
- Keppra 750mg PO BID (seizure prophylaxis)
- Dexamethasone 4mg PO BID with taper schedule
- Omeprazole 20mg PO daily
- Acetaminophen 650mg PO q6h PRN pain
- Oxycodone 5mg PO q4h PRN severe pain
- Docusate 100mg PO BID

FUNCTIONAL STATUS:
KPS: 70 (Cares for self, unable to carry on normal activity)
ECOG Performance Status: 2
mRS: 3

IMAGING:
Post-operative MRI (10/17/2023): Gross total resection confirmed, expected post-surgical changes, no hemorrhage

DISCHARGE DISPOSITION:
Discharged home with services on 10/22/2023

DISCHARGE CONDITION:
Stable, ambulating with assistance, mild residual right-sided weakness

FOLLOW-UP:
1. Neurosurgery clinic in 2 weeks for wound check
2. Neuro-oncology referral for adjuvant therapy planning
3. Radiation oncology consultation
4. Physical therapy 2x/week
5. Speech therapy 1x/week

PROGNOSIS:
Guarded given diagnosis of glioblastoma, but favorable prognostic markers (MGMT methylation) present
`;

console.log('====================================');
console.log('6-DIMENSION QUALITY METRICS TEST');
console.log('====================================\n');

async function testQualitySystem() {
  try {
    const startTime = Date.now();

    // Step 1: Extract structured data
    console.log('Step 1: Extracting structured data...');
    const extractedData = await extractMedicalEntities(testNotes);

    // Step 2: Generate narrative
    console.log('Step 2: Generating narrative sections...');
    const narrative = await generateNarrative(extractedData, testNotes);

    // Step 3: Calculate quality metrics
    console.log('Step 3: Calculating 6-dimension quality metrics...\n');

    // Performance metrics for timeliness dimension
    const processingTime = Date.now() - startTime;
    const performanceMetrics = {
      processingTime,
      extractionTime: 500, // Mock timing
      narrativeTime: 1200, // Mock timing
      qualityTime: 100, // Mock timing
      formattingTime: 50, // Mock timing
      cacheHits: 8,
      cacheMisses: 2
    };

    // Calculate quality with all dimensions
    const quality = calculateQualityMetrics(
      extractedData,
      narrative,
      testNotes,
      performanceMetrics,
      {
        strictMode: true,
        strictValidation: true,
        checkHallucinations: true,
        checkCrossReferences: true,
        checkReadability: true,
        checkProfessionalism: true,
        requirePreciseValues: true,
        checkDataFreshness: true,
        targetProcessingTime: 2000,
        maxAcceptableTime: 5000,
        extractionMethod: 'hybrid',
        noteCount: 1
      }
    );

    // Display overall results
    console.log('====================================');
    console.log('OVERALL QUALITY ASSESSMENT');
    console.log('====================================');
    console.log(`Score: ${quality.overall.percentage}%`);
    console.log(`Rating: ${quality.overall.rating.rating} ${quality.overall.rating.emoji}`);
    console.log(`Confidence: ${Math.round(quality.overall.confidence * 100)}%`);
    console.log();

    // Display dimension scores
    console.log('====================================');
    console.log('DIMENSION SCORES');
    console.log('====================================');
    console.log(`1. Completeness (30%): ${Math.round(quality.dimensions.completeness.score * 100)}%`);
    console.log(`2. Accuracy (25%): ${Math.round(quality.dimensions.accuracy.score * 100)}%`);
    console.log(`3. Consistency (20%): ${Math.round(quality.dimensions.consistency.score * 100)}%`);
    console.log(`4. Narrative Quality (15%): ${Math.round(quality.dimensions.narrativeQuality.score * 100)}%`);
    console.log(`5. Specificity (5%): ${Math.round(quality.dimensions.specificity.score * 100)}%`);
    console.log(`6. Timeliness (5%): ${Math.round(quality.dimensions.timeliness.score * 100)}%`);
    console.log();

    // Display issue summary
    console.log('====================================');
    console.log('ISSUE SUMMARY');
    console.log('====================================');
    console.log(`Total Issues: ${quality.summary.totalIssues}`);
    console.log(`- Critical: ${quality.summary.criticalIssues}`);
    console.log(`- Major: ${quality.summary.majorIssues}`);
    console.log(`- Minor: ${quality.summary.minorIssues}`);
    console.log(`- Warnings: ${quality.summary.warnings}`);
    console.log();

    // Display top issues
    if (quality.issues.length > 0) {
      console.log('====================================');
      console.log('TOP ISSUES');
      console.log('====================================');
      quality.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
        if (issue.suggestion) {
          console.log(`   Suggestion: ${issue.suggestion}`);
        }
      });
      console.log();
    }

    // Display recommendations
    if (quality.recommendations.length > 0) {
      console.log('====================================');
      console.log('RECOMMENDATIONS');
      console.log('====================================');
      quality.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        if (rec.details) {
          console.log(`   Details: ${rec.details}`);
        }
      });
      console.log();
    }

    // Display dimension details
    console.log('====================================');
    console.log('DIMENSION DETAILS');
    console.log('====================================');

    // Completeness details
    console.log('\n📊 COMPLETENESS (30% weight):');
    const comp = quality.dimensions.completeness;
    console.log(`  Critical sections: ${comp.details.criticalSections.points}/${comp.details.criticalSections.maxPoints}`);
    console.log(`  Important sections: ${comp.details.importantSections.points}/${comp.details.importantSections.maxPoints}`);
    console.log(`  Field completeness: ${Math.round(comp.details.fieldCompleteness.points / comp.details.fieldCompleteness.maxPoints * 100)}%`);
    if (comp.issues.length > 0) {
      console.log(`  Issues: ${comp.issues.length} found`);
    }

    // Accuracy details
    console.log('\n✅ ACCURACY (25% weight):');
    const acc = quality.dimensions.accuracy;
    console.log(`  Demographics: ${Math.round(acc.details.demographics.accurateChecks / acc.details.demographics.totalChecks * 100)}%`);
    console.log(`  Dates: ${Math.round(acc.details.dates.accurateChecks / acc.details.dates.totalChecks * 100)}%`);
    console.log(`  Medications: ${Math.round(acc.details.medications.accurateChecks / acc.details.medications.totalChecks * 100)}%`);
    console.log(`  Procedures: ${Math.round(acc.details.procedures.accurateChecks / acc.details.procedures.totalChecks * 100)}%`);
    if (acc.details.hallucinations) {
      console.log(`  Hallucinations: ${acc.details.hallucinations.issues.length > 0 ? 'Detected' : 'None'}`);
    }

    // Consistency details
    console.log('\n🔄 CONSISTENCY (20% weight):');
    const cons = quality.dimensions.consistency;
    console.log(`  Date consistency: ${Math.round(cons.details.dateConsistency.consistentChecks / cons.details.dateConsistency.totalChecks * 100)}%`);
    console.log(`  Medication consistency: ${Math.round(cons.details.medicationConsistency.consistentChecks / cons.details.medicationConsistency.totalChecks * 100)}%`);
    console.log(`  Diagnosis consistency: ${Math.round(cons.details.diagnosisConsistency.consistentChecks / cons.details.diagnosisConsistency.totalChecks * 100)}%`);
    console.log(`  Treatment alignment: ${Math.round(cons.details.treatmentAlignment.consistentChecks / cons.details.treatmentAlignment.totalChecks * 100)}%`);

    // Narrative Quality details
    console.log('\n✍️ NARRATIVE QUALITY (15% weight):');
    const narr = quality.dimensions.narrativeQuality;
    console.log(`  Flow & transitions: ${Math.round(narr.details.flowAndTransitions.points / narr.details.flowAndTransitions.maxPoints * 100)}%`);
    console.log(`  Medical terminology: ${Math.round(narr.details.medicalTerminology.points / narr.details.medicalTerminology.maxPoints * 100)}%`);
    console.log(`  Clarity: ${Math.round(narr.details.clarityAndConciseness.points / narr.details.clarityAndConciseness.maxPoints * 100)}%`);
    console.log(`  Organization: ${Math.round(narr.details.organization.points / narr.details.organization.maxPoints * 100)}%`);

    // Specificity details
    console.log('\n🎯 SPECIFICITY (5% weight):');
    const spec = quality.dimensions.specificity;
    console.log(`  Value specificity: ${Math.round(spec.details.valueSpecificity.specificChecks / spec.details.valueSpecificity.totalChecks * 100)}%`);
    console.log(`  Temporal specificity: ${Math.round(spec.details.temporalSpecificity.specificChecks / spec.details.temporalSpecificity.totalChecks * 100)}%`);
    console.log(`  Clinical specificity: ${Math.round(spec.details.clinicalSpecificity.specificChecks / spec.details.clinicalSpecificity.totalChecks * 100)}%`);

    // Timeliness details
    console.log('\n⏱️ TIMELINESS (5% weight):');
    const time = quality.dimensions.timeliness;
    console.log(`  Processing speed: ${Math.round(time.details.processingSpeed.points * 100)}%`);
    console.log(`  Total time: ${time.details.metrics.totalTime}ms`);
    console.log(`  Target time: ${time.details.metrics.targetTime}ms`);
    if (time.bottlenecks && time.bottlenecks.length > 0) {
      console.log(`  Bottlenecks: ${time.bottlenecks[0].component} (${time.bottlenecks[0].percentage}%)`);
    }

    // Final summary
    console.log('\n====================================');
    console.log('TEST SUMMARY');
    console.log('====================================');
    const passed = quality.overall.percentage >= 70; // 70% threshold for passing
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Quality Score: ${quality.overall.percentage}%`);
    console.log(`Quality Rating: ${quality.overall.rating.rating}`);
    console.log(`Processing Time: ${processingTime}ms`);

    // Return test results
    return {
      passed,
      score: quality.overall.percentage,
      rating: quality.overall.rating.rating,
      dimensions: {
        completeness: Math.round(quality.dimensions.completeness.score * 100),
        accuracy: Math.round(quality.dimensions.accuracy.score * 100),
        consistency: Math.round(quality.dimensions.consistency.score * 100),
        narrativeQuality: Math.round(quality.dimensions.narrativeQuality.score * 100),
        specificity: Math.round(quality.dimensions.specificity.score * 100),
        timeliness: Math.round(quality.dimensions.timeliness.score * 100)
      },
      issues: {
        critical: quality.summary.criticalIssues,
        major: quality.summary.majorIssues,
        minor: quality.summary.minorIssues
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    return {
      passed: false,
      error: error.message
    };
  }
}

// Run the test
console.log('Starting 6-dimension quality metrics test...\n');
testQualitySystem()
  .then(results => {
    console.log('\n====================================');
    console.log('TEST COMPLETE');
    console.log('====================================');
    process.exit(results.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });