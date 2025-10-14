/**
 * Comprehensive Extraction Integration Test
 *
 * Tests that all extraction functions are properly integrated and working
 */

import { extractMedicalEntities } from './src/services/extraction.js';
import { EXTRACTION_TARGETS } from './src/config/constants.js';
import fs from 'fs';

// Sample SAH note
const sampleNote = fs.readFileSync('./sample-note-SAH.txt', 'utf-8');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 COMPREHENSIVE EXTRACTION INTEGRATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Verify all targets are defined
console.log('✓ Test 1: Verify EXTRACTION_TARGETS');
const allTargets = Object.values(EXTRACTION_TARGETS);
console.log(`  Found ${allTargets.length} extraction targets`);
console.log(`  Targets: ${allTargets.slice(0, 10).join(', ')}...`);

// Test 2: Verify comprehensive targets are included
const comprehensiveTargets = [
  'physicalExam',
  'neurologicalExam',
  'significantEvents',
  'icuStay',
  'preOpDeficits',
  'postOpDeficits',
  'consultations',
  'labs',
  'vitals',
  'hospitalCourse'
];

console.log('\n✓ Test 2: Verify comprehensive targets in EXTRACTION_TARGETS');
comprehensiveTargets.forEach(target => {
  const exists = allTargets.includes(target);
  console.log(`  ${exists ? '✅' : '❌'} ${target}: ${exists ? 'Found' : 'MISSING'}`);
});

// Test 3: Run extraction with all targets
console.log('\n✓ Test 3: Run full extraction');
try {
  const result = await extractMedicalEntities([sampleNote], {
    includeConfidence: true,
    usePatterns: true // Force pattern extraction for faster test
  });

  console.log('  Extraction completed successfully');
  console.log(`  Method: ${result.metadata?.extractionMethod}`);
  console.log(`  Pathology detected: ${result.pathologyTypes?.join(', ')}`);

  // Test 4: Verify comprehensive fields in extracted data
  console.log('\n✓ Test 4: Verify comprehensive fields in extracted data');
  const extracted = result.extracted;

  comprehensiveTargets.forEach(target => {
    const exists = target in extracted;
    const hasData = exists && extracted[target] !== null && extracted[target] !== undefined;
    const dataType = hasData ? typeof extracted[target] : 'none';
    console.log(`  ${exists ? '✅' : '❌'} ${target}: ${exists ? (hasData ? `Has data (${dataType})` : 'Null/undefined') : 'MISSING'}`);
  });

  // Test 5: Verify hospital course timeline structure
  console.log('\n✓ Test 5: Verify hospitalCourse timeline structure');
  const hospitalCourse = extracted.hospitalCourse;
  if (hospitalCourse) {
    console.log(`  ✅ hospitalCourse exists`);
    console.log(`  Timeline events: ${hospitalCourse.timeline?.length || 0}`);
    console.log(`  Has summary: ${!!hospitalCourse.summary}`);
    console.log(`  Has admission summary: ${!!hospitalCourse.admissionSummary}`);

    if (hospitalCourse.timeline?.length > 0) {
      console.log(`\n  Sample timeline event:`);
      const event = hospitalCourse.timeline[0];
      console.log(`    Date: ${event.date}`);
      console.log(`    Type: ${event.type}`);
      console.log(`    Description: ${event.description?.substring(0, 60)}...`);
    }
  } else {
    console.log(`  ❌ hospitalCourse is missing or null`);
  }

  // Test 6: Verify confidence scores
  console.log('\n✓ Test 6: Verify confidence scores for comprehensive fields');
  const confidence = result.confidence;
  comprehensiveTargets.forEach(target => {
    const score = confidence[target];
    console.log(`  ${score ? '✅' : '⚠️'} ${target}: ${score !== undefined ? score.toFixed(2) : 'No score'}`);
  });

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ COMPREHENSIVE EXTRACTION TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Write full result to file for inspection
  fs.writeFileSync(
    './test-extraction-result.json',
    JSON.stringify(result, null, 2)
  );
  console.log('📄 Full extraction result saved to: test-extraction-result.json\n');

} catch (error) {
  console.error('\n❌ EXTRACTION FAILED:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
