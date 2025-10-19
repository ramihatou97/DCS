/**
 * Intelligence Hub
 * 
 * Phase 2 Step 5: Unified Intelligence Layer
 * 
 * Purpose:
 * - Centralized intelligence gathering across all services
 * - Cross-service learning and insight sharing
 * - Feedback loop from validation to extraction
 * - Quality assessment and monitoring
 * - Pattern learning and knowledge base updates
 * 
 * @module intelligenceHub
 */

const knowledgeBase = require('./knowledge/knowledgeBase.js');
const learningEngine = require('./ml/learningEngine.js');
const contextProvider = require('./context/contextProvider.js');

/**
 * Intelligence Hub Class
 * Coordinates intelligence gathering and sharing across services
 */
class IntelligenceHub {
  constructor() {
    this.knowledgeBase = knowledgeBase;
    this.learningEngine = learningEngine;
    this.contextProvider = contextProvider;
    this.insights = [];
    this.qualityMetrics = [];
  }

  /**
   * Gather comprehensive intelligence from notes and extracted data
   * 
   * @param {string|Array} notes - Clinical notes
   * @param {Object} extractedData - Extracted structured data
   * @param {Object} options - Intelligence gathering options
   * @returns {Object} Comprehensive intelligence report
   */
  async gatherIntelligence(notes, extractedData, options = {}) {
    console.log('[Intelligence Hub] Gathering comprehensive intelligence...');

    const {
      includeValidation = false,
      validation = null,
      context = null
    } = options;

    try {
      const noteText = Array.isArray(notes) ? notes.join('\n\n') : notes;
      
      const intelligence = {
        // Pathology analysis
        pathology: await this.analyzePathology(noteText, extractedData),
        
        // Quality assessment
        quality: await this.assessQuality(noteText, extractedData),
        
        // Completeness check
        completeness: await this.checkCompleteness(extractedData),
        
        // Consistency validation
        consistency: await this.validateConsistency(extractedData),
        
        // Learned patterns
        learnedPatterns: await this.getRelevantPatterns(extractedData),
        
        // Suggestions for improvement
        suggestions: await this.generateSuggestions(extractedData),

        // PHASE 4: Validation feedback integration
        validationFeedback: includeValidation && validation ?
          this.analyzeValidationFeedback(validation) : null,

        // PHASE 4: Context integration
        contextInsights: context ? this.extractContextInsights(context) : null,

        // Metadata
        metadata: {
          generated: new Date().toISOString(),
          noteLength: noteText.length,
          extractedFields: Object.keys(extractedData).length,
          includesValidation: includeValidation,
          includesContext: !!context
        }
      };
      
      console.log('[Intelligence Hub] Intelligence gathering complete');
      
      return intelligence;
      
    } catch (error) {
      console.error('[Intelligence Hub] Error gathering intelligence:', error);
      return {
        pathology: {},
        quality: {},
        completeness: {},
        consistency: {},
        learnedPatterns: {},
        suggestions: [],
        metadata: {
          generated: new Date().toISOString(),
          error: error.message
        }
      };
    }
  }

  /**
   * Analyze pathology from notes and extracted data
   */
  async analyzePathology(noteText, extractedData) {
    try {
      const pathology = extractedData.pathology || {};
      
      return {
        primary: pathology.primary || pathology.primaryDiagnosis,
        secondary: pathology.secondaryDiagnoses || [],
        subtype: pathology.subtype,
        confidence: pathology.confidence || 0.8,
        complexity: this.assessPathologyComplexity(pathology)
      };
    } catch (error) {
      console.error('[Intelligence Hub] Pathology analysis error:', error);
      return {};
    }
  }

  /**
   * Assess quality of notes and extraction
   */
  async assessQuality(noteText, extractedData) {
    try {
      const quality = {
        noteQuality: this.assessNoteQuality(noteText),
        extractionQuality: this.assessExtractionQuality(extractedData),
        overallScore: 0
      };
      
      quality.overallScore = (quality.noteQuality.score + quality.extractionQuality.score) / 2;
      
      return quality;
    } catch (error) {
      console.error('[Intelligence Hub] Quality assessment error:', error);
      return { noteQuality: {}, extractionQuality: {}, overallScore: 0 };
    }
  }

  /**
   * Check completeness of extracted data
   */
  async checkCompleteness(extractedData) {
    try {
      const requiredFields = [
        'demographics', 'dates', 'presentingSymptoms', 'procedures',
        'complications', 'medications', 'functionalStatus', 'discharge'
      ];
      
      const presentFields = requiredFields.filter(field => {
        const value = extractedData[field];
        return value && (
          (typeof value === 'object' && Object.keys(value).length > 0) ||
          (Array.isArray(value) && value.length > 0) ||
          (typeof value === 'string' && value.length > 0)
        );
      });
      
      const completeness = presentFields.length / requiredFields.length;
      
      return {
        score: completeness,
        presentFields,
        missingFields: requiredFields.filter(f => !presentFields.includes(f)),
        totalFields: requiredFields.length
      };
    } catch (error) {
      console.error('[Intelligence Hub] Completeness check error:', error);
      return { score: 0, presentFields: [], missingFields: [], totalFields: 0 };
    }
  }

