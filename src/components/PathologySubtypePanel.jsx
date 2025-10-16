/**
 * PathologySubtypePanel Component
 *
 * Displays detailed pathology subtype information including:
 * - Clinical details (location, grade, size, etc.)
 * - Risk stratification
 * - Prognostic predictions
 * - Treatment recommendations
 * - Complication risks
 */

import React, { useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Info, Heart, Brain, Bone, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

const PathologySubtypePanel = ({ subtype }) => {
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    prognosis: true,
    recommendations: false,
    complications: false
  });

  if (!subtype || !subtype.type) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="card border-l-4 border-l-purple-500 dark:border-l-purple-400">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Pathology Intelligence</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-generated clinical insights and risk stratification
          </p>
        </div>
        <RiskLevelBadge riskLevel={subtype.riskLevel} />
      </div>

      {/* Pathology Type Indicator */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          {getPathologyIcon(subtype.type)}
          <span className="font-medium text-sm">
            {formatPathologyType(subtype.type)} Subtype Analysis
          </span>
        </div>
      </div>

      {/* Clinical Details Section */}
      <CollapsibleSection
        title="Clinical Details"
        expanded={expandedSections.details}
        onToggle={() => toggleSection('details')}
        icon={<Info className="w-4 h-4" />}
      >
        <ClinicalDetailsContent subtype={subtype} />
      </CollapsibleSection>

      {/* Prognosis Section */}
      {Object.keys(subtype.prognosis || {}).length > 0 && (
        <CollapsibleSection
          title="Prognosis & Risk Assessment"
          expanded={expandedSections.prognosis}
          onToggle={() => toggleSection('prognosis')}
          icon={<TrendingUp className="w-4 h-4" />}
        >
          <PrognosisContent prognosis={subtype.prognosis} type={subtype.type} />
        </CollapsibleSection>
      )}

      {/* Treatment Recommendations Section */}
      {subtype.recommendations && Object.keys(subtype.recommendations).length > 0 && (
        <CollapsibleSection
          title="Treatment Recommendations"
          expanded={expandedSections.recommendations}
          onToggle={() => toggleSection('recommendations')}
          icon={<CheckCircle className="w-4 h-4" />}
        >
          <TreatmentRecommendationsContent recommendations={subtype.recommendations} />
        </CollapsibleSection>
      )}

      {/* Complications Watch List Section */}
      {subtype.complications && subtype.complications.length > 0 && (
        <CollapsibleSection
          title="Complications Watch List"
          expanded={expandedSections.complications}
          onToggle={() => toggleSection('complications')}
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          <ComplicationsContent complications={subtype.complications} />
        </CollapsibleSection>
      )}
    </div>
  );
};

/**
 * Risk Level Badge Component
 */
