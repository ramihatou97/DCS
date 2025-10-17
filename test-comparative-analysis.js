#!/usr/bin/env node

/**
 * COMPARATIVE ANALYSIS TEST SCRIPT
 * 
 * Generates multiple discharge summaries from the same clinical notes
 * using different configurations for comprehensive comparison
 */

import { orchestrateSummaryGeneration } from './src/services/summaryOrchestrator.js';
import { extractMedicalEntities } from './src/services/extraction.js';
import { generateNarrative } from './src/services/narrativeEngine.js';
import { calculateQualityMetrics } from './src/services/qualityMetrics.js';
import fs from 'fs';

// ============================================================================
// SOURCE CLINICAL NOTES - Cervical Spine Trauma with SCI
// ============================================================================

const CLINICAL_NOTES = `ADMISSION NOTE 

PRODUCE HIGH QUALITY, COMPREHENSIVE, CLEAR DISCHARGE SUMMARY: NEUROSURGICAL SPINE TRAUMA DOCUMENTATION
Patient: Robert Chen, 67M
MRN: 45678912
Attending: Dr. Patterson

=====================================
TRAUMA ADMISSION NOTE
Date: 09/20/2025 16:45
Level 2 Trauma Activation
=====================================

MECHANISM: Ground level fall from ladder (approx 8 feet), landed on head/neck

SCENE: Patient able to move arms, unable to move legs, c/o neck pain, c-collar applied

ARRIVAL ED: 16:30
GCS 15, A&Ox3, anxious
C-collar in place

Primary Survey:
A: Patent, phonating
B: Breathing spontaneously, adequate air movement bilat, SpO2 96% RA
C: BP 88/54, HR 58 (concerning for neurogenic shock)
D: Neuro exam below
E: No obvious external injuries except abrasion on forehead

NEUROLOGICAL EXAM:
MS: Alert and oriented x3, very anxious, asking if he will walk again
CN: II-XII intact
Motor:
- UE: [5/5] deltoids, biceps bilat
       [4/5] triceps bilat
       [3/5] wrist extensors bilat  
       [2/5] finger flexors/extensors
       [0/5] intrinsics bilaterally
- LE: [0/5] hip flexors
      [0/5] throughout bilateral LE, no movement
Sensory: intact C3-C5, diminished C6-C7, absent below T1
Rectal: no tone, no sensation, no volitional contraction
Bulbocavernosus reflex: absent
Priapism: present (suggests spinal shock)

ASIA Exam: Incomplete spinal cord injury, ASIA C (some motor below level, >50% muscles <3/5)

IMAGING:
CT C-spine: C5-C6 bilateral facet dislocation with anterolithesis, canal compromise >75%, prevertebral swelling
CT head: negative
CT chest/abd/pelvis: negative for acute traumatic injury
XR: no other fractures
MRI C-spine (17:30): 
- C5-6 bilateral jumped facets with severe canal stenosis
- Spinal cord edema C4-C7 levels with hyperintense T2 signal
- No epidural hematoma
- Posterior ligamentous complex disruption

LABS:
CBC: WBC 10.5, Hgb 14.2, Plt 198
BMP: WNL
Coags: PT 11.8, INR 1.0

PMH: HTN, DM2, BPH, CAD s/p stent 2020
PSH: None
Meds: metoprolol, metformin, lisinopril, ASA 81mg, finasteride
All: PCN - rash

ASSESSMENT: 67M with C5-6 bilateral facet dislocation with incomplete SCI (ASIA C), neurogenic shock

PLAN:
- MAP goal >85-90 for spinal cord perfusion
- Started on pressors (phenylephrine) for BP support
- IVF bolus given
- Methylprednisolone discussed with family - literature controversial, risks/benefits explained, family declines
- Emergent closed reduction attempted in ED UNSUCCESSFUL
- Plan: Emergent OR for open reduction and posterior cervical fusion C4-C7
- Keep NPO
- Foley placement
- Type and cross 4 units
- DVT prophylaxis: SCDs (no pharmacologic given surgery)
- Consents obtained

Family meeting: Wife and daughter present. Explained injury, spinal cord damage, surgery needed urgently, prognosis guarded for recovery. Permanent paralysis possible. Family understands. Very emotional but agrees with plan.

=====================================
OPERATIVE NOTE  
Date: 09/20/2025 23:15
=====================================

PREOP DX: C5-6 bilateral facet dislocation with incomplete SCI
POSTOP DX: same

PROCEDURE: 
1. Open reduction C5-6
2. Posterior cervical fusion C4-C7 with lateral mass screws and rods
3. Application of intraoperative neuromonitoring (IONM)

SURGEON: Dr. Patterson
ANESTHESIA: General with TIVA protocol for neuromonitoring

NEUROMONITORING: SSEPs and MEPs monitored throughout. Baseline: upper extremity signals present but diminished, lower extremity signals absent (consistent with preop exam).

PROCEDURE DETAILS:
Patient positioned prone on Jackson table with Mayfield pins. Neuromonitoring confirmed baseline signals. Midline posterior approach C3-T1. Dissection to lateral masses. 

FINDINGS: Severe disruption of posterior elements. Facets completely dislocated bilaterally at C5-6. Significant ligamentous injury.

Open reduction performed with manipulation and reduction tools. Required significant force. Reduction achieved. IONM: no change from baseline during reduction (expected given injury).

Lateral mass screws placed C4, C5, C6, C7 bilaterally using Magerl technique. Rods contoured and placed. Compression applied. Decortication performed. Morselized autograft and allograft applied.

Wound copiously irrigated. Closure in layers. Drain placed.

EBL: 400cc
IVF: 2.5L LR
Complications: None
Drains: JP drain

Patient to ICU intubated for airway monitoring given anterior swelling anticipated.

=====================================
PROGRESS NOTE - POD 8
Date: 09/28/2025
=====================================

Events: Spiked fever to 101.6 overnight. UA sent - positive. Started on ceftriaxone.

Exam: otherwise unchanged

UA: >100 WBC, + bacteria, +nitrites
UCx: pending

A/P: POD8, now with UTI
- Common in SCI patients with catheters
- Started abx
- Continue IC q6h, adequate fluid intake
- Otherwise progressing

=====================================
PROGRESS NOTE - POD 10
Date: 09/30/2025
=====================================

Events: Developed acute SOB at 4am, O2 sat 88% RA, tachypneic to 28. CTA chest showed bilateral PE.

Exam:
Tachypneic, labored breathing
O2 requirement: 4L NC to keep sat >92%
Tachycardic to 105
Motor/sensory: unchanged

CTA: Bilateral segmental and subsegmental PE
D-dimer: >5000
Troponin: 0.08 (mildly elevated)

A/P: POD10, now with PE despite prophylactic lovenox
- Discussed with hematology - recommend IVC filter given high bleeding risk with therapeutic anticoagulation so early post-op
- IR placing filter today
- Will do prophylactic, not therapeutic AC given recent surgery
- Close monitoring

=====================================
OPERATIVE NOTE - POD 14
Date: 10/04/2025 22:30
=====================================

PREOP DX: Postop wound infection C-spine
POSTOP DX: Deep wound infection, retained hardware

PROCEDURE: Irrigation and debridement C-spine wound, culture

FINDINGS: 
Purulent fluid collection deep to fascia. Approximately 15cc frank pus. No epidural abscess. Hardware appears stable and well-fixed.

PROCEDURE:
Wound opened. Copious purulent material. Cultures sent (aerobic, anaerobic, fungal). Extensive irrigation with 6L pulse lavage. All necrotic tissue debrided. Hardware appears well-incorporated, no loosening - left in place. Wound packed open with gauze soaked in Dakin's. Plan for delayed closure.

Gram stain: GPCs in clusters

Culture results: MRSA - sensitive to vancomycin

PLAN: IV antibiotics, return to OR in 48h for re-look and possible closure

=====================================
PROGRESS NOTE - POD 20
Date: 10/10/2025
=====================================

Infection: Improving, afebrile x 96h, wound healing, drain removed POD4

Neuro: FINALLY seeing some change!
- **L leg: Trace flicker of movement in quad! [1/5]**
- R leg: Still [0/5]
- UE: Slightly improved - C8/T1 now [3/5]!

This is encouraging!! Spinal shock has resolved (reflexes 2+ in knees now, hyperreflexic). 

PT/OT: Doing much better with therapy
- Transfers now min-mod assist
- Improved sitting balance
- Better UE function helping with ADLs

Mood: Much improved with therapy gains, more hopeful

Bowel/bladder: Program going well

A/P: POD20, improving!
- Wound infection treated, continue vancomycin (4 more weeks outpatient)
- NEUROLOGIC RECOVERY OCCURRING - incomplete injury showing late improvements
- Ready for transfer to rehab in few days
- May have potential for limited ambulation with bracing if continues to improve

=====================================
DISCHARGE PLANNING NOTE
Date: 10/12/2025
=====================================

Patient ready for transfer to acute inpatient SCI rehab

ACCEPTING FACILITY: Regional SCI Center
TRANSFER DATE: 10/13/2025

DISCHARGE MEDICATIONS:
1. Vancomycin IV via PICC (4 more weeks)
2. Lovenox 40mg SQ daily (prophylactic)
3. Sertraline 50mg daily
4. Docusate + Senna (bowel program)
5. Metoprolol, metformin, lisinopril (home meds)
6. Acetaminophen PRN
7. Oxycodone PRN

FOLLOW-UP:
- Continue IV vancomycin x 4 weeks
- Neurosurgery follow-up post-rehab
- Hematology follow-up for PE/anticoagulation
- Consider IVC filter removal at 3-6 months
- Psychiatry follow-up
`;

