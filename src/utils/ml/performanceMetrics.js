/**
 * Performance Metrics Tracker for ML Learning
 * 
 * Tracks accuracy improvements and pattern performance over time
 */

/**
 * Performance metrics store
 */
let metricsHistory = [];

/**
 * Track extraction accuracy
 */
export const trackAccuracy = (predictions, actual) => {
  if (!predictions || !actual) return null;
  
  const totalFields = Object.keys(actual).length;
  let correctFields = 0;
  let partialFields = 0;
  
  const fieldResults = {};
  
  for (const [field, actualValue] of Object.entries(actual)) {
    const predictedValue = predictions[field];
    
    if (!predictedValue) {
      fieldResults[field] = { status: 'missing', accuracy: 0 };
      continue;
    }
    
    const similarity = calculateFieldSimilarity(predictedValue, actualValue);
    
    if (similarity >= 0.95) {
      correctFields++;
      fieldResults[field] = { status: 'correct', accuracy: similarity };
    } else if (similarity >= 0.7) {
      partialFields++;
      fieldResults[field] = { status: 'partial', accuracy: similarity };
    } else {
      fieldResults[field] = { status: 'incorrect', accuracy: similarity };
    }
  }
  
  const accuracy = correctFields / totalFields;
  const partialAccuracy = (correctFields + partialFields * 0.5) / totalFields;
  
  const metrics = {
    accuracy,
    partialAccuracy,
    precision: calculatePrecision(fieldResults),
    recall: calculateRecall(fieldResults),
    f1Score: calculateF1Score(fieldResults),
    totalFields,
    correctFields,
    partialFields,
    incorrectFields: totalFields - correctFields - partialFields,
    fieldResults,
    timestamp: Date.now()
  };
  
  metricsHistory.push(metrics);
  
  return metrics;
};

/**
 * Calculate field similarity
 */
const calculateFieldSimilarity = (predicted, actual) => {
  if (predicted === actual) return 1.0;
  
  if (typeof predicted !== 'string' || typeof actual !== 'string') {
    return predicted === actual ? 1.0 : 0.0;
  }
  
  const words1 = new Set(tokenize(predicted));
  const words2 = new Set(tokenize(actual));
  
  const intersection = [...words1].filter(x => words2.has(x)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
};

/**
 * Tokenize text
 */
const tokenize = (text) => {
  return text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
};

/**
 * Calculate precision
 */
const calculatePrecision = (fieldResults) => {
  const relevant = Object.values(fieldResults).filter(r => 
    r.status === 'correct' || r.status === 'partial'
  ).length;
  
  const retrieved = Object.keys(fieldResults).length;
  
  return retrieved > 0 ? relevant / retrieved : 0;
};

/**
 * Calculate recall
 */
const calculateRecall = (fieldResults) => {
  const relevant = Object.values(fieldResults).filter(r => 
    r.status === 'correct'
  ).length;
  
  const total = Object.keys(fieldResults).length;
  
  return total > 0 ? relevant / total : 0;
};

/**
 * Calculate F1 score
 */
const calculateF1Score = (fieldResults) => {
  const precision = calculatePrecision(fieldResults);
  const recall = calculateRecall(fieldResults);
  
  if (precision + recall === 0) return 0;
  
  return 2 * (precision * recall) / (precision + recall);
};

/**
 * Track pattern performance
 */
export const trackPatternPerformance = (patternId, success) => {
  const metric = {
    patternId,
    success,
    timestamp: Date.now()
  };
  
  metricsHistory.push(metric);
  
  return metric;
};

/**
 * Get overall accuracy trend
 */
export const getAccuracyTrend = (timeWindow = 30) => {
  const now = Date.now();
  const windowMs = timeWindow * 24 * 60 * 60 * 1000; // Convert days to ms
  
  const recentMetrics = metricsHistory.filter(m => 
    m.timestamp && (now - m.timestamp) <= windowMs
  );
  
  if (recentMetrics.length === 0) return null;
  
  const accuracies = recentMetrics
    .filter(m => m.accuracy !== undefined)
    .map(m => m.accuracy);
  
  return {
    current: accuracies[accuracies.length - 1],
    average: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
    trend: calculateTrend(accuracies),
    dataPoints: accuracies.length
  };
};

/**
 * Calculate trend (positive/negative/stable)
 */
const calculateTrend = (values) => {
  if (values.length < 2) return 'insufficient_data';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 0.05) return 'improving';
  if (diff < -0.05) return 'declining';
  return 'stable';
};

/**
 * Get performance by field type
 */
