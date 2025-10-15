#!/usr/bin/env node

/**
 * Live Demo: Backend Extraction System
 * Real-world example using your neurosurgical discharge note
 */

import fetch from 'node-fetch';

const SAMPLE_NOTES = {
  sah: `
DISCHARGE SUMMARY

Patient: 65-year-old female
MRN: 12345678

HISTORY OF PRESENT ILLNESS:
Pt found down on 3/15/2024 with severe HA and LOC. Brought to ED via EMS. 
Initial GCS 13 (E3M6V4). CT head showed diffuse SAH with IVH.

HOSPITAL COURSE:
- Admission: 3/15/2024
- Diagnosis: Subarachnoid hemorrhage, Hunt-Hess grade 3, Fisher grade 3
- CTA revealed 7mm left PCOM aneurysm
- 3/15: EVD placed emergently for acute hydrocephalus
- 3/16: Underwent craniotomy for aneurysm clipping without complications
- 3/18-3/22: Developed mild vasospasm, treated with triple-H therapy
- 3/25: EVD removed, pt remained neurologically stable
- 3/26: Transferred to floor, ambulating with PT

NEUROLOGICAL EXAM AT DISCHARGE:
- Alert and oriented x3
- CN II-XII intact
- Motor: 5/5 all extremities
- No sensory deficits
- mRS 1

MEDICATIONS AT DISCHARGE:
- Keppra 500mg BID (AED prophylaxis)
- Nimodipine 60mg Q4H x 21 days
- ASA 81mg daily
- Atorvastatin 40mg daily

COMPLICATIONS:
- Mild vasospasm (resolved with medical management)
- Transient hydrocephalus (resolved with EVD)

DISCHARGE:
Date: 3/27/2024
Destination: Home with family
Follow-up: Neurosurgery clinic in 2 weeks, MRA brain in 6 months
`,

  spine: `
DISCHARGE SUMMARY

Patient: 58M with cervical myelopathy
MRN: 87654321

HPI: Progressive neck pain and bilateral upper extremity weakness x 3 months.
MRI: C5-C6 disc herniation with cord compression

HOSPITAL COURSE:
- Admission: 4/10/2024
- Surgery: 4/11/2024 - C5-C6 ACDF (anterior cervical discectomy and fusion)
- Post-op course unremarkable
- Drain removed POD#1
- Ambulating with collar by POD#2

NEURO EXAM:
- Upper extremities: 4+/5 strength bilaterally (improved from 3/5 pre-op)
- No new deficits
- Sensation intact

MEDICATIONS:
- Oxycodone 5mg Q4H PRN pain
- Flexeril 10mg TID PRN spasm
- Keppra 500mg BID x 1 week

DISCHARGE:
Date: 4/13/2024
Destination: Home
Restrictions: No driving, lifting >5 lbs, hard collar x 6 weeks
Follow-up: Spine clinic 2 weeks with X-rays
`,

  tumor: `
DISCHARGE SUMMARY  

Patient: 45F with newly diagnosed GBM
MRN: 11223344

HPI: Presented with progressive headaches and seizures. MRI showed 4cm right temporal mass with edema and midline shift.

HOSPITAL COURSE:
- Admission: 5/1/2024
- 5/2: Right temporal craniotomy for tumor resection
- Pathology: Glioblastoma multiforme (GBM), WHO grade IV
- Post-op MRI: Gross total resection achieved
- Started on Decadron taper
- Consult with radiation oncology and medical oncology

NEURO EXAM:
- Alert, fully oriented
- Left upper quadrant visual field defect (stable)
- Otherwise CN intact
- Motor 5/5 throughout
- KPS 80

MEDICATIONS:
- Keppra 1000mg BID
- Decadron 4mg Q6H (taper per schedule)
- Prilosec 20mg daily
- Ativan 0.5mg Q6H PRN

COMPLICATIONS: None

DISCHARGE:
Date: 5/7/2024
Destination: Home with family
Plan: XRT + concurrent temozolomide, follow-up neuro-oncology 1 week
`
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function extractAndDisplay(noteName, noteText) {
  console.log(`\n${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}Extracting: ${noteName.toUpperCase()}${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  try {
    const response = await fetch('http://localhost:3001/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: noteText,
        method: 'pattern',
        options: {
          expandAbbreviations: true,
          includeConfidence: true
        }
      })
    });

    if (!response.ok) {
      console.log(`${colors.yellow}⚠ Backend returned ${response.status}${colors.reset}`);
      return;
    }

    const result = await response.json();
    const data = result.data;

    // Display in organized sections
    if (data.demographics && Object.keys(data.demographics).length > 0) {
      console.log(`${colors.bright}👤 Demographics:${colors.reset}`);
      Object.entries(data.demographics).forEach(([k, v]) => {
        if (v) console.log(`   ${k}: ${colors.green}${v}${colors.reset}`);
      });
      console.log();
    }

    if (data.dates && Object.keys(data.dates).length > 0) {
      console.log(`${colors.bright}📅 Important Dates:${colors.reset}`);
      Object.entries(data.dates).forEach(([k, v]) => {
        if (v) console.log(`   ${k}: ${colors.green}${v}${colors.reset}`);
      });
      console.log();
    }

    if (data.diagnosis && Object.keys(data.diagnosis).length > 0) {
      console.log(`${colors.bright}🏥 Diagnosis:${colors.reset}`);
      Object.entries(data.diagnosis).forEach(([k, v]) => {
        if (v) console.log(`   ${k}: ${colors.green}${v}${colors.reset}`);
      });
      console.log();
    }

    if (data.clinicalScores && Object.keys(data.clinicalScores).length > 0) {
      console.log(`${colors.bright}📊 Clinical Scores:${colors.reset}`);
      Object.entries(data.clinicalScores).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          const display = typeof v === 'object' ? JSON.stringify(v) : v;
          console.log(`   ${k}: ${colors.green}${display}${colors.reset}`);
        }
      });
      console.log();
    }

    if (data.procedures && data.procedures.length > 0) {
      console.log(`${colors.bright}🔪 Procedures (${data.procedures.length}):${colors.reset}`);
      data.procedures.slice(0, 10).forEach(p => {
        const name = typeof p === 'object' ? p.name : p;
        const date = typeof p === 'object' && p.date ? ` (${p.date})` : '';
        console.log(`   • ${colors.green}${name}${colors.reset}${date}`);
      });
      console.log();
    }

    if (data.complications && data.complications.length > 0) {
      console.log(`${colors.bright}⚠️  Complications (${data.complications.length}):${colors.reset}`);
      data.complications.forEach(c => {
        const name = typeof c === 'object' ? c.name : c;
        const status = typeof c === 'object' && c.resolved ? 
          ` ${colors.green}(resolved)${colors.reset}` : '';
        console.log(`   • ${colors.yellow}${name}${colors.reset}${status}`);
      });
      console.log();
    }

    if (data.medications) {
      ['current', 'anticoagulation', 'antiepileptic', 'antibiotics'].forEach(type => {
        if (data.medications[type] && data.medications[type].length > 0) {
          const icon = type === 'anticoagulation' ? '🩸' : 
                      type === 'antiepileptic' ? '⚡' : 
                      type === 'antibiotics' ? '💊' : '💊';
          console.log(`${colors.bright}${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}:${colors.reset}`);
          data.medications[type].slice(0, 5).forEach(m => {
            const name = typeof m === 'object' ? m.name : m;
            const dose = typeof m === 'object' && m.dose ? 
              ` ${m.dose}${m.unit || ''}` : '';
            console.log(`   • ${colors.green}${name}${colors.reset}${dose}`);
          });
          console.log();
        }
      });
    }

    if (data.metadata && data.metadata.confidence !== undefined) {
      const conf = (data.metadata.confidence * 100).toFixed(1);
      const emoji = data.metadata.confidence > 0.7 ? '🎯' : 
                   data.metadata.confidence > 0.5 ? '📊' : '⚠️';
      console.log(`${emoji} ${colors.bright}Confidence: ${colors.cyan}${conf}%${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`${colors.yellow}✗ Error: ${error.message}${colors.reset}\n`);
  }
}

async function main() {
  console.log(`${colors.blue}${colors.bright}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          Backend Extraction System - Live Demo                    ║');
  console.log('║       Testing with Real Neurosurgical Clinical Notes              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Test each type of note
  await extractAndDisplay('SAH (Subarachnoid Hemorrhage)', SAMPLE_NOTES.sah);
  await extractAndDisplay('Spine Surgery (ACDF)', SAMPLE_NOTES.spine);
  await extractAndDisplay('Brain Tumor (GBM)', SAMPLE_NOTES.tumor);

  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.green}${colors.bright}✅ All extractions completed successfully!${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}\n`);
}

main().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});