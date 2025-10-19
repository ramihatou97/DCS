/**
 * Context Provider Stub for Backend
 *
 * Provides minimal context building functionality for backend extraction
 * Full context provider is available in frontend
 */

const getContext = () => ({ context: {} });

const buildContext = (text) => {
  // Return minimal context structure
  return {
    pathology: {
      primary: 'unknown',
      confidence: 0
    },
    consultants: {
      count: 0,
      services: []
    },
    clinical: {
      complexity: 'medium'
    },
    text: text || ''
  };
};

module.exports = {
  getContext,
  buildContext
};
module.exports.default = {
  getContext,
  buildContext
};