export const getPerformanceByField = () => {
  const fieldPerformance = {};
  
  for (const metric of metricsHistory) {
    if (!metric.fieldResults) continue;
    
    for (const [field, result] of Object.entries(metric.fieldResults)) {
      if (!fieldPerformance[field]) {
        fieldPerformance[field] = {
          total: 0,
          correct: 0,
          partial: 0,
          incorrect: 0,
          accuracies: []
        };
      }
      
      fieldPerformance[field].total++;
      fieldPerformance[field].accuracies.push(result.accuracy);
      
      if (result.status === 'correct') {
        fieldPerformance[field].correct++;
      } else if (result.status === 'partial') {
        fieldPerformance[field].partial++;
      } else {
        fieldPerformance[field].incorrect++;
      }
    }
  }
  
  // Calculate averages
  for (const field of Object.keys(fieldPerformance)) {
    const perf = fieldPerformance[field];
    perf.accuracy = perf.correct / perf.total;
    perf.avgSimilarity = perf.accuracies.reduce((sum, acc) => sum + acc, 0) / perf.accuracies.length;
  }
  
  return fieldPerformance;
};

/**
 * Get learning effectiveness
 */
export const getLearningEffectiveness = () => {
  if (metricsHistory.length < 10) {
    return {
      effectiveness: 'insufficient_data',
      message: 'Need at least 10 data points to calculate effectiveness'
    };
  }
  
  const accuracies = metricsHistory
    .filter(m => m.accuracy !== undefined)
    .map(m => m.accuracy);
  
  const first10 = accuracies.slice(0, 10);
  const last10 = accuracies.slice(-10);
  
  const firstAvg = first10.reduce((sum, acc) => sum + acc, 0) / first10.length;
  const lastAvg = last10.reduce((sum, acc) => sum + acc, 0) / last10.length;
  
  const improvement = lastAvg - firstAvg;
  const improvementPercent = (improvement * 100).toFixed(2);
  
  return {
    initialAccuracy: firstAvg,
    currentAccuracy: lastAvg,
    improvement,
    improvementPercent: `${improvementPercent}%`,
    effectiveness: improvement > 0.02 ? 'effective' : improvement > 0 ? 'moderate' : 'minimal',
    totalSamples: metricsHistory.length
  };
};

/**
 * Get pattern success rates
 */
export const getPatternSuccessRates = () => {
  const patternStats = {};
  
  for (const metric of metricsHistory) {
    if (!metric.patternId) continue;
    
    if (!patternStats[metric.patternId]) {
      patternStats[metric.patternId] = {
        total: 0,
        successes: 0
      };
    }
    
    patternStats[metric.patternId].total++;
    if (metric.success) {
      patternStats[metric.patternId].successes++;
    }
  }
  
  // Calculate success rates
  for (const patternId of Object.keys(patternStats)) {
    const stats = patternStats[patternId];
    stats.successRate = stats.total > 0 ? stats.successes / stats.total : 0;
  }
  
  return patternStats;
};

/**
 * Export metrics for analysis
 */
export const exportMetrics = () => {
  return {
    metricsHistory: metricsHistory,
    summary: {
      totalEntries: metricsHistory.length,
      accuracyTrend: getAccuracyTrend(),
      fieldPerformance: getPerformanceByField(),
      learningEffectiveness: getLearningEffectiveness(),
      patternSuccessRates: getPatternSuccessRates()
    },
    exportedAt: new Date().toISOString()
  };
};

/**
 * Import metrics from backup
 */
export const importMetrics = (data) => {
  if (!data || !Array.isArray(data.metricsHistory)) {
    throw new Error('Invalid metrics data format');
  }
  
  metricsHistory = data.metricsHistory;
  return true;
};

/**
 * Clear metrics history
 */
export const clearMetrics = () => {
  metricsHistory = [];
  return true;
};

/**
 * Get summary statistics
 */
export const getSummaryStatistics = () => {
  if (metricsHistory.length === 0) {
    return {
      hasData: false,
      message: 'No metrics data available'
    };
  }
  
  const accuracyMetrics = metricsHistory.filter(m => m.accuracy !== undefined);
  const accuracies = accuracyMetrics.map(m => m.accuracy);
  
  return {
    hasData: true,
    totalEntries: metricsHistory.length,
    totalAccuracyMeasurements: accuracies.length,
    currentAccuracy: accuracies[accuracies.length - 1],
    averageAccuracy: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
    minAccuracy: Math.min(...accuracies),
    maxAccuracy: Math.max(...accuracies),
    trend: getAccuracyTrend(),
    learningEffectiveness: getLearningEffectiveness()
  };
};

export default {
  trackAccuracy,
  trackPatternPerformance,
  getAccuracyTrend,
  getPerformanceByField,
  getLearningEffectiveness,
  getPatternSuccessRates,
  exportMetrics,
  importMetrics,
  clearMetrics,
  getSummaryStatistics
};
