/**
 * CRITICAL DEBUGGING - Live Extraction Test
 *
 * This simulates exactly what the frontend does when user uploads notes
 */

import { extractMedicalEntities } from './src/services/extraction.js';
import fs from 'fs';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 CRITICAL DEBUGGING - Live Extraction Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Sample note
const sampleNote = fs.readFileSync('./sample-note-SAH.txt', 'utf-8');

console.log('📄 Sample note loaded');
console.log(`   Length: ${sampleNote.length} characters`);
console.log(`   First 100 chars: ${sampleNote.substring(0, 100)}...\n`);

try {
  console.log('🚀 Starting extraction (exactly as App.jsx does)...\n');

  // This is EXACTLY what App.jsx does
  const noteContents = [sampleNote];
  const extractionResult = await extractMedicalEntities(noteContents, {
    includeConfidence: true
  });

  console.log('✅ Extraction completed\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 EXTRACTION RESULT STRUCTURE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Top-level keys:', Object.keys(extractionResult));
  console.log('\n--- extracted object keys ---');
  console.log(Object.keys(extractionResult.extracted || {}));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CRITICAL CHECK: hospitalCourse field');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const hospitalCourse = extractionResult.extracted?.hospitalCourse;

  if (!hospitalCourse) {
    console.log('❌ CRITICAL BUG: hospitalCourse is NULL or UNDEFINED');
    console.log('   This means the extraction function was NOT called or returned nothing');
  } else {
    console.log('✅ hospitalCourse exists');
    console.log('   Type:', typeof hospitalCourse);
    console.log('   Keys:', Object.keys(hospitalCourse));

    if (hospitalCourse.timeline) {
      console.log(`   Timeline events: ${hospitalCourse.timeline.length}`);

      if (hospitalCourse.timeline.length > 0) {
        console.log('\n   First 3 timeline events:');
        hospitalCourse.timeline.slice(0, 3).forEach((event, idx) => {
          console.log(`   ${idx + 1}. Date: ${event.date}`);
          console.log(`      Type: ${event.type}`);
          console.log(`      Description: ${event.description?.substring(0, 60)}...`);
        });
      } else {
        console.log('   ❌ BUG: Timeline array is EMPTY');
      }
    } else {
      console.log('   ❌ BUG: timeline property is MISSING');
    }

    if (hospitalCourse.summary) {
      console.log(`\n   Summary: ${hospitalCourse.summary.substring(0, 100)}...`);
    } else {
      console.log('\n   ⚠️  No summary');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CHECK: Other comprehensive fields');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const comprehensiveFields = [
    'physicalExam',
    'neurologicalExam',
    'significantEvents',
    'icuStay',
    'preOpDeficits',
    'postOpDeficits',
    'consultations',
    'labs',
    'vitals'
  ];

  comprehensiveFields.forEach(field => {
    const data = extractionResult.extracted?.[field];
    const exists = data !== null && data !== undefined;
    const isEmpty = exists && typeof data === 'object' && Object.values(data).every(v => !v);

    console.log(`   ${exists ? (isEmpty ? '⚠️' : '✅') : '❌'} ${field}: ${
      exists ? (isEmpty ? 'Empty object' : 'Has data') : 'MISSING'
    }`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 FULL RESULT (for inspection)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Save full result
  fs.writeFileSync(
    './debug-extraction-result.json',
    JSON.stringify(extractionResult, null, 2)
  );
  console.log('✅ Full result saved to: debug-extraction-result.json\n');

  // Check if there are any console errors in the extraction
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CRITICAL: Check for errors in extraction flow');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (extractionResult.metadata) {
    console.log('Metadata:');
    console.log('  Method:', extractionResult.metadata.extractionMethod);
    console.log('  Note count:', extractionResult.metadata.noteCount);
    console.log('  Total length:', extractionResult.metadata.totalLength);
  }

  if (extractionResult.confidence) {
    console.log('\nConfidence scores for comprehensive fields:');
    comprehensiveFields.forEach(field => {
      const score = extractionResult.confidence[field];
      console.log(`  ${field}: ${score !== undefined ? score.toFixed(2) : 'MISSING'}`);
    });
    console.log(`  hospitalCourse: ${extractionResult.confidence.hospitalCourse !== undefined ? extractionResult.confidence.hospitalCourse.toFixed(2) : 'MISSING'}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 CRITICAL ANALYSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Critical checks
  const hasHospitalCourse = !!extractionResult.extracted?.hospitalCourse;
  const hasTimeline = !!extractionResult.extracted?.hospitalCourse?.timeline;
  const timelineNotEmpty = hasTimeline && extractionResult.extracted.hospitalCourse.timeline.length > 0;

  if (!hasHospitalCourse) {
    console.log('❌ CRITICAL BUG #1: hospitalCourse field is missing from extraction result');
    console.log('   ROOT CAUSE: buildHospitalCourseTimeline() was NOT called');
    console.log('   FIX NEEDED: Check extraction.js line 383-392');
  } else if (!hasTimeline) {
    console.log('❌ CRITICAL BUG #2: hospitalCourse exists but timeline property is missing');
    console.log('   ROOT CAUSE: buildHospitalCourseTimeline() returned incorrect structure');
    console.log('   FIX NEEDED: Check comprehensiveExtraction.js line 732+');
  } else if (!timelineNotEmpty) {
    console.log('⚠️  WARNING: Timeline exists but is empty');
    console.log('   ROOT CAUSE: No events were extracted from the note');
    console.log('   FIX NEEDED: Check event extraction patterns in buildHospitalCourseTimeline()');
  } else {
    console.log('✅ hospitalCourse and timeline are correctly populated');
    console.log(`   Timeline has ${extractionResult.extracted.hospitalCourse.timeline.length} events`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (error) {
  console.error('\n❌ EXTRACTION FAILED WITH ERROR:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}
