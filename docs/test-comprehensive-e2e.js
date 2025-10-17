/**
 * Comprehensive End-to-End Test Suite
 *
 * Tests the complete DCS pipeline with realistic discharge summaries:
 * - Phase 1: Extraction
 * - Phase 2: Intelligence
 * - Phase 3: Narrative Generation
 * - Phase 4: Orchestration with refinement
 *
 * Validates:
 * - Data extraction accuracy
 * - Clinical intelligence quality
 * - Narrative coherence
 * - Performance metrics
 * - Quality thresholds
 */

import { orchestrateSummaryGeneration } from '../src/services/summaryOrchestrator.js';
import performanceMonitor from '../src/utils/performanceMonitor.js';

// ========================================
// TEST DATA: REALISTIC DISCHARGE SUMMARIES
// ========================================

const testCases = [
  {
    name: 'SAH with Aneurysm Coiling - Complex Case',
    pathology: 'subarachnoid_hemorrhage',
    expectedQuality: 0.60,
    expectedPhases: ['extraction', 'intelligence', 'narrative', 'validation'],
    notes: `
DISCHARGE SUMMARY

PATIENT: Jane Smith (MRN: 87654321)
DOB: 03/22/1968 (Age: 57)
ADMISSION: 10/01/2025
DISCHARGE: 10/18/2025

CHIEF COMPLAINT: Sudden severe headache with loss of consciousness

HISTORY OF PRESENT ILLNESS:
57-year-old female presented to emergency department on 10/01/2025 at 14:30 with sudden onset of
"worst headache of my life" followed by brief loss of consciousness. Patient was at home when symptoms
began. Family called 911. Initial GCS in field: 11 (E3V3M5).

PAST MEDICAL HISTORY:
- Hypertension (diagnosed 2015, on lisinopril)
- Hypothyroidism (diagnosed 2010, on levothyroxine)
- No prior strokes or aneurysms
- No family history of aneurysms

INITIAL EXAMINATION (10/01/2025):
Vital Signs: BP 178/95, HR 92, RR 18, SpO2 98% on RA, Temp 37.1°C
Neurological: GCS 13 (E4V4M5), pupils 3mm reactive bilaterally
             Nuchal rigidity present
             No focal motor deficits
             Hunt-Hess Grade: III
             WFNS Grade: II

IMAGING STUDIES:

CT Head (10/01/2025 - 15:00):
- Diffuse subarachnoid hemorrhage in basal cisterns and sylvian fissures
- Modified Fisher Grade 3 (thick SAH, no IVH)
- Mild hydrocephalus

CTA Brain (10/01/2025 - 15:45):
- 8mm right posterior communicating artery (PComm) aneurysm
- Wide neck, favorable for coiling
- No additional aneurysms identified

PROCEDURES:

1. External Ventricular Drain Placement (10/01/2025 - 18:00)
   - Indication: Acute hydrocephalus with GCS decline to 11
   - Procedure: Right frontal EVD placed at bedside in Neuro ICU
   - Opening pressure: 28 cm H2O
   - Complications: None
   - EVD set to drain at 10 cm above tragus

2. Endovascular Coiling of Right PComm Aneurysm (10/03/2025 - 09:00)
   - Approach: Right common femoral artery access
   - Coils deployed: 6 coils (total 42cm)
   - Raymond-Roy Classification: Class I (complete obliteration)
   - Complications: None
   - Fluoroscopy time: 42 minutes
   - Patient tolerated procedure well

3. VP Shunt Placement (10/15/2025 - 10:30)
   - Indication: Failed EVD wean (ICP >25 on clamping trial)
   - Type: Programmable VP shunt (Codman Hakim), medium pressure
   - Approach: Right frontal, peritoneal terminus
   - Complications: None

HOSPITAL COURSE:

Days 1-2 (10/01-10/02):
Admitted to Neuro ICU. EVD placed emergently for hydrocephalus. Started on nimodipine 60mg PO Q4H
for vasospasm prophylaxis. Strict blood pressure control (SBP 120-160). Daily transcranial Dopplers
initiated. ICP monitoring via EVD, pressures 10-15 mmHg (goal <20). Neurologically stable with GCS 14.

Post-Coiling Day 0 (10/03):
Endovascular coiling performed successfully. Post-procedure angiogram confirmed complete aneurysm
obliteration. Transferred back to Neuro ICU. Continued nimodipine. TCDs unremarkable with MCA
velocities 80-90 cm/s bilaterally.

POD 1-4 (10/04-10/07):
Patient remained stable. Daily TCDs showed gradually increasing velocities but within normal limits
(MCA 100-120 cm/s). No clinical vasospasm. GCS improved to 15 by POD 3. Started physical therapy.
Ambulating with assistance. Headaches managed with acetaminophen.

POD 5 (10/08) - VASOSPASM:
Patient developed new confusion and right arm weakness (4/5 strength).
TCD velocities: Left MCA 220 cm/s (Lindegaard ratio 5.2), Right MCA 195 cm/s (Lindegaard 4.8)
Stat CTA confirmed severe vasospasm of bilateral MCAs and ACAs.
INTERVENTION: Started triple-H therapy (hypertension, hypervolemia, hemodilution)
             SBP goal increased to 180-200 mmHg with norepinephrine
             Albumin boluses for volume expansion
             No intraarterial vasodilator therapy needed

POD 6-8 (10/09-10/11):
Neurological deficits improved with hypertensive therapy. Right arm strength returned to 5/5 by POD 7.
Mental status cleared completely by POD 8. TCDs showing improvement (MCA velocities decreasing to
150-160 cm/s). Norepinephrine successfully weaned off.

POD 9-12 (10/12-10/15):
Continued nimodipine (total 21 days from ictus). EVD wean attempted on POD 10.
CLAMPING TRIAL (10/14): ICP elevated to 28 mmHg after 24hr clamp → failed wean
Decision made for permanent VP shunt placement.

POD 12 (10/15) - SHUNT PLACEMENT:
Successful right frontal programmable VP shunt placed. No complications.
Post-op: Neurologically intact, GCS 15, no deficits.

POD 13-15 (10/16-10/18):
Patient recovering well from shunt surgery. No headaches with shunt functioning.
Physical therapy progressing - independent ambulation. Occupational therapy cleared for home.
Neurocognitive assessment: MOCA 27/30 (baseline estimate 29/30).

COMPLICATIONS:
1. Acute hydrocephalus (10/01) - treated with EVD
2. Delayed cerebral ischemia due to vasospasm (10/08) - resolved with medical management
3. Chronic hydrocephalus (10/14) - treated with VP shunt
4. Mild cognitive impairment at discharge (MOCA 27/30)

DISCHARGE MEDICATIONS:
1. Nimodipine 60mg PO Q4H - continue for 21 days from ictus (through 10/22/2025)
2. Levetiracetam 500mg PO BID - seizure prophylaxis, duration 3 months
3. Acetaminophen 650mg PO Q6H PRN headache
4. Lisinopril 10mg PO daily - blood pressure control
5. Levothyroxine 75mcg PO daily - hypothyroidism
6. Docusate sodium 100mg PO BID
7. Pantoprazole 40mg PO daily

FUNCTIONAL STATUS AT DISCHARGE:
GCS: 15 (E4V5M6) - full orientation
Hunt-Hess: Grade I (improved from Grade III)
Modified Rankin Scale (mRS): 2 (slight disability, able to look after own affairs)
Barthel Index: 85/100 (mild dependence)
MOCA: 27/30 (mild cognitive impairment)

DISCHARGE DISPOSITION: Home with family support

FOLLOW-UP ARRANGEMENTS:
1. Neurosurgery clinic: 2 weeks (Dr. Johnson)
2. Repeat CTA brain: 6 months (assess aneurysm occlusion)
3. Shunt series X-rays: 1 month (confirm shunt placement)
4. Neuropsychology evaluation: 3 months (cognitive assessment)
5. Physical therapy: Outpatient, 2x/week for 4 weeks

DISCHARGE INSTRUCTIONS:
- No driving for 3 months (seizure precaution)
- No heavy lifting >10 lbs for 6 weeks (shunt precaution)
- Monitor for headache, confusion, vision changes (shunt malfunction signs)
- Continue nimodipine through 10/22 as prescribed
- Blood pressure goal: <140/90 at home

PROGNOSIS:
Good functional recovery expected. Risk of aneurysm recurrence: <5% with complete coiling.
Risk of seizure: 5-10% despite prophylaxis. Shunt revision risk: 30-40% over lifetime.
Cognitive deficits may improve over 6-12 months with rehabilitation.

Attending Physician: Dr. Sarah Johnson, MD
Neurosurgery Department
`,
  },

  {
    name: 'GBM with IDH-wildtype - Oncology Focus',
    pathology: 'glioblastoma',
    expectedQuality: 0.65,
    expectedPhases: ['extraction', 'intelligence', 'narrative', 'validation'],
    notes: `
DISCHARGE SUMMARY

PATIENT: Robert Chen (MRN: 45678901)
DOB: 07/14/1963 (Age: 62)
ADMISSION: 09/15/2025
DISCHARGE: 09/28/2025

CHIEF COMPLAINT: Progressive headaches and new-onset seizure

HISTORY OF PRESENT ILLNESS:
62-year-old right-handed male with 6-week history of progressive headaches, initially managed as
tension headaches by PCP. On 09/14/2025, patient had witnessed generalized tonic-clonic seizure
lasting approximately 90 seconds. Brought to ED by EMS. Post-ictal period: confused for 20 minutes,
then returned to baseline.

PAST MEDICAL HISTORY:
- Type 2 Diabetes Mellitus (HbA1c 7.2% last month)
- Hyperlipidemia
- GERD
- No prior seizures
- No prior brain surgery or radiation

SOCIAL HISTORY:
- Former smoker (quit 2005, 30 pack-year history)
- Occasional alcohol use
- Retired engineer
- Lives with wife, independent in all ADLs

INITIAL EXAMINATION (09/15/2025):
Vital Signs: BP 145/88, HR 78, RR 16, SpO2 99% on RA, Temp 36.8°C
Neurological: GCS 15, alert and oriented x3
             PERRL 3→2mm bilaterally
             Visual fields: possible right superior quadrantanopsia
             Motor: 5/5 strength all extremities
             Sensory: intact to light touch
             Cranial nerves: II-XII intact except possible superior quadrantanopsia
             Gait: normal, no ataxia
             Karnofsky Performance Status (KPS): 90

IMAGING STUDIES:

MRI Brain with Contrast (09/15/2025):
- 4.5 x 4.2 x 3.8 cm heterogeneously enhancing mass in left temporal-parietal region
- Surrounding vasogenic edema
- 5mm midline shift to the right
- Mass effect on left lateral ventricle
- Central necrosis present
- Characteristics consistent with high-grade glioma

MRI Brain Functional (09/16/2025):
- Language cortex: 2.3 cm from tumor margin (Wernicke's area)
- Motor cortex: preserved, 4.5 cm from tumor
- Tumor in eloquent cortex - careful resection planning needed

DTI Tractography (09/16/2025):
- Optic radiations displaced but intact
- Arcuate fasciculus: medially displaced, 1.8 cm from tumor

PROCEDURES:

Left Craniotomy for Tumor Resection (09/18/2025):
- Approach: Left temporal-parietal craniotomy
- Intraoperative neuromonitoring: MEPs, SSEPs (remained stable)
- Awake craniotomy technique for language mapping
- Extent of resection: Gross total resection achieved (>98% by intraoperative assessment)
- Fluorescence: 5-ALA used - tumor showed strong fluorescence
- Complications: None intraoperatively
- Frozen section: High-grade glioma
- Estimated blood loss: 250 mL
- Duration: 4 hours 20 minutes

PATHOLOGY RESULTS (09/21/2025):

Final Diagnosis: Glioblastoma, IDH-wildtype, WHO Grade 4

Molecular Markers:
- IDH1/IDH2: Wildtype (R132H negative by IHC)
- MGMT promoter: Methylated (favorable for temozolomide response)
- p53: Overexpression (70% of tumor cells)
- Ki-67 proliferation index: 35%
- EGFR amplification: Present
- 1p/19q codeletion: Absent
- TERT promoter mutation: Present (C228T)

Histopathology:
- Hypercellular glial neoplasm with marked nuclear atypia
- Microvascular proliferation present
- Necrosis with pseudopalisading present
- Infiltrative growth pattern

HOSPITAL COURSE:

POD 0 (09/18) - Surgery Day:
Successful gross total resection. Patient extubated in OR, neurologically intact immediately post-op.
Transferred to Neuro ICU for overnight monitoring. No new neurological deficits. Language function
intact (full sentences, appropriate responses). Visual fields: unchanged from preop.

POD 1 (09/19):
Transferred to neurosurgery floor. Physical therapy initiated - ambulating with assistance.
Started on dexamethasone 4mg Q6H for perilesional edema. Continued levetiracetam 500mg BID.
Post-op MRI ordered for POD 2.

POD 2 (09/20):
MRI Brain with Contrast:
- Postoperative changes with blood products in resection cavity
- No residual enhancing tumor identified (gross total resection confirmed)
- Expected perilesional edema
- No acute infarct
- No hemorrhage

Neurological exam: Stable, GCS 15, no new deficits. KPS: 80

POD 3-5 (09/21-09/23):
Pathology results finalized: GBM, IDH-wildtype, MGMT-methylated
Multidisciplinary tumor board reviewed case on 09/22:
RECOMMENDATION: Concurrent chemoradiation (Stupp protocol)
                 Radiation: 60 Gy in 30 fractions over 6 weeks
                 Temozolomide: 75 mg/m² daily during radiation
                 Followed by adjuvant TMZ 150-200 mg/m² days 1-5 of 28-day cycles x6

Neuro-oncology consulted (Dr. Martinez):
- Plan for radiation oncology consult prior to discharge
- MRI brain to be done 1 week before starting radiation
- Baseline CBC, CMP, LFTs obtained

Dexamethasone taper initiated: 4mg Q8H x 2 days, then 2mg Q12H x 2 days

POD 6-8 (09/24-09/26):
Physical therapy: Independent ambulation, cleared for home
Occupational therapy: Independent in ADLs
Radiation oncology consulted (Dr. Thompson):
- Simulation appointment scheduled for 10/05/2025
- Radiation to begin 10/12/2025
- Discussed side effects: fatigue, hair loss, skin changes, possible cognitive effects

POD 9-10 (09/27-09/28):
Patient stable, ready for discharge.
Final neurological exam:
- GCS 15, full orientation
- Visual fields: right superior quadrantanopsia (unchanged)
- Strength: 5/5 all extremities
- Language: fluent, intact comprehension, no anomia
- KPS: 80 (normal activity with effort)
- ECOG: 1 (restricted in strenuous activity)

COMPLICATIONS:
1. Right superior quadrantanopsia (preoperative, persisted postoperatively)
   - Expected due to tumor location affecting optic radiations
2. Mild perilesional edema (POD 1-5) - managed with dexamethasone taper

DISCHARGE MEDICATIONS:
1. Levetiracetam 750mg PO BID - seizure prophylaxis (increased from 500mg)
2. Dexamethasone 2mg PO Q12H - taper over 1 week: 2mg Q12H x3d, 2mg daily x3d, then stop
3. Pantoprazole 40mg PO daily - GI prophylaxis while on dexamethasone
4. Metformin 1000mg PO BID - diabetes
5. Atorvastatin 40mg PO daily - hyperlipidemia
6. Docusate sodium 100mg PO BID
7. Ondansetron 8mg PO Q8H PRN nausea

FUNCTIONAL STATUS AT DISCHARGE:
Karnofsky Performance Status: 80
ECOG Performance Status: 1
Neurological: GCS 15, right superior quadrantanopsia, otherwise intact
Ambulation: Independent
ADLs: Independent

DISCHARGE DISPOSITION: Home with family

FOLLOW-UP ARRANGEMENTS:
1. Neurosurgery clinic: 2 weeks (Dr. Johnson) - wound check
2. Neuro-oncology clinic: 1 week (Dr. Martinez)
3. Radiation oncology: Simulation 10/05, treatment start 10/12
4. MRI brain with contrast: 1 week before radiation (10/05)
5. Ophthalmology: 1 month (visual field assessment)

TREATMENT PLAN:
Standard Stupp Protocol for newly diagnosed GBM:
- Phase 1 (Concurrent): RT 60 Gy/30 fx + TMZ 75 mg/m² daily x 6 weeks
- Phase 2 (Adjuvant): TMZ 150-200 mg/m² days 1-5, every 28 days x 6 cycles
- Monitoring: MRI brain every 8 weeks during treatment
- Consider tumor treating fields (Optune) after completion of radiation

PROGNOSIS:
Glioblastoma IDH-wildtype median survival: 15-18 months
Favorable factors: Gross total resection, MGMT methylation, KPS 80
With MGMT methylation: Expected median survival 21-24 months
2-year survival: approximately 25-30%

GENETIC COUNSELING:
Sporadic GBM (not hereditary). No increased risk for family members.

Attending Physician: Dr. Michael Johnson, MD
Neurosurgery Department

Co-Attending: Dr. Elena Martinez, MD
Neuro-Oncology
`,
  },

  {
    name: 'Spinal Cord Injury - C5 ASIA D',
    pathology: 'spinal_cord_injury',
    expectedQuality: 0.60,
    expectedPhases: ['extraction', 'intelligence', 'narrative', 'validation'],
    notes: `
DISCHARGE SUMMARY

PATIENT: Marcus Williams (MRN: 23456789)
DOB: 11/30/1989 (Age: 35)
ADMISSION: 08/20/2025
DISCHARGE: 09/25/2025

CHIEF COMPLAINT: Motor vehicle collision with cervical spine injury

HISTORY OF PRESENT ILLNESS:
35-year-old male involved in high-speed motor vehicle collision on 08/20/2025 at approximately 09:15.
Patient was unrestrained driver, frontal impact at estimated 55 mph. Air bag deployed. Patient
extricated by fire rescue with full spinal precautions. Initial GCS in field: 15.

MECHANISM: Hyperflexion injury of cervical spine

TRAUMA EVALUATION (08/20/2025 - 10:00):
Primary Survey:
- Airway: Patent, C-collar in place
- Breathing: Clear bilaterally, SpO2 98% on RA
- Circulation: HR 68 (concerning for spinal shock), BP 105/65
- Disability: GCS 15, bilateral upper extremity weakness
- Exposure: Log-rolled, full body exam performed

INJURIES IDENTIFIED:
1. Cervical spine: C5 burst fracture with cord compression
2. Upper extremities: Bilateral weakness, R>L
3. Chest: Minor contusions, no rib fractures
4. Abdomen: Negative FAST exam
5. Pelvis: Stable

INITIAL NEUROLOGICAL EXAMINATION (08/20 - 10:30):

Motor Examination (0-5 scale):
RIGHT:
- Deltoid (C5): 2/5
- Biceps (C5-C6): 2/5
- Wrist extensors (C6): 1/5
- Triceps (C7): 0/5
- Hand intrinsics (C8-T1): 0/5
- Hip flexors: 2/5
- Knee extensors: 3/5
- Ankle dorsiflexors: 3/5
- Ankle plantarflexors: 4/5

LEFT:
- Deltoid (C5): 3/5
- Biceps (C5-C6): 3/5
- Wrist extensors (C6): 2/5
- Triceps (C7): 1/5
- Hand intrinsics (C8-T1): 0/5
- Hip flexors: 3/5
- Knee extensors: 4/5
- Ankle dorsiflexors: 4/5
- Ankle plantarflexors: 4/5

Sensory Examination:
- Light touch: Diminished from C6 and below bilaterally
- Pinprick: Diminished from C6 and below bilaterally
- Proprioception: Intact at great toes bilaterally
- Sacral sensation: Present (S4-S5 intact)

Reflexes:
- Biceps: Absent bilaterally
- Triceps: Absent bilaterally
- Patellar: 1+ bilaterally
- Achilles: 1+ bilaterally
- Babinski: Upgoing bilaterally
- Bulbocavernosus: Present (spinal shock resolution)
- Anal sphincter tone: Weak voluntary contraction

ASIA Impairment Scale: C (Motor incomplete)
Neurological Level: C5
Motor Level: C5 bilaterally
Sensory Level: C6 bilaterally

IMAGING STUDIES:

CT Cervical Spine (08/20 - 10:15):
- Comminuted burst fracture of C5 vertebral body
- Retropulsion of posterior vertebral body fragment into spinal canal
- Approximately 50% canal compromise
- Bilateral C5 lamina fractures
- No atlanto-occipital dislocation
- C1-C4: intact
- C6-C7: intact

MRI Cervical Spine (08/20 - 14:00):
- C5 burst fracture with moderate spinal cord compression
- Spinal cord edema from C4 to C6 levels
- No cord transection
- Central cord signal abnormality (T2 hyperintensity)
- Posterior longitudinal ligament intact
- Disc spaces: intact

CT Angiography Neck (08/20 - 11:00):
- Vertebral arteries: patent bilaterally
- Carotid arteries: no dissection

PROCEDURES:

1. C4-C6 Anterior Cervical Diskectomy and Fusion (ACDF) with corpectomy (08/20/2025 - 16:00)
   - Approach: Right-sided Smith-Robinson approach
   - C5 corpectomy performed
   - Neural decompression: Removal of retropulsed bone fragments
   - Reconstruction: Expandable titanium cage with local bone graft
   - Plate fixation: C4-C6 anterior cervical plate
   - Intraoperative neuromonitoring: SSEPs and MEPs monitored (stable throughout)
   - Complications: None
   - EBL: 200 mL
   - Duration: 3 hours 45 minutes

2. C4-C6 Posterior Cervical Fusion with Instrumentation (08/21/2025 - 08:00)
   - Approach: Posterior midline
   - Lateral mass screws: C4 and C6 bilaterally
   - Pedicle screws: Could not be safely placed at C5 due to fracture
   - Rods: Contoured titanium rods
   - Fusion: Local bone graft with allograft
   - Complications: None
   - EBL: 350 mL
   - Duration: 2 hours 30 minutes

HOSPITAL COURSE:

Day 1 (08/20) - Admission:
Trauma activation. Neurological exam concerning for incomplete spinal cord injury.
CT and MRI confirmed C5 burst fracture with cord compression.
Spinal surgery consulted emergently. Decision for early surgical decompression (<24 hours).
Methylprednisolone NOT administered (NASCIS-II protocol not used per institutional protocol).
ICU admission. Hemodynamic management: MAP goal >85 mmHg for spinal cord perfusion.

POD 0 (08/20) - Anterior Surgery:
Successful C5 corpectomy with ACDF C4-C6. Adequate neural decompression achieved.
Post-op: Neurologically stable, no worsening. Remained in ICU.

POD 1 (08/21) - Posterior Surgery:
Successful posterior instrumentation C4-C6 for additional stability.
Post-op: Neurologically stable. MAP maintained >85 mmHg. Bladder catheter in place.

POD 2-5 (08/22-08/25):
Post-operative imaging (CT cervical spine): Good hardware position, adequate decompression
Transferred to acute spine unit.
Neurological reassessment on POD 3:
- Right deltoid improved 2→3/5
- Right biceps improved 2→3/5
- Left triceps improved 1→2/5
- No other significant motor changes
- ASIA C (Motor incomplete) unchanged

Started on DVT prophylaxis (enoxaparin 40mg SC daily).
Physical therapy and occupational therapy initiated.
Bowel and bladder management program started.

POD 6-15 (08/26-09/04):
Gradual neurological improvement noted:
- Motor scores improving by 1-2 grades in multiple myotomes
- Sensory level unchanged
- ASIA improved from C to D on POD 10 (08/30)

ASIA Examination POD 10 (08/30):
Motor:
RIGHT:
- Deltoid: 3/5
- Biceps: 3/5
- Wrist extensors: 3/5
- Triceps: 2/5
- Hand intrinsics: 1/5
- Lower extremities: 4/5 all groups

LEFT:
- Deltoid: 4/5
- Biceps: 4/5
- Wrist extensors: 3/5
- Triceps: 3/5
- Hand intrinsics: 2/5
- Lower extremities: 4/5 all groups

ASIA Impairment Scale: D (Motor incomplete) - IMPROVED
At least half of key muscle functions below neurological level have grade ≥3

Physical therapy progress:
- POD 6: Sitting balance independent
- POD 10: Standing with walker and assistance
- POD 14: Ambulating 20 feet with walker and moderate assistance

Occupational therapy progress:
- POD 7: Basic feeding with adaptive equipment
- POD 12: Dressing upper body with setup
- POD 15: Wheelchair mobility training

POD 16-25 (09/05-09/14):
Continued intensive rehabilitation.
Cleared for acute inpatient rehabilitation transfer.

POD 26-36 (09/15-09/25):
Transferred to acute inpatient rehabilitation facility.
Continued aggressive physical and occupational therapy.

FINAL NEUROLOGICAL EXAMINATION (09/25):

Motor:
RIGHT:
- Deltoid: 4/5
- Biceps: 4/5
- Wrist extensors: 3/5
- Triceps: 3/5
- Hand intrinsics: 2/5
- Hip flexors: 4/5
- Knee extensors: 4/5
- Ankle: 5/5 all movements

LEFT:
- Deltoid: 4/5
- Biceps: 4/5
- Wrist extensors: 4/5
- Triceps: 4/5
- Hand intrinsics: 3/5
- Hip flexors: 4/5
- Knee extensors: 5/5
- Ankle: 5/5 all movements

ASIA Impairment Scale: D (Motor incomplete)
Neurological Level: C5
Motor Level: C5 right, C4 left

Functional Scores at Discharge:
- Spinal Cord Independence Measure (SCIM III): 45/100
  - Self-care: 8/20
  - Respiration and sphincter management: 20/40
  - Mobility: 17/40
- Modified Barthel Index: 55/100 (moderate dependence)

Bowel/Bladder Function:
- Bladder: Intermittent self-catheterization with assistance
- Bowel: Bowel program established, continent with program

COMPLICATIONS:
1. Acute spinal cord injury - ASIA C→D (improved)
2. Neurogenic bladder - managed with catheterization program
3. Neurogenic bowel - managed with bowel program
4. DVT prophylaxis given (no DVT occurred)

DISCHARGE MEDICATIONS:
1. Enoxaparin 40mg SC daily - DVT prophylaxis (3 months duration)
2. Baclofen 5mg PO TID - spasticity management
3. Oxybutynin 5mg PO BID - neurogenic bladder
4. Docusate sodium 100mg PO BID + senna 2 tabs daily - bowel program
5. Polyethylene glycol 17g PO daily PRN constipation
6. Gabapentin 300mg PO TID - neuropathic pain
7. Acetaminophen 650mg PO Q6H PRN pain
8. Pantoprazole 40mg PO daily

DURABLE MEDICAL EQUIPMENT:
- Manual wheelchair with cushion
- Walker
- Hospital bed
- Shower chair
- Raised toilet seat
- Adaptive eating utensils
- Reaching aids

DISCHARGE DISPOSITION: Acute Inpatient Rehabilitation Facility

FOLLOW-UP ARRANGEMENTS:
1. Spine surgery clinic: 6 weeks (Dr. Anderson) - X-rays cervical spine
2. Spinal cord injury clinic: 2 weeks (Dr. Peterson)
3. Physical medicine and rehabilitation: Weekly during rehab
4. Urology: 1 month (bladder management)
5. CT cervical spine with 3D reconstruction: 3 months (assess fusion)

REHABILITATION GOALS (3-6 months):
1. Independent wheelchair mobility
2. Independent transfers
3. Independent feeding and grooming
4. Assisted dressing
5. Ambulation with assistive device for short distances
6. Independent intermittent catheterization
7. Return to modified work duties (sedentary position)

PROGNOSIS:
Favorable for continued neurological recovery. ASIA D at discharge is positive prognostic indicator.
Expected outcomes for C5 ASIA D:
- 90-95% achieve independent wheelchair mobility
- 75-85% achieve household ambulation with assistive device
- 60-70% return to some form of employment
- Continue improvement for 12-18 months post-injury

Greatest recovery typically in first 6 months. Intensive rehabilitation critical for optimal outcome.

Attending Physician: Dr. James Anderson, MD
Spine Surgery

Co-Attending: Dr. Rachel Peterson, MD
Physical Medicine and Rehabilitation
`,
  },
];

