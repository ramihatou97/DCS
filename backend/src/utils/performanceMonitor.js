/**
 * Performance Monitor Utility
 *
 * Provides comprehensive performance monitoring for the DCS system:
 * - Operation timing measurements
 * - Performance warnings for slow operations
 * - Metrics collection and analysis
 * - Performance reports
 *
 * @module performanceMonitor
 */

// ========================================
// CONSTANTS
// ========================================

/**
 * Performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  // Phase-level thresholds
  EXTRACTION: {
    WARNING: 15000,    // 15 seconds
    CRITICAL: 30000    // 30 seconds
  },
  INTELLIGENCE: {
    WARNING: 5000,     // 5 seconds
    CRITICAL: 10000    // 10 seconds
  },
  NARRATIVE: {
    WARNING: 12000,    // 12 seconds
    CRITICAL: 25000    // 25 seconds
  },
  ORCHESTRATION: {
    WARNING: 35000,    // 35 seconds
    CRITICAL: 60000    // 60 seconds (1 minute)
  },

  // Component-level thresholds
  LLM_CALL: {
    WARNING: 10000,    // 10 seconds
    CRITICAL: 20000    // 20 seconds
  },
  VALIDATION: {
    WARNING: 2000,     // 2 seconds
    CRITICAL: 5000     // 5 seconds
  },
  QUALITY_METRICS: {
    WARNING: 1000,     // 1 second
    CRITICAL: 3000     // 3 seconds
  },
  DATABASE_OPERATION: {
    WARNING: 500,      // 0.5 seconds
    CRITICAL: 2000     // 2 seconds
  },
  LEARNING: {
    WARNING: 3000,     // 3 seconds
    CRITICAL: 8000     // 8 seconds
  }
};

/**
 * Severity levels for performance warnings
 */
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

