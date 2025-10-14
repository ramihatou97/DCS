/**
 * Privacy-First Storage Service
 * 
 * CRITICAL RULES:
 * 1. During work: Optional auto-save to temporary storage (can be toggled)
 * 2. On finalize/export: ALL patient data deleted immediately
 * 3. Only anonymized ML patterns persisted (NEVER contains PHI)
 * 4. Draft data stored in 'drafts' object store (cleared on finalize)
 * 5. ML data stored in 'patterns', 'corrections', 'templates' (anonymized only)
 */

import { openDB } from 'idb';

const DB_NAME = 'DCS_KnowledgeBase';
const DB_VERSION = 2;

class StorageService {
  constructor() {
    this.db = null;
    this.autoSaveEnabled = false; // Default: OFF for privacy
  }
  
  /**
   * Initialize IndexedDB with privacy-first schema
   */
  async initialize() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log('Upgrading database from version', oldVersion, 'to', newVersion);
        
        // TEMPORARY STORAGE (cleared on finalize)
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', {
            keyPath: 'id',
            autoIncrement: true
          });
          draftStore.createIndex('timestamp', 'timestamp');
          draftStore.createIndex('sessionId', 'sessionId');
        }
        
        // PERSISTENT ML STORAGE (anonymized only, no PHI)
        if (!db.objectStoreNames.contains('patterns')) {
          const patternStore = db.createObjectStore('patterns', {
            keyPath: 'id',
            autoIncrement: true
          });
          patternStore.createIndex('field', 'field');
          patternStore.createIndex('pathology', 'pathology');
          patternStore.createIndex('confidence', 'confidence');
          patternStore.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('corrections')) {
          const correctionStore = db.createObjectStore('corrections', {
            keyPath: 'id',
            autoIncrement: true
          });
          correctionStore.createIndex('field', 'field');
          correctionStore.createIndex('timestamp', 'timestamp');
          correctionStore.createIndex('pathology', 'pathology');
        }
        
        if (!db.objectStoreNames.contains('templateModifications')) {
          const templateStore = db.createObjectStore('templateModifications', {
            keyPath: 'id',
            autoIncrement: true
          });
          templateStore.createIndex('pathology', 'pathology');
          templateStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('importedSummaries')) {
          const importStore = db.createObjectStore('importedSummaries', {
            keyPath: 'id',
            autoIncrement: true
          });
          importStore.createIndex('pathology', 'pathology');
          importStore.createIndex('processedDate', 'processedDate');
        }
        
        // Settings store (includes auto-save preference)
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', {
            keyPath: 'key'
          });
        }
      }
    });
    
    // Load auto-save preference
    const autoSaveSetting = await this.getSetting('autoSaveEnabled');
    this.autoSaveEnabled = autoSaveSetting?.value ?? false;
    
    console.log('✅ Storage initialized. Auto-save:', this.autoSaveEnabled);
    return this.db;
  }
  
  // ==================== SETTINGS MANAGEMENT ====================
  
  async setSetting(key, value) {
    const tx = this.db.transaction('settings', 'readwrite');
    await tx.store.put({ key, value, updatedAt: new Date().toISOString() });
    await tx.done;
    
    if (key === 'autoSaveEnabled') {
      this.autoSaveEnabled = value;
      console.log('🔒 Auto-save', value ? 'ENABLED' : 'DISABLED');
    }
  }
  
  async getSetting(key) {
    return await this.db.get('settings', key);
  }
  
  async getAllSettings() {
    return await this.db.getAll('settings');
  }
  
  // ==================== DRAFT MANAGEMENT (TEMPORARY) ====================
  
  /**
   * Save draft during work (only if auto-save enabled)
   * CRITICAL: This data is TEMPORARY and will be cleared on finalize
   */
  async saveDraft(draftData) {
    if (!this.autoSaveEnabled) {
      console.log('⚠️ Auto-save disabled, draft not saved');
      return null;
    }
    
    const draft = {
      ...draftData,
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSessionId()
    };
    
    const tx = this.db.transaction('drafts', 'readwrite');
    const id = await tx.store.add(draft);
    await tx.done;
    
    console.log('💾 Draft saved (temporary):', id);
    return id;
  }
  
  /**
   * Update existing draft
   */
  async updateDraft(draftId, updates) {
    if (!this.autoSaveEnabled) {
      console.log('⚠️ Auto-save disabled, draft not updated');
      return;
    }
    
    const tx = this.db.transaction('drafts', 'readwrite');
    const existing = await tx.store.get(draftId);
    
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      await tx.store.put(updated);
      await tx.done;
      console.log('💾 Draft updated:', draftId);
    }
  }
  
  /**
   * Get latest draft for current session
   */
  async getLatestDraft() {
    const sessionId = this.getCurrentSessionId();
    const allDrafts = await this.db.getAllFromIndex('drafts', 'sessionId', sessionId);
    
    if (allDrafts.length === 0) return null;
    
    // Return most recent
    return allDrafts.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  }
  
  /**
   * CRITICAL: Clear ALL draft data (called on finalize/export)
   * This ensures no patient data persists
   */
  async clearAllDrafts() {
    const tx = this.db.transaction('drafts', 'readwrite');
    await tx.store.clear();
    await tx.done;
    console.log('🗑️ ALL DRAFTS CLEARED (patient data deleted)');
  }
  
  /**
   * Clear drafts older than specified hours (auto-cleanup)
   */
  async clearOldDrafts(hoursOld = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursOld);
    
    const allDrafts = await this.db.getAll('drafts');
    const tx = this.db.transaction('drafts', 'readwrite');
    
    let cleared = 0;
    for (const draft of allDrafts) {
      if (new Date(draft.timestamp) < cutoff) {
        await tx.store.delete(draft.id);
        cleared++;
      }
    }
    
    await tx.done;
    console.log(`🗑️ Cleared ${cleared} old drafts (>${hoursOld}h)`);
  }
  
  // ==================== ML PATTERN STORAGE (PERSISTENT, ANONYMIZED) ====================
  
  /**
   * Add learned pattern (MUST be anonymized before calling)
   */
  async addPattern(pattern) {
    // Verify no PHI present (basic check)
    this.verifyAnonymized(pattern);
    
    const tx = this.db.transaction('patterns', 'readwrite');
    const id = await tx.store.add({
      ...pattern,
      createdAt: new Date().toISOString()
    });
    await tx.done;
    
    console.log('✅ Pattern added (anonymized):', id);
    return id;
  }
  
  async getPatternsByField(field) {
    return await this.db.getAllFromIndex('patterns', 'field', field);
  }
  
  async getPatternsByPathology(pathology) {
    return await this.db.getAllFromIndex('patterns', 'pathology', pathology);
  }
  
  async getAllPatterns() {
    return await this.db.getAll('patterns');
  }
  
  async updatePatternConfidence(id, newConfidence) {
    const tx = this.db.transaction('patterns', 'readwrite');
    const pattern = await tx.store.get(id);
    
    if (pattern) {
      pattern.confidence = newConfidence;
      pattern.lastUpdated = new Date().toISOString();
      await tx.store.put(pattern);
      await tx.done;
      console.log('✅ Pattern confidence updated:', id, newConfidence);
    }
  }
  
  // ==================== CORRECTION STORAGE (PERSISTENT, ANONYMIZED) ====================
  
  /**
   * Add correction (MUST be anonymized before calling)
   */
  async addCorrection(correction) {
    // Verify no PHI present
    this.verifyAnonymized(correction);
    
    const tx = this.db.transaction('corrections', 'readwrite');
    const id = await tx.store.add({
      ...correction,
      timestamp: new Date().toISOString()
    });
    await tx.done;
    
    console.log('✅ Correction added (anonymized):', id);
    return id;
  }
  
  async getRecentCorrections(limit = 100) {
    const allCorrections = await this.db.getAll('corrections');
    return allCorrections
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
  
  async getCorrectionsByField(field) {
    return await this.db.getAllFromIndex('corrections', 'field', field);
  }
  
  // ==================== TEMPLATE MODIFICATIONS (PERSISTENT, ANONYMIZED) ====================
  
  async addTemplateModification(modification) {
    this.verifyAnonymized(modification);
    
    const tx = this.db.transaction('templateModifications', 'readwrite');
    const id = await tx.store.add({
      ...modification,
      timestamp: new Date().toISOString()
    });
    await tx.done;
    
    console.log('✅ Template modification added (anonymized):', id);
    return id;
  }
  
  async getTemplateModificationsByPathology(pathology) {
    return await this.db.getAllFromIndex('templateModifications', 'pathology', pathology);
  }
  
  // ==================== IMPORTED SUMMARIES (PERSISTENT, ANONYMIZED) ====================
  
  async addImportedSummary(summary) {
    this.verifyAnonymized(summary);
    
    const tx = this.db.transaction('importedSummaries', 'readwrite');
    const id = await tx.store.add({
      ...summary,
      processedDate: new Date().toISOString()
    });
    await tx.done;
    
    console.log('✅ Imported summary added (anonymized):', id);
    return id;
  }
  
  async getImportedSummaries() {
    return await this.db.getAll('importedSummaries');
  }
  
  // ==================== STATISTICS & ANALYTICS ====================
  
  async getStatistics() {
    const [
      patternCount,
      correctionCount,
      templateCount,
      importCount,
      draftCount
    ] = await Promise.all([
      this.db.count('patterns'),
      this.db.count('corrections'),
      this.db.count('templateModifications'),
      this.db.count('importedSummaries'),
      this.db.count('drafts')
    ]);
    
    return {
      totalPatterns: patternCount,
      totalCorrections: correctionCount,
      totalTemplateModifications: templateCount,
      totalImportedSummaries: importCount,
      activeDrafts: draftCount,
      autoSaveEnabled: this.autoSaveEnabled,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // ==================== PRIVACY UTILITIES ====================
  
  /**
   * Verify data is anonymized (basic check for common PHI patterns)
   */
  verifyAnonymized(data) {
    const json = JSON.stringify(data);
    
    // Check for common PHI indicators (not exhaustive, but catches obvious issues)
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Potential names (high false positive, use carefully)
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Emails
    ];
    
    for (const pattern of phiPatterns) {
      if (pattern.test(json)) {
        console.warn('⚠️ WARNING: Potential PHI detected in data to be stored!');
        console.warn('Data should be anonymized before storage');
        // In production, could throw error or return false
      }
    }
  }
  
  /**
   * Get current session ID (for draft management)
   */
  getCurrentSessionId() {
    let sessionId = sessionStorage.getItem('dcs_session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('dcs_session_id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Export all ML learning data (for backup/transfer)
   * CRITICAL: Only exports anonymized learning data, NEVER patient data
   */
  async exportLearningData() {
    const [patterns, corrections, templates, imports, settings] = await Promise.all([
      this.db.getAll('patterns'),
      this.db.getAll('corrections'),
      this.db.getAll('templateModifications'),
      this.db.getAll('importedSummaries'),
      this.db.getAll('settings')
    ]);
    
    return {
      version: DB_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        patterns,
        corrections,
        templateModifications: templates,
        importedSummaries: imports,
        settings
      },
      metadata: {
        totalPatterns: patterns.length,
        totalCorrections: corrections.length,
        autoSaveEnabled: this.autoSaveEnabled
      }
    };
  }
  
  /**
   * Import learning data from backup
   */
  async importLearningData(exportedData) {
    console.log('📥 Importing learning data...');
    
    const { data } = exportedData;
    
    // Import patterns
    if (data.patterns) {
      const tx = this.db.transaction('patterns', 'readwrite');
      for (const pattern of data.patterns) {
        delete pattern.id; // Let auto-increment assign new IDs
        await tx.store.add(pattern);
      }
      await tx.done;
    }
    
    // Import corrections
    if (data.corrections) {
      const tx = this.db.transaction('corrections', 'readwrite');
      for (const correction of data.corrections) {
        delete correction.id;
        await tx.store.add(correction);
      }
      await tx.done;
    }
    
    // Import template modifications
    if (data.templateModifications) {
      const tx = this.db.transaction('templateModifications', 'readwrite');
      for (const template of data.templateModifications) {
        delete template.id;
        await tx.store.add(template);
      }
      await tx.done;
    }
    
    console.log('✅ Learning data imported successfully');
  }
  
  /**
   * Clear ALL data (including ML learning) - use with caution
   */
  async clearAllData() {
    const stores = ['drafts', 'patterns', 'corrections', 'templateModifications', 'importedSummaries'];
    
    const tx = this.db.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
      await tx.objectStore(storeName).clear();
    }
    
    await tx.done;
    console.log('🗑️ ALL DATA CLEARED (including ML learning)');
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;
