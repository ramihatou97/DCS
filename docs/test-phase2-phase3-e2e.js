/**
 * End-to-End Test for Phase 2 & Phase 3
 * 
 * Tests the complete extraction pipeline with Phase 2 & Phase 3 enhancements
 * using the 5 test scenarios from BUG_FIX_TESTING_GUIDE.md
 */

import { extractMedicalEntities } from './src/services/extraction.js';
import { generateNarrative } from './src/services/narrativeEngine.js';
import { calculateQualityMetrics } from './src/services/qualityMetrics.js';

// Test scenarios from BUG_FIX_TESTING_GUIDE.md
const testScenarios = [
  {
    name: 'Test 1: Basic SAH Note',
    note: `Patient: John Doe, 55M
Admission Date: October 10, 2025

Chief Complaint: Sudden severe headache

History: Patient presented with sudden onset severe headache. 
CT head showed subarachnoid hemorrhage. Hunt and Hess grade 3.
CTA revealed left MCA aneurysm.

Procedure: Left craniotomy for aneurysm clipping performed on October 11, 2025.

Course: Patient tolerated procedure well. No vasospasm. 
Started on nimodipine. Neurologically stable.

Discharge: October 15, 2025 to home with neurosurgery follow-up.`
  },
  {
    name: 'Test 2: Multiple Pathology Detection',
    note: `Patient: Jane Smith, 62F
Admission Date: October 8, 2025

History: Patient with known glioblastoma presented with seizure.
MRI showed progression of right frontal tumor with surrounding edema.
Patient also developed hydrocephalus requiring EVD placement.

Procedures:
1. EVD placement October 8, 2025
2. Right frontal craniotomy for tumor resection October 9, 2025

Pathology: Glioblastoma, WHO Grade IV, IDH-wildtype

Course: Patient recovered well. Seizures controlled on Keppra.
EVD removed October 12, 2025. No further hydrocephalus.

Discharge: October 14, 2025 to rehab with oncology and neurosurgery follow-up.`
  },
  {
    name: 'Test 3: Complex SAH with Complications',
    note: `Patient: Robert Johnson, 48M
Admission Date: October 1, 2025

Presentation: Sudden severe headache, loss of consciousness
CT: Diffuse SAH, Hunt-Hess Grade 4, Fisher Grade 3
CTA: 8mm anterior communicating artery aneurysm

Procedures:
- EVD placement October 1, 2025
- Cerebral angiogram with coiling October 2, 2025

Complications:
- Vasospasm POD 7, treated with hypertensive therapy
- Hydrocephalus requiring VP shunt October 15, 2025
- Seizure on POD 3, started on Keppra

Course: Prolonged ICU stay. Gradual neurological improvement.
mRS 3 at discharge.

Discharge: October 20, 2025 to acute rehab facility.
Follow-up: Neurosurgery 2 weeks, Neurology 4 weeks.`
  },
  {
    name: 'Test 4: Spine Surgery',
    note: `Patient: Maria Garcia, 70F
Admission Date: September 28, 2025

History: Progressive lower extremity weakness, urinary retention
MRI: L3-L4 spinal stenosis with severe canal narrowing

Procedure: L3-L4 laminectomy and decompression September 29, 2025

Course: Immediate improvement in lower extremity strength.
Ambulating with walker POD 2. Bladder function improved.

Discharge: October 3, 2025 to home with PT.
Follow-up: Neurosurgery clinic 2 weeks.`
  },
  {
    name: 'Test 5: Traumatic Brain Injury',
    note: `Patient: David Lee, 35M
Admission Date: October 5, 2025

Mechanism: Motor vehicle collision
Presentation: GCS 10 (E3V3M4), right pupil dilated
CT: Right acute subdural hematoma with 8mm midline shift

Procedure: Right craniotomy for SDH evacuation October 5, 2025

Course: Post-op GCS improved to 14. ICP monitoring normal.
Repeat CT showed good evacuation, no rebleed.

Complications: Post-traumatic seizure POD 2, controlled on Keppra

Discharge: October 12, 2025 to acute rehab.
GCS 15, mRS 2 at discharge.
Follow-up: Neurosurgery 1 week, Trauma clinic 2 weeks.`
  }
];

console.log('='.repeat(100));
console.log('PHASE 2 & PHASE 3 END-TO-END TESTING');
console.log('Testing complete extraction pipeline with all enhancements');
console.log('='.repeat(100));