// ========================================
// PERFORMANCE MONITOR CLASS
// ========================================

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.activeTimers = new Map();
    this.enabled = true;
  }

  /**
   * Start timing an operation
   *
   * @param {string} operationName - Name of the operation
   * @param {string} category - Category (extraction, intelligence, narrative, etc.)
   * @param {object} metadata - Additional metadata
   * @returns {string} Timer ID
   */
  startTimer(operationName, category = 'general', metadata = {}) {
    if (!this.enabled) return null;

    const timerId = `${operationName}_${Date.now()}`;

    this.activeTimers.set(timerId, {
      name: operationName,
      category,
      startTime: performance.now(),
      startTimestamp: new Date().toISOString(),
      metadata
    });

    return timerId;
  }

  /**
   * End timing an operation and record metrics
   *
   * @param {string} timerId - Timer ID from startTimer
   * @param {object} additionalMetadata - Additional metadata to add
   * @returns {object} Performance metric
   */
  endTimer(timerId, additionalMetadata = {}) {
    if (!this.enabled || !timerId) return null;

    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      console.warn(`[PerformanceMonitor] Timer not found: ${timerId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - timer.startTime;

    const metric = {
      name: timer.name,
      category: timer.category,
      duration: Math.round(duration),
      startTime: timer.startTimestamp,
      endTime: new Date().toISOString(),
      metadata: { ...timer.metadata, ...additionalMetadata },
      severity: this.calculateSeverity(timer.category, duration)
    };

    // Store metric
    this.metrics.push(metric);

    // Check for warnings
    this.checkThreshold(metric);

    // Clean up timer
    this.activeTimers.delete(timerId);

    return metric;
  }

  /**
   * Calculate severity based on duration and thresholds
   *
   * @param {string} category - Operation category
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Severity level
   */
  calculateSeverity(category, duration) {
    const threshold = PERFORMANCE_THRESHOLDS[category?.toUpperCase()] ||
                     PERFORMANCE_THRESHOLDS.LLM_CALL;

    if (duration >= threshold.CRITICAL) {
      return SEVERITY.CRITICAL;
    }
    if (duration >= threshold.WARNING) {
      return SEVERITY.WARNING;
    }
    return SEVERITY.INFO;
  }

  /**
   * Check if operation exceeds performance thresholds
   *
   * @param {object} metric - Performance metric
   */
  checkThreshold(metric) {
    if (metric.severity === SEVERITY.WARNING) {
      console.warn(
        `[PerformanceMonitor] ⚠️  SLOW OPERATION: ${metric.name} (${metric.category}) took ${metric.duration}ms`
      );
    } else if (metric.severity === SEVERITY.CRITICAL) {
      console.error(
        `[PerformanceMonitor] 🔴 CRITICAL PERFORMANCE: ${metric.name} (${metric.category}) took ${metric.duration}ms`
      );
    }
  }

  /**
   * Measure an async function's execution time
   *
   * @param {string} operationName - Name of the operation
   * @param {string} category - Category
   * @param {Function} fn - Async function to measure
   * @param {object} metadata - Additional metadata
   * @returns {Promise<any>} Function result
   */
  async measureAsync(operationName, category, fn, metadata = {}) {
    if (!this.enabled) {
      return await fn();
    }

    const timerId = this.startTimer(operationName, category, metadata);

    try {
      const result = await fn();
      this.endTimer(timerId, { success: true });
      return result;
    } catch (error) {
      this.endTimer(timerId, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Measure a synchronous function's execution time
   *
   * @param {string} operationName - Name of the operation
   * @param {string} category - Category
   * @param {Function} fn - Synchronous function to measure
   * @param {object} metadata - Additional metadata
   * @returns {any} Function result
   */
  measureSync(operationName, category, fn, metadata = {}) {
    if (!this.enabled) {
      return fn();
    }

    const timerId = this.startTimer(operationName, category, metadata);

    try {
      const result = fn();
      this.endTimer(timerId, { success: true });
      return result;
    } catch (error) {
      this.endTimer(timerId, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   *
   * @param {object} filters - Optional filters (category, severity, timeRange)
   * @returns {Array<object>} Filtered metrics
   */
  getMetrics(filters = {}) {
    let filtered = [...this.metrics];

    if (filters.category) {
      filtered = filtered.filter(m => m.category === filters.category);
    }

    if (filters.severity) {
      filtered = filtered.filter(m => m.severity === filters.severity);
    }

    if (filters.timeRange) {
      const { start, end } = filters.timeRange;
      filtered = filtered.filter(m => {
        const time = new Date(m.startTime);
        return time >= start && time <= end;
      });
    }

    return filtered;
  }

  /**
   * Generate performance report
   *
   * @param {object} options - Report options
   * @returns {object} Performance report
   */
  generateReport(options = {}) {
    const metrics = this.getMetrics(options.filters || {});

    if (metrics.length === 0) {
      return {
        summary: { totalOperations: 0 },
        message: 'No metrics recorded'
      };
    }

    // Calculate statistics
    const durations = metrics.map(m => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const avg = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const median = this.calculateMedian(durations);

    // Group by category
    const byCategory = {};
    metrics.forEach(m => {
      if (!byCategory[m.category]) {
        byCategory[m.category] = {
          count: 0,
          totalDuration: 0,
          durations: []
        };
      }
      byCategory[m.category].count++;
      byCategory[m.category].totalDuration += m.duration;
      byCategory[m.category].durations.push(m.duration);
    });

    // Calculate category stats
    Object.keys(byCategory).forEach(category => {
      const cat = byCategory[category];
      cat.avgDuration = Math.round(cat.totalDuration / cat.count);
      cat.minDuration = Math.min(...cat.durations);
      cat.maxDuration = Math.max(...cat.durations);
      cat.medianDuration = Math.round(this.calculateMedian(cat.durations));
      delete cat.durations; // Remove raw data from report
    });

    // Count by severity
    const bySeverity = {
      [SEVERITY.INFO]: metrics.filter(m => m.severity === SEVERITY.INFO).length,
      [SEVERITY.WARNING]: metrics.filter(m => m.severity === SEVERITY.WARNING).length,
      [SEVERITY.CRITICAL]: metrics.filter(m => m.severity === SEVERITY.CRITICAL).length
    };

    // Find slowest operations
    const slowest = [...metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(m => ({
        name: m.name,
        category: m.category,
        duration: m.duration,
        severity: m.severity,
        timestamp: m.startTime
      }));

    return {
      summary: {
        totalOperations: metrics.length,
        totalTime: Math.round(total),
        avgTime: Math.round(avg),
        minTime: min,
        maxTime: max,
        medianTime: Math.round(median)
      },
      bySeverity,
      byCategory,
      slowest,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate median of array
   *
   * @param {Array<number>} arr - Array of numbers
   * @returns {number} Median value
   */
  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
    console.log('[PerformanceMonitor] Metrics cleared');
  }

  /**
   * Clear metrics older than specified time
   *
   * @param {number} maxAge - Max age in milliseconds
   */
  clearOldMetrics(maxAge = 3600000) { // Default: 1 hour
    const cutoffTime = new Date(Date.now() - maxAge);
    const initialCount = this.metrics.length;

    this.metrics = this.metrics.filter(m =>
      new Date(m.startTime) >= cutoffTime
    );

    const removed = initialCount - this.metrics.length;
    if (removed > 0) {
      console.log(`[PerformanceMonitor] Cleared ${removed} old metrics`);
    }
  }

  /**
   * Enable performance monitoring
   */
  enable() {
    this.enabled = true;
    console.log('[PerformanceMonitor] Monitoring enabled');
  }

  /**
   * Disable performance monitoring
   */
  disable() {
    this.enabled = false;
    console.log('[PerformanceMonitor] Monitoring disabled');
  }

  /**
   * Get current monitoring status
   *
   * @returns {object} Status information
   */
  getStatus() {
    return {
      enabled: this.enabled,
      metricsCount: this.metrics.length,
      activeTimers: this.activeTimers.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of stored metrics
   *
   * @returns {string} Formatted memory usage
   */
  estimateMemoryUsage() {
    const bytes = JSON.stringify(this.metrics).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  /**
   * Export metrics to JSON
   *
   * @returns {string} JSON string of metrics
   */
  exportMetrics() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.generateReport().summary
    }, null, 2);
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    const report = this.generateReport();

    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE MONITORING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Operations: ${report.summary.totalOperations}`);
    console.log(`Total Time: ${report.summary.totalTime}ms`);
    console.log(`Average Time: ${report.summary.avgTime}ms`);
    console.log(`Min Time: ${report.summary.minTime}ms`);
    console.log(`Max Time: ${report.summary.maxTime}ms`);
    console.log(`Median Time: ${report.summary.medianTime}ms`);

    console.log('\nBy Severity:');
    console.log(`  ✓ Info: ${report.bySeverity.info}`);
    console.log(`  ⚠️  Warning: ${report.bySeverity.warning}`);
    console.log(`  🔴 Critical: ${report.bySeverity.critical}`);

    console.log('\nBy Category:');
    Object.entries(report.byCategory).forEach(([category, stats]) => {
      console.log(`  ${category}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Avg: ${stats.avgDuration}ms`);
      console.log(`    Range: ${stats.minDuration}ms - ${stats.maxDuration}ms`);
    });

    if (report.slowest.length > 0) {
      console.log('\nSlowest Operations:');
      report.slowest.slice(0, 5).forEach((op, idx) => {
        const icon = op.severity === 'critical' ? '🔴' :
                    op.severity === 'warning' ? '⚠️' : '✓';
        console.log(`  ${idx + 1}. ${icon} ${op.name} (${op.category}): ${op.duration}ms`);
      });
    }

    console.log('='.repeat(60) + '\n');
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;

// ========================================
// DECORATOR FUNCTIONS
// ========================================

/**
 * Decorator to automatically measure async function performance
 *
 * @param {string} category - Operation category
 * @returns {Function} Decorator function
 */
function measurePerformance(category) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const operationName = `${target.constructor.name}.${propertyKey}`;
      return await performanceMonitor.measureAsync(
        operationName,
        category,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Helper function to wrap any async function with performance monitoring
 *
 * @param {string} operationName - Name of the operation
 * @param {string} category - Category
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function withPerformanceMonitoring(operationName, category, fn) {
  return async (...args) => {
    return await performanceMonitor.measureAsync(
      operationName,
      category,
      () => fn(...args)
    );
  };
}
