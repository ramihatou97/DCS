import { buildCausalTimeline } from './src/utils/causalTimeline.js';
import { trackTreatmentResponses } from './src/utils/treatmentResponse.js';
import { analyzeFunctionalEvolution } from './src/utils/functionalEvolution.js';

// Simulate extracted data
const mockExtractedData = {
  dates: {
    admissionDate: '2024-03-15',
    dischargeDate: '2024-03-17'
  },
  procedures: {
    procedures: [
      { name: 'craniotomy', date: '2024-03-16' }
    ]
  },
  complications: {
    complications: [
      { name: 'vasospasm', date: '2024-03-16', severity: 'moderate' }
    ]
  },
  medications: {
    current: [
      { name: 'nimodipine', dose: '60mg', frequency: 'Q4H', startDate: '2024-03-15' }
    ]
  },
  functionalScores: {
    kps: 80,
    ecog: 1,
    mRS: 2
  }
};

console.log('=== TESTING PHASE 2 MODULES ===\n');

// Test 1: Causal Timeline
console.log('1. Building Causal Timeline...');
const timeline = buildCausalTimeline(mockExtractedData);
console.log(`   Events: ${timeline.events.length}`);
console.log(`   Relationships: ${timeline.relationships.length}`);
console.log(`   Milestones: ${timeline.milestones.length}`);

timeline.events.forEach((e, i) => {
  console.log(`   Event ${i}: category=${e.category}, type=${e.type}, desc=${e.description}`);
});

console.log('\n   Relationships:');
timeline.relationships.forEach(r => {
  console.log(`   - ${r.type}: ${r.from} -> ${r.to} (${r.description})`);
});

// Test 2: Treatment Responses
console.log('\n2. Tracking Treatment Responses...');
const treatmentResponses = trackTreatmentResponses(mockExtractedData, timeline);
console.log(`   Responses: ${treatmentResponses.responses.length}`);
treatmentResponses.responses.forEach((r, i) => {
  console.log(`   Response ${i}: ${r.intervention?.name} -> ${r.response}`);
});

// Test 3: Functional Evolution
console.log('\n3. Analyzing Functional Evolution...');
const functionalEvolution = analyzeFunctionalEvolution(mockExtractedData, timeline);
console.log(`   Score Timeline: ${functionalEvolution.scoreTimeline.length}`);
console.log(`   Status Changes: ${functionalEvolution.statusChanges.length}`);
console.log(`   Trajectory: ${functionalEvolution.trajectory?.pattern || 'N/A'}`);
console.log(`   Summary: ${JSON.stringify(functionalEvolution.summary, null, 2)}`);
