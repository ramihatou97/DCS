/**
 * Suggestion Panel Component
 * 
 * Displays knowledge-based suggestions for missing critical fields
 * with prioritization, actionable guidance, and clinical significance.
 * 
 * Features:
 * - Priority-based color coding (critical, high, medium, low)
 * - Expandable details with "where to find" guidance
 * - Clinical significance explanations
 * - Related fields highlighting
 * - Accept/dismiss functionality
 * - Learning from user behavior
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, Info, Search, Link } from 'lucide-react';

const SuggestionPanel = ({ suggestions = [], onAccept, onDismiss, extractedData }) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.field));

  if (visibleSuggestions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">All critical fields captured!</span>
        </div>
      </div>
    );
  }

  const toggleExpanded = (field) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(field)) {
      newExpanded.delete(field);
    } else {
      newExpanded.add(field);
    }
    setExpandedSuggestions(newExpanded);
  };

  const handleDismiss = (suggestion) => {
    const newDismissed = new Set(dismissedSuggestions);
    newDismissed.add(suggestion.field);
    setDismissedSuggestions(newDismissed);
    
    if (onDismiss) {
      onDismiss(suggestion);
    }
  };

  const handleAccept = (suggestion) => {
    if (onAccept) {
      onAccept(suggestion);
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: AlertCircle,
          label: 'CRITICAL'
        };
      case 'high':
        return {
          color: 'orange',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          icon: AlertCircle,
          label: 'HIGH'
        };
      case 'medium':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: Info,
          label: 'MEDIUM'
        };
      case 'low':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: Info,
          label: 'LOW'
        };
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          icon: Info,
          label: 'INFO'
        };
    }
  };

  // Group suggestions by priority
  const groupedSuggestions = visibleSuggestions.reduce((acc, suggestion) => {
    const priority = suggestion.adjustedPriority || suggestion.priority;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(suggestion);
    return acc;
  }, {});

  const priorityOrder = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Knowledge-Based Suggestions
            </h3>
            <span className="text-sm text-gray-600">
              ({visibleSuggestions.length} field{visibleSuggestions.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          These suggestions are based on clinical knowledge and the pathology detected. Click to expand for guidance.
        </p>
      </div>

      {/* Suggestions by Priority */}
      <div className="divide-y divide-gray-200">
        {priorityOrder.map(priority => {
          const suggestions = groupedSuggestions[priority];
          if (!suggestions || suggestions.length === 0) return null;

          return (
            <div key={priority} className="p-4">
              {/* Priority Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${getPriorityConfig(priority).bgColor} ${getPriorityConfig(priority).textColor}`}>
                  {getPriorityConfig(priority).label} PRIORITY
                </span>
                <span className="text-sm text-gray-500">
                  {suggestions.length} field{suggestions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const config = getPriorityConfig(suggestion.adjustedPriority || suggestion.priority);
                  const Icon = config.icon;
                  const isExpanded = expandedSuggestions.has(suggestion.field);

                  return (
                    <div
                      key={`${suggestion.field}-${index}`}
                      className={`border ${config.borderColor} ${config.bgColor} rounded-lg overflow-hidden transition-all`}
                    >
                      {/* Suggestion Header */}
                      <div
                        className="p-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleExpanded(suggestion.field)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {suggestion.field}
                                </span>
                                {suggestion.contextNote && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    Related data present
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${config.textColor}`}>
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 bg-white">
                          {/* Where to Find */}
                          {suggestion.whereToFind && (
                            <div className="pt-3">
                              <div className="flex items-start gap-2 mb-2">
                                <Search className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium text-gray-900">Where to Find:</span>
                              </div>
                              <p className="text-sm text-gray-700 ml-6 bg-blue-50 p-2 rounded border border-blue-200">
                                {suggestion.whereToFind}
                              </p>
                            </div>
                          )}

                          {/* Clinical Significance */}
                          {suggestion.clinicalSignificance && (
                            <div>
                              <div className="flex items-start gap-2 mb-2">
                                <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium text-gray-900">Clinical Significance:</span>
                              </div>
                              <p className="text-sm text-gray-700 ml-6 bg-purple-50 p-2 rounded border border-purple-200">
                                {suggestion.clinicalSignificance}
                              </p>
                            </div>
                          )}

                          {/* Related Fields */}
                          {suggestion.relatedFields && suggestion.relatedFields.length > 0 && (
                            <div>
                              <div className="flex items-start gap-2 mb-2">
                                <Link className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium text-gray-900">Related Fields:</span>
                              </div>
                              <div className="ml-6 flex flex-wrap gap-2">
                                {suggestion.relatedFields.map(field => (
                                  <span
                                    key={field}
                                    className="text-xs font-mono bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200"
                                  >
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Context Note */}
                          {suggestion.contextNote && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-sm text-blue-800">
                                💡 {suggestion.contextNote}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(suggestion);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Add to Review
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(suggestion);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionPanel;

