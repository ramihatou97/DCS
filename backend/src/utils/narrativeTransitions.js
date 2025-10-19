/**
 * Intelligent Section Transitions
 * 
 * Phase 3 Step 3: Smart transition phrases for narrative flow
 * 
 * Purpose:
 * - Select appropriate transition phrases between sentences
 * - Analyze temporal relationships (immediate, delayed, concurrent)
 * - Analyze causal relationships (cause, despite, because)
 * - Analyze additive relationships (addition, emphasis)
 * - Maintain natural narrative flow
 * 
 * @module narrativeTransitions
 */

/**
 * Transition phrase library organized by relationship type
 */
const TRANSITION_PHRASES = {
  // Temporal transitions
  temporal: {
    immediate: [
      'Subsequently',
      'Shortly thereafter',
      'Following this',
      'Immediately',
      'Soon after',
      'Within hours'
    ],
    delayed: [
      'Several days later',
      'Over the ensuing week',
      'During the hospital course',
      'In the following days',
      'After a period of observation',
      'Over time'
    ],
    concurrent: [
      'Concurrently',
      'Meanwhile',
      'At the same time',
      'Simultaneously',
      'In parallel',
      'During this period'
    ],
    sequential: [
      'Next',
      'Then',
      'Afterward',
      'Following this',
      'Subsequently',
      'Thereafter'
    ]
  },
  
  // Causal transitions
  causal: {
    cause: [
      'As a result',
      'Consequently',
      'Therefore',
      'Thus',
      'Accordingly',
      'For this reason'
    ],
    despite: [
      'Despite this',
      'Nevertheless',
      'However',
      'Nonetheless',
      'Even so',
      'In spite of this'
    ],
    because: [
      'Due to',
      'Given',
      'In light of',
      'Because of',
      'Owing to',
      'As a consequence of'
    ]
  },
  
  // Additive transitions
  additive: {
    addition: [
      'Additionally',
      'Furthermore',
      'Moreover',
      'In addition',
      'Also',
      'As well'
    ],
    emphasis: [
      'Notably',
      'Importantly',
      'Of note',
      'Significantly',
      'Particularly',
      'Especially'
    ],
    example: [
      'For example',
      'For instance',
      'Specifically',
      'In particular',
      'Such as',
      'Including'
    ]
  },
  
  // Contrastive transitions
  contrastive: {
    contrast: [
      'However',
      'In contrast',
      'On the other hand',
      'Conversely',
      'Alternatively',
      'By contrast'
    ],
    comparison: [
      'Similarly',
      'Likewise',
      'In the same way',
      'Comparably',
      'Correspondingly',
      'By comparison'
    ]
  },
  
  // Conclusive transitions
  conclusive: {
    summary: [
      'In summary',
      'Overall',
      'In conclusion',
      'To summarize',
      'In brief',
      'Ultimately'
    ],
    outcome: [
      'As a result',
      'Ultimately',
      'In the end',
      'Finally',
      'Eventually',
      'In conclusion'
    ]
  }
};

/**
 * Select appropriate transition phrase between two sentences
 * 
 * @param {string} previousSentence - Previous sentence
 * @param {string} nextSentence - Next sentence
 * @param {Object} context - Additional context (timeline, relationships, etc.)
 * @returns {string} Selected transition phrase
 */
function selectTransition(previousSentence, nextSentence, context = {}) {
  try {
    // Analyze relationship between sentences
    const relationship = analyzeRelationship(previousSentence, nextSentence, context);
    
    // Select transition based on relationship
    let transitionCategory;
    let transitionType;
    
    switch (relationship.type) {
      case 'TEMPORAL':
        transitionCategory = TRANSITION_PHRASES.temporal;
        transitionType = relationship.gap || 'sequential';
        break;
        
      case 'CAUSAL':
        transitionCategory = TRANSITION_PHRASES.causal;
        transitionType = relationship.causality || 'cause';
        break;
        
      case 'ADDITIVE':
        transitionCategory = TRANSITION_PHRASES.additive;
        transitionType = relationship.additiveType || 'addition';
        break;
        
      case 'CONTRASTIVE':
        transitionCategory = TRANSITION_PHRASES.contrastive;
        transitionType = 'contrast';
        break;
        
      case 'CONCLUSIVE':
        transitionCategory = TRANSITION_PHRASES.conclusive;
        transitionType = 'summary';
        break;
        
      default:
        transitionCategory = TRANSITION_PHRASES.additive;
        transitionType = 'addition';
    }
    
    // Get phrases for this type
    const phrases = transitionCategory[transitionType] || transitionCategory[Object.keys(transitionCategory)[0]];
    
    // Select random phrase to avoid repetition
    return randomChoice(phrases);
    
  } catch (error) {
    console.error('[Narrative Transitions] Error selecting transition:', error);
    return 'Additionally';
  }
}

/**
 * Analyze relationship between two sentences
 */
