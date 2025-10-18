/**
 * Timeliness Scorer - 6-Dimension Quality Metrics
 *
 * Evaluates the timeliness of the discharge summary generation by tracking:
 * - Processing speed
 * - Data freshness
 * - Completion within target timeframes
 * - Performance optimization opportunities
 *
 * Weight: 5% of overall quality score
 *
 * @module timelinessScorer
 */

/**
 * Calculate timeliness score for discharge summary
 *
 * @param {Object} metrics - Performance metrics
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} options - Scoring options
 * @returns {Object} Timeliness score with details
 */
export function calculateTimelinessScore(metrics = {}, extractedData = {}, options = {}) {
  const {
    targetProcessingTime = 3000, // 3 seconds target
    maxAcceptableTime = 10000,   // 10 seconds max
    checkDataFreshness = true
  } = options;

  const issues = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // 1. Processing speed (40% of timeliness)
  const speedScore = evaluateProcessingSpeed(
    metrics.processingTime,
    targetProcessingTime,
    maxAcceptableTime
  );
  totalPoints += speedScore.points * 0.40;
  maxPoints += speedScore.maxPoints * 0.40;
  issues.push(...speedScore.issues);

  // 2. Component performance (25% of timeliness)
  const componentScore = evaluateComponentPerformance(metrics);
  totalPoints += componentScore.points * 0.25;
  maxPoints += componentScore.maxPoints * 0.25;
  issues.push(...componentScore.issues);

  // 3. Data extraction efficiency (20% of timeliness)
  const extractionScore = evaluateExtractionEfficiency(metrics);
  totalPoints += extractionScore.points * 0.20;
  maxPoints += extractionScore.maxPoints * 0.20;
  issues.push(...extractionScore.issues);

  // 4. Narrative generation speed (10% of timeliness)
  const narrativeScore = evaluateNarrativeGenerationSpeed(metrics);
  totalPoints += narrativeScore.points * 0.10;
  maxPoints += narrativeScore.maxPoints * 0.10;
  issues.push(...narrativeScore.issues);

  // 5. Data freshness (5% of timeliness)
  if (checkDataFreshness) {
    const freshnessScore = evaluateDataFreshness(extractedData);
    totalPoints += freshnessScore.points * 0.05;
    maxPoints += freshnessScore.maxPoints * 0.05;
    issues.push(...freshnessScore.issues);
  } else {
    totalPoints += 0.05;
    maxPoints += 0.05;
  }

  const score = maxPoints > 0 ? totalPoints / maxPoints : 0;

  // Identify performance bottlenecks
  const bottlenecks = identifyBottlenecks(metrics);

  return {
    score,
    weight: 0.05,
    weighted: score * 0.05,
    issues,
    bottlenecks,
    details: {
      processingSpeed: speedScore,
      componentPerformance: componentScore,
      extractionEfficiency: extractionScore,
      narrativeGeneration: narrativeScore,
      dataFreshness: checkDataFreshness ? evaluateDataFreshness(extractedData) : null,
      metrics: {
        totalTime: metrics.processingTime,
        extractionTime: metrics.extractionTime,
        narrativeTime: metrics.narrativeTime,
        targetTime: targetProcessingTime
      }
    }
  };
}

/**
 * Evaluate overall processing speed
 */
