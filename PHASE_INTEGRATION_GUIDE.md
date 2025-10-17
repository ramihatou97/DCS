# Phase Integration Guide

**Version:** 1.0
**Last Updated:** October 2025
**Target Audience:** Developers extending or modifying the DCS system

---

## Table of Contents

1. [Introduction](#introduction)
2. [Integration Overview](#integration-overview)
3. [Phase-by-Phase Integration](#phase-by-phase-integration)
4. [Data Contracts](#data-contracts)
5. [Integration Patterns](#integration-patterns)
6. [Code Examples](#code-examples)
7. [Error Handling](#error-handling)
8. [Testing Integration](#testing-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

The Discharge Summary Generator (DCS) uses a **4-phase pipeline architecture** where each phase has specific responsibilities and produces standardized outputs consumed by subsequent phases. This guide explains how these phases integrate, the data contracts between them, and best practices for maintaining integration integrity.

### Why Phase Separation?

1. **Modularity:** Each phase can be developed, tested, and updated independently
2. **Testability:** Clear input/output contracts enable isolated unit testing
3. **Flexibility:** Phases can be replaced or enhanced without affecting others
4. **Quality Control:** Validation gates between phases ensure data integrity
5. **Iterative Refinement:** Orchestrator can re-run phases based on quality feedback

---

## Integration Overview

### Pipeline Flow

```
┌───────────────────────────────────────────────────────┐
│                   Clinical Notes (Input)              │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: EXTRACTION                                    │
│  Input:  Raw clinical text                             │
│  Output: Structured medical data (extractedData)       │
│  Files:  src/services/extraction.js                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ extractedData
                       ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: CLINICAL INTELLIGENCE                         │
│  Input:  extractedData                                  │
│  Output: Intelligence insights (timeline, treatment,    │
│          functional evolution)                          │
│  Files:  src/services/intelligenceHub.js                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ extractedData + intelligence
                       ▼
┌─────────────────────────────────────────────────────────┐
│  VALIDATION & QUALITY GATE                              │
│  Input:  extractedData + intelligence                   │
│  Output: validation results + quality metrics           │
│  Files:  src/services/validation.js,                    │
│          src/services/qualityMetrics.js                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Quality OK?
                       ├─ YES ─────────┐
                       │               │
                       └─ NO ──> Refine│
                                       ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: NARRATIVE GENERATION                          │
│  Input:  extractedData + intelligence + validation      │
│  Output: Narrative summary sections                     │
│  Files:  src/services/narrativeEngine.js                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  COMPLETE DISCHARGE SUMMARY                             │
│  Output: All phases combined in orchestration result    │
└─────────────────────────────────────────────────────────┘
```

### Orchestration Layer

**Phase 4 (Orchestration)** coordinates all phases:

```javascript
// src/services/summaryOrchestrator.js
export async function orchestrateSummaryGeneration(notes, options) {
  // 1. Run Phase 1: Extraction
  const extracted = await extractMedicalEntities(notes);

  // 2. Run Phase 2: Intelligence
  const intelligence = await generateIntelligence(extracted.extracted);

  // 3. Validate & Assess Quality
  const validation = validateExtraction(extracted.extracted);
  const quality = calculateQualityMetrics(extracted.extracted, validation);

  // 4. Decide: Refine or Continue
  if (quality.overall < qualityThreshold && iterations < maxIterations) {
    // Learn from errors and refine
    await learningEngine.learnFromValidation(validation);
    iterations++;
    continue; // Re-run extraction with learned patterns
  }

  // 5. Run Phase 3: Narrative Generation
  const narrative = await generateNarrative(extracted.extracted, intelligence);

  return {
    success: true,
    extractedData: extracted.extracted,
    intelligence,
    validation,
    qualityMetrics: quality,
    summary: narrative,
    refinementIterations: iterations
  };
}
```

---

## Phase-by-Phase Integration

### Phase 1 → Phase 2: Extraction to Intelligence

**Integration Point:** `src/services/intelligenceHub.js:generateIntelligence()`

#### Input Contract (from Phase 1)

```javascript
{
  demographics: {
    name: string,
    age: number,
    sex: 'M' | 'F' | 'Other',
    mrn: string
  },
  dates: {
    admission: string (ISO 8601),
    discharge: string (ISO 8601),
    procedures: Array<{ name: string, date: string }>
  },
  pathology: {
    type: string,          // 'SAH', 'tumor', 'SDH', etc.
    subtype: string,
    location: string,
    details: object
  },
  procedures: Array<{
    name: string,
    date: string,
    indication: string,
    details: string
  }>,
  medications: {
    current: Array<{ name: string, dose: string, frequency: string }>,
    discontinued: Array<{ name: string, reason: string }>,
    anticoagulation: Array<string>
  },
  examinations: Array<{
    date: string,
    type: 'neurological' | 'physical',
    findings: object
  }>,
  complications: Array<{
    type: string,
    date: string,
    management: string
  }>,
  functionalScores: {
    kps: number,
    ecog: number,
    mRS: number,
    nihss: number,
    // ... other scores
  },
  functionalStatus: {
    scores: Array<{
      type: string,
      score: number,
      date: string,
      timestamp: number,
      context: string
    }>
  }
}
```

#### Output Contract (to Phase 2)

Phase 2 generates intelligence based on this structured data:

```javascript
{
  timeline: {
    events: Array<{
      date: string,
      timestamp: number,
      type: 'admission' | 'procedure' | 'complication' | 'discharge',
      category: string,
      description: string,
      relationships: Array<{ type: string, targetIndex: number }>
    }>,
    milestones: Array<{
      index: number,
      type: string,
      date: string,
      significance: string
    }>,
    duration: {
      total: number,      // Total hospital days
      preOperative: number,
      postOperative: number
    }
  },
  treatmentResponse: {
    pairs: Array<{
      intervention: { type: string, name: string, date: string },
      outcome: { type: string, description: string, date: string },
      effectiveness: number,  // 0-1 scale
      responseTime: number,   // days
      classification: 'excellent' | 'good' | 'poor'
    }>
  },
  functionalEvolution: {
    scoreTimeline: Array<{
      type: string,
      score: number,
      date: string,
      timestamp: number,
      normalized: number,    // 0-100 scale
      context: string
    }>,
    trajectory: {
      pattern: 'improving' | 'stable' | 'declining',
      trend: 'linear' | 'plateau' | 'accelerating',
      overallChange: number
    },
    statusChanges: Array<{
      type: string,
      from: { score: number, date: string },
      to: { score: number, date: string },
      delta: { score: number, days: number, direction: string },
      significance: 'major' | 'moderate' | 'minor'
    }>
  },
  prognosticFactors: {
    riskFactors: Array<string>,
    protectiveFactors: Array<string>,
    complications: Array<string>
  },
  metadata: {
    confidence: number,
    processingTime: number,
    version: string
  }
}
```

#### Integration Code Example

```javascript
// src/services/intelligenceHub.js
import { buildCausalTimeline } from '../utils/causalTimeline.js';
import { trackTreatmentResponse } from '../utils/treatmentResponse.js';
import { analyzeFunctionalEvolution } from '../utils/functionalEvolution.js';

export async function generateIntelligence(extractedData) {
  console.log('[IntelligenceHub] Generating clinical intelligence...');

  // Build timeline from extracted data
  const timeline = buildCausalTimeline(extractedData);

  // Track treatment-outcome relationships
  const treatmentResponse = trackTreatmentResponse(
    extractedData,
    timeline.events
  );

  // Analyze functional score evolution
  const functionalEvolution = analyzeFunctionalEvolution(extractedData);

  // Extract prognostic factors
  const prognosticFactors = extractPrognosticFactors(extractedData);

  return {
    timeline,
    treatmentResponse,
    functionalEvolution,
    prognosticFactors,
    metadata: {
      confidence: calculateConfidence(timeline, treatmentResponse),
      processingTime: Date.now() - startTime,
      version: '2.0'
    }
  };
}
```

---

### Phase 2 → Phase 3: Intelligence to Narrative

**Integration Point:** `src/services/narrativeEngine.js:generateNarrative()`

#### Input Contract (from Phase 1 + Phase 2)

```javascript
{
  // From Phase 1: Structured data (see above)
  extractedData: { /* ... */ },

  // From Phase 2: Intelligence insights
  intelligence: {
    timeline: { /* ... */ },
    treatmentResponse: { /* ... */ },
    functionalEvolution: { /* ... */ },
    prognosticFactors: { /* ... */ }
  }
}
```

#### Output Contract (Phase 3 Narrative)

```javascript
{
  chiefComplaint: string,
  historyOfPresentIllness: string,
  hospitalCourse: string,
  procedures: string,
  complications: string,
  consultations: string,
  dischargeStatus: string,
  dischargePlan: string,
  followUpPlan: string,

  metadata: {
    generatedAt: string,
    wordCount: number,
    processingTime: number,
    style: 'medical',
    qualityScore: number
  }
}
```

#### Integration Code Example

```javascript
// src/services/narrativeEngine.js
import { synthesizeNarrative } from '../utils/narrativeSynthesis.js';
import { applyMedicalWritingStyle } from '../utils/medicalWritingStyle.js';
import { generateTransitions } from '../utils/narrativeTransitions.js';

export async function generateNarrative(extractedData, intelligence, options = {}) {
  console.log('[NarrativeEngine] Generating medical narrative...');

  // Use intelligence to inform narrative generation
  const context = {
    timeline: intelligence?.timeline,
    treatmentEffectiveness: intelligence?.treatmentResponse?.pairs,
    functionalTrajectory: intelligence?.functionalEvolution?.trajectory
  };

  // Generate each section with context-awareness
  const sections = {
    chiefComplaint: await generateChiefComplaint(extractedData),
    historyOfPresentIllness: await generateHPI(extractedData, context),
    hospitalCourse: await generateHospitalCourse(extractedData, context),
    procedures: await generateProcedures(extractedData, context),
    complications: await generateComplications(extractedData, context),
    consultations: await generateConsultations(extractedData),
    dischargeStatus: await generateDischargeStatus(extractedData, context),
    dischargePlan: await generateDischargePlan(extractedData),
    followUpPlan: await generateFollowUpPlan(extractedData)
  };

  // Apply medical writing style
  const styledSections = applyMedicalWritingStyle(sections);

  // Generate transitions between sections
  const narrativeWithTransitions = generateTransitions(styledSections, context);

  return {
    ...narrativeWithTransitions,
    metadata: {
      generatedAt: new Date().toISOString(),
      wordCount: calculateWordCount(narrativeWithTransitions),
      processingTime: Date.now() - startTime,
      style: 'medical',
      qualityScore: assessNarrativeQuality(narrativeWithTransitions)
    }
  };
}
```

---

### Validation Integration

**Integration Point:** Between all phases (Quality Gates)

#### Validation Service

```javascript
// src/services/validation.js
export function validateExtraction(extractedData, requirements = {}) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!extractedData.demographics?.age) {
    errors.push({ field: 'demographics.age', message: 'Age is required' });
  }

  if (!extractedData.pathology?.type) {
    errors.push({ field: 'pathology.type', message: 'Pathology type is required' });
  }

  // Check date consistency
  if (extractedData.dates?.admission && extractedData.dates?.discharge) {
    const admission = new Date(extractedData.dates.admission);
    const discharge = new Date(extractedData.dates.discharge);

    if (discharge < admission) {
      errors.push({
        field: 'dates',
        message: 'Discharge date cannot be before admission date'
      });
    }
  }

  // Check completeness
  const completeness = calculateCompleteness(extractedData);
  if (completeness < 0.7) {
    warnings.push({
      field: 'overall',
      message: `Data completeness is ${(completeness * 100).toFixed(0)}%, expected 70%+`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completeness,
    timestamp: new Date().toISOString()
  };
}
```

#### Quality Metrics Service

```javascript
// src/services/qualityMetrics.js
export function calculateQualityMetrics(extractedData, validation, narrative) {
  // Extraction quality (0-1)
  const extractionScore = calculateExtractionScore(extractedData);

  // Validation quality (0-1)
  const validationScore = validation.isValid ? 1.0 :
    (1.0 - (validation.errors.length * 0.2));

  // Narrative quality (0-1)
  const narrativeScore = narrative ?
    assessNarrativeQuality(narrative) : 0;

  // Overall quality (weighted average)
  const overall = (
    extractionScore * 0.4 +
    validationScore * 0.3 +
    narrativeScore * 0.3
  );

  return {
    overall,
    extraction: extractionScore,
    validation: validationScore,
    summary: narrativeScore,
    breakdown: {
      completeness: validation.completeness,
      accuracy: calculateAccuracy(extractedData),
      coherence: narrative ? assessCoherence(narrative) : 0
    },
    timestamp: new Date().toISOString()
  };
}
```

---

## Data Contracts

### Standard Data Types

#### Date Format
All dates must be in **ISO 8601 format**:
```javascript
"2025-01-15T10:30:00.000Z"
```

If only date is available (no time):
```javascript
"2025-01-15"
```

#### Confidence Scores
All confidence scores are **0-1 scale**:
```javascript
{
  confidence: 0.85  // 85% confidence
}
```

#### Pathology Types
Standardized pathology type strings:
```javascript
'SAH'               // Subarachnoid Hemorrhage
'tumor'             // Brain Tumor
'glioblastoma'      // Glioblastoma
'meningioma'        // Meningioma
'SDH'               // Subdural Hematoma
'hydrocephalus'     // Hydrocephalus
'spine'             // Spinal Pathology
'trauma'            // Traumatic Brain Injury
```

#### Score Types
Standardized functional score types:
```javascript
'kps'      // Karnofsky Performance Status (0-100)
'ecog'     // ECOG Performance Status (0-5)
'mRS'      // Modified Rankin Scale (0-6)
'nihss'    // NIH Stroke Scale (0-42)
'gcs'      // Glasgow Coma Scale (3-15)
'asia'     // ASIA Impairment Scale (A-E)
'barthel'  // Barthel Index (0-100)
```

---

## Integration Patterns

### Pattern 1: Sequential Pipeline

**Use Case:** Standard workflow where each phase depends on previous phase output

```javascript
// Phase 1
const extracted = await extractMedicalEntities(notes);

// Phase 2 (depends on Phase 1)
const intelligence = await generateIntelligence(extracted.extracted);

// Phase 3 (depends on Phase 1 + Phase 2)
const narrative = await generateNarrative(extracted.extracted, intelligence);
```

### Pattern 2: Parallel Processing with Merge

**Use Case:** When Phase 2 sub-components can run in parallel

```javascript
// Phase 1
const extracted = await extractMedicalEntities(notes);

// Phase 2: Parallel intelligence generation
const [timeline, treatmentResponse, functionalEvolution] = await Promise.all([
  buildCausalTimeline(extracted.extracted),
  trackTreatmentResponse(extracted.extracted),
  analyzeFunctionalEvolution(extracted.extracted)
]);

// Merge intelligence
const intelligence = {
  timeline,
  treatmentResponse,
  functionalEvolution
};

// Phase 3
const narrative = await generateNarrative(extracted.extracted, intelligence);
```

### Pattern 3: Iterative Refinement

**Use Case:** Quality-driven re-processing

```javascript
let iterations = 0;
let quality = 0;

while (quality < qualityThreshold && iterations < maxIterations) {
  // Phase 1: Extract (with learned patterns from previous iteration)
  const extracted = await extractMedicalEntities(notes);

  // Validate
  const validation = validateExtraction(extracted.extracted);
  quality = calculateQualityMetrics(extracted.extracted, validation).overall;

  if (quality < qualityThreshold) {
    // Learn from validation errors
    await learningEngine.learnFromValidation(validation);
    iterations++;
  }
}

// Continue to Phase 2 & 3 once quality is acceptable
```

### Pattern 4: Pre-Extracted Data (User Corrections)

**Use Case:** User has already corrected extraction data in UI

```javascript
// User provides corrected data
const options = {
  extractedData: userCorrectedData  // Skip Phase 1
};

// Skip Phase 1, go directly to Phase 2
const intelligence = await generateIntelligence(userCorrectedData);

// Phase 3
const narrative = await generateNarrative(userCorrectedData, intelligence);
```

---

## Code Examples

### Example 1: Complete Integration

```javascript
// Complete discharge summary generation
import { orchestrateSummaryGeneration } from './services/summaryOrchestrator.js';

const notes = [
  { type: 'admission', content: '...' },
  { type: 'progress', content: '...' },
  { type: 'discharge', content: '...' }
];

const result = await orchestrateSummaryGeneration(notes, {
  enableLearning: true,
  enableFeedbackLoops: true,
  maxRefinementIterations: 2,
  qualityThreshold: 0.7
});

console.log('Summary generated:', result.summary);
console.log('Quality:', result.qualityMetrics.overall);
console.log('Refinement iterations:', result.refinementIterations);
```

### Example 2: Manual Phase-by-Phase

```javascript
import { extractMedicalEntities } from './services/extraction.js';
import { generateIntelligence } from './services/intelligenceHub.js';
import { validateExtraction } from './services/validation.js';
import { generateNarrative } from './services/narrativeEngine.js';
import { calculateQualityMetrics } from './services/qualityMetrics.js';

// Phase 1: Extraction
const extractionResult = await extractMedicalEntities(notes);
console.log('Extracted data:', extractionResult.extracted);

// Phase 2: Intelligence
const intelligence = await generateIntelligence(extractionResult.extracted);
console.log('Timeline events:', intelligence.timeline.events.length);

// Validation
const validation = validateExtraction(extractionResult.extracted);
console.log('Validation errors:', validation.errors.length);

// Phase 3: Narrative
const narrative = await generateNarrative(
  extractionResult.extracted,
  intelligence
);
console.log('Narrative sections:', Object.keys(narrative));

// Quality Assessment
const quality = calculateQualityMetrics(
  extractionResult.extracted,
  validation,
  narrative
);
console.log('Overall quality:', quality.overall);
```

### Example 3: Custom Integration with Feedback

```javascript
async function generateSummaryWithFeedback(notes) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    // Phase 1: Extract
    const extracted = await extractMedicalEntities(notes);

    // Phase 2: Intelligence
    const intelligence = await generateIntelligence(extracted.extracted);

    // Validation
    const validation = validateExtraction(extracted.extracted);

    // Quality check
    const quality = calculateQualityMetrics(extracted.extracted, validation);

    if (quality.overall >= 0.75) {
      // Quality acceptable, generate narrative
      const narrative = await generateNarrative(extracted.extracted, intelligence);

      return {
        success: true,
        extractedData: extracted.extracted,
        intelligence,
        validation,
        qualityMetrics: quality,
        summary: narrative,
        attempts
      };
    }

    // Quality not acceptable, learn and retry
    console.log(`Attempt ${attempts + 1}: Quality ${quality.overall}, retrying...`);
    await learnFromErrors(validation);
    attempts++;
  }

  // Max attempts reached
  throw new Error(`Failed to generate summary after ${maxAttempts} attempts`);
}
```

---

## Error Handling

### Error Propagation

Each phase should catch errors and return structured error objects:

```javascript
{
  success: false,
  error: {
    phase: 'extraction' | 'intelligence' | 'narrative',
    type: 'validation_error' | 'llm_error' | 'timeout',
    message: string,
    details: object,
    timestamp: string
  }
}
```

### Phase-Specific Error Handling

#### Phase 1 Extraction Errors

```javascript
try {
  const extracted = await extractMedicalEntities(notes);
} catch (error) {
  if (error.code === 'LLM_TIMEOUT') {
    // Retry with fallback provider
    return await extractWithFallback(notes);
  }

  if (error.code === 'INVALID_INPUT') {
    return {
      success: false,
      error: {
        phase: 'extraction',
        type: 'validation_error',
        message: 'Invalid input format',
        details: error.details
      }
    };
  }
}
```

#### Phase 2 Intelligence Errors

```javascript
try {
  const intelligence = await generateIntelligence(extractedData);
} catch (error) {
  // Intelligence generation is optional, degrade gracefully
  console.warn('[Intelligence] Failed to generate intelligence:', error);

  return {
    timeline: { events: [], milestones: [] },
    treatmentResponse: { pairs: [] },
    functionalEvolution: { scoreTimeline: [] },
    error: error.message
  };
}
```

#### Phase 3 Narrative Errors

```javascript
try {
  const narrative = await generateNarrative(extractedData, intelligence);
} catch (error) {
  if (error.code === 'INSUFFICIENT_DATA') {
    // Generate minimal narrative with available data
    return await generateMinimalNarrative(extractedData);
  }

  throw error; // Critical error, cannot generate summary
}
```

---

## Testing Integration

### Integration Test Example

```javascript
// docs/test-integration.js
import { orchestrateSummaryGeneration } from '../src/services/summaryOrchestrator.js';

const testNotes = `
DISCHARGE SUMMARY

PATIENT: John Doe
AGE: 55
ADMISSION DATE: January 10, 2025
DISCHARGE DATE: January 15, 2025

CHIEF COMPLAINT: Headache

...
`;

async function testIntegration() {
  console.log('Testing Phase Integration...\n');

  const result = await orchestrateSummaryGeneration(testNotes);

  // Test Phase 1 → Phase 2 integration
  console.assert(
    result.extractedData.demographics,
    'Phase 1 should extract demographics'
  );
  console.assert(
    result.intelligence.timeline,
    'Phase 2 should use Phase 1 data to build timeline'
  );

  // Test Phase 2 → Phase 3 integration
  console.assert(
    result.summary.hospitalCourse,
    'Phase 3 should generate hospital course'
  );
  console.assert(
    result.summary.hospitalCourse.includes('day'),
    'Phase 3 should use timeline from Phase 2'
  );

  // Test validation integration
  console.assert(
    result.validation,
    'Validation should be performed'
  );
  console.assert(
    result.qualityMetrics.overall >= 0,
    'Quality metrics should be calculated'
  );

  console.log('✓ All integration tests passed');
}

testIntegration();
```

---

## Best Practices

### 1. Always Validate Data Between Phases

```javascript
// Good: Validate before passing to next phase
const extracted = await extractMedicalEntities(notes);
const validation = validateExtraction(extracted.extracted);

if (!validation.isValid) {
  console.warn('Validation failed:', validation.errors);
  // Handle errors before continuing
}

const intelligence = await generateIntelligence(extracted.extracted);
```

### 2. Use Defensive Checks

```javascript
// Good: Check for data existence
const timeline = intelligence?.timeline?.events || [];
const procedures = extractedData?.procedures || [];

// Bad: Assume data exists
const timeline = intelligence.timeline.events;  // May throw if undefined
```

### 3. Preserve Context Across Phases

```javascript
// Good: Pass context through phases
const context = {
  patientId: extractedData.demographics.mrn,
  pathology: extractedData.pathology.type,
  admissionDate: extractedData.dates.admission
};

const narrative = await generateNarrative(extractedData, intelligence, context);
```

### 4. Handle Partial Data Gracefully

```javascript
// Good: Degrade gracefully
function generateHospitalCourse(extractedData, intelligence) {
  if (!intelligence?.timeline?.events) {
    // Generate basic hospital course without timeline
    return generateBasicHospitalCourse(extractedData);
  }

  // Generate enhanced hospital course with timeline
  return generateTimelineBasedHospitalCourse(extractedData, intelligence.timeline);
}
```

### 5. Log Integration Points

```javascript
// Good: Log data flow
console.log('[Phase 1→2] Passing extracted data to intelligence hub');
console.log('[Phase 1→2] Demographics:', extractedData.demographics);
console.log('[Phase 1→2] Procedures:', extractedData.procedures.length);

const intelligence = await generateIntelligence(extractedData);

console.log('[Phase 2→3] Intelligence generated:', Object.keys(intelligence));
```

---

## Troubleshooting

### Issue 1: Phase 2 Receives Invalid Data from Phase 1

**Symptom:** Intelligence generation fails with "Cannot read property of undefined"

**Diagnosis:**
```javascript
console.log('Extracted data:', JSON.stringify(extractedData, null, 2));
```

**Common Causes:**
- Extraction returned null/undefined fields
- Field names don't match expected contract
- Date format is invalid

**Solution:**
```javascript
// Add validation before Phase 2
const validation = validateExtraction(extractedData);
if (!validation.isValid) {
  console.error('Phase 1 data invalid:', validation.errors);
  // Fix extraction or handle gracefully
}
```

---

### Issue 2: Narrative Generation Missing Timeline Context

**Symptom:** Hospital course narrative lacks chronological flow

**Diagnosis:**
```javascript
console.log('Intelligence timeline:', intelligence?.timeline);
console.log('Timeline events:', intelligence?.timeline?.events?.length);
```

**Common Causes:**
- Intelligence generation failed silently
- Timeline events array is empty
- Narrative generator not using timeline

**Solution:**
```javascript
// Ensure intelligence is passed to narrative generator
const narrative = await generateNarrative(
  extractedData,
  intelligence  // Must include timeline
);

// In narrativeEngine.js, use timeline
const timeline = intelligence?.timeline?.events || [];
if (timeline.length > 0) {
  // Generate timeline-based narrative
}
```

---

### Issue 3: Quality Metrics Always Low

**Symptom:** Quality score consistently below threshold

**Diagnosis:**
```javascript
const quality = calculateQualityMetrics(extractedData, validation, narrative);
console.log('Quality breakdown:', quality.breakdown);
```

**Common Causes:**
- Required fields missing (completeness issue)
- Validation errors not addressed
- Narrative quality assessment too strict

**Solution:**
```javascript
// Improve extraction completeness
if (quality.breakdown.completeness < 0.7) {
  console.log('Missing fields:', validation.warnings);
  // Re-run extraction with more context
}

// Fix validation errors
if (validation.errors.length > 0) {
  console.log('Validation errors:', validation.errors);
  // Correct extraction issues
}
```

---

### Issue 4: Refinement Loop Doesn't Improve Quality

**Symptom:** Multiple iterations but no quality improvement

**Diagnosis:**
```javascript
console.log('Iteration', iteration, 'Quality:', quality.overall);
console.log('Learning enabled:', options.enableLearning);
console.log('Patterns learned:', learningEngine.getPatternCount());
```

**Common Causes:**
- Learning disabled
- No patterns learned from validation errors
- Maximum iterations too low

**Solution:**
```javascript
// Enable learning
const options = {
  enableLearning: true,
  enableFeedbackLoops: true,
  maxRefinementIterations: 3  // Increase if needed
};

// Verify learning is working
if (iteration > 0 && quality.overall === previousQuality) {
  console.warn('No quality improvement after learning');
  // Check learning engine logs
}
```

---

## Summary

This guide provides comprehensive information on how the DCS phases integrate:

1. **Phase 1 (Extraction)** produces structured medical data
2. **Phase 2 (Intelligence)** generates clinical insights from structured data
3. **Validation** ensures data quality between phases
4. **Phase 3 (Narrative)** synthesizes narrative from structured data + intelligence
5. **Phase 4 (Orchestration)** coordinates all phases with quality-driven refinement

**Key Takeaways:**
- Each phase has clear input/output contracts
- Validation gates ensure data integrity
- Defensive programming handles missing data gracefully
- Iterative refinement improves quality through learning
- Proper error handling prevents cascading failures

For architecture overview, see [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Document Maintained By:** DCS Development Team
**Next Review:** January 2026
