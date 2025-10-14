/**
 * Vector Database Service for Semantic Search
 * 
 * Implements vector storage and similarity search using IndexedDB
 * Provides semantic search capabilities for clinical notes and patterns
 * 
 * Features:
 * - Vector embedding generation using Transformers.js
 * - Efficient vector storage in IndexedDB
 * - Cosine similarity search
 * - Semantic clustering of similar notes
 * - Pattern similarity matching
 */

import { pipeline, env } from '@xenova/transformers';
import { openDB } from 'idb';

// Configure Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

class VectorDatabaseService {
  constructor() {
    this.db = null;
    this.embedder = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Database configuration
    this.dbName = 'VectorDatabase';
    this.dbVersion = 1;
    
    // Vector store configuration
    this.vectorDimension = 384; // MiniLM produces 384-dimensional vectors
    this.maxVectors = 10000; // Limit for browser storage
    
    // Collection names
    this.collections = {
      NOTES: 'clinical_notes',
      PATTERNS: 'learned_patterns',
      ENTITIES: 'medical_entities',
      SUMMARIES: 'discharge_summaries'
    };
  }
  
  /**
   * Initialize the vector database and embedding model
   */
  async initialize() {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = (async () => {
      try {
        console.log('Initializing Vector Database...');
        
        // Initialize IndexedDB
        await this.initializeDatabase();
        
        // Initialize embedding model (use lightweight model for browser)
        console.log('Loading embedding model...');
        this.embedder = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',  // Lightweight, fast, 384-dim embeddings
          {
            quantized: true,
            revision: 'default'
          }
        );
        
        this.isInitialized = true;
        console.log('Vector Database initialized successfully');
        console.log(`  - Vector dimension: ${this.vectorDimension}`);
        console.log(`  - Collections: ${Object.keys(this.collections).length}`);
      } catch (error) {
        console.error('Failed to initialize Vector Database:', error);
        this.isInitialized = false;
        throw error;
      }
    })();
    
