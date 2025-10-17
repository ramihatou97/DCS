/**
 * Phase 2 Component 3: Functional Status Evolution
 *
 * Tracks functional status changes over time and analyzes trajectory patterns.
 * Helps clinicians understand recovery patterns, identify turning points, and
 * compare actual outcomes with expected prognosis.
 *
 * Key Features:
 * - Score timeline construction (KPS, ECOG, mRS, GCS)
 * - Status change detection with magnitude and significance
 * - Trajectory analysis (IMPROVING, DECLINING, STABLE, FLUCTUATING)
 * - Trend classification (linear, stepwise, plateau)
 * - Key milestone identification (baseline, nadir, turning points, discharge)
 * - Prognostic integration (actual vs expected outcomes)
 */

import { parseFlexibleDate } from './dateUtils.js';

// Trajectory types
export const TRAJECTORY_TYPES = {
  IMPROVING: 'improving',
  DECLINING: 'declining',
  STABLE: 'stable',
  FLUCTUATING: 'fluctuating'
};

// Trend patterns
export const TREND_PATTERNS = {
  LINEAR: 'linear',           // Consistent direction
  STEPWISE: 'stepwise',       // Sudden changes with plateaus
  PLATEAU: 'plateau',         // Initial change then stable
  U_SHAPED: 'u_shaped',       // Decline then recovery
  INVERTED_U: 'inverted_u'    // Improvement then decline
};

// Rate of change
export const CHANGE_RATES = {
  RAPID: 'rapid',       // >2 points/week
  GRADUAL: 'gradual',   // 0.5-2 points/week
  SLOW: 'slow'          // <0.5 points/week
};

// Functional score types
export const SCORE_TYPES = {
  KPS: 'kps',           // Karnofsky Performance Status (0-100, higher is better)
  ECOG: 'ecog',         // ECOG Performance Status (0-5, lower is better)
  MRS: 'mrs',           // Modified Rankin Scale (0-6, lower is better)
  GCS: 'gcs',           // Glasgow Coma Scale (3-15, higher is better)
  NIHSS: 'nihss',       // NIH Stroke Scale (0-42, lower is better)
  ASIA: 'asia'          // ASIA Impairment Scale (A-E, E is best)
};

// Score metadata (direction and normalization)
const SCORE_METADATA = {
  kps: { min: 0, max: 100, betterDirection: 'higher', name: 'Karnofsky Performance Status' },
  ecog: { min: 0, max: 5, betterDirection: 'lower', name: 'ECOG Performance Status' },
  mrs: { min: 0, max: 6, betterDirection: 'lower', name: 'Modified Rankin Scale' },
  gcs: { min: 3, max: 15, betterDirection: 'higher', name: 'Glasgow Coma Scale' },
  nihss: { min: 0, max: 42, betterDirection: 'lower', name: 'NIH Stroke Scale' },
  asia: { min: 0, max: 4, betterDirection: 'higher', name: 'ASIA Impairment Scale' } // A=0, B=1, C=2, D=3, E=4
};

/**
 * Main function: Analyze functional status evolution
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} timeline - Optional causal timeline for context
 * @param {Object} pathologySubtype - Optional pathology subtype with prognosis
 * @returns {Object} Functional evolution analysis
 */
export function analyzeFunctionalEvolution(extractedData, timeline = null, pathologySubtype = null) {
  // Step 1: Extract all functional scores with timestamps
  const scoreTimeline = extractScoreTimeline(extractedData);

  if (!scoreTimeline || scoreTimeline.length === 0) {
    return {
      scoreTimeline: [],
      statusChanges: [],
      trajectory: null,
      milestones: {},
      prognosticComparison: null,
      summary: {
        hasData: false,
        message: 'No functional status scores found in discharge summary'
      }
    };
  }

  // Step 2: Detect status changes
  const statusChanges = detectStatusChanges(scoreTimeline);

  // Step 3: Analyze trajectory
  const trajectory = analyzeTrajectory(scoreTimeline, statusChanges);

  // Step 4: Identify key milestones
  const milestones = identifyMilestones(scoreTimeline, extractedData, timeline);

  // Step 5: Compare with prognostic expectations (if available)
  const prognosticComparison = pathologySubtype
    ? compareWithPrognosis(scoreTimeline, pathologySubtype, extractedData)
    : null;

  // Step 6: Generate summary
  const summary = generateEvolutionSummary(scoreTimeline, trajectory, statusChanges, prognosticComparison);

  return {
    scoreTimeline,
    statusChanges,
    trajectory,
    milestones,
    prognosticComparison,
    summary
  };
}

