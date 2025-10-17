/**
 * System Verification Script
 * 
 * Verifies all aspects of the DCS application:
 * - Frontend build
 * - Backend API
 * - Service integrations
 * - Quality score calculation
 * - Narrative generation
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function pass(test) {
  results.passed.push(test);
  log('✅', test);
}

function fail(test, error) {
  results.failed.push({ test, error });
  log('❌', `${test}: ${error}`);
}

function warn(test, message) {
  results.warnings.push({ test, message });
  log('⚠️', `${test}: ${message}`);
}

// Test 1: Check if build artifacts exist
async function testBuildArtifacts() {
  const test = 'Build Artifacts';
  try {
    const distPath = join(__dirname, 'dist');
    const indexPath = join(distPath, 'index.html');
    
    if (!fs.existsSync(distPath)) {
      fail(test, 'dist/ directory not found');
      return;
    }
    
    if (!fs.existsSync(indexPath)) {
      fail(test, 'dist/index.html not found');
      return;
    }
    
    const files = fs.readdirSync(join(distPath, 'assets'));
    const hasJS = files.some(f => f.endsWith('.js'));
    const hasCSS = files.some(f => f.endsWith('.css'));
    
    if (!hasJS || !hasCSS) {
      fail(test, 'Missing JS or CSS assets');
      return;
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 2: Check backend health
async function testBackendHealth() {
  const test = 'Backend Health';
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      fail(test, `HTTP ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.status !== 'healthy') {
      fail(test, 'Backend not healthy');
      return;
    }
    
    // Check LLM services
    if (!data.services.anthropic) {
      warn(test, 'Anthropic API key not configured');
    }
    if (!data.services.openai) {
      warn(test, 'OpenAI API key not configured');
    }
    if (!data.services.gemini) {
      warn(test, 'Gemini API key not configured');
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 3: Check frontend dev server
async function testFrontendServer() {
  const test = 'Frontend Dev Server';
  try {
    const response = await fetch(FRONTEND_URL, {
      method: 'GET'
    });
    
    if (!response.ok) {
      fail(test, `HTTP ${response.status}`);
      return;
    }
    
    const html = await response.text();
    
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
      fail(test, 'Invalid HTML response');
      return;
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 4: Check critical service files
async function testServiceFiles() {
  const test = 'Service Files';
  try {
    const criticalFiles = [
      'src/services/summaryGenerator.js',
      'src/services/summaryOrchestrator.js',
      'src/services/extraction.js',
      'src/services/validation.js',
      'src/services/narrativeEngine.js',
      'src/services/llmService.js',
      'src/services/qualityMetrics.js'
    ];
    
    for (const file of criticalFiles) {
      const filePath = join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        fail(test, `Missing ${file}`);
        return;
      }
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 5: Check component files
async function testComponentFiles() {
  const test = 'Component Files';
  try {
    const criticalComponents = [
      'src/components/SummaryGenerator.jsx',
      'src/components/ExtractedDataReview.jsx',
      'src/components/ErrorBoundary.jsx',
      'src/App.jsx'
    ];
    
    for (const file of criticalComponents) {
      const filePath = join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        fail(test, `Missing ${file}`);
        return;
      }
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 6: Check configuration files
async function testConfigFiles() {
  const test = 'Configuration Files';
  try {
    const configFiles = [
      'package.json',
      'vite.config.js',
      'vitest.config.js',
      'index.html',
      'tailwind.config.js',
      'postcss.config.js'
    ];
    
    for (const file of configFiles) {
      const filePath = join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        fail(test, `Missing ${file}`);
        return;
      }
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 7: Check backend routes
async function testBackendRoutes() {
  const test = 'Backend Routes';
  try {
    // Test extraction route
    const extractionResponse = await fetch(`${BACKEND_URL}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'Test patient, 65M, admitted with headache.'
      })
    });
    
    if (!extractionResponse.ok && extractionResponse.status !== 400) {
      fail(test, `Extraction route failed: HTTP ${extractionResponse.status}`);
      return;
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 8: Verify quality score debug logging
async function testQualityScoreLogging() {
  const test = 'Quality Score Debug Logging';
  try {
    const summaryGeneratorPath = join(__dirname, 'src/services/summaryGenerator.js');
    const content = fs.readFileSync(summaryGeneratorPath, 'utf-8');
    
    // Check for debug logging
    if (!content.includes('🔍 ===== QUALITY SCORE BREAKDOWN =====')) {
      fail(test, 'Quality score debug logging not found');
      return;
    }
    
    if (!content.includes('📊 Completeness:')) {
      fail(test, 'Completeness logging not found');
      return;
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Test 9: Verify narrative generation fix
async function testNarrativeGenerationFix() {
  const test = 'Narrative Generation Fix';
  try {
    const orchestratorPath = join(__dirname, 'src/services/summaryOrchestrator.js');
    const content = fs.readFileSync(orchestratorPath, 'utf-8');
    
    // Check for the fix: should pass noteText, not notes
    if (!content.includes('noteText,') || content.includes('generateNarrative(\n      orchestrationResult.extractedData,\n      notes,')) {
      fail(test, 'Narrative generation still passing notes array instead of noteText');
      return;
    }
    
    pass(test);
  } catch (error) {
    fail(test, error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('\n🔍 ===== DCS SYSTEM VERIFICATION =====\n');
  
  await testBuildArtifacts();
  await testBackendHealth();
  await testFrontendServer();
  await testServiceFiles();
  await testComponentFiles();
  await testConfigFiles();
  await testBackendRoutes();
  await testQualityScoreLogging();
  await testNarrativeGenerationFix();
  
  console.log('\n📊 ===== VERIFICATION RESULTS =====\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(({ test, message }) => {
      console.log(`  - ${test}: ${message}`);
    });
  }
  
  console.log('\n=====================================\n');
  
  if (results.failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED! System is ready.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review and fix.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Verification script error:', error);
  process.exit(1);
});

