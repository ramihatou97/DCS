/**
 * Phase 1 Improvements Testing Script
 * 
 * Tests the DCS app with Phase 1 fixes applied against the Robert Chen case
 * Compares output to Gemini ground truth (98.6% accuracy)
 * 
 * Usage: node test-phase1-improvements.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { orchestrateSummaryGeneration } from './src/services/summaryOrchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ground truth data from comparative analysis
const GROUND_TRUTH = {
  demographics: {
    name: 'Robert Chen',
    mrn: '45678912',
    age: 67,
    gender: 'Male',
    admission: '09/20/2025',
    discharge: '10/13/2025',
    lengthOfStay: 23,
    attending: 'Dr. Patterson'
  },
  principalDiagnosis: 'C5-C6 bilateral facet dislocation with incomplete spinal cord injury (ASIA C)',
  secondaryDiagnoses: [
    'Neurogenic shock (resolved)',
    'Bilateral pulmonary embolism (POD 10)',
    'Postoperative MRSA wound infection (POD 14)',
    'Urinary tract infection (POD 8, resolved)',
    'Adjustment disorder with depressed mood',
    'Hypertension',
    'Type 2 diabetes mellitus',
    'Coronary artery disease s/p stent 2020',
    'Benign prostatic hyperplasia',
    'Spinal shock (resolved)'
  ],
  procedures: [
    { name: 'Open reduction C5-6 + Posterior cervical fusion C4-C7', date: '09/20/2025', operator: 'Dr. Patterson' },
    { name: 'IVC filter placement', date: '09/30/2025' },
    { name: 'Irrigation and debridement #1', date: '10/04/2025' },
    { name: 'Irrigation and debridement #2', date: '10/06/2025' },
    { name: 'PICC line placement', date: '10/06/2025' }
  ],
  complications: [
    { name: 'Neurogenic shock', timing: 'POD 0-5', management: 'Pressors' },
    { name: 'Urinary tract infection', timing: 'POD 8', management: 'Antibiotics' },
    { name: 'Bilateral pulmonary embolism', timing: 'POD 10', management: 'IVC filter, anticoagulation' },
    { name: 'MRSA wound infection', timing: 'POD 14', management: 'I&D x2, vancomycin 6 weeks' }
  ],
  medications: [
    'Vancomycin 1g IV q12h x 4 weeks',
    'Lovenox 40mg SQ daily',
    'Sertraline 50mg PO daily',
    'Docusate/Senna',
    'Gabapentin 300mg PO TID',
    'ASA 81mg PO daily',
    'Metoprolol 25mg PO BID',
    'Metformin 1000mg PO BID',
    'Oxycodone 5mg PO q6h PRN',
    'Acetaminophen PRN'
  ],
  functionalStatus: {
    motorExam: 'UE: 5/5 proximal, 4/5 triceps, 3/5 wrist, 2/5 hand; LE: L leg 1/5 quad, R leg 0/5',
    lateRecovery: 'POD 20: L leg trace flicker in quad [1/5], UE C8/T1 improved to [3/5]',
    sensory: 'C5 level',
    reflexes: '2+ hyperreflexic'
  },
  dischargeDestination: 'Regional SCI Center (acute inpatient rehabilitation)'
};

/**
 * Load clinical notes from summaries.md
 */
function loadClinicalNotes() {
  const summariesPath = path.join(__dirname, 'summaries.md');
  const content = fs.readFileSync(summariesPath, 'utf-8');
  
  // Extract original clinical notes (lines 1-741)
  const lines = content.split('\n');
  const notesEndIndex = lines.findIndex(line => line.includes('# Summary 1: DCS App'));
  
  if (notesEndIndex === -1) {
    throw new Error('Could not find end of clinical notes in summaries.md');
  }
  
  const notes = lines.slice(0, notesEndIndex).join('\n');
  console.log(`✅ Loaded clinical notes: ${notes.length} characters, ${notesEndIndex} lines`);
  
  return notes;
}

/**
 * Extract structured data from narrative text
 */