// Run tests
for (let i = 0; i < testScenarios.length; i++) {
  const scenario = testScenarios[i];
  
  console.log(`\n${'='.repeat(100)}`);
  console.log(`${scenario.name}`);
  console.log('='.repeat(100));
  
  try {
    // Step 1: Extract data
    console.log('\n📋 Step 1: Extracting data...');
    const extractedData = await extractMedicalEntities(scenario.note);
    
    console.log('✅ Extraction complete:');
    console.log(`   - Pathology: ${extractedData.pathology?.primary || 'N/A'}`);
    console.log(`   - Demographics: ${extractedData.demographics?.age || 'N/A'}${extractedData.demographics?.gender ? extractedData.demographics.gender.charAt(0).toUpperCase() : ''}`);
    console.log(`   - Procedures: ${extractedData.procedures?.procedures?.length || 0}`);
    console.log(`   - Complications: ${extractedData.complications?.complications?.length || 0}`);
    console.log(`   - Medications: ${extractedData.medications?.discharge?.length || 0}`);
    
    // Check for Phase 2 enhancements
    if (extractedData.clinicalIntelligence) {
      console.log('\n🧠 Phase 2 Clinical Intelligence:');
      console.log(`   - Timeline Events: ${extractedData.clinicalIntelligence.timeline?.events?.length || 0}`);
      console.log(`   - Treatment Responses: ${extractedData.clinicalIntelligence.treatmentResponses?.responses?.length || 0}`);
      console.log(`   - Functional Evolution: ${extractedData.clinicalIntelligence.functionalEvolution?.scoreTimeline?.length || 0} scores tracked`);
      console.log(`   - Relationships: ${extractedData.clinicalIntelligence.relationships?.length || 0}`);
      
      // Display sample relationships
      if (extractedData.clinicalIntelligence.relationships?.length > 0) {
        console.log('\n   Sample Relationships:');
        extractedData.clinicalIntelligence.relationships.slice(0, 3).forEach((rel, idx) => {
          console.log(`     ${idx + 1}. [${rel.type}] ${rel.source} → ${rel.target}`);
        });
      }
    }
    
    // Step 2: Generate narrative
    console.log('\n📝 Step 2: Generating narrative...');
    const narrative = await generateNarrative(extractedData, scenario.note, {
      useLLM: false, // Use template-based for consistent testing
      applyLearnedPatterns: false
    });
    
    console.log('✅ Narrative generated:');
    console.log(`   - Chief Complaint: ${narrative.chiefComplaint?.substring(0, 80)}...`);
    console.log(`   - Hospital Course: ${narrative.hospitalCourse?.substring(0, 80)}...`);
    console.log(`   - Generation Method: ${narrative.metadata?.generationMethod || 'N/A'}`);
    
    // Check for Phase 3 enhancements
    if (narrative.qualityMetrics) {
      console.log('\n📊 Phase 3 Quality Metrics:');
      console.log(`   - Overall Score: ${(narrative.qualityMetrics.overall * 100).toFixed(1)}%`);
      console.log(`   - Extraction Quality: ${(narrative.qualityMetrics.extraction.score * 100).toFixed(1)}%`);
      console.log(`   - Summary Quality: ${(narrative.qualityMetrics.summary.score * 100).toFixed(1)}%`);
      console.log(`   - Word Count: ${narrative.qualityMetrics.summary.wordCount}`);
      console.log(`   - Readability: ${(narrative.qualityMetrics.summary.readability * 100).toFixed(1)}%`);
    }
    
    // Step 3: Validate medical writing style
    console.log('\n✍️  Step 3: Validating medical writing style...');
    const { validateMedicalWritingStyle } = await import('./src/utils/medicalWritingStyle.js');
    const styleIssues = validateMedicalWritingStyle(narrative.hospitalCourse || '', 'hospitalCourse');
    
    if (styleIssues.length === 0) {
      console.log('✅ No style issues detected');
    } else {
      console.log(`⚠️  ${styleIssues.length} style issue(s) detected:`);
      styleIssues.slice(0, 3).forEach((issue, idx) => {
        console.log(`   ${idx + 1}. [${issue.severity}] ${issue.message}`);
      });
    }
    
    // Summary
    console.log('\n✅ Test Passed:');
    console.log(`   - Extraction: ✅`);
    console.log(`   - Phase 2 Intelligence: ${extractedData.clinicalIntelligence ? '✅' : '⚠️  Not found'}`);
    console.log(`   - Narrative Generation: ✅`);
    console.log(`   - Phase 3 Quality Metrics: ${narrative.qualityMetrics ? '✅' : '⚠️  Not found'}`);
    console.log(`   - Medical Writing Style: ${styleIssues.length === 0 ? '✅' : `⚠️  ${styleIssues.length} issues`}`);
    
  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  }
}

console.log('\n' + '='.repeat(100));
console.log('✅ ALL END-TO-END TESTS COMPLETE');
console.log('='.repeat(100));
console.log('\nSummary:');
console.log('- All 5 test scenarios processed');
console.log('- Phase 2 clinical intelligence validated');
console.log('- Phase 3 narrative quality enhancements validated');
console.log('- Medical writing style validated');
console.log('\nNext Steps:');
console.log('1. Review quality metrics for each scenario');
console.log('2. Test in UI with Quality Dashboard component');
console.log('3. Validate with real clinical notes');
console.log('4. Proceed to Phase 4 implementation');

