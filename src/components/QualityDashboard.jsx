/**
 * Quality Dashboard Component
 * 
 * Phase 3 Step 4: Display quality metrics for extraction and summary
 * 
 * Shows:
 * - Overall quality score
 * - Extraction quality metrics
 * - Validation quality metrics
 * - Summary quality metrics
 * - Detailed breakdowns and insights
 */

import React, { useState } from 'react';
import {
  Activity, CheckCircle, AlertTriangle, XCircle, Info,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BarChart3, FileText, Shield, Sparkles
} from 'lucide-react';

const QualityDashboard = ({ metrics }) => {
  const [expandedSections, setExpandedSections] = useState({
    extraction: false,
    validation: false,
    summary: false
  });

  if (!metrics) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const overallScore = metrics.overall || 0;
  const overallRating = getQualityRating(overallScore);

  return (
    <div className="card border-l-4 border-l-indigo-500 dark:border-l-indigo-400">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
          <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Quality Metrics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive quality assessment
          </p>
        </div>
        <QualityBadge score={overallScore} rating={overallRating} />
      </div>

      {/* Overall Score Card */}
      <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Quality Score</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {(overallScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(overallScore)}`}
            style={{ width: `${overallScore * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Extraction Metrics */}
      {metrics.extraction && (
        <CollapsibleSection
          title="Extraction Quality"
          subtitle={`${(metrics.extraction.score * 100).toFixed(1)}% - ${metrics.extraction.extractedFields}/${metrics.extraction.totalFields} fields`}
          expanded={expandedSections.extraction}
          onToggle={() => toggleSection('extraction')}
          icon={<FileText className="w-4 h-4" />}
        >
          <ExtractionMetricsContent metrics={metrics.extraction} />
        </CollapsibleSection>
      )}

      {/* Validation Metrics */}
      {metrics.validation && (
        <CollapsibleSection
          title="Validation Quality"
          subtitle={`${(metrics.validation.score * 100).toFixed(1)}% - ${metrics.validation.errorCount} errors, ${metrics.validation.warningCount} warnings`}
          expanded={expandedSections.validation}
          onToggle={() => toggleSection('validation')}
          icon={<Shield className="w-4 h-4" />}
        >
          <ValidationMetricsContent metrics={metrics.validation} />
        </CollapsibleSection>
      )}

      {/* Summary Metrics */}
      {metrics.summary && (
        <CollapsibleSection
          title="Summary Quality"
          subtitle={`${(metrics.summary.score * 100).toFixed(1)}% - ${metrics.summary.wordCount} words, ${metrics.summary.sectionCount} sections`}
          expanded={expandedSections.summary}
          onToggle={() => toggleSection('summary')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          <SummaryMetricsContent metrics={metrics.summary} />
        </CollapsibleSection>
      )}
    </div>
  );
};

/**
 * Quality Badge Component
 */
const QualityBadge = ({ score, rating }) => {
  const colors = {
    green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    red: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
  };

  const bgColor = colors[rating.color] || colors.blue;

  return (
    <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${bgColor}`}>
      {rating.rating}
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection = ({ title, subtitle, expanded, onToggle, icon, children }) => {
  return (
    <div className="mb-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-gray-600 dark:text-gray-400">{icon}</div>
          <div className="text-left">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{title}</div>
            {subtitle && (
              <div className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</div>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Extraction Metrics Content
 */
const ExtractionMetricsContent = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <MetricRow
        label="Completeness"
        value={`${(metrics.completeness * 100).toFixed(1)}%`}
        score={metrics.completeness}
      />
      <MetricRow
        label="Confidence"
        value={`${(metrics.confidence * 100).toFixed(1)}%`}
        score={metrics.confidence}
      />
      <MetricRow
        label="Extracted Fields"
        value={`${metrics.extractedFields} / ${metrics.totalFields}`}
        score={metrics.extractedFields / metrics.totalFields}
      />

      {metrics.missingFields && metrics.missingFields.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            Missing Fields:
          </div>
          <div className="flex flex-wrap gap-2">
            {metrics.missingFields.map((field, idx) => (
              <span key={idx} className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Validation Metrics Content
 */
const ValidationMetricsContent = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <MetricRow
        label="Pass Rate"
        value={`${(metrics.passRate * 100).toFixed(1)}%`}
        score={metrics.passRate}
      />
      <MetricRow
        label="Validation Status"
        value={metrics.isValid ? 'Valid' : 'Invalid'}
        score={metrics.isValid ? 1.0 : 0.5}
      />

      {/* Error Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Critical</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">{metrics.criticalErrors}</div>
        </div>
        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Major</div>
          <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{metrics.majorErrors}</div>
        </div>
        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Minor</div>
          <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{metrics.minorErrors}</div>
        </div>
      </div>

      {/* Errors List */}
      {metrics.errors && metrics.errors.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
          <div className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
            Errors:
          </div>
          <ul className="space-y-1">
            {metrics.errors.slice(0, 5).map((error, idx) => (
              <li key={idx} className="text-sm text-red-800 dark:text-red-200 flex items-start">
                <span className="mr-2">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings List */}
      {metrics.warnings && metrics.warnings.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            Warnings:
          </div>
          <ul className="space-y-1">
            {metrics.warnings.slice(0, 5).map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
                <span className="mr-2">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Summary Metrics Content
 */
const SummaryMetricsContent = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <MetricRow
        label="Readability"
        value={`${(metrics.readability * 100).toFixed(1)}%`}
        score={metrics.readability}
      />
      <MetricRow
        label="Completeness"
        value={`${(metrics.completeness * 100).toFixed(1)}%`}
        score={metrics.completeness}
      />
      <MetricRow
        label="Coherence"
        value={`${(metrics.coherence * 100).toFixed(1)}%`}
        score={metrics.coherence}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Word Count</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metrics.wordCount}</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Sections</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metrics.sectionCount}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Row Component
 */
const MetricRow = ({ label, value, score }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
        <ScoreIndicator score={score} />
      </div>
    </div>
  );
};

/**
 * Score Indicator Component
 */
const ScoreIndicator = ({ score }) => {
  if (score >= 0.8) {
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  } else if (score >= 0.6) {
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  } else {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

/**
 * Get quality rating from score
 */
function getQualityRating(score) {
  if (score >= 0.9) return { rating: 'Excellent', color: 'green' };
  if (score >= 0.8) return { rating: 'Good', color: 'blue' };
  if (score >= 0.7) return { rating: 'Fair', color: 'yellow' };
  if (score >= 0.6) return { rating: 'Poor', color: 'orange' };
  return { rating: 'Very Poor', color: 'red' };
}

/**
 * Get score color class
 */
function getScoreColor(score) {
  if (score >= 0.9) return 'bg-green-500';
  if (score >= 0.8) return 'bg-blue-500';
  if (score >= 0.7) return 'bg-yellow-500';
  if (score >= 0.6) return 'bg-orange-500';
  return 'bg-red-500';
}

export default QualityDashboard;

