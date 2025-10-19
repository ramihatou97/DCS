/**
 * SummaryGenerator Component
 *
 * Displays generated discharge summary with export options and inline editing.
 * Tracks corrections for ML learning.
 */

import React, { useState, useEffect } from 'react';
import { Download, Copy, FileText, CheckCircle, Loader, RefreshCw, Edit2, Save, X } from 'lucide-react';
import { generateCompleteSummary, generateSummaryFromExtraction } from '../services/summaryAPI.js';
import { generateNarrative } from '../services/narrativeAPI.js';
import { trackSummaryCorrections } from '../services/ml/summaryCorrections.js';
import { learnFromSummaryCorrections } from '../services/ml/learningEngine.js';

const SummaryGeneratorComponent = ({ extractedData, notes }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState(null);
  const [saving, setSaving] = useState(false);

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
      // Extract note contents from note objects
      // notes is an array of objects: [{filename, content, source}, ...]
      // We need to extract just the content strings
      const noteContents = Array.isArray(notes)
        ? notes.map(note => typeof note === 'string' ? note : note.content)
        : [typeof notes === 'string' ? notes : notes.content];

      // Use the already-extracted and corrected data instead of re-extracting
      // This avoids re-validation of uncorrected data
      const result = await generateDischargeSummary(noteContents, {
        validateData: false, // Skip validation - data already validated and corrected
        format: 'structured',
        style: 'formal',
        extractedData // Pass the corrected extracted data
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

  /**
   * Download as Clinical Template
   */
  const handleDownloadClinicalTemplate = async () => {
    if (!summary) return;

    try {
      setLoading(true);

      // Export to clinical template format
      const clinicalTemplate = await exportSummary(summary, 'clinical-template', {
        sourceNotes: notes
      });

      const blob = new Blob([clinicalTemplate], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-template-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate clinical template: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enter edit mode
   */
  const handleEdit = () => {
    setEditMode(true);
    setEditedSummary({ ...summary.summary });
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedSummary(null);
  };

  /**
   * Handle section edit
   */
  const handleSectionEdit = (section, newContent) => {
    setEditedSummary(prev => ({
      ...prev,
      [section]: newContent
    }));
  };

  /**
   * Save corrections and learn from them
   */
  const handleSaveCorrections = async () => {
    if (!editedSummary || !summary) return;

    setSaving(true);

    try {
      // Compare original vs edited
      const differences = compareSummaries(summary.summary, editedSummary);

      console.log(`📝 Detected ${differences.changed.length} section changes`);

      // Track corrections for learning
      if (differences.changed.length > 0) {
        const corrections = differences.changed.map(change => ({
          section: change.section,
          originalText: change.before,
          correctedText: change.after,
          context: {
            pathology: summary.metadata?.pathologyTypes?.[0] || 'unknown',
            extractedData: summary.extractedData
          }
        }));

        // Track corrections (non-blocking)
        trackSummaryCorrections(corrections).then(tracked => {
          console.log(`✅ Tracked ${tracked.length} summary corrections`);

          // Trigger learning (non-blocking)
          learnFromSummaryCorrections(tracked).then(result => {
            console.log(`🧠 Learned ${result.patternsLearned} narrative patterns`);
          }).catch(error => {
            console.error('Failed to learn from corrections:', error);
          });
        }).catch(error => {
          console.error('Failed to track corrections:', error);
        });
      }

      // Update summary with edited content
      setSummary(prev => ({
        ...prev,
        summary: editedSummary
      }));

      setEditMode(false);
      setEditedSummary(null);

      console.log('✅ Summary corrections saved');

    } catch (error) {
      console.error('Failed to save corrections:', error);
      setError('Failed to save corrections: ' + error.message);
    } finally {
      setSaving(false);
    }
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
        {!editMode ? (
          <>
            <button
              onClick={handleEdit}
              className="btn btn-primary"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Summary
            </button>
            <button
              onClick={handleCopy}
              className="btn"
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
              onClick={handleDownloadClinicalTemplate}
              className="btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Clinical Template
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
          </>
        ) : (
          <>
            <button
              onClick={handleSaveCorrections}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Corrections
                </>
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="btn"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Summary Content */}
      <div className="space-y-4">
        {(editMode ? editedSummary : summary.summary).chiefComplaint && (
          <SummarySection
            title="Chief Complaint"
            sectionKey="chiefComplaint"
            content={editMode ? editedSummary.chiefComplaint : summary.summary.chiefComplaint}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).historyOfPresentIllness && (
          <SummarySection
            title="History of Present Illness"
            sectionKey="historyOfPresentIllness"
            content={editMode ? editedSummary.historyOfPresentIllness : summary.summary.historyOfPresentIllness}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).hospitalCourse && (
          <SummarySection
            title="Hospital Course"
            sectionKey="hospitalCourse"
            content={editMode ? editedSummary.hospitalCourse : summary.summary.hospitalCourse}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).procedures && (
          <SummarySection
            title="Procedures"
            sectionKey="procedures"
            content={editMode ? editedSummary.procedures : summary.summary.procedures}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).complications && (
          <SummarySection
            title="Complications"
            sectionKey="complications"
            content={editMode ? editedSummary.complications : summary.summary.complications}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).dischargeStatus && (
          <SummarySection
            title="Discharge Status"
            sectionKey="dischargeStatus"
            content={editMode ? editedSummary.dischargeStatus : summary.summary.dischargeStatus}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).dischargeMedications && (
          <SummarySection
            title="Discharge Medications"
            sectionKey="dischargeMedications"
            content={editMode ? editedSummary.dischargeMedications : summary.summary.dischargeMedications}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
        )}

        {(editMode ? editedSummary : summary.summary).followUpPlan && (
          <SummarySection
            title="Follow-Up Plan"
            sectionKey="followUpPlan"
            content={editMode ? editedSummary.followUpPlan : summary.summary.followUpPlan}
            editable={editMode}
            onEdit={handleSectionEdit}
          />
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
          💡 <strong>Tip:</strong> Click "Edit Summary" to make corrections directly. The system learns from your edits
          to improve future summaries! Your corrections help train the AI to match your preferred style and terminology.
        </p>
      </div>
    </div>
  );
};

/**
 * Summary Section Component with Inline Editing
 */
const SummarySection = ({ title, sectionKey, content, editable = false, onEdit }) => {
  const [localContent, setLocalContent] = React.useState(content);

  // Update local content when content prop changes
  React.useEffect(() => {
    setLocalContent(content);
  }, [content]);

  if (!content || content === 'Not available.' || content === 'Not documented.') {
    return null;
  }

  const handleChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    if (onEdit) {
      onEdit(sectionKey, newContent);
    }
  };

  return (
    <div className="card">
      <h3 className="font-medium text-lg mb-3 text-blue-900 dark:text-blue-100">
        {title.toUpperCase()}
      </h3>
      <div className="prose dark:prose-invert max-w-none">
        {editable ? (
          <textarea
            value={localContent}
            onChange={handleChange}
            className="w-full min-h-[150px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     leading-relaxed resize-y"
            style={{ fontFamily: 'inherit' }}
          />
        ) : (
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </div>
  );
};

export default SummaryGeneratorComponent;
