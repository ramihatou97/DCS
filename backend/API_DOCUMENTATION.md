# Digital Clinical Scribe - Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001`  
**Last Updated:** 2025-10-18

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Extract Medical Entities](#extract-medical-entities)
   - [Generate Narrative](#generate-narrative)
   - [Generate Summary](#generate-summary)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Features](#features)
7. [Usage Examples](#usage-examples)

---

## Overview

The Digital Clinical Scribe Backend API provides endpoints for extracting medical entities from clinical notes, generating clinical narratives, and creating discharge summaries. The API uses advanced NLP techniques, temporal extraction, and LLM-enhanced processing to deliver high-quality medical data extraction.

**Key Features:**
- Medical entity extraction (procedures, complications, medications, demographics)
- Temporal context detection (POD resolution, reference vs. new event detection)
- Source quality assessment
- LLM-enhanced extraction with pattern-based fallback
- Semantic deduplication
- Clinical narrative generation
- Discharge summary generation

---

## Authentication

**API Keys Required:**
- Anthropic API Key (for Claude)
- OpenAI API Key (for GPT models)
- Google API Key (for Gemini)

**Configuration:**
All API keys must be stored in `backend/.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
```

**Security:**
- All API keys are stored server-side only
- No client-side API key exposure
- All LLM calls are proxied through the backend

---

## Endpoints

### Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the API server is running and API keys are configured.

**Request:** No parameters required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T12:00:00.000Z",
  "apiKeys": {
    "anthropic": true,
    "openai": true,
    "google": true
  }
}
```

**Status Codes:**
- `200 OK` - Server is healthy
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl http://localhost:3001/api/health
```

---

### Extract Medical Entities

**Endpoint:** `POST /api/extract`

**Description:** Extract medical entities from clinical notes including procedures, complications, medications, demographics, and temporal context.

**Request Body:**
```json
{
  "notes": "string (required) - Clinical notes text",
  "method": "string (optional) - 'pattern' or 'llm' or 'hybrid' (default: 'hybrid')"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extracted": {
      "procedures": {
        "procedures": [
          {
            "name": "Craniotomy",
            "date": "2025-10-15",
            "details": "Tumor resection",
            "confidence": 0.95,
            "temporalContext": {
              "date": "2025-10-15",
              "isReference": false,
              "timing": "past"
            }
          }
        ],
        "count": 1
      },
      "complications": {
        "complications": [
          {
            "name": "Vasospasm",
            "severity": "moderate",
            "date": "2025-10-18",
            "confidence": 0.90,
            "temporalContext": {
              "date": "2025-10-18",
              "isReference": false,
              "referenceType": "POD#3"
            }
          }
        ],
        "count": 1
      },
      "medications": {
        "medications": [
          {
            "name": "Nimodipine",
            "dose": "60mg",
            "frequency": "q4h",
            "route": "PO",
            "confidence": 0.92
          }
        ],
        "count": 1
      },
      "demographics": {
        "age": 65,
        "gender": "male",
        "mrn": "12345678"
      },
      "dates": {
        "admission": "2025-10-15",
        "discharge": "2025-10-20",
        "surgery": ["2025-10-15"]
      }
    },
    "confidence": {
      "overall": 0.92,
      "procedures": 0.95,
      "complications": 0.90,
      "medications": 0.92
    },
    "pathologyTypes": ["SAH"],
    "metadata": {
      "noteCount": 1,
      "totalLength": 150,
      "extractionDate": "2025-10-18T12:00:00.000Z",
      "sourceQuality": {
        "grade": "GOOD",
        "score": 0.75,
        "factors": {
          "structure": 0.8,
          "completeness": 0.7,
          "formality": 0.8,
          "detail": 0.7,
          "consistency": 0.75
        }
      }
    }
  }
}
```

**Status Codes:**
- `200 OK` - Extraction successful
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Extraction failed

**Example:**
```bash
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Patient admitted with SAH. Underwent coiling on 10/15/2025. Developed vasospasm on POD#3. Currently on nimodipine.",
    "method": "pattern"
  }'
```

---

### Generate Narrative

**Endpoint:** `POST /api/narrative`

**Description:** Generate a clinical narrative from extracted medical data.

**Request Body:**
```json
{
  "extractedData": {
    "procedures": { "procedures": [...] },
    "complications": { "complications": [...] },
    "medications": { "medications": [...] },
    "demographics": {...},
    "dates": {...}
  },
  "options": {
    "style": "formal",
    "includeTimeline": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "narrative": "The patient, a 65-year-old male, was admitted on 10/15/2025 with subarachnoid hemorrhage...",
  "sections": {
    "introduction": "...",
    "hospitalCourse": "...",
    "complications": "...",
    "medications": "..."
  }
}
```

**Status Codes:**
- `200 OK` - Narrative generated
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Generation failed

**Example:**
```bash
curl -X POST http://localhost:3001/api/narrative \
  -H "Content-Type: application/json" \
  -d @extracted_data.json
```

---

### Generate Summary

**Endpoint:** `POST /api/summary`

**Description:** Generate a discharge summary from clinical notes (combines extraction and narrative generation).

**Request Body:**
```json
{
  "notes": "string (required) - Clinical notes text",
  "options": {
    "style": "formal",
    "includeTimeline": true,
    "method": "hybrid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "summary": "DISCHARGE SUMMARY\n\nPatient: 65-year-old male\nAdmission Date: 10/15/2025...",
  "extracted": {
    "procedures": {...},
    "complications": {...},
    "medications": {...}
  }
}
```

**Status Codes:**
- `200 OK` - Summary generated
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Generation failed

**Example:**
```bash
curl -X POST http://localhost:3001/api/summary \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Patient admitted with SAH. Underwent coiling on 10/15/2025. Developed vasospasm on POD#3. Currently on nimodipine. Discharge: 10/20/2025 to home.",
    "options": {
      "style": "formal",
      "includeTimeline": true
    }
  }'
```

---

## Data Models

### Procedure
```typescript
{
  name: string;
  date?: string;
  details?: string;
  confidence: number;
  temporalContext?: TemporalContext;
}
```

### Complication
```typescript
{
  name: string;
  severity?: string;
  date?: string;
  confidence: number;
  temporalContext?: TemporalContext;
}
```

### Medication
```typescript
{
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  confidence: number;
}
```

### TemporalContext
```typescript
{
  date?: string;
  isReference: boolean;
  referenceType?: string; // e.g., "POD#3", "s/p"
  timing?: string; // "past", "present", "future"
}
```

### SourceQuality
```typescript
{
  grade: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "VERY_POOR";
  overallScore: number; // 0-1
  factors: {
    structure: number;
    completeness: number;
    formality: number;
    detail: number;
    consistency: number;
  };
  issues: Array<{
    factor: string;
    score: number;
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
  }>;
  strengths: string[];
}
```

---

## Error Handling

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common Error Codes:**
- `400 Bad Request` - Invalid input (missing notes, invalid method)
- `500 Internal Server Error` - Server error (extraction failed, LLM error)

---

## Features

### Temporal Extraction

**POD (Post-Operative Day) Resolution:**
- Detects POD references (e.g., "POD#3")
- Resolves to actual dates based on surgery date
- Example: "POD#3" with surgery on 10/15 → 10/18

**Reference Detection:**
- Identifies references to past events (e.g., "s/p craniotomy")
- Distinguishes from new events
- Links references to actual events

**Supported Temporal Patterns:**
- POD#X, POD X, post-op day X
- s/p (status post)
- "previously", "history of"
- Absolute dates (10/15/2025, 2025-10-15)
- Relative dates (yesterday, 3 days ago)

### Source Quality Assessment

**Quality Factors:**
1. **Structure** - Presence of sections, headers, organization
2. **Completeness** - Coverage of key clinical elements
3. **Formality** - Professional medical terminology
4. **Detail** - Specificity and measurements
5. **Consistency** - Logical flow and coherence

**Quality Grades:**
- EXCELLENT (≥90%) - Comprehensive, well-structured notes
- GOOD (≥75%) - Solid documentation with minor gaps
- FAIR (≥60%) - Adequate but missing some details
- POOR (≥40%) - Significant gaps in documentation
- VERY_POOR (<40%) - Minimal or fragmented information

### Semantic Deduplication

- Merges semantically similar entities
- Example: "vasospasm" = "cerebral vasospasm"
- Preserves most detailed version
- Tracks merge statistics

---

## Usage Examples

### Complete Workflow Example

```bash
# 1. Check server health
curl http://localhost:3001/api/health

# 2. Extract entities
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "65yo M admitted 10/15 with SAH. Underwent coiling same day. POD#3 developed vasospasm, started on nimodipine 60mg q4h. Discharged 10/20 to home.",
    "method": "pattern"
  }' > extracted.json

# 3. Generate narrative
curl -X POST http://localhost:3001/api/narrative \
  -H "Content-Type: application/json" \
  -d @extracted.json > narrative.json

# 4. Or generate complete summary in one step
curl -X POST http://localhost:3001/api/summary \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "65yo M admitted 10/15 with SAH. Underwent coiling same day. POD#3 developed vasospasm, started on nimodipine 60mg q4h. Discharged 10/20 to home."
  }' > summary.json
```

---

## Notes

- All dates are in ISO 8601 format (YYYY-MM-DD)
- Confidence scores range from 0 to 1
- LLM extraction falls back to pattern-based if it fails
- Source quality affects confidence score calibration
- Temporal context is automatically detected for all entities

---

**For support or questions, please refer to the project documentation or contact the development team.**

