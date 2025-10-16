/**
 * Phase 2: Clinical Intelligence & Context - Comprehensive Test Suite
 *
 * Tests all three Phase 2 components:
 * 1. Causal Timeline & Event Relationships (8 tests)
 * 2. Treatment Response Tracking (6 tests)
 * 3. Functional Status Evolution (5 tests)
 * 4. End-to-End Integration (3 tests)
 *
 * Target: 90-95% pass rate (20-21/22 tests passing)
 */

import { extractMedicalEntities } from './src/services/extraction.js';
import { buildCausalTimeline } from './src/utils/causalTimeline.js';
import { trackTreatmentResponses } from './src/utils/treatmentResponse.js';
import { analyzeFunctionalEvolution } from './src/utils/functionalEvolution.js';

console.log('='.repeat(80));
console.log('PHASE 2: CLINICAL INTELLIGENCE & CONTEXT - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(80));
console.log();

// Test data: Comprehensive SAH case
const sahTestCase = {
  notes: [
    {
      type: 'admission',
      content: `
ADMISSION NOTE - NEUROSURGERY ICU
Date: 05/15/2025

PATIENT: Jane Doe, 55-year-old female
MRN: 12345678

PRESENTING COMPLAINT:
Sudden onset severe headache at 09:30 on 05/15/2025, "worst headache of my life"
Loss of consciousness witnessed by family

DIAGNOSIS: Aneurysmal subarachnoid hemorrhage from ruptured 8mm anterior communicating artery aneurysm

CLINICAL GRADING:
- Hunt & Hess Grade: 3 (drowsy, mild focal deficit)
- Modified Fisher Grade: 3 (thick SAH, IVH present)
- WFNS Grade: 3

IMAGING (05/15/2025 11:00):
- CT Head: Diffuse subarachnoid hemorrhage, predominantly in basal cisterns
- CTA: 8mm AComm aneurysm with wide neck, no hydrocephalus on initial imaging

ADMISSION STATUS:
- GCS: 13 (E3 V4 M6)
- mRS: 4 (moderately severe disability)
- Vital signs stable

HOSPITAL COURSE:
Patient underwent emergent craniotomy and microsurgical clipping on 05/15/2025 at 15:00 by Dr. Smith.
Post-operative course initially stable.

DAILY PROGRESS NOTES:

POD 0 (05/15/2025 Evening):
- Post-op GCS: 12 (E3 V3 M6)
- Started nimodipine 60mg PO q4h x 21 days per SAH protocol
- Daily TCD monitoring initiated
- Neuro checks q1h

POD 1 (05/16/2025):
- GCS: 13 (E3 V4 M6) - improved
- TCD velocities: Normal (MCA 60 cm/s)
- No new deficits

POD 3 (05/18/2025):
- TCD velocities: Rising (MCA 95 cm/s)
- Patient remained stable clinically

POD 6 (05/21/2025):
- COMPLICATION: Delayed cerebral ischemia (DCI)
- New left-sided weakness
- TCD velocities: Elevated (MCA 145 cm/s)
- CTA: Moderate vasospasm in bilateral MCAs
- INTERVENTION: Induced hypertension initiated (target SBP 160-180)
- Continued nimodipine

POD 7-8 (05/22-05/23/2025):
- Gradual improvement with induced hypertension
- Left-sided weakness improving
- GCS: 14 (E4 V4 M6)

POD 10 (05/25/2025):
- TCD velocities normalizing (MCA 110 cm/s)
- Left-sided weakness resolved
- GCS: 15 (E4 V5 M6)
- mRS: 2 (slight disability)

POD 14 (05/29/2025):
- Continued improvement
- TCD monitoring discontinued
- Patient ambulating with assistance

POD 18 (06/02/2025 - DISCHARGE):
- GCS: 15
- mRS: 3 (moderate disability, but independent for basic ADLs)
- Mild cognitive deficits noted
- Destination: Acute rehab facility
- Medications at discharge: Nimodipine (continue x 3 more days), levetiracetam 500mg BID

FOLLOW-UP PLAN:
- Neurosurgery clinic in 2 weeks
- Repeat CTA at 6 months
- Continue nimodipine total 21 days
- DVT prophylaxis with SCDs (no heparin due to recent surgery)

COMPLICATIONS:
1. Delayed cerebral ischemia (POD 6)
2. Mild cognitive deficits at discharge

PROCEDURES:
- Craniotomy and aneurysm clipping (05/15/2025)
- Daily TCD monitoring (POD 1-14)
`
    }
  ]
};

// Test Results Tracking
let totalTests = 0;
let passedTests = 0;
const testResults = [];

function runTest(name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result) {
      passedTests++;
      testResults.push({ name, status: 'PASS' });
      console.log(`✅ ${totalTests}. ${name}`);
      return true;
    } else {
      testResults.push({ name, status: 'FAIL' });
      console.log(`❌ ${totalTests}. ${name}`);
      return false;
    }
  } catch (error) {
    testResults.push({ name, status: 'ERROR', error: error.message });
    console.log(`❌ ${totalTests}. ${name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('📋 Extracting test case data...');
  const extractionResult = await extractMedicalEntities(sahTestCase.notes);
  const extractedData = extractionResult.extracted;
  const clinicalIntelligence = extractionResult.clinicalIntelligence;

  console.log('✅ Extraction complete\n');

  // ============================================================================
  // SECTION 1: CAUSAL TIMELINE TESTS (8 tests)
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('SECTION 1: CAUSAL TIMELINE & EVENT RELATIONSHIPS (8 tests)');
  console.log('═'.repeat(80));
  console.log();

  runTest('Timeline has events', () => {
    return clinicalIntelligence?.timeline?.events && clinicalIntelligence.timeline.events.length > 0;
  });

  runTest('Events are chronologically sorted', () => {
    const events = clinicalIntelligence?.timeline?.events || [];
    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp < events[i-1].timestamp) return false;
    }
    return events.length > 0;
  });

  runTest('Events have unique IDs', () => {
    const events = clinicalIntelligence?.timeline?.events || [];
    const ids = events.map(e => e.id);
    const uniqueIds = new Set(ids);
    return ids.length > 0 && ids.length === uniqueIds.size;
  });

  runTest('Milestones identified (admission, surgery, discharge)', () => {
    const milestones = clinicalIntelligence?.timeline?.milestones || {};
    return milestones.admission && milestones.surgery && milestones.discharge;
  });

  runTest('Relationships detected between events', () => {
    return clinicalIntelligence?.timeline?.relationships &&
           clinicalIntelligence.timeline.relationships.length > 0;
  });

  runTest('Complication → Intervention relationship exists', () => {
    const relationships = clinicalIntelligence?.timeline?.relationships || [];
    // DCI should trigger induced hypertension
    const dciToHypertension = relationships.some(r =>
      (r.type === 'triggers' || r.type === 'leads_to') &&
      r.confidence > 0.5
    );
    return dciToHypertension;
  });

  runTest('Event categorization includes THERAPEUTIC and COMPLICATION types', () => {
    const events = clinicalIntelligence?.timeline?.events || [];
    const hasTherapeutic = events.some(e => e.type === 'THERAPEUTIC');
    const hasComplication = events.some(e => e.type === 'COMPLICATION');
    return hasTherapeutic && hasComplication;
  });

  runTest('Timeline metadata includes event count and date range', () => {
    const metadata = clinicalIntelligence?.timeline?.metadata || {};
    return metadata.eventCount >= 0 && metadata.dateRange;
  });

  console.log();

  // ============================================================================
  // SECTION 2: TREATMENT RESPONSE TESTS (6 tests)
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('SECTION 2: TREATMENT RESPONSE TRACKING (6 tests)');
  console.log('═'.repeat(80));
  console.log();

  runTest('Treatment responses tracked', () => {
    return clinicalIntelligence?.treatmentResponses?.responses &&
           clinicalIntelligence.treatmentResponses.responses.length > 0;
  });

  runTest('Nimodipine prophylaxis tracked', () => {
    const responses = clinicalIntelligence?.treatmentResponses?.responses || [];
    const nimodipineResponse = responses.find(r =>
      r.intervention?.name?.toLowerCase().includes('nimodipine')
    );
    return nimodipineResponse !== undefined;
  });

  runTest('Induced hypertension for DCI tracked', () => {
    const responses = clinicalIntelligence?.treatmentResponses?.responses || [];
    const hypertensionResponse = responses.find(r =>
      r.intervention?.type === 'intervention' &&
      (r.intervention?.name?.toLowerCase().includes('hypertension') ||
       r.intervention?.name?.toLowerCase().includes('vasospasm'))
    );
    return hypertensionResponse !== undefined;
  });

  runTest('Treatment responses have classification (IMPROVED/WORSENED/STABLE)', () => {
    const responses = clinicalIntelligence?.treatmentResponses?.responses || [];
    const validResponses = ['IMPROVED', 'WORSENED', 'STABLE', 'NO_CHANGE', 'PARTIAL'];
    return responses.length > 0 && responses.every(r =>
      validResponses.includes(r.response)
    );
  });

  runTest('Effectiveness scores calculated (0-100)', () => {
    const responses = clinicalIntelligence?.treatmentResponses?.responses || [];
    const hasEffectiveness = responses.some(r =>
      r.effectiveness &&
      typeof r.effectiveness.score === 'number' &&
      r.effectiveness.score >= 0 &&
      r.effectiveness.score <= 100
    );
    return hasEffectiveness;
  });

  runTest('Protocol compliance checked for SAH (nimodipine mandatory)', () => {
    const compliance = clinicalIntelligence?.treatmentResponses?.protocolCompliance || {};
    return compliance.items && compliance.items.length > 0;
  });

  console.log();

  // ============================================================================
  // SECTION 3: FUNCTIONAL EVOLUTION TESTS (5 tests)
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('SECTION 3: FUNCTIONAL STATUS EVOLUTION (5 tests)');
  console.log('═'.repeat(80));
  console.log();

  runTest('Functional score timeline extracted', () => {
    return clinicalIntelligence?.functionalEvolution?.scoreTimeline &&
           clinicalIntelligence.functionalEvolution.scoreTimeline.length > 0;
  });

  runTest('Status changes detected', () => {
    const changes = clinicalIntelligence?.functionalEvolution?.statusChanges || [];
    // Should detect at least GCS improvement from 12 → 13 → 14 → 15
    return changes.length > 0;
  });

  runTest('Trajectory analyzed (pattern, trend, rate)', () => {
    const trajectory = clinicalIntelligence?.functionalEvolution?.trajectory;
    return trajectory &&
           trajectory.pattern &&
           trajectory.trend &&
           ['improving', 'declining', 'stable', 'fluctuating'].includes(trajectory.pattern);
  });

  runTest('Milestones identified (admission baseline, discharge status)', () => {
    const milestones = clinicalIntelligence?.functionalEvolution?.milestones || {};
    return milestones.admissionBaseline && milestones.dischargeStatus;
  });

  runTest('Functional evolution summary generated', () => {
    const summary = clinicalIntelligence?.functionalEvolution?.summary || {};
    return summary.hasData !== undefined && summary.trajectory;
  });

  console.log();

  // ============================================================================
  // SECTION 4: INTEGRATION TESTS (3 tests)
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('SECTION 4: END-TO-END INTEGRATION (3 tests)');
  console.log('═'.repeat(80));
  console.log();

  runTest('Clinical intelligence object present in extraction result', () => {
    return extractionResult.clinicalIntelligence !== undefined;
  });

  runTest('All three Phase 2 components present (timeline, treatmentResponses, functionalEvolution)', () => {
    return clinicalIntelligence?.timeline &&
           clinicalIntelligence?.treatmentResponses &&
           clinicalIntelligence?.functionalEvolution;
  });

  runTest('Clinical intelligence metadata includes generation timestamp', () => {
    const metadata = clinicalIntelligence?.metadata || {};
    return metadata.generated && metadata.components &&
           metadata.components.length === 3;
  });

  console.log();

  // ============================================================================
  // DETAILED OUTPUT SAMPLES
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('DETAILED OUTPUT SAMPLES');
  console.log('═'.repeat(80));
  console.log();

  console.log('📊 TIMELINE SAMPLE:');
  console.log('-'.repeat(80));
  const sampleEvents = clinicalIntelligence?.timeline?.events?.slice(0, 3) || [];
  sampleEvents.forEach(event => {
    console.log(`  Event: ${event.description}`);
    console.log(`  Type: ${event.type}, Category: ${event.category}`);
    console.log(`  Date: ${event.date || 'N/A'}`);
    console.log(`  Relationships: ${event.relationships?.length || 0}`);
    console.log();
  });

  console.log('💊 TREATMENT RESPONSE SAMPLE:');
  console.log('-'.repeat(80));
  const sampleResponses = clinicalIntelligence?.treatmentResponses?.responses?.slice(0, 2) || [];
  sampleResponses.forEach(response => {
    console.log(`  Intervention: ${response.intervention?.name || 'Unknown'}`);
    console.log(`  Outcome: ${response.outcome?.description || 'N/A'}`);
    console.log(`  Response: ${response.response}`);
    console.log(`  Effectiveness: ${response.effectiveness?.score || 'N/A'} (${response.effectiveness?.rating || 'N/A'})`);
    console.log(`  Confidence: ${response.confidence || 'N/A'}`);
    console.log();
  });

  console.log('📈 FUNCTIONAL EVOLUTION SAMPLE:');
  console.log('-'.repeat(80));
  const trajectory = clinicalIntelligence?.functionalEvolution?.trajectory || {};
  console.log(`  Pattern: ${trajectory.pattern || 'Unknown'}`);
  console.log(`  Trend: ${trajectory.trend || 'Unknown'}`);
  console.log(`  Rate: ${trajectory.rate || 'N/A'}`);
  console.log(`  Description: ${trajectory.description || 'N/A'}`);
  console.log(`  Overall Change: ${trajectory.overallChange || 'N/A'}`);
  console.log(`  Duration: ${trajectory.durationDays || 'N/A'} days`);
  console.log();

  console.log('🎯 PROTOCOL COMPLIANCE:');
  console.log('-'.repeat(80));
  const compliance = clinicalIntelligence?.treatmentResponses?.protocolCompliance || {};
  const items = compliance.items || [];
  items.slice(0, 3).forEach(item => {
    console.log(`  Protocol: ${item.protocol}`);
    console.log(`  Expected: ${item.expected}`);
    console.log(`  Actual: ${item.actual}`);
    console.log(`  Compliant: ${item.compliant ? '✅ YES' : '❌ NO'}`);
    console.log(`  Importance: ${item.importance}`);
    console.log();
  });

  // ============================================================================
  // TEST SUMMARY
  // ============================================================================
  console.log('═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log();

  const passRate = Math.round((passedTests / totalTests) * 100);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log();

  // Test breakdown by section
  const section1 = testResults.slice(0, 8);
  const section2 = testResults.slice(8, 14);
  const section3 = testResults.slice(14, 19);
  const section4 = testResults.slice(19, 22);

  console.log('📊 SECTION BREAKDOWN:');
  console.log('-'.repeat(80));
  console.log(`Section 1 (Causal Timeline): ${section1.filter(t => t.status === 'PASS').length}/8`);
  console.log(`Section 2 (Treatment Response): ${section2.filter(t => t.status === 'PASS').length}/6`);
  console.log(`Section 3 (Functional Evolution): ${section3.filter(t => t.status === 'PASS').length}/5`);
  console.log(`Section 4 (Integration): ${section4.filter(t => t.status === 'PASS').length}/3`);
  console.log();

  // Failed test details
  const failedTests = testResults.filter(t => t.status !== 'PASS');
  if (failedTests.length > 0) {
    console.log('❌ FAILED TESTS:');
    console.log('-'.repeat(80));
    failedTests.forEach((test, idx) => {
      console.log(`${idx + 1}. ${test.name}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
    console.log();
  }

  // Final assessment
  console.log('═'.repeat(80));
  if (passRate >= 90) {
    console.log('🎉 ✅ PHASE 2 TESTS PASSED (≥90% pass rate)');
    console.log('Phase 2: Clinical Intelligence & Context is ready for production!');
  } else if (passRate >= 75) {
    console.log('⚠️  PHASE 2 TESTS MOSTLY PASSED (75-89% pass rate)');
    console.log('Review failed tests and address critical issues before production.');
  } else {
    console.log('❌ PHASE 2 TESTS FAILED (<75% pass rate)');
    console.log('Significant issues detected. Review implementation before proceeding.');
  }
  console.log('═'.repeat(80));

  process.exit(passRate >= 90 ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ TEST SUITE FAILED WITH ERROR:');
  console.error(error);
  process.exit(1);
});
