#!/usr/bin/env node

/**
 * Quick Quality Issues Test
 * Identifies specific problems with Specificity and Timeliness
 */

import { calculateQualityMetrics } from './src/services/qualityMetrics.js';

// Mock narrative with common issues
const mockNarrative = {
  demographics: "Patient Name: John Smith, MRN: 987654, DOB: 05/20/1960, Age: 63 years, Gender: Male",
  admissionDate: "Admission Date: 11/01/2023",
  dischargeDate: "Discharge Date: 11/15/2023",
  primaryDiagnosis: "Primary Diagnosis: Aneurysmal subarachnoid hemorrhage (ICD-10: I60.9)",
  hospitalCourse: "The patient had multiple complications during the hospital stay. Several procedures were performed. Many medications were administered.",
  procedures: "The patient underwent various procedures including coiling and EVD placement.",
  medications: "Discharge medications include Nimodipine and several other medications.",
  dischargeDisposition: "Discharged home with family support",
  followUp: "Follow up with multiple specialists in a few weeks.",
  presentingSymptoms: "Patient presented with severe headache and some neurological symptoms.",
  physicalExam: "Physical examination showed various findings.",
  consultations: "Multiple consultations were obtained.",
  imaging: "Numerous imaging studies were performed.",
  labs: "Laboratory results showed some abnormalities.",
  complications: "The patient experienced several complications including mild vasospasm."
};

const mockExtractedData = {
  demographics: {
    name: 'John Smith',
    mrn: '987654',
    age: 63,
    gender: 'M'
  },
  dates: {
    admissionDate: '2023-11-01',
    dischargeDate: '2023-11-15'
  },
  pathology: {
    type: 'SAH',
    huntHess: 3,
    fisher: 3
  },
  procedures: {
    procedures: [
      { name: 'Endovascular coiling', date: '2023-11-02' },
      { name: 'EVD placement', date: '2023-11-05' }
    ]
  },
  medications: {
    discharge: [
      { name: 'Nimodipine', dose: '60mg', frequency: 'q4h' },
      { name: 'Levetiracetam', dose: '500mg', frequency: 'BID' }
    ]
  },
  functionalScores: {
    gcs: 15,
    kps: null,
    mRS: null
  },
  labs: [
    { name: 'WBC', value: 'elevated' },
    { name: 'Hemoglobin', value: 'low' }
  ]
};

// Mock timing metrics
const mockMetrics = {
  processingTime: 11231,  // 11.2 seconds (way over 3s target)
  extractionTime: 8500,   // 8.5 seconds
  narrativeTime: 2731     // 2.7 seconds
};

async function analyzeQualityIssues() {
  console.log('=====================================');
  console.log('QUALITY ISSUES ANALYSIS');
  console.log('=====================================\n');

  // Calculate all quality metrics
  const qualityResult = await calculateQualityMetrics(
    mockNarrative,
    mockExtractedData,
    mockMetrics
  );

  // Show overall score
  console.log(`📊 Overall Quality: ${Math.round(qualityResult.overall * 100)}%\n`);

  // Show dimension breakdown
  console.log('📈 Dimension Scores:');
  for (const [dimension, data] of Object.entries(qualityResult.dimensions)) {
    const percentage = Math.round(data.score * 100);
    const status = percentage >= 95 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`   ${dimension} (${Math.round(data.weight * 100)}%): ${percentage}% ${status}`);
  }

  // Focus on Specificity issues
  console.log('\n🔍 SPECIFICITY ISSUES (Current: ' +
    Math.round(qualityResult.dimensions.specificity.score * 100) + '%)');

  const specificityIssues = qualityResult.dimensions.specificity.issues || [];
  const vagueTerms = new Set();

  for (const issue of specificityIssues.slice(0, 10)) {
    if (issue.type === 'VAGUE_QUANTIFIER') {
      vagueTerms.add(issue.term);
    }
  }

  if (vagueTerms.size > 0) {
    console.log('\n   Vague terms found in narrative:');
    for (const term of vagueTerms) {
      console.log(`   - "${term}"`);
    }
  }

  // Show where vague terms appear
  console.log('\n   Sections with vague language:');
  const narrativeText = JSON.stringify(mockNarrative);
  const vaguePhrases = [
    'multiple complications',
    'several procedures',
    'many medications',
    'various procedures',
    'several other medications',
    'multiple specialists',
    'a few weeks',
    'some neurological',
    'various findings',
    'numerous imaging',
    'some abnormalities',
    'several complications'
  ];

  for (const phrase of vaguePhrases) {
    if (narrativeText.toLowerCase().includes(phrase)) {
      const section = Object.entries(mockNarrative).find(([key, value]) =>
        value.toLowerCase().includes(phrase)
      );
      if (section) {
        console.log(`   - ${section[0]}: contains "${phrase}"`);
      }
    }
  }

  // Focus on Timeliness issues
  console.log('\n⏱️ TIMELINESS ISSUES (Current: ' +
    Math.round(qualityResult.dimensions.timeliness.score * 100) + '%)');

  console.log('\n   Performance Breakdown:');
  console.log(`   - Total Time: ${mockMetrics.processingTime}ms (Target: 3000ms)`);
  console.log(`   - Extraction: ${mockMetrics.extractionTime}ms (${Math.round(mockMetrics.extractionTime/mockMetrics.processingTime*100)}%)`);
  console.log(`   - Narrative: ${mockMetrics.narrativeTime}ms (${Math.round(mockMetrics.narrativeTime/mockMetrics.processingTime*100)}%)`);

  const timelinessIssues = qualityResult.dimensions.timeliness.issues || [];
  console.log('\n   Performance Issues:');
  for (const issue of timelinessIssues.slice(0, 5)) {
    console.log(`   [${issue.severity}] ${issue.type}: ${issue.suggestion}`);
  }

  return qualityResult;
}

// Run analysis
analyzeQualityIssues()
  .then(result => {
    console.log('\n=====================================');
    console.log('RECOMMENDED FIXES');
    console.log('=====================================\n');

    console.log('1. SPECIFICITY FIXES:');
    console.log('   - Replace "multiple" → specific number (e.g., "3 complications")');
    console.log('   - Replace "several" → specific count (e.g., "4 procedures")');
    console.log('   - Replace "many" → exact count');
    console.log('   - Replace "various" → list specific items');
    console.log('   - Replace "some" → specific description');
    console.log('   - Replace "few" → exact timeframe (e.g., "2 weeks")');
    console.log('   - Replace generic lab values → specific values with units');

    console.log('\n2. TIMELINESS FIXES:');
    console.log('   - Cache LLM extraction results');
    console.log('   - Optimize pattern matching algorithms');
    console.log('   - Use parallel processing where possible');
    console.log('   - Reduce redundant extraction passes');
    console.log('   - Implement performance monitoring');
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });