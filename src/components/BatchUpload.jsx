/**
 * BatchUpload Component
 * 
 * Interface for uploading clinical notes with automatic type detection.
 * Supports drag-and-drop, paste, and manual entry.
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const BatchUpload = ({ onNotesProcessed, isProcessing = false }) => {
  const { state, dispatch } = useAppContext();
  const [notes, setNotes] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualNote, setManualNote] = useState('');
  const fileInputRef = useRef(null);

  /**
   * Handle file drop
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    await processFiles(files);
  };

  /**
   * Handle drag over
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = async (e) => {
    const files = [...e.target.files];
    await processFiles(files);
  };

  /**
   * Process uploaded files
   */
  const processFiles = async (files) => {
    const textFiles = files.filter(f => 
      f.type === 'text/plain' || 
      f.name.endsWith('.txt') || 
      f.name.endsWith('.md')
    );

    for (const file of textFiles) {
      try {
        const content = await readFileContent(file);
        addNote({
          id: Date.now() + Math.random(),
          filename: file.name,
          content,
          source: 'file',
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error reading file:', file.name, error);
      }
    }
  };

  /**
   * Read file content
   */
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  /**
   * Handle paste
   */
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim()) {
      addNote({
        id: Date.now(),
        filename: `Pasted Note ${notes.length + 1}`,
        content: pastedText.trim(),
        source: 'paste',
        uploadedAt: new Date().toISOString()
      });
    }
  };

  /**
   * Add note to list
   */
  const addNote = (note) => {
    setNotes(prev => [...prev, note]);
  };

  /**
   * Remove note from list
   */
  const removeNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  /**
   * Add manual note
   */
  const handleAddManualNote = () => {
    if (manualNote.trim()) {
      addNote({
        id: Date.now(),
        filename: `Manual Entry ${notes.length + 1}`,
        content: manualNote.trim(),
        source: 'manual',
        uploadedAt: new Date().toISOString()
      });
      setManualNote('');
      setShowManualEntry(false);
    }
  };

  /**
   * Process all notes
   */
  const handleProcessNotes = () => {
    if (notes.length === 0) {
      alert('Please add at least one clinical note.');
      return;
    }

    // Pass notes to parent
    if (onNotesProcessed) {
      onNotesProcessed(notes);
    }

    // Update context
    dispatch({
      type: 'SET_NOTES',
      payload: notes
    });

    // Clear for next batch
    setNotes([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="section-title">Upload Clinical Notes</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload notes as text files, paste directly, or type manually. All note types supported
          (admission, progress, operative, consultant, PT/OT).
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">Drop files here or paste text</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Supports .txt, .md files. You can also paste (Ctrl/Cmd+V) anywhere in this area.
        </p>
        
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className="btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Manual Entry
          </button>
        </div>

        <input
          ref={fileInputRef}
          id="file-upload"
          name="file-upload"
          type="file"
          multiple
          accept=".txt,.md,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Manual Note Entry</h3>
              <button
                onClick={() => setShowManualEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                id="manual-note-entry"
                name="manual-note-entry"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Paste or type clinical note here..."
                className="textarea w-full h-64"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowManualEntry(false)}
                className="btn"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualNote}
                className="btn btn-primary"
                disabled={!manualNote.trim()}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Uploaded Notes ({notes.length})
            </h3>
            <button
              onClick={() => setNotes([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onRemove={() => removeNote(note.id)}
              />
            ))}
          </div>

          {/* Process Button */}
          <div className="flex justify-end">
            <button
              onClick={handleProcessNotes}
              disabled={isProcessing}
              className={`btn btn-primary btn-lg ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing with {isProcessing ? 'LLM' : 'patterns'}...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Process {notes.length} Note{notes.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Privacy Notice</p>
            <p className="text-blue-700 dark:text-blue-300">
              All notes are processed locally in your browser. No data is sent to external servers.
              PHI remains on your device.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-2">💡 Tips</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• You can upload multiple notes at once - they'll be combined for extraction</li>
          <li>• Include all relevant notes: admission, progress, operative, consultant, PT/OT</li>
          <li>• More complete notes = better extraction accuracy</li>
          <li>• The system automatically detects note types and pathology</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Note Card Component
 */
const NoteCard = ({ note, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const previewLength = 150;
  const preview = note.content.slice(0, previewLength);
  const hasMore = note.content.length > previewLength;

  const getSourceIcon = (source) => {
    return <FileText className="w-4 h-4" />;
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'file':
        return 'File Upload';
      case 'paste':
        return 'Pasted';
      case 'manual':
        return 'Manual Entry';
      default:
        return source;
    }
  };

  return (
    <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getSourceIcon(note.source)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-sm">{note.filename}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getSourceLabel(note.source)} • {note.content.length} characters
              </p>
            </div>
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Remove note"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="whitespace-pre-wrap font-mono text-xs">
              {expanded ? note.content : preview}
              {hasMore && !expanded && '...'}
            </p>
            
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-700 text-xs mt-2"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchUpload;
