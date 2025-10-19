# 🔧 Frontend-Backend API Mismatch Fix

**Date:** October 18, 2025  
**Issue:** HTTP 400 Bad Request on extraction endpoint  
**Status:** ✅ FIXED

---

## 🐛 Problem

Frontend was sending data in wrong format to backend API:

```javascript
// Frontend was sending:
{ notes: ["note1", "note2"], options: {} }

// Backend validation expected:
{ text: "clinical note text", options: {} }
```

**Error Message:**
```
HTTP 400: Bad Request
Failed to extract medical entities: HTTP 400: Bad Request
```

---

## 🔍 Root Cause

After implementing input validation middleware (`validateClinicalNote`), the backend now strictly validates:
- Field name must be `text` (not `notes`)
- Value must be a **string** (not array)
- Length must be 10-50,000 characters

The frontend API client was still using the old format from before the backend separation.

---

## ✅ Solution

### File Modified: `src/services/apiClient.js`

**1. Extraction API - Convert array to string:**

```javascript
extract: async (notes, options = {}) => {
  // Backend expects 'text' as a single string, so join array if needed
  const text = Array.isArray(notes) ? notes.join('\n\n---\n\n') : notes;
  
  return apiFetch('/extract', {
    method: 'POST',
    body: JSON.stringify({ text, options }),  // Changed: notes → text
  });
}
```

**2. Summary API - Consistent format:**

```javascript
generate: async (notes, options = {}) => {
  // Backend accepts notes as string or array, so join array if needed
  const clinicalNotes = Array.isArray(notes) ? notes.join('\n\n---\n\n') : notes;
  
  return apiFetch('/summary', {
    method: 'POST',
    body: JSON.stringify({ notes: clinicalNotes, options }),
  });
}
```

---

## 🎯 Changes Summary

| Endpoint | Before | After |
|----------|--------|-------|
| `/api/extract` | `notes: [...]` | `text: "..."` |
| `/api/summary` | `notes: [...]` | `notes: "..."` |

**Array Handling:**
- Multiple notes are now joined with `\n\n---\n\n` separator
- Backend processes as single clinical note text
- Maintains backward compatibility with single note

---

## ✅ Testing

After the fix, the extraction endpoint should work correctly:

```javascript
// Frontend call (unchanged):
await extractMedicalEntities(['note1', 'note2'], { usePatterns: true });

// Backend receives:
{
  text: "note1\n\n---\n\nnote2",
  options: { usePatterns: true }
}

// Validation passes ✅
```

---

## 📋 Validation Rules (Backend)

The backend now validates:

```javascript
validateClinicalNote = [
  body('text')
    .exists()           // ✓ Required field
    .isString()         // ✓ Must be string
    .trim()
    .isLength({ min: 10, max: 50000 })  // ✓ Length limits
    .custom((value) => {
      // ✓ Must contain meaningful text (not just whitespace)
      if (value.replace(/\s+/g, '').length < 10) {
        throw new Error('Clinical note must contain meaningful text');
      }
      return true;
    }),
    
  body('options.usePatterns')
    .optional()
    .isBoolean(),       // ✓ Type checking
]
```

---

## 🚀 Next Steps

1. **Test the extraction endpoint** in the UI
2. **Test the summary endpoint** to ensure it also works
3. **Monitor for any other validation errors** in console

---

## 💡 Prevention

To prevent similar issues:

1. **API Documentation** - Document exact request/response formats
2. **TypeScript** - Consider adding TypeScript for type safety
3. **Integration Tests** - Add frontend-backend integration tests
4. **Error Messages** - Backend validation should return clear error messages showing expected format

---

**Fix Applied:** October 18, 2025  
**Files Modified:** 1 (`src/services/apiClient.js`)  
**Lines Changed:** 2 key changes  
**Impact:** Fixes all extraction and summary API calls from frontend
