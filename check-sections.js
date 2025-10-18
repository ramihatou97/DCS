import extractionService from './src/services/extraction.js';
import narrativeEngine from './src/services/narrativeEngine.js';

const { extractMedicalEntities } = extractionService;
const { generateNarrative } = narrativeEngine;

const testNotes = `
Patient Name: John Smith
MRN: 987654
DOB: 1960-05-20
Age: 63 years
Gender: Male
Attending: Dr. Sarah Johnson
Admission Date: 11/01/2023
Discharge Date: 11/15/2023
Primary Diagnosis: Subarachnoid hemorrhage
Medications: Nimodipine 60mg PO q4h
Discharge Disposition: Home
Follow-up: Neurosurgery in 2 weeks
`;

console.log('Extracting data...');
const extractedData = await extractMedicalEntities(testNotes);

console.log('\nGenerating narrative...');
const narrative = await generateNarrative(extractedData, testNotes, { useLLM: false });

console.log('\nNarrative sections generated:');
const sections = Object.keys(narrative).filter(k => k !== 'metadata' && k !== 'qualityMetrics');
sections.forEach(key => {
  const value = narrative[key];
  const hasContent = value && value.length > 0;
  console.log(`  ${key}: ${hasContent ? '✅ Has content' : '❌ Empty'} (length: ${value ? value.length : 0})`);
});

console.log('\nChecking critical sections:');
const CRITICAL_SECTIONS = [
  'demographics',
  'admissionDate',
  'dischargeDate',
  'primaryDiagnosis',
  'hospitalCourse',
  'procedures',
  'medications',
  'dischargeDisposition',
  'followUp'
];

CRITICAL_SECTIONS.forEach(section => {
  const exists = narrative[section] !== undefined && narrative[section] !== null;
  const hasContent = exists && narrative[section].length > 0;
  console.log(`  ${section}: ${exists ? (hasContent ? '✅ Exists with content' : '⚠️ Exists but empty') : '❌ Missing'}`);
  if (exists && hasContent) {
    console.log(`    Preview: ${narrative[section].substring(0, 50)}...`);
  }
});