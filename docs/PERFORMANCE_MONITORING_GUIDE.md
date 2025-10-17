# Performance Monitoring Guide

**Version:** 1.0
**Last Updated:** October 2025

---

## Overview

The DCS Performance Monitoring system provides comprehensive timing measurements, automatic performance warnings, and detailed metrics for all critical operations. This guide explains how to use and interpret the performance monitoring features.

---

## Features

### 1. Automatic Timing
- All major operations (extraction, intelligence, narrative, orchestration) are automatically timed
- No manual instrumentation required for main workflows

### 2. Performance Warnings
- **WARNING** level: Operation exceeded expected duration (yellow flag)
- **CRITICAL** level: Operation significantly slower than normal (red flag)
- Automatic console warnings with severity indicators

### 3. Metrics Collection
- Historical performance data
- Per-operation timing breakdowns
- Success/failure tracking
- Metadata (parameters, context, results)

### 4. Performance Reports
- Summary statistics (avg, min, max, median)
- Breakdown by category
- Slowest operations identification
- Severity distribution

---

## Performance Thresholds

### Phase-Level Thresholds

| Phase | Warning | Critical |
|-------|---------|----------|
| **Extraction** | 15s | 30s |
| **Intelligence** | 5s | 10s |
| **Narrative** | 12s | 25s |
| **Orchestration** | 35s | 60s |

### Component-Level Thresholds

| Component | Warning | Critical |
|-----------|---------|----------|
| **LLM Call** | 10s | 20s |
| **Validation** | 2s | 5s |
| **Quality Metrics** | 1s | 3s |
| **Database Operation** | 0.5s | 2s |
| **Learning** | 3s | 8s |

---

## Usage

### 1. Basic Usage (Orchestrator - Already Integrated)

The orchestrator automatically monitors performance:

```javascript
import { orchestrateSummaryGeneration } from './services/summaryOrchestrator.js';

const result = await orchestrateSummaryGeneration(notes, {
  enableLearning: true,
  enableFeedbackLoops: true
});

// Performance metrics included in result
console.log('Performance:', result.metadata.performanceMetrics);
```

**Output:**
```javascript
{
  contextBuilding: { duration: 245, severity: 'info' },
  extraction: { duration: 12500, severity: 'info' },
  intelligence: { duration: 3200, severity: 'info' },
  validation: { duration: 850, severity: 'info' },
  narrative: { duration: 9800, severity: 'info' },
  qualityMetrics: { duration: 520, severity: 'info' },
  overall: { duration: 26500, severity: 'info' }
}
```

###2. Manual Timing for Custom Operations

```javascript
import performanceMonitor from '../utils/performanceMonitor.js';

// Start timer
const timerId = performanceMonitor.startTimer(
  'My Custom Operation',
  'custom_category',
  { someMetadata: 'value' }
);

// ... perform operation ...

// End timer
const metric = performanceMonitor.endTimer(timerId);

console.log('Operation took:', metric.duration, 'ms');
console.log('Severity:', metric.severity);
```

### 3. Measure Async Functions

```javascript
import performanceMonitor from '../utils/performanceMonitor.js';

async function mySlowFunction() {
  // ... some async work ...
  return result;
}

// Automatically measure and get warnings
const result = await performanceMonitor.measureAsync(
  'My Slow Function',
  'custom',
  mySlowFunction
);
```

### 4. Measure Synchronous Functions

```javascript
const result = performanceMonitor.measureSync(
  'Fast Calculation',
  'computation',
  () => {
    // ... some computation ...
    return calculationResult;
  }
);
```

---

## Viewing Performance Metrics

### Get All Metrics

```javascript
import performanceMonitor from '../utils/performanceMonitor.js';

// Get all recorded metrics
const allMetrics = performanceMonitor.getMetrics();

console.log('Total operations:', allMetrics.length);
```

### Filter Metrics

```javascript
// Get only extraction metrics
const extractionMetrics = performanceMonitor.getMetrics({
  category: 'extraction'
});

// Get only slow operations
const slowMetrics = performanceMonitor.getMetrics({
  severity: 'warning'
});

// Get metrics from last hour
const recentMetrics = performanceMonitor.getMetrics({
  timeRange: {
    start: new Date(Date.now() - 3600000),
    end: new Date()
  }
});
```

### Generate Performance Report

```javascript
const report = performanceMonitor.generateReport();

console.log('Summary:', report.summary);
/*
{
  totalOperations: 45,
  totalTime: 125000,
  avgTime: 2777,
  minTime: 120,
  maxTime: 18500,
  medianTime: 2100
}
*/

console.log('By Category:', report.byCategory);
/*
{
  extraction: { count: 10, avgDuration: 12300, ... },
  intelligence: { count: 10, avgDuration: 3400, ... },
  narrative: { count: 10, avgDuration: 9800, ... },
  ...
}
*/

console.log('Slowest Operations:', report.slowest);
```

### Log Performance Summary

```javascript
// Pretty-print performance summary to console
performanceMonitor.logSummary();
```

**Console Output:**
```
============================================================
PERFORMANCE MONITORING SUMMARY
============================================================
Total Operations: 45
Total Time: 125000ms
Average Time: 2777ms
Min Time: 120ms
Max Time: 18500ms
Median Time: 2100ms

By Severity:
  ✓ Info: 39
  ⚠️  Warning: 5
  🔴 Critical: 1

By Category:
  extraction:
    Count: 10
    Avg: 12300ms
    Range: 9500ms - 18500ms
  intelligence:
    Count: 10
    Avg: 3400ms
    Range: 2800ms - 4200ms
  ...

Slowest Operations:
  1. 🔴 Phase 1: Extraction (extraction): 18500ms
  2. ⚠️  Phase 3: Narrative Generation (narrative): 14200ms
  3. ⚠️  Phase 1: Extraction (extraction): 13800ms
  4. ✓ Phase 3: Narrative Generation (narrative): 12100ms
  5. ✓ Phase 1: Extraction (extraction): 11900ms
============================================================
```

---

## Interpreting Performance Warnings

### INFO Level (✓)
- **Meaning:** Operation completed within expected time
- **Action:** No action needed
- **Example:** Extraction took 11s (threshold: 15s)

### WARNING Level (⚠️)
- **Meaning:** Operation took longer than expected
- **Action:** Investigate if pattern persists
- **Example:** Extraction took 18s (threshold: 15s)
- **Possible Causes:**
  - Large input notes
  - Complex pathology
  - Slow LLM response
  - Network latency

### CRITICAL Level (🔴)
- **Meaning:** Operation significantly slower than normal
- **Action:** Immediate investigation required
- **Example:** Extraction took 35s (threshold: 30s)
- **Possible Causes:**
  - LLM timeout/retry
  - Very large input (>50KB)
  - Resource constraints
  - API rate limiting

---

## Performance Optimization Tips

### 1. Monitor Trends
```javascript
// Check if performance is degrading over time
const lastHourMetrics = performanceMonitor.getMetrics({
  timeRange: {
    start: new Date(Date.now() - 3600000),
    end: new Date()
  }
});

const avgDuration = lastHourMetrics.reduce((sum, m) => sum + m.duration, 0) / lastHourMetrics.length;

if (avgDuration > 30000) {
  console.warn('⚠️  Average performance degraded: ', avgDuration, 'ms');
}
```

### 2. Identify Bottlenecks
```javascript
const report = performanceMonitor.generateReport();

// Find slowest category
const slowestCategory = Object.entries(report.byCategory)
  .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)[0];

console.log('Slowest category:', slowestCategory[0], '-', slowestCategory[1].avgDuration, 'ms');
```

### 3. Track Performance After Changes
```javascript
// Before code change
const beforeReport = performanceMonitor.generateReport();

// ... make code changes ...

// Clear old metrics
performanceMonitor.clearMetrics();

// ... test new code ...

// After code change
const afterReport = performanceMonitor.generateReport();

console.log('Performance improvement:',
  beforeReport.summary.avgTime - afterReport.summary.avgTime, 'ms');
```

---

## Maintenance

### Clear Old Metrics

```javascript
// Clear metrics older than 1 hour
performanceMonitor.clearOldMetrics(3600000);

// Clear all metrics
performanceMonitor.clearMetrics();
```

### Check Memory Usage

```javascript
const status = performanceMonitor.getStatus();

console.log('Metrics count:', status.metricsCount);
console.log('Memory usage:', status.memoryUsage);
console.log('Active timers:', status.activeTimers);
```

### Export Metrics

```javascript
// Export to JSON for external analysis
const jsonMetrics = performanceMonitor.exportMetrics();

// Save to file or send to analytics service
fs.writeFileSync('performance-metrics.json', jsonMetrics);
```

### Enable/Disable Monitoring

