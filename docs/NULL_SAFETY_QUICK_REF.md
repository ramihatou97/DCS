# 🎯 NULL SAFETY QUICK REFERENCE

**Print this and keep it visible while coding!**

---

## ⚡ THE GOLDEN RULE

> **"If it CAN be null/undefined, treat it as if it WILL be null/undefined."**

---

## 🛡️ DEFENSIVE PATTERNS (Copy & Paste Ready)

### ✅ Safe Property Access
```javascript
const value = obj?.property?.subproperty || defaultValue;
```

### ✅ Safe Array Spread
```javascript
const combined = [...(array1 || []), ...(array2 || [])];
```

### ✅ Safe String Operations
```javascript
if (typeof str === 'string') {
  const lower = str.toLowerCase();
}
// Or
const lower = str?.toLowerCase() || '';
```

### ✅ Safe Array Operations
```javascript
const length = array?.length || 0;
const filtered = (array || []).filter(item => item?.property);
```

### ✅ Consistent Return Objects
```javascript
function getData() {
  return {
    data: actualData || null,
    error: errorMessage || null,
    success: !!actualData
  };
}
```

### ✅ Safe Function Calls
```javascript
const result = funcThatMightReturnNull();
if (!result) {
  return fallbackValue;
}
// Now safe to use result
```

---

## ❌ DANGER PATTERNS (Never Do This)

```javascript
❌ result.property              // Missing null check
❌ array.length                 // Array could be undefined  
❌ string.toLowerCase()         // String could be undefined
❌ ...arraySpread               // Could be undefined
❌ return null                  // Inconsistent return type
❌ const x = data.a.b.c         // Multiple crash points
```

---

## 🔍 BEFORE COMMITTING

Ask yourself:
1. Can this return null/undefined? → Add `|| default`
2. Am I accessing properties? → Add `?.`
3. Am I spreading? → Add `|| []`
4. Am I calling methods? → Add type check
5. Do I have a fallback? → Add `|| defaultValue`

---

## 🚨 WHEN YOU SEE THIS ERROR

```
Cannot read properties of null/undefined (reading 'X')
```

**Fix in 3 steps:**
1. Find where the null value comes from
2. Add optional chaining: `?.`
3. Add fallback: `|| defaultValue`

---

**30 seconds of defensive coding = 30 minutes saved debugging! ⏱️**
