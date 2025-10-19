/**
 * Performance Benchmarks
 * 
 * Measures extraction performance with realistic clinical notes
 * to identify bottlenecks and track optimization improvements.
 * 
 * TASK 4 - Item 5: Performance Optimization
 */

const { extractMedicalEntities } = require('../services/extraction.js');

// Sample clinical notes from BUG_FIX_TESTING_GUIDE.md
const TEST_SCENARIOS = {
  basicSAH: `Patient: John Doe, 55M, MRN: 12345678
Admission Date: October 10, 2025
Chief Complaint: Sudden severe headache

History of Present Illness:
Patient presented to ED with sudden onset severe headache, described as "worst headache of my life." 
CT head showed subarachnoid hemorrhage in basal cisterns. Hunt and Hess grade 3, Fisher grade 3.
CTA revealed 7mm left MCA aneurysm.

Hospital Course:
Patient underwent left pterional craniotomy for aneurysm clipping on October 11, 2025.
Procedure performed by Dr. Smith. Aneurysm successfully clipped with temporary clipping time of 4 minutes.
Patient tolerated procedure well. No intraoperative complications.

Post-operative course complicated by mild vasospasm on POD#5, treated with hypertensive therapy.
No delayed cerebral ischemia. Started on nimodipine for vasospasm prophylaxis.
Neurologically stable throughout admission. GCS 15 at discharge.

Procedures:
1. Left pterional craniotomy for MCA aneurysm clipping (10/11/2025)
2. External ventricular drain placement (10/11/2025)
3. EVD removal (10/15/2025)

Medications on Discharge:
- Nimodipine 60mg PO q4h x 21 days
- Levetiracetam 500mg PO BID
- Acetaminophen 650mg PO q6h PRN pain

Discharge Date: October 18, 2025
Discharge Destination: Home with family
Follow-up: Neurosurgery clinic in 2 weeks`,

  multiplePathology: `Patient: Jane Smith, 62F, MRN: 87654321
Admission Date: October 8, 2025

History:
Patient with known right frontal glioblastoma presented with new onset seizure.
MRI showed progression of tumor with surrounding edema and mass effect.
Patient also developed obstructive hydrocephalus requiring urgent intervention.

Procedures:
1. External ventricular drain placement (10/8/2025) - emergent for hydrocephalus
2. Right frontal craniotomy for tumor resection (10/9/2025)
3. Stereotactic biopsy (10/9/2025)

Pathology:
Glioblastoma multiforme, WHO Grade IV
IDH-wildtype
MGMT promoter unmethylated

Course:
Patient recovered well from surgery. Seizures controlled on Keppra 1000mg BID.
EVD removed on POD#4 (10/12/2025) after resolution of hydrocephalus.
No further seizure activity. Neurologically stable.

Complications:
- Obstructive hydrocephalus (resolved with EVD)
- Seizure (controlled with medication)

Discharge Date: October 14, 2025
Discharge Destination: Acute rehab facility
Follow-up: Oncology and Neurosurgery in 1 week`,

  complexSpine: `Patient: Mary Williams, 58F, MRN: 11223344
Admission Date: October 5, 2025

History:
Progressive myelopathy over 6 months. MRI showed severe L4-L5 stenosis with cord compression.
Preoperative neurological exam: 4/5 lower extremity strength bilaterally, hyperreflexia, positive Babinski.

Procedure:
L4-L5 laminectomy and posterior spinal fusion performed October 6, 2025.
Instrumentation: Pedicle screws L4-L5, rods, interbody cage.
Estimated blood loss: 400mL. No intraoperative complications.

Neurological Status:
Preop: 4/5 LE strength, hyperreflexia
Postop Day 1: Improved to 4+/5 LE strength
Postop Day 3: 5/5 LE strength, ambulating with PT

Course:
Patient ambulating with physical therapy by POD#2.
Pain well controlled with oral medications.
Wound healing well, no signs of infection.
Drain removed POD#2.

Medications:
- Oxycodone 5mg PO q4h PRN pain
- Acetaminophen 1000mg PO q6h
- Gabapentin 300mg PO TID

Discharge Date: October 10, 2025
Discharge Destination: Home with home health
Follow-up: Spine surgery clinic in 2 weeks for wound check and X-rays`,

  minimalData: `Patient: Bob Johnson, 45M
Admission Date: October 12, 2025
Chief Complaint: Headache

History: Patient presented with chronic headaches. Neurological examination normal.
MRI brain unremarkable. No acute findings.

Assessment: Tension headaches
Plan: Outpatient neurology follow-up

Discharge: October 12, 2025 to home`,

  longNote: `Patient: Sarah Davis, 67F, MRN: 99887766
Admission Date: September 28, 2025

Chief Complaint: Altered mental status and severe headache

History of Present Illness:
Patient is a 67-year-old female with history of hypertension and atrial fibrillation on warfarin who presented to the emergency department with sudden onset severe headache and altered mental status. Family reports patient was in her usual state of health until approximately 6 hours prior to presentation when she developed sudden severe headache described as "thunderclap" in nature. Shortly after headache onset, patient became confused and lethargic.

In the ED, patient was found to have GCS 13 (E3V4M6). CT head showed large right frontal intraparenchymal hemorrhage with intraventricular extension and early hydrocephalus. INR was 3.2. Patient was given vitamin K, FFP, and prothrombin complex concentrate for reversal.

Past Medical History:
- Hypertension (20 years)
- Atrial fibrillation (on warfarin)
- Hyperlipidemia
- Type 2 diabetes mellitus
- Prior stroke (2020, no residual deficits)

Hospital Course:
Patient was admitted to neurosurgical ICU. Due to declining mental status and worsening hydrocephalus, patient underwent emergent right frontal craniotomy for hematoma evacuation and external ventricular drain placement on September 28, 2025.

Intraoperatively, large hematoma was evacuated. Estimated blood loss 800mL. Patient tolerated procedure well and was transferred to ICU intubated and sedated.

Post-operative Day 1: Patient remained intubated. ICP monitoring showed pressures 10-15mmHg. CT head showed good hematoma evacuation with residual edema. EVD draining well.

Post-operative Day 2: Patient extubated successfully. Following commands. GCS improved to 14 (E4V4M6). ICP remained stable.

Post-operative Day 3-5: Continued improvement. Patient more alert and oriented. Physical therapy and occupational therapy consulted. Patient able to ambulate with assistance.

Post-operative Day 6: EVD clamped for trial. Patient tolerated well without increase in ICP.

Post-operative Day 7: EVD removed. Repeat CT head showed stable ventricle size, no reaccumulation of hemorrhage.

Post-operative Day 8-12: Continued rehabilitation. Speech therapy for mild dysarthria. Patient making good progress with PT/OT.

Complications:
- Intraventricular hemorrhage with hydrocephalus (resolved with EVD)
- Mild dysarthria (improving with speech therapy)
- Urinary tract infection POD#8 (treated with ceftriaxone)

Procedures:
1. Right frontal craniotomy for hematoma evacuation (9/28/2025)
2. External ventricular drain placement (9/28/2025)
3. EVD removal (10/5/2025)

Medications on Discharge:
- Levetiracetam 1000mg PO BID (seizure prophylaxis)
- Metoprolol 50mg PO BID (blood pressure control)
- Atorvastatin 40mg PO daily
- Metformin 1000mg PO BID
- Acetaminophen 650mg PO q6h PRN pain
- Docusate 100mg PO BID (stool softener)

Discharge Date: October 10, 2025
Discharge Destination: Acute rehabilitation facility
Discharge Condition: Stable, ambulatory with assistance, mild dysarthria
Follow-up: Neurosurgery clinic in 2 weeks, Primary care in 1 week`
};