// ========================================
// TEST UTILITIES
// ========================================

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function assessNarrativeQuality(narrative) {
  const checks = {
    hasChiefComplaint: !!narrative.chiefComplaint && narrative.chiefComplaint.length > 20,
    hasHospitalCourse: !!narrative.hospitalCourse && narrative.hospitalCourse.length > 100,
    hasDischargeInstructions: !!narrative.dischargeInstructions && narrative.dischargeInstructions.length > 50,
    hasProcedures: !!narrative.procedures && narrative.procedures.length > 50,
    hasPrognosis: !!narrative.prognosis && narrative.prognosis.length > 30,
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const totalChecks = Object.keys(checks).length;

  return {
    score: passedChecks / totalChecks,
    checks,
    details: `${passedChecks}/${totalChecks} narrative sections present`
  };
}

function validateExtraction(extractedData, pathology) {
  const checks = {
    hasDates: !!extractedData.dates && (extractedData.dates.admission || extractedData.dates.admissionDate),
    hasPathology: !!extractedData.pathology,
    hasProcedures: Array.isArray(extractedData.procedures) && extractedData.procedures.length > 0,
    hasDemographics: !!extractedData.demographics && extractedData.demographics.age,
    hasDischarge: !!extractedData.discharge,
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const totalChecks = Object.keys(checks).length;

  return {
    score: passedChecks / totalChecks,
    checks,
    details: `${passedChecks}/${totalChecks} required fields extracted`
  };
}

function validateIntelligence(intelligence) {
  const checks = {
    hasPathologyAnalysis: !!intelligence.pathology,
    hasQualityAssessment: !!intelligence.quality,
    hasCompletenessCheck: !!intelligence.completeness,
    hasConsistencyCheck: !!intelligence.consistency,
    hasSuggestions: Array.isArray(intelligence.suggestions),
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const totalChecks = Object.keys(checks).length;

  return {
    score: passedChecks / totalChecks,
    checks,
    details: `${passedChecks}/${totalChecks} intelligence components present`
  };
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runComprehensiveE2ETests() {
  console.log('\n' + '═'.repeat(80));
  console.log('  COMPREHENSIVE END-TO-END TEST SUITE');
  console.log('  Testing Complete DCS Pipeline (Phases 1-4)');
  console.log('═'.repeat(80) + '\n');

  const results = {
    totalTests: testCases.length,
    passed: 0,
    failed: 0,
    testResults: [],
    performanceMetrics: {
      totalTime: 0,
      averageTime: 0,
      fastest: null,
      slowest: null
    }
  };

  // Clear performance metrics before tests
  performanceMonitor.clearMetrics();

  const overallStartTime = Date.now();

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`TEST ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`Pathology: ${testCase.pathology}`);
    console.log(`${'─'.repeat(80)}\n`);

    const testStartTime = Date.now();
    let testResult = {
      name: testCase.name,
      pathology: testCase.pathology,
      status: 'running',
      duration: 0,
      phases: {},
      qualityScore: 0,
      errors: []
    };

    try {
      // Run orchestration with all phases
      console.log('🚀 Starting orchestration...\n');
      const orchestrationResult = await orchestrateSummaryGeneration(testCase.notes, {
        enableLearning: true,
        enableFeedbackLoops: true,
        maxRefinementIterations: 2,
        qualityThreshold: 0.7
      });

      const testEndTime = Date.now();
      testResult.duration = testEndTime - testStartTime;

      if (!orchestrationResult.success) {
        testResult.status = 'failed';
        testResult.errors.push('Orchestration failed: ' + (orchestrationResult.error || 'Unknown error'));
        results.failed++;
        console.log('❌ TEST FAILED: Orchestration unsuccessful\n');
        results.testResults.push(testResult);
        continue;
      }

      // Phase 1: Extraction validation
      console.log('📋 PHASE 1: EXTRACTION');
      const extractionValidation = validateExtraction(orchestrationResult.extractedData, testCase.pathology);
      testResult.phases.extraction = extractionValidation;
      console.log(`   Score: ${formatPercentage(extractionValidation.score)} - ${extractionValidation.details}`);
      console.log(`   ✓ Dates: ${extractionValidation.checks.hasDates}`);
      console.log(`   ✓ Pathology: ${extractionValidation.checks.hasPathology}`);
      console.log(`   ✓ Procedures: ${extractionValidation.checks.hasProcedures}`);
      console.log(`   ✓ Demographics: ${extractionValidation.checks.hasDemographics}`);
      console.log(`   ✓ Discharge: ${extractionValidation.checks.hasDischarge}\n`);

      // Phase 2: Intelligence validation
      console.log('🧠 PHASE 2: INTELLIGENCE');
      const intelligenceValidation = validateIntelligence(orchestrationResult.intelligence);
      testResult.phases.intelligence = intelligenceValidation;
      console.log(`   Score: ${formatPercentage(intelligenceValidation.score)} - ${intelligenceValidation.details}`);
      if (orchestrationResult.intelligence.quality?.score !== undefined) {
        console.log(`   Overall Quality: ${formatPercentage(orchestrationResult.intelligence.quality.score)}`);
      }
      if (orchestrationResult.intelligence.completeness?.score !== undefined) {
        console.log(`   Completeness: ${formatPercentage(orchestrationResult.intelligence.completeness.score)}`);
      }
      console.log(`   Suggestions: ${orchestrationResult.intelligence.suggestions?.length || 0}\n`);

      // Phase 3: Narrative validation
      console.log('📝 PHASE 3: NARRATIVE');
      const narrativeValidation = assessNarrativeQuality(orchestrationResult.summary);
      testResult.phases.narrative = narrativeValidation;
      console.log(`   Score: ${formatPercentage(narrativeValidation.score)} - ${narrativeValidation.details}`);
      console.log(`   ✓ Chief Complaint: ${narrativeValidation.checks.hasChiefComplaint}`);
      console.log(`   ✓ Hospital Course: ${narrativeValidation.checks.hasHospitalCourse}`);
      console.log(`   ✓ Procedures: ${narrativeValidation.checks.hasProcedures}`);
      console.log(`   ✓ Discharge Instructions: ${narrativeValidation.checks.hasDischargeInstructions}`);
      console.log(`   ✓ Prognosis: ${narrativeValidation.checks.hasPrognosis}\n`);

      // Phase 4: Orchestration metrics
      console.log('🎯 PHASE 4: ORCHESTRATION');
      console.log(`   Refinement Iterations: ${orchestrationResult.refinementIterations}`);
      console.log(`   Quality Score: ${formatPercentage(orchestrationResult.qualityMetrics?.overall || 0)}`);
      console.log(`   Validation Errors: ${orchestrationResult.validation?.errors?.total || 0}`);
      console.log(`   Validation Critical: ${orchestrationResult.validation?.errors?.critical || 0}`);

      // Performance metrics
      if (orchestrationResult.metadata?.performanceMetrics) {
        const perf = orchestrationResult.metadata.performanceMetrics;
        console.log(`\n⏱️  PERFORMANCE:`);
        console.log(`   Total: ${formatDuration(testResult.duration)}`);
        if (perf.extraction?.duration) {
          console.log(`   Extraction: ${formatDuration(perf.extraction.duration)} ${perf.extraction.severity === 'warning' || perf.extraction.severity === 'critical' ? '⚠️' : ''}`);
        }
        if (perf.intelligence?.duration) {
          console.log(`   Intelligence: ${formatDuration(perf.intelligence.duration)} ${perf.intelligence.severity === 'warning' || perf.intelligence.severity === 'critical' ? '⚠️' : ''}`);
        }
        if (perf.narrative?.duration) {
          console.log(`   Narrative: ${formatDuration(perf.narrative.duration)} ${perf.narrative.severity === 'warning' || perf.narrative.severity === 'critical' ? '⚠️' : ''}`);
        }
      }

      // Overall assessment
      const overallQuality = orchestrationResult.qualityMetrics?.overall || 0;
      testResult.qualityScore = overallQuality;

      const meetsQualityThreshold = overallQuality >= testCase.expectedQuality;
      const allPhasesPresent = extractionValidation.score > 0.6 &&
                               intelligenceValidation.score > 0.6 &&
                               narrativeValidation.score > 0.6;

      if (meetsQualityThreshold && allPhasesPresent) {
        testResult.status = 'passed';
        results.passed++;
        console.log(`\n✅ TEST PASSED`);
        console.log(`   Quality: ${formatPercentage(overallQuality)} (threshold: ${formatPercentage(testCase.expectedQuality)})`);
      } else {
        testResult.status = 'failed';
        results.failed++;
        console.log(`\n❌ TEST FAILED`);
        if (!meetsQualityThreshold) {
          testResult.errors.push(`Quality ${formatPercentage(overallQuality)} below threshold ${formatPercentage(testCase.expectedQuality)}`);
          console.log(`   Quality below threshold: ${formatPercentage(overallQuality)} < ${formatPercentage(testCase.expectedQuality)}`);
        }
        if (!allPhasesPresent) {
          testResult.errors.push('Not all phases met minimum thresholds (60%)');
          console.log(`   Some phases below 60% threshold`);
        }
      }

    } catch (error) {
      testResult.status = 'failed';
      testResult.duration = Date.now() - testStartTime;
      testResult.errors.push(`Exception: ${error.message}`);
      results.failed++;
      console.log(`\n❌ TEST FAILED: Exception thrown`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }

    results.testResults.push(testResult);
  }

  const overallEndTime = Date.now();
  results.performanceMetrics.totalTime = overallEndTime - overallStartTime;
  results.performanceMetrics.averageTime = results.performanceMetrics.totalTime / results.totalTests;

  // Find fastest and slowest tests
  const sortedByDuration = [...results.testResults].sort((a, b) => a.duration - b.duration);
  results.performanceMetrics.fastest = sortedByDuration[0];
  results.performanceMetrics.slowest = sortedByDuration[sortedByDuration.length - 1];

  // Print summary
  console.log('\n' + '═'.repeat(80));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(80) + '\n');

  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} (${formatPercentage(results.passed / results.totalTests)})`);
  console.log(`Failed: ${results.failed} (${formatPercentage(results.failed / results.totalTests)})`);

  console.log(`\nPerformance:`);
  console.log(`  Total Time: ${formatDuration(results.performanceMetrics.totalTime)}`);
  console.log(`  Average Time: ${formatDuration(results.performanceMetrics.averageTime)}`);
  console.log(`  Fastest: ${results.performanceMetrics.fastest.name} (${formatDuration(results.performanceMetrics.fastest.duration)})`);
  console.log(`  Slowest: ${results.performanceMetrics.slowest.name} (${formatDuration(results.performanceMetrics.slowest.duration)})`);

  // Performance monitoring summary
  console.log('\n' + '─'.repeat(80));
  console.log('PERFORMANCE MONITORING SUMMARY');
  console.log('─'.repeat(80) + '\n');

  const report = performanceMonitor.generateReport();
  if (report.summary.totalOperations > 0) {
    console.log(`Total Operations: ${report.summary.totalOperations}`);
    console.log(`Average Duration: ${formatDuration(report.summary.avgTime)}`);
    console.log(`Range: ${formatDuration(report.summary.minTime)} - ${formatDuration(report.summary.maxTime)}`);

    console.log(`\nBy Severity:`);
    console.log(`  ✓ Normal: ${report.bySeverity.info}`);
    console.log(`  ⚠️  Warning: ${report.bySeverity.warning}`);
    console.log(`  🔴 Critical: ${report.bySeverity.critical}`);

    if (report.bySeverity.warning > 0 || report.bySeverity.critical > 0) {
      console.log(`\nSlowest Operations:`);
      report.slowest.slice(0, 5).forEach((op, idx) => {
        const icon = op.severity === 'critical' ? '🔴' : op.severity === 'warning' ? '⚠️' : '✓';
        console.log(`  ${idx + 1}. ${icon} ${op.name}: ${formatDuration(op.duration)}`);
      });
    }
  }

  console.log('\n' + '═'.repeat(80) + '\n');

  const passRate = results.passed / results.totalTests;
  if (passRate >= 0.8) {
    console.log('🎉 EXCELLENT: All major functionality working correctly!');
  } else if (passRate >= 0.6) {
    console.log('✅ GOOD: Most functionality working, some areas need attention.');
  } else {
    console.log('⚠️  NEEDS ATTENTION: Significant issues detected.');
  }

  return results;
}

// ========================================
// RUN TESTS
// ========================================

runComprehensiveE2ETests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
