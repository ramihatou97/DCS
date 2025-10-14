/**
 * Date Utilities for Medical Timeline Reconstruction
 * 
 * CRITICAL for chronological narrative accuracy
 */

import { parse, format, isValid, compareAsc, differenceInDays } from 'date-fns';

/**
 * Parse various date formats found in medical notes
 */
export const parseFlexibleDate = (dateString) => {
  if (!dateString) return null;
  
  // Try different date formats commonly found in medical notes
  const formats = [
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MM-dd-yyyy',
    'M-d-yyyy',
    'yyyy-MM-dd',
    'MM/dd/yy',
    'M/d/yy',
    'MMM d, yyyy', // Jan 1, 2024
    'MMMM d, yyyy', // January 1, 2024
    'd MMM yyyy', // 1 Jan 2024
    'MM.dd.yyyy',
    'M.d.yyyy'
  ];
  
  for (const formatString of formats) {
    try {
      const parsed = parse(dateString, formatString, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Try native Date parsing as fallback
  try {
    const nativeDate = new Date(dateString);
    if (isValid(nativeDate)) {
      return nativeDate;
    }
  } catch (e) {
    // Failed
  }
  
  return null;
};

/**
 * Extract all dates from text with context
 */
export const extractDatesFromText = (text) => {
  const datePatterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g, // MM/DD/YYYY or MM-DD-YYYY
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b/gi, // January 1, 2024
    /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/gi // 1 January 2024
  ];
  
  const found = [];
  
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dateStr = match[0];
      const parsed = parseFlexibleDate(dateStr);
      
      if (parsed) {
        // Get surrounding context (50 chars before and after)
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + dateStr.length + 50);
        const context = text.substring(start, end);
        
        found.push({
          date: parsed,
          dateString: dateStr,
          position: match.index,
          context: context.trim()
        });
      }
    }
  }
  
  // Sort by date
  return found.sort((a, b) => compareAsc(a.date, b.date));
};

/**
 * Normalize date to standard format for display
 */
export const formatMedicalDate = (date, formatString = 'MM/dd/yyyy') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseFlexibleDate(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString);
};

/**
 * Calculate hospital length of stay
 */
export const calculateLOS = (admissionDate, dischargeDate) => {
  const admission = typeof admissionDate === 'string' ? parseFlexibleDate(admissionDate) : admissionDate;
  const discharge = typeof dischargeDate === 'string' ? parseFlexibleDate(dischargeDate) : dischargeDate;
  
  if (!admission || !discharge) return null;
  
  const days = differenceInDays(discharge, admission);
  return days >= 0 ? days : null;
};

/**
 * Determine postoperative day (POD)
 */
export const calculatePOD = (surgeryDate, currentDate) => {
  const surgery = typeof surgeryDate === 'string' ? parseFlexibleDate(surgeryDate) : surgeryDate;
  const current = typeof currentDate === 'string' ? parseFlexibleDate(currentDate) : currentDate;
  
  if (!surgery || !current) return null;
  
  const days = differenceInDays(current, surgery);
  return days >= 0 ? days : null;
};

/**
 * Extract relative time phrases (e.g., "3 days ago", "POD 5")
 */
export const parseRelativeTime = (text, referenceDate) => {
  const patterns = [
    /(\d+)\s+days?\s+ago/i,
    /(\d+)\s+weeks?\s+ago/i,
    /POD\s*(\d+)/i, // Postoperative day
    /HD\s*(\d+)/i, // Hospital day
    /yesterday/i,
    /today/i,
    /tomorrow/i
  ];
  
  const reference = typeof referenceDate === 'string' ? parseFlexibleDate(referenceDate) : referenceDate || new Date();
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('days')) {
        const days = parseInt(match[1]);
        const date = new Date(reference);
        date.setDate(date.getDate() - days);
        return date;
      }
      if (pattern.source.includes('weeks')) {
        const weeks = parseInt(match[1]);
        const date = new Date(reference);
        date.setDate(date.getDate() - (weeks * 7));
        return date;
      }
      if (pattern.source.includes('POD') || pattern.source.includes('HD')) {
        // Need surgery date or admission date as reference
        return parseInt(match[1]);
      }
      if (pattern.source.includes('yesterday')) {
        const date = new Date(reference);
        date.setDate(date.getDate() - 1);
        return date;
      }
      if (pattern.source.includes('today')) {
        return new Date(reference);
      }
      if (pattern.source.includes('tomorrow')) {
        const date = new Date(reference);
        date.setDate(date.getDate() + 1);
        return date;
      }
    }
  }
  
  return null;
};

/**
 * Sort events chronologically
 */
export const sortEventsByDate = (events) => {
  return events.sort((a, b) => {
    const dateA = typeof a.date === 'string' ? parseFlexibleDate(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? parseFlexibleDate(b.date) : b.date;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return compareAsc(dateA, dateB);
  });
};

/**
 * Generate chronological timeline from events
 */
export const buildTimeline = (events) => {
  const sorted = sortEventsByDate(events);
  
  return sorted.map((event, index) => ({
    ...event,
    chronologicalIndex: index,
    isFirst: index === 0,
    isLast: index === sorted.length - 1,
    daysSinceStart: index > 0 ? differenceInDays(
      typeof event.date === 'string' ? parseFlexibleDate(event.date) : event.date,
      typeof sorted[0].date === 'string' ? parseFlexibleDate(sorted[0].date) : sorted[0].date
    ) : 0
  }));
};

/**
 * Normalize date to standard format
 */
export const normalizeDate = (date) => {
  if (!date) return null;
  const parsed = typeof date === 'string' ? parseFlexibleDate(date) : date;
  return parsed ? format(parsed, 'yyyy-MM-dd') : null;
};

/**
 * Compare two dates
 */
export const compareDates = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseFlexibleDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseFlexibleDate(date2) : date2;
  if (!d1 || !d2) return 0;
  return compareAsc(d1, d2);
};

/**
 * Check if date is valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const parsed = typeof date === 'string' ? parseFlexibleDate(date) : date;
  return parsed && isValid(parsed);
};

/**
 * Format date for display
 */
export const formatDate = (date, formatString = 'MM/dd/yyyy') => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseFlexibleDate(date) : date;
  return parsed ? format(parsed, formatString) : '';
};

/**
 * Calculate days between two dates
 */
export const calculateDaysBetween = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseFlexibleDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseFlexibleDate(endDate) : endDate;
  if (!start || !end) return 0;
  return differenceInDays(end, start);
};

/**
 * Get relative time description
 */
export const getRelativeTime = (date, referenceDate = new Date()) => {
  const d = typeof date === 'string' ? parseFlexibleDate(date) : date;
  if (!d) return '';
  
  const days = differenceInDays(referenceDate, d);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days === -1) return 'tomorrow';
  if (days > 0) return `${days} days ago`;
  return `in ${Math.abs(days)} days`;
};
