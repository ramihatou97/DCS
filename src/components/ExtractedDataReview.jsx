/**
 * ExtractedDataReview Component
 * 
 * Interface for reviewing and editing extracted data with confidence indicators.
 * Allows manual corrections which feed into the ML learning system.
 */

import React, { useState } from 'react';
import { 
  Check, X, AlertTriangle, Edit2, Save, ChevronDown, ChevronUp, 
  Info, Calendar, User, FileText, Activity, Pill, MapPin
} from 'lucide-react';

const ExtractedDataReview = ({ extractedData, validation, onDataCorrected, onProceed }) => {
  const [editingField, setEditingField] = useState(null);
  const [editedData, setEditedData] = useState({ ...extractedData });
  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    dates: true,
    pathology: true,
    presentingSymptoms: false,
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
  const saveEdit = (section, field, value) => {
    const updated = { ...editedData };
    
    if (field) {
      updated[section][field] = value;
    } else {
      updated[section] = value;
    }

    setEditedData(updated);
    setEditingField(null);

    // Notify parent of correction
    if (onDataCorrected) {
      onDataCorrected({
        section,
        field,
        before: extractedData[section]?.[field] || extractedData[section],
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
