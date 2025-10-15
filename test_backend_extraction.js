#!/usr/bin/env node

/**
 * Test script for Backend Neurosurgery Extraction API
 * Demonstrates pattern-based, LLM-based, and hybrid extraction
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

// Sample neurosurgical clinical note
const SAMPLE_NOTE = `
Patient: 65F with PMH of HTN, DM2
MRN: 12345678

HPI: Pt found down on 3/15/2024 with severe HA and LOC. Brought to ED via EMS. 
GCS 13 (E3M6V4) on arrival. 

CT Head showed diffuse SAH, Fisher grade 3, with IVH in bilateral lateral ventricles.
CTA revealed 7mm left PCOM aneurysm.

Admission: 3/15/2024
Diagnosis: Subarachnoid hemorrhage, Hunt-Hess grade 3
Aneurysm: 7mm left posterior communicating artery

Course:
- 3/15: EVD placed emergently for acute hydrocephalus
- 3/16: Underwent craniotomy for aneurysm clipping without complications
- 3/18-3/22: Developed mild vasospasm, treated with triple-H therapy
- 3/25: EVD removed, pt remained neurologically stable
- 3/26: Transferred to floor, ambulating with PT

Neuro Exam at Discharge:
- Alert, oriented x3
- CN II-XII intact
- Motor: 5/5 all extremities
- No sensory deficits
- mRS 1

Medications at discharge:
- Keppra 500mg BID (AED prophylaxis)
- Nimodipine 60mg Q4H x 21 days
- ASA 81mg daily
- Atorvastatin 40mg daily

Complications: Mild vasospasm (resolved), transient hydrocephalus (resolved with EVD)

Discharge: 3/27/2024 to home with family
Follow-up: Neurosurgery clinic in 2 weeks, MRA brain in 6 months
`;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

async function testExtraction(method, llmProvider = null) {
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}Testing ${method.toUpperCase()} Extraction${llmProvider ? ` (${llmProvider})` : ''}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${BACKEND_URL}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes: SAMPLE_NOTE,
        method: method,
        llmProvider: llmProvider,
        options: {
          expandAbbreviations: true,
          deduplicateSentences: true,
          includeConfidence: true
        }
      })
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.text();
      console.log(`${colors.red}✗ Error: ${error}${colors.reset}`);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.log(`${colors.red}✗ Extraction failed${colors.reset}`);
      return;
    }

    const data = result.data;

    // Display results
    console.log(`${colors.green}✓ Extraction completed in ${duration}s${colors.reset}\n`);

    // Demographics
    if (data.demographics && Object.keys(data.demographics).length > 0) {
      console.log(`${colors.bright}Demographics:${colors.reset}`);
      Object.entries(data.demographics).forEach(([key, value]) => {
        if (value) console.log(`  ${key}: ${value}`);
      });
      console.log();
    }

    // Dates
    if (data.dates && Object.keys(data.dates).length > 0) {
      console.log(`${colors.bright}Important Dates:${colors.reset}`);
      Object.entries(data.dates).forEach(([key, value]) => {
        if (value) console.log(`  ${key}: ${value}`);
      });
      console.log();
    }

    // Diagnosis
    if (data.diagnosis && Object.keys(data.diagnosis).length > 0) {
      console.log(`${colors.bright}Diagnosis:${colors.reset}`);
      Object.entries(data.diagnosis).forEach(([key, value]) => {
        if (value) console.log(`  ${key}: ${value}`);
      });
      console.log();
    }

    // Clinical Scores
    if (data.clinicalScores && Object.keys(data.clinicalScores).length > 0) {
      console.log(`${colors.bright}Clinical Scores:${colors.reset}`);
      Object.entries(data.clinicalScores).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            console.log(`  ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }
      });
      console.log();
    }

    // Procedures
    if (data.procedures && data.procedures.length > 0) {
      console.log(`${colors.bright}Procedures (${data.procedures.length}):${colors.reset}`);
      data.procedures.slice(0, 5).forEach(proc => {
        const name = typeof proc === 'object' ? proc.name : proc;
        const date = typeof proc === 'object' ? proc.date : null;
        console.log(`  • ${name}${date ? ` (${date})` : ''}`);
      });
      if (data.procedures.length > 5) {
        console.log(`  ... and ${data.procedures.length - 5} more`);
      }
      console.log();
    }

    // Complications
    if (data.complications && data.complications.length > 0) {
      console.log(`${colors.bright}Complications (${data.complications.length}):${colors.reset}`);
      data.complications.slice(0, 5).forEach(comp => {
        const name = typeof comp === 'object' ? comp.name : comp;
        const resolved = typeof comp === 'object' ? comp.resolved : false;
        console.log(`  • ${name}${resolved ? ' (resolved)' : ''}`);
      });
      console.log();
    }

    // Medications
    if (data.medications) {
      const medTypes = ['current', 'anticoagulation', 'antiepileptic', 'antibiotics'];
      medTypes.forEach(type => {
        if (data.medications[type] && data.medications[type].length > 0) {
          console.log(`${colors.bright}${type.charAt(0).toUpperCase() + type.slice(1)} Medications:${colors.reset}`);
          data.medications[type].slice(0, 3).forEach(med => {
            const name = typeof med === 'object' ? med.name : med;
            const dose = typeof med === 'object' ? `${med.dose}${med.unit}` : '';
            console.log(`  • ${name}${dose ? ` ${dose}` : ''}`);
          });
          console.log();
        }
      });
    }

    // Confidence
    if (data.metadata && data.metadata.confidence !== undefined) {
      const conf = (data.metadata.confidence * 100).toFixed(1);
      const color = data.metadata.confidence > 0.7 ? colors.green : 
                   data.metadata.confidence > 0.5 ? colors.yellow : colors.red;
      console.log(`${colors.bright}Overall Confidence: ${color}${conf}%${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error.message}${colors.reset}`);
  }
}

async function testAbbreviationExpansion() {
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}Testing Abbreviation Expansion${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

  const testText = "Pt with SAH s/p EVD placement. GCS 14, H&H grade 2. CTA showed PCOM aneurysm.";

  try {
    const response = await fetch(`${BACKEND_URL}/api/expand-abbreviations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: testText })
    });

    const result = await response.json();

    console.log(`${colors.bright}Original:${colors.reset}`);
    console.log(`  ${result.original}\n`);
    console.log(`${colors.bright}Expanded:${colors.reset}`);
    console.log(`  ${result.expanded}\n`);

  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error.message}${colors.reset}`);
  }
}

async function runAllTests() {
  console.log(`${colors.blue}${colors.bright}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     Backend Neurosurgery Extraction API - Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Test 1: Pattern-based extraction
  await testExtraction('pattern');

  // Test 2: Abbreviation expansion
  await testAbbreviationExpansion();

  // Test 3: LLM-based extraction (only if API keys available)
  console.log(`\n${colors.yellow}Note: LLM tests require API keys in backend/.env${colors.reset}`);
  console.log(`${colors.yellow}Uncomment the lines below to test LLM extraction${colors.reset}\n`);

  // Uncomment these to test LLM extraction:
  // await testExtraction('llm', 'anthropic');
  // await testExtraction('llm', 'openai');
  // await testExtraction('hybrid', 'anthropic');

  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.green}${colors.bright}All tests completed!${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);
}

// Run tests
runAllTests().catch(err => {
  console.error(`${colors.red}Test suite failed:${colors.reset}`, err);
  process.exit(1);
});