// ============================================================================
// TEST CONFIGURATIONS
// ============================================================================

const configurations = [
  {
    name: 'Config 1: Claude Sonnet 3.5 (Full Orchestration)',
    options: {
      useOrchestrator: true,
      provider: 'anthropic',
      useLLM: true,
      temperature: 0.1
    }
  },
  {
    name: 'Config 2: GPT-4o (Full Orchestration)',
    options: {
      useOrchestrator: true,
      provider: 'openai',
      useLLM: true,
      temperature: 0.1
    }
  },
  {
    name: 'Config 3: Gemini 1.5 Pro (Full Orchestration)',
    options: {
      useOrchestrator: true,
      provider: 'gemini',
      useLLM: true,
      temperature: 0.1
    }
  },
  {
    name: 'Config 4: Template-Based (No LLM)',
    options: {
      useOrchestrator: false,
      useLLM: false
    }
  },
  {
    name: 'Config 5: Hybrid (LLM Extraction + Template Narrative)',
    options: {
      useOrchestrator: false,
      useLLM: true, // For extraction only
      provider: 'anthropic',
      narrativeMethod: 'template'
    }
  }
];

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║     DISCHARGE SUMMARY COMPARATIVE ANALYSIS TEST SCRIPT        ║');
console.log('║     Cervical Spine Trauma with SCI - Multiple Configs        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Source Material: Comprehensive C5-6 SCI case with complications');
console.log('📊 Configurations: 5 different generation methods');
console.log('🎯 Goal: Identify strengths, weaknesses, and code improvements\n');

