/**
 * Diagnose why GBM and SCI status changes aren't detected
 */

import { extractMedicalEntities } from '../src/services/extraction.js';
import fs from 'fs';

// Load test cases
const testFile = fs.readFileSync('./docs/test-phase2-e2e.js', 'utf-8');
const gbmMatch = testFile.match(/gbm_treatment_response:\s*\{[\s\S]*?text:\s*`([\s\S]*?)`\s*\}/);
const sciMatch = testFile.match(/sci_functional_evolution:\s*\{[\s\S]*?text:\s*`([\s\S]*?)`\s*\}/);

const gbmText = gbmMatch ? gbmMatch[1] : '';
const sciText = sciMatch ? sciMatch[1] : '';

console.log('='.repeat(80));
console.log('FUNCTIONAL SCORES DIAGNOSTIC');
console.log('='.repeat(80));

// Test GBM
console.log('\n1. GBM with Treatment Response Timeline');
console.log('-'.repeat(80));
const gbmResult = await extractMedicalEntities(gbmText);
console.log('\nExtracted functional scores:');
console.log('  functionalScores:', JSON.stringify(gbmResult.extracted.functionalScores, null, 2));
console.log('\nFunctional Evolution:');
console.log('  scoreTimeline:', gbmResult.clinicalIntelligence?.functionalEvolution?.scoreTimeline?.map(s => ({
  type: s.type,
  score: s.score,
  date: s.date,
  context: s.context
})));
console.log('  statusChanges:', gbmResult.clinicalIntelligence?.functionalEvolution?.statusChanges?.length || 0);
console.log('  trajectory:', {
    pattern: gbmResult.clinicalIntelligence?.functionalEvolution?.trajectory?.pattern,
    trend: gbmResult.clinicalIntelligence?.functionalEvolution?.trajectory?.trend,
    overallChange: gbmResult.clinicalIntelligence?.functionalEvolution?.trajectory?.overallChange
  });

// Test SCI
console.log('\n\n2. Spinal Cord Injury with Detailed Functional Scores');
console.log('-'.repeat(80));
const sciResult = await extractMedicalEntities(sciText);
console.log('\nExtracted functional scores:');
console.log('  functionalScores:', JSON.stringify(sciResult.extracted.functionalScores, null, 2));
console.log('\nFunctional Evolution:');
console.log('  scoreTimeline:', sciResult.clinicalIntelligence?.functionalEvolution?.scoreTimeline?.map(s => ({
  type: s.type,
  score: s.score,
  date: s.date,
  context: s.context
})));
console.log('  statusChanges:', sciResult.clinicalIntelligence?.functionalEvolution?.statusChanges?.length || 0);
console.log('  trajectory:', {
    pattern: sciResult.clinicalIntelligence?.functionalEvolution?.trajectory?.pattern,
    trend: sciResult.clinicalIntelligence?.functionalEvolution?.trajectory?.trend,
    overallChange: sciResult.clinicalIntelligence?.functionalEvolution?.trajectory?.overallChange
  });

console.log('\n' + '='.repeat(80));