    return this.initializationPromise;
  }
  
  /**
   * Initialize IndexedDB with vector storage schema
   */
  async initializeDatabase() {
    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Clinical notes collection
        if (!db.objectStoreNames.contains('clinical_notes')) {
          const notesStore = db.createObjectStore('clinical_notes', {
            keyPath: 'id',
            autoIncrement: true
          });
          notesStore.createIndex('timestamp', 'timestamp');
          notesStore.createIndex('pathology', 'pathology');
        }
        
        // Learned patterns collection
        if (!db.objectStoreNames.contains('learned_patterns')) {
          const patternsStore = db.createObjectStore('learned_patterns', {
            keyPath: 'id',
            autoIncrement: true
          });
          patternsStore.createIndex('field', 'field');
          patternsStore.createIndex('confidence', 'confidence');
        }
        
        // Medical entities collection
        if (!db.objectStoreNames.contains('medical_entities')) {
          const entitiesStore = db.createObjectStore('medical_entities', {
            keyPath: 'id',
            autoIncrement: true
          });
          entitiesStore.createIndex('type', 'type');
          entitiesStore.createIndex('text', 'text');
        }
        
        // Discharge summaries collection
        if (!db.objectStoreNames.contains('discharge_summaries')) {
          const summariesStore = db.createObjectStore('discharge_summaries', {
            keyPath: 'id',
            autoIncrement: true
          });
          summariesStore.createIndex('date', 'date');
          summariesStore.createIndex('pathology', 'pathology');
        }
      }
    });
  }
  
  /**
   * Generate embedding vector for text
   * 
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text for embedding generation');
    }
    
    await this.initialize();
    
    try {
      // Generate embeddings using the model
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the embedding vector
      const embedding = Array.from(output.data);
      
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
  
  /**
   * Store a document with its vector embedding
   * 
   * @param {string} collection - Collection name
   * @param {Object} document - Document to store
   * @returns {Promise<number>} Document ID
   */
  async storeDocument(collection, document) {
    await this.initialize();
    
    if (!this.collections[collection.toUpperCase()]) {
      throw new Error(`Invalid collection: ${collection}`);
    }
    
    const collectionName = this.collections[collection.toUpperCase()];
    
    // Generate embedding for the document text
    const embedding = await this.generateEmbedding(document.text);
    
    // Store document with embedding
    const docWithVector = {
      ...document,
      vector: embedding,
      timestamp: new Date().toISOString(),
      dimension: embedding.length
    };
    
    const id = await this.db.add(collectionName, docWithVector);
    
    return id;
  }
  
  /**
   * Perform semantic search using cosine similarity
   * 
   * @param {string} collection - Collection to search
   * @param {string} query - Query text
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Similar documents with scores
   */
  async semanticSearch(collection, query, options = {}) {
    const {
      topK = 10,
      minSimilarity = 0.5,
      filter = null
    } = options;
    
    await this.initialize();
    
    if (!this.collections[collection.toUpperCase()]) {
      throw new Error(`Invalid collection: ${collection}`);
    }
    
    const collectionName = this.collections[collection.toUpperCase()];
    
    // Generate query embedding
    const queryVector = await this.generateEmbedding(query);
    
    // Get all documents from collection
    const allDocs = await this.db.getAll(collectionName);
    
    // Calculate similarities
    const results = [];
    
    for (const doc of allDocs) {
      // Apply filter if provided
      if (filter && !filter(doc)) {
        continue;
      }
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryVector, doc.vector);
      
      if (similarity >= minSimilarity) {
        results.push({
          ...doc,
          similarity,
          score: similarity
        });
      }
    }
    
    // Sort by similarity (descending) and limit to topK
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK);
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (norm1 * norm2);
  }
  
  /**
   * Find similar documents to a given document
   */
  async findSimilar(collection, documentId, options = {}) {
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    
    // Get the source document
    const sourceDoc = await this.db.get(collectionName, documentId);
    
    if (!sourceDoc || !sourceDoc.vector) {
      throw new Error('Document not found or has no vector');
    }
    
    // Search using the document's vector
    const allDocs = await this.db.getAll(collectionName);
    const results = [];
    
    for (const doc of allDocs) {
      if (doc.id === documentId) continue; // Skip self
      
      const similarity = this.cosineSimilarity(sourceDoc.vector, doc.vector);
      
      if (similarity >= (options.minSimilarity || 0.5)) {
        results.push({
          ...doc,
          similarity,
          score: similarity
        });
      }
    }
    
    // Sort and limit
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, options.topK || 10);
  }
  
  /**
   * Cluster documents by similarity
   */
  async clusterDocuments(collection, options = {}) {
    const {
      minClusterSize = 2,
      similarityThreshold = 0.7
    } = options;
    
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    const allDocs = await this.db.getAll(collectionName);
    
    const clusters = [];
    const processed = new Set();
    
    for (let i = 0; i < allDocs.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster = [allDocs[i]];
      processed.add(i);
      
      // Find similar documents
      for (let j = i + 1; j < allDocs.length; j++) {
        if (processed.has(j)) continue;
        
        const similarity = this.cosineSimilarity(
          allDocs[i].vector,
          allDocs[j].vector
        );
        
        if (similarity >= similarityThreshold) {
          cluster.push(allDocs[j]);
          processed.add(j);
        }
      }
      
      // Only include clusters that meet minimum size
      if (cluster.length >= minClusterSize) {
        clusters.push({
          size: cluster.length,
          documents: cluster,
          centroid: this.calculateCentroid(cluster.map(d => d.vector))
        });
      }
    }
    
    return clusters;
  }
  
  /**
   * Calculate centroid of vectors
   */
  calculateCentroid(vectors) {
    if (vectors.length === 0) return [];
    
    const dimension = vectors[0].length;
    const centroid = new Array(dimension).fill(0);
    
    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    }
    
    // Average
    for (let i = 0; i < dimension; i++) {
      centroid[i] /= vectors.length;
    }
    
    return centroid;
  }
  
  /**
   * Get all documents from a collection
   */
  async getAllDocuments(collection) {
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    return await this.db.getAll(collectionName);
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(collection, documentId) {
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    await this.db.delete(collectionName, documentId);
  }
  
  /**
   * Clear a collection
   */
  async clearCollection(collection) {
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    await this.db.clear(collectionName);
  }
  
  /**
   * Get database statistics
   */
  async getStatistics() {
    await this.initialize();
    
    const stats = {};
    
    for (const [key, collectionName] of Object.entries(this.collections)) {
      const count = await this.db.count(collectionName);
      stats[key] = {
        collection: collectionName,
        documentCount: count
      };
    }
    
    return {
      ...stats,
      vectorDimension: this.vectorDimension,
      isInitialized: this.isInitialized,
      maxVectors: this.maxVectors
    };
  }
  
  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized;
  }
  
  /**
   * Export collection data
   */
  async exportCollection(collection) {
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    const docs = await this.db.getAll(collectionName);
    
    return {
      collection: collectionName,
      exportDate: new Date().toISOString(),
      documentCount: docs.length,
      documents: docs
    };
  }
  
  /**
   * Import collection data
   */
  async importCollection(collection, data) {
    await this.initialize();
    
    const collectionName = this.collections[collection.toUpperCase()];
    
    for (const doc of data.documents) {
      // Remove id to let it auto-increment
      const { id, ...docWithoutId } = doc;
      await this.db.add(collectionName, docWithoutId);
    }
    
    return {
      imported: data.documents.length,
      collection: collectionName
    };
  }
}

// Singleton instance
const vectorDatabaseService = new VectorDatabaseService();

export default vectorDatabaseService;
export { VectorDatabaseService };