/**
 * Extract all functional scores with timestamps
 */
function extractScoreTimeline(extractedData) {
  const scores = [];

  // Extract functional scores from functionalStatus section
  if (extractedData.functionalStatus?.scores) {
    extractedData.functionalStatus.scores.forEach(scoreEntry => {
      const parsed = parseScoreEntry(scoreEntry);
      if (parsed) {
        scores.push(parsed);
      }
    });
  }

  // FALLBACK: Extract from functionalScores (populated by extraction.js)
  if (extractedData.functionalScores && Object.keys(extractedData.functionalScores).length > 0) {
    const dischargeDate = extractedData.dates?.discharge || extractedData.dates?.dischargeDate;
    const admissionDate = extractedData.dates?.admission || extractedData.dates?.admissionDate;

    // Map score types to standardized names (all lowercase for consistency)
    const scoreMap = {
      kps: SCORE_TYPES.KPS,
      ecog: SCORE_TYPES.ECOG,
      mRS: SCORE_TYPES.MRS,
      mrs: SCORE_TYPES.MRS,
      gcs: SCORE_TYPES.GCS,
      nihss: SCORE_TYPES.NIHSS,
      barthel: 'barthel',
      asia: SCORE_TYPES.ASIA
    };

    for (const [key, value] of Object.entries(extractedData.functionalScores)) {
      if (value !== null && value !== undefined) {
        const scoreType = scoreMap[key] || key.toLowerCase();
        scores.push({
          type: scoreType,
          score: value,
          date: dischargeDate || admissionDate,
          timestamp: dischargeDate
            ? parseFlexibleDate(dischargeDate)?.getTime()
            : admissionDate
              ? parseFlexibleDate(admissionDate)?.getTime()
              : Date.now(),
          context: 'discharge_or_admission',
          raw: { [key]: value }
        });
      }
    }
  }

  // Extract GCS from neurological assessment
  if (extractedData.neurologicalAssessment?.gcs) {
    const gcsEntries = Array.isArray(extractedData.neurologicalAssessment.gcs)
      ? extractedData.neurologicalAssessment.gcs
      : [extractedData.neurologicalAssessment.gcs];

    gcsEntries.forEach(entry => {
      if (typeof entry === 'object' && entry.score !== undefined) {
        scores.push({
          type: SCORE_TYPES.GCS,
          score: entry.score,
          date: entry.date,
          timestamp: entry.date ? parseFlexibleDate(entry.date)?.getTime() : null,
          context: entry.context || 'neurological_assessment',
          raw: entry
        });
      }
    });
  }

  // Extract mRS from discharge status
  if (extractedData.discharge?.mrs !== undefined) {
    scores.push({
      type: SCORE_TYPES.MRS,
      score: extractedData.discharge.mrs,
      date: extractedData.discharge.date || extractedData.dates?.discharge,
      timestamp: extractedData.discharge.date
        ? parseFlexibleDate(extractedData.discharge.date)?.getTime()
        : extractedData.dates?.discharge
          ? parseFlexibleDate(extractedData.dates.discharge)?.getTime()
          : null,
      context: 'discharge',
      raw: extractedData.discharge
    });
  }

  // Sort chronologically
  return scores
    .filter(s => s.timestamp) // Only keep scores with valid timestamps
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Parse a score entry into standardized format
 */
function parseScoreEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // Determine score type
  let type = null;
  let score = null;

  if (entry.type) {
    type = entry.type.toLowerCase();
  } else if (entry.kps !== undefined) {
    type = SCORE_TYPES.KPS;
    score = entry.kps;
  } else if (entry.ecog !== undefined) {
    type = SCORE_TYPES.ECOG;
    score = entry.ecog;
  } else if (entry.mrs !== undefined) {
    type = SCORE_TYPES.MRS;
    score = entry.mrs;
  } else if (entry.gcs !== undefined) {
    type = SCORE_TYPES.GCS;
    score = entry.gcs;
  } else if (entry.nihss !== undefined) {
    type = SCORE_TYPES.NIHSS;
    score = entry.nihss;
  } else if (entry.asia !== undefined) {
    type = SCORE_TYPES.ASIA;
    score = normalizeAsiaScore(entry.asia);
  }

  if (!type) return null;

  // Get score value
  if (score === null) {
    score = entry.score !== undefined ? entry.score : entry.value;
  }

  if (score === undefined || score === null) return null;

  // Parse timestamp
  const date = entry.date || entry.timestamp;
  const timestamp = date ? parseFlexibleDate(date)?.getTime() : null;

  return {
    type,
    score,
    date,
    timestamp,
    context: entry.context || 'assessment',
    raw: entry
  };
}

