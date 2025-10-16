/**
 * Test Script: Verify CORS and extraction fixes
 * 
 * Tests:
 * 1. CORS from port 5177 is allowed
 * 2. Extraction doesn't crash with POD references
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

// Sample note with POD reference that would trigger the bug
const sampleNote = `
Patient presented with SAH.

Surgery: 04/15/2023 - coiling of anterior communicating artery aneurysm

POD#3 - patient doing well, no complications
POD#5 - headache improved
POD#7 - ready for discharge
`;

async function testCORS() {
  console.log('\n🔍 Test 1: CORS Configuration');
  console.log('Testing CORS with Origin: http://localhost:5177');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5177'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader === 'http://localhost:5177' || corsHeader === '*') {
      console.log('✅ CORS Test PASSED - Origin http://localhost:5177 is allowed');
      console.log(`   Response: ${corsHeader}`);
      return true;
    } else {
      console.log('❌ CORS Test FAILED - Origin not allowed');
      console.log(`   Expected: http://localhost:5177`);
      console.log(`   Got: ${corsHeader}`);
      return false;
    }
  } catch (error) {
    console.log('❌ CORS Test FAILED - Error:', error.message);
    return false;
  }
}

async function testExtraction() {
  console.log('\n🔍 Test 2: Extraction with POD References');
  console.log('Testing extraction with note containing POD#3, POD#5, POD#7');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5177'
      },
      body: JSON.stringify({
        notes: sampleNote,
        targets: ['dates', 'procedures', 'complications']
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Extraction Test FAILED - HTTP error:', response.status);
      console.log('   Response:', errorText);
      return false;
    }
    
    const result = await response.json();
    
    if (result.error) {
      console.log('❌ Extraction Test FAILED - API error:', result.error);
      return false;
    }
    
    console.log('✅ Extraction Test PASSED - No crashes with POD references');
    console.log(`   Extracted procedures: ${result.data?.procedures?.length || 0}`);
    console.log(`   Extracted dates: ${Object.keys(result.data?.dates || {}).length}`);
    
    // Check if referenceDates has surgeryDates
    if (result.data?.dates?.surgeryDates && result.data.dates.surgeryDates.length > 0) {
      console.log('✅ surgeryDates included in extraction:', result.data.dates.surgeryDates);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Extraction Test FAILED - Error:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Testing CORS & Extraction Fixes            ║');
  console.log('╚══════════════════════════════════════════════╝');
  
  const test1 = await testCORS();
  const test2 = await testExtraction();
  
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`CORS Fix:        ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Extraction Fix:  ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = test1 && test2;
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  process.exit(allPassed ? 0 : 1);
}

runTests();
