/**
 * Generate Discharge Summary from Sample SAH Notes
 * This script demonstrates the full DCS pipeline using the fixed extraction system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the sample notes
const notesPath = path.join(__dirname, 'docs', 'sample-notes-raw-SAH.txt');
const notes = fs.readFileSync(notesPath, 'utf8');

console.log('🏥 DIGITAL CLINICAL SCRIBE - DISCHARGE SUMMARY GENERATION');
console.log('=' .repeat(70));
console.log('\n📄 Input Notes Preview:');
console.log(notes.substring(0, 300) + '...\n');
console.log('=' .repeat(70));

// Function to call backend extraction API
async function extractData(notes) {
  console.log('\n🧠 STEP 1: LLM-Enhanced Data Extraction');
  console.log('-'.repeat(70));
  
  try {
    const response = await fetch('http://localhost:3001/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: notes,
        options: {
          useFastModel: true,
          preserveAllInfo: true,
          enableCache: false // Disable cache for fresh extraction
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Extraction failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Extraction successful!');
    console.log(`   Provider: ${result.provider || 'LLM'}`);
    console.log(`   Duration: ${result.duration || 'N/A'}ms`);
    
    // Debug: log the actual structure
    console.log('\n🔍 Debug - Result structure:', JSON.stringify(result, null, 2).substring(0, 500));
    
    return result.extracted || result.data || result;
  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    throw error;
  }
}

// Function to generate narrative
async function generateNarrative(extracted) {
  console.log('\n📝 STEP 2: Narrative Generation');
  console.log('-'.repeat(70));
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-narrative', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extracted: extracted,
        options: {
          useLLM: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Narrative generation failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Narrative generated successfully!');
    console.log(`   Sections: ${Object.keys(result.narrative || {}).length}`);
    
    return result.narrative;
  } catch (error) {
    console.error('❌ Narrative generation error:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Extract data
    const extracted = await extractData(notes);
    
    console.log('\n📊 Extracted Data Summary:');
    console.log('   Patient:', extracted.demographics?.name || 'Not extracted');
    console.log('   Age:', extracted.demographics?.age || 'N/A');
    console.log('   MRN:', extracted.demographics?.mrn || 'N/A');
    console.log('   Pathology:', extracted.pathology?.type || 'N/A');
    console.log('   Hunt-Hess:', extracted.pathology?.huntHess || 'N/A');
    console.log('   Procedures:', extracted.procedures?.length || 0);
    console.log('   Complications:', extracted.complications?.length || 0);
    console.log('   mRS:', extracted.functionalScores?.mRS || 'N/A');
    console.log('   Discharge:', extracted.dischargeDestination?.location || 'N/A');
    
    if (extracted._suggestions && extracted._suggestions.length > 0) {
      console.log('\n💡 Missing Field Suggestions:');
      extracted._suggestions.forEach(s => console.log(`   - ${s}`));
    }
    
    if (extracted._validationWarnings && extracted._validationWarnings.length > 0) {
      console.log('\n⚠️  Validation Warnings:');
      extracted._validationWarnings.forEach(w => console.log(`   - ${w}`));
    }
    
    // Step 2: Generate narrative
    const narrative = await generateNarrative(extracted);
    
    // Display the complete discharge summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 FINAL DISCHARGE SUMMARY');
    console.log('='.repeat(70));
    
    console.log('\n' + narrative.header);
    console.log('\n' + narrative.demographics);
    console.log('\n' + narrative.admissionInfo);
    console.log('\n' + narrative.clinicalCourse);
    console.log('\n' + narrative.procedures);
    if (narrative.complications) {
      console.log('\n' + narrative.complications);
    }
    console.log('\n' + narrative.dischargeMedications);
    console.log('\n' + narrative.dischargeInstructions);
    console.log('\n' + narrative.followUp);
    console.log('\n' + narrative.footer);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DISCHARGE SUMMARY GENERATION COMPLETE');
    console.log('='.repeat(70));
    
    // Save to file
    const outputPath = path.join(__dirname, 'generated-discharge-summary.txt');
    const fullSummary = [
      narrative.header,
      narrative.demographics,
      narrative.admissionInfo,
      narrative.clinicalCourse,
      narrative.procedures,
      narrative.complications,
      narrative.dischargeMedications,
      narrative.dischargeInstructions,
      narrative.followUp,
      narrative.footer
    ].filter(Boolean).join('\n\n');
    
    fs.writeFileSync(outputPath, fullSummary);
    console.log(`\n💾 Saved to: ${outputPath}`);
    
    // Return both for further processing if needed
    return { extracted, narrative };
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPlease ensure:');
    console.error('  1. Backend server is running (http://localhost:3001)');
    console.error('  2. LLM API keys are configured');
    console.error('  3. All dependencies are installed');
    process.exit(1);
  }
}

// Run the script
main().then(() => {
  console.log('\n✨ Process completed successfully!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