function analyzeRelationship(previousSentence, nextSentence, context = {}) {
  const prev = previousSentence.toLowerCase();
  const next = nextSentence.toLowerCase();
  
  // Check for temporal relationship
  if (hasTemporalRelationship(prev, next, context)) {
    return {
      type: 'TEMPORAL',
      gap: determineTemporalGap(prev, next, context)
    };
  }
  
  // Check for causal relationship
  if (hasCausalRelationship(prev, next)) {
    return {
      type: 'CAUSAL',
      causality: determineCausality(prev, next)
    };
  }
  
  // Check for contrastive relationship
  if (hasContrastiveRelationship(prev, next)) {
    return {
      type: 'CONTRASTIVE'
    };
  }
  
  // Check for conclusive relationship
  if (hasConclusiveRelationship(prev, next, context)) {
    return {
      type: 'CONCLUSIVE'
    };
  }
  
  // Default to additive
  return {
    type: 'ADDITIVE',
    additiveType: 'addition'
  };
}

/**
 * Check if sentences have temporal relationship
 */
function hasTemporalRelationship(prev, next, context) {
  // Check for temporal keywords
  const temporalKeywords = [
    'pod', 'day', 'week', 'month', 'hour', 'minute',
    'after', 'before', 'during', 'following', 'prior',
    'subsequently', 'later', 'earlier', 'then', 'next'
  ];
  
  return temporalKeywords.some(keyword => 
    prev.includes(keyword) || next.includes(keyword)
  );
}

/**
 * Determine temporal gap between sentences
 */
function determineTemporalGap(prev, next, context) {
  // Check for immediate temporal indicators
  if (/immediately|shortly|soon|within hours/i.test(next)) {
    return 'immediate';
  }
  
  // Check for delayed temporal indicators
  if (/days later|weeks later|over time|eventually/i.test(next)) {
    return 'delayed';
  }
  
  // Check for concurrent indicators
  if (/meanwhile|concurrently|at the same time|simultaneously/i.test(next)) {
    return 'concurrent';
  }
  
  // Default to sequential
  return 'sequential';
}

/**
 * Check if sentences have causal relationship
 */
function hasCausalRelationship(prev, next) {
  // Check for causal keywords
  const causalKeywords = [
    'caused', 'led to', 'resulted in', 'due to', 'because',
    'as a result', 'consequently', 'therefore', 'thus'
  ];
  
  return causalKeywords.some(keyword => 
    prev.includes(keyword) || next.includes(keyword)
  );
}

/**
 * Determine causality type
 */
function determineCausality(prev, next) {
  // Check for despite/however patterns
  if (/despite|however|nevertheless|nonetheless/i.test(next)) {
    return 'despite';
  }
  
  // Check for because patterns
  if (/due to|because|given|owing to/i.test(next)) {
    return 'because';
  }
  
  // Default to cause
  return 'cause';
}

/**
 * Check if sentences have contrastive relationship
 */
function hasContrastiveRelationship(prev, next) {
  const contrastiveKeywords = [
    'however', 'but', 'although', 'despite', 'in contrast',
    'on the other hand', 'conversely', 'alternatively'
  ];
  
  return contrastiveKeywords.some(keyword => next.includes(keyword));
}

/**
 * Check if sentence is conclusive
 */
function hasConclusiveRelationship(prev, next, context) {
  const conclusiveKeywords = [
    'in summary', 'overall', 'in conclusion', 'finally',
    'ultimately', 'in the end', 'to summarize'
  ];
  
  // Check if this is near the end of the narrative
  const isNearEnd = context.isLastSentence || context.isSecondToLast;
  
  return isNearEnd || conclusiveKeywords.some(keyword => next.includes(keyword));
}

/**
 * Select random choice from array
 */
function randomChoice(array) {
  if (!array || array.length === 0) return '';
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Build narrative with transitions
 * 
 * @param {Array} sentences - Array of sentences
 * @param {Object} context - Context for transition selection
 * @returns {string} Narrative with transitions
 */
function buildNarrativeWithTransitions(sentences, context = {}) {
  if (!sentences || sentences.length === 0) return '';
  
  try {
    let narrative = sentences[0];
    
    for (let i = 1; i < sentences.length; i++) {
      const previousSentence = sentences[i - 1];
      const currentSentence = sentences[i];
      
      // Add context about position
      const sentenceContext = {
        ...context,
        isLastSentence: i === sentences.length - 1,
        isSecondToLast: i === sentences.length - 2,
        position: i,
        total: sentences.length
      };
      
      // Select transition
      const transition = selectTransition(previousSentence, currentSentence, sentenceContext);
      
      // Add transition and sentence
      narrative += ` ${transition}, ${currentSentence.charAt(0).toLowerCase()}${currentSentence.slice(1)}`;
    }
    
    return narrative;
    
  } catch (error) {
    console.error('[Narrative Transitions] Error building narrative:', error);
    return sentences.join(' ');
  }
}

/**
 * Get transition phrase by type
 * 
 * @param {string} type - Transition type (temporal, causal, additive, etc.)
 * @param {string} subtype - Subtype (immediate, delayed, cause, etc.)
 * @returns {string} Random transition phrase
 */
function getTransitionPhrase(type, subtype = null) {
  try {
    const category = TRANSITION_PHRASES[type];
    if (!category) return '';
    
    if (subtype && category[subtype]) {
      return randomChoice(category[subtype]);
    }
    
    // Return random phrase from first subtype
    const firstSubtype = Object.keys(category)[0];
    return randomChoice(category[firstSubtype]);
    
  } catch (error) {
    console.error('[Narrative Transitions] Error getting transition phrase:', error);
    return '';
  }
}

module.exports = {
  selectTransition,
  buildNarrativeWithTransitions,
  getTransitionPhrase,
  TRANSITION_PHRASES
};

