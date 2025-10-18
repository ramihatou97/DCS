/**
 * Generate Discharge Summary - Using Backend API
 * This script calls the backend REST API endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3001';

// Read sample notes
const notesPath = path.join(__dirname, 'docs', 'sample-notes-raw-SAH.txt');
const notes = fs.readFileSync(notesPath, 'utf8');

console.log('🏥 DIGITAL CLINICAL SCRIBE - DISCHARGE SUMMARY GENERATION');
console.log('='.repeat(80));
console.log('\n📄 Input: sample-notes-raw-SAH.txt');
console.log(`   Length: ${notes.length} characters`);
console.log(`   Lines: ${notes.split('\n').length}`);

async function checkBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    console.log('\n✅ Backend Health Check:');
    console.log(`   Status: ${data.status}`);
    console.log(`   Uptime: ${(data.uptime / 60).toFixed(1)} minutes`);
    return true;
  } catch (error) {
    console.error('\n❌ Backend is not running!');
    console.error('   Please start it with: cd backend && npm start');
    return false;
  }
}

async function extractData(notes) {
  console.log('\n' + '='.repeat(80));
  console.log('🧠 STEP 1: Calling Backend Extraction API');
  console.log('='.repeat(80));
  
  const response = await fetch(`${BACKEND_URL}/api/llm/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Extraction failed: ${error}`);
  }
  
  const result = await response.json();
  return result;
}

async function generateSummary(extracted) {
  console.log('\n' + '='.repeat(80));
  console.log('📝 STEP 2: Calling Backend Summary Generation API');
  console.log('='.repeat(80));
  
  const response = await fetch(`${BACKEND_URL}/api/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extracted })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summary generation failed: ${error}`);
  }
  
  const result = await response.json();
  return result.summary;
}

async function main() {
  try {
    // Check backend
    const backendOk = await checkBackend();
    if (!backendOk) {
      process.exit(1);
    }
    
    // Extract data
    const extracted = await extractData(notes);
    
    console.log('\n✅ Extraction Complete!');
    console.log('\n📊 Extracted Data Summary:');
    console.log('─'.repeat(80));
    console.log(`Patient Name:      ${extracted.demographics?.name || 'Not specified'}`);
    console.log(`MRN:               ${extracted.demographics?.mrn || 'Not specified'}`);
    console.log(`Age/Gender:        ${extracted.demographics?.age || '?'}${extracted.demographics?.gender || '?'}`);
    console.log(`Attending:         ${extracted.demographics?.attendingPhysician || 'Not specified'}`);
    console.log(`DOB:               ${extracted.demographics?.dob || 'Not specified'}`);
    console.log('');
    console.log(`Ictus Date:        ${extracted.dates?.ictusDate || 'Not specified'}`);
    console.log(`Admission:         ${extracted.dates?.admissionDate || 'Not specified'}`);
    console.log(`Discharge:         ${extracted.dates?.dischargeDate || 'Not specified'}`);
    console.log('');
    console.log(`Pathology:         ${extracted.pathology?.type || 'Not specified'}`);
    console.log(`Location:          ${extracted.pathology?.location || 'Not specified'}`);
    console.log(`Hunt-Hess Grade:   ${extracted.pathology?.huntHess || 'Not specified'}`);
    console.log(`Fisher Grade:      ${extracted.pathology?.fisher || 'Not specified'}`);
    console.log(`Size:              ${extracted.pathology?.size || 'Not specified'}`);
    console.log('');
    console.log(`Procedures:        ${extracted.procedures?.length || 0} documented`);
    if (extracted.procedures && extracted.procedures.length > 0) {
      extracted.procedures.forEach((proc, idx) => {
        console.log(`  ${idx + 1}. ${proc.name} (${proc.date || 'date not specified'})`);
        if (proc.operator) console.log(`     Operator: ${proc.operator}`);
      });
    }
    console.log('');
    console.log(`Complications:     ${extracted.complications?.length || 0} documented`);
    if (extracted.complications && extracted.complications.length > 0) {
      extracted.complications.forEach((comp, idx) => {
        console.log(`  ${idx + 1}. ${comp.name}${comp.severity ? ` (${comp.severity})` : ''}`);
        if (comp.management) console.log(`     Management: ${comp.management}`);
      });
    }
    console.log('');
    console.log(`mRS:               ${extracted.functionalScores?.mRS ?? 'Not specified'}`);
    console.log(`GCS:               ${extracted.functionalScores?.GCS || 'Not specified'}`);
    console.log(`KPS:               ${extracted.functionalScores?.KPS || 'Not specified'}`);
    console.log('');
    console.log(`Discharge To:      ${extracted.dischargeDestination?.location || 'Not specified'}`);
    console.log(`Support Level:     ${extracted.dischargeDestination?.support || 'Not specified'}`);
    
    if (extracted._suggestions && extracted._suggestions.length > 0) {
      console.log('\n💡 AI Suggestions for Missing Fields:');
      console.log('─'.repeat(80));
      extracted._suggestions.forEach(s => console.log(`   • ${s}`));
    }
    
    if (extracted._validationWarnings && extracted._validationWarnings.length > 0) {
      console.log('\n⚠️  Validation Warnings:');
      console.log('─'.repeat(80));
      extracted._validationWarnings.forEach(w => console.log(`   • ${w}`));
    }
    
    // Generate summary
    const summary = await generateSummary(extracted);
    
    console.log('\n✅ Summary Generated!');
    
    // Display full discharge summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPLETE DISCHARGE SUMMARY');
    console.log('='.repeat(80));
    console.log('\n' + summary + '\n');
    console.log('='.repeat(80));
    console.log('✅ DISCHARGE SUMMARY GENERATION COMPLETE');
    console.log('='.repeat(80));
    
    // Save files
    const summaryPath = path.join(__dirname, 'GENERATED_DISCHARGE_SUMMARY.txt');
    fs.writeFileSync(summaryPath, summary);
    console.log(`\n💾 Full summary saved to: GENERATED_DISCHARGE_SUMMARY.txt`);
    
    const extractedPath = path.join(__dirname, 'EXTRACTED_DATA.json');
    fs.writeFileSync(extractedPath, JSON.stringify(extracted, null, 2));
    console.log(`💾 Raw extracted data saved to: EXTRACTED_DATA.json`);
    
    console.log('\n✨ Process completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure backend server is running: cd backend && npm start');
    console.error('  2. Check backend is on port 3001: lsof -ti:3001');
    console.error('  3. Verify LLM API keys are configured in backend');
    console.error('  4. Check backend logs for errors');
    process.exit(1);
  }
}

main();
