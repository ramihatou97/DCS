const { detectReferencePhrase } = require('./backend/src/utils/temporalExtraction.js');

// Test cases
const testCases = [
  { text: "Patient underwent craniotomy", expected: "new_event", description: "underwent + procedure" },
  { text: "Procedure: craniotomy", expected: "new_event", description: "Section header: Procedure:" },
  { text: "Procedures performed: craniotomy", expected: "new_event", description: "Section header: Procedures performed:" },
  { text: "craniotomy performed on 10/15/2025", expected: "new_event", description: "performed on + date" },
  { text: "Patient s/p craniotomy", expected: "reference", description: "s/p + procedure" },
  { text: "history of craniotomy", expected: "reference", description: "history of + procedure" },
  { text: "POD#3 s/p craniotomy", expected: "reference", description: "POD# + s/p" },
  { text: "following craniotomy", expected: "reference", description: "following + procedure" },
  { text: "after craniotomy", expected: "reference", description: "after + procedure" },
  { text: "craniotomy today", expected: "new_event", description: "procedure + today" },
  { text: "craniotomy this morning", expected: "new_event", description: "procedure + this morning" },
  { text: "prior craniotomy", expected: "reference", description: "prior + procedure" }
];

console.log("=== Temporal Classification Tests ===\n");

for (const test of testCases) {
  const result = detectReferencePhrase(test.text);
  const actual = result.isReference ? "reference" : "new_event";
  const status = actual === test.expected ? "✅ PASS" : "❌ FAIL";
  
  console.log(`${status} ${test.description}`);
  console.log(`   Text: "${test.text}"`);
  console.log(`   Expected: ${test.expected}, Got: ${actual} (confidence: ${result.confidence})`);
  if (result.pattern) console.log(`   Pattern: "${result.pattern}"`);
  console.log();
}
