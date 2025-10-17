#!/usr/bin/env node

/**
 * COMPARATIVE ANALYSIS SCRIPT
 * 
 * Analyzes generated discharge summaries and creates comprehensive comparison report
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// GROUND TRUTH DATA
// ============================================================================

const GROUND_TRUTH = {
  demographics: {
    age: 67,
    gender: 'M',
    mrn: '45678912'
  },
  dates: {
    admission: '2025-09-20',
    surgery: '2025-09-20', // Same day
    discharge: '2025-10-13',
    los: 23 // days
  },
  diagnosis: {
    primary: 'C5-C6 bilateral facet dislocation',
    sci: 'Incomplete SCI, ASIA C',
    neurologicLevel: 'C7'
  },
  procedures: [
    { name: 'Open reduction C5-6', date: '2025-09-20' },
    { name: 'Posterior cervical fusion C4-C7', date: '2025-09-20' },
    { name: 'Lateral mass screws and rods', date: '2025-09-20' },
    { name: 'IVC filter placement', date: '2025-09-30' },
    { name: 'I&D wound infection (1st)', date: '2025-10-04' },
    { name: 'I&D wound infection (2nd)', date: '2025-10-06' }
  ],
  complications: [
    { name: 'Neurogenic shock', pod: '0-5', resolved: true },
    { name: 'UTI', pod: 8, date: '2025-09-28' },
    { name: 'Bilateral PE', pod: 10, date: '2025-09-30' },
    { name: 'MRSA wound infection', pod: 14, date: '2025-10-04' }
  ],
  medications: [
    'Vancomycin IV (4 more weeks via PICC)',
    'Lovenox 40mg SQ daily',
    'Sertraline 50mg daily',
    'Docusate + Senna',
    'Metoprolol',
    'Metformin',
    'Lisinopril',
    'Acetaminophen PRN',
    'Oxycodone PRN'
  ],
  functionalStatus: {
    initial: {
      ue: 'Deltoids/biceps [5/5], triceps [4/5], wrist ext [3/5], finger flex [2/5], intrinsics [0/5]',
      le: '[0/5] throughout'
    },
    discharge: {
      ue: 'C8/T1 now [3/5] (improved)',
      le: 'L leg quad [1/5] (trace flicker), R leg [0/5]'
    },
    recovery: 'Late neurologic recovery noted POD 20'
  },
  dischargeDestination: 'Regional SCI Center (acute inpatient rehab)',
  consultants: [
    'Neurosurgery (Dr. Patterson)',
    'SICU (Dr. Rodriguez)',
    'PM&R (Dr. Sarah Mitchell)',
    'Psychiatry (Dr. Karen Lee)',
    'Infectious Disease (Dr. Robert Chen)',
    'Hematology (Dr. James Park)',
    'PT (Mike Thompson)',
    'OT (Lisa Garcia)'
  ]
};

// ============================================================================
// LOAD RESULTS
// ============================================================================

const resultsDir = './comparative-analysis-results';
const summaries = [];

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          DISCHARGE SUMMARY COMPARATIVE ANALYSIS               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📂 Loading generated summaries...\n');

for (let i = 1; i <= 5; i++) {
  const files = fs.readdirSync(resultsDir).filter(f => f.startsWith(`summary-${i}-`));
  if (files.length > 0) {
    const filepath = path.join(resultsDir, files[0]);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    summaries.push({
      id: i,
      config: data.config,
      data,
      filepath
    });
    console.log(`✅ Loaded Summary ${i}: ${data.config}`);
  }
}

console.log(`\n📊 Total summaries loaded: ${summaries.length}\n`);

// ============================================================================
// FIELD-BY-FIELD EXTRACTION
// ============================================================================

console.log('═'.repeat(70));
console.log('PHASE 1: FIELD-BY-FIELD EXTRACTION');
console.log('═'.repeat(70) + '\n');

const extractedFields = summaries.map(s => {
  const extracted = s.data.summary?.extractedData || {};
  
  return {
    id: s.id,
    config: s.config,
    demographics: {
      age: extracted.demographics?.age,
      gender: extracted.demographics?.gender,
      mrn: extracted.demographics?.mrn
    },
    dates: {
      admission: extracted.dates?.admissionDate || extracted.dates?.admission,
      surgery: extracted.dates?.surgeryDate || extracted.dates?.surgery,
      discharge: extracted.dates?.dischargeDate || extracted.dates?.discharge
    },
    diagnosis: {
      primary: extracted.pathology?.location || extracted.pathology?.type,
      sci: extracted.pathology?.severity || extracted.functionalScores?.ASIA,
      neurologicLevel: extracted.pathology?.neurologicLevel
    },
    procedures: extracted.procedures?.procedures || extracted.procedures || [],
    complications: extracted.complications?.complications || extracted.complications || [],
    medications: extracted.medications?.medications || extracted.medications || [],
    functionalStatus: extracted.functionalStatus || extracted.functionalScores,
    dischargeDestination: extracted.dischargeDestination?.facility || extracted.dischargeDestination?.location,
    qualityScore: s.data.summary?.qualityMetrics?.overall || 0
  };
});

// Display extraction comparison
console.log('📋 DEMOGRAPHICS COMPARISON:\n');
console.log('Ground Truth: Age=67, Gender=M, MRN=45678912\n');
extractedFields.forEach(e => {
  const ageMatch = e.demographics.age === GROUND_TRUTH.demographics.age ? '✅' : '❌';
  const genderMatch = e.demographics.gender === GROUND_TRUTH.demographics.gender ? '✅' : '❌';
  const mrnMatch = e.demographics.mrn === GROUND_TRUTH.demographics.mrn ? '✅' : '❌';
  
  console.log(`Summary ${e.id}: ${ageMatch} Age=${e.demographics.age}, ${genderMatch} Gender=${e.demographics.gender}, ${mrnMatch} MRN=${e.demographics.mrn}`);
});

console.log('\n📅 DATES COMPARISON:\n');
console.log('Ground Truth: Admission=2025-09-20, Surgery=2025-09-20, Discharge=2025-10-13\n');
extractedFields.forEach(e => {
  const admMatch = e.dates.admission === GROUND_TRUTH.dates.admission ? '✅' : '❌';
  const surgMatch = e.dates.surgery === GROUND_TRUTH.dates.surgery ? '✅' : '❌';
  const dcMatch = e.dates.discharge === GROUND_TRUTH.dates.discharge ? '✅' : '❌';
  
  console.log(`Summary ${e.id}:`);
  console.log(`  ${admMatch} Admission: ${e.dates.admission}`);
  console.log(`  ${surgMatch} Surgery: ${e.dates.surgery}`);
  console.log(`  ${dcMatch} Discharge: ${e.dates.discharge}`);
});

console.log('\n🏥 PROCEDURES COMPARISON:\n');
console.log(`Ground Truth: ${GROUND_TRUTH.procedures.length} procedures\n`);
extractedFields.forEach(e => {
  console.log(`Summary ${e.id}: ${e.procedures.length} procedures extracted`);
  e.procedures.forEach(p => {
    console.log(`  - ${p.name || p} (${p.date || 'no date'})`);
  });
});

console.log('\n⚠️  COMPLICATIONS COMPARISON:\n');
console.log(`Ground Truth: ${GROUND_TRUTH.complications.length} complications\n`);
extractedFields.forEach(e => {
  console.log(`Summary ${e.id}: ${e.complications.length} complications extracted`);
  e.complications.forEach(c => {
    console.log(`  - ${c.name || c} (${c.date || 'no date'})`);
  });
});

console.log('\n💊 MEDICATIONS COMPARISON:\n');
console.log(`Ground Truth: ${GROUND_TRUTH.medications.length} medications\n`);
extractedFields.forEach(e => {
  console.log(`Summary ${e.id}: ${e.medications.length} medications extracted`);
  e.medications.slice(0, 3).forEach(m => {
    console.log(`  - ${m.name || m}`);
  });
  if (e.medications.length > 3) {
    console.log(`  ... and ${e.medications.length - 3} more`);
  }
});

// ============================================================================
// ACCURACY SCORING
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('PHASE 2: ACCURACY SCORING');
console.log('═'.repeat(70) + '\n');

const accuracyScores = extractedFields.map(e => {
  let score = 0;
  let maxScore = 0;
  
  // Demographics (5 points)
  maxScore += 5;
  if (e.demographics.age === GROUND_TRUTH.demographics.age) score += 2;
  if (e.demographics.gender === GROUND_TRUTH.demographics.gender) score += 2;
  if (e.demographics.mrn === GROUND_TRUTH.demographics.mrn) score += 1;
  
  // Dates (10 points)
  maxScore += 10;
  if (e.dates.admission === GROUND_TRUTH.dates.admission) score += 4;
  if (e.dates.surgery === GROUND_TRUTH.dates.surgery) score += 3;
  if (e.dates.discharge === GROUND_TRUTH.dates.discharge) score += 3;
  
  // Procedures (10 points)
  maxScore += 10;
  const procedureScore = (e.procedures.length / GROUND_TRUTH.procedures.length) * 10;
  score += Math.min(10, procedureScore);
  
  // Complications (5 points)
  maxScore += 5;
  const compScore = (e.complications.length / GROUND_TRUTH.complications.length) * 5;
  score += Math.min(5, compScore);
  
  // Medications (3 points)
  maxScore += 3;
  const medScore = (e.medications.length / GROUND_TRUTH.medications.length) * 3;
  score += Math.min(3, medScore);
  
  return {
    id: e.id,
    config: e.config,
    score: score,
    maxScore: maxScore,
    percentage: ((score / maxScore) * 100).toFixed(1),
    qualityScore: (e.qualityScore * 100).toFixed(1)
  };
});

console.log('📊 ACCURACY SCORES:\n');
accuracyScores.forEach(s => {
  console.log(`Summary ${s.id}: ${s.score}/${s.maxScore} (${s.percentage}%) | Quality Score: ${s.qualityScore}%`);
  console.log(`  Config: ${s.config}\n`);
});

// ============================================================================
// SAVE DETAILED REPORT
// ============================================================================

const report = {
  testDate: new Date().toISOString(),
  groundTruth: GROUND_TRUTH,
  summaries: extractedFields,
  accuracyScores,
  analysis: {
    bestAccuracy: accuracyScores.reduce((a, b) => a.percentage > b.percentage ? a : b),
    worstAccuracy: accuracyScores.reduce((a, b) => a.percentage < b.percentage ? a : b),
    averageAccuracy: (accuracyScores.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / accuracyScores.length).toFixed(1)
  }
};

const reportPath = path.join(resultsDir, 'comparative-analysis-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('\n' + '═'.repeat(70));
console.log('📊 ANALYSIS SUMMARY');
console.log('═'.repeat(70) + '\n');

console.log(`🏆 Best Accuracy: Summary ${report.analysis.bestAccuracy.id} (${report.analysis.bestAccuracy.percentage}%)`);
console.log(`   Config: ${report.analysis.bestAccuracy.config}\n`);

console.log(`⚠️  Worst Accuracy: Summary ${report.analysis.worstAccuracy.id} (${report.analysis.worstAccuracy.percentage}%)`);
console.log(`   Config: ${report.analysis.worstAccuracy.config}\n`);

console.log(`📈 Average Accuracy: ${report.analysis.averageAccuracy}%\n`);

console.log(`💾 Detailed report saved to: ${reportPath}\n`);

console.log('✅ COMPARATIVE ANALYSIS COMPLETE\n');

