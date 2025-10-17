/**
 * Quick diagnostic to see extraction structure
 */

import { extractMedicalEntities } from '../src/services/extraction.js';

const testNote = `
DISCHARGE SUMMARY

Patient: Jane Smith
Admission Date: January 10, 2025
Discharge Date: January 28, 2025

CHIEF COMPLAINT: Progressive headaches, cognitive decline

HISTORY:
52-year-old female with new diagnosis of left frontal glioblastoma (GBM, IDH-wildtype, MGMT methylated) admitted for surgical resection.

HOSPITAL COURSE:

January 10, 2025 (Admission):
- Baseline assessment: KPS 80, ECOG 1
- Mild word-finding difficulty
- Montreal Cognitive Assessment (MoCA): 22/30

January 11, 2025:
- 08:00: Started dexamethasone 4mg Q6H for cerebral edema
- MRI showed 4.2 cm heterogeneously enhancing left frontal mass with surrounding edema

January 12, 2025:
- 07:00: Taken to OR for awake craniotomy with intraoperative mapping
- 11:00: Gross total resection achieved (>95% resection)
- Intraoperative pathology confirmed high-grade glioma
- No intraoperative complications

January 13, 2025 (Post-op Day 1):
- Neurologically intact, no new deficits
- MRI showed gross total resection, expected post-op changes
- KPS: 70 (due to post-op fatigue)

January 14, 2025 (Post-op Day 2):
- 14:00: New onset expressive aphasia noted
- 14:30: STAT CT head showed small area of restricted diffusion in left frontal region
- 15:00: Diagnosed with post-operative stroke/ischemia
- Increased dexamethasone to 6mg Q6H
- Speech therapy consulted

DISCHARGE MEDICATIONS:
1. Dexamethasone 4mg PO Q12H (continue taper)
2. Levetiracetam 1000mg PO BID
3. Pantoprazole 40mg PO daily
4. Ondansetron 8mg PO Q8H PRN nausea
`;

(async () => {
  console.log('Running extraction...\n');

  const result = await extractMedicalEntities(testNote);

  console.log('='.repeat(80));
  console.log('EXTRACTION STRUCTURE DIAGNOSTICS');
  console.log('='.repeat(80));

  console.log('\n1. MEDICATIONS STRUCTURE:');
  console.log('medications keys:', Object.keys(result.extracted.medications || {}));
  console.log('medications.current:', result.extracted.medications?.current ? 'EXISTS' : 'DOES NOT EXIST');
  console.log('medications.medications:', result.extracted.medications?.medications ? 'EXISTS' : 'DOES NOT EXIST');
  if (result.extracted.medications) {
    console.log('medications structure:', JSON.stringify(result.extracted.medications, null, 2).substring(0, 500));
  }

  console.log('\n2. PROCEDURES STRUCTURE:');
  console.log('procedures keys:', Object.keys(result.extracted.procedures || {}));
  console.log('procedures.procedures:', result.extracted.procedures?.procedures ? 'EXISTS' : 'DOES NOT EXIST');
  if (result.extracted.procedures) {
    console.log('procedures structure:', JSON.stringify(result.extracted.procedures, null, 2).substring(0, 500));
  }

  console.log('\n3. COMPLICATIONS STRUCTURE:');
  console.log('complications keys:', Object.keys(result.extracted.complications || {}));
  console.log('complications.complications:', result.extracted.complications?.complications ? 'EXISTS' : 'DOES NOT EXIST');
  if (result.extracted.complications) {
    console.log('complications structure:', JSON.stringify(result.extracted.complications, null, 2).substring(0, 500));
  }

  console.log('\n4. FUNCTIONAL SCORES STRUCTURE:');
  console.log('functionalScores:', result.extracted.functionalScores ? 'EXISTS' : 'DOES NOT EXIST');
  console.log('functionalStatus:', result.extracted.functionalStatus ? 'EXISTS' : 'DOES NOT EXIST');
  if (result.extracted.functionalScores) {
    console.log('functionalScores:', JSON.stringify(result.extracted.functionalScores, null, 2));
  }
  if (result.extracted.functionalStatus) {
    console.log('functionalStatus:', JSON.stringify(result.extracted.functionalStatus, null, 2));
  }

  console.log('\n5. CLINICAL INTELLIGENCE:');
  console.log('clinicalIntelligence keys:', result.clinicalIntelligence ? Object.keys(result.clinicalIntelligence) : 'DOES NOT EXIST');
  console.log('treatmentResponses:', result.clinicalIntelligence?.treatmentResponses?.responses?.length || 0, 'responses');
  console.log('functionalEvolution:', result.clinicalIntelligence?.functionalEvolution?.scoreTimeline?.length || 0, 'scores');
  console.log('timeline:', result.clinicalIntelligence?.timeline?.events?.length || 0, 'events');
  console.log('timeline relationships:', result.clinicalIntelligence?.timeline?.relationships?.length || 0, 'relationships');

  console.log('\n' + '='.repeat(80));
})();
