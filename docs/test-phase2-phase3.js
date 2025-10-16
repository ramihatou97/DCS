/**
 * Test Phase 2 Steps 4-5 and Phase 3 Steps 1-4
 * 
 * Tests:
 * - Relationship extraction
 * - Intelligence hub
 * - Narrative synthesis
 * - Medical writing style
 * - Narrative transitions
 * - Quality metrics
 */

import { extractClinicalRelationships } from './src/utils/relationshipExtraction.js';
import intelligenceHub from './src/services/intelligenceHub.js';
import { synthesizeMultiSourceNarrative } from './src/utils/narrativeSynthesis.js';
import { applyMedicalWritingStyle, validateMedicalWritingStyle } from './src/utils/medicalWritingStyle.js';
import { buildNarrativeWithTransitions, selectTransition } from './src/utils/narrativeTransitions.js';
import { calculateQualityMetrics } from './src/services/qualityMetrics.js';

// Sample clinical note
const sampleNote = `
PATIENT: 65-year-old female

HISTORY OF PRESENT ILLNESS:
Patient presented with sudden onset severe headache on 10/1/2025. CT scan revealed subarachnoid hemorrhage (SAH) with Hunt-Hess Grade 3. Patient was admitted to ICU.

HOSPITAL COURSE:
On POD 1, patient underwent cerebral angiogram which revealed a 7mm anterior communicating artery aneurysm. On POD 2, patient underwent craniotomy for aneurysm clipping. The procedure was successful without complications.

Patient was started on nimodipine for vasospasm prophylaxis. On POD 5, patient developed vasospasm which was treated with hypertensive therapy. Patient's neurological status improved over the following days.

External ventricular drain (EVD) was placed on admission for hydrocephalus. EVD was removed on POD 10 without complications.

DISCHARGE STATUS:
Patient is ambulatory with assistance. Modified Rankin Scale score is 2. Patient is neurologically stable.

DISCHARGE MEDICATIONS:
- Nimodipine 60mg PO q4h
- Keppra 500mg PO BID
- Aspirin 81mg PO daily

FOLLOW-UP:
Patient will follow up with neurosurgery in 2 weeks and neurology in 4 weeks.
`;

// Sample extracted data
const sampleExtractedData = {
  demographics: {
    age: 65,
    gender: 'female'
  },
  dates: {
    admission: '2025-10-01',
    discharge: '2025-10-15',
    ictus: '2025-10-01'
  },
  presentingSymptoms: {
    symptoms: ['sudden onset severe headache']
  },
  pathology: {
    primary: 'SAH',
    type: 'SAH',
    confidence: 0.95
  },
  procedures: {
    procedures: [
      { name: 'cerebral angiogram', date: '2025-10-02' },
      { name: 'craniotomy for aneurysm clipping', date: '2025-10-03' }
    ]
  },
  complications: {
    complications: [
      { name: 'vasospasm', date: '2025-10-06' },
      { name: 'hydrocephalus', date: '2025-10-01' }
    ]
  },
  medications: {
    discharge: [
      { name: 'nimodipine', dose: '60mg', frequency: 'q4h' },
      { name: 'keppra', dose: '500mg', frequency: 'BID' },
      { name: 'aspirin', dose: '81mg', frequency: 'daily' }
    ]
  },
  functionalStatus: {
    mRS: 2
  },
  discharge: {
    destination: 'home'
  },
  followUp: {
    appointments: [
      { provider: 'neurosurgery', timeframe: '2 weeks' },
      { provider: 'neurology', timeframe: '4 weeks' }
    ]
  }
};

console.log('='.repeat(80));
console.log('PHASE 2 & PHASE 3 TESTING');
console.log('='.repeat(80));

// Test 1: Relationship Extraction
console.log('\n📋 TEST 1: Relationship Extraction');
console.log('-'.repeat(80));
try {
  const relationships = extractClinicalRelationships(sampleNote, sampleExtractedData);
  console.log(`✅ Extracted ${relationships.length} relationships:`);
  relationships.slice(0, 5).forEach((rel, idx) => {
    console.log(`   ${idx + 1}. [${rel.type}] ${rel.source} → ${rel.target} (confidence: ${rel.confidence})`);
  });
  if (relationships.length > 5) {
    console.log(`   ... and ${relationships.length - 5} more`);
  }
} catch (error) {
  console.error('❌ Relationship extraction failed:', error.message);
}

// Test 2: Intelligence Hub
console.log('\n🧠 TEST 2: Intelligence Hub');
console.log('-'.repeat(80));
try {
  const intelligence = await intelligenceHub.gatherIntelligence(sampleNote, sampleExtractedData);
  console.log('✅ Intelligence gathered:');
  console.log(`   - Pathology: ${intelligence.pathology?.primary || 'N/A'}`);
  console.log(`   - Quality Score: ${(intelligence.quality?.overallScore * 100 || 0).toFixed(1)}%`);
  console.log(`   - Completeness: ${(intelligence.completeness?.score * 100 || 0).toFixed(1)}%`);
  console.log(`   - Consistency: ${intelligence.consistency?.isConsistent ? 'Yes' : 'No'}`);
  console.log(`   - Suggestions: ${intelligence.suggestions?.length || 0}`);
} catch (error) {
  console.error('❌ Intelligence hub failed:', error.message);
}

