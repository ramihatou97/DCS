/**
 * Enhanced ML Integration Service
 * 
 * Integrates BioBERT NER and Vector Database for advanced clinical note processing
 * Provides comprehensive ML-powered features for the discharge generator
 * 
 * Features:
 * - Semantic search across clinical notes
 * - Entity-based pattern learning
 * - Similar case retrieval
 * - Clinical insight generation
 * - Advanced deduplication using embeddings
 */

import biobertNERService from './biobertNER.js';
import vectorDatabaseService from './vectorDatabase.js';
import { calculateCombinedSimilarity } from '../../utils/ml/similarityEngine.js';

class EnhancedMLService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Service status
    this.services = {
      biobert: false,
      vectorDb: false
    };
  }
  
  /**
   * Initialize all ML services
   */
  async initialize() {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = (async () => {
      try {
        console.log('Initializing Enhanced ML Service...');
        
        // Initialize services in parallel
        const [biobertInit, vectorDbInit] = await Promise.allSettled([
          biobertNERService.initialize(),
          vectorDatabaseService.initialize()
        ]);
        
        this.services.biobert = biobertInit.status === 'fulfilled';
        this.services.vectorDb = vectorDbInit.status === 'fulfilled';
        
        if (!this.services.biobert) {
          console.warn('BioBERT NER initialization failed:', biobertInit.reason);
        }
        
        if (!this.services.vectorDb) {
          console.warn('Vector Database initialization failed:', vectorDbInit.reason);
        }
        
        this.isInitialized = this.services.biobert || this.services.vectorDb;
        
        console.log('Enhanced ML Service initialized');
        console.log(`  - BioBERT NER: ${this.services.biobert ? '✓' : '✗'}`);
        console.log(`  - Vector Database: ${this.services.vectorDb ? '✓' : '✗'}`);
        
        return this.isInitialized;
      } catch (error) {
        console.error('Failed to initialize Enhanced ML Service:', error);
        throw error;
      }
    })();
    
    return this.initializationPromise;
  }
  
  /**
   * Process clinical note with full ML pipeline
   * 
   * @param {string} text - Clinical note text
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Enhanced extraction results
   */
  async processNote(text, options = {}) {
    const {
      storeInVectorDb = true,
      extractEntities = true,
      findSimilarNotes = true,
      pathology = null
    } = options;
    
    await this.initialize();
    
    const results = {
      text,
      pathology,
      timestamp: new Date().toISOString(),
      entities: null,
      similarNotes: null,
      vectorId: null,
      metadata: {}
    };
    
    try {
      // Extract medical entities with BioBERT
      if (extractEntities && this.services.biobert) {
        console.log('Extracting entities with BioBERT...');
        const entityResults = await biobertNERService.extractEntities(text, {
          enhanceWithRules: true,
          minConfidence: 0.5
        });
        
        results.entities = entityResults.entities;
        results.relationships = entityResults.relationships;
        results.metadata.entityExtraction = entityResults.metadata;
      }
      
      // Store in vector database
      if (storeInVectorDb && this.services.vectorDb) {
        console.log('Storing note in vector database...');
        results.vectorId = await vectorDatabaseService.storeDocument('NOTES', {
          text,
          pathology,
          entities: results.entities,
          timestamp: results.timestamp
        });
      }
      
      // Find similar notes
      if (findSimilarNotes && this.services.vectorDb && results.vectorId) {
        console.log('Finding similar notes...');
        results.similarNotes = await vectorDatabaseService.findSimilar(
          'NOTES',
          results.vectorId,
          { topK: 5, minSimilarity: 0.7 }
        );
      }
      
      return results;
    } catch (error) {
      console.error('Error processing note with ML:', error);
      results.error = error.message;
      return results;
    }
  }
  
  /**
   * Semantic search across stored clinical notes
   */
  async searchNotes(query, options = {}) {
    await this.initialize();
    
    if (!this.services.vectorDb) {
      throw new Error('Vector database not available');
    }
    
    const results = await vectorDatabaseService.semanticSearch('NOTES', query, {
      topK: options.limit || 10,
      minSimilarity: options.minSimilarity || 0.6,
      filter: options.filter
    });
    
    return results;
  }
  
  /**
   * Learn patterns from clinical notes
   * Uses both entity extraction and vector similarity
   */
  async learnPatternsFromNotes(notes, field) {
    await this.initialize();
    
    const patterns = [];
    
    // Extract entities from all notes
    if (this.services.biobert) {
      for (const note of notes) {
        const entityResults = await biobertNERService.extractEntities(note.text);
        
        // Filter entities relevant to the field
        const relevantEntities = entityResults.entities.filter(e => 
          this.isEntityRelevantToField(e, field)
        );
        
        // Generate patterns from entities
        for (const entity of relevantEntities) {
          patterns.push({
            field,
            pattern: entity.text,
            type: entity.label,
            confidence: entity.confidence,
            source: 'biobert',
            context: note.text.substring(
              Math.max(0, entity.start - 50),
              Math.min(note.text.length, entity.end + 50)
            )
          });
        }
      }
    }
    
    // Store patterns in vector database
    if (this.services.vectorDb) {
      for (const pattern of patterns) {
        await vectorDatabaseService.storeDocument('PATTERNS', {
          text: pattern.pattern,
          field: pattern.field,
          type: pattern.type,
          confidence: pattern.confidence,
          context: pattern.context
        });
      }
    }
    
    return {
      patternsLearned: patterns.length,
      field,
      patterns: patterns.slice(0, 10) // Return top 10 as sample
    };
  }
  
  /**
   * Determine if entity is relevant to extraction field
   */
  isEntityRelevantToField(entity, field) {
    const fieldMappings = {
      procedures: ['procedure', 'treatment'],
      complications: ['disease', 'symptom'],
      medications: ['medication', 'drug'],
      pathology: ['disease', 'anatomy'],
      demographics: ['temporal']
    };
    
    const relevantTypes = fieldMappings[field] || [];
    return relevantTypes.includes(entity.label);
  }
  
  /**
   * Find similar clinical cases
   */
  async findSimilarCases(caseDescription, options = {}) {
    await this.initialize();
    
    if (!this.services.vectorDb) {
      console.warn('Vector database not available, using fallback');
      return [];
    }
    
    // Search for similar notes
    const similarNotes = await vectorDatabaseService.semanticSearch(
      'NOTES',
      caseDescription,
      {
        topK: options.limit || 5,
        minSimilarity: options.minSimilarity || 0.7
      }
    );
    
    // Extract entities from similar cases
    const enrichedCases = [];
    
    for (const note of similarNotes) {
      const caseData = {
        ...note,
        entities: note.entities || []
      };
      
      // Extract entities if not already present
      if (this.services.biobert && (!note.entities || note.entities.length === 0)) {
        const entityResults = await biobertNERService.extractEntities(note.text);
        caseData.entities = entityResults.entities;
      }
      
      enrichedCases.push(caseData);
    }
    
    return enrichedCases;
  }
  
  /**
   * Enhanced deduplication using semantic similarity
   */
  async semanticDeduplication(notes, threshold = 0.85) {
    await this.initialize();
    
    if (!this.services.vectorDb) {
      console.warn('Vector database not available, using standard deduplication');
      return notes;
    }
    
    const unique = [];
    const embeddings = [];
    
    // Generate embeddings for all notes
    for (const note of notes) {
      const embedding = await vectorDatabaseService.generateEmbedding(note);
      embeddings.push(embedding);
    }
    
    // Find duplicates using cosine similarity
    const processed = new Set();
    
    for (let i = 0; i < notes.length; i++) {
      if (processed.has(i)) continue;
      
      let isDuplicate = false;
      
      for (let j = 0; j < unique.length; j++) {
        const similarity = vectorDatabaseService.cosineSimilarity(
          embeddings[i],
          embeddings[notes.indexOf(unique[j])]
        );
        
        if (similarity >= threshold) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        unique.push(notes[i]);
      }
      
      processed.add(i);
    }
    
    return unique;
  }
  
  /**
   * Generate clinical insights from entity analysis
   */
  async generateInsights(notes) {
    await this.initialize();
    
    if (!this.services.biobert) {
      return { insights: [], message: 'BioBERT not available' };
    }
    
    const insights = {
      commonProcedures: {},
      commonComplications: {},
      medicationPatterns: {},
      temporalPatterns: []
    };
    
    // Analyze all notes
    for (const note of notes) {
      const entityResults = await biobertNERService.extractEntities(note);
      
      // Count entity occurrences
      for (const entity of entityResults.entities) {
        if (entity.label === 'procedure') {
          insights.commonProcedures[entity.text] = 
            (insights.commonProcedures[entity.text] || 0) + 1;
        } else if (entity.label === 'disease') {
          insights.commonComplications[entity.text] = 
            (insights.commonComplications[entity.text] || 0) + 1;
        } else if (entity.label === 'medication') {
          insights.medicationPatterns[entity.text] = 
            (insights.medicationPatterns[entity.text] || 0) + 1;
        }
      }
      
      // Capture temporal patterns
      if (entityResults.relationships) {
        insights.temporalPatterns.push(...entityResults.relationships);
      }
    }
    
    // Sort by frequency
    const sortByFrequency = (obj) => {
      return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([text, count]) => ({ text, count }));
    };
    
    return {
      commonProcedures: sortByFrequency(insights.commonProcedures),
      commonComplications: sortByFrequency(insights.commonComplications),
      medicationPatterns: sortByFrequency(insights.medicationPatterns),
      temporalPatterns: insights.temporalPatterns.slice(0, 10),
      totalNotesAnalyzed: notes.length
    };
  }
  
  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        biobert: {
          available: this.services.biobert,
          status: this.services.biobert ? biobertNERService.getStatus() : null
        },
        vectorDatabase: {
          available: this.services.vectorDb,
          ready: this.services.vectorDb ? vectorDatabaseService.isReady() : false
        }
      }
    };
  }
  
  /**
   * Get statistics from vector database
   */
  async getStatistics() {
    if (!this.services.vectorDb) {
      return { error: 'Vector database not available' };
    }
    
    return await vectorDatabaseService.getStatistics();
  }
  
  /**
   * Clear all ML data
   */
  async clearAllData() {
    if (!this.services.vectorDb) {
      throw new Error('Vector database not available');
    }
    
    await vectorDatabaseService.clearCollection('NOTES');
    await vectorDatabaseService.clearCollection('PATTERNS');
    await vectorDatabaseService.clearCollection('ENTITIES');
    
    return { success: true, message: 'All ML data cleared' };
  }
  
  /**
   * Export ML data
   */
  async exportData() {
    if (!this.services.vectorDb) {
      throw new Error('Vector database not available');
    }
    
    const [notes, patterns, entities] = await Promise.all([
      vectorDatabaseService.exportCollection('NOTES'),
      vectorDatabaseService.exportCollection('PATTERNS'),
      vectorDatabaseService.exportCollection('ENTITIES')
    ]);
    
    return {
      exportDate: new Date().toISOString(),
      collections: { notes, patterns, entities }
    };
  }
}

// Singleton instance
const enhancedMLService = new EnhancedMLService();

export default enhancedMLService;
export { EnhancedMLService };
