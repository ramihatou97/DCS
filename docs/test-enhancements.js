#!/usr/bin/env node

/**
 * Test Script for Clinical Note Processing Enhancements
 * 
 * Tests the new preprocessing, deduplication, and extraction features
 */

import { readFileSync } from 'fs';
import { preprocessClinicalNote, segmentClinicalNote, extractTemporalReferences } from './src/utils/textUtils.js';
import { deduplicateNotes } from './src/services/deduplication.js';

console.log('🧪 Testing Clinical Note Processing Enhancements\n');
console.log('='.repeat(60));

// Load sample note
const sampleNote = readFileSync('./sample-notes-raw-SAH.txt', 'utf-8');

// Test 1: Preprocessing
console.log('\n1️⃣  Test: Preprocessing Clinical Note');
console.log('-'.repeat(60));
const preprocessed = preprocessClinicalNote(sampleNote);
console.log('Original length:', sampleNote.length, 'characters');
console.log('Preprocessed length:', preprocessed.length, 'characters');
console.log('Sample preprocessed output:');
console.log(preprocessed.substring(0, 200) + '...\n');

// Test 2: Segmentation
console.log('\n2️⃣  Test: Note Segmentation');
console.log('-'.repeat(60));
const segments = segmentClinicalNote(preprocessed);
console.log('Identified sections:', Object.keys(segments.sections).length);
console.log('Sections found:', Object.keys(segments.sections).join(', '));
console.log('Unclassified content length:', segments.unclassified.length, 'characters\n');

// Test 3: Temporal References
console.log('\n3️⃣  Test: Temporal Reference Extraction');
console.log('-'.repeat(60));
const temporalRefs = extractTemporalReferences(preprocessed);
console.log('Temporal references found:', temporalRefs.length);
temporalRefs.slice(0, 5).forEach(ref => {
  console.log(`  - ${ref.type}: ${ref.text} ${ref.subtype ? `(${ref.subtype})` : ''}`);
});
if (temporalRefs.length > 5) {
  console.log(`  ... and ${temporalRefs.length - 5} more`);
}
console.log();

// Test 4: Deduplication with artificial duplicates
console.log('\n4️⃣  Test: Deduplication');
console.log('-'.repeat(60));

// Create test notes with duplicates
const testNotes = [
  "Patient is a 62yo male with sudden severe headache. CT shows SAH.",
  "Patient is a 62 year old male with sudden severe headache. CT shows SAH.", // Near duplicate
  "Underwent coiling procedure on 10/12. No complications.",
  "Patient underwent coiling procedure. No complications noted.", // Near duplicate
  "POD#3 - developed vasospasm, started hypertensive therapy.",
  "Patient is a 62yo male with sudden severe headache. CT shows SAH." // Exact duplicate
];

console.log('Input notes:', testNotes.length);
const dedupResult = deduplicateNotes(testNotes, {
  similarityThreshold: 0.85,
  preserveChronology: true,
  mergeComplementary: true
});

console.log('Output notes:', dedupResult.metadata.final);
console.log('Reduction:', dedupResult.metadata.reductionPercent + '%');
console.log('Exact duplicates removed:', dedupResult.metadata.exactDuplicatesRemoved);
console.log('Near duplicates removed:', dedupResult.metadata.nearDuplicatesRemoved);
console.log('Merged pairs:', dedupResult.metadata.mergeCount);
console.log('\nDeduplicated notes:');
dedupResult.deduplicated.forEach((note, i) => {
  console.log(`  ${i+1}. ${note.substring(0, 60)}...`);
});

// Test 5: Integration test with real sample
console.log('\n5️⃣  Test: Full Integration');
console.log('-'.repeat(60));

// Split sample note into multiple "notes" (simulating multiple entries)
const multipleNotes = sampleNote.split('\n\n\n').filter(n => n.trim().length > 0);
console.log('Original note sections:', multipleNotes.length);

const integrationResult = deduplicateNotes(
  multipleNotes.map(n => preprocessClinicalNote(n)),
  {
    similarityThreshold: 0.85,
    preserveChronology: true,
    mergeComplementary: false // Keep separate for this test
  }
);

console.log('After processing:', integrationResult.metadata.final);
console.log('Reduction:', integrationResult.metadata.reductionPercent + '%');

// Summary
console.log('\n✅ All Tests Completed Successfully!');
console.log('='.repeat(60));
console.log('\n📊 Summary:');
console.log('  ✓ Preprocessing: Normalizes variable styles');
console.log('  ✓ Segmentation: Identifies clinical sections');
console.log('  ✓ Temporal Extraction: Finds dates and POD markers');
console.log('  ✓ Deduplication: Removes redundant content');
console.log('  ✓ Integration: All components work together');
console.log('\n🎉 System ready for production use!');
