/**
 * Clinical Timeline Panel Component
 *
 * Phase 2: Clinical Intelligence & Context Visualization
 *
 * Displays three key insights from Phase 2 backend:
 * 1. Causal Timeline - Events with relationships
 * 2. Treatment Response Tracking - Intervention effectiveness
 * 3. Functional Evolution - Recovery trajectory
 */

import React, { useState } from 'react';
import {
  Clock, Activity, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, XCircle, Minus, ChevronDown, ChevronUp,
  ArrowRight, Zap, Target, Calendar, BarChart3
} from 'lucide-react';

const ClinicalTimelinePanel = ({ clinicalIntelligence }) => {
  const [expandedSections, setExpandedSections] = useState({
    timeline: false,
    treatments: false,
    functional: false
  });

  if (!clinicalIntelligence) {
    return null;
  }

  const { timeline, treatmentResponses, functionalEvolution } = clinicalIntelligence;

  // Check if we have any data to display
  const hasTimelineData = timeline?.events && timeline.events.length > 0;
  const hasTreatmentData = treatmentResponses?.responses && treatmentResponses.responses.length > 0;
  const hasFunctionalData = functionalEvolution?.scoreTimeline && functionalEvolution.scoreTimeline.length > 0;

  if (!hasTimelineData && !hasTreatmentData && !hasFunctionalData) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="card border-l-4 border-l-blue-500 dark:border-l-blue-400">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Clinical Intelligence & Context</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-generated timeline, treatment analysis, and functional evolution
          </p>
        </div>
      </div>

      {/* Causal Timeline Section */}
      {hasTimelineData && (
        <CollapsibleSection
          title="Clinical Timeline"
          subtitle={`${timeline.events.length} events • ${timeline.relationships?.length || 0} relationships`}
          expanded={expandedSections.timeline}
          onToggle={() => toggleSection('timeline')}
          icon={<Calendar className="w-4 h-4" />}
        >
          <TimelineContent timeline={timeline} />
        </CollapsibleSection>
      )}

      {/* Treatment Response Section */}
      {hasTreatmentData && (
        <CollapsibleSection
          title="Treatment Response Tracking"
          subtitle={`${treatmentResponses.responses.length} interventions analyzed`}
          expanded={expandedSections.treatments}
          onToggle={() => toggleSection('treatments')}
          icon={<Target className="w-4 h-4" />}
        >
          <TreatmentResponseContent treatmentResponses={treatmentResponses} />
        </CollapsibleSection>
      )}

      {/* Functional Evolution Section */}
      {hasFunctionalData && (
        <CollapsibleSection
          title="Functional Status Evolution"
          subtitle={functionalEvolution.trajectory?.description || 'Recovery trajectory analysis'}
          expanded={expandedSections.functional}
          onToggle={() => toggleSection('functional')}
          icon={<BarChart3 className="w-4 h-4" />}
        >
          <FunctionalEvolutionContent functionalEvolution={functionalEvolution} />
        </CollapsibleSection>
      )}
    </div>
  );
};

// ============================================================================
// Timeline Content Component
// ============================================================================
const TimelineContent = ({ timeline }) => {
  const { events, milestones, relationships } = timeline;

  // Display first 5 events in collapsed view, all in expanded view
  const displayEvents = events.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Milestones Summary */}
      {milestones && Object.keys(milestones).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {milestones.admission && (
            <MilestoneCard
              title="Admission"
              date={milestones.admission.date}
              description={milestones.admission.description}
            />
          )}
          {milestones.surgery && (
            <MilestoneCard
              title="Surgery"
              date={milestones.surgery.date}
              description={milestones.surgery.description}
            />
          )}
          {milestones.discharge && (
            <MilestoneCard
              title="Discharge"
              date={milestones.discharge.date}
              description={milestones.discharge.description}
            />
          )}
        </div>
      )}

      {/* Timeline Events */}
      <div className="space-y-2">
        {displayEvents.map((event, index) => (
          <EventItem key={event.id} event={event} showConnector={index < displayEvents.length - 1} />
        ))}
      </div>

      {/* Relationships Summary */}
      {relationships && relationships.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Zap className="w-4 h-4" />
            <span>
              <strong>{relationships.length}</strong> causal relationships detected
              (triggers, causes, responses)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const MilestoneCard = ({ title, date, description }) => (
  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <div className="font-medium text-sm text-blue-900 dark:text-blue-300">{title}</div>
    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{date || 'Date not specified'}</div>
    {description && (
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{description}</div>
    )}
  </div>
);

const EventItem = ({ event, showConnector }) => {
  const typeColors = {
    DIAGNOSTIC: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    THERAPEUTIC: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    COMPLICATION: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    OUTCOME: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  };

  const typeColor = typeColors[event.type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';

  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        {/* Type Badge */}
        <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${typeColor}`}>
          {event.type}
        </div>

        {/* Event Content */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {event.description}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {event.date || 'Date not specified'}
            {event.category && ` • ${event.category}`}
          </div>
          {event.relationships && event.relationships.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <ArrowRight className="w-3 h-3" />
              <span>{event.relationships.length} relationship(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Connector Line */}
      {showConnector && (
        <div className="ml-12 h-3 border-l-2 border-gray-200 dark:border-gray-700"></div>
      )}
    </div>
  );
};

// ============================================================================
// Treatment Response Content Component
// ============================================================================
const TreatmentResponseContent = ({ treatmentResponses }) => {
  const { responses, protocolCompliance } = treatmentResponses;

  // Display top 5 responses
  const displayResponses = responses.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Treatment Response Cards */}
      <div className="space-y-3">
        {displayResponses.map((response, index) => (
          <TreatmentResponseCard key={index} response={response} />
        ))}
      </div>

      {/* Protocol Compliance */}
      {protocolCompliance && protocolCompliance.items && protocolCompliance.items.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="font-medium text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Protocol Compliance
          </div>
          <div className="space-y-2">
            {protocolCompliance.items.slice(0, 3).map((item, index) => (
              <ProtocolComplianceItem key={index} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TreatmentResponseCard = ({ response }) => {
  const responseColors = {
    IMPROVED: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', icon: TrendingUp },
    WORSENED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', icon: TrendingDown },
    STABLE: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: Minus },
    NO_CHANGE: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: Minus },
    PARTIAL: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', icon: Activity }
  };

  const colors = responseColors[response.response] || responseColors.STABLE;
  const ResponseIcon = colors.icon;

  return (
    <div className={`p-3 ${colors.bg} rounded-lg border border-gray-200 dark:border-gray-700`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ResponseIcon className={`w-4 h-4 ${colors.text}`} />
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {response.intervention?.name || 'Intervention'}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {response.outcome?.description || 'Outcome tracked'}
          </div>
          {response.effectiveness && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    response.effectiveness.score >= 80
                      ? 'bg-green-500'
                      : response.effectiveness.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${response.effectiveness.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {response.effectiveness.score}%
              </span>
            </div>
          )}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text} border ${colors.text.replace('text-', 'border-')}`}>
          {response.response}
        </div>
      </div>
    </div>
  );
};