/**
 * Normalize ASIA grade (A-E) to numeric scale
 */
function normalizeAsiaScore(asia) {
  if (typeof asia === 'number') return asia;

  const gradeMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
  return gradeMap[asia?.toUpperCase()] ?? null;
}

/**
 * Detect significant status changes
 */
function detectStatusChanges(scoreTimeline) {
  const changes = [];

  // Group by score type
  const byType = {};
  scoreTimeline.forEach(entry => {
    if (!byType[entry.type]) byType[entry.type] = [];
    byType[entry.type].push(entry);
  });

  // Detect changes within each score type
  Object.entries(byType).forEach(([type, entries]) => {
    if (entries.length < 2) return;

    const metadata = SCORE_METADATA[type];
    if (!metadata) return;

    for (let i = 1; i < entries.length; i++) {
      const from = entries[i - 1];
      const to = entries[i];

      const scoreDelta = to.score - from.score;
      const timeDelta = to.timestamp - from.timestamp;
      const daysDelta = timeDelta / (1000 * 60 * 60 * 24);

      // Determine direction (improvement vs deterioration)
      let direction;
      if (metadata.betterDirection === 'higher') {
        direction = scoreDelta > 0 ? 'improvement' : scoreDelta < 0 ? 'deterioration' : 'stable';
      } else {
        direction = scoreDelta < 0 ? 'improvement' : scoreDelta > 0 ? 'deterioration' : 'stable';
      }

      // Calculate magnitude (as percentage of scale range)
      const range = metadata.max - metadata.min;
      const magnitude = Math.abs(scoreDelta) / range;

      // Determine significance
      let significance;
      if (magnitude >= 0.30) {
        significance = 'major'; // ≥30% change
      } else if (magnitude >= 0.15) {
        significance = 'moderate'; // 15-29% change
      } else if (magnitude >= 0.05) {
        significance = 'minor'; // 5-14% change
      } else {
        significance = 'minimal'; // <5% change
      }

      if (direction !== 'stable') {
        changes.push({
          type,
          from: {
            score: from.score,
            date: from.date,
            timestamp: from.timestamp,
            context: from.context
          },
          to: {
            score: to.score,
            date: to.date,
            timestamp: to.timestamp,
            context: to.context
          },
          delta: {
            score: scoreDelta,
            days: Math.round(daysDelta),
            direction,
            magnitude: Math.round(magnitude * 100) / 100,
            significance
          }
        });
      }
    }
  });

  // FALLBACK: If no same-type changes detected, try cross-type comparison for mixed score timelines
  if (changes.length === 0 && scoreTimeline.length >= 2) {
    // Sort timeline chronologically
    const sorted = [...scoreTimeline].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sorted.length; i++) {
      const from = sorted[i - 1];
      const to = sorted[i];

      // Normalize scores to 0-100 scale for cross-type comparison
      // Use case-insensitive lookup
      const fromMeta = SCORE_METADATA[from.type?.toLowerCase()];
      const toMeta = SCORE_METADATA[to.type?.toLowerCase()];

      if (!fromMeta || !toMeta) continue;

      const fromNormalized = ((from.score - fromMeta.min) / (fromMeta.max - fromMeta.min)) * 100;
      const toNormalized = ((to.score - toMeta.min) / (toMeta.max - toMeta.min)) * 100;

      // Adjust for score direction (some scales: higher=better, others: lower=better)
      const fromAdjusted = fromMeta.betterDirection === 'lower' ? (100 - fromNormalized) : fromNormalized;
      const toAdjusted = toMeta.betterDirection === 'lower' ? (100 - toNormalized) : toNormalized;

      const delta = toAdjusted - fromAdjusted;
      const timeDelta = to.timestamp - from.timestamp;
      const daysDelta = timeDelta / (1000 * 60 * 60 * 24);

      if (Math.abs(delta) >= 5) { // At least 5 point change on normalized scale
        changes.push({
          type: `${from.type}_to_${to.type}`,
          from: {
            score: from.score,
            date: from.date,
            timestamp: from.timestamp,
            context: from.context,
            normalized: Math.round(fromAdjusted)
          },
          to: {
            score: to.score,
            date: to.date,
            timestamp: to.timestamp,
            context: to.context,
            normalized: Math.round(toAdjusted)
          },
          delta: {
            score: Math.round(delta),
            days: Math.round(daysDelta),
            direction: delta > 0 ? 'improvement' : 'deterioration',
            magnitude: Math.abs(delta) / 100,
            significance: Math.abs(delta) >= 20 ? 'major' : Math.abs(delta) >= 10 ? 'moderate' : 'minor'
          },
          crossTypeComparison: true
        });
      }
    }
  }

  return changes;
}

