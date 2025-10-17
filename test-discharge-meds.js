import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test case
const testNotePath = path.join(__dirname, 'test-surgery-note.txt');
const clinicalNote = fs.readFileSync(testNotePath, 'utf8');

console.log('Testing Discharge Medication Section Parser');
console.log('===========================================\n');

// Test the pattern directly
const dischargeMedsPattern = /(?:MEDICATIONS?\s+(?:ON\s+)?DISCHARGE|DISCHARGE\s+MEDICATIONS?):\s*\n([\s\S]*?)(?=\n\n[A-Z]+:|$)/gi;
let match = dischargeMedsPattern.exec(clinicalNote);

if (match) {
  console.log('Found discharge medications section!');
  console.log('Section content:');
  console.log('-'.repeat(50));
  console.log(match[1]);
  console.log('-'.repeat(50));

  // Test the medication line pattern
  const medsSection = match[1];
  const medLinePattern = /^\s*(?:\d+\.\s*)?([A-Za-z][A-Za-z\s]+?)\s+(\d+(?:\.\d+)?)\s*?(mg|mcg|g|units?|mL)\s+(?:PO|IV|IM|SC|SQ|PR|topical)?\s*(daily|BID|TID|QID|Q\d+H|PRN|once daily|twice daily|three times daily|at bedtime|HS)(?:\s+(?:for|PRN)\s+(.+))?/gim;

  console.log('\nParsing individual medications:');
  let lineMatch;
  let count = 0;
  while ((lineMatch = medLinePattern.exec(medsSection)) !== null) {
    count++;
    console.log(`\n${count}. Match: "${lineMatch[0]}"`);
    console.log(`   Name: ${lineMatch[1].trim()}`);
    console.log(`   Dose: ${lineMatch[2]}${lineMatch[3]}`);
    console.log(`   Frequency: ${lineMatch[4]}`);
    if (lineMatch[5]) console.log(`   Indication: ${lineMatch[5]}`);
  }

  if (count === 0) {
    console.log('\nNo medications matched the pattern.');
    console.log('\nTrying line-by-line analysis:');
    const lines = medsSection.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 3) {
        console.log(`Line ${idx + 1}: "${trimmed}"`);
      }
    });
  }
} else {
  console.log('Discharge medications section not found!');
}