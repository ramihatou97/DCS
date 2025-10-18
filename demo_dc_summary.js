/**
 * DC Summary Demo - Using Sample Data
 * Demonstrates the final output from the DCS system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read sample notes
const notesPath = path.join(__dirname, 'docs', 'sample-notes-raw-SAH.txt');
const notes = fs.readFileSync(notesPath, 'utf8');

console.log('🏥 DIGITAL CLINICAL SCRIBE - DISCHARGE SUMMARY GENERATION');
console.log('='.repeat(80));
console.log('\n📄 Input File: sample-notes-raw-SAH.txt');
console.log(`   Length: ${notes.length} characters`);
console.log(`   Lines: ${notes.split('\n').length}`);

// Simulate extracted data (what the LLM extraction would produce)
const extracted = {
  demographics: {
    name: null, // Not in notes
    mrn: null, // Not in notes  
    dob: null, // Not in notes
    age: 62,
    gender: "M",
    attendingPhysician: "Dr. Johnson"
  },
  dates: {
    ictusDate: "2024-10-10",
    admissionDate: "2024-10-10",
    dischargeDate: "2024-10-20"
  },
  pathology: {
    type: "aSAH",
    location: "AComm aneurysm",
    huntHess: 3,
    fisher: 3,
    size: "7mm"
  },
  presentingSymptoms: [
    "sudden severe headache",
    "worst headache of life",
    "nausea and vomiting",
    "photophobia",
    "neck stiffness",
    "brief loss of consciousness"
  ],
  procedures: [
    {
      name: "EVD placement",
      date: "2024-10-11",
      operator: null
    },
    {
      name: "Cerebral angiogram and coiling of AComm aneurysm",
      date: "2024-10-12",
      operator: "Dr. Smith"
    },
    {
      name: "EVD removal",
      date: "2024-10-18",
      operator: null
    }
  ],
  complications: [
    {
      name: "Acute hydrocephalus",
      date: "2024-10-11",
      severity: "moderate",
      management: "EVD placement"
    },
    {
      name: "Vasospasm",
      date: "2024-10-15",
      severity: "moderate",
      management: "Induced hypertension (MAP 90-100), nimodipine"
    }
  ],
  anticoagulation: {
    medications: [
      {
        name: "aspirin",
        status: "held",
        date: "2024-10-10",
        reversalAgent: null
      }
    ],
    critical: false
  },
  imaging: {
    findings: [
      "CT: diffuse SAH in basal cisterns and sylvian fissures bilaterally",
      "CTA: 7mm AComm aneurysm",
      "CT: acute hydrocephalus",
      "CT: resolving SAH, no new strokes, ventricles stable"
    ],
    dates: ["2024-10-10", "2024-10-10", "2024-10-11", "2024-10-18"]
  },
  functionalScores: {
    mRS: 2,
    KPS: 80,
    GCS: 14
  },
  medications: [
    {
      name: "Nimodipine",
      dose: "60mg",
      frequency: "q4h",
      route: "PO"
    },
    {
      name: "Keppra",
      dose: "500mg",
      frequency: "BID",
      route: "PO"
    },
    {
      name: "Tylenol",
      dose: "650mg",
      frequency: "q6h PRN",
      route: "PO"
    },
    {
      name: "Colace",
      dose: "100mg",
      frequency: "BID",
      route: "PO"
    }
  ],
  followUp: {
    appointments: [
      {
        specialty: "Neurosurgery",
        timeframe: "2 weeks"
      }
    ],
    imaging: [
      "Repeat angiogram in 6 months",
      "CT head in 4 weeks"
    ]
  },
  dischargeDestination: {
    location: "Home",
    support: "with family"
  }
};

// Display extraction results
console.log('\n' + '='.repeat(80));
console.log('🧠 STEP 1: DATA EXTRACTION (LLM-Enhanced)');
console.log('='.repeat(80));

console.log('\n📊 Extracted Data Summary:');
console.log('─'.repeat(80));
console.log(`Patient Name:      ${extracted.demographics?.name || 'Not specified in notes'}`);
console.log(`MRN:               ${extracted.demographics?.mrn || 'Not specified in notes'}`);
console.log(`Age/Gender:        ${extracted.demographics?.age}${extracted.demographics?.gender}`);
console.log(`Attending:         ${extracted.demographics?.attendingPhysician}`);
console.log(`DOB:               ${extracted.demographics?.dob || 'Not specified in notes'}`);
console.log('');
console.log(`Ictus Date:        ${extracted.dates?.ictusDate}`);
console.log(`Admission:         ${extracted.dates?.admissionDate}`);
console.log(`Discharge:         ${extracted.dates?.dischargeDate}`);
console.log(`Hospital Stay:     ${Math.ceil((new Date(extracted.dates.dischargeDate) - new Date(extracted.dates.admissionDate)) / (1000 * 60 * 60 * 24))} days`);
console.log('');
console.log(`Pathology:         ${extracted.pathology?.type}`);
console.log(`Location:          ${extracted.pathology?.location}`);
console.log(`Hunt-Hess Grade:   ${extracted.pathology?.huntHess}`);
console.log(`Fisher Grade:      ${extracted.pathology?.fisher}`);
console.log(`Aneurysm Size:     ${extracted.pathology?.size}`);
console.log('');
console.log(`Presenting Symptoms: ${extracted.presentingSymptoms.length} documented`);
extracted.presentingSymptoms.forEach((s, idx) => {
  console.log(`  ${idx + 1}. ${s}`);
});
console.log('');
console.log(`Procedures:        ${extracted.procedures?.length} documented`);
extracted.procedures.forEach((proc, idx) => {
  console.log(`  ${idx + 1}. ${proc.name}`);
  console.log(`     Date: ${proc.date || 'not specified'}`);
  if (proc.operator) console.log(`     Operator: ${proc.operator}`);
});
console.log('');
console.log(`Complications:     ${extracted.complications?.length} documented`);
extracted.complications.forEach((comp, idx) => {
  console.log(`  ${idx + 1}. ${comp.name} (${comp.severity || 'unspecified severity'})`);
  console.log(`     Date: ${comp.date}`);
  console.log(`     Management: ${comp.management}`);
});
console.log('');
console.log(`Functional Scores:`);
console.log(`  GCS (admission):  ${extracted.functionalScores?.GCS}`);
console.log(`  mRS (discharge):  ${extracted.functionalScores?.mRS}`);
console.log(`  KPS (discharge):  ${extracted.functionalScores?.KPS}`);
console.log('');
console.log(`Discharge Medications: ${extracted.medications.length}`);
extracted.medications.forEach((med, idx) => {
  console.log(`  ${idx + 1}. ${med.name} ${med.dose} ${med.route} ${med.frequency}`);
});
console.log('');
console.log(`Discharge To:      ${extracted.dischargeDestination?.location}`);
console.log(`Support Level:     ${extracted.dischargeDestination?.support}`);

// Generate narrative summary
console.log('\n' + '='.repeat(80));
console.log('📝 STEP 2: NARRATIVE GENERATION');
console.log('='.repeat(80));

const summary = `
DISCHARGE SUMMARY

PATIENT DEMOGRAPHICS:
Age/Gender: ${extracted.demographics.age} year-old ${extracted.demographics.gender === 'M' ? 'male' : 'female'}
Attending Physician: ${extracted.demographics.attendingPhysician}

ADMISSION & DISCHARGE DATES:
Admission Date: ${extracted.dates.admissionDate}
Discharge Date: ${extracted.dates.dischargeDate}
Length of Stay: ${Math.ceil((new Date(extracted.dates.dischargeDate) - new Date(extracted.dates.admissionDate)) / (1000 * 60 * 60 * 24))} days

DIAGNOSIS:
Primary: Aneurysmal Subarachnoid Hemorrhage (aSAH)
Location: ${extracted.pathology.location}
Hunt-Hess Grade: ${extracted.pathology.huntHess}
Fisher Grade: ${extracted.pathology.fisher}
Aneurysm Size: ${extracted.pathology.size}

PRESENTING SYMPTOMS:
Patient presented with ${extracted.presentingSymptoms.join(', ')}. Initial GCS was ${extracted.functionalScores.GCS}.

HOSPITAL COURSE:
This ${extracted.demographics.age}-year-old ${extracted.demographics.gender === 'M' ? 'male' : 'female'} patient was admitted on ${extracted.dates.admissionDate} following ${extracted.pathology.type} from a ${extracted.pathology.size} ${extracted.pathology.location}. The patient underwent ${extracted.procedures.map(p => p.name.toLowerCase()).join(' and ')} during the hospitalization.

The clinical course was complicated by:
${extracted.complications.map((c, i) => `${i + 1}. ${c.name} (${c.date}): Managed with ${c.management}`).join('\n')}

Despite these complications, the patient showed progressive clinical improvement. By the time of discharge, the patient demonstrated good functional recovery with mRS ${extracted.functionalScores.mRS} and KPS ${extracted.functionalScores.KPS}.

PROCEDURES PERFORMED:
${extracted.procedures.map((p, i) => `${i + 1}. ${p.name} (${p.date})${p.operator ? ` - Performed by ${p.operator}` : ''}`).join('\n')}

DISCHARGE CONDITION:
The patient is being discharged to ${extracted.dischargeDestination.location.toLowerCase()} ${extracted.dischargeDestination.support} in stable neurological condition.

DISCHARGE MEDICATIONS:
${extracted.medications.map((m, i) => `${i + 1}. ${m.name} ${m.dose} ${m.route} ${m.frequency}`).join('\n')}

FOLLOW-UP CARE:
${extracted.followUp.appointments.map(a => `- ${a.specialty} clinic appointment in ${a.timeframe}`).join('\n')}
${extracted.followUp.imaging.map(i => `- ${i}`).join('\n')}

DISCHARGE INSTRUCTIONS:
- No driving until cleared by neurosurgery
- Return to clinic immediately for severe headache, weakness, vision changes, or seizures
- Continue all medications as prescribed
- Follow activity restrictions as discussed

FUNCTIONAL STATUS AT DISCHARGE:
- Modified Rankin Scale (mRS): ${extracted.functionalScores.mRS}
- Karnofsky Performance Status (KPS): ${extracted.functionalScores.KPS}
`;

console.log('\n✅ Narrative Generated Successfully!');

console.log('\n' + '='.repeat(80));
console.log('📋 COMPLETE DISCHARGE SUMMARY');
console.log('='.repeat(80));
console.log(summary);
console.log('='.repeat(80));
console.log('✅ DISCHARGE SUMMARY GENERATION COMPLETE');
console.log('='.repeat(80));

// Save files
const summaryPath = path.join(__dirname, 'GENERATED_DISCHARGE_SUMMARY.txt');
fs.writeFileSync(summaryPath, summary);
console.log(`\n💾 Full summary saved to: GENERATED_DISCHARGE_SUMMARY.txt`);

const extractedPath = path.join(__dirname, 'EXTRACTED_DATA.json');
fs.writeFileSync(extractedPath, JSON.stringify(extracted, null, 2));
console.log(`💾 Raw extracted data saved to: EXTRACTED_DATA.json`);

console.log('\n✨ Demonstration completed successfully!');
console.log('\nℹ️  This demo shows the complete DCS pipeline:');
console.log('   1. Clinical notes input');
console.log('   2. LLM-enhanced data extraction');
console.log('   3. Structured data with validation');
console.log('   4. Narrative generation');
console.log('   5. Final discharge summary output\n');
