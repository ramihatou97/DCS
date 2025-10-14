/**
 * SummaryGenerator Component
 * 
 * Displays generated discharge summary with export options.
 */

import React, { useState, useEffect } from 'react';
import { Download, Copy, FileText, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { generateDischargeSummary, exportSummary } from '../services/summaryGenerator.js';
import { formatNarrativeForExport } from '../services/narrativeEngine.js';

const SummaryGeneratorComponent = ({ extractedData, notes }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  /**
   * Generate summary on mount
   */
  useEffect(() => {
    if (extractedData && notes) {
      handleGenerate();
    }
  }, [extractedData, notes]);

  /**
   * Generate discharge summary
   */
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateDischargeSummary(notes, {
        validateData: true,
        format: 'structured',
        style: 'formal'
      });

      if (result.success) {
        setSummary(result);
      } else {
        setError(result.errors[0]?.message || 'Failed to generate summary');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy to clipboard
   */
  const handleCopy = async () => {
    if (!summary) return;

    const text = formatNarrativeForExport(summary.summary, {
      includeHeaders: true,
      sectionSeparator: '\n\n'
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  /**
   * Download as text file
   */
  const handleDownloadText = () => {
    if (!summary) return;

    const text = formatNarrativeForExport(summary.summary, {
      includeHeaders: true,
      sectionSeparator: '\n\n'
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discharge-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Download as JSON
   */
  const handleDownloadJSON = () => {
    if (!summary) return;

    const json = JSON.stringify(summary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discharge-summary-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium">Generating discharge summary...</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This may take a moment
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
              Generation Failed
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={handleGenerate}
              className="btn btn-sm mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          No summary generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Discharge Summary</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generated on {new Date(summary.metadata.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Quality Score */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {summary.qualityScore}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Quality Score
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {summary.validation && (
        <div className={`card ${
          summary.validation.isValid
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className={`w-5 h-5 ${
              summary.validation.isValid
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`} />
            <span>
              Validation: {summary.validation.confidence}% confidence
              {summary.validation.warningCount > 0 && (
                <span className="text-yellow-600 ml-2">
                  ({summary.validation.warningCount} warnings)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="btn btn-primary"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </>
          )}
        </button>
        <button
          onClick={handleDownloadText}
          className="btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Text
        </button>
        <button
          onClick={handleDownloadJSON}
          className="btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Download JSON
        </button>
        <button
          onClick={handleGenerate}
          className="btn"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </button>
      </div>

      {/* Summary Content */}
      <div className="space-y-4">
        {summary.summary.chiefComplaint && (
          <SummarySection title="Chief Complaint" content={summary.summary.chiefComplaint} />
        )}
        
        {summary.summary.historyOfPresentIllness && (
          <SummarySection 
            title="History of Present Illness" 
            content={summary.summary.historyOfPresentIllness} 
          />
        )}
        
        {summary.summary.hospitalCourse && (
          <SummarySection title="Hospital Course" content={summary.summary.hospitalCourse} />
        )}
        
        {summary.summary.procedures && (
          <SummarySection title="Procedures" content={summary.summary.procedures} />
        )}
        
        {summary.summary.complications && (
          <SummarySection title="Complications" content={summary.summary.complications} />
        )}
        
        {summary.summary.dischargeStatus && (
          <SummarySection title="Discharge Status" content={summary.summary.dischargeStatus} />
        )}
        
        {summary.summary.dischargeMedications && (
          <SummarySection 
            title="Discharge Medications" 
            content={summary.summary.dischargeMedications} 
          />
        )}
        
        {summary.summary.followUpPlan && (
          <SummarySection title="Follow-Up Plan" content={summary.summary.followUpPlan} />
        )}
      </div>

      {/* Metadata */}
      {summary.metadata && (
        <div className="card bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium mb-2">Summary Metadata</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Processing Time: {summary.metadata.processingTime}ms</p>
            <p>Note Count: {summary.metadata.noteCount}</p>
            {summary.metadata.pathologyTypes && (
              <p>Pathology Types: {summary.metadata.pathologyTypes.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <p className="text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> Review the summary carefully before using. You can edit any section
          by regenerating or copying to your EMR and editing there.
        </p>
      </div>
    </div>
  );
};

/**
 * Summary Section Component
 */
const SummarySection = ({ title, content }) => {
  if (!content || content === 'Not available.' || content === 'Not documented.') {
    return null;
  }

  return (
    <div className="card">
      <h3 className="font-medium text-lg mb-3 text-blue-900 dark:text-blue-100">
        {title.toUpperCase()}
      </h3>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
};

export default SummaryGeneratorComponent;
