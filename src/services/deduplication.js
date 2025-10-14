/**
 * Deduplication Service
 * 
 * Advanced deduplication for repetitive clinical notes
 * Handles:
 * - Exact duplicates
 * - Near-duplicates (semantic similarity)
 * - Redundant information across multiple notes
 * - Smart merging of complementary information
 */

import { 
  normalizeText, 
  calculateSimilarity, 
  splitIntoSentences,
  cleanText,
  areTextsSimilar
} from '../utils/textUtils.js';

/**
 * Deduplicate array of clinical notes
 * Removes redundant content while preserving unique information
 * 
 * @param {string[]} notes - Array of clinical notes
 * @param {Object} options - Deduplication options
 * @returns {Object} Deduplicated result with metadata
 */
export const deduplicateNotes = (notes, options = {}) => {
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
  
  console.log(`Deduplication: Processing ${notes.length} notes`);
  
  // Step 1: Remove exact duplicates
  const uniqueNotes = removeExactDuplicates(notes);
  const exactDuplicatesRemoved = notes.length - uniqueNotes.length;
  console.log(`  - Removed ${exactDuplicatesRemoved} exact duplicates`);
  
  // Step 2: Analyze note structures and extract key information
  const analyzedNotes = uniqueNotes.map(note => analyzeNoteStructure(note));
  
  // Step 3: Remove near-duplicate notes (semantic similarity)
  const nearDeduplicated = removeNearDuplicates(analyzedNotes, similarityThreshold);
  const nearDuplicatesRemoved = analyzedNotes.length - nearDeduplicated.length;
  console.log(`  - Removed ${nearDuplicatesRemoved} near-duplicates`);
  
  // Step 4: Deduplicate content within remaining notes (sentence level)
  const contentDeduplicated = deduplicateSentences(nearDeduplicated, similarityThreshold);
  
  // Step 5: Merge complementary information if enabled
  let finalNotes = contentDeduplicated;
  let mergeCount = 0;
  if (mergeComplementary) {
    const merged = mergeComplementaryNotes(contentDeduplicated);
    mergeCount = merged.mergeCount;
    finalNotes = merged.notes;
    console.log(`  - Merged ${mergeCount} complementary note pairs`);
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
};

/**
 * Remove exact duplicate notes
 */
const removeExactDuplicates = (notes) => {
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
};

/**
 * Analyze note structure and extract key metadata
 */
const analyzeNoteStructure = (note) => {
  const sentences = splitIntoSentences(note);
  const normalized = normalizeText(note);
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  // Extract temporal markers
  const temporalMarkers = extractTemporalMarkers(note);
  
  // Extract medical entities (procedures, medications, etc.)
  const entities = extractKeyEntities(note);
  
  // Calculate content signature (for similarity comparison)
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
};

/**
 * Generate content signature for fast similarity comparison
 */
const generateContentSignature = (words) => {
  // Use most significant words (longer words, medical terms)
  const significantWords = words
    .filter(w => w.length > 4) // Filter short common words
    .slice(0, 50) // Take first 50 significant words
    .sort()
    .join(' ');
  
  return significantWords;
};

/**
 * Extract temporal markers from note
 */
const extractTemporalMarkers = (note) => {
  const markers = [];
  
  // Date patterns
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
  let match;
  while ((match = datePattern.exec(note)) !== null) {
    markers.push({ type: 'date', value: match[0], position: match.index });
  }
  
  // POD patterns
  const podPattern = /POD#?(\d+)/gi;
  while ((match = podPattern.exec(note)) !== null) {
    markers.push({ type: 'pod', value: parseInt(match[1]), position: match.index });
  }
  
  // Relative time
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
};

/**
 * Extract key medical entities for comparison
 */
const extractKeyEntities = (note) => {
  const entities = {
    procedures: [],
    medications: [],
    complications: [],
    examFindings: []
  };
  
  const normalized = note.toLowerCase();
  
  // Common procedures
  const procedureKeywords = [
    'craniotomy', 'coiling', 'clipping', 'evd', 'ventriculostomy',
    'angiogram', 'embolization', 'resection', 'biopsy', 'surgery'
  ];
  
  for (const keyword of procedureKeywords) {
    if (normalized.includes(keyword)) {
      entities.procedures.push(keyword);
    }
  }
  
  // Complications
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
};

/**
 * Calculate priority score for note (for keeping the best version)
 */
const calculateNotePriority = (note, entities, temporalMarkers) => {
  let score = 0;
  
  // Longer notes generally have more information
  score += note.length / 100;
  
  // Notes with more entities are more valuable
  score += (entities.procedures.length + entities.complications.length) * 10;
  
  // Notes with temporal markers are more structured
  score += temporalMarkers.length * 5;
  
  // Notes with specific keywords have higher priority
  const highValueKeywords = [
    'operative', 'procedure', 'impression', 'assessment', 'discharge', 'follow-up'
  ];
  
  for (const keyword of highValueKeywords) {
    if (note.toLowerCase().includes(keyword)) {
      score += 15;
    }
  }
  
  return score;
};

/**
 * Remove near-duplicate notes based on similarity
 */
const removeNearDuplicates = (analyzedNotes, threshold) => {
  const kept = [];
  const removed = [];
  
  for (let i = 0; i < analyzedNotes.length; i++) {
    const current = analyzedNotes[i];
    let isDuplicate = false;
    
    // Compare with already kept notes
    for (const keptNote of kept) {
      const similarity = calculateSimilarity(
        current.signature,
        keptNote.signature
      );
      
      if (similarity >= threshold) {
        isDuplicate = true;
        
        // Keep the note with higher priority
        if (current.priority > keptNote.priority) {
          // Replace kept note with current
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
};

/**
 * Deduplicate sentences across all notes
 */
const deduplicateSentences = (analyzedNotes, threshold) => {
  // Track seen sentences globally
  const seenSentences = new Map(); // normalized sentence -> { original, note indices }
  
  // Process each note
  const deduplicated = analyzedNotes.map((note, noteIndex) => {
    const uniqueSentences = [];
    
    for (const sentence of note.sentences) {
      if (sentence.length < 10) continue; // Skip very short sentences
      
      const normalized = normalizeText(sentence);
      let isDuplicate = false;
      
      // Check against previously seen sentences
      for (const [seenNormalized, seenData] of seenSentences.entries()) {
        const similarity = calculateSimilarity(normalized, seenNormalized);
        
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
};

/**
 * Merge complementary notes that have different but compatible information
 */
const mergeComplementaryNotes = (analyzedNotes) => {
  if (analyzedNotes.length < 2) {
    return { notes: analyzedNotes, mergeCount: 0 };
  }
  
  const merged = [];
  const processed = new Set();
  let mergeCount = 0;
  
  for (let i = 0; i < analyzedNotes.length; i++) {
    if (processed.has(i)) continue;
    
    let currentNote = analyzedNotes[i];
    
    // Look for complementary notes
    for (let j = i + 1; j < analyzedNotes.length; j++) {
      if (processed.has(j)) continue;
      
      const candidate = analyzedNotes[j];
      
      // Check if notes are complementary (low similarity but related content)
      const similarity = calculateSimilarity(
        currentNote.signature,
        candidate.signature
      );
      
      // Complementary: similarity between 0.3-0.6 (related but not duplicate)
      if (similarity >= 0.3 && similarity < 0.6) {
        // Check if they cover same temporal period
        const sameTimePeriod = haveSameTemporalContext(
          currentNote.temporalMarkers,
          candidate.temporalMarkers
        );
        
        if (sameTimePeriod) {
          // Merge the notes
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
};

/**
 * Check if two notes have same temporal context
 */
const haveSameTemporalContext = (markers1, markers2) => {
  if (markers1.length === 0 || markers2.length === 0) return false;
  
  // Compare POD markers
  const pod1 = markers1.filter(m => m.type === 'pod').map(m => m.value);
  const pod2 = markers2.filter(m => m.type === 'pod').map(m => m.value);
  
  if (pod1.length > 0 && pod2.length > 0) {
    // Check if any POD values match
    return pod1.some(p => pod2.includes(p));
  }
  
  // Compare dates
  const dates1 = markers1.filter(m => m.type === 'date').map(m => m.value);
  const dates2 = markers2.filter(m => m.type === 'date').map(m => m.value);
  
  if (dates1.length > 0 && dates2.length > 0) {
    return dates1.some(d => dates2.includes(d));
  }
  
  return false;
};

/**
 * Merge two complementary notes
 */
const mergeNotes = (note1, note2) => {
  // Combine sentences, removing any duplicates introduced
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
  
  // Combine entities
  const combinedEntities = {
    procedures: [...new Set([...note1.entities.procedures, ...note2.entities.procedures])],
    medications: [...new Set([...note1.entities.medications, ...note2.entities.medications])],
    complications: [...new Set([...note1.entities.complications, ...note2.entities.complications])],
    examFindings: [...new Set([...note1.entities.examFindings, ...note2.entities.examFindings])]
  };
  
  // Combine temporal markers
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
    priority: Math.max(note1.priority, note2.priority) + 5 // Bonus for merged content
  };
};

/**
 * Sort notes by chronological order
 */
const sortByChronology = (analyzedNotes) => {
  return analyzedNotes.sort((a, b) => {
    // Sort by earliest temporal marker
    const aMarker = a.temporalMarkers[0];
    const bMarker = b.temporalMarkers[0];
    
    if (!aMarker && !bMarker) return 0;
    if (!aMarker) return 1;
    if (!bMarker) return -1;
    
    // Compare by position in original text (proxy for chronological order)
    return aMarker.position - bMarker.position;
  });
};

export default {
  deduplicateNotes
};