const ProtocolComplianceItem = ({ item }) => {
  const Icon = item.compliant ? CheckCircle : XCircle;
  const color = item.compliant
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className={`w-4 h-4 mt-0.5 ${color}`} />
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">{item.protocol}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {item.compliant ? item.actual : `Expected: ${item.expected}`}
          {item.importance === 'MANDATORY' && (
            <span className="ml-2 text-red-600 dark:text-red-400 font-medium">MANDATORY</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Functional Evolution Content Component
// ============================================================================
const FunctionalEvolutionContent = ({ functionalEvolution }) => {
  const { scoreTimeline, trajectory, milestones, statusChanges } = functionalEvolution;

  return (
    <div className="space-y-4">
      {/* Trajectory Summary */}
      {trajectory && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <TrajectoryIcon pattern={trajectory.pattern} />
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {trajectory.pattern ? trajectory.pattern.charAt(0).toUpperCase() + trajectory.pattern.slice(1) : 'Unknown'} Trajectory
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {trajectory.description || 'Functional status trend analysis'}
              </div>
            </div>
          </div>
          {trajectory.overallChange !== undefined && trajectory.overallChange !== null && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Overall change: <strong>{trajectory.overallChange > 0 ? '+' : ''}{trajectory.overallChange}%</strong> over{' '}
              {trajectory.durationDays} days
            </div>
          )}
        </div>
      )}

      {/* Score Timeline */}
      {scoreTimeline && scoreTimeline.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Functional Scores ({scoreTimeline.length} measurements)
          </div>
          {scoreTimeline.slice(0, 5).map((score, index) => (
            <ScoreTimelineItem key={index} score={score} />
          ))}
        </div>
      )}

      {/* Key Milestones */}
      {milestones && Object.keys(milestones).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.admissionBaseline && (
            <FunctionalMilestone
              title="Admission Baseline"
              score={milestones.admissionBaseline}
            />
          )}
          {milestones.postOpNadir && (
            <FunctionalMilestone
              title="Post-Op Nadir"
              score={milestones.postOpNadir}
            />
          )}
          {milestones.dischargeStatus && (
            <FunctionalMilestone
              title="Discharge Status"
              score={milestones.dischargeStatus}
            />
          )}
        </div>
      )}

      {/* Status Changes */}
      {statusChanges && statusChanges.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Activity className="w-4 h-4" />
            <span>
              <strong>{statusChanges.length}</strong> significant status change(s) detected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const TrajectoryIcon = ({ pattern }) => {
  const icons = {
    improving: <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />,
    declining: <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />,
    stable: <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />,
    fluctuating: <Activity className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
  };

  return icons[pattern] || <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
};

const ScoreTimelineItem = ({ score }) => (
  <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium text-blue-700 dark:text-blue-300">
      {score.type?.toUpperCase() || 'SCORE'}
    </div>
    <div className="flex-1 text-sm">
      <span className="font-medium text-gray-900 dark:text-gray-100">{score.score}</span>
      <span className="text-gray-500 dark:text-gray-500 ml-2">
        {score.date || score.context}
      </span>
    </div>
  </div>
);

const FunctionalMilestone = ({ title, score }) => (
  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{title}</div>
    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
      {score.type?.toUpperCase()}: {score.score}
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{score.date}</div>
  </div>
);

// ============================================================================
// Collapsible Section Component
// ============================================================================
const CollapsibleSection = ({ title, subtitle, expanded, onToggle, icon, children }) => (
  <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
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

export default ClinicalTimelinePanel;