/**
 * Performance measurement utility
 */
class PerformanceMonitor {
  constructor() {
    this.measurements = {};
  }

  start(label) {
    this.measurements[label] = {
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage().heapUsed
    };
  }

  end(label) {
    if (!this.measurements[label]) {
      throw new Error(`No measurement started for label: ${label}`);
    }

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;
    const measurement = this.measurements[label];

    const durationNs = endTime - measurement.startTime;
    const durationMs = Number(durationNs) / 1_000_000;
    const memoryDelta = endMemory - measurement.startMemory;

    return {
      duration: durationMs,
      memory: memoryDelta
    };
  }

  reset() {
    this.measurements = {};
  }
}

/**
 * Run benchmark multiple times and return average
 */
async function runBenchmark(name, fn, iterations = 3) {
  const results = [];
  
  // Warm-up run (excluded from results)
  await fn();
  
  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const monitor = new PerformanceMonitor();
    monitor.start('total');
    
    await fn();
    
    const result = monitor.end('total');
    results.push(result);
  }
  
  // Calculate averages
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / iterations;
  const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / iterations;
  
  return {
    name,
    avgDuration: Math.round(avgDuration * 100) / 100,
    avgMemory: Math.round(avgMemory / 1024), // Convert to KB
    iterations
  };
}

