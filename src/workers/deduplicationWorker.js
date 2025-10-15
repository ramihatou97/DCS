/**
 * Deduplication Web Worker
 *
 * Self-contained worker for non-blocking deduplication of clinical notes
 * Runs on separate thread to avoid freezing UI
 *
 * Includes:
 * - All text utility functions
 * - Complete deduplication logic
 * - Hybrid similarity algorithms (Jaccard + Levenshtein + Semantic)
 * - Chronological intelligence
 */

// ===========================
// TEXT UTILITY FUNCTIONS
// ===========================

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(text) {
  if (!text) return [];

  const abbreviations = [
    'Dr', 'Mr', 'Mrs', 'Ms', 'vs', 'etc', 'e.g', 'i.e',
    'POD', 'HD', 'POD', 'CT', 'MRI', 'EEG', 'LP'
  ];

  let processed = text;
  abbreviations.forEach((abbr, index) => {
    const placeholder = `__ABBR${index}__`;
    processed = processed.replace(new RegExp(`${abbr}\\.`, 'g'), placeholder);
  });

  const sentences = processed.split(/[.!?]+\s+/);

  return sentences.map(sentence => {
    let restored = sentence;
    abbreviations.forEach((abbr, index) => {
      const placeholder = `__ABBR${index}__`;
      restored = restored.replace(new RegExp(placeholder, 'g'), `${abbr}.`);
    });
    return restored.trim();
  }).filter(s => s.length > 0);
}

// ===========================
// SIMILARITY ALGORITHMS
// ===========================

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

function jaccardSimilarity(str1, str2) {
  const tokens1 = tokenize(str1);
  const tokens2 = tokenize(str2);
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

function normalizedLevenshtein(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return maxLen === 0 ? 1 : 1 - (distance / maxLen);
}

function semanticSimilarity(str1, str2) {
  // Placeholder - returns 0.5 for now
  return 0.5;
}

function calculateCombinedSimilarity(str1, str2) {
  const jaccard = jaccardSimilarity(str1, str2);
  const levenshteinScore = normalizedLevenshtein(str1, str2);
  const semantic = semanticSimilarity(str1, str2);
  return 0.4 * jaccard + 0.2 * levenshteinScore + 0.4 * semantic;
}

// ===========================
// DEDUPLICATION LOGIC
// ===========================

function removeExactDuplicates(notes) {
  const seen = new Set();
  const unique = [];

  for (const note of notes) {
    const normalized = normalizeText(note);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(note);
    }
  }

  return unique;
}

function extractTemporalMarkers(note) {
  const markers = [];

  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
  let match;
  while ((match = datePattern.exec(note)) !== null) {
    markers.push({ type: 'date', value: match[0], position: match.index });
  }

  const podPattern = /POD#?(\d+)/gi;
  while ((match = podPattern.exec(note)) !== null) {
    markers.push({ type: 'pod', value: parseInt(match[1]), position: match.index });
  }

  const relativePatterns = [
    { pattern: /yesterday/gi, value: 'yesterday' },
    { pattern: /today/gi, value: 'today' },
    { pattern: /this\s+morning/gi, value: 'this_morning' },
    { pattern: /(\d+)\s+days?\s+ago/gi, value: 'days_ago' }
  ];

  for (const { pattern, value } of relativePatterns) {
    while ((match = pattern.exec(note)) !== null) {
      markers.push({
        type: 'relative',
        value: match[1] ? `${value}_${match[1]}` : value,
        position: match.index
      });
    }
  }

  return markers;
}

function extractKeyEntities(note) {
  const entities = {
    procedures: [],
    medications: [],
    complications: [],
    examFindings: []
  };

  const normalized = note.toLowerCase();

  const procedureKeywords = [
    'craniotomy', 'coiling', 'clipping', 'evd', 'ventriculostomy',
    'angiogram', 'embolization', 'resection', 'biopsy', 'surgery'
  ];

  for (const keyword of procedureKeywords) {
    if (normalized.includes(keyword)) {
      entities.procedures.push(keyword);
    }
  }

  const complicationKeywords = [
    'vasospasm', 'hydrocephalus', 'hemorrhage', 'infection',
    'seizure', 'stroke', 'edema', 'herniation'
  ];

  for (const keyword of complicationKeywords) {
    if (normalized.includes(keyword)) {
      entities.complications.push(keyword);
    }
  }

  return entities;
}

