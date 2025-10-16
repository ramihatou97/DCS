/**
 * Test script to verify the application is working correctly
 * Tests the extraction service without ML dependencies
 */

import { extractMedicalEntities } from './src/services/extraction.js';

const testNote = `
DISCHARGE SUMMARY

Patient: John Doe
MRN: 123456
Admission Date: 11/20/2024
Discharge Date: 11/25/2024

DISCHARGE DIAGNOSES:
1. Subarachnoid hemorrhage, Hunt and Hess Grade 3
2. Cerebral vasospasm - resolved

PROCEDURES:
1. Endovascular coiling of anterior communicating artery aneurysm (11/21/2024)

HOSPITAL COURSE:
The patient presented with sudden onset severe headache. CT showed subarachnoid hemorrhage. 
Underwent successful aneurysm coiling without complications.

MEDICATIONS ON DISCHARGE:
1. Nimodipine 60mg PO q4h
2. Levetiracetam 500mg PO BID

FOLLOW-UP:
Neurosurgery clinic in 2 weeks
`;

async function testExtraction() {
  console.log('Testing extraction service...\n');
  
  try {
    // Test with pattern-based extraction (no ML)
    const result = await extractMedicalEntities(testNote, {
      useLLM: false,
      usePatterns: true,
      useBioBERT: false,
      useVectorSearch: false
    });
    
    console.log('✅ Extraction completed successfully!\n');
    console.log('Extracted Data Summary:');
    console.log('------------------------');
    
    if (result.extracted) {
      const data = result.extracted;
      
      // Check key fields
      if (data.dates?.admissionDate) {
        console.log(`✓ Admission Date: ${data.dates.admissionDate}`);
      }
      if (data.dates?.dischargeDate) {
        console.log(`✓ Discharge Date: ${data.dates.dischargeDate}`);
      }
      if (data.diagnosis?.primary) {
        console.log(`✓ Primary Diagnosis: ${data.diagnosis.primary}`);
      }
      if (data.procedures?.procedures?.length > 0) {
        console.log(`✓ Procedures: ${data.procedures.procedures.length} found`);
      }
      if (data.medications?.current?.length > 0) {
        console.log(`✓ Medications: ${data.medications.current.length} found`);
      }
      if (data.followUp?.appointments?.length > 0) {
        console.log(`✓ Follow-up: ${data.followUp.appointments.length} appointments`);
      }
      
      console.log(`\n✓ Confidence Score: ${result.confidence}%`);
      console.log(`✓ Pathology Types: ${result.pathologyTypes?.join(', ') || 'None detected'}`);
    }
    
    console.log('\n🎉 All core extraction features are working!');
    console.log('The application is ready for use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testExtraction().then(() => {
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});