/**
 * Analyze overall trajectory pattern
 */
function analyzeTrajectory(scoreTimeline, statusChanges) {
  if (scoreTimeline.length < 2) {
    return {
      pattern: TRAJECTORY_TYPES.STABLE,
      trend: TREND_PATTERNS.PLATEAU,
      rate: null,
      confidence: 0.5,
      description: 'Insufficient data points for trajectory analysis'
    };
  }

  // Normalize all scores to 0-100 scale for comparison
  const normalizedScores = scoreTimeline.map(entry => {
    const metadata = SCORE_METADATA[entry.type];
    if (!metadata) return null;

    let normalized;
    if (metadata.betterDirection === 'higher') {
      // Higher is better: map to 0-100
      normalized = ((entry.score - metadata.min) / (metadata.max - metadata.min)) * 100;
    } else {
      // Lower is better: invert then map to 0-100
      normalized = ((metadata.max - entry.score) / (metadata.max - metadata.min)) * 100;
    }

    return {
      timestamp: entry.timestamp,
      normalized,
      original: entry
    };
  }).filter(e => e !== null);

  // Calculate overall direction
  const first = normalizedScores[0];
  const last = normalizedScores[normalizedScores.length - 1];
  const overallDelta = last.normalized - first.normalized;
  const totalDays = (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24);

  // Determine pattern
  let pattern;
  if (Math.abs(overallDelta) < 10) {
    pattern = TRAJECTORY_TYPES.STABLE;
  } else {
    // Check for fluctuation
    const improvements = statusChanges.filter(c => c.delta.direction === 'improvement').length;
    const deteriorations = statusChanges.filter(c => c.delta.direction === 'deterioration').length;

    if (improvements > 0 && deteriorations > 0) {
      pattern = TRAJECTORY_TYPES.FLUCTUATING;
    } else {
      pattern = overallDelta > 0 ? TRAJECTORY_TYPES.IMPROVING : TRAJECTORY_TYPES.DECLINING;
    }
  }

  // Determine trend pattern
  let trend;
  if (statusChanges.length === 0) {
    trend = TREND_PATTERNS.PLATEAU;
  } else {
    const majorChanges = statusChanges.filter(c => c.delta.significance === 'major');

    if (majorChanges.length === 1 && statusChanges.length > 2) {
      trend = TREND_PATTERNS.STEPWISE;
    } else if (normalizedScores.length >= 3) {
      const mid = normalizedScores[Math.floor(normalizedScores.length / 2)];
      const firstHalfDelta = mid.normalized - first.normalized;
      const secondHalfDelta = last.normalized - mid.normalized;

      if (firstHalfDelta < -10 && secondHalfDelta > 10) {
        trend = TREND_PATTERNS.U_SHAPED;
      } else if (firstHalfDelta > 10 && secondHalfDelta < -10) {
        trend = TREND_PATTERNS.INVERTED_U;
      } else if (Math.abs(firstHalfDelta) > 10 && Math.abs(secondHalfDelta) < 5) {
        trend = TREND_PATTERNS.PLATEAU;
      } else {
        trend = TREND_PATTERNS.LINEAR;
      }
    } else {
      trend = TREND_PATTERNS.LINEAR;
    }
  }

  // Calculate rate of change (points per week)
  let rate = null;
  if (totalDays > 0) {
    const ratePerWeek = Math.abs(overallDelta) / (totalDays / 7);
    if (ratePerWeek > 20) {
      rate = CHANGE_RATES.RAPID;
    } else if (ratePerWeek > 5) {
      rate = CHANGE_RATES.GRADUAL;
    } else {
      rate = CHANGE_RATES.SLOW;
    }
  }

  return {
    pattern,
    trend,
    rate,
    overallChange: Math.round(overallDelta),
    durationDays: Math.round(totalDays),
    confidence: statusChanges.length >= 2 ? 0.85 : 0.6,
    description: generateTrajectoryDescription(pattern, trend, rate, overallDelta)
  };
}

/**
 * Generate human-readable trajectory description
 */