  /**
   * Validate consistency of extracted data
   */
  async validateConsistency(extractedData) {
    try {
      const issues = [];
      
      // Check date consistency
      if (extractedData.dates) {
        const { admission, discharge, ictus, firstProcedure } = extractedData.dates;
        
        if (admission && discharge && new Date(admission) > new Date(discharge)) {
          issues.push({ field: 'dates', issue: 'Admission date after discharge date' });
        }
        
        if (ictus && admission && new Date(ictus) > new Date(admission)) {
          issues.push({ field: 'dates', issue: 'Ictus date after admission date' });
        }
      }
      
      // Check pathology-procedure consistency
      if (extractedData.pathology && extractedData.procedures) {
        const pathology = extractedData.pathology.primary || extractedData.pathology.primaryDiagnosis;
        const procedures = extractedData.procedures.procedures || [];
        
        if (pathology && pathology.toLowerCase().includes('sah') && procedures.length === 0) {
          issues.push({ field: 'procedures', issue: 'SAH pathology but no procedures documented' });
        }
      }
      
      return {
        isConsistent: issues.length === 0,
        issues,
        score: issues.length === 0 ? 1.0 : Math.max(0, 1 - (issues.length * 0.2))
      };
    } catch (error) {
      console.error('[Intelligence Hub] Consistency validation error:', error);
      return { isConsistent: true, issues: [], score: 1.0 };
    }
  }

  /**
   * Get relevant learned patterns
   */
  async getRelevantPatterns(extractedData) {
    try {
      const pathology = extractedData.pathology?.primary || extractedData.pathology?.primaryDiagnosis;

      if (!pathology) {
        return {};
      }

      // Get learned patterns from learning engine
      // Note: learningEngine uses getPatternsForField, not getLearnedPatterns
      // For now, return empty object - this will be enhanced in Phase 4
      const relevantPatterns = {};

      // Future enhancement: Query learning engine for pathology-specific patterns
      // const patterns = await this.learningEngine.getPatternsForField(pathology);

      return relevantPatterns;
    } catch (error) {
      console.error('[Intelligence Hub] Pattern retrieval error:', error);
      return {};
    }
  }

