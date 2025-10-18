/**
 * Simple DC Summary Generator - Direct LLM Service Call
 * Bypasses backend API and uses the frontend services directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read sample notes
const notesPath = path.join(__dirname, 'docs', 'sample-notes-raw-SAH.txt');
const notes = fs.readFileSync(notesPath, 'utf8');

console.log('🏥 DIGITAL CLINICAL SCRIBE - DISCHARGE SUMMARY GENERATION');
console.log('='.repeat(80));
console.log('\n📄 Input: sample-notes-raw-SAH.txt');
console.log(`   Length: ${notes.length} characters`);
console.log(`   Lines: ${notes.split('\n').length}`);

// Import the extraction and narrative services
async function loadServices() {
  const llmModule = await import('./src/services/llmService.js');
  const narrativeModule = await import('./src/services/narrativeEngine.js');
  
  return {
    extractWithLLM: llmModule.extractWithLLM,
    generateNarrativeFromExtracted: narrativeModule.generateNarrativeFromExtracted
  };
}

async function main() {
  try {
    console.log('\n🔧 Loading services...');
    const { extractWithLLM, generateNarrativeFromExtracted } = await loadServices();
    console.log('✅ Services loaded');
    
    // Step 1: Extract data with LLM
    console.log('\n' + '='.repeat(80));
    console.log('🧠 STEP 1: LLM-Enhanced Data Extraction');
    console.log('='.repeat(80));
    
    const extracted = await extractWithLLM(notes, {
      useFastModel: true,
      preserveAllInfo: true,
      enableCache: false
    });
    
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
      });
    }
    console.log('');
    console.log(`Complications:     ${extracted.complications?.length || 0} documented`);
    if (extracted.complications && extracted.complications.length > 0) {
      extracted.complications.forEach((comp, idx) => {
        console.log(`  ${idx + 1}. ${comp.name} (${comp.severity || 'severity not specified'})`);
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
    
    // Step 2: Generate narrative
    console.log('\n' + '='.repeat(80));
    console.log('📝 STEP 2: Narrative Generation');
    console.log('='.repeat(80));
    
    const narrative = await generateNarrativeFromExtracted(extracted, {
      useLLM: true
    });
    
    console.log('✅ Narrative Generated!');
    console.log(`   Total sections: ${Object.keys(narrative).length}`);
    
    // Display full discharge summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPLETE DISCHARGE SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    const sections = [
      'header',
      'demographics', 
      'admissionInfo',
      'clinicalCourse',
      'procedures',
      'complications',
      'dischargeMedications',
      'dischargeInstructions',
      'followUp',
      'footer'
    ];
    
    sections.forEach(section => {
      if (narrative[section]) {
        console.log(narrative[section]);
        console.log('');
      }
    });
    
    console.log('='.repeat(80));
    console.log('✅ DISCHARGE SUMMARY GENERATION COMPLETE');
    console.log('='.repeat(80));
    
    // Save to file
    const outputPath = path.join(__dirname, 'GENERATED_DISCHARGE_SUMMARY.txt');
    const fullText = sections
      .map(s => narrative[s])
      .filter(Boolean)
      .join('\n\n');
    
    fs.writeFileSync(outputPath, fullText);
    console.log(`\n💾 Full summary saved to: GENERATED_DISCHARGE_SUMMARY.txt`);
    
    // Also save raw extracted data
    const extractedPath = path.join(__dirname, 'EXTRACTED_DATA.json');
    fs.writeFileSync(extractedPath, JSON.stringify(extracted, null, 2));
    console.log(`💾 Raw extracted data saved to: EXTRACTED_DATA.json`);
    
    console.log('\n✨ Process completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure backend server is running (port 3001)');
    console.error('  2. Check LLM API keys are configured');
    console.error('  3. Verify network connectivity');
    process.exit(1);
  }
}

main();