function extractStructuredData(narrative) {
  const extracted = {
    demographics: {},
    principalDiagnosis: null,
    secondaryDiagnoses: [],
    procedures: [],
    complications: [],
    medications: [],
    functionalStatus: {},
    dischargeDestination: null
  };
  
  // Extract demographics
  const mrnMatch = narrative.match(/MRN[:\s]+(\d+)/i);
  if (mrnMatch) extracted.demographics.mrn = mrnMatch[1];
  
  const nameMatch = narrative.match(/Patient[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/);
  if (nameMatch) extracted.demographics.name = nameMatch[1];
  
  const ageMatch = narrative.match(/Age[:\s]+(\d+)/i);
  if (ageMatch) extracted.demographics.age = parseInt(ageMatch[1]);
  
  const genderMatch = narrative.match(/Gender[:\s]+(Male|Female|M|F)/i);
  if (genderMatch) extracted.demographics.gender = genderMatch[1];
  
  const admissionMatch = narrative.match(/Admission[:\s]+(\d{2}\/\d{2}\/\d{4})/i);
  if (admissionMatch) extracted.demographics.admission = admissionMatch[1];
  
  const dischargeMatch = narrative.match(/Discharge[:\s]+(\d{2}\/\d{2}\/\d{4})/i);
  if (dischargeMatch) extracted.demographics.discharge = dischargeMatch[1];
  
  const losMatch = narrative.match(/Length of Stay[:\s]+(\d+)/i);
  if (losMatch) extracted.demographics.lengthOfStay = parseInt(losMatch[1]);
  
  const attendingMatch = narrative.match(/Attending[:\s]+(Dr\. [A-Z][a-z]+)/i);
  if (attendingMatch) extracted.demographics.attending = attendingMatch[1];
  
  // Extract medications (look for specific medications)
  const medicationPatterns = [
    /Vancomycin\s+\d+g?\s+IV\s+q\d+h/i,
    /Oxycodone\s+\d+mg\s+(?:PO\s+)?q\d+h/i,
    /Lovenox\s+\d+mg/i,
    /Sertraline\s+\d+mg/i,
    /Gabapentin\s+\d+mg/i,
    /Metoprolol\s+\d+mg/i,
    /Metformin\s+\d+mg/i
  ];
  
  for (const pattern of medicationPatterns) {
    const match = narrative.match(pattern);
    if (match) {
      extracted.medications.push(match[0]);
    }
  }
  
  // Check for neurogenic shock
  if (narrative.toLowerCase().includes('neurogenic shock')) {
    extracted.complications.push({ name: 'Neurogenic shock' });
  }
  
  // Check for UTI
  if (narrative.toLowerCase().includes('urinary tract infection') || narrative.toLowerCase().includes('uti')) {
    extracted.complications.push({ name: 'UTI' });
  }
  
  // Check for PE
  if (narrative.toLowerCase().includes('pulmonary embolism') || narrative.toLowerCase().includes(' pe ')) {
    extracted.complications.push({ name: 'Pulmonary embolism' });
  }
  
  // Check for wound infection
  if (narrative.toLowerCase().includes('mrsa') || narrative.toLowerCase().includes('wound infection')) {
    extracted.complications.push({ name: 'Wound infection' });
  }
  
  // Check for late recovery
  if (narrative.includes('1/5') && narrative.toLowerCase().includes('quad')) {
    extracted.functionalStatus.lateRecovery = true;
  }
  
  // Check for discharge destination
  const destMatch = narrative.match(/(?:discharge|transfer)(?:d)?\s+to[:\s]+([^.\n]+)/i);
  if (destMatch) {
    extracted.dischargeDestination = destMatch[1].trim();
  }
  
  return extracted;
}

/**
 * Calculate accuracy scores
 */
function calculateAccuracy(extracted, groundTruth) {
  const scores = {
    demographics: 0,
    secondaryDiagnoses: 0,
    procedures: 0,
    complications: 0,
    medications: 0,
    functionalStatus: 0,
    dischargeDestination: 0
  };
  
  // Demographics (8 fields)
  let demographicsCorrect = 0;
  if (extracted.demographics.name === groundTruth.demographics.name) demographicsCorrect++;
  if (extracted.demographics.mrn === groundTruth.demographics.mrn) demographicsCorrect++;
  if (extracted.demographics.age === groundTruth.demographics.age) demographicsCorrect++;
  if (extracted.demographics.gender?.toLowerCase().startsWith(groundTruth.demographics.gender.toLowerCase()[0])) demographicsCorrect++;
  if (extracted.demographics.admission === groundTruth.demographics.admission) demographicsCorrect++;
  if (extracted.demographics.discharge === groundTruth.demographics.discharge) demographicsCorrect++;
  if (extracted.demographics.lengthOfStay === groundTruth.demographics.lengthOfStay) demographicsCorrect++;
  if (extracted.demographics.attending === groundTruth.demographics.attending) demographicsCorrect++;
  scores.demographics = (demographicsCorrect / 8) * 100;
  
  // Complications (4 total)
  const complicationNames = extracted.complications.map(c => c.name.toLowerCase());
  let complicationsCorrect = 0;
  if (complicationNames.some(n => n.includes('neurogenic'))) complicationsCorrect++;
  if (complicationNames.some(n => n.includes('uti') || n.includes('urinary'))) complicationsCorrect++;
  if (complicationNames.some(n => n.includes('embolism') || n.includes('pe'))) complicationsCorrect++;
  if (complicationNames.some(n => n.includes('mrsa') || n.includes('wound'))) complicationsCorrect++;
  scores.complications = (complicationsCorrect / 4) * 100;
  
  // Medications (check for key medications)
  let medicationsCorrect = 0;
  const medText = extracted.medications.join(' ').toLowerCase();
  if (medText.includes('vancomycin') && medText.includes('q12h')) medicationsCorrect++;
  if (medText.includes('oxycodone') && medText.includes('q6h')) medicationsCorrect++; // CRITICAL: Must be q6h not q4h
  if (medText.includes('lovenox')) medicationsCorrect++;
  if (medText.includes('sertraline')) medicationsCorrect++;
  if (medText.includes('gabapentin')) medicationsCorrect++;
  scores.medications = (medicationsCorrect / 5) * 100;
  
  // Functional status (late recovery)
  if (extracted.functionalStatus.lateRecovery) {
    scores.functionalStatus = 100;
  } else {
    scores.functionalStatus = 0;
  }
  
  // Discharge destination
  if (extracted.dischargeDestination && extracted.dischargeDestination.toLowerCase().includes('sci')) {
    scores.dischargeDestination = 100;
  } else {
    scores.dischargeDestination = 0;
  }
  
  // Overall
  const overall = (
    scores.demographics +
    scores.complications +
    scores.medications +
    scores.functionalStatus +
    scores.dischargeDestination
  ) / 5;
  
  return { ...scores, overall };
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🧪 PHASE 1 IMPROVEMENTS TEST\n');
  console.log('Testing DCS app with Phase 1 fixes against Robert Chen case\n');
  
  try {
    // Load clinical notes
    console.log('📄 Loading clinical notes...');
    const notes = loadClinicalNotes();
    
    // Generate discharge summary
    console.log('\n🤖 Generating discharge summary with DCS app...');
    const startTime = Date.now();
    const result = await orchestrateSummaryGeneration(notes, {
      enableLearning: true,
      enableFeedbackLoops: true,
      maxRefinementIterations: 2,
      qualityThreshold: 0.7
    });
    const duration = Date.now() - startTime;
    
    if (!result.success) {
      console.error('❌ Summary generation failed:', result.error);
      return;
    }
    
    console.log(`✅ Summary generated in ${(duration / 1000).toFixed(1)}s`);
    
    // Extract full narrative text
    const narrative = Object.values(result.summary)
      .filter(v => typeof v === 'string')
      .join('\n\n');
    
    // Save output
    const outputPath = path.join(__dirname, 'phase1-test-output.txt');
    fs.writeFileSync(outputPath, narrative, 'utf-8');
    console.log(`💾 Output saved to: ${outputPath}`);
    
    // Extract structured data from narrative
    console.log('\n📊 Analyzing output...');
    const extracted = extractStructuredData(narrative);
    
    // Calculate accuracy
    const scores = calculateAccuracy(extracted, GROUND_TRUTH);
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('ACCURACY RESULTS');
    console.log('='.repeat(60));
    console.log(`Demographics:          ${scores.demographics.toFixed(1)}% (${extracted.demographics.mrn ? '✅' : '❌'} MRN, ${extracted.demographics.name ? '✅' : '❌'} Name)`);
    console.log(`Complications:         ${scores.complications.toFixed(1)}% (${extracted.complications.length}/4 captured)`);
    console.log(`Medications:           ${scores.medications.toFixed(1)}% (${extracted.medications.length} found)`);
    console.log(`Functional Status:     ${scores.functionalStatus.toFixed(1)}% (${extracted.functionalStatus.lateRecovery ? '✅' : '❌'} Late recovery)`);
    console.log(`Discharge Destination: ${scores.dischargeDestination.toFixed(1)}% (${extracted.dischargeDestination ? '✅' : '❌'} Present)`);
    console.log('='.repeat(60));
    console.log(`OVERALL ACCURACY:      ${scores.overall.toFixed(1)}%`);
    console.log('='.repeat(60));
    
    // Critical checks
    console.log('\n🔍 CRITICAL CHECKS:');
    console.log(`  Demographics section present: ${extracted.demographics.mrn ? '✅ YES' : '❌ NO'}`);
    console.log(`  Neurogenic shock captured:    ${extracted.complications.some(c => c.name.toLowerCase().includes('neurogenic')) ? '✅ YES' : '❌ NO'}`);
    console.log(`  UTI captured:                 ${extracted.complications.some(c => c.name.toLowerCase().includes('uti') || c.name.toLowerCase().includes('urinary')) ? '✅ YES' : '❌ NO'}`);
    console.log(`  Oxycodone q6h (not q4h):      ${narrative.includes('q6h') && narrative.includes('Oxycodone') ? '✅ YES' : '❌ NO'}`);
    console.log(`  Late recovery documented:     ${extracted.functionalStatus.lateRecovery ? '✅ YES' : '❌ NO'}`);
    
    // Success criteria
    console.log('\n🎯 SUCCESS CRITERIA:');
    const targetAccuracy = 70;
    if (scores.overall >= targetAccuracy) {
      console.log(`  ✅ Target accuracy achieved: ${scores.overall.toFixed(1)}% >= ${targetAccuracy}%`);
    } else {
      console.log(`  ❌ Target accuracy NOT achieved: ${scores.overall.toFixed(1)}% < ${targetAccuracy}%`);
    }
    
    // Comparison to baseline
    const baselineAccuracy = 43.3;
    const improvement = scores.overall - baselineAccuracy;
    console.log(`  📈 Improvement over baseline: +${improvement.toFixed(1)} percentage points`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run test
runTest();

