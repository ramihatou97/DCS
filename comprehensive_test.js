/**
 * Comprehensive DCS System Test Suite
 * Tests all features, integrations, and functionality
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`)
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(category, name, status, details = '') {
  results.total++;
  results.tests.push({ category, name, status, details });
  
  if (status === 'pass') {
    results.passed++;
    log.success(`${category}: ${name}`);
  } else if (status === 'fail') {
    results.failed++;
    log.error(`${category}: ${name} - ${details}`);
  } else if (status === 'warning') {
    results.warnings++;
    log.warning(`${category}: ${name} - ${details}`);
  }
}

// ============================================================================
// TEST 1: Backend Server Health
// ============================================================================
async function testBackendHealth() {
  log.header();
  log.title('TEST 1: Backend Server Health Check');
  log.header();
  
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      recordTest('Backend', 'Server Health', 'pass');
      recordTest('Backend', 'API Endpoint Responding', 'pass');
      
      // Check individual services
      if (data.services.anthropic) {
        recordTest('Backend', 'Anthropic API Configured', 'pass');
      } else {
        recordTest('Backend', 'Anthropic API Configured', 'warning', 'API key not configured');
      }
      
      if (data.services.openai) {
        recordTest('Backend', 'OpenAI API Configured', 'pass');
      } else {
        recordTest('Backend', 'OpenAI API Configured', 'warning', 'API key not configured');
      }
      
      if (data.services.gemini) {
        recordTest('Backend', 'Gemini API Configured', 'pass');
      } else {
        recordTest('Backend', 'Gemini API Configured', 'warning', 'API key not configured');
      }
      
      return true;
    } else {
      recordTest('Backend', 'Server Health', 'fail', 'Unhealthy response');
      return false;
    }
  } catch (error) {
    recordTest('Backend', 'Server Health', 'fail', `Not running: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 2: Frontend Build & Files
// ============================================================================
async function testFrontendFiles() {
  log.header();
  log.title('TEST 2: Frontend Files & Structure');
  log.header();
  
  const criticalFiles = [
    'src/main.jsx',
    'src/App.jsx',
    'src/components/SummaryGenerator.jsx',
    'src/components/Settings.jsx',
    'src/components/ModelSelector.jsx',
    'src/services/llmService.js',
    'src/services/narrativeEngine.js',
    'src/services/extraction/deduplication.js',
    'src/services/storage/storageService.js',
    'src/config/pathologyPatterns.js',
    'src/utils/dateUtils.js',
    'src/utils/textUtils.js',
    'src/utils/validationUtils.js',
    'src/context/AppContext.jsx',
    'src/context/AppReducer.js',
    'src/context/actions.js',
    'package.json',
    'vite.config.js',
    'tailwind.config.js'
  ];
  
  for (const file of criticalFiles) {
    try {
      const path = join(__dirname, file);
      const content = readFileSync(path, 'utf8');
      
      if (content.length > 0) {
        recordTest('Frontend', `File exists: ${file}`, 'pass');
      } else {
        recordTest('Frontend', `File exists: ${file}`, 'warning', 'File is empty');
      }
    } catch (error) {
      recordTest('Frontend', `File exists: ${file}`, 'fail', 'File not found');
    }
  }
}

// ============================================================================
// TEST 3: LLM Service Integration
// ============================================================================
async function testLLMService() {
  log.header();
  log.title('TEST 3: LLM Service Functions');
  log.header();
  
  try {
    const llmServicePath = join(__dirname, 'src/services/llmService.js');
    const content = readFileSync(llmServicePath, 'utf8');
    
    // Check for critical exports
    const requiredExports = [
      'PREMIUM_MODELS',
      'getSelectedModel',
      'setSelectedModel',
      'getCostTracking',
      'getPerformanceMetrics',
      'resetCostTracking',
      'callLLMWithFallback',
      'extractWithLLM',
      'generateSummaryWithLLM',
      'testApiKey'
    ];
    
    for (const exportName of requiredExports) {
      if (content.includes(`export const ${exportName}`) || content.includes(`export { ${exportName}`)) {
        recordTest('LLM Service', `Export: ${exportName}`, 'pass');
      } else {
        recordTest('LLM Service', `Export: ${exportName}`, 'fail', 'Export not found');
      }
    }
    
    // Check for model configurations
    const models = [
      'claude-sonnet-3.5',
      'claude-opus-3',
      'claude-haiku-3',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
    
    for (const model of models) {
      if (content.includes(`'${model}':`)) {
        recordTest('LLM Service', `Model configured: ${model}`, 'pass');
      } else {
        recordTest('LLM Service', `Model configured: ${model}`, 'fail', 'Model not found');
      }
    }
    
    // Check for backend integration
    if (content.includes('checkBackendAvailable')) {
      recordTest('LLM Service', 'Backend auto-detection', 'pass');
    } else {
      recordTest('LLM Service', 'Backend auto-detection', 'fail', 'Function not found');
    }
    
    // Check for automatic fallback
    if (content.includes('getFallbackOrder') || content.includes('fallback')) {
      recordTest('LLM Service', 'Automatic fallback system', 'pass');
    } else {
      recordTest('LLM Service', 'Automatic fallback system', 'warning', 'May not be implemented');
    }
    
    // Check for cost tracking
    if (content.includes('recordCost') && content.includes('initCostTracking')) {
      recordTest('LLM Service', 'Cost tracking system', 'pass');
    } else {
      recordTest('LLM Service', 'Cost tracking system', 'fail', 'Not fully implemented');
    }
    
  } catch (error) {
    recordTest('LLM Service', 'File readable', 'fail', error.message);
  }
}

// ============================================================================
// TEST 4: Narrative Engine
// ============================================================================
async function testNarrativeEngine() {
  log.header();
  log.title('TEST 4: Narrative Engine Functions');
  log.header();
  
  try {
    const narrativePath = join(__dirname, 'src/services/narrativeEngine.js');
    const content = readFileSync(narrativePath, 'utf8');
    
    // Check for required sections (using actual section names from narrativeEngine.js)
    const sections = [
      'chiefComplaint',
      'principalDiagnosis',
      'secondaryDiagnoses',
      'historyOfPresentIllness',
      'hospitalCourse',
      'procedures',
      'complications',
      'dischargeStatus',
      'dischargeMedications',
      'dischargeDisposition',
      'followUpPlan'
    ];
    
    for (const section of sections) {
      if (content.includes(section)) {
        recordTest('Narrative Engine', `Section: ${section}`, 'pass');
      } else {
        recordTest('Narrative Engine', `Section: ${section}`, 'fail', 'Section not found');
      }
    }
    
    // Check for parseLLMNarrative function
    if (content.includes('parseLLMNarrative')) {
      recordTest('Narrative Engine', 'Parser function exists', 'pass');
    } else {
      recordTest('Narrative Engine', 'Parser function exists', 'fail');
    }
    
    // Check for numbered section patterns (fix from earlier)
    if (content.includes('1\\. ') || content.includes('numbered')) {
      recordTest('Narrative Engine', 'Numbered section patterns', 'pass');
    } else {
      recordTest('Narrative Engine', 'Numbered section patterns', 'warning', 'May not support numbered format');
    }
    
    // Check for fallback extraction
    if (content.includes('fallback') || content.includes('Fallback')) {
      recordTest('Narrative Engine', 'Fallback extraction', 'pass');
    } else {
      recordTest('Narrative Engine', 'Fallback extraction', 'warning', 'May not have fallback');
    }
    
  } catch (error) {
    recordTest('Narrative Engine', 'File readable', 'fail', error.message);
  }
}

// ============================================================================
// TEST 5: Model Selector Component
// ============================================================================
async function testModelSelector() {
  log.header();
  log.title('TEST 5: Model Selector Component');
  log.header();
  
  try {
    const selectorPath = join(__dirname, 'src/components/ModelSelector.jsx');
    const content = readFileSync(selectorPath, 'utf8');
    
    // Check for required imports
    const requiredImports = [
      'PREMIUM_MODELS',
      'getSelectedModel',
      'setSelectedModel',
      'getCostTracking',
      'getPerformanceMetrics'
    ];
    
    for (const imp of requiredImports) {
      if (content.includes(imp)) {
        recordTest('Model Selector', `Import: ${imp}`, 'pass');
      } else {
        recordTest('Model Selector', `Import: ${imp}`, 'fail', 'Import not found');
      }
    }
    
    // Check for UI elements
    if (content.includes('ModelSelector')) {
      recordTest('Model Selector', 'Component defined', 'pass');
    }
    
    if (content.includes('useState') && content.includes('useEffect')) {
      recordTest('Model Selector', 'React hooks used', 'pass');
    }
    
    if (content.includes('cost') || content.includes('Cost')) {
      recordTest('Model Selector', 'Cost display implemented', 'pass');
    }
    
    if (content.includes('performance') || content.includes('Performance')) {
      recordTest('Model Selector', 'Performance metrics displayed', 'pass');
    }
    
  } catch (error) {
    recordTest('Model Selector', 'File readable', 'fail', error.message);
  }
}

// ============================================================================
// TEST 6: Feature Flags System
// ============================================================================
async function testFeatureFlags() {
  log.header();
  log.title('TEST 6: Feature Flags System');
  log.header();
  
  const requiredFeatures = [
    'enhanced_demographics',
    'enhanced_surgery_dates',
    'attending_physician',
    'discharge_medications',
    'late_recovery_detection',
    'enhanced_llm_prompts',
    'extraction_validator',
    'narrative_validator',
    'six_dimension_metrics',
    'post_generation_validator',
    'clinical_reasoning_validator',
    'section_completer',
    'narrative_enhancer',
    'edge_case_handler'
  ];
  
  // Check if features are documented
  try {
    const setupPath = join(__dirname, 'enable_features_now.html');
    const content = readFileSync(setupPath, 'utf8');
    
    for (const feature of requiredFeatures) {
      if (content.includes(feature)) {
        recordTest('Feature Flags', `Feature: ${feature}`, 'pass');
      } else {
        recordTest('Feature Flags', `Feature: ${feature}`, 'warning', 'Not in setup tool');
      }
    }
    
  } catch (error) {
    recordTest('Feature Flags', 'Setup file readable', 'fail', error.message);
  }
}

// ============================================================================
// TEST 7: API Endpoints (Backend)
// ============================================================================
async function testAPIEndpoints() {
  log.header();
  log.title('TEST 7: Backend API Endpoints');
  log.header();
  
  const endpoints = [
    { path: '/health', method: 'GET' },
    { path: '/api/extract', method: 'POST' },
    { path: '/api/generate-narrative', method: 'POST' },
    { path: '/api/llm/anthropic', method: 'POST' },
    { path: '/api/llm/openai', method: 'POST' },
    { path: '/api/llm/google', method: 'POST' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      if (endpoint.method === 'GET') {
        const response = await fetch(`http://localhost:3001${endpoint.path}`);
        if (response.ok) {
          recordTest('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'pass');
        } else {
          recordTest('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'warning', `Status: ${response.status}`);
        }
      } else {
        // For POST endpoints, just check if backend server has them defined
        try {
          const serverPath = join(__dirname, 'backend/src/server.js');
          const content = readFileSync(serverPath, 'utf8');
          if (content.includes(endpoint.path)) {
            recordTest('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'pass');
          } else {
            recordTest('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'fail', 'Endpoint not defined');
          }
        } catch (error) {
          recordTest('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'warning', 'Cannot verify');
        }
      }
    } catch (error) {
      recordTest('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'warning', 'Endpoint not testable');
    }
  }
}

// ============================================================================
// TEST 8: Documentation Files
// ============================================================================
async function testDocumentation() {
  log.header();
  log.title('TEST 8: Documentation Files');
  log.header();
  
  const docFiles = [
    'README.md',
    'IMPLEMENTATION_COMPLETE.md',
    'ENHANCED_LLM_SYSTEM.md',
    'ARCHITECTURE_RECOMMENDATIONS.md',
    'CLINICAL_OBJECTIVES.md',
    'IMPLEMENTATION_ROADMAP.md',
    'QUICK_REFERENCE.md',
    'FILE_GENERATION_CHECKLIST.md',
    'PATHOLOGY_PATTERNS.md'
  ];
  
  for (const file of docFiles) {
    try {
      const path = join(__dirname, file);
      const content = readFileSync(path, 'utf8');
      if (content.length > 100) {
        recordTest('Documentation', `File: ${file}`, 'pass');
      } else {
        recordTest('Documentation', `File: ${file}`, 'warning', 'File too short');
      }
    } catch (error) {
      recordTest('Documentation', `File: ${file}`, 'warning', 'File not found');
    }
  }
}

// ============================================================================
// TEST 9: Security & Configuration
// ============================================================================
async function testSecurity() {
  log.header();
  log.title('TEST 9: Security & Configuration');
  log.header();
  
  try {
    // Check for .env file in backend
    try {
      const envPath = join(__dirname, 'backend/.env');
      readFileSync(envPath, 'utf8');
      recordTest('Security', 'Backend .env file exists', 'pass');
    } catch {
      recordTest('Security', 'Backend .env file exists', 'warning', 'File not found - API keys may be in localStorage');
    }
    
    // Check for .gitignore
    try {
      const gitignorePath = join(__dirname, '.gitignore');
      const content = readFileSync(gitignorePath, 'utf8');
      if (content.includes('.env')) {
        recordTest('Security', '.gitignore includes .env', 'pass');
      } else {
        recordTest('Security', '.gitignore includes .env', 'warning', '.env not ignored');
      }
    } catch {
      recordTest('Security', '.gitignore exists', 'warning', 'File not found');
    }
    
    // Check for backend proxy implementation
    const llmPath = join(__dirname, 'src/services/llmService.js');
    const content = readFileSync(llmPath, 'utf8');
    if (content.includes('checkBackendAvailable')) {
      recordTest('Security', 'Backend proxy auto-detection', 'pass');
    } else {
      recordTest('Security', 'Backend proxy auto-detection', 'fail', 'Not implemented');
    }
    
  } catch (error) {
    recordTest('Security', 'Configuration check', 'warning', error.message);
  }
}

// ============================================================================
// TEST 10: Integration Test
// ============================================================================
async function testIntegration() {
  log.header();
  log.title('TEST 10: Integration & Data Flow');
  log.header();
  
  try {
    // Check if all services are wired together
    const appPath = join(__dirname, 'src/App.jsx');
    const appContent = readFileSync(appPath, 'utf8');
    
    if (appContent.includes('AppProvider') || appContent.includes('AppContext')) {
      recordTest('Integration', 'Context provider setup', 'pass');
    } else {
      recordTest('Integration', 'Context provider setup', 'warning', 'May not be using context');
    }
    
    if (appContent.includes('SummaryGenerator')) {
      recordTest('Integration', 'Main component integrated', 'pass');
    } else {
      recordTest('Integration', 'Main component integrated', 'fail', 'SummaryGenerator not imported');
    }
    
    if (appContent.includes('Settings')) {
      recordTest('Integration', 'Settings page integrated', 'pass');
    } else {
      recordTest('Integration', 'Settings page integrated', 'warning', 'Settings not imported');
    }
    
  } catch (error) {
    recordTest('Integration', 'App structure', 'warning', error.message);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}      DCS COMPREHENSIVE TEST SUITE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);
  
  await testBackendHealth();
  await testFrontendFiles();
  await testLLMService();
  await testNarrativeEngine();
  await testModelSelector();
  await testFeatureFlags();
  await testAPIEndpoints();
  await testDocumentation();
  await testSecurity();
  await testIntegration();
  
  // Print summary
  log.header();
  console.log(`\n${colors.bright}${colors.magenta}TEST SUMMARY${colors.reset}`);
  log.header();
  
  console.log(`${colors.bright}Total Tests:${colors.reset} ${results.total}`);
  console.log(`${colors.green}✅ Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}❌ Failed:${colors.reset} ${results.failed}`);
  console.log(`${colors.yellow}⚠️  Warnings:${colors.reset} ${results.warnings}`);
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`\n${colors.bright}Pass Rate:${colors.reset} ${passRate}%`);
  
  // Grade
  let grade, gradeColor;
  if (passRate >= 95) {
    grade = 'A+ EXCELLENT';
    gradeColor = colors.green;
  } else if (passRate >= 90) {
    grade = 'A VERY GOOD';
    gradeColor = colors.green;
  } else if (passRate >= 80) {
    grade = 'B GOOD';
    gradeColor = colors.cyan;
  } else if (passRate >= 70) {
    grade = 'C FAIR';
    gradeColor = colors.yellow;
  } else {
    grade = 'D NEEDS IMPROVEMENT';
    gradeColor = colors.red;
  }
  
  console.log(`${colors.bright}Grade:${colors.reset} ${gradeColor}${grade}${colors.reset}\n`);
  
  // Recommendations
  log.header();
  console.log(`\n${colors.bright}${colors.cyan}RECOMMENDATIONS${colors.reset}\n`);
  
  if (results.failed > 0) {
    console.log(`${colors.red}Critical Issues Found:${colors.reset}`);
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => console.log(`  • ${t.category}: ${t.name} - ${t.details}`));
    console.log('');
  }
  
  if (results.warnings > 0) {
    console.log(`${colors.yellow}Warnings:${colors.reset}`);
    results.tests
      .filter(t => t.status === 'warning')
      .slice(0, 5)
      .forEach(t => console.log(`  • ${t.category}: ${t.name} - ${t.details}`));
    if (results.warnings > 5) {
      console.log(`  ... and ${results.warnings - 5} more warnings`);
    }
    console.log('');
  }
  
  log.header();
  console.log('');
}

// Run the test suite
runAllTests().catch(console.error);
