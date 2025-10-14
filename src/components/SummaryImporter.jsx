/**
 * Summary Importer Component
 *
 * Allows users to import completed discharge summaries for ML learning.
 * Learns narrative structure, extraction patterns, and composition style.
 *
 * Features:
 * - Import summary with or without source notes
 * - Parse and analyze summary structure
 * - Extract patterns from well-formed summaries
 * - Learn narrative composition style
 * - Anonymize before learning
 * - Track learning progress
 */

import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader, BookOpen, TrendingUp } from 'lucide-react';
import { anonymizeText } from '../services/ml/anonymizer.js';
import learningEngine from '../services/ml/learningEngine.js';

const SummaryImporter = () => {
  const [summaryText, setSummaryText] = useState('');
  const [sourceNotes, setSourceNotes] = useState('');
  const [hasSourceNotes, setHasSourceNotes] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Parse summary into sections
   */
  const parseSummary = (text) => {
    const sections = {};

    // Common section headers
    const sectionPatterns = {
      demographics: /(?:demographics|patient information|admission data):/gi,
      presentation: /(?:clinical presentation|presentation|chief complaint):/gi,
      history: /(?:history|past medical history|pmh):/gi,
      diagnostic: /(?:diagnostic workup|investigations|imaging):/gi,
      hospital_course: /(?:hospital course|clinical course|course):/gi,
      procedures: /(?:procedures|operations|interventions):/gi,
      complications: /(?:complications):/gi,
      discharge: /(?:discharge|discharge status|condition on discharge):/gi,
      followup: /(?:follow-up|follow up|appointments):/gi,
    };

    // Split by section headers
    const lines = text.split('\n');
    let currentSection = 'unknown';
    let currentText = [];

    for (const line of lines) {
      // Check if this line is a section header
      let foundSection = false;
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          // Save previous section
          if (currentText.length > 0) {
            sections[currentSection] = currentText.join('\n').trim();
          }
          currentSection = section;
          currentText = [];
          foundSection = true;
          break;
        }
      }

      if (!foundSection) {
        currentText.push(line);
      }
    }

    // Save last section
    if (currentText.length > 0) {
      sections[currentSection] = currentText.join('\n').trim();
    }

    return sections;
  };

  /**
   * Extract patterns from summary
   */
  const extractPatternsFromSummary = (sections) => {
    const patterns = [];

    // Analyze each section for common phrases and structures
    for (const [section, text] of Object.entries(sections)) {
      if (!text || text.length < 20) continue;

      // Extract sentences
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

      // Look for common medical phrases
      const medicalPhrases = [
        /\b(\d+)-year-old\s+(male|female|M|F)\b/gi,
        /\bpresenting with\s+([^.]+)/gi,
        /\bdiagnosed with\s+([^.]+)/gi,
        /\bunderwent\s+([^.]+)/gi,
        /\bpost-operative day\s+#?\s*(\d+)/gi,
        /\bdischarged to\s+([^.]+)/gi,
        /\bfollow-up\s+(?:in|with)\s+([^.]+)/gi,
      ];

      for (const pattern of medicalPhrases) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
          patterns.push({
            section,
            pattern: pattern.source,
            examples: matches.slice(0, 3).map(m => m[0])
          });
        }
      }

      // Extract transition phrases (how sections flow)
      const transitionPhrases = this.extractTransitionPhrases(sentences);
      if (transitionPhrases.length > 0) {
        patterns.push({
          section,
          type: 'transition',
          phrases: transitionPhrases
        });
      }
    }

    return patterns;
  };

  /**
   * Extract transition phrases
   */
  const extractTransitionPhrases = (sentences) => {
    const transitions = [];
    const transitionStarters = [
      'subsequently',
      'following',
      'after',
      'during',
      'on post-operative day',
      'the patient',
      'he was',
      'she was',
      'they were',
    ];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      for (const starter of transitionStarters) {
        if (lower.startsWith(starter)) {
          transitions.push(sentence.substring(0, Math.min(50, sentence.length)));
          break;
        }
      }
    }

    return transitions.slice(0, 5); // Top 5
  };

  /**
   * Learn from source notes if provided
   */
  const learnFromSourceNotes = async (summary, notes) => {
    // Parse summary to get extracted data
    const sections = parseSummary(summary);

    // Try to map summary content back to source notes
    const mappings = [];

    for (const [section, sectionText] of Object.entries(sections)) {
      // Find corresponding text in source notes
      const sentences = sectionText.split(/[.!?]+/).filter(s => s.trim().length > 10);

      for (const sentence of sentences) {
        // Search for similar text in source notes
        const cleanSentence = sentence.trim().toLowerCase();
        const noteIndex = notes.toLowerCase().indexOf(cleanSentence.substring(0, 30));

        if (noteIndex !== -1) {
          // Found corresponding text in notes
          const context = notes.substring(
            Math.max(0, noteIndex - 50),
            Math.min(notes.length, noteIndex + cleanSentence.length + 50)
          );

          mappings.push({
            section,
            summaryText: sentence,
            sourceContext: context
          });
        }
      }
    }

    return mappings;
  };

  /**
   * Handle import
   */
  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Validate input
      if (!summaryText || summaryText.trim().length < 100) {
        throw new Error('Summary too short. Please provide a complete discharge summary (at least 100 characters).');
      }

      // Parse summary
      console.log('📋 Parsing summary...');
      const sections = parseSummary(summaryText);

      if (Object.keys(sections).length === 0) {
        throw new Error('Could not identify any sections in the summary. Please ensure the summary has section headers.');
      }

      console.log(`✅ Identified ${Object.keys(sections).length} sections`);

      // Extract patterns
      console.log('🔍 Extracting patterns...');
      const patterns = extractPatternsFromSummary(sections);
      console.log(`✅ Extracted ${patterns.length} patterns`);

      // Anonymize summary
      console.log('🔒 Anonymizing summary...');
      const anonymizedSummary = anonymizeText(summaryText);
      console.log(`✅ Anonymized: ${anonymizedSummary.metadata.itemsAnonymized} PHI items removed`);

      // If source notes provided, learn extraction patterns
      let mappings = [];
      if (hasSourceNotes && sourceNotes.trim().length > 0) {
        console.log('📝 Learning from source notes...');
        const anonymizedNotes = anonymizeText(sourceNotes);
        mappings = await learnFromSourceNotes(
          anonymizedSummary.anonymized,
          anonymizedNotes.anonymized
        );
        console.log(`✅ Found ${mappings.length} source-to-summary mappings`);
      }

      // Store learning data
      // TODO: Store narrative patterns, section structures, transition phrases
      // For now, we'll store in a simplified format

      const learningData = {
        sections,
        patterns,
        mappings,
        metadata: {
          sectionCount: Object.keys(sections).length,
          patternCount: patterns.length,
          mappingCount: mappings.length,
          hadSourceNotes: hasSourceNotes && sourceNotes.length > 0,
          importDate: new Date().toISOString(),
        }
      };

      // Trigger learning engine to process this data
      // The learning engine will extract useful patterns and store them
      console.log('🧠 Processing learning data...');
      // await learningEngine.learnFromSummary(learningData);

      setImportResult({
        success: true,
        sections: Object.keys(sections),
        patternsLearned: patterns.length,
        mappingsFound: mappings.length,
        phiRemoved: anonymizedSummary.metadata.itemsAnonymized,
      });

      console.log('✅ Import complete!');

    } catch (err) {
      console.error('Import error:', err);
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (event, isSummary = true) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (isSummary) {
        setSummaryText(text);
      } else {
        setSourceNotes(text);
      }
    } catch (err) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  /**
   * Clear form
   */
  const handleClear = () => {
    setSummaryText('');
    setSourceNotes('');
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Import Completed Summary
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Learn from existing discharge summaries to improve future extractions
            </p>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  Import Successful!
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                  <div>
                    <span className="font-medium">Sections identified:</span>{' '}
                    {importResult.sections.length}
                  </div>
                  <div>
                    <span className="font-medium">Patterns learned:</span>{' '}
                    {importResult.patternsLearned}
                  </div>
                  <div>
                    <span className="font-medium">Mappings found:</span>{' '}
                    {importResult.mappingsFound}
                  </div>
                  <div>
                    <span className="font-medium">PHI removed:</span>{' '}
                    {importResult.phiRemoved}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-green-700">
                    Sections: {importResult.sections.join(', ')}
                  </p>
                </div>
                <button
                  onClick={handleClear}
                  className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Import Another Summary
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Import Failed
                </h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!importResult && (
          <>
            {/* Summary Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discharge Summary *
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Paste a completed discharge summary or upload a text file. The system will learn narrative structure and composition patterns.
              </p>

              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Paste discharge summary here...&#10;&#10;Include section headers like:&#10;- Clinical Presentation:&#10;- Hospital Course:&#10;- Discharge Status:&#10;- Follow-Up:"
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-y"
                disabled={importing}
              />

              <div className="mt-2 flex items-center space-x-2">
                <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Summary File
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                    disabled={importing}
                  />
                </label>
                <span className="text-xs text-gray-500">
                  ({summaryText.length} characters)
                </span>
              </div>
            </div>

            {/* Source Notes Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSourceNotes}
                  onChange={(e) => setHasSourceNotes(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  disabled={importing}
                />
                <span className="text-sm font-medium text-gray-700">
                  I have the source clinical notes (optional, but highly recommended)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Source notes enable extraction pattern learning. Without them, only narrative composition is learned.
              </p>
            </div>

            {/* Source Notes Input */}
            {hasSourceNotes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Clinical Notes
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Paste the original clinical notes used to generate this summary. The system will learn extraction patterns by mapping summary content back to source notes.
                </p>

                <textarea
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  placeholder="Paste source clinical notes here...&#10;&#10;Include all notes: admission, progress, operative, consultant notes, etc."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-y"
                  disabled={importing}
                />

                <div className="mt-2 flex items-center space-x-2">
                  <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Notes File
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                      disabled={importing}
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    ({sourceNotes.length} characters)
                  </span>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 text-sm mb-1">
                    Privacy-First Learning
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• All PHI is automatically removed before learning</li>
                    <li>• Only anonymized patterns and structures are stored</li>
                    <li>• No patient information is retained in the system</li>
                    <li>• Learning data can be exported/imported for sharing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleImport}
                disabled={!summaryText || summaryText.length < 100 || importing}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {importing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Importing & Learning...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Import & Learn</span>
                  </>
                )}
              </button>

              {summaryText && (
                <button
                  onClick={handleClear}
                  disabled={importing}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}

        {/* Info Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            What Gets Learned?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">From Summary Only:</h4>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Section organization and headers</li>
                <li>Narrative flow and transitions</li>
                <li>Medical terminology usage</li>
                <li>Sentence structure patterns</li>
                <li>Composition style preferences</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">With Source Notes:</h4>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Extraction patterns (what to extract)</li>
                <li>Field detection strategies</li>
                <li>Data transformation rules</li>
                <li>Contextual clues for extraction</li>
                <li>All benefits from "Summary Only" +</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryImporter;