// Test 3: Narrative Synthesis
console.log('\n📝 TEST 3: Narrative Synthesis');
console.log('-'.repeat(80));
try {
  const narrative = synthesizeMultiSourceNarrative(sampleExtractedData, sampleNote);
  console.log('✅ Narrative synthesized:');
  console.log(`   - Clinical Story: ${narrative.clinicalStory?.substring(0, 100)}...`);
  console.log(`   - Functional Outcome: ${narrative.functionalOutcome?.substring(0, 100) || 'N/A'}`);
  console.log(`   - Discharge Plan: ${narrative.dischargePlan?.substring(0, 100)}...`);
} catch (error) {
  console.error('❌ Narrative synthesis failed:', error.message);
}

// Test 4: Medical Writing Style
console.log('\n✍️  TEST 4: Medical Writing Style');
console.log('-'.repeat(80));
try {
  const testText = 'patient is presenting with sah. evd was placed. patient has improved.';
  const styledText = applyMedicalWritingStyle(testText, 'hospitalCourse');
  console.log('✅ Style applied:');
  console.log(`   - Original: "${testText}"`);
  console.log(`   - Styled:   "${styledText}"`);
  
  const issues = validateMedicalWritingStyle(testText, 'hospitalCourse');
  console.log(`   - Style Issues: ${issues.length}`);
  issues.forEach((issue, idx) => {
    console.log(`     ${idx + 1}. [${issue.severity}] ${issue.message}`);
  });
} catch (error) {
  console.error('❌ Medical writing style failed:', error.message);
}

// Test 5: Narrative Transitions
console.log('\n🔗 TEST 5: Narrative Transitions');
console.log('-'.repeat(80));
try {
  const sentences = [
    'Patient presented with severe headache.',
    'CT scan revealed subarachnoid hemorrhage.',
    'Patient underwent craniotomy for aneurysm clipping.',
    'Patient developed vasospasm on POD 5.',
    'Patient improved with hypertensive therapy.'
  ];
  
  const narrativeWithTransitions = buildNarrativeWithTransitions(sentences);
  console.log('✅ Transitions added:');
  console.log(`   ${narrativeWithTransitions}`);
  
  // Test individual transition selection
  const transition = selectTransition(sentences[0], sentences[1]);
  console.log(`\n   - Sample transition: "${transition}"`);
} catch (error) {
  console.error('❌ Narrative transitions failed:', error.message);
}

// Test 6: Quality Metrics
console.log('\n📊 TEST 6: Quality Metrics');
console.log('-'.repeat(80));
try {
  const summary = `
CHIEF COMPLAINT: Sudden onset severe headache

HISTORY OF PRESENT ILLNESS: 65-year-old female presented with sudden onset severe headache. CT scan revealed subarachnoid hemorrhage.

HOSPITAL COURSE: Patient underwent cerebral angiogram and craniotomy for aneurysm clipping. Patient developed vasospasm which was treated successfully.

DISCHARGE STATUS: Patient is ambulatory with assistance. Modified Rankin Scale score is 2.

DISCHARGE MEDICATIONS: Nimodipine, Keppra, Aspirin

FOLLOW-UP: Neurosurgery in 2 weeks, Neurology in 4 weeks.
  `;
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [
      { message: 'Consider adding more detail to discharge instructions', severity: 'minor' }
    ]
  };
  
  const metrics = calculateQualityMetrics(sampleExtractedData, validation, summary, {
    extractionMethod: 'llm',
    noteCount: 1
  });
  
  console.log('✅ Quality metrics calculated:');
  console.log(`   - Overall Score: ${(metrics.overall * 100).toFixed(1)}%`);
  console.log(`   - Extraction Quality: ${(metrics.extraction.score * 100).toFixed(1)}%`);
  console.log(`     • Completeness: ${(metrics.extraction.completeness * 100).toFixed(1)}%`);
  console.log(`     • Confidence: ${(metrics.extraction.confidence * 100).toFixed(1)}%`);
  console.log(`     • Extracted Fields: ${metrics.extraction.extractedFields}/${metrics.extraction.totalFields}`);
  console.log(`   - Validation Quality: ${(metrics.validation.score * 100).toFixed(1)}%`);
  console.log(`     • Pass Rate: ${(metrics.validation.passRate * 100).toFixed(1)}%`);
  console.log(`     • Errors: ${metrics.validation.errorCount}`);
  console.log(`     • Warnings: ${metrics.validation.warningCount}`);
  console.log(`   - Summary Quality: ${(metrics.summary.score * 100).toFixed(1)}%`);
  console.log(`     • Readability: ${(metrics.summary.readability * 100).toFixed(1)}%`);
  console.log(`     • Completeness: ${(metrics.summary.completeness * 100).toFixed(1)}%`);
  console.log(`     • Coherence: ${(metrics.summary.coherence * 100).toFixed(1)}%`);
  console.log(`     • Word Count: ${metrics.summary.wordCount}`);
  console.log(`     • Section Count: ${metrics.summary.sectionCount}`);
} catch (error) {
  console.error('❌ Quality metrics failed:', error.message);
}

console.log('\n' + '='.repeat(80));
console.log('✅ ALL TESTS COMPLETE');
console.log('='.repeat(80));
console.log('\nNext Steps:');
console.log('1. Test with real clinical notes from BUG_FIX_TESTING_GUIDE.md');
console.log('2. Integrate Quality Dashboard UI component');
console.log('3. Test end-to-end with full extraction pipeline');
console.log('4. Proceed to Phase 4 implementation');