describe('Performance Benchmarks', () => {
  // Increase timeout for performance tests
  jest.setTimeout(60000);

  test('Baseline: Basic SAH Note', async () => {
    const result = await runBenchmark(
      'Basic SAH Note',
      async () => {
        await extractMedicalEntities(TEST_SCENARIOS.basicSAH, { usePatterns: true });
      },
      3
    );

    console.log('\n📊 Baseline Performance - Basic SAH Note:');
    console.log(`   Duration: ${result.avgDuration}ms`);
    console.log(`   Memory: ${result.avgMemory}KB`);
    
    expect(result.avgDuration).toBeLessThan(5000); // Should complete in < 5s
  });

  test('Baseline: Multiple Pathology Note', async () => {
    const result = await runBenchmark(
      'Multiple Pathology Note',
      async () => {
        await extractMedicalEntities(TEST_SCENARIOS.multiplePathology, { usePatterns: true });
      },
      3
    );

    console.log('\n📊 Baseline Performance - Multiple Pathology Note:');
    console.log(`   Duration: ${result.avgDuration}ms`);
    console.log(`   Memory: ${result.avgMemory}KB`);
    
    expect(result.avgDuration).toBeLessThan(5000);
  });

  test('Baseline: Complex Spine Case', async () => {
    const result = await runBenchmark(
      'Complex Spine Case',
      async () => {
        await extractMedicalEntities(TEST_SCENARIOS.complexSpine, { usePatterns: true });
      },
      3
    );

    console.log('\n📊 Baseline Performance - Complex Spine Case:');
    console.log(`   Duration: ${result.avgDuration}ms`);
    console.log(`   Memory: ${result.avgMemory}KB`);
    
    expect(result.avgDuration).toBeLessThan(5000);
  });

  test('Baseline: Minimal Data Note', async () => {
    const result = await runBenchmark(
      'Minimal Data Note',
      async () => {
        await extractMedicalEntities(TEST_SCENARIOS.minimalData, { usePatterns: true });
      },
      3
    );

    console.log('\n📊 Baseline Performance - Minimal Data Note:');
    console.log(`   Duration: ${result.avgDuration}ms`);
    console.log(`   Memory: ${result.avgMemory}KB`);
    
    expect(result.avgDuration).toBeLessThan(3000);
  });

  test('Baseline: Long Note', async () => {
    const result = await runBenchmark(
      'Long Note',
      async () => {
        await extractMedicalEntities(TEST_SCENARIOS.longNote, { usePatterns: true });
      },
      3
    );

    console.log('\n📊 Baseline Performance - Long Note:');
    console.log(`   Duration: ${result.avgDuration}ms`);
    console.log(`   Memory: ${result.avgMemory}KB`);
    
    expect(result.avgDuration).toBeLessThan(8000);
  });

  test('Baseline: All Scenarios Summary', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BASELINE PERFORMANCE SUMMARY');
    console.log('='.repeat(80));
    
    const scenarios = [
      { name: 'Basic SAH Note', text: TEST_SCENARIOS.basicSAH },
      { name: 'Multiple Pathology', text: TEST_SCENARIOS.multiplePathology },
      { name: 'Complex Spine', text: TEST_SCENARIOS.complexSpine },
      { name: 'Minimal Data', text: TEST_SCENARIOS.minimalData },
      { name: 'Long Note', text: TEST_SCENARIOS.longNote }
    ];

    const results = [];
    for (const scenario of scenarios) {
      const result = await runBenchmark(
        scenario.name,
        async () => {
          await extractMedicalEntities(scenario.text, { usePatterns: true });
        },
        3
      );
      results.push(result);
    }

    console.log('\n| Scenario | Avg Duration (ms) | Avg Memory (KB) |');
    console.log('|----------|-------------------|-----------------|');
    results.forEach(r => {
      console.log(`| ${r.name.padEnd(20)} | ${String(r.avgDuration).padStart(17)} | ${String(r.avgMemory).padStart(15)} |`);
    });

    const totalDuration = results.reduce((sum, r) => sum + r.avgDuration, 0);
    const avgDuration = totalDuration / results.length;
    
    console.log(`\n📈 Average Duration: ${Math.round(avgDuration * 100) / 100}ms`);
    console.log('='.repeat(80) + '\n');

    expect(results.length).toBe(5);
  });
});