console.log('─'.repeat(70));
console.log('\n⏳ Starting summary generation...\n');

const results = [];

for (let i = 0; i < configurations.length; i++) {
  const config = configurations[i];
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔄 GENERATING SUMMARY ${i + 1}/${configurations.length}`);
  console.log(`📝 ${config.name}`);
  console.log(`${'='.repeat(70)}\n`);
  
  try {
    const startTime = Date.now();
    
    let summary;
    
    if (config.options.useOrchestrator) {
      // Use full orchestration
      summary = await orchestrateSummaryGeneration(CLINICAL_NOTES, config.options);
    } else if (config.options.useLLM && config.options.narrativeMethod === 'template') {
      // Hybrid: LLM extraction + template narrative
      const extraction = await extractMedicalEntities(CLINICAL_NOTES, { provider: config.options.provider });
      const narrative = await generateNarrative(extraction.extracted, '', { useLLM: false });
      const quality = calculateQualityMetrics(extraction.extracted, {}, Object.values(narrative).join(' '));
      
      summary = {
        extractedData: extraction.extracted,
        narrative,
        qualityMetrics: quality,
        metadata: { method: 'hybrid' }
      };
    } else {
      // Template-only
      const extraction = await extractMedicalEntities(CLINICAL_NOTES, { useLLM: false });
      const narrative = await generateNarrative(extraction.extracted, '', { useLLM: false });
      const quality = calculateQualityMetrics(extraction.extracted, {}, Object.values(narrative).join(' '));
      
      summary = {
        extractedData: extraction.extracted,
        narrative,
        qualityMetrics: quality,
        metadata: { method: 'template' }
      };
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Summary generated successfully in ${duration}s`);
    console.log(`📊 Quality Score: ${(summary.qualityMetrics?.overall * 100 || 0).toFixed(1)}%`);
    
    results.push({
      config: config.name,
      summary,
      duration,
      success: true
    });
    
  } catch (error) {
    console.error(`\n❌ Error generating summary: ${error.message}`);
    results.push({
      config: config.name,
      error: error.message,
      success: false
    });
  }
}

// ============================================================================
// SAVE RESULTS
// ============================================================================

console.log(`\n\n${'='.repeat(70)}`);
console.log('💾 SAVING RESULTS');
console.log(`${'='.repeat(70)}\n`);

const outputDir = './comparative-analysis-results';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save each summary
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  const filename = `${outputDir}/summary-${i + 1}-${result.config.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`✅ Saved: ${filename}`);
}

// Save summary of results
const summaryFile = `${outputDir}/results-summary.json`;
fs.writeFileSync(summaryFile, JSON.stringify({
  testDate: new Date().toISOString(),
  totalConfigurations: configurations.length,
  successfulGenerations: results.filter(r => r.success).length,
  failedGenerations: results.filter(r => !r.success).length,
  results: results.map(r => ({
    config: r.config,
    success: r.success,
    duration: r.duration,
    qualityScore: r.summary?.qualityMetrics?.overall,
    error: r.error
  }))
}, null, 2));

console.log(`✅ Saved: ${summaryFile}`);

console.log(`\n\n${'='.repeat(70)}`);
console.log('✅ TEST COMPLETE');
console.log(`${'='.repeat(70)}\n`);

console.log(`📁 Results saved to: ${outputDir}/`);
console.log(`📊 Successful: ${results.filter(r => r.success).length}/${results.length}`);
console.log(`\n🔍 Next step: Run comparative analysis on generated summaries\n`);