const RiskLevelBadge = ({ riskLevel }) => {
  const colors = {
    'LOW': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    'MODERATE': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    'HIGH': 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    'VERY HIGH': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
  };

  const bgColor = colors[riskLevel] || colors['MODERATE'];

  return (
    <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${bgColor}`}>
      {riskLevel || 'MODERATE'} RISK
    </div>
  );
};

/**
 * Get pathology icon based on type
 */
const getPathologyIcon = (type) => {
  const iconMap = {
    'SAH': <Heart className="w-4 h-4 text-red-500" />,
    'TUMORS': <Brain className="w-4 h-4 text-purple-500" />,
    'SPINE': <Bone className="w-4 h-4 text-blue-500" />,
    'TBI': <Brain className="w-4 h-4 text-orange-500" />,
    'HYDROCEPHALUS': <Activity className="w-4 h-4 text-cyan-500" />
  };

  return iconMap[type] || <Activity className="w-4 h-4 text-gray-500" />;
};

/**
 * Format pathology type for display
 */
const formatPathologyType = (type) => {
  const typeMap = {
    'SAH': 'Subarachnoid Hemorrhage',
    'TUMORS': 'Brain Tumor',
    'SPINE': 'Spine Injury',
    'TBI': 'Traumatic Brain Injury',
    'HYDROCEPHALUS': 'Hydrocephalus'
  };

  return typeMap[type] || type;
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection = ({ title, icon, children, expanded, onToggle }) => {
  return (
    <div className="mb-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-gray-600 dark:text-gray-400">{icon}</div>
          <span className="font-medium text-sm">{title}</span>
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
};

/**
 * Clinical Details Content
 */
const ClinicalDetailsContent = ({ subtype }) => {
  const { details, type } = subtype;

  if (!details || Object.keys(details).length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No detailed clinical information available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* SAH-specific details */}
      {type === 'SAH' && (
        <>
          {details.aneurysmLocation && (
            <DetailRow label="Aneurysm Location" value={details.aneurysmLocation} />
          )}
          {details.aneurysmSize && (
            <DetailRow label="Aneurysm Size" value={details.aneurysmSize} />
          )}
          {details.vasospasmRisk && (
            <DetailRow
              label="Vasospasm Risk"
              value={details.vasospasmRisk}
              badge={getRiskBadgeForPercentage(details.vasospasmRisk)}
            />
          )}
          {details.locationRisks && details.locationRisks.length > 0 && (
            <DetailRow
              label="Location-Specific Risks"
              value={
                <div className="flex flex-wrap gap-2">
                  {details.locationRisks.map((risk, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                      {risk}
                    </span>
                  ))}
                </div>
              }
            />
          )}
          {details.surgicalDifficulty && (
            <DetailRow label="Surgical Difficulty" value={details.surgicalDifficulty} />
          )}
        </>
      )}

      {/* Tumor-specific details */}
      {type === 'TUMORS' && (
        <>
          {details.whoGrade && (
            <DetailRow label="WHO Grade" value={details.whoGrade} />
          )}
          {details.molecularMarkers && details.molecularMarkers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Molecular Markers:
              </div>
              {details.molecularMarkers.map((marker, idx) => (
                <div key={idx} className="ml-4 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-2 border-purple-500">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{marker.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      {marker.impact}
                    </span>
                  </div>
                  {marker.significance && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {marker.significance}
                    </div>
                  )}
                  {marker.prognosis && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Prognosis: {marker.prognosis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {details.resectionExtent && (
            <DetailRow label="Resection Extent" value={details.resectionExtent} />
          )}
          {details.survivalImpact && (
            <DetailRow label="Survival Impact" value={details.survivalImpact} />
          )}
        </>
      )}

      {/* Spine-specific details */}
      {type === 'SPINE' && (
        <>
          {details.asiaGrade && (
            <DetailRow label="ASIA Grade" value={details.asiaGrade} />
          )}
          {details.level && (
            <DetailRow label="Injury Level" value={details.level} />
          )}
          {details.impact && (
            <DetailRow label="Functional Impact" value={details.impact} />
          )}
        </>
      )}

      {/* Generic details for other fields */}
      {Object.entries(details).filter(([key]) =>
        !['aneurysmLocation', 'aneurysmSize', 'vasospasmRisk', 'locationRisks', 'surgicalDifficulty',
          'whoGrade', 'molecularMarkers', 'resectionExtent', 'survivalImpact',
          'asiaGrade', 'level', 'impact'].includes(key)
      ).map(([key, value]) => (
        <DetailRow
          key={key}
          label={formatLabel(key)}
          value={typeof value === 'object' ? JSON.stringify(value) : value}
        />
      ))}
    </div>
  );
};

/**
 * Prognosis Content
 */
const PrognosisContent = ({ prognosis, type }) => {
  if (!prognosis || Object.keys(prognosis).length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No prognostic information available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* SAH prognosis */}
      {type === 'SAH' && (
        <>
          {prognosis.mortality && (
            <PrognosisCard
              label="Mortality Risk"
              value={prognosis.mortality}
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              trend="negative"
            />
          )}
          {prognosis.goodOutcome && (
            <PrognosisCard
              label="Good Outcome Probability"
              value={prognosis.goodOutcome}
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              trend="positive"
            />
          )}
          {prognosis.vasospasmRisk && (
            <PrognosisCard
              label="Vasospasm Risk"
              value={prognosis.vasospasmRisk}
              icon={<Activity className="w-5 h-5 text-orange-500" />}
            />
          )}
        </>
      )}

      {/* Tumor prognosis */}
      {type === 'TUMORS' && (
        <>
          {prognosis.survival && (
            <PrognosisCard
              label="Median Survival"
              value={prognosis.survival}
              icon={<Heart className="w-5 h-5 text-purple-500" />}
            />
          )}
          {prognosis.factors && prognosis.factors.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Prognostic Factors:
              </div>
              <ul className="space-y-1">
                {prognosis.factors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {prognosis.malignancy && (
            <DetailRow label="Malignancy" value={prognosis.malignancy} />
          )}
          {prognosis.growth && (
            <DetailRow label="Growth Pattern" value={prognosis.growth} />
          )}
        </>
      )}

      {/* Spine prognosis */}
      {type === 'SPINE' && (
        <>
          {prognosis.recovery && (
            <PrognosisCard
              label="Recovery Prognosis"
              value={prognosis.recovery}
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            />
          )}
          {prognosis.ambulation && (
            <PrognosisCard
              label="Ambulation Prognosis"
              value={prognosis.ambulation}
              icon={<Activity className="w-5 h-5 text-blue-500" />}
            />
          )}
        </>
      )}

      {/* Other prognosis fields */}
      {Object.entries(prognosis).filter(([key]) =>
        !['mortality', 'goodOutcome', 'vasospasmRisk', 'survival', 'factors', 'malignancy', 'growth', 'recovery', 'ambulation'].includes(key)
      ).map(([key, value]) => (
        <DetailRow
          key={key}
          label={formatLabel(key)}
          value={typeof value === 'object' ? JSON.stringify(value) : value}
        />
      ))}
    </div>
  );
};

/**
 * Treatment Recommendations Content
 */
const TreatmentRecommendationsContent = ({ recommendations }) => {
  if (!recommendations || Object.keys(recommendations).length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No treatment recommendations available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.imaging && recommendations.imaging.length > 0 && (
        <RecommendationCategory
          title="Imaging Protocols"
          items={recommendations.imaging}
          color="blue"
        />
      )}

      {recommendations.medications && recommendations.medications.length > 0 && (
        <RecommendationCategory
          title="Medication Protocols"
          items={recommendations.medications}
          color="purple"
        />
      )}

      {recommendations.monitoring && recommendations.monitoring.length > 0 && (
        <RecommendationCategory
          title="Monitoring Protocols"
          items={recommendations.monitoring}
          color="green"
        />
      )}
    </div>
  );
};

/**
 * Complications Content
 */
const ComplicationsContent = ({ complications }) => {
  if (!complications || complications.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No specific complications identified
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complications.map((complication, idx) => (
        <div
          key={idx}
          className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {complication.name}
            </div>
            {complication.risk && (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                getRiskColorClasses(complication.risk)
              }`}>
                {complication.risk} RISK
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
            {complication.timing && (
              <div className="flex items-start">
                <span className="font-medium mr-2">Timing:</span>
                <span>{complication.timing}</span>
              </div>
            )}

            {complication.management && (
              <div className="flex items-start">
                <span className="font-medium mr-2">Management:</span>
                <span>{complication.management}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Helper Components
 */

const DetailRow = ({ label, value, badge }) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-800">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
      {label}:
    </span>
    <div className="text-sm text-gray-900 dark:text-gray-100 text-right flex-1 flex items-center justify-end gap-2">
      {typeof value === 'string' || typeof value === 'number' ? value : value}
      {badge}
    </div>
  </div>
);

const PrognosisCard = ({ label, value, icon, trend }) => (
  <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
        {trend === 'positive' && <TrendingUp className="w-4 h-4 text-green-500" />}
        {trend === 'negative' && <TrendingDown className="w-4 h-4 text-red-500" />}
        {trend === 'neutral' && <Minus className="w-4 h-4 text-gray-500" />}
      </div>
    </div>
  </div>
);

const RecommendationCategory = ({ title, items, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-900 dark:text-purple-100',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900 dark:text-green-100'
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm flex items-start">
            <span className="mr-2 text-gray-500">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Utility Functions
 */

const getRiskBadgeForPercentage = (percentage) => {
  const value = parseInt(percentage);
  if (value >= 60) return <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-semibold">HIGH</span>;
  if (value >= 30) return <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-xs font-semibold">MODERATE</span>;
  return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-semibold">LOW</span>;
};

const getRiskColorClasses = (risk) => {
  const riskUpper = (risk || '').toUpperCase();

  if (riskUpper.includes('VERY HIGH')) {
    return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
  }
  if (riskUpper.includes('HIGH')) {
    return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
  }
  if (riskUpper.includes('MODERATE')) {
    return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
  }
  if (riskUpper.includes('LOW')) {
    return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
  }

  return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
};

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default PathologySubtypePanel;
