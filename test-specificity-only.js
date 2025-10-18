#!/usr/bin/env node

/**
 * Test Specificity Improvements Only
 */

import {
  generateSpecificComplicationsNarrative,
  generateSpecificProceduresNarrative,
  generateSpecificMedicationsNarrative,
  generateSpecificFollowUpNarrative,
  replaceVagueQuantifiers
} from './src/utils/specificNarrativeGenerators.js';

// Test data with multiple items
const testData = {
  complications: {
    complications: [
      { name: 'aspiration pneumonia', severity: 'moderate', management: 'antibiotics' },
      { name: 'UTI', severity: 'mild', management: 'ciprofloxacin' },
      { name: 'dysphagia', severity: 'mild', management: 'modified diet' }
    ]
  },
  procedures: {
    procedures: [
      { name: 'mechanical thrombectomy', date: '2023-12-01' },
      { name: 'PEG tube placement', date: '2023-12-08' }
    ]
  },
  medications: {
    discharge: [
      { name: 'Aspirin', dose: '81mg', frequency: 'daily', route: 'PO' },
      { name: 'Atorvastatin', dose: '80mg', frequency: 'daily', route: 'PO' },
      { name: 'Lisinopril', dose: '10mg', frequency: 'daily', route: 'PO' },
      { name: 'Metoprolol', dose: '25mg', frequency: 'BID', route: 'PO' },
      { name: 'Ciprofloxacin', dose: '500mg', frequency: 'BID', route: 'PO', duration: '3 days' }
    ]
  },
  followUp: [
    { specialty: 'Neurology', timeframe: 'in 2 weeks' },
    { specialty: 'Primary care', timeframe: 'in 1 week' },
    { specialty: 'Speech therapy', timeframe: 'starting 12/15' },
    { specialty: 'Physical therapy', timeframe: 'at rehab facility' }
  ]
};

console.log('=====================================');
console.log('SPECIFICITY IMPROVEMENTS TEST');
console.log('=====================================\n');

// Test complications narrative
console.log('1. COMPLICATIONS NARRATIVE:');
const compNarrative = generateSpecificComplicationsNarrative(testData);
console.log(`   Generated: "${compNarrative}"`);
console.log(`   Has exact count: ${compNarrative.includes('3 events') ? '✅' : '❌'}`);
console.log(`   No vague terms: ${!compNarrative.includes('multiple') && !compNarrative.includes('several') ? '✅' : '❌'}`);

// Test procedures narrative
console.log('\n2. PROCEDURES NARRATIVE:');
const procNarrative = generateSpecificProceduresNarrative(testData);
console.log(`   Generated: "${procNarrative}"`);
console.log(`   Has exact count: ${procNarrative.includes('2 procedures') ? '✅' : '❌'}`);
console.log(`   No vague terms: ${!procNarrative.includes('various') ? '✅' : '❌'}`);

// Test medications narrative
console.log('\n3. MEDICATIONS NARRATIVE:');
const medNarrative = generateSpecificMedicationsNarrative(testData);
console.log(`   Generated: "${medNarrative.substring(0, 100)}..."`);
console.log(`   Has exact count: ${medNarrative.includes('5 total') ? '✅' : '❌'}`);
console.log(`   No vague terms: ${!medNarrative.includes('several') ? '✅' : '❌'}`);

// Test follow-up narrative
console.log('\n4. FOLLOW-UP NARRATIVE:');
const followUpNarrative = generateSpecificFollowUpNarrative(testData);
console.log(`   Generated: "${followUpNarrative.substring(0, 100)}..."`);
console.log(`   Has exact count: ${followUpNarrative.includes('4 scheduled') ? '✅' : '❌'}`);
console.log(`   No vague terms: ${!followUpNarrative.includes('multiple') ? '✅' : '❌'}`);

// Test vague quantifier replacement
console.log('\n5. VAGUE QUANTIFIER REPLACEMENT:');
const vagueText = 'The patient had multiple complications. Several procedures were performed. Many medications were given.';
const specificText = replaceVagueQuantifiers(vagueText);
console.log(`   Original: "${vagueText}"`);
console.log(`   Replaced: "${specificText}"`);
console.log(`   Improved: ${specificText !== vagueText ? '✅' : '❌'}`);

// Check all narratives for vague terms
console.log('\n=====================================');
console.log('OVERALL RESULTS');
console.log('=====================================\n');

const allNarratives = [compNarrative, procNarrative, medNarrative, followUpNarrative].join(' ');
const vagueTerms = ['multiple', 'several', 'various', 'numerous', 'many', 'few', 'some'];
const foundVague = vagueTerms.filter(term => allNarratives.toLowerCase().includes(term));

if (foundVague.length === 0) {
  console.log('✅ SUCCESS: No vague quantifiers found in any narrative!');
} else {
  console.log(`❌ FAILED: Found vague terms: ${foundVague.join(', ')}`);
}

const hasExactCounts = allNarratives.includes('3 events') &&
                      allNarratives.includes('2 procedures') &&
                      allNarratives.includes('5 total') &&
                      allNarratives.includes('4 scheduled');

if (hasExactCounts) {
  console.log('✅ SUCCESS: All exact counts are present!');
} else {
  console.log('❌ FAILED: Some exact counts are missing');
}

console.log('\n✅ Test completed!');