function generateTrajectoryDescription(pattern, trend, rate, overallChange) {
  const patternText = {
    improving: 'improving',
    declining: 'declining',
    stable: 'stable',
    fluctuating: 'fluctuating'
  }[pattern];

  const trendText = {
    linear: 'consistent',
    stepwise: 'stepwise',
    plateau: 'plateaued',
    u_shaped: 'initial decline followed by recovery',
    inverted_u: 'initial improvement followed by decline'
  }[trend];

  const rateText = rate ? {
    rapid: 'rapid',
    gradual: 'gradual',
    slow: 'slow'
  }[rate] : '';

  return `Functional status is ${patternText} with ${trendText} pattern${rateText ? ` at ${rateText} rate` : ''}`;
}

/**
 * Identify key milestones
 */
function identifyMilestones(scoreTimeline, extractedData, timeline) {
  const milestones = {};

  if (scoreTimeline.length === 0) return milestones;

  // Admission baseline
  milestones.admissionBaseline = scoreTimeline[0];

  // Discharge status
  milestones.dischargeStatus = scoreTimeline[scoreTimeline.length - 1];

  // Find post-operative nadir (worst score after surgery)
  if (timeline?.milestones?.surgery) {
    const surgeryTimestamp = timeline.milestones.surgery.timestamp;
    const postOpScores = scoreTimeline.filter(s => s.timestamp > surgeryTimestamp);

    if (postOpScores.length > 0) {
      // Find worst normalized score
      const nadirScore = postOpScores.reduce((worst, current) => {
        const currentNormalized = normalizeScore(current);
        const worstNormalized = normalizeScore(worst);
        return currentNormalized < worstNormalized ? current : worst;
      });

      milestones.postOpNadir = nadirScore;
    }
  }

  // Find turning points (inflection points in trajectory)
  const turningPoints = [];
  for (let i = 1; i < scoreTimeline.length - 1; i++) {
    const prev = normalizeScore(scoreTimeline[i - 1]);
    const curr = normalizeScore(scoreTimeline[i]);
    const next = normalizeScore(scoreTimeline[i + 1]);

    // Check for directional change
    const delta1 = curr - prev;
    const delta2 = next - curr;

    if ((delta1 > 0 && delta2 < 0) || (delta1 < 0 && delta2 > 0)) {
      turningPoints.push(scoreTimeline[i]);
    }
  }

  if (turningPoints.length > 0) {
    milestones.turningPoints = turningPoints;
  }

  return milestones;
}

/**
 * Normalize score to 0-100 scale (higher is better)
 */
function normalizeScore(scoreEntry) {
  const metadata = SCORE_METADATA[scoreEntry.type];
  if (!metadata) return 50; // Default middle value

  if (metadata.betterDirection === 'higher') {
    return ((scoreEntry.score - metadata.min) / (metadata.max - metadata.min)) * 100;
  } else {
    return ((metadata.max - scoreEntry.score) / (metadata.max - metadata.min)) * 100;
  }
}

/**
 * Compare actual outcomes with prognostic expectations
 */
function compareWithPrognosis(scoreTimeline, pathologySubtype, extractedData) {
  if (!pathologySubtype?.prognosis) return null;

  const comparison = {
    expected: pathologySubtype.prognosis,
    actual: {},
    variance: {}
  };

  // Get discharge functional status
  const dischargeScore = scoreTimeline[scoreTimeline.length - 1];

  if (dischargeScore) {
    comparison.actual.dischargeScore = {
      type: dischargeScore.type,
      value: dischargeScore.score,
      normalized: normalizeScore(dischargeScore)
    };

    // Compare with expected good outcome rate
    if (pathologySubtype.prognosis.goodOutcome) {
      const expected = parseFloat(pathologySubtype.prognosis.goodOutcome);
      const actual = normalizeScore(dischargeScore);

      comparison.variance.functionalOutcome = {
        expected: `${expected}% good outcome probability`,
        actual: `${Math.round(actual)}% functional status`,
        betterThanExpected: actual > expected,
        difference: Math.round(actual - expected)
      };
    }
  }

  return comparison;
}

/**
 * Generate evolution summary
 */
function generateEvolutionSummary(scoreTimeline, trajectory, statusChanges, prognosticComparison) {
  const summary = {
    hasData: true,
    dataPoints: scoreTimeline.length,
    scoringTypes: [...new Set(scoreTimeline.map(s => s.type))],
    significantChanges: statusChanges.filter(c => ['major', 'moderate'].includes(c.delta.significance)).length,
    trajectory: trajectory.description
  };

  if (prognosticComparison?.variance?.functionalOutcome) {
    summary.prognosticComparison = prognosticComparison.variance.functionalOutcome.betterThanExpected
      ? 'Better than expected'
      : 'As expected or below';
  }

  return summary;
}