function calculateNotePriority(note, entities, temporalMarkers) {
  let score = 0;

  score += note.length / 100;
  score += (entities.procedures.length + entities.complications.length) * 10;
  score += temporalMarkers.length * 5;

  const highValueKeywords = [
    'operative', 'procedure', 'impression', 'assessment', 'discharge', 'follow-up'
  ];

  for (const keyword of highValueKeywords) {
    if (note.toLowerCase().includes(keyword)) {
      score += 15;
    }
  }

  return score;
}

function generateContentSignature(words) {
  const significantWords = words
    .filter(w => w.length > 4)
    .slice(0, 50)
    .sort()
    .join(' ');

  return significantWords;
}

function analyzeNoteStructure(note) {
  const sentences = splitIntoSentences(note);
  const normalized = normalizeText(note);
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  const temporalMarkers = extractTemporalMarkers(note);
  const entities = extractKeyEntities(note);
  const signature = generateContentSignature(words);

  return {
    content: note,
    normalized,
    sentences,
    wordCount: words.length,
    temporalMarkers,
    entities,
    signature,
    priority: calculateNotePriority(note, entities, temporalMarkers)
  };
}

function removeNearDuplicates(analyzedNotes, threshold) {
  const kept = [];
  const removed = [];

  for (let i = 0; i < analyzedNotes.length; i++) {
    const current = analyzedNotes[i];
    let isDuplicate = false;

    for (const keptNote of kept) {
      const similarity = calculateCombinedSimilarity(
        current.normalized,
        keptNote.normalized
      );

      if (similarity >= threshold) {
        isDuplicate = true;

        if (current.priority > keptNote.priority) {
          const index = kept.indexOf(keptNote);
          kept[index] = current;
          removed.push(keptNote);
        } else {
          removed.push(current);
        }
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(current);
    }
  }

  return kept;
}

function deduplicateSentences(analyzedNotes, threshold) {
  const seenSentences = new Map();

  const deduplicated = analyzedNotes.map((note, noteIndex) => {
    const uniqueSentences = [];

    for (const sentence of note.sentences) {
      if (sentence.length < 10) continue;

      const normalized = normalizeText(sentence);
      let isDuplicate = false;

      for (const [seenNormalized, seenData] of seenSentences.entries()) {
        const similarity = calculateCombinedSimilarity(
          normalized,
          seenNormalized
        );

        if (similarity >= threshold) {
          isDuplicate = true;
          seenData.noteIndices.push(noteIndex);
          break;
        }
      }

      if (!isDuplicate) {
        uniqueSentences.push(sentence);
        seenSentences.set(normalized, {
          original: sentence,
          noteIndices: [noteIndex]
        });
      }
    }

    return {
      ...note,
      sentences: uniqueSentences,
      content: uniqueSentences.join('. ') + (uniqueSentences.length > 0 ? '.' : '')
    };
  });

  return deduplicated;
}

function haveSameTemporalContext(markers1, markers2) {
  if (markers1.length === 0 || markers2.length === 0) return false;

  const pod1 = markers1.filter(m => m.type === 'pod').map(m => m.value);
  const pod2 = markers2.filter(m => m.type === 'pod').map(m => m.value);

  if (pod1.length > 0 && pod2.length > 0) {
    return pod1.some(p => pod2.includes(p));
  }

  const dates1 = markers1.filter(m => m.type === 'date').map(m => m.value);
  const dates2 = markers2.filter(m => m.type === 'date').map(m => m.value);

  if (dates1.length > 0 && dates2.length > 0) {
    return dates1.some(d => dates2.includes(d));
  }

  return false;
}

function mergeNotes(note1, note2) {
  const allSentences = [...note1.sentences, ...note2.sentences];
  const uniqueSentences = [];
  const seen = new Set();

  for (const sentence of allSentences) {
    const normalized = normalizeText(sentence);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueSentences.push(sentence);
    }
  }

  const combinedEntities = {
    procedures: [...new Set([...note1.entities.procedures, ...note2.entities.procedures])],
    medications: [...new Set([...note1.entities.medications, ...note2.entities.medications])],
    complications: [...new Set([...note1.entities.complications, ...note2.entities.complications])],
    examFindings: [...new Set([...note1.entities.examFindings, ...note2.entities.examFindings])]
  };

  const combinedMarkers = [...note1.temporalMarkers, ...note2.temporalMarkers]
    .sort((a, b) => a.position - b.position);

  const content = uniqueSentences.join('. ') + (uniqueSentences.length > 0 ? '.' : '');

  return {
    content,
    normalized: normalizeText(content),
    sentences: uniqueSentences,
    wordCount: content.split(/\s+/).length,
    temporalMarkers: combinedMarkers,
    entities: combinedEntities,
    signature: generateContentSignature(normalizeText(content).split(/\s+/)),
    priority: Math.max(note1.priority, note2.priority) + 5
  };
}

