/**
 * Pathology Subtypes Detection - Backend Stub
 *
 * Returns a minimal subtype structure to prevent errors.
 * Full implementation can be ported from frontend if needed.
 */

const detectPathologySubtype = (text, pathologyType, extractedData = {}) => {
  // Return minimal structure that matches expected format
  return {
    type: pathologyType || 'UNKNOWN',
    details: {}, // Empty details object (prevents "Cannot convert undefined or null to object" error)
    riskLevel: 'MODERATE',
    prognosis: {},
    recommendations: {},
    complications: []
  };
};

module.exports = { detectPathologySubtype };
