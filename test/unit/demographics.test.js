/**
 * Unit Tests for Phase 0 Demographics Extraction Enhancement
 *
 * Tests the extraction of:
 * - MRN (Medical Record Number)
 * - Patient Name
 * - Date of Birth
 * - Attending Physician
 *
 * @module test/unit/demographics
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { extractMedicalEntities } from '../../src/services/extraction.js';

// Mock data for testing
const TEST_CASES = {
  robertChen: {
    text: `Patient: Robert Chen, 67M
MRN: 45678912
DOB: 03/15/1958
Admission Date: 09/20/2025
Attending: Dr. Patterson

HISTORY OF PRESENT ILLNESS:
Mr. Chen is a 67-year-old male who presented with acute onset of neck pain following a fall from a ladder.`,
    expected: {
      name: 'Robert Chen',
      mrn: '45678912',
      dob: '1958-03-15',
      age: 67,
      gender: 'M',
      attendingPhysician: 'Dr. Patterson'
    }
  },

  janeDoe: {
    text: `Name: Jane Doe
Medical Record Number: 12345678
Date of Birth: 07/22/1979
Age: 45
Gender: Female
Service of Dr. Smith

Patient is a 45-year-old female with sudden onset severe headache.`,
    expected: {
      name: 'Jane Doe',
      mrn: '12345678',
      dob: '1979-07-22',
      age: 45,
      gender: 'F',
      attendingPhysician: 'Dr. Smith'
    }
  },

  johnSmith: {
    text: `John Smith, 55M, presented to the emergency department
MR# 87654321
Born: January 10, 1970
Under the care of Dr. Johnson

Chief complaint: Severe back pain after motor vehicle accident.`,
    expected: {
      name: 'John Smith',
      mrn: '87654321',
      dob: '1970-01-10',
      age: 55,
      gender: 'M',
      attendingPhysician: 'Dr. Johnson'
    }
  },

  partialData: {
    text: `Patient: Sarah Johnson, 32F
Admission: 01/15/2024

32-year-old female with history of migraines presents with worst headache of her life.`,
    expected: {
      name: 'Sarah Johnson',
      mrn: null,
      dob: null,
      age: 32,
      gender: 'F',
      attendingPhysician: null
    }
  },

  invalidMRN: {
    text: `Admission: 01152024
MRN: 45678912
Patient: Test Patient, 50M`,
    expected: {
      name: 'Test Patient',
      mrn: '45678912', // Should NOT extract 01152024 as MRN
      age: 50,
      gender: 'M'
    }
  }
};

describe('Phase 0: Demographics Extraction Enhancement', () => {

  describe('MRN Extraction', () => {

    it('should extract MRN from "MRN: XXXXXXXX" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: false, // Test pattern extraction only
        includeConfidence: true
      });

      expect(result.extracted.demographics.mrn).toBe(TEST_CASES.robertChen.expected.mrn);
    });

    it('should extract MRN from "Medical Record Number:" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.janeDoe.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.mrn).toBe(TEST_CASES.janeDoe.expected.mrn);
    });

    it('should extract MRN from "MR#" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.johnSmith.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.mrn).toBe(TEST_CASES.johnSmith.expected.mrn);
    });

    it('should NOT extract dates as MRN', async () => {
      const result = await extractMedicalEntities(TEST_CASES.invalidMRN.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.mrn).toBe(TEST_CASES.invalidMRN.expected.mrn);
      expect(result.extracted.demographics.mrn).not.toBe('01152024');
    });

    it('should return null when MRN is missing', async () => {
      const result = await extractMedicalEntities(TEST_CASES.partialData.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.mrn).toBeNull();
    });
  });

  describe('Name Extraction', () => {

    it('should extract name from "Patient: FirstName LastName" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.name).toBe(TEST_CASES.robertChen.expected.name);
    });

    it('should extract name from "Name:" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.janeDoe.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.name).toBe(TEST_CASES.janeDoe.expected.name);
    });

    it('should extract name from "FirstName LastName, Age/Gender" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.johnSmith.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.name).toBe(TEST_CASES.johnSmith.expected.name);
    });

    it('should handle three-word names', async () => {
      const text = `Patient: Mary Jane Watson, 28F
MRN: 11111111`;

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      expect(result.extracted.demographics.name).toBe('Mary Jane Watson');
    });

    it('should NOT extract medical terms as names', async () => {
      const text = `Patient Male, 45 years old
MRN: 22222222`;

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      // Should not extract "Patient Male" as a name
      expect(result.extracted.demographics.name).not.toBe('Patient Male');
    });
  });

  describe('DOB Extraction', () => {

    it('should extract DOB from "DOB: MM/DD/YYYY" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.dob).toBe(TEST_CASES.robertChen.expected.dob);
    });

    it('should extract DOB from "Date of Birth:" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.janeDoe.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.dob).toBe(TEST_CASES.janeDoe.expected.dob);
    });

    it('should extract DOB from "Born:" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.johnSmith.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.dob).toBe(TEST_CASES.johnSmith.expected.dob);
    });

    it('should normalize date formats to YYYY-MM-DD', async () => {
      const text = `Patient: Test Person
DOB: 12/25/1980`;

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      expect(result.extracted.demographics.dob).toBe('1980-12-25');
    });

    it('should NOT extract future dates as DOB', async () => {
      const text = `Patient: Future Person
DOB: 01/01/2030`;

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      expect(result.extracted.demographics.dob).toBeNull();
    });

    it('should NOT extract unreasonable ages', async () => {
      const text = `Patient: Ancient Person
DOB: 01/01/1800`;  // Would be 224+ years old

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      expect(result.extracted.demographics.dob).toBeNull();
    });
  });

  describe('Attending Physician Extraction', () => {

    it('should extract attending from "Attending: Dr. LastName" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.attendingPhysician).toBe(TEST_CASES.robertChen.expected.attendingPhysician);
    });

    it('should extract attending from "Service of Dr. LastName" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.janeDoe.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.attendingPhysician).toBe(TEST_CASES.janeDoe.expected.attendingPhysician);
    });

    it('should extract attending from "Under the care of Dr. LastName" format', async () => {
      const result = await extractMedicalEntities(TEST_CASES.johnSmith.text, {
        useLLM: false
      });

      expect(result.extracted.demographics.attendingPhysician).toBe(TEST_CASES.johnSmith.expected.attendingPhysician);
    });

    it('should handle first + last name physicians', async () => {
      const text = `Patient: Test Patient
Attending Physician: Dr. Sarah Johnson`;

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      expect(result.extracted.demographics.attendingPhysician).toBe('Dr. Sarah Johnson');
    });

    it('should NOT extract invalid physician names', async () => {
      const text = `Attending: Patient Smith`;  // "Patient" is not a valid name

      const result = await extractMedicalEntities(text, {
        useLLM: false
      });

      expect(result.extracted.demographics.attendingPhysician).toBeNull();
    });
  });

  describe('Integration - All Demographics Fields', () => {

    it('should extract all demographics from Robert Chen case', async () => {
      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: false,
        includeConfidence: true
      });

      const demographics = result.extracted.demographics;

      expect(demographics.name).toBe(TEST_CASES.robertChen.expected.name);
      expect(demographics.mrn).toBe(TEST_CASES.robertChen.expected.mrn);
      expect(demographics.dob).toBe(TEST_CASES.robertChen.expected.dob);
      expect(demographics.age).toBe(TEST_CASES.robertChen.expected.age);
      expect(demographics.gender).toBe(TEST_CASES.robertChen.expected.gender);
      expect(demographics.attendingPhysician).toBe(TEST_CASES.robertChen.expected.attendingPhysician);

      // Should have high confidence for complete data
      expect(result.confidence.demographics).toBeGreaterThanOrEqual(0.8);
    });

    it('should handle partial demographics gracefully', async () => {
      const result = await extractMedicalEntities(TEST_CASES.partialData.text, {
        useLLM: false
      });

      const demographics = result.extracted.demographics;

      expect(demographics.name).toBe(TEST_CASES.partialData.expected.name);
      expect(demographics.mrn).toBeNull();
      expect(demographics.dob).toBeNull();
      expect(demographics.age).toBe(TEST_CASES.partialData.expected.age);
      expect(demographics.gender).toBe(TEST_CASES.partialData.expected.gender);
      expect(demographics.attendingPhysician).toBeNull();
    });

    it('should extract demographics with LLM enabled', async () => {
      // Skip if LLM not available
      const { isLLMAvailable } = await import('../../src/services/llmService.js');
      const llmAvailable = await isLLMAvailable();

      if (!llmAvailable) {
        console.log('Skipping LLM test - no LLM service available');
        return;
      }

      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: true,
        includeConfidence: true
      });

      const demographics = result.extracted.demographics;

      // LLM should extract all fields correctly
      expect(demographics.name).toBe(TEST_CASES.robertChen.expected.name);
      expect(demographics.mrn).toBe(TEST_CASES.robertChen.expected.mrn);
      expect(demographics.age).toBe(TEST_CASES.robertChen.expected.age);
      expect(demographics.gender).toBe(TEST_CASES.robertChen.expected.gender);
      expect(demographics.attendingPhysician).toBeTruthy(); // May include "Dr."
    }, 30000); // 30s timeout for LLM call
  });

  describe('Confidence Scoring', () => {

    it('should have high confidence for complete demographics', async () => {
      const result = await extractMedicalEntities(TEST_CASES.robertChen.text, {
        useLLM: false,
        includeConfidence: true
      });

      expect(result.confidence.demographics).toBeGreaterThanOrEqual(0.8);
    });

    it('should have lower confidence for partial demographics', async () => {
      const result = await extractMedicalEntities(TEST_CASES.partialData.text, {
        useLLM: false,
        includeConfidence: true
      });

      // Lower confidence due to missing MRN, DOB, attending
      expect(result.confidence.demographics).toBeLessThan(0.8);
    });
  });
});

// Export test data for use in other test files
export { TEST_CASES };