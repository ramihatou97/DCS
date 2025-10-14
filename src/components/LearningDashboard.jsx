/**
 * Learning Dashboard Component
 *
 * Visualizes ML learning progress, accuracy metrics, and pattern performance.
 * Uses Recharts for data visualization.
 *
 * Features:
 * - Overall accuracy trends
 * - Correction frequency by field
 * - Learned patterns stats
 * - Pathology-specific performance
 * - Pattern library viewer
 * - Export/import learning data
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Target,
  Award,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import correctionTracker from '../services/ml/correctionTracker.js';
import learningEngine from '../services/ml/learningEngine.js';

/**
 * Color palette for charts
 */
const COLORS = {
  primary: '#8b5cf6', // purple-600
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
  chart: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'],
};

const LearningDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [correctionStats, setCorrectionStats] = useState(null);
  const [learningStats, setLearningStats] = useState(null);
  const [overallAccuracy, setOverallAccuracy] = useState(null);
  const [fieldAccuracies, setFieldAccuracies] = useState([]);
  const [correctionAnalysis, setCorrectionAnalysis] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load all statistics
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);

      // Load correction statistics
      const corrStats = await correctionTracker.getStatistics();
      setCorrectionStats(corrStats);

      // Load learning engine statistics
      const learnStats = await learningEngine.getStatistics();
      setLearningStats(learnStats);

      // Load overall accuracy
      const accuracy = await correctionTracker.getOverallAccuracy();
      setOverallAccuracy(accuracy);

      // Load field-level accuracies
      const fields = Object.keys(corrStats.mostCorrectedFields || {});
      const fieldAccs = await Promise.all(
        fields.map(field => correctionTracker.getFieldAccuracy(field))
      );
      setFieldAccuracies(fieldAccs.sort((a, b) => a.accuracy - b.accuracy)); // Sort by accuracy (lowest first)

      // Load correction analysis
      const analysis = await correctionTracker.analyzeCorrections();
      setCorrectionAnalysis(analysis);

      console.log('✅ Dashboard statistics loaded');
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh statistics
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  /**
   * Export learning data
   */
  const handleExport = async () => {
    try {
      const learningData = await learningEngine.exportLearning();
      const correctionData = await correctionTracker.exportCorrections();

      const exportData = {
        learning: learningData,
        corrections: correctionData,
        exportDate: new Date().toISOString(),
      };

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dcs-learning-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('✅ Learning data exported');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export: ${error.message}`);
    }
  };

  /**
   * Import learning data
   */
  const handleImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.learning || !data.corrections) {
        throw new Error('Invalid export file format');
      }

      // Import learning data
      await learningEngine.importLearning(data.learning);

      // Import corrections
      await correctionTracker.importCorrections(data.corrections);

      alert('Import successful! Refreshing dashboard...');
      await loadStatistics();
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Failed to import: ${error.message}`);
    }
  };

  /**
   * Clear all learning data
   */
  const handleClearAll = async () => {
    if (!confirm('⚠️ This will delete ALL learning data and corrections. This cannot be undone. Are you sure?')) {
      return;
    }

    if (!confirm('Are you REALLY sure? All patterns and corrections will be permanently deleted.')) {
      return;
    }

    try {
      await learningEngine.clearAllLearning();
      await correctionTracker.clearAllCorrections();
      alert('All learning data cleared.');
      await loadStatistics();
    } catch (error) {
      console.error('Clear failed:', error);
      alert(`Failed to clear: ${error.message}`);
    }
  };

  /**
   * Load statistics on mount
   */
  useEffect(() => {
    loadStatistics();
  }, []);

  /**
   * Format percentage
   */
  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend) => {
    if (trend === 'improving') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'declining') {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading learning statistics...</p>
        </div>
      </div>
    );
  }

  const hasData = correctionStats?.totalCorrections > 0 || learningStats?.totalPatterns > 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Dashboard</h1>
            <p className="text-sm text-gray-600">ML performance metrics and pattern library</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <label className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleClearAll}
            className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
            title="Clear All Learning Data"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!hasData && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Learning Data Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start using the app to generate summaries. As you make corrections, the system will learn and improve.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Edit extracted data</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Import summaries</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>System learns automatically</span>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall Accuracy */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercent(overallAccuracy?.accuracy || 0)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Overall Accuracy</h3>
              <p className="text-xs text-gray-500">
                {overallAccuracy?.totalCorrections || 0} corrections from {overallAccuracy?.totalFields || 0} fields
              </p>
            </div>

            {/* Total Corrections */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {correctionStats?.totalCorrections || 0}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Corrections</h3>
              <p className="text-xs text-gray-500">
                Avg {(correctionStats?.averageCorrectionsPerSummary || 0).toFixed(1)} per summary
              </p>
            </div>

            {/* Learned Patterns */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Brain className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {learningStats?.totalPatterns || 0}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Learned Patterns</h3>
              <p className="text-xs text-gray-500">
                {learningStats?.enabledPatterns || 0} active, {learningStats?.disabledPatterns || 0} disabled
              </p>
            </div>

            {/* Success Rate */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-amber-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercent(learningStats?.successRate || 0)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pattern Success Rate</h3>
              <p className="text-xs text-gray-500">
                {learningStats?.totalSuccesses || 0} / {learningStats?.totalApplications || 0} applications
              </p>
            </div>
          </div>

          {/* Field Accuracy Chart */}
          {fieldAccuracies.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Field-Level Accuracy
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fieldAccuracies.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="field"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(1)}%`}
                    labelFormatter={(label) => `Field: ${label}`}
                  />
                  <Bar dataKey="accuracy" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">
                Showing top 10 fields with lowest accuracy (improvement opportunities)
              </p>
            </div>
          )}

          {/* Correction Type Distribution */}
          {correctionAnalysis?.byType && Object.keys(correctionAnalysis.byType).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Correction Types Pie Chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Correction Types
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(correctionAnalysis.byType).map(([type, corrections]) => ({
                        name: type.replace('_', ' '),
                        value: corrections.length
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(correctionAnalysis.byType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Most Corrected Fields */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Most Corrected Fields
                </h3>
                <div className="space-y-3">
                  {Object.entries(correctionStats?.mostCorrectedFields || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([field, count], index) => {
                      const fieldAcc = fieldAccuracies.find(f => f.field === field);
                      return (
                        <div key={field} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-sm font-medium text-gray-700 w-4">
                              #{index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {field}
                              </p>
                              <p className="text-xs text-gray-500">
                                {count} corrections
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {fieldAcc && getTrendIcon(fieldAcc.trend)}
                            <span className="text-sm font-semibold text-gray-700">
                              {fieldAcc ? formatPercent(fieldAcc.accuracy) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Pattern Library */}
          {learningStats && learningStats.byField && Object.keys(learningStats.byField).length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pattern Library
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(learningStats.byField).map(([field, count]) => (
                  <div key={field} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {field}
                      </h4>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        {count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {count} learned pattern{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {correctionAnalysis?.recommendations && correctionAnalysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recommendations
              </h3>
              <div className="space-y-3">
                {correctionAnalysis.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      rec.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertCircle
                        className={`w-5 h-5 mt-0.5 ${
                          rec.priority === 'high'
                            ? 'text-red-600'
                            : rec.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {rec.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Action: {rec.action.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LearningDashboard;