  /**
   * Generate suggestions for improvement
   */
  async generateSuggestions(extractedData) {
    try {
      const suggestions = [];
      
      // Check for missing critical fields
      if (!extractedData.demographics?.age) {
        suggestions.push({
          type: 'missing_field',
          field: 'demographics.age',
          message: 'Patient age not extracted',
          priority: 'high'
        });
      }
      
      if (!extractedData.dates?.admission) {
        suggestions.push({
          type: 'missing_field',
          field: 'dates.admission',
          message: 'Admission date not extracted',
          priority: 'high'
        });
      }
      
      if (!extractedData.procedures || extractedData.procedures.procedures?.length === 0) {
        suggestions.push({
          type: 'missing_field',
          field: 'procedures',
          message: 'No procedures extracted',
          priority: 'medium'
        });
      }
      
      if (!extractedData.discharge?.destination) {
        suggestions.push({
          type: 'missing_field',
          field: 'discharge.destination',
          message: 'Discharge destination not extracted',
          priority: 'medium'
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('[Intelligence Hub] Suggestion generation error:', error);
      return [];
    }
  }

  /**
   * Share insight across services
   */
  shareInsight(insight) {
    try {
      this.insights.push({
        ...insight,
        timestamp: new Date().toISOString()
      });
      
      // Notify relevant services
      if (insight.type === 'PATTERN') {
        this.learningEngine.considerPattern(insight);
      }
      
      if (insight.type === 'KNOWLEDGE') {
        this.knowledgeBase.updateKnowledge(insight);
      }
      
      console.log(`[Intelligence Hub] Insight shared: ${insight.type}`);
    } catch (error) {
      console.error('[Intelligence Hub] Error sharing insight:', error);
    }
  }

  /**
   * Learn from validation feedback
   */
  async learnFromValidation(validationResult, extractedData) {
    try {
      for (const error of validationResult.errors || []) {
        const insight = {
          type: 'VALIDATION_ERROR',
          field: error.field,
          issue: error.message,
          context: extractedData,
          timestamp: new Date().toISOString()
        };
        
        this.shareInsight(insight);
      }
      
      console.log(`[Intelligence Hub] Learned from ${validationResult.errors?.length || 0} validation errors`);
    } catch (error) {
      console.error('[Intelligence Hub] Error learning from validation:', error);
    }
  }

  /**
   * Assess pathology complexity
   */
  assessPathologyComplexity(pathology) {
    let complexity = 'simple';
    
    if (pathology.secondaryDiagnoses && pathology.secondaryDiagnoses.length > 0) {
      complexity = 'moderate';
    }
    
    if (pathology.secondaryDiagnoses && pathology.secondaryDiagnoses.length > 2) {
      complexity = 'complex';
    }
    
    return complexity;
  }

  /**
   * Assess note quality
   */
  assessNoteQuality(noteText) {
    const length = noteText.length;
    const hasStructure = /(?:HISTORY|HOSPITAL COURSE|DISCHARGE)/i.test(noteText);
    const hasDates = /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(noteText);
    
    let score = 0.5; // Base score
    
    if (length > 500) score += 0.2;
    if (hasStructure) score += 0.2;
    if (hasDates) score += 0.1;
    
    return {
      score: Math.min(1.0, score),
      length,
      hasStructure,
      hasDates
    };
  }

  /**
   * Assess extraction quality
   */
  assessExtractionQuality(extractedData) {
    const fieldCount = Object.keys(extractedData).length;
    const hasPathology = !!extractedData.pathology;
    const hasProcedures = extractedData.procedures?.procedures?.length > 0;
    const hasDates = !!extractedData.dates;

    let score = 0.3; // Base score

    if (fieldCount > 5) score += 0.2;
    if (hasPathology) score += 0.2;
    if (hasProcedures) score += 0.2;
    if (hasDates) score += 0.1;

    return {
      score: Math.min(1.0, score),
      fieldCount,
      hasPathology,
      hasProcedures,
      hasDates
    };
  }

  /**
   * PHASE 4: Analyze validation feedback for learning
   */
  analyzeValidationFeedback(validation) {
    try {
      const feedback = {
        errorCount: validation.errors?.length || 0,
        warningCount: validation.warnings?.length || 0,
        criticalErrors: validation.errors?.filter(e => e.severity === 'critical') || [],
        patterns: [],
        recommendations: []
      };

      // Identify error patterns
      const errorTypes = {};
      for (const error of (validation.errors || [])) {
        errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      }

      // Generate recommendations based on error patterns
      for (const [type, count] of Object.entries(errorTypes)) {
        if (count > 2) {
          feedback.patterns.push({
            type,
            count,
            severity: 'high'
          });
          feedback.recommendations.push({
            type: 'IMPROVE_EXTRACTION',
            field: type,
            reason: `Multiple ${type} errors detected`
          });
        }
      }

      return feedback;
    } catch (error) {
      console.error('[Intelligence Hub] Error analyzing validation feedback:', error);
      return { errorCount: 0, warningCount: 0, patterns: [], recommendations: [] };
    }
  }

  /**
   * PHASE 4: Extract insights from context
   */
  extractContextInsights(context) {
    try {
      return {
        pathology: {
          primary: context.pathology?.primary,
          complexity: context.clinical?.complexity,
          hasMultiplePathologies: (context.pathology?.secondary?.length || 0) > 0
        },
        clinical: {
          complexity: context.clinical?.complexity,
          hasConsultants: (context.consultants?.count || 0) > 0,
          consultantTypes: context.consultants?.types || []
        },
        temporal: {
          hasTimeline: !!context.temporal?.surgeryDate,
          hasPODTracking: !!context.temporal?.postOpDay
        },
        recommendations: this.generateContextBasedRecommendations(context)
      };
    } catch (error) {
      console.error('[Intelligence Hub] Error extracting context insights:', error);
      return { pathology: {}, clinical: {}, temporal: {}, recommendations: [] };
    }
  }

  /**
   * PHASE 4: Generate context-based recommendations
   * @private
   */
  generateContextBasedRecommendations(context) {
    const recommendations = [];

    // Recommend consultant note emphasis
    if (context.consultants?.count > 0) {
      recommendations.push({
        type: 'EMPHASIZE_CONSULTANTS',
        priority: 'high',
        message: `Include insights from ${context.consultants.count} consultant note(s)`
      });
    }

    // Recommend timeline tracking
    if (context.temporal?.surgeryDate) {
      recommendations.push({
        type: 'USE_TIMELINE',
        priority: 'medium',
        message: 'Use POD/HD timeline for chronological accuracy'
      });
    }

    // Recommend pathology-specific extraction
    if (context.pathology?.primary) {
      recommendations.push({
        type: 'PATHOLOGY_SPECIFIC',
        priority: 'high',
        message: `Apply ${context.pathology.primary}-specific extraction patterns`
      });
    }

    return recommendations;
  }
}

// Export singleton instance
module.exports = new IntelligenceHub();