```javascript
// Disable monitoring (for production if needed)
performanceMonitor.disable();

// Re-enable monitoring
performanceMonitor.enable();

// Check status
const status = performanceMonitor.getStatus();
console.log('Monitoring enabled:', status.enabled);
```

---

## Example: Custom Service Integration

```javascript
import performanceMonitor from '../utils/performanceMonitor.js';

export async function myCustomService(input) {
  const timerId = performanceMonitor.startTimer(
    'Custom Service',
    'custom',
    { inputSize: input.length }
  );

  try {
    // Step 1: Parse input
    const step1Timer = performanceMonitor.startTimer('Parsing Input', 'custom');
    const parsed = parseInput(input);
    performanceMonitor.endTimer(step1Timer);

    // Step 2: Process data
    const step2Timer = performanceMonitor.startTimer('Processing Data', 'custom');
    const processed = await processData(parsed);
    performanceMonitor.endTimer(step2Timer);

    // Step 3: Generate output
    const step3Timer = performanceMonitor.startTimer('Generating Output', 'custom');
    const output = generateOutput(processed);
    performanceMonitor.endTimer(step3Timer);

    const metric = performanceMonitor.endTimer(timerId, { success: true });

    return {
      result: output,
      performanceMetric: metric
    };

  } catch (error) {
    performanceMonitor.endTimer(timerId, {
      success: false,
      error: error.message
    });
    throw error;
  }
}
```

---

## Integration with Existing Test Suites

Performance metrics are automatically collected during test runs:

```javascript
// Run test
await orchestrateSummaryGeneration(testNotes);

// Check performance after test
const metrics = performanceMonitor.getMetrics();
const testMetrics = metrics.filter(m => m.name === 'Complete Orchestration');

console.log('Test performance:', testMetrics[0].duration, 'ms');

// Generate test performance report
const report = performanceMonitor.generateReport();
console.log('Test run summary:', report.summary);
```

---

## Troubleshooting

### Issue: No Metrics Recorded

**Cause:** Performance monitoring disabled

**Solution:**
```javascript
performanceMonitor.enable();
```

---

### Issue: Too Many Metrics (Memory Usage High)

**Cause:** Metrics not being cleared

**Solution:**
```javascript
// Auto-clear metrics older than 1 hour periodically
setInterval(() => {
  performanceMonitor.clearOldMetrics(3600000);
}, 600000); // Every 10 minutes
```

---

### Issue: Inconsistent Performance Measurements

**Cause:** Browser/system performance varies

**Solution:**
- Run multiple tests and use median instead of average
- Use the `report.summary.medianTime` instead of `avgTime`
- Clear metrics between test runs for isolated measurements

---

## Best Practices

1. **Always Use Try-Catch**
   - Ensure `endTimer()` is called even if operation fails
   - Pass error information to `endTimer()` for tracking

2. **Include Meaningful Metadata**
   - Add context that helps identify performance bottlenecks
   - Examples: input size, pathology type, iteration count

3. **Monitor Regularly**
   - Generate performance reports weekly
   - Track trends over time
   - Set up automated alerts for critical performance degradation

4. **Clean Up Metrics**
   - Clear old metrics periodically
   - Export and archive metrics for long-term analysis
   - Keep only recent metrics in memory

5. **Use Categories Consistently**
   - Stick to defined categories (extraction, intelligence, narrative, etc.)
   - Makes filtering and reporting easier
   - Enables category-specific threshold tuning

---

## API Reference

See `src/utils/performanceMonitor.js` for complete API documentation.

### Main Methods

- `startTimer(name, category, metadata)` - Start timing an operation
- `endTimer(timerId, metadata)` - End timing and record metric
- `measureAsync(name, category, fn, metadata)` - Measure async function
- `measureSync(name, category, fn, metadata)` - Measure sync function
- `getMetrics(filters)` - Get recorded metrics
- `generateReport(options)` - Generate performance report
- `logSummary()` - Pretty-print report to console
- `clearMetrics()` - Clear all metrics
- `clearOldMetrics(maxAge)` - Clear metrics older than maxAge
- `exportMetrics()` - Export metrics to JSON
- `enable()` / `disable()` - Enable/disable monitoring
- `getStatus()` - Get monitoring status

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture overview
- [PHASE_INTEGRATION_GUIDE.md](../PHASE_INTEGRATION_GUIDE.md) - Phase integration details

---

**Document Maintained By:** DCS Development Team
**Next Review:** December 2025
