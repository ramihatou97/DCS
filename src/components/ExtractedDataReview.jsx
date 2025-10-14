/**
 * ExtractedDataReview Component
 *
 * Interface for reviewing and editing extracted data with confidence indicators.
 * Allows manual corrections which feed into the ML learning system.
 */

import React, { useState } from 'react';
import {
  Check, X, AlertTriangle, Edit2, Save, ChevronDown, ChevronUp,
  Info, Calendar, User, FileText, Activity, Pill, MapPin, Clock
} from 'lucide-react';
import { trackCorrection } from '../services/ml/correctionTracker.js';

const ExtractedDataReview = ({ extractedData, validation, onDataCorrected, onProceed, notes = [], metadata = {} }) => {
  const [editingField, setEditingField] = useState(null);
  const [editedData, setEditedData] = useState({ ...extractedData });
  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    dates: true,
    pathology: true,
    presentingSymptoms: false,
    hospitalCourse: true,
    procedures: false,
    complications: false,
    anticoagulation: true,
    imaging: false,
    functionalScores: false,
    medications: false,
    followUp: false,
    dischargeDestination: true
  });

  /**
   * Toggle section expansion
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Start editing a field
   */
  const startEditing = (section, field) => {
    setEditingField({ section, field });
  };

  /**
   * Save edited field
   */
  const saveEdit = async (section, field, value) => {
    const updated = { ...editedData };

    // Get original value
    const originalValue = field
      ? extractedData[section]?.[field]
      : extractedData[section];

    // Update state
    if (field) {
      updated[section][field] = value;
    } else {
      updated[section] = value;
    }

    setEditedData(updated);
    setEditingField(null);

    // Track correction for ML learning (async, non-blocking)
    try {
      // Construct field path
      const fieldPath = field ? `${section}.${field}` : section;

      // Get source context from notes (if available)
      const sourceText = notes && notes.length > 0
        ? notes.map(n => n.content || n).join('\n\n')
        : '';

      // Get confidence score for this field
      const fieldConfidence = validation?.confidence?.[fieldPath] || validation?.confidence || 0;

      // Get pathology type
      const pathologyTypes = metadata?.pathologyTypes || [];
      const primaryPathology = pathologyTypes.length > 0 ? pathologyTypes[0] : 'unknown';

      // Track the correction (don't await - let it run in background)
      trackCorrection({
        field: fieldPath,
        originalValue,
        correctedValue: value,
        sourceText,
        originalConfidence: fieldConfidence,
        pathology: primaryPathology,
        extractionMethod: metadata?.extractionMethod || 'unknown',
      }).then(() => {
        console.log(`✅ Correction tracked: ${fieldPath}`);
      }).catch(error => {
        console.error('Failed to track correction:', error);
        // Don't block user if tracking fails
      });
    } catch (error) {
      console.error('Correction tracking error:', error);
      // Don't block user if tracking fails
    }

    // Notify parent of correction
    if (onDataCorrected) {
      onDataCorrected({
        section,
        field,
        before: originalValue,
        after: value
      });
    }
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingField(null);
  };

  /**
   * Get confidence badge
   */
  const getConfidenceBadge = (section) => {
    if (!validation?.confidence) return null;

    const confidence = validation.confidence;
    let color = 'gray';
    let label = 'Unknown';

    if (confidence >= 90) {
      color = 'green';
      label = 'High';
    } else if (confidence >= 70) {
      color = 'yellow';
      label = 'Medium';
    } else {
      color = 'red';
      label = 'Low';
    }

    return (
      <span className={`badge badge-${color} text-xs`}>
        {label} ({confidence}%)
      </span>
    );
  };

  /**
   * Check if field has flags
   */
  const getFieldFlags = (section, field) => {
    if (!validation?.flags) return [];
    
    return validation.flags.filter(f => 
      f.field === section || f.field === `${section}.${field}`
    );
  };

  /**
   * Proceed to next step
   */
  const handleProceed = () => {
    if (onProceed) {
      onProceed(editedData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="section-title">Review Extracted Data</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and correct any extracted data. Click any field to edit. Your corrections improve the ML system.
        </p>
      </div>

      {/* Validation Summary */}
      {validation && (
        <div className={`card ${
          validation.isValid 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start gap-3">
            {validation.isValid ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-medium mb-2">
                {validation.isValid ? 'Validation Passed' : 'Review Required'}
              </h3>
              <div className="text-sm space-y-1">
                <p>Overall Confidence: <strong>{validation.confidence}%</strong></p>
                {validation.errorCount > 0 && (
                  <p className="text-red-600 dark:text-red-400">
                    {validation.errorCount} error(s) found
                  </p>
                )}
                {validation.warningCount > 0 && (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    {validation.warningCount} warning(s)
                  </p>
                )}
                {validation.flagCount > 0 && (
                  <p className="text-blue-600 dark:text-blue-400">
                    {validation.flagCount} field(s) flagged for review
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Sections */}
      <div className="space-y-4">
        {/* Demographics */}
        <DataSection
          title="Demographics"
          icon={<User className="w-5 h-5" />}
          expanded={expandedSections.demographics}
          onToggle={() => toggleSection('demographics')}
          badge={getConfidenceBadge('demographics')}
        >
          <DataField
            label="Age"
            value={editedData.demographics?.age}
            unit="years"
            editing={editingField?.section === 'demographics' && editingField?.field === 'age'}
            onEdit={() => startEditing('demographics', 'age')}
            onSave={(value) => saveEdit('demographics', 'age', parseInt(value))}
            onCancel={cancelEdit}
            type="number"
            flags={getFieldFlags('demographics', 'age')}
          />
          <DataField
            label="Gender"
            value={editedData.demographics?.gender === 'M' ? 'Male' : editedData.demographics?.gender === 'F' ? 'Female' : null}
            editing={editingField?.section === 'demographics' && editingField?.field === 'gender'}
            onEdit={() => startEditing('demographics', 'gender')}
            onSave={(value) => saveEdit('demographics', 'gender', value === 'Male' ? 'M' : 'F')}
            onCancel={cancelEdit}
            type="select"
            options={['Male', 'Female']}
            flags={getFieldFlags('demographics', 'gender')}
          />
        </DataSection>

        {/* Dates */}
        <DataSection
          title="Important Dates"
          icon={<Calendar className="w-5 h-5" />}
          expanded={expandedSections.dates}
          onToggle={() => toggleSection('dates')}
          badge={getConfidenceBadge('dates')}
        >
          <DataField
            label="Ictus Date"
            value={editedData.dates?.ictusDate}
            editing={editingField?.section === 'dates' && editingField?.field === 'ictusDate'}
            onEdit={() => startEditing('dates', 'ictusDate')}
            onSave={(value) => saveEdit('dates', 'ictusDate', value)}
            onCancel={cancelEdit}
            type="date"
            flags={getFieldFlags('dates', 'ictusDate')}
            critical
          />
          <DataField
            label="Admission Date"
            value={editedData.dates?.admissionDate}
            editing={editingField?.section === 'dates' && editingField?.field === 'admissionDate'}
            onEdit={() => startEditing('dates', 'admissionDate')}
            onSave={(value) => saveEdit('dates', 'admissionDate', value)}
            onCancel={cancelEdit}
            type="date"
            flags={getFieldFlags('dates', 'admissionDate')}
          />
          <DataField
            label="Discharge Date"
            value={editedData.dates?.dischargeDate}
            editing={editingField?.section === 'dates' && editingField?.field === 'dischargeDate'}
            onEdit={() => startEditing('dates', 'dischargeDate')}
            onSave={(value) => saveEdit('dates', 'dischargeDate', value)}
            onCancel={cancelEdit}
            type="date"
            flags={getFieldFlags('dates', 'dischargeDate')}
          />
        </DataSection>

        {/* Pathology */}
        <DataSection
          title="Diagnosis & Pathology"
          icon={<FileText className="w-5 h-5" />}
          expanded={expandedSections.pathology}
          onToggle={() => toggleSection('pathology')}
          badge={getConfidenceBadge('pathology')}
        >
          <DataField
            label="Primary Diagnosis"
            value={editedData.pathology?.primaryDiagnosis}
            editing={editingField?.section === 'pathology' && editingField?.field === 'primaryDiagnosis'}
            onEdit={() => startEditing('pathology', 'primaryDiagnosis')}
            onSave={(value) => saveEdit('pathology', 'primaryDiagnosis', value)}
            onCancel={cancelEdit}
            flags={getFieldFlags('pathology', 'primaryDiagnosis')}
            critical
          />
          <DataField
            label="Location"
            value={editedData.pathology?.location}
            editing={editingField?.section === 'pathology' && editingField?.field === 'location'}
            onEdit={() => startEditing('pathology', 'location')}
            onSave={(value) => saveEdit('pathology', 'location', value)}
            onCancel={cancelEdit}
            flags={getFieldFlags('pathology', 'location')}
          />
          {editedData.pathology?.grades && Object.keys(editedData.pathology.grades).length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Grades: </span>
              {Object.entries(editedData.pathology.grades).map(([type, value]) => (
                <span key={type} className="badge mr-2">{type}: {value}</span>
              ))}
            </div>
          )}
        </DataSection>

        {/* Presenting Symptoms */}
        {editedData.presentingSymptoms && editedData.presentingSymptoms.symptoms?.length > 0 && (
          <DataSection
            title="Presenting Symptoms"
            icon={<Activity className="w-5 h-5" />}
            expanded={expandedSections.presentingSymptoms}
            onToggle={() => toggleSection('presentingSymptoms')}
            badge={getConfidenceBadge('presentingSymptoms')}
          >
            <div className="text-sm">
              <span className="font-medium">Symptoms: </span>
              {editedData.presentingSymptoms.symptoms.map((symptom, idx) => (
                <span key={idx} className="badge mr-2">{symptom}</span>
              ))}
            </div>
            {editedData.presentingSymptoms.onset && (
              <div className="text-sm">
                <span className="font-medium">Onset: </span>
                {editedData.presentingSymptoms.onset}
              </div>
            )}
            {editedData.presentingSymptoms.severity && (
              <div className="text-sm">
                <span className="font-medium">Severity: </span>
                {editedData.presentingSymptoms.severity}
              </div>
            )}
          </DataSection>
        )}

        {/* Hospital Course Timeline */}
        {editedData.hospitalCourse && editedData.hospitalCourse.timeline?.length > 0 && (
          <DataSection
            title="Hospital Course Timeline"
            icon={<Clock className="w-5 h-5" />}
            expanded={expandedSections.hospitalCourse}
            onToggle={() => toggleSection('hospitalCourse')}
            badge={getConfidenceBadge('hospitalCourse')}
          >
            <div className="text-sm space-y-3">
              {editedData.hospitalCourse.timeline.map((event, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 dark:border-blue-400 pl-4 pb-2">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[80px]">
                      {event.date || `Event ${idx + 1}`}
                    </span>
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 mr-2">
                        {event.type}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{event.description}</span>
                      {event.details && (
                        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1 italic">
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {editedData.hospitalCourse.summary && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm">
                  <span className="font-medium">Summary: </span>
                  <span className="text-gray-700 dark:text-gray-300">{editedData.hospitalCourse.summary}</span>
                </div>
              </div>
            )}
          </DataSection>
        )}

        {/* Procedures */}
        {editedData.procedures && editedData.procedures.procedures?.length > 0 && (
          <DataSection
            title="Procedures & Surgeries"
            icon={<Activity className="w-5 h-5" />}
            expanded={expandedSections.procedures}
            onToggle={() => toggleSection('procedures')}
            badge={getConfidenceBadge('procedures')}
          >
            <div className="text-sm space-y-1">
              {editedData.procedures.procedures.map((procedure, idx) => (
                <div key={idx} className="badge badge-blue mr-2 mb-2">{procedure}</div>
              ))}
            </div>
          </DataSection>
        )}

        {/* Complications */}
        {editedData.complications && editedData.complications.complications?.length > 0 && (
          <DataSection
            title="Complications"
            icon={<AlertTriangle className="w-5 h-5" />}
            expanded={expandedSections.complications}
            onToggle={() => toggleSection('complications')}
            badge={<span className="badge badge-yellow text-xs">Requires Attention</span>}
          >
            <div className="text-sm space-y-1">
              {editedData.complications.complications.map((complication, idx) => (
                <div key={idx} className="badge badge-yellow mr-2 mb-2">{complication}</div>
              ))}
            </div>
          </DataSection>
        )}

        {/* Imaging */}
        {editedData.imaging && editedData.imaging.findings?.length > 0 && (
          <DataSection
            title="Imaging Findings"
            icon={<FileText className="w-5 h-5" />}
            expanded={expandedSections.imaging}
            onToggle={() => toggleSection('imaging')}
            badge={getConfidenceBadge('imaging')}
          >
            <div className="text-sm space-y-2">
              {editedData.imaging.findings.map((finding, idx) => (
                <div key={idx} className="text-gray-700 dark:text-gray-300">• {finding}</div>
              ))}
            </div>
          </DataSection>
        )}

        {/* Functional Scores */}
        {editedData.functionalScores && (editedData.functionalScores.kps || editedData.functionalScores.ecog || editedData.functionalScores.mRS !== null) && (
          <DataSection
            title="Functional Status"
            icon={<Activity className="w-5 h-5" />}
            expanded={expandedSections.functionalScores}
            onToggle={() => toggleSection('functionalScores')}
            badge={getConfidenceBadge('functionalScores')}
          >
            {editedData.functionalScores.kps && (
              <DataField
                label="Karnofsky Performance Status (KPS)"
                value={editedData.functionalScores.kps}
                editing={editingField?.section === 'functionalScores' && editingField?.field === 'kps'}
                onEdit={() => startEditing('functionalScores', 'kps')}
                onSave={(value) => saveEdit('functionalScores', 'kps', parseInt(value))}
                onCancel={cancelEdit}
                type="number"
                flags={getFieldFlags('functionalScores', 'kps')}
              />
            )}
            {editedData.functionalScores.ecog !== null && editedData.functionalScores.ecog !== undefined && (
              <DataField
                label="ECOG Performance Status"
                value={editedData.functionalScores.ecog}
                editing={editingField?.section === 'functionalScores' && editingField?.field === 'ecog'}
                onEdit={() => startEditing('functionalScores', 'ecog')}
                onSave={(value) => saveEdit('functionalScores', 'ecog', parseInt(value))}
                onCancel={cancelEdit}
                type="number"
                flags={getFieldFlags('functionalScores', 'ecog')}
              />
            )}
            {editedData.functionalScores.mRS !== null && editedData.functionalScores.mRS !== undefined && (
              <DataField
                label="Modified Rankin Scale (mRS)"
                value={editedData.functionalScores.mRS}
                editing={editingField?.section === 'functionalScores' && editingField?.field === 'mRS'}
                onEdit={() => startEditing('functionalScores', 'mRS')}
                onSave={(value) => saveEdit('functionalScores', 'mRS', parseInt(value))}
                onCancel={cancelEdit}
                type="number"
                flags={getFieldFlags('functionalScores', 'mRS')}
              />
            )}
          </DataSection>
        )}

        {/* Medications */}
        {editedData.medications && editedData.medications.current?.length > 0 && (
          <DataSection
            title="Medications"
            icon={<Pill className="w-5 h-5" />}
            expanded={expandedSections.medications}
            onToggle={() => toggleSection('medications')}
            badge={getConfidenceBadge('medications')}
          >
            <div className="text-sm space-y-2">
              {editedData.medications.current.map((med, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="badge badge-blue">{med.name}</span>
                  {med.dose && <span className="text-gray-600 dark:text-gray-400">{med.dose}</span>}
                  {med.frequency && <span className="text-gray-600 dark:text-gray-400">{med.frequency}</span>}
                </div>
              ))}
            </div>
          </DataSection>
        )}

        {/* Follow-up */}
        {editedData.followUp && editedData.followUp.appointments?.length > 0 && (
          <DataSection
            title="Follow-up Plan"
            icon={<Calendar className="w-5 h-5" />}
            expanded={expandedSections.followUp}
            onToggle={() => toggleSection('followUp')}
            badge={getConfidenceBadge('followUp')}
          >
            <div className="text-sm space-y-2">
              {editedData.followUp.appointments.map((appt, idx) => (
                <div key={idx} className="text-gray-700 dark:text-gray-300">
                  • {appt.specialty}: {appt.timing}
                  {appt.purpose && ` - ${appt.purpose}`}
                </div>
              ))}
            </div>
          </DataSection>
        )}

        {/* Anticoagulation (CRITICAL) */}
        {editedData.anticoagulation && (
          <DataSection
            title="Anticoagulation Status"
            icon={<Pill className="w-5 h-5" />}
            expanded={expandedSections.anticoagulation}
            onToggle={() => toggleSection('anticoagulation')}
            badge={<span className="badge badge-red text-xs">CRITICAL</span>}
            critical
          >
            {editedData.anticoagulation.current?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Current: </span>
                {editedData.anticoagulation.current.map(m => m.name).join(', ')}
              </div>
            )}
            {editedData.anticoagulation.held?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Held: </span>
                {editedData.anticoagulation.held.map(m => m.name).join(', ')}
              </div>
            )}
            {editedData.anticoagulation.reversed?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Reversed: </span>
                {editedData.anticoagulation.reversed.map(m => m.name).join(', ')}
              </div>
            )}
          </DataSection>
        )}

        {/* Discharge Destination */}
        <DataSection
          title="Discharge Destination"
          icon={<MapPin className="w-5 h-5" />}
          expanded={expandedSections.dischargeDestination}
          onToggle={() => toggleSection('dischargeDestination')}
          badge={getConfidenceBadge('dischargeDestination')}
        >
          <DataField
            label="Destination"
            value={editedData.dischargeDestination?.destination}
            editing={editingField?.section === 'dischargeDestination' && editingField?.field === 'destination'}
            onEdit={() => startEditing('dischargeDestination', 'destination')}
            onSave={(value) => saveEdit('dischargeDestination', 'destination', value)}
            onCancel={cancelEdit}
            flags={getFieldFlags('dischargeDestination', 'destination')}
          />
        </DataSection>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="btn">
          Back
        </button>
        <button
          onClick={handleProceed}
          className="btn btn-primary btn-lg"
        >
          Generate Summary
        </button>
      </div>
    </div>
  );
};

/**
 * Data Section Component
 */
const DataSection = ({ title, icon, children, expanded, onToggle, badge, critical }) => {
  return (
    <div className={`card ${critical ? 'border-red-300 dark:border-red-800' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-600 dark:text-gray-400">{icon}</div>
          <h3 className="font-medium">{title}</h3>
          {badge}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 pl-8">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Data Field Component
 */
const DataField = ({ 
  label, 
  value, 
  unit, 
  editing, 
  onEdit, 
  onSave, 
  onCancel,
  type = 'text',
  options = [],
  flags = [],
  critical = false
}) => {
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    onSave(editValue);
  };

  const hasCriticalFlag = flags.some(f => f.severity === 'critical');
  const hasFlag = flags.length > 0;

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium min-w-[120px]">{label}:</label>
        {type === 'select' ? (
          <select
            id={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            name={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="input flex-1"
            autoFocus
          >
            <option value="">Select...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : type === 'date' ? (
          <input
            id={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            name={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="input flex-1"
            autoFocus
          />
        ) : type === 'number' ? (
          <input
            id={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            name={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="input flex-1"
            autoFocus
          />
        ) : (
          <input
            id={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            name={`edit-${label.toLowerCase().replace(/\s+/g, '-')}`}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="input flex-1"
            autoFocus
          />
        )}
        <button onClick={handleSave} className="btn btn-primary btn-sm">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={onCancel} className="btn btn-sm">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group">
      <label className="text-sm font-medium min-w-[120px] flex-shrink-0">
        {label}:
        {critical && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {value || <span className="text-gray-400 italic">Not extracted</span>}
            {value && unit && <span className="text-gray-500 ml-1">{unit}</span>}
          </span>
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
            title="Edit field"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
        
        {hasFlag && (
          <div className="mt-1 space-y-1">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className={`text-xs flex items-start gap-1 ${
                  flag.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                  flag.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`}
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{flag.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataReview;
