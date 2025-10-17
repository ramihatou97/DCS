import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test case
const testNotePath = path.join(__dirname, 'test-surgery-note.txt');
const clinicalNote = fs.readFileSync(testNotePath, 'utf8');

console.log('Testing Surgery Date Patterns');
console.log('==============================\n');

// Test each pattern individually
const patterns = [
  {
    name: 'Pattern 1: underwent/received/had PROCEDURE on DATE',
    regex: /(?:underwent|received|had)\s+(?:a\s+)?(?:craniotomy|craniectomy|EVD\s+placement|VP\s+shunt|coiling|clipping|embolization|laminectomy|ACDF|fusion|discectomy|decompression)\s+(?:for\s+[\w\s]+\s+)?(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi
  },
  {
    name: 'Pattern 2: PROCEDURE performed on DATE',
    regex: /(?:craniotomy|craniectomy|EVD|VP\s+shunt|coiling|clipping|embolization|laminectomy|ACDF|fusion|discectomy)\s+(?:was\s+)?(?:performed|done)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi
  },
  {
    name: 'Pattern 3: On DATE, underwent PROCEDURE',
    regex: /(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?:patient\s+)?(?:underwent|received|had)\s+(?:a\s+)?(?:craniotomy|craniectomy|EVD|coiling|clipping|surgery|procedure)/gi
  }
];

for (const pattern of patterns) {
  console.log(`\n${pattern.name}`);
  console.log('-'.repeat(50));

  pattern.regex.lastIndex = 0;
  let match;
  let found = false;

  while ((match = pattern.regex.exec(clinicalNote)) !== null) {
    console.log(`  ✓ Found: "${match[0]}"`);
    console.log(`    Date extracted: "${match[1]}"`);
    found = true;
  }

  if (!found) {
    console.log('  ✗ No matches found');
  }
}

// Look for the specific text we're trying to match
console.log('\n\nActual Text Search:');
console.log('==================');

// Search for the specific line
const lines = clinicalNote.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('craniotomy') && lines[i].includes('10/15/2023')) {
    console.log(`Line ${i + 1}: "${lines[i]}"`);

    // Test a simpler pattern on this line
    const simplePattern = /craniotomy.*?(\d{1,2}\/\d{1,2}\/\d{4})/i;
    const simpleMatch = lines[i].match(simplePattern);
    if (simpleMatch) {
      console.log('  Simple pattern matched! Date:', simpleMatch[1]);
    }

    // Test the actual pattern we're using
    const actualPattern = /(?:underwent|received|had)\s+(?:a\s+)?(?:craniotomy)/gi;
    if (actualPattern.test(lines[i])) {
      console.log('  "underwent/had craniotomy" pattern matched!');
    } else {
      console.log('  "underwent/had craniotomy" pattern did NOT match');
    }
  }
}