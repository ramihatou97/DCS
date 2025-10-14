/**
 * Main Application Component
 * Discharge Summary Generator for Neurosurgery
 */

import React, { useState } from 'react';
import { Brain, FileText, Settings, Activity, CheckCircle, TrendingUp, Upload as UploadIcon } from 'lucide-react';
import { AppProvider } from './context/AppContext.jsx';
import BatchUpload from './components/BatchUpload.jsx';
import ExtractedDataReview from './components/ExtractedDataReview.jsx';
import SummaryGeneratorComponent from './components/SummaryGenerator.jsx';
import SettingsComponent from './components/Settings.jsx';
import LearningDashboard from './components/LearningDashboard.jsx';
import SummaryImporter from './components/SummaryImporter.jsx';

// Import services
import { extractMedicalEntities } from './services/extraction.js';
import { validateExtraction, getValidationSummary } from './services/validation.js';
import { mergeExtractionResults } from './services/dataMerger.js';
import { buildTimeline } from './services/clinicalEvolution.js';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowState, setWorkflowState] = useState({
    notes: null,
    extractedData: null,
    validation: null,
    canProceed: {
      toReview: false,
      toGenerate: false
    }
  });

  const tabs = [
    { id: 'upload', label: 'Upload Notes', icon: FileText },
    { id: 'review', label: 'Review Data', icon: Activity },
    { id: 'generate', label: 'Generate Summary', icon: Brain },
    { id: 'learning', label: 'Learning Dashboard', icon: TrendingUp },
    { id: 'import', label: 'Import Summary', icon: UploadIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  /**
   * Handle notes uploaded
   */
  const handleNotesUploaded = async (notes) => {
    console.log('Notes uploaded:', notes.length);
    
    setIsProcessing(true);
    
    try {
      // Extract data from notes
      const noteContents = notes.map(n => n.content);
      const extractionResult = await extractMedicalEntities(noteContents, {
        includeConfidence: true
      });

      console.log('Extraction result:', extractionResult);

      // extractMedicalEntities returns { extracted, confidence, pathologyTypes, metadata }
      // We need to pass just the 'extracted' part to validation and components
      const { extracted, confidence, pathologyTypes, metadata } = extractionResult;

      // If LLM extraction was used and pattern extraction is available, merge them
      let finalExtracted = extracted;
      let mergeMetadata = null;
      
      if (metadata?.extractionMethod === 'llm' && metadata?.patternData) {
        console.log('Merging LLM and pattern extraction results...');
        const mergeResult = mergeExtractionResults(
          metadata.patternData,
          { ...extracted, confidence },
          {
            llmConfidenceThreshold: 0.75,
            preferLLMForArrays: true,
            combineArrays: true
          }
        );
        finalExtracted = mergeResult.merged;
        mergeMetadata = mergeResult.metadata;
        console.log('Merge complete:', mergeMetadata);
      }

      // Build clinical timeline if surgery date is available
      let timeline = null;
      if (finalExtracted.dates?.surgery) {
        console.log('Building clinical timeline...');
        try {
          timeline = buildTimeline(noteContents, finalExtracted.dates.surgery, {
            includePOD: true,
            deduplicateSameDay: true,
            sortChronologically: true
          });
          console.log('Timeline built:', timeline.metadata);
        } catch (timelineError) {
          console.error('Timeline generation failed:', timelineError);
          // Non-critical, continue without timeline
        }
      }

      // Validate extracted data
      const validationResult = validateExtraction(
        finalExtracted,
        noteContents.join('\n\n'),
        {
          checkCompleteness: true,
          checkConsistency: true
        }
      );

      console.log('Validation result:', validationResult);

      // Get validation summary with counts for display
      const validation = getValidationSummary(validationResult);
      console.log('Validation summary:', validation);

      // Update state with properly structured data
      setWorkflowState({
        notes,
        extractedData: finalExtracted,
        confidence,
        pathologyTypes,
        metadata: {
          ...metadata,
          mergeMetadata,
          timeline
        },
        validation,
        validationResult, // Keep full result for detailed access
        canProceed: {
          toReview: true,
          toGenerate: validation.isValid
        }
      });

      // Auto-navigate to review tab
      setActiveTab('review');
    } catch (error) {
      console.error('Error processing notes:', error);
      alert(`Failed to process notes: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle data corrections from review
   */
  const handleDataCorrected = (correctedData) => {
    console.log('Data corrected:', correctedData);
    
    // Re-validate with corrections
    const validationResult = validateExtraction(
      correctedData,
      workflowState.notes.map(n => n.content).join('\n\n'),
      {
        checkCompleteness: true,
        checkConsistency: true
      }
    );

    const validation = getValidationSummary(validationResult);

    setWorkflowState(prev => ({
      ...prev,
      extractedData: correctedData,
      validation,
      validationResult,
      canProceed: {
        ...prev.canProceed,
        toGenerate: validation.isValid
      }
    }));
  };

  /**
   * Handle proceed to generate
   */
  const handleProceedToGenerate = () => {
    console.log('Proceeding to generate summary');
    setActiveTab('generate');
  };

  /**
   * Render tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <BatchUpload
            onNotesProcessed={handleNotesUploaded}
            disabled={isProcessing}
            isProcessing={isProcessing}
          />
        );

      case 'review':
        if (!workflowState.extractedData) {
          return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <Activity className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Data to Review</p>
              <p className="text-sm">Upload and process clinical notes first</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Upload
              </button>
            </div>
          );
        }
        return (
          <ExtractedDataReview
            extractedData={workflowState.extractedData}
            validation={workflowState.validation}
            notes={workflowState.notes}
            metadata={workflowState.metadata}
            onDataCorrected={handleDataCorrected}
            onProceedToGenerate={handleProceedToGenerate}
            canProceed={workflowState.canProceed.toGenerate}
          />
        );

      case 'generate':
        if (!workflowState.extractedData) {
          return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <Brain className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Data Available</p>
              <p className="text-sm">Complete the upload and review steps first</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start from Upload
              </button>
            </div>
          );
        }
        return (
          <SummaryGeneratorComponent
            extractedData={workflowState.extractedData}
            validation={workflowState.validation}
            notes={workflowState.notes}
          />
        );

      case 'learning':
        return <LearningDashboard />;

      case 'import':
        return <SummaryImporter />;

      case 'settings':
        return <SettingsComponent />;

      default:
        return null;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Discharge Summary Generator
                  </h1>
                  <p className="text-xs text-gray-500">
                    Neurosurgery · AI-Powered · Privacy-First
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                {workflowState.extractedData && (
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Data Extracted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const canAccess = tab.id === 'upload' ||
                                 (tab.id === 'review' && workflowState.canProceed.toReview) ||
                                 (tab.id === 'generate' && workflowState.canProceed.toGenerate) ||
                                 tab.id === 'settings' ||
                                 tab.id === 'learning' ||
                                 tab.id === 'import';

                return (
                  <button
                    key={tab.id}
                    onClick={() => canAccess && setActiveTab(tab.id)}
                    disabled={!canAccess}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                      transition-colors duration-200
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : canAccess
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-500">
              Privacy-First Architecture · No Data Leaves Your Device · HIPAA Compliant Design
            </p>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