function evaluateProcessingSpeed(processingTime, target, max) {
  const issues = [];
  let points = 0;
  const maxPoints = 1;

  if (!processingTime || processingTime <= 0) {
    // No timing data available, give neutral score
    return { points: 0.5, maxPoints: 1, issues: [] };
  }

  if (processingTime <= target) {
    // Excellent performance
    points = 1;
  } else if (processingTime <= target * 1.5) {
    // Good performance
    points = 0.8;
    issues.push({
      type: 'SLIGHTLY_SLOW',
      time: processingTime,
      target: target,
      severity: 'minor',
      impact: -0.005,
      suggestion: `Optimize to reach ${target}ms target`
    });
  } else if (processingTime <= target * 2) {
    // Acceptable performance
    points = 0.6;
    issues.push({
      type: 'MODERATE_DELAY',
      time: processingTime,
      target: target,
      severity: 'minor',
      impact: -0.01,
      suggestion: 'Consider performance optimizations'
    });
  } else if (processingTime <= max) {
    // Poor performance
    points = 0.3;
    issues.push({
      type: 'SLOW_PROCESSING',
      time: processingTime,
      target: target,
      severity: 'major',
      impact: -0.02,
      suggestion: 'Performance optimization needed'
    });
  } else {
    // Unacceptable performance
    points = 0;
    issues.push({
      type: 'EXCESSIVE_PROCESSING_TIME',
      time: processingTime,
      max: max,
      severity: 'critical',
      impact: -0.05,
      suggestion: 'Critical performance issues - investigate bottlenecks'
    });
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate individual component performance
 */
function evaluateComponentPerformance(metrics) {
  const issues = [];
  let totalPoints = 0;
  let totalChecks = 0;

  const components = [
    { name: 'extraction', time: metrics.extractionTime, target: 1000 },
    { name: 'narrative', time: metrics.narrativeTime, target: 1500 },
    { name: 'quality', time: metrics.qualityTime, target: 500 },
    { name: 'formatting', time: metrics.formattingTime, target: 200 }
  ];

  for (const component of components) {
    if (component.time !== undefined && component.time !== null) {
      totalChecks++;

      if (component.time <= component.target) {
        totalPoints++;
      } else if (component.time <= component.target * 1.5) {
        totalPoints += 0.7;
        issues.push({
          type: 'COMPONENT_SLOW',
          component: component.name,
          time: component.time,
          target: component.target,
          severity: 'minor',
          impact: -0.005
        });
      } else if (component.time <= component.target * 2) {
        totalPoints += 0.4;
        issues.push({
          type: 'COMPONENT_BOTTLENECK',
          component: component.name,
          time: component.time,
          target: component.target,
          severity: 'major',
          impact: -0.01,
          suggestion: `Optimize ${component.name} processing`
        });
      } else {
        issues.push({
          type: 'COMPONENT_CRITICAL',
          component: component.name,
          time: component.time,
          target: component.target,
          severity: 'critical',
          impact: -0.02,
          suggestion: `Critical: ${component.name} is primary bottleneck`
        });
      }
    }
  }

  const points = totalChecks > 0 ? totalPoints / totalChecks : 0.5;
  return { points, maxPoints: 1, issues };
}

/**
 * Evaluate extraction efficiency
 */
function evaluateExtractionEfficiency(metrics) {
  const issues = [];
  let points = 0;
  const maxPoints = 1;

  // Check cache utilization
  if (metrics.cacheHits !== undefined && metrics.cacheMisses !== undefined) {
    const totalRequests = metrics.cacheHits + metrics.cacheMisses;
    if (totalRequests > 0) {
      const cacheHitRate = metrics.cacheHits / totalRequests;

      if (cacheHitRate >= 0.8) {
        points = 1;
      } else if (cacheHitRate >= 0.6) {
        points = 0.7;
        issues.push({
          type: 'LOW_CACHE_HIT_RATE',
          rate: cacheHitRate,
          severity: 'minor',
          impact: -0.005,
          suggestion: 'Improve caching strategy'
        });
      } else {
        points = 0.4;
        issues.push({
          type: 'POOR_CACHE_UTILIZATION',
          rate: cacheHitRate,
          severity: 'major',
          impact: -0.01,
          suggestion: 'Cache underutilized - implement better caching'
        });
      }
    } else {
      points = 0.5; // No cache data
    }
  } else {
    // Check extraction pattern efficiency
    if (metrics.extractionTime && metrics.dataSize) {
      const bytesPerMs = metrics.dataSize / metrics.extractionTime;

      if (bytesPerMs >= 100) { // 100KB/s or faster
        points = 1;
      } else if (bytesPerMs >= 50) {
        points = 0.7;
        issues.push({
          type: 'SLOW_EXTRACTION_RATE',
          rate: bytesPerMs,
          severity: 'minor',
          impact: -0.005
        });
      } else {
        points = 0.4;
        issues.push({
          type: 'INEFFICIENT_EXTRACTION',
          rate: bytesPerMs,
          severity: 'major',
          impact: -0.01,
          suggestion: 'Optimize regex patterns and parsing logic'
        });
      }
    } else {
      points = 0.5; // No efficiency data
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate narrative generation speed
 */
function evaluateNarrativeGenerationSpeed(metrics) {
  const issues = [];
  let points = 0;
  const maxPoints = 1;

  if (!metrics.narrativeTime) {
    return { points: 0.5, maxPoints: 1, issues: [] };
  }

  // Check if using streaming
  if (metrics.streamingEnabled) {
    points += 0.2; // Bonus for streaming
  }

  // Check token generation rate
  if (metrics.tokensGenerated && metrics.narrativeTime) {
    const tokensPerSecond = (metrics.tokensGenerated / metrics.narrativeTime) * 1000;

    if (tokensPerSecond >= 100) {
      points += 0.8;
    } else if (tokensPerSecond >= 50) {
      points += 0.5;
      issues.push({
        type: 'SLOW_TOKEN_GENERATION',
        rate: tokensPerSecond,
        severity: 'minor',
        impact: -0.005,
        suggestion: 'Consider using faster model or optimizing prompts'
      });
    } else {
      points += 0.2;
      issues.push({
        type: 'VERY_SLOW_GENERATION',
        rate: tokensPerSecond,
        severity: 'major',
        impact: -0.01,
        suggestion: 'Token generation bottleneck detected'
      });
    }
  } else {
    // Fallback to time-based scoring
    const targetTime = 1500; // 1.5 seconds target

    if (metrics.narrativeTime <= targetTime) {
      points = 1;
    } else if (metrics.narrativeTime <= targetTime * 2) {
      points = 0.6;
      issues.push({
        type: 'SLOW_NARRATIVE_GENERATION',
        time: metrics.narrativeTime,
        severity: 'minor',
        impact: -0.005
      });
    } else {
      points = 0.3;
      issues.push({
        type: 'NARRATIVE_BOTTLENECK',
        time: metrics.narrativeTime,
        severity: 'major',
        impact: -0.01
      });
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate data freshness
 */
function evaluateDataFreshness(extractedData) {
  const issues = [];
  let points = 0;
  const maxPoints = 1;

  // Check if discharge date is recent
  if (extractedData.dates?.dischargeDate) {
    const dischargeDate = new Date(extractedData.dates.dischargeDate);
    const now = new Date();
    const daysSinceDischarge = (now - dischargeDate) / (1000 * 60 * 60 * 24);

    if (daysSinceDischarge <= 2) {
      // Very fresh data
      points = 1;
    } else if (daysSinceDischarge <= 7) {
      // Fresh data
      points = 0.8;
    } else if (daysSinceDischarge <= 30) {
      // Acceptable freshness
      points = 0.6;
      issues.push({
        type: 'AGING_DATA',
        days: Math.round(daysSinceDischarge),
        severity: 'minor',
        impact: -0.005,
        suggestion: 'Consider regenerating for more recent data'
      });
    } else if (daysSinceDischarge <= 90) {
      // Stale data
      points = 0.3;
      issues.push({
        type: 'STALE_DATA',
        days: Math.round(daysSinceDischarge),
        severity: 'major',
        impact: -0.01,
        suggestion: 'Data is outdated - regenerate summary'
      });
    } else {
      // Very stale data
      points = 0;
      issues.push({
        type: 'VERY_STALE_DATA',
        days: Math.round(daysSinceDischarge),
        severity: 'critical',
        impact: -0.02,
        suggestion: 'Critical: Summary is over 3 months old'
      });
    }
  } else {
    // No discharge date to evaluate
    points = 0.5;
  }

  // Check last update timestamp if available
  if (extractedData.metadata?.lastUpdated) {
    const lastUpdate = new Date(extractedData.metadata.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      issues.push({
        type: 'UPDATE_NEEDED',
        hours: Math.round(hoursSinceUpdate),
        severity: 'minor',
        impact: -0.005,
        suggestion: 'Consider refreshing extracted data'
      });
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Identify performance bottlenecks
 */
function identifyBottlenecks(metrics) {
  const bottlenecks = [];

  if (!metrics || Object.keys(metrics).length === 0) {
    return bottlenecks;
  }

  // Identify slowest component
  const components = [
    { name: 'extraction', time: metrics.extractionTime },
    { name: 'narrative', time: metrics.narrativeTime },
    { name: 'quality', time: metrics.qualityTime },
    { name: 'formatting', time: metrics.formattingTime }
  ].filter(c => c.time !== undefined && c.time !== null);

  if (components.length > 0) {
    components.sort((a, b) => b.time - a.time);

    const slowest = components[0];
    const total = components.reduce((sum, c) => sum + c.time, 0);

    if (total > 0) {
      const percentage = (slowest.time / total) * 100;

      if (percentage > 50) {
        bottlenecks.push({
          component: slowest.name,
          time: slowest.time,
          percentage: Math.round(percentage),
          severity: 'critical',
          recommendation: `${slowest.name} is consuming ${Math.round(percentage)}% of processing time`
        });
      } else if (percentage > 35) {
        bottlenecks.push({
          component: slowest.name,
          time: slowest.time,
          percentage: Math.round(percentage),
          severity: 'major',
          recommendation: `Optimize ${slowest.name} for better performance`
        });
      }
    }
  }

  // Check for memory issues
  if (metrics.memoryUsed && metrics.memoryLimit) {
    const memoryUsage = metrics.memoryUsed / metrics.memoryLimit;

    if (memoryUsage > 0.9) {
      bottlenecks.push({
        component: 'memory',
        usage: Math.round(memoryUsage * 100),
        severity: 'critical',
        recommendation: 'High memory usage detected - risk of OOM errors'
      });
    } else if (memoryUsage > 0.7) {
      bottlenecks.push({
        component: 'memory',
        usage: Math.round(memoryUsage * 100),
        severity: 'major',
        recommendation: 'Consider optimizing memory usage'
      });
    }
  }

  // Check for API rate limiting
  if (metrics.apiThrottled) {
    bottlenecks.push({
      component: 'api',
      throttled: true,
      severity: 'major',
      recommendation: 'API rate limiting detected - implement backoff strategy'
    });
  }

  return bottlenecks;
}

export default {
  calculateTimelinessScore
};