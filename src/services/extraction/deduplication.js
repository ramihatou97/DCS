/**
 * Deduplication Service
 * 
 * CRITICAL FOR ACCURACY: Removes duplicate information across repetitive notes
 * Uses hybrid similarity algorithm:
 * - Jaccard Similarity (40% weight)
 * - Levenshtein Distance (20% weight)
 * - Semantic Similarity (40% weight)
 * 
 * Threshold: 0.85 (85% similarity triggers deduplication)
 * Performance: O(n²) time complexity with early termination optimization
 */

import { calculateSimilarity, levenshteinDistance } from '../../utils/textUtils';
import { calculateCombinedSimilarity } from '../../utils/ml/similarityEngine';
import { SIMILARITY_THRESHOLDS } from '../../config/constants';

class DeduplicationService {
  /**
   * Deduplicate array of text items using hybrid similarity
   */
  deduplicate(items, threshold = SIMILARITY_THRESHOLDS.HIGH) {
    if (!items || items.length === 0) return [];
    
    const unique = [];
    const seen = new Set();
    
    for (const item of items) {
      if (typeof item !== 'string' || !item.trim()) continue;
      
      const normalized = item.trim().toLowerCase();
      
      // Check if we've seen something very similar using hybrid algorithm
      let isDuplicate = false;
      
      for (const seenItem of seen) {
        // Use hybrid similarity: Jaccard 40%, Levenshtein 20%, Semantic 40%
        const similarity = calculateCombinedSimilarity(
          normalized, 
          seenItem,
          { jaccard: 0.4, levenshtein: 0.2, semantic: 0.4 }
        );
        
        if (similarity >= threshold) {
          isDuplicate = true;
          break; // Early termination optimization
        }
      }
      
      if (!isDuplicate) {
        unique.push(item.trim());
        seen.add(normalized);
      }
    }
    
    return unique;
  }
  
  /**
   * Deduplicate with confidence scoring using hybrid similarity
   */
  deduplicateWithConfidence(items, threshold = SIMILARITY_THRESHOLDS.HIGH) {
    if (!items || items.length === 0) return [];
    
    const clusters = [];
    
    for (const item of items) {
      if (typeof item !== 'string' || !item.trim()) continue;
      
      const normalized = item.trim().toLowerCase();
      let addedToCluster = false;
      
      // Try to add to existing cluster
      for (const cluster of clusters) {
        const representative = cluster.items[0].normalized;
        // Use hybrid similarity algorithm
        const similarity = calculateCombinedSimilarity(
          normalized, 
          representative,
          { jaccard: 0.4, levenshtein: 0.2, semantic: 0.4 }
        );
        
        if (similarity >= threshold) {
          cluster.items.push({
            text: item.trim(),
            normalized,
            similarity
          });
          cluster.count++;
          addedToCluster = true;
          break; // Early termination
        }
      }
      
      // Create new cluster if no match
      if (!addedToCluster) {
        clusters.push({
          representative: item.trim(),
          items: [{
            text: item.trim(),
            normalized,
            similarity: 1.0
          }],
          count: 1
        });
      }
    }
    
    // Return representatives with confidence based on frequency
    return clusters.map(cluster => ({
      text: cluster.representative,
      confidence: Math.min(0.5 + (cluster.count * 0.1), 1.0), // Higher confidence for repeated info
      occurrences: cluster.count,
      variants: cluster.items.map(i => i.text)
    }));
  }
  
  /**
   * Merge similar text segments using hybrid similarity
   */
  mergeSegments(segments, threshold = SIMILARITY_THRESHOLDS.MEDIUM) {
    if (!segments || segments.length === 0) return [];
    
    const merged = [];
    const processed = new Set();
    
    for (let i = 0; i < segments.length; i++) {
      if (processed.has(i)) continue;
      
      const segment = segments[i];
      const similar = [segment];
      
      // Find all similar segments using hybrid similarity
      for (let j = i + 1; j < segments.length; j++) {
        if (processed.has(j)) continue;
        
        const other = segments[j];
        const similarity = calculateCombinedSimilarity(
          segment.toLowerCase(),
          other.toLowerCase(),
          { jaccard: 0.4, levenshtein: 0.2, semantic: 0.4 }
        );
        
        if (similarity >= threshold) {
          similar.push(other);
          processed.add(j);
        }
      }
      
      // Use longest version as representative
      const representative = similar.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      );
      
      merged.push({
        text: representative,
        mergedCount: similar.length,
        confidence: Math.min(0.6 + (similar.length * 0.1), 1.0)
      });
      
      processed.add(i);
    }
    
    return merged;
  }
  
  /**
   * Find exact duplicates (fast path)
   */
  findExactDuplicates(items) {
    const counts = new Map();
    const unique = [];
    
    for (const item of items) {
      if (typeof item !== 'string' || !item.trim()) continue;
      
      const normalized = item.trim().toLowerCase();
      
      if (counts.has(normalized)) {
        counts.set(normalized, counts.get(normalized) + 1);
      } else {
        counts.set(normalized, 1);
        unique.push(item.trim());
      }
    }
    
    return {
      unique,
      duplicates: Array.from(counts.entries())
        .filter(([_, count]) => count > 1)
        .map(([text, count]) => ({ text, count }))
    };
  }
  
  /**
   * Deduplicate list items (medications, procedures, etc.)
   */
  deduplicateList(items, options = {}) {
    const {
      threshold = SIMILARITY_THRESHOLDS.HIGH,
      preserveOrder = true,
      caseSensitive = false
    } = options;
    
    if (!items || items.length === 0) return [];
    
    const seen = new Set();
    const unique = [];
    
    for (const item of items) {
      const key = caseSensitive ? item.trim() : item.trim().toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item.trim());
      }
    }
    
    if (!preserveOrder) {
      unique.sort();
    }
    
    return unique;
  }
  
  /**
   * Smart deduplication for structured data
   */
  deduplicateStructured(data, keyField = 'date') {
    if (!Array.isArray(data)) return data;
    
    const unique = [];
    const seenKeys = new Set();
    
    for (const item of data) {
      const key = item[keyField];
      
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        unique.push(item);
      } else if (!key) {
        // No key field - check similarity of entire object
        const itemStr = JSON.stringify(item);
        let isDuplicate = false;
        
        for (const existing of unique) {
          const existingStr = JSON.stringify(existing);
          const similarity = calculateSimilarity(itemStr, existingStr);
          
          if (similarity >= SIMILARITY_THRESHOLDS.VERY_HIGH) {
            isDuplicate = true;
            break;
          }
        }
        
        if (!isDuplicate) {
          unique.push(item);
        }
      }
    }
    
    return unique;
  }
  
  /**
   * Calculate fuzzy match score (0-1)
   */
  calculateFuzzyMatch(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);
    
    return 1 - (distance / maxLength);
  }
  
  /**
   * Find best match from list
   */
  findBestMatch(query, candidates, threshold = SIMILARITY_THRESHOLDS.MEDIUM) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const candidate of candidates) {
      const score = calculateSimilarity(
        query.toLowerCase(),
        candidate.toLowerCase()
      );
      
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
    
    return bestMatch ? { match: bestMatch, score: bestScore } : null;
  }
}

const deduplicationService = new DeduplicationService();
export default deduplicationService;