function mergeComplementaryNotes(analyzedNotes) {
  if (analyzedNotes.length < 2) {
    return { notes: analyzedNotes, mergeCount: 0 };
  }

  const merged = [];
  const processed = new Set();
  let mergeCount = 0;

  for (let i = 0; i < analyzedNotes.length; i++) {
    if (processed.has(i)) continue;

    let currentNote = analyzedNotes[i];

    for (let j = i + 1; j < analyzedNotes.length; j++) {
      if (processed.has(j)) continue;

      const candidate = analyzedNotes[j];

      const similarity = calculateCombinedSimilarity(
        currentNote.normalized,
        candidate.normalized
      );

      if (similarity >= 0.3 && similarity < 0.6) {
        const sameTimePeriod = haveSameTemporalContext(
          currentNote.temporalMarkers,
          candidate.temporalMarkers
        );

        if (sameTimePeriod) {
          currentNote = mergeNotes(currentNote, candidate);
          processed.add(j);
          mergeCount++;
        }
      }
    }

    merged.push(currentNote);
    processed.add(i);
  }

  return { notes: merged, mergeCount };
}

function sortByChronology(analyzedNotes) {
  return analyzedNotes.sort((a, b) => {
    const aMarker = a.temporalMarkers[0];
    const bMarker = b.temporalMarkers[0];

    if (!aMarker && !bMarker) return 0;
    if (!aMarker) return 1;
    if (!bMarker) return -1;

    return aMarker.position - bMarker.position;
  });
}

// ===========================
// MAIN DEDUPLICATION FUNCTION
// ===========================

function deduplicateNotes(notes, options = {}) {
  const {
    similarityThreshold = 0.85,
    preserveChronology = true,
    mergeComplementary = true,
    removeBoilerplate = true
  } = options;

  if (!notes || notes.length === 0) {
    return { deduplicated: [], metadata: { removed: 0, merged: 0 } };
  }

  if (notes.length === 1) {
    return {
      deduplicated: notes,
      metadata: { removed: 0, merged: 0, original: 1, final: 1 }
    };
  }

  console.log(`[Worker] Deduplication: Processing ${notes.length} notes`);

  // Step 1: Remove exact duplicates
  const uniqueNotes = removeExactDuplicates(notes);
  const exactDuplicatesRemoved = notes.length - uniqueNotes.length;
  console.log(`[Worker]   - Removed ${exactDuplicatesRemoved} exact duplicates`);

  // Step 2: Analyze note structures
  const analyzedNotes = uniqueNotes.map(note => analyzeNoteStructure(note));

  // Step 3: Remove near-duplicate notes
  const nearDeduplicated = removeNearDuplicates(analyzedNotes, similarityThreshold);
  const nearDuplicatesRemoved = analyzedNotes.length - nearDeduplicated.length;
  console.log(`[Worker]   - Removed ${nearDuplicatesRemoved} near-duplicates`);

  // Step 4: Deduplicate content within remaining notes
  const contentDeduplicated = deduplicateSentences(nearDeduplicated, similarityThreshold);

  // Step 5: Merge complementary information if enabled
  let finalNotes = contentDeduplicated;
  let mergeCount = 0;
  if (mergeComplementary) {
    const merged = mergeComplementaryNotes(contentDeduplicated);
    mergeCount = merged.mergeCount;
    finalNotes = merged.notes;
    console.log(`[Worker]   - Merged ${mergeCount} complementary note pairs`);
  }

  // Step 6: Preserve chronology if enabled
  if (preserveChronology) {
    finalNotes = sortByChronology(finalNotes);
  }

  return {
    deduplicated: finalNotes.map(note => note.content),
    metadata: {
      original: notes.length,
      final: finalNotes.length,
      exactDuplicatesRemoved,
      nearDuplicatesRemoved,
      mergeCount,
      reductionPercent: Math.round(((notes.length - finalNotes.length) / notes.length) * 100)
    }
  };
}

// ===========================
// WEB WORKER MESSAGE HANDLER
// ===========================

self.onmessage = function(event) {
  const { notes, options } = event.data;

  try {
    console.log(`[Worker] Received ${notes.length} notes for deduplication`);

    const startTime = performance.now();
    const result = deduplicateNotes(notes, options);
    const duration = Math.round(performance.now() - startTime);

    console.log(`[Worker] Deduplication completed in ${duration}ms`);

    self.postMessage({
      success: true,
      result: result,
      duration: duration
    });
  } catch (error) {
    console.error('[Worker] Deduplication error:', error);
    self.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

console.log('[Worker] Deduplication Worker initialized');
