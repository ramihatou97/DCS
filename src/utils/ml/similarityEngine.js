/**
 * Similarity Engine for ML Learning
 * 
 * Advanced similarity detection for deduplication and pattern matching
 */

/**
 * Calculate combined similarity using multiple algorithms
 */
export const calculateCombinedSimilarity = (text1, text2, weights = null) => {
  if (!text1 || !text2) return 0;
  
  const defaultWeights = {
    jaccard: 0.4,
    levenshtein: 0.2,
    semantic: 0.4
  };
  
  const w = weights || defaultWeights;
  
  const jaccardScore = jaccardSimilarity(text1, text2);
  const levScore = 1 - normalizedLevenshtein(text1, text2);
  const semScore = semanticSimilarity(text1, text2);
  
  return (
    w.jaccard * jaccardScore +
    w.levenshtein * levScore +
    w.semantic * semScore
  );
};

/**
 * Jaccard similarity (set-based)
 */
export const jaccardSimilarity = (text1, text2) => {
  const words1 = new Set(tokenize(text1));
  const words2 = new Set(tokenize(text2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Levenshtein distance (edit distance)
 */
export const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  
  // Create matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  
  return dp[m][n];
};

/**
 * Normalized Levenshtein distance (0-1 scale)
 */
export const normalizedLevenshtein = (text1, text2) => {
  const maxLen = Math.max(text1.length, text2.length);
  if (maxLen === 0) return 0;
  
  const distance = levenshteinDistance(text1, text2);
  return distance / maxLen;
};

/**
 * Semantic similarity based on medical concepts
 */
export const semanticSimilarity = (text1, text2) => {
  const concepts1 = extractMedicalConcepts(text1);
  const concepts2 = extractMedicalConcepts(text2);
  
  if (concepts1.length === 0 && concepts2.length === 0) {
    return jaccardSimilarity(text1, text2); // Fallback to word similarity
  }
  
  const conceptSet1 = new Set(concepts1);
  const conceptSet2 = new Set(concepts2);
  
  const intersection = new Set([...conceptSet1].filter(x => conceptSet2.has(x)));
  const union = new Set([...conceptSet1, ...conceptSet2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Extract medical concepts from text
 */
const extractMedicalConcepts = (text) => {
  const concepts = [];
  const lowerText = text.toLowerCase();
  
  // Medical concept patterns
  const conceptPatterns = {
    // Procedures
    procedures: /\b(craniotomy|craniectomy|resection|biopsy|coiling|clipping|shunt|evd|ld)\b/gi,
    
    // Pathologies
    pathologies: /\b(aneurysm|hemorrhage|tumor|glioblastoma|metastasis|hydrocephalus|sdh|edh)\b/gi,
    
    // Imaging
    imaging: /\b(CT|MRI|CTA|DSA|angiography|scan)\b/gi,
    
    // Medications
    medications: /\b(aspirin|clopidogrel|warfarin|apixaban|keppra|dexamethasone)\b/gi,
    
    // Anatomical locations
    anatomy: /\b(frontal|parietal|temporal|occipital|cerebellum|brainstem|ventricle)\b/gi,
    
    // Clinical findings
    findings: /\b(deficit|weakness|numbness|headache|seizure|confusion|coma)\b/gi
  };
  
  for (const [category, pattern] of Object.entries(conceptPatterns)) {
    const matches = text.match(pattern) || [];
    concepts.push(...matches.map(m => m.toLowerCase()));
  }
  
  return [...new Set(concepts)]; // Remove duplicates
};

/**
 * Tokenize text into words
 */
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter short words
};

/**
 * Cosine similarity (for TF-IDF vectors)
 */
export const cosineSimilarity = (vec1, vec2) => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must be of equal length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
};

/**
 * Find similar patterns in knowledge base
 */
export const findSimilarPatterns = (targetPattern, patternList, threshold = 0.7) => {
  const similar = [];
  
  for (const pattern of patternList) {
    const similarity = calculateCombinedSimilarity(
      JSON.stringify(targetPattern),
      JSON.stringify(pattern)
    );
    
    if (similarity >= threshold) {
      similar.push({
        pattern,
        similarity,
        score: similarity
      });
    }
  }
  
  // Sort by similarity (descending)
  similar.sort((a, b) => b.similarity - a.similarity);
  
  return similar;
};

/**
 * Fuzzy match for flexible pattern matching
 */
export const fuzzyMatch = (query, target, threshold = 0.6) => {
  const similarity = calculateCombinedSimilarity(query, target);
  return {
    matches: similarity >= threshold,
    similarity,
    confidence: similarity
  };
};

/**
 * N-gram similarity
 */
export const ngramSimilarity = (text1, text2, n = 2) => {
  const ngrams1 = generateNgrams(text1, n);
  const ngrams2 = generateNgrams(text2, n);
  
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Generate n-grams from text
 */
const generateNgrams = (text, n) => {
  const tokens = tokenize(text);
  const ngrams = [];
  
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  
  return ngrams;
};

/**
 * Sequence similarity (for ordered text)
 */
export const sequenceSimilarity = (seq1, seq2) => {
  // Use longest common subsequence
  const lcs = longestCommonSubsequence(seq1, seq2);
  const maxLen = Math.max(seq1.length, seq2.length);
  
  return maxLen > 0 ? lcs.length / maxLen : 0;
};

/**
 * Longest common subsequence
 */
const longestCommonSubsequence = (seq1, seq2) => {
  const m = seq1.length;
  const n = seq2.length;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Reconstruct LCS
  const lcs = [];
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (seq1[i - 1] === seq2[j - 1]) {
      lcs.unshift(seq1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
};

/**
 * Structural similarity (for comparing document structure)
 */
export const structuralSimilarity = (doc1, doc2) => {
  // Compare section headings and structure
  const sections1 = extractSections(doc1);
  const sections2 = extractSections(doc2);
  
  // Compare section order and names
  const orderSimilarity = sequenceSimilarity(
    sections1.map(s => s.title),
    sections2.map(s => s.title)
  );
  
  // Compare section count
  const countSimilarity = 1 - Math.abs(sections1.length - sections2.length) / 
    Math.max(sections1.length, sections2.length, 1);
  
  return (orderSimilarity + countSimilarity) / 2;
};

/**
 * Extract sections from document
 */
const extractSections = (text) => {
  const sections = [];
  const sectionPattern = /^([A-Z][A-Z\s]+)[:]/gm;
  let match;
  
  while ((match = sectionPattern.exec(text)) !== null) {
    sections.push({
      title: match[1].trim(),
      position: match.index
    });
  }
  
  return sections;
};

/**
 * Batch similarity calculation
 */
export const calculateBatchSimilarity = (target, candidates, method = 'combined') => {
  const results = [];
  
  for (const candidate of candidates) {
    let similarity;
    
    switch (method) {
      case 'jaccard':
        similarity = jaccardSimilarity(target, candidate);
        break;
      case 'levenshtein':
        similarity = 1 - normalizedLevenshtein(target, candidate);
        break;
      case 'semantic':
        similarity = semanticSimilarity(target, candidate);
        break;
      case 'ngram':
        similarity = ngramSimilarity(target, candidate);
        break;
      default:
        similarity = calculateCombinedSimilarity(target, candidate);
    }
    
    results.push({
      candidate,
      similarity,
      score: similarity
    });
  }
  
  // Sort by similarity (descending)
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results;
};

export default {
  calculateCombinedSimilarity,
  jaccardSimilarity,
  levenshteinDistance,
  normalizedLevenshtein,
  semanticSimilarity,
  cosineSimilarity,
  findSimilarPatterns,
  fuzzyMatch,
  ngramSimilarity,
  sequenceSimilarity,
  structuralSimilarity,
  calculateBatchSimilarity